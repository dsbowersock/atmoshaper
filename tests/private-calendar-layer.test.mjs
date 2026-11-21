import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { runInNewContext } from "node:vm"
import { compileCommonJsModule, createElement, findElement, findElements, passThroughElement } from "./helpers/compiled-module.mjs"
import { buildPrivateCalendarEvents, isPrivateCalendarEvent } from "../lib/private-calendar-layer.js"
import { normalizeCalendarPreferences } from "../lib/calendar-preferences.js"
import * as display from "../lib/calendar-display.js"
import { parsePersonalCalendarRequest } from "../lib/wellness-calendar-view.js"

const start = "2026-11-01T00:00:00.000Z", end = "2026-12-13T00:00:00.000Z"
const record = (id) => ({ id, category: "activity", occurredAt: "2026-11-20T10:00:00.000Z", summary: "PRIVATE_SENTINEL", metadata: { private: "PRIVATE_SENTINEL" }, regions: ["PRIVATE_SENTINEL"], sensations: [], contexts: [], intensity: null, persisted: true })
const data = (ids = [], patch = {}) => ({ records: ids.map(record), appointments: [], schedules: [], recordCursor: null, appointmentCursor: null, ...patch })
const result = (ids = [], patch = {}, ownerKey = "owner-a") => ({ ok: true, ownerKey, data: data(ids, patch) })
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no }); return { promise, resolve, reject } }
const hookSource = await readFile(new URL("../components/wellness/use-private-calendar-layer.ts", import.meta.url), "utf8")

/** Deterministic hooks execute the production controller, including cleanups,
 * actor/range render gates and held network completions, without any database. */
function hooks() {
  const slots = [], effects = []; let cursor = 0
  return { api: {
    useState(initial) { const at = cursor++; if (!(at in slots)) slots[at] = typeof initial === "function" ? initial() : initial; return [slots[at], (value) => { slots[at] = typeof value === "function" ? value(slots[at]) : value }] },
    useRef(initial) { const at = cursor++; return slots[at] ??= { current: initial } },
    useEffect(callback, deps) { const at = cursor++, previous = slots[at]; if (!previous || deps.some((value, index) => !Object.is(value, previous.deps[index]))) effects.push(() => { previous?.cleanup?.(); slots[at] = { deps, cleanup: callback() } }) },
    useMemo: (callback) => callback(), useCallback: (callback) => callback, useTransition: () => [false, (callback) => callback()],
  }, begin() { cursor = 0; effects.length = 0 }, commit() { for (const effect of effects.splice(0)) effect() } }
}
function compile(source, file, dependencies, globals = {}) {
  const compiled = { exports: {} }
  runInNewContext(compileCommonJsModule(source, file), { module: compiled, exports: compiled.exports, require: (name) => { assert.ok(Object.hasOwn(dependencies, name), name); return dependencies[name] }, ...globals })
  return compiled.exports
}
function controller() {
  const host = hooks(), pending = [], calls = []
  const readLayer = compile(hookSource, "private-layer.ts", { react: host.api, "@/app/wellness/calendar-actions": { loadPersonalWellnessCalendarAction: (input) => { calls.push(input); const task = deferred(); pending.push(task); return task.promise } } }).usePrivateCalendarLayer
  let props = { enabled: true, ownerKey: "owner-a", start, end }, state
  function render(patch = {}, commit = true) { props = { ...props, ...patch }; host.begin(); state = readLayer(props); if (commit) host.commit(); return state }
  render(); render()
  return { pending, calls, render, get state() { return state }, async flush() { for (let i = 0; i < 12; i++) await Promise.resolve(); render(); render() } }
}

