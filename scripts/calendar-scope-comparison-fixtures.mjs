import { normalizeGoogleBusyBlock } from "../lib/calendar-sync-normalization.ts"
import { requireComparison, validateComparisonConfig } from "./calendar-scope-comparison-core.mjs"

const API = "https://www.googleapis.com/calendar/v3"
const KINDS = ["timed", "allDay", "recurring"]
const ROOT = /^[a-z0-9]{5,64}$/
const UTC_ZONES = new Set(["UTC", "Etc/UTC", "Etc/GMT", "GMT"])

/** Independent October fixture schedule; provider responses supply identities only. */
function expectedRows(roots) {
  const row = (id, day, start, end, status, allDay = false) => ({
    id, startsAt: `2026-10-${day}T${start}:00.000Z`,
    endsAt: `2026-10-${allDay ? "12" : day}T${end}:00.000Z`,
    timezone: "UTC", allDay, status,
  })
  const before = [
    row(roots[0], "10", "10:00", "11:00", "BUSY"),
    row(roots[1], "11", "00:00", "00:00", "BUSY", true),
    row(`${roots[2]}_20261010T140000Z`, "10", "14:00", "14:30", "FREE"),
    row(`${roots[2]}_20261011T140000Z`, "11", "14:00", "14:30", "FREE"),
  ]
  return { before, after: [{ ...before[0], startsAt: "2026-10-10T10:30:00.000Z", endsAt: "2026-10-10T11:30:00.000Z", status: "FREE" }, ...before.slice(2)] }
}

function comparisonSource(source, roots) {
  return { calendarId: source.calendarId, summary: source.summary, accessRole: source.accessRole, timezone: "UTC", eventRoots: roots, ...expectedRows(roots) }
}

/** Pre-consent target validation allows unknown owner IDs, never unknown calendars or dates. */
export function validateFixturePreparation(config) {
  requireComparison(config?.ownerFixturesReady === true)
  requireComparison(config.timeMin === "2026-10-10T00:00:00Z" && config.timeMax === "2026-10-13T00:00:00Z")
  requireComparison(Array.isArray(config.sources) && config.sources.length === 2)
  for (const [index, source] of config.sources.entries()) {
    requireComparison(source.accessRole === (index === 0 ? "owner" : "reader") && source.timezone === "UTC")
    requireComparison(Array.isArray(source.fixtures) && source.fixtures.length === 3)
    for (const [kindIndex, fixture] of source.fixtures.entries()) {
      requireComparison(fixture.kind === KINDS[kindIndex])
      const title = index === 0 ? ["Test timed", "Test all-day", "Test recurring"][kindIndex] : `AtmoShaper synthetic ${["timed", "all-day", "recurring"][kindIndex]} ${config.runId}`
      requireComparison(fixture.title === title)
      requireComparison(index === 0 ? fixture.eventId === undefined : typeof fixture.eventId === "string" && ROOT.test(fixture.eventId))
    }
    requireComparison(new Set(source.fixtures.map((fixture) => fixture.eventId ?? fixture.kind)).size === 3)
  }
  // Placeholders validate only the existing target/schedule schema offline.
  // They never reach a provider request or the strict known-ID comparison.
  validateComparisonConfig({ ...config, sources: config.sources.map((source) => comparisonSource(source, source.fixtures.map((fixture) => fixture.eventId ?? `pending${fixture.kind.toLowerCase()}`))) })
  return config
}

function fixtureBlock(source, event) {
  return normalizeGoogleBusyBlock({ ownerUserId: "scope-test", connectionId: "scope-test", sourceId: "scope-test", providerCalendarId: source.calendarId, sourceTimezone: source.timezone, event })
}

function matchesShape(source, event, expected) {
  const block = fixtureBlock(source, event)
  return block && block.startsAt.toISOString() === expected.startsAt && block.endsAt.toISOString() === expected.endsAt && UTC_ZONES.has(block.timezone) && block.allDay === expected.allDay && block.status === expected.status
}

/** Resolve only the user's exact synthetic names/shapes, rejecting unrelated or changed events. */
function bindPage(source, items, found, roots) {
  const schedule = expectedRows(["pendingtimed", "pendingallday", "pendingrecurring"]).before
  for (const event of items) {
    requireComparison(typeof event?.id === "string" && event.status === "confirmed", "fixture_boundary")
    requireComparison(!event.attendees?.length && !event.conferenceData && !event.hangoutLink && event.reminders?.useDefault !== true && !event.reminders?.overrides?.length, "fixture_boundary")
    const kindIndex = source.fixtures.findIndex((fixture) => event.summary === fixture.title)
    requireComparison(kindIndex >= 0, "fixture_boundary")
    const indices = kindIndex === 2 ? [2, 3] : [kindIndex]
    const match = indices.find((index) => matchesShape(source, event, schedule[index]))
    requireComparison(match !== undefined && !found.has(match), "baseline_mismatch")
    const root = kindIndex === 2 ? event.recurringEventId : event.id
    requireComparison(typeof root === "string" && ROOT.test(root), "missing_event_identity")
    requireComparison(!source.fixtures[kindIndex].eventId || source.fixtures[kindIndex].eventId === root, "fixture_boundary")
    requireComparison(!roots[kindIndex] || roots[kindIndex] === root, "fixture_boundary")
    if (kindIndex === 2) {
      const suffix = match === 2 ? "20261010T140000Z" : "20261011T140000Z"
      requireComparison(event.id === `${root}_${suffix}`, "fixture_boundary")
      requireComparison(new Date(event.originalStartTime?.dateTime).toISOString() === schedule[match].startsAt, "fixture_boundary")
    } else requireComparison(!event.recurringEventId, "fixture_boundary")
    roots[kindIndex] = root
    found.set(match, fixtureBlock(source, event).timezone)
  }
}

