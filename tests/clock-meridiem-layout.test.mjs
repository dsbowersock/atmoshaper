import assert from "node:assert/strict"
import { readFile, mkdir } from "node:fs/promises"
import { createServer } from "node:http"
import path from "node:path"
import { fileURLToPath } from "node:url"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { chromium } from "@playwright/test"
import test from "node:test"
import { createCompiledModuleLoader } from "./helpers/compiled-module.mjs"
import { getChimerClockFontMetrics } from "../lib/chimer-clock-font-metrics.js"

const root = fileURLToPath(new URL("..", import.meta.url))
const css = await readFile(path.join(root, "app/chimer/running-timer.module.css"), "utf8")
const faces = (await readFile(path.join(root, "app/globals.css"), "utf8")).match(/@font-face\s*\{[^}]*\}/g).join("\n")
const styles = Object.fromEntries([...css.matchAll(/\.([a-zA-Z][\w-]*)/g)].map(([, name]) => [name, name]))
const { CurrentTimeDisplay } = createCompiledModuleLoader(import.meta.url)(
  await readFile(path.join(root, "app/chimer/current-time-display.tsx"), "utf8"), "current-time-display.tsx", { "./running-timer.module.css": styles },
)

/** Static render of the actual component and stylesheet, using original owned
 * fonts. The application fitter is verified separately in its real clock route. */
function markup(time, meridiem, fontFamily = "digital", isPrimary = true) {
  return renderToStaticMarkup(React.createElement(CurrentTimeDisplay, { currentTime: { time, meridiem }, fontFamily, isPrimary }))
}

test("digital AM/PM uses the spare leading cell without shifting time or overlapping its ink", { timeout: 120000 }, async () => {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, "http://127.0.0.1")
    if (url.pathname === "/clock.css") { res.setHeader("Content-Type", "text/css"); return res.end(`${faces}\n${css}`) }
    if (["/public/fonts/dseg/DSEG7Modern-Bold.woff2", "/public/fonts/dseg/DSEG14Modern-Bold.woff2"].includes(url.pathname)) { res.setHeader("Content-Type", "font/woff2"); return res.end(await readFile(path.join(root, url.pathname))) }
    const time = url.searchParams.get("time") || "10:51"
    const period = url.searchParams.get("period") || ""
    const font = url.searchParams.get("font") || "digital"
    const variables = Object.entries(getChimerClockFontMetrics(font)).map(([key, value]) => `${key}:${value}`).join(";")
    const family = font === "digital" ? '"Digital Clock",monospace' : font === "serif" ? "Georgia,serif" : font === "sans" ? "Arial,sans-serif" : "monospace"
    res.setHeader("Content-Type", "text/html; charset=utf-8")
    res.end(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><link rel="stylesheet" href="/clock.css"><style>body{margin:0;background:#171717;color:white;height:100dvh;display:grid;place-items:center}#clock{font-family:${family};font-size:${time.split(":").length > 2 ? 17 : 25}vw;font-weight:700;line-height:1;--chimer-display-font-family:${family};${variables}}</style><main id="clock">${markup(time, period, font)}</main>`)
  })
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  const origin = `http://127.0.0.1:${server.address().port}`
  const browser = await chromium.launch()
  const unexpected = [], errors = []
  await mkdir("output/clock-leading-period", { recursive: true })
  try {
    for (const [width, height] of [[390, 844], [844, 390], [1440, 900]]) {
      const context = await browser.newContext({ viewport: { width, height }, serviceWorkers: "block" })
      await context.route("**/*", (route) => {
        if (new URL(route.request().url()).origin !== origin) { unexpected.push(route.request().url()); return route.abort() }
        return route.continue()
      })
      const page = await context.newPage()
      page.on("pageerror", (error) => errors.push(error.message))
      const widths = []
      for (const hour of ["01", "09", "10", "11", "12"]) {
        for (const period of ["AM", "PM"]) {
          await page.goto(`${origin}/?time=${hour}:51&period=${period}`)
          await page.evaluate(() => document.fonts.ready)
          const result = await page.evaluate(() => {
            const row = document.querySelector(".currentTimeRow")
            const label = document.querySelector(".currentTimeMeridiem")
            const digit = document.querySelector(".currentTimeDigit")
            const rect = row.getBoundingClientRect(), labelRect = label.getBoundingClientRect(), digitRect = digit.getBoundingClientRect()
            const style = getComputedStyle(digit), canvas = document.createElement("canvas"), ctx = canvas.getContext("2d")
            ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
            const ink = ctx.measureText("1")
            return { placement: row.dataset.clockLabelPlacement, width: rect.width, left: rect.left, right: rect.right, labelLeft: labelRect.left, labelRight: labelRect.right,
              digitHidden: style.visibility === "hidden", inkLeft: digitRect.left + (digitRect.width - ink.width) / 2 - ink.actualBoundingBoxLeft,
              family: getComputedStyle(label).fontFamily }
          })
          assert.equal(result.placement, "leading")
          assert.ok(result.family.includes("Digital Clock Labels"))
          assert.equal(result.digitHidden, hour.startsWith("0"))
          assert.ok(result.left >= 0 && result.right <= width + 1)
          assert.ok(result.labelLeft >= result.left - 1)
          if (!result.digitHidden) assert.ok(result.labelRight < result.inkLeft, JSON.stringify(result))
          widths.push(result.width)
          if (hour === "10" && period === "AM") await page.screenshot({ path: `output/clock-leading-period/component-${width}.png` })
        }
      }
      assert.ok(Math.max(...widths) - Math.min(...widths) <= 0.5, "Changing hours/period must not shift the other digits")
      await page.goto(`${origin}/?time=10:51`)
      assert.ok(Math.abs(await page.locator(".currentTimeRow").evaluate((node) => node.getBoundingClientRect().width) - widths[0]) < 0.5, "AM/PM must consume no additional row width")
      for (const font of ["mono", "sans", "serif"]) {
        await page.goto(`${origin}/?time=10:51&period=AM&font=${font}`)
        assert.equal(await page.locator(".currentTimeRow").getAttribute("data-clock-label-placement"), "trailing")
      }
      await page.goto(`${origin}/?time=10:51:42&period=PM`)
      assert.equal(await page.locator(".currentTimeRow").getAttribute("data-clock-label-placement"), "leading")
      await page.goto(`${origin}/?time=23:51:42`)
      assert.equal(await page.locator(".currentTimeMeridiem").count(), 0)
      await context.close()
    }
    assert.match(markup("10:51", "localized period"), /data-clock-label-placement="trailing"/)
    assert.match(markup("10:51", "AM", "digital", false), /currentTimeInline/)
    assert.deepEqual(unexpected, []); assert.deepEqual(errors, [])
  } finally { await browser.close(); await new Promise((resolve) => server.close(resolve)) }
})
