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
const htmlReferencesToolPath = resolve(repositoryRoot, "scripts/repository-audit/refresh-html-named-references.mjs")
const realPolicy = loadCleanupPolicy(repositoryRoot, policyPath)
const workingPolicy = JSON.parse(readFileSync(policyPath, "utf8"))
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
  assert.ok([
    "instrumentation-client.ts", "instrumentation.ts", "sentry.edge.config.ts",
    "sentry.options.ts", "sentry.server.config.ts",
  ].every((path) => workingPolicy.scopes.runtime.includes(path)))
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

test("proposed runtime scope policy survives captured staged-policy loading", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const fixturePolicyPath = writeFixture(
    root, "scripts/repository-audit/cleanup-policy.json", `${JSON.stringify(workingPolicy, null, 2)}\n`,
  )
  const captured = loadCleanupPolicy(root, fixturePolicyPath)
  assert.ok([
    "instrumentation-client.ts", "instrumentation.ts", "sentry.edge.config.ts",
    "sentry.options.ts", "sentry.server.config.ts",
  ].every((path) => captured.scopes.runtime.includes(path)))
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

test("dead-code generated inputs recognize only exact declaration suffix families", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  for (const path of [
    "types/exact.d.ts", "types/exact.d.mts", "types/exact.d.cts",
    "types/ordinary.ts", "types/ordinary.mts", "types/ordinary.cts", "types/lookalike.d.tsx",
  ]) writeFixture(root, path, "export type Fixture = true\n")

  const report = buildDeadCodeCandidateReport(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(report.uncertainties.generatedInputs.map((row) => row.path), [
    "types/exact.d.cts", "types/exact.d.mts", "types/exact.d.ts",
  ])
  assert.ok(report.uncertainties.generatedInputs.every((row) => row.reason === "generated-or-declaration-input"))
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

test("CSS URL evidence decodes exact escapes with original raw offsets", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  for (const path of ["image.png", "icon.png", "six-hex.png", "simple name.png", "nested/logo.png", "linewrap.png", "bad�.png"]) {
    writeFixture(root, `app/panel/${path}`, path)
  }
  const privateSuffix = "?private-css-escape=1"
  const lines = [
    String.raw`a { background: url("im\61 ge.png${privateSuffix}") }`,
    String.raw`b { background: url(ic\6f n.png${privateSuffix}) }`,
    String.raw`c { background: url("six\00002dhex.png${privateSuffix}") }`,
    String.raw`d { background: url(simple\ name.png${privateSuffix}) }`,
    String.raw`e { background: url(nested\/logo.png${privateSuffix}) }`,
    `f { background: url("line\\\nwrap.png${privateSuffix}") }`,
    String.raw`g { background: url("bad\110000.png${privateSuffix}") }`,
  ]
  writeFixture(root, "app/panel/escaped.css", `${lines.join("\n")}\n`)

  const index = buildTrackedTextIndex(root, policy)
  const first = buildAssetCandidateReport(index, policy)
  const second = buildAssetCandidateReport(index, policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.referenceOwners.map((row) => [row.line, row.column, row.targetPath]), [
    [1, lines[0].indexOf("im") + 1, "app/panel/image.png"],
    [2, lines[1].indexOf("ic") + 1, "app/panel/icon.png"],
    [3, lines[2].indexOf("six") + 1, "app/panel/six-hex.png"],
    [4, lines[3].indexOf("simple") + 1, "app/panel/simple name.png"],
    [5, lines[4].indexOf("nested") + 1, "app/panel/nested/logo.png"],
    [6, lines[5].indexOf("line") + 1, "app/panel/linewrap.png"],
    [8, lines[6].indexOf("bad") + 1, "app/panel/bad�.png"],
  ])
  assert.deepEqual(first.uncertainties.unresolvedLiteralAssets, [])
  assertPrivateSerialization(first, root, [privateSuffix, "private-css-escape"])
})

test("CSS URL function tokens decode complete identifiers without suffix false positives", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  for (const name of ["escaped-middle.png", "escaped-prefix.png", "nonascii.png", "prefixed.png"]) {
    writeFixture(root, `app/panel/${name}`, name)
  }
  const lines = [
    String.raw`a { background: u\72 l("escaped-middle.png?private-css-ident=1") }`,
    String.raw`b { background: \75rl("escaped-prefix.png?private-css-ident=2") }`,
    `c { background: éurl("nonascii.png?private-css-ident=3") }`,
    String.raw`d { background: x\75rl("prefixed.png?private-css-ident=4") }`,
  ]
  writeFixture(root, "app/panel/functions.css", `${lines.join("\n")}\n`)

  const index = buildTrackedTextIndex(root, policy)
  const first = buildAssetCandidateReport(index, policy)
  const second = buildAssetCandidateReport(index, policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.referenceOwners.map((row) => [row.line, row.column, row.targetPath]), [
    [1, lines[0].indexOf("escaped-middle") + 1, "app/panel/escaped-middle.png"],
    [2, lines[1].indexOf("escaped-prefix") + 1, "app/panel/escaped-prefix.png"],
  ])
  assert.deepEqual(first.unreferencedCandidates.map((row) => row.path), [
    "app/panel/nonascii.png", "app/panel/prefixed.png",
  ])
  assertPrivateSerialization(first, root, ["private-css-ident"])
})

test("CSS URL function tokens exclude at-keyword and hash name suffixes", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  for (const name of ["at.png", "at-escaped.png", "hash.png", "hash-escaped.png", "at-control.png", "hash-control.png"]) {
    writeFixture(root, `app/panel/${name}`, name)
  }
  const lines = [
    `a { background: @url("at.png?private-css-prefix=1") }`,
    String.raw`b { background: @\75rl("at-escaped.png?private-css-prefix=2") }`,
    `c { background: #url("hash.png?private-css-prefix=3") }`,
    String.raw`d { background: #u\72 l("hash-escaped.png?private-css-prefix=4") }`,
    `e { background: @ url("at-control.png?private-css-prefix=5") }`,
    `f { background: # url("hash-control.png?private-css-prefix=6") }`,
  ]
  writeFixture(root, "app/panel/prefixes.css", `${lines.join("\n")}\n`)

  const index = buildTrackedTextIndex(root, policy)
  const first = buildAssetCandidateReport(index, policy)
  const second = buildAssetCandidateReport(index, policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.referenceOwners.map((row) => [row.line, row.column, row.targetPath]), [
    [5, lines[4].indexOf("at-control") + 1, "app/panel/at-control.png"],
    [6, lines[5].indexOf("hash-control") + 1, "app/panel/hash-control.png"],
  ])
  assertPrivateSerialization(first, root, ["private-css-prefix"])
})

test("CSS URL function tokens exclude dimension-unit suffixes after complete numbers", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  for (const name of ["integer.png", "positive.png", "fraction.png", "negative.png", "exponent.png", "control.png"]) {
    writeFixture(root, `app/panel/${name}`, name)
  }
  const lines = [
    String.raw`a { background: 1\61 url("integer.png?private-css-number=1") }`,
    String.raw`b { background: +1\61 url("positive.png?private-css-number=2") }`,
    String.raw`c { background: .1\61 url("fraction.png?private-css-number=3") }`,
    String.raw`d { background: -1\61 url("negative.png?private-css-number=4") }`,
    String.raw`e { background: 1e2\61 url("exponent.png?private-css-number=5") }`,
    `f { background: 1 url("control.png?private-css-number=6") }`,
  ]
  writeFixture(root, "app/panel/numbers.css", `${lines.join("\n")}\n`)

  const index = buildTrackedTextIndex(root, policy)
  const first = buildAssetCandidateReport(index, policy)
  const second = buildAssetCandidateReport(index, policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.referenceOwners.map((row) => [row.line, row.column, row.targetPath]), [
    [6, lines[5].indexOf("control") + 1, "app/panel/control.png"],
  ])
  assertPrivateSerialization(first, root, ["private-css-number"])
})

test("CSS URL preprocessing trims only decoded ASCII and C0 edges with raw offsets", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  for (const name of ["raw.png", "escaped.png", "internal name.png"]) {
    writeFixture(root, `app/panel/${name}`, name)
  }
  const nbsp = "\u00a0"
  const lines = [
    `a { background: url(" \t./raw.png \t") }`,
    String.raw`b { background: url("\20 ./escaped.png\9 ") }`,
    `c { background: url("./internal name.png") }`,
    String.raw`d { background: url("./internal\20 name.png") }`,
    `e { background: url("${nbsp}./raw.png?private-css-nbsp=1") }`,
    String.raw`f { background: url("\a0 ./raw.png?private-css-nbsp=2") }`,
  ]
  writeFixture(root, "app/panel/whitespace.css", `${lines.join("\n")}\n`)

  const index = buildTrackedTextIndex(root, policy)
  const first = buildAssetCandidateReport(index, policy)
  const second = buildAssetCandidateReport(index, policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.referenceOwners.map((row) => [row.line, row.column, row.targetPath]), [
    [1, lines[0].indexOf("./raw") + 1, "app/panel/raw.png"],
    [2, lines[1].indexOf("./escaped") + 1, "app/panel/escaped.png"],
    [3, lines[2].indexOf("./internal") + 1, "app/panel/internal name.png"],
    [4, lines[3].indexOf("./internal") + 1, "app/panel/internal name.png"],
  ])
  assert.deepEqual(first.uncertainties.unresolvedLiteralAssets.map((row) => row.line), [5, 6])
  assert.ok(first.uncertainties.unresolvedLiteralAssets.every((row) => /^[a-f0-9]{64}$/.test(row.literalSha256)))
  assertPrivateSerialization(first, root, ["private-css-nbsp", `${nbsp}./raw.png`])
})

test("CSS URL preprocessing replaces raw NUL and removes internal URL tabs and newlines", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  for (const name of ["image.png", "bad�.png", "function-replacement.png"]) {
    writeFixture(root, `app/panel/${name}`, name)
  }
  const lines = [
    `a { background: url("im\tage.png?private-css-preprocess=1") }`,
    String.raw`b { background: url("\69m\9 age.png?private-css-preprocess=2") }`,
    String.raw`c { background: url("\69m\a age.png?private-css-preprocess=3") }`,
    `d { background: url("bad\0.png?private-css-preprocess=4") }`,
    `e { background: u\0rl("function-replacement.png?private-css-preprocess=5") }`,
  ]
  writeFixture(root, "app/panel/preprocessing.css", `${lines.join("\n")}\n`)

  const index = buildTrackedTextIndex(root, policy)
  const first = buildAssetCandidateReport(index, policy)
  const second = buildAssetCandidateReport(index, policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.referenceOwners.map((row) => [row.line, row.column, row.targetPath]), [
    [1, lines[0].indexOf("im") + 1, "app/panel/image.png"],
    [2, lines[1].indexOf("\\69m") + 1, "app/panel/image.png"],
    [3, lines[2].indexOf("\\69m") + 1, "app/panel/image.png"],
    [4, lines[3].indexOf("bad") + 1, "app/panel/bad�.png"],
  ])
  assert.ok(first.unreferencedCandidates.some((row) => row.path === "app/panel/function-replacement.png"))
  assertPrivateSerialization(first, root, ["private-css-preprocess"])
})

test("CSS URL evidence keeps malformed escaped and external values conservative", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/panel/linewrap.png", "must-not-own")
  writeFixture(root, "app/panel/missing-asset.png", "untracked", { tracked: false })
  const lines = [
    `a { background: url(line\\\nwrap.png?private-unquoted-continuation=1) }`,
    String.raw`b { background: url("missing\2d asset.png?private-missing-escape=1") }`,
    String.raw`c { background: url("https\3a //example.test/private-external.png") }`,
    String.raw`d { background: url("data\3a image/png;base64,private-data") }`,
    String.raw`e { content: "url(im\61 ge.png?private-string=1)" }`,
    String.raw`/* url(im\61 ge.png?private-comment=1) */`,
  ]
  writeFixture(root, "app/panel/conservative.css", `${lines.join("\n")}\n`)

  const index = buildTrackedTextIndex(root, policy)
  const first = buildAssetCandidateReport(index, policy)
  const second = buildAssetCandidateReport(index, policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.referenceOwners, [])
  assert.deepEqual(first.uncertainties.unresolvedLiteralAssets.map((row) => [row.line, row.column]), [
    [1, lines[0].indexOf("line") + 1],
    [3, lines[1].indexOf("missing") + 1],
    [6, lines[4].indexOf("im") + 1],
    [7, lines[5].indexOf("im") + 1],
  ])
  assert.ok(first.uncertainties.unresolvedLiteralAssets.every((row) => (
    row.targetPath === undefined && /^[a-f0-9]{64}$/.test(row.literalSha256)
  )))
  assertPrivateSerialization(first, root, [
    "private-unquoted-continuation", "private-missing-escape", "private-external", "private-data",
    "private-string", "private-comment", "missing-asset.png",
  ])
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

test("asset evidence rejects protocol-relative URLs without weakening root-relative ownership", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "public/cdn.example/match.png", "remote-shaped")
  writeFixture(root, "public/icons/local.png", "local")
  const privateRemote = "//cdn.example/match.png?private-protocol-relative=1"
  for (const [path, contents] of [
    ["app/config.yaml", `remote: ${privateRemote}\nlocal: /icons/local.png\n`],
    ["app/data.json", `${JSON.stringify({ remote: privateRemote, local: "/icons/local.png" })}\n`],
    ["app/page.ts", `const remote = '${privateRemote}'; const local = '/icons/local.png'\n`],
    ["app/panel.html", `<img src=${privateRemote}><img src=/icons/local.png>\n`],
    ["app/readme.md", `![remote](${privateRemote}) ![local](/icons/local.png)\n`],
    ["app/styles.css", `.remote{background:url(${privateRemote})}.local{background:url(/icons/local.png)}\n`],
  ]) writeFixture(root, path, contents)

  const index = buildTrackedTextIndex(root, policy)
  const first = buildAssetEvidence(index, policy)
  const second = buildAssetEvidence(index, policy)
  assert.deepEqual(first, second)
  assert.equal(first.references.length, 6)
  assert.ok(first.references.every((row) => row.targetPath === "public/icons/local.png"))
  assert.equal(first.references.some((row) => row.targetPath === "public/cdn.example/match.png"), false)
  assert.deepEqual(first.errors, [])
  assert.equal(first.basenameSignals.length, 0)
  assertPrivateSerialization(first, root, ["private-protocol-relative"])
})

test("asset evidence parses live srcset candidates with exact offsets and conservative URL boundaries", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  for (const path of ["small.png", "large.png", "wide.png", "single.png", "first.png", "second.png"]) {
    writeFixture(root, `app/panel/${path}`, path)
  }
  const privateSuffix = "?private-srcset-owner=1#fragment"
  const lines = [
    `<img srcset="small.png${privateSuffix} 1x, large.png 2x">`,
    "<source srcset='wide.png 320w, large.png 640w'>",
    "<img srcset=single.png>",
    "<img srcset=\"data:image/png;base64,AAAA 1x, https://cdn.example/remote.png 2x, small.png 3x\">",
    "<img srcset=\"first.png 1x\" srcset=\"second.png 2x\">",
    "<img srcset\u00a0=\"second.png 1x\">",
    "<!-- <img srcset=\"second.png 1x\"> -->",
    "<script>const ignored = '<img srcset=\"second.png 1x\">'</script>",
    "<img srcset=\"missing.png 1x\">",
    "<plaintext><img srcset=\"second.png 1x\"></plaintext><img srcset=\"second.png 2x\">",
  ]
  writeFixture(root, "app/panel/srcset.html", `${lines.join("\n")}\n`)

  const index = buildTrackedTextIndex(root, policy)
  const first = buildAssetCandidateReport(index, policy)
  const second = buildAssetCandidateReport(index, policy)
  assert.deepEqual(first, second)
  const expected = [
    [1, "small.png", "app/panel/small.png"],
    [1, "large.png", "app/panel/large.png"],
    [2, "wide.png", "app/panel/wide.png"],
    [2, "large.png", "app/panel/large.png"],
    [3, "single.png", "app/panel/single.png"],
    [4, "small.png", "app/panel/small.png"],
    [5, "first.png", "app/panel/first.png"],
  ]
  assert.deepEqual(first.referenceOwners.map((row) => [row.line, row.column, row.targetPath]), expected.map(
    ([line, value, targetPath]) => [line, lines[line - 1].indexOf(value) + 1, targetPath],
  ))
  assert.equal(first.referenceOwners.some((row) => row.targetPath === "app/panel/second.png"), false)
  assert.deepEqual(
    first.uncertainties.unresolvedLiteralAssets.map((row) => [row.line, row.column]),
    [[9, lines[8].indexOf("missing.png") + 1]],
  )
  assertPrivateSerialization(first, root, [privateSuffix, "private-srcset-owner"])

  const cliFirst = runAuditCli(assetCliPath, root)
  const cliSecond = runAuditCli(assetCliPath, root)
  assert.equal(cliFirst.status, 0)
  assert.equal(cliFirst.stderr, "")
  assert.equal(cliFirst.stdout, cliSecond.stdout)
  const envelope = JSON.parse(cliFirst.stdout)
  assert.equal(envelope.deletionAuthority, false)
  assert.equal(envelope.findings.filter((row) => row.findingKind === "referenceOwners").length, 7)
  assertPrivateSerialization(cliFirst.stdout, root, [privateSuffix, "private-srcset-owner"])
})

