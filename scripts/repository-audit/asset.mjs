import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import {
  buildAuditEnvelope,
  buildTrackedTextIndex,
  candidateBody,
  isFrameworkConventionPath,
  loadCleanupContext,
} from "./cleanup-core.mjs"
import { buildAssetEvidence } from "./cleanup-asset-evidence.mjs"
import { stableJson } from "./core.mjs"

const compareText = (left, right) => left < right ? -1 : left > right ? 1 : 0

function compareLocation(left, right) {
  return (
    compareText(left.fromPath ?? "", right.fromPath ?? "") ||
    (left.line ?? 0) - (right.line ?? 0) ||
    (left.column ?? 0) - (right.column ?? 0) ||
    compareText(left.code ?? "", right.code ?? "") ||
    compareText(left.literalSha256 ?? "", right.literalSha256 ?? "")
  )
}

function literalReferenceKey(row) {
  return [row.fromPath, row.line, row.column, row.literalSha256].join(":")
}

function pathMatches(path, candidate) {
  return candidate.endsWith("/") ? path.startsWith(candidate) : path === candidate
}

function frameworkProtectionReason(path, policy) {
  return isFrameworkConventionPath(path, policy) ? "framework-convention" : null
}

function protectionReasons(path, policy) {
  const reasons = policy.protectedPathPrefixes
    .filter((prefix) => pathMatches(path, prefix))
    .map((prefix) => `policy-prefix:${prefix}`)
  const frameworkReason = frameworkProtectionReason(path, policy)
  if (frameworkReason) reasons.push(frameworkReason)
  return reasons
}

function partitionEvidenceErrors(errors) {
  const unresolvedLiteralAssets = []
  for (const error of errors) {
    if (error.code === "UNRESOLVED_LITERAL_ASSET") unresolvedLiteralAssets.push(error)
    else throw new Error("ASSET_EVIDENCE_INVALID")
  }
  return unresolvedLiteralAssets
}

/**
 * Present exact tracked-asset identities and conservative reference candidates.
 * Policy-protected and uncertain assets are never promoted to removal authority.
 */
export function buildAssetCandidateReport(index, policy) {
  const evidence = buildAssetEvidence(index, policy)
  const unresolvedEvidence = partitionEvidenceErrors(evidence.errors)
  const scopeByPath = new Map(index.records.map((record) => [record.path, record.scope]))
  const assetPathSet = new Set(evidence.assets.map((asset) => asset.path))
  const exactReferences = evidence.references.filter((row) => assetPathSet.has(row.targetPath))
  const referencedPaths = new Set(exactReferences.map((row) => row.targetPath))
  const referenceOwners = exactReferences.map((row) => ({
    ...row,
    ownerScope: scopeByPath.get(row.fromPath) ?? "other",
  }))
  const unresolvedKeys = new Set(unresolvedEvidence.map(literalReferenceKey))
  const outOfInventoryReferences = evidence.references
    .filter((row) => !assetPathSet.has(row.targetPath) && !unresolvedKeys.has(literalReferenceKey(row)))
    .map((row) => ({
      code: "OUT_OF_INVENTORY_LITERAL_ASSET",
      fromPath: row.fromPath,
      line: row.line,
      column: row.column,
      literalSha256: row.literalSha256,
    }))
  const unresolvedLiteralAssets = [...unresolvedEvidence, ...outOfInventoryReferences]
    .sort(compareLocation)
  const protectedAssets = evidence.assets
    .map((asset) => ({ asset, reasons: protectionReasons(asset.path, policy) }))
    .filter((row) => row.reasons.length > 0)
    .map(({ asset, reasons }) => ({ ...asset, reasons }))
  const protectedPaths = new Set(protectedAssets.map((asset) => asset.path))
  const unreferencedCandidates = evidence.assets
    .filter((asset) => !referencedPaths.has(asset.path) && !protectedPaths.has(asset.path))
    .map((asset) => ({ ...asset, reason: "no-exact-static-reference" }))
  const basenameOnlySignals = evidence.basenameSignals.map((row) => ({
    ...row,
    ownerScope: scopeByPath.get(row.fromPath) ?? "other",
  }))
  const dynamicAssetExpressions = evidence.uncertainties.map((row) => ({
    ...row,
    ownerScope: scopeByPath.get(row.path) ?? "other",
  }))

  return stableJson({
    schemaVersion: 1,
    trackedAssets: evidence.assets,
    referenceOwners,
    unreferencedCandidates,
    protectedAssets,
    basenameOnlySignals,
    uncertainties: {
      dynamicAssetExpressions,
      unresolvedLiteralAssets,
    },
  })
}

function parseOptions(argv, defaults) {
  const options = { ...defaults }
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index]
    const value = argv[index + 1]
    if (!value || !["--root", "--policy"].includes(flag)) throw new Error("ASSET_OPTIONS_INVALID")
    if (flag === "--root") options.root = resolve(value)
    else options.policyPath = resolve(value)
    index += 1
  }
  return options
}

export function runAssetAudit({ root, policyPath }) {
  const { entries, policy } = loadCleanupContext(root, policyPath)
  const index = buildTrackedTextIndex(root, policy, undefined, entries)
  return buildAuditEnvelope("asset", index, candidateBody(buildAssetCandidateReport(index, policy)))
}

function writeFailure() {
  process.stderr.write(`${JSON.stringify(stableJson({
    schemaVersion: 1,
    error: { code: "ASSET_AUDIT_FAILED" },
  }), null, 2)}\n`)
  process.exitCode = 1
}

const scriptPath = fileURLToPath(import.meta.url)
if (process.argv[1] && resolve(process.argv[1]) === scriptPath) {
  try {
    const scriptDirectory = dirname(scriptPath)
    const options = parseOptions(process.argv.slice(2), {
      root: resolve(scriptDirectory, "../.."),
      policyPath: resolve(scriptDirectory, "cleanup-policy.json"),
    })
    process.stdout.write(`${JSON.stringify(runAssetAudit(options), null, 2)}\n`)
  } catch {
    writeFailure()
  }
}
