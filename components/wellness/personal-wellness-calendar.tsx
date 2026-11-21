"use client"

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react"
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react"
import { loadPersonalWellnessCalendarAction, type PersonalAppointment, type PersonalCalendarData } from "@/app/wellness/calendar-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { calendarMonth, localDayKey, parseLocalDay, personalItemOnDay, personalReminderOccurrences } from "@/lib/wellness-calendar-view"
import { WELLNESS_CATEGORY_LABELS, wellnessRecordingLabel } from "@/lib/wellness-catalog"
import { WellnessEntryCard } from "./wellness-entry-card"
import type { WellnessTimelineEntry } from "./wellness-hub-client"
import type { ClientWellnessReminderSchedule } from "./wellness-calendar-companion"
import styles from "./personal-wellness-calendar.module.css"

const subscribe = () => () => {}
const clientReady = () => true
const serverReady = () => false
type Item = { id: string; kind: string; title: string; at: string; end?: string; record?: WellnessTimelineEntry; appointment?: PersonalAppointment }
const unique = <T extends {id:string}>(rows: T[]) => [...new Map(rows.map((row) => [row.id,row])).values()]

/** Owner-only calendar projection. Anonymous practice entries remain in memory.
 * Month changes invalidate older reads; pagination never substitutes another
 * month's response or silently treats a failed/partial read as an empty day. */
