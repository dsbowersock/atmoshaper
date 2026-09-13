# Phase 5 public product identity evidence

## 2026-09-13 — Authorized empty-project Browser QA

- Authority and boundary: the user separately authorized creation, use and
  deletion of a temporary empty Neon QA project. Production data and production
  mutation remained excluded.
- Isolation and migration proof: the accepted project was new, independently
  identified and distinct from production. It had zero tables before migration,
  received exactly 46/46 committed migrations, and its applied migration names
  matched the committed migration-directory names. All 134 application tables
  contained zero rows before Browser QA.
- Browser build and run: `npm run build:browser-qa` completed immediately before
  `npm run test:browser -- tests/browser/pwa.spec.ts tests/browser/app-shell.spec.ts`.
  The exact selection enumerates 152 cases. Playwright's final receipt recorded
  status `passed` and an empty failed-test list. No snapshot update or runtime
  correction occurred.
- Postcondition and cleanup: exact counts remained zero across all 134
  application tables after Browser QA. The cycle-owned temporary project was
  deleted and a fresh project listing proved it absent. A separate listing
  confirmed the existing production project remained present. No production
  data was supplied, copied, read or altered.
- Privacy: no connection string, credential, fingerprint, database row, private
  provider identifier or local absolute path is recorded here.
- Remaining boundary: publication, PR creation, hosted review, merge, deployment
  and Phase 6 remain separate gates.

## 2026-09-13 — Implementation and broad local verification

The approved [design](../../../superpowers/specs/2026-09-13-atmoshaper-public-product-identity-design.md)
and [plan](../../../superpowers/plans/2026-09-13-atmoshaper-public-product-identity.md)
own this bounded local refactor. The earlier sections below remain historical
planning and baseline receipts.

| Slice | Exact commit | Result |
| --- | --- | --- |
| Planning | `dc42f074df48817f5bbbfe60576d1f81abbd5559` | Approved design and independently approved plan |
| Pre-implementation evidence | `e878432d5b2ad213ee887645e3b202fd65f56eb1` | Clean pre-code inventory/build baseline recorded |
| Task 1 | `c1715d24eefd12d05f38b7c90d1d16954ea9c039` | Frozen dependency-free identity owner and focused contract; specification and quality reviews approved with no findings |
| Task 2 | `ad0ae618648138295935cc701629369cc19481d7` | SEO compatibility exports/Open Graph alt, manifest names and Apple title delegated; 14/14 focused tests and typecheck passed; specification and quality reviews approved with no findings |
| Task 3 | `c9acf0fdcbfa7be8cb1fa3e004fa462054e27131` | App-bar label/assets, mobile navigation label and install action/title/iOS guidance delegated; 48/48 focused tests and typecheck passed; specification and quality reviews approved with no findings |

- Branch-wide focused command: `node --test tests/public-product-identity.test.mjs tests/seo.test.mjs tests/app-settings.test.mjs tests/pwa-install.test.mjs`;
  result 58/58 passed.
- `npm run prisma:validate`, `npm run prisma:generate`, `npm run typecheck`
  and `npm run lint` passed. Lint emitted only the existing Babel deoptimization
  note for `app/chimer/running-timer.tsx`.
- `npm run test`: 4,557 total, 4,554 passed, 3 expected skips, zero failures;
  duration 527,763.2615 ms.
- Post-code `npm run build`: Next.js 16.2.12 compilation and TypeScript passed;
  115/115 static pages generated and final route table completed; exit 0.
  The existing non-fatal `ANATOMIME_POLL_SHEDDER` initialization message appeared.
  Route count is unchanged. Prisma generation and builds left the worktree clean
  before these documentation edits.

### Post-code inventory observation

- `npm run repository:inventory`: 1,954 files, 48,276,437 tracked Git blob bytes,
  zero forbidden paths; inventory SHA-256
  `7b9b988b1316d3f75de31547ad07f44492ff990f59aa5d292dfe6e3d3f96e292`.
- Baseline: 1,952 files, 48,267,941 bytes and 115 pages. Delta: +2 files,
  +8,496 bytes and no route-count change. These observations make no performance
  claim. This inventory precedes Task 4 documentation and baseline staging;
  it is not the final staged-index identity.

### Retirement, rollback and remaining gates

- No runtime output changed: every affected value remains `MassageLab`, with
  the same assets, routes, layout, accessibility and install behavior. SEO
  exports remain compatibility adapters.
- Only mapped inline presentation copies retired. Legal, support, domain,
  provider, persistence, auth, billing, environment, storage, media, audit,
  historical and internal identifiers remain with their existing owners.
- Rollback: revert the three task commits or branch, restore mapped inline
  copies and remove the identity owner/test; no external rollback is required.
- Brand staged-baseline fixed point: 26,426 entries — 22,909 compatibility,
  1,527 historical, 42 legal and 1,948 pre-rebrand public-copy. A fresh generated
  candidate was byte-identical at SHA-256
  `5a296f0fee272509f76526d179106d6525de913d0015300b628fb96621856371`.
