import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { describe, it } from "node:test"
import { createGoogleCalendarAdapter, GoogleCalendarConnectionError } from "../lib/google-calendar-adapter.ts"
import * as constants from "../lib/calendar-sync-constants.ts"
import * as normalization from "../lib/calendar-sync-normalization.ts"
import { createCompiledModuleLoader } from "./helpers/compiled-module.mjs"

const load = createCompiledModuleLoader(import.meta.url)
const serviceSource = await readFile(new URL("../lib/calendar-sync-service.ts", import.meta.url), "utf8")
const routeSource = await readFile(new URL("../app/api/calendar/google/callback/route.ts", import.meta.url), "utf8")
const actionsSource = await readFile(new URL("../app/calendar/sync/actions.ts", import.meta.url), "utf8")
const marker = constants.ATMOSHAPER_GOOGLE_CALENDAR_DESCRIPTION
const scopes = constants.GOOGLE_CALENDAR_SCOPES.join(" ")
const managed = (overrides = {}) => ({ id: "atmo-calendar", summary: "AtmoShaper", description: marker, accessRole: "owner", ...overrides })
const legacy = { id: "legacy-calendar", summary: "MassageLab", accessRole: "owner" }
const token = { access_token: "fixture-access", refresh_token: "fixture-refresh", expires_in: 3600, scope: scopes, googleUserId: "subject-a" }

/** Minimal nullable equality/NOT/OR semantics for the real disconnect action's atomic delete. */
function matchesConnectionWhere(row, where) {
  return Object.entries(where).every(([key, value]) => {
    if (key === "OR") return value.some((branch) => matchesConnectionWhere(row, branch))
    if (value instanceof Date) return row[key] instanceof Date && row[key].getTime() === value.getTime()
    if (value && typeof value === "object" && Object.hasOwn(value, "not")) return row[key] != null && row[key] !== value.not
    if (value === null) return row[key] == null
    return row[key] === value
  })
}

describe("Google disconnect creation-intent boundary", () => {
  for (const [label, overrides, removable] of [
    ["pending creation", { status: "ERROR", statusReason: constants.GOOGLE_CALENDAR_CREATION_PENDING_REASON }, false],
    ["active connection with a null reason", { status: "ACTIVE", statusReason: null }, true],
    ["resolved historical error", { status: "ERROR", statusReason: "OLD_ERROR" }, true],
    ["another user's connection", { userId: "user-b", statusReason: null }, false],
    ["another provider's connection", { provider: "OTHER", statusReason: null }, false],
  ]) {
    it(`${removable ? "disconnects" : "preserves"} ${label}`, async () => {
      const row = { id: "connection-a", userId: "user-a", provider: "GOOGLE", ...overrides }
      const rows = [row]
      const paths = []
      const redirects = []
      const actions = load(actionsSource, "app/calendar/sync/actions.isolation.test.ts", {
        "next/cache": { revalidatePath: (path) => paths.push(path) },
        "next/navigation": { redirect: (path) => redirects.push(path) },
        "@/auth": { getCurrentSession: async () => ({ user: { id: "user-a" } }) },
        "@/lib/calendar-sync-access": {},
        "@/lib/calendar-sync-constants": constants,
        "@/lib/calendar-sync-service": {},
        "@/lib/prisma": { prisma: { calendarConnection: { deleteMany: async ({ where }) => {
          const index = rows.findIndex((item) => matchesConnectionWhere(item, where))
          if (index < 0) return { count: 0 }
          rows.splice(index, 1)
          return { count: 1 }
        } } } },
      })
      const form = new FormData()
      form.set("connectionId", row.id)
      if (removable) {
        await actions.disconnectGoogleCalendarAction(form)
        assert.deepEqual(rows, [])
        assert.deepEqual(paths, ["/calendar/sync", "/calendar"])
        assert.deepEqual(redirects, ["/calendar/sync?google=disconnected"])
      } else {
        await assert.rejects(() => actions.disconnectGoogleCalendarAction(form), /requires reconciliation/)
        assert.deepEqual(rows, [row])
        assert.deepEqual(paths, [])
        assert.deepEqual(redirects, [])
      }
    })
  }
})

/** Fake Google transport only; discovery and validation use the real adapter. */
function googleFixture({ calendars = [], subject = "subject-a", pages, eventPages, metadataStatus = 200, metadata, failCreation = false, creationVisible = true, refreshScope = scopes, beforeResponse = () => {} } = {}) {
  const inventory = [...calendars]
  const calls = []
  const adapter = createGoogleCalendarAdapter({ fetchImpl: async (input, init = {}) => {
    init.signal?.throwIfAborted()
    const url = new URL(String(input))
    calls.push({ url, method: init.method ?? "GET", body: init.body })
    await beforeResponse(url)
    if (url.hostname === "oauth2.googleapis.com") return json({ access_token: "fixture-access", expires_in: 3600, scope: refreshScope })
    assert.equal(init.headers?.Authorization, "Bearer fixture-access")
    if (url.hostname === "openidconnect.googleapis.com") return json({ sub: subject })
    if (url.pathname.endsWith("/users/me/calendarList")) {
      assert.equal(url.searchParams.get("showHidden"), "true")
      if (pages) return json(pages[url.searchParams.get("pageToken") ?? "first"])
      return json({ items: inventory })
    }
    if (url.pathname === "/calendar/v3/calendars" && init.method === "POST") {
      if (failCreation) return json({ error: "private provider details" }, 503)
      const created = managed({ ...JSON.parse(init.body), id: "created-calendar" })
      if (creationVisible) inventory.push(created)
      return json(created, 201)
    }
    if (url.pathname.endsWith("/events")) {
      if (init.method === "POST") return json({ id: "outbound-event" }, 201)
      if (eventPages) return json(eventPages[url.searchParams.get("pageToken") ?? "first"])
      return json({ items: [{
        id: "busy-event", start: { dateTime: "2026-10-02T13:00:00Z" }, end: { dateTime: "2026-10-02T14:00:00Z" },
        summary: "Private client name", description: "Clinical notes", location: "Private address",
      }], nextSyncToken: "fixture-sync" })
    }
    const id = decodeURIComponent(url.pathname.split("/").at(-1))
    const entry = inventory.find((calendar) => calendar.id === id)
    if (entry) return json(metadata ?? entry, metadataStatus)
    throw new Error(`Unexpected fixture request: ${url.pathname}`)
  } })
  return { adapter, calls, inventory, writes: () => calls.filter((call) => call.method !== "GET") }
}

