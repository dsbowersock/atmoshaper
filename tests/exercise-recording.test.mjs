import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { readFile } from "node:fs/promises"
import { createExerciseDraft, exerciseComparisonKey, exerciseMetricOptions, exerciseMetricValue, exerciseSessions, validateExerciseRecord, EXERCISE_SET_LIMIT } from "../lib/exercise-recording.js"
import * as wellness from "../lib/client-wellness.js"
import * as comfort from "../lib/movement-comfort.js"
import { buildClientWellnessPatternReport } from "../lib/client-wellness-patterns.js"
import { removeForbiddenPreferenceFields } from "../lib/account-preferences.js"
import { sanitizeSentryEvent } from "../lib/sentry-privacy.js"
import { createCompiledModuleLoader } from "./helpers/compiled-module.mjs"

const now = new Date("2026-11-20T19:00:00Z")
const draft = (patch = {}) => ({ ...createExerciseDraft(), name: "Fictional exercise", ...patch })
const valid = (patch = {}) => { const result = validateExerciseRecord(draft(patch)); assert.equal(result.error, null); return result.record }
const session = (id, at, patch = {}, extra = {}) => ({ id, category: "exercise", occurredAt: at, summary: "Fictional note", metadata: { exerciseRecord: valid(patch) }, ...extra })

