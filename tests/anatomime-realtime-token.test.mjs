import assert from "node:assert/strict"
import crypto from "node:crypto"
import { readFile } from "node:fs/promises"
import { describe, it } from "node:test"
import vm from "node:vm"
import { compileCommonJsModule, createCompiledModuleLoader } from "./helpers/compiled-module.mjs"

const signerSource = await readFile(new URL("../lib/anatomime-realtime.ts", import.meta.url), "utf8")
const authSource = await readFile(new URL("../app/anatomime/anatomime-realtime-auth.ts", import.meta.url), "utf8")
const loadCompiledModule = createCompiledModuleLoader(import.meta.url)
const KEY_NAME = "invented-app.invented-key"
const KEY_SECRET = "invented-secret-for-local-contract-tests"
const KEY = KEY_NAME + ":" + KEY_SECRET

/** Runs the production signer with a private invented environment and no possible network transport. */
function signerFixture(apiKey = KEY) {
  const compiledModule = { exports: {} }
  vm.runInNewContext(compileCommonJsModule(signerSource, "anatomime-realtime.ts"), {
    module: compiledModule,
    exports: compiledModule.exports,
    require: (name) => {
      assert.equal(name, "node:crypto")
      return crypto
    },
    process: { env: { ABLY_API_KEY: apiKey } },
    Buffer,
    TextEncoder,
    AbortController,
    setTimeout,
    clearTimeout,
    fetch: () => assert.fail("Token signing must never contact a provider"),
  })
  return compiledModule.exports
}

/**
 * Independent verifier of Ably's public token-request specification:
 * lexically sorted capabilities and UTF-8 HMAC input ending EVERY field with LF.
 * The verifier deliberately uses createHmac rather than the signer's WebCrypto implementation.
 */
function expectedMac(grant) {
  const inputCapability = JSON.parse(grant.capability)
  const capability = JSON.stringify(Object.fromEntries(Object.keys(inputCapability).sort().map((channel) => [
    channel,
    [...inputCapability[channel]].sort(),
  ])))
  const fields = [grant.keyName, grant.ttl, capability, grant.clientId ?? "", grant.timestamp, grant.nonce]
  const text = fields.map((value) => String(value) + "\n").join("")
  return crypto.createHmac("sha256", KEY_SECRET).update(text, "utf8").digest("base64")
}

describe("Anatomime Ably TokenRequest interoperability", () => {
  it("emits only canonical room-scoped presence/subscribe permissions in lexicographic order", async () => {
    const grant = await signerFixture().createAnatomimeRealtimeTokenRequest(" ab12cd ", "invented-player")
    assert.equal(grant.capability, '{"anatomime:AB12CD":["presence","subscribe"]}')
    assert.equal(grant.keyName, KEY_NAME)
    assert.equal(grant.ttl, 3_600_000)
    assert.equal(grant.clientId, "invented-player")
    assert.doesNotMatch(JSON.stringify(grant), /invented-secret-for-local-contract-tests/)
  })

  for (const clientId of ["invented-player", "", "invented-therapist-é"]) {
    it("signs the canonical six LF-terminated fields for " + (clientId || "an empty client ID"), async () => {
      const grant = await signerFixture().createAnatomimeRealtimeTokenRequest("abc123", clientId)
      assert.equal(grant.mac, expectedMac(grant))
      // Either historical defect is detected even if the other has already been corrected.
      const fields = [grant.keyName, grant.ttl, grant.capability, grant.clientId, grant.timestamp, grant.nonce]
      const noFinalLf = crypto.createHmac("sha256", KEY_SECRET).update(fields.join("\n")).digest("base64")
      assert.notEqual(grant.mac, noFinalLf)
      const reversedCapability = JSON.stringify({ "anatomime:ABC123": ["subscribe", "presence"] })
      const nonCanonical = crypto.createHmac("sha256", KEY_SECRET)
        .update([grant.keyName, grant.ttl, reversedCapability, grant.clientId, grant.timestamp, grant.nonce, ""].join("\n"))
        .digest("base64")
      assert.notEqual(grant.mac, nonCanonical)
    })
  }

  it("issues fresh nonce/timestamp-bound grants without a provider request", async () => {
    const signer = signerFixture()
    const before = Date.now()
    const first = await signer.createAnatomimeRealtimeTokenRequest("ABC123", "invented-player")
    const second = await signer.createAnatomimeRealtimeTokenRequest("ABC123", "invented-player")
    assert.ok(first.timestamp >= before && first.timestamp <= Date.now())
    assert.match(first.nonce, /^[a-f0-9]{32}$/)
    assert.notEqual(first.nonce, second.nonce)
    assert.notEqual(first.mac, second.mac)
  })

  it("keeps malformed or absent configuration unavailable without accessing any real environment", async () => {
    for (const key of ["", "missing-separator", "missing-secret:", ":missing-name"]) {
      const signer = signerFixture(key)
      assert.equal(signer.isAnatomimeRealtimeConfigured(), false)
      assert.equal(await signer.createAnatomimeRealtimeTokenRequest("ABC123", "invented-player"), null)
    }
  })

  it("passes verifiable setup and renewal grants through the actual browser auth callback", async () => {
    const signer = signerFixture()
    const initial = await signer.createAnatomimeRealtimeTokenRequest("ABC123", "invented-player")
    let requests = 0
    const { createAnatomimeRealtimeAuthCallback } = loadCompiledModule(authSource, "anatomime-realtime-auth.ts", {
      "../../lib/client-fetch.ts": {
        fetchJsonWithTimeout: async (url, init) => {
          requests += 1
          assert.equal(url, "/api/anatomime/sessions/ABC123/realtime-token")
          assert.deepEqual(init.headers, {
            "x-anatomime-player-id": "invented-player",
            "x-anatomime-player-token": "invented-room-pass",
          })
          return {
            response: { ok: true },
            json: await signer.createAnatomimeRealtimeTokenRequest("ABC123", "invented-player"),
          }
        },
      },
      "./anatomime-polling": { ANATOMIME_REALTIME_SETUP_TIMEOUT_MS: 8_000 },
    })
    const callback = createAnatomimeRealtimeAuthCallback({
      code: "ABC123",
      playerId: "invented-player",
      playerToken: "invented-room-pass",
      initialTokenRequest: initial,
      signal: new AbortController().signal,
    })
    const authorize = () => new Promise((resolve, reject) => callback(
      { clientId: "foreign-player", capability: { "*": ["publish"] } },
      (error, grant) => error ? reject(error) : resolve(grant),
    ))
    const setup = await authorize()
    assert.equal(setup.mac, expectedMac(setup))
    assert.equal(requests, 0)
    const renewal = await authorize()
    assert.equal(renewal.mac, expectedMac(renewal))
    assert.notEqual(setup.nonce, renewal.nonce)
    assert.equal(renewal.capability, '{"anatomime:ABC123":["presence","subscribe"]}')
    assert.equal(renewal.clientId, "invented-player")
    assert.equal(requests, 1)
  })
})
