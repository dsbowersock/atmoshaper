import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { extname, isAbsolute, posix, relative, resolve, sep } from "node:path"

import {
  assertPrivatePathsAbsent,
  listTrackedIndexEntries,
  normalizeRepoPath,
  stableJson,
} from "./core.mjs"

const POLICY_FIELDS = [
  "assetExtensions", "assetRoots", "configurationManifestOwnership",
  "environmentDeclarationPaths", "forbiddenTrackedPaths", "frameworkRoots",
  "ignoredPathPrefixes", "manualToolSources", "packageScriptCliOwnership",
  "protectedPathPrefixes", "schemaVersion", "scopes", "sourceExtensions",
  "stylesheetExtensions", "textExtensions", "topLevelConfigRoots",
]
const SCOPE_NAMES = ["runtime", "tool", "test", "doc"]
const FRAMEWORK_FIELDS = ["directoryPrefixes", "fileBasenames"]
const CONFIGURATION_OWNERSHIP_FIELDS = ["kind", "manifestIdentity", "ownerPath", "packageName"]
const MANIFEST_IDENTITY_FIELDS = ["property", "value"]
const INDEX_READ_MAX_BUFFER = 128 * 1024 * 1024
const indexInternals = new WeakMap()

export const compareText = (left, right) => left < right ? -1 : left > right ? 1 : 0
export const sha256 = (value) => createHash("sha256").update(value).digest("hex")

/** Match exact and numbered Next metadata owners under policy-approved app roots. */
export function isFrameworkConventionPath(path, policy) {
  if (!policy.frameworkRoots.directoryPrefixes.some((prefix) => path.startsWith(prefix))) return false
  const basename = posix.basename(path, extname(path))
  const numberedMetadata = /^(?:apple-icon|icon|opengraph-image|twitter-image)[0-9]$/.test(basename)
  return policy.frameworkRoots.fileBasenames.includes(basename) || numberedMetadata
}

export function auditError(code) {
  const error = new Error(code)
  error.code = code
  return error
}

function assertExactFields(value, expected, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw auditError(code)
  const keys = Object.keys(value).sort(compareText)
  const wanted = [...expected].sort(compareText)
  if (keys.length !== wanted.length || keys.some((key, index) => key !== wanted[index])) {
    throw auditError(code)
  }
}

function isNormalizedPolicyPath(value, { prefix = false } = {}) {
  if (typeof value !== "string" || value.length === 0) return false
  if (normalizeRepoPath(value) !== value || value.startsWith("/") || /^[a-z]:/i.test(value)) return false
  if (prefix && !value.endsWith("/")) return false
  if (!prefix && value.endsWith("/")) return false
  const comparable = prefix ? value.slice(0, -1) : value
  return !comparable.split("/").some((segment) => segment === "" || segment === "." || segment === "..")
}

function assertUniqueStrings(values, code, options = {}) {
  if (!Array.isArray(values) || (!options.allowEmpty && values.length === 0)) throw auditError(code)
  const seen = new Set()
  for (const value of values) {
    const valid = options.extension
      ? typeof value === "string" && /^\.[a-z0-9]+$/.test(value)
      : options.basename
        ? typeof value === "string" && /^[a-z0-9][a-z0-9-]*$/.test(value)
        : isNormalizedPolicyPath(value, { prefix: options.prefix })
    if (!valid || seen.has(value)) throw auditError(code)
    seen.add(value)
  }
}

