import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { lstatSync, readFileSync } from "node:fs"
import { extname, resolve, sep } from "node:path"

const compareText = (left, right) => left < right ? -1 : left > right ? 1 : 0
const sha256 = (value) => createHash("sha256").update(value).digest("hex")

/** Canonical order for persisted and reported occurrence identities. */
function compareOccurrence(left, right) {
  return (
    compareText(left.path, right.path) ||
    left.line - right.line ||
    left.column - right.column ||
    compareText(left.textSha256, right.textSha256) ||
    compareText(left.category ?? "", right.category ?? "")
  )
}

export function normalizeRepoPath(value) {
  return String(value).replaceAll("\\", "/").replace(/^\.\//, "")
}

export function stableJson(value) {
  if (Array.isArray(value)) return value.map(stableJson)
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => compareText(left, right))
        .map(([key, entry]) => [key, stableJson(entry)]),
    )
  }
  return value
}

export function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf8"))
}

export function listTrackedFiles(root, execFile = execFileSync) {
  const output = execFile("git", ["ls-files", "-z"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
  })
  return output
    .split("\0")
    .filter(Boolean)
    .map(normalizeRepoPath)
    .sort(compareText)
}

/** Read canonical stage-0 blob identities directly from the Git index. */
export function listTrackedIndexEntries(root, execFile = execFileSync) {
  const output = execFile("git", ["ls-files", "-s", "-z"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
  })
  const entries = output.split("\0").filter(Boolean).map((record) => {
    const match = /^(\d{6}) ([a-f0-9]+) (\d)\t([\s\S]+)$/.exec(record)
    if (!match) throw new Error("Git index contains an invalid tracked entry")
    const [, mode, oid, stage, rawPath] = match
    if (stage !== "0") throw new Error("Git index contains an unmerged tracked entry")
    return { path: normalizeRepoPath(rawPath), mode, oid }
  }).sort((left, right) => compareText(left.path, right.path))

  const duplicate = entries.find((entry, index) => (
    index > 0 && entry.path === entries[index - 1].path
  ))
  if (duplicate) throw new Error("Git index contains duplicate tracked paths")
  return entries
}

function pathMatches(path, candidate) {
  const normalizedPath = normalizeRepoPath(path).toLowerCase()
  const normalizedCandidate = normalizeRepoPath(candidate).toLowerCase()
  return normalizedCandidate.endsWith("/")
    ? normalizedPath.startsWith(normalizedCandidate)
    : normalizedPath === normalizedCandidate
}

export function assertPrivatePathsAbsent(paths, forbiddenPatterns) {
  const forbidden = paths.filter((path) => (
    forbiddenPatterns.some((candidate) => pathMatches(path, normalizeRepoPath(candidate)))
  ))
  if (forbidden.length > 0) {
    throw new Error(`Forbidden tracked paths: ${forbidden.join(", ")}`)
  }
}

/** Resolve a normalized Git path while refusing paths that escape the repository root. */
function resolveTrackedPath(root, path) {
  const absoluteRoot = resolve(root)
  const absolutePath = resolve(absoluteRoot, ...normalizeRepoPath(path).split("/"))
  if (absolutePath !== absoluteRoot && !absolutePath.startsWith(`${absoluteRoot}${sep}`)) {
    throw new Error(`Tracked path escapes repository root: ${path}`)
  }
  return absolutePath
}

function trackedFileRecord(root, path) {
  const absolutePath = resolveTrackedPath(root, path)
  const stat = lstatSync(absolutePath)
  if (!stat.isFile()) return { path, bytes: stat.size, text: null }
  return { path, bytes: stat.size, text: readFileSync(absolutePath, "utf8") }
}

/** Return the source identifier beginning at one legacy match, never a neighboring token. */
function identifierAtLegacyMatch(sourceLine, matchIndex) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*/.exec(sourceLine.slice(matchIndex))?.[0] ?? null
}

