// @ts-check
import { personalReminderOccurrences } from "./wellness-calendar-view.js"
import { wellnessRecordingLabel } from "./wellness-catalog.js"

export const PRIVATE_CALENDAR_PREFIX = "private:"

/** Display-only identity. These IDs must never reach scheduling writes.
 * @param {unknown} id */
export function isPrivateCalendarEvent(id) { return typeof id === "string" && id.startsWith(PRIVATE_CALENDAR_PREFIX) }

/** Projects only titles/times and private lookup keys into the calendar library.
 * Full records stay in the owner-bound controller, outside scheduling payloads.
 * Point recordings/reminders get a one-second visual marker, never a busy block.
 * @param {import("../app/wellness/calendar-actions").PersonalCalendarData | null} data
 * @param {{start:string,end:string,practiceAppointmentIds?:string[],showCancelledEvents?:boolean}} options */
export function buildPrivateCalendarEvents(data, { start, end, practiceAppointmentIds = [], showCancelledEvents = false }) {
  if (!data) return []
  const shownVisits = new Set(practiceAppointmentIds)
  /** @param {string} at */
  const markerEnd = (at) => new Date(Date.parse(at) + 1000).toISOString()
  const items = [
    ...data.records.map((record) => ({ id: `private:record:${record.id}`, title: wellnessRecordingLabel(record), start: record.occurredAt, end: markerEnd(record.occurredAt), kind: "personal-record", recordId: record.id })),
    ...data.appointments.filter((visit) => !shownVisits.has(visit.id) && (showCancelledEvents || visit.status !== "CANCELLED"))
      .map((visit) => ({ id: `private:appointment:${visit.id}`, title: `${visit.title} · ${visit.practiceName}`, start: visit.at, end: visit.end, kind: "personal-appointment", recordId: "" })),
    ...personalReminderOccurrences(data.schedules, start, end).map((item) => ({ id: `private:${item.id}`, title: item.title, start: item.at, end: markerEnd(item.at), kind: "personal-reminder", recordId: "" })),
  ]
  return items.map((item) => ({
    id: item.id, title: item.title, start: item.start, end: item.end,
    editable: false, startEditable: false, durationEditable: false,
    backgroundColor: "#7052a3", borderColor: "#7052a3",
    extendedProps: { kind: item.kind, personalRecordId: item.recordId, statusBadge: "Private · Only you" },
  }))
}
