import { readFile, readdir, realpath, open } from "node:fs/promises"
import { dirname, join, resolve, relative } from "node:path"
import { spawn, execFileSync } from "node:child_process"
import { fileURLToPath, pathToFileURL } from "node:url"
import { acceptanceEnvironment, requireAcceptance, validateAcceptanceCredential, validateAcceptanceManifest, ACCEPTANCE_BASE } from "./calendar-application-acceptance-core.mjs"
import { acceptanceStore } from "./calendar-application-acceptance-guard.mjs"

/** Protect new and existing POSIX diagnostics before writing raw stderr; Windows retains the run folder's ACL. */
export async function writeAcceptanceDiagnostic(directory, text) {
  const file = await open(join(directory, "owned-command-error.txt"), "w", 0o600)
  try {
    await file.chmod(0o600)
    await file.writeFile(text)
  } finally { await file.close() }
}

/** A receipt-bound launcher avoids dotenv/credential inheritance and hides private framework logs. */
export async function loadAcceptanceConfig(path, { database = true, cleanup = false } = {}) {
  const configPath = await realpath(path)
  const manifest = JSON.parse(await readFile(configPath, "utf8"))
  validateAcceptanceManifest(manifest, { requireDatabase: database, cleanup })
  const appRoot = await realpath(manifest.appRoot)
  requireAcceptance(resolve(appRoot) === resolve(dirname(dirname(fileURLToPath(import.meta.url)))), "checkout_ownership")
  const outside = relative(appRoot, configPath)
  requireAcceptance(outside.startsWith("..") && (manifest.pendingActionOnly || !resolve(manifest.credentialFile).startsWith(resolve(appRoot))), "private_file_location")
  requireAcceptance(!(await readdir(appRoot)).some((name) => name.startsWith(".env") && name !== ".env.example"), "dotenv_boundary")
  requireAcceptance(execFileSync("git", ["rev-parse", "HEAD"], { cwd: appRoot, encoding: "utf8", windowsHide: true }).trim() === ACCEPTANCE_BASE, "source_boundary")
  // Task scripts may differ. The application, schema and committed migrations must remain exact.
  requireAcceptance(execFileSync("git", ["diff", ACCEPTANCE_BASE, "--", "app", "lib", "auth.ts", "prisma", "prisma.config.ts", "next.config.mjs"], { cwd: appRoot, encoding: "utf8", windowsHide: true }).trim() === "", "source_boundary")
  requireAcceptance(execFileSync("git", ["status", "--porcelain", "--untracked-files=all", "--", "app", "lib", "auth.ts", "prisma", "prisma.config.ts", "next.config.mjs"], { cwd: appRoot, encoding: "utf8", windowsHide: true }).trim() === "", "source_boundary")
  const client = manifest.pendingActionOnly ? {} : validateAcceptanceCredential(JSON.parse(await readFile(manifest.credentialFile, "utf8")), manifest)
  return { manifest, client, configPath, directory: dirname(configPath) }
}

