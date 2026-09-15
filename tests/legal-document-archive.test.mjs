import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve, sep } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

import { LEGAL_DOCUMENTS } from "../lib/legal-documents.js"
import {
  LEGAL_ARCHIVE_DIRECTORY,
  archiveFilenameForVersion,
  buildLegalArchives,
  buildCurrentLegalArchives,
  parseLegalArchive,
  resolveLegalArchivePath,
} from "../scripts/legal-document-archive.mjs"

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const expectedVersions = [
  "2026-06-legal-v2",
  "2026-07-digital-purchases-v2",
]
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

function archivedFixtureDocuments() {
  const archivePaths = expectedVersions.map((version) => (
    resolve(repositoryRoot, `data/legal-document-history/${version}.json`)
  ))
  if (!archivePaths.every(existsSync)) return LEGAL_DOCUMENTS.map(plainDocument)
  return archivePaths.flatMap((path) => parseLegalArchive(readFileSync(path)).documents)
}

function createArchiveFixture(t) {
  const root = mkdtempSync(join(tmpdir(), "atmoshaper-legal-archive-"))
  mkdirSync(resolve(root, "scripts"), { recursive: true })
  mkdirSync(resolve(root, "lib"), { recursive: true })
  copyFileSync(
    resolve(repositoryRoot, "scripts/legal-document-archive.mjs"),
    resolve(root, "scripts/legal-document-archive.mjs"),
  )
  writeFileSync(
    resolve(root, "lib/legal-documents.js"),
    `export const LEGAL_DOCUMENTS = ${JSON.stringify(archivedFixtureDocuments())}\n`,
  )
  writeFileSync(resolve(root, "package.json"), '{"type":"module"}\n')
  t.after(() => rmSync(root, { recursive: true, force: true }))
  return root
}

function runArchive(root, preloadPath = null) {
  const args = []
  if (preloadPath) args.push("--require", preloadPath)
  args.push("scripts/legal-document-archive.mjs", "--write")
  return spawnSync(process.execPath, args, { cwd: root, encoding: "utf8" })
}

function archiveDirectoryEntries(root) {
  const archiveDirectory = resolve(root, "data/legal-document-history")
  return existsSync(archiveDirectory) ? readdirSync(archiveDirectory).sort() : []
}

test("archive bytes deterministically preserve the exact current v2 documents by version", () => {
  const fixtureDocuments = archivedFixtureDocuments()
  const first = buildLegalArchives(fixtureDocuments)
  const second = buildLegalArchives(fixtureDocuments)

  assert.deepEqual(
    first.map(({ documentVersion }) => documentVersion),
    expectedVersions,
  )
  assert.deepEqual(
    first.map(({ filename }) => filename),
    expectedVersions.map((version) => `${version}.json`),
  )
  assert.deepEqual(
    first.map(({ bytes }) => bytes),
    second.map(({ bytes }) => bytes),
  )

  const seenAcceptanceIds = new Set()
  for (const { documentVersion, bytes } of first) {
    assert.match(bytes, /}\n$/)
    assert.doesNotMatch(bytes, /}\n\n$/)

    const archive = parseLegalArchive(bytes)
    const expectedDocuments = expectedKeysByVersion[documentVersion].map((key) => (
      plainDocument(fixtureDocuments.find((document) => document.key === key))
    ))

    assert.deepEqual(Object.keys(archive), [
      "schemaVersion",
      "documentVersion",
      "documents",
    ])
    assert.equal(archive.schemaVersion, 1)
    assert.equal(archive.documentVersion, documentVersion)
    assert.deepEqual(archive.documents, expectedDocuments)
    assert.deepEqual(
      archive.documents.map((document) => document.key),
      expectedKeysByVersion[documentVersion],
    )

    for (const document of archive.documents) {
      const acceptanceId = `${document.key}:${document.version}`
      assert.equal(seenAcceptanceIds.has(acceptanceId), false, acceptanceId)
      seenAcceptanceIds.add(acceptanceId)
    }
  }

  assert.equal(first[0].documentCount, 6)
  assert.equal(first[1].documentCount, 1)
  assert.equal(seenAcceptanceIds.size, 7)

  const currentVersions = [...new Set(LEGAL_DOCUMENTS.map((document) => document.version))].sort()
  if (currentVersions.join(",") === expectedVersions.join(",")) {
    assert.deepEqual(
      buildCurrentLegalArchives().map(({ bytes }) => bytes),
      first.map(({ bytes }) => bytes),
    )
  }

  for (const { documentVersion, filename, bytes } of first) {
    const archivePath = resolve(repositoryRoot, "data/legal-document-history", filename)
    if (!existsSync(archivePath)) continue
    assert.equal(readFileSync(archivePath, "utf8"), bytes)
    assert.equal(
      createHash("sha256").update(bytes).digest("hex"),
      expectedArchiveSha256[documentVersion],
    )
  }
})

