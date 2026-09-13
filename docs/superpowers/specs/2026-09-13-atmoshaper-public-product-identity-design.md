# AtmoShaper Phase 5 Public Product Identity Boundary Design

Status: approved design direction; written-spec review required before implementation.

Parent design: [AtmoShaper Repository Migration and Modernization Design](2026-09-06-atmoshaper-repository-migration-design.md)

## Purpose

Create one explicit owner for the current public product name and the brand-image
paths used by SEO and the application shell. Rewire a bounded set of presentation
consumers without changing any rendered text, image, route, metadata value,
accessibility label, layout, or runtime behavior.

This is the first Phase 5 refactor. It prepares the later Phase 6 preview rebrand;
it does not perform that rebrand.

## First-principles decision

- **Irreducible outcome:** core public presentation surfaces must stop owning
  separate copies of the same product identity.
- **Non-negotiables:** the runtime still presents `MassageLab`; existing assets,
  legal text, provider behavior, private identifiers, compatibility names, routes,
  accessibility, responsive geometry, and stored data remain unchanged.
- **Assumption rejected:** not every occurrence of `MassageLab` is a public brand
  token. Legal language, email subjects, provider metadata, authored content,
  storage keys, release names, and historical compatibility identifiers have
  distinct owners and must not be swept into this boundary.
- **Smallest sufficient path:** add one data-only identity module and connect only
  SEO identity, manifest/root metadata, app-bar branding, and PWA installation
  presentation.
- **Escalation signal:** if a consumer requires domain policy, legal ownership,
  provider configuration, persistence migration, or broad copy rewriting, it is
  outside this branch and returns to design review.

## Current problem

The current public presentation name and core brand images are repeated across
`lib/seo.js`, `app/manifest.ts`, `app/layout.tsx`, the app-bar link, the mobile
main-bar label, and PWA installation surfaces. Each value is correct today, but
there is no explicit boundary distinguishing presentation identity from legal,
provider, domain, persistence, and compatibility identity.

That ambiguity would make Phase 6 vulnerable to either missed surfaces or an
unsafe global replacement.

## Selected architecture

Add `lib/public-product-identity.js` as a side-effect-free, frozen data module:

```js
export const PUBLIC_PRODUCT_IDENTITY = Object.freeze({
  name: "MassageLab",
  shortName: "MassageLab",
  assets: Object.freeze({
    appBarWordmark: "/brand/massagelab-wordmark-final-20260622.png",
    appBarMark: "/brand/massagelab-mark-final-20260622.png",
    socialPreview: "/brand/massagelab-home-logo-badge-padded-20260622.png",
  }),
})
```

The module must import nothing, read no environment values, and expose no
mutation API. Consumers derive contextual labels such as `MassageLab home`,
`MassageLab main navigation`, and `Install MassageLab` from `name`; the identity
owner does not accumulate complete sentences or route copy.

### Consumer mapping

| Consumer | Uses from the identity owner | Remains consumer-owned |
| --- | --- | --- |
| `lib/seo.js` | public site name and social-preview image path | canonical host, route catalog, descriptions, robots and JSON-LD structure |
| `app/manifest.ts` | public name and short name | manifest behavior, icons, colors, categories, scope and start URL |
| `app/layout.tsx` | Apple web-app title | root composition, metadata structure, icons and viewport |
| `components/shell/app-bar-brand-link.tsx` | public name and app-bar asset paths | link destination, image dimensions, priority, classes and responsive geometry |
| `components/shell/mobile-main-bar.tsx` | public name in the navigation label | control composition and layout |
| `components/sidebar/app-sidebar-client.tsx` | public name in the install action | account/navigation behavior and install eligibility |
| `components/pwa/install-massagelab-dialog.tsx` | public name in the title and iOS guidance | component name, instructions, help route and dialog behavior |

Existing exported SEO constants remain available where consumers or tests rely
on them. They may delegate to the new identity owner, but this branch does not
force unrelated callers onto a new API.

## Observable behavior contract

After the refactor:

- every affected rendered string remains byte-for-byte equivalent to the current
  `MassageLab` output;
- the web manifest still reports `name` and `short_name` as `MassageLab`;
- root Apple web-app metadata still reports `MassageLab`;
- SEO metadata, canonical URLs, JSON-LD, social-preview URLs, and the Open Graph
  image alt value `MassageLab` are unchanged;
