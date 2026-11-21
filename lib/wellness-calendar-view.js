// @ts-check
import { normalizeClientWellnessReminderSchedules, CLIENT_WELLNESS_REMINDER_KINDS } from "./client-wellness-reminders.js"

/** Local date identity, never an ISO UTC day. This keeps late-night recordings
 * and DST-spanning months on the day the viewer actually sees.
 * @param {Date} date */
export function localDayKey(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}` }

/** @param {string} value @returns {Date|null} */
export function parseLocalDay(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(0); date.setFullYear(year, month - 1, day); date.setHours(12,0,0,0)
  return localDayKey(date) === value ? date : null
}

/** Month navigation uses local calendar arithmetic, including 23/25-hour days.
 * @param {string} day @param {number} [offset] */
export function calendarMonth(day, offset = 0) {
  const anchor = parseLocalDay(day) ?? new Date()
  const start = new Date(anchor); start.setDate(1); start.setMonth(start.getMonth() + offset); start.setHours(0,0,0,0)
  const end = new Date(start); end.setMonth(end.getMonth() + 1)
  const first = new Date(start); first.setDate(first.getDate() - first.getDay()); first.setHours(12)
  const length = Math.ceil((start.getDay() + new Date(end.getFullYear(), end.getMonth(), 0).getDate()) / 7) * 7
  return { key: localDayKey(start).slice(0,7), start: start.toISOString(), end: end.toISOString(), days: Array.from({length}, (_, index) => { const date = new Date(first); date.setDate(date.getDate() + index); return localDayKey(date) }) }
}

/** A public action may request only a bounded date window and a validated
 * keyset position. No owner/practice identity is accepted from the browser.
 * @param {unknown} value */
export function parsePersonalCalendarRequest(value) {
  const input = value && typeof value === "object" ? /** @type {Record<string,unknown>} */(value) : {}
  const start = typeof input.start === "string" ? new Date(input.start) : new Date(NaN), end = typeof input.end === "string" ? new Date(input.end) : new Date(NaN)
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start || end.getTime() - start.getTime() > 40 * 86400000) return null
  const load = input.load ?? "all"
  if (!["all","records","appointments"].includes(String(load))) return null
  const recordCursor = readPosition(input.recordCursor), appointmentCursor = readPosition(input.appointmentCursor)
  if (recordCursor === false || appointmentCursor === false) return null
  return { start, end, load: String(load), recordCursor, appointmentCursor }
}

/** @param {unknown} value @returns {{at:Date,id:string}|null|false} */
function readPosition(value) {
  if (value === undefined || value === null) return null
  if (typeof value !== "string" || value.length > 512) return false
  try { const input = JSON.parse(value), at = new Date(input.at); return typeof input.id === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(input.id) && Number.isFinite(at.getTime()) ? { at, id: input.id } : false } catch { return false }
}

/** Generic in-app occurrences describe the current schedule, not a delivery
 * receipt or a record that the person completed a check-in.
 * @param {unknown} schedules @param {string} startIso @param {string} endIso */
export function personalReminderOccurrences(schedules, startIso, endIso) {
  const start = new Date(startIso), end = new Date(endIso), items = []
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start || end.getTime() - start.getTime() > 40 * 86400000) return []
  for (const schedule of normalizeClientWellnessReminderSchedules(schedules)) {
    if (!schedule.enabled) continue
    for (let day = new Date(start); day < end; day.setDate(day.getDate() + 1)) {
      const [hour, minute] = schedule.timeOfDay.split(":").map(Number)
      const at = new Date(day); at.setHours(hour, minute, 0, 0)
      if (at < start || at >= end || schedule.cadence !== "daily" && !schedule.weekdays.includes(at.getDay())) continue
      items.push({ id: `reminder:${schedule.id}:${localDayKey(at)}`, kind: "reminder", title: CLIENT_WELLNESS_REMINDER_KINDS.find((row) => row.id === schedule.kind)?.label ?? "Wellness reminder", at: at.toISOString() })
    }
  }
  return items.sort((a,b) => a.at.localeCompare(b.at))
}

/** Appointment spans occupy every overlapping local day; end-at-midnight is
 * exclusive. Recordings/reminders are points and never block appointment time.
 * @param {{at:string,end?:string}} item @param {string} day */
export function personalItemOnDay(item, day) {
  const date = parseLocalDay(day)
  if (!date) return false
  const start = new Date(date); start.setHours(0,0,0,0)
  const end = new Date(start); end.setDate(end.getDate() + 1)
  const at = Date.parse(item.at), until = item.end ? Date.parse(item.end) : at
  return Number.isFinite(at) && (Number.isFinite(until) && until > at ? at < end.getTime() && until > start.getTime() : at >= start.getTime() && at < end.getTime())
}
