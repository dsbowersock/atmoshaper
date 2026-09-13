# Phase 5 public product identity intent

## TaskStartSnapshot

- Repository: AtmoShaper repository root; local checkout path intentionally omitted
- Branch: `codex/atmoshaper-public-product-identity`
- Merged base and branch-creation `HEAD`:
  `a43d1a315e95d80d6570fb5e49d1e2dce5ce7ddb`
- Tracked `origin/main`: `a43d1a315e95d80d6570fb5e49d1e2dce5ce7ddb`
- Phase 4 reviewed head: `69ff135aed8d0b1ecb43c054595d1e08e89a22b1`
- Phase 4 integration: PR #3 merged at `2026-09-13T17:56:59Z` by
  `dsbowersock` as `a43d1a315e95d80d6570fb5e49d1e2dce5ce7ddb`
- Worktree before branch creation: clean; one checkout; no active Git operation
- Retained prior branch: `codex/atmoshaper-dead-code-audit`

## Intent lock

Create and verify one data-only owner for the current public product name and
the brand-image paths used by SEO and the application shell. Rewire only the
approved presentation consumers while preserving all observable output. This
branch prepares Phase 6 but does not perform a rebrand.

## Scope fence

Allowed:

- The approved design, implementation plan, project-state/log/register records,
  and resumable Aegis work records.
- One side-effect-free `lib/public-product-identity.js` owner.
- SEO identity, manifest/root metadata, app-bar/mobile-main-bar identity, and PWA
  install presentation consumers.
- Focused identity/consumer tests and existing regression tests whose source-shape
  assertions must follow the new owner without losing behavior coverage.
- Read-only repository/brand audits and local verification.

Not allowed:

- Changing any rendered `MassageLab` value, descriptive route copy, image bytes,
  route, layout, accessibility behavior, provider call or persisted value.
- Legal, support-address, canonical-domain, trusted-origin, OAuth, webhook,
  Calendar, email, Vercel, Neon, Stripe, Sentry, R2 or DNS ownership changes.
- Auth, billing, database, environment-variable, storage, cache, vault, media,
  export, audit, operation or internal `atmoshaper` identifier migration.
- Component/file renames, dependency/lockfile/schema/migration/workflow changes,
  hosted provider mutation, deployment, Phase 6 values, push, PR or merge without
  the applicable later gate.

## BaselineReadSetHint

- `AGENTS.md`
- `docs/project-state.md`
- `docs/project-log.md`
- `docs/wiki/index.md`
- `docs/superpowers/specs/2026-09-06-atmoshaper-repository-migration-design.md`
- `docs/rebrand/atmoshaper-refactor-register.md`
- `docs/superpowers/plans/2026-09-10-atmoshaper-phase4-audit-only.md`
- Current identity consumers and their focused/browser tests named in the design

## BaselineUsageDraft

- Required refs: all BaselineReadSetHint entries above
- Acknowledged before design: all required authority, phase-boundary and consumer
  refs; project log was read by bounded current/recent windows because it contains
  large historical receipts
- Cited in design: parent migration design, current owners, and existing test
  oracles
- Missing refs: none for written-spec review
- Decision: continue to written-spec review; implementation remains gated

## ImpactStatementDraft

- User-visible impact: none; all affected output remains `MassageLab` and keeps the
  current images and geometry
- Architecture impact: one canonical data owner replaces bounded duplicated
  presentation tokens
- Compatibility impact: all legal, provider, persistence and internal identifiers
  remain with their current owners
- External impact: none during design/planning; provider resources, push, PR,
  merge, deployment and rebrand remain separately gated

## TDD route

- Mode: off.
- Decision: strict RED/GREEN is skipped because this is a behavior-preserving
  ownership refactor with strong existing behavior oracles rather than a requested
  bug fix.
- Verification: add a focused owner-contract test, retain existing focused tests,
  and run broad unit/build/browser/audit gates without snapshot updates.
