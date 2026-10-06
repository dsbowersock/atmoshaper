import assert from "node:assert/strict"
import { test } from "node:test"
import { bindPreparedFixtures, validateFixturePreparation } from "../scripts/calendar-scope-comparison-fixtures.mjs"
import { CALLBACK_URI, COMPARISON_SCOPES } from "../scripts/calendar-scope-comparison-core.mjs"
import { runComparisonArm } from "../scripts/calendar-scope-comparison.mjs"

const runId = "a".repeat(32)
const kinds = ["timed", "allDay", "recurring"]
const config = () => ({
  projectId: "calendar-test-example", accountEmail: "tester@example.invalid",
  credentialFile: "C:/private/test.json", runId, ownerFixturesReady: true,
  timeMin: "2026-10-10T00:00:00Z", timeMax: "2026-10-13T00:00:00Z",
  sources: ["owner", "reader"].map((accessRole, index) => ({
    calendarId: `fixture${index}@group.calendar.google.com`, accessRole,
    summary: `AtmoShaper scope test ${runId} ${index + 1}`, timezone: "UTC",
    fixtures: kinds.map((kind, kindIndex) => ({
      kind, title: index === 0 ? ["Test timed", "Test all-day", "Test recurring"][kindIndex] : `AtmoShaper synthetic ${["timed", "all-day", "recurring"][kindIndex]} ${runId}`,
      ...(index === 1 ? { eventId: `${["timed", "allday", "recurring"][kindIndex]}0000${index}` } : {}),
    })),
  })),
})
const client = () => ({ project_id: "calendar-test-example", client_id: "fake.apps.googleusercontent.com", client_secret: "PRIVATE_SECRET", redirect_uris: [CALLBACK_URI] })
const json = (value, status = 200) => new Response(JSON.stringify(value), { status })

function events(source, index) {
  const roots = ["timed", "allday", "recurring"].map((kind) => `${kind}0000${index}`)
  const timed = (id, kind, day, start, end) => ({
    id, summary: source.fixtures[kind].title, status: "confirmed", etag: "PRIVATE_ETAG",
    transparency: kind === 2 ? "transparent" : "opaque",
    start: { dateTime: `2026-10-${day}T${start}:00Z`, timeZone: "UTC" },
    end: { dateTime: `2026-10-${day}T${end}:00Z`, timeZone: "UTC" },
  })
  const recur = (day) => ({ ...timed(`${roots[2]}_202610${day}T140000Z`, 2, day, "14:00", "14:30"), recurringEventId: roots[2], originalStartTime: { dateTime: `2026-10-${day}T14:00:00Z` } })
  return {
    roots,
    items: [timed(roots[0], 0, "10", "10:00", "11:00"), { id: roots[1], summary: source.fixtures[1].title, status: "confirmed", etag: "PRIVATE_ETAG", start: { date: "2026-10-11" }, end: { date: "2026-10-12" }, transparency: "opaque" }, recur("10"), recur("11")],
    master: { ...timed(roots[2], 2, "10", "14:00", "14:30"), recurrence: ["RRULE:FREQ=DAILY;COUNT=2"] },
    delta: [timed(roots[0], 0, "10", "10:30", "11:30"), { id: roots[1], status: "cancelled" }],
  }
}

