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
const realPolicy = loadCleanupPolicy(repositoryRoot, policyPath)
const policy = { ...structuredClone(realPolicy), manualToolSources: [] }

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

const clonePolicy = () => ({ ...structuredClone(policy), manualToolSources: [] })
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
    ? writeFixture(root, "scripts/repository-audit/cleanup-policy.json", `${JSON.stringify(clonePolicy(), null, 2)}\n`)
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
  assert.deepEqual(realPolicy.manualToolSources, ["scripts/atmoshaper-ripx-demucs-adapter.py"])

  const postcssRule = expectedConfigurationManifestOwnership[0]
  const shadcnRule = expectedConfigurationManifestOwnership[1]

  const cases = [
    { ...clonePolicy(), unexpected: true },
    { ...clonePolicy(), assetRoots: ["public\\"] },
    { ...clonePolicy(), sourceExtensions: [".js", ".js"] },
    { ...clonePolicy(), manualToolSources: ["scripts\\adapter.py"] },
    { ...clonePolicy(), manualToolSources: ["scripts/adapter.py", "scripts/adapter.py"] },
    { ...clonePolicy(), manualToolSources: ["lib/adapter.py"] },
    { ...clonePolicy(), manualToolSources: ["scripts/adapter.js"] },
    { ...clonePolicy(), manualToolSources: ["scripts/adapter.txt"] },
    {
      ...clonePolicy(),
      manualToolSources: ["scripts/adapter.env"],
      environmentDeclarationPaths: [".env.example", "scripts/adapter.env"],
    },
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
    "import { createRequire as makeRequire } from 'node:module'",
    "const loader = makeRequire(import.meta.url)",
    "const packageCli = loader.resolve('@scope/pkg/cli')",
    "const localTool = loader.resolve('../lib/tool')",
    `const selected = loader.resolve(${dynamicExpression})`,
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

  const realEvidence = buildDependencyEvidence(buildTrackedTextIndex(repositoryRoot, realPolicy), realPolicy)
  assert.ok(realEvidence.references.some((row) => (
    row.fromPath === "scripts/run-migration-parity-browser-qa.mjs" &&
    row.packageName === "@playwright/test" && row.kind === "require-resolve"
  )))
})

test("module evidence rejects shadowed loaders but preserves CJS and createRequire provenance", (t) => {
  const root = createFixtureRepository(t)
  const modulePolicy = {
    ...clonePolicy(),
    sourceExtensions: [...new Set([...policy.sourceExtensions, ".cts", ".mts"])].sort(),
    textExtensions: [...new Set([...policy.textExtensions, ".cts", ".mts"])].sort(),
  }
  writePackage(root, { dependencies: { "fixture-package": "1.0.0" } })
  writeFixture(root, "lib/tool.ts", "export const tool = true\n")
  const calls = [
    "require('../lib/tool')",
    "require.resolve('fixture-package')",
  ]
  writeFixture(root, "tests/shadowed-loaders.ts", [
    `function parameter(require) { ${calls.join("; ")} }`,
    `function functionShadow() { ${calls.join("; ")}; function require() {} }`,
    `function lexicalTdz() { ${calls.join("; ")}; let require }`,
    `function constantShadow() { const require = fake; ${calls.join("; ")} }`,
    `function variableShadow() { ${calls.join("; ")}; var require = fake }`,
    `{ const require = fake; ${calls.join("; ")} }`,
    `try {} catch (require) { ${calls.join("; ")} }`,
    `for (const require of loaders) { ${calls.join("; ")} }`,
    `class Example { method(require) { ${calls.join("; ")} } static { const require = fake; ${calls.join("; ")} } }`,
    `namespace Box { const require = fake; ${calls.join("; ")} }`,
    `(function (require) { ${calls.join("; ")} })(fake)`,
    "void parameter; void functionShadow; void lexicalTdz; void constantShadow; void variableShadow; void Example; void Box",
    "",
  ].join("\n"))
  writeFixture(root, "scripts/cjs-control.cjs", [
    "const direct = require('../lib/tool')",
    "const packagePath = require.resolve('fixture-package')",
    "var require",
    "void direct; void packagePath",
    "",
  ].join("\n"))
  writeFixture(root, "scripts/cjs-shadow.cjs", [
    "require('../lib/tool')",
    "require.resolve('fixture-package')",
    "function require() {}",
    "",
  ].join("\n"))
  writeFixture(root, "scripts/create-require.mjs", [
    "import { createRequire as makeRequire } from 'node:module'",
    "const loader = makeRequire(import.meta.url)",
    "const direct = loader('../lib/tool')",
    "const packagePath = loader.resolve('fixture-package')",
    "void direct; void packagePath",
    "",
  ].join("\n"))
  writeFixture(root, "scripts/create-require-arrow.mjs", [
    "import { createRequire } from 'node:module'",
    "const loader = createRequire(import.meta.url)",
    "const load = () => loader('../lib/tool')",
    "const locate = () => loader.resolve('fixture-package')",
    "void load; void locate",
    "",
  ].join("\n"))
  writeFixture(root, "scripts/cts-control.cts", [
    "const direct = require('../lib/tool')",
    "const packagePath = require.resolve('fixture-package')",
    "void direct; void packagePath",
    "",
  ].join("\n"))

  const evidence = buildModuleEvidence(buildTrackedTextIndex(root, modulePolicy), modulePolicy)
  const exactLoaderRows = evidence.references.filter((row) => ["require", "require-resolve"].includes(row.kind))
  assert.deepEqual(exactLoaderRows.map((row) => [row.fromPath, row.kind, row.targetKind]), [
    ["scripts/cjs-control.cjs", "require", "tracked-module"],
    ["scripts/cjs-control.cjs", "require-resolve", "package"],
    ["scripts/create-require-arrow.mjs", "require", "tracked-module"],
    ["scripts/create-require-arrow.mjs", "require-resolve", "package"],
    ["scripts/create-require.mjs", "require", "tracked-module"],
    ["scripts/create-require.mjs", "require-resolve", "package"],
    ["scripts/cts-control.cts", "require", "tracked-module"],
    ["scripts/cts-control.cts", "require-resolve", "package"],
  ])
  const unproven = evidence.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER")
  assert.equal(unproven.length, 26)
  assert.ok(unproven.every((row) => ["require", "require-resolve"].includes(row.kind)))
  assert.ok(unproven.every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
  assert.equal(JSON.stringify(unproven).includes("fixture-package"), false)
  assert.equal(evidence.errors.length, 0)

  const deadReport = buildDeadCodeCandidateReport(buildTrackedTextIndex(root, modulePolicy), modulePolicy)
  assert.equal(deadReport.referencedModules.find((row) => row.path === "lib/tool.ts")?.incomingReferenceCount, 4)
  const dependencyReport = buildDependencyCandidateReport(buildTrackedTextIndex(root, modulePolicy), modulePolicy)
  assert.equal(dependencyReport.literalImportOwners.filter((row) => row.packageName === "fixture-package").length, 4)
})

test("module loader provenance respects mutation, CJS Annex-B, class, and createRequire boundaries", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root, { dependencies: { "fixture-package": "1.0.0" } })
  writeFixture(root, "lib/tool.ts", "export const tool = true\n")
  writeFixture(root, "scripts/mutated-loader.mjs", [
    "import { createRequire as makeRequire } from 'module'",
    "let loader = makeRequire(import.meta.url)",
    "loader('../lib/tool')",
    "loader.resolve('fixture-package')",
    "loader = fake",
    "loader('../lib/tool')",
    "loader.resolve('fixture-package')",
    "",
  ].join("\n"))
  writeFixture(root, "scripts/unsupported-loader.mjs", [
    "import { createRequire as makeRequire } from 'node:module'",
    "const loader = makeRequire(runtimeUrl)",
    "loader('../lib/tool')",
    "loader.resolve('fixture-package')",
    "function shadow(makeRequire) {",
    "  const nested = makeRequire(import.meta.url)",
    "  nested('../lib/tool')",
    "  nested.resolve('fixture-package')",
    "}",
    "void shadow",
    "",
  ].join("\n"))
  writeFixture(root, "scripts/cjs-annex.cjs", [
    "{ function require() {} }",
    "require('../lib/tool')",
    "require.resolve('fixture-package')",
    "",
  ].join("\n"))
  writeFixture(root, "scripts/cjs-class.cjs", [
    "const Named = class require {",
    "  method() { require('../lib/tool'); require.resolve('fixture-package') }",
    "}",
    "class Ordinary { require() { require('../lib/tool'); require.resolve('fixture-package') } }",
    "void Named; void Ordinary",
    "",
  ].join("\n"))

  const evidence = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  const loaderReferences = evidence.references.filter((row) => ["require", "require-resolve"].includes(row.kind))
  assert.deepEqual(loaderReferences.map((row) => [row.fromPath, row.line, row.kind]), [
    ["scripts/cjs-class.cjs", 4, "require"],
    ["scripts/cjs-class.cjs", 4, "require-resolve"],
    ["scripts/mutated-loader.mjs", 3, "require"],
    ["scripts/mutated-loader.mjs", 4, "require-resolve"],
  ])
  const unproven = evidence.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER")
  assert.equal(unproven.length, 10)
  assert.ok(unproven.every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
  assert.equal(JSON.stringify(unproven).includes("runtimeUrl"), false)
  assert.equal(evidence.errors.length, 0)
})

test("module loader scope predeclares parameters switch cases and enum members", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/tool.ts", "export const tool = true\n")
  writeFixture(root, "scripts/scope-boundaries.cts", [
    "function parameterShadow(value = require('../lib/tool'), require) { void value; void require }",
    "function parameterControl(value = require('../lib/tool'), other) { void value; void other }",
    "switch (mode) { case 0: require('../lib/tool'); break; case 1: const require = fake; void require }",
    "switch (otherMode) { case 0: require('../lib/tool'); break; default: void 0 }",
    "enum Shadowed { before = require('../lib/tool'), require = 1 }",
    "enum Control { before = require('../lib/tool'), ordinary = 1 }",
    "void parameterShadow; void parameterControl; void Shadowed; void Control",
    "",
  ].join("\n"))

  const evidence = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  const exact = evidence.references.filter((row) => row.kind === "require")
  assert.deepEqual(exact.map((row) => row.line), [2, 4, 6])
  const unproven = evidence.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER")
  assert.deepEqual(unproven.map((row) => row.line), [1, 3, 5])
  assert.ok(unproven.every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
  assert.equal(evidence.errors.length, 0)
})

test("module loader for-in and for-of evaluate iterables before invalidating iteration targets", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  for (const path of ["lib/items.ts", "lib/tool.ts"]) writeFixture(root, path, "export default true\n")
  writeFixture(root, "scripts/iteration.mjs", [
    "import { createRequire } from 'node:module'",
    "let loader = createRequire(import.meta.url)",
    "for (loader of loader('../lib/items')) { loader('../lib/tool') }",
    "let second = createRequire(import.meta.url)",
    "for (second in second('../lib/items')) { second('../lib/tool') }",
    "const outer = createRequire(import.meta.url)",
    "for (const outer of outer('../lib/items')) { outer('../lib/tool') }",
    "for (const item of outer('../lib/items')) { void item }",
    "",
  ].join("\n"))

  const evidence = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  const exact = evidence.references.filter((row) => row.kind === "require")
  assert.deepEqual(exact.map((row) => [row.line, row.targetPath]), [
    [3, "lib/items.ts"],
    [5, "lib/items.ts"],
    [8, "lib/items.ts"],
  ])
  const unproven = evidence.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER")
  assert.deepEqual(unproven.map((row) => row.line), [3, 5, 7, 7])
  assert.equal(evidence.errors.length, 0)
})

test("module loader invalidation follows wrapped recursive assignment and update targets only", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/tool.ts", "export const tool = true\n")
  writeFixture(root, "scripts/targets.mts", [
    "import { createRequire } from 'node:module'",
    "let direct = createRequire(import.meta.url)",
    "!direct; typeof direct; +direct; direct('../lib/tool');",
    "(direct as any) = fake; direct('../lib/tool')",
    "let objectTarget = createRequire(import.meta.url);",
    "({ nested: { objectTarget } } = value); objectTarget('../lib/tool')",
    "let arrayTarget = createRequire(import.meta.url);",
    "[arrayTarget] = value; arrayTarget('../lib/tool')",
    "let updated = createRequire(import.meta.url);",
    "++(updated as any); updated('../lib/tool')",
    "",
  ].join("\n"))

  const first = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  const second = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(
    first.references.filter((row) => row.kind === "require").map((row) => row.line),
    [3],
  )
  const unproven = first.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER")
  assert.deepEqual(unproven.map((row) => row.line), [4, 6, 8, 10])
  assert.ok(unproven.every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
  assert.equal(JSON.stringify(unproven).includes("../lib/tool"), false)
  assert.equal(first.errors.length, 0)
})

test("module loader provenance propagates only through direct identifier bindings", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/tool.ts", "export const tool = true\n")
  writeFixture(root, "scripts/bindings.mjs", [
    "import { createRequire } from 'node:module'",
    "const loader = createRequire(import.meta.url)",
    "const alias = loader; alias('../lib/tool')",
    "const { require } = loader; require('../lib/tool')",
    "const { nested: objectAlias } = loader; objectAlias('../lib/tool')",
    "const [arrayAlias] = loader; arrayAlias('../lib/tool')",
    "",
  ].join("\n"))

  const evidence = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(
    evidence.references.filter((row) => row.kind === "require").map((row) => row.line),
    [3],
  )
  const unproven = evidence.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER")
  assert.deepEqual(unproven.map((row) => row.line), [4])
  assert.equal(evidence.errors.length, 0)
})

test("module loader assignment evaluates sources before recursive spread targets", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root, { dependencies: { "fixture-package": "1.0.0" } })
  writeFixture(root, "lib/tool.ts", "export const tool = true\n")
  writeFixture(root, "scripts/assignment-order.mts", [
    "import { createRequire } from 'node:module'",
    "let loader = createRequire(import.meta.url);",
    "(({ [loader.resolve('fixture-package')]: loader = loader('../lib/tool') } as any) = loader('../lib/tool'));",
    "loader('../lib/tool')",
    "let spread = createRequire(import.meta.url);",
    "[...(spread as any)] = values;",
    "spread('../lib/tool')",
    "",
  ].join("\n"))

  const first = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  const second = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(
    first.references.filter((row) => row.kind === "require").map((row) => row.line),
    [3, 3],
  )
  assert.deepEqual(
    first.references.filter((row) => row.kind === "require-resolve").map((row) => row.line),
    [3],
  )
  const unproven = first.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER")
  assert.deepEqual(unproven.map((row) => row.line), [4, 7])
  assert.ok(unproven.every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
  assert.equal(JSON.stringify(unproven).includes("../lib/tool"), false)
  assert.equal(first.errors.length, 0)
})

test("module loader traverses evaluated binding defaults and computed names without provenance", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root, { dependencies: { "fixture-package": "1.0.0" } })
  writeFixture(root, "lib/tool.ts", "export const tool = true\n")
  writeFixture(root, "scripts/binding-evaluation.mts", [
    "import { createRequire } from 'node:module'",
    "const loader = createRequire(import.meta.url)",
    "const { [loader.resolve('fixture-package')]: variable = loader('../lib/tool') } = source",
    "function parameter({ [loader.resolve('fixture-package')]: value = loader('../lib/tool') } = source) { void value }",
    "for (const { [loader.resolve('fixture-package')]: item = loader('../lib/tool') } of values) { void item }",
    "class Example {",
    "  [loader.resolve('fixture-package')] = loader('../lib/tool');",
    "  [loader.resolve('fixture-package')]({ [loader.resolve('fixture-package')]: method = loader('../lib/tool') } = source) { void method }",
    "}",
    "void variable; void parameter; void Example",
    "",
  ].join("\n"))

  const evidence = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(
    evidence.references.filter((row) => row.kind === "require").map((row) => row.line),
    [3, 4, 5, 7, 8],
  )
  assert.deepEqual(
    evidence.references.filter((row) => row.kind === "require-resolve").map((row) => row.line),
    [3, 4, 5, 7, 8, 8],
  )
  assert.equal(evidence.uncertainties.some((row) => row.code === "UNPROVEN_MODULE_LOADER"), false)
  assert.equal(evidence.errors.length, 0)
})

test("named class expressions shadow loader aliases while evaluating heritage", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/base.ts", "export default class Base {}\n")
  writeFixture(root, "lib/tool.ts", "export const tool = true\n")
  writeFixture(root, "scripts/class-heritage.mjs", [
    "import { createRequire } from 'node:module'",
    "const loader = createRequire(import.meta.url)",
    "const Named = class loader extends loader('../lib/base') { method() { loader('../lib/tool') } }",
    "class Ordinary extends loader('../lib/base') { method() { loader('../lib/tool') } }",
    "void Named; void Ordinary",
    "",
  ].join("\n"))

  const evidence = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(
    evidence.references.filter((row) => row.kind === "require").map((row) => [row.line, row.targetPath]),
    [[4, "lib/base.ts"], [4, "lib/tool.ts"]],
  )
  const unproven = evidence.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER")
  assert.deepEqual(unproven.map((row) => row.line), [3, 3])
  assert.equal(evidence.errors.length, 0)
})

test("sloppy CJS Annex-B block functions invalidate loaders when executed", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/tool.ts", "export const tool = true\n")
  writeFixture(root, "scripts/annex-order.cjs", [
    "var loader = require",
    "loader('../lib/tool')",
    "if (enabled) { function loader() {} }",
    "loader('../lib/tool')",
    "var guarded = require",
    "{ let guarded; { function guarded() {} } }",
    "guarded('../lib/tool')",
    "",
  ].join("\n"))

  const evidence = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(
    evidence.references.filter((row) => row.kind === "require").map((row) => row.line),
    [2, 7],
  )
  const unproven = evidence.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER")
  assert.deepEqual(unproven.map((row) => row.line), [4])
  assert.equal(evidence.errors.length, 0)
})

