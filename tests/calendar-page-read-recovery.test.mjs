import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { createCompiledModuleLoader, createElement, elementText, findElement, renderFunctionComponents } from "./helpers/compiled-module.mjs"
import { normalizeCalendarPreferences } from "../lib/calendar-preferences.js"
import { buildCalendarWorkspaceEvent, buildExternalCalendarBusyWorkspaceEvent } from "../lib/calendar-workspace.js"

const load = createCompiledModuleLoader(import.meta.url)
const source = await readFile(new URL("../app/calendar/page.tsx", import.meta.url), "utf8")
const unavailableTitle = "Calendar is temporarily unavailable"
const privateFailure = "invented backend failure detail must never appear in the page"
const practiceId = "invented-owned-practice"
const userId = "invented-owner"
const provider = { userId, user: { name: "Invented provider", email: "provider@example.test" } }

/** Runs the actual async page with explicit read doubles; no DB, request, action or provider starts. */
function fixture(options = {}) {
  const calls = []
  const nodes = {
    AppSurface: ({ title, description, children }) => createElement("section", { children: [title, description, children] }),
    CalendarWorkspace: (props) => createElement("workspace", props),
  }
  const read = async (name, value, args) => {
    calls.push({ name, args })
    if (options.fail === name) throw new Error(privateFailure)
    return value
  }
  const prisma = {
    practiceMembership: {
      findMany: (args) => args.where.userId
        ? read("membership", options.memberships ?? [{ practiceId, role: "OWNER", practice: { id: practiceId } }], args)
        : read("providers", options.providers ?? [provider], args),
    },
    calendarEvent: { findMany: (args) => read("events", options.events ?? [], args) },
    userPreference: { findUnique: (args) => read("preferences", options.preferences ?? null, args) },
    therapistAvailabilityRule: { findMany: (args) => read("availability", options.availability ?? [], args) },
    calendarAvailabilityScheduleInterval: { findMany: (args) => read("intervals", options.intervals ?? [], args) },
    externalCalendarBusyBlock: { findMany: (args) => read("busy", options.busy ?? [], args) },
  }
  const pass = (props) => createElement("div", props)
  const page = load(source, "app/calendar/page.tsx", {
    "react/jsx-runtime": { jsx: createElement, jsxs: createElement, Fragment: "fragment" },
    "next/link": { default: pass },
    "lucide-react": { Plus: pass },
    "@/lib/rsc-session": { getCurrentRscSession: async () => options.anonymous ? null : { user: { id: userId } } },
    "@/app/calendar/actions": { createPracticeAction: () => { throw new Error("WRITES_ARE_FORBIDDEN_IN_THIS_FIXTURE") } },
    "@/lib/calendar-readiness": { isCalendarDatabaseReady: async () => read("readiness", options.ready !== false) },
    "@/lib/calendar-preferences": { normalizeCalendarPreferences },
    "@/lib/calendar-workspace": { buildCalendarWorkspaceEvent, buildExternalCalendarBusyWorkspaceEvent },
    "@/lib/prisma": { prisma },
    "@/components/ui/app-surface": { AppSurface: nodes.AppSurface, appSurfaceClassName: "" },
    "@/components/ui/button": { Button: pass },
    "@/components/ui/card": { Card: pass, CardContent: pass, CardDescription: pass, CardHeader: pass, CardTitle: pass },
    "@/components/ui/input": { Input: pass },
    "@/components/ui/label": { Label: pass },
    "./calendar-guidance-notice": { CalendarGuidanceNotice: pass },
    "./calendar-operator-shell": { CalendarOperatorShell: pass },
    "./calendar-workspace": { CalendarWorkspace: nodes.CalendarWorkspace },
  }).default
  return {
    calls,
    async run(params = {}) {
      const tree = await page({ searchParams: Promise.resolve(params) })
      return {
        text: elementText(renderFunctionComponents(tree)),
        workspace: findElement(tree, (node) => node.type === nodes.CalendarWorkspace)?.props ?? null,
      }
    },
  }
}

/** A failed required read must not present partial data as an empty, bookable calendar. */
function assertUnavailable(result) {
  assert.equal(result.workspace, null)
  assert.match(result.text, new RegExp(unavailableTitle))
  assert.match(result.text, /Please try again later or contact support/)
  assert.equal(result.text.includes(privateFailure), false)
}

test("anonymous visitors keep the sign-in gate without reading calendar data", async () => {
  const input = fixture({ anonymous: true })
  const result = await input.run()
  assert.match(result.text, /Sign in to use practice scheduling/)
  assert.equal(result.workspace, null)
  assert.deepEqual(input.calls, [])
})

