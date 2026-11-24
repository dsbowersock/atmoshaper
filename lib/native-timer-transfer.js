import { CHIMER_TIMER_BOUNDS, DEFAULT_CHIMER_SETTINGS, MAX_CHIMER_DURATION_MS, sanitizeChimerSettings } from "./chimer-timer.js"
import { readClockRecord } from "./native-clock-appearance-transfer.js"
import { importLegacyNativeClock } from "./native-clock-state.js"
import { NATIVE_CLOCK_DATABASE } from "./native-clock-storage.js"
import { OFFLINE_CORE_STORAGE_KEY } from "./offline-core.js"

const intervals = new Set(["none", "preset", "custom", "areas"])
const cues = new Set(["chime", "flash", "both", "haptic", "chime-haptic", "flash-haptic", "all", "silent"])
const phases = new Set(["idle", "clock", "running", "paused", "complete"])
const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max
const duration = value => integer(value, 0, MAX_CHIMER_DURATION_MS)
const timestamp = value => integer(value, 1, Number.MAX_SAFE_INTEGER)
const record = value => value !== null && typeof value === "object" && !Array.isArray(value)

function projectTimerSetup(settings) {
  if (!record(settings)) throw new Error("Invalid packaged timer settings")
  const read = (key, valid) => {
    const value = Object.hasOwn(settings, key) ? settings[key] : DEFAULT_CHIMER_SETTINGS[key]
    if (!valid(value)) throw new Error("Invalid packaged timer setting")
    return value
  }
  const whole = key => read(key, value => integer(value, ...CHIMER_TIMER_BOUNDS[key]))
  const [minVolume, maxVolume] = CHIMER_TIMER_BOUNDS.alertVolume
  return {
    hours: whole("hours"),
    minutes: whole("minutes"),
    interval: read("intervalType", value => intervals.has(value)),
    intervalMinutes: whole("customInterval"),
    areas: whole("areasToMassage"),
    cue: read("alertType", value => cues.has(value)),
    volume: read("alertVolume", value => Number.isFinite(value) && value >= minVolume && value <= maxVolume),
    vibrationMs: whole("hapticIntensityMs"),
    keepAwake: read("keepTimerScreenAwake", value => typeof value === "boolean"),
    showSeconds: read("showTimerSeconds", value => typeof value === "boolean"),
  }
}

/** Preserve a running absolute deadline even if it passed during transfer.
 * Android reconciles elapsed time when the timer screen opens. */
function projectTimerSnapshot(settings, timer) {
  const setup = projectTimerSetup(settings)
  if (!record(timer) || !phases.has(timer.status) || !duration(timer.totalMs) ||
      !integer(timer.remainingMs, 0, timer.totalMs) ||
      (timer.status === "running" && (!timestamp(timer.endsAtMs) || timer.totalMs === 0))) {
    throw new Error("Invalid packaged timer state")
  }
  const phase = timer.status === "idle" || timer.status === "clock" ? "ready" :
    timer.status === "paused" && timer.remainingMs === 0 ? "complete" : timer.status
  const running = phase === "running", paused = phase === "paused"
  const intervalMs = timer.intervalMs == null ? null : timer.intervalMs
  if (intervalMs !== null && !integer(intervalMs, 1000, MAX_CHIMER_DURATION_MS)) throw new Error("Invalid packaged timer interval")
  let cueAtMs = running ? timer.nextAlertAtMs ?? null : paused ? timer.msUntilNextAlert ?? null : null
  if (cueAtMs !== null) {
    if (intervalMs === null || !(timestamp(cueAtMs) || paused && cueAtMs === 0)) throw new Error("Invalid packaged timer cue")
    // The old UI could pause with a cue already due. Advance beyond that
    // missed cue instead of rejecting the timer or replaying it on resume.
    if (paused && cueAtMs === 0) cueAtMs = intervalMs
  }
  return {
    version: 1, setup, phase,
    totalMs: phase === "ready" ? 0 : timer.totalMs,
    pausedMs: paused ? timer.remainingMs : 0,
    deadlineMs: running ? timer.endsAtMs : null,
    intervalMs: running || paused ? intervalMs : null,
    cueAtMs: (running && cueAtMs >= timer.endsAtMs) || (paused && cueAtMs >= timer.remainingMs) ? null : cueAtMs,
  }
}

