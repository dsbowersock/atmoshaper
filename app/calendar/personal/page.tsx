import { getCurrentRscSession } from "@/lib/rsc-session"
import { PersonalCalendarHome } from "@/components/wellness/personal-calendar-home"
import CalendarPage from "../page"

/** A private user view, independent of practice membership and scheduling roles. */
export default async function PersonalCalendarPage({ searchParams }: { searchParams?: Promise<{date?:string; practice?:string; view?:string}> }) {
  const [session,params] = await Promise.all([getCurrentRscSession(),searchParams])
  if (!session?.user?.id) return <PersonalCalendarHome key="anonymous" isSignedIn={false} />
  return <CalendarPage key={session.user.id} searchParams={Promise.resolve({ ...params, view: params?.view === "together" ? "together" : "personal" })} />
}
