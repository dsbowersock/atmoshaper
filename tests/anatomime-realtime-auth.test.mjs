import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { describe, it } from "node:test"
import { fetchJsonWithTimeout } from "../lib/client-fetch.ts"
import { ANATOMIME_REALTIME_SETUP_TIMEOUT_MS } from "../app/anatomime/anatomime-polling.ts"
import { createCompiledModuleLoader } from "./helpers/compiled-module.mjs"

const authSource = await readFile(new URL("../app/anatomime/anatomime-realtime-auth.ts", import.meta.url), "utf8")
const loadCompiledModule = createCompiledModuleLoader(import.meta.url)

/** Executes the real auth callback and deadline helper with only transport replaced. */
function callbackFixture(fetchImpl, { controller = new AbortController(), initialTokenRequest = { nonce: "initial" } } = {}) {
  const { createAnatomimeRealtimeAuthCallback } = loadCompiledModule(authSource, "anatomime-realtime-auth.ts", {
    "../../lib/client-fetch.ts": {
      fetchJsonWithTimeout: (input, init, timeoutMs) => {
        assert.equal(timeoutMs, ANATOMIME_REALTIME_SETUP_TIMEOUT_MS)
        return fetchJsonWithTimeout(input, init, timeoutMs, fetchImpl)
      },
    },
    "./anatomime-polling": { ANATOMIME_REALTIME_SETUP_TIMEOUT_MS },
  })
  return {
    controller,
    authenticate: createAnatomimeRealtimeAuthCallback({
      code: "ROOM/1",
      playerId: "invented-player",
      playerToken: "invented-player-token",
      initialTokenRequest,
      signal: controller.signal,
    }),
  }
}

/** Adapts the actual SDK-style completion callback to a promise while preserving its error and grant outcome. */
function authorize(authenticate, tokenParams = {}) {
  return new Promise((resolve) => authenticate(tokenParams, (error, tokenRequest) => {
    resolve({ error, tokenRequest })
  }))
}

/** Supplies an invented successful token response whose nonce distinguishes setup from fresh renewal grants. */
function tokenResponse(nonce) {
  return new Response(JSON.stringify({ nonce }), { status: 200, headers: { "content-type": "application/json" } })
}

describe("Anatomime realtime authentication renewal", () => {
  it("consumes the setup request once, then revalidates room credentials for every fresh grant", async () => {
    const calls = []
    const { authenticate } = callbackFixture(async (input, init) => {
      calls.push({ input, init })
      return tokenResponse(`fresh-${calls.length}`)
    })
    assert.deepEqual(await authorize(authenticate), { error: null, tokenRequest: { nonce: "initial" } })
    assert.equal(calls.length, 0)
    assert.deepEqual(await authorize(authenticate, { capability: { "*": ["publish"] }, clientId: "other-player" }), {
      error: null, tokenRequest: { nonce: "fresh-1" },
    })
    assert.deepEqual(await authorize(authenticate), { error: null, tokenRequest: { nonce: "fresh-2" } })
    assert.equal(calls.length, 2)
    for (const { input, init } of calls) {
      assert.equal(input, "/api/anatomime/sessions/ROOM%2F1/realtime-token")
      assert.equal(init.method, "POST")
      assert.deepEqual(init.headers, {
        "x-anatomime-player-id": "invented-player",
        "x-anatomime-player-token": "invented-player-token",
      })
      assert.equal(init.body, undefined)
      assert.equal(init.signal.aborted, false)
    }
  })

  it("does not issue or reuse any grant after its owning effect is cancelled", async () => {
    const { authenticate, controller } = callbackFixture(() => assert.fail("Cancelled owner must not request another grant"))
    controller.abort(new DOMException("Owner left", "AbortError"))
    const result = await authorize(authenticate)
    assert.match(result.error, /cancelled/)
    assert.equal(result.tokenRequest, undefined)
  })

  it("cancels in-flight renewal and rejects a late success even if transport ignores cancellation", async () => {
    let deliver
    let requestSignal
    const { authenticate, controller } = callbackFixture((_input, init) => {
      requestSignal = init.signal
      return new Promise((resolve) => { deliver = resolve })
    })
    await authorize(authenticate)
    const renewal = authorize(authenticate)
    controller.abort(new DOMException("Owner left", "AbortError"))
    assert.equal(requestSignal.aborted, true)
    deliver(tokenResponse("late-grant"))
    const result = await renewal
    assert.match(result.error, /unavailable/)
    assert.equal(result.tokenRequest, undefined)
  })

  for (const status of [401, 403, 429, 503]) {
    it(`returns an SDK error for ${status} without consuming a provider/credential-bearing error body`, async () => {
      const { authenticate } = callbackFixture(async () => ({
        ok: false,
        status,
        json: () => assert.fail("An error response must not be returned as an SDK grant"),
      }))
      await authorize(authenticate)
      const result = await authorize(authenticate)
      assert.match(result.error, /unavailable/)
      assert.equal(result.tokenRequest, undefined)
    })
  }

  it("sanitizes transport/JSON errors and can obtain a fresh grant after a transient failure", async () => {
    let requests = 0
    const { authenticate } = callbackFixture(async () => {
      requests += 1
      if (requests === 1) throw new Error("private-sentinel-token-transport")
      if (requests === 2) return new Response("private-sentinel-invalid-json", { status: 200 })
      return tokenResponse("recovered")
    })
    await authorize(authenticate)
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const result = await authorize(authenticate)
      assert.match(result.error, /unavailable/)
      assert.doesNotMatch(result.error, /private-sentinel/)
      assert.equal(result.tokenRequest, undefined)
    }
    assert.deepEqual(await authorize(authenticate), { error: null, tokenRequest: { nonce: "recovered" } })
  })

  for (const stalledAt of ["transport", "JSON consumption"]) {
    it(`keeps ${stalledAt} bounded by the real renewal deadline without aborting the owner`, async (context) => {
      context.mock.timers.enable({ apis: ["setTimeout"] })
      let requestSignal
      let consuming = false
      const { authenticate, controller } = callbackFixture((_input, init) => {
        requestSignal = init.signal
        const waitForAbort = () => new Promise((_resolve, reject) => {
          consuming = true
          init.signal.addEventListener("abort", () => reject(init.signal.reason), { once: true })
        })
        return stalledAt === "transport" ? waitForAbort() : { ok: true, json: waitForAbort }
      })
      await authorize(authenticate)
      const renewal = authorize(authenticate)
      await Promise.resolve()
      assert.equal(consuming, true)
      context.mock.timers.tick(ANATOMIME_REALTIME_SETUP_TIMEOUT_MS - 1)
      assert.equal(requestSignal.aborted, false)
      context.mock.timers.tick(1)
      const result = await renewal
      assert.equal(requestSignal.aborted, true)
      assert.equal(controller.signal.aborted, false)
      assert.match(result.error, /unavailable/)
      assert.equal(result.tokenRequest, undefined)
    })
  }
})
