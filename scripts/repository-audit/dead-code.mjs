import { dirname, extname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import {
  buildAuditEnvelope,
  buildTrackedTextIndex,
  candidateBody,
  classifyScope,
  loadCleanupContext,
  selectTrackedMetadata,
} from "./cleanup-core.mjs"
import { buildModuleEvidence } from "./cleanup-module-evidence.mjs"
import { stableJson } from "./core.mjs"

function pathMatchesPrefix(path, prefixes) {
  return prefixes.some((prefix) => path.startsWith(prefix))
}

function isGeneratedInput(path) {
  return (
    /\.d\.(?:ts|mts|cts)$/.test(path) ||
    path.startsWith("prisma/migrations/") ||
    /(?:^|\/)generated\//.test(path) ||
    /(?:^|\/)generated\.[^.]+$/.test(path)
  )
}

function partitionEvidenceErrors(errors) {
  if (errors.length > 0) throw new Error("DEAD_CODE_EVIDENCE_INVALID")
}

/**
 * Convert the shared static module graph into conservative cleanup candidates.
 * A zero-incoming module remains non-authoritative and is accompanied by every
 * framework, dynamic, manual-tool, generated-input, and unresolved-literal caveat.
 */
export function buildDeadCodeCandidateReport(index, policy) {
  const evidence = buildModuleEvidence(index, policy)
  partitionEvidenceErrors(evidence.errors)
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
  const manualScripts = [
    ...evidence.modules.filter((module) => module.scope === "tool" && candidatePaths.has(module.path))
      .map((module) => ({ path: module.path, reason: "manual-tool-entrypoint-possible" })),
    ...evidence.uncertainties.filter((row) => row.code === "OPAQUE_MANUAL_TOOL_SOURCE")
      .map((row) => ({ path: row.path, reason: "opaque-manual-tool-source" })),
  ]
  const generatedInputs = evidence.modules
    .filter((module) => isGeneratedInput(module.path))
    .map((module) => ({ path: module.path, reason: "generated-or-declaration-input" }))
  const frameworkConventions = evidence.roots
    .filter((row) => row.reason === "framework-root")
    .map((row) => ({ path: row.path, reason: "framework-convention" }))
  const expectedFixtureLiterals = evidence.uncertainties.filter((row) => (
    row.code === "NEGATIVE_FIXTURE_UNRESOLVED_LITERAL_MODULE"
  ))
  const nonliteralImports = evidence.uncertainties.filter((row) => (
    !["NEGATIVE_FIXTURE_UNRESOLVED_LITERAL_MODULE", "OPAQUE_MANUAL_TOOL_SOURCE"].includes(row.code)
  ))
  // File presence/imports cannot prove selector or token liveness. Inventory only
  // tracked identity here; CSS text remains available to the separate asset lane.
  const stylesheetPaths = index.trackedPaths.filter((path) => policy.stylesheetExtensions.includes(extname(path).toLowerCase()))
  const stylesheetUsage = selectTrackedMetadata(index, stylesheetPaths).tracked.map((row) => ({
    ...row,
    scope: classifyScope(row.path, policy),
    reason: "stylesheet-selector-and-design-token-usage-unresolved",
  }))

  return stableJson({
    schemaVersion: 1,
    roots: evidence.roots,
    referencedModules,
    unreferencedCandidates,
    protectedItems,
    uncertainties: {
      nonliteralImports,
      frameworkConventions,
      manualScripts,
      generatedInputs,
      expectedFixtureLiterals,
      stylesheetUsage,
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
  const { entries, policy } = loadCleanupContext(root, policyPath)
  const index = buildTrackedTextIndex(root, policy, undefined, entries)
  return buildAuditEnvelope("dead-code", index, candidateBody(buildDeadCodeCandidateReport(index, policy)))
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
