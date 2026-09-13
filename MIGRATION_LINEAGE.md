# AtmoShaper Migration Lineage

AtmoShaper continues the MassageLab software project from an exact, behavior-preserving source snapshot.

- Source repository: [`dsbowersock/massagelab`](https://github.com/dsbowersock/massagelab)
- Export date: 2026-09-08
- Reviewed relock commit: `f3b92a1afc44a5fdb2d56653bc82c8d0dc9a933e`

Source commit: `e74045c2fc85c2cb4df176fdb1aff2137c4d9848`

## Verified repository lineage — 2026-09-10

- Sole fresh root: `7e89f7ba9508a1ad715c1824ea6099432e6a4ccd`, with no parent.
- Bootstrap [PR #1](https://github.com/dsbowersock/atmoshaper/pull/1) merged into `main` on `2026-09-09T09:36:44Z` by `dsbowersock` as `f59e1b9371b06e7401740ae011f6dc911430a97c`.
- Merge parents: the fresh root and reviewed head `6f516b29a8f1be8c66b48663f1101b66efe3f7f9`. The bootstrap review branch `codex/bootstrap-atmoshaper` is retained.
- Phase 3 [PR #2](https://github.com/dsbowersock/atmoshaper/pull/2) merged at `2026-09-10T00:57:48Z` as `7c07e4578307508ae2bdb784c4d7ad0d9fb64c65`. Its reviewed head was `9d2a8eca057f33354f2cbb50263c8e4f365a00f1`, and the review branch `codex/atmoshaper-docs-consolidation` remains retained.
- Current branch: `codex/atmoshaper-dead-code-audit`, created from that exact merge. Planning commit `e27c1d0ce941fbf9610389b45b9a30c82caac873` records the Phase 4 audit-only scope. No candidate has deletion approval, and Phases 5–10 remain unstarted.

The [architecture map](docs/architecture.md), [decision index](docs/decisions/README.md), [account-security owner](docs/wiki/account-security.md), and [Phase 4 audit-only plan](docs/superpowers/plans/2026-09-10-atmoshaper-phase4-audit-only.md) route current work. The [Phase 3 plan](docs/superpowers/plans/2026-09-09-atmoshaper-phase3-documentation-consolidation.md) owns the completed consolidation. [Project state](docs/project-state.md) owns status; dated bootstrap snapshots in the [project log](docs/project-log.md) remain historical evidence.

## Historical export and subsequent consolidation

This repository intentionally begins with fresh Git history. The MassageLab repository remains the complete owner of earlier commits, pull requests, plans, reports, audits, blame, historical evidence, and rollback history. The initial AtmoShaper tree was exported from the immutable locked source commit, with only the evidence-backed omissions and reviewed document overlays declared by the migration manifest.

The manifest's four omissions and 1,908-path initial tree describe the bootstrap only. Phase 3 separately reviewed 150 inherited design records: all 28 specifications and 106 plans remain (134 inherited records), while 16 exact superseded plans were omitted under the [cleanup register](docs/rebrand/atmoshaper-cleanup-register.md#phase-3-documentation-omissions--2026-09-09). Each omission links its current owner, immutable MassageLab original, and exact rollback blob. The new Phase 3 plan is additional, giving 107 plans and 28 specifications. This does not alter the original export contract or remove anything from MassageLab.

The bootstrap scope preserves the source application's behavior, design, routes, data contracts, privacy boundaries, compatibility identifiers, and provider-call boundaries. The runtime continues to present the existing MassageLab design and copy until the separately reviewed Phase 6 preview rebrand.

This repository migration does not change the legal operator, copyright owner, proprietary license, accepted legal documents, legal versions or effective dates, or historical acceptance records. Those remain governed by [LICENSE](LICENSE) and the existing legal identity unless a later legal transition is separately reviewed and approved.

This lineage record is not evidence of a production deployment, provider migration, DNS or domain cutover, database or payment change, public runtime rebrand, or legal cutover. None of those actions occurs as part of the fresh-history repository bootstrap.

Dedicated old-origin recovery and parallel provider staging remain proposed future work. Phase 3 changed documentation and its deterministic documentation-occurrence audit baseline only. Phase 4 may collect deterministic repository-cleanup evidence but does not authorize deletion or change runtime behavior. Deployment and production/database/payment/email/media/legal changes retain their separate authorization gates.
