import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { existsSync } from "node:fs"
import { after, before, describe, it } from "node:test"
import { BUSINESS_INCOME_APP_SETTINGS_KEY } from "../lib/business-income-planner.js"
import { buildPlannerFixture, openPlannerFixture, plannerKeys } from "./fixtures/business-planner-storage-harness.mjs"

const require = createRequire(import.meta.url)

/** Edits a real control and returns its observable value; no input handlers are mocked. */
async function editFirstControl(page) {
  const control = page.locator('input:not([disabled]):not([readonly]),textarea:not([disabled]),button[role="checkbox"]:not([disabled])').first()
  if (await control.getAttribute("role") === "checkbox") {
    await control.click()
    return { checkbox: true, value: await control.getAttribute("aria-checked") }
  }
  const current = await control.inputValue()
  const value = await control.getAttribute("type") === "number"
    ? String(Number(current || 0) + 7)
    : `${current} invented edit`
  await control.fill(value)
  return { checkbox: false, value }
}

/** Reads the native fixture store and intercepted operations without exercising the failing adapter. */
async function snapshot(fixture) {
  return fixture.page.evaluate((key) => {
    const h = window.__businessPlannerFixture
    return { raw: h.nativeStorage.getItem(key), writes: h.writes, removals: h.removals,
      unrelated: h.nativeStorage.getItem(h.unrelatedKey), errors: h.errors }
  }, fixture.key)
}

/** Rejects unhandled client errors or requests outside the locally fulfilled fixture routes. */
function assertNoUnexpectedTraffic(fixture) {
  assert.deepEqual(fixture.requests.blocked, [])
  assert.deepEqual(fixture.requests.pageErrors, [])
}

