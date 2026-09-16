import { errors, expect, test, type Locator, type Page } from "@playwright/test"

import { centerCarouselItem } from "./carousel-test-helpers"

const PRODUCT_NAME = "AtmoShaper"
const GENERAL_LEGAL_VERSION = "2026-09-legal-v3"
const DIGITAL_LEGAL_VERSION = "2026-09-digital-purchases-v3"
const LEGAL_IDENTITY = "Derrick Bowersock, doing business as AtmoShaper"

// The active tool ring is a canvas animation; use its real accessibility state.
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
})

async function gotoReady(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" })
  await page.waitForLoadState("load")
  await page.evaluate(async () => {
    await document.fonts.ready
  })
}

async function expectMusicReady(page: Page) {
  await expect(page.getByRole("heading", {
    level: 1,
    name: "Atmosphere",
    exact: true,
    includeHidden: true,
  })).toBeAttached()
  await expect(page.getByRole("region", { name: "Atmosphere audio stations", exact: true }))
    .toHaveAttribute("data-music-storage-status", "available")

  // Both responsive bars share this owner. Keep the real painted ring and glyph.
  const ring = page.locator(".ml-app-tool-link-active-ring:visible")
  await expect(ring).toHaveCount(1)
  await expect(ring).toHaveAttribute("data-ml-metal-motion-state", "paused")
  await expect(ring).toHaveAttribute("data-paused", "true")
  const canvas = ring.locator("canvas.metal-fx-canvas")
  await expect(canvas).toHaveCount(1)
  await expect(canvas).toBeVisible()
  await expect(canvas).toHaveCSS("opacity", "0.72")
  await expect.poll(() => canvas.evaluate((element: HTMLCanvasElement) => {
    const pixels = element.getContext("2d")!.getImageData(0, 0, element.width, element.height).data
    return pixels.some((value, index) => index % 4 === 3 && value > 0)
  })).toBe(true)
  const icon = ring.getByRole("link", { name: "Open music", exact: true }).locator("svg")
  await expect(icon).toHaveCount(1)
  await expect(icon).toBeVisible()
}

/** Wait for layout convergence and CSS transitions before comparing geometry. */
async function settledBox(locator: Locator) {
  let previous = ""
  let stableSamples = 0
  await expect.poll(async () => {
    const state = await locator.evaluate((element) => ({
      box: element.getBoundingClientRect().toJSON(),
      animating: element.getAnimations().some((animation) => animation.playState === "running"),
    }))
    const current = JSON.stringify(state.box)
    stableSamples = !state.animating && current === previous ? stableSamples + 1 : 0
    previous = current
    return stableSamples >= 2
  }, { intervals: [100], message: "layout has settled across consecutive geometry samples" }).toBe(true)
  const box = await locator.boundingBox()
  expect(box).not.toBeNull()
  return box!
}

async function expectTextFits(brand: Locator) {
  const text = brand.locator(".ml-app-bar-brand-text")
  await settledBox(brand)
  await expect(text).toBeVisible()
  await expect(text).toHaveText(PRODUCT_NAME)
  const fit = await text.evaluate((element) => {
    const textBox = element.getBoundingClientRect()
    const brandBox = element.parentElement!.getBoundingClientRect()
    return {
      horizontalOverflow: element.scrollWidth - element.clientWidth,
      outsideBrand: Math.max(
        brandBox.left - textBox.left,
        textBox.right - brandBox.right,
        brandBox.top - textBox.top,
        textBox.bottom - brandBox.bottom,
      ),
    }
  })
  expect(fit.horizontalOverflow).toBeLessThanOrEqual(1)
  expect(fit.outsideBrand).toBeLessThanOrEqual(1)
}

