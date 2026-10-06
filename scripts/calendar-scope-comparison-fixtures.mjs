import { normalizeGoogleBusyBlock } from "../lib/calendar-sync-normalization.ts"
import { requireComparison, validateComparisonConfig } from "./calendar-scope-comparison-core.mjs"

const API = "https://www.googleapis.com/calendar/v3"
const KINDS = ["timed", "allDay", "recurring"]
const ROOT = /^[a-z0-9]{5,64}$/
// Google's city/country picker exposes Iceland rather than a literal UTC entry.
// IANA links Iceland/Reykjavik to Abidjan; these preserve UTC for the fixed 2026
// fixture dates. Do not accept arbitrary zones merely because today's offset is 0.
const UTC_ZONES = new Set(["UTC", "Etc/UTC", "Etc/GMT", "GMT", "Atlantic/Reykjavik", "Africa/Abidjan", "Iceland"])

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
    // The owner's recorded time repair left two deleted occurrences. Their
    // exact private IDs are allowed only as cancellations of the bound master.
    const retired = source.retiredInstanceIds ?? []
    requireComparison(Array.isArray(retired) && retired.length <= (index === 0 ? 2 : 0))
    requireComparison(new Set(retired).size === retired.length)
    const retiredRoots = retired.map((id) => typeof id === "string" && /^([a-z0-9]{5,64})_(20261010T180000Z|20261011T180000Z)$/.exec(id))
    requireComparison(retiredRoots.every(Boolean) && new Set(retiredRoots.map((match) => match[1])).size <= 1)
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

/** Fixed boolean flags locate a rejected check without serializing provider values. */
function requireFixtureChecks(checks, onMismatch, reason = "fixture_boundary") {
  if (!Object.values(checks).every(Boolean)) {
    onMismatch(checks)
    requireComparison(false, reason)
  }
}

/** Resolve only the user's exact synthetic names/shapes, rejecting unrelated or changed events. */
function bindPage(source, items, found, roots, retiredSeen, onMismatch) {
  const schedule = expectedRows(["pendingtimed", "pendingallday", "pendingrecurring"]).before
  for (const [entry, event] of items.entries()) {
    const check = (checks, stage, reason) => requireFixtureChecks(checks, (flags) => onMismatch({ entry: entry + 1, checkStage: stage, checks: flags }), reason)
    if (event?.status === "cancelled") {
      check({ recordedRetirement: Boolean(source.retiredInstanceIds?.includes(event.id)), uniqueRetirement: !retiredSeen.has(event.id) }, "retired_identity")
      // Deleted titles are not an identity contract and may differ from the
      // active master. Bind only the recorded cancellation ID/root; never derive
      // active expectations from a tombstone or admit an unrecorded deletion.
      const root = event.id.split("_")[0]
      check({ root: !event.recurringEventId || event.recurringEventId === root, noGuests: !event.attendees?.length, noConference: !event.conferenceData && !event.hangoutLink }, "retired_fields")
      retiredSeen.add(event.id)
      continue
    }
    check({ identity: typeof event?.id === "string", confirmed: event?.status === "confirmed" }, "active_identity")
    check({ noGuests: !event.attendees?.length, noConference: !event.conferenceData && !event.hangoutLink, noDefaultReminders: event.reminders?.useDefault !== true, noReminderOverrides: !event.reminders?.overrides?.length }, "active_fields")
    const kindIndex = source.fixtures.findIndex((fixture) => event.summary === fixture.title)
    check({ approvedTitle: kindIndex >= 0 }, "active_title")
    const indices = kindIndex === 2 ? [2, 3] : [kindIndex]
    const match = indices.find((index) => matchesShape(source, event, schedule[index]))
    check({ schedule: match !== undefined, uniqueShape: !found.has(match) }, "active_schedule", "baseline_mismatch")
    const root = kindIndex === 2 ? event.recurringEventId : event.id
    check({ validRoot: typeof root === "string" && ROOT.test(root) }, "active_root", "missing_event_identity")
    check({ recordedRoot: !source.fixtures[kindIndex].eventId || source.fixtures[kindIndex].eventId === root, consistentRoot: !roots[kindIndex] || roots[kindIndex] === root }, "active_root")
    if (kindIndex === 2) {
      const suffix = match === 2 ? "20261010T140000Z" : "20261011T140000Z"
      check({ occurrenceIdentity: event.id === `${root}_${suffix}`, originalStart: Date.parse(event.originalStartTime?.dateTime) === Date.parse(schedule[match].startsAt) }, "occurrence_fields")
    } else check({ nonRecurring: !event.recurringEventId }, "active_root")
    roots[kindIndex] = root
    found.set(match, fixtureBlock(source, event).timezone)
  }
}

