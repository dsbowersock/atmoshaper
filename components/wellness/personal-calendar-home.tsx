import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CalendarOperatorShell } from "@/app/calendar/calendar-operator-shell"
import { CalendarViewNavigation } from "./calendar-view-navigation"
import { CalendarWorkspace } from "@/app/calendar/calendar-workspace"
import { normalizeCalendarPreferences } from "@/lib/calendar-preferences"

/** Available without practice membership. The caller supplies only verified
 * sign-in state; the private calendar action independently verifies its owner. */
export function PersonalCalendarHome({ isSignedIn, ownerId, initialDay, practiceUnavailable = false }: { isSignedIn: boolean; ownerId?: string; initialDay?: string; practiceUnavailable?: boolean }) {
  if (isSignedIn && ownerId) return <CalendarOperatorShell width="full" flush>
    <CalendarWorkspace key={ownerId} events={[]} providers={[]} providerAvailability={[]} preferences={normalizeCalendarPreferences({})} currentUserId={ownerId} initialDate={initialDay} initialScope="personal" hasPractice={false} practiceUnavailable={practiceUnavailable} />
  </CalendarOperatorShell>
  return <CalendarOperatorShell><CalendarViewNavigation personal /><header className="grid gap-1"><h1 className="text-xl font-semibold">My calendar</h1><p className="text-sm text-muted-foreground">Your recordings, appointments and wellness reminders.</p></header>
    <div className="grid gap-3 rounded-lg border p-4"><p>Sign in to see your private calendar. A practice account is not required.</p><Button asChild variant="glow"><Link href="/login">Sign in</Link></Button></div>
    <div className="flex flex-wrap gap-2"><Button asChild variant="glow"><Link href="/wellness">Wellness tools</Link></Button></div>
  </CalendarOperatorShell>
}
