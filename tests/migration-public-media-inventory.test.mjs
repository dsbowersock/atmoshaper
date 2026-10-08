import assert from "node:assert/strict"
import test from "node:test"
import { inventoryPublicIndexes, publicIndexTargets, readPublicIndex, sampleDestinationCounts } from "../scripts/migration-public-media-inventory.mjs"

const origin = "https://media.massagelab.app"
const target = (name = "invented") => ({ url: `${origin}/atmosphere/generative-fm/${name}/sample-index.json`, groups: [["piano"]] })
const index = { piano: [`${origin}/invented/a.wav`, `${origin}/invented/a.wav`], bells: { C4: "relative/b.wav" } }
const response = (value = index, options = {}) => new Response(JSON.stringify(value), {
  headers: { "content-type": "application/json" }, ...options,
})

test("source targets deduplicate public indexes and retain every station's required groups", () => {
  const station = (enabled, groups) => ({ enabled, runtime: {
    hostedSampleIndexUrl: target().url, sampleNameGroups: groups,
    hostedSampleIndexFormatUrls: { opus: target().url },
  } })
  const targets = publicIndexTargets([station(true, ["piano"]), station(false, ["disabled"]), station(true, ["bells"])])
  assert.equal(targets.length, 1)
  assert.deepEqual(targets[0].groups, [["piano"], ["piano"], ["bells"], ["bells"]])
})

test("both declaration and request owners reject external, signed, credentialed and non-index destinations", async () => {
  let calls = 0
  for (const url of [
    "https://elsewhere.example.test/atmosphere/generative-fm/invented/sample-index.json",
    `${target().url}?signature=invented`, `${target().url}#fragment`,
    target().url.replace("https://", "https://invented:secret@"),
    `${origin}/private/sample-index.json`, `${origin}/atmosphere/generative-fm/invented/audio.wav`,
    `${origin}/atmosphere/%2fprivate/sample-index.json`,
  ]) {
    assert.throws(() => publicIndexTargets([{ enabled: true, runtime: { hostedSampleIndexUrl: url, sampleNameGroups: ["piano"] } }]))
    await assert.rejects(readPublicIndex({ ...target(), url }, { fetchImpl: async () => { calls += 1; return response() } }))
  }
  assert.equal(calls, 0)
  await assert.rejects(inventoryPublicIndexes([]))
  await assert.rejects(inventoryPublicIndexes([target(), target()]))
})

test("metadata reads omit credentials and redirects, validate required groups and never request samples", async () => {
  const calls = []
  const result = await readPublicIndex(target(), { fetchImpl: async (url, options) => {
    calls.push(url)
    assert.equal(options.method, "GET")
    assert.equal(options.credentials, "omit")
    assert.equal(options.redirect, "error")
    assert.deepEqual(options.headers, { Accept: "application/json" })
    return response()
  } })
  assert.deepEqual(calls, [target().url])
  assert.equal(result.references, 3)
  assert.equal(result.distinctUrls, 2)
  assert.equal(result.legacyOrigin, 2)
  assert.equal(result.relativeUrls, 1)
  await assert.rejects(readPublicIndex({ ...target(), groups: [["missing"]] }, { fetchImpl: async () => response() }))
  assert.deepEqual(sampleDestinationCounts({ piano: ["https://other.example.test/sample.wav"] }), {
    references: 1, distinctUrls: 1, legacyOrigin: 0, otherOrigins: 1, relativeUrls: 0,
  })
  assert.throws(() => sampleDestinationCounts({ piano: ["relative.wav?signature=invented"] }))
})

test("bad content, oversized bodies and redirected responses fail without retaining raw destinations", async () => {
  for (const bad of [
    () => new Response("not json", { headers: { "content-type": "application/json" } }),
    () => response({}, { headers: { "content-type": "text/html" } }),
    () => response(index, { headers: { "content-type": "application/json", "content-length": "2097153" } }),
    () => { const result = response(); Object.defineProperty(result, "redirected", { value: true }); return result },
    () => { const result = response(); Object.defineProperty(result, "url", { value: "https://redirect.example.test" }); return result },
    () => new Response(new Uint8Array([0x7b, 0xff, 0x7d]), { headers: { "content-type": "application/json" } }),
  ]) await assert.rejects(readPublicIndex(target(), { fetchImpl: async () => bad() }))
  await assert.rejects(readPublicIndex(target(), { fetchImpl: async () => response(), maxBytes: 10 }))
  const report = await inventoryPublicIndexes([target()], { fetchImpl: async () => response({}, { status: 404 }) })
  assert.equal(report.complete, false)
  assert.deepEqual(report.failureCodes, { HTTP_404: 1 })
  assert.equal(JSON.stringify(report).includes(origin), false)
})

test("owned deadlines bound stalled headers and cancel a late response body", async () => {
  let release
  let cancelled = false
  const pending = new Promise((resolve) => { release = resolve })
  await assert.rejects(readPublicIndex(target(), { fetchImpl: () => pending, timeoutMs: 20 }), /DEADLINE/)
  release(new Response(new ReadableStream({ cancel() { cancelled = true } }), { headers: { "content-type": "application/json" } }))
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(cancelled, true)
})

test("owned deadlines cancel a stalled streaming body and a shared budget stops all workers", async () => {
  let cancelled = false
  await assert.rejects(readPublicIndex(target(), { timeoutMs: 20, fetchImpl: async () => new Response(
    new ReadableStream({ cancel() { cancelled = true } }), { headers: { "content-type": "application/json" } },
  ) }), /DEADLINE/)
  assert.equal(cancelled, true)
  let calls = 0
  const targets = Array.from({ length: 12 }, (_, position) => target(`invented-${position}`))
  const report = await inventoryPublicIndexes(targets, { totalBytes: 10, fetchImpl: async () => { calls += 1; return response() } })
  assert.equal(report.complete, false)
  assert.equal(calls, 4)
  assert.equal(report.unvisitedIndexes, 8)
  assert.ok(report.responseBytes <= 10)
})

test("four-worker inventory aggregates all indexes while keeping provider/playback claims false", async () => {
  let active = 0
  let peak = 0
  const targets = Array.from({ length: 9 }, (_, position) => target(`invented-${position}`))
  const report = await inventoryPublicIndexes(targets, { fetchImpl: async () => {
    active += 1
    peak = Math.max(peak, active)
    await new Promise((resolve) => setImmediate(resolve))
    active -= 1
    return response()
  } })
  assert.equal(peak, 4)
  assert.equal(report.complete, true)
  assert.equal(report.indexesRead, 9)
  assert.equal(report.sampleReferences, 27)
  assert.equal(report.samplePayloadsRequested, 0)
  assert.equal(report.providerSettingsChanged, 0)
  assert.equal(report.providerOwnershipVerified, false)
  assert.equal(report.playbackVerified, false)
})

test("shared deadline stops stalled workers and transport errors cannot print private exception text", async () => {
  let calls = 0
  const targets = Array.from({ length: 6 }, (_, position) => target(`invented-${position}`))
  const report = await inventoryPublicIndexes(targets, { totalMs: 20, fetchImpl: () => {
    calls += 1
    return new Promise(() => {})
  } })
  assert.equal(calls, 4)
  assert.equal(report.failedIndexes, 4)
  assert.equal(report.unvisitedIndexes, 2)
  const rejected = await inventoryPublicIndexes([target()], { fetchImpl: async () => {
    throw Object.assign(new Error("invented-private-address"), { inventoryCode: "invented-private-address" })
  } })
  assert.equal(JSON.stringify(rejected).includes("invented-private-address"), false)
})
