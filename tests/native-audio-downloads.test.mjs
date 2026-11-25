import test from "node:test"
import assert from "node:assert/strict"
import { createNativeAudioDownloads } from "../lib/native-audio-downloads.js"
import { readVerifiedOfflinePack, sha256 } from "../lib/offline-media.js"
import { prepareNativeStationSamples } from "../lib/native-station-sample-source.js"

const bytes = new TextEncoder().encode("OggS selected recording")
const url = "https://media.atmoshaper.com/atmosphere/atmoshaper/v1/audio/fixture/opus.ogg"
const item = {
  id: "fixture", title: "Fixture", kind: "ambient",
  concept: { sources: [{ formats: [{
    id: "opus", publicUrl: url, byteSize: bytes.byteLength,
    sha256: await sha256(bytes), contentType: "audio/ogg",
  }] }] },
}

test("only explicit download publishes a ready pack, and status detects damage without fetching", async () => {
  let saved, requests = 0
  const store = { get: async () => saved, put: async pack => { saved = pack } }
  const options = { store, items: [item], fetchImpl: async () => { requests++; return new Response(bytes) } }
  const events = []
  const downloads = createNativeAudioDownloads({ ...options, report: event => events.push(event) })
  await downloads.status(item.id, 1)
  assert.equal(events.at(-1).state, "missing")
  assert.equal(requests, 0)
  await downloads.download(item.id, 2)
  assert.equal(events.at(-1).state, "ready")
  assert.equal(requests, 1)
  assert.ok(events.some(event => event.state === "saving" && event.loaded === bytes.byteLength))
  const restarted = createNativeAudioDownloads({ ...options, report: event => events.push(event) })
  await restarted.status(item.id, 3)
  assert.equal(events.at(-1).state, "ready")
  new Uint8Array(saved.files[0].data)[4] ^= 1
  await restarted.status(item.id, 4)
  assert.equal(events.at(-1).state, "damaged")
  assert.equal(requests, 1)
})

test("verified readiness rejects truncated pack metadata even if retained files still match their hashes", async () => {
  let saved
  const secondUrl = url.replace("opus.ogg", "another.opus.ogg")
  const group = { ...item, concept: { sources: [...item.concept.sources, {
    formats: [{ ...item.concept.sources[0].formats[0], publicUrl: secondUrl }],
  }] } }
  const store = { get: async () => saved, put: async pack => { saved = pack } }
  const events = []
  const downloads = createNativeAudioDownloads({
    items: [group], store, report: event => events.push(event), fetchImpl: async () => new Response(bytes),
  })
  await downloads.download(item.id, 1)
  assert.equal(events.at(-1).state, "ready")
  saved.files.pop()
  saved.bytes = bytes.byteLength
  await downloads.status(item.id, 2)
  assert.equal(events.at(-1).state, "damaged")
  await assert.rejects(readVerifiedOfflinePack(item.id, store), /damaged/)
})

test("cancel interrupted file transfer after visible partial byte progress, then retry", async () => {
  let saved, blockTransfer = true
  const received = Promise.withResolvers()
  const release = Promise.withResolvers()
  const store = { get: async () => saved, put: async pack => { saved = pack } }
  const events = []
  const downloads = createNativeAudioDownloads({
    items: [item], store, report: event => events.push(event),
    fetchImpl: async () => !blockTransfer ? new Response(bytes) : new Response(new ReadableStream({
      async start(controller) {
        controller.enqueue(bytes.slice(0, 4))
        received.resolve()
        await release.promise
        controller.enqueue(bytes.slice(4))
        controller.close()
      },
    })),
  })
  const pending = downloads.download(item.id, 1)
  await received.promise
  await new Promise(resolve => setImmediate(resolve))
  const partial = events.some(event => event.state === "saving" && event.loaded === 4 && event.total === bytes.byteLength)
  downloads.cancel()
  release.resolve()
  await pending
  assert.equal(partial, true)
  assert.equal(events.at(-1).state, "cancelled")
  assert.equal(saved, undefined)
  blockTransfer = false
  await downloads.download(item.id, 2)
  assert.equal(events.at(-1).state, "ready")
})

test("a checksum-valid undecodable station can be repaired without publishing another bad replacement", async () => {
  const url = "https://media.atmoshaper.com/atmosphere/generative-fm/fixture/sample.ogg"
  const indexUrl = url.replace("sample.ogg", "sample-index.opus.json")
  const manifestUrl = url.replace("sample.ogg", "manifest.opus.json")
  const station = { id: "station-fixture", kind: "station", station: { runtime: {
    hostedSampleIndexFormatUrls: { opus: indexUrl },
    hostedManifestFormatUrls: { opus: manifestUrl },
    sampleNameGroups: ["instrument"],
  } } }
  const rejected = new TextEncoder().encode("OggS malformed fixture")
  const repaired = new TextEncoder().encode("OggS repaired! fixture")
  assert.equal(rejected.length, repaired.length)
  let pack, failure, incoming = rejected
  const store = {
    get: async () => pack,
    getWithDecodeFailure: async () => ({ pack, failure }),
    put: async value => { pack = value; failure = undefined },
  }
  const events = []
  const decodeReplacement = async data => {
    if (new Uint8Array(data)[5] === rejected[5]) throw new DOMException("Malformed fixture", "EncodingError")
  }
  const downloads = createNativeAudioDownloads({
    items: [station], store, report: event => events.push(event), decodeReplacement,
    fetchImpl: async request => {
      if (request === indexUrl) return Response.json({ instrument: { C4: url } })
      if (request === manifestUrl) return Response.json({ assets: [{ publicUrl: url, sizeBytes: rejected.length }] })
      assert.equal(request, url)
      return new Response(incoming)
    },
  })
  await downloads.download(station.id, 1)
  assert.equal(events.at(-1).state, "ready")
  const original = await readVerifiedOfflinePack(station.id, store)
  const source = await prepareNativeStationSamples(station, store, { isOnline: false })
  failure = source.savedSample(url)
  assert.deepEqual(failure, { url, revision: original.revision, sha256: await sha256(rejected) })
  await downloads.status(station.id, 2)
  assert.equal(events.at(-1).state, "damaged")
  await downloads.download(station.id, 3)
  assert.equal(events.at(-1).state, "damaged")
  assert.equal(pack, original)

  incoming = repaired
  await downloads.download(station.id, 4)
  assert.equal(events.at(-1).state, "ready")
  const fixed = await readVerifiedOfflinePack(station.id, store)
  assert.equal(fixed.revision, original.revision)
  assert.equal(fixed.files[0].sha256, await sha256(repaired))
  failure = source.savedSample(url)
  await downloads.status(station.id, 5)
  assert.equal(events.at(-1).state, "ready", "a late failure for old bytes must not block a corrected pack")
})
