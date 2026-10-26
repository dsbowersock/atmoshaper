import assert from "node:assert/strict"
import fs from "node:fs"
import { createRequire } from "node:module"
import { after, before, describe, it } from "node:test"
import { expect } from "@playwright/test"
import { createDonationCheckoutBrowserBundle, withDonationCheckoutBrowserFixture } from "./fixtures/donation-checkout-browser-harness.mjs"

const require = createRequire(import.meta.url)
const DONATION_PATH = "/api/billing/donation"
const STORAGE_KEY = "massagelab-donation-checkout-attempt-v1"

/** Waits for the actual React form and its mount effects after each native document navigation. */
async function settledDonationForm(page) {
  await page.waitForFunction(() => window.__donationFixtureReady === true)
  const form = page.locator(`form[action="${DONATION_PATH}"]`)
  await expect(form).toHaveCount(1)
  return form
}

async function openPricing(page, origin) {
  await page.goto(`${origin}/pricing`, { waitUntil: "domcontentloaded" })
  return settledDonationForm(page)
}

function donationButton(form, name) {
  return form.getByRole("button", { name, exact: true })
}

/** Reads the platform-serialized native POST, including duplicate-field detection. */
function donationCall(request) {
  assert.equal(request.method, "POST")
  const fields = new URLSearchParams(request.body)
  const attemptIds = fields.getAll("checkoutAttemptId")
  expect(attemptIds).toHaveLength(1)
  expect(fields.getAll("amountCents")).toHaveLength(1)
  return { amounts: fields.getAll("amountCents"), attemptId: attemptIds[0] }
}

async function storedAttempt(page) {
  return page.evaluate((key) => {
    const value = sessionStorage.getItem(key)
    return value ? JSON.parse(value) : null
  }, STORAGE_KEY)
}

/** Follows a real native POST/303 document return; no form handler or retry behavior is copied. */
async function followDonationRedirect({ page, calls, accessibleName, returnCode }) {
  const form = await settledDonationForm(page)
  const before = calls.length
  const navigation = page.waitForEvent("framenavigated", (frame) => frame === page.mainFrame())
  const response = page.waitForResponse((response) => new URL(response.url()).pathname === DONATION_PATH && response.request().method() === "POST")
  await donationButton(form, accessibleName).evaluate((button) => button.click())
  await expect.poll(() => calls.length).toBe(before + 1)
  const redirect = await response
  expect(redirect.status()).toBe(303)
  expect(redirect.headers().location).toBe(`/pricing?donation=${returnCode}`)
  await navigation
  await expect(page).toHaveURL(new RegExp(`[?&]donation=${returnCode}(?:&|$)`))
  await settledDonationForm(page)
  return calls[before]
}

