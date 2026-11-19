import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { BREATHING_PRESETS, getBreathingState, isBreathingShortcut } from "../lib/breathing-guide.js"

describe("breathing timeline", () => {
  it("preserves all three existing timing patterns", () => {
    assert.deepEqual(BREATHING_PRESETS.map((p) => p.phases.map((phase) => phase.seconds)), [[5, 5], [4, 4, 4, 4], [4, 7, 8]])
  })
  for (const [preset, elapsed, label, seconds, cycle] of [
    ["coherent", 0, "Inhale", 5, 1], ["coherent", 4999, "Inhale", 1, 1],
    ["coherent", 5000, "Exhale", 5, 1], ["coherent", 10000, "Inhale", 5, 2],
    ["box", 4000, "Hold", 4, 1], ["box", 8000, "Exhale", 4, 1],
    ["box", 12000, "Hold", 4, 1], ["box", 16000, "Inhale", 4, 2],
    ["settle", 4000, "Hold", 7, 1], ["settle", 11000, "Exhale", 8, 1],
    ["settle", 19000, "Inhale", 4, 2],
  ]) {
    it(`${preset} at ${elapsed}ms advances to the correct phase/countdown`, () => {
      const state = getBreathingState(preset, elapsed)
      assert.equal(state.phase.label, label)
      assert.equal(state.remainingSeconds, seconds)
      assert.equal(state.cycle, cycle)
    })
  }
  it("interpolates inhale and exhale instead of jumping to their end size", () => {
    assert.equal(getBreathingState("coherent", 0).scale, 0.94)
    assert.equal(getBreathingState("coherent", 2500).scale, 1.01)
    assert.equal(getBreathingState("coherent", 5000).scale, 1.08)
    assert.equal(getBreathingState("coherent", 7500).scale, 1.01)
    assert.equal(getBreathingState("box", 6000).scale, 1.08)
  })
  it("handles delayed ticks spanning multiple complete cycles", () => {
    const state = getBreathingState("coherent", 35000)
    assert.equal(state.phase.label, "Exhale")
    assert.equal(state.cycle, 4)
    assert.equal(state.remainingSeconds, 5)
  })
  for (const elapsed of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
    it(`normalizes invalid elapsed time ${elapsed}`, () => {
      assert.equal(getBreathingState("missing", elapsed).preset.id, "coherent")
      assert.equal(getBreathingState("missing", elapsed).remainingSeconds, 5)
    })
  }
})

describe("breathing shortcut", () => {
  const shortcut = { key: "B", code: "KeyB", altKey: true, shiftKey: true }
  it("accepts the modifier chord and macOS physical key", () => {
    assert.equal(isBreathingShortcut(shortcut), true)
    assert.equal(isBreathingShortcut({ ...shortcut, key: "ı" }), true)
  })
  for (const override of [{ altKey: false }, { shiftKey: false }, { ctrlKey: true }, { metaKey: true }, { repeat: true }, { isComposing: true }, { defaultPrevented: true }, { key: "X", code: "KeyX" }]) {
    it(`leaves unrelated or already owned keyboard input alone: ${JSON.stringify(override)}`, () => {
      assert.equal(isBreathingShortcut({ ...shortcut, ...override }), false)
    })
  }
})