function provider({ mutateItem = () => {}, mutateMetadata = () => {}, mutateMaster = () => {}, mutateDelta = () => {}, baselineExtra = [], scopeExtra = "", accountEmail, repeatPage = false } = {}) {
  const calls = []
  const value = config()
  const fetchImpl = async (input, init) => {
    const url = new URL(String(input))
    calls.push(url)
    assert.equal(init.redirect, "error")
    if (url.pathname === "/token") return json({ access_token: "PRIVATE_TOKEN", token_type: "Bearer", scope: `openid email https://www.googleapis.com/auth/calendar.calendarlist.readonly ${COMPARISON_SCOPES["event-read"]}${scopeExtra}` })
    if (url.pathname === "/revoke") return json({})
    if (url.pathname === "/v1/userinfo") return json({ sub: "PRIVATE_SUBJECT", email_verified: true, email: accountEmail ?? value.accountEmail })
    assert.equal(init.method ?? "GET", "GET")
    const decoded = decodeURIComponent(url.pathname)
    const index = decoded.includes("fixture0@") ? 0 : decoded.includes("fixture1@") ? 1 : -1
    assert.notEqual(index, -1, "never read another calendar or inventory")
    const source = value.sources[index]
    const fixture = events(source, index)
    if (decoded.includes("calendarList")) {
      const metadata = { id: source.calendarId, summary: source.summary, timeZone: "UTC", accessRole: source.accessRole }
      mutateMetadata(metadata, index)
      return json(metadata)
    }
    if (!decoded.endsWith("/events")) {
      assert.equal(decoded.split("/").at(-1), fixture.roots[2])
      mutateMaster(fixture.master)
      return json(fixture.master)
    }
    assert.equal(url.searchParams.get("maxResults"), "2")
    assert.equal(url.searchParams.get("singleEvents"), "true")
    if (url.searchParams.has("syncToken")) {
      fixture.delta[0].transparency = "transparent"
      fixture.delta.forEach(mutateDelta)
      return json({ items: fixture.delta, nextSyncToken: "PRIVATE_DELTA_CURSOR" })
    }
    assert.equal(url.searchParams.get("timeMin"), value.timeMin)
    assert.equal(url.searchParams.get("timeMax"), value.timeMax)
    const requestedPage = Number(url.searchParams.get("pageToken") ?? 0)
    const pageIndex = repeatPage ? Math.min(requestedPage, 1) : requestedPage
    const baseline = [...fixture.items, ...(index === 0 ? baselineExtra : [])]
    const items = baseline.slice(pageIndex * 2, pageIndex * 2 + 2)
    items.forEach((item) => mutateItem(item, index))
    return json({ items, ...(pageIndex * 2 + 2 < baseline.length || repeatPage ? { nextPageToken: String(pageIndex + 1) } : { nextSyncToken: "PRIVATE_CURSOR" }) })
  }
  return { fetchImpl, calls }
}

test("preparation rejects unapproved calendars, dates, roles and missing execution receipt before consent", () => {
  for (const mutate of [
    (value) => { value.ownerFixturesReady = false },
    (value) => { value.sources[0].calendarId = "primary" },
    (value) => { value.sources[1].accessRole = "writer" },
    (value) => { value.sources[0].summary = "Real appointments" },
    (value) => { value.sources[0].timezone = "America/New_York" },
    (value) => { value.sources[1].retiredInstanceIds = ["recurring00001_20261010T180000Z"] },
    (value) => { value.sources[0].retiredInstanceIds = ["recurring00000_20261010T140000Z"] },
    (value) => { value.sources[0].retiredInstanceIds = ["recurring00000_20261010T180000Z", "recurring00000_20261010T180000Z"] },
    (value) => { value.timeMax = "2026-10-14T00:00:00Z" },
    (value) => { value.sources[0].fixtures[0].title = "A real event" },
    (value) => { value.sources[1].fixtures[0].eventId = undefined },
  ]) {
    const value = config(); mutate(value)
    assert.throws(() => validateFixturePreparation(value))
  }
})

test("binding uses only exact metadata targets and independently scheduled four entries per source", async () => {
  const transport = provider()
  const bound = await bindPreparedFixtures({ config: config(), accessToken: "fake", fetchImpl: transport.fetchImpl })
  assert.deepEqual(transport.calls.slice(0, 2).map((url) => url.pathname.includes("calendarList")), [true, true])
  assert.equal(bound.sources.length, 2)
  assert.deepEqual(bound.sources[0].eventRoots, events(config().sources[0], 0).roots)
  assert.equal(bound.sources[0].before.length, 4)
  assert.equal(bound.sources[0].after.length, 3)
  assert.equal(bound.sources[0].after[0].startsAt, "2026-10-10T10:30:00.000Z")
  assert.equal(bound.sources[0].after[0].status, "FREE")
  assert.equal(JSON.stringify(bound).includes("PRIVATE_"), false)
  assert.equal(JSON.stringify(bound).includes("Test timed"), false)
})