describe("AtmoShaper Google calendar discovery", () => {
  for (const calendars of [[], [legacy]]) {
    it(`creates an independent marked calendar with ${calendars.length ? "only the old calendar" : "no calendars"}`, async () => {
      const fixture = googleFixture({ calendars })
      const result = await fixture.adapter.ensureDedicatedCalendar("fixture-access", { providerAccountId: "subject-a" })
      assert.equal(result.id, "created-calendar")
      assert.equal(result.summary, "AtmoShaper")
      assert.deepEqual(JSON.parse(fixture.writes()[0].body), { summary: "AtmoShaper", description: marker })
      assert.deepEqual(fixture.inventory.slice(0, calendars.length), calendars)
      assert.equal(fixture.writes().length, 1)
    })
  }

  it("recovers one owned marked calendar without another creation", async () => {
    const fixture = googleFixture({ calendars: [legacy, managed()] })
    const result = await fixture.adapter.ensureDedicatedCalendar("fixture-access", { providerAccountId: "subject-a" })
    assert.equal(result.id, "atmo-calendar")
    assert.equal(fixture.writes().length, 0)
  })

  it("keeps a renamed stored ID authoritative even when another namesake exists", async () => {
    const fixture = googleFixture({ calendars: [managed({ summary: "Renamed by owner" }), managed({ id: "other-calendar" })] })
    const result = await fixture.adapter.ensureDedicatedCalendar("fixture-access", { providerAccountId: "subject-a", storedCalendarId: "atmo-calendar" })
    assert.equal(result.summary, "Renamed by owner")
    assert.equal(fixture.writes().length, 0)
  })

  for (const [label, calendars] of [
    ["an unmarked namesake", [managed({ description: undefined })]],
    ["a shared namesake", [managed({ accessRole: "writer" })]],
    ["a primary namesake", [managed({ primary: true })]],
    ["ambiguous marked calendars", [managed(), managed({ id: "duplicate" })]],
  ]) {
    it(`rejects ${label} before writing`, async () => {
      const fixture = googleFixture({ calendars })
      await assert.rejects(() => fixture.adapter.ensureDedicatedCalendar("fixture-access", { providerAccountId: "subject-a" }))
      assert.equal(fixture.writes().length, 0)
    })
  }

  for (const storedCalendarId of ["missing-calendar", legacy.id]) {
    it(`does not replace the unexpected stored target ${storedCalendarId}`, async () => {
      const fixture = googleFixture({ calendars: [legacy, managed()] })
      await assert.rejects(() => fixture.adapter.ensureDedicatedCalendar("fixture-access", { providerAccountId: "subject-a", storedCalendarId }))
      assert.equal(fixture.writes().length, 0)
    })
  }

  for (const options of [{ metadataStatus: 403 }, { metadata: { id: "wrong-id", description: marker } }, { metadata: { id: "atmo-calendar", description: "changed" } }]) {
    it(`fails closed on inaccessible or mismatched metadata ${JSON.stringify(options)}`, async () => {
      const fixture = googleFixture({ calendars: [managed()], ...options })
      await assert.rejects(() => fixture.adapter.ensureDedicatedCalendar("fixture-access", { providerAccountId: "subject-a", storedCalendarId: "atmo-calendar" }))
      assert.equal(fixture.writes().length, 0)
    })
  }

  it("checks hidden and later-page candidates before creating", async () => {
    const fixture = googleFixture({ calendars: [managed()], pages: {
      first: { items: [legacy], nextPageToken: "next" },
      next: { items: [managed({ hidden: true })] },
    } })
    assert.equal((await fixture.adapter.ensureDedicatedCalendar("fixture-access", { providerAccountId: "subject-a" })).id, "atmo-calendar")
    assert.equal(fixture.writes().length, 0)
  })

  it("rejects ambiguity found on a later page before writing", async () => {
    const fixture = googleFixture({ pages: {
      first: { items: [managed()], nextPageToken: "next" },
      next: { items: [managed({ id: "later-duplicate" })] },
    } })
    await assert.rejects(() => fixture.adapter.ensureDedicatedCalendar("fixture-access", { providerAccountId: "subject-a" }), /ambiguous/)
    assert.equal(fixture.writes().length, 0)
  })

  it("rejects a different Google subject before calendar inventory or writes", async () => {
    const fixture = googleFixture({ calendars: [managed()], subject: "subject-b" })
    await assert.rejects(() => fixture.adapter.ensureDedicatedCalendar("fixture-access", { providerAccountId: "subject-a" }), /account identity changed/)
    assert.equal(fixture.calls.length, 1)
  })
})

/**
 * Loads the real service with database/encryption boundaries replaced. Each
 * callback uses the real adapter; no provider or database connection is opened.
 */
