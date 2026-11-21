// @ts-check
import { MOVEMENT_COMFORT_SCALE } from "./movement-comfort.js"

export const EXERCISE_KINDS = Object.freeze({ strength: "Strength", cardio: "Cardio", mobility: "Mobility / stretching", balance: "Balance", functional: "Everyday-task practice", other: "Other" })
export const EXERCISE_CONTEXTS = Object.freeze({ general: "General exercise", pt: "Physical therapy (PT)", ot: "Occupational therapy (OT)" })
export const EXERCISE_SIDES = Object.freeze({ unspecified: "Not specified", left: "Left", right: "Right", both: "Both sides" })
export const EXERCISE_LOAD_UNITS = Object.freeze({ lb: "lb", kg: "kg", bodyweight: "Bodyweight", other: "Band / other resistance" })
export const EXERCISE_DISTANCE_UNITS = Object.freeze({ mi: "miles", km: "km", m: "meters" })
export const EXERCISE_SET_LIMIT = 20
export const EXERCISE_EFFORT_SCALE = "exercise-effort-0-10-v1"

/** @typedef {{reps?:number,weight?:number,holdSeconds?:number}} ExerciseSet */
/** @typedef {{version:1,name:string,kind:string,context:string,side:string,equipment:string,loadUnit:string,distanceUnit:string,sets:ExerciseSet[],durationMinutes?:number,distance?:number,effort?:number,effortScale?:string,comfort?:number,comfortScale?:string}} ExerciseRecord */
/** @typedef {{version:1,name:string,kind:string,context:string,side:string,equipment:string,loadUnit:string,distanceUnit:string,sets:{reps:string,weight:string,holdSeconds:string}[],durationMinutes:string,distance:string,effort:string,effortScale:string,comfort:string,comfortScale:string}} ExerciseDraft */
/** @typedef {{id:string,at:string,record:ExerciseRecord,summary:string,persisted:boolean}} ExerciseSession */

/** Start a blank recording, optionally reusing an exercise's identity. Actual
 * measurements and ratings are never copied from a past completed session.
 * @param {Partial<ExerciseRecord>} [identity] @returns {ExerciseDraft} */
export function createExerciseDraft(identity = {}) {
  return { version: 1, name: identity.name ?? "", kind: identity.kind ?? "strength", context: identity.context ?? "general", side: identity.side ?? "unspecified", equipment: identity.equipment ?? "", loadUnit: identity.loadUnit ?? "lb", distanceUnit: identity.distanceUnit ?? "mi", sets: [{ reps: "", weight: "", holdSeconds: "" }], durationMinutes: "", distance: "", effort: "", effortScale: EXERCISE_EFFORT_SCALE, comfort: "", comfortScale: MOVEMENT_COMFORT_SCALE }
}

/** Read only explicit, bounded measurements. Blank is missing, zero remains
 * zero, and invalid input rejects the recording instead of being clamped into
 * plausible data. Unknown keys never enter the self-tracking record.
 * @param {unknown} value @returns {{record:ExerciseRecord|null,error:string|null}} */
export function validateExerciseRecord(value) {
  const input = object(value), name = text(input.name), equipment = text(input.equipment)
  if (!name || name.length > 100) return invalid("Add an exercise name of up to 100 characters.")
  if (input.version !== 1) return invalid("This exercise recording format is not supported.")
  for (const [key, choices] of Object.entries({ kind: EXERCISE_KINDS, context: EXERCISE_CONTEXTS, side: EXERCISE_SIDES, loadUnit: EXERCISE_LOAD_UNITS, distanceUnit: EXERCISE_DISTANCE_UNITS })) if (typeof input[key] !== "string" || !Object.hasOwn(choices, String(input[key]))) return invalid("Choose the exercise type, context and units from the available options.")
  if (equipment.length > 160) return invalid("Keep equipment or support notes within 160 characters.")
  if (!Array.isArray(input.sets) || input.sets.length > EXERCISE_SET_LIMIT) return invalid(`Use up to ${EXERCISE_SET_LIMIT} sets in one exercise entry.`)
  /** @type {ExerciseSet[]} */
  const sets = []
  for (const row of input.sets) {
    if (!row || typeof row !== "object" || Array.isArray(row)) return invalid("Check the set details.")
    const set = object(row), reps = measurement(set.reps, 10000, true), holdSeconds = measurement(set.holdSeconds, 86400)
    const weight = ["lb", "kg"].includes(String(input.loadUnit)) ? measurement(set.weight, 5000) : null
    if (reps === false || holdSeconds === false || weight === false) return invalid("Check reps, weight and hold time. Use nonnegative numbers; reps must be whole numbers.")
    const normalized = { ...(reps !== null ? { reps } : {}), ...(weight !== null ? { weight } : {}), ...(holdSeconds !== null ? { holdSeconds } : {}) }
    if (Object.keys(normalized).length) sets.push(normalized)
  }
  const durationMinutes = measurement(input.durationMinutes, 10080), distance = measurement(input.distance, 100000), effort = measurement(input.effort, 10, true), comfort = measurement(input.comfort, 10, true)
  if ([durationMinutes, distance, effort, comfort].includes(false)) return invalid("Check time, distance and ratings. Ratings use whole numbers from 0 to 10.")
  if (effort !== null && input.effortScale !== EXERCISE_EFFORT_SCALE || comfort !== null && input.comfortScale !== MOVEMENT_COMFORT_SCALE) return invalid("Check the exercise rating scale.")
  return { error: null, record: { version: 1, name, equipment, kind: String(input.kind), context: String(input.context), side: String(input.side), loadUnit: String(input.loadUnit), distanceUnit: String(input.distanceUnit), sets,
    ...(typeof durationMinutes === "number" ? { durationMinutes } : {}), ...(typeof distance === "number" ? { distance } : {}),
    ...(typeof effort === "number" ? { effort, effortScale: EXERCISE_EFFORT_SCALE } : {}), ...(typeof comfort === "number" ? { comfort, comfortScale: MOVEMENT_COMFORT_SCALE } : {}) } }
}

