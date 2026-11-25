import { downloadOfflinePack, OfflinePackVerificationError, readVerifiedOfflinePack } from "./offline-media.js"

class DownloadStorageError extends Error {}

/** One explicit save owns the download lane. Reading status only reads the
 * existing pack, so online connectivity cannot hide invalid local bytes.
 * @param {{items: any[], store: ReturnType<typeof import("./offline-media.js").createOfflineMediaStore>, report: (event: {id:string, request:number, state:string, loaded?:number, total?:number})=>void, fetchImpl?: typeof fetch}} options
 */
export function createNativeAudioDownloads({ items, store, report, fetchImpl = globalThis.fetch }) {
  const catalog = new Map(items.map(item => [item.id, item]))
  let active

  async function readiness(id, signal) {
    try {
      const saved = await store.get(id)
      signal?.throwIfAborted()
      if (saved === undefined) return "missing"
      await readVerifiedOfflinePack(id, { get: async () => saved }, { signal })
      return "ready"
    } catch (error) {
      signal?.throwIfAborted()
      return error instanceof OfflinePackVerificationError ? "damaged" : "storage-error"
    }
  }

  return {
    async status(id, request) {
      if (!catalog.has(id)) return
      report({ id, request, state: await readiness(id) })
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
        if (current === "ready" || current === "storage-error") {
          send(current)
          return
        }
        void globalThis.navigator?.storage?.persist?.().catch(() => false)
        await downloadOfflinePack(item, {
          async put(pack, signal) {
            send("committing")
            try { await store.put(pack, signal) }
            catch (error) { throw new DownloadStorageError("Could not save audio.", { cause: error }) }
          },
        }, {
          signal: controller.signal, fetchImpl,
          onProgress: progress => send("saving", progress),
        })
        // A completed strict transaction is durable even if Cancel raced it.
        send(await readiness(id))
      } catch (error) {
        send(controller.signal.aborted ? "cancelled" :
          error instanceof DownloadStorageError ? "storage-error" : "download-error")
      } finally {
        active = undefined
      }
    },
    cancel() { active?.abort() },
  }
}
