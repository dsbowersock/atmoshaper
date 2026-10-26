import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { after, before, describe, it } from "node:test"
import { expect } from "@playwright/test"
import { getChimerClockFontMetrics } from "../lib/chimer-clock-font-metrics.js"

const require = createRequire(import.meta.url)
const root = path.resolve(import.meta.dirname, "..")
const origin = "http://127.0.0.1:43929"
let browser, assets
const unexpected = []

/** Bundle the real shell/CSS; commerce and the color-portal constant stay inert. */
async function prepareFixture() {
  const { webpack } = require("next/dist/compiled/webpack/webpack")
  const { getCssModuleLocalIdent } = require("next/dist/build/webpack/config/blocks/css/loaders/getCssModuleLocalIdent")
  const colorSource = fs.readFileSync(path.join(root, "components/chimer-controls/GlobalColorPicker.tsx"), "utf8")
  const selector = colorSource.match(/export const CHIMER_CONTROL_PORTAL_SELECTOR\s*=\s*("[^"]*"|'[^']*')/)?.[1]
  assert.ok(selector, "Use the real portal selector without importing unrelated color/account UI")
  const dataModule = (text) => `data:text/javascript;base64,${Buffer.from(text).toString("base64")}`
  const compiler = webpack({
    mode: "development", target: "web", devtool: false, cache: false,
    entry: path.join(root, "tests/fixtures/secondary-display-layout-harness.tsx"),
    output: { path: path.join(root, "test-results/secondary-display-fixture"), filename: "secondary-display-layout-harness.js", publicPath: "" },
    resolve: { alias: { "@": root }, modules: [path.join(root, "node_modules"), "node_modules"], extensions: [".tsx", ".ts", ".js", ".mjs"] },
    module: { rules: [
      { test: /\.tsx?$/, use: path.join(root, "tests/helpers/secondary-display-browser-loader.cjs") },
      { test: /\.css$/, use: [require.resolve("next/dist/build/webpack/loaders/next-style-loader"), { loader: require.resolve("next/dist/build/webpack/loaders/css-loader/src"), options: { esModule: false, postcss: async () => ({ postcss: require("postcss") }), modules: { auto: /\.module\.css$/, mode: "pure", exportLocalsConvention: "asIs", getLocalIdent: getCssModuleLocalIdent } } }] },
      { test: /\.woff2$/, type: "asset/inline" },
    ] },
    optimization: { minimize: false },
    plugins: [
      // Next's cached CSS loaders expect a trace owner even in a server-free fixture.
      { apply(owner) { owner.hooks.compilation.tap("LocalStylesheetTrace", (compilation) => {
        const span = { traceChild: () => span, traceFn: (fn) => fn(), traceAsyncFn: (fn) => fn() }
        webpack.NormalModule.getCompilationHooks(compilation).loader.tap("LocalStylesheetTrace", (context) => { context.currentTraceSpan = span })
      }) } },
      new webpack.NormalModuleReplacementPlugin(/^@\/components\/backgrounds\/BackgroundCommerceCart$/, (resource) => { resource.request = dataModule("export const BackgroundCommerceCart=()=>null") }),
      new webpack.NormalModuleReplacementPlugin(/^@\/components\/chimer-controls\/GlobalColorPicker$/, (resource) => { resource.request = dataModule(`export const CHIMER_CONTROL_PORTAL_SELECTOR=${selector}`) }),
      { apply(owner) { owner.hooks.shouldEmit.tap("KeepSecondaryFixtureInMemory", () => false) } },
    ],
  })
  return new Promise((resolve, reject) => {
    compiler.run((error, stats) => {
      let files, failure = error
      try {
        if (!failure && stats.hasErrors()) failure = new Error(stats.toString({ all: false, errors: true }))
        if (!failure) files = new Map(stats.compilation.getAssets().map(({ name, source }) => ["/" + name, Buffer.from(source.source())]))
      } catch (readError) { failure = readError }
      compiler.close((closeError) => { if (failure || closeError) reject(failure || closeError); else resolve(files) })
    })
  })
}

async function pageFor(viewport, visualViewport) {
  const context = await browser.newContext({ viewport, serviceWorkers: "block" })
  if (visualViewport) await context.addInitScript((frame) => {
    const mock = Object.assign(new EventTarget(), frame)
    Object.defineProperty(window, "visualViewport", { configurable: true, value: mock })
    window.secondaryViewport = mock
  }, visualViewport)
  await context.route("**/*", (route) => {
    const request = route.request(), url = new URL(request.url())
    const headers = { "Content-Security-Policy": "default-src 'none'; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self' data:; connect-src 'none'" }
    if (url.origin === origin && request.method() === "GET") {
      if (url.pathname === "/fixture") return route.fulfill({ status: 200, contentType: "text/html", headers, body: "<!doctype html><div id='root'></div><script src='/secondary-display-layout-harness.js'></script>" })
      const body = assets.get(url.pathname)
      if (body) return route.fulfill({ status: 200, contentType: url.pathname.endsWith(".css") ? "text/css" : "text/javascript", headers, body })
    }
    unexpected.push(request.method() + " " + url.origin + url.pathname)
    return route.abort("blockedbyclient")
  })
  const page = await context.newPage()
  await page.goto(origin + "/fixture")
  await page.getByRole("group", { name: "Immersive display controls" }).waitFor()
  await page.evaluate(async () => { await document.fonts.load('32px "Digital"', "12:34:56"); await document.fonts.ready })
  return { page, context }
}

/** Reads current geometry without accepting a previous observer measurement as settlement. */
async function readGeometry(page) {
  return page.evaluate(() => {
    const secondary = document.querySelector('[data-immersive-secondary-display="true"]')
    if (!secondary) return null
    const box = secondary.getBoundingClientRect()
    const controls = [document.querySelector('[aria-label="Immersive display controls"]'), ...document.querySelectorAll('button[data-chimer-control="true"]')]
    const overlap = controls.some((node) => { const r = node.getBoundingClientRect(); return r.right > box.left && r.left < box.right && r.bottom > box.top && r.top < box.bottom })
    return { top: box.top, bottom: box.bottom, left: box.left, right: box.right, overlap, width: box.width, scrollWidth: secondary.scrollWidth, clientWidth: secondary.clientWidth, faceLoaded: document.fonts.check('32px "Digital"'), inlineTop: secondary.style.getPropertyValue("--chimer-secondary-top"), kind: secondary.dataset.testid, fontFamily: getComputedStyle(secondary).fontFamily, chrome: document.querySelector("[data-immersive-stage]").dataset.fixtureChrome, controls: controls.map((node) => { const r = node.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom } }) }
  })
}

