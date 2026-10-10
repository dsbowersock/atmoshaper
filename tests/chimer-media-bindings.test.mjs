import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import {
  inspectChimerFallbackRuntime,
  planChimerMediaBindings,
  prepareChimerMediaBindings,
} from "../scripts/migration-chimer-media-bindings.mjs"
import {
  resolvePublishedPreviewCatalogBaseUrl,
} from "../lib/background-preview-runtime.js"

const branded = "https://media.atmoshaper.com"
const legacy = "https://media.massagelab.app"
/** Loads committed metadata fixtures relative to this test; it never fetches media or provider state. */
const readJson = async (relative) => JSON.parse(await readFile(new URL(relative, import.meta.url), "utf8"))
const input = {
  catalog: await readJson("../public/chimer/background-preview-catalog/index.json"),
  publishedManifest: await readJson("../data/background-preview-published-manifest.json"),
  fallbackIndex: await readJson("../public/chimer/background-previews/index.json"),
  fallbackSource: await readFile(new URL("../components/backgrounds/backgroundPreviewManifest.ts", import.meta.url), "utf8"),
}

test("the full Chimer plan resolves separate release and fallback namespaces without source mutation", async () => {
  const original = structuredClone(input)
  const plan = await prepareChimerMediaBindings()
  assert.deepEqual(input, original)
  assert.deepEqual(plan.proposedPublicBuildSettings, {
    NEXT_PUBLIC_CHIMER_PREVIEW_CATALOG_BASE_URL: branded + "/chimer/background-preview-catalog/catalog-approved-1",
    NEXT_PUBLIC_CHIMER_PREVIEW_MEDIA_BASE_URL: branded + "/chimer/background-previews",
  })
  assert.deepEqual(plan.published, {
    catalogRevision: "catalog-approved-1", backgrounds: 84, animated: 82, posterOnly: 2,
    resolvedRenditions: 1476, resolvedVerticalPosters: 84,
    distinctDeclaredObjects: 1728, declaredDistinctBytes: 862078635,
  })
  assert.deepEqual(plan.fallback, {
    backgrounds: 83, resolvedUrlReferences: 593, distinctResolvedUrls: 255,
    identityAndGeometryPreserved: true,
  })
  assert.equal(plan.declarationsChanged, false)
  assert.equal(plan.providerRequests, 0)
  assert.equal(plan.mediaMutations, 0)
  assert.equal(plan.playbackVerified, false)
  assert.equal(plan.currentProductionValuesInspected, false)
  assert.match(plan.activationBoundary, /absent published base activates/)
})

test("legacy rollback uses both old namespaces and leaves unconfigured Production catalog disabled", () => {
  const plan = planChimerMediaBindings({ ...input, origin: legacy })
  assert.equal(plan.proposedPublicBuildSettings.NEXT_PUBLIC_CHIMER_PREVIEW_CATALOG_BASE_URL, legacy + "/chimer/background-preview-catalog/catalog-approved-1")
  assert.equal(plan.proposedPublicBuildSettings.NEXT_PUBLIC_CHIMER_PREVIEW_MEDIA_BASE_URL, legacy + "/chimer/background-previews")
  assert.equal(resolvePublishedPreviewCatalogBaseUrl({ nodeEnv: "production" }), null)
  assert.equal(resolvePublishedPreviewCatalogBaseUrl({ nodeEnv: "development" }), "/chimer/background-preview-catalog")
  assert.equal(plan.fallback.distinctResolvedUrls, 255)
})

