import { redirect } from "next/navigation"
import { getCurrentRscSession } from "@/lib/rsc-session"
import { prisma } from "@/lib/prisma"
import { onboardingInvitationKind, onboardingInvitationPath, onboardingReturnTo } from "@/lib/onboarding-setup"
import { OnboardingInvitation } from "@/components/account/onboarding-invitation"

export const dynamic = "force-dynamic"

/** Read the invitation only. Its visible client claims it through a POST action. */
export default async function OnboardingWelcomePage({ searchParams }: {
  searchParams: Promise<{ returnTo?: string }>
}) {
  const returnTo = onboardingReturnTo((await searchParams).returnTo)
  const session = await getCurrentRscSession()
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(onboardingInvitationPath(returnTo))}`)
  }
  // Setup is optional even if preference storage is temporarily unavailable.
  const preference = await prisma.userPreference.findUnique({
    where: { userId: session.user.id },
    select: { appSettings: true },
  }).catch(() => null)
  const kind = onboardingInvitationKind(preference?.appSettings)
  if (!kind) redirect(returnTo)
  return <OnboardingInvitation key={session.user.id} ownerKey={session.user.id} returnTo={returnTo} kind={kind} />
}
