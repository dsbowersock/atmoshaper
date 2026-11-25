import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { mediaUrl, offlineAudioCatalog, describeOfflinePack, downloadOfflinePack, readVerifiedOfflinePack, sha256, createOfflineMediaStore } from "../lib/offline-media.js"

test("canceling a saved pack read rejects a late storage result", async () => {
  const controller = new AbortController()
  const record = Promise.withResolvers()
  const pending = assert.rejects(readVerifiedOfflinePack("station", { get: () => record.promise }, {
    signal: controller.signal,
  }), { name: "AbortError" })
  controller.abort()
  record.resolve({ version: 1, id: "station", files: [{ bytes: 2, data: new ArrayBuffer(1) }] })
  await pending
})

const data = new TextEncoder().encode("OggS synthetic sample").buffer
const hash = await sha256(data)
const url = "https://media.atmoshaper.com/atmosphere/atmoshaper/v1/audio/abc/opus.ogg"
const item = { id: "synthetic", kind: "ambient", concept: { sources: [{ formats: [{ id: "opus", publicUrl: url, byteSize: data.byteLength, sha256: hash, contentType: "audio/ogg" }] }] } }
const memory = () => { const packs = new Map(); return { packs, async put(pack) { packs.set(pack.id, pack) }, async get(id) { return packs.get(id) } } }
const fetchImpl = async () => new Response(data.slice(0))

test("media storage reacquires closed connections without letting an old close discard a new one", async () => {
  const opened = []
  const store = createOfflineMediaStore({ open() {
    const db = { close() {}, transaction() {
      const request = { result: [] }, tx = { objectStore: () => ({ getAll: () => request }) }
      queueMicrotask(() => tx.oncomplete())
      return tx
    } }
    opened.push(db)
    const request = { result: db }
    queueMicrotask(() => request.onsuccess())
    return request
  } })
  await store.list(); await store.list()
  assert.equal(opened.length, 1)
  opened[0].onversionchange()
  await store.list()
  assert.equal(opened.length, 2)
  opened[0].onclose()
  await store.list()
  assert.equal(opened.length, 2)
  opened[1].onclose()
  await store.list()
  assert.equal(opened.length, 3)
})

test("download commits only complete checked bytes, and offline reads do not fetch", async () => {
  const store = memory(), progress = []
  await downloadOfflinePack(item, store, { fetchImpl, onProgress: value => progress.push(value) })
  assert.equal(progress.at(-1).loaded, data.byteLength)
  assert.equal((await readVerifiedOfflinePack(item.id, store)).bytes, data.byteLength)
  store.packs.get(item.id).files[0].data = new Uint8Array(data.byteLength).buffer
  await assert.rejects(readVerifiedOfflinePack(item.id, store), /damaged/)
  await assert.rejects(readVerifiedOfflinePack("missing", store), /Download/)
})

test("abort, checksum, truncated body, HTTP failure and storage failure never publish a pack", async () => {
  for (const fetcher of [async () => new Response(new Uint8Array(3)), async () => new Response("OggS corrupted body!!"), async () => new Response("failure", { status: 503 })]) {
    const store = memory(); await assert.rejects(downloadOfflinePack(item, store, { fetchImpl: fetcher })); assert.equal(store.packs.size, 0)
  }
  const controller = new AbortController(); controller.abort()
  const store = memory(); await assert.rejects(downloadOfflinePack(item, store, { fetchImpl, signal: controller.signal })); assert.equal(store.packs.size, 0)
  await assert.rejects(downloadOfflinePack(item, { put: async () => { throw new Error("quota") } }, { fetchImpl }), /quota/)
})

test("failed replacement preserves the committed pack", async () => {
  const store = memory(); const first = await downloadOfflinePack(item, store, { fetchImpl })
  await assert.rejects(downloadOfflinePack(item, store, { fetchImpl: async () => new Response("bad") }))
  assert.equal(await store.get(item.id), first)
})

test("station packs close every index URL and reject unlisted or foreign samples", async () => {
  const station = { id: "test-station", kind: "station", station: { runtime: {
    hostedSampleIndexFormatUrls: { opus: "https://media.atmoshaper.com/atmosphere/generative-fm/test/sample-index.opus.json" },
    hostedManifestFormatUrls: { opus: "https://media.atmoshaper.com/atmosphere/generative-fm/test/manifest.opus.json" }, sampleNameGroups: ["instrument"],
  } } }
  const audioUrl = "https://media.massagelab.app/atmosphere/generative-fm/test/sample.ogg"
  const index = { instrument: { C4: audioUrl, C5: audioUrl.replace("sample", "second") } }
  const manifest = { assets: Object.values(index.instrument).map(publicUrl => ({ publicUrl, sizeBytes: 100 })) }
  const fake = async url => Response.json(url.includes("sample-index") ? index : manifest)
  assert.equal((await describeOfflinePack(station, { fetchImpl: fake })).files.length, 2)
  manifest.assets.pop()
  await assert.rejects(describeOfflinePack(station, { fetchImpl: fake }), /manifest/)
  index.instrument.C4 = "https://attacker.invalid/audio.ogg"
  await assert.rejects(describeOfflinePack(station, { fetchImpl: fake }), /outside/)
})

test("catalog retains all 57 generators and 51 reviewed ambient concepts", async () => {
  const catalog = offlineAudioCatalog(JSON.parse(await readFile(new URL("../data/atmoshaper/production-audio-catalog.json", import.meta.url))))
  assert.equal(catalog.filter(item => item.kind === "station").length, 57)
  assert.equal(catalog.filter(item => item.kind === "ambient").length, 51)
  for (const entry of catalog.filter(item => item.kind === "ambient")) {
    const descriptor = await describeOfflinePack(entry)
    assert.ok(descriptor.files.every(file => file.sha256.length === 64 && file.bytes > 0))
  }
})

test("the network boundary rejects credentials, foreign origins and traversal", () => {
  for (const value of ["http://media.atmoshaper.com/atmosphere/generative-fm/a.ogg", "https://media.atmoshaper.com.evil/atmosphere/generative-fm/a.ogg", "https://user:password@media.atmoshaper.com/atmosphere/generative-fm/a.ogg", "https://media.atmoshaper.com/atmosphere/generative-fm/%2fprivate.ogg", "https://media.atmoshaper.com/private.ogg", url + "?redirect=https://evil.invalid"]) assert.throws(() => mediaUrl(value))
})