test("the actual fallback module retains local/default paths and rebinds explicit and guessed vertical assets", () => {
  const local = inspectChimerFallbackRuntime(input.fallbackSource, { nodeEnv: "development" })
  const production = inspectChimerFallbackRuntime(input.fallbackSource)
  const proposed = inspectChimerFallbackRuntime(input.fallbackSource, { configuredBaseUrl: branded + "/chimer/background-previews" })
  const id = "massage-lab-3d-globe"
  assert.equal(local.manifest[id].previewMediaUrl, "/chimer/background-previews/" + id + ".webm")
  assert.equal(production.manifest[id].previewMediaUrl, legacy + "/chimer/background-previews/" + id + ".webm")
  assert.equal(proposed.manifest[id].previewMediaUrl, branded + "/chimer/background-previews/" + id + ".webm")
  assert.equal(proposed.resolveVertical(proposed.manifest[id], id).videoUrl, branded + "/chimer/background-previews/" + id + "-vertical.webm")
  // These are resolution checks only; guessed files are not existence evidence.
  assert.equal(proposed.resolveVertical(undefined, "invented").posterUrl, branded + "/chimer/background-previews/invented-vertical.webp")
  assert.deepEqual(Object.keys(proposed.manifest), Object.keys(production.manifest))
  assert.equal(proposed.manifest[id].variants.vertical.width, production.manifest[id].variants.vertical.width)
  assert.equal(proposed.manifest[id].variants.vertical.sha256, production.manifest[id].variants.vertical.sha256)
})

test("published identity or matrix drift and malformed object metadata fail before a positive plan", () => {
  const partial = structuredClone(input)
  partial.catalog.entries.pop()
  assert.throws(() => planChimerMediaBindings(partial), /exactly 84 entries/)
  const stale = structuredClone(input)
  stale.publishedManifest.entries["massage-lab-moving-gradient"].posters.vertical = "different/poster.webp"
  assert.throws(() => planChimerMediaBindings(stale), /deep-equal/)
  for (const field of ["sha256", "bytes"]) {
    const bad = structuredClone(input)
    bad.catalog.entries[0].renditions[0][field] = field === "bytes" ? -1 : "not-a-digest"
    assert.throws(() => planChimerMediaBindings(bad))
  }
})

test("fallback index completeness, identity and geometry must match the actual runtime module", () => {
  const missing = structuredClone(input)
  missing.fallbackIndex.items.pop()
  assert.throws(() => planChimerMediaBindings(missing), /retained 83-entry/)
  const duplicate = structuredClone(input)
  duplicate.fallbackIndex.items[1].id = duplicate.fallbackIndex.items[0].id
  assert.throws(() => planChimerMediaBindings(duplicate))
  const changed = structuredClone(input)
  changed.fallbackIndex.items[0].variants.vertical.width += 1
  assert.throws(() => planChimerMediaBindings(changed), /deep-equal/)
})

test("unprepared targets, malformed TypeScript and external module loading cannot produce a plan", () => {
  for (const origin of ["http://media.atmoshaper.com", branded + "/", branded + "/path", "https://other.example", branded + "?key=invented"]) {
    assert.throws(() => planChimerMediaBindings({ ...input, origin }), /prepared media origins/)
  }
  assert.throws(() => inspectChimerFallbackRuntime("export const backgroundPreviewManifest = {"), /cannot be compiled/)
  assert.throws(() => inspectChimerFallbackRuntime('import x from "unapproved-module"; export const backgroundPreviewManifest = x;'), /require is not defined/)
})

test("inspection uses controlled public build fields without changing the caller environment", async () => {
  const keys = ["NODE_ENV", "NEXT_PUBLIC_CHIMER_PREVIEW_CATALOG_BASE_URL", "NEXT_PUBLIC_CHIMER_PREVIEW_MEDIA_BASE_URL"]
  const preceding = keys.map((key) => [key, process.env[key]])
  try {
    process.env.NODE_ENV = "invented-caller-state"
    process.env.NEXT_PUBLIC_CHIMER_PREVIEW_CATALOG_BASE_URL = "https://unrelated.example"
    process.env.NEXT_PUBLIC_CHIMER_PREVIEW_MEDIA_BASE_URL = "https://unrelated.example/fallback"
    const before = keys.map((key) => [key, process.env[key]])
    const plan = await prepareChimerMediaBindings()
    assert.equal(plan.proposedPublicBuildSettings.NEXT_PUBLIC_CHIMER_PREVIEW_MEDIA_BASE_URL, branded + "/chimer/background-previews")
    assert.deepEqual(keys.map((key) => [key, process.env[key]]), before)
  } finally {
    for (const [key, value] of preceding) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
})
