import "server-only"

import { prisma } from "@/lib/prisma"
import { assertCalendarDatabaseReady } from "@/lib/calendar-readiness"
import { pushCalendarEventToGoogleBestEffort } from "@/lib/calendar-sync-service"
import { redirect } from "next/navigation"
import { lockAppointmentSchedulingRows } from "./availability"
import { writeCalendarAuditAndNotifications } from "./audit"
import { revalidateCalendarRoutes } from "./revalidation"
import { THERAPIST_ROLES, assertPracticeAccess, currentUserId, fieldString } from "./access"

const CANCEL_EVENT_INCLUDE = { practice: { select: { slug: true } }, personalBlock: true } as const

/** Authorize only practice owners or the therapist whose Personal block is changing. */
function assertCancellationAccess(role: string | undefined, actorId: string, event: { kind: string; ownerUserId: string | null; personalBlock: unknown }) {
  if (event.kind !== "PERSONAL" || !event.personalBlock || !event.ownerUserId
    || (role !== "OWNER" && (role !== "THERAPIST" || event.ownerUserId !== actorId))) {
    throw new Error("You do not have access to cancel this personal block.")
  }
}

/**
 * Cancel personal blocked time without deleting its history. Recheck ownership,
 * current role and event times under the shared scheduling locks so stale forms
 * cannot cancel a reassigned/rescheduled event. Google removal follows commit;
 * a provider failure must not undo a successful local cancellation.
 */
export async function cancelPersonalEvent(formData: FormData) {
  const userId = await currentUserId()
  await assertCalendarDatabaseReady()
  const eventId = fieldString(formData, "eventId")
  if (!eventId) throw new Error("Choose a personal block to cancel.")
  // Bind the action to what was displayed, not a newer snapshot first read at
  // submission. Old clients must refresh rather than cancel a changed block.
  const expectedStartsAt = Date.parse(fieldString(formData, "expectedStartsAt"))
  const expectedEndsAt = Date.parse(fieldString(formData, "expectedEndsAt"))
  const expectedOwnerUserId = fieldString(formData, "expectedOwnerUserId")
  const expectedPracticeId = fieldString(formData, "expectedPracticeId")
  if (!Number.isFinite(expectedStartsAt) || !Number.isFinite(expectedEndsAt)
    || !expectedOwnerUserId || !expectedPracticeId) {
    throw new Error("This personal block changed. Refresh availability and try again.")
  }
  const snapshot = await prisma.calendarEvent.findUnique({ where: { id: eventId }, include: CANCEL_EVENT_INCLUDE })
  if (!snapshot) throw new Error("Choose a valid personal block.")
  const membership = await assertPracticeAccess(snapshot.practiceId, userId, THERAPIST_ROLES)
  assertCancellationAccess(membership.role, userId, snapshot)
  const ownerUserId = snapshot.ownerUserId!

  await prisma.$transaction(async (tx) => {
    await lockAppointmentSchedulingRows(tx, {
      practiceId: snapshot.practiceId, therapistId: ownerUserId, resourceIds: [],
      startsAt: snapshot.startsAt, endsAt: snapshot.endsAt, eventIds: [snapshot.id],
    })
    const event = await tx.calendarEvent.findUnique({ where: { id: eventId }, include: CANCEL_EVENT_INCLUDE })
    const currentMembership = await tx.practiceMembership.findUnique({
      where: { practiceId_userId: { practiceId: snapshot.practiceId, userId } },
    })
    if (!event || event.practiceId !== snapshot.practiceId || event.ownerUserId !== ownerUserId
      || event.startsAt.getTime() !== snapshot.startsAt.getTime() || event.endsAt.getTime() !== snapshot.endsAt.getTime()
      || event.practiceId !== expectedPracticeId || event.ownerUserId !== expectedOwnerUserId
      || event.startsAt.getTime() !== expectedStartsAt || event.endsAt.getTime() !== expectedEndsAt) {
      throw new Error("This personal block changed. Refresh availability and try again.")
    }
    assertCancellationAccess(currentMembership?.role, userId, event)
    // Repeated cancellation keeps one audit entry while allowing an owned Google removal to finish.
    if (event.status === "CANCELLED") return
    if (event.status !== "ACTIVE") throw new Error("This personal block can no longer be cancelled.")
    const changed = await tx.calendarEvent.updateMany({
      where: { id: eventId, practiceId: snapshot.practiceId, ownerUserId, kind: "PERSONAL", status: "ACTIVE",
        startsAt: snapshot.startsAt, endsAt: snapshot.endsAt },
      data: { status: "CANCELLED", blocksAvailability: false },
    })
    if (changed.count !== 1) throw new Error("This personal block changed. Refresh availability and try again.")
    await writeCalendarAuditAndNotifications(tx, {
      practiceId: event.practiceId, eventId: event.id, actorUserId: userId,
      action: "PERSONAL_CANCELLED", recipientUserIds: ownerUserId === userId ? [] : [ownerUserId],
      payload: { status: "CANCELLED" },
    })
  })

  const syncResult = await pushCalendarEventToGoogleBestEffort(eventId)
  revalidateCalendarRoutes(snapshot.practice.slug)
  const googleFailed = Boolean(syncResult && "error" in syncResult)
  redirect(`/calendar/availability?block=cancelled${googleFailed ? "&google=error" : ""}`)
}