- the app-bar still links to `/`, exposes `MassageLab home`, and renders the same
  wordmark and mark with the same dimensions, classes, sizes and priority;
- the mobile main bar still exposes `MassageLab main navigation`;
- install eligibility, action text, dialog copy and help navigation are unchanged;
- server and client consumers may import the identity module without pulling in
  environment, browser, provider, legal or persistence code; and
- no existing image, snapshot, compatibility identifier or stored value is
  renamed, replaced, updated, or deleted.

## Explicit exclusions

This branch does not change or centralize:

- the canonical `massagelab.app` URL or trusted-origin, OAuth, webhook, Calendar,
  email, Vercel, Neon, Stripe, Sentry, R2, DNS or domain configuration;
- the legal operator, copyright owner, license, accepted legal text, document
  versions, effective dates or historical acceptance records;
- support addresses or provider-facing email subjects;
- auth, billing, reconciliation, database, environment-variable, storage, cache,
  vault, media, export, audit or operation identifiers;
- descriptive route copy, authored anatomy/catalog content, historical records,
  product names sold through Stripe, or internal `atmoshaper` compatibility names;
- component, route or file renames, including `InstallMassageLabDialog`;
- dependency versions, `package-lock.json`, schemas, migrations, workflows,
  deployment configuration or hosted provider state; or
- Phase 6 public rebrand values.

## Verification design

### Focused owner tests

Add a focused identity contract test that imports the data module and proves the
exact current values, nested immutability, absence of environment-dependent
behavior, and the intentionally small key set. Update existing source-structure
tests only where an inline literal becomes an owner import; do not weaken their
single-brand-link or install-eligibility assertions. Add direct consumer assertions
for the exact Apple web-app title and the complete iOS install-guidance sentence so
the refactor cannot silently change their text or whitespace.

### Existing behavior oracles

- `tests/seo.test.mjs` continues to verify SEO and route metadata behavior.
- `tests/app-settings.test.mjs` continues to verify one responsive app-bar brand
  link and unchanged responsive CSS ownership.
- `tests/pwa-install.test.mjs` continues to verify install eligibility and menu
  placement.
- `tests/browser/pwa.spec.ts` verifies the served manifest values and icon
  resolution.
- `tests/browser/app-shell.spec.ts` verifies desktop/mobile brand rendering and
  geometry.
- `tests/browser/atmoshaper-repository-migration-parity.spec.ts` remains a
  no-snapshot-update visual and behavior oracle when its separately authorized
  empty Browser-QA lifecycle is available.

### Broad gates

Run the focused tests, repository/brand audits, Prisma validation/generation,
typecheck, lint, the full unit suite, production build, affected Browser QA, and
whitespace/diff checks. Any changed visual snapshot, manifest value, route,
provider call, persisted identifier, legal text, or unexplained brand-audit
classification stops the refactor.

No performance improvement is claimed. Record only bundle/file-count deltas as
observations; the success criterion is ownership clarity with equivalent output.

## Rollback and retirement

The branch is reverted as one bounded identity-owner/consumer change. Reverting
restores the prior inline values and removes the new module without touching
assets, providers, stored data, legal records or external systems.

The old inline copies in the mapped consumers retire when their focused tests and
broad gates pass. All excluded `MassageLab` occurrences remain active under their
existing owners. The new module remains only while at least two mapped public
presentation consumers share it; if the boundary grows into legal, provider,
domain, persistence or arbitrary sentence ownership, the design is falsified and
must be split or reverted.

## Alternatives considered

1. **Global `MassageLab` replacement or universal brand registry — rejected.**
   It confuses presentation identity with legal, provider, persisted and
   compatibility identities and would prematurely perform Phase 6 or later work.
2. **Leave every value inline until Phase 6 — rejected.** It preserves current
   duplication and makes the rebrand a broad, error-prone sweep without a tested
   owner boundary.
3. **Begin with Chimer, music, billing or trusted-origin refactoring — deferred.**
   Those candidates have higher state, timing, payment or security risk and do
   not establish the identity seam that Phase 6 needs next.

## Completion boundary

This design is complete when the written specification is approved and a separate
implementation plan maps every consumer, test, gate, review step and rollback
action. Implementation, push, pull request, Browser-QA provider creation, merge,
deployment, rebrand and all other external mutation remain separately gated.
