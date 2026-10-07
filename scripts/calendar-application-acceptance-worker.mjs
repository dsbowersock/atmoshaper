import { readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { randomBytes } from "node:crypto"
import { chromium } from "@playwright/test"
import { loadAcceptanceConfig } from "./calendar-application-acceptance.mjs"
import { acceptanceStore, createAcceptanceFetch } from "./calendar-application-acceptance-guard.mjs"
import { requireAcceptance, ACCEPTANCE_ORIGIN } from "./calendar-application-acceptance-core.mjs"
import { createBrowserUserFixtureIdentity, createBrowserUserFixtureRecord } from "../lib/auth/browser-user-fixture.ts"
import { installSignedInSessionCookie } from "../tests/browser/signed-in-session-cookie.ts"
import { prisma } from "../lib/prisma.ts"
import { getGoogleCalendarSyncAccess } from "../lib/calendar-sync-access.ts"
import { createGoogleCalendarAdapter } from "../lib/google-calendar-adapter.ts"
import { connectGoogleCalendar, pushCalendarEventToGoogle, syncGoogleConnectionSources } from "../lib/calendar-sync-service.ts"
import { decryptCalendarSyncSecret } from "../lib/calendar-sync-secrets.ts"
import { GOOGLE_CALENDAR_CREATION_PENDING_REASON } from "../lib/calendar-sync-constants.ts"

/** Exercises the merged services with real PostgreSQL and Google successes; injected faults are labelled. */
async function main() {
  const [mode, stage] = process.argv.slice(2)
  const { manifest, client, directory } = await loadAcceptanceConfig(process.env.ATMOSHAPER_CALENDAR_ACCEPTANCE_CONFIG, { cleanup: mode === "cleanup" })
  const store = acceptanceStore(directory, manifest.encryptionKey)
  const controlPath = join(directory, "control.json")
  const setFault = async (faultMode = "none") => writeFile(controlPath, JSON.stringify({ mode: faultMode }))
  const guardedFetch = createAcceptanceFetch({ manifest, client, store, cleanup: mode === "cleanup", control: async () => {
    try { return JSON.parse(await readFile(controlPath, "utf8")) } catch { return {} }
  } })
  globalThis.fetch = guardedFetch
  const adapter = createGoogleCalendarAdapter({ fetchImpl: guardedFetch })
  const identity = createBrowserUserFixtureIdentity("calendar-acceptance", manifest.runId)
  const userId = identity.user.id
  const practiceId = "calendar-acceptance-" + manifest.runId
  const receipt = async (caseName, detail = {}) => {
    await store.locked(() => store.record({ kind: "case", phase: "passed", caseName, ...detail }))
    console.log("ACCEPTANCE: " + caseName + " passed")
  }
  const connection = () => prisma.calendarConnection.findFirst({ where: { userId, provider: "GOOGLE" }, include: { sources: true } })
  const calendarCreates = async () => (await store.journal()).filter((item) => item.kind === "calendar-create" && item.phase === "accepted")
  const freshToken = async () => {
    const token = (await store.vault()).findLast((item) => item.refresh_token && item.id_token)
    requireAcceptance(token, "missing_fresh_token")
    const claims = JSON.parse(Buffer.from(token.id_token.split(".")[1], "base64url").toString("utf8"))
    return { ...token, googleUserId: claims.sub, googleUserEmail: claims.email }
  }
  const withBrowser = async (action) => {
    const browser = await chromium.launch({ headless: true })
    const context = await browser.newContext()
    await installSignedInSessionCookie(context, ACCEPTANCE_ORIGIN, identity.user)
    const page = await context.newPage()
    // Local UI alone is automated; Google console/consent screens remain owner-operated.
    await page.route("**/*", (route) => new URL(route.request().url()).origin === ACCEPTANCE_ORIGIN ? route.continue() : route.abort())
    try { return await action(page, context) } finally { await browser.close() }
  }
  const disconnectForm = async () => withBrowser(async (page) => {
    await page.goto(ACCEPTANCE_ORIGIN + "/calendar/sync", { waitUntil: "domcontentloaded" })
    const button = page.getByRole("button", { name: "Disconnect", exact: true })
    await button.waitFor({ timeout: 45_000 })
    const values = await button.locator("..", {}).evaluate((form) => Object.fromEntries(new FormData(form).entries()))
    await writeFile(join(directory, "disconnect-form.json"), JSON.stringify(values))
    return values
  })
  if (mode === "seed") {
    requireAcceptance(await prisma.user.count() === 0 && await prisma.practice.count() === 0, "empty_database")
    await createBrowserUserFixtureRecord({ prismaClient: prisma, identity })
    requireAcceptance((await getGoogleCalendarSyncAccess(userId)).reason === "provider", "role_gate")
    await prisma.practice.create({ data: { id: practiceId, slug: practiceId, name: "Synthetic acceptance practice", timezone: "UTC", createdById: userId } })
    await prisma.practiceMembership.create({ data: { practiceId, userId, role: "OWNER" } })
    requireAcceptance((await getGoogleCalendarSyncAccess(userId)).reason === "entitlement", "feature_gate")
    await prisma.temporaryFeatureGrant.create({ data: { userId, featureKey: "external_calendar_sync", startsAt: new Date(), expiresAt: new Date(manifest.database.createdAt + 90 * 60_000), grantedById: userId, reasonCode: "SYNTHETIC_ACCEPTANCE", idempotencyKey: practiceId } })
    requireAcceptance((await getGoogleCalendarSyncAccess(userId)).allowed, "access_gate")
    await writeFile(join(directory, "bridge.json"), JSON.stringify({ nonce: manifest.startNonce, used: false }))
    await receipt("persisted-role-feature-gates")
  } else if (mode === "check" && stage === "access-http") {
    const count = (await store.journal()).length
    const grant = await prisma.temporaryFeatureGrant.findUnique({ where: { idempotencyKey: practiceId } })
    const membership = await prisma.practiceMembership.findUnique({ where: { practiceId_userId: { practiceId, userId } } })
    requireAcceptance(grant && membership, "seed_receipt")
    await withBrowser(async (_page, context) => {
      await prisma.practiceMembership.delete({ where: { id: membership.id } })
      try {
        const response = await context.request.get(ACCEPTANCE_ORIGIN + "/api/calendar/google/connect", { maxRedirects: 0 })
        requireAcceptance(response.status() === 307 && response.headers().location?.endsWith("google=access"), "http_role_gate")
      } finally { await prisma.practiceMembership.create({ data: { id: membership.id, practiceId, userId, role: "OWNER" } }) }
      await prisma.temporaryFeatureGrant.update({ where: { id: grant.id }, data: { expiresAt: new Date(Date.now() - 60_000) } })
      try {
        const response = await context.request.get(ACCEPTANCE_ORIGIN + "/api/calendar/google/connect", { maxRedirects: 0 })
        requireAcceptance(response.status() === 307 && response.headers().location?.endsWith("google=access"), "http_feature_gate")
      } finally { await prisma.temporaryFeatureGrant.update({ where: { id: grant.id }, data: { expiresAt: grant.expiresAt } }) }
    })
    requireAcceptance((await store.journal()).length === count, "provider_before_access")
    await receipt("real-connect-route-role-feature-denials")
  } else if (mode === "check" && stage === "connected") {
    const saved = await connection()
    const token = await freshToken()
    requireAcceptance(saved?.status === "ACTIVE" && !saved.statusReason && saved.dedicatedCalendarId && saved.providerAccountId === token.googleUserId, "callback_persistence")
    requireAcceptance((await calendarCreates()).length === 1 && saved.dedicatedCalendarId === (await calendarCreates())[0].calendarId, "fresh_target")
    requireAcceptance(saved.encryptedAccessToken !== token.access_token && decryptCalendarSyncSecret(saved.encryptedAccessToken) === token.access_token, "encrypted_tokens")
    requireAcceptance(saved.encryptedRefreshToken !== token.refresh_token && decryptCalendarSyncSecret(saved.encryptedRefreshToken) === token.refresh_token, "encrypted_tokens")
    requireAcceptance(saved.sources.length === 2 && saved.sources.every((item) => !item.selectedForBusySync), "fixture_inventory")
    await withBrowser(async (_page, context) => {
      for (let index = 0; index < 2; index++) {
        const response = await context.request.get(ACCEPTANCE_ORIGIN + "/api/calendar/google/callback?code=synthetic-invalid-code&state=synthetic-replayed-state", { maxRedirects: 0 })
        requireAcceptance(response.status() === 307 && response.headers().location?.endsWith("google=state"), "state_gate")
        requireAcceptance(response.headers()["set-cookie"]?.includes("massagelab_google_calendar_state=;"), "state_cookie")
      }
    })
    await disconnectForm()
    await receipt("real-callback-state-encryption-fresh-target")
  } else if (mode === "check" && stage === "transactions") {
    const saved = await connection()
    const token = await freshToken()
    requireAcceptance(saved?.status === "ACTIVE", "active_connection")
    // Real Google subject and target checks precede provider mutations.
    const count = (await calendarCreates()).length
    await expectFailure(() => adapter.validateAccount(token.access_token, "synthetic-wrong-subject"))
    for (const fault of ["primary-target", "shared-target", "ambiguous-targets"]) {
      await setFault(fault)
      await expectFailure(() => adapter.findDedicatedCalendar(token.access_token, { providerAccountId: token.googleUserId, storedCalendarId: fault === "ambiguous-targets" ? undefined : saved.dedicatedCalendarId }))
    }
    await setFault()
    requireAcceptance((await calendarCreates()).length === count, "rejected_target_write")
    await receipt("injected-target-rejections")
    const before = await connection()
    const rollbackAdapter = { ...adapter, listCalendars: async () => { throw new Error("injected-inventory-failure") } }
    await expectFailure(() => connectGoogleCalendar({ userId, token, adapter: rollbackAdapter }))
    const after = await connection()
    requireAcceptance(before.updatedAt.getTime() === after.updatedAt.getTime() && before.encryptedAccessToken === after.encryptedAccessToken && before.dedicatedCalendarId === after.dedicatedCalendarId, "postgres_rollback")
    await receipt("real-postgres-rollback-injected-inventory-failure")
    let release
    let entered
    const firstEntered = new Promise((resolve) => { entered = resolve })
    const barrier = new Promise((resolve) => { release = resolve })
    let secondEntered = false
    const first = connectGoogleCalendar({ userId, token, adapter: { ...adapter, findDedicatedCalendar: async (...args) => { entered(); await barrier; return adapter.findDedicatedCalendar(...args) } } })
    await firstEntered
    const second = connectGoogleCalendar({ userId, token, adapter: { ...adapter, findDedicatedCalendar: async (...args) => { secondEntered = true; return adapter.findDedicatedCalendar(...args) } } })
    await new Promise((resolve) => setTimeout(resolve, 500))
    const blocked = !secondEntered
    release()
    await Promise.all([first, second])
    requireAcceptance(blocked && secondEntered && (await calendarCreates()).length === count, "postgres_serialization")
    await receipt("real-postgres-user-row-serialization")
    await guardedFetch("https://www.googleapis.com/calendar/v3/calendars/" + encodeURIComponent(saved.dedicatedCalendarId), { method: "PATCH", headers: { authorization: "Bearer " + token.access_token }, body: JSON.stringify({ summary: "AtmoShaper application renamed " + manifest.runId }) })
    await receipt("owned-target-renamed-for-reconnect")
    const nonce = randomBytes(32).toString("hex")
    await writeFile(join(directory, "bridge.json"), JSON.stringify({ nonce, used: false }))
    console.log("ACCEPTANCE: reconnect at " + ACCEPTANCE_ORIGIN + "/__calendar_acceptance/start/" + nonce)
  } else if (mode === "check" && stage === "reconnected") {
    const saved = await connection()
    requireAcceptance(saved?.status === "ACTIVE" && saved.dedicatedCalendarId === (await calendarCreates())[0]?.calendarId && (await calendarCreates()).length === 1 && saved.dedicatedCalendarSummary === "AtmoShaper application renamed " + manifest.runId, "reconnect_target")
    requireAcceptance((await store.journal()).filter((item) => item.kind === "exchange" && item.phase === "accepted").length === 2, "reconnect_callback")
    await receipt("real-reconnect-reuses-renamed-id")
  } else if (mode === "check" && stage === "inbound") {
    await withBrowser(async (page) => {
      await page.goto(ACCEPTANCE_ORIGIN + "/calendar/sync", { waitUntil: "domcontentloaded" })
      const boxes = page.locator('input[name="sourceId"]')
      requireAcceptance(await boxes.count() === 2, "source_selection")
      for (let index = 0; index < 2; index++) await boxes.nth(index).check()
      await page.getByRole("button", { name: "Save blocking calendars", exact: true }).click()
      await page.waitForURL("**/calendar/sync?google=saved", { timeout: 60_000 })
    })
    const saved = await connection()
    const blocks = await prisma.externalCalendarBusyBlock.findMany({ where: { connectionId: saved.id } })
    requireAcceptance(blocks.length === 4 && blocks.every((item) => manifest.sources.some((source) => source.calendarId === item.providerCalendarId && source.eventIds.includes(item.providerEventId))), "busy_import")
    requireAcceptance(saved.sources.every((source) => source.selectedForBusySync && source.syncToken), "cursor_persistence")
    requireAcceptance(!JSON.stringify(blocks).includes("Synthetic private details"), "minimal_busy_storage")
    await receipt("real-ui-source-selection-busy-import-cursors", { busyCount: blocks.length })
  } else if (mode === "check" && stage === "incremental") {
    const saved = await connection()
    await syncGoogleConnectionSources({ connectionId: saved.id, adapter })
    const blocks = await prisma.externalCalendarBusyBlock.findMany({ where: { connectionId: saved.id } })
    // The owner/connector updates one known event and deletes one other known event between stages.
    const changed = manifest.sources[0].eventIds[0]
    const deleted = manifest.sources[1].eventIds[1]
    requireAcceptance(blocks.find((item) => item.providerEventId === changed)?.startsAt.toISOString() === manifest.changedSourceStart, "busy_update")
    requireAcceptance(!blocks.some((item) => item.providerEventId === deleted && item.status !== "CANCELLED"), "busy_cancellation")
    requireAcceptance((await store.journal()).some((item) => item.kind === "event-read" && item.incremental), "incremental_dispatch")
    await setFault("inbound-503")
    const prior = (await connection()).sources.map((source) => source.syncToken)
    await syncGoogleConnectionSources({ connectionId: saved.id, adapter })
    requireAcceptance((await connection()).sources.every((source, index) => source.syncToken === prior[index] && source.lastErrorCode === "SYNC_FAILED"), "cursor_preserved")
    await setFault("inbound-410")
    await syncGoogleConnectionSources({ connectionId: saved.id, adapter })
    requireAcceptance((await connection()).sources.every((source) => source.syncToken === null), "stale_cursor_reset")
    await setFault()
    await syncGoogleConnectionSources({ connectionId: saved.id, adapter })
    requireAcceptance((await connection()).sources.every((source) => source.syncToken && !source.lastErrorCode), "cursor_recovered")
    await receipt("real-incremental-update-cancellation-injected-cursor-failures")
  } else if (mode === "check" && stage === "outbound") {
    const saved = await connection()
    const ids = [1, 2].map((index) => practiceId + "-" + index)
    for (const [index, id] of ids.entries()) {
      const startsAt = new Date(Date.now() + (index + 3) * 24 * 60 * 60_000)
      await prisma.calendarEvent.create({ data: { id, practiceId, ownerUserId: userId, createdById: userId, kind: "PERSONAL", title: "Synthetic private details must stay local", startsAt, endsAt: new Date(startsAt.getTime() + 30 * 60_000), timezone: "UTC" } })
      requireAcceptance((await pushCalendarEventToGoogle(id, adapter)).pushed, "outbound_insert")
    }
    let links = await prisma.externalCalendarEventLink.findMany({ where: { connectionId: saved.id } })
    requireAcceptance(links.length === 2 && links.every((link) => link.providerEventId && link.providerCalendarId === saved.dedicatedCalendarId), "outbound_identity")
    const first = links.find((link) => link.calendarEventId === ids[0]).providerEventId
    await prisma.calendarEvent.update({ where: { id: ids[0] }, data: { endsAt: new Date(Date.now() + 4 * 24 * 60 * 60_000) } })
    requireAcceptance((await pushCalendarEventToGoogle(ids[0], adapter)).pushed, "outbound_update")
    links = await prisma.externalCalendarEventLink.findMany({ where: { connectionId: saved.id } })
    requireAcceptance(links.find((link) => link.calendarEventId === ids[0]).providerEventId === first, "outbound_reuses_id")
    await prisma.calendarEvent.update({ where: { id: ids[1] }, data: { status: "CANCELLED" } })
    requireAcceptance((await pushCalendarEventToGoogle(ids[1], adapter)).deleted, "outbound_cancel")
    requireAcceptance((await store.journal()).filter((item) => item.kind === "event-create" && item.phase === "accepted").length === 2, "outbound_limit")
    await receipt("real-generic-outbound-insert-update-cancellation")
  } else if (mode === "check" && stage === "disconnect") {
    const saved = await connection()
    const token = await freshToken()
    const before = await adapter.listEvents({ accessToken: token.access_token, calendarId: saved.dedicatedCalendarId })
    requireAcceptance(before.items.some((item) => item.status !== "cancelled"), "provider_preservation_fixture")
    await disconnectForm()
    await withBrowser(async (page) => {
      await page.goto(ACCEPTANCE_ORIGIN + "/calendar/sync", { waitUntil: "domcontentloaded" })
      await page.getByRole("button", { name: "Disconnect", exact: true }).click()
      await page.waitForURL("**/calendar/sync?google=disconnected", { timeout: 45_000 })
    })
    requireAcceptance(await connection() === null, "resolved_disconnect")
    const after = await adapter.listEvents({ accessToken: token.access_token, calendarId: saved.dedicatedCalendarId })
    requireAcceptance(JSON.stringify(before.items.map((item) => [item.id, item.status])) === JSON.stringify(after.items.map((item) => [item.id, item.status])), "provider_preserved")
    await receipt("real-disconnect-preserves-provider-contents")
    // Separate owned cleanup of target one establishes genuine absence for the reserved failure case.
    requireAcceptance((await guardedFetch("https://www.googleapis.com/calendar/v3/calendars/" + encodeURIComponent(saved.dedicatedCalendarId), { method: "DELETE", headers: { authorization: "Bearer " + token.access_token } })).ok, "owned_target_cleanup")
    requireAcceptance(!((await adapter.listCalendars(token.access_token)).some((item) => item.id === saved.dedicatedCalendarId)), "target_active_absence")
    await receipt("first-owned-target-cleaned")
  } else if (mode === "check" && stage === "uncertain") {
    const token = await freshToken()
    requireAcceptance(await connection() === null && (await calendarCreates()).length === 1, "reserved_case_boundary")
    await setFault("lose-calendar-response")
    await expectFailure(() => connectGoogleCalendar({ userId, token, adapter }))
    const pending = await connection()
    requireAcceptance(pending?.status === "ERROR" && pending.statusReason === GOOGLE_CALENDAR_CREATION_PENDING_REASON && !pending.dedicatedCalendarId && (await calendarCreates()).length === 2, "durable_pending_intent")
    await setFault("hide-targets")
    await expectFailure(() => connectGoogleCalendar({ userId, token, adapter }))
    requireAcceptance((await calendarCreates()).length === 2 && (await connection()).id === pending.id, "no_blind_repost")
    const values = JSON.parse(await readFile(join(directory, "disconnect-form.json"), "utf8"))
    values.connectionId = pending.id
    await withBrowser(async (_page, context) => {
      const response = await context.request.post(ACCEPTANCE_ORIGIN + "/calendar/sync", { form: values, headers: { origin: ACCEPTANCE_ORIGIN }, maxRedirects: 0 })
      requireAcceptance(response.status() >= 400, "pending_disconnect_action")
    })
    requireAcceptance((await connection())?.id === pending.id && (await connection()).statusReason === GOOGLE_CALENDAR_CREATION_PENDING_REASON, "pending_preserved")
    await setFault()
    const reconciled = await connectGoogleCalendar({ userId, token, adapter })
    requireAcceptance(reconciled.status === "ACTIVE" && reconciled.dedicatedCalendarId === (await calendarCreates())[1].calendarId && (await calendarCreates()).length === 2, "uncertain_reconciled")
    await receipt("real-durable-intent-injected-lost-response-no-repost-reconciliation")
  } else if (mode === "cleanup") {
    await setFault()
    const tokens = await store.vault()
    const accessToken = tokens.findLast((token) => token.access_token)?.access_token
    const deleted = (await store.journal()).filter((item) => item.kind === "calendar-delete" && item.phase === "accepted").map((item) => item.calendarId)
    for (const item of await calendarCreates()) if (!deleted.includes(item.calendarId)) {
      requireAcceptance((await guardedFetch("https://www.googleapis.com/calendar/v3/calendars/" + encodeURIComponent(item.calendarId), { method: "DELETE", headers: { authorization: "Bearer " + accessToken } })).ok, "target_cleanup")
    }
    if (accessToken) {
      const createdIds = (await calendarCreates()).map((item) => item.calendarId)
      const response = await guardedFetch("https://www.googleapis.com/calendar/v3/users/me/calendarList?showHidden=true", { headers: { authorization: "Bearer " + accessToken } })
      const data = await response.json()
      requireAcceptance(!(data.items ?? []).some((item) => createdIds.includes(item.id)), "target_cleanup_absence")
    }
    // Revoking each distinct grant token can make sibling tokens invalid; Google's already-revoked
    // response is accepted only for a token positively captured from this run's test exchange.
    const revokeTokens = [...new Set(tokens.flatMap((token) => [token.refresh_token, token.access_token].filter(Boolean)))]
    for (const token of revokeTokens) {
      const response = await guardedFetch("https://oauth2.googleapis.com/revoke", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ token }) })
      requireAcceptance(response.status === 200 || response.status === 400 && (await response.json()).error === "invalid_token", "token_revocation")
    }
    await store.locked(() => store.saveVault([]))
    await receipt("owned-targets-absent-new-test-tokens-revoked")
  } else throw new Error("stage_boundary")
  await prisma.$disconnect()
}

/** Expected injected/rejection cases still fail if the operation unexpectedly succeeds. */
async function expectFailure(action) {
  let failed = false
  try { await action() } catch { failed = true }
  requireAcceptance(failed, "expected_failure_missing")
}
main().catch(async () => { console.error("ACCEPTANCE: stage stopped; mandatory owned cleanup remains"); await prisma.$disconnect().catch(() => {}); process.exitCode = 1 })
