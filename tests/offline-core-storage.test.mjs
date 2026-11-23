import test from "node:test"
import assert from "node:assert/strict"
import { createOfflineCoreStorage } from "../lib/offline-core-storage.js"

test("a failed storage open fulfills defaults so free tools can still render", async () => {
  const previous = globalThis.window
  globalThis.window = { indexedDB: { open() { throw new Error("storage denied") } } }
  try { const initial = await createOfflineCoreStorage().load(); assert.equal(initial.ready, false); assert.equal(initial.state.tool, "clock") }
  finally { globalThis.window = previous }
})

test("a late connection is closed after timeout and the next load can recover", async () => {
  const previous = globalThis.window, requests = [], timers = []
  globalThis.window = { indexedDB: { open() { const request = {}; requests.push(request); return request } },
    setTimeout(fn) { timers.push(fn); return timers.length }, clearTimeout() {}, localStorage: { getItem() { return null } } }
  try {
    const store = createOfflineCoreStorage()
    const first = store.load(); timers[0]()
    assert.equal((await first).ready, false)
    let closed = 0
    requests[0].result = { close() { closed++ } }; requests[0].onsuccess()
    assert.equal(closed, 1)
    const second = store.load()
    assert.equal(requests.length, 2, "the rejected opening promise is not cached forever")
    const query = {}
    requests[1].result = { transaction() { return { objectStore() { return { get() { return query } } } } } }
    requests[1].onsuccess()
    await Promise.resolve(); await Promise.resolve()
    query.onsuccess()
    const restored = await second
    assert.equal(restored.ready, true); assert.equal(restored.state.tool, "clock")
  } finally { globalThis.window = previous }
})
