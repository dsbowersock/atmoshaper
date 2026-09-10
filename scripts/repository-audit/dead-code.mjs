import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import {
  buildAuditEnvelope,
  buildModuleEvidence,
  buildTrackedTextIndex,
  loadCleanupPolicy,
} from "./cleanup-core.mjs"
import { stableJson } from "./core.mjs"

function pathMatchesPrefix(path, prefixes) {
  return prefixes.some((prefix) => path.startsWith(prefix))
}

function isGeneratedInput(path) {
  return (
    path.endsWith(".d.ts") ||
    path.startsWith("prisma/migrations/") ||
    path.includes("/generated/") ||
    /(?:^|\/)generated\.[^.]+$/.test(path)
  )
}

function partitionEvidenceErrors(errors) {
  const unresolvedLiterals = []
  for (const error of errors) {
    if (error.code === "UNRESOLVED_LITERAL_MODULE") unresolvedLiterals.push(error)
    else throw new Error("DEAD_CODE_EVIDENCE_INVALID")
  }
  return unresolvedLiterals
}

/**
 * Convert the shared static module graph into conservative cleanup candidates.
 * A zero-incoming module remains non-authoritative and is accompanied by every
 * framework, dynamic, manual-tool, generated-input, and unresolved-literal caveat.
 */
export function buildDeadCodeCandidateReport(index, policy) {
  const evidence = buildModuleEvidence(index, policy)
  const unresolvedLiterals = partitionEvidenceErrors(evidence.errors)
  const rootPaths = new Set(evidence.roots.map((row) => row.path))
  const incomingCounts = new Map()
  for (const reference of evidence.references) {
    if (reference.targetKind !== "tracked-module") continue
    incomingCounts.set(reference.targetPath, (incomingCounts.get(reference.targetPath) ?? 0) + 1)
  }

  const protectedItems = evidence.modules
    .filter((module) => pathMatchesPrefix(module.path, policy.protectedPathPrefixes))
    .map((module) => ({ path: module.path, scope: module.scope, reason: "protected-path" }))
  const protectedPaths = new Set(protectedItems.map((row) => row.path))
  const referencedModules = evidence.modules
    .filter((module) => incomingCounts.has(module.path))
    .map((module) => ({
      path: module.path,
      scope: module.scope,
      incomingReferenceCount: incomingCounts.get(module.path),
    }))
  const unreferencedCandidates = evidence.modules
    .filter((module) => !incomingCounts.has(module.path))
    .filter((module) => !rootPaths.has(module.path) && !protectedPaths.has(module.path))
    .map((module) => ({
      path: module.path,
      scope: module.scope,
      reason: "zero-incoming-static-references",
    }))

  const candidatePaths = new Set(unreferencedCandidates.map((row) => row.path))
  const manualScripts = evidence.modules
    .filter((module) => module.scope === "tool" && candidatePaths.has(module.path))
    .map((module) => ({ path: module.path, reason: "manual-tool-entrypoint-possible" }))
  const generatedInputs = evidence.modules
    .filter((module) => isGeneratedInput(module.path))
    .map((module) => ({ path: module.path, reason: "generated-or-declaration-input" }))
  const frameworkConventions = evidence.roots
    .filter((row) => row.reason === "framework-root")
    .map((row) => ({ path: row.path, reason: "framework-convention" }))

  return stableJson({
    schemaVersion: 1,
    roots: evidence.roots,
    referencedModules,
    unreferencedCandidates,
    protectedItems,
    uncertainties: {
      nonliteralImports: evidence.uncertainties,
      frameworkConventions,
      manualScripts,
      generatedInputs,
      unresolvedLiterals,
    },
  })
}

function parseOptions(argv, defaults) {
  const options = { ...defaults }
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index]
    const value = argv[index + 1]
    if (!value || !["--root", "--policy"].includes(flag)) throw new Error("DEAD_CODE_OPTIONS_INVALID")
    if (flag === "--root") options.root = resolve(value)
    else options.policyPath = resolve(value)
    index += 1
  }
  return options
}

export function runDeadCodeAudit({ root, policyPath }) {
  const policy = loadCleanupPolicy(policyPath)
  const index = buildTrackedTextIndex(root, policy)
  return buildAuditEnvelope("dead-code", buildDeadCodeCandidateReport(index, policy))
}

function writeFailure() {
  process.stderr.write(`${JSON.stringify(stableJson({
    schemaVersion: 1,
    error: { code: "DEAD_CODE_AUDIT_FAILED" },
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
    process.stdout.write(`${JSON.stringify(runDeadCodeAudit(options), null, 2)}\n`)
  } catch {
    writeFailure()
  }
}
