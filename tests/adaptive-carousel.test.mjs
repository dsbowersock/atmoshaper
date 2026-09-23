import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"
import ts from "typescript"
import {
  BACKGROUND_CAROUSEL_BASE_TUNING,
  STATION_CAROUSEL_TUNING,
  createAdaptiveCarouselLoopBuffer,
  getAdaptiveCarouselPresentationProgress,
  getAdaptiveCarouselPresentationVariables,
  getMountedAdaptiveCarouselItemIds,
  getResponsiveBackgroundCarouselTuning,
  getResponsiveStationCarouselTuning,
  resolveResponsiveStationCarouselLayout,
  resolveEffectiveCarouselLoop,
  resolveAdaptiveCarouselViewportProfile,
} from "../components/carousels/adaptive-carousel-model.js"

const items = ["a", "b", "c", "d", "e", "f", "g"].map((id) => ({ id }))
const nineItems = [...items, { id: "h" }, { id: "i" }]
const stageStyles = readFileSync(
  new URL("../components/carousels/adaptive-carousel-stage.module.css", import.meta.url),
  "utf8",
)
const stageSource = readFileSync(
  new URL("../components/carousels/adaptive-carousel-stage.tsx", import.meta.url),
  "utf8",
)
const controllerSource = readFileSync(
  new URL("../components/carousels/use-adaptive-carousel-controller.ts", import.meta.url),
  "utf8",
)
const backgroundCarouselSource = readFileSync(
  new URL("../components/backgrounds/background-carousel.tsx", import.meta.url),
  "utf8",
)
const backgroundControlTraySource = readFileSync(
  new URL("../components/backgrounds/background-carousel-control-tray.tsx", import.meta.url),
  "utf8",
)
const stationCarouselSource = readFileSync(
  new URL("../components/atmosphere/station-carousel.tsx", import.meta.url),
  "utf8",
)