describe("Actual donation form native browser journeys", { concurrency: false, timeout: 120_000 }, () => {
  let browser, bundle
  before(async () => {
    const { chromium } = require("@playwright/test")
    assert.ok(fs.existsSync(chromium.executablePath()), "Use cached Chromium; never download a browser")
    bundle = await createDonationCheckoutBrowserBundle()
    browser = await chromium.launch({ headless: true, args: ["--disable-background-networking", "--disable-component-update", "--disable-domain-reliability", "--disable-sync"] })
  })
  after(async () => { await browser?.close() })
  const fixture = (run) => withDonationCheckoutBrowserFixture(browser, bundle, run)

  it("keeps one attempt through bounded, unavailable, generic, and ambiguous outcomes", () => fixture(async (page, { origin, setDonationHandler }) => {
    const outcomes = ["rate-limited", "unavailable", "checkout-error", "abort", "rate-limited"]
    const calls = []
    let releaseFirst
    const firstResponseGate = new Promise((resolve) => { releaseFirst = resolve })
    setDonationHandler(async (request) => {
      const outcome = outcomes[calls.length]
      calls.push(donationCall(request))
      if (calls.length === 1) await firstResponseGate
      return outcome
    })

    let form = await openPricing(page, origin)
    const claimedState = await donationButton(form, "$5 Small project support").evaluate(async (button) => {
      button.click()
      button.click()
      await new Promise((resolve) => requestAnimationFrame(resolve))
      return {
        busy: button.form?.getAttribute("aria-busy"),
        allSubmitsDisabled: [...button.form.querySelectorAll('button[type="submit"]')].every((submit) => submit.disabled),
        status: button.form?.querySelector('[role="status"]')?.textContent,
      }
    })
    expect(claimedState).toEqual({ busy: "true", allSubmitsDisabled: true, status: "Opening secure checkout…" })
    await expect.poll(() => calls.length).toBe(1)
    await page.waitForTimeout(250)
    expect(calls).toHaveLength(1)
    const firstNavigation = page.waitForEvent("framenavigated", (frame) => frame === page.mainFrame())
    const firstResponse = page.waitForResponse((response) => new URL(response.url()).pathname === DONATION_PATH && response.request().method() === "POST")
    releaseFirst()
    const firstRedirect = await firstResponse
    expect(firstRedirect.status()).toBe(303)
    expect(firstRedirect.headers().location).toBe("/pricing?donation=rate-limited")
    await firstNavigation
    form = await settledDonationForm(page)
    await expect(page).toHaveURL(/donation=rate-limited$/)

    const firstAttempt = calls[0].attemptId
    expect(firstAttempt).toMatch(/^[0-9a-f-]{36}$/)
    expect(calls[0].amounts).toEqual(["500"])
    await expect.poll(async () => (await storedAttempt(page))?.attemptId).toBe(firstAttempt)
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })))
    expect(await form.evaluate((owner) => ({
      busy: owner.getAttribute("aria-busy"),
      allSubmitsEnabled: [...owner.querySelectorAll('button[type="submit"]')].every((submit) => !submit.disabled),
      statusText: owner.querySelector('[role="status"]')?.textContent,
      alertText: owner.querySelector('[role="alert"]')?.textContent,
    }))).toEqual({ busy: "false", allSubmitsEnabled: true, statusText: "", alertText: "" })
    expect(calls).toHaveLength(1)
    await expect.poll(async () => (await storedAttempt(page))?.attemptId).toBe(firstAttempt)

    for (const returnCode of ["unavailable", "checkout-error"]) {
      const call = await followDonationRedirect({ page, calls, accessibleName: "$5 Small project support", returnCode })
      expect(call.attemptId).toBe(firstAttempt)
      expect(call.amounts).toEqual(["500"])
      await expect.poll(async () => (await storedAttempt(page))?.attemptId).toBe(firstAttempt)
    }
    form = await settledDonationForm(page)
    // Browser interception models one ambiguous transport failure without HTTP's automatic socket retry.
    await page.route(`${origin}${DONATION_PATH}`, async (route) => {
      calls.push(donationCall({ method: route.request().method(), body: route.request().postData() }))
      await route.abort("failed")
    }, { times: 1 })
    await donationButton(form, "$5 Small project support").evaluate((button) => button.click())
    await expect.poll(() => calls.length).toBe(4)
    await page.waitForTimeout(250)
    expect(calls).toHaveLength(4)
    expect(calls[3].attemptId).toBe(firstAttempt)

    await openPricing(page, origin)
    await expect.poll(async () => (await storedAttempt(page))?.attemptId).toBe(firstAttempt)
    const recovered = await followDonationRedirect({ page, calls, accessibleName: "$5 Small project support", returnCode: "rate-limited" })
    expect(recovered.attemptId).toBe(firstAttempt)
    await page.waitForTimeout(250)
    expect(calls).toHaveLength(5)
  }))

  it("rotates on amount, conflict, success, cancel, and explicit new attempt", () => fixture(async (page, { origin, setDonationHandler }) => {
    const outcomes = ["rate-limited", "conflict", "thanks", "cancelled", "rate-limited", "unavailable"]
    const calls = []
    setDonationHandler((request) => {
      const outcome = outcomes[calls.length]
      calls.push(donationCall(request))
      return outcome
    })
    await openPricing(page, origin)
    const submit = (accessibleName, returnCode) => followDonationRedirect({ page, calls, accessibleName, returnCode })
    const first = await submit("$5 Small project support", "rate-limited")
    const amountChanged = await submit("$15 Support a careful build session", "conflict")
    expect(amountChanged.amounts).toEqual(["1500"])
    expect(amountChanged.attemptId).not.toBe(first.attemptId)
    await expect.poll(() => storedAttempt(page)).toBe(null)
    const afterConflict = await submit("$15 Support a careful build session", "thanks")
    expect(afterConflict.attemptId).not.toBe(amountChanged.attemptId)
    await expect.poll(() => storedAttempt(page)).toBe(null)
    const afterSuccess = await submit("$15 Support a careful build session", "cancelled")
    expect(afterSuccess.attemptId).not.toBe(afterConflict.attemptId)
    await expect.poll(() => storedAttempt(page)).toBe(null)
    const afterCancel = await submit("$15 Support a careful build session", "rate-limited")
    expect(afterCancel.attemptId).not.toBe(afterSuccess.attemptId)
    await expect.poll(async () => (await storedAttempt(page))?.attemptId).toBe(afterCancel.attemptId)
    const form = await settledDonationForm(page)
    await form.getByRole("button", { name: "Start a new checkout attempt" }).click()
    await expect.poll(() => storedAttempt(page)).toBe(null)
    const explicitNew = await submit("$15 Support a careful build session", "unavailable")
    expect(explicitNew.attemptId).not.toBe(afterCancel.attemptId)
    expect(new Set(calls.map(({ attemptId }) => attemptId).slice(1))).toHaveProperty("size", 5)
    expect(calls.map(({ amounts }) => amounts)).toEqual([["500"], ...Array.from({ length: 5 }, () => ["1500"])])
  }))
})
