import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import { describe, it } from "node:test"
import { ROM_AREAS, ROM_MOVEMENTS, parseRomAngles, romBoneName, romMeasurementContext } from "../lib/rom-movements.js"
import { fitBodyViewBounds } from "../lib/body-view-framing.js"

describe("Guided ROM choices and local body asset", () => {
  it("frames wide, tall and deep swept limb bounds on phones and landscape views", () => {
    for (const bounds of [{ min: [-0.8, -0.2, -0.3], max: [0.8, 0.2, 0.3] }, { min: [0.1, 0.2, -0.1], max: [0.3, 1.1, 0.2] }, { min: [-0.1, -0.1, -0.6], max: [0.1, 0.1, 0.6] }]) {
      for (const aspect of [0.4, 0.88, 2.5]) {
        const fit = fitBodyViewBounds(bounds, 33, aspect)
        assert.ok(fit)
        const vertical = Math.tan(33 * Math.PI / 360)
        for (const x of [bounds.min[0], bounds.max[0]]) for (const y of [bounds.min[1], bounds.max[1]]) for (const z of [bounds.min[2], bounds.max[2]]) {
          const depth = fit.distance - (z - fit.center[2])
          assert.ok(depth > 0)
          assert.ok(Math.abs(x - fit.center[0]) / (depth * vertical * aspect) < 0.85)
          assert.ok(Math.abs(y - fit.center[1]) / (depth * vertical) < 0.85)
        }
      }
    }
    assert.equal(fitBodyViewBounds({ min: [0, 0, 0], max: [1, 1, 1] }, 33, 0), null)
    assert.equal(fitBodyViewBounds({ min: [0, 0, 0], max: [Infinity, 1, 1] }, 33, 1), null)
  })
  it("offers distinct plain-language choices for all ten areas and keeps the original neck comparison label", () => {
    assert.equal(ROM_AREAS.length, 10)
    assert.equal(new Set(ROM_MOVEMENTS.map((item) => item.id)).size, ROM_MOVEMENTS.length)
    for (const area of ROM_AREAS) {
      const movements = ROM_MOVEMENTS.filter((item) => item.area === area.id)
      assert.ok(movements.length >= 2)
      assert.equal(new Set(movements.map((item) => item.name)).size, movements.length)
      for (const movement of movements) {
        assert.ok(movement.label && movement.cue && movement.name)
        assert.ok(["x", "y", "z"].includes(movement.plane))
        assert.ok(Number.isFinite(movement.radians) && Math.abs(movement.radians) < Math.PI)
      }
    }
    assert.equal(ROM_MOVEMENTS.find((item) => item.id === "neck-turn").name, "Cervical rotation")
    assert.equal(romBoneName("not-a-joint", "Left"), null)
  })
  it("rejects blank, non-finite or out-of-bound angles instead of recording a zero", () => {
    for (const [start, end] of [["", "1"], ["0", " "], ["NaN", "20"], ["0", "Infinity"], ["361", "0"], ["0", "-361"]]) assert.equal(parseRomAngles(start, end), null)
    assert.deepEqual(parseRomAngles("0", "43.27"), { baselineAngle: 0, endAngle: 43.3 })
    assert.deepEqual(parseRomAngles("-10", "0"), { baselineAngle: -10, endAngle: 0 })
  })
  it("distinguishes each captured movement, side and phone axis", () => {
    const original = romMeasurementContext("Cervical rotation", "Left", "alpha")
    for (const context of [["Cervical rotation", "Right", "alpha"], ["Cervical flexion", "Left", "alpha"], ["Cervical rotation", "Left", "beta"]]) assert.notEqual(romMeasurementContext(...context), original)
    assert.equal(romMeasurementContext("Cervical rotation", "Left", "alpha"), original)
  })
  it("pins a self-contained rig and resolves every selectable joint on both sides", async () => {
    const bytes = await readFile(new URL("../public/body-models/human-base-rigged.glb", import.meta.url))
    assert.equal(bytes.subarray(0, 4).toString(), "glTF")
    assert.equal(createHash("sha256").update(bytes).digest("hex"), "f3cd655e44af0a79786b1b4349c4acf1ae342fe6bd0d5fc714e68470dea1b429")
    const asset = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString())
    assert.match(asset.asset.copyright, /CC0/)
    assert.ok(asset.buffers.every((buffer) => !buffer.uri))
    assert.equal(asset.images?.length ?? 0, 0)
    assert.equal(asset.animations?.length ?? 0, 0)
    assert.equal(asset.skins[0].joints.length, 53)
    const names = new Set(asset.nodes.map((node) => node.name))
    for (const area of ROM_AREAS) for (const side of ["Left", "Right"]) assert.ok(names.has(romBoneName(area.id, side)))
    for (const movement of ROM_MOVEMENTS) for (const side of ["_l", "_r"]) {
      for (const pose of [...movement.startingPose ?? [], ...movement.poses ?? []]) assert.ok(names.has(pose.bone + side), `mapped ${movement.id}: ${pose.bone}${side}`)
      if (movement.focusBone) assert.ok(names.has(movement.focusBone + side))
      if (movement.area === "toes" && (movement.part !== "all" || /spread|together/.test(movement.id))) assert.equal(movement.demo, false)
    }
    for (const primitive of asset.meshes.flatMap((mesh) => mesh.primitives)) assert.ok(Number.isInteger(primitive.attributes.JOINTS_0) && Number.isInteger(primitive.attributes.WEIGHTS_0))
  })
})
