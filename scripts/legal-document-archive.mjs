import { dirname, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"

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

/** Build deterministic v2 snapshots from a supplied historical legal registry. */
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
        throw new Error(
          `No supplied historical documents use legal version: ${documentVersion}`,
        )
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

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null
if (invokedPath === fileURLToPath(import.meta.url)) {
  throw new Error(
    "Legal archive generation is retired; use npm run legal:verify-archives",
  )
}
