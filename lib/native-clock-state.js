import { DEFAULT_CHIMER_SETTINGS, clampActiveTimerMs, sanitizeChimerSettings } from "./chimer-timer.js"
import { normalizeSharedBackgroundVisualPreferences } from "./background-palette.js"
import { readOfflineTimer } from "./offline-core.js"

/** Read-only import from the old five-tool preview. The original record also
 * permits an APK rollback without a reverse/destructive migration. */
export function importLegacyNativeClock(legacy, now = Date.now()) {
  const timer = readOfflineTimer(legacy.timer, now)
  const settings = sanitizeChimerSettings({ ...DEFAULT_CHIMER_SETTINGS,
    hours: Math.floor(legacy.durationMs / 3600000), minutes: Math.floor(legacy.durationMs / 60000) % 60,
    backgroundId: legacy.backgroundId, movingBackgroundEnabled: legacy.motion,
    timeFormat: legacy.timeFormat, showCurrentTimeSeconds: legacy.showSeconds,
    intervalType: legacy.intervalMinutes === 0 ? "none" : "custom", customInterval: legacy.intervalMinutes,
    alertType: legacy.sound ? "chime" : "silent",
    backgroundVisualPreferences: normalizeSharedBackgroundVisualPreferences({ palette: {
      mode: "custom", primaryColor: legacy.mainColor, swatches: [legacy.mainColor, legacy.orbColor],
    } }),
  })
  const intervalMs = legacy.intervalMinutes > 0 ? legacy.intervalMinutes * 60000 : null
  // Keep the old timer's elapsed-time grid, including the unfinished interval
  // of a paused session. Missed cues are not replayed after an upgrade.
  const elapsedMs = timer.durationMs - timer.remainingMs
  const untilNext = intervalMs ? intervalMs - elapsedMs % intervalMs : null
  const pending = untilNext && untilNext < timer.remainingMs ? untilNext : null
  return { version: 1, settings, timer: { status: timer.status, totalMs: timer.durationMs, remainingMs: timer.remainingMs,
    endsAtMs: timer.endsAt, intervalMs, nextAlertAtMs: timer.status === "running" && pending ? now + pending : null,
    msUntilNextAlert: timer.status === "paused" ? pending : null } }
}

/** Reject malformed runtime state while applying the website's settings
 * sanitizer. An absent or failed read is handled separately by the store. */
export function normalizeNativeClock(value, now = Date.now()) {
  if (!value || value.version !== 1 || !value.settings || !value.timer) throw new Error("Saved Clock state is invalid.")
  const input = value.timer
  if (!["idle", "clock", "running", "paused", "complete"].includes(input.status)
    || !Number.isSafeInteger(input.totalMs) || input.totalMs < 0 || clampActiveTimerMs(input.totalMs) !== input.totalMs
    || !Number.isSafeInteger(input.remainingMs) || input.remainingMs < 0 || input.remainingMs > input.totalMs
    || input.status === "running" && (!Number.isSafeInteger(input.endsAtMs) || input.endsAtMs <= 0)) throw new Error("Saved timer state is invalid.")
  const remainingMs = input.status === "running" ? Math.max(0, Math.min(input.totalMs, input.endsAtMs - now)) : input.remainingMs
  const intervalMs = Number.isSafeInteger(input.intervalMs) && input.intervalMs > 0 ? input.intervalMs : null
  let nextAlertAtMs = input.status === "running" && remainingMs > 0 && intervalMs
    && Number.isSafeInteger(input.nextAlertAtMs) && input.nextAlertAtMs > 0 ? input.nextAlertAtMs : null
  // Advance in constant time instead of dropping an overdue schedule or
  // replaying every missed interval through the shared timer's tick loop.
  if (nextAlertAtMs && nextAlertAtMs <= now) nextAlertAtMs += (Math.floor((now - nextAlertAtMs) / intervalMs) + 1) * intervalMs
  if (nextAlertAtMs && (!Number.isSafeInteger(nextAlertAtMs) || nextAlertAtMs >= input.endsAtMs)) nextAlertAtMs = null
  return { version: 1, settings: sanitizeChimerSettings(value.settings), timer: {
    status: input.status === "running" && remainingMs === 0 ? "complete" : input.status,
    totalMs: input.totalMs, remainingMs, endsAtMs: input.status === "running" && remainingMs > 0 ? input.endsAtMs : null,
    intervalMs, nextAlertAtMs,
    msUntilNextAlert: Number.isSafeInteger(input.msUntilNextAlert) && input.msUntilNextAlert > 0 ? input.msUntilNextAlert : null,
  } }
}

/** Running remaining time derives from its deadline, so UI ticks need no
 * durable write. Pause, adjustment, settings and interval consumption do. */
export function nativeClockCommitKey(settings, timer) {
  return JSON.stringify({ settings, timer: { ...timer, remainingMs: timer.status === "running" ? null : timer.remainingMs } })
}
