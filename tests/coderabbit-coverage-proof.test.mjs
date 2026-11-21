import assert from "node:assert/strict"
import { mkdtemp, mkdir, readFile, writeFile, rm, realpath } from "node:fs/promises"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import test from "node:test"
import { isGitAncestor, readGitDiffPaths, readGitTree, selectReviewBaseline, reachableReviewedBlobs, validateCompletedCliReceipt } from "../scripts/coderabbit-coverage-proof.mjs"

/** Own every fixture object/index and cleanup path. Never inherit a caller's
 * Git index/repository redirects into fixture writes or the preparation worker. */
async function fixtureRepository(t) {
  const parent = path.resolve("output/coderabbit-corrections/git-proof-fixtures")
  await mkdir(parent, { recursive: true })
  const workspace = await realpath(process.cwd()), resolvedParent = await realpath(parent)
  assert.ok(resolvedParent.startsWith(workspace + path.sep))
  const root = await mkdtemp(path.join(parent, "owned-"))
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^GIT_/i.test(key)))
  t.after(async () => {
    const target = await realpath(root)
    assert.equal(path.dirname(target), resolvedParent)
    await rm(target, { recursive: true, force: true })
  })
  function git(args, input) {
    const result = spawnSync("git", ["-c", "user.name=Review Fixture", "-c", "user.email=fixture@example.invalid", "-c", "commit.gpgsign=false", "-c", `core.hooksPath=${path.join(root, "no-hooks")}`, "-c", "core.fsmonitor=false", ...args], { cwd: root, env, input, encoding: "utf8", windowsHide: true })
    assert.equal(result.status, 0, `fixture Git ${args[0]} succeeds`)
    return result.stdout.trim()
  }
  git(["init", "--quiet", "--template="])
  git(["config", "user.name", "Review Fixture"])
  git(["config", "user.email", "fixture@example.invalid"])
  git(["config", "core.hooksPath", path.join(root, "no-hooks")])
  git(["config", "core.fsmonitor", "false"])
  git(["config", "commit.gpgsign", "false"])
  return { root, git, env }
}

/** Build real Git history without checking out names unsupported by Windows. */
function commitFiles(git, files, parent) {
  const entries = Object.entries(files).map(([name, content]) => {
    const blob = git(["hash-object", "-w", "--stdin"], content)
    return `100644 blob ${blob}\t${name}\0`
  }).join("")
  const tree = git(["mktree", "-z"], entries)
  return git(["commit-tree", tree, ...(parent ? ["-p", parent] : [])], "Synthetic review fixture\n")
}

test("a ledger cannot turn a failed, incomplete or different-scope review into coverage", () => {
  const source = "a".repeat(40), base = "b".repeat(40), head = "c".repeat(40), tree = "d".repeat(40)
  const record = { source, base, head, files: ["source.js"], log: "runs/fixture.ndjson" }
  const meta = { source, base, head, state: "returned", exitCode: 0, creditsEnabled: false, expectedFiles: 1 }
  const events = [{ type: "complete", status: "review_completed", outcome: "completed", findings: 0, reviewedFiles: ["source.js"] }]
  const facts = { source, paths: ["source.js"], headTree: tree, sourceTree: tree }
  assert.deepEqual(validateCompletedCliReceipt(record, meta, events, facts).paths, ["source.js"])
  const cases = [
    { meta: { ...meta, exitCode: 1 } },
    { meta: { ...meta, state: "running" } },
    { meta: { ...meta, creditsEnabled: true } },
    { events: [...events, { type: "error" }] },
    { events: [{ ...events[0], status: "review_in_progress" }] },
    { events: [{ ...events[0], findings: 1 }] },
    { events: [{ ...events[0], reviewedFiles: [] }] },
    { events: [events[0], events[0]] },
    { facts: { ...facts, paths: [] } },
    { facts: { ...facts, headTree: "e".repeat(40) } },
    { record: { ...record, log: "../private.ndjson" } },
    { record: { ...record, files: ["source.js", "source.js"] } },
  ]
  for (const changed of cases) assert.throws(() => validateCompletedCliReceipt(changed.record ?? record, changed.meta ?? meta, changed.events ?? events, changed.facts ?? facts), /retrospective/i)
})

