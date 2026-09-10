import {
  compareText,
  validateCleanupPolicy,
} from "./cleanup-core.mjs"
import { buildModuleEvidence, parsePackage } from "./cleanup-module-evidence.mjs"
import { stableJson } from "./core.mjs"

const DEPENDENCY_SECTIONS = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]

/** Build package declaration and usage evidence, folding package subpaths to their owner. */
export function buildDependencyEvidence(index, policy) {
  validateCleanupPolicy(policy)
  const packageJson = parsePackage(index)
  const declarations = []
  for (const section of DEPENDENCY_SECTIONS) {
    const values = packageJson[section]
    if (!values || typeof values !== "object" || Array.isArray(values)) continue
    for (const name of Object.keys(values).sort(compareText)) declarations.push({ name, section })
  }

  const moduleEvidence = buildModuleEvidence(index, policy)
  const references = moduleEvidence.references
    .filter((row) => row.targetKind === "package")
    .map((row) => ({
      packageName: row.dependency, fromPath: row.fromPath, line: row.line, column: row.column,
      kind: row.kind, literalSha256: row.literalSha256,
    }))
  const scripts = packageJson.scripts && typeof packageJson.scripts === "object" ? packageJson.scripts : {}
  for (const [scriptName, command] of Object.entries(scripts)) {
    if (typeof command !== "string") continue
    const ownedPackages = new Set()
    for (const segment of command.split(/&&|\|\||[;|]/)) {
      const tokens = segment.trim().split(/\s+/).filter(Boolean)
      while (tokens[0] && /^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[0])) tokens.shift()
      const cli = ["npx", "pnpm", "yarn"].includes(tokens[0]) ? tokens[1] : tokens[0]
      const packageName = policy.packageScriptCliOwnership[cli]
      if (packageName) ownedPackages.add(packageName)
    }
    for (const packageName of ownedPackages) references.push({ packageName, scriptName, kind: "package-script-cli" })
  }
  references.sort((left, right) => (
    compareText(left.packageName, right.packageName) ||
    compareText(left.fromPath ?? "package.json", right.fromPath ?? "package.json") ||
    (left.line ?? 0) - (right.line ?? 0) || (left.column ?? 0) - (right.column ?? 0) ||
    compareText(left.scriptName ?? "", right.scriptName ?? "")
  ))
  return stableJson({
    schemaVersion: 1, declarations, references,
    uncertainties: moduleEvidence.uncertainties, errors: moduleEvidence.errors,
  })
}
