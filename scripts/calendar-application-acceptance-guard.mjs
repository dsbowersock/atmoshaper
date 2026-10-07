import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto"
import { readFile, writeFile, rename, mkdir, rmdir, appendFile, readdir, unlink } from "node:fs/promises"
import { join } from "node:path"
import { authorizeAcceptanceRequest, requireAcceptance, validateAcceptanceScopes, validateAcceptanceManifest } from "./calendar-application-acceptance-core.mjs"
import { ATMOSHAPER_GOOGLE_CALENDAR_DESCRIPTION } from "../lib/calendar-sync-constants.ts"

/** Remove only this exact owner's entry; a replacement lock is always nonempty and survives rmdir. */
async function releaseAcceptanceLock(lock, ownerName) {
  const deadline = Date.now() + 5000
  while (true) {
    try { await unlink(join(lock, ownerName)); break } catch (error) {
      if (error.code === "ENOENT") return
      // Windows can report EPERM while another reclaimer's delete is still pending.
      if (!["EPERM", "EACCES"].includes(error.code) || Date.now() >= deadline) throw error
      await new Promise((resolve) => setTimeout(resolve, 25))
    }
  }
  while (true) {
    try { await rmdir(lock); return } catch (error) {
      if (["ENOENT", "ENOTEMPTY", "EEXIST"].includes(error.code)) return
      if (!["EPERM", "EACCES"].includes(error.code) || Date.now() >= deadline) throw error
      await new Promise((resolve) => setTimeout(resolve, 25))
    }
  }
}

/** PID liveness is fail-closed: only ESRCH proves a recorded owner is dead, never age or EPERM. */
async function reclaimAcceptanceLock(lock) {
  let entries
  try { entries = await readdir(lock) } catch (error) { if (["ENOENT", "EPERM", "EACCES"].includes(error.code)) return; throw error }
  if (entries.length !== 1 || !/^owner-[1-9][0-9]*-[a-f0-9]{32}\.json$/.test(entries[0])) return
  let owner
  try { owner = JSON.parse(await readFile(join(lock, entries[0]), "utf8")) } catch { return }
  if (!Number.isSafeInteger(owner.pid) || owner.pid < 1 || owner.pid > 2_147_483_647 || entries[0] !== `owner-${owner.pid}-${owner.nonce}.json`) return
  try { process.kill(owner.pid, 0) } catch (error) {
    if (error.code === "ESRCH") await releaseAcceptanceLock(lock, entries[0])
  }
}

/** Publish a prepopulated lock atomically so dead-owner recovery never removes a new empty live lock. */
export async function acceptanceLock(directory, action, { timeoutMs = 5000 } = {}) {
  const lock = join(directory, "journal.lock")
  const nonce = randomBytes(16).toString("hex")
  const ownerName = `owner-${process.pid}-${nonce}.json`
  const candidate = join(directory, `journal.lock-candidate-${process.pid}-${nonce}`)
  const deadline = Date.now() + timeoutMs
  await mkdir(candidate, { mode: 0o700 })
  try {
    await writeFile(join(candidate, ownerName), JSON.stringify({ pid: process.pid, nonce }), { mode: 0o600, flag: "wx" })
    while (true) {
      // Leave pre-existing empty/unrecognized locks alone; POSIX rename could otherwise replace an empty directory.
      let occupied = true
      try { await readdir(lock) } catch (error) { if (error.code === "ENOENT") occupied = false; else if (!["EPERM", "EACCES"].includes(error.code)) throw error }
      if (occupied) {
        requireAcceptance(Date.now() < deadline, "journal_lock")
        await reclaimAcceptanceLock(lock)
        await new Promise((resolve) => setTimeout(resolve, 25))
        continue
      }
      try { await rename(candidate, lock); break } catch (error) {
        requireAcceptance(["EEXIST", "ENOTEMPTY", "EPERM", "EACCES"].includes(error.code) && Date.now() < deadline, "journal_lock")
        await reclaimAcceptanceLock(lock)
        await new Promise((resolve) => setTimeout(resolve, 25))
      }
    }
    try { return await action() } finally { await releaseAcceptanceLock(lock, ownerName) }
  } finally {
    await releaseAcceptanceLock(candidate, ownerName)
  }
}

