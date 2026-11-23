import { downloadOfflinePack } from "./offline-media.js"

/** Prefer a saved pack; online Play may load verified bytes into memory without
 * saving a download. Storage errors and damaged saved packs are never hidden by
 * a network fallback. Each playback owns its temporary bytes and cancellation.
 * @param {any} item
 * @param {any} savedStore
 * @param {{isOnline?:()=>boolean,isCurrent?:()=>boolean,onProgress?:(value:number)=>void,fetchImpl?:typeof fetch,download?:typeof downloadOfflinePack}} options
 */
export function createNativePlaybackStore(item, savedStore, {
  isOnline = () => globalThis.navigator?.onLine === true,
  isCurrent = () => true,
  onProgress = () => {},
  fetchImpl = globalThis.fetch,
  download = downloadOfflinePack,
} = {}) {
  return {
    async get(id) {
      if (id !== item.id) throw new Error("This playback source does not match the requested sound.")
      const saved = await savedStore.get(id)
      if (saved || !isOnline()) return saved
      const currentFetch = (url, options) => {
        if (!isCurrent()) throw new Error("Playback was stopped.")
        return fetchImpl(url, options)
      }
      const temporary = await download(item, { async put() {} }, {
        fetchImpl: currentFetch,
        onProgress({ loaded, total }) { if (isCurrent()) onProgress(total ? loaded / total : 0) },
      })
      if (!isCurrent()) throw new Error("Playback was stopped.")
      return temporary
    },
  }
}
