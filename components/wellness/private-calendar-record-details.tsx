"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { WellnessEntryCard } from "./wellness-entry-card"
import type { WellnessTimelineEntry } from "./wellness-hub-client"

/** Full private details remain outside the scheduling library's event objects. */
export function PrivateCalendarRecordDetails({ entry, close }: { entry: WellnessTimelineEntry | null; close: () => void }) {
  return <Dialog open={Boolean(entry)} onOpenChange={(open) => { if (!open) close() }}><DialogContent className="max-h-[85dvh] overflow-y-auto"><DialogHeader><DialogTitle>My recording · Private to me</DialogTitle><DialogDescription>This recording is visible only to you and is separate from the practice schedule.</DialogDescription></DialogHeader>{entry ? <WellnessEntryCard entry={entry} readOnly /> : null}</DialogContent></Dialog>
}