/** Follows the visible account owner as hydration replaces the desktop rail with a drawer. */
async function openAccountMenu(page: Page) {
  const trigger = page.getByTestId("account-menu-trigger").filter({ visible: true })
  const helpItem = page.getByRole("menuitem", { name: "Help & FAQ", exact: true })
  const navigation = page.getByRole("button", { name: /^(?:Open|Close) navigation$/ }).filter({ visible: true })
  const openClosedOwner = async (owner: Locator) => {
    // Re-resolve only a closed owner, so replacement cannot toggle an open menu shut.
    const closed = owner.and(page.locator('[aria-expanded="false"]'))
    const count = await closed.count()
    expect(count).toBeLessThanOrEqual(1)
    if (count === 0) return
    // Sheet owns a 500 ms entrance even under reduced motion. Poll its actual
    // finite animation instead of spending an action timeout while it moves.
    const drawerEntering = await closed.evaluateAll((elements) => elements.some((element) => {
      const drawer = element.closest('[data-sidebar="sidebar"][data-mobile="true"][data-state="open"]')
      return drawer?.getAnimations().some((animation) => (
        animation instanceof CSSAnimation && animation.animationName === "enter" &&
        animation.playState === "running" && animation.effect?.getTiming().iterations === 1
      )) ?? false
    }))
    if (drawerEntering) return
    try {
      // One short action attempt leaves the outer poll in charge of hydration.
      await closed.click({ timeout: 100 })
    } catch (error) {
      // Only absence/already-open after a bounded action timeout is transient.
      if (!(error instanceof errors.TimeoutError) || await closed.count() !== 0) throw error
    }
  }
  await expect.poll(async () => {
    if (await helpItem.isVisible()) return true
    const triggerCount = await trigger.count()
    expect(triggerCount).toBeLessThanOrEqual(1)
    if (triggerCount === 0) {
      await openClosedOwner(navigation)
    } else {
      await openClosedOwner(trigger)
    }
    return helpItem.isVisible()
  }).toBe(true)
  await expect(trigger).toHaveCount(1)
  await expect(helpItem).toHaveCount(1)
  await expect(helpItem).toBeVisible()
}

test("presents the text-only product identity across homepage and responsive app bars", async ({ page }, testInfo) => {
  await page.setViewportSize(testInfo.project.name === "mobile-chromium"
    ? { width: 320, height: 568 }
    : { width: 1440, height: 900 })
  await gotoReady(page, "/")

  const homeBrand = page.getByTestId("home-brand-wordmark")
  await expect(homeBrand).toHaveText(PRODUCT_NAME)
  await expect(homeBrand.locator("img")).toHaveCount(0)
  await expect(page.getByRole("heading", { level: 1, name: PRODUCT_NAME, exact: true })).toHaveCount(1)
  await expect(homeBrand).toHaveScreenshot("home-product.png", { animations: "disabled" })

  await page.setViewportSize({ width: 1440, height: 900 })
  await gotoReady(page, "/music")
  await expectMusicReady(page)
  const desktopBar = page.locator("header.ml-app-topbar")
  await expect(desktopBar).toBeVisible()
  const desktopBrand = desktopBar.getByRole("link", { name: "AtmoShaper home", exact: true })
  await expect(desktopBrand).toHaveText(PRODUCT_NAME)
  await expect(desktopBrand.locator("img")).toHaveCount(0)
  await expectTextFits(desktopBrand)

  await page.setViewportSize({ width: 768, height: 1024 })
  await gotoReady(page, "/music")
  await expectMusicReady(page)
  const tabletBar = page.locator("header.ml-app-topbar")
  await expect(tabletBar).toBeVisible()
  const tabletBrand = tabletBar.getByRole("link", { name: "AtmoShaper home", exact: true })
  await expect(tabletBrand).toHaveText(PRODUCT_NAME)
  await expect(tabletBrand.locator("img")).toHaveCount(0)
  await expectTextFits(tabletBrand)
  await expect(tabletBar).toHaveScreenshot("app-bar-tablet.png", { animations: "disabled" })
  await expectTextFits(tabletBrand)

  await page.setViewportSize({ width: 320, height: 568 })
  await gotoReady(page, "/music")
  await expectMusicReady(page)
  const narrowBar = page.getByRole("navigation", { name: "AtmoShaper main navigation" })
  await expect(narrowBar).toBeVisible()
  const narrowBrand = narrowBar.getByRole("link", { name: "AtmoShaper home", exact: true })
  await expect(narrowBrand).toHaveText(PRODUCT_NAME)
  await expect(narrowBrand.locator("img")).toHaveCount(0)
  await expectTextFits(narrowBrand)
  const [barBox, brandBox] = await Promise.all([narrowBar.boundingBox(), narrowBrand.boundingBox()])
  expect(barBox).not.toBeNull()
  expect(brandBox).not.toBeNull()
  expect(brandBox!.x).toBeGreaterThanOrEqual(barBox!.x - 1)
  expect(brandBox!.x + brandBox!.width).toBeLessThanOrEqual(barBox!.x + barBox!.width + 1)
})

