import { Buffer } from "node:buffer"
import { STARTER_PREWARM_INVENTORY } from "./music-starter-prewarm-inventory.mjs"

const MEDIA_ORIGINS = Object.freeze(["https://media.massagelab.app", "https://media.atmoshaper.com"])
const PAYLOAD_PREFIX = "/__browser_qa_synthetic_media__/v1/"
const INDEX_FORMATS = Object.freeze(["", ".opus", ".aac", ".mp3"])
const PITCH_CLASSES = Object.freeze(["C", "D", "E", "F", "G", "A", "B"])
const installedCounters = new WeakMap()
export const SYNTHETIC_PIECE_IDS = Object.freeze(["observable-streams", "420hz-gamma-waves-for-big-brain"])

/** Rendered keys avoid the real package's expensive source-instrument rendering fallback. */
export const OBSERVABLE_RENDERED_NOTES = Object.freeze({
  "observable-streams__vsco2-piano-mf": Object.freeze([2, 3, 4, 5, 6].flatMap((octave) => ["C", "E", "G", "B"].map((pitch) => `${pitch}${octave}`))),
  "observable-streams__vsco2-violin-arcvib": Object.freeze([4, 5, 6].flatMap((octave) => ["C", "E", "G", "B"].map((pitch) => `${pitch}${octave}`))),
  "observable-streams__sso-cor-anglais": Object.freeze([4, 5].flatMap((octave) => ["C", "E", "G"].map((pitch) => `${pitch}${octave}`))),
})

/** Accepts only a root loopback URL; fixture URLs can never select a real delivery host. */
export function loopbackOrigin(baseURL) {
  const url = new URL(baseURL)
  if (url.protocol !== "http:" || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("Synthetic media requires a root HTTP loopback baseURL.")
  }
  return url.origin
}

/** Invented eight-second PCM; gamma's half-speed waves loop subtracts five seconds. */
export function createSyntheticWav() {
  const sampleRate = 8_000
  const frameCount = sampleRate * 8
  const wav = Buffer.alloc(44 + frameCount * 2)
  wav.write("RIFF", 0)
  wav.writeUInt32LE(wav.length - 8, 4)
  wav.write("WAVEfmt ", 8)
  wav.writeUInt32LE(16, 16)
  wav.writeUInt16LE(1, 20)
  wav.writeUInt16LE(1, 22)
  wav.writeUInt32LE(sampleRate, 24)
  wav.writeUInt32LE(sampleRate * 2, 28)
  wav.writeUInt16LE(2, 32)
  wav.writeUInt16LE(16, 34)
  wav.write("data", 36)
  wav.writeUInt32LE(frameCount * 2, 40)
  for (let frame = 0; frame < frameCount; frame += 1) {
    wav.writeInt16LE(Math.round(Math.sin(2 * Math.PI * 220 * frame / sampleRate) * 1_000), 44 + frame * 2)
  }
  return wav
}

/**
 * Builds exact index and payload allowlists. All note aliases for one invented
 * instrument share one URL, retaining real provider dedup/cache and native decode.
 */
