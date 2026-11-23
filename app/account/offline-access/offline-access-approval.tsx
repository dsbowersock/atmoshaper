"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { SessionProvider, useSession, signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"

/** Browser-only approval retains existing sign-in/payment boundaries. Its return
 * is a signed backgrounds receipt, not a session token or caller-selected URL. */
export function OfflineAccessApproval() {
  // The shared shell deliberately uses a server bootstrap, not SessionProvider.
  // Only this approval surface needs live account/focus/sign-out reconciliation.
  return <SessionProvider><OfflineAccessApprovalContent /></SessionProvider>
}

function OfflineAccessApprovalContent() {
  const params = useSearchParams(), { status, data: session } = useSession()
  const device = params.get("device"), challenge = params.get("challenge")
  const account = session?.user?.email ?? session?.user?.name ?? "your current account"
  // A changed account or handoff remounts the form, discards its old result and
  // aborts the old request. Unchanged context retains the available return link.
  return <OfflineAccessApprovalForm key={JSON.stringify([status, session?.user?.id, account, device, challenge])} device={device} challenge={challenge} account={account} status={status} />
}

function OfflineAccessApprovalForm({ device, challenge, account, status }: { device:string|null; challenge:string|null; account:string; status:string }) {
  const [receipt, setReceipt] = useState(""), [message, setMessage] = useState(""), [busy, setBusy] = useState(false)
  const request = useRef<AbortController | null>(null)
  useEffect(() => () => request.current?.abort(), [])
  const valid = /^[A-Za-z0-9_-]{43}$/.test(device ?? "") && /^[A-Za-z0-9_-]{43}$/.test(challenge ?? "")
  async function approve() {
    request.current?.abort()
    const controller = new AbortController(); request.current = controller
    setBusy(true); setReceipt(""); setMessage("")
    try {
      const response = await fetch("/api/account/offline-background-access", { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ device, challenge }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? "Access verification failed.")
      if (!controller.signal.aborted) setReceipt(result.receipt)
    } catch (error) { if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : "Access verification failed.") } finally { if (!controller.signal.aborted) setBusy(false) }
  }
  return <section aria-label="Offline background approval" className="mx-auto flex w-full max-w-xl flex-col gap-5 p-5">
    <h1 className="text-2xl font-semibold">Use backgrounds offline</h1>
    <p>Save your current background access to this AtmoShaper app installation. Subscription access lasts through its verified paid period. Individually owned backgrounds have no scheduled expiry.</p>
    <p className="text-sm text-muted-foreground">This shares background access only. Your password, payment details and private records stay out of the app handoff. Refreshing replaces its previous access, including refunded purchases.</p>
    {status === "authenticated" && <p>Verify the account signed in as {account}.</p>}
    {!valid ? <p>Start verification from Backgrounds in the Android app.</p> : status === "unauthenticated"
      ? <Button onClick={() => void signIn(undefined, { callbackUrl: window.location.pathname + window.location.search })}>Sign in to verify</Button>
      : <Button disabled={busy || status !== "authenticated"} onClick={() => void approve()}>{busy ? "Verifying…" : "Approve offline background access"}</Button>}
    {receipt && <a className="rounded-xl border border-primary p-4 text-center text-primary" href={`intent://offline-access?receipt=${encodeURIComponent(receipt)}#Intent;scheme=atmoshaper;package=com.atmoshaper.app.development;end`}>Return to AtmoShaper app</a>}
    <p role="status">{message}</p>
  </section>
}
