# ADR 0002: Public Identity, Legal and Compatibility Boundaries

Status: Proposed

## Context

AtmoShaper is the repository and future public platform identity, while the runtime
still presents MassageLab and the internal audio subsystem already uses
`atmoshaper`. Legal agreements and durable technical identifiers cannot be treated
as interchangeable public copy.

## Decision

Propose a focused central owner for public product copy, approved assets and public
feature labels, with explicit separation from legal, origin, provider and private
compatibility identities. That central public-brand owner is not implemented by
Phase 3. Preview rebranding remains Phase 6 work under its own reviewed plan.

Binding now: preserve existing runtime copy/design until that phase; retain Chimer,
Anatomime, Calendar, Notes, Wellness and accurate massage-domain terminology. The
later public audio label is `Atmosphere` or `Atmosphere mixer`; internal `atmoshaper`
modules, paths, tests, storage, release tooling and media identities remain stable.
Do not globally replace names. Use only supplied, approved logo assets; missing
variants must not be invented.

The [LICENSE](../../LICENSE), [legal documents](../../lib/legal-documents.js) and
[acceptance owner](../../lib/legal-acceptance.js) retain their current operator,
copyright, proprietary terms, accepted text, versions, effective dates and acceptance
history. No registration or trademark claim follows from the repository name.

## Rationale

A public-brand boundary can reduce future copy drift while preserving historical
agreements and reconciliation. Global replacement or changing legal identity as a
side effect of a display rebrand would erase those distinctions. The migration
design rejects combining repository work, rebrand and cutover.

## Compatibility boundary

Keep Prisma objects/migrations, `MASSAGELAB_` environment names, auth/security
identifiers, Stripe metadata/idempotency, browser storage/cache/vault keys, export
schemas, media IDs and durable operation/audit IDs. Google Calendar's existing
summary lookup is a compatibility contract even though the summary is visible.
Dedicated migrations must prove compatibility and rollback before changing such
values. Legal transitions separately require approval, preserved prior documents
and acceptances, a new version/effective date and audit continuity.

## Revisit trigger

Revisit during focused brand-owner implementation and Phase 6 review, or before any
legal/operator change, compatibility rename, provider-visible label change or logo
integration. Accept the proposed architecture only after implementation and relevant
copy, accessibility, visual, legal-boundary and compatibility verification.

## Immutable source

- [Migration design, terminology and legal invariants](https://github.com/dsbowersock/massagelab/blob/e74045c2fc85c2cb4df176fdb1aff2137c4d9848/docs/superpowers/specs/2026-09-06-atmoshaper-repository-migration-design.md#5-product-and-terminology-model).
- [Legal identity and document versions at merged bootstrap](https://github.com/dsbowersock/atmoshaper/blob/f59e1b9371b06e7401740ae011f6dc911430a97c/lib/legal-documents.js).
- [Proprietary license at merged bootstrap](https://github.com/dsbowersock/atmoshaper/blob/f59e1b9371b06e7401740ae011f6dc911430a97c/LICENSE).
- [Provider compatibility inventory](https://github.com/dsbowersock/atmoshaper/blob/f59e1b9371b06e7401740ae011f6dc911430a97c/docs/rebrand/atmoshaper-external-account-checklist.md).

## Consequences

Mixed names remain intentional until their owning phase changes them. This record
documents existing constraints but does not modify legal text, runtime copy,
compatibility IDs or provider state. Current owners remain those linked in the
[architecture map](../architecture.md).
