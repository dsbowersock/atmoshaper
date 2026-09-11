import assert from "node:assert/strict"
import { execFileSync, spawnSync } from "node:child_process"
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

import {
  buildAuditEnvelope,
  buildTrackedTextIndex,
  candidateBody,
  loadCleanupContext,
  loadCleanupPolicy,
  validateCleanupPolicy,
} from "../scripts/repository-audit/cleanup-core.mjs"
import { buildAssetEvidence } from "../scripts/repository-audit/cleanup-asset-evidence.mjs"
import { buildDependencyEvidence } from "../scripts/repository-audit/cleanup-dependency-evidence.mjs"
import { buildEnvironmentEvidence } from "../scripts/repository-audit/cleanup-environment-evidence.mjs"
import { buildModuleEvidence } from "../scripts/repository-audit/cleanup-module-evidence.mjs"
import { buildAssetCandidateReport } from "../scripts/repository-audit/asset.mjs"
import { buildDeadCodeCandidateReport } from "../scripts/repository-audit/dead-code.mjs"
import { buildDependencyCandidateReport } from "../scripts/repository-audit/dependency.mjs"
import { buildEnvironmentCandidateReport } from "../scripts/repository-audit/environment.mjs"
import { normalizeRepoPath, stableJson } from "../scripts/repository-audit/core.mjs"

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const policyPath = resolve(repositoryRoot, "scripts/repository-audit/cleanup-policy.json")
const deadCodeCliPath = resolve(repositoryRoot, "scripts/repository-audit/dead-code.mjs")
const dependencyCliPath = resolve(repositoryRoot, "scripts/repository-audit/dependency.mjs")
const assetCliPath = resolve(repositoryRoot, "scripts/repository-audit/asset.mjs")
const environmentCliPath = resolve(repositoryRoot, "scripts/repository-audit/environment.mjs")
const policy = loadCleanupPolicy(repositoryRoot, policyPath)

function createFixtureRepository(t) {
  const root = mkdtempSync(join(tmpdir(), "atmoshaper-cleanup-audit-"))
  execFileSync("git", ["init", "-q"], { cwd: root })
  execFileSync("git", ["config", "user.name", "Cleanup Audit Test"], { cwd: root })
  execFileSync("git", ["config", "user.email", "cleanup-audit@example.test"], { cwd: root })
  execFileSync("git", ["config", "core.autocrlf", "false"], { cwd: root })
  t.after(() => rmSync(root, { recursive: true, force: true }))
  return root
}

function writeFixture(root, path, content, { tracked = true, force = false } = {}) {
  const absolutePath = resolve(root, ...path.split("/"))
  mkdirSync(dirname(absolutePath), { recursive: true })
  writeFileSync(absolutePath, content)
  if (tracked) execFileSync("git", ["add", ...(force ? ["-f"] : []), "--", path], { cwd: root })
  return absolutePath
}

function writePackage(root, value = {}) {
  writeFixture(root, "package.json", `${JSON.stringify({
    name: "fixture",
    private: true,
    type: "module",
    scripts: {},
    dependencies: {},
    devDependencies: {},
    ...value,
  }, null, 2)}\n`)
}

const clonePolicy = () => structuredClone(policy)
const expectedConfigurationManifestOwnership = [
  {
    packageName: "postcss",
    ownerPath: "postcss.config.mjs",
    kind: "configuration-file",
    manifestIdentity: null,
  },
  {
    packageName: "shadcn",
    ownerPath: "components.json",
    kind: "configuration-manifest",
    manifestIdentity: {
      property: "$schema",
      value: "https://ui.shadcn.com/schema.json",
    },
  },
]

function runAuditCli(cliPath, root, selectedPolicyPath = policyPath) {
  const effectivePolicyPath = selectedPolicyPath === policyPath && root !== repositoryRoot
    ? writeFixture(root, "scripts/repository-audit/cleanup-policy.json", `${JSON.stringify(policy, null, 2)}\n`)
    : selectedPolicyPath
  return spawnSync(process.execPath, [
    cliPath,
    "--root",
    root,
    "--policy",
    effectivePolicyPath,
  ], {
    cwd: repositoryRoot,
    encoding: "utf8",
    windowsHide: true,
  })
}

function exactFailureEnvelope(code) {
  return `${JSON.stringify(stableJson({
    schemaVersion: 1,
    error: { code },
  }), null, 2)}\n`
}

function assertPrivateSerialization(value, root, forbidden) {
  const serialized = typeof value === "string" ? value : JSON.stringify(value)
  assert.equal(serialized.includes(root), false)
  for (const text of forbidden) assert.equal(serialized.includes(text), false)
  assert.equal(serialized.includes("Error:"), false)
  assert.equal(serialized.includes(" at "), false)
}

test("private serialization checks raw string inputs before JSON escaping", () => {
  const root = "C:\\private-audit-root"
  assert.throws(
    () => assertPrivateSerialization(`failure:${root}`, root, []),
    (error) => error.code === "ERR_ASSERTION",
  )
})

test("schema-v1 policy names every required scope and rejects policy drift", () => {
  assert.equal(validateCleanupPolicy(clonePolicy()).schemaVersion, 1)
  assert.deepEqual(Object.keys(policy.scopes).sort(), ["doc", "runtime", "test", "tool"])
  assert.deepEqual(policy.configurationManifestOwnership, expectedConfigurationManifestOwnership)

  const postcssRule = expectedConfigurationManifestOwnership[0]
  const shadcnRule = expectedConfigurationManifestOwnership[1]

  const cases = [
    { ...clonePolicy(), unexpected: true },
    { ...clonePolicy(), assetRoots: ["public\\"] },
    { ...clonePolicy(), sourceExtensions: [".js", ".js"] },
    { ...clonePolicy(), scopes: { ...clonePolicy().scopes, runtime: [] } },
    {
      ...clonePolicy(),
      scopes: {
        ...clonePolicy().scopes,
        tool: [...clonePolicy().scopes.tool, clonePolicy().scopes.runtime[0]],
      },
    },
    { ...clonePolicy(), configurationManifestOwnership: [] },
    {
      ...clonePolicy(),
      configurationManifestOwnership: [{ ...postcssRule, unexpected: true }],
    },
    {
      ...clonePolicy(),
      configurationManifestOwnership: [{ ...postcssRule, ownerPath: "config\\postcss.config.mjs" }],
    },
    {
      ...clonePolicy(),
      configurationManifestOwnership: [postcssRule, { ...postcssRule }],
    },
    {
      ...clonePolicy(),
      configurationManifestOwnership: [{
        ...postcssRule,
        manifestIdentity: { property: "$schema", value: "https://example.test/schema.json" },
      }],
    },
    {
      ...clonePolicy(),
      configurationManifestOwnership: [{
        ...shadcnRule,
        manifestIdentity: { property: "*", value: shadcnRule.manifestIdentity.value },
      }],
    },
  ]
  for (const candidate of cases) {
    assert.throws(
      () => validateCleanupPolicy(candidate),
      (error) => error.code === "CLEANUP_POLICY_INVALID" && error.message === "CLEANUP_POLICY_INVALID",
    )
  }
})

test("Windows separators normalize to canonical repository paths", () => {
  assert.equal(normalizeRepoPath("components\\nested\\widget.tsx"), "components/nested/widget.tsx")
  assert.equal(normalizeRepoPath("./lib/example.ts"), "lib/example.ts")
})

test("tracked text and exact report envelopes are deterministic", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root, { scripts: { dev: "next dev" }, dependencies: { next: "1.0.0" } })
  writeFixture(root, "app/page.tsx", "export default function Page() { return null }\n")
  writeFixture(root, "public/icon.svg", "<svg/>\n")

  const firstIndex = buildTrackedTextIndex(root, policy)
  const secondIndex = buildTrackedTextIndex(root, policy)
  assert.equal(JSON.stringify(firstIndex), JSON.stringify(secondIndex))
  assert.equal(JSON.stringify(firstIndex).includes("export default"), false)

  const body = candidateBody({ schemaVersion: 1, candidates: [{ path: "app/page.tsx" }], uncertainties: { dynamic: [] } })
  for (const kind of ["dead-code", "dependency", "asset", "environment"]) {
    const first = buildAuditEnvelope(kind, firstIndex, body)
    const second = buildAuditEnvelope(kind, secondIndex, body)
    assert.deepEqual(first, second)
    assert.deepEqual(Object.keys(first).sort(), [
      "auditKind", "deletionAuthority", "findings", "inventorySha256",
      "schemaVersion", "summary", "uncertainties",
    ])
    assert.equal(first.auditKind, kind)
    assert.equal(first.deletionAuthority, false)
    assert.match(first.inventorySha256, /^[a-f0-9]{64}$/)
  }
})

test("index metadata and blob reads share the same bounded output limit", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/page.tsx", "export default function Page() { return null }\n")
  const readOptions = []
  const observingExec = (file, args, options) => {
    if (args[0] === "cat-file") readOptions.push([args[1], options.maxBuffer])
    return execFileSync(file, args, options)
  }

  buildTrackedTextIndex(root, policy, observingExec)

  assert.deepEqual(readOptions, [
    ["--batch-check=%(objectname) %(objecttype) %(objectsize)", 128 * 1024 * 1024],
    ["--batch", 128 * 1024 * 1024],
  ])
})

test("module evidence uses index blobs rather than modified worktree bytes", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/staged.ts", "export const staged = true\n")
  const sourcePath = writeFixture(root, "app/page.tsx", "import { staged } from \"@/lib/staged\"\nvoid staged\n")
  writeFileSync(sourcePath, "import(getRuntimeSpecifier())\n")

  const evidence = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.equal(evidence.references.length, 1)
  assert.equal(evidence.references[0].targetKind, "tracked-module")
  assert.equal(evidence.references[0].targetPath, "lib/staged.ts")
  assert.equal(evidence.uncertainties.length, 0)
})

test("module evidence rejects path-like and malformed package specifiers without literal disclosure", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const windowsAbsolute = "C:\\Users\\private-audit-sentinel\\module.js"
  const malformedScoped = "@private-audit-sentinel"
  const malformedSubpath = "package//private-audit-sentinel"
  writeFixture(root, "app/page.ts", [
    `import ${JSON.stringify(windowsAbsolute)}`,
    `import ${JSON.stringify(malformedScoped)}`,
    `import ${JSON.stringify(malformedSubpath)}`,
    "",
  ].join("\n"))

  const evidence = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.references.map((row) => row.targetKind), [
    "unresolved", "unresolved", "unresolved",
  ])
  assert.deepEqual(evidence.errors.map((row) => row.code), [
    "UNRESOLVED_LITERAL_MODULE", "UNRESOLVED_LITERAL_MODULE", "UNRESOLVED_LITERAL_MODULE",
  ])
  assertPrivateSerialization(evidence, root, [windowsAbsolute, malformedScoped, malformedSubpath])

  const result = runAuditCli(deadCodeCliPath, root)
  assert.equal(result.status, 1)
  assert.equal(result.stdout, "")
  assert.equal(result.stderr, exactFailureEnvelope("DEAD_CODE_AUDIT_FAILED"))
  assertPrivateSerialization(result.stderr, root, [windowsAbsolute, malformedScoped, malformedSubpath])
})

test("module evidence records require.resolve ownership and hashes nonliteral arguments", (t) => {
  const root = createFixtureRepository(t)
  const dynamicExpression = "selectPrivatePackage()"
  writePackage(root, { dependencies: { "@scope/pkg": "1.0.0" } })
  writeFixture(root, "lib/tool.ts", "export const tool = true\n")
  writeFixture(root, "scripts/runner.mjs", [
    "const packageCli = require.resolve('@scope/pkg/cli')",
    "const localTool = require.resolve('../lib/tool')",
    `const selected = require.resolve(${dynamicExpression})`,
    "void packageCli; void localTool; void selected",
    "",
  ].join("\n"))

  const index = buildTrackedTextIndex(root, policy)
  const evidence = buildModuleEvidence(index, policy)
  const references = evidence.references.filter((row) => row.kind === "require-resolve")
  assert.deepEqual(references.map((row) => [row.targetKind, row.dependency ?? row.targetPath]), [
    ["package", "@scope/pkg"],
    ["tracked-module", "lib/tool.ts"],
  ])
  const uncertainty = evidence.uncertainties.find((row) => row.kind === "require-resolve")
  assert.equal(uncertainty?.code, "NONLITERAL_MODULE_EXPRESSION")
  const dependencyEvidence = buildDependencyEvidence(index, policy)
  assert.ok(dependencyEvidence.references.some((row) => (
    row.packageName === "@scope/pkg" && row.kind === "require-resolve"
  )))
  assertPrivateSerialization(evidence, root, [dynamicExpression])

  const realEvidence = buildDependencyEvidence(buildTrackedTextIndex(repositoryRoot, policy), policy)
  assert.ok(realEvidence.references.some((row) => (
    row.fromPath === "scripts/run-migration-parity-browser-qa.mjs" &&
    row.packageName === "@playwright/test" && row.kind === "require-resolve"
  )))
})

test("module evidence resolves aliases, relative extensions, indexes, and export-from", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/alias.ts", "export const alias = true\n")
  writeFixture(root, "lib/relative.tsx", "export const relative = true\n")
  writeFixture(root, "lib/folder/index.ts", "export const nested = true\n")
  writeFixture(root, "lib/barrel.ts", "export { alias } from \"./alias\"\n")
  writeFixture(root, "lib/sentry.options.ts", "export const sentryOptions = true\n")
  writeFixture(root, "lib/sentry.server.config.ts", "export const sentryServerConfig = true\n")
  writeFixture(root, "app/page.tsx", [
    "import { alias } from \"@/lib/alias\"",
    "import { relative } from \"../lib/relative\"",
    "import { sentryOptions } from \"@/lib/sentry.options\"",
    "import { sentryServerConfig } from \"../lib/sentry.server.config\"",
    "const nested = require(\"../lib/folder\")",
    "void alias; void relative; void sentryOptions; void sentryServerConfig; void nested",
    "",
  ].join("\n"))

  const evidence = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(
    evidence.references.filter((row) => row.targetKind === "tracked-module").map((row) => row.targetPath).sort(),
    [
      "lib/alias.ts",
      "lib/alias.ts",
      "lib/folder/index.ts",
      "lib/relative.tsx",
      "lib/sentry.options.ts",
      "lib/sentry.server.config.ts",
    ],
  )
  assert.equal(evidence.errors.length, 0)
  assert.ok(evidence.roots.some((row) => row.path === "app/page.tsx" && row.reason === "framework-root"))
})

