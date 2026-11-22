"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { claimSetupInvitationAction, chooseSetupInvitationAction } from "@/app/onboarding/welcome/actions"
import { guidedOnboardingPath, onboardingReturnTo } from "@/lib/onboarding-setup"
import { AppPageShell, AppSurface } from "@/components/ui/app-surface"
import { Button } from "@/components/ui/button"

/** Claim once through an action, never prefetch/GET. Strict Mode shares the
 * in-flight claim; unmounted replies cannot interrupt a later page. */
export function OnboardingInvitation({ ownerKey, returnTo, kind = "new", inline = false }: {
  ownerKey: string, returnTo: string, kind?: "new" | "resume", inline?: boolean,
}) {
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "ready" | "saving" | "error">("loading")
  const [currentKind, setCurrentKind] = useState(kind)
  const claim = useRef<ReturnType<typeof claimSetupInvitationAction> | null>(null)
  const mounted = useRef(false)
  const saving = useRef(false)
  const resume = currentKind === "resume"
  useEffect(() => {
    let active = true
    mounted.current = true
    claim.current ??= claimSetupInvitationAction(ownerKey)
    void claim.current.then((result) => {
      if (!active) return
      if (!result.ok) { setStatus("error"); return }
      if (!result.show) { router.replace(onboardingReturnTo(returnTo)); return }
      if (result.kind) setCurrentKind(result.kind)
      setStatus("ready")
    }).catch(() => { if (active) setStatus("error") })
    return () => { active = false; mounted.current = false }
  }, [ownerKey, returnTo, router])

  async function choose(choice: "started" | "skipped") {
    if (saving.current) return
    saving.current = true
    setStatus("saving")
    try {
      const result = await chooseSetupInvitationAction(ownerKey, choice, currentKind)
      if (!mounted.current) return
      if (!result.ok) { setStatus("error"); return }
      router.replace(result.choice === "started" ? guidedOnboardingPath(returnTo) : onboardingReturnTo(returnTo))
    } catch { if (mounted.current) setStatus("error") }
    finally { saving.current = false }
  }

  const title = resume ? "Continue setting up your account?" : "Want help setting up your account?"
  const content = <AppSurface
    title={inline ? <h2>{title}</h2> : <h1>{title}</h1>}
    description={resume ? "Your progress is saved. Pick up where you left off whenever you’re ready." : "Guided setup helps you choose preferences and put your tools in reach. It’s completely optional."}
  >
    <p className="text-sm leading-relaxed text-muted-foreground">You can also enter your details and change preferences yourself in Account settings.</p>
    {status === "loading" ? <p role="status" className="text-sm text-muted-foreground">Preparing your setup choice…</p> : null}
    {status === "error" ? <p role="alert" className="text-sm text-destructive">We couldn’t save your choice. Try again before continuing.</p> : null}
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button className="min-h-11 flex-1" disabled={status === "loading" || status === "saving"} onClick={() => choose("started")}>{resume ? "Continue setup" : "Start guided setup"}</Button>
      <Button variant="ctaBlue" className="min-h-11 flex-1" disabled={status === "loading" || status === "saving"} onClick={() => choose("skipped")}>Not now</Button>
    </div>
    <p className="text-xs leading-relaxed text-muted-foreground">{resume ? "We won’t remind you again. Your saved progress stays available in Account → App settings." : "Choose Not now to stop automatic setup prompts. You can open guided setup anytime from Account → App settings."}</p>
  </AppSurface>
  return inline ? content : <AppPageShell width="narrow" className="min-h-0">{content}</AppPageShell>
}