test("asset evidence does not rescan structured srcset values as legacy quoted literals", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/panel/images/a.png", "a")
  writeFixture(root, "app/panel/b.png", "b")
  writeFixture(root, "app/panel/srcset.html", '<img srcset="images/a.png 1x, b.png">\n')

  const report = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(report.referenceOwners.map((row) => row.targetPath), [
    "app/panel/images/a.png", "app/panel/b.png",
  ])
  assert.deepEqual(report.uncertainties.unresolvedLiteralAssets, [])
})

test("asset evidence decodes exact HTML URL references without losing original offsets", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  for (const path of ["a&b.png", "numeric.png", "nested/slash.png", "src&set.png", "named/slash.png", "upper&case.png", "€.png", "\u0080.png", "unsafe&q;.png", "unsafe&1;.png"]) {
    writeFixture(root, `app/panel/${path}`, path)
  }
  writeFixture(root, "app/panel/unsafe&unknown;.png", "must-not-own")
  const privateSuffix = "?private-html-reference=1"
  const lines = [
    `<img src="a&amp;b.png${privateSuffix}">`,
    "<img src=numeric&#46;png>",
    "<img src=nested&#x2f;slash.png>",
    "<img srcset=src&amp;set.png>",
    "<img src=&#128;.png>",
    "<img src=&#x80;.png>",
    "<img srcset=\"named&sol;slash.png 1x, upper&AMP;case.png 2x\">",
    "<img src=unsafe&unknown;.png?private-ambiguous=1>",
    "<img src=unsafe&q;.png?private-short-reference=1>",
    "<img src=unsafe&1;.png?private-digit-reference=1>",
  ]
  writeFixture(root, "app/panel/entities.html", `${lines.join("\n")}\n`)

  const index = buildTrackedTextIndex(root, policy)
  const first = buildAssetCandidateReport(index, policy)
  const second = buildAssetCandidateReport(index, policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.referenceOwners.map((row) => [row.line, row.column, row.targetPath]), [
    [1, lines[0].indexOf("a&amp;") + 1, "app/panel/a&b.png"],
    [2, lines[1].indexOf("numeric") + 1, "app/panel/numeric.png"],
    [3, lines[2].indexOf("nested") + 1, "app/panel/nested/slash.png"],
    [4, lines[3].indexOf("src&amp;") + 1, "app/panel/src&set.png"],
    [5, lines[4].indexOf("&#128;") + 1, "app/panel/€.png"],
    [6, lines[5].indexOf("&#x80;") + 1, "app/panel/€.png"],
    [7, lines[6].indexOf("named&sol;") + 1, "app/panel/named/slash.png"],
    [7, lines[6].indexOf("upper&AMP;") + 1, "app/panel/upper&case.png"],
  ])
  assert.equal(first.referenceOwners.some((row) => row.targetPath === "app/panel/\u0080.png"), false)
  assert.equal(first.referenceOwners.some((row) => row.targetPath.includes("unknown")), false)
  assert.deepEqual(first.uncertainties.unresolvedLiteralAssets.map((row) => [row.line, row.column]), [
    [8, lines[7].indexOf("unsafe") + 1],
    [9, lines[8].indexOf("unsafe") + 1],
    [10, lines[9].indexOf("unsafe") + 1],
  ])
  assertPrivateSerialization(first, root, [
    privateSuffix, "private-html-reference", "private-ambiguous",
    "private-short-reference", "private-digit-reference",
  ])
})

test("structured HTML URLs preserve decoded non-ASCII whitespace conservatively", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/panel/foo.png", "must-not-own")
  const lines = [
    '<img src="&nbsp;foo.png?private-named-nbsp=1">',
    '<img src="&#160;foo.png?private-numeric-nbsp=1">',
    '<img srcset="&ensp;foo.png?private-ensp=1 1x, &#160;foo.png?private-srcset-nbsp=1 2x">',
  ]
  writeFixture(root, "app/panel/entity-whitespace.html", `${lines.join("\n")}\n`)

  const index = buildTrackedTextIndex(root, policy)
  const first = buildAssetCandidateReport(index, policy)
  const second = buildAssetCandidateReport(index, policy)
  assert.deepEqual(first, second)
  assert.equal(first.referenceOwners.some((row) => row.targetPath === "app/panel/foo.png"), false)
  assert.deepEqual(first.uncertainties.unresolvedLiteralAssets.map((row) => [row.line, row.column]), [
    [1, lines[0].indexOf("&nbsp;") + 1],
    [2, lines[1].indexOf("&#160;") + 1],
    [3, lines[2].indexOf("&ensp;") + 1],
    [3, lines[2].indexOf("&#160;") + 1],
  ])
  assertPrivateSerialization(first, root, [
    "private-named-nbsp", "private-numeric-nbsp", "private-ensp", "private-srcset-nbsp",
  ])
})

test("HTML named-reference snapshot is reproducible and retains decoding invariants", () => {
  const verification = spawnSync(process.execPath, [htmlReferencesToolPath, "--verify"], {
    cwd: repositoryRoot, encoding: "utf8",
  })
  assert.equal(verification.status, 0, verification.stderr)
  assert.equal(verification.stderr, "")
  assert.deepEqual(JSON.parse(verification.stdout), {
    entries: 2231,
    sha256: "99f7de5d06ab0bd778237f75a419bff42822336ed0fe41253e7942bc99ca7db5",
    snapshot: "CPython-v3.14.7-html.entities.html5",
    upstream: "https://html.spec.whatwg.org/entities.json",
  })
  const references = JSON.parse(readFileSync(resolve(repositoryRoot, "scripts/repository-audit/cleanup-html-named-references.json"), "utf8"))
  assert.equal(references.amp, "&")
  assert.equal(references["amp;"], "&")
  assert.equal(references["AMP;"], "&")
  assert.equal(references["NotEqualTilde;"], "≂̸")
})

test("asset evidence masks every duplicate structured HTML URL value from legacy scanning", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  for (const path of ["first.png", "nested/duplicate.png", "duplicate.png"]) {
    writeFixture(root, `app/panel/${path}`, path)
  }
  const lines = [
    '<img src="first.png" src="nested/duplicate.png">',
    '<video poster="first.png" poster="duplicate.png"></video>',
    '<a href="first.png" href="nested/duplicate.png">link</a>',
    '<img srcset="first.png 1x" srcset="nested/duplicate.png 2x">',
  ]
  writeFixture(root, "app/panel/duplicates.html", `${lines.join("\n")}\n`)

  const report = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(report.referenceOwners.map((row) => row.targetPath), [
    "app/panel/first.png", "app/panel/first.png", "app/panel/first.png", "app/panel/first.png",
  ])
  assert.equal(report.referenceOwners.some((row) => row.targetPath.includes("duplicate")), false)
  assert.equal(report.basenameOnlySignals.some((row) => row.candidateTargetPaths.some((path) => path.includes("duplicate"))), false)
  assert.deepEqual(report.uncertainties.unresolvedLiteralAssets, [])
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
  // The nested var write is conditional on both loops and the if branch, so both values reach the return.
  assert.deepEqual(evidence.uncertainties.map((row) => [row.code, row.name]), [
    ["UNPROVEN_ENVIRONMENT_ALIAS", "AFTER_NESTED_VAR"],
  ])
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
    // A proven environment object is truthy/non-nullish, so ||= and ??= skip their RHS.
    const shortCircuitsProven = operator !== "&&="
    assert.deepEqual(report.staticReads.map((row) => row.name), [
      "DEFAULT_CONTROL", "EXACT", ...(shortCircuitsProven ? ["PRIOR_PROVEN"] : []),
    ])
    assert.deepEqual(report.uncertainties.unprovenAliases.filter((row) => row.name).map((row) => row.name), [
      "DEFAULT_ALIAS", "DIRECT", ...(!shortCircuitsProven ? ["PRIOR_PROVEN"] : []), "PRIOR_UNKNOWN", "UNKNOWN",
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

test("environment CommonJS process-object initializers and defaults allow transparent wrappers", (t) => {
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
    "PARAMETER_NOT_OWNED", "DESTRUCTURED_DEFAULT_NOT_OWNED",
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
  // A for-in/of body may not execute, so the original process object and rebound iteration value both reach here.
  assert.deepEqual(evidence.uncertainties.map((row) => [row.path, row.name]), [
    ["lib/var-iteration-in.ts", "REBOUND_AFTER"],
    ["lib/var-iteration-of.ts", "REBOUND_AFTER"],
  ])
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
  // The loop can exit before or after its incrementor invalidates the process object.
  assert.deepEqual(evidence.uncertainties.map((row) => [row.code, row.name]), [
    ["UNPROVEN_ENVIRONMENT_ALIAS", "AFTER_INCREMENTOR"],
  ])
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

test("environment CommonJS process destructuring proves only exact static env bindings", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, ".env.example", [
    "SHORTHAND=", "RENAMED=", "LITERAL=", "ALIAS_BEFORE=", "OUTER_AFTER_SHADOW=", "COMPUTED_NAME_READ=", "DEFAULT_READ=", "",
  ].join("\n"))
  const privateComputedName = "privateProcessProperty"
  writeFixture(root, "lib/commonjs-process-destructure.cjs", [
    "const { env } = require('node:process'); void env.SHORTHAND",
    "const { env: renamed } = require('process'); void renamed.RENAMED",
    "let processAlias = require('node:process')",
    "const { 'env': literal } = processAlias; void literal.LITERAL",
    "const { env: aliasEnvironment } = processAlias; void aliasEnvironment.ALIAS_BEFORE",
    "function shadow(processAlias) { const { env: inner } = processAlias; void inner.INNER_SHADOW }",
    "void aliasEnvironment.OUTER_AFTER_SHADOW",
    "processAlias = {}; const { env: invalidated } = processAlias; void invalidated.AFTER_INVALIDATION",
    "function laterAlias() { const { env: early } = laterProcess; const laterProcess = require('process'); void early.LATER_ALIAS }",
    "function loaderParameter(require) { const { env: local } = require('process'); void local.PARAMETER_LOADER }",
    "function laterLoader() { const { env: local } = require('process'); const require = fake; void local.LATER_LOADER }",
    "function changedLoader() { require = fake; const { env: local } = require('process'); void local.CHANGED_LOADER }",
    "function wrongModule() { const { env } = require('node:process/promises'); void env.WRONG_MODULE }",
    "function optionalLoader() { const { env } = require?.('process'); void env.OPTIONAL_LOADER }",
    "function nonliteralLoader() { const { env } = require(moduleName); void env.NONLITERAL_LOADER }",
    "const { ENV: wrongCase } = require('process'); void wrongCase.WRONG_CASE",
    "const { stdout: nonEnvironment } = require('process'); void nonEnvironment.NON_ENV",
    "const { env: defaulted = process.env.DEFAULT_READ } = require('process'); void defaulted.DEFAULT_TARGET",
    `const { [${privateComputedName} = process.env.COMPUTED_NAME_READ]: computed } = require('process'); void computed.COMPUTED_TARGET`,
    "const { ...rest } = require('process'); void rest.REST_TARGET",
    "void shadow; void laterAlias; void loaderParameter; void laterLoader; void changedLoader",
    "void wrongModule; void optionalLoader; void nonliteralLoader",
    "",
  ].join("\n"))

  const index = buildTrackedTextIndex(root, policy)
  const first = buildEnvironmentCandidateReport(index, policy)
  const second = buildEnvironmentCandidateReport(index, policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.staticReads.map((row) => row.name), [
    "ALIAS_BEFORE", "COMPUTED_NAME_READ", "DEFAULT_READ", "LITERAL", "OUTER_AFTER_SHADOW", "RENAMED", "SHORTHAND",
  ])
  assert.deepEqual(first.unreadDeclarationCandidates, [])
  assert.deepEqual(first.uncertainties.unprovenAliases.map((row) => [row.name, row.kind]), [
    ["COMPUTED_TARGET", "property-access"],
    ["DEFAULT_TARGET", "property-access"],
    ["NONLITERAL_LOADER", "property-access"],
    ["OPTIONAL_LOADER", "property-access"],
    ["REST_TARGET", "property-access"],
    ["WRONG_MODULE", "property-access"],
  ])
  assertPrivateSerialization(first, root, [privateComputedName, "require('node:process')"])
})

test("environment process-object destructuring supports nested declarations assignments and implicit process", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, ".env.example", [
    "ASSIGNED=", "COMPUTED=", "DEFAULT_EVALUATION=", "GLOBAL=", "NESTED=", "",
  ].join("\n"))
  const privateDynamicName = "privateDynamicProcessProperty"
  writeFixture(root, "lib/process-object-patterns.cjs", [
    "const { env: { NESTED } } = require('process'); void NESTED",
    "const { env: globalEnv } = process; void globalEnv.GLOBAL",
    "let assigned; ({ env: assigned } = require('node:process')); void assigned.ASSIGNED",
    "const { ['env']: computedEnv } = require('process'); void computedEnv.COMPUTED",
    "function shadowed(process) { const { env: local } = process; void local.SHADOWED_PROCESS }",
    "let defaulted; ({ env: defaulted = process.env.DEFAULT_EVALUATION } = require('process')); void defaulted.DEFAULT_TARGET",
    `let dynamic; ({ [${privateDynamicName}]: dynamic } = require('process')); void dynamic.DYNAMIC_TARGET`,
    "let rest; ({ ...rest } = require('process')); void rest.REST_TARGET",
    "let wrong; ({ env: wrong } = require('node:process/promises')); void wrong.WRONG_MODULE",
    "let optional; ({ env: optional } = require?.('process')); void optional.OPTIONAL_LOADER",
    "void shadowed",
    "",
  ].join("\n"))

  const index = buildTrackedTextIndex(root, policy)
  const first = buildEnvironmentCandidateReport(index, policy)
  const second = buildEnvironmentCandidateReport(index, policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.staticReads.map((row) => row.name), [
    "ASSIGNED", "COMPUTED", "DEFAULT_EVALUATION", "GLOBAL", "NESTED",
  ])
  assert.deepEqual(first.unreadDeclarationCandidates, [])
  assert.deepEqual(first.uncertainties.unprovenAliases.map((row) => row.name), [
    null, "DEFAULT_TARGET", "DYNAMIC_TARGET", "REST_TARGET",
  ])
  assertPrivateSerialization(first, root, [privateDynamicName, "require('node:process')"])
})

test("environment process-object aliases and static env brackets preserve exact provenance", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, ".env.example", [
    "ASSIGNED_ALIAS=", "BRACKET=", "CHAINED=", "IMPLICIT=", "IMPORTED=", "NESTED_ALIAS=", "REQUIRED=", "TEMPLATE=", "",
  ].join("\n"))
  const privateDynamicName = "privateProcessEnvironmentKey"
  writeFixture(root, "lib/process-object-aliases.ts", [
    "import importedProcess from 'node:process'",
    "const implicitProcess = process",
    "const chainedProcess = implicitProcess",
    "const importedAlias = importedProcess",
    "const requiredProcess = require('process')",
    "const requiredAlias = requiredProcess",
    "let assignedProcess; assignedProcess = requiredAlias",
    "const { env: implicitEnv } = implicitProcess; void implicitEnv.IMPLICIT",
    "const { env: { NESTED_ALIAS } } = chainedProcess; void NESTED_ALIAS",
    "void importedAlias.env.IMPORTED",
    "void requiredAlias['env'].REQUIRED",
    "void assignedProcess[`env`].ASSIGNED_ALIAS",
    "void process['env'].BRACKET",
    "void process[`env`].TEMPLATE",
    `void process[${privateDynamicName}].DYNAMIC`,
    "void process['ENV'].WRONG_CASE",
    "void process?.['env'].OPTIONAL",
    "function shadowed(process) { const alias = process; void alias.env.SHADOWED }",
    "function laterShadow() { const alias = process; const process = fake; void alias.env.LATER_SHADOW }",
    "assignedProcess = {}; void assignedProcess.env.AFTER_ASSIGNMENT",
    "void shadowed; void laterShadow",
    "",
  ].join("\n"))

  const index = buildTrackedTextIndex(root, policy)
  const first = buildEnvironmentCandidateReport(index, policy)
  const second = buildEnvironmentCandidateReport(index, policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.staticReads.map((row) => row.name), [
    "ASSIGNED_ALIAS", "BRACKET", "IMPLICIT", "IMPORTED", "NESTED_ALIAS", "REQUIRED", "TEMPLATE",
  ])
  assert.equal(first.staticReads.some((row) => ["AFTER_ASSIGNMENT", "DYNAMIC", "LATER_SHADOW", "OPTIONAL", "SHADOWED", "WRONG_CASE"].includes(row.name)), false)
  assertPrivateSerialization(first, root, [privateDynamicName, "require('process')"])
})