/** Validate the complete schema-v1 cleanup policy without echoing rejected input. */
export function validateCleanupPolicy(policy) {
  assertExactFields(policy, POLICY_FIELDS, "CLEANUP_POLICY_INVALID")
  if (policy.schemaVersion !== 1) throw auditError("CLEANUP_POLICY_INVALID")
  assertUniqueStrings(policy.sourceExtensions, "CLEANUP_POLICY_INVALID", { extension: true })
  assertUniqueStrings(policy.textExtensions, "CLEANUP_POLICY_INVALID", { extension: true })
  if (policy.sourceExtensions.some((extension) => !policy.textExtensions.includes(extension))) {
    throw auditError("CLEANUP_POLICY_INVALID")
  }
  assertUniqueStrings(policy.stylesheetExtensions, "CLEANUP_POLICY_INVALID", { extension: true })
  // Stylesheets retain text asset references but must never enter the JS/TS parser.
  if (policy.stylesheetExtensions.some((extension) => (
    !policy.textExtensions.includes(extension) || policy.sourceExtensions.includes(extension)
  ))) throw auditError("CLEANUP_POLICY_INVALID")
  assertExactFields(policy.scopes, SCOPE_NAMES, "CLEANUP_POLICY_INVALID")
  const seenScopeRoots = new Set()
  for (const scope of SCOPE_NAMES) {
    if (!Array.isArray(policy.scopes[scope]) || policy.scopes[scope].length === 0) {
      throw auditError("CLEANUP_POLICY_INVALID")
    }
    for (const root of policy.scopes[scope]) {
      if (!isNormalizedPolicyPath(root, { prefix: root.endsWith("/") }) || seenScopeRoots.has(root)) {
        throw auditError("CLEANUP_POLICY_INVALID")
      }
      seenScopeRoots.add(root)
    }
  }
  assertExactFields(policy.frameworkRoots, FRAMEWORK_FIELDS, "CLEANUP_POLICY_INVALID")
  assertUniqueStrings(policy.frameworkRoots.directoryPrefixes, "CLEANUP_POLICY_INVALID", { prefix: true })
  assertUniqueStrings(policy.frameworkRoots.fileBasenames, "CLEANUP_POLICY_INVALID", { basename: true })
  assertUniqueStrings(policy.topLevelConfigRoots, "CLEANUP_POLICY_INVALID")
  if (!Array.isArray(policy.configurationManifestOwnership) || policy.configurationManifestOwnership.length === 0) {
    throw auditError("CLEANUP_POLICY_INVALID")
  }
  const configurationOwnerKeys = new Set()
  for (const rule of policy.configurationManifestOwnership) {
    assertExactFields(rule, CONFIGURATION_OWNERSHIP_FIELDS, "CLEANUP_POLICY_INVALID")
    if (
      typeof rule.packageName !== "string" ||
      !/^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/.test(rule.packageName) ||
      !isNormalizedPolicyPath(rule.ownerPath)
    ) throw auditError("CLEANUP_POLICY_INVALID")
    const ownerKey = `${rule.packageName}\0${rule.ownerPath}`
    if (configurationOwnerKeys.has(ownerKey)) throw auditError("CLEANUP_POLICY_INVALID")
    configurationOwnerKeys.add(ownerKey)
    if (rule.kind === "configuration-file") {
      if (rule.manifestIdentity !== null) throw auditError("CLEANUP_POLICY_INVALID")
      continue
    }
    if (rule.kind !== "configuration-manifest" || extname(rule.ownerPath).toLowerCase() !== ".json") {
      throw auditError("CLEANUP_POLICY_INVALID")
    }
    assertExactFields(rule.manifestIdentity, MANIFEST_IDENTITY_FIELDS, "CLEANUP_POLICY_INVALID")
    if (
      typeof rule.manifestIdentity.property !== "string" ||
      !/^[A-Za-z_$][A-Za-z0-9_$-]*$/.test(rule.manifestIdentity.property) ||
      typeof rule.manifestIdentity.value !== "string" || rule.manifestIdentity.value.length === 0
    ) throw auditError("CLEANUP_POLICY_INVALID")
  }
  assertUniqueStrings(policy.protectedPathPrefixes, "CLEANUP_POLICY_INVALID", { prefix: true })
  assertUniqueStrings(policy.assetRoots, "CLEANUP_POLICY_INVALID", { prefix: true })
  assertUniqueStrings(policy.assetExtensions, "CLEANUP_POLICY_INVALID", { extension: true })
  assertUniqueStrings(policy.environmentDeclarationPaths, "CLEANUP_POLICY_INVALID")
  assertUniqueStrings(policy.ignoredPathPrefixes, "CLEANUP_POLICY_INVALID", { prefix: true })
  assertUniqueStrings(policy.manualToolSources, "CLEANUP_POLICY_INVALID", { allowEmpty: true })
  if (policy.manualToolSources.some((path) => {
    const extension = extname(path).toLowerCase()
    return !policy.scopes.tool.some((root) => pathMatches(path, root)) ||
      policy.sourceExtensions.includes(extension) || policy.textExtensions.includes(extension) ||
      policy.environmentDeclarationPaths.includes(path)
  })) {
    throw auditError("CLEANUP_POLICY_INVALID")
  }
  if (!Array.isArray(policy.forbiddenTrackedPaths) || policy.forbiddenTrackedPaths.length === 0) {
    throw auditError("CLEANUP_POLICY_INVALID")
  }
  const forbiddenSeen = new Set()
  for (const path of policy.forbiddenTrackedPaths) {
    if (!isNormalizedPolicyPath(path, { prefix: path.endsWith("/") }) || forbiddenSeen.has(path)) {
      throw auditError("CLEANUP_POLICY_INVALID")
    }
    forbiddenSeen.add(path)
  }
  if (
    !policy.packageScriptCliOwnership || typeof policy.packageScriptCliOwnership !== "object" ||
    Array.isArray(policy.packageScriptCliOwnership) || Object.keys(policy.packageScriptCliOwnership).length === 0
  ) {
    throw auditError("CLEANUP_POLICY_INVALID")
  }
  for (const [cli, packageName] of Object.entries(policy.packageScriptCliOwnership)) {
    if (
      !/^[a-z0-9][a-z0-9-]*$/.test(cli) || typeof packageName !== "string" ||
      !/^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/.test(packageName)
    ) {
      throw auditError("CLEANUP_POLICY_INVALID")
    }
  }
  return policy
}

