import Link from "next/link"
import { Button } from "@/components/ui/button"

/** Personal reads and practice scheduling keep distinct URLs and audiences. */
export function CalendarViewNavigation({ personal = false }: { personal?: boolean }) {
  return <nav aria-label="Calendar views" className="flex min-w-0 flex-wrap gap-2">
    <Button asChild variant={personal ? "success" : "glow"}><Link href="/calendar/personal" aria-current={personal ? "page" : undefined}>My calendar</Link></Button>
    <Button asChild variant={personal ? "glow" : "success"}><Link href="/calendar?setup=practice" aria-current={!personal ? "page" : undefined}>Practice scheduling</Link></Button>
  </nav>
}
