import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import {
  buildAuditEnvelope,
  buildEnvironmentEvidence,
  buildTrackedTextIndex,
  loadCleanupPolicy,
} from "./cleanup-core.mjs"
import { stableJson } from "./core.mjs"

const compareText = (left, right) => left < right ? -1 : left > right ? 1 : 0

function compareLocation(left, right) {
  return (
    compareText(left.name ?? "", right.name ?? "") ||
    compareText(left.path ?? "", right.path ?? "") ||
    (left.line ?? 0) - (right.line ?? 0) ||
    (left.column ?? 0) - (right.column ?? 0) ||
    compareText(left.kind ?? left.code ?? "", right.kind ?? right.code ?? "")
  )
}

/**
 * Reconcile tracked example declarations with static source reads. Missing and
 * unread names remain evidence-only findings; computed reads remain uncertainties.
 */
export function buildEnvironmentCandidateReport(index, policy) {
  const evidence = buildEnvironmentEvidence(index, policy)
  if (evidence.errors.length > 0) throw new Error("ENVIRONMENT_EVIDENCE_INVALID")

  const scopeByPath = new Map(index.records.map((record) => [record.path, record.scope]))
  const declaredNames = new Set(evidence.declarations.map((row) => row.name))
  const readNames = new Set(evidence.reads.map((row) => row.name))
  const staticReads = evidence.reads.map((row) => ({
    ...row,
    scope: scopeByPath.get(row.path) ?? "other",
  }))
  const declaredKeys = evidence.declarations.map((row) => ({ ...row }))
  const unreadDeclarationCandidates = declaredKeys
    .filter((row) => !readNames.has(row.name))
    .map((row) => ({ ...row, reason: "no-static-read" }))
  const missingDeclarationFindings = staticReads
    .filter((row) => !declaredNames.has(row.name))
    .map((row) => ({ ...row, reason: "static-read-absent-from-tracked-example" }))
  const computedReads = evidence.uncertainties.map((row) => ({
    ...row,
    scope: scopeByPath.get(row.path) ?? "other",
  }))

  return stableJson({
    schemaVersion: 1,
    declaredKeys: declaredKeys.sort(compareLocation),
    staticReads: staticReads.sort(compareLocation),
    unreadDeclarationCandidates: unreadDeclarationCandidates.sort(compareLocation),
    missingDeclarationFindings: missingDeclarationFindings.sort(compareLocation),
    uncertainties: {
      computedReads: computedReads.sort(compareLocation),
    },
  })
}

function parseOptions(argv, defaults) {
  const options = { ...defaults }
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index]
    const value = argv[index + 1]
    if (!value || !["--root", "--policy"].includes(flag)) {
      throw new Error("ENVIRONMENT_OPTIONS_INVALID")
    }
    if (flag === "--root") options.root = resolve(value)
    else options.policyPath = resolve(value)
    index += 1
  }
  return options
}

export function runEnvironmentAudit({ root, policyPath }) {
  const policy = loadCleanupPolicy(policyPath)
  const index = buildTrackedTextIndex(root, policy)
  return buildAuditEnvelope("environment", buildEnvironmentCandidateReport(index, policy))
}

function writeFailure() {
  process.stderr.write(`${JSON.stringify(stableJson({
    schemaVersion: 1,
    error: { code: "ENVIRONMENT_AUDIT_FAILED" },
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
    process.stdout.write(`${JSON.stringify(runEnvironmentAudit(options), null, 2)}\n`)
  } catch {
    writeFailure()
  }
}
