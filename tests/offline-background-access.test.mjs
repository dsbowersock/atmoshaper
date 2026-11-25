import test from "node:test"
import assert from "node:assert/strict"
import { generateKeyPairSync } from "node:crypto"
import { signOfflineBackgroundReceipt, createOfflineBackgroundAccessHandler } from "../lib/server/offline-background-receipt.ts"
import { offlinePremiumUntil, offlineBackgroundSnapshot, verifyOfflineAccessReceipt, randomOfflineAccessId } from "../lib/offline-background-access.js"

const now = Date.UTC(2026, 10, 22)
const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" })
const environment = { ATMOSHAPER_OFFLINE_ACCESS_ENABLED: "true", ATMOSHAPER_OFFLINE_ACCESS_KEY_ID: "synthetic-test",
  ATMOSHAPER_OFFLINE_ACCESS_PRIVATE_KEY: privateKey.export({ type: "pkcs8", format: "pem" }) }
const keys = [{ id: "synthetic-test", jwk: publicKey.export({ format: "jwk" }) }]
const device = randomOfflineAccessId(), challenge = randomOfflineAccessId()
const input = { device, challenge, userId: "fictional-user", now, premiumUntil: now + 1000, owned: ["massage-lab-aurora"] }

test("signed capabilities are install-bound and contain no account credential", async () => {
  const receipt = signOfflineBackgroundReceipt(input, environment)
  const claims = await verifyOfflineAccessReceipt(receipt, device, keys)
  assert.equal(claims.challenge, challenge)
  assert.equal(claims.issuedAt, now)
  assert.doesNotMatch(JSON.stringify(claims), /fictional-user|password|email|stripe/)
  await assert.rejects(verifyOfflineAccessReceipt(receipt, randomOfflineAccessId(), keys), /another app/)
  await assert.rejects(verifyOfflineAccessReceipt(receipt, device, []), /updating/)
})

test("forged payloads, algorithms, signatures and malformed claims fail closed", async () => {
  const receipt = signOfflineBackgroundReceipt(input, environment), parts = receipt.split(".")
  const forged = [...parts]; forged[1] = Buffer.from(JSON.stringify({ owned: ["massage-lab-dna"] })).toString("base64url")
  await assert.rejects(verifyOfflineAccessReceipt(forged.join("."), device, keys), /signature/)
  const algorithm = [...parts]; algorithm[0] = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url")
  await assert.rejects(verifyOfflineAccessReceipt(algorithm.join("."), device, keys), /signature/)
  await assert.rejects(verifyOfflineAccessReceipt("x".repeat(25000), device, keys))
  assert.throws(() => signOfflineBackgroundReceipt({ ...input, owned: ["../invented"] }, environment))
  assert.throws(() => signOfflineBackgroundReceipt(input, {}), /not enabled/)
})

test("verified expiry is half-open; ownership survives expiry but not replacement", async () => {
  const claims = await verifyOfflineAccessReceipt(signOfflineBackgroundReceipt(input, environment), device, keys)
  assert.deepEqual(offlineBackgroundSnapshot(claims, now + 999).featureKeys, ["premium_backgrounds"])
  assert.deepEqual(offlineBackgroundSnapshot(claims, now + 1000).featureKeys, [])
  assert.deepEqual(offlineBackgroundSnapshot(claims, now + 5000).ownedBackgroundIds, input.owned)
  assert.deepEqual(offlineBackgroundSnapshot(claims, now + 500, now + 100000).featureKeys, [])
  const refreshed = await verifyOfflineAccessReceipt(signOfflineBackgroundReceipt({ ...input, premiumUntil: null, owned: [] }, environment), device, keys)
  assert.deepEqual(offlineBackgroundSnapshot(refreshed, now + 500), { featureKeys: [], ownedBackgroundIds: [] })
})

test("monthly and annual leases use real paid-through evidence, missing expiry denies", () => {
  const source = sources => [{ featureKey: "premium_backgrounds", sources }]
  const monthEnd = now + 10 * 86400000, yearEnd = now + 300 * 86400000
  assert.equal(offlinePremiumUntil(source([{ source: "membership", expiresAt: new Date(monthEnd).toISOString() }]), now), monthEnd)
  assert.equal(offlinePremiumUntil(source([{ source: "membership", expiresAt: new Date(yearEnd).toISOString() }]), now), yearEnd)
  for (const expiresAt of [null, "invalid", new Date(now).toISOString()]) assert.equal(offlinePremiumUntil(source([{ source: "membership", expiresAt }]), now), null)
  assert.equal(offlinePremiumUntil(source([{ source: "temporary", expiresAt: new Date(monthEnd).toISOString() }]), now), monthEnd)
  assert.equal(offlinePremiumUntil([{ featureKey: "made_up_plan", sources: [{ source: "membership", expiresAt: new Date(yearEnd).toISOString() }] }], now), null)
})

