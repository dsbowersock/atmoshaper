import { DEFAULT_CHIMER_SETTINGS, MAX_CHIMER_DURATION_MS } from "./chimer-timer.js"
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

/** Project only timer choices and state. Preserve a running absolute deadline
 * even if it passed during transfer. Android reconciles it when opening. */
function project(settings, timer) {
  if (!record(settings)) throw new Error("Invalid packaged timer settings")
  const read = (key, valid) => {
    const value = Object.hasOwn(settings, key) ? settings[key] : DEFAULT_CHIMER_SETTINGS[key]
    if (!valid(value)) throw new Error("Invalid packaged timer setting")
    return value
  }
  const setup = {
    hours: read("hours", value => integer(value, 0, 23)),
    minutes: read("minutes", value => integer(value, 0, 59)),
    interval: read("intervalType", value => intervals.has(value)),
    intervalMinutes: read("customInterval", value => integer(value, 1, 240)),
    areas: read("areasToMassage", value => integer(value, 1, 24)),
    cue: read("alertType", value => cues.has(value)),
    volume: read("alertVolume", value => Number.isFinite(value) && value >= 0 && value <= 1),
    vibrationMs: read("hapticIntensityMs", value => integer(value, 10, 30)),
    keepAwake: read("keepTimerScreenAwake", value => typeof value === "boolean"),
    showSeconds: read("showTimerSeconds", value => typeof value === "boolean"),
  }
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
  const cueAtMs = running ? timer.nextAlertAtMs ?? null : paused ? timer.msUntilNextAlert ?? null : null
  if (cueAtMs !== null && (!timestamp(cueAtMs) || intervalMs === null)) throw new Error("Invalid packaged timer cue")
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
  if (timer.status === "running") {
    imported.timer.status = "running"
    imported.timer.endsAtMs = timer.endsAt
  }
  return project(imported.settings, imported.timer)
}

/** Read the known app-private WebView keys, in the same precedence as the old
 * host. Fail closed on malformed or inaccessible data. No writes or fallback
 * to account, planner, download, or website storage. */
export async function exportTimerSnapshot(indexedDB, localStorage, now = Date.now()) {
  const shared = await readClockRecord(indexedDB, NATIVE_CLOCK_DATABASE, "clock", "state")
  if (shared !== undefined) {
    if (!record(shared) || shared.version !== 1) throw new Error("Invalid shared timer record")
    return project(shared.settings, shared.timer)
  }
  const earlier = await readClockRecord(indexedDB, OFFLINE_CORE_STORAGE_KEY, "state", "preferences")
  if (earlier !== undefined) return projectEarlier(earlier, now)
  const raw = localStorage.getItem(OFFLINE_CORE_STORAGE_KEY)
  if (raw === null) return project({}, { status: "idle", totalMs: 0, remainingMs: 0 })
  if (raw.length > 16384) throw new Error("Earlier timer record is too large")
  return projectEarlier(JSON.parse(raw), now)
}