test("destructuring patterns invalidate earlier loader targets before later defaults", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/tool.ts", "export const tool = true\n")
  const cases = [
    ["scripts/assignment-order.cjs", "({ require, x = require('../lib/tool') } = other)\n"],
    ["scripts/declaration-order.cjs", "var { require, x = require('../lib/tool') } = other\n"],
    ["scripts/for-order.cjs", "for ({ require, x = require('../lib/tool') } of things) {}\n"],
  ]
  const controls = [
    ["scripts/assignment-control.cjs", "({ x = require('../lib/tool'), require } = other)\n"],
    ["scripts/declaration-control.cjs", "var { x = require('../lib/tool'), require } = other\n"],
    ["scripts/for-control.cjs", "for ({ x = require('../lib/tool'), require } of things) {}\n"],
  ]
  for (const [path, source] of [...cases, ...controls]) writeFixture(root, path, source)

  const first = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  const second = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(
    first.references.filter((row) => row.kind === "require").map((row) => row.fromPath),
    controls.map(([path]) => path).sort(),
  )
  const unproven = first.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER")
  assert.deepEqual(unproven.map((row) => row.path), cases.map(([path]) => path).sort())
  assert.ok(unproven.every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
  assert.equal(JSON.stringify(unproven).includes("../lib/tool"), false)
  assert.equal(first.errors.length, 0)
})

test("catch binding patterns evaluate computed keys and defaults in catch scope", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root, { dependencies: { "fixture-package": "1.0.0" } })
  writeFixture(root, "lib/tool.ts", "export const tool = true\n")
  writeFixture(root, "scripts/catch-patterns.cjs", [
    "try {} catch ({ x = require('../lib/tool') }) {}",
    "try {} catch ({ [require.resolve('fixture-package')]: y = require('../lib/tool') }) {}",
    "try {} catch ({ require, z = require('../lib/tool') }) {}",
    "",
  ].join("\n"))

  const evidence = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(
    evidence.references.filter((row) => row.kind === "require").map((row) => row.line),
    [1, 2],
  )
  assert.deepEqual(
    evidence.references.filter((row) => row.kind === "require-resolve").map((row) => row.line),
    [2],
  )
  const unproven = evidence.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER")
  assert.deepEqual(unproven.map((row) => row.line), [3])
  assert.equal(evidence.errors.length, 0)
})

test("member assignment defaults evaluate target references before defaults", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/tool.ts", "export const tool = true\n")
  writeFixture(root, "scripts/member-default.cjs", [
    "([holder[require('../lib/tool')] = (require = other)] = values)",
    "require('../lib/tool')",
    "",
  ].join("\n"))
  writeFixture(root, "scripts/member-control.cjs", [
    "([holder[(require = other)] = require('../lib/tool')] = values)",
    "",
  ].join("\n"))

  const evidence = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(
    evidence.references.filter((row) => row.kind === "require").map((row) => [row.fromPath, row.line]),
    [["scripts/member-default.cjs", 1]],
  )
  const unproven = evidence.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER")
  assert.deepEqual(unproven.map((row) => [row.path, row.line]), [
    ["scripts/member-control.cjs", 1],
    ["scripts/member-default.cjs", 2],
  ])
  assert.ok(unproven.every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
  assert.equal(evidence.errors.length, 0)
})

test("plain var loop targets invalidate loaders after iterable evaluation", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  for (const path of ["lib/items.ts", "lib/tool.ts"]) writeFixture(root, path, "export default true\n")
  writeFixture(root, "scripts/plain-loop-targets.mjs", [
    "import { createRequire } from 'node:module'",
    "var loader = createRequire(import.meta.url)",
    "for (var loader of loader('../lib/items')) { loader('../lib/tool') }",
    "var resolver = createRequire(import.meta.url)",
    "for (var resolver in resolver('../lib/items')) { resolver('../lib/tool') }",
    "const lexical = createRequire(import.meta.url)",
    "for (let lexical of lexical('../lib/items')) { lexical('../lib/tool') }",
    "const stable = createRequire(import.meta.url)",
    "for (var item of stable('../lib/items')) { stable('../lib/tool') }",
    "",
  ].join("\n"))
  writeFixture(root, "scripts/redeclaration-control.cjs", [
    "var loader = require",
    "var loader = loader",
    "loader('../lib/tool')",
    "",
  ].join("\n"))

  const first = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  const second = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(
    first.references.filter((row) => row.kind === "require").map((row) => [row.line, row.targetPath]),
    [
      [3, "lib/items.ts"], [5, "lib/items.ts"], [9, "lib/items.ts"], [9, "lib/tool.ts"],
      [3, "lib/tool.ts"],
    ],
  )
  const unproven = first.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER")
  assert.deepEqual(unproven.map((row) => row.line), [3, 5, 7, 7])
  assert.ok(unproven.every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
  assert.equal(JSON.stringify(unproven).includes("../lib/tool"), false)
  assert.equal(first.errors.length, 0)
})

test("loader evidence evaluates class method and parameter decorators in lexical order", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/base.ts", "export default class Base {}\n")
  writeFixture(root, "lib/tool.ts", "export const tool = true\n")
  writeFixture(root, "scripts/decorator-coverage.cts", [
    "@decorate(require('../lib/tool'))",
    "class Example {",
    "  @decorate(require('../lib/tool'))",
    "  method(@decorate(require('../lib/tool')) value = require('../lib/tool')) {}",
    "}",
    "void Example",
    "",
  ].join("\n"))
  writeFixture(root, "scripts/decorator-scope.cts", [
    "class Example {",
    "  @decorate(require('../lib/tool'))",
    "  method(@decorate(require('../lib/tool')) require) {}",
    "}",
    "const Named = class require {",
    "  @decorate(require('../lib/tool'))",
    "  method(@decorate(require('../lib/tool')) value) {}",
    "}",
    "void Example; void Named",
    "",
  ].join("\n"))
  writeFixture(root, "scripts/decorator-order.cts", [
    "@(decorate(require('../lib/tool')), require = other, decorate)",
    "class Example extends require('../lib/base') {}",
    "void Example",
    "",
  ].join("\n"))

  const evidence = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(
    evidence.references.filter((row) => row.kind === "require").map((row) => [row.fromPath, row.line]),
    [
      ["scripts/decorator-coverage.cts", 1],
      ["scripts/decorator-coverage.cts", 3],
      ["scripts/decorator-coverage.cts", 4],
      ["scripts/decorator-coverage.cts", 4],
      ["scripts/decorator-order.cts", 1],
      ["scripts/decorator-scope.cts", 2],
      ["scripts/decorator-scope.cts", 3],
    ],
  )
  const unproven = evidence.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER")
  assert.deepEqual(unproven.map((row) => [row.path, row.line]), [
    ["scripts/decorator-order.cts", 2],
    ["scripts/decorator-scope.cts", 6],
    ["scripts/decorator-scope.cts", 7],
  ])
  assert.equal(evidence.errors.length, 0)
})

test("sloppy with bodies downgrade visible loaders without mutating outer scope", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root, { dependencies: { "fixture-package": "1.0.0" } })
  writeFixture(root, "lib/tool.ts", "export const tool = true\n")
  writeFixture(root, "scripts/with-loader.cjs", [
    "with (require('../lib/tool')) { require('../lib/tool'); require.resolve('fixture-package') }",
    "require('../lib/tool')",
    "const loader = require",
    "with (scope) { loader('../lib/tool'); loader.resolve('fixture-package') }",
    "loader('../lib/tool')",
    "",
  ].join("\n"))

  const first = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  const second = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(
    first.references.filter((row) => ["require", "require-resolve"].includes(row.kind))
      .map((row) => [row.line, row.kind]),
    [[1, "require"], [2, "require"], [5, "require"]],
  )
  const unproven = first.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER")
  assert.deepEqual(unproven.map((row) => [row.line, row.kind]), [
    [1, "require"], [1, "require-resolve"], [4, "require"], [4, "require-resolve"],
  ])
  assert.ok(unproven.every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
  assert.equal(first.errors.length, 0)
})

test("optional loader calls preserve exact and shadowed classifications", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root, { dependencies: { "fixture-package": "1.0.0" } })
  writeFixture(root, "lib/tool.ts", "export const tool = true\n")
  writeFixture(root, "scripts/optional-loader.cjs", [
    "require?.('../lib/tool')",
    "require.resolve?.('fixture-package')",
    "require?.resolve('../lib/tool')",
    "const loader = require",
    "loader?.('../lib/tool')",
    "loader.resolve?.('fixture-package')",
    "loader?.resolve('../lib/tool')",
    "function shadow(require) { require?.('../lib/tool'); require.resolve?.('fixture-package'); require?.resolve('../lib/tool') }",
    "void shadow",
    "",
  ].join("\n"))

  const first = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  const second = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(
    first.references.filter((row) => ["require", "require-resolve"].includes(row.kind))
      .map((row) => [row.line, row.kind]),
    [
      [1, "require"], [2, "require-resolve"], [3, "require-resolve"],
      [5, "require"], [6, "require-resolve"], [7, "require-resolve"],
    ],
  )
  const unproven = first.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER")
  assert.deepEqual(unproven.map((row) => row.kind), ["require", "require-resolve", "require-resolve"])
  assert.ok(unproven.every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
  assert.equal(JSON.stringify(unproven).includes("fixture-package"), false)
  assert.equal(first.errors.length, 0)
})

test("sloppy with writes downgrade reachable outer loaders but respect lexical shields", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/tool.ts", "export const tool = true\n")
  writeFixture(root, "scripts/with-direct-write.cjs", [
    "with (require('../lib/tool')) { require = other }",
    "require('../lib/tool')",
    "",
  ].join("\n"))
  writeFixture(root, "scripts/with-alias-write.cjs", [
    "const loader = require",
    "with (scope) { (loader) = other }",
    "loader('../lib/tool')",
    "",
  ].join("\n"))
  writeFixture(root, "scripts/with-lexical-control.cjs", [
    "const loader = require",
    "with (scope) { let require; require = other; let loader; loader = other }",
    "require('../lib/tool'); loader('../lib/tool')",
    "",
  ].join("\n"))

  const first = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  const second = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(
    first.references.filter((row) => row.kind === "require").map((row) => [row.fromPath, row.line]),
    [
      ["scripts/with-direct-write.cjs", 1],
      ["scripts/with-lexical-control.cjs", 3],
      ["scripts/with-lexical-control.cjs", 3],
    ],
  )
  const unproven = first.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER")
  assert.deepEqual(unproven.map((row) => [row.path, row.line]), [
    ["scripts/with-alias-write.cjs", 3],
    ["scripts/with-direct-write.cjs", 2],
  ])
  assert.ok(unproven.every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
  assert.equal(JSON.stringify(unproven).includes("../lib/tool"), false)
  assert.equal(first.errors.length, 0)
})

test("resolve mutations downgrade later resolution without invalidating plain loader calls", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root, { dependencies: { "fixture-package": "1.0.0" } })
  writeFixture(root, "lib/tool.ts", "export const tool = true\n")
  writeFixture(root, "scripts/resolve-assignment.cts", [
    "require.resolve('fixture-package');",
    "((require as any).resolve) = other",
    "require.resolve?.('fixture-package')",
    "require('../lib/tool')",
    "",
  ].join("\n"))
  writeFixture(root, "scripts/resolve-update.cts", [
    "const loader = require",
    "loader.resolve('fixture-package')",
    "++((loader as any).resolve)",
    "loader.resolve?.('fixture-package')",
    "require.resolve('fixture-package')",
    "loader('../lib/tool'); require('../lib/tool')",
    "",
  ].join("\n"))
  writeFixture(root, "scripts/resolve-delete.cts", [
    "const loader = require",
    "delete (loader as any)?.resolve",
    "loader.resolve?.('fixture-package')",
    "loader('../lib/tool')",
    "",
  ].join("\n"))
  writeFixture(root, "scripts/resolve-shadow.cjs", [
    "function shadow(loader) { loader.resolve = other; loader.resolve('fixture-package') }",
    "require.resolve('fixture-package')",
    "void shadow",
    "",
  ].join("\n"))

  const first = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  const second = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(
    first.references.filter((row) => ["require", "require-resolve"].includes(row.kind))
      .map((row) => [row.fromPath, row.line, row.kind]),
    [
      ["scripts/resolve-assignment.cts", 1, "require-resolve"],
      ["scripts/resolve-assignment.cts", 4, "require"],
      ["scripts/resolve-delete.cts", 4, "require"],
      ["scripts/resolve-shadow.cjs", 2, "require-resolve"],
      ["scripts/resolve-update.cts", 2, "require-resolve"],
      ["scripts/resolve-update.cts", 6, "require"],
      ["scripts/resolve-update.cts", 6, "require"],
    ],
  )
  const unproven = first.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER")
  assert.deepEqual(unproven.map((row) => [row.path, row.line, row.kind]), [
    ["scripts/resolve-assignment.cts", 3, "require-resolve"],
    ["scripts/resolve-delete.cts", 3, "require-resolve"],
    ["scripts/resolve-update.cts", 4, "require-resolve"],
    ["scripts/resolve-update.cts", 5, "require-resolve"],
  ])
  assert.ok(unproven.every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
  assert.equal(JSON.stringify(unproven).includes("fixture-package"), false)
  assert.equal(first.errors.length, 0)
})

test("resolve writes through sloppy with scopes downgrade reachable method provenance", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root, { dependencies: { "fixture-package": "1.0.0" } })
  writeFixture(root, "lib/tool.ts", "export const tool = true\n")
  writeFixture(root, "scripts/with-resolve-direct.cjs", [
    "with (scope) { require.resolve = other }",
    "require.resolve?.('fixture-package')",
    "require('../lib/tool')",
    "",
  ].join("\n"))
  writeFixture(root, "scripts/with-resolve-delete.cjs", [
    "with (scope) { delete require.resolve }",
    "require.resolve?.('fixture-package')",
    "require('../lib/tool')",
    "",
  ].join("\n"))
  writeFixture(root, "scripts/with-resolve-alias.cjs", [
    "const loader = require",
    "with (scope) { loader.resolve = other }",
    "loader.resolve?.('fixture-package')",
    "loader('../lib/tool')",
    "",
  ].join("\n"))
  writeFixture(root, "scripts/with-resolve-lexical.cjs", [
    "const loader = require",
    "with (scope) { let loader; loader.resolve = other; let require; delete require.resolve }",
    "loader.resolve('fixture-package')",
    "require.resolve('fixture-package')",
    "",
  ].join("\n"))

  const first = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  const second = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(
    first.references.filter((row) => ["require", "require-resolve"].includes(row.kind))
      .map((row) => [row.fromPath, row.line, row.kind]),
    [
      ["scripts/with-resolve-alias.cjs", 4, "require"],
      ["scripts/with-resolve-delete.cjs", 3, "require"],
      ["scripts/with-resolve-direct.cjs", 3, "require"],
      ["scripts/with-resolve-lexical.cjs", 3, "require-resolve"],
      ["scripts/with-resolve-lexical.cjs", 4, "require-resolve"],
    ],
  )
  const unproven = first.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER")
  assert.deepEqual(unproven.map((row) => [row.path, row.line]), [
    ["scripts/with-resolve-alias.cjs", 3],
    ["scripts/with-resolve-delete.cjs", 2],
    ["scripts/with-resolve-direct.cjs", 2],
  ])
  assert.ok(unproven.every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
  assert.equal(first.errors.length, 0)
})

test("resolve mutation captures receiver provenance before evaluating its right side", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root, { dependencies: { "fixture-package": "1.0.0" } })
  writeFixture(root, "lib/tool.ts", "export const tool = true\n")
  writeFixture(root, "scripts/resolve-receiver-order.cjs", [
    "require.resolve('fixture-package');",
    "const saved = require",
    "require.resolve = (require = other)",
    "saved.resolve?.('fixture-package')",
    "saved('../lib/tool')",
    "",
  ].join("\n"))
  writeFixture(root, "scripts/resolve-alias-order.cjs", [
    "const saved = require",
    "let alias = require",
    "alias.resolve = (alias = other)",
    "saved.resolve?.('fixture-package')",
    "saved('../lib/tool')",
    "",
  ].join("\n"))

  const first = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  const second = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(
    first.references.filter((row) => ["require", "require-resolve"].includes(row.kind))
      .map((row) => [row.fromPath, row.line, row.kind]),
    [
      ["scripts/resolve-alias-order.cjs", 5, "require"],
      ["scripts/resolve-receiver-order.cjs", 1, "require-resolve"],
      ["scripts/resolve-receiver-order.cjs", 5, "require"],
    ],
  )
  const unproven = first.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER")
  assert.deepEqual(unproven.map((row) => [row.path, row.line]), [
    ["scripts/resolve-alias-order.cjs", 4],
    ["scripts/resolve-receiver-order.cjs", 4],
  ])
  assert.equal(JSON.stringify(unproven).includes("fixture-package"), false)
  assert.equal(first.errors.length, 0)
})

