import assert from "node:assert/strict"
import { it } from "node:test"
import { parseOwnedRefundRecoveryArgs, runOwnedRefundRecovery } from "../scripts/commerce-resume-owned-refund.mjs"

const instant = Date.parse("2026-11-18T23:40:00Z")
const scope = { refundId: "refund_1", orderId: "order_1", ownerId: "owner_1", backgroundKey: "background_1", amountCents: 107, expiresAt: new Date(instant + 10 * 60_000).toISOString() }

function fixture() {
  const calls = { query: [], reads: 0, writes: [], resumes: 0 }
  const refund = {
    id: scope.refundId, orderId: scope.orderId, status: "PENDING", processedAt: null,
    amountCents: 107, currency: "usd", stripeRefundId: `pending:${scope.refundId}`,
    order: { id: scope.orderId, userId: scope.ownerId, status: "PAID", currency: "usd" },
    payment: { status: "SUCCEEDED", currency: "usd", amountCents: 107, stripePaymentIntentId: "pi_owned1", refunds: [{ id: scope.refundId, status: "PENDING" }], disputes: [] },
    items: [{ quantity: 1, amountCents: 107, orderItem: { productType: "background", productKey: scope.backgroundKey, userId: scope.ownerId, orderId: scope.orderId, quantity: 1, currency: "usd", lineTotalCents: 107, ownership: { source: "PURCHASE", status: "REFUND_PENDING" } } }],
  }
  const intent = { id: "pi_owned1", livemode: true, status: "succeeded", currency: "usd", amount: 107, amount_received: 107, metadata: { purpose: "background_purchase", orderId: scope.orderId, userId: scope.ownerId } }
  const processorRequest = { paymentIntentId: intent.id, amountCents: 107, currency: "usd", idempotencyKey: `background-refund:${scope.refundId}`, metadata: { orderId: scope.orderId, refundId: scope.refundId } }
  const existing = { data: [], has_more: false }
  const prismaClient = { commerceRefund: { findFirst: async (query) => { calls.query.push(query); return structuredClone(refund) } } }
  const stripeClient = {
    paymentIntents: { retrieve: async (id) => { assert.equal(id, intent.id); calls.reads += 1; return structuredClone(intent) } },
    refunds: {
      list: async (query) => { assert.deepEqual(query, { payment_intent: intent.id, limit: 2 }); calls.reads += 1; return structuredClone(existing) },
      create: async (...args) => { calls.writes.push(args); return { id: "re_owned1" } },
    },
  }
  const resumeRefund = async (input) => {
    calls.resumes += 1
    assert.equal(input.refundId, scope.refundId)
    await input.createProcessorRefund(processorRequest)
    return { status: "PENDING", changed: true, reconciliationRequired: false }
  }
  return { calls, refund, intent, existing, processorRequest, options: { prismaClient, stripeClient, resumeRefund, scope: { ...scope }, now: () => instant } }
}

it("defaults to an owner-and-order-filtered read with no financial write", async () => {
  const f = fixture()
  const result = await runOwnedRefundRecovery(f.options)
  assert.deepEqual(f.calls.query[0].where, { id: scope.refundId, orderId: scope.orderId, order: { userId: scope.ownerId } })
  assert.equal(f.calls.resumes, 0)
  assert.equal(f.calls.writes.length, 0)
  assert.deepEqual(result, { mode: "read-only", eligible: true, amountCents: 107, processorWrites: 0 })
  assert.doesNotMatch(JSON.stringify(result), /owner_|order_|refund_|pi_|metadata|secret/i)
})

it("resumes only the existing refund and preserves its original metadata and idempotency key", async () => {
  const f = fixture()
  const result = await runOwnedRefundRecovery({ ...f.options, execute: true })
  assert.equal(f.calls.resumes, 1)
  assert.deepEqual(f.calls.writes, [[{ payment_intent: "pi_owned1", amount: 107, metadata: { orderId: scope.orderId, refundId: scope.refundId } }, { idempotencyKey: `background-refund:${scope.refundId}`, maxNetworkRetries: 0, timeout: 20_000 }]])
  assert.equal(result.processorSubmissionConfirmed, true)
  assert.equal(result.webhookReadbackRequired, true)
})