test("environment parameter destructuring defaults inherit exact process-object provenance", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, ".env.example", "ALIAS_PARAMETER=\nPARAMETER=\n")
  writeFixture(root, "lib/process-parameter-patterns.ts", [
    "const runtimeProcess = process",
    "function read({ env: { PARAMETER } } = process) { void PARAMETER }",
    "function readAlias({ env: aliasEnvironment } = runtimeProcess) { void aliasEnvironment.ALIAS_PARAMETER }",
    "function shadowed({ env: { SHADOWED } } = process, process = fake) { void SHADOWED; void process }",
    "void read; void readAlias; void shadowed",
    "",
  ].join("\n"))

  const report = buildEnvironmentCandidateReport(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(report.staticReads.map((row) => row.name), ["ALIAS_PARAMETER", "PARAMETER"])
  assert.equal(report.staticReads.some((row) => row.name === "SHADOWED"), false)
  assert.deepEqual(report.unreadDeclarationCandidates, [])
})

test("environment array and catch binding defaults preserve process-object provenance", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const names = ["ARRAY_PARAMETER", "ARRAY_VARIABLE", "ARRAY_ITERATION", "NESTED_ARRAY", "CATCH_DEFAULT", "ORDERED_FIRST", "ORDERED_SECOND"]
  writeFixture(root, ".env.example", names.map((name) => `${name}=\n`).join(""))
  writeFixture(root, "lib/process-array-defaults.ts", [
    "function parameter([proc = process] = []) { void proc.env.ARRAY_PARAMETER }",
    "const [variable = process] = []; void variable.env.ARRAY_VARIABLE",
    "const [[nested = process] = []] = []; void nested.env.NESTED_ARRAY",
    "for (const [iteration = process] of rows) { void iteration.env.ARRAY_ITERATION }",
    "try {} catch ([caught = process]) { void caught.env.CATCH_DEFAULT }",
    "function ordered([first = process, second = first] = []) { void first.env.ORDERED_FIRST; void second.env.ORDERED_SECOND }",
    "function shadow(process) { const [local = process] = []; void local.env.SHADOWED_PROCESS }",
    "function tdz([local = process, process = fake] = []) { void local.env.TDZ_PROCESS }",
    "try {} catch ([process, local = process]) { void local.env.CATCH_SHADOW }",
    "void parameter; void ordered; void shadow; void tdz",
    "",
  ].join("\n"))

  const index = buildTrackedTextIndex(root, policy)
  const first = buildEnvironmentCandidateReport(index, policy)
  const second = buildEnvironmentCandidateReport(index, policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.staticReads.map((row) => row.name), names.sort())
  assert.equal(first.staticReads.some((row) => ["SHADOWED_PROCESS", "TDZ_PROCESS", "CATCH_SHADOW"].includes(row.name)), false)
  assert.deepEqual(first.unreadDeclarationCandidates, [])
})

test("environment for-in enumeration records one unbounded read per proven source", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/environment-for-in.ts", [
    "for (const key in process.env) { void key }",
    "const environment = process.env; for (const aliasKey in environment) { void aliasKey }",
    "function shadowed(process) { for (const key in process.env) { void key } }",
    "function invalidated() { process = fake; for (const key in process.env) { void key } }",
    "void shadowed; void invalidated",
    "",
  ].join("\n"))

  const index = buildTrackedTextIndex(root, policy)
  const first = buildEnvironmentCandidateReport(index, policy)
  const second = buildEnvironmentCandidateReport(index, policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.uncertainties.computedReads.map((row) => [row.kind, row.line]), [
    ["whole-object-value", 1], ["whole-object-value", 2],
  ])
  assert.deepEqual(first.uncertainties.unprovenAliases, [])
  assert.deepEqual(first.staticReads, [])
})

test("environment for-in enumeration recognizes compound result provenance once", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/environment-for-in-compound.ts", [
    "for (const key in (enabled ? process.env : {})) { void key }",
    "for (const key in (process.env || {})) { void key }",
    "let assigned; for (const key in (assigned = process.env)) { void key }",
    "for (const key in (enabled ? process.env : process.env)) { void key }",
    "function shadow(process) { for (const key in (enabled ? process.env : {})) { void key } }",
    "function mutated() { process = fake; for (const key in (process.env || {})) { void key } }",
    "function ordered() { for (const key in ((process = fake) || process.env)) { void key } }",
    "void shadow; void mutated; void ordered",
    "",
  ].join("\n"))

  const index = buildTrackedTextIndex(root, policy)
  const first = buildEnvironmentCandidateReport(index, policy)
  const second = buildEnvironmentCandidateReport(index, policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.uncertainties.computedReads.map((row) => [row.kind, row.line]), [
    ["whole-object-value", 1], ["whole-object-value", 2], ["whole-object-value", 3], ["whole-object-value", 4],
  ])
  assert.deepEqual(first.uncertainties.unprovenAliases, [])
  assert.deepEqual(first.staticReads, [])
})

test("environment for-in result provenance follows logical-assignment left and comma right values", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/environment-for-in-results.ts", [
    "let left = process.env; for (const key in (left ||= {})) { void key }",
    "let assigned; for (const key in (assigned = other, process.env)) { void key }",
    "for (const key in (process.env, {})) { void key }",
    "let both = process.env; for (const key in (both ||= process.env)) { void key }",
    "function shadow(process) { let local = process.env; for (const key in (local ||= {})) { void key } }",
    "function mutated() { let local = process.env; local = {}; for (const key in (local ||= {})) { void key } }",
    "function ordered() { let local = process.env; for (const key in ((local = {}), local)) { void key } }",
    "void shadow; void mutated; void ordered",
    "",
  ].join("\n"))

  const index = buildTrackedTextIndex(root, policy)
  const first = buildEnvironmentCandidateReport(index, policy)
  const second = buildEnvironmentCandidateReport(index, policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.uncertainties.computedReads.filter((row) => row.kind === "whole-object-value").map((row) => row.line), [1, 2, 4])
  assert.equal(first.uncertainties.computedReads.filter((row) => row.kind === "whole-object-value" && row.line === 4).length, 1)
  assert.deepEqual(first.uncertainties.unprovenAliases.map((row) => [row.kind, row.line]), [
    ["whole-object-value", 6], ["whole-object-value", 7],
  ])
  assertPrivateSerialization(first, root, ["process.env", "assigned = other"])
})

test("environment identifier and binding-element defaults preserve process-object provenance", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, ".env.example", [
    "BEFORE_MUTATION=", "BINDING_DEFAULT=", "CHAINED_DEFAULT=", "IMPORTED_DEFAULT=",
    "PARAMETER_DEFAULT=", "REQUIRED_DEFAULT=", "VARIABLE_DEFAULT=", "",
  ].join("\n"))
  writeFixture(root, "lib/process-object-defaults.ts", [
    "import runtimeProcess from 'node:process'",
    "const requiredProcess = require('process')",
    "function direct(proc = process) { void proc.env.PARAMETER_DEFAULT }",
    "function imported(proc = runtimeProcess) { void proc.env.IMPORTED_DEFAULT }",
    "function required(proc = requiredProcess) { void proc.env.REQUIRED_DEFAULT }",
    "function chained(proc = process, next = proc) { void next.env.CHAINED_DEFAULT }",
    "function binding({ proc = process } = {}) { void proc.env.BINDING_DEFAULT }",
    "const { local: variable = process } = {}; void variable.env.VARIABLE_DEFAULT",
    "function laterShadow(proc = process, process = fake) { void proc.env.LATER_SHADOW }",
    "function directShadow(process, proc = process) { void proc.env.DIRECT_SHADOW }",
    "function invalidated(proc = process) { void proc.env.BEFORE_MUTATION; proc = fake; void proc.env.AFTER_MUTATION }",
    "function optional(proc = require?.('process')) { void proc.env.OPTIONAL }",
    "void direct; void imported; void required; void chained; void binding; void laterShadow; void directShadow; void invalidated; void optional",
    "",
  ].join("\n"))

  const index = buildTrackedTextIndex(root, policy)
  const first = buildEnvironmentCandidateReport(index, policy)
  const second = buildEnvironmentCandidateReport(index, policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.staticReads.map((row) => row.name), [
    "BEFORE_MUTATION", "BINDING_DEFAULT", "CHAINED_DEFAULT", "IMPORTED_DEFAULT",
    "PARAMETER_DEFAULT", "REQUIRED_DEFAULT", "VARIABLE_DEFAULT",
  ])
  assert.equal(first.staticReads.some((row) => ["AFTER_MUTATION", "DIRECT_SHADOW", "LATER_SHADOW", "OPTIONAL"].includes(row.name)), false)
  assert.deepEqual(first.unreadDeclarationCandidates, [])
  assertPrivateSerialization(first, root, ["require('process')"])
})

test("environment implicit process ownership is invalidated by source-order writes and updates", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, ".env.example", [
    "BEFORE_ASSIGNMENT=", "BEFORE_COMPOUND=", "BEFORE_LOGICAL=", "BEFORE_POSTFIX=", "BEFORE_PREFIX=",
    "EXPLICIT_IMPORT=", "EXPLICIT_REQUIRE=", "UNMUTATED=", "",
  ].join("\n"))
  writeFixture(root, "lib/implicit-process-order.ts", [
    "import importedProcess from 'node:process'",
    "function simple() { const { env: before } = process; void before.BEFORE_ASSIGNMENT; process = {}; const { env: after } = process; void after.AFTER_ASSIGNMENT }",
    "function compound() { const { env: before } = process; void before.BEFORE_COMPOUND; process += other; const { env: after } = process; void after.AFTER_COMPOUND }",
    "function logical() { const { env: before } = process; void before.BEFORE_LOGICAL; process ||= other; const { env: after } = process; void after.AFTER_LOGICAL }",
    "function prefix() { const { env: before } = process; void before.BEFORE_PREFIX; ++process; const { env: after } = process; void after.AFTER_PREFIX }",
    "function postfix() { const { env: before } = process; void before.BEFORE_POSTFIX; process--; const { env: after } = process; void after.AFTER_POSTFIX }",
    "function untouched() { const { env: current } = process; void current.UNMUTATED }",
    "function shadowed(process) { process = other; const { env: local } = process; void local.SHADOWED }",
    "const requiredProcess = require('process'); const { env: required } = requiredProcess; void required.EXPLICIT_REQUIRE",
    "const { env: imported } = importedProcess; void imported.EXPLICIT_IMPORT",
    "void simple; void compound; void logical; void prefix; void postfix; void untouched; void shadowed",
    "",
  ].join("\n"))

  const index = buildTrackedTextIndex(root, policy)
  const first = buildEnvironmentCandidateReport(index, policy)
  const second = buildEnvironmentCandidateReport(index, policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.staticReads.map((row) => row.name), [
    "AFTER_LOGICAL", "BEFORE_ASSIGNMENT", "BEFORE_COMPOUND", "BEFORE_LOGICAL", "BEFORE_POSTFIX", "BEFORE_PREFIX",
    "EXPLICIT_IMPORT", "EXPLICIT_REQUIRE", "UNMUTATED",
  ])
  assert.deepEqual(first.unreadDeclarationCandidates, [])
  assert.equal(first.staticReads.some((row) => row.name !== "AFTER_LOGICAL" && row.name.startsWith("AFTER_") || row.name === "SHADOWED"), false)
})

test("environment class static blocks propagate only unbound implicit process mutation", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, ".env.example", "AFTER_FUNCTION=\nAFTER_SHADOW=\n")
  writeFixture(root, "lib/static-mutation.ts", [
    "class Mutator { static { process = {} } }",
    "const { env: afterStatic } = process; void afterStatic.AFTER_STATIC",
    "void Mutator",
    "",
  ].join("\n"))
  writeFixture(root, "lib/function-control.ts", [
    "function deferred() { class Mutator { static { process = {} } } void Mutator }",
    "const { env: afterFunction } = process; void afterFunction.AFTER_FUNCTION",
    "void deferred",
    "",
  ].join("\n"))
  writeFixture(root, "lib/shadow-control.ts", [
    "class Local { static { let process = {}; process = other; const { env: local } = process; void local.SHADOWED_STATIC } }",
    "const { env: afterShadow } = process; void afterShadow.AFTER_SHADOW",
    "void Local",
    "",
  ].join("\n"))

  const index = buildTrackedTextIndex(root, policy)
  const first = buildEnvironmentCandidateReport(index, policy)
  const second = buildEnvironmentCandidateReport(index, policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.staticReads.map((row) => row.name), ["AFTER_FUNCTION", "AFTER_SHADOW"])
  assert.deepEqual(first.unreadDeclarationCandidates, [])
  assert.equal(first.staticReads.some((row) => ["AFTER_STATIC", "SHADOWED_STATIC"].includes(row.name)), false)
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
  assert.deepEqual(evidence.reads.map((row) => row.name), [
    "OUTER", "AFTER", "VAR_AFTER", "PARAMETER_DEFAULT_NOT_OWNED", "DEFAULT_CONTROL", "COMPOUND_LOADER",
  ])
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

