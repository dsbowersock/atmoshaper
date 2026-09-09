import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import {
  assertPrivatePathsAbsent,
  classifyCandidate,
  collectLegacyReferences,
  listTrackedFiles,
  loadJson,
  stableJson,
  toBaselineEntry,
  verifyLegacyReferenceBaseline,
} from "./core.mjs"

try {
  const scriptDirectory = dirname(fileURLToPath(import.meta.url))
  const root = resolve(scriptDirectory, "../..")
  const policy = loadJson(resolve(scriptDirectory, "policy.json"))
  const paths = listTrackedFiles(root)
  assertPrivatePathsAbsent(paths, policy.forbiddenTrackedPaths)
  const references = collectLegacyReferences(root, paths, policy)
  const lineage = readFileSync(resolve(root, "MIGRATION_LINEAGE.md"), "utf8")
  const sourceMatch = lineage.match(/^Source commit: `([a-f0-9]{40})`$/m)
  if (!sourceMatch) throw new Error("MIGRATION_LINEAGE.md must contain one exact source commit line")

  if (process.argv.slice(2).includes("--print-candidate-baseline")) {
    const candidate = {
      schemaVersion: 1,
      sourceCommit: sourceMatch[1],
      entries: references.map((reference) => (
        toBaselineEntry(reference, classifyCandidate(reference, policy))
      )),
    }
    console.log(JSON.stringify(candidate, null, 2))
  } else {
    const baseline = loadJson(resolve(scriptDirectory, "brand-reference-baseline.json"))
    if (baseline.sourceCommit !== sourceMatch[1]) {
      throw new Error("Brand-reference baseline sourceCommit differs from MIGRATION_LINEAGE.md")
    }
    const result = verifyLegacyReferenceBaseline(references, baseline, policy)
    const missingTotals = Object.fromEntries(policy.allowedCategories.map((category) => [
      category,
      result.missing.filter((entry) => entry.category === category).length,
    ]))
    const totals = Object.fromEntries(policy.allowedCategories.map((category) => [
      category,
      baseline.entries.filter((entry) => entry.category === category).length -
        missingTotals[category],
    ]))
    const report = stableJson({
      schemaVersion: 1,
      totals,
      missing: result.missing,
      unclassified: result.unclassified,
    })
    console.log(`${JSON.stringify(report, null, 2)}\n`)
    if (result.unclassified.length > 0) process.exitCode = 1
  }
} catch {
  console.error(JSON.stringify(stableJson({
    schemaVersion: 1,
    error: { code: "LEGACY_BRAND_AUDIT_FAILED" },
  }), null, 2))
  process.exitCode = 1
}
