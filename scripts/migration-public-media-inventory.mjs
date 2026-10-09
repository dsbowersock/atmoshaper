import assert from "node:assert/strict"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { createGenerativeFmStations } from "../lib/atmosphere/generative-fm-catalog.js"
import { assertGenerativeFmSampleIndex } from "../lib/atmosphere/generative-fm-sample-index.js"

const PUBLIC_ORIGIN = "https://media.massagelab.app"

/** Applies the metadata-only destination boundary again at the actual request owner. */
function publicIndexUrl(address) {
  const url = new URL(address)
  assert.equal(url.origin, PUBLIC_ORIGIN)
  assert.equal(url.username + url.password + url.search + url.hash, "")
  assert.ok(/^\/atmosphere\/(?:[a-z0-9-]+\/)+sample-index(?:\.[a-z0-9-]+)?\.json$/.test(url.pathname))
  return url.href
}

/** Rejects credentials, query strings and destinations outside the declared public metadata host. */
export function publicIndexTargets(stations) {
  const targets = new Map()
  for (const station of stations.filter(({ enabled }) => enabled)) {
    const runtime = station.runtime
    for (const address of [runtime.hostedSampleIndexUrl, ...Object.values(runtime.hostedSampleIndexFormatUrls ?? {})]) {
      if (!address) continue
      const url = publicIndexUrl(address)
      if (!targets.has(url)) targets.set(url, { url, groups: [] })
      targets.get(url).groups.push(runtime.sampleNameGroups)
    }
  }
  assert.ok(targets.size > 0 && targets.size <= 512)
  return [...targets.values()]
}

/** Counts nested destinations without requesting sample payloads or treating metadata as playback proof. */
export function sampleDestinationCounts(index) {
  const values = Object.values(index).flatMap((collection) => typeof collection === "string"
    ? [collection] : Array.isArray(collection) ? collection : Object.values(collection))
  const counts = { references: 0, distinctUrls: 0, legacyOrigin: 0, otherOrigins: 0, relativeUrls: 0 }
  const distinct = new Set()
  for (const value of values) {
    assert.equal(typeof value, "string")
    assert.ok(value.trim().length > 0)
    counts.references += 1
    distinct.add(value)
    const url = new URL(value, PUBLIC_ORIGIN)
    assert.equal(url.protocol, "https:")
    assert.equal(url.username + url.password + url.search + url.hash, "")
    if (!/^[a-z][a-z0-9+.-]*:/i.test(value) && !value.startsWith("//")) {
      counts.relativeUrls += 1
      continue
    }
    if (url.origin === PUBLIC_ORIGIN) counts.legacyOrigin += 1
    else counts.otherOrigins += 1
  }
  counts.distinctUrls = distinct.size
  return counts
}

/** Creates an owned, cleared deadline so stalled injected transports are bounded too. */
function deadlineAfter(milliseconds, maximum) {
  assert.ok(Number.isSafeInteger(milliseconds) && milliseconds > 0 && milliseconds <= maximum)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(new Error("PUBLIC_INDEX_DEADLINE")), milliseconds)
  return { controller, clear: () => clearTimeout(timer) }
}

/** Makes timeout enforcement cover both response headers and a stalled body, including test transports. */
async function abortable(promise, signal) {
  signal.throwIfAborted()
  let rejectAbort
  const cancelled = new Promise((_, reject) => { rejectAbort = () => reject(signal.reason) })
  signal.addEventListener("abort", rejectAbort, { once: true })
  try { return await Promise.race([promise, cancelled]) }
  finally { signal.removeEventListener("abort", rejectAbort) }
}

/** Reads one bounded JSON index with no cookies, auth, redirect following or sample requests. */
export async function readPublicIndex(target, {
  fetchImpl = globalThis.fetch, signal, timeoutMs = 10000, maxBytes = 2 * 1024 * 1024,
  accountBytes = () => {},
} = {}) {
  const url = publicIndexUrl(target.url)
  assert.ok(Array.isArray(target.groups) && target.groups.length > 0)
  assert.ok(Number.isSafeInteger(maxBytes) && maxBytes > 0 && maxBytes <= 2 * 1024 * 1024)
  const deadline = deadlineAfter(timeoutMs, 10000)
  const requestSignal = signal ? AbortSignal.any([signal, deadline.controller.signal]) : deadline.controller.signal
  let reader
  let response
  try {
    requestSignal.throwIfAborted()
    const pending = Promise.resolve(fetchImpl(url, {
      method: "GET", redirect: "error", credentials: "omit",
      headers: { Accept: "application/json" }, signal: requestSignal,
    }))
    // A transport that ignores abort may settle late; its body still belongs to this read.
    void pending.then((late) => {
      if (requestSignal.aborted) void late.body?.cancel().catch(() => {})
    }, () => {})
    response = await abortable(pending, requestSignal)
    if (response.status !== 200) throw Object.assign(new Error("PUBLIC_INDEX_HTTP_STATUS"), {
      inventoryCode: Number.isInteger(response.status) && response.status >= 100 && response.status <= 599
        ? `HTTP_${response.status}` : "INVALID_HTTP_STATUS",
    })
    assert.equal(response.redirected, false)
    if (response.url) assert.equal(response.url, url)
    assert.match(response.headers.get("content-type") ?? "", /^(application\/json|application\/[\w.+-]+\+json)(;|$)/i)
    const declaredLength = response.headers.get("content-length")
    if (declaredLength !== null) {
      assert.match(declaredLength, /^\d+$/)
      assert.ok(Number(declaredLength) <= maxBytes)
    }
    assert.ok(response.body)
    reader = response.body.getReader()
    const chunks = []
    let bytes = 0
    while (true) {
      const chunk = await abortable(reader.read(), requestSignal)
      if (chunk.done) break
      bytes += chunk.value.byteLength
      assert.ok(bytes <= maxBytes)
      accountBytes(chunk.value.byteLength)
      chunks.push(Buffer.from(chunk.value))
    }
    const index = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)))
    for (const groups of target.groups) assertGenerativeFmSampleIndex(index, groups)
    return { bytes, ...sampleDestinationCounts(index) }
  } finally {
    deadline.clear()
    if (reader) void reader.cancel().catch(() => {})
    else if (response?.body) void response.body.cancel().catch(() => {})
  }
}

