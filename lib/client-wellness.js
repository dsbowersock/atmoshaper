// @ts-check
import { MOVEMENT_COMFORT_SCALE, parseMovementComfort } from "./movement-comfort.js"
import { normalizeContextCheckIn, reflectionWords } from "./wellness-reflection.js"
import { validateExerciseRecord } from "./exercise-recording.js"

export const CLIENT_WELLNESS_CATEGORIES = Object.freeze([
  "body_sensation",
  "emotion",
  "rom",
  "sleep",
  "activity",
  "exercise",
  "work_context",
  "home_care",
  "incident",
])

const CATEGORY_SET = new Set(CLIENT_WELLNESS_CATEGORIES)
const DEFAULT_CATEGORY = "body_sensation"
export const DEFAULT_CLIENT_WELLNESS_TIMEZONE = "America/New_York"

const WELLNESS_SOURCES = new Set([
  "manual",
  "quick-log",
  "device-orientation",
  "angle-finder",
  "goniometer",
])

const SAFE_LOG_ACTIONS = new Set(["create", "list", "delete", "export", "preference"])
const SAFE_LOG_STATUSES = new Set(["saved", "deleted", "exported", "updated", "anonymous", "unauthorized", "error", "validation_error"])
const BODY_SENSATION_MOVEMENT_EFFECTS = new Set(["better", "worse", "unchanged", "unsure"])

/**
 * Client-owned wellness logs are sensitive self-tracking records. This helper
 * accepts broad form/browser input, normalizes it for storage, and strips data
 * that should never be copied into logs or analytics metadata.
 *
 * @param {unknown} input
 * @param {Date} [now]
 */
export function normalizeClientWellnessEntryInput(input, now = new Date()) {
  const payload = objectOrEmpty(input)
  const category = normalizeCategory(payload.category)
  const recordingKind = objectOrEmpty(payload.metadata).recordingKind
  const isComfortRecording = category === "rom" && (recordingKind === "comfort" || recordingKind === "both")

  return {
    category,
    occurredAt: normalizeDate(payload.occurredAt, now),
    timezone: normalizeTimezone(payload.timezone),
    summary: normalizeText(payload.summary, 500),
    intensity: isComfortRecording || category === "exercise" ? null : normalizeIntensity(payload.intensity),
    regions: normalizeStringList(payload.regions, 16, 80),
    sensations: normalizeStringList(payload.sensations, 16, 80),
    contexts: normalizeStringList(payload.contexts, 16, 80),
    source: normalizeSource(payload.source),
    metadata: sanitizeClientWellnessEntryMetadata(category, payload.metadata),
  }
}

/**
 * @param {string | null | undefined} _userLabel
 * @param {Date} [date]
 */
export function clientWellnessExportFilename(_userLabel, date = new Date()) {
  const stamp = Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
  return `massagelab-wellness-${stamp}.json`
}

/**
 * @param {unknown} input
 */
export function sanitizeClientWellnessLogMetadata(input) {
  const payload = objectOrEmpty(input)
  /** @type {Record<string, unknown>} */
  const metadata = {}

  if (typeof payload.action === "string" && SAFE_LOG_ACTIONS.has(payload.action)) {
    metadata.action = payload.action
  }

  if (typeof payload.category === "string" && CATEGORY_SET.has(payload.category)) {
    metadata.category = payload.category
  }

  if (typeof payload.status === "string" && SAFE_LOG_STATUSES.has(payload.status)) {
    metadata.status = payload.status
  }

  for (const [key, value] of Object.entries(payload)) {
    if ((key === "count" || key.endsWith("Count")) && Number.isFinite(Number(value))) {
      metadata[key] = Math.max(0, Math.trunc(Number(value)))
    }
  }

  return metadata
}

/**
 * Normalizes user-created sensation words for private review-gated storage.
 *
 * @param {unknown} input
 * @returns {string[]}
 */
export function normalizeClientWellnessCustomTerms(input) {
  return normalizeStringList(input, 8, 80)
}

/**
 * Calculates a signed ROM angle delta while handling compass-style rotation.
 *
 * Alpha device-orientation values wrap at 0/360 degrees, so this returns the
 * shortest signed delta for alpha and the direct signed delta for tilt axes.
 *
 * @param {unknown} axis
 * @param {unknown} endAngle
 * @param {unknown} baselineAngle
 * @returns {number}
 */
export function calculateRomAngleDelta(axis, endAngle, baselineAngle) {
  const delta = Number(endAngle) - Number(baselineAngle)

  if (!Number.isFinite(delta)) {
    return 0
  }

  if (axis === "alpha") {
    const wrappedDelta = ((((delta + 180) % 360) + 360) % 360) - 180
    return roundDegree(wrappedDelta === -180 ? 180 : wrappedDelta)
  }

  return roundDegree(delta)
}

/**
 * @param {unknown} value
 */
function objectOrEmpty(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }

  return /** @type {Record<string, unknown>} */ (value)
}

/**
 * @param {unknown} value
 */
function normalizeCategory(value) {
  return typeof value === "string" && CATEGORY_SET.has(value) ? value : DEFAULT_CATEGORY
}

/**
 * @param {unknown} value
 * @param {Date} fallback
 */
function normalizeDate(value, fallback) {
  const date = value instanceof Date ? value : typeof value === "string" || typeof value === "number" ? new Date(value) : null

  if (date && Number.isFinite(date.getTime())) {
    return date
  }

  return Number.isFinite(fallback.getTime()) ? fallback : new Date()
}

/**
 * @param {unknown} value
 */
