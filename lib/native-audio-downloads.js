import { downloadOfflinePack, OfflinePackVerificationError, readVerifiedOfflinePack } from "./offline-media.js"

class DownloadStorageError extends Error {}
class DownloadDecodeError extends Error {}

/** One explicit save owns the download lane. Reading status only reads the
 * existing pack, so online connectivity cannot hide invalid local bytes.
 * @param {{items: any[], store: ReturnType<typeof import("./offline-media.js").createOfflineMediaStore>, report: (event: {id:string, request:number, state:string, loaded?:number, total?:number})=>void, fetchImpl?: typeof fetch, decodeReplacement?: (data: ArrayBuffer) => Promise<unknown>}} options
 */
export function createNativeAudioDownloads({ items, store, report, fetchImpl = globalThis.fetch, decodeReplacement }) {
  const catalog = new Map(items.map(item => [item.id, item]))
  let active

  async function readiness(id, signal) {
    try {
      const { pack: saved, failure } = store.getWithDecodeFailure
        ? await store.getWithDecodeFailure(id)
        : { pack: await store.get(id), failure: undefined }
      signal?.throwIfAborted()
      if (saved === undefined) return { state: "missing" }
      await readVerifiedOfflinePack(id, { get: async () => saved }, { signal })
      if (failure?.revision === saved.revision &&
          saved.files.some(file => file.url === failure.url && file.sha256 === failure.sha256)) {
        return { state: "damaged", failedUrl: failure.url }
      }
      return { state: "ready" }
    } catch (error) {
      signal?.throwIfAborted()
      return { state: error instanceof OfflinePackVerificationError ? "damaged" : "storage-error" }
    }
  }

  return {
    async status(id, request) {
      if (!catalog.has(id)) return
      report({ id, request, state: (await readiness(id)).state })
    },
    async download(id, request) {
      const item = catalog.get(id)
      if (!item || active) return
      const controller = new AbortController()
      active = controller
      const send = (state, progress) => report({ id, request, state, ...progress })
      send("preparing")
      try {
        const current = await readiness(id, controller.signal)
        controller.signal.throwIfAborted()
        if (current.state === "ready" || current.state === "storage-error") {
          send(current.state)
          return
        }
        void globalThis.navigator?.storage?.persist?.().catch(() => false)
        await downloadOfflinePack(item, {
          async put(pack, signal) {
            // Re-decode only the sample that failed during playback. Publish
            // nothing until the candidate passes or no longer needs that asset.
            const replacement = current.failedUrl && pack.files.find(file => file.url === current.failedUrl)
            if (replacement) {
              try {
                if (!decodeReplacement) throw new Error("Audio decoder unavailable.")
                await decodeReplacement(replacement.data)
              } catch (error) {
                throw new DownloadDecodeError("The replacement audio could not be decoded.", { cause: error })
              }
              signal?.throwIfAborted()
            }
            send("committing")
            try { await store.put(pack, signal) }
            catch (error) { throw new DownloadStorageError("Could not save audio.", { cause: error }) }
          },
        }, {
          signal: controller.signal, fetchImpl,
          onProgress: progress => send("saving", progress),
        })
        // A completed strict transaction is durable even if Cancel raced it.
        send((await readiness(id)).state)
      } catch (error) {
        send(controller.signal.aborted ? "cancelled" :
          error instanceof DownloadStorageError ? "storage-error" :
            error instanceof DownloadDecodeError ? "damaged" : "download-error")
      } finally {
        active = undefined
      }
    },
    cancel() { active?.abort() },
  }
}
