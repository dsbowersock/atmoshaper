import type { ReactNode } from "react"
import Link from "next/link"
import { LockKeyhole } from "lucide-react"
import { getCurrentRscSession as getCurrentSession } from "@/lib/rsc-session"
import { AppNotice, AppPageShell, AppSurface, appCalloutClassName } from "@/components/ui/app-surface"
import { Button } from "@/components/ui/button"
import { PUBLIC_PRODUCT_IDENTITY } from "@/lib/public-product-identity"

/** Explain the capability gate without implying that the current Supporter tier grants clinical access. */
export async function TherapistNotesGate({ children }: { children: ReactNode }) {
  const session = await getCurrentSession()

  if (session?.user?.capabilities?.canUseLocalClinicalTools) {
    return <>{children}</>
  }

  const signedIn = Boolean(session?.user?.id)

  return (
    <AppPageShell title="Local-First Documentation">
      <AppSurface
        title="Documentation access required"
        description={
          signedIn
            ? "Your account needs documentation access to use SOAP notes, intake forms, client journals, and ROM tools. A Supporter membership does not include this access."
            : "Sign in to check your access to these local documentation tools. A Supporter membership does not include documentation access."
        }
        icon={<LockKeyhole className="h-5 w-5" aria-hidden="true" />}
        className={appCalloutClassName}
      >
        <AppNotice
          title="Tools remain visible on the documentation dashboard"
          description={`${PUBLIC_PRODUCT_IDENTITY.name} keeps these tools visible so you can explore what is available. Contact support if you expected documentation access on your account.`}
        />
        <div className="flex flex-wrap gap-2">
          <Button asChild className="bg-primary hover:bg-brand-orange-glow">
            <Link href={signedIn ? "/account?tab=membership" : "/login"}>
              {signedIn ? "View account access" : "Sign in"}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/notes">View available tools</Link>
          </Button>
        </div>
      </AppSurface>
    </AppPageShell>
  )
}