/** Private stores never place tokens, resource identities or rejected payloads in console output. */
export function acceptanceStore(directory, key) {
  const vaultPath = join(directory, "token-vault.json")
  const journalPath = join(directory, "journal.jsonl")
  async function journal() {
    try { return (await readFile(journalPath, "utf8")).split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line)) }
    catch (error) { if (error.code === "ENOENT") return []; throw new Error("journal_read") }
  }
  async function vault() {
    try {
      const document = JSON.parse(await readFile(vaultPath, "utf8"))
      const decipher = createDecipheriv("aes-256-gcm", Buffer.from(key, "hex"), Buffer.from(document.iv, "hex"))
      decipher.setAuthTag(Buffer.from(document.tag, "hex"))
      return JSON.parse(Buffer.concat([decipher.update(Buffer.from(document.data, "base64")), decipher.final()]).toString("utf8"))
    } catch (error) { if (error.code === "ENOENT") return []; throw new Error("vault_read") }
  }
  async function saveVault(values) {
    const iv = randomBytes(12)
    const cipher = createCipheriv("aes-256-gcm", Buffer.from(key, "hex"), iv)
    const data = Buffer.concat([cipher.update(JSON.stringify(values)), cipher.final()])
    const temporary = vaultPath + ".next"
    await writeFile(temporary, JSON.stringify({ iv: iv.toString("hex"), tag: cipher.getAuthTag().toString("hex"), data: data.toString("base64") }), { mode: 0o600 })
    await rename(temporary, vaultPath)
  }
  async function record(item) {
    await appendFile(journalPath, JSON.stringify({ at: Date.now(), ...item }) + "\n", { mode: 0o600 })
  }
  return { journal, vault, saveVault, record, locked: (action) => acceptanceLock(directory, action) }
}

/** Recover only a uniquely run-marked owned secondary target; names alone never establish ownership. */
async function reconcileAcceptanceCalendarPage(items, store) {
  return store.locked(async () => {
    const journal = await store.journal()
    const accepted = journal.filter((item) => item.kind === "calendar-create" && item.phase === "accepted")
    const recovered = []
    for (const intent of journal.filter((item) => item.kind === "calendar-create" && item.phase === "intent" && item.calendarMarker)) {
      const matches = items.filter((item) => item.description === intent.calendarMarker)
      const known = accepted.find((item) => item.calendarMarker === intent.calendarMarker)
      requireAcceptance(matches.length <= 1 && (!known || matches.every((item) => item.id === known.calendarId)), "ambiguous_owned_target")
      if (!known && matches.length) {
        const target = matches[0]
        requireAcceptance(!target.primary && target.accessRole === "owner" && /^[a-zA-Z0-9_-]+@group\.calendar\.google\.com$/.test(target.id ?? ""), "reconciled_target_ownership")
        recovered.push({ ...intent, phase: "accepted", calendarId: target.id, recoveredFromInventory: true })
      }
    }
    // Validate the whole page before accepting any newly discovered identity.
    for (const item of recovered) await store.record(item)
    return [...accepted, ...recovered]
  })
}

/** A later rejected response quarantines the same credential value even if an earlier copy was accepted. */
function usableCapturedToken(tokens, field) {
  const rejected = new Set()
  for (let index = tokens.length - 1; index >= 0; index--) {
    const token = tokens[index]
    if (!token[field] || rejected.has(token[field])) continue
    if (token.acceptedForUse !== false) return token
    rejected.add(token[field])
  }
}

/** Delayed teardown uses the cleanup-guarded fetch; rejected grants stay captured solely for revocation. */
export async function acceptanceCleanupAccessToken({ client, store, fetchImpl, now = Date.now() }) {
  const tokens = await store.locked(() => store.vault())
  const current = usableCapturedToken(tokens, "access_token")
  if (Number.isFinite(current?.capturedAt) && Number.isFinite(current.expires_in) && now + 30_000 < current.capturedAt + current.expires_in * 1000) return current.access_token
  const refresh = usableCapturedToken(tokens, "refresh_token")?.refresh_token
  requireAcceptance(refresh, "cleanup_refresh_unavailable")
  const response = await fetchImpl("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: client.client_id, client_secret: client.client_secret, refresh_token: refresh, grant_type: "refresh_token" }),
    signal: AbortSignal.timeout(8000),
  })
  requireAcceptance(response.ok, "cleanup_refresh_failed")
  const token = await response.json()
  requireAcceptance(typeof token.access_token === "string" && token.access_token.length > 10, "token_response")
  return token.access_token
}

