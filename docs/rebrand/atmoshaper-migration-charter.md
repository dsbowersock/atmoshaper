# AtmoShaper Migration Charter

## Authority

- Approved design: [AtmoShaper repository migration and modernization design](../superpowers/specs/2026-09-06-atmoshaper-repository-migration-design.md) (approved design commit `14f60fc1bc63e12b65b28c353b83e5f159247645`).
- Approved plan: [AtmoShaper repository migration Phase 1-2 implementation plan](../superpowers/plans/2026-09-06-atmoshaper-repository-migration.md).
- Superseded handoff: Derrick's 2026-09-06 AtmoShaper migration handoff supersedes the earlier Stage 1 handoff that kept this work inside `dsbowersock/massagelab`.
- This charter governs source selection for Phases 1-2. The old repository remains the historical archive, evidence source, and rollback source unless separately authorized otherwise.

## Source Lock

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

### Explicit later-phase deferrals

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

## Verification Ledger

| Gate | Source result | Destination result | Comparison | Evidence date |
| --- | --- | --- | --- | --- |
| Task 1 checkout and operation state | Clean preparation checkout; one root worktree; no active Git operation. Historical standalone `REBASE_HEAD` retained untouched. | Not created | Not applicable until Phase 2 | 2026-09-06 |
| Task 1 source-ref selection | Historical lock: local `main`, `origin/main`, and live GitHub `main` all `fa78ca01a42179329cc223df77c76f308e76320b`. | Not created | Superseded for Phase 2 by Task 4R relock | 2026-09-06 |
| Source baseline installation, Prisma, typecheck, lint, tests, builds, Browser QA, and measurements | Passed locally: dependency/schema setup, typecheck/lint, 4,197-test unit suite, both 115-page builds, all four Browser-QA lanes, 22/22 fresh-build no-update migration parity, PWA checks, route/bundle/public-output measurements, and redacted hosted identity readbacks are recorded in the reference inventory. Task 3 parity is committed as `ecd28af0`; Task 4A source-QA hardening is committed as `a8fe56fd`. | Not created | Source gate passed only; destination comparison remains pending | 2026-09-08 |
| Task 4 merge and Phase 2 relock | PR #206 merged as `e74045c2fc85c2cb4df176fdb1aff2137c4d9848`; merge tree exactly equals reviewed head `971c453e`; exact merge-head Code quality, Browser build, Browser QA lanes 1–4, aggregate `qa`, and CodeQL Actions/JavaScript/Python passed; Vercel reported the automatic `main` deployment complete. | Not created | Exact merged source lock established; no destination parity claim | 2026-09-08 |
| Fresh-root bootstrap and source/destination parity | Locked source `e74045c2fc85c2cb4df176fdb1aff2137c4d9848` | Fresh-root commit `7e89f7ba9508a1ad715c1824ea6099432e6a4ccd`; 1,908-path inventory; complete local, Browser QA, visual-parity, and disposable-database gates passed | Runtime and accepted snapshots remained source-equivalent; destination-only documentation, audit tooling, tests, and recorded stabilizations are enumerated below | 2026-09-09 |

## Current Status

- Current phase: Phase 1 is complete. Phase 2 Tasks 5–7 produced and verified fresh-root commit `7e89f7ba9508a1ad715c1824ea6099432e6a4ccd`; Task 8 records that evidence on `codex/bootstrap-atmoshaper`.
- Last passed gate: the fresh-root commit is the sole root, has no parent, and was clean after the complete Task 7 destination gate.
- Current authorization boundary: Task 9 may publish `main` and the bootstrap review branch and open an unmerged pull request. No bootstrap-PR merge, deployment configuration, DNS, production/provider mutation, production database mutation, or Phase 3 work is authorized.
- Next exact action: verify and commit the four-document Task 8 receipt, then execute Task 9 and stop before Phase 3.

## Task 7 Destination Verification Receipt — 2026-09-09

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
