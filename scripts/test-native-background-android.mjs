import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { createHash, generateKeyPairSync, randomBytes } from "node:crypto"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium, expect } from "@playwright/test"
import { signOfflineBackgroundReceipt } from "../lib/server/offline-background-receipt.ts"

const root = fileURLToPath(new URL("../", import.meta.url))
const tools = path.join(root, "output/android-tools")
const output = path.join(root, "output/native-background-android", String(Date.now()))
const candidate = path.join(root, "output/android/AtmoShaper-preview.apk")
const predecessor = path.resolve(root, "../../output/android/AtmoShaper-shared-website-preview-0.4.2-8f603319.apk")
const pkg = "com.atmoshaper.app.development"
const entry = "https://appassets.androidplatform.net/assets/core/"
const accessDb = "atmoshaper.android.background-access.v1"
const clockDb = "atmoshaper.android.chimer-runtime.v1"
// Pegboard draws a real frame even when the fixture disables system animations.
const effect = "massage-lab-dot-grid"
const timeout = 35_000
const executable = name => process.platform === "win32" ? name + ".exe" : name
const run = (command, args) => execFileSync(command, args, { cwd: root, encoding: "utf8", timeout: 90_000, windowsHide: true })
const adb = (...args) => run(path.join(tools, "sdk/platform-tools", executable("adb")), ["-s", "emulator-5594", ...args]).trim()
const digest = async file => createHash("sha256").update(await readFile(file)).digest("hex")
const signer = (...args) => run(path.join(tools, "jdk/bin", executable("java")), [
  "-jar", path.join(tools, "sdk/build-tools/35.0.0/lib/apksigner.jar"), ...args,
])

/** Never attach to a physical device or a pre-existing unmarked installation. */
function guard() {
  assert.equal(adb("emu", "avd", "name").split(/\r?\n/)[0].trim(), "AtmoShaper_Pilot_87_92_API35")
  adb("shell", "test", "-f", "/data/local/tmp/atmoshaper-parity-fixture")
  assert.equal(adb("shell", "settings", "get", "global", "airplane_mode_on"), "1")
  assert.equal(adb("shell", "settings", "get", "global", "wifi_on"), "0")
}

async function fixtureApk(apk, label, replacement) {
  const unsigned = path.join(output, label + "-unsigned.apk")
  const aligned = path.join(output, label + "-aligned.apk")
  const signed = path.join(output, label + "-synthetic-only.apk")
  run("python", [path.join(root, "tests/helpers/native-background-fixture-apk.py"), apk, replacement, unsigned])
  run(path.join(tools, "sdk/build-tools/35.0.0", executable("zipalign")), ["-P", "16", "4", unsigned, aligned])
  signer("sign", "--ks", path.join(tools, "debug.keystore"), "--ks-pass", "pass:android", "--key-pass", "pass:android", "--out", signed, aligned)
  signer("verify", signed)
  const manifest = JSON.parse(run("python", [path.join(root, "tests/helpers/offline-apk-inventory.py"), signed]))
  assert.equal(manifest.syntheticReceiptAuthority, true)
  return signed
}

async function fixtureRecord(page, database, store, key, changes) {
  return page.evaluate(async ({ database, store, key, changes }) => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open(database, 1)
      request.onupgradeneeded = () => request.result.createObjectStore(store)
      request.onerror = request.onblocked = () => reject(new Error("Fixture database unavailable"))
      request.onsuccess = () => resolve(request.result)
    })
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(store, changes ? "readwrite" : "readonly", { durability: "strict" })
        const table = tx.objectStore(store)
        const read = table.get(key)
        let value
        tx.oncomplete = () => resolve(value)
        tx.onerror = tx.onabort = () => reject(new Error("Fixture transaction failed"))
        read.onsuccess = () => {
          value = read.result
          if (changes) {
            value = { ...value, ...changes }
            table.put(value, key)
          }
        }
      })
    } finally { db.close() }
  }, { database, store, key, changes })
}

function start(activity, system = []) {
  adb("shell", "am", "start", "-W", ...system, "-n", pkg + "/com.atmoshaper.app." + activity)
}
const startHome = () => start("HomeActivity", ["-f", "0x10200000", "-a", "android.intent.action.MAIN", "-c", "android.intent.category.LAUNCHER"])

