import { createServer } from "node:http"
import { readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { encode } from "next-auth/jwt"
import next from "next"
import { loadAcceptanceConfig } from "./calendar-application-acceptance.mjs"
import { acceptanceStore, createAcceptanceFetch } from "./calendar-application-acceptance-guard.mjs"
import { requireAcceptance, ACCEPTANCE_ORIGIN } from "./calendar-application-acceptance-core.mjs"
import { createBrowserUserFixtureIdentity } from "../lib/auth/browser-user-fixture.ts"
import { signedInSessionToken } from "../tests/browser/signed-in-session-cookie.ts"

/** A nonce-qualified loopback bridge installs only the persisted synthetic user's session. */
async function main() {
  const { manifest, client, directory } = await loadAcceptanceConfig(process.env.ATMOSHAPER_CALENDAR_ACCEPTANCE_CONFIG)
  const store = acceptanceStore(directory, manifest.encryptionKey)
  globalThis.fetch = createAcceptanceFetch({ manifest, client, store, control: async () => {
    try { return JSON.parse(await readFile(join(directory, "control.json"), "utf8")) } catch { return {} }
  } })
  const app = next({ dev: true, dir: manifest.appRoot, hostname: "localhost", port: 3318 })
  await app.prepare()
  const handler = app.getRequestHandler()
  const identity = createBrowserUserFixtureIdentity("calendar-acceptance", manifest.runId)
  const cookie = await encode({ token: signedInSessionToken(identity.user), secret: manifest.authSecret, salt: "authjs.session-token", maxAge: 90 * 60 })
  const server = createServer(async (request, response) => {
    try {
      requireAcceptance(request.headers.host === "localhost:3318", "loopback_host")
      const url = new URL(request.url, ACCEPTANCE_ORIGIN)
      if (url.pathname.startsWith("/__calendar_acceptance/")) {
        requireAcceptance(!manifest.pendingActionOnly, "pending_only_bridge")
        const current = JSON.parse(await readFile(join(directory, "bridge.json"), "utf8"))
        requireAcceptance(request.method === "GET" && url.pathname === "/__calendar_acceptance/start/" + current.nonce && !current.used, "bridge_nonce")
        current.used = true
        await writeFile(join(directory, "bridge.json"), JSON.stringify(current))
        response.writeHead(302, { location: "/api/calendar/google/connect", "set-cookie": "authjs.session-token=" + cookie + "; Path=/; HttpOnly; SameSite=Lax", "cache-control": "no-store" })
        response.end(); return
      }
      await handler(request, response)
    } catch { response.writeHead(403, { "content-type": "text/plain" }); response.end("Local acceptance request stopped.") }
  })
  await new Promise((done, reject) => { server.once("error", reject); server.listen(3318, "127.0.0.1", done) })
  await store.locked(() => store.record({ kind: "owned-server", phase: "ready", pid: process.pid }))
  console.log("ACCEPTANCE: server ready at http://localhost:3318")
  if (!manifest.pendingActionOnly) console.log("ACCEPTANCE: start at " + ACCEPTANCE_ORIGIN + "/__calendar_acceptance/start/" + manifest.startNonce)
  const remaining = manifest.database.createdAt + (manifest.pendingActionOnly ? 15 : 90) * 60_000 - Date.now()
  const stop = async () => { server.close(); await app.close(); process.exit(0) }
  setTimeout(stop, Math.max(1, remaining)).unref()
  process.on("SIGTERM", stop); process.on("SIGINT", stop)
}
// Failed preparation/readiness can leave framework or listening handles alive; fail the owned child immediately.
main().catch(() => { console.error("ACCEPTANCE: server setup stopped"); process.exit(1) })
