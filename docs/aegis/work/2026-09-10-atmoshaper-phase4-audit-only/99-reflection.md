# Phase 4 audit-only process reflection

Status: final repair cycle passes 64/64 focused checks; staging, a fresh full
suite and 115-route build, exact final-index readback, repeat independent
whole-branch reviews and coordinator commit remain.

- One shared stage-0 evidence engine kept all candidate reports deterministic and
  prevented ignored or unstaged workstation state from becoming evidence.
- Candidate absence is not deletion proof. Framework conventions, dynamic edges,
  generated inputs, provenance, compatibility carriers, provider ownership, and
  rollback all remain required corroboration for later bounded cleanup plans.
- Report byte identity and semantic counts are separate checks. Stable counts can
  coexist with changed location evidence, as the asset report demonstrated after
  evidence documentation entered the committed index.
- Date freshness guards must advance with the evidence date they police. The full
  suite correctly exposed the stale bound, and the minimum test-only repair restored
  alignment without changing runtime behavior.
- Inventory describes the index, not nearby worktree state. The first fully
  staged repair readback therefore anchors all four reports to one verified
  pre-receipt-synchronization identity. A versioned receipt cannot also embed the
  stable hash of an index containing its own updated blob; the final-index hashes
  belong in the ignored SDD handoff and user-facing completion receipt after one
  exact coordinator readback.
- Git-ignored SDD helpers still participate in `eslint .`; task-local CommonJS
  utilities need their lint boundary declared even though they never enter a commit.
- Large deterministic reports should stay ephemeral. Persist hashes, counts,
  uncertainty classes, and exact commands rather than candidate payloads.

The repair track corrected scanner classification and evidence quality with shared
rules and fixtures. The retirement track remains closed: every candidate is retained,
and no deletion, rename, upgrade, provider action, publication, or Phase 5 work is
authorized by this branch.

The final-review repair added two governance lessons. A policy that defines
privacy boundaries must itself enter through a small pre-policy trust boundary,
and every report in a family needs one mechanically tested public contract.
Negative fixtures also require both test scope and a policy-owned protected
prefix, so a test label alone cannot weaken active-code failure behavior.

The final repair cycle added three more. Lexical alias analysis needs an explicit
non-alias state and assignment invalidation or inner bindings can inherit false
authority. Static module ownership includes resolver calls as well as imports.
Framework conventions must follow the installed implementation: Next 16.2.12
accepts zero or one metadata-variant digit, so broader numeric matching would
hide multi-digit dead-code candidates. The earlier 59/59 capture remains useful
historical evidence but is superseded for current-tooling decisions.
