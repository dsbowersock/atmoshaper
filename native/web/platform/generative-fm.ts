import type { startGenerativeFmPiece as webStart, prewarmGenerativeFmPiece as webPrewarm } from "@/lib/atmosphere/generative-fm-runtime"
import { getAtmosphereStationById } from "@/lib/atmosphere/stations"
import { createOfflineMediaStore } from "@/lib/offline-media"
import { createOfflineAudioRuntime } from "../offline-audio-runtime"
import { createNativePlaybackStore } from "@/lib/native-media-source"

let active: { volume(value: number): void } | null = null
/** Same website playback lifecycle. Online Play may load a temporary verified
 * pack; only the explicit Downloads action persists one. Prewarm remains inert. */
export const startGenerativeFmPiece: typeof webStart = async ({ station, destination, volume = 0.75, onLoadProgress, isCurrent = () => true }) => {
  const source = getAtmosphereStationById(station.id)
  const runtime = createOfflineAudioRuntime(createNativePlaybackStore(
    { id: source.id, kind: "station", station: source }, createOfflineMediaStore(),
    { isCurrent, onProgress: onLoadProgress },
  ), { destination, masterVolume: 1 })
  let disposed = false
  const owner = { volume: (value: number) => runtime.volume(station.id, value) }
  async function dispose() { if (disposed) return; disposed = true; if (active === owner) active = null; await runtime.dispose() }
  try {
    const played = await runtime.play({ id: source.id, kind: "station", station: source as never }, onLoadProgress, volume)
    if (!played || !isCurrent()) { await dispose(); throw new Error("Playback was stopped.") }
    active = owner
    const handle = Object.assign(() => { void dispose() }, { dispose, setVolume: owner.volume })
    return handle
  } catch (error) { await dispose(); throw error }
}
export const prewarmGenerativeFmPiece: typeof webPrewarm = async () => {}
export function setGenerativeFmPieceVolume(value: number) { active?.volume(value) }
