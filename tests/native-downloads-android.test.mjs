import test from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { setTimeout as delay } from "node:timers/promises"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"
import { mediaUrl, OFFLINE_MEDIA_DB } from "../lib/offline-media.js"

const root = fileURLToPath(new URL("..", import.meta.url))
const adb = path.join(root, "output/android-tools/sdk/platform-tools", process.platform === "win32" ? "adb.exe" : "adb")
const fixture = { serial: "emulator-5594", name: "AtmoShaper_Pilot_87_92_API35" }
const pkg = "com.atmoshaper.app.development"
const launch = `${pkg}/com.atmoshaper.app.HomeActivity`
const downloadUrl = "https://appassets.androidplatform.net/assets/core/native-audio-downloads.html"
const playbackUrl = "https://appassets.androidplatform.net/assets/core/native-audio-player.html"
const hierarchyPath = "/data/local/tmp/atmoshaper-native-downloads.xml"
const enabled = process.env.ATMOSHAPER_NATIVE_DOWNLOADS_ANDROID_TEST === "1"

const run = (...args) => execFileSync(adb, ["-s", fixture.serial, ...args], {
  timeout: 30_000, windowsHide: true, encoding: "utf8", maxBuffer: 8 * 1024 * 1024,
}).trim()
const shell = (...args) => run("shell", ...args)
const digest = bytes => createHash("sha256").update(bytes).digest("hex")

async function waitFor(label, read, timeout = 45_000) {
  const started = Date.now()
  let lastError
  while (Date.now() - started < timeout) {
    try {
      const value = await read()
      if (value) return value
    } catch (error) { lastError = error }
    await delay(150)
  }
  throw new Error(`Missing ${label}`, { cause: lastError })
}

function hierarchy() {
  shell("uiautomator", "dump", hierarchyPath)
  return shell("cat", hierarchyPath)
}

async function tap(value, attribute = "text") {
  const bounds = await waitFor(value, () => [...hierarchy().matchAll(/<node\b[^>]+>/g)]
    .find(([node]) => node.includes(`${attribute}="${value}"`))?.[0]
    .match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/)?.slice(1).map(Number))
  const [left, top, right, bottom] = bounds
  shell("input", "tap", String((left + right) >> 1), String((top + bottom) >> 1))
}

const visible = text => waitFor(text, () => hierarchy().includes(`text="${text}"`))

async function selectSound(title, id) {
  await tap("native_download_query", "resource-id")
  shell("input", "text", title.replaceAll(" ", "%s"))
  await tap(`native_download_${id}`, "resource-id")
}

/** Inspect or mutate only a fixture-owned row already created by this run. */
function fixturePack(page, id, action = "read") {
  return page.evaluate(({ dbName, id, action }) => new Promise((resolve, reject) => {
    const open = indexedDB.open(dbName)
    open.onerror = () => reject(open.error)
    open.onsuccess = () => {
      const db = open.result
      const tx = db.transaction(["packs", "metadata"], action === "read" ? "readonly" : "readwrite")
      const packs = tx.objectStore("packs")
      const metadata = tx.objectStore("metadata")
      const read = packs.get(id)
      const summary = metadata.get(id)
      read.onsuccess = () => {
        if (action === "corrupt" && read.result) {
          new Uint8Array(read.result.files[0].data)[4] ^= 1
          packs.put(read.result)
        }
        if (action === "remove") { packs.delete(id); metadata.delete(id) }
      }
      tx.oncomplete = () => {
        db.close()
        resolve({ pack: read.result?.revision ?? null, metadata: summary.result?.revision ?? null })
      }
      tx.onabort = tx.onerror = () => { db.close(); reject(tx.error) }
    }
  }), { dbName: OFFLINE_MEDIA_DB, id, action })
}

