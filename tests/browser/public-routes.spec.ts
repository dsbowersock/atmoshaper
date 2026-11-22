import { expect, test as base, type Locator, type Page, type Request, type Response, type Route } from "@playwright/test"
import { readFile } from "node:fs/promises"
import sharp from "sharp"
import { PDFDocument } from "pdf-lib"
import { LAUNCH_REPORT_QUESTIONS, LAUNCH_CHECKLIST_STORAGE_KEY, PLAN_OUTLINE_STORAGE_KEY } from "../../lib/business-planner-reports.js"
import { plannerReportSample } from "../fixtures/business-planner-report-sample.mjs"
import { isBrowserQaDatabaseTargetAuthorized } from "../../scripts/assert-browser-qa-database-target.mjs"
import { centerCarouselItem } from "./carousel-test-helpers"
import { isHeldRouteTeardownCancellation } from "./held-route-teardown"
import { installSignedInUserFixture, removeSignedInUserFixture } from "./signed-in-user-fixture"
import { buildFeelingWheelSegments } from "../../lib/feelings-wheel-layout.js"
import { revealPlannerControl, selectPlannerStep } from "../helpers/planner-navigation.mjs"

type PublicNetworkGuardState = {
  allowedExternalUrls: Set<string>
  localHostname: string
  ownedPreviewCancellations: string[]
  ownedPreviewFixtureRequests: WeakSet<Request>
  unfulfilledAllowedExternalRequests: string[]
  unexpectedExternalRequests: string[]
}

const publicNetworkGuardByPage = new WeakMap<Page, PublicNetworkGuardState>()

/**
 * Blocks external HTTP(S) by default and records unexpected requests or allowed
 * URLs that no exact fixture fulfilled. Per-test page routes are registered
 * later and must therefore take precedence over this catch-all guard.
 */
const test = base.extend<{ publicNetworkGuard: PublicNetworkGuardState }>({
  publicNetworkGuard: [async ({ baseURL, page }, use) => {
    if (!baseURL) throw new Error("Public network guard requires the configured Browser-QA base URL")
    const state: PublicNetworkGuardState = {
      allowedExternalUrls: new Set(),
      localHostname: new URL(baseURL).hostname,
      ownedPreviewCancellations: [],
      ownedPreviewFixtureRequests: new WeakSet(),
      unfulfilledAllowedExternalRequests: [],
      unexpectedExternalRequests: [],
    }
    publicNetworkGuardByPage.set(page, state)
    await page.route((url) => isExternalHttpUrl(url.toString(), state.localHostname), async (route) => {
      const request = route.request()
      const requestDescription = `${request.method()} ${request.url()}`
      if (state.allowedExternalUrls.has(request.url())) {
        state.unfulfilledAllowedExternalRequests.push(requestDescription)
      } else {
        state.unexpectedExternalRequests.push(requestDescription)
      }
      await route.abort("blockedbyclient")
    })
    await use(state)
    expect(state.unexpectedExternalRequests, "unexpected external requests after public journey").toEqual([])
    expect(
      state.unfulfilledAllowedExternalRequests,
      "allowed external requests without an exact fixture",
    ).toEqual([])
  }, { auto: true }],
})

const signedInFixtureOwnersByProject = new Map<string, Set<string>>()

async function installOwnedSignedInUserFixture(input: Parameters<typeof installSignedInUserFixture>[0]) {
  const identity = await installSignedInUserFixture(input)
  const owners = signedInFixtureOwnersByProject.get(input.projectName) ?? new Set<string>()
  owners.add(input.owner)
  signedInFixtureOwnersByProject.set(input.projectName, owners)
  return identity
}

test.afterEach(async ({}, testInfo) => {
  const owners = signedInFixtureOwnersByProject.get(testInfo.project.name)
  if (!owners) return
  signedInFixtureOwnersByProject.delete(testInfo.project.name)
  for (const owner of owners) {
    await removeSignedInUserFixture(testInfo.project.name, owner)
  }
})

function getPublicNetworkGuard(page: Page) {
  const state = publicNetworkGuardByPage.get(page)
  if (!state) throw new Error("Public network guard is unavailable for this page")
  return state
}

const publicRoutes = [
  { path: "/", expectedText: /AtmoShaper/i },
  { path: "/about", expectedText: /Built from inside the massage profession/i },
  { path: "/about/derrick", expectedText: /Therapist, educator, mentor/i },
  { path: "/help", expectedText: /Help & FAQ/i },
  { path: "/notes", expectedText: /Documentation access required/i },
  { path: "/notes/soap", expectedText: /Documentation access required/i },
  { path: "/chimer", expectedText: /Chimer/i },
  { path: "/clock", expectedText: /Clock|AM|PM/i },
  { path: "/browse", expectedText: /Wellness audio stations/i },
  { path: "/wellness", expectedText: /Client-owned self-tracking/i },
  { path: "/music", expectedText: /Treatment room starters/i },
  { path: "/wellness/breathing", expectedText: /Breathing guide/i },
  { path: "/calendar", expectedText: /Calendar/i },
  { path: "/tools", expectedText: /AtmoShaper Tools/i },
  { path: "/tools/business-planner", expectedText: /Business Planner/i },
  { path: "/tools/business-planner/income", expectedText: /Business Income Planner/i },
  { path: "/tools/business-planner/break-even", expectedText: /Startup Costs and Break-Even/i },
  { path: "/tools/business-planner/launch-checklist", expectedText: /Practice Launch Checklist/i },
  { path: "/tools/business-planner/service-menu", expectedText: /Service Menu and Policies/i },
  { path: "/tools/business-planner/plan-outline", expectedText: /Business Plan Outline/i },
  { path: "/tools/business-planner/add-on-profit", expectedText: /Add-On Profit Calculator/i },
  { path: "/education", expectedText: /Education/i },
  { path: "/education/flashcards", expectedText: /Flashcards/i },
  { path: "/education/flashcards/decks", expectedText: /Community Decks/i },
  { path: "/education/flashcards/decks/starter-all-body-identification", expectedText: /All-body image identification/i },
  { path: "/anatomime", expectedText: /Anatomime/i },
] as const

const forbiddenAnonymousEndpoints = [
  "/api/account/preferences",
  "/api/account/profile",
] as const

const externalFontUrl = "https://db.onlinewebfonts.com/t/8e22783d707ad140bffe18b2a3812529.woff2"
const ablyCdnUrl = "https://cdn.ably.com/lib/ably.min-2.js"
const chimerPreviewUrl = (name: string) => `https://media.massagelab.app/chimer/background-previews/${name}.webm`
const atmosphereSampleIndexUrl = (pieceId: string) => (
  `https://media.massagelab.app/atmosphere/${pieceId === "observable-streams"
    ? "observable-streams-vsco-adaptation"
    : `generative-fm/${pieceId}`}/sample-index.opus.json`
)
const initialAtmosphereSampleIndexUrls = [
  "aisatsana",
  "at-sunrise",
  "day-dream",
  "eno-machine",
  "lemniscate",
  "observable-streams",
  "peace",
  "trees",
].map(atmosphereSampleIndexUrl)
const atmosphereSampleIndexFixtureUrls = [
  ...initialAtmosphereSampleIndexUrls,
  atmosphereSampleIndexUrl("420hz-gamma-waves-for-big-brain"),
  atmosphereSampleIndexUrl("last-transit"),
]
const deterministicAtmospherePayloadUrls = {
  observableCorAnglais: "https://media.massagelab.app/atmosphere/browser-qa/observable-streams/cor-anglais-c4.opus",
  observablePiano: "https://media.massagelab.app/atmosphere/browser-qa/observable-streams/piano-c4.opus",
  observableViolin: "https://media.massagelab.app/atmosphere/browser-qa/observable-streams/violin-c4.opus",
  lastTransitTruck: "/audio/atmosphere/media-session-carrier.mp3",
  peaceFlute: "https://media.massagelab.app/atmosphere/browser-qa/peace/flute-c4.opus",
  treesPiano: "https://media.massagelab.app/atmosphere/browser-qa/trees/piano-c4.opus",
} as const

function buildChromaticNoteFixture(payloadUrl: string) {
  const notes: Record<string, string> = {}
  for (let octave = 1; octave <= 7; octave += 1) {
    for (const pitchClass of ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]) {
      notes[`${pitchClass}${octave}`] = payloadUrl
    }
  }
  return notes
}

function formatResponse(response: Response) {
  const url = new URL(response.url())
  return `${response.status()} ${url.pathname}`
}

test("public launch pauses preserve existing-account paths without starting registration or Checkout", async ({ page }) => {
  test.skip(
    process.env.MASSAGELAB_BROWSER_QA_PUBLIC_PAUSES !== "1",
    "Public pause controls are exercised only by the explicit launch-control lane.",
  )

  const acquisitionRequests: string[] = []
  page.on("request", (request) => {
    const url = new URL(request.url())
    if (
      url.hostname === "api.stripe.com"
      || url.hostname === "checkout.stripe.com"
      || url.pathname === "/api/account/register"
      || url.pathname === "/api/auth/google/intent"
      || url.pathname === "/api/billing/checkout"
    ) {
      acquisitionRequests.push(`${request.method()} ${url.hostname}${url.pathname}`)
    }
  })

  await page.goto("/register", { waitUntil: "domcontentloaded" })
  await expect(page.getByRole("status").filter({ hasText: /New account registration is temporarily paused/i })).toBeVisible()
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeDisabled()
  await expect(page.getByRole("button", { name: "Create account with email" })).toBeDisabled()
  await expect(page.getByRole("link", { name: "Sign in instead" })).toHaveAttribute("href", /\/login\?callbackUrl=/)
  await expect(page.getByRole("link", { name: "Set or reset password" })).toHaveAttribute("href", "/forgot-password")

  await page.goto("/pricing", { waitUntil: "domcontentloaded" })
  await expect(page.getByRole("status").filter({ hasText: /New Supporter checkout is temporarily paused/i })).toBeVisible()
  await expect(page.locator('form[action="/api/billing/checkout"]')).toHaveCount(0)
  await expect(page.locator('form[action="/api/billing/donation"]')).not.toHaveCount(0)
  expect(acquisitionRequests, "registration, Google, Stripe, and membership Checkout requests").toEqual([])
})

/** Sends a browser-native Chromium touch drag across an adaptive carousel viewport. */
async function swipeCarouselStage(
  page: Page,
  testId: "station-carousel-stage" | "background-carousel-stage",
  direction: "next" | "previous",
) {
  const stage = page.getByTestId(testId)
  const box = await stage.boundingBox()
  if (!box) throw new Error(`${testId} has no touch bounds`)

  const session = await page.context().newCDPSession(page)
  const y = box.y + box.height * 0.25
  const startX = box.x + box.width * 0.5
  const endX = box.x + box.width * (direction === "next" ? 0.1 : 0.9)
  const touchPoint = (x: number) => ({
    x,
    y,
    id: 1,
    radiusX: 4,
    radiusY: 4,
    force: 1,
  })

  try {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [touchPoint(startX)],
    })
    for (let step = 1; step <= 8; step += 1) {
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [touchPoint(startX + (endX - startX) * (step / 8))],
      })
    }
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    })
  } finally {
    await session.detach()
  }
}

/** Drags an adaptive carousel with the desktop pointer across the same bounds. */
async function dragCarouselStageWithMouse(
  page: Page,
  testId: "station-carousel-stage" | "background-carousel-stage",
  direction: "next" | "previous",
) {
  const box = await page.getByTestId(testId).boundingBox()
  if (!box) throw new Error("Adaptive carousel stage has no mouse-drag bounds")
  const y = box.y + box.height * 0.25
  const startX = box.x + box.width * 0.5
  const endX = box.x + box.width * (direction === "next" ? 0.1 : 0.9)
  await page.mouse.move(startX, y)
  await page.mouse.down()
  await page.mouse.move(endX, y, { steps: 8 })
  await page.mouse.up()
}

/** Clicks the visible portion of a side preview through the browser input path. */
async function clickVisibleCarouselSideCard(
  page: Page,
  stage: Locator,
  sideCard: Locator,
) {
  const [stageBox, cardBox] = await Promise.all([stage.boundingBox(), sideCard.boundingBox()])
  if (!stageBox || !cardBox) throw new Error("Carousel side card has no visible bounds")
  const left = Math.max(stageBox.x, cardBox.x)
  const right = Math.min(stageBox.x + stageBox.width, cardBox.x + cardBox.width)
  const top = Math.max(stageBox.y, cardBox.y)
  const bottom = Math.min(stageBox.y + stageBox.height, cardBox.y + cardBox.height)
  if (right <= left || bottom <= top) throw new Error("Carousel side card is outside the stage")
  await page.mouse.click((left + right) / 2, (top + bottom) / 2)
}

/** Waits for Embla's track transform to remain unchanged across three frames. */
async function waitForCarouselMotionToSettle(
  page: Page,
  testId: "station-carousel-stage" | "background-carousel-stage",
) {
  await page.getByTestId(testId).evaluate(async (stage) => {
    const track = stage.firstElementChild
    if (!(track instanceof HTMLElement)) throw new Error("Adaptive carousel track is missing")
    let previous: number | null = null
    let stableFrames = 0
    for (let frame = 0; frame < 120; frame += 1) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      const transform = getComputedStyle(track).transform
      const current = transform === "none" ? 0 : new DOMMatrixReadOnly(transform).m41
      stableFrames = previous !== null && Math.abs(current - previous) <= 0.05
        ? stableFrames + 1
        : 0
      previous = current
      if (stableFrames >= 3) return
    }
    throw new Error("Adaptive carousel track did not settle within 120 frames")
  })
}

const loopbackHostnames = new Set(["localhost", "0.0.0.0", "[::1]"])

/** Matches only a complete dotted-decimal IPv4 address inside 127.0.0.0/8. */
function isIpv4LoopbackHostname(hostname: string) {
  const octets = hostname.split(".")
  return octets.length === 4
    && octets[0] === "127"
    && octets.every((octet) => /^(?:0|[1-9]\d{0,2})$/.test(octet) && Number(octet) <= 255)
}

function isLocalHttpUrl(urlString: string, configuredHostname: string) {
  try {
    const url = new URL(urlString)
    return isIpv4LoopbackHostname(url.hostname)
      || loopbackHostnames.has(url.hostname)
      || url.hostname === configuredHostname
  } catch {
    return false
  }
}

function isExternalHttpUrl(urlString: string, configuredHostname: string) {
  try {
    const url = new URL(urlString)
    return ["http:", "https:"].includes(url.protocol) && !isLocalHttpUrl(urlString, configuredHostname)
  } catch {
    return false
  }
}

function registerAllowedExternalUrls(page: Page, allowedExternalUrls: ReadonlySet<string>) {
  const networkGuard = getPublicNetworkGuard(page)
  for (const url of allowedExternalUrls) {
    if (!isExternalHttpUrl(url, networkGuard.localHostname)) {
      throw new Error(`Public external allowlist contains a non-external URL: ${url}`)
    }
    networkGuard.allowedExternalUrls.add(url)
  }
}

/** Registers health listeners and returns live arrays that collect the journey's later events. */
async function capturePageHealth(page: Page, allowedExternalUrls: ReadonlySet<string>) {
  const consoleErrors: string[] = []
  const failedExternalRequests: string[] = []
  const pageErrors: string[] = []
  const failedLocalResponses: string[] = []
  const forbiddenRequests: string[] = []
  const networkGuard = getPublicNetworkGuard(page)
  registerAllowedExternalUrls(page, allowedExternalUrls)

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text())
    }
  })

  page.on("pageerror", (error) => {
    pageErrors.push(error.message)
  })

  page.on("request", (request) => {
    const url = new URL(request.url())
    if (forbiddenAnonymousEndpoints.includes(url.pathname as typeof forbiddenAnonymousEndpoints[number])) {
      forbiddenRequests.push(`${request.method()} ${url.pathname}`)
    }
  })

  page.on("requestfailed", (request) => {
    if (!isExternalHttpUrl(request.url(), networkGuard.localHostname)) return
    const failureText = request.failure()?.errorText ?? "unknown failure"
    if (failureText === "net::ERR_ABORTED" && networkGuard.ownedPreviewFixtureRequests.has(request)) {
      networkGuard.ownedPreviewCancellations.push(`${request.method()} ${request.url()}`)
      return
    }
    failedExternalRequests.push(`${failureText} ${request.url()}`)
  })

  page.on("response", (response) => {
    if (response.status() >= 400 && isLocalHttpUrl(response.url(), networkGuard.localHostname)) {
      failedLocalResponses.push(formatResponse(response))
    }
  })

  return {
    consoleErrors,
    failedExternalRequests,
    failedLocalResponses,
    forbiddenRequests,
    ownedPreviewCancellations: networkGuard.ownedPreviewCancellations,
    pageErrors,
    unexpectedExternalRequests: networkGuard.unexpectedExternalRequests,
  }
}

test("public network classification keeps locality exact to loopback and the configured host", async ({ baseURL, page }) => {
  if (!baseURL) throw new Error("Public network classification requires the configured Browser-QA base URL")
  const configuredHostname = new URL(baseURL).hostname
  const configuredUrl = new URL("/browser-qa-local-classification", baseURL).toString()

  for (const localUrl of [
    "http://localhost:3010/local",
    "http://127.0.0.0:3010/local",
    "http://127.0.0.1:3010/local",
    "http://127.0.0.2:3010/local",
    "http://127.255.255.255:3010/local",
    "http://0.0.0.0:3010/local",
    "http://[::1]:3010/local",
    configuredUrl,
  ]) {
    expect(isLocalHttpUrl(localUrl, configuredHostname), localUrl).toBe(true)
    expect(isExternalHttpUrl(localUrl, configuredHostname), localUrl).toBe(false)
  }

  for (const externalUrl of [
    "http://126.255.255.255:3010/not-loopback",
    "http://128.0.0.0:3010/not-loopback",
    "http://127.0.0.1.evil.invalid/not-loopback",
  ]) {
    expect(isLocalHttpUrl(externalUrl, configuredHostname), externalUrl).toBe(false)
    expect(isExternalHttpUrl(externalUrl, configuredHostname), externalUrl).toBe(true)
  }

  const invalidLoopbackUrl = "http://127.0.0.999/invalid"
  expect(isLocalHttpUrl(invalidLoopbackUrl, configuredHostname), invalidLoopbackUrl).toBe(false)
  expect(isExternalHttpUrl(invalidLoopbackUrl, configuredHostname), invalidLoopbackUrl).toBe(false)

  const configuredLanHostname = "192.168.50.20"
  expect(isLocalHttpUrl(`http://${configuredLanHostname}:3010/local`, configuredLanHostname)).toBe(true)
  expect(isLocalHttpUrl("http://192.168.50.21:3010/private", configuredLanHostname)).toBe(false)
  expect(isExternalHttpUrl("http://192.168.50.21:3010/private", configuredLanHostname)).toBe(true)

  for (const nonHttpUrl of [
    "blob:https://external.browser-qa.invalid/non-http",
    "data:text/plain,non-http",
  ]) {
    expect(isExternalHttpUrl(nonHttpUrl, configuredHostname), nonHttpUrl).toBe(false)
  }

  for (const invalidUrl of ["/relative", "https://["]) {
    expect(
      () => registerAllowedExternalUrls(page, new Set([invalidUrl])),
      invalidUrl,
    ).toThrow(`Public external allowlist contains a non-external URL: ${invalidUrl}`)
  }
})

test("every public journey blocks and records an unexpected successful external resource", async ({ context, page }) => {
  const unexpectedExternalUrl = "https://unexpected.browser-qa.invalid/public-route-probe.js"
  let successfulFixtureRequests = 0
  await context.route(unexpectedExternalUrl, async (route) => {
    successfulFixtureRequests += 1
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      headers: { "access-control-allow-origin": "*" },
      body: "window.__unexpectedPublicRouteProbe = true",
    })
  })
  const networkGuard = getPublicNetworkGuard(page)

  await page.goto("/about", { waitUntil: "domcontentloaded" })
  const requestResult = await page.evaluate(async (url) => {
    try {
      const response = await fetch(url)
      return { kind: "fulfilled", status: response.status }
    } catch {
      return { kind: "rejected" }
    }
  }, unexpectedExternalUrl)

  expect.soft(requestResult, "unexpected request result").toEqual({ kind: "rejected" })
  expect.soft(successfulFixtureRequests, "unexpected 2xx fixture requests").toBe(0)
  expect.soft(networkGuard.unexpectedExternalRequests, "unexpected external requests").toEqual([
    `GET ${unexpectedExternalUrl}`,
  ])
  // The expected probe receipt was asserted above; consume it so the fixture's final guard covers later requests.
  networkGuard.unexpectedExternalRequests.length = 0
})

test("an exact allowlisted preview canceled by its media lifecycle is not an external failure", async ({ page }) => {
  const canceledPreviewUrl = chimerPreviewUrl("intentional-cancel")
  const nonOwnedAbortUrl = chimerPreviewUrl("non-owned-abort")
  const health = await capturePageHealth(page, new Set([canceledPreviewUrl, nonOwnedAbortUrl]))
  let announceFixtureStarted!: () => void
  let releaseFixture!: () => void
  const fixtureStarted = new Promise<void>((resolve) => {
    announceFixtureStarted = resolve
  })
  const fixtureGate = new Promise<void>((resolve) => {
    releaseFixture = resolve
  })
  let fixtureFinished = false
  await installChimerPreviewRoute(page, canceledPreviewUrl, async (route) => {
    announceFixtureStarted()
    await fixtureGate
    try {
      await route.fulfill({ status: 204, contentType: "video/webm", body: "" })
    } catch (error) {
      if (!isHeldRouteTeardownCancellation(error)) throw error
    } finally {
      fixtureFinished = true
    }
  })
  await page.route(nonOwnedAbortUrl, async (route) => {
    await route.abort("aborted")
  })

  await page.goto("/about", { waitUntil: "domcontentloaded" })
  const canceledRequestPromise = page.waitForEvent("requestfailed", {
    predicate: (request) => request.url() === canceledPreviewUrl,
  })
  await page.evaluate((url) => {
    const preview = document.createElement("video")
    preview.dataset.browserQaCanceledPreview = "true"
    preview.preload = "auto"
    preview.src = url
    document.body.append(preview)
    preview.load()
  }, canceledPreviewUrl)

  await fixtureStarted
  const teardownNavigation = page.goto("about:blank", { waitUntil: "domcontentloaded" })
  const canceledRequest = await canceledRequestPromise
  releaseFixture()
  await teardownNavigation
  await expect.poll(() => fixtureFinished, "exact preview fixture completion").toBe(true)
  expect(canceledRequest.failure()?.errorText, "browser media cancellation").toBe("net::ERR_ABORTED")

  await page.goto("/about", { waitUntil: "domcontentloaded" })

  const nonOwnedRequestPromise = page.waitForEvent("requestfailed", {
    predicate: (request) => request.url() === nonOwnedAbortUrl,
  })
  const nonOwnedRequestResult = await page.evaluate(async (url) => {
    try {
      await fetch(url)
      return "fulfilled"
    } catch {
      return "rejected"
    }
  }, nonOwnedAbortUrl)
  const nonOwnedRequest = await nonOwnedRequestPromise
  expect(nonOwnedRequestResult, "non-owned request result").toBe("rejected")
  expect(nonOwnedRequest.failure()?.errorText, "non-owned network abort").toBe("net::ERR_ABORTED")
  expect(health.failedExternalRequests, "failed external requests").toEqual([
    `net::ERR_ABORTED ${nonOwnedAbortUrl}`,
  ])
  expect(health.ownedPreviewCancellations, "owned preview cancellation receipt").toEqual([
    `GET ${canceledPreviewUrl}`,
  ])
})

function requireAllowedExternalFixture(
  allowedExternalUrls: ReadonlySet<string>,
  url: string,
) {
  if (!allowedExternalUrls.has(url)) {
    throw new Error(`External fixture URL is missing from this journey's allowlist: ${url}`)
  }
}

/** Serves the one externally hosted display font from a deterministic repository-owned fixture. */
async function installExternalFontFixture(page: Page, allowedExternalUrls: ReadonlySet<string>) {
  registerAllowedExternalUrls(page, allowedExternalUrls)
  requireAllowedExternalFixture(allowedExternalUrls, externalFontUrl)
  await page.route(externalFontUrl, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "font/woff2",
      body: await readFile(new URL("../fixtures/browser-external-font.woff2", import.meta.url)),
    })
  })
}

/** Marks the exact Request owned by a preview fixture before browser media teardown can cancel it. */
async function installChimerPreviewRoute(
  page: Page,
  url: string,
  handleRoute: (route: Route) => Promise<void>,
) {
  await page.route(url, async (route) => {
    getPublicNetworkGuard(page).ownedPreviewFixtureRequests.add(route.request())
    await handleRoute(route)
  })
}

/** Fulfills only the named Chimer preview requests; other external media remains visible to health checks. */
async function installChimerPreviewFixtures(
  page: Page,
  names: string[],
  allowedExternalUrls: ReadonlySet<string>,
) {
  registerAllowedExternalUrls(page, allowedExternalUrls)
  for (const name of names) {
    const url = chimerPreviewUrl(name)
    requireAllowedExternalFixture(allowedExternalUrls, url)
    await installChimerPreviewRoute(page, url, async (route) => {
      await route.fulfill({ status: 204, contentType: "video/webm", body: "" })
    })
  }
}

/**
 * Installs deterministic Atmosphere network fixtures for public browser journeys.
 * @param page Page whose external Atmosphere requests the fixtures intercept.
 * @param allowedExternalUrls Explicit external-request allowlist shared with health checks.
 * @param playbackPieceIds Pieces that need playable sample payloads; each piece must have an allowlisted sample-index fixture.
 * @param sampleIndexFixtureUrls Sample-index URLs to fulfill, or the full catalog by default.
 * @returns A `hitCount(url)` API reporting how often each fixture ran.
 */
async function installAtmosphereFixtures(
  page: Page,
  allowedExternalUrls: ReadonlySet<string>,
  playbackPieceIds: Array<"observable-streams" | "last-transit" | "peace" | "trees"> = [],
  sampleIndexFixtureUrls: readonly string[] = atmosphereSampleIndexFixtureUrls,
) {
  registerAllowedExternalUrls(page, allowedExternalUrls)
  const fixtureHits = new Map<string, number>()
  const recordHit = (url: string) => fixtureHits.set(url, (fixtureHits.get(url) ?? 0) + 1)
  const playbackIndexes: Record<string, Record<string, Record<string, string> | string[]>> = {
    "observable-streams": {
      "observable-streams__sso-cor-anglais": buildChromaticNoteFixture(deterministicAtmospherePayloadUrls.observableCorAnglais),
      "observable-streams__vsco2-piano-mf": buildChromaticNoteFixture(deterministicAtmospherePayloadUrls.observablePiano),
      "observable-streams__vsco2-violin-arcvib": buildChromaticNoteFixture(deterministicAtmospherePayloadUrls.observableViolin),
    },
    "last-transit": {
      "last-transit__idling-truck": [deterministicAtmospherePayloadUrls.lastTransitTruck],
    },
    peace: {
      "peace__native-american-flute-susvib": buildChromaticNoteFixture(deterministicAtmospherePayloadUrls.peaceFlute),
    },
    trees: {
      "trees__vsco2-piano-mf": buildChromaticNoteFixture(deterministicAtmospherePayloadUrls.treesPiano),
    },
  }
  // Prewarm-only journeys deliberately fixture the smaller initial catalog.
  const sampleIndexUrls = new Set(sampleIndexFixtureUrls)

  for (const pieceId of playbackPieceIds) {
    if (!sampleIndexUrls.has(atmosphereSampleIndexUrl(pieceId))) {
      throw new Error(`Atmosphere playback piece has no sample-index fixture: ${pieceId}`)
    }
  }

  for (const url of sampleIndexUrls) {
    requireAllowedExternalFixture(allowedExternalUrls, url)
    const pieceId = playbackPieceIds.find((candidate) => atmosphereSampleIndexUrl(candidate) === url)
    await page.route(url, async (route) => {
      recordHit(url)
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(pieceId ? playbackIndexes[pieceId] : {}),
      })
    })
  }

  const playbackPayloadUrls = [...new Set(playbackPieceIds.flatMap((pieceId) => (
    Object.values(playbackIndexes[pieceId]).flatMap((payloads) => (
      Array.isArray(payloads) ? payloads : Object.values(payloads)
    ))
  )))]
  const externalPlaybackPayloadUrls = playbackPayloadUrls.filter((url) => !url.startsWith("/"))
  if (externalPlaybackPayloadUrls.length > 0) {
    const playbackPayloadBody = await readFile(
      new URL("../../public/audio/atmosphere/media-session-carrier.mp3", import.meta.url),
    )
    for (const url of externalPlaybackPayloadUrls) {
      requireAllowedExternalFixture(allowedExternalUrls, url)
      await page.route(url, async (route) => {
        recordHit(url)
        await route.fulfill({
          status: 200,
          contentType: "audio/mpeg",
          body: playbackPayloadBody,
        })
      })
    }
  }

  return {
    hitCount: (url: string) => fixtureHits.get(url) ?? 0,
  }
}

async function setPressedButton(page: Page, name: RegExp, selected: boolean) {
  const button = page.getByRole("button", { name }).first()
  await expect(button).toBeVisible()
  const isPressed = (await button.getAttribute("aria-pressed")) === "true"
  if (isPressed !== selected) await button.click()
}

async function ensureSetupSectionOpen(page: Page, sectionName: RegExp, targetButtonName: RegExp) {
  const targetButton = page.getByRole("button", { name: targetButtonName }).first()
  if (await targetButton.isVisible().catch(() => false)) return

  const sectionButton = page.getByRole("button", { name: sectionName }).first()
  if (await sectionButton.count() > 0) {
    await expect(sectionButton).toBeVisible()
    const isExpanded = (await sectionButton.getAttribute("aria-expanded")) === "true"
    if (!isExpanded) await sectionButton.click()
  }

  await expect(targetButton).toBeVisible()
}

async function setMuscleUpperExtremityFilters(page: Page) {
  await ensureSetupSectionOpen(page, /^Category\b/i, /^Muscles\b/i)
  await setPressedButton(page, /^Muscles\b/i, true)
  for (const category of [/^Bones\b/i, /^Bone Landmarks\b/i, /^Structures\b/i, /^Concepts\b/i]) {
    await setPressedButton(page, category, false)
  }

  await ensureSetupSectionOpen(page, /^Region\b/i, /^Upper Extremity\b/i)
  await setPressedButton(page, /^Upper Extremity\b/i, true)
  for (const region of [/^Head\b/i, /^Spine\b/i, /^Thorax\b/i, /^Abdomen\b/i, /^Pelvis\b/i, /^Lower Extremity\b/i]) {
    await setPressedButton(page, region, false)
  }
}

async function waitForFilteredEligibleCount(page: Page) {
  await expect(page.getByRole("button", { name: /Start [1-9]\d*/ })).toBeEnabled({ timeout: 30_000 })
}

/**
 * Opens the bottom-bar quick-action dial and verifies it is visually anchored above the + trigger
 * with the expected blurred backdrop.
 */
async function openQuickActionsAboveTrigger(page: Page, quickCreate: Locator) {
  const triggerBox = await quickCreate.boundingBox()
  expect(triggerBox, "quick-create trigger box").not.toBeNull()

  await quickCreate.click()

  const quickActions = page.getByRole("navigation", { name: /^Quick create actions$/i })
  await expect(quickActions).toBeVisible()
  const quickActionsBox = await page.getByRole("dialog", { name: /^Quick actions$/i }).boundingBox()
  expect(quickActionsBox, "quick-action menu box").not.toBeNull()

  if (triggerBox && quickActionsBox) {
    expect(quickActionsBox.y + quickActionsBox.height).toBeLessThanOrEqual(triggerBox.y - 8)
  }

  const backdropFilter = await page.locator(".ml-quick-action-layer").evaluate((element) => {
    const styles = window.getComputedStyle(element)
    return styles.getPropertyValue("backdrop-filter") || styles.getPropertyValue("-webkit-backdrop-filter")
  })
  expect(backdropFilter).toContain("blur")

  return quickActions
}

for (const route of publicRoutes) {
  test(`anonymous public route ${route.path} renders without browser regressions`, async ({ page }) => {
    const ownsAtmospherePrewarm = route.path === "/browse" || route.path === "/music"
    const allowedExternalUrls = new Set<string>([
      ...(route.path === "/chimer" || route.path === "/clock" ? [externalFontUrl] : []),
      ...(ownsAtmospherePrewarm ? initialAtmosphereSampleIndexUrls : []),
    ])
    const health = await capturePageHealth(page, allowedExternalUrls)
    if (route.path === "/chimer" || route.path === "/clock") {
      await installExternalFontFixture(page, allowedExternalUrls)
    }
    if (ownsAtmospherePrewarm) {
      await installAtmosphereFixtures(page, allowedExternalUrls, [], initialAtmosphereSampleIndexUrls)
    }

    await page.goto(route.path, { waitUntil: "domcontentloaded" })
    if (route.path === "/notes" || route.path === "/notes/soap") {
      // Check the complete access label rather than accepting a longer, misleading message.
      await expect(page.getByText("Documentation access required", { exact: true }).first()).toBeVisible()
    } else {
      await expect(page.locator("body")).toContainText(route.expectedText)
    }
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => undefined)
    await page.waitForTimeout(250)

    expect(health.pageErrors, "uncaught page errors").toEqual([])
    expect(health.failedExternalRequests, "failed external requests").toEqual([])
    expect(health.unexpectedExternalRequests, "unexpected external requests").toEqual([])
    expect(health.consoleErrors, "browser console errors").toEqual([])
    expect(health.failedLocalResponses, "local 4xx/5xx responses").toEqual([])
    expect(health.forbiddenRequests, "anonymous account sync requests").toEqual([])
  })
}

test("core public tool surfaces keep shell spacing and visible primary content", async ({ page }) => {
  const health = await capturePageHealth(page, new Set())

  await page.setViewportSize({ width: 390, height: 844 })
  for (const path of ["/", "/tools", "/education", "/notes", "/wellness", "/music"]) {
    if (path === "/music") {
      const allowedExternalUrls = new Set(initialAtmosphereSampleIndexUrls)
      await installAtmosphereFixtures(page, allowedExternalUrls, [], initialAtmosphereSampleIndexUrls)
    }
    await page.goto(path, { waitUntil: "domcontentloaded" })
    await expect(page.getByRole("navigation", { name: /^AtmoShaper main navigation$/i })).toBeVisible()
    await expect(page.locator(".ml-app-content")).toBeVisible()
    const contentBox = await page.locator(".ml-app-content").boundingBox()
    expect(contentBox?.height ?? 0).toBeGreaterThan(240)
  }

  expect(health.pageErrors, "uncaught page errors").toEqual([])
  expect(health.unexpectedExternalRequests, "unexpected external requests").toEqual([])
  expect(health.consoleErrors, "browser console errors").toEqual([])
  expect(health.failedLocalResponses, "local 4xx/5xx responses").toEqual([])
  expect(health.forbiddenRequests, "anonymous account sync requests").toEqual([])
})

