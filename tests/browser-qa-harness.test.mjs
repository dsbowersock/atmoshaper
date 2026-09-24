import test from "node:test"
import assert from "node:assert/strict"
import { readFile, readdir } from "node:fs/promises"
import { runInNewContext } from "node:vm"

import {
  assertMigrationParityTelemetryEnvironment,
  assertBrowserQaRepeatEachSupported,
  getPlaywrightFileFilterArguments,
  isDevelopmentPaletteReviewInvocation,
  isMigrationParityInvocation,
  migrationParityTelemetryEnvironment,
  matchesDevelopmentPaletteReviewArgument,
  resolveDevelopmentPaletteReviewIgnoreGlobs,
} from "../playwright.config.ts"
import {
  BROWSER_QA_LANES,
  BROWSER_QA_PROJECT_NAMES,
  ORDINARY_BROWSER_QA_SPEC_FILES,
  assertBrowserQaLaneCoverage,
  resolveCiBrowserQaLaneProjects,
} from "./browser/ci-lanes.mjs"
import { isHeldRouteTeardownCancellation } from "./browser/held-route-teardown.ts"

async function readProjectFile(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8")
}

function assertWorkflowStepBefore(workflow, firstStep, secondStep) {
  const firstIndex = workflow.indexOf(firstStep)
  const secondIndex = workflow.indexOf(secondStep)

  assert.notEqual(firstIndex, -1, `Expected workflow to include ${firstStep}`)
  assert.notEqual(secondIndex, -1, `Expected workflow to include ${secondStep}`)
  assert.ok(firstIndex < secondIndex, `Expected ${firstStep} before ${secondStep}`)
}

test("held-route teardown recognizes only its exact Playwright cancellation shapes", () => {
  for (const message of [
    "Route is already handled!",
    "route.abort: Route is already handled!",
    "route.continue: Target page, context or browser has been closed",
    "route.fallback: Request context disposed",
    "route.fetch: Route is already handled!",
    "route.fulfill: Target page, context or browser has been closed",
  ]) {
    assert.equal(isHeldRouteTeardownCancellation(new Error(message)), true, message)
  }

  for (const value of [
    new Error(" Route is already handled!"),
    new Error("Route is already handled! after retry"),
    new Error("Target page, context or browser has been closed"),
    new Error("Request context disposed"),
    new Error("page.close: Request context disposed"),
    new Error("route.abort: unrelated failure"),
    "Route is already handled!",
  ]) {
    assert.equal(isHeldRouteTeardownCancellation(value), false, String(value))
  }
})

/**
 * Returns the exact source between ordered markers after validating both bounds.
 * `searchFrom` lets callers preserve chained section order without reusing a missing bound.
 */
function sliceBetweenMarkers(source, startMarker, endMarker, label, searchFrom = 0) {
  const start = source.indexOf(startMarker, searchFrom)
  assert.notEqual(start, -1, `Expected to locate ${label} start`)
  const end = source.indexOf(endMarker, start + startMarker.length)
  assert.notEqual(end, -1, `Expected to locate ${label} end`)
  assert.ok(end > start, `Expected ${label} end after its start`)
  return { end, slice: source.slice(start, end) }
}

const initialAtmosphereFixturePattern =
  /installAtmosphereFixtures\(\s*page,\s*allowedExternalUrls,\s*\[\],\s*initialAtmosphereSampleIndexUrls,?\s*\)/g
