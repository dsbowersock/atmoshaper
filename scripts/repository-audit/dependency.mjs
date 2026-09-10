import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import {
  buildAuditEnvelope,
  buildTrackedTextIndex,
  candidateBody,
  loadCleanupContext,
} from "./cleanup-core.mjs"
import { buildDependencyEvidence } from "./cleanup-dependency-evidence.mjs"
import { buildModuleEvidence } from "./cleanup-module-evidence.mjs"
import { stableJson } from "./core.mjs"

const compareText = (left, right) => left < right ? -1 : left > right ? 1 : 0

function partitionEvidenceErrors(errors) {
  if (errors.length > 0) throw new Error("DEPENDENCY_EVIDENCE_INVALID")
}

function usageScope(path, moduleScope, policy) {
  if (moduleScope === "tool") return "tooling"
  if (moduleScope !== "other") return moduleScope
  if (policy.topLevelConfigRoots.includes(path)) return "framework-build"
  return moduleScope
}

function patchPackageName(path) {
  if (!path.startsWith("patches/") || !path.endsWith(".patch")) return null
  const filename = path.slice("patches/".length, -".patch".length)
  const parts = filename.split("+")
  if (parts[0]?.startsWith("@") && parts.length >= 3) return `${parts[0]}/${parts[1]}`
  return parts.length >= 2 && parts[0] ? parts[0] : null
}

function declaredBySection(declarations, section) {
  return declarations.filter((row) => row.section === section).map((row) => row.name)
}

function packageScopeRows(references) {
  const scopesByPackage = new Map()
  for (const reference of references) {
    const scopes = scopesByPackage.get(reference.packageName) ?? new Set()
    scopes.add(reference.usageScope)
    scopesByPackage.set(reference.packageName, scopes)
  }
  return [...scopesByPackage]
    .sort(([left], [right]) => compareText(left, right))
    .map(([name, scopes]) => ({ name, scopes: [...scopes].sort(compareText) }))
}

/**
 * Reconcile declaration, static import, package-script, and patch ownership without
 * treating lexical absence as removal authority. Config-only and tooling-only use
 * remain explicit references with their narrower scopes.
 */
