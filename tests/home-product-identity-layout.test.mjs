import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { describe, it } from "node:test"
import postcss from "postcss"
import tailwindcss from "tailwindcss"
import { getSidebarRenderMode } from "../lib/sidebar-layout.js"

function readProjectFile(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8")
}

function capture(source, pattern, label) {
  const match = source.match(pattern)
  assert.ok(match, `missing ${label}`)
  return match[1]
}

const pageSource = readProjectFile("app/page.tsx")
const appSurfaceSource = readProjectFile("components/ui/app-surface.tsx")
const sidebarSource = readProjectFile("components/ui/sidebar.tsx")
const globalsSource = readProjectFile("app/globals.css")

const pageShellClass = capture(
  appSurfaceSource,
  /export const appPageShellClassName = "([^"]+)"/,
  "AppPageShell outer classes",
)
const pageShellInnerClass = capture(
  appSurfaceSource,
  /<div className=\{cn\("([^"]+)", appPageWidthClassNames\[width\], contentClassName\)\}>/,
  "AppPageShell inner classes",
)
const fullWidthClass = capture(appSurfaceSource, /\n\s*full: "([^"]+)"/, "AppPageShell full width")
const pageShellOverrideClass = capture(
  pageSource,
  /<AppPageShell width="full" className="([^"]+)" contentClassName="[^"]+">/,
  "homepage AppPageShell override",
)
const pageContentClass = capture(
  pageSource,
  /<AppPageShell width="full" className="[^"]+" contentClassName="([^"]+)">/,
  "homepage content classes",
)
const heroSectionClass = capture(
  pageSource,
  /<section className="([^"]*lg:grid-cols-\[[^"]+)"/,
  "homepage hero section classes",
)
const heroColumnClass = capture(
  pageSource,
  /<div className="([^"]*\[container-type:inline-size\][^"]*)">\s*\{\/\* At lg widths,[\s\S]*?<h1/,
  "homepage hero copy container classes",
)
const headingClass = capture(
  pageSource,
  /<h1\s+className="([^"]+)"\s+data-testid="home-brand-wordmark"/,
  "homepage product heading classes",
)
const expandedSidebarRem = Number(capture(sidebarSource, /const SIDEBAR_WIDTH = "([\d.]+)rem"/, "expanded sidebar width"))
const collapsedSidebarRem = Number(capture(sidebarSource, /const SIDEBAR_WIDTH_ICON = "([\d.]+)rem"/, "collapsed sidebar width"))

const adaptiveHeadingClass = "lg:text-[clamp(3rem,16cqi,6rem)]"
const previousHeadingClass = "lg:text-8xl"

function effectiveSidebarWidth(viewportWidth, state) {
  const renderMode = getSidebarRenderMode({ width: viewportWidth, height: 900 })
  if (renderMode === "drawer") return 0
  if (viewportWidth >= 601 && viewportWidth <= 767) return collapsedSidebarRem * 16
  return (state === "expanded" ? expandedSidebarRem : collapsedSidebarRem) * 16
}

describe("homepage product identity layout", () => {
  it("owns adaptive nowrap sizing in the hero column and preserves the sidebar width contracts", () => {
    assert.match(heroColumnClass, /\[container-type:inline-size\]/)
    assert.ok(headingClass.includes(adaptiveHeadingClass))
    assert.equal(headingClass.includes(previousHeadingClass), false)
    assert.equal((pageSource.match(/<h1\b/g) ?? []).length, 1)
    assert.doesNotMatch(pageSource, /home-brand-wordmark-image/)
    assert.equal(expandedSidebarRem, 17)
    assert.equal(collapsedSidebarRem, 3.25)
    assert.match(
      globalsSource,
      /@media \(min-width: 601px\) and \(max-width: 767px\) \{[\s\S]*?\.ml-app-sidebar-spacer \{\s*width: var\(--sidebar-width-icon\)/,
    )
    assert.equal(getSidebarRenderMode({ width: 320, height: 900 }), "drawer")
    assert.equal(getSidebarRenderMode({ width: 768, height: 900 }), "desktop")
    assert.equal(getSidebarRenderMode({ width: 1023, height: 390 }), "compact-rail")
    assert.equal(getSidebarRenderMode({ width: 1023, height: 900 }), "desktop")
  })

  it("keeps the actual source heading inside its column across shell breakpoints and sidebar states", async (t) => {
    const tailwindConfigPath = fileURLToPath(new URL("../tailwind.config.ts", import.meta.url))
    const globalsPath = fileURLToPath(new URL("../app/globals.css", import.meta.url))
    const require = createRequire(import.meta.url)
    const loadTailwindConfig = require("tailwindcss/loadConfig")
    const tailwindConfig = loadTailwindConfig(tailwindConfigPath)
    // Keep the exact superseded utility available only for the negative old-code control.
    const compiled = await postcss([tailwindcss({
      ...tailwindConfig,
      safelist: [...(tailwindConfig.safelist ?? []), previousHeadingClass],
    })]).process(globalsSource, {
      from: globalsPath,
    })
    const { chromium } = await import("@playwright/test")
    const browser = await chromium.launch()
    const context = await browser.newContext({ serviceWorkers: "block", viewport: { width: 1280, height: 900 } })
    let requests = 0
    await context.route("**/*", async (route) => {
      requests += 1
      await route.abort()
    })

    const render = async (page, viewportWidth, state, previousCode = false) => {
      await page.setViewportSize({ width: viewportWidth, height: 900 })
      const sidebarWidth = effectiveSidebarWidth(viewportWidth, state)
      const renderedHeroColumnClass = previousCode
        ? heroColumnClass.replace("[container-type:inline-size]", "")
        : heroColumnClass
      const renderedHeadingClass = previousCode
        ? headingClass.replace(adaptiveHeadingClass, previousHeadingClass)
        : headingClass
      await page.setContent(`<style>${compiled.css}</style><style>
        html, body { margin: 0; min-height: 100%; font-family: Arial, sans-serif; }
        .fixture-root { display: flex; width: 100vw; }
        .fixture-sidebar { flex: 0 0 ${sidebarWidth}px; }
        .fixture-main { min-width: 0; flex: 1 1 auto; }
      </style>
      <div class="fixture-root">
        <div class="fixture-sidebar" aria-hidden="true"></div>
        <main class="fixture-main">
          <div class="${pageShellClass} ${pageShellOverrideClass}">
            <div class="${pageShellInnerClass} ${fullWidthClass} ${pageContentClass}">
              <section class="${heroSectionClass}">
                <div class="${renderedHeroColumnClass}">
                  <h1 class="${renderedHeadingClass}" data-testid="home-brand-wordmark">AtmoShaper</h1>
                </div>
                <div aria-hidden="true"></div>
              </section>
            </div>
          </div>
        </main>
      </div>`)
      return page.getByTestId("home-brand-wordmark").evaluate((heading) => ({
        clientWidth: heading.clientWidth,
        scrollWidth: heading.scrollWidth,
        fontSize: Number.parseFloat(getComputedStyle(heading).fontSize),
        containerType: getComputedStyle(heading.parentElement).containerType,
        containerWidth: heading.parentElement.getBoundingClientRect().width,
        whiteSpace: getComputedStyle(heading).whiteSpace,
        text: heading.textContent,
        visible: Boolean(heading.getClientRects().length),
        headingCount: document.querySelectorAll("h1").length,
        artworkCount: document.querySelectorAll("img, picture, svg").length,
        fontsLoaded: document.fonts.status === "loaded",
      }))
    }

    const cases = [
      { width: 320, states: ["drawer"] },
      ...[639, 640, 641, 767, 768, 769, 1023, 1024, 1025, 1100, 1280]
        .map((width) => ({ width, states: ["expanded", "collapsed"] })),
    ]

    try {
      const page = await context.newPage()
      for (const shellCase of cases) {
        for (const state of shellCase.states) {
          await t.test(`${shellCase.width}px ${state}`, async () => {
            const metrics = await render(page, shellCase.width, state)
            assert.equal(metrics.text, "AtmoShaper")
            assert.equal(metrics.visible, true)
            assert.equal(metrics.headingCount, 1)
            assert.equal(metrics.artworkCount, 0)
            assert.equal(metrics.fontsLoaded, true)
            assert.equal(metrics.whiteSpace, "nowrap")
            assert.equal(metrics.containerType, "inline-size")
            assert.ok(
              metrics.scrollWidth <= metrics.clientWidth,
              `AtmoShaper overflowed at ${shellCase.width}px ${state}: ${metrics.scrollWidth} > ${metrics.clientWidth}`,
            )
            assert.ok(metrics.fontSize >= 48 && metrics.fontSize <= 96)
            if (shellCase.width === 1024 && state === "expanded") {
              assert.equal(metrics.containerWidth, 368)
              assert.equal(metrics.fontSize, 58.88)
            }
            if (shellCase.width === 1100 && state === "expanded") {
              assert.equal(metrics.containerWidth, 443.984375)
              assert.equal(metrics.fontSize, 71.0375)
            }
          })
        }
      }

      for (const width of [1024, 1100]) {
        await t.test(`old viewport-sized heading overflows at ${width}px expanded`, async () => {
          const metrics = await render(page, width, "expanded", true)
          assert.equal(metrics.fontSize, 96)
          assert.equal(metrics.containerType, "normal")
          assert.ok(metrics.scrollWidth > metrics.clientWidth)
        })
      }
      assert.equal(requests, 0, "provider-free geometry fixture must make no network requests")
    } finally {
      await context.close()
      await browser.close()
    }
  })
})