export function pathMatches(path, candidate) {
  return candidate.endsWith("/") ? path.startsWith(candidate) : path === candidate
}

export function classifyScope(path, policy) {
  for (const scope of SCOPE_NAMES) {
    if (policy.scopes[scope].some((root) => pathMatches(path, root))) return scope
  }
  return "other"
}

function readIndexBlobs(root, entries, execFile) {
  if (entries.length === 0) return []
  let output
  try {
    output = execFile("git", ["cat-file", "--batch"], {
      cwd: root,
      input: `${entries.map((entry) => entry.oid).join("\n")}\n`,
      maxBuffer: INDEX_READ_MAX_BUFFER,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    })
  } catch {
    throw auditError("CLEANUP_INDEX_READ_FAILED")
  }
  const bytes = Buffer.isBuffer(output) ? output : Buffer.from(output)
  const contents = []
  let cursor = 0
  for (const entry of entries) {
    const headerEnd = bytes.indexOf(10, cursor)
    if (headerEnd < 0) throw auditError("CLEANUP_INDEX_READ_FAILED")
    const header = bytes.subarray(cursor, headerEnd).toString("utf8").replace(/\r$/, "")
    const match = /^([a-f0-9]+) blob (\d+)$/.exec(header)
    if (!match || match[1] !== entry.oid) throw auditError("CLEANUP_INDEX_READ_FAILED")
    const size = Number(match[2])
    if (!Number.isSafeInteger(size) || size < 0) throw auditError("CLEANUP_INDEX_READ_FAILED")
    const start = headerEnd + 1
    const end = start + size
    if (end >= bytes.length || bytes[end] !== 10) throw auditError("CLEANUP_INDEX_READ_FAILED")
    contents.push(bytes.subarray(start, end).toString("utf8"))
    cursor = end + 1
  }
  if (cursor !== bytes.length) throw auditError("CLEANUP_INDEX_READ_FAILED")
  return contents
}

function readIndexMetadata(root, entries, execFile) {
  if (entries.length === 0) return []
  let output
  try {
    output = execFile("git", ["cat-file", "--batch-check=%(objectname) %(objecttype) %(objectsize)"], {
      cwd: root,
      encoding: "utf8",
      input: `${entries.map((entry) => entry.oid).join("\n")}\n`,
      maxBuffer: INDEX_READ_MAX_BUFFER,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    })
  } catch {
    throw auditError("CLEANUP_INDEX_READ_FAILED")
  }
  const rows = output.split(/\r?\n/).filter(Boolean)
  if (rows.length !== entries.length) throw auditError("CLEANUP_INDEX_READ_FAILED")
  return rows.map((row, index) => {
    const match = /^([a-f0-9]+) blob (\d+)$/.exec(row)
    const bytes = Number(match?.[2])
    if (!match || match[1] !== entries[index].oid || !Number.isSafeInteger(bytes) || bytes < 0) {
      throw auditError("CLEANUP_INDEX_READ_FAILED")
    }
    return { ...entries[index], bytes }
  })
}

