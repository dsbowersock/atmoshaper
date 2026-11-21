// @ts-check

/** Version and direction travel with the rating; never reuse symptom intensity
 * for a scale where a higher number means greater comfort. */
export const MOVEMENT_COMFORT_SCALE = "movement-comfort-0-10-v1"

/** Missing/invalid ratings remain missing. In particular, blank is not zero.
 * @param {unknown} value @returns {number|null} */
export function parseMovementComfort(value) {
  if (typeof value !== "number" && typeof value !== "string" || typeof value === "string" && !value.trim()) return null
  const score = Number(value)
  return Number.isInteger(score) && score >= 0 && score <= 10 ? score : null
}

/** Additional validation applies only to explicitly marked new recordings.
 * Legacy ROM and generic quick-log metadata retain their compatibility rules.
 * @param {Record<string, unknown>} metadata */
export function isValidMovementRecording(metadata) {
  if (metadata.recordingKind !== "comfort" && metadata.recordingKind !== "both") return true
  if (!text(metadata.movement) || !["Left", "Right", "Center"].includes(text(metadata.side))) return false
  if (metadata.comfortScale !== MOVEMENT_COMFORT_SCALE || parseMovementComfort(metadata.comfortScore) === null) return false
  return metadata.recordingKind === "comfort" || ["alpha", "beta", "gamma"].includes(text(metadata.axis)) && [metadata.baselineAngle, metadata.endAngle].every((value) => typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= 360) && typeof metadata.changeDegrees === "number" && Number.isFinite(metadata.changeDegrees) && Math.abs(metadata.changeDegrees) <= 720
}

/** @typedef {{key:string,movement:string,side:string,scale:string,entryCount:number,latestScore:number,previousScore:number|null,changeSincePrevious:number|null,latestAt:string,previousAt:string|null}} MovementComfortReference */

/** Describe repeated self-ratings for exactly the same movement, side and scale.
 * No score is inferred from an angle, symptom intensity or missing legacy data.
 * @param {unknown} entries @param {Date} [now] @returns {MovementComfortReference[]} */
export function summarizeMovementComfort(entries, now = new Date()) {
  /** @type {Map<string,{movement:string,side:string,ratings:{score:number,date:Date}[]}>} */
  const groups = new Map()
  for (const entry of Array.isArray(entries) ? entries : []) {
    if (!entry || entry.category !== "rom" || !entry.metadata) continue
    const metadata = entry.metadata
    if (metadata.recordingKind !== "comfort" && metadata.recordingKind !== "both" || !isValidMovementRecording(metadata)) continue
    const score = parseMovementComfort(metadata.comfortScore)
    const date = new Date(entry.occurredAt)
    if (score === null || !Number.isFinite(date.getTime()) || date > now) continue
    const movement = text(metadata.movement).replace(/\s+/g, " ").toLowerCase()
    const side = text(metadata.side)
    const key = JSON.stringify([movement, side, MOVEMENT_COMFORT_SCALE])
    const group = groups.get(key) ?? { movement, side, ratings: [] }
    group.ratings.push({ score, date }); groups.set(key, group)
  }
  return [...groups].map(([key, group]) => {
    const ratings = group.ratings.sort((a, b) => a.date.getTime() - b.date.getTime())
    const latest = ratings[ratings.length - 1], previous = ratings.at(-2)
    return { key, movement: group.movement, side: group.side, scale: MOVEMENT_COMFORT_SCALE, entryCount: ratings.length, latestScore: latest.score, previousScore: previous?.score ?? null, changeSincePrevious: previous ? latest.score - previous.score : null, latestAt: latest.date.toISOString(), previousAt: previous?.date.toISOString() ?? null }
  }).sort((a, b) => b.latestAt.localeCompare(a.latestAt) || a.key.localeCompare(b.key))
}

/** @param {unknown} value */
function text(value) { return typeof value === "string" ? value.trim() : "" }
