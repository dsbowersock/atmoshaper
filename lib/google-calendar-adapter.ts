import { Buffer } from "node:buffer"

import { ATMOSHAPER_GOOGLE_CALENDAR_DESCRIPTION, GOOGLE_CALENDAR_SCOPES, MASSAGELAB_GOOGLE_CALENDAR_SUMMARY } from "./calendar-sync-constants.ts"

type FetchImpl = typeof fetch

export type GoogleCalendarListItem = {
  id: string
  summary?: string
  description?: string
  timeZone?: string
  primary?: boolean
  accessRole?: string
}

export type GoogleCalendarEventDate = {
  date?: string
  dateTime?: string
  timeZone?: string
}

export type GoogleCalendarEvent = {
  id: string
  etag?: string
  status?: string
  transparency?: string
  start?: GoogleCalendarEventDate
  end?: GoogleCalendarEventDate
  updated?: string
}

type GoogleCalendarEventsPage = {
  items?: GoogleCalendarEvent[]
  nextPageToken?: string
  nextSyncToken?: string
}

export type GoogleOutboundEventPayload = {
  summary: string
  start: { dateTime: string; timeZone: string }
  end: { dateTime: string; timeZone: string }
  extendedProperties: { private: Record<string, string> }
}

export type GoogleCalendarAdapter = ReturnType<typeof createGoogleCalendarAdapter>

export type GoogleCalendarIdTokenClaims = {
  sub: string
  email?: string
}

/** Safe connection outcomes for the callback UI; no provider payload is exposed. */
export class GoogleCalendarConnectionError extends Error {
  readonly reason: "account" | "target" | "permissions"

  constructor(reason: GoogleCalendarConnectionError["reason"], message: string) {
    super(message)
    this.reason = reason
  }
}

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3"
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"
const GOOGLE_REQUEST_TIMEOUT_MS = 8_000

/**
 * Builds the explicit Google OAuth URL for provider calendar sync.
 * This requests offline Calendar API scopes and keeps calendar consent separate
 * from sign-in so AtmoShaper can store a provider-owned refresh token.
 */
export function buildGoogleCalendarAuthUrl({
  clientId,
  redirectUri,
  state,
}: {
  clientId: string
  redirectUri: string
  state: string
}) {
  const url = new URL(GOOGLE_AUTH_URL)
  url.searchParams.set("client_id", clientId)
  url.searchParams.set("redirect_uri", redirectUri)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("access_type", "offline")
  url.searchParams.set("prompt", "consent")
  url.searchParams.set("include_granted_scopes", "true")
  url.searchParams.set("scope", GOOGLE_CALENDAR_SCOPES.join(" "))
  url.searchParams.set("state", state)
  return url.toString()
}

/**
 * Returns the safe, persisted error message for Google API status failures.
 * Response bodies may contain account or token details, so callers only keep
 * the HTTP status in stored sync errors.
 */
export function googleCalendarApiErrorMessage(status: number) {
  return `Google Calendar request failed with status ${status}.`
}

export function decodeGoogleCalendarIdTokenClaims(idToken?: string | null): GoogleCalendarIdTokenClaims | null {
  const payload = idToken?.split(".")[1]
  if (!payload) return null

  try {
    const value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))
    return typeof value?.sub === "string" && value.sub
      ? { sub: value.sub, email: typeof value.email === "string" ? value.email : undefined }
      : null
  } catch {
    return null
  }
}

/**
 * Creates a small Google Calendar REST adapter.
 * Methods throw sanitized status errors for non-expected responses and return
 * only the fields AtmoShaper needs for token storage, busy-time import, and
 * generic outbound event writes.
 */