test("keeps Atmosphere navigation, transport labels, and closed or expanded geometry coherent", async ({ page }) => {
  await gotoReady(page, "/music")
  await expectMusicReady(page)
  await page.getByRole("group", { name: "Station category" })
    .getByRole("button", { name: "Atmosphere", exact: true })
    .click()
  const workspace = page.getByLabel("Atmosphere live mixer")
  await expect(workspace).toBeVisible()
  await expect(page.getByRole("heading", { name: "Sound Library" })).toBeVisible()

  const noiseTab = page.getByRole("tab", { name: "Noise" })
  if (await noiseTab.getAttribute("aria-selected") !== "true") await noiseTab.click()
  await page.getByRole("button", { name: "Add White noise" }).click()
  const dialog = page.getByRole("dialog", { name: "Current Mix controls" })
  if (await dialog.isVisible()) {
    await dialog.getByRole("button", { name: "Close Current Mix" }).click()
  }

  const rail = page.getByLabel("Current Mix rail")
  await expect(rail).toBeVisible()
  await expect(rail).toHaveAttribute("data-expanded", "false")
  await expect(rail.getByRole("button", { name: "Play Atmosphere" })).toBeVisible()
  const closedBox = await settledBox(rail)
  // Capture the configured desktop/mobile viewport, including the fixed outer rail.
  await expect(page).toHaveScreenshot("atmosphere-closed.png", { animations: "disabled" })

  await rail.getByRole("button", { name: "Open Current Mix" }).click()
  await expect(rail).toHaveAttribute("data-expanded", "true")
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole("button", { name: "Play Atmosphere" })).toBeVisible()
  await expect(dialog.getByRole("button", { name: "Close Current Mix" })).toBeVisible()
  // The persistent outer rail owns width and anchors in both states.
  const expandedBox = await settledBox(rail)
  expect(expandedBox.width).toBeGreaterThan(closedBox.width)
  expect(Math.abs(expandedBox.y - closedBox.y)).toBeLessThanOrEqual(2)
  expect(Math.abs(
    expandedBox.y + expandedBox.height - (closedBox.y + closedBox.height),
  )).toBeLessThanOrEqual(2)
  await expect(page).toHaveScreenshot("atmosphere-expanded.png", { animations: "disabled" })
})