export function createSyntheticMediaCatalog({ baseURL, pieceIds }) {
  const appOrigin = loopbackOrigin(baseURL)
  if (!Array.isArray(pieceIds) || pieceIds.length === 0 || new Set(pieceIds).size !== pieceIds.length
    || pieceIds.some((id) => !SYNTHETIC_PIECE_IDS.includes(id))) {
    throw new Error("Synthetic media requires unique supported piece IDs.")
  }
  const indexes = new Map()
  const payloads = new Set()
  const payloadOwners = new Map()
  const indexesByPiece = new Map()
  const putInstrument = (pieceId, name, notes) => {
    // Preserve the recorder's actual station fragment while keeping all bytes
    // on the owned loopback origin and behind an exact fixture URL allowlist.
    const stationPath = pieceId === "observable-streams" ? "observable-streams-vsco-adaptation" : `generative-fm/${pieceId}`
    const url = `${appOrigin}/audio/atmosphere/${stationPath}/__browser_qa_synthetic_media__/v3/${name}.wav`
    payloads.add(url)
    payloadOwners.set(url, pieceId)
    return notes ? Object.fromEntries(notes.map((note) => [note, url])) : [url]
  }
  for (const pieceId of pieceIds) {
    const index = pieceId === "observable-streams"
      ? Object.fromEntries(Object.entries(OBSERVABLE_RENDERED_NOTES).map(([name, notes]) => [name, putInstrument(pieceId, name, notes)]))
      : {
          waves: putInstrument(pieceId, "waves"),
          "vsco2-piano-mf": putInstrument(pieceId, "vsco2-piano-mf", [2, 3, 4, 5, 6].flatMap((octave) => PITCH_CLASSES.map((pitch) => `${pitch}${octave}`))),
          "sso-chorus-male": putInstrument(pieceId, "sso-chorus-male", [2, 3, 4, 5, 6].flatMap((octave) => PITCH_CLASSES.map((pitch) => `${pitch}${octave}`))),
        }
    indexesByPiece.set(pieceId, index)
    const path = pieceId === "observable-streams"
      ? "/atmosphere/observable-streams-vsco-adaptation/sample-index"
      : `/atmosphere/generative-fm/${pieceId}/sample-index`
    for (const origin of MEDIA_ORIGINS) {
      for (const format of INDEX_FORMATS) {
        const url = `${origin}${path}${format}.json`
        if (indexes.has(url)) throw new Error("Ambiguous synthetic index URL.")
        indexes.set(url, { pieceId, index })
      }
    }
  }
  // Known non-target starter prewarms are opportunistic in the real workspace.
  // Explicit 503s retire only those exact index requests without loading their
  // packages' media. Selected targets always keep the invented positive path.
  const prewarmUnavailable = new Map()
  for (const starter of STARTER_PREWARM_INVENTORY) {
    if (!pieceIds.includes(starter.pieceId)) {
      for (const url of starter.indexUrls) {
        if (indexes.has(url) || prewarmUnavailable.has(url)) throw new Error("Ambiguous starter prewarm URL.")
        prewarmUnavailable.set(url, starter.pieceId)
      }
    }
  }
  return { appOrigin, indexes, payloads, payloadOwners, indexesByPiece, prewarmUnavailable }
}

/** Classifies before any transport; queries, lookalikes, missing pieces and payload misses fail closed. */
export function classifySyntheticRequest(rawUrl, catalog) {
  let url
  try { url = new URL(rawUrl) } catch { return { kind: "abort", category: "invalid-url" } }
  if (url.username || url.password || url.hash) return { kind: "abort", category: "invalid-url" }
  const exact = url.href
  const index = catalog.indexes.get(exact)
  if (index) return { kind: "index", ...index }
  if (catalog.payloads.has(exact)) return { kind: "payload", pieceId: catalog.payloadOwners.get(exact) }
  if (catalog.prewarmUnavailable.has(exact)) return { kind: "prewarm-unavailable", pieceId: catalog.prewarmUnavailable.get(exact) }
  if (MEDIA_ORIGINS.includes(url.origin) || url.pathname.startsWith(PAYLOAD_PREFIX)
    || /^\/(?:audio\/)?atmosphere\//.test(url.pathname)) {
    return { kind: "abort", category: "media-miss" }
  }
  if (url.origin === catalog.appOrigin) return { kind: "local" }
  return { kind: "abort", category: "nonlocal" }
}

/** Successful selected tests must not silently pass after an unexpected request was blocked. */
export function assertSyntheticMediaIsolation(page) {
  const counters = installedCounters.get(page)
  if (counters && (counters.mediaMiss || counters.nonlocal || counters.websocketBlocked)) {
    throw new Error(`Synthetic media rejected unexpected request categories: ${JSON.stringify({ mediaMiss: counters.mediaMiss, nonlocal: counters.nonlocal, websocketBlocked: counters.websocketBlocked })}`)
  }
  if (counters && Object.keys(counters.targetIndex).some((pieceId) => counters.targetIndex[pieceId] < 1 || counters.targetPayload[pieceId] < 1)) {
    throw new Error(`Synthetic media target must fulfill index and payload: ${JSON.stringify({ index: counters.targetIndex, payload: counters.targetPayload })}`)
  }
}

/**
 * One catch-all context route owns HTTP precedence, so unmatched media never
 * reaches fetch/continue. Requires the scoped Playwright serviceWorkers:block
 * option and an unused page/context; tests must install this before navigation.
 * No runtime, AudioContext, package, controller, or phase event is substituted.
 * @param {import("@playwright/test").Page} page
 * @param {{baseURL: string | undefined, pieceIds: string[], holdPayloads?: boolean}} options
 */
