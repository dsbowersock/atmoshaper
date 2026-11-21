import { spawnSync } from "node:child_process"

/** Read local Git data. Optional missing historical objects cannot prove coverage;
 * process-launch failures always stop the audit. No network or checkout occurs.
 * Fixtures supply their sanitized environment for reads as well as writes. */
export function readGit(args, { cwd = process.cwd(), optional = false, env = process.env } = {}) {
  const result = spawnSync("git", args, { cwd, env, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, windowsHide: true })
  if (result.error) throw new Error(`Git coverage command could not start: ${args[0]}`, { cause: result.error })
  if (result.status !== 0) {
    if (optional) return null
    throw new Error(`Git coverage read failed: ${args[0]}`)
  }
  return result.stdout
}

/** Git status 1 means a valid non-ancestor; every other failure is unavailable
 * evidence and must stop source-scope enumeration instead of dropping a PR. */
export function isGitAncestor(ancestor, descendant, cwd = process.cwd(), env = process.env) {
  const result = spawnSync("git", ["merge-base", "--is-ancestor", ancestor, descendant], { cwd, env, encoding: "utf8", windowsHide: true })
  if (result.error) throw new Error("Git ancestry command could not start", { cause: result.error })
  if (result.status === 0) return true
  if (result.status === 1) return false
  throw new Error("Git ancestry evidence is unavailable")
}

/** An actual empty diff is valid; an unreadable first parent is never an empty
 * PR. NUL framing preserves literal names, including whitespace and newlines. */
export function readGitDiffPaths(base, head, cwd = process.cwd(), env = process.env) {
  return readGit(["diff", "--name-only", "--no-renames", "-z", base, head], { cwd, env }).split("\0").filter(Boolean)
}

/** Reads exact tree identities without checkout. Use Git's default NUL-framed
 * records: custom %(path) formatting can still quote names even with -z. */
export function readGitTree(commit, { cwd = process.cwd(), optional = false, env = process.env } = {}) {
  const raw = readGit(["ls-tree", "-r", "-z", commit], { cwd, optional, env })
  return raw === null ? null : new Map(raw.split("\0").filter(Boolean).map(line => {
    const at = line.indexOf("\t")
    const header = /^(\d{6}) (?:blob|commit) ([a-f0-9]+)$/.exec(line.slice(0, at))
    if (!header || at === line.length - 1) throw new Error("Invalid Git coverage tree record")
    return [line.slice(at + 1), header[2]]
  }))
}

/** Chooses the pre-change seed without treating a branch's existing changes as
 * inherited evidence. A nested PR's first parent may contain unreviewed parent
 * work: fall back to the real bootstrap blob (null for a new file) and commit.
 * Callers still need a complete reviewed transition chain from that seed. */
export function selectReviewBaseline({ file, firstBase, inheritedTree, bootstrapTree, bootstrapCommit }) {
  const seed = inheritedTree.get(file) ?? null
  const bootstrapSeed = bootstrapTree.get(file) ?? null
  return seed === bootstrapSeed
    ? { seed, baseline: firstBase }
    : { seed: bootstrapSeed, baseline: bootstrapCommit }
}

/** Validate identities before using a ledger's log path or Git revision. The
 * server's raw completion and independently read Git facts are checked below. */
export function assertCliReceiptIdentity(record, source) {
  if (record?.source !== source || !/^runs\/[a-z0-9-]+\.ndjson$/.test(record?.log)
    || ![record?.base, record?.head].every(value => /^[a-f0-9]{40}$/.test(value))
    || !Array.isArray(record?.files) || record.files.length === 0
    || record.files.some(file => typeof file !== "string") || new Set(record.files).size !== record.files.length) {
    throw new Error("Invalid retrospective receipt identity")
  }
}

/** A selected-file table or local success flag is insufficient. Admit only one
 * actual completed outcome, matching issue count, clean attempt result, exact
 * reviewed/Git path sets and the whole frozen source tree. Git facts must come
 * from independent required reads, never from fields asserted by the ledger. */
export function validateCompletedCliReceipt(record, meta, events, { source, paths, headTree, sourceTree }) {
  assertCliReceiptIdentity(record, source)
  const complete = events.filter(event => event.type === "complete")
  const issues = events.filter(event => event.type === "finding")
  if (meta?.state !== "returned" || meta.exitCode !== 0 || meta.creditsEnabled !== false
    || meta.base !== record.base || meta.head !== record.head || meta.source !== source
    || meta.expectedFiles !== record.files.length || events.some(event => event.type === "error")
    || complete.length !== 1 || complete[0].status !== "review_completed"
    || complete[0].outcome !== "completed" || complete[0].findings !== issues.length) {
    throw new Error("Retrospective review did not complete")
  }
  const expected = [...record.files].sort(), actual = complete[0].reviewedFiles
  if (!Array.isArray(actual) || new Set(actual).size !== actual.length
    || JSON.stringify([...actual].sort()) !== JSON.stringify(expected)
    || !Array.isArray(paths) || JSON.stringify([...paths].sort()) !== JSON.stringify(expected)
    || !/^[a-f0-9]{40}$/.test(headTree) || headTree !== sourceTree) {
    throw new Error("Retrospective review scope mismatch")
  }
  return { kind: "cli", base: record.base, head: record.head, at: meta.returnedAt, paths: record.files, selected: actual.length, parsed: actual.length }
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
