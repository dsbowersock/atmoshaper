"use server"

import { getCurrentSession } from "@/auth"
import { prisma } from "@/lib/prisma"
import { claimOnboardingInvitation, chooseOnboardingSetup } from "@/lib/onboarding-setup-service"
import { clearAccountSurfaceDataCache } from "@/lib/account-surface-data"

/** The rendered owner must still own the session when the invitation is claimed. */
export async function claimSetupInvitationAction(expectedOwner: string) {
  const session = await getCurrentSession()
  if (!session?.user?.id || session.user.id !== expectedOwner) return { ok: false as const }
  try {
    const kind = await claimOnboardingInvitation(prisma, session.user.id)
    return { ok: true as const, show: kind !== null, kind }
  } catch { return { ok: false as const } }
}

/** Only explicit setup choices are accepted; neither can reset a consumed offer. */
export async function chooseSetupInvitationAction(expectedOwner: string, choice: "started" | "skipped", kind: "new" | "resume") {
  const session = await getCurrentSession()
  if (!session?.user?.id || session.user.id !== expectedOwner || !["started", "skipped"].includes(choice) || !["new", "resume"].includes(kind)) {
    return { ok: false as const }
  }
  try {
    const selected = await chooseOnboardingSetup(prisma, session.user.id, choice, kind)
    clearAccountSurfaceDataCache(session.user.id, "sync")
    clearAccountSurfaceDataCache(session.user.id, "overview")
    return { ok: true as const, choice: selected }
  } catch { return { ok: false as const } }
}