test("module evidence preserves JavaScript edges and records exact declaration companions", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  for (const path of [
    "lib/extensionless.js",
    "lib/explicit.js",
    "lib/indexed/index.js",
  ]) writeFixture(root, path, "export default true\n")
  for (const path of [
    "lib/extensionless.d.ts",
    "lib/explicit.d.ts",
    "lib/indexed/index.d.ts",
    "lib/only-extensionless.d.ts",
    "lib/only-explicit.d.ts",
    "lib/only-indexed/index.d.ts",
    "lib/unrelated.d.ts",
  ]) writeFixture(root, path, "declare const value: true\nexport default value\n")
  writeFixture(root, "lib/untracked.js", "export default true\n")
  writeFixture(root, "lib/untracked.d.ts", "declare const value: true\nexport default value\n", { tracked: false })
  writeFixture(root, "app/page.tsx", [
    "import extensionless from '../lib/extensionless'",
    "import explicit from '../lib/explicit.js'",
    "import indexed from '../lib/indexed'",
    "import untracked from '../lib/untracked.js'",
    "import onlyExtensionless from '../lib/only-extensionless'",
    "import onlyExplicit from '../lib/only-explicit.js'",
    "import onlyIndexed from '../lib/only-indexed'",
    "void extensionless; void explicit; void indexed; void untracked",
    "void onlyExtensionless; void onlyExplicit; void onlyIndexed",
    "",
  ].join("\n"))

  const index = buildTrackedTextIndex(root, policy)
  const evidence = buildModuleEvidence(index, policy)
  assert.deepEqual(
    evidence.references
      .filter((row) => row.kind === "import" && row.targetKind === "tracked-module")
      .map((row) => row.targetPath),
    [
      "lib/extensionless.js",
      "lib/explicit.js",
      "lib/indexed/index.js",
      "lib/untracked.js",
      "lib/only-extensionless.d.ts",
      "lib/only-explicit.d.ts",
      "lib/only-indexed/index.d.ts",
    ],
  )
  assert.deepEqual(
    evidence.references
      .filter((row) => row.kind === "declaration-companion")
      .map((row) => row.targetPath),
    [
      "lib/extensionless.d.ts",
      "lib/explicit.d.ts",
      "lib/indexed/index.d.ts",
    ],
  )
  assert.equal(evidence.references.some((row) => row.targetPath === "lib/unrelated.d.ts"), false)
  assert.equal(evidence.references.some((row) => row.targetPath === "lib/untracked.d.ts"), false)
  assert.equal(evidence.errors.length, 0)

  const report = buildDeadCodeCandidateReport(index, policy)
  for (const path of [
    "lib/extensionless.d.ts",
    "lib/explicit.d.ts",
    "lib/indexed/index.d.ts",
    "lib/only-extensionless.d.ts",
    "lib/only-explicit.d.ts",
    "lib/only-indexed/index.d.ts",
  ]) {
    assert.ok(report.referencedModules.some((row) => row.path === path))
    assert.equal(report.unreferencedCandidates.some((row) => row.path === path), false)
  }

  const unresolvedRoot = createFixtureRepository(t)
  writePackage(unresolvedRoot)
  writeFixture(unresolvedRoot, "lib/unrelated.d.ts", "declare const unrelated: true\nexport default unrelated\n")
  writeFixture(unresolvedRoot, "lib/only-esm.d.ts", "declare const value: true\nexport default value\n")
  writeFixture(unresolvedRoot, "lib/only-common.d.ts", "declare const value: true\nexport default value\n")
  writeFixture(
    unresolvedRoot,
    "lib/untracked-only.d.ts",
    "declare const value: true\nexport default value\n",
    { tracked: false },
  )
  writeFixture(unresolvedRoot, "app/page.tsx", [
    "import unrelated from '../lib/not-related'",
    "import untrackedOnly from '../lib/untracked-only'",
    "import onlyEsm from '../lib/only-esm.mjs'",
    "import onlyCommon from '../lib/only-common.cjs'",
    "void unrelated; void untrackedOnly; void onlyEsm; void onlyCommon",
    "",
  ].join("\n"))
  const unresolvedEvidence = buildModuleEvidence(buildTrackedTextIndex(unresolvedRoot, policy), policy)
  assert.equal(unresolvedEvidence.references.some((row) => row.targetKind === "tracked-module"), false)
  assert.equal(unresolvedEvidence.errors.filter((row) => row.code === "UNRESOLVED_LITERAL_MODULE").length, 4)

  const realReport = buildDeadCodeCandidateReport(buildTrackedTextIndex(repositoryRoot, policy), policy)
  for (const path of [
    "lib/account-surface-data.d.ts",
    "lib/background-preview-runtime.d.ts",
    "lib/public-booking-picker.d.ts",
    "lib/public-booking-sequences.d.ts",
  ]) {
    assert.ok(realReport.referencedModules.some((row) => row.path === path))
    assert.equal(realReport.unreferencedCandidates.some((row) => row.path === path), false)
  }
})

test("module evidence separates extensionless type declarations from runtime implementations", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/model.d.ts", "export interface Model { id: string }\n")
  writeFixture(root, "lib/model/index.js", "export const model = true\n")
  writeFixture(root, "lib/runtime-model.d.ts", "export interface RuntimeModel { id: string }\n")
  writeFixture(root, "lib/runtime-model/index.js", "export const runtimeModel = true\n")
  writeFixture(root, "app/type-user.ts", [
    "import type { Model } from '../lib/model'",
    "export type ModelId = Model['id']",
    "",
  ].join("\n"))
  writeFixture(root, "app/runtime-user.ts", [
    "import { runtimeModel } from '../lib/runtime-model'",
    "void runtimeModel",
    "",
  ].join("\n"))

  const index = buildTrackedTextIndex(root, policy)
  const evidence = buildModuleEvidence(index, policy)
  assert.deepEqual(
    evidence.references
      .filter((row) => row.kind === "import" && row.targetKind === "tracked-module")
      .map((row) => [row.fromPath, row.targetPath]),
    [
      ["app/runtime-user.ts", "lib/runtime-model/index.js"],
      ["app/type-user.ts", "lib/model/index.js"],
    ],
  )
  assert.deepEqual(
    evidence.references
      .filter((row) => row.kind === "declaration-companion")
      .map((row) => [row.fromPath, row.sourceKind, row.targetPath]),
    [["app/type-user.ts", "import-type", "lib/model.d.ts"]],
  )
  assert.equal(evidence.errors.length, 0)

  const report = buildDeadCodeCandidateReport(index, policy)
  assert.ok(report.referencedModules.some((row) => row.path === "lib/model.d.ts"))
  assert.ok(report.unreferencedCandidates.some((row) => row.path === "lib/runtime-model.d.ts"))
})

test("module evidence follows TypeScript precedence and recognizes inline type specifiers", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/preferred.ts", "export interface Preferred { id: string }\n")
  writeFixture(root, "lib/preferred.d.ts", "export interface Preferred { legacy: true }\n")
  writeFixture(root, "lib/preferred/index.js", "export const preferred = true\n")
  writeFixture(root, "lib/inline-import.d.ts", "export interface InlineImport { id: string }\n")
  writeFixture(root, "lib/inline-import/index.js", "export const inlineImport = true\n")
  writeFixture(root, "lib/inline-export.d.ts", "export interface InlineExport { id: string }\n")
  writeFixture(root, "lib/inline-export/index.js", "export const inlineExport = true\n")
  writeFixture(root, "app/type-user.ts", [
    "import type { Preferred } from '../lib/preferred'",
    "import { type InlineImport } from '../lib/inline-import'",
    "export { type InlineExport } from '../lib/inline-export'",
    "export type PreferredId = Preferred['id']",
    "export type InlineImportId = InlineImport['id']",
    "",
  ].join("\n"))

  const index = buildTrackedTextIndex(root, policy)
  const evidence = buildModuleEvidence(index, policy)
  assert.deepEqual(
    evidence.references
      .filter((row) => row.kind !== "declaration-companion" && row.targetKind === "tracked-module")
      .map((row) => [row.kind, row.targetPath]),
    [
      ["import", "lib/preferred.ts"],
      ["import", "lib/inline-import/index.js"],
      ["export-from", "lib/inline-export/index.js"],
    ],
  )
  assert.deepEqual(
    evidence.references
      .filter((row) => row.kind === "declaration-companion")
      .map((row) => [row.sourceKind, row.targetPath]),
    [
      ["import-type", "lib/inline-import.d.ts"],
      ["export-type", "lib/inline-export.d.ts"],
    ],
  )
  assert.equal(evidence.errors.length, 0)

  const report = buildDeadCodeCandidateReport(index, policy)
  assert.ok(report.unreferencedCandidates.some((row) => row.path === "lib/preferred.d.ts"))
  for (const path of ["lib/inline-import.d.ts", "lib/inline-export.d.ts"]) {
    assert.ok(report.referencedModules.some((row) => row.path === path))
  }
})

test("module evidence applies TypeScript precedence to explicit JavaScript type imports", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/model.js", "export const model = true\n")
  writeFixture(root, "lib/model.ts", "export interface Model { id: string }\n")
  writeFixture(root, "lib/model.d.ts", "export interface Model { legacy: true }\n")
  writeFixture(root, "lib/view.jsx", "export const view = true\n")
  writeFixture(root, "lib/view.tsx", "export interface View { id: string }\n")
  writeFixture(root, "lib/view.d.ts", "export interface View { legacy: true }\n")
  writeFixture(root, "lib/paired.js", "export const paired = true\n")
  writeFixture(root, "lib/paired.d.ts", "export interface Paired { id: string }\n")
  writeFixture(root, "lib/only.d.ts", "export interface Only { id: string }\n")
  writeFixture(root, "app/type-user.ts", [
    "import type { Model } from '../lib/model.js'",
    "import type { View } from '../lib/view.jsx'",
    "import type { Paired } from '../lib/paired.js'",
    "import type { Only } from '../lib/only.js'",
    "export type Values = Model | View | Paired | Only",
    "",
  ].join("\n"))

  const index = buildTrackedTextIndex(root, policy)
  const evidence = buildModuleEvidence(index, policy)
  assert.deepEqual(
    evidence.references
      .filter((row) => row.kind === "import" && row.targetKind === "tracked-module")
      .map((row) => row.targetPath),
    ["lib/model.js", "lib/view.jsx", "lib/paired.js", "lib/only.d.ts"],
  )
  assert.deepEqual(
    evidence.references
      .filter((row) => row.kind === "declaration-companion")
      .map((row) => [row.sourceKind, row.targetPath]),
    [["import-type", "lib/paired.d.ts"]],
  )
  assert.equal(evidence.errors.length, 0)

  const report = buildDeadCodeCandidateReport(index, policy)
  for (const path of ["lib/model.d.ts", "lib/view.d.ts"]) {
    assert.ok(report.unreferencedCandidates.some((row) => row.path === path))
  }
  for (const path of ["lib/paired.d.ts", "lib/only.d.ts"]) {
    assert.ok(report.referencedModules.some((row) => row.path === path))
  }
})

test("unresolved literal modules are errors while dynamic expressions stay uncertainty", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const dynamicLiteral = "runtime-only-module-name"
  writeFixture(root, "app/page.tsx", [
    "import \"@/lib/not-present\"",
    `const selected = import(${dynamicLiteral})`,
    "void selected",
    "",
  ].join("\n"))

  const evidence = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.equal(evidence.errors[0].code, "UNRESOLVED_LITERAL_MODULE")
  assert.equal(evidence.uncertainties[0].code, "NONLITERAL_MODULE_EXPRESSION")
  assert.equal(JSON.stringify(evidence).includes(dynamicLiteral), false)
})

test("dependency evidence assigns package subpaths and script CLIs to owning packages", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root, {
    scripts: { dev: "next dev", check: "eslint ." },
    dependencies: { "@scope/pkg": "1.0.0", next: "1.0.0" },
    devDependencies: { eslint: "1.0.0" },
  })
  writeFixture(root, "app/page.tsx", "import value from \"@scope/pkg/subpath\"\nvoid value\n")

  const evidence = buildDependencyEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.ok(evidence.references.some((row) => row.packageName === "@scope/pkg" && row.kind === "import"))
  assert.ok(evidence.references.some((row) => row.packageName === "next" && row.scriptName === "dev"))
  assert.ok(evidence.references.some((row) => row.packageName === "eslint" && row.scriptName === "check"))
  assert.equal(evidence.references.some((row) => row.packageName === "@scope/pkg/subpath"), false)
})

test("dependency evidence captures TypeScript and JSDoc import types without duplicating runtime imports", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root, {
    dependencies: {
      "jsdoc-pkg": "1.0.0",
      "runtime-pkg": "1.0.0",
      "type-pkg": "1.0.0",
    },
  })
  writeFixture(root, "lib/type-owner.ts", [
    "type First = import(\"type-pkg/subpath\").First",
    "type Second = typeof import(\"type-pkg/subpath\")",
    "export type Combined = First & Second",
    "",
  ].join("\n"))
  writeFixture(root, "lib/jsdoc-owner.js", [
    "/** @type {import(\"jsdoc-pkg/subpath\").Thing} */",
    "export const jsdocOwner = null",
    "",
  ].join("\n"))
  writeFixture(root, "lib/runtime-owner.ts", [
    "export const runtimeOwner = import(\"runtime-pkg/subpath\")",
    "",
  ].join("\n"))

  const evidence = buildDependencyEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.equal(
    evidence.references.filter((row) => row.packageName === "type-pkg" && row.kind === "import-type").length,
    2,
  )
  assert.equal(
    evidence.references.filter((row) => row.packageName === "jsdoc-pkg" && row.kind === "import-type").length,
    1,
  )
  assert.equal(
    evidence.references.filter((row) => row.packageName === "runtime-pkg" && row.kind === "dynamic-import").length,
    1,
  )
  assert.equal(evidence.references.filter((row) => row.packageName === "runtime-pkg").length, 1)
})

