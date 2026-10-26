import {
  expect,
  test as base,
  type Locator,
  type Page,
} from "@playwright/test"
import { PROBLEM_REPORT_REQUEST_TIMEOUT_MS } from "../../lib/problem-report.js"

const DONATION_PATH = "/api/billing/donation"
const REPORT_PATH = "/api/support/problem-report"
const DONATION_STORAGE_KEY = "massagelab-donation-checkout-attempt-v1"
const RETRY_DIAGNOSTIC_EVENT_ID = "11111111111111111111111111111111"
const TIMEOUT_DIAGNOSTIC_EVENT_ID = "22222222222222222222222222222222"
const RECOVERY_DIAGNOSTIC_EVENT_ID = "33333333333333333333333333333333"

type ProviderBoundary = {
  appOrigin: string
  unexpectedExternalRequests: string[]
  unexpectedSameOriginApiRequests: string[]
  assertClean: () => void
  takeUnexpectedExternalRequests: () => string[]
  takeUnexpectedSameOriginApiRequests: () => string[]
}

const test = base.extend<{ providerBoundary: ProviderBoundary }>({
  providerBoundary: [async ({ page }, use, testInfo) => {
    const configuredBaseUrl = testInfo.project.use.baseURL
    if (typeof configuredBaseUrl !== "string") {
      throw new Error("Public ingress browser QA requires a configured string baseURL.")
    }
    const appOrigin = new URL(configuredBaseUrl).origin
    const unexpectedExternalRequests: string[] = []
    const unexpectedSameOriginApiRequests: string[] = []
    const boundary: ProviderBoundary = {
      appOrigin,
      unexpectedExternalRequests,
      unexpectedSameOriginApiRequests,
      assertClean: () => {
        expect(
          unexpectedExternalRequests,
          "public ingress browser journeys must not make off-origin HTTP(S) requests",
        ).toEqual([])
        expect(
          unexpectedSameOriginApiRequests,
          "public ingress browser journeys must not start an unexpected same-origin app API",
        ).toEqual([])
      },
      takeUnexpectedExternalRequests: () => unexpectedExternalRequests.splice(0),
      takeUnexpectedSameOriginApiRequests: () => unexpectedSameOriginApiRequests.splice(0),
    }
    await page.route((url) => isExternalHttpUrl(url, appOrigin), async (route) => {
      boundary.unexpectedExternalRequests.push(
        `${route.request().method()} ${route.request().url()}`,
      )
      await route.abort("blockedbyclient")
    })

    await use(boundary)

    boundary.assertClean()
  }, { auto: true }],
})

function isExternalHttpUrl(url: URL, appOrigin: string) {
  return ["http:", "https:"].includes(url.protocol)
    && url.origin !== appOrigin
}

function isSameOriginPath(url: URL, appOrigin: string, pathname: string) {
  return url.origin === appOrigin && url.pathname === pathname
}

/** Stops unrelated browser-side app APIs from silently escaping the acceptance boundary. */
async function installSameOriginAppBoundary(page: Page, boundary: ProviderBoundary) {
  await page.route((url) => (
    url.origin === boundary.appOrigin
    && url.pathname.startsWith("/api/")
  ), async (route) => {
    const url = new URL(route.request().url())
    if (url.pathname === "/api/auth/session") {
      await route.fulfill({ status: 200, contentType: "application/json", body: "null" })
      return
    }
    boundary.unexpectedSameOriginApiRequests.push(`${route.request().method()} ${url.pathname}`)
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Browser QA intercepted unrelated app API." }),
    })
  })
}

async function waitForReactHydration(locator: Locator) {
  await expect.poll(() => locator.evaluate((element) => (
    Object.keys(element).some((key) => key.startsWith("__reactProps"))
  ))).toBe(true)
}

async function openPricing(page: Page) {
  await page.goto("/pricing", { waitUntil: "domcontentloaded" })
  const form = await settledDonationForm(page)
  await expect(form).toBeVisible()
  return form
}

/** Waits out Next's brief outgoing/incoming document overlap after a 303 navigation. */
async function settledDonationForm(page: Page) {
  const forms = page.locator(`form[action="${DONATION_PATH}"]`)
  await expect(forms).toHaveCount(1)
  const form = forms.first()
  await waitForReactHydration(form)
  return form
}

