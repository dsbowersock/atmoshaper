import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { request } from "node:http"
import { test } from "node:test"
import {
  CALLBACK_URI, COMPARISON_SCOPES, assertComparisonScopes, comparisonAuthUrl,
  guardedEventFetch, probeComparison, safeComparisonFailure, validateComparisonConfig,
  validateTestCredential,
} from "../scripts/calendar-scope-comparison-core.mjs"
import { consumeConsentCallback, obtainConsentCode, runComparisonArm } from "../scripts/calendar-scope-comparison.mjs"

const PREFIX = "https://www.googleapis.com/auth/"
const IDENTITY = ["openid", `${PREFIX}userinfo.email`, `${PREFIX}calendar.calendarlist.readonly`]
const config = () => ({
  projectId: "calendar-test-example",
  accountEmail: "tester@example.invalid",
  credentialFile: "C:/private/test-client.json",
  runId: "a".repeat(32),
  timeMin: "2026-10-10T00:00:00.000Z",
  timeMax: "2026-10-12T00:00:00.000Z",
  sources: [{
    calendarId: "fixture@group.calendar.google.com",
    accessRole: "owner",
    summary: `AtmoShaper scope test ${"a".repeat(32)} 1`,
    timezone: "UTC",
    eventRoots: ["busy00001", "free00001", "delete001"],
    before: [expected("busy00001"), expected("free00001", "FREE"), expected("delete001")],
    after: [expected("busy00001", "BUSY", "11:00"), expected("free00001", "FREE")],
  }],
})
const client = () => ({ project_id: "calendar-test-example", client_id: "test-client.apps.googleusercontent.com", client_secret: "PRIVATE_SECRET_SENTINEL", redirect_uris: [CALLBACK_URI] })
function expected(id, status = "BUSY", time = "10:00") {
  return { id, startsAt: `2026-10-10T${time}:00.000Z`, endsAt: `2026-10-10T${time === "11:00" ? "12:00" : "11:00"}:00.000Z`, timezone: "UTC", allDay: false, status }
}
function event(id, transparency = "opaque", time = "10:00") {
  const row = expected(id, transparency === "transparent" ? "FREE" : "BUSY", time)
  return { id, etag: "PRIVATE_ETAG_SENTINEL", status: "confirmed", transparency, start: { dateTime: row.startsAt, timeZone: "UTC" }, end: { dateTime: row.endsAt, timeZone: "UTC" }, summary: "SYNTHETIC_EVENT_TEXT_SENTINEL" }
}
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })

/** Raw HTTP preserves the intentionally foreign Host header and never follows redirects. */
function localStatus(url, headers) {
  return new Promise((resolve, reject) => {
    const call = request(url, { headers }, (response) => { response.resume(); resolve(response.statusCode) })
    call.on("error", reject)
    call.end()
  })
}

function provider({ arm = "availability", scope, accountEmail, revokeStatus = 200, omitChanges = false, eventsStatus = 200 } = {}) {
  const calls = []
  const fixture = config().sources[0]
  const fetchImpl = async (input, init) => {
    const url = new URL(String(input))
    calls.push({ url, init })
    assert.equal(init.redirect, "error")
    if (url.pathname === "/token") return json({ access_token: "PRIVATE_TOKEN_SENTINEL", token_type: "Bearer", scope: scope ?? [...IDENTITY, COMPARISON_SCOPES[arm]].join(" ") })
    if (url.pathname === "/revoke") return json({}, revokeStatus)
    if (url.pathname === "/v1/userinfo") return json({ sub: "PRIVATE_ACCOUNT_SENTINEL", email_verified: true, email: accountEmail ?? config().accountEmail })
    if (url.pathname.includes("calendarList")) return json({ id: fixture.calendarId, summary: fixture.summary, timeZone: "UTC", accessRole: "owner" })
    assert.equal(url.searchParams.get("maxResults"), "2")
    assert.equal(url.searchParams.get("singleEvents"), "true")
    assert.equal(url.searchParams.get("showDeleted"), "true")
    if (eventsStatus !== 200) return json({ error: "PROVIDER_PRIVATE_ERROR_SENTINEL" }, eventsStatus)
    if (url.searchParams.has("syncToken")) {
      assert.equal(url.searchParams.has("timeMin"), false)
      assert.equal(url.searchParams.has("timeMax"), false)
      return json({ items: omitChanges ? [] : [event("busy00001", "opaque", "11:00"), { id: "delete001", status: "cancelled" }], nextSyncToken: "PRIVATE_NEXT_CURSOR_SENTINEL" })
    }
    if (url.searchParams.has("pageToken")) return json({ items: [event("delete001")], nextSyncToken: "PRIVATE_CURSOR_SENTINEL" })
    return json({ items: [event("busy00001"), event("free00001", "transparent")], nextPageToken: "PRIVATE_PAGE_SENTINEL" })
  }
  return { fetchImpl, calls }
}