test("dependency evidence records only validated configuration manifest owners", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root, {
    devDependencies: {
      "mention-only": "1.0.0",
      postcss: "1.0.0",
      shadcn: "1.0.0",
    },
  })
  writeFixture(root, "postcss.config.mjs", "export default { plugins: { tailwindcss: {} } }\n")
  writeFixture(root, "components.json", `${JSON.stringify({
    $schema: "https://ui.shadcn.com/schema.json",
    aliases: { ui: "@/components/ui" },
  })}\n`)
  writeFixture(root, "tests/dependency-security.test.mjs", [
    "const arbitraryText = 'mention-only postcss shadcn'",
    "void arbitraryText",
    "",
  ].join("\n"))

  const index = buildTrackedTextIndex(root, policy)
  const evidence = buildDependencyEvidence(index, policy)
  assert.deepEqual(evidence.configurationManifestOwners, [
    { kind: "configuration-file", ownerPath: "postcss.config.mjs", packageName: "postcss" },
    { kind: "configuration-manifest", ownerPath: "components.json", packageName: "shadcn" },
  ])

  const report = buildDependencyCandidateReport(index, policy)
  assert.deepEqual(report.configurationManifestOwners, [
    { kind: "configuration-file", ownerPath: "postcss.config.mjs", packageName: "postcss", usageScope: "configuration" },
    { kind: "configuration-manifest", ownerPath: "components.json", packageName: "shadcn", usageScope: "configuration" },
  ])
  assert.equal(report.literalImportOwners.some((row) => ["postcss", "shadcn"].includes(row.packageName)), false)
  for (const name of ["postcss", "shadcn"]) {
    assert.ok(report.referencedPackages.some((row) => (
      row.name === name && row.scopes.includes("configuration")
    )))
    assert.equal(report.unreferencedCandidates.some((row) => row.name === name), false)
  }
  assert.ok(report.unreferencedCandidates.some((row) => row.name === "mention-only"))

  const unrelatedRoot = createFixtureRepository(t)
  writePackage(unrelatedRoot, { devDependencies: { shadcn: "1.0.0" } })
  writeFixture(unrelatedRoot, "components.json", `${JSON.stringify({
    $schema: "https://example.test/not-shadcn.json",
    note: "shadcn",
  })}\n`)
  writeFixture(unrelatedRoot, "tests/manifest.test.mjs", "const mention = 'shadcn'\nvoid mention\n")
  const unrelatedReport = buildDependencyCandidateReport(buildTrackedTextIndex(unrelatedRoot, policy), policy)
  assert.deepEqual(unrelatedReport.configurationManifestOwners, [])
  assert.ok(unrelatedReport.unreferencedCandidates.some((row) => row.name === "shadcn"))

  const realReport = buildDependencyCandidateReport(buildTrackedTextIndex(repositoryRoot, policy), policy)
  for (const name of ["postcss", "shadcn"]) {
    assert.ok(realReport.configurationManifestOwners.some((row) => row.packageName === name))
    assert.equal(realReport.unreferencedCandidates.some((row) => row.name === name), false)
  }
})

test("dependency evidence records exact tracked runtime package metadata", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root, {
    dependencies: {
      "catalog-package": "1.2.3",
      "mismatched-package": "2.0.0",
      "mention-only": "1.0.0",
      "non-string-version": null,
      "test-only-metadata": "3.0.0",
      "duplicate-name": "4.0.0",
      "duplicate-version": "5.0.0",
      "spread-override": "6.0.0",
    },
  })
  const catalogPath = writeFixture(root, "lib/runtime-catalog.js", [
    "const PACKAGE_NAME = 'catalog-package'",
    "const PACKAGE_VERSION = '1.2.3'",
    "const MISMATCHED_VERSION = '1.0.0'",
    "export const catalog = [{ runtime: { packageName: PACKAGE_NAME, packageVersion: PACKAGE_VERSION } }]",
    "export const mismatch = { runtime: { packageName: 'mismatched-package', packageVersion: MISMATCHED_VERSION } }",
    "export function shadow(PACKAGE_NAME) { return { runtime: { packageName: PACKAGE_NAME, packageVersion: PACKAGE_VERSION } } }",
    "export const namedClassShadow = class PACKAGE_NAME { metadata = { runtime: { packageName: PACKAGE_NAME, packageVersion: PACKAGE_VERSION } } }",
    "export function classDeclarationShadow() { class PACKAGE_NAME { metadata = { runtime: { packageName: PACKAGE_NAME, packageVersion: PACKAGE_VERSION } } } return PACKAGE_NAME }",
    "export const duplicateRuntime = { runtime: { packageName: 'catalog-package', packageVersion: '1.2.3' }, runtime: null }",
    "export const spreadRuntime = { runtime: { packageName: 'catalog-package', packageVersion: '1.2.3' }, ...{ runtime: null } }",
    "export const duplicateName = { runtime: { packageName: 'duplicate-name', packageName: 'mention-only', packageVersion: '4.0.0' } }",
    "export const duplicateVersion = { runtime: { packageName: 'duplicate-version', packageVersion: '5.0.0', packageVersion: '0.0.0' } }",
    "const spreadOverride = { packageName: 'mention-only' }",
    "export const spreadMetadata = { runtime: { packageName: 'spread-override', packageVersion: '6.0.0', ...spreadOverride } }",
    "export const missingVersion = { runtime: { packageName: 'non-string-version' } }",
    "const arbitraryMention = 'mention-only'",
    "void arbitraryMention",
    "",
  ].join("\n"))
  writeFixture(root, "lib/scoped-runtime-catalog.ts", [
    "const PKG = 'catalog-package'",
    "const VERSION = '1.2.3'",
    "class StaticScope { static { if (true) { var PKG = 'mention-only' } const metadata = { runtime: { packageName: PKG, packageVersion: VERSION } }; void metadata } }",
    "namespace CatalogNamespace { const PKG = 'mention-only'; export const metadata = { runtime: { packageName: PKG, packageVersion: VERSION } } }",
    "namespace NestedNamespace { export namespace PKG { export const marker = true }; export const metadata = { runtime: { packageName: PKG, packageVersion: VERSION } } }",
    "{ enum PKG { Other }; const metadata = { runtime: { packageName: PKG, packageVersion: VERSION } }; void metadata }",
    "void StaticScope",
    "",
  ].join("\n"))
  writeFixture(root, "tests/runtime-catalog.test.js", [
    "const testOnly = { runtime: { packageName: 'test-only-metadata', packageVersion: '3.0.0' } }",
    "void testOnly",
    "",
  ].join("\n"))
  const unstagedSentinel = "unstaged-runtime-package-metadata"
  writeFileSync(catalogPath, [
    `const privateValue = '${unstagedSentinel}'`,
    "export const catalog = { runtime: { packageName: 'mention-only', packageVersion: '1.0.0' } }",
    "void privateValue",
    "",
  ].join("\n"))

  const index = buildTrackedTextIndex(root, policy)
  const evidence = buildDependencyEvidence(index, policy)
  const evidenceOwners = evidence.runtimePackageMetadataOwners ?? []
  assert.deepEqual(evidenceOwners.map((row) => ({
    kind: row.kind, line: row.line, ownerPath: row.ownerPath, packageName: row.packageName,
  })), [{
    kind: "runtime-package-metadata",
    line: 4,
    ownerPath: "lib/runtime-catalog.js",
    packageName: "catalog-package",
  }])
  assert.ok(Number.isInteger(evidenceOwners[0].column))
  assert.match(evidenceOwners[0].literalSha256, /^[a-f0-9]{64}$/)

  const report = buildDependencyCandidateReport(index, policy)
  const reportOwners = report.runtimePackageMetadataOwners
  assert.deepEqual(
    reportOwners.map((row) => ({
      kind: row.kind, line: row.line, ownerPath: row.ownerPath,
      packageName: row.packageName, usageScope: row.usageScope,
    })),
    [{
    kind: "runtime-package-metadata",
    line: 4,
    ownerPath: "lib/runtime-catalog.js",
    packageName: "catalog-package",
    usageScope: "runtime",
    }],
  )
  assert.ok(Number.isInteger(reportOwners[0].column))
  assert.match(reportOwners[0].literalSha256, /^[a-f0-9]{64}$/)
  assert.ok(report.referencedPackages.some((row) => (
    row.name === "catalog-package" && row.scopes.includes("runtime")
  )))
  assert.equal(report.unreferencedCandidates.some((row) => row.name === "catalog-package"), false)
  for (const name of [
    "duplicate-name", "duplicate-version", "mention-only", "mismatched-package", "non-string-version",
    "spread-override", "test-only-metadata",
  ]) {
    assert.ok(report.unreferencedCandidates.some((row) => row.name === name))
  }
  assertPrivateSerialization(report, root, [unstagedSentinel])

  const realReport = buildDependencyCandidateReport(buildTrackedTextIndex(repositoryRoot, policy), policy)
  assert.ok(realReport.runtimePackageMetadataOwners.some((row) => (
    row.packageName === "@generative-music/pieces-alex-bainter" &&
    row.ownerPath === "lib/atmosphere/generative-fm-catalog.js" &&
    row.usageScope === "runtime"
  )))
  assert.equal(realReport.unreferencedCandidates.some((row) => (
    row.name === "@generative-music/pieces-alex-bainter"
  )), false)
})

test("dependency metadata accepts any exact string version declared across sections", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root, {
    dependencies: { "catalog-package": "1.2.3", "unmatched-package": "2.0.0" },
    devDependencies: { "catalog-package": "9.9.9", "unmatched-package": "8.0.0" },
  })
  writeFixture(root, "lib/runtime-catalog.js", [
    "export const catalog = { runtime: { packageName: 'catalog-package', packageVersion: '1.2.3' } }",
    "export const unmatched = { runtime: { packageName: 'unmatched-package', packageVersion: '0.0.0' } }",
    "",
  ].join("\n"))

  const index = buildTrackedTextIndex(root, policy)
  const evidence = buildDependencyEvidence(index, policy)
  assert.deepEqual(evidence.runtimePackageMetadataOwners.map((row) => row.packageName), ["catalog-package"])

  const report = buildDependencyCandidateReport(index, policy)
  assert.equal(report.unreferencedCandidates.some((row) => row.name === "catalog-package"), false)
  assert.ok(report.unreferencedCandidates.some((row) => row.name === "unmatched-package"))
})

test("dependency CLI uses generic configuration ownership from the tracked stage-0 policy", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root, { devDependencies: { postcss: "1.0.0" } })
  const ownerPath = ["config/postcss-owner", "json"].join(".")
  writeFixture(root, ownerPath, `${JSON.stringify({ tool: "postcss" })}\n`)
  const stagedPolicy = clonePolicy()
  stagedPolicy.configurationManifestOwnership = [{
    packageName: "postcss",
    ownerPath,
    kind: "configuration-manifest",
    manifestIdentity: { property: "tool", value: "postcss" },
  }]
  const fixturePolicyRepoPath = ["scripts/repository-audit/cleanup-policy", "json"].join(".")
  const fixturePolicyPath = writeFixture(
    root,
    fixturePolicyRepoPath,
    `${JSON.stringify(stagedPolicy, null, 2)}\n`,
  )

  const first = runAuditCli(dependencyCliPath, root, fixturePolicyPath)
  const unstagedSentinel = "unstaged-configuration-owner"
  const unstagedOwnerPath = [unstagedSentinel, "json"].join(".")
  writeFileSync(fixturePolicyPath, JSON.stringify({
    ...stagedPolicy,
    configurationManifestOwnership: [{
      packageName: "postcss",
      ownerPath: unstagedOwnerPath,
      kind: "configuration-file",
      manifestIdentity: null,
    }],
  }))
  const second = runAuditCli(dependencyCliPath, root, fixturePolicyPath)

  assert.equal(first.status, 0)
  assert.equal(first.stderr, "")
  assert.equal(second.status, 0)
  assert.equal(second.stderr, "")
  assert.equal(second.stdout, first.stdout)
  const report = JSON.parse(second.stdout)
  assert.deepEqual(
    report.findings.filter((row) => row.findingKind === "configurationManifestOwners"),
    [{
      findingKind: "configurationManifestOwners",
      kind: "configuration-manifest",
      ownerPath,
      packageName: "postcss",
      usageScope: "configuration",
    }],
  )
  assertPrivateSerialization(second.stdout, root, [unstagedSentinel])
})

