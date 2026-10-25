import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { after, before, describe, it } from "node:test"

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

/** Wait for layout/transition settlement and inspect actual visible rectangles, not source strings. */
async function geometry(page) {
  await page.waitForTimeout(250)
  return page.evaluate(() => {
    const secondary = document.querySelector('[data-immersive-secondary-display="true"]')
    const box = secondary.getBoundingClientRect()
    const controls = [document.querySelector('[aria-label="Immersive display controls"]'), ...document.querySelectorAll('button[data-chimer-control="true"]')]
    const overlap = controls.some((node) => { const r = node.getBoundingClientRect(); return r.right > box.left && r.left < box.right && r.bottom > box.top && r.top < box.bottom })
    return { top: box.top, bottom: box.bottom, left: box.left, right: box.right, overlap, width: box.width, scrollWidth: secondary.scrollWidth, clientWidth: secondary.clientWidth, faceLoaded: document.fonts.check('32px "Digital"') }
  })
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
        assert.equal(clock.faceLoaded, true)
        assert.equal(clock.overlap, false, "The auxiliary clock must not sit underneath interactive controls")
        assert.ok(clock.left >= 0 && clock.right <= viewport.width + 0.5)
        if (viewport.width === 1440) assert.ok(Math.abs(clock.top - 19.2) < 1, "Preserve the existing wide-screen position")
        if (process.env.SECONDARY_EVIDENCE) await page.screenshot({ path: path.join(process.env.SECONDARY_EVIDENCE, `${viewport.width}x${viewport.height}-clock.png`) })
        await page.getByTestId("clock").click()
        const timer = await geometry(page)
        assert.equal(timer.overlap, false, "Swapping to the auxiliary timer must retain clearance")
        assert.ok(timer.scrollWidth <= timer.clientWidth + 1)
      } finally { await context.close() }
    })
  }
  it("fits a panned and zoomed visual viewport as its dimensions change", async () => {
    const { page, context } = await pageFor({ width: 390, height: 844 }, { width: 210, height: 650, offsetLeft: 60, offsetTop: 30 })
    try {
      let layout = await geometry(page)
      assert.equal(layout.overlap, false)
      assert.ok(layout.left >= 75 && layout.right <= 255)
      assert.ok(layout.scrollWidth <= layout.clientWidth + 1)
      await page.evaluate(() => { Object.assign(window.secondaryViewport, { width: 180, offsetLeft: 90 }); window.secondaryViewport.dispatchEvent(new Event("resize")) })
      layout = await geometry(page)
      assert.equal(layout.overlap, false)
      assert.ok(layout.left >= 105 && layout.right <= 255)
      assert.ok(layout.scrollWidth <= layout.clientWidth + 1)
    } finally { await context.close() }
  })
  it("remeasures a fallback font and releases the prior secondary owner when hidden", async () => {
    const { page, context } = await pageFor({ width: 390, height: 844 })
    try {
      await page.evaluate(() => window.secondaryFixture.setFont("Arial, sans-serif"))
      assert.equal((await geometry(page)).overlap, false)
      await page.evaluate(() => { window.savedSecondary = document.querySelector('[data-immersive-secondary-display="true"]'); window.secondaryFixture.setShowSecondary(false) })
      await page.waitForTimeout(100)
      assert.deepEqual(await page.evaluate(() => ({ owner: window.savedSecondary.style.getPropertyValue("--chimer-secondary-top"), stage: document.querySelector("[data-immersive-stage]").style.getPropertyValue("--chimer-secondary-safe-top") })), { owner: "", stage: "" })
      await page.evaluate(() => window.secondaryFixture.setShowSecondary(true))
      assert.equal((await geometry(page)).overlap, false)
    } finally { await context.close() }
  })
  it("responds to resize, preserves placement through chrome fade, and releases reservations on unmount", async () => {
    const { page, context } = await pageFor({ width: 1440, height: 1000 })
    try {
      await page.setViewportSize({ width: 390, height: 844 })
      const shown = await geometry(page)
      assert.equal(shown.overlap, false)
      for (const visibility of ["faded", "hidden", "visible"]) {
        await page.evaluate((value) => window.secondaryFixture.setChrome(value), visibility)
        assert.ok(Math.abs((await geometry(page)).top - shown.top) < 1)
      }
      const cleared = await page.evaluate(() => {
        const stage = document.querySelector("[data-immersive-stage]"), secondary = document.querySelector('[data-immersive-secondary-display="true"]')
        window.unmountSecondaryFixture()
        return new Promise((resolve) => setTimeout(() => resolve({ stage: stage.style.getPropertyValue("--chimer-secondary-safe-top"), secondary: secondary.style.getPropertyValue("--chimer-secondary-top") }), 50))
      })
      assert.deepEqual(cleared, { stage: "", secondary: "" })
    } finally { await context.close() }
  })
})