function normalizeTimezone(value) {
  const timezone = typeof value === "string" ? value.trim() : ""

  if (!timezone || timezone.length > 80) {
    return DEFAULT_CLIENT_WELLNESS_TIMEZONE
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone })
    return timezone
  } catch {
    return DEFAULT_CLIENT_WELLNESS_TIMEZONE
  }
}

/**
 * @param {unknown} value
 */
function normalizeIntensity(value) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const number = Number(value)

  if (!Number.isFinite(number)) {
    return null
  }

  return Math.min(Math.max(Math.trunc(number), 0), 10)
}

/**
 * @param {unknown} value
 */
function normalizeSource(value) {
  const source = typeof value === "string" ? value.trim().toLowerCase() : ""
  return WELLNESS_SOURCES.has(source) ? source : "manual"
}

/**
 * @param {unknown} value
 * @param {number} maxLength
 */
function normalizeText(value, maxLength) {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim().replace(/\s+/g, " ")

  if (!trimmed) {
    return null
  }

  return trimmed.slice(0, maxLength)
}

/**
 * @param {unknown} value
 * @param {number} limit
 * @param {number} maxLength
 */
function normalizeStringList(value, limit, maxLength) {
  const values = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : []
  const seen = new Set()
  const normalized = []

  for (const item of values) {
    if (typeof item !== "string") {
      continue
    }

    const text = item.trim().replace(/\s+/g, " ").slice(0, maxLength)

    if (!text || seen.has(text.toLowerCase())) {
      continue
    }

    seen.add(text.toLowerCase())
    normalized.push(text)

    if (normalized.length >= limit) {
      break
    }
  }

  return normalized
}

/**
 * @param {string} category
 * @param {unknown} input
 */
function sanitizeClientWellnessEntryMetadata(category, input) {
  const payload = objectOrEmpty(input)
  /** @type {Record<string, unknown>} */
  const metadata = {}
  const draftId = normalizeText(payload.draftId, 120)

  if (draftId) {
    metadata.draftId = draftId
  }

  if (category === "emotion") {
    const words = reflectionWords(payload.feelingWords)
    if (words.length) metadata.feelingWords = words
  }
  if (category === "exercise") {
    const exercise = validateExerciseRecord(payload.exerciseRecord).record
    if (exercise) metadata.exerciseRecord = exercise
  }
  const context = normalizeContextCheckIn(category, payload.contextCheckIn)
  if (context) metadata.contextCheckIn = context

  if (category === "rom") {
    const movement = normalizeText(payload.movement, 120)
    const side = normalizeText(payload.side, 40)
    const axis = normalizeRomAxis(payload.axis)
    const baselineAngle = normalizeDegree(payload.baselineAngle)
    const endAngle = normalizeDegree(payload.endAngle)
    const changeDegrees = normalizeDegree(payload.changeDegrees)

    if (movement) {
      metadata.movement = movement
    }
    if (side) {
      metadata.side = side
    }
    if (axis && payload.recordingKind !== "comfort") {
      metadata.axis = axis
    }
    if (baselineAngle !== null && payload.recordingKind !== "comfort") {
      metadata.baselineAngle = baselineAngle
    }
    if (endAngle !== null && payload.recordingKind !== "comfort") {
      metadata.endAngle = endAngle
    }
    if (changeDegrees !== null && payload.recordingKind !== "comfort") {
      metadata.changeDegrees = changeDegrees
    }
    // Preserve the explicit kind even for an invalid score so the action can
    // reject a malformed new recording rather than silently save an empty one.
    if (payload.recordingKind === "comfort" || payload.recordingKind === "both") {
      metadata.recordingKind = payload.recordingKind
      const comfort = parseMovementComfort(payload.comfortScore)
      if (comfort !== null && payload.comfortScale === MOVEMENT_COMFORT_SCALE) {
        metadata.comfortScore = comfort
        metadata.comfortScale = MOVEMENT_COMFORT_SCALE
      }
    }
  }

  // Shared physical/context tools expose these optional native fields. Admit
  // their bounded values while keeping emotion, sleep and ROM metadata separate.
  if (["body_sensation", "activity", "incident", "work_context", "home_care"].includes(category)) {
    const durationMinutes = normalizeInteger(payload.durationMinutes, 0, 10080)
    const bodyPosition = normalizeText(payload.bodyPosition, 80)
    const activityContext = normalizeText(payload.activityContext, 160)
    const movementEffect = normalizeMovementEffect(payload.movementEffect)

    if (durationMinutes !== null) {
      metadata.durationMinutes = durationMinutes
    }
    if (bodyPosition && category !== "activity") {
      metadata.bodyPosition = bodyPosition
    }
    if (activityContext) {
      metadata.activityContext = activityContext
    }
    if (movementEffect && category !== "activity") {
      metadata.movementEffect = movementEffect
    }
  }

  return metadata
}

/**
 * @param {unknown} value
 * @param {number} min
 * @param {number} max
 */
function normalizeInteger(value, min, max) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const number = Number(value)

  if (!Number.isFinite(number)) {
    return null
  }

  return Math.min(Math.max(Math.trunc(number), min), max)
}

/**
 * @param {unknown} value
 */
function normalizeMovementEffect(value) {
  const effect = typeof value === "string" ? value.trim().toLowerCase() : ""
  return BODY_SENSATION_MOVEMENT_EFFECTS.has(effect) ? effect : null
}

/**
 * @param {unknown} value
 */
function normalizeRomAxis(value) {
  return value === "alpha" || value === "beta" || value === "gamma" ? value : null
}

/**
 * @param {unknown} value
 */
function normalizeDegree(value) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const number = Number(value)

  if (!Number.isFinite(number)) {
    return null
  }

  return roundDegree(number)
}

/**
 * @param {number} value
 */
function roundDegree(value) {
  return Math.round(value * 10) / 10
}
