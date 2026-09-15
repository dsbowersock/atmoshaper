# AtmoShaper Phase 6 Preview Rebrand and Legal Identity Migration Design

Status: conversational design approved by the user on 2026-09-14, including
the legal-identity and catalog-name amendments; written-spec approval remains
the next gate before implementation planning.

Parent design: [AtmoShaper Repository Migration and Modernization Design](2026-09-06-atmoshaper-repository-migration-design.md)

Predecessor: [Phase 5 Public Product Identity Boundary Design](2026-09-13-atmoshaper-public-product-identity-design.md)

## Purpose

Complete the preview-visible product rebrand from `MassageLab` to `AtmoShaper`
and change the public name of the existing audio mixer from `AtmoShaper` to
`Atmosphere`. Replace old visible wordmark images with an accessible text
fallback until Derrick supplies final brand assets. Migrate current legal
presentation to `Derrick Bowersock, doing business as AtmoShaper` without
rewriting prior acceptance evidence or compatibility identifiers.

This is a local-code and pull-request phase. It is not a production, domain,
provider, data, or infrastructure cutover.

## Approved decisions

- Use a targeted public-surface migration, not a global text replacement.
- The platform name is `AtmoShaper` and the short name is `AtmoShaper`.
- The audio feature's navigation label and page heading are `Atmosphere`.
  Explanatory prose may use `Atmosphere mixer` where the noun improves clarity.
- No logo, monogram, icon, favicon, social card, color system, or slogan will be
  inferred, generated, or redesigned before approved assets are supplied.
- The no-logo presentation uses styled text reading `AtmoShaper`.
- Current legal presentation uses the exact identity `Derrick Bowersock, doing
  business as AtmoShaper`.
- The public catalog labels change as follows while their identifiers, purchase
  ownership, and Stripe mappings remain unchanged:
  - `MassageLaba Lamp` / `Massage Laba Lamp` becomes `Lava Lamp`.
  - `MassageLab tile grid` becomes `Tile grid`.
  - `MassageLab hex grid` becomes `Hex grid`.
- The existing favicon and install-icon files remain unchanged in this
  preview-only phase. Final supplied variants receive their own later branch.

## First-principles boundary

### Irreducible outcome

A person using or previewing the current application should understand
`AtmoShaper` as the platform and `Atmosphere` as its audio mixer without seeing
an old MassageLab wordmark presented as the current product identity.

### Classification rule

Every legacy-name occurrence is classified by meaning before it is changed:

| Meaning | Phase 6 treatment |
| --- | --- |
| Current product presentation | Render `AtmoShaper` through the public identity owner |
| Current audio-feature presentation | Render `Atmosphere` or contextual `Atmosphere mixer` through the feature-label owner |
| Current legal operator or copyright presentation | Render `Derrick Bowersock, doing business as AtmoShaper` |
| Accepted historical legal text | Preserve an exact version-addressable archive |
| Historical migration, attribution, or decision evidence | Preserve original wording and classify it as historical |
| Internal code, route, test, storage, database, environment, provider, release, or audit identifier | Preserve as a compatibility identifier |
| Existing massage, anatomy, clinical, education, treatment-room, and practice terminology | Preserve as domain language |
| Public catalog label derived from the old brand | Use the three explicitly approved replacement labels above |

The migration is complete only when the repository audit has no unexplained
`pre-rebrand-public-copy` entries. A retained occurrence needs a specific
historical, legal-archive, compatibility, provenance, domain, or external-endpoint
reason. File location or capitalization alone is not a reason.

### Protected boundaries

Phase 6 does not rename or migrate:

- the canonical `https://www.massagelab.app` production URL;
- existing support addresses, social URLs, OAuth callbacks, trusted origins,
  webhooks, Calendar configuration, or other endpoints that still function at
  the current domain;
- `MASSAGELAB_` environment variables;
- Prisma models, tables, columns, migrations, database rows, or acceptance rows;
- auth, security, Stripe, billing, entitlement, idempotency, reconciliation,
  storage, cache, vault, media, export, audit, or operation identifiers;
- internal `atmoshaper` route, component, CSS, test, script, data, and playback
  identifiers that already identify the audio implementation;
- source/creator attribution, immutable transaction evidence, prior project-log
  entries, prior plans, migration lineage, or Git history;