- The local Phase 5 identity slice and both complete-branch final specification
  and code-quality reviews passed. Final Aegis quality review covered Phase 4
  base `a43d1a3` through the complete worktree at `c9acf0f`, with no critical,
  important or minor findings. It independently confirmed zero missing or
  unclassified brand references and the byte-identical staged baseline above.
  This is local quality approval only; fresh Browser QA is the next separately
  authorized gate.
- Browser QA is not claimed. No independent empty QA environment is currently
  proven. A future separately authorized empty temporary QA lifecycle must run
  `npm run build:browser-qa` immediately before
  `npm run test:browser -- tests/browser/pwa.spec.ts tests/browser/app-shell.spec.ts`.
  Do not reuse production or update snapshots.
- No provider resource, production data, deployment, Phase 6 rebrand, push, PR
  or merge changed or was authorized by this local closeout.

## 2026-09-13 — Baseline and design evidence

- GitHub PR #3 is merged. Remote `main` and the verified merge commit are
  `a43d1a315e95d80d6570fb5e49d1e2dce5ce7ddb`; its second parent is exact reviewed
  Phase 4 head `69ff135aed8d0b1ecb43c054595d1e08e89a22b1`.
- The Phase 5 branch was absent locally and remotely before creation, and was
  created from the exact merge commit after a clean one-worktree snapshot.
- The migration design requires one subsystem per Phase 5 branch, an observable
  behavior contract, focused and broad verification, explicit old-path retirement,
  measurements without unsupported performance claims, and rollback.
- The refactor register identifies public product identity as an evidence-backed
  medium-risk candidate and warns against global replacement of legal, provider,
  private or compatibility identifiers.
- Current bounded duplication exists in SEO identity, manifest/root metadata,
  app-bar/mobile-main-bar labels and assets, and PWA installation presentation.
- Existing focused tests cover SEO, one responsive app-bar link, install
  eligibility/menu placement, and PWA behavior. Browser tests cover the served
  manifest and responsive app-shell brand geometry; migration parity covers the
  current visible baseline without authorizing snapshot updates.
- Independent written-spec review returned Approved with no blocking issues. The
  reviewer confirmed the bounded subsystem, data-only owner, exclusions,
  verification and reversible inline-value retirement; its three advisory test
  details were incorporated.
- The exact staged brand baseline contains 26,406 entries: 22,905 compatibility,
  1,507 historical, 42 legal and 1,952 pre-rebrand public-copy entries. A fresh
  candidate was byte-identical at SHA-256
  `c1e227be8a455103402507d11b39a97e320ce0dcfcdfa161a30259cbc2219e0a`.
- Focused repository-audit and project-state regression tests passed 36/36.
  Repository inventory reported 1,951 tracked files, 48,235,756 staged Git blob
  bytes, identity `6cf022fcb560be8e7d91627831c2e789542786cc413c4610797dfb6f9a746e8e`,
  and zero forbidden paths before this evidence-only synchronization.
- No runtime source, test, asset, dependency, lockfile, schema, migration, workflow
  or provider state changed during this evidence/design slice.

## 2026-09-13 — Approval and planning evidence

- The user explicitly approved the written public-product-identity specification.
- The executable plan is
  `docs/superpowers/plans/2026-09-13-atmoshaper-public-product-identity.md`.
  It preserves the data-only owner, exact consumer allowlist, behavior contract,
  compatibility exports, excluded identities, rollback and retirement boundary.
- Independent plan review found one actionable issue: the scoped app-shell
  Playwright run must use a fresh `npm run build:browser-qa` artifact. The plan
  was corrected and independently re-reviewed.
- Final plan-review verdict: Approved, with no remaining issues or advisory
  recommendations.
- Planning introduced no runtime, test, asset, dependency, lockfile, schema,
  migration, workflow or provider change. Pre-implementation inventory/build
  measurement remains the next local step.

## 2026-09-13 — Pre-implementation observation baseline

- Measurement commit:
  `dc42f074df48817f5bbbfe60576d1f81abbd5559`.
- `npm run repository:inventory` passed with 1,952 tracked files,
  48,267,941 tracked Git blob bytes, inventory SHA-256
  `628bb60be01d78221ac12af4ebf5ce4b21c07b348008fa22170670e441962537`,
  and zero forbidden tracked paths.
- `npm run build` passed on Next.js 16.2.12. The prebuild migration check
  skipped outside Vercel Production as designed, Prisma Client generation
  passed, compilation and TypeScript passed, and static generation completed
  115/115 pages.
- The page-data step logged the existing non-fatal
  `ANATOMIME_POLL_SHEDDER` initialization warning. The build continued to a
  complete route table and exited zero; no tracked file changed.
- These are observation baselines, not a performance claim. Task 1 begins from a
  clean worktree after this evidence-only synchronization.
