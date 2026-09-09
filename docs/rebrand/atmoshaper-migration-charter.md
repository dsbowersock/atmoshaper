# AtmoShaper Migration Charter

## Authority

- Approved design: [AtmoShaper repository migration and modernization design](../superpowers/specs/2026-09-06-atmoshaper-repository-migration-design.md) (approved design commit `14f60fc1bc63e12b65b28c353b83e5f159247645`).
- Approved bootstrap plan: [AtmoShaper repository migration Phase 1-2 implementation plan](../superpowers/plans/2026-09-06-atmoshaper-repository-migration.md).
- Active plan: [Phase 3 documentation consolidation](../superpowers/plans/2026-09-09-atmoshaper-phase3-documentation-consolidation.md), limited to documentation and deterministic documentation-occurrence audit-baseline reconciliation.
- Superseded handoff: Derrick's 2026-09-06 AtmoShaper migration handoff supersedes the earlier Stage 1 handoff that kept this work inside `dsbowersock/massagelab`.
- This charter governs source selection for Phases 1-2. The old repository remains the historical archive, evidence source, and rollback source unless separately authorized otherwise.

## Current Status — Phase 3, 2026-09-09

- Bootstrap [PR #1](https://github.com/dsbowersock/atmoshaper/pull/1) merged at `2026-09-09T09:36:44Z` by `dsbowersock` as `f59e1b9371b06e7401740ae011f6dc911430a97c`. It joins sole fresh root `7e89f7ba9508a1ad715c1824ea6099432e6a4ccd` and reviewed head `6f516b29a8f1be8c66b48663f1101b66efe3f7f9`. The bootstrap review branch `codex/bootstrap-atmoshaper` is retained.
- Local `codex/atmoshaper-docs-consolidation` starts from that merge. Tasks 1–3 are committed (`99a1faa`, `7be78ff`, `49fba96`); Task 4 synchronizes authority, and Task 5 verification and whole-branch review is next. Phase 3 is not complete, no Phase 3 push or new PR is claimed, and Phase 4 has not started.
- Current owners are the [architecture map](../architecture.md), [decisions](../decisions/README.md), and [account-security wiki](../wiki/account-security.md). ADR 0001 is Accepted; ADRs 0002–0004 remain Proposed.
- Semantic review covered 150 inherited records. All 28 specifications and 106 plans remain (134 inherited records); the [cleanup register](atmoshaper-cleanup-register.md#phase-3-documentation-omissions--2026-09-09) records 16 exact evidence-backed plan omissions, current owners, immutable MassageLab originals, and rollback blobs. The new Phase 3 plan is additional: 107 plans and 28 specifications remain. This separate omission boundary does not rewrite the bootstrap manifest.
- Runtime/public rebrand, dedicated old-origin recovery, provider staging, deployment, DNS/domain changes, production/database/payment/email/media actions, and legal cutover remain future gated work. Only verified GitHub repository facts are synchronized here; other provider evidence remains dated. The current gate is Phase 3 verification and review, not Phase 4 execution.

## Source Lock (Historical Phase 2 Export Receipt)

- Source repository: `https://github.com/dsbowersock/massagelab`
- Exact selected `main` SHA: `e74045c2fc85c2cb4df176fdb1aff2137c4d9848`
- Selection date: 2026-09-08
- Merge parents: historical source `fa78ca01a42179329cc223df77c76f308e76320b`, then reviewed PR #206 head `971c453ebb50127bb3ffd1d9f5e4f133dbf9df82`.
- Merge/reviewed-tree identity: both commits resolve to tree `0370e1d2749f9644efdc3ccbcb832c8d7965ec0d`.
- Local/tracked agreement at relock start: `git rev-parse HEAD` and `git rev-parse origin/main` each returned `e74045c2fc85c2cb4df176fdb1aff2137c4d9848`.
- Source checkout: `C:/Users/derri/code/my_projects/massagelab` on `codex/atmoshaper-phase2-relock`; Task 5 must export the immutable selected commit, never working-tree state.
- Node version: `v24.15.0`
- npm version: `11.12.1`
- Git version: `git version 2.55.0.windows.3`

`Task 4R StartSnapshot` command results:

```text
git rev-parse --show-toplevel
C:/Users/derri/code/my_projects/massagelab

git branch --show-current
codex/atmoshaper-phase2-relock

git rev-parse HEAD
e74045c2fc85c2cb4df176fdb1aff2137c4d9848

git rev-parse origin/main
e74045c2fc85c2cb4df176fdb1aff2137c4d9848

git status --porcelain=v2 --branch
# branch.oid e74045c2fc85c2cb4df176fdb1aff2137c4d9848
# branch.head codex/atmoshaper-phase2-relock

git diff --name-only
(no output)

git diff --cached --name-only
(no output)

git worktree list --porcelain
worktree C:/Users/derri/code/my_projects/massagelab
HEAD e74045c2fc85c2cb4df176fdb1aff2137c4d9848
branch refs/heads/codex/atmoshaper-phase2-relock
```

No active rebase, merge, cherry-pick, revert, or bisect marker was present: `.git/rebase-merge`, `.git/rebase-apply`, `MERGE_HEAD`, `CHERRY_PICK_HEAD`, `REVERT_HEAD`, and `BISECT_LOG` were all absent. The standalone historical `.git/REBASE_HEAD` was present and left untouched; without an active rebase directory or Git status state, it is not an active operation.

The original `fa78ca01a42179329cc223df77c76f308e76320b` Task 1 lock and its preparation-branch evidence remain historical evidence; they are not the Phase 2 export source. Immediately before Task 5, the manifest `sourceCommit`, tracked `origin/main`, and live GitHub `main` must agree, and the relock branch must descend from that source. If those checks disagree, source selection must be rerun against the newer clean, fully verified `main`. The local `main` branch pointer is retained historical state and is not export authority.

## Phase Scope

### Phase 1 deliverables

- Establish exact source identity and clean source-state evidence.
- Produce the classified file/reference, compatibility, provider/domain, local-data/PWA, cleanup, and refactor inventories.
- Capture baseline verification, visual, route/bundle, metadata/PWA, and external-boundary evidence without provider or production mutation.

### Phase 2 deliverables

- Create a fresh-root public `dsbowersock/atmoshaper` repository from the locked source without importing MassageLab Git history.
- Record exact lineage, verify source/destination parity, and retain MassageLab as the authoritative history and rollback repository.
- Publish only after Phase 1 and destination verification gates pass; no tag, merge decision, deployment, or production/provider change is implied.

### Historical Phase 1–2 deferrals

This list records the original bootstrap boundary. Phase 3 is now separately authorized under the active plan above; the remaining deferrals continue to apply.

- Phase 3 documentation and historical-artifact consolidation.
- Phase 4 evidence-backed dead-code, dependency, and asset cleanup.
- Phase 5 targeted behavior-preserving refactors.
- Phase 6 preview-only public rebrand and the later approved-logo branch.
- Migration-parity assets and their evidence remain through the cleanup, refactor, and preview-rebrand sequence. After Phase 6, an explicit reviewed keep, update, or retire decision is required; neither the old repository nor parity evidence may be silently retired.
- Phase 7 parallel Vercel/environment staging, Phase 8 local-data/PWA transition, Phase 9 provider/account preparation, and Phase 10 production-domain cutover.
- No Phase 1-2 work authorizes runtime rebranding, legal-document changes, provider writes, database writes, DNS changes, or production deployment.

## Compatibility Invariants

- **Runtime and visual parity:** the initial destination must preserve source routes, behavior, responsive geometry, accessibility, keyboard/focus/reduced-motion behavior, feature-key entitlements, APIs, provider-call boundaries, and working visual assets. An unexplained difference falsifies parity.
- **Legal/operator separation:** public product identity may not change the proprietary license, legal operator, copyright ownership, accepted legal text/version/effective date, or acceptance history. No trademark-registration claim is permitted without separate approval.
- **Local-first PHI boundary:** clinical notes, intake, journals, ROM sessions, and encrypted professional-record workflows remain local-first. No phase may automatically transfer PHI or encrypted vault content between origins.
- **Stable private identifiers:** Prisma migrations and objects, `MASSAGELAB_` environment variables, Stripe metadata/idempotency namespaces, auth and security identifiers, browser storage/cache/vault identifiers, R2 identities, export schemas, and durable audit/operation identifiers remain unchanged unless a later dedicated migration proves compatibility and rollback.
- **Atmosphere public label versus internal `atmoshaper` identifiers:** the later public audio label is `Atmosphere` or `Atmosphere mixer`; existing internal `atmoshaper` modules, scripts, data, tests, storage, paths, and release identifiers remain private compatibility identifiers. Global replacement is prohibited.
- **Disposable database parity:** the [external-account checklist](atmoshaper-external-account-checklist.md#disposable-database-parity-lifecycle) is the canonical policy owner; Task 7 of the [operative plan](../superpowers/plans/2026-09-06-atmoshaper-repository-migration.md#task-7-verify-and-create-the-fresh-local-atmoshaper-initial-commit) owns the executable lifecycle and redacted receipt. No other summary may weaken those gates.

## Historical Bootstrap Verification Ledger

| Gate | Source result | Destination result | Comparison | Evidence date |
| --- | --- | --- | --- | --- |
| Task 1 checkout and operation state | Clean preparation checkout; one root worktree; no active Git operation. Historical standalone `REBASE_HEAD` retained untouched. | Not created | Not applicable until Phase 2 | 2026-09-06 |
| Task 1 source-ref selection | Historical lock: local `main`, `origin/main`, and live GitHub `main` all `fa78ca01a42179329cc223df77c76f308e76320b`. | Not created | Superseded for Phase 2 by Task 4R relock | 2026-09-06 |
| Source baseline installation, Prisma, typecheck, lint, tests, builds, Browser QA, and measurements | Passed locally: dependency/schema setup, typecheck/lint, 4,197-test unit suite, both 115-page builds, all four Browser-QA lanes, 22/22 fresh-build no-update migration parity, PWA checks, route/bundle/public-output measurements, and redacted hosted identity readbacks are recorded in the reference inventory. Task 3 parity is committed as `ecd28af0`; Task 4A source-QA hardening is committed as `a8fe56fd`. | Not created | Source gate passed only; destination comparison remains pending | 2026-09-08 |
| Task 4 merge and Phase 2 relock | PR #206 merged as `e74045c2fc85c2cb4df176fdb1aff2137c4d9848`; merge tree exactly equals reviewed head `971c453e`; exact merge-head Code quality, Browser build, Browser QA lanes 1–4, aggregate `qa`, and CodeQL Actions/JavaScript/Python passed; Vercel reported the automatic `main` deployment complete. | Not created | Exact merged source lock established; no destination parity claim | 2026-09-08 |
| Fresh-root bootstrap and source/destination parity | Locked source `e74045c2fc85c2cb4df176fdb1aff2137c4d9848` | Fresh-root commit `7e89f7ba9508a1ad715c1824ea6099432e6a4ccd`; 1,908-path inventory; complete local, Browser QA, visual-parity, and disposable-database gates passed | Runtime and accepted snapshots remained source-equivalent; destination-only documentation, audit tooling, tests, and recorded stabilizations are enumerated below | 2026-09-09 |
| Task 8 receipt commit | Locked source and accepted Task 7 evidence unchanged | Four receipt documents committed as `953e04c680d497851cdb6b6533b92de8f9b1c4f2` on `codex/bootstrap-atmoshaper` | Documentation only; no runtime, provider, or production change | 2026-09-09 |
| Task 9 publication and exact-head hosted CI | Historical source remains intact in its existing repository | Public `dsbowersock/atmoshaper`; default `main`; no tags; open/unmerged PR #1; hosted run `34325535135` passed at exact `23f5b8654a89c83de4ae3c6454996e9f7bc6b283` | Repository publication only; a later receipt head requires its own hosted pass | 2026-09-09 |

## Historical Pre-merge Status — Superseded by Current Phase 3 Status

The following statements preserve the then-current publication boundary; they are not current instructions or current hosted-integration verification.

- Current phase: Phase 1–2 bootstrap work through Task 9 is complete and published for review. Task 8 receipt commit `953e04c680d497851cdb6b6533b92de8f9b1c4f2` and test-only correction `23f5b8654a89c83de4ae3c6454996e9f7bc6b283` are on `codex/bootstrap-atmoshaper`; [PR #1](https://github.com/dsbowersock/atmoshaper/pull/1) remains open and unmerged against `main`.
- Historical exact-`23f5` hosted evidence: run `34325535135` passed Code quality, Browser build, Browser QA lanes 1–4, and aggregate `qa` at exact `23f5b8654a89c83de4ae3c6454996e9f7bc6b283`. This evidence does not cover a later receipt-only head.
- Review/integration boundary: Codex GitHub review covered only `953e04c680d497851cdb6b6533b92de8f9b1c4f2`. CodeQL, Vercel, and CodeRabbit did not appear or run in the new repository; later setup must treat them as findings, not passed checks.
- Current authorization boundary: stop before Phase 3. No bootstrap-PR merge, deployment configuration, DNS, production/provider mutation, production database mutation, or Phase 3 work is authorized.
- Receipt-correction completion condition: the documentation-only commit containing this correction must pass its own hosted checks and receipt review before it is exact-head evidence. Stop before Phase 3 regardless; the recommended future branch, `codex/atmoshaper-docs-consolidation`, must not be created or used until a separate Phase 3 plan is reviewed and authorized.

## Task 7 Destination Verification Receipt — 2026-09-09 (Historical Prepublication Snapshot)

The initial commit contains 1,908 paths and 46,865,680 tracked blob bytes. Its tree is `e9a97bbe519a1cc52c7225eb600fd5d2473f6ded`, and its staged-tree inventory SHA-256 was `1d537a03b8a0294f1e68f56df718c29b5e5cf4bfedac01de7ae1cceb86aa3604`. The commit is the repository's only root, its parent record contains only its own SHA, and the worktree was clean immediately afterward.

| Gate | Verified result |
| --- | --- |
| Dependency and schema setup | `npm ci`, Prisma validation, and Prisma client generation exited zero. Installation reported three inherited high-severity advisories; no automated dependency rewrite was applied. |
| Static quality and unit tests | TypeScript and lint exited zero. The unit suite reported 4,219 total, 4,216 passed, 3 skipped, and 0 failed. The focused repository-audit suite passed 21/21. |
| Builds and routes | Production and Browser-QA builds passed with 115 generated pages each. The destination app-paths manifest contained 148 keys. `.next/server/app` measured 11,806,033 bytes, exactly matching the source aggregate; `.next/static` measured 19,074,513 bytes, 52 bytes above the source aggregate because fresh-build artifact identities differ. No per-file bundle equality claim is made. |
| Public outputs | The owned local server returned exact source-ledger bytes and SHA-256 hashes for the web manifest, robots, sitemap, and service worker. The dynamic root HTML returned HTTP 200 but remains nonnormative. The server was stopped and port 3010 had zero listeners. |
| Ordinary Browser QA | Lane 1 passed 137 with 7 skipped; lane 2 passed 184 with 34 skipped; lane 3 passed 160 with 34 skipped; lane 4 passed 149 with 51 skipped. |
| Migration parity | The final fresh lifecycle passed 22/22 without updating snapshots. All 24 accepted PNGs remained byte-identical to the locked source. |
| Disposable database | A newly created independent empty QA project received exactly the 46 committed migrations. All 134 application tables were empty after fixture cleanup. Every cycle-owned temporary project was deleted and verified absent; one unrelated pre-existing project was preserved. No production data was copied, read, or altered. |
| Repository and brand audits | Inventory passed at the exact path, byte, and aggregate-hash values above. Brand review counted 26,350 references: 22,905 compatibility, 1,451 historical, 42 legal, 1,952 pre-rebrand public copy, and 0 missing or unclassified. |
| Restricted mutation | Apart from the authorized disposable QA projects that were deleted and proved absent, no persistent destination deployment or provider configuration, domain/DNS, payment, production database, runtime rebrand, legal cutover, or Phase 3 action occurred. |

The normative local output receipts were: `/manifest.webmanifest`, 200 `application/manifest+json`, 703 bytes, SHA-256 `dc428665e722fbe81f1240ad2fd6f0a8256bbca812f8c96e1144af63c641c2ae`; `/robots.txt`, 200 `text/plain`, 554 bytes, SHA-256 `df9d029b2e1ce198ce143f22574fd82f7667fa150e6715b7bc1d1fd5a9cd1413`; `/sitemap.xml`, 200 `application/xml`, 4,290 bytes, SHA-256 `5ba6ff754a94e3e2a16a39eb3439b7ce6f0cda31fc83bc97eca181d2d303ebae`; and `/sw.js`, 200 `application/javascript`, 5,037 bytes, SHA-256 `c47bb1b21c79a76bde8385f3a3d9d0afa8aac8ccb813987a65518e65c0f0c247`.

The first complete disposable-project run had one desktop Home readiness failure. Review found the route implementation and all accepted snapshots unchanged from the locked source, and none of the destination edits owned that flow. A focused rerun passed 1/1; a separate fresh full lifecycle then passed 22/22, so no runtime or snapshot change was made for the transient failure.

Two execution details are durable for future verification. Ordinary authenticated private rows require a newly created, authorized, empty QA database rather than an existing or production project. Exact migration-parity runs must retain the repository-configured single worker; overriding that ownership contract is not an accepted diagnostic or release path. Every future temporary project must be created empty, fingerprint-gated, migrated only from committed repository migrations, checked for zero retained application rows, deleted, and proven absent.

## Task 9 Publication Receipt — 2026-09-09 (Historical Pre-merge Snapshot)

This receipt predates the separately authorized bootstrap merge and Phase 3 plan. Open/unmerged and future-Phase-3 wording below belongs to that historical snapshot.

- Repository: [`https://github.com/dsbowersock/atmoshaper`](https://github.com/dsbowersock/atmoshaper), public, default branch `main`, no tags.
- Initial `main`: sole root `7e89f7ba9508a1ad715c1824ea6099432e6a4ccd`, tree `e9a97bbe519a1cc52c7225eb600fd5d2473f6ded`.
- Review history: Task 8 documentation commit `953e04c680d497851cdb6b6533b92de8f9b1c4f2`; test-only correction commit `23f5b8654a89c83de4ae3c6454996e9f7bc6b283`, which advanced the project-state verification-date ceiling from 2026-09-08 to 2026-09-09 after the first hosted Code quality run exposed it.
- Pull request: [#1](https://github.com/dsbowersock/atmoshaper/pull/1), open and unmerged, base `main`, head `codex/bootstrap-atmoshaper`.
- Exact-`23f5` local correction evidence: focused test 15/15; full suite 4,216 passed, 3 skipped, 0 failed.
- Exact-`23f5` hosted run `34325535135`: Code quality passed in 4m11s; Browser build passed in 2m26s; Browser QA lanes 1–4 passed in 12m24s, 11m15s, 17m56s, and 12m59s; aggregate `qa` passed in 3s.
- Missing new-repository integrations: CodeQL, Vercel, and CodeRabbit did not appear or run. They are later setup findings. Codex GitHub review is recorded only for the earlier `953e04c680d497851cdb6b6533b92de8f9b1c4f2` head.

External actions were creation of the public GitHub repository, publication of `main` and `codex/bootstrap-atmoshaper` (including the test-only correction), opening the unmerged bootstrap PR, the recorded hosted CI runs, and the Codex GitHub review on the earlier receipt head. This receipt correction added no PR comment or internal note. No tag, merge, deployment, provider configuration, DNS/domain, production database, email, payment, media, runtime rebrand, legal cutover, or Phase 3 action occurred. Any later head must pass its own hosted checks. Phase 3 documentation consolidation is only a recommended, separately reviewed and authorized future plan on `codex/atmoshaper-docs-consolidation`; it has not begun.
