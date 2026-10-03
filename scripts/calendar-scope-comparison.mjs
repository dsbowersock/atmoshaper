import { randomBytes, timingSafeEqual } from "node:crypto"
import { readFile } from "node:fs/promises"
import { createServer } from "node:http"
import { isAbsolute } from "node:path"
import { createInterface } from "node:readline/promises"
import { pathToFileURL } from "node:url"
import {
  CALLBACK_URI, COMPARISON_SCOPES, assertComparisonScopes, comparisonAuthUrl,
  comparisonPlan, probeComparison, requireComparison, safeComparisonFailure,
  validateComparisonConfig, validateTestCredential,
} from "./calendar-scope-comparison-core.mjs"

const TOKEN_URL = "https://oauth2.googleapis.com/token"
const REVOKE_URL = "https://oauth2.googleapis.com/revoke"

/** Only a matching, single-use callback can produce a code; invalid requests remain retryable. */
export function consumeConsentCallback(session, url) {
  const supplied = url.searchParams.getAll("state")
  requireComparison(!session.consumed && supplied.length === 1, "callback_state")
  const actual = Buffer.from(supplied[0])
  const expected = Buffer.from(session.state)
  requireComparison(actual.length === expected.length && timingSafeEqual(actual, expected), "callback_state")
  const codes = url.searchParams.getAll("code")
  if (url.searchParams.has("error")) {
    session.consumed = true
    requireComparison(false, "consent_denied")
  }
  requireComparison(codes.length === 1 && codes[0].length > 0 && codes[0].length <= 4096, "callback_state")
  session.consumed = true
  return codes[0]
}

/** The operator opens this local URL manually; no browser automation or console workaround. */
export async function obtainConsentCode({ client, arm, accountEmail, signal, onReady, listenPort = 3317 }) {
  // Port zero is an isolated ephemeral listener for provider-free transport tests only.
  requireComparison(listenPort === 3317 || listenPort === 0)
  const session = { state: randomBytes(32).toString("hex"), consumed: false }
  const launchPath = `/start/${randomBytes(32).toString("hex")}`
  const authUrl = comparisonAuthUrl({ clientId: client.client_id, state: session.state, arm, accountEmail })
  let settle
  let fail
  const result = new Promise((resolve, reject) => { settle = resolve; fail = reject })
  // Listen/abort failure can precede awaiting the callback promise; keep that rejection handled.
  result.catch(() => {})
  let boundPort
  const server = createServer((request, response) => {
    response.setHeader("Cache-Control", "no-store")
    response.setHeader("Referrer-Policy", "no-referrer")
    response.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
    response.setHeader("Content-Type", "text/plain; charset=utf-8")
    if (request.method !== "GET" || request.url.length > 8192 || ![`localhost:${boundPort}`, `127.0.0.1:${boundPort}`].includes(request.headers.host)) {
      response.writeHead(400).end("Request rejected.")
      return
    }
    try {
      const url = new URL(request.url, CALLBACK_URI)
      if (url.pathname === launchPath && !session.consumed) {
        response.writeHead(302, { Location: authUrl }).end()
      } else if (url.pathname === "/oauth/callback") {
        const code = consumeConsentCallback(session, url)
        response.end("Consent received. Return to the terminal. No credentials are displayed here.")
        settle(code)
      } else {
        response.writeHead(404).end("Request rejected.")
      }
    } catch (error) {
      response.writeHead(400).end("Consent callback rejected.")
      if (session.consumed) fail(error)
    }
  })
  const abort = () => fail(new Error("interrupted"))
  signal.addEventListener("abort", abort, { once: true })
  const timeout = setTimeout(() => fail(new Error("callback_timeout")), 10 * 60 * 1000)
  try {
    signal.throwIfAborted()
    await new Promise((resolve, reject) => {
      server.once("error", reject)
      server.listen(listenPort, "127.0.0.1", resolve)
    })
    boundPort = server.address().port
    onReady(`http://localhost:${boundPort}${launchPath}`)
    return await result
  } finally {
    clearTimeout(timeout)
    signal.removeEventListener("abort", abort)
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
  }
}

async function privateJsonFile(path) {
  requireComparison(typeof path === "string" && isAbsolute(path))
  const data = await readFile(path, "utf8")
  requireComparison(data.length <= 128 * 1024)
  // Parsing exceptions are sanitized by main; never include file content/path in diagnostics.
  return JSON.parse(data.replace(/^\uFEFF/, ""))
}

