import type { startGenerativeFmPiece as webStart, prewarmGenerativeFmPiece as webPrewarm } from "@/lib/atmosphere/generative-fm-runtime"
import { getAtmosphereStationById } from "@/lib/atmosphere/stations"
import { createOfflineMediaStore } from "@/lib/offline-media"
import { createOfflineAudioRuntime } from "../offline-audio-runtime"

let active: { volume(value: number): void } | null = null
/** Same website playback lifecycle, using only a complete verified saved pack.
 * Prewarm never starts an unsolicited native download. */
export const startGenerativeFmPiece: typeof webStart = async ({ station, destination, volume = 0.75, onLoadProgress, isCurrent = () => true }) => {
  const runtime = createOfflineAudioRuntime(createOfflineMediaStore(), { destination, masterVolume: 1 })
  let disposed = false
  const owner = { volume: (value: number) => runtime.volume(station.id, value) }
  async function dispose() { if (disposed) return; disposed = true; if (active === owner) active = null; await runtime.dispose() }
  try {
    const source = getAtmosphereStationById(station.id)
    const played = await runtime.play({ id: source.id, kind: "station", station: source as never }, onLoadProgress)
    if (!played || !isCurrent()) { await dispose(); throw new Error("Playback was stopped.") }
    owner.volume(volume); active = owner
    const handle = Object.assign(() => { void dispose() }, { dispose, setVolume: owner.volume })
    return handle
  } catch (error) { await dispose(); throw error }
}
export const prewarmGenerativeFmPiece: typeof webPrewarm = async () => {}
export function setGenerativeFmPieceVolume(value: number) { active?.volume(value) }
