import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { describe, it } from "node:test"
import { BODY_PARTS, BODY_SURFACES, BODY_LOCATION_IDS, SURFACE_VIEW_DIRECTIONS, bodySurfaceFacesCamera, toggleBodySurface, bodyViewForNormal } from "../lib/body-surface-regions.js"
import { normalizeClientWellnessEntryInput, sanitizeClientWellnessLogMetadata } from "../lib/client-wellness.js"
import { buildClientWellnessPatternReport } from "../lib/client-wellness-patterns.js"
import { FEELING_FAMILIES, normalizeContextCheckIn, reflectionWords } from "../lib/wellness-reflection.js"

describe("Surface locations and progressive detail", () => {
  it("resolves every part, surface and finger to the pinned rig without duplicate labels", async () => {
    const bytes = await readFile(new URL("../public/body-models/human-base-rigged.glb", import.meta.url))
    const asset = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString())
    const bones = new Set(asset.nodes.map((node) => node.name))
    assert.equal(new Set(BODY_SURFACES.map((item) => item.id)).size, BODY_SURFACES.length)
    assert.equal(new Set(BODY_PARTS.map((item) => item.id)).size, BODY_PARTS.length)
    for (const item of [...BODY_PARTS, ...BODY_SURFACES]) {
      assert.ok(bones.has(item.bone), item.bone)
      if (item.toward) assert.ok(bones.has(item.toward), item.toward)
      assert.ok(item.offset.every(Number.isFinite))
      if (item.normal) assert.equal(Math.hypot(...item.normal), 1)
      assert.ok(item.id.length <= 80)
    }
    for (const part of BODY_PARTS) {
      assert.ok(BODY_SURFACES.some((item) => item.partId === part.id && !item.detail))
      assert.ok(BODY_SURFACES.some((item) => item.partId === part.id && item.detail))
    }
    assert.equal(BODY_SURFACES.find((item) => item.id === "left front thumb, base").bone, "thumb_01_l")
    assert.equal(BODY_SURFACES.find((item) => item.id === "left front thumb, tip").bone, "thumb_03_l")
  })
  it("keeps front/back/inner/outer thigh selections independent through save normalization", () => {
    let selected = ["old broad label"]
    for (const surface of ["front", "back", "inner", "outer"]) selected = toggleBodySurface(selected, `left ${surface} thigh`)
    assert.equal(selected.length, 5)
    assert.deepEqual(normalizeClientWellnessEntryInput({ category: "activity", regions: selected }).regions, selected)
    assert.deepEqual(normalizeClientWellnessEntryInput({ category: "incident", regions: ["left thigh"] }).regions, ["left thigh"])
    assert.ok(BODY_LOCATION_IDS.has("left sole of foot")); assert.ok(BODY_LOCATION_IDS.has("left inner foot / arch")); assert.ok(BODY_LOCATION_IDS.has("top of head"))
  })
  it("refines only a chosen broad parent and preserves other sides/surfaces and the save limit", () => {
    const before = ["left thigh", "right back thigh", "historic unsided value"]
    const surface = toggleBodySurface(before, "left front thigh")
    assert.deepEqual(surface, ["right back thigh", "historic unsided value", "left front thigh"])
    const detail = toggleBodySurface(surface, "left front thigh, near knee")
    assert.deepEqual(detail, ["right back thigh", "historic unsided value", "left front thigh, near knee"])
    assert.deepEqual(toggleBodySurface(detail, "left front thigh"), ["right back thigh", "historic unsided value", "left front thigh"])
    assert.equal(toggleBodySurface(Array.from({ length: 16 }, (_, i) => `historic-${i}`), "left front thigh").length, 16)
    assert.deepEqual(before, ["left thigh", "right back thigh", "historic unsided value"])
  })
  it("uses surface normals for diagonal, inner, top and sole views rather than assigning a camera surface", () => {
    const find = (id) => BODY_SURFACES.find((item) => item.id === id)
    assert.ok(bodySurfaceFacesCamera(find("left front thigh"), { x: 0, y: 0, z: 1 }))
    assert.ok(!bodySurfaceFacesCamera(find("left back thigh"), { x: 0, y: 0, z: 1 }))
    assert.ok(bodySurfaceFacesCamera(find("left inner thigh"), { x: -0.7, y: 0, z: 0.7 }))
    assert.ok(bodySurfaceFacesCamera(find("right inner thigh"), { x: 0.7, y: 0, z: 0.7 }))
    assert.ok(bodySurfaceFacesCamera(find("left sole of foot"), { x: 0, y: -1, z: 0 }))
    assert.ok(bodySurfaceFacesCamera(find("top of head"), { x: 0, y: 1, z: 0 }))
    assert.equal(bodyViewForNormal([-1, 0, 0]), "right")
    assert.ok(SURFACE_VIEW_DIRECTIONS["back-right"]); assert.ok(SURFACE_VIEW_DIRECTIONS.top)
  })
})