test("the issuer binds the session owner and ignores caller-supplied account/payment grants", async () => {
  const reads = []
  const handler = createOfflineBackgroundAccessHandler({ environment, getUserId: async () => "actual-synthetic-owner",
    async loadAccess(userId) { reads.push(userId); return { featureAccess: [], owned: [] } } })
  const request = new Request("https://www.atmoshaper.com/api/account/offline-background-access", { method: "POST", headers: { Origin: "https://www.atmoshaper.com" }, body: JSON.stringify({ device, challenge, userId: "other-owner", premiumUntil: now + 999999, owned: input.owned }) })
  const response = await handler(request)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get("cache-control"), "private, no-store")
  const claims = await verifyOfflineAccessReceipt((await response.json()).receipt, device, keys)
  assert.deepEqual(reads, ["actual-synthetic-owner"])
  assert.equal(claims.premiumUntil, null); assert.deepEqual(claims.owned, [])
})

test("cross-origin, anonymous, oversized, malformed and unconfigured requests cannot query/sign access", async () => {
  let reads = 0
  const deps = { environment, getUserId: async () => "owner", async loadAccess() { reads++; throw new Error("must not read") } }
  const request = (body, origin = "https://www.atmoshaper.com", method = "POST") => new Request("https://www.atmoshaper.com/api/account/offline-background-access", { method, headers: { Origin: origin }, ...(method === "POST" ? { body } : {}) })
  const valid = JSON.stringify({ device, challenge })
  assert.equal((await createOfflineBackgroundAccessHandler(deps)(request(valid, "https://attacker.invalid"))).status, 403)
  assert.equal((await createOfflineBackgroundAccessHandler({ ...deps, getUserId: async () => null })(request(valid))).status, 401)
  assert.equal((await createOfflineBackgroundAccessHandler(deps)(request("x".repeat(2048)))).status, 400)
  assert.equal((await createOfflineBackgroundAccessHandler(deps)(request("not json"))).status, 400)
  assert.equal((await createOfflineBackgroundAccessHandler(deps)(request(valid, undefined, "GET"))).status, 405)
  assert.equal((await createOfflineBackgroundAccessHandler({ ...deps, environment: {} })(request(valid))).status, 503)
  assert.equal(reads, 0)
})

test("the native projection exposes only eligible catalog ownership and the signed term", async () => {
  const { projectOfflineBackgroundAccess } = await import("../lib/offline-background-access.js")
  const recognize = new Set(["massage-lab-aurora"])
  const signed = signOfflineBackgroundReceipt({ ...input, owned: [...input.owned, "disabled-effect"] }, environment)
  const record = { receipt: signed, device, lastSeen: now, lastIssuedAt: now }
  assert.deepEqual(await projectOfflineBackgroundAccess(record, keys, recognize, now + 999), {
    status: "verified", paidThrough: now + 1000, clockValidAfter: now - 60000,
    ownedIds: ["massage-lab-aurora"],
  })
  assert.deepEqual(await projectOfflineBackgroundAccess(record, keys, recognize, now + 1000), {
    status: "expired", paidThrough: now + 1000, clockValidAfter: now - 60000,
    ownedIds: ["massage-lab-aurora"],
  })
})

test("a receipt replaced or removed during verification cannot reach the native Clock", async () => {
  const { readProjectedOfflineBackgroundAccess } = await import("../lib/offline-background-access.js")
  const receipt = signOfflineBackgroundReceipt(input, environment)
  const original = { receipt, device, lastSeen: now, lastIssuedAt: now }
  for (const current of [undefined, { ...original, receipt: null }, { ...original, receipt: "replacement" }]) {
    const records = [original, current]
    assert.deepEqual(await readProjectedOfflineBackgroundAccess(async () => records.shift(), keys, new Set(input.owned), now), {
      status: "unavailable", paidThrough: null, clockValidAfter: null, ownedIds: [],
    })
  }
})

test("owned-only and empty signed grants remain distinguishable from invalid and unavailable access", async () => {
  const { readProjectedOfflineBackgroundAccess } = await import("../lib/offline-background-access.js")
  const catalog = new Set(input.owned)
  const makeRecord = (claims, storedDevice = device) => ({
    receipt: signOfflineBackgroundReceipt({ ...input, ...claims }, environment),
    device: storedDevice, lastSeen: now, lastIssuedAt: now,
  })
  const owned = makeRecord({ premiumUntil: null })
  const empty = makeRecord({ premiumUntil: null, owned: [] })
  const invalid = makeRecord({ premiumUntil: null }, randomOfflineAccessId())
  const outcomes = await Promise.all([
    readProjectedOfflineBackgroundAccess(async () => owned, keys, catalog, now + 400 * 86400000),
    readProjectedOfflineBackgroundAccess(async () => empty, keys, catalog, now),
    readProjectedOfflineBackgroundAccess(async () => invalid, keys, catalog, now),
    readProjectedOfflineBackgroundAccess(async () => undefined, keys, catalog, now),
    readProjectedOfflineBackgroundAccess(async () => { throw new Error("Fixture storage unavailable") }, keys, catalog, now),
  ])
  assert.deepEqual(outcomes.map(value => [value.status, value.ownedIds]), [
    ["verified", input.owned], ["no-grant", []], ["invalid", []], ["missing", []], ["unavailable", []],
  ])
})
