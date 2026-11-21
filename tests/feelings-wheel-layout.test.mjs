import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { FEELING_FAMILIES, ALL_FEELING_WORDS } from "../lib/wellness-reflection.js"
import { buildFeelingWheelSegments, feelingSectorPath, feelingAngleDelta, feelingWheelFrame } from "../lib/feelings-wheel-layout.js"

describe("Continuous feelings wheel", () => {
  const segments = buildFeelingWheelSegments(), byKey = new Map(segments.map((segment) => [segment.key, segment]))
  it("keeps every word and all three levels in a single non-overlapping hierarchy", () => {
    assert.equal(new Set(segments.map((segment) => segment.key)).size, segments.length)
    assert.deepEqual(new Set(segments.map((segment) => segment.word)), new Set(ALL_FEELING_WORDS))
    assert.equal(segments.filter((segment) => segment.level === 1).length, FEELING_FAMILIES.length)
    for (const segment of segments) {
      assert.ok(segment.end > segment.start)
      assert.equal(segment.path.length, segment.level)
      assert.equal(segment.path.at(-1), segment.word)
      assert.ok(!feelingSectorPath(segment).includes("NaN"))
      if (segment.parent) {
        const parent = byKey.get(segment.parent)
        assert.ok(parent.children.includes(segment.key))
        assert.ok(segment.start >= parent.start - 1e-10 && segment.end <= parent.end + 1e-10)
        assert.equal(segment.inner, parent.outer)
      }
      if (segment.children.length) {
        const children = segment.children.map((key) => byKey.get(key))
        assert.ok(Math.abs(children[0].start - segment.start) < 1e-10)
        assert.ok(Math.abs(children.at(-1).end - segment.end) < 1e-10)
        children.slice(1).forEach((child, index) => assert.ok(Math.abs(child.start - children[index].end) < 1e-10))
      }
    }
  })
  it("keeps the overview inside both viewport dimensions and all rings across phone reading view", () => {
    for (const aspect of [0.4, 0.8, 1.15, 2.4]) {
      const frame = feelingWheelFrame(aspect, 1)
      assert.ok(frame.x <= -332 && frame.x + frame.width >= 332)
      assert.ok(frame.y <= -332 && frame.y + frame.height >= 332)
    }
    const phone = feelingWheelFrame(1.15, 2)
    assert.ok(phone.x <= 0 && phone.x + phone.width >= 332)
    assert.ok(phone.y < 0 && phone.y + phone.height > 0)
    const moved = feelingWheelFrame(1.15, 2, { x: 30, y: -20 })
    assert.equal(moved.x, phone.x + 30); assert.equal(moved.y, phone.y - 20)
  })
  it("rotates smoothly across the angle seam in either direction", () => {
    assert.ok(Math.abs(feelingAngleDelta(Math.PI - 0.1, -Math.PI + 0.1) - 0.2) < 1e-10)
    assert.ok(Math.abs(feelingAngleDelta(-Math.PI + 0.1, Math.PI - 0.1) + 0.2) < 1e-10)
    assert.equal(feelingAngleDelta(1, 1), 0)
  })
})