test("no-substitution template resolve targets downgrade method provenance only", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root, { dependencies: { "fixture-package": "1.0.0" } })
  writeFixture(root, "lib/tool.ts", "export const tool = true\n")
  writeFixture(root, "scripts/template-resolve.cjs", [
    "const loader = require",
    "loader[`resolve`] = other",
    "loader.resolve?.('fixture-package')",
    "loader('../lib/tool')",
    "",
  ].join("\n"))
  writeFixture(root, "scripts/template-resolve-direct.cjs", [
    "delete require[`resolve`]",
    "require.resolve?.('fixture-package')",
    "require('../lib/tool')",
    "",
  ].join("\n"))
  writeFixture(root, "scripts/template-resolve-dynamic.cjs", [
    "require[`res${suffix}`] = other",
    "require.resolve('fixture-package')",
    "",
  ].join("\n"))

  const first = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  const second = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(
    first.references.filter((row) => ["require", "require-resolve"].includes(row.kind))
      .map((row) => [row.fromPath, row.line, row.kind]),
    [
      ["scripts/template-resolve-direct.cjs", 3, "require"],
      ["scripts/template-resolve-dynamic.cjs", 2, "require-resolve"],
      ["scripts/template-resolve.cjs", 4, "require"],
    ],
  )
  const unproven = first.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER")
  assert.deepEqual(unproven.map((row) => [row.path, row.line]), [
    ["scripts/template-resolve-direct.cjs", 2],
    ["scripts/template-resolve.cjs", 3],
  ])
  assert.ok(unproven.every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
  assert.equal(first.errors.length, 0)
})

test("possible loader receivers conservatively downgrade shared resolve provenance", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root, { dependencies: { "fixture-package": "1.0.0" } })
  writeFixture(root, "lib/tool.ts", "export const tool = true\n")
  writeFixture(root, "scripts/possible-resolve-assignment.cjs", [
    "const saved = require",
    "require = require",
    "require.resolve = other",
    "saved.resolve?.('fixture-package')",
    "saved('../lib/tool')",
    "",
  ].join("\n"))
  writeFixture(root, "scripts/possible-resolve-delete.cjs", [
    "const saved = require",
    "require ||= other",
    "delete require.resolve",
    "saved.resolve('fixture-package')",
    "saved('../lib/tool')",
    "",
  ].join("\n"))
  writeFixture(root, "scripts/resolve-property-control.cjs", [
    "const saved = require",
    "require.cache = other",
    "saved.resolve('fixture-package')",
    "",
  ].join("\n"))
  writeFixture(root, "scripts/resolve-unknown-control.cjs", [
    "const saved = require",
    "const unknown = other",
    "unknown.resolve = other",
    "saved.resolve?.('fixture-package')",
    "",
  ].join("\n"))

  const first = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  const second = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(
    first.references.filter((row) => ["require", "require-resolve"].includes(row.kind))
      .map((row) => [row.fromPath, row.line, row.kind]),
    [
      ["scripts/possible-resolve-assignment.cjs", 5, "require"],
      ["scripts/possible-resolve-delete.cjs", 5, "require"],
      ["scripts/resolve-property-control.cjs", 3, "require-resolve"],
      ["scripts/resolve-unknown-control.cjs", 4, "require-resolve"],
    ],
  )
  const unproven = first.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER")
  assert.deepEqual(unproven.map((row) => [row.path, row.line]), [
    ["scripts/possible-resolve-assignment.cjs", 4],
    ["scripts/possible-resolve-delete.cjs", 4],
  ])
  assert.ok(unproven.every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
  assert.equal(JSON.stringify(unproven).includes("fixture-package"), false)
  assert.equal(first.errors.length, 0)
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
    "import { nested } from \"../lib/folder\"",
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

test("public audit CLIs record import-equals local, package, and type ownership", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root, { dependencies: { "fixture-package": "1.0.0" } })
  writeFixture(root, "lib/service.ts", "export default 'service'\n")
  writeFixture(root, "lib/model.d.ts", "export interface Model { id: string }\n")
  writeFixture(root, "lib/model/index.js", "export const model = true\n")
  writeFixture(root, "tests/import-equals.ts", [
    "import service = require('../lib/service')",
    "import packageService = require('fixture-package')",
    "import type Model = require('../lib/model')",
    "void service; void packageService",
    "export type ModelId = Model['id']",
    "",
  ].join("\n"))

  const deadResult = runAuditCli(deadCodeCliPath, root)
  assert.equal(deadResult.status, 0)
  assert.equal(deadResult.stderr, "")
  const deadReport = JSON.parse(deadResult.stdout)
  const referencedPaths = deadReport.findings
    .filter((row) => row.findingKind === "referencedModules")
    .map((row) => row.path)
  for (const path of ["lib/model.d.ts", "lib/model/index.js", "lib/service.ts"]) {
    assert.ok(referencedPaths.includes(path), `${path} should have incoming ownership`)
    assert.equal(deadReport.findings.some((row) => (
      row.findingKind === "unreferencedCandidates" && row.path === path
    )), false)
  }

  const dependencyResult = runAuditCli(dependencyCliPath, root)
  assert.equal(dependencyResult.status, 0)
  assert.equal(dependencyResult.stderr, "")
  const dependencyReport = JSON.parse(dependencyResult.stdout)
  assert.ok(dependencyReport.findings.some((row) => (
    row.findingKind === "literalImportOwners" && row.packageName === "fixture-package" &&
    row.kind === "import-equals" && row.ownerPath === "tests/import-equals.ts"
  )))
  assert.ok(dependencyReport.findings.some((row) => (
    row.findingKind === "referencedPackages" && row.name === "fixture-package"
  )))
  assert.equal(dependencyReport.findings.some((row) => (
    row.findingKind === "unreferencedCandidates" && row.name === "fixture-package"
  )), false)

  const evidence = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(
    evidence.references
      .filter((row) => row.kind === "import-equals")
      .map((row) => [row.targetKind, row.targetPath ?? row.dependency]),
    [
      ["tracked-module", "lib/service.ts"],
      ["package", "fixture-package"],
      ["tracked-module", "lib/model/index.js"],
    ],
  )
  assert.ok(evidence.references.some((row) => (
    row.kind === "declaration-companion" && row.sourceKind === "import-type" &&
    row.targetPath === "lib/model.d.ts"
  )))
})

test("import-equals ignores internal aliases and hashes nonliteral external references", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "tests/import-equals-boundaries.ts", [
    "import Internal = Runtime.Service",
    "import Dynamic = require(moduleName)",
    "void Internal; void Dynamic",
    "",
  ].join("\n"))

  const result = runAuditCli(deadCodeCliPath, root)
  assert.equal(result.status, 0)
  assert.equal(result.stderr, "")
  const report = JSON.parse(result.stdout)
  const uncertainties = report.uncertainties.filter((row) => (
    row.uncertaintyKind === "nonliteralImports" && row.kind === "import-equals"
  ))
  assert.equal(uncertainties.length, 1)
  assert.equal(uncertainties[0].code, "NONLITERAL_MODULE_EXPRESSION")
  assert.match(uncertainties[0].expressionSha256, /^[a-f0-9]{64}$/)
  assert.equal(report.findings.some((row) => row.findingKind === "literalImportOwners"), false)
  assert.equal(JSON.stringify(report).includes("Runtime.Service"), false)
  assert.equal(JSON.stringify(report).includes("moduleName"), false)

  const evidence = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.equal(evidence.references.some((row) => row.kind === "import-equals"), false)
  assert.equal(evidence.uncertainties.filter((row) => row.kind === "import-equals").length, 1)
  assert.equal(evidence.errors.length, 0)
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

  const realReport = buildDeadCodeCandidateReport(buildTrackedTextIndex(repositoryRoot, realPolicy), realPolicy)
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
    [
      ["app/runtime-user.ts", "import", "lib/runtime-model.d.ts"],
      ["app/type-user.ts", "import-type", "lib/model.d.ts"],
    ],
  )
  assert.equal(evidence.errors.length, 0)

  const report = buildDeadCodeCandidateReport(index, policy)
  assert.ok(report.referencedModules.some((row) => row.path === "lib/model.d.ts"))
  assert.ok(report.referencedModules.some((row) => row.path === "lib/runtime-model.d.ts"))
  assert.equal(report.unreferencedCandidates.some((row) => row.path === "lib/runtime-model.d.ts"), false)
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

test("module evidence applies NodeNext CJS and ESM substitution families without cross-family TypeScript edges", (t) => {
  const root = createFixtureRepository(t)
  const modulePolicy = {
    ...clonePolicy(),
    sourceExtensions: [...new Set([...policy.sourceExtensions, ".cts", ".mts"])].sort(),
    textExtensions: [...new Set([...policy.textExtensions, ".cts", ".mts"])].sort(),
  }
  writePackage(root)
  writeFixture(root, "lib/runtime-esm.mjs", "export const runtimeEsm = true\n")
  writeFixture(root, "lib/runtime-esm.d.mts", "export declare const runtimeEsm: true\n")
  writeFixture(root, "lib/runtime-cjs.cjs", "exports.runtimeCjs = true\n")
  writeFixture(root, "lib/runtime-cjs.d.cts", "export declare const runtimeCjs: true\n")
  writeFixture(root, "lib/source-esm.mts", "export const sourceEsm = true\n")
  writeFixture(root, "lib/source-cjs.cts", "export const sourceCjs = true\n")
  writeFixture(root, "lib/wrong-esm.ts", "export const wrongEsm = true\n")
  writeFixture(root, "lib/wrong-common.tsx", "export const wrongCommon = true\n")
  writeFixture(root, "app/node-next.ts", [
    "import type { runtimeEsm } from '../lib/runtime-esm.mjs'",
    "import type { runtimeCjs } from '../lib/runtime-cjs.cjs'",
    "import { sourceEsm } from '../lib/source-esm.mjs'",
    "import { sourceCjs } from '../lib/source-cjs.cjs'",
    "import { wrongEsm } from '../lib/wrong-esm.mjs'",
    "import { wrongCommon } from '../lib/wrong-common.cjs'",
    "void sourceEsm; void sourceCjs; void wrongEsm; void wrongCommon",
    "export type Runtime = typeof runtimeEsm | typeof runtimeCjs",
    "",
  ].join("\n"))

  const evidence = buildModuleEvidence(buildTrackedTextIndex(root, modulePolicy), modulePolicy)
  assert.deepEqual(
    evidence.references
      .filter((row) => row.kind === "import" && row.targetKind === "tracked-module")
      .map((row) => row.targetPath),
    [
      "lib/runtime-esm.mjs",
      "lib/runtime-cjs.cjs",
      "lib/source-esm.mts",
      "lib/source-cjs.cts",
    ],
  )
  assert.deepEqual(
    evidence.references
      .filter((row) => row.kind === "declaration-companion")
      .map((row) => [row.sourceKind, row.targetPath]),
    [
      ["import-type", "lib/runtime-esm.d.mts"],
      ["import-type", "lib/runtime-cjs.d.cts"],
    ],
  )
  assert.equal(evidence.references.some((row) => row.targetPath === "lib/wrong-esm.ts"), false)
  assert.equal(evidence.references.some((row) => row.targetPath === "lib/wrong-common.tsx"), false)
  assert.equal(evidence.errors.filter((row) => row.code === "UNRESOLVED_LITERAL_MODULE").length, 2)
})

test("module evidence preserves explicit runtime edges and records TypeScript source substitutions", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const pairs = [
    ["js-pair.js", "js-pair.ts"],
    ["jsx-pair.jsx", "jsx-pair.tsx"],
    ["esm-pair.mjs", "esm-pair.mts"],
    ["cjs-pair.cjs", "cjs-pair.cts"],
  ]
  for (const [runtimePath, sourcePath] of pairs) {
    writeFixture(root, `lib/${runtimePath}`, "export const value = true\n")
    writeFixture(root, `lib/${sourcePath}`, "export const value = true\n")
  }
  for (const runtimePath of ["runtime.js", "runtime.jsx", "runtime.mjs", "runtime.cjs"]) {
    writeFixture(root, `lib/${runtimePath}`, "export const value = true\n")
  }
  const specifiers = [
    "../lib/js-pair.js", "../lib/jsx-pair.jsx", "../lib/esm-pair.mjs", "../lib/cjs-pair.cjs",
    "../lib/runtime.js", "../lib/runtime.jsx", "../lib/runtime.mjs", "../lib/runtime.cjs",
  ]
  writeFixture(root, "app/page.tsx", `${specifiers.map((specifier, index) => (
    `import { value as value${index} } from '${specifier}'`
  )).join("\n")}\n${specifiers.map((_, index) => `void value${index}`).join("; ")}\n`)

  const index = buildTrackedTextIndex(root, policy)
  const first = buildModuleEvidence(index, policy)
  const second = buildModuleEvidence(index, policy)
  assert.deepEqual(first, second)
  assert.deepEqual(
    first.references.filter((row) => row.fromPath === "app/page.tsx")
      .map((row) => [row.line, row.kind, row.targetPath]),
    [
      [1, "import", "lib/js-pair.js"],
      [1, "typescript-substitution", "lib/js-pair.ts"],
      [2, "import", "lib/jsx-pair.jsx"],
      [2, "typescript-substitution", "lib/jsx-pair.tsx"],
      [3, "import", "lib/esm-pair.mjs"],
      [3, "typescript-substitution", "lib/esm-pair.mts"],
      [4, "import", "lib/cjs-pair.cjs"],
      [4, "typescript-substitution", "lib/cjs-pair.cts"],
      [5, "import", "lib/runtime.js"],
      [6, "import", "lib/runtime.jsx"],
      [7, "import", "lib/runtime.mjs"],
      [8, "import", "lib/runtime.cjs"],
    ],
  )
  const report = buildDeadCodeCandidateReport(index, policy)
  for (const [runtimePath, sourcePath] of pairs) {
    for (const path of [`lib/${runtimePath}`, `lib/${sourcePath}`]) {
      assert.ok(report.referencedModules.some((row) => row.path === path))
      assert.equal(report.unreferencedCandidates.some((row) => row.path === path), false)
    }
  }
  assert.equal(JSON.stringify(first).includes("../lib/js-pair.js"), false)
  assert.equal(first.errors.length, 0)
})

test("module evidence preserves extensionless runtime edges and records bundler TypeScript substitutions", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  for (const path of [
    "direct.js", "direct.ts",
    "exported.js", "exported.ts",
    "dynamic.js", "dynamic.ts",
    "required.js", "required.ts",
    "dotted.test.js", "dotted.test.ts",
  ]) writeFixture(root, `lib/${path}`, "export const value = true\n")
  writeFixture(root, "lib/indexed/index.js", "export const indexed = true\n")
  writeFixture(root, "lib/indexed/index.ts", "export const indexed = true\n")
  writeFixture(root, "lib/runtime-only.js", "export const runtimeOnly = true\n")
  writeFixture(root, "app/page.tsx", [
    "import { value as direct } from '../lib/direct'",
    "export { value as exported } from '../lib/exported'",
    "const dynamic = import('../lib/dynamic')",
    "import Required = require('../lib/required')",
    "import { indexed } from '../lib/indexed'",
    "import { runtimeOnly } from '../lib/runtime-only'",
    "import { value as dotted } from '../lib/dotted.test'",
    "void direct; void dynamic; void Required; void indexed; void runtimeOnly; void dotted",
    "",
  ].join("\n"))

  const index = buildTrackedTextIndex(root, policy)
  const first = buildModuleEvidence(index, policy)
  const second = buildModuleEvidence(index, policy)
  assert.deepEqual(first, second)
  assert.deepEqual(
    first.references.filter((row) => row.fromPath === "app/page.tsx")
      .map((row) => [row.line, row.kind, row.targetPath]),
    [
      [1, "import", "lib/direct.js"],
      [1, "typescript-substitution", "lib/direct.ts"],
      [2, "export-from", "lib/exported.js"],
      [2, "typescript-substitution", "lib/exported.ts"],
      [3, "dynamic-import", "lib/dynamic.js"],
      [3, "typescript-substitution", "lib/dynamic.ts"],
      [4, "import-equals", "lib/required.js"],
      [4, "typescript-substitution", "lib/required.ts"],
      [5, "import", "lib/indexed/index.js"],
      [5, "typescript-substitution", "lib/indexed/index.ts"],
      [6, "import", "lib/runtime-only.js"],
      [7, "import", "lib/dotted.test.js"],
      [7, "typescript-substitution", "lib/dotted.test.ts"],
    ],
  )
  const report = buildDeadCodeCandidateReport(index, policy)
  for (const path of [
    "lib/direct.ts", "lib/exported.ts", "lib/dynamic.ts", "lib/required.ts", "lib/indexed/index.ts", "lib/dotted.test.ts",
  ]) {
    assert.ok(report.referencedModules.some((row) => row.path === path))
    assert.equal(report.unreferencedCandidates.some((row) => row.path === path), false)
  }
  assert.equal(JSON.stringify(first).includes("../lib/direct"), false)
  assert.equal(first.errors.length, 0)
})