test("active app-tool metal ring keeps valid SVG geometry when its renderer collapses", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "The MetalFx collapse regression is covered once in Chromium.")
  const allowedExternalUrls = new Set(initialAtmosphereSampleIndexUrls)
  const health = await capturePageHealth(page, allowedExternalUrls)
  await installAtmosphereFixtures(page, allowedExternalUrls, [], initialAtmosphereSampleIndexUrls)

  await page.setViewportSize({ width: 1024, height: 720 })
  await page.goto("/music", { waitUntil: "domcontentloaded" })

  const activeLink = page.getByRole("link", { name: /^Open music$/i }).filter({ visible: true })
  const probe = activeLink.locator(
    "xpath=ancestor::span[contains(concat(' ', normalize-space(@class), ' '), ' ml-app-tool-link-active-ring-probe ')][1]",
  )
  const metalRoot = probe.locator(":scope > .metal-fx-root")
  await expect(metalRoot).toBeVisible()

  const probeBox = await probe.boundingBox()
  expect(probeBox?.width ?? 0, "active app-tool ring probe width").toBeGreaterThanOrEqual(3)
  expect(probeBox?.height ?? 0, "active app-tool ring probe height").toBeGreaterThanOrEqual(3)

  await probe.evaluate((element, bounds) => {
    const probeElement = element as HTMLElement
    probeElement.style.setProperty("display", "inline-flex", "important")
    probeElement.style.setProperty("width", `${bounds.width}px`, "important")
    probeElement.style.setProperty("height", `${bounds.height}px`, "important")
  }, probeBox!)
  await metalRoot.evaluate((element) => {
    const root = element as HTMLElement
    root.style.setProperty("box-sizing", "border-box", "important")
    root.style.setProperty("flex", "0 0 0px", "important")
    root.style.setProperty("min-width", "0", "important")
    root.style.setProperty("min-height", "0", "important")
    root.style.setProperty("width", "0", "important")
    root.style.setProperty("height", "0", "important")
    root.style.setProperty("padding", "0", "important")
  })
  await expect.poll(async () => metalRoot.evaluate((element) => {
    const bounds = element.getBoundingClientRect()
    return { height: bounds.height, width: bounds.width }
  })).toEqual({ height: 0, width: 0 })
  await page.evaluate(async () => {
    for (let frame = 0; frame < 6; frame += 1) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    }
  })

  const invalidRects = metalRoot.locator('rect[width^="-"], rect[height^="-"]')
  await expect(invalidRects, "MetalFx SVG rectangles with negative dimensions").toHaveCount(0)
  expect(health.pageErrors, "uncaught page errors").toEqual([])
  expect(health.unexpectedExternalRequests, "unexpected external requests").toEqual([])
  expect(health.consoleErrors, "browser console errors").toEqual([])
  expect(health.failedLocalResponses, "local 4xx/5xx responses").toEqual([])
  expect(health.forbiddenRequests, "anonymous account sync requests").toEqual([])
})

test("main bar exposes brand music clock quick create theme calendar and more controls", async ({ page }) => {
  const allowedExternalUrls = new Set(initialAtmosphereSampleIndexUrls)
  const health = await capturePageHealth(page, allowedExternalUrls)
  await installAtmosphereFixtures(page, allowedExternalUrls, [], initialAtmosphereSampleIndexUrls)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => {
    // Seed the selected app-bar edge before settings hydrate on each route load.
    const appBarPosition = sessionStorage.getItem("qa-app-bar-position") ?? "bottom"
    localStorage.setItem(
      "massage-lab-settings",
      JSON.stringify({
        appBarPosition,
        sidebarPosition: "left",
        sidebarTriggerPosition: "bottom",
        themeMode: "dark",
      }),
    )
  })
  await page.goto("/music", { waitUntil: "domcontentloaded" })

  await expect(page.getByRole("navigation", { name: /^AtmoShaper main navigation$/i })).toBeVisible()
  await expect(page.getByRole("link", { name: "AtmoShaper home" })).toHaveAttribute("href", "/")
  await expect(page.getByRole("link", { name: /^Open music$/i })).toHaveAttribute("href", "/music")
  await expect(page.getByRole("link", { name: /^Open clock$/i })).toHaveAttribute("href", "/clock")
  // Poll through the active-link ring handoff and require a fully painted SVG.
  const expectToolIconsToPaint = async () => {
    for (const label of ["Open music", "Open clock", "Open calendar"]) {
      const icon = page.getByRole("link", { name: label }).locator("svg").first()
      await expect(icon, `${label} icon`).toHaveCount(1)
      await expect.poll(async () => icon.evaluate((element) => {
        const bounds = element.getBoundingClientRect()
        const styles = getComputedStyle(element)
        return bounds.width >= 16
          && bounds.height >= 16
          && Number.parseFloat(styles.opacity) > 0
          && styles.visibility === "visible"
          && styles.color !== "rgba(0, 0, 0, 0)"
          && styles.stroke !== "none"
      }), { message: `${label} icon paints at full size` }).toBe(true)
    }
  }
  await expectToolIconsToPaint()
  const quickCreate = page.getByRole("button", { name: /^Open quick actions$/i })
  await expect(quickCreate).toBeVisible()
  const quickCreateBox = await quickCreate.boundingBox()
  expect(quickCreateBox?.width ?? 0).toBeGreaterThanOrEqual(42)
  expect(quickCreateBox?.width ?? 0).toBeLessThanOrEqual(43)
  expect(quickCreateBox?.height ?? 0).toBeGreaterThanOrEqual(42)
  expect(quickCreateBox?.height ?? 0).toBeLessThanOrEqual(43)
  const quickCreateStyle = await quickCreate.evaluate((element) => {
    const styles = window.getComputedStyle(element)
    return {
      backgroundImage: styles.backgroundImage,
      boxShadow: styles.boxShadow,
    }
  })
  expect(quickCreateStyle.backgroundImage).toContain("gradient")
  expect(quickCreateStyle.boxShadow).not.toBe("none")
  await expect(page.getByRole("group", { name: /^Theme$/i })).toBeVisible()
  await expect(page.getByRole("link", { name: /^Open calendar$/i })).toHaveAttribute("href", "/calendar")
  await expect(page.getByRole("button", { name: /^Open navigation$/i })).toBeVisible()

  const mainBar = page.getByRole("navigation", { name: /^AtmoShaper main navigation$/i })
  await expect(mainBar.locator(".ml-main-bar-drawer-brand .ml-main-bar-button")).toHaveAccessibleName("Open navigation")
  await expect(mainBar.locator(".ml-main-bar-tools").getByRole("group", { name: /^Theme$/i })).toBeVisible()

  // Change the pre-hydration seed so the reload exercises the opposite edge.
  await page.evaluate(() => sessionStorage.setItem("qa-app-bar-position", "top"))
  await page.reload({ waitUntil: "domcontentloaded" })
  await expect(mainBar).toHaveAttribute("data-app-bar-position", "top")
  await expectToolIconsToPaint()

  expect(health.pageErrors, "uncaught page errors").toEqual([])
  expect(health.unexpectedExternalRequests, "unexpected external requests").toEqual([])
  expect(health.consoleErrors, "browser console errors").toEqual([])
  expect(health.failedLocalResponses, "local 4xx/5xx responses").toEqual([])
  expect(health.forbiddenRequests, "anonymous account sync requests").toEqual([])
})

test("main bar edge control stays aligned with the compact sidebar rail", async ({ page }) => {
  const health = await capturePageHealth(page, new Set())

  await page.setViewportSize({ width: 686, height: 682 })
  await page.addInitScript(() => {
    localStorage.setItem(
      "massage-lab-settings",
      JSON.stringify({
        appBarPosition: "bottom",
        sidebarPosition: "left",
        sidebarTriggerPosition: "bottom",
        themeMode: "dark",
      }),
    )
  })
  await page.goto("/", { waitUntil: "domcontentloaded" })

  const openNavigation = page.getByRole("button", { name: /^Open navigation$/i })
  await expect(openNavigation).toBeVisible()
  const [openNavigationBox, sidebarFrameBox] = await Promise.all([
    openNavigation.boundingBox(),
    page.locator(".ml-app-sidebar-frame").boundingBox(),
  ])
  expect(openNavigationBox, "main-bar drawer control box").not.toBeNull()
  expect(sidebarFrameBox, "compact sidebar rail box").not.toBeNull()
  const drawerCenter = (openNavigationBox?.x ?? 0) + ((openNavigationBox?.width ?? 0) / 2)
  const railCenter = (sidebarFrameBox?.x ?? 0) + ((sidebarFrameBox?.width ?? 0) / 2)
  expect(Math.abs(drawerCenter - railCenter)).toBeLessThanOrEqual(1)

  expect(health.pageErrors, "uncaught page errors").toEqual([])
  expect(health.unexpectedExternalRequests, "unexpected external requests").toEqual([])
  expect(health.consoleErrors, "browser console errors").toEqual([])
  expect(health.failedLocalResponses, "local 4xx/5xx responses").toEqual([])
  expect(health.forbiddenRequests, "anonymous account sync requests").toEqual([])
})

test("top app bar quick actions open inside the viewport below the plus button", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Top app bar placement is covered by the desktop shell.")

  const allowedExternalUrls = new Set(initialAtmosphereSampleIndexUrls)
  const health = await capturePageHealth(page, allowedExternalUrls)
  await installAtmosphereFixtures(page, allowedExternalUrls, [], initialAtmosphereSampleIndexUrls)

  await page.setViewportSize({ width: 1024, height: 720 })
  await page.addInitScript(() => {
    localStorage.setItem(
      "massage-lab-settings",
      JSON.stringify({
        appBarPosition: "top",
        sidebarPosition: "left",
        sidebarTriggerPosition: "top",
        themeMode: "dark",
      }),
    )
  })
  await page.goto("/music", { waitUntil: "domcontentloaded" })
  await expect(page.locator(".ml-app-shell")).toHaveAttribute("data-app-bar-position", "top")

  const quickCreate = page.getByRole("button", { name: /^Open quick actions$/i })
  await expect(quickCreate).toBeVisible()
  const triggerBox = await quickCreate.boundingBox()
  expect(triggerBox, "top-bar quick-create trigger box").not.toBeNull()

  await quickCreate.click()

  const quickActions = page.getByRole("navigation", { name: /^Quick create actions$/i })
  await expect(quickActions).toBeVisible()
  const quickActionsBox = await page.getByRole("dialog", { name: /^Quick actions$/i }).boundingBox()
  expect(quickActionsBox, "top-bar quick-action menu box").not.toBeNull()

  if (triggerBox && quickActionsBox) {
    expect(quickActionsBox.y).toBeGreaterThanOrEqual(triggerBox.y + triggerBox.height + 8)
    expect(quickActionsBox.y + quickActionsBox.height).toBeLessThanOrEqual(720)
  }

  expect(health.pageErrors, "uncaught page errors").toEqual([])
  expect(health.unexpectedExternalRequests, "unexpected external requests").toEqual([])
  expect(health.consoleErrors, "browser console errors").toEqual([])
  expect(health.failedLocalResponses, "local 4xx/5xx responses").toEqual([])
  expect(health.forbiddenRequests, "anonymous account sync requests").toEqual([])
})

test("mobile quick-create button opens a vertical speed dial", async ({ page }) => {
  const health = await capturePageHealth(page, new Set())

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/", { waitUntil: "domcontentloaded" })
  const quickCreate = page.getByRole("button", { name: /^Open quick actions$/i })
  await expect(quickCreate).toBeVisible()

  const quickActions = await openQuickActionsAboveTrigger(page, quickCreate)
  await expect(quickActions.getByRole("link", { name: /^Log In$/i })).toHaveAttribute("href", "/login")
  await expect(quickActions.getByRole("link", { name: /^Create Account$/i })).toHaveAttribute("href", "/register")
  await expect(quickActions.getByRole("link", { name: /^Quick Log$/i })).toHaveAttribute("href", "/wellness#quick-log")
  await expect(quickActions.getByRole("link", { name: /^Breathing Guide$/i })).toHaveAttribute("href", "/wellness/breathing")

  const quickActionsBox = await page.getByRole("dialog", { name: /^Quick actions$/i }).boundingBox()
  expect(quickActionsBox, "quick-action menu box before outside dismissal").not.toBeNull()
  if (quickActionsBox) {
    await page.mouse.click(4, 4)
  }
  await expect(quickActions).toHaveCount(0)

  expect(health.pageErrors, "uncaught page errors").toEqual([])
  expect(health.unexpectedExternalRequests, "unexpected external requests").toEqual([])
  expect(health.consoleErrors, "browser console errors").toEqual([])
  expect(health.failedLocalResponses, "local 4xx/5xx responses").toEqual([])
  expect(health.forbiddenRequests, "anonymous account sync requests").toEqual([])
})

test("Chimer keeps the mobile main bar and opens quick actions above the plus button", async ({ page }) => {
  const previewNames = [
    "massage-lab-hole-vertical",
    "massage-lab-stars-vertical",
    "massage-lab-moving-gradient-vertical",
  ]
  const allowedExternalUrls = new Set([
    externalFontUrl,
    ...previewNames.map(chimerPreviewUrl),
  ])
  const health = await capturePageHealth(page, allowedExternalUrls)
  await installExternalFontFixture(page, allowedExternalUrls)
  await installChimerPreviewFixtures(page, previewNames, allowedExternalUrls)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/chimer", { waitUntil: "domcontentloaded" })

  const mainBar = page.getByRole("navigation", { name: /^AtmoShaper main navigation$/i })
  await expect(mainBar).toBeVisible()
  await expect(page.locator(".ml-app-shell")).toHaveAttribute("data-main-bar-visible", "true")
  await expect(page.getByTestId("app-moving-background")).toHaveCount(0)

  const quickCreate = page.getByRole("button", { name: /^Open quick actions$/i })
  await expect(quickCreate).toBeVisible()
  await openQuickActionsAboveTrigger(page, quickCreate)

  await page.keyboard.press("Escape")
  await expect(mainBar).toBeVisible()

  await page.getByRole("button", { name: /^Clock Mode$/i }).click()
  await expect(page.locator("body")).toHaveClass(/chimer-running/)
  await expect(mainBar).toBeHidden()
  await page.getByRole("button", { name: /^Close clock$/i }).click()
  await expect(page.locator("body")).not.toHaveClass(/chimer-running/)
  await expect(mainBar).toBeVisible()

  await page.getByRole("button", { name: /^Increase minutes$/i }).click()
  await page.getByRole("button", { name: /^Continue$/i }).click()
  await page.getByRole("button", { name: /^Continue$/i }).click()
  await page.getByRole("button", { name: /^Continue$/i }).click()
  await page.getByRole("button", { name: /^Continue$/i }).click()
  await page.getByRole("button", { name: /^Start Chimer$/i }).click()
  await expect(page.locator("body")).toHaveClass(/chimer-running/)
  await expect(mainBar).toBeHidden()
  await page.getByRole("button", { name: /^End timer$/i }).click()
  await expect(page.locator("body")).not.toHaveClass(/chimer-running/)
  await expect(mainBar).toBeVisible()

  await page.goto("/clock", { waitUntil: "domcontentloaded" })
  await expect(page.locator("body")).toHaveClass(/chimer-running/)
  await expect(page.getByRole("navigation", { name: /^AtmoShaper main navigation$/i })).toHaveCount(0)
  await page.getByRole("button", { name: /^Close clock$/i }).click()
  await expect(page.locator("body")).not.toHaveClass(/chimer-running/)
  const clockSetupMainBar = page.getByRole("navigation", { name: /^AtmoShaper main navigation$/i })
  await expect(clockSetupMainBar).toBeVisible()
  await expect(page.locator(".ml-app-shell")).toHaveAttribute("data-main-bar-visible", "true")

  expect(health.pageErrors, "uncaught page errors").toEqual([])
  expect(health.failedExternalRequests, "failed external requests").toEqual([])
  expect(health.unexpectedExternalRequests, "unexpected external requests").toEqual([])
  expect(health.consoleErrors, "browser console errors").toEqual([])
  expect(health.failedLocalResponses, "local 4xx/5xx responses").toEqual([])
  expect(health.forbiddenRequests, "anonymous account sync requests").toEqual([])
})

/** Checks nested scroll owners so app-contained overflow cannot hide behind body width. */
async function expectToolContentContained(page: Page) {
  await expect.poll(() => page.locator(".ml-app-content").evaluate((root) => [root, ...root.querySelectorAll("div, section, article, button, a, input, p, label, h1, h2")]
    // Text/date editors manage long values inside native controls. Their border
    // still must fit the app; simple numeric fields must also show their value.
    .filter((element) => !(element instanceof HTMLInputElement && element.type !== "number"))
    .filter((element) => element.clientWidth > 0 && element.getClientRects().length > 0 && element.scrollWidth > element.clientWidth + 1)
    .slice(0, 8).map((element) => ({ tag: element.tagName, id: element.id, width: element.clientWidth, viewport: innerWidth, overflow: element.scrollWidth - element.clientWidth, text: element.textContent?.slice(0, 40) })))).toEqual([])
  await expect.poll(() => page.locator(".ml-app-content").evaluate((root) => {
    const bounds = root.getBoundingClientRect()
    return [...root.querySelectorAll("input, select, textarea")].filter((input) => {
      if (!input.getClientRects().length) return false
      const box = input.getBoundingClientRect()
      return box.left < bounds.left - 1 || box.right > bounds.right + 1
    }).map((input) => input.id)
  })).toEqual([])
}

test("Business Planner launch responses migrate, persist and export a local PDF", async ({ page }, testInfo) => {
  const health = await capturePageHealth(page, new Set())
  const sample = plannerReportSample()
  sample.drafts.set(LAUNCH_CHECKLIST_STORAGE_KEY, JSON.stringify({ [LAUNCH_REPORT_QUESTIONS[0].key]: true }))
  await page.addInitScript((entries) => { for (const [key, value] of entries) if (localStorage.getItem(key) === null) localStorage.setItem(key, value) }, [...sample.drafts])
  await page.setViewportSize({ width: 390, height: 824 })
  await page.goto("/tools/business-planner/launch-checklist", { waitUntil: "domcontentloaded" })
  await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key) ?? "{}").schemaVersion === 2, LAUNCH_CHECKLIST_STORAGE_KEY)
  const first = LAUNCH_REPORT_QUESTIONS[0]
  const second = LAUNCH_REPORT_QUESTIONS[1]
  await expect(page.getByRole("checkbox", { name: first.item, exact: true })).toBeChecked()
  await page.getByLabel("Business name", { exact: true }).fill("Cedar Example Practice")
  await page.getByLabel("Prepared by (optional)", { exact: true }).fill("Renée Example")
  const answer = page.getByRole("textbox", { name: `${second.item} Response`, exact: true })
  await answer.fill("Keep a small practice and discuss the structure with a licensed attorney.")
  await expect(page.getByRole("checkbox", { name: second.item, exact: true })).not.toBeChecked()
  await page.waitForFunction(({ key, answerKey }) => JSON.parse(localStorage.getItem(key) ?? "{}").answers?.[answerKey]?.startsWith("Keep a small"), { key: LAUNCH_CHECKLIST_STORAGE_KEY, answerKey: second.key })
  await page.reload({ waitUntil: "domcontentloaded" })
  await expect(answer).toHaveValue("Keep a small practice and discuss the structure with a licensed attorney.")
  await expect(page.getByLabel("Business name", { exact: true })).toHaveValue("Cedar Example Practice")
  await page.getByRole("button", { name: "Reset checkmarks", exact: true }).click()
  await expect(page.getByRole("checkbox", { name: first.item, exact: true })).not.toBeChecked()
  await expect(answer).toHaveValue("Keep a small practice and discuss the structure with a licensed attorney.")
  await selectPlannerStep(page, 6)
  const report = page.locator("[data-planner-report]")
  await expect(report).toContainText("Cedar Example Practice")
  await expect(report).toContainText("Keep a small practice")
  await expect(report).toContainText("not legal, financial, tax or accounting advice")
  await expect(report).toContainText("licensed or credentialed professionals")
  await expect(report).toContainText("25 checklist tasks are not marked complete")
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download PDF report", exact: true }).click()])
  await download.saveAs(testInfo.outputPath("launch-report.pdf"))
  const bytes = await readFile(testInfo.outputPath("launch-report.pdf"))
  expect(bytes.subarray(0, 5).toString()).toBe("%PDF-")
  expect((await PDFDocument.load(bytes)).getPageCount()).toBeGreaterThan(1)
  for (const width of [320, 390, 780, 1280]) {
    await page.setViewportSize({ width, height: width === 780 ? 360 : 824 })
    for (const step of [0, 5, 6]) { await selectPlannerStep(page, step); await expectToolContentContained(page) }
  }
  await page.setViewportSize({ width: 320, height: 824 })
  await page.locator("html").evaluate((element) => { element.style.fontSize = "24px" })
  for (const step of [0, 6]) { await selectPlannerStep(page, step); await expectToolContentContained(page) }
  expect(health.pageErrors).toEqual([])
  expect(health.consoleErrors).toEqual([])
  expect(health.failedLocalResponses).toEqual([])
  expect(health.forbiddenRequests).toEqual([])
})

test("Business Planner outline reuses saved facts without overwriting narrative and prints only the report", async ({ page }, testInfo) => {
  const health = await capturePageHealth(page, new Set())
  const sample = plannerReportSample()
  sample.drafts.set(PLAN_OUTLINE_STORAGE_KEY, JSON.stringify({ mission: "My original mission wording.", finances: "Questions for my accountant and lender." }))
  await page.addInitScript((entries) => { for (const [key, value] of entries) if (localStorage.getItem(key) === null) localStorage.setItem(key, value) }, [...sample.drafts])
  await page.goto("/tools/business-planner/plan-outline", { waitUntil: "domcontentloaded" })
  const mission = page.getByLabel("Mission Statement notes", { exact: true })
  await expect(mission).toHaveValue("My original mission wording.")
  await selectPlannerStep(page, 4)
  const report = page.locator("[data-planner-report]")
  await expect(report).toContainText("EXAMPLE-ANSWER-22")
  await expect(report).toContainText("Service Menu - Therapeutic massage")
  await expect(report).toContainText("Questions for my accountant and lender.")
  await page.getByRole("checkbox", { name: /Business Income Planner/ }).uncheck()
  await expect(report).not.toContainText("Income Planner -")
  await page.getByRole("button", { name: "Refresh saved tools", exact: true }).click()
  await expect(report).not.toContainText("Income Planner -")
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download PDF report", exact: true }).click()])
  await download.saveAs(testInfo.outputPath("business-plan.pdf"))
  expect((await PDFDocument.load(await readFile(testInfo.outputPath("business-plan.pdf")))).getTitle()).toBe("Business Plan Working Draft")
  if (testInfo.project.name === "desktop-chromium") {
    await page.emulateMedia({ media: "print" })
    await expect(report).toBeVisible()
    await expect(page.getByRole("heading", { name: "Business Plan Outline", exact: true })).toBeHidden()
    await page.pdf({ path: testInfo.outputPath("printed-business-plan.pdf"), preferCSSPageSize: true, printBackground: true })
    expect((await PDFDocument.load(await readFile(testInfo.outputPath("printed-business-plan.pdf")))).getPageCount()).toBeGreaterThan(1)
    await page.emulateMedia({ media: null })
  }
  // Edit the actual source tool, then revisit: facts refresh while notes persist.
  await page.goto("/tools/business-planner/service-menu", { waitUntil: "domcontentloaded" })
  // The server-rendered input is visible before the device draft has hydrated.
  // Wait for the form's real readiness signal before exercising autosave.
  await expect(page.getByText("Saved on this device", { exact: true })).toBeVisible()
  await page.getByLabel("Price", { exact: true }).first().fill("123")
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("massagelab-business-planner-service-menu-v1") ?? "{}").services?.[0]?.price === 123)
  await page.goto("/tools/business-planner/plan-outline", { waitUntil: "domcontentloaded" })
  await expect(mission).toHaveValue("My original mission wording.")
  await selectPlannerStep(page, 4)
  await expect(report).toContainText("$123.00 per appointment")
  for (const width of [320, 390, 780, 1280]) { await page.setViewportSize({ width, height: 824 }); await expectToolContentContained(page) }
  await page.setViewportSize({ width: 320, height: 824 })
  await page.locator("html").evaluate((element) => { element.style.fontSize = "24px" })
  await expectToolContentContained(page)
  expect(health.pageErrors).toEqual([])
  expect(health.consoleErrors).toEqual([])
  expect(health.failedLocalResponses).toEqual([])
  expect(health.forbiddenRequests).toEqual([])
})

test("Business Planner PDF failure preserves the draft and offers print fallback", async ({ page }) => {
  const health = await capturePageHealth(page, new Set())
  await page.goto("/tools/business-planner/plan-outline", { waitUntil: "domcontentloaded" })
  await page.getByLabel("Mission Statement notes", { exact: true }).fill("Preserve this exact wording after export failure.")
  await selectPlannerStep(page, 4)
  await page.route("**/fonts/reports/NotoSans-Regular.ttf", (route) => route.fulfill({ status: 503, body: "Intentional test failure" }))
  await page.getByRole("button", { name: "Download PDF report", exact: true }).click()
  await expect(page.getByRole("status")).toContainText("Your draft is unchanged")
  await expect(page.getByRole("button", { name: "Print / save PDF", exact: true })).toBeEnabled()
  await selectPlannerStep(page, 0)
  await expect(page.getByLabel("Mission Statement notes", { exact: true })).toHaveValue("Preserve this exact wording after export failure.")
  expect(health.pageErrors).toEqual([])
  expect(health.failedLocalResponses).toEqual([expect.stringContaining("NotoSans-Regular.ttf")])
  expect(health.forbiddenRequests).toEqual([])
})

test("Business Planner hub presents all six compact tools on phones", async ({ page }, testInfo) => {
  const health = await capturePageHealth(page, new Set())
  await page.goto("/tools/business-planner", { waitUntil: "domcontentloaded" })
  const tools = page.getByRole("navigation", { name: "Business planner tools", exact: true }).getByRole("link")
  await expect(tools).toHaveCount(6)
  await expect(page.getByText("Live", { exact: true })).toHaveCount(0)
  for (const width of [320, 360, 390, 412, 780, 1280]) {
    await page.setViewportSize({ width, height: 824 })
    await expectToolContentContained(page)
    if (width <= 412) await expect(tools.last()).toBeInViewport({ ratio: 1 })
  }
  await page.setViewportSize({ width: 390, height: 824 })
  await page.screenshot({ path: testInfo.outputPath("business-planner-hub-phone.png") })
  const lightToggle = page.getByRole("button", { name: "Use light theme", exact: true })
  if (await lightToggle.isVisible()) await lightToggle.click()
  await expect(page.getByRole("button", { name: "Use dark theme", exact: true })).toBeVisible()
  await expect(page.locator("html")).toHaveClass(/light/)
  await expect(page.locator("html[data-theme-transition], html[data-theme-transition-fallback]")).toHaveCount(0)
  await expectToolContentContained(page)
  await page.screenshot({ path: testInfo.outputPath("business-planner-hub-light.png") })
  await page.getByRole("button", { name: "Use dark theme", exact: true }).click()
  await expect(page.locator("html")).toHaveClass(/dark/)
  await expect(page.locator("html[data-theme-transition], html[data-theme-transition-fallback]")).toHaveCount(0)
  await page.setViewportSize({ width: 320, height: 824 })
  await page.locator("html").evaluate((element) => { element.style.fontSize = "24px" })
  await expectToolContentContained(page)
  expect(health.pageErrors).toEqual([])
  expect(health.consoleErrors).toEqual([])
  expect(health.failedLocalResponses).toEqual([])
  expect(health.forbiddenRequests).toEqual([])
})

const guidedPlannerCases = [
  { slug: "income", key: "massagelab-business-income-planner-income-v1", label: "Desired yearly take-home", edit: "68123", editStep: 1, steps: 4 },
  { slug: "break-even", key: "massagelab-business-planner-break-even-v1", label: "Main service price", edit: "97", editStep: 0, steps: 4 },
  { slug: "service-menu", key: "massagelab-business-planner-service-menu-v1", label: "Service", edit: "Invented test service", editStep: 0, steps: 3 },
  { slug: "plan-outline", key: "massagelab-business-planner-plan-outline-v1", label: "Mission Statement notes", edit: "Invented practice mission for navigation", editStep: 0, steps: 5 },
  { slug: "launch-checklist", key: "massagelab-business-planner-launch-checklist-v1", label: null, edit: "", editStep: 0, steps: 7 },
] as const

for (const planner of guidedPlannerCases) {
  test(`Business Planner ${planner.slug} keeps drafts through steps and reload`, async ({ page }, testInfo) => {
    const health = await capturePageHealth(page, new Set())
    await page.setViewportSize({ width: 390, height: 824 })
    await page.goto(`/tools/business-planner/${planner.slug}`, { waitUntil: "domcontentloaded" })
    await page.waitForFunction((key) => localStorage.getItem(key) !== null, planner.key)
    await expect(page.locator("[data-planner-step]")).toHaveCount(planner.steps)
    const control = planner.label ? page.getByLabel(planner.label, { exact: true }).first() : page.getByRole("checkbox").first()
    await revealPlannerControl(page, control)
    if (planner.label) await control.fill(planner.edit)
    else await control.check()
    await page.waitForFunction(({ key, edit }) => {
      const raw = localStorage.getItem(key)
      return edit ? raw?.includes(edit) : Object.values(JSON.parse(raw ?? "{}")).some((value) => value === true)
    }, { key: planner.key, edit: planner.edit })
    const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), planner.key)
    let activeStep: number = planner.editStep
    for (const viewport of [{ width: 320, height: 824 }, { width: 780, height: 360 }, { width: 1280, height: 900 }]) {
      await page.setViewportSize(viewport)
      for (let index = 0; index < planner.steps; index += 1) {
        await selectPlannerStep(page, index)
        await expect(page.locator("[data-planner-step]:not([hidden])")).toHaveCount(1)
        // Reports have their own document title; focus belongs to the stage's
        // deliberately focusable heading, not a heading inside the preview.
        if (index !== activeStep) await expect(page.locator("[data-planner-step]").nth(index).locator('h2[tabindex="-1"]')).toBeFocused()
        activeStep = index
        await expectToolContentContained(page)
      }
    }
    await page.getByRole("button", { name: "Back", exact: true }).click()
    await expect(page.locator("[data-planner-stepper] nav select")).toHaveValue(String(planner.steps - 2))
    await page.getByRole("button", { name: "Continue", exact: true }).click()
    await expect(page.locator("[data-planner-stepper] nav select")).toHaveValue(String(planner.steps - 1))
    await selectPlannerStep(page, planner.editStep)
    if (planner.label) await expect(control).toHaveValue(planner.edit)
    else await expect(control).toBeChecked()
    // Merely visiting every step must not change a task, a value or a saved section.
    await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), planner.key)).toEqual(saved)
    await page.reload({ waitUntil: "domcontentloaded" })
    await page.waitForFunction((key) => localStorage.getItem(key) !== null, planner.key)
    await revealPlannerControl(page, control)
    if (planner.label) await expect(control).toHaveValue(planner.edit)
    else await expect(control).toBeChecked()
    await page.setViewportSize({ width: 320, height: 824 })
    await page.locator("html").evaluate((element) => { element.style.fontSize = "24px" })
    for (let index = 0; index < planner.steps; index += 1) {
      await selectPlannerStep(page, index)
      await expectToolContentContained(page)
    }
    await page.locator("html").evaluate((element) => { element.style.fontSize = "16px" })
    await page.setViewportSize({ width: 390, height: 824 })
    await selectPlannerStep(page, planner.editStep)
    await page.screenshot({ path: testInfo.outputPath(`${planner.slug}-step-phone.png`) })
    expect(health.pageErrors).toEqual([])
    expect(health.consoleErrors).toEqual([])
    expect(health.failedLocalResponses).toEqual([])
    expect(health.forbiddenRequests).toEqual([])
  })
}

test("Business Planner add-on profit keeps one live workspace with explicit units", async ({ page }, testInfo) => {
  const health = await capturePageHealth(page, new Set())
  await page.setViewportSize({ width: 390, height: 824 })
  await page.goto("/tools/business-planner/add-on-profit", { waitUntil: "domcontentloaded" })
  await page.waitForFunction(() => localStorage.getItem("massagelab-business-planner-add-on-profit-v1") !== null)
  await expect(page.locator("[data-planner-stepper]")).toHaveCount(0)
  await page.getByLabel("Name", { exact: true }).first().fill("Invented test product")
  await page.getByLabel("Cost per sale", { exact: true }).first().fill("4")
  await page.getByLabel("Price per sale", { exact: true }).first().fill("9")
  await page.getByLabel("Monthly sales", { exact: true }).first().fill("10")
  await expect(page.getByLabel("Cost per sale", { exact: true }).first()).toHaveAccessibleDescription(/US dollars/)
  await expect(page.getByText("Invented test product", { exact: true }).locator("..")).toContainText("$600.00 / year")
  const rows = page.getByLabel("Name", { exact: true })
  const originalRows = await rows.count()
  await page.getByRole("button", { name: "Add product", exact: true }).click()
  await expect(rows).toHaveCount(originalRows + 1)
  await page.getByRole("button", { name: "Remove Product or add-on", exact: true }).last().click()
  await expect(rows).toHaveCount(originalRows)
  for (const width of [320, 390, 780, 1280]) {
    await page.setViewportSize({ width, height: 824 })
    await expectToolContentContained(page)
  }
  await page.setViewportSize({ width: 390, height: 824 })
  await page.screenshot({ path: testInfo.outputPath("add-on-profit-phone.png") })
  await page.getByRole("button", { name: "Reset worksheet", exact: true }).click()
  await expect(rows.first()).not.toHaveValue("Invented test product")
  await page.setViewportSize({ width: 320, height: 824 })
  await page.locator("html").evaluate((element) => { element.style.fontSize = "24px" })
  await expectToolContentContained(page)
  expect(health.pageErrors).toEqual([])
  expect(health.consoleErrors).toEqual([])
  expect(health.failedLocalResponses).toEqual([])
  expect(health.forbiddenRequests).toEqual([])
})

test("Business planners show currency, units and readable field guidance", async ({ page }, testInfo) => {
  const health = await capturePageHealth(page, new Set())
  for (const path of ["/tools/business-planner/income", "/tools/business-planner/break-even"]) {
    await page.goto(path, { waitUntil: "domcontentloaded" })
    await page.waitForFunction((route) => localStorage.getItem(route.endsWith("income") ? "massagelab-business-income-planner-income-v1" : "massagelab-business-planner-break-even-v1") !== null, path)
    const moneyId = path.endsWith("income") ? "desired-income" : "break-even-service-price"
    const money = page.locator(`#${moneyId}`)
    await revealPlannerControl(page, money)
    await expect(money).toHaveAccessibleDescription(/US dollars/)
    await expect(money.locator("..").getByText("$", { exact: true })).toBeVisible()
    const tax = page.locator(path.endsWith("income") ? "#tax-set-aside" : "#break-even-tax-rate")
    await expect(tax).toHaveAccessibleDescription(/Enter 25 for 25%/)
    await expect(tax.locator("..").getByText("%", { exact: true })).toBeVisible()
    for (const width of [320, 360, 390, 412, 780, 1280]) {
      await page.setViewportSize({ width, height: width === 780 ? 360 : 824 })
      await expectToolContentContained(page)
      if (width === 390) await page.screenshot({ path: testInfo.outputPath(path.endsWith("income") ? "income-guidance-phone.png" : "break-even-phone.png") })
    }
    await page.setViewportSize({ width: 320, height: 824 })
    await page.locator("html").evaluate((element) => { element.style.fontSize = "24px" })
    await expectToolContentContained(page)
    await money.fill("1234")
    await expect(money).toHaveValue("1234")
  }
  expect(health.pageErrors).toEqual([])
  expect(health.consoleErrors).toEqual([])
  expect(health.failedLocalResponses).toEqual([])
  expect(health.forbiddenRequests).toEqual([])
})