test("dead-code report separates candidates from roots, protections, and uncertainty", (t) => {
  const root = createFixtureRepository(t)
  const dynamicExpression = "selectRuntimeModule()"
  writePackage(root, { scripts: { owned: "node scripts/owned.mjs" } })
  writeFixture(root, "app/page.tsx", [
    "import { used } from \"@/lib/used\"",
    "const selected = import(" + dynamicExpression + ")",
    "void used; void selected",
    "",
  ].join("\n"))
  writeFixture(root, "app/not-found.tsx", "export default function NotFound() { return null }\n")
  for (const basename of [
    "apple-icon",
    "forbidden",
    "global-not-found",
    "icon",
    "opengraph-image",
    "twitter-image",
    "unauthorized",
  ]) {
    writeFixture(root, "app/" + basename + ".tsx", "export default function ConventionFixture() { return null }\n")
  }
  for (const basename of ["apple-icon9", "icon0", "opengraph-image3", "twitter-image7"]) {
    writeFixture(root, "app/" + basename + ".tsx", "export default function NumberedConvention() { return null }\n")
  }
  for (const basename of ["apple-icon-1", "icon10", "iconography", "twitter-image27", "twitter-image-final"]) {
    writeFixture(root, "app/" + basename + ".tsx", "export const lookalike = true\n")
  }
  writeFixture(root, "proxy.ts", "export function proxy() {}\n")
  writeFixture(root, "lib/used.ts", "export const used = true\n")
  writeFixture(root, "lib/unused.ts", "export const unused = true\n")
  writeFixture(root, "scripts/owned.mjs", "export const owned = true\n")
  writeFixture(root, "scripts/manual-unused.mjs", "export const manual = true\n")
  writeFixture(root, "scripts/repository-audit/protected.mjs", "export const protectedValue = true\n")
  writeFixture(root, "types/generated.d.ts", "export interface GeneratedFixture { value: string }\n")
  writeFixture(root, "public/service-worker.js", "self.addEventListener(\"install\", () => {})\n")

  const report = buildDeadCodeCandidateReport(buildTrackedTextIndex(root, policy), policy)
  assert.ok(report.roots.some((row) => row.path === "app/not-found.tsx" && row.reason === "framework-root"))
  for (const basename of [
    "apple-icon",
    "forbidden",
    "global-not-found",
    "icon",
    "opengraph-image",
    "twitter-image",
    "unauthorized",
  ]) {
    assert.ok(report.roots.some((row) => row.path === "app/" + basename + ".tsx" && row.reason === "framework-root"))
  }
  for (const basename of ["apple-icon9", "icon0", "opengraph-image3", "twitter-image7"]) {
    assert.ok(report.roots.some((row) => row.path === "app/" + basename + ".tsx" && row.reason === "framework-root"))
  }
  for (const basename of ["apple-icon-1", "icon10", "iconography", "twitter-image27", "twitter-image-final"]) {
    assert.ok(report.unreferencedCandidates.some((row) => row.path === "app/" + basename + ".tsx"))
  }
  assert.ok(report.roots.some((row) => row.path === "proxy.ts" && row.reason === "top-level-config"))
  assert.ok(report.roots.some((row) => row.path === "scripts/owned.mjs" && row.reason === "package-script:owned"))
  assert.ok(report.referencedModules.some((row) => row.path === "lib/used.ts"))
  assert.ok(report.unreferencedCandidates.some((row) => row.path === "lib/unused.ts"))
  assert.equal(report.unreferencedCandidates.some((row) => row.path === "types/generated.d.ts"), false)
  assert.equal(report.unreferencedCandidates.some((row) => row.path === "public/service-worker.js"), false)
  assert.ok(report.protectedItems.some((row) => row.path === "types/generated.d.ts"))
  assert.ok(report.protectedItems.some((row) => row.path === "public/service-worker.js"))
  assert.ok(report.uncertainties.nonliteralImports.some((row) => row.kind === "dynamic-import"))
  assert.ok(report.uncertainties.frameworkConventions.some((row) => row.path === "app/page.tsx"))
  assert.ok(report.uncertainties.manualScripts.some((row) => row.path === "scripts/manual-unused.mjs"))
  assert.ok(report.uncertainties.generatedInputs.some((row) => row.path === "types/generated.d.ts"))
  assertPrivateSerialization(report, root, [dynamicExpression])
})

test("dependency report preserves import, CLI, patch, built-in, and usage-scope evidence", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root, {
    scripts: {
      dev: "next dev",
      check: "eslint .",
      falseMention: "next build --output scripts/not-entry.ts",
      tool: "node --require ./scripts/preload.mjs --experimental-strip-types scripts/tool.ts --output scripts/not-entry.ts",
    },
    dependencies: {
      "@scope/pkg": "1.0.0",
      "build-config-only": "1.0.0",
      "metal-fx": "1.0.4",
      next: "1.0.0",
      "runtime-config": "1.0.0",
      "types-only": "1.0.0",
      unused: "1.0.0",
    },
    devDependencies: {
      "@types/ambient": "1.0.0",
      eslint: "1.0.0",
      "tool-only": "1.0.0",
    },
  })
  writeFixture(root, "app/page.tsx", [
    "import path from \"node:path\"",
    "import value from \"@scope/pkg/subpath\"",
    "import type { TypeFixture } from \"types-only/subpath\"",
    "const dynamicPackage = import(selectDependency())",
    "void path; void value",
    "const typed: TypeFixture | null = null",
    "void typed; void dynamicPackage",
    "",
  ].join("\n"))
  writeFixture(root, "auth.ts", "import runtimeConfig from \"runtime-config\"\nvoid runtimeConfig\n")
  writeFixture(root, "next.config.mjs", "import config from \"build-config-only\"\nvoid config\nexport default {}\n")
  writeFixture(root, "scripts/tool.ts", "import tool from \"tool-only\"\nvoid tool\n")
  writeFixture(root, "scripts/preload.mjs", "export const preload = true\n")
  writeFixture(root, "scripts/not-entry.ts", "export const notAnEntrypoint = true\n")
  writeFixture(root, "patches/metal-fx+1.0.4.patch", "fixture patch body\n")

  const report = buildDependencyCandidateReport(buildTrackedTextIndex(root, policy), policy)
  assert.ok(report.literalImportOwners.some((row) => (
    row.packageName === "@scope/pkg" && row.ownerScope === "runtime"
  )))
  assert.ok(report.literalImportOwners.some((row) => row.packageName === "types-only"))
  assert.equal(report.literalImportOwners.some((row) => row.packageName === "@scope/pkg/subpath"), false)
  assert.ok(report.builtinImportOwners.some((row) => row.ownerPath === "app/page.tsx"))
  assert.ok(report.packageScriptCliOwners.some((row) => row.packageName === "next" && row.scriptName === "dev"))
  assert.ok(report.packageScriptCliOwners.some((row) => row.packageName === "eslint" && row.scriptName === "check"))
  assert.ok(report.nodeScriptOwners.some((row) => row.path === "scripts/tool.ts" && row.scriptName === "tool"))
  assert.ok(report.nodeScriptOwners.some((row) => row.path === "scripts/preload.mjs" && row.scriptName === "tool"))
  assert.equal(report.nodeScriptOwners.some((row) => row.path === "scripts/not-entry.ts"), false)
  assert.ok(report.patchOwners.some((row) => row.packageName === "metal-fx" && row.declared))
  assert.ok(report.referencedPackages.some((row) => (
    row.name === "build-config-only" && row.scopes.includes("framework-build")
  )))
  assert.ok(report.referencedPackages.some((row) => (
    row.name === "runtime-config" && row.scopes.includes("runtime")
  )))
  assert.ok(report.uncertainties.dynamicImports.some((row) => row.kind === "dynamic-import"))
  assert.ok(report.uncertainties.implicitTypeCompilerPackages.some((row) => row.name === "@types/ambient"))
  assert.ok(report.uncertainties.buildOnlyReferences.some((row) => row.name === "build-config-only"))
  assert.ok(report.uncertainties.toolingOnlyReferences.some((row) => row.name === "tool-only"))
  assert.ok(report.unreferencedCandidates.some((row) => row.name === "unused"))
  assert.equal(report.unreferencedCandidates.some((row) => row.name === "@types/ambient"), false)
  assert.equal(report.unreferencedCandidates.some((row) => row.name === "metal-fx"), false)
  assertPrivateSerialization(report, root, ["selectDependency()"])
})

test("audit CLIs are byte-stable and return zero when they find candidates", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root, { dependencies: { unused: "1.0.0" } })
  writeFixture(root, "app/page.tsx", "export default function Page() { return null }\n")
  writeFixture(root, "lib/unused.ts", "export const unused = true\n")

  for (const [cliPath, kind] of [
    [deadCodeCliPath, "dead-code"],
    [dependencyCliPath, "dependency"],
  ]) {
    const first = runAuditCli(cliPath, root)
    const second = runAuditCli(cliPath, root)
    assert.equal(first.status, 0)
    assert.equal(first.stderr, "")
    assert.equal(first.stdout, second.stdout)
    const envelope = JSON.parse(first.stdout)
    assert.equal(envelope.auditKind, kind)
    assert.equal(envelope.deletionAuthority, false)
    assert.ok(envelope.findings.some((row) => row.findingKind === "unreferencedCandidates"))
  }
})

test("audit CLIs use exact sanitized failures for malformed policy and import evidence", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/page.tsx", "import {\n")
  const malformedPolicyPath = resolve(root, "malformed-policy.json")
  const malformedPolicySecret = "malformed-policy-private-fixture"
  writeFileSync(malformedPolicyPath, JSON.stringify({ unexpected: malformedPolicySecret }))

  for (const [cliPath, code] of [
    [deadCodeCliPath, "DEAD_CODE_AUDIT_FAILED"],
    [dependencyCliPath, "DEPENDENCY_AUDIT_FAILED"],
  ]) {
    const policyFailure = runAuditCli(cliPath, root, malformedPolicyPath)
    assert.equal(policyFailure.status, 1)
    assert.equal(policyFailure.stdout, "")
    assert.equal(policyFailure.stderr, exactFailureEnvelope(code))
    assertPrivateSerialization(policyFailure.stderr, root, [malformedPolicySecret])

    const evidenceFailure = runAuditCli(cliPath, root)
    assert.equal(evidenceFailure.status, 1)
    assert.equal(evidenceFailure.stdout, "")
    assert.equal(evidenceFailure.stderr, exactFailureEnvelope(code))
    assertPrivateSerialization(evidenceFailure.stderr, root, ["import {"])
  }
})

test("asset evidence normalizes public URLs and relative paths without literal output", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "public/icons/example.svg", "<svg/>\n")
  writeFixture(root, "app/local.png", "not-real-image")
  const publicLiteral = "/icons/example.svg?version=private#fragment"
  const relativeLiteral = "./local.png"
  writeFixture(root, "app/page.tsx", [
    `const publicAsset = \"${publicLiteral}\"`,
    `const localAsset = \"${relativeLiteral}\"`,
    "void publicAsset; void localAsset",
    "",
  ].join("\n"))

  const evidence = buildAssetEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.references.map((row) => row.targetPath), ["public/icons/example.svg", "app/local.png"])
  assert.equal(evidence.errors.length, 0)
  assertPrivateSerialization(evidence, root, [publicLiteral, relativeLiteral])
})

test("asset evidence recognizes Markdown destinations and unquoted HTML and YAML values", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "public/icons/example.svg", "<svg/>\n")
  const markdownLiteral = "/icons/example.svg?markdown=private"
  const htmlLiteral = "/icons/example.svg?html=private"
  const yamlLiteral = "/icons/example.svg?yaml=private"
  writeFixture(root, "docs/assets.md", `![example](${markdownLiteral})\n`)
  writeFixture(root, "app/assets.html", `<img src=${htmlLiteral}>\n`)
  writeFixture(root, "assets.yml", `hero: ${yamlLiteral}\n`)

  const evidence = buildAssetEvidence(buildTrackedTextIndex(root, policy), policy)
  const referencedBy = evidence.references.map((row) => row.fromPath).sort()
  assert.deepEqual(referencedBy, ["app/assets.html", "assets.yml", "docs/assets.md"])
  assert.ok(evidence.references.every((row) => row.targetPath === "public/icons/example.svg"))
  assert.equal(evidence.errors.length, 0)
  assertPrivateSerialization(evidence, root, [markdownLiteral, htmlLiteral, yamlLiteral])
})

test("environment evidence records static names and computed uncertainty without values", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const secretValue = "private-fixture-value"
  writeFixture(root, ".env.example", `DIRECT=${secretValue}\nBRACKET=placeholder\nDESTRUCTURED=placeholder\n`)
  writeFixture(root, "lib/environment.ts", [
    "const direct = process.env.DIRECT",
    "const bracket = process.env[\"BRACKET\"]",
    "const { DESTRUCTURED: renamed } = process.env",
    "const computed = process.env[getName()]",
    "void direct; void bracket; void renamed; void computed",
    "",
  ].join("\n"))

  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.reads.map((row) => row.name).sort(), ["BRACKET", "DESTRUCTURED", "DIRECT"])
  assert.deepEqual(evidence.declarations.map((row) => row.name), ["DIRECT", "BRACKET", "DESTRUCTURED"])
  assert.equal(evidence.uncertainties.length, 1)
  assert.equal(evidence.uncertainties[0].code, "COMPUTED_ENVIRONMENT_READ")
  assertPrivateSerialization(evidence, root, [secretValue, "getName()"])
})

test("environment evidence hoists runtime process env named imports with lexical semantics", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const computedExpression = "privateEnvironmentName()"
  writeFixture(root, "lib/imported-environment.ts", [
    "const beforeImport = nodeEnvironment.BEFORE_IMPORT",
    "import { env as nodeEnvironment } from 'node:process'",
    "import { env } from 'process'",
    "import type { env as TypeEnvironment } from 'node:process'",
    "import { type env as SpecifierTypeEnvironment } from 'process'",
    "import { env as unrelatedValue } from 'node:process/promises'",
    "export { env as exportedEnvironment } from 'node:process'",
    "const named = nodeEnvironment.NAMED",
    "const bracket = env['BRACKET']",
    `const computed = nodeEnvironment[${computedExpression}]`,
    "consume(nodeEnvironment)",
    "forward(env)",
    "const propagatedEnvironment = nodeEnvironment",
    "const propagated = propagatedEnvironment.PROPAGATED",
    "function shadow(nodeEnvironment) { return nodeEnvironment.SHADOWED }",
    "let reassignedEnvironment = env",
    "reassignedEnvironment = getInjectedEnvironment()",
    "const afterReassignment = reassignedEnvironment.AFTER_REASSIGNMENT",
    "nodeEnvironment.WRITE_ONLY = 'fixture'",
    "delete env.DELETE_ONLY",
    "nodeEnvironment.COMPOUND_READ += 'fixture'",
    "const typeClause = TypeEnvironment.TYPE_CLAUSE",
    "const typeSpecifier = SpecifierTypeEnvironment.TYPE_SPECIFIER",
    "const unrelated = unrelatedValue.UNRELATED",
    "void beforeImport; void named; void bracket; void computed; void propagated",
    "void afterReassignment; void typeClause; void typeSpecifier; void unrelated; void shadow",
    "",
  ].join("\n"))

  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.reads.map((row) => row.name), [
    "BEFORE_IMPORT", "NAMED", "BRACKET", "PROPAGATED", "COMPOUND_READ",
  ])
  const computed = evidence.uncertainties.filter((row) => row.code === "COMPUTED_ENVIRONMENT_READ")
  assert.deepEqual(computed.map((row) => [row.kind, row.line]), [
    ["element-access", 10],
    ["whole-object-value", 11],
    ["whole-object-value", 12],
  ])
  assert.equal(computed[0].name, undefined)
  assert.match(computed[0].expressionSha256, /^[a-f0-9]{64}$/)
  assert.deepEqual(
    evidence.uncertainties
      .filter((row) => row.code === "UNPROVEN_ENVIRONMENT_ALIAS")
      .map((row) => row.name),
    ["AFTER_REASSIGNMENT"],
  )
  assert.equal(evidence.errors.length, 0)
  assertPrivateSerialization(evidence, root, [computedExpression, "getInjectedEnvironment()"])
})

