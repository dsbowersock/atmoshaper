# AtmoShaper Project Log

This is the chronological log for the fresh AtmoShaper repository. Read [project-state.md](project-state.md) first for current truth. Complete development history before this bootstrap remains in [`dsbowersock/massagelab`](https://github.com/dsbowersock/massagelab); consult the [source-locked MassageLab project log](https://github.com/dsbowersock/massagelab/blob/e74045c2fc85c2cb4df176fdb1aff2137c4d9848/docs/project-log.md) rather than copying that history here.

## 2026-09-08 — Fresh-history repository candidate materialized

- Phase 1 passed. Phase 2 is in progress at Task 5. Source selection was relocked to exact merged MassageLab `main` commit `e74045c2fc85c2cb4df176fdb1aff2137c4d9848`; reviewed relock commit `f3b92a1afc44a5fdb2d56653bc82c8d0dc9a933e` descends from that immutable source and owns the migration-document overlays.
- Materialized the local AtmoShaper candidate with a history-free `git archive` export of the locked source. No MassageLab `.git` metadata, refs, worktrees, reflogs, tags, or commits were copied.
- Applied the four manifest-owned omissions: `.agents/refactor/2026-06-21-refactor-anatomime-session-wrapper.md` and the three MassageLab-only execution-governance records under `docs/aegis/work/2026-09-06-atmoshaper-repository-migration-execution/`.
- Applied only the ten reviewed relock overlays declared by `docs/rebrand/atmoshaper-export-manifest.json`: the nine migration documents under `docs/rebrand/` and the operative Phase 1–2 plan. Runtime, tests, configuration, parity tooling, and snapshots came from the locked source rather than working-tree state.
- Established the fresh-document boundary: add `MIGRATION_LINEAGE.md`; replace `README.md`, `docs/project-state.md`, and `docs/project-log.md`; and update `AGENTS.md` while preserving applicable safety, legal, PHI, entitlement, compatibility, planning, documentation, and Windows-shell rules.
- Existing MassageLab runtime design and copy remain unchanged through bootstrap and continue until the separately reviewed Phase 6 preview rebrand; no completed public runtime rebrand is claimed.
- Preserved the locked runtime source's current Layer B receipts: the exact 174/174 focused Anatomime matrix. Fresh exact-head full intercepted Anatomime Browser QA coverage reports 42/42 desktop/mobile cases ok in one post-fix run.
- Preserved public source/license provenance for the current display effects: the camera-yaw and decorative-glow concepts are an adaptation of CodePen author wheatup's public MIT-licensed [Neon Clock (CSS)](https://codepen.io/wheatup/pen/JjzdMbK) into native React and CSS, with no CodePen runtime dependency.
- The Task 5 path contract is `1,905 - 4 + 1 = 1,902`. The six Task 6 audit additions produce the final `1,908`-path contract. Task 6 remains pending.
- Git initialization, staging, exact path/blob audits, and Task 5 acceptance remain coordinator-owned next actions. Tasks 7–9 remain pending. No commit, remote, push, public repository, pull request, deployment, production/provider/database/payment/email/media mutation, DNS/domain cutover, runtime rebrand, or legal cutover is claimed by this entry.