test("uses AtmoShaper in install, manifest, and SEO contracts without an old social image", async ({ page, request }) => {
  const manifestResponse = await request.get("/manifest.webmanifest")
  expect(manifestResponse.ok()).toBe(true)
  await expect.poll(async () => manifestResponse.headers()["content-type"]).toContain("application/manifest+json")
  expect(await manifestResponse.json()).toMatchObject({
    id: "/",
    name: PRODUCT_NAME,
    short_name: PRODUCT_NAME,
    start_url: "/",
    scope: "/",
    display: "standalone",
  })

  await page.addInitScript(() => {
    Object.defineProperties(navigator, {
      userAgent: {
        configurable: true,
        value: "Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
      },
      platform: { configurable: true, value: "iPhone" },
      maxTouchPoints: { configurable: true, value: 5 },
    })
  })
  await gotoReady(page, "/")
  await expect(page.getByTestId("home-brand-wordmark")).toBeVisible()
  await openAccountMenu(page)
  await page.getByRole("menuitem", { name: "Install AtmoShaper" }).click()
  const install = page.getByRole("dialog", { name: "Install AtmoShaper" })
  await expect(install).toBeVisible()
  await expect(install).toContainText("Add to Home Screen")

  await expect(page.locator('meta[property="og:image"]')).toHaveCount(0)
  await expect(page.locator('meta[name="twitter:image"]')).toHaveCount(0)
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/manifest.webmanifest")
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https:\/\/www\.massagelab\.app\/?$/)
  await expect(page.locator('meta[property="og:url"]')).toHaveCount(1)
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", /^https:\/\/www\.massagelab\.app\/?$/)
})

test("publishes the v3 legal identity and keeps general, digital, and acceptance versions distinct", async ({ page }) => {
  await gotoReady(page, "/legal")
  // LayoutWrapper owns visible route content; hidden copies are not the page.
  const legalContent = page.locator("main .ml-app-content:visible")
  await expect(legalContent).toHaveCount(1)
  const legalTitle = legalContent.getByText("Legal and trust documents", { exact: true }).filter({ visible: true })
  await expect(legalTitle).toHaveCount(1)
  await expect(legalTitle).toBeVisible()
  const indexDescription = legalContent.getByText(
    `${LEGAL_IDENTITY}. Current document version ${GENERAL_LEGAL_VERSION}.`,
    { exact: true },
  ).filter({ visible: true })
  await expect(indexDescription).toHaveCount(1)
  await expect(indexDescription).toBeVisible()

  await gotoReady(page, "/legal/terms")
  await expect(legalContent).toHaveCount(1)
  const generalTitle = legalContent.getByText("Terms of Service", { exact: true }).filter({ visible: true })
  await expect(generalTitle).toHaveCount(1)
  await expect(generalTitle).toBeVisible()
  const generalVersion = legalContent.getByText(`Version: ${GENERAL_LEGAL_VERSION}`, { exact: true }).filter({ visible: true })
  await expect(generalVersion).toHaveCount(1)
  await expect(generalVersion).toBeVisible()
  await expect(page).toHaveScreenshot("legal-general.png", { animations: "disabled" })

  await gotoReady(page, "/legal/digital-purchases-refunds")
  await expect(legalContent).toHaveCount(1)
  const digitalTitle = legalContent.getByText("Digital Purchases and Refund Policy", { exact: true }).filter({ visible: true })
  await expect(digitalTitle).toHaveCount(1)
  await expect(digitalTitle).toBeVisible()
  const digitalVersion = legalContent.getByText(`Version: ${DIGITAL_LEGAL_VERSION}`, { exact: true }).filter({ visible: true })
  await expect(digitalVersion).toHaveCount(1)
  await expect(digitalVersion).toBeVisible()
  await expect(page).toHaveScreenshot("legal-digital.png", { animations: "disabled" })

  // Exercise the form's real JSON boundary while preventing account or email writes.
  await page.route("**/api/account/register", (route) => route.fulfill({
    status: 202,
    contentType: "application/json",
    body: JSON.stringify({ message: "Registration request captured locally." }),
  }))
  await gotoReady(page, "/register")
  await expect(page.getByRole("heading", { name: "Create AtmoShaper account", exact: true })).toBeVisible()
  await page.getByRole("textbox", { name: "Name", exact: true }).fill("Preview Legal QA")
  await page.getByRole("textbox", { name: "Email", exact: true }).fill("preview-legal@example.test")
  await page.getByLabel("Password", { exact: true }).fill("not-a-real-password")
  await page.getByRole("checkbox", { name: /I agree to the Privacy Policy/ }).check()
  await page.getByRole("checkbox", { name: /I agree to the Terms of Service/ }).check()
  const registrationRequest = page.waitForRequest((request) => (
    new URL(request.url()).pathname === "/api/account/register" && request.method() === "POST"
  ))
  await page.getByRole("button", { name: "Create account with email", exact: true }).click()
  const { acceptedLegalDocuments: acceptedValues } = (await registrationRequest).postDataJSON()
  expect(acceptedValues).toEqual(expect.any(Array))
  expect([...acceptedValues].sort()).toEqual([
    `privacy:${GENERAL_LEGAL_VERSION}`,
    `terms:${GENERAL_LEGAL_VERSION}`,
  ])
  expect(acceptedValues.join("\n")).not.toContain(DIGITAL_LEGAL_VERSION)
})