async function openSupport(page: Page) {
  await page.goto("/support", { waitUntil: "domcontentloaded" })
  const forms = page.locator("form").filter({
    has: page.getByText("No clinical details in this report", { exact: true }),
  })
  // Next can briefly retain the outgoing document during a soft navigation.
  // Wait for one current diagnostic owner before checking React hydration.
  await expect(forms).toHaveCount(1)
  const form = forms.first()
  const submit = form.getByRole("button", { name: "Send Diagnostic", exact: true })
  await expect(submit).toBeVisible()
  await waitForReactHydration(form)
  return { form, submit }
}

async function storedAttempt(page: Page) {
  return page.evaluate((key) => {
    const value = sessionStorage.getItem(key)
    return value ? JSON.parse(value) as { amountCents: number; attemptId: string } : null
  }, DONATION_STORAGE_KEY)
}

test("external targets and unexpected app APIs stay visible to the browser boundary", async ({
  page,
  providerBoundary,
}) => {
  await installSameOriginAppBoundary(page, providerBoundary)
  await page.route((url) => [DONATION_PATH, REPORT_PATH].some((pathname) => (
    isSameOriginPath(url, providerBoundary.appOrigin, pathname)
  )), async (route) => {
    await route.fulfill({
      status: 204,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: "",
    })
  })
  const targetUrls = [
    `https://provider-boundary.invalid${DONATION_PATH}`,
    `https://provider-boundary.invalid${REPORT_PATH}`,
  ]
  const blocked = await page.evaluate(async (urls) => Promise.all(urls.map(async (url) => {
    try {
      await fetch(url, { method: "POST" })
      return false
    } catch {
      return true
    }
  })), targetUrls)

  expect(blocked).toEqual([true, true])
  expect(providerBoundary.takeUnexpectedExternalRequests().sort()).toEqual([
    `POST ${targetUrls[0]}`,
    `POST ${targetUrls[1]}`,
  ].sort())

  const maskedAppApiStatus = await page.evaluate(async (appOrigin) => {
    const response = await fetch(`${appOrigin}/api/billing/checkout`, { method: "POST" })
    return response.status
  }, providerBoundary.appOrigin)
  expect(maskedAppApiStatus).toBe(503)
  expect(() => providerBoundary.assertClean()).toThrow(/same-origin app API/i)
  expect(providerBoundary.takeUnexpectedSameOriginApiRequests()).toEqual([
    "POST /api/billing/checkout",
  ])
  providerBoundary.assertClean()
})

test("unavailable donation controls reject new attempts without storage writes or POST", async ({
  page,
  providerBoundary,
}) => {
  await installSameOriginAppBoundary(page, providerBoundary)
  const posts: string[] = []
  await page.route((url) => isSameOriginPath(url, providerBoundary.appOrigin, DONATION_PATH), async (route) => {
    posts.push(route.request().method())
    await route.abort("blockedbyclient")
  })
  await page.addInitScript((key) => {
    const original = Storage.prototype.setItem
    const writes: string[] = []
    Object.defineProperty(window, "__donationAttemptWrites", { value: writes })
    Storage.prototype.setItem = function (name, value) {
      if (name === key) writes.push(value)
      return original.call(this, name, value)
    }
  }, DONATION_STORAGE_KEY)
  const form = await openPricing(page)
  await expect(form.getByRole("status")).toHaveText("One-time support is temporarily unavailable.")
  await expect(form).toHaveAttribute("aria-busy", "false")
  const buttons = form.getByRole("button")
  expect(await buttons.count()).toBe(5)
  for (const button of await buttons.all()) await expect(button).toBeDisabled()
  const blocked = await form.evaluate((owner) => {
    const submitter = owner.querySelector<HTMLButtonElement>('button[type="submit"]')!
    submitter.click()
    const attempt = new SubmitEvent("submit", { bubbles: true, cancelable: true, submitter })
    owner.dispatchEvent(attempt)
    owner.querySelector<HTMLButtonElement>('button[type="button"]')!.click()
    return attempt.defaultPrevented
  })
  expect(blocked).toBe(true)
  await expect.poll(() => storedAttempt(page)).toBe(null)
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
  expect(await page.evaluate(() => Reflect.get(window, "__donationAttemptWrites"))).toEqual([])
  expect(posts).toEqual([])
  await expect(form).toHaveAttribute("aria-busy", "false")
})