test("six-week month grids are accepted but larger unbounded windows are rejected", () => {
  assert.ok(parsePersonalCalendarRequest({ start, end }))
  assert.equal(parsePersonalCalendarRequest({ start, end: "2027-01-01" }), null)
})
test("private projection carries only read-only display fields and deduplicates an already visible appointment", () => {
  const visits = [{ id: "same", at: start, end, title: "Visit", practiceName: "Example", status: "CONFIRMED" }, { id: "cancelled", at: start, end, title: "Cancelled", practiceName: "Example", status: "CANCELLED" }]
  const events = buildPrivateCalendarEvents(data(["record"], { appointments: visits }), { start, end, practiceAppointmentIds: ["same"] })
  assert.equal(events.length, 1)
  assert.equal(JSON.stringify(events).includes("PRIVATE_SENTINEL"), false)
  assert.equal(Date.parse(events[0].end) - Date.parse(events[0].start), 1000)
  for (const event of events) { assert.ok(isPrivateCalendarEvent(event.id)); assert.equal(event.editable, false); assert.equal(event.startEditable, false); assert.equal(event.durationEditable, false) }
  assert.equal(buildPrivateCalendarEvents(data([], { appointments: visits }), { start, end, showCancelledEvents: true }).length, 2)
})
test("late ranges and owner mismatches cannot appear in the private layer", async () => {
  const page = controller()
  page.render({ start: "2026-12-01", end: "2027-01-01" }); page.render()
  page.pending[1].resolve(result(["current"])); await page.flush()
  page.pending[0].resolve(result(["stale"])); await page.flush()
  assert.equal(page.state.data.records[0].id, "current")
  assert.equal(page.render({ ownerKey: "owner-b" }, false).data, null)
  page.render(); page.render()
  page.pending[2].resolve(result(["wrong-owner"])); await page.flush()
  assert.equal(page.state.data, null); assert.match(page.state.error, /Could not load/)
  assert.ok(page.calls.every((input) => !Object.hasOwn(input, "ownerKey")))
})
test("switching the private layer off hides data before effects and rejects late pages", async () => {
  const page = controller(); page.pending[0].resolve(result(["first"], { recordCursor: "cursor" })); await page.flush()
  void page.state.more("records")
  assert.equal(page.render({ enabled: false }, false).data, null)
  page.render(); page.pending[1].resolve(result(["late-page"])); await page.flush()
  assert.equal(page.state.data, null)
  page.render({ enabled: true }); page.render()
  assert.equal(page.state.data, null); assert.equal(page.calls.length, 3)
})
test("failed reads and pages stay explicit; retries deduplicate instead of silently truncating", async () => {
  const page = controller(); page.pending[0].reject(new Error("PRIVATE_SENTINEL")); await page.flush()
  assert.equal(page.state.data, null); assert.doesNotMatch(page.state.error, /PRIVATE_SENTINEL/)
  page.state.refresh(); page.render(); page.render(); page.pending[1].resolve(result(["first"], { recordCursor: "position" })); await page.flush()
  void page.state.more("records"); void page.state.more("records"); assert.equal(page.calls.length, 3)
  page.pending[2].resolve({ ok: false }); await page.flush()
  assert.equal(page.state.data.records.length, 1); assert.equal(page.state.data.recordCursor, "position"); assert.match(page.state.error, /already shown/)
  void page.state.more("records"); page.pending[3].resolve(result(["first", "second"])); await page.flush()
  assert.deepEqual(Array.from(page.state.data.records, (row) => row.id), ["first", "second"])
  assert.equal(page.state.data.recordCursor, null)
})

test("a next page reporting sign-out or another actor clears the previously owned snapshot", async () => {
  for (const reply of [{ok:false,reason:"sign-in-required"},result(["other"],{},"owner-b")]) {
    const page=controller();page.pending[0].resolve(result(["first"],{recordCursor:"position"}));await page.flush()
    void page.state.more("records");page.pending[1].resolve(reply);await page.flush()
    assert.equal(page.state.data,null)
  }
})

