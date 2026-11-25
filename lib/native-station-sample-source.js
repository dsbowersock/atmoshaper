import { describeOfflinePack, MAX_PACK_BYTES, readOfflineMediaAsset, readVerifiedOfflinePack } from "./offline-media.js"

/**
 * Prepare only index metadata on the online path. The generator controls which
 * sample payloads are needed, and one playback owns the in-flight requests.
 * A saved pack takes priority even when its integrity check fails.
 * @param {any} item
 * @param {Parameters<typeof readVerifiedOfflinePack>[1]} store
 * @param {{isOnline?: boolean, signal?: AbortSignal, fetchImpl?: typeof fetch}} options
 */
export async function prepareNativeStationSamples(item, store, {
  isOnline = globalThis.navigator?.onLine === true, signal, fetchImpl = globalThis.fetch,
} = {}) {
  const saved = await store.get(item.id)
  signal?.throwIfAborted()
  if (saved || !isOnline) {
    const pack = await readVerifiedOfflinePack(item.id, { get: async () => saved })
    const files = new Map(pack.files.map(file => [file.url, file.data]))
    return {
      sampleIndex: pack.sampleIndex,
      has: url => files.has(url),
      async read(url) {
        signal?.throwIfAborted()
        if (!files.has(url)) throw new Error("A required sample is missing. Download the station again.")
        return files.get(url)
      },
    }
  }

  const descriptor = await describeOfflinePack(item, { signal, fetchImpl })
  const total = descriptor.files.reduce((sum, file) => sum + file.bytes, 0)
  if (!total || total > MAX_PACK_BYTES) throw new Error("This station exceeds the playable sample size limit.")
  const files = new Map(descriptor.files.map(file => [file.url, file]))
  const pending = new Map()
  let tail = Promise.resolve()
  return {
    sampleIndex: descriptor.sampleIndex,
    has: url => files.has(url),
    async read(url) {
      signal?.throwIfAborted()
      const file = files.get(url)
      if (!file) throw new Error("A required sample is unlisted.")
      if (pending.has(url)) return pending.get(url)
      const request = tail.then(async () => (await readOfflineMediaAsset(file, { signal, fetchImpl })).data)
      pending.set(url, request)
      tail = request.then(() => undefined, () => { pending.delete(url) })
      return request
    },
  }
}