function install(apk, flags) {
  assert.equal(adb("install", "-r", ...flags, apk).split(/\r?\n/).at(-1), "Success")
}

function installedVersion() {
  const installed = adb("shell", "cmd", "package", "list", "packages", "--show-versioncode", pkg)
    .split(/\r?\n/).find(line => line.startsWith("package:" + pkg + " versionCode:"))
  const version = Number(installed?.match(/versionCode:(\d+)/)?.[1])
  assert.ok(Number.isSafeInteger(version) && version > 0)
  return version
}

async function nativeText(text, tap = false) {
  const remote = "/data/local/tmp/atmoshaper-native-background-ui.xml"
  let bounds
  await expect.poll(() => {
    try {
      adb("shell", "uiautomator", "dump", remote)
      const nodes = adb("shell", "cat", remote).match(/<node\b[^>]+>/g) ?? []
      bounds = nodes.find(node => node.includes('text="' + text + '"'))?.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/)
      return Boolean(bounds)
    } catch { return false }
  }, { timeout }).toBe(true)
  if (tap) {
    const [, x1, y1, x2, y2] = bounds.map(Number)
    adb("shell", "input", "tap", String(Math.round((x1 + x2) / 2)), String(Math.round((y1 + y2) / 2)))
  }
}

const ports = []
async function connect() {
  let pid
  await expect.poll(() => {
    try {
      pid = adb("shell", "pidof", pkg)
      return /^\d+$/.test(pid) && adb("shell", "cat", "/proc/net/unix").includes("@webview_devtools_remote_" + pid)
    } catch { return false }
  }, { timeout }).toBe(true)
  const port = adb("forward", "tcp:0", "localabstract:webview_devtools_remote_" + pid)
  ports.push(port)
  return chromium.connectOverCDP("http://127.0.0.1:" + port, { noDefaults: true, timeout })
}

async function packagedPage(browser, relative) {
  const context = browser.contexts()[0]
  const url = entry + relative
  let page
  await expect.poll(() => {
    page = context.pages().find(value => value.url() === url)
    return Boolean(page)
  }, { timeout }).toBe(true)
  return page
}

async function visibleEffect(browser) {
  const page = await packagedPage(browser, "clock-effect.html")
  const surface = page.locator('[data-offline-background="' + effect + '"] canvas').first()
  await expect(surface).toBeVisible({ timeout })
  await expect.poll(() => surface.evaluate(canvas => {
    const region = canvas.getContext("2d")?.getImageData(0, 0, Math.min(96, canvas.width), Math.min(96, canvas.height))
    return Boolean(region && new Set(region.data).size > 3)
  }), { timeout }).toBe(true)
  return page
}

guard()
await mkdir(output, { recursive: true })
assert.equal(await digest(candidate), JSON.parse(await readFile(path.join(root, "output/android/build-proof.json"))).sha256)
assert.equal(await digest(predecessor), "8f603319474beaf5650d278d1ce802e93eee37a8fd8d731536614607d0264da2")
const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" })
const publicKeyPath = path.join(output, "synthetic-public-key.json")
const keyId = "synthetic-native-background-acceptance"
await writeFile(publicKeyPath, JSON.stringify([{ id: keyId, jwk: publicKey.export({ format: "jwk" }) }]))
const before = await fixtureApk(predecessor, "predecessor", publicKeyPath)
const after = await fixtureApk(candidate, "candidate", publicKeyPath)

async function approve(page, owned, leaseDuration = null) {
  await expect.poll(async () => Boolean((await fixtureRecord(page, accessDb, "access", "state"))?.device), { timeout }).toBe(true)
  const challenge = randomBytes(32).toString("base64url")
  const now = await page.evaluate(() => Date.now())
  const pending = await fixtureRecord(page, accessDb, "access", "state", { pending: { challenge, at: now } })
  const receipt = signOfflineBackgroundReceipt({
    device: pending.device, challenge, userId: "synthetic-native", now,
    premiumUntil: leaseDuration === null ? null : now + leaseDuration, owned,
  }, {
    ATMOSHAPER_OFFLINE_ACCESS_ENABLED: "true",
    ATMOSHAPER_OFFLINE_ACCESS_KEY_ID: keyId,
    ATMOSHAPER_OFFLINE_ACCESS_PRIVATE_KEY: privateKey.export({ type: "pkcs8", format: "pem" }),
  })
  await page.evaluate(value => window.dispatchEvent(new CustomEvent("atmoshaper:offline-access", { detail: value })), receipt)
  await expect.poll(async () => (await fixtureRecord(page, accessDb, "access", "state"))?.lastIssuedAt, { timeout }).toBe(now)
  return { receipt, device: pending.device, lastIssuedAt: now }
}

