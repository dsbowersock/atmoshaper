import { createGoogleCalendarAdapter } from "../lib/google-calendar-adapter.ts"
import { normalizeGoogleBusyBlock } from "../lib/calendar-sync-normalization.ts"

export const CALLBACK_URI = "http://localhost:3317/oauth/callback"
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/"
export const COMPARISON_SCOPES = Object.freeze({
  availability: `${CALENDAR_SCOPE}calendar.events.freebusy`,
  "event-read": `${CALENDAR_SCOPE}calendar.events.readonly`,
})
const LIST_SCOPE = `${CALENDAR_SCOPE}calendar.calendarlist.readonly`
const EMAIL_SCOPE = `${CALENDAR_SCOPE}userinfo.email`
const API = "https://www.googleapis.com/calendar/v3"
const MAX_ITEMS = 24

/** Deliberately generic: config/provider errors must not echo private values. */
export function requireComparison(condition, reason = "comparison_input") {
  if (!condition) throw new Error(reason)
}

/** Offline outline: importing or invoking plan mode performs no credential/provider IO. */
export function comparisonPlan() {
  return {
    status: "prepared_only",
    callback: CALLBACK_URI,
    scopes: Object.keys(COMPARISON_SCOPES),
    sourceCeiling: 2,
    syntheticEventResourceCeiling: 6,
    testPageSize: 2,
    productionPageSize: 2500,
    writes: "none; operator changes designated synthetic fixtures between reads",
    cleanup: "revoke only this dedicated test grant; operator removes owned fixtures",
    proofLimit: "standalone inbound permission probe; no database or full app acceptance",
  }
}

/** Resolve explicit synthetic fixtures; there is no inventory search or primary fallback. */
export function validateComparisonConfig(config) {
  requireComparison(config && typeof config === "object")
  requireComparison(typeof config.projectId === "string" && /^[a-z][a-z0-9-]{5,62}$/.test(config.projectId))
  requireComparison(!/(?:^|-)(?:prod|production)(?:-|$)/.test(config.projectId), "production_project")
  requireComparison(typeof config.accountEmail === "string" && /^[^\s@]+@[^\s@]+$/.test(config.accountEmail))
  requireComparison(typeof config.credentialFile === "string" && config.credentialFile.length > 0)
  requireComparison(typeof config.runId === "string" && /^[a-f0-9]{32}$/.test(config.runId))
  requireComparison(Number.isFinite(Date.parse(config.timeMin)) && Number.isFinite(Date.parse(config.timeMax)))
  requireComparison(new Date(config.timeMax) > new Date(config.timeMin))
  requireComparison(new Date(config.timeMax) - new Date(config.timeMin) <= 14 * 24 * 60 * 60 * 1000)
  requireComparison(Array.isArray(config.sources) && config.sources.length >= 1 && config.sources.length <= 2)
  requireComparison(new Set(config.sources.map((source) => source.calendarId)).size === config.sources.length)
  let roots = 0
  let deletions = 0
  let updates = 0
  for (const [index, source] of config.sources.entries()) {
    requireComparison(typeof source.calendarId === "string" && /^[a-zA-Z0-9_-]+@group\.calendar\.google\.com$/.test(source.calendarId))
    requireComparison(source.accessRole === "owner" || source.accessRole === "reader")
    requireComparison(source.summary === `AtmoShaper scope test ${config.runId} ${index + 1}`)
    requireComparison(typeof source.timezone === "string")
    try { new Intl.DateTimeFormat("en", { timeZone: source.timezone }) } catch { requireComparison(false) }
    requireComparison(Array.isArray(source.eventRoots) && source.eventRoots.length > 0)
    requireComparison(new Set(source.eventRoots).size === source.eventRoots.length)
    requireComparison(source.eventRoots.every((root) => typeof root === "string" && /^[a-z0-9]{5,64}$/.test(root)))
    roots += source.eventRoots.length
    for (const phase of ["before", "after"]) {
      requireComparison(Array.isArray(source[phase]) && source[phase].length <= MAX_ITEMS)
      requireComparison(new Set(source[phase].map((event) => event.id)).size === source[phase].length)
      for (const event of source[phase]) {
        requireComparison(knownFixtureId(source, event.id))
        requireComparison(["BUSY", "FREE", "CANCELLED"].includes(event.status))
        requireComparison(typeof event.allDay === "boolean")
        requireComparison(event.timezone === null || typeof event.timezone === "string")
        requireComparison(Number.isFinite(Date.parse(event.startsAt)) && Number.isFinite(Date.parse(event.endsAt)))
        requireComparison(new Date(event.endsAt) > new Date(event.startsAt))
      }
    }
    requireComparison(source.before.length > 0)
    deletions += source.before.filter((event) => !source.after.some((next) => next.id === event.id)).length
    updates += source.before.filter((event) => source.after.some((next) => next.id === event.id && JSON.stringify(blockShape(next)) !== JSON.stringify(blockShape(event)))).length
  }
  requireComparison(roots <= 6 && deletions > 0 && updates > 0)
  return config
}

