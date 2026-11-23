import assert from "node:assert/strict"
import { test } from "node:test"
import { createNativePlaybackStore } from "../lib/native-media-source.js"

const item = { id: "synthetic-sound", kind: "station" }
test("native online Play keeps temporary bytes out of the download store", async () => {
  let writes = 0, downloads = 0
  const pack = { id: item.id }
  const store = createNativePlaybackStore(item, { get: async () => undefined, put() { writes++ } }, {
    isOnline: () => true,
    async download(actual, temporary) { downloads++; assert.equal(actual, item); await temporary.put(pack); return pack },
  })
  assert.equal(await store.get(item.id), pack)
  assert.equal(downloads, 1); assert.equal(writes, 0)
})
test("saved packs and offline cache misses never start network playback", async () => {
  const download = async () => { throw new Error("Unexpected network") }
  const damaged = { id: item.id, files: "invalid" }
  assert.equal(await createNativePlaybackStore(item, { get: async () => damaged }, { isOnline: () => true, download }).get(item.id), damaged)
  assert.equal(await createNativePlaybackStore(item, { get: async () => undefined }, { isOnline: () => false, download }).get(item.id), undefined)
  await assert.rejects(createNativePlaybackStore(item, { get: async () => { throw new Error("Storage unavailable") } }, { isOnline: () => true, download }).get(item.id), /Storage unavailable/)
})
test("obsolete online playback cannot request another file or claim output", async () => {
  let current = true, requests = 0
  const store = createNativePlaybackStore(item, { get: async () => undefined }, {
    isOnline: () => true, isCurrent: () => current,
    fetchImpl: async () => { requests++; return {} },
    async download(_, __, { fetchImpl }) {
      await fetchImpl("first", {}); current = false
      await assert.rejects(async () => fetchImpl("second", {}), /Playback was stopped/)
      return { id: item.id }
    },
  })
  await assert.rejects(store.get(item.id), /Playback was stopped/)
  assert.equal(requests, 1)
  await assert.rejects(store.get("another"), /does not match/)
})
