import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { createRequire } from "node:module"
import { after, before, describe, it } from "node:test"
import { createSoapSessionDateBundle, withSoapSessionDateFixture } from "./fixtures/soap-session-date-harness.mjs"

const require = createRequire(import.meta.url)
const enteredDate = "2026-10-01"

describe("SOAP session date preservation", { concurrency: false, timeout: 120_000 }, () => {
  let context, bundle, profile, ownsProfile
  before(async () => {
    const { chromium } = require("@playwright/test")
    assert.ok(fs.existsSync(chromium.executablePath()), "Use cached Chromium; never download a browser in this suite")
    bundle = await createSoapSessionDateBundle()
    ownsProfile = !process.env.SOAP_DATE_BROWSER_PROFILE
    profile = process.env.SOAP_DATE_BROWSER_PROFILE || fs.mkdtempSync(path.join(os.tmpdir(), "atmoshaper-soap-date-"))
    context = await chromium.launchPersistentContext(profile, { executablePath: chromium.executablePath(), headless: true, serviceWorkers: "block", args: ["--disable-background-networking", "--disable-component-update", "--disable-sync", "--proxy-server=http://127.0.0.1:9", "--proxy-bypass-list=<-loopback>"] })
  })
  after(async () => {
    await context?.close()
    if (ownsProfile && profile) {
      assert.ok(path.resolve(profile).startsWith(path.resolve(os.tmpdir()) + path.sep))
      assert.ok(path.basename(profile).startsWith("atmoshaper-soap-date-"))
      fs.rmSync(profile, { recursive: true, force: true })
    }
  })
  const fixture = (date, run) => withSoapSessionDateFixture(context, bundle, date, run)

  it("defaults a new empty note to the existing current-day policy", () => fixture("", async (page) => {
    const today = await page.evaluate(() => new Date().toISOString().split("T")[0])
    assert.equal(await page.getByLabel("Date of Session", { exact: true }).inputValue(), today)
  }))

  it("preserves an existing draft's session date on initial editor mount", () => fixture(enteredDate, async (page) => {
    assert.equal(await page.getByLabel("Date of Session", { exact: true }).inputValue(), enteredDate)
  }))

  it("preserves an entered session date after leaving and returning to Identify", () => fixture("", async (page) => {
    await page.evaluate(async (value) => { await window.__soapDateFixture.setDate(value) }, enteredDate)
    await page.evaluate(async () => { await window.__soapDateFixture.next() })
    await page.evaluate(async () => { await window.__soapDateFixture.previous() })
    assert.equal(await page.getByLabel("Date of Session", { exact: true }).inputValue(), enteredDate)
  }))

  it("preserves the entered date when local therapist defaults update", () => fixture("", async (page) => {
    await page.evaluate(async (value) => { await window.__soapDateFixture.setDate(value) }, enteredDate)
    await page.evaluate(async () => { await window.__soapDateFixture.updateSettings() })
    await page.waitForFunction(() => document.querySelector('#therapistName')?.value === "Invented updated therapist")
    assert.equal(await page.getByLabel("Date of Session", { exact: true }).inputValue(), enteredDate)
  }))

  it("still supplies a default when a cleared date is initialized again", () => fixture(enteredDate, async (page) => {
    await page.evaluate(async () => { await window.__soapDateFixture.setDate("") })
    await page.evaluate(async () => { await window.__soapDateFixture.next() })
    await page.evaluate(async () => { await window.__soapDateFixture.previous() })
    const today = await page.evaluate(() => new Date().toISOString().split("T")[0])
    assert.equal(await page.getByLabel("Date of Session", { exact: true }).inputValue(), today)
  }))
})
