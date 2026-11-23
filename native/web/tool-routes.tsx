import { lazy, Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AppPageShell } from "@/components/ui/app-surface"
import { OfflineAudio } from "./offline-audio"
import { NativeAccessPage } from "./native-access"
import { useNativeRoute } from "./platform/navigation"

const Music = lazy(() => import("@/app/browse/workspace").then(module => ({ default: () => <module.AtmosphereWorkspace layout="rails" /> })))
const Breathing = lazy(() => import("@/app/wellness/breathing/page"))
const PlannerHub = lazy(() => import("@/app/tools/business-planner/page"))
const Income = lazy(() => import("@/app/tools/business-planner/income/income-planner-client").then(module => ({ default: () => <module.IncomePlannerClient isSignedIn={false} displayName={null} initialAccountPlanner={null} /> })))
const BreakEven = lazy(() => import("@/app/tools/business-planner/break-even/break-even-planner-client").then(module => ({ default: module.BreakEvenPlannerClient })))
const Checklist = lazy(() => import("@/app/tools/business-planner/launch-checklist/launch-checklist-client").then(module => ({ default: module.LaunchChecklistClient })))
const Services = lazy(() => import("@/app/tools/business-planner/service-menu/service-menu-client").then(module => ({ default: module.ServiceMenuClient })))
const Outline = lazy(() => import("@/app/tools/business-planner/plan-outline/plan-outline-client").then(module => ({ default: module.PlanOutlineClient })))
const AddOn = lazy(() => import("@/app/tools/business-planner/add-on-profit/add-on-profit-client").then(module => ({ default: module.AddOnProfitClient })))

const pages = { "/music": Music, "/wellness/breathing": Breathing, "/tools/business-planner": PlannerHub,
  "/tools/business-planner/income": Income, "/tools/business-planner/break-even": BreakEven,
  "/tools/business-planner/launch-checklist": Checklist, "/tools/business-planner/service-menu": Services,
  "/tools/business-planner/plan-outline": Outline, "/tools/business-planner/add-on-profit": AddOn }

/** Connected pages use the actual authenticated website in the app's trusted
 * browser-owned window. No credential is transferred into the local WebView. */
function ConnectedPage({ route }: { route: string }) {
  const [offline, setOffline] = useState(!navigator.onLine)
  const href = useMemo(() => { const value = new URL(route, "https://www.atmoshaper.com"); value.searchParams.set("android_app", "1"); return value.href }, [route])
  useEffect(() => {
    function open() { setOffline(!navigator.onLine); if (navigator.onLine) location.href = href }
    open(); window.addEventListener("online", open)
    return () => window.removeEventListener("online", open)
  }, [href]) // the normalized route owns this destination, not an incoming URL
  return <AppPageShell width="narrow"><h1 className="text-2xl font-semibold">{offline ? "A connection is needed" : "Opening AtmoShaper"}</h1>
    <p className="text-muted-foreground">Your account, calendars and connected practice tools need an internet connection. Clock, timer, breathing, saved music and business planners remain available on this device.</p>
    <Button asChild variant="ctaBlue"><a href={href}>Try connected AtmoShaper</a></Button>
    <Button asChild variant="glow"><Link href="/">Home</Link></Button>
  </AppPageShell>
}

export function ToolRoutes() {
  const route = useNativeRoute(), path = route.split("?")[0]
  const [downloadsVisited, setDownloadsVisited] = useState(path === "/downloads")
  useEffect(() => { if (path === "/downloads") setDownloadsVisited(true) }, [path])
  const Page = pages[path as keyof typeof pages]
  return <>
    {/* Downloads retain ownership until commit/cancel, even after navigation. */}
    {downloadsVisited && <div hidden={path !== "/downloads"} className="p-4 sm:p-6"><OfflineAudio downloadOnly /></div>}
    <Suspense fallback={<p role="status" className="p-6">Opening your tool…</p>}>
      {path === "/downloads" || path === "/" || path === "/clock" || path === "/chimer" ? null
        : path === "/account/offline-access" ? <NativeAccessPage />
        : Page ? <>{path.startsWith("/tools/business-planner") && <p className="px-4 pt-3 text-xs text-muted-foreground" role="note">Offline draft · Saved on this device. Account-saved plans are available when you reconnect.</p>}<Page /></> : <ConnectedPage route={route} />}
    </Suspense>
  </>
}
