#!/usr/bin/env node

import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { runInNewContext } from "node:vm"
import ts from "typescript"
import {
  buildPublishedRuntimeManifest,
} from "./chimer-preview-generation/published-runtime-manifest.mjs"
import {
  getVerticalPublishedPreviewPosterUrl,
  resolvePublishedPreviewCatalogBaseUrl,
  selectPublishedPreviewRendition,
} from "../lib/background-preview-runtime.js"

const LEGACY_ORIGIN = "https://media.massagelab.app"
const BRANDED_ORIGIN = "https://media.atmoshaper.com"
const FALLBACK_NAMESPACE = "/chimer/background-previews"
const URL_FIELDS = [
  "previewMediaUrl", "previewVideoUrl", "previewImageUrl", "previewSquareVideoUrl",
  "previewSquareImageUrl", "previewVerticalVideoUrl", "previewVerticalImageUrl", "previewPosterUrl",
]

/**
 * Executes the actual generated fallback resolver with controlled public build
 * fields, without reading the calling process's environment or changing it.
 * TypeScript compilation is local; the module receives no provider/app/network
 * dependency. Returned metadata is cloned into the caller's realm.
 */
export function inspectChimerFallbackRuntime(source, { configuredBaseUrl, nodeEnv = "production" } = {}) {
  const compiled = ts.transpileModule(source, {
    reportDiagnostics: true,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  })
  if (compiled.diagnostics?.some((item) => item.category === ts.DiagnosticCategory.Error)) {
    throw new Error("Chimer fallback declaration cannot be compiled for local inspection")
  }
  const exports = {}
  runInNewContext(compiled.outputText, {
    exports, process: { env: { NODE_ENV: nodeEnv, NEXT_PUBLIC_CHIMER_PREVIEW_MEDIA_BASE_URL: configuredBaseUrl } },
  }, { timeout: 5000 })
  assert.equal(typeof exports.resolveVerticalPreviewMediaUrls, "function")
  assert.ok(exports.backgroundPreviewManifest && typeof exports.backgroundPreviewManifest === "object")
  return {
    manifest: structuredClone(exports.backgroundPreviewManifest),
    resolveVertical: exports.resolveVerticalPreviewMediaUrls,
  }
}

/** Projects URL-bearing fields only; all other fallback metadata stays comparable. */
function splitFallbackDelivery(manifest) {
  const metadata = structuredClone(manifest)
  const urls = []
  function removeUrls(entry) {
    for (const field of URL_FIELDS) {
      if (entry[field] !== undefined) {
        assert.equal(typeof entry[field], "string")
        urls.push(entry[field])
        delete entry[field]
      }
    }
  }
  for (const entry of Object.values(metadata)) {
    removeUrls(entry)
    for (const variant of Object.values(entry.variants ?? {})) removeUrls(variant)
  }
  return { metadata, urls }
}

/**
 * Plans both distinct Chimer bindings from complete committed public declarations.
 * Uses actual published/fallback resolvers, preserves all identities/geometry,
 * and refuses drift or incomplete resolution. This is source evidence only:
 * no provider payload, deployment, upload or offered-playback claim.
 */