test("unavailable donation retains transient retries and cleans terminal returns with real notices", async ({
  page,
  providerBoundary,
}) => {
  await installSameOriginAppBoundary(page, providerBoundary)
  const posts: string[] = []
  await page.route((url) => isSameOriginPath(url, providerBoundary.appOrigin, DONATION_PATH), async (route) => {
    posts.push(route.request().method())
    await route.abort("blockedbyclient")
  })
  await openPricing(page)
  const retained = { attemptId: "123e4567-e89b-42d3-a456-426614174000", amountCents: 500, createdAt: Date.now() }
  const returns = [
    ["rate-limited", "One-time support checkout temporarily paused", false],
    ["unavailable", "One-time support checkout temporarily unavailable", false],
    ["checkout-error", "One-time support checkout unavailable", false],
    ["conflict", "One-time support checkout attempt changed", true],
    ["thanks", "One-time support checkout completed", true],
    ["cancelled", "One-time support checkout cancelled", true],
  ] as const
  for (const [returnCode, notice, terminal] of returns) {
    await page.evaluate(({ key, retained }) => sessionStorage.setItem(key, JSON.stringify(retained)), { key: DONATION_STORAGE_KEY, retained })
    await page.goto(`/pricing?donation=${returnCode}`, { waitUntil: "domcontentloaded" })
    const form = await settledDonationForm(page)
    await expect(page.getByText(notice, { exact: true })).toBeVisible()
    await expect(form.getByRole("status")).toHaveText("One-time support is temporarily unavailable.")
    await expect.poll(() => storedAttempt(page)).toEqual(terminal ? null : retained)
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })))
    await expect(form).toHaveAttribute("aria-busy", "false")
    for (const button of await form.getByRole("button").all()) await expect(button).toBeDisabled()
    await expect.poll(() => storedAttempt(page)).toEqual(terminal ? null : retained)
    expect(posts).toEqual([])
  }
})
test("diagnostic Retry-After owns a countdown without automatic replay", async ({
  page,
  providerBoundary,
}) => {
  await installSameOriginAppBoundary(page, providerBoundary)
  const reportBodies: Array<Record<string, unknown>> = []
  let releaseFirst: () => void = () => undefined
  const firstResponseGate = new Promise<void>((resolve) => {
    releaseFirst = resolve
  })
  let releaseSecond: () => void = () => undefined
  const secondResponseGate = new Promise<void>((resolve) => {
    releaseSecond = resolve
  })
  await page.route((url) => (
    isSameOriginPath(url, providerBoundary.appOrigin, REPORT_PATH)
  ), async (route) => {
    reportBodies.push(route.request().postDataJSON() as Record<string, unknown>)
    if (reportBodies.length === 1) {
      await firstResponseGate
      await route.fulfill({
        status: 429,
        contentType: "application/json",
        headers: { "Retry-After": "3" },
        body: JSON.stringify({ error: "bounded" }),
      })
      return
    }
    await secondResponseGate
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ eventId: RETRY_DIAGNOSTIC_EVENT_ID }),
    })
  })

  const { form, submit } = await openSupport(page)
  await page.clock.install()
  const pauseTarget = await page.evaluate(() => Date.now() + 500)
  await page.clock.pauseAt(pauseTarget)
  await submit.click()
  await expect.poll(() => reportBodies.length).toBe(1)
  await expect(form).toHaveAttribute("aria-busy", "true")
  await expect(page.getByRole("button", { name: "Sending...", exact: true })).toBeDisabled()
  releaseFirst()

  await expect(page.getByText("Diagnostic reports temporarily paused", { exact: true })).toBeVisible()
  const liveStatus = form.getByRole("status")
  await expect(liveStatus).toHaveAttribute("aria-live", "polite")
  await expect(liveStatus).toHaveAttribute("aria-atomic", "true")
  const waitingAnnouncement = "Diagnostic reports are temporarily paused. Wait before trying again. This page will not resend the report automatically."
  await expect(liveStatus).toHaveText(waitingAnnouncement)
  const retry = page.getByRole("button", { name: "Try Diagnostic Again", exact: true })
  await expect(retry).toBeDisabled()
  await expect(page.getByText(
    "Please wait 3 seconds before trying again. This page will not resend the report automatically.",
    { exact: true },
  )).toBeVisible()

  await page.clock.fastForward(1_000)
  await expect(page.getByText(
    "Please wait 2 seconds before trying again. This page will not resend the report automatically.",
    { exact: true },
  )).toBeVisible()
  await expect(liveStatus).toHaveText(waitingAnnouncement)
  await page.clock.fastForward(1_999)
  await expect(retry).toBeDisabled()
  await page.clock.fastForward(1)
  await expect(retry).toBeEnabled()
  await expect(page.getByRole("paragraph").filter({
    hasText: "You can try again now. This page will not resend the report automatically.",
  })).toBeVisible()
  await expect(liveStatus).toHaveText(
    "You can try again now. This page will not resend the report automatically.",
  )
  await page.clock.fastForward(30_000)
  expect(reportBodies).toHaveLength(1)

  await retry.click()
  await expect.poll(() => reportBodies.length).toBe(2)
  await page.getByRole("combobox", { name: "Tool area" }).click()
  await page.getByRole("option", { name: "Account, billing, or login" }).click()
  await page.getByRole("combobox", { name: "Issue type" }).click()
  await page.getByRole("option", { name: "Page crashed or would not load" }).click()
  releaseSecond()
  await expect(page.getByText("Diagnostic report sent", { exact: true })).toBeVisible()
  await expect(liveStatus).toContainText("Diagnostic report sent")
  expect(reportBodies[1]).toMatchObject({ area: "not-sure", category: "action-failed" })
  const emailHref = await page.getByRole("link", { name: "Open Email", exact: true }).getAttribute("href")
  expect(emailHref).not.toBeNull()
  const emailBody = new URL(emailHref ?? "mailto:").searchParams.get("body") ?? ""
  expect(emailBody).toContain("Tool area: Not sure")
  expect(emailBody).toContain("Issue type: Button or action failed")
  expect(emailBody).not.toContain("Tool area: Account, billing, or login")
  expect(emailBody).not.toContain("Issue type: Page crashed or would not load")
})

