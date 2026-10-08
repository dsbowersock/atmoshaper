import { isAbsolute } from "node:path"
import { BROWSER_QA_INERT_PROVIDER_ENVIRONMENT, BROWSER_QA_TELEMETRY_ENVIRONMENT } from "./browser-qa-environment.mjs"
import { isBrowserQaDatabaseTargetAuthorized } from "./assert-browser-qa-database-target.mjs"
import { ATMOSHAPER_GOOGLE_CALENDAR_DESCRIPTION, GOOGLE_CALENDAR_SCOPES } from "../lib/calendar-sync-constants.ts"

export const ACCEPTANCE_BASE = "38d0deddea484938e13df61927d07a7b21f92071"
export const ACCEPTANCE_ORIGIN = "http://localhost:3318"
export const ACCEPTANCE_CALLBACK = ACCEPTANCE_ORIGIN + "/api/calendar/google/callback"
export const ACCEPTANCE_SOURCE_PREFIX = "AtmoShaper application source "
const CALENDAR_PREFIX = "https://www.googleapis.com/auth/calendar"
const CALENDAR_SCOPES = GOOGLE_CALENDAR_SCOPES.filter((scope) => scope.startsWith(CALENDAR_PREFIX))
const APPROVED_SCOPES = new Set([...GOOGLE_CALENDAR_SCOPES, "https://www.googleapis.com/auth/userinfo.email"])
const SYSTEM_ENV_KEYS = ["PATH", "Path", "PATHEXT", "SystemRoot", "WINDIR", "COMSPEC", "TEMP", "TMP", "APPDATA", "LOCALAPPDATA", "USERPROFILE", "ProgramFiles", "ProgramFiles(x86)"]

/** Fixed failure labels deliberately omit rejected private values and underlying exceptions. */
export function requireAcceptance(condition, label = "acceptance_boundary") {
  if (!condition) {
    const error = new Error(label)
    // Only this boundary's fixed labels may be exposed by the task worker's diagnostics.
    error.acceptanceLabel = label
    throw error
  }
}

/** Requires unchanged cursors and failure status for the same source IDs, regardless of database relation order. */
export function assertAcceptancePreservedCursors(priorSources, failedSources) {
  const prior = new Map(priorSources.map((source) => [source.id, source.syncToken]))
  requireAcceptance(prior.size === priorSources.length && failedSources.length === prior.size
    && new Set(failedSources.map((source) => source.id)).size === failedSources.length
    && failedSources.every((source) => prior.has(source.id) && source.syncToken === prior.get(source.id) && source.lastErrorCode === "SYNC_FAILED"), "cursor_preserved")
}

/** Preserves Next's empty action selector; Playwright's multipart-object path drops it. */
export async function encodeAcceptanceActionForm(values) {
  const names = Object.keys(values)
  requireAcceptance(names.length === 2 && names.includes("connectionId"), "action_form_boundary")
  const selector = names.find((name) => /^\$ACTION_ID_[a-f0-9]{42}$/.test(name))
  requireAcceptance(selector && values[selector] === "" && typeof values.connectionId === "string" && values.connectionId.length > 0, "action_form_boundary")
  const form = new FormData()
  for (const [name, value] of Object.entries(values)) form.append(name, value)
  const request = new Request(ACCEPTANCE_ORIGIN + "/calendar/sync", { method: "POST", body: form })
  return { data: Buffer.from(await request.arrayBuffer()), headers: { "content-type": request.headers.get("content-type"), origin: ACCEPTANCE_ORIGIN } }
}