test("real Sentry and instrumentation entrypoints retain runtime-scoped evidence", () => {
  const index = buildTrackedTextIndex(repositoryRoot, workingPolicy)
  const entrypoints = [
    "instrumentation-client.ts", "instrumentation.ts", "sentry.edge.config.ts",
    "sentry.options.ts", "sentry.server.config.ts",
  ]
  const moduleEvidence = buildModuleEvidence(index, workingPolicy)
  assert.deepEqual(
    moduleEvidence.modules.filter((row) => entrypoints.includes(row.path)).map((row) => [row.path, row.scope]),
    entrypoints.map((path) => [path, "runtime"]),
  )

  const dependencyReport = buildDependencyCandidateReport(index, workingPolicy)
  const entrypointDependencyOwners = dependencyReport.literalImportOwners.filter((row) => entrypoints.includes(row.ownerPath))
  assert.ok(entrypoints.every((path) => entrypointDependencyOwners.some((row) => row.ownerPath === path)))
  assert.ok(entrypointDependencyOwners.every((row) => row.ownerScope === "runtime"))

  const environmentReport = buildEnvironmentCandidateReport(index, workingPolicy)
  const entrypointEnvironmentReads = environmentReport.staticReads.filter((row) => entrypoints.includes(row.path))
  assert.ok(entrypointEnvironmentReads.some((row) => row.path === "instrumentation.ts" && row.name === "NEXT_RUNTIME"))
  assert.ok(entrypointEnvironmentReads.some((row) => (
    row.path === "sentry.options.ts" && row.name === "NEXT_PUBLIC_SENTRY_DSN"
  )))
  assert.ok(entrypointEnvironmentReads.every((row) => row.scope === "runtime"))
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

test("round 25 environment assignments join normal branch and loop paths", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const lines = [
    "let oneBranch = {}; if (flag) oneBranch = process.env; oneBranch.ONE_BRANCH;",
    "let both = {}; if (flag) both = process.env; else both = process.env; both.BOTH_PROVEN;",
    "let conditional = {}; flag ? conditional = process.env : sideEffect(); conditional.CONDITIONAL_BRANCH;",
    "let conditionalBoth = {}; flag ? conditionalBoth = process.env : conditionalBoth = process.env; conditionalBoth.CONDITIONAL_BOTH;",
    "let whileAlias = {}; while (flag) { whileAlias = process.env; } whileAlias.ZERO_WHILE;",
    "let forAlias = {}; for (; flag;) { forAlias = process.env; } forAlias.ZERO_FOR;",
    "let doAlias = {}; do { doAlias = process.env; } while (flag); doAlias.DO_PROVEN;",
    "let broken = {}; do { if (flag) break; broken = process.env; } while (false); broken.BREAK_PATH;",
    "let continued = {}; do { if (flag) continue; continued = process.env; } while (false); continued.CONTINUE_PATH;",
    "let straight = {}; straight = process.env; straight.STRAIGHT_PROVEN;",
    "",
  ]
  writeFixture(root, "app/environment-flow-joins.ts", lines.join("\n"))

  const first = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  const second = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.reads.map((row) => row.name), ["BOTH_PROVEN", "CONDITIONAL_BOTH", "DO_PROVEN", "STRAIGHT_PROVEN"])
  const uncertain = first.uncertainties.filter((row) => row.code === "UNPROVEN_ENVIRONMENT_ALIAS")
  assert.deepEqual(uncertain.map((row) => row.name), [
    "ONE_BRANCH", "CONDITIONAL_BRANCH", "ZERO_WHILE", "ZERO_FOR", "BREAK_PATH", "CONTINUE_PATH",
  ])
  assert.ok(uncertain.every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
})

test("round 25 deferred functions isolate writes while immediate invocations preserve flow", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const lines = [
    "let environment = process.env;",
    "function declared() { environment.INSIDE_DECLARATION; environment = {}; }",
    "environment.AFTER_DECLARATION;",
    "const expression = function () { environment.INSIDE_EXPRESSION; environment = {}; };",
    "const arrow = () => { environment.INSIDE_ARROW; environment = {}; };",
    "environment.AFTER_DEFERRED;",
    "let immediate = {}; (() => { immediate = process.env; })(); immediate.IMMEDIATE;",
    "(function () { environment = {}; })(); environment.AFTER_IIFE_INVALIDATION;",
    "let optional = {}; (function () { optional = process.env; })?.(); optional.OPTIONAL_INVOCATION;",
    "let conditionalImmediate = {}; (flag ? (() => { conditionalImmediate = process.env; }) : (() => { conditionalImmediate = process.env; }))(); conditionalImmediate.CONDITIONAL_IMMEDIATE;",
    "let conditionalMixed = {}; (flag ? (() => { conditionalMixed = process.env; }) : (() => {}))(); conditionalMixed.CONDITIONAL_MIXED;",
    "void declared; void expression; void arrow;",
    "",
  ]
  writeFixture(root, "app/environment-function-flow.ts", lines.join("\n"))

  const first = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  const second = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.reads.map((row) => row.name), [
    "INSIDE_DECLARATION", "AFTER_DECLARATION", "INSIDE_EXPRESSION", "INSIDE_ARROW",
    "AFTER_DEFERRED", "IMMEDIATE", "OPTIONAL_INVOCATION", "CONDITIONAL_IMMEDIATE",
  ])
  const uncertain = first.uncertainties.filter((row) => row.code === "UNPROVEN_ENVIRONMENT_ALIAS")
  assert.deepEqual(uncertain.map((row) => row.name), [
    "AFTER_IIFE_INVALIDATION", "CONDITIONAL_MIXED",
  ])
  assert.ok(uncertain.every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
})

test("round 25 possible CommonJS loaders retain conservative process provenance", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const privateExpression = "selectPrivateCommonJsKey()"
  const lines = [
    "const exact = flag ? require : require; exact('process').env.EXACT;",
    "const invalid = flag ? other : other; invalid('process').env.INVALID;",
    "const mixed = flag ? require : other; mixed('node:process').env.MIXED;",
    "const logical = require || other; logical('process').env.LOGICAL;",
    "const { env: maybeEnvironment } = mixed('process'); maybeEnvironment.MAYBE_DESTRUCTURED;",
    `mixed('process').env[${privateExpression}];`,
    "function shadow(require) { const local = flag ? require : other; local('process').env.SHADOWED; }",
    "",
  ]
  writeFixture(root, "scripts/environment-commonjs-flow.cjs", lines.join("\n"))

  const first = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  const second = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.reads.map((row) => row.name), ["EXACT", "LOGICAL"])
  const uncertain = first.uncertainties.filter((row) => row.code === "UNPROVEN_ENVIRONMENT_ALIAS")
  assert.deepEqual(uncertain.map((row) => row.name), ["MIXED", "MAYBE_DESTRUCTURED", null])
  assert.ok(uncertain.every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
  assertPrivateSerialization(first, root, [privateExpression])
})

test("round 25 for-loop incrementors join every reaching continue edge", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const lines = [
    "let before = flag ? process.env : {}; for (let i = 0; i < 1; (before.BEFORE_CONTINUE, i++)) { continue; }",
    "let after = {}; for (let i = 0; i < 1; (after.AFTER_CONTINUE, i++)) { after = process.env; continue; }",
    "let conditional = {}; for (let i = 0; i < 1; (conditional.CONDITIONAL_CONTINUE, i++)) { if (flag) continue; conditional = process.env; }",
    "let nested = {}; outer: for (let i = 0; i < 1; (nested.NESTED_CONTINUE, i++)) { for (;;) { continue outer; } nested = process.env; }",
    "let labeled = {}; outerTwo: for (let i = 0; i < 1; (labeled.LABELED_CONTINUE, i++)) { labeled = process.env; continue outerTwo; }",
    "let broken = {}; for (let i = 0; i < 1; (broken.BREAK_SKIPS_INCREMENT, i++)) { break; }",
    "function returned() { let value = {}; for (let i = 0; i < 1; (value.RETURN_SKIPS_INCREMENT, i++)) { return; } }",
    "function thrown() { let value = {}; for (let i = 0; i < 1; (value.THROW_SKIPS_INCREMENT, i++)) { throw failure; } }",
    "",
  ]
  writeFixture(root, "app/environment-for-continue.ts", lines.join("\n"))

  const first = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  const second = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.reads.map((row) => row.name), ["AFTER_CONTINUE", "LABELED_CONTINUE"])
  const uncertain = first.uncertainties.filter((row) => row.code === "UNPROVEN_ENVIRONMENT_ALIAS")
  assert.deepEqual(uncertain.map((row) => row.name), ["BEFORE_CONTINUE", "CONDITIONAL_CONTINUE"])
  assert.ok(uncertain.every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
})

test("round 25 module-loader incrementors join every reaching continue edge", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/service.ts", "export const service = true\n")
  const lines = [
    "import { createRequire } from 'node:module';",
    "let maybe; for (let i = 0; i < 1; (maybe('../lib/service'), i++)) { if (flag) continue; maybe = createRequire(import.meta.url); }",
    "let exact; for (let i = 0; i < 1; (exact('../lib/service'), i++)) { exact = createRequire(import.meta.url); if (flag) continue; }",
    "let labeled; outer: for (let i = 0; i < 1; (labeled('../lib/service'), i++)) { for (;;) { continue outer; } labeled = createRequire(import.meta.url); }",
    "",
  ]
  writeFixture(root, "scripts/loader-continue.mjs", lines.join("\n"))

  const first = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  const second = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.references.filter((row) => row.kind === "require").map((row) => row.line), [3])
  const uncertain = first.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER")
  assert.deepEqual(uncertain.map((row) => row.line), [2])
  assert.ok(uncertain.every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
})

test("round 25 immediate function callees preserve transparent comma call and apply flow", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const lines = [
    "let comma = {}; (sideEffect(), (() => { comma = process.env; }))(); comma.COMMA;",
    "let called = {}; (function () { called = process.env; }).call(null); called.CALL;",
    "let applied = {}; (() => { applied = process.env; }).apply(null, []); applied.APPLY;",
    "let invalidated = process.env; (function () { invalidated = {}; }).call(null); invalidated.INVALIDATED;",
    "let optional = {}; (function () { optional = process.env; }).call?.(null); optional.OPTIONAL_CALL;",
    "let conditional = {}; (flag ? function () { conditional = process.env; } : function () { conditional = process.env; }).apply(null, []); conditional.CONDITIONAL;",
    "let mixed = {}; (flag ? function () { mixed = process.env; } : function () {}).call(null); mixed.MIXED;",
    "",
  ]
  writeFixture(root, "app/environment-iife-callees.ts", lines.join("\n"))

  const first = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  const second = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.reads.map((row) => row.name), ["COMMA", "CALL", "APPLY", "OPTIONAL_CALL", "CONDITIONAL"])
  const uncertain = first.uncertainties.filter((row) => row.code === "UNPROVEN_ENVIRONMENT_ALIAS")
  assert.deepEqual(uncertain.map((row) => row.name), ["INVALIDATED", "MIXED"])
  assert.ok(uncertain.every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
})

test("round 25 logical assignments retain possible CommonJS loader provenance", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const privateKey = "selectPrivateLogicalLoaderKey()"
  const lines = [
    "let both = require; both &&= require; both('process').env.BOTH_PROVEN;",
    "let possible = flag ? require : other; possible ||= require; possible('process').env.POSSIBLE;",
    "let nonloader = other; nonloader ||= require; nonloader('process').env.NONLOADER_OR;",
    "let andLoader = other; andLoader &&= require; andLoader('process').env.NONLOADER_AND;",
    "let nullish = require; nullish ??= other; nullish('process').env.NULLISH_PROVEN;",
    `possible('process').env[${privateKey}];`,
    "",
  ]
  writeFixture(root, "scripts/environment-logical-loader.cjs", lines.join("\n"))

  const first = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  const second = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.reads.map((row) => row.name), ["BOTH_PROVEN", "NULLISH_PROVEN"])
  const uncertain = first.uncertainties.filter((row) => row.code === "UNPROVEN_ENVIRONMENT_ALIAS")
  assert.deepEqual(uncertain.map((row) => row.name), ["POSSIBLE", "NONLOADER_OR", "NONLOADER_AND", null])
  assert.ok(uncertain.every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
  assertPrivateSerialization(first, root, [privateKey])
})

test("round 25 abrupt flow distinguishes switch labels and try paths", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const lines = [
    "let labeled = {}; block: { labeled = process.env; break block; } labeled.LABELED_BLOCK;",
    "let switched = {}; do { switched = process.env; switch (flag) { case 1: break; default: sideEffect(); } } while (false); switched.SWITCH_BREAK;",
    "let tried = {}; try { mightThrow(); tried = process.env; } catch {} tried.TRY_UNCERTAIN;",
    "let caught = {}; try { if (flag) throw failure; caught = process.env; } catch { caught = process.env; } caught.CATCH_PROVEN;",
    "let finalized = {}; try { mightThrow(); } catch {} finally { finalized = process.env; } finalized.FINALLY_PROVEN;",
    "",
  ]
  writeFixture(root, "app/environment-abrupt-flow.ts", lines.join("\n"))

  const first = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  const second = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.reads.map((row) => row.name), ["LABELED_BLOCK", "SWITCH_BREAK", "CATCH_PROVEN", "FINALLY_PROVEN"])
  const uncertain = first.uncertainties.filter((row) => row.code === "UNPROVEN_ENVIRONMENT_ALIAS")
  assert.deepEqual(uncertain.map((row) => row.name), ["TRY_UNCERTAIN"])
  assert.ok(uncertain.every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
})

test("round 25 module-loader incrementors exclude abrupt and infinite body paths", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/service.ts", "export const service = true\n")
  const lines = [
    "import { createRequire } from 'node:module';",
    "function returned() { let loader; for (; flag; loader('../lib/service')) { loader = createRequire(import.meta.url); return; } }",
    "function thrown() { let loader; for (; flag; loader('../lib/service')) { loader = createRequire(import.meta.url); throw failure; } }",
    "let blocked; outer: for (; flag; blocked('../lib/service')) { for (;;) {} blocked = createRequire(import.meta.url); }",
    "let resumed; outerTwo: for (; flag; resumed('../lib/service')) { resumed = createRequire(import.meta.url); for (;;) { continue outerTwo; } }",
    "let broken; for (; flag; broken('../lib/service')) { for (;;) { break; } broken = createRequire(import.meta.url); }",
    "void returned; void thrown;",
    "",
  ]
  writeFixture(root, "scripts/loader-completions.mjs", lines.join("\n"))

  const report = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(report.references.filter((row) => row.kind === "require").map((row) => row.line), [5, 6])
  assert.deepEqual(report.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER").map((row) => row.line), [])
})

test("round 25 partial immediate callees join executed and skipped paths", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const lines = [
    "let direct = {}; (flag ? (() => { direct = process.env; }) : null)(); direct.DIRECT_NORMAL;",
    "let optional = {}; (flag ? (() => { optional = process.env; }) : null)?.(); optional.OPTIONAL_PARTIAL;",
    "let logical = {}; (flag && (() => { logical = process.env; }))?.(); logical.LOGICAL_PARTIAL;",
    "let comma = {}; ((comma = process.env), (() => {}))(); comma.COMMA_ONCE;",
    "let optionalCall = {}; (flag ? (() => { optionalCall = process.env; }) : null)?.call(null); optionalCall.OPTIONAL_CALL_PARTIAL;",
    "",
  ]
  writeFixture(root, "app/environment-partial-iife.ts", lines.join("\n"))

  const first = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  const second = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.reads.map((row) => row.name), ["DIRECT_NORMAL", "COMMA_ONCE"])
  const uncertain = first.uncertainties.filter((row) => row.code === "UNPROVEN_ENVIRONMENT_ALIAS")
  assert.deepEqual(uncertain.map((row) => row.name), ["OPTIONAL_PARTIAL", "LOGICAL_PARTIAL", "OPTIONAL_CALL_PARTIAL"])
  assert.ok(uncertain.every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
})

test("round 25 logical assignment expressions preserve loader result provenance", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const privateKey = "selectPrivateAssignmentResultKey()"
  const lines = [
    "let exact = require; (exact ||= other)('process').env.EXACT_RESULT;",
    "let possible = flag ? require : other; (possible ||= require)('process').env.POSSIBLE_RESULT;",
    "let andResult = flag ? require : other; (andResult &&= require)('process').env.AND_RESULT;",
    "let destructured = flag ? require : other; const { env } = (destructured ??= require)('process'); env.DESTRUCTURED_RESULT;",
    `(possible ||= require)('process').env[${privateKey}];`,
    "",
  ]
  writeFixture(root, "scripts/environment-loader-results.cjs", lines.join("\n"))

  const first = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  const second = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.reads.map((row) => row.name), ["EXACT_RESULT"])
  const uncertain = first.uncertainties.filter((row) => row.code === "UNPROVEN_ENVIRONMENT_ALIAS")
  assert.deepEqual(uncertain.map((row) => row.name), ["POSSIBLE_RESULT", "AND_RESULT", "DESTRUCTURED_RESULT", null])
  assert.ok(uncertain.every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
  assertPrivateSerialization(first, root, [privateKey])
})

test("round 25 try completion states reach catch and finally precisely", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const lines = [
    "let beforeThrow = {}; try { beforeThrow = process.env; throw failure; } catch {} beforeThrow.BEFORE_THROW;",
    "let conditionalThrow = {}; try { if (flag) throw failure; conditionalThrow = process.env; } catch {} conditionalThrow.CONDITIONAL_THROW;",
    "function returning() { let beforeReturn = {}; try { beforeReturn = process.env; return; } finally { beforeReturn.FINALLY_BEFORE_RETURN; } }",
    "let catchExact = {}; try { if (flag) throw failure; catchExact = process.env; } catch { catchExact = process.env; } catchExact.CATCH_EXACT;",
    "void returning;",
    "",
  ]
  writeFixture(root, "app/environment-try-completions.ts", lines.join("\n"))

  const first = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  const second = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.reads.map((row) => row.name), ["BEFORE_THROW", "FINALLY_BEFORE_RETURN", "CATCH_EXACT"])
  const uncertain = first.uncertainties.filter((row) => row.code === "UNPROVEN_ENVIRONMENT_ALIAS")
  assert.deepEqual(uncertain.map((row) => row.name), ["CONDITIONAL_THROW"])
  assert.ok(uncertain.every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
})