test("diagnostic client deadline returns to manual ambiguous recovery without replay", async ({
  page,
  providerBoundary,
}) => {
  await installSameOriginAppBoundary(page, providerBoundary)
  const reportBodies: Array<Record<string, unknown>> = []
  let releaseStalled: () => void = () => undefined
  let settleStalled: () => void = () => undefined
  const stalledGate = new Promise<void>((resolve) => {
    releaseStalled = resolve
  })
  const stalledSettled = new Promise<void>((resolve) => {
    settleStalled = resolve
  })
  await page.route((url) => (
    isSameOriginPath(url, providerBoundary.appOrigin, REPORT_PATH)
  ), async (route) => {
    reportBodies.push(route.request().postDataJSON() as Record<string, unknown>)
    if (reportBodies.length === 1) {
      await stalledGate
      await route.abort().catch(() => undefined)
      settleStalled()
      return
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ eventId: TIMEOUT_DIAGNOSTIC_EVENT_ID }),
    })
  })

  const { form, submit } = await openSupport(page)
  await page.clock.install()
  await submit.click()
  await expect.poll(() => reportBodies.length).toBe(1)
  await expect(form).toHaveAttribute("aria-busy", "true")
  await page.clock.fastForward(PROBLEM_REPORT_REQUEST_TIMEOUT_MS - 1_000)
  await expect(page.getByRole("button", { name: "Sending...", exact: true })).toBeDisabled()
  await page.clock.fastForward(1_000)

  await expect(page.getByText("Diagnostic report delivery uncertain", { exact: true })).toBeVisible()
  const retry = page.getByRole("button", { name: "Try Diagnostic Again", exact: true })
  await expect(retry).toBeEnabled()
  await expect(form.getByRole("status")).toHaveText(
    "AtmoShaper could not confirm whether the diagnostic report was sent. This page will not resend it automatically.",
  )
  await page.clock.fastForward(30_000)
  expect(reportBodies).toHaveLength(1)

  releaseStalled()
  await stalledSettled
  await retry.click()
  await expect.poll(() => reportBodies.length).toBe(2)
  await expect(page.getByText("Diagnostic report sent", { exact: true })).toBeVisible()
})