test("missing or changed calendar metadata prevents all event reads", async () => {
  const transport = provider({ mutateMetadata: (metadata, index) => { if (index === 1) metadata.accessRole = "writer" } })
  const progress = []
  await assert.rejects(() => bindPreparedFixtures({ config: config(), accessToken: "fake", fetchImpl: transport.fetchImpl, onProgress: (value) => progress.push(value) }), /fixture_metadata/)
  assert.equal(transport.calls.some((url) => url.pathname.includes("/events")), false)
  assert.equal(progress.at(-1).checks.accessRole, false)
  assert.equal(progress.at(-1).checks.name, true)
  assert.doesNotMatch(JSON.stringify(progress), /fixture1@|AtmoShaper scope test|writer/)
})

test("metadata HTTP failures report only a status and allowlisted reason, never raw provider content", async () => {
  for (const reason of ["accessNotConfigured", "PRIVATE_PROVIDER_MESSAGE"]) {
    const progress = []
    await assert.rejects(() => bindPreparedFixtures({ config: config(), accessToken: "fake", fetchImpl: async () => json({ error: { errors: [{ reason }], message: "PRIVATE_PROJECT_PATH" } }, 403), onProgress: (value) => progress.push(value) }), /fixture_metadata/)
    assert.equal(progress.at(-1).httpStatus, 403)
    assert.equal(progress.at(-1).providerReason, reason === "accessNotConfigured" ? reason : "other")
    assert.doesNotMatch(JSON.stringify(progress), /PRIVATE_/)
  }
})

test("binding diagnostics identify rejected predicates and revoke without exposing provider values", async () => {
  const value = config()
  const root = events(value.sources[0], 0).roots[2]
  value.sources[0].retiredInstanceIds = [`${root}_20261010T180000Z`]
  for (const [options, stage, flag] of [
    [{ mutateItem: (item) => { item.summary = "PRIVATE_TITLE" } }, "active_title", "approvedTitle"],
    [{ mutateItem: (item) => { item.attendees = [{ email: "PRIVATE_EMAIL" }] } }, "active_fields", "noGuests"],
    [{ baselineExtra: [{ id: value.sources[0].retiredInstanceIds[0], status: "cancelled", summary: "PRIVATE_RETIRED_TITLE" }] }, "retired_fields", "title"],
    [{ mutateMaster: (master) => { master.recurrence = ["RRULE:FREQ=DAILY;COUNT=3;BYDAY=PRIVATE_RULE"] } }, "recurrence_bound", "countTwo"],
    [{ mutateMaster: (master) => { master.summary = "PRIVATE_MASTER_TITLE" } }, "master_fields", "title"],
    [{ mutateItem: (item) => { if (item.recurringEventId) item.originalStartTime = {} } }, "occurrence_fields", "originalStart"],
  ]) {
    const transport = provider(options)
    const progress = []
    let changed = false
    const report = await runComparisonArm({ config: value, client: client(), arm: "event-read", code: "fake", prepareFixtures: true, fetchImpl: transport.fetchImpl, onBindingProgress: (item) => progress.push(item), changeFixtures: async () => { changed = true } })
    assert.equal(report.status, "inconclusive")
    assert.equal(report.failure, "fixture_boundary")
    assert.equal(report.tokenRevoked, true)
    assert.equal(changed, false)
    assert.equal(report.preparation.checkStage, stage)
    assert.equal(report.preparation.checks[flag], false)
    assert.equal(report.preparation.source, 1)
    assert.doesNotMatch(JSON.stringify({ progress, report }), /PRIVATE_|fixture0@|recurring00000|AtmoShaper scope test|tester@example/)
  }
})

test("verified UTC aliases preserve literal normalization fields without accepting another zone", async () => {
  const transport = provider({ mutateMetadata: (metadata) => { metadata.timeZone = "Etc/UTC" }, mutateItem: (item) => { if (item.start.dateTime) item.start.timeZone = item.end.timeZone = "Etc/GMT" } })
  const bound = await bindPreparedFixtures({ config: config(), accessToken: "fake", fetchImpl: transport.fetchImpl })
  assert.equal(bound.sources[0].timezone, "Etc/UTC")
  assert.equal(bound.sources[0].before[0].timezone, "Etc/GMT")
  assert.equal(bound.sources[0].before[1].timezone, "Etc/UTC")
  assert.equal(bound.sources[0].after[0].timezone, "Etc/GMT")
  const wrong = provider({ mutateMetadata: (metadata) => { metadata.timeZone = "America/New_York" } })
  await assert.rejects(() => bindPreparedFixtures({ config: config(), accessToken: "fake", fetchImpl: wrong.fetchImpl }), /fixture_metadata/)
})

