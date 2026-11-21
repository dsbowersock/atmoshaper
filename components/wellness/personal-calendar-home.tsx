import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CalendarOperatorShell } from "@/app/calendar/calendar-operator-shell"
import { CalendarViewNavigation } from "./calendar-view-navigation"
import { PersonalWellnessCalendar } from "./personal-wellness-calendar"

/** Available without practice membership. The caller supplies only verified
 * sign-in state; the private calendar action independently verifies its owner. */
export function PersonalCalendarHome({ isSignedIn, initialDay }: { isSignedIn: boolean; initialDay?: string }) {
  return <CalendarOperatorShell><CalendarViewNavigation personal /><header className="grid gap-1"><h1 className="text-xl font-semibold">My calendar</h1><p className="text-sm text-muted-foreground">Your recordings, appointments and wellness reminders.</p></header>
    {isSignedIn ? <PersonalWellnessCalendar isSignedIn initialDay={initialDay} /> : <div className="grid gap-3 rounded-lg border p-4"><p>Sign in to see your private calendar. A practice account is not required.</p><Button asChild variant="glow"><Link href="/login">Sign in</Link></Button></div>}
    <div className="flex flex-wrap gap-2"><Button asChild variant="glow"><Link href="/wellness">Wellness tools</Link></Button></div>
  </CalendarOperatorShell>
}
