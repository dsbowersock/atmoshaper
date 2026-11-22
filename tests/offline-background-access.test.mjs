import test from "node:test"
import assert from "node:assert/strict"
import { generateKeyPairSync } from "node:crypto"
import { signOfflineBackgroundReceipt } from "../lib/server/offline-background-receipt.ts"
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