test("Iceland picker zones preserve independent UTC instants and all-day boundaries through comparison", async () => {
  for (const zone of ["Atlantic/Reykjavik", "Africa/Abidjan", "Iceland"]) {
    const format = (timeZone) => new Intl.DateTimeFormat("en", { timeZone, dateStyle: "full", timeStyle: "long" })
    for (const date of ["2026-01-10T00:00:00Z", "2026-07-10T00:00:00Z", "2026-10-11T00:00:00Z"]) {
      // Compare clock/date parts, excluding the display name of an equivalent zone.
      const parts = (timeZone) => format(timeZone).formatToParts(new Date(date)).filter((part) => part.type !== "timeZoneName")
      assert.deepEqual(parts(zone), parts("UTC"))
    }
    const setEventZone = (event) => { if (event.start?.dateTime) event.start.timeZone = event.end.timeZone = zone }
    const transport = provider({ mutateMetadata: (metadata) => { metadata.timeZone = zone }, mutateItem: setEventZone, mutateMaster: setEventZone, mutateDelta: setEventZone })
    let bound
    const report = await runComparisonArm({ config: config(), client: client(), arm: "event-read", code: "fake", prepareFixtures: true, fetchImpl: transport.fetchImpl, onFixturesBound: async (value) => { bound = value }, changeFixtures: async () => {} })
    assert.equal(report.status, "passed")
    assert.equal(report.tokenRevoked, true)
    assert.equal(bound.sources[0].timezone, zone)
    assert.equal(bound.sources[0].before[1].startsAt, "2026-10-11T00:00:00.000Z")
    assert.equal(bound.sources[0].before[1].endsAt, "2026-10-12T00:00:00.000Z")
    assert.equal(bound.sources[0].before[1].timezone, zone)
  }
  const wrong = provider({ mutateMetadata: (metadata) => { metadata.timeZone = "Europe/London" } })
  await assert.rejects(() => bindPreparedFixtures({ config: config(), accessToken: "fake", fetchImpl: wrong.fetchImpl }), /fixture_metadata/)
  assert.equal(wrong.calls.some((url) => url.pathname.includes("/events")), false)
})

test("only recorded retired occurrences of the bound recurring fixture may be inactive during baseline", async () => {
  const value = config()
  const root = events(value.sources[0], 0).roots[2]
  value.sources[0].retiredInstanceIds = [10, 11].map((day) => `${root}_202610${day}T180000Z`)
  const extra = value.sources[0].retiredInstanceIds.map((id) => ({ id, status: "cancelled" }))
  const transport = provider({ baselineExtra: extra })
  const report = await runComparisonArm({ config: value, client: client(), arm: "event-read", code: "fake", prepareFixtures: true, fetchImpl: transport.fetchImpl, onFixturesBound: async () => {}, changeFixtures: async () => {} })
  assert.equal(report.status, "passed")
  assert.equal(report.tokenRevoked, true)
  assert.equal(report.preparation.phase, "bound")
  for (const invalid of [
    [{ id: `${root}_20261012T180000Z`, status: "cancelled" }],
    [{ id: extra[0].id, status: "confirmed" }],
    [{ ...extra[0], recurringEventId: "differentroot" }],
    [{ ...extra[0], summary: "An unrelated event" }],
    [extra[0], extra[0]],
  ]) {
    const bad = provider({ baselineExtra: invalid })
    await assert.rejects(() => bindPreparedFixtures({ config: value, accessToken: "fake", fetchImpl: bad.fetchImpl }))
  }
  const wrongRoot = config()
  wrongRoot.sources[0].retiredInstanceIds = ["differentroot_20261010T180000Z"]
  await assert.rejects(() => bindPreparedFixtures({ config: wrongRoot, accessToken: "fake", fetchImpl: provider().fetchImpl }), /fixture_boundary/)
})