test("TypeScript substitutions honor declaration precedence type syntax and module families", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const files = [
    "precedence.js", "precedence.ts", "precedence.d.ts",
    "declared.js", "declared.d.ts",
    "precedence-jsx.jsx", "precedence-jsx.tsx", "precedence-jsx.d.ts",
    "declared-jsx.jsx", "declared-jsx.d.ts",
    "precedence-esm.mjs", "precedence-esm.mts", "precedence-esm.d.mts",
    "declared-esm.mjs", "declared-esm.d.mts",
    "precedence-cjs.cjs", "precedence-cjs.cts", "precedence-cjs.d.cts",
    "declared-cjs.cjs", "declared-cjs.d.cts",
    "wrong-esm.mjs", "wrong-esm.ts", "wrong-cjs.cjs", "wrong-cjs.tsx",
  ]
  for (const path of files) writeFixture(root, `lib/${path}`, "export interface Value { id: string }\n")
  const specifiers = [
    "../lib/precedence.js", "../lib/declared.js",
    "../lib/precedence-jsx.jsx", "../lib/declared-jsx.jsx",
    "../lib/precedence-esm.mjs", "../lib/declared-esm.mjs",
    "../lib/precedence-cjs.cjs", "../lib/declared-cjs.cjs",
  ]
  writeFixture(root, "app/type-user.ts", [
    ...specifiers.map((specifier, index) => `import type { Value as Value${index} } from '${specifier}'`),
    "import { Value as WrongEsm } from '../lib/wrong-esm.mjs'",
    "import { Value as WrongCjs } from '../lib/wrong-cjs.cjs'",
    `export type Values = ${specifiers.map((_, index) => `Value${index}`).join(" | ")} | WrongEsm | WrongCjs`,
    "",
  ].join("\n"))

  const index = buildTrackedTextIndex(root, policy)
  const first = buildModuleEvidence(index, policy)
  const second = buildModuleEvidence(index, policy)
  assert.deepEqual(first, second)
  assert.deepEqual(
    first.references.filter((row) => row.kind === "typescript-substitution")
      .map((row) => [row.sourceKind, row.targetPath]),
    [
      ["import-type", "lib/precedence.ts"],
      ["import-type", "lib/precedence-jsx.tsx"],
      ["import-type", "lib/precedence-esm.mts"],
      ["import-type", "lib/precedence-cjs.cts"],
    ],
  )
  assert.deepEqual(
    first.references.filter((row) => row.kind === "declaration-companion")
      .map((row) => [row.sourceKind, row.targetPath]),
    [
      ["import-type", "lib/declared.d.ts"],
      ["import-type", "lib/declared-jsx.d.ts"],
      ["import-type", "lib/declared-esm.d.mts"],
      ["import-type", "lib/declared-cjs.d.cts"],
    ],
  )
  const wrongFamilyPaths = ["lib/wrong-esm.ts", "lib/wrong-cjs.tsx"]
  assert.equal(first.references.some((row) => wrongFamilyPaths.includes(row.targetPath)), false)
  const report = buildDeadCodeCandidateReport(index, policy)
  for (const path of [
    "lib/precedence.ts", "lib/precedence-jsx.tsx", "lib/precedence-esm.mts", "lib/precedence-cjs.cts",
    "lib/declared.d.ts", "lib/declared-jsx.d.ts", "lib/declared-esm.d.mts", "lib/declared-cjs.d.cts",
  ]) {
    assert.ok(report.referencedModules.some((row) => row.path === path))
    assert.equal(report.unreferencedCandidates.some((row) => row.path === path), false)
  }
  for (const path of [
    "lib/precedence.d.ts", "lib/precedence-jsx.d.ts", "lib/precedence-esm.d.mts",
    "lib/precedence-cjs.d.cts", ...wrongFamilyPaths,
  ]) assert.ok(report.unreferencedCandidates.some((row) => row.path === path))
  assert.equal(JSON.stringify(first).includes("../lib/precedence.js"), false)
  assert.equal(first.errors.length, 0)
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

  const realReport = buildDependencyCandidateReport(buildTrackedTextIndex(repositoryRoot, realPolicy), realPolicy)
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

  const realReport = buildDependencyCandidateReport(buildTrackedTextIndex(repositoryRoot, realPolicy), realPolicy)
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

test("stylesheet policy explicitly owns text-only extensions and rejects invalid coverage", () => {
  assert.deepEqual(realPolicy.stylesheetExtensions, [".css"])
  for (const stylesheetExtensions of [[], [".css", ".css"], [".CSS"], [".scss"], [".ts"]]) {
    assert.throws(() => validateCleanupPolicy({ ...clonePolicy(), stylesheetExtensions }), /CLEANUP_POLICY_INVALID/)
  }
  const missing = clonePolicy()
  delete missing.stylesheetExtensions
  assert.throws(() => validateCleanupPolicy(missing), /CLEANUP_POLICY_INVALID/)
})

test("stylesheet usage remains metadata-only uncertainty regardless of imports or apparent ownership", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "public/icon.svg", "<svg/>\n")
  writeFixture(root, "app/page.tsx", "import './imported.css'; export default function Page() { return null }\n")
  writeFixture(root, "tests/style.test.mjs", "import { readFileSync } from 'node:fs'; readFileSync(new URL('../components/test-owned.css', import.meta.url), 'utf8')\n")
  const stylesheetScopes = [
    ["app/imported.css", "runtime"],
    ["app/orphan.css", "runtime"],
    ["components/orphan.css", "runtime"],
    ["components/test-owned.css", "runtime"],
    ["styles/orphan.css", "other"],
    ["tests/fixture.css", "test"],
  ]
  const css = ":root { --private-fixture-token: red; } .fixture:hover { background: url('/icon.svg'); }\n"
  for (const [path] of stylesheetScopes) writeFixture(root, path, css)
  writeFixture(root, "app/untracked.css", css, { tracked: false })
  writeFileSync(resolve(root, "app/imported.css"), "UNSTAGED_STYLESHEET_SENTINEL")
  const index = buildTrackedTextIndex(root, policy)
  const report = buildDeadCodeCandidateReport(index, policy)
  const expected = stylesheetScopes.map(([path, scope]) => {
    const { bytes, oid } = index.records.find((row) => row.path === path)
    assert.equal(bytes, Buffer.byteLength(css))
    return { path, scope, bytes, oid, reason: "stylesheet-selector-and-design-token-usage-unresolved" }
  })
  assert.deepEqual(report.uncertainties.stylesheetUsage ?? [], expected)
  assert.deepEqual(report, buildDeadCodeCandidateReport(index, policy))
  const envelope = buildAuditEnvelope("dead-code", index, candidateBody(report))
  assert.equal(envelope.deletionAuthority, false)
  assert.equal(envelope.findings.some((row) => row.path?.endsWith(".css")), false)
  assert.equal(envelope.uncertainties.filter((row) => row.path?.endsWith(".css")).length, stylesheetScopes.length)
  const modules = buildModuleEvidence(index, policy)
  assert.deepEqual(modules.errors, [])
  assert.equal(modules.modules.some((row) => row.path.endsWith(".css")), false)
  assert.ok(modules.references.some((row) => row.fromPath === "app/page.tsx" && row.targetPath === "app/imported.css"))
  const assets = buildAssetCandidateReport(index, policy)
  assert.ok(assets.referenceOwners.some((row) => row.fromPath === "app/imported.css" && row.targetPath === "public/icon.svg"))
  const dependencies = buildDependencyCandidateReport(index, policy)
  assert.equal(dependencies.uncertainties.nonliteralModuleExpressions.some((row) => row.path.endsWith(".css")), false)
  assertPrivateSerialization(envelope, root, ["UNSTAGED_STYLESHEET_SENTINEL", "private-fixture-token", css])
})

test("stylesheet coverage inventories all 22 tracked repository CSS files exactly once", () => {
  const index = buildTrackedTextIndex(repositoryRoot, realPolicy)
  const paths = index.trackedPaths.filter((path) => path.toLowerCase().endsWith(".css"))
  assert.equal(paths.length, 22)
  const report = buildDeadCodeCandidateReport(index, realPolicy)
  const rows = report.uncertainties.stylesheetUsage ?? []
  assert.deepEqual(rows.map((row) => row.path), paths)
  assert.equal(new Set(rows.map((row) => row.path)).size, paths.length)
  assert.ok(rows.some((row) => row.path === "app/globals.css"))
  assert.ok(rows.some((row) => row.path === "components/backgrounds/BackgroundHost.module.css"))
  for (const row of rows) {
    const record = index.records.find((entry) => entry.path === row.path)
    assert.equal(row.bytes, record.bytes)
    assert.equal(row.oid, record.oid)
    assert.equal(row.scope, record.scope)
    assert.deepEqual(Object.keys(row).sort(), ["bytes", "oid", "path", "reason", "scope"])
  }
})

test("policy-owned manual tools stay opaque across content audits and appear once as dead-code uncertainty", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root, { dependencies: { "opaque-package": "1.0.0" } })
  writeFixture(root, ".env.example", "OPAQUE_KEY=\n")
  writeFixture(root, "public/icon.svg", "<svg/>\n")
  writeFixture(root, "scripts/manual-adapter.py", [
    "# import opaque-package",
    "# process.env.OPAQUE_KEY",
    "# '../public/icon.svg'",
    "not valid TypeScript syntax: def main():",
    "",
  ].join("\n"))
  writeFixture(root, "scripts/unrelated.py", "def unrelated():\n    pass\n")
  const fixturePolicy = { ...clonePolicy(), manualToolSources: ["scripts/manual-adapter.py"] }
  const index = buildTrackedTextIndex(root, fixturePolicy)

  const deadCode = buildDeadCodeCandidateReport(index, fixturePolicy)
  assert.deepEqual(deadCode.uncertainties.manualScripts, [{
    path: "scripts/manual-adapter.py",
    reason: "opaque-manual-tool-source",
  }])
  assert.equal(deadCode.roots.some((row) => row.path.endsWith(".py")), false)
  assert.equal(deadCode.unreferencedCandidates.some((row) => row.path.endsWith(".py")), false)
  assert.equal(buildAssetCandidateReport(index, fixturePolicy).referenceOwners.some((row) => row.ownerPath.endsWith(".py")), false)
  const dependency = buildDependencyCandidateReport(index, fixturePolicy)
  assert.equal(dependency.literalImportOwners.some((row) => row.ownerPath.endsWith(".py")), false)
  assert.equal(dependency.uncertainties.nonliteralModuleExpressions.some((row) => row.path.endsWith(".py")), false)
  assert.equal(buildEnvironmentCandidateReport(index, fixturePolicy).staticReads.some((row) => row.path.endsWith(".py")), false)

  const missingPolicy = { ...clonePolicy(), manualToolSources: ["scripts/missing-adapter.py"] }
  assert.ok(buildModuleEvidence(index, missingPolicy).errors.some((row) => row.code === "MANUAL_TOOL_SOURCE_MISSING"))
  assert.throws(() => buildDeadCodeCandidateReport(index, missingPolicy), /DEAD_CODE_EVIDENCE_INVALID/)
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

test("asset owner-relative URLs select exact CSS and Markdown siblings through builders and CLI", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/panel/logo.png", "sibling")
  writeFixture(root, "public/elsewhere/logo.png", "duplicate-basename")
  const literal = "logo.png?private-owner-query=1#fragment"
  writeFixture(root, "app/panel/theme.css", [
    `a { background: url("${literal}") }`,
    `b { background: URL('${literal}') }`,
    `c { background: url(${literal}) }`,
    "",
  ].join("\n"))
  writeFixture(root, "app/panel/guide.md", [
    `![image](${literal})`,
    `[link](<${literal}>)`,
    "",
  ].join("\n"))
  const report = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(report.referenceOwners.map((row) => [row.fromPath, row.line, row.targetPath]), [
    ["app/panel/guide.md", 1, "app/panel/logo.png"],
    ["app/panel/guide.md", 2, "app/panel/logo.png"],
    ["app/panel/theme.css", 1, "app/panel/logo.png"],
    ["app/panel/theme.css", 2, "app/panel/logo.png"],
    ["app/panel/theme.css", 3, "app/panel/logo.png"],
  ])
  assert.equal(report.basenameOnlySignals.length, 0)
  assert.equal(report.unreferencedCandidates.length, 0)
  assertPrivateSerialization(report, root, [literal, "private-owner-query"])
  const first = runAuditCli(assetCliPath, root)
  // Both owner and target working-tree drift must remain outside the stage-0 report.
  writeFixture(root, "app/panel/theme.css", "a { background: url(drift.png) }", { tracked: false })
  writeFixture(root, "app/panel/logo.png", "unstaged-target-drift", { tracked: false })
  const second = runAuditCli(assetCliPath, root)
  assert.equal(first.status, 0)
  assert.equal(second.status, 0)
  assert.equal(first.stderr, "")
  assert.equal(second.stderr, "")
  assert.equal(first.stdout, second.stdout)
  const envelope = JSON.parse(first.stdout)
  assert.equal(envelope.deletionAuthority, false)
  assert.equal(envelope.findings.filter((row) => row.findingKind === "referenceOwners").length, 5)
  assertPrivateSerialization(first.stdout, root, [literal, "private-owner-query", "unstaged-target-drift", "drift.png"])
})

test("asset owner-relative URLs retain sanitized missing ignored and out-of-inventory evidence", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/panel/untracked.png", "untracked", { tracked: false })
  writeFixture(root, ".gitignore", "app/panel/ignored.png\n")
  writeFixture(root, "app/panel/ignored.png", "ignored", { tracked: false })
  writeFixture(root, "docs/outside.png", "tracked-outside-inventory")
  writeFixture(root, "app/panel/theme.css", [
    'a { background: url("missing.png?private-url=1") }',
    'b { background: url("untracked.png?private-url=2") }',
    'c { background: url("ignored.png?private-url=3") }',
    'd { background: url("../../../escape.png?private-url=4") }',
    'e { background: url("https://example.test/remote.png?private-url=5") }',
    'f { background: url("#fragment.png") }',
    "",
  ].join("\n"))
  writeFixture(root, "docs/guide.md", "![outside](outside.png?private-url=6)\n")
  const first = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  const second = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.equal(first.referenceOwners.length, 0)
  assert.equal(first.basenameOnlySignals.length, 0)
  assert.deepEqual(first.uncertainties.unresolvedLiteralAssets.map((row) => [row.fromPath, row.line, row.code]), [
    ["app/panel/theme.css", 1, "UNRESOLVED_LITERAL_ASSET"],
    ["app/panel/theme.css", 2, "UNRESOLVED_LITERAL_ASSET"],
    ["app/panel/theme.css", 3, "UNRESOLVED_LITERAL_ASSET"],
    ["app/panel/theme.css", 4, "UNRESOLVED_LITERAL_ASSET"],
    ["docs/guide.md", 1, "OUT_OF_INVENTORY_LITERAL_ASSET"],
  ])
  assert.ok(first.uncertainties.unresolvedLiteralAssets.every((row) => (
    row.targetPath === undefined && /^[a-f0-9]{64}$/.test(row.literalSha256)
  )))
  assertPrivateSerialization(first, root, ["private-url", "missing.png", "untracked.png", "ignored.png", "escape.png"])
})

test("asset owner-relative URLs do not promote arbitrary strings prose or code examples", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/panel/logo.png", "sibling")
  writeFixture(root, "public/elsewhere/logo.png", "duplicate")
  writeFixture(root, "app/panel/render.js", 'const name = "logo.png"\n')
  writeFixture(root, "app/panel/data.json", '{"name":"logo.png"}\n')
  writeFixture(root, "app/panel/theme.css", [
    'a { content: "logo.png" }',
    "b { content: 'url(logo.png)' }",
    "/* background: url(logo.png) */",
    "/* unclosed comment: url(logo.png)",
    "",
  ].join("\n"))
  writeFixture(root, "app/panel/guide.md", [
    'The filename is "logo.png".',
    '`![example](logo.png)`',
    '```md',
    '![example](logo.png)',
    '```',
    '![unclosed](logo.png',
    '<!-- unclosed comment: ![example](logo.png)',
    "",
  ].join("\n"))
  const report = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  assert.equal(report.referenceOwners.length, 0)
  assert.deepEqual(report.unreferencedCandidates.map((row) => row.path), ["app/panel/data.json", "app/panel/logo.png"])
  assert.ok(report.basenameOnlySignals.some((row) => row.fromPath === "app/panel/render.js"))
  assert.ok(report.basenameOnlySignals.some((row) => row.fromPath === "app/panel/data.json"))
  assert.ok(report.basenameOnlySignals.every((row) => row.candidateTargetPaths.length === 2))
})

test("asset owner-relative URLs keep slash-containing masked examples non-proven", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/panel/logo.png", "sibling")
  writeFixture(root, "app/panel/images/logo.png", "nested-sibling")
  const dot = "./logo.png?private-context-query=1#fragment"
  const nested = "images/logo.png?private-context-query=2#fragment"
  writeFixture(root, "app/panel/theme.css", [
    `a { content: "${dot}" }`,
    `b { content: 'url(${nested})' }`,
    `/* example: url("${nested}") */`,
    `c { background: url("${dot}") }`,
    "",
  ].join("\n"))
  writeFixture(root, "app/panel/guide.md", [
    `The example filename is "${dot}".`,
    `\`![example](${dot})\``,
    "```md",
    `![example](${nested})`,
    "```",
    `<!-- ![example](${nested}) -->`,
    `![actual](${nested})`,
    "",
  ].join("\n"))
  const first = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  const second = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.referenceOwners.map((row) => [row.fromPath, row.line, row.targetPath]), [
    ["app/panel/guide.md", 7, "app/panel/images/logo.png"],
    ["app/panel/theme.css", 4, "app/panel/logo.png"],
  ])
  assert.ok(first.uncertainties.unresolvedLiteralAssets.length >= 6)
  assert.ok(first.uncertainties.unresolvedLiteralAssets.every((row) => (
    row.targetPath === undefined && /^[a-f0-9]{64}$/.test(row.literalSha256)
  )))
  assertPrivateSerialization(first, root, [dot, nested, "private-context-query"])
})

