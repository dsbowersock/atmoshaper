import type { Prisma } from "@prisma/client"
import { calendarSyncWindow, GOOGLE_CALENDAR_CREATION_PENDING_REASON, GOOGLE_CALENDAR_PROVIDER, GOOGLE_CALENDAR_SCOPES } from "./calendar-sync-constants.ts"
import { getGoogleCalendarSyncConfig } from "./calendar-sync-env.ts"
import { decryptCalendarSyncSecret, encryptCalendarSyncSecret } from "./calendar-sync-secrets.ts"
import { createGoogleCalendarAdapter, GoogleCalendarConnectionError, type GoogleCalendarAdapter } from "./google-calendar-adapter.ts"
import {
  buildGoogleOutboundEventPayload,
  normalizeGoogleBusyBlock,
  sanitizeCalendarSyncError,
} from "./calendar-sync-normalization.ts"
import { prisma } from "./prisma.ts"

type CalendarDb = typeof prisma | Prisma.TransactionClient
const GOOGLE_API_STATUS_ERROR_PATTERN = /^Google Calendar request failed with status (\d+)\.$/

/**
 * Keep Calendar metadata/write access limited to calendars created by this app.
 * Extra Calendar grants could make the read-only ownership check accept an
 * unrelated calendar; unrelated identity scopes do not widen Calendar access.
 */
export function assertGoogleCalendarSyncScopes(grantedScopes?: string | null) {
  const scopes = new Set((grantedScopes ?? "").split(/\s+/).filter(Boolean))
  const expected = new Set<string>(GOOGLE_CALENDAR_SCOPES.filter((scope) => scope.startsWith("https://www.googleapis.com/auth/calendar")))
  if ([...expected].some((scope) => !scopes.has(scope))
    || [...scopes].some((scope) => scope.startsWith("https://www.googleapis.com/auth/calendar") && !expected.has(scope))) {
    throw new GoogleCalendarConnectionError("permissions", "Reconnect Google Calendar with the required limited permissions.")
  }
}

/**
 * Produces source selection updates without deleting source rows.
 * Existing calendars remain available for later re-selection.
 */
export function selectedSourceUpdates({
  existingSources,
  selectedProviderCalendarIds,
}: {
  existingSources: Array<{ providerCalendarId: string }>
  selectedProviderCalendarIds: string[]
}) {
  const selected = new Set(selectedProviderCalendarIds)
  return existingSources.map((source) => ({
    providerCalendarId: source.providerCalendarId,
    selectedForBusySync: selected.has(source.providerCalendarId),
  }))
}

/** Builds the successful CalendarSyncRun patch shared by inbound sync writes. */
export function syncRunSuccessPatch({
  finishedAt,
  itemsSeen,
  itemsChanged,
}: {
  finishedAt: Date
  itemsSeen: number
  itemsChanged: number
}) {
  return {
    status: "SUCCEEDED" as const,
    finishedAt,
    itemsSeen,
    itemsChanged,
    errorCode: null,
    errorMessage: null,
  }
}

/** Builds the failed CalendarSyncRun patch with a sanitized provider error. */
export function syncRunFailurePatch({ finishedAt, error }: { finishedAt: Date; error: unknown }) {
  return {
    status: "FAILED" as const,
    finishedAt,
    errorCode: "SYNC_FAILED",
    errorMessage: sanitizeCalendarSyncError(error),
  }
}

/** Extracts the sanitized Google API status code from adapter errors. */
export function googleCalendarSyncErrorStatus(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "")
  const match = GOOGLE_API_STATUS_ERROR_PATTERN.exec(message)
  return match ? Number(match[1]) : null
}

/**
 * Builds the source failure patch. Google 410 means the incremental sync token
 * is stale, so the next run must fall back to a time-windowed full import.
 */
export function syncSourceFailurePatch(error: unknown) {
  const patch = {
    lastErrorCode: "SYNC_FAILED" as const,
    lastErrorMessage: sanitizeCalendarSyncError(error),
  }
  return googleCalendarSyncErrorStatus(error) === 410
    ? { ...patch, syncToken: null }
    : patch
}

/**
 * Returns cancelled Google tombstones that no longer include usable event times.
 * These must delete existing busy rows because they cannot be normalized.
 */
export function cancelledGoogleEventIds(
  events: Array<{ id?: string | null; status?: string | null; start?: unknown; end?: unknown }>,
) {
  return events
    .filter((event) => event.status === "cancelled" && Boolean(event.id) && !event.start && !event.end)
    .map((event) => String(event.id))
}

