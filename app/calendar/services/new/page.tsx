import Link from "next/link"
import { getCurrentRscSession as getCurrentSession } from "@/lib/rsc-session"
import { isCalendarDatabaseReady } from "@/lib/calendar-readiness"
import { prisma } from "@/lib/prisma"
import { AppSurface } from "@/components/ui/app-surface"
import { Button } from "@/components/ui/button"
import { CalendarOperatorShell } from "../../calendar-operator-shell"
import { ServiceForm } from "../service-form"

export default async function NewServicePage({ searchParams }: { searchParams?: Promise<{ practice?: string }> }) {
  const session = await getCurrentSession()
  const requestedPractice = (await searchParams)?.practice

  if (!session?.user?.id) {
    return <ServiceShell practiceId={requestedPractice}><Notice title="Sign in to create services" description="Service management requires an account." /></ServiceShell>
  }

  if (!(await isCalendarDatabaseReady())) {
    return <ServiceShell practiceId={requestedPractice}><Notice title="Calendar is temporarily unavailable" description="Service tools are not available right now." /></ServiceShell>
  }

  const membership = await prisma.practiceMembership.findFirst({
    // A route choice only narrows this actor's eligible memberships.
    where: { userId: session.user.id, role: { in: ["OWNER", "THERAPIST", "STAFF"] }, ...(requestedPractice ? { practiceId: requestedPractice } : {}) },
    include: { practice: true },
    orderBy: { createdAt: "asc" },
  })

  if (!membership) {
    return <ServiceShell practiceId={requestedPractice}><Notice title="No calendar workspace" description="Create or join a calendar workspace before creating services." /></ServiceShell>
  }

  const providers = await prisma.practiceMembership.findMany({
    where: {
      practiceId: membership.practiceId,
      role: { in: ["OWNER", "THERAPIST"] },
    },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  })

  return (
    <ServiceShell practiceId={membership.practiceId} practiceName={membership.practice.name}>
      <ServiceForm practiceId={membership.practiceId} providers={providers} />
    </ServiceShell>
  )
}

function ServiceShell({ children, practiceId, practiceName }: { children: React.ReactNode; practiceId?: string; practiceName?: string }) {
  return (
    <CalendarOperatorShell width="standard">
      <div className="flex justify-end">
        <Button asChild variant="outline"><Link href={practiceId ? `/calendar/services?practice=${encodeURIComponent(practiceId)}` : "/calendar/services"}>Services</Link></Button>
      </div>
      {practiceName ? <p className="text-sm text-muted-foreground">Practice: {practiceName}</p> : null}
      {children}
    </CalendarOperatorShell>
  )
}

function Notice({ title, description }: { title: string; description: string }) {
  return <AppSurface title={title} description={description} />
}
