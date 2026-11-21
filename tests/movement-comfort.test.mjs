import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { MOVEMENT_COMFORT_SCALE, isValidMovementRecording, parseMovementComfort, summarizeMovementComfort } from "../lib/movement-comfort.js"
import { normalizeClientWellnessEntryInput, sanitizeClientWellnessLogMetadata } from "../lib/client-wellness.js"
import { buildClientWellnessPatternReport } from "../lib/client-wellness-patterns.js"
import { ROM_MOVEMENTS } from "../lib/rom-movements.js"
import { readFile } from "node:fs/promises"
import { createCompiledModuleLoader } from "./helpers/compiled-module.mjs"
import * as wellness from "../lib/client-wellness.js"
import * as comfort from "../lib/movement-comfort.js"
import { removeForbiddenPreferenceFields } from "../lib/account-preferences.js"
import { sanitizeSentryEvent } from "../lib/sentry-privacy.js"

const now = new Date("2026-11-20T19:00:00Z")
const metadata = (overrides = {}) => ({ movement: "Forearm pronation", side: "Left", recordingKind: "comfort", comfortScale: MOVEMENT_COMFORT_SCALE, comfortScore: 0, ...overrides })
const entry = (score, occurredAt, overrides = {}) => ({ category: "rom", intensity: null, occurredAt, metadata: metadata({ comfortScore: score }), ...overrides })

