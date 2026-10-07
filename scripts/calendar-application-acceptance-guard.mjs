import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto"
import { readFile, writeFile, rename, mkdir, rmdir, appendFile } from "node:fs/promises"
import { join } from "node:path"
import { authorizeAcceptanceRequest, requireAcceptance, validateAcceptanceScopes, validateAcceptanceManifest } from "./calendar-application-acceptance-core.mjs"
import { ATMOSHAPER_GOOGLE_CALENDAR_DESCRIPTION } from "../lib/calendar-sync-constants.ts"

/** Short cross-process critical sections reserve lifetime budgets before network writes. */
export async function acceptanceLock(directory, action) {
  const lock = join(directory, "journal.lock")
  const deadline = Date.now() + 5000
  while (true) {
    try { await mkdir(lock); break } catch (error) {
      requireAcceptance(error.code === "EEXIST" && Date.now() < deadline, "journal_lock")
      await new Promise((resolve) => setTimeout(resolve, 25))
    }
  }
  try { return await action() } finally { await rmdir(lock) }
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

/** Intercepts only this local task process; permits no unjournaled credential or fixture write. */
export function createAcceptanceFetch({ manifest, client, store, fetchImpl = globalThis.fetch, control = async () => ({}), cleanup = false }) {
  return async function acceptanceFetch(input, init) {
    try {
      validateAcceptanceManifest(manifest, { cleanup })
      const request = new Request(input, init)
      const body = ["GET", "HEAD"].includes(request.method) ? "" : await request.clone().text()
      const decision = await store.locked(async () => {
        const journal = await store.journal()
        const result = authorizeAcceptanceRequest({ request, body, manifest, client, journal })
        requireAcceptance(!cleanup || ["revoke", "calendar-delete", "inventory", "metadata"].includes(result.kind), "cleanup_only")
        if (result.kind === "local") return result
        const tokens = await store.vault()
        const bearer = request.headers.get("authorization")?.replace(/^Bearer /, "")
        if (bearer) requireAcceptance(tokens.some((token) => token.access_token === bearer), "token_ownership")
        if (result.kind === "refresh") requireAcceptance(tokens.some((token) => token.refresh_token === new URLSearchParams(body).get("refresh_token")), "token_ownership")
        if (result.kind === "revoke") requireAcceptance(tokens.some((token) => [token.access_token, token.refresh_token].filter(Boolean).includes(new URLSearchParams(body).get("token"))), "token_ownership")
        await store.record({ ...result, phase: "intent" })
        return result
      })
      if (decision.kind === "local") return fetchImpl(request)
      const fault = await control()
      if (decision.kind === "event-read" && fault.mode === "inbound-503") return new Response("{}", { status: 503 })
      if (decision.kind === "event-read" && fault.mode === "inbound-410") return new Response("{}", { status: 410 })
      const response = await fetchImpl(request, { redirect: "error" })
      if (!response.ok) {
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
        // Capture the newly issued token before rejecting a wrong/missing grant so teardown
        // can revoke it even when the callback must stop without activating a connection.
        await store.locked(async () => {
          const tokens = await store.vault()
          tokens.push(data)
          await store.saveVault(tokens)
          await store.record({ ...decision, phase: "captured" })
        })
        validateAcceptanceScopes(data.scope)
        if (decision.kind === "exchange") requireAcceptance(data.refresh_token && data.id_token, "token_response")
        await store.locked(() => store.record({ ...decision, phase: "accepted", scope: data.scope }))
      } else if (decision.kind === "identity") {
        requireAcceptance(data.email === manifest.accountEmail && data.email_verified === true && typeof data.sub === "string", "account_identity")
        const prior = (await store.journal()).find((item) => item.kind === "identity" && item.phase === "accepted")
        requireAcceptance(!prior || prior.subject === data.sub, "account_identity")
        await store.locked(() => store.record({ ...decision, phase: "accepted", subject: data.sub }))
      } else if (decision.kind === "calendar-create") {
        requireAcceptance(/^[a-zA-Z0-9_-]+@group\.calendar\.google\.com$/.test(data.id ?? ""), "accepted_calendar_identity")
        await store.locked(() => store.record({ ...decision, phase: "accepted", calendarId: data.id }))
        if (fault.mode === "lose-calendar-response") throw new Error("injected_uncertain_creation")
      } else if (decision.kind === "event-create") {
        requireAcceptance(/^[a-z0-9]{5,128}$/.test(data.id ?? ""), "accepted_event_identity")
        await store.locked(() => store.record({ ...decision, phase: "accepted", eventId: data.id }))
      } else if (decision.kind === "inventory") {
        // Preserve complete paging for discovery, but expose only this run's sources/targets to
        // the synthetic account. Ordinary primary calendars otherwise auto-select for reads.
        const created = (await store.journal()).filter((item) => item.kind === "calendar-create" && item.phase === "accepted").map((item) => item.calendarId)
        const allowed = new Set([...created, ...manifest.sources.map((source) => source.calendarId)])
        for (const item of data.items ?? []) {
          if (!cleanup && (item.summary === "AtmoShaper" || item.description === ATMOSHAPER_GOOGLE_CALENDAR_DESCRIPTION)) requireAcceptance(created.includes(item.id), "preexisting_target")
        }
        data.items = (data.items ?? []).filter((item) => allowed.has(item.id) && !(fault.mode === "hide-targets" && created.includes(item.id)))
        if (fault.mode === "primary-target") data.items = data.items.map((item) => created.includes(item.id) ? { ...item, primary: true } : item)
        if (fault.mode === "shared-target") data.items = data.items.map((item) => created.includes(item.id) ? { ...item, accessRole: "reader" } : item)
        if (fault.mode === "ambiguous-targets") data.items = data.items.map((item) => ({ ...item, summary: "AtmoShaper" }))
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
