# AtmoShaper Project State

Verified: 2026-09-09

This is the read-first source of truth for the fresh AtmoShaper repository. Use it before `docs/project-log.md`, roadmaps, TODO files, audits, plans, or wiki pages when deciding what is active now.

## Historical Task 5 Snapshot — Superseded Below

- Phase 1 passed. Its source-baseline, migration-parity, classification, and read-only external-boundary evidence are retained in the migration documents and the historical MassageLab repository.
- Phase 2 is in progress at Task 5. The immutable source is `dsbowersock/massagelab` commit `e74045c2fc85c2cb4df176fdb1aff2137c4d9848`; the reviewed relock commit is `f3b92a1afc44a5fdb2d56653bc82c8d0dc9a933e`.
- The locked source contains 1,905 paths. The reviewed Task 5 contract is four exact omissions and one source-absent addition: `1,905 - 4 + 1 = 1,902` paths. Task 6 adds six repository-audit files, producing the exact final bootstrap contract of `1,908` paths.
- The history-free source export, four omissions, and ten reviewed document overlays have been applied to the local candidate. Task 5's five fresh authority documents are the current review boundary. Git initialization, staging, and exact path/blob verification remain coordinator-owned Task 5 actions.
- Repository identity is AtmoShaper, but the runtime intentionally retains the existing MassageLab design and copy until the separately reviewed Phase 6 preview rebrand. No completed public runtime rebrand is claimed.
- Complete prior development history, historical evidence, and rollback history remain in [`dsbowersock/massagelab`](https://github.com/dsbowersock/massagelab). This repository intentionally starts with fresh Git history.
- No production deployment, provider migration, database or payment change, DNS or domain cutover, old-origin retirement, or legal cutover has occurred through this bootstrap boundary.
- Task 6's deterministic repository and legacy-brand audits remain pending. Tasks 7–9—destination verification and initial commit, verification recording, and public repository/bootstrap-PR publication—also remain pending and must follow their exact gates.

## Current Boundaries

- Preserve current behavior, routes, responsive design, accessibility, privacy, local-first data ownership, feature-key entitlements, APIs, provider-call boundaries, and compatibility identifiers during bootstrap.
- Keep clinical notes, intake forms, journals, ROM sessions, encrypted professional records, and other PHI-bearing workflows local-first until hosted clinical storage passes the documented compliance gates.
- Preserve the legal operator, copyright owner, proprietary license, legal-document versions and effective dates, accepted text, and acceptance history unless a later legal transition is separately reviewed and approved.
- Treat AtmoShaper as the platform identity, `Atmosphere` or `Atmosphere mixer` as the later public audio label, and existing internal `atmoshaper` names as stable compatibility identifiers.

## Authority and Next Reads

- [Project log](project-log.md) — fresh-repository chronological progress.
- [Migration lineage](../MIGRATION_LINEAGE.md) — exact source, date, history owner, and legal boundary.
- [Export manifest](rebrand/atmoshaper-export-manifest.json) — exact path-difference contract.
- [Migration charter](rebrand/atmoshaper-migration-charter.md) — authority, invariants, and external mutation boundary.
- [Operative Phase 1–2 plan](superpowers/plans/2026-09-06-atmoshaper-repository-migration.md) — task sequence and acceptance gates.
- [Project wiki](wiki/index.md) — stable operational documentation.

## Documentation Rules

- Update this file first when the active phase, current gate, provider/database state, live surfaces, or priority order changes.
- Update `docs/project-log.md` for chronological progress, meaningful decisions, completed branches, and verified receipts.
- Keep historical detail in the MassageLab repository and link to it instead of recreating a competing history here.
- Keep stable operating instructions in `docs/wiki/` and detailed implementation plans in `docs/superpowers/plans/`.
- Do not turn a plan, audit finding, or intended later phase into a completed-state claim without fresh evidence.

## Inherited Verification Receipts

The locked source records the exact 174/174 focused Anatomime matrix. Fresh exact-head full intercepted Anatomime Browser QA coverage reports 42/42 desktop/mobile cases ok in one post-fix run. These are inherited source receipts from `e74045c2fc85c2cb4df176fdb1aff2137c4d9848`, not Task 7 candidate-run evidence.

## Current Snapshot — Phase 1–2 Bootstrap Published for Review

This is the current repository state. The earlier Task 5 snapshot is retained only as dated migration history.

- Tasks 5–7 are complete. Fresh-root `main` is `7e89f7ba9508a1ad715c1824ea6099432e6a4ccd`: the repository has one root, that commit has no parent, and the worktree was clean after creation.
- The initial commit contains the exact 1,908-path contract, 46,865,680 tracked blob bytes, tree `e9a97bbe519a1cc52c7225eb600fd5d2473f6ded`, and aggregate staged-tree SHA-256 `1d537a03b8a0294f1e68f56df718c29b5e5cf4bfedac01de7ae1cceb86aa3604`.
- Repository inventory and legacy-brand audits passed. The final unit suite passed 4,216 of 4,219 tests with 3 intentional skips and no failures; typecheck and lint passed; both builds produced 115 pages.
- The destination route manifest contained 148 keys, matching the source count; server-app bytes matched the source aggregate exactly. Static assets measured 52 bytes above the source aggregate because fresh-build artifact identities differ, so no per-file bundle equality is claimed. The web manifest, robots, sitemap, service worker, and all 24 accepted PNGs matched their source bytes and hashes.
- All four Browser-QA lanes passed at their accepted counts, and the final fresh migration-parity lifecycle passed 22/22 without snapshot updates. A prior transient desktop Home readiness failure was followed by a focused 1/1 pass and a separate full 22/22 pass; no runtime or snapshot change was required.
- The accepted empty QA project received exactly 46/46 committed migrations. All 134 application tables were empty after cleanup. Every cycle-owned temporary project was deleted and verified absent, the unrelated pre-existing project was preserved, and no production data was copied or altered.
- Task 8 recorded the destination receipt in commit `953e04c680d497851cdb6b6533b92de8f9b1c4f2`. Task 9 then created the public repository at [`dsbowersock/atmoshaper`](https://github.com/dsbowersock/atmoshaper), published `main` and `codex/bootstrap-atmoshaper`, and opened [PR #1](https://github.com/dsbowersock/atmoshaper/pull/1). The repository is public, its default branch is `main`, and it has no tags. PR #1 remains open and unmerged with base `main` and review branch `codex/bootstrap-atmoshaper`.
- One test-only correction commit, `23f5b8654a89c83de4ae3c6454996e9f7bc6b283`, advanced the project-state verification-date upper bound to 2026-09-09 after the first hosted Code quality run exposed the stale 2026-09-08 ceiling. At that exact head, the focused test passed 15/15 and the full local suite passed 4,216 with 3 skips and 0 failures.
- Hosted run `34325535135` passed at exact `23f5b8654a89c83de4ae3c6454996e9f7bc6b283`: Code quality in 4m11s, Browser build in 2m26s, Browser QA lanes 1–4 in 12m24s, 11m15s, 17m56s, and 12m59s, and aggregate `qa` in 3s. Any later head, including a receipt-only documentation head, must pass its own hosted checks before it can be treated as exact-head evidence.
- CodeQL, Vercel, and CodeRabbit did not appear or run in the new repository; they remain later setup findings, not passed gates. Codex GitHub review completed only on the earlier `953e04c680d497851cdb6b6533b92de8f9b1c4f2` head and is not an exact-final-head review.
- Every future Browser QA acceptance cycle must create a new independent empty QA project, pass the non-production identity and fingerprint gates, apply exactly the 46 committed migrations, prove every application table empty, delete the cycle-owned project, and prove it absent. Production data must not be supplied, copied, read, or altered.
- Stop before Phase 3. The recommended next branch is `codex/atmoshaper-docs-consolidation`, but Phase 3 planning and execution require separate review and authorization and have not begun. No deployment, provider/domain cutover, production database change, runtime rebrand, legal cutover, or bootstrap-PR merge is authorized.
