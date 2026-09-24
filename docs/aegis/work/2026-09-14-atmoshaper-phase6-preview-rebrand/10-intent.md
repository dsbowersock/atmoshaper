# Phase 6 preview rebrand intent

## TaskStartSnapshot

- Repository: AtmoShaper repository root; local checkout path intentionally omitted
- Branch: `codex/atmoshaper-phase6-preview-rebrand`
- Phase 6 approved-design HEAD:
  `1c3683c31dcb8624a61d749fbcacddd85973dbe2`
- Merged base and tracked `origin/main`:
  `cdfa99e49cebf100fac1a5080d60514806eb17db`
- Phase 5 reviewed feature parent:
  `b25b817da126359c5ffc15954182cc9573413735`
- Phase 5 integration: PR #4 merged at `2026-09-14T10:49:49-04:00`
  as `cdfa99e49cebf100fac1a5080d60514806eb17db`
- Worktree before planning: clean; branch ahead of `origin/main` by the one
  approved-design commit; no active Git operation

## Intent lock

Make `AtmoShaper` the coherent current public product identity, make
`Atmosphere` the coherent current audio-feature identity, remove old brand
imagery when no approved replacement exists, and migrate current legal
presentation to the exact approved DBA identity without rewriting historical
legal evidence or compatibility contracts.

## Scope fence

Allowed:

- The approved Phase 6 spec, detailed implementation plan, current authority,
  Aegis work records, ADR amendment, and deterministic brand-audit baseline.
- Current product/feature/legal presentation in source, tests, metadata,
  accessibility, offline/PWA, media-session, and Browser-QA surfaces.
- Text-only AtmoShaper fallback with explicit null brand assets.
- One dependency-free Atmosphere public-label owner.
- Exact deterministic v2 legal archives followed by new approved v3 current
  versions and old/new acceptance coexistence tests.
- Exact catalog display-name changes and current publisher prose while stable
  IDs, ownership, entitlements, commerce mappings, assets, and settings remain.
- New separately named Phase 6 browser/visual oracle.

Not allowed:

- Global replacement, invented assets, logo design, favicon/install-icon change,
  final-logo integration, route/layout/feature redesign, or domain-language loss.
- Canonical domain, support/social address, OAuth, trusted-origin, webhook,
  Calendar, provider, Stripe, email-provider, R2, Sentry, Vercel, Neon, DNS, or
  production mutation.
- Environment, package, Prisma, storage/cache/vault, auth/security, persisted
  setting, export, media, release, audit, operation, internal `atmoshaper`, or
  other compatibility identifier migration.
- Database backfill, acceptance-row deletion/rewrite, schema or migration change,
  production data access, historical document/log/snapshot rewrite, push, PR,
  merge, or deployment without the applicable later gate.

## BaselineReadSetHint

- `AGENTS.md`
- `docs/project-state.md`
- `docs/project-log.md`
- `docs/wiki/index.md`
- `docs/superpowers/specs/2026-09-14-atmoshaper-phase6-preview-rebrand-design.md`
- `docs/superpowers/plans/2026-09-14-atmoshaper-phase6-preview-rebrand.md`
- `docs/decisions/0002-public-identity-legal-and-compatibility-boundaries.md`
- Current product, SEO, legal, Atmosphere, background, audit, and Browser-QA
  owners named by the plan

## BaselineUsageDraft

- Required refs: every BaselineReadSetHint entry
- Acknowledged before planning: all current authority, approved design, runtime
  owners, focused tests, audit policy, and browser-lane owners; project log read
  through bounded current/recent sections
- Cited in plan: exact owners, compatibility values, legal sequence, task file
  groups, tests, review gates, rollback, and external stop points
- Missing refs: none for local work; a fresh disposable QA project is
  intentionally absent until separately authorized
- Decision: proceed with the local planning package

## ImpactStatementDraft

- User-visible impact: current platform copy becomes AtmoShaper; current mixer
  copy becomes Atmosphere; old wordmark/social imagery disappears; three exact
  catalog labels change; current legal copy uses the approved DBA identity.
- Architecture impact: reuse the product owner, add one noun-only feature owner,
  add evidence-only deterministic legal archives, and tighten occurrence-level
  audit classification.
- Compatibility impact: external endpoints, providers, identifiers, persistence,
  old acceptance rows, historical evidence, icons, routes, and behavior remain.
- External impact: none during local design/planning/implementation. Disposable
  QA, publication, merge, deployment, provider/domain changes, and logo assets
  remain separately gated.

## TDD route

- Mode: off.
- Decision: strict RED/GREEN is skipped for the approved semantic migration.
- Verification: focused contracts accompany each coherent owner slice; existing
  behavior tests and broad local gates remain; any discovered behavior defect
  first receives a focused failing regression.