/**
 * Returns a usable access token for an active Google connection.
 * Cached encrypted access tokens are reused until near expiry; otherwise the
 * stored refresh token is exchanged and the refreshed token is persisted.
 */
export async function refreshGoogleAccessToken(
  connectionId: string,
  adapter: GoogleCalendarAdapter = createGoogleCalendarAdapter(),
) {
  const config = getGoogleCalendarSyncConfig()
  if (!config) throw new Error("Google calendar sync is not configured.")

  const connection = await prisma.calendarConnection.findUnique({ where: { id: connectionId } })
  if (!connection || connection.provider !== GOOGLE_CALENDAR_PROVIDER || connection.status !== "ACTIVE") {
    throw new Error("Choose an active Google calendar connection.")
  }
  assertGoogleCalendarSyncScopes(connection.grantedScopes)
  if (!connection.dedicatedCalendarId) throw new GoogleCalendarConnectionError("target", "Choose a verified AtmoShaper calendar.")

  if (connection.encryptedAccessToken && connection.accessTokenExpiresAt && connection.accessTokenExpiresAt.getTime() > Date.now() + 60_000) {
    const accessToken = decryptCalendarSyncSecret(connection.encryptedAccessToken)
    await adapter.validateDedicatedCalendar(accessToken, { providerAccountId: connection.providerAccountId, calendarId: connection.dedicatedCalendarId })
    return accessToken
  }

  const refreshToken = decryptCalendarSyncSecret(connection.encryptedRefreshToken)
  const token = await adapter.refreshAccessToken({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    refreshToken,
  })
  assertGoogleCalendarSyncScopes(token.scope ?? connection.grantedScopes)
  await adapter.validateDedicatedCalendar(token.access_token, { providerAccountId: connection.providerAccountId, calendarId: connection.dedicatedCalendarId })
  const accessTokenExpiresAt = token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null

  await prisma.calendarConnection.update({
    where: { id: connection.id },
    data: {
      encryptedAccessToken: encryptCalendarSyncSecret(token.access_token),
      accessTokenExpiresAt,
      grantedScopes: token.scope ?? connection.grantedScopes,
      status: "ACTIVE",
      statusReason: null,
    },
  })

  return token.access_token
}

/**
 * Imports selected Google calendars into generic busy blocks for one connection.
 * It locks the parent connection row while writing busy data so scheduling
 * transactions can coordinate against concurrent inbound sync writes.
 */
