# Architecture Decisions

Use [project state](../project-state.md) for current status and the
[architecture map](../architecture.md) to find implementation owners. These records
extract migration decisions; they do not replace domain wikis or authorize execution.

Accepted means the described architecture has been implemented and verified.
Proposed means implementation or verification remains outstanding, even where the
record repeats constraints that already bind under the approved migration design.
Change status only with implementation evidence recorded in current authority.

| Record | Status | Compatibility boundary | Revisit trigger |
| --- | --- | --- | --- |
| [0001: Fresh root and history ownership](0001-fresh-root-lineage-and-history-ownership.md) | Accepted | Exact source/root lineage; MassageLab remains the history and rollback owner. | Unexplained lineage/parity difference or a separately approved change to repository ownership. |
| [0002: Public identity, legal and compatibility](0002-public-identity-legal-and-compatibility-boundaries.md) | Proposed | Preserve runtime copy until Phase 6, accepted legal records and durable internal identifiers. | Focused brand-owner implementation, preview rebrand, legal transition or dedicated identifier migration. |
| [0003: Origin-bound data and PWA recovery](0003-origin-bound-local-data-and-pwa-recovery.md) | Proposed | Preserve old-origin encrypted records, valid imports, credentials and installation recovery. | Phase 8 recovery implementation, any host/worker change or proposed old-origin retirement. |
| [0004: Parallel providers and cutover](0004-parallel-provider-staging-and-cutover.md) | Proposed | Keep provider identities, reconciliation and production traffic stable until exact separate authorization. | Phase 7 staging or Phase 9/10 provider/traffic preparation with fresh readbacks and rollback proof. |

## Immutable source

Each ADR links its specific source document at an immutable commit. The common
historical source is MassageLab
[`e74045c2fc85c2cb4df176fdb1aff2137c4d9848`](https://github.com/dsbowersock/massagelab/tree/e74045c2fc85c2cb4df176fdb1aff2137c4d9848).
AtmoShaper's verified fresh root is
[`7e89f7ba9508a1ad715c1824ea6099432e6a4ccd`](https://github.com/dsbowersock/atmoshaper/commit/7e89f7ba9508a1ad715c1824ea6099432e6a4ccd),
and merged bootstrap is
[`f59e1b9371b06e7401740ae011f6dc911430a97c`](https://github.com/dsbowersock/atmoshaper/commit/f59e1b9371b06e7401740ae011f6dc911430a97c).
See [lineage](../../MIGRATION_LINEAGE.md) for the export/overlay contract. Source
links preserve evidence; historical provider observations are not fresh live checks.