test("default CLI is offline and contains no private configuration or token output", () => {
  const child = spawnSync(process.execPath, ["scripts/calendar-scope-comparison.mjs"], { encoding: "utf8" })
  assert.equal(child.status, 0, child.stderr)
  const plan = JSON.parse(child.stdout)
  assert.equal(plan.status, "prepared_only")
  assert.equal(plan.callback, CALLBACK_URI)
  assert.equal(plan.testPageSize, 2)
  assert.equal(plan.productionPageSize, 2500)
  assert.doesNotMatch(child.stdout, /PRIVATE_|client_secret|access_token/)
})

test("configuration rejects primary sources, oversized fixture sets, production names and missing change coverage", () => {
  assert.equal(validateComparisonConfig(config()).sources.length, 1)
  for (const mutate of [
    (value) => { value.sources[0].calendarId = "primary" },
    (value) => { value.sources[0].eventRoots = ["root00001", "root00002", "root00003", "root00004", "root00005", "root00006", "root00007"] },
    (value) => { value.projectId = "atmoshaper-production" },
    (value) => { value.sources[0].after = value.sources[0].before },
    (value) => { value.timeMax = "2026-12-12T00:00:00.000Z" },
  ]) {
    const value = config(); mutate(value)
    assert.throws(() => validateComparisonConfig(value))
  }
})

test("downloaded credential must match the test project and exactly one approved callback", () => {
  assert.equal(validateTestCredential({ web: client() }, config().projectId).project_id, config().projectId)
  assert.throws(() => validateTestCredential({ web: client() }, "different-test-project"), /credential_target/)
  assert.throws(() => validateTestCredential({ web: { ...client(), redirect_uris: [CALLBACK_URI, "https://www.atmoshaper.com/api/calendar/google/callback"] } }, config().projectId), /credential_callback/)
})

test("authorization disables accumulated access and requests exactly one measured Calendar grant", () => {
  for (const arm of Object.keys(COMPARISON_SCOPES)) {
    const url = new URL(comparisonAuthUrl({ clientId: "test", state: "state", arm, accountEmail: "test@example.invalid" }))
    assert.equal(url.searchParams.get("include_granted_scopes"), "false")
    assert.equal(url.searchParams.get("access_type"), "online")
    assert.equal(url.searchParams.get("redirect_uri"), CALLBACK_URI)
    assert.deepEqual(url.searchParams.get("scope").split(" "), ["openid", "email", `${PREFIX}calendar.calendarlist.readonly`, COMPARISON_SCOPES[arm]])
  }
})

test("actual token scopes reject missing, unrelated, accumulated and app-created grants", () => {
  const desired = [...IDENTITY, COMPARISON_SCOPES.availability].join(" ")
  assertComparisonScopes(desired, "availability")
  assertComparisonScopes(desired.replace(`${PREFIX}userinfo.email`, "email"), "availability")
  for (const grant of [undefined, desired.replace(COMPARISON_SCOPES.availability, ""), `${desired} ${COMPARISON_SCOPES["event-read"]}`, `${desired} ${PREFIX}calendar.app.created`, `${desired} ${PREFIX}drive.readonly`]) {
    assert.throws(() => assertComparisonScopes(grant, "availability"), /grant_isolation/)
  }
})

test("callback state, duplicate parameters and replay are rejected without exposing values", () => {
  const session = { state: "state-sentinel", consumed: false }
  assert.throws(() => consumeConsentCallback(session, new URL(`${CALLBACK_URI}?state=wrong&code=secret`)), /callback_state/)
  assert.equal(session.consumed, false)
  assert.throws(() => consumeConsentCallback(session, new URL(`${CALLBACK_URI}?state=state-sentinel&state=state-sentinel&code=secret`)), /callback_state/)
  assert.throws(() => consumeConsentCallback(session, new URL(`${CALLBACK_URI}?state=state-sentinel&code=first&code=second`)), /callback_state/)
  assert.equal(consumeConsentCallback(session, new URL(`${CALLBACK_URI}?state=state-sentinel&code=accepted`)), "accepted")
  assert.throws(() => consumeConsentCallback(session, new URL(`${CALLBACK_URI}?state=state-sentinel&code=accepted`)), /callback_state/)
  const denied = { state: "valid", consumed: false }
  assert.throws(() => consumeConsentCallback(denied, new URL(`${CALLBACK_URI}?state=valid&error=PRIVATE_PROVIDER_ERROR`)), /consent_denied/)
  assert.equal(denied.consumed, true)
})

