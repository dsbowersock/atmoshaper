import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { runInNewContext } from "node:vm"
import { setTimeout as delay } from "node:timers/promises"

import ts from "typescript"

const projectFile = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8")
const compile = (source) => ts.transpileModule(source, {
  compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText

function declaration(sourceFile, name) {
  const matches = sourceFile.statements.filter((node) => (
    ts.isFunctionDeclaration(node) && node.name?.text === name
  ))
  assert.equal(matches.length, 1, `one actual ${name} declaration`)
  return matches[0].getText(sourceFile)
}

async function actualBrowserModules() {
  const definitions = [
    ["react", "node_modules/react/cjs/react.production.js", false],
    ["react/jsx-runtime", "node_modules/react/cjs/react-jsx-runtime.production.js", false],
    ["scheduler", "node_modules/scheduler/cjs/scheduler.production.js", false],
    ["react-dom", "node_modules/react-dom/cjs/react-dom.production.js", false],
    ["react-dom/client", "node_modules/react-dom/cjs/react-dom-client.production.js", false],
    ["metal-fx", "node_modules/metal-fx/dist/index.es.js", true],
    ["owner", "components/ui/metal-attention-button.tsx", true],
  ]
  const modules = await Promise.all(definitions.map(async ([name, path, transpile]) => {
    const source = await projectFile(path)
    return [name, transpile ? compile(source) : source]
  }))
  const shellSource = await projectFile("components/shell/app-tool-link.tsx")
  const shellTree = ts.createSourceFile(
    "app-tool-link.tsx", shellSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX,
  )
  const wrapper = declaration(shellTree, "ActiveToolMetalRing")
  modules.push(["shell", compile(`
    import { useLayoutEffect, useRef, useState } from "react"
    import { flushSync } from "react-dom"
    import { MetalAttentionRing } from "owner"
    ${wrapper}
    export { ActiveToolMetalRing }
  `)])
  return modules
}

async function actualCaptureHelpers(browserExpect) {
  const source = await projectFile("tests/browser/phase6-preview-rebrand.spec.ts")
  const tree = ts.createSourceFile(
    "phase6-preview-rebrand.spec.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS,
  )
  const names = [
    "installMusicRingCaptureClock",
    "expectMusicDocumentReady",
    "sampleMusicRingPaint",
    "prepareMusicRingCapture",
  ]
  const sandbox = { expect: browserExpect.configure({ timeout: 1_000 }) }
  runInNewContext(compile(`
    ${names.map((name) => declaration(tree, name)).join("\n")}
    globalThis.__ringCapture = { ${names.join(", ")} }
  `), sandbox)
  return { helpers: sandbox.__ringCapture, sandbox }
}

const fixtureHtml = `<!doctype html>
  <html class="dark">
    <head>
      <style>
        body { margin: 0; background: #25292b; }
        .ml-app-tool-link-active-ring-probe { display: inline-flex; }
        .ml-metal-attention-root {
          display: inline-flex !important;
          width: 44px !important;
          height: 44px !important;
          opacity: 1 !important;
        }
        .metal-fx-canvas { opacity: .72 !important; }
        .metal-fx-content { display: inline-flex; }
        a {
          width: 44px;
          height: 44px;
          border-radius: 12.48px;
          display: grid;
          place-items: center;
          color: white;
          background: #2e3335;
        }
      </style>
    </head>
    <body>
      <h1>Atmosphere</h1>
      <section aria-label="Atmosphere audio stations" data-music-storage-status="available"></section>
      <div id="root"></div>
    </body>
  </html>`

async function loadActualOwners(page, modules) {
  await page.evaluate((compiledModules) => {
    const registry = {
      "@/components/ui/button": { Button: () => null },
      "@/lib/utils": { cn: (...values) => values.filter(Boolean).join(" ") },
    }
    const requireModule = (name) => {
      if (!registry[name]) throw new Error(`Unexpected ring dependency: ${name}`)
      return registry[name]
    }
    for (const [name, code] of compiledModules) {
      const loadedModule = { exports: {} }
      new Function("exports", "module", "require", code)(
        loadedModule.exports, loadedModule, requireModule,
      )
      registry[name] = loadedModule.exports
    }
    window.__phase6RingModules = registry
  }, modules)
}

async function mountActualOwner(page, count = 1) {
  await page.evaluate((ownerCount) => {
    const modules = window.__phase6RingModules
    const React = modules.react
    const children = Array.from({ length: ownerCount }, (_, index) => (
      React.createElement(modules.shell.ActiveToolMetalRing, { key: index },
        React.createElement("a", { "aria-label": "Open music", href: "#" },
          React.createElement("svg", {
            "aria-hidden": "true", height: 16, viewBox: "0 0 24 24", width: 16,
          }, React.createElement("path", {
            d: "M9 18V5l12-2v13M9 18a3 3 0 1 1-3-3c1.6 0 3 1.3 3 3z",
            fill: "none",
            stroke: "currentColor",
          })),
        ),
      )
    ))
    window.__phase6RingRoot = modules["react-dom/client"].createRoot(document.getElementById("root"))
    modules["react-dom"].flushSync(() => {
      window.__phase6RingRoot.render(React.createElement(React.Fragment, null, ...children))
    })
  }, count)
}

async function paintSample(page) {
  return page.locator("canvas.metal-fx-canvas").evaluate((canvas) => {
    const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data
    return {
      dataUrl: canvas.toDataURL(),
      height: canvas.height,
      nontransparentPixels: pixels.reduce((count, value, index) => (
        index % 4 === 3 && value > 0 ? count + 1 : count
      ), 0),
      opacity: getComputedStyle(canvas).opacity,
      performanceMs: performance.now(),
      width: canvas.width,
    }
  })
}

const hashPaint = (dataUrl) => createHash("sha256").update(dataUrl).digest("hex")

test("Phase 6 ring capture fixes the paused first frame without replacing actual owners", async (t) => {
  const [{ chromium, devices, expect: browserExpect }, modules] = await Promise.all([
    import("@playwright/test"),
    actualBrowserModules(),
  ])
  const { helpers, sandbox } = await actualCaptureHelpers(browserExpect)
  const browser = await chromium.launch()
  let requests = 0

  const openFixture = async (reducedMotion = "reduce") => {
    const context = await browser.newContext({
      ...devices["Pixel 7"],
      reducedMotion,
      serviceWorkers: "block",
    })
    await context.route("**/*", async (route) => {
      requests += 1
      await route.abort()
    })
    const page = await context.newPage()
    await page.setContent(fixtureHtml)
    return { context, page }
  }

  const controlledCapture = async ({
    blankFirstPaint = false,
    mountCount = 1,
    reducedMotion = "reduce",
    startupDelayMs = 0,
  } = {}) => {
    const { context, page } = await openFixture(reducedMotion)
    try {
      await helpers.installMusicRingCaptureClock(page)
      let postNavigationPerformanceMs
      sandbox.gotoReady = async (actualPage, path) => {
        assert.equal(path, "/music")
        assert.ok(actualPage.locator("body"))
        await page.goto(`data:text/html;charset=utf-8,${encodeURIComponent(fixtureHtml)}`)
        postNavigationPerformanceMs = await page.evaluate(() => performance.now())
        if (startupDelayMs > 0) await delay(startupDelayMs)
        await loadActualOwners(page, modules)
        await mountActualOwner(page, mountCount)
      }
      let helperPage = page
      if (blankFirstPaint) {
        let frameSteps = 0
        const clock = new Proxy(page.clock, {
          get(target, property) {
            if (property !== "runFor") {
              const value = target[property]
              return typeof value === "function" ? value.bind(target) : value
            }
            return async (milliseconds) => {
              await target.runFor(milliseconds)
              frameSteps += 1
              if (frameSteps === 2) {
                await page.locator("canvas.metal-fx-canvas").evaluate((canvas) => {
                  canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height)
                })
              }
            }
          },
        })
        helperPage = new Proxy(page, {
          get(target, property) {
            if (property === "clock") return clock
            const value = target[property]
            return typeof value === "function" ? value.bind(target) : value
          },
        })
      }
      const capture = await helpers.prepareMusicRingCapture(helperPage)
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)))
      return {
        capture,
        postNavigationPerformanceMs,
        resumed: await paintSample(page),
      }
    } finally {
      await context.close()
    }
  }

  const variablePhaseCapture = async (firstPaintStepMs) => {
    const { context, page } = await openFixture()
    try {
      await page.clock.install({ time: new Date("2026-09-19T12:00:00.000Z") })
      await loadActualOwners(page, modules)
      await page.clock.pauseAt(new Date("2026-09-19T12:01:00.000Z"))
      await mountActualOwner(page)
      const probe = page.locator(".ml-app-tool-link-active-ring-probe:visible")
      await browserExpect(probe).toHaveCount(1)
      assert.ok((await probe.boundingBox()).width >= 3)
      await browserExpect(page.locator("canvas.metal-fx-canvas")).toHaveCount(0)
      await page.clock.runFor(16)
      await browserExpect(page.locator("canvas.metal-fx-canvas")).toHaveCount(0)
      await page.clock.runFor(16)
      const ring = page.locator(".ml-app-tool-link-active-ring")
      await browserExpect(ring).toHaveAttribute("data-paused", "true")
      const before = await paintSample(page)
      assert.equal(before.nontransparentPixels, 0)
      // Jump once so the renderer's pending first RAF observes this exact
      // elapsed phase; runFor would synthesize every intermediate frame.
      await page.clock.fastForward(firstPaintStepMs)
      const first = await paintSample(page)
      assert.ok(first.nontransparentPixels > 0)
      return first
    } finally {
      await context.close()
    }
  }

  try {
    await t.test("the demonstrated 16ms and 149ms first frames have different phases", async () => {
      const frame16 = await variablePhaseCapture(16)
      const frame149 = await variablePhaseCapture(149)
      assert.notEqual(hashPaint(frame16.dataUrl), hashPaint(frame149.dataUrl))
    })

    await t.test("fixed capture stays identical across real startup delays and after clock resume", async () => {
      const captures = []
      for (const startupDelayMs of [0, 149, 0, 149]) {
        captures.push(await controlledCapture({ startupDelayMs }))
      }
      const firstHash = hashPaint(captures[0].capture.firstPaint)
      for (const result of captures) {
        assert.ok(result.postNavigationPerformanceMs < 1_000,
          "real new-document navigation must exercise the performance clock reset")
        assert.equal(hashPaint(result.capture.firstPaint), firstHash)
        assert.equal(result.capture.retainedPaint, result.capture.firstPaint)
        assert.equal(result.resumed.dataUrl, result.capture.firstPaint)
        assert.ok(result.resumed.nontransparentPixels > 0)
        assert.equal(result.resumed.opacity, "0.72")
      }
    })

    for (const [name, options, failure] of [
      ["missing owner", { mountCount: 0 }, /toHaveCount/],
      ["duplicate owner", { mountCount: 2 }, /toHaveCount/],
      ["blank first paint", { blankFirstPaint: true }, /toBeGreaterThan/],
      ["owner that is not paused", { reducedMotion: "no-preference" }, /toHaveAttribute/],
    ]) {
      await t.test(`critical ${name} still fails`, async () => {
        await assert.rejects(controlledCapture(options), failure)
      })
    }
  } finally {
    await browser.close()
    assert.equal(requests, 0, "actual-owner ring capture contract must remain completely offline")
  }
})