export async function syncGoogleConnectionSources({
  connectionId,
  adapter = createGoogleCalendarAdapter(),
  now = new Date(),
}: {
  connectionId: string
  adapter?: GoogleCalendarAdapter
  now?: Date
}) {
  const accessToken = await refreshGoogleAccessToken(connectionId, adapter)
  const connection = await prisma.calendarConnection.findUnique({
    where: { id: connectionId },
    include: { sources: true },
  })
  if (!connection) throw new Error("Choose an active Google calendar connection.")

  const window = calendarSyncWindow(now)
  let itemsSeen = 0
  let itemsChanged = 0

  for (const source of connection.sources.filter((item) => item.selectedForBusySync)) {
    const run = await prisma.calendarSyncRun.create({
      data: {
        connectionId: connection.id,
        sourceId: source.id,
        direction: "INBOUND",
        status: "STARTED",
        windowStart: window.startsAt,
        windowEnd: window.endsAt,
      },
    })

    try {
      const payload = await adapter.listEvents({
        accessToken,
        calendarId: source.providerCalendarId,
        timeMin: source.syncToken ? undefined : window.startsAt.toISOString(),
        timeMax: source.syncToken ? undefined : window.endsAt.toISOString(),
        syncToken: source.syncToken,
      })
      const events = payload.items ?? []
      const deletedProviderEventIds = cancelledGoogleEventIds(events)
      const blocks = events
        .map((event) => normalizeGoogleBusyBlock({
          ownerUserId: connection.userId,
          connectionId: connection.id,
          sourceId: source.id,
          providerCalendarId: source.providerCalendarId,
          sourceTimezone: source.timezone,
          event,
        }))
        .filter((block): block is NonNullable<typeof block> => Boolean(block))

      itemsSeen += events.length

      const { sourceItemsChanged } = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`
          SELECT id
          FROM "CalendarConnection"
          WHERE id = ${connection.id}
          FOR UPDATE
        `
        const deletedBusyBlocks = deletedProviderEventIds.length
          ? await tx.externalCalendarBusyBlock.deleteMany({
              where: {
                sourceId: source.id,
                providerEventId: { in: deletedProviderEventIds },
              },
            })
          : { count: 0 }
        const sourceItemsChanged = blocks.length + deletedBusyBlocks.count

        for (const block of blocks) {
          await tx.externalCalendarBusyBlock.upsert({
            where: {
              sourceId_providerEventId: {
                sourceId: source.id,
                providerEventId: block.providerEventId,
              },
            },
            create: block,
            update: {
              providerEventEtag: block.providerEventEtag,
              startsAt: block.startsAt,
              endsAt: block.endsAt,
              timezone: block.timezone,
              allDay: block.allDay,
              transparency: block.transparency,
              status: block.status,
              cancelledAt: block.status === "CANCELLED" ? block.cancelledAt ?? undefined : null,
            },
          })
        }
        await tx.externalCalendarSource.update({
          where: { id: source.id },
          data: {
            syncToken: payload.nextSyncToken ?? source.syncToken,
            lastIncrementalSyncAt: source.syncToken ? new Date() : source.lastIncrementalSyncAt,
            lastFullSyncAt: source.syncToken ? source.lastFullSyncAt : new Date(),
            lastErrorCode: null,
            lastErrorMessage: null,
          },
        })
        await tx.calendarSyncRun.update({
          where: { id: run.id },
          data: syncRunSuccessPatch({
            finishedAt: new Date(),
            itemsSeen: events.length,
            itemsChanged: sourceItemsChanged,
          }),
        })
        return { sourceItemsChanged }
      })
      itemsChanged += sourceItemsChanged
    } catch (error) {
      await prisma.calendarSyncRun.update({
        where: { id: run.id },
        data: syncRunFailurePatch({ finishedAt: new Date(), error }),
      })
      await prisma.externalCalendarSource.update({
        where: { id: source.id },
        data: syncSourceFailurePatch(error),
      })
    }
  }

  await prisma.calendarConnection.update({
    where: { id: connection.id },
    data: { lastSyncedAt: new Date() },
  })

  return { itemsSeen, itemsChanged }
}

/**
 * Upserts available Google calendars without changing existing selections.
 * Excluded calendars are removed first so outbound-only calendars never appear
 * as selectable inbound busy sources after reconnects.
 */
export async function upsertGoogleCalendarSources({
  db = prisma,
  connectionId,
  calendars,
  excludedProviderCalendarIds = [],
}: {
  db?: CalendarDb
  connectionId: string
  calendars: Array<{ id: string; summary?: string; timeZone?: string; primary?: boolean }>
  excludedProviderCalendarIds?: string[]
}) {
  const excludedIds = new Set(excludedProviderCalendarIds.filter(Boolean))
  if (excludedIds.size > 0) {
    await db.externalCalendarSource.deleteMany({
      where: {
        connectionId,
        providerCalendarId: { in: [...excludedIds] },
      },
    })
  }

  for (const calendar of calendars) {
    if (excludedIds.has(calendar.id)) continue

    await db.externalCalendarSource.upsert({
      where: {
        connectionId_providerCalendarId: {
          connectionId,
          providerCalendarId: calendar.id,
        },
      },
      create: {
        connectionId,
        providerCalendarId: calendar.id,
        label: calendar.summary ?? null,
        timezone: calendar.timeZone ?? null,
        selectedForBusySync: Boolean(calendar.primary),
      },
      update: {
        label: calendar.summary ?? null,
        timezone: calendar.timeZone ?? null,
      },
    })
  }
}

/** Returns whether a MassageLab calendar event should be mirrored to Google. */
export function calendarEventShouldPushToGoogle(event: { kind?: string | null; ownerUserId?: string | null; status?: string | null }) {
  return Boolean(event.ownerUserId && ["APPOINTMENT", "CLASS", "PERSONAL"].includes(String(event.kind ?? "")))
}

/** Maps MassageLab event status to the Google outbound operation. */
export function outboundSyncActionForStatus(status?: string | null) {
  if (status === "CANCELLED") return "DELETE" as const
  if (status === "COMPLETED" || status === "NO_SHOW") return "SKIP" as const
  return "UPSERT" as const
}

/** Builds the error patch stored on existing outbound event links. */
export function outboundSyncFailurePatch(error: unknown) {
  return {
    lastErrorCode: "PUSH_FAILED",
    lastErrorMessage: sanitizeCalendarSyncError(error),
  }
}