- application behavior, feature entitlements, data handling, layout structure,
  or provider configuration; or
- any hosted Vercel, Neon, Stripe, DNS, email, OAuth, R2, Sentry, or production
  state.

No trademark, registration, or entity-status claim is added. Updating the
application's legal presentation does not itself perform or prove any external
trade-name filing.

## Product identity owner and asset fallback

`lib/public-product-identity.js` remains the side-effect-free canonical owner
introduced in Phase 5. Its Phase 6 state is:

```js
export const PUBLIC_PRODUCT_IDENTITY = Object.freeze({
  name: "AtmoShaper",
  shortName: "AtmoShaper",
  assets: Object.freeze({
    appBarWordmark: null,
    appBarMark: null,
    socialPreview: null,
  }),
})
```

`null` means that no approved asset exists. It is not an invitation to infer a
path or generate a substitute. Consumers must handle the absence explicitly:

- the app-bar brand link renders the full accessible text `AtmoShaper` at all
  responsive sizes while retaining the same home link and test boundary;
- the homepage renders the product name as real text rather than a decorative
  image and keeps one semantic page heading;
- SEO and social metadata omit the image field instead of publishing the old
  MassageLab badge or a broken URL;
- manifest and Apple web-app names derive from the new identity values; and
- existing favicon, Apple-touch, ordinary PWA, maskable PWA, and media-session
  icon paths remain untouched until exact approved replacements exist.

The fallback uses the existing type scale, color tokens, and layout vocabulary.
It does not introduce a new font, custom drawn lettering, decorative glyph,
monogram, or substitute mark. Responsive CSS may change only as needed to keep
the full text from clipping, wrapping into controls, or reducing control hit
areas.

## Atmosphere public-label owner

Add a small, side-effect-free module inside `lib/atmosphere/` that owns public
feature terminology, conceptually:

```js
export const ATMOSPHERE_PUBLIC_LABELS = Object.freeze({
  name: "Atmosphere",
  descriptor: "Atmosphere mixer",
})
```

The module owns nouns, not complete sentences. Consumers compose contextual
language such as `Play Atmosphere`, `Stop Atmosphere`, `Atmosphere live mixer`,
and `Open the Atmosphere mixer` from these values.

The public labels apply to navigation, headings, tab names, dialogs, transport
controls, status/live-region announcements, empty and error states, station
artwork fallbacks, media-session presentation, and user-facing test or Browser-QA
queries. They do not rename internal components, files, routes, CSS classes,
data attributes, QA bridges, playback kinds, storage keys, scripts, or technical
tests whose names describe the existing implementation.

For media presentation, the feature title is `Atmosphere` and product/publisher
presentation is `AtmoShaper` where the current UI exposes both concepts.

## Curated public-copy migration

The implementation inventory covers rendered pages, navigation, dialogs,
accessibility text, metadata, manifest values, offline fallbacks, media-session
copy, public commerce copy, public support and social-link prose, and other
runtime strings a user can encounter. Current product voice changes to
`AtmoShaper`; current audio-feature voice changes to `Atmosphere`.

Copy must retain the application's massage-domain purpose. The migration must
not remove or euphemize legitimate references to massage therapy, massage
anatomy, massage students, massage sessions, treatment rooms, therapists,
clinical responsibility, or practice workflows.

The three approved catalog display changes are display-only migrations. Their
stable IDs, registry keys, asset names, ownership records, checkout references,
Stripe metadata, and existing transaction evidence remain unchanged. Tests must
prove that the same stable entries and entitlements are returned under the new
labels.

Component and file names such as `InstallMassageLabDialog` may remain as
compatibility identifiers in Phase 6 when renaming them adds no user-visible
value. Any such retention is classified explicitly rather than hidden by a
broad ignore rule.

## Legal document versioning and historical evidence

The current model records `documentKey` and `documentVersion` in acceptance
rows, but the repository presently exposes only the latest document text.
Changing that text in place would leave prior version IDs without an exact
current-repository copy of what was accepted. Phase 6 must close that evidence
gap before changing current legal wording.

### Immutable pre-rebrand archive

Before editing `lib/legal-documents.js`, serialize the exact currently rendered
documents into repository-owned, deterministic historical snapshots keyed by
their existing acceptance IDs:

