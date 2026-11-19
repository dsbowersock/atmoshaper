import { fileURLToPath } from "node:url"
import { resolve } from "node:path"
import { resumePendingBackgroundRefund } from "../lib/commerce/reversal-service.ts"
import { getStripeClient } from "../lib/stripe-billing.js"

const WINDOW_MS = 20 * 60 * 1000
const MAX_AMOUNT_CENTS = 200
const IDENTIFIER = /^[A-Za-z0-9_-]{1,80}$/

class RecoveryStopped extends Error {
  constructor(code) {
    super(code)
    this.code = code
  }
}

function requireCondition(condition, code) {
  if (!condition) throw new RecoveryStopped(code)
}

/** The operator supplies a fresh finite scope; this tool never loads dotenv files. */
function validateScope(scope, now) {
  for (const key of ["refundId", "orderId", "ownerId", "backgroundKey"]) {
    requireCondition(typeof scope?.[key] === "string" && IDENTIFIER.test(scope[key]), "INVALID_SCOPE")
  }
  requireCondition(Number.isInteger(scope.amountCents) && scope.amountCents > 0 && scope.amountCents <= MAX_AMOUNT_CENTS, "INVALID_AMOUNT")
  const deadline = Date.parse(scope.expiresAt)
  requireCondition(Number.isFinite(deadline) && deadline > now && deadline <= now + WINDOW_MS, "EXPIRED_OR_UNBOUNDED_SCOPE")
}

/** Rejects partial scopes and unknown flags before the database client is imported. */
export function parseOwnedRefundRecoveryArgs(args, now = Date.now()) {
  const fields = new Map([
    ["--refund-id", "refundId"], ["--order-id", "orderId"], ["--owner-id", "ownerId"],
    ["--background-key", "backgroundKey"], ["--amount-cents", "amountCents"], ["--expires-at", "expiresAt"],
  ])
  const scope = {}
  let execute = false
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]
    if (argument === "--execute") {
      requireCondition(!execute, "DUPLICATE_ARGUMENT")
      execute = true
      continue
    }
    const field = fields.get(argument)
    requireCondition(Boolean(field) && !(field in scope), "UNKNOWN_OR_DUPLICATE_ARGUMENT")
    const value = args[++index]
    requireCondition(typeof value === "string" && !value.startsWith("--"), "MISSING_ARGUMENT")
    scope[field] = field === "amountCents" && /^\d+$/.test(value) ? Number(value) : value
  }
  validateScope(scope, now)
  return { scope, execute }
}

/**
 * Reads one owner/order-bound pending refund, then optionally resumes that same
 * record with its original idempotency key. No batch scan or replacement refund
 * is possible; a changed amount, existing processor refund or expired scope stops.
 */
