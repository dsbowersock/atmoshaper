import { defaultOfflineCoreState, loadOfflineCoreState, normalizeOfflineCoreState, OFFLINE_CORE_STORAGE_KEY } from "./offline-core.js"

/** Device-only preferences. Strict IndexedDB completion acknowledges disk commit,
 * unlike WebView localStorage, whose latest batch can vanish on process death.
 * No browser vault, account store, network, or financial operation is accessed. */
export function createOfflineCoreStorage() {
  let databasePromise
  let writeQueue = Promise.resolve(true)
  function database() {
    databasePromise ??= new Promise((resolve, reject) => {
      let request
      try { request = window.indexedDB.open(OFFLINE_CORE_STORAGE_KEY, 1) }
      catch (error) { reject(error); return }
      const timer = window.setTimeout(() => reject(new Error("Local storage did not open.")), 3000)
      request.onupgradeneeded = () => request.result.createObjectStore("state")
      request.onsuccess = () => { window.clearTimeout(timer); resolve(request.result) }
      request.onerror = () => { window.clearTimeout(timer); reject(request.error) }
      request.onblocked = () => { window.clearTimeout(timer); reject(new Error("Local storage is blocked.")) }
    })
    return databasePromise
  }
  return {
    async load() {
      try {
        const db = await database()
        const raw = await new Promise((resolve, reject) => {
          const request = db.transaction("state").objectStore("state").get("preferences")
          request.onsuccess = () => resolve(request.result)
          request.onerror = () => reject(request.error)
        })
        // Only the unreleased local prototype key is eligible as a seed. Never
        // inspect existing website account preferences or its encrypted vault.
        return { state: raw ? normalizeOfflineCoreState(raw) : loadOfflineCoreState(window.localStorage), ready: true }
      } catch { return { state: defaultOfflineCoreState(), ready: false } }
    },
    save(state) {
      const snapshot = normalizeOfflineCoreState(state)
      writeQueue = writeQueue.then(async () => {
        try {
          const db = await database()
          return await new Promise((resolve, reject) => {
            const transaction = db.transaction("state", "readwrite", { durability: "strict" })
            if (transaction.durability !== "strict") { transaction.abort(); reject(new Error("Durable saves are unavailable.")); return }
            transaction.objectStore("state").put(snapshot, "preferences")
            transaction.oncomplete = () => resolve(true)
            transaction.onabort = () => reject(transaction.error)
            transaction.onerror = () => reject(transaction.error)
          })
        } catch { return false }
      })
      return writeQueue
    },
  }
}