export function buildRepositoryInventory(root, policy, execFile = execFileSync) {
  const entries = listTrackedIndexEntries(root, execFile)
  const paths = entries.map((entry) => entry.path)
  assertPrivatePathsAbsent(paths, policy.forbiddenTrackedPaths)
  const metadata = execFile(
    "git",
    ["cat-file", "--batch-check=%(objectname) %(objecttype) %(objectsize)"],
    {
      cwd: root,
      encoding: "utf8",
      input: entries.map((entry) => entry.oid).join("\n") + (entries.length ? "\n" : ""),
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    },
  ).split(/\r?\n/).filter(Boolean)
  if (metadata.length !== entries.length) {
    throw new Error("Git index blob metadata count mismatch")
  }
  const byTopLevel = {}
  const byExtension = {}
  let totalTrackedBytes = 0
  const fingerprintRows = []
  for (let index = 0; index < entries.length; index += 1) {
    const { path, oid } = entries[index]
    const match = /^([a-f0-9]+) ([^ ]+) (\d+)$/.exec(metadata[index])
    if (!match || match[1] !== oid || match[2] !== "blob") {
      throw new Error("Git index entry does not resolve to a blob")
    }
    const bytes = Number(match[3])
    if (!Number.isSafeInteger(bytes) || bytes < 0) {
      throw new Error("Git index blob has an invalid size")
    }
    totalTrackedBytes += bytes
    const topLevel = path.split("/")[0]
    const extension = extname(path).toLowerCase() || "[none]"
    byTopLevel[topLevel] = (byTopLevel[topLevel] ?? 0) + 1
    byExtension[extension] = (byExtension[extension] ?? 0) + 1
    fingerprintRows.push(`${path}\0${oid}\0${bytes}\n`)
  }
  return stableJson({
    schemaVersion: policy.schemaVersion,
    trackedFileCount: paths.length,
    totalTrackedBytes,
    byTopLevel,
    byExtension,
    forbiddenTrackedPaths: [],
    inventorySha256: sha256(fingerprintRows.join("")),
  })
}

export function collectLegacyReferences(root, paths, policy) {
  const allowedExtensions = new Set(policy.textExtensions.map((value) => value.toLowerCase()))
  const matcher = new RegExp(policy.legacyPattern, "gi")
  const references = []
  for (const path of paths) {
    if (!allowedExtensions.has(extname(path).toLowerCase())) continue
    const record = trackedFileRecord(root, path)
    if (record.text === null) continue
    const lines = record.text.split(/\r?\n/)
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      const sourceLine = lines[lineIndex]
      matcher.lastIndex = 0
      for (let match = matcher.exec(sourceLine); match; match = matcher.exec(sourceLine)) {
        references.push({
          path,
          line: lineIndex + 1,
          column: match.index + 1,
          matchText: match[0],
          textSha256: sha256(sourceLine.trimEnd()),
          sourceLine,
          identifierAtMatch: identifierAtLegacyMatch(sourceLine, match.index),
        })
      }
    }
  }
  return references.sort(compareOccurrence)
}

export function classifyCandidate(reference, policy) {
  for (const rule of policy.candidateRules) {
    const pathMatch = (rule.pathPrefixes ?? []).some((prefix) => (
      pathMatches(reference.path, prefix)
    ))
    if (pathMatch) return rule.category
  }
  const occurrenceStart = reference.column - 1
  const occurrenceEnd = occurrenceStart + (reference.matchText?.length ?? 0)
  for (const rule of policy.candidateRules) {
    const lineMatch = Number.isInteger(occurrenceStart) && occurrenceEnd > occurrenceStart &&
      (rule.linePatterns ?? []).some((pattern) => {
        const matcher = new RegExp(pattern, "gi")
        for (
          let match = matcher.exec(reference.sourceLine);
          match;
          match = matcher.exec(reference.sourceLine)
        ) {
          if (
            match.index <= occurrenceStart &&
            match.index + match[0].length >= occurrenceEnd
          ) return true
          if (match[0].length === 0) matcher.lastIndex += 1
        }
        return false
      })
    if (lineMatch) return rule.category
  }
  const identifierMatch = (policy.compatibilityIdentifierPatterns ?? []).some((pattern) => (
    new RegExp(`^(?:${pattern})$`).test(reference.identifierAtMatch ?? "")
  ))
  if (identifierMatch) {
    return "compatibility"
  }
  return "pre-rebrand-public-copy"
}