test("Break-even planner retains edits and money rows through its compact layout", async ({ page }) => {
  const health = await capturePageHealth(page, new Set())
  await page.setViewportSize({ width: 390, height: 824 })
  await page.goto("/tools/business-planner/break-even", { waitUntil: "domcontentloaded" })
  await page.waitForFunction(() => localStorage.getItem("massagelab-business-planner-break-even-v1") !== null)
  const price = page.getByLabel("Main service price", { exact: true })
  await expect(price).toHaveValue("85")
  await price.fill("90")
  await selectPlannerStep(page, 3)
  await expect(page.getByText("Projected yearly gross", { exact: true }).first().locator("..").locator("p").nth(1)).toHaveText("$64,800")
  await selectPlannerStep(page, 1)
  const startup = page.locator("#break-even-startupCosts")
  await startup.getByRole("button", { name: "Add row to Startup costs", exact: true }).click()
  await startup.getByLabel("Item", { exact: true }).last().fill("Invented equipment")
  await startup.getByLabel("One-time amount", { exact: true }).last().fill("125")
  await page.reload({ waitUntil: "domcontentloaded" })
  await expect(price).toHaveValue("90")
  await selectPlannerStep(page, 1)
  await expect(startup.getByLabel("Item", { exact: true }).last()).toHaveValue("Invented equipment")
  await expect(startup.getByLabel("One-time amount", { exact: true }).last()).toHaveValue("125")
  await startup.getByRole("button", { name: "Remove Invented equipment", exact: true }).click()
  await expect(startup.getByLabel("Item", { exact: true })).toHaveCount(3)
  await page.getByRole("button", { name: "Reset worksheet", exact: true }).click()
  await expect(price).toHaveValue("85")
  await page.getByText("How this planner works", { exact: true }).click()
  await expect(page.getByText(/Break-even covers operating costs before owner income/)).toBeVisible()
  expect(health.pageErrors).toEqual([])
  expect(health.consoleErrors).toEqual([])
  expect(health.failedLocalResponses).toEqual([])
  expect(health.forbiddenRequests).toEqual([])
})

test("ROM recorder guides body and movement choices into a validated practice entry", async ({ page }, testInfo) => {
  const health = await capturePageHealth(page, new Set())
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/wellness", { waitUntil: "domcontentloaded" })
  // The heavyweight scene is not requested by the Wellness launcher itself.
  await expect(page.locator("[data-body-scene]")).toHaveCount(0)
  await page.getByRole("button", { name: "Open range of motion", exact: true }).click()
  const recorder = page.locator('[data-recording-focus="range"]')
  await expect(recorder.getByRole("button", { name: "Choose movement", exact: true })).toBeDisabled()
  await recorder.getByRole("button", { name: "Ankle", exact: true }).click()
  await recorder.getByRole("button", { name: "Right", exact: true }).click()
  await recorder.getByRole("button", { name: "Choose movement", exact: true }).click()
  await recorder.getByRole("button", { name: "Bring your toes toward your shin", exact: true }).click()
  await recorder.getByRole("button", { name: "Record this movement", exact: true }).click()
  await expect(recorder.getByLabel("Ending angle (°)", { exact: true })).toHaveValue("")
  await recorder.getByRole("button", { name: "Add practice measurement", exact: true }).click()
  await expect(recorder.getByRole("alert")).toContainText("Enter both angles")
  await recorder.getByLabel("Ending angle (°)", { exact: true }).fill("17.5")
  await recorder.getByLabel("Notes (optional)", { exact: true }).fill("Fictional measurement for interface QA")
  await expect(recorder.getByRole("status")).toContainText("17.5°")
  for (const width of [320, 390, 780, 1280]) { await page.setViewportSize({ width, height: 844 }); await expectToolContentContained(page) }
  await page.setViewportSize({ width: 320, height: 844 })
  await page.locator("html").evaluate((element) => { element.style.fontSize = "24px" })
  await expectToolContentContained(page)
  await page.locator("html").evaluate((element) => { element.style.fontSize = "16px" })
  for (const theme of ["light", "dark"]) {
    await page.locator("html").evaluate((element, value) => { element.classList.remove("light", "dark"); element.classList.add(value) }, theme)
    await expectToolContentContained(page)
    await page.screenshot({ path: testInfo.outputPath(`rom-record-${theme}.png`) })
  }
  await recorder.getByRole("button", { name: "Add practice measurement", exact: true }).click()
  await expect(page.locator("[data-wellness-workspace]").getByRole("status").last()).toContainText("Practice ROM measurement added")
  await page.getByRole("button", { name: "All wellness tools", exact: true }).click()
  await page.getByRole("button", { name: "Open timeline", exact: true }).click()
  await expect(page.getByRole("complementary").getByText("Fictional measurement for interface QA", { exact: true })).toBeVisible()
  await expect(page.locator("body")).toContainText("Ankle dorsiflexion")
  await page.getByRole("button", { name: "All wellness tools", exact: true }).click()
  await page.getByRole("button", { name: "Open range of motion", exact: true }).click()
  await expect(recorder.getByLabel("Ending angle (°)", { exact: true })).toHaveValue("17.5")
  await recorder.getByRole("button", { name: "Change movement", exact: true }).click()
  await recorder.getByRole("button", { name: "Other movement", exact: true }).click()
  await recorder.getByLabel("Movement name", { exact: true }).fill("Clinician-shown custom movement")
  await recorder.getByRole("button", { name: "Record this movement", exact: true }).click()
  await expect(recorder.getByLabel("Ending angle (°)", { exact: true })).toHaveValue("")
  await page.screenshot({ path: testInfo.outputPath("rom-record-phone.png") })
  expect(health.pageErrors).toEqual([])
  expect(health.forbiddenRequests).toEqual([])
  expect(health.unexpectedExternalRequests).toEqual([])
  expect(health.consoleErrors).toEqual([])
  expect(health.failedLocalResponses).toEqual([])
})

/** Compare rendered pixels instead of PNG bytes: GPU/compositor rounding and
 * PNG encoding can differ even when the visible pose is unchanged. */
async function meanCanvasPixelDifference(first: Buffer, second: Buffer) {
  const images = await Promise.all([first, second].map((buffer) => sharp(buffer).removeAlpha().raw().toBuffer({ resolveWithObject: true })))
  expect(images[0].info).toEqual(images[1].info)
  let difference = 0
  for (let index = 0; index < images[0].data.length; index += 1) difference += Math.abs(images[0].data[index] - images[1].data[index])
  return difference / images[0].data.length
}

test("ROM body supports real joint picking, views and bounded illustrative playback", async ({ page }, testInfo) => {
  const health = await capturePageHealth(page, new Set())
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/wellness", { waitUntil: "domcontentloaded" })
  await page.getByRole("button", { name: "Open range of motion", exact: true }).click()
  const viewer = page.locator("[data-body-viewer]")
  await expect(viewer).toHaveAttribute("data-body-state", "ready", { timeout: 30_000 })
  const canvas = viewer.locator("canvas")
  const box = await canvas.boundingBox()
  expect(box).not.toBeNull()
  // The reset camera projects the midline neck joint at this point. This
  // exercises pointer picking in the real renderer, not the named fallback.
  await canvas.click({ position: { x: box!.width / 2, y: box!.height * 0.18 } })
  await expect(page.locator('[data-recording-focus="range"]')).toContainText("Selected: Neck")
  await viewer.getByRole("button", { name: "Back", exact: true }).click()
  await viewer.getByRole("button", { name: "Front", exact: true }).click()
  for (const theme of ["light", "dark"]) {
    await page.locator("html").evaluate((element, value) => { element.classList.remove("light", "dark"); element.classList.add(value) }, theme)
    await expectToolContentContained(page)
    await page.screenshot({ path: testInfo.outputPath(`rom-body-${theme}.png`) })
  }
  const frontPixels = await canvas.screenshot({ scale: "css" })
  await viewer.getByRole("button", { name: "Rotate view", exact: true }).click()
  await expect(viewer.getByRole("button", { name: "Lock view", exact: true })).toHaveAttribute("aria-pressed", "true")
  const orbitBox = await canvas.boundingBox()
  await page.mouse.move(orbitBox!.x + orbitBox!.width * 0.5, orbitBox!.y + orbitBox!.height * 0.4)
  await page.mouse.down()
  await page.mouse.move(orbitBox!.x + orbitBox!.width * 0.75, orbitBox!.y + orbitBox!.height * 0.4, { steps: 5 })
  await page.mouse.up()
  expect(await meanCanvasPixelDifference(frontPixels, await canvas.screenshot({ scale: "css" }))).toBeGreaterThan(0.5)
  await viewer.getByRole("button", { name: "Lock view", exact: true }).click()
  await viewer.getByRole("button", { name: "Front", exact: true }).click()
  await page.screenshot({ path: testInfo.outputPath("rom-body-phone.png") })
  await page.getByRole("button", { name: "Choose movement", exact: true }).click()
  await page.getByRole("button", { name: "Turn your head", exact: true }).click()
  await expect(viewer).toHaveAttribute("data-body-state", "ready", { timeout: 30_000 })
  const starting = await canvas.screenshot({ scale: "css", path: testInfo.outputPath("rom-starting-position.png") })
  await page.getByRole("button", { name: "Show movement position", exact: true }).click()
  await expect.poll(async () => meanCanvasPixelDifference(starting, await canvas.screenshot({ scale: "css" }))).toBeGreaterThan(0.5)
  const movementPosition = await canvas.screenshot({ scale: "css" })
  await page.getByRole("button", { name: "Reset movement view", exact: true }).click()
  await expect(page.getByRole("button", { name: "Show movement position", exact: true })).toHaveAttribute("aria-pressed", "false")
  await expect.poll(async () => meanCanvasPixelDifference(movementPosition, await canvas.screenshot({ scale: "css" }))).toBeGreaterThan(0.5)
  const resetPosition = await canvas.screenshot({ scale: "css", path: testInfo.outputPath("rom-reset-position.png") })
  // Compare at CSS scale so fractional mobile DPR does not amplify edge shifts;
  // allow less than half of one RGB level on average for compositor rounding.
  expect(await meanCanvasPixelDifference(starting, resetPosition)).toBeLessThan(0.5)
  await page.getByRole("button", { name: "Play movement", exact: true }).click()
  await expect(page.getByRole("button", { name: "Pause movement", exact: true })).toBeVisible()
  await expect.poll(async () => meanCanvasPixelDifference(resetPosition, await canvas.screenshot({ scale: "css" }))).toBeGreaterThan(0.5)
  await page.getByRole("button", { name: "Pause movement", exact: true }).click()
  // Let the asynchronous renderer consume the paused React props, then verify
  // it holds a non-start pose instead of continuing or resetting the movement.
  await page.waitForTimeout(100)
  const paused = await canvas.screenshot({ scale: "css" })
  expect(await meanCanvasPixelDifference(resetPosition, paused)).toBeGreaterThan(0.5)
  await page.waitForTimeout(250)
  expect(await meanCanvasPixelDifference(paused, await canvas.screenshot({ scale: "css" }))).toBeLessThan(0.25)
  await page.getByRole("button", { name: "Play movement", exact: true }).click()
  await expect(page.getByRole("button", { name: "Play movement", exact: true })).toBeVisible({ timeout: 8_000 })
  await page.emulateMedia({ reducedMotion: "reduce" })
  await expect(page.getByRole("button", { name: "Play movement", exact: true })).toHaveCount(0)
  await expect(page.getByText(/Reduced motion: use the two still positions/)).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath("rom-movement-phone.png") })
  await page.getByRole("button", { name: "Record this movement", exact: true }).click()
  await expect(page.getByLabel("Ending angle (°)", { exact: true })).toHaveValue("")
  await expect(page.locator("[data-body-scene]")).toHaveCount(0)
  expect(health.pageErrors).toEqual([])
  expect(health.consoleErrors).toEqual([])
  expect(health.failedLocalResponses).toEqual([])
  expect(health.unexpectedExternalRequests).toEqual([])
})

test("ROM phone baseline cannot survive a side change or hidden recorder", async ({ page }) => {
  const health = await capturePageHealth(page, new Set())
  await page.addInitScript(() => {
    class FakeOrientation extends Event { static requestPermission = async () => "granted" }
    Object.defineProperty(window, "DeviceOrientationEvent", { configurable: true, value: FakeOrientation })
    // Hardware-less Chromium may emit a trusted all-null reading after the
    // synthetic one. This fixture owns the complete sensor stream.
    window.addEventListener("deviceorientation", (event) => { if (event.isTrusted) event.stopImmediatePropagation() }, true)
  })
  await page.goto("/wellness", { waitUntil: "domcontentloaded" })
  await page.getByRole("button", { name: "Open range of motion", exact: true }).click()
  await page.getByRole("button", { name: "Neck", exact: true }).click()
  await page.getByRole("button", { name: "Choose movement", exact: true }).click()
  await page.getByRole("button", { name: "Turn your head", exact: true }).click()
  await page.getByRole("button", { name: "Record this movement", exact: true }).click()
  await page.getByRole("button", { name: "Use phone readings", exact: true }).click()
  await page.getByRole("button", { name: "Enable phone readings", exact: true }).click()
  await page.getByLabel("Which phone direction are you tracking?", { exact: true }).selectOption("alpha")
  const emit = async (alpha: number) => page.evaluate((value) => { window.dispatchEvent(Object.assign(new Event("deviceorientation"), { alpha: value, beta: 0, gamma: 0 })) }, alpha)
  await emit(359)
  await expect(page.getByRole("button", { name: "Capture starting reading", exact: true })).toBeEnabled()
  await page.getByRole("button", { name: "Capture starting reading", exact: true }).click()
  await emit(1)
  await expect(page.locator('[data-recording-focus="range"] dl')).toContainText("2°")
  await page.getByRole("button", { name: "Change movement", exact: true }).click()
  await page.getByRole("button", { name: "Turn your head", exact: true }).click()
  await page.getByRole("button", { name: "Right", exact: true }).click()
  await page.getByRole("button", { name: "Record this movement", exact: true }).click()
  await emit(12)
  await expect(page.locator('[data-recording-focus="range"] dl')).toContainText("Not set")
  await page.getByRole("button", { name: "Add practice measurement", exact: true }).click()
  await expect(page.locator('[data-recording-focus="range"]').getByRole("alert")).toContainText("Capture a starting reading")
  await page.getByRole("button", { name: "Capture starting reading", exact: true }).click()
  await page.getByRole("button", { name: "All wellness tools", exact: true }).click()
  await emit(50)
  await page.getByRole("button", { name: "Open range of motion", exact: true }).click()
  await expect(page.locator('[data-recording-focus="range"] dl')).toContainText("Not set")
  await page.getByRole("button", { name: "Enter angles", exact: true }).click()
  await page.getByLabel("Ending angle (°)", { exact: true }).fill("270")
  await expect(page.locator('[data-recording-focus="range"]').getByRole("status")).toContainText("270°")
  expect(health.pageErrors).toEqual([])
  expect(health.forbiddenRequests).toEqual([])
})

test("ROM model and sensor failures leave named choices and manual entry usable", async ({ page }) => {
  const health = await capturePageHealth(page, new Set())
  await page.addInitScript(() => {
    class DeniedOrientation extends Event { static requestPermission = async () => "denied" }
    Object.defineProperty(window, "DeviceOrientationEvent", { configurable: true, value: DeniedOrientation })
  })
  await page.route("**/body-models/human-base-rigged.glb", (route) => route.fulfill({ status: 503, body: "Intentional model failure" }))
  await page.goto("/wellness", { waitUntil: "domcontentloaded" })
  await page.getByRole("button", { name: "Open range of motion", exact: true }).click()
  await expect(page.locator("[data-body-viewer]")).toHaveAttribute("data-body-state", "failed", { timeout: 30_000 })
  await page.getByRole("button", { name: "Knee", exact: true }).click()
  await page.getByRole("button", { name: "Choose movement", exact: true }).click()
  await page.getByRole("button", { name: "Bend your knee", exact: true }).click()
  await page.getByRole("button", { name: "Record this movement", exact: true }).click()
  await page.getByRole("button", { name: "Use phone readings", exact: true }).click()
  await page.getByRole("button", { name: "Enable phone readings", exact: true }).click()
  await expect(page.getByText(/Motion permission was not granted/)).toBeVisible()
  await page.getByRole("button", { name: "Enter angles", exact: true }).click()
  await page.getByLabel("Ending angle (°)", { exact: true }).fill("75")
  await expect(page.locator('[data-recording-focus="range"]').getByRole("status")).toContainText("75°")
  expect(health.pageErrors).toEqual([])
  expect(health.forbiddenRequests).toEqual([])
  expect(health.failedLocalResponses.every((url) => url.includes("human-base-rigged.glb"))).toBe(true)
})

test("Wellness movement comfort keeps its own focus and supports optional ROM", async ({ page }, testInfo) => {
  const health = await capturePageHealth(page, new Set())
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/wellness", { waitUntil: "domcontentloaded" })
  await page.getByRole("button", { name: "Open movement comfort", exact: true }).click()
  const comfort = page.locator('[data-recording-focus="comfort"]')
  const range = page.locator('[data-recording-focus="range"]')
  await comfort.getByRole("button", { name: "Hand / fingers", exact: true }).click()
  await comfort.getByRole("button", { name: "Choose movement", exact: true }).click()
  await comfort.getByLabel("Which part of your hand?", { exact: true }).selectOption("index")
  await comfort.getByRole("button", { name: "Bend the base knuckle", exact: true }).click()
  await comfort.getByRole("button", { name: "Record this movement", exact: true }).click()
  const rating = comfort.getByLabel("How comfortable did this movement feel?", { exact: true })
  await expect(rating).toHaveValue("")
  await expect(comfort.getByLabel("Ending angle (°)", { exact: true })).toHaveCount(0)
  await comfort.getByRole("button", { name: "Add practice check-in", exact: true }).click()
  await expect(comfort.getByRole("alert")).toContainText("Choose a comfort rating")
  await rating.selectOption("0")
  await comfort.getByLabel("Notes (optional)", { exact: true }).fill("Fictional comfort baseline")
  for (const theme of ["light", "dark"]) {
    await page.locator("html").evaluate((element, value) => { element.classList.remove("light", "dark"); element.classList.add(value) }, theme)
    await expectToolContentContained(page)
    await page.screenshot({ path: testInfo.outputPath(`movement-comfort-${theme}.png`) })
  }
  await page.setViewportSize({ width: 320, height: 844 })
  await page.locator("html").evaluate((element) => { element.style.fontSize = "24px" })
  await expectToolContentContained(page)
  await page.locator("html").evaluate((element) => { element.style.fontSize = "16px" })
  await page.setViewportSize({ width: 390, height: 844 })
  await comfort.getByRole("button", { name: "Add practice check-in", exact: true }).click()
  await expect(page.locator("[data-wellness-workspace]").getByRole("status").last()).toContainText("Practice movement check-in added")
  await page.getByRole("button", { name: "All wellness tools", exact: true }).click()
  await page.getByRole("button", { name: "Open movement comfort", exact: true }).click()
  await expect(rating).toHaveValue("0")
  await rating.selectOption("6")
  await comfort.getByRole("button", { name: "Add practice check-in", exact: true }).click()
  await page.getByRole("button", { name: "All wellness tools", exact: true }).click()
  await page.getByRole("button", { name: "Open patterns", exact: true }).click()
  const trend = page.getByRole("region", { name: "Movement comfort over time", exact: true })
  await expect(trend).toContainText("Latest 6/10")
  await expect(trend).toContainText("Previous 0/10")
  await expect(trend).toContainText("+6 comfort points")
  await expect(page.getByText(/Avg intensity/)).toHaveCount(0)
  await page.screenshot({ path: testInfo.outputPath("movement-comfort-history.png") })
  await page.getByRole("button", { name: "All wellness tools", exact: true }).click()
  await page.getByRole("button", { name: "Open movement comfort", exact: true }).click()
  await expect(comfort).toContainText("Your last rating for this movement and side: 6/10")
  await comfort.getByLabel("Add an angle measurement (optional)", { exact: true }).check()
  await comfort.getByLabel("Ending angle (°)", { exact: true }).fill("17.5")
  await rating.selectOption("7")
  await comfort.getByLabel("Notes (optional)", { exact: true }).fill("Fictional combined movement")
  await comfort.getByRole("button", { name: "Add practice check-in", exact: true }).click()
  await page.getByRole("button", { name: "All wellness tools", exact: true }).click()
  await page.getByRole("button", { name: "Open timeline", exact: true }).click()
  const combined = page.getByRole("complementary").getByText("Fictional combined movement", { exact: true }).locator("..")
  await expect(combined).toContainText("Comfort 7/10")
  await expect(combined).toContainText("ROM 17.5 deg")
  await expect(combined).not.toContainText("Intensity")
  await page.getByRole("button", { name: "All wellness tools", exact: true }).click()
  await page.getByRole("button", { name: "Open range of motion", exact: true }).click()
  await expect(range.getByRole("button", { name: "Choose movement", exact: true })).toBeDisabled()
  await range.getByRole("button", { name: "Shoulder", exact: true }).click()
  await range.getByRole("button", { name: "Choose movement", exact: true }).click()
  await range.getByRole("button", { name: "Open your raised arm out to the side", exact: true }).click()
  await range.getByRole("button", { name: "Record this movement", exact: true }).click()
  await expect(range.getByLabel("How comfortable did this movement feel?", { exact: true })).toHaveCount(0)
  await range.getByLabel("Ending angle (°)", { exact: true }).fill("55")
  await range.getByLabel("Add a comfort rating (optional)", { exact: true }).check()
  await range.getByLabel("How comfortable did this movement feel?", { exact: true }).selectOption("2")
  await range.getByRole("button", { name: "Add practice measurement", exact: true }).click()
  await range.getByLabel("Add a comfort rating (optional)", { exact: true }).uncheck()
  await range.getByLabel("Notes (optional)", { exact: true }).fill("Fictional range without rating")
  await range.getByRole("button", { name: "Add practice measurement", exact: true }).click()
  await page.getByRole("button", { name: "All wellness tools", exact: true }).click()
  await page.getByRole("button", { name: "Open timeline", exact: true }).click()
  const rangeOnly = page.getByRole("complementary").getByText("Fictional range without rating", { exact: true }).locator("..")
  await expect(rangeOnly).toContainText("ROM 55 deg")
  await expect(rangeOnly).not.toContainText("Comfort 2/10")
  expect(health.pageErrors).toEqual([]); expect(health.consoleErrors).toEqual([])
  expect(health.failedLocalResponses).toEqual([]); expect(health.unexpectedExternalRequests).toEqual([])
})

test("ROM expanded joints demonstrate new movement families with real mapped bones", async ({ page }, testInfo) => {
  test.setTimeout(120_000)
  const health = await capturePageHealth(page, new Set())
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/wellness", { waitUntil: "domcontentloaded" })
  await page.getByRole("button", { name: "Open range of motion", exact: true }).click()
  const recorder = page.locator('[data-recording-focus="range"]')
  const side = testInfo.project.name === "mobile-chromium" ? "Right" : "Left"
  for (const [area, label, part, file] of [
    ["Shoulder", "Bring your raised arm across your chest", "", "shoulder-horizontal"],
    ["Elbow / forearm", "Turn your palm down", "", "forearm-pronation"],
    ["Hip", "Turn your thigh outward", "", "hip-rotation"],
    ["Knee", "Turn your lower leg inward with your knee bent", "", "knee-rotation"],
    ["Hand / fingers", "Bend the middle joint", "index", "finger-pip"],
    ["Hand / fingers", "Bring your thumb toward your little finger", "thumb", "thumb-opposition"],
    ["Ankle", "Combine an outward sole turn with lifting the foot", "", "foot-pronation"],
    ["Toes", "Curl downward at the toe base", "all", "toes-curl"],
  ]) {
    await recorder.getByRole("button", { name: "1 Body area", exact: true }).click()
    await recorder.getByRole("button", { name: area, exact: true }).click()
    await recorder.getByRole("button", { name: side, exact: true }).click()
    await recorder.getByRole("button", { name: "Choose movement", exact: true }).click()
    if (part) await recorder.getByLabel(area === "Toes" ? "Which toes?" : "Which part of your hand?", { exact: true }).selectOption(part)
    await recorder.getByRole("button", { name: label, exact: true }).click()
    const viewer = recorder.locator("[data-body-viewer]")
    await expect(viewer).toHaveAttribute("data-body-state", "ready", { timeout: 30_000 })
    const starting = await viewer.locator("canvas").screenshot({ scale: "css" })
    await viewer.getByRole("button", { name: "Show movement position", exact: true }).click()
    await expect.poll(async () => meanCanvasPixelDifference(starting, await viewer.locator("canvas").screenshot({ scale: "css" }))).toBeGreaterThan(0.2)
    await page.screenshot({ path: testInfo.outputPath(`${file}-${side.toLowerCase()}.png`) })
    await expectToolContentContained(page)
  }
  expect(health.pageErrors).toEqual([]); expect(health.consoleErrors).toEqual([])
  expect(health.failedLocalResponses).toEqual([]); expect(health.unexpectedExternalRequests).toEqual([])
})

test("Wellness toe check-ins stay recordable without an invented isolated-toe animation", async ({ page }) => {
  const health = await capturePageHealth(page, new Set())
  await page.goto("/wellness", { waitUntil: "domcontentloaded" })
  await page.getByRole("button", { name: "Open movement comfort", exact: true }).click()
  const recorder = page.locator('[data-recording-focus="comfort"]')
  await recorder.getByRole("button", { name: "Toes", exact: true }).click()
  await recorder.getByRole("button", { name: "Choose movement", exact: true }).click()
  await recorder.getByLabel("Which toes?", { exact: true }).selectOption("great")
  await recorder.getByRole("button", { name: "Lift upward at the toe base", exact: true }).click()
  await expect(recorder.getByRole("status")).toContainText("A separate animation for this toe movement is not available")
  await expect(recorder.getByRole("button", { name: "Play movement", exact: true })).toHaveCount(0)
  await recorder.getByRole("button", { name: "Record this movement", exact: true }).click()
  await recorder.getByLabel("How comfortable did this movement feel?", { exact: true }).selectOption("10")
  await recorder.getByRole("button", { name: "Add practice check-in", exact: true }).click()
  await expect(page.locator("[data-wellness-workspace]").getByRole("status").last()).toContainText("Practice movement check-in added")
  await expect(recorder.getByLabel("Ending angle (°)", { exact: true })).toHaveCount(0)
  expect(health.pageErrors).toEqual([]); expect(health.consoleErrors).toEqual([])
  expect(health.failedLocalResponses).toEqual([]); expect(health.unexpectedExternalRequests).toEqual([])
})

test("Wellness Activity selects multiple body regions and preserves its complete draft", async ({ page }, testInfo) => {
  const health = await capturePageHealth(page, new Set())
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/wellness", { waitUntil: "domcontentloaded" })
  await page.getByRole("button", { name: "Record activity", exact: true }).click()
  const form = page.locator("#quick-log form")
  await expect(page.locator("[data-body-scene]")).toHaveCount(0)
  await form.locator("#wellnessSummary").fill("Fictional activity region test")
  await expect(form.getByLabel("How strong is it?", { exact: true })).toHaveValue("")
  await form.getByText("Body regions (optional)", { exact: true }).click()
  const viewer = form.locator('[data-body-mode="regions"]')
  await expect(viewer).toHaveAttribute("data-body-state", "ready", { timeout: 30_000 })
  const canvas = viewer.locator("canvas")
  // Real torso markers share a screen position but belong to opposite surfaces.
  const bounds = await canvas.boundingBox()
  if (!bounds) throw new Error("Activity body canvas is missing")
  const torsoPoint = { x: bounds.width * 0.545, y: bounds.height * 0.27 }
  await canvas.click({ position: torsoPoint })
  await expect(form.locator('input[name="regions"][value="left chest"]')).toHaveCount(1)
  await viewer.getByRole("button", { name: "Back", exact: true }).click()
  const backPoint = { x: bounds.width * 0.455, y: torsoPoint.y }
  await canvas.click({ position: backPoint })
  await expect(form.locator('input[name="regions"][value="left upper back"]')).toHaveCount(1)
  await expect(viewer.getByRole("button", { name: "Back", exact: true })).toHaveAttribute("aria-pressed", "true")
  await canvas.click({ position: backPoint })
  await expect(form.locator('input[name="regions"][value="left upper back"]')).toHaveCount(0)
  await viewer.getByText("Choose regions by name", { exact: true }).click()
  await viewer.getByText("Arms and hands", { exact: true }).click()
  await viewer.locator('[data-body-part-choice="left hand"] > summary').click()
  await viewer.getByRole("button", { name: "Left palm", exact: true }).click()
  await expect(viewer.getByRole("button", { name: "Left palm", exact: true })).toHaveAttribute("aria-pressed", "true")
  await form.getByText("Timing and context (optional)", { exact: true }).click()
  await form.getByLabel("Duration in minutes", { exact: true }).fill("45")
  await form.getByLabel("Activity detail", { exact: true }).fill("Fictional walk")
  for (const width of [320, 390, 780, 1280]) { await page.setViewportSize({ width, height: 844 }); await expectToolContentContained(page) }
  await page.setViewportSize({ width: 320, height: 844 })
  await page.locator("html").evaluate((element) => { element.style.fontSize = "24px" })
  await expectToolContentContained(page)
  await page.locator("html").evaluate((element) => { element.style.fontSize = "16px" })
  await page.setViewportSize({ width: 390, height: 844 })
  for (const theme of ["light", "dark"]) {
    await page.locator("html").evaluate((element, value) => { element.classList.remove("light", "dark"); element.classList.add(value) }, theme)
    await expectToolContentContained(page)
    await page.screenshot({ path: testInfo.outputPath(`activity-body-${theme}.png`) })
  }
  await form.getByText("Body regions (optional)", { exact: true }).click()
  await expect(page.locator("[data-body-scene]")).toHaveCount(0)
  await expect(form.locator('input[name="regions"]')).toHaveCount(2)
  await page.getByRole("button", { name: "All wellness tools", exact: true }).click()
  await page.getByRole("button", { name: "Record feelings", exact: true }).click()
  await expect(form.locator("#wellnessCategory")).toHaveValue("emotion")
  await expect(form.locator("#wellnessSummary")).toHaveValue("")
  await page.getByRole("button", { name: "All wellness tools", exact: true }).click()
  await page.getByRole("button", { name: "Record activity", exact: true }).click()
  await expect(form.locator("#wellnessCategory")).toHaveValue("activity")
  await expect(form.locator("#wellnessSummary")).toHaveValue("Fictional activity region test")
  await expect(form.getByLabel("Duration in minutes", { exact: true })).toHaveValue("45")
  await form.getByRole("button", { name: "Add practice activity", exact: true }).click()
  await expect(page.getByRole("status")).toContainText("Practice entry added")
  await page.getByRole("button", { name: "All wellness tools", exact: true }).click()
  await page.getByRole("button", { name: "Open timeline", exact: true }).click()
  const entry = page.getByText("Fictional activity region test", { exact: true }).locator("..")
  await expect(entry).toContainText("left chest")
  await expect(entry).toContainText("left palm")
  await expect(entry).toContainText("45 min")
  await expect(entry).toContainText("Fictional walk")
  await expect(entry).not.toContainText("Intensity")
  expect(health.pageErrors).toEqual([]); expect(health.consoleErrors).toEqual([])
  expect(health.failedLocalResponses).toEqual([]); expect(health.forbiddenRequests).toEqual([])
})

test("Wellness Activity model failure keeps named multiple-region recording usable", async ({ page }) => {
  const health = await capturePageHealth(page, new Set())
  await page.route("**/body-models/human-base-rigged.glb", (route) => route.fulfill({ status: 503, body: "Intentional model failure" }))
  await page.goto("/wellness", { waitUntil: "domcontentloaded" })
  await page.getByRole("button", { name: "Record activity", exact: true }).click()
  const form = page.locator("#quick-log form")
  await form.getByText("Body regions (optional)", { exact: true }).click()
  const viewer = form.locator('[data-body-mode="regions"]')
  await expect(viewer).toHaveAttribute("data-body-state", "failed", { timeout: 30_000 })
  await viewer.getByText("Legs and feet", { exact: true }).click()
  await viewer.locator('[data-body-part-choice="left foot"] > summary').click()
  await viewer.getByRole("button", { name: "Left top of foot", exact: true }).click()
  await viewer.getByText("Torso", { exact: true }).click()
  await viewer.locator('[data-body-part-choice="left lower torso"] > summary').click()
  await viewer.getByRole("button", { name: "Left low back", exact: true }).click()
  await expect(form.locator('input[name="regions"]')).toHaveCount(2)
  await form.getByRole("button", { name: "Add practice activity", exact: true }).click()
  await expect(page.locator("[data-wellness-workspace]").getByRole("status").last()).toContainText("Practice entry added")
  expect(health.pageErrors).toEqual([]); expect(health.forbiddenRequests).toEqual([])
  expect(health.failedLocalResponses.every((url) => url.includes("human-base-rigged.glb"))).toBe(true)
})

test("Wellness Activity profiles pick the near side and retain both shins and separate arm segments", async ({ page }, testInfo) => {
  const health = await capturePageHealth(page, new Set())
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/wellness", { waitUntil: "domcontentloaded" })
  await page.getByRole("button", { name: "Record activity", exact: true }).click()
  const form = page.locator("#quick-log form")
  await form.locator("#wellnessSummary").fill("Fictional sided region recording")
  await form.getByText("Body regions (optional)", { exact: true }).click()
  const viewer = form.locator('[data-body-mode="regions"]')
  await expect(viewer).toHaveAttribute("data-body-state", "ready", { timeout: 30_000 })
  const canvas = viewer.locator("canvas")
  const bounds = await canvas.boundingBox()
  if (!bounds) throw new Error("Activity body canvas is missing")
  for (const side of ["Left", "Right"]) {
    await viewer.getByRole("button", { name: `${side} side`, exact: true }).click()
    await expect(viewer.locator("[data-body-view-label]")).toContainText(`${side} side`)
    // The far forearm projects to the same profile location. Only the near
    // side may receive this real tap, even when both sides have selections.
    await canvas.click({ position: { x: bounds.width * 0.5, y: bounds.height * 0.43 } })
    await page.screenshot({ path: testInfo.outputPath(`activity-${side.toLowerCase()}-profile.png`) })
    await expect(form.locator(`input[name="regions"][value="${side.toLowerCase()} outer forearm"]`)).toHaveCount(1)
  }
  await viewer.getByRole("button", { name: "Front", exact: true }).click()
  for (const [side, x] of [["left", 0.625], ["right", 0.375]] as const) {
    await canvas.click({ position: { x: bounds.width * x, y: bounds.height * 0.81 } })
    await expect(form.locator(`input[name="regions"][value="${side} shin"]`)).toHaveCount(1)
  }
  await page.screenshot({ path: testInfo.outputPath("activity-both-shins.png") })
  await viewer.getByText("Choose regions by name", { exact: true }).click()
  await viewer.getByText("Arms and hands", { exact: true }).click()
  for (const side of ["Left", "Right"]) {
    await viewer.locator(`[data-body-part-choice="${side.toLowerCase()} upper arm"] > summary`).click()
    await viewer.getByRole("button", { name: `General area: ${side} upper arm`, exact: true }).click()
  }
  await viewer.getByText("Legs and feet", { exact: true }).click()
  await viewer.locator('[data-body-part-choice="left lower leg"] > summary').click()
  await viewer.getByRole("button", { name: "Left calf", exact: true }).click()
  await viewer.getByRole("button", { name: "Remove right shin", exact: true }).click()
  await expect(form.locator('input[name="regions"]')).toHaveCount(6)
  await expect(form.locator('input[name="regions"][value="right shin"]')).toHaveCount(0)
  await form.getByRole("button", { name: "Add practice activity", exact: true }).click()
  await page.getByRole("button", { name: "All wellness tools", exact: true }).click()
  await page.getByRole("button", { name: "Open timeline", exact: true }).click()
  const entry = page.getByText("Fictional sided region recording", { exact: true }).locator("..")
  await entry.getByText("More body regions (1)", { exact: true }).click()
  for (const region of ["left outer forearm", "right outer forearm", "left shin", "left upper arm", "right upper arm", "left calf"]) await expect(entry.getByText(region, { exact: true })).toBeVisible()
  expect(health.pageErrors).toEqual([]); expect(health.consoleErrors).toEqual([])
  expect(health.failedLocalResponses).toEqual([]); expect(health.forbiddenRequests).toEqual([])
})

