import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import { chromium, expect } from "@playwright/test"

// Use only the provider-free loopback development preview. Each context starts
// with fictional settings and a fixed local clock; no real browser data changes.
const origin = "http://127.0.0.1:3025"
const directory = "output/clock-leading-period"
await mkdir(directory, { recursive: true })
const browser = await chromium.launch()
const receipts = []
try {
  for (const [name, width, height, hour, seconds, format] of [
    ["phone-1am", 390, 844, 1, false, "12h"],
    ["landscape-10pm", 844, 390, 22, false, "12h"],
    ["desktop-noon", 1440, 900, 12, false, "12h"],
    ["desktop-seconds", 1440, 900, 10, true, "12h"],
    ["desktop-24h", 1440, 900, 23, true, "24h"],
  ]) {
    if (process.env.CLOCK_CASE && process.env.CLOCK_CASE !== name) continue
    const context = await browser.newContext({ viewport: { width, height }, locale: "en-US", timezoneId: "America/New_York", reducedMotion: "reduce", serviceWorkers: "block" })
    const page = await context.newPage(), errors = [], unexpected = []
    page.on("pageerror", (error) => errors.push(error.message))
    await context.route("**/*", (route) => {
      const request = route.request()
      if (new URL(request.url()).origin !== origin || !["GET", "HEAD"].includes(request.method())) {
        unexpected.push(`${request.method()} ${request.url()}`); return route.abort()
      }
      return route.continue()
    })
    await page.addInitScript(({ hour, seconds, format }) => {
      localStorage.setItem("massagelab-chimer-settings", JSON.stringify({
        clockFontFamily: "digital", timeFormat: format, showCurrentTimeSeconds: seconds,
        clockShadowEnabled: false, clockGlowEnabled: false,
      }))
      const OriginalDate = Date, instant = new OriginalDate(2026, 10, 22, hour, 51, 42).valueOf()
      window.Date = new Proxy(OriginalDate, { construct(target, args, newTarget) { return Reflect.construct(target, args.length ? args : [instant], newTarget) } })
    }, { hour, seconds, format })
    await page.goto(`${origin}/clock`, { waitUntil: "domcontentloaded", timeout: 120000 })
    const primary = page.getByTestId("running-current-time")
    await expect(primary).toHaveAttribute("data-immersive-primary-display", "true", { timeout: 60000 })
    await expect(page.locator("body")).toHaveClass(/chimer-running/)
    await expect(page.locator(".ml-app-topbar")).toBeHidden()
    await page.evaluate(() => document.fonts.ready)
    await page.mouse.move(30, 30)
    const increase = page.getByRole("button", { name: "Increase timer size", exact: true })
    for (let step = 0; step < 24 && await increase.isEnabled(); step++) {
      const before = await primary.evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize))
      try { await increase.click({ timeout: 2000 }) }
      catch (error) {
        // Font/fit completion can disable the last increment after the earlier
        // read. That is the requested maximum; any still-enabled failure fails.
        if (!await increase.isEnabled()) break
        await page.screenshot({ path: `${directory}/failed-${name}.png` })
        throw error
      }
      // The fitter commits on animation frames. Wait for that actual change
      // before deciding whether the next enlargement is still available.
      await expect.poll(async () => !await increase.isEnabled() || Math.abs(await primary.evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize)) - before) > 0.1).toBe(true)
    }
    await expect(increase).toBeDisabled()
    const row = primary.locator("[data-display-content='true'] [data-clock-label-placement]")
    await expect(row).toHaveAttribute("data-clock-label-placement", format === "12h" ? "leading" : "trailing")
    await expect(primary).toHaveCSS("font-weight", "700")
    await expect(primary).toHaveCSS("font-family", /Digital Clock/)
    await expect.poll(() => row.evaluate((node) => {
      const rect = node.getBoundingClientRect(), stage = node.closest("[data-immersive-primary-display]").getBoundingClientRect()
      return rect.left >= stage.left - 1 && rect.right <= stage.right + 1 && rect.top >= stage.top - 1 && rect.bottom <= stage.bottom + 1
    })).toBe(true)
    if (format === "12h") {
      await expect.poll(() => page.evaluate(() => [...document.fonts].some((face) => face.family === "Digital Clock Labels" && face.status === "loaded"))).toBe(true)
    }
    const geometry = await row.evaluate((node) => {
      const rect = node.getBoundingClientRect(), stage = node.closest("[data-immersive-primary-display]").getBoundingClientRect()
      const digits = [...node.querySelectorAll("span")].filter((element) => /^\d$/.test(element.textContent || ""))
      return { width: rect.width, availableWidth: stage.width, height: rect.height, availableHeight: stage.height,
        left: rect.left, right: rect.right, lastDigitRight: digits.at(-1).getBoundingClientRect().right }
    })
    await page.screenshot({ path: `${directory}/actual-${name}.png` })
    // Preserve the fitter's existing safety limits. The requested change frees
    // the row's trailing edge for its last digit; it does not remove those limits.
    assert.ok(Math.abs(geometry.lastDigitRight - geometry.right) <= 1, `The last digit must reach the row edge without AM/PM taking trailing width: ${JSON.stringify(geometry)}`)
    assert.deepEqual(errors, []); assert.deepEqual(unexpected, [])
    receipts.push({ name, width, height, format, seconds, geometry, passed: true })
    console.log(`Passed ${name}`)
    await context.close()
  }
  await writeFile(`${directory}/actual-acceptance.json`, JSON.stringify(receipts, null, 2) + "\n")
} finally { await browser.close() }