/** Authorizes this one approved run; database identity comes from its new-project receipt. */
export function validateAcceptanceManifest(value, { requireDatabase = true, cleanup = false, now = Date.now() } = {}) {
  requireAcceptance(value?.version === 1 && value.approved === true)
  requireAcceptance(/^[a-f0-9]{32}$/.test(value.runId ?? ""))
  requireAcceptance(value.sourceSha === ACCEPTANCE_BASE && value.origin === ACCEPTANCE_ORIGIN)
  requireAcceptance(isAbsolute(value.appRoot ?? ""))
  const pendingOnly = value.pendingActionOnly === true
  if (pendingOnly) {
    requireAcceptance(!value.credentialFile && !value.googleProjectId && !value.accountEmail && value.sources?.length === 0, "pending_only_boundary")
  } else {
    requireAcceptance(isAbsolute(value.credentialFile ?? ""))
    requireAcceptance(typeof value.googleProjectId === "string" && /^[a-z][a-z0-9-]{5,62}$/.test(value.googleProjectId))
    requireAcceptance(!/(?:^|-)(?:prod|production)(?:-|$)/.test(value.googleProjectId), "production_project")
    requireAcceptance(value.testSetupSaved === true, "test_setup_pending")
    requireAcceptance(typeof value.accountEmail === "string" && /^[^\s@]+@[^\s@]+$/.test(value.accountEmail))
  }
  requireAcceptance(/^[a-f0-9]{64}$/.test(value.authSecret ?? "") && /^[a-f0-9]{64}$/.test(value.encryptionKey ?? ""))
  requireAcceptance(/^[a-f0-9]{64}$/.test(value.startNonce ?? ""))
  requireAcceptance(Array.isArray(value.sources) && value.sources.length === (pendingOnly ? 0 : 2))
  requireAcceptance(new Set(value.sources.map((source) => source.calendarId)).size === value.sources.length)
  for (const [index, source] of value.sources.entries()) {
    requireAcceptance(/^[a-zA-Z0-9_-]+@group\.calendar\.google\.com$/.test(source.calendarId ?? ""))
    requireAcceptance(source.role === (index === 0 ? "owner" : "reader"))
    requireAcceptance(source.summary === ACCEPTANCE_SOURCE_PREFIX + value.runId + " " + (index + 1))
    requireAcceptance(Array.isArray(source.eventIds) && source.eventIds.length === 2)
    requireAcceptance(new Set(source.eventIds).size === 2 && source.eventIds.every((id) => /^[a-z0-9]{5,128}$/.test(id)))
  }
  if (requireDatabase) {
    const db = value.database
    requireAcceptance(db?.createdForRun === value.runId && db.emptyProjectReceipt === true, "database_ownership")
    requireAcceptance(db.plan === "launch" && db.managedByVercel === false && db.pgVersion === 17 && db.region === "aws-us-east-2" && db.compute === 0.25, "database_ownership")
    requireAcceptance(Number.isFinite(db.createdAt) && now >= db.createdAt && (cleanup || now < db.createdAt + (pendingOnly ? 15 : 90) * 60_000), "run_expired")
    let runtime
    let direct
    try { runtime = new URL(db.runtimeUrl); direct = new URL(db.directUrl) } catch { requireAcceptance(false, "database_ownership") }
    requireAcceptance(runtime.hostname.includes("-pooler.") && runtime.hostname.endsWith(".neon.tech"))
    requireAcceptance(direct.hostname.endsWith(".neon.tech") && !direct.hostname.includes("-pooler."))
    requireAcceptance(runtime.hostname.replace("-pooler.", ".") === direct.hostname && direct.hostname === db.endpointHost, "database_ownership")
    requireAcceptance(runtime.pathname === direct.pathname && runtime.username === direct.username, "database_ownership")
    requireAcceptance(/^[a-f0-9]{64}$/.test(db.fingerprint ?? ""), "database_ownership")
  }
  return value
}

/** Uses the retained test download; newly added redirects are established by the owner save receipt. */
export function validateAcceptanceCredential(document, manifest) {
  const client = document?.web
  requireAcceptance(client?.project_id === manifest.googleProjectId, "credential_boundary")
  requireAcceptance(typeof client.client_id === "string" && client.client_id.endsWith(".apps.googleusercontent.com"), "credential_boundary")
  requireAcceptance(typeof client.client_secret === "string" && client.client_secret.length > 10, "credential_boundary")
  requireAcceptance(Array.isArray(client.redirect_uris) && client.redirect_uris.includes("http://localhost:3317/oauth/callback"), "credential_boundary")
  requireAcceptance(client.redirect_uris.every((uri) => uri === "http://localhost:3317/oauth/callback" || uri === ACCEPTANCE_CALLBACK), "credential_boundary")
  return client
}

