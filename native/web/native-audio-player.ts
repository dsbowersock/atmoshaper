import * as Tone from "tone"
import { getAtmosphereStationById } from "@/lib/atmosphere/stations"
import { hasNativeStationPlayer } from "@/lib/native-station-catalog"
import { prepareNativeStationSamples } from "@/lib/native-station-sample-source"
import { createOfflineMediaStore } from "@/lib/offline-media"
import { createOfflineAudioRuntime } from "./offline-audio-runtime"

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
let runtime: ReturnType<typeof createOfflineAudioRuntime> | undefined
type StationRequest = { id: string; controller: AbortController; ready: boolean }
let stationRequest: StationRequest | undefined

function ensureSession(token: number) {
  if (playingToken === 0) playingToken = token
  return playingToken === token
}

function getRuntime() {
  if (runtime) return runtime
  output = new Tone.Gain(1).toDestination()
  runtime = createOfflineAudioRuntime(store, {
    destination: output,
    prepareStationSamples: id => {
      const request = stationRequest
      if (request?.id !== id) throw new Error("The station request was superseded.")
      return prepareNativeStationSamples({ kind: "station", id, station: getAtmosphereStationById(id) }, store, {
        signal: request.controller.signal,
      })
    },
  })
  return runtime
}

/** A station has its own cancellation scope inside the service-owned mixer. */
async function clearStation() {
  const previous = stationRequest
  if (!previous) return
  stationRequest = undefined
  previous.controller.abort()
  await runtime?.stop(previous.id)
}

/** The foreground service owns this document. The UI never loads this entry
 * and cannot create a second audio graph while reattaching to the service. */
const player = {
  async play(id: string, token: number, revision: number) {
    if (!ensureSession(token)) return
    const previous = clearStation()
    const request: StationRequest = { id, controller: new AbortController(), ready: false }
    stationRequest = request
    try {
      await previous
      if (stationRequest !== request) return
      const station = getAtmosphereStationById(id)
      if (!hasNativeStationPlayer(station)) throw new Error("This station has no supported native engine.")
      const played = await getRuntime().play({ kind: "station", id, station: { runtime: { pieceId: station.runtime.pieceId } } })
      if (stationRequest !== request) return
      if (!played) throw new Error("The station could not start.")
      request.ready = true
      report(`station-playing:${token}:${revision}`)
    } catch {
      if (stationRequest !== request) return
      void clearStation().catch(() => undefined)
      report(`station-failed:${token}:${revision}`)
    }
  },

  stopStation(token: number) {
    if (token === playingToken) void clearStation().catch(() => undefined)
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
    const result = {
      peak: 0, currentTime: context.currentTime, state: context.state,
      stationId: stationRequest?.ready ? stationRequest.id : null,
    }
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
