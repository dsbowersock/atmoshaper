import { forwardRef, type AnchorHTMLAttributes, type MouseEvent } from "react"
import { navigateNative } from "./navigation"

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string | { pathname?: string; query?: Record<string, string> }
  replace?: boolean; prefetch?: boolean; scroll?: boolean
}
/** Native route changes are synchronous; Next's server-navigation spinner is
 * not applicable to this adapter. Lazy tool loading has its own visible state. */
export function useLinkStatus() { return { pending: false } }
/** Shared website links use the native route owner rather than reloading the
 * WebView, so the audio graph and unsaved in-memory tool state stay mounted. */
export default forwardRef<HTMLAnchorElement, LinkProps>(function NativeLink({ href, replace, prefetch, scroll, onClick, ...props }, ref) {
  void [prefetch, scroll] // Next-only hints have no local asset-loader equivalent.
  const path = typeof href === "string" ? href : (href.pathname ?? "/") + (href.query ? "?" + new URLSearchParams(href.query) : "")
  function click(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event)
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || props.target === "_blank") return
    if (path.startsWith("/") && !path.startsWith("//")) {
      event.preventDefault()
      // Connected Home/planners retain the account session and saved drafts in
      // the trusted browser. Offline planners stay local and remain available.
      if (navigator.onLine && (path === "/" || path.startsWith("/tools/business-planner"))) {
        const url = new URL(path, "https://www.atmoshaper.com")
        url.searchParams.set("android_app", "1")
        location.href = url.href
      } else navigateNative(path, replace)
    }
  }
  return <a {...props} ref={ref} href={path.startsWith("/") ? "#" + path : path} onClick={click} />
})

