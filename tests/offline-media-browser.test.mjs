import test from "node:test"
import assert from "node:assert/strict"
import { readFile, mkdir } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium, expect } from "@playwright/test"
import { buildOfflineCore } from "../scripts/build-offline-core.mjs"

const root = fileURLToPath(new URL("..", import.meta.url))
const core = path.join(root, "output/offline-core/core")
const entry = "https://appassets.androidplatform.net/assets/core/index.html"
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".txt": "text/plain" }
const evidence = process.env.ATMOSHAPER_OFFLINE_EVIDENCE_DIR

test("real station and ambient downloads play after an offline restart without fetching audio", { timeout: 240000 }, async () => {
  await buildOfflineCore()
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" })
  const errors = [], offlineRequests = []
  let offline = false
  await context.addInitScript(() => {
    window.__audioStarts = 0; window.__nonSilentStarts = 0
    window.__offlineMediaElements = []
    const play = HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.play = function (...args) { window.__offlineMediaElements.push(this); return play.apply(this, args) }
    const start = AudioBufferSourceNode.prototype.start
    AudioBufferSourceNode.prototype.start = function (...args) {
      if (this.context instanceof AudioContext) {
        window.__audioStarts++
        if (this.buffer && this.buffer.getChannelData(0).some(value => Math.abs(value) > 0.00001)) window.__nonSilentStarts++
      }
      return start.apply(this, args)
    }
  })
  await context.route("**/*", async route => {
    const url = new URL(route.request().url())
    if (url.origin === "https://media.atmoshaper.com") {
      if (offline) { offlineRequests.push(url.href); return route.abort() }
      return route.continue()
    }
    assert.equal(url.origin, "https://appassets.androidplatform.net")
    const filename = path.resolve(core, decodeURIComponent(url.pathname.slice("/assets/core/".length)))
    assert.ok(filename.startsWith(core + path.sep))
    await route.fulfill({ body: await readFile(filename), contentType: mime[path.extname(filename)] ?? "application/octet-stream" })
  })
  const page = await context.newPage()
  page.on("pageerror", error => errors.push(error.message))
  page.on("console", value => { if (value.type() === "error") errors.push(value.text()) })
  try {
    await page.goto(entry)
    await expect(page.getByRole("heading", { name: "Clock", exact: true })).toBeVisible()
    await page.getByRole("button", { name: "Music", exact: true }).click()
    await page.getByLabel("Find a sound").fill("Little Bells")
    await page.getByRole("button", { name: "Download Little Bells", exact: true }).click()
    await expect(page.getByText("Little Bells is ready offline.", { exact: true })).toBeVisible({ timeout: 90000 })
    await page.getByRole("button", { name: "Atmosphere sounds", exact: true }).click()
    // Pick the smallest actual published concept so this is real-media evidence,
    // without downloading hundreds of optional source files during acceptance.
    const catalog = JSON.parse(await readFile(path.join(root, "data/atmoshaper/production-audio-catalog.json")))
    const ambient = [...catalog.concepts].sort((a, b) => a.sources.reduce((sum, source) => sum + source.formats.find(format => format.id === "opus").byteSize, 0) - b.sources.reduce((sum, source) => sum + source.formats.find(format => format.id === "opus").byteSize, 0))[0]
    await page.getByLabel("Find a sound").fill(ambient.label)
    await page.getByRole("button", { name: `Download ${ambient.label}`, exact: true }).click()
    await expect(page.getByText(`${ambient.label} is ready offline.`, { exact: true })).toBeVisible({ timeout: 90000 })
    offline = true; await context.setOffline(true)
    await page.reload()
    await expect(page.getByRole("heading", { name: "Music & Atmosphere", exact: true })).toBeVisible()
    await page.getByLabel("Find a sound").fill("Little Bells")
    await page.getByRole("button", { name: "Play Little Bells", exact: true }).click()
    await expect(page.getByText("Little Bells is playing from this device.", { exact: true })).toBeVisible({ timeout: 60000 })
    await expect.poll(() => page.evaluate(() => window.__nonSilentStarts), { timeout: 45000 }).toBeGreaterThan(0)
    await page.getByRole("button", { name: "Clock", exact: true }).click()
    await expect(page.getByRole("heading", { name: "Clock", exact: true })).toBeVisible()
    await page.getByRole("button", { name: "Music", exact: true }).click()
    await expect(page.getByRole("button", { name: "Stop Little Bells", exact: true })).toBeVisible()
    await page.getByRole("button", { name: "Atmosphere sounds", exact: true }).click()
    await page.getByLabel("Find a sound").fill(ambient.label)
    await page.getByRole("button", { name: `Play ${ambient.label}`, exact: true }).click()
    await expect(page.getByText(`${ambient.label} is playing from this device.`, { exact: true })).toBeVisible({ timeout: 20000 })
    await expect.poll(() => page.evaluate(() => window.__offlineMediaElements.some(audio => audio.src.startsWith("blob:") && audio.readyState >= 2 && audio.currentTime > 0)), { timeout: 15000 }).toBe(true)
    if (evidence) { await mkdir(evidence, { recursive: true }); await page.screenshot({ path: path.join(evidence, "offline-music-phone.png") }) }
    await page.getByRole("button", { name: "Remove download", exact: true }).click()
    await expect(page.getByRole("button", { name: `Play ${ambient.label}`, exact: true })).toBeDisabled()
    await page.getByRole("button", { name: "Stop all audio", exact: true }).click()
    await expect(page.getByRole("button", { name: "Stop all audio", exact: true })).toHaveCount(0)
    assert.deepEqual(offlineRequests, [])
    assert.deepEqual(errors, [])
  } catch (error) {
    console.error(JSON.stringify({ errors, url: page.url(), body: await page.locator("body").innerText() }))
    throw error
  } finally { await context.close(); await browser.close() }
})
