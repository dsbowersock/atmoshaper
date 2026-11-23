import * as Tone from "tone"
import createWebLibrary from "@generative-music/web-library"
import { loadGenerativeFmPieceModule } from "@/lib/atmosphere/generative-fm-piece-loader"
import { createAmbientAtmoShaperAdapter } from "@/lib/atmoshaper/ambient-audio-runtime"
import { createGeneratedAtmoShaperAdapter } from "@/lib/atmoshaper/generated-audio-runtime"
import { mediaUrl, readVerifiedOfflinePack } from "@/lib/offline-media"
import { createStationTransportScope } from "@/lib/offline-station-transport"
import type { InputNode } from "tone/build/esm/core/context/ToneAudioNode"

type Handle = { stop(): Promise<void>; volume(value: number): void }
type PackFile = { url: string; data: ArrayBuffer }
// Match the website's conservative -60..-12 dB station output policy.
const stationGain = (value: number) => value <= 0 ? 0 : 10 ** ((-60 + Math.max(0, Math.min(1, value)) * 48) / 20)

/** One app-owned mixer: station replacement is serialized, ambient layers may
 * coexist, and an obsolete async start cannot claim the output after Stop. */
export function createOfflineAudioRuntime(store: Parameters<typeof readVerifiedOfflinePack>[1], options: { destination?: InputNode; masterVolume?: number } = {}) {
  const layers = new Map<string, Handle>()
  const generations = new Map<string, number>()
  const master = new Tone.Gain(options.masterVolume ?? 0.6)
  if (options.destination) master.connect(options.destination)
  else master.toDestination()
  let activeStation: string | null = null
  let disposed = false
  async function stop(id: string) {
    generations.set(id, (generations.get(id) ?? 0) + 1)
    const handle = layers.get(id); layers.delete(id)
    if (activeStation === id) activeStation = null
    await handle?.stop()
  }
  return {
    async play(item: { id: string; kind: string; station?: { runtime: { pieceId: string } } }, onProgress: (value: number) => void = () => {}, initialStationVolume = 0.75) {
      // Called directly by a user gesture before any IndexedDB/decode awaits.
      if (disposed) return false
      const activated = Tone.start()
      // Consume ownership synchronously before teardown/decode awaits. An older
      // start must never invalidate a newer request after its own await returns.
      const previous = layers.get(item.id); layers.delete(item.id)
      const generation = (generations.get(item.id) ?? 0) + 1
      generations.set(item.id, generation)
      const oldStation = item.kind === "station" && activeStation && activeStation !== item.id ? activeStation : null
      const retired = oldStation ? stop(oldStation) : Promise.resolve()
      if (item.kind === "station") activeStation = item.id
      const isCurrent = () => !disposed && generations.get(item.id) === generation
      await Promise.all([activated, previous?.stop(), retired])
      if (!isCurrent()) return false
      const pack = item.kind === "generated" ? null : await readVerifiedOfflinePack(item.id, store)
      if (!isCurrent()) return false
      let handle: Handle
      if (item.kind === "station") {
        // Imports allocate no audio graph. Failed imports can be retried without
        // leaving an unreachable gain connected to the app mixer.
        const piece = await loadGenerativeFmPieceModule(item.station!.runtime.pieceId) as (input: object) => Promise<[() => void, () => (() => void)]>
        if (!isCurrent()) return false
        // Set the requested level before connecting/scheduling. A paused layer
        // starts silent; callers without an explicit level retain the old gain.
        const output = new Tone.Gain(stationGain(initialStationVolume)).connect(master)
        const decoded = new Map<string, AudioBuffer>()
        const raw = Tone.getContext().rawContext as AudioContext
        const provider = {
          async has(urls: string[]) { return urls.every(url => decoded.has(url) || pack.files.some((file: PackFile) => file.url === url)) },
          async request(_context: unknown, urls: string[]) {
            const result = []
            for (const url of urls) {
              if (!isCurrent()) throw new Error("Playback was stopped.")
              if (decoded.has(url)) { result.push(decoded.get(url)!); continue }
              const file = pack.files.find((file: PackFile) => file.url === url)
              if (!file) throw new Error("A required sample is missing. Download the station again.")
              if (!decoded.has(url)) decoded.set(url, await raw.decodeAudioData(file.data.slice(0)))
              result.push(decoded.get(url)!)
            }
            return result
          },
          async save(entries: Array<[string, AudioBuffer | Record<string, AudioBuffer>]>) {
            for (const [url, buffer] of entries) {
              if (buffer instanceof AudioBuffer) decoded.set(url, buffer)
              else throw new Error("Unsupported generated sample cache entry.")
            }
          },
        }
        ;(window as Window & { generativeMusic?: { rng: () => number } }).generativeMusic ??= { rng: Math.random }
        const transport = createStationTransportScope(Tone.Transport)
        let deactivate: (() => void) | undefined
        let unschedule: (() => void) | undefined
        const release = () => {
          transport.stop()
          try { unschedule?.() } finally { try { deactivate?.() } finally { output.dispose(); decoded.clear() } }
        }
        try {
          const library = createWebLibrary({ sampleIndex: pack.sampleIndex, provider })
          const result = await piece({ context: Tone.getContext(), destination: output, sampleLibrary: library, onProgress })
          deactivate = result[0]
          if (isCurrent()) { unschedule = transport.run(result[1]); Tone.Transport.start() }
        } catch (error) { release(); throw error }
        handle = {
          async stop() { release() },
          volume(value) { output.gain.rampTo(stationGain(value), 0.2) },
        }
      } else {
        const blobs = new Map<string, string>()
        const layer = { id: item.id, kind: item.kind === "generated" ? "noise" as const : "ambient" as const, sourceId: item.id, volume: 0.5, muted: false, settings: { rampSeconds: 0.2 } }
        const adapter = item.kind === "generated" ? createGeneratedAtmoShaperAdapter({ destination: master, layer }) : await createAmbientAtmoShaperAdapter({
          destination: master, layer,
          reportFailure(error) { void stop(item.id); window.dispatchEvent(new CustomEvent("atmoshaper:offline-audio-error", { detail: { id: item.id, message: String(error) } })) },
          localAudioUrl(source) {
            const format = source.formats.find(format => format.id === "opus")!
            const url = mediaUrl(format.publicUrl)
            if (!blobs.has(url)) {
              const file = pack.files.find((file: PackFile) => file.url === url)
              if (!file) throw new Error("A required recording is missing. Download this sound again.")
              blobs.set(url, URL.createObjectURL(new Blob([file.data], { type: "audio/ogg" })))
            }
            return blobs.get(url)!
          },
        }).catch(error => { for (const url of blobs.values()) URL.revokeObjectURL(url); throw error })
        // Ambient startup loads media asynchronously into a muted graph. Stop
        // during that wait must dispose it before any audible fade-in starts.
        if (!isCurrent()) {
          try { await adapter.fadeOutAndDispose() } finally { for (const url of blobs.values()) URL.revokeObjectURL(url) }
          return false
        }
        await adapter.fadeIn()
        handle = {
          async stop() { try { await adapter.fadeOutAndDispose() } finally { for (const url of blobs.values()) URL.revokeObjectURL(url) } },
          volume(value) { layer.volume = Math.max(0, Math.min(1, value)); void adapter.update(layer) },
        }
      }
      if (!isCurrent()) { await handle.stop(); return false }
      layers.set(item.id, handle)
      return true
    },
    stop,
    volume(id: string, value: number) { layers.get(id)?.volume(value) },
    async dispose() { disposed = true; await Promise.all([...new Set([...layers.keys(), ...generations.keys()])].map(stop)); master.dispose() },
  }
}