export function planChimerMediaBindings({ catalog, publishedManifest, fallbackIndex, fallbackSource, origin = BRANDED_ORIGIN }) {
  assert.ok([LEGACY_ORIGIN, BRANDED_ORIGIN].includes(origin), "Chimer target must be one of the prepared media origins")
  assert.deepEqual(buildPublishedRuntimeManifest(catalog), publishedManifest)
  const releaseNamespace = "/chimer/background-preview-catalog/" + publishedManifest.catalogRevision
  const publishedBase = origin + releaseNamespace
  const fallbackBase = origin + FALLBACK_NAMESPACE
  assert.equal(resolvePublishedPreviewCatalogBaseUrl({ configuredBaseUrl: publishedBase, nodeEnv: "production" }), publishedBase)
  assert.equal(resolvePublishedPreviewCatalogBaseUrl({ nodeEnv: "production" }), null)

  const objects = new Map()
  let selectedRenditions = 0
  let verticalPosters = 0
  for (const entry of catalog.entries) {
    const runtimeEntry = publishedManifest.entries[entry.backgroundId]
    for (const rendition of entry.renditions ?? []) {
      const resolved = selectPublishedPreviewRendition({
        entry: runtimeEntry, aspect: rendition.aspect, quality: rendition.quality,
        codec: rendition.codec, catalogBaseUrl: publishedBase,
      })
      assert.ok(resolved, "A published rendition did not resolve")
      assert.equal(resolved.url, publishedBase + "/" + rendition.url)
      assert.equal(resolved.mimeType, rendition.mimeType)
      selectedRenditions += 1
    }
    assert.equal(getVerticalPublishedPreviewPosterUrl(runtimeEntry, publishedBase), publishedBase + "/" + entry.posters.vertical.url)
    verticalPosters += 1
    for (const row of [...(entry.renditions ?? []), ...Object.values(entry.posters)]) {
      assert.match(row.sha256, /^[a-f0-9]{64}$/)
      assert.ok(Number.isSafeInteger(row.bytes) && row.bytes > 0)
      const previous = objects.get(row.url)
      if (previous) {
        assert.equal(previous.sha256, row.sha256)
        assert.equal(previous.bytes, row.bytes)
      }
      objects.set(row.url, row)
    }
  }

  const legacyRuntime = inspectChimerFallbackRuntime(fallbackSource).manifest
  assert.equal(fallbackIndex.items.length, 83, "Fallback index differs from the retained 83-entry release")
  const fallbackIds = fallbackIndex.items.map((item) => item.id)
  assert.equal(new Set(fallbackIds).size, fallbackIds.length)
  assert.deepEqual(Object.keys(legacyRuntime).sort(), [...fallbackIds].sort())
  for (const item of fallbackIndex.items) {
    const expected = Object.fromEntries(
      [...URL_FIELDS, "previewMediaType", "variants"]
        .filter((field) => item[field] !== undefined)
        .map((field) => [field, item[field]]),
    )
    const actual = JSON.parse(JSON.stringify(legacyRuntime[item.id]))
    const expectedParts = splitFallbackDelivery({ [item.id]: expected })
    const actualParts = splitFallbackDelivery({ [item.id]: actual })
    assert.deepEqual(actualParts.metadata, expectedParts.metadata)
    assert.equal(actualParts.urls.length, expectedParts.urls.length)
    expectedParts.urls.forEach((url, index) => {
      assert.ok(url.startsWith(FALLBACK_NAMESPACE + "/"), "Fallback index contains an unexpected media path")
      assert.equal(actualParts.urls[index], LEGACY_ORIGIN + url)
    })
  }
  const legacy = splitFallbackDelivery(legacyRuntime)
  const rebound = splitFallbackDelivery(inspectChimerFallbackRuntime(fallbackSource, { configuredBaseUrl: fallbackBase }).manifest)
  assert.deepEqual(rebound.metadata, legacy.metadata)
  assert.equal(rebound.urls.length, legacy.urls.length)
  for (let index = 0; index < legacy.urls.length; index += 1) {
    assert.ok(legacy.urls[index].startsWith(LEGACY_ORIGIN + FALLBACK_NAMESPACE + "/"), "Unexpected fallback asset origin")
    assert.equal(rebound.urls[index], origin + legacy.urls[index].slice(LEGACY_ORIGIN.length))
  }
  assert.ok(rebound.urls.length > 0, "Fallback declaration has no resolved media")
  return {
    status: "local-source-binding-plan",
    proposedPublicBuildSettings: {
      NEXT_PUBLIC_CHIMER_PREVIEW_CATALOG_BASE_URL: publishedBase,
      NEXT_PUBLIC_CHIMER_PREVIEW_MEDIA_BASE_URL: fallbackBase,
    },
    published: {
      catalogRevision: publishedManifest.catalogRevision,
      backgrounds: catalog.entries.length,
      animated: catalog.entries.filter((entry) => entry.mediaKind === "animated").length,
      posterOnly: catalog.entries.filter((entry) => entry.mediaKind === "poster-only").length,
      resolvedRenditions: selectedRenditions,
      resolvedVerticalPosters: verticalPosters,
      distinctDeclaredObjects: objects.size,
      declaredDistinctBytes: [...objects.values()].reduce((total, row) => total + row.bytes, 0),
    },
    fallback: {
      backgrounds: Object.keys(rebound.metadata).length,
      resolvedUrlReferences: rebound.urls.length,
      distinctResolvedUrls: new Set(rebound.urls).size,
      identityAndGeometryPreserved: true,
    },
    activationBoundary: "Configuring an absent published base activates its existing catalog path; this needs exact approval and acceptance",
    currentProductionValuesInspected: false,
    declarationsChanged: false,
    providerRequests: 0,
    mediaMutations: 0,
    playbackVerified: false,
  }
}

/** Reads only fixed committed declarations/source; never dotenv, credentials or hosted media. */
export async function prepareChimerMediaBindings() {
  const readJson = async (url) => JSON.parse(await readFile(new URL(url, import.meta.url), "utf8"))
  const catalog = await readJson("../public/chimer/background-preview-catalog/index.json")
  const publishedManifest = await readJson("../data/background-preview-published-manifest.json")
  const fallbackIndex = await readJson("../public/chimer/background-previews/index.json")
  const fallbackSource = await readFile(new URL("../components/backgrounds/backgroundPreviewManifest.ts", import.meta.url), "utf8")
  return planChimerMediaBindings({ catalog, publishedManifest, fallbackIndex, fallbackSource })
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    if (process.argv.length > 2) throw new Error("Chimer media plan accepts no mutation or provider arguments")
    console.log(JSON.stringify(await prepareChimerMediaBindings(), null, 2))
  } catch {
    console.error(JSON.stringify({ status: "CHIMER_MEDIA_BINDING_PLAN_FAILED" }))
    process.exitCode = 1
  }
}
