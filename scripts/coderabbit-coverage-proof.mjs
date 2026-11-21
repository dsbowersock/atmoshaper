import { spawnSync } from "node:child_process"

/** Read local Git data. Optional missing historical objects cannot prove coverage;
 * process-launch failures always stop the audit. No network or checkout occurs. */
export function readGit(args, { cwd = process.cwd(), optional = false } = {}) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, windowsHide: true })
  if (result.error) throw new Error(`Git coverage command could not start: ${args[0]}`, { cause: result.error })
  if (result.status !== 0) {
    if (optional) return null
    throw new Error(`Git coverage read failed: ${args[0]}`)
  }
  return result.stdout
}

/** Git status 1 means a valid non-ancestor; every other failure is unavailable
 * evidence and must stop source-scope enumeration instead of dropping a PR. */
export function isGitAncestor(ancestor, descendant, cwd = process.cwd()) {
  const result = spawnSync("git", ["merge-base", "--is-ancestor", ancestor, descendant], { cwd, encoding: "utf8", windowsHide: true })
  if (result.error) throw new Error("Git ancestry command could not start", { cause: result.error })
  if (result.status === 0) return true
  if (result.status === 1) return false
  throw new Error("Git ancestry evidence is unavailable")
}

/** An actual empty diff is valid; an unreadable first parent is never an empty PR. */
export function readGitDiffPaths(base, head, cwd = process.cwd()) {
  return readGit(["diff", "--name-only", "--no-renames", base, head], { cwd }).trim().split("\n").filter(Boolean)
}

/** Follow reviewed content transitions from the inherited pre-change baseline.
 * A later label-only range cannot certify an earlier unreviewed routine in its
 * base. Null represents an absent/new file. Order and review timestamps do not
 * confer coverage; a complete reviewed chain or wider reviewed range does.
 * @param {string|null} seed
 * @param {{from:string|null,to:string|null}[]} transitions */
export function reachableReviewedBlobs(seed, transitions) {
  const reached = new Set([seed])
  let changed = true
  while (changed) {
    changed = false
    for (const edge of transitions) {
      if (reached.has(edge.from) && !reached.has(edge.to)) {
        reached.add(edge.to)
        changed = true
      }
    }
  }
  return reached
}