test("round 25 module-loader while and do completions gate outer incrementors", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/service.ts", "export const service = true\n")
  const lines = [
    "import { createRequire } from 'node:module';",
    "let blocked; for (; flag; blocked('../lib/service')) { while (true) {} blocked = createRequire(import.meta.url); }",
    "let doBlocked; for (; flag; doBlocked('../lib/service')) { do {} while (true); doBlocked = createRequire(import.meta.url); }",
    "let resumed; outer: for (; flag; resumed('../lib/service')) { resumed = createRequire(import.meta.url); while (true) { continue outer; } }",
    "let broken; for (; flag; broken('../lib/service')) { while (true) { break; } broken = createRequire(import.meta.url); }",
    "",
  ]
  writeFixture(root, "scripts/loader-while-completions.mjs", lines.join("\n"))
  const report = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(report.references.filter((row) => row.kind === "require").map((row) => row.line), [4, 5])
  assert.deepEqual(report.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER"), [])
})

test("round 25 module assignment expressions expose operator-aware loader results", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/service.ts", "export const service = true\n")
  const lines = [
    "import { createRequire } from 'node:module';",
    "let assigned; (assigned = createRequire(import.meta.url))('../lib/service');",
    "let captured; const saved = (captured = createRequire(import.meta.url)); saved('../lib/service');",
    "let exact = createRequire(import.meta.url); (exact ||= other)('../lib/service');",
    "let possible = other; (possible ||= createRequire(import.meta.url))('../lib/service');",
    "let andExact = createRequire(import.meta.url); (andExact &&= createRequire(import.meta.url))('../lib/service');",
    "let nullishExact = createRequire(import.meta.url); (nullishExact ??= other)('../lib/service');",
    "let logicalExact = createRequire(import.meta.url); (logicalExact || other)('../lib/service');",
    "let logicalAnd = createRequire(import.meta.url); (logicalAnd && createRequire(import.meta.url))('../lib/service');",
    "let logicalPossible = other; (logicalPossible || createRequire(import.meta.url))('../lib/service');",
    "",
  ]
  writeFixture(root, "scripts/loader-assignment-results.mjs", lines.join("\n"))
  const first = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  const second = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.references.filter((row) => row.kind === "require").map((row) => row.line), [2, 3, 4, 6, 7, 8, 9])
  const uncertain = first.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER")
  assert.deepEqual(uncertain.map((row) => row.line), [5, 10])
  assert.ok(uncertain.every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
})

test("round 25 immediate callee alternatives keep independent entry states", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const lines = [
    "let one = {}; (flag ? ((one = process.env), (() => {})) : (() => {}))(); one.ONE_BRANCH;",
    "let both = {}; (flag ? ((both = process.env), (() => {})) : ((both = process.env), (() => {})))(); both.BOTH_BRANCHES;",
    "let optional = {}; (flag ? ((optional = process.env), (() => {})) : null)?.(); optional.OPTIONAL_BRANCH;",
    "let direct = {}; (flag ? ((direct = process.env), (() => {})) : null)(); direct.DIRECT_NORMAL;",
    "let logical = {}; (flag && ((logical = process.env), (() => {})))?.(); logical.LOGICAL_BRANCH;",
    "",
  ]
  writeFixture(root, "app/environment-iife-entries.ts", lines.join("\n"))
  const first = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  const second = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.reads.map((row) => row.name), ["BOTH_BRANCHES", "DIRECT_NORMAL"])
  assert.deepEqual(first.uncertainties.filter((row) => row.code === "UNPROVEN_ENVIRONMENT_ALIAS").map((row) => row.name), [
    "ONE_BRANCH", "OPTIONAL_BRANCH", "LOGICAL_BRANCH",
  ])
})

test("round 25 logical assignments evaluate only reachable environment RHS paths", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const lines = [
    "let skipOr = process.env; skipOr ||= process.env.SKIPPED_OR; skipOr.OR_STAYS_PROVEN;",
    "let skipNullish = process.env; skipNullish ??= process.env.SKIPPED_NULLISH; skipNullish.NULLISH_STAYS_PROVEN;",
    "let executeAnd = process.env; executeAnd &&= {}; executeAnd.AND_INVALIDATED;",
    "let possible = flag ? process.env : {}; possible ||= process.env; possible.POSSIBLE_OR;",
    "let nonalias = {}; nonalias &&= process.env; nonalias.NONALIAS_AND;",
    "",
  ]
  writeFixture(root, "app/environment-logical-execution.ts", lines.join("\n"))
  const first = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  const second = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.reads.map((row) => row.name), ["OR_STAYS_PROVEN", "NULLISH_STAYS_PROVEN"])
  assert.equal(first.reads.some((row) => ["SKIPPED_OR", "SKIPPED_NULLISH"].includes(row.name)), false)
  assert.deepEqual(first.uncertainties.filter((row) => row.code === "UNPROVEN_ENVIRONMENT_ALIAS").map((row) => row.name), [
    "AND_INVALIDATED", "POSSIBLE_OR", "NONALIAS_AND",
  ])
})

test("round 25 nested finally routes labeled abrupt completions with state", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const lines = [
    "let nested = {}; try { try { nested = process.env; throw failure; } finally { nested.FINALLY_INNER; } } catch {} nested.AFTER_NESTED;",
    "let labeled = {}; outer: { try { labeled = process.env; break outer; } finally { labeled.FINALLY_LABEL; } } labeled.AFTER_LABEL;",
    "function continuing() { let value = {}; outer: for (;;) { try { value = process.env; continue outer; } finally { value.FINALLY_CONTINUE; } } }",
    "let overridden = process.env; try { try { throw failure; } finally { overridden = {}; throw replacement; } } catch {} overridden.AFTER_OVERRIDE;",
    "void continuing;",
    "",
  ]
  writeFixture(root, "app/environment-nested-completions.ts", lines.join("\n"))
  const first = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  const second = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.reads.map((row) => row.name), [
    "FINALLY_INNER", "AFTER_NESTED", "FINALLY_LABEL", "AFTER_LABEL", "FINALLY_CONTINUE",
  ])
  assert.deepEqual(first.uncertainties.filter((row) => row.code === "UNPROVEN_ENVIRONMENT_ALIAS").map((row) => row.name), ["AFTER_OVERRIDE"])
})

test("round 24 loader evidence preserves plain-assignment provenance", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/service.ts", "export const service = true\n")
  writeFixture(root, "scripts/assigned-loader.mjs", [
    "import { createRequire } from 'node:module'",
    "let loader",
    "loader = createRequire(import.meta.url)",
    "loader('../lib/service')",
    "let alias",
    "alias = loader",
    "alias('../lib/service')",
    "loader = other",
    "loader('../lib/service')",
    "function shadow(createRequire) { let local; local = createRequire(import.meta.url); local('../lib/service') }",
    "",
  ].join("\n"))

  const first = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  const second = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.references.filter((row) => row.kind === "require").map((row) => [row.line, row.targetPath]), [
    [4, "lib/service.ts"],
    [7, "lib/service.ts"],
  ])
  assert.equal(first.references.some((row) => row.line === 9), false)
  assert.equal(first.references.some((row) => row.line === 10), false)
  assert.deepEqual(first.errors, [])
})

test("round 24 environment evidence classifies static and computed in-operator keys", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const privateDynamic = "selectPrivateEnvironmentKey()"
  writeFixture(root, "app/environment-in.ts", [
    "const environment = process.env;",
    "'STATIC_KEY' in process.env;",
    "`TEMPLATE_KEY` in environment;",
    `${privateDynamic} in process.env;`,
    "let env;",
    "'UNKNOWN_KEY' in env;",
    "'BEFORE_REASSIGN' in environment;",
    "environment = {};",
    "'AFTER_REASSIGN' in environment;",
    "function shadow(process) { 'SHADOWED_KEY' in process.env; }",
    "function tdz() { 'TDZ_KEY' in process.env; const process = globalThis.process; }",
    "function ordinary(value) { 'id' in value; }",
    "",
  ].join("\n"))

  const index = buildTrackedTextIndex(root, policy)
  const first = buildEnvironmentEvidence(index, policy)
  const second = buildEnvironmentEvidence(index, policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.reads.filter((row) => row.kind === "in-operator").map((row) => row.name), [
    "STATIC_KEY", "TEMPLATE_KEY", "BEFORE_REASSIGN",
  ])
  const computed = first.uncertainties.filter((row) => row.code === "COMPUTED_ENVIRONMENT_READ" && row.kind === "in-operator")
  assert.equal(computed.length, 1)
  assert.match(computed[0].expressionSha256, /^[a-f0-9]{64}$/)
  assert.deepEqual(first.uncertainties.filter((row) => row.code === "UNPROVEN_ENVIRONMENT_ALIAS" && row.kind === "in-operator").map((row) => row.name), ["UNKNOWN_KEY", "AFTER_REASSIGN"])
  assert.equal(first.reads.some((row) => ["AFTER_REASSIGN", "SHADOWED_KEY", "TDZ_KEY"].includes(row.name)), false)
  assertPrivateSerialization(first, root, [privateDynamic])
})

test("round 24 Markdown reference definitions retain semantic destinations and raw offsets", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  for (const name of [
    "hero.png", "angle.png", "nested(foo).png", "multi.png", "quoted.png", "listed.png",
    "paren).png", "first.png", "second.png", "blocked.png", "broken.png",
  ]) writeFixture(root, `app/panel/images/${name}`, name)
  const suffix = "?private-reference-definition=1#fragment"
  const lines = [
    `[Hero]: images/hero.png${suffix} "title"`,
    `[Angle]: <images/angle.png${suffix}>`,
    `[Nested]: images/nested(foo).png${suffix}`,
    "[Multi]:",
    `  images/multi.png${suffix}`,
    "  'multiline title'",
    `> [Quoted]: images/quoted.png${suffix}`,
    `- [Listed]: images/listed.png${suffix}`,
    String.raw`[Escaped]: images/paren\).png${suffix}`,
    `[Dupe Label]: images/first.png${suffix}`,
    `[ dupe   label ]: images/second.png${suffix}`,
    "paragraph interruption",
    `[Blocked]: images/blocked.png${suffix}`,
    "",
    "```md",
    `[Code]: images/blocked.png${suffix}`,
    "```",
    `    [Indented]: images/blocked.png${suffix}`,
    `[Broken]: images/broken(foo.png${suffix}`,
    "",
  ]
  writeFixture(root, "app/panel/references.md", lines.join("\n"))

  const first = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  const second = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  const owners = first.referenceOwners.filter((row) => row.fromPath === "app/panel/references.md")
  const expected = [
    [1, "images/hero.png", "app/panel/images/hero.png"],
    [2, "images/angle.png", "app/panel/images/angle.png"],
    [3, "images/nested(foo).png", "app/panel/images/nested(foo).png"],
    [5, "images/multi.png", "app/panel/images/multi.png"],
    [7, "images/quoted.png", "app/panel/images/quoted.png"],
    [8, "images/listed.png", "app/panel/images/listed.png"],
    [9, String.raw`images/paren\).png`, "app/panel/images/paren).png"],
    [10, "images/first.png", "app/panel/images/first.png"],
  ]
  assert.deepEqual(owners.map((row) => [row.line, row.column, row.targetPath]), expected.map(([line, raw, target]) => [
    line, lines[line - 1].indexOf(raw) + 1, target,
  ]))
  assert.equal(owners.some((row) => ["app/panel/images/second.png", "app/panel/images/blocked.png", "app/panel/images/broken.png"].includes(row.targetPath)), false)
  assertPrivateSerialization(first, root, [suffix, "private-reference-definition"])
})

test("round 24 CSS malformed url recovery masks the consumed construct", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/panel/adjacent.png", "adjacent")
  for (const name of [
    "noise-string.png", "noise-nested.png", "noise-comment.png",
    "noise-escaped.png", "noise-unquoted.png", "noise-eof.png",
  ]) writeFixture(root, `app/panel/${name}`, name)
  const lines = [
    `a { background: url("missing.png" "noise-string.png?private-recovery=1") url(adjacent.png) }`,
    `b { background: url("missing.png" calc("noise-nested.png?private-recovery=2")) url(adjacent.png) }`,
    `c { background: url("missing.png" /* ) */ "noise-comment.png?private-recovery=3") url(adjacent.png) }`,
    String.raw`d { background: url("missing.png" junk\) "noise-escaped.png?private-recovery=4") url(adjacent.png) }`,
    `e { background: url(missing.png"noise-unquoted.png?private-recovery=5") url(adjacent.png) }`,
    `f { background: url("missing.png" "noise-eof.png?private-recovery=6"`,
  ]
  writeFixture(root, "app/panel/recovery.css", lines.join("\n"))

  const first = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  const second = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.referenceOwners.filter((row) => row.fromPath === "app/panel/recovery.css").map((row) => [row.line, row.column, row.targetPath]), [1, 2, 3, 4, 5].map((line) => [
    line, lines[line - 1].indexOf("adjacent.png") + 1, "app/panel/adjacent.png",
  ]))
  const unresolved = first.uncertainties.unresolvedLiteralAssets.filter((row) => row.fromPath === "app/panel/recovery.css")
  assert.deepEqual(unresolved.map((row) => [row.line, row.column]), lines.map((line, index) => [
    index + 1, line.indexOf("missing.png") + 1,
  ]))
  assert.ok(unresolved.every((row) => /^[a-f0-9]{64}$/.test(row.literalSha256)))
  assert.equal(first.basenameOnlySignals.filter((row) => row.fromPath === "app/panel/recovery.css").length, 0)
  assertPrivateSerialization(first, root, ["private-recovery"])
})

test("round 24 generated-input uncertainty recognizes root and nested path segments", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  for (const path of [
    "generated.js", "generated/client.js", "lib/generated/client.js", "regenerated/client.js",
    "lib/generatedness/client.js", "generated-client.js", "lib/generated-client.js",
  ]) writeFixture(root, path, "export const fixture = true\n")

  const report = buildDeadCodeCandidateReport(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(report.uncertainties.generatedInputs.map((row) => row.path), [
    "generated.js", "generated/client.js", "lib/generated/client.js",
  ])
  assert.ok(report.uncertainties.generatedInputs.every((row) => row.reason === "generated-or-declaration-input"))
})

test("round 24 loader assignment promotion respects execution regions", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/service.ts", "export const service = true\n")
  const lines = [
    "import { createRequire } from 'node:module';",
    "let conditional;",
    "if (flag) { conditional = createRequire(import.meta.url); }",
    "conditional('../lib/service');",
    "let unbraced;",
    "if (flag) unbraced = createRequire(import.meta.url);",
    "unbraced('../lib/service');",
    "let looped;",
    "while (flag) { looped = createRequire(import.meta.url); }",
    "looped('../lib/service');",
    "let nested;",
    "function initialize() { nested = createRequire(import.meta.url); }",
    "nested('../lib/service');",
    "let repeated = createRequire(import.meta.url);",
    "repeated = createRequire(import.meta.url);",
    "repeated('../lib/service');",
    "let priorPossible;",
    "if (flag) priorPossible = createRequire(import.meta.url);",
    "priorPossible = createRequire(import.meta.url);",
    "priorPossible('../lib/service');",
    "function local() { let loader; loader = createRequire(import.meta.url); loader('../lib/service'); }",
    "",
  ]
  writeFixture(root, "scripts/loader-regions.mjs", lines.join("\n"))

  const first = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  const second = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.references.filter((row) => row.kind === "require").map((row) => row.line), [16, 20, 21])
  assert.ok(first.uncertainties.every((row) => !row.expressionSha256 || /^[a-f0-9]{64}$/.test(row.expressionSha256)))
})

test("round 24 Markdown definitions follow paragraph and container block boundaries", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  for (const name of ["heading.png", "rule.png", "quote.png", "list.png", "multi.png", "blocked.png"]) {
    writeFixture(root, `app/panel/images/${name}`, name)
  }
  const lines = [
    "# Heading",
    "[Heading]: images/heading.png",
    "---",
    "[Rule]: images/rule.png",
    "ordinary paragraph",
    "> [Quote]: images/quote.png",
    "another paragraph",
    "- [List]: images/list.png",
    "> [Multi]:",
    ">   images/multi.png",
    ">   \"title\"",
    "ordinary paragraph control",
    "[Blocked]: images/blocked.png",
    "",
  ]
  writeFixture(root, "app/panel/block-definitions.md", lines.join("\n"))

  const report = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  const owners = report.referenceOwners.filter((row) => row.fromPath === "app/panel/block-definitions.md")
  assert.deepEqual(owners.map((row) => [row.line, row.column, row.targetPath]), [
    [2, lines[1].indexOf("images/") + 1, "app/panel/images/heading.png"],
    [4, lines[3].indexOf("images/") + 1, "app/panel/images/rule.png"],
    [6, lines[5].indexOf("images/") + 1, "app/panel/images/quote.png"],
    [8, lines[7].indexOf("images/") + 1, "app/panel/images/list.png"],
    [10, lines[9].indexOf("images/") + 1, "app/panel/images/multi.png"],
  ])
  assert.equal(owners.some((row) => row.targetPath === "app/panel/images/blocked.png"), false)
})