- the six documents using `2026-06-legal-v2` with their `June 24, 2026`
  effective date; and
- `digital-purchases-refunds:2026-07-digital-purchases-v2` with its `July 23,
  2026` effective date.

The archive contains only public legal copy and metadata already in the source;
it contains no users, acceptance rows, timestamps, credentials, database data,
or other personal information. A focused test must compare the archive against
the exact pre-change exports before the current documents are migrated and must
prove that every archived `key:version` is unique and immutable.

Historical snapshots are evidence, not the current document registry. Current
pages, acceptance prompts, and checkout continue to use `LEGAL_DOCUMENTS`.

### New current versions

The AtmoShaper legal copy uses new version IDs rather than reusing old IDs:

- the six general documents use `2026-09-legal-v3`;
- the digital-purchase document uses
  `2026-09-digital-purchases-v3`; and
- both current sets use `September 14, 2026` as their effective date.

Current headings, summaries, notices, and body text migrate product references
from `MassageLab` to `AtmoShaper`. The operator constant becomes exactly
`Derrick Bowersock, doing business as AtmoShaper`. The substantive data,
professional-responsibility, billing, refund, local-first, privacy, and scope
terms otherwise remain unchanged unless grammar requires a bounded edit.

Existing database acceptance rows remain untouched and continue to point to the
archived version IDs. No backfill marks a new version accepted. Existing event
logic naturally requires the new current version when a workflow checks for the
current document set, and a genuine new acceptance creates a new versioned row
without deleting the old one. The implementation plan must add tests for this
coexistence before any browser flow is exercised.

The repository license, current copyright surfaces, legal-page metadata, and
current footer presentation use the approved new legal identity. Historical
license text in Git history, migration records, archived legal documents, and
past receipts is not rewritten.

## SEO, manifest, and external endpoints

Product names, titles, descriptions, JSON-LD names, image alt values, PWA names,
Apple web-app titles, offline titles, and other current presentation metadata
move to `AtmoShaper`. The old social-preview image is omitted while
`PUBLIC_PRODUCT_IDENTITY.assets.socialPreview` is `null`.

The canonical host stays `https://www.massagelab.app`, and current functional
support/social/provider URLs stay unchanged. Copy may call the product
`AtmoShaper` while linking to a retained endpoint. Phase 6 must not fabricate an
`atmoshaper` domain, email address, handle, callback, or provider project.

## Documentation and audit state

Current-state documentation must be synchronized with the actual Phase 5 merge
before recording Phase 6 implementation. `docs/project-state.md`,
`docs/project-log.md`, `README.md`, the migration charter, architecture/decision
indexes, and the relevant identity ADR must distinguish:

- completed Phase 5 identity ownership;
- Phase 6 preview rebrand and legal-version migration;
- retained compatibility and external-endpoint names;
- the temporary text-only brand fallback;
- the unstarted final-logo branch; and
- the still-unstarted deployment/provider/domain phases.

Prior dated project-log entries, accepted specifications, plans, and historical
receipts retain their original text. Current summaries may link to them and
state that they are historical.

The brand-reference baseline is regenerated only through its deterministic
audit workflow. The generated result must be a fixed point, have zero missing
or unclassified matches, and contain zero unexplained
`pre-rebrand-public-copy` entries. Broad filename, directory, or extension
allowlists are not acceptable substitutes for classifying each retained owner.

## Visual and behavioral contract

The intended visual differences are limited to product text, audio-feature
text, the absence of old wordmark/social imagery, and the three approved catalog
labels. Icons, general layout, controls, colors, routes, interactions, feature
availability, and data behavior remain stable.

The historical bootstrap parity snapshot remains unchanged as evidence of the
verified source export. Phase 6 must not overwrite it. Add a new Phase 6 preview
visual baseline or a separately named visual oracle for the approved rebrand.
Browser receipts must cover at least:

- homepage product presentation;
- app-bar branding at desktop, tablet, and narrow mobile widths;
- navigation and headings for `Atmosphere`;
- closed and expanded Atmosphere mixer geometry;
- install dialog and served manifest naming;
- SEO output with no stale or broken social image;
- current legal index, one general legal document, the digital-purchase policy,
  and a versioned acceptance flow; and
