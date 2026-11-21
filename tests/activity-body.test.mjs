import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { describe, it } from "node:test"
import { BODY_REGION_OPTIONS, BODY_REGION_ANCHORS, BODY_REGION_SELECTION_LIMIT, bodyRegionFacesCamera, toggleBodyRegion } from "../lib/body-regions.js"
import { normalizeClientWellnessEntryInput } from "../lib/client-wellness.js"
import { createCompiledModuleLoader, createElement, findElements, passThroughElement } from "./helpers/compiled-module.mjs"
import * as regions from "../lib/body-regions.js"

describe("Activity body-region recording", () => {
  it("preserves the old tokens and maps all 52 distinct sided regions to real bones", async () => {
    assert.deepEqual(BODY_REGION_OPTIONS, ["head", "neck", "shoulders", "chest", "abdomen", "upper back", "low back", "hips", "arms", "hands", "thighs", "knees", "calves", "ankles", "feet"])
    const bytes = await readFile(new URL("../public/body-models/human-base-rigged.glb", import.meta.url))
    const asset = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString())
    const bones = new Set(asset.nodes.map((node) => node.name))
    assert.equal(BODY_REGION_ANCHORS.length, 52)
    assert.equal(new Set(BODY_REGION_ANCHORS.map((anchor) => anchor.id)).size, 52)
    for (const anchor of BODY_REGION_ANCHORS) {
      assert.ok(bones.has(anchor.bone)); if (anchor.toward) assert.ok(bones.has(anchor.toward))
      assert.equal(anchor.offset.length, 3); assert.ok(anchor.offset.every(Number.isFinite))
      assert.ok(["front", "back", "both"].includes(anchor.facing))
      assert.ok(anchor.id.startsWith(anchor.side.toLowerCase() + " "))
    }
    assert.equal(BODY_REGION_ANCHORS.find((anchor) => anchor.id === "left chest").facing, "front")
    assert.equal(BODY_REGION_ANCHORS.find((anchor) => anchor.id === "left upper back").facing, "back")
    for (const side of ["left", "right"]) {
      for (const part of ["upper arm", "forearm", "shin", "calf", "elbow", "wrist", "palm", "back of hand", "heel", "toes"]) assert.ok(BODY_REGION_ANCHORS.some((anchor) => anchor.id === `${side} ${part}`))
    }
  })
  it("toggles one region while preserving the rest of an existing draft", () => {
    const draft = ["neck", "legacy saved label"]
    assert.deepEqual(toggleBodyRegion(draft, "hands"), ["neck", "legacy saved label", "hands"])
    assert.deepEqual(toggleBodyRegion(draft, "neck"), ["legacy saved label"])
    assert.equal(toggleBodyRegion(draft, "shoulder"), draft)
  })
  it("keeps sides and arm/lower-leg segments independent without converting old values", () => {
    let draft = ["arms", "hands", "legacy saved label"]
    for (const value of ["left upper arm", "left forearm", "right forearm", "left shin", "left calf"]) draft = toggleBodyRegion(draft, value)
    assert.equal(draft.length, 8)
    draft = toggleBodyRegion(draft, "left forearm")
    assert.ok(!draft.includes("left forearm")); assert.ok(draft.includes("right forearm"))
    assert.deepEqual(draft.slice(0, 3), ["arms", "hands", "legacy saved label"])
    const saved = normalizeClientWellnessEntryInput({ category: "activity", regions: draft })
    assert.deepEqual(saved.regions, draft)
  })
  it("hides far-side and wrong-surface markers from all camera directions", () => {
    const find = (id) => BODY_REGION_ANCHORS.find((item) => item.id === id)
    for (const direction of [{ x: 1, z: 0.02 }, { x: 0.65, z: 0.76 }]) {
      assert.equal(bodyRegionFacesCamera(find("left forearm"), direction), true)
      assert.equal(bodyRegionFacesCamera(find("right forearm"), direction), false)
    }
    assert.equal(bodyRegionFacesCamera(find("left forearm"), { x: -1, z: 0.02 }), false)
    assert.equal(bodyRegionFacesCamera(find("right forearm"), { x: -1, z: 0.02 }), true)
    for (const side of ["left", "right"]) {
      assert.equal(bodyRegionFacesCamera(find(`${side} shin`), { x: 0, z: 1 }), true)
      assert.equal(bodyRegionFacesCamera(find(`${side} calf`), { x: 0, z: 1 }), false)
      assert.equal(bodyRegionFacesCamera(find(`${side} shin`), { x: 0, z: -1 }), false)
      assert.equal(bodyRegionFacesCamera(find(`${side} calf`), { x: 0, z: -1 }), true)
    }
  })
  it("matches the existing save bound and still allows removal when full", () => {
    const draft = BODY_REGION_ANCHORS.slice(0, BODY_REGION_SELECTION_LIMIT).map((item) => item.id)
    assert.equal(toggleBodyRegion(draft, "right shin"), draft)
    assert.equal(toggleBodyRegion(draft, draft[0]).length, BODY_REGION_SELECTION_LIMIT - 1)
    assert.deepEqual(normalizeClientWellnessEntryInput({ category: "activity", regions: draft }).regions, draft)
  })
  it("releases the inactive viewer while keeping serialized selections mounted", async () => {
    const load = createCompiledModuleLoader(import.meta.url)
    const { BodyRegionSelector } = load(await readFile(new URL("../components/wellness/body-region-selector.tsx", import.meta.url), "utf8"), "body-region-selector.tsx", {
      "react/jsx-runtime": { jsx: createElement, jsxs: createElement },
      "@/lib/utils": { cn: (...values) => values.filter(Boolean).join(" ") },
      "@/lib/body-regions": regions,
      "@/components/body/body-joint-viewer": { BodyJointViewer: passThroughElement("body-viewer") },
    })
    const base = { interactive: true, selectedRegions: ["neck", "hands"], onChange() {} }
    const inactive = BodyRegionSelector({ ...base, active: false })
    assert.equal(findElements(inactive, (node) => node.type === "input" && node.props.name === "regions").length, 2)
    assert.equal(findElements(inactive, (node) => node.props.mode === "regions").length, 0)
    const active = BodyRegionSelector({ ...base, active: true, disabled: true })
    assert.equal(active.props.disabled, true)
    const viewer = findElements(active, (node) => node.props.mode === "regions")[0]
    assert.equal(viewer.props.disabled, true)
    assert.deepEqual(viewer.props.selectedRegions, ["neck", "hands"])
  })
  it("retains Activity duration and detail with the existing bounds and allowlist", () => {
    const result = normalizeClientWellnessEntryInput({ category: "activity", regions: ["chest", "hands"], metadata: { durationMinutes: "45", activityContext: "  Fictional walk  ", bodyPosition: "standing", movementEffect: "better", privateExtra: "drop" } })
    assert.deepEqual(result.regions, ["chest", "hands"])
    assert.deepEqual(result.metadata, { durationMinutes: 45, activityContext: "Fictional walk" })
    assert.equal(normalizeClientWellnessEntryInput({ category: "activity", metadata: { durationMinutes: 99999 } }).metadata.durationMinutes, 10080)
    assert.equal(normalizeClientWellnessEntryInput({ category: "activity", metadata: { durationMinutes: "" } }).metadata.durationMinutes, undefined)
    assert.deepEqual(normalizeClientWellnessEntryInput({ category: "sleep", metadata: { durationMinutes: 45, activityContext: "walk" } }).metadata, {})
  })
})
