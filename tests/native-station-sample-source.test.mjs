import test from "node:test"
import assert from "node:assert/strict"
import { prepareNativeStationSamples } from "../lib/native-station-sample-source.js"

test("station Play requests metadata first, then only the samples used by the generator", async () => {
  const base = "https://media.atmoshaper.com/atmosphere/generative-fm/test/"
  const first = base + "one.ogg"
  const second = base + "two.ogg"
  const bytes = "OggS test"
  const calls = []
  const source = await prepareNativeStationSamples({
    id: "station", kind: "station", station: { runtime: {
      hostedSampleIndexFormatUrls: { opus: base + "sample-index.opus.json" },
      hostedManifestFormatUrls: { opus: base + "manifest.opus.json" },
      sampleNameGroups: ["piano"],
    } },
  }, { get: async () => undefined }, {
    isOnline: true,
    fetchImpl: async url => {
      calls.push(url)
      if (url.endsWith("sample-index.opus.json")) return Response.json({ piano: { C4: first, D4: second } })
      if (url.endsWith("manifest.opus.json")) {
        return Response.json({ assets: [first, second].map(publicUrl => ({ publicUrl, sizeBytes: bytes.length })) })
      }
      return new Response(bytes)
    },
  })
  assert.deepEqual(calls, [base + "sample-index.opus.json", base + "manifest.opus.json"])
  const [a, b] = await Promise.all([source.read(first), source.read(first)])
  assert.equal(new TextDecoder().decode(a), bytes)
  assert.deepEqual(a, b)
  assert.deepEqual(calls, [base + "sample-index.opus.json", base + "manifest.opus.json", first])
})

test("canceling Play rejects late payloads and never requests queued samples", async () => {
  const base = "https://media.atmoshaper.com/atmosphere/generative-fm/test/"
  const first = base + "one.ogg"
  const second = base + "two.ogg"
  const bytes = "OggS test"
  const controller = new AbortController()
  const started = Promise.withResolvers()
  const response = Promise.withResolvers()
  const samples = []
  const source = await prepareNativeStationSamples({
    id: "station", kind: "station", station: { runtime: {
      hostedSampleIndexFormatUrls: { opus: base + "sample-index.opus.json" },
      hostedManifestFormatUrls: { opus: base + "manifest.opus.json" },
      sampleNameGroups: ["piano"],
    } },
  }, { get: async () => undefined }, {
    isOnline: true,
    signal: controller.signal,
    fetchImpl: async url => {
      if (url.endsWith("sample-index.opus.json")) return Response.json({ piano: { C4: first, D4: second } })
      if (url.endsWith("manifest.opus.json")) {
        return Response.json({ assets: [first, second].map(publicUrl => ({ publicUrl, sizeBytes: bytes.length })) })
      }
      samples.push(url)
      let sent = false
      return {
        ok: true, type: "basic", headers: new Headers(),
        body: { getReader: () => ({
          async read() {
            if (!sent) {
              sent = true
              return { done: false, value: new TextEncoder().encode(bytes) }
            }
            started.resolve()
            return response.promise
          },
        }) },
      }
    },
  })
  const active = assert.rejects(source.read(first), { name: "AbortError" })
  await started.promise
  const queued = assert.rejects(source.read(second), { name: "AbortError" })
  assert.deepEqual(samples, [first])
  controller.abort()
  response.resolve({ done: true })
  await Promise.all([active, queued])
  assert.deepEqual(samples, [first])
})