test("asset URL contexts mask Markdown fences inside blockquote and list containers", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/panel/logo.png", "sibling")
  const destination = "./logo.png?private-container-query=1#fragment"
  const example = `![example](${destination})`
  const fixtures = [
    ["> ~~~md", `> ${example}`, "> ~~~", example],
    ["> ```md", `> ${example}`, "> ```", example],
    ["- ~~~md", `  ${example}`, "  ~~~", `  ${example}`],
    ["1. ```md", `   ${example}`, "   ```", example],
    ["> - ~~~md", `>   ${example}`, ">   ~~~", `>   ${example}`],
    ["- > ```md", `  > ${example}`, "  > ```", example],
    ["- item", "  ~~~md", `  ${example}`, "  ~~~", `  ${example}`],
    ["> ~~~md", `> ${example}`, example],
    ["- ~~~md", `  ${example}`, example],
    ["- ", "  ~~~md", `  ${example}`, example],
  ]
  for (const [index, lines] of fixtures.entries()) {
    writeFixture(root, `app/panel/container-${index}.md`, `${lines.join("\n")}\n`)
  }
  const report = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(report.referenceOwners.map((row) => [row.fromPath, row.line]), fixtures.map((lines, index) => (
    [`app/panel/container-${index}.md`, lines.length]
  )))
  assert.ok(report.referenceOwners.every((row) => row.targetPath === "app/panel/logo.png"))
  assertPrivateSerialization(report, root, [destination, "private-container-query"])
  const first = runAuditCli(assetCliPath, root)
  const second = runAuditCli(assetCliPath, root)
  assert.equal(first.status, 0)
  assert.equal(second.status, 0)
  assert.equal(first.stderr, "")
  assert.equal(second.stderr, "")
  assert.equal(first.stdout, second.stdout)
  assert.equal(JSON.parse(first.stdout).findings.filter((row) => row.findingKind === "referenceOwners").length, fixtures.length)
  assertPrivateSerialization(first.stdout, root, [destination, "private-container-query"])
})

test("asset URL contexts keep escaped CSS newline continuations inside quoted strings", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/panel/logo.png", "sibling")
  const destination = "./logo.png?private-continuation-query=1#fragment"
  for (const [index, newline] of ["\n", "\r\n", "\r", "\f"].entries()) {
    writeFixture(root, `app/panel/continued-${index}.css`, [
      `a { content: "prefix\\${newline}url(${destination})" }`,
      `b { content: 'prefix\\${newline}url(${destination})' }`,
      `c { background: url("${destination}") }`,
      "",
    ].join("\n"))
  }
  const report = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  assert.equal(report.referenceOwners.length, 4)
  assert.ok(report.referenceOwners.every((row) => row.targetPath === "app/panel/logo.png"))
  assertPrivateSerialization(report, root, [destination, "private-continuation-query"])
  const first = runAuditCli(assetCliPath, root)
  const second = runAuditCli(assetCliPath, root)
  assert.equal(first.status, 0)
  assert.equal(second.status, 0)
  assert.equal(first.stderr, "")
  assert.equal(second.stderr, "")
  assert.equal(first.stdout, second.stdout)
  assert.equal(JSON.parse(first.stdout).findings.filter((row) => row.findingKind === "referenceOwners").length, 4)
  assertPrivateSerialization(first.stdout, root, [destination, "private-continuation-query"])
})

test("asset URL contexts mask unterminated CSS quotes through EOF without hiding closed-string successors", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/panel/logo.png", "sibling")
  const destination = "logo.png?private-eof-query=1#fragment"
  for (const [index, quote] of ['"', "'"].entries()) {
    for (const [endingIndex, ending] of ["", "\n", "\\"].entries()) {
      writeFixture(root, `app/panel/unclosed-${index}-${endingIndex}.css`, `a { content: ${quote}prefix url(${destination})${ending}`)
    }
    writeFixture(root, `app/panel/closed-${index}.css`, [
      `a { content: ${quote}prefix\\\nurl(${destination})${quote} }`,
      `b { background: url(${destination}) }`,
      "",
    ].join("\n"))
  }
  const first = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  const second = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.referenceOwners.map((row) => [row.fromPath, row.line]), [
    ["app/panel/closed-0.css", 3],
    ["app/panel/closed-1.css", 3],
  ])
  assertPrivateSerialization(first, root, [destination, "private-eof-query"])
})

test("asset URL contexts treat excessive Markdown list padding as indented code", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/panel/logo.png", "sibling")
  const destination = "logo.png?private-padding-query=1#fragment"
  const fixtures = [
    ["-", 1], ["-", 4], ["-", 5], ["-", 6],
    ["1.", 1], ["1.", 4], ["1.", 5], ["10)", 5],
  ]
  for (const [index, [marker, padding]] of fixtures.entries()) {
    writeFixture(root, `app/panel/padding-${index}.md`, `${marker}${" ".repeat(padding)}![example](${destination})\n`)
  }
  const first = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  const second = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.referenceOwners.map((row) => row.fromPath), [
    "app/panel/padding-0.md", "app/panel/padding-1.md", "app/panel/padding-4.md", "app/panel/padding-5.md",
  ])
  assertPrivateSerialization(first, root, [destination, "private-padding-query"])
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

test("asset evidence resolves slashless HTML attributes only from live start tags", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  for (const path of [
    "quoted.png", "single.png", "plain.png", "upper.png", "control.png",
    "duplicate-first.png", "duplicate-second.png", "raw-control.png",
  ]) {
    writeFixture(root, `app/panel/${path}`, path)
  }
  const privateSuffix = "?private-html-owner=1#fragment"
  writeFixture(root, "app/panel/assets.html", [
    `<img src="quoted.png${privateSuffix}">`,
    `<a href='single.png${privateSuffix}'>link</a>`,
    `<video poster=plain.png${privateSuffix}></video>`,
    `<IMG SRC=upper.png${privateSuffix}>`,
    `<!-- <img src="control.png${privateSuffix}"> -->`,
    `<script>const example = '<img src="control.png${privateSuffix}">'</script>`,
    `<style>.example { content: '<img src=control.png${privateSuffix}>' }</style>`,
    `<textarea><img src=control.png${privateSuffix}></textarea>`,
    `<title><img src=control.png${privateSuffix}></title>`,
    `<xmp><img src=control.png${privateSuffix}></xmp>`,
    `<iframe><img src=control.png${privateSuffix}></iframe>`,
    `<noembed><img src=control.png${privateSuffix}></noembed>`,
    `<noframes><img src=control.png${privateSuffix}></noframes>`,
    `<!bogus <img src="control.png${privateSuffix}">>`,
    `<?bogus <img src=control.png${privateSuffix}>>`,
    `<img data-src="control.png${privateSuffix}" aria-href=control.png${privateSuffix} data-x=abc/src=control.png${privateSuffix} data-y="ignore src=control.png${privateSuffix}">`,
    `<img src="control.png${privateSuffix}">`,
    `<img SRC=duplicate-first.png${privateSuffix} src=duplicate-second.png${privateSuffix}>`,
    `<img src\u00a0=duplicate-second.png${privateSuffix}>`,
    `<plaintext><img src=control.png${privateSuffix}></plaintext><img src=control.png${privateSuffix}>`,
    "",
  ].join("\n"))
  writeFixture(root, "app/panel/raw.html", [
    `<script>const ignored = 'raw-control.png${privateSuffix}'</script\u00a0>`,
    `<img src=raw-control.png${privateSuffix}>`,
    "",
  ].join("\n"))
  writeFixture(root, "app/panel/quoted-tag.html", [
    `<div title="<script>">`,
    `<img src=raw-control.png${privateSuffix}>`,
    `</script>">`,
    `<div data-x=broken"value>`,
    `<img src=control.png${privateSuffix}>`,
    "",
  ].join("\n"))
  writeFixture(root, "app/panel/comments.html", [
    `<!bogus "fake>" <img src=control.png${privateSuffix}>`,
    `<!--><img src=control.png${privateSuffix}>`,
    `<!---><img src=control.png${privateSuffix}>`,
    `<!--ignored--!><img src=control.png${privateSuffix}>`,
    "",
  ].join("\n"))
  writeFixture(root, "app/panel/raw-closes.html", [
    `<script>ignored</script data-x=ignored><img src=control.png${privateSuffix}>`,
    `<style>ignored</style/><img poster=control.png${privateSuffix}>`,
    "",
  ].join("\n"))

  const first = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  const second = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.referenceOwners.map((row) => [row.line, row.targetPath]), [
    [1, "app/panel/quoted.png"],
    [2, "app/panel/single.png"],
    [3, "app/panel/plain.png"],
    [4, "app/panel/upper.png"],
    [17, "app/panel/control.png"],
    [18, "app/panel/duplicate-first.png"],
    [1, "app/panel/control.png"],
    [2, "app/panel/control.png"],
    [3, "app/panel/control.png"],
    [4, "app/panel/control.png"],
    [2, "app/panel/raw-control.png"],
    [5, "app/panel/control.png"],
    [1, "app/panel/control.png"],
    [2, "app/panel/control.png"],
  ])
  assert.ok(first.basenameOnlySignals.length >= 2)
  assert.ok(first.basenameOnlySignals.every((row) => (
    ["app/panel/assets.html", "app/panel/quoted-tag.html", "app/panel/raw.html", "app/panel/raw-closes.html"].includes(row.fromPath) &&
    /^[a-f0-9]{64}$/.test(row.literalSha256)
  )))
  assert.deepEqual(first.unreferencedCandidates.map((row) => row.path), [
    "app/panel/duplicate-second.png",
  ])
  assertPrivateSerialization(first, root, [privateSuffix, "private-html-owner"])

  const cliFirst = runAuditCli(assetCliPath, root)
  const cliSecond = runAuditCli(assetCliPath, root)
  assert.equal(cliFirst.status, 0)
  assert.equal(cliSecond.status, 0)
  assert.equal(cliFirst.stderr, "")
  assert.equal(cliSecond.stderr, "")
  assert.equal(cliFirst.stdout, cliSecond.stdout)
  const envelope = JSON.parse(cliFirst.stdout)
  assert.equal(envelope.deletionAuthority, false)
  assert.equal(envelope.findings.filter((row) => row.findingKind === "referenceOwners").length, 14)
  assertPrivateSerialization(cliFirst.stdout, root, [privateSuffix, "private-html-owner"])
})

test("asset evidence parses MTS and CTS literals and hashes dynamic expressions", (t) => {
  const root = createFixtureRepository(t)
  const modulePolicy = {
    ...clonePolicy(),
    sourceExtensions: [...new Set([...policy.sourceExtensions, ".cts", ".mts"])].sort(),
    textExtensions: [...new Set([...policy.textExtensions, ".cts", ".mts"])].sort(),
  }
  writePackage(root)
  writeFixture(root, "app/direct.png", "direct")
  writeFixture(root, "app/comment.png", "comment")
  for (const extension of ["mts", "cts"]) {
    writeFixture(root, `app/assets.${extension}`, [
      "// const ignored = './comment.png'",
      "const direct = './direct.png'",
      "const templated = `./${privateAssetName}.png`",
      "const concatenated = './' + privateAssetName + '.png'",
      "void direct; void templated; void concatenated",
      "",
    ].join("\n"))
  }

  const first = buildAssetCandidateReport(buildTrackedTextIndex(root, modulePolicy), modulePolicy)
  const second = buildAssetCandidateReport(buildTrackedTextIndex(root, modulePolicy), modulePolicy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.referenceOwners.map((row) => [row.fromPath, row.line, row.targetPath]), [
    ["app/assets.cts", 2, "app/direct.png"],
    ["app/assets.mts", 2, "app/direct.png"],
  ])
  assert.equal(first.referenceOwners.some((row) => row.targetPath === "app/comment.png"), false)
  assert.deepEqual(first.uncertainties.dynamicAssetExpressions.map((row) => [row.path, row.line, row.kind]), [
    ["app/assets.cts", 3, "template"],
    ["app/assets.cts", 4, "concatenation"],
    ["app/assets.mts", 3, "template"],
    ["app/assets.mts", 4, "concatenation"],
  ])
  assert.ok(first.uncertainties.dynamicAssetExpressions.every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
  assertPrivateSerialization(first, root, ["privateAssetName"])
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

  const realReport = buildAssetCandidateReport(buildTrackedTextIndex(repositoryRoot, realPolicy), realPolicy)
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
    return failure
  }

  for (const privatePath of [
    "config/credentials.production.json",
    "config/credentials.production.yaml",
    "config/credentials.toml",
    "config/credential.txt",
    "config/oauth/client_secret_123.apps.googleusercontent.com.json",
    "Config/OAuth/CLIENT_SECRET_Tenant-A.YAML",
    "config/oauth/client-secret.json",
    "Config/OAuth/.CLIENT_SECRET.YAML",
    "config/cloud/service-account-key",
    "Config/Cloud/SERVICE-ACCOUNT-KEY.toml",
    "config/cloud/service-account",
    "Config/Cloud/.SERVICE_ACCOUNT.toml",
    "config/credentials/token.ts",
    "config/.credentials/provider.json",
    "config/credential/token.ts",
    "config/.credential/provider.json",
    "config/secret/token.ts",
    "config/.secret/token.ts",
    "config/.secrets/token.txt",
    "config/secrets/token.txt",
  ]) {
    const root = createFixtureRepository(t)
    writePackage(root)
    const fixturePolicyPath = writeFixture(
      root,
      "scripts/repository-audit/cleanup-policy.json",
      `${JSON.stringify(policy, null, 2)}\n`,
    )
    const privateValue = "bootstrap-private-fixture-value"
    writeFixture(root, privatePath, `${privateValue}\n`)
    for (const action of [
      (observingExec) => loadCleanupContext(root, fixturePolicyPath, observingExec),
      (observingExec) => buildTrackedTextIndex(root, policy, observingExec),
    ]) {
      const failure = assertRejectedBeforeCatFile(action)
      assertPrivateSerialization(failure, root, [privatePath, privateValue])
    }
  }

  const allowedRoot = createFixtureRepository(t)
  writePackage(allowedRoot)
  writeFixture(allowedRoot, "config/secrets-manager/public.txt", "public fixture\n")
  writeFixture(allowedRoot, "config/credentials-guide.md", "public guidance\n")
  writeFixture(allowedRoot, "config/credentials-guide/token.ts", "export const publicFixture = true\n")
  writeFixture(allowedRoot, "config/.credentials-cache/provider.json", "{}\n")
  writeFixture(allowedRoot, "config/oauth/client_secretary.json", "{}\n")
  writeFixture(allowedRoot, "config/oauth/client_secret_.json", "{}\n")
  writeFixture(allowedRoot, "config/oauth/client-secret-guide.md", "public guidance\n")
  writeFixture(allowedRoot, "config/cloud/service-account-keyring.json", "{}\n")
  writeFixture(allowedRoot, "config/cloud/service-account-key-guide.md", "public guidance\n")
  writeFixture(allowedRoot, "config/cloud/service-account-manager.json", "{}\n")
  assert.doesNotThrow(() => buildTrackedTextIndex(allowedRoot, policy))
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

test("environment CommonJS loader provenance honors enum member scope", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/commonjs-enum.ts", [
    "const control = require('process'); void control.env.OUTER_CONTROL",
    "enum Earlier { require = 0, value = (() => { const proc = require('process'); return proc.env.ENUM_SHADOW })() }",
    "enum Later { value = (() => { const proc = require('process'); return proc.env.ENUM_LATER_SHADOW })(), require = 0 }",
    "enum Literal { 'require' = 0, value = (() => { const proc = require('process'); return proc.env.ENUM_LITERAL_SHADOW })() }",
    "enum Ordinary { value = (() => { const proc = require('process'); return proc.env.ENUM_CONTROL })() }",
    "enum Merged { require = 0 }",
    "enum Merged { value = (() => { const proc = require('process'); return proc.env.MERGED_ENUM_SHADOW })() }",
    "enum MergedLater { value = (() => { const proc = require('process'); return proc.env.MERGED_LATER_SHADOW })() }",
    "enum MergedLater { require = 0 }",
    "function localEnum() { enum Merged { value = (() => { const proc = require('process'); return proc.env.SEPARATE_ENUM_CONTROL })() } }",
    "",
  ].join("\n"))
  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.errors, [])
  assert.deepEqual(evidence.reads.map((row) => row.name), ["OUTER_CONTROL", "ENUM_CONTROL", "SEPARATE_ENUM_CONTROL"])
  assert.deepEqual(evidence.uncertainties, [])
})

for (const source of ["proven", "unknown"]) {
  for (const form of ["shorthand", "renamed"]) {
    test(`environment assignment defaults preserve conditional aliases from ${source} ${form} patterns`, (t) => {
      const root = createFixtureRepository(t)
      writePackage(root)
      writeFixture(root, ".env.example", "CONFIG=\nsettings=\nLATER=\nUNUSED=\n")
      const pattern = form === "shorthand" ? "settings = process.env" : "CONFIG: settings = process.env"
      writeFixture(root, "lib/conditional-default.ts", [
        source === "proven" ? "const source = process.env" : "let env; const source = env",
        "let settings",
        `({ ${pattern} } = source); void settings.LATER; consume(settings)`,
        "",
      ].join("\n"))
      const index = buildTrackedTextIndex(root, policy)
      const report = buildEnvironmentCandidateReport(index, policy)
      const key = form === "shorthand" ? "settings" : "CONFIG"
      assert.deepEqual(report.staticReads.map((row) => row.name), source === "proven" ? [key] : [])
      assert.ok(report.uncertainties.unprovenAliases.some((row) => row.name === "LATER"))
      assert.ok(report.uncertainties.computedReads.some((row) => row.kind === "assignment-default"))
      assert.deepEqual(report.unreadDeclarationCandidates, [])
      assert.equal(JSON.stringify(report), JSON.stringify(buildEnvironmentCandidateReport(index, policy)))
      assertPrivateSerialization(report, root, ["process.env", "consume(settings)"])
    })
  }
}