/** Identity includes side, context and equipment. A change of apparatus or
 * therapy context does not silently join an unlike comparison series.
 * @param {ExerciseRecord} record */
export function exerciseComparisonKey(record) {
  return JSON.stringify([record.name, record.kind, record.context, record.side, record.equipment].map((part) => part.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase()))
}

/** Accept only dated Exercise records, deduplicate overlapping loaded windows
 * by durable entry id and exclude future/invalid entries from progress views.
 * @param {unknown} entries @param {Date} [now] @returns {ExerciseSession[]} */
export function exerciseSessions(entries, now = new Date()) {
  const limit = Number.isFinite(now.getTime()) ? now.getTime() : Date.now()
  const seen = new Set(), result = []
  for (const value of Array.isArray(entries) ? entries : []) {
    const entry = object(value), id = text(entry.id), at = Date.parse(text(entry.occurredAt))
    if (entry.category !== "exercise" || !id || seen.has(id) || !Number.isFinite(at) || at > limit) continue
    const { record } = validateExerciseRecord(object(entry.metadata).exerciseRecord)
    if (!record) continue
    seen.add(id); result.push({ id, at: new Date(at).toISOString(), record, summary: text(entry.summary), persisted: entry.persisted !== false })
  }
  return result.sort((a, b) => b.at.localeCompare(a.at))
}

/** Available chart metrics carry their units explicitly; pounds/kilograms and
 * distance units are separate series, with no guessed conversion or goal.
 * @param {ExerciseSession[]} sessions */
export function exerciseMetricOptions(sessions) {
  const options = [{ key: "reps", label: "Reps recorded" }, { key: "hold", label: "Longest hold (seconds)" }, { key: "duration", label: "Time (minutes)" }, { key: "effort", label: "Effort (0–10)" }, { key: "comfort", label: "Comfort (0–10)" }, ...["lb", "kg"].map((unit) => ({ key: `weight:${unit}`, label: `Highest recorded weight (${unit})` })), ...Object.entries(EXERCISE_DISTANCE_UNITS).map(([unit, label]) => ({ key: `distance:${unit}`, label: `Distance (${label})` }))]
  return options.filter((option) => sessions.some((session) => exerciseMetricValue(session.record, option.key) !== null))
}

/** Missing measurements stay gaps, never zero. Reps sum only explicitly
 * recorded rows; weight/hold are observed maxima, not estimated capacity.
 * @param {ExerciseRecord} record @param {string} metric @returns {number|null} */
export function exerciseMetricValue(record, metric) {
  if (metric === "reps") { const rows = record.sets.filter((row) => row.reps !== undefined); return rows.length ? rows.reduce((sum, row) => sum + (row.reps ?? 0), 0) : null }
  if (metric === "hold" || metric === `weight:${record.loadUnit}`) { const values = record.sets.map((row) => metric === "hold" ? row.holdSeconds : row.weight).filter((number) => typeof number === "number"); return values.length ? Math.max(...values) : null }
  if (metric === "duration") return record.durationMinutes ?? null
  if (metric === "effort") return record.effort ?? null
  if (metric === "comfort") return record.comfort ?? null
  if (metric === `distance:${record.distanceUnit}`) return record.distance ?? null
  return null
}

/** @param {unknown} value @returns {Record<string,unknown>} */
function object(value) { return value && typeof value === "object" && !Array.isArray(value) ? /** @type {Record<string,unknown>} */ (value) : {} }
/** @param {unknown} value */
function text(value) { return typeof value === "string" ? value.trim() : "" }
/** @param {string} error */
function invalid(error) { return { record: null, error } }
/** @param {unknown} value @param {number} max @param {boolean} [integer] @returns {number|null|false} */
function measurement(value, max, integer = false) {
  if (value === undefined || value === null || typeof value === "string" && !value.trim()) return null
  if (typeof value !== "string" && typeof value !== "number") return false
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 && number <= max && (!integer || Number.isInteger(number)) ? number : false
}
