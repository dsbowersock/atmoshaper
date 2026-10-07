import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, rm, readFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { createServer } from "node:http"
import { request as playwrightRequest } from "@playwright/test"
import { acceptanceEnvironment, authorizeAcceptanceRequest, encodeAcceptanceActionForm, validateAcceptanceCredential, validateAcceptanceManifest, validateAcceptanceScopes, ACCEPTANCE_BASE, ACCEPTANCE_ORIGIN, ACCEPTANCE_CALLBACK } from "../scripts/calendar-application-acceptance-core.mjs"
import { acceptanceStore, createAcceptanceFetch } from "../scripts/calendar-application-acceptance-guard.mjs"
import { fingerprintBrowserQaDatabaseTarget } from "../scripts/assert-browser-qa-database-target.mjs"
import { GOOGLE_CALENDAR_SCOPES, ATMOSHAPER_GOOGLE_CALENDAR_DESCRIPTION } from "../lib/calendar-sync-constants.ts"

/** Entirely invented identities/credentials: these tests never load local settings or contact providers. */
function fixture() {
  const runId = "a".repeat(32)
  const runtimeUrl = "postgresql://test:synthetic@ep-synthetic-pooler.us-east-2.aws.neon.tech/test?sslmode=require"
  const directUrl = runtimeUrl.replace("-pooler.", ".")
  const manifest = {
    version: 1, approved: true, runId, sourceSha: ACCEPTANCE_BASE, origin: ACCEPTANCE_ORIGIN,
    appRoot: resolve("synthetic-root"), credentialFile: resolve("synthetic-private", "credential.json"),
    googleProjectId: "synthetic-calendar-test", testSetupSaved: true, accountEmail: "synthetic@example.test",
    authSecret: "b".repeat(64), encryptionKey: "c".repeat(64), startNonce: "d".repeat(64),
    sources: [0, 1].map((index) => ({ calendarId: "source" + index + "@group.calendar.google.com", role: index ? "reader" : "owner", summary: "AtmoShaper application source " + runId + " " + (index + 1), eventIds: ["event" + index + "a", "event" + index + "b"] })),
    database: { createdForRun: runId, emptyProjectReceipt: true, plan: "launch", managedByVercel: false, pgVersion: 17, region: "aws-us-east-2", compute: 0.25, createdAt: Date.now(), runtimeUrl, directUrl, endpointHost: "ep-synthetic.us-east-2.aws.neon.tech", fingerprint: fingerprintBrowserQaDatabaseTarget(runtimeUrl, directUrl) },
  }
  const client = { project_id: manifest.googleProjectId, client_id: "synthetic.apps.googleusercontent.com", client_secret: "invented-secret-for-tests", redirect_uris: ["http://localhost:3317/oauth/callback"] }
  return { manifest, client }
}

test("actual loopback multipart transport preserves Next's empty action selector", async () => {
  const selector = "$ACTION_ID_40" + "a".repeat(40)
  const server = createServer(async (incoming, response) => {
    const chunks = []
    for await (const chunk of incoming) chunks.push(chunk)
    const parsed = await new Request("http://localhost/", { method: "POST", headers: { "content-type": incoming.headers["content-type"] }, body: Buffer.concat(chunks) }).formData()
    response.setHeader("content-type", "application/json")
    response.end(JSON.stringify({ actionPresent: parsed.has(selector), actionValue: parsed.get(selector), connectionId: parsed.get("connectionId"), count: [...parsed.keys()].length }))
  })
  await new Promise((done) => server.listen(0, "127.0.0.1", done))
  const context = await playwrightRequest.newContext()
  try {
    const payload = await encodeAcceptanceActionForm({ [selector]: "", connectionId: "synthetic-connection" })
    const response = await context.post("http://127.0.0.1:" + server.address().port, payload)
    assert.deepEqual(await response.json(), { actionPresent: true, actionValue: "", connectionId: "synthetic-connection", count: 2 })
    await assert.rejects(() => encodeAcceptanceActionForm({ connectionId: "synthetic-connection" }))
    await assert.rejects(() => encodeAcceptanceActionForm({ [selector]: "", connectionId: "synthetic-connection", unexpected: "value" }))
  } finally {
    await context.dispose()
    await new Promise((done) => server.close(done))
  }
})

