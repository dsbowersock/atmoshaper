# Phase 4 audit-only intent

## TaskStartSnapshot

- Repository: AtmoShaper repository root; local checkout path intentionally omitted
- Branch: `codex/atmoshaper-dead-code-audit`
- Merged base and branch-creation `HEAD`:
  `7c07e4578307508ae2bdb784c4d7ad0d9fb64c65`
- Task 1 starting `HEAD`: planning commit
  `e27c1d0ce941fbf9610389b45b9a30c82caac873`
- Tracked `origin/main`: `7c07e4578307508ae2bdb784c4d7ad0d9fb64c65`
- Worktree: clean; one checkout; no active Git operation observed
- Phase 3 integration: PR #2 merged at `2026-09-10T00:57:48Z` as
  `7c07e4578307508ae2bdb784c4d7ad0d9fb64c65`; its reviewed head was
  `9d2a8eca057f33354f2cbb50263c8e4f365a00f1`
- Review branch retained: `codex/atmoshaper-docs-consolidation`

## Intent lock

Build deterministic, read-only repository audits that identify possible dead code,
dependency, asset, and environment-configuration cleanup candidates. Phase 4 may
collect and reconcile evidence, but its reports are advisory: no candidate has
deletion approval, and no finding may be treated as deletion authority.

## Scope fence

Allowed:

- Current-authority, lineage, audit-evidence, and checkpoint documentation.
- Repository-owned cleanup-audit policy, shared static-analysis helpers, and thin
  command-line entry points.
- Focused audit tests and package-script wiring that do not change dependency
  versions or the lockfile.
- Read-only inspection of tracked repository content and sanitized, deterministic
  reporting of candidate paths, dependency names, asset references, and
  environment-variable names.
- Deterministic repository-inventory and brand-baseline reconciliation after the
  audit-only documentation and tooling are final.

Not allowed:

- Deleting, renaming, moving, retiring, or rewriting any candidate.
- Runtime, route, component, schema, migration, compatibility-identifier, asset,
  dependency-version, package-lock, workflow, or legal changes.
- Reading or emitting secret values, private provider identifiers, database rows,
  connection strings, absolute local paths, ignored or untracked filenames, or
  stack traces in audit reports.
- Pushes, pull requests, merges, deployments, provider writes, database writes or
  migrations, DNS or domain changes, live payment or email activity, media
  mutation, production changes, or legal cutover.

## Acceptance

- Current authority records the exact PR #2 merge, reviewed head, retained review
  branch, and active audit-only branch.
- Each cleanup audit is deterministic, reads canonical tracked content, and
  distinguishes findings from failures without authorizing deletion.
- Reports contain no source lines, values, secrets, private identifiers, or local
  absolute paths.
- Focused audit tests, repository inventory, brand audit, typecheck, lint, unit
  tests, production build, and whitespace verification pass at final local
  closeout.
- The final Phase 4 branch changes audit tooling and evidence only; no candidate is
  deleted, renamed, upgraded, or retired.
- Phases 5–10 remain unstarted and separately gated.

## TDD route

- Mode: off.
- Decision: strict RED/GREEN is skipped because this phase adds deterministic
  diagnostic tooling and evidence without changing runtime behavior.
- Test posture: focused audit-contract tests accompany implementation, followed by
  the full repository regression suite before local closeout.
