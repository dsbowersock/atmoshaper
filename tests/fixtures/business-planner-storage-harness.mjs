import { createRequire } from "node:module"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const require = createRequire(import.meta.url)
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const fixtureUrl = "https://atmoshaper.test/business-planner-storage-fixture"

export const plannerKeys = {
  "break-even": "massagelab-business-planner-break-even-v1",
  "add-on-profit": "massagelab-business-planner-add-on-profit-v1",
  "service-menu": "massagelab-business-planner-service-menu-v1",
  "launch-checklist": "massagelab-business-planner-launch-checklist-v1",
  "plan-outline": "massagelab-business-planner-plan-outline-v1",
  income: "massagelab-business-income-planner-income-v1",
}

/** Bundles real clients/calculators; only Next navigation is replaced by a plain anchor. */
export async function buildPlannerFixture() {
  const fixture = mkdtempSync(path.join(tmpdir(), "atmoshaper-planner-storage-"))
  try {
    const loader = path.join(fixture, "typescript-loader.cjs")
    const link = path.join(fixture, "link.js")
    writeFileSync(loader, `const ts=require(${JSON.stringify(require.resolve("typescript"))});
      module.exports=function(source){return ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,
        module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020}}).outputText};`)
    writeFileSync(link, 'import React from "react"; export default function Link({href,children,...props}){return React.createElement("a",{...props,href},children)}')
    const webpack = require("next/dist/compiled/webpack/webpack").webpack
    await new Promise((resolve, reject) => {
      const compiler = webpack({
        mode: "development", devtool: false, context: projectRoot,
        entry: fileURLToPath(new URL("./business-planner-storage-entry.jsx", import.meta.url)),
        output: { path: path.join(fixture, "dist"), filename: "fixture.js" },
        resolve: {
          extensions: [".tsx", ".ts", ".jsx", ".js"],
          alias: { "@": projectRoot, "next/link$": link },
          modules: [path.join(projectRoot, "node_modules"), "node_modules"],
        },
        module: { rules: [{ test: /\.(?:tsx?|jsx)$/, exclude: /node_modules/, use: [{ loader }] }] },
      })
      compiler.run((error, stats) => compiler.close((closeError) => {
        if (error || closeError) return reject(error || closeError)
        if (stats.hasErrors()) return reject(new Error(stats.toString({ all: false, errors: true })))
        resolve()
      }))
    })
    return readFileSync(path.join(fixture, "dist/fixture.js"), "utf8")
  } finally {
    const resolved = path.resolve(fixture)
    if (path.dirname(resolved) !== path.resolve(tmpdir())
        || !path.basename(resolved).startsWith("atmoshaper-planner-storage-")) {
      throw new Error("Refusing to remove an unowned fixture path")
    }
    rmSync(resolved, { recursive: true, force: true })
  }
}

/** Opens a fresh, invented-data browser context; every request is fulfilled or aborted locally. */
export async function openPlannerFixture(browser, bundle, {
  planner = "break-even", mode = "available", seed, viewport,
  incomeProps = { isSignedIn: false, displayName: null, initialAccountPlanner: null },
} = {}) {
  const key = plannerKeys[planner]
  const context = await browser.newContext(viewport ? { viewport } : {})
  const requests = { account: [], blocked: [], pageErrors: [] }
  try {
    await context.route("**/*", (route) => {
      const request = route.request()
      if (request.url() === fixtureUrl && request.method() === "GET") {
        return route.fulfill({ status: 200, contentType: "text/html", body: '<!doctype html><html><body><div id="root"></div></body></html>' })
      }
      if (request.url() === new URL("/api/account/preferences", fixtureUrl).href
          && request.method() === "PUT") {
        requests.account.push(request.postDataJSON())
        return route.fulfill({ status: 200, contentType: "application/json", body: "{}" })
      }
      requests.blocked.push({ method: request.method(), unexpected: true })
      return route.abort()
    })
    const page = await context.newPage()
    page.on("pageerror", (error) => requests.pageErrors.push(error.name))
    await page.addInitScript((config) => {
      const nativeStorage = window.localStorage
      const unrelatedKey = "atmoshaper-planner-fixture-unrelated"
      nativeStorage.setItem(unrelatedKey, "preserve invented fixture")
      if (config.seed !== undefined) nativeStorage.setItem(config.key, config.seed)
      const harness = window.__businessPlannerFixture = {
        config, nativeStorage, unrelatedKey, committed: false, errors: [], writes: [], removals: [],
        allowReads: config.mode !== "read-denied",
        allowWrites: config.mode !== "quota",
        allowRemoval: config.mode !== "corrupt-remove-denied",
      }
      const storage = {
        /** Simulates denied reads only for the planner key, preserving unrelated fixture data. */
        getItem(storageKey) {
          if (storageKey === config.key && !harness.allowReads) throw new DOMException("Invented read failure", "SecurityError")
          return nativeStorage.getItem(storageKey)
        },
        /** Records successful writes and can inject the planner-only quota failure. */
        setItem(storageKey, value) {
          if (storageKey === config.key && !harness.allowWrites) throw new DOMException("Invented quota failure", "QuotaExceededError")
          harness.writes.push({ key: storageKey, value })
          nativeStorage.setItem(storageKey, value)
        },
        /** Models failed corrupt-draft cleanup without removing another key. */
        removeItem(storageKey) {
          if (storageKey === config.key && !harness.allowRemoval) throw new DOMException("Invented removal failure", "SecurityError")
          harness.removals.push(storageKey)
          nativeStorage.removeItem(storageKey)
        },
      }
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        /** Models browsers that reject access to the storage property itself. */
        get() {
          if (config.mode === "getter-denied") throw new DOMException("Invented getter failure", "SecurityError")
          return storage
        },
      })
    }, { planner, key, mode, seed, incomeProps })

    /** Re-mounts the real client at the intercepted origin and waits for its first paint. */
    async function mount() {
      await page.goto(fixtureUrl)
      await page.addScriptTag({ content: bundle })
      await page.waitForFunction(() => window.__businessPlannerFixture?.committed)
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    }
    await mount()
    return { context, page, requests, key, reload: mount }
  } catch (error) {
    await context.close()
    throw error
  }
}
