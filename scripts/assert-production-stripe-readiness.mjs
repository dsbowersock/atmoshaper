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
 * Blocks Production builds until the existing read-only Supporter check passes.
 * Fixed arguments preserve the disabled purchase flows and use only inherited
 * build credentials; a local dotenv file cannot fill missing Production values.
 * The child deadline bounds provider reads without any payment or setup writes.
 */
export function runProductionStripeReadinessGate({
  env = process.env,
  spawnSyncImpl = spawnSync,
  log = console.log,
} = {}) {
  if (!shouldCheckProductionStripeReadiness(env)) {
    log("Production Supporter readiness gate skipped outside Vercel Production.")
    return { checked: false }
  }

  const result = spawnSyncImpl(process.execPath, [
    readinessScript,
    "--supporter-only",
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
      `Production Supporter readiness failed: ${cause}; refusing this build. Reconcile the read-only readiness failures before retrying.`,
    )
  }

  log("Production Supporter readiness gate passed.")
  return { checked: true }
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : null

if (invokedPath === import.meta.url) {
  try {
    runProductionStripeReadinessGate()
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Production Supporter readiness failed.")
    process.exitCode = 1
  }
}
