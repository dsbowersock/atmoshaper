import { readFile, writeFile, rm } from "node:fs/promises"
import { spawnSync } from "node:child_process"
import path from "node:path"

const folder = path.resolve("output/coderabbit-coverage")
const rangeBackfill = process.argv.length === 3 && process.argv[2] === "--range-backfill"
if (process.argv.length > 2 && !rangeBackfill) throw new Error("Use only --range-backfill for the supplemental range manifest")
const batches = JSON.parse(await readFile(path.join(folder, "batches.json"), "utf8"))
const prepared = []

/** Creates local review objects only. The worktree, normal index, branches and
 * remote refs remain untouched; review-only refs must never be published. */
function git(args, { input, index } = {}) {
  const result = spawnSync("git", args, {
    encoding: "utf8",
    input,
    env: index ? { ...process.env, GIT_INDEX_FILE: index } : process.env,
    maxBuffer: 16 * 1024 * 1024,
    windowsHide: true,
  })
  if (result.status !== 0) throw new Error(`Review preparation failed at git ${args[0]}: ${result.stderr}`)
  return result.stdout.trimEnd()
}

/** Preserve each baseline path's real mode and blob, including absent/new files. */
function entry(commit, file) {
  const raw = git(["ls-tree", "-z", commit, "--", file])
  if (!raw) return null
  const match = /^(\d+) blob ([a-f0-9]{40})\t([^\0]+)\0$/.exec(raw)
  if (!match || match[3] !== file) throw new Error(`Unsupported review path: ${file}`)
  return { mode: match[1], blob: match[2] }
}

for (const batch of batches) {
  if (!/^[a-z0-9-]+$/.test(batch.id) || !/^[a-f0-9]{40}$/.test(batch.source)) {
    throw new Error("Invalid frozen batch identity")
  }
  const index = path.join(folder, `review-index-${batch.id}`)
  const sourceTree = git(["rev-parse", `${batch.source}^{tree}`])
  const targets = batch.paths.map(item => item.path).sort()
  if (new Set(targets).size !== targets.length || targets.length > 70) throw new Error("Invalid batch size")
  // Refuse an unfinished prior index rather than silently replacing its evidence.
  await writeFile(index, "", { flag: "wx" })
  await rm(index)
  try {
    git(["read-tree", batch.source], { index })
    for (const item of batch.paths) {
      const current = entry(batch.source, item.path)
      if (current?.blob !== item.blob) throw new Error(`Frozen source changed: ${item.path}`)
      const baseline = entry(item.baseline, item.path)
      if (baseline) {
        git(["update-index", "--add", "--cacheinfo", `${baseline.mode},${baseline.blob},${item.path}`], { index })
      } else {
        git(["update-index", "--force-remove", "--", item.path], { index })
      }
    }
    const baseTree = git(["write-tree"], { index })
    const changed = git(["diff", "--name-only", "--no-renames", baseTree, sourceTree]).split("\n").filter(Boolean).sort()
    if (JSON.stringify(changed) !== JSON.stringify(targets)) throw new Error(`Cohort diff does not match its manifest: ${batch.id}`)
    const base = git(["commit-tree", baseTree, "-p", batch.source], {
      input: `Review-only baseline for ${batch.id}\n\nSynthetic per-file baselines. Never merge or deploy.\n`,
    })
    const head = git(["commit-tree", sourceTree, "-p", base], {
      input: `Review-only frozen shipped source for ${batch.id}\n\nTree equals ${batch.source}. Never merge or deploy.\n`,
    })
    const ref = `refs/codex/review-only/2026-11-21/${batch.id}`
    git(["update-ref", ref, head])
    if (git(["rev-parse", `${head}^{tree}`]) !== sourceTree) throw new Error("Review head differs from shipped source")
    prepared.push({ id: batch.id, source: batch.source, sourceTree, base, head, ref, paths: targets })
  } finally {
    // Exact task-owned temporary files only; no recursive cleanup or branch removal.
    await rm(index, { force: true })
    await rm(`${index}.lock`, { force: true })
  }
}

await writeFile(path.join(folder, rangeBackfill ? "range-prepared-batches.json" : "prepared-batches.json"), JSON.stringify(prepared, null, 2))
console.log(JSON.stringify(prepared.map(({ id, paths, sourceTree }) => ({ id, files: paths.length, sourceTree })), null, 2))