test("database ownership cannot be substituted by matching environment aliases alone", () => {
  const { manifest } = fixture()
  assert.equal(validateAcceptanceManifest(manifest), manifest)
  for (const change of [{ managedByVercel: true }, { endpointHost: "ep-other.us-east-2.aws.neon.tech" }, { compute: 1 }, { createdForRun: "other" }, { emptyProjectReceipt: false }]) {
    assert.throws(() => validateAcceptanceManifest({ ...manifest, database: { ...manifest.database, ...change } }))
  }
  assert.throws(() => acceptanceEnvironment({ ...manifest, database: { ...manifest.database, fingerprint: "0".repeat(64) } }, {}))
})

test("child environment discards inherited provider secrets, URLs, options and hosted PHI", () => {
  const { manifest, client } = fixture()
  const environment = acceptanceEnvironment(manifest, client, { PATH: "synthetic-path", STRIPE_SECRET_KEY: "live-secret", DATABASE_URL: "private-prod-url", NODE_OPTIONS: "--import private-prod-loader", GOOGLE_CLIENT_SECRET: "private", MASSAGELAB_ENABLE_HOSTED_PHI_SYNC: "true" })
  assert.equal(environment.PATH, "synthetic-path")
  assert.equal(environment.DATABASE_URL, manifest.database.runtimeUrl)
  assert.equal(environment.STRIPE_SECRET_KEY, "")
  assert.equal(environment.MASSAGELAB_ENABLE_HOSTED_PHI_SYNC, "false")
  assert.equal(environment.NODE_OPTIONS, undefined)
  assert.equal(environment.GOOGLE_CLIENT_SECRET, "")
})

test("pending-only follow-up excludes credentials and keeps its database ownership guard", () => {
  const { manifest } = fixture()
  const pending = { ...manifest, pendingActionOnly: true, sources: [] }
  for (const key of ["credentialFile", "googleProjectId", "accountEmail"]) delete pending[key]
  assert.equal(validateAcceptanceManifest(pending), pending)
  const environment = acceptanceEnvironment(pending, {}, { GOOGLE_CALENDAR_CLIENT_ID: "inherited", GOOGLE_CALENDAR_CLIENT_SECRET: "inherited", GOOGLE_CALENDAR_REDIRECT_URI: "https://production.example" })
  for (const key of ["GOOGLE_CALENDAR_CLIENT_ID", "GOOGLE_CALENDAR_CLIENT_SECRET", "GOOGLE_CALENDAR_REDIRECT_URI"]) assert.equal(environment[key], "")
  for (const change of [{ credentialFile: manifest.credentialFile }, { googleProjectId: manifest.googleProjectId }, { accountEmail: manifest.accountEmail }, { sources: manifest.sources }]) assert.throws(() => validateAcceptanceManifest({ ...pending, ...change }))
  assert.throws(() => acceptanceEnvironment({ ...pending, database: { ...pending.database, fingerprint: "0".repeat(64) } }, {}))
})

test("pending-only follow-up expires at fifteen minutes and permits ownership-bound teardown", () => {
  const { manifest } = fixture()
  Object.assign(manifest, { pendingActionOnly: true, sources: [] })
  for (const key of ["credentialFile", "googleProjectId", "accountEmail"]) delete manifest[key]
  const deadline = manifest.database.createdAt + 15 * 60_000
  assert.doesNotThrow(() => validateAcceptanceManifest(manifest, { now: deadline - 1 }))
  assert.throws(() => validateAcceptanceManifest(manifest, { now: deadline }))
  assert.doesNotThrow(() => validateAcceptanceManifest(manifest, { now: deadline, cleanup: true }))
  assert.throws(() => validateAcceptanceManifest({ ...manifest, database: { ...manifest.database, createdForRun: "other" } }, { now: deadline, cleanup: true }))
})