/** All calendar metadata is checked before any bounded event read; no inventory endpoint exists. */
export async function bindPreparedFixtures({ config, accessToken, fetchImpl = fetch, signal, onProgress = () => {} }) {
  validateFixturePreparation(config)
  const budget = AbortSignal.any([signal ?? new AbortController().signal, AbortSignal.timeout(60_000)])
  const get = async (url) => {
    const response = await fetchImpl(url, { method: "GET", headers: { Authorization: `Bearer ${accessToken}` }, redirect: "error", signal: AbortSignal.any([budget, AbortSignal.timeout(8_000)]) })
    requireComparison(response.status === 200, "fixture_metadata")
    return response.json()
  }
  const timezones = []
  for (const [index, source] of config.sources.entries()) {
    onProgress({ phase: "calendar_metadata", source: index + 1 })
    const calendar = await get(`${API}/users/me/calendarList/${encodeURIComponent(source.calendarId)}`)
    requireComparison(calendar.id === source.calendarId && !calendar.primary && calendar.summary === source.summary && UTC_ZONES.has(calendar.timeZone) && calendar.accessRole === source.accessRole, "fixture_metadata")
    timezones.push(calendar.timeZone)
  }
  const sources = []
  for (const [index, target] of config.sources.entries()) {
    const source = { ...target, timezone: timezones[index] }
    onProgress({ phase: "fixture_binding", source: index + 1 })
    const found = new Map()
    const roots = []
    let pageToken
    let requests = 0
    let items = 0
    do {
      requireComparison(++requests <= 16, "request_budget")
      const url = new URL(`${API}/calendars/${encodeURIComponent(source.calendarId)}/events`)
      for (const [key, value] of Object.entries({ timeMin: config.timeMin, timeMax: config.timeMax, timeZone: "UTC", singleEvents: "true", showDeleted: "true", maxResults: "2", fields: "items(id,summary,status,start,end,transparency,recurringEventId,originalStartTime,attendees,reminders,conferenceData,hangoutLink),nextPageToken", ...(pageToken ? { pageToken } : {}) })) url.searchParams.set(key, value)
      const page = await get(url.toString())
      requireComparison(Array.isArray(page.items) && (items += page.items.length) <= 24, "fixture_boundary")
      bindPage(source, page.items, found, roots)
      pageToken = page.nextPageToken
      requireComparison(pageToken === undefined || typeof pageToken === "string" && pageToken.length > 0 && pageToken.length <= 8192, "fixture_boundary")
    } while (pageToken)
    requireComparison(found.size === 4 && roots.length === 3 && new Set(roots).size === 3, "baseline_mismatch")
    // Expanded instances alone cannot establish COUNT=2. Check only their
    // discovered synthetic master, never another calendar or an iCalUID.
    const masterUrl = new URL(`${API}/calendars/${encodeURIComponent(source.calendarId)}/events/${roots[2]}`)
    masterUrl.searchParams.set("fields", "id,summary,status,start,end,transparency,recurrence,attendees,reminders,conferenceData,hangoutLink")
    const master = await get(masterUrl.toString())
    const rule = master.recurrence?.length === 1 && master.recurrence[0]
    requireComparison(typeof rule === "string" && rule.startsWith("RRULE:"), "fixture_boundary")
    const terms = rule.slice(6).split(";")
    requireComparison(new Set(terms).size === terms.length && terms.includes("FREQ=DAILY") && terms.includes("COUNT=2") && terms.every((term) => ["FREQ=DAILY", "COUNT=2", "INTERVAL=1"].includes(term)), "fixture_boundary")
    requireComparison(master.id === roots[2] && master.summary === source.fixtures[2].title && master.status === "confirmed" && !master.attendees?.length && !master.conferenceData && !master.hangoutLink && master.reminders?.useDefault !== true && !master.reminders?.overrides?.length && matchesShape(source, master, expectedRows(roots).before[2]), "fixture_boundary")
    // UTC aliases are checked against a finite set, not arbitrary provider
    // zones. Preserve their literal representation for later strict equality;
    // timings, status, recurrence and all-day expectations stay independent.
    const bound = comparisonSource(source, roots)
    bound.timezone = source.timezone
    bound.before = bound.before.map((row, rowIndex) => ({ ...row, timezone: found.get(rowIndex) }))
    bound.after = [0, 2, 3].map((beforeIndex, rowIndex) => ({ ...bound.after[rowIndex], timezone: found.get(beforeIndex) }))
    sources.push(bound)
  }
  onProgress({ phase: "bound", sources: 2, resources: 6 })
  return validateComparisonConfig({ projectId: config.projectId, accountEmail: config.accountEmail, credentialFile: config.credentialFile, runId: config.runId, timeMin: config.timeMin, timeMax: config.timeMax, sources })
}
