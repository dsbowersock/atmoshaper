import test from "node:test"
import assert from "node:assert/strict"
import { createNativeAudioDownloads } from "../lib/native-audio-downloads.js"
import { readVerifiedOfflinePack, sha256 } from "../lib/offline-media.js"

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