/** Teardown uses the guarded adapter's complete active inventory; an absent owned ID needs no second DELETE. */
export async function acceptanceCleanupCalendars({ client, store, adapter, fetchImpl }) {
  const journal = await store.journal()
  const intents = journal.filter((item) => item.kind === "calendar-create" && item.phase === "intent")
  if (!intents.length || journal.some((item) => item.kind === "case" && item.phase === "passed" && item.caseName === "owned-targets-verified-absent" && item.calendarMarkers?.length === intents.length && intents.every((intent) => item.calendarMarkers.includes(intent.calendarMarker)))) return
  const unresolved = intents.filter((intent) => !journal.some((item) => intent.calendarMarker && item.kind === "calendar-create" && item.phase === "not-created" && item.calendarMarker === intent.calendarMarker))
  if (!unresolved.length) {
    // A positively rejected create needs no Calendar permission to list a resource that never existed.
    await store.locked(() => store.record({ kind: "case", phase: "passed", caseName: "owned-targets-verified-absent", calendarMarkers: intents.map((item) => item.calendarMarker), allCreatesRejected: true }))
    return
  }
  const accessToken = await acceptanceCleanupAccessToken({ client, store, fetchImpl })
  // Complete paging recovers marked uncertain creates before identifying which IDs still exist.
  const activeIds = new Set((await adapter.listCalendars(accessToken)).map((item) => item.id))
  const current = await store.journal()
  const created = current.filter((item) => item.kind === "calendar-create" && item.phase === "accepted")
  requireAcceptance(unresolved.every((intent) => intent.calendarMarker && created.some((item) => item.calendarMarker === intent.calendarMarker)), "unresolved_cleanup_creation")
  const deleted = current.filter((item) => item.kind === "calendar-delete" && item.phase === "accepted").map((item) => item.calendarId)
  for (const item of created) if (!deleted.includes(item.calendarId) && activeIds.has(item.calendarId)) {
    requireAcceptance((await fetchImpl("https://www.googleapis.com/calendar/v3/calendars/" + encodeURIComponent(item.calendarId), { method: "DELETE", headers: { authorization: "Bearer " + accessToken } })).ok, "target_cleanup")
  }
  const createdIds = created.map((item) => item.calendarId)
  requireAcceptance(!(await adapter.listCalendars(accessToken)).some((item) => createdIds.includes(item.id)), "target_cleanup_absence")
  await store.locked(() => store.record({ kind: "case", phase: "passed", caseName: "owned-targets-verified-absent", calendarMarkers: intents.map((item) => item.calendarMarker) }))
}

/** Verify every token attempt; optional cleanup transitions run in the same lock as that final snapshot. */
export async function assertAcceptanceTokenCaptureComplete(store, complete = async () => {}) {
  return store.locked(async () => {
    const journal = await store.journal()
    const intents = journal.filter((item) => ["exchange", "refresh"].includes(item.kind) && item.phase === "intent")
    const tokens = await store.vault()
    // Vault replacement can finish before its journal append. Bind recovery to the encrypted attempt identity.
    for (const intent of intents) {
      if (intent.tokenAttempt && !journal.some((item) => item.kind === intent.kind && item.tokenAttempt === intent.tokenAttempt && ["captured", "not-issued"].includes(item.phase)) && tokens.some((token) => token.tokenAttempt === intent.tokenAttempt && token.tokenKind === intent.kind && typeof token.access_token === "string" && token.access_token.length > 10)) {
        const recovered = { ...intent, phase: "captured", recoveredFromVault: true }
        await store.record(recovered)
        journal.push(recovered)
      }
    }
    requireAcceptance(intents.every((intent) => intent.tokenAttempt && journal.some((item) => item.kind === intent.kind && item.tokenAttempt === intent.tokenAttempt && ["captured", "not-issued"].includes(item.phase))), "uncaptured_token_attempt")
    return complete()
  })
}

