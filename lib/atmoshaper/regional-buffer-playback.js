import { chooseSignatureSoundRegionalWindow } from "./signature-sound-preview.js"

/**
 * Enqueues one future region on the shared audio clock. Ticks only replenish
 * the queue. The scheduled source offsets and linear fades freeze together
 * whenever the owning AudioContext is suspended.
 * @param {{context: AudioContext, data: ArrayBuffer, destination: AudioNode,
 *   policy: {kind: "random-region-loop", regionStartSeconds: number, regionEndSeconds: number,
 *     minimumLoopSeconds: number, crossfadeSeconds: number}, gainDb: number,
 *   isCurrent?: () => boolean, random?: () => number,
 *   subscribe: (callback: () => void) => () => void,
 *   reportFailure: (error: unknown) => void}} options
 */
export async function startRegionalBufferPlayback({
  context, data, destination, policy, gainDb, isCurrent = () => true, random, subscribe, reportFailure,
}) {
  // decodeAudioData transfers its input. Keep the verified pack bytes intact.
  const buffer = await context.decodeAudioData(data.slice(0))
  if (!isCurrent()) throw new DOMException("Playback was stopped.", "AbortError")
  if (policy.regionEndSeconds > buffer.duration + 0.001) {
    throw new Error("AtmoShaper regional loop exceeds the exact decoded source duration")
  }
  const fade = policy.crossfadeSeconds
  const level = 10 ** (gainDb / 20)
  const voices = new Set()
  let unsubscribe
  let stopped = false
  let queuedStart
  let nextStart

  function schedule(when, first) {
    const region = chooseSignatureSoundRegionalWindow(policy, first, random)
    const duration = region.endSeconds - region.startSeconds
    const fadeOutStart = when + (duration - fade)
    const source = context.createBufferSource()
    const gain = context.createGain()
    function release() {
      source.onended = null
      source.disconnect()
      gain.disconnect()
      voices.delete(cancel)
    }
    function cancel() {
      try { source.stop() } catch { /* The source may not have started. */ }
      release()
    }
    voices.add(cancel)
    source.onended = release
    source.buffer = buffer
    source.connect(gain)
    gain.connect(destination)
    gain.gain.setValueAtTime(first ? level : 0, when)
    if (!first) gain.gain.linearRampToValueAtTime(level, when + fade)
    if (first || fadeOutStart > when + fade) gain.gain.setValueAtTime(level, fadeOutStart)
    gain.gain.linearRampToValueAtTime(0, fadeOutStart + fade)
    source.start(when, region.startSeconds, duration)
    queuedStart = when
    nextStart = fadeOutStart
  }

  function stop() {
    if (stopped) return
    stopped = true
    unsubscribe?.()
    for (const cancel of voices) cancel()
  }

  function replenish() {
    if (stopped || context.currentTime < queuedStart) return
    try {
      if (context.currentTime >= nextStart) throw new Error("AtmoShaper regional playback missed a transition")
      schedule(nextStart, false)
    } catch (error) {
      stop()
      reportFailure(error)
    }
  }

  try {
    schedule(context.currentTime, true)
    schedule(nextStart, false)
    unsubscribe = subscribe(replenish)
    return stop
  } catch (error) {
    stop()
    throw error
  }
}
