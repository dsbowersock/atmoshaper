# ADR 0001: Fresh Root, Lineage and History Ownership

Status: Accepted

## Context

The migration requires a new AtmoShaper repository while preserving the working
application and all prior history at its original owner. Importing Git history or
renaming the old repository would not satisfy the fresh-root requirement.

## Decision

AtmoShaper has fresh Git history. MassageLab remains the complete owner of earlier
commits, pull requests, plans, reports, audits, blame, historical evidence and rollback
history. Its archive role does not mean the GitHub repository has been archived or
made read-only; changing its repository state requires separate authorization.

The 2026-09-08 export used exact MassageLab source
`e74045c2fc85c2cb4df176fdb1aff2137c4d9848`. Reviewed relock
`f3b92a1afc44a5fdb2d56653bc82c8d0dc9a933e` owns the declared migration-document
overlays. AtmoShaper root `7e89f7ba9508a1ad715c1824ea6099432e6a4ccd` has no parent
and is the repository's sole root. Its initial tree is
`e9a97bbe519a1cc52c7225eb600fd5d2473f6ded`, with 1,908 tracked paths under the
[export manifest](../rebrand/atmoshaper-export-manifest.json).

Bootstrap PR #1 merged as `f59e1b9371b06e7401740ae011f6dc911430a97c`, with parents
`7e89f7ba9508a1ad715c1824ea6099432e6a4ccd` and reviewed head
`6f516b29a8f1be8c66b48663f1101b66efe3f7f9`. Acceptance records the implemented
repository boundary and verified bootstrap, not any later runtime or production work.

## Rationale

Lineage by reference preserves the requested fresh root without pretending that
earlier development happened in AtmoShaper. Rejected alternatives are a GitHub rename
of MassageLab, a full-history clone/mirror, and a combined repository migration,
rebrand and production cutover. They respectively lose the requested repository
boundary, import old history, or prevent isolated parity and rollback review.

## Compatibility boundary

Preserve source behavior, routes, visuals, accessibility, privacy, legal records,
data formats, durable identifiers and provider calls. The manifest explains the
initial tree differences; it does not authorize later omissions. MassageLab history
and production service are not changed by this decision. Later cleanup retains
immutable originals and requires its own evidence and rollback scope.

## Revisit trigger

Reopen this decision if lineage or initial parity cannot be reproduced, historical
evidence becomes inaccessible, or a separately approved proposal changes either
repository's history/rollback role. Preserve evidence before resolving a discrepancy;
do not rewrite either history as a repair shortcut.

## Immutable source

- [Migration design, selected architecture and alternatives](https://github.com/dsbowersock/massagelab/blob/e74045c2fc85c2cb4df176fdb1aff2137c4d9848/docs/superpowers/specs/2026-09-06-atmoshaper-repository-migration-design.md#3-selected-architecture-and-alternatives).
- [Reviewed export manifest](https://github.com/dsbowersock/atmoshaper/blob/f59e1b9371b06e7401740ae011f6dc911430a97c/docs/rebrand/atmoshaper-export-manifest.json).
- [Fresh-root lineage record](https://github.com/dsbowersock/atmoshaper/blob/7e89f7ba9508a1ad715c1824ea6099432e6a4ccd/MIGRATION_LINEAGE.md).
- [Bootstrap merge and parents](https://github.com/dsbowersock/atmoshaper/commit/f59e1b9371b06e7401740ae011f6dc911430a97c).
- [Destination verification receipt at merged bootstrap](https://github.com/dsbowersock/atmoshaper/blob/f59e1b9371b06e7401740ae011f6dc911430a97c/docs/rebrand/atmoshaper-migration-charter.md#task-7-destination-verification-receipt--2026-09-09-historical-prepublication-snapshot).

## Consequences

Future development can use the new repository without duplicating the historical
log. Investigations spanning bootstrap must follow [migration lineage](../../MIGRATION_LINEAGE.md)
to MassageLab. Root parity receipts are historical evidence and do not replace
verification of later commits. Production and provider rollback remain governed by
the [rollback plan](../rebrand/atmoshaper-rollback-plan.md).