test("Wellness Activity records a short note without opening or loading the body", async ({ page }) => {
  const health = await capturePageHealth(page, new Set())
  const modelRequests: string[] = []
  page.on("request", (request) => { if (request.url().includes("human-base-rigged.glb")) modelRequests.push(request.url()) })
  await page.goto("/wellness", { waitUntil: "domcontentloaded" })
  await page.getByRole("button", { name: "Record activity", exact: true }).click()
  const form = page.locator("#quick-log form")
  await form.locator("#wellnessSummary").fill("Fictional note-only activity")
  await form.getByRole("button", { name: "Add practice activity", exact: true }).click()
  await expect(page.getByRole("status")).toContainText("Practice entry added")
  expect(modelRequests).toEqual([])
  expect(health.pageErrors).toEqual([]); expect(health.consoleErrors).toEqual([])
  expect(health.failedLocalResponses).toEqual([]); expect(health.forbiddenRequests).toEqual([])
})

test("Wellness surface detail keeps front back inner and sole locations independent across shared tools", async ({ page }, testInfo) => {
  const health = await capturePageHealth(page, new Set())
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/wellness", { waitUntil: "domcontentloaded" })
  await page.getByRole("button", { name: "Record activity", exact: true }).click()
  const form = page.locator("[data-check-in-category]")
  await form.locator("#wellnessSummary").fill("Fictional surface detail entry")
  await form.getByText("Body regions (optional)", { exact: true }).click()
  const viewer = form.locator('[data-body-mode="regions"]')
  await expect(viewer).toHaveAttribute("data-body-state", "ready", { timeout: 30_000 })
  async function location(part: string, surface: string, label = `Whole area: ${surface[0].toUpperCase() + surface.slice(1)}`) {
    await viewer.getByLabel("Zoom into a body part", { exact: true }).selectOption(part)
    const group = viewer.locator(`[data-surface-choice="${surface}"]`)
    if (!await group.evaluate((element) => (element as HTMLDetailsElement).open)) await group.locator("summary").click()
    await group.getByRole("button", { name: label, exact: true }).click()
  }
  async function visibleBody(name: string) {
    const canvas = viewer.locator("canvas")
    await canvas.scrollIntoViewIfNeeded()
    await expect.poll(async () => {
      const pixels = await sharp(await canvas.screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject: true })
      let blue = 0
      for (let index = 0; index < pixels.data.length; index += 3) if (pixels.data[index + 2] > 110 && pixels.data[index + 2] - pixels.data[index] > 35) blue++
      return blue / (pixels.info.width * pixels.info.height)
    }).toBeGreaterThan(0.002)
    await page.screenshot({ path: testInfo.outputPath(name) })
  }
  await location("left thigh", "left front thigh")
  await viewer.getByRole("button", { name: "Back", exact: true }).click()
  await expect(form.locator('input[name="regions"][value="left back thigh"]')).toHaveCount(0)
  await expect(form.locator('input[name="regions"][value="left front thigh"]')).toHaveCount(1)
  await location("left thigh", "left back thigh")
  await location("left thigh", "left inner thigh")
  await location("left thigh", "left inner thigh", "Left inner thigh, near knee")
  await expect(form.locator('input[name="regions"][value="left inner thigh"]')).toHaveCount(0)
  await expect(form.locator('input[name="regions"][value="left inner thigh, near knee"]')).toHaveCount(1)
  await viewer.getByLabel("More body views", { exact: true }).selectOption("front-right")
  await visibleBody("body-inner-thigh-closeup.png")
  await location("left foot", "left sole of foot", "Left sole of foot, middle / arch")
  await expect(viewer.getByLabel("More body views", { exact: true })).toHaveValue("bottom")
  await visibleBody("body-sole-closeup.png")
  await location("left foot", "left inner foot / arch")
  await location("head", "top of head")
  await expect(viewer.getByLabel("More body views", { exact: true })).toHaveValue("top")
  await visibleBody("body-head-top-closeup.png")
  await location("right shoulder", "right top of shoulder")
  await location("left hand", "left back index finger", "Left back index finger, base")
  await visibleBody("body-hand-closeup.png")
  for (const width of [320, 390, 780, 1280]) { await page.setViewportSize({ width, height: 844 }); await expectToolContentContained(page) }
  await page.setViewportSize({ width: 320, height: 844 })
  await page.locator("html").evaluate((element) => { element.style.fontSize = "24px" })
  await expectToolContentContained(page)
  await page.locator("html").evaluate((element) => { element.style.fontSize = "16px" })
  await form.getByRole("button", { name: "Add practice activity", exact: true }).click()
  await page.getByRole("button", { name: "All wellness tools", exact: true }).click()
  await page.getByRole("button", { name: "Open timeline", exact: true }).click()
  const entry = page.getByText("Fictional surface detail entry", { exact: true }).locator("..")
  await entry.locator("summary").filter({ hasText: /^More body regions/ }).click()
  for (const value of ["left front thigh", "left back thigh", "left inner thigh, near knee", "left sole of foot, middle / arch", "left inner foot / arch", "top of head", "right top of shoulder", "left back index finger, base"]) await expect(entry.getByText(value, { exact: true })).toBeVisible()
  for (const launcher of ["Record body check-in", "Record incident"]) {
    await page.getByRole("button", { name: "All wellness tools", exact: true }).click()
    await page.getByRole("button", { name: launcher, exact: true }).click()
    if (launcher === "Record incident") await form.locator("[data-log-body] > summary").click()
    await expect(viewer).toHaveAttribute("data-body-state", "ready", { timeout: 30_000 })
    await form.locator("#wellnessSummary").fill(`Fictional ${launcher}`)
    if (launcher === "Record body check-in") {
      await viewer.getByLabel("Zoom into a body part", { exact: true }).selectOption("left forearm")
      await viewer.getByLabel("More body views", { exact: true }).selectOption("right")
      const canvas = viewer.locator("canvas"), bounds = await canvas.boundingBox()
      if (!bounds) throw new Error("Forearm close-up is missing")
      await canvas.click({ position: { x: bounds.width * 0.5, y: bounds.height * 0.5 } })
      await expect(form.locator('input[name="regions"][value="left inner forearm, middle area"]')).toHaveCount(1)
      await visibleBody("body-inner-forearm-closeup.png")
    } else await location("left forearm", "left front forearm", "Left front forearm, near wrist")
    await form.getByRole("button", { name: /^Add practice / }).click()
    await expect(page.getByRole("status").last()).toContainText("Practice entry added")
  }
  expect(health.pageErrors).toEqual([]); expect(health.consoleErrors).toEqual([])
  expect(health.failedLocalResponses).toEqual([]); expect(health.forbiddenRequests).toEqual([])
})

test("Wellness body refinement and removed choices retain visible keyboard focus", async ({ page }) => {
  // The named fallback exercises the same replacement controls without needing
  // a GPU; focus must remain useful when the selected button disappears.
  await page.route("**/body-models/human-base-rigged.glb", (route) => route.fulfill({ status: 503, body: "Intentional model failure" }))
  await page.goto("/wellness", { waitUntil: "domcontentloaded" })
  await page.getByRole("button", { name: "Record body check-in", exact: true }).click()
  const viewer = page.locator('[data-body-mode="regions"]')
  await expect(viewer).toHaveAttribute("data-body-state", "failed", { timeout: 30_000 })
  await viewer.getByText("Arms and hands", { exact: true }).click()
  await viewer.locator('[data-body-part-choice="left forearm"] > summary').click()
  await viewer.getByRole("button", { name: "More detail: Left forearm", exact: true }).click()
  const part = viewer.getByLabel("Zoom into a body part", { exact: true })
  await expect(part).toBeFocused()
  await viewer.locator('[data-surface-choice="left front forearm"] > summary').click()
  await viewer.getByRole("button", { name: "Whole area: Left front forearm", exact: true }).click()
  await viewer.getByRole("button", { name: "Whole body", exact: true }).click()
  await expect(part).toBeFocused()
  await viewer.getByRole("button", { name: "Be more specific: Left front forearm", exact: true }).click()
  await expect(part).toBeFocused()
  await viewer.getByRole("button", { name: "Remove left front forearm", exact: true }).click()
  await expect(part).toBeFocused()
  await viewer.getByRole("button", { name: "General area: Left forearm", exact: true }).click()
  await viewer.getByRole("button", { name: "Clear selected regions", exact: true }).click()
  await expect(part).toBeFocused()
  await page.locator("#wellnessCategory").selectOption("rom")
  await page.getByRole("button", { name: "Open range of motion recorder", exact: true }).click()
  await page.getByRole("button", { name: "All wellness tools", exact: true }).click()
  await expect(page.getByRole("button", { name: "Record body check-in", exact: true })).toBeFocused()
})

test("Wellness feelings wheel supports word levels multiple choices search and retained drafts", async ({ page }, testInfo) => {
  const health = await capturePageHealth(page, new Set())
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/wellness", { waitUntil: "domcontentloaded" })
  await page.getByRole("button", { name: "Record feelings", exact: true }).click()
  const wheel = page.locator("[data-feelings-wheel]")
  const allWords = await wheel.locator("svg path").count()
  await wheel.getByRole("button", { name: "Choose Happy", exact: true }).click()
  await wheel.getByRole("button", { name: "Choose Optimistic", exact: true }).click()
  await wheel.getByRole("button", { name: "Choose Hopeful", exact: true }).click()
  await expect(wheel.locator("svg path")).toHaveCount(allWords)
  await expect(wheel.locator('[data-feeling-level="1"]')).toHaveCount(9)
  await expect(wheel.getByText("Happy › Optimistic › Hopeful", { exact: true })).toBeVisible()
  await wheel.getByRole("button", { name: "Choose multiple feelings", exact: true }).click()
  await wheel.getByLabel("Find a feeling word", { exact: true }).fill("Worried")
  await wheel.getByRole("button", { name: "Worried", exact: true }).click()
  await wheel.getByLabel("Or use your own word", { exact: true }).fill("My own feeling word")
  await wheel.getByRole("button", { name: "Add my word", exact: true }).click()
  await page.locator("#wellnessSummary").fill("Fictional wheel check-in")
  await expect(wheel.locator('input[name="feelingWords"]')).toHaveCount(3)
  for (const width of [320, 390, 780]) { await page.setViewportSize({ width, height: 844 }); await expectToolContentContained(page) }
  await page.setViewportSize({ width: 320, height: 844 })
  await page.locator("html").evaluate((element) => { element.style.fontSize = "24px" })
  await expectToolContentContained(page)
  await page.locator("html").evaluate((element) => { element.style.fontSize = "16px" })
  await page.setViewportSize({ width: 390, height: 844 })
  for (const theme of ["light", "dark"]) {
    await page.locator("html").evaluate((element, value) => { element.classList.remove("light", "dark"); element.classList.add(value) }, theme)
    await wheel.locator("svg").scrollIntoViewIfNeeded()
    await page.screenshot({ path: testInfo.outputPath(`feelings-wheel-${theme}.png`) })
  }
  await page.getByRole("button", { name: "All wellness tools", exact: true }).click()
  await page.getByRole("button", { name: "Record activity", exact: true }).click()
  await expect(page.locator("#wellnessCategory")).toHaveValue("activity")
  await expect(wheel).toBeHidden()
  await page.getByRole("button", { name: "All wellness tools", exact: true }).click()
  await page.getByRole("button", { name: "Record feelings", exact: true }).click()
  await expect(page.locator("#wellnessCategory")).toHaveValue("emotion")
  await expect(wheel.locator('input[name="feelingWords"]')).toHaveCount(3)
  await page.getByRole("button", { name: /^Add practice / }).click()
  await page.getByRole("button", { name: "All wellness tools", exact: true }).click()
  await page.getByRole("button", { name: "Open timeline", exact: true }).click()
  const entry = page.getByText("Fictional wheel check-in", { exact: true }).locator("..")
  for (const value of ["Hopeful", "Worried", "My own feeling word"]) await expect(entry.getByText(value, { exact: true })).toBeVisible()
  expect(health.pageErrors).toEqual([]); expect(health.consoleErrors).toEqual([])
  expect(health.failedLocalResponses).toEqual([]); expect(health.forbiddenRequests).toEqual([])
})

test("Wellness continuous feelings wheel rotates by drag and touch without selecting and supports pinch and keyboard", async ({ page }, testInfo) => {
  const health = await capturePageHealth(page, new Set())
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/wellness", { waitUntil: "domcontentloaded" })
  await page.getByRole("button", { name: "Record feelings", exact: true }).click()
  const wheel = page.locator("[data-feelings-wheel]"), diagram = wheel.locator("svg")
  await diagram.scrollIntoViewIfNeeded()
  // Convert artwork coordinates using the actual SVG matrix, not fixed pixels
  // or a bounding-box center that can land outside a thin annular word sector.
  const point = (x: number, y: number) => diagram.evaluate((element, coordinates) => {
    const p = new DOMPoint(coordinates.x, coordinates.y).matrixTransform((element as SVGSVGElement).getScreenCTM()!)
    return { x: p.x, y: p.y }
  }, { x, y })
  const start = await point(160, -50), end = await point(160, 90)
  const isPhone = testInfo.project.name === "mobile-chromium"
  const session = isPhone ? await page.context().newCDPSession(page) : null
  if (session) {
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ id: 1, ...start }] })
    for (let index = 1; index <= 8; index++) await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ id: 1, x: start.x + (end.x - start.x) * index / 8, y: start.y + (end.y - start.y) * index / 8 }] })
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] })
  } else {
    await page.mouse.move(start.x, start.y); await page.mouse.down()
    await page.mouse.move(end.x, end.y, { steps: 8 }); await page.mouse.up()
  }
  await expect.poll(async () => Math.abs(Number(await diagram.getAttribute("data-wheel-rotation")))).toBeGreaterThan(0.5)
  await expect(wheel.locator('input[name="feelingWords"]')).toHaveCount(0)
  await wheel.getByRole("button", { name: "Reset view", exact: true }).click()
  await diagram.scrollIntoViewIfNeeded()
  const hopeful = buildFeelingWheelSegments().find((segment) => segment.word === "Hopeful")!
  const angle = (hopeful.start + hopeful.end) / 2, radius = (hopeful.inner + hopeful.outer) / 2
  const tap = await point(Math.cos(angle) * radius, Math.sin(angle) * radius)
  if (isPhone) await page.touchscreen.tap(tap.x, tap.y)
  else await page.mouse.click(tap.x, tap.y)
  await expect(wheel.locator('input[name="feelingWords"][value="Hopeful"]')).toHaveCount(1)
  await expect(wheel.getByRole("button", { name: "Choose Happy", exact: true })).toBeAttached()
  await expect(wheel.getByRole("button", { name: "Choose Optimistic", exact: true })).toBeAttached()
  if (session) {
    const box = (await diagram.boundingBox())!, x = box.x + box.width * 0.55, y = box.y + box.height * 0.5
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ id: 1, x: x - 30, y }, { id: 2, x: x + 30, y }] })
    await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ id: 1, x: x - 50, y: y + 12 }, { id: 2, x: x + 50, y: y + 12 }] })
    // Replacing one finger after a third contact starts a fresh pinch baseline.
    // An unchanged remaining pair must not jump back to the old pair's scale.
    const pair = [{ id: 1, x: x - 50, y: y + 12 }, { id: 2, x: x + 50, y: y + 12 }, { id: 3, x: x + 10, y: y + 30 }]
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: pair })
    const before = Number(await diagram.getAttribute("data-wheel-zoom"))
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: pair.slice(1) })
    await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...pair[1], x: pair[1].x + 1 }, pair[2]] })
    await expect.poll(async () => Math.abs(Number(await diagram.getAttribute("data-wheel-zoom")) - before)).toBeLessThan(0.15)
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] })
    await expect.poll(async () => Number(await diagram.getAttribute("data-wheel-zoom"))).toBeGreaterThan(2.5)
    await expect(wheel.locator('input[name="feelingWords"][value="Hopeful"]')).toHaveCount(1)
    // A cancelled contact must not turn into a choice or strand the next drag.
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ id: 1, x, y }] })
    await session.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] })
    await expect(diagram).toHaveAttribute("data-dragging", "false")
    await expect(wheel.locator('input[name="feelingWords"][value="Hopeful"]')).toHaveCount(1)
    await session.detach()
  }
  await wheel.getByRole("button", { name: "Reset view", exact: true }).click()
  const hopefulButton = wheel.getByRole("button", { name: "Choose Hopeful", exact: true })
  await hopefulButton.press("ArrowUp")
  const optimisticButton = wheel.getByRole("button", { name: "Choose Optimistic", exact: true })
  await expect(optimisticButton).toBeFocused(); await optimisticButton.press("Space")
  await expect(wheel.locator('input[name="feelingWords"][value="Optimistic"]')).toHaveCount(1)
  await wheel.getByRole("button", { name: "Show whole wheel", exact: true }).click()
  await expect(diagram).toHaveAttribute("data-wheel-zoom", "1.000")
  await expect(diagram.locator("path")).toHaveCount(buildFeelingWheelSegments().length)
  await diagram.scrollIntoViewIfNeeded()
  await page.screenshot({ path: testInfo.outputPath("continuous-wheel-overview.png") })
  await wheel.getByRole("button", { name: "Reset view", exact: true }).click()
  await diagram.scrollIntoViewIfNeeded()
  await page.screenshot({ path: testInfo.outputPath("continuous-wheel-reading.png") })
  expect(health.pageErrors).toEqual([]); expect(health.consoleErrors).toEqual([])
  expect(health.failedLocalResponses).toEqual([]); expect(health.forbiddenRequests).toEqual([])
})

test("Wellness Work and Home record observations and self care and ROM shortcut preserves its note", async ({ page }, testInfo) => {
  const health = await capturePageHealth(page, new Set())
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/wellness", { waitUntil: "domcontentloaded" })
  await page.getByRole("button", { name: "Record work context", exact: true }).click()
  await page.getByText("Work situation (optional)", { exact: true }).click()
  await page.getByRole("checkbox", { name: "Repeated reaching", exact: true }).check()
  await page.getByText("Describe the situation (optional)", { exact: true }).click()
  await page.getByLabel("What were you doing?", { exact: true }).fill("Fictional repeated task")
  await page.getByLabel("How were you positioned?", { exact: true }).fill("Fictional held posture")
  await page.getByLabel("How often or for how long?", { exact: true }).fill("During an invented shift")
  await page.getByLabel("What about the setup stood out?", { exact: true }).fill("Fictional work surface height")
  await page.getByLabel("What did you notice, and when?", { exact: true }).fill("An observation without an inferred cause")
  await page.locator("#wellnessSummary").fill("Fictional work reflection")
  await expectToolContentContained(page)
  await page.getByRole("button", { name: /^Add practice / }).click()
  await page.getByRole("button", { name: "All wellness tools", exact: true }).click()
  await page.getByRole("button", { name: "Record home care", exact: true }).click()
  await page.getByText("Home routines and self-care (optional)", { exact: true }).click()
  await page.getByRole("checkbox", { name: "Favorite chair or couch", exact: true }).check()
  await page.getByText("Care you give yourself at home (optional)", { exact: true }).click()
  await page.getByRole("checkbox", { name: "Rest or a change of position", exact: true }).check()
  await page.getByLabel("What did you do for yourself?", { exact: true }).fill("Fictional self-care routine")
  await page.getByLabel("How did it feel afterward?", { exact: true }).fill("A fictional change noticed afterward")
  await page.locator("#wellnessSummary").fill("Fictional home reflection")
  await expectToolContentContained(page)
  await page.screenshot({ path: testInfo.outputPath("home-self-care-phone.png") })
  await page.getByRole("button", { name: /^Add practice / }).click()
  await page.getByRole("button", { name: "All wellness tools", exact: true }).click()
  await page.getByRole("button", { name: "Open timeline", exact: true }).click()
  const work = page.getByText("Fictional work reflection", { exact: true }).locator("..")
  await work.getByText("Work situation details", { exact: true }).click()
  await expect(work).toContainText("Fictional repeated task")
  await expect(work).toContainText("Fictional held posture")
  await expect(work).not.toContainText("Fictional self-care routine")
  const home = page.getByText("Fictional home reflection", { exact: true }).locator("..")
  await home.getByText("Home and self-care details", { exact: true }).click()
  await expect(home).toContainText("Fictional self-care routine")
  await expect(home).toContainText("A fictional change noticed afterward")
  await expect(home).not.toContainText("Fictional repeated task")
  await page.getByRole("button", { name: "All wellness tools", exact: true }).click()
  await page.getByRole("button", { name: "Record work context", exact: true }).click()
  await page.locator("#wellnessCategory").selectOption("rom")
  await page.locator("#wellnessSummary").fill("Fictional unfinished ROM note")
  await page.getByRole("button", { name: "Open range of motion recorder", exact: true }).click()
  await expect(page.locator('[data-recording-focus="range"]')).toBeVisible()
  await page.getByRole("button", { name: "All wellness tools", exact: true }).click()
  await page.getByRole("button", { name: "Record work context", exact: true }).click()
  await expect(page.locator("#wellnessCategory")).toHaveValue("work_context")
  await page.locator("#wellnessCategory").selectOption("rom")
  await expect(page.locator("#wellnessCategory")).toHaveValue("rom")
  await expect(page.locator("#wellnessSummary")).toHaveValue("Fictional unfinished ROM note")
  expect(health.pageErrors).toEqual([]); expect(health.consoleErrors).toEqual([])
  expect(health.failedLocalResponses).toEqual([]); expect(health.forbiddenRequests).toEqual([])
})

test("Wellness Mind Body Context groups lead to private calendar recordings and complete readback", async ({ page },testInfo) => {
  const health=await capturePageHealth(page,new Set())
  await page.setViewportSize({width:390,height:844})
  await page.goto("/wellness",{waitUntil:"domcontentloaded"})
  const mind=page.getByRole("region",{name:"Mind",exact:true}),body=page.getByRole("region",{name:"Body",exact:true}),context=page.getByRole("region",{name:"Context",exact:true})
  await expect(mind.getByRole("button")).toHaveCount(2);await expect(body.getByRole("button")).toHaveCount(6);await expect(context.getByRole("button")).toHaveCount(2)
  await expect(mind.getByRole("button",{name:"Record feelings",exact:true})).toHaveClass(/ml-button-cta/)
  await expect(body.getByRole("button",{name:"Record exercise",exact:true})).toHaveClass(/ml-button-secondary/)
  await expect(body.locator("[data-wellness-tile].ml-button-secondary")).toHaveCount(6)
  await expect(context.getByRole("button",{name:"Record work context",exact:true})).toHaveClass(/ml-button-tone-setup/)
  await page.screenshot({path:testInfo.outputPath("mind-body-context-phone.png")})
  await mind.getByRole("button",{name:"Record feelings",exact:true}).click()
  const form=page.locator("#quick-log form"),back=page.getByRole("button",{name:"All wellness tools",exact:true})
  await form.getByRole("button",{name:"Choose Hopeful",exact:true}).press("Enter")
  await form.locator("#wellnessSummary").fill("Fictional Mind calendar record")
  await form.locator("[data-log-context] > summary").click();await form.locator("#wellnessOccurredAt").fill("2026-11-20T10:30")
  await form.getByRole("button",{name:"Add practice feelings",exact:true}).click()
  await form.locator("#wellnessCategory").selectOption("exercise")
  await form.locator("#exercise-name").fill("Fictional calendar practice");await form.locator("#exercise-context").selectOption("pt")
  await form.locator('[data-draft-section="exercise-sets"] > summary').click();await form.locator("#exercise-set-0-reps").fill("5")
  await form.locator("#wellnessSummary").fill("Fictional Body calendar record")
  await form.locator("[data-log-context] > summary").click();await form.locator("#wellnessOccurredAt").fill("2026-11-20T11:00")
  await form.getByRole("button",{name:"Add practice exercise",exact:true}).click()
  await form.locator("#wellnessCategory").selectOption("sleep")
  await form.locator("#wellnessSummary").fill("Fictional sleep calendar record")
  await form.locator("[data-log-context] > summary").click();await form.locator("#wellnessOccurredAt").fill("2026-11-20T07:30")
  await form.getByRole("button",{name:"Add practice sleep",exact:true}).click()
  await back.click();await page.getByRole("button",{name:"Open my calendar",exact:true}).click()
  const calendar=page.locator("[data-personal-calendar]")
  await calendar.getByLabel("Go to date",{exact:true}).fill("2026-11-20")
  await expect(calendar.locator('[data-calendar-day="2026-11-20"]')).toHaveAccessibleName(/3 items/)
  await expect(calendar.locator('[data-calendar-item="record"]')).toHaveCount(3)
  await calendar.getByRole("button",{name:/^View Exercise at/}).click()
  const dialog=page.getByRole("dialog")
  await expect(dialog).toContainText("Fictional calendar practice");await expect(dialog).toContainText("Physical therapy (PT)");await expect(dialog).toContainText("Set 1: 5 reps")
  await expect(dialog.getByRole("button",{name:"Delete entry",exact:true})).toHaveCount(0)
  await dialog.getByRole("button",{name:"Close",exact:true}).click()
  await calendar.getByRole("button",{name:/^View Feelings at/}).click();await expect(dialog).toContainText("Hopeful")
  await dialog.getByRole("button",{name:"Close",exact:true}).click()
  await calendar.getByLabel("Show",{exact:true}).selectOption("record");await calendar.getByLabel("Recording type",{exact:true}).selectOption("emotion")
  await expect(calendar.locator('[data-calendar-item="record"]')).toHaveCount(1)
  await calendar.getByLabel("Show",{exact:true}).selectOption("all")
  await expect(calendar.locator('[data-calendar-item="record"]')).toHaveCount(3)
  await page.screenshot({path:testInfo.outputPath("personal-calendar-recordings-phone.png")})
  await back.click();await page.getByRole("button",{name:"Open timeline",exact:true}).click()
  await page.getByText("Fictional Body calendar record",{exact:true}).locator("..").getByRole("button",{name:"Delete entry",exact:true}).click()
  await back.click();await page.getByRole("button",{name:"Open my calendar",exact:true}).click()
  await expect(calendar.locator('[data-calendar-item="record"]')).toHaveCount(2)
  expect(health.pageErrors).toEqual([]);expect(health.consoleErrors).toEqual([]);expect(health.failedLocalResponses).toEqual([]);expect(health.forbiddenRequests).toEqual([])
})

test("Wellness personal calendar navigates old dates previews reminders and preserves mobile and private-route boundaries", async ({page},testInfo)=>{
  const health=await capturePageHealth(page,new Set())
  await page.setViewportSize({width:390,height:844})
  await page.goto("/wellness",{waitUntil:"domcontentloaded"})
  await page.getByRole("button",{name:"Record activity",exact:true}).click()
  const form=page.locator("#quick-log form")
  await form.locator("#wellnessSummary").fill("Fictional older calendar record")
  await form.locator("[data-log-context] > summary").click();await form.locator("#wellnessOccurredAt").fill("2025-05-15T10:00")
  await form.getByRole("button",{name:"Add practice activity",exact:true}).click()
  await page.getByRole("button",{name:"All wellness tools",exact:true}).click();await page.getByRole("button",{name:"Open my calendar",exact:true}).click()
  const calendar=page.locator("[data-personal-calendar]"),date=calendar.getByLabel("Go to date",{exact:true})
  await date.fill("2025-05-15");await expect(calendar).toContainText("Fictional older calendar record")
  await expect(calendar.locator('[data-calendar-day="2025-04-30"]')).toHaveAccessibleName(/open this month to view items/)
  await calendar.locator('[data-calendar-day="2025-05-15"]').press("ArrowRight");await expect(date).toHaveValue("2025-05-16")
  await calendar.locator('[data-calendar-day="2025-05-16"]').press("Home");await expect(date).toHaveValue("2025-05-11")
  await calendar.locator('[data-calendar-day="2025-05-11"]').press("PageDown");await expect(date).toHaveValue("2025-06-01")
  await page.getByText("Appointment summaries and reminder settings",{exact:true}).click()
  await page.getByLabel("Reminder",{exact:true}).selectOption("feeling");await page.getByLabel("Time",{exact:true}).fill("14:05")
  await page.getByRole("button",{name:"Add reminder",exact:true}).click()
  await calendar.getByLabel("Show",{exact:true}).selectOption("reminder")
  await expect(calendar.locator('[data-calendar-item="reminder"]')).toHaveCount(1)
  await expect(calendar).toContainText("Feeling check-in");await expect(calendar).toContainText("Current schedule preview")
  await page.getByText("Appointment summaries and reminder settings",{exact:true}).click()
  for(const width of [320,390,780,1280]){await page.setViewportSize({width,height:844});await expectToolContentContained(page)}
  await page.setViewportSize({width:320,height:844});await page.locator("html").evaluate((element)=>{element.style.fontSize="24px"});await expectToolContentContained(page)
  await page.locator("html").evaluate((element)=>{element.style.fontSize="16px"});await page.setViewportSize({width:390,height:844})
  for(const theme of ["light","dark"]){await page.locator("html").evaluate((element,value)=>{element.classList.remove("light","dark");element.classList.add(value)},theme);await calendar.scrollIntoViewIfNeeded();await page.screenshot({path:testInfo.outputPath(`personal-calendar-${theme}.png`)})}
  await page.getByRole("link",{name:"Open Calendar",exact:true}).click()
  await expect(page).toHaveURL(/\/calendar\/personal$/)
  await expect(page.getByRole("heading",{name:"My calendar",exact:true,level:1})).toBeVisible()
  await expect(page.getByText("Sign in to see your private calendar. A practice account is not required.",{exact:true})).toBeVisible()
  await expect(page.getByText("Fictional older calendar record",{exact:true})).toHaveCount(0)
  await expect(page.locator("[data-personal-calendar]")).toHaveCount(0)
  expect(health.pageErrors).toEqual([]);expect(health.consoleErrors).toEqual([]);expect(health.failedLocalResponses).toEqual([]);expect(health.forbiddenRequests).toEqual([])
})

test("Wellness tool launchers wait for scripts before accepting a tap", async ({ page }) => {
  const health = await capturePageHealth(page, new Set())
  let releaseScripts = () => {}
  const scriptsReady = new Promise<void>((resolve) => { releaseScripts = resolve })
  await page.route("**/_next/static/**/*.js", async (route) => { await scriptsReady; await route.fallback() })
  const exercise = page.getByRole("button", { name: "Record exercise", exact: true })
  try {
    // Hold application scripts, not the document: static HTML must never offer
    // a launch action whose client handler is not connected yet.
    await page.goto("/wellness", { waitUntil: "commit" })
    await expect(exercise).toBeVisible(); await expect(exercise).toBeDisabled()
    await expect(page.getByRole("button", { name: "Record feelings", exact: true })).toBeDisabled()
  } finally { releaseScripts() }
  await expect(exercise).toBeEnabled()
  await exercise.click()
  await expect(page.locator("#wellnessCategory")).toHaveValue("exercise")
  await expect(page.locator("#exercise-name")).toBeVisible()
  expect(health.pageErrors).toEqual([]); expect(health.consoleErrors).toEqual([])
  expect(health.failedLocalResponses).toEqual([]); expect(health.forbiddenRequests).toEqual([])
})

