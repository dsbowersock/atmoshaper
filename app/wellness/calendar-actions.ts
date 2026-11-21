"use server"

import { getCurrentSession } from "@/auth"
import { prisma } from "@/lib/prisma"
import { normalizeClientWellnessEntryInput } from "@/lib/client-wellness"
import { normalizeClientWellnessReminderSchedules } from "@/lib/client-wellness-reminders"
import { parsePersonalCalendarRequest } from "@/lib/wellness-calendar-view"
import type { WellnessTimelineEntry } from "@/components/wellness/wellness-hub-client"
import type { ClientWellnessReminderSchedule } from "@/components/wellness/wellness-calendar-companion"

export type PersonalAppointment = { id: string; at: string; end: string; title: string; practiceName: string; status: string }
export type PersonalCalendarData = { records: WellnessTimelineEntry[]; appointments: PersonalAppointment[]; schedules: ClientWellnessReminderSchedule[]; recordCursor: string | null; appointmentCursor: string | null }
const PAGE_SIZE = 200

/** Read only the signed-in owner's visible date range. Keyset positions are
 * filters inside that owner scope, never global cursors that look up another
 * person's row. Responses are private display data, not scheduling events or
 * outbound payloads. Required-read failure never returns a false empty month. */
export async function loadPersonalWellnessCalendarAction(input: unknown): Promise<{ ok: boolean; reason?: string; ownerKey?: string; data?: PersonalCalendarData }> {
  const session = await getCurrentSession(), userId = session?.user?.id
  if (!userId) return { ok: false, reason: "sign-in-required" }
  const range = parsePersonalCalendarRequest(input)
  if (!range) return { ok: false, reason: "invalid-calendar-range" }
  const { start, end, recordCursor, appointmentCursor, load } = range
  try {
    const [records, appointments, preference] = await Promise.all([
      load === "appointments" ? [] : prisma.clientWellnessEntry.findMany({
        where: { userId, deletedAt: null, occurredAt: { gte: start, lt: end }, ...(recordCursor ? { OR: [{ occurredAt: { gt: recordCursor.at } }, { occurredAt: recordCursor.at, id: { gt: recordCursor.id } }] } : {}) },
        select: { id: true, category: true, occurredAt: true, timezone: true, summary: true, intensity: true, regions: true, sensations: true, contexts: true, source: true, metadata: true, createdAt: true, updatedAt: true },
        orderBy: [{ occurredAt: "asc" }, { id: "asc" }], take: PAGE_SIZE + 1,
      }),
      load === "records" ? [] : prisma.appointment.findMany({
        where: { practiceClient: { userId }, startsAt: { lt: end }, endsAt: { gt: start }, ...(appointmentCursor ? { OR: [{ startsAt: { gt: appointmentCursor.at } }, { startsAt: appointmentCursor.at, id: { gt: appointmentCursor.id } }] } : {}) },
        select: { id: true, startsAt: true, endsAt: true, status: true, serviceName: true, serviceVariantName: true, practice: { select: { name: true } }, serviceItems: { select: { serviceName: true, serviceVariantName: true }, orderBy: { sortOrder: "asc" } } },
        orderBy: [{ startsAt: "asc" }, { id: "asc" }], take: PAGE_SIZE + 1,
      }),
      prisma.clientWellnessPreference.findUnique({ where: { userId }, select: { settings: true } }),
    ])
    const recordPage = records.slice(0,PAGE_SIZE), appointmentPage = appointments.slice(0,PAGE_SIZE)
    const settings = preference?.settings && typeof preference.settings === "object" && !Array.isArray(preference.settings) ? preference.settings as Record<string,unknown> : {}
    // Bind private display responses to their authenticated actor. This is never
    // a browser-supplied query scope or a practice-sharing permission.
    return { ok: true, ownerKey: userId, data: {
      records: recordPage.map((row) => { const normalized = normalizeClientWellnessEntryInput(row); return { ...normalized, id: row.id, occurredAt: normalized.occurredAt.toISOString(), createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(), persisted: true } }),
      appointments: appointmentPage.map((row) => ({ id: row.id, at: row.startsAt.toISOString(), end: row.endsAt.toISOString(), status: row.status, practiceName: row.practice.name, title: row.serviceItems.map((item) => [item.serviceName,item.serviceVariantName].filter(Boolean).join(" - ")).filter(Boolean).join(" + ") || [row.serviceName,row.serviceVariantName].filter(Boolean).join(" - ") || "Appointment" })),
      schedules: normalizeClientWellnessReminderSchedules(settings.reminderSchedules),
      recordCursor: records.length > PAGE_SIZE ? JSON.stringify({ at: recordPage.at(-1)!.occurredAt.toISOString(), id: recordPage.at(-1)!.id }) : null,
      appointmentCursor: appointments.length > PAGE_SIZE ? JSON.stringify({ at: appointmentPage.at(-1)!.startsAt.toISOString(), id: appointmentPage.at(-1)!.id }) : null,
    } }
  } catch { return { ok: false, reason: "calendar-load-failed" } }
}
