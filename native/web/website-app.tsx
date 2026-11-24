import { useEffect } from "react"
import { HomeDashboard } from "@/components/home/home-dashboard"
import { AppSidebarClient, type SidebarNavigation } from "@/components/sidebar/app-sidebar-client"
import { SidebarCalendarProvider } from "@/components/sidebar/sidebar-calendar-provider"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { SettingsProvider } from "@/components/providers/settings-provider"
import { PwaInstallProvider } from "@/components/providers/pwa-install-provider"
import { AccountShellBootstrapProvider } from "@/components/providers/account-shell-bootstrap-provider"
import { TherapistSettingsProvider } from "@/components/providers/therapist-settings-provider"
import { MusicProvider } from "@/components/providers/music-provider"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { resolveNavigation } from "@/lib/navigation"
import { resolveHomeDashboard } from "@/lib/home-dashboard"
import { projectAccountShellAppSettings } from "@/lib/account-shell-bootstrap"
import { hasNativeTimer, isTimerPath, navigateNative, useNativeRoute } from "./platform/navigation"
import { NativeClock } from "./native-clock"
import { NativeAccessProvider } from "./native-access"
import { ToolRoutes } from "./tool-routes"

const resolvedNavigation = resolveNavigation()
const navigation = resolvedNavigation as SidebarNavigation
const dashboard = resolveHomeDashboard({}, resolvedNavigation.primaryNavigationGroups)
const bootstrap = { ownerKey: null, syncEnabled: false, preferenceStatus: "anonymous" as const,
  appSettings: projectAccountShellAppSettings(undefined), hasPracticeMembership: false }

/** Uses the website's actual persistent shell. Native transport and routes are
 * adapters; this component does not define another dashboard or navigation UI. */
export function WebsiteApp() {
  const route = useNativeRoute()
  const path = route.split("?")[0]
  const nativeTimer = hasNativeTimer()
  const timerRoute = isTimerPath(path)
  const clockRoute = path === "/clock" || !nativeTimer && timerRoute
  useEffect(() => {
    if (nativeTimer && timerRoute) navigateNative(route, true)
  }, [nativeTimer, route, timerRoute])
  return <NativeAccessProvider><PwaInstallProvider installed><AccountShellBootstrapProvider initialBootstrap={bootstrap}>
    <SettingsProvider><TherapistSettingsProvider><MusicProvider>
      <SidebarProvider className="h-[100dvh] min-h-0 overflow-hidden bg-background">
        <SidebarCalendarProvider ownerKey={null} enabled={false}>
          <AppSidebarClient user={null} navigation={navigation} />
          <SidebarInset className="min-h-0 overflow-hidden bg-transparent">
            <div className="relative h-full min-w-0 overflow-hidden">
              <LayoutWrapper user={null} navigation={navigation} backgroundPurchasesAvailable={false}>
                {path === "/" && <HomeDashboard signedIn={false} {...dashboard} />}
                <NativeClock route={route} active={clockRoute} appearanceOnly={nativeTimer} />
                <ToolRoutes />
              </LayoutWrapper>
            </div>
          </SidebarInset>
        </SidebarCalendarProvider>
      </SidebarProvider>
    </MusicProvider></TherapistSettingsProvider></SettingsProvider>
  </AccountShellBootstrapProvider></PwaInstallProvider></NativeAccessProvider>
}
