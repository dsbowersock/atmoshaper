# AtmoShaper Project State

Verified: 2026-09-08

This is the read-first source of truth for the fresh AtmoShaper repository. Use it before `docs/project-log.md`, roadmaps, TODO files, audits, plans, or wiki pages when deciding what is active now.

## Current Snapshot

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