function projectEarlier(earlier, now) {
  const timer = earlier?.timer
  if (!record(earlier) || earlier.version !== 1 || !duration(earlier.durationMs) ||
      !integer(earlier.intervalMinutes, 0, 240) || typeof earlier.sound !== "boolean" ||
      !record(timer) || !["idle", "running", "paused", "complete"].includes(timer.status) ||
      !duration(timer.durationMs) || !integer(timer.remainingMs, 0, timer.durationMs) ||
      (timer.status !== "idle" && timer.durationMs === 0) ||
      (timer.status === "running" && !timestamp(timer.endsAt))) throw new Error("Invalid earlier timer record")
  // Its normal reader bounds a running deadline against the wall clock. Use
  // the start as the earliest read time if the clock was moved backward.
  const readAt = timer.status === "running" ? Math.max(now, timer.endsAt - timer.durationMs) : now
  const imported = importLegacyNativeClock(earlier, readAt)
  const state = imported.timer
  if (state.intervalMs && ["running", "paused"].includes(timer.status)) {
    const elapsed = timer.durationMs - state.remainingMs
    // A backward clock correction must not replay an already consumed cue.
    const consumed = integer(timer.lastAlertIndex, 0, MAX_CHIMER_DURATION_MS) ? timer.lastAlertIndex : 0
    const next = Math.max(consumed, Math.floor(elapsed / state.intervalMs)) + 1
    const offset = next * state.intervalMs - elapsed
    const pending = offset < state.remainingMs ? offset : null
    state.nextAlertAtMs = timer.status === "running" && pending !== null ? readAt + pending : null
    state.msUntilNextAlert = timer.status === "paused" ? pending : null
  }
  if (timer.status === "running") {
    state.status = "running"
    state.endsAtMs = timer.endsAt
  }
  return projectTimerSnapshot(imported.settings, state)
}

/** Read the known app-private WebView keys, in the same precedence as the old
 * host. Fail closed on malformed or inaccessible data. No writes or fallback
 * to account, planner, download, or website storage. */
async function readTimerSnapshot(indexedDB, localStorage, now) {
  const shared = await readClockRecord(indexedDB, NATIVE_CLOCK_DATABASE, "clock", "state")
  if (shared !== undefined) {
    if (!record(shared) || shared.version !== 1) throw new Error("Invalid shared timer record")
    return projectTimerSnapshot(shared.settings, shared.timer)
  }
  const earlier = await readClockRecord(indexedDB, OFFLINE_CORE_STORAGE_KEY, "state", "preferences")
  if (earlier !== undefined) return projectEarlier(earlier, now)
  const raw = localStorage.getItem(OFFLINE_CORE_STORAGE_KEY)
  if (raw === null) return projectTimerSnapshot({}, { status: "idle", totalMs: 0, remainingMs: 0 })
  if (raw.length > 16384) throw new Error("Earlier timer record is too large")
  return projectEarlier(JSON.parse(raw), now)
}

/** Saved setups are optional templates. Project only their timer controls,
 * never their background or other fields. A malformed template cannot hide
 * a valid active deadline and its original bytes are retained. */
function readSavedSetups(localStorage, setup) {
  function read(key) {
    // Storage denial must reach the retryable transfer error. An absent or
    // malformed optional template can still be omitted without touching it.
    const raw = localStorage.getItem(key)
    try {
      return raw && raw.length <= 32_768 ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }
  function project(settings, name) {
    const { keepAwake, showSeconds } = setup
    const clean = sanitizeChimerSettings(settings)
    return { name, setup: {
      ...projectTimerSetup(clean), keepAwake, showSeconds,
      interval: settings.skipIntervalCues === true ? "none" : clean.intervalType,
    } }
  }
  const earlier = read("chimer-setup-presets-v1")
  const templates = Array.isArray(earlier) ? earlier.filter(value => record(value) && record(value.settings) &&
    typeof value.id === "string" && value.id.trim())
    .sort((a, b) => (Number.isFinite(b.createdAt) ? b.createdAt : 0) - (Number.isFinite(a.createdAt) ? a.createdAt : 0))
    .slice(0, 12).map(value => project(value.settings,
      typeof value.name === "string" && value.name.trim() ? value.name.trim().slice(0, 80) : "Saved setup")) : []
  const last = read("chimer-last-setup-v1")
  return record(last) ? [project(last, null), ...templates] : templates
}

export async function exportTimerSnapshot(indexedDB, localStorage, now = Date.now()) {
  const snapshot = await readTimerSnapshot(indexedDB, localStorage, now)
  return { ...snapshot, savedSetups: readSavedSetups(localStorage, snapshot.setup) }
}