/** The downloaded Web registration must belong to the exact approved test target. */
export function validateTestCredential(document, expectedProjectId) {
  const client = document?.web
  requireComparison(client?.project_id === expectedProjectId, "credential_target")
  requireComparison(typeof client.client_id === "string" && client.client_id.endsWith(".apps.googleusercontent.com"), "credential_target")
  requireComparison(typeof client.client_secret === "string" && client.client_secret.length > 0, "credential_target")
  requireComparison(Array.isArray(client.redirect_uris) && client.redirect_uris.length === 1 && client.redirect_uris[0] === CALLBACK_URI, "credential_callback")
  requireComparison(!client.javascript_origins?.length, "credential_callback")
  return client
}

/** Request each measured grant separately; app-created or accumulated access would invalidate the comparison. */
export function comparisonAuthUrl({ clientId, state, arm, accountEmail }) {
  requireComparison(Object.hasOwn(COMPARISON_SCOPES, arm))
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  for (const [key, value] of Object.entries({
    client_id: clientId,
    redirect_uri: CALLBACK_URI,
    response_type: "code",
    access_type: "online",
    prompt: "consent select_account",
    include_granted_scopes: "false",
    scope: ["openid", "email", LIST_SCOPE, COMPARISON_SCOPES[arm]].join(" "),
    login_hint: accountEmail,
    state,
  })) url.searchParams.set(key, value)
  return url.toString()
}

/** Token-response scopes, not callback/request scopes, establish the actual measured grant. */
export function assertComparisonScopes(granted, arm) {
  requireComparison(typeof granted === "string" && Object.hasOwn(COMPARISON_SCOPES, arm), "grant_isolation")
  const actual = new Set(granted.split(/\s+/).filter(Boolean).map((scope) => scope === "email" ? EMAIL_SCOPE : scope))
  const expected = new Set(["openid", EMAIL_SCOPE, LIST_SCOPE, COMPARISON_SCOPES[arm]])
  requireComparison(actual.size === expected.size && [...expected].every((scope) => actual.has(scope)), "grant_isolation")
}

/** Expanded timed occurrences retain a known fixture root and a Google occurrence suffix. */
function knownFixtureId(source, id) {
  return typeof id === "string" && source.eventRoots.some((root) => id === root || new RegExp(`^${root}_[0-9]{8}T[0-9]{6}Z$`).test(id))
}

function blockShape(block) {
  return {
    startsAt: new Date(block.startsAt).toISOString(),
    endsAt: new Date(block.endsAt).toISOString(),
    timezone: block.timezone,
    allDay: block.allDay,
    status: block.status,
  }
}

/** Model only normalized in-memory rows and deletion order; this is not a Prisma transaction test. */
export function reconcileFixturePage(source, items, previous = new Map()) {
  requireComparison(Array.isArray(items) && items.length <= MAX_ITEMS, "fixture_boundary")
  const next = new Map(previous)
  for (const event of items) {
    requireComparison(typeof event?.id === "string" && event.id.length > 0, "missing_event_identity")
    requireComparison(knownFixtureId(source, event.id), "fixture_boundary")
    if (event.status === "cancelled") next.delete(event.id)
  }
  for (const event of items) {
    const block = normalizeGoogleBusyBlock({
      ownerUserId: "scope-test",
      connectionId: "scope-test",
      sourceId: "scope-test",
      providerCalendarId: source.calendarId,
      sourceTimezone: source.timezone,
      event,
    })
    if (block) next.set(event.id, blockShape(block))
    else requireComparison(event.status === "cancelled", "missing_event_timing")
  }
  return next
}

/** Report which fields differ without serializing fixture identities or row values. */
function compareExpected(rows, expected) {
  const fields = ["startsAt", "endsAt", "timezone", "allDay", "status"]
  const fieldMismatches = Object.fromEntries(fields.map((field) => [field, 0]))
  let missing = 0
  for (const event of expected) {
    const actual = rows.get(event.id)
    if (!actual) { missing++; continue }
    const desired = blockShape(event)
    for (const field of fields) if (actual[field] !== desired[field]) fieldMismatches[field]++
  }
  // Google may retain an owner's deleted-event details. The real sync can then
  // retain a CANCELLED row, which the conflict query excludes. Treat that shape
  // and an ID-only tombstone as equivalent removal, without hiding active rows.
  const unexpected = [...rows.entries()].filter(([id, row]) => row.status !== "CANCELLED" && !expected.some((event) => event.id === id)).length
  const cancelledRows = [...rows.values()].filter((row) => row.status === "CANCELLED").length
  return { matches: missing === 0 && unexpected === 0 && Object.values(fieldMismatches).every((count) => count === 0), missing, unexpected, fieldMismatches, cancelledRows }
}