const musicPathGuardPattern = /if\s*\(\s*path\s*===\s*["']\/music["']\s*\)\s*\{/

/**
 * Finds a closing brace without depending on indentation. This raw scanner also
 * counts braces inside strings, templates, regexes, and comments, so fixtures
 * using it must keep those constructs brace-free within the scanned boundary.
 */
function findMatchingBraceIndex(source, openingBraceIndex) {
  if (source[openingBraceIndex] !== "{") return -1

  let depth = 0
  for (let index = openingBraceIndex; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1
    if (source[index] === "}") depth -= 1
    if (depth === 0) return index
  }
  return -1
}

test("Atmosphere fixture matching survives wrapped calls and reindented nested guards", () => {
  const source = [
    "if (",
    "\tpath === '/music'",
    ") {",
    "\tif (shouldPrewarm) {",
    "\t\tinstallAtmosphereFixtures(",
    "\t\t\tpage,",
    "\t\t\tallowedExternalUrls,",
    "\t\t\t[],",
    "\t\t\tinitialAtmosphereSampleIndexUrls,",
    "\t\t)",
    "\t}",
    "}",
    "await page.goto(path)",
  ].join("\n")
  const guardMatch = musicPathGuardPattern.exec(source)
  assert.ok(guardMatch)
  const guardIndex = guardMatch.index
  const openingBraceIndex = guardIndex + guardMatch[0].lastIndexOf("{")
  const closingBraceIndex = findMatchingBraceIndex(source, openingBraceIndex)

  assert.equal((source.match(initialAtmosphereFixturePattern) ?? []).length, 1)
  assert.ok(source.search(initialAtmosphereFixturePattern) < closingBraceIndex)
  assert.ok(closingBraceIndex < source.indexOf("await page.goto(path)"))
})

test("install-prompt QA dispatches only while the provider listener is proven active", async () => {
  const appShellSpec = await readProjectFile("tests/browser/app-shell.spec.ts")

  assert.equal((appShellSpec.match(/await installPwaPromptListenerProbe\(page\)/g) ?? []).length, 2)
  assert.equal((appShellSpec.match(/await dispatchPwaInstallPromptWhenReady\(page,/g) ?? []).length, 2)
  const dispatchStart = appShellSpec.indexOf("async function dispatchPwaInstallPromptWhenReady")
  const dispatchEnd = appShellSpec.indexOf("\nasync function ", dispatchStart + 1)
  const dispatchSource = appShellSpec.slice(dispatchStart, dispatchEnd === -1 ? undefined : dispatchEnd)
  assert.notEqual(dispatchStart, -1)
  assert.match(
    dispatchSource,
    /if \(!Reflect\.get\(window, "__massagelabPwaInstallPromptListenerReady"\)\) return false[\s\S]*window\.dispatchEvent\(event\)/,
  )
})

/**
 * Extracts one job from this repository's CI workflow source. The matcher
 * intentionally follows its two-space job indentation and lowercase-letter or
 * underscore job IDs so the next top-level job or absolute end of the source
 * forms an unambiguous boundary.
 */
function getWorkflowJob(workflow, jobId) {
  const match = workflow.match(
    new RegExp(`^  ${jobId}:\\r?\\n([\\s\\S]*?)(?=^  [a-z_]+:\\r?$|(?![\\s\\S]))`, "m"),
  )

  assert.ok(match, `Expected workflow job ${jobId}`)
  return match[1]
}

test("workflow job extraction includes the complete body and stops at the next job", () => {
  const workflow = [
    "jobs:",
    "  first_job:",
    "    name: First job",
    "    needs: unexpected_dependency",
    "    steps:",
    "      - run: npm test",
    "  second_job:",
    "    name: Second job",
  ].join("\n")

  const firstJob = getWorkflowJob(workflow, "first_job")
  assert.match(firstJob, /^    needs: unexpected_dependency$/m)
  assert.doesNotMatch(firstJob, /Second job/)
})

test("Code quality provisions Chromium with Linux dependencies before Node tests", async () => {
  const workflow = await readProjectFile(".github/workflows/ci.yml")
  const codeQualityJob = getWorkflowJob(workflow, "code_quality")

  assert.match(
    codeQualityJob,
    /- name: Install Chromium for Node tests\r?\n        run: npx playwright install --with-deps chromium/,
  )
  assertWorkflowStepBefore(
    codeQualityJob,
    "npx playwright install --with-deps chromium",
    "npm run test",
  )
})

test("browser QA enables the isolated RSC session proof at build and runtime", async () => {
  const workflow = await readProjectFile(".github/workflows/ci.yml")

  for (const jobId of ["browser_build", "browser_qa"]) {
    assert.match(
      getWorkflowJob(workflow, jobId),
      /^      NEXT_PUBLIC_RSC_SESSION_PROOF: "1"\r?$/m,
      `Expected ${jobId} to enable NEXT_PUBLIC_RSC_SESSION_PROOF`,
    )
  }
})

test("mobile Background carousel fixtures include the default preview", async () => {
  const publicRoutesSpec = await readProjectFile("tests/browser/public-routes.spec.ts")
  const fixtureStart = publicRoutesSpec.indexOf(
    'test(`Background default navigation and Background drag keep',
  )
  assert.notEqual(fixtureStart, -1, "Expected to locate the mobile Background fixture start")

  const fixtureEnd = publicRoutesSpec.indexOf(
    '\ntest("Atmosphere lists the Generative.fm catalog',
    fixtureStart,
  )

  assert.notEqual(fixtureEnd, -1, "Expected to locate the mobile Background fixture end")
  assert.match(
    publicRoutesSpec.slice(fixtureStart, fixtureEnd),
    /"massage-lab-gradient-vertical"/,
  )
})

test("public media journeys fixture opportunistic atmosphere prewarms", async () => {
  const publicRoutesSpec = await readProjectFile("tests/browser/public-routes.spec.ts")
  const genericJourney = sliceBetweenMarkers(
    publicRoutesSpec,
    "for (const route of publicRoutes)",
    '\ntest("core public tool surfaces',
    "generic public routes",
  )
  const coreToolsJourney = sliceBetweenMarkers(
    publicRoutesSpec,
    '\ntest("core public tool surfaces',
    '\ntest("active app-tool metal ring',
    "core public tools",
    genericJourney.end,
  )
  const activeToolRingJourney = sliceBetweenMarkers(
    publicRoutesSpec,
    '\ntest("active app-tool metal ring',
    '\ntest("main bar exposes brand music clock quick create theme calendar and more controls',
    "active tool ring",
    coreToolsJourney.end,
  )
  const mainBarJourney = sliceBetweenMarkers(
    publicRoutesSpec,
    '\ntest("main bar exposes brand music clock quick create theme calendar and more controls',
    '\ntest("main bar edge control stays aligned with the compact sidebar rail',
    "main bar",
    activeToolRingJourney.end,
  )
  const topAppBarJourney = sliceBetweenMarkers(
    publicRoutesSpec,
    'test("top app bar quick actions open inside the viewport below the plus button',
    '\ntest("mobile quick-create button opens a vertical speed dial',
    "top app bar",
    mainBarJourney.end,
  )
  const visualizerJourney = sliceBetweenMarkers(
    publicRoutesSpec,
    'test("Music visualizer background selection and account default actions',
    '\ntest("Music account preference owner switch',
    "music visualizer",
    topAppBarJourney.end,
  )

  const journeys = [
    ["generic public routes", genericJourney.slice],
    ["core public tools", coreToolsJourney.slice],
    ["active tool ring", activeToolRingJourney.slice],
    ["main bar", mainBarJourney.slice],
    ["top app bar", topAppBarJourney.slice],
    ["music visualizer", visualizerJourney.slice],
  ]

  for (const [journeyName, journeySource] of journeys) {
    const fixtureIndex = journeySource.search(initialAtmosphereFixturePattern)
    const firstNavigationIndex = journeySource.indexOf("await page.goto")
    assert.notEqual(fixtureIndex, -1, `${journeyName} installs the exact initial Atmosphere fixture`)
    assert.notEqual(firstNavigationIndex, -1, `${journeyName} contains a page navigation`)
    assert.ok(
      fixtureIndex < firstNavigationIndex,
      `${journeyName} installs its exact initial Atmosphere fixture before navigation`,
    )
  }

  const coreToolsSource = coreToolsJourney.slice
  assert.match(coreToolsSource, /const health = await capturePageHealth\(page, new Set\(\)\)/)
  assert.equal(
    (coreToolsSource.match(initialAtmosphereFixturePattern) ?? []).length,
    1,
    "the multi-route core journey owns exactly one initial Atmosphere fixture",
  )
  const coreRouteLoop = coreToolsSource.match(/for \(const path of \[([^\]]+)]\) \{/)
  assert.ok(coreRouteLoop, "the multi-route core journey keeps an explicit route list")
  const coreRoutePaths = [...coreRouteLoop[1].matchAll(/"([^"]+)"/g)].map((match) => match[1])
  assert.equal(coreRoutePaths.at(-1), "/music", "the multi-route core journey visits Music last")
  const coreMusicGuardMatch = musicPathGuardPattern.exec(coreToolsSource)
  assert.ok(coreMusicGuardMatch, "the multi-route core journey has a Music-only fixture guard")
  const coreMusicGuardIndex = coreMusicGuardMatch.index
  const coreMusicGuardOpeningBraceIndex = coreMusicGuardIndex + coreMusicGuardMatch[0].lastIndexOf("{")
  const coreFixtureIndex = coreToolsSource.search(initialAtmosphereFixturePattern)
  const coreMusicGuardEndIndex = findMatchingBraceIndex(coreToolsSource, coreMusicGuardOpeningBraceIndex)
  assert.notEqual(coreMusicGuardEndIndex, -1, "the Music-only fixture guard has an explicit boundary")
  const coreLoopNavigationIndex = coreToolsSource.indexOf("await page.goto(path", coreMusicGuardEndIndex)
  assert.notEqual(coreLoopNavigationIndex, -1, "the Music-only fixture guard precedes the loop navigation")
  assert.ok(
    coreMusicGuardIndex < coreFixtureIndex && coreFixtureIndex < coreMusicGuardEndIndex,
    "the multi-route core journey grants the exact prewarm fixture only inside the Music guard",
  )
  assert.equal(
    coreToolsSource.slice(coreMusicGuardEndIndex + 1, coreLoopNavigationIndex).trim(),
    "",
    "the Music-only fixture guard stays immediately before the loop navigation",
  )
})

test("Phase 6 uses the real reduced-motion owner without hiding the active music icon", async () => {
  const spec = await readProjectFile("tests/browser/phase6-preview-rebrand.spec.ts")
  const tool = await readProjectFile("components/shell/app-tool-link.tsx")
  const ring = await readProjectFile("components/ui/metal-attention-button.tsx")
  assert.match(tool, /return active \? <ActiveToolMetalRing>/)
  assert.match(tool, /<MetalAttentionRing className="ml-app-tool-link-active-ring">/)
  assert.match(ring, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/)
  assert.match(ring, /if \(reducedMotion\) \{\s*setMotionState\("paused"\)/)
  assert.match(spec, /test\.beforeEach\(async \(\{ page \}\) => \{\s*await page\.emulateMedia\(\{ reducedMotion: "reduce" \}\)/)
  const ready = sliceBetweenMarkers(spec, "async function expectMusicReady", "/** Wait for layout", "Phase 6 music readiness").slice
  assert.match(ready, /\.ml-app-tool-link-active-ring:visible/)
  assert.match(ready, /expect\(ring\)\.toHaveCount\(1\)/)
  assert.match(ready, /toHaveAttribute\("data-ml-metal-motion-state", "paused"\)/)
  assert.match(ready, /toHaveAttribute\("data-paused", "true"\)/)
  assert.match(ready, /canvas\.metal-fx-canvas/)
  assert.match(ready, /getImageData/)
  assert.match(ready, /getByRole\("link", \{ name: "Open music", exact: true \}\)/)
  assert.match(ready, /expect\(icon\)\.toHaveCount\(1\)[\s\S]*expect\(icon\)\.toBeVisible\(\)/)
  assert.doesNotMatch(spec, /mask:|maxDiffPixels|maxDiffPixelRatio|threshold:|addStyleTag|waitForTimeout/)
})

test("Phase 6 retries the visible account path across responsive drawer hydration", async () => {
  const spec = await readProjectFile("tests/browser/phase6-preview-rebrand.spec.ts")
  const sidebar = await readProjectFile("components/sidebar/app-sidebar-client.tsx")
  const responsive = await readProjectFile("hooks/use-mobile.tsx")
  const sheet = await readProjectFile("components/ui/sheet.tsx")
  assert.match(sidebar, /data-testid="account-menu-trigger"/)
  assert.match(responsive, /useState<SidebarRenderMode>\("desktop"\)/)
  assert.match(sheet, /data-\[state=open\]:duration-500/)
  const helper = sliceBetweenMarkers(spec, "async function openAccountMenu", 'test("presents', "Phase 6 account helper").slice
  assert.match(helper, /getByTestId\("account-menu-trigger"\)\.filter\(\{ visible: true \}\)/)
  assert.match(helper, /expect\.poll/)
  assert.match(helper, /name: \/\^\(\?:Open\|Close\) navigation\$\//)
  assert.match(helper, /owner\.and\(page\.locator\('\[aria-expanded="false"\]'\)\)/)
  assert.match(helper, /openClosedOwner\(navigation\)/)
  assert.match(helper, /openClosedOwner\(trigger\)/)
  assert.match(helper, /candidate\.getAnimations\(\)/)
  assert.match(helper, /candidate = candidate\.parentElement/)
  assert.match(helper, /animation\.playState === "running"/)
  assert.match(helper, /Number\.isFinite\(iterations\)/)
  assert.doesNotMatch(helper, /animationName === "enter"/)
  assert.doesNotMatch(helper, /getAttribute/)
  assert.match(helper, /expect\(trigger\)\.toHaveCount\(1\)/)
  assert.match(helper, /expect\(helpItem\)\.toHaveCount\(1\)/)
  assert.doesNotMatch(helper, /\.first\(|\.nth\(|waitForTimeout/)
})

test("Phase 6 legal assertions require one visible route-owned exact title", async () => {
  const spec = await readProjectFile("tests/browser/phase6-preview-rebrand.spec.ts")
  const layout = await readProjectFile("components/layout-wrapper.tsx")
  const owner = await readProjectFile("app/legal/page.tsx")
  assert.match(layout, /ml-app-content[\s\S]*?\{children\}/)
  assert.equal((owner.match(/title="Legal and trust documents"/g) ?? []).length, 1)
  const legal = sliceBetweenMarkers(spec, 'test("publishes the v3', 'test("shows the three', "Phase 6 legal content").slice
  assert.match(legal, /page\.locator\("main \.ml-app-content:visible"\)/)
  assert.match(legal, /expect\(legalContent\)\.toHaveCount\(1\)/)
  assert.match(legal, /legalContent\.getByText\("Legal and trust documents", \{ exact: true \}\)\.filter\(\{ visible: true \}\)/)
  assert.match(legal, /expect\(legalTitle\)\.toHaveCount\(1\)[\s\S]*expect\(legalTitle\)\.toBeVisible\(\)/)
  assert.match(legal, /const indexDescription = legalContent\.getByText/)
  assert.match(legal, /const generalVersion = legalContent\.getByText/)
  assert.match(legal, /const digitalVersion = legalContent\.getByText/)
  assert.doesNotMatch(legal, /\.first\(|\.nth\(/)
})

test("browser QA lanes cover each ordinary project and spec exactly once", async () => {
  const expectedProjects = ["desktop-chromium", "mobile-chromium"]
  const expectedSpecs = [
    "admin-user-operations.spec.ts",
    "anatomime-traffic.spec.ts",
    "app-shell.spec.ts",
    "atmoshaper.spec.ts",
    "background-commerce.spec.ts",
    "control-system-review.spec.ts",
    "identity-method-safety.spec.ts",
    "immersive-panel-shell.spec.ts",
    "interaction-feedback.spec.ts",
    "local-first.spec.ts",
    "membership-return-status.spec.ts",
    "music-media-session.spec.ts",
    "music-visualizer.spec.ts",
    "phase6-preview-rebrand.spec.ts",
    "public-booking-traffic.spec.ts",
    "public-provider-ingress.spec.ts",
    "public-routes.spec.ts",
    "pwa.spec.ts",
  ]

  const developmentOnlySpecs = new Set(
    resolveDevelopmentPaletteReviewIgnoreGlobs([]).map((glob) => glob.split("/").at(-1)),
  )
  // Migration parity is an explicit source/destination gate outside CI lanes;
  // assert its presence independently so the exclusion cannot hide a missing spec.
  const migrationOnlySpec = "atmoshaper-repository-migration-parity.spec.ts"
  const discoveredSpecFiles = await readdir(new URL("./browser/", import.meta.url))
  assert.ok(discoveredSpecFiles.includes(migrationOnlySpec), "Expected the explicit migration parity spec to exist")
  const discoveredOrdinarySpecs = discoveredSpecFiles
    .filter((filename) => filename.endsWith(".spec.ts")
      && !developmentOnlySpecs.has(filename)
      && filename !== migrationOnlySpec)
    .sort()

  assert.deepEqual(BROWSER_QA_PROJECT_NAMES, expectedProjects)
  assert.deepEqual(ORDINARY_BROWSER_QA_SPEC_FILES, discoveredOrdinarySpecs)
  assert.deepEqual(ORDINARY_BROWSER_QA_SPEC_FILES, expectedSpecs)
  assert.equal(Object.keys(BROWSER_QA_LANES).length, 4)

  const expectedPairs = new Set(
    expectedProjects.flatMap((projectName) => expectedSpecs.map((spec) => `${projectName}:${spec}`)),
  )
  assert.equal(expectedSpecs.length, 18)
  assert.equal(expectedPairs.size, 36)

  const actualPairs = []
  for (const lane of Object.values(BROWSER_QA_LANES)) {
    assert.ok(Object.values(lane).some((specs) => specs.length > 0), "Expected every lane to be non-empty")
    for (const [projectName, specs] of Object.entries(lane)) {
      for (const spec of specs) actualPairs.push(`${projectName}:${spec}`)
    }
  }

  assert.equal(new Set(actualPairs).size, expectedPairs.size)
  assert.deepEqual(new Set(actualPairs), expectedPairs)
  assert.doesNotMatch(
    JSON.stringify(BROWSER_QA_LANES),
    /background-(?:palette|carousel-preview|preview-pilot)\.spec\.ts|dna-twisted-cubes-backgrounds\.spec\.ts/,
  )
  assert.doesNotThrow(() => assertBrowserQaLaneCoverage())

  const lanesWithWrongFourthId = Object.fromEntries(
    Object.entries(BROWSER_QA_LANES).map(([laneId, lane]) => [laneId === "4" ? "5" : laneId, lane]),
  )
  assert.throws(
    () => assertBrowserQaLaneCoverage(lanesWithWrongFourthId),
    /exact lane IDs 1, 2, 3, and 4; found 1, 2, 3, 5/i,
  )
})

test("browser QA lane resolver preserves ordinary runs and returns exact lane assignments", () => {
  assert.equal(resolveCiBrowserQaLaneProjects(), null)
  assert.equal(resolveCiBrowserQaLaneProjects("   "), null)
  assert.throws(
    () => resolveCiBrowserQaLaneProjects("unknown"),
    /Unknown browser QA lane/i,
  )
  for (const inheritedKey of ["constructor", "toString"]) {
    assert.throws(
      () => resolveCiBrowserQaLaneProjects(inheritedKey),
      new RegExp(`Unknown browser QA lane: ${inheritedKey}`, "i"),
    )
  }

  const expectedLaneProjects = {
    "1": [
      {
        name: "desktop-chromium",
        testMatch: [
          "**/public-routes.spec.ts",
          "**/local-first.spec.ts",
          "**/identity-method-safety.spec.ts",
          "**/membership-return-status.spec.ts",
          "**/interaction-feedback.spec.ts",
          "**/anatomime-traffic.spec.ts",
          "**/public-booking-traffic.spec.ts",
          "**/public-provider-ingress.spec.ts",
        ],
      },
      {
        name: "mobile-chromium",
        testMatch: [
          "**/pwa.spec.ts",
        ],
      },
    ],
    "2": [
      {
        name: "desktop-chromium",
        testMatch: [
          "**/app-shell.spec.ts",
          "**/pwa.spec.ts",
        ],
      },
      {
        name: "mobile-chromium",
        testMatch: [
          "**/public-routes.spec.ts",
          "**/local-first.spec.ts",
          "**/identity-method-safety.spec.ts",
          "**/membership-return-status.spec.ts",
          "**/interaction-feedback.spec.ts",
          "**/anatomime-traffic.spec.ts",
          "**/public-booking-traffic.spec.ts",
          "**/public-provider-ingress.spec.ts",
        ],
      },
    ],
    "3": [
      {
        name: "desktop-chromium",
        testMatch: [
          "**/atmoshaper.spec.ts",
          "**/music-media-session.spec.ts",
          "**/phase6-preview-rebrand.spec.ts",
          "**/admin-user-operations.spec.ts",
        ],
      },
      {
        name: "mobile-chromium",
        testMatch: [
          "**/atmoshaper.spec.ts",
          "**/music-media-session.spec.ts",
          "**/phase6-preview-rebrand.spec.ts",
        ],
      },
    ],
    "4": [
      {
        name: "desktop-chromium",
        testMatch: [
          "**/background-commerce.spec.ts",
          "**/control-system-review.spec.ts",
          "**/immersive-panel-shell.spec.ts",
          "**/music-visualizer.spec.ts",
        ],
      },
      {
        name: "mobile-chromium",
        testMatch: [
          "**/app-shell.spec.ts",
          "**/admin-user-operations.spec.ts",
          "**/background-commerce.spec.ts",
          "**/control-system-review.spec.ts",
          "**/immersive-panel-shell.spec.ts",
          "**/music-visualizer.spec.ts",
        ],
      },
    ],
  }

  for (const [laneId, expectedProjects] of Object.entries(expectedLaneProjects)) {
    assert.deepEqual(resolveCiBrowserQaLaneProjects(` ${laneId} `), expectedProjects)
  }
})

test("development review spec matching accepts Playwright line and column suffixes", () => {
  for (const spec of [
    "tests/browser/background-palette.spec.ts",
    "tests/browser/dna-twisted-cubes-backgrounds.spec.ts",
  ]) {
    assert.equal(matchesDevelopmentPaletteReviewArgument(spec), true)
    assert.equal(matchesDevelopmentPaletteReviewArgument(`${spec}:42`), true)
    assert.equal(matchesDevelopmentPaletteReviewArgument(`C:\\repo\\${spec.replaceAll("/", "\\")}:42:7`), true)
    assert.equal(matchesDevelopmentPaletteReviewArgument(spec.split("/").at(-1)), true)
  }
  assert.equal(matchesDevelopmentPaletteReviewArgument("dna-twisted"), true)
  assert.equal(matchesDevelopmentPaletteReviewArgument("browser/dna-twisted"), true)
  assert.equal(matchesDevelopmentPaletteReviewArgument("background-palette"), true)
  assert.equal(matchesDevelopmentPaletteReviewArgument(String.raw`dna.*cubes-backgrounds\.spec\.ts`), true)
  assert.equal(matchesDevelopmentPaletteReviewArgument(String.raw`[\\/]tests[\\/]browser[\\/]dna-twisted-cubes-backgrounds\.spec\.ts$`), true)
  assert.equal(matchesDevelopmentPaletteReviewArgument(String.raw`^.*background-palette`), true)
  assert.equal(matchesDevelopmentPaletteReviewArgument(String.raw`background-palette.*$`), true)
  assert.equal(matchesDevelopmentPaletteReviewArgument("[invalid"), false)
  assert.equal(matchesDevelopmentPaletteReviewArgument("spec"), true)
  assert.equal(matchesDevelopmentPaletteReviewArgument("tests/browser"), true)
  assert.equal(matchesDevelopmentPaletteReviewArgument(String.raw`tests[\\/]browser[\\/]`), true)
  assert.equal(matchesDevelopmentPaletteReviewArgument(`dna${".*".repeat(300)}cubes`), false)
  assert.equal(matchesDevelopmentPaletteReviewArgument("dna-(twisted|cubes)"), false)
  assert.equal(matchesDevelopmentPaletteReviewArgument("not-a-review-spec"), false)
  assert.equal(matchesDevelopmentPaletteReviewArgument("tests/browser/public-routes.spec.ts:42"), false)
  assert.equal(matchesDevelopmentPaletteReviewArgument("prefix-tests/browser/background-palette.spec.ts"), false)
})

test("development review invocation ignores the leading Playwright subcommand", () => {
  assert.equal(isDevelopmentPaletteReviewInvocation(["test"]), false)
  assert.equal(isDevelopmentPaletteReviewInvocation(["test", "tests/browser/public-routes.spec.ts"]), false)
  assert.equal(isDevelopmentPaletteReviewInvocation(["test", "--grep", "dna-twisted"]), false)
  assert.equal(isDevelopmentPaletteReviewInvocation(["test", "--repeat-each", "background-palette"]), false)
  assert.equal(isDevelopmentPaletteReviewInvocation(["test", "dna-twisted"]), true)
})

test("Browser QA rejects repeat-each values that can collide deterministic fixtures", () => {
  for (const argv of [
    [],
    ["test"],
    ["test", "--repeat-each", "1"],
    ["test", "--repeat-each=1"],
    ["test", "--repeat-each-other=2"],
    ["test", "--", "--repeat-each=2"],
  ]) {
    assert.doesNotThrow(() => assertBrowserQaRepeatEachSupported(argv))
  }
  for (const argv of [
    ["test", "--repeat-each", "2"],
    ["test", "--repeat-each=2"],
    ["test", "--repeat-each", "1garbage"],
    ["test", "--repeat-each=1garbage"],
    ["test", "--repeat-each", "2garbage"],
    ["test", "--repeat-each=2garbage"],
    ["test", "--repeat-each"],
    ["test", "--repeat-each="],
    ["test", "--repeat-each=01"],
    ["test", "--repeat-each=1.0"],
  ]) {
    assert.throws(
      () => assertBrowserQaRepeatEachSupported(argv),
      /supports only the exact --repeat-each value 1/i,
    )
  }
  for (const argv of [
    ["test", "--repeat-each", "1", "--repeat-each", "1"],
    ["test", "--repeat-each", "1", "--repeat-each=1"],
    ["test", "--repeat-each=1", "--repeat-each", "1"],
    ["test", "--repeat-each=1", "--repeat-each=1"],
  ]) {
    assert.throws(
      () => assertBrowserQaRepeatEachSupported(argv),
      /supports at most one --repeat-each option/i,
    )
  }
})

test("migration parity selects exact spec paths, serializes projects, and refuses stale-server reuse", async () => {
  const spec = "tests/browser/atmoshaper-repository-migration-parity.spec.ts"
  const config = await readProjectFile("playwright.config.ts")
  const workerExpression = config.match(/^\s*workers: (.+),$/m)?.[1]
  assert.ok(workerExpression, "The canonical worker setting must remain inspectable")
  // Exercise the actual config expression with the exact-invocation matcher;
  // no browser is launched and ordinary/CI worker semantics stay independent.
  const resolveWorkers = (args, CI, usesAuthorizedBrowserQaDatabase = false) => runInNewContext(workerExpression, {
    runsMigrationParity: isMigrationParityInvocation(args),
    usesAuthorizedBrowserQaDatabase,
    process: { env: { CI, ATMOSHAPER_MIGRATION_PARITY: "1" } },
  })
  for (const exact of [spec, `./${spec}`, `${spec}:42:7`, `C:\\repo\\${spec.replaceAll("/", "\\")}`]) {
    assert.equal(isMigrationParityInvocation(["test", exact]), true, exact)
    for (const CI of [undefined, "", "1", "true", "0"]) {
      assert.equal(resolveWorkers(["test", exact], CI), 1, exact)
    }
  }
  for (const args of [
    ["test"],
    ["test", "tests/browser"],
    ["test", "atmoshaper-repository-migration-parity"],
    ["test", "atmoshaper-repository-migration-parity.spec.ts"],
    ["test", "tests/browser/atmoshaper.spec.ts"],
    ["test", `prefix-${spec}`],
    ["test", `${spec}.backup`],
    ["test", ".*migration-parity.*"],
    ["test", "--grep", spec],
    ["test", "--output", spec],
  ]) {
    assert.equal(isMigrationParityInvocation(args), false, args.join(" "))
    for (const CI of [undefined, "", "1", "true", "0"]) {
      assert.equal(resolveWorkers(args, CI), CI ? 1 : undefined, args.join(" "))
    }
  }
  assert.equal(resolveWorkers(["test", spec, "--update-snapshots=missing"], undefined), 1)
  assert.equal(resolveWorkers(["test", spec, "--update-snapshots=none"], undefined), 1)
  assert.equal(resolveWorkers(["test", "tests/browser/public-routes.spec.ts"], undefined, true), 1)

  assert.match(config, /const runsMigrationParity = isMigrationParityInvocation\(process\.argv\.slice\(2\)\)/)
  assert.match(config, /const usesAuthorizedBrowserQaDatabase = isBrowserQaDatabaseTargetAuthorized\(process\.env\)/)
  assert.match(config, /reuseExistingServer:\s*false/)
})

test("migration parity telemetry preflight requires explicit inert values without exposing rejected values", async () => {
  assert.deepEqual(migrationParityTelemetryEnvironment, {
    NEXT_PUBLIC_SENTRY_DSN: "",
    SENTRY_DSN: "",
    SENTRY_AUTH_TOKEN: "",
    NEXT_TELEMETRY_DISABLED: "1",
  })
  assert.doesNotThrow(() => assertMigrationParityTelemetryEnvironment({ ...migrationParityTelemetryEnvironment }))
  for (const name of Object.keys(migrationParityTelemetryEnvironment)) {
    for (const rejected of [undefined, "must-not-appear-in-errors"]) {
      assert.throws(
        () => assertMigrationParityTelemetryEnvironment({ ...migrationParityTelemetryEnvironment, [name]: rejected }),
        (error) => error.message.includes(name) && !error.message.includes("must-not-appear-in-errors"),
      )
    }
  }
  const config = await readProjectFile("playwright.config.ts")
  assert.match(config, /if \(runsMigrationParity && process\.env\.ATMOSHAPER_MIGRATION_PARITY === "1" && !process\.argv\.includes\("--list"\)\) \{\s*assertMigrationParityTelemetryEnvironment\(process\.env\)/)
  assert.match(config, /if \(runsMigrationParity && process\.env\.ATMOSHAPER_MIGRATION_PARITY === "1"\) \{\s*Object\.assign\(playwrightWebServerEnvironment, migrationParityTelemetryEnvironment\)/)
})

test("migration parity uses Education content readiness and persists sanitized activity through teardown", async () => {
  const spec = await readProjectFile("tests/browser/atmoshaper-repository-migration-parity.spec.ts")
  const education = await readProjectFile("app/education/page.tsx")
  assert.match(education, /<Link href="\/education\/flashcards">Open flashcards<\/Link>/)
  assert.match(spec, /name: "education"[^\n]+getByRole\("link", \{ name: "Open flashcards", exact: true \}\)/)
  assert.doesNotMatch(spec, /getByText\(\/Education\/i\)/)
  assert.match(spec, /await context\.close\(\)[\s\S]*removeIdentityMethodSafetyFixture[\s\S]*testInfo\.outputPath\("migration-parity-inventory\.json"\)/)
  assert.match(spec, /await writeFile\(inventoryPath, JSON\.stringify/)
  assert.match(spec, /testInfo\.attach\("migration-parity-inventory", \{\s*contentType: "application\/json",\s*path: inventoryPath/)
  assert.match(spec, /expect\.soft\(activity\.browserMutations, "Render-only parity must not attempt any browser mutation"\)\.toEqual\(\[\]\)/)
})

test("migration parity waits for Chimer's owned notice unmount before capturing the unobscured stepper", async () => {
  const spec = await readProjectFile("tests/browser/atmoshaper-repository-migration-parity.spec.ts")
  const owner = await readProjectFile("app/chimer/set-timer.tsx")
  const publicOwner = await readProjectFile("tests/browser/public-routes.spec.ts")
  assert.match(owner, /const SYNC_NOTICE_EXIT_DURATION_MS = 420/)
  assert.match(owner, /const visibleDuration = syncStatus === "conflict" \? 12000 : 7500/)
  assert.match(owner, /shouldShowSyncNotice && !syncNoticeDismissed &&/)
  assert.match(publicOwner, /getByText\(\/Settings stay on this device\\\.\/i\)\)\.toBeVisible\(\)/)
  const chimer = sliceBetweenMarkers(spec, 'if (surface.name === "chimer") {', 'if (surface.name === "clock") {', "Chimer settled capture").slice
  assert.match(chimer, /await expect\(guestNotice\)\.toBeVisible\(\)[\s\S]*await expect\(guestNotice\)\.toHaveCount\(0, \{ timeout: 12_000 \}\)/)
  assert.match(chimer, /isMobile[\s\S]*"Step 1 of 5"[\s\S]*"1 Time"/)
  assert.match(chimer, /toBeVisible\(\)[\s\S]*toBeInViewport\(\)[\s\S]*document\.elementFromPoint/)
  assert.doesNotMatch(chimer, /waitForTimeout|addStyleTag|\.remove\(|\.style\s*[.=]|mask:|page\.clock/)
  assert.ok(spec.indexOf(chimer) < spec.indexOf("await captureSurface(page, surface.name)", spec.indexOf(chimer)))
})

test("migration parity pins Clock to the real app reduced-motion background before capture", async () => {
  const spec = await readProjectFile("tests/browser/atmoshaper-repository-migration-parity.spec.ts")
  const publicOwner = await readProjectFile("tests/browser/public-routes.spec.ts")
  const settingsOwner = await readProjectFile("components/providers/settings-provider.tsx")
  const motionOwner = await readProjectFile("lib/motion-preferences.js")
  const renderer = await readProjectFile("components/moving-background.tsx")
  const host = await readProjectFile("components/backgrounds/BackgroundHost.tsx")
  const { shouldAnimateAmbientBackground } = await import("../lib/motion-preferences.js")
  assert.equal(shouldAnimateAmbientBackground({
    prefersReducedMotion: false, compactViewport: false, documentHidden: false,
    ambientMotionMode: "reduced", forceMotion: true,
  }), false, "The explicit app preference wins even over forced animation")
  assert.match(publicOwner, /localStorage\.setItem\("massage-lab-settings", JSON\.stringify\(\{ ambientMotionMode: "reduced" \}\)\)/)
  assert.match(settingsOwner, /localStorage\.getItem\("massage-lab-settings"\)/)
  assert.match(motionOwner, /classList\.contains\("chimer-running"\)/)
  assert.match(renderer, /x: Math\.random\(\) \* canvas\.width/)
  assert.match(host, /\(!reduceMotion \|\| entry\.motionIntensity === "static" \|\| entry\.supportsReducedMotionStatic\)/)
  assert.match(spec, /ambientMotionMode: "reduced",\s*backgroundId: "massage-lab-moving-gradient",\s*backgroundPresentation: "static-fallback"/)
  const setup = sliceBetweenMarkers(spec, 'if (surface.name === "clock") {', "const response = await page.goto", "Clock pre-navigation preference").slice
  assert.match(setup, /page\.addInitScript[\s\S]*localStorage\.setItem\("massage-lab-settings", JSON\.stringify\(\{ ambientMotionMode \}\)\)[\s\S]*clockCapture\.ambientMotionMode[\s\S]*page\.clock\.install/)
  const capture = sliceBetweenMarkers(spec, 'await page.waitForLoadState("load")', "await captureSurface(page, surface.name)", "Clock static capture").slice
  assert.match(capture, /page\.locator\("body"\)\)\.toHaveClass\(\/chimer-running\//)
  assert.match(capture, /getByTestId\("chimer-premium-background"\)/)
  for (const attribute of ["data-background-effect-mounted", "data-background-fallback-only"]) {
    assert.ok(capture.includes(`toHaveAttribute("${attribute}", "false")`))
  }
  assert.match(capture, /toHaveAttribute\("data-background-underlay", "visible"\)/)
  assert.match(capture, /background\.locator\("canvas"\)\)\.toHaveCount\(0\)/)
  assert.match(capture, /staticBackground\)\.toBeVisible\(\)[\s\S]*"background-image", \/radial-gradient\/[\s\S]*"animation-name", "none"[\s\S]*page\.clock\.pauseAt/)
  assert.match(capture, /page\.clock\.runFor\(clockCapture\.controlsSettleMs\)/)
  assert.match(capture, /toHaveCSS\("opacity", "1"\)/)
  assert.doesNotMatch(spec, /Math\.random\s*=|addStyleTag|\.remove\(|mask:|maxDiffPixels|maxDiffPixelRatio|threshold:/)
})

test("migration parity requires unique visible Pricing and route-owned Clock content", async () => {
  const spec = await readProjectFile("tests/browser/atmoshaper-repository-migration-parity.spec.ts")
  const pricingOwner = await readProjectFile("app/pricing/page.tsx")
  const surfaceOwner = await readProjectFile("components/ui/app-surface.tsx")
  const donationOwner = await readProjectFile("app/pricing/donation-checkout-form.tsx")
  const clockOwner = await readProjectFile("app/chimer/running-timer.tsx")
  const shellOwner = await readProjectFile("app/chimer/immersive-panel-shell.tsx")
  assert.match(pricingOwner, /<AppSurface\s+id="one-time-support"[\s\S]*?<DonationCheckoutForm/)
  assert.match(surfaceOwner, /<Card id=\{id\}/)
  assert.equal((pricingOwner.match(/<DonationCheckoutForm\b/g) ?? []).length, 1)
  assert.match(donationOwner, /<form\s+action="\/api\/billing\/donation"/)
  assert.match(spec, /name: "pricing"[^\n]+page\.locator\("#one-time-support:visible"\)/)
  const pricing = sliceBetweenMarkers(spec, 'if (surface.name === "pricing") {', 'if (surface.name === "chimer") {', "Pricing owned readiness").slice
  assert.match(pricing, /expect\(support\)\.toHaveCount\(1\)/)
  assert.match(pricing, /support\.locator\('form\[action="\/api\/billing\/donation"\]:visible'\)/)
  assert.match(pricing, /expect\(donationForm\)\.toHaveCount\(1\)[\s\S]*expect\(donationForm\)\.toBeVisible\(\)/)
  assert.match(clockOwner, /<section[^\n]+isClockMode \? "Chimer clock"/)
  assert.equal((clockOwner.match(/testId="chimer-premium-background"/g) ?? []).length, 1)
  assert.match(clockOwner, /data-testid="running-current-time"/)
  assert.match(shellOwner, /return createPortal\([\s\S]*data-immersive-shell[\s\S]*aria-label="Immersive display controls"/)
  const clock = sliceBetweenMarkers(spec, 'await page.waitForLoadState("load")', "await captureSurface(page, surface.name)", "Clock owned readiness").slice
  assert.match(clock, /const clock = page\.getByRole\("region", \{ name: "Chimer clock", exact: true \}\)/)
  assert.match(clock, /expect\(clock\)\.toHaveCount\(1\)[\s\S]*expect\(clock\)\.toBeVisible\(\)/)
  assert.match(clock, /const background = clock\.getByTestId\("chimer-premium-background"\)/)
  assert.match(clock, /expect\(background\)\.toHaveCount\(1\)[\s\S]*expect\(background\)\.toBeVisible\(\)/)
  assert.match(clock, /clock\.getByRole\("button", \{ name: "Reveal clock controls", exact: true \}\)\.click\(\)/)
  assert.match(clock, /getByRole\("group", \{ name: "Immersive display controls", exact: true \}\)/)
  assert.match(clock, /expect\(controls\)\.toHaveCount\(1\)[\s\S]*expect\(controls\)\.toBeVisible\(\)/)
  assert.match(clock, /page\.locator\("\[data-immersive-shell\]:visible"\)\.filter\(\{ has: controls \}\)/)
  assert.match(clock, /expect\(shell\)\.toHaveCount\(1\)[\s\S]*expect\(shell\)\.toHaveCSS\("opacity", "1"\)/)
  assert.match(clock, /const currentTime = clock\.getByTestId\("running-current-time"\)/)
  assert.match(clock, /expect\(currentTime\)\.toHaveCount\(1\)[\s\S]*expect\(currentTime\)\.toBeVisible\(\)[\s\S]*expect\(currentTime\)\.toContainText/)
  assert.doesNotMatch(pricing + clock, /\.first\(|\.nth\(|waitForTimeout|addStyleTag|\.remove\(|mask:|maxDiffPixels|maxDiffPixelRatio|threshold:/)
  assert.doesNotMatch(clock, /page\.getByTestId\("(?:chimer-premium-background|running-current-time)"\)/)
})

test("migration parity remounts Home at the G-proven clock phase without pixel allowances", async () => {
  const spec = await readProjectFile("tests/browser/atmoshaper-repository-migration-parity.spec.ts")
  const homeOwner = await readProjectFile("app/page.tsx")
  const ringOwner = await readProjectFile("components/ui/metal-attention-button.tsx")
  const metal = await readProjectFile("node_modules/metal-fx/dist/index.es.js")
  assert.match(homeOwner, /data-testid="home-brand-wordmark"/)
  assert.match(homeOwner, /<MetalAttentionButton asChild size="lg">/)
  assert.match(ringOwner, /if \(reducedMotion\) \{\s*setMotionState\("paused"\)/)
  assert.match(ringOwner, /metalPaused=\{motionState === "paused"\}/)
  assert.match(metal, /startMs: performance\.now\(\)/)
  assert.match(metal, /\(e - i\.startMs - i\.pausedMs\) \/ 1e3 \* o\.speed/)
  assert.match(metal, /onFirstCopy: \(\) => M\(!0\)/)
  assert.match(metal, /visibility: y \? "visible" : "hidden"/)
  assert.match(spec, /pausedPerformanceMs: 300_000,\s*frameStepMs: 16,\s*frameSteps: 32/)
  const capture = sliceBetweenMarkers(spec, "async function prepareHomeCapture", "test.describe(", "Home capture sequence").slice
  assert.match(capture, /clock\.install[\s\S]*installHomeObservation[\s\S]*goto\("\/tools"[\s\S]*homeLink\.click\(\)[\s\S]*readyHomeRing[\s\S]*goBack\(\)[\s\S]*sampleHomeTeardown[\s\S]*clock\.pauseAt[\s\S]*homeLink\.click\(\)/)
  assert.match(capture, /page\.locator\("main \.ml-app-content"\)/)
  assert.match(capture, /routeContent\.getByText\("MassageLab Tools", \{ exact: true \}\)/)
  assert.equal((capture.match(/expect\(routeContent\)\.toHaveCount\(1\)/g) ?? []).length, 2)
  assert.match(capture, /before === document/)
  assert.match(capture, /"\.ml-metal-attention-root"\)\)\.toHaveCount\(0\)/)
  assert.match(capture, /retiredRootCount: warmRootCount/)
  const frozen = sliceBetweenMarkers(capture, "await page.clock.pauseAt", "for (let step", "Frozen remount before frame sweep").slice
  assert.doesNotMatch(frozen, /clock\.runFor|clock\.fastForward|clock\.resume/)
  assert.match(frozen, /mountedAt === homeCapture\.pausedPerformanceMs/)
  assert.match(frozen, /\.style\.visibility\)\)\.toBe\("hidden"\)/)
  assert.match(frozen, /\.intersecting\)\)\.toBe\(true\)/)
  assert.match(capture, /step <= homeCapture\.frameSteps[\s\S]*clock\.runFor\(homeCapture\.frameStepMs\)/)
  assert.match(capture, /expect\(paint\.sha256\)\.toBe\(firstPaint\.sha256\)/)
  assert.match(capture, /activityByPage\.get\(page\)!\.home = \{/)
  assert.match(spec, /document\.fonts\.ready[\s\S]*image\.decode\(\)/)
  assert.match(spec, /getByTestId\("home-flip-word"\)\)\.toHaveText\("therapists"\)/)
  assert.match(spec, /getImageData\(0, 0, canvas\.width, canvas\.height\)/)
  assert.match(spec, /nontransparentPixels\)\.toBeGreaterThan\(0\)/)
  assert.match(spec, /home: activity\.home/)
  assert.doesNotMatch(capture, /\.first\(|\.nth\(|waitForTimeout|addStyleTag|\.remove\(|Math\.random\s*=|\.resume\(/)
  assert.doesNotMatch(spec, /maxDiffPixels|maxDiffPixelRatio|threshold:|mask:/)
})

test("Home native observation delegates callbacks and rejects incomplete warm-root teardown", async () => {
  const spec = await readProjectFile("tests/browser/atmoshaper-repository-migration-parity.spec.ts")
  const { transpileModule } = await import("typescript")
  const source = sliceBetweenMarkers(spec, "async function installHomeObservation", "/** Shared real Home prerequisites", "Home native observation and teardown").slice
  const observed = []
  class ResizeObserver {
    constructor(callback) { this.callback = callback }
    observe(target, options) { observed.push({ owner: this, target, options }) }
    disconnect() { this.didDisconnect = true }
  }
  class IntersectionObserver extends ResizeObserver {
    constructor(callback, options) {
      super(callback)
      this.options = options
      this.rootMargin = "64px 64px 64px 64px"
    }
  }
  const root = { isConnected: true, matches: (selector) => selector === ".ml-metal-attention-root" }
  const other = { isConnected: true, matches: () => false }
  const window = { ResizeObserver, IntersectionObserver }
  const sandbox = { window, performance: { now: () => 300000 } }
  runInNewContext(transpileModule(source, { compilerOptions: { target: 9 } }).outputText, sandbox)
  await sandbox.installHomeObservation({ addInitScript: (install) => install() })
  const resize = new window.ResizeObserver(() => {})
  const resizeOptions = { box: "border-box" }
  resize.observe(root, resizeOptions)
  resize.observe(other)
  let delivery
  const options = { rootMargin: "64px" }
  const intersection = new window.IntersectionObserver(function (...args) { delivery = { receiver: this, args } }, options)
  intersection.observe(root)
  const entries = [{ target: root, isIntersecting: true }]
  intersection.callback.call(intersection, entries, intersection)
  assert.equal(intersection.options, options)
  assert.equal(observed[0].options, resizeOptions)
  assert.equal(delivery.receiver, intersection)
  assert.equal(delivery.args[0], entries)
  assert.equal(delivery.args[1], intersection)
  const observation = window.__migrationHomeObservation
  assert.equal(observation.roots.size, 1, "Unrelated observer targets must stay outside the Home receipt")
  assert.equal(observation.roots.get(root).mountedAt, 300000)
  assert.equal(observation.roots.get(root).intersecting, true)
  const sample = async () => JSON.parse(JSON.stringify(await sandbox.sampleHomeTeardown({ evaluate: (read) => read() })))
  assert.deepEqual(await sample(), { observedRootCount: 1, retiredRootCount: 0 })
  root.isConnected = false
  resize.disconnect()
  assert.equal(resize.didDisconnect, true)
  assert.deepEqual(await sample(), { observedRootCount: 1, retiredRootCount: 0 }, "Removal plus only one native cleanup is insufficient")
  intersection.disconnect()
  assert.equal(intersection.didDisconnect, true)
  assert.deepEqual(await sample(), { observedRootCount: 1, retiredRootCount: 1 })
})

test("installed paused MetalFx selection retains the G-observed 300016 frame in a bounded model", async () => {
  const core = await readProjectFile("node_modules/playwright-core/lib/coreBundle.js")
  const metal = await readProjectFile("node_modules/metal-fx/dist/index.es.js")
  const clockLiteral = core.match(/source = ('(?:\\.|[^'\\])*');/s)
  assert.ok(clockLiteral, "Installed clock implementation must remain inspectable")
  const clockSource = runInNewContext(clockLiteral[1])
  assert.match(core, /async pauseAt\(ticks\) \{\s*await this\._installIfNeeded\(\)/)
  assert.match(clockSource, /return 16 - this\._now\.ticks % 16/)
  assert.match(metal, /const wt = 66,/)
  const loop = sliceBetweenMarkers(metal, "function ot(e) {", "function te() {", "Installed MetalFx render loop").slice
  // G's actual browser receipts establish navigation/native readiness. This
  // narrower model checks only selection/retention after that proven boundary;
  // it must not be treated as proof of navigation clock replay or native IO.
  for (const hostTime of [1, 99999]) {
    const clockSandbox = { module: {}, Map, Date, Math, Promise, setTimeout, clearTimeout }
    runInNewContext(clockSource, clockSandbox)
    const ClockController = clockSandbox.module.exports.ClockController()
    const clock = new ClockController({
      dateNow: () => hostTime,
      performanceNow: () => hostTime,
      setTimeout: (callback, delay) => {
        const timer = setTimeout(callback, delay)
        return () => clearTimeout(timer)
      },
    })
    const pausedAt = Date.parse("2026-09-06T10:00:00.000Z")
    await clock.log("install", hostTime, pausedAt - 300000)
    await clock.pauseAt(pausedAt)
    assert.equal(clock.performanceNow(), 300000)
    assert.equal(clock.now(), pausedAt)
    const copies = []
    const frames = []
    const instance = { visible: true, paused: true, everCopied: false }
    const renderer = {
      i: { instances: new Set([instance]), glowQueue: [], rafId: 0, useOffscreen: false },
      we: null,
      jt: (time) => frames.push(time),
      Vt: () => copies.push(clock.performanceNow()),
      requestAnimationFrame: (callback) => clock.addTimer({
        type: "AnimationFrame", func: callback, delay: clock.getTimeToNextFrame(),
      }),
    }
    runInNewContext(`const wt = 66; let Ie = 0; ${loop}`, renderer)
    renderer.requestAnimationFrame(renderer.ot)
    await clock.runFor(16)
    assert.deepEqual(frames, [300016])
    assert.deepEqual(copies, [300016])
    assert.equal(instance.everCopied, true)
    await clock.runFor(496)
    assert.deepEqual(copies, [300016], "Paused instances retain their first copied frame")
    assert.equal(clock.performanceNow(), 300512)
  }
})

test("Playwright file filters skip separate option values", () => {
  assert.deepEqual(
    getPlaywrightFileFilterArguments([
      "test",
      "--project", "desktop-chromium",
      "--grep", "dna-twisted",
      "tests/browser/public-routes.spec.ts",
    ]),
    ["test", "tests/browser/public-routes.spec.ts"],
  )
})

test("Playwright file filters consume the grep-invert short-option value", () => {
  assert.deepEqual(
    getPlaywrightFileFilterArguments(["test", "-G", "tests/browser/background-palette.spec.ts"]),
    ["test"],
  )
})

test("Playwright file filters consume optional refs and every variadic project name", () => {
  assert.deepEqual(
    getPlaywrightFileFilterArguments([
      "test",
      "--only-changed", "origin/main",
      "--project", "desktop-chromium", "mobile-chromium",
      "--grep", "dna-twisted",
      "tests/browser/public-routes.spec.ts",
    ]),
    ["test", "tests/browser/public-routes.spec.ts"],
  )
})

test("Playwright file filters require an option terminator after variadic projects", () => {
  assert.deepEqual(
    getPlaywrightFileFilterArguments([
      "test",
      "--project", "desktop-chromium",
      "--",
      "tests/browser/public-routes.spec.ts",
    ]),
    ["test", "tests/browser/public-routes.spec.ts"],
  )
})

test("Playwright file filters retain positional shorthand after inline options", () => {
  assert.deepEqual(
    getPlaywrightFileFilterArguments(["test", "--grep=dna-twisted", "dna-twisted"]),
    ["test", "dna-twisted"],
  )
})

test("Playwright file filters skip every supported option with a separate value", () => {
  assert.deepEqual(
    getPlaywrightFileFilterArguments([
      "test",
      "--trace", "on-first-retry",
      "--repeat-each", "dna-twisted",
      "--tsconfig", "background-palette",
      "--browser", "chromium",
      "--last-failed-file", ".last-run.json",
      "--test-list", "tests.txt",
      "--test-list-invert", "excluded-tests.txt",
      "--ui-host", "127.0.0.1",
      "--ui-port", "9323",
      "--update-source-method", "patch",
      "tests/browser/public-routes.spec.ts",
    ]),
    ["test", "tests/browser/public-routes.spec.ts"],
  )
})

test("Playwright file filters tolerate trailing options and an empty terminator", () => {
  assert.deepEqual(getPlaywrightFileFilterArguments(["test", "--grep"]), ["test"])
  assert.deepEqual(getPlaywrightFileFilterArguments(["test", "--only-changed"]), ["test"])
  assert.deepEqual(getPlaywrightFileFilterArguments(["test", "--project"]), ["test"])
  assert.deepEqual(getPlaywrightFileFilterArguments(["test", "--"]), ["test"])
})

test("browser QA harness is wired for public smoke, PWA, and local-first checks", async () => {
  const [packageJson, config, publicRoutesSpec, pwaSpec, localFirstSpec, ciWorkflow] = await Promise.all([
    readProjectFile("package.json"),
    readProjectFile("playwright.config.ts"),
    readProjectFile("tests/browser/public-routes.spec.ts"),
    readProjectFile("tests/browser/pwa.spec.ts"),
    readProjectFile("tests/browser/local-first.spec.ts"),
    readProjectFile(".github/workflows/ci.yml"),
  ])

  const packageData = JSON.parse(packageJson)

  assert.match(packageData.devDependencies["@playwright/test"], /^\^\d+\.\d+\.\d+$/)
  assert.equal(packageData.scripts["test:browser"], "playwright test")
  assert.equal(packageData.scripts["test:browser:build"], "npm run build:browser-qa && npm run test:browser")

  assert.match(config, /webServer/)
  assert.match(config, /localhost:3010/)
  assert.match(config, /Desktop Chrome/)
  assert.match(config, /Pixel 7/)
  assert.match(config, /function parseBrowserQaPort/)
  assert.match(config, /Number\.isInteger/)
  assert.match(config, /process\.env\.PLAYWRIGHT_PORT/)
  assert.match(config, /function parseBooleanEnv/)
  assert.match(config, /const skipWebServer = parseBooleanEnv\(process\.env\.PLAYWRIGHT_SKIP_WEB_SERVER\)/)
  assert.match(config, /assertBrowserQaOwnedServerRequirement\(skipWebServer\)/)
  assert.match(config, /webServer:\s*\{/)
  assert.doesNotMatch(config, /webServer:\s*skipWebServer/)
  assert.match(config, /runsDevelopmentPaletteReview/)
  assert.doesNotMatch(config, /new RegExp\(argument\)/)
  assert.match(
    config,
    /developmentPaletteReviewSpecs[\s\S]*tests\/browser\/background-palette\.spec\.ts[\s\S]*tests\/browser\/dna-twisted-cubes-backgrounds\.spec\.ts/,
  )
  const reviewIgnoreGlobs = [
    "**/background-palette.spec.ts",
    "**/background-carousel-preview.spec.ts",
    "**/background-preview-pilot.spec.ts",
    "**/dna-twisted-cubes-backgrounds.spec.ts",
  ]
  assert.deepEqual(resolveDevelopmentPaletteReviewIgnoreGlobs(["test"]), reviewIgnoreGlobs)
  assert.deepEqual(
    resolveDevelopmentPaletteReviewIgnoreGlobs(["test", "tests/browser/background-palette.spec.ts"]),
    [],
  )
  assert.deepEqual(
    resolveDevelopmentPaletteReviewIgnoreGlobs(["test", "tests/browser/background-carousel-preview.spec.ts"]),
    [],
  )
  assert.deepEqual(
    resolveDevelopmentPaletteReviewIgnoreGlobs(["test", "tests/browser/background-preview-pilot.spec.ts"]),
    [],
  )

  for (const route of ["/", "/notes", "/notes/soap", "/chimer", "/calendar", "/anatomime"]) {
    assert.match(publicRoutesSpec, new RegExp(JSON.stringify(route)))
  }

  assert.match(publicRoutesSpec, /\/api\/account\/preferences/)
  assert.match(publicRoutesSpec, /\/api\/account\/profile/)
  assert.match(publicRoutesSpec, /page\.on\("console"/)
  assert.match(publicRoutesSpec, /page\.on\("pageerror"/)

  assert.match(pwaSpec, /\/manifest\.webmanifest/)
  assert.match(pwaSpec, /\/icons\/icon-192\.png/)
  assert.match(pwaSpec, /\/icons\/icon-512\.png/)
  assert.match(pwaSpec, /\/icons\/maskable-icon-192\.png/)
  assert.match(pwaSpec, /\/icons\/maskable-icon-512\.png/)

  assert.match(localFirstSpec, /ML_BROWSER_QA_SENTINEL/)
  assert.match(localFirstSpec, /decodeURIComponent\(rawUrl\)/)
  assert.match(localFirstSpec, /encodeURIComponent\(ML_BROWSER_QA_SENTINEL\)/)
  assert.match(localFirstSpec, /\/api\/clinical\/sync/)
  assert.match(localFirstSpec, /\/api\/clients\//)
  assert.match(localFirstSpec, /POST|PUT|PATCH|DELETE/)

  assert.match(ciWorkflow, /npm run test:browser/)
  assert.match(ciWorkflow, /AUTH_SECRET/)
  assert.match(ciWorkflow, /NEXTAUTH_SECRET/)
  assert.match(ciWorkflow, /npx playwright install --with-deps chromium/)
  assert.match(ciWorkflow, /^permissions:\r?\n  contents: read$/m)
  assertWorkflowStepBefore(ciWorkflow, "npm run prisma:generate", "npm run typecheck")
})

test("media readiness QA targets the dedicated proof runtime when mixer bundles share its exports", async () => {
  const mediaSessionSpec = await readProjectFile("tests/browser/music-media-session.spec.ts")

  assert.match(mediaSessionSpec, /source\.includes\('\"startToneProofDrone\",0'\)/)
  assert.match(mediaSessionSpec, /source\.includes\('\"getToneProofDroneDiagnostics\",0'\)/)
  assert.match(mediaSessionSpec, /!source\.includes\('\"createAtmoShaperRuntime\",0'\)/)
})

test("CI workflow parallelizes browser QA and aggregates every upstream result", async () => {
  const ciWorkflow = await readProjectFile(".github/workflows/ci.yml")

  assert.match(ciWorkflow, /^  code_quality:\r?$/m)
  assert.match(ciWorkflow, /^  browser_build:\r?$/m)
  assert.match(ciWorkflow, /^  browser_qa:\r?$/m)
  assert.match(ciWorkflow, /^  qa:\r?$/m)
  assert.match(getWorkflowJob(ciWorkflow, "code_quality"), /^    timeout-minutes: 20$/m)
  assert.match(ciWorkflow, /browser_build:\r?\n    name: Browser build[\s\S]*?timeout-minutes: 12/)
  assert.match(ciWorkflow, /browser_qa:\r?\n    name: Browser QA \(lane \$\{\{ matrix\.lane \}\}\)[\s\S]*?needs: browser_build[\s\S]*?timeout-minutes: 25/)
  assert.match(ciWorkflow, /qa:\r?\n    name: qa[\s\S]*?if: \$\{\{ always\(\) \}\}[\s\S]*?timeout-minutes: 2/)
  assert.doesNotMatch(getWorkflowJob(ciWorkflow, "code_quality"), /^    needs:/m)
  assert.doesNotMatch(getWorkflowJob(ciWorkflow, "browser_build"), /^    needs:/m)
  for (const jobId of ["browser_build", "browser_qa"]) {
    assert.match(
      getWorkflowJob(ciWorkflow, jobId),
      /- name: Check out repository\r?\n        # Pinned from actions\/checkout@v6 on 2026-06-10\.\r?\n        uses: actions\/checkout@df4cb1c069e1874edd31b4311f1884172cec0e10\r?\n        with:\r?\n          persist-credentials: false/,
    )
  }

  assert.equal((getWorkflowJob(ciWorkflow, "browser_build").match(/^        run: npm run build:browser-qa$/gm) ?? []).length, 1)
  assert.match(ciWorkflow, /strategy:\r?\n      fail-fast: false\r?\n      matrix:\r?\n        lane: \["1", "2", "3", "4"\]/)
  assert.match(ciWorkflow, /PLAYWRIGHT_CI_LANE: \$\{\{ matrix\.lane \}\}/)
  assert.match(ciWorkflow, /key: \$\{\{ runner\.os \}\}-nextjs-v2-/)

  const runtimeArtifact = "next-runtime-${{ github.sha }}-${{ github.run_attempt }}"
  const browserQaJob = getWorkflowJob(ciWorkflow, "browser_qa")
  assert.match(ciWorkflow, new RegExp(`name: ${runtimeArtifact.replaceAll("$", "\\$").replaceAll("{", "\\{").replaceAll("}", "\\}")}`))
  assert.match(
    ciWorkflow,
    /uses: actions\/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a\r?\n        with:\r?\n          name: next-runtime-\$\{\{ github\.sha \}\}-\$\{\{ github\.run_attempt \}\}\r?\n          path: \|\r?\n            \.next\r?\n            !\.next\/cache\/\*\*\r?\n          if-no-files-found: error\r?\n          retention-days: 1\r?\n          include-hidden-files: true/,
  )
  // Keep recovery scoped to Browser QA, tolerate download failure only on reruns,
  // and pin the exact artifact download configuration that precedes the fallback.
  assert.match(
    browserQaJob,
    /id: download_browser_runtime\r?\n        #[^\r\n]*\r?\n        #[^\r\n]*\r?\n        continue-on-error: \$\{\{ github\.run_attempt > 1 \}\}\r?\n        uses: actions\/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c\r?\n        with:\r?\n          name: next-runtime-\$\{\{ github\.sha \}\}-\$\{\{ github\.run_attempt \}\}\r?\n          path: \.next/,
  )
  assert.match(
    browserQaJob,
    /- name: Rebuild browser runtime after rerun artifact loss\r?\n        if: \$\{\{ github\.run_attempt > 1 && steps\.download_browser_runtime\.outcome == 'failure' \}\}\r?\n        run: npm run build:browser-qa/,
  )
  assert.equal((browserQaJob.match(/^        run: npm run build:browser-qa$/gm) ?? []).length, 1)
  assertWorkflowStepBefore(browserQaJob, "id: download_browser_runtime", "npm run build:browser-qa")
  assertWorkflowStepBefore(browserQaJob, "npm run build:browser-qa", "npm run test:browser")
  assert.match(
    ciWorkflow,
    /if: \$\{\{ always\(\) \}\}\r?\n        uses: actions\/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a\r?\n        with:\r?\n          name: browser-diagnostics-\$\{\{ github\.sha \}\}-\$\{\{ github\.run_attempt \}\}-lane-\$\{\{ matrix\.lane \}\}\r?\n          path: test-results\r?\n          if-no-files-found: ignore\r?\n          retention-days: 7\r?\n          include-hidden-files: true/,
  )

  assert.match(ciWorkflow, /needs:\r?\n      - code_quality\r?\n      - browser_build\r?\n      - browser_qa/)
  assert.match(ciWorkflow, /CODE_QUALITY_RESULT: \$\{\{ needs\.code_quality\.result \}\}/)
  assert.match(ciWorkflow, /BROWSER_BUILD_RESULT: \$\{\{ needs\.browser_build\.result \}\}/)
  assert.match(ciWorkflow, /BROWSER_QA_RESULT: \$\{\{ needs\.browser_qa\.result \}\}/)
  assert.match(ciWorkflow, /"code_quality=\$CODE_QUALITY_RESULT"/)
  assert.match(ciWorkflow, /"browser_build=\$BROWSER_BUILD_RESULT"/)
  assert.match(ciWorkflow, /"browser_qa=\$BROWSER_QA_RESULT"/)
  assert.match(ciWorkflow, /echo "::error::\$dependency returned \$result"/)
  assert.match(ciWorkflow, /if \[ "\$result" != "success" \]; then/)
  assert.match(ciWorkflow, /exit "\$failed"/)

  assert.match(ciWorkflow, /^  pull_request:/m)
  assert.match(ciWorkflow, /^  push:\r?\n    branches:\r?\n      - main$/m)
  assert.match(ciWorkflow, /^permissions:\r?\n  contents: read$/m)
  assert.match(ciWorkflow, /cancel-in-progress: \$\{\{ github\.event_name == 'pull_request' \}\}/)
  assertWorkflowStepBefore(ciWorkflow, "npm run prisma:generate", "npm run typecheck")
  assertWorkflowStepBefore(ciWorkflow, "npm run prisma:generate", "npm run test:browser")
})

test("Phase 6 brand collapse preserves controls at 320px with and without cart", async (t) => {
  const { chromium, expect: browserExpect } = await import("@playwright/test")
  const ts = await import("typescript")
  const { transpileModule } = ts
  const React = await import("react")
  const jsxRuntime = await import("react/jsx-runtime")
  const { renderToStaticMarkup } = await import("react-dom/server")
  const identity = await import("../lib/public-product-identity.js")
  const source = await readProjectFile("components/shell/app-bar-brand-link.tsx")
  const css = await readProjectFile("app/globals.css")
  const mark = identity.PUBLIC_PRODUCT_IDENTITY.assets.appBarMark
  const imageData = mark ? await readFile(new URL(`../public${mark}`, import.meta.url)) : null
  const exports = {}
  // Render the actual owner; replace framework transport only, with no server or providers.
  runInNewContext(transpileModule(source, { compilerOptions: { module: 1, jsx: 4, target: 9 } }).outputText, {
    exports,
    require(name) {
      if (name === "react/jsx-runtime") return jsxRuntime
      if (name === "@/lib/public-product-identity") return identity
      if (name === "@/lib/utils") return { cn: (...values) => values.filter(Boolean).join(" ") }
      if (name === "next/link") return { default: (props) => React.createElement("a", props) }
      if (name === "next/image") return { default: (props) => React.createElement("img", {
        alt: props.alt, width: props.width, height: props.height, className: props.className,
        sizes: props.sizes, src: `data:image/png;base64,${imageData.toString("base64")}`,
      }) }
      throw new Error(`Unexpected brand dependency: ${name}`)
    },
  })
  const brandMarkup = renderToStaticMarkup(React.createElement(exports.AppBarBrandLink))
  assert.doesNotMatch(brandMarkup, /ml-app-bar-brand-wordmark/)
  const shell = await readProjectFile("tests/browser/app-shell.spec.ts")
  const parsed = ts.createSourceFile("app-shell.spec.ts", shell, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const helperNames = ["expectTextBrandFits", "expectTemporaryMarkBrandFits"]
  const helpers = { expect: browserExpect.configure({ timeout: 500 }) }
  for (const name of helperNames) {
    const declarations = parsed.statements.filter((node) => ts.isFunctionDeclaration(node) && node.name?.text === name)
    assert.equal(declarations.length, 1, `one actual ${name} assertion owner`)
    // Execute the Browser-QA assertion itself, not a copied approximation of its contract.
    runInNewContext(transpileModule(declarations[0].getText(parsed), {
      compilerOptions: { target: ts.ScriptTarget.ES2022 },
    }).outputText, helpers)
  }
  const calls = []
  const visitCalls = (node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && helperNames.includes(node.expression.text)) {
      calls.push(node.expression.text)
    }
    ts.forEachChild(node, visitCalls)
  }
  visitCalls(parsed)
  assert.deepEqual(calls, ["expectTextBrandFits", "expectTextBrandFits", "expectTemporaryMarkBrandFits"],
    "both wide consumers remain text-only; only the narrow consumer requires the mark")
  let narrowMarkFixture = ""
  const browser = await chromium.launch()
  const context = await browser.newContext({ serviceWorkers: "block", viewport: { width: 1000, height: 600 } })
  let requests = 0
  await context.route("**/*", async (route) => { requests += 1; await route.abort() })
  try {
    const page = await context.newPage()
    for (const edge of ["left", "right"]) {
      for (const cart of [false, true]) {
        for (const width of [320, 355, 356, 390, 414, 416, 418, 600]) {
          await t.test(`${width}px ${edge} drawer cart=${cart}`, async () => {
            await page.setViewportSize({ width, height: 600 })
            const control = (name) => {
              const tactileVariant = name === "theme" ? "ml-button-glow" : name === "cart" ? "ml-button-outline" : "ml-button-cta-blue"
              return `<button class="ml-main-bar-button ml-button-press-motion ml-button-tactile ${tactileVariant}" data-control="${name}">${name}</button>`
            }
            const drawer = control("drawer")
            const cluster = `<div class="ml-main-bar-drawer-brand" data-drawer-edge="${edge}">${edge === "left" ? drawer + brandMarkup : brandMarkup + drawer}</div>`
            const names = edge === "left" ? ["music", "clock", "quick", "theme", "calendar"] : ["calendar", "theme", "quick", "clock", "music"]
            if (cart) names.push("cart")
            const tools = `<div class="ml-main-bar-tools">${names.map(control).join("")}</div>`
            // Only fixture utilities: real CSS owns brand/container behavior and control dimensions.
            await page.setContent(`<style>${css}</style><style>
              * { box-sizing: border-box; } body { margin: 0; }
              .ml-mobile-main-bar { width: ${width}px; padding: 0 6px; --ml-main-bar-height: 52px; }
              button { flex-shrink: 0; } [data-control="theme"] { width: 32px !important; height: 32px !important; }
            </style><nav class="ml-mobile-main-bar"><div class="ml-main-bar-layout" data-drawer-edge="${edge}">${edge === "left" ? cluster + tools : tools + cluster}</div></nav>`)
            const brand = page.getByTestId("app-bar-brand")
            // Existing controls: four 42px actions, 32px theme, 4px gaps, plus optional cart.
            const available = Math.min(190, width - 12 - (cart ? 262 : 216))
            const state = available < 42 + 4 + 36 ? "hidden" : available <= 188 ? "mark" : "text"
            assert.equal(await brand.isVisible(), state !== "hidden", `${state}: brand visibility`)
            assert.equal(await brand.locator(".ml-app-bar-brand-text").isVisible(), state === "text", `${state}: text visibility`)
            assert.equal(await brand.locator(".ml-app-bar-brand-mark").isVisible(), state === "mark", `${state}: mark visibility`)
            if (state === "mark") {
              await helpers.expectTemporaryMarkBrandFits(brand)
              const box = await brand.locator("img").boundingBox()
              assert.equal(box.width, 36)
              assert.equal(box.height, 36)
              assert.equal(await brand.locator("img").evaluate((image) => image.complete && image.naturalWidth > 0), true)
            }
            if (state === "text") await helpers.expectTextBrandFits(brand)
            if (width === 390 && edge === "left" && !cart) narrowMarkFixture = await page.content()
            const boxes = await page.locator("[data-control]").evaluateAll((elements) => elements.map((element) => ({
              name: element.getAttribute("data-control"), ...element.getBoundingClientRect().toJSON(),
            })))
            assert.deepEqual(boxes.map((box) => box.name), edge === "left" ? ["drawer", ...names] : [...names, "drawer"])
            for (const [index, box] of boxes.entries()) {
              assert.equal(box.width, box.name === "theme" ? 32 : 42)
              assert.equal(box.height, box.name === "theme" ? 32 : 42)
              const centerDeviation = Math.abs(
                box.y + box.height / 2 - (boxes[0].y + boxes[0].height / 2),
              )
              assert.ok(centerDeviation <= 1)
              assert.ok(box.x >= 6 && box.right <= width - 6)
              if (index > 0) assert.ok(box.x >= boxes[index - 1].right)
            }
            if (state !== "hidden") {
              const box = await brand.boundingBox()
              for (const controlBox of boxes) assert.ok(box.x >= controlBox.right || box.x + box.width <= controlBox.x)
              if (state === "text") assert.equal(await brand.evaluate((element) => element.scrollWidth <= element.clientWidth), true)
            }
            // The same available container width must behave identically on a wider device.
            await page.setViewportSize({ width: 1000, height: 600 })
            assert.equal(await brand.isVisible(), state !== "hidden")
            assert.equal(await brand.locator(".ml-app-bar-brand-text").isVisible(), state === "text")
            assert.equal(await brand.locator(".ml-app-bar-brand-mark").isVisible(), state === "mark")
            assert.deepEqual(await page.locator("[data-control]").evaluateAll((elements) => elements.map((element) => ({
              name: element.getAttribute("data-control"), ...element.getBoundingClientRect().toJSON(),
            }))), boxes)
            await page.locator("body").click({ position: { x: 900, y: 200 } })
            const tabOrder = []
            for (let index = 0; index < boxes.length + (state === "hidden" ? 0 : 1); index += 1) {
              await page.keyboard.press("Tab")
              tabOrder.push(await page.evaluate(() => document.activeElement.getAttribute("data-control") ?? document.activeElement.getAttribute("data-testid")))
            }
            const expectedOrder = edge === "left" ? ["drawer", ...(state === "hidden" ? [] : ["app-bar-brand"]), ...names] : [...names, ...(state === "hidden" ? [] : ["app-bar-brand"]), "drawer"]
            assert.deepEqual(tabOrder, expectedOrder, "hidden brand leaves no invisible focus target")
          })
        }
      }
    }
    await t.test("tablet top bar retains full text outside the mobile container", async () => {
      await page.setViewportSize({ width: 768, height: 600 })
      await page.setContent(`<style>${css}</style><header class="ml-app-topbar">${brandMarkup}</header>`)
      const brand = page.getByTestId("app-bar-brand")
      assert.equal(await brand.locator(".ml-app-bar-brand-text").isVisible(), true)
      assert.equal(await brand.locator(".ml-app-bar-brand-mark").isVisible(), false)
      assert.equal(await brand.evaluate((element) => element.scrollWidth <= element.clientWidth), true)
      await helpers.expectTextBrandFits(brand)
    })
    assert.ok(narrowMarkFixture, "the actual 390px component/CSS fixture was captured")
    for (const [name, mutate, failure] of [
      ["visible text", (brand) => brand.locator(".ml-app-bar-brand-text").evaluate((element) => { element.style.display = "block" }), /toBeHidden/],
      ["missing mark", (brand) => brand.locator(".ml-app-bar-brand-mark").evaluate((element) => element.remove()), /toHaveCount/],
      ["hidden mark", (brand) => brand.locator(".ml-app-bar-brand-mark").evaluate((element) => { element.style.display = "none" }), /toBeVisible/],
      ["wrong width", (brand) => brand.locator(".ml-app-bar-brand-mark").evaluate((element) => { element.style.width = "35px" }), /toHaveCSS/],
      ["wrong height", (brand) => brand.locator(".ml-app-bar-brand-mark").evaluate((element) => { element.style.height = "35px" }), /toHaveCSS/],
      ["broken image", (brand) => brand.locator(".ml-app-bar-brand-mark").evaluate((image) => { image.src = "data:image/png;base64,invalid" }), /temporary brand mark has loaded/],
      ["clipped mark", (brand) => brand.locator(".ml-app-bar-brand-mark").evaluate((element) => { element.style.transform = "translateX(8px)" }), /temporary brand mark fits without clipping/],
    ]) {
      await t.test(`narrow mark assertion rejects ${name}`, async () => {
        await page.setViewportSize({ width: 390, height: 844 })
        await page.setContent(narrowMarkFixture)
        const brand = page.getByTestId("app-bar-brand")
        await helpers.expectTemporaryMarkBrandFits(brand)
        await mutate(brand)
        await assert.rejects(helpers.expectTemporaryMarkBrandFits(brand), failure)
      })
    }
    await t.test("wide text assertion rejects the valid narrow mark state", async () => {
      await page.setContent(narrowMarkFixture)
      await assert.rejects(helpers.expectTextBrandFits(page.getByTestId("app-bar-brand")), /toBeVisible/)
    })
    assert.equal(requests, 0, "provider-free layout makes no network requests")
  } finally {
    await context.close()
    await browser.close()
  }
})

test("Phase 6 account helper survives owner replacement without swallowing defects", async (t) => {
  const { chromium, expect: browserExpect, errors } = await import("@playwright/test")
  const { transpileModule } = await import("typescript")
  const spec = await readProjectFile("tests/browser/phase6-preview-rebrand.spec.ts")
  const source = sliceBetweenMarkers(spec, "async function openAccountMenu", 'test("presents', "actual Phase 6 account helper").slice
  // This offline evidence budget covers 500 ms drawer motion, at least two
  // bounded 100 ms trigger probes, and poll scheduling without changing the real helper.
  const sandbox = { expect: browserExpect.configure({ timeout: 2500 }), errors }
  runInNewContext(transpileModule(source, { compilerOptions: { target: 9 } }).outputText, sandbox)
  const browser = await chromium.launch()
  let requests = 0
  try {
    for (const scenario of ["desktop", "desktop-transition", "desktop-persistent-trigger-timeout", "trigger-after-count", "trigger-before-click", "navigation-replaced", "navigation-already-open", "drawer-transition", "drawer-transition-blocked", "duplicate-trigger", "blocked-trigger", "unrelated-error"]) {
      await t.test(scenario, async () => {
        const context = await browser.newContext({ serviceWorkers: "block", reducedMotion: "reduce" })
        await context.route("**/*", async (route) => { requests += 1; await route.abort() })
        try {
          const page = await context.newPage()
          page.setDefaultTimeout(500)
          await page.setContent(`
            <style>
              @keyframes enter { from { transform: translateX(-80px); } to { transform: translateX(0); } }
              .drawer-enter { animation: enter 500ms linear; }
            </style>
            <button id="navigation" aria-label="Open navigation" aria-expanded="false">Navigation</button>
            <div id="rail"><button data-testid="account-menu-trigger" aria-expanded="false">Account</button></div>
            <button role="menuitem" hidden>Help &amp; FAQ</button>
            <script>
              window.navigationClicks = 0;
              window.drawerFinished = false;
              document.addEventListener("animationend", () => { window.drawerFinished = true; });
              document.addEventListener("click", (event) => {
                const target = event.target;
                if (target.id === "navigation") {
                  window.navigationClicks += 1;
                  const open = target.getAttribute("aria-expanded") !== "true";
                  target.setAttribute("aria-expanded", String(open));
                  document.querySelector("#rail").innerHTML = open
                    ? '<button data-testid="account-menu-trigger" aria-expanded="false">Account</button>' : '';
                  if (open && ${scenario.startsWith("drawer-")}) {
                    const drawer = document.querySelector("#rail");
                    drawer.dataset.sidebar = "sidebar";
                    drawer.dataset.mobile = "true";
                    drawer.dataset.state = "open";
                    drawer.className = "drawer-enter";
                    if (${scenario === "drawer-transition-blocked"}) {
                      const overlay = document.createElement("div");
                      overlay.style.cssText = "position:fixed;inset:0;z-index:999";
                      document.body.append(overlay);
                    }
                  }
                }
                if (target.matches('[data-testid="account-menu-trigger"]')) {
                  target.setAttribute("aria-expanded", "true");
                  document.querySelector('[role="menuitem"]').hidden = false;
                }
              });
            </script>`)
          if (scenario.startsWith("navigation-") || scenario.startsWith("drawer-")) await page.locator("#rail").evaluate((element) => { element.innerHTML = "" })
          if (scenario === "desktop-transition") await page.getByTestId("account-menu-trigger").evaluate((element) => {
            element.animate([
              { transform: "translateX(-80px)" },
              { transform: "translateX(0)" },
            ], { duration: 500, easing: "linear", iterations: 1 })
          })
          if (scenario === "duplicate-trigger") await page.locator("#rail").evaluate((element) => { element.innerHTML += element.innerHTML })
          if (scenario === "blocked-trigger") await page.evaluate(() => {
            const overlay = document.createElement("div")
            overlay.style.cssText = "position:fixed;inset:0;z-index:999"
            document.body.append(overlay)
          })
          let injected = false
          let triggerClickAttempts = 0
          // Keep real locator behavior outside the named deterministic replacement and failure edges.
          const wrap = (locator, owner) => new Proxy(locator, {
            get(target, property) {
              if (property === "filter" || property === "and") return (...args) => wrap(target[property](...args), owner)
              if (property === "count") return async () => {
                const count = await target.count()
                if (!injected && owner === "trigger" && count === 1 && scenario === "trigger-after-count") {
                  injected = true
                  await page.locator("#rail").evaluate((element) => { element.innerHTML = "" })
                }
                return count
              }
              if (property === "click") return async (...args) => {
                if (owner === "trigger") triggerClickAttempts += 1
                if (!injected && scenario === "unrelated-error") { injected = true; throw new Error("deliberate action defect") }
                if (!injected && owner === "trigger" && scenario === "desktop-persistent-trigger-timeout") {
                  injected = true
                  throw new errors.TimeoutError("deliberate bounded action timeout")
                }
                if (!injected && owner === "trigger" && scenario === "trigger-before-click") {
                  injected = true
                  await page.locator("#rail").evaluate((element) => { element.innerHTML = "" })
                }
                if (!injected && owner === "navigation" && scenario.startsWith("navigation-")) {
                  injected = true
                  await page.locator("#navigation").evaluate((element, alreadyOpen) => {
                    const replacement = element.cloneNode(true)
                    element.replaceWith(replacement)
                    if (alreadyOpen) replacement.click()
                  }, scenario === "navigation-already-open")
                }
                return target.click(...args)
              }
              return typeof target[property] === "function" ? target[property].bind(target) : target[property]
            },
          })
          const observedPage = new Proxy(page, {
            get(target, property) {
              if (property === "getByTestId") return (...args) => wrap(target.getByTestId(...args), "trigger")
              if (property === "getByRole") return (...args) => args[0] === "button"
                ? wrap(target.getByRole(...args), "navigation") : target.getByRole(...args)
              return typeof target[property] === "function" ? target[property].bind(target) : target[property]
            },
          })
          if (scenario === "duplicate-trigger") {
            await assert.rejects(sandbox.openAccountMenu(observedPage), /toBeLessThanOrEqual/)
          } else if (scenario === "blocked-trigger" || scenario === "drawer-transition-blocked") {
            await assert.rejects(sandbox.openAccountMenu(observedPage))
            assert.ok(triggerClickAttempts > 1, "persistent obstruction must exhaust the outer poll across repeated trigger probes")
          } else if (scenario === "unrelated-error") {
            await assert.rejects(sandbox.openAccountMenu(observedPage), /deliberate action defect/)
          } else {
            await sandbox.openAccountMenu(observedPage)
            await browserExpect(page.getByRole("menuitem", { name: "Help & FAQ", exact: true })).toBeVisible()
            assert.equal(await page.evaluate(() => window.navigationClicks), scenario.startsWith("desktop") ? 0 : 1)
          }
          if (scenario.startsWith("drawer-")) {
            assert.equal(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches), true)
            assert.equal(await page.evaluate(() => window.drawerFinished), true)
          } else if (!["desktop", "desktop-transition", "duplicate-trigger", "blocked-trigger"].includes(scenario)) assert.equal(injected, true)
        } finally {
          await context.close()
        }
      })
    }
  } finally {
    await browser.close()
    assert.equal(requests, 0, "the actual-helper diagnostic must remain completely offline")
  }
})

test("Phase 6 Station handoff readiness runs only before the closed/expanded category click", async () => {
  const spec = await readProjectFile("tests/browser/phase6-preview-rebrand.spec.ts")
  const scenario = sliceBetweenMarkers(spec, 'test("keeps Atmosphere navigation', 'test("uses AtmoShaper in install', "Phase 6 Station handoff").slice
  assertWorkflowStepBefore(scenario, "await expectMusicReady(page)", "await expectStationCompositionSettled(page)")
  assertWorkflowStepBefore(scenario, "await expectStationCompositionSettled(page)", 'await page.getByRole("group", { name: "Station category" })')
  assert.equal((spec.match(/await expectStationCompositionSettled\(page\)/g) ?? []).length, 1)
  assert.doesNotMatch(spec, /waitForTimeout|addStyleTag|maxDiffPixels|maxDiffPixelRatio|threshold:|mask:/)
})

test("Phase 6 Station handoff readiness executes actual bounded card and scale convergence", async (t) => {
  const { transpileModule } = await import("typescript")
  const spec = await readProjectFile("tests/browser/phase6-preview-rebrand.spec.ts")
  const start = spec.indexOf("async function expectStationCompositionSettled")
  assert.notEqual(start, -1)
  const helper = transpileModule(spec.slice(start), { compilerOptions: { target: 9 } }).outputText
  const base = {
    box: { x: 101.5, y: 202.25, width: 217, height: 253 },
    scales: ["1.13", "1.09rem", "1.13rem"],
  }
  const motion = (iterations, playState = "running") => ({ playState, effect: { getTiming: () => ({ iterations }) } })

  // Execute the actual DOM reader and convergence loop, replacing only the
  // document and poll scheduler with controlled, network-free observations.
  const run = async (sampleAt) => {
    let reads = 0
    let current
    let options
    const ancestor = {
      parentElement: null,
      getAnimations: () => current.ancestorAnimations ?? [],
    }
    const card = {
      get isConnected() { return current.cardConnected !== false },
      getBoundingClientRect: () => current.box ?? base.box,
    }
    const workspace = {
      get isConnected() { return current.workspaceConnected !== false },
      parentElement: ancestor,
      querySelectorAll: (selector) => {
        assert.equal(selector, '[data-carousel-slide][data-centered="true"]')
        return current.cardMissing ? [] : current.duplicateCard ? [card, card] : [card]
      },
      getAnimations: (query) => {
        assert.equal(query.subtree, true, "include descendant layout motion")
        return [...(current.animations ?? [])]
      },
    }
    const sandbox = {
      document: {
        querySelector: (selector) => {
          assert.equal(selector, ".ml-atmosphere-carousel-workspace")
          return current.workspaceMissing ? null : workspace
        },
      },
      getComputedStyle: (element) => {
        assert.equal(element, workspace)
        return {
          getPropertyValue: (property) => {
            const index = ["--ml-atmosphere-workspace-scale", "--ml-atmosphere-header-scale-rem", "--ml-atmosphere-workspace-scale-rem"].indexOf(property)
            assert.notEqual(index, -1)
            return (current.scales ?? base.scales)[index]
          },
        }
      },
      expect: {
        poll: (read, suppliedOptions) => {
          options = suppliedOptions
          return {
            toBe: async (expected) => {
              assert.equal(expected, true)
              assert.deepEqual([...options.intervals], [50])
              assert.equal(options.timeout, 7_500)
              assert.match(options.message, /before category handoff/)
              for (let elapsed = 0; elapsed <= options.timeout; elapsed += options.intervals[0]) {
                if (await read() === expected) return
              }
              throw new Error("Station convergence exhausted its bounded poll")
            },
          }
        },
      },
    }
    runInNewContext(helper, sandbox)
    let error
    try {
      await sandbox.expectStationCompositionSettled({
        evaluate: async (read) => {
          current = sampleAt(++reads)
          if (current.error) throw current.error
          return read()
        },
      })
    } catch (caught) {
      error = caught
    }
    return { reads, error }
  }

  await t.test("requires seven valid equal readings, not a guessed target geometry", async () => {
    assert.deepEqual(await run(() => base), { reads: 7, error: undefined })
    const alternate = { box: { x: 27, y: 18, width: 165, height: 199 }, scales: ["1", "1rem", "1rem"] }
    assert.deepEqual(await run(() => alternate), { reads: 7, error: undefined })
  })
  await t.test("each card coordinate and each shared scale restarts the whole window", async () => {
    const changes = Object.keys(base.box).map((key) => ({ box: { ...base.box, [key]: base.box[key] + 1 } }))
    changes.push(...base.scales.map((_, index) => ({ scales: base.scales.map((value, position) => index === position ? "1.2" : value) })))
    for (const change of changes) {
      assert.deepEqual(await run((read) => read < 4 ? base : change), { reads: 10, error: undefined })
    }
  })
  await t.test("missing, disconnected, invalid, and duplicate observations cannot bridge quiet samples", async () => {
    const invalid = [
      { workspaceMissing: true }, { cardMissing: true }, { duplicateCard: true },
      { workspaceConnected: false }, { cardConnected: false },
      { box: { ...base.box, x: NaN } }, { box: { ...base.box, width: 0 } },
      { box: { ...base.box, height: -1 } },
      ...["", "NaN", "Infinity", "0", "-1"].flatMap((value) => base.scales.map((_, index) => ({
        scales: base.scales.map((scale, position) => position === index ? value : scale),
      }))),
    ]
    for (const sample of invalid) {
      assert.deepEqual(await run((read) => read === 4 ? sample : base), { reads: 11, error: undefined })
    }
  })
  await t.test("running finite descendant or ancestor motion resets even with equal rectangles", async () => {
    for (const key of ["animations", "ancestorAnimations"]) {
      assert.deepEqual(await run((read) => read === 4 ? { [key]: [motion(1)] } : base), { reads: 11, error: undefined })
      assert.deepEqual(await run(() => ({ [key]: [motion(Infinity), motion(1, "finished")] })), { reads: 7, error: undefined })
    }
  })
  await t.test("persistent drift, missing card, and finite motion fail within the same bounded budget", async () => {
    for (const sampleAt of [
      (read) => ({ box: { ...base.box, width: base.box.width + read } }),
      () => ({ cardMissing: true }),
      () => ({ animations: [motion(1)] }),
    ]) {
      const result = await run(sampleAt)
      assert.equal(result.reads, 151)
      assert.match(result.error?.message ?? "", /exhausted its bounded poll/)
    }
  })
  await t.test("unexpected DOM evaluation errors are not treated as transient readiness", async () => {
    const defect = new Error("deliberate DOM evaluation defect")
    const result = await run(() => ({ error: defect }))
    assert.equal(result.reads, 1)
    assert.equal(result.error, defect)
  })
})

test("Atmosphere heading assertions distinguish accessible page and category levels without accepting hidden or duplicate owners", async (t) => {
  const { chromium, expect: browserExpect } = await import("@playwright/test")
  const ts = await import("typescript")
  const workspace = await readProjectFile("app/browse/workspace.tsx")
  const carousel = await readProjectFile("components/atmosphere/station-carousel.tsx")
  assert.match(workspace, /<h1 className="sr-only">\{ATMOSPHERE_PUBLIC_LABELS\.name\}<\/h1>/)
  assert.match(carousel, /title: ATMOSPHERE_PUBLIC_LABELS\.name,/)
  assert.match(carousel, /<h2 className="font-semibold tracking-normal">\{group\.title\}<\/h2>/)
  const assertions = []
  for (const [filename, count, level, matcher] of [
    ["app-shell.spec.ts", 1, 2, "toBeVisible"],
    ["music-visualizer.spec.ts", 2, 1, "toBeAttached"],
    ["background-commerce.spec.ts", 2, 1, "toBeAttached"],
    ["public-routes.spec.ts", 1, 1, "toBeAttached"],
    ["phase6-preview-rebrand.spec.ts", 1, 1, "toBeAttached"],
  ]) {
    const source = await readProjectFile(`tests/browser/${filename}`)
    const parsed = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
    let found = 0
    // Run each original assertion, not a re-created locator that could drift from Browser QA.
    const visit = (node) => {
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)
        && node.expression.name.text === "getByRole" && node.arguments[0]?.text === "heading"
        && node.arguments[1] && ts.isObjectLiteralExpression(node.arguments[1])) {
        const options = new Map(node.arguments[1].properties
          .filter(ts.isPropertyAssignment).map((property) => [property.name.getText(parsed), property.initializer]))
        if (options.get("name")?.text === "Atmosphere") {
          assert.equal(options.get("level")?.getText(parsed), String(level), filename)
          assert.equal(options.get("exact")?.getText(parsed), "true", filename)
          assert.equal(options.get("includeHidden")?.getText(parsed), "false", filename)
          let statement = node
          while (!ts.isExpressionStatement(statement)) {
            assert.ok(statement.parent, `${filename} heading must belong to an assertion statement`)
            statement = statement.parent
          }
          assert.ok(ts.isAwaitExpression(statement.expression), filename)
          assert.equal(statement.expression.expression.expression?.name?.text, matcher, filename)
          const assertionSource = statement.getText(parsed)
          assert.doesNotMatch(assertionSource, /\.first\(|\.nth\(/)
          const sandbox = { expect: browserExpect.configure({ timeout: 500 }) }
          runInNewContext(ts.transpileModule(`async function checkHeading(page) { ${assertionSource} }`, {
            compilerOptions: { target: ts.ScriptTarget.ES2022 },
          }).outputText, sandbox)
          assertions.push({ name: `${filename} assertion ${++found}`, level, matcher, run: sandbox.checkHeading })
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(parsed)
    assert.equal(found, count, `${filename} must exercise every current Atmosphere heading assertion`)
  }
  const browser = await chromium.launch()
  let requests = 0
  try {
    const pageHeading = '<h1 class="sr-only">Atmosphere</h1>'
    const categoryHeading = '<h2>Atmosphere</h2>'
    const both = pageHeading + categoryHeading
    for (const assertion of assertions) {
      await t.test(assertion.name, async (t) => {
        const intended = assertion.level === 1 ? pageHeading : categoryHeading
        const other = assertion.level === 1 ? categoryHeading : pageHeading
        for (const [name, content, failure] of [
          ["accessible page and category headings", both],
          ["hidden attribute clones", both + `<div hidden>${both}</div>`],
          ["display-none clones", both + `<div style="display:none">${both}</div>`],
          ["aria-hidden clones", both + `<div aria-hidden="true">${both}</div>`],
          ["duplicate accessible intended level", both + intended, /strict mode violation/],
          ["missing intended level", other, new RegExp(assertion.matcher)],
          ["hidden-only intended level", other + `<div hidden>${intended}</div>`, new RegExp(assertion.matcher)],
        ]) {
          await t.test(name, async () => {
            const context = await browser.newContext({ serviceWorkers: "block" })
            try {
              await context.route("**/*", async (route) => { requests += 1; await route.abort() })
              const page = await context.newPage()
              // Standard sr-only geometry clips paint without hiding the heading from accessibility.
              await page.setContent(`<style>.sr-only {
                position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
                overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0;
              }</style>${content}`)
              if (failure) await assert.rejects(assertion.run(page), failure)
              else await assertion.run(page)
            } finally {
              await context.close()
            }
          })
        }
      })
    }
  } finally {
    await browser.close()
    assert.equal(requests, 0, "heading readiness fixtures must remain completely offline")
  }
})
