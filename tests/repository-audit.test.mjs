import assert from "node:assert/strict"
import { execFileSync, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { dirname, extname, join, resolve } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

import {
  buildRepositoryInventory,
  classifyCandidate,
  collectLegacyReferences,
  listTrackedFiles,
  loadJson,
  stableJson,
  toBaselineEntry,
  validateBaseline,
  verifyLegacyReferenceBaseline,
} from "../scripts/repository-audit/core.mjs"

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const policy = loadJson(resolve(repositoryRoot, "scripts/repository-audit/policy.json"))

function createFixtureRepository(t) {
  const root = mkdtempSync(join(tmpdir(), "atmoshaper-repository-audit-"))
  execFileSync("git", ["init", "-q"], { cwd: root })
  execFileSync("git", ["config", "user.name", "Repository Audit Test"], { cwd: root })
  execFileSync("git", ["config", "user.email", "repository-audit@example.test"], { cwd: root })
  execFileSync("git", ["config", "core.autocrlf", "false"], { cwd: root })
  t.after(() => rmSync(root, { recursive: true, force: true }))
  return root
}

function writeFixture(root, path, content, { tracked = true, force = false } = {}) {
  const absolutePath = resolve(root, ...path.split("/"))
  mkdirSync(dirname(absolutePath), { recursive: true })
  writeFileSync(absolutePath, content)
  if (tracked) {
    execFileSync("git", ["add", ...(force ? ["-f"] : []), "--", path], { cwd: root })
  }
  return absolutePath
}

const baselineFor = (entries) => ({
  schemaVersion: 1,
  sourceCommit: "a".repeat(40),
  entries,
})

const baselineEntry = (path, overrides = {}) => ({
  path,
  line: 1,
  column: 1,
  textSha256: "b".repeat(64),
  category: "historical",
  ...overrides,
})

test("tracked-file ordering, aggregate hash, and output are deterministic", (t) => {
  const root = createFixtureRepository(t)
  writeFixture(root, "z-last.txt", "zzz")
  writeFixture(root, "a-first.txt", "a")

  assert.deepEqual(
    listTrackedFiles(root, () => "z-last.txt\0a-first.txt\0"),
    ["a-first.txt", "z-last.txt"],
  )
  const first = buildRepositoryInventory(root, policy)
  const second = buildRepositoryInventory(root, policy)
  const firstOid = execFileSync("git", ["rev-parse", ":a-first.txt"], {
    cwd: root,
    encoding: "utf8",
  }).trim()
  const lastOid = execFileSync("git", ["rev-parse", ":z-last.txt"], {
    cwd: root,
    encoding: "utf8",
  }).trim()
  const expectedFingerprint = createHash("sha256")
    .update(`a-first.txt\u0000${firstOid}\u00001\nz-last.txt\u0000${lastOid}\u00003\n`)
    .digest("hex")

  assert.equal(JSON.stringify(stableJson(first)), JSON.stringify(stableJson(second)))
  assert.equal(first.inventorySha256, expectedFingerprint)
  assert.equal(first.trackedFileCount, 2)
})

test("inventory identity comes from staged blobs, not transformed worktree bytes", (t) => {
  const root = createFixtureRepository(t)
  writeFixture(root, "line-endings.txt", "line\n")
  const stagedOid = execFileSync("git", ["rev-parse", ":line-endings.txt"], {
    cwd: root,
    encoding: "utf8",
  }).trim()
  const first = buildRepositoryInventory(root, policy)

  execFileSync("git", ["config", "core.autocrlf", "true"], { cwd: root })
  writeFileSync(resolve(root, "line-endings.txt"), "line\r\n")
  const second = buildRepositoryInventory(root, policy)
  const expectedFingerprint = createHash("sha256")
    .update(`line-endings.txt\u0000${stagedOid}\u00005\n`)
    .digest("hex")

  assert.deepEqual(second, first)
  assert.equal(first.totalTrackedBytes, 5)
  assert.equal(first.inventorySha256, expectedFingerprint)
})

test("a tracked private path fails before its content can be opened", (t) => {
  const root = createFixtureRepository(t)
  const privatePath = writeFixture(root, ".env.local", "must-not-be-read", { force: true })
  rmSync(privatePath)
  assert.throws(
    () => buildRepositoryInventory(root, policy),
    /Forbidden tracked paths: \.env\.local/,
  )
})

test("an untracked private file is ignored", (t) => {
  const root = createFixtureRepository(t)
  writeFixture(root, "safe.txt", "safe")
  writeFixture(root, ".env.local", "must-not-appear", { tracked: false })
  const report = buildRepositoryInventory(root, policy)
  assert.equal(report.trackedFileCount, 1)
  assert.equal(JSON.stringify(report).includes(".env.local"), false)
  assert.equal(JSON.stringify(report).includes("must-not-appear"), false)
})

test("reviewed references pass, new references fail, and removals are informational", (t) => {
  const root = createFixtureRepository(t)
  writeFixture(root, "copy.md", "MassageLab public copy\n")
  const reviewed = collectLegacyReferences(root, ["copy.md"], policy)
  const baseline = baselineFor([
    toBaselineEntry(reviewed[0], "pre-rebrand-public-copy"),
  ])

  assert.deepEqual(
    verifyLegacyReferenceBaseline(reviewed, baseline, policy),
    { missing: [], unclassified: [] },
  )

  writeFixture(root, "new-copy.md", "A new Massage Lab reference\n")
  const withNewReference = collectLegacyReferences(root, ["copy.md", "new-copy.md"], policy)
  const added = verifyLegacyReferenceBaseline(withNewReference, baseline, policy)
  assert.equal(added.unclassified.length, 1)
  assert.equal(added.unclassified[0].path, "new-copy.md")

  const removed = verifyLegacyReferenceBaseline([], baseline, policy)
  assert.equal(removed.missing.length, 1)
  assert.deepEqual(removed.unclassified, [])
})

test("baseline schema, source commit, locations, categories, and hashes fail closed", () => {
  const validEntry = {
    path: "copy.md",
    line: 1,
    column: 1,
    textSha256: "b".repeat(64),
    category: "historical",
  }
  assert.throws(() => validateBaseline({ ...baselineFor([validEntry]), sourceCommit: "bad" }, policy), /sourceCommit/)
  assert.throws(() => validateBaseline(baselineFor([{ ...validEntry, path: "../copy.md" }]), policy), /normalized path/)
  assert.throws(() => validateBaseline(baselineFor([{ ...validEntry, line: 0 }]), policy), /line\/column/)
  assert.throws(() => validateBaseline(baselineFor([{ ...validEntry, category: "anything" }]), policy), /Invalid legacy category/)
  assert.throws(() => validateBaseline(baselineFor([{ ...validEntry, textSha256: "bad" }]), policy), /Invalid line hash/)
  assert.throws(
    () => validateBaseline({ ...baselineFor([validEntry]), extra: true }, policy),
    /unknown top-level field/,
  )
  assert.throws(
    () => validateBaseline(baselineFor([{ ...validEntry, sourceLine: "DO_NOT_PRINT_THIS" }]), policy),
    /unknown entry field/,
  )

  const missing = verifyLegacyReferenceBaseline([], baselineFor([validEntry]), policy).missing
  assert.deepEqual(Object.keys(missing[0]), ["path", "line", "column", "textSha256", "category"])
  assert.equal(JSON.stringify(missing).includes("DO_NOT_PRINT_THIS"), false)
})

test("candidate path rules distinguish exact files from descendant directories", () => {
  const reference = (path) => ({ path, sourceLine: "MassageLab" })

  assert.equal(classifyCandidate(reference("LICENSE"), policy), "legal")
  assert.equal(classifyCandidate(reference("app/legal/privacy.ts"), policy), "legal")
  assert.equal(
    classifyCandidate(reference("LICENSE.md.backup"), policy),
    "pre-rebrand-public-copy",
  )
  assert.equal(classifyCandidate(reference("MIGRATION_LINEAGE.md"), policy), "historical")
  assert.equal(
    classifyCandidate(reference("MIGRATION_LINEAGE.md.backup"), policy),
    "pre-rebrand-public-copy",
  )
})

test("reviewed exact legal owners classify the business identity as legal", () => {
  const tracked = new Set(listTrackedFiles(repositoryRoot))
  const legalOwners = [
    "lib/legal-acceptance-gate.js",
    "lib/legal-acceptance.js",
    "lib/legal-documents.js",
    "tests/legal-acceptance.test.mjs",
    "tests/legal-documents.test.mjs",
  ]
  for (const path of legalOwners) assert.equal(tracked.has(path), true, path)

  assert.equal(
    classifyCandidate({
      path: "lib/legal-documents.js",
      sourceLine: 'export const LEGAL_BUSINESS_IDENTITY = "Massage Lab, operated by Derrick Bowersock"',
      identifierAtMatch: "Massage",
    }, policy),
    "legal",
  )
})

test("case-sensitive camelCase legacy identifiers are compatibility references", () => {
  const reference = (sourceLine, identifierAtMatch = null) => ({
    path: "app/chimer/running-timer.tsx",
    sourceLine,
    identifierAtMatch,
  })

  assert.equal(
    classifyCandidate(
      reference("const massageLabGradientOpacity = 0.5", "massageLabGradientOpacity"),
      policy,
    ),
    "compatibility",
  )
  assert.equal(
    classifyCandidate(
      reference("const massagelabGradientOpacity = 0.5", "massagelabGradientOpacity"),
      policy,
    ),
    "compatibility",
  )
  assert.equal(
    classifyCandidate(reference("MassageLab remains visible copy"), policy),
    "pre-rebrand-public-copy",
  )
})

test("verified match-scoped compatibility identifier forms remain narrow", (t) => {
  const root = createFixtureRepository(t)
  writeFixture(
    root,
    "mixed.ts",
    [
      "massageLab3DGlobe MassageLab visible copy",
      "MassageLabDnaOptions MassageLab visible copy",
      "massagelabAtmoShaperBrowserQa MassageLab visible copy",
      "getMassageLabAstralFlowDisplaySpeed MassageLab visible copy",
      "__massagelabAtmoShaperBrowserQa MassageLab visible copy",
    ].join("\n"),
  )
  const references = collectLegacyReferences(root, ["mixed.ts"], policy)
  const byLine = Map.groupBy(references, (reference) => reference.line)

  for (const [line, identifier] of [
    [1, "massageLab3DGlobe"],
    [2, "MassageLabDnaOptions"],
    [3, "massagelabAtmoShaperBrowserQa"],
    [4, "MassageLabAstralFlowDisplaySpeed"],
    [5, "massagelabAtmoShaperBrowserQa"],
  ]) {
    const lineReferences = byLine.get(line)
    assert.equal(lineReferences[0].identifierAtMatch, identifier)
    assert.deepEqual(
      lineReferences.map((reference) => classifyCandidate(reference, policy)),
      ["compatibility", "pre-rebrand-public-copy"],
    )
  }

  assert.equal(
    classifyCandidate({
      path: "docs/history.md",
      sourceLine: "MassageLabDnaOptions",
      identifierAtMatch: "MassageLabDnaOptions",
    }, policy),
    "historical",
  )
  assert.equal(
    classifyCandidate({
      path: "lib/legal-documents.js",
      sourceLine: "MassageLabDnaOptions",
      identifierAtMatch: "MassageLabDnaOptions",
    }, policy),
    "legal",
  )
})

test("semantic identifier classification is scoped to the matched occurrence", (t) => {
  const root = createFixtureRepository(t)
  writeFixture(
    root,
    "mixed.ts",
    "const massageLabGradientOpacity = 'MassageLab public copy'\n",
  )
  const references = collectLegacyReferences(root, ["mixed.ts"], policy)

  assert.equal(references.length, 2)
  assert.equal(references[0].identifierAtMatch, "massageLabGradientOpacity")
  assert.equal(references[1].identifierAtMatch, "MassageLab")
  assert.deepEqual(
    references.map((reference) => classifyCandidate(reference, policy)),
    ["compatibility", "pre-rebrand-public-copy"],
  )

  assert.equal(
    classifyCandidate({
      path: "docs/history.md",
      sourceLine: "massageLabGradientOpacity",
      identifierAtMatch: "massageLabGradientOpacity",
    }, policy),
    "historical",
  )
})

test("path ownership precedes occurrence-scoped compatibility syntax", (t) => {
  const root = createFixtureRepository(t)
  writeFixture(
    root,
    "docs/background-sources.md",
    "MassageLab. MASSAGELAB_STORAGE_KEY records historical syntax.\n",
  )
  writeFixture(
    root,
    "mixed.md",
    "MASSAGELAB_STORAGE_KEY differs from ordinary MassageLab copy.\n",
  )
  writeFixture(
    root,
    "tokens.md",
    [
      "massagelab.invalid",
      "massagelab:storage",
      "massagelab-storage",
      "MASSAGELAB_STORAGE",
      "x-massagelab-client",
      "MassageLab.",
    ].join("\n"),
  )

  const historical = collectLegacyReferences(
    root,
    ["docs/background-sources.md"],
    policy,
  )
  assert.deepEqual(
    historical.map((reference) => classifyCandidate(reference, policy)),
    ["historical", "historical"],
  )

  const mixed = collectLegacyReferences(root, ["mixed.md"], policy)
  assert.deepEqual(
    mixed.map((reference) => classifyCandidate(reference, policy)),
    ["compatibility", "pre-rebrand-public-copy"],
  )

  const tokens = collectLegacyReferences(root, ["tokens.md"], policy)
  assert.deepEqual(
    tokens.map((reference) => classifyCandidate(reference, policy)),
    [
      "compatibility",
      "compatibility",
      "compatibility",
      "compatibility",
      "compatibility",
      "pre-rebrand-public-copy",
    ],
  )
})

test("baseline entries and comparison reports use canonical occurrence ordering", () => {
  const first = baselineEntry("a.md")
  const second = baselineEntry("b.md", { textSha256: "c".repeat(64) })

  assert.throws(
    () => validateBaseline(baselineFor([second, first]), policy),
    /deterministic occurrence order/,
  )

  const report = verifyLegacyReferenceBaseline(
    [
      { ...second, sourceLine: "MassageLab" },
      { ...first, sourceLine: "MassageLab" },
    ],
    baselineFor([]),
    policy,
  )
  assert.deepEqual(report.unclassified.map((entry) => entry.path), ["a.md", "b.md"])
})

test("baseline validation rejects non-normalized directory-like paths", () => {
  const invalidPaths = [
    "x//a.md",
    "x/./a.md",
    "x/a.md/",
    "/x/a.md",
    "C:/x/a.md",
    "x/../a.md",
    "./x/a.md",
    "x\\a.md",
  ]

  for (const path of invalidPaths) {
    assert.throws(
      () => validateBaseline(baselineFor([baselineEntry(path)]), policy),
      /normalized path/,
      path,
    )
  }
})

test("runtime surfaces never import repository-audit tooling", () => {
  const runtimePrefixes = ["app/", "components/", "lib/", "prisma/", "public/"]
  const textExtensions = new Set(policy.textExtensions)
  const offenders = listTrackedFiles(repositoryRoot)
    .filter((path) => runtimePrefixes.some((prefix) => path.startsWith(prefix)))
    .filter((path) => textExtensions.has(extname(path).toLowerCase()))
    .filter((path) => readFileSync(resolve(repositoryRoot, ...path.split("/")), "utf8")
      .includes("scripts/repository-audit"))
  assert.deepEqual(offenders, [])
})

test("CLI failures use exact sanitized JSON envelopes without leaking source data", (t) => {
  const inventoryRoot = createFixtureRepository(t)
  for (const path of [
    "scripts/repository-audit/core.mjs",
    "scripts/repository-audit/inventory.mjs",
    "scripts/repository-audit/policy.json",
  ]) {
    writeFixture(inventoryRoot, path, readFileSync(resolve(repositoryRoot, ...path.split("/"))))
  }
  const privatePath = writeFixture(
    inventoryRoot,
    ".env.local",
    "DO_NOT_PRINT_THIS",
    { force: true },
  )
  rmSync(privatePath)
  const inventoryResult = spawnSync(
    process.execPath,
    ["scripts/repository-audit/inventory.mjs"],
    { cwd: inventoryRoot, encoding: "utf8" },
  )
  const inventoryEnvelope = `{
  "error": {
    "code": "REPOSITORY_INVENTORY_FAILED"
  },
  "schemaVersion": 1
}
`
  assert.equal(inventoryResult.status, 1)
  assert.equal(inventoryResult.stdout, "")
  assert.equal(inventoryResult.stderr, inventoryEnvelope)
  assert.equal(inventoryResult.stderr.includes("DO_NOT_PRINT_THIS"), false)
  assert.equal(inventoryResult.stderr.includes(inventoryRoot), false)
  assert.equal(inventoryResult.stderr.includes(".env.local"), false)

  const brandRoot = createFixtureRepository(t)
  for (const path of [
    "scripts/repository-audit/core.mjs",
    "scripts/repository-audit/brand.mjs",
    "scripts/repository-audit/policy.json",
  ]) {
    writeFixture(brandRoot, path, readFileSync(resolve(repositoryRoot, ...path.split("/"))))
  }
  writeFixture(
    brandRoot,
    "MIGRATION_LINEAGE.md",
    `Source commit: \`${"a".repeat(40)}\`\n`,
  )
  writeFixture(
    brandRoot,
    "scripts/repository-audit/brand-reference-baseline.json",
    JSON.stringify({
      schemaVersion: 1,
      sourceCommit: "a".repeat(40),
      entries: [{
        ...baselineEntry("copy.md"),
        sourceLine: "DO_NOT_PRINT_THIS",
      }],
    }),
  )
  const brandResult = spawnSync(
    process.execPath,
    ["scripts/repository-audit/brand.mjs"],
    { cwd: brandRoot, encoding: "utf8" },
  )
  const brandEnvelope = `{
  "error": {
    "code": "LEGACY_BRAND_AUDIT_FAILED"
  },
  "schemaVersion": 1
}
`
  assert.equal(brandResult.status, 1)
  assert.equal(brandResult.stdout, "")
  assert.equal(brandResult.stderr, brandEnvelope)
  assert.equal(brandResult.stderr.includes("DO_NOT_PRINT_THIS"), false)
  assert.equal(brandResult.stderr.includes(brandRoot), false)
  assert.equal(brandResult.stderr.includes("copy.md"), false)
})

test("default brand report excludes removed occurrences from active totals", (t) => {
  const root = createFixtureRepository(t)
  for (const path of [
    "scripts/repository-audit/core.mjs",
    "scripts/repository-audit/brand.mjs",
    "scripts/repository-audit/policy.json",
  ]) {
    writeFixture(
      root,
      path,
      readFileSync(resolve(repositoryRoot, ...path.split("/"))),
      { tracked: false },
    )
  }
  writeFixture(
    root,
    "MIGRATION_LINEAGE.md",
    `Source commit: \`${"a".repeat(40)}\`\n`,
  )
  writeFixture(
    root,
    "scripts/repository-audit/brand-reference-baseline.json",
    JSON.stringify(baselineFor([baselineEntry("removed.md")])),
    { tracked: false },
  )

  const result = spawnSync(
    process.execPath,
    ["scripts/repository-audit/brand.mjs"],
    { cwd: root, encoding: "utf8" },
  )
  const report = JSON.parse(result.stdout)
  assert.equal(result.status, 0)
  assert.equal(result.stderr, "")
  assert.equal(report.missing.length, 1)
  assert.equal(report.missing[0].path, "removed.md")
  assert.equal(report.totals.historical, 0)
  assert.deepEqual(report.unclassified, [])
})

test("candidate baseline output ends with exactly one newline", (t) => {
  const root = createFixtureRepository(t)
  for (const path of [
    "scripts/repository-audit/core.mjs",
    "scripts/repository-audit/brand.mjs",
    "scripts/repository-audit/policy.json",
  ]) {
    writeFixture(
      root,
      path,
      readFileSync(resolve(repositoryRoot, ...path.split("/"))),
      { tracked: false },
    )
  }
  writeFixture(root, "MIGRATION_LINEAGE.md", `Source commit: \`${"a".repeat(40)}\`\n`)

  const result = spawnSync(
    process.execPath,
    ["scripts/repository-audit/brand.mjs", "--print-candidate-baseline"],
    { cwd: root, encoding: "utf8" },
  )

  assert.equal(result.status, 0)
  assert.equal(result.stderr, "")
  assert.match(result.stdout, /}\n$/)
  assert.doesNotMatch(result.stdout, /}\n\n$/)
  assert.equal(JSON.parse(result.stdout).sourceCommit, "a".repeat(40))
})

