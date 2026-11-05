import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { runInNewContext } from "node:vm"

test("service worker provides an offline navigation fallback", async () => {
  const source = await readFile(new URL("../public/sw.js", import.meta.url), "utf8")

  assert.match(source, /CACHE_NAME/)
  assert.match(source, /\/offline\.html/)
  assert.match(source, /PUBLIC_OFFLINE_ROUTES/)
  assert.match(source, /request\.mode === "navigate"/)
})

test("service worker avoids caching sensitive application requests", async () => {
  const source = await readFile(new URL("../public/sw.js", import.meta.url), "utf8")

  assert.match(source, /request\.method !== "GET"/)
  assert.match(source, /SENSITIVE_PREFIXES/)
  assert.match(source, /"\/api\/"/)
  assert.match(source, /"\/account"/)
  assert.match(source, /"\/api\/billing\/"/)
  assert.match(source, /"\/api\/auth\/"/)
  assert.match(source, /"\/api\/clinical\/sync"/)
  assert.match(source, /"\/calendar"/)
  assert.match(source, /"\/book"/)
  assert.match(source, /"\/admin"/)
  assert.match(source, /"\/settings"/)
  assert.match(source, /"\/pricing"/)
  assert.doesNotMatch(source, /pathname\.startsWith\("\/api\/clinical\/sync"\)/)
  assert.doesNotMatch(source, /pathname\.startsWith\("\/api\/billing\/"\)/)
  assert.doesNotMatch(source, /pathname\.startsWith\("\/api\/auth\/"\)/)
  assert.doesNotMatch(source, /pathname\.startsWith\("\/api\/account\/"\)/)
  assert.doesNotMatch(source, /pathname\.startsWith\("\/api\/clients\/"\)/)
})

test("service worker does not cache versionless brand or icon assets", async () => {
  const source = await readFile(new URL("../public/sw.js", import.meta.url), "utf8")

  assert.doesNotMatch(source, /"\/brand\//)
  assert.doesNotMatch(source, /"\/icons\//)
  assert.doesNotMatch(source, /pathname\.startsWith\("\/brand\/"\)/)
  assert.doesNotMatch(source, /pathname\.startsWith\("\/icons\/"\)/)
})

test("service worker only warms anonymous public tool routes for offline navigation", async () => {
  const source = await readFile(new URL("../public/sw.js", import.meta.url), "utf8")
  const publicRoutesBlock = source.match(/const PUBLIC_OFFLINE_ROUTES = \[([\s\S]*?)\]/)?.[1] ?? ""

  for (const route of ["/", "/notes", "/notes/soap", "/notes/intake", "/notes/journal", "/notes/rom", "/chimer", "/clock", "/anatomime"]) {
    assert.match(publicRoutesBlock, new RegExp(`"${route.replaceAll("/", "\\/")}"`))
  }

  for (const excludedRoute of ["/calendar", "/account", "/login", "/api/", "/book", "/pricing"]) {
    assert.doesNotMatch(publicRoutesBlock, new RegExp(`"${excludedRoute.replaceAll("/", "\\/")}"`))
  }

  assert.match(source, /credentials: "omit"/)
})

test("service worker does not blindly cache live navigation responses", async () => {
  const source = await readFile(new URL("../public/sw.js", import.meta.url), "utf8")

  assert.match(source, /warmPublicOfflineRoutes/)
  assert.doesNotMatch(source, /cache\.put\(request,\s*networkResponse\.clone\(\)\)/)
  assert.match(source, /publicOfflineCacheKey/)
})

test("service worker caches static shell assets only through successful lifecycle-bound writes", async () => {
  const source = await readFile(new URL("../public/sw.js", import.meta.url), "utf8")

  assert.match(source, /if \(!networkResponse\.ok\)/)
  assert.match(source, /const responseCopy = networkResponse\.clone\(\)/)
  assert.match(source, /event\.waitUntil\(/)
  assert.match(source, /cache\.put\(request, responseCopy\)/)
})

test("activation preserves unrelated caches and offline navigation reads only the app cache", async () => {
  const source = await readFile(new URL("../public/sw.js", import.meta.url), "utf8")
  const handlers = new Map()
  const deleted = []
  const matches = []
  let publicRouteMissing = false
  const origin = "https://www.atmoshaper.com"
  const cacheName = "massagelab-shell-v2026-05-18"
  runInNewContext(source, {
    self: {
      location: { origin },
      navigator: { onLine: false },
      clients: { claim: async () => {} },
      addEventListener: (type, handler) => handlers.set(type, handler),
    },
    caches: {
      keys: async () => ["unrelated-cache", "massagelab-shell-v2025-01-01", cacheName],
      delete: async name => { deleted.push(name) },
      match: async (request, options) => {
        const key = typeof request === "string" ? request : new URL(request.url).pathname
        matches.push([key, options?.cacheName])
        if (options?.cacheName !== cacheName) return new Response("unrelated cached response")
        if (publicRouteMissing && key.startsWith("/__massagelab-offline-route/")) return undefined
        return new Response(key === "/offline.html" ? "owned offline fallback" : "owned cached response")
      },
    },
    fetch: async () => { throw Error("Invented offline transport") },
    URL, Request, Response,
  })
  let activation
  handlers.get("activate")({ waitUntil: promise => { activation = promise } })
  await activation
  assert.deepEqual(deleted, ["massagelab-shell-v2025-01-01"])

  for (const [path, mode, expected] of [
    ["/calendar", "navigate", "owned offline fallback"],
    ["/chimer", "navigate", "owned cached response"],
    ["/_next/static/build.js", "cors", "owned cached response"],
  ]) {
    let response
    const background = []
    handlers.get("fetch")({
      request: { url: origin + path, method: "GET", mode },
      respondWith: promise => { response = promise },
      waitUntil: promise => { background.push(promise) },
    })
    assert.equal(await (await response).text(), expected)
    await Promise.all(background)
  }
  publicRouteMissing = true
  matches.length = 0
  let fallback
  const background = []
  handlers.get("fetch")({
    request: { url: origin + "/chimer", method: "GET", mode: "navigate" },
    respondWith: promise => { fallback = promise },
    waitUntil: promise => { background.push(promise) },
  })
  assert.equal(await (await fallback).text(), "owned offline fallback")
  await Promise.all(background)
  assert.deepEqual(matches, [
    ["/__massagelab-offline-route/chimer", cacheName],
    ["/offline.html", cacheName],
  ])
})