test("pending-only transport refuses every external provider request before dispatch", async () => {
  const { manifest } = fixture()
  Object.assign(manifest, { pendingActionOnly: true, sources: [] })
  for (const key of ["credentialFile", "googleProjectId", "accountEmail"]) delete manifest[key]
  const directory = await mkdtemp(join(tmpdir(), "calendar-pending-unit-"))
  try {
    const store = acceptanceStore(directory, manifest.encryptionKey)
    let calls = 0
    const guarded = createAcceptanceFetch({ manifest, client: {}, store, fetchImpl: async () => { calls++; return Response.json({}) } })
    for (const url of ["https://oauth2.googleapis.com/token", "https://www.googleapis.com/calendar/v3/calendars", "https://private.example/"]) await assert.rejects(guarded(url))
    assert.equal(calls, 0)
    assert.equal((await store.journal()).length, 0)
    await guarded(ACCEPTANCE_ORIGIN + "/calendar/sync")
    assert.equal(calls, 1)
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test("an expired run cannot dispatch new work; scoped cleanup keeps ownership checks", () => {
  const { manifest, client } = fixture()
  manifest.database.createdAt -= 91 * 60_000
  assert.throws(() => acceptanceEnvironment(manifest, client))
  assert.doesNotThrow(() => acceptanceEnvironment(manifest, client, {}, { cleanup: true }))
  manifest.database.createdForRun = "wrong"
  assert.throws(() => acceptanceEnvironment(manifest, client, {}, { cleanup: true }))
})

test("retained test download remains usable after owner adds the application callback", () => {
  const { manifest, client } = fixture()
  assert.equal(validateAcceptanceCredential({ web: client }, manifest), client)
  assert.throws(() => validateAcceptanceCredential({ web: { ...client, project_id: "production-project" } }, manifest))
  assert.throws(() => validateAcceptanceCredential({ web: { ...client, redirect_uris: [...client.redirect_uris, "https://private.example/callback"] } }, manifest))
})

test("fresh grants reject missing, legacy and broader Calendar permissions", () => {
  const narrow = GOOGLE_CALENDAR_SCOPES.join(" ")
  assert.doesNotThrow(() => validateAcceptanceScopes(narrow))
  for (const scope of [narrow.replace("calendar.app.created", "calendar"), narrow + " https://www.googleapis.com/auth/calendar.events.readonly", narrow.replace("calendar.events.freebusy", "missing")]) assert.throws(() => validateAcceptanceScopes(scope))
})

test("pure dispatch refuses primary, unrelated and source calendar writes before fetch", () => {
  const { manifest, client } = fixture()
  for (const [url, method] of [["https://www.googleapis.com/calendar/v3/calendars/primary/events", "GET"], ["https://www.googleapis.com/calendar/v3/calendars/unowned%40group.calendar.google.com/events", "POST"], ["https://www.googleapis.com/calendar/v3/calendars/source0%40group.calendar.google.com", "DELETE"], ["https://private.example/mutation", "POST"]]) {
    assert.throws(() => authorizeAcceptanceRequest({ request: new Request(url, { method, headers: { authorization: "Bearer invented" } }), body: "{}", manifest, client, journal: [] }))
  }
})

test("concurrent create requests atomically reserve the lifetime budget", async () => {
  const { manifest, client } = fixture()
  const directory = await mkdtemp(join(tmpdir(), "calendar-acceptance-unit-"))
  try {
    const store = acceptanceStore(directory, manifest.encryptionKey)
    await store.saveVault([{ access_token: "invented-owned-access-token" }])
    let calls = 0
    const guarded = createAcceptanceFetch({ manifest, client, store, fetchImpl: async () => {
      const id = "created" + (++calls) + "@group.calendar.google.com"
      await new Promise((done) => setTimeout(done, 25))
      return Response.json({ id })
    } })
    const requests = Array.from({ length: 3 }, () => guarded("https://www.googleapis.com/calendar/v3/calendars", { method: "POST", headers: { authorization: "Bearer invented-owned-access-token" }, body: JSON.stringify({ summary: "AtmoShaper", description: ATMOSHAPER_GOOGLE_CALENDAR_DESCRIPTION }) }))
    const results = await Promise.allSettled(requests)
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 2)
    assert.equal(calls, 2)
    assert.equal((await store.journal()).filter((item) => item.kind === "calendar-create" && item.phase === "intent").length, 2)
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test("a deliberately lost create response retains the accepted ID and consumes its attempt", async () => {
  const { manifest, client } = fixture()
  const directory = await mkdtemp(join(tmpdir(), "calendar-acceptance-unit-"))
  try {
    const store = acceptanceStore(directory, manifest.encryptionKey)
    await store.saveVault([{ access_token: "invented-owned-access-token" }])
    const guarded = createAcceptanceFetch({ manifest, client, store, control: async () => ({ mode: "lose-calendar-response" }), fetchImpl: async () => Response.json({ id: "accepted@group.calendar.google.com" }) })
    await assert.rejects(guarded("https://www.googleapis.com/calendar/v3/calendars", { method: "POST", headers: { authorization: "Bearer invented-owned-access-token" }, body: JSON.stringify({ summary: "AtmoShaper", description: ATMOSHAPER_GOOGLE_CALENDAR_DESCRIPTION }) }), /acceptance_transport_stopped/)
    assert.equal((await store.journal()).find((item) => item.phase === "accepted").calendarId, "accepted@group.calendar.google.com")
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test("raw provider exceptions and malformed bodies never escape with secrets", async () => {
  const { manifest, client } = fixture()
  const directory = await mkdtemp(join(tmpdir(), "calendar-acceptance-unit-"))
  try {
    const store = acceptanceStore(directory, manifest.encryptionKey)
    await store.saveVault([{ access_token: "invented-owned-access-token" }])
    let calls = 0
    const guarded = createAcceptanceFetch({ manifest, client, store, fetchImpl: async () => { calls++; throw new Error("private-provider-secret") } })
    for (const body of ["{private-secret", JSON.stringify({ summary: "AtmoShaper", description: ATMOSHAPER_GOOGLE_CALENDAR_DESCRIPTION })]) await assert.rejects(guarded("https://www.googleapis.com/calendar/v3/calendars", { method: "POST", headers: { authorization: "Bearer invented-owned-access-token" }, body }), { message: "acceptance_transport_stopped" })
    assert.equal(calls, 1)
    assert.equal((await readFile(join(directory, "journal.jsonl"), "utf8")).includes("private-provider-secret"), false)
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test("cleanup refuses new exchange/write work and unowned token revocation", async () => {
  const { manifest, client } = fixture()
  const directory = await mkdtemp(join(tmpdir(), "calendar-acceptance-unit-"))
  try {
    const store = acceptanceStore(directory, manifest.encryptionKey)
    let calls = 0
    const guarded = createAcceptanceFetch({ manifest, client, store, cleanup: true, fetchImpl: async () => { calls++; return new Response("{}") } })
    await assert.rejects(guarded("https://oauth2.googleapis.com/revoke", { method: "POST", body: "token=unowned" }))
    await assert.rejects(guarded("https://oauth2.googleapis.com/token", { method: "POST", body: new URLSearchParams({ client_id: client.client_id, client_secret: client.client_secret, grant_type: "authorization_code", redirect_uri: ACCEPTANCE_CALLBACK }) }))
    assert.equal(calls, 0)
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test("a newly issued wrong grant is encrypted and retained solely for owned revocation", async () => {
  const { manifest, client } = fixture()
  const directory = await mkdtemp(join(tmpdir(), "calendar-acceptance-unit-"))
  try {
    const store = acceptanceStore(directory, manifest.encryptionKey)
    const token = "invented-new-token-with-wrong-scope"
    const guarded = createAcceptanceFetch({ manifest, client, store, fetchImpl: async () => Response.json({ access_token: token, scope: "openid email https://www.googleapis.com/auth/calendar" }) })
    await assert.rejects(guarded("https://oauth2.googleapis.com/token", { method: "POST", body: new URLSearchParams({ client_id: client.client_id, client_secret: client.client_secret, grant_type: "authorization_code", redirect_uri: ACCEPTANCE_CALLBACK }) }))
    assert.equal((await store.vault())[0].access_token, token)
    assert.equal((await readFile(join(directory, "token-vault.json"), "utf8")).includes(token), false)
    assert.equal((await store.journal()).some((item) => item.kind === "exchange" && item.phase === "accepted"), false)
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test("inventory mapping preserves paging and refuses an existing marked target", async () => {
  const { manifest, client } = fixture()
  const directory = await mkdtemp(join(tmpdir(), "calendar-acceptance-unit-"))
  try {
    const store = acceptanceStore(directory, manifest.encryptionKey)
    await store.saveVault([{ access_token: "invented-owned-access-token" }])
    let preexisting = false
    const guarded = createAcceptanceFetch({ manifest, client, store, fetchImpl: async () => Response.json({ nextPageToken: "synthetic-next-page", items: [{ id: "primary@example.test", primary: true }, { id: manifest.sources[0].calendarId }, ...(preexisting ? [{ id: "preexisting@group.calendar.google.com", description: ATMOSHAPER_GOOGLE_CALENDAR_DESCRIPTION }] : [])] }) })
    const options = { headers: { authorization: "Bearer invented-owned-access-token" } }
    const data = await (await guarded("https://www.googleapis.com/calendar/v3/users/me/calendarList?showHidden=true", options)).json()
    assert.equal(data.nextPageToken, "synthetic-next-page")
    assert.deepEqual(data.items.map((item) => item.id), [manifest.sources[0].calendarId])
    preexisting = true
    await assert.rejects(guarded("https://www.googleapis.com/calendar/v3/users/me/calendarList?showHidden=true", options))
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test("outbound lifetime cap includes deleted events, and updates require the accepted calendar and event", () => {
  const { manifest, client } = fixture()
  const calendarId = "created@group.calendar.google.com"
  const journal = [{ kind: "calendar-create", phase: "accepted", calendarId }, { kind: "event-create", phase: "intent" }, { kind: "event-create", phase: "intent" }, { kind: "event-create", phase: "accepted", calendarId, eventId: "owned1" }, { kind: "event-delete", phase: "accepted", calendarId, eventId: "owned1" }]
  const body = JSON.stringify({ summary: "AtmoShaper blocked time", start: { dateTime: "2026-10-10T10:00:00Z", timeZone: "UTC" }, end: { dateTime: "2026-10-10T11:00:00Z", timeZone: "UTC" }, extendedProperties: { private: { massagelabEventId: "calendar-acceptance-" + manifest.runId + "-1" } } })
  const base = "https://www.googleapis.com/calendar/v3/calendars/" + encodeURIComponent(calendarId) + "/events"
  const authorize = (url, method, payload = body) => authorizeAcceptanceRequest({ request: new Request(url, { method, headers: { authorization: "Bearer invented" } }), body: payload, manifest, client, journal })
  assert.throws(() => authorize(base, "POST"), /event_limit/)
  assert.throws(() => authorize(base + "/unowned", "PATCH"))
  assert.throws(() => authorize(base + "/owned1", "PATCH", body.replace("AtmoShaper blocked time", "Synthetic private details")))
  assert.equal(authorize(base + "/owned1", "PATCH").kind, "event-update")
})

test("fresh consent cap is reserved before exchange, and source response IDs stay allowlisted", async () => {
  const { manifest, client } = fixture()
  const directory = await mkdtemp(join(tmpdir(), "calendar-acceptance-unit-"))
  try {
    const store = acceptanceStore(directory, manifest.encryptionKey)
    await store.saveVault([{ access_token: "invented-owned-access-token" }])
    for (let index = 0; index < 3; index++) await store.record({ kind: "exchange", phase: "intent" })
    let calls = 0
    const guarded = createAcceptanceFetch({ manifest, client, store, fetchImpl: async () => { calls++; return Response.json({ items: [{ id: "unexpected-private-event" }] }) } })
    await assert.rejects(guarded("https://oauth2.googleapis.com/token", { method: "POST", body: new URLSearchParams({ client_id: client.client_id, client_secret: client.client_secret, grant_type: "authorization_code", redirect_uri: ACCEPTANCE_CALLBACK }) }))
    assert.equal(calls, 0)
    await assert.rejects(guarded("https://www.googleapis.com/calendar/v3/calendars/" + encodeURIComponent(manifest.sources[0].calendarId) + "/events", { headers: { authorization: "Bearer invented-owned-access-token" } }))
    assert.equal(calls, 1)
  } finally { await rm(directory, { recursive: true, force: true }) }
})