test("candidate baseline output preserves the established schema key order", (t) => {
  const root = createFixtureRepository(t)
  for (const path of [
    "scripts/repository-audit/core.mjs",
    "scripts/repository-audit/brand.mjs",
    "scripts/repository-audit/policy.json",
  ]) {
    writeFixture(
      root,
      path,
      readFileSync(resolve(repositoryRoot, ...path.split("/"))),
      { tracked: false },
    )
  }
  writeFixture(
    root,
    "MIGRATION_LINEAGE.md",
    readFileSync(resolve(repositoryRoot, "MIGRATION_LINEAGE.md")),
  )

  const result = spawnSync(
    process.execPath,
    ["scripts/repository-audit/brand.mjs", "--print-candidate-baseline"],
    { cwd: root, encoding: "utf8" },
  )
  const baseline = JSON.parse(result.stdout)

  assert.equal(result.status, 0)
  assert.deepEqual(Object.keys(baseline), ["schemaVersion", "sourceCommit", "entries"])
  assert.deepEqual(
    Object.keys(baseline.entries[0]),
    ["path", "line", "column", "textSha256", "category"],
  )
})

test("child Git failures expose only the sanitized CLI envelopes", (t) => {
  const root = createFixtureRepository(t)
  for (const path of [
    "scripts/repository-audit/core.mjs",
    "scripts/repository-audit/inventory.mjs",
    "scripts/repository-audit/brand.mjs",
    "scripts/repository-audit/policy.json",
  ]) {
    writeFixture(
      root,
      path,
      readFileSync(resolve(repositoryRoot, ...path.split("/"))),
      { tracked: false },
    )
  }
  writeFixture(root, "MIGRATION_LINEAGE.md", `Source commit: \`${"a".repeat(40)}\`\n`)
  writeFixture(
    root,
    "scripts/repository-audit/brand-reference-baseline.json",
    JSON.stringify(baselineFor([])),
    { tracked: false },
  )
  const sentinel = resolve(root, "sentinel.git")
  const env = { ...process.env, GIT_DIR: sentinel }
  const cases = [
    ["scripts/repository-audit/inventory.mjs", "REPOSITORY_INVENTORY_FAILED"],
    ["scripts/repository-audit/brand.mjs", "LEGACY_BRAND_AUDIT_FAILED"],
  ]

  for (const [path, code] of cases) {
    const result = spawnSync(process.execPath, [path], {
      cwd: root,
      encoding: "utf8",
      env,
    })
    assert.equal(result.status, 1)
    assert.equal(result.stdout, "")
    assert.equal(
      result.stderr,
      `{
  "error": {
    "code": "${code}"
  },
  "schemaVersion": 1
}
`,
    )
    assert.equal(result.stderr.includes("fatal:"), false)
    assert.equal(result.stderr.includes("sentinel.git"), false)
    assert.equal(result.stderr.includes(root), false)
  }
})

test("missing or malformed inventory policy uses the sanitized envelope", (t) => {
  const expected = `{
  "error": {
    "code": "REPOSITORY_INVENTORY_FAILED"
  },
  "schemaVersion": 1
}
`
  for (const policyContent of [null, "{ malformed"]) {
    const root = createFixtureRepository(t)
    for (const path of [
      "scripts/repository-audit/core.mjs",
      "scripts/repository-audit/inventory.mjs",
    ]) {
      writeFixture(
        root,
        path,
        readFileSync(resolve(repositoryRoot, ...path.split("/"))),
        { tracked: false },
      )
    }
    if (policyContent !== null) {
      writeFixture(
        root,
        "scripts/repository-audit/policy.json",
        policyContent,
        { tracked: false },
      )
    }

    const result = spawnSync(
      process.execPath,
      ["scripts/repository-audit/inventory.mjs"],
      { cwd: root, encoding: "utf8" },
    )
    assert.equal(result.status, 1)
    assert.equal(result.stdout, "")
    assert.equal(result.stderr, expected)
    assert.equal(result.stderr.includes(root), false)
    assert.equal(result.stderr.includes("malformed"), false)
  }
})