const browsers = []
try {
  guard()
  adb("shell", "am", "force-stop", pkg)
  install(before, ["-d"])
  const earlierVersion = installedVersion()
  assert.equal(adb("shell", "pm", "clear", pkg), "Success")
  start("MainActivity")
  const earlier = await connect()
  browsers.push(earlier)
  const oldPage = await packagedPage(earlier, "index.html")
  await expect(oldPage.getByTestId("home-launcher")).toBeVisible({ timeout })
  const original = await approve(oldPage, [effect])
  console.log("The earlier installed verifier accepted the synthetic owned background receipt.")
  await fixtureRecord(oldPage, clockDb, "clock", "state", { version: 1, settings: { backgroundId: effect } })
  adb("shell", "am", "force-stop", pkg)
  install(after, [])
  const candidateVersion = installedVersion()
  assert.ok(candidateVersion > earlierVersion, "The installed development version advanced in place")
  startHome()
  await nativeText("Clock &amp; timer", true)
  await nativeText("Backgrounds")
  const upgraded = await connect()
  browsers.push(upgraded)
  const processId = adb("shell", "pidof", pkg)
  const firstSurface = await visibleEffect(upgraded)
  await nativeText("Close Clock", true)
  await expect.poll(() => firstSurface.isClosed(), { timeout }).toBe(true)
  await nativeText("Clock &amp; timer", true)
  const surface = await visibleEffect(upgraded)
  console.log("The upgraded native Clock rendered the owned effect before and after reopening.")
  await surface.screenshot({ path: path.join(output, "owned-clock-effect.png") })
  await nativeText("Backgrounds", true)
  await nativeText("Customize background")
  await nativeText("Manage offline background access", true)
  const legacy = await packagedPage(upgraded, "index.html")
  await expect(legacy.getByRole("heading", { name: "Offline background access" })).toBeVisible({ timeout })
  const retained = await fixtureRecord(legacy, accessDb, "access", "state")
  assert.ok(retained.receipt === original.receipt && retained.device === original.device && retained.lastIssuedAt === original.lastIssuedAt,
    "The same signed evidence, install binding and high-water issue timestamp survived update")
  await approve(legacy, [])
  startHome()
  await nativeText("Your verified access does not include this background.")
  await expect.poll(() => surface.isClosed(), { timeout }).toBe(true)
  start("MainActivity")
  await approve(legacy, [], 30_000)
  startHome()
  await nativeText("Customize background")
  adb("shell", "input", "keyevent", "KEYCODE_BACK")
  const leased = await visibleEffect(upgraded)
  await nativeText("Premium background access expired. Reconnect to refresh it.")
  await expect.poll(() => leased.isClosed(), { timeout }).toBe(true)
  assert.equal(adb("shell", "pidof", pkg), processId)
  await writeFile(path.join(output, "proof.json"), JSON.stringify({
    predecessorSha256: await digest(before), candidateSha256: await digest(after), earlierVersion, candidateVersion, sameReceipt: true,
    offlineOwnedEffect: effect, canvasPixelsAfterReentry: true, nativeCustomization: true,
    animatorDurationScale: adb("shell", "settings", "get", "global", "animator_duration_scale"),
    signedRevocationInSameProcess: true, sameProcessExpiry: true,
  }, null, 2))
  console.log("The offline signed upgrade retained its owned Clock effect and revoked it in the same Android process.")
} finally {
  guard()
  for (const port of ports) adb("forward", "--remove", "tcp:" + port)
  for (const browser of browsers) {
    void browser.close().catch(() => undefined)
  }
  adb("shell", "am", "force-stop", pkg)
}