test("shows the three approved background labels without changing free or premium ownership", async ({ page }) => {
  await gotoReady(page, "/clock")
  await expect(page.getByRole("region", { name: "Chimer clock", exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Background", exact: true }).click()
  const panel = page.getByRole("dialog", { name: "Background" })
  await expect(panel).toBeVisible()

  const previewToggleOn = panel.getByRole("switch", { name: "Animated previews: On", exact: true })
  await expect(previewToggleOn).toBeChecked()
  await previewToggleOn.click()
  const previewToggleOff = panel.getByRole("switch", { name: "Animated previews: Off", exact: true })
  await expect(previewToggleOff).not.toBeChecked()
  await expect(panel.getByTestId("carousel-background-video")).toHaveCount(0)

  const controls = panel.getByTestId("background-carousel-controls")
  await centerCarouselItem(page, "massage-lab-moving-gradient", "Next background")
  await expect(controls.getByRole("heading", { name: "Lava Lamp", exact: true })).toBeVisible()
  await expect(panel.getByRole("button", { name: /^(?:Select|Selected) Lava Lamp background$/ })).toBeEnabled()

  await centerCarouselItem(page, "massage-lab-tile-grid", "Next background")
  await expect(controls.getByRole("heading", { name: "Tile grid", exact: true })).toBeVisible()
  await expect(panel.getByRole("button", { name: "Unlock Tile grid background" })).toBeEnabled()
  await settledBox(controls)
  const trayFit = await controls.evaluate((tray) => {
    const trayBox = tray.getBoundingClientRect()
    const panelBox = tray.closest('[role="dialog"]')!.getBoundingClientRect()
    const contents = [tray, ...tray.querySelectorAll<HTMLElement>(
      'h3, [role="switch"], [data-background-tray-action]',
    )].filter((element) => element.getClientRects().length > 0)
    return {
      outsidePanel: Math.max(panelBox.left - trayBox.left, trayBox.right - panelBox.right),
      horizontalOverflow: Math.max(...contents.map((element) => element.scrollWidth - element.clientWidth)),
      outsideTray: Math.max(...contents.map((element) => {
        const box = element.getBoundingClientRect()
        return Math.max(trayBox.left - box.left, box.right - trayBox.right,
          trayBox.top - box.top, box.bottom - trayBox.bottom)
      })),
    }
  })
  expect(trayFit.outsidePanel).toBeLessThanOrEqual(1)
  expect(trayFit.horizontalOverflow).toBeLessThanOrEqual(1)
  expect(trayFit.outsideTray).toBeLessThanOrEqual(1)
  await expect(panel).toHaveScreenshot("background-labels.png", { animations: "disabled" })
  await panel.getByRole("button", { name: "Unlock Tile grid background" }).click()
  await expect(page.getByRole("dialog", { name: "Unlock Tile grid" })).toBeVisible()
  await page.keyboard.press("Escape")

  await centerCarouselItem(page, "massage-lab-hex-grid", "Next background")
  await expect(controls.getByRole("heading", { name: "Hex grid", exact: true })).toBeVisible()
  await expect(panel.getByRole("button", { name: "Unlock Hex grid background" })).toBeEnabled()
})