for (const [label, mutate] of [
  ["another owner", (f) => { f.refund.order.userId = "another_owner" }],
  ["another order", (f) => { f.refund.orderId = "another_order" }],
  ["another amount", (f) => { f.refund.amountCents = 108 }],
  ["an already linked refund", (f) => { f.refund.stripeRefundId = "re_existing" }],
  ["an already processed refund", (f) => { f.refund.processedAt = new Date(instant) }],
  ["a different item", (f) => { f.refund.items[0].orderItem.productKey = "another_background" }],
  ["more than one item", (f) => { f.refund.items.push(structuredClone(f.refund.items[0])) }],
  ["non-purchase ownership", (f) => { f.refund.items[0].orderItem.ownership.source = "CREDIT" }],
  ["unsuspended ownership", (f) => { f.refund.items[0].orderItem.ownership.status = "ACTIVE" }],
  ["another pending refund", (f) => { f.refund.payment.refunds.push({ id: "refund_other", status: "PENDING" }) }],
  ["a dispute", (f) => { f.refund.payment.disputes.push({ status: "OPEN" }) }],
  ["a processor owner mismatch", (f) => { f.intent.metadata.userId = "another_owner" }],
  ["a test-mode payment", (f) => { f.intent.livemode = false }],
  ["an existing processor refund", (f) => { f.existing.data.push({ id: "re_existing" }) }],
  ["a truncated processor response", (f) => { f.existing.has_more = true }],
]) {
  it(`stops before a financial write for ${label}`, async () => {
    const f = fixture()
    mutate(f)
    await assert.rejects(runOwnedRefundRecovery({ ...f.options, execute: true }))
    assert.equal(f.calls.resumes, 0)
    assert.equal(f.calls.writes.length, 0)
  })
}

it("rechecks the deadline immediately before the processor write", async () => {
  const f = fixture()
  let checks = 0
  await assert.rejects(runOwnedRefundRecovery({ ...f.options, execute: true, now: () => ++checks === 1 ? instant : instant + 30 * 60_000 }))
  assert.equal(f.calls.writes.length, 0)
})

it("freezes the approved scope across asynchronous reads", async () => {
  const f = fixture()
  f.options.stripeClient.refunds.list = async () => {
    f.options.scope.amountCents = 200
    return { data: [], has_more: false }
  }
  const result = await runOwnedRefundRecovery({ ...f.options, execute: true })
  assert.equal(f.calls.writes[0][0].amount, 107)
  assert.equal(result.amountCents, 107)
})

it("rejects changed processor arguments and prevents a second submission", async () => {
  const f = fixture()
  f.options.resumeRefund = async ({ createProcessorRefund }) => {
    await assert.rejects(createProcessorRefund({ ...f.processorRequest, amountCents: 108 }))
    await createProcessorRefund(f.processorRequest)
    await assert.rejects(createProcessorRefund(f.processorRequest))
    return { status: "PENDING", changed: true }
  }
  await runOwnedRefundRecovery({ ...f.options, execute: true })
  assert.equal(f.calls.writes.length, 1)
})

it("retains an unresolved result without claiming success or retrying", async () => {
  const f = fixture()
  f.options.resumeRefund = async () => ({ status: "PENDING", reconciliationRequired: true })
  const result = await runOwnedRefundRecovery({ ...f.options, execute: true })
  assert.equal(result.processorSubmissionConfirmed, false)
  assert.equal(result.reconciliationRequired, true)
  assert.equal(f.calls.writes.length, 0)
})

it("rejects expired, over-cap and incomplete scopes before reading the database", async () => {
  for (const changed of [{ amountCents: 201 }, { amountCents: -1 }, { expiresAt: new Date(instant).toISOString() }, { expiresAt: new Date(instant + 21 * 60_000).toISOString() }, { ownerId: "" }]) {
    const f = fixture()
    await assert.rejects(runOwnedRefundRecovery({ ...f.options, scope: { ...scope, ...changed } }))
    assert.equal(f.calls.query.length, 0)
  }
})

it("parses only complete explicit CLI scopes and never enables execution by default", () => {
  const args = ["--refund-id", scope.refundId, "--order-id", scope.orderId, "--owner-id", scope.ownerId, "--background-key", scope.backgroundKey, "--amount-cents", "107", "--expires-at", scope.expiresAt]
  assert.deepEqual(parseOwnedRefundRecoveryArgs(args, instant), { scope, execute: false })
  assert.equal(parseOwnedRefundRecoveryArgs([...args, "--execute"], instant).execute, true)
  assert.throws(() => parseOwnedRefundRecoveryArgs([...args, "--repair"], instant))
  assert.throws(() => parseOwnedRefundRecoveryArgs([...args, "--execute", "--execute"], instant))
  assert.throws(() => parseOwnedRefundRecoveryArgs(args.slice(2), instant))
  assert.throws(() => parseOwnedRefundRecoveryArgs([...args, "--owner-id", "another_owner"], instant))
})