export function createGoogleCalendarAdapter({ fetchImpl = fetch }: { fetchImpl?: FetchImpl } = {}) {
  async function googleJson<T>(url: string, init: RequestInit, expectedStatuses = [200], { timeoutRequest = true } = {}) {
    // Bound ordinary requests and honor the callback's shared discovery deadline:
    // many short paginated requests must not outlive the transaction lock.
    const requestDeadline = timeoutRequest ? AbortSignal.timeout(GOOGLE_REQUEST_TIMEOUT_MS) : undefined
    const signal = init.signal && requestDeadline ? AbortSignal.any([init.signal, requestDeadline]) : init.signal ?? requestDeadline
    signal?.throwIfAborted()
    const response = await fetchImpl(url, { ...init, signal })
    if (!expectedStatuses.includes(response.status)) {
      throw new Error(googleCalendarApiErrorMessage(response.status))
    }

    signal?.throwIfAborted()
    if (response.status === 204) {
      return null as T
    }

    const data = await response.json() as T
    signal?.throwIfAborted()
    return data
  }

  function authHeaders(accessToken: string, contentType = false) {
    return {
      Authorization: `Bearer ${accessToken}`,
      ...(contentType ? { "Content-Type": "application/json" } : {}),
    }
  }

  async function exchangeCode({
    clientId,
    clientSecret,
    redirectUri,
    code,
  }: {
    clientId: string
    clientSecret: string
    redirectUri: string
    code: string
  }) {
    const token = await googleJson<{
      access_token: string
      expires_in?: number
      refresh_token?: string
      scope?: string
      token_type?: string
      id_token?: string
    }>(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
        grant_type: "authorization_code",
      }),
    })
    const claims = decodeGoogleCalendarIdTokenClaims(token.id_token)
    return {
      ...token,
      googleUserId: claims?.sub,
      googleUserEmail: claims?.email,
    }
  }

  async function refreshAccessToken({
    clientId,
    clientSecret,
    refreshToken,
  }: {
    clientId: string
    clientSecret: string
    refreshToken: string
  }) {
    return googleJson<{ access_token: string; expires_in?: number; scope?: string; token_type?: string }>(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    })
  }

  async function listCalendars(accessToken: string, signal?: AbortSignal) {
    const items: GoogleCalendarListItem[] = []
    let pageToken: string | undefined
    do {
      const url = new URL(`${GOOGLE_CALENDAR_API}/users/me/calendarList`)
      // Hidden calendars still count for identity and ambiguity checks.
      url.searchParams.set("showHidden", "true")
      if (pageToken) url.searchParams.set("pageToken", pageToken)
      const page = await googleJson<{ items?: GoogleCalendarListItem[]; nextPageToken?: string }>(url.toString(), {
        headers: authHeaders(accessToken),
        signal,
      })
      items.push(...(page.items ?? []))
      pageToken = page.nextPageToken
    } while (pageToken)
    return items
  }

  /** Binds Calendar access to Google's subject, never a mutable email or title. */
  async function validateAccount(accessToken: string, providerAccountId: string, signal?: AbortSignal) {
    if (!providerAccountId) throw new GoogleCalendarConnectionError("account", "Google calendar account identity is required.")
    const identity = await googleJson<{ sub?: string }>(GOOGLE_USERINFO_URL, {
      headers: authHeaders(accessToken),
      signal,
    })
    if (identity.sub !== providerAccountId) throw new GoogleCalendarConnectionError("account", "Google calendar account identity changed.")
  }

  /**
   * Requires an owned, secondary, app-marked calendar and reads its metadata.
   * With the existing narrow scopes, calendars.get is authorized by app.created;
   * the marker also separates this project from a calendar created by the old app.
   * Stored IDs survive renames, but inaccessible or unmarked IDs never fall back.
   */
  async function validateCalendar(accessToken: string, calendarId: string, calendars: GoogleCalendarListItem[], signal?: AbortSignal) {
    const entry = calendars.find((calendar) => calendar.id === calendarId)
    if (!entry || entry.primary || entry.accessRole !== "owner" || entry.description !== ATMOSHAPER_GOOGLE_CALENDAR_DESCRIPTION) {
      throw new GoogleCalendarConnectionError("target", "Choose a verified AtmoShaper calendar.")
    }
    const calendar = await googleJson<GoogleCalendarListItem>(`${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}`, {
      headers: authHeaders(accessToken),
      signal,
    })
    if (calendar.id !== calendarId || calendar.description !== ATMOSHAPER_GOOGLE_CALENDAR_DESCRIPTION) {
      throw new GoogleCalendarConnectionError("target", "Choose a verified AtmoShaper calendar.")
    }
    return calendar
  }

  /** Read-only target check used before either inbound or outbound sync. */
  async function validateDedicatedCalendar(accessToken: string, { providerAccountId, calendarId }: { providerAccountId: string; calendarId: string }) {
    await validateAccount(accessToken, providerAccountId)
    return validateCalendar(accessToken, calendarId, await listCalendars(accessToken))
  }

  /** Read-only discovery: absence is distinct from an invalid or ambiguous target. */
  async function findDedicatedCalendar(accessToken: string, { providerAccountId, storedCalendarId, signal }: { providerAccountId: string; storedCalendarId?: string | null; signal?: AbortSignal }) {
    await validateAccount(accessToken, providerAccountId, signal)
    const calendars = await listCalendars(accessToken, signal)
    if (storedCalendarId) return validateCalendar(accessToken, storedCalendarId, calendars, signal)

    const candidates = calendars.filter((calendar) => calendar.summary === MASSAGELAB_GOOGLE_CALENDAR_SUMMARY
      || calendar.description === ATMOSHAPER_GOOGLE_CALENDAR_DESCRIPTION)
    if (candidates.length > 1) throw new GoogleCalendarConnectionError("target", "AtmoShaper calendar selection is ambiguous.")
    if (candidates.length === 1) return validateCalendar(accessToken, candidates[0].id, calendars, signal)
    return null
  }

  /**
   * Creates only after validated discovery finds no target. The service must
   * durably record creation intent first, because Google inserts are not atomic
   * with our transaction and may complete after a local abort.
   */
  async function ensureDedicatedCalendar(accessToken: string, options: { providerAccountId: string; storedCalendarId?: string | null; signal?: AbortSignal }) {
    const found = await findDedicatedCalendar(accessToken, options)
    if (found) return found
    const { signal } = options
    const created = await googleJson<GoogleCalendarListItem>(`${GOOGLE_CALENDAR_API}/calendars`, {
      method: "POST",
      headers: authHeaders(accessToken, true),
      body: JSON.stringify({ summary: MASSAGELAB_GOOGLE_CALENDAR_SUMMARY, description: ATMOSHAPER_GOOGLE_CALENDAR_DESCRIPTION }),
      signal,
    }, [200, 201])
    if (!created.id) throw new Error("Google did not return a dedicated calendar identity.")
    // Verify creation before saving tokens or sending events; an interrupted
    // connection can rediscover this marker without creating another calendar.
    return validateCalendar(accessToken, created.id, await listCalendars(accessToken, signal), signal)
  }

  async function listEvents({
    accessToken,
    calendarId,
    timeMin,
    timeMax,
    syncToken,
  }: {
    accessToken: string
    calendarId: string
    timeMin?: string
    timeMax?: string
    syncToken?: string | null
  }) {
    const url = new URL(`${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`)
    url.searchParams.set("singleEvents", "true")
    url.searchParams.set("showDeleted", "true")
    url.searchParams.set("maxResults", "2500")
    if (syncToken) {
      url.searchParams.set("syncToken", syncToken)
    } else {
      if (timeMin) url.searchParams.set("timeMin", timeMin)
      if (timeMax) url.searchParams.set("timeMax", timeMax)
    }

    const items: GoogleCalendarEvent[] = []
    let pageToken: string | undefined
    let nextSyncToken: string | undefined

    do {
      const pageUrl = new URL(url)
      if (pageToken) pageUrl.searchParams.set("pageToken", pageToken)

      const page = await googleJson<GoogleCalendarEventsPage>(pageUrl.toString(), {
        headers: authHeaders(accessToken),
      })
      items.push(...(page.items ?? []))
      pageToken = page.nextPageToken
      nextSyncToken = page.nextSyncToken ?? nextSyncToken
    } while (pageToken)

    return { items, nextSyncToken }
  }

  async function upsertEvent({
    accessToken,
    calendarId,
    eventId,
    payload,
  }: {
    accessToken: string
    calendarId: string
    eventId: string | null
    payload: GoogleOutboundEventPayload
  }) {
    const base = `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`
    const url = eventId ? `${base}/${encodeURIComponent(eventId)}` : base
    // New inserts use provider-generated IDs. Locally timing out an accepted
    // POST would lose its ID and turn the next retry into a duplicate. Preserve
    // the existing wait behavior until a separate idempotency migration.
    return googleJson<{ id: string; etag?: string }>(url, {
      method: eventId ? "PATCH" : "POST",
      headers: authHeaders(accessToken, true),
      body: JSON.stringify(payload),
    }, eventId ? [200] : [200, 201], { timeoutRequest: Boolean(eventId) })
  }

  async function deleteEvent({
    accessToken,
    calendarId,
    eventId,
  }: {
    accessToken: string
    calendarId: string
    eventId: string
  }) {
    await googleJson<null>(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: "DELETE",
        headers: authHeaders(accessToken),
      },
      [200, 204, 404, 410],
    )
  }

  return {
    deleteEvent,
    ensureDedicatedCalendar,
    findDedicatedCalendar,
    exchangeCode,
    listCalendars,
    listEvents,
    refreshAccessToken,
    upsertEvent,
    validateDedicatedCalendar,
  }
}