test("round 24 loader assignments join maybe-executed provenance conservatively", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/service.ts", "export const service = true\n")
  const lines = [
    "import { createRequire } from 'node:module';",
    "let braced; if (flag) { braced = createRequire(import.meta.url); } braced('../lib/service');",
    "let unbraced; if (flag) unbraced = createRequire(import.meta.url); unbraced('../lib/service');",
    "let looped; for (const item of items) { looped = createRequire(import.meta.url); } looped('../lib/service');",
    "let nested; function initialize() { nested = createRequire(import.meta.url); } nested('../lib/service');",
    "let caught; try { operation(); } catch { caught = createRequire(import.meta.url); } caught('../lib/service');",
    "let instance; class Holder { field = (instance = createRequire(import.meta.url)); } instance('../lib/service');",
    "let repeated = createRequire(import.meta.url); repeated = createRequire(import.meta.url); repeated('../lib/service');",
    "let overwritten; if (flag) overwritten = createRequire(import.meta.url); overwritten = createRequire(import.meta.url); overwritten('../lib/service');",
    "function local() { let loader; loader = createRequire(import.meta.url); loader('../lib/service'); }",
    "",
  ]
  writeFixture(root, "scripts/loader-joins.mjs", lines.join("\n"))

  const report = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(report.references.filter((row) => row.kind === "require").map((row) => row.line), [8, 9, 10])
  const uncertain = report.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER")
  assert.deepEqual(uncertain.map((row) => row.line), [2, 3, 4, 5, 6, 7])
  assert.ok(uncertain.every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
})

test("round 24 Markdown definitions follow Setext list label and Unicode rules", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  for (const name of ["setext.png", "ordered.png", "multi-label.png", "sharp.png", "duplicate.png"]) {
    writeFixture(root, `app/panel/images/${name}`, name)
  }
  const lines = [
    "Setext heading",
    "===============",
    "[Setext]: images/setext.png",
    "ordinary paragraph",
    "2. [Ordered]: images/ordered.png",
    "",
    "[Multi",
    " line]: images/multi-label.png",
    "[Straße]: images/sharp.png",
    "[STRASSE]: images/duplicate.png",
    "",
  ]
  writeFixture(root, "app/panel/commonmark-definitions.md", lines.join("\n"))

  const report = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  const owners = report.referenceOwners.filter((row) => row.fromPath === "app/panel/commonmark-definitions.md")
  assert.deepEqual(owners.map((row) => [row.line, row.column, row.targetPath]), [
    [3, lines[2].indexOf("images/") + 1, "app/panel/images/setext.png"],
    [8, lines[7].indexOf("images/") + 1, "app/panel/images/multi-label.png"],
    [9, lines[8].indexOf("images/") + 1, "app/panel/images/sharp.png"],
  ])
  assert.equal(owners.some((row) => ["app/panel/images/ordered.png", "app/panel/images/duplicate.png"].includes(row.targetPath)), false)
})

test("round 24 loader joins optionally evaluated assignment contexts", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/service.ts", "export const service = true\n")
  const lines = [
    "import { createRequire } from 'node:module';",
    "let callArgument; receiver?.(callArgument = createRequire(import.meta.url)); callArgument('../lib/service');",
    "let elementKey; receiver?.[elementKey = createRequire(import.meta.url)]; elementKey('../lib/service');",
    "let bindingDefault; const { value = (bindingDefault = createRequire(import.meta.url)) } = source; bindingDefault('../lib/service');",
    "let assignmentDefault; ({ value = (assignmentDefault = createRequire(import.meta.url)) } = source); assignmentDefault('../lib/service');",
    "let andWrite; flag &&= (andWrite = createRequire(import.meta.url)); andWrite('../lib/service');",
    "let orWrite; flag ||= (orWrite = createRequire(import.meta.url)); orWrite('../lib/service');",
    "let nullishWrite; flag ??= (nullishWrite = createRequire(import.meta.url)); nullishWrite('../lib/service');",
    "let direct; direct = createRequire(import.meta.url); direct('../lib/service');",
    "",
  ]
  writeFixture(root, "scripts/optional-loader-joins.mjs", lines.join("\n"))

  const first = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  const second = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.references.filter((row) => row.kind === "require").map((row) => row.line), [9])
  const uncertain = first.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER")
  assert.deepEqual(uncertain.map((row) => row.line), [2, 3, 4, 5, 6, 7, 8])
  assert.ok(uncertain.every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
})

test("round 24 Markdown definitions preserve list items and complete labels", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  for (const name of ["second.png", "continued.png", "whitespace.png"]) {
    writeFixture(root, `app/panel/images/${name}`, name)
  }
  const lines = [
    "1. ordinary list paragraph",
    "2. [Second]: images/second.png",
    "",
    "> [Continued",
    "> label",
    "> tail]: images/continued.png",
    "[   ]: images/whitespace.png",
    "",
  ]
  writeFixture(root, "app/panel/continued-definitions.md", lines.join("\n"))

  const report = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  const owners = report.referenceOwners.filter((row) => row.fromPath === "app/panel/continued-definitions.md")
  assert.deepEqual(owners.map((row) => [row.line, row.column, row.targetPath]), [
    [2, lines[1].indexOf("images/") + 1, "app/panel/images/second.png"],
    [6, lines[5].indexOf("images/") + 1, "app/panel/images/continued.png"],
  ])
  assert.equal(owners.some((row) => row.targetPath === "app/panel/images/whitespace.png"), false)
})

test("round 24 loader joins optional chains and renamed assignment defaults", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/service.ts", "export const service = true\n")
  const lines = [
    "import { createRequire } from 'node:module';",
    "let methodArgument; receiver?.method(methodArgument = createRequire(import.meta.url)); methodArgument('../lib/service');",
    "let elementMethod; receiver?.[method](elementMethod = createRequire(import.meta.url)); elementMethod('../lib/service');",
    "let renamed; ({ value: target = (renamed = createRequire(import.meta.url)) } = source); renamed('../lib/service');",
    "let arrayDefault; [target = (arrayDefault = createRequire(import.meta.url))] = source; arrayDefault('../lib/service');",
    "let direct; direct = createRequire(import.meta.url); direct('../lib/service');",
    "",
  ]
  writeFixture(root, "scripts/optional-chain-loader-joins.mjs", lines.join("\n"))

  const report = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(report.references.filter((row) => row.kind === "require").map((row) => row.line), [6])
  const uncertain = report.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER")
  assert.deepEqual(uncertain.map((row) => row.line), [2, 3, 4, 5])
  assert.ok(uncertain.every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
})

test("round 24 Markdown definitions decode entities and multiline titles exactly", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  for (const name of ["a&b.png", "numeric.png", "nbsp.png", "title.png", "leading.png"]) {
    writeFixture(root, `app/panel/images/${name}`, name)
  }
  const nbsp = "\u00a0"
  const suffix = "?private-markdown-entity=1"
  const lines = [
    `[Named]: images/a&amp;b.png${suffix}`,
    `[Numeric]: images&#x2f;numeric.png${suffix}`,
    `[${nbsp}]: images/nbsp.png${suffix}`,
    `[Title]: images/title.png${suffix} \"first line`,
    `second line\"`,
    "ordinary paragraph",
    `01. [Leading]: images/leading.png${suffix}`,
    "",
  ]
  writeFixture(root, "app/panel/entity-definitions.md", lines.join("\n"))

  const first = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  const second = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  const owners = first.referenceOwners.filter((row) => row.fromPath === "app/panel/entity-definitions.md")
  assert.deepEqual(owners.map((row) => [row.line, row.column, row.targetPath]), [
    [1, lines[0].indexOf("images/") + 1, "app/panel/images/a&b.png"],
    [2, lines[1].indexOf("images") + 1, "app/panel/images/numeric.png"],
    [3, lines[2].indexOf("images/") + 1, "app/panel/images/nbsp.png"],
    [4, lines[3].indexOf("images/") + 1, "app/panel/images/title.png"],
    [7, lines[6].indexOf("images/") + 1, "app/panel/images/leading.png"],
  ])
  assertPrivateSerialization(first, root, [suffix, "private-markdown-entity"])
})

test("round 24 loader joins nested assignment-pattern defaults", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/service.ts", "export const service = true\n")
  const lines = [
    "import { createRequire } from 'node:module';",
    "let nestedArray; [[target = (nestedArray = createRequire(import.meta.url))]] = source; nestedArray('../lib/service');",
    "let objectInArray; [{ value: target = (objectInArray = createRequire(import.meta.url)) }] = source; objectInArray('../lib/service');",
    "let direct; direct = createRequire(import.meta.url); direct('../lib/service');",
    "",
  ]
  writeFixture(root, "scripts/nested-loader-defaults.mjs", lines.join("\n"))

  const report = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(report.references.filter((row) => row.kind === "require").map((row) => row.line), [4])
  const uncertain = report.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER")
  assert.deepEqual(uncertain.map((row) => row.line), [2, 3])
  assert.ok(uncertain.every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
})

test("round 24 Markdown labels decode entities and require real Setext context", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  for (const name of ["first.png", "duplicate.png", "orphan.png", "closed.png"]) {
    writeFixture(root, `app/panel/images/${name}`, name)
  }
  const lines = [
    "[A&amp;B]: images/first.png",
    "[A&B]: images/duplicate.png",
    "",
    "===",
    "[Orphan]: images/orphan.png",
    "",
    "Setext paragraph",
    "===",
    "[Closed]: images/closed.png",
    "",
  ]
  writeFixture(root, "app/panel/label-entities.md", lines.join("\n"))

  const report = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  const owners = report.referenceOwners.filter((row) => row.fromPath === "app/panel/label-entities.md")
  assert.deepEqual(owners.map((row) => [row.line, row.column, row.targetPath]), [
    [1, lines[0].indexOf("images/") + 1, "app/panel/images/first.png"],
    [9, lines[8].indexOf("images/") + 1, "app/panel/images/closed.png"],
  ])
  assert.equal(owners.some((row) => ["app/panel/images/duplicate.png", "app/panel/images/orphan.png"].includes(row.targetPath)), false)
})

test("round 24 loader assignment promotion respects binding state and try execution", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/service.ts", "export const service = true\n")
  writeFixture(root, "lib/imported.js", "export default null\n")
  const lines = [
    "import { createRequire } from 'node:module';",
    "import imported from '../lib/imported.js';",
    "let tried; try { mightThrow(); tried = createRequire(import.meta.url); } catch {} tried('../lib/service');",
    "beforeLet = createRequire(import.meta.url); let beforeLet; beforeLet('../lib/service');",
    "const fixed = createRequire(import.meta.url); fixed = createRequire(import.meta.url); fixed('../lib/service');",
    "imported = createRequire(import.meta.url); imported('../lib/service');",
    "let branch = createRequire(import.meta.url); if (flag) branch = createRequire(import.meta.url); branch('../lib/service');",
    "let validLet; validLet = createRequire(import.meta.url); validLet('../lib/service');",
    "var validVar; validVar = createRequire(import.meta.url); validVar('../lib/service');",
    "function local(parameter) { parameter = createRequire(import.meta.url); parameter('../lib/service'); }",
    "",
  ]
  writeFixture(root, "scripts/loader-binding-state.mjs", lines.join("\n"))

  const report = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(report.references.filter((row) => row.kind === "require").map((row) => row.line), [7, 8, 9, 10])
  const uncertain = report.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER")
  assert.deepEqual(uncertain.map((row) => row.line), [3, 4, 5, 6])
  assert.ok(uncertain.every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
})

test("round 24 environment in-operator follows expression result provenance", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const privateKey = "selectPrivateKey()"
  const lines = [
    "let environment = process.env;",
    "'ASSIGN' in (environment = process.env);",
    "'COMMA' in (sideEffect(), process.env);",
    "'ALL' in (flag ? process.env : environment);",
    "'LOGICAL' in (process.env || environment);",
    "('PAREN') in process.env;",
    "123 in process.env;",
    "'MIXED' in (flag ? process.env : {});",
    `${privateKey} in (flag ? process.env : {});`,
    "((environment = {}), 'LEFT_MUTATION') in environment;",
    "'RHS_MUTATION' in (environment = flag ? process.env : {});",
    "",
  ]
  writeFixture(root, "app/environment-in-results.ts", lines.join("\n"))

  const first = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  const second = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.reads.filter((row) => row.kind === "in-operator").map((row) => row.name), [
    "ASSIGN", "COMMA", "ALL", "LOGICAL", "PAREN", "123",
  ])
  const computed = first.uncertainties.filter((row) => row.kind === "in-operator" && row.code === "COMPUTED_ENVIRONMENT_READ")
  assert.deepEqual(computed.map((row) => row.line), [8, 9, 11])
  assert.ok(computed.every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
  assert.deepEqual(first.uncertainties.filter((row) => row.kind === "in-operator" && row.code === "UNPROVEN_ENVIRONMENT_ALIAS").map((row) => row.name), ["LEFT_MUTATION"])
  assertPrivateSerialization(first, root, [privateKey])
})

test("round 24 Markdown definitions enforce ASCII block and title grammar", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  for (const name of ["unicode-indent.png", "unicode-trailing.png", "nested-title.png", "raw-html.png", "after-empty.png", "tab-list.png"]) {
    writeFixture(root, `app/panel/images/${name}`, name)
  }
  const nbsp = "\u00a0"
  const lines = [
    `${nbsp}[Indent]: images/unicode-indent.png`,
    `[Trailing]: images/unicode-trailing.png${nbsp}\"title\"`,
    `[Nested]: images/nested-title.png (outer(inner)`,
    "<script>",
    "",
    "[Raw]: images/raw-html.png",
    "</script>",
    "[Empty]: <>",
    "[After]: images/after-empty.png",
    "- [Tab]:",
    "\timages/tab-list.png",
    "",
  ]
  writeFixture(root, "app/panel/markdown-quality.md", lines.join("\n"))

  const report = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  const owners = report.referenceOwners.filter((row) => row.fromPath === "app/panel/markdown-quality.md")
  assert.deepEqual(owners.map((row) => [row.line, row.column, row.targetPath]), [
    [9, lines[8].indexOf("images/") + 1, "app/panel/images/after-empty.png"],
    [11, lines[10].indexOf("images/") + 1, "app/panel/images/tab-list.png"],
  ])
})

test("round 24 CSS recovery preserves adjacent URLs across comments and bad strings", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/panel/adjacent.png", "adjacent")
  const lines = [
    "a { background: url(missing.png/*) url(adjacent.png) }",
    "b { background: url(\"missing.png\" \"unterminated",
    ") url(adjacent.png) }",
    "c { background: url(\"missing.png\" \"continued\\",
    "string\") url(adjacent.png) }",
  ]
  writeFixture(root, "app/panel/css-quality.css", lines.join("\n"))

  const first = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  const second = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.referenceOwners.filter((row) => row.fromPath === "app/panel/css-quality.css").map((row) => [row.line, row.column]), [
    [1, lines[0].indexOf("adjacent.png") + 1],
    [3, lines[2].indexOf("adjacent.png") + 1],
    [5, lines[4].indexOf("adjacent.png") + 1],
  ])
})

test("round 24 loader assignment legality includes loop declarations and import-equals", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/service.ts", "export const service = true\n")
  writeFixture(root, "lib/other.ts", "export const other = true\n")
  const lines = [
    "import { createRequire } from 'node:module';",
    "import imported = require('../lib/other');",
    "imported = createRequire(import.meta.url); imported('../lib/service');",
    "for (const fixed = other; fixed = createRequire(import.meta.url);) { fixed('../lib/service'); break; }",
    "for (let mutable = other; mutable = createRequire(import.meta.url);) { mutable('../lib/service'); break; }",
    "",
  ]
  writeFixture(root, "scripts/loader-legality.ts", lines.join("\n"))

  const report = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(report.references.filter((row) => row.kind === "require").map((row) => row.line), [5])
  assert.deepEqual(report.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER").map((row) => row.line), [3, 4])
})

