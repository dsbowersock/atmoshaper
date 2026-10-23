import { readFile, readdir, realpath, open } from "node:fs/promises"
import { dirname, join, resolve, relative, isAbsolute, sep } from "node:path"
import { spawn, execFileSync } from "node:child_process"
import { fileURLToPath, pathToFileURL } from "node:url"
import { acceptanceEnvironment, requireAcceptance, validateAcceptanceCredential, validateAcceptanceManifest, ACCEPTANCE_BASE } from "./calendar-application-acceptance-core.mjs"
import { acceptanceStore } from "./calendar-application-acceptance-guard.mjs"

const WINDOWS_TREE_HELPER = fileURLToPath(new URL("./calendar-application-process-tree.ps1", import.meta.url))
const WINDOWS_TREE_ARGS = ["-NoLogo", "-NoProfile", "-NonInteractive", "-File", WINDOWS_TREE_HELPER]
let windowsTreeControlChecked = false

/** Keep process-control helpers outside the application/provider credential environment. */
function windowsTreeControlOptions() {
  const env = Object.fromEntries(["PATH", "SystemRoot", "WINDIR", "COMSPEC", "TEMP", "TMP", "PATHEXT"].filter((key) => process.env[key] !== undefined).map((key) => [key, process.env[key]]))
  return { env, windowsHide: true, stdio: "ignore", timeout: 3000, killSignal: "SIGKILL" }
}

/** Refuse a Windows worker before launch if bounded descendant termination is unavailable. */
function requireWindowsTreeControl() {
  if (process.platform !== "win32" || windowsTreeControlChecked) return
  try { execFileSync("pwsh", [...WINDOWS_TREE_ARGS, "-Check"], windowsTreeControlOptions()) }
  catch { throw new Error("owned_command_tree_control_unavailable") }
  windowsTreeControlChecked = true
}

/** Own a POSIX group or a Windows PID tree; validate Windows cleanup support before spawning. */
export function spawnAcceptanceCommand(command, args, { cwd, env, shell = false } = {}) {
  requireWindowsTreeControl()
  return spawn(command, args, { cwd, env, shell, detached: process.platform !== "win32", windowsHide: true, stdio: ["ignore", "pipe", "pipe"] })
}

/** Terminate only the owned tree; bound Windows control and escalate the POSIX group after its grace period. */
export async function stopAcceptanceCommand(child, { graceMs = 1000 } = {}) {
  if (!child.pid) return
  requireAcceptance(Number.isSafeInteger(child.pid) && child.pid > 0, "owned_command_pid")
  if (process.platform === "win32") {
    if (child.exitCode != null || child.signalCode != null) return
    try {
      const killer = spawn("pwsh", [...WINDOWS_TREE_ARGS, "-OwnedPid", String(child.pid)], windowsTreeControlOptions())
      await new Promise((done, fail) => {
        killer.once("error", () => fail(new Error("owned_command_tree_stop_failed")))
        killer.once("close", (code, signal) => code === 0 && !signal ? done() : fail(new Error("owned_command_tree_stop_failed")))
      })
    } catch {
      // Bound failure recovery to this owned leader. Descendant cleanup remains unverified,
      // so release inherited pipes/handles and fail the stage instead of reporting success.
      try { process.kill(child.pid, "SIGKILL") } catch { /* Preserve the tree-control failure even if the leader already exited or cannot be killed. */ }
      child.stdout?.destroy()
      child.stderr?.destroy()
      child.unref?.()
      throw new Error("owned_command_tree_stop_failed")
    }
    return
  }
  const signalGroup = (signal) => {
    try { process.kill(-child.pid, signal); return true } catch (error) { if (error.code === "ESRCH") return false; throw error }
  }
  if (!signalGroup("SIGTERM")) return
  // The leader can exit before an ignoring descendant; keep the group bound alive until escalation.
  await new Promise((done) => setTimeout(done, graceMs))
  signalGroup("SIGKILL")
}