/** All calendar metadata is checked before any bounded event read; no inventory endpoint exists. */
export async function bindPreparedFixtures({ config, accessToken, fetchImpl = fetch, signal, onProgress = () => {} }) {
  validateFixturePreparation(config)
  const budget = AbortSignal.any([signal ?? new AbortController().signal, AbortSignal.timeout(60_000)])
  const get = async (url, onResponse = () => {}) => {
    const response = await fetchImpl(url, { method: "GET", headers: { Authorization: `Bearer ${accessToken}` }, redirect: "error", signal: AbortSignal.any([budget, AbortSignal.timeout(8_000)]) })
    let providerReason
    if (response.status !== 200) {
      const reasons = new Set(["accessNotConfigured", "insufficientPermissions", "notFound", "forbidden", "rateLimitExceeded", "quotaExceeded", "unauthenticated"])
      try {
        const body = await response.clone().json()
        const reason = body?.error?.errors?.[0]?.reason
        providerReason = reasons.has(reason) ? reason : "other"
      } catch { providerReason = "other" }
    }
    onResponse({ httpStatus: response.status, ...(providerReason ? { providerReason } : {}) })
    requireComparison(response.status === 200, "fixture_metadata")
    return response.json()
  }
  const timezones = []
  for (const [index, source] of config.sources.entries()) {
    onProgress({ phase: "calendar_metadata", source: index + 1 })
    const progress = { phase: "calendar_metadata", source: index + 1 }
    const calendar = await get(`${API}/users/me/calendarList/${encodeURIComponent(source.calendarId)}`, (status) => onProgress({ ...progress, ...status }))
    // Field flags distinguish missing access from target drift without logging
    // calendar names, identifiers, arbitrary zones or provider error bodies.
    const checks = { identity: calendar.id === source.calendarId, secondary: !calendar.primary, name: calendar.summary === source.summary, utcTimezone: UTC_ZONES.has(calendar.timeZone), accessRole: calendar.accessRole === source.accessRole }
    onProgress({ ...progress, httpStatus: 200, checks })
    requireComparison(Object.values(checks).every(Boolean), "fixture_metadata")
    timezones.push(calendar.timeZone)
  }
  const sources = []
  for (const [index, target] of config.sources.entries()) {
    const source = { ...target, timezone: timezones[index] }
    onProgress({ phase: "fixture_binding", source: index + 1 })
    const check = (checks, checkStage, reason) => requireFixtureChecks(checks, (flags) => onProgress({ phase: "fixture_binding", source: index + 1, checkStage, checks: flags }), reason)
    const found = new Map()
    const roots = []
    const retiredSeen = new Set()
    let pageToken
    let requests = 0
    let items = 0
    do {
      requireComparison(++requests <= 16, "request_budget")
      const url = new URL(`${API}/calendars/${encodeURIComponent(source.calendarId)}/events`)
      for (const [key, value] of Object.entries({ timeMin: config.timeMin, timeMax: config.timeMax, timeZone: "UTC", singleEvents: "true", showDeleted: "true", maxResults: "2", fields: "items(id,summary,status,start,end,transparency,recurringEventId,originalStartTime,attendees,reminders,conferenceData,hangoutLink),nextPageToken", ...(pageToken ? { pageToken } : {}) })) url.searchParams.set(key, value)
      const page = await get(url.toString())
      check({ itemsArray: Array.isArray(page.items) }, "page_shape")
      check({ itemBudget: (items += page.items.length) <= 24 }, "page_shape")
      bindPage(source, page.items, found, roots, retiredSeen, (failure) => onProgress({ phase: "fixture_binding", source: index + 1, page: requests, ...failure }))
      pageToken = page.nextPageToken
      check({ pageCursor: pageToken === undefined || typeof pageToken === "string" && pageToken.length > 0 && pageToken.length <= 8192 }, "page_cursor")
    } while (pageToken)
    check({ fourShapes: found.size === 4, threeRoots: roots.length === 3 && new Set(roots).size === 3 }, "complete_schedule", "baseline_mismatch")
    check({ retiredRoot: (source.retiredInstanceIds ?? []).every((id) => id.startsWith(`${roots[2]}_`)) }, "retired_root")
    // Expanded instances alone cannot establish COUNT=2. Check only their
    // discovered synthetic master, never another calendar or an iCalUID.
    const masterUrl = new URL(`${API}/calendars/${encodeURIComponent(source.calendarId)}/events/${roots[2]}`)
    masterUrl.searchParams.set("fields", "id,summary,status,start,end,transparency,recurrence,attendees,reminders,conferenceData,hangoutLink")
    onProgress({ phase: "fixture_master", source: index + 1 })
    const master = await get(masterUrl.toString())
    const rule = master.recurrence?.length === 1 && master.recurrence[0]
    check({ singleRule: typeof rule === "string" && rule.startsWith("RRULE:") }, "recurrence_rule")
    const terms = rule.slice(6).split(";")
    check({ uniqueTerms: new Set(terms).size === terms.length, daily: terms.includes("FREQ=DAILY"), countTwo: terms.includes("COUNT=2"), allowedTerms: terms.every((term) => ["FREQ=DAILY", "COUNT=2", "INTERVAL=1"].includes(term)) }, "recurrence_bound")
    check({ identity: master.id === roots[2], title: master.summary === source.fixtures[2].title, confirmed: master.status === "confirmed", noGuests: !master.attendees?.length, noConference: !master.conferenceData && !master.hangoutLink, noDefaultReminders: master.reminders?.useDefault !== true, noReminderOverrides: !master.reminders?.overrides?.length, schedule: Boolean(matchesShape(source, master, expectedRows(roots).before[2])) }, "master_fields")
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
