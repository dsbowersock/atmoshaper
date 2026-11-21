import assert from "node:assert/strict"
import { mkdtemp, mkdir, writeFile, rm, realpath } from "node:fs/promises"
import path from "node:path"
import { spawnSync } from "node:child_process"
import test from "node:test"
import { isGitAncestor, readGitDiffPaths, reachableReviewedBlobs } from "../scripts/coderabbit-coverage-proof.mjs"

test("a later reviewed label does not certify an earlier unreviewed routine", () => {
  const partial = [{ from: "unreviewed-routine", to: "routine-and-reviewed-label" }]
  assert.equal(reachableReviewedBlobs("inherited", partial).has("routine-and-reviewed-label"), false)
  assert.equal(reachableReviewedBlobs("inherited", [...partial, { from: "inherited", to: "unreviewed-routine" }]).has("routine-and-reviewed-label"), true)
  assert.equal(reachableReviewedBlobs("inherited", [...partial, { from: "inherited", to: "routine-and-reviewed-label" }]).has("routine-and-reviewed-label"), true)
  assert.equal(reachableReviewedBlobs(null, [{ from: null, to: "new-file" }]).has("new-file"), true)
  assert.equal(reachableReviewedBlobs("old", [{ from: null, to: "replacement" }, { from: "old", to: null }]).has("replacement"), true)
})

test("Git errors cannot become zero-file PRs or valid non-ancestor results", async () => {
  const parent = path.resolve("output/coderabbit-corrections/git-proof-fixtures")
  await mkdir(parent, { recursive: true })
  const workspace = await realpath(process.cwd()), resolvedParent = await realpath(parent)
  assert.ok(resolvedParent.startsWith(workspace + path.sep))
  const fixture = await mkdtemp(path.join(parent, "owned-"))
  function git(args, input) {
    const result = spawnSync("git", ["-c", "user.name=Review Fixture", "-c", "user.email=fixture@example.invalid", "-c", "commit.gpgsign=false", "-c", `core.hooksPath=${path.join(fixture, "no-hooks")}`, "-c", "core.fsmonitor=false", ...args], { cwd: fixture, input, encoding: "utf8", windowsHide: true })
    assert.equal(result.status, 0, `fixture Git ${args[0]} succeeds`)
    return result.stdout.trim()
  }
  try {
    git(["init", "--quiet", "--template="])
    await writeFile(path.join(fixture, "source.txt"), "Inherited content\n")
    git(["add", "source.txt"]); git(["commit", "--quiet", "-m", "Fixture baseline"])
    const first = git(["rev-parse", "HEAD"])
    await writeFile(path.join(fixture, "source.txt"), "Changed content\n")
    git(["add", "source.txt"]); git(["commit", "--quiet", "-m", "Fixture change"])
    const second = git(["rev-parse", "HEAD"])
    const unrelated = git(["commit-tree", "HEAD^{tree}"], "Unrelated fixture root\n")
    assert.equal(isGitAncestor(first, second, fixture), true)
    assert.equal(isGitAncestor(unrelated, second, fixture), false)
    assert.deepEqual(readGitDiffPaths(second, second, fixture), [])
    assert.deepEqual(readGitDiffPaths(first, second, fixture), ["source.txt"])
    assert.throws(() => isGitAncestor("f".repeat(40), second, fixture), /unavailable/)
    // Delete only this test's loose parent object, reproducing a readable head
    // with an unavailable first parent. Real repository objects are untouched.
    const object = path.resolve(fixture, ".git/objects", first.slice(0, 2), first.slice(2))
    assert.ok(object.startsWith(fixture + path.sep))
    await rm(object)
    git(["cat-file", "-e", second])
    assert.throws(() => readGitDiffPaths(`${second}^1`, second, fixture), /read failed/)
  } finally {
    const target = await realpath(fixture)
    assert.equal(path.dirname(target), resolvedParent)
    await rm(target, { recursive: true, force: true })
  }
})