test("a later reviewed label does not certify an earlier unreviewed routine", () => {
  const partial = [{ from: "unreviewed-routine", to: "routine-and-reviewed-label" }]
  assert.equal(reachableReviewedBlobs("inherited", partial).has("routine-and-reviewed-label"), false)
  assert.equal(reachableReviewedBlobs("inherited", [...partial, { from: "inherited", to: "unreviewed-routine" }]).has("routine-and-reviewed-label"), true)
  assert.equal(reachableReviewedBlobs("inherited", [...partial, { from: "inherited", to: "routine-and-reviewed-label" }]).has("routine-and-reviewed-label"), true)
  assert.equal(reachableReviewedBlobs(null, [{ from: null, to: "new-file" }]).has("new-file"), true)
  assert.equal(reachableReviewedBlobs("old", [{ from: null, to: "replacement" }, { from: "old", to: null }]).has("replacement"), true)
})

test("Git errors cannot become zero-file PRs or valid non-ancestor results", async (t) => {
    const { root: fixture, git, env } = await fixtureRepository(t)
    await writeFile(path.join(fixture, "source.txt"), "Inherited content\n")
    git(["add", "source.txt"]); git(["commit", "--quiet", "-m", "Fixture baseline"])
    const first = git(["rev-parse", "HEAD"])
    await writeFile(path.join(fixture, "source.txt"), "Changed content\n")
    git(["add", "source.txt"]); git(["commit", "--quiet", "-m", "Fixture change"])
    const second = git(["rev-parse", "HEAD"])
    const unrelated = git(["commit-tree", "HEAD^{tree}"], "Unrelated fixture root\n")
    assert.equal(isGitAncestor(first, second, fixture, env), true)
    assert.equal(isGitAncestor(unrelated, second, fixture, env), false)
    assert.deepEqual(readGitDiffPaths(second, second, fixture, env), [])
    assert.deepEqual(readGitDiffPaths(first, second, fixture, env), ["source.txt"])
    assert.throws(() => isGitAncestor("f".repeat(40), second, fixture, env), /unavailable/)
    // Delete only this test's loose parent object, reproducing a readable head
    // with an unavailable first parent. Real repository objects are untouched.
    const object = path.resolve(fixture, ".git/objects", first.slice(0, 2), first.slice(2))
    assert.ok(object.startsWith(fixture + path.sep))
    await rm(object)
    git(["cat-file", "-e", second])
    assert.throws(() => readGitDiffPaths(`${second}^1`, second, fixture, env), /read failed/)
})

test("a nested PR baseline permits wider proof without certifying parent work", async (t) => {
  const { root, git, env } = await fixtureRepository(t)
  const bootstrapCommit = commitFiles(git, { "source.js": "Inherited\n", "unchanged.js": "Stable\n" })
  const firstBase = commitFiles(git, { "source.js": "Parent work\n", "unchanged.js": "Stable\n", "new.js": "Parent addition\n" }, bootstrapCommit)
  const head = commitFiles(git, { "source.js": "Parent and child work\n", "unchanged.js": "Stable\n", "new.js": "Child edit\n" }, firstBase)
  const bootstrapTree = readGitTree(bootstrapCommit, { cwd: root, env })
  const inheritedTree = readGitTree(firstBase, { cwd: root, env })
  const current = readGitTree(head, { cwd: root, env })
  for (const file of ["source.js", "new.js"]) {
    const choice = selectReviewBaseline({ file, firstBase, inheritedTree, bootstrapTree, bootstrapCommit })
    assert.deepEqual(choice, { seed: bootstrapTree.get(file) ?? null, baseline: bootstrapCommit })
    const childOnly = { from: inheritedTree.get(file), to: current.get(file) }
    assert.equal(reachableReviewedBlobs(choice.seed, [childOnly]).has(current.get(file)), false)
    assert.equal(reachableReviewedBlobs(choice.seed, [{ from: choice.seed, to: current.get(file) }]).has(current.get(file)), true)
    assert.equal(reachableReviewedBlobs(choice.seed, [{ from: choice.seed, to: childOnly.from }, childOnly]).has(current.get(file)), true)
  }
  assert.deepEqual(selectReviewBaseline({ file: "unchanged.js", firstBase, inheritedTree, bootstrapTree, bootstrapCommit }), {
    seed: bootstrapTree.get("unchanged.js"), baseline: firstBase,
  })
})

