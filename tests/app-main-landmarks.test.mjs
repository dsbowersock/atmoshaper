import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { after, before, describe, it } from "node:test"
import { renderLandmarkDocument, findCompetingRouteMainLandmarks } from "./fixtures/app-main-landmark-harness.mjs"

const require = createRequire(import.meta.url)

describe("Application main-landmark ownership", { concurrency: false }, () => {
  let browser
  before(async () => {
    const { chromium } = require("playwright")
    assert.ok(fs.existsSync(chromium.executablePath()), "Use cached Chromium; this suite never downloads a browser")
    browser = await chromium.launch({ headless: true })
  })
  after(async () => { await browser?.close() })

  for (const kind of ["ordinary", "chimer", "preview", "account-link"]) {
    it(`exposes one top-level main landmark for ${kind} content`, async () => {
      const context = await browser.newContext({ serviceWorkers: "block" })
      const requests = []
      await context.route("**/*", (route) => { requests.push(route.request().url()); return route.abort() })
      try {
        const page = await context.newPage()
        await page.setContent(await renderLandmarkDocument(kind))
        assert.equal(await page.getByRole("main").count(), 1)
        assert.equal(await page.locator("main main,[role=main] main,main [role=main]").count(), 0)
        assert.deepEqual(requests, [])
      } finally { await context.close() }
    })
  }

  it("keeps route wrappers inside the shared shell landmark", () => {
    assert.deepEqual(findCompetingRouteMainLandmarks(), [])
  })

  it("preserves a main landmark for the standalone global error document", () => {
    const source = fs.readFileSync(path.resolve(import.meta.dirname, "../app/global-error.tsx"), "utf8")
    assert.match(source, /<html[\s>]/)
    assert.match(source, /<main[\s>]/)
  })
})
