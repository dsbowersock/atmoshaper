import { describeOfflinePack, MAX_PACK_BYTES, readOfflineMediaAsset, readVerifiedOfflinePack } from "./offline-media.js"

/** Use verified saved bytes first. Connected Play only holds temporary bytes;
 * the explicit download command remains the sole owner of persistent packs.
 * @param {any} item
 * @param {Parameters<typeof readVerifiedOfflinePack>[1]} store
 * @param {{isOnline?: boolean, signal?: AbortSignal, fetchImpl?: typeof fetch}} options
 */
export async function prepareNativeAmbientPack(item, store, {
  isOnline = globalThis.navigator?.onLine === true, signal, fetchImpl = globalThis.fetch,
} = {}) {
  const saved = await store.get(item.id)
  signal?.throwIfAborted()
  if (saved || !isOnline) return readVerifiedOfflinePack(item.id, { get: async () => saved })
  const descriptor = await describeOfflinePack(item)
  const total = descriptor.files.reduce((sum, file) => sum + file.bytes, 0)
  if (!total || total > MAX_PACK_BYTES) throw new Error("This sound exceeds the playable recording size limit.")
  const files = []
  for (const file of descriptor.files) files.push(await readOfflineMediaAsset(file, { signal, fetchImpl }))
  return { ...descriptor, files }
}