export function PersonalWellnessCalendar({ isSignedIn, entries = [], appointments = [], schedules, active = true, initialDay = "" }: {
  isSignedIn: boolean; entries?: WellnessTimelineEntry[]; appointments?: PersonalAppointment[]; schedules?: ClientWellnessReminderSchedule[]; active?: boolean; initialDay?: string
}) {
  const ready = useSyncExternalStore(subscribe,clientReady,serverReady)
  const [chosenDay,setChosenDay] = useState(parseLocalDay(initialDay) ? initialDay : "")
  const day = chosenDay || (ready ? localDayKey(new Date()) : "")
  const month = useMemo(() => day ? calendarMonth(day) : null,[day])
  const [snapshot,setSnapshot] = useState<(PersonalCalendarData & {key:string}) | null>(null)
  const [reload,setReload] = useState(0), [loading,setLoading] = useState(false), [moreLoading,setMoreLoading] = useState(false)
  const [error,setError] = useState<string | null>(null), [filter,setFilter] = useState("all"), [category,setCategory] = useState("all")
  const [opened,setOpened] = useState<WellnessTimelineEntry | null>(null)
  const requests = useRef(0), moreBusy = useRef(false), focusDay = useRef(false), grid = useRef<HTMLDivElement>(null)
  const start = month?.start, end = month?.end, key = month?.key

  useEffect(() => {
    if (!active || !isSignedIn || !start || !end || !key) return
    const request = ++requests.current
    moreBusy.current = false; setMoreLoading(false); setLoading(true); setError(null); setSnapshot(null)
    void loadPersonalWellnessCalendarAction({start,end}).then((result) => {
      if (request !== requests.current) return
      if (!result.ok || !result.data) { setError("Could not load your calendar. Please try again."); return }
      setSnapshot({...result.data,key})
    }).catch(() => { if (request === requests.current) setError("Could not load your calendar. Please try again.") })
      .finally(() => { if (request === requests.current) setLoading(false) })
    return () => { requests.current = requests.current + 1 }
  },[active,isSignedIn,start,end,key,reload])
  useEffect(() => { if (focusDay.current) { focusDay.current = false; grid.current?.querySelector<HTMLButtonElement>(`[data-calendar-day="${day}"]`)?.focus() } },[day])

  // Server parents remount on account changes. Do not expose a prior private
  // snapshot or persisted row if sign-out is observed before that remount.
  const current = isSignedIn && snapshot?.key === key ? snapshot : null
  const records = unique([...entries.filter((entry) => isSignedIn || entry.persisted === false),...current?.records ?? []])
  const visits = isSignedIn ? unique([...appointments,...current?.appointments ?? []]) : []
  const reminders = month ? personalReminderOccurrences(schedules ?? current?.schedules ?? [],month.start,month.end) : []
  const allItems: Item[] = [
    ...records.map((record) => ({id:`record:${record.id}`,kind:"record",title:wellnessRecordingLabel(record),at:record.occurredAt,record})),
    ...visits.map((appointment) => ({...appointment,id:`appointment:${appointment.id}`,kind:"appointment",appointment})),
    ...reminders,
  ]
  const items = allItems.filter((item) => (filter === "all" || item.kind === filter) && (filter !== "record" || category === "all" || item.record?.category === category)).sort((a,b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id))
  const rows = items.filter((item) => personalItemOnDay(item,day))
  const waiting = isSignedIn && (loading || !current && !error)
  const incomplete = Boolean(current?.recordCursor || current?.appointmentCursor)

  /** A second same-tick click cannot duplicate a page. Navigation invalidates
   * the request, so a late page cannot contaminate the newly selected month. */
  async function more(kind: "records" | "appointments") {
    if (moreBusy.current || !current || !month) return
    moreBusy.current = true; setMoreLoading(true); setError(null)
    const request = ++requests.current
    try {
      const result = await loadPersonalWellnessCalendarAction({start:month.start,end:month.end,load:kind,recordCursor:kind === "records" ? current.recordCursor : undefined,appointmentCursor:kind === "appointments" ? current.appointmentCursor : undefined})
      if (request !== requests.current) return
      if (!result.ok || !result.data) { setError("Could not load more items. The items already shown are unchanged."); return }
      const data = result.data
      setSnapshot((previous) => previous?.key === month.key ? { ...previous, ...(kind === "records" ? {records:unique([...previous.records,...data.records]),recordCursor:data.recordCursor} : {appointments:unique([...previous.appointments,...data.appointments]),appointmentCursor:data.appointmentCursor}) } : previous)
    } catch { if (request === requests.current) setError("Could not load more items. The items already shown are unchanged.") }
    finally { if (request === requests.current) { moreBusy.current = false; setMoreLoading(false) } }
  }
  function moveMonth(offset: number) { if (month) { setOpened(null); setChosenDay(`${calendarMonth(day,offset).key}-01`) } }
  function keyboardDay(event: KeyboardEvent<HTMLButtonElement>, value: string) {
    const date = parseLocalDay(value)
    if (!date) return
    const change: Record<string,number> = {ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7,Home:-date.getDay(),End:6-date.getDay()}
    if (event.key === "PageUp" || event.key === "PageDown") { event.preventDefault(); focusDay.current = true; moveMonth(event.key === "PageUp" ? -1 : 1); return }
    if (!(event.key in change)) return
    event.preventDefault(); date.setDate(date.getDate() + change[event.key]); focusDay.current = true; setChosenDay(localDayKey(date))
  }

  if (!active) return null
  if (!ready || !month) return <p role="status">Loading calendar…</p>
  const selectedDate = parseLocalDay(day)!, monthDate = parseLocalDay(`${month.key}-01`)!
  const formatDay = (value: string) => parseLocalDay(value)!.toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric",year:"numeric"})
  const time = (value: string) => new Date(value).toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"})
  return <section className={styles.calendar} data-personal-calendar aria-label="Personal calendar">
    <div className={styles.toolbar}>
      <div className={styles.monthNav}><Button type="button" variant="glow" size="icon" aria-label="Previous month" onClick={() => moveMonth(-1)}><ChevronLeft /></Button><h2 aria-live="polite">{monthDate.toLocaleDateString(undefined,{month:"long",year:"numeric"})}</h2><Button type="button" variant="glow" size="icon" aria-label="Next month" onClick={() => moveMonth(1)}><ChevronRight /></Button></div>
      <div className={styles.tools}><Button type="button" variant="glow" onClick={() => setChosenDay(localDayKey(new Date()))}>Today</Button>{isSignedIn ? <Button type="button" variant="ghost" aria-label="Refresh personal calendar" onClick={() => setReload((value) => value + 1)} disabled={loading || moreLoading}><RefreshCw /></Button> : null}</div>
    </div>
    <div className={styles.filters}><div><Label htmlFor="personal-calendar-date">Go to date</Label><Input id="personal-calendar-date" type="date" value={day} onChange={(event) => { if (parseLocalDay(event.target.value)) setChosenDay(event.target.value) }} /></div><div><Label htmlFor="personal-calendar-show">Show</Label><select id="personal-calendar-show" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All items</option><option value="record">Recordings</option><option value="appointment">Appointments</option><option value="reminder">Reminders</option></select></div>{filter === "record" ? <div><Label htmlFor="personal-calendar-type">Recording type</Label><select id="personal-calendar-type" value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All types</option>{Object.entries(WELLNESS_CATEGORY_LABELS).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></div> : null}</div>
    <p className={styles.note}>{isSignedIn ? "Private to you. Your recordings are shown here without being shared with a practice or synced to Google." : "Practice recordings and reminder previews from this page session. Sign in to keep your history."} Times use {Intl.DateTimeFormat().resolvedOptions().timeZone}.</p>
    {error ? <div role="alert" className={styles.error}><p>{error}</p>{!current ? <Button type="button" variant="glow" onClick={() => setReload((value) => value + 1)}>Try again</Button> : null}</div> : null}
    {waiting ? <p role="status">Loading your calendar…</p> : null}
    {incomplete ? <div className={styles.partial} role="status"><p>More items are available for this month. Day counts and lists include the items loaded so far.</p>{current?.recordCursor ? <Button type="button" variant="glow" disabled={moreLoading} onClick={() => void more("records")}>Load more recordings</Button> : null}{current?.appointmentCursor ? <Button type="button" variant="glow" disabled={moreLoading} onClick={() => void more("appointments")}>Load more appointments</Button> : null}</div> : null}
    <div className={styles.layout}>
      <div className={styles.month} ref={grid} role="group" aria-label={`${monthDate.toLocaleDateString(undefined,{month:"long",year:"numeric"})} dates`}>
        {Array.from({length:7},(_,index) => <span key={index} className={styles.weekday}>{new Date(2026,10,1 + index).toLocaleDateString(undefined,{weekday:"short"})}</span>)}
        {month.days.map((value) => { const outside = !value.startsWith(month.key), count = outside ? null : items.filter((item) => personalItemOnDay(item,value)).length; return <button key={value} type="button" data-calendar-day={value} data-other-month={outside || undefined} aria-label={`${formatDay(value)}${outside ? ", open this month to view items" : waiting || error && !current ? ", items unavailable" : `, ${count} ${count === 1 ? "item" : "items"}${incomplete ? " loaded" : ""}`}`} aria-pressed={value === day} aria-current={value === localDayKey(new Date()) ? "date" : undefined} tabIndex={value === day ? 0 : -1} onKeyDown={(event) => keyboardDay(event,value)} onClick={() => { focusDay.current = true; setChosenDay(value) }}><span>{parseLocalDay(value)!.getDate()}</span>{count && !waiting && !(error && !current) ? <small>{count}</small> : null}</button> })}
      </div>
      <section className={styles.agenda} aria-labelledby="personal-calendar-day-title"><h3 id="personal-calendar-day-title">{selectedDate.toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"})}</h3>
        {!waiting && !(error && !current) && !rows.length ? <p>{incomplete ? "No matching items loaded for this day yet." : "No matching items on this day."}</p> : null}
        {!waiting && !(error && !current) ? <ul>{rows.map((item) => <li key={item.id} data-calendar-item={item.kind}><p className={styles.kind}>{item.kind === "record" ? "Recording" : item.kind === "appointment" ? "Appointment" : "Reminder"}<time dateTime={item.at}>{time(item.at)}{item.end ? ` – ${time(item.end)}` : ""}</time></p>{item.record ? <Button type="button" variant="glow" onClick={() => setOpened(item.record!)} aria-label={`View ${item.title} at ${time(item.at)}`}>{item.title}</Button> : <strong>{item.title}</strong>}{item.record?.summary ? <p className={styles.preview}>{item.record.summary}</p> : null}{item.appointment ? <p>{item.appointment.practiceName} · {item.appointment.status.replaceAll("_"," ").toLowerCase()}</p> : null}{item.kind === "reminder" ? <p>Current schedule preview; this does not mark a check-in as completed.</p> : null}</li>)}</ul> : null}
      </section>
    </div>
    <Dialog open={Boolean(opened)} onOpenChange={(open) => { if (!open) setOpened(null) }}><DialogContent className={styles.detail}><DialogHeader><DialogTitle>Recording details</DialogTitle></DialogHeader>{opened ? <WellnessEntryCard entry={opened} readOnly /> : null}</DialogContent></Dialog>
  </section>
}
