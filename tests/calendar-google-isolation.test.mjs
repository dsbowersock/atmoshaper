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
const marker = constants.ATMOSHAPER_GOOGLE_CALENDAR_DESCRIPTION
const scopes = constants.GOOGLE_CALENDAR_SCOPES.join(" ")
const managed = (overrides = {}) => ({ id: "atmo-calendar", summary: "AtmoShaper", description: marker, accessRole: "owner", ...overrides })
const legacy = { id: "legacy-calendar", summary: "MassageLab", accessRole: "owner" }
const token = { access_token: "fixture-access", refresh_token: "fixture-refresh", expires_in: 3600, scope: scopes, googleUserId: "subject-a" }

/** Fake Google transport only; discovery and validation use the real adapter. */
function googleFixture({ calendars = [], subject = "subject-a", pages, metadataStatus = 200, metadata, failCreation = false, refreshScope = scopes, beforeResponse = () => {} } = {}) {
  const inventory = [...calendars]
  const calls = []
  const adapter = createGoogleCalendarAdapter({ fetchImpl: async (input, init = {}) => {
    init.signal?.throwIfAborted()
    const url = new URL(String(input))
    calls.push({ url, method: init.method ?? "GET", body: init.body })
    beforeResponse(url)
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
      inventory.push(created)
      return json(created, 201)
    }
    if (url.pathname.endsWith("/events")) {
      if (init.method === "POST") return json({ id: "outbound-event" }, 201)
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
  const state = { connection: existing, historical, sources: [], eventLinks: [], existingEventLinks: [], busyBlocks: [] }
  const db = {
    $queryRaw: async () => { calls.push("user-lock") },
    calendarConnection: {
      findMany: async () => [...state.historical, ...(state.connection ? [state.connection] : [])],
      findUnique: async () => state.connection ? { ...state.connection, sources: state.sources } : null,
      findFirst: async () => state.connection,
      upsert: async ({ create, update }) => {
        calls.push("save-connection")
        state.connection = { id: "connection-a", ...(state.connection ? { ...state.connection, ...update } : create) }
        return state.connection
      },
      update: async ({ data }) => { calls.push("update-connection"); Object.assign(state.connection, data); return state.connection },
    },
    externalCalendarSource: {
      deleteMany: async ({ where }) => { calls.push({ excluded: where.providerCalendarId.in }); return { count: 0 } },
      upsert: async ({ create }) => {
        if (!state.sources.some((item) => item.providerCalendarId === create.providerCalendarId)) state.sources.push({ id: `source-${state.sources.length}`, ...create })
      },
      update: async ({ where, data }) => Object.assign(state.sources.find((item) => item.id === where.id), data),
    },
    externalCalendarBusyBlock: { upsert: async ({ create }) => state.busyBlocks.push(create) },
    calendarSyncRun: { create: async () => ({ id: "run-a" }), update: async () => {} },
    calendarEvent: { findUnique: async () => ({ id: "event-a", ownerUserId: "user-a", kind: "APPOINTMENT", status: "CONFIRMED", externalCalendarLinks: state.existingEventLinks,
      startsAt: new Date("2026-10-02T13:00:00Z"), endsAt: new Date("2026-10-02T14:00:00Z"), timezone: "America/New_York", clientName: "Private client", notes: "Clinical details" }) },
    externalCalendarEventLink: { upsert: async (input) => { state.eventLinks.push(input) } },
  }
  db.$transaction = async (operation) => operation(db)
  const service = load(serviceSource, "lib/calendar-sync-service.isolation.test.ts", {
    "./calendar-sync-constants.ts": constants,
    "./calendar-sync-env.ts": { getGoogleCalendarSyncConfig: () => ({ clientId: "fixture-client", clientSecret: "fixture-secret" }) },
    "./calendar-sync-secrets.ts": { encryptCalendarSyncSecret: (value) => `encrypted:${value}`, decryptCalendarSyncSecret: (value) => value.slice("encrypted:".length) },
    "./google-calendar-adapter.ts": { createGoogleCalendarAdapter: () => fixture.adapter, GoogleCalendarConnectionError },
    "./calendar-sync-normalization.ts": normalization,
    "./prisma.ts": { prisma: db },
  })
  return { service, calls, state }
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

  it("rejects broad or incomplete Calendar grants before creation or token persistence", async () => {
    const google = googleFixture()
    const { service, calls } = serviceFixture(google)
    for (const scope of [undefined, scopes.replace("https://www.googleapis.com/auth/calendar.app.created", ""), `${scopes} https://www.googleapis.com/auth/calendar.readonly`, `${scopes} https://www.googleapis.com/auth/calendar`]) {
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

  it("saves no tokens on provider failure and can discover an interrupted creation", async () => {
    const failed = googleFixture({ calendars: [legacy], failCreation: true })
    const failedService = serviceFixture(failed)
    await assert.rejects(() => failedService.service.connectGoogleCalendar({ userId: "user-a", token, adapter: failed.adapter }), /status 503/)
    assert.equal(failedService.state.connection, null)
    const interrupted = googleFixture({ calendars: [legacy], metadataStatus: 403 })
    const interruptedService = serviceFixture(interrupted)
    await assert.rejects(() => interruptedService.service.connectGoogleCalendar({ userId: "user-a", token, adapter: interrupted.adapter }), /status 403/)
    assert.equal(interruptedService.state.connection, null)
    assert.equal(interrupted.writes().length, 1)
    const retry = googleFixture({ calendars: interrupted.inventory })
    await interruptedService.service.connectGoogleCalendar({ userId: "user-a", token, adapter: retry.adapter })
    assert.equal(retry.writes().length, 0)
    assert.equal(interruptedService.state.connection.dedicatedCalendarId, "created-calendar")
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