/** Visits only the source allowlist, with four workers and shared byte/time ceilings; raw URLs never leave the report. */
export async function inventoryPublicIndexes(targets, {
  fetchImpl = globalThis.fetch, totalBytes = 32 * 1024 * 1024, totalMs = 180000, timeoutMs = 10000,
} = {}) {
  assert.ok(targets.length > 0 && targets.length <= 512)
  assert.equal(new Set(targets.map(({ url }) => publicIndexUrl(url))).size, targets.length)
  assert.ok(Number.isSafeInteger(totalBytes) && totalBytes > 0 && totalBytes <= 32 * 1024 * 1024)
  const deadline = deadlineAfter(totalMs, 180000)
  const signal = deadline.controller.signal
  let bytes = 0
  let next = 0
  const results = []
  const failures = []
  const accountBytes = (count) => {
    // Bound retained/processed JSON bytes; abort every worker before retaining an excess chunk.
    if (count > totalBytes - bytes) {
      deadline.controller.abort(new Error("PUBLIC_INDEX_BYTE_BUDGET"))
      signal.throwIfAborted()
    }
    bytes += count
  }
  /** Claims each index once from the shared cursor and records only bounded failure codes. */
  async function worker() {
    while (next < targets.length && !signal.aborted && bytes <= totalBytes) {
      const target = targets[next++]
      try { results.push(await readPublicIndex(target, { fetchImpl, signal, timeoutMs, accountBytes })) }
      catch (error) {
        // Transport exceptions may contain addresses; emit only our bounded status taxonomy.
        const code = error?.inventoryCode
        failures.push(typeof code === "string" && /^HTTP_[1-5]\d{2}$/.test(code) ? code : "READ_OR_VALIDATION_FAILED")
      }
    }
  }
  try { await Promise.all(Array.from({ length: Math.min(4, targets.length) }, worker)) }
  finally { deadline.clear() }
  const sum = (key) => results.reduce((total, row) => total + row[key], 0)
  return {
    schemaVersion: 1, evidenceScope: "public-sample-index-metadata-only",
    complete: results.length === targets.length,
    indexDeclarations: targets.length, indexesRead: results.length,
    failedIndexes: failures.length, unvisitedIndexes: targets.length - results.length - failures.length,
    failureCodes: Object.fromEntries([...new Set(failures)].map((code) => [code, failures.filter((value) => value === code).length])),
    responseBytes: bytes, sampleReferences: sum("references"),
    distinctUrlsWithinIndexes: sum("distinctUrls"),
    referencesUsingLegacyOrigin: sum("legacyOrigin"),
    referencesUsingOtherOrigins: sum("otherOrigins"), relativeReferences: sum("relativeUrls"),
    samplePayloadsRequested: 0, providerSettingsChanged: 0,
    providerOwnershipVerified: false, playbackVerified: false,
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2)
    assert.ok(args.length === 0 || (args.length === 1 && args[0] === "--read-public-metadata"))
    const targets = publicIndexTargets(createGenerativeFmStations())
    const report = args.length === 0 ? {
      schemaVersion: 1, evidenceScope: "source-allowlist-plan-only", indexDeclarations: targets.length,
      maximumConcurrentReads: 4, totalByteCeiling: 32 * 1024 * 1024, totalTimeCeilingMs: 180000,
      networkRequests: 0, needsExplicitReadFlag: true,
    } : await inventoryPublicIndexes(targets)
    console.log(JSON.stringify(report, null, 2))
    if (report.complete === false) process.exitCode = 1
  } catch {
    console.error(JSON.stringify({ schemaVersion: 1, error: { code: "PUBLIC_MEDIA_INVENTORY_FAILED" } }))
    process.exitCode = 1
  }
}