function serviceFixture(fixture, existing = null, historical = []) {
  const calls = []
  const state = { connection: existing, historical, sources: [], eventLinks: [], existingEventLinks: [], busyBlocks: [], transactions: [], runs: [] }
  let revision = 0
  const db = {
    $queryRaw: async () => { calls.push("user-lock") },
    calendarConnection: {
      findMany: async () => [...state.historical, ...(state.connection ? [state.connection] : [])],
      findUnique: async () => state.connection ? { ...state.connection, sources: state.sources } : null,
      findFirst: async () => state.connection,
      upsert: async ({ create, update }) => {
        calls.push("save-connection")
        state.connection = { id: "connection-a", ...(state.connection ? { ...state.connection, ...update } : create), updatedAt: new Date(1_800_000_000_000 + revision++) }
        return state.connection
      },
      update: async ({ data }) => { calls.push("update-connection"); Object.assign(state.connection, data); return state.connection },
      updateMany: async ({ where, data }) => {
        if (!state.connection || !matchesConnectionWhere(state.connection, where)) return { count: 0 }
        state.connection = { ...state.connection, ...data, updatedAt: new Date(1_800_000_000_000 + revision++) }
        return { count: 1 }
      },
    },
    externalCalendarSource: {
      deleteMany: async ({ where }) => { calls.push({ excluded: where.providerCalendarId.in }); return { count: 0 } },
      upsert: async ({ create }) => {
        if (!state.sources.some((item) => item.providerCalendarId === create.providerCalendarId)) state.sources.push({ id: `source-${state.sources.length}`, ...create })
      },
      update: async ({ where, data }) => Object.assign(state.sources.find((item) => item.id === where.id), data),
    },
    externalCalendarBusyBlock: { upsert: async ({ create }) => state.busyBlocks.push(create) },
    calendarSyncRun: {
      create: async ({ data }) => { const run = { id: `run-${state.runs.length}`, ...data }; state.runs.push(run); return run },
      update: async ({ where, data }) => Object.assign(state.runs.find((run) => run.id === where.id), data),
    },
    calendarEvent: { findUnique: async () => ({ id: "event-a", ownerUserId: "user-a", kind: "APPOINTMENT", status: "CONFIRMED", externalCalendarLinks: state.existingEventLinks,
      startsAt: new Date("2026-10-02T13:00:00Z"), endsAt: new Date("2026-10-02T14:00:00Z"), timezone: "America/New_York", clientName: "Private client", notes: "Clinical details" }) },
    externalCalendarEventLink: { upsert: async (input) => { state.eventLinks.push(input) } },
  }
  db.$transaction = async (operation) => {
    // Model rollback of writes while retaining the separately committed intent.
    // This is not a substitute for isolated PostgreSQL concurrency acceptance.
    const snapshot = { connection: state.connection, sources: structuredClone(state.sources), busyBlocks: structuredClone(state.busyBlocks), eventLinks: structuredClone(state.eventLinks) }
    state.transactions.push("start")
    try {
      const result = await operation(db)
      state.transactions.push("commit")
      return result
    } catch (error) {
      Object.assign(state, snapshot)
      state.transactions.push("rollback")
      throw error
    }
  }
  const service = load(serviceSource, "lib/calendar-sync-service.isolation.test.ts", {
    "./calendar-sync-constants.ts": constants,
    "./calendar-sync-env.ts": { getGoogleCalendarSyncConfig: () => ({ clientId: "fixture-client", clientSecret: "fixture-secret" }) },
    "./calendar-sync-secrets.ts": { encryptCalendarSyncSecret: (value) => `encrypted:${value}`, decryptCalendarSyncSecret: (value) => value.slice("encrypted:".length) },
    "./google-calendar-adapter.ts": { createGoogleCalendarAdapter: () => fixture.adapter, GoogleCalendarConnectionError },
    "./calendar-sync-normalization.ts": normalization,
    "./prisma.ts": { prisma: db },
  })
  return { service, calls, state, db }
}

function storedConnection(overrides = {}) {
  return { id: "connection-a", userId: "user-a", provider: "GOOGLE", providerAccountId: "subject-a", dedicatedCalendarId: "atmo-calendar", status: "ACTIVE", grantedScopes: scopes, encryptedAccessToken: "encrypted:fixture-access", encryptedRefreshToken: "encrypted:fixture-refresh", accessTokenExpiresAt: new Date(Date.now() + 3600_000), ...overrides }
}

function callbackFixture(service, adapter, { session = { user: { id: "user-a" } }, allowed = true, callbackToken = token } = {}) {
  const cookiesDeleted = []
  const route = load(routeSource, "app/api/calendar/google/callback.isolation.test.ts", {
    "next/server": { NextResponse: { redirect: (url) => ({ url: String(url), cookies: { delete: (name) => cookiesDeleted.push(name) } }) } },
    "@/auth": { getCurrentSession: async () => session },
    "@/lib/auth-env": { getSiteUrl: () => "https://atmoshaper.example.test" },
    "@/lib/calendar-sync-access": { getGoogleCalendarSyncAccess: async () => ({ allowed }) },
    "@/lib/calendar-sync-env": { getGoogleCalendarSyncConfig: () => ({ clientId: "fixture-client", clientSecret: "fixture-secret", redirectUri: "https://atmoshaper.example.test/api/calendar/google/callback" }) },
    "@/lib/google-calendar-adapter": { createGoogleCalendarAdapter: () => ({ ...adapter, exchangeCode: async () => callbackToken }), GoogleCalendarConnectionError },
    "@/lib/calendar-sync-service": service,
  })
  return { route, cookiesDeleted, request: (state = "expected") => ({ url: `https://atmoshaper.example.test/api/calendar/google/callback?code=fixture-code&state=${state}`, cookies: { get: () => ({ value: "expected" }) } }) }
}

