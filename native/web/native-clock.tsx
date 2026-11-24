import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import ChimerPage, { type TimerState } from "@/app/chimer/chimer-screen"
import type { ChimerSettings } from "@/app/chimer/set-timer"
import { createNativeClockStorage } from "@/lib/native-clock-storage"
import { nativeClockCommitKey } from "@/lib/native-clock-state"
import { Button } from "@/components/ui/button"
import { useNativeAccess } from "./native-access"
import { NativeRouteContext, navigateNative } from "./platform/navigation"

/** Reuses the packaged Clock and music visualizer. Browser previews retain
 * their shared timer, while the Android host delegates countdowns to Compose
 * and saves only visualizer settings. The device stores never read a vault. */
export function NativeClock({ route, active, appearanceOnly }: { route: string; active: boolean; appearanceOnly: boolean }) {
  const account = useNativeAccess()
  const [store] = useState(() => createNativeClockStorage({ appearanceOnly }))
  const [initial, setInitial] = useState<Awaited<ReturnType<typeof store.load>> | null>(null)
  const [error, setError] = useState("")
  const lastAttempt = useRef("")
  const latest = useRef<{version:number;settings:ChimerSettings;timer:TimerState}|null>(null)
  const saveRevision = useRef(0)
  const [lastRoute, setLastRoute] = useState("/clock")
  if (active && lastRoute !== route) setLastRoute(route)
  const load = useCallback(() => { void store.load().then(setInitial) }, [store])
  useEffect(load, [load])
  const save = useCallback(() => {
    const snapshot = latest.current, revision = ++saveRevision.current
    if (snapshot) void store.save(snapshot).then(ok => { if (revision === saveRevision.current) setError(ok ? "" : "Changes are not saved on this device. Check storage and retry.") })
  }, [store])
  const changed = useCallback((settings: ChimerSettings, timer: TimerState) => {
    latest.current = { version: 1, settings, timer }
    const key = nativeClockCommitKey(settings, timer)
    if (key === lastAttempt.current) return
    lastAttempt.current = key; save()
  }, [save])
  const accessKey = JSON.stringify(account.access)
  const runtime = useMemo(() => {
    if (!initial?.ready || !initial.state) return undefined
    return { backgroundAccess: JSON.parse(accessKey), initialSettings: initial.state.settings,
      initialTimer: appearanceOnly ? undefined : initial.state.timer as TimerState, onChange: changed,
      onOpenTimer: appearanceOnly ? () => navigateNative("/chimer") : undefined }
  }, [initial, accessKey, appearanceOnly, changed])
  if (!initial || !account.loaded) return active ? <p className="p-6" role="status">Opening your saved Clock…</p> : null
  if (!initial.ready) return active ? <div className="space-y-4 p-6"><p role="alert">Saved Clock settings could not be opened. Your existing settings have not been replaced.</p><Button onClick={load}>Retry saved Clock</Button></div> : null
  return <NativeRouteContext.Provider value={lastRoute}>
    <div hidden={!active} className="h-full min-h-0" data-native-shared-clock>
      {error && active && <div role="alert" className="p-2 text-sm"><p>{error}</p><Button variant="glow" onClick={save}>Retry Clock save</Button></div>}
      <ChimerPage deviceRuntime={runtime} active={active} />
    </div>
  </NativeRouteContext.Provider>
}
