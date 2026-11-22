import { HomeDashboard } from "@/components/home/home-dashboard"
import { getSidebarNavigationContext } from "@/components/sidebar/sidebar"
import { getCurrentRscSession } from "@/lib/rsc-session"
import { prisma } from "@/lib/prisma"
import { resolveNavigation } from "@/lib/navigation"
import { objectRecord } from "@/lib/onboarding-preferences"
import { resolveHomeDashboard } from "@/lib/home-dashboard"
import { createPublicPageMetadata } from "@/lib/seo"
import { onboardingInvitationKind } from "@/lib/onboarding-setup"
import { OnboardingInvitation } from "@/components/account/onboarding-invitation"

export const metadata = createPublicPageMetadata("/")

/** Home reads only tool preferences and navigation permissions, never records. */
export default async function Home() {
  const session = await getCurrentRscSession()
  const userId = session?.user?.id
  const signedIn = typeof userId === "string" && userId.length > 0
  let onboarding = {}
  let resumeSetup = false
  if (signedIn) {
    try {
      const preference = await prisma.userPreference.findUnique({
        where: { userId }, select: { appSettings: true },
      })
      onboarding = objectRecord(objectRecord(preference?.appSettings).onboarding)
      resumeSetup = onboardingInvitationKind(preference?.appSettings) === "resume"
    } catch {
      // Preference outages must not prevent access to public tools. Never log
      // account data or expose provider errors through the client projection.
    }
  }
  const navigation = resolveNavigation(await getSidebarNavigationContext(session?.user))
  const dashboard = resolveHomeDashboard(onboarding, navigation.primaryNavigationGroups)
  return <HomeDashboard key={userId ?? "anonymous"} signedIn={signedIn} {...dashboard}
    setupReminder={resumeSetup && userId ? <OnboardingInvitation key={userId} ownerKey={userId} returnTo="/" kind="resume" inline /> : undefined}
  />
}
