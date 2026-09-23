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
import { dirname, join, resolve } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const checkoutTestPath = fileURLToPath(import.meta.url)
const repositoryRoot = resolve(dirname(checkoutTestPath), "..")
const checkoutTestName =
  "legal archive checkout bytes remain pinned across Git line-ending settings"
const archiveFixtures = [
  {
    path: "data/legal-document-history/2026-06-legal-v2.json",
    sha256: "8c7263b53697495f096f479484b6ccd7eae574f20111ecf0e0a44f7fd50017aa",
  },
  {
    path: "data/legal-document-history/2026-07-digital-purchases-v2.json",
    sha256: "bdb76adf941e4e22022765734650d7e1224486d282d8303fa5869ee4fc25a4c8",
  },
]
const checkoutModes = [
  ["core.autocrlf=true", ["-c", "core.autocrlf=true"]],
  ["core.autocrlf=input", ["-c", "core.autocrlf=input"]],
  [
    "core.autocrlf=false and core.eol=lf",
    ["-c", "core.autocrlf=false", "-c", "core.eol=lf"],
  ],
]
const unrelatedPath = "data/legal-document-history/unrelated-checkout-fixture.json"
const unrelatedBytes = Buffer.from("{\r\n  \"unrelated\": true\r\n}\r\n")
const isolatedGitEnvironment = Object.freeze(Object.fromEntries(
  Object.entries(process.env).filter(
    ([name]) => !name.toUpperCase().startsWith("GIT_"),
  ),
))

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex")

/**
 * Runs local fixture Git without inheriting caller repository, index, object,
 * or config routing. The case-insensitive check covers Windows environment names.
 */
function runFixtureGit(root, arguments_, options = {}) {
  return execFileSync("git", arguments_, {
    ...options,
    cwd: root,
    env: isolatedGitEnvironment,
  })
}

function writeFixture(root, path, bytes) {
  const absolutePath = resolve(root, ...path.split("/"))
  mkdirSync(dirname(absolutePath), { recursive: true })
  writeFileSync(absolutePath, bytes)
}

function filteredBytes(root, modeArguments, path) {
  return runFixtureGit(
    root,
    [...modeArguments, "cat-file", "--filters", `:${path}`],
  )
}

/**
 * Requires TAP evidence for one real selected test; exit zero alone also covers
 * Node's recursive-runner skip and a name pattern that selects no tests.
 */
function assertCheckoutChildExecuted(result) {
  const output = [result.error?.message, result.stdout, result.stderr]
    .filter(Boolean)
    .join("\n")
  assert.equal(result.status, 0, output)
  assert.doesNotMatch(
    result.stderr ?? "",
    /run\(\) is being called recursively within a test file/i,
    "nested child must not inherit the parent Node test-runner context",
  )
  assert.match(
    result.stdout ?? "",
    /^ok 1 - legal archive checkout bytes remain pinned across Git line-ending settings$/m,
    "named checkout test must execute and pass",
  )
  assert.match(result.stdout, /^# tests 1$/m)
  assert.match(result.stdout, /^# pass 1$/m)
  assert.match(result.stdout, /^# fail 0$/m)
}

test(checkoutTestName, (t) => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "atmoshaper-legal-archive-checkout-"))
  t.after(() => rmSync(fixtureRoot, { recursive: true, force: true }))
  runFixtureGit(fixtureRoot, ["init", "-q"])

  writeFixture(
    fixtureRoot,
    ".gitattributes",
    readFileSync(resolve(repositoryRoot, ".gitattributes")),
  )
  for (const { path } of archiveFixtures) {
    writeFixture(fixtureRoot, path, readFileSync(resolve(repositoryRoot, path)))
  }
  writeFixture(fixtureRoot, unrelatedPath, unrelatedBytes)

  // Preserve the supplied fixture bytes in the index so checkout filtering is isolated.
  runFixtureGit(
    fixtureRoot,
    [
      "-c",
      "core.autocrlf=false",
      "add",
      "--",
      ".gitattributes",
      ...archiveFixtures.map(({ path }) => path),
      unrelatedPath,
    ],
  )

  for (const { path, sha256: expectedSha256 } of archiveFixtures) {
    const sourceBytes = readFileSync(resolve(repositoryRoot, path))
    assert.equal(sha256(sourceBytes), expectedSha256)
    for (const [label, modeArguments] of checkoutModes) {
      const checkoutBytes = filteredBytes(fixtureRoot, modeArguments, path)
      assert.deepEqual(checkoutBytes, sourceBytes, `${label}: ${path}`)
      assert.equal(sha256(checkoutBytes), expectedSha256, `${label}: ${path}`)
    }
  }

  for (const [label, modeArguments] of checkoutModes) {
    assert.deepEqual(
      filteredBytes(fixtureRoot, modeArguments, unrelatedPath),
      unrelatedBytes,
      `${label}: unrelated fixture must keep its original line endings`,
    )
  }
})

test("checkout test ignores inherited Git repository-location overrides", (t) => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "atmoshaper-legal-archive-poison-"))
  t.after(() => rmSync(fixtureRoot, { recursive: true, force: true }))
  const decoyRoot = resolve(fixtureRoot, "decoy")
  const decoyGitDirectory = resolve(decoyRoot, ".git")
  const decoyContentPath = resolve(decoyRoot, "sentinel.txt")
  mkdirSync(decoyRoot)
  runFixtureGit(decoyRoot, ["init", "-q"])
  writeFileSync(decoyContentPath, "decoy sentinel\r\n")
  runFixtureGit(decoyRoot, [
    "-c",
    "core.autocrlf=false",
    "add",
    "--",
    "sentinel.txt",
  ])

  const snapshotDecoy = () => ({
    config: readFileSync(resolve(decoyGitDirectory, "config")),
    head: readFileSync(resolve(decoyGitDirectory, "HEAD")),
    index: readFileSync(resolve(decoyGitDirectory, "index")),
    content: readFileSync(decoyContentPath),
  })
  const before = snapshotDecoy()
  const poisonedEnvironment = {
    ...isolatedGitEnvironment,
    GIT_DIR: decoyGitDirectory,
    GIT_WORK_TREE: decoyRoot,
    GIT_INDEX_FILE: resolve(decoyGitDirectory, "index"),
    GIT_COMMON_DIR: decoyGitDirectory,
    Git_Object_Directory: resolve(decoyGitDirectory, "objects"),
    git_alternate_object_directories: resolve(decoyGitDirectory, "objects"),
  }
  const childEnvironment = { ...poisonedEnvironment }
  delete childEnvironment.NODE_TEST_CONTEXT
  const runSelectedChild = (namePattern) => spawnSync(
    process.execPath,
    [
      "--test",
      "--test-reporter=tap",
      `--test-name-pattern=${namePattern}`,
      checkoutTestPath,
    ],
    {
      cwd: repositoryRoot,
      env: childEnvironment,
      encoding: "utf8",
    },
  )

  assert.throws(
    () => assertCheckoutChildExecuted({
      status: 0,
      stdout: "",
      stderr:
        "node:test run() is being called recursively within a test file. skipping running files.",
    }),
    /must not inherit the parent Node test-runner context/,
  )
  const noMatchingTest = runSelectedChild("^no checkout test has this name$")
  assert.equal(noMatchingTest.status, 0)
  assert.throws(
    () => assertCheckoutChildExecuted(noMatchingTest),
    /named checkout test must execute and pass/,
  )
  const result = runSelectedChild(
    "^legal archive checkout bytes remain pinned across Git line-ending settings$",
  )

  assert.deepEqual(snapshotDecoy(), before)
  assertCheckoutChildExecuted(result)
})
