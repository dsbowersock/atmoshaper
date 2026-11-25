import test from "node:test"
import assert from "node:assert/strict"
import { prepareNativeAmbientPack } from "../lib/native-ambient-source.js"
import { downloadOfflinePack, sha256 } from "../lib/offline-media.js"

const media = new TextEncoder().encode("OggS sample")
const url = "https://media.atmoshaper.com/atmosphere/atmoshaper/v1/audio/example.ogg"
const item = {
  id: "moodist-boiling-water", kind: "ambient", concept: { sources: [{ formats: [{
    id: "opus", publicUrl: url, byteSize: media.byteLength, sha256: await sha256(media),
    contentType: "audio/ogg",
  }] }] },
}

test("native ambient Play uses temporary verified bytes, then plays an explicit save offline", async () => {
  let saved
  const calls = []
  const store = {
    get: async () => saved,
    put: async pack => { saved = pack },
  }
  const fetchImpl = async (input, options) => {
    calls.push(input)
    assert.equal(options.credentials, "omit")
    return new Response(media)
  }
  const online = await prepareNativeAmbientPack(item, store, { isOnline: true, fetchImpl })
  assert.deepEqual(calls, [url])
  assert.deepEqual(new Uint8Array(online.files[0].data), media)
  assert.equal(saved, undefined)

  await assert.rejects(prepareNativeAmbientPack(item, store, { isOnline: false, fetchImpl }), /Download/)
  await downloadOfflinePack(item, store, { fetchImpl })
  const offline = await prepareNativeAmbientPack(item, store, { isOnline: false, fetchImpl })
  assert.deepEqual(calls, [url, url])
  assert.deepEqual(new Uint8Array(offline.files[0].data), media)
})

test("native ambient Play leaves a damaged saved pack available for the explicit repair flow", async () => {
  let saved
  const store = { get: async () => saved, put: async pack => { saved = pack } }
  await downloadOfflinePack(item, store, { fetchImpl: async () => new Response(media) })
  const bytes = new Uint8Array(saved.files[0].data)
  bytes[bytes.length - 1] ^= 1
  let requests = 0
  await assert.rejects(prepareNativeAmbientPack(item, store, {
    isOnline: true,
    fetchImpl: async () => { requests++; return new Response(media) },
  }), /saved download is damaged/)
  assert.equal(requests, 0)
  assert.strictEqual((await store.get()).files[0].data, saved.files[0].data)
})
