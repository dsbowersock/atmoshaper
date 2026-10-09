import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { runInNewContext } from "node:vm"
import ts from "typescript"
import * as sampleIndexHelpers from "../lib/atmosphere/generative-fm-sample-index.js"
import * as providerHelpers from "../lib/atmosphere/generative-fm-provider.js"

const legacy = "https://media.massagelab.app"
const branded = "https://media.atmoshaper.com"
const { fetchGenerativeFmSampleIndex, resolveGenerativeFmMediaOrigin, resolveGenerativeFmSampleUrl } = sampleIndexHelpers

const sampleIndex = {
  rendered: [legacy + "/samples/C%234.opus?version=one#segment", legacy + "/samples/E4.opus"],
  source: { C4: legacy + "/samples/source-C4.opus" },
  pad: { G3: legacy + "/samples/pad-G3.opus" },
}
const sampleGroups = [["rendered", "source"], "pad"]

test("unset and explicit rollback bindings preserve the original index and literal URLs", async () => {
  for (const mediaOrigin of [undefined, "", legacy]) {
    const requested = []
    const result = await fetchGenerativeFmSampleIndex({
      sampleIndexUrl: legacy + "/index.json",
      sampleGroups, mediaOrigin,
      fetchImpl: async (url) => {
        requested.push(url)
        return { ok: true, json: async () => sampleIndex }
      },
    })
    assert.equal(result, sampleIndex)
    assert.deepEqual(requested, [legacy + "/index.json"])
  }
})

test("opt-in maps the index and every supported collection without mutating metadata or keys", async () => {
  const requested = []
  const input = {
    ...structuredClone(sampleIndex),
    direct: legacy + "/samples/direct.mp3",
    cached: ["relative.wav", "/local/sample.opus", "https://other.example/sample.opus"],
  }
  const original = structuredClone(input)
  const result = await fetchGenerativeFmSampleIndex({
    sampleIndexUrl: legacy + "/catalog/primary%20index.json?revision=old#index",
    sampleGroups, mediaOrigin: branded, cacheMode: "reload",
    fetchImpl: async (url, init) => {
      requested.push({ url, init })
      return { ok: true, json: async () => input }
    },
  })
  assert.deepEqual(input, original)
  assert.deepEqual(Object.keys(result), Object.keys(input))
  assert.deepEqual(Object.keys(result.pad), ["G3"])
  assert.deepEqual(result.rendered, [
    branded + "/samples/C%234.opus?version=one#segment",
    branded + "/samples/E4.opus",
  ])
  assert.equal(result.source.C4, branded + "/samples/source-C4.opus")
  assert.equal(result.pad.G3, branded + "/samples/pad-G3.opus")
  assert.equal(result.direct, branded + "/samples/direct.mp3")
  assert.deepEqual(result.cached, input.cached)
  assert.equal(requested[0].url, branded + "/catalog/primary%20index.json?revision=old#index")
  assert.equal(requested[0].init.cache, "reload")
  assert.equal(requested[0].init.headers.Accept, "application/json")
})

test("origin rebinding is exact, idempotent and preserves compatibility paths", () => {
  for (const url of [
    branded + "/already.opus", "https://media.massagelab.app.evil.example/a",
    "https://media.massagelab.app@other.example/a", "http://media.massagelab.app/a",
    "//media.massagelab.app/a", "cached.wav", "/local/a", "https://other.example/a",
  ]) {
    assert.equal(resolveGenerativeFmSampleUrl(url, branded), url)
  }
  const original = legacy + "/stable//prefix/%2Fname.opus?x=one&x=two#part"
  const rebound = resolveGenerativeFmSampleUrl(original, branded)
  assert.equal(rebound, branded + original.slice(legacy.length))
  assert.equal(resolveGenerativeFmSampleUrl(rebound, branded), rebound)
})

test("misconfigured bindings stop before any index request", async () => {
  let requests = 0
  for (const mediaOrigin of [
    "http://media.atmoshaper.com", branded + "/", branded + "/path",
    branded + "?key=example", branded + "#fragment", "https://user@media.atmoshaper.com",
    "https://other.example", " " + branded, branded + ":443",
  ]) {
    assert.throws(() => resolveGenerativeFmMediaOrigin(mediaOrigin), /media origin/)
    await assert.rejects(fetchGenerativeFmSampleIndex({
      sampleIndexUrl: legacy + "/index.json", sampleGroups, mediaOrigin,
      fetchImpl: async () => { requests += 1; throw new Error("must not fetch") },
    }), /media origin/)
  }
  assert.equal(requests, 0)
})

test("a branded HTTP or invalid instrument response fails without retrying the old host", async () => {
  const requested = []
  await assert.rejects(fetchGenerativeFmSampleIndex({
    sampleIndexUrl: legacy + "/index.json", sampleGroups, mediaOrigin: branded,
    fetchImpl: async (url) => {
      requested.push(url)
      return { ok: false, status: 404 }
    },
  }), /HTTP 404 for https:\/\/media\.atmoshaper\.com\/index\.json/)
  await assert.rejects(fetchGenerativeFmSampleIndex({
    sampleIndexUrl: legacy + "/index.json", sampleGroups, mediaOrigin: branded,
    fetchImpl: async (url) => {
      requested.push(url)
      return { ok: true, json: async () => ({ rendered: [] }) }
    },
  }), /missing required instruments/)
  assert.deepEqual(requested, [branded + "/index.json", branded + "/index.json"])
})