function isBootstrapPrivatePath(path) {
  const lower = path.toLowerCase()
  const segments = lower.split("/")
  const basename = segments.at(-1)
  const directories = segments.slice(0, -1)
  const compoundArtifact = /^\.?(?:client[-_]secret|service[-_]account|client_secret_[a-z0-9][a-z0-9_-]*|service-account-key)(?:\.|$)/
  return (
    (basename.startsWith(".env") && basename !== ".env.example") ||
    directories.some((segment) => /^\.?(?:credentials?|secrets?)$/.test(segment)) ||
    /^\.?(?:credentials?|secrets?)(?:\.|$)/.test(basename) ||
    compoundArtifact.test(basename)
  )
}

function assertBootstrapPrivatePathsAbsent(entries) {
  if (entries.some((entry) => isBootstrapPrivatePath(entry.path))) {
    throw auditError("CLEANUP_FORBIDDEN_OR_INVALID_INDEX")
  }
}

function resolvePolicyIndexPath(root, policyPath) {
  const absoluteRoot = resolve(root)
  const absolutePolicy = resolve(policyPath)
  const relativePath = relative(absoluteRoot, absolutePolicy)
  if (!relativePath || isAbsolute(relativePath) || relativePath === ".." || relativePath.startsWith(`..${sep}`)) {
    throw auditError("CLEANUP_POLICY_PATH_INVALID")
  }
  const normalizedPath = normalizeRepoPath(relativePath)
  if (!isNormalizedPolicyPath(normalizedPath)) throw auditError("CLEANUP_POLICY_PATH_INVALID")
  return normalizedPath
}

/** Load the policy only from its validated, tracked stage-0 Git index blob. */
export function loadCleanupContext(root, policyPath, execFile = execFileSync) {
  const policyIndexPath = resolvePolicyIndexPath(root, policyPath)
  if (isBootstrapPrivatePath(policyIndexPath)) throw auditError("CLEANUP_POLICY_PATH_PRIVATE")
  let entries
  try {
    entries = listTrackedIndexEntries(root, execFile)
  } catch {
    throw auditError("CLEANUP_FORBIDDEN_OR_INVALID_INDEX")
  }
  const policyEntry = entries.find((entry) => entry.path === policyIndexPath)
  if (!policyEntry) throw auditError("CLEANUP_POLICY_PATH_UNTRACKED")
  assertBootstrapPrivatePathsAbsent(entries)
  try {
    const policy = validateCleanupPolicy(JSON.parse(readIndexBlobs(root, [policyEntry], execFile)[0]))
    return { entries, policy, policyIndexPath }
  } catch (error) {
    if (error?.code === "CLEANUP_INDEX_READ_FAILED") throw error
    throw auditError("CLEANUP_POLICY_INVALID")
  }
}

export function loadCleanupPolicy(root, policyPath, execFile = execFileSync) {
  return loadCleanupContext(root, policyPath, execFile).policy
}

/** Build metadata and canonical text solely from the captured stage-0 entry set. */
export function buildTrackedTextIndex(root, policy, execFile = execFileSync, capturedEntries) {
  validateCleanupPolicy(policy)
  let entries
  try {
    entries = capturedEntries ?? listTrackedIndexEntries(root, execFile)
    assertBootstrapPrivatePathsAbsent(entries)
    assertPrivatePathsAbsent(entries.map((entry) => entry.path), policy.forbiddenTrackedPaths)
  } catch (error) {
    if (error?.code === "CLEANUP_POLICY_INVALID") throw error
    throw auditError("CLEANUP_FORBIDDEN_OR_INVALID_INDEX")
  }
  const allMetadata = readIndexMetadata(root, entries, execFile)
  const inventorySha256 = sha256(allMetadata.map((entry) => (
    `${entry.path}\0${entry.oid}\0${entry.bytes}\n`
  )).join(""))
  const evidenceMetadata = allMetadata.filter((entry) => (
    !policy.ignoredPathPrefixes.some((prefix) => entry.path.startsWith(prefix))
  ))
  const metadataByPath = new Map(evidenceMetadata.map((entry) => [entry.path, entry]))
  const declarationPaths = new Set(policy.environmentDeclarationPaths)
  const textExtensions = new Set(policy.textExtensions)
  const textEntries = evidenceMetadata.filter((entry) => (
    textExtensions.has(extname(entry.path).toLowerCase()) || declarationPaths.has(entry.path)
  ))
  const texts = readIndexBlobs(root, textEntries, execFile)
  const textByPath = new Map()
  const records = textEntries.map((entry, index) => {
    const text = texts[index]
    textByPath.set(entry.path, text)
    return {
      path: entry.path, mode: entry.mode, oid: entry.oid,
      bytes: metadataByPath.get(entry.path).bytes,
      extension: extname(entry.path).toLowerCase(),
      scope: classifyScope(entry.path, policy), textSha256: sha256(text),
    }
  })
  const index = stableJson({
    schemaVersion: 1,
    inventorySha256,
    records,
    trackedPaths: evidenceMetadata.map((entry) => entry.path),
  })
  indexInternals.set(index, {
    metadataByPath, textByPath, trackedPathSet: new Set(index.trackedPaths),
  })
  return index
}