/** Retries the caller's post-change invariant as well as observer acquisition and clearance. */
async function geometry(page, isExpected = () => true) {
  let current
  await expect.poll(async () => {
    current = await readGeometry(page)
    return Boolean(current?.inlineTop) && !current.overlap && isExpected(current)
  }, { timeout: 5_000, message: "Expected the changed accessory layout to be acquired and clear." }).toBe(true)
  return current
}

describe("Chimer accessory display and actual immersive toolbar", { concurrency: false, timeout: 120_000 }, () => {
  before(async () => {
    assets = await prepareFixture()
    const { chromium } = require("@playwright/test")
    assert.ok(fs.existsSync(chromium.executablePath()), "Use cached Chromium without downloads")
    browser = await chromium.launch({ executablePath: chromium.executablePath(), headless: true, args: ["--disable-background-networking", "--disable-component-update", "--disable-sync", "--proxy-server=http://127.0.0.1:9", "--proxy-bypass-list=<-loopback>"] })
  })
  after(async () => { await browser?.close(); assert.deepEqual(unexpected, [], "No external, account, game or provider request is allowed") })

  for (const viewport of [{ width: 320, height: 740 }, { width: 390, height: 844 }, { width: 640, height: 360 }, { width: 844, height: 390 }, { width: 1440, height: 1000 }]) {
    it(`keeps the actual clock and timer accessory clear at ${viewport.width}x${viewport.height}`, async () => {
      const { page, context } = await pageFor(viewport)
      try {
        const clock = await geometry(page)
        if (process.env.SECONDARY_EVIDENCE) await page.screenshot({ path: path.join(process.env.SECONDARY_EVIDENCE, `${viewport.width}x${viewport.height}-clock.png`) })
        assert.equal(clock.faceLoaded, true)
        assert.equal(clock.overlap, false, `The auxiliary clock must not sit underneath interactive controls: ${JSON.stringify(clock)}`)
        assert.ok(clock.left >= 0 && clock.right <= viewport.width + 0.5)
        if (viewport.width === 1440) assert.ok(Math.abs(clock.top - 19.2) < 1, "Preserve the existing wide-screen position")
        await page.getByTestId("clock").click()
        const timer = await geometry(page, (layout) => layout.kind === "timer")
        assert.equal(timer.overlap, false, "Swapping to the auxiliary timer must retain clearance")
        assert.ok(timer.scrollWidth <= timer.clientWidth + 1)
      } finally { await context.close() }
    })
  }
  it("compares the ordinary timer's complete control inset with the absolute secondary boundary", async () => {
    const { page, context } = await pageFor({ width: 320, height: 740 })
    try {
      await geometry(page, (layout) => layout.kind === "clock")
      // Resolve the real CSS inset through layout, including calc/safe-area
      // values. A persistent inert probe avoids mutating the DOM on each poll.
      await page.evaluate(() => {
        const probe = document.createElement("i")
        probe.dataset.controlInsetProbe = "true"
        probe.style.cssText = "position:fixed;top:0;left:0;width:0;height:var(--chimer-top-control-space);visibility:hidden;pointer-events:none"
        document.querySelector("[data-immersive-stage]").appendChild(probe)
      })
      for (const reservation of [10, 200]) {
        await page.evaluate((value) => document.querySelector("[data-immersive-stage]").style.setProperty("--immersive-reserved-top", `${value}px`), reservation)
        let actual
        await expect.poll(async () => {
          actual = await page.evaluate(() => {
            const stage = document.querySelector("[data-immersive-stage]")
            const style = getComputedStyle(stage)
            const box = document.querySelector('[data-immersive-primary-display="true"]').getBoundingClientRect()
            return { top: box.top, bottom: box.bottom, mode: stage.dataset.fixturePrimaryMode,
              controls: document.querySelector("[data-control-inset-probe]").getBoundingClientRect().height,
              reserved: parseFloat(style.getPropertyValue("--immersive-reserved-top")),
              secondary: parseFloat(style.getPropertyValue("--chimer-secondary-safe-top")) || 0 }
          })
          if (actual.mode !== "timer" || actual.reserved !== reservation || actual.secondary <= 0) return Infinity
          return Math.abs(actual.top - Math.max(actual.controls + actual.reserved, actual.secondary))
        }, { timeout: 5_000, message: "Ordinary timer must compare two complete viewport boundaries." }).toBeLessThan(1)
        assert.equal(actual.secondary > actual.controls + actual.reserved, reservation === 10, JSON.stringify(actual))
        assert.ok(Math.abs(actual.bottom - (740 - 112)) < 1, "Preserve the ordinary timer's bottom control inset")
      }
      await page.evaluate(() => window.secondaryFixture.setShowSecondary(false))
      await expect.poll(() => page.evaluate(() => ({
        safeTop: document.querySelector("[data-immersive-stage]").style.getPropertyValue("--chimer-secondary-safe-top"),
        top: document.querySelector('[data-immersive-primary-display="true"]').getBoundingClientRect().top,
      }))).toEqual({ safeTop: "", top: 280 })
    } finally { await context.close() }
  })
  for (const clockPrimary of [true, false]) {
    it(`uses the greater viewport boundary for ${clockPrimary ? "clock primary" : "compact timer"}`, async () => {
      const { page, context } = await pageFor({ width: 320, height: 740 })
      try {
        await page.evaluate((isClock) => {
          window.secondaryFixture.setClockPrimary(isClock)
          window.secondaryFixture.setCompactTimer(!isClock)
          document.querySelector("[data-immersive-stage]").style.setProperty("--immersive-reserved-top", "100px")
        }, clockPrimary)
        await geometry(page, (layout) => layout.kind === (clockPrimary ? "timer" : "clock"))
        let actual
        await expect.poll(async () => {
          actual = await page.evaluate(() => {
          const stage = document.querySelector("[data-immersive-stage]")
          const style = getComputedStyle(stage)
          const primary = document.querySelector('[data-immersive-primary-display="true"]')
          const box = primary.getBoundingClientRect()
          return { top: box.top, height: box.height, bottom: box.bottom, mode: stage.dataset.fixturePrimaryMode,
            reserved: parseFloat(style.getPropertyValue("--immersive-reserved-top")),
            secondary: parseFloat(style.getPropertyValue("--chimer-secondary-safe-top")) }
          })
          return actual.mode === (clockPrimary ? "clock" : "compact-timer")
            && actual.reserved > 0 && actual.secondary > 0
            && Math.abs(actual.top - Math.max(actual.reserved, actual.secondary)) < 1
            && Math.abs(actual.bottom - 740) < 1 && actual.height > 0
        }, { timeout: 5_000, message: "Expected the changed primary mode and greater viewport boundary." }).toBe(true)
        assert.ok(actual.reserved > 0 && actual.secondary > 0, JSON.stringify(actual))
        assert.ok(Math.abs(actual.top - Math.max(actual.reserved, actual.secondary)) < 1, JSON.stringify(actual))
        assert.ok(Math.abs(actual.bottom - 740) < 1, "Keep the existing bottom boundary")
        assert.ok(actual.height > 0)
      } finally { await context.close() }
    })
  }
  it("remeasures position-only control-root changes without a resize event", async () => {
    const { page, context } = await pageFor({ width: 1440, height: 1000 })
    try {
      const initial = await geometry(page)
      assert.equal(initial.overlap, false)
      const before = await page.getByRole("group", { name: "Immersive display controls" }).boundingBox()
      // The real shell updates inherited viewport/inset CSS on its portal root.
      // Moving those controls need not resize them or emit a viewport event.
      await page.evaluate(() => {
        const toolbar = document.querySelector('[aria-label="Immersive display controls"]')
        const shell = toolbar.closest("[data-immersive-shell]")
        shell.style.setProperty("--immersive-toolbar-leading-space", `${(innerWidth - toolbar.getBoundingClientRect().width) / 2 + 4}px`)
      })
      const moved = await geometry(page, (layout) => (
        Math.abs(layout.controls[0].left - before.x) > 1 && layout.top > initial.top + 1
      ))
      const after = await page.getByRole("group", { name: "Immersive display controls" }).boundingBox()
      assert.ok(Math.abs(after.width - before.width) < 1 && Math.abs(after.height - before.height) < 1, "Exercise a position change, not a ResizeObserver notification")
      assert.equal(moved.overlap, false, `Position-only chrome change must retain accessory clearance: ${JSON.stringify(moved)}`)
    } finally { await context.close() }
  })
  it("fits a panned and zoomed visual viewport as its dimensions change", async () => {
    const { page, context } = await pageFor({ width: 390, height: 844 }, { width: 210, height: 650, offsetLeft: 60, offsetTop: 30 })
    try {
      let layout = await geometry(page, (current) => current.left >= 75 && current.right <= 255)
      assert.equal(layout.overlap, false)
      assert.ok(layout.left >= 75 && layout.right <= 255)
      assert.ok(layout.scrollWidth <= layout.clientWidth + 1)
      await page.evaluate(() => { Object.assign(window.secondaryViewport, { width: 180, offsetLeft: 90 }); window.secondaryViewport.dispatchEvent(new Event("resize")) })
      layout = await geometry(page, (current) => current.left >= 105 && current.right <= 255)
      assert.equal(layout.overlap, false)
      assert.ok(layout.left >= 105 && layout.right <= 255)
      assert.ok(layout.scrollWidth <= layout.clientWidth + 1)
    } finally { await context.close() }
  })
  it("remeasures a fallback font and releases the prior secondary owner when hidden", async () => {
    const { page, context } = await pageFor({ width: 390, height: 844 })
    try {
      // Assert the selected metric family as well as its geometry; changing
      // CSS font-family alone can leave the Digital cell widths in place.
      const metricNames = Object.keys(getChimerClockFontMetrics("digital"))
      const readMetrics = () => page.locator("[data-immersive-stage]").evaluate((stage, names) => (
        Object.fromEntries(names.map((name) => [name, stage.style.getPropertyValue(name).trim()]))
      ), metricNames)
      await expect.poll(readMetrics).toEqual(getChimerClockFontMetrics("digital"))
      await page.evaluate(() => window.secondaryFixture.setFont("Arial, sans-serif"))
      await expect.poll(readMetrics).toEqual(getChimerClockFontMetrics("sans"))
      assert.equal((await geometry(page, (layout) => layout.fontFamily.includes("Arial"))).overlap, false)
      await page.evaluate(() => { window.savedSecondary = document.querySelector('[data-immersive-secondary-display="true"]'); window.secondaryFixture.setShowSecondary(false) })
      await expect.poll(() => page.evaluate(() => ({ owner: window.savedSecondary.style.getPropertyValue("--chimer-secondary-top"), stage: document.querySelector("[data-immersive-stage]").style.getPropertyValue("--chimer-secondary-safe-top"), acquired: Boolean(document.querySelector('[data-immersive-secondary-display="true"]')) }))).toEqual({ owner: "", stage: "", acquired: false })
      await page.evaluate(() => window.secondaryFixture.setShowSecondary(true))
      assert.equal((await geometry(page, (layout) => layout.kind === "clock" && layout.fontFamily.includes("Arial"))).overlap, false)
    } finally { await context.close() }
  })
  it("responds to resize, preserves placement through chrome fade, and releases reservations on unmount", async () => {
    const { page, context } = await pageFor({ width: 1440, height: 1000 })
    try {
      await page.setViewportSize({ width: 390, height: 844 })
      const shown = await geometry(page, (layout) => layout.left >= 0 && layout.right <= 390.5)
      assert.equal(shown.overlap, false)
      for (const visibility of ["faded", "hidden", "visible"]) {
        await page.evaluate((value) => window.secondaryFixture.setChrome(value), visibility)
        assert.ok(Math.abs((await geometry(page, (layout) => layout.chrome === visibility && Math.abs(layout.top - shown.top) < 1)).top - shown.top) < 1)
      }
      await page.evaluate(() => {
        window.savedStage = document.querySelector("[data-immersive-stage]")
        window.savedSecondary = document.querySelector('[data-immersive-secondary-display="true"]')
        window.unmountSecondaryFixture()
      })
      await expect.poll(() => page.evaluate(() => ({ stage: window.savedStage.style.getPropertyValue("--chimer-secondary-safe-top"), secondary: window.savedSecondary.style.getPropertyValue("--chimer-secondary-top") }))).toEqual({ stage: "", secondary: "" })
    } finally { await context.close() }
  })
})
