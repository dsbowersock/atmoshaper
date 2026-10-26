import Link from "next/link"
import { Plus } from "lucide-react"
import { getCurrentRscSession as getCurrentSession } from "@/lib/rsc-session"
import { createPracticeAction } from "@/app/calendar/actions"
import { isCalendarDatabaseReady } from "@/lib/calendar-readiness"
import { normalizeCalendarPreferences } from "@/lib/calendar-preferences"
import { buildCalendarWorkspaceEvent, buildExternalCalendarBusyWorkspaceEvent } from "@/lib/calendar-workspace"
import { prisma } from "@/lib/prisma"
import { AppSurface, appSurfaceClassName } from "@/components/ui/app-surface"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CalendarGuidanceNotice } from "./calendar-guidance-notice"
import { CalendarOperatorShell } from "./calendar-operator-shell"
import { CalendarWorkspace } from "./calendar-workspace"

/** Scopes workspace reads to the signed-in member and shows safe unavailability when a required read fails. */
export default async function CalendarPage({
  searchParams,
}: {
  searchParams?: Promise<{ practice?: string; date?: string }>
}) {
  const session = await getCurrentSession()

  if (!session?.user?.id) {
    return (
      <CalendarShell>
        <AppSurface
          title="Sign in to use practice scheduling"
          description="Calendar data is cloud-backed practice metadata. Clinical notes remain local-first."
        >
            <Button asChild className="bg-primary hover:bg-brand-orange-glow">
              <Link href="/login">Go to login</Link>
            </Button>
        </AppSurface>
      </CalendarShell>
    )
  }

  if (!(await isCalendarDatabaseReady())) {
    return (
      <CalendarShell>
        <CalendarUnavailableNotice />
      </CalendarShell>
    )
  }

  const params = await searchParams
  const selectedPracticeId = params?.practice
  const requestedDate = normalizeCalendarDateParam(params?.date)
  let memberships

  try {
    memberships = await prisma.practiceMembership.findMany({
      where: { userId: session.user.id },
      include: {
        practice: true,
      },
      orderBy: { createdAt: "asc" },
    })
  } catch {
    return (
      <CalendarShell>
        <CalendarUnavailableNotice />
      </CalendarShell>
    )
  }

  if (memberships.length === 0) {
    return (
      <CalendarShell>
        <Card className={appSurfaceClassName}>
          <CardHeader>
            <CardTitle>Create a practice calendar</CardTitle>
            <CardDescription>This creates a small-practice scheduling workspace with you as owner.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createPracticeAction} className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <div className="space-y-2">
                <Label htmlFor="name">Practice name</Label>
                <Input id="name" name="name" placeholder="AtmoShaper Studio" required />
              </div>
              <Button type="submit" className="bg-primary hover:bg-brand-orange-glow">
                <Plus className="mr-2 h-4 w-4" />
                Create
              </Button>
            </form>
          </CardContent>
        </Card>
      </CalendarShell>
    )
  }

  const membership = memberships.find((row) => row.practiceId === selectedPracticeId) ?? memberships[0]
  const practice = membership.practice
  const workspaceData = await loadCalendarWorkspaceData(practice.id, session.user.id).catch(() => null)
  if (!workspaceData) {
    return (
      <CalendarShell>
        <CalendarUnavailableNotice />
      </CalendarShell>
    )
  }

  const { events, therapists, preferenceRow, availabilityRules, scheduleIntervals, externalBusyBlocks } = workspaceData
  const preferences = normalizeCalendarPreferences(preferenceRow?.calendarPreferences ?? {})
  const providers = therapists.map((therapist) => ({
    id: therapist.userId,
    label: therapist.user.name ?? therapist.user.email ?? "Provider",
  }))
  const workspaceEvents = [
    ...events.map((event) => buildCalendarWorkspaceEvent(event, preferences)),
    ...externalBusyBlocks.map((busyBlock) => buildExternalCalendarBusyWorkspaceEvent(busyBlock)),
  ]
  const providerAvailability = [
    ...availabilityRules.map((rule) => ({
      providerId: rule.therapistId,
      startMinute: rule.startMinute,
      endMinute: rule.endMinute,
    })),
    ...scheduleIntervals.map((interval) => ({
      providerId: interval.schedule.therapistId,
      startMinute: interval.startMinute,
      endMinute: interval.endMinute,
    })),
  ]

  return (
    <CalendarShell>
      <CalendarGuidanceNotice
        noticeKey="operator-privacy"
        title="Scheduling metadata only"
        description="Calendar events coordinate appointments, personal blocks, classes, and reminders. Keep SOAP notes, transcripts, pain maps, and client-specific clinical details in local-first documentation."
        preferences={preferences}
      />

      <CalendarWorkspace
        events={workspaceEvents}
        providers={providers}
        providerAvailability={providerAvailability}
        preferences={preferences}
        currentUserId={session.user.id}
        initialDate={requestedDate}
      />
    </CalendarShell>
  )
}

