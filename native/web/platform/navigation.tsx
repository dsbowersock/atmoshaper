import { createContext, useContext, useMemo, useSyncExternalStore } from "react"

const changed = "atmoshaper:native-route"
const clockBackgroundRoute = "/clock?panel=background"
let clockBackgroundRequest = 0
const listeners = new Set<() => void>()
function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

/** Hash routes leave the packaged entry/asset origin unchanged. Only an
 * internal route is accepted; account permissions never come from this URL. */
export function normalizeNativeRoute(value: string) {
  if (!value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f]/.test(value)) return "/"
  const url = new URL(value, "https://www.atmoshaper.com")
  return url.origin === "https://www.atmoshaper.com" ? url.pathname + url.search : "/"
}
function readRoute() { return normalizeNativeRoute(location.hash.slice(1) || "/") }

/** Only the installed shell delegates ownership, independent of transfer availability. */
export function hasNativeTimer() { return navigator.userAgent.endsWith(" AtmoShaperNativeTimer/1") }
export function isTimerPath(path: string) { return path === "/chimer" || path === "/chimer/" }

export function navigateNative(value: string, replace = false) {
  let route = normalizeNativeRoute(value)
  const destination = new URL(route, location.origin)
  if (hasNativeTimer() && isTimerPath(destination.pathname)) {
    // Legacy visualizer and Background picker links keep the packaged tool.
    // Ordinary timer requests leave the packaged history and music running.
    if (destination.searchParams.get("source") === "music" || destination.searchParams.get("panel") === "background") {
      route = "/clock" + destination.search
    } else {
      if (route === readRoute()) {
        history.replaceState({}, "", "#/")
        window.dispatchEvent(new Event(changed))
      }
      location.assign("https://appassets.androidplatform.net/assets/core/open-native-timer")
      return
    }
  }
  if (route === readRoute()) return
  history[replace ? "replaceState" : "pushState"]({}, "", "#" + route)
  window.dispatchEvent(new Event(changed))
}
const listen = () => { for (const listener of listeners) listener() }
if (typeof window !== "undefined") {
  window.addEventListener("hashchange", listen)
  window.addEventListener("popstate", listen)
  window.addEventListener(changed, listen)
  window.addEventListener("atmoshaper:native-navigation", event => {
    const path = (event as CustomEvent<unknown>).detail
    if (typeof path !== "string") return
    if (path === clockBackgroundRoute && hasNativeTimer()) {
      // Every explicit Android picker launch is a new request, even when it
      // returns to the same document and neither the route nor history changes.
      clockBackgroundRequest += 1
      if (path === readRoute()) {
        listen()
        return
      }
    }
    navigateNative(path)
  })
}
function readClockBackgroundRequest() { return readRoute() === clockBackgroundRoute ? clockBackgroundRequest : 0 }
export function useNativeClockBackgroundRequest() {
  return useSyncExternalStore(subscribe, readClockBackgroundRequest, () => 0)
}
export const NativeRouteContext = createContext<string | null>(null)
export function useNativeRoute() {
  const override = useContext(NativeRouteContext)
  const route = useSyncExternalStore(subscribe, readRoute, () => "/")
  return override ?? route
}
export function usePathname() { return useNativeRoute().split("?")[0] }
export function useSearchParams() { const route = useNativeRoute(); return useMemo(() => new URLSearchParams(route.includes("?") ? route.slice(route.indexOf("?") + 1) : ""), [route]) }
const router = { push: (href: string) => navigateNative(href), replace: (href: string) => navigateNative(href, true),
  back: () => history.back(), forward: () => history.forward(), refresh: () => window.dispatchEvent(new Event(changed)), prefetch: async () => {} }
export function useRouter() { return router }
/** Next control-flow errors must still propagate from shared client code. */
export function unstable_rethrow(error: unknown) { if (error instanceof Error && "digest" in error) throw error }
export function redirect(href: string) { navigateNative(href, true) }

