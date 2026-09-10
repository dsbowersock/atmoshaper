import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

import {
  buildAssetEvidence,
  buildAuditEnvelope,
  buildDependencyEvidence,
  buildEnvironmentEvidence,
  buildModuleEvidence,
  buildTrackedTextIndex,
  loadCleanupPolicy,
  validateCleanupPolicy,
} from "../scripts/repository-audit/cleanup-core.mjs"
import { normalizeRepoPath } from "../scripts/repository-audit/core.mjs"

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const policyPath = resolve(repositoryRoot, "scripts/repository-audit/cleanup-policy.json")
const policy = loadCleanupPolicy(policyPath)

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

function assertPrivateSerialization(value, root, forbidden) {
  const serialized = JSON.stringify(value)
  assert.equal(serialized.includes(root), false)
  for (const text of forbidden) assert.equal(serialized.includes(text), false)
  assert.equal(serialized.includes("Error:"), false)
  assert.equal(serialized.includes(" at "), false)
}

test("schema-v1 policy names every required scope and rejects policy drift", () => {
  assert.equal(validateCleanupPolicy(clonePolicy()).schemaVersion, 1)
  assert.deepEqual(Object.keys(policy.scopes).sort(), ["doc", "runtime", "test", "tool"])

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

test("tracked text and all evidence envelopes are deterministic", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root, { scripts: { dev: "next dev" }, dependencies: { next: "1.0.0" } })
  writeFixture(root, "app/page.tsx", "export default function Page() { return null }\n")
  writeFixture(root, "public/icon.svg", "<svg/>\n")

  const firstIndex = buildTrackedTextIndex(root, policy)
  const secondIndex = buildTrackedTextIndex(root, policy)
  assert.equal(JSON.stringify(firstIndex), JSON.stringify(secondIndex))
  assert.equal(JSON.stringify(firstIndex).includes("export default"), false)

  for (const [kind, builder] of [
    ["module", buildModuleEvidence],
    ["dependency", buildDependencyEvidence],
    ["asset", buildAssetEvidence],
    ["environment", buildEnvironmentEvidence],
  ]) {
    const first = buildAuditEnvelope(kind, builder(firstIndex, policy))
    const second = buildAuditEnvelope(kind, builder(secondIndex, policy))
    assert.deepEqual(first, second)
    assert.equal(first.deletionAuthority, false)
    assert.match(first.evidenceSha256, /^[a-f0-9]{64}$/)
  }
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

test("module evidence resolves aliases, relative extensions, indexes, and export-from", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, "lib/alias.ts", "export const alias = true\n")
  writeFixture(root, "lib/relative.tsx", "export const relative = true\n")
  writeFixture(root, "lib/folder/index.ts", "export const nested = true\n")
  writeFixture(root, "lib/barrel.ts", "export { alias } from \"./alias\"\n")
  writeFixture(root, "app/page.tsx", [
    "import { alias } from \"@/lib/alias\"",
    "import { relative } from \"../lib/relative\"",
    "const nested = require(\"../lib/folder\")",
    "void alias; void relative; void nested",
    "",
  ].join("\n"))

  const evidence = buildModuleEvidence(buildTrackedTextIndex(root, policy), policy)
  assert.deepEqual(
    evidence.references.filter((row) => row.targetKind === "tracked-module").map((row) => row.targetPath).sort(),
    ["lib/alias.ts", "lib/alias.ts", "lib/folder/index.ts", "lib/relative.tsx"],
  )
  assert.equal(evidence.errors.length, 0)
  assert.ok(evidence.roots.some((row) => row.path === "app/page.tsx" && row.reason === "framework-root"))
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

test("ignored untracked private files never enter the index or evidence", (t) => {
  const root = createFixtureRepository(t)
  writePackage(root)
  writeFixture(root, ".gitignore", ".env.local\n")
  writeFixture(root, "app/page.tsx", "export default function Page() { return null }\n")
  const privateValue = "untracked-private-fixture-value"
  writeFixture(root, ".env.local", `PRIVATE=${privateValue}\n`, { tracked: false })

  const index = buildTrackedTextIndex(root, policy)
  const envelope = buildAuditEnvelope("environment", buildEnvironmentEvidence(index, policy))
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
    if (args[0] === "cat-file" && String(options.input).includes(ignoredOid)) ignoredBlobRequested = true
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

test("real runtime prefixes do not import the repository-audit implementation", () => {
  const index = buildTrackedTextIndex(repositoryRoot, policy)
  const evidence = buildModuleEvidence(index, policy)
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

test("audit envelope hash changes with evidence but deletion authority never does", () => {
  const first = buildAuditEnvelope("module", { rows: [{ path: "a.ts" }] })
  const reordered = buildAuditEnvelope("module", { rows: [{ path: "a.ts" }] })
  const changed = buildAuditEnvelope("module", { rows: [{ path: "b.ts" }] })
  assert.deepEqual(first, reordered)
  assert.notEqual(first.evidenceSha256, changed.evidenceSha256)
  assert.equal(first.deletionAuthority, false)
  assert.equal(changed.deletionAuthority, false)
})

test("checked-in cleanup policy remains parseable JSON", () => {
  assert.deepEqual(JSON.parse(readFileSync(policyPath, "utf8")), policy)
})
