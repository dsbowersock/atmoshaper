"use client"

import { useEffect, useRef, useState, type FormEvent, type MouseEvent, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { saveOnboardingAction, saveOnboardingDraftAction } from "@/app/onboarding/actions"
import { Button } from "@/components/ui/button"

type SaveState = "unchanged" | "saving" | "saved" | "error" | "conflict"

/** Serial autosaves retain only the newest snapshot while a request is in
 * flight. Explicit Leave/Finish waits for acknowledgement; navigation away
 * never cancels an already captured save. No draft enters browser storage. */
export function OnboardingDraftForm({ ownerKey, initialRevision, hasDraft, children }: {
  ownerKey: string, initialRevision: number, hasDraft: boolean, children: ReactNode,
}) {
  const router = useRouter()
  const form = useRef<HTMLFormElement>(null)
  const revision = useRef(initialRevision)
  const queued = useRef<FormData | null>(null)
  const active = useRef<Promise<boolean> | null>(null)
  const mounted = useRef(false)
  const finishing = useRef(false)
  const conflicted = useRef(false)
  const initialized = useRef(hasDraft)
  const [state, setState] = useState<SaveState>(hasDraft ? "saved" : "unchanged")
  const [submitting, setSubmitting] = useState(false)

  function show(next: SaveState) { if (mounted.current) setState(next) }

  async function flush(): Promise<boolean> {
    if (active.current) return active.current
    if (conflicted.current) return false
    const work = async () => {
      while (queued.current) {
        const snapshot = queued.current
        queued.current = null
        show("saving")
        try {
          const result = await saveOnboardingDraftAction(ownerKey, revision.current, snapshot)
          if (!result.ok) {
            queued.current ??= snapshot
            conflicted.current = "conflict" in result && result.conflict === true
            show(conflicted.current ? "conflict" : "error")
            return false
          }
          revision.current = result.revision
        } catch {
          queued.current ??= snapshot
          show("error")
          return false
        }
      }
      show("saved")
      return true
    }
    active.current = work()
    try { return await active.current } finally { active.current = null }
  }

  function capture() {
    if (!form.current || finishing.current) return
    queued.current = new FormData(form.current)
    void flush()
  }
  const captureLatest = useRef(capture)
  useEffect(() => { captureLatest.current = capture })
  useEffect(() => {
    mounted.current = true
    const element = form.current
    // The shortcut editor changes hidden ordered inputs without a native
    // change event. Observe those inputs only, after React commits them.
    const observer = new MutationObserver((changes) => {
      const shortcut = (node: Node) => node instanceof HTMLInputElement && node.type === "hidden" && node.name === "homeShortcuts"
      if (changes.some((change) => shortcut(change.target) || [...change.addedNodes, ...change.removedNodes].some(shortcut))) {
        captureLatest.current()
      }
    })
    if (element) observer.observe(element, { childList: true, subtree: true, attributes: true, attributeFilter: ["value"] })
    // Opening guided setup is explicit participation, even before the first
    // edit. Save its initial answers once so leaving can offer continuation.
    if (!initialized.current) { initialized.current = true; captureLatest.current() }
    return () => { mounted.current = false; observer.disconnect() }
  }, [])

  async function finish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (finishing.current) return
    const snapshot = new FormData(event.currentTarget)
    finishing.current = true
    setSubmitting(true)
    try {
      if (queued.current || active.current) { if (!await flush()) return }
      // Finish may have waited behind autosave while the user chose a different
      // page. Do not start the redirecting completion action after unmount.
      if (!mounted.current) return
      if (conflicted.current) return
      const result = await saveOnboardingAction(ownerKey, revision.current, snapshot)
      if (result && !result.ok) {
        queued.current ??= snapshot
        conflicted.current = "conflict" in result && result.conflict === true
        show(conflicted.current ? "conflict" : "error")
      }
    } catch { queued.current ??= snapshot; show("error") }
    finally { finishing.current = false; if (mounted.current) setSubmitting(false) }
  }

  async function leave(event: MouseEvent<HTMLFormElement>) {
    const target = event.target instanceof Element ? event.target.closest("a[data-leave-setup]") : null
    if (!(target instanceof HTMLAnchorElement) || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    if (finishing.current) return
    if ((queued.current || active.current) && !await flush()) return
    // A pending save may outlive the page; keep saving, but never replace the
    // destination the user chose after leaving this form.
    if (!mounted.current) return
    router.push(target.getAttribute("href") || "/account?tab=app-settings")
  }

  // Capture before a child Next Link handles the click; bubbling is too late
  // to hold client navigation while the draft is pending or failed.
  return <form ref={form} onChange={capture} onSubmit={finish} onClickCapture={leave} className="space-y-6">
    <p role={state === "error" || state === "conflict" ? "alert" : "status"} className="text-sm text-muted-foreground">
      {state === "saving" ? "Saving your progress…" : state === "saved" ? "Progress saved to your account. You can return later." : state === "error" ? "Couldn’t save progress. Retry before leaving setup." : state === "conflict" ? "Setup changed in another tab. Reload to use the latest saved progress." : "Your progress saves as you make changes."}
    </p>
    {state === "error" ? <Button type="button" variant="ctaBlue" onClick={() => void flush()}>Retry saving progress</Button> : null}
    {state === "conflict" ? <Button type="button" variant="ctaBlue" onClick={() => window.location.reload()}>Reload saved progress</Button> : null}
    <fieldset disabled={submitting} className="min-w-0 space-y-6">{children}</fieldset>
  </form>
}