test("Wellness hub opens individual tools and keeps an unfinished check-in", async ({ page }, testInfo) => {
  const health = await capturePageHealth(page, new Set())
  await page.setViewportSize({ width: 390, height: 824 })
  await page.goto("/wellness", { waitUntil: "domcontentloaded" })
  await expect(page.getByRole("heading", { name: "Wellness", exact: true, level: 1 })).toBeVisible()
  await expect(page.locator("#wellnessSummary")).toBeHidden()
  await expect(page.locator('[data-wellness-tile]')).toHaveCount(16)
  for (const width of [320, 360, 390, 412, 780, 1280]) {
    await page.setViewportSize({ width, height: 824 })
    await expectToolContentContained(page)
    if (width === 390) await page.screenshot({ path: testInfo.outputPath("wellness-hub-phone.png") })
  }
  await page.setViewportSize({ width: 390, height: 824 })
  const feelings = page.getByRole("button", { name: "Record feelings", exact: true })
  await feelings.click()
  await expect(page.getByRole("heading", { name: "Feelings", exact: true })).toBeFocused()
  await expect(page.locator("#wellnessCategory")).toHaveValue("emotion")
  const note = page.locator("#wellnessSummary")
  await note.fill("Invented check-in to verify navigation")
  await page.getByRole("button", { name: "All wellness tools", exact: true }).click()
  await expect(feelings).toBeFocused()
  await feelings.click()
  await expect(note).toHaveValue("Invented check-in to verify navigation")
  await page.screenshot({ path: testInfo.outputPath("wellness-check-in-phone.png") })
  await page.getByRole("button", { name: /^Add practice / }).click()
  await expect(page.getByRole("status")).toContainText("Practice entry added")
  await page.getByRole("button", { name: "All wellness tools", exact: true }).click()
  await page.getByRole("button", { name: "Open timeline", exact: true }).click()
  await expect(page.getByText("Invented check-in to verify navigation", { exact: true })).toBeVisible()
  await expect(note).toBeHidden()
  await page.getByRole("button", { name: "All wellness tools", exact: true }).click()
  await page.getByRole("button", { name: "Open range of motion", exact: true }).click()
  await expect(page.locator("[data-wellness-tool-title]").first()).toHaveText("Range of motion")
  await expect(note).toBeHidden()
  await page.getByRole("button", { name: "All wellness tools", exact: true }).click()
  await page.getByRole("button", { name: "Open patterns", exact: true }).click()
  await expect(page.locator("[data-wellness-tool-title]").first()).toHaveText("Patterns")
  await page.getByRole("button", { name: "All wellness tools", exact: true }).click()
  await page.getByRole("button", { name: "Open quick actions", exact: true }).click()
  await page.getByRole("link", { name: "Quick Log", exact: true }).click()
  await expect(page).toHaveURL(/\/wellness#quick-log$/)
  await expect(note).toBeVisible()
  await page.getByRole("button", { name: "All wellness tools", exact: true }).click()
  await expect(page).toHaveURL(/\/wellness$/)
  await page.setViewportSize({ width: 320, height: 824 })
  await page.locator("html").evaluate((element) => { element.style.fontSize = "24px" })
  await expectToolContentContained(page)
  await page.getByRole("button", { name: "Record body check-in", exact: true }).click()
  await expectToolContentContained(page)
  await page.getByRole("button", { name: "All wellness tools", exact: true }).click()
  await page.getByRole("button", { name: "Open range of motion", exact: true }).click()
  await expectToolContentContained(page)
  expect(health.pageErrors).toEqual([])
  expect(health.consoleErrors).toEqual([])
  expect(health.failedLocalResponses).toEqual([])
  expect(health.forbiddenRequests).toEqual([])
})

test("Wellness recording type leads and keeps Activity Incident Body and Feeling drafts separate", async ({ page }, testInfo) => {
  const health = await capturePageHealth(page, new Set())
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/wellness#quick-log", { waitUntil: "domcontentloaded" })
  const form = page.locator("#quick-log form"), category = form.locator("#wellnessCategory"), note = form.locator("#wellnessSummary")
  const intensity = form.locator("#wellnessIntensity"), back = page.getByRole("button", { name: "All wellness tools", exact: true })
  await expect(category).toBeVisible()
  await back.click(); await page.getByRole("button", { name: "Record activity", exact: true }).click()
  await expect(category).toHaveValue("activity")
  expect(await form.evaluate((element) => element.querySelector("select,input:not([type=hidden]),textarea,button")?.id)).toBe("wellnessCategory")
  await expect(note).toHaveAccessibleName(/What were you doing/)
  await expect(form.locator("[data-log-body]")).not.toHaveAttribute("open")
  await expect(form.locator("[data-log-sensations]")).not.toHaveAttribute("open")
  await expect(intensity).toHaveValue("")
  await note.fill("Fictional Activity draft")
  await form.locator("[data-log-sensations] > summary").click()
  await intensity.fill("7"); await form.getByRole("checkbox", { name: "achy", exact: true }).check()
  await form.locator("[data-log-context] > summary").click()
  await form.getByRole("checkbox", { name: "work", exact: true }).check()
  await form.locator("#wellnessDuration").fill("45")
  await form.locator("#wellnessOccurredAt").fill("2026-11-20T10:30")
  await form.locator("[data-log-body] > summary").click()
  await form.getByLabel("Zoom into a body part", { exact: true }).selectOption("neck")
  await form.getByRole("button", { name: "General area: Neck", exact: true }).click()

  await category.selectOption("incident")
  await expect(note).toHaveAccessibleName(/What happened/)
  await expect(note).toHaveValue(""); await expect(intensity).toHaveValue("")
  await expect(form.locator('input[name="regions"]')).toHaveCount(0)
  await expect(form.locator("[data-body-scene]")).toHaveCount(0)
  await expect(form.locator("[data-log-context]")).not.toHaveAttribute("open")
  await note.fill("Fictional Incident draft")

  await category.selectOption("body_sensation")
  await expect(note).toHaveAccessibleName(/What do you notice/)
  await expect(note).toHaveValue("")
  await expect(form.locator("[data-log-body]")).toHaveAttribute("open", "")
  await form.getByLabel("Zoom into a body part", { exact: true }).selectOption("head")
  await form.getByRole("button", { name: "General area: Head", exact: true }).click()
  await note.fill("Fictional Body draft")

  await category.selectOption("activity")
  await expect(note).toHaveValue("Fictional Activity draft")
  await expect(intensity).toHaveValue("7")
  await expect(form.getByRole("checkbox", { name: "achy", exact: true })).toBeChecked()
  await expect(form.getByRole("checkbox", { name: "work", exact: true })).toBeChecked()
  await expect(form.locator("#wellnessDuration")).toHaveValue("45")
  await expect(form.locator("#wellnessOccurredAt")).toHaveValue("2026-11-20T10:30")
  await expect(form.locator('input[name="regions"][value="neck"]')).toHaveCount(1)
  await expect(form.locator('input[name="regions"][value="head"]')).toHaveCount(0)
  await expect(form.locator("[data-log-sensations]")).toHaveAttribute("open", "")
  await expectToolContentContained(page)
  await form.locator("[data-log-body] > summary").click()
  await form.locator("[data-log-sensations] > summary").click()
  await form.locator("[data-log-context] > summary").click()
  for (const theme of ["light", "dark"]) {
    await page.locator("html").evaluate((element, value) => { element.classList.remove("light", "dark"); element.classList.add(value) }, theme)
    await category.scrollIntoViewIfNeeded()
    await page.screenshot({ path: testInfo.outputPath(`activity-recording-flow-${theme}.png`) })
  }
  for (const width of [320, 390, 780, 1280]) { await page.setViewportSize({ width, height: 844 }); await expectToolContentContained(page) }
  await page.setViewportSize({ width: 320, height: 844 })
  await page.locator("html").evaluate((element) => { element.style.fontSize = "24px" }); await expectToolContentContained(page)
  await page.locator("html").evaluate((element) => { element.style.fontSize = "16px" })
  await page.setViewportSize({ width: 390, height: 844 })

  await back.click(); await page.getByRole("button", { name: "Record incident", exact: true }).click()
  await expect(category).toHaveValue("incident")
  await expect(note).toHaveValue("Fictional Incident draft")
  await form.getByRole("button", { name: "Add practice incident", exact: true }).click()
  await expect(category).toHaveValue("incident"); await expect(note).toHaveValue("")
  await back.click(); await page.getByRole("button", { name: "Record activity", exact: true }).click()
  await expect(note).toHaveValue("Fictional Activity draft")
  await form.getByRole("button", { name: "Add practice activity", exact: true }).click()
  await expect(category).toHaveValue("activity"); await expect(note).toHaveValue("")
  await expect(form.locator('input[name="regions"]')).toHaveCount(0)

  await category.selectOption("emotion")
  const wheel = form.locator("[data-feelings-wheel]")
  await expect(wheel).toBeVisible()
  await form.locator("[data-log-context] > summary").click()
  await expect(form.locator("#wellnessBodyPosition")).toBeHidden()
  await expect(form.locator("#wellnessMovementEffect")).toBeHidden()
  await expect(form.locator("#wellnessActivityContext")).toBeHidden()
  await form.locator("[data-log-context] > summary").click()
  await wheel.getByRole("button", { name: "Choose Hopeful", exact: true }).press("Enter")
  await note.fill("Fictional Feeling draft")
  await category.selectOption("body_sensation")
  await expect(note).toHaveValue("Fictional Body draft")
  await expect(form.locator('input[name="regions"][value="head"]')).toHaveCount(1)
  await expect(form.locator('input[name="feelingWords"]')).toHaveCount(0)
  await category.selectOption("emotion")
  await expect(note).toHaveValue("Fictional Feeling draft")
  await expect(form.locator('input[name="feelingWords"][value="Hopeful"]')).toHaveCount(1)
  await form.getByRole("button", { name: "Add practice feelings", exact: true }).click()
  await back.click(); await page.getByRole("button", { name: "Open timeline", exact: true }).click()
  for (const text of ["Fictional Activity draft", "Fictional Incident draft", "Fictional Feeling draft"]) await expect(page.getByText(text, { exact: true })).toBeVisible()
  await expect(page.getByText("Fictional Body draft", { exact: true })).toHaveCount(0)
  const activity = page.getByText("Fictional Activity draft", { exact: true }).locator("..")
  await expect(activity).toContainText("achy"); await expect(activity).toContainText("45 min")
  await expect(activity).not.toContainText("Hopeful"); await expect(activity).not.toContainText("head")
  expect(health.pageErrors).toEqual([]); expect(health.consoleErrors).toEqual([])
  expect(health.failedLocalResponses).toEqual([]); expect(health.forbiddenRequests).toEqual([])
})
test("Wellness Exercise retains set drafts and compares recorded weights in their own units", async ({ page }, testInfo) => {
  const health = await capturePageHealth(page, new Set())
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/wellness", { waitUntil: "domcontentloaded" })
  const back = page.getByRole("button", { name: "All wellness tools", exact: true })
  await page.getByRole("button", { name: "Record exercise", exact: true }).click()
  const form = page.locator("#quick-log form"), category = form.locator("#wellnessCategory")
  const save = form.getByRole("button", { name: "Add practice exercise", exact: true })
  await expect(category).toHaveValue("exercise")
  expect(await form.evaluate((element) => element.querySelector("select,input:not([type=hidden]),textarea,button")?.id)).toBe("wellnessCategory")
  await save.click()
  await expect(form.locator("#exercise-name")).toBeFocused()
  expect(await form.locator("#exercise-name").evaluate((input: HTMLInputElement) => input.validity.valueMissing)).toBe(true)
  await form.locator("#exercise-name").fill("Fictional dumbbell row")
  if (!await form.locator('[data-draft-section="exercise-sets"]').evaluate((section: HTMLDetailsElement) => section.open)) await form.locator('[data-draft-section="exercise-sets"] > summary').click()
  await form.locator("#exercise-set-0-reps").fill("8"); await form.locator("#exercise-set-0-weight").fill("10")
  await form.getByRole("button", { name: "+ Add set", exact: true }).click()
  await form.locator("#exercise-set-1-reps").fill("10"); await form.locator("#exercise-set-1-weight").fill("12.5")
  await form.locator('[data-draft-section="exercise-extra"] > summary').click()
  await form.locator("#exercise-equipment").fill("Fictional dumbbell"); await form.locator("#exercise-side").selectOption("left")
  await form.locator("#exercise-effort").fill("5"); await form.locator("#exercise-comfort").fill("7")
  await form.locator("#wellnessSummary").fill("Fictional first row session")
  await form.locator("[data-log-context] > summary").click()
  await form.locator("#wellnessOccurredAt").fill("2026-11-18T10:00")
  await category.selectOption("activity"); await form.locator("#wellnessSummary").fill("Separate fictional Activity draft")
  await category.selectOption("exercise")
  await expect(form.locator("[data-exercise-set]")).toHaveCount(2)
  await expect(form.locator("#exercise-set-1-weight")).toHaveValue("12.5")
  await expect(form.locator("#exercise-name")).toHaveValue("Fictional dumbbell row")
  await expect(form.locator("#exercise-comfort")).toHaveValue("7")
  await expect(form.locator("#wellnessOccurredAt")).toHaveValue("2026-11-18T10:00")
  await expect(form.locator("#wellnessSummary")).toHaveValue("Fictional first row session")
  await save.click(); await expect(page.getByRole("status")).toContainText("Practice entry added")
  // Reuse copies the identity, never last session's completed measurements.
  for (const [unit, weight, at, note] of [["lb", "15", "2026-11-19T10:00", "Fictional second row session"], ["kg", "7", "2026-11-20T08:00", "Fictional metric row session"]]) {
    await form.locator("#exercise-reuse").selectOption({ index: 1 })
    await expect(form.locator("#exercise-name")).toHaveValue("Fictional dumbbell row")
    await expect(form.locator("#exercise-set-0-reps")).toHaveValue("")
    await expect(form.locator("#exercise-set-0-weight")).toHaveValue("")
    await expect(form.locator("#exercise-effort")).toHaveValue("")
    await form.locator("#exercise-loadUnit").selectOption(unit)
    await form.locator("#exercise-set-0-reps").fill("10"); await form.locator("#exercise-set-0-weight").fill(weight)
    await form.locator("#wellnessSummary").fill(note)
    if (!await form.locator("[data-log-context]").getAttribute("open").then((value) => value !== null)) await form.locator("[data-log-context] > summary").click()
    await form.locator("#wellnessOccurredAt").fill(at)
    await save.click(); await expect(form.locator("#exercise-name")).toHaveValue("")
  }
  await back.click(); await page.getByRole("button", { name: "Open exercise progress", exact: true }).click()
  const history = page.locator("[data-exercise-history]")
  await expect(history).toContainText("3 entries · Strength · General exercise · Left")
  await history.locator("#exercise-history-metric").selectOption("weight:lb")
  await expect(history.locator("[data-exercise-latest]")).toContainText("Latest recorded value: 15")
  await expect(history.locator("[data-exercise-latest]")).toContainText("Previous recorded value: 12.5")
  await expect(history.getByRole("img", { name: "Highest recorded weight (lb) over time", exact: true })).toBeVisible()
  await history.locator("#exercise-history-metric").selectOption("weight:kg")
  await expect(history.locator("[data-exercise-latest]")).toContainText("Latest recorded value: 7")
  await expect(history.locator("[data-exercise-latest]")).not.toContainText("Previous recorded value")
  await expect(history).toContainText("Set 2: 10 reps · 12.5 lb")
  await expect(history).toContainText("Comfort: 7/10")
  for (const width of [320, 390, 780, 1280]) { await page.setViewportSize({ width, height: 844 }); await expectToolContentContained(page) }
  await page.setViewportSize({ width: 320, height: 844 }); await page.locator("html").evaluate((element) => { element.style.fontSize = "24px" })
  await expectToolContentContained(page)
  await page.locator("html").evaluate((element) => { element.style.fontSize = "16px" })
  await back.click(); await page.getByRole("button", { name: "Record exercise", exact: true }).click()
  await form.locator("#exercise-reuse").selectOption({ index: 1 })
  await expect(form.locator("#exercise-loadUnit")).toHaveValue("kg")
  await expect(form.locator("#exercise-set-0-weight")).toHaveValue("")
  for (const width of [320, 390, 780, 1280]) { await page.setViewportSize({ width, height: 844 }); await expectToolContentContained(page) }
  await page.setViewportSize({ width: 320, height: 844 }); await page.locator("html").evaluate((element) => { element.style.fontSize = "24px" })
  await expectToolContentContained(page)
  await page.locator("html").evaluate((element) => { element.style.fontSize = "16px" })
  await page.setViewportSize({ width: 390, height: 844 })
  for (const theme of ["light", "dark"]) {
    await page.locator("html").evaluate((element, value) => { element.classList.remove("light", "dark"); element.classList.add(value) }, theme)
    await category.scrollIntoViewIfNeeded(); await page.screenshot({ path: testInfo.outputPath(`exercise-recorder-${theme}.png`) })
  }
  await back.click(); await page.getByRole("button", { name: "Open timeline", exact: true }).click()
  const first = page.getByText("Fictional first row session", { exact: true }).locator("..")
  await expect(first).toContainText("Set 1: 8 reps · 10 lb"); await expect(first).toContainText("Set 2: 10 reps · 12.5 lb")
  await expect(first).not.toContainText("Intensity")
  await back.click(); await page.getByRole("button", { name: "Record activity", exact: true }).click()
  await expect(form.locator("#wellnessSummary")).toHaveValue("Separate fictional Activity draft")
  expect(health.pageErrors).toEqual([]); expect(health.consoleErrors).toEqual([])
  expect(health.failedLocalResponses).toEqual([]); expect(health.forbiddenRequests).toEqual([])
})

test("Wellness Exercise supports PT OT holds task practice and cardio with separate histories and deletion", async ({ page }) => {
  const health = await capturePageHealth(page, new Set())
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/wellness", { waitUntil: "domcontentloaded" })
  const back = page.getByRole("button", { name: "All wellness tools", exact: true })
  await page.getByRole("button", { name: "Record exercise", exact: true }).click()
  const form = page.locator("#quick-log form"), save = form.getByRole("button", { name: "Add practice exercise", exact: true })
  await form.locator("#exercise-name").fill("Fictional hand practice")
  await form.locator("#exercise-kind").selectOption("functional"); await form.locator("#exercise-context").selectOption("ot")
  if (!await form.locator('[data-draft-section="exercise-sets"]').evaluate((section: HTMLDetailsElement) => section.open)) await form.locator('[data-draft-section="exercise-sets"] > summary').click()
  await form.locator("#exercise-loadUnit").selectOption("other")
  await expect(form.locator("#exercise-set-0-weight")).toBeHidden()
  await form.locator("#exercise-set-0-reps").fill("-1"); await save.click()
  await expect(form.locator("#exercise-set-0-reps")).toBeFocused()
  expect(await form.locator("#exercise-set-0-reps").evaluate((input: HTMLInputElement) => input.validity.rangeUnderflow)).toBe(true)
  await form.locator("#exercise-set-0-reps").fill("5"); await form.locator("#exercise-set-0-holdSeconds").fill("12")
  await form.locator('[data-draft-section="exercise-extra"] > summary').click()
  await form.locator("#exercise-equipment").fill("Fictional putty"); await form.locator("#exercise-side").selectOption("right")
  await form.locator("#exercise-comfort").fill("8"); await form.locator("#wellnessSummary").fill("Fictional OT session")
  await save.click(); await expect(form.locator("#exercise-name")).toHaveValue("")
  await form.locator("#exercise-reuse").selectOption({ index: 1 })
  await form.locator("#exercise-context").selectOption("pt")
  await form.locator("#exercise-set-0-reps").fill("7"); await form.locator("#exercise-set-0-holdSeconds").fill("8")
  await form.locator("#wellnessSummary").fill("Fictional PT session"); await save.click()
  await form.locator("#exercise-name").fill("Fictional walk"); await form.locator("#exercise-kind").selectOption("cardio")
  await form.locator("#exercise-context").selectOption("pt")
  await form.locator("#exercise-durationMinutes").fill("2.5"); await form.locator("#exercise-distance").fill("100")
  await form.locator("#exercise-distanceUnit").selectOption("m")
  await form.locator("#wellnessSummary").fill("Fictional walking session"); await save.click()
  await back.click(); await page.getByRole("button", { name: "Open exercise progress", exact: true }).click()
  const history = page.locator("[data-exercise-history]"), choice = history.locator("#exercise-history-choice")
  await expect(choice.locator("option")).toHaveCount(3)
  await choice.selectOption({ label: "Fictional hand practice · Everyday-task practice · Occupational therapy (OT) · right · Fictional putty" })
  await expect(history).toContainText("Set 1: 5 reps · 12 second hold")
  await expect(history).toContainText("Comfort: 8/10"); await expect(history).toContainText("Band / other resistance")
  await history.locator("#exercise-history-metric").selectOption("hold")
  await expect(history.getByRole("img", { name: "Longest hold (seconds) over time", exact: true })).toBeVisible()
  await choice.selectOption({ label: "Fictional hand practice · Everyday-task practice · Physical therapy (PT) · right · Fictional putty" })
  await expect(history).toContainText("Set 1: 7 reps · 8 second hold"); await expect(history).not.toContainText("Fictional OT session")
  await choice.selectOption({ label: "Fictional walk · Cardio · Physical therapy (PT)" })
  await expect(history).toContainText("Time: 2.5 minutes"); await expect(history).toContainText("Distance: 100 meters")
  await expect(history).not.toContainText("Set 1:")
  await history.locator("#exercise-history-metric").selectOption("distance:m")
  await expect(history.locator("[data-exercise-latest]")).toContainText("Latest recorded value: 100")
  await expectToolContentContained(page)
  await back.click(); await page.getByRole("button", { name: "Open timeline", exact: true }).click()
  await page.getByText("Fictional OT session", { exact: true }).locator("..").getByRole("button", { name: "Delete entry", exact: true }).click()
  await back.click(); await page.getByRole("button", { name: "Open exercise progress", exact: true }).click()
  await expect(choice.locator("option")).toHaveCount(2)
  await expect(choice.locator("option").filter({ hasText: "Occupational therapy" })).toHaveCount(0)
  expect(health.pageErrors).toEqual([]); expect(health.consoleErrors).toEqual([])
  expect(health.failedLocalResponses).toEqual([]); expect(health.forbiddenRequests).toEqual([])
})

test("Business Income Planner retains itemized expenses, reserves and guided wage comparison", async ({ page }, testInfo) => {
  const health = await capturePageHealth(page, new Set())
  await page.setViewportSize({ width: 390, height: 824 })
  await page.addInitScript(() => {
    const key = "massagelab-business-income-planner-income-v1"
    if (localStorage.getItem(key) === null) localStorage.setItem(key, JSON.stringify({
      desiredTakeHomeIncome: 60000, monthlyFixedExpenses: 1000, perSessionVariableCost: 6,
      taxSetAsideRate: 0.25, vacationDays: 10, holidayDays: 6, personalDays: 5,
      weeklyAdminHours: 4, averageSessionMinutes: 60,
      weekdayClientHours: { monday: 4, tuesday: 4, wednesday: 4, thursday: 4, friday: 4 },
    }))
  })
  await page.goto("/tools/business-planner/income", { waitUntil: "domcontentloaded" })
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("massagelab-business-income-planner-income-v1") ?? "{}").monthlyExpenseItems?.length === 1)
  await selectPlannerStep(page, 1)
  const monthly = page.locator('[data-income-expenses="monthly-expenses"]')
  const yearly = page.locator('[data-income-expenses="yearly-expenses"]')
  const session = page.locator('[data-income-expenses="session-expenses"]')
  const reserves = page.locator('[data-income-expenses="personal-reserves"]')
  await expect(monthly.getByLabel("Amount", { exact: true })).toHaveValue("1000")
  await expect(session.getByLabel("Amount", { exact: true })).toHaveValue("6")
  await monthly.getByLabel("Name", { exact: true }).fill("Rent")
  await monthly.getByLabel("Amount", { exact: true }).fill("1100")
  await monthly.getByRole("button", { name: "Add monthly expense", exact: true }).click()
  await expect(monthly.getByLabel("Name", { exact: true }).last()).toBeFocused()
  await monthly.getByLabel("Name", { exact: true }).last().fill("Phone")
  await monthly.getByLabel("Amount", { exact: true }).last().fill("50")
  await yearly.getByRole("button", { name: "Add yearly expense", exact: true }).click()
  await yearly.getByLabel("Name", { exact: true }).fill("Licensing and education")
  await yearly.getByLabel("Amount", { exact: true }).fill("1200")
  await session.getByLabel("Name", { exact: true }).fill("Supplies")
  await session.getByRole("button", { name: "Add session cost", exact: true }).click()
  await session.getByLabel("Name", { exact: true }).last().fill("Laundry")
  await session.getByLabel("Amount", { exact: true }).last().fill("100")
  await session.getByLabel("Frequency", { exact: true }).last().selectOption("month")
  await session.getByRole("button", { name: "Add session cost", exact: true }).click()
  await session.getByLabel("Name", { exact: true }).last().fill("Linen")
  await session.getByLabel("Amount", { exact: true }).last().fill("600")
  await session.getByLabel("Frequency", { exact: true }).last().selectOption("year")
  await reserves.getByRole("button", { name: "Health insurance", exact: true }).click()
  await reserves.getByLabel("Amount", { exact: true }).last().fill("300")
  await reserves.getByRole("button", { name: "Retirement savings", exact: true }).click()
  await reserves.getByLabel("Amount", { exact: true }).last().fill("2400")
  await reserves.getByLabel("Frequency", { exact: true }).last().selectOption("year")
  // Explicit frequencies survive reload; legacy scalar totals are derived only.
  await page.waitForFunction(() => {
    const draft = JSON.parse(localStorage.getItem("massagelab-business-income-planner-income-v1") ?? "{}")
    return draft.personalReserveItems?.[1]?.frequency === "year" && draft.monthlyFixedExpenses === 1150
  })
  await page.reload({ waitUntil: "domcontentloaded" })
  await revealPlannerControl(page, page.getByLabel("Desired yearly take-home", { exact: true }))
  await expect(monthly.getByLabel("Name", { exact: true }).last()).toHaveValue("Phone")
  await expect(yearly.getByLabel("Amount", { exact: true })).toHaveValue("1200")
  await expect(session.getByLabel("Frequency", { exact: true }).last()).toHaveValue("year")
  await expect(reserves.getByLabel("Amount", { exact: true }).last()).toHaveValue("2400")
  await selectPlannerStep(page, 2)
  await page.getByLabel("Intake and turnaround minutes per appointment", { exact: true }).fill("15")
  await expect(page.getByLabel("Monday hands-on massage hours", { exact: true })).toHaveAccessibleDescription(/hands-on massage/)
  await selectPlannerStep(page, 3)
  const revenue = page.getByText("Gross revenue needed", { exact: true }).locator("..").locator("p").nth(1)
  await expect(revenue).toHaveText("$110,680")
  await expect(page.getByText("Total work hours / week", { exact: true }).locator("..")).toContainText("29")
  const barLabels = page.locator(".recharts-label-list .recharts-label")
  await expect(barLabels).toHaveCount(4)
  await expect(barLabels).toHaveText(["$219.88", "$158.77", "$124.82", "$112.94"])
  for (const label of await barLabels.all()) await expect(label).toBeVisible()
  await page.locator("[data-chart]").screenshot({ path: testInfo.outputPath("income-price-labels-phone.png") })
  await page.getByRole("button", { name: "Add an employee wage in Step 2", exact: true }).click()
  const wage = page.getByLabel("Optional employee hourly wage", { exact: true })
  await expect(wage).toBeFocused()
  await expect(wage).toBeInViewport({ ratio: 1 })
  await wage.fill("35")
  await monthly.getByRole("button", { name: "Remove Phone", exact: true }).click()
  await expect(monthly.getByLabel("Name", { exact: true })).toHaveCount(1)
  await selectPlannerStep(page, 3)
  await expect(revenue).toHaveText("$110,080")
  await expect(page.getByText("Employee annual gross", { exact: true }).locator("..")).toContainText("$34,300")
  for (const viewport of [{ width: 320, height: 824 }, { width: 390, height: 824 }, { width: 780, height: 360 }, { width: 1280, height: 900 }]) {
    await page.setViewportSize(viewport)
    for (const step of [1, 2, 3]) {
      await selectPlannerStep(page, step)
      await expectToolContentContained(page)
    }
  }
  await page.setViewportSize({ width: 320, height: 824 })
  await page.locator("html").evaluate((element) => { element.style.fontSize = "24px" })
  for (const step of [1, 2, 3]) {
    await selectPlannerStep(page, step)
    await expectToolContentContained(page)
  }
  await page.locator("html").evaluate((element) => { element.style.fontSize = "16px" })
  await page.setViewportSize({ width: 390, height: 824 })
  await selectPlannerStep(page, 1)
  await monthly.getByRole("button", { name: "Remove Rent", exact: true }).click()
  await expect(monthly.getByLabel("Amount", { exact: true })).toHaveCount(0)
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("massagelab-business-income-planner-income-v1") ?? "{}").monthlyExpenseItems?.length === 0)
  await page.reload({ waitUntil: "domcontentloaded" })
  await revealPlannerControl(page, page.getByLabel("Desired yearly take-home", { exact: true }))
  await expect(monthly.getByLabel("Amount", { exact: true })).toHaveCount(0)
  await expect(monthly.locator("summary")).toContainText("$0.00 / month")
  expect(health.pageErrors).toEqual([])
  expect(health.consoleErrors).toEqual([])
  expect(health.failedLocalResponses).toEqual([])
  expect(health.forbiddenRequests).toEqual([])
})

test("Business Income Planner keeps phone fields and results within the viewport", async ({ page }, testInfo) => {
  const health = await capturePageHealth(page, new Set())
  await page.goto("/tools/business-planner/income", { waitUntil: "domcontentloaded" })
  await expect(page.getByRole("heading", { name: "Business Income Planner", exact: true, level: 1 })).toBeVisible()
  await page.waitForFunction(() => localStorage.getItem("massagelab-business-income-planner-income-v1") !== null)
  for (const viewport of [{ width: 320, height: 714 }, { width: 360, height: 714 }, { width: 390, height: 714 }, { width: 412, height: 824 }, { width: 780, height: 360 }, { width: 1280, height: 900 }]) {
    await page.setViewportSize(viewport)
    await selectPlannerStep(page, 0)
    for (const scenario of ["Starting part-time", "Growing solo practice", "Full schedule", "Custom"]) {
      const preset = page.getByRole("button", { name: new RegExp(`^${scenario}`) })
      await preset.click()
      await expect(preset).toHaveAttribute("aria-pressed", "true")
      // Check nested scroll owners too: body width alone misses a grid that
      // scrolls sideways inside the app's independent content scroller.
      await expect.poll(() => page.locator(".ml-app-content").evaluate((root) => [root, ...root.querySelectorAll("div, section, article, button, input, p, label, h1")]
        .filter((element) => element.clientWidth > 0 && element.getClientRects().length > 0 && element.scrollWidth > element.clientWidth + 1)
        .slice(0, 8).map((element) => ({ tag: element.tagName, width: element.clientWidth, overflow: element.scrollWidth - element.clientWidth, text: element.textContent?.slice(0, 50) })))).toEqual([])
    }
    await selectPlannerStep(page, 1)
    if (viewport.width <= 412) {
      await page.evaluate(() => document.querySelector(".ml-app-scroll")?.scrollTo(0, 0))
      const header = await page.locator("[data-income-header]").boundingBox()
      expect(header).not.toBeNull()
      expect(header!.height).toBeLessThanOrEqual(180)
      await expect(page.getByLabel("Desired yearly take-home", { exact: true })).toBeInViewport({ ratio: 1 })
    }
    if (viewport.width === 390) {
      await selectPlannerStep(page, 0)
      await page.getByRole("button", { name: "Growing solo practice", exact: true }).click()
      await expect(page.getByLabel("Desired yearly take-home", { exact: true })).toHaveValue("60000")
      await selectPlannerStep(page, 1)
      await page.evaluate(() => document.querySelector(".ml-app-scroll")?.scrollTo(0, 0))
      await page.screenshot({ path: testInfo.outputPath("income-planner-phone.png") })
    }
  }
  await page.setViewportSize({ width: 320, height: 714 })
  await page.locator("html").evaluate((element) => { element.style.fontSize = "24px" })
  await expect.poll(() => page.locator(".ml-app-content").evaluate((root) => [root, ...root.querySelectorAll("div, button, input, p, label, h1")]
    .filter((element) => element.clientWidth > 0 && element.getClientRects().length > 0 && element.scrollWidth > element.clientWidth + 1)
    .map((element) => element.tagName))).toEqual([])
  await page.getByLabel("Desired yearly take-home", { exact: true }).fill("65000")
  await expect(page.getByLabel("Desired yearly take-home", { exact: true })).toHaveValue("65000")
  expect(health.pageErrors).toEqual([])
  expect(health.consoleErrors).toEqual([])
  expect(health.failedLocalResponses).toEqual([])
  expect(health.forbiddenRequests).toEqual([])
})

test("Business Income Planner preserves calculations and the device draft through its compact layout", async ({ page }, testInfo) => {
  const health = await capturePageHealth(page, new Set())
  await page.setViewportSize({ width: 390, height: 714 })
  await page.goto("/tools/business-planner/income", { waitUntil: "domcontentloaded" })
  await page.waitForFunction(() => localStorage.getItem("massagelab-business-income-planner-income-v1") !== null)
  const income = page.getByLabel("Desired yearly take-home", { exact: true })
  await revealPlannerControl(page, income)
  await expect(income).toHaveValue("60000")
  const revenue = page.getByText("Gross revenue needed", { exact: true }).locator("..").locator("p").nth(1)
  await selectPlannerStep(page, 3)
  await expect(revenue).toHaveText("$97,880")
  await selectPlannerStep(page, 1)
  await income.fill("65000")
  await selectPlannerStep(page, 3)
  await expect(revenue).toHaveText("$104,547")
  await page.reload({ waitUntil: "domcontentloaded" })
  await revealPlannerControl(page, income)
  await expect(income).toHaveValue("65000")
  await selectPlannerStep(page, 3)
  await expect(revenue).toHaveText("$104,547")
  await expect(page.getByText("Saved on this device", { exact: true })).toBeVisible()
  await page.getByText("How this planner works", { exact: true }).click()
  await expect(page.getByText(/Change the assumptions below to see how schedule/)).toBeVisible()
  await page.getByText("How this planner works", { exact: true }).click()
  await page.getByText("What this means", { exact: true }).scrollIntoViewIfNeeded()
  await page.screenshot({ path: testInfo.outputPath("income-planner-results-phone.png") })
  await page.getByRole("link", { name: "Back to business tools", exact: true }).click()
  await expect(page).toHaveURL(/\/tools\/business-planner$/)
  expect(health.pageErrors).toEqual([])
  expect(health.consoleErrors).toEqual([])
  expect(health.failedLocalResponses).toEqual([])
  expect(health.forbiddenRequests).toEqual([])
})

test("Clock keeps bold Digital digits centered in its available stage", async ({ page }, testInfo) => {
  const previewNames = ["massage-lab-hole-vertical", "massage-lab-stars-vertical", "massage-lab-moving-gradient-vertical"]
  const allowedExternalUrls = new Set([externalFontUrl, ...previewNames.map(chimerPreviewUrl)])
  const health = await capturePageHealth(page, allowedExternalUrls)
  await installExternalFontFixture(page, allowedExternalUrls)
  await installChimerPreviewFixtures(page, previewNames, allowedExternalUrls)
  await page.addInitScript(() => {
    const seconds = sessionStorage.getItem("qa-clock-seconds") === "true"
    localStorage.setItem("massagelab-chimer-settings", JSON.stringify({
      clockFontFamily: "digital", timeFormat: seconds ? "24h" : "12h",
      showCurrentTimeSeconds: seconds, clockShadowEnabled: false, clockGlowEnabled: false,
    }))
  })
  await page.goto("/clock", { waitUntil: "domcontentloaded" })
  const primary = page.getByTestId("running-current-time")
  await expect(primary).toHaveAttribute("data-immersive-primary-display", "true")
  await expect.poll(() => page.evaluate(() => [...document.fonts].some((face) => face.family === "Digital Clock" && face.weight === "700" && face.status === "loaded"))).toBe(true)

  for (const seconds of [false, true]) {
    if (seconds) {
      await page.evaluate(() => sessionStorage.setItem("qa-clock-seconds", "true"))
      await page.reload({ waitUntil: "domcontentloaded" })
      await expect(primary).toContainText(/\d{2}:\d{2}:\d{2}/)
    } else {
      await expect(primary).toContainText(/AM|PM/)
    }
    for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 714 }, { width: 780, height: 360 }, { width: 1280, height: 900 }]) {
      await page.setViewportSize(viewport)
      await expect(primary).toHaveCSS("font-weight", "700")
      await expect(primary).toHaveCSS("font-family", /Digital Clock/)
      await expect.poll(() => primary.evaluate((element) => {
        const content = element.querySelector("[data-display-content='true']")!.getBoundingClientRect()
        const style = getComputedStyle(element)
        const intendedCenter = (Number.parseFloat(style.top) + innerHeight - Number.parseFloat(style.bottom)) / 2
        return Math.abs(content.top + content.height / 2 - intendedCenter)
      })).toBeLessThanOrEqual(2)
      if (!seconds && viewport.width === 390) await page.screenshot({ path: testInfo.outputPath("clock-centered-phone.png") })
      if (seconds && viewport.width === 780) await page.screenshot({ path: testInfo.outputPath("clock-bold-landscape.png") })
    }
  }
  expect(health.pageErrors).toEqual([])
  expect(health.consoleErrors).toEqual([])
  expect(health.failedLocalResponses).toEqual([])
})

test("Timer setup and running timer use centered bold Digital digits", async ({ page }, testInfo) => {
  const previewNames = ["massage-lab-hole-vertical", "massage-lab-stars-vertical", "massage-lab-moving-gradient-vertical"]
  const allowedExternalUrls = new Set([externalFontUrl, ...previewNames.map(chimerPreviewUrl)])
  const health = await capturePageHealth(page, allowedExternalUrls)
  await installExternalFontFixture(page, allowedExternalUrls)
  await installChimerPreviewFixtures(page, previewNames, allowedExternalUrls)
  await page.goto("/chimer", { waitUntil: "domcontentloaded" })
  const duration = page.getByRole("group", { name: /^Session duration:/ })
  await expect(duration).toBeVisible()
  await expect.poll(() => page.evaluate(() => [...document.fonts].some((face) => face.family === "Digital Clock" && face.weight === "700" && face.status === "loaded"))).toBe(true)
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 714 }, { width: 746, height: 284 }, { width: 1280, height: 900 }]) {
    await page.setViewportSize(viewport)
    await expect(duration).toHaveCSS("font-weight", "700")
    await expect(duration).toHaveCSS("font-family", /Digital Clock/)
    for (const digit of await duration.getByRole("button").all()) {
      const alignment = await digit.evaluate((element) => {
        const box = element.getBoundingClientRect()
        const parent = element.parentElement!.getBoundingClientRect()
        return { offset: Math.abs(box.top + box.height / 2 - parent.top - parent.height / 2), contained: box.top >= parent.top && box.bottom <= parent.bottom }
      })
      expect(alignment.offset).toBeLessThanOrEqual(1)
      expect(alignment.contained).toBe(true)
    }
    if (viewport.width === 390) await page.screenshot({ path: testInfo.outputPath("timer-setup-centered-phone.png") })
  }
  await page.setViewportSize({ width: 390, height: 714 })
  await page.getByRole("button", { name: "Increase minutes", exact: true }).click()
  for (let step = 0; step < 4; step += 1) await page.getByRole("button", { name: "Continue", exact: true }).click()
  await page.getByRole("button", { name: "Start Chimer", exact: true }).click()
  const timer = page.getByTestId("running-timer-clock")
  await expect(timer).toHaveAttribute("data-immersive-primary-display", "true")
  await expect(timer).toHaveCSS("font-weight", "700")
  await expect.poll(() => timer.evaluate((element) => {
    const content = element.querySelector("[data-display-content='true']")!.getBoundingClientRect()
    const box = element.getBoundingClientRect()
    return Math.abs(content.top + content.height / 2 - box.top - box.height / 2)
  })).toBeLessThanOrEqual(2)
  await page.getByRole("button", { name: "End timer", exact: true }).click()
  expect(health.pageErrors).toEqual([])
  expect(health.consoleErrors).toEqual([])
  expect(health.failedLocalResponses).toEqual([])
})

