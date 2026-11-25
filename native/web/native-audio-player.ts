import * as Tone from "tone"
import { getAtmosphereStationById } from "@/lib/atmosphere/stations"
import { getAtmoShaperProductionConcept } from "@/lib/atmoshaper/production-catalog-runtime"
import { prepareNativeAmbientPack } from "@/lib/native-ambient-source"
import { hasNativeStationPlayer } from "@/lib/native-station-catalog"
import { prepareNativeStationSamples } from "@/lib/native-station-sample-source"
import { createOfflineMediaStore, OfflinePackVerificationError } from "@/lib/offline-media"
import { createOfflineAudioRuntime } from "./offline-audio-runtime"

const regionalAmbientId = "moodist-heavy-rain"
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
let paused = false
let contextChange: Promise<void> = Promise.resolve()
type StationRequest = { id: string; controller: AbortController; ready: boolean; savedOnly: boolean; savedDecodeFailed?: boolean }
type MixRequest = { request: number; controller: AbortController; savedOnly: boolean; savedDecodeFailed?: boolean }
let stationRequest: StationRequest | undefined
const mix = new Map<string, MixRequest>()

function ensureSession(token: number) {
  if (playingToken === 0) playingToken = token
  return token === playingToken
}

/** Order suspend/resume calls even when Android changes focus during startup. */
function updateContext() {
  const context = Tone.getContext().rawContext as AudioContext
  const change = contextChange.then(() => paused ? context.suspend() : context.resume())
  contextChange = change.catch(() => undefined)
  return change
}

function getRuntime() {
  if (runtime) return runtime
  output = new Tone.Gain(paused ? 0 : 1).toDestination()
  runtime = createOfflineAudioRuntime(store, {
    destination: output,
    activate: updateContext,
    bufferedAmbientRegionId: regionalAmbientId,
    prepareStationSamples: async id => {
      const request = stationRequest
      if (request?.id !== id) throw new Error("The station request was superseded.")
      try {
        return await prepareNativeStationSamples({ id, kind: "station", station: getAtmosphereStationById(id) }, store, {
          signal: request.controller.signal,
          isOnline: request.savedOnly ? false : undefined,
        })
      } catch (error) {
        if (!request.savedOnly) throw error
        throw new OfflinePackVerificationError("Saved station samples could not be verified.", { cause: error })
      }
    },
    async reportSavedDecodeFailure(id, sample) {
      const request = stationRequest?.id === id ? stationRequest : mix.get(id)
      if (!request) return
      request.savedDecodeFailed = true
      await store.markDecodeFailure(id, sample).catch(() => undefined)
    },
    prepareAmbientPack: async id => {
      const attempt = mix.get(id)
      try {
        return await prepareNativeAmbientPack({ id, kind: "ambient", concept: getAtmoShaperProductionConcept(id) }, store, {
          signal: attempt?.controller.signal,
          isOnline: attempt?.savedOnly ? false : undefined,
        })
      } catch (error) {
        if (!attempt?.savedOnly) throw error
        throw new OfflinePackVerificationError("Saved recordings could not be verified.", { cause: error })
      }
    },
  })
  return runtime
}

/** One cancellation scope per station selection inside the shared mixer. */
async function clearStation() {
  const previous = stationRequest
  if (!previous) return
  stationRequest = undefined
  previous.controller.abort()
  await runtime?.stop(previous.id)
}

function reportLayerFailure(id: string, error?: unknown) {
  const attempt = mix.get(id)
  if (!attempt) return
  mix.delete(id)
  attempt.controller.abort()
  const status = attempt.savedDecodeFailed || error instanceof OfflinePackVerificationError ? "layer-unreadable" : "layer-failed"
  report(`${status}:${playingToken}:${attempt.request}`)
}

window.addEventListener("atmoshaper:offline-audio-error", event => reportLayerFailure((event as CustomEvent).detail.id))

/** The foreground service owns this document. The UI never loads this entry
 * and cannot create a second audio graph while reattaching to the service. */
const player = {
  async play(id: string, token: number, revision: number, savedOnly = false) {
    if (!ensureSession(token)) return
    const previous = clearStation()
    const request: StationRequest = { id, controller: new AbortController(), ready: false, savedOnly }
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
    } catch (error) {
      if (stationRequest !== request) return
      void clearStation().catch(() => undefined)
      const status = request.savedDecodeFailed || error instanceof OfflinePackVerificationError ? "station-unreadable" : "station-failed"
      report(`${status}:${token}:${revision}`)
    }
  },

  stopStation(token: number) {
    if (token === playingToken) void clearStation().catch(() => undefined)
  },

  async setPaused(next: boolean, token: number) {
    if (!ensureSession(token)) return
    paused = next
    if (output) output.gain.value = next ? 0 : 1
    try {
      await updateContext()
      if (paused === next) report(`${next ? "paused" : "playing"}:${token}`)
    } catch {
      report(`failed:${token}`)
    }
  },

  async playLayer(id: string, kind: string, volume: number, token: number, request: number, savedOnly = false) {
    if (!ensureSession(token) || mix.has(id)) return
    const attempt = { request, controller: new AbortController(), savedOnly }
    mix.set(id, attempt)
    try {
      const validNoise = kind === "generated" && /^noise:(white|pink|brown)$/.test(id)
      // Android WebView's media elements request audio focus themselves and
      // suspend the foreground mix. This owner can only play buffer voices.
      const validAmbient = kind === "ambient" && (id === regionalAmbientId ||
        getAtmoShaperProductionConcept(id).playbackMode?.kind === "prebaked-intro-loop")
      if (!validNoise && !validAmbient) throw new Error("This sound is unavailable in the native mixer.")
      const played = await getRuntime().play({ id, kind }, undefined, volume)
      if (mix.get(id) !== attempt) return
      if (played) report(`layer-playing:${token}:${request}`)
      else reportLayerFailure(id)
    } catch (error) {
      if (mix.get(id) === attempt) reportLayerFailure(id, error)
    }
  },

  async stopLayer(id: string, token: number, request: number) {
    if (token !== playingToken) return
    const attempt = mix.get(id)
    if (attempt?.request === request) {
      mix.delete(id)
      attempt.controller.abort()
    }
    try {
      await runtime?.stop(id)
    } finally {
      report(`layer-stopped:${token}:${request}`)
    }
  },

  setLayerVolume(id: string, volume: number, token: number) {
    if (token === playingToken && mix.has(id)) runtime?.volume(id, volume)
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
