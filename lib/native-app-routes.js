// @ts-check

/** Packaged routes are public tool destinations, never account authority or an
 * arbitrary URL. Website/account sessions remain owned by the trusted browser. */
export const NATIVE_LOCAL_ROUTES = Object.freeze([
  "/", "/clock", "/chimer", "/music", "/downloads", "/wellness/breathing", "/account/offline-access",
  "/tools/business-planner", "/tools/business-planner/income", "/tools/business-planner/break-even",
  "/tools/business-planner/launch-checklist", "/tools/business-planner/service-menu",
  "/tools/business-planner/plan-outline", "/tools/business-planner/add-on-profit",
])

/** @param {unknown} value @returns {string|null} */
export function nativeLocalRoute(value) {
  if (typeof value !== "string" || value.length > 1024 || !value.startsWith("/") || value.startsWith("//") || /[\\#\u0000-\u001f]/.test(value)) return null
  const url = new URL(value, "https://www.atmoshaper.com")
  if (url.origin !== "https://www.atmoshaper.com" || !NATIVE_LOCAL_ROUTES.includes(url.pathname)) return null
  // A return may only restore the shared clock's public visualizer/picker state.
  const query = new URLSearchParams()
  if (["/clock", "/chimer"].includes(url.pathname)) {
    if (url.searchParams.get("panel") === "background") query.set("panel", "background")
    if (url.searchParams.get("source") === "music") query.set("source", "music")
    if (url.searchParams.get("returnTo") === "/music") query.set("returnTo", "/music")
  }
  return url.pathname + (query.size ? "?" + query : "")
}

/** @param {string} route */
export function nativeToolIntent(route) {
  const path = nativeLocalRoute(route)
  if (!path) throw new Error("This is not a packaged tool route.")
  return "intent://tool?path=" + encodeURIComponent(path)
    + "#Intent;scheme=atmoshaper;package=com.atmoshaper.app.development;end"
}