test("unexpected names, IDs, invitations or timing cannot become their own passing expectations", async () => {
  for (const mutateItem of [
    (item) => { item.summary = "Unexpected appointment" },
    (item) => { item.attendees = [{ email: "private@example.invalid" }] },
    (item) => { item.reminders = { useDefault: true } },
    (item) => { item.reminders = { useDefault: false, overrides: [{ method: "email", minutes: 10 }] } },
    (item) => { if (item.start.dateTime) item.start.dateTime = "2026-10-10T09:00:00Z" },
    (item, index) => { if (index === 1 && !item.recurringEventId) item.id = "different0001" },
  ]) {
    const transport = provider({ mutateItem })
    await assert.rejects(() => bindPreparedFixtures({ config: config(), accessToken: "fake", fetchImpl: transport.fetchImpl }))
  }
})

test("a changed recurring root, occurrence identity or unbounded master fails binding", async () => {
  for (const options of [
    { mutateItem: (item) => { if (item.recurringEventId) item.id = "icaluid-is-not-an-event-id" } },
    { mutateItem: (item) => { if (item.recurringEventId) item.originalStartTime.dateTime = "2026-10-12T14:00:00Z" } },
    { mutateMaster: (master) => { master.recurrence = ["RRULE:FREQ=DAILY"] } },
    { mutateMaster: (master) => { master.recurrence = ["RRULE:FREQ=DAILY;COUNT=3"] } },
  ]) {
    const transport = provider(options)
    await assert.rejects(() => bindPreparedFixtures({ config: config(), accessToken: "fake", fetchImpl: transport.fetchImpl }), /fixture_boundary/)
  }
})

test("duplicate pages stop immediately instead of reading beyond the fixture boundary", async () => {
  const transport = provider({ repeatPage: true })
  await assert.rejects(() => bindPreparedFixtures({ config: config(), accessToken: "fake", fetchImpl: transport.fetchImpl }), /baseline_mismatch/)
  assert.equal(transport.calls.filter((url) => url.pathname.endsWith("/events")).length, 3)
})

test("identity binding and strict event-read comparison share one verified grant and revoke it", async () => {
  const transport = provider()
  let bound
  let changed = false
  const report = await runComparisonArm({ config: config(), client: client(), arm: "event-read", code: "fake", prepareFixtures: true, fetchImpl: transport.fetchImpl, onFixturesBound: async (value) => { bound = value }, changeFixtures: async () => { changed = true } })
  assert.equal(bound.sources.length, 2)
  assert.equal(changed, true)
  assert.equal(report.status, "passed")
  assert.equal(report.tokenRevoked, true)
  assert.equal(transport.calls.filter((url) => url.pathname === "/token").length, 1)
  assert.equal(transport.calls.filter((url) => url.pathname === "/revoke").length, 1)
  assert.doesNotMatch(JSON.stringify(report), /PRIVATE_|fixture0|Test timed|timed0000/)
})

test("scope/account drift cannot reach identity binding and the issued test token is revoked", async () => {
  for (const options of [{ accountEmail: "other@example.invalid" }, { scopeExtra: ` ${COMPARISON_SCOPES.availability}` }]) {
    const transport = provider(options)
    const report = await runComparisonArm({ config: config(), client: client(), arm: "event-read", code: "fake", prepareFixtures: true, fetchImpl: transport.fetchImpl })
    assert.equal(report.status, "inconclusive")
    assert.equal(report.tokenRevoked, true)
    assert.equal(transport.calls.some((url) => url.pathname.includes("calendarList")), false)
  }
})

test("failed fixture binding or private-output write still revokes and never requests fixture changes", async () => {
  for (const mode of ["binding", "output"]) {
    const transport = provider(mode === "binding" ? { mutateMaster: (master) => { master.recurrence = [] } } : {})
    let changed = false
    const report = await runComparisonArm({ config: config(), client: client(), arm: "event-read", code: "fake", prepareFixtures: true, fetchImpl: transport.fetchImpl, onFixturesBound: async () => { throw new Error("PRIVATE_PATH_WRITE_ERROR") }, changeFixtures: async () => { changed = true } })
    assert.equal(report.status, "inconclusive")
    assert.equal(report.tokenRevoked, true)
    assert.equal(changed, false)
    assert.doesNotMatch(JSON.stringify(report), /PRIVATE_/)
  }
})
