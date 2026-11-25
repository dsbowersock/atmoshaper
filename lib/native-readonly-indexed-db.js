/** Read one known IndexedDB key without creating or upgrading its database. */
export function readPackagedRecord(indexedDB, database, store, key) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(database)
    let absent = false
    request.onupgradeneeded = event => {
      absent = event.oldVersion === 0
      request.transaction.abort()
    }
    request.onblocked = () => reject(new Error("Packaged storage is busy"))
    request.onerror = () => absent && request.error?.name === "AbortError"
      ? resolve(undefined) : reject(request.error)
    request.onsuccess = () => {
      const db = request.result
      try {
        const transaction = db.transaction(store, "readonly")
        const read = transaction.objectStore(store).get(key)
        transaction.oncomplete = () => resolve(read.result)
        transaction.onabort = () => reject(transaction.error)
        transaction.onerror = () => reject(transaction.error)
      } catch (error) {
        reject(error)
      } finally {
        db.close()
      }
    }
  })
}
