import { clampActiveTimerMs } from "./chimer-timer.js"
import { ACTIVE_BACKGROUND_IDS } from "./background-options.js"

/** A separate app origin/store never reads or migrates the website's vault. */
export const OFFLINE_CORE_STORAGE_KEY = "atmoshaper.android.offline-core.v1"
export const OFFLINE_CORE_TOOLS = Object.freeze(["clock", "timer", "breathing", "backgrounds", "music"])
export const OFFLINE_CORE_BACKGROUNDS = Object.freeze([
  { id: "massage-lab-moving-gradient", label: "Lava Lamp" },
  { id: "static-gradient", label: "Static gradient" },
  { id: "solid-color", label: "Solid Color" },
])
// A saved choice is not an access grant. The host verifies access separately.
const backgroundIds = new Set(ACTIVE_BACKGROUND_IDS)
export const MAX_OFFLINE_TIMER_DURATION_MS = clampActiveTimerMs(Number.MAX_SAFE_INTEGER)
const MAX_DURATION = MAX_OFFLINE_TIMER_DURATION_MS
const isDuration = value => Number.isSafeInteger(value) && value >= 0 && value <= MAX_DURATION
const hexColor = (value, fallback) => typeof value === "string" && /^#[a-f\d]{6}$/i.test(value) ? value : fallback

export function defaultOfflineCoreState() {
  return { version: 1, tool: "clock", backgroundId: "massage-lab-moving-gradient",
    mainColor: "#FF8C2A", orbColor: "#4169E1", timeFormat: "12h", showSeconds: false,
    motion: true, sound: true, intervalMinutes: 15, durationMs: 3600000,
    timer: { status: "idle", durationMs: 3600000, remainingMs: 3600000, endsAt: null, lastAlertIndex: 0 } }
}

/** Reject malformed local state instead of replaying commands or trusting flags. */
export function normalizeOfflineTimer(input, now = Date.now()) {
  const fallback = defaultOfflineCoreState().timer
  if (!input || typeof input !== "object" || !["idle", "running", "paused", "complete"].includes(input.status)
    || !isDuration(input.durationMs) || !isDuration(input.remainingMs)
    || input.remainingMs > input.durationMs) return fallback
  if (input.status !== "idle" && input.durationMs === 0) return fallback
  if (input.status === "running" && (!Number.isSafeInteger(input.endsAt) || input.endsAt <= 0
    || input.endsAt > now + input.durationMs)) return fallback
  return { status: input.status, durationMs: input.durationMs,
    remainingMs: input.status === "complete" ? 0 : input.remainingMs,
    endsAt: input.status === "running" ? input.endsAt : null,
    lastAlertIndex: Number.isSafeInteger(input.lastAlertIndex) && input.lastAlertIndex >= 0 ? input.lastAlertIndex : 0 }
}

/** End-time arithmetic survives suspended JavaScript and process restarts. */
export function readOfflineTimer(timer, now = Date.now()) {
  const state = normalizeOfflineTimer(timer, now)
  const remainingMs = state.status === "running" ? Math.max(0, Math.min(state.durationMs, state.endsAt - now)) : state.remainingMs
  return { ...state, remainingMs, status: state.status === "running" && remainingMs === 0 ? "complete" : state.status }
}

export function startOfflineTimer(durationMs, now = Date.now()) {
  if (!isDuration(durationMs) || durationMs <= 0) throw new Error("Enter a timer duration greater than zero.")
  return { status: "running", durationMs, remainingMs: durationMs, endsAt: now + durationMs, lastAlertIndex: 0 }
}

export function pauseOfflineTimer(timer, now = Date.now()) {
  const reading = readOfflineTimer(timer, now)
  return reading.status === "running" ? { ...reading, status: "paused", endsAt: null } : reading
}

export function resumeOfflineTimer(timer, now = Date.now()) {
  const reading = readOfflineTimer(timer, now)
  return reading.status === "paused" ? { ...reading, status: "running", endsAt: now + reading.remainingMs } : reading
}

/** Consume missed interval positions once; never burst old alerts on return. */
export function getOfflineTimerInterval(timer, intervalMinutes, now = Date.now()) {
  const reading = readOfflineTimer(timer, now)
  const intervalMs = intervalMinutes * 60000
  const elapsed = reading.durationMs - reading.remainingMs
  const index = intervalMs > 0 ? Math.floor(elapsed / intervalMs) : 0
  return { index, alert: reading.status === "running" && index > timer.lastAlertIndex && elapsed % intervalMs < 1250 }
}

export function normalizeOfflineCoreState(input, now = Date.now()) {
  const defaults = defaultOfflineCoreState()
  if (!input || typeof input !== "object" || input.version !== 1) return defaults
  return { ...defaults,
    tool: OFFLINE_CORE_TOOLS.includes(input.tool) ? input.tool : defaults.tool,
    backgroundId: backgroundIds.has(input.backgroundId) ? input.backgroundId : defaults.backgroundId,
    mainColor: hexColor(input.mainColor, defaults.mainColor), orbColor: hexColor(input.orbColor, defaults.orbColor),
    timeFormat: input.timeFormat === "24h" ? "24h" : "12h", showSeconds: input.showSeconds === true,
    motion: input.motion !== false, sound: input.sound !== false,
    durationMs: isDuration(input.durationMs) ? input.durationMs : defaults.durationMs,
    intervalMinutes: Number.isSafeInteger(input.intervalMinutes) && input.intervalMinutes >= 0 && input.intervalMinutes <= 240 ? input.intervalMinutes : 15,
    timer: normalizeOfflineTimer(input.timer, now) }
}

/** Storage failure must not silently claim that the running timer was saved. */
export function saveOfflineCoreState(storage, state) {
  try { storage.setItem(OFFLINE_CORE_STORAGE_KEY, JSON.stringify(normalizeOfflineCoreState(state))); return true }
  catch { return false }
}

export function loadOfflineCoreState(storage) {
  try {
    const raw = storage.getItem(OFFLINE_CORE_STORAGE_KEY)
    return normalizeOfflineCoreState(raw && raw.length < 16384 ? JSON.parse(raw) : null)
  } catch { return defaultOfflineCoreState() }
}