/** Drops inherited credentials/options, then supplies exactly the receipt-bound disposable pair. */
export function acceptanceEnvironment(manifest, client, inherited = process.env, { cleanup = false } = {}) {
  validateAcceptanceManifest(manifest, { cleanup })
  const system = Object.fromEntries(SYSTEM_ENV_KEYS.filter((key) => inherited[key]).map((key) => [key, inherited[key]]))
  const db = manifest.database
  const env = {
    ...system, ...BROWSER_QA_INERT_PROVIDER_ENVIRONMENT, ...BROWSER_QA_TELEMETRY_ENVIRONMENT,
    NODE_ENV: "development", VERCEL_ENV: "development",
    DATABASE_URL_UNPOOLED: "", BACKGROUND_CREDIT_BACKFILL_DATABASE_URL: "", AUTH_LEGACY_ATTEMPT_CLEANUP_DATABASE_URL: "",
    AUTH_NORMALIZED_EMAIL_CHECK_DATABASE_URL: "", AUTH_SECURITY_NOTICE_RETRY_DATABASE_URL: "",
    AUTH_LEGACY_ATTEMPT_CLEANUP: "0", AUTH_SECURITY_NOTICE_RETRY_DATABASE: "0",
    AUTH_URL: ACCEPTANCE_ORIGIN, NEXTAUTH_URL: ACCEPTANCE_ORIGIN, AUTH_TRUST_HOST: "true",
    AUTH_SECRET: manifest.authSecret, NEXTAUTH_SECRET: manifest.authSecret,
    GOOGLE_CALENDAR_CLIENT_ID: manifest.pendingActionOnly ? "" : client.client_id, GOOGLE_CALENDAR_CLIENT_SECRET: manifest.pendingActionOnly ? "" : client.client_secret,
    GOOGLE_CALENDAR_REDIRECT_URI: manifest.pendingActionOnly ? "" : ACCEPTANCE_CALLBACK, CALENDAR_SYNC_ENCRYPTION_KEY: manifest.encryptionKey,
    DATABASE_URL: db.runtimeUrl, DIRECT_URL: db.directUrl,
    MASSAGELAB_BROWSER_QA_DATABASE: "1",
    MASSAGELAB_BROWSER_QA_DATABASE_URL: db.runtimeUrl, MASSAGELAB_BROWSER_QA_DIRECT_URL: db.directUrl,
    MASSAGELAB_BROWSER_QA_DATABASE_FINGERPRINT: db.fingerprint,
    NEXT_PUBLIC_ATMOSHAPER_BROWSER_QA: "1", NEXT_PUBLIC_RSC_SESSION_PROOF: "1",
  }
  requireAcceptance(isBrowserQaDatabaseTargetAuthorized(env), "database_ownership")
  return env
}

/** Require the narrow Calendar and identity grant; Google's email alias adds no unrelated permission. */
export function validateAcceptanceScopes(scope) {
  const granted = new Set(String(scope ?? "").split(/\s+/).filter(Boolean))
  const actual = [...granted].filter((item) => item.startsWith(CALENDAR_PREFIX))
  requireAcceptance(actual.length === CALENDAR_SCOPES.length && CALENDAR_SCOPES.every((item) => granted.has(item)), "scope_boundary")
  requireAcceptance(granted.has("openid") && (granted.has("email") || granted.has("https://www.googleapis.com/auth/userinfo.email")), "scope_boundary")
  requireAcceptance([...granted].every((item) => APPROVED_SCOPES.has(item)), "scope_boundary")
}