test("environment assignment defaults preserve unknown sources shadows and mutation boundaries", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/conditional-default-boundaries.ts", [
    "let env, settings, renamed",
    "({ settings = env, CONFIG: renamed = env } = value)",
    "void settings.UNKNOWN_FALLBACK; void renamed.RENAMED_UNKNOWN_FALLBACK",
    "settings = {}; void settings.AFTER_REASSIGNMENT",
    "renamed++; void renamed.AFTER_UPDATE",
    "function shadow(process) { let local; ({ CONFIG: local = process.env } = value); void local.SHADOWED }",
    "function lexical() { let local; ({ CONFIG: local = env } = value); const env = {}; void local.TDZ_SHADOWED }",
    "let loader; ({ CONFIG: loader = require('process') } = value); void loader.env.NOT_DIRECT_INITIALIZER",
    "let target = require('process'); ({ CONFIG: target = {} } = value); void target.env.INVALIDATED_PROCESS",
    "let literal; ({ CONFIG: literal = process.env.REAL_DEFAULT_READ } = value); void literal.NOT_ENV_OBJECT",
    "",
  ].join("\n"))
  const index = buildTrackedTextIndex(root, policy)
  const evidence = buildEnvironmentEvidence(index, policy)
  assert.deepEqual(evidence.errors, [])
  assert.deepEqual(evidence.reads.map((row) => row.name), ["REAL_DEFAULT_READ"])
  assert.deepEqual(evidence.uncertainties.filter((row) => row.name).map((row) => row.name), [
    "UNKNOWN_FALLBACK", "RENAMED_UNKNOWN_FALLBACK", "AFTER_REASSIGNMENT", "AFTER_UPDATE",
  ])
  assert.equal(evidence.uncertainties.filter((row) => row.kind === "assignment-default" && row.name == null).length, 2)
  assert.equal(JSON.stringify(evidence), JSON.stringify(buildEnvironmentEvidence(index, policy)))
  assertPrivateSerialization(evidence, root, ["require('process')"])
})

for (const [operator, uncertaintyKind] of [
  ["&&=", "logical-and-assignment"],
  ["||=", "logical-or-assignment"],
  ["??=", "logical-nullish-assignment"],
]) {
  test(`environment ${operator} assignments preserve conditional environment provenance`, (t) => {
    const root = createFixtureRepository(t)
    writePackage(root)
    writeFixture(root, ".env.example", [
      "EXACT", "DIRECT", "UNKNOWN", "PRIOR_PROVEN", "PRIOR_UNKNOWN", "DEFAULT_CONTROL", "DEFAULT_ALIAS", "UNUSED",
    ].map((name) => `${name}=\n`).join(""))
    writeFixture(root, "lib/logical-assignment.ts", [
      "let extracted, direct = {}, env, maybe = {}, priorProven = process.env, priorUnknown = env, defaulted",
      "({ EXACT: extracted } = process.env)",
      `direct ${operator} (process.env satisfies NodeJS.ProcessEnv); void direct.DIRECT`,
      `maybe ${operator} env; void maybe.UNKNOWN`,
      `priorProven ${operator} {}; void priorProven.PRIOR_PROVEN`,
      `priorUnknown ${operator} {}; void priorUnknown.PRIOR_UNKNOWN`,
      "({ DEFAULT_CONTROL: defaulted = process.env } = process.env); void defaulted.DEFAULT_ALIAS",
      "",
    ].join("\n"))
    const index = buildTrackedTextIndex(root, policy)
    const report = buildEnvironmentCandidateReport(index, policy)
    assert.deepEqual(report.staticReads.map((row) => row.name), ["DEFAULT_CONTROL", "EXACT"])
    assert.deepEqual(report.uncertainties.unprovenAliases.filter((row) => row.name).map((row) => row.name), [
      "DEFAULT_ALIAS", "DIRECT", "PRIOR_PROVEN", "PRIOR_UNKNOWN", "UNKNOWN",
    ])
    assert.equal(report.uncertainties.computedReads.filter((row) => row.kind === uncertaintyKind).length, 1)
    assert.equal(report.uncertainties.unprovenAliases.filter((row) => row.kind === uncertaintyKind && row.name == null).length, 1)
    assert.ok([...report.uncertainties.computedReads, ...report.uncertainties.unprovenAliases]
      .filter((row) => row.kind === uncertaintyKind)
      .every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
    assert.equal(report.uncertainties.computedReads.filter((row) => row.kind === "assignment-default").length, 1)
    assert.deepEqual(report.unreadDeclarationCandidates, [])
    assert.equal(JSON.stringify(report), JSON.stringify(buildEnvironmentCandidateReport(index, policy)))
    assertPrivateSerialization(report, root, ["NodeJS.ProcessEnv", "process.env satisfies", `${operator} env`])
  })
}

test("environment logical assignments retain member escapes and respect later invalidation and shadows", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/logical-assignment-boundaries.ts", [
    "let env, reassigned = {}, updated = {}, holder = {}, switched = process.env",
    "reassigned ||= process.env; reassigned = {}; void reassigned.AFTER_REASSIGNMENT",
    "updated &&= process.env; updated++; void updated.AFTER_UPDATE",
    "holder.settings ||= process.env",
    "holder.other ??= env",
    "holder[env = process.env] ||= env",
    "holder[switched = {}] &&= switched",
    "function shadow(process) { let local = {}; local ||= process.env; void local.SHADOWED_PROCESS }",
    "function lexical() { let local = {}; local ??= env; const env = {}; void local.TDZ_SHADOWED }",
    "",
  ].join("\n"))
  const index = buildTrackedTextIndex(root, policy)
  const evidence = buildEnvironmentEvidence(index, policy)
  assert.deepEqual(evidence.errors, [])
  assert.deepEqual(evidence.reads, [])
  assert.deepEqual(evidence.uncertainties.map((row) => [row.code, row.name ?? null, row.kind, row.line]), [
    ["COMPUTED_ENVIRONMENT_READ", null, "logical-or-assignment", 2],
    ["UNPROVEN_ENVIRONMENT_ALIAS", "AFTER_REASSIGNMENT", "property-access", 2],
    ["COMPUTED_ENVIRONMENT_READ", null, "logical-and-assignment", 3],
    ["UNPROVEN_ENVIRONMENT_ALIAS", "AFTER_UPDATE", "property-access", 3],
    ["COMPUTED_ENVIRONMENT_READ", null, "logical-or-assignment", 4],
    ["UNPROVEN_ENVIRONMENT_ALIAS", null, "logical-nullish-assignment", 5],
    ["COMPUTED_ENVIRONMENT_READ", null, "logical-or-assignment", 6],
    ["UNPROVEN_ENVIRONMENT_ALIAS", null, "logical-and-assignment", 7],
  ])
  assert.ok(evidence.uncertainties.filter((row) => row.kind.startsWith("logical-"))
    .every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
  assert.equal(JSON.stringify(evidence), JSON.stringify(buildEnvironmentEvidence(index, policy)))
  assertPrivateSerialization(evidence, root, ["process.env", "holder.settings", "holder.other"])
})

test("environment assignment patterns record only exact source-object keys", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const names = ["DIRECT", "RENAMED", "LITERAL", "CONFIG", "NESTED_DEFAULT", "DEFAULTED", "FALLBACK"]
  writeFixture(root, ".env.example", [...names, "UNUSED", "NOT_ENV_KEY"].map((name) => `${name}=\n`).join(""))
  writeFixture(root, "lib/assignment-keys.ts", [
    "let DIRECT, local, nested, NESTED_DEFAULT, DEFAULTED",
    "({ DIRECT, RENAMED: local, ['LITERAL']: local } = process.env)",
    "({ CONFIG: { NOT_ENV_KEY: nested } } = process.env)",
    "({ config: { NESTED_DEFAULT } = process.env } = value)",
    "({ DEFAULTED = process.env.FALLBACK } = (process.env satisfies NodeJS.ProcessEnv))",
    "",
  ].join("\n"))
  const index = buildTrackedTextIndex(root, policy)
  const report = buildEnvironmentCandidateReport(index, policy)
  assert.deepEqual(report.staticReads.map((row) => row.name).sort(), names.sort())
  assert.deepEqual(report.unreadDeclarationCandidates.map((row) => row.name), ["NOT_ENV_KEY", "UNUSED"])
  assert.deepEqual(report.uncertainties, { computedReads: [], unprovenAliases: [] })
  assert.deepEqual(buildEnvironmentEvidence(index, policy).errors, [])
  assert.equal(JSON.stringify(report), JSON.stringify(buildEnvironmentCandidateReport(index, policy)))
})

test("environment assignment patterns retain dynamic rest and unproven uncertainty", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, ".env.example", "MAYBE=\nUNUSED=\n")
  writeFixture(root, "lib/assignment-uncertainty.ts", [
    "let local, rest, env",
    "({ [privateKey]: local, ...rest } = process.env)",
    "({ MAYBE: local, [privateOtherKey]: local, ...rest } = env)",
    "",
  ].join("\n"))
  const index = buildTrackedTextIndex(root, policy)
  const report = buildEnvironmentCandidateReport(index, policy)
  assert.deepEqual(report.staticReads, [])
  assert.deepEqual(report.unreadDeclarationCandidates, [])
  assert.equal(report.uncertainties.computedReads.length, 2)
  assert.deepEqual(report.uncertainties.unprovenAliases.map((row) => row.name).sort(), [null, null, "MAYBE"].sort())
  assert.ok([...report.uncertainties.computedReads, ...report.uncertainties.unprovenAliases]
    .every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
  assert.equal(JSON.stringify(report), JSON.stringify(buildEnvironmentCandidateReport(index, policy)))
  assertPrivateSerialization(report, root, ["privateKey", "privateOtherKey"])
})

test("environment assignment patterns preserve evaluated reads source snapshots and invalidation", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/assignment-order.ts", [
    "let environment = process.env, local",
    "({ FIRST: environment, SECOND: local } = environment); void environment.AFTER_ASSIGNMENT",
    "({ [process.env.SELECTOR]: local = process.env.FALLBACK } = process.env)",
    "let proc = require('process'); ({ PROC: proc } = process.env); void proc.env.INVALIDATED",
    "function shadow(process) { let LOCAL; ({ LOCAL } = process.env) }",
    "function aliasShadow() { let local; ({ HIDDEN: local } = environment); const environment = {} }",
    "",
  ].join("\n"))
  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.errors, [])
  assert.deepEqual(evidence.reads.map((row) => row.name), ["FIRST", "SECOND", "SELECTOR", "FALLBACK", "PROC"])
  assert.deepEqual(evidence.uncertainties.map((row) => [row.code, row.name ?? null]), [
    ["UNPROVEN_ENVIRONMENT_ALIAS", "AFTER_ASSIGNMENT"], ["COMPUTED_ENVIRONMENT_READ", null],
  ])
})

test("environment satisfies wrappers preserve exact alias and CommonJS reads", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const names = ["ALIASED_KEY", "DIRECT_KEY", "NESTED_KEY", "NODE_KEY", "PORTABLE_KEY"]
  writeFixture(root, ".env.example", names.map((name) => `${name}=\n`).join(""))
  writeFixture(root, "lib/satisfies-reads.ts", [
    "const settings = process.env satisfies NodeJS.ProcessEnv; void settings.ALIASED_KEY",
    "void (process.env satisfies NodeJS.ProcessEnv).DIRECT_KEY",
    "const nested = ((<any>(process.env satisfies NodeJS.ProcessEnv))! as any); void nested.NESTED_KEY",
    "const portable = require('process') satisfies typeof process; void portable.env.PORTABLE_KEY",
    "const nodeProcess = ((require('node:process') as any)! satisfies typeof process); void nodeProcess.env.NODE_KEY",
    "",
  ].join("\n"))
  const index = buildTrackedTextIndex(root, policy)
  const report = buildEnvironmentCandidateReport(index, policy)
  assert.deepEqual(report.staticReads.map((row) => row.name).sort(), names)
  assert.deepEqual(report.unreadDeclarationCandidates, [])
  assert.deepEqual(report.uncertainties.computedReads, [])
  assert.deepEqual(report.uncertainties.unprovenAliases, [])
  assert.deepEqual(buildEnvironmentEvidence(index, policy).errors, [])
  assert.equal(JSON.stringify(report), JSON.stringify(buildEnvironmentCandidateReport(index, policy)))
  assertPrivateSerialization(report, root, ["NodeJS.ProcessEnv", "require('process')"])
})

test("environment satisfies wrappers preserve whole-object escape uncertainty without duplicates", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/satisfies-escapes.ts", [
    "consume(process.env satisfies NodeJS.ProcessEnv)",
    "const forwarded = (enabled ? process.env : {}) satisfies NodeJS.ProcessEnv",
    "consume((process.env || {}) satisfies NodeJS.ProcessEnv)",
    "Object.keys(process.env satisfies NodeJS.ProcessEnv)",
    "const spread = { ...(process.env satisfies NodeJS.ProcessEnv) }",
    "void (process.env satisfies NodeJS.ProcessEnv)[privateComputedKey]",
    "",
  ].join("\n"))
  const index = buildTrackedTextIndex(root, policy)
  const evidence = buildEnvironmentEvidence(index, policy)
  assert.deepEqual(evidence.errors, [])
  assert.deepEqual(evidence.reads, [])
  assert.equal(evidence.uncertainties.length, 6)
  assert.deepEqual(evidence.uncertainties.map((row) => row.line), [1, 2, 3, 4, 5, 6])
  assert.ok(evidence.uncertainties.every((row) => row.code === "COMPUTED_ENVIRONMENT_READ"))
  const report = buildEnvironmentCandidateReport(index, policy)
  assert.equal(JSON.stringify(report), JSON.stringify(buildEnvironmentCandidateReport(index, policy)))
  assertPrivateSerialization(report, root, ["privateComputedKey", "NodeJS.ProcessEnv"])
})

test("environment satisfies wrappers retain shadow and mutation boundaries", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/satisfies-boundaries.ts", [
    "let settings = process.env satisfies NodeJS.ProcessEnv; void settings.BEFORE_CONTROL",
    "settings = {}; void settings.AFTER_ASSIGNMENT",
    "let proc = require('process') satisfies typeof process; void proc.env.PROCESS_CONTROL",
    "proc++; void proc.env.AFTER_UPDATE",
    "let overwritten = require('node:process') satisfies typeof process; overwritten = {}; void overwritten.env.AFTER_OVERWRITE",
    "function local(process) { const settings = process.env satisfies any; return settings.SHADOWED_PROCESS }",
    "function loader(require) { const proc = require('process') satisfies any; return proc.env.SHADOWED_LOADER }",
    "function lexical() { const proc = require('process') satisfies any; void proc.env.TDZ_LOADER; const require = fake }",
    "let stable = process.env satisfies any; function inner() { void stable.TDZ_ALIAS; const stable = {} }",
    "void (stable.WRITE_ONLY = 'fixture'); delete stable.DELETE_ONLY; stable.UPDATED_PROPERTY++",
    "void stable.AFTER_CONTROL",
    "",
  ].join("\n"))
  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.errors, [])
  assert.deepEqual(evidence.reads.map((row) => row.name), [
    "BEFORE_CONTROL", "PROCESS_CONTROL", "UPDATED_PROPERTY", "AFTER_CONTROL",
  ])
  assert.deepEqual(evidence.uncertainties.map((row) => [row.code, row.name]), [
    ["UNPROVEN_ENVIRONMENT_ALIAS", "AFTER_ASSIGNMENT"],
  ])
})

test("environment CommonJS direct variable initializers allow transparent wrappers", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/commonjs-wrapped-initializers.ts", [
    "const paren = (require('process')); void paren.env.PAREN_CONTROL",
    "const cast = require('node:process') as unknown; void cast.env.CAST_CONTROL",
    "const assertion = <any>require('process'); void assertion.env.ASSERTION_CONTROL",
    "const nonnull = require('process')!; void nonnull.env.NONNULL_CONTROL",
    "const nested = ((require('process') as any)!); void nested.env.NESTED_CONTROL",
    "function shadow(require) { const proc = ((require('process'))!); return proc.env.WRAPPED_LOADER_SHADOW }",
    "function defaults(proc = (require('process'))) { return proc.env.PARAMETER_NOT_OWNED }",
    "let assigned; assigned = (require('process')); void assigned.env.ASSIGNMENT_NOT_OWNED",
    "const { proc = (require('process')) } = value; void proc.env.DESTRUCTURED_DEFAULT_NOT_OWNED",
    "",
  ].join("\n"))
  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.errors, [])
  assert.deepEqual(evidence.reads.map((row) => row.name), [
    "PAREN_CONTROL", "CAST_CONTROL", "ASSERTION_CONTROL", "NONNULL_CONTROL", "NESTED_CONTROL",
  ])
  assert.deepEqual(evidence.uncertainties, [])
})

for (const [kind, mutations] of Object.entries({
  destructuring: [
    ["({ value: TARGET } = source)", []],
    ["[TARGET] = source", []],
    ["({ TARGET } = source)", []],
    ["[...TARGET] = source", []],
    ["({ [process.env.COMPUTED_KEY]: TARGET = process.env.DEFAULT_VALUE } = source)", ["COMPUTED_KEY", "DEFAULT_VALUE"]],
    ["[TARGET] = [process.env.RIGHT_HAND_READ]", ["RIGHT_HAND_READ"]],
  ],
  wrapped: [["(TARGET) = source", []], ["(TARGET as any) = source", []], ["TARGET! = source", []]],
  update: [["TARGET++", []], ["++TARGET", []], ["TARGET--", []], ["--TARGET", []]],
})) {
  test(`environment CommonJS provenance is invalidated by ${kind} targets`, (t) => {
    const root = createFixtureRepository(t)
    writePackage(root)
    for (const target of ["require", "proc"]) {
      for (const [index, [mutation, preservedReads]] of mutations.entries()) {
        writeFixture(root, `lib/${target}-${index}.ts`, [
          "let proc = require('process'); void proc.env.BEFORE_CONTROL;",
          mutation.replaceAll("TARGET", target),
          "void proc.env.PROCESS_AFTER",
          "const next = require('node:process'); void next.env.LOADER_AFTER",
          "",
        ].join("\n"))
        const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
        const rows = evidence.reads.filter((row) => row.path === `lib/${target}-${index}.ts`)
        assert.deepEqual(evidence.errors, [])
        assert.deepEqual(rows.map((row) => row.name).sort(), [
          "BEFORE_CONTROL", target === "require" ? "PROCESS_AFTER" : "LOADER_AFTER", ...preservedReads,
        ].sort(), `${target}: ${mutation}`)
      }
    }
  })
}

