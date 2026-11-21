"use client"

import { useEffect, useRef, useState } from "react"
import { loadPersonalWellnessCalendarAction, type PersonalCalendarData } from "@/app/wellness/calendar-actions"

const unique = <T extends { id: string }>(rows: T[]) => [...new Map(rows.map((row) => [row.id, row])).values()]

/** Private display state is bound to actor + visible range, with no shared cache
 * or persistence. Disabled/mismatched/stale results never reach the renderer. */
export function usePrivateCalendarLayer({ enabled, ownerKey, start, end }: { enabled: boolean; ownerKey: string; start: string; end: string }) {
  const key = JSON.stringify([ownerKey, start, end])
  const [snapshot, setSnapshot] = useState<{ key: string; data: PersonalCalendarData } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [reload, setReload] = useState(0)
  const generation = useRef(0), busy = useRef(false)

  useEffect(() => {
    const request = ++generation.current
    setSnapshot(null); setError(null); busy.current = false
    if (!enabled || !ownerKey || !start || !end) { setLoading(false); return }
    setLoading(true)
    void loadPersonalWellnessCalendarAction({ start, end }).then((result) => {
      if (request !== generation.current) return
      if (!result.ok || !result.data || result.ownerKey !== ownerKey) { setError("Could not load your personal calendar. Refresh or try again."); return }
      setSnapshot({ key, data: result.data })
    }).catch(() => { if (request === generation.current) setError("Could not load your personal calendar. Refresh or try again.") })
      .finally(() => { if (request === generation.current) setLoading(false) })
    return () => { generation.current += 1 }
  }, [enabled, ownerKey, start, end, key, reload])

  const current = enabled && snapshot?.key === key ? snapshot : null

  /** Page positions stay in the authenticated owner's range. A failed page
   * preserves already loaded items and an explicit incomplete/read-error notice. */
  async function more(kind: "records" | "appointments") {
    if (!current || busy.current) return
    const cursor = kind === "records" ? current.data.recordCursor : current.data.appointmentCursor
    if (!cursor) return
    const request = ++generation.current
    busy.current = true; setLoading(true); setError(null)
    try {
      const result = await loadPersonalWellnessCalendarAction({ start, end, load: kind, ...(kind === "records" ? { recordCursor: cursor } : { appointmentCursor: cursor }) })
      if (request !== generation.current) return
      // A changed/expired session invalidates the old owner's snapshot even if
      // the surrounding route has not refreshed its authenticated props yet.
      if (result.reason === "sign-in-required" || (result.ownerKey && result.ownerKey !== ownerKey)) {
        setSnapshot(null); setError("Your sign-in changed. Refresh the calendar before viewing personal items."); return
      }
      if (!result.ok || !result.data || result.ownerKey !== ownerKey) { setError("Could not load more personal items. The items already shown are unchanged."); return }
      const page = result.data
      setSnapshot((previous) => previous?.key !== key ? previous : { key, data: { ...previous.data,
        ...(kind === "records" ? { records: unique([...previous.data.records, ...page.records]), recordCursor: page.recordCursor }
          : { appointments: unique([...previous.data.appointments, ...page.appointments]), appointmentCursor: page.appointmentCursor }),
      } })
    } catch { if (request === generation.current) setError("Could not load more personal items. The items already shown are unchanged.") }
    finally { if (request === generation.current) { busy.current = false; setLoading(false) } }
  }
  return { key, data: current?.data ?? null, loading: enabled && loading, error: enabled ? error : null, refresh: () => setReload((value) => value + 1), more }
}