test("Git diff and tree readers preserve literal names regardless of quotePath", async (t) => {
  const { root, git, env } = await fixtureRepository(t)
  const base = commitFiles(git, {})
  const names = ["café.js", " leading.js", "trailing.js ", "tab\tname.js", "line\nname.js", 'quote"name.js']
  const head = commitFiles(git, Object.fromEntries(names.map(name => [name, `Content for ${JSON.stringify(name)}\n`])), base)
  for (const quotePath of ["true", "false"]) {
    git(["config", "core.quotePath", quotePath])
    assert.deepEqual(readGitDiffPaths(base, head, root, env).sort(), [...names].sort())
    const tree = readGitTree(head, { cwd: root, env })
    assert.deepEqual([...tree.keys()].sort(), [...names].sort())
    for (const name of names) assert.equal(tree.get(name), git(["hash-object", "--stdin"], `Content for ${JSON.stringify(name)}\n`))
    const treeId = git(["rev-parse", `${head}^{tree}`])
    const admitted = validateCompletedCliReceipt(
      { source: head, base, head, log: "runs/literal-fixture.ndjson", files: names },
      { source: head, base, head, state: "returned", exitCode: 0, creditsEnabled: false, expectedFiles: names.length },
      [{ type: "complete", status: "review_completed", outcome: "completed", findings: 0, reviewedFiles: names }],
      { source: head, paths: readGitDiffPaths(base, head, root, env), sourceTree: treeId, headTree: treeId },
    )
    assert.deepEqual(admitted.paths, names)
    assert.equal(readGitTree("f".repeat(40), { cwd: root, optional: true, env }), null)
    assert.throws(() => readGitTree("f".repeat(40), { cwd: root, env }), /read failed/)
  }
})

test("review batch preparation preserves literal paths and the ordinary index", async (t) => {
  const { root, git, env } = await fixtureRepository(t)
  const retainedNames = ["café.js", "two words.js", "square[1].js", "square1.js", "comma,name.js"]
  const base = commitFiles(git, Object.fromEntries(retainedNames.map(name => [name, "Original\n"])))
  const names = [...retainedNames, "added.js"]
  const source = commitFiles(git, Object.fromEntries(names.map(name => [name, "Synthetic\n"])), base)
  const blob = git(["hash-object", "--stdin"], "Synthetic\n")
  git(["config", "core.quotePath", "true"])
  const folder = path.join(root, "output/coderabbit-coverage")
  await mkdir(folder, { recursive: true })
  await writeFile(path.join(folder, "batches.json"), JSON.stringify([{ id: "literal-fixture", source, paths: names.map(name => ({ path: name, baseline: base, blob })) }]))
  await writeFile(path.join(root, "unrelated.txt"), "Keep this staged work\n")
  git(["add", "unrelated.txt"])
  const beforeIndex = await readFile(path.join(root, ".git/index")).catch(error => { if (error.code === "ENOENT") return null; throw error })
  const beforeRefs = git(["for-each-ref", "refs/heads/"])
  const result = spawnSync(process.execPath, [path.resolve("scripts/prepare-coderabbit-review-batches.mjs")], { cwd: root, env, encoding: "utf8", windowsHide: true })
  assert.equal(result.status, 0, result.stderr)
  const [prepared] = JSON.parse(await readFile(path.join(folder, "prepared-batches.json"), "utf8"))
  assert.deepEqual(prepared.paths, [...names].sort())
  assert.deepEqual(readGitDiffPaths(prepared.base, prepared.head, root, env).sort(), [...names].sort())
  assert.deepEqual(readGitTree(prepared.head, { cwd: root, env }), readGitTree(source, { cwd: root, env }))
  assert.deepEqual(await readFile(path.join(root, ".git/index")).catch(error => { if (error.code === "ENOENT") return null; throw error }), beforeIndex)
  assert.equal(git(["for-each-ref", "refs/heads/"]), beforeRefs)
})

test("fixture readers remain isolated from the caller's Git repository and index", async () => {
  // Start a real child test runner instead of inheriting the parent's protocol.
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^GIT_/i.test(key) && key !== "NODE_TEST_CONTEXT"))
  const original = spawnSync("git", ["rev-parse", "--absolute-git-dir"], { env, encoding: "utf8", windowsHide: true })
  assert.equal(original.status, 0, "read the original repository identity without inherited redirects")
  const directory = original.stdout.trim()
  const index = path.join(directory, "index")
  const before = await readFile(index)
  // The selected cases cannot recurse into this worker-launching test. They
  // must read their fixture objects while the original index remains intact.
  const worker = spawnSync(process.execPath, [
    "--test", "--test-reporter=tap", "--test-name-pattern=^(Git errors|a nested PR|Git diff and tree|review batch preparation)",
    fileURLToPath(import.meta.url),
  ], {
    env: { ...env, GIT_DIR: directory, GIT_INDEX_FILE: index },
    encoding: "utf8", windowsHide: true, timeout: 120_000, maxBuffer: 4 * 1024 * 1024,
  })
  assert.deepEqual(await readFile(index), before, "fixture workers preserve the caller's real index")
  assert.equal(worker.status, 0, worker.stderr || worker.stdout)
  assert.match(worker.stdout, /# pass 4\b/, "all four isolated Git cases actually run")
})
