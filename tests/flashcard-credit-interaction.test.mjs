import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { after, before, describe, it } from "node:test"

const require = createRequire(import.meta.url), root = path.resolve(import.meta.dirname, "..")
const origin = "http://127.0.0.1:43931", unexpected = []
let browser, bundle

/** Bundle the actual review surface in memory; only Next navigation becomes an inert anchor. */
async function prepareFixture() {
  const { webpack } = require("next/dist/compiled/webpack/webpack")
  const link = `data:text/javascript;base64,${Buffer.from('import {createElement} from "react";export default function Link(props){return createElement("a",props)}').toString("base64")}`
  const compiler = webpack({
    mode: "development", target: "web", devtool: false, cache: false,
    entry: path.join(root, "tests/fixtures/flashcard-credit-interaction-harness.tsx"),
    output: { path: path.join(root, "test-results/flashcard-credit-fixture"), filename: "fixture.js" },
    resolve: { alias: { "@": root }, modules: [path.join(root, "node_modules"), "node_modules"], extensions: [".tsx", ".ts", ".js", ".mjs"] },
    module: { rules: [{ test: /\.tsx?$/, use: path.join(root, "tests/helpers/secondary-display-browser-loader.cjs") }] },
    plugins: [new webpack.NormalModuleReplacementPlugin(/^next\/link$/, resource => { resource.request = link }),
      { apply(owner) { owner.hooks.shouldEmit.tap("InMemoryCreditFixture", () => false) } }],
  })
  return new Promise((resolve, reject) => compiler.run((error, stats) => {
    let failure = error, source
    try {
      if (!failure && stats.hasErrors()) failure = new Error(stats.toString({ all: false, errors: true }))
      if (!failure) source = Buffer.from(stats.compilation.getAsset("fixture.js").source.source())
    } catch (caught) { failure = caught }
    compiler.close(closeError => failure || closeError ? reject(failure || closeError) : resolve(source))
  }))
}

async function fixture() {
  const context = await browser.newContext({ serviceWorkers: "block" })
  await context.route("**/*", route => {
    const url = new URL(route.request().url())
    const headers = { "Content-Security-Policy": "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'none'" }
    if (url.origin === origin && route.request().method() === "GET") {
      if (url.pathname === "/fixture") return route.fulfill({ contentType: "text/html", headers, body: "<!doctype html><style>article[inert]{display:none}</style><div id='root'></div><script src='/fixture.js'></script>" })
      if (url.pathname === "/fixture.js") return route.fulfill({ contentType: "text/javascript", headers, body: bundle })
    }
    unexpected.push(route.request().method() + " " + url.origin + url.pathname)
    return route.abort("blockedbyclient")
  })
  const page = await context.newPage()
  await page.goto(origin + "/fixture")
  await page.getByTestId("review").getByRole("button").waitFor()
  return { context, page, review: page.getByTestId("review") }
}

describe("Actual flashcard credit disclosure interaction", { concurrency: false, timeout: 120_000 }, () => {
  before(async () => {
    bundle = await prepareFixture()
    const { chromium } = require("@playwright/test")
    assert.ok(fs.existsSync(chromium.executablePath()), "Use cached Chromium without downloads")
    browser = await chromium.launch({ executablePath: chromium.executablePath(), headless: true, args: ["--disable-background-networking", "--disable-component-update", "--disable-sync", "--proxy-server=http://127.0.0.1:9", "--proxy-bypass-list=<-loopback>"] })
  })
  after(async () => { await browser?.close(); assert.deepEqual(unexpected, [], "No external or provider requests") })
  it("opens the native credit disclosure without flipping", async () => {
    const { context, review } = await fixture()
    try { await review.locator("summary").click(); assert.equal(await review.getByLabel("Flip count").textContent(), "0"); assert.equal(await review.locator("details").getAttribute("open"), "") }
    finally { await context.close() }
  })
  it("keeps expanded credit text clickable without hiding its face", async () => {
    const { context, review } = await fixture()
    try { await review.locator("summary").click(); await review.getByText("Invented full credit text.").click(); assert.equal(await review.getByLabel("Flip count").textContent(), "0"); assert.equal(await review.locator("details").getAttribute("open"), "") }
    finally { await context.close() }
  })
  it("ignores an Enter key bubbling from expanded credit content", async () => {
    const { context, review } = await fixture()
    try {
      await review.locator("summary").click()
      const credit = review.getByText("Invented full credit text.")
      await credit.evaluate(node => { node.tabIndex = -1; node.focus() })
      await credit.press("Enter")
      assert.equal(await review.getByLabel("Flip count").textContent(), "0")
    } finally { await context.close() }
  })
  it("preserves plain card clicks and Enter/Space keyboard flips", async () => {
    const { context, review } = await fixture()
    try {
      await review.getByRole("heading", { name: "Invented muscle" }).click()
      await review.getByRole("button").press("Enter")
      await review.getByRole("button").press("Space")
      assert.equal(await review.getByLabel("Flip count").textContent(), "3")
    } finally { await context.close() }
  })
  it("does not add flipping to typed mode", async () => {
    const { context, page } = await fixture(), typed = page.getByTestId("typed")
    try { const heading = typed.getByRole("heading", { name: "Invented muscle" }); await heading.click(); await heading.press("Enter"); assert.equal(await typed.getByLabel("Flip count").textContent(), "0") }
    finally { await context.close() }
  })
})
