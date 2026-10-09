import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { mkdtemp, readFile, rmdir, unlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import test from "node:test"
import committedCatalog from "../data/atmoshaper/production-audio-catalog.json" with { type: "json" }
import {
  ATMOSHAPER_PRODUCTION_RIGHTS,
  buildAtmoShaperProductionCatalog,
  rebindAtmoShaperProductionCatalog,
} from "../lib/atmoshaper/production-release-builder.js"
import { selectAtmoShaperProductionAudioUrl } from "../lib/atmoshaper/production-catalog.js"
import { prepareSignatureMediaCatalog } from "../scripts/migration-signature-media-catalog.mjs"

const legacy = "https://media.massagelab.app"
const branded = "https://media.atmoshaper.com"

/** Independent canonical digest check of catalog identity, preserving array order. */
function revision(catalog) {
  function canonical(value) {
    if (Array.isArray(value)) return value.map(canonical)
    if (value === null || typeof value !== "object") return value
    return Object.fromEntries(Object.keys(value).sort(new Intl.Collator().compare).map((key) => [key, canonical(value[key])]))
  }
  return createHash("sha256").update(JSON.stringify(canonical({
    version: catalog.version, rights: catalog.rights, concepts: catalog.concepts,
  })) + "\n").digest("hex")
}

/** Invented checksum owners exercise duplicate references and playback metadata. */
function fixture() {
  const payload = "a".repeat(64)
  const formats = [
    ["opus", "opus.ogg", "audio/ogg; codecs=opus"],
    ["aac", "aac.m4a", "audio/mp4; codecs=mp4a.40.2"],
    ["mp3", "mp3.mp3", "audio/mpeg"],
    ["source", "source.wav", "audio/wav"],
  ].map(([id, filename, contentType], index) => ({
    id, publicUrl: legacy + "/atmosphere/atmoshaper/v1/audio/" + payload + "/" + filename,
    contentType, sha256: String(index + 1).repeat(64), byteSize: 100 + index,
  }))
  const source = {
    sourceId: "b".repeat(64), label: "Invented source", relativePath: "invented/source.wav",
    payloadSha256: payload, durationSeconds: 12, startSeconds: 1, endSeconds: 9,
    fadeInSeconds: 0.5, fadeOutSeconds: 1, gainDb: -3,
  }
  return buildAtmoShaperProductionCatalog({
    publishedBaseUrl: legacy,
    renditionsByPayloadSha256: new Map([[payload, formats]]),
    concepts: [{
      id: "invented", batchId: "batch-01-invented", groupId: "signature-extra:invented",
      label: "Invented", description: "Invented fixture", category: "nature", origin: "signature-only",
      reviewFingerprint: "c".repeat(64),
      playbackConfiguration: { strategyId: "adaptive-whole-source-sequence", previewSettings: {}, constructionPolicy: null },
      runtimePolicy: null, sourceSelection: null, playbackMode: null,
      sources: [source, { ...source, sourceId: "d".repeat(64), label: "Second identity", durationSeconds: 14 }],
    }],
  })
}

function withoutDelivery(catalog) {
  const clone = structuredClone(catalog)
  delete clone.catalogRevision
  delete clone.publishedBaseUrl
  for (const concept of clone.concepts) {
    for (const source of concept.sources) {
      for (const format of source.formats) delete format.publicUrl
    }
  }
  return clone
}

test("the entire committed Signature catalog rebinds with a distinct verified revision and immutable owners", () => {
  const original = structuredClone(committedCatalog)
  const result = rebindAtmoShaperProductionCatalog(committedCatalog, branded)
  assert.deepEqual(committedCatalog, original)
  assert.deepEqual(withoutDelivery(result), withoutDelivery(original))
  assert.equal(revision(original), original.catalogRevision)
  assert.equal(revision(result), result.catalogRevision)
  assert.notEqual(result.catalogRevision, original.catalogRevision)
  assert.equal(result.catalogRevision, "4afb728dcdc5ed0cdef4d8256a0d187a4e4f585e6feeee1a9a66775e21cc3c45")
  assert.equal(result.publishedBaseUrl, branded + "/")
  assert.deepEqual(result.summary, { conceptCount: 51, sourceReferenceCount: 450, uniquePayloadCount: 410 })
  const outputFormats = result.concepts.flatMap((concept) => concept.sources.flatMap((source) => source.formats))
  const inputFormats = original.concepts.flatMap((concept) => concept.sources.flatMap((source) => source.formats))
  assert.equal(outputFormats.length, 1800)
  outputFormats.forEach((format, index) => {
    assert.equal(format.publicUrl, branded + inputFormats[index].publicUrl.slice(legacy.length))
  })
  assert.equal(new Set(outputFormats.map((format) => format.publicUrl)).size, 1640)
})

test("rebinding is idempotent and rollback restores the exact original catalog and browser format choice", () => {
  const result = rebindAtmoShaperProductionCatalog(committedCatalog, branded)
  assert.deepEqual(rebindAtmoShaperProductionCatalog(result, branded), result)
  assert.deepEqual(rebindAtmoShaperProductionCatalog(result, legacy), committedCatalog)
  const source = result.concepts[0].sources[0]
  for (const contentType of ["audio/ogg; codecs=opus", "audio/mp4; codecs=mp4a.40.2", "audio/mpeg", "audio/wav"]) {
    assert.equal(
      selectAtmoShaperProductionAudioUrl(source, (candidate) => candidate === contentType ? "probably" : ""),
      source.formats.find((format) => format.contentType === contentType).publicUrl,
    )
  }
})

test("duplicate payloads keep separate source identities and timing while rights stay exact", () => {
  const original = fixture()
  const result = rebindAtmoShaperProductionCatalog(original, branded)
  assert.deepEqual(result.rights, ATMOSHAPER_PRODUCTION_RIGHTS)
  assert.deepEqual(withoutDelivery(result), withoutDelivery(original))
  assert.equal(result.summary.sourceReferenceCount, 2)
  assert.equal(result.summary.uniquePayloadCount, 1)
  assert.notEqual(result.concepts[0].sources[0].sourceId, result.concepts[0].sources[1].sourceId)
  assert.equal(result.concepts[0].sources[0].durationSeconds, 12)
  assert.equal(result.concepts[0].sources[1].durationSeconds, 14)
})

test("revision drift, altered raw URL spelling and modified rights stop preparation", () => {
  const changed = fixture()
  changed.concepts[0].sources[0].gainDb = -12
  assert.throws(() => rebindAtmoShaperProductionCatalog(changed, branded), /revision/)
  const spelling = fixture()
  spelling.concepts[0].sources[0].formats[0].publicUrl = spelling.concepts[0].sources[0].formats[0].publicUrl.replace(".app/", ".app:443/")
  assert.throws(() => rebindAtmoShaperProductionCatalog(spelling, branded), /revision/)
  const rights = fixture()
  rights.rights.evidence = "Unreviewed replacement"
  rights.catalogRevision = revision(rights)
  assert.throws(() => rebindAtmoShaperProductionCatalog(rights, branded), /rights differ/)
})

test("conflicting repeated rendition metadata and wrong summary counts remain fail-closed", () => {
  for (const field of ["sha256", "byteSize", "contentType"]) {
    const conflicting = fixture()
    const format = conflicting.concepts[0].sources[1].formats[0]
    format[field] = field === "byteSize" ? 999 : field === "sha256" ? "e".repeat(64) : "audio/unknown"
    conflicting.catalogRevision = revision(conflicting)
    assert.throws(() => rebindAtmoShaperProductionCatalog(conflicting, branded), /conflicting rendition/)
  }
  for (const field of ["sourceReferenceCount", "uniquePayloadCount"]) {
    const wrongCount = fixture()
    wrongCount.summary[field] += 1
    assert.throws(() => rebindAtmoShaperProductionCatalog(wrongCount, branded), /counts differ/)
  }
})

test("only the two exact origins and checksum-addressed paths are eligible", () => {
  for (const target of ["https://other.example", branded + "/", branded + "/path", branded + ":443", "http://media.atmoshaper.com"]) {
    assert.throws(() => rebindAtmoShaperProductionCatalog(fixture(), target), /outside the prepared/)
  }
  for (const suffix of [
    "?key=invented", "#fragment", "/extra",
  ]) {
    const changed = fixture()
    changed.concepts[0].sources[0].formats[0].publicUrl += suffix
    changed.catalogRevision = revision(changed)
    assert.throws(() => rebindAtmoShaperProductionCatalog(changed, branded), /exact origin and content-addressed object|filename/)
  }
  for (const url of [
    "https://other.example/opus.ogg",
    legacy + "/atmosphere/atmoshaper/v1/audio/" + "f".repeat(64) + "/opus.ogg",
    legacy + "/other/opus.ogg",
    "https://user@media.massagelab.app/atmosphere/atmoshaper/v1/audio/" + "a".repeat(64) + "/opus.ogg",
  ]) {
    const changed = fixture()
    changed.concepts[0].sources[0].formats[0].publicUrl = url
    changed.catalogRevision = revision(changed)
    assert.throws(() => rebindAtmoShaperProductionCatalog(changed, branded), /exact origin and content-addressed object/)
  }
  const wrongBase = fixture()
  wrongBase.publishedBaseUrl = legacy + "/subpath"
  assert.throws(() => rebindAtmoShaperProductionCatalog(wrongBase, branded), /catalog base/)
})

test("metadata command plans without changing runtime data and exports only to a new local file", async () => {
  const sourcePath = new URL("../data/atmoshaper/production-audio-catalog.json", import.meta.url)
  const before = await readFile(sourcePath, "utf8")
  const plan = await prepareSignatureMediaCatalog()
  assert.equal(plan.status, "no-write-plan")
  assert.equal(plan.providerRequests, 0)
  assert.equal(plan.sourcePayloadReads, 0)
  assert.equal(plan.committedCatalogChanged, false)
  assert.equal(plan.formatReferenceCount, 1800)
  assert.equal(plan.distinctFormatObjectCount, 1640)
  assert.equal(plan.declaredDistinctFormatBytes, 6308427694)
  for (const args of [["--upload"], ["--output"], ["--output", "--upload"], ["--output", "x", "--force"]]) {
    await assert.rejects(prepareSignatureMediaCatalog(args), /Usage/)
  }

  const scratch = await mkdtemp(path.join(tmpdir(), "atmoshaper-signature-metadata-test-"))
  const output = path.join(scratch, "candidate.json")
  try {
    const written = await prepareSignatureMediaCatalog(["--output", output])
    assert.equal(written.status, "local-candidate-written")
    const candidateText = await readFile(output, "utf8")
    assert.equal(JSON.parse(candidateText).catalogRevision, plan.candidateRevision)
    await assert.rejects(prepareSignatureMediaCatalog(["--output", output]), { code: "EEXIST" })
    assert.equal(await readFile(output, "utf8"), candidateText)
    await writeFile(output, "stranded local evidence", "utf8")
    await assert.rejects(prepareSignatureMediaCatalog(["--output", output]), { code: "EEXIST" })
    assert.equal(await readFile(output, "utf8"), "stranded local evidence")
  } finally {
    await unlink(output).catch((error) => { if (error.code !== "ENOENT") throw error })
    await rmdir(scratch)
  }
  assert.equal(await readFile(sourcePath, "utf8"), before)
})