/**
 * Pushes one eligible MassageLab calendar event into the dedicated Google
 * calendar and stores the Google event link for future reconciliation.
 */
export async function pushCalendarEventToGoogle(
  calendarEventId: string,
  adapter: GoogleCalendarAdapter = createGoogleCalendarAdapter(),
) {
  const event = await prisma.calendarEvent.findUnique({
    where: { id: calendarEventId },
    include: { externalCalendarLinks: true },
  })
  if (!event || !calendarEventShouldPushToGoogle(event) || !event.ownerUserId) return { skipped: true }

  const connection = await prisma.calendarConnection.findFirst({
    where: {
      userId: event.ownerUserId,
      provider: GOOGLE_CALENDAR_PROVIDER,
      status: "ACTIVE",
      dedicatedCalendarId: { not: null },
    },
    orderBy: { updatedAt: "desc" },
  })
  if (!connection?.dedicatedCalendarId) return { skipped: true }

  const accessToken = await refreshGoogleAccessToken(connection.id, adapter)
  const existingLink = event.externalCalendarLinks.find((link) => link.connectionId === connection.id) ?? null
  // A provider event ID is meaningful only within its original calendar.
  // Never PATCH or DELETE a stale mapping through a different target.
  if (existingLink && (existingLink.provider !== GOOGLE_CALENDAR_PROVIDER || existingLink.providerCalendarId !== connection.dedicatedCalendarId)) {
    throw new GoogleCalendarConnectionError("target", "The saved Google event belongs to a different calendar.")
  }
  const action = outboundSyncActionForStatus(event.status)

  if (action === "SKIP") return { skipped: true }

  if (action === "DELETE" && existingLink?.providerEventId) {
    await adapter.deleteEvent({
      accessToken,
      calendarId: connection.dedicatedCalendarId,
      eventId: existingLink.providerEventId,
    })
    await prisma.externalCalendarEventLink.delete({ where: { id: existingLink.id } })
    return { deleted: true }
  }

  if (action === "DELETE" && existingLink) {
    await prisma.externalCalendarEventLink.delete({ where: { id: existingLink.id } })
    return { deleted: true }
  }

  if (action === "DELETE") return { skipped: true }

  const payload = buildGoogleOutboundEventPayload({
    calendarEventId: event.id,
    kind: event.kind,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    timezone: event.timezone,
  })
  const pushed = await adapter.upsertEvent({
    accessToken,
    calendarId: connection.dedicatedCalendarId,
    eventId: existingLink?.providerEventId ?? null,
    payload,
  })

  await prisma.externalCalendarEventLink.upsert({
    where: {
      connectionId_calendarEventId: {
        connectionId: connection.id,
        calendarEventId: event.id,
      },
    },
    create: {
      connectionId: connection.id,
      calendarEventId: event.id,
      provider: GOOGLE_CALENDAR_PROVIDER,
      providerCalendarId: connection.dedicatedCalendarId,
      providerEventId: pushed.id,
      providerEventEtag: pushed.etag ?? null,
      lastPushedAt: new Date(),
      lastErrorCode: null,
      lastErrorMessage: null,
    },
    update: {
      providerCalendarId: connection.dedicatedCalendarId,
      providerEventId: pushed.id,
      providerEventEtag: pushed.etag ?? null,
      lastPushedAt: new Date(),
      lastErrorCode: null,
      lastErrorMessage: null,
    },
  })

  return { pushed: true }
}

/**
 * Best-effort outbound sync wrapper for already-committed calendar mutations.
 * Google failures are recorded on existing links when possible, but they do not
 * make the primary MassageLab save look failed to the user.
 */
export async function pushCalendarEventToGoogleBestEffort(
  calendarEventId: string,
  adapter: GoogleCalendarAdapter = createGoogleCalendarAdapter(),
) {
  try {
    return await pushCalendarEventToGoogle(calendarEventId, adapter)
  } catch (error) {
    await recordGoogleCalendarEventPushFailure({ calendarEventId, error })
    return { pushed: false, error: sanitizeCalendarSyncError(error) }
  }
}

