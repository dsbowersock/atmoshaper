import assert from "node:assert/strict"
import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { createServer } from "node:http"

const require = createRequire(import.meta.url)
const root = fileURLToPath(new URL("../..", import.meta.url))
const dataModule = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
const asImport = (relative) => JSON.stringify(path.join(root, relative).replaceAll("\\", "/"))

/** Bundles the actual native form and attempt helpers; only Button presentation is doubled. */
export async function createDonationCheckoutBrowserBundle() {
  const { webpack } = require("next/dist/compiled/webpack/webpack")
  const button = dataModule(`import React from 'react';
    export function Button({variant,tone,effect,size,...props}) { return React.createElement('button',props); }`)
  const entry = dataModule(`
    import React,{useEffect} from 'react';
    import {createRoot} from 'react-dom/client';
    import {DonationCheckoutForm} from ${asImport("app/pricing/donation-checkout-form.tsx")};
    import {DONATION_OPTIONS} from ${asImport("lib/donations.js")};
    function Fixture(){
      useEffect(()=>{window.__donationFixtureReady=true},[]);
      return React.createElement(DonationCheckoutForm,{
        checkoutAvailable:true,options:DONATION_OPTIONS,initialAttemptId:crypto.randomUUID(),
        returnCode:new URL(location.href).searchParams.get('donation')??undefined
      });
    }
    createRoot(document.getElementById('root')).render(React.createElement(Fixture));
  `)
  const compiler = webpack({
    mode: "development", target: "web", entry, devtool: false, cache: false,
    output: { path: root, filename: "donation-fixture.js" },
    resolve: { alias: { "@": root }, modules: [path.join(root, "node_modules"), "node_modules"], extensions: [".js", ".mjs", ".tsx", ".ts"] },
    module: { rules: [{ test: /\.tsx?$/, use: [path.join(root, "tests/helpers/professional-record-vault-browser-loader.cjs")] }] },
    optimization: { minimize: false },
    plugins: [
      new webpack.NormalModuleReplacementPlugin(/^@\/components\/ui\/button$/, (resource) => { resource.request = button }),
      { apply(owner) { owner.hooks.shouldEmit.tap("KeepDonationFixtureInMemory", () => false) } },
    ],
  })
  return new Promise((resolve, reject) => {
    compiler.run((error, stats) => {
      let bundle, failure = error
      try {
        if (!failure && stats.hasErrors()) failure = new Error(stats.toString({ all: false, errors: true }))
        if (!failure) bundle = String(stats.compilation.getAsset("donation-fixture.js").source.source())
      } catch (readError) { failure = readError }
      compiler.close((closeError) => { if (failure || closeError) reject(failure || closeError); else resolve(bundle) })
    })
  })
}

/** Owns a bounded loopback peer so Chromium follows literal native POST/303/GET redirects. */
export async function withDonationCheckoutBrowserFixture(browser, bundle, run) {
  const unexpected = []
  const errors = []
  let context, origin, handler, requestCount = 0
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, origin)
      if (++requestCount > 128) throw new Error("Donation fixture request bound exceeded")
      if (request.method === "GET" && url.pathname === "/pricing") {
        response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
        return response.end('<!doctype html><html><head><link rel="icon" href="data:,"></head><body><div id="root"></div><script defer src="/donation-fixture.js"></script></body></html>')
      }
      if (request.method === "GET" && url.pathname === "/donation-fixture.js") {
        response.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8" })
        return response.end(bundle)
      }
      if (request.method === "POST" && url.pathname === "/api/billing/donation" && handler) {
        let body = ""
        for await (const chunk of request) {
          body += chunk.toString("utf8")
          if (Buffer.byteLength(body) > 2048) throw new Error("Donation fixture body bound exceeded")
        }
        let timer
        try {
          const outcome = await Promise.race([
            handler({ method: request.method, body }),
            new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("Donation fixture response timeout")), 10_000) }),
          ])
          if (!["rate-limited", "unavailable", "checkout-error", "conflict", "thanks", "cancelled"].includes(outcome)) throw new Error("Unexpected donation fixture outcome")
          response.writeHead(303, { Location: `/pricing?donation=${outcome}` })
          return response.end()
        } finally { clearTimeout(timer) }
      }
      unexpected.push(`${request.method} ${url}`)
      response.writeHead(404)
      response.end()
    } catch (error) {
      errors.push(error.message)
      response.destroy()
    }
  })
  server.requestTimeout = 10_000
  server.headersTimeout = 5_000
  try {
    await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
    origin = `http://127.0.0.1:${server.address().port}`
    context = await browser.newContext({ serviceWorkers: "block" })
    await context.route("**/*", (route) => {
      const url = new URL(route.request().url())
      if (url.origin === origin && ["/pricing", "/donation-fixture.js", "/api/billing/donation"].includes(url.pathname)) return route.continue()
      unexpected.push(`${route.request().method()} ${url}`)
      return route.abort("blockedbyclient")
    })
    const page = await context.newPage()
    page.on("pageerror", (error) => errors.push(error.message))
    await run(page, { origin, setDonationHandler: (next) => { handler = next } })
  } finally {
    try { await context?.close() }
    finally {
      server.closeAllConnections()
      await new Promise((resolve) => server.close(resolve))
    }
    assert.deepEqual(unexpected, [], "Unmatched fixture requests must never dispatch")
    assert.deepEqual(errors, [], "The actual donation component must execute without browser errors")
  }
}
