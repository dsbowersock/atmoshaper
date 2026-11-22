/** Synthesize the existing Clock's two-note alert; no sound file or network.
 * The caller must resume its AudioContext from a user gesture before calling.
 * @param {BaseAudioContext} context
 * @param {number} volume
 */
export function playChimerChime(context, volume = 0.7) {
  const level = Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : 0.7
  if (level === 0) return
  const now = context.currentTime
  const gain = context.createGain()
  const peakGain = Math.max(0.0001, Math.min(0.18, 0.2 * level))
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(peakGain, now + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9)
  gain.connect(context.destination)
  const firstTone = context.createOscillator()
  firstTone.type = "sine"
  firstTone.frequency.setValueAtTime(784, now)
  firstTone.connect(gain)
  firstTone.start(now)
  firstTone.stop(now + 0.32)
  firstTone.onended = () => firstTone.disconnect()
  const secondTone = context.createOscillator()
  secondTone.type = "sine"
  secondTone.frequency.setValueAtTime(1046.5, now + 0.28)
  secondTone.connect(gain)
  secondTone.start(now + 0.28)
  secondTone.stop(now + 0.9)
  secondTone.onended = () => { secondTone.disconnect(); gain.disconnect() }
}