export function requireTrackedTextIndex(index) {
  const internals = indexInternals.get(index)
  if (
    !internals || index?.schemaVersion !== 1 ||
    !/^[a-f0-9]{64}$/.test(index?.inventorySha256 ?? "") || !Array.isArray(index.records)
  ) {
    throw auditError("CLEANUP_INDEX_INVALID")
  }
  return internals
}

/** Select exact tracked metadata without opening or parsing the corresponding blobs. */
export function selectTrackedMetadata(index, paths) {
  const { metadataByPath } = requireTrackedTextIndex(index)
  const tracked = []
  const missing = []
  for (const path of paths) {
    const entry = metadataByPath.get(path)
    if (entry) tracked.push({ path, bytes: entry.bytes, oid: entry.oid })
    else missing.push(path)
  }
  return { tracked, missing }
}

function taggedRows(category, rows, tagName) {
  if (!Array.isArray(rows)) throw auditError("CLEANUP_REPORT_BODY_INVALID")
  return rows.map((row) => (
    row && typeof row === "object" && !Array.isArray(row)
      ? { [tagName]: category, ...row }
      : { [tagName]: category, value: row }
  ))
}

/** Flatten a candidate classification into the shared findings/uncertainties body. */
export function candidateBody(candidate) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    throw auditError("CLEANUP_REPORT_BODY_INVALID")
  }
  const findings = []
  const uncertainties = []
  const findingCounts = {}
  const uncertaintyCounts = {}
  for (const [category, rows] of Object.entries(candidate)) {
    if (category === "schemaVersion" || category === "uncertainties") continue
    findingCounts[category] = rows.length
    findings.push(...taggedRows(category, rows, "findingKind"))
  }
  if (!candidate.uncertainties || typeof candidate.uncertainties !== "object" || Array.isArray(candidate.uncertainties)) {
    throw auditError("CLEANUP_REPORT_BODY_INVALID")
  }
  for (const [category, rows] of Object.entries(candidate.uncertainties)) {
    uncertaintyCounts[category] = rows.length
    uncertainties.push(...taggedRows(category, rows, "uncertaintyKind"))
  }
  return stableJson({
    summary: {
      findingCount: findings.length,
      findingCounts,
      uncertaintyCount: uncertainties.length,
      uncertaintyCounts,
    },
    findings,
    uncertainties,
  })
}

/** Wrap findings in the exact shared, non-authoritative deterministic contract. */
export function buildAuditEnvelope(auditKind, index, { summary, findings, uncertainties }) {
  if (typeof auditKind !== "string" || !/^[a-z][a-z0-9-]*$/.test(auditKind)) {
    throw auditError("CLEANUP_AUDIT_KIND_INVALID")
  }
  requireTrackedTextIndex(index)
  if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
    throw auditError("CLEANUP_AUDIT_SUMMARY_INVALID")
  }
  if (!Array.isArray(findings) || !Array.isArray(uncertainties)) {
    throw auditError("CLEANUP_AUDIT_ROWS_INVALID")
  }
  return stableJson({
    schemaVersion: 1, auditKind, deletionAuthority: false,
    inventorySha256: index.inventorySha256, summary, findings, uncertainties,
  })
}
