import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { validateAtmoShaperProductionCatalog } from "../lib/atmoshaper/production-catalog.js"
import { createGenerativeFmStations } from "../lib/atmosphere/generative-fm-catalog.js"

/** Reads only committed public declarations; never loads dotenv, application or database owners. */
async function declaration(relativePath) {
  return JSON.parse(await readFile(new URL(relativePath, import.meta.url), "utf8"))
}

/** Deduplicates declared objects and rejects conflicting identities without reading media bytes. */
function distinctObjects(rows, urlField, byteField) {
  const objects = new Map()
  for (const row of rows) {
    assert.equal(typeof row[urlField], "string")
    assert.ok(row[urlField].length > 0)
    assert.match(row.sha256, /^[a-f0-9]{64}$/)
    assert.ok(Number.isSafeInteger(row[byteField]) && row[byteField] > 0)
    const preceding = objects.get(row[urlField])
    if (preceding) {
      assert.equal(preceding.sha256, row.sha256)
      assert.equal(preceding[byteField], row[byteField])
    }
    objects.set(row[urlField], row)
  }
  return [...objects.values()]
}

try {
  const [audioDeclaration, previewDeclaration, runtimePreview] = await Promise.all([
    declaration("../data/atmoshaper/production-audio-catalog.json"),
    declaration("../public/chimer/background-preview-catalog/index.json"),
    declaration("../data/background-preview-published-manifest.json"),
  ])
  const audio = validateAtmoShaperProductionCatalog(audioDeclaration)
  const sources = audio.concepts.flatMap(({ sources }) => sources)
  const formats = sources.flatMap(({ formats }) => formats)
  const audioObjects = distinctObjects(formats, "publicUrl", "byteSize")
  const payloadCount = new Set(sources.map(({ payloadSha256 }) => payloadSha256)).size
  assert.equal(audio.summary.sourceReferenceCount, sources.length)
  assert.equal(audio.summary.uniquePayloadCount, payloadCount)

  assert.equal(previewDeclaration.schemaVersion, 3)
  assert.equal(runtimePreview.schemaVersion, 1)
  assert.equal(runtimePreview.catalogRevision, previewDeclaration.catalogRevision)
  const previewEntries = previewDeclaration.entries
  const previewIds = previewEntries.map(({ backgroundId }) => backgroundId).sort()
  assert.equal(new Set(previewIds).size, previewIds.length)
  assert.deepEqual(Object.keys(runtimePreview.entries).sort(), previewIds)
  const previewRows = previewEntries.flatMap(({ renditions, posters }) => [
    ...(renditions ?? []), ...Object.values(posters),
  ])
  const previewObjects = distinctObjects(previewRows, "url", "bytes")
  const stations = createGenerativeFmStations()

  // Counts describe source declarations, not storage contents or observed hosted playback.
  console.log(JSON.stringify({
    schemaVersion: 1,
    evidenceScope: "source-declarations-only",
    signatureAudio: {
      concepts: audio.concepts.length,
      sourceReferences: sources.length,
      distinctPayloads: payloadCount,
      formatReferences: formats.length,
      distinctFormatObjects: audioObjects.length,
      declaredDistinctObjectBytes: audioObjects.reduce((sum, row) => sum + row.byteSize, 0),
      referencesUsingLegacyMediaOrigin: audioObjects.filter(({ publicUrl }) =>
        new URL(publicUrl).origin === "https://media.massagelab.app").length,
    },
    publishedChimerPreviews: {
      backgrounds: previewEntries.length,
      animated: previewEntries.filter(({ mediaKind }) => mediaKind === "animated").length,
      posterOnly: previewEntries.filter(({ mediaKind }) => mediaKind === "poster-only").length,
      distinctObjects: previewObjects.length,
      declaredDistinctObjectBytes: previewObjects.reduce((sum, row) => sum + row.bytes, 0),
      absoluteUrlReferences: previewObjects.filter(({ url }) => /^[a-z][a-z0-9+.-]*:/i.test(url)).length,
      runtimeBackgroundIdsMatch: true,
    },
    generativeAudio: {
      stationDeclarations: stations.length,
      sourceEnabledStations: stations.filter(({ enabled }) => enabled).length,
      sourceDisabledStations: stations.filter(({ enabled }) => !enabled).length,
      hostedSampleIndexDeclarations: stations.filter(({ runtime }) => runtime.hostedSampleIndexUrl).length,
      nestedHostedSampleUrls: "not-inspected",
    },
    remainingEvidence: {
      providerOwnershipAndStorage: "not-inspected",
      anatomyDatabaseUrls: "not-read",
      currentDeployedConfiguration: "not-inspected",
      playbackAndLegacyToolContinuity: "not-tested",
    },
  }, null, 2))
} catch {
  // Raw declarations and validation diagnostics can contain URLs; keep failure output bounded.
  console.error(JSON.stringify({ schemaVersion: 1, error: { code: "MEDIA_SOURCE_INVENTORY_FAILED" } }))
  process.exitCode = 1
}