test("loopback HTTP listener rejects foreign hosts and bad callbacks, then closes after valid consent", async () => {
  let ready
  const launch = new Promise((resolve) => { ready = resolve })
  const controller = new AbortController()
  const consent = obtainConsentCode({ client: client(), arm: "availability", accountEmail: "test@example.invalid", signal: controller.signal, onReady: ready, listenPort: 0 })
  consent.catch(() => {})
  const launchUrl = await launch
  try {
    assert.equal(await localStatus(launchUrl, { Host: "foreign.invalid" }), 400)
    assert.equal((await fetch(launchUrl, { method: "POST", redirect: "manual" })).status, 400)
    const start = await fetch(launchUrl, { redirect: "manual" })
    assert.equal(start.status, 302)
    assert.equal(start.headers.get("Cache-Control"), "no-store")
    const google = new URL(start.headers.get("Location"))
    assert.equal(google.origin, "https://accounts.google.com")
    const callback = new URL("/oauth/callback", launchUrl)
    callback.searchParams.set("state", "wrong")
    callback.searchParams.set("code", "PRIVATE_CODE_SENTINEL")
    assert.equal((await fetch(callback, { redirect: "manual" })).status, 400)
    callback.searchParams.set("state", google.searchParams.get("state"))
    const response = await fetch(callback, { redirect: "manual" })
    assert.equal(response.status, 200)
    assert.doesNotMatch(await response.text(), /PRIVATE_CODE_SENTINEL/)
    assert.equal(await consent, "PRIVATE_CODE_SENTINEL")
    await assert.rejects(() => fetch(launchUrl, { redirect: "manual" }))
  } finally {
    controller.abort()
    await consent.catch(() => {})
  }
})

test("interrupting the local consent wait closes its owned listener", async () => {
  let ready
  const launch = new Promise((resolve) => { ready = resolve })
  const controller = new AbortController()
  const consent = obtainConsentCode({ client: client(), arm: "availability", accountEmail: "test@example.invalid", signal: controller.signal, onReady: ready, listenPort: 0 })
  consent.catch(() => {})
  const launchUrl = await launch
  controller.abort()
  await assert.rejects(() => consent, /interrupted/)
  await assert.rejects(() => fetch(launchUrl, { redirect: "manual" }))
})