test("mobile primary bar keeps lighting controls available with a compact theme toggle", async ({ page }) => {
  const atmosphereFixtureUrls = new Set(atmosphereSampleIndexFixtureUrls)
  const health = await capturePageHealth(page, atmosphereFixtureUrls)
  await installAtmosphereFixtures(page, atmosphereFixtureUrls)

  await page.setViewportSize({ width: 319, height: 932 })
  await page.goto("/music", { waitUntil: "domcontentloaded" })

  const narrowThemePicker = page.getByRole("group", { name: /^Theme$/i })
  const narrowThemeToggle = narrowThemePicker.getByRole("button", { name: /^Use (light|dark) theme$/i })

  await expect(narrowThemePicker).toBeVisible()
  await expect(narrowThemeToggle).toBeVisible()
  await expect(narrowThemePicker.getByRole("radio")).toHaveCount(0)
  await expect(page.getByRole("link", { name: /^Open music$/i })).toBeVisible()
  await expect(page.getByRole("link", { name: /^Open clock$/i })).toBeVisible()
  await expect(page.getByRole("link", { name: /^Open calendar$/i })).toBeVisible()

  await page.setViewportSize({ width: 390, height: 932 })

  const themePicker = page.getByRole("group", { name: /^Theme$/i })
  const themeToggle = themePicker.getByRole("button", { name: /^Use (light|dark) theme$/i })

  await expect(themePicker).toBeVisible()
  await expect(themeToggle).toBeVisible()
  const initialThemeLabel = await themeToggle.getAttribute("aria-label")
  expect(initialThemeLabel).toMatch(/^Use (light|dark) theme$/)
  await themeToggle.click()
  await expect(themeToggle).toHaveAttribute(
    "aria-label",
    initialThemeLabel === "Use light theme" ? "Use dark theme" : "Use light theme",
  )

  expect(health.pageErrors, "uncaught page errors").toEqual([])
  expect(health.failedExternalRequests, "failed external requests").toEqual([])
  expect(health.unexpectedExternalRequests, "unexpected external requests").toEqual([])
  expect(health.consoleErrors, "browser console errors").toEqual([])
  expect(health.failedLocalResponses, "local 4xx/5xx responses").toEqual([])
  expect(health.forbiddenRequests, "anonymous account sync requests").toEqual([])
})

test("anonymous homepage presents a compact launcher and tool directory", async ({ page }) => {
  const health = await capturePageHealth(page, new Set())
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await expect(page.getByRole("heading", { level: 1, name: "AtmoShaper", exact: true, includeHidden: false })).toBeVisible()
  await expect(page.getByRole("heading", { level: 2, name: "Start here", exact: true, includeHidden: false })).toBeVisible()
  const launcher = page.getByTestId("home-launcher")
  await expect(launcher.getByRole("link", { name: "Music", exact: true })).toHaveAttribute("href", "/music")
  await expect(launcher.getByRole("link", { name: "Clock & timer", exact: true })).toHaveAttribute("href", "/clock")
  await expect(launcher.getByRole("link", { name: "My Calendar", exact: true })).toHaveAttribute("href", "/calendar/personal")
  await page.getByRole("button", { name: "All tools", exact: true }).click()
  const directory = page.getByRole("dialog", { name: "All tools", exact: true })
  await expect(directory.getByRole("link", { name: "Practice Calendar", exact: true })).toHaveAttribute("href", "/calendar?setup=practice")
  await expect(directory.getByRole("link", { name: "Flashcards", exact: true })).toHaveAttribute("href", "/education/flashcards")
  await directory.getByRole("button", { name: "Close", exact: true }).click()
  await page.getByRole("button", { name: "Use dashboard", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Your tools", exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole("heading", { name: "Your tools", exact: true })).toBeVisible()
  expect(health.pageErrors).toEqual([])
  expect(health.unexpectedExternalRequests).toEqual([])
  expect(health.consoleErrors).toEqual([])
  expect(health.failedLocalResponses).toEqual([])
  expect(health.forbiddenRequests).toEqual([])
})

test("Roadmap presents an unordered product portfolio", async ({ page }) => {
  const health = await capturePageHealth(page, new Set())

  await page.goto("/roadmap", { waitUntil: "domcontentloaded" })

  await expect(page.getByRole("heading", { level: 1, name: "Where AtmoShaper is going" })).toBeVisible()
  await expect(page.getByRole("region", { name: "Shared foundation" })).toBeVisible()
  await expect(page.getByRole("region", { name: "Product portfolio" })).toBeVisible()

  const viewportWidth = page.viewportSize()?.width ?? 0
  const portfolioBox = await page.locator("[aria-labelledby='product-portfolio-heading']").boundingBox()
  expect((portfolioBox?.x ?? 0) + (portfolioBox?.width ?? 0)).toBeLessThanOrEqual(viewportWidth + 1)

  for (const name of [
    "Education & Anatomy",
    "Wellness Tools",
    "Therapist & Practice Tools",
    "Local-First Records",
    "Audio & Ambient Experiences",
  ]) {
    await expect(page.getByRole("heading", { level: 3, name })).toBeVisible()
  }

  await expect(page.getByText("Available now", { exact: true })).toHaveCount(5)
  await expect(page.getByText("Long-term direction", { exact: true })).toHaveCount(5)
  await expect(page.getByText(/not a release order/i)).toBeVisible()
  await expect(page.getByRole("link", { name: "Explore tools" }).first()).toHaveAttribute("href", "/tools")
  await expect(page.getByRole("link", { name: "View memberships" }).first()).toHaveAttribute("href", "/pricing")
  await expect(page.getByRole("link", { name: "One-time support" }).first()).toHaveAttribute(
    "href",
    "/pricing#one-time-support",
  )
  await expect(page.getByRole("heading", { name: "Recently shipped" })).toHaveCount(0)
  await expect(page.getByRole("heading", { name: "Current alpha focus" })).toHaveCount(0)

  await page.goto("/pricing#one-time-support", { waitUntil: "domcontentloaded" })
  await expect(page.locator("#one-time-support")).toBeVisible()

  expect(health.pageErrors, "uncaught page errors").toEqual([])
  expect(health.unexpectedExternalRequests, "unexpected external requests").toEqual([])
  expect(health.consoleErrors, "browser console errors").toEqual([])
  expect(health.failedLocalResponses, "local 4xx/5xx responses").toEqual([])
  expect(health.forbiddenRequests, "anonymous account sync requests").toEqual([])
})

test("Atmosphere visualizer action retains selected station across client routes", async ({ page }) => {
  const previewNames = [
    "massage-lab-moving-gradient-vertical",
    "massage-lab-stars-vertical",
    "massage-lab-hole-vertical",
    "massage-lab-retro-grid-vertical",
  ]
  const allowedExternalUrls = new Set([
    externalFontUrl,
    ...atmosphereSampleIndexFixtureUrls,
    ...previewNames.map(chimerPreviewUrl),
  ])
  const health = await capturePageHealth(page, allowedExternalUrls)
  await installExternalFontFixture(page, allowedExternalUrls)
  await installAtmosphereFixtures(page, allowedExternalUrls)
  await installChimerPreviewFixtures(page, previewNames, allowedExternalUrls)
  const origin = "/music?task8=public-route"

  await page.goto(origin, { waitUntil: "domcontentloaded" })
  await expect(page.getByRole("heading", {
    level: 1,
    name: "Atmosphere",
    exact: true,
    includeHidden: false,
  })).toBeAttached()
  await expect(page.getByRole("heading", { name: /Treatment room starters/i })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Breathing guide" })).toHaveCount(0)
  await expect(page.getByRole("region", { name: "Atmosphere audio stations" }))
    .toHaveAttribute("data-music-storage-status", "available")
  await centerCarouselItem(page, "mlab-proof-drone", "Next station")
  await page.getByRole("button", { name: /^Play Drone$/i }).click()

  const playerToolbar = page.getByTestId("music-player-toolbar")
  await expect(playerToolbar).toBeVisible()
  await expect(playerToolbar).toHaveAttribute("data-placement", "bottom")
  const playerToolbarBox = await playerToolbar.boundingBox()
  expect(playerToolbarBox?.width ?? 0).toBeGreaterThan(320)

  await expect(playerToolbar.getByText("Drone", { exact: true })).toBeVisible()
  await expect(page.getByText(/Playing|Preparing audio|Preparing station/i).last()).toBeVisible()
  const overflow = await playerToolbar.evaluate((node) => ({
    clientWidth: node.clientWidth,
    scrollWidth: node.scrollWidth,
  }))
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1)

  const identityBox = await playerToolbar.getByTestId("music-player-toolbar-identity").boundingBox()
  const controlsBox = await playerToolbar.getByTestId("music-player-toolbar-controls").boundingBox()
  if ((page.viewportSize()?.width ?? 0) < 640) {
    expect(controlsBox?.y ?? 0).toBeGreaterThan(identityBox?.y ?? 0)
  }

  for (const name of ["Previous station", "Stop", "Next station", "Background", "Minimize"]) {
    await expect(playerToolbar.getByRole(name === "Background" ? "link" : "button", { name, exact: true })).toBeVisible()
  }

  await playerToolbar.getByRole("button", { name: "Minimize", exact: true }).click()
  await expect(playerToolbar).toHaveAttribute("data-collapsed", "true")
  await expect(playerToolbar.getByRole("link", { name: "Background", exact: true })).toHaveCount(0)
  await expect(playerToolbar.getByRole("button", { name: "Stop", exact: true })).toBeVisible()
  await expect(playerToolbar.getByRole("button", { name: "Expand", exact: true })).toBeVisible()
  await playerToolbar.getByRole("button", { name: "Expand", exact: true }).click()

  await playerToolbar.getByRole("link", { name: "Background", exact: true }).click()
  await expect(page).toHaveURL(/\/clock\?[^#]*source=music/)
  const backgroundDialog = page.getByRole("dialog", { name: "Background" })
  await expect(backgroundDialog).toBeVisible()
  await centerCarouselItem(page, "static-gradient", "Next background")
  await backgroundDialog.getByRole("button", { name: "Select In Transition background" }).click()
  await expect(backgroundDialog).toHaveCount(0)
  await page.getByRole("button", { name: /^Minimize visualizer$/i }).last().click()
  await expect(page).toHaveURL(/\/music\?task8=public-route$/)
  await page.goBack()
  await expect(page).toHaveURL(/\/music\?task8=public-route$/)
  await expect(playerToolbar.getByRole("link", { name: /^Background$/i })).toBeVisible()
  await page.getByRole("button", { name: /^Stop$/i }).last().click()
  await expect(playerToolbar.getByText("Drone", { exact: true })).toBeVisible()
  await expect(playerToolbar.getByRole("link", { name: /^Background$/i })).toBeVisible()
  await expect(page.getByText("Stopped").last()).toBeVisible()
  await expect(playerToolbar.getByRole("link", { name: /^Background$/i })).toBeVisible()

  const flashcardsLink = page.getByRole("link", { name: /^Flashcards$/i }).first()
  if (!await flashcardsLink.isVisible().catch(() => false)) {
    const openNavigation = page.getByRole("button", { name: /Open navigation|Expand navigation/i }).first()
    if (await openNavigation.isVisible().catch(() => false)) {
      await openNavigation.click()
    }
  }

  const educationTrigger = page.getByRole("button", { name: /^Learn & Play$/i }).first()
  if (await educationTrigger.isVisible().catch(() => false)) {
    const isExpanded = (await educationTrigger.getAttribute("aria-expanded")) === "true"
    if (!isExpanded) await educationTrigger.click()
  }
  await expect(flashcardsLink).toBeVisible()
  await flashcardsLink.click()
  await expect(page).toHaveURL(/\/education\/flashcards/)
  await expect(playerToolbar.getByText("Drone", { exact: true })).toBeVisible()
  await expect(playerToolbar.getByRole("link", { name: /^Background$/i })).toBeVisible()

  expect(health.pageErrors, "uncaught page errors").toEqual([])
  expect(health.failedExternalRequests, "failed external requests").toEqual([])
  expect(health.unexpectedExternalRequests, "unexpected external requests").toEqual([])
  expect(health.consoleErrors, "browser console errors").toEqual([])
  expect(health.failedLocalResponses, "local 4xx/5xx responses").toEqual([])
  expect(health.forbiddenRequests, "anonymous account sync requests").toEqual([])
})

test("non-Music compact landscape keeps the global rail without narrowing ordinary content", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Compact-landscape global rail is covered in mobile Chromium.")
  const atmosphereFixtureUrls = new Set(atmosphereSampleIndexFixtureUrls)
  const fontFixtureUrls = new Set([externalFontUrl])
  await installAtmosphereFixtures(page, atmosphereFixtureUrls)
  await installExternalFontFixture(page, fontFixtureUrls)
  await page.setViewportSize({ width: 844, height: 390 })
  await page.goto("/music", { waitUntil: "domcontentloaded" })
  await centerCarouselItem(page, "mlab-proof-drone", "Next station")
  await page.getByRole("button", { name: /^Play Drone$/i }).click()
  const toolbar = page.getByTestId("music-player-toolbar")
  await expect(toolbar).toHaveAttribute("data-layout", "rail")

  await page.getByRole("link", { name: "Open clock" }).click()
  await expect(page).toHaveURL(/\/clock$/)
  await expect(page.locator("body")).toHaveClass(/chimer-running/)
  await expect(toolbar).toHaveAttribute("data-layout", "rail")
  await expect(page.locator("body")).toHaveClass(/ml-music-player-rail/)
  await expect(page.locator("body")).not.toHaveClass(/ml-music-player-music-route/)
  const contentBox = await page.locator(".ml-app-content").boundingBox()
  expect(contentBox?.width).toBeCloseTo(844, 0)
  expect(await page.locator("body").evaluate((body) => {
    const probe = document.createElement("div")
    probe.style.cssText = "position:absolute;visibility:hidden;width:var(--ml-player-right-safe);"
    body.appendChild(probe)
    const width = probe.getBoundingClientRect().width
    probe.remove()
    return width
  })).toBeGreaterThan(0)
})

test("Atmosphere restores the active station category after the Music route remounts", async ({ page }) => {
  const previewNames = [
    "massage-lab-moving-gradient-vertical",
    "massage-lab-stars-vertical",
    "massage-lab-hole-vertical",
    "massage-lab-retro-grid-vertical",
  ]
  const allowedExternalUrls = new Set([
    externalFontUrl,
    ...atmosphereSampleIndexFixtureUrls,
    ...previewNames.map(chimerPreviewUrl),
  ])
  const health = await capturePageHealth(page, allowedExternalUrls)
  await installExternalFontFixture(page, allowedExternalUrls)
  await installAtmosphereFixtures(page, allowedExternalUrls, ["last-transit"])
  await installChimerPreviewFixtures(page, previewNames, allowedExternalUrls)

  await page.goto("/music?active-category=restore", { waitUntil: "domcontentloaded" })
  const categoryGroup = page.getByRole("group", { name: "Station category" })
  const waterCategory = categoryGroup.getByRole("button", {
    name: "Water, nature, and field textures",
  })
  await waterCategory.click()
  await centerCarouselItem(page, "generative-fm-last-transit", "Next station")
  await page.getByRole("button", { name: /^Play Last Transit$/i }).click()
  await expect(page.getByRole("button", { name: /^Stop Last Transit$/i })).toBeVisible({ timeout: 45_000 })
  const playerToolbar = page.getByTestId("music-player-toolbar")
  await expect(playerToolbar).toHaveAttribute("data-playback-state", "playing", { timeout: 45_000 })

  await playerToolbar.getByRole("link", { name: /^Background$/i }).click()
  await expect(page).toHaveURL(/\/clock\?[^#]*source=music/)
  const backgroundDialog = page.getByRole("dialog", { name: "Background" })
  await expect(backgroundDialog).toBeVisible()
  await backgroundDialog.getByRole("button", { name: "Close Background panel" }).click()
  await page.getByRole("button", { name: /^Minimize visualizer$/i }).last().click()

  await expect(page).toHaveURL(/\/music\?active-category=restore$/)
  await expect(waterCategory).toHaveAttribute("aria-pressed", "true")
  await expect(page.getByRole("heading", { name: /Water, nature, and field textures/i })).toBeVisible()
  await expect(page.locator('[data-carousel-item-id="generative-fm-last-transit"]')).toHaveAttribute("data-centered", "true")
  await page.getByRole("button", { name: /^Stop$/i }).last().click()

  expect(health.pageErrors, "uncaught page errors").toEqual([])
  expect(health.failedExternalRequests, "failed external requests").toEqual([])
  expect(health.unexpectedExternalRequests, "unexpected external requests").toEqual([])
  expect(health.consoleErrors, "browser console errors").toEqual([])
  expect(health.failedLocalResponses, "local 4xx/5xx responses").toEqual([])
  expect(health.forbiddenRequests, "anonymous account sync requests").toEqual([])
})

test("immersive context changes keep only the displays owned by Chimer, Clock, and hidden Music", async ({ page }) => {
  const previewNames = [
    "massage-lab-moving-gradient-vertical",
    "massage-lab-stars-vertical",
    "massage-lab-hole-vertical",
  ]
  const allowedExternalUrls = new Set([
    externalFontUrl,
    ...previewNames.map(chimerPreviewUrl),
  ])
  await installExternalFontFixture(page, allowedExternalUrls)
  await installChimerPreviewFixtures(page, previewNames, allowedExternalUrls)
  let releaseSession!: () => void
  const sessionGate = new Promise<void>((resolve) => {
    releaseSession = resolve
  })
  await page.route("**/api/auth/session", async (route) => {
    await sessionGate
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "{}",
    })
  })

  await page.goto("/chimer", { waitUntil: "domcontentloaded" })
  await page.getByRole("button", { name: /^Increase minutes$/i }).click()
  for (let step = 0; step < 3; step += 1) {
    await page.getByRole("button", { name: /^Continue$/i }).click()
  }
  releaseSession()
  await expect(page.getByText(/Settings stay on this device\./i)).toBeVisible()
  await expect(page.getByRole("button", { name: /^Continue$/i })).toBeEnabled()
  await page.getByRole("button", { name: /^Continue$/i }).click()
  await page.getByRole("button", { name: /^Start Chimer$/i }).click()

  await expect(page.getByTestId("running-timer-clock")).toBeVisible()
  await expect(page.getByTestId("running-current-time")).toBeVisible()

  await page.evaluate(() => {
    window.history.pushState({}, "", "/clock?source=music&returnTo=%2Fmusic")
  })
  await page.getByRole("button", { name: "Close Background panel" }).click()
  await expect(page.getByRole("region", { name: "Music visualizer", exact: true, includeHidden: false })).toBeVisible()
  await expect(page.getByTestId("running-timer-clock")).toHaveCount(0)
  await expect(page.getByTestId("running-current-time")).toHaveCount(0)

  await page.getByRole("button", { name: "Clock", exact: true }).click()
  await expect(page.getByRole("status")).toContainText(
    "Clock is hidden. The selected background continues without a time display.",
  )

  await page.evaluate(() => {
    window.history.pushState({}, "", "/clock")
  })
  await expect(page).toHaveURL(/\/clock$/)
  await expect(page.getByTestId("running-timer-clock")).toHaveCount(0)
  await expect(page.getByTestId("running-current-time")).toBeVisible()
})

test("Music visualizer uses the anonymous shell bootstrap without client account discovery", async ({ page }) => {
  const accountDiscoveryRequests: string[] = []
  page.on("request", (request) => {
    const url = new URL(request.url())
    if (url.pathname === "/api/auth/session" || url.pathname === "/api/account/preferences") {
      accountDiscoveryRequests.push(`${request.method()} ${url.pathname}`)
    }
  })
  await page.addInitScript(() => {
    localStorage.setItem("massagelab-atmosphere-v2", JSON.stringify({
      version: 2,
      favorites: ["tone-proof-drone"],
      recentStations: ["tone-proof-drone"],
      volume: 0.4,
      miniPlayerCollapsed: false,
      visualizer: {
        backgroundId: "static-gradient",
        showClock: false,
      },
      migrations: {
        legacyMusicBackground: true,
      },
    }))

    const mounts: string[] = []
    ;(window as typeof window & { __musicVisualizerBackgroundMounts?: string[] })
      .__musicVisualizerBackgroundMounts = mounts
    new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof Element)) continue
          const candidates = node.matches('[data-testid="chimer-premium-background"]')
            ? [node]
            : Array.from(node.querySelectorAll('[data-testid="chimer-premium-background"]'))
          for (const candidate of candidates) {
            mounts.push(candidate.getAttribute("data-background-id") ?? "missing")
          }
        }
      }
    }).observe(document, { childList: true, subtree: true })
  })
  await page.goto("/clock?source=music&returnTo=%2Fmusic", { waitUntil: "domcontentloaded" })
  await expect(page.getByRole("region", { name: "Music visualizer", exact: true, includeHidden: false })).toBeVisible()
  await expect(page.getByRole("region", { name: "Music visualizer", exact: true, includeHidden: false }).getByTestId("chimer-premium-background")).toHaveAttribute(
    "data-background-id",
    "static-gradient",
  )
  await expect.poll(() => page.evaluate(() => (
    (window as typeof window & { __musicVisualizerBackgroundMounts?: string[] })
      .__musicVisualizerBackgroundMounts ?? []
  ))).toEqual(["static-gradient"])
  expect(accountDiscoveryRequests, "one Chimer auth check and no preference discovery").toEqual([
    "GET /api/auth/session",
  ])
})

test("Music visualizer background selection and account default actions preserve playback and device state", async ({ context, page }, testInfo) => {
  const previewNames = [
    "massage-lab-moving-gradient-vertical",
    "massage-lab-stars-vertical",
    "massage-lab-hole-vertical",
    "massage-lab-retro-grid-vertical",
  ]
  const allowedExternalUrls = new Set([
    ...previewNames.map(chimerPreviewUrl),
    ...initialAtmosphereSampleIndexUrls,
  ])
  await installChimerPreviewFixtures(page, previewNames, allowedExternalUrls)
  await installAtmosphereFixtures(page, allowedExternalUrls, [], initialAtmosphereSampleIndexUrls)
  const preferenceWrites: Array<Record<string, unknown>> = []
  const accountRequests: string[] = []
  const accountVisualizer = {
    defaultBackgroundId: null,
    showClock: false,
  }

  await installOwnedSignedInUserFixture({
    context,
    baseURL: String(testInfo.project.use.baseURL),
    projectName: testInfo.project.name,
    owner: "public-routes-visualizer-default",
  })

  await page.addInitScript(() => {
    localStorage.setItem("massagelab-atmosphere-v2", JSON.stringify({
      version: 2,
      favorites: ["tone-proof-drone"],
      recentStations: [],
      volume: 0.4,
      miniPlayerCollapsed: false,
      visualizer: {
        backgroundId: null,
        showClock: false,
      },
      migrations: {
        legacyMusicBackground: true,
      },
    }))
  })
  page.on("request", (request) => {
    const url = new URL(request.url())
    if (url.pathname === "/api/auth/session" || url.pathname === "/api/account/preferences") {
      accountRequests.push(`${request.method()} ${url.pathname}`)
    }
  })
  await page.route("**/api/account/preferences", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          accessAuthoritative: true,
          features: [],
          ownedBackgroundIds: [],
          chimerSettings: {},
          appSettings: { musicVisualizer: accountVisualizer },
        }),
      })
      return
    }

    const payload = route.request().postDataJSON() as Record<string, unknown>
    preferenceWrites.push(payload)
    const appSettings = payload.appSettings as { musicVisualizer?: typeof accountVisualizer } | undefined
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        accessAuthoritative: true,
        features: [],
        ownedBackgroundIds: [],
        chimerSettings: payload.chimerSettings ?? {},
        appSettings: {
          musicVisualizer: appSettings?.musicVisualizer ?? accountVisualizer,
        },
      }),
    })
  })

  await page.goto("/music", { waitUntil: "domcontentloaded" })
  await expect(page.getByRole("region", { name: "Atmosphere audio stations" }))
    .toHaveAttribute("data-music-storage-status", "available")
  await centerCarouselItem(page, "mlab-proof-drone", "Next station")
  await page.getByRole("button", { name: /^Play Drone$/i }).click()
  const playerToolbar = page.getByTestId("music-player-toolbar")
  await expect(playerToolbar).toBeVisible({ timeout: 30_000 })
  await expect(playerToolbar.getByText("Drone", { exact: true })).toBeVisible()
  await playerToolbar.getByRole("link", { name: /^Background$/i }).click()
  await expect(page).toHaveURL(/\/clock\?[^#]*source=music/)
  await expect.poll(() => page.evaluate(() => (
    JSON.parse(localStorage.getItem("massagelab-atmosphere-v2") ?? "{}")
      .recentStations
  ))).toEqual(["mlab-proof-drone"])

  const deviceStateBeforeSelection = await page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem("massagelab-atmosphere-v2") ?? "{}")
    const deviceState = { ...stored }
    delete deviceState.visualizer
    return deviceState
  })

  await centerCarouselItem(page, "static-gradient", "Next background")
  await page.getByRole("button", { name: "Select In Transition background" }).click()
  await expect(page.getByTestId("chimer-premium-background")).toHaveAttribute(
    "data-background-id",
    "static-gradient",
  )
  await expect(playerToolbar.getByText("Drone", { exact: true })).toBeVisible()

  await page.getByRole("button", { name: "Visual", exact: true }).click()
  await page.getByRole("button", { name: "Set as visualizer default", exact: true })
    .evaluate((button) => (button as HTMLButtonElement).click())
  await expect.poll(() => preferenceWrites.some((payload) => {
    const appSettings = payload.appSettings as {
      musicVisualizer?: { defaultBackgroundId?: string | null }
    } | undefined
    return appSettings?.musicVisualizer?.defaultBackgroundId === "static-gradient"
  })).toBe(true)

  await expect(playerToolbar.getByText("Drone", { exact: true })).toBeVisible()
  await expect(playerToolbar).toContainText(/Playing|Preparing audio|Preparing station/i)
  expect(await page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem("massagelab-atmosphere-v2") ?? "{}")
    const deviceState = { ...stored }
    delete deviceState.visualizer
    return deviceState
  })).toEqual(deviceStateBeforeSelection)
  await expect.poll(() => page.evaluate(() => (
    JSON.parse(localStorage.getItem("massagelab-atmosphere-v2") ?? "{}")
      .visualizer?.backgroundId
  ))).toBe("static-gradient")
  expect(accountRequests.filter((request) => request === "GET /api/auth/session")).toEqual([
    "GET /api/auth/session",
  ])
  const expectedPreferenceReads = isBrowserQaDatabaseTargetAuthorized(process.env) ? 1 : 2
  expect(
    accountRequests.filter((request) => request === "GET /api/account/preferences"),
    "one Chimer-owned preference read, plus one client shell fallback only without an authorized Browser QA database",
  ).toEqual(Array(expectedPreferenceReads).fill("GET /api/account/preferences"))
  expect(accountRequests.filter((request) => request === "PUT /api/account/preferences").length)
    .toBeGreaterThanOrEqual(1)
})

test("Music account preference owner switch ignores a delayed old-owner PUT", async ({ context, page }, testInfo) => {
  let releaseOwnerAWrite!: () => void
  let markOwnerAWriteStarted!: () => void
  let markOwnerAWriteResponseProcessed!: () => void
  let ownerAWriteHeld = false
  const ownerAWriteGate = new Promise<void>((resolve) => {
    releaseOwnerAWrite = resolve
  })
  const ownerAWriteStarted = new Promise<void>((resolve) => {
    markOwnerAWriteStarted = resolve
  })
  const ownerAWriteResponseProcessed = new Promise<void>((resolve) => {
    markOwnerAWriteResponseProcessed = resolve
  })

  await installOwnedSignedInUserFixture({
    context,
    baseURL: String(testInfo.project.use.baseURL),
    projectName: testInfo.project.name,
    owner: "public-routes-owner-a",
  })
  await page.addInitScript(() => {
    localStorage.setItem("massagelab-atmosphere-v2", JSON.stringify({
      version: 2,
      favorites: [],
      recentStations: [],
      volume: 0.4,
      miniPlayerCollapsed: false,
      visualizer: { backgroundId: "static-gradient", showClock: false },
      migrations: { legacyMusicBackground: true },
    }))
  })
  await page.route("**/api/account/preferences", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ appSettings: { musicVisualizer: { defaultBackgroundId: null, showClock: false } } }),
      })
      return
    }

    const payload = route.request().postDataJSON() as {
      appSettings?: { musicVisualizer?: { defaultBackgroundId?: string | null; showClock?: boolean } }
    }
    const isHeldOwnerAWrite = !ownerAWriteHeld
    if (isHeldOwnerAWrite) {
      ownerAWriteHeld = true
      markOwnerAWriteStarted()
      await ownerAWriteGate
    }
    try {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ appSettings: { musicVisualizer: payload.appSettings?.musicVisualizer } }),
      })
    } catch (error) {
      // Reload may cancel owner A's document before its held response is released.
      if (!isHeldOwnerAWrite || !isHeldRouteTeardownCancellation(error)) throw error
    } finally {
      if (isHeldOwnerAWrite) markOwnerAWriteResponseProcessed()
    }
  })

  await page.goto("/clock?source=music&returnTo=%2Fmusic", { waitUntil: "domcontentloaded" })
  await expect(page.getByTestId("chimer-premium-background")).toHaveAttribute(
    "data-background-id",
    "static-gradient",
  )
  await page.getByRole("button", { name: "Visual", exact: true }).click()
  await page.getByRole("button", { name: "Set as visualizer default", exact: true })
    .evaluate((button) => (button as HTMLButtonElement).click())
  await ownerAWriteStarted

  const ownerBIdentity = await installOwnedSignedInUserFixture({
    context,
    baseURL: String(testInfo.project.use.baseURL),
    projectName: testInfo.project.name,
    owner: "public-routes-owner-b",
  })
  const ownerBReload = await page.reload({ waitUntil: "domcontentloaded" })
  expect(ownerBReload, "owner B reload response").not.toBeNull()
  await expect(ownerBReload!.text(), "the reloaded account bootstrap belongs to owner B")
    .resolves.toContain(`\\"ownerKey\\":\\"${ownerBIdentity.user.id}\\"`)
  await expect(page.getByRole("region", {
    name: "Music visualizer",
    exact: true,
  })).toBeVisible()
  await page.getByRole("button", { name: "Visual", exact: true }).click()
  await expect(page.getByRole("button", { name: "Set as visualizer default", exact: true })).toBeVisible()

  releaseOwnerAWrite()
  await ownerAWriteResponseProcessed
  await expect(page.getByRole("button", { name: "Set as visualizer default", exact: true })).toBeVisible()
  await expect(page.getByText("Saving visualizer default…")).toHaveCount(0)
  await expect(page.getByText(/visualizer preferences could not be saved/i)).toHaveCount(0)
})

test("Breathing guide route runs separately from Music stations", async ({ page }) => {
  const health = await capturePageHealth(page, new Set())

  await page.goto("/wellness/breathing", { waitUntil: "domcontentloaded" })
  await expect(page.getByRole("heading", { name: /^Breathing guide$/i })).toBeVisible()
  await expect(page.getByRole("link", { name: /Music stations/i })).toHaveAttribute("href", "/music")
  await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => undefined)
  const startBreathingButton = page.getByRole("button", { name: /^Start breathing$/i })
  await expect(startBreathingButton).toBeEnabled()
  await startBreathingButton.click()
  await expect(page.getByRole("button", { name: /^Pause breathing$/i })).toBeVisible()
  await page.getByRole("button", { name: /^Reset breathing$/i }).click()
  await expect(page.getByRole("button", { name: /^Start breathing$/i })).toBeVisible()

  expect(health.pageErrors, "uncaught page errors").toEqual([])
  expect(health.unexpectedExternalRequests, "unexpected external requests").toEqual([])
  expect(health.consoleErrors, "browser console errors").toEqual([])
  expect(health.failedLocalResponses, "local 4xx/5xx responses").toEqual([])
  expect(health.forbiddenRequests, "anonymous account sync requests").toEqual([])
})

test("Breathing guide fits phone and short landscape viewports", async ({ page }, testInfo) => {
  const health = await capturePageHealth(page, new Set())
  await page.goto("/wellness/breathing", { waitUntil: "domcontentloaded" })
  await expect(page.getByRole("button", { name: "Start breathing", exact: true })).toBeEnabled()

  for (const viewport of [{ width: 320, height: 568 }, { width: 360, height: 640 }, { width: 390, height: 714 }, { width: 412, height: 824 }, { width: 667, height: 375 }]) {
    await page.setViewportSize(viewport)
    for (const pattern of ["Coherent", "Box", "Settle"]) {
      const preset = page.getByRole("group", { name: "Breathing pattern" }).getByRole("button", { name: new RegExp(`^${pattern}`) })
      await preset.click()
      await expect(preset).toHaveAttribute("aria-pressed", "true")
      await expect.poll(() => page.locator("[data-breathing-page]").evaluate((element) => ({
        overflowY: element.scrollHeight - element.clientHeight,
        overflowX: element.scrollWidth - element.clientWidth,
      }))).toEqual({ overflowY: 0, overflowX: 0 })
      const visual = await page.locator("[data-breathing-visual]").boundingBox()
      const orb = await page.locator("[data-breathing-orb]").boundingBox()
      expect(visual).not.toBeNull()
      expect(orb!.y).toBeGreaterThanOrEqual(visual!.y - 1)
      expect(orb!.y + orb!.height).toBeLessThanOrEqual(visual!.y + visual!.height + 1)
      for (const control of await page.locator("[data-breathing-guide] button").all()) {
        const box = await control.boundingBox()
        expect(box!.height).toBeGreaterThanOrEqual(44)
        expect(box!.x).toBeGreaterThanOrEqual(0)
        expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width)
        expect(box!.y + box!.height).toBeLessThan(viewport.height - 44)
      }
    }
    if (viewport.width === 390) await page.screenshot({ path: testInfo.outputPath("breathing-mobile.png") })
    if (viewport.width === 667) await page.screenshot({ path: testInfo.outputPath("breathing-landscape.png") })
  }
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.getByRole("button", { name: "Start breathing", exact: true }).click()
  await expect(page.locator("[data-breathing-orb]")).toHaveCSS("transform", "none")
  await expect(page.locator("[data-breathing-phase]")).toHaveText("Inhale")
  await page.getByRole("button", { name: "Pause breathing", exact: true }).click()
  await expect(page.locator("[data-breathing-phase]")).toHaveText("Paused")
  await page.getByRole("button", { name: "Reset breathing", exact: true }).click()
  await expect(page.locator("[data-breathing-phase]")).toHaveText("Ready")
  await page.setViewportSize({ width: 390, height: 714 })
  // Large text may scroll, but every control must remain reachable rather than clipped.
  await page.locator("html").evaluate((element) => { element.style.fontSize = "32px" })
  await page.getByRole("button", { name: "Start breathing", exact: true }).click()
  await expect(page.getByRole("button", { name: "Pause breathing", exact: true })).toBeInViewport()
  await page.getByRole("button", { name: "Reset breathing", exact: true }).click()
  await expect(page.getByRole("button", { name: "Reset breathing", exact: true })).toBeInViewport()
  expect(await page.locator("[data-breathing-page]").evaluate((element) => element.scrollWidth - element.clientWidth)).toBe(0)
  expect(health.pageErrors).toEqual([])
  expect(health.consoleErrors).toEqual([])
  expect(health.failedLocalResponses).toEqual([])
})