async function recordGoogleCalendarEventPushFailure({
  calendarEventId,
  error,
}: {
  calendarEventId: string
  error: unknown
}) {
  try {
    const event = await prisma.calendarEvent.findUnique({
      where: { id: calendarEventId },
      include: { externalCalendarLinks: true },
    })
    if (!event?.ownerUserId) return

    const connection = await prisma.calendarConnection.findFirst({
      where: {
        userId: event.ownerUserId,
        provider: GOOGLE_CALENDAR_PROVIDER,
        status: "ACTIVE",
        dedicatedCalendarId: { not: null },
      },
      orderBy: { updatedAt: "desc" },
    })
    if (!connection?.dedicatedCalendarId) return

    await prisma.externalCalendarEventLink.upsert({
      where: {
        connectionId_calendarEventId: {
          connectionId: connection.id,
          calendarEventId: event.id,
        },
      },
      create: {
        connectionId: connection.id,
        calendarEventId: event.id,
        provider: GOOGLE_CALENDAR_PROVIDER,
        providerCalendarId: connection.dedicatedCalendarId,
        providerEventId: null,
        ...outboundSyncFailurePatch(error),
      },
      update: outboundSyncFailurePatch(error),
    })
  } catch {
    // Preserve the primary calendar action even if failure bookkeeping fails.
  }
}

/**
 * Persists an active Google connection or a verified-account creation intent.
 * A reconnect may refresh tokens, but cannot silently replace an account or
 * target and invalidate its event links. Changing accounts requires disconnect.
 * Pending creation stores encrypted credentials with ERROR status and no
 * target; it cannot sync until readback succeeds and activation clears the reason.
 */
export async function saveGoogleCalendarConnection({
  userId,
  providerAccountId,
  accountEmail,
  accessToken,
  refreshToken,
  expiresIn,
  grantedScopes,
  dedicatedCalendarId,
  dedicatedCalendarSummary,
  creationPending = false,
  db,
}: {
  userId: string
  providerAccountId: string
  accountEmail?: string | null
  accessToken: string
  refreshToken: string
  expiresIn?: number | null
  grantedScopes?: string | null
  dedicatedCalendarId?: string | null
  dedicatedCalendarSummary?: string | null
  creationPending?: boolean
  db?: Prisma.TransactionClient
}) {
  const accessTokenExpiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null

  const save = async (tx: Prisma.TransactionClient) => {
    await tx.$queryRaw`
      SELECT id
      FROM "User"
      WHERE id = ${userId}
      FOR UPDATE
    `
    const existing = await tx.calendarConnection.findMany({ where: { userId, provider: GOOGLE_CALENDAR_PROVIDER } })
    if (existing.some((connection) => (connection.status === "ACTIVE" && connection.providerAccountId !== providerAccountId)
      || (connection.providerAccountId === providerAccountId && connection.dedicatedCalendarId && connection.dedicatedCalendarId !== dedicatedCalendarId))) {
      throw new GoogleCalendarConnectionError("target", "Disconnect the existing Google calendar connection before changing accounts or targets.")
    }

    return tx.calendarConnection.upsert({
      where: {
        userId_provider_providerAccountId: {
          userId,
          provider: GOOGLE_CALENDAR_PROVIDER,
          providerAccountId,
        },
      },
      create: {
        userId,
        provider: GOOGLE_CALENDAR_PROVIDER,
        providerAccountId,
        accountEmail,
        encryptedRefreshToken: encryptCalendarSyncSecret(refreshToken),
        encryptedAccessToken: encryptCalendarSyncSecret(accessToken),
        accessTokenExpiresAt,
        grantedScopes: grantedScopes ?? "",
        status: creationPending ? "ERROR" : "ACTIVE",
        statusReason: creationPending ? GOOGLE_CALENDAR_CREATION_PENDING_REASON : null,
        dedicatedCalendarId,
        dedicatedCalendarSummary,
      },
      update: {
        accountEmail,
        encryptedRefreshToken: encryptCalendarSyncSecret(refreshToken),
        encryptedAccessToken: encryptCalendarSyncSecret(accessToken),
        accessTokenExpiresAt,
        grantedScopes: grantedScopes ?? "",
        status: creationPending ? "ERROR" : "ACTIVE",
        statusReason: creationPending ? GOOGLE_CALENDAR_CREATION_PENDING_REASON : null,
        dedicatedCalendarId,
        dedicatedCalendarSummary,
      },
    })
  }
  return db ? save(db) : prisma.$transaction(save)
}

/**
 * Completes the callback using this user's existing account-bound target.
 * A committed inactive intent precedes Google creation. Later callbacks can
 * reconcile a discovered target but cannot blindly repeat an uncertain POST.
 * Each phase retains the user-row lock; existing targets are never adopted
 * across accounts, reset, renamed, deleted, or copied.
 */
