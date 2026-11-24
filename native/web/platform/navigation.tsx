import { createContext, useContext, useMemo, useSyncExternalStore } from "react"

const changed = "atmoshaper:native-route"
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

function timerNavigation() {
  return (window as Window & { AtmoShaperTimerNavigation?: { postMessage(message: "open"): void } }).AtmoShaperTimerNavigation
}

export function hasNativeTimer() { return Boolean(timerNavigation()) }
export function isTimerPath(path: string) { return path === "/chimer" || path === "/chimer/" }

export function navigateNative(value: string, replace = false) {
  let route = normalizeNativeRoute(value)
  const timer = timerNavigation()
  const destination = new URL(route, location.origin)
  if (timer && isTimerPath(destination.pathname)) {
    // Legacy visualizer and Background picker links keep the packaged tool.
    // Ordinary timer requests leave the packaged history and music running.
    if (destination.searchParams.get("source") === "music" || destination.searchParams.get("panel") === "background") {
      route = "/clock" + destination.search
    } else {
      timer.postMessage("open")
      if (route !== readRoute()) return
      route = "/"
      replace = true
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
    if (typeof path === "string") navigateNative(path)
  })
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