describe("Feeling words and observational context", () => {
  it("keeps the new words and reflection fields out of diagnostics and retains separate report counts", () => {
    assert.deepEqual(sanitizeClientWellnessLogMetadata({ action: "create", category: "emotion", feelingWords: ["Hopeful"], contextCheckIn: { posture: "private" } }), { action: "create", category: "emotion" })
    const report = buildClientWellnessPatternReport([{ category: "emotion", occurredAt: "2026-11-20T12:00:00Z", intensity: null, metadata: { feelingWords: ["Hopeful"] } }, { category: "home_care", occurredAt: "2026-11-20T12:00:00Z", contexts: ["home: chair"], metadata: { contextCheckIn: { prompts: ["home: chair", "care: rest"] } } }], new Date("2026-11-20T13:00:00Z"))
    assert.equal(report.topFeelings[0].label, "hopeful")
    assert.equal(report.topContexts.find((row) => row.label === "home: chair").count, 1)
    assert.equal(report.topContexts.find((row) => row.label === "care: rest").count, 1)
  })
  it("offers the supplied broad wheel families, ordinary word levels and bounded custom words", () => {
    assert.deepEqual(FEELING_FAMILIES.map((family) => family.word), ["Happy", "Neutral", "Sad", "Surprised", "Angry", "Bad", "Connected", "Disgusted", "Fearful"])
    assert.deepEqual(reflectionWords([" Hopeful ", "Hopeful", "", 7, "My own word"]), ["Hopeful", "My own word"])
    const value = normalizeClientWellnessEntryInput({ category: "emotion", metadata: { feelingWords: ["Hopeful", "My own word"], inferredDiagnosis: "drop" } })
    assert.deepEqual(value.metadata, { feelingWords: ["Hopeful", "My own word"] })
    assert.deepEqual(normalizeClientWellnessEntryInput({ category: "activity", metadata: { feelingWords: ["Hopeful"] } }).metadata, {})
  })
  it("retains only relevant bounded Work/Home fields without inventing a cause", () => {
    const input = { activity: "  Fictional reaching task  ", posture: "held position", surroundings: "a".repeat(500), prompts: ["work: repeated reaching"], careAction: "home routine", privateExtra: "drop" }
    const work = normalizeContextCheckIn("work_context", input)
    assert.equal(work.activity, "Fictional reaching task"); assert.equal(work.surroundings.length, 400)
    assert.equal(work.careAction, undefined); assert.equal(work.privateExtra, undefined)
    assert.equal(normalizeContextCheckIn("home_care", input).careAction, "home routine")
    assert.equal(normalizeContextCheckIn("emotion", input), null)
    assert.deepEqual(normalizeClientWellnessEntryInput({ category: "work_context", metadata: { contextCheckIn: input } }).metadata.contextCheckIn, work)
    assert.deepEqual(normalizeClientWellnessEntryInput({ category: "sleep", metadata: { contextCheckIn: input } }).metadata, {})
  })
  it("preserves optional physical details in Incident and context categories", () => {
    for (const category of ["incident", "work_context", "home_care"]) {
      const result = normalizeClientWellnessEntryInput({ category, metadata: { durationMinutes: 20, bodyPosition: "sitting", activityContext: "fictional task", movementEffect: "unchanged" } })
      assert.deepEqual(result.metadata, { durationMinutes: 20, bodyPosition: "sitting", activityContext: "fictional task", movementEffect: "unchanged" })
    }
  })
})