export async function connectGoogleCalendar({ userId, token, adapter = createGoogleCalendarAdapter() }: {
  userId: string
  token: Awaited<ReturnType<GoogleCalendarAdapter["exchangeCode"]>>
  adapter?: GoogleCalendarAdapter
}) {
  if (!token.googleUserId || !token.refresh_token) throw new Error("Google calendar connection identity and refresh token are required.")
  assertGoogleCalendarSyncScopes(token.scope)
  const providerAccountId = token.googleUserId
  const refreshToken = token.refresh_token
  const credentials = {
    userId, providerAccountId, accountEmail: token.googleUserEmail ?? null,
    accessToken: token.access_token, refreshToken,
    expiresIn: token.expires_in, grantedScopes: token.scope,
  }
  // Start before lock acquisition; leave 15 seconds of the transaction budget
  // for database work, and stop paginated provider calls before lock expiry.
  const providerDeadline = AbortSignal.timeout(30_000)
  /** Serialize account continuity and return this account's history in either phase. */
  const readConnection = async (tx: Prisma.TransactionClient) => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`
    const existing = await tx.calendarConnection.findMany({ where: { userId, provider: GOOGLE_CALENDAR_PROVIDER } })
    // Superseded/inactive rows are retained history, not a second active account.
    if (existing.some((item) => item.status === "ACTIVE" && item.providerAccountId !== providerAccountId)) {
      throw new GoogleCalendarConnectionError("account", "Disconnect the existing Google calendar connection before changing accounts.")
    }
    return existing.find((item) => item.providerAccountId === providerAccountId)
  }
  /** Activate only a validated target and commit its source inventory together. */
  const saveTarget = async (tx: Prisma.TransactionClient, dedicatedCalendar: Awaited<ReturnType<GoogleCalendarAdapter["ensureDedicatedCalendar"]>>) => {
    const saved = await saveGoogleCalendarConnection({
      ...credentials,
      dedicatedCalendarId: dedicatedCalendar.id, dedicatedCalendarSummary: dedicatedCalendar.summary, db: tx,
    })
    await upsertGoogleCalendarSources({
      connectionId: saved.id, calendars: await adapter.listCalendars(token.access_token, providerDeadline),
      excludedProviderCalendarIds: [dedicatedCalendar.id], db: tx,
    })
    providerDeadline.throwIfAborted()
    return saved
  }
  const prepared = await prisma.$transaction(async (tx) => {
    const existing = await readConnection(tx)
    const dedicatedCalendar = await adapter.findDedicatedCalendar(token.access_token, {
      providerAccountId,
      storedCalendarId: existing?.dedicatedCalendarId,
      signal: providerDeadline,
    })
    if (dedicatedCalendar) return await saveTarget(tx, dedicatedCalendar)
    if (existing?.statusReason === GOOGLE_CALENDAR_CREATION_PENDING_REASON) {
      throw new GoogleCalendarConnectionError("target", "Google calendar creation is unresolved. Reconcile the existing attempt before retrying.")
    }
    // Commit a verified-account, encrypted, inactive intent before any POST.
    // A timeout/rollback in the next transaction must not erase that attempt.
    await saveGoogleCalendarConnection({ ...credentials, creationPending: true, db: tx })
    providerDeadline.throwIfAborted()
    return null
  }, { timeout: 45_000 })
  const connection = prepared ?? await prisma.$transaction(async (tx) => {
    const intent = await readConnection(tx)
    if (intent?.statusReason !== GOOGLE_CALENDAR_CREATION_PENDING_REASON || intent.dedicatedCalendarId) {
      throw new GoogleCalendarConnectionError("target", "Google calendar creation state changed. Reconnect to validate its target.")
    }
    // Only the invocation that committed a new intent reaches this phase.
    // Other callbacks may discover a completed target, but never issue a POST.
    const dedicatedCalendar = await adapter.ensureDedicatedCalendar(token.access_token, {
      providerAccountId, signal: providerDeadline,
    })
    return await saveTarget(tx, dedicatedCalendar)
  }, { timeout: 45_000 }).catch((error: unknown) => {
    if (error instanceof GoogleCalendarConnectionError) throw error
    throw new GoogleCalendarConnectionError("target", "Google calendar creation is unresolved. Reconcile the existing attempt before retrying.")
  })
  await syncGoogleConnectionSources({ connectionId: connection.id, adapter })
  return connection
}