test("Breathing button labels stay inside their faces at narrow widths and enlarged text", async ({ page }, testInfo) => {
  const health = await capturePageHealth(page, new Set())
  await page.goto("/wellness/breathing", { waitUntil: "domcontentloaded" })
  await expect(page.getByRole("button", { name: "Start breathing", exact: true })).toBeEnabled()

  for (const width of [320, 360, 390, 667]) {
    await page.setViewportSize({ width, height: width === 667 ? 375 : 714 })
    for (const fontSize of [16, 20, 24, 32]) {
      await page.locator("html").evaluate((element, size) => { element.style.fontSize = `${size}px` }, fontSize)
      await expect.poll(() => page.locator("[data-breathing-page]").evaluate((element) => element.scrollWidth - element.clientWidth), { message: `${width}px / ${fontSize}px text fits the page width` }).toBe(0)
      // Element boxes alone miss overflowing glyphs when a fixed-height flex
      // button shrinks its labels. Measure the actual text line rectangles.
      const buttons = await page.locator("[data-breathing-guide] button").evaluateAll((elements) => elements.map((button) => {
        const face = button.getBoundingClientRect()
        const walker = document.createTreeWalker(button, NodeFilter.SHOW_TEXT)
        const lines: Array<{ text: string; top: number; bottom: number; left: number; right: number }> = []
        while (walker.nextNode()) {
          const node = walker.currentNode
          if (!node.textContent?.trim()) continue
          const range = document.createRange()
          range.selectNodeContents(node)
          for (const line of Array.from(range.getClientRects())) {
            lines.push({ text: node.textContent.trim(), top: line.top, bottom: line.bottom, left: line.left, right: line.right })
          }
        }
        return { label: button.textContent, face: { top: face.top, bottom: face.bottom, left: face.left, right: face.right }, lines }
      }))
      for (const button of buttons) {
        for (const line of button.lines) {
          const context = `${width}px / ${fontSize}px text / ${button.label} / ${line.text}`
          expect(line.top, `${context} clears the upper button edge`).toBeGreaterThanOrEqual(button.face.top + 2)
          expect(line.bottom, `${context} clears the lower button edge`).toBeLessThanOrEqual(button.face.bottom - 2)
          expect(line.left, `${context} clears the left button edge`).toBeGreaterThanOrEqual(button.face.left + 2)
          expect(line.right, `${context} clears the right button edge`).toBeLessThanOrEqual(button.face.right - 2)
        }
      }
      const coherentLines = buttons[0].lines.filter((line) => line.text === "Coherent")
      expect(coherentLines, "keep the preset name intact rather than splitting a word").toHaveLength(1)
      if (width === 667 && fontSize >= 24) {
        await page.getByRole("button", { name: "Start breathing", exact: true }).click()
        await expect(page.getByRole("button", { name: "Pause breathing", exact: true })).toBeInViewport()
        await page.getByRole("button", { name: "Reset breathing", exact: true }).click()
        await expect(page.getByRole("button", { name: "Start breathing", exact: true })).toBeInViewport()
      }
      if (fontSize === 16 && width === 320) await page.screenshot({ path: testInfo.outputPath("breathing-button-fit-phone.png") })
      if (fontSize === 20 && width === 390) await page.screenshot({ path: testInfo.outputPath("breathing-button-fit-larger-text.png") })
      if (fontSize === 32 && width === 667) await page.screenshot({ path: testInfo.outputPath("breathing-button-fit-landscape-enlarged.png") })
    }
  }
  expect(health.pageErrors).toEqual([])
  expect(health.consoleErrors).toEqual([])
  expect(health.failedLocalResponses).toEqual([])
})

test("Breathing shortcut protects typing and restores focus without duplicating the page", async ({ page }, testInfo) => {
  const health = await capturePageHealth(page, new Set())
  await page.goto("/login", { waitUntil: "domcontentloaded" })
  const email = page.getByLabel("Email", { exact: true })
  await email.fill("local-qa@example.invalid")
  await email.press("Alt+Shift+B")
  await expect(page.getByRole("dialog", { name: "Breathing guide" })).toHaveCount(0)
  await expect(email).toBeFocused()

  await page.goto("/wellness/breathing", { waitUntil: "domcontentloaded" })
  // Prove hydration through a real control before sending an ephemeral key chord.
  await page.getByRole("button", { name: "Start breathing", exact: true }).click()
  await expect(page.getByRole("button", { name: "Pause breathing", exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Reset breathing", exact: true }).click()
  await page.getByRole("link", { name: "Music stations", exact: true }).press("Alt+Shift+B")
  await expect(page.locator("[data-breathing-primary]")).toBeFocused()
  await expect(page.locator("[data-breathing-guide]")).toHaveCount(1)
  await expect(page.getByRole("dialog", { name: "Breathing guide" })).toHaveCount(0)

  await page.goto("/wellness", { waitUntil: "domcontentloaded" })
  const originalFocus = page.getByRole("link", { name: /Open breathing guide/i })
  await originalFocus.press("Alt+Shift+B")
  const dialog = page.getByRole("dialog", { name: "Breathing guide" })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole("button", { name: "Start breathing", exact: true })).toBeFocused()
  await expect(page).toHaveURL(/\/wellness$/)
  await dialog.getByRole("button", { name: "Start breathing", exact: true }).click()
  await expect(dialog.getByRole("button", { name: "Pause breathing", exact: true })).toBeVisible()
  await dialog.press("Escape")
  await expect(dialog).toHaveCount(0)
  await expect(originalFocus).toBeFocused()
  await originalFocus.press("Alt+Shift+B")
  await expect(dialog.getByRole("button", { name: "Start breathing", exact: true })).toBeVisible()
  await dialog.press("Alt+Shift+B")
  await expect(dialog).toHaveCount(0)
  await expect(originalFocus).toBeFocused()
  await page.setViewportSize({ width: 667, height: 375 })
  await page.locator("html").evaluate((element) => { element.style.fontSize = "32px" })
  await originalFocus.press("Alt+Shift+B")
  await expect(dialog).toBeVisible()
  await dialog.getByRole("button", { name: /^Box/ }).click()
  // A modal can have zero overflow yet still be painted behind the wide-phone
  // sidebar. Its layer must clear the visible shell, not just trap keyboard focus.
  const layers = await dialog.evaluate((element) => ({
    modal: Number.parseInt(getComputedStyle(element).zIndex, 10),
    shell: Math.max(0, ...Array.from(document.querySelectorAll(".ml-app-sidebar-frame, .ml-music-player, .ml-app-topbar"))
      .filter((node) => node.getClientRects().length > 0)
      .map((node) => Number.parseInt(getComputedStyle(node).zIndex, 10) || 0)),
  }))
  expect(layers.modal, "breathing overlay clears the sidebar and player layers").toBeGreaterThan(layers.shell)
  await expect.poll(() => dialog.evaluate((element) => element.scrollWidth - element.clientWidth)).toBe(0)
  await expect.poll(() => dialog.locator("[data-breathing-guide]").evaluate((element) => element.scrollWidth - element.clientWidth)).toBe(0)
  await dialog.getByRole("button", { name: "Start breathing", exact: true }).click()
  await expect(dialog.getByRole("button", { name: "Pause breathing", exact: true })).toBeInViewport()
  await dialog.getByRole("button", { name: "Reset breathing", exact: true }).click()
  await page.screenshot({ path: testInfo.outputPath("breathing-landscape-enlarged-overlay.png") })
  await dialog.press("Escape")
  await expect(dialog).toHaveCount(0)
  await expect(originalFocus).toBeFocused()
  expect(health.pageErrors).toEqual([])
  expect(health.consoleErrors).toEqual([])
  expect(health.failedLocalResponses).toEqual([])
})

test("Breathing overlay leaves native music ownership and the current background mounted", async ({ page }, testInfo) => {
  const previewNames = ["massage-lab-moving-gradient-vertical", "massage-lab-stars-vertical", "massage-lab-hole-vertical", "massage-lab-retro-grid-vertical"]
  const allowedExternalUrls = new Set([externalFontUrl, ...atmosphereSampleIndexFixtureUrls, ...previewNames.map(chimerPreviewUrl)])
  const health = await capturePageHealth(page, allowedExternalUrls)
  await installExternalFontFixture(page, allowedExternalUrls)
  await installAtmosphereFixtures(page, allowedExternalUrls, ["last-transit"])
  await installChimerPreviewFixtures(page, previewNames, allowedExternalUrls)
  // Observe real media ownership calls without replacing playback or contacting providers.
  await page.addInitScript(() => {
    const counts = { play: 0, pause: 0 }
    Object.assign(window, { breathingMediaCalls: counts })
    const play = HTMLMediaElement.prototype.play
    const pause = HTMLMediaElement.prototype.pause
    HTMLMediaElement.prototype.play = function () {
      counts.play += 1
      return play.call(this)
    }
    HTMLMediaElement.prototype.pause = function () {
      counts.pause += 1
      return pause.call(this)
    }
  })
  await page.goto("/music", { waitUntil: "domcontentloaded" })
  await page.getByRole("group", { name: "Station category" }).getByRole("button", { name: "Water, nature, and field textures" }).click()
  await centerCarouselItem(page, "generative-fm-last-transit", "Next station")
  await page.getByRole("button", { name: /^Play Last Transit$/i }).click()
  const toolbar = page.getByTestId("music-player-toolbar")
  await expect(toolbar).toHaveAttribute("data-playback-state", "playing", { timeout: 45_000 })
  const background = await page.getByTestId("app-moving-background").elementHandle()
  expect(background).not.toBeNull()
  const callsBefore = await page.evaluate(() => ({ ...(window as typeof window & { breathingMediaCalls: { play: number; pause: number } }).breathingMediaCalls }))
  await page.getByRole("button", { name: /^Stop Last Transit$/i }).press("Alt+Shift+B")
  const dialog = page.getByRole("dialog", { name: "Breathing guide" })
  await expect(dialog).toBeVisible()
  await dialog.getByRole("button", { name: "Start breathing", exact: true }).click()
  await expect(dialog.getByRole("button", { name: "Pause breathing", exact: true })).toBeVisible()
  await expect(toolbar).toHaveAttribute("data-playback-state", "playing")
  await page.screenshot({ path: testInfo.outputPath("breathing-overlay.png") })
  await dialog.press("Escape")
  await expect(dialog).toHaveCount(0)
  await expect(page).toHaveURL(/\/music$/)
  expect(await background!.evaluate((element) => element.isConnected)).toBe(true)
  expect(await page.evaluate(() => ({ ...(window as typeof window & { breathingMediaCalls: { play: number; pause: number } }).breathingMediaCalls }))).toEqual(callsBefore)
  await expect(toolbar).toHaveAttribute("data-playback-state", "playing")
  await page.setViewportSize({ width: 390, height: 714 })
  await page.getByRole("button", { name: "Open navigation", exact: true }).click()
  await page.getByRole("dialog").press("Alt+Shift+B")
  await expect(page.getByRole("dialog", { name: "Breathing guide" })).toHaveCount(0)
  const toolsGroup = page.getByRole("dialog").getByRole("button", { name: "Atmosphere", exact: true })
  if (await toolsGroup.getAttribute("aria-expanded") !== "true") await toolsGroup.click()
  await page.getByRole("link", { name: "Breathing guide", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Breathing guide", exact: true })).toBeVisible()
  await expect(toolbar).toHaveAttribute("data-playback-state", "playing")
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 714 }, { width: 667, height: 375 }]) {
    await page.setViewportSize(viewport)
    await expect.poll(() => page.locator("[data-breathing-page]").evaluate((element) => element.scrollHeight - element.clientHeight)).toBe(0)
  }
  await toolbar.getByRole("button", { name: "Stop", exact: true }).click()
  expect(health.pageErrors).toEqual([])
  expect(health.consoleErrors).toEqual([])
  expect(health.failedLocalResponses).toEqual([])
})

test("first station Play activation stays hidden before carousel readiness", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Mobile Chromium owns the first-action contract.")
  const atmosphereFixtureUrls = new Set(atmosphereSampleIndexFixtureUrls)
  await installAtmosphereFixtures(page, atmosphereFixtureUrls)
  let carouselBundleHeld = false
  let releaseCarouselBundle: () => void = () => undefined
  const carouselBundleGate = new Promise<void>((resolve) => {
    releaseCarouselBundle = resolve
  })

  await page.route("**/_next/static/chunks/*.js", async (route) => {
    const response = await route.fetch()
    const body = await response.body()
    if (body.includes("carousel-ready")) {
      carouselBundleHeld = true
      await carouselBundleGate
    }
    await route.fulfill({ response, body })
  })

  try {
    // Commit returns once the document response begins. With the carousel
    // bundle held, Next legitimately keeps this segment behind the root route
    // loading boundary, where no station action may be activated.
    await page.goto("/music", { waitUntil: "commit" })
    await expect.poll(() => carouselBundleHeld).toBe(true)
    await expect(page.getByRole("status").filter({ hasText: /^Loading page$/ })).toBeVisible()
    const carousel = page.getByRole("region", { name: "Station carousel" })
    await expect(carousel).toHaveCount(0)
    await expect(page.locator("[data-carousel-primary-action]")).toHaveCount(0)

    releaseCarouselBundle()
    await expect(carousel).toHaveAttribute("data-carousel-ready", "true")
    await expect(carousel.locator("[data-carousel-primary-action]").first()).toHaveCSS("visibility", "visible")
  } finally {
    releaseCarouselBundle()
  }
})

test("center station details support swipe and short tap while actions stay protected", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Touch carousel behavior is covered in mobile Chromium.")
  const atmosphereFixtureUrls = new Set(atmosphereSampleIndexFixtureUrls)
  await installAtmosphereFixtures(page, atmosphereFixtureUrls)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/music", { waitUntil: "domcontentloaded" })
  await expect(page.getByRole("region", { name: "Station carousel" })).toHaveAttribute("data-carousel-ready", "true")
  const centered = await centerCarouselItem(page, "mlab-proof-drone", "Next station")
  const details = centered.locator("[data-carousel-station-details]")
  const beforeId = await centered.getAttribute("data-carousel-item-id")
  const box = await details.boundingBox()
  if (!box) throw new Error("Station details surface has no drag bounds")

  await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.5)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5, { steps: 8 })
  await page.mouse.up()

  await expect.poll(async () => page.locator('[data-carousel-slide][data-centered="true"]').getAttribute("data-carousel-item-id"))
    .not.toBe(beforeId)
  await expect(page.getByRole("dialog")).toHaveCount(0)

  const proof = await centerCarouselItem(page, "mlab-proof-drone", "Next station")
  const protectedCenterId = await proof.getAttribute("data-carousel-item-id")
  const playButton = proof.getByRole("button", { name: /^Play Drone$/i })
  await playButton.evaluate(async (button) => {
    const textNode = Array.from(button.childNodes).find((node) => (
      node.nodeType === Node.TEXT_NODE && node.textContent?.trim() === "Play"
    ))
    if (!textNode) throw new Error("Play control text node is unavailable")

    const box = button.getBoundingClientRect()
    const startX = box.left + box.width * 0.75
    const startY = box.top + box.height * 0.5

    // Keep the MouseEvent sequence because Embla's watchDrag gate consumes
    // MouseEvent | TouchEvent. Starting on the label proves drag protection
    // still applies without the primary button's former pointerdown warmup.
    textNode.dispatchEvent(new MouseEvent("mousedown", {
      bubbles: true,
      button: 0,
      buttons: 1,
      cancelable: true,
      clientX: startX,
      clientY: startY,
      view: window,
    }))
    for (let step = 1; step <= 8; step += 1) {
      document.dispatchEvent(new MouseEvent("mousemove", {
        bubbles: true,
        buttons: 1,
        cancelable: true,
        clientX: startX - step * 20,
        clientY: startY,
        view: window,
      }))
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()))
    }
    document.dispatchEvent(new MouseEvent("mouseup", {
      bubbles: true,
      button: 0,
      buttons: 0,
      cancelable: true,
      clientX: startX - 160,
      clientY: startY,
      view: window,
    }))
  })
  await expect.poll(async () => page.locator('[data-carousel-slide][data-centered="true"]').getAttribute("data-carousel-item-id"))
    .toBe(protectedCenterId)

  await proof.locator("[data-carousel-station-details]").click()
  await expect(page.getByRole("dialog").getByRole("heading", { name: "Drone", exact: true })).toBeVisible()
  await page.keyboard.press("Escape")

  await proof.locator("[data-carousel-station-details]").focus()
  await page.keyboard.press("Enter")
  await expect(page.getByRole("dialog").getByRole("heading", { name: "Drone", exact: true })).toBeVisible()
  await page.keyboard.press("Escape")

  await proof.getByRole("button", { name: /^Play Drone$/i }).click()
  await expect(proof).toHaveAttribute("data-centered", "true")
  await proof.getByRole("button", {
    name: /^(?:Favorite Drone|Remove Drone from favorites)$/i,
  }).click()
  await expect(proof).toHaveAttribute("data-centered", "true")
  await page.getByTestId("music-player-toolbar").getByRole("button", { name: "Stop", exact: true }).click()
})

for (const reducedMotion of [false, true] as const) {
  test(`station carousel loops and station swipe wraps ${reducedMotion ? "with reduced motion" : "with normal motion"}`, async ({ page }, testInfo) => {
    test.skip(
      !["mobile-chromium", "desktop-chromium"].includes(testInfo.project.name),
      "Station loop coverage is owned by Chromium projects.",
    )
    const atmosphereFixtureUrls = new Set(atmosphereSampleIndexFixtureUrls)
    await installAtmosphereFixtures(page, atmosphereFixtureUrls)
    await page.emulateMedia({ reducedMotion: reducedMotion ? "reduce" : "no-preference" })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/music", { waitUntil: "domcontentloaded" })

    const carousel = page.getByRole("region", { name: "Station carousel" })
    const stage = page.getByTestId("station-carousel-stage")
    const slides = carousel.locator('[data-carousel-slide="true"]:not([data-carousel-loop-clone="true"])')
    await expect(carousel).toHaveAttribute("data-carousel-ready", "true")
    await expect(carousel).toHaveAttribute("data-reduced-motion", String(reducedMotion))
    const ids = await slides.evaluateAll((elements) => elements
      .map((element) => element.getAttribute("data-carousel-canonical-id"))
      .filter((id): id is string => Boolean(id)))
    expect(ids.length).toBeGreaterThan(2)
    const firstId = ids[0]
    const lastId = ids[ids.length - 1]
    const centeredId = () => carousel
      .locator('[data-carousel-slide="true"][data-centered="true"]')
      .getAttribute("data-carousel-canonical-id")
    const previous = carousel.getByRole("button", { name: "Previous station" })
    const next = carousel.getByRole("button", { name: "Next station" })
    const customControlMarker = carousel.locator('[data-station-carousel-controls="true"]')
    const hasFineHoverPointer = await page.evaluate(() => (
      window.matchMedia("(any-hover: hover) and (any-pointer: fine)").matches
    ))
    const controlsExpected = reducedMotion || hasFineHoverPointer

    await expect(previous).toHaveCount(controlsExpected ? 1 : 0)
    await expect(next).toHaveCount(controlsExpected ? 1 : 0)
    await expect(customControlMarker).toHaveCount(controlsExpected ? 1 : 0)
    await stage.focus()
    await page.keyboard.press("Home")
    await expect.poll(centeredId).toBe(firstId)
    await page.keyboard.press("ArrowLeft")
    await expect.poll(centeredId).toBe(lastId)
    await page.keyboard.press("ArrowRight")
    await expect.poll(centeredId).toBe(firstId)

    if (controlsExpected) {
      await expect(previous).toBeEnabled()
      await expect(next).toBeEnabled()
      await previous.click()
      await expect.poll(centeredId).toBe(lastId)
      await next.click()
      await expect.poll(centeredId).toBe(firstId)
    }

    await stage.focus()
    await page.keyboard.press("ArrowLeft")
    await expect.poll(centeredId).toBe(lastId)
    await page.keyboard.press("ArrowRight")
    await expect.poll(centeredId).toBe(firstId)
    await waitForCarouselMotionToSettle(page, "station-carousel-stage")

    const lastSideCard = carousel.locator(`[data-carousel-canonical-id="${lastId}"][data-detail-level="summary"]`).first()
    await clickVisibleCarouselSideCard(page, stage, lastSideCard)
    await expect.poll(centeredId).toBe(lastId)
    await waitForCarouselMotionToSettle(page, "station-carousel-stage")

    const firstSideCard = carousel.locator(`[data-carousel-canonical-id="${firstId}"][data-detail-level="summary"]`).first()
    await clickVisibleCarouselSideCard(page, stage, firstSideCard)
    await expect.poll(centeredId).toBe(firstId)
    await waitForCarouselMotionToSettle(page, "station-carousel-stage")
    if (testInfo.project.name === "mobile-chromium") {
      await swipeCarouselStage(page, "station-carousel-stage", "previous")
    } else {
      await dragCarouselStageWithMouse(page, "station-carousel-stage", "previous")
    }
    await expect.poll(centeredId).toBe(lastId)
    await waitForCarouselMotionToSettle(page, "station-carousel-stage")
    if (testInfo.project.name === "mobile-chromium") {
      await swipeCarouselStage(page, "station-carousel-stage", "next")
    } else {
      await dragCarouselStageWithMouse(page, "station-carousel-stage", "next")
    }
    await expect.poll(centeredId).toBe(firstId)

    if (controlsExpected) {
      await expect(previous).toBeEnabled()
      await expect(next).toBeEnabled()
    }
    if (reducedMotion) {
      const presentation = carousel.locator('[data-centered="true"] [data-carousel-transform="true"]')
      await expect(presentation).toHaveCSS("transition-duration", "0s")
      await expect(presentation).toHaveCSS("transform", "none")
    }
  })
}

for (const reducedMotion of [false, true] as const) {
  test(`Background default navigation and Background drag keep ${reducedMotion ? "reduced-motion finite" : "normal looped"} behavior`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chromium", "Native Background drag coverage is owned by mobile Chromium.")
    const previewNames = [
      "massage-lab-gradient-vertical",
      "massage-lab-moving-gradient-vertical",
      "massage-lab-stars-vertical",
      "massage-lab-hole-vertical",
      "massage-lab-retro-grid-vertical",
    ]
    const allowedExternalUrls = new Set([
      externalFontUrl,
      ...previewNames.map(chimerPreviewUrl),
    ])
    await installExternalFontFixture(page, allowedExternalUrls)
    await installChimerPreviewFixtures(page, previewNames, allowedExternalUrls)
    await page.emulateMedia({ reducedMotion: reducedMotion ? "reduce" : "no-preference" })
    if (reducedMotion) {
      await page.addInitScript(() => {
        localStorage.setItem("massage-lab-settings", JSON.stringify({ ambientMotionMode: "reduced" }))
      })
    }
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/clock?source=music&returnTo=%2Fmusic", { waitUntil: "domcontentloaded" })

    const dialog = page.getByRole("dialog", { name: "Background" })
    await expect(dialog).toBeVisible()
    const carousel = dialog.getByRole("region", { name: "Background carousel" })
    const stage = page.getByTestId("background-carousel-stage")
    await expect(carousel).toHaveAttribute("data-carousel-ready", "true")
    await expect(carousel).toHaveAttribute("data-reduced-motion", String(reducedMotion))
    const ids = await carousel.locator('[data-carousel-slide="true"]').evaluateAll((elements) => elements
      .map((element) => element.getAttribute("data-carousel-item-id"))
      .filter((id): id is string => Boolean(id)))
    expect(ids.length).toBeGreaterThan(2)
    const firstId = ids[0]
    const lastId = ids[ids.length - 1]
    const centeredId = () => carousel
      .locator('[data-carousel-slide="true"][data-centered="true"]')
      .getAttribute("data-carousel-item-id")
    const previous = carousel.getByRole("button", { name: "Previous background" })
    const next = carousel.getByRole("button", { name: "Next background" })
    await expect(carousel).toHaveAttribute("data-has-custom-controls", "true")
    await expect(carousel.locator("[data-station-carousel-controls], [data-carousel-controls]"))
      .toHaveCount(0)
    await expect(previous).toHaveCount(1)
    await expect(next).toHaveCount(1)

    await expect.poll(centeredId).toBe(firstId)
    if (reducedMotion) {
      await expect(previous).toBeDisabled()
      await stage.focus()
      await page.keyboard.press("ArrowLeft")
      await expect.poll(centeredId).toBe(firstId)
      await swipeCarouselStage(page, "background-carousel-stage", "previous")
      await expect.poll(centeredId).toBe(firstId)

      await next.click()
      await expect.poll(centeredId).toBe(ids[1])
      await previous.click()
      await expect.poll(centeredId).toBe(firstId)

      await stage.focus()
      await page.keyboard.press("ArrowRight")
      await expect.poll(centeredId).toBe(ids[1])
      await page.keyboard.press("ArrowLeft")
      await expect.poll(centeredId).toBe(firstId)

      await page.keyboard.press("End")
      await expect.poll(centeredId).toBe(lastId)
      await expect(next).toBeDisabled()
      await swipeCarouselStage(page, "background-carousel-stage", "next")
      await expect.poll(centeredId).toBe(lastId)
      await expect(carousel.locator('[data-centered="true"] [data-carousel-transform="true"]'))
        .toHaveCSS("transition-duration", "0s")
    } else {
      await expect(previous).toBeEnabled()
      await expect(next).toBeEnabled()
      await previous.click()
      await expect.poll(centeredId).toBe(lastId)
      await next.click()
      await expect.poll(centeredId).toBe(firstId)

      await stage.focus()
      await page.keyboard.press("ArrowLeft")
      await expect.poll(centeredId).toBe(lastId)
      await page.keyboard.press("ArrowRight")
      await expect.poll(centeredId).toBe(firstId)
      // Finish the prior keyboard transition before starting the previous swipe.
      await waitForCarouselMotionToSettle(page, "background-carousel-stage")

      await swipeCarouselStage(page, "background-carousel-stage", "previous")
      await expect.poll(centeredId).toBe(lastId)
      // Finish the previous swipe transition before starting the next swipe.
      await waitForCarouselMotionToSettle(page, "background-carousel-stage")
      await swipeCarouselStage(page, "background-carousel-stage", "next")
      await expect.poll(centeredId).toBe(firstId)
    }
  })
}

test("Atmosphere lists the Generative.fm catalog and starts a hosted-sample station", async ({ page }) => {
  const payloadFixtureUrls = [
    deterministicAtmospherePayloadUrls.observableCorAnglais,
    deterministicAtmospherePayloadUrls.observablePiano,
    deterministicAtmospherePayloadUrls.observableViolin,
    deterministicAtmospherePayloadUrls.peaceFlute,
    deterministicAtmospherePayloadUrls.treesPiano,
  ]
  const allowedExternalUrls = new Set([
    ...atmosphereSampleIndexFixtureUrls,
    ...payloadFixtureUrls,
  ])
  const health = await capturePageHealth(page, allowedExternalUrls)
  const atmosphereFixtures = await installAtmosphereFixtures(
    page,
    allowedExternalUrls,
    ["observable-streams", "peace", "trees"],
  )

  await page.addInitScript(() => {
    window.addEventListener("massagelab:atmosphere-startup-timing", (event) => {
      const existing = Reflect.get(window, "__massagelabAtmosphereTimings")
      const timings = Array.isArray(existing) ? existing : []
      Reflect.set(window, "__massagelabAtmosphereTimings", [
        ...timings,
        event instanceof CustomEvent ? event.detail : null,
      ])
    })
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/music", { waitUntil: "domcontentloaded" })
  const carousel = page.getByRole("region", { name: "Station carousel" })
  await expect(carousel).toBeVisible()
  const categoryGroup = page.getByRole("group", { name: "Station category" })
  const treatmentRoomCategory = categoryGroup.getByRole("button", {
    name: "Treatment room starters",
  })
  await expect(treatmentRoomCategory).toHaveAttribute("aria-pressed", "true")
  await expect(page.getByRole("heading", { name: /Treatment room starters/i })).toBeVisible()

  const proofSlide = await centerCarouselItem(page, "mlab-proof-drone", "Next station")
  const proofCard = proofSlide.locator("#station-mlab-proof-drone")
  const [proofBox, stageBox] = await Promise.all([
    proofCard.boundingBox(),
    page.getByTestId("station-carousel-stage").boundingBox(),
  ])
  expect(proofBox).not.toBeNull()
  expect(stageBox).not.toBeNull()
  expect(proofBox?.width ?? 0).toBeGreaterThan(0)
  expect(proofBox?.height ?? 0).toBeGreaterThan(0)
  expect(proofBox?.x ?? -1).toBeGreaterThanOrEqual((stageBox?.x ?? 0) - 1)
  expect(proofBox?.y ?? -1).toBeGreaterThanOrEqual((stageBox?.y ?? 0) - 1)
  expect((proofBox?.x ?? 0) + (proofBox?.width ?? 0)).toBeLessThanOrEqual(
    (stageBox?.x ?? 0) + (stageBox?.width ?? 0) + 1,
  )
  expect((proofBox?.y ?? 0) + (proofBox?.height ?? 0)).toBeLessThanOrEqual(
    (stageBox?.y ?? 0) + (stageBox?.height ?? 0) + 1,
  )

  const observableStreamsSlide = await centerCarouselItem(
    page,
    "observable-streams-probe",
    "Next station",
  )
  const observableStreamsStation = observableStreamsSlide.locator(
    "#station-observable-streams-probe",
  )
  await expect(observableStreamsStation.getByText("Observable Streams", { exact: true })).toBeVisible()
  await expect(observableStreamsStation.getByRole("img", { name: /Observable Streams station artwork/i })).toBeVisible()
  await expect(observableStreamsStation.getByText(/Piano, violin, and oboe-like tones/i)).toBeVisible()
  await observableStreamsStation.getByRole("button", { name: /Show full information/i }).click()
  const detailsDialog = page.getByRole("dialog")
  await expect(detailsDialog.getByRole("link", { name: "Alex Bainter · MIT" })).toBeVisible()
  await page.keyboard.press("Escape")

  await categoryGroup.getByRole("button", {
    name: "Water, nature, and field textures",
  }).click()
  await expect(page.getByRole("heading", { name: /Water, nature, and field textures/i })).toBeVisible()
  await treatmentRoomCategory.click()
  await expect(page.locator('[data-carousel-item-id="observable-streams-probe"]')).toHaveAttribute("data-centered", "true")

  await expect(page.getByText("Playable")).toHaveCount(0)
  await expect(page.getByText("Samples pending")).toHaveCount(0)
  await expect(page.getByText("This station is still being prepared for playback.")).toHaveCount(0)
  await expect(page.getByText(/hosted CC0|sample index|public-media/i)).toHaveCount(0)

  await observableStreamsStation.getByRole("button", { name: /^Play Observable Streams$/i }).click()
  await expect(observableStreamsStation.getByText(/Preparing station/i)).toBeVisible()
  await expect(observableStreamsStation.getByRole("button", { name: /^Stop Observable Streams$/i })).toBeVisible({ timeout: 45_000 })
  const expectedSampleFormat = await page.evaluate(() => {
    const audio = document.createElement("audio")
    if (audio.canPlayType('audio/ogg; codecs="opus"') !== "") return "opus"
    if (audio.canPlayType('audio/mp4; codecs="mp4a.40.2"') !== "") return "aac"
    if (audio.canPlayType("audio/mpeg") !== "") return "mp3"
    return "wav"
  })
  await expect
    .poll(async () => page.evaluate((expectedFormat) => {
      const startupTimings = Reflect.get(window, "__massagelabAtmosphereTimings")
      return Array.isArray(startupTimings) && startupTimings.some((startupTiming: unknown) => {
        if (!startupTiming || typeof startupTiming !== "object") {
          return false
        }

        const detail = startupTiming as Record<string, unknown>
        return detail.pieceId === "observable-streams"
          && detail.stationId === "observable-streams-probe"
          && detail.sampleFormat === expectedFormat
          && typeof detail.usedPrewarm === "boolean"
          && typeof detail.usedSamplePayloadPrewarm === "boolean"
          && typeof detail.samplePayloadPrewarmCount === "number"
          && typeof detail.sampleRequestBatchCount === "number"
          && typeof detail.sampleRequestMaxBatchSize === "number"
          && typeof detail.sampleRequestUniqueUrlCount === "number"
          && typeof detail.sampleRequestUrlCount === "number"
      })
    }, expectedSampleFormat), { timeout: 45_000 })
    .toBe(true)
  await observableStreamsStation.getByRole("button", { name: /^Stop Observable Streams$/i }).click()
  await expect(page.getByText(/Playing|Preparing audio|Preparing station/i)).toHaveCount(0)

  const smokePlaybackStations = [
    ["generative-fm-peace", "Peace"],
    ["generative-fm-trees", "Trees"],
    ["mlab-proof-drone", "Drone"],
  ] as const
  for (const [stationId, stationTitle] of smokePlaybackStations) {
    await centerCarouselItem(page, stationId, "Next station")
    await page.getByRole("button", { name: `Play ${stationTitle}` }).click()
    await expect(page.getByRole("button", { name: `Stop ${stationTitle}` })).toBeVisible({ timeout: 45_000 })
    await page.getByRole("button", { name: `Stop ${stationTitle}` }).click()
    await expect(page.getByText(/Playing|Preparing audio|Preparing station/i)).toHaveCount(0)
  }

  for (const pieceId of ["observable-streams", "peace", "trees"]) {
    expect(atmosphereFixtures.hitCount(atmosphereSampleIndexUrl(pieceId)), `${pieceId} sample-index fixture hits`).toBeGreaterThan(0)
  }
  for (const payloadUrl of payloadFixtureUrls) {
    expect(atmosphereFixtures.hitCount(payloadUrl), `${payloadUrl} fixture hits`).toBeGreaterThan(0)
  }

  expect(health.pageErrors, "uncaught page errors").toEqual([])
  expect(health.failedExternalRequests, "failed external requests").toEqual([])
  expect(health.unexpectedExternalRequests, "unexpected external requests").toEqual([])
  expect(health.consoleErrors, "browser console errors").toEqual([])
  expect(health.failedLocalResponses, "local 4xx/5xx responses").toEqual([])
  expect(health.forbiddenRequests, "anonymous account sync requests").toEqual([])
})

test("anonymous onboarding routes through login with an onboarding callback", async ({ page }) => {
  const health = await capturePageHealth(page, new Set())

  await page.goto("/onboarding", { waitUntil: "domcontentloaded" })

  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fonboarding/)
  await expect(page.getByRole("button", { name: /Sign in with email/i })).toBeVisible()
  await expect(page.getByRole("link", { name: /Create an account/i })).toHaveAttribute("href", "/register?callbackUrl=%2Fonboarding")

  expect(health.pageErrors, "uncaught page errors").toEqual([])
  expect(health.unexpectedExternalRequests, "unexpected external requests").toEqual([])
  expect(health.consoleErrors, "browser console errors").toEqual([])
  expect(health.failedLocalResponses, "local 4xx/5xx responses").toEqual([])
  expect(health.forbiddenRequests, "anonymous account sync requests").toEqual([])
})

test("anonymous registration legal gate routes through login before acceptance", async ({ page }) => {
  const health = await capturePageHealth(page, new Set())

  await page.goto("/legal/accept?callbackUrl=%2Fwellness", { waitUntil: "domcontentloaded" })

  await expect(page).toHaveURL(/\/login\?callbackUrl=/)
  const loginUrl = new URL(page.url())
  expect(loginUrl.searchParams.get("callbackUrl")).toBe("/legal/accept?callbackUrl=%2Fwellness")
  await expect(page.getByRole("button", { name: /Sign in with email/i })).toBeVisible()
  await expect(page.getByRole("link", { name: /Create an account/i })).toHaveAttribute(
    "href",
    "/register?callbackUrl=%2Flegal%2Faccept%3FcallbackUrl%3D%252Fwellness",
  )

  expect(health.pageErrors, "uncaught page errors").toEqual([])
  expect(health.unexpectedExternalRequests, "unexpected external requests").toEqual([])
  expect(health.consoleErrors, "browser console errors").toEqual([])
  expect(health.failedLocalResponses, "local 4xx/5xx responses").toEqual([])
  expect(health.forbiddenRequests, "anonymous account sync requests").toEqual([])
})

test("register defaults to Home before the optional account setup offer", async ({ page }) => {
  const health = await capturePageHealth(page, new Set())

  await page.goto("/register", { waitUntil: "domcontentloaded" })

  await expect(page.getByRole("heading", { name: /Create AtmoShaper account/i })).toBeVisible()
  await expect(page.getByRole("button", { name: /Create account/i })).toBeVisible()
  await expect(page.getByRole("link", { name: /Sign in instead/i })).toHaveAttribute("href", "/login?callbackUrl=%2F")

  expect(health.pageErrors, "uncaught page errors").toEqual([])
  expect(health.unexpectedExternalRequests, "unexpected external requests").toEqual([])
  expect(health.consoleErrors, "browser console errors").toEqual([])
  expect(health.failedLocalResponses, "local 4xx/5xx responses").toEqual([])
  expect(health.forbiddenRequests, "anonymous account sync requests").toEqual([])
})

test("homepage wordmark retains an accessible AtmoShaper heading in both themes", async ({ page }) => {
  const health = await capturePageHealth(page, new Set())

  await page.goto("/", { waitUntil: "domcontentloaded" })

  const brand = page.getByRole("heading", { level: 1, name: "AtmoShaper", exact: true })
  await expect(brand).toHaveAttribute("data-testid", "home-brand-wordmark")
  await expect(brand).toHaveText("AtmoShaper")
  await expect(page.getByTestId("home-brand-wordmark-image")).toHaveAttribute("src", "/brand/atmoshaper-wordmark.png")
  await expect.poll(() => page.getByTestId("home-brand-wordmark-image").evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true)

  await page.evaluate(() => {
    document.documentElement.classList.remove("dark")
    document.documentElement.classList.add("light")
  })
  await expect(brand).toBeVisible()
  await expect(brand).toHaveText("AtmoShaper")

  await page.evaluate(() => {
    document.documentElement.classList.remove("light")
    document.documentElement.classList.add("dark")
  })
  await expect(brand).toBeVisible()
  await expect(brand).toHaveText("AtmoShaper")

  expect(health.pageErrors, "uncaught page errors").toEqual([])
  expect(health.unexpectedExternalRequests, "unexpected external requests").toEqual([])
  expect(health.consoleErrors, "browser console errors").toEqual([])
  expect(health.failedLocalResponses, "local 4xx/5xx responses").toEqual([])
  expect(health.forbiddenRequests, "anonymous account sync requests").toEqual([])
})

test("theme switcher uses the compact toggle below desktop widths", async ({ page }) => {
  await page.setViewportSize({ width: 757, height: 682 })
  const health = await capturePageHealth(page, new Set())

  await page.goto("/", { waitUntil: "domcontentloaded" })

  const themeGroup = page.getByRole("group", { name: "Theme" })
  const themeToggle = themeGroup.getByRole("button", { name: /^Use (light|dark) theme$/i })
  await expect(themeToggle).toBeVisible()
  await expect(themeGroup.getByRole("radio")).toHaveCount(0)

  const initialThemeLabel = await themeToggle.getAttribute("aria-label")
  expect(initialThemeLabel).toMatch(/^Use (light|dark) theme$/)
  await themeToggle.click()
  await expect(themeToggle).toHaveAttribute(
    "aria-label",
    initialThemeLabel === "Use light theme" ? "Use dark theme" : "Use light theme",
  )

  expect(health.pageErrors, "uncaught page errors").toEqual([])
  expect(health.unexpectedExternalRequests, "unexpected external requests").toEqual([])
  expect(health.consoleErrors, "browser console errors").toEqual([])
  expect(health.failedLocalResponses, "local 4xx/5xx responses").toEqual([])
  expect(health.forbiddenRequests, "anonymous account sync requests").toEqual([])
})

test("homepage launcher labels remain contained on narrow and tablet screens", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  for (const viewport of [{width:320,height:640},{width:390,height:844},{width:768,height:1024}]) {
    await page.setViewportSize(viewport)
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await expect(page.getByTestId("home-launcher")).toBeVisible()
    const metrics = await page.getByTestId("home-launcher").locator(":scope > *").evaluateAll((elements) => elements.map((element) => ({client:element.clientWidth,scroll:element.scrollWidth})))
    expect(metrics).toHaveLength(6)
    for (const metric of metrics) expect(metric.scroll).toBeLessThanOrEqual(metric.client+1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  }
})

test("anonymous flashcards setup keeps prompt controls usable before count hydration", async ({ page }) => {
  const health = await capturePageHealth(page, new Set())

  await page.goto("/education/flashcards", { waitUntil: "domcontentloaded" })
  await expect(page.getByRole("heading", { name: "Build A Deck" })).toBeVisible()

  await page.getByRole("button", { name: "Browse Premade Decks" }).click()
  await expect(page.getByText(/1 of \d+/)).toHaveCount(0)
  await expect(page.getByRole("heading", { name: "Community Decks" })).toBeVisible()
  await page.getByRole("button", { name: "View" }).first().click()
  await expect(page.getByText(/Deck options loaded\. Adjust or start when ready\./)).toBeVisible()
  await expect(page.getByLabel("Deck Title")).not.toHaveValue("My flashcard deck")
  await expect(page.getByText(/1 of \d+/)).toHaveCount(0)

  await page.getByRole("button", { name: "Configure Custom Deck" }).click()
  await expect(page.getByText(/1 of \d+/)).toHaveCount(0)
  await expect(page.getByRole("heading", { name: "Build A Deck" })).toBeVisible()

  await setMuscleUpperExtremityFilters(page)
  await ensureSetupSectionOpen(page, /^Prompt Types\b/i, /^Recall Key Facts\b/i)
  await setPressedButton(page, /^Recall Key Facts\b/i, true)
  await setPressedButton(page, /^Identify Body Region\b/i, true)
  await setPressedButton(page, /^Identify Structure Type\b/i, true)
  await expect(page.getByText("Updating counts")).toHaveCount(0, { timeout: 20_000 })
  await expect(page.getByRole("button", { name: /^Identify From Image/i })).toBeVisible()
  await expect(page.getByRole("button", { name: /^Identify Body Region/i })).toBeEnabled()
  await waitForFilteredEligibleCount(page)

  const startButton = page.getByRole("button", { name: /Start [1-9]/ })
  await expect(startButton).toBeEnabled()

  const selectedPromptButtons = page.getByRole("button", { pressed: true })
  await expect(selectedPromptButtons.first()).toBeEnabled()

  await startButton.click()
  await expect(page.getByText(/1 of \d+/)).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText("Sourced Answer")).toHaveCount(0)
  await expect(page.getByRole("button", { name: /Check|Correct|Missed/i })).toBeVisible()

  expect(health.pageErrors, "uncaught page errors").toEqual([])
  expect(health.unexpectedExternalRequests, "unexpected external requests").toEqual([])
  expect(health.consoleErrors, "browser console errors").toEqual([])
  expect(health.failedLocalResponses, "local 4xx/5xx responses").toEqual([])
  expect(health.forbiddenRequests, "anonymous account sync requests").toEqual([])
})

