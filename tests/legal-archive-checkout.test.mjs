import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
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

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
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

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex")

function writeFixture(root, path, bytes) {
  const absolutePath = resolve(root, ...path.split("/"))
  mkdirSync(dirname(absolutePath), { recursive: true })
  writeFileSync(absolutePath, bytes)
}

function filteredBytes(root, modeArguments, path) {
  return execFileSync(
    "git",
    [...modeArguments, "cat-file", "--filters", `:${path}`],
    { cwd: root },
  )
}

test("legal archive checkout bytes remain pinned across Git line-ending settings", (t) => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "atmoshaper-legal-archive-checkout-"))
  t.after(() => rmSync(fixtureRoot, { recursive: true, force: true }))
  execFileSync("git", ["init", "-q"], { cwd: fixtureRoot })

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
  execFileSync(
    "git",
    [
      "-c",
      "core.autocrlf=false",
      "add",
      "--",
      ".gitattributes",
      ...archiveFixtures.map(({ path }) => path),
      unrelatedPath,
    ],
    { cwd: fixtureRoot },
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
