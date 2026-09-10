# Phase 3 documentation consolidation intent

## TaskStartSnapshot

- Repository: AtmoShaper repository root; local checkout path intentionally omitted
- Branch: `codex/atmoshaper-docs-consolidation`
- Base and starting `HEAD`: `f59e1b9371b06e7401740ae011f6dc911430a97c`
- Tracked `origin/main`: `f59e1b9371b06e7401740ae011f6dc911430a97c`
- Worktree: clean; one checkout; no active Git operation observed
- Bootstrap integration: PR #1 merged on 2026-09-09 at `2026-09-09T09:36:44Z` by `dsbowersock`
- Review branch retained: `codex/bootstrap-atmoshaper`

## Intent lock

Consolidate AtmoShaper's inherited documentation into a concise current authority
layer while retaining every record whose replacement or historical ownership is
uncertain. Establish an architecture owner map and explicit migration decisions,
remove only evidence-cleared duplicate plans from the fresh repository, and make
the current state accurately describe the merged bootstrap.

## Scope fence

Allowed:

- Markdown documentation and ADR creation or correction.
- Omission of the 16 exact superseded plans enumerated in the Phase 3 plan.
- Deterministic reconciliation of the repository's legacy-brand baseline for the
  documentation-only changes.
- Tests and audits that read repository content without changing runtime behavior.

Not allowed:

- Runtime, route, component, schema, migration, configuration, workflow, asset,
  dependency, or package-lock changes.
- Public runtime rebranding, global text replacement, legal text or operator
  changes, provider writes, deployment, DNS, production data, payment, email,
  media, or old-origin mutation.
- Removal of migration parity assets, uncertain documents, specifications, or
  test-consumed plans.

## Acceptance

- Current architecture and decision ownership is findable from the README and wiki.
- Four migration ADRs distinguish accepted evidence from proposed future work.
- Account-security rules reflect current code and tests rather than superseded
  implementation recipes.
- Exactly 16 evidence-cleared inherited plans are omitted; 106 inherited plans,
  the new Phase 3 plan, and all 28 inherited specifications remain.
- All omitted history remains available at the immutable MassageLab source commit.
- Current authority records PR #1's exact merge and Phase 3's boundary accurately.
- Inventory and brand audits pass with no missing or unclassified references.
- The full typecheck, lint, unit-test, and production-build gates pass.
- Final diff contains no runtime or restricted path.

## TDD route

- Mode: off.
- Decision: strict RED/GREEN is skipped because the work is documentation and
  deterministic repository-policy maintenance, not runtime behavior.
- Test posture: focused repository audits and content assertions after each task,
  then the full repository verification suite before completion.