test("environment import aliases survive lexical loop and catch shadowing", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/imported-environment-scopes.ts", [
    "import { env as forEnvironment, env as forOfEnvironment, env as forInEnvironment, env as catchEnvironment } from 'node:process'",
    "for (let forEnvironment = {}; keepGoing(); advance()) { void forEnvironment.INSIDE_FOR }",
    "const afterFor = forEnvironment.AFTER_FOR",
    "for (const forOfEnvironment of environments) { void forOfEnvironment.INSIDE_FOR_OF }",
    "const afterForOf = forOfEnvironment.AFTER_FOR_OF",
    "for (const forInEnvironment in environments) { void forInEnvironment.INSIDE_FOR_IN }",
    "const afterForIn = forInEnvironment.AFTER_FOR_IN",
    "try { riskyOperation() } catch (catchEnvironment) { void catchEnvironment.INSIDE_CATCH }",
    "const afterCatch = catchEnvironment.AFTER_CATCH",
    "function varLoop() {",
    "  var localEnvironment = forEnvironment",
    "  for (var localEnvironment = {}; keepGoing(); advance()) { void localEnvironment.INSIDE_VAR }",
    "  return localEnvironment.AFTER_VAR",
    "}",
    "function nestedVarLoop() {",
    "  var localEnvironment = forEnvironment",
    "  for (let outer = 0; outer < 1; outer += 1) {",
    "    if (keepGoing()) {",
    "      for (let inner = 0; inner < 1; inner += 1) { var localEnvironment = {} }",
    "    }",
    "  }",
    "  return localEnvironment.AFTER_NESTED_VAR",
    "}",
    "void afterFor; void afterForOf; void afterForIn; void afterCatch; void varLoop; void nestedVarLoop",
    "",
  ].join("\n"))

  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.reads.map((row) => row.name), [
    "AFTER_FOR", "AFTER_FOR_OF", "AFTER_FOR_IN", "AFTER_CATCH",
  ])
  assert.equal(evidence.uncertainties.length, 0)
  assert.equal(evidence.errors.length, 0)
})

test("environment aliases survive uninitialized var redeclarations", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/imported-environment-var-redeclaration.ts", [
    "import { env as config } from 'node:process'",
    "function readEnvironment() {",
    "  var value = config",
    "  { var value }",
    "  consume(value)",
    "  const named = value.KEY",
    "  void named",
    "}",
    "void readEnvironment",
    "",
  ].join("\n"))

  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.reads.map((row) => [row.name, row.line]), [["KEY", 6]])
  assert.deepEqual(
    evidence.uncertainties.map((row) => [row.code, row.kind, row.line]),
    [["COMPUTED_ENVIRONMENT_READ", "whole-object-value", 5]],
  )
  assert.equal(evidence.errors.length, 0)
})

test("environment evidence excludes assignment and delete targets from static reads", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, ".env.example", [
    "DIRECT_ASSIGN=",
    "DIRECT_DELETE=",
    "DIRECT_ELEMENT_ASSIGN=",
    "DIRECT_ELEMENT_DELETE=",
    "ALIAS_ASSIGN=",
    "ALIAS_DELETE=",
    "ALIAS_ELEMENT_ASSIGN=",
    "ALIAS_ELEMENT_DELETE=",
    "COMPOUND_READ=",
    "LOGICAL_READ=",
    "DIRECT_READ=",
    "ALIAS_READ=",
    "",
  ].join("\n"))
  writeFixture(root, "lib/environment-writes.ts", [
    "process.env.DIRECT_ASSIGN = 'fixture'",
    "delete process.env.DIRECT_DELETE",
    "process.env['DIRECT_ELEMENT_ASSIGN'] = 'fixture'",
    "delete process.env['DIRECT_ELEMENT_DELETE']",
    "process.env[computedWriteName()] = 'fixture'",
    "const env = process.env",
    "env.ALIAS_ASSIGN = 'fixture'",
    "delete env.ALIAS_DELETE",
    "env['ALIAS_ELEMENT_ASSIGN'] = 'fixture'",
    "delete env['ALIAS_ELEMENT_DELETE']",
    "process.env.COMPOUND_READ += 'fixture'",
    "env.LOGICAL_READ ||= 'fixture'",
    "const directRead = process.env.DIRECT_READ",
    "const aliasRead = env.ALIAS_READ",
    "void directRead; void aliasRead",
    "",
  ].join("\n"))

  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.reads.map((row) => row.name).sort(), [
    "ALIAS_READ", "COMPOUND_READ", "DIRECT_READ", "LOGICAL_READ",
  ])
  assert.equal(evidence.uncertainties.length, 0)
})

test("environment evidence records whole-object consumption as name-unbounded uncertainty", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, ".env.example", "POSSIBLY_CONSUMED=\n")
  writeFixture(root, "lib/environment-whole-object.ts", [
    "const env = process.env",
    "const spreadDirect = { ...process.env }",
    "const spreadAlias = { ...env }",
    "const keys = Object.keys(process.env)",
    "const entries = Object.entries(env)",
    "const wrappedSpread = { ...(process.env) }",
    "const wrappedKeys = Object.keys((process.env))",
    "function inspect(environment) { return Object.values(environment) }",
    "void spreadDirect; void spreadAlias; void keys; void entries; void wrappedSpread; void wrappedKeys; void inspect",
    "",
  ].join("\n"))

  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  const computed = evidence.uncertainties.filter((row) => row.code === "COMPUTED_ENVIRONMENT_READ")
  const unproven = evidence.uncertainties.filter((row) => row.code === "UNPROVEN_ENVIRONMENT_ALIAS")
  assert.deepEqual(computed.map((row) => row.kind).sort(), [
    "object-entries", "object-keys", "object-keys", "object-spread", "object-spread", "object-spread",
  ])
  assert.deepEqual(unproven.map((row) => row.kind), ["object-values"])
  assert.ok(evidence.uncertainties.every((row) => row.name == null))
})

test("environment evidence records direct and proven-alias value-position escapes once", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, ".env.example", "NAMED=\n")
  writeFixture(root, "lib/environment-forwarding.ts", [
    "const env = process.env",
    "const forwarded = env",
    "const directProperty = { environment: process.env }",
    "const aliasProperty = { env }",
    "consume(process.env)",
    "consume(env)",
    "function returnDirect() { return process.env }",
    "function returnAlias() { return env }",
    "const directArray = [process.env]",
    "const aliasArray = [env]",
    "const directOr = { environment: process.env || fallback }",
    "const aliasOr = { environment: env || fallback }",
    "consume(process.env ?? fallback)",
    "consume(env ?? fallback)",
    "const spread = { ...process.env }",
    "const keys = Object.keys(env)",
    "const { NAMED } = env",
    "const named = env.NAMED",
    "const computed = env[getEnvironmentName()]",
    "env.ASSIGN_ONLY = 'fixture'",
    "delete env.DELETE_ONLY",
    "function shadow(env) { return env }",
    "void forwarded; void directProperty; void aliasProperty; void returnDirect; void returnAlias",
    "void directArray; void aliasArray; void directOr; void aliasOr; void spread; void keys",
    "void NAMED; void named; void computed; void shadow",
    "",
  ].join("\n"))

  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  const computed = evidence.uncertainties.filter((row) => row.code === "COMPUTED_ENVIRONMENT_READ")
  const wholeObjectValues = computed.filter((row) => row.kind === "whole-object-value")
  assert.deepEqual(wholeObjectValues.map((row) => row.line), [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14])
  assert.deepEqual(
    computed.filter((row) => row.kind !== "whole-object-value").map((row) => row.kind).sort(),
    ["element-access", "object-keys", "object-spread"],
  )
  assert.deepEqual(evidence.reads.map((row) => row.name), ["NAMED", "NAMED"])
  assert.equal(evidence.uncertainties.some((row) => row.code === "UNPROVEN_ENVIRONMENT_ALIAS"), false)
  assert.ok(evidence.uncertainties.every((row) => row.name == null))
  assertPrivateSerialization(evidence, root, ["getEnvironmentName()"])
})

test("environment evidence conservatively records compound values deferred from whole-object handlers", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/environment-compound-forwarding.ts", [
    "const logicalKeys = Object.keys(process.env || {})",
    "const logicalSpread = { ...(process.env || {}) }",
    "let forwarded",
    "forwarded = process.env || {}; consume(forwarded)",
    "const conditionalKeys = Object.keys(enabled ? process.env : {})",
    "void logicalKeys; void logicalSpread; void conditionalKeys",
    "",
  ].join("\n"))

  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  const computed = evidence.uncertainties.filter((row) => row.code === "COMPUTED_ENVIRONMENT_READ")
  assert.deepEqual(computed.map((row) => [row.kind, row.line]), [
    ["whole-object-value", 1],
    ["whole-object-value", 2],
    ["whole-object-value", 4],
    ["whole-object-value", 5],
  ])
  assert.equal(evidence.reads.length, 0)
  assert.equal(evidence.errors.length, 0)
})

test("asset report records Git identities, exact owners by scope, and conservative candidates", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "public/icons/direct.svg", "<svg>direct</svg>\n")
  writeFixture(root, "public/icons/css.png", "css-bytes")
  writeFixture(root, "public/icons/markdown.webp", "markdown-bytes")
  writeFixture(root, "public/icons/json.jpg", "json-bytes")
  writeFixture(root, "app/unreferenced.png", "candidate-bytes")
  writeFixture(root, "app/page.tsx", "const asset = \"/icons/direct.svg\"\nvoid asset\n")
  writeFixture(root, "app/styles.css", ".hero { background: url('/icons/css.png'); }\n")
  writeFixture(root, "docs/assets.md", "![fixture](/icons/markdown.webp)\n")
  writeFixture(root, "data/assets.json", "{\"image\":\"/icons/json.jpg\"}\n")
  writeFixture(root, "scripts/asset-tool.mjs", "const icon = '/icons/direct.svg'\nvoid icon\n")
  writeFixture(root, "tests/asset-owner.test.ts", "const icon = '/icons/direct.svg'\nvoid icon\n")

  const report = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  assert.equal(report.trackedAssets.length, 6)
  assert.ok(report.trackedAssets.every((asset) => /^[a-f0-9]{40,64}$/.test(asset.oid)))
  assert.ok(report.trackedAssets.every((asset) => Number.isInteger(asset.bytes) && asset.bytes > 0))
  assert.deepEqual(
    report.referenceOwners.map((row) => [row.fromPath, row.ownerScope, row.targetPath]),
    [
      ["app/page.tsx", "runtime", "public/icons/direct.svg"],
      ["app/styles.css", "runtime", "public/icons/css.png"],
      ["data/assets.json", "runtime", "public/icons/json.jpg"],
      ["docs/assets.md", "doc", "public/icons/markdown.webp"],
      ["scripts/asset-tool.mjs", "tool", "public/icons/direct.svg"],
      ["tests/asset-owner.test.ts", "test", "public/icons/direct.svg"],
    ],
  )
  assert.deepEqual(report.unreferencedCandidates.map((row) => row.path), ["app/unreferenced.png"])
  assert.equal(report.unreferencedCandidates[0].reason, "no-exact-static-reference")
  const index = buildTrackedTextIndex(root, policy)
  assert.equal(buildAuditEnvelope("asset", index, candidateBody(report)).deletionAuthority, false)
})

test("asset identities and bytes come from the staged Git blob", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const stagedContent = "staged-asset-bytes"
  const assetPath = writeFixture(root, "app/staged.png", stagedContent)
  writeFileSync(assetPath, "modified-worktree-content-that-must-not-affect-the-report")

  const report = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  const asset = report.trackedAssets.find((row) => row.path === "app/staged.png")
  const stagedOid = execFileSync("git", ["rev-parse", ":app/staged.png"], {
    cwd: root,
    encoding: "utf8",
  }).trim()
  assert.equal(asset.oid, stagedOid)
  assert.equal(asset.bytes, Buffer.byteLength(stagedContent))
})

test("asset report normalizes dot segments and keeps non-inventory literals out of exact owners", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "public/icons/direct.svg", "<svg/>\n")
  writeFixture(root, "public/direct.svg", "<svg>reentry-target</svg>\n")
  writeFixture(root, "docs/outside.svg", "<svg>outside</svg>\n")
  const escapedRootLiteral = "/icons/../../public/direct.svg"
  const escapedRepositoryLiteral = "public/icons/../../public/direct.svg"
  writeFixture(root, "app/page.tsx", [
    "const normalizedRoot = '/icons/nested/../direct.svg'",
    "const normalizedRepository = 'public/icons/nested/../direct.svg'",
    "const missing = '/icons/missing.svg'",
    "const outsideInventory = '../docs/outside.svg'",
    `const escapedRoot = '${escapedRootLiteral}'`,
    `const escapedRepository = '${escapedRepositoryLiteral}'`,
    "void normalizedRoot; void normalizedRepository; void missing; void outsideInventory",
    "void escapedRoot; void escapedRepository",
    "",
  ].join("\n"))

  const report = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(report.referenceOwners.map((row) => row.targetPath), [
    "public/icons/direct.svg",
    "public/icons/direct.svg",
  ])
  assert.equal(report.referenceOwners.some((row) => row.targetPath === "public/direct.svg"), false)
  assert.deepEqual(
    report.uncertainties.unresolvedLiteralAssets.map((row) => row.code).sort(),
    [
      "OUT_OF_INVENTORY_LITERAL_ASSET",
      "UNRESOLVED_LITERAL_ASSET",
      "UNRESOLVED_LITERAL_ASSET",
      "UNRESOLVED_LITERAL_ASSET",
    ],
  )
  assert.ok(report.uncertainties.unresolvedLiteralAssets.every((row) => row.targetPath === undefined))
  assertPrivateSerialization(report, root, [escapedRootLiteral, escapedRepositoryLiteral])
})