/** Pure dispatch policy: never permit event reads or mutations against an unowned calendar. */
export function authorizeAcceptanceRequest({ request, body, manifest, client, journal }) {
  const url = new URL(request.url)
  const method = request.method
  requireAcceptance(!url.username && !url.password && !url.hash)
  if (url.origin === ACCEPTANCE_ORIGIN) return { kind: "local" }
  requireAcceptance(!manifest.pendingActionOnly, "pending_only_provider_boundary")
  requireAcceptance(url.protocol === "https:" && !url.port, "provider_boundary")
  if (url.href === "https://oauth2.googleapis.com/token" && method === "POST") {
    const values = new URLSearchParams(body)
    requireAcceptance(values.get("client_id") === client.client_id && values.get("client_secret") === client.client_secret, "credential_boundary")
    const grant = values.get("grant_type")
    requireAcceptance(grant === "authorization_code" || grant === "refresh_token")
    if (grant === "authorization_code") {
      requireAcceptance(values.get("redirect_uri") === ACCEPTANCE_CALLBACK && journal.filter((item) => item.kind === "exchange" && item.phase === "intent").length < 3, "consent_limit")
    }
    return { kind: grant === "authorization_code" ? "exchange" : "refresh" }
  }
  if (url.href === "https://oauth2.googleapis.com/revoke" && method === "POST") return { kind: "revoke" }
  requireAcceptance(request.headers.get("authorization")?.startsWith("Bearer "), "credential_boundary")
  if (url.href === "https://openidconnect.googleapis.com/v1/userinfo" && method === "GET") return { kind: "identity" }
  requireAcceptance(url.origin === "https://www.googleapis.com" && url.pathname.startsWith("/calendar/v3/"), "provider_boundary")
  if (url.pathname === "/calendar/v3/users/me/calendarList" && method === "GET") {
    requireAcceptance(url.searchParams.get("showHidden") === "true")
    return { kind: "inventory" }
  }
  const created = journal.filter((item) => item.kind === "calendar-create" && item.phase === "accepted").map((item) => item.calendarId)
  if (url.pathname === "/calendar/v3/calendars" && method === "POST") {
    requireAcceptance(journal.filter((item) => item.kind === "calendar-create" && item.phase === "intent").length < 2, "calendar_limit")
    const payload = JSON.parse(body)
    requireAcceptance(Object.keys(payload).sort().join(",") === "description,summary" && payload.summary === "AtmoShaper" && payload.description === ATMOSHAPER_GOOGLE_CALENDAR_DESCRIPTION)
    return { kind: "calendar-create" }
  }
  const match = /^\/calendar\/v3\/calendars\/([^/]+)(?:\/events(?:\/([^/]+))?)?$/.exec(url.pathname)
  requireAcceptance(match, "provider_boundary")
  const calendarId = decodeURIComponent(match[1])
  const eventId = match[2] ? decodeURIComponent(match[2]) : null
  requireAcceptance(/^[a-zA-Z0-9_-]+@group\.calendar\.google\.com$/.test(calendarId), "fixture_boundary")
  const source = manifest.sources.find((item) => item.calendarId === calendarId)
  const target = created.includes(calendarId)
  requireAcceptance(source || target, "fixture_boundary")
  if (!url.pathname.includes("/events")) {
    if (method === "GET") return { kind: "metadata", calendarId }
    requireAcceptance(target, "fixture_boundary")
    if (method === "PATCH") {
      const payload = JSON.parse(body)
      requireAcceptance(Object.keys(payload).join(",") === "summary" && payload.summary === "AtmoShaper application renamed " + manifest.runId)
      return { kind: "calendar-rename", calendarId }
    }
    if (method === "DELETE") return { kind: "calendar-delete", calendarId }
    requireAcceptance(false, "provider_boundary")
  }
  if (method === "GET") {
    requireAcceptance(!eventId, "fixture_boundary")
    return { kind: "event-read", calendarId, incremental: url.searchParams.has("syncToken") }
  }
  requireAcceptance(target, "fixture_boundary")
  const eventKnown = journal.some((item) => item.kind === "event-create" && item.phase === "accepted" && item.calendarId === calendarId && item.eventId === eventId)
  if (method === "DELETE") {
    requireAcceptance(eventId && eventKnown, "fixture_boundary")
    return { kind: "event-delete", calendarId, eventId }
  }
  requireAcceptance(method === "POST" && !eventId || method === "PATCH" && eventKnown, "fixture_boundary")
  const payload = JSON.parse(body)
  requireAcceptance(Object.keys(payload).sort().join(",") === "end,extendedProperties,start,summary", "payload_boundary")
  requireAcceptance(["AtmoShaper class", "AtmoShaper blocked time", "AtmoShaper appointment"].includes(payload.summary), "payload_boundary")
  requireAcceptance(payload.extendedProperties?.private?.massagelabEventId?.startsWith("calendar-acceptance-" + manifest.runId + "-"), "payload_boundary")
  requireAcceptance(Object.keys(payload.extendedProperties).join(",") === "private" && Object.keys(payload.extendedProperties.private).join(",") === "massagelabEventId", "payload_boundary")
  for (const date of [payload.start, payload.end]) requireAcceptance(Object.keys(date ?? {}).sort().join(",") === "dateTime,timeZone" && Number.isFinite(Date.parse(date.dateTime)) && date.timeZone === "UTC", "payload_boundary")
  requireAcceptance(Date.parse(payload.end.dateTime) > Date.parse(payload.start.dateTime), "payload_boundary")
  if (method === "POST") requireAcceptance(journal.filter((item) => item.kind === "event-create" && item.phase === "intent").length < 2, "event_limit")
  return { kind: method === "POST" ? "event-create" : "event-update", calendarId, eventId }
}
