# ADR 0002: Public Identity, Legal and Compatibility Boundaries

Status: Proposed

## Context

Merged Phase 5 introduced one public-product identity owner while deliberately
leaving rendered MassageLab values unchanged. Phase 6 has separate approval to
present the platform as AtmoShaper, present the audio feature as Atmosphere, and
migrate current legal presentation under new document versions. Historical legal
agreements and durable technical identifiers still cannot be treated as current
public copy.

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

## Compatibility boundary

Keep Prisma objects/migrations, `MASSAGELAB_` environment names, auth/security
identifiers, Stripe metadata/idempotency, browser storage/cache/vault keys, export
schemas, media IDs and durable operation/audit IDs. Google Calendar's existing
summary lookup is a compatibility contract even though the summary is visible.
Dedicated migrations must prove compatibility and rollback before changing such
values. Legal transitions separately require approval, preserved prior documents
and acceptances, a new version/effective date and audit continuity.

## Revisit trigger

Revisit after complete Phase 6 implementation and verification, or before any
compatibility rename, provider-visible identifier change, external legal filing
claim, domain cutover, or approved-logo integration. Mark this record Accepted only
after current copy, accessibility, visual, legal-archive/acceptance, audit, and
compatibility gates pass.

## Immutable source

- [Migration design, terminology and legal invariants](https://github.com/dsbowersock/massagelab/blob/e74045c2fc85c2cb4df176fdb1aff2137c4d9848/docs/superpowers/specs/2026-09-06-atmoshaper-repository-migration-design.md#5-product-and-terminology-model).
- [Legal identity and document versions at merged bootstrap](https://github.com/dsbowersock/atmoshaper/blob/f59e1b9371b06e7401740ae011f6dc911430a97c/lib/legal-documents.js).
- [Proprietary license at merged bootstrap](https://github.com/dsbowersock/atmoshaper/blob/f59e1b9371b06e7401740ae011f6dc911430a97c/LICENSE).
- [Provider compatibility inventory](https://github.com/dsbowersock/atmoshaper/blob/f59e1b9371b06e7401740ae011f6dc911430a97c/docs/rebrand/atmoshaper-external-account-checklist.md).

## Consequences

During planning, mixed names remain intentional. Phase 6 may change only approved
current presentation and versioned legal text under its reviewed plan. It does not
change compatibility IDs, provider state, production data, external endpoints, or
historical evidence. Current owners remain those linked in the
[architecture map](../architecture.md).