/** Intercepts only this local task process; permits no unjournaled credential or fixture write. */
export function createAcceptanceFetch({ manifest, client, store, fetchImpl = globalThis.fetch, control = async () => ({}), cleanup = false, cleanupTimeoutMs = 8000 }) {
  requireAcceptance(Number.isSafeInteger(cleanupTimeoutMs) && cleanupTimeoutMs > 0 && cleanupTimeoutMs <= 8000, "cleanup_request_timeout")
  return async function acceptanceFetch(input, init) {
    try {
      validateAcceptanceManifest(manifest, { cleanup })
      const request = new Request(input, init)
      const body = ["GET", "HEAD"].includes(request.method) ? "" : await request.clone().text()
      const decision = await store.locked(async () => {
        const journal = await store.journal()
        const result = authorizeAcceptanceRequest({ request, body, manifest, client, journal })
        requireAcceptance(!cleanup || ["refresh", "revoke", "calendar-delete", "inventory", "metadata"].includes(result.kind), "cleanup_only")
        if (result.kind === "local") return result
        requireAcceptance(cleanup || !journal.some((item) => item.kind === "cleanup" && item.phase === "started"), "cleanup_only")
        const tokens = await store.vault()
        const bearer = request.headers.get("authorization")?.replace(/^Bearer /, "")
        if (bearer) requireAcceptance(tokens.findLast((token) => token.access_token === bearer)?.acceptedForUse !== false && tokens.some((token) => token.access_token === bearer), "token_ownership")
        if (result.kind === "refresh") {
          const grant = tokens.findLast((token) => token.refresh_token === new URLSearchParams(body).get("refresh_token"))
          requireAcceptance(grant && grant.acceptedForUse !== false, "token_ownership")
          result.capturedScope = grant.scope
        }
        if (result.kind === "revoke") requireAcceptance(tokens.some((token) => [token.access_token, token.refresh_token].filter(Boolean).includes(new URLSearchParams(body).get("token"))), "token_ownership")
        // A transport loss may hide the returned ID. A task-only marker binds later recovery
        // to this exact create attempt; the synthetic app sees its ordinary marker instead.
        if (result.kind === "calendar-create") result.calendarMarker = ATMOSHAPER_GOOGLE_CALENDAR_DESCRIPTION + " Acceptance run " + manifest.runId + " attempt " + randomBytes(16).toString("hex")
        if (["exchange", "refresh"].includes(result.kind)) result.tokenAttempt = randomBytes(16).toString("hex")
        await store.record({ ...result, phase: "intent" })
        return result
      })
      if (decision.kind === "local") return fetchImpl(request)
      const fault = await control()
      if (decision.kind === "event-read" && fault.mode === "inbound-503") return new Response("{}", { status: 503 })
      if (decision.kind === "event-read" && fault.mode === "inbound-410") return new Response("{}", { status: 410 })
      let providerRequest = decision.kind === "calendar-create" ? new Request(request, {
        body: JSON.stringify({ ...JSON.parse(body), description: decision.calendarMarker }),
      }) : request
      if (decision.kind === "calendar-create") providerRequest.headers.delete("content-length")
      // Cleanup outlives the run deadline, but every provider request/body remains bounded and retryable.
      // Preserve an adapter's shorter deadline or an operator abort instead of replacing its signal.
      if (cleanup) providerRequest = new Request(providerRequest, { signal: AbortSignal.any([providerRequest.signal, AbortSignal.timeout(cleanupTimeoutMs)]) })
      const response = await fetchImpl(providerRequest, { redirect: "error" })
      if (!response.ok) {
        if (decision.kind === "calendar-create" && [400, 401, 403].includes(response.status)) {
          const error = await response.json().catch(() => null)
          // Only an explicit matching Calendar client-error body proves this marked attempt did not create.
          if (error?.error?.code === response.status && !Object.hasOwn(error, "id")) {
            await store.locked(() => store.record({ ...decision, phase: "not-created", status: response.status }))
          }
        }
        if (["exchange", "refresh"].includes(decision.kind) && [400, 401].includes(response.status)) {
          const error = await response.json().catch(() => null)
          // RFC 6749 section 5.2 validation/authentication errors establish no token issuance.
          if (["invalid_request", "invalid_client", "invalid_grant", "unauthorized_client", "unsupported_grant_type", "invalid_scope"].includes(error?.error) && !["access_token", "refresh_token", "id_token"].some((key) => Object.hasOwn(error, key))) {
            await store.locked(() => store.record({ ...decision, phase: "not-issued", status: response.status, errorCode: error.error }))
          }
        }
        if (decision.kind === "revoke" && response.status === 400) {
          const error = await response.json()
          if (error.error === "invalid_token") {
            await store.locked(() => store.record({ ...decision, phase: "already-revoked" }))
            return Response.json({ error: "invalid_token" }, { status: 400 })
          }
        }
        await store.locked(() => store.record({ ...decision, phase: "http-failure", status: response.status }))
        return new Response("{}", { status: response.status })
      }
      if (response.status === 204 || decision.kind === "revoke") {
        await store.locked(() => store.record({ ...decision, phase: "accepted" }))
        return new Response(response.status === 204 ? null : "{}", { status: response.status })
      }
      const data = await response.json()
      if (["exchange", "refresh"].includes(decision.kind)) {
        requireAcceptance(typeof data.access_token === "string" && data.access_token.length > 10, "token_response")
        // RFC 6749 permits an unchanged refresh grant to omit scope; explicit drift is still rejected.
        const effectiveScope = decision.kind === "refresh" && data.scope === undefined ? decision.capturedScope : data.scope
        // Capture the newly issued token before rejecting a wrong/missing grant so teardown
        // can revoke it even when the callback must stop without activating a connection.
        await store.locked(async () => {
          const tokens = await store.vault()
          const captured = { ...data, scope: effectiveScope, capturedAt: Date.now(), acceptedForUse: false, tokenAttempt: decision.tokenAttempt, tokenKind: decision.kind }
          tokens.push(captured)
          await store.saveVault(tokens)
          await store.record({ ...decision, phase: "captured" })
          validateAcceptanceScopes(effectiveScope)
          if (decision.kind === "exchange") requireAcceptance(data.refresh_token && data.id_token, "token_response")
          captured.acceptedForUse = true
          await store.saveVault(tokens)
          await store.record({ ...decision, phase: "accepted", scope: effectiveScope })
        })
      } else if (decision.kind === "identity") {
        requireAcceptance(data.email === manifest.accountEmail && data.email_verified === true && typeof data.sub === "string", "account_identity")
        const prior = (await store.journal()).find((item) => item.kind === "identity" && item.phase === "accepted")
        requireAcceptance(!prior || prior.subject === data.sub, "account_identity")
        await store.locked(() => store.record({ ...decision, phase: "accepted", subject: data.sub }))
      } else if (decision.kind === "calendar-create") {
        requireAcceptance(/^[a-zA-Z0-9_-]+@group\.calendar\.google\.com$/.test(data.id ?? ""), "accepted_calendar_identity")
        await store.locked(() => store.record({ ...decision, phase: "accepted", calendarId: data.id }))
        if (data.description === decision.calendarMarker) data.description = ATMOSHAPER_GOOGLE_CALENDAR_DESCRIPTION
        if (fault.mode === "lose-calendar-response") throw new Error("injected_uncertain_creation")
      } else if (decision.kind === "event-create") {
        requireAcceptance(/^[a-z0-9]{5,128}$/.test(data.id ?? ""), "accepted_event_identity")
        await store.locked(() => store.record({ ...decision, phase: "accepted", eventId: data.id }))
      } else if (decision.kind === "inventory") {
        // Preserve complete paging for discovery, but expose only this run's sources/targets to
        // the synthetic account. Ordinary primary calendars otherwise auto-select for reads.
        const accepted = await reconcileAcceptanceCalendarPage(data.items ?? [], store)
        const created = accepted.map((item) => item.calendarId)
        const allowed = new Set([...created, ...manifest.sources.map((source) => source.calendarId)])
        for (const item of data.items ?? []) {
          if (!cleanup && (item.summary === "AtmoShaper" || item.description === ATMOSHAPER_GOOGLE_CALENDAR_DESCRIPTION)) requireAcceptance(created.includes(item.id), "preexisting_target")
        }
        data.items = (data.items ?? []).filter((item) => allowed.has(item.id) && !(fault.mode === "hide-targets" && created.includes(item.id)))
        data.items = data.items.map((item) => accepted.some((record) => record.calendarId === item.id && record.calendarMarker && record.calendarMarker === item.description) ? { ...item, description: ATMOSHAPER_GOOGLE_CALENDAR_DESCRIPTION } : item)
        if (fault.mode === "primary-target") data.items = data.items.map((item) => created.includes(item.id) ? { ...item, primary: true } : item)
        if (fault.mode === "shared-target") data.items = data.items.map((item) => created.includes(item.id) ? { ...item, accessRole: "reader" } : item)
        if (fault.mode === "ambiguous-targets") data.items = data.items.map((item) => ({ ...item, summary: "AtmoShaper" }))
      } else if (decision.kind === "metadata") {
        const accepted = (await store.journal()).find((item) => item.kind === "calendar-create" && item.phase === "accepted" && item.calendarId === decision.calendarId)
        if (accepted?.calendarMarker && accepted.calendarMarker === data.description) data.description = ATMOSHAPER_GOOGLE_CALENDAR_DESCRIPTION
      } else if (decision.kind === "event-read") {
        const source = manifest.sources.find((item) => item.calendarId === decision.calendarId)
        const allowed = source?.eventIds ?? (await store.journal()).filter((item) => item.kind === "event-create" && item.phase === "accepted" && item.calendarId === decision.calendarId).map((item) => item.eventId)
        requireAcceptance((data.items ?? []).every((item) => allowed.includes(item.id)), "unexpected_fixture_event")
      }
      return new Response(JSON.stringify(data), { status: response.status, headers: { "content-type": "application/json" } })
    } catch {
      // Raw fetch/JSON/database exceptions can include credentials; never propagate their text.
      throw new Error("acceptance_transport_stopped")
    }
  }
}
