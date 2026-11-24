import assert from "node:assert/strict"
import test from "node:test"
import { exportClockAppearance } from "../lib/native-clock-appearance-transfer.js"

const guestBackgrounds = new Set(["massage-lab-moving-gradient", "static-gradient", "solid-color"])

// Model the observable IndexedDB result when the device has one shared Clock
// record and no earlier Preferences database. Writes are absent from the seam.
function sharedClockStorage(settings) {
  return {
    open() {
      const request = {}
      const transaction = {
        objectStore: () => ({
          get: () => ({ result: { version: 1, settings } }),
        }),
      }
      request.result = { transaction: () => transaction, close() {} }
      queueMicrotask(() => {
        request.onsuccess()
        transaction.oncomplete()
      })
      return request
    },
  }
}

test("an earlier premium choice retains its ID while importing a neutral surface", async () => {
  const source = { backgroundId: "massage-lab-3d-globe", movingBackgroundEnabled: false }
  const appearance = await exportClockAppearance(sharedClockStorage(source), null, guestBackgrounds)
  assert.equal(appearance.rememberedBackgroundId, "massage-lab-3d-globe")
  assert.equal(appearance.background, "neutral")
  assert.equal(appearance.motion, false)
  assert.deepEqual(source, { backgroundId: "massage-lab-3d-globe", movingBackgroundEnabled: false })
})

test("an earlier free radial gradient retains its geometry and ordered stops", async () => {
  const source = {
    backgroundId: "static-gradient",
    staticGradientType: "radial",
    staticGradientCenterX: 25,
    staticGradientCenterY: 70,
    staticGradientRadialShape: "circle",
    staticGradientRadialSize: "closest-corner",
    staticGradientColorCount: 3,
    staticGradientStopPositions: [5, 40, 96],
  }
  const appearance = await exportClockAppearance(sharedClockStorage(source), null, guestBackgrounds)
  assert.equal(appearance.rememberedBackgroundId, "static-gradient")
  assert.equal(appearance.background, "static-gradient")
  assert.equal(appearance.gradientType, "radial")
  assert.equal(appearance.gradientCenterX, 25)
  assert.equal(appearance.gradientCenterY, 70)
  assert.equal(appearance.gradientRadialShape, "circle")
  assert.equal(appearance.gradientRadialSize, "closest-corner")
  assert.deepEqual(appearance.gradientStops, [5, 40, 96])
  assert.equal(appearance.gradientColors.length, 3)
})