/** Cleanup gets its own five-minute attempt bound, even after the run expires; finish drains any partial receipt. */
export function acceptanceCommandWatchdog({ mode, manifest, store, stopChild, pid, cleanupTimeoutMs = 5 * 60_000, now = Date.now() }) {
  const cleanup = mode === "cleanup" || mode === "pending-cleanup"
  requireAcceptance(Number.isSafeInteger(cleanupTimeoutMs) && cleanupTimeoutMs > 0 && cleanupTimeoutMs <= 5 * 60_000, "cleanup_process_timeout")
  const delay = cleanup ? cleanupTimeoutMs : Math.max(1, manifest.database.createdAt + (manifest.pendingActionOnly ? 15 : 90) * 60_000 - now)
  let expired = false
  let partialReceipt = Promise.resolve()
  const timer = setTimeout(() => {
    expired = true
    // Stop the owned tree immediately; a worker's held journal lock must not postpone termination.
    stopChild()
    if (cleanup) {
      partialReceipt = store.locked(() => store.record({ kind: "cleanup", phase: "partial", mode, pid, reason: "owned-command-deadline", timeoutMs: cleanupTimeoutMs }))
      partialReceipt.catch(() => {})
    }
  }, delay)
  return {
    async finish() {
      clearTimeout(timer)
      await partialReceipt
      return expired
    },
  }
}

/** Restrict new and existing private artifacts before writing; Windows retains the run folder's ACL. */
async function writeAcceptancePrivateText(path, text) {
  const file = await open(path, "w", 0o600)
  try {
    await file.chmod(0o600)
    await file.writeFile(text)
  } finally { await file.close() }
}

/** Raw child errors stay in the protected operation directory, never console output. */
export async function writeAcceptanceDiagnostic(directory, text) {
  await writeAcceptancePrivateText(join(directory, "owned-command-error.txt"), text)
}

/** Native action fields contain a private connection ID; repair existing permissions before persisting them. */
export async function writeAcceptanceDisconnectForm(directory, values) {
  await writeAcceptancePrivateText(join(directory, "disconnect-form.json"), JSON.stringify(values))
}

/** Record every new native rejection, including split markers, without recounting buffered private stderr. */
export function acceptanceNativeRejectionObserver({ mode, store, pid }) {
  const marker = "Choose a removable Google calendar connection. Unresolved creation requires reconciliation."
  let tail = ""
  return async (text) => {
    if (!["server", "pending-server"].includes(mode)) return
    const window = tail + text
    const occurrences = window.split(marker).length - 1
    // A tail shorter than the marker cannot contain an already counted full occurrence.
    tail = window.slice(-(marker.length - 1))
    for (let index = 0; index < occurrences; index++) {
      await store.locked(() => store.record({ kind: "case", phase: "observed", caseName: "native-pending-disconnect-rejection", pid }))
    }
  }
}

/** Canonical file ancestry rejects in-checkout symlinks and dot-prefixed children without rejecting siblings. */
export async function acceptancePrivatePaths(appRoot, configPath, credentialFile = null) {
  const root = await realpath(appRoot)
  const config = await realpath(configPath)
  const credential = credentialFile ? await realpath(credentialFile) : null
  const outside = (path) => {
    const components = relative(root, path)
    return isAbsolute(components) || components === ".." || components.startsWith(".." + sep)
  }
  requireAcceptance(outside(config) && (!credential || outside(credential)), "private_file_location")
  return { config, credential }
}