describe("production adaptive carousel", () => {
  it("uses documented fallback dimensions for non-positive Station measurements", () => {
    assert.deepEqual(
      getResponsiveStationCarouselTuning({
        containerWidth: 0,
        containerHeight: -1,
        constrainedLandscape: false,
      }),
      getResponsiveStationCarouselTuning({
        containerWidth: 740,
        containerHeight: 224,
        constrainedLandscape: false,
      }),
    )
  })

  it("stabilizes real subpixel Station measurements in both orders and repeated feedback", () => {
    const dimensions = [590.4, 590.9].map((containerHeight) => ({
      containerWidth: 1000, containerHeight, constrainedLandscape: false,
    }))
    const tunings = dimensions.map(getResponsiveStationCarouselTuning)
    assert.deepEqual(tunings.map(({ cardWidth, cardHeight }) => [cardWidth, cardHeight]), [
      [235, 275], [236, 275],
    ])
    for (const order of [dimensions, [...dimensions].reverse()]) {
      let layout = { ...order[0], tuning: getResponsiveStationCarouselTuning(order[0]) }
      for (const measurement of [...order.slice(1), ...dimensions, ...dimensions]) {
        layout = resolveResponsiveStationCarouselLayout(layout, measurement)
        assert.deepEqual(layout.tuning, tunings[0])
      }
      assert.equal(resolveResponsiveStationCarouselLayout(layout, order[0]), layout)
    }
  })

  it("resolves equal-card Station perspective and spread ties in both orders", () => {
    const pairs = [
      [{ containerWidth: 1000, containerHeight: 590.38 }, { containerWidth: 1000, containerHeight: 590.88 }],
      [{ containerWidth: 699.8, containerHeight: 600 }, { containerWidth: 700.2, containerHeight: 600 }],
    ]
    for (const pair of pairs) {
      const dimensions = pair.map((size) => ({ ...size, constrainedLandscape: false }))
      const [smaller, larger] = dimensions.map(getResponsiveStationCarouselTuning)
      assert.deepEqual([smaller.cardWidth, smaller.cardHeight], [larger.cardWidth, larger.cardHeight])
      assert.notDeepEqual(smaller, larger)
      for (const order of [dimensions, [...dimensions].reverse()]) {
        const layout = resolveResponsiveStationCarouselLayout({
          ...order[0], tuning: getResponsiveStationCarouselTuning(order[0]),
        }, order[1])
        assert.deepEqual(layout.tuning, smaller)
      }
    }
  })

  it("keeps admitted Station feedback within the smaller measured fit footprint", () => {
    // The larger real tuning needs 543.1px, exceeding the 543.05px stage:
    // the getter's 2px buffer alone cannot justify choosing the larger member.
    const dimensions = [543.05, 544.04].map((containerHeight) => ({
      containerWidth: 1000, containerHeight, constrainedLandscape: false,
    }))
    const [smaller, larger] = dimensions.map(getResponsiveStationCarouselTuning)
    const footprint = (tuning) => tuning.cardHeight + tuning.cardWidth * 1.3 + 8
    assert.deepEqual([smaller.cardWidth, smaller.cardHeight], [216, 252])
    assert.deepEqual([larger.cardWidth, larger.cardHeight], [217, 253])
    assert.ok(footprint(larger) > dimensions[0].containerHeight)
    for (const order of [dimensions, [...dimensions].reverse()]) {
      const layout = resolveResponsiveStationCarouselLayout({
        ...order[0], tuning: getResponsiveStationCarouselTuning(order[0]),
      }, order[1])
      assert.deepEqual(layout.tuning, smaller)
      assert.ok(footprint(layout.tuning) <= dimensions[0].containerHeight)
    }
  })

  it("accepts genuine Station resizes, accumulated drift, and constrained measurements", () => {
    const base = { containerWidth: 1000, containerHeight: 590.4, constrainedLandscape: false }
    const current = { ...base, tuning: getResponsiveStationCarouselTuning(base) }
    assert.equal(resolveResponsiveStationCarouselLayout(current, { ...base, containerHeight: 590.9 }), current)
    for (const measurement of [
      { ...base, containerHeight: 591.4 },
      { ...base, containerHeight: 589.4 },
      { ...base, containerWidth: 1001 },
      { ...base, containerHeight: 800 },
      { ...base, constrainedLandscape: true },
    ]) {
      const next = resolveResponsiveStationCarouselLayout(current, measurement)
      assert.deepEqual(next, {
        containerWidth: measurement.containerWidth,
        containerHeight: measurement.containerHeight,
        tuning: getResponsiveStationCarouselTuning(measurement),
      })
      assert.notEqual(next, current)
    }
    // These previously hand-written 242/243px fixtures bypass the production
    // guard: the actual heights differ by 3px and card heights differ by 2px.
    const dimensions = [606.4, 609.4].map((containerHeight) => ({ ...base, containerHeight }))
    assert.deepEqual(dimensions.map(getResponsiveStationCarouselTuning)
      .map(({ cardWidth, cardHeight }) => [cardWidth, cardHeight]), [[242, 282], [243, 284]])
    for (const order of [dimensions, [...dimensions].reverse()]) {
      const next = resolveResponsiveStationCarouselLayout({
        ...order[0], tuning: getResponsiveStationCarouselTuning(order[0]),
      }, order[1])
      assert.deepEqual(next.tuning, getResponsiveStationCarouselTuning(order[1]))
    }
  })

  it("routes real Station observer deliveries through the responsive transition", () => {
    const ast = ts.createSourceFile("station-carousel.tsx", stationCarouselSource,
      ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const effects = []
    function visit(node) {
      if (ts.isCallExpression(node) && node.expression.getText(ast) === "useEffect"
        && node.arguments[0]?.getText(ast).includes("stageRef.current")) effects.push(node)
      ts.forEachChild(node, visit)
    }
    visit(ast)
    assert.equal(effects.length, 1)
    const compiled = ts.transpileModule(effects[0].getText(ast), {
      compilerOptions: { target: ts.ScriptTarget.ES2022 },
    }).outputText
    for (const heights of [[590.4, 590.9], [590.9, 590.4]]) {
      let callback, cleanup, observed, disconnected = false
      const stage = {}
      let layout = { containerWidth: 0, containerHeight: 0,
        tuning: getResponsiveStationCarouselTuning({ containerWidth: 0, containerHeight: 0, constrainedLandscape: false }) }
      const Observer = class {
        constructor(listener) { callback = listener }
        observe(node) { observed = node }
        disconnect() { disconnected = true }
      }
      // Execute the actual effect so this test covers its observer wiring as
      // well as the shared transition, without duplicating production guards.
      new Function("useEffect", "stageRef", "ResizeObserver", "setResponsiveLayout",
        "resolveResponsiveStationCarouselLayout", "constrainedLandscape", "group", "stationItems", compiled)(
        (effect) => { cleanup = effect() }, { current: stage }, Observer,
        (update) => { layout = update(layout) }, resolveResponsiveStationCarouselLayout,
        false, { id: "stations" }, [1])
      assert.equal(observed, stage)
      callback([])
      assert.equal(layout.containerHeight, 0)
      for (const height of [...heights, ...heights]) callback([{ contentRect: { width: 1000, height } }])
      assert.deepEqual(layout.tuning, getResponsiveStationCarouselTuning({
        containerWidth: 1000, containerHeight: 590.4, constrainedLandscape: false,
      }))
      cleanup()
      assert.equal(disconnected, true)
    }
  })

  it("uses three Background renderers only in short landscape", () => {
    const cases = [
      [{ containerWidth: 479, viewportWidth: 390, viewportHeight: 844 }, "phone-portrait", 164, 312, 22, 2],
      [{ containerWidth: 1000, viewportWidth: 844, viewportHeight: 480 }, "short-landscape", 200, 240, 26, 1],
      [{ containerWidth: 759, viewportWidth: 779, viewportHeight: 1121 }, "tablet", 220, 304, 29, 2],
      [{ containerWidth: 760, viewportWidth: 1365, viewportHeight: 820 }, "compact-desktop", 256, 360, 33, 2],
      [{ containerWidth: 960, viewportWidth: 1121, viewportHeight: 779 }, "wide-landscape", 280, 388, 36, 2],
    ]

    assert.equal(BACKGROUND_CAROUSEL_BASE_TUNING.visibleRadius, 2)
    for (const [dimensions, expectedProfile, cardWidth, cardHeight, spread, visibleRadius] of cases) {
      const profile = resolveAdaptiveCarouselViewportProfile(dimensions)
      const tuning = getResponsiveBackgroundCarouselTuning(profile)
      assert.equal(profile, expectedProfile)
      assert.equal(tuning.cardWidth, cardWidth)
      assert.equal(tuning.cardHeight, cardHeight)
      assert.equal(tuning.spread, spread)
      assert.equal(tuning.visibleRadius, visibleRadius)
      assert.equal(tuning.radius, 420)
      assert.equal(tuning.scaleFalloff, 0.08)
    }
  })

  it("offers typed custom controls while retaining default navigation", () => {
    assert.match(stageSource, /export interface AdaptiveCarouselControlState/)
    assert.match(stageSource, /renderControls\?: \(state: AdaptiveCarouselControlState\) => ReactNode/)
    assert.match(stageSource, /customControlsVisible\?: boolean/)
    assert.match(stageSource, /customControlsVisible = true/)
    assert.match(
      stageSource,
      /renderControls && customControlsVisible[\s\S]*\? renderControls\(controlState\)[\s\S]*: !renderControls[\s\S]*\? defaultNavigation[\s\S]*: null/,
    )
    assert.match(stageSource, /data-has-custom-controls=/)
    assert.match(
      stageSource,
      /data-station-carousel-controls=\{stationControlsVisible && viewportProfile === "music-fit"/,
    )
    assert.match(
      stageSource,
      /const stationControlsVisible = surface === "stations"[\s\S]*Boolean\(renderControls\)[\s\S]*customControlsVisible/,
    )
    assert.doesNotMatch(stageSource, /data-carousel-controls="true"/)
  })

  it("keeps the Music baseline stable and bounds Background media to five cards", () => {
    assert.deepEqual(STATION_CAROUSEL_TUNING, {
      cardWidth: 192,
      cardHeight: 224,
      gap: 0,
      visibleRadius: 4,
      loop: true,
      motion: true,
      spread: 27,
      radius: 420,
      perspective: 900,
      scaleFalloff: 0.05,
    })
    assert.deepEqual(
      [...getMountedAdaptiveCarouselItemIds(items, "d", 2, true)],
      ["b", "c", "d", "e", "f"],
    )
  })

  it("preserves the approved fixed Station composition in constrained landscape", () => {
    assert.deepEqual(
      getResponsiveStationCarouselTuning({
        containerWidth: 556,
        containerHeight: 246,
        constrainedLandscape: true,
      }),
      {
        ...STATION_CAROUSEL_TUNING,
        cardWidth: 192,
        cardHeight: 224,
        visibleRadius: 4,
      },
    )
  })

  it("keeps constrained-landscape stations on the approved fixed baseline", () => {
    const landscape = getResponsiveStationCarouselTuning({
      containerWidth: 556,
      containerHeight: 246,
      constrainedLandscape: true,
    })
    assert.deepEqual(
      { width: landscape.cardWidth, height: landscape.cardHeight },
      { width: 192, height: 224 },
    )

    const portrait = getResponsiveStationCarouselTuning({
      containerWidth: 556,
      containerHeight: 246,
      constrainedLandscape: false,
    })
    assert.equal(portrait.cardHeight, 224)
  })

  it("compresses only the medium-width Station wing sweep", () => {
    const medium = getResponsiveStationCarouselTuning({
      containerWidth: 650,
      containerHeight: 420,
      constrainedLandscape: false,
    })
    const roomy = getResponsiveStationCarouselTuning({
      containerWidth: 740,
      containerHeight: 246,
      constrainedLandscape: true,
    })
    const constrained = getResponsiveStationCarouselTuning({
      containerWidth: 556,
      containerHeight: 246,
      constrainedLandscape: true,
    })
    assert.equal(medium.spread, 20)
    assert.equal(roomy.spread, STATION_CAROUSEL_TUNING.spread)
    assert.equal(constrained.spread, STATION_CAROUSEL_TUNING.spread)
  })

  it("keeps portrait cards fixed across stage and player-rail changes", () => {
    const expanded = getResponsiveStationCarouselTuning({
      containerWidth: 556,
      containerHeight: 246,
      constrainedLandscape: false,
    })
    const collapsed = getResponsiveStationCarouselTuning({
      containerWidth: 556,
      containerHeight: 412,
      constrainedLandscape: false,
    })
    assert.deepEqual(
      { width: expanded.cardWidth, height: expanded.cardHeight },
      { width: 192, height: 224 },
    )
    assert.deepEqual(
      { width: collapsed.cardWidth, height: collapsed.cardHeight },
      { width: 192, height: 224 },
    )

    const narrow = getResponsiveStationCarouselTuning({
      containerWidth: 420,
      containerHeight: 210,
      constrainedLandscape: false,
    })
    assert.equal(narrow.cardWidth, 192)
    assert.equal(narrow.cardHeight, 224)
  })

  it("uses measured phone and tablet room without changing the approved endpoints", () => {
    const iphoneSe = getResponsiveStationCarouselTuning({
      containerWidth: 375,
      containerHeight: 800,
      constrainedLandscape: false,
    })
    const galaxyS24 = getResponsiveStationCarouselTuning({
      containerWidth: 384,
      containerHeight: 800,
      constrainedLandscape: false,
    })
    const pixel8 = getResponsiveStationCarouselTuning({
      containerWidth: 412,
      containerHeight: 800,
      constrainedLandscape: false,
    })
    const iphone15ProMax = getResponsiveStationCarouselTuning({
      containerWidth: 430,
      containerHeight: 800,
      constrainedLandscape: false,
    })
    const tallTablet = getResponsiveStationCarouselTuning({
      containerWidth: 768,
      containerHeight: 1200,
      constrainedLandscape: false,
    })
    const rotated4k = getResponsiveStationCarouselTuning({
      containerWidth: 1368,
      containerHeight: 2300,
      constrainedLandscape: false,
    })
    const heightLimitedSurfaceDuo = getResponsiveStationCarouselTuning({
      containerWidth: 540,
      containerHeight: 500,
      constrainedLandscape: false,
    })

    assert.equal(iphoneSe.cardWidth, STATION_CAROUSEL_TUNING.cardWidth)
    assert.ok(galaxyS24.cardWidth > iphoneSe.cardWidth)
    assert.ok(pixel8.cardWidth > galaxyS24.cardWidth)
    assert.ok(iphone15ProMax.cardWidth > pixel8.cardWidth)
    assert.ok(tallTablet.cardWidth >= 380 && tallTablet.cardWidth <= 390)
    assert.equal(rotated4k.cardWidth, 480)
    assert.ok(heightLimitedSurfaceDuo.cardWidth <= 200)
  })

  it("fluidly scales the complete Station composition on laptop and TV-sized stages", () => {
    const laptop = getResponsiveStationCarouselTuning({
      containerWidth: 1368,
      containerHeight: 800,
      constrainedLandscape: false,
    })
    assert.deepEqual(
      { width: laptop.cardWidth, height: laptop.cardHeight },
      { width: 274, height: 319 },
    )
    assert.equal(laptop.radius, 599)
    assert.equal(laptop.perspective, 1283)

    const television = getResponsiveStationCarouselTuning({
      containerWidth: 2488,
      containerHeight: 1400,
      constrainedLandscape: false,
    })
    assert.deepEqual(
      { width: television.cardWidth, height: television.cardHeight },
      { width: 480, height: 560 },
    )
    assert.equal(television.radius, 1050)
    assert.equal(television.perspective, 2250)

    const shortTelevisionStage = getResponsiveStationCarouselTuning({
      containerWidth: 2488,
      containerHeight: 800,
      constrainedLandscape: false,
    })
    assert.ok(shortTelevisionStage.cardWidth < television.cardWidth)
    assert.ok(
      shortTelevisionStage.cardHeight + shortTelevisionStage.cardWidth * 1.3 + 8 <= 801,
    )
  })

  it("keeps station looping independent from static reduced-motion presentation", () => {
    assert.equal(resolveEffectiveCarouselLoop(7, 1, true), true)
    assert.match(controllerSource, /surface === "stations"[\s\S]*resolveEffectiveCarouselLoop/)
    assert.match(controllerSource, /duration: staticPresentation \? 0 : 45/)
    assert.doesNotMatch(controllerSource, /const finiteRail = reducedMotion \|\| tuning\.motion === false/)
  })

  it("scales the approved Station ratio down only when constrained height requires it", () => {
    const tuning = getResponsiveStationCarouselTuning({
      containerWidth: 420,
      containerHeight: 210,
      constrainedLandscape: true,
    })
    assert.equal(tuning.cardWidth, 180)
    assert.equal(tuning.cardHeight, 210)
    assert.equal(tuning.visibleRadius, 4)

    const severeHeight = getResponsiveStationCarouselTuning({
      containerWidth: 360,
      containerHeight: 96,
      constrainedLandscape: true,
    })
    assert.equal(
      severeHeight.cardWidth,
      Math.round(96 * STATION_CAROUSEL_TUNING.cardWidth / STATION_CAROUSEL_TUNING.cardHeight),
    )
    assert.equal(severeHeight.cardHeight, 96)
    assert.equal(severeHeight.visibleRadius, 4)
  })

  it("owns live station capability and constrained-landscape media queries without touch heuristics", () => {
    assert.match(stationCarouselSource, /window\.matchMedia\("\(prefers-reduced-motion: reduce\)"\)/)
    assert.match(
      stationCarouselSource,
      /window\.matchMedia\("\(any-hover: hover\) and \(any-pointer: fine\)"\)/,
    )
    assert.match(
      stationCarouselSource,
      /window\.matchMedia\([\s\S]*"\(orientation: landscape\) and \(max-width: 60rem\) and \(max-height: 31\.25rem\)"/,
    )
    assert.match(stationCarouselSource, /const showStationControls = reducedMotion \|\| hasFineHoverPointer/)
    assert.match(stationCarouselSource, /customControlsVisible=\{showStationControls\}/)
    assert.match(
      stationCarouselSource,
      /resolveResponsiveStationCarouselLayout\(current, \{[\s\S]*?constrainedLandscape,?[\s\S]*?\}\)/,
    )
    assert.doesNotMatch(stationCarouselSource, /maxTouchPoints/)
  })

  it("offers one tray-owned Animated previews switch wired to the saved preference", () => {
    const switchContract = 'label="Animated previews"'

    assert.equal(
      backgroundControlTraySource.split(switchContract).length - 1,
      1,
      "the Background control tray renders exactly one Animated previews switch",
    )
    assert.match(backgroundControlTraySource, /checked=\{previewPreferenceEnabled\}/)
    assert.match(backgroundControlTraySource, /onCheckedChange=\{onPreviewPreferenceChange\}/)
    assert.match(backgroundCarouselSource, /<BackgroundCarouselControlTray[\s\S]*previewPreferenceEnabled=\{previewPreferenceEnabled\}/)
    assert.match(backgroundCarouselSource, /onPreviewPreferenceChange=\{handlePreviewPreferenceChange\}/)
    assert.match(backgroundCarouselSource, /preferenceHydrated && previewPreferenceEnabled && active && !reducedMotion/)
    assert.match(backgroundCarouselSource, /readBackgroundPreviewPreference\(\(\) => window\.localStorage\)/)
    assert.match(backgroundCarouselSource, /writeBackgroundPreviewPreference\(\(\) => window\.localStorage, enabled\)/)
    assert.doesNotMatch(backgroundCarouselSource, /aria-pressed=\{previewPlaybackActive\}/)
  })

  it("bounds non-looping renderers at the collection edges", () => {
    assert.deepEqual(
      [...getMountedAdaptiveCarouselItemIds(items.slice(0, 3), "a", 2, false)],
      ["a", "b", "c"],
    )
  })

  it("normalizes looped indexes when the radius exceeds the item count", () => {
    const mountedIds = getMountedAdaptiveCarouselItemIds(items.slice(0, 3), "a", 4, true)
    assert.deepEqual([...mountedIds].sort(), ["a", "b", "c"])
  })

  it("buffers equal unique Station neighbors on both sides of the real collection", () => {
    const buffered = createAdaptiveCarouselLoopBuffer(nineItems, 4, true)
    assert.equal(buffered.length, 17)
    assert.equal(new Set(buffered.map(({ id }) => id)).size, buffered.length)
    assert.deepEqual(
      buffered.slice(0, 4).map(({ canonicalId }) => canonicalId),
      ["f", "g", "h", "i"],
    )
    assert.deepEqual(
      buffered.slice(-4).map(({ canonicalId }) => canonicalId),
      ["a", "b", "c", "d"],
    )
    assert.deepEqual(
      buffered.slice(4, 13).map(({ canonicalId, loopClone }) => ({ canonicalId, loopClone })),
      nineItems.map(({ id }) => ({ canonicalId: id, loopClone: false })),
    )

    const sevenStationBuffer = createAdaptiveCarouselLoopBuffer(items, 4, true)
    assert.equal(sevenStationBuffer.length, 13)
    assert.equal(sevenStationBuffer.filter(({ loopClone }) => loopClone).length, 6)
    assert.strictEqual(createAdaptiveCarouselLoopBuffer(items, 4, false), items)
  })

  it("keeps buffered Station cards on the approved visual curve", () => {
    assert.equal(getAdaptiveCarouselPresentationProgress(4, 9, true), 32 / 9)
    assert.equal(getAdaptiveCarouselPresentationProgress(-4, 9, true), -32 / 9)
    assert.ok(
      Math.abs(getAdaptiveCarouselPresentationProgress(3, 7, true) - (18 / 7)) < 1e-12,
    )
    assert.equal(getAdaptiveCarouselPresentationProgress(4, 9, false), 4)

    const progress = 32 / 9
    const right = Number.parseFloat(getAdaptiveCarouselPresentationVariables(
      "background-picker",
      "stations",
      progress,
      STATION_CAROUSEL_TUNING,
      false,
      9,
    )["--carousel-x"])
    const left = Number.parseFloat(getAdaptiveCarouselPresentationVariables(
      "background-picker",
      "stations",
      -progress,
      STATION_CAROUSEL_TUNING,
      false,
      9,
    )["--carousel-x"])
    assert.ok(Math.abs(right + left) < 0.01)
    assert.ok(Math.abs(right) > 280)
  })

  it("uses the approved compact vertical padding for short Station and Background stages", () => {
    assert.match(
      stageStyles,
      /@media \(max-height: 44rem\)[\s\S]*data-surface="stations"[\s\S]*padding-block: 1\.553125rem[\s\S]*data-surface="backgrounds"[\s\S]*padding-block: 0\.4375rem/,
    )
  })
})
