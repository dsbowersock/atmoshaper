# Phase 6 preview rebrand checkpoint

## 2026-09-14 — Written spec approved; implementation plan self-reviewed

- Completed: Phase 5 PR #4 was merged as
  `cdfa99e49cebf100fac1a5080d60514806eb17db`; the Phase 6 branch starts from
  that exact merge. The user approved the text-only AtmoShaper product identity,
  Atmosphere feature label, exact DBA wording, and exact background-label
  amendments. The approved design is committed as `1c3683c`.
- Active slice: planning and authority synchronization only. No application,
  legal, catalog, provider, database, asset, or hosted state has changed.
- Planning result: the implementation plan groups work by canonical owner and
  semantic copy class, archives legal v2 before v3 mutation, protects external
  and durable identifiers, retains the historical parity oracle, and defines
  local, disposable-browser, publication, review, and merge gates.
- TDD route: off for this specified semantic migration; focused contracts and
  broad regression gates are mandatory. A discovered behavior defect uses a
  focused regression-first repair.
- Execution route: subagent-driven, as selected by the user. Each implementation
  task uses a fresh implementer followed by independent specification and
  quality review; the coordinator alone stages and commits.
- Plan review: the Superpowers/Aegis self-review found and corrected wildcard
  background ownership, open-ended leftover source edits, conditional legal-owner
  mutation, undefined browser-lane placement, and undefined snapshot ownership.
  The final plan has an exact effect-source review set, routes true residual misses
  back to their owning reviewed task, keeps `lib/legal-acceptance.js` unchanged
  absent a separately reviewed plan amendment, assigns both new browser projects
  to lane 3, and names the new Phase 6 oracle directory/assertions.
- The final structural pass then found missing explicit Task 10/11 start
  snapshots and Task 11 rollback. The plan now contains all twelve task
  headings, twelve rollback sections, twelve start snapshots, and no TBD/FIXME
  placeholder.
- Verification: focused project-state and repository-audit tests passed 36/36;
  `git diff --cached --check` identified only one trailing blank line in the new
  intent file, which this update removes. The staged brand baseline reached a
  byte-identical generated fixed point after the expected two-entry self-reference
  line shift. Current totals are 26,462 entries: 22,909 compatibility, 1,563
  historical, 42 legal, and 1,948 pre-rebrand public-copy; missing and
  unclassified are both zero. The public-copy total correctly remains unchanged
  because application implementation has not begun.
- Current todo: repeat final diff/audit checks, commit the planning package, then
  capture the clean pre-implementation measurement before dispatching Task 1.
- External gates: no new Neon project, production data access, push, PR, merge,
  deployment, provider/domain change, or logo integration is authorized by this
  planning transition.

## ResumeStateHint

Resume on `codex/atmoshaper-phase6-preview-rebrand`. Re-read `10-intent.md`, this
checkpoint, the approved Phase 6 spec and implementation plan, current project
state, and exact Git status. Confirm the plan/spec planning commit is present and
the worktree is clean before capturing Task 0 baseline. Do not begin Browser QA,
publication, merge, deployment, provider/domain work, or final-logo integration
without the applicable later authorization.

## DriftCheckDraft

- Original intent: aligned
- Scope fence: aligned; planning/authority documents only
- Compatibility boundary: explicit and unchanged
- Owner/fallback/addition: product owner reused; noun-only feature owner and
  evidence-only legal archive justified; no other fallback/adapter proposed
- Retirement track: old current copy/assets retire; historical/provider/durable
  values remain with explicit tests
- Evidence sufficiency: plan self-review, focused tests, and fixed-point audit
  passed; final staged checks and planning commit remain
- Decision: commit the planning package after final checks; no runtime
  implementation yet