for (const [kind, targets] of Object.entries({ identifier: ["TARGET"], destructuring: ["[TARGET]", "{ value: TARGET }"] })) {
  test(`environment CommonJS provenance is invalidated by ${kind} iteration assignments`, (t) => {
    const root = createFixtureRepository(t)
    writePackage(root)
    let index = 0
    for (const target of ["require", "proc"]) {
      for (const pattern of targets) {
        for (const operator of ["in", "of"]) {
          const path = `lib/iteration-${index++}.ts`
          writeFixture(root, path, [
            "let proc = require('process'); void proc.env.BEFORE_CONTROL;",
            `for (${pattern.replaceAll("TARGET", target)} ${operator} [proc.env.ITERABLE_READ]) {`,
            "  void proc.env.PROCESS_IN_BODY; const next = require('node:process'); void next.env.LOADER_IN_BODY",
            "}",
            "void proc.env.PROCESS_AFTER; const after = require('process'); void after.env.LOADER_AFTER",
            "",
          ].join("\n"))
          const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
          assert.deepEqual(evidence.errors, [])
          assert.deepEqual(evidence.reads.filter((row) => row.path === path).map((row) => row.name).sort(), [
            "BEFORE_CONTROL", "ITERABLE_READ",
            ...(target === "require" ? ["PROCESS_IN_BODY", "PROCESS_AFTER"] : ["LOADER_IN_BODY", "LOADER_AFTER"]),
          ].sort(), `${target}: ${pattern} ${operator}`)
        }
      }
    }
  })
}

test("environment iteration declarations read iterables before var rebinding but retain lexical TDZ", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  for (const operator of ["in", "of"]) {
    writeFixture(root, `lib/var-iteration-${operator}.ts`, [
      "var proc = require('process');",
      `for (var proc ${operator} [proc.env.ITERABLE_REAL]) { void proc.env.REBOUND_BODY }`,
      "void proc.env.REBOUND_AFTER",
      "",
    ].join("\n"))
    for (const declaration of ["let", "const"]) {
      writeFixture(root, `lib/${declaration}-iteration-${operator}.ts`, [
        "const proc = require('process');",
        `for (${declaration} proc ${operator} [proc.env.LEXICAL_TDZ]) { void proc.env.LEXICAL_BODY }`,
        "void proc.env.OUTER_AFTER",
        "",
      ].join("\n"))
    }
  }
  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.errors, [])
  assert.deepEqual(evidence.reads.map((row) => row.name).sort(), [
    "ITERABLE_REAL", "ITERABLE_REAL", "OUTER_AFTER", "OUTER_AFTER", "OUTER_AFTER", "OUTER_AFTER",
  ])
  assert.deepEqual(evidence.uncertainties, [])
})

test("environment classic loops visit the first body before incrementor mutations", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/classic-loop-order.ts", [
    "let proc = require('process');",
    "for (; proc.env.CONDITION_REAL; proc = {}) { void proc.env.FIRST_BODY_REAL }",
    "void proc.env.AFTER_INCREMENTOR",
    "function loader() { for (let n = 0; n < 1; require = fake) { const p = require('process'); void p.env.BODY_LOADER_REAL } }",
    "let other = require('process');",
    "for (let n = 0; n < 1; void other.env.NOT_REAL_AFTER_BODY) { other = {} }",
    "",
  ].join("\n"))
  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.errors, [])
  assert.deepEqual(evidence.reads.map((row) => row.name), ["CONDITION_REAL", "FIRST_BODY_REAL", "BODY_LOADER_REAL"])
  assert.deepEqual(evidence.uncertainties, [])
})

test("environment CommonJS loader shadows include sloppy CJS Annex-B block functions", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/annex-b-loader.cjs", [
    "function shadowed() { { function require() {} } const proc = require('process'); void proc.env.SLOPPY_BLOCK_SHADOW }",
    "function before() { const proc = require('process'); void proc.env.SLOPPY_HOIST_SHADOW; if (condition) { function require() {} } }",
    "function nested() { { { function require() {} } } const proc = require('process'); void proc.env.NESTED_BLOCK_SHADOW }",
    "function escaped() { 'use\\x20strict'; { function require() {} } const proc = require('process'); void proc.env.ESCAPED_DIRECTIVE_SHADOW }",
    "function late() { perform(); 'use strict'; { function require() {} } const proc = require('process'); void proc.env.LATE_DIRECTIVE_SHADOW }",
    "function unrelated() { { function ordinary() {} } const proc = require('process'); void proc.env.UNRELATED_CONTROL }",
    "function outer() { function inner() { { function require() {} } } const proc = require('process'); void proc.env.OUTER_CONTROL }",
    "",
  ].join("\n"))
  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.errors, [])
  assert.deepEqual(evidence.reads.map((row) => row.name), ["UNRELATED_CONTROL", "OUTER_CONTROL"])
  assert.deepEqual(evidence.uncertainties, [])
})

test("environment CommonJS loader block functions stay lexical in strict scopes", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/strict-source.cjs", [
    "'use strict';",
    "function explicit() { { function require() {} } const proc = require('process'); void proc.env.SOURCE_STRICT_CONTROL }",
    "",
  ].join("\n"))
  writeFixture(root, "lib/strict-function.cjs", [
    "function explicit() { 'use strict'; { function require() {} } const proc = require('process'); void proc.env.FUNCTION_STRICT_CONTROL }",
    "function inherited() { 'use strict'; return function inner() { { function require() {} } const proc = require('process'); return proc.env.INHERITED_STRICT_CONTROL } }",
    "class StrictClass { method() { { function require() {} } const proc = require('process'); return proc.env.CLASS_STRICT_CONTROL } }",
    "function block() { 'use strict'; { const proc = require('process'); void proc.env.STRICT_BLOCK_SHADOW; function require() {} } }",
    "",
  ].join("\n"))
  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.errors, [])
  assert.deepEqual(evidence.reads.map((row) => row.name).sort(), [
    "CLASS_STRICT_CONTROL", "FUNCTION_STRICT_CONTROL", "INHERITED_STRICT_CONTROL", "SOURCE_STRICT_CONTROL",
  ])
  assert.deepEqual(evidence.uncertainties, [])
})

test("environment sloppy CJS block functions invalidate proven bindings when executed", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/annex-b-execution.cjs", [
    "function executed() { var proc = require('process'); void proc.env.BEFORE_CONTROL; { function proc() {} } void proc.env.AFTER_BLOCK_FUNCTION }",
    "function strict() { 'use strict'; var proc = require('process'); { function proc() {} } void proc.env.STRICT_AFTER_CONTROL }",
    "function ordinary() { var proc = require('process'); function proc() {} void proc.env.ORDINARY_DECLARATION_CONTROL }",
    "function simpleCatch() { var proc = require('process'); try { throw 0 } catch (proc) { { function proc() {} } } void proc.env.SIMPLE_CATCH_INVALIDATED }",
    "class StrictClass { method() { var proc = require('process'); { function proc() {} } void proc.env.CLASS_AFTER_CONTROL } }",
    "",
  ].join("\n"))
  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.errors, [])
  assert.deepEqual(evidence.reads.map((row) => row.name), ["BEFORE_CONTROL", "STRICT_AFTER_CONTROL", "ORDINARY_DECLARATION_CONTROL", "CLASS_AFTER_CONTROL"])
  assert.deepEqual(evidence.uncertainties, [])
})

test("environment Annex-B hoisting respects intervening lexical declaration barriers", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/annex-b-barriers.cjs", [
    "function letBarrier() { { let require; { function require() {} } } const proc = require('process'); void proc.env.LET_BARRIER_CONTROL }",
    "function constBarrier() { { const require = fake; { function require() {} } } const proc = require('process'); void proc.env.CONST_BARRIER_CONTROL }",
    "function classBarrier() { { class require {} { function require() {} } } const proc = require('process'); void proc.env.CLASS_BARRIER_CONTROL }",
    "function patternBarrier() { { let { require } = object; { function require() {} } } const proc = require('process'); void proc.env.PATTERN_BARRIER_CONTROL }",
    "function loopBarrier() { for (let require of loaders) { { function require() {} } } const proc = require('process'); void proc.env.LOOP_BARRIER_CONTROL }",
    "function catchBarrier() { try { throw {} } catch ({ require }) { { function require() {} } } const proc = require('process'); void proc.env.CATCH_BARRIER_CONTROL }",
    "function asyncLexical() { { async function require() {} } const proc = require('process'); void proc.env.ASYNC_LEXICAL_CONTROL }",
    "function generatorLexical() { { function* require() {} } const proc = require('process'); void proc.env.GENERATOR_LEXICAL_CONTROL }",
    "function noBarrier() { { function require() {} } const proc = require('process'); void proc.env.NO_BARRIER_SHADOW }",
    "",
  ].join("\n"))
  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.errors, [])
  assert.deepEqual(evidence.reads.map((row) => row.name), [
    "LET_BARRIER_CONTROL", "CONST_BARRIER_CONTROL", "CLASS_BARRIER_CONTROL", "PATTERN_BARRIER_CONTROL", "LOOP_BARRIER_CONTROL", "CATCH_BARRIER_CONTROL", "ASYNC_LEXICAL_CONTROL", "GENERATOR_LEXICAL_CONTROL",
  ])
  assert.deepEqual(evidence.uncertainties, [])
})

test("environment CJS wrapper loader survives assignment-free source var redeclarations", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/wrapper-var.cjs", [
    "const before = require('process'); void before.env.BEFORE_VAR_CONTROL;",
    "var require;",
    "const after = require('process'); void after.env.AFTER_VAR_CONTROL;",
    "function writer() { require = fake; const proc = require('process'); void proc.env.NESTED_WRITE_SHADOW }",
    "const outer = require('process'); void outer.env.OUTER_WRAPPER_CONTROL;",
    "require = fake; const changed = require('process'); void changed.env.AFTER_WRITE_SHADOW;",
    "function nested() { const proc = require('process'); void proc.env.NESTED_VAR_SHADOW; var require }",
    "",
  ].join("\n"))
  writeFixture(root, "lib/wrapper-var-strict.cjs", "'use strict'; var require; const proc = require('process'); void proc.env.STRICT_VAR_CONTROL\n")
  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.errors, [])
  assert.deepEqual(evidence.reads.map((row) => row.name).sort(), ["AFTER_VAR_CONTROL", "BEFORE_VAR_CONTROL", "OUTER_WRAPPER_CONTROL", "STRICT_VAR_CONTROL"])
  assert.deepEqual(evidence.uncertainties, [])
})

test("environment CJS wrapper loader remains proven until an Annex-B source assignment executes", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/wrapper-block.cjs", [
    "const before = require('process'); void before.env.BEFORE_BLOCK_CONTROL;",
    "{ function require() {} }",
    "const after = require('process'); void after.env.AFTER_BLOCK_SHADOW;",
    "",
  ].join("\n"))
  writeFixture(root, "lib/wrapper-direct.cjs", [
    "const before = require('process'); void before.env.DIRECT_FUNCTION_SHADOW;",
    "function require() {}",
    "function nested() { const proc = require('process'); void proc.env.NESTED_DIRECT_SHADOW; function require() {} }",
    "",
  ].join("\n"))
  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.errors, [])
  assert.deepEqual(evidence.reads.map((row) => row.name), ["BEFORE_BLOCK_CONTROL"])
  assert.deepEqual(evidence.uncertainties, [])
})

test("environment process import-equals records exact runtime aliases at declaration order", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, ".env.example", "NODE_KEY=\nPORTABLE_KEY=\nALIASED_KEY=\n")
  writeFixture(root, "lib/process-import-equals.ts", [
    "void process.env.BEFORE_DECLARATION; import process = require('node:process')",
    "import portable = require('process')",
    "void process.env.NODE_KEY; void portable.env['PORTABLE_KEY']",
    "const environment = portable.env; void environment.ALIASED_KEY",
    "import env = require('node:process'); void env.env.NAMED_ENV",
    "consume(portable); void process.env[privateComputedKey]; consume(portable.env)",
    "void (process.env.WRITE_ONLY = 'fixture'); delete portable.env.DELETE_ONLY",
    "portable.env.UPDATED_PROPERTY++; void portable.env.AFTER_PROPERTY_UPDATE",
    "function loaderShadow(require, process) { return portable.env.IMPORTED_ALIAS_CONTROL }",
    "",
  ].join("\n"))
  const index = buildTrackedTextIndex(root, policy)
  const report = buildEnvironmentCandidateReport(index, policy)
  assert.deepEqual(report.staticReads.map((row) => row.name).sort(), [
    "AFTER_PROPERTY_UPDATE", "ALIASED_KEY", "IMPORTED_ALIAS_CONTROL", "NAMED_ENV", "NODE_KEY",
    "PORTABLE_KEY", "UPDATED_PROPERTY",
  ])
  assert.deepEqual(report.unreadDeclarationCandidates, [])
  assert.equal(report.uncertainties.computedReads.length, 2)
  assert.deepEqual(report.uncertainties.unprovenAliases, [])
  assert.equal(JSON.stringify(report), JSON.stringify(buildEnvironmentCandidateReport(index, policy)))
  assertPrivateSerialization(report, root, ["privateComputedKey", "require('node:process')"])
})

test("environment process import-equals preserves shadows exclusions and invalidation", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/process-import-equals-boundaries.ts", [
    "import proc = require('process'); void proc.env.CONTROL",
    "namespace Inner { void proc.env.BEFORE; import proc = require('node:process'); void proc.env.UNSUPPORTED_NAMESPACE }",
    "namespace Other { void proc.env.BEFORE_OTHER; import proc = require('./other'); void proc.env.OTHER }",
    "namespace Internal { void proc.env.BEFORE_INTERNAL; import proc = Runtime.process; void proc.env.INTERNAL }",
    "namespace Types { void proc.env.BEFORE_TYPE; import type proc = require('process'); void proc.env.TYPE_ONLY }",
    "function parameter(proc) { return proc.env.PARAMETER }",
    "function lexical() { void proc.env.TDZ; const proc = {}; void proc.env.LOCAL }",
    "function hoisted() { void proc.env.HOISTED; var proc }",
    "function declared() { void proc.env.FUNCTION; function proc() {} }",
    "try {} catch (proc) { void proc.env.CATCH }",
    "for (const proc of objects) { void proc.env.LOOP }",
    "class Container { static { void proc.env.STATIC; var proc } }",
    "import assigned = require('process'); assigned = {}; void assigned.env.ASSIGNED",
    "import updated = require('process'); updated++; void updated.env.UPDATED",
    "import destructured = require('process'); ({ destructured } = other); void destructured.env.DESTRUCTURED",
    "import wrapped = require('process'); (wrapped as any) = {}; void wrapped.env.WRAPPED",
    "import unrelated = require('./other'); void unrelated.env.UNRELATED_EXTERNAL",
    "import type typed = require('process'); void typed.env.TYPE_ONLY_EXTERNAL",
    "namespace ProcessShadow { void process.env.BEFORE_LOCAL; import process = Runtime.process; void process.env.LOCAL_PROCESS }",
    "void proc.env.AFTER_CONTROL",
    "",
  ].join("\n"))
  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.errors, [])
  assert.deepEqual(evidence.reads.map((row) => row.name), ["CONTROL", "AFTER_CONTROL"])
  assert.deepEqual(evidence.uncertainties, [])
})

test("environment CommonJS process bindings record exact reads without false unread candidates", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, ".env.example", "NODE_KEY=\nPORTABLE_KEY=\nALIASED_KEY=\n")
  writeFixture(root, "lib/commonjs-process.cjs", [
    "const process = require('node:process')",
    "const nodeProcess = require('process')",
    "void process.env.NODE_KEY; void nodeProcess.env['PORTABLE_KEY']",
    "const environment = nodeProcess.env; void environment.ALIASED_KEY",
    "const env = require('node:process'); void env.env.PROCESS_NAMED_ENV",
    "const arbitrary = require('node:process'); consume(arbitrary)",
    "void process.env[privateComputedKey]; consume(nodeProcess.env)",
    "void (process.env.WRITE_ONLY = 'fixture'); delete nodeProcess.env.DELETE_ONLY",
    "process.env.UPDATED_PROPERTY++; void process.env.AFTER_PROPERTY_UPDATE",
    "",
  ].join("\n"))
  const index = buildTrackedTextIndex(root, policy)
  const report = buildEnvironmentCandidateReport(index, policy)
  assert.deepEqual(report.staticReads.map((row) => row.name).sort(), [
    "AFTER_PROPERTY_UPDATE", "ALIASED_KEY", "NODE_KEY", "PORTABLE_KEY", "PROCESS_NAMED_ENV", "UPDATED_PROPERTY",
  ])
  assert.deepEqual(report.unreadDeclarationCandidates, [])
  assert.equal(report.uncertainties.computedReads.length, 2)
  assert.deepEqual(report.uncertainties.unprovenAliases, [])
  assert.equal(JSON.stringify(report), JSON.stringify(buildEnvironmentCandidateReport(index, policy)))
  assertPrivateSerialization(report, root, ["privateComputedKey", "require('node:process')"])
})

