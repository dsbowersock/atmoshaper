import { randomUUID } from "node:crypto"
import {
  existsSync,
  linkSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs"
import { dirname, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"

import { LEGAL_DOCUMENTS } from "../lib/legal-documents.js"

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")

export const LEGAL_ARCHIVE_DIRECTORY = resolve(
  repositoryRoot,
  "data/legal-document-history",
)

const EXPECTED_ARCHIVE_FILENAMES = Object.freeze({
  "2026-06-legal-v2": "2026-06-legal-v2.json",
  "2026-07-digital-purchases-v2": "2026-07-digital-purchases-v2.json",
})

const DOCUMENT_KEYS = Object.freeze([
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

const compareText = (left, right) => left < right ? -1 : left > right ? 1 : 0

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const entry of Object.values(value)) deepFreeze(entry)
    Object.freeze(value)
  }
  return value
}

function validateLegalDocumentRecord(document, documentVersion) {
  if (
    !document ||
    typeof document !== "object" ||
    Array.isArray(document) ||
    Object.keys(document).join(",") !== DOCUMENT_KEYS.join(",") ||
    !isNonEmptyString(document.key) ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(document.key) ||
    !isNonEmptyString(document.slug) ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(document.slug) ||
    !isNonEmptyString(document.label) ||
    !isNonEmptyString(document.shortLabel) ||
    !isNonEmptyString(document.route) ||
    document.route !== `/legal/${document.slug}` ||
    !isNonEmptyString(document.version) ||
    document.version !== documentVersion ||
    !isNonEmptyString(document.effectiveDate) ||
    !isNonEmptyString(document.summary) ||
    !Array.isArray(document.sections) ||
    document.sections.length === 0
  ) {
    throw new Error("Legal archive contains an invalid document record")
  }

  for (const section of document.sections) {
    if (
      !section ||
      typeof section !== "object" ||
      Array.isArray(section) ||
      Object.keys(section).join(",") !== "title,body" ||
      !isNonEmptyString(section.title) ||
      !Array.isArray(section.body) ||
      section.body.length === 0 ||
      section.body.some((paragraph) => !isNonEmptyString(paragraph))
    ) {
      throw new Error("Legal archive contains an invalid section record")
    }
  }
  return document
}

function copyLegalDocument(document) {
  return {
    key: document.key,
    slug: document.slug,
    label: document.label,
    shortLabel: document.shortLabel,
    route: document.route,
    version: document.version,
    effectiveDate: document.effectiveDate,
    summary: document.summary,
    sections: document.sections.map((section) => ({
      title: section.title,
      body: [...section.body],
    })),
  }
}

export function archiveFilenameForVersion(documentVersion) {
  if (!Object.hasOwn(EXPECTED_ARCHIVE_FILENAMES, documentVersion)) {
    throw new Error(`Unexpected legal document version: ${documentVersion}`)
  }
  return EXPECTED_ARCHIVE_FILENAMES[documentVersion]
}

/** Resolve one expected archive filename while refusing every escaping or lookalike path. */
export function resolveLegalArchivePath(filename) {
  if (!Object.values(EXPECTED_ARCHIVE_FILENAMES).includes(filename)) {
    throw new Error(`Unexpected legal archive filename: ${filename}`)
  }
  const archivePath = resolve(LEGAL_ARCHIVE_DIRECTORY, filename)
  if (!archivePath.startsWith(`${LEGAL_ARCHIVE_DIRECTORY}${sep}`)) {
    throw new Error("Legal archive path escapes the canonical archive directory")
  }
  return archivePath
}

function validateArchiveRecord(archive) {
  if (
    !archive ||
    typeof archive !== "object" ||
    Array.isArray(archive) ||
    archive.schemaVersion !== 1 ||
    !Array.isArray(archive.documents) ||
    archive.documents.length === 0
  ) {
    throw new Error("Legal archive must use schemaVersion 1 and a non-empty documents array")
  }
  if (
    Object.keys(archive).join(",") !==
    "schemaVersion,documentVersion,documents"
  ) {
    throw new Error("Legal archive has unexpected or misordered top-level keys")
  }
  archiveFilenameForVersion(archive.documentVersion)

  const seen = new Set()
  let previousKey = null
  for (const document of archive.documents) {
    validateLegalDocumentRecord(document, archive.documentVersion)
    if (previousKey !== null && compareText(previousKey, document.key) >= 0) {
      throw new Error("Legal archive documents must use unique sorted keys")
    }
    const acceptanceId = `${document.key}:${document.version}`
    if (seen.has(acceptanceId)) {
      throw new Error(`Duplicate legal archive acceptance ID: ${acceptanceId}`)
    }
    seen.add(acceptanceId)
    previousKey = document.key
  }
  return archive
}

export function parseLegalArchive(bytes) {
  const archive = JSON.parse(Buffer.isBuffer(bytes) ? bytes.toString("utf8") : bytes)
  return deepFreeze(validateArchiveRecord(archive))
}

function serializeLegalArchive(archive) {
  validateArchiveRecord(archive)
  return `${JSON.stringify(archive, null, 2)}\n`
}

/** Build exact deterministic snapshots from an explicitly supplied legal registry. */
export function buildLegalArchives(documents) {
  if (!Array.isArray(documents) || documents.length === 0) {
    throw new Error("Legal archive source must be a non-empty documents array")
  }
  const groupedDocuments = new Map()
  for (const document of documents) {
    if (!isNonEmptyString(document?.version)) {
      throw new Error("Legal archive contains an invalid document record")
    }
    archiveFilenameForVersion(document.version)
    validateLegalDocumentRecord(document, document.version)
    const group = groupedDocuments.get(document.version) ?? []
    group.push(copyLegalDocument(document))
    groupedDocuments.set(document.version, group)
  }

  const archives = Object.keys(EXPECTED_ARCHIVE_FILENAMES)
    .sort(compareText)
    .map((documentVersion) => {
      const documents = (groupedDocuments.get(documentVersion) ?? [])
        .sort((left, right) => compareText(left.key, right.key))
      if (documents.length === 0) {
        throw new Error(`No current documents use legal version: ${documentVersion}`)
      }
      const archive = {
        schemaVersion: 1,
        documentVersion,
        documents,
      }
      const bytes = serializeLegalArchive(archive)
      parseLegalArchive(bytes)
      return {
        documentVersion,
        filename: archiveFilenameForVersion(documentVersion),
        documentCount: documents.length,
        bytes,
      }
    })

  return deepFreeze(archives)
}

/** Build snapshots from the current runtime registry without writing files. */
export function buildCurrentLegalArchives() {
  return buildLegalArchives(LEGAL_DOCUMENTS)
}

function resolveStagedArchivePath(filename) {
  resolveLegalArchivePath(filename)
  const stagedFilename = (
    `.${filename}.atmoshaper-archive-${process.pid}-${randomUUID()}.tmp`
  )
  const stagedPath = resolve(LEGAL_ARCHIVE_DIRECTORY, stagedFilename)
  if (!stagedPath.startsWith(`${LEGAL_ARCHIVE_DIRECTORY}${sep}`)) {
    throw new Error("Staged legal archive path escapes the canonical archive directory")
  }
  return stagedPath
}

function removeOwnedStagedArchive(stagedPath) {
  try {
    unlinkSync(stagedPath)
  } catch (error) {
    if (error?.code !== "ENOENT") throw error
  }
}

/**
 * Publish a complete same-directory staged file through an atomic no-replace hard link.
 * A race-created final file is accepted only when its bytes are identical.
 */
function publishArchiveAtomically(archive) {
  const archivePath = resolveLegalArchivePath(archive.filename)
  const stagedPath = resolveStagedArchivePath(archive.filename)
  let ownsStagedPath = false

  try {
    try {
      writeFileSync(stagedPath, archive.bytes, { flag: "wx" })
      ownsStagedPath = true
    } catch (error) {
      if (error?.code !== "EEXIST") ownsStagedPath = true
      throw error
    }

    try {
      linkSync(stagedPath, archivePath)
    } catch (error) {
      if (error?.code !== "EEXIST") throw error
      const raceCreatedBytes = readFileSync(archivePath)
      if (!raceCreatedBytes.equals(Buffer.from(archive.bytes))) {
        throw new Error(`Refusing to overwrite differing legal archive: ${archive.filename}`)
      }
    }
  } finally {
    if (ownsStagedPath) removeOwnedStagedArchive(stagedPath)
  }
}

/**
 * Write only missing canonical archives after proving every existing file is byte-identical.
 * A differing historical file is never overwritten.
 */
export function writeCurrentLegalArchives() {
  const archives = buildCurrentLegalArchives()
  const writes = []

  for (const archive of archives) {
    const archivePath = resolveLegalArchivePath(archive.filename)
    if (!existsSync(archivePath)) {
      writes.push({ ...archive, archivePath })
      continue
    }
    const existing = readFileSync(archivePath)
    if (!existing.equals(Buffer.from(archive.bytes))) {
      throw new Error(`Refusing to overwrite differing legal archive: ${archive.filename}`)
    }
  }

  mkdirSync(LEGAL_ARCHIVE_DIRECTORY, { recursive: true })
  for (const archive of writes) {
    publishArchiveAtomically(archive)
  }
  return archives
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null
if (invokedPath === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 3 || process.argv[2] !== "--write") {
    throw new Error("Usage: node scripts/legal-document-archive.mjs --write")
  }
  writeCurrentLegalArchives()
}