test("unready schema keeps the existing unavailable surface without workspace reads", async () => {
  const input = fixture({ ready: false })
  assertUnavailable(await input.run())
  assert.deepEqual(input.calls.map((call) => call.name), ["readiness"])
})

test("membership read failure preserves the existing unavailable surface", async () => {
  const input = fixture({ fail: "membership" })
  assertUnavailable(await input.run())
  assert.deepEqual(input.calls.map((call) => call.name), ["readiness", "membership"])
})

for (const stage of ["events", "providers", "preferences", "availability", "intervals", "busy"]) {
  test(`${stage} read failure shows generic unavailability and never a partial workspace`, async () => {
    const input = fixture({ fail: stage })
    assertUnavailable(await input.run())
    assert.ok(input.calls.some((call) => call.name === stage))
    if (stage !== "busy") assert.equal(input.calls.some((call) => call.name === "busy"), false)
  })
}

test("no owned practice still offers practice creation without workspace queries", async () => {
  const input = fixture({ memberships: [] })
  const result = await input.run()
  assert.match(result.text, /Create a practice calendar/)
  assert.equal(result.workspace, null)
  assert.deepEqual(input.calls.map((call) => call.name), ["readiness", "membership"])
})

test("a successful genuinely empty calendar still renders with normalized preferences", async () => {
  const input = fixture({ providers: [] })
  const result = await input.run()
  assert.ok(result.workspace)
  assert.deepEqual(result.workspace.events, [])
  assert.deepEqual(result.workspace.providers, [])
  assert.deepEqual(result.workspace.providerAvailability, [])
  assert.deepEqual(result.workspace.preferences, normalizeCalendarPreferences({}))
  assert.equal(input.calls.some((call) => call.name === "busy"), false)
})

test("successful reads preserve event mapping, provider availability and generic external busy privacy", async () => {
  const input = fixture({
    events: [{ id: "invented-event", kind: "APPOINTMENT", title: "Invented appointment", status: "CONFIRMED", ownerUserId: userId, startsAt: "2026-10-25T13:00:00.000Z", endsAt: "2026-10-25T14:00:00.000Z", blocksAvailability: true }],
    availability: [{ therapistId: userId, startMinute: 480, endMinute: 1020 }],
    intervals: [{ schedule: { therapistId: userId }, startMinute: 600, endMinute: 720 }],
    busy: [{ id: "invented-busy", ownerUserId: userId, startsAt: new Date("2026-10-25T15:00:00.000Z"), endsAt: new Date("2026-10-25T16:00:00.000Z") }],
  })
  const result = await input.run({ date: "2026-10-25" })
  assert.equal(result.workspace.initialDate, "2026-10-25")
  assert.equal(result.workspace.currentUserId, userId)
  assert.equal(result.workspace.events.length, 2)
  assert.equal(result.workspace.events[0].title, "Invented appointment")
  assert.equal(result.workspace.events[1].title, "Google busy")
  assert.equal(result.workspace.events[1].editable, false)
  assert.equal(result.workspace.events[1].extendedProps.clientLabel, null)
  assert.deepEqual(result.workspace.providers, [{ id: userId, label: "Invented provider" }])
  assert.deepEqual(result.workspace.providerAvailability, [{ providerId: userId, startMinute: 480, endMinute: 1020 }, { providerId: userId, startMinute: 600, endMinute: 720 }])
  const busyQuery = input.calls.find((call) => call.name === "busy").args
  assert.deepEqual(busyQuery.where.ownerUserId, { in: [userId] })
  assert.equal(busyQuery.where.connection.status, "ACTIVE")
  assert.equal(busyQuery.where.source.selectedForBusySync, true)
  assert.deepEqual(Object.keys(busyQuery.select).sort(), ["endsAt", "id", "ownerUserId", "startsAt"])
  assert.equal(busyQuery.take, 500)
})

test("an unowned requested practice never changes the authorized workspace query target", async () => {
  const input = fixture()
  assert.ok((await input.run({ practice: "invented-unowned-practice" })).workspace)
  assert.equal(input.calls.find((call) => call.name === "membership").args.where.userId, userId)
  for (const name of ["events", "providers", "availability"]) {
    assert.equal(input.calls.find((call) => call.name === name).args.where.practiceId, practiceId)
  }
  assert.equal(input.calls.find((call) => call.name === "intervals").args.where.schedule.practiceId, practiceId)
})

test("invalid requested dates retain the existing safe default", async () => {
  for (const date of ["2026-02-30", "not-a-date", "2026-10-25T12:00:00Z"]) {
    assert.equal((await fixture().run({ date })).workspace.initialDate, undefined)
  }
})