export async function installSyntheticGenerativeMedia(page, options) {
  const catalog = createSyntheticMediaCatalog(options)
  const context = page.context()
  if (page.url() !== "about:blank" || context.pages().length !== 1 || context.serviceWorkers().length !== 0) {
    throw new Error("Synthetic media must own a fresh single-page context before navigation.")
  }
  const counters = {
    index: 0, payload: 0, held: 0, prewarmUnavailable: 0, retiredAbort: 0, retiredWebsocketClose: 0,
    mediaMiss: 0, nonlocal: 0, local: 0, websocketBlocked: 0,
    targetIndex: Object.fromEntries(options.pieceIds.map((pieceId) => [pieceId, 0])),
    targetPayload: Object.fromEntries(options.pieceIds.map((pieceId) => [pieceId, 0])),
  }
  installedCounters.set(page, counters)
  let disposed = false
  let closed = false
  let holdActive = Boolean(options.holdPayloads)
  let openPayloadGate = () => undefined
  const payloadGate = holdActive
    ? new Promise((resolve) => { openPayloadGate = () => resolve(undefined) })
    : Promise.resolve()
  const releasePayloads = () => { holdActive = false; openPayloadGate() }
  const wav = createSyntheticWav()
  const corsHeaders = { "access-control-allow-origin": catalog.appOrigin, "cache-control": "no-store" }
  // Native context blocking is the primary protection; this guard records any
  // attempted registration and rejects it before an application can register.
  await page.addInitScript(() => {
    const state = { attempts: 0, forwarded: 0 }
    Reflect.set(window, "__massagelabSyntheticMediaServiceWorker", state)
    if (!("serviceWorker" in navigator)) return
    Object.defineProperty(navigator.serviceWorker, "register", {
      configurable: true,
      value: () => {
        state.attempts += 1
        return Promise.reject(new DOMException("Synthetic media blocks service workers.", "NotSupportedError"))
      },
    })
  })
  const routeHandler = async (route) => {
    const request = route.request()
    const result = classifySyntheticRequest(request.url(), catalog)
    if (disposed) { counters.retiredAbort += 1; return route.abort("blockedbyclient") }
    if (result.kind === "abort") {
      if (result.category === "media-miss") counters.mediaMiss += 1
      else counters.nonlocal += 1
      return route.abort("blockedbyclient")
    }
    if (result.kind !== "local" && !["GET", "HEAD"].includes(request.method())) {
      counters.mediaMiss += 1
      return route.abort("blockedbyclient")
    }
    if (result.kind === "index") {
      counters.index += 1
      await route.fulfill({ status: 200, contentType: "application/json", headers: corsHeaders, body: JSON.stringify(result.index) })
      counters.targetIndex[result.pieceId] += 1
      return
    }
    if (result.kind === "prewarm-unavailable") {
      counters.prewarmUnavailable += 1
      return route.fulfill({ status: 503, contentType: "application/json", headers: corsHeaders, body: "{}" })
    }
    if (result.kind === "payload") {
      counters.payload += 1
      if (holdActive) counters.held += 1
      await payloadGate
      if (closed) return
      if (disposed) { counters.retiredAbort += 1; return route.abort("blockedbyclient") }
      await route.fulfill({ status: 200, contentType: "audio/wav", headers: corsHeaders, body: wav })
      counters.targetPayload[result.pieceId] += 1
      return
    }
    counters.local += 1
    return route.continue()
  }
  await context.route("**/*", routeHandler)
  // WebSockets use a different Playwright interception API from HTTP routes.
  await context.routeWebSocket("**/*", (socket) => {
    const url = new URL(socket.url())
    const expected = new URL(catalog.appOrigin)
    if (!disposed && url.protocol === "ws:" && url.hostname === expected.hostname && url.port === expected.port
      && !url.username && !url.password) return void socket.connectToServer()
    if (disposed) counters.retiredWebsocketClose += 1
    else counters.websocketBlocked += 1
    void socket.close()
  })
  context.once("close", () => { closed = true; releasePayloads() })
  return {
    catalog,
    counters,
    releasePayloads,
    /** Retires fulfillment, retaining abort-only guards until the owned context closes. */
    async dispose() {
      disposed = true
      releasePayloads()
      // Do not unroute a live context: delayed HTTP work must remain blocked.
      // Both HTTP and WebSocket route lifetimes end when its owner closes it.
    },
  }
}