test("round 24 environment in-operator snapshots mutually exclusive branch provenance", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const lines = [
    "let environment = {};",
    "'LEFT_MUTATES' in (flag ? (environment = process.env) : environment);",
    "environment = {};",
    "'RIGHT_MUTATES' in (flag ? environment : (environment = process.env));",
    "environment = process.env;",
    "'ALL_PROVEN' in (flag ? process.env : environment);",
    "",
  ]
  writeFixture(root, "app/environment-in-branches.ts", lines.join("\n"))

  const first = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  const second = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.reads.filter((row) => row.kind === "in-operator").map((row) => row.name), ["ALL_PROVEN"])
  const uncertain = first.uncertainties.filter((row) => row.kind === "in-operator" && row.code === "COMPUTED_ENVIRONMENT_READ")
  assert.deepEqual(uncertain.map((row) => row.line), [2, 4])
  assert.ok(uncertain.every((row) => /^[a-f0-9]{64}$/.test(row.expressionSha256)))
})

test("round 24 Markdown definitions track HTML blocks list continuity and optional titles", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  for (const name of ["same-line.png", "malformed.png", "processing.png", "listed.png", "destination.png"]) {
    writeFixture(root, `app/panel/images/${name}`, name)
  }
  const lines = [
    "<script></script>",
    "[Same]: images/same-line.png",
    "<script>",
    "</scriptx>",
    "[Malformed]: images/malformed.png",
    "</script>",
    "<?processing",
    "",
    "[Processing]: images/processing.png",
    "?>",
    "- list item",
    "",
    "  [Listed]: images/listed.png",
    "[Destination]: images/destination.png",
    "(invalid(nested)",
    "",
  ]
  writeFixture(root, "app/panel/markdown-block-quality.md", lines.join("\n"))

  const report = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  const owners = report.referenceOwners.filter((row) => row.fromPath === "app/panel/markdown-block-quality.md")
  assert.deepEqual(owners.map((row) => [row.line, row.column, row.targetPath]), [
    [2, lines[1].indexOf("images/") + 1, "app/panel/images/same-line.png"],
    [13, lines[12].indexOf("images/") + 1, "app/panel/images/listed.png"],
    [14, lines[13].indexOf("images/") + 1, "app/panel/images/destination.png"],
  ])
})

test("round 24 loader loop assignments distinguish iteration-local and escaping state", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/service.ts", "export const service = true\n")
  const lines = [
    "import { createRequire } from 'node:module';",
    "for (let loader of items) { loader = createRequire(import.meta.url); loader('../lib/service'); }",
    "let outer; for (outer of items) { outer = createRequire(import.meta.url); outer('../lib/service'); } outer('../lib/service');",
    "using resource = other; resource = createRequire(import.meta.url); resource('../lib/service');",
    "",
  ]
  writeFixture(root, "scripts/loader-loop-state.ts", lines.join("\n"))

  const report = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  // A call after the assignment in the same iteration is exact; the post-loop path remains possible.
  assert.deepEqual(report.references.filter((row) => row.kind === "require").map((row) => row.line), [2, 3])
  assert.deepEqual(report.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER").map((row) => row.line), [3, 4])
})

test("round 24 environment in-operator captures operands at evaluation time", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const lines = [
    "let environment = {};",
    "'LOGICAL' in ((environment = process.env) && environment);",
    "environment = {};",
    "'CONDITIONAL' in ((environment = process.env) ? environment : process.env);",
    "environment = {};",
    "'MIXED' in (flag ? (environment = process.env) : environment);",
    "",
  ]
  writeFixture(root, "app/environment-in-evaluation.ts", lines.join("\n"))

  const report = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(report.reads.filter((row) => row.kind === "in-operator").map((row) => row.name), ["LOGICAL", "CONDITIONAL"])
  assert.deepEqual(report.uncertainties.filter((row) => row.kind === "in-operator" && row.code === "COMPUTED_ENVIRONMENT_READ").map((row) => row.line), [6])
})

test("round 24 Markdown containers retain lists and bound raw HTML state", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  for (const name of ["spaced.png", "tabbed.png", "after-quote.png"]) writeFixture(root, `app/panel/images/${name}`, name)
  const lines = [
    "- item",
    "",
    "    [Spaced]: images/spaced.png",
    "- item",
    "",
    "\t[Tabbed]: images/tabbed.png",
    "> <script>",
    "[After]: images/after-quote.png",
    "",
  ]
  writeFixture(root, "app/panel/markdown-container-state.md", lines.join("\n"))

  const report = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(report.referenceOwners.filter((row) => row.fromPath === "app/panel/markdown-container-state.md").map((row) => [row.line, row.column, row.targetPath]), [
    [3, lines[2].indexOf("images/") + 1, "app/panel/images/spaced.png"],
    [6, lines[5].indexOf("images/") + 1, "app/panel/images/tabbed.png"],
    [8, lines[7].indexOf("images/") + 1, "app/panel/images/after-quote.png"],
  ])
})

test("round 24 loop-local loaders still join conditional assignments", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/service.ts", "export const service = true\n")
  const lines = [
    "import { createRequire } from 'node:module';",
    "for (let direct of items) { direct = createRequire(import.meta.url); direct('../lib/service'); }",
    "for (let conditional of items) { if (flag) conditional = createRequire(import.meta.url); conditional('../lib/service'); }",
    "for (let logical of items) { flag && (logical = createRequire(import.meta.url)); logical('../lib/service'); }",
    "for (let optional of items) { receiver?.(optional = createRequire(import.meta.url)); optional('../lib/service'); }",
    "",
  ]
  writeFixture(root, "scripts/loader-loop-conditions.mjs", lines.join("\n"))

  const report = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(report.references.filter((row) => row.kind === "require").map((row) => row.line), [2])
  assert.deepEqual(report.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER").map((row) => row.line), [3, 4, 5])
})

test("round 24 environment result branches merge continuing alias state", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const lines = [
    "let environment = {};",
    "'BRANCH' in (flag ? (environment = process.env) : (environment = process.env));",
    "'AFTER_BRANCH' in environment;",
    "environment = {};",
    "'LOGICAL' in (flag && (environment = process.env));",
    "'AFTER_LOGICAL' in environment;",
    "",
  ]
  writeFixture(root, "app/environment-in-continuation.ts", lines.join("\n"))

  const report = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(report.reads.filter((row) => row.kind === "in-operator").map((row) => row.name), ["BRANCH", "AFTER_BRANCH"])
  assert.deepEqual(report.uncertainties.filter((row) => row.kind === "in-operator" && row.code === "COMPUTED_ENVIRONMENT_READ").map((row) => row.line), [5])
  assert.deepEqual(report.uncertainties.filter((row) => row.kind === "in-operator" && row.code === "UNPROVEN_ENVIRONMENT_ALIAS").map((row) => row.name), ["AFTER_LOGICAL"])
})

test("round 24 Markdown list definitions follow lazy and visual indentation rules", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  for (const name of ["lazy.png", "tabs.png", "paragraph.png"]) writeFixture(root, `app/panel/images/${name}`, name)
  const lines = [
    "- [Lazy]:",
    "images/lazy.png",
    "-\t\t[Tabs]:",
    "   images/tabs.png",
    "paragraph",
    "2. not a list",
    "    [Paragraph]: images/paragraph.png",
    "",
  ]
  writeFixture(root, "app/panel/markdown-list-rules.md", lines.join("\n"))

  const report = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  const owners = report.referenceOwners.filter((row) => row.fromPath === "app/panel/markdown-list-rules.md")
  assert.deepEqual(owners.map((row) => [row.line, row.column, row.targetPath]), [
    [2, lines[1].indexOf("images/") + 1, "app/panel/images/lazy.png"],
  ])
})

test("round 24 environment preserves possible process objects after joins", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const lines = [
    "let runtimeProcess = process;",
    "'MIXED' in (flag ? (runtimeProcess = process) : (runtimeProcess = {}));",
    "runtimeProcess.env.AFTER_MIXED;",
    "",
  ]
  writeFixture(root, "app/environment-possible-process.ts", lines.join("\n"))

  const report = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.equal(report.reads.some((row) => row.name === "AFTER_MIXED"), false)
  const uncertain = report.uncertainties.filter((row) => row.name === "AFTER_MIXED")
  assert.equal(uncertain.length, 1)
  assert.equal(uncertain[0].code, "UNPROVEN_ENVIRONMENT_ALIAS")
})

test("round 24 Markdown lazy definitions respect quote and paragraph ownership", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  for (const name of ["quoted-lazy.png", "paragraph-list.png"]) writeFixture(root, `app/panel/images/${name}`, name)
  const lines = [
    "> [Quoted]:",
    "images/quoted-lazy.png",
    "- item",
    "  [Blocked]:",
    "images/paragraph-list.png",
    "",
  ]
  writeFixture(root, "app/panel/markdown-lazy-ownership.md", lines.join("\n"))

  const report = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(report.referenceOwners.filter((row) => row.fromPath === "app/panel/markdown-lazy-ownership.md").map((row) => [row.line, row.column, row.targetPath]), [
    [2, 1, "app/panel/images/quoted-lazy.png"],
  ])
})

test("round 24 in-operator joins discarded conditional and logical side effects", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const lines = [
    "let environment = process.env;",
    "'CONDITION' in ((flag ? (environment = {}) : (environment = process.env)), process.env);",
    "environment.AFTER_CONDITION;",
    "let runtimeProcess = process;",
    "'LOGICAL' in ((flag && (runtimeProcess = {})), process.env);",
    "runtimeProcess.env.AFTER_LOGICAL;",
    "",
  ]
  writeFixture(root, "app/environment-in-discarded.ts", lines.join("\n"))

  const report = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(report.reads.filter((row) => row.kind === "in-operator").map((row) => row.name), ["CONDITION", "LOGICAL"])
  assert.deepEqual(report.uncertainties.filter((row) => ["AFTER_CONDITION", "AFTER_LOGICAL"].includes(row.name)).map((row) => row.name), ["AFTER_CONDITION", "AFTER_LOGICAL"])
})

test("round 24 Markdown lazy continuation rejects incompatible container stacks", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  for (const name of ["nested.png", "quote.png", "list.png"]) writeFixture(root, `app/panel/images/${name}`, name)
  const lines = [
    "> - [Nested]:",
    "> > images/nested.png",
    "",
    "> [Quote]:",
    "images/quote.png",
    "- [List]:",
    "images/list.png",
    "",
  ]
  writeFixture(root, "app/panel/markdown-lazy-containers.md", lines.join("\n"))

  const report = buildAssetCandidateReport(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(report.referenceOwners.filter((row) => row.fromPath === "app/panel/markdown-lazy-containers.md").map((row) => row.targetPath), [
    "app/panel/images/quote.png", "app/panel/images/list.png",
  ])
})

test("round 24 in-operator joins conditional and logical left-side mutations", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  const lines = [
    "let environment = process.env;",
    "((flag ? (environment = {}) : (environment = process.env)), 'CONDITIONAL_LEFT') in environment;",
    "let runtimeProcess = process;",
    "((flag && (runtimeProcess = {})), 'LOGICAL_LEFT') in runtimeProcess.env;",
    "",
  ]
  writeFixture(root, "app/environment-in-left-effects.ts", lines.join("\n"))

  const first = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  const second = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.equal(first.reads.some((row) => ["CONDITIONAL_LEFT", "LOGICAL_LEFT"].includes(row.name)), false)
  assert.deepEqual(first.uncertainties.filter((row) => row.kind === "in-operator").map((row) => row.name), ["CONDITIONAL_LEFT", "LOGICAL_LEFT"])
})

test("round 25 finally evidence joins completion states before classifying reads", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/environment-finally-outcomes.ts", [
    "function mixed(flag) { let environment = process.env; try { if (flag) throw failure; environment = {}; } finally { void environment.FINALLY_JOIN; } }",
    "function exact(flag) { let environment = {}; try { if (flag) throw failure; environment = process.env; } catch { environment = process.env; } finally { void environment.FINALLY_EXACT; } }",
    "let isolated = {}; try { function deferred() { mightThrow(); return; } isolated = process.env; void deferred; } catch {} isolated.DEFERRED_ISOLATION;",
    "void mixed; void exact;",
    "",
  ].join("\n"))
  const first = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  const second = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(first, second)
  assert.deepEqual(first.reads.map((row) => row.name), ["FINALLY_EXACT", "DEFERRED_ISOLATION"])
  assert.deepEqual(first.uncertainties.filter((row) => row.code === "UNPROVEN_ENVIRONMENT_ALIAS").map((row) => row.name), ["FINALLY_JOIN"])
})

test("round 25 logical expression results retain operator-aware environment values", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/environment-logical-results.ts", [
    "const environment = process.env;",
    "const orResult = environment || {}; orResult.OR_RESULT;",
    "const nullishResult = environment ?? {}; nullishResult.NULLISH_RESULT;",
    "const andResult = environment && {}; andResult.AND_RESULT;",
    "const maybe = flag ? environment : {}; const joined = maybe || environment; joined.JOINED_RESULT;",
    "",
  ].join("\n"))
  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.reads.map((row) => row.name), ["OR_RESULT", "NULLISH_RESULT"])
  assert.deepEqual(evidence.uncertainties.filter((row) => row.code === "UNPROVEN_ENVIRONMENT_ALIAS").map((row) => row.name), ["JOINED_RESULT"])
})

test("round 25 module flow routes switch labels infinite loops and finally joins", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/service.ts", "export const service = true\n")
  writeFixture(root, "scripts/module-flow-matrix.mjs", [
    "import { createRequire } from 'node:module';",
    "const source = createRequire(import.meta.url);",
    "let switched; switch (flag) { case 0: switched = createRequire(import.meta.url); break; default: switched = createRequire(import.meta.url); break; } switched('../lib/service');",
    "let labeled; block: { labeled = createRequire(import.meta.url); break block; } labeled('../lib/service');",
    "let mixed = createRequire(import.meta.url); try { if (flag) throw failure; mixed = other; } finally { mixed('../lib/service'); }",
    "let before; try { before = source; mightThrow(); } catch {} before('../lib/service');",
    "let after; try { mightThrow(); after = source; } catch {} after('../lib/service');",
    "let isolated; try { function deferred() { mightThrow(); return; } isolated = source; void deferred; } catch {} isolated('../lib/service');",
    "let unreachable; while (true) {} unreachable('../lib/service');",
    "",
  ].join("\n"))
  const report = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(report.references.filter((row) => row.kind === "require").map((row) => row.line), [3, 4, 6, 8])
  assert.deepEqual(report.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER").map((row) => row.line), [5, 7])
})

test("round 25 immediate callee flow separates skipped noncallable and executed paths", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/environment-callee-matrix.ts", [
    "let optional = {}; (flag ? (optional = process.env, () => {}) : null)?.(); optional.OPTIONAL_JOIN;",
    "let abrupt = {}; (flag ? (abrupt = process.env, () => {}) : 0)(); abrupt.NONCALLABLE_DROPPED;",
    "let sideEffect = {}; (sideEffect = process.env, () => {})(); sideEffect.CALLEE_EFFECT;",
    "let assigned = {}, fn; (fn = () => { assigned = process.env; })(); assigned.ASSIGN_CALLEE;",
    "let logical = {}, maybe; (maybe ||= () => { logical = process.env; })(); logical.LOGICAL_CALLEE;",
    "let unknown = {}; receiver?.(unknown = process.env); unknown.OPTIONAL_UNKNOWN;",
    "let argument = {}; (null)?.(argument = process.env); argument.SKIPPED_ARGUMENT;",
    "let returned = {}; (() => { returned = process.env; return; })(); returned.AFTER_RETURN;",
    "let thrown = {}; (() => { thrown = process.env; throw failure; })(); thrown.AFTER_THROW;",
    "",
  ].join("\n"))
  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.reads.map((row) => row.name), ["NONCALLABLE_DROPPED", "CALLEE_EFFECT", "ASSIGN_CALLEE", "AFTER_RETURN"])
  assert.deepEqual(evidence.uncertainties.filter((row) => row.code === "UNPROVEN_ENVIRONMENT_ALIAS").map((row) => row.name), ["OPTIONAL_JOIN", "LOGICAL_CALLEE", "OPTIONAL_UNKNOWN"])
})

