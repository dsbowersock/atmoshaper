"use client"

import { Button } from "@/components/ui/button"

export type CalendarScope = "personal" | "practice" | "together"

/** Layer choices affect this viewer's display only; they do not grant sharing,
 * change group membership or save personal content in scheduling preferences. */
export function CalendarSourceControls({ scope, changeScope, hasPractice, practices, practiceId, changePractice, practiceUnavailable, loading, error, refresh, recordCursor, appointmentCursor, more }: {
  scope: CalendarScope; changeScope: (scope: CalendarScope) => void; hasPractice: boolean
  practices: Array<{ id: string; name: string }>; practiceId?: string; changePractice: (id: string) => void
  practiceUnavailable: boolean; loading: boolean; error: string | null; refresh: () => void
  recordCursor?: string | null; appointmentCursor?: string | null; more: (kind: "records" | "appointments") => Promise<void>
}) {
  return <div className="grid shrink-0 gap-2 border-b border-border/70 p-3" data-calendar-sources>
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-2"><h1 className="text-lg font-semibold">Calendar</h1>
      <div role="group" aria-label="Calendar sources" className="flex min-w-0 flex-wrap gap-2">
        {([['personal', 'Personal'], ['practice', 'Practice'], ['together', 'Together']] as const).map(([value, label]) => <Button key={value} type="button" variant={scope === value ? "success" : "glow"} disabled={value !== "personal" && !hasPractice} aria-pressed={scope === value} onClick={() => changeScope(value)}>{label}</Button>)}
      </div>
    </div>
    <p className="text-xs text-muted-foreground">Personal items stay private to you, including in Together.</p>
    {hasPractice && practices.length === 1 ? <p className="text-sm font-medium">{practices[0].name}</p> : null}
    {practices.length > 1 ? <label className="grid max-w-sm gap-1 text-sm">Practice<select aria-label="Choose practice calendar" className="min-w-0 rounded-md border bg-background p-2" value={practiceId} onChange={(event) => changePractice(event.target.value)}>{practices.map((practice) => <option key={practice.id} value={practice.id}>{practice.name}</option>)}</select></label> : null}
    {practiceUnavailable ? <p role="alert" className="text-sm">Practice scheduling is unavailable. Your personal calendar can still be viewed independently.</p> : null}
    {!hasPractice && !practiceUnavailable ? <p className="text-xs text-muted-foreground">Practice calendars appear here when you have scheduling access.</p> : null}
    {loading ? <p role="status" className="text-sm">Loading personal calendar…</p> : null}
    {error ? <div role="alert" className="flex flex-wrap items-center gap-2 text-sm"><p>{error}</p><Button type="button" variant="glow" onClick={refresh}>Try personal calendar again</Button></div> : null}
    {recordCursor || appointmentCursor ? <div role="status" className="flex flex-wrap items-center gap-2 text-sm"><p>More personal items are available. This range is incomplete until they are loaded.</p>{recordCursor ? <Button type="button" variant="glow" disabled={loading} onClick={() => void more("records")}>Load more recordings</Button> : null}{appointmentCursor ? <Button type="button" variant="glow" disabled={loading} onClick={() => void more("appointments")}>Load more visits</Button> : null}</div> : null}
  </div>
}
