# ADR 0002: Public Identity, Legal and Compatibility Boundaries

Status: Proposed

## Context

Merged Phase 5 introduced one public-product identity owner while deliberately
leaving rendered MassageLab values unchanged. Separately approved Phase 6 now
uses that owner to present the platform as AtmoShaper, presents the audio feature
as Atmosphere through its noun-only owner, and migrates current legal presentation
under new document versions. Historical legal agreements and durable technical
identifiers still cannot be treated as current public copy.

## Decision

Use the Phase 5 `PUBLIC_PRODUCT_IDENTITY` owner for current platform name, short
name, and approved-asset availability. Use one noun-only
`ATMOSPHERE_PUBLIC_LABELS` owner for `Atmosphere` and `Atmosphere mixer`.
Contextual sentences remain with their domain owners. Missing approved assets are
represented by `null` and rendered as accessible text; no variant is invented.

Keep Chimer, Anatomime, Calendar, Notes, Wellness, and accurate massage-domain
terminology. Keep internal `atmoshaper` modules, routes, CSS, tests, storage,
playback, release, and media identities stable. Curate legacy-name occurrences by
meaning; never globally replace them.

Before changing current legal copy, serialize the exact existing v2 exports into
deterministic evidence-only archives. Then publish current general documents as
`2026-09-legal-v3` and the current digital-purchase document as
`2026-09-digital-purchases-v3`, both effective `September 14, 2026`, with exact
operator wording `Derrick Bowersock, doing business as AtmoShaper`. The current
registry remains the runtime owner. Existing acceptance rows remain untouched and
new genuine v3 acceptance adds versioned rows beside v2 history.

No trademark, registration, external filing, or entity-status claim follows from
the repository or current legal-presentation change.

## Rationale

A product owner and a noun-only feature owner prevent current-copy drift without
turning brand configuration into a sentence registry. Archive-before-mutation and
new legal versions preserve what prior acceptance IDs meant. Global replacement or
in-place legal editing would erase the distinction among presentation, historical
evidence, and compatibility contracts.

Reviewed recovery-source head `75e2741aa3ea5d2cb24fef62fdefb1b5564d4bfe`
enforces that owner boundary for five additional actual public-audio literals
without changing the approved label values, creating a runtime cycle, or widening
scope. The stacked replacement sequence still requires final Task 9 equivalence.

## Compatibility boundary

Keep Prisma objects/migrations, `MASSAGELAB_` environment names, auth/security
identifiers, Stripe metadata/idempotency, browser storage/cache/vault keys, export
schemas, media IDs and durable operation/audit IDs. Google Calendar's existing
summary lookup is a compatibility contract even though the summary is visible.
Dedicated migrations must prove compatibility and rollback before changing such
values. Legal transitions separately require approval, preserved prior documents
and acceptances, a new version/effective date and audit continuity.

## Revisit trigger

The Phase 6 implementation and its reviewed recovery-source head support this
decision; final replacement-stack equivalence, Task 9 integration review and
hosted gates remain pending. Revisit before any compatibility rename,
provider-visible identifier change, external legal filing claim, domain cutover,
or approved-logo integration.

## Immutable source

- [Migration design, terminology and legal invariants](https://github.com/dsbowersock/massagelab/blob/e74045c2fc85c2cb4df176fdb1aff2137c4d9848/docs/superpowers/specs/2026-09-06-atmoshaper-repository-migration-design.md#5-product-and-terminology-model).
- [Legal identity and document versions at merged bootstrap](https://github.com/dsbowersock/atmoshaper/blob/f59e1b9371b06e7401740ae011f6dc911430a97c/lib/legal-documents.js).
- [Proprietary license at merged bootstrap](https://github.com/dsbowersock/atmoshaper/blob/f59e1b9371b06e7401740ae011f6dc911430a97c/LICENSE).
- [Provider compatibility inventory](https://github.com/dsbowersock/atmoshaper/blob/f59e1b9371b06e7401740ae011f6dc911430a97c/docs/rebrand/atmoshaper-external-account-checklist.md).

## Consequences

Mixed names remain intentional where they carry historical, legal-archive,
domain, or compatibility meaning. Phase 6 changes only approved current
presentation and versioned legal text under its reviewed plan. It does not
change compatibility IDs, provider state, production data, external endpoints,
or historical evidence. Current owners remain those linked in the
[architecture map](../architecture.md).