test("parsed archive records are recursively immutable", () => {
  const [archiveEntry] = buildLegalArchives(archivedFixtureDocuments())
  const archive = parseLegalArchive(archiveEntry.bytes)

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
  const fixtureDocuments = archivedFixtureDocuments()
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

test("parse rejects an otherwise-valid archive with an empty documents array", () => {
  const validArchive = JSON.parse(
    buildLegalArchives(archivedFixtureDocuments())[0].bytes,
  )
  validArchive.documents = []

  assert.throws(
    () => parseLegalArchive(`${JSON.stringify(validArchive)}\n`),
    /non-empty documents array/i,
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

test("write mode accepts byte-identical reruns and refuses a differing overwrite", (t) => {
  const root = createArchiveFixture(t)

  const firstRun = runArchive(root)
  assert.equal(firstRun.status, 0, firstRun.stderr)
  assert.equal(firstRun.stderr, "")

  const archiveDirectory = resolve(root, "data/legal-document-history")
  assert.deepEqual(readdirSync(archiveDirectory).sort(), [
    "2026-06-legal-v2.json",
    "2026-07-digital-purchases-v2.json",
  ])
  const initialBytes = Object.fromEntries(
    readdirSync(archiveDirectory).map((filename) => [
      filename,
      readFileSync(resolve(archiveDirectory, filename)),
    ]),
  )

  const secondRun = runArchive(root)
  assert.equal(secondRun.status, 0, secondRun.stderr)
  for (const [filename, bytes] of Object.entries(initialBytes)) {
    assert.deepEqual(readFileSync(resolve(archiveDirectory, filename)), bytes)
  }

  const protectedPath = resolve(archiveDirectory, "2026-06-legal-v2.json")
  const unexpectedBytes = Buffer.from('{"unexpected":true}\n')
  writeFileSync(protectedPath, unexpectedBytes)
  const rejectedRun = runArchive(root)

  assert.notEqual(rejectedRun.status, 0)
  assert.match(rejectedRun.stderr, /refusing to overwrite/i)
  assert.deepEqual(readFileSync(protectedPath), unexpectedBytes)
  assert.deepEqual(
    archiveDirectoryEntries(root).filter((name) => name.includes(".atmoshaper-archive-")),
    [],
  )
})

test("a staged write failure leaves no canonical or task-owned temporary archive", (t) => {
  const root = createArchiveFixture(t)
  const preloadPath = resolve(root, "fail-staged-write.cjs")
  writeFileSync(preloadPath, `
const fs = require("node:fs")
const originalWriteFileSync = fs.writeFileSync
fs.writeFileSync = function (path, data, options) {
  if (
    typeof path === "string" &&
    path.includes(".atmoshaper-archive-") &&
    path.endsWith(".tmp")
  ) {
    const bytes = Buffer.isBuffer(data) ? data : Buffer.from(data)
    originalWriteFileSync.call(fs, path, bytes.subarray(0, 16), options)
    const error = new Error("injected staged write failure")
    error.code = "EIO"
    throw error
  }
  return originalWriteFileSync.apply(fs, arguments)
}
require("node:module").syncBuiltinESMExports()
`)

  const result = runArchive(root, preloadPath)

  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /injected staged write failure/i)
  assert.deepEqual(archiveDirectoryEntries(root), [])
})

test("an identical race-created final archive is accepted and its staged file is cleaned", (t) => {
  const root = createArchiveFixture(t)
  const markerPath = resolve(root, "race-injected.txt")
  const preloadPath = resolve(root, "identical-race.cjs")
  writeFileSync(preloadPath, `
const fs = require("node:fs")
const originalLinkSync = fs.linkSync
let injected = false
fs.linkSync = function (stagedPath, finalPath) {
  if (!injected && String(stagedPath).includes(".atmoshaper-archive-")) {
    injected = true
    fs.writeFileSync(${JSON.stringify(markerPath)}, "injected")
    fs.writeFileSync(finalPath, fs.readFileSync(stagedPath), { flag: "wx" })
  }
  return originalLinkSync.apply(fs, arguments)
}
require("node:module").syncBuiltinESMExports()
`)

  const result = runArchive(root, preloadPath)

  assert.equal(result.status, 0, result.stderr)
  assert.equal(readFileSync(markerPath, "utf8"), "injected")
  assert.deepEqual(archiveDirectoryEntries(root), [
    "2026-06-legal-v2.json",
    "2026-07-digital-purchases-v2.json",
  ])
  assert.deepEqual(
    archiveDirectoryEntries(root).filter((name) => name.includes(".atmoshaper-archive-")),
    [],
  )
})

test("a differing race-created final archive is preserved and its staged file is cleaned", (t) => {
  const root = createArchiveFixture(t)
  const markerPath = resolve(root, "race-injected.txt")
  const preloadPath = resolve(root, "differing-race.cjs")
  const unexpectedBytes = Buffer.from('{"race":"different"}\n')
  writeFileSync(preloadPath, `
const fs = require("node:fs")
const originalLinkSync = fs.linkSync
let injected = false
fs.linkSync = function (stagedPath, finalPath) {
  if (!injected && String(stagedPath).includes(".atmoshaper-archive-")) {
    injected = true
    fs.writeFileSync(${JSON.stringify(markerPath)}, "injected")
    fs.writeFileSync(finalPath, Buffer.from('{"race":"different"}\\n'), { flag: "wx" })
  }
  return originalLinkSync.apply(fs, arguments)
}
require("node:module").syncBuiltinESMExports()
`)

  const result = runArchive(root, preloadPath)
  const protectedPath = resolve(
    root,
    "data/legal-document-history/2026-06-legal-v2.json",
  )

  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /refusing to overwrite/i)
  assert.equal(readFileSync(markerPath, "utf8"), "injected")
  assert.deepEqual(readFileSync(protectedPath), unexpectedBytes)
  assert.deepEqual(
    archiveDirectoryEntries(root).filter((name) => name.includes(".atmoshaper-archive-")),
    [],
  )
})