/** Runs named repository checks or this task's worker, forwarding fixed safe progress lines only. */
async function main() {
  const [mode, configPath, stage] = process.argv.slice(2)
  if (mode === "--plan") {
    console.log("ACCEPTANCE: isolated loopback application; one receipt-bound empty database; two sources; at most two created targets, two outbound events and three consents; mandatory scoped cleanup.")
    return
  }
  requireAcceptance(["setup", "preflight", "generate", "migrate", "seed", "server", "check", "cleanup", "pending-seed", "pending-server", "pending-check", "pending-cleanup"].includes(mode), "command_boundary")
  const cleanup = mode === "cleanup" || mode === "pending-cleanup"
  const loaded = await loadAcceptanceConfig(configPath, { database: mode !== "setup", cleanup })
  requireAcceptance(["setup", "preflight", "generate", "migrate"].includes(mode) || Boolean(loaded.manifest.pendingActionOnly) === mode.startsWith("pending-"), "command_variant")
  if (mode === "setup") { console.log("ACCEPTANCE: source fixtures and local setup guards passed before resource creation"); return }
  const env = acceptanceEnvironment(loaded.manifest, loaded.client, process.env, { cleanup })
  if (mode === "preflight") { console.log("ACCEPTANCE: receipt, source, credential and database guards passed"); return }
  env.ATMOSHAPER_CALENDAR_ACCEPTANCE_CONFIG = loaded.configPath
  let child
  if (["generate", "migrate"].includes(mode)) {
    const script = mode === "generate" ? "prisma:generate" : "prisma:migrate:deploy"
    const npm = process.platform === "win32" ? "npm.cmd" : "npm"
    child = spawn(npm, ["run", script], { cwd: loaded.manifest.appRoot, env, shell: process.platform === "win32", windowsHide: true, stdio: ["ignore", "pipe", "pipe"] })
  } else {
    requireAcceptance(!stage || /^[a-z-]+$/.test(stage), "command_boundary")
    const server = mode === "server" || mode === "pending-server"
    const runner = join(loaded.manifest.appRoot, "scripts", server ? "calendar-application-acceptance-server.mjs" : "calendar-application-acceptance-worker.mjs")
    child = spawn(process.execPath, [...(server ? [] : ["--conditions=react-server", "--import", pathToFileURL(join(loaded.manifest.appRoot, "scripts", "calendar-application-acceptance-node-loader.mjs")).href]), runner, mode, ...(stage ? [stage] : [])], { cwd: loaded.manifest.appRoot, env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] })
  }
  const store = acceptanceStore(loaded.directory, loaded.manifest.encryptionKey)
  await store.locked(() => store.record({ kind: "owned-child", phase: "started", mode, pid: child.pid }))
  /** The bound applies to owned descendants too; no name-wide process termination is used. */
  const stopChild = () => {
    if (process.platform === "win32" && child.pid) spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" })
    else child.kill("SIGTERM")
  }
  const watchdog = cleanup ? null : setTimeout(stopChild, Math.max(1, loaded.manifest.database.createdAt + (loaded.manifest.pendingActionOnly ? 15 : 90) * 60_000 - Date.now()))
  let pending = ""
  child.stdout.on("data", (chunk) => {
    pending += chunk.toString()
    const lines = pending.split(/\r?\n/); pending = lines.pop()
    for (const line of lines) if (/^ACCEPTANCE: [a-zA-Z0-9 .:/_-]+$/.test(line)) console.log(line)
  })
  // Never forward request URLs, OAuth codes, tokens, raw database errors or provider payloads.
  let privateError = ""
  let observedNativeRejection = false
  child.stderr.on("data", (chunk) => {
    privateError = (privateError + chunk.toString()).slice(-32_768)
    // Next emits this exact action error only after the owned database mutation rejects removal.
    if (["server", "pending-server"].includes(mode) && !observedNativeRejection && privateError.includes("Choose a removable Google calendar connection. Unresolved creation requires reconciliation.")) {
      observedNativeRejection = true
      store.locked(() => store.record({ kind: "case", phase: "observed", caseName: "native-pending-disconnect-rejection", pid: child.pid })).catch(() => {})
    }
  })
  process.on("SIGINT", stopChild)
  process.on("SIGTERM", stopChild)
  const result = await new Promise((done) => { child.once("error", () => done(1)); child.once("exit", (code) => done(code ?? 1)) })
  if (watchdog) clearTimeout(watchdog)
  if (result !== 0 && privateError) await writeAcceptanceDiagnostic(loaded.directory, privateError)
  requireAcceptance(result === 0, "owned_command_failed")
  console.log("ACCEPTANCE: owned command completed")
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(() => { console.error("ACCEPTANCE: stopped; inspect the protected private stage receipt"); process.exitCode = 1 })
