import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { readFileSync, readdirSync } from "node:fs"
import { dirname, resolve, sep } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

import * as legalArchiveModule from "../scripts/legal-document-archive.mjs"
import {
  LEGAL_ARCHIVE_DIRECTORY,
  archiveFilenameForVersion,
  buildLegalArchives,
  parseLegalArchive,
  resolveLegalArchivePath,
} from "../scripts/legal-document-archive.mjs"

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const expectedVersions = [
  "2026-06-legal-v2",
  "2026-07-digital-purchases-v2",
]
const expectedFilenames = expectedVersions.map((version) => `${version}.json`)
const expectedKeysByVersion = {
  "2026-06-legal-v2": [
    "cookies",
    "local-first-health-wellness-data",
    "membership-billing-refunds",
    "privacy",
    "terms",
    "therapist-agreement",
  ],
  "2026-07-digital-purchases-v2": [
    "digital-purchases-refunds",
  ],
}
const expectedArchiveSha256 = {
  "2026-06-legal-v2": "8c7263b53697495f096f479484b6ccd7eae574f20111ecf0e0a44f7fd50017aa",
  "2026-07-digital-purchases-v2": "bdb76adf941e4e22022765734650d7e1224486d282d8303fa5869ee4fc25a4c8",
}

function plainDocument(document) {
  return JSON.parse(JSON.stringify(document))
}

function loadArchiveEvidence(filename, readArchive = readFileSync) {
  const archivePath = resolveLegalArchivePath(filename)
  let bytes
  try {
    bytes = readArchive(archivePath)
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error(`Missing required legal archive: ${filename}`, { cause: error })
    }
    throw error
  }
  return { archivePath, bytes, archive: parseLegalArchive(bytes) }
}

function savedArchiveEvidence() {
  return expectedFilenames.map((filename) => loadArchiveEvidence(filename))
}

test("saved v2 archives are complete, exact, and reproducible from historical evidence", () => {
  assert.deepEqual(readdirSync(LEGAL_ARCHIVE_DIRECTORY).sort(), expectedFilenames)
  const evidence = savedArchiveEvidence()
  const historicalDocuments = evidence.flatMap(({ archive }) => archive.documents)
  const first = buildLegalArchives(historicalDocuments)
  const second = buildLegalArchives(historicalDocuments)

  assert.deepEqual(
    first.map(({ documentVersion }) => documentVersion),
    expectedVersions,
  )
  assert.deepEqual(
    first.map(({ filename }) => filename),
    expectedFilenames,
  )
  assert.deepEqual(
    first.map(({ documentCount }) => documentCount),
    [6, 1],
  )
  assert.deepEqual(
    first.map(({ bytes }) => bytes),
    second.map(({ bytes }) => bytes),
  )

  const seenAcceptanceIds = new Set()
  for (const [index, entry] of first.entries()) {
    const { archive, bytes: savedBytes } = evidence[index]
    assert.equal(entry.bytes, savedBytes.toString("utf8"))
    assert.match(entry.bytes, /}\n$/)
    assert.doesNotMatch(entry.bytes, /}\n\n$/)
    assert.deepEqual(Object.keys(archive), [
      "schemaVersion",
      "documentVersion",
      "documents",
    ])
    assert.equal(archive.schemaVersion, 1)
    assert.equal(archive.documentVersion, entry.documentVersion)
    assert.deepEqual(
      archive.documents.map((document) => document.key),
      expectedKeysByVersion[entry.documentVersion],
    )
    assert.equal(
      createHash("sha256").update(savedBytes).digest("hex"),
      expectedArchiveSha256[entry.documentVersion],
    )

    for (const document of archive.documents) {
      assert.deepEqual(Object.keys(document), [
        "key",
        "slug",
        "label",
        "shortLabel",
        "route",
        "version",
        "effectiveDate",
        "summary",
        "sections",
      ])
      const acceptanceId = `${document.key}:${document.version}`
      assert.equal(seenAcceptanceIds.has(acceptanceId), false, acceptanceId)
      seenAcceptanceIds.add(acceptanceId)
    }
  }
  assert.equal(seenAcceptanceIds.size, 7)
})

test("archive evidence loader rejects missing and malformed saved evidence", () => {
  assert.throws(
    () => loadArchiveEvidence(expectedFilenames[0], () => {
      const error = new Error("missing fixture")
      error.code = "ENOENT"
      throw error
    }),
    /missing required legal archive/i,
  )
  assert.throws(
    () => loadArchiveEvidence(
      expectedFilenames[0],
      () => Buffer.from('{"schemaVersion":2}\n'),
    ),
    /schemaVersion 1/i,
  )
})

test("parsed archive records are recursively immutable", () => {
  const [{ archive }] = savedArchiveEvidence()

  assert.equal(Object.isFrozen(archive), true)
  assert.equal(Object.isFrozen(archive.documents), true)
  assert.equal(Object.isFrozen(archive.documents[0]), true)
  assert.equal(Object.isFrozen(archive.documents[0].sections), true)
  assert.equal(Object.isFrozen(archive.documents[0].sections[0]), true)
  assert.equal(Object.isFrozen(archive.documents[0].sections[0].body), true)
  assert.throws(() => {
    archive.documents[0].label = "Changed"
  }, TypeError)
})