test("asset report resolves bare slash-relative paths only to tracked inventory assets", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, ".gitignore", "public/catalog/ignored/\n")
  writeFixture(root, "public/catalog/media/tracked.mp3", "tracked-media")
  writeFixture(root, "data/media/outside.mp3", "tracked-outside-inventory")
  writeFixture(root, "public/catalog/ignored/hidden.mp3", "ignored-media", { tracked: false })
  const literals = {
    exact: "media/tracked.mp3",
    missing: "media/missing.mp3",
    ignored: "ignored/hidden.mp3",
    escaped: "../../../private/escaped.mp3",
    scheme: "https://assets.example.test/remote.mp3",
    outside: "media/outside.mp3",
  }
  writeFixture(root, "public/catalog/index.json", `${JSON.stringify([
    literals.exact,
    literals.missing,
    literals.ignored,
    literals.escaped,
    literals.scheme,
  ])}\n`)
  writeFixture(root, "data/index.json", `${JSON.stringify([literals.outside])}\n`)

  const report = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(
    report.referenceOwners.map((row) => [row.fromPath, row.targetPath]),
    [
      ["data/index.json", "data/media/outside.mp3"],
      ["public/catalog/index.json", "public/catalog/media/tracked.mp3"],
    ],
  )
  assert.deepEqual(
    report.uncertainties.unresolvedLiteralAssets.map((row) => row.code).sort(),
    [
      "UNRESOLVED_LITERAL_ASSET",
      "UNRESOLVED_LITERAL_ASSET",
      "UNRESOLVED_LITERAL_ASSET",
    ],
  )
  assert.ok(report.uncertainties.unresolvedLiteralAssets.every((row) => (
    row.targetPath === undefined && /^[a-f0-9]{64}$/.test(row.literalSha256)
  )))
  assertPrivateSerialization(report, root, [
    literals.missing,
    literals.ignored,
    literals.escaped,
    literals.scheme,
  ])

  const realReport = buildAssetCandidateReport(buildTrackedTextIndex(repositoryRoot, policy), policy)
  const pilotRows = realReport.uncertainties.unresolvedLiteralAssets.filter((row) => (
    row.fromPath === "public/chimer/background-preview-pilot/index.json"
  ))
  assert.equal(pilotRows.length, 168)
  assert.ok(pilotRows.every((row) => row.targetPath === undefined))
  assert.equal(realReport.referenceOwners.some((row) => (
    row.fromPath === "public/chimer/background-preview-pilot/index.json"
  )), false)
})

test("asset report preserves basename ambiguity, dynamic construction, and explicit protected paths", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "public/first/icon.svg", "<svg>one</svg>\n")
  writeFixture(root, "public/second/icon.svg", "<svg>two</svg>\n")
  writeFixture(root, "public/catalog/generated.json", "{}\n")
  writeFixture(root, "public/provenance/licensed.mp3", "licensed-media")
  writeFixture(root, "public/manifest.json", "{}\n")
  writeFixture(root, "public/pwa/service-worker-icon.png", "pwa-icon")
  writeFixture(root, "public/compatibility/legacy-path.webp", "compatibility-asset")
  writeFixture(root, "tests/fixtures/parity/snapshot.png", "snapshot")
  writeFixture(root, "app/icon.png", "framework-icon")
  writeFixture(root, "app/icon9.png", "single-digit-framework-icon")
  writeFixture(root, "app/icon10.png", "multi-digit-framework-icon")
  writeFixture(root, "app/favicon.ico", "framework-favicon")
  const basenameLiteral = "icon.svg"
  const templateSecret = "private-template-fragment"
  const concatenationSecret = "private-concatenation-fragment"
  writeFixture(root, "app/page.tsx", [
    `const ambiguous = \"${basenameLiteral}\"`,
    `const dynamic = \`/public/${templateSecret}/\${name}.svg\``,
    `const concatenated = \"/${concatenationSecret}/\" + name + \".png\"`,
    "const fullyInterpolated = `/icons/${name}.${format}`",
    "void ambiguous; void dynamic; void concatenated; void fullyInterpolated",
    "",
  ].join("\n"))

  const report = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  assert.equal(report.basenameOnlySignals.length, 1)
  assert.deepEqual(report.basenameOnlySignals[0].candidateTargetPaths, [
    "public/first/icon.svg",
    "public/second/icon.svg",
  ])
  assert.equal(report.basenameOnlySignals[0].ownerScope, "runtime")
  assert.deepEqual(
    report.uncertainties.dynamicAssetExpressions.map((row) => row.kind).sort(),
    ["concatenation", "template", "template"],
  )
  assert.deepEqual(report.unreferencedCandidates.map((row) => row.path), ["app/icon10.png"])
  assert.ok(report.protectedAssets.some((asset) => (
    asset.path === "app/icon.png" && asset.reasons.includes("framework-convention")
  )))
  assert.ok(report.protectedAssets.some((asset) => (
    asset.path === "app/icon9.png" && asset.reasons.includes("framework-convention")
  )))
  assert.equal(report.protectedAssets.some((asset) => asset.path === "app/icon10.png"), false)
  assert.ok(report.protectedAssets.some((asset) => (
    asset.path === "app/favicon.ico" && asset.reasons.includes("framework-convention")
  )))
  for (const path of [
    "public/catalog/generated.json",
    "public/provenance/licensed.mp3",
    "public/manifest.json",
    "public/pwa/service-worker-icon.png",
    "public/compatibility/legacy-path.webp",
    "tests/fixtures/parity/snapshot.png",
  ]) {
    assert.ok(report.protectedAssets.some((asset) => asset.path === path))
  }
  assertPrivateSerialization(report, root, [
    templateSecret,
    concatenationSecret,
  ])
})

test("environment report avoids unread claims when a computed read has no provable name", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const secretValues = ["super-private-one", "super-private-two", "super-private-three"]
  writeFixture(root, ".env.example", [
    `SHARED=${secretValues[0]}`,
    `BRACKET=${secretValues[1]}`,
    "DESTRUCTURED=placeholder",
    "COMPUTED_LITERAL=placeholder",
    "TEST_ONLY=placeholder",
    "TOOLING=placeholder",
    `UNREAD=${secretValues[2]}`,
    "",
  ].join("\n"))
  writeFixture(root, "scripts/environment-tool.mjs", "const tool = process.env.TOOLING\nvoid tool\n")
  writeFixture(root, "tests/environment-owner.test.ts", "const value = process.env.TEST_ONLY\nvoid value\n")
  writeFixture(root, "lib/environment.ts", [
    "const direct = process.env.SHARED",
    "const bracket = process.env['BRACKET']",
    "const { DESTRUCTURED, ['COMPUTED_LITERAL']: computedLiteral } = process.env",
    "const missing = process.env.MISSING_FROM_EXAMPLE",
    "const computed = process.env[getName()]",
    "void direct; void bracket; void DESTRUCTURED; void computedLiteral; void missing; void computed",
    "",
  ].join("\n"))

  const report = buildEnvironmentCandidateReport(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(report.declaredKeys.map((row) => row.name), [
    "BRACKET",
    "COMPUTED_LITERAL",
    "DESTRUCTURED",
    "SHARED",
    "TEST_ONLY",
    "TOOLING",
    "UNREAD",
  ])
  assert.deepEqual(
    report.staticReads.map((row) => row.name).sort(),
    [
      "BRACKET",
      "COMPUTED_LITERAL",
      "DESTRUCTURED",
      "MISSING_FROM_EXAMPLE",
      "SHARED",
      "TEST_ONLY",
      "TOOLING",
    ],
  )
  assert.deepEqual(
    Object.fromEntries(report.staticReads.map((row) => [row.name, row.scope])),
    {
      BRACKET: "runtime",
      COMPUTED_LITERAL: "runtime",
      DESTRUCTURED: "runtime",
      MISSING_FROM_EXAMPLE: "runtime",
      SHARED: "runtime",
      TEST_ONLY: "test",
      TOOLING: "tool",
    },
  )
  assert.deepEqual(report.unreadDeclarationCandidates, [])
  assert.deepEqual(report.missingDeclarationFindings.map((row) => row.name), ["MISSING_FROM_EXAMPLE"])
  assert.equal(report.uncertainties.computedReads.length, 1)
  assert.equal(report.uncertainties.computedReads[0].scope, "runtime")
  const index = buildTrackedTextIndex(root, policy)
  assert.equal(buildAuditEnvelope("environment", index, candidateBody(report)).deletionAuthority, false)
  assertPrivateSerialization(report, root, [...secretValues, "getName()"])
})

test("environment report retains unread candidates when every access is name-bounded", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, ".env.example", "READ=\nUNREAD=\n")
  writeFixture(root, "lib/environment.ts", "const value = process.env.READ\nvoid value\n")

  const report = buildEnvironmentCandidateReport(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(report.unreadDeclarationCandidates.map((row) => row.name), ["UNREAD"])
})

test("asset and environment CLIs are byte-deterministic and never gain deletion authority", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, ".env.example", "PUBLIC_KEY=private-placeholder\nUNREAD=private-unread\n")
  writeFixture(root, "public/icon.svg", "<svg/>\n")
  writeFixture(root, "app/page.tsx", [
    "const icon = '/icon.svg'",
    "const key = process.env.PUBLIC_KEY",
    "void icon; void key",
    "",
  ].join("\n"))

  for (const cliPath of [assetCliPath, environmentCliPath]) {
    const first = runAuditCli(cliPath, root)
    const second = runAuditCli(cliPath, root)
    assert.equal(first.status, 0)
    assert.equal(first.stderr, "")
    assert.equal(first.stdout, second.stdout)
    const report = JSON.parse(first.stdout)
    assert.equal(report.deletionAuthority, false)
    assert.match(report.inventorySha256, /^[a-f0-9]{64}$/)
    assertPrivateSerialization(first.stdout, root, ["private-placeholder", "private-unread"])
  }
})

test("asset and environment CLIs use exact sanitized failures", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/page.tsx", "import {\n")
  const malformedPolicyPath = resolve(root, "malformed-cleanup-policy.json")
  const malformedPolicySecret = "private-malformed-policy-sentinel"
  writeFileSync(malformedPolicyPath, JSON.stringify({ unexpected: malformedPolicySecret }))

  for (const [cliPath, code] of [
    [assetCliPath, "ASSET_AUDIT_FAILED"],
    [environmentCliPath, "ENVIRONMENT_AUDIT_FAILED"],
  ]) {
    const policyFailure = runAuditCli(cliPath, root, malformedPolicyPath)
    assert.equal(policyFailure.status, 1)
    assert.equal(policyFailure.stdout, "")
    assert.equal(policyFailure.stderr, exactFailureEnvelope(code))
    assertPrivateSerialization(policyFailure.stderr, root, [malformedPolicySecret])

    const evidenceFailure = runAuditCli(cliPath, root)
    assert.equal(evidenceFailure.status, 1)
    assert.equal(evidenceFailure.stdout, "")
    assert.equal(evidenceFailure.stderr, exactFailureEnvelope(code))
    assertPrivateSerialization(evidenceFailure.stderr, root, ["import {"])
  }
})

test("private environment paths cannot affect asset or environment CLI output", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, ".gitignore", ".env.local\n")
  writeFixture(root, ".env.example", "PUBLIC_KEY=placeholder\n")
  writeFixture(root, "app/page.tsx", "const key = process.env.PUBLIC_KEY\nvoid key\n")

  const before = [runAuditCli(assetCliPath, root), runAuditCli(environmentCliPath, root)]
  const privateValue = "untracked-private-cli-sentinel"
  writeFixture(root, ".env.local", `PRIVATE=${privateValue}\n`, { tracked: false })
  const after = [runAuditCli(assetCliPath, root), runAuditCli(environmentCliPath, root)]
  for (let index = 0; index < before.length; index += 1) {
    assert.equal(before[index].status, 0)
    assert.equal(after[index].status, 0)
    assert.equal(after[index].stdout, before[index].stdout)
    assertPrivateSerialization(after[index].stdout, root, [privateValue, ".env.local"])
  }

  const trackedRoot = createFixtureRepository(t)
  writePackage(trackedRoot)
  const trackedPrivate = "tracked-private-cli-sentinel"
  writeFixture(trackedRoot, ".env.local", `PRIVATE=${trackedPrivate}\n`, { force: true })
  for (const [cliPath, code] of [
    [assetCliPath, "ASSET_AUDIT_FAILED"],
    [environmentCliPath, "ENVIRONMENT_AUDIT_FAILED"],
  ]) {
    const result = runAuditCli(cliPath, trackedRoot)
    assert.equal(result.status, 1)
    assert.equal(result.stdout, "")
    assert.equal(result.stderr, exactFailureEnvelope(code))
    assertPrivateSerialization(result.stderr, trackedRoot, [trackedPrivate, ".env.local"])
  }
})

test("ignored untracked private files never enter the index or evidence", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, ".gitignore", ".env.local\n")
  writeFixture(root, "app/page.tsx", "export default function Page() { return null }\n")
  const privateValue = "untracked-private-fixture-value"
  writeFixture(root, ".env.local", `PRIVATE=${privateValue}\n`, { tracked: false })

  const index = buildTrackedTextIndex(root, policy)
  const envelope = buildAuditEnvelope("environment", index, candidateBody(
    buildEnvironmentCandidateReport(index, policy),
  ))
  assert.equal(index.trackedPaths.includes(".env.local"), false)
  assertPrivateSerialization({ index, envelope }, root, [privateValue, ".env.local"])
})

test("ignored tracked paths are excluded before any blob read", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, ".gitignore", ".superpowers/sdd/\n")
  writeFixture(root, "app/page.tsx", "export default function Page() { return null }\n")
  const ignoredPath = ".superpowers/sdd/private-fixture.txt"
  const ignoredValue = "ignored-tracked-private-fixture-value"
  writeFixture(root, ignoredPath, `${ignoredValue}\n`, { force: true })
  const ignoredOid = execFileSync("git", ["rev-parse", `:${ignoredPath}`], {
    cwd: root,
    encoding: "utf8",
  }).trim()
  let ignoredBlobRequested = false
  const observingExec = (file, args, options) => {
    if (args[0] === "cat-file" && args[1] === "--batch" && String(options.input).includes(ignoredOid)) {
      ignoredBlobRequested = true
    }
    return execFileSync(file, args, options)
  }

  const index = buildTrackedTextIndex(root, policy, observingExec)
  assert.equal(ignoredBlobRequested, false)
  assert.equal(index.trackedPaths.includes(ignoredPath), false)
  assertPrivateSerialization(index, root, [ignoredPath, ignoredValue])
})