describe("Exercise self-tracking", () => {
  it("preserves explicit zeros and decimals without inventing measurements from blanks", () => {
    const record = valid({ sets: [{ reps: "0", weight: "0.5", holdSeconds: "12.5" }, { reps: "", weight: "", holdSeconds: "" }], durationMinutes: "1.25", distance: "0", effort: "0", comfort: "10" })
    assert.deepEqual(record.sets, [{ reps: 0, weight: 0.5, holdSeconds: 12.5 }])
    assert.equal(record.durationMinutes, 1.25); assert.equal(record.distance, 0)
    assert.equal(record.effort, 0); assert.equal(record.comfort, 10)
    assert.deepEqual(valid().sets, []); assert.equal(valid().durationMinutes, undefined)
    assert.deepEqual(validateExerciseRecord(record).record, record)
    const bodyweight = valid({ loadUnit: "bodyweight", sets: [{ reps: "8", weight: "99", holdSeconds: "" }] })
    assert.deepEqual(bodyweight.sets, [{ reps: 8 }])
  })
  it("rejects invalid numbers, enums, excessive sets and unsupported versions rather than clamping", () => {
    for (const reps of ["-1", "1.5", "NaN", "Infinity", false, "10001"]) assert.equal(validateExerciseRecord(draft({ sets: [{ reps }] })).record, null)
    for (const patch of [{ name: "" }, { name: "x".repeat(101) }, { version: 2 }, { equipment: "x".repeat(161) }, { context: "unknown" }, { side: "unknown" }, { effort: "11" }, { comfort: "-1" }, { comfort: "2", comfortScale: "wrong-direction" }, { distance: false }, { durationMinutes: "Infinity" }, { sets: Array.from({ length: EXERCISE_SET_LIMIT + 1 }, () => ({ reps: 1 })) }]) assert.equal(validateExerciseRecord(draft(patch)).record, null)
    assert.equal(valid({ sets: Array.from({ length: EXERCISE_SET_LIMIT }, () => ({ reps: "1" })) }).sets.length, EXERCISE_SET_LIMIT)
  })
  it("keeps PT/OT, sides, equipment and chart units explicit", () => {
    const record = valid({ name: "  Grip   practice ", context: "ot", side: "left", equipment: "Putty" })
    assert.equal(exerciseComparisonKey(record), exerciseComparisonKey({ ...record, name: "grip practice", equipment: "putty" }))
    for (const patch of [{ context: "pt" }, { context: "general" }, { side: "right" }, { equipment: "Other support" }, { kind: "mobility" }]) assert.notEqual(exerciseComparisonKey(record), exerciseComparisonKey({ ...record, ...patch }))
    const rows = exerciseSessions([session("a", "2026-11-18T10:00:00Z", { sets: [{ reps: "8", weight: "10" }] }), session("b", "2026-11-19T10:00:00Z", { loadUnit: "kg", sets: [{ reps: "9", weight: "6" }] })], now)
    assert.deepEqual(exerciseMetricOptions(rows).map((item) => item.key), ["reps", "weight:lb", "weight:kg"])
    assert.equal(exerciseMetricValue(rows[0].record, "weight:lb"), null)
    assert.equal(exerciseMetricValue(rows[0].record, "weight:kg"), 6)
    assert.equal(exerciseMetricValue(valid({ distance: "1.5", distanceUnit: "km" }), "distance:mi"), null)
  })
  it("does not copy completed measurements when reusing an exercise identity", () => {
    const previous = valid({ context: "pt", side: "left", equipment: "Fictional band", sets: [{ reps: "10", weight: "20" }], durationMinutes: "5", effort: "4", comfort: "8" })
    const next = createExerciseDraft(previous)
    assert.equal(next.name, previous.name); assert.equal(next.context, "pt"); assert.equal(next.equipment, previous.equipment)
    assert.deepEqual(next.sets, [{ reps: "", weight: "", holdSeconds: "" }]); assert.equal(next.durationMinutes, ""); assert.equal(next.effort, ""); assert.equal(next.comfort, "")
  })
  it("deduplicates overlapping windows, excludes future/invalid entries and retains honest gaps", () => {
    const early = session("early", "2026-11-18T10:00:00Z", { sets: [{ reps: "0" }] })
    const later = session("later", "2026-11-19T10:00:00Z")
    const rows = exerciseSessions([early, later, early, session("future", "2027-01-01T00:00:00Z"), { ...later, id: "bad", occurredAt: "bad" }, { ...later, id: "other", category: "activity" }], now)
    assert.deepEqual(rows.map((row) => row.id), ["later", "early"])
    assert.equal(exerciseMetricValue(rows[0].record, "reps"), null)
    assert.equal(exerciseMetricValue(rows[1].record, "reps"), 0)
  })
  it("admits only exercise metadata and excludes it from preferences, diagnostics and symptom averages", () => {
    const record = valid({ context: "ot" })
    const normalized = wellness.normalizeClientWellnessEntryInput({ category: "exercise", intensity: 8, metadata: { exerciseRecord: { ...record, privateUnknown: "drop" }, feelingWords: ["hidden"], contextCheckIn: { activity: "hidden" } } }, now)
    assert.deepEqual(normalized.metadata, { exerciseRecord: record }); assert.equal(normalized.intensity, null)
    assert.equal(wellness.normalizeClientWellnessEntryInput({ category: "activity", metadata: { exerciseRecord: record } }, now).metadata.exerciseRecord, undefined)
    assert.deepEqual(removeForbiddenPreferenceFields({ safe: 1, nested: { exerciseRecord: record, exerciseDraft: draft(), exerciseRecords: [record] } }), { safe: 1, nested: {} })
    assert.deepEqual(wellness.sanitizeClientWellnessLogMetadata({ category: "exercise", action: "create", exerciseRecord: record }), { category: "exercise", action: "create" })
    assert.doesNotMatch(JSON.stringify(sanitizeSentryEvent({ extra: { exerciseRecord: record }, contexts: { exerciseRecord: record } })), /Fictional exercise|exerciseRecord/)
    assert.equal(buildClientWellnessPatternReport([{ category: "exercise", occurredAt: now.toISOString(), intensity: 9, metadata: { exerciseRecord: record } }], now).averageIntensity, null)
  })
  it("the real server action rejects malformed exercise data before any owner-scoped write", async () => {
    const writes = [], reads = []
    let signedIn = true
    const load = createCompiledModuleLoader(import.meta.url)
    const actions = load(await readFile(new URL("../app/wellness/actions.ts", import.meta.url), "utf8"), "exercise-wellness-actions.ts", {
      "next/cache": { revalidatePath: () => {} }, "@/auth": { getCurrentSession: async () => signedIn ? { user: { id: "fictional-owner" } } : null },
      "@/lib/client-wellness": wellness, "@/lib/movement-comfort": comfort, "@/lib/client-wellness-reminders": {},
      "@/lib/prisma": { prisma: { clientWellnessEntry: { create: async ({ data }) => { writes.push(data); return { ...data, id: "fictional-exercise", createdAt: now, updatedAt: now } }, findMany: async (query) => { reads.push(query); return [{ ...writes[0], id: "fictional-exercise", createdAt: now, updatedAt: now }] } } } },
    })
    const form = new FormData(); form.set("category", "exercise"); form.set("metadata", JSON.stringify({ exerciseRecord: draft({ sets: [{ reps: "-1" }] }) }))
    assert.equal((await actions.createClientWellnessEntryAction(form)).reason, "invalid-exercise-recording"); assert.equal(writes.length, 0)
    form.set("metadata", JSON.stringify({ exerciseRecord: valid({ context: "pt", sets: [{ reps: "8", holdSeconds: "5" }] }) }))
    const result = await actions.createClientWellnessEntryAction(form)
    assert.equal(result.ok, true); assert.equal(writes.length, 1); assert.equal(writes[0].userId, "fictional-owner")
    assert.deepEqual(result.data.entry.metadata.exerciseRecord.sets, [{ reps: 8, holdSeconds: 5 }])
    const exported = await actions.exportClientWellnessEntriesAction()
    assert.equal(exported.ok, true); assert.deepEqual(exported.data.entries[0].metadata.exerciseRecord, result.data.entry.metadata.exerciseRecord)
    assert.equal(reads[0].where.userId, "fictional-owner"); assert.equal(reads[0].where.deletedAt, null)
    signedIn = false; assert.equal((await actions.createClientWellnessEntryAction(form)).reason, "sign-in-required"); assert.equal(writes.length, 1)
  })
})