/** Revocation is a test-provider write, attempted before success or failure can be reported. */
export async function revokeComparisonToken(token, fetchImpl = fetch) {
  const response = await fetchImpl(REVOKE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token }),
    redirect: "error",
    signal: AbortSignal.timeout(8_000),
  })
  requireComparison(response.status === 200, "token_cleanup")
}

/** Shared lifecycle ensures a failed scope/account check still revokes the issued test grant. */
export async function runComparisonArm({ config, client, arm, code, fetchImpl = fetch, changeFixtures, signal }) {
  validateComparisonConfig(config)
  validateTestCredential({ web: client }, config.projectId)
  requireComparison(Object.hasOwn(COMPARISON_SCOPES, arm) && typeof code === "string" && code.length > 0 && code.length <= 4096)
  let token
  let result
  let failure
  let revoked = false
  try {
    const response = await fetchImpl(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: client.client_id, client_secret: client.client_secret, redirect_uri: CALLBACK_URI, code, grant_type: "authorization_code" }),
      redirect: "error",
      signal: AbortSignal.any([signal ?? new AbortController().signal, AbortSignal.timeout(8_000)]),
    })
    requireComparison(response.status === 200, "token_exchange")
    token = await response.json()
    requireComparison(typeof token.access_token === "string" && token.access_token.length > 0 && token.token_type?.toLowerCase() === "bearer", "token_exchange")
    assertComparisonScopes(token.scope, arm)
    const accountResponse = await fetchImpl("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${token.access_token}` },
      redirect: "error",
      signal: AbortSignal.any([signal ?? new AbortController().signal, AbortSignal.timeout(8_000)]),
    })
    requireComparison(accountResponse.status === 200, "account_mismatch")
    const account = await accountResponse.json()
    requireComparison(typeof account.sub === "string" && account.sub.length > 0 && account.email_verified === true && account.email?.toLowerCase() === config.accountEmail.toLowerCase(), "account_mismatch")
    result = await probeComparison({ config, accessToken: token.access_token, fetchImpl, changeFixtures, signal, onProgress: (progress) => { result = progress } })
  } catch (error) {
    failure = safeComparisonFailure(error)
  } finally {
    const issuedToken = typeof token?.refresh_token === "string" && token.refresh_token ? token.refresh_token : typeof token?.access_token === "string" ? token.access_token : undefined
    if (issuedToken) {
      try { await revokeComparisonToken(issuedToken, fetchImpl); revoked = true } catch { failure = "token_cleanup" }
    }
    token = undefined
  }
  return {
    arm,
    status: failure ? "inconclusive" : result.compatible ? "passed" : "capability_difference",
    ...(failure ? { failure, ...(result ? { result } : {}) } : { result }),
    tokenRevoked: revoked,
    grantCleanupRequired: !revoked,
    fixturesRemoved: false,
    providerMinimumAccessProven: false,
  }
}

/** Default mode is entirely offline; provider mode needs explicit private config and arm. */
export async function main(args = process.argv.slice(2)) {
  if (args.length === 0 || (args.length === 1 && args[0] === "--plan")) {
    process.stdout.write(`${JSON.stringify(comparisonPlan(), null, 2)}\n`)
    return
  }
  let terminal
  const controller = new AbortController()
  const interrupt = () => controller.abort()
  try {
    requireComparison(args.length === 5 && args[0] === "--run" && args[1] === "--arm" && Object.hasOwn(COMPARISON_SCOPES, args[2]) && args[3] === "--config")
    const config = validateComparisonConfig(await privateJsonFile(args[4]))
    const client = validateTestCredential(await privateJsonFile(config.credentialFile), config.projectId)
    requireComparison(process.stdin.isTTY, "comparison_input")
    terminal = createInterface({ input: process.stdin, output: process.stderr })
    process.on("SIGINT", interrupt)
    process.on("SIGTERM", interrupt)
    const code = await obtainConsentCode({ client, arm: args[2], accountEmail: config.accountEmail, signal: controller.signal, onReady: (url) => process.stderr.write(`Open this local consent link manually: ${url}\n`) })
    const report = await runComparisonArm({
      config, client, arm: args[2], code, signal: controller.signal,
      changeFixtures: async () => {
        const answer = await terminal.question("Apply only the approved synthetic update/deletion. Type changed when the expected after-fixtures are ready: ", { signal: controller.signal })
        requireComparison(answer === "changed", "interrupted")
      },
    })
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
    if (report.status !== "passed") process.exitCode = 1
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ status: "not_completed", failure: safeComparisonFailure(error), providerMinimumAccessProven: false })}\n`)
    process.exitCode = 1
  } finally {
    process.removeListener("SIGINT", interrupt)
    process.removeListener("SIGTERM", interrupt)
    terminal?.close()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main()