function referenceKey(reference) {
  return [reference.path, reference.line, reference.column, reference.textSha256].join(":")
}

export function toBaselineEntry(reference, category) {
  return {
    path: reference.path,
    line: reference.line,
    column: reference.column,
    textSha256: reference.textSha256,
    category,
  }
}

export function validateBaseline(baseline, policy) {
  const topLevelKeys = Object.keys(baseline ?? {})
  const unknownTopLevel = topLevelKeys.find((key) => (
    !["schemaVersion", "sourceCommit", "entries"].includes(key)
  ))
  if (unknownTopLevel) throw new Error("Brand-reference baseline has an unknown top-level field")
  if (
    baseline?.schemaVersion !== 1 ||
    !/^[a-f0-9]{40}$/.test(baseline?.sourceCommit ?? "") ||
    !Array.isArray(baseline.entries)
  ) {
    throw new Error("Brand-reference baseline must use schemaVersion 1, an exact sourceCommit, and an entries array")
  }
  const categories = new Set(policy.allowedCategories)
  const seen = new Set()
  let previousEntry = null
  for (const entry of baseline.entries) {
    const unknownEntryField = Object.keys(entry ?? {}).find((key) => (
      !["path", "line", "column", "textSha256", "category"].includes(key)
    ))
    if (unknownEntryField) throw new Error("Brand-reference baseline has an unknown entry field")
    if (!categories.has(entry.category)) throw new Error(`Invalid legacy category: ${entry.category}`)
    const pathSegments = typeof entry.path === "string" ? entry.path.split("/") : []
    if (
      typeof entry.path !== "string" ||
      entry.path.length === 0 ||
      normalizeRepoPath(entry.path) !== entry.path ||
      entry.path.startsWith("/") ||
      /^[a-z]:/i.test(entry.path) ||
      entry.path.endsWith("/") ||
      pathSegments.some((segment) => segment === "" || segment === "." || segment === "..") ||
      !Number.isInteger(entry.line) || entry.line < 1 ||
      !Number.isInteger(entry.column) || entry.column < 1
    ) {
      throw new Error("Legacy baseline entries require a normalized path and positive line/column")
    }
    if (!/^[a-f0-9]{64}$/.test(entry.textSha256 ?? "")) {
      throw new Error(`Invalid line hash for ${entry.path ?? "unknown path"}`)
    }
    const key = referenceKey(entry)
    if (seen.has(key)) throw new Error(`Duplicate legacy baseline entry: ${key}`)
    seen.add(key)
    if (previousEntry && compareOccurrence(previousEntry, entry) > 0) {
      throw new Error("Brand-reference baseline entries must use deterministic occurrence order")
    }
    previousEntry = entry
  }
}

export function verifyLegacyReferenceBaseline(actual, baseline, policy) {
  validateBaseline(baseline, policy)
  const actualByKey = new Map(actual.map((entry) => [referenceKey(entry), entry]))
  const baselineByKey = new Map(baseline.entries.map((entry) => [referenceKey(entry), entry]))
  const unclassified = actual
    .filter((entry) => !baselineByKey.has(referenceKey(entry)))
    .map((entry) => toBaselineEntry(entry, "unclassified"))
    .sort(compareOccurrence)
  const missing = baseline.entries
    .filter((entry) => !actualByKey.has(referenceKey(entry)))
    .map((entry) => toBaselineEntry(entry, entry.category))
    .sort(compareOccurrence)
  return { missing, unclassified }
}
