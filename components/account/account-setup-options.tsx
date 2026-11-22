import Link from "next/link"
import { SettingsSurface } from "@/components/account/settings-surfaces"
import { Button } from "@/components/ui/button"

/** Persistent, explicit setup entry points; never a completion reminder. */
export function AccountSetupOptions() {
  return <SettingsSurface title="Account setup" description="Open guided setup to start fresh or continue saved progress. You can also edit your account directly.">
    <div className="flex flex-wrap gap-3">
      <Button asChild variant="ctaBlue"><Link href="/onboarding">Open guided setup</Link></Button>
      <Button asChild variant="glow"><Link href="/account?tab=profile">Edit profile</Link></Button>
      <Button asChild variant="glow"><Link href="/account?tab=credentials">Credentials</Link></Button>
    </div>
    <p className="text-sm text-muted-foreground">Theme, layout and other preferences can be changed below without using guided setup.</p>
  </SettingsSurface>
}