export async function runOwnedRefundRecovery({
  prismaClient, scope, execute = false, stripeClient, now = Date.now,
  resumeRefund = resumePendingBackgroundRefund,
}) {
  // Keep the reviewed target stable across database/processor awaits.
  scope = Object.freeze({ ...scope })
  validateScope(scope, now())
  const refund = await prismaClient.commerceRefund.findFirst({
    where: { id: scope.refundId, orderId: scope.orderId, order: { userId: scope.ownerId } },
    include: {
      order: true,
      payment: { include: { refunds: true, disputes: true } },
      items: { include: { orderItem: { include: { ownership: true } } } },
    },
  })
  requireCondition(refund?.id === scope.refundId && refund.orderId === scope.orderId
    && refund.order?.id === scope.orderId && refund.order.userId === scope.ownerId
    && refund.order.status === "PAID" && refund.order.currency === "usd"
    && refund.status === "PENDING" && !refund.processedAt
    && refund.stripeRefundId === `pending:${scope.refundId}`
    && refund.currency === "usd" && refund.amountCents === scope.amountCents, "LOCAL_REFUND_MISMATCH")
  const payment = refund.payment
  requireCondition(payment?.status === "SUCCEEDED" && payment.currency === "usd"
    && payment.amountCents === scope.amountCents && /^pi_[A-Za-z0-9]+$/.test(payment.stripePaymentIntentId)
    && !payment.disputes?.length
    && !payment.refunds?.some((entry) => entry.id !== scope.refundId && ["PENDING", "SUCCEEDED"].includes(entry.status)), "LOCAL_PAYMENT_MISMATCH")
  const item = refund.items?.[0]
  const purchased = item?.orderItem
  requireCondition(refund.items?.length === 1 && item.quantity === 1 && item.amountCents === scope.amountCents
    && purchased?.productType === "background" && purchased.productKey === scope.backgroundKey
    && purchased.userId === scope.ownerId && purchased.orderId === scope.orderId
    && purchased.quantity === 1 && purchased.currency === "usd" && purchased.lineTotalCents === scope.amountCents
    && purchased.ownership?.source === "PURCHASE" && purchased.ownership.status === "REFUND_PENDING", "LOCAL_ITEM_MISMATCH")

  const stripe = stripeClient ?? getStripeClient()
  const intent = await stripe.paymentIntents.retrieve(payment.stripePaymentIntentId)
  requireCondition(intent.id === payment.stripePaymentIntentId && intent.livemode === true
    && intent.status === "succeeded" && intent.currency === "usd"
    && intent.amount === scope.amountCents && intent.amount_received === scope.amountCents
    && intent.metadata?.purpose === "background_purchase"
    && intent.metadata.orderId === scope.orderId && intent.metadata.userId === scope.ownerId, "PROCESSOR_PAYMENT_MISMATCH")
  const existing = await stripe.refunds.list({ payment_intent: intent.id, limit: 2 })
  requireCondition(Array.isArray(existing.data) && existing.data.length === 0 && existing.has_more === false, "PROCESSOR_REFUND_ALREADY_PRESENT_OR_UNKNOWN")
  if (!execute) return { mode: "read-only", eligible: true, amountCents: scope.amountCents, processorWrites: 0 }

  let processorWrites = 0
  const result = await resumeRefund({
    prismaClient,
    refundId: scope.refundId,
    createProcessorRefund: async (request) => {
      validateScope(scope, now())
      requireCondition(processorWrites === 0 && request.paymentIntentId === intent.id
        && request.amountCents === scope.amountCents && request.currency === "usd"
        && request.idempotencyKey === `background-refund:${scope.refundId}`
        && request.metadata?.orderId === scope.orderId && request.metadata.refundId === scope.refundId, "PROCESSOR_REQUEST_MISMATCH")
      processorWrites += 1
      return stripe.refunds.create({
        payment_intent: request.paymentIntentId, amount: request.amountCents, metadata: request.metadata,
      }, { idempotencyKey: request.idempotencyKey, maxNetworkRetries: 0, timeout: 20_000 })
    },
  })
  return {
    mode: "execute", amountCents: scope.amountCents, processorWrites,
    status: result.status, reconciliationRequired: Boolean(result.reconciliationRequired),
    processorSubmissionConfirmed: processorWrites === 1 && !result.reconciliationRequired,
    webhookReadbackRequired: true,
  }
}

async function main() {
  const options = parseOwnedRefundRecoveryArgs(process.argv.slice(2))
  const { prisma } = await import("../lib/prisma.ts")
  try {
    const result = await runOwnedRefundRecovery({ prismaClient: prisma, ...options })
    process.stdout.write(`${JSON.stringify(result)}\n`)
    if (result.reconciliationRequired) process.exitCode = 2
  } finally {
    await prisma.$disconnect()
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error) => {
    // Never echo provider payloads, connection strings or credentials on failure.
    process.stderr.write(`${JSON.stringify({ stopped: true, code: error instanceof RecoveryStopped ? error.code : "RECOVERY_OUTCOME_REQUIRES_INSPECTION", automaticRetry: false })}\n`)
    process.exitCode = 1
  })
}