export function buildDependencyCandidateReport(index, policy) {
  const dependencyEvidence = buildDependencyEvidence(index, policy)
  const moduleEvidence = buildModuleEvidence(index, policy)
  partitionEvidenceErrors(dependencyEvidence.errors)
  const moduleScopeByPath = new Map(moduleEvidence.modules.map((row) => [row.path, row.scope]))

  const literalImportOwners = dependencyEvidence.references
    .filter((row) => row.fromPath)
    .map((row) => ({
      packageName: row.packageName,
      ownerPath: row.fromPath,
      ownerScope: usageScope(row.fromPath, moduleScopeByPath.get(row.fromPath) ?? "other", policy),
      line: row.line,
      column: row.column,
      kind: row.kind,
      literalSha256: row.literalSha256,
    }))
  const packageScriptCliOwners = dependencyEvidence.references
    .filter((row) => row.kind === "package-script-cli")
    .map((row) => ({
      packageName: row.packageName,
      scriptName: row.scriptName,
      usageScope: "tooling",
    }))
  const nodeScriptOwners = moduleEvidence.roots
    .filter((row) => row.reason.startsWith("package-script:"))
    .map((row) => ({
      path: row.path,
      scriptName: row.reason.slice("package-script:".length),
      usageScope: "tooling",
    }))
  const declaredNames = new Set(dependencyEvidence.declarations.map((row) => row.name))
  const patchOwners = index.trackedPaths
    .map((path) => ({ path, packageName: patchPackageName(path) }))
    .filter((row) => row.packageName)
    .map((row) => ({ ...row, declared: declaredNames.has(row.packageName), usageScope: "patch" }))

  const packageReferences = [
    ...literalImportOwners.map((row) => ({ packageName: row.packageName, usageScope: row.ownerScope })),
    ...packageScriptCliOwners,
    ...patchOwners,
  ]
  const referencedPackages = packageScopeRows(packageReferences)
  const referencedNames = new Set(referencedPackages.map((row) => row.name))
  const unreferencedDeclarations = dependencyEvidence.declarations
    .filter((row) => !referencedNames.has(row.name))
  const implicitTypeCompilerPackages = unreferencedDeclarations
    .filter((row) => row.name.startsWith("@types/"))
    .map((row) => ({
      name: row.name,
      section: row.section,
      reason: "ambient-types-or-compiler-discovery",
    }))
  const unreferencedCandidates = unreferencedDeclarations
    .filter((row) => !row.name.startsWith("@types/"))
    .map((row) => ({
      name: row.name,
      section: row.section,
      reason: "no-static-import-script-or-patch-reference",
    }))
  const builtinImportOwners = moduleEvidence.references
    .filter((row) => row.targetKind === "builtin")
    .map((row) => ({
      ownerPath: row.fromPath,
      ownerScope: usageScope(row.fromPath, moduleScopeByPath.get(row.fromPath) ?? "other", policy),
      line: row.line,
      column: row.column,
      kind: row.kind,
      literalSha256: row.literalSha256,
    }))
  const buildOnlyReferences = referencedPackages.filter((row) => (
    row.scopes.length === 1 && row.scopes[0] === "framework-build"
  ))
  const toolingOnlyReferences = referencedPackages.filter((row) => (
    row.scopes.every((scope) => ["patch", "tooling"].includes(scope))
  ))
  const dynamicImports = dependencyEvidence.uncertainties.filter((row) => row.kind === "dynamic-import")
  const nonliteralModuleExpressions = dependencyEvidence.uncertainties.filter((row) => (
    row.kind !== "dynamic-import" && row.code !== "NEGATIVE_FIXTURE_UNRESOLVED_LITERAL_MODULE"
  ))
  const expectedFixtureLiterals = dependencyEvidence.uncertainties.filter((row) => (
    row.code === "NEGATIVE_FIXTURE_UNRESOLVED_LITERAL_MODULE"
  ))

  return stableJson({
    schemaVersion: 1,
    declaredDependencies: declaredBySection(dependencyEvidence.declarations, "dependencies"),
    declaredDevDependencies: declaredBySection(dependencyEvidence.declarations, "devDependencies"),
    declaredOptionalDependencies: declaredBySection(dependencyEvidence.declarations, "optionalDependencies"),
    declaredPeerDependencies: declaredBySection(dependencyEvidence.declarations, "peerDependencies"),
    literalImportOwners,
    builtinImportOwners,
    packageScriptCliOwners,
    nodeScriptOwners,
    patchOwners,
    referencedPackages,
    unreferencedCandidates,
    uncertainties: {
      dynamicImports,
      implicitTypeCompilerPackages,
      nonliteralModuleExpressions,
      expectedFixtureLiterals,
      buildOnlyReferences,
      toolingOnlyReferences,
    },
  })
}

function parseOptions(argv, defaults) {
  const options = { ...defaults }
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index]
    const value = argv[index + 1]
    if (!value || !["--root", "--policy"].includes(flag)) throw new Error("DEPENDENCY_OPTIONS_INVALID")
    if (flag === "--root") options.root = resolve(value)
    else options.policyPath = resolve(value)
    index += 1
  }
  return options
}

export function runDependencyAudit({ root, policyPath }) {
  const { entries, policy } = loadCleanupContext(root, policyPath)
  const index = buildTrackedTextIndex(root, policy, undefined, entries)
  return buildAuditEnvelope("dependency", index, candidateBody(buildDependencyCandidateReport(index, policy)))
}

function writeFailure() {
  process.stderr.write(`${JSON.stringify(stableJson({
    schemaVersion: 1,
    error: { code: "DEPENDENCY_AUDIT_FAILED" },
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
    process.stdout.write(`${JSON.stringify(runDependencyAudit(options), null, 2)}\n`)
  } catch {
    writeFailure()
  }
}