test("tracked private paths fail before blob contents can enter failures", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const privateValue = "tracked-private-fixture-value"
  writeFixture(root, ".env.local", `PRIVATE=${privateValue}\n`, { force: true })

  let failure
  let catFileCalled = false
  const observingExec = (file, args, options) => {
    if (args[0] === "cat-file") catFileCalled = true
    return execFileSync(file, args, options)
  }
  try {
    buildTrackedTextIndex(root, policy, observingExec)
  } catch (error) {
    failure = { code: error.code, message: error.message }
  }
  assert.deepEqual(failure, {
    code: "CLEANUP_FORBIDDEN_OR_INVALID_INDEX",
    message: "CLEANUP_FORBIDDEN_OR_INVALID_INDEX",
  })
  assert.equal(catFileCalled, false)
  assertPrivateSerialization(failure, root, [privateValue, ".env.local"])
})

test("bootstrap-private tracked paths fail before policy, metadata, or evidence blob reads", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const fixturePolicyPath = writeFixture(
    root,
    "scripts/repository-audit/cleanup-policy.json",
    `${JSON.stringify(policy, null, 2)}\n`,
  )
  const privatePath = "config/credentials.production.json"
  const privateValue = "bootstrap-private-fixture-value"
  writeFixture(root, privatePath, `${privateValue}\n`)

  const assertRejectedBeforeCatFile = (action) => {
    let catFileCalled = false
    const observingExec = (file, args, options) => {
      if (args[0] === "cat-file") catFileCalled = true
      return execFileSync(file, args, options)
    }
    let failure
    try {
      action(observingExec)
    } catch (error) {
      failure = { code: error.code, message: error.message }
    }
    assert.deepEqual(failure, {
      code: "CLEANUP_FORBIDDEN_OR_INVALID_INDEX",
      message: "CLEANUP_FORBIDDEN_OR_INVALID_INDEX",
    })
    assert.equal(catFileCalled, false)
    assertPrivateSerialization(failure, root, [privatePath, privateValue])
  }

  assertRejectedBeforeCatFile((observingExec) => loadCleanupContext(root, fixturePolicyPath, observingExec))
  assertRejectedBeforeCatFile((observingExec) => buildTrackedTextIndex(root, policy, observingExec))
})

test("policy loading uses the tracked stage-0 blob and ignores unstaged policy edits", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/page.tsx", "export default function Page() { return null }\n")
  const fixturePolicyPath = writeFixture(
    root,
    "scripts/repository-audit/cleanup-policy.json",
    `${JSON.stringify(policy, null, 2)}\n`,
  )

  const first = runAuditCli(deadCodeCliPath, root, fixturePolicyPath)
  const privateWorktreeValue = "unstaged-policy-value-that-must-not-be-read"
  writeFileSync(fixturePolicyPath, JSON.stringify({ unexpected: privateWorktreeValue }))
  const second = runAuditCli(deadCodeCliPath, root, fixturePolicyPath)

  assert.equal(first.status, 0)
  assert.equal(second.status, 0)
  assert.equal(second.stderr, "")
  assert.equal(second.stdout, first.stdout)
  assert.equal(loadCleanupContext(root, fixturePolicyPath).policy.schemaVersion, 1)
  assertPrivateSerialization(second.stdout, root, [privateWorktreeValue])
})

test("policy loading rejects private, untracked, and out-of-root paths before blob content reads", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const privateSentinel = "private-policy-content-sentinel"
  const privatePolicyPath = writeFixture(root, ".env.policy", privateSentinel, { force: true })
  const untrackedSentinel = "untracked-policy-content-sentinel"
  const untrackedPolicyPath = writeFixture(
    root, "untracked-policy.json", untrackedSentinel, { tracked: false },
  )
  const outsideRoot = mkdtempSync(join(tmpdir(), "atmoshaper-policy-outside-"))
  t.after(() => rmSync(outsideRoot, { recursive: true, force: true }))
  const outsidePolicyPath = resolve(outsideRoot, "outside-policy.json")
  const outsideSentinel = "outside-policy-content-sentinel"
  writeFileSync(outsidePolicyPath, outsideSentinel)

  for (const [selectedPolicyPath, expectedCode] of [
    [privatePolicyPath, "CLEANUP_POLICY_PATH_PRIVATE"],
    [untrackedPolicyPath, "CLEANUP_POLICY_PATH_UNTRACKED"],
    [outsidePolicyPath, "CLEANUP_POLICY_PATH_INVALID"],
  ]) {
    let contentRead = false
    const observingExec = (file, args, options) => {
      if (args[0] === "cat-file" && args[1] === "--batch") contentRead = true
      return execFileSync(file, args, options)
    }
    assert.throws(
      () => loadCleanupContext(root, selectedPolicyPath, observingExec),
      (error) => error.code === expectedCode && error.message === expectedCode,
    )
    assert.equal(contentRead, false)
    const result = runAuditCli(deadCodeCliPath, root, selectedPolicyPath)
    assert.equal(result.status, 1)
    assert.equal(result.stdout, "")
    assert.equal(result.stderr, exactFailureEnvelope("DEAD_CODE_AUDIT_FAILED"))
    assertPrivateSerialization(result.stderr, root, [privateSentinel, untrackedSentinel, outsideSentinel])
  }
})

test("tracked malformed policy fails with the exact sanitized CLI envelope", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const privateSentinel = "tracked-malformed-policy-sentinel"
  const malformedPolicyPath = writeFixture(
    root, "scripts/repository-audit/cleanup-policy.json", JSON.stringify({ unexpected: privateSentinel }),
  )
  const result = runAuditCli(deadCodeCliPath, root, malformedPolicyPath)
  assert.equal(result.status, 1)
  assert.equal(result.stdout, "")
  assert.equal(result.stderr, exactFailureEnvelope("DEAD_CODE_AUDIT_FAILED"))
  assertPrivateSerialization(result.stderr, root, [privateSentinel])
})

test("only policy-protected test fixtures turn unresolved literals into named uncertainty", (t) => {
  const protectedRoot = createFixtureRepository(t)
  writePackage(protectedRoot)
  writeFixture(protectedRoot, "tests/fixtures/negative.ts", "import '../missing-fixture-module'\n")
  const protectedEvidence = buildModuleEvidence(buildTrackedTextIndex(protectedRoot, policy), policy)
  assert.deepEqual(protectedEvidence.errors, [])
  assert.equal(protectedEvidence.uncertainties.length, 1)
  assert.equal(protectedEvidence.uncertainties[0].code, "NEGATIVE_FIXTURE_UNRESOLVED_LITERAL_MODULE")

  for (const path of ["tests/unprotected.test.ts", "app/active.ts"]) {
    const activeRoot = createFixtureRepository(t)
    writePackage(activeRoot)
    writeFixture(activeRoot, path, "import './missing-active-module'\n")
    const evidence = buildModuleEvidence(buildTrackedTextIndex(activeRoot, policy), policy)
    assert.equal(evidence.errors.length, 1)
    assert.equal(evidence.errors[0].code, "UNRESOLVED_LITERAL_MODULE")
    const result = runAuditCli(deadCodeCliPath, activeRoot)
    assert.equal(result.status, 1)
    assert.equal(result.stderr, exactFailureEnvelope("DEAD_CODE_AUDIT_FAILED"))
  }
})

test("module evidence records tracked Next configuration alias targets", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/enabled.ts", "export const enabled = true\n")
  writeFixture(root, "lib/disabled.ts", "export const disabled = true\n")
  writeFixture(root, "lib/shim.js", "export const shim = true\n")
  writeFixture(root, "lib/unused.ts", "export const unused = true\n")
  writeFixture(root, "lib/not-framework-config.ts", [
    "const resolveAlias = { unrelated: './disabled.ts' }",
    "void resolveAlias",
    "",
  ].join("\n"))
  writeFixture(root, "next.config.mjs", [
    "import { dirname, resolve } from 'node:path'",
    "import { fileURLToPath } from 'node:url'",
    "const root = dirname(fileURLToPath(import.meta.url))",
    "let mutableRoot = dirname(fileURLToPath(import.meta.url))",
    "mutableRoot = '/outside-the-repository'",
    "const selected = enabled ? './lib/enabled.ts' : './lib/disabled.ts'",
    "const nextConfig = {",
    "  turbopack: { resolveAlias: { feature: selected, shim: './lib/shim.js' } },",
    "  webpack(config) { config.resolve.alias.feature = resolve(root, selected); return config },",
    "  unsupported(config) { config.resolve.alias.unused = selectDifferentModule('./lib/unused.ts'); return config },",
    "  mutable(config) { config.resolve.alias.mutable = resolve(mutableRoot, './lib/unused.ts'); return config },",
    "  shadowResolver(config, resolve) { config.resolve.alias.shadowResolver = resolve(root, './lib/unused.ts'); return config },",
    "  shadowRoot(config, root) { config.resolve.alias.shadowRoot = resolve(root, './lib/unused.ts'); return config },",
    "  shadowDirname(config, dirname) { config.resolve.alias.shadowDirname = resolve(dirname(fileURLToPath(import.meta.url)), './lib/unused.ts'); return config },",
    "  shadowFileUrl(config, fileURLToPath) { config.resolve.alias.shadowFileUrl = resolve(dirname(fileURLToPath(import.meta.url)), './lib/unused.ts'); return config },",
    "  shadowSelected(config, selected) { config.resolve.alias.shadowSelected = resolve(root, selected); return config },",
    "  nestedVarResolver(config) { if (enabled) { var resolve = selectDifferentModule } config.resolve.alias.nestedVarResolver = resolve(root, './lib/unused.ts'); return config },",
    "  nestedVarRoot(config) { if (enabled) { var root = '/outside-the-repository' } config.resolve.alias.nestedVarRoot = resolve(root, './lib/unused.ts'); return config },",
    "  switchResolver(config, mode) { switch (mode) { case 'shadow': const resolve = selectDifferentModule; break; default: config.resolve.alias.switchResolver = resolve(root, './lib/unused.ts') } return config },",
    "  switchRoot(config, mode) { switch (mode) { case 'shadow': const root = '/outside-the-repository'; break; default: config.resolve.alias.switchRoot = resolve(root, './lib/unused.ts') } return config },",
    "}",
    "export default nextConfig",
    "",
  ].join("\n"))

  const evidence = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.errors, [])
  assert.deepEqual(
    [...new Set(evidence.references
      .filter((row) => row.kind === "framework-config-alias")
      .map((row) => row.targetPath))].sort(),
    ["lib/disabled.ts", "lib/enabled.ts", "lib/shim.js"],
  )
  assert.equal(evidence.references.some((row) => row.fromPath === "lib/not-framework-config.ts"), false)
  assert.equal(evidence.references.some((row) => row.targetPath === "lib/unused.ts"), false)
  assert.ok(evidence.uncertainties.some((row) => (
    row.path === "next.config.mjs" && row.kind === "framework-config-alias"
  )))
  assert.equal(
    evidence.references.filter((row) => row.kind === "framework-config-alias").length,
    5,
  )
  assert.equal(
    evidence.uncertainties.filter((row) => row.kind === "framework-config-alias").length,
    11,
  )
})

test("node:path configuration aliases use filesystem semantics", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/bare-relative.ts", "export const bareRelative = true\n")
  writeFixture(root, "lib/alias-only.ts", "export const aliasOnly = true\n")
  writeFixture(root, "next.config.mjs", [
    "import { dirname, resolve } from 'node:path'",
    "import { fileURLToPath } from 'node:url'",
    "const root = dirname(fileURLToPath(import.meta.url))",
    "export default {",
    "  webpack(config) {",
    "    config.resolve.alias.bareRelative = resolve(root, 'lib/bare-relative.ts')",
    "    config.resolve.alias.aliasOnly = resolve(root, '@/lib/alias-only.ts')",
    "    return config",
    "  },",
    "}",
    "",
  ].join("\n"))

  const evidence = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.errors, [])
  assert.deepEqual(
    evidence.references
      .filter((row) => row.kind === "framework-config-alias")
      .map((row) => row.targetPath),
    ["lib/bare-relative.ts"],
  )
  assert.equal(
    evidence.uncertainties.filter((row) => row.kind === "framework-config-alias").length,
    0,
  )
})

test("environment evidence tracks proven aliases and preserves unproven aliases as uncertainty", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, ".env.example", "DIRECT_ALIAS=\nDEFAULT_ALIAS=\nUNPROVEN_ALIAS=\n")
  writeFixture(root, "lib/environment-aliases.ts", [
    "const directEnv = process.env",
    "const direct = directEnv.DIRECT_ALIAS",
    "function fromDefault(env = process.env) { return env.DEFAULT_ALIAS }",
    "function fromInjection(env) { return env.UNPROVEN_ALIAS }",
    "void direct; void fromDefault; void fromInjection",
    "",
  ].join("\n"))
  const index = buildTrackedTextIndex(root, policy)
  const evidence = buildEnvironmentEvidence(index, policy)
  assert.deepEqual(evidence.reads.map((row) => row.name), ["DIRECT_ALIAS", "DEFAULT_ALIAS"])
  const uncertainty = evidence.uncertainties.find((row) => row.name === "UNPROVEN_ALIAS")
  assert.equal(uncertainty?.code, "UNPROVEN_ENVIRONMENT_ALIAS")
  const report = buildEnvironmentCandidateReport(index, policy)
  assert.equal(report.unreadDeclarationCandidates.some((row) => row.name === "UNPROVEN_ALIAS"), false)
  assert.equal(report.uncertainties.unprovenAliases[0].name, "UNPROVEN_ALIAS")
})

