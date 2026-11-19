import { spawnSync } from "node:child_process"
import { resolveBrowserQaBuildEnvironment } from "./browser-qa-environment.mjs"

/** Loopback-only, inert-provider server for reviewing the existing QA artifact. */
const args = process.argv.slice(2)
const port = args.length === 0 ? 3014 : args.length === 2 && args[0] === "--port" ? Number(args[1]) : Number.NaN
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Use --port with a loopback review port from 1024 to 65535.")
const origin = `http://127.0.0.1:${port}`
const result = spawnSync(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
  env: { ...resolveBrowserQaBuildEnvironment(), AUTH_URL: origin, NEXTAUTH_URL: origin,
    AUTH_SECRET: "local-browser-qa-auth-secret-not-for-production-use-only",
    NEXTAUTH_SECRET: "local-browser-qa-auth-secret-not-for-production-use-only" },
  stdio: "inherit",
})
if (result.error) throw result.error
process.exitCode = result.status ?? 1
