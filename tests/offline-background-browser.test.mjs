import test from "node:test"
import assert from "node:assert/strict"
import { generateKeyPairSync } from "node:crypto"
import { readFile, writeFile, mkdir } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium, expect } from "@playwright/test"
import { buildOfflineCore } from "../scripts/build-offline-core.mjs"
import { backgroundRegistry } from "../components/backgrounds/backgroundRegistry.ts"
import { signOfflineBackgroundReceipt } from "../lib/server/offline-background-receipt.ts"

const root = fileURLToPath(new URL("..", import.meta.url)), core = path.join(root, "output/offline-acceptance-backgrounds/core")
const entry = "https://appassets.androidplatform.net/assets/core/index.html"
const evidence = process.env.ATMOSHAPER_OFFLINE_EVIDENCE_DIR
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".txt": "text/plain" }

test("signed access unlocks all bundled renderers offline; expiry, revocation and replay fail closed", { timeout: 240000 }, async () => {
  // Ephemeral authority exists only in this acceptance bundle. The final normal
  // Android build is rebuilt without it and its manifest proves that boundary.
  const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" })
  const publicKeysPath = path.join(root, "output/offline-acceptance-public-keys.json")
  await mkdir(path.dirname(publicKeysPath), { recursive: true })
  await writeFile(publicKeysPath, JSON.stringify([{ id: "synthetic-acceptance", jwk: publicKey.export({ format: "jwk" }) }]))
  await buildOfflineCore({ testPublicKeysPath: publicKeysPath, outputName: "offline-acceptance-backgrounds" })
  const environment = { ATMOSHAPER_OFFLINE_ACCESS_ENABLED: "true", ATMOSHAPER_OFFLINE_ACCESS_KEY_ID: "synthetic-acceptance", ATMOSHAPER_OFFLINE_ACCESS_PRIVATE_KEY: privateKey.export({ type: "pkcs8", format: "pem" }) }
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" })
  await context.setOffline(true)
  const errors = [], foreign = []
  await context.route("**/*", async route => {
    const url = new URL(route.request().url())
    if (url.origin === "https://www.atmoshaper.com" && url.pathname === "/account/offline-access") return route.fulfill({ contentType: "text/html", body: "Synthetic approval handoff" })
    if (url.origin !== "https://appassets.androidplatform.net" || !url.pathname.startsWith("/assets/core/")) { foreign.push(url.href); return route.abort() }
    const filename = path.resolve(core, decodeURIComponent(url.pathname.slice("/assets/core/".length)))
    assert.ok(filename.startsWith(core + path.sep))
    await route.fulfill({ body: await readFile(filename), contentType: mime[path.extname(filename)] ?? "application/octet-stream" })
  })
  const page = await context.newPage()
  page.on("pageerror", error => errors.push(error.message))
  page.on("console", value => { if (value.type() === "error") errors.push(value.text()) })
  async function requestReceipt({ premiumUntil, owned }) {
    await page.getByRole("button", { name: "Verify or refresh account access", exact: true }).click()
    await expect(page).toHaveURL(/www\.atmoshaper\.com\/account\/offline-access\?/)
    const query = new URL(page.url()).searchParams
    const receipt = signOfflineBackgroundReceipt({ device: query.get("device"), challenge: query.get("challenge"), userId: "synthetic-owner", now: Date.now(), premiumUntil, owned }, environment)
    await page.goto(entry)
    await expect(page.getByRole("heading", { name: "Backgrounds", exact: true })).toBeVisible()
    return receipt
  }
  async function approve(input) {
    const receipt = await requestReceipt(input)
    await page.evaluate(receipt => window.dispatchEvent(new CustomEvent("atmoshaper:offline-access", { detail: receipt })), receipt)
    await expect(page.getByText("Background access saved for offline use.", { exact: true })).toBeVisible()
    return receipt
  }
  try {
    await page.goto(entry)
    await page.getByRole("button", { name: "Backgrounds", exact: true }).click()
    const premium = backgroundRegistry.filter(item => item.enabled && item.requiresSubscription)
    await page.getByLabel("Find a background").fill(premium[0].label)
    await expect(page.getByRole("button", { name: `${premium[0].label} · Verify access online`, exact: true })).toBeDisabled()
    const expiry = Date.now() + 15 * 60 * 1000
    await approve({ premiumUntil: expiry, owned: [] })
    const enabled = backgroundRegistry.filter(item => item.enabled)
    for (const background of enabled) {
      await page.getByLabel("Find a background").fill(background.label)
      await page.getByRole("button", { name: background.label, exact: true }).click()
      await expect(page.locator(`[data-offline-background="${background.id}"]`)).toBeVisible()
      await expect(page.locator(`[data-offline-background="${background.id}"] > *`)).not.toHaveCount(0)
    }
    if (evidence) { await mkdir(evidence, { recursive: true }); await page.screenshot({ path: path.join(evidence, "offline-background-access-phone.png") }) }
    // Real reload preserves the signature, not a boolean entitlement flag.
    await page.reload()
    await expect(page.getByRole("button", { name: "Forget account access", exact: true })).toBeVisible()
    await page.evaluate(expiry => { Date.now = () => expiry + 1 }, expiry)
    await expect(page.locator('[data-offline-background="massage-lab-moving-gradient"]')).toBeVisible()
    await page.getByLabel("Find a background").fill(premium[0].label)
    await expect(page.getByRole("button", { name: `${premium[0].label} · Verify access online`, exact: true })).toBeDisabled()
    // Re-enter restores the real test clock, then a fresh owned-only snapshot.
    await page.reload()
    const ownedReceipt = await approve({ premiumUntil: null, owned: [premium[0].id] })
    await page.getByLabel("Find a background").fill(premium[0].label)
    await page.getByRole("button", { name: `${premium[0].label} · Owned`, exact: true }).click()
    await page.evaluate(() => { const future = Date.now() + 500 * 86400000; Date.now = () => future })
    await expect(page.locator(`[data-offline-background="${premium[0].id}"]`)).toBeVisible()
    await page.reload()
    await approve({ premiumUntil: null, owned: [] })
    await page.evaluate(receipt => window.dispatchEvent(new CustomEvent("atmoshaper:offline-access", { detail: receipt })), ownedReceipt)
    await expect(page.getByText("This approval expired or was replaced. Verify access again from this app.", { exact: true })).toBeVisible()
    await page.getByLabel("Find a background").fill(premium[0].label)
    await expect(page.getByRole("button", { name: `${premium[0].label} · Verify access online`, exact: true })).toBeDisabled()
    // A duplicate rejected return must not invalidate a prior committed result
    // whose final verification is still pending.
    const duplicate = await requestReceipt({ premiumUntil: null, owned: [premium[1].id] })
    await page.evaluate(() => {
      let count = 0
      const verify = crypto.subtle.verify.bind(crypto.subtle)
      window.__restoreOfflineVerification = () => { crypto.subtle.verify = verify }
      crypto.subtle.verify = (...args) => {
        const result = verify(...args)
        if (++count !== 2) return result
        return new Promise(resolve => { window.__releaseOfflineVerification = () => result.then(resolve) })
      }
    })
    await page.evaluate(receipt => window.dispatchEvent(new CustomEvent("atmoshaper:offline-access", { detail: receipt })), duplicate)
    await expect.poll(() => page.evaluate(() => Boolean(window.__releaseOfflineVerification))).toBe(true)
    await page.evaluate(receipt => window.dispatchEvent(new CustomEvent("atmoshaper:offline-access", { detail: receipt })), duplicate)
    await expect(page.getByText("This approval expired or was replaced. Verify access again from this app.", { exact: true })).toBeVisible()
    await page.evaluate(async () => { await window.__releaseOfflineVerification(); window.__restoreOfflineVerification() })
    await page.getByLabel("Find a background").fill(premium[1].label)
    await expect(page.getByRole("button", { name: `${premium[1].label} · Owned`, exact: true })).toBeEnabled()
    // Native browser handoff leaves this document alive. A 204 navigation models
    // that while initial saved-receipt verification is intentionally delayed.
    await page.addInitScript(() => {
      if (!sessionStorage.getItem("delay-saved-offline-verification")) return
      sessionStorage.removeItem("delay-saved-offline-verification")
      const verify = crypto.subtle.verify.bind(crypto.subtle)
      let first = true
      crypto.subtle.verify = (...args) => {
        const result = verify(...args)
        if (!first) return result
        first = false
        return new Promise(resolve => { window.__releaseSavedVerification = () => result.then(resolve) })
      }
    })
    await page.evaluate(() => sessionStorage.setItem("delay-saved-offline-verification", "1"))
    await page.reload()
    await expect.poll(() => page.evaluate(() => Boolean(window.__releaseSavedVerification))).toBe(true)
    await page.route("https://www.atmoshaper.com/account/offline-access?**", route => route.fulfill({ status: 204 }))
    const handoff = page.waitForRequest(url => url.url().startsWith("https://www.atmoshaper.com/account/offline-access?"))
    await page.getByRole("button", { name: "Verify or refresh account access", exact: true }).click()
    await handoff
    await page.evaluate(async () => { await window.__releaseSavedVerification() })
    await page.getByLabel("Find a background").fill(premium[1].label)
    await expect(page.getByRole("button", { name: `${premium[1].label} · Owned`, exact: true })).toBeEnabled()
    await page.unroute("https://www.atmoshaper.com/account/offline-access?**")
    // Delay the post-commit verification, forget the account, then release the
    // old completion. It must not resurrect removed access in memory or on disk.
    const delayed = await requestReceipt({ premiumUntil: null, owned: [premium[0].id] })
    await expect(page.getByRole("button", { name: "Forget account access", exact: true })).toBeVisible()
    await page.evaluate(() => {
      let count = 0
      const verify = crypto.subtle.verify.bind(crypto.subtle)
      crypto.subtle.verify = (...args) => {
        const result = verify(...args)
        if (++count !== 2) return result
        return new Promise(resolve => { window.__releaseOfflineVerification = () => result.then(resolve) })
      }
    })
    await page.evaluate(receipt => window.dispatchEvent(new CustomEvent("atmoshaper:offline-access", { detail: receipt })), delayed)
    await expect.poll(() => page.evaluate(() => Boolean(window.__releaseOfflineVerification))).toBe(true)
    await page.getByRole("button", { name: "Forget account access", exact: true }).click()
    await expect(page.getByText("Account access removed from this app. Downloads and free tools are unchanged.", { exact: true })).toBeVisible()
    await page.evaluate(async () => { await window.__releaseOfflineVerification(); await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))) })
    await expect(page.getByRole("button", { name: "Forget account access", exact: true })).toHaveCount(0)
    await expect(page.locator('[data-offline-background="massage-lab-moving-gradient"]')).toBeVisible()
    await page.reload()
    await expect(page.getByRole("button", { name: "Forget account access", exact: true })).toHaveCount(0)
    assert.deepEqual(foreign, [])
    assert.deepEqual(errors, [])
    console.log(`Loaded all ${enabled.length} enabled renderers offline with signed synthetic access.`)
  } catch (error) { console.error(JSON.stringify({ errors, foreign, body: await page.locator("body").innerText() })); throw error }
  finally { await context.close(); await browser.close() }
})
