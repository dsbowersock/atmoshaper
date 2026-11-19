// @ts-check

/** @typedef {{ label: string, seconds: number, scale: number }} BreathingPhase */
/** @typedef {{ id: string, title: string, description: string, phases: BreathingPhase[] }} BreathingPreset */

/** Existing timing patterns shared by the page and the quick-access guide. */
export const BREATHING_PRESETS = Object.freeze(/** @type {BreathingPreset[]} */ ([
  { id: "coherent", title: "Coherent", description: "5 in, 5 out", phases: [
    { label: "Inhale", seconds: 5, scale: 1.08 },
    { label: "Exhale", seconds: 5, scale: 0.94 },
  ] },
  { id: "box", title: "Box", description: "4 sides", phases: [
    { label: "Inhale", seconds: 4, scale: 1.08 },
    { label: "Hold", seconds: 4, scale: 1.08 },
    { label: "Exhale", seconds: 4, scale: 0.94 },
    { label: "Hold", seconds: 4, scale: 0.94 },
  ] },
  { id: "settle", title: "Settle", description: "4, 7, 8", phases: [
    { label: "Inhale", seconds: 4, scale: 1.08 },
    { label: "Hold", seconds: 7, scale: 1.08 },
    { label: "Exhale", seconds: 8, scale: 0.94 },
  ] },
]))

/**
 * Derives every visual from elapsed session time. Exact boundaries advance to
 * the next phase; interpolation spans the whole inhale/exhale duration.
 * @param {string} presetId
 * @param {number} elapsedMs
 */
export function getBreathingState(presetId, elapsedMs) {
  const preset = BREATHING_PRESETS.find((candidate) => candidate.id === presetId) ?? BREATHING_PRESETS[0]
  const elapsed = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0
  const totalMs = preset.phases.reduce((sum, phase) => sum + phase.seconds * 1000, 0)
  const withinCycle = elapsed % totalMs
  let cursor = 0
  let phaseIndex = 0
  for (; phaseIndex < preset.phases.length - 1; phaseIndex += 1) {
    const duration = preset.phases[phaseIndex].seconds * 1000
    if (withinCycle < cursor + duration) break
    cursor += duration
  }
  const phase = preset.phases[phaseIndex]
  const progress = (withinCycle - cursor) / (phase.seconds * 1000)
  const previous = preset.phases[(phaseIndex + preset.phases.length - 1) % preset.phases.length]
  return { preset, phase, phaseIndex, progress,
    remainingSeconds: Math.ceil(phase.seconds * (1 - progress)),
    cycle: Math.floor(elapsed / totalMs) + 1,
    scale: previous.scale + (phase.scale - previous.scale) * progress,
  }
}

/**
 * Modifier-based access does not steal ordinary letters or browser commands.
 * Physical KeyB also handles Option changing the character on macOS.
 * @param {{ key?: string, code?: string, altKey?: boolean, shiftKey?: boolean, ctrlKey?: boolean, metaKey?: boolean, repeat?: boolean, isComposing?: boolean, defaultPrevented?: boolean }} event
 */
export function isBreathingShortcut(event) {
  return (event.code === "KeyB" || event.key?.toLowerCase() === "b")
    && event.altKey === true && event.shiftKey === true
    && !event.ctrlKey && !event.metaKey && !event.repeat
    && !event.isComposing && !event.defaultPrevented
}