test("native Downloads cancel, reject storage failure and damage, then play saved sound after cold offline restart", {
  skip: !enabled,
  timeout: 360_000,
}, async () => {
  assert.equal(run("emu", "avd", "name").split(/[\r\n]+/)[0], fixture.name)
  shell("test", "-f", "/data/local/tmp/atmoshaper-parity-fixture")
  const apk = path.join(root, "output/android/AtmoShaper-preview.apk")
  const build = JSON.parse(await readFile(path.join(root, "output/android/build-proof.json"), "utf8"))
  assert.equal(digest(await readFile(apk)), build.sha256)
  const airplane = shell("settings", "get", "global", "airplane_mode_on")
  const wifi = shell("settings", "get", "global", "wifi_on")
  const data = shell("settings", "get", "global", "mobile_data")
  const output = path.join(root, "output/native-downloads-android")
  const observations = []
  let browser, port, page, id
  await mkdir(output, { recursive: true })
  const report = completed => writeFile(path.join(output, "acceptance.json"), JSON.stringify({
    apkSha256: build.sha256, fixture: fixture.name, observations, complete: completed, physicalDeviceVerified: false,
  }, null, 2))
  const note = async observation => {
    observations.push(observation)
    console.log(observation)
    await report(false)
  }

  async function openDownloads() {
    shell("am", "start", "-W", "-n", launch)
    await tap("Music")
    await tap("Downloads")
    const pid = shell("pidof", pkg)
    assert.match(pid, /^\d+$/)
    const socket = `webview_devtools_remote_${pid}`
    await waitFor("guarded downloads WebView", () => shell("cat", "/proc/net/unix").includes(`@${socket}`))
    port = run("forward", "tcp:0", `localabstract:${socket}`)
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`, { timeout: 20_000, noDefaults: true })
    return waitFor("download storage document", () => browser.contexts().flatMap(context => context.pages())
      .find(candidate => candidate.url() === downloadUrl))
  }

  async function disconnect() {
    if (browser) await browser.close().catch(() => undefined)
    browser = undefined
    if (port) run("forward", "--remove", `tcp:${port}`)
    port = undefined
  }

  try {
    run("install", "-r", "-d", apk)
    shell("am", "force-stop", pkg)
    shell("cmd", "connectivity", "airplane-mode", "disable")
    shell("svc", "wifi", "enable")
    shell("input", "keyevent", "KEYCODE_WAKEUP")
    shell("wm", "dismiss-keyguard")
    page = await openDownloads()

    // First inspect the chosen sound through the real UI so the app owns the
    // database open. Refuse to overwrite a pre-existing download.
    const catalog = JSON.parse(await readFile(path.join(root, "data/atmoshaper/production-audio-catalog.json")))
    const item = catalog.concepts.find(candidate => candidate.id === "moodist-boiling-water")
    const candidate = item.id
    await selectSound(item.label, candidate)
    await visible("Not downloaded")
    assert.deepEqual(await fixturePack(page, candidate), { pack: null, metadata: null })
    id = candidate
    const spec = item.sources[0].formats.find(format => format.id === "opus")
    const url = mediaUrl(spec.publicUrl)
    const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(20_000) })
    assert.equal(response.status, 200)
    const bytes = Buffer.from(await response.arrayBuffer())
    assert.equal(bytes.length, spec.byteSize)
    assert.equal(digest(bytes), spec.sha256)
    const respondWithFixture = target => target.evaluate(({ url, data }) => {
      const bytes = Uint8Array.from(atob(data), char => char.charCodeAt(0))
      let requests = 0
      window.fixtureMediaRequests = () => requests
      window.fetch = async (input, options) => {
        if (input !== url || options?.credentials !== "omit") throw new Error("Unexpected fixture media request")
        if (++requests === 1) {
          return new Promise((_, reject) => {
            const signal = options.signal
            if (signal.aborted) reject(signal.reason)
            else signal.addEventListener("abort", () => reject(signal.reason), { once: true })
          })
        }
        return new Response(bytes, { headers: { "content-type": "audio/ogg" } })
      }
    }, { url, data: bytes.toString("base64") })
    const beginBlockedDownload = async () => {
      await respondWithFixture(page)
      await tap("Download")
      await waitFor("guarded media request", () => page.evaluate(() => window.fixtureMediaRequests() === 1), 15_000)
    }

    await beginBlockedDownload()
    shell("am", "force-stop", pkg)
    await disconnect()
    page = await openDownloads()
    await selectSound(item.label, id)
    await visible("Not downloaded")
    assert.deepEqual(await fixturePack(page, id), { pack: null, metadata: null })
    await note("An Android force-stop during transfer left no published pack after reopening.")

    await beginBlockedDownload()
    await tap("Cancel download")
    await visible("Download cancelled.")
    assert.deepEqual(await fixturePack(page, id), { pack: null, metadata: null })
    await note("Cancelled an in-flight public byte fixture with no pack or metadata publication.")

    await page.evaluate(() => {
      const put = IDBObjectStore.prototype.put
      IDBObjectStore.prototype.put = function (...args) {
        if (this.name === "metadata") throw new DOMException("Synthetic quota failure", "QuotaExceededError")
        return put.apply(this, args)
      }
      window.restoreFixtureStorage = () => { IDBObjectStore.prototype.put = put }
    })
    await tap("Retry download")
    await visible("Could not read or save the download. Check device storage and try again.")
    assert.deepEqual(await fixturePack(page, id), { pack: null, metadata: null })
    await page.evaluate(() => window.restoreFixtureStorage())
    await note("Rejected a storage write failure and aborted both stores.")

    await tap("Check again")
    await visible("Not downloaded")
    await tap("Download")
    await visible("Ready offline")
    const saved = await fixturePack(page, id)
    assert.match(saved.pack, /^[a-f0-9]{64}$/)
    assert.equal(saved.pack, saved.metadata)

    await fixturePack(page, id, "corrupt")
    await tap("Play saved audio")
    await visible("Saved download is damaged. Download it again to repair it.")
    assert.doesNotMatch(hierarchy(), /text="Play saved audio"/)
    assert.equal(await page.evaluate(() => window.fixtureMediaRequests()), 3)
    await tap("Retry download")
    await visible("Ready offline")
    assert.deepEqual(await fixturePack(page, id), saved)
    await note("Saved-only Play rechecked damaged bytes, cleared Ready and kept network fallback disabled. Explicit repair restored the same revision.")

    await disconnect()
    shell("am", "force-stop", pkg)
    shell("cmd", "connectivity", "airplane-mode", "enable")
    shell("svc", "wifi", "disable")
    shell("svc", "data", "disable")
    page = await openDownloads()
    await selectSound(item.label, id)
    await visible("Ready offline")
    assert.deepEqual(await fixturePack(page, id), saved)
    await tap("Play saved audio")
    const player = await waitFor("audio renderer", () => browser.contexts().flatMap(context => context.pages())
      .find(candidate => candidate.url() === playbackUrl))
    const audible = await waitFor("audible local render", () => player.evaluate(() => {
      const probe = window.atmoNativeAudio?.outputProbe()
      return probe?.peak > 0.00001 && probe
    }))
    const pid = shell("pidof", pkg)
    const actor = new RegExp(`(?:pid:|/)${pid}\\b`)
    assert.ok(shell("dumpsys", "audio").split(/\r?\n/).filter(line => actor.test(line)).some(line => /state:started/i.test(line)))
    await tap("Stop")
    await note(`Cold airplane-mode restart played saved audio (peak ${audible.peak}).`)
    shell("input", "keyevent", "KEYCODE_HOME")
    await fixturePack(page, id, "remove")
    shell("am", "start", "-W", "-n", launch)
    await visible("Not downloaded")
    assert.doesNotMatch(hierarchy(), /text="Play saved audio"/)
    await note("Resuming the open Downloads dialog detected a pack removed from the shared store.")
    id = undefined
    await report(true)
  } finally {
    if (id && page && !page.isClosed()) await fixturePack(page, id, "remove").catch(() => undefined)
    await disconnect()
    shell("am", "force-stop", pkg)
    shell("cmd", "connectivity", "airplane-mode", airplane === "1" ? "enable" : "disable")
    shell("svc", "wifi", wifi === "0" ? "disable" : "enable")
    shell("svc", "data", data === "0" ? "disable" : "enable")
  }
})
