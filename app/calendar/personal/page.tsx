import { getCurrentRscSession } from "@/lib/rsc-session"
import { PersonalCalendarHome } from "@/components/wellness/personal-calendar-home"

/** A private user view, independent of practice membership and scheduling roles. */
export default async function PersonalCalendarPage({ searchParams }: { searchParams?: Promise<{date?:string}> }) {
  const [session,params] = await Promise.all([getCurrentRscSession(),searchParams])
  return <PersonalCalendarHome key={session?.user?.id ?? "anonymous"} isSignedIn={Boolean(session?.user?.id)} initialDay={params?.date} />
}
