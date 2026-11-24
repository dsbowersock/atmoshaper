import { createOfflineCoreStorage } from "./offline-core-storage.js"
import { importLegacyNativeClock, normalizeNativeClock } from "./native-clock-state.js"

export const NATIVE_CLOCK_DATABASE = "atmoshaper.android.chimer-runtime.v1"
const emptyTimer = { status: "clock", totalMs: 0, remainingMs: 0 }

/** The shared browser preview saves settings and countdown state atomically.
 * Android's appearance-only mode writes a separate visualizer settings key
 * and retains the combined record as a read-only import and rollback seed. */
export function createNativeClockStorage({ appearanceOnly = false } = {}) {
  let writeQueue = Promise.resolve(true)
  async function open() {
    return new Promise((resolve, reject) => {
      let abandoned = false
      const request = indexedDB.open(NATIVE_CLOCK_DATABASE, 1)
      const fail = error => { abandoned = true; clearTimeout(timeout); reject(error) }
      const timeout = setTimeout(() => fail(new Error("Clock storage did not open.")), 3000)
      request.onupgradeneeded = () => request.result.createObjectStore("clock")
      request.onerror = () => fail(new Error("Clock storage could not be opened."))
      request.onblocked = () => fail(new Error("Clock storage is busy. Close another app view and retry."))
      request.onsuccess = () => {
        clearTimeout(timeout)
        if (abandoned) { request.result.close(); return }
        request.result.onversionchange = () => request.result.close()
        resolve(request.result)
      }
    })
  }
  return {
    async load() {
      let db
      try {
        db = await open()
        const read = key => new Promise((resolve, reject) => {
          const request = db.transaction("clock").objectStore("clock").get(key)
          request.onsuccess = () => resolve(request.result); request.onerror = reject
        })
        if (appearanceOnly) {
          const choices = await read("visualizer-settings")
          if (choices !== undefined) return { ready: true, state: normalizeNativeClock({ ...choices, timer: emptyTimer }) }
        }
        const raw = await read("state")
        if (raw !== undefined) return { ready: true, state: normalizeNativeClock(appearanceOnly ? { ...raw, timer: emptyTimer } : raw) }
        const old = await createOfflineCoreStorage().load()
        return old.ready ? { ready: true, state: importLegacyNativeClock(old.state) } : { ready: false, state: null }
      } catch { return { ready: false, state: null } }
      finally { db?.close() }
    },
    save(value) {
      // Freeze caller intent before queued work. A later slow open must never
      // commit an older timer adjustment after a more recent pause/reset.
      const snapshot = structuredClone(value)
      writeQueue = writeQueue.then(async () => {
      let db
      try {
        const state = normalizeNativeClock(snapshot)
        db = await open()
        await new Promise((resolve, reject) => {
          const transaction = db.transaction("clock", "readwrite", { durability: "strict" })
          if (transaction.durability !== "strict") { transaction.abort(); reject(new Error("Durable Clock saves are unavailable.")); return }
          // The Android visualizer may still change appearance, but the
          // original combined record must remain an untouched rollback seed.
          if (appearanceOnly) transaction.objectStore("clock").put({ version: 1, settings: state.settings }, "visualizer-settings")
          else transaction.objectStore("clock").put(state, "state")
          transaction.oncomplete = resolve; transaction.onerror = transaction.onabort = reject
        })
        return true
      } catch { return false }
      finally { db?.close() }
      })
      return writeQueue
    },
  }
}
