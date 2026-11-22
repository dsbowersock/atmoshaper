import { defaultOfflineCoreState, loadOfflineCoreState, normalizeOfflineCoreState, OFFLINE_CORE_STORAGE_KEY } from "./offline-core.js"

/** Device-only preferences. Strict IndexedDB completion acknowledges disk commit,
 * unlike WebView localStorage, whose latest batch can vanish on process death.
 * No browser vault, account store, network, or financial operation is accessed. */
export function createOfflineCoreStorage() {
  let databasePromise
  let writeQueue = Promise.resolve(true)
  function database() {
    if (databasePromise) return databasePromise
    const attempt = new Promise((resolve, reject) => {
      let request
      let abandoned = false
      try { request = window.indexedDB.open(OFFLINE_CORE_STORAGE_KEY, 1) }
      catch (error) { reject(error); return }
      const fail = error => { abandoned = true; window.clearTimeout(timer); reject(error) }
      const timer = window.setTimeout(() => fail(new Error("Local storage did not open.")), 3000)
      request.onupgradeneeded = () => request.result.createObjectStore("state")
      request.onsuccess = () => { window.clearTimeout(timer); if (abandoned) request.result.close(); else resolve(request.result) }
      request.onerror = () => fail(request.error)
      request.onblocked = () => fail(new Error("Local storage is blocked."))
    })
    const retryable = attempt.catch(error => { if (databasePromise === retryable) databasePromise = undefined; throw error })
    databasePromise = retryable
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
