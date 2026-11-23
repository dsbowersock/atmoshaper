"use client"

import { useEffect, useSyncExternalStore } from "react"
import { Download, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { nativeLocalRoute, nativeToolIntent } from "@/lib/native-app-routes"

const eventName = "atmoshaper:native-context", key = "atmoshaper.native-app.v1"
function read() {
  if (document.documentElement.dataset.nativeApp === "local") return "local"
  try { return sessionStorage.getItem(key) === "1" ? "connected" : "" } catch { return "" }
}
function subscribe(listener: () => void) { window.addEventListener(eventName, listener); return () => window.removeEventListener(eventName, listener) }
export function useNativeAppMode() { return useSyncExternalStore(subscribe, read, () => "") }

/** This public marker changes navigation only. It conveys no account identity,
 * access right or secret. The browser retains its own ordinary website session. */
export function NativeAppNavigation() {
  useEffect(() => {
    if (new URL(location.href).searchParams.get("android_app") === "1") {
      try { sessionStorage.setItem(key, "1") } catch { /* This tab can still use the connected site. */ }
      window.dispatchEvent(new Event(eventName))
    }
    function route(event: MouseEvent) {
      if (read() !== "connected" || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return
      const url = new URL(anchor.href, location.href)
      if (url.origin !== location.origin) return
      const local = nativeLocalRoute(url.pathname + url.search)
      // Connected Home stays in the browser so account/personalized navigation
      // is truthful. Every device-capable tool uses its shared packaged screen.
      if (!local || local === "/" || local === "/account/offline-access" || local.startsWith("/tools/business-planner")) return
      event.preventDefault()
      // A native capture consumes the click before React/Next can also route it.
      event.stopPropagation()
      location.href = nativeToolIntent(local)
    }
    document.addEventListener("click", route, true)
    return () => document.removeEventListener("click", route, true)
  }, [])
  return null
}

/** Native-specific controls augment the shared Music screen; normal website
 * geometry is unchanged when it is opened outside the Android app. */
export function NativeMusicTools() {
  const mode = useNativeAppMode()
  if (!mode) return null
  const href = (path: string) => mode === "local" ? "#" + path : nativeToolIntent(path)
  return <nav aria-label="Device music tools" className="flex shrink-0 flex-wrap items-center justify-end gap-2 px-3 py-2">
    <Button asChild variant="glow" className="min-h-11"><a href={href("/downloads")}><Download aria-hidden="true" />Downloads</a></Button>
    <Button asChild variant="ghost" className="min-h-11"><a href={href("/account/offline-access")}><ShieldCheck aria-hidden="true" />Offline access</a></Button>
  </nav>
}