test("actual calendar hides disabled private sources and prevents their drag callback from scheduling writes", async () => {
  const host = hooks(), writes = [], routes = [], FullCalendar = passThroughElement("full-calendar"), SourceControls = passThroughElement("sources")
  const pass = new Proxy({}, { get: (_target, key) => passThroughElement(String(key)) })
  const deps = {
    react: host.api, "react/jsx-runtime": { jsx: createElement, jsxs: createElement }, "next/navigation": { useRouter: () => ({ push: (url) => routes.push(url) }) },
    "@fullcalendar/react": { __esModule: true, default: FullCalendar }, "@fullcalendar/daygrid": {}, "@fullcalendar/timegrid": {}, "@fullcalendar/interaction": {}, "lucide-react": pass,
    "@/app/calendar/actions": { rescheduleCalendarEventAction: (input) => writes.push(input), saveCalendarPreferencesAction: (input) => writes.push(input) },
    "@/components/wellness/use-private-calendar-layer": { usePrivateCalendarLayer: ({ enabled }) => ({ key: "current", data: enabled ? data(["private"]) : null, loading: false, error: null }) },
    "@/components/wellness/private-calendar-record-details": pass, "@/lib/private-calendar-layer": { buildPrivateCalendarEvents, isPrivateCalendarEvent }, "./calendar-source-controls": { CalendarSourceControls: SourceControls },
    "@/lib/calendar-display": display, "@/lib/utils": { cn: (...values) => values.filter(Boolean).join(" ") },
  }
  for (const name of ["badge", "button", "calendar", "card", "dropdown-menu", "input", "label", "popover", "select", "toggle-control"]) deps[`@/components/ui/${name}`] = pass
  const Workspace = compile(await readFile(new URL("../app/calendar/calendar-workspace.tsx", import.meta.url), "utf8"), "workspace.tsx", deps, { window: { location: {}, requestAnimationFrame:()=>0 } }).CalendarWorkspace
  const props = { events: [{ id: "practice-event", start, end, title: "Practice", extendedProps: { ownerUserId: "owner-a" } }], providers: [{ id: "owner-a", label: "Me" }, {id:"provider-b",label:"Another provider"}], providerAvailability: [], preferences: normalizeCalendarPreferences({providerViewMode:"split"}), currentUserId: "owner-a", selectedPracticeId: "practice-a" }
  let tree
  const render = () => { host.begin(); tree = Workspace(props); return tree }
  const calendar = () => findElement(tree, (node) => node.type === FullCalendar).props
  const sources = () => findElement(tree, (node) => node.type === SourceControls).props
  const toolbar = () => findElement(tree, (node) => node.type?.name === "CalendarToolbarControls").props
  render(); assert.equal(calendar().events.length, 1)
  assert.equal(findElements(tree,(node)=>node.type===FullCalendar).length,2)
  sources().changeScope("together"); render()
  assert.equal(calendar().events.length, 2)
  assert.equal(findElements(tree,(node)=>node.type===FullCalendar).length,1)
  let reverted = false
  calendar().eventDrop({ event: { id: "private:record:private", start: new Date(start), end: new Date(end) }, revert: () => { reverted = true } })
  assert.equal(reverted, true); assert.equal(writes.length, 0)
  toolbar().onRangeChange("month");render()
  assert.equal(writes[0].providerViewMode,"split")
  assert.doesNotMatch(JSON.stringify(writes),/PRIVATE_SENTINEL|private:record/)
  writes.length=0
  sources().changeScope("personal"); render(); assert.equal(calendar().events.length, 1)
  toolbar().onRangeChange("day");render();assert.equal(writes.length,0)
  sources().changeScope("practice"); render(); assert.equal(calendar().events.length, 1)
  sources().changePractice("practice-b"); assert.deepEqual(routes, ["/calendar?practice=practice-b&view=practice"])
})

test("every creation entry binds a chosen practice to the authenticated actor and existing eligible roles", async () => {
  const pass = new Proxy({}, { get: (_target, key) => passThroughElement(String(key)) })
  for (const route of ["", "appointment/", "personal/", "class/", "reminder/"]) {
    const source=await readFile(new URL(`../app/calendar/new/${route}page.tsx`,import.meta.url),"utf8"),calls=[]
    const deps=Object.fromEntries([...source.matchAll(/from "([^"]+)"/g)].map((match)=>[match[1],pass]))
    Object.assign(deps,{
      "react/jsx-runtime":{jsx:createElement,jsxs:createElement},
      "@/lib/rsc-session":{getCurrentRscSession:async()=>({user:{id:"owner-a"}})},
      "@/lib/calendar-readiness":{isCalendarDatabaseReady:async()=>true},
      "@/lib/prisma":{prisma:{practiceMembership:{findFirst:async(input)=>{calls.push(input);return null}}}},
    })
    const page=compile(source,"creation.tsx",deps,{URLSearchParams}).default
    await page({searchParams:Promise.resolve({practice:"unowned-practice"})})
    assert.equal(calls.length,1);assert.equal(calls[0].where.userId,"owner-a");assert.equal(calls[0].where.practiceId,"unowned-practice")
    assert.ok(calls[0].where.role.in.includes("OWNER"))
    if(route==="") {
      deps["@/lib/prisma"].prisma.practiceMembership.findFirst=async()=>({practiceId:"owned-practice",practice:{name:"Example"}})
      const tree=await page({searchParams:Promise.resolve({practice:"owned-practice",startsAt:"2026-11-20T10:00"})})
      const links=findElements(tree,(node)=>typeof node.props.href==="string"&&node.props.href.startsWith("/calendar/new/"))
      assert.equal(links.length,4)
      for(const link of links){const url=new URL(link.props.href,"http://example.test");assert.equal(url.searchParams.get("practice"),"owned-practice");assert.equal(url.searchParams.get("startsAt"),"2026-11-20T10:00")}
    }
  }
})
