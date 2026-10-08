import { spawnSync } from "node:child_process"
import { dirname, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const readinessScript = resolve(repoRoot, "scripts", "stripe-readiness-check.mjs")
const readinessTimeoutMs = 120_000

/** Selects Vercel Production without giving local or Preview builds live credentials. */
export function shouldCheckProductionStripeReadiness(env = process.env) {
  return env.VERCEL_ENV === "production"
}

/**
 * Blocks Production builds until their explicitly selected payment scope passes.
 * Unset scope preserves the Supporter-only launch; all-payments must be selected
 * separately from the runtime switches and still validates every existing gate.
 * Uses only inherited build credentials; dotenv cannot fill missing values.
 * The child deadline bounds provider reads without any payment or setup writes.
 */
export function runProductionStripeReadinessGate({
  env = process.env,
  spawnSyncImpl = spawnSync,
  log = console.log,
} = {}) {
  if (!shouldCheckProductionStripeReadiness(env)) {
    log("Production Stripe readiness gate skipped outside Vercel Production.")
    return { checked: false }
  }

  const scope = env.STRIPE_PRODUCTION_READINESS_SCOPE ?? "supporter-only"
  if (scope !== "supporter-only" && scope !== "all-payments") {
    // Do not echo an invalid value: a misbound setting can contain private data.
    throw new Error(
      "Production Stripe readiness scope is invalid; refusing this build. Set STRIPE_PRODUCTION_READINESS_SCOPE to supporter-only or all-payments, or leave it unset for supporter-only.",
    )
  }
  const scopeLabel = scope === "supporter-only" ? "Supporter" : "all-payments"
  const result = spawnSyncImpl(process.execPath, [
    readinessScript,
    ...(scope === "supporter-only" ? ["--supporter-only"] : []),
    "--live",
    "--verify-stripe",
    "--no-dotenv",
  ], {
    cwd: repoRoot,
    env,
    stdio: "inherit",
    timeout: readinessTimeoutMs,
  })

  if (result.error || result.status !== 0) {
    const cause = result.error?.code === "ETIMEDOUT"
      ? "checker timed out"
      : result.signal
        ? "checker ended by a signal"
        : result.error
          ? "checker could not start"
          : "checker rejected readiness"
    throw new Error(
      `Production ${scopeLabel} readiness failed: ${cause}; refusing this build. Reconcile the read-only readiness failures before retrying.`,
    )
  }

  log(`Production ${scopeLabel} readiness gate passed.`)
  return { checked: true }
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : null

if (invokedPath === import.meta.url) {
  try {
    runProductionStripeReadinessGate()
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Production Stripe readiness failed.")
    process.exitCode = 1
  }
}
