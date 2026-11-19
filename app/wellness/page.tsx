import { HeartPulse } from "lucide-react"
import type { Prisma } from "@prisma/client"
import { getCurrentRscSession as getCurrentSession } from "@/lib/rsc-session"
import { WellnessHubClient, type WellnessTimelineEntry } from "@/components/wellness/wellness-hub-client"
import type {
  ClientWellnessReminderSchedule,
  WellnessAppointmentSummary,
} from "@/components/wellness/wellness-calendar-companion"
import { normalizeClientWellnessReminderSchedules } from "@/lib/client-wellness-reminders"
import { prisma } from "@/lib/prisma"
import { createPublicPageMetadata } from "@/lib/seo"

import styles from "./wellness.module.css"

export const metadata = createPublicPageMetadata("/wellness")

const wellnessAppointmentInclude = {
  practice: { select: { name: true, timezone: true } },
  therapist: { select: { name: true } },
  event: { select: { title: true, startsAt: true, endsAt: true, timezone: true, status: true } },
  serviceItems: {
    select: {
      serviceName: true,
      serviceVariantName: true,
      sortOrder: true,
    },
    orderBy: { sortOrder: "asc" },
  },
} satisfies Prisma.AppointmentInclude

export default async function WellnessPage() {
  const session = await getCurrentSession()
  const userId = session?.user?.id
  const now = new Date()
  const reportWindowStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const [entries, reportEntries, upcomingAppointments, pastAppointments, preference] = userId
    ? await Promise.all([
        prisma.clientWellnessEntry.findMany({
          where: { userId, deletedAt: null },
          orderBy: { occurredAt: "desc" },
          take: 25,
        }),
        // Pattern reports need the full bounded window; the visible timeline stays page-sized.
        prisma.clientWellnessEntry.findMany({
          where: { userId, deletedAt: null, occurredAt: { gte: reportWindowStart } },
          orderBy: { occurredAt: "desc" },
          take: 250,
        }),
        prisma.appointment.findMany({
          where: {
            practiceClient: { userId },
            endsAt: { gte: now },
          },
          include: wellnessAppointmentInclude,
          orderBy: { startsAt: "asc" },
          take: 12,
        }),
        prisma.appointment.findMany({
          where: {
            practiceClient: { userId },
            endsAt: { lt: now },
          },
          include: wellnessAppointmentInclude,
          orderBy: { startsAt: "desc" },
          take: 12,
        }),
        prisma.clientWellnessPreference.findUnique({
          where: { userId },
          select: { settings: true },
        }),
      ])
    : [[], [], [], [], null]

  return (
    <div className={styles.page}>
      <div className={styles.workspace}>
        <header className={styles.header}>
          <div className={styles.titleRow}><HeartPulse aria-hidden="true" /><h1>Wellness</h1></div>
          <p>Check in with yourself, or take a moment to reset.</p>
          <p className={styles.privacy}>Client-owned self-tracking · {userId ? "Private to your account" : "Try without an account; sign in to save"}</p>
        </header>
        <WellnessHubClient
          isSignedIn={Boolean(userId)}
          displayName={session?.user?.name ?? session?.user?.email ?? null}
          initialEntries={entries.map(serializeWellnessEntry)}
          initialReportEntries={reportEntries.map(serializeWellnessEntry)}
          appointments={[...upcomingAppointments, ...pastAppointments].map(serializeWellnessAppointment)}
          reminderSchedules={reminderSchedulesFromPreference(preference?.settings)}
        />
      </div>
    </div>
  )
}

/**
 * Adapts a persisted wellness entry for the client timeline contract.
 *
 * The input is a database row with Date fields plus JSON-backed array/object
 * fields. Dates are emitted as ISO strings, regions/sensations/contexts are
 * filtered to string arrays, metadata is reduced to a plain object, and the
 * result is always marked as persisted because it came from signed-in storage.
 */
function serializeWellnessEntry(entry: {
  id: string
  category: string
  occurredAt: Date
  timezone: string
  summary: string | null
  intensity: number | null
  regions: unknown
  sensations: unknown
  contexts: unknown
  source: string
  metadata: unknown
  createdAt: Date
  updatedAt: Date
}): WellnessTimelineEntry {
  return {
    id: entry.id,
    category: entry.category,
    occurredAt: entry.occurredAt.toISOString(),
    timezone: entry.timezone,
    summary: entry.summary,
    intensity: entry.intensity,
    regions: Array.isArray(entry.regions) ? entry.regions.filter(isString) : [],
    sensations: Array.isArray(entry.sensations) ? entry.sensations.filter(isString) : [],
    contexts: Array.isArray(entry.contexts) ? entry.contexts.filter(isString) : [],
    source: entry.source,
    metadata: entry.metadata && typeof entry.metadata === "object" && !Array.isArray(entry.metadata)
      ? (entry.metadata as Record<string, unknown>)
      : {},
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    persisted: true,
  }
}

function isString(value: unknown): value is string {
  return typeof value === "string"
}

/**
 * Serializes appointment rows for the client-owned wellness calendar companion.
 *
 * The query intentionally avoids appointment notes and practice-client contact
 * fields, so this adapter only emits operational labels, timing, and status.
 */
function serializeWellnessAppointment(appointment: {
  id: string
  status: string
  source: string
  startsAt: Date
  endsAt: Date
  serviceName: string | null
  serviceVariantName: string | null
  practice: { name: string; timezone: string }
  therapist: { name: string | null }
  event: { title: string; startsAt: Date; endsAt: Date; timezone: string; status: string }
  serviceItems: Array<{ serviceName: string | null; serviceVariantName: string | null; sortOrder: number }>
}): WellnessAppointmentSummary {
  const serviceItemLabels = appointment.serviceItems
    .map((item) => [item.serviceName, item.serviceVariantName].filter(Boolean).join(" - "))
    .filter(Boolean)
  const serviceLabel = serviceItemLabels.length > 0
    ? serviceItemLabels.join(" + ")
    : [appointment.serviceName, appointment.serviceVariantName].filter(Boolean).join(" - ") || appointment.event.title || "Appointment"

  return {
    id: appointment.id,
    status: appointment.status,
    source: appointment.source,
    startsAt: appointment.startsAt.toISOString(),
    endsAt: appointment.endsAt.toISOString(),
    timezone: appointment.event.timezone || appointment.practice.timezone,
    practiceName: appointment.practice.name,
    therapistLabel: appointment.therapist.name ?? "Provider",
    serviceLabel,
  }
}

function reminderSchedulesFromPreference(settings: unknown): ClientWellnessReminderSchedule[] {
  const payload = settings && typeof settings === "object" && !Array.isArray(settings) ? settings as Record<string, unknown> : {}
  return normalizeClientWellnessReminderSchedules(payload.reminderSchedules) as ClientWellnessReminderSchedule[]
}
