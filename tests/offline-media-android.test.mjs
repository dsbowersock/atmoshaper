import test from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { readFile, writeFile, mkdir } from "node:fs/promises"
import { createHash } from "node:crypto"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { _android as android } from "playwright"
import { expect } from "@playwright/test"
import { offlineAudioCatalog } from "../lib/offline-media.js"

const root = fileURLToPath(new URL("..", import.meta.url))
const adb = path.join(root, "output/android-tools/sdk/platform-tools", process.platform === "win32" ? "adb.exe" : "adb")
const serial = "emulator-5580", avd = "AtmoShaper_Offline_35", pkg = "com.atmoshaper.app.development"
const shell = (...args) => execFileSync(adb, ["-s", serial, ...args], { encoding: "utf8", timeout: 30000, windowsHide: true }).trim()
const evidence = process.env.ATMOSHAPER_OFFLINE_EVIDENCE_DIR

test("Android saves actual audio online then generates and mixes it after airplane-mode restart", { timeout: 240000, skip: process.env.ATMOSHAPER_ANDROID_OFFLINE_TEST !== "1" }, async () => {
  assert.equal(shell("emu", "avd", "name").split(/\r?\n/)[0].trim(), avd)
  const apk = path.join(root, "output/android/AtmoShaper-preview.apk")
  const manifest = JSON.parse(execFileSync("python", [path.join(root, "tests/helpers/offline-apk-inventory.py"), apk], { encoding: "utf8", windowsHide: true }))
  assert.deepEqual(manifest, JSON.parse(await readFile(path.join(root, "output/offline-core/bundle-proof.json"))))
  assert.equal(manifest.syntheticReceiptAuthority, false, "the final APK contains no synthetic receipt authority")
  shell("shell", "cmd", "connectivity", "airplane-mode", "disable")
  shell("shell", "svc", "wifi", "enable")
  shell("shell", "svc", "data", "enable")
  shell("install", "-r", apk)
  assert.match(shell("shell", "dumpsys", "package", pkg), /android\.permission\.INTERNET/)
  assert.equal(shell("shell", "pm", "clear", pkg), "Success")
  shell("shell", "am", "start", "-n", `${pkg}/com.atmoshaper.app.MainActivity`)
  const devices = await android.devices({ omitDriverInstall: true })
  const device = devices.find(value => value.serial() === serial)
  assert.ok(device)
  device.setDefaultTimeout(20000)
  const errors = [], offlineRequests = []
  let previousPid = null, offline = false
  async function connect() {
    if (previousPid !== null) await expect.poll(async () => (await device.webView({ pkg }, { timeout: 20000 })).pid(), { timeout: 20000 }).not.toBe(previousPid)
    const view = await device.webView({ pkg }, { timeout: 20000 }); previousPid = view.pid()
    const page = await view.page()
    page.on("pageerror", error => errors.push(error.message))
    page.on("request", request => { if (offline && request.url().startsWith("https://media.")) offlineRequests.push(request.url()) })
    return page
  }
  try {
    let page = await connect()
    await expect(page.getByRole("heading", { name: "Clock", exact: true })).toBeVisible()
    await page.getByRole("button", { name: "Music", exact: true }).click()
    await page.getByLabel("Find a sound").fill("Little Bells")
    await page.getByRole("button", { name: "Download Little Bells", exact: true }).click()
    await expect(page.getByText("Little Bells is ready offline.", { exact: true })).toBeVisible({ timeout: 90000 })
    const catalog = JSON.parse(await readFile(path.join(root, "data/atmoshaper/production-audio-catalog.json")))
    const size = item => item.sources.reduce((sum, source) => sum + source.formats.find(format => format.id === "opus").byteSize, 0)
    const ambient = [...catalog.concepts].sort((a, b) => size(a) - size(b))[0]
    const ambientTitle = offlineAudioCatalog(catalog).find(item => item.id === ambient.id).title
    await page.getByRole("button", { name: "Atmosphere sounds", exact: true }).click()
    await page.getByLabel("Find a sound").fill(ambientTitle)
    await page.getByRole("button", { name: `Download ${ambientTitle}`, exact: true }).click()
    await expect(page.getByText(`${ambientTitle} is ready offline.`, { exact: true })).toBeVisible({ timeout: 90000 })
    shell("shell", "cmd", "connectivity", "airplane-mode", "enable")
    shell("shell", "svc", "wifi", "disable"); shell("shell", "svc", "data", "disable")
    assert.equal(shell("shell", "settings", "get", "global", "airplane_mode_on"), "1")
    assert.equal(shell("shell", "settings", "get", "global", "wifi_on"), "0")
    assert.equal(shell("shell", "settings", "get", "global", "mobile_data"), "0")
    const closed = page.waitForEvent("close")
    shell("shell", "am", "force-stop", pkg); await closed
    shell("shell", "am", "start", "-n", `${pkg}/com.atmoshaper.app.MainActivity`)
    offline = true; page = await connect()
    await expect(page.getByRole("heading", { name: "Music & Atmosphere", exact: true })).toBeVisible()
    await page.evaluate(() => {
      window.__offlineSampleStarts = 0; window.__offlineMedia = []
      const start = AudioBufferSourceNode.prototype.start
      AudioBufferSourceNode.prototype.start = function (...args) {
        if (this.context instanceof AudioContext && this.buffer?.getChannelData(0).some(value => Math.abs(value) > 0.00001)) window.__offlineSampleStarts++
        return start.apply(this, args)
      }
      const play = HTMLMediaElement.prototype.play
      HTMLMediaElement.prototype.play = function (...args) { window.__offlineMedia.push(this); return play.apply(this, args) }
    })
    await page.getByLabel("Find a sound").fill("Little Bells")
    await page.getByRole("button", { name: "Play Little Bells", exact: true }).click()
    await expect(page.getByText("Little Bells is playing from this device.", { exact: true })).toBeVisible({ timeout: 60000 })
    await expect.poll(() => page.evaluate(() => window.__offlineSampleStarts), { timeout: 45000 }).toBeGreaterThan(0)
    await page.getByRole("button", { name: "Atmosphere sounds", exact: true }).click()
    await page.getByLabel("Find a sound").fill(ambientTitle)
    await page.getByRole("button", { name: `Play ${ambientTitle}`, exact: true }).click()
    await expect(page.getByText(`${ambientTitle} is playing from this device.`, { exact: true })).toBeVisible()
    await expect.poll(() => page.evaluate(() => window.__offlineMedia.some(audio => audio.src.startsWith("blob:") && audio.currentTime > 0)), { timeout: 15000 }).toBe(true)
    await page.getByRole("button", { name: "Clock", exact: true }).click()
    await expect(page.getByRole("heading", { name: "Clock", exact: true })).toBeVisible()
    if (evidence) { await mkdir(evidence, { recursive: true }); await writeFile(path.join(evidence, "android-offline-music-clock.png"), await device.screenshot()) }
    await page.getByRole("button", { name: "Music", exact: true }).click()
    await page.getByRole("button", { name: "Stop all audio", exact: true }).click()
    assert.deepEqual(errors, []); assert.deepEqual(offlineRequests, [])
    const proof = { apkSha256: createHash("sha256").update(await readFile(apk)).digest("hex"), actualStation: "Little Bells", ambient: ambientTitle, airplaneMode: true, wifi: false, cellular: false, actualProcessRestart: true, generativeNonSilentSamples: true, ambientLocalPlayback: true, offlineAudioRequests: 0, syntheticReceiptAuthority: false, physicalDeviceVerified: false, checkedAt: new Date().toISOString() }
    await writeFile(path.join(root, "output/android/offline-media-proof.json"), JSON.stringify(proof, null, 2))
  } finally { await Promise.all(devices.map(value => value.close())) }
})