test("round 25 immediate call throws retain callee argument and body state", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/environment-call-throws.ts", [
    "let argument = {}; try { (0)(argument = process.env); } catch {} argument.NONCALLABLE_ARGUMENT;",
    "let callee = {}; try { (flag ? (callee = process.env, 0) : (callee = process.env, false))(); } catch {} callee.NONCALLABLE_CALLEE;",
    "let body = {}; try { (() => { body = process.env; throw failure; })(); } catch {} body.IIFE_BODY_THROW;",
    "let deferred = {}; function later() { deferred = process.env; throw failure; } deferred.DEFERRED_ISOLATED; void later;",
    "",
  ].join("\n"))
  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.reads.map((row) => row.name), [
    "NONCALLABLE_ARGUMENT", "NONCALLABLE_CALLEE", "IIFE_BODY_THROW",
  ])
  assert.equal(evidence.uncertainties.some((row) => row.name === "DEFERRED_ISOLATED"), false)
})

test("round 25 logical environment assignment samples RHS provenance after effects", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/environment-logical-rhs-order.ts", [
    "let cleared = process.env; cleared &&= (cleared = {}, cleared); cleared.CLEARED_BY_RHS;",
    "let established = process.env; established &&= (established = {}, established = process.env, established); established.ESTABLISHED_BY_RHS;",
    "",
  ].join("\n"))
  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.reads.map((row) => row.name), ["ESTABLISHED_BY_RHS"])
  assert.deepEqual(evidence.uncertainties.filter((row) =>
    row.code === "UNPROVEN_ENVIRONMENT_ALIAS" && row.name !== null).map((row) => row.name), ["CLEARED_BY_RHS"])
})

test("round 25 module logical assignment samples RHS independently of inner target writes", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/service.ts", "export const service = true\n")
  writeFixture(root, "scripts/module-logical-rhs-order.mjs", [
    "import { createRequire } from 'node:module';",
    "const source = createRequire(import.meta.url);",
    "let loader = source; (loader &&= (loader = other, source))('../lib/service');",
    "let skipped = source; (skipped ||= (skipped = other, source))('../lib/service');",
    "",
  ].join("\n"))
  const report = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(report.references.filter((row) => row.kind === "require").map((row) => row.line), [3, 4])
  assert.deepEqual(report.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER"), [])
})

test("round 25 generic member-call throws preserve pre-argument state", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/environment-call-timing.ts", [
    "let early = {}; try { null.method(early = process.env); } catch {} early.MEMBER_EARLY;",
    "let direct = {}; try { (0)(direct = process.env); } catch {} direct.DIRECT_AFTER_ARGUMENT;",
    "",
  ].join("\n"))
  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.reads.map((row) => row.name), ["DIRECT_AFTER_ARGUMENT"])
  assert.deepEqual(evidence.uncertainties.filter((row) =>
    row.code === "UNPROVEN_ENVIRONMENT_ALIAS" && row.name !== null).map((row) => row.name), ["MEMBER_EARLY"])
})

test("round 25 call and apply retain receiver property-access timing", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/environment-wrapper-call-timing.ts", [
    "const fn = () => {};",
    "let called = {}; try { (flag ? fn : null).call(null, called = process.env); } catch {} called.CALL_ARGUMENT;",
    "let applied = {}; try { (flag ? fn : null).apply(null, (applied = process.env, [])); } catch {} applied.APPLY_ARGUMENT;",
    "let exact = {}; fn.call(null, exact = process.env); exact.EXACT_CALL_ARGUMENT;",
    "",
  ].join("\n"))
  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.reads.map((row) => row.name), ["EXACT_CALL_ARGUMENT"])
  assert.deepEqual(evidence.uncertainties.filter((row) =>
    row.code === "UNPROVEN_ENVIRONMENT_ALIAS" && row.name !== null).map((row) => row.name), ["CALL_ARGUMENT", "APPLY_ARGUMENT"])
})

test("round 25 generic calls preserve TDZ callee entry-state failures", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/environment-generic-call-entry.ts", [
    "let tdzValue = {}; try { later(tdzValue = process.env); let later = () => {}; } catch {} tdzValue.TDZ_CALLEE;",
    "let direct = {}; try { (0)(direct = process.env); } catch {} direct.DIRECT_NONCALLABLE;",
    "",
  ].join("\n"))
  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.reads.map((row) => row.name), ["DIRECT_NONCALLABLE"])
  assert.equal(evidence.uncertainties.some((row) => row.name === "TDZ_CALLEE"), false)
})

test("round 25 generic calls preserve undeclared callee entry-state failures", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/environment-missing-callee.ts",
    "let value = {}; try { missing(value = process.env); } catch {} value.MISSING_CALLEE;\n")
  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.reads, [])
  assert.deepEqual(evidence.uncertainties.filter((row) =>
    row.code === "UNPROVEN_ENVIRONMENT_ALIAS" && row.name !== null).map((row) => row.name), ["MISSING_CALLEE"])
})

test("round 25 consecutive labels share the same loop target", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/service.ts", "export const service = true\n")
  writeFixture(root, "scripts/labeled-loader.mjs", [
    "import { createRequire } from 'node:module';",
    "let loader; outer: inner: for (; flag; loader('../lib/service')) { loader = createRequire(import.meta.url); continue outer; }",
    "",
  ].join("\n"))
  const report = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(report.references.filter((row) => row.kind === "require").map((row) => row.line), [2])
})

test("round 25 immediate callees keep branch bodies correlated", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/environment-callee-correlation.ts", [
    "let value = {}; (flag ? (value = process.env, () => {}) : (() => { value = process.env; }))(); value.CORRELATED;",
    "",
  ].join("\n"))
  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.reads.map((row) => row.name), ["CORRELATED"])
  assert.equal(evidence.uncertainties.some((row) => row.name === "CORRELATED"), false)
})

test("round 25 abrupt call arguments stop later argument evaluation", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/environment-abrupt-arguments.ts", [
    "const fn = () => {}; let value = {}; try { fn((() => { throw failure; })(), value = process.env); } catch {} value.AFTER_ARGUMENT_THROW;",
    "",
  ].join("\n"))
  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.reads, [])
  assert.equal(evidence.uncertainties.some((row) => row.name === "AFTER_ARGUMENT_THROW"), false)
})

test("round 25 optional undefined respects global parameter and TDZ bindings", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/environment-optional-undefined.ts", [
    "let globalValue = {}; undefined?.(globalValue = process.env); globalValue.GLOBAL_SKIPPED;",
    "let tdzValue = {}; try { undefined?.(tdzValue = process.env); let undefined; } catch {} tdzValue.TDZ_SKIPPED;",
    "function parameter(undefined) { let value = {}; undefined?.(value = process.env); value.PARAMETER_POSSIBLE; }",
    "void parameter;",
    "",
  ].join("\n"))
  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.reads, [])
  assert.deepEqual(evidence.uncertainties.filter((row) =>
    row.code === "UNPROVEN_ENVIRONMENT_ALIAS" && row.name !== null).map((row) => row.name), ["PARAMETER_POSSIBLE"])
})

test("round 25 implicit process survives a missing branch binding", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/environment-implicit-process-join.ts", [
    "if (flag) process = {}; const { env: config } = process; config.AFTER_PROCESS_BRANCH;",
    "",
  ].join("\n"))
  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.reads, [])
  assert.deepEqual(evidence.uncertainties.filter((row) =>
    row.code === "UNPROVEN_ENVIRONMENT_ALIAS").map((row) => row.name), ["AFTER_PROCESS_BRANCH"])
})

test("round 25 generic call checkpoints preserve initialized parameter arguments", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/environment-parameter-call.ts", [
    "function invoke(callback) { let value = {}; try { callback(value = process.env); } catch {} value.INITIALIZED_PARAMETER; }",
    "void invoke;",
    "",
  ].join("\n"))
  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.reads.map((row) => row.name), ["INITIALIZED_PARAMETER"])
  assert.equal(evidence.uncertainties.some((row) => row.name === "INITIALIZED_PARAMETER"), false)
})

test("round 25 finally executes each incoming completion before joining", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/environment-finally-paths.ts", [
    "let source = {}; try { if (flag) { source = process.env; throw failure; } source = process.env; } finally { source.FINALLY_PER_PATH; }",
    "",
  ].join("\n"))
  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.reads.map((row) => row.name), ["FINALLY_PER_PATH"])
  assert.equal(evidence.uncertainties.some((row) => row.name === "FINALLY_PER_PATH"), false)
})

test("round 25 module generic calls retain post-argument loader state", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/service.ts", "export const service = true\n")
  writeFixture(root, "scripts/module-generic-call.mjs", [
    "import { createRequire } from 'node:module';",
    "const exact = createRequire(import.meta.url);",
    "function invoke(unknown) { let loader; try { unknown(loader = exact); } catch {} loader('../lib/service'); }",
    "void invoke;",
    "",
  ].join("\n"))
  const report = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(report.references.filter((row) => row.kind === "require").map((row) => row.line), [3])
  assert.deepEqual(report.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER"), [])
})

test("round 25 module generic calls do not invent successful-argument throws", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/service.ts", "export const service = true\n")
  writeFixture(root, "scripts/module-generic-argument.mjs", [
    "import { createRequire } from 'node:module';",
    "const exact = createRequire(import.meta.url);",
    "function invoke(unknown) { let loader; try { unknown(0, loader = exact); } catch {} loader('../lib/service'); }",
    "void invoke;",
    "",
  ].join("\n"))
  const report = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(report.references.filter((row) => row.kind === "require").map((row) => row.line), [3])
  assert.deepEqual(report.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER"), [])
})

test("round 25 environment generic calls do not invent successful-argument throws", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/environment-generic-argument.ts", [
    "function invoke(unknown) { let value = {}; try { unknown(0, value = process.env); } catch {} value.AFTER_ARGUMENTS; }",
    "void invoke;",
    "",
  ].join("\n"))
  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.reads.map((row) => row.name), ["AFTER_ARGUMENTS"])
  assert.equal(evidence.uncertainties.some((row) => row.name === "AFTER_ARGUMENTS"), false)
})

test("round 25 nested TDZ arguments stop later module arguments", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/service.ts", "export const service = true\n")
  writeFixture(root, "scripts/module-nested-argument.mjs", [
    "import { createRequire } from 'node:module';",
    "const exact = createRequire(import.meta.url);",
    "function invoke(unknown) { let loader; try { unknown((later, 0), loader = exact); let later; } catch {} loader('../lib/service'); }",
    "void invoke;",
    "",
  ].join("\n"))
  const report = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(report.references.filter((row) => row.kind === "require"), [])
  assert.deepEqual(report.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER"), [])
})

test("round 25 nested TDZ arguments stop later environment arguments", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/environment-nested-argument.ts", [
    "function invoke(unknown) { let value = {}; try { unknown((later, 0), value = process.env); let later; } catch {} value.AFTER_TDZ; }",
    "void invoke;",
    "",
  ].join("\n"))
  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.reads, [])
  assert.equal(evidence.uncertainties.some((row) => row.name === "AFTER_TDZ"), false)
})

test("round 25 immediate calls stop after nested TDZ arguments", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/environment-immediate-nested-argument.ts", [
    "let value = {}; try { (() => {})((later, 0), value = process.env); } catch {} value.AFTER_IMMEDIATE_TDZ; let later;",
    "",
  ].join("\n"))
  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.reads, [])
  assert.equal(evidence.uncertainties.some((row) => row.name === "AFTER_IMMEDIATE_TDZ"), false)
})

test("round 25 nested argument failures route module state at the detected expression", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/service.ts", "export const service = true\n")
  writeFixture(root, "scripts/module-nested-failures.mjs", [
    "import { createRequire } from 'node:module';",
    "const exact = createRequire(import.meta.url);",
    "function invoke(unknown, holder) {",
    "  let missingLoader; try { unknown((missing, 0), missingLoader = exact); } catch {} missingLoader('../lib/service');",
    "  let memberLoader; try { unknown((holder.value, 0), memberLoader = exact); } catch {} memberLoader('../lib/service');",
    "  let kept = exact; try { unknown((later, 0), kept = other); let later; } catch {} kept('../lib/service');",
    "}",
    "void invoke;",
    "",
  ].join("\n"))
  const report = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(report.references.filter((row) => row.kind === "require").map((row) => row.line), [6])
  assert.deepEqual(report.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER").map((row) => row.line), [4, 5])
})

test("round 25 nested argument failures route environment state at the detected expression", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/environment-nested-failures.ts", [
    "function invoke(unknown, holder) {",
    "  let missingValue = {}; try { unknown((missing, 0), missingValue = process.env); } catch {} missingValue.MISSING_PATH;",
    "  let memberValue = {}; try { unknown((holder.value, 0), memberValue = process.env); } catch {} memberValue.MEMBER_PATH;",
    "  let kept = process.env; try { unknown((later, 0), kept = {}); let later; } catch {} kept.KEPT_PATH;",
    "}",
    "void invoke;",
    "",
  ].join("\n"))
  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.reads.map((row) => row.name), ["KEPT_PATH"])
  assert.deepEqual(evidence.uncertainties.filter((row) => row.code === "UNPROVEN_ENVIRONMENT_ALIAS").map((row) => row.name), ["MISSING_PATH", "MEMBER_PATH"])
})

test("round 25 optional member arguments join environment evaluation paths", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/environment-optional-member-arguments.ts", [
    "function invoke(unknown, holder) {",
    "  let skipped = {}; try { unknown(undefined?.[skipped = process.env]); } catch {} skipped.SKIPPED_KEY;",
    "  let possible = {}; try { unknown(holder?.value, possible = process.env); } catch {} possible.POSSIBLE_LOOKUP;",
    "  let nullish = {}; try { unknown(null?.value, nullish = process.env); } catch {} nullish.NULLISH_SAFE;",
    "  let ordinary = {}; try { unknown(({ value: 1 })?.value, ordinary = process.env); } catch {} ordinary.ORDINARY_SAFE;",
    "  let method = {}; try { unknown(({ safe() {} })?.safe, method = process.env); } catch {} method.METHOD_SAFE;",
    "  let getter = {}; try { unknown(({ get dangerous() { throw failure; } })?.dangerous, getter = process.env); } catch {} getter.GETTER_LOOKUP;",
    "}",
    "void invoke;",
    "",
  ].join("\n"))
  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.reads.map((row) => row.name), ["NULLISH_SAFE", "ORDINARY_SAFE", "METHOD_SAFE"])
  assert.deepEqual(evidence.uncertainties.filter((row) => row.code === "UNPROVEN_ENVIRONMENT_ALIAS").map((row) => row.name), ["POSSIBLE_LOOKUP", "GETTER_LOOKUP"])
})

test("round 25 optional member arguments join module evaluation paths", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/service.ts", "export const service = true\n")
  writeFixture(root, "scripts/module-optional-member-arguments.mjs", [
    "import { createRequire } from 'node:module';",
    "const exact = createRequire(import.meta.url);",
    "function invoke(unknown, holder) {",
    "  let skipped; try { unknown(undefined?.[skipped = exact]); } catch {} skipped('../lib/service');",
    "  let possible; try { unknown(holder?.value, possible = exact); } catch {} possible('../lib/service');",
    "  let nullish; try { unknown(null?.value, nullish = exact); } catch {} nullish('../lib/service');",
    "  let ordinary; try { unknown(({ value: 1 })?.value, ordinary = exact); } catch {} ordinary('../lib/service');",
    "  let method; try { unknown(({ safe() {} })?.safe, method = exact); } catch {} method('../lib/service');",
    "  let getter; try { unknown(({ get dangerous() { throw failure; } })?.dangerous, getter = exact); } catch {} getter('../lib/service');",
    "}",
    "void invoke;",
    "",
  ].join("\n"))
  const report = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(report.references.filter((row) => row.kind === "require").map((row) => row.line), [6, 7, 8])
  assert.deepEqual(report.uncertainties.filter((row) => row.code === "UNPROVEN_MODULE_LOADER").map((row) => row.line), [5, 9])
})

test("round 25 immediate callee prerequisites stop after abrupt completion", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "app/environment-abrupt-callees.ts", [
    "let comma = {}; try { ((() => { throw failure; })(), (comma = process.env, () => {}))(); } catch {} comma.COMMA_ABORTED;",
    "let conditional = {}; try { ((() => { throw failure; })() ? (conditional = process.env, () => {}) : (() => {}))(); } catch {} conditional.CONDITION_ABORTED;",
       "let logical = {}; try { ((() => { throw failure; })() && (logical = process.env, () => {}))?.(); } catch {} logical.LOGICAL_ABORTED;",
    "",
  ].join("\n"))
  const evidence = buildEnvironmentEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(evidence.reads, [])
  assert.equal(evidence.uncertainties.some((row) =>
    ["COMMA_ABORTED", "CONDITION_ABORTED", "LOGICAL_ABORTED"].includes(row.name)), false)
})