test("transport refuses writes and other calendars before dispatch", async () => {
  let calls = 0
  const fixture = config().sources[0]
  const guarded = guardedEventFetch({ fetchImpl: async () => { calls++; return json({}) }, accessToken: "token", source: fixture, counters: { requests: 0 } })
  await assert.rejects(() => guarded("https://www.googleapis.com/calendar/v3/calendars/primary/events", { headers: { Authorization: "Bearer token" } }), /fixture_boundary/)
  await assert.rejects(() => guarded(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(fixture.calendarId)}/events`, { method: "POST", headers: { Authorization: "Bearer token" } }), /fixture_boundary/)
  assert.equal(calls, 0)
})

test("real adapter paginates and normalization reconciles updated, free and ID-only cancellation fixtures", async () => {
  const transport = provider()
  let changed = false
  const result = await probeComparison({ config: config(), accessToken: "PRIVATE_TOKEN_SENTINEL", fetchImpl: transport.fetchImpl, changeFixtures: async () => { changed = true } })
  assert.equal(changed, true)
  assert.equal(result.baseline[0].pages, 2)
  assert.equal(result.baseline[0].pagination, true)
  assert.equal(result.incremental[0].matches, true)
  assert.equal(result.incremental[0].etags, false, "ID-only cancellation does not require an etag")
  assert.equal(result.compatible, true)
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE_|SYNTHETIC_EVENT_TEXT|fixture@|busy00001|delete001/)
})

test("a successful HTTP delta which omits changes detects stale rows and timing mismatches", async () => {
  const transport = provider({ omitChanges: true })
  const result = await probeComparison({ config: config(), accessToken: "token", fetchImpl: transport.fetchImpl, changeFixtures: async () => {} })
  assert.equal(result.compatible, false)
  assert.equal(result.incremental[0].unexpected, 1)
  assert.equal(result.incremental[0].fieldMismatches.startsAt, 1)
})

test("owner cancellation details and ID-only tombstones both remove active conflicts", async () => {
  for (const status of ["cancelled", "confirmed"]) {
    const base = provider()
    const fetchImpl = async (input, init) => {
      if (new URL(String(input)).searchParams.has("syncToken")) {
        return json({ items: [event("busy00001", "opaque", "11:00"), { ...event("delete001"), status }], nextSyncToken: "cursor" })
      }
      return base.fetchImpl(input, init)
    }
    const result = await probeComparison({ config: config(), accessToken: "token", fetchImpl, changeFixtures: async () => {} })
    assert.equal(result.compatible, status === "cancelled")
    assert.equal(result.incremental[0].cancelledRows, status === "cancelled" ? 1 : 0)
    assert.equal(result.incremental[0].unexpected, status === "cancelled" ? 0 : 1)
  }
})

test("all-day and expanded recurrence fixtures use real normalization across paged baseline and delta", async () => {
  const value = config()
  const source = value.sources[0]
  source.eventRoots.push("allday001", "repeat001")
  const allDay = { id: "allday001", startsAt: "2026-10-10T00:00:00.000Z", endsAt: "2026-10-11T00:00:00.000Z", timezone: "UTC", allDay: true, status: "BUSY" }
  const recurring = expected("repeat001_20261010T100000Z")
  source.before.push(allDay, recurring)
  source.after.push(allDay, recurring)
  const base = provider()
  const fetchImpl = async (input, init) => {
    const url = new URL(String(input))
    if (url.searchParams.get("pageToken") === "PRIVATE_PAGE_SENTINEL") return json({ items: [event("delete001"), { id: "allday001", etag: "etag", start: { date: "2026-10-10" }, end: { date: "2026-10-11" } }], nextPageToken: "last" })
    if (url.searchParams.get("pageToken") === "last") return json({ items: [event(recurring.id)], nextSyncToken: "cursor" })
    return base.fetchImpl(input, init)
  }
  const result = await probeComparison({ config: value, accessToken: "token", fetchImpl, changeFixtures: async () => {} })
  assert.equal(result.baseline[0].pages, 3)
  assert.equal(result.compatible, true)
})

test("an explicitly shared reader fixture is accepted without enumerating unrelated calendars", async () => {
  const value = config()
  const source = structuredClone(value.sources[0])
  source.calendarId = "sharedfixture@group.calendar.google.com"
  source.summary = `AtmoShaper scope test ${value.runId} 2`
  source.accessRole = "reader"
  value.sources.push(source)
  const base = provider()
  const fetchImpl = async (input, init) => {
    if (String(input).includes("calendarList") && String(input).includes("sharedfixture")) return json({ id: source.calendarId, summary: source.summary, timeZone: "UTC", accessRole: "reader" })
    return base.fetchImpl(input, init)
  }
  const result = await probeComparison({ config: value, accessToken: "token", fetchImpl, changeFixtures: async () => {} })
  assert.equal(result.baseline.length, 2)
  assert.equal(result.compatible, true)
  assert.equal(base.calls.some(({ url }) => url.pathname === "/calendar/v3/users/me/calendarList"), false)
})

test("primary or changed fixture metadata stops before event reads", async () => {
  for (const drift of [{ primary: true }, { summary: "unrelated" }, { accessRole: "writer" }]) {
    let calls = 0
    const source = config().sources[0]
    await assert.rejects(() => probeComparison({ config: config(), accessToken: "token", fetchImpl: async () => { calls++; return json({ id: source.calendarId, summary: source.summary, timeZone: "UTC", accessRole: "owner", ...drift }) }, changeFixtures: async () => assert.fail("no mutation prompt") }), /fixture_metadata/)
    assert.equal(calls, 1)
  }
})

test("missing event identity/timing is distinguishable and unknown fixture identities stop paging", async () => {
  for (const [fixture, reason] of [
    [{ start: { dateTime: "2026-10-10T10:00:00Z" } }, "missing_event_identity"],
    [{ id: "busy00001" }, "missing_event_timing"],
    [event("unknown001"), "fixture_boundary"],
  ]) {
    const base = provider()
    let reads = 0
    const fetchImpl = async (input, init) => {
      if (String(input).includes("/events")) { reads++; return json({ items: [fixture], nextSyncToken: "cursor" }) }
      return base.fetchImpl(input, init)
    }
    const result = await runComparisonArm({ config: config(), client: client(), arm: "availability", code: "code", fetchImpl, changeFixtures: async () => assert.fail("must stop before fixture changes") })
    assert.equal(result.failure, reason)
    assert.equal(reads, 1)
    assert.equal(result.tokenRevoked, true)
  }
})

test("repeated provider page cursors stop under the transport request ceiling", async () => {
  const base = provider()
  let reads = 0
  const fetchImpl = async (input, init) => {
    if (String(input).includes("/events")) { reads++; return json({ items: [], nextPageToken: "repeated" }) }
    return base.fetchImpl(input, init)
  }
  await assert.rejects(() => probeComparison({ config: config(), accessToken: "token", fetchImpl, changeFixtures: async () => assert.fail("no partial baseline") }), /request_budget/)
  assert.equal(reads, 16)
})

test("failed scope isolation revokes the issued token before any account/calendar read", async () => {
  const transport = provider({ scope: [...IDENTITY, COMPARISON_SCOPES.availability, COMPARISON_SCOPES["event-read"]].join(" ") })
  const result = await runComparisonArm({ config: config(), client: client(), arm: "availability", code: "code", fetchImpl: transport.fetchImpl, changeFixtures: async () => {} })
  assert.equal(result.failure, "grant_isolation")
  assert.equal(result.tokenRevoked, true)
  assert.deepEqual(transport.calls.map(({ url }) => url.pathname), ["/token", "/revoke"])
})

test("wrong Google account stops before synthetic calendar access and still revokes", async () => {
  const transport = provider({ accountEmail: "wrong@example.invalid" })
  const result = await runComparisonArm({ config: config(), client: client(), arm: "availability", code: "code", fetchImpl: transport.fetchImpl, changeFixtures: async () => {} })
  assert.equal(result.failure, "account_mismatch")
  assert.equal(result.tokenRevoked, true)
  assert.equal(transport.calls.some(({ url }) => url.pathname.includes("calendarList")), false)
})

test("provider denial is sanitized and cleanup failure prevents a passing receipt", async () => {
  for (const revokeStatus of [200, 503]) {
    const transport = provider({ eventsStatus: 403, revokeStatus })
    const result = await runComparisonArm({ config: config(), client: client(), arm: "availability", code: "code", fetchImpl: transport.fetchImpl, changeFixtures: async () => { assert.fail("must not ask for mutations after denied baseline") } })
    assert.equal(result.status, "inconclusive")
    assert.equal(result.failure, revokeStatus === 200 ? "provider_status_403" : "token_cleanup")
    assert.equal(result.grantCleanupRequired, revokeStatus !== 200)
    assert.doesNotMatch(JSON.stringify(result), /PRIVATE_|PROVIDER_PRIVATE_ERROR|example.invalid|fixture@/)
  }
})

test("interrupted operator phase revokes tokens and does not perform incremental reads", async () => {
  const transport = provider()
  const result = await runComparisonArm({ config: config(), client: client(), arm: "availability", code: "code", fetchImpl: transport.fetchImpl, changeFixtures: async () => { throw new Error("interrupted") } })
  assert.equal(result.failure, "interrupted")
  assert.equal(result.tokenRevoked, true)
  assert.equal(transport.calls.some(({ url }) => url.searchParams.has("syncToken")), false)
})

test("passing arm is explicitly not full provider minimum-access proof or fixture cleanup", async () => {
  const transport = provider()
  const result = await runComparisonArm({ config: config(), client: client(), arm: "availability", code: "code", fetchImpl: transport.fetchImpl, changeFixtures: async () => {} })
  assert.equal(result.status, "passed")
  assert.equal(result.tokenRevoked, true)
  assert.equal(result.fixturesRemoved, false)
  assert.equal(result.providerMinimumAccessProven, false)
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE_|SYNTHETIC_EVENT_TEXT|test-client|fixture@|busy00001/)
})

test("private network exceptions are replaced with a fixed failure category", () => {
  assert.equal(safeComparisonFailure(new Error("PRIVATE_TOKEN_SENTINEL account@example.invalid")), "comparison_failed")
})