test("environment CommonJS process recognition excludes shadowed and nonliteral loaders", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const call = "const proc = require('node:process'); void proc.env.SHADOWED"
  writeFixture(root, "lib/commonjs-loader-shadows.ts", [
    "const control = require('node:process'); void control.env.CONTROL",
    `function parameter(require) { ${call} }`,
    `function destructured({ require }) { ${call} }`,
    `function named() { const fn = function require() { ${call} }; void fn }`,
    `function lexical() { ${call}; const require = fake }`,
    `function hoisted() { ${call}; var require }`,
    `function declared() { ${call}; function require() {} }`,
    `function klass() { ${call}; class require {} }`,
    `try {} catch (require) { ${call} }`,
    `for (let require of loaders) { ${call} }`,
    `for (let proc = require('node:process'), require = fake; false;) { void proc.env.SHADOWED }`,
    `switch (mode) { case 0: ${call}; break; default: const require = fake }`,
    `namespace Scope { ${call}; var require }`,
    `class Container { static { ${call}; var require } }`,
    `const Named = class require { static { ${call} } }`,
    `namespace Imported { ${call}; import require = Runtime.loader }`,
    "const other = require('node:process/promises'); void other.env.UNRELATED",
    "const dynamic = require(moduleName); void dynamic.env.DYNAMIC",
    "const member = loader.require('node:process'); void member.env.MEMBER",
    "const extra = require('node:process', extraArgument); void extra.env.EXTRA",
    "const optional = require?.('node:process'); void optional.env.OPTIONAL",
    "",
  ].join("\n"))
  for (const [index, statement] of [
    "import require from './loader'", "import * as require from './loader'",
    "import { loader as require } from './loader'", "import type require from './loader'",
  ].entries()) {
    writeFixture(root, `lib/loader-import-${index}.ts`, `${call}; ${statement}\n`)
  }
  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.errors, [])
  assert.deepEqual(evidence.reads.map((row) => row.name), ["CONTROL"])
  assert.deepEqual(evidence.uncertainties, [])
})

test("environment CommonJS process bindings retain lexical initialization and reassignment boundaries", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/commonjs-binding-boundaries.cjs", [
    "const proc = require('node:process'); void proc.env.OUTER",
    "function parameter(proc) { return proc.env.SHADOWED }",
    "function lexical() { void proc.env.BEFORE; const proc = require('process'); void proc.env.AFTER }",
    "function hoisted() { void proc.env.BEFORE; var proc = require('process'); var proc; void proc.env.VAR_AFTER }",
    "function defaults(proc = require('node:process')) { return proc.env.PARAMETER_DEFAULT_NOT_OWNED }",
    "function bodyDefault(value = (() => { const p = require('process'); return p.env.DEFAULT_CONTROL })()) { var require; return value }",
    "try {} catch (proc) { void proc.env.CATCH_SHADOW }",
    "for (const proc of objects) { void proc.env.LOOP_SHADOW }",
    "class Container { static { void proc.env.STATIC_SHADOW; var proc } }",
    "let mutable = require('process'); mutable = {}; void mutable.env.AFTER_REASSIGNMENT",
    "let compound = require('process'); compound += other; void compound.env.AFTER_COMPOUND_ASSIGNMENT",
    "function compoundLoader() { require ||= fake; const process = require('process'); return process.env.COMPOUND_LOADER }",
    "function changedLoader() { require = fake; const process = require('process'); return process.env.CHANGED_LOADER }",
    "function changedLoaderBlock() { { require = fake }; const process = require('process'); return process.env.CHANGED_LOADER_BLOCK }",
    "",
  ].join("\n"))
  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.errors, [])
  assert.deepEqual(evidence.reads.map((row) => row.name), ["OUTER", "AFTER", "VAR_AFTER", "DEFAULT_CONTROL"])
  assert.deepEqual(evidence.uncertainties, [])
})

test("environment process object recognition honors lexical shadows and exact Node imports", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/environment-process-scope.js", [
    "import nodeProcess from 'node:process'",
    "import * as portableProcess from 'process'",
    "const globalRead = process.env.GLOBAL_PROCESS",
    "const defaultRead = nodeProcess.env.DEFAULT_PROCESS",
    "const namespaceRead = portableProcess.env.NAMESPACE_PROCESS",
    "consume(nodeProcess); consume(portableProcess)",
    "function parameterShadow(process) { return process.env.PARAMETER_SHADOW }",
    "function localShadow() { const process = {}; return process.env.LOCAL_SHADOW }",
    "function lexicalTdzShadow() { const value = process.env.LEXICAL_TDZ_SHADOW; const process = {}; return value }",
    "function letTdzShadow() { const value = process.env.LET_TDZ_SHADOW; let process; return value }",
    "function varHoistShadow() { const value = process.env.VAR_HOIST_SHADOW; var process; return value }",
    "function functionHoistShadow() { const value = process.env.FUNCTION_HOIST_SHADOW; function process() {}; return value }",
    "function classTdzShadow() { const value = process.env.CLASS_TDZ_SHADOW; class process {}; return value }",
    "try { throw new Error('fixture') } catch (process) { process.env.CATCH_SHADOW }",
    "void globalRead; void defaultRead; void namespaceRead",
    "void parameterShadow; void localShadow; void lexicalTdzShadow; void letTdzShadow; void varHoistShadow",
    "void functionHoistShadow; void classTdzShadow",
    "",
  ].join("\n"))
  writeFixture(root, "lib/unrelated-process-import.js", [
    "import process from './fake-process.js'",
    "const value = process.env.UNRELATED_IMPORT_SHADOW",
    "void value",
    "",
  ].join("\n"))
  writeFixture(root, "lib/type-process-import.ts", [
    "import type process from 'node:process'",
    "const value = process.env.TYPE_ONLY_IMPORT_SHADOW",
    "void value",
    "",
  ].join("\n"))

  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.reads.map((row) => row.name), [
    "GLOBAL_PROCESS",
    "DEFAULT_PROCESS",
    "NAMESPACE_PROCESS",
  ])
  assert.equal(evidence.uncertainties.length, 0)
  assert.equal(evidence.errors.length, 0)
})

test("environment process objects distinguish method names from function bindings and body scope", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/environment-process-functions.js", [
    "import nodeProcess from 'node:process'",
    "const object = { nodeProcess() { return nodeProcess.env.METHOD_PROPERTY_GLOBAL } }",
    "class Reader { get nodeProcess() { return nodeProcess.env.ACCESSOR_PROPERTY_GLOBAL } }",
    "const namedExpression = function nodeProcess(value = nodeProcess.env.NAMED_EXPRESSION_SHADOW) { return nodeProcess.env.NAMED_EXPRESSION_BODY_SHADOW }",
    "function wrapper() { function nodeProcess(value = nodeProcess.env.NAMED_DECLARATION_SHADOW) { return nodeProcess.env.NAMED_DECLARATION_BODY_SHADOW }; return nodeProcess }",
    "function bodyVar(value = process.env.PARAMETER_DEFAULT_BEFORE_VAR) { var process; return process.env.BODY_VAR_SHADOW ?? value }",
    "function bodyFunction(value = process.env.PARAMETER_DEFAULT_BEFORE_FUNCTION) { function process() {}; return process.env.BODY_FUNCTION_SHADOW ?? value }",
    "void object; void Reader; void namedExpression; void wrapper; void bodyVar; void bodyFunction",
    "",
  ].join("\n"))

  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.reads.map((row) => row.name), [
    "METHOD_PROPERTY_GLOBAL",
    "ACCESSOR_PROPERTY_GLOBAL",
    "PARAMETER_DEFAULT_BEFORE_VAR",
    "PARAMETER_DEFAULT_BEFORE_FUNCTION",
  ])
  assert.equal(evidence.uncertainties.length, 0)
  assert.equal(evidence.errors.length, 0)
})

test("environment process object aliases honor later shadows and whole loop declarations", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/environment-process-aliases.js", [
    "import nodeProcess from 'node:process'",
    "import { default as namedProcess } from 'process'",
    "const importedControl = nodeProcess.env.IMPORTED_CONTROL",
    "const namedDefaultControl = namedProcess.env.NAMED_DEFAULT_CONTROL",
    "function constShadow() { const value = nodeProcess.env.CONST_ALIAS_SHADOW; const nodeProcess = {}; return value }",
    "function letShadow() { const value = nodeProcess.env.LET_ALIAS_SHADOW; let nodeProcess; return value }",
    "function varShadow() { const value = nodeProcess.env.VAR_ALIAS_SHADOW; var nodeProcess; return value }",
    "function functionShadow() { const value = nodeProcess.env.FUNCTION_ALIAS_SHADOW; function nodeProcess() {}; return value }",
    "function classShadow() { const value = nodeProcess.env.CLASS_ALIAS_SHADOW; class nodeProcess {}; return value }",
    "for (let value = nodeProcess.env.LOOP_DECLARATION_SHADOW, nodeProcess = {}; false; ) { void value; void nodeProcess }",
    "const afterLoopControl = nodeProcess.env.AFTER_LOOP_CONTROL",
    "void importedControl; void namedDefaultControl; void afterLoopControl",
    "void constShadow; void letShadow; void varShadow; void functionShadow; void classShadow",
    "",
  ].join("\n"))
  writeFixture(root, "lib/environment-process-named-default.js", [
    "import { default as process } from 'node:process'",
    "const namedDefaultLocalProcess = process.env.NAMED_DEFAULT_LOCAL_PROCESS",
    "consume(process)",
    "void namedDefaultLocalProcess",
    "",
  ].join("\n"))
  writeFixture(root, "lib/environment-process-named-default-type.ts", [
    "import type { default as process } from 'node:process'",
    "const value = process.env.TYPE_NAMED_DEFAULT_SHADOW",
    "void value",
    "",
  ].join("\n"))
  writeFixture(root, "lib/environment-process-named-default-unrelated.js", [
    "import { default as process } from './fake-process.js'",
    "const value = process.env.UNRELATED_NAMED_DEFAULT_SHADOW",
    "void value",
    "",
  ].join("\n"))

  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.reads.map((row) => row.name), [
    "IMPORTED_CONTROL",
    "NAMED_DEFAULT_CONTROL",
    "AFTER_LOOP_CONTROL",
    "NAMED_DEFAULT_LOCAL_PROCESS",
  ])
  assert.equal(evidence.uncertainties.length, 0)
  assert.equal(evidence.errors.length, 0)
})

test("environment namespace import-equals declarations shadow outer process objects", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/environment-process-namespace.ts", [
    "import nodeProcess from 'node:process'",
    "namespace Controls {",
    "  export const global = process.env.NAMESPACE_GLOBAL_CONTROL",
    "  export const imported = nodeProcess.env.NAMESPACE_OUTER_ALIAS_CONTROL",
    "}",
    "namespace Shadow {",
    "  const before = nodeProcess.env.NAMESPACE_IMPORT_EQUALS_BEFORE_SHADOW",
    "  import nodeProcess = Runtime.nodeProcess",
    "  const after = nodeProcess.env.NAMESPACE_IMPORT_EQUALS_AFTER_SHADOW",
    "  void before; void after; void nodeProcess",
    "}",
    "const outer = nodeProcess.env.OUTER_ALIAS_CONTROL",
    "void outer; void Controls; void Shadow",
    "",
  ].join("\n"))

  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.reads.map((row) => row.name), [
    "NAMESPACE_GLOBAL_CONTROL",
    "NAMESPACE_OUTER_ALIAS_CONTROL",
    "OUTER_ALIAS_CONTROL",
  ])
  assert.equal(evidence.uncertainties.length, 0)
  assert.equal(evidence.errors.length, 0)
})

test("environment alias predeclaration hides inherited proven and unknown aliases", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/environment-alias-predeclaration.js", [
    "import { env } from 'node:process'",
    "const environment = getEnvironment()",
    "const provenControl = env.PROVEN_CONTROL",
    "const unknownControl = environment.UNKNOWN_CONTROL",
    "function letShadow() { const value = env.LET_SHADOW; let env; return value }",
    "function constShadow() { const value = environment.CONST_SHADOW; const environment = {}; return value }",
    "function varShadow() { const value = env.VAR_SHADOW; var env; return value }",
    "function functionShadow() { const value = environment.FUNCTION_SHADOW; function environment() {}; return value }",
    "function classShadow() { const value = env.CLASS_SHADOW; class env {}; return value }",
    "void provenControl; void unknownControl; void letShadow; void constShadow",
    "void varShadow; void functionShadow; void classShadow",
    "",
  ].join("\n"))

  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.reads.map((row) => row.name), ["PROVEN_CONTROL"])
  assert.deepEqual(
    evidence.uncertainties.map((row) => [row.code, row.name, row.kind]),
    [["UNPROVEN_ENVIRONMENT_ALIAS", "UNKNOWN_CONTROL", "property-access"]],
  )
  assert.equal(evidence.errors.length, 0)
})

test("environment-shaped runtime imports from other modules remain uncertain", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const computedExpression = "getImportedName()"
  writeFixture(root, "lib/non-node-environment-imports.js", [
    "import environment from './external-environment.js'",
    "import { settings as env, env as config } from './external-settings.js'",
    "const named = env.NAMED_UNKNOWN",
    "const defaulted = environment.DEFAULT_UNKNOWN",
    "const bracket = env['BRACKET_UNKNOWN']",
    `const computed = environment[${computedExpression}]`,
    "const unrelated = config.UNRELATED_LOCAL_NAME",
    "void named; void defaulted; void bracket; void computed; void unrelated",
    "",
  ].join("\n"))
  writeFixture(root, "lib/non-node-environment-namespace.js", [
    "import * as env from './external-namespace.js'",
    "const namespace = env.NAMESPACE_UNKNOWN",
    "void namespace",
    "",
  ].join("\n"))
  writeFixture(root, "lib/non-node-environment-type.ts", [
    "import type { Settings as env } from './external-types.js'",
    "const typeOnly = env.TYPE_ONLY_SHADOW",
    "void typeOnly",
    "",
  ].join("\n"))

  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(
    evidence.uncertainties.map((row) => [row.code, row.name, row.kind]),
    [
      ["UNPROVEN_ENVIRONMENT_ALIAS", "NAMED_UNKNOWN", "property-access"],
      ["UNPROVEN_ENVIRONMENT_ALIAS", "DEFAULT_UNKNOWN", "property-access"],
      ["UNPROVEN_ENVIRONMENT_ALIAS", "BRACKET_UNKNOWN", "element-access"],
      ["UNPROVEN_ENVIRONMENT_ALIAS", null, "element-access"],
      ["UNPROVEN_ENVIRONMENT_ALIAS", "NAMESPACE_UNKNOWN", "property-access"],
    ],
  )
  assert.equal(evidence.reads.length, 0)
  assert.equal(evidence.errors.length, 0)
  assertPrivateSerialization(evidence, root, [computedExpression])
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
  const index = buildTrackedTextIndex(repositoryRoot, realPolicy)
  const evidence = buildModuleEvidence(index, realPolicy)
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
  const adapterPath = "scripts/atmoshaper-ripx-demucs-adapter.py"
  assert.equal(evidence.modules.some((row) => row.path === adapterPath), false)
  assert.ok(evidence.uncertainties.some((row) => row.path === adapterPath && row.code === "OPAQUE_MANUAL_TOOL_SOURCE"))
  const deadCodeReport = buildDeadCodeCandidateReport(index, realPolicy)
  assert.equal(deadCodeReport.unreferencedCandidates.some((row) => row.path === adapterPath), false)
  assert.deepEqual(deadCodeReport.uncertainties.manualScripts.filter((row) => row.path === adapterPath), [{
    path: adapterPath,
    reason: "opaque-manual-tool-source",
  }])
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
  const index = buildTrackedTextIndex(repositoryRoot, realPolicy)
  const evidence = buildEnvironmentEvidence(index, realPolicy)
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
  const report = buildEnvironmentCandidateReport(index, realPolicy)
  assert.equal(report.unreadDeclarationCandidates.some((row) => row.name === "STRIPE_SECRET_KEY"), false)
})

test("real asset evidence inventories and protects every tracked Browser-QA PNG snapshot", () => {
  const index = buildTrackedTextIndex(repositoryRoot, realPolicy)
  const report = buildAssetCandidateReport(index, realPolicy)
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
  assert.ok(realPolicy.assetRoots.includes("data/"))
  assert.ok(realPolicy.protectedPathPrefixes.includes("data/"))
  const index = buildTrackedTextIndex(repositoryRoot, realPolicy)
  const dataPaths = index.trackedPaths.filter((path) => path.startsWith("data/") && path.endsWith(".json"))
  assert.equal(dataPaths.length, 40)
  const report = buildAssetCandidateReport(index, realPolicy)
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
  assert.deepEqual(JSON.parse(readFileSync(policyPath, "utf8")), realPolicy)
})

test("package exposes the exact cleanup audit commands", () => {
  const packageJson = JSON.parse(readFileSync(resolve(repositoryRoot, "package.json"), "utf8"))
  assert.equal(packageJson.scripts["dead-code:audit"], "node scripts/repository-audit/dead-code.mjs")
  assert.equal(packageJson.scripts["dependency:audit"], "node scripts/repository-audit/dependency.mjs")
  assert.equal(packageJson.scripts["asset:audit"], "node scripts/repository-audit/asset.mjs")
  assert.equal(packageJson.scripts["env:audit"], "node scripts/repository-audit/environment.mjs")
})