describe("Business planner draft storage recovery", { concurrency: false }, () => {
  let browser
  let bundle
  before(async () => {
    const { chromium } = require("playwright")
    assert.ok(existsSync(chromium.executablePath()), "Use cached Chromium; this suite never downloads a browser")
    bundle = await buildPlannerFixture()
    browser = await chromium.launch({ headless: true })
  }, { timeout: 120_000 })
  after(async () => { await browser?.close() })

  for (const planner of Object.keys(plannerKeys)) {
    it(`restores ${planner} edits before Strict Mode autosave`, async () => {
      const f = await openPlannerFixture(browser, bundle, { planner })
      try {
        await f.page.waitForFunction(() => window.__businessPlannerFixture.writes.length > 0)
        await editFirstControl(f.page)
        const stored = await snapshot(f)
        await f.reload()
        await f.page.waitForFunction(() => window.__businessPlannerFixture.writes.length > 0)
        const restored = await snapshot(f)
        const expected = JSON.parse(stored.raw)
        const actual = JSON.parse(restored.raw)
        if (planner === "launch-checklist") {
          // The existing normalizer expands absent checklist entries to false.
          for (const [key, value] of Object.entries(actual)) {
            if (!Object.hasOwn(expected, key)) assert.equal(value, false)
          }
          for (const [key, value] of Object.entries(expected)) assert.equal(actual[key], value)
        } else {
          assert.deepEqual(actual, expected)
        }
        assert.ok(restored.writes.every((write) => {
          const written = JSON.parse(write.value)
          return write.key === f.key && Object.entries(expected).every(([key, value]) => (
            JSON.stringify(written[key]) === JSON.stringify(value)
          ))
        }))
        assert.equal(restored.unrelated, "preserve invented fixture")
        assert.deepEqual(restored.errors, [])
        assert.equal(await f.page.getByRole("status").count(), 0)
        assertNoUnexpectedTraffic(f)
        assert.deepEqual(f.requests.account, [])
      } finally { await f.context.close() }
    })

    for (const mode of ["getter-denied", "read-denied"]) {
      it(`keeps ${planner} usable and its unread draft intact after ${mode}`, async () => {
        const seed = '{"inventedUnreadDraft":"preserve"}'
        const f = await openPlannerFixture(browser, bundle, { planner, mode, seed })
        try {
          await f.page.getByRole("status").waitFor({ state: "visible" })
          assert.match(await f.page.getByRole("status").textContent(), /could not be read/)
          await f.page.clock.install()
          // API recovery alone must not overwrite work this mount never read.
          await f.page.evaluate(() => {
            window.__businessPlannerFixture.allowReads = true
            window.__businessPlannerFixture.config.mode = "available"
          })
          await editFirstControl(f.page)
          await f.page.clock.fastForward(1500)
          const state = await snapshot(f)
          assert.equal(state.raw, seed)
          assert.deepEqual(state.writes, [])
          assert.equal(state.unrelated, "preserve invented fixture")
          assert.deepEqual(state.errors, [])
          assert.deepEqual(f.requests.account, [])
          assertNoUnexpectedTraffic(f)
          if (planner === "income") assert.equal(await f.page.getByText("Not saved on this device", { exact: true }).count(), 1)
        } finally { await f.context.close() }
      })
    }

    it(`retains ${planner} input after quota failure and clears the notice after recovery`, async () => {
      const f = await openPlannerFixture(browser, bundle, { planner, mode: "quota", seed: "{}" })
      try {
        await f.page.getByRole("status").waitFor({ state: "visible" })
        assert.match(await f.page.getByRole("status").textContent(), /Local saving is unavailable/)
        await editFirstControl(f.page)
        assert.equal((await snapshot(f)).raw, "{}")
        await f.page.evaluate(() => { window.__businessPlannerFixture.allowWrites = true })
        await editFirstControl(f.page)
        await f.page.waitForFunction(() => window.__businessPlannerFixture.writes.length > 0)
        await f.page.getByRole("status").waitFor({ state: "detached" })
        const state = await snapshot(f)
        assert.notEqual(state.raw, "{}")
        assert.deepEqual(state.errors, [])
        assert.equal(state.unrelated, "preserve invented fixture")
        assert.deepEqual(f.requests.account, [])
        assertNoUnexpectedTraffic(f)
      } finally { await f.context.close() }
    })
  }

  it("preserves invalid raw data when removing that draft is denied", async () => {
    const seed = "{invented invalid JSON"
    const f = await openPlannerFixture(browser, bundle, { mode: "corrupt-remove-denied", seed })
    try {
      await f.page.getByRole("status").waitFor({ state: "visible" })
      await editFirstControl(f.page)
      const state = await snapshot(f)
      assert.equal(state.raw, seed)
      assert.deepEqual(state.writes, [])
      assert.deepEqual(state.removals, [])
      assert.deepEqual(state.errors, [])
      assertNoUnexpectedTraffic(f)
    } finally { await f.context.close() }
  })

  it("resets only its own corrupt key when removal succeeds", async () => {
    const f = await openPlannerFixture(browser, bundle, { seed: "{invented invalid JSON" })
    try {
      await f.page.waitForFunction(() => window.__businessPlannerFixture.writes.length > 0)
      const state = await snapshot(f)
      assert.doesNotThrow(() => JSON.parse(state.raw))
      assert.ok(state.removals.length > 0 && state.removals.every((key) => key === f.key))
      assert.equal(state.unrelated, "preserve invented fixture")
      assert.deepEqual(state.errors, [])
      assertNoUnexpectedTraffic(f)
    } finally { await f.context.close() }
  })

  it("keeps Income account hydration and mocked account saving separate from device failure", async () => {
    const f = await openPlannerFixture(browser, bundle, {
      planner: "income", mode: "getter-denied", seed: '{"desiredTakeHomeIncome":1111}',
      incomeProps: { isSignedIn: true, displayName: "Invented owner", initialAccountPlanner: { desiredTakeHomeIncome: 4321 } },
    })
    try {
      await f.page.getByRole("status").waitFor({ state: "visible" })
      const input = f.page.locator('input[type="number"]').first()
      assert.equal(await input.inputValue(), "4321")
      await f.page.clock.install()
      await f.page.clock.fastForward(1500)
      assert.deepEqual(f.requests.account, [])
      await input.fill("4328")
      await f.page.clock.fastForward(1500)
      await f.page.waitForFunction(() => document.body.textContent.includes("Saved to this account"))
      assert.equal(f.requests.account.length, 1)
      assert.deepEqual(Object.keys(f.requests.account[0]), ["appSettings"])
      assert.deepEqual(Object.keys(f.requests.account[0].appSettings), [BUSINESS_INCOME_APP_SETTINGS_KEY])
      assert.equal(f.requests.account[0].appSettings[BUSINESS_INCOME_APP_SETTINGS_KEY].desiredTakeHomeIncome, 4328)
      assert.equal((await snapshot(f)).raw, '{"desiredTakeHomeIncome":1111}')
      await input.fill("5000")
      await f.page.evaluate(() => window.__businessPlannerFixture.updateIncomeProps({
        isSignedIn: true, displayName: "Invented owner", initialAccountPlanner: { desiredTakeHomeIncome: 4321 },
      }))
      await f.page.clock.runFor(100)
      assert.equal(await input.inputValue(), "5000", "a refreshed initial prop must not replace an edit in progress")
      await f.page.clock.fastForward(1500)
      await f.page.waitForFunction(() => document.body.textContent.includes("Saved to this account"))
      assert.equal(f.requests.account.length, 2)
      assert.equal(f.requests.account[1].appSettings[BUSINESS_INCOME_APP_SETTINGS_KEY].desiredTakeHomeIncome, 5000)
      assert.deepEqual((await snapshot(f)).errors, [])
      assertNoUnexpectedTraffic(f)
    } finally { await f.context.close() }
  })

  it("keeps the mobile failure notice readable and leaves keyboard focus on the edited control", async () => {
    const f = await openPlannerFixture(browser, bundle, { mode: "getter-denied", viewport: { width: 390, height: 844 } })
    try {
      const notice = f.page.getByRole("status")
      await notice.waitFor({ state: "visible" })
      await editFirstControl(f.page)
      assert.equal(await f.page.evaluate(() => document.activeElement?.tagName), "INPUT")
      assert.match(await notice.textContent(), /copy your changes before leaving/)
      assert.ok((await notice.boundingBox()).width <= 390)
      assert.deepEqual((await snapshot(f)).errors, [])
      assertNoUnexpectedTraffic(f)
    } finally { await f.context.close() }
  })
})