test("build and parse reject malformed primitive fields and structurally empty records", () => {
  const evidence = savedArchiveEvidence()
  const fixtureDocuments = evidence.flatMap(({ archive }) => (
    archive.documents.map(plainDocument)
  ))
  const validArchive = JSON.parse(buildLegalArchives(fixtureDocuments)[0].bytes)
  const malformedCases = [
    ["numeric key", (document) => { document.key = 7 }],
    ["null slug", (document) => { document.slug = null }],
    ["array label", (document) => { document.label = [] }],
    ["object short label", (document) => { document.shortLabel = {} }],
    ["boolean route", (document) => { document.route = false }],
    ["empty version", (document) => { document.version = "" }],
    ["empty effective date", (document) => { document.effectiveDate = "   " }],
    ["null summary", (document) => { document.summary = null }],
    ["empty sections", (document) => { document.sections = [] }],
    ["empty section title", (document) => { document.sections[0].title = "" }],
    ["empty section body", (document) => { document.sections[0].body = [] }],
    ["object body paragraph", (document) => { document.sections[0].body[0] = {} }],
    ["empty body paragraph", (document) => { document.sections[0].body[0] = " " }],
  ]

  for (const [name, mutate] of malformedCases) {
    const archiveCandidate = JSON.parse(JSON.stringify(validArchive))
    mutate(archiveCandidate.documents[0])
    assert.throws(
      () => parseLegalArchive(`${JSON.stringify(archiveCandidate)}\n`),
      /invalid|unexpected/i,
      `parse accepted ${name}`,
    )

    const documentCandidates = fixtureDocuments.map(plainDocument)
    const matchingDocument = documentCandidates.find(
      (document) => document.key === validArchive.documents[0].key,
    )
    mutate(matchingDocument)
    assert.throws(
      () => buildLegalArchives(documentCandidates),
      /invalid|unexpected/i,
      `build accepted ${name}`,
    )
  }
})

test("parse rejects empty, misordered, and unsupported archive records", () => {
  const [{ archive }] = savedArchiveEvidence()
  const emptyArchive = plainDocument(archive)
  emptyArchive.documents = []
  assert.throws(
    () => parseLegalArchive(`${JSON.stringify(emptyArchive)}\n`),
    /non-empty documents array/i,
  )

  const misorderedArchive = {
    documentVersion: archive.documentVersion,
    schemaVersion: archive.schemaVersion,
    documents: archive.documents,
  }
  assert.throws(
    () => parseLegalArchive(`${JSON.stringify(misorderedArchive)}\n`),
    /misordered top-level keys/i,
  )

  const unsupportedArchive = plainDocument(archive)
  unsupportedArchive.documentVersion = "2026-09-legal-v3"
  unsupportedArchive.documents.forEach((document) => {
    document.version = unsupportedArchive.documentVersion
  })
  assert.throws(
    () => parseLegalArchive(`${JSON.stringify(unsupportedArchive)}\n`),
    /unexpected legal document version/i,
  )
  assert.throws(
    () => buildLegalArchives(unsupportedArchive.documents),
    /unexpected legal document version/i,
  )
})

test("archive paths accept only the two expected filenames inside the canonical directory", () => {
  for (const version of expectedVersions) {
    const filename = `${version}.json`
    assert.equal(archiveFilenameForVersion(version), filename)
    const archivePath = resolveLegalArchivePath(filename)
    assert.equal(archivePath.startsWith(`${LEGAL_ARCHIVE_DIRECTORY}${sep}`), true)
  }

  assert.throws(
    () => archiveFilenameForVersion("2026-09-legal-v3"),
    /unexpected legal document version/i,
  )
  assert.throws(
    () => archiveFilenameForVersion("toString"),
    /unexpected legal document version/i,
  )
  assert.throws(
    () => resolveLegalArchivePath("../2026-06-legal-v2.json"),
    /unexpected legal archive filename/i,
  )
  assert.throws(
    () => resolveLegalArchivePath("2026-06-legal-v2.json.backup"),
    /unexpected legal archive filename/i,
  )
})

test("retired current-registry and writer exports stay absent", () => {
  assert.equal(Object.hasOwn(legalArchiveModule, "buildCurrentLegalArchives"), false)
  assert.equal(Object.hasOwn(legalArchiveModule, "writeCurrentLegalArchives"), false)
})

test("retired --write CLI fails clearly without changing archive files", () => {
  const beforeEntries = readdirSync(LEGAL_ARCHIVE_DIRECTORY).sort()
  const beforeBytes = new Map(beforeEntries.map((filename) => [
    filename,
    readFileSync(resolve(LEGAL_ARCHIVE_DIRECTORY, filename)),
  ]))
  const result = spawnSync(
    process.execPath,
    ["scripts/legal-document-archive.mjs", "--write"],
    { cwd: repositoryRoot, encoding: "utf8" },
  )

  assert.notEqual(result.status, 0)
  assert.match(
    result.stderr,
    /legal archive generation is retired; use npm run legal:verify-archives/i,
  )
  const afterEntries = readdirSync(LEGAL_ARCHIVE_DIRECTORY).sort()
  assert.deepEqual(afterEntries, beforeEntries)
  for (const filename of afterEntries) {
    assert.deepEqual(
      readFileSync(resolve(LEGAL_ARCHIVE_DIRECTORY, filename)),
      beforeBytes.get(filename),
    )
  }
})

test("package exposes only the read-only legal archive verifier", () => {
  const packageJson = JSON.parse(
    readFileSync(resolve(repositoryRoot, "package.json"), "utf8"),
  )
  assert.equal(
    packageJson.scripts["legal:verify-archives"],
    "node --test tests/legal-document-archive.test.mjs",
  )
  assert.equal(Object.hasOwn(packageJson.scripts, "legal:archive-current"), false)
})