test("anatomime shared game starts from the default setup", async ({ page }) => {
  const health = await capturePageHealth(page, new Set())
  let createPayload: { config?: { answerMode?: string; bodySystems?: string[]; clueLevel?: string; regions?: string[]; termCount?: number } } | null = null
  const teams = [
    { id: "team-1", name: "Team 1", sortOrder: 0, score: 0 },
    { id: "team-2", name: "Team 2", sortOrder: 1, score: 0 },
  ]
  const host = { playerId: "host-player", token: "host-token" }
  const baseSession = {
    code: "TEST01",
    status: "LOBBY",
    phase: "LOBBY",
    config: { answerMode: "host-judged", clueLevel: "easy", roundSeconds: 30, termCount: 4, roundLimit: 3, hardcoreMode: false },
    phaseEndsAt: null,
    reviewExpiresAt: null,
    teams,
    players: [{ id: host.playerId, teamId: null, displayName: "Host", signedIn: false, isHost: true, lastSeenAt: new Date().toISOString() }],
    viewer: { isHost: true, playerId: host.playerId, teamId: null },
    activeTeam: teams[0],
    activeItem: null,
    turnReview: [],
    recap: [],
  }
  const activeItem = {
    index: 0,
    total: 4,
    prompt: {
      id: "muscle-biceps-brachii",
      name: "Biceps Brachii",
      kind: "muscle",
      category: "muscle",
      categoryLabel: "Muscles",
      regions: ["upper-extremity"],
      regionLabels: ["Upper Extremity"],
      difficulty: "easy",
      aliases: ["biceps"],
      definition: "Anterior arm muscle used here as a shared-session prompt.",
      sourceRefs: ["test-source"],
    },
    choices: [],
    multipleChoiceUnlocksAt: null,
    pendingSteal: false,
  }
  let currentSession: any = baseSession

  await page.route("**/api/anatomime/sessions/TEST01/start", async (route) => {
    currentSession = {
      ...baseSession,
      status: "PLAYING",
      phase: "ACTIVE_TERM",
      phaseEndsAt: new Date(Date.now() + 30_000).toISOString(),
      activeItem,
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ session: currentSession }),
    })
  })
  await page.route("**/api/anatomime/sessions/TEST01", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ session: currentSession }),
    })
  })
  await page.route("**/api/anatomime/sessions", async (route) => {
    createPayload = route.request().postDataJSON()
    currentSession = baseSession
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ session: currentSession, host }),
    })
  })

  await page.goto("/anatomime", { waitUntil: "domcontentloaded" })
  await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => undefined)
  await page.waitForTimeout(250)
  await expect(page.getByText(/Round 1 of 3/i)).toHaveCount(0)
  await expect(page.getByRole("link", { name: /Join Shared Game/i })).toHaveAttribute("href", "/anatomime/join")
  await expect(page.getByText("Game info")).toBeVisible()
  await page.getByText("Game info").click()
  await expect(page.getByText("4 terms")).toBeVisible()
  await expect(page.getByText("30s turns")).toBeVisible()
  await page.getByRole("button", { name: /Choose Anatomy Terms/i }).click()
  await expect(page.getByRole("heading", { name: "Deck" })).toBeAttached()
  await expect(page.getByText("Anatomy filters")).toBeVisible()
  await expect(page.getByRole("group", { name: /Body systems/i })).toBeAttached()
  await expect(page.getByRole("button", { name: /^Expert$/i })).toBeAttached()
  await expect(page.getByText(/Deck size/i)).toHaveCount(0)
  await page.getByRole("button", { name: /Create Shared Game/i }).click()

  const postedCreatePayload = createPayload as { config?: { answerMode?: string; bodySystems?: string[]; clueLevel?: string; regions?: string[]; termCount?: number } } | null
  expect(postedCreatePayload?.config?.bodySystems?.length ?? 0).toBeGreaterThan(0)
  expect(postedCreatePayload?.config?.regions?.length ?? 0).toBeGreaterThan(0)
  expect(postedCreatePayload?.config?.clueLevel).toBe("easy")
  expect(postedCreatePayload?.config?.answerMode).toBe("host-judged")
  expect(postedCreatePayload?.config?.termCount).toBe(4)
  await expect(page.getByRole("group", { name: /Shared game invite for room TEST01/i })).toBeVisible()
  await expect(page.getByAltText("QR code for Anatomime room TEST01")).toBeVisible()
  await expect(page.getByRole("link", { name: /Join Shared Game/i })).toHaveAttribute("href", "/anatomime/join?code=TEST01")
  await expect(page.getByRole("button", { name: /Start Shared Game/i })).toBeVisible()

  await page.getByRole("button", { name: /Start Shared Game/i }).click()
  await expect(page.getByText("PLAYING")).toBeVisible()
  await expect(page.getByText("ACTIVE_TERM")).toBeVisible()
  await expect(page.getByRole("button", { name: /Start Shared Game/i })).toHaveCount(0)

  expect(health.pageErrors, "uncaught page errors").toEqual([])
  expect(health.unexpectedExternalRequests, "unexpected external requests").toEqual([])
  expect(health.consoleErrors, "browser console errors").toEqual([])
  expect(health.failedLocalResponses, "local 4xx/5xx responses").toEqual([])
  expect(health.forbiddenRequests, "anonymous account sync requests").toEqual([])
})

test("anatomime shared game create failures stay visible in setup", async ({ page }) => {
  await page.route("**/api/anatomime/sessions", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: "Shared games are not available right now. Please try again later.",
      }),
    })
  })

  await page.goto("/anatomime", { waitUntil: "domcontentloaded" })
  await page.getByRole("button", { name: /Choose Anatomy Terms/i }).click()
  await page.getByRole("button", { name: /Create Shared Game/i }).click()

  await expect(page.getByRole("button", { name: /Create Shared Game/i })).toBeVisible()
  await expect(page.getByText(/Shared games are not available right now/i)).toBeVisible()
})

test("anatomime player joins by code and submits typed guesses", async ({ page }) => {
  const allowedExternalUrls = new Set([externalFontUrl])
  const health = await capturePageHealth(page, allowedExternalUrls)
  await installExternalFontFixture(page, allowedExternalUrls)
  let ablyCdnRequestCount = 0
  page.on("request", (request) => {
    if (request.url() === ablyCdnUrl) ablyCdnRequestCount += 1
  })
  await page.addInitScript(() => {
    window.Ably = {
      Realtime: class {
        channels = { get: () => ({ subscribe() {}, unsubscribe() {} }) }
        close() {}
      },
    } as any
  })

  const teams = [
    { id: "team-1", name: "Team 1", sortOrder: 0, score: 0 },
    { id: "team-2", name: "Team 2", sortOrder: 1, score: 0 },
  ]
  const activeItem = {
    index: 0,
    total: 4,
    prompt: { id: "term-key-1", categoryLabel: "Muscles", regionLabels: ["Upper Extremity"], difficulty: "easy" },
    choices: [],
    multipleChoiceUnlocksAt: null,
    pendingSteal: false,
  }
  const player = { id: "player-1", teamId: "team-1", displayName: "Avery", signedIn: false, isHost: false, lastSeenAt: new Date().toISOString() }
  let currentSession: any = {
    code: "TEST01",
    status: "LOBBY",
    phase: "LOBBY",
    config: { answerMode: "typed", clueLevel: "easy", roundSeconds: 30, termCount: 4, roundLimit: 3, hardcoreMode: false },
    phaseEndsAt: null,
    reviewExpiresAt: null,
    teams,
    players: [{ id: "host-player", teamId: null, displayName: "Host", signedIn: false, isHost: true, lastSeenAt: new Date().toISOString() }],
    viewer: { isHost: false, playerId: null, teamId: null },
    activeTeam: teams[0],
    activeItem: null,
    turnReview: [],
    recap: [],
  }
  let guessCount = 0

  await page.route("**/api/anatomime/sessions/TEST01/realtime-token", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ keyName: "test", nonce: "nonce", mac: "mac" }) })
  })
  await page.route("**/api/anatomime/sessions/TEST01/join", async (route) => {
    currentSession = {
      ...currentSession,
      status: "PLAYING",
      phase: "ACTIVE_TERM",
      phaseEndsAt: new Date(Date.now() + 30_000).toISOString(),
      players: [...currentSession.players, player],
      viewer: { isHost: false, playerId: player.id, teamId: player.teamId },
      activeItem,
    }
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ player: { id: player.id, token: "player-token", teamId: player.teamId }, session: currentSession }),
    })
  })
  await page.route("**/api/anatomime/sessions/TEST01/guess", async (route) => {
    guessCount += 1
    if (guessCount === 1) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ result: { correct: false, scoreAwarded: 0, feedbackKind: "incorrect" }, session: currentSession }),
      })
      return
    }

    currentSession = {
      ...currentSession,
      activeItem: { ...activeItem, index: 1, prompt: { id: "term-key-2" } },
      teams: [{ ...teams[0], score: 1 }, teams[1]],
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ result: { correct: true, scoreAwarded: 1, feedbackKind: "active-correct" }, session: currentSession }),
    })
  })
  await page.route((url) => url.pathname === "/api/anatomime/sessions/TEST01", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ session: currentSession }) })
  })

  await page.goto("/anatomime/join", { waitUntil: "domcontentloaded" })
  await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => undefined)
  await page.waitForTimeout(250)
  await page.getByLabel("Code").fill("TEST01")
  await page.getByRole("button", { name: /Find Game/i }).click()
  await page.getByLabel("Display name").fill("Avery")
  await page.getByRole("button", { name: /Join Team/i }).click()

  await expect(page.getByText("Your team's turn")).toBeVisible()
  await expect(page.getByText("Submit a typed answer before time runs out.")).toBeVisible()
  await expect(page.getByLabel("Guess")).toBeVisible()
  await page.getByLabel("Guess").fill("wrong")
  await page.getByRole("button", { name: /Submit Guess/i }).click()
  await expect(page.getByText("Incorrect. Try another guess.").first()).toBeVisible()
  await expect(page.getByLabel("Guess")).toHaveValue("")
  await page.getByLabel("Guess").fill("scapula")
  await page.getByRole("button", { name: /Submit Guess/i }).click()
  await expect(page.getByText("Correct. Your team scored.").first()).toBeVisible()
  await expect(page.getByText("2 of 4")).toBeVisible()
  expect(ablyCdnRequestCount, "injected Ably fixture must prevent the CDN loader").toBe(0)

  expect(health.pageErrors, "uncaught page errors").toEqual([])
  expect(health.failedExternalRequests, "failed external requests").toEqual([])
  expect(health.unexpectedExternalRequests, "unexpected external requests").toEqual([])
  expect(health.consoleErrors, "browser console errors").toEqual([])
  expect(health.failedLocalResponses, "local 4xx/5xx responses").toEqual([])
  expect(health.forbiddenRequests, "anonymous account sync requests").toEqual([])
})

test("anatomime player sees steal guidance when another team is active", async ({ page }) => {
  const fontFixtureUrls = new Set([externalFontUrl])
  await installExternalFontFixture(page, fontFixtureUrls)
  await page.addInitScript(() => {
    window.localStorage.setItem("massagelab-anatomime-player:TEST01", JSON.stringify({
      playerId: "player-2",
      playerToken: "player-token",
      teamId: "team-2",
    }))
    window.Ably = {
      Realtime: class {
        channels = { get: () => ({ subscribe() {}, unsubscribe() {} }) }
        close() {}
      },
    } as any
  })

  const teams = [
    { id: "team-1", name: "Team 1", sortOrder: 0, score: 0 },
    { id: "team-2", name: "Team 2", sortOrder: 1, score: 0 },
  ]
  const currentSession = {
    code: "TEST01",
    status: "PLAYING",
    phase: "ACTIVE_TERM",
    config: { answerMode: "typed", clueLevel: "easy", roundSeconds: 30, termCount: 4, roundLimit: 3, hardcoreMode: false },
    phaseEndsAt: new Date(Date.now() + 30_000).toISOString(),
    reviewExpiresAt: null,
    teams,
    players: [
      { id: "host-player", teamId: null, displayName: "Host", signedIn: false, isHost: true, lastSeenAt: new Date().toISOString() },
      { id: "player-2", teamId: "team-2", displayName: "Blake", signedIn: false, isHost: false, lastSeenAt: new Date().toISOString() },
    ],
    viewer: { isHost: false, playerId: "player-2", teamId: "team-2" },
    activeTeam: teams[0],
    activeItem: {
      index: 0,
      total: 4,
      prompt: { id: "term-key-1", categoryLabel: "Muscles", regionLabels: ["Upper Extremity"], difficulty: "easy" },
      choices: [],
      multipleChoiceUnlocksAt: null,
      pendingSteal: false,
    },
    turnReview: [],
    recap: [],
  }

  await page.route("**/api/anatomime/sessions/TEST01/realtime-token", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ keyName: "test", nonce: "nonce", mac: "mac" }) })
  })
  await page.route((url) => url.pathname === "/api/anatomime/sessions/TEST01", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ session: currentSession }) })
  })

  await page.goto("/anatomime/play/TEST01", { waitUntil: "domcontentloaded" })
  await expect(page.getByText("Team 1's turn")).toBeVisible()
  await expect(page.getByText("Steal/practice mode")).toBeVisible()
  await expect(page.getByText("Type the answer first to queue a steal if Team 1 misses.")).toBeVisible()
  await expect(page.getByLabel("Guess")).toBeVisible()
})

test("anatomime stale player pass offers rejoin recovery", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("massagelab-anatomime-player:TEST01", JSON.stringify({
      playerId: "old-player",
      playerToken: "old-token",
      teamId: "team-1",
    }))
    window.Ably = {
      Realtime: class {
        channels = { get: () => ({ subscribe() {}, unsubscribe() {} }) }
        close() {}
      },
    } as any
  })

  const teams = [
    { id: "team-1", name: "Team 1", sortOrder: 0, score: 0 },
    { id: "team-2", name: "Team 2", sortOrder: 1, score: 0 },
  ]
  const currentSession = {
    code: "TEST01",
    status: "LOBBY",
    phase: "LOBBY",
    config: { answerMode: "typed", clueLevel: "easy", roundSeconds: 30, termCount: 4, roundLimit: 3, hardcoreMode: false },
    phaseEndsAt: null,
    reviewExpiresAt: null,
    teams,
    players: [{ id: "host-player", teamId: null, displayName: "Host", signedIn: false, isHost: true, lastSeenAt: new Date().toISOString() }],
    viewer: { isHost: false, playerId: null, teamId: null },
    activeTeam: null,
    activeItem: null,
    turnReview: [],
    recap: [],
  }

  await page.route("**/api/anatomime/sessions/TEST01/realtime-token", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ keyName: "test", nonce: "nonce", mac: "mac" }) })
  })
  await page.route((url) => url.pathname === "/api/anatomime/sessions/TEST01", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ session: currentSession }) })
  })

  await page.goto("/anatomime/play/TEST01", { waitUntil: "domcontentloaded" })
  await expect(page.getByText("Rejoin needed on this device")).toBeVisible()
  await expect(page.getByRole("button", { name: "Clear Saved Player" })).toBeVisible()
  await page.getByRole("button", { name: "Clear Saved Player" }).click()
  await expect(page.getByText("Rejoin needed on this device")).toHaveCount(0)
  await expect(page.getByLabel("Display name")).toBeVisible()
})

test("anatomime multiple-choice options unlock only on player devices", async ({ page }) => {
  const fontFixtureUrls = new Set([externalFontUrl])
  await installExternalFontFixture(page, fontFixtureUrls)
  await page.addInitScript(() => {
    window.localStorage.setItem("massagelab-anatomime-player:TEST01", JSON.stringify({
      playerId: "player-1",
      playerToken: "player-token",
      teamId: "team-1",
    }))
    window.Ably = {
      Realtime: class {
        channels = { get: () => ({ subscribe() {}, unsubscribe() {} }) }
        close() {}
      },
    } as any
  })

  const teams = [
    { id: "team-1", name: "Team 1", sortOrder: 0, score: 0 },
    { id: "team-2", name: "Team 2", sortOrder: 1, score: 0 },
  ]
  const choices = [
    { id: "choice-1", label: "Scapula" },
    { id: "choice-2", label: "Clavicle" },
    { id: "choice-3", label: "Humerus" },
    { id: "choice-4", label: "Sternum" },
  ]
  const makeSession = (unlocked: boolean) => ({
    code: "TEST01",
    status: "PLAYING",
    phase: "ACTIVE_TERM",
    config: { answerMode: "multiple-choice", clueLevel: "easy", roundSeconds: 30, termCount: 4, roundLimit: 3, hardcoreMode: false },
    phaseEndsAt: new Date(Date.now() + 30_000).toISOString(),
    reviewExpiresAt: null,
    teams,
    players: [
      { id: "host-player", teamId: null, displayName: "Host", signedIn: false, isHost: true, lastSeenAt: new Date().toISOString() },
      { id: "player-1", teamId: "team-1", displayName: "Avery", signedIn: false, isHost: false, lastSeenAt: new Date().toISOString() },
    ],
    viewer: { isHost: false, playerId: "player-1", teamId: "team-1" },
    activeTeam: teams[0],
    activeItem: {
      index: 0,
      total: 4,
      prompt: { id: "term-key-1" },
      choices,
      multipleChoiceUnlocksAt: new Date(Date.now() + (unlocked ? -1000 : 20_000)).toISOString(),
      pendingSteal: false,
    },
    turnReview: [],
    recap: [],
  })
  let currentSession = makeSession(false)

  await page.route("**/api/anatomime/sessions/TEST01/realtime-token", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ keyName: "test", nonce: "nonce", mac: "mac" }) })
  })
  await page.route((url) => url.pathname === "/api/anatomime/sessions/TEST01", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ session: currentSession }) })
  })

  await page.goto("/anatomime/play/TEST01", { waitUntil: "domcontentloaded" })
  await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => undefined)
  await page.waitForTimeout(250)
  await expect(page.getByLabel("Guess")).toBeVisible()
  await expect(page.getByText("Type a guess now; answer choices unlock near the end.")).toBeVisible()
  await expect(page.getByRole("group", { name: /Multiple choice answers/i })).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Scapula" })).toHaveCount(0)

  currentSession = makeSession(true)
  await page.reload({ waitUntil: "domcontentloaded" })
  await expect(page.getByText("Pick an answer choice before time runs out.")).toBeVisible()
  await expect(page.getByRole("group", { name: /Multiple choice answers/i })).toBeVisible()
  for (const choice of choices) {
    await expect(page.getByRole("button", { name: choice.label })).toBeVisible()
  }
})

test("flashcards can start from local sourced prompts when the prompt API is unavailable", async ({ page }) => {
  let promptApiRequests = 0

  await page.route("**/api/education/flashcards/prompts", async (route) => {
    promptApiRequests += 1
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Prompt API unavailable for browser test." }),
    })
  })

  await page.goto("/education/flashcards", { waitUntil: "domcontentloaded" })
  await expect(page.getByRole("heading", { name: "Build A Deck" })).toBeVisible()

  await setMuscleUpperExtremityFilters(page)
  await page.getByLabel("Deck Size", { exact: true }).fill("10")
  await setPressedButton(page, /^Flip & Self-Grade\b/i, true)
  await ensureSetupSectionOpen(page, /^Prompt Types\b/i, /^Identify From Image\b/i)
  await setPressedButton(page, /^Identify From Image\b/i, false)
  await setPressedButton(page, /^Identify Body Region\b/i, false)
  await setPressedButton(page, /^Identify Structure Type\b/i, false)
  await setPressedButton(page, /^Muscle Action\b/i, true)

  const startButton = page.getByRole("button", { name: /Start 10/ })
  await expect(startButton).toBeEnabled()
  await startButton.click()

  await expect(page.getByText(/1 of 10/)).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText("Practice only").first()).toBeVisible()
  await expect(page.getByRole("button", { name: "Reveal Answer" })).toBeVisible()
  await expect(page.getByText("Sourced Answer")).toHaveCount(0)
  await page.getByRole("button", { name: "Flip flashcard to answer" }).click()
  await expect(page.getByText("Sourced Answer")).toBeVisible()
  await page.getByRole("button", { name: "Show Prompt" }).click()
  await expect(page.getByText("Sourced Answer")).toHaveCount(0)
  await page.getByRole("button", { name: "Reveal Answer" }).click()
  await expect(page.getByText("Sourced Answer")).toBeVisible()
  await expect(page.getByRole("button", { name: /Correct/i })).toBeVisible()
  expect(promptApiRequests).toBeGreaterThan(0)
})

test("flashcards setup explains empty prompt filters before study starts", async ({ page }) => {
  let promptCatalogRequests = 0

  await page.route("**/api/education/flashcards/prompts", async (route) => {
    promptCatalogRequests += 1
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        promptTypeCounts: [
          { id: "anatomime_name_recall", label: "Name Recall", promptCount: 0 },
          { id: "identify_from_media", label: "Identify From Image", promptCount: 0 },
          { id: "name_to_summary", label: "Recall Summary", promptCount: 0 },
          { id: "name_to_region", label: "Identify Body Region", promptCount: 0 },
          { id: "name_to_category", label: "Identify Structure Type", promptCount: 0 },
          { id: "muscle_origin_insertion", label: "Muscle Origin/Insertion", promptCount: 0 },
          { id: "muscle_action", label: "Muscle Action", promptCount: 0 },
          { id: "muscle_innervation", label: "Muscle Innervation", promptCount: 0 },
        ],
        promptSummaries: [],
      }),
    })
  })

  await page.goto("/education/flashcards", { waitUntil: "domcontentloaded" })
  await expect(page.getByRole("heading", { name: "Build A Deck" })).toBeVisible()
  await expect.poll(() => promptCatalogRequests).toBeGreaterThan(0)
  await expect(page.getByText("Updating counts")).toHaveCount(0, { timeout: 20_000 })

  const startButton = page.getByRole("button", { name: "No cards to start" })
  await expect(startButton).toBeVisible()
  await expect(startButton).toBeDisabled()
  await expect(page.getByText("No eligible cards match these filters.")).toBeVisible()
  await expect(page.getByRole("button", { name: "Reset filters" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Save", exact: true })).toBeDisabled()
})

test("signed-in flashcards fall back to temporary study when progress session fails", async ({ page }) => {
  let sessionStartRequests = 0

  await page.route("**/api/auth/session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ user: { id: "browser-test-user" } }),
    })
  })
  await page.route("**/api/education/flashcards/progress", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        progress: {
          trackedPromptCount: 2,
          activePromptCount: 1,
          masteredPromptCount: 1,
          totalAttempts: 12,
          totalCorrect: 10,
          totalIncorrect: 2,
          accuracyPercent: 83,
          masteryThreshold: 10,
          completedSessionCount: 1,
          achievementCount: 1,
          bestDurationMs: 45000,
          targetPromptCount: 2,
          roundCompletionPercent: 50,
          completedRoundCount: 0,
          currentRound: 1,
          canStartNextRound: false,
        },
        recentProgress: [{
          promptId: "name_to_region:muscle-biceps-brachii",
          promptType: "name_to_region",
          entityType: "muscle",
          entitySlug: "biceps-brachii",
          status: "MASTERED",
          score: 100,
          attemptCount: 10,
          correctCount: 10,
          incorrectCount: 0,
          lifetimeAttemptCount: 10,
          lifetimeCorrectCount: 10,
          lifetimeIncorrectCount: 0,
          masteryThreshold: 10,
          masteryRound: 1,
          masteredAt: "2026-06-07T00:00:00.000Z",
          lastSeenAt: "2026-06-07T00:00:00.000Z",
        }],
        achievements: [{ key: "flashcards:first-completion", earnedAt: "2026-06-07T00:00:00.000Z" }],
      }),
    })
  })
  await page.route("**/api/education/flashcards/sessions", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback()
      return
    }

    sessionStartRequests += 1
    expect(JSON.parse(route.request().postData() ?? "{}").skipMastered).toBe(true)
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Progress tracking could not be started." }),
    })
  })

  await page.goto("/education/flashcards", { waitUntil: "domcontentloaded" })
  await expect(page.getByRole("heading", { name: "Build A Deck" })).toBeVisible()
  await expect(page.getByRole("link", { name: /Sign in to save progress/i })).toHaveCount(0)
  await expect(page.getByRole("heading", { name: "Your Progress" })).toBeVisible()
  await expect(page.getByText("Biceps Brachii")).toBeVisible()
  await page.getByLabel("Skip mastered prompts").click()

  const startButton = page.getByRole("button", { name: /Start [1-9]/ })
  await expect(startButton).toBeEnabled()
  await startButton.click()

  await expect(page.getByText(/1 of \d+/)).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(/Studying temporarily; progress tracking could not be started\./i)).toBeVisible()
  expect(sessionStartRequests).toBeGreaterThan(0)
})

test("signed-in flashcards can claim a mastery round and refresh progress", async ({ page }) => {
  let progressRequests = 0
  let roundStartRequests = 0
  let roundClaimed = false
  let delayedRoundRefresh = false
  let releaseProgressRefresh: (() => void) | undefined
  const progressRefreshStarted = new Promise<void>((resolve) => {
    releaseProgressRefresh = resolve
  })

  const progressPayload = () => ({
    progress: {
      trackedPromptCount: 2,
      activePromptCount: roundClaimed ? 2 : 0,
      masteredPromptCount: roundClaimed ? 0 : 2,
      totalAttempts: 20,
      totalCorrect: 20,
      totalIncorrect: 0,
      accuracyPercent: 100,
      masteryThreshold: 10,
      completedSessionCount: 4,
      achievementCount: roundClaimed ? 2 : 1,
      bestDurationMs: 45000,
      targetPromptCount: 2,
      roundCompletionPercent: roundClaimed ? 0 : 100,
      completedRoundCount: roundClaimed ? 1 : 0,
      currentRound: roundClaimed ? 2 : 1,
      canStartNextRound: !roundClaimed,
    },
    recentProgress: [],
    achievements: [{ key: "flashcards:first-completion", earnedAt: "2026-06-07T00:00:00.000Z" }],
    promptTypeProgress: [
      {
        key: "name_to_region",
        label: "Identify Body Region",
        totalCount: 2,
        trackedCount: roundClaimed ? 0 : 2,
        masteredCount: roundClaimed ? 0 : 2,
        remainingCount: roundClaimed ? 2 : 0,
        completionPercent: roundClaimed ? 0 : 100,
      },
    ],
    regionProgress: [
      {
        key: "upper-extremity",
        label: "Upper Extremity",
        totalCount: 2,
        trackedCount: roundClaimed ? 0 : 2,
        masteredCount: roundClaimed ? 0 : 2,
        remainingCount: roundClaimed ? 2 : 0,
        completionPercent: roundClaimed ? 0 : 100,
      },
    ],
  })

  await page.route("**/api/auth/session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ user: { id: "browser-test-user" } }),
    })
  })
  await page.route("**/api/education/flashcards/progress", async (route) => {
    progressRequests += 1
    if (roundClaimed && !delayedRoundRefresh) {
      delayedRoundRefresh = true
      await progressRefreshStarted
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(progressPayload()),
    })
  })
  await page.route("**/api/education/flashcards/progress/round", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback()
      return
    }

    roundStartRequests += 1
    roundClaimed = true
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        round: {
          round: 1,
          nextRound: 2,
          targetPromptCount: 2,
          masteredPromptCount: 2,
        },
      }),
    })
  })

  await page.goto("/education/flashcards", { waitUntil: "domcontentloaded" })
  await expect(page.getByRole("heading", { name: "Your Progress" })).toBeVisible()

  const claimButton = page.getByRole("button", { name: "Claim round and start next" })
  await expect(claimButton).toBeVisible()
  await expect(claimButton).toBeEnabled()
  await claimButton.click()

  const pendingClaimButton = page
    .getByRole("button", { name: "Starting..." })
    .or(page.getByRole("button", { name: "Claim round and start next" }))
    .first()
  await expect(pendingClaimButton).toBeDisabled()
  releaseProgressRefresh?.()

  await expect(page.getByText("Round 1 complete. Round 2 is ready.")).toBeVisible()
  await expect(page.getByText("2 prompts remain before your next completion badge.")).toBeVisible()
  expect(roundStartRequests).toBe(1)
  expect(progressRequests).toBeGreaterThan(1)
})