describe("Movement comfort recordings", () => {
  it("requires an explicit whole-number rating while preserving both endpoints", () => {
    for (const value of [undefined, null, "", " ", false, true, [], {}, -1, 11, 2.5, "NaN", Infinity]) assert.equal(parseMovementComfort(value), null)
    for (const value of [0, "0", 10, "10", " 6 "]) assert.equal(parseMovementComfort(value), Number(value))
  })
  it("keeps comfort separate from degrees, intensity and telemetry", () => {
    const result = normalizeClientWellnessEntryInput({ category: "rom", intensity: 8, metadata: metadata({ axis: "alpha", baselineAngle: 0, endAngle: 50, changeDegrees: 50, privateExtra: "fictional private text" }) })
    assert.equal(result.intensity, null)
    assert.deepEqual(result.metadata, metadata())
    assert.equal(isValidMovementRecording(result.metadata), true)
    assert.deepEqual(sanitizeClientWellnessLogMetadata({ ...result.metadata, action: "create", status: "saved", summary: "fictional private text" }), { action: "create", status: "saved" })
    const privateFields = { movementComfort: { comfortScore: 6 }, movementComfortEntries: [], comfortRatings: [6], comfortScore: 6, comfortScale: MOVEMENT_COMFORT_SCALE }
    assert.deepEqual(removeForbiddenPreferenceFields({ theme: "dark", nested: privateFields }), { theme: "dark", nested: {} })
    const event = sanitizeSentryEvent({ exception: { values: [], comfortScore: 6, comfortScale: MOVEMENT_COMFORT_SCALE, movement: "Forearm pronation" } })
    assert.equal(event.exception.comfortScore, "[Filtered]")
    assert.equal(event.exception.comfortScale, "[Filtered]")
    assert.equal(event.exception.movement, "[Filtered]")
  })
  it("rejects invalid marked recordings without silently changing their score", () => {
    for (const patch of [{ comfortScore: -1 }, { comfortScore: 11 }, { comfortScore: "" }, { comfortScale: "another-scale" }, { side: "" }, { movement: "" }, { recordingKind: "both" }]) {
      const normalized = normalizeClientWellnessEntryInput({ category: "rom", metadata: metadata(patch) })
      assert.equal(isValidMovementRecording(normalized.metadata), false)
    }
    assert.equal(isValidMovementRecording({ movement: "Legacy ROM", changeDegrees: 30 }), true)
    const both = normalizeClientWellnessEntryInput({ category: "rom", metadata: metadata({ recordingKind: "both", axis: "beta", baselineAngle: 0, endAngle: 45, changeDegrees: 45, comfortScore: 10 }) })
    assert.equal(isValidMovementRecording(both.metadata), true)
    assert.equal(both.metadata.changeDegrees, 45)
    assert.equal(both.metadata.comfortScore, 10)
    assert.equal(isValidMovementRecording({ ...both.metadata, baselineAngle: 500, changeDegrees: 500 }), false)
  })
  it("compares only the same movement, side and scale, preserving zero and dates", () => {
    const results = summarizeMovementComfort([
      entry(0, "2026-11-18T12:00:00Z"), entry(6, "2026-11-20T12:00:00Z"),
      entry(10, "2026-11-20T13:00:00Z", { metadata: metadata({ side: "Right", comfortScore: 10 }) }),
      entry(2, "2026-11-20T14:00:00Z", { metadata: metadata({ movement: "Forearm supination", comfortScore: 2 }) }),
      entry(9, "2026-11-19T12:00:00Z", { metadata: metadata({ comfortScale: "different-scale", comfortScore: 9 }) }),
      entry(9, "2026-11-19T12:00:00Z", { metadata: { movement: "Forearm pronation", side: "Left", comfortScore: 9 } }),
      entry(9, "bad-date"), entry(9, "2026-11-21T12:00:00Z"),
    ], now)
    assert.equal(results.length, 3)
    const left = results.find((row) => row.movement === "forearm pronation" && row.side === "Left")
    assert.equal(left.latestScore, 6); assert.equal(left.previousScore, 0); assert.equal(left.changeSincePrevious, 6)
    assert.equal(left.previousAt, "2026-11-18T12:00:00.000Z"); assert.equal(left.entryCount, 2)
    assert.equal(results.find((row) => row.side === "Right").previousScore, null)
  })
  it("reports comfort separately and never pools different ROM sides, axes or sources", () => {
    const report = buildClientWellnessPatternReport([
      entry(4, "2026-11-18T12:00:00Z", { intensity: 8 }), entry(7, "2026-11-20T12:00:00Z"),
      entry(0, "2026-11-18T12:00:00Z", { source: "manual", metadata: { movement: "Shoulder flexion", side: "Left", axis: "beta", changeDegrees: 20 } }),
      entry(0, "2026-11-20T12:00:00Z", { source: "manual", metadata: { movement: "Shoulder flexion", side: "Left", axis: "beta", changeDegrees: 25 } }),
      entry(0, "2026-11-20T13:00:00Z", { source: "manual", metadata: { movement: "Shoulder flexion", side: "Right", axis: "beta", changeDegrees: 80 } }),
      entry(0, "2026-11-20T14:00:00Z", { source: "manual", metadata: { movement: "Shoulder flexion", side: "Left", axis: "alpha", changeDegrees: 90 } }),
      entry(0, "2026-11-20T15:00:00Z", { source: "device-orientation", metadata: { movement: "Shoulder flexion", side: "Left", axis: "beta", changeDegrees: 100 } }),
    ], now)
    assert.equal(report.averageIntensity, null)
    assert.equal(report.movementComfort[0].changeSincePrevious, 3)
    assert.equal(report.romMovements.length, 1)
    assert.equal(report.romMovements[0].changeSincePrevious, 5)
    assert.equal(report.romMovements[0].side, "left")
  })
  it("includes all requested movement families and separate finger/toe variants", () => {
    const names = new Set(ROM_MOVEMENTS.map((movement) => movement.name))
    for (const name of ["Shoulder horizontal abduction", "Shoulder horizontal adduction", "Forearm pronation", "Forearm supination", "Hip flexion (knee straight)", "Hip adduction", "Hip cross-body adduction", "Hip internal rotation (knee bent)", "Hip external rotation (knee bent)", "Knee internal rotation (knee bent)", "Knee external rotation (knee bent)", "Foot inversion", "Foot eversion", "Foot pronation (combined movement)", "Foot supination (combined movement)", "Index finger MCP flexion", "Index finger PIP flexion", "Index finger DIP extension", "Thumb opposition", "Thumb reposition", "Big toe MTP extension", "Little toe IP flexion"]) assert.ok(names.has(name), name)
    assert.equal(names.size, ROM_MOVEMENTS.length)
  })
  it("the real server action validates marked records before writing and retains owner scope", async () => {
    const writes = [], revalidated = []
    let signedIn = true
    const load = createCompiledModuleLoader(import.meta.url)
    const actions = load(await readFile(new URL("../app/wellness/actions.ts", import.meta.url), "utf8"), "wellness-actions.ts", {
      "next/cache": { revalidatePath: (path) => revalidated.push(path) },
      "@/auth": { getCurrentSession: async () => signedIn ? { user: { id: "fictional-owner" } } : null },
      "@/lib/client-wellness": wellness,
      "@/lib/movement-comfort": comfort,
      "@/lib/client-wellness-reminders": {},
      "@/lib/prisma": { prisma: { clientWellnessEntry: { create: async ({ data }) => { writes.push(data); return { ...data, id: "fictional-entry", createdAt: now, updatedAt: now } } } } },
    })
    const form = new FormData()
    form.set("category", "rom"); form.set("metadata", JSON.stringify(metadata({ comfortScore: 11 })))
    assert.equal((await actions.createClientWellnessEntryAction(form)).reason, "invalid-movement-recording")
    assert.equal(writes.length, 0)
    form.set("metadata", JSON.stringify(metadata()))
    const result = await actions.createClientWellnessEntryAction(form)
    assert.equal(result.ok, true); assert.equal(writes.length, 1)
    assert.equal(writes[0].userId, "fictional-owner"); assert.equal(writes[0].intensity, null)
    assert.equal(result.data.entry.metadata.comfortScore, 0)
    assert.equal(Object.hasOwn(result.data.entry.metadata, "changeDegrees"), false)
    assert.deepEqual(revalidated, ["/wellness"])
    signedIn = false
    assert.equal((await actions.createClientWellnessEntryAction(form)).reason, "sign-in-required")
    assert.equal(writes.length, 1)
  })
})
