"use server"

import { redirect } from "next/navigation"
import { getCurrentSession } from "@/auth"
import { clearAccountSurfaceDataCache } from "@/lib/account-surface-data"
import { buildOnboardingPreference } from "@/lib/onboarding-preferences"
import { prisma } from "@/lib/prisma"
import { onboardingReturnTo } from "@/lib/onboarding-setup"
import { saveOnboardingProgress } from "@/lib/onboarding-setup-service"

/** Autosave only bounded setup answers for the owner who opened this form.
 * Drafts remain separate from applied preferences until explicit completion. */
export async function saveOnboardingDraftAction(expectedOwner: string, revision: number, formData: FormData) {
  const session = await getCurrentSession()
  if (!session?.user?.id || session.user.id !== expectedOwner) return { ok: false as const }
  try { return await saveOnboardingProgress(prisma, session.user.id, revision, formData) }
  catch { return { ok: false as const } }
}

/** Finishing advances the draft revision so an older tab or late autosave can
 * never overwrite the completed answers. Auth/consent still guard every write. */
export async function saveOnboardingAction(expectedOwner: string, revision: number, formData: FormData) {
  const session = await getCurrentSession()
  if (!session?.user?.id || session.user.id !== expectedOwner) return { ok: false as const }
  let result
  try { result = await saveOnboardingProgress(prisma, session.user.id, revision, formData, true) }
  catch { return { ok: false as const } }
  if (!result.ok) return result
  clearAccountSurfaceDataCache(session.user.id, "sync")
  clearAccountSurfaceDataCache(session.user.id, "overview")
  const requestedReturnTo = formData.get("returnTo")
  redirect(typeof requestedReturnTo === "string"
    ? onboardingReturnTo(requestedReturnTo) : buildOnboardingPreference(formData).recommendedPath)
}