/** Guard even the real adapter's transport: fixed source, GET-only, bounded pages, no redirects. */
export function guardedEventFetch({ fetchImpl, accessToken, source, counters }) {
  const allowedPath = `/calendar/v3/calendars/${encodeURIComponent(source.calendarId)}/events`
  return async (input, init) => {
    const url = new URL(String(input))
    requireComparison(url.origin === "https://www.googleapis.com" && url.pathname === allowedPath, "fixture_boundary")
    requireComparison((init.method ?? "GET") === "GET" && init.headers.Authorization === `Bearer ${accessToken}`, "fixture_boundary")
    requireComparison(++counters.requests <= 16, "request_budget")
    url.searchParams.set("maxResults", "2")
    const response = await fetchImpl(url.toString(), { ...init, redirect: "error" })
    if (response.status === 200) {
      const page = await response.clone().json()
      requireComparison(!page.items || Array.isArray(page.items), "missing_event_fields")
      for (const event of page.items ?? []) {
        requireComparison(typeof event?.id === "string" && event.id.length > 0, "missing_event_identity")
        requireComparison(knownFixtureId(source, event.id), "fixture_boundary")
      }
      counters.pages++
      counters.items += page.items?.length ?? 0
      requireComparison(counters.items <= MAX_ITEMS, "fixture_boundary")
      counters.etags = counters.etags && (page.items ?? []).every((event) => typeof event.etag === "string" && event.etag.length > 0)
      counters.pagination = counters.pagination || Boolean(page.nextPageToken)
    }
    return response
  }
}

/** Run one read-only arm after explicit consent. The caller owns credential IO, consent and revocation. */
export async function probeComparison({ config, accessToken, fetchImpl = fetch, changeFixtures, signal, onProgress = () => {} }) {
  validateComparisonConfig(config)
  const report = { baseline: [], incremental: [], compatible: false, pageSize: 2, proofLimit: "inbound only; no database acceptance" }
  onProgress(report)
  const state = []
  const baselineSignal = AbortSignal.any([signal ?? new AbortController().signal, AbortSignal.timeout(60_000)])
  for (const source of config.sources) {
    const metadata = await fetchImpl(`${API}/users/me/calendarList/${encodeURIComponent(source.calendarId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      redirect: "error",
      signal: AbortSignal.any([baselineSignal, AbortSignal.timeout(8_000)]),
    })
    requireComparison(metadata.status === 200, "fixture_metadata")
    const calendar = await metadata.json()
    requireComparison(calendar.id === source.calendarId && !calendar.primary && calendar.summary === source.summary && calendar.accessRole === source.accessRole && calendar.timeZone === source.timezone, "fixture_metadata")
    const counters = { requests: 0, pages: 0, items: 0, etags: true, pagination: false }
    const adapter = createGoogleCalendarAdapter({ fetchImpl: guardedEventFetch({ fetchImpl, accessToken, source, counters }) })
    const page = await adapter.listEvents({ accessToken, calendarId: source.calendarId, timeMin: config.timeMin, timeMax: config.timeMax, signal: baselineSignal })
    const rows = reconcileFixturePage(source, page.items)
    requireComparison(typeof page.nextSyncToken === "string" && page.nextSyncToken.length > 0, "missing_sync_cursor")
    const comparison = compareExpected(rows, source.before)
    report.baseline.push({ ...comparison, pages: counters.pages, pagination: counters.pagination, etags: counters.etags, cursor: true })
    requireComparison(comparison.matches, "baseline_mismatch")
    state.push({ source, adapter, counters, rows, cursor: page.nextSyncToken })
  }
  await changeFixtures()
  const incrementalSignal = AbortSignal.any([signal ?? new AbortController().signal, AbortSignal.timeout(60_000)])
  for (const item of state) {
    item.counters.requests = 0
    item.counters.pages = 0
    item.counters.items = 0
    item.counters.etags = true
    item.counters.pagination = false
    const page = await item.adapter.listEvents({ accessToken, calendarId: item.source.calendarId, syncToken: item.cursor, signal: incrementalSignal })
    const rows = reconcileFixturePage(item.source, page.items, item.rows)
    requireComparison(typeof page.nextSyncToken === "string" && page.nextSyncToken.length > 0, "missing_sync_cursor")
    const comparison = compareExpected(rows, item.source.after)
    report.incremental.push({ ...comparison, pages: item.counters.pages, pagination: item.counters.pagination, etags: item.counters.etags, cursor: true })
  }
  // Etags are optional in the real normalization contract; report presence without making them an invented prerequisite.
  report.compatible = report.incremental.every((item) => item.matches)
  return report
}

/** Never serialize untrusted error messages, account details, URLs, or provider bodies. */
export function safeComparisonFailure(error) {
  const allowed = new Set(["comparison_input", "production_project", "credential_target", "credential_callback", "grant_isolation", "fixture_boundary", "fixture_metadata", "request_budget", "missing_event_fields", "missing_event_identity", "missing_event_timing", "missing_sync_cursor", "baseline_mismatch", "callback_timeout", "consent_denied", "account_mismatch", "token_exchange", "token_cleanup", "callback_state", "interrupted"])
  if (allowed.has(error?.message)) return error.message
  const status = /^Google Calendar request failed with status (\d{3})\.$/.exec(error?.message ?? "")
  return status ? `provider_status_${status[1]}` : "comparison_failed"
}