- the three renamed background labels with unchanged stable ownership behavior.

No unrelated snapshot update is permitted. A geometry regression, clipped
brand text, remaining contradictory old wordmark, broken icon, changed route,
lost focus behavior, altered playback behavior, or modified stored identifier
blocks completion.

## Verification design

### Focused contracts

- Product identity tests prove exact `AtmoShaper` values, explicit null asset
  state, nested immutability, and deterministic text fallback behavior.
- Atmosphere label tests prove the exact two approved labels and verify that
  representative UI, accessibility, transport, and media consumers delegate to
  the label owner while internal identifiers remain unchanged.
- SEO tests prove the new product copy, unchanged canonical host, and omission
  of social-image metadata when no approved image exists.
- PWA tests prove new manifest names and unchanged existing icon URLs.
- Catalog tests prove the three exact new display labels and unchanged IDs,
  entitlements, ownership, and commerce mappings.
- Legal tests prove exact pre-rebrand archive content, new version/effective-date
  values, exact new operator wording, coexistence of old and new acceptance
  rows, and rejection of any attempted silent acceptance backfill.
- Repository audit tests prove deterministic classification with no unexplained
  public-copy candidates.

### Broad gates

Run formatting/diff checks, focused tests, repository and brand audits, Prisma
validation and generation, type checking, lint, the full unit suite, production
build, all Browser-QA lanes, and responsive visual verification. Browser QA
must use an empty temporary QA database with no production data. Creating that
provider resource requires fresh authorization and it must be deleted after the
final evidence is captured.

The exact feature head must pass every hosted check and receive CodeRabbit review
coverage with no actionable unresolved threads before merge is requested.

## Delivery shape and authorization boundaries

Use one focused branch, `codex/atmoshaper-phase6-preview-rebrand`, created from
the exact merged Phase 5 `origin/main` commit. Organize implementation into
reviewable commits for:

1. product identity, no-logo fallback, and metadata;
2. Atmosphere public labels and curated runtime copy;
3. catalog display labels with stable compatibility mappings;
4. legal archives, current legal versions, and acceptance tests; and
5. audit baseline, documentation, and final verification evidence.

The written specification is committed before implementation planning. After
written-spec approval, a separate Superpowers implementation plan must enumerate
the exact files, tests, red/green commands, rollback points, and subagent review
gates for each task.

No branch push, pull request, provider creation, merge, deployment, domain
change, or hosted mutation is implied by design/spec approval. Each later
authorization boundary remains explicit. Once a PR is authorized, hosted review
is babysat at the exact head: valid findings are fixed at their root cause,
reviews are retriggered only when eligible, and merge waits for separate user
authorization.

## Rollback

Before deployment, rollback is a branch/PR revert. The historical legal archive
remains valid evidence even if the new current legal version is reverted.
Reverting current presentation restores the previous identity values and UI
copy without deleting acceptance rows, changing provider state, renaming stored
identifiers, or rewriting the immutable archive.

If the text fallback cannot meet responsive geometry without an invented mark,
the phase stops for design review rather than introducing an unapproved visual.
If the legal archive cannot reproduce the exact current document exports, legal
copy migration stops before any version change.

## Alternatives rejected

1. **Global replacement.** Rejected because it would corrupt compatibility,
   historical, provider, persistence, and domain-specific meanings.
2. **Minimal shell-only rename.** Rejected because secondary pages and audio
   controls would continue presenting contradictory current branding.
3. **Keep the old wordmark beside the new name.** Rejected because it presents
   two current identities and defeats the preview.
4. **Generate temporary logo or icon variants.** Rejected because Derrick is
   creating the logo and no variant may be inferred.
5. **Edit legal text under the existing version IDs.** Rejected because it would
   make prior acceptance evidence point to different text.
6. **Rename internal identifiers with the visible copy.** Rejected because it
   adds persistence and compatibility risk without improving the public result.

## Completion boundary

This design checkpoint is complete when this written specification is
self-reviewed, committed, and approved by the user. Phase 6 implementation may
then begin only from the separately reviewed implementation plan. The phase is
not complete until the public preview is coherent, historical legal evidence is
preserved, all required local and hosted gates pass at the exact head, and the
PR is separately authorized for merge.
