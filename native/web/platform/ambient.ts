import { createAmbientAtmoShaperAdapter as createSharedAdapter } from "@/lib/atmoshaper/ambient-audio-runtime"
import { createOfflineMediaStore, mediaUrl, readVerifiedOfflinePack } from "@/lib/offline-media"
import { createNativePlaybackStore } from "@/lib/native-media-source"
import { getAtmoShaperProductionConcept } from "@/lib/atmoshaper/production-catalog-runtime"

/** The website mixer and recording-selection UI keep their original behavior;
 * only the audio URL binding changes to verified saved or temporary online bytes. */
export const createAmbientAtmoShaperAdapter: typeof createSharedAdapter = async options => {
  const id = options.layer.sourceId
  const pack = await readVerifiedOfflinePack(id, createNativePlaybackStore(
    { id, kind: "ambient", concept: getAtmoShaperProductionConcept(id) }, createOfflineMediaStore(),
    { isCurrent: options.isCurrent },
  ))
  if (options.isCurrent && !options.isCurrent()) throw new Error("Playback was stopped.")
  const blobs = new Map<string, string>()
  const release = () => { for (const url of blobs.values()) URL.revokeObjectURL(url); blobs.clear() }
  try {
    const handle = await createSharedAdapter({ ...options, localAudioUrl(source) {
      const format = source.formats.find(value => value.id === "opus")
      if (!format) throw new Error("Download this sound before playing it offline.")
      const url = mediaUrl(format.publicUrl)
      if (!blobs.has(url)) {
        const file = pack.files.find((value: { url: string }) => value.url === url)
        if (!file) throw new Error("A saved recording is missing. Download this sound again.")
        blobs.set(url, URL.createObjectURL(new Blob([file.data], { type: "audio/ogg" })))
      }
      return blobs.get(url)!
    } })
    return { ...handle, async fadeOutAndDispose() { try { await handle.fadeOutAndDispose() } finally { release() } } }
  } catch (error) { release(); throw error }
}
