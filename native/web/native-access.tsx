import { createContext, useContext, type ReactNode } from "react"
import { useOfflineBackgroundAccess } from "./offline-backgrounds"
import { AppPageShell, AppSurface } from "@/components/ui/app-surface"
import { Button } from "@/components/ui/button"

const AccessContext = createContext<ReturnType<typeof useOfflineBackgroundAccess> | null>(null)
/** One serialized receipt owner for the whole packaged app, independent of
 * route changes. Its capability is deliberately separate from website auth. */
export function NativeAccessProvider({ children }: { children: ReactNode }) {
  const account = useOfflineBackgroundAccess()
  return <AccessContext.Provider value={account}>{children}</AccessContext.Provider>
}
export function useNativeAccess() {
  const value = useContext(AccessContext)
  if (!value) throw new Error("Native background access provider is missing.")
  return value
}
export function NativeAccessPage() {
  const account = useNativeAccess()
  return <AppPageShell width="standard"><header><h1 className="text-2xl font-semibold">Offline background access</h1><p className="mt-2 text-muted-foreground">All backgrounds are included on this device. Verify your account once to use your premium or purchased backgrounds offline.</p></header>
    <AppSurface className="space-y-4 p-5">
      <p>{account.claims?.premiumUntil ? `Premium access verified through ${new Date(account.claims.premiumUntil).toLocaleDateString()}. Reconnect after renewal to refresh it.` : "Free backgrounds are available immediately. Individually purchased backgrounds have no scheduled expiry."}</p>
      <div className="flex flex-wrap gap-3"><Button variant="glow" disabled={!account.ready} onClick={() => void account.refresh()}>Verify or refresh account access</Button>
        {account.canForget && <Button variant="glow" onClick={() => void account.forget()}>Forget account access</Button>}</div>
      <p role="status">{account.message}</p>
      <p className="text-sm text-muted-foreground">Verification shares background access only. Account sign-in, payments and private records stay in their existing account screens.</p>
    </AppSurface>
  </AppPageShell>
}