describe("Google callback and service coexistence seam", () => {
  for (const workload of ["inbound", "outbound"]) {
    for (const expired of [false, true]) {
      it(`bounds ${workload} validation pagination with a ${expired ? "refreshed" : "cached"} token`, async (t) => {
        const timeout = AbortSignal.timeout.bind(AbortSignal)
        const deadline = new AbortController()
        t.mock.method(AbortSignal, "timeout", (duration) => duration === (workload === "inbound" ? 60_000 : 30_000) ? deadline.signal : timeout(duration))
        const google = googleFixture({ calendars: [managed()], pages: {
          first: { items: [managed()], nextPageToken: "second" },
          second: { items: [], nextPageToken: "third" }, third: { items: [] },
        }, beforeResponse: (url) => {
          if (url.searchParams.get("pageToken") === "second") deadline.abort(new Error("fixture aggregate deadline"))
        } })
        const { service, state, calls } = serviceFixture(google, storedConnection(expired ? { accessTokenExpiresAt: new Date(0) } : {}))
        const operation = workload === "inbound"
          ? () => service.syncGoogleConnectionSources({ connectionId: "connection-a", adapter: google.adapter })
          : () => service.pushCalendarEventToGoogle("event-a", google.adapter)
        await assert.rejects(operation, /fixture aggregate deadline/)
        assert.equal(google.calls.filter((call) => call.url.pathname.endsWith("/calendarList")).length, 2)
        assert.equal(google.calls.some((call) => call.url.pathname.endsWith("/events")), false)
        assert.equal(calls.includes("update-connection"), false)
        assert.deepEqual(state.busyBlocks, [])
        assert.deepEqual(state.eventLinks, [])
      })
    }
  }

  it("stops inbound event pagination and later sources without advancing a failed cursor", async (t) => {
    const timeout = AbortSignal.timeout.bind(AbortSignal)
    const deadline = new AbortController()
    t.mock.method(AbortSignal, "timeout", (duration) => duration === 60_000 ? deadline.signal : timeout(duration))
    const google = googleFixture({ calendars: [managed()], eventPages: {
      first: { items: [], nextPageToken: "second" },
      second: { items: [], nextPageToken: "third" }, third: { items: [], nextSyncToken: "new-cursor" },
    }, beforeResponse: (url) => {
      if (url.pathname.endsWith("/events") && url.searchParams.get("pageToken") === "second") deadline.abort(new Error("fixture read budget exhausted"))
    } })
    const { service, state } = serviceFixture(google, storedConnection())
    state.sources.push(...["first-source", "later-source"].map((id) => ({ id, providerCalendarId: id, selectedForBusySync: true, syncToken: "saved-cursor" })))
    await assert.rejects(() => service.syncGoogleConnectionSources({ connectionId: "connection-a", adapter: google.adapter }), /fixture read budget exhausted/)
    assert.equal(google.calls.filter((call) => call.url.pathname.endsWith("/events")).length, 2)
    assert.deepEqual(state.sources.map((source) => source.syncToken), ["saved-cursor", "saved-cursor"])
    assert.equal(state.runs.length, 1)
    assert.equal(state.runs[0].status, "FAILED")
    assert.equal(state.connection.lastSyncedAt, undefined)
    assert.deepEqual(state.busyBlocks, [])
  })

  it("retains a new outbound event ID when the read deadline expires after POST dispatch", async (t) => {
    const timeout = AbortSignal.timeout.bind(AbortSignal)
    const deadline = new AbortController()
    t.mock.method(AbortSignal, "timeout", (duration) => duration === 30_000 ? deadline.signal : timeout(duration))
    const google = googleFixture({ calendars: [managed()], beforeResponse: (url) => {
      if (url.pathname.endsWith("/events")) deadline.abort(new Error("fixture read deadline after insert"))
    } })
    const { service, state } = serviceFixture(google, storedConnection())
    assert.deepEqual(await service.pushCalendarEventToGoogle("event-a", google.adapter), { pushed: true })
    assert.equal(state.eventLinks[0].create.providerEventId, "outbound-event")
    assert.equal(google.writes().length, 1)
  })

  it("cancels late discovery before releasing an intent after transaction rejection", async () => {
    let reads = 0
    let resumeRead
    let readStarted
    const paused = new Promise((resolve) => { resumeRead = resolve })
    const started = new Promise((resolve) => { readStarted = resolve })
    const fixture = googleFixture({ beforeResponse: async (url) => {
      if (url.hostname === "openidconnect.googleapis.com" && ++reads === 2) {
        readStarted()
        await paused
      }
    } })
    const { service, state, db } = serviceFixture(fixture)
    const transaction = db.$transaction
    let transactions = 0
    let lateOperation
    db.$transaction = async (operation) => {
      if (++transactions !== 2) return transaction(operation)
      // Model the database rejecting while its read-only callback still waits.
      // Its rollback is complete before the independent release transaction.
      state.transactions.push("start")
      lateOperation = operation(db)
      lateOperation.catch(() => {})
      await started
      state.transactions.push("rollback")
      throw new Error("fixture transaction expired")
    }
    await assert.rejects(() => service.connectGoogleCalendar({ userId: "user-a", token }), /before creation/)
    assert.equal(state.connection.statusReason, null)
    resumeRead()
    await assert.rejects(() => lateOperation)
    assert.equal(fixture.writes().length, 0)
    assert.equal(state.connection.status, "ERROR")
  })

  for (const endpoint of ["userinfo", "calendarList"]) {
    it(`retries a transient second-phase ${endpoint} failure before any calendar POST`, async () => {
      let reads = 0
      const fixture = googleFixture({ beforeResponse: (url) => {
        const matches = endpoint === "userinfo" ? url.hostname === "openidconnect.googleapis.com" : url.pathname.endsWith("/users/me/calendarList")
        if (matches && ++reads === 2) throw new Error("fixture read timeout")
      } })
      const { service, state } = serviceFixture(fixture)
      await assert.rejects(() => service.connectGoogleCalendar({ userId: "user-a", token }), /before creation/)
      assert.equal(fixture.writes().length, 0)
      assert.equal(state.connection.status, "ERROR")
      assert.equal(state.connection.statusReason, null)
      assert.equal(state.connection.encryptedRefreshToken, "encrypted:fixture-refresh")
      assert.deepEqual(state.transactions, ["start", "commit", "start", "rollback", "start", "commit"])
      await service.connectGoogleCalendar({ userId: "user-a", token })
      assert.equal(state.connection.status, "ACTIVE")
      assert.equal(fixture.writes().filter((call) => call.url.pathname === "/calendar/v3/calendars").length, 1)
    })
  }

  it("retains the intent when the known-no-POST release cannot commit", async () => {
    let reads = 0
    const fixture = googleFixture({ beforeResponse: (url) => {
      if (url.hostname === "openidconnect.googleapis.com" && ++reads === 2) throw new Error("fixture read timeout")
    } })
    const { service, state, db } = serviceFixture(fixture)
    db.calendarConnection.updateMany = async () => { throw new Error("fixture database failure") }
    await assert.rejects(() => service.connectGoogleCalendar({ userId: "user-a", token }), /unresolved/)
    assert.equal(state.connection.statusReason, constants.GOOGLE_CALENDAR_CREATION_PENDING_REASON)
    await assert.rejects(() => service.connectGoogleCalendar({ userId: "user-a", token }), /unresolved/)
    assert.equal(fixture.writes().length, 0)
  })

  it("does not release a changed intent version after a pre-POST read failure", async () => {
    let reads = 0
    let state
    const fixture = googleFixture({ beforeResponse: (url) => {
      if (url.hostname === "openidconnect.googleapis.com" && ++reads === 2) {
        state.connection.updatedAt = new Date(state.connection.updatedAt.getTime() + 1_000)
        throw new Error("fixture read timeout")
      }
    } })
    const loaded = serviceFixture(fixture)
    state = loaded.state
    await assert.rejects(() => loaded.service.connectGoogleCalendar({ userId: "user-a", token }), /unresolved/)
    assert.equal(state.connection.statusReason, constants.GOOGLE_CALENDAR_CREATION_PENDING_REASON)
    assert.equal(fixture.writes().length, 0)
  })

  it("waits for a late event insert ID while keeping existing-ID updates bounded", async (t) => {
    const timeout = AbortSignal.timeout.bind(AbortSignal)
    const deadlines = []
    t.mock.method(AbortSignal, "timeout", (duration) => {
      deadlines.push(duration)
      return timeout(duration)
    })
    const calls = []
    let finishInsert
    const adapter = createGoogleCalendarAdapter({ fetchImpl: async (_input, init) => {
      calls.push(init)
      if (init.method === "POST") return new Promise((resolve) => { finishInsert = resolve })
      return json({ id: "accepted-event" })
    } })
    const payload = normalization.buildGoogleOutboundEventPayload({
      calendarEventId: "event-a", kind: "APPOINTMENT", startsAt: new Date("2026-10-02T13:00:00Z"),
      endsAt: new Date("2026-10-02T14:00:00Z"), timezone: "UTC",
    })
    const pending = adapter.upsertEvent({ accessToken: "fixture-access", calendarId: "atmo-calendar", eventId: null, payload })
    assert.deepEqual(deadlines, [])
    assert.equal(calls[0].signal, undefined)
    finishInsert(json({ id: "accepted-event" }, 201))
    const inserted = await pending
    assert.equal(inserted.id, "accepted-event")
    await adapter.upsertEvent({ accessToken: "fixture-access", calendarId: "atmo-calendar", eventId: inserted.id, payload })
    assert.equal(calls[1].method, "PATCH")
    assert.ok(calls[1].signal instanceof AbortSignal)
    assert.deepEqual(deadlines, [8_000])
  })
  it("bounds and sanitizes an aborted provider request before persistence", async (t) => {
    const timeout = AbortSignal.timeout.bind(AbortSignal)
    t.mock.method(AbortSignal, "timeout", (duration) => {
      if (duration === 30_000) return timeout(duration)
      assert.equal(duration, 8_000)
      return AbortSignal.abort(new Error("private provider timeout details"))
    })
    const google = googleFixture({ calendars: [legacy] })
    const { service, state } = serviceFixture(google)
    const callback = callbackFixture(service, google.adapter)
    const result = await callback.route.GET(callback.request())
    assert.equal(new URL(result.url).searchParams.get("google"), "error")
    assert.equal(state.connection, null)
    assert.equal(google.writes().length, 0)
    assert.equal(result.url.includes("private"), false)
  })
  it("aborts paginated discovery under a shared deadline before calendar creation", async (t) => {
    const timeout = AbortSignal.timeout.bind(AbortSignal)
    const deadline = new AbortController()
    t.mock.method(AbortSignal, "timeout", (duration) => duration === 30_000 ? deadline.signal : timeout(duration))
    const google = googleFixture({
      pages: { first: { items: [legacy], nextPageToken: "second" }, second: { items: [] } },
      beforeResponse: (url) => {
        if (url.searchParams.get("pageToken") === "second") deadline.abort(new Error("private aggregate timeout"))
      },
    })
    const { service, state } = serviceFixture(google)
    const callback = callbackFixture(service, google.adapter)
    const result = await callback.route.GET(callback.request())
    assert.equal(new URL(result.url).searchParams.get("google"), "error")
    assert.equal(state.connection, null)
    assert.equal(google.writes().length, 0)
    assert.equal(google.calls.filter((call) => call.url.pathname.endsWith("/calendarList")).length, 2)
    assert.equal(result.url.includes("private"), false)
  })
  it("creates the selected target once, stores encrypted tokens, and reconnects using its ID", async () => {
    const google = googleFixture({ calendars: [legacy] })
    const { service, calls, state } = serviceFixture(google)
    const callback = callbackFixture(service, google.adapter)
    assert.equal(new URL((await callback.route.GET(callback.request())).url).searchParams.get("google"), "connected")
    assert.equal(state.connection.dedicatedCalendarId, "created-calendar")
    assert.equal(state.connection.encryptedRefreshToken, "encrypted:fixture-refresh")
    assert.equal(state.connection.providerAccountId, "subject-a")
    assert.equal(calls[0], "user-lock")
    assert.ok(calls.find((call) => call.excluded?.includes("created-calendar")))
    assert.equal(state.sources.find((source) => source.providerCalendarId === legacy.id).selectedForBusySync, false)
    google.inventory.find((item) => item.id === "created-calendar").summary = "Owner renamed"
    assert.equal(new URL((await callback.route.GET(callback.request())).url).searchParams.get("google"), "connected")
    assert.equal(state.connection.dedicatedCalendarSummary, "Owner renamed")
    assert.equal(google.writes().length, 1)
    assert.ok(callback.cookiesDeleted.every((name) => name === "massagelab_google_calendar_state"))
  })

  for (const existing of [storedConnection({ providerAccountId: "subject-b" }), storedConnection({ dedicatedCalendarId: legacy.id }), storedConnection({ dedicatedCalendarId: "inaccessible" })]) {
    it(`preserves an unexpected existing connection ${existing.providerAccountId}/${existing.dedicatedCalendarId}`, async () => {
      const google = googleFixture({ calendars: [legacy, managed()] })
      const { service, calls, state } = serviceFixture(google, existing)
      const before = structuredClone(state.connection)
      const callback = callbackFixture(service, google.adapter)
      assert.equal(new URL((await callback.route.GET(callback.request())).url).searchParams.get("google"), existing.providerAccountId === "subject-b" ? "account" : "target")
      assert.deepEqual(state.connection, before)
      assert.equal(calls.includes("save-connection"), false)
      assert.equal(google.writes().length, 0)
    })
  }

  it("connects with narrower availability, legacy event-read or retained combined access", async () => {
    const currentScope = "openid email https://www.googleapis.com/auth/calendar.app.created https://www.googleapis.com/auth/calendar.calendarlist.readonly https://www.googleapis.com/auth/calendar.events.freebusy"
    const legacyScope = currentScope.replace("calendar.events.freebusy", "calendar.events.readonly")
    for (const scope of [currentScope, legacyScope, `${currentScope} https://www.googleapis.com/auth/calendar.events.readonly`]) {
      const google = googleFixture({ calendars: [managed()] })
      const { service, state } = serviceFixture(google)
      await service.connectGoogleCalendar({ userId: "user-a", token: { ...token, scope }, adapter: google.adapter })
      assert.equal(state.connection.dedicatedCalendarId, "atmo-calendar")
      assert.equal(state.connection.grantedScopes, scope)
      assert.equal(google.writes().length, 0)
    }
  })

  it("rejects broad or incomplete Calendar grants before creation or token persistence", async () => {
    const google = googleFixture()
    const { service, calls } = serviceFixture(google)
    const requiredCalendarScopes = [
      "https://www.googleapis.com/auth/calendar.app.created",
      "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
      "https://www.googleapis.com/auth/calendar.events.freebusy",
    ]
    const legacyScope = scopes.replace("calendar.events.freebusy", "calendar.events.readonly")
    const incompleteLegacy = requiredCalendarScopes.slice(0, 2).map((required) => legacyScope.replace(required, ""))
    for (const scope of [undefined, ...requiredCalendarScopes.map((required) => scopes.replace(required, "")), ...incompleteLegacy, `${scopes} https://www.googleapis.com/auth/calendar.readonly`, `${scopes} https://www.googleapis.com/auth/calendar`, `${scopes} https://www.googleapis.com/auth/calendar.events`, scopes.replace("calendar.events.freebusy", "calendar.events.owned.readonly")]) {
      await assert.rejects(() => service.connectGoogleCalendar({ userId: "user-a", token: { ...token, scope }, adapter: google.adapter }), /limited permissions/)
    }
    assert.equal(calls.length, 0)
    assert.equal(google.calls.length, 0)
    const callback = callbackFixture(service, google.adapter, { callbackToken: { ...token, scope: `${scopes} https://www.googleapis.com/auth/calendar` } })
    assert.equal(new URL((await callback.route.GET(callback.request())).url).searchParams.get("google"), "permissions")
  })

  for (const status of ["DISCONNECTED", "NEEDS_REAUTH", "ERROR"]) {
    it(`preserves ${status} history for another account without blocking a new connection`, async () => {
      const google = googleFixture({ calendars: [legacy] })
      const history = [storedConnection({ id: "historical-connection", providerAccountId: "subject-b", dedicatedCalendarId: legacy.id, status })]
      const before = structuredClone(history)
      const { service, state } = serviceFixture(google, null, history)
      await service.connectGoogleCalendar({ userId: "user-a", token, adapter: google.adapter })
      assert.equal(state.connection.providerAccountId, "subject-a")
      assert.equal(state.connection.dedicatedCalendarId, "created-calendar")
      assert.deepEqual(history, before)
    })
  }

  it("reuses a validated inactive target for the returning account", async () => {
    const google = googleFixture({ calendars: [managed({ summary: "Renamed inactive target" })] })
    const { service, state } = serviceFixture(google, storedConnection({ status: "NEEDS_REAUTH" }))
    await service.connectGoogleCalendar({ userId: "user-a", token, adapter: google.adapter })
    assert.equal(state.connection.id, "connection-a")
    assert.equal(state.connection.status, "ACTIVE")
    assert.equal(state.connection.dedicatedCalendarSummary, "Renamed inactive target")
    assert.equal(google.writes().length, 0)
  })

  it("does not adopt an unverified inactive target for the returning account", async () => {
    const google = googleFixture({ calendars: [legacy, managed()] })
    const existing = storedConnection({ status: "DISCONNECTED", dedicatedCalendarId: legacy.id })
    const { service, state } = serviceFixture(google, existing)
    await assert.rejects(() => service.connectGoogleCalendar({ userId: "user-a", token, adapter: google.adapter }), /verified AtmoShaper/)
    assert.equal(state.connection, existing)
    assert.equal(state.connection.status, "DISCONNECTED")
    assert.equal(google.writes().length, 0)
  })

  it("imports minimal busy rows and exports generic events through the validated target", async () => {
    const google = googleFixture({ calendars: [legacy, managed(), { id: "primary-calendar", primary: true, summary: "Primary", accessRole: "owner" }] })
    const { service, state } = serviceFixture(google)
    await service.connectGoogleCalendar({ userId: "user-a", token, adapter: google.adapter })
    assert.equal(state.busyBlocks.length, 1)
    assert.equal(state.busyBlocks[0].providerCalendarId, "primary-calendar")
    for (const field of ["summary", "description", "location", "clientName", "notes"]) assert.equal(state.busyBlocks[0][field], undefined)
    await service.pushCalendarEventToGoogle("event-a", google.adapter)
    const write = google.writes()[0]
    assert.equal(write.url.pathname, "/calendar/v3/calendars/atmo-calendar/events")
    const payload = JSON.parse(write.body)
    assert.equal(payload.summary, "AtmoShaper appointment")
    assert.deepEqual(payload.extendedProperties.private, { massagelabEventId: "event-a" })
    for (const field of ["description", "location", "attendees", "clientName", "notes"]) assert.equal(payload[field], undefined)
    assert.equal(state.eventLinks[0].create.providerCalendarId, "atmo-calendar")
  })

  it("retains inactive creation intent on provider failure and reconciles an interrupted creation", async () => {
    const failed = googleFixture({ calendars: [legacy], failCreation: true })
    const failedService = serviceFixture(failed)
    await assert.rejects(() => failedService.service.connectGoogleCalendar({ userId: "user-a", token, adapter: failed.adapter }), /creation is unresolved/)
    assert.equal(failedService.state.connection.status, "ERROR")
    assert.equal(failedService.state.connection.statusReason, "GOOGLE_CALENDAR_CREATION_PENDING")
    assert.equal(failedService.state.connection.encryptedRefreshToken, "encrypted:fixture-refresh")
    await assert.rejects(() => failedService.service.connectGoogleCalendar({ userId: "user-a", token, adapter: failed.adapter }), /creation is unresolved/)
    assert.equal(failed.writes().length, 1)
    const interrupted = googleFixture({ calendars: [legacy], metadataStatus: 403 })
    const interruptedService = serviceFixture(interrupted)
    await assert.rejects(() => interruptedService.service.connectGoogleCalendar({ userId: "user-a", token, adapter: interrupted.adapter }), /creation is unresolved/)
    assert.equal(interruptedService.state.connection.status, "ERROR")
    assert.equal(interruptedService.state.connection.statusReason, "GOOGLE_CALENDAR_CREATION_PENDING")
    assert.equal(interrupted.writes().length, 1)
    const retry = googleFixture({ calendars: interrupted.inventory })
    await interruptedService.service.connectGoogleCalendar({ userId: "user-a", token, adapter: retry.adapter })
    assert.equal(retry.writes().length, 0)
    assert.equal(interruptedService.state.connection.dedicatedCalendarId, "created-calendar")
    assert.equal(interruptedService.state.connection.statusReason, null)
  })

  it("does not repeat an aborted accepted create while the calendar listing is still empty", async (t) => {
    const timeout = AbortSignal.timeout.bind(AbortSignal)
    const requestDeadline = new AbortController()
    let useControlledDeadline = true
    t.mock.method(AbortSignal, "timeout", (duration) => duration === 8_000 && useControlledDeadline ? requestDeadline.signal : timeout(duration))
    let state
    const google = googleFixture({ creationVisible: false, beforeResponse: (url) => {
      if (url.pathname === "/calendar/v3/calendars") {
        assert.equal(state.connection.statusReason, "GOOGLE_CALENDAR_CREATION_PENDING")
        assert.deepEqual(state.transactions, ["start", "commit", "start"])
        requestDeadline.abort(new Error("private accepted-create timeout"))
      }
    } })
    const fixture = serviceFixture(google)
    state = fixture.state
    const callback = callbackFixture(fixture.service, google.adapter)
    assert.equal(new URL((await callback.route.GET(callback.request())).url).searchParams.get("google"), "target")
    assert.equal(state.connection.status, "ERROR")
    assert.equal(state.connection.dedicatedCalendarId ?? null, null)
    assert.deepEqual(state.transactions, ["start", "commit", "start", "rollback"])
    useControlledDeadline = false
    assert.equal(new URL((await callback.route.GET(callback.request())).url).searchParams.get("google"), "target")
    assert.equal(google.writes().length, 1)
    google.inventory.push(managed({ id: "created-calendar" }))
    assert.equal(new URL((await callback.route.GET(callback.request())).url).searchParams.get("google"), "connected")
    assert.equal(google.writes().length, 1)
    assert.equal(state.connection.status, "ACTIVE")
    assert.equal(state.connection.statusReason, null)
  })

  it("retains the committed intent when source inventory fails after a target save", async () => {
    let listings = 0
    const google = googleFixture({ beforeResponse: (url) => {
      if (url.pathname.endsWith("/calendarList") && ++listings === 4) throw new Error("private inventory failure")
    } })
    const { service, state } = serviceFixture(google)
    await assert.rejects(() => service.connectGoogleCalendar({ userId: "user-a", token, adapter: google.adapter }), /creation is unresolved/)
    assert.equal(state.connection.status, "ERROR")
    assert.equal(state.connection.statusReason, "GOOGLE_CALENDAR_CREATION_PENDING")
    assert.equal(state.connection.dedicatedCalendarId ?? null, null)
    assert.equal(state.sources.length, 0)
    await service.connectGoogleCalendar({ userId: "user-a", token, adapter: google.adapter })
    assert.equal(google.writes().length, 1)
    assert.equal(state.connection.status, "ACTIVE")
  })

  it("preserves callback state, authentication, entitlement and token prerequisites", async () => {
    const google = googleFixture()
    const { service } = serviceFixture(google)
    for (const [options, requestState, result] of [
      [{}, "wrong", "state"],
      [{ allowed: false }, "expected", "access"],
      [{ callbackToken: { ...token, refresh_token: undefined } }, "expected", "refresh"],
      [{ callbackToken: { ...token, googleUserId: undefined } }, "expected", "identity"],
    ]) {
      const callback = callbackFixture(service, google.adapter, options)
      assert.equal(new URL((await callback.route.GET(callback.request(requestState))).url).searchParams.get("google"), result)
    }
    const signedOut = callbackFixture(service, google.adapter, { session: null })
    assert.equal(new URL((await signedOut.route.GET(signedOut.request())).url).pathname, "/login")
    assert.equal(google.calls.length, 0)
  })

  it("validates old stored targets before inbound import or outbound event writes", async () => {
    const google = googleFixture({ calendars: [legacy, managed()] })
    const { service, state } = serviceFixture(google, storedConnection({ dedicatedCalendarId: legacy.id }))
    await assert.rejects(() => service.syncGoogleConnectionSources({ connectionId: "connection-a", adapter: google.adapter }), /verified AtmoShaper/)
    await assert.rejects(() => service.pushCalendarEventToGoogle("event-a", google.adapter), /verified AtmoShaper/)
    assert.equal(google.writes().length, 0)
    assert.equal(state.eventLinks.length, 0)
  })

  it("validates a refreshed token before storing it, including scope and account drift", async () => {
    const existing = storedConnection({ accessTokenExpiresAt: new Date(0) })
    for (const options of [{}, { refreshScope: `${scopes} https://www.googleapis.com/auth/calendar` }, { subject: "subject-b" }]) {
      const google = googleFixture({ calendars: [managed()], ...options })
      const { service, calls } = serviceFixture(google, structuredClone(existing))
      if (Object.keys(options).length) {
        await assert.rejects(() => service.refreshGoogleAccessToken("connection-a", google.adapter))
        assert.equal(calls.includes("update-connection"), false)
      } else {
        assert.equal(await service.refreshGoogleAccessToken("connection-a", google.adapter), "fixture-access")
        assert.equal(calls.includes("update-connection"), true)
      }
    }
  })

  it("preserves new, legacy and combined grants through cached and refreshed token paths", async () => {
    const legacyScope = scopes.replace("calendar.events.freebusy", "calendar.events.readonly")
    const combinedScope = `${scopes} https://www.googleapis.com/auth/calendar.events.readonly`
    for (const scope of [scopes, legacyScope, combinedScope]) {
      for (const cached of [true, false]) {
        const google = googleFixture({ calendars: [managed()], refreshScope: scope })
        const { service, state, calls } = serviceFixture(google, storedConnection({ accessTokenExpiresAt: new Date(cached ? Date.now() + 3600_000 : 0), grantedScopes: scope }))
        assert.equal(await service.refreshGoogleAccessToken("connection-a", google.adapter), "fixture-access")
        assert.equal(state.connection.grantedScopes, scope)
        assert.equal(state.connection.dedicatedCalendarId, "atmo-calendar")
        assert.equal(calls.includes("update-connection"), !cached)
        assert.equal(google.writes().some((call) => call.url.hostname === "www.googleapis.com"), false)
      }
    }
  })

  it("does not use a stale provider-event mapping in another calendar", async () => {
    const google = googleFixture({ calendars: [managed()] })
    const { service, state } = serviceFixture(google, storedConnection())
    const mapping = { connectionId: "connection-a", provider: "GOOGLE", providerCalendarId: legacy.id, providerEventId: "old-provider-event" }
    state.existingEventLinks.push(mapping)
    await assert.rejects(() => service.pushCalendarEventToGoogle("event-a", google.adapter), /different calendar/)
    assert.equal(google.writes().length, 0)
    assert.equal(state.eventLinks.length, 0)
    assert.deepEqual(state.existingEventLinks, [mapping])
  })
})

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } })
}