test("mapped metadata reaches bounded playback provider requests in the same fallback order", async () => {
  const mapped = await fetchGenerativeFmSampleIndex({
    sampleIndexUrl: legacy + "/index.json", sampleGroups, mediaOrigin: branded,
    fetchImpl: async () => ({ ok: true, json: async () => structuredClone(sampleIndex) }),
  })
  const urls = sampleIndexHelpers.selectGenerativeFmSampleWarmupUrls({ sampleIndex: mapped, sampleGroups })
  const batches = []
  const provider = providerHelpers.createBoundedGenerativeFmWebProvider({
    maxBatchSize: 2,
    provider: { request: async (_context, batch) => {
      batches.push([...batch])
      return batch.map((url) => ({ url }))
    } },
  })
  const context = {}
  const buffers = await provider.request(context, urls)
  assert.deepEqual(batches, [
    [branded + "/samples/C%234.opus?version=one#segment", branded + "/samples/E4.opus"],
    [branded + "/samples/pad-G3.opus"],
  ])
  assert.deepEqual(buffers.map((buffer) => buffer.url), urls)
  await provider.request(context, urls)
  assert.equal(batches.length, 2)
})

/**
 * Runs the actual TypeScript runtime with only audio modules, piece loading and
 * network dependencies replaced. No Tone graph, application, server or provider
 * starts. Origin changes share the same runtime instance to exercise both caches.
 */
function loadRuntime({ origin, indexUrl = legacy + "/index.opus.json", formats = true, fetchStatus = 200 } = {}) {
  const requests = []
  const env = { NEXT_PUBLIC_GENERATIVE_FM_MEDIA_ORIGIN: origin }
  const fakeFetch = async (url, init) => {
    requests.push({ url, init })
    return { ok: fetchStatus === 200, status: fetchStatus,
      json: async () => structuredClone(sampleIndex), arrayBuffer: async () => new ArrayBuffer(0) }
  }
  const exports = {}
  const require = (name) => {
    if (name === "./generative-fm-sample-index") return {
      ...sampleIndexHelpers,
      fetchGenerativeFmSampleIndex: (args) => fetchGenerativeFmSampleIndex({ ...args, fetchImpl: fakeFetch }),
    }
    if (name === "./generative-fm-provider") return providerHelpers
    if (name === "./generative-fm-piece-loader") return { loadGenerativeFmPieceModule: async () => () => {} }
    if (name === "./generative-fm-transport-owner.js") return { generativeFmTransportOwner: {} }
    if (name === "tone") return {}
    if (name === "@generative-music/web-provider" || name === "@generative-music/web-library") return { default: () => {} }
    throw new Error("Unexpected dependency: " + name)
  }
  const source = readFileSync(new URL("../lib/atmosphere/generative-fm-runtime.ts", import.meta.url), "utf8")
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  runInNewContext(compiled, {
    exports, require, process: { env }, window: {},
    document: { createElement: () => ({ canPlayType: () => formats ? "probably" : "" }) },
    fetch: fakeFetch, performance, console,
  })
  const station = { id: "invented", runtime: {
    pieceId: "invented-piece", sampleNameGroups: sampleGroups,
    hostedSampleIndexUrl: indexUrl.replace(".opus.json", ".wav.json"),
    hostedSampleIndexFormatUrls: { opus: indexUrl },
  } }
  return { runtime: exports, env, station, requests }
}

test("actual compressed prewarm maps all requests and keeps default, opt-in and rollback caches separate", async () => {
  const { runtime, env, station, requests } = loadRuntime()
  await runtime.prewarmGenerativeFmPiece({ station, includeSamplePayloads: true })
  assert.deepEqual(requests.map(({ url }) => url), [
    legacy + "/index.opus.json", ...sampleIndex.rendered, sampleIndex.pad.G3,
  ])
  env.NEXT_PUBLIC_GENERATIVE_FM_MEDIA_ORIGIN = branded
  await runtime.prewarmGenerativeFmPiece({ station, includeSamplePayloads: true })
  assert.deepEqual(requests.slice(4).map(({ url }) => url), [
    branded + "/index.opus.json",
    branded + "/samples/C%234.opus?version=one#segment",
    branded + "/samples/E4.opus", branded + "/samples/pad-G3.opus",
  ])
  assert.equal(requests[5].init.credentials, "omit")
  assert.equal(requests[5].init.mode, "cors")
  assert.equal(requests[5].init.cache, "force-cache")
  await runtime.prewarmGenerativeFmPiece({ station, includeSamplePayloads: true })
  env.NEXT_PUBLIC_GENERATIVE_FM_MEDIA_ORIGIN = ""
  await runtime.prewarmGenerativeFmPiece({ station, includeSamplePayloads: true })
  assert.equal(requests.length, 8)
})

test("actual runtime partitions nested delivery changes even when the index has a different origin", async () => {
  const { runtime, env, station, requests } = loadRuntime({ indexUrl: "https://other.example/index.opus.json" })
  await runtime.prewarmGenerativeFmPiece({ station, includeSamplePayloads: true })
  env.NEXT_PUBLIC_GENERATIVE_FM_MEDIA_ORIGIN = branded
  await runtime.prewarmGenerativeFmPiece({ station, includeSamplePayloads: true })
  assert.equal(requests[0].url, requests[4].url)
  assert.equal(requests[5].url, branded + "/samples/C%234.opus?version=one#segment")
  assert.equal(requests.length, 8)
})

test("actual WAV fallback remains metadata-only and invalid configuration has zero requests", async () => {
  const wav = loadRuntime({ origin: branded, formats: false })
  await wav.runtime.prewarmGenerativeFmPiece({ station: wav.station, includeSamplePayloads: true })
  assert.deepEqual(wav.requests.map(({ url }) => url), [branded + "/index.wav.json"])
  const invalid = loadRuntime({ origin: "https://unexpected.example" })
  await assert.rejects(invalid.runtime.prewarmGenerativeFmPiece({ station: invalid.station }), /media origin/)
  assert.equal(invalid.requests.length, 0)
})
