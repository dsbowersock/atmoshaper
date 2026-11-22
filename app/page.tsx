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
  // Independent owner preference and navigation reads start together. A
  // preference outage must still leave public tools usable without disclosure.
  const [preference, navigationContext] = await Promise.all([(async () => {
    if (!signedIn) return null
    try {
      return await prisma.userPreference.findUnique({
        where: { userId }, select: { appSettings: true },
      })
    } catch {
      return null
    }
  })(), getSidebarNavigationContext(session?.user)])
  const onboarding = objectRecord(objectRecord(preference?.appSettings).onboarding)
  const resumeSetup = onboardingInvitationKind(preference?.appSettings) === "resume"
  const navigation = resolveNavigation(navigationContext)
  const dashboard = resolveHomeDashboard(onboarding, navigation.primaryNavigationGroups)
  return <HomeDashboard key={userId ?? "anonymous"} signedIn={signedIn} {...dashboard}
    setupReminder={resumeSetup && userId ? <OnboardingInvitation key={userId} ownerKey={userId} returnTo="/" kind="resume" inline /> : undefined}
  />
}
