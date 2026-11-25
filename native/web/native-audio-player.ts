import * as Tone from "tone"
import { getAtmosphereStationById } from "@/lib/atmosphere/stations"
import { prepareNativeStationSamples } from "@/lib/native-station-sample-source"
import { createOfflineMediaStore } from "@/lib/offline-media"
import { createOfflineAudioRuntime } from "./offline-audio-runtime"

const stationId = "generative-fm-aisatsana"
type AudioPlayerWindow = Window & {
  AtmoShaperAudioHost?: { postMessage(message: string): void }
  atmoNativeAudio?: typeof player
}
const host = window as AudioPlayerWindow
const report = (message: string): void => host.AtmoShaperAudioHost?.postMessage(message)
const store = createOfflineMediaStore()
let output: Tone.Gain | undefined
let probe: Tone.Analyser | undefined
let playingToken = 0

/** The foreground service owns this document. The UI never loads this entry
 * and cannot create a second audio graph while reattaching to the service. */
const player = {
  async play(id: string, token: number) {
    if (id !== stationId || playingToken !== 0) return
    playingToken = token
    const station = getAtmosphereStationById(id)
    const item = { kind: "station", id, station }
    try {
      output = new Tone.Gain(1).toDestination()
      const runtime = createOfflineAudioRuntime(store, {
        destination: output,
        prepareStationSamples: () => prepareNativeStationSamples(item, store),
      })
      const played = await runtime.play({ ...item, station: { runtime: { pieceId: station.runtime.pieceId } } })
      report(`${played ? "playing" : "failed"}:${token}`)
    } catch {
      report(`failed:${token}`)
    }
  },

  async setPaused(paused: boolean, token: number) {
    if (token !== playingToken || !output) return
    const context = Tone.getContext().rawContext as AudioContext
    try {
      if (paused) await context.suspend()
      else await context.resume()
      report(`${paused ? "paused" : "playing"}:${token}`)
    } catch {
      report(`failed:${token}`)
    }
  },

  /** On-demand waveform evidence through the preview WebView debugger. This
   * taps the same gain feeding the device output and schedules no sound. */
  outputProbe() {
    const context = Tone.getContext()
    const result = { peak: 0, currentTime: context.currentTime, state: context.state }
    if (!output || context.state !== "running") return result
    if (!probe) {
      probe = new Tone.Analyser("waveform", 1024)
      output.connect(probe)
    }
    const data = probe.getValue() as Float32Array
    for (const value of data) result.peak = Math.max(result.peak, Math.abs(value))
    return result
  },
}

host.atmoNativeAudio = player
report("ready")