test("environment evidence recursively binds destructured default-parameter aliases", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const directExpression = "membershipEnvironmentName()"
  const nestedExpression = "nestedEnvironmentName()"
  writeFixture(root, "lib/membership.js", [
    `function readMembership({ env = process.env } = {}) { return env[${directExpression}] }`,
    `function readNested({ options: { environment = process.env } = {} } = {}) { return environment[${nestedExpression}] }`,
    "void readMembership; void readNested",
    "",
  ].join("\n"))

  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  const computed = evidence.uncertainties.filter((row) => row.code === "COMPUTED_ENVIRONMENT_READ")
  assert.equal(computed.length, 2)
  assert.ok(computed.every((row) => row.kind === "element-access"))
  assert.equal(evidence.uncertainties.some((row) => row.code === "UNPROVEN_ENVIRONMENT_ALIAS"), false)
  assertPrivateSerialization(evidence, root, [directExpression, nestedExpression])
})

test("environment evidence records nested object patterns defaulted to process env", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const computedExpression = "nestedEnvironmentName()"
  writeFixture(root, "lib/nested-environment-defaults.ts", [
    `const { options: { STATIC, [${computedExpression}]: computed } = process.env } = input`,
    "function readParameter({ options: { PARAMETER } = process.env } = {}) { return PARAMETER }",
    "void STATIC; void computed; void readParameter",
    "",
  ].join("\n"))

  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.reads.map((row) => [row.name, row.kind, row.line]), [
    ["STATIC", "destructure", 1],
    ["PARAMETER", "parameter-destructure", 2],
  ])
  assert.deepEqual(
    evidence.uncertainties.map((row) => [row.code, row.kind, row.line]),
    [["COMPUTED_ENVIRONMENT_READ", "destructure", 1]],
  )
  assertPrivateSerialization(evidence, root, [computedExpression])
})

test("environment alias scopes honor parameter defaults and ordinary shadowing", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/environment-scope.js", [
    "const captured = process.env",
    "function fromDefaults(local = process.env, forwarded = local) { return forwarded.PARAMETER_DEFAULT }",
    "function parameterShadow(captured) { return captured.PARAMETER_SHADOW }",
    "function variableShadow() { const captured = {}; return captured.VARIABLE_SHADOW }",
    "void captured; void fromDefaults; void parameterShadow; void variableShadow",
    "",
  ].join("\n"))

  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.reads.map((row) => row.name), ["PARAMETER_DEFAULT"])
  assert.equal(evidence.uncertainties.length, 0)
})

test("environment alias reassignment updates proven and unknown state", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const reassignmentExpression = "getInjectedEnvironment()"
  writeFixture(root, "lib/environment-reassignment.js", [
    "let env = process.env",
    "const before = env.BEFORE_REASSIGNMENT",
    `env = ${reassignmentExpression}`,
    "const uncertain = env.AFTER_UNKNOWN_REASSIGNMENT",
    "env = process.env",
    "const restored = env.AFTER_PROVEN_REASSIGNMENT",
    "let forwarded",
    "forwarded = (process.env)",
    "consume(forwarded)",
    "void before; void uncertain; void restored; void forwarded",
    "",
  ].join("\n"))

  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.reads.map((row) => row.name), [
    "BEFORE_REASSIGNMENT", "AFTER_PROVEN_REASSIGNMENT",
  ])
  assert.equal(evidence.uncertainties.length, 2)
  assert.equal(evidence.uncertainties[0].code, "UNPROVEN_ENVIRONMENT_ALIAS")
  assert.equal(evidence.uncertainties[0].name, "AFTER_UNKNOWN_REASSIGNMENT")
  assert.equal(evidence.uncertainties[1].code, "COMPUTED_ENVIRONMENT_READ")
  assert.equal(evidence.uncertainties[1].kind, "whole-object-value")
  assert.equal(evidence.uncertainties[1].line, 9)
  assertPrivateSerialization(evidence, root, [reassignmentExpression])
})

test("all four CLIs share the exact contract and one stage-0 inventory identity", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, ".env.example", "PUBLIC_KEY=\n")
  writeFixture(root, "public/icon.svg", "<svg/>\n")
  writeFixture(root, "app/page.tsx", [
    "const icon = '/icon.svg'",
    "const key = process.env.PUBLIC_KEY",
    "export default function Page() { return icon + key }",
    "",
  ].join("\n"))
  const expectedKeys = [
    "auditKind", "deletionAuthority", "findings", "inventorySha256",
    "schemaVersion", "summary", "uncertainties",
  ]
  const hashes = new Set()
  for (const [cliPath, auditKind] of [
    [deadCodeCliPath, "dead-code"],
    [dependencyCliPath, "dependency"],
    [assetCliPath, "asset"],
    [environmentCliPath, "environment"],
  ]) {
    const first = runAuditCli(cliPath, root)
    const second = runAuditCli(cliPath, root)
    assert.equal(first.status, 0)
    assert.equal(first.stderr, "")
    assert.equal(first.stdout, second.stdout)
    const report = JSON.parse(first.stdout)
    assert.deepEqual(Object.keys(report).sort(), expectedKeys)
    assert.equal(report.auditKind, auditKind)
    assert.equal(report.deletionAuthority, false)
    assert.match(report.inventorySha256, /^[a-f0-9]{64}$/)
    assert.ok(Array.isArray(report.findings))
    assert.ok(Array.isArray(report.uncertainties))
    hashes.add(report.inventorySha256)
  }
  assert.equal(hashes.size, 1)
})

test("repository-audit sources stay bounded and contain at most one evidence or candidate report builder", () => {
  const auditSourceRoot = resolve(repositoryRoot, "scripts/repository-audit")
  const sourcePaths = readdirSync(auditSourceRoot)
    .filter((path) => path.endsWith(".mjs"))
    .map((path) => resolve(auditSourceRoot, path))
  for (const path of sourcePaths) {
    const source = readFileSync(path, "utf8")
    const nonblankLineCount = source.split(/\r?\n/).filter((line) => line.trim()).length
    assert.ok(nonblankLineCount <= 500, `${path} has ${nonblankLineCount} nonblank lines`)
    const reportBuilders = source.match(/export function build[A-Za-z]+(?:Evidence|CandidateReport)\b/g) ?? []
    assert.ok(reportBuilders.length <= 1, `${path} mixes ${reportBuilders.length} report builders`)
  }
  for (const path of [deadCodeCliPath, dependencyCliPath, assetCliPath, environmentCliPath]) {
    const nonblankLineCount = readFileSync(path, "utf8").split(/\r?\n/).filter((line) => line.trim()).length
    assert.ok(nonblankLineCount <= 250, `${path} is not a thin CLI`)
  }
})

test("real runtime prefixes do not import the repository-audit implementation", () => {
  const index = buildTrackedTextIndex(repositoryRoot, policy)
  const evidence = buildModuleEvidence(index, policy)
  assert.deepEqual(evidence.errors, [])
  const runtimePrefixes = ["app/", "components/", "hooks/", "lib/", "prisma/", "public/"]
  const violations = evidence.references.filter((row) => (
    runtimePrefixes.some((prefix) => row.fromPath.startsWith(prefix)) &&
    row.targetKind === "tracked-module" &&
    row.targetPath.startsWith("scripts/repository-audit/")
  ))
  assert.deepEqual(violations, [])
  assert.ok(evidence.roots.some((row) => (
    row.path === "instrumentation-client.ts" && row.reason === "top-level-config"
  )))
  for (const declarationPath of [
    "types/generative-music.d.ts",
    "types/next-auth.d.ts",
    "types/nodemailer-v9.d.ts",
  ]) {
    assert.ok(evidence.roots.some((row) => (
      row.path === declarationPath && row.reason === "protected-path"
    )))
  }
})

test("real environment evidence reads STRIPE_SECRET_KEY through a proven default alias", () => {
  const index = buildTrackedTextIndex(repositoryRoot, policy)
  const evidence = buildEnvironmentEvidence(index, policy)
  assert.ok(evidence.reads.some((row) => row.name === "STRIPE_SECRET_KEY" && row.path === "lib/stripe-billing.js"))
  assert.ok(evidence.uncertainties.some((row) => (
    row.code === "COMPUTED_ENVIRONMENT_READ" &&
    row.kind === "whole-object-value" &&
    row.path === "scripts/stripe-supporter-membership-migration.mjs"
  )))
  assert.deepEqual(
    evidence.uncertainties
      .filter((row) => (
        row.code === "COMPUTED_ENVIRONMENT_READ" &&
        row.path === "app/api/billing/webhook/route.ts"
      ))
      .map((row) => [row.kind, row.line]),
    [["whole-object-value", 117], ["whole-object-value", 126]],
  )
  const report = buildEnvironmentCandidateReport(index, policy)
  assert.equal(report.unreadDeclarationCandidates.some((row) => row.name === "STRIPE_SECRET_KEY"), false)
})

test("real asset evidence inventories and protects every tracked Browser-QA PNG snapshot", () => {
  const index = buildTrackedTextIndex(repositoryRoot, policy)
  const report = buildAssetCandidateReport(index, policy)
  const snapshots = report.trackedAssets.filter((row) => (
    /^tests\/browser\/[^/]+-snapshots\/[^/]+\.png$/.test(row.path)
  ))
  assert.equal(snapshots.length, 24)
  const snapshotPaths = new Set(snapshots.map((row) => row.path))
  assert.equal(report.protectedAssets.filter((row) => snapshotPaths.has(row.path)).length, 24)
  assert.equal(report.unreferencedCandidates.some((row) => snapshotPaths.has(row.path)), false)
})

test("asset CLI applies Browser-QA snapshot protection from a staged fixture policy", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const snapshotPath = "tests/browser/atmoshaper-repository-migration-parity.spec.ts-snapshots/home.png"
  writeFixture(root, snapshotPath, "snapshot-bytes")

  const result = runAuditCli(assetCliPath, root)
  assert.equal(result.status, 0)
  assert.equal(result.stderr, "")
  const report = JSON.parse(result.stdout)
  assert.ok(report.findings.some((row) => (
    row.findingKind === "trackedAssets" && row.path === snapshotPath
  )))
  assert.ok(report.findings.some((row) => (
    row.findingKind === "protectedAssets" && row.path === snapshotPath
  )))
})

test("asset CLI applies staged data-catalog inventory and protection policy", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const catalogPath = "data/atmoshaper/retained-catalog.json"
  const catalogAbsolutePath = writeFixture(root, catalogPath, "{}\n")
  const fixturePolicy = clonePolicy()
  fixturePolicy.assetRoots = [...new Set([...fixturePolicy.assetRoots, "data/"])].sort()
  fixturePolicy.protectedPathPrefixes = [
    ...new Set([...fixturePolicy.protectedPathPrefixes, "data/"]),
  ].sort()
  const fixturePolicyPath = writeFixture(
    root,
    "scripts/repository-audit/cleanup-policy.json",
    `${JSON.stringify(fixturePolicy, null, 2)}\n`,
  )
  const privatePolicySentinel = "unstaged-private-data-policy"
  const privateCatalogSentinel = "unstaged-private-data-catalog"
  writeFileSync(fixturePolicyPath, `{"private":"${privatePolicySentinel}"}\n`)
  writeFileSync(catalogAbsolutePath, `{"private":"${privateCatalogSentinel}"}\n`)

  const result = runAuditCli(assetCliPath, root, fixturePolicyPath)
  assert.equal(result.status, 0)
  assert.equal(result.stderr, "")
  const report = JSON.parse(result.stdout)
  assert.ok(report.findings.some((row) => (
    row.findingKind === "trackedAssets" && row.path === catalogPath
  )))
  assert.ok(report.findings.some((row) => (
    row.findingKind === "protectedAssets" && row.path === catalogPath &&
    row.reasons.includes("policy-prefix:data/")
  )))
  assert.equal(report.findings.some((row) => (
    row.findingKind === "unreferencedCandidates" && row.path === catalogPath
  )), false)
  assert.equal(report.deletionAuthority, false)
  assertPrivateSerialization(result.stdout, root, [privatePolicySentinel, privateCatalogSentinel])
})

test("real retained data catalogs are tracked, protected, and never candidates", () => {
  assert.ok(policy.assetRoots.includes("data/"))
  assert.ok(policy.protectedPathPrefixes.includes("data/"))
  const index = buildTrackedTextIndex(repositoryRoot, policy)
  const dataPaths = index.trackedPaths.filter((path) => path.startsWith("data/") && path.endsWith(".json"))
  assert.equal(dataPaths.length, 40)
  const report = buildAssetCandidateReport(index, policy)
  const trackedPaths = new Set(report.trackedAssets.map((row) => row.path))
  const protectedPaths = new Set(report.protectedAssets.map((row) => row.path))
  const candidatePaths = new Set(report.unreferencedCandidates.map((row) => row.path))
  for (const path of dataPaths) {
    assert.ok(trackedPaths.has(path), `${path} is absent from tracked assets`)
    assert.ok(protectedPaths.has(path), `${path} is absent from protected assets`)
    assert.equal(candidatePaths.has(path), false, `${path} became a candidate`)
  }
})

test("audit envelope keeps inventory identity while findings change", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const index = buildTrackedTextIndex(root, policy)
  const first = buildAuditEnvelope("module", index, {
    summary: { count: 1 }, findings: [{ path: "a.ts" }], uncertainties: [],
  })
  const reordered = buildAuditEnvelope("module", index, {
    summary: { count: 1 }, findings: [{ path: "a.ts" }], uncertainties: [],
  })
  const changed = buildAuditEnvelope("module", index, {
    summary: { count: 1 }, findings: [{ path: "b.ts" }], uncertainties: [],
  })
  assert.deepEqual(first, reordered)
  assert.notDeepEqual(first.findings, changed.findings)
  assert.equal(first.inventorySha256, changed.inventorySha256)
  assert.equal(first.deletionAuthority, false)
  assert.equal(changed.deletionAuthority, false)
})

test("checked-in cleanup policy remains parseable JSON", () => {
  assert.deepEqual(JSON.parse(readFileSync(policyPath, "utf8")), policy)
})

test("package exposes the exact cleanup audit commands", () => {
  const packageJson = JSON.parse(readFileSync(resolve(repositoryRoot, "package.json"), "utf8"))
  assert.equal(packageJson.scripts["dead-code:audit"], "node scripts/repository-audit/dead-code.mjs")
  assert.equal(packageJson.scripts["dependency:audit"], "node scripts/repository-audit/dependency.mjs")
  assert.equal(packageJson.scripts["asset:audit"], "node scripts/repository-audit/asset.mjs")
  assert.equal(packageJson.scripts["env:audit"], "node scripts/repository-audit/environment.mjs")
})