test("diagnostic malformed limit, unavailable, and generic failure require manual recovery", async ({
  page,
  providerBoundary,
}) => {
  await installSameOriginAppBoundary(page, providerBoundary)
  const responses = [
    { status: 429, headers: { "Retry-After": "1.5" }, body: { error: "malformed" } },
    { status: 503, body: { error: "unavailable" } },
    { status: 500, body: { error: "failed" } },
    { status: 200, body: { eventId: 42 } },
    { status: 200, body: { eventId: RECOVERY_DIAGNOSTIC_EVENT_ID } },
  ]
  const reportBodies: Array<Record<string, unknown>> = []
  let releaseUnmountedResponse: () => void = () => undefined
  const unmountedResponseGate = new Promise<void>((resolve) => {
    releaseUnmountedResponse = resolve
  })
  await page.route((url) => (
    isSameOriginPath(url, providerBoundary.appOrigin, REPORT_PATH)
  ), async (route) => {
    reportBodies.push(route.request().postDataJSON() as Record<string, unknown>)
    if (reportBodies.length === 1) {
      await unmountedResponseGate
      await route.fulfill({
        status: 429,
        contentType: "application/json",
        headers: { "Retry-After": "30" },
        body: JSON.stringify({ error: "unmounted" }),
      })
      return
    }
    const response = responses[reportBodies.length - 2]
    await route.fulfill({
      status: response.status,
      contentType: "application/json",
      headers: response.headers,
      body: JSON.stringify(response.body),
    })
  })
  const firstSupport = await openSupport(page)
  await page.evaluate(() => {
    const observed = window as Window & { __diagnosticRetryTimers?: string[] }
    observed.__diagnosticRetryTimers = []
    const originalSetInterval = window.setInterval.bind(window)
    const originalSetTimeout = window.setTimeout.bind(window)
    window.setInterval = ((handler: TimerHandler, timeout?: number) => {
      if (timeout === 250) observed.__diagnosticRetryTimers?.push("interval:250")
      return originalSetInterval(handler, timeout)
    }) as typeof window.setInterval
    window.setTimeout = ((handler: TimerHandler, timeout?: number) => {
      if (timeout === 30_000) observed.__diagnosticRetryTimers?.push("timeout:30000")
      return originalSetTimeout(handler, timeout)
    }) as typeof window.setTimeout
  })
  await firstSupport.submit.click()
  await expect.poll(() => reportBodies.length).toBe(1)
  await page.locator('a[href="/roadmap"]').last().click()
  await expect(page).toHaveURL(/\/roadmap$/)
  releaseUnmountedResponse()
  await page.waitForTimeout(250)
  expect(await page.evaluate(() => (
    (window as Window & { __diagnosticRetryTimers?: string[] }).__diagnosticRetryTimers ?? []
  ))).toEqual([])
  expect(reportBodies).toHaveLength(1)

  await openSupport(page)
  await expect(page.getByText("No clinical details in this report", { exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: "Open Email", exact: true })).toBeVisible()

  await page.getByRole("button", { name: "Send Diagnostic", exact: true }).click()
  await expect.poll(() => reportBodies.length).toBe(2)
  await expect(page.getByText("Diagnostic report temporarily unavailable", { exact: true })).toBeVisible()
  const liveStatus = page
    .getByText("No clinical details in this report", { exact: true })
    .locator("xpath=ancestor::form")
    .getByRole("status")
  await expect(liveStatus).toHaveAttribute("aria-live", "polite")
  await expect(liveStatus).toHaveAttribute("aria-atomic", "true")
  const retry = page.getByRole("button", { name: "Try Diagnostic Again", exact: true })
  await expect(retry).toBeEnabled()
  await page.waitForTimeout(200)
  expect(reportBodies).toHaveLength(2)

  await retry.click()
  await expect.poll(() => reportBodies.length).toBe(3)
  await expect(page.getByText("Diagnostic report temporarily unavailable", { exact: true })).toBeVisible()
  await page.waitForTimeout(200)
  expect(reportBodies).toHaveLength(3)

  await retry.click()
  await expect.poll(() => reportBodies.length).toBe(4)
  await expect(page.getByText("Diagnostic report delivery uncertain", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Try Diagnostic Again", exact: true }).click()
  await expect.poll(() => reportBodies.length).toBe(5)
  await expect(page.getByText("Diagnostic report delivery uncertain", { exact: true })).toBeVisible()
  await expect(page.getByRole("link", { name: "Open Email", exact: true })).toHaveCount(0)
  await page.getByRole("button", { name: "Try Diagnostic Again", exact: true }).click()
  await expect.poll(() => reportBodies.length).toBe(6)
  await expect(page.getByText("Diagnostic report sent", { exact: true })).toBeVisible()
  await expect(liveStatus).toContainText("Diagnostic report sent")

  const diagnosticEmail = page.getByRole("link", { name: "Open Email", exact: true }).last()
  await expect(diagnosticEmail).toHaveAttribute("href", new RegExp(RECOVERY_DIAGNOSTIC_EVENT_ID))
  for (const body of reportBodies) {
    expect(Object.keys(body).sort()).toEqual([
      "area",
      "category",
      "clientContext",
      "linkedEventId",
      "route",
    ])
    expect(JSON.stringify(body)).not.toMatch(/client name|symptom|diagnosis|treatment/i)
  }
})