/** A receipt-bound launcher avoids dotenv/credential inheritance and hides private framework logs. */
export async function loadAcceptanceConfig(path, { database = true, cleanup = false } = {}) {
  const configPath = await realpath(path)
  const manifest = JSON.parse(await readFile(configPath, "utf8"))
  validateAcceptanceManifest(manifest, { requireDatabase: database, cleanup })
  const appRoot = await realpath(manifest.appRoot)
  requireAcceptance(resolve(appRoot) === resolve(dirname(dirname(fileURLToPath(import.meta.url)))), "checkout_ownership")
  const privatePaths = await acceptancePrivatePaths(appRoot, configPath, manifest.pendingActionOnly ? null : manifest.credentialFile)
  requireAcceptance(!(await readdir(appRoot)).some((name) => name.startsWith(".env") && name !== ".env.example"), "dotenv_boundary")
  requireAcceptance(execFileSync("git", ["rev-parse", "HEAD"], { cwd: appRoot, encoding: "utf8", windowsHide: true }).trim() === ACCEPTANCE_BASE, "source_boundary")
  // Task scripts may differ. The application, schema and committed migrations must remain exact.
  requireAcceptance(execFileSync("git", ["diff", ACCEPTANCE_BASE, "--", "app", "lib", "auth.ts", "prisma", "prisma.config.ts", "next.config.mjs"], { cwd: appRoot, encoding: "utf8", windowsHide: true }).trim() === "", "source_boundary")
  requireAcceptance(execFileSync("git", ["status", "--porcelain", "--untracked-files=all", "--", "app", "lib", "auth.ts", "prisma", "prisma.config.ts", "next.config.mjs"], { cwd: appRoot, encoding: "utf8", windowsHide: true }).trim() === "", "source_boundary")
  const client = manifest.pendingActionOnly ? {} : validateAcceptanceCredential(JSON.parse(await readFile(privatePaths.credential, "utf8")), manifest)
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
    child = spawnAcceptanceCommand(npm, ["run", script], { cwd: loaded.manifest.appRoot, env, shell: process.platform === "win32" })
  } else {
    requireAcceptance(!stage || /^[a-z-]+$/.test(stage), "command_boundary")
    const server = mode === "server" || mode === "pending-server"
    const runner = join(loaded.manifest.appRoot, "scripts", server ? "calendar-application-acceptance-server.mjs" : "calendar-application-acceptance-worker.mjs")
    child = spawnAcceptanceCommand(process.execPath, [...(server ? [] : ["--conditions=react-server", "--import", pathToFileURL(join(loaded.manifest.appRoot, "scripts", "calendar-application-acceptance-node-loader.mjs")).href]), runner, mode, ...(stage ? [stage] : [])], { cwd: loaded.manifest.appRoot, env })
  }
  // Attach immediately: a failed or short-lived command must not exit before its receipt is written.
  const childResult = new Promise((done) => { child.once("error", () => done(1)); child.once("close", (code) => done(code ?? 1)) })
  let failStopping
  const stopFailure = new Promise((_, fail) => { failStopping = fail })
  // A helper can fail during initial journal setup; observe that rejection immediately.
  stopFailure.catch(() => {})
  let stopping
  /** Repeated deadline/operator signals share one teardown; its failure interrupts the main wait. */
  const stopChild = () => {
    stopping ??= stopAcceptanceCommand(child)
    stopping.catch(failStopping)
  }
  // Cancellation must own the detached child before any journal-lock or other awaited setup.
  process.on("SIGINT", stopChild)
  process.on("SIGTERM", stopChild)
  let watchdog
  let result
  let deadlineExpired
  let privateError = ""
  try {
    const store = acceptanceStore(loaded.directory, loaded.manifest.encryptionKey)
    watchdog = acceptanceCommandWatchdog({ mode, manifest: loaded.manifest, store, stopChild, pid: child.pid })
    let pending = ""
    child.stdout.on("data", (chunk) => {
      pending += chunk.toString()
      const lines = pending.split(/\r?\n/); pending = lines.pop()
      for (const line of lines) if (/^ACCEPTANCE: [a-zA-Z0-9 .:/_-]+$/.test(line)) console.log(line)
    })
    // Never forward request URLs, OAuth codes, tokens, raw database errors or provider payloads.
    const observeNativeRejection = acceptanceNativeRejectionObserver({ mode, store, pid: child.pid })
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString()
      privateError = (privateError + text).slice(-32_768)
      // Next emits this exact action error only after the owned database mutation rejects removal.
      observeNativeRejection(text).catch(() => {})
    })
    await Promise.race([store.locked(() => {
      requireAcceptance(!stopping, "owned_command_interrupted")
      return store.record({ kind: "owned-child", phase: "started", mode, pid: child.pid })
    }), stopFailure])
    result = await Promise.race([childResult, stopFailure])
  } catch (error) {
    stopChild()
    throw error
  } finally {
    try { deadlineExpired = await watchdog?.finish() }
    finally {
      try { if (stopping) await stopping }
      catch (error) {
        // Retain the owned PID for operator recovery without claiming descendant cleanup.
        await writeAcceptanceDiagnostic(loaded.directory, `owned_command_tree_stop_failed\nowned_pid:${child.pid}\nfull_tree_cleanup_unverified\n`)
        throw error
      } finally { process.off("SIGINT", stopChild); process.off("SIGTERM", stopChild) }
    }
  }
  if (result !== 0 && privateError) await writeAcceptanceDiagnostic(loaded.directory, privateError)
  requireAcceptance(result === 0 && !deadlineExpired && !stopping, "owned_command_failed")
  console.log("ACCEPTANCE: owned command completed")
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(() => { console.error("ACCEPTANCE: stopped; inspect the protected private stage receipt"); process.exitCode = 1 })