/**
 * Loads every required workspace read as one usable result. A readiness-cache
 * hit cannot guarantee later queries succeed; callers must not present missing
 * events, availability or external busy windows as an empty, bookable calendar.
 */
async function loadCalendarWorkspaceData(practiceId: string, userId: string) {
  const windowStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const windowEnd = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
  const [events, therapists, preferenceRow, availabilityRules, scheduleIntervals] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: {
        practiceId,
        startsAt: { lt: windowEnd },
        endsAt: { gt: windowStart },
      },
      include: {
        owner: { select: { name: true, email: true } },
        appointment: {
          include: {
            practiceClient: true,
            serviceType: true,
            serviceVariant: true,
            therapist: { select: { name: true, email: true } },
          },
        },
        personalBlock: {
          include: { therapist: { select: { name: true, email: true } } },
        },
        class: {
          include: { instructor: { select: { name: true, email: true } } },
        },
        reminder: true,
      },
      orderBy: { startsAt: "asc" },
      take: 500,
    }),
    prisma.practiceMembership.findMany({
      where: {
        practiceId,
        role: { in: ["OWNER", "THERAPIST"] },
      },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.userPreference.findUnique({
      where: { userId },
      select: { calendarPreferences: true },
    }),
    prisma.therapistAvailabilityRule.findMany({
      where: { practiceId, active: true },
      select: { therapistId: true, startMinute: true, endMinute: true },
    }),
    prisma.calendarAvailabilityScheduleInterval.findMany({
      where: {
        active: true,
        schedule: {
          practiceId,
          active: true,
        },
      },
      select: {
        startMinute: true,
        endMinute: true,
        schedule: { select: { therapistId: true } },
      },
    }),
  ])
  const providerIds = therapists.map((therapist) => therapist.userId)
  const externalBusyBlocks = providerIds.length > 0
    ? await prisma.externalCalendarBusyBlock.findMany({
      where: {
        ownerUserId: { in: providerIds },
        status: "BUSY",
        connection: { status: "ACTIVE" },
        source: { selectedForBusySync: true },
        startsAt: { lt: windowEnd },
        endsAt: { gt: windowStart },
      },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        ownerUserId: true,
      },
      take: 500,
      orderBy: { startsAt: "asc" },
    })
    : []
  return { events, therapists, preferenceRow, availabilityRules, scheduleIntervals, externalBusyBlocks }
}

/** Keeps sign-in, unavailable and ready states inside the same full-width operator geometry. */
function CalendarShell({ children }: { children: React.ReactNode }) {
  return <CalendarOperatorShell width="full" flush>{children}</CalendarOperatorShell>
}

/** Hides failed or partial private reads behind the established generic recovery message. */
function CalendarUnavailableNotice() {
  return (
    <AppSurface
      title="Calendar is temporarily unavailable"
      description="Practice scheduling is not available right now."
      contentClassName="text-sm text-muted-foreground"
    >
        <p>Please try again later or contact support if this keeps happening.</p>
    </AppSurface>
  )
}

/** Accepts a real calendar-only date, including years below 100 without Date.UTC's century remapping. */
function normalizeCalendarDateParam(value: unknown) {
  if (typeof value !== "string") return undefined

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return undefined

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, day)

  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    return undefined
  }

  return value
}
