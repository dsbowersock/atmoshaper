# AtmoShaper Phase 6 Preview Rebrand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Present the current application consistently as `AtmoShaper`, present
its audio mixer as `Atmosphere`, remove the obsolete MassageLab wordmark/social
image from current presentation, migrate current legal text to the approved
AtmoShaper DBA identity under new versions, and preserve every historical,
provider, persistence, domain, and other compatibility contract.

**Architecture:** Keep `PUBLIC_PRODUCT_IDENTITY` as the sole product-name and
approved-asset owner; add one dependency-free `ATMOSPHERE_PUBLIC_LABELS` noun
owner for the audio feature; curate current copy by semantic class; archive the
exact pre-change legal registry before publishing new current versions; and use
the occurrence-level brand audit to prove that every retained legacy name has a
specific non-current-copy reason.

**Tech Stack:** Node.js 24 ESM, TypeScript, React 19, Next.js 16 metadata and
manifest APIs, Prisma 7, Node's built-in test runner, ESLint, Playwright,
repository/brand audit tooling, Neon disposable Browser QA, Git, GitHub Actions,
and CodeRabbit.

**Spec:**
`docs/superpowers/specs/2026-09-14-atmoshaper-phase6-preview-rebrand-design.md`

## Global Constraints

- This is a targeted current-presentation migration, never a global string,
  symbol, path, filename, or identifier replacement.
- Product presentation is `AtmoShaper`. Audio-feature presentation is
  `Atmosphere`; use `Atmosphere mixer` only where explanatory grammar needs a
  noun phrase.
- Current legal identity is exactly
  `Derrick Bowersock, doing business as AtmoShaper`.
- No logo, mark, icon, social image, slogan, domain, email address, handle, or
  provider name may be invented. `null` identity assets mean unavailable.
- Keep the exact existing favicon, Apple-touch, PWA, maskable-PWA, and
  media-session icon paths. Keep `https://www.massagelab.app`, existing support
  and social URLs, OAuth callbacks, trusted origins, webhooks, and provider
  endpoints.
- Keep `MASSAGELAB_` environment variables, package identity, Prisma objects and
  migrations, acceptance rows, storage/cache/vault keys, auth/security names,
  Stripe metadata and idempotency, entitlement keys, media IDs, release/audit
  IDs, internal `atmoshaper` identifiers, and existing transaction evidence.
- Preserve legitimate massage, anatomy, clinical, education, session,
  treatment-room, therapist, and practice terminology.
- Do not rewrite prior plans, dated log entries, migration lineage, Git history,
  accepted legal text, creator/source attribution, or historical receipts.
- The historical migration-parity test and snapshot remain byte-unchanged. New
  Phase 6 screenshots use a separately named oracle.
- No database schema or data migration is permitted. Old and new legal
  acceptance rows must coexist through the existing versioned unique key.
- No production data may be supplied, copied, read, or altered. Browser QA uses
  a freshly authorized, independent, empty temporary Neon project that is
  fingerprint-gated, migrated only from the repository, proven empty before and
  after QA, deleted, and proved absent.
- Push, PR creation, hosted review, merge, deployment, provider mutation,
  domain/DNS cutover, and final-logo integration remain separate gates.
- Every implementation task starts with a `TaskStartSnapshot`, uses a fresh
  implementer, receives independent specification and quality review, and is
  staged and committed only by the coordinator after both reviews pass.

## Baseline and Authority Refs

- Branch: `codex/atmoshaper-phase6-preview-rebrand`.
- Approved design and starting HEAD:
  `1c3683c31dcb8624a61d749fbcacddd85973dbe2`.
- Exact Phase 5 merge and tracked `origin/main`:
  `cdfa99e49cebf100fac1a5080d60514806eb17db`.
- Phase 5 reviewed feature parent:
  `b25b817da126359c5ffc15954182cc9573413735`.
- Phase 5 integration: <https://github.com/dsbowersock/atmoshaper/pull/4>.
- Read-first authority: `AGENTS.md`, `docs/project-state.md`,
  `docs/project-log.md`, `docs/wiki/index.md`, this plan, and the approved spec.
- Migration boundaries: `MIGRATION_LINEAGE.md`,
  `docs/rebrand/atmoshaper-migration-charter.md`,
  `docs/rebrand/atmoshaper-refactor-register.md`, `docs/architecture.md`, and
  `docs/decisions/0002-public-identity-legal-and-compatibility-boundaries.md`.
- Current runtime owners: `lib/public-product-identity.js`, `lib/seo.js`,
  `lib/legal-documents.js`, `lib/legal-acceptance.js`,
  `components/backgrounds/backgroundRegistry.ts`, `lib/atmosphere/`, and
  `components/atmoshaper/`.
- Audit owners: `scripts/repository-audit/policy.json`,
  `scripts/repository-audit/brand-reference-baseline.json`,
  `scripts/repository-audit/brand.mjs`, and
  `tests/repository-audit.test.mjs`.

## BaselineUsageDraft

- Required refs: every authority, runtime owner, audit owner, and focused test
  named in this plan.
- Acknowledged before planning: all required current-state, design, identity,
  legal, audio, catalog, audit, and Browser-QA owners; the chronological log was
  read through bounded current/recent sections because it is intentionally long.
- Cited in plan: exact owners, consumer groups, test oracles, protected
  compatibility values, legal archive/version sequence, and external gates.
- Missing refs: no local implementation reference is missing. A new disposable
  Browser-QA project intentionally does not exist before fresh authorization.
- Decision: local plan is ready; external execution remains gated.

## Requirement Ready Check

- Requirement source: approved written Phase 6 design plus the user's exact
  product, feature, legal-identity, no-logo, and catalog-label decisions.
- Acceptance: coherent current presentation; no stale current wordmark/social
  image; exact feature terminology; exact v2 legal archive; exact v3 current
  legal values; old/new acceptance coexistence; stable catalog ownership; zero
  unexplained public-copy audit entries; broad local and authorized browser
  gates; exact-head hosted review before merge.
- Ambiguity disposition: `MassageLaba Lamp` and `Massage Laba Lamp` become
  `Lava Lamp`; `MassageLab tile grid` and `MassageLab hex grid` lose the product
  prefix; other current product-prefixed effect prose becomes `AtmoShaper ...`
  while internal effect symbols and filenames remain unchanged.
- Open blocker questions: none for local implementation.
- External blockers: disposable QA creation, publication, merge, deployment,
  provider/domain mutation, and final supplied assets each require their later
  authorization.
- Decision: ready.

## TDD Route

- Mode: off.
- Decision: strict RED/GREEN is skipped for this approved semantic migration.
- Reason: expected behavior is already fully specified, and the work changes a
  large set of current presentation strings while deliberately preserving
  behavior and compatibility. Artificial per-string failures would add ceremony
  without strengthening the contract.
- Verification: add or update focused contracts in the same task, run them after
  each coherent slice, preserve existing behavior tests, then run broad local,
  audit, build, and authorized browser gates. A discovered behavior defect is
  repaired with a focused failing regression before its fix.

## Change Necessity

- Observed problem: the current preview still presents two competing product
  names, uses an obsolete wordmark/social image, exposes the internal mixer name
  as public copy, and cannot reproduce the exact legal text referenced by old
  acceptance versions after an in-place legal edit.
- No-change option: rejected because it leaves the approved public identity
  migration incomplete and weakens acceptance evidence.
- Minimum coherent change: update the existing product owner, add one feature
  noun owner, migrate current copy by semantic class, archive old legal exports,
  publish new legal versions, and prove protected contracts unchanged.
- Decision: code-change.

## Existence Check

- Product owner: reuse `PUBLIC_PRODUCT_IDENTITY`; adding another brand registry
  would create competing ownership.
- Feature owner: no neutral public feature-label module exists. Add
  `lib/atmosphere/public-labels.js`; importing product identity or UI components
  into the audio domain would couple unrelated concepts.
- Public audio-presentation boundary: no reusable neutral formatter/resolver
  exists. The only similarly named helper is the private, commerce-specific
  `normalizePublicError` in `lib/background-commerce-client.js`, whose policy is
  unrelated to audio presentation. Add one separate pure
  `lib/atmosphere/public-presentation.js` module for public error formatting and
  exact compatibility-default title resolution instead of polluting the
  noun-only label owner, rewriting internal runtime exceptions, or changing
  stored custom recipe names.
- Legal archive: no version-addressable repository copy or safe archive writer
  exists. Add `scripts/legal-document-archive.mjs` and deterministic data files;
  keep `LEGAL_DOCUMENTS` as the only current runtime owner.
- Catalog owner: reuse `backgroundRegistry`; mirrored catalog/audit/preview data
  remain generated or contract mirrors, not new authorities.
- Audit owner: extend the existing match-scoped classifier only where a retained
  occurrence is a proven compatibility form. Do not add broad path exemptions.
- Decision: reuse-with-bounded-additions.

## Architecture Integrity Lens

- Product invariant: current product copy changes through
  `PUBLIC_PRODUCT_IDENTITY` where it represents the product noun; contextual
  sentences remain with their domain owners.
- Feature invariant: UI and media consumers depend inward on noun-only
  `ATMOSPHERE_PUBLIC_LABELS`; internal `atmoshaper` implementation names never
  depend on public wording.
- Legal invariant: archive first, verify exactness, then change the current
  registry. Archive data never becomes a fallback current registry.
- Compatibility invariant: identifiers, provider values, URLs, persisted data,
  and historical evidence remain unchanged and receive focused negative tests.
- Audit invariant: classification is occurrence-scoped; a current-copy literal
  cannot be hidden because the same file also contains an internal identifier.
- Falsifiers: stop if archive output differs from current v2 exports, a task
  requires schema/provider mutation, a retained current-copy occurrence lacks a
  reason, or responsive text cannot fit without an invented mark.
- Verdict: proceed.

## Plan Pressure Test

- Owner and contract: one product owner, one feature noun owner, one current
  legal registry, one deterministic legal archive boundary, and one catalog
  registry are named explicitly.
- Systematic correction: tasks are grouped by semantic owner and consumer class,
  not by individual reviewer comments or one-off literals.
- Compatibility: explicit positive presentation assertions pair with negative
  assertions for canonical URL, icons, env names, package name, internal audio
  IDs, catalog IDs, Stripe/entitlement mappings, and old acceptance rows.
- Retirement: obsolete current literals and old wordmark/social-image references
  retire; approved internal/historical/provider/persistence values remain.
- Test integrity: historical parity stays immutable; Phase 6 gains its own
  browser oracle; no snapshot is updated merely to make a failure disappear.
- Executability: every task below names files, changes, commands, expected
  results, review order, commit message, rollback, and stop condition.
- Pressure result: proceed.

## Plan-Time Complexity Check

- New runtime surfaces: one frozen two-field feature-label object and one
  stateless public-presentation module with exact-token/fallback error branches
  plus exact-default/absent/custom title resolution.
  Neither reads environment or browser state, calls providers, persists data,
  mutates inputs, or owns runtime exceptions/telemetry.
- New tooling surface: one deterministic legal-archive script with one explicit
  write mode and fail-closed overwrite behavior.
- No dependency, lockfile, schema, migration, workflow, route, entitlement, or
  provider-configuration changes.
- Broad copy edits are unavoidable but remain mechanically simple. Complexity
  is controlled by semantic grouping, source-owner tests, occurrence-level
  auditing, per-task commits, and independent reviews.
- Decision: within budget.

## Execution Readiness View

- Route: subagent-driven, as selected by the user.
- Implementer: a fresh implementer receives only one task and does not stage or
  commit.
- Review: a fresh specification reviewer examines the task diff first; after
  repairs, a fresh quality reviewer examines the same bounded diff.
- Coordinator: captures each `TaskStartSnapshot`, inspects scope, runs required
  checks, stages only reviewed paths, updates the checkpoint, and commits once.
- Anti-entropy: after each task, re-scan legacy occurrences and protected values;
  if a change crosses task ownership, revert that portion and route it to the
  owning task instead of creating a cross-layer helper.
- Readiness verdict: executable after this planning package is committed.

## Protected-Value Contract

The following exact values or families must remain unchanged and receive
source-level or behavior assertions before local closeout:

- `https://www.massagelab.app` and all existing massagelab.app URLs.
- Existing support email addresses and `MASSAGELAB_SOCIAL_URLS` values.
- `/icons/icon-192.png`, `/icons/icon-512.png`, maskable variants,
  `/icons/apple-touch-icon.png`, and media-session icon paths.
- Package and lockfile package name `massagelab`; `MASSAGELAB_...` environment
  names; Prisma schema/migration files.
- Internal route/module/CSS/test/playback/QA names containing `atmoshaper`,
  including category ID and playback kind `atmoshaper` and QA bridges.
- Google Calendar summary/configuration and existing external event/provider
  values; Stripe product, metadata, idempotency, price, reconciliation, and
  entitlement identifiers.
- Background stable IDs, registry keys, filenames, asset paths, ownership keys,
  checkout references, and prior transaction evidence.
- Existing `LegalAcceptance` rows and the compound unique key
  `(userId, documentKey, documentVersion)`.

## Task 0: Record the exact pre-implementation baseline

**Files:**

- Modify: `docs/aegis/work/2026-09-14-atmoshaper-phase6-preview-rebrand/20-checkpoint.md`
- Create: `docs/aegis/work/2026-09-14-atmoshaper-phase6-preview-rebrand/90-evidence.md`

- [ ] Capture `TaskStartSnapshot`: branch, `HEAD`, `origin/main`, clean status,
  active Git operation state, worktree list, and retained branches. Confirm HEAD
  is the committed approved spec and its parent is exact Phase 5 merge.
- [ ] Run from the clean committed planning state:

  ```powershell
  npm run repository:inventory
  npm run brand:audit
  npm run build
  ```

  Expected: inventory reports zero forbidden paths; brand audit reports zero
  missing entries, zero unclassified entries, and the recorded pre-rebrand
  public-copy queue; production build exits zero and generates the full route
  table.
- [ ] Record exact counts, hashes, route total, and non-fatal messages in
  `90-evidence.md`. State that byte/route measurements are observations, not
  performance claims.
- [ ] Confirm `git status --short` contains only these evidence/checkpoint files
  and `git diff --check` passes.
- [ ] Run independent specification review, then quality review. Repair and
  re-review until both pass.
- [ ] Coordinator stages only these files and commits:

  `docs: record phase 6 baseline`

**Rollback:** Revert this evidence-only commit. No runtime or external state is
affected.

## Task 1: Switch product identity to text-only AtmoShaper presentation

**Files:**

- Modify: `lib/public-product-identity.js`
- Modify: `components/shell/app-bar-brand-link.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`
- Modify: `lib/seo.js`
- Modify: `public/offline.html`
- Modify: `public/sw.js`
- Modify: `tests/public-product-identity.test.mjs`
- Modify: `tests/seo.test.mjs`
- Modify: `tests/app-settings.test.mjs`
- Modify: `tests/pwa-install.test.mjs`
- Modify: `tests/browser/app-shell.spec.ts`
- Modify: `tests/browser/pwa.spec.ts`
- Modify: `tests/browser/public-routes.spec.ts`

- [ ] Capture `TaskStartSnapshot` and confirm no unrelated worktree change.
- [ ] Change only the approved product owner values:

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

- [ ] Make `AppBarBrandLink` preserve the existing home link and test boundary.
  When `appBarWordmark` is null, render one visible
  `<span className="ml-app-bar-brand-text">` with the owner name. Render the
  existing `Image` branches only when their corresponding approved path is
  non-null; do not create a substitute mark.
- [ ] Add `.ml-app-bar-brand-text` using existing font, color, spacing, and focus
  vocabulary. It remains visible at desktop, tablet, and narrow container sizes;
  the existing container query continues to affect image classes only. Do not
  reduce adjacent control hit areas.
- [ ] Replace the homepage decorative wordmark with one visible text `<h1>` that
  retains `data-testid="home-brand-wordmark"`. Remove the now-unused `Image`
  import and `home-brand-wordmark-image`; update current homepage product copy
  to AtmoShaper while retaining massage-domain terms and layout structure.
- [ ] In `lib/seo.js`, keep `SEO_CANONICAL_BASE_URL` exact. Let
  `SEO_DEFAULT_IMAGE` be `null`; create an absolute image URL only when the
  owner supplies a path. Omit `openGraph.images`, `twitter.images`, and the
  Organization `logo` property when absent. Use Twitter card `summary` without
  an image and `summary_large_image` with one. Migrate current product titles,
  descriptions, application name, site name, and image alt copy to AtmoShaper.
- [ ] Update offline/fallback current presentation in `public/offline.html` and
  `public/sw.js` without renaming cache keys, files, routes, or install icons.
- [ ] Update focused tests to prove exact AtmoShaper values, explicit nulls,
  immutability, conditional image omission, unchanged canonical URL/social URLs,
  unchanged PWA icon paths, homepage semantic heading, and responsive app-bar
  text without old image elements.
- [ ] Update Browser-QA locators/assertions for the intended current copy only.
  Do not alter the historical migration-parity spec or its snapshots.
- [ ] Run:

  ```powershell
  node --test tests/public-product-identity.test.mjs tests/seo.test.mjs tests/app-settings.test.mjs tests/pwa-install.test.mjs
  npm run typecheck
  git diff --check
  ```

  Expected: all focused tests and typecheck pass; diff check is empty; no
  canonical URL, icon, route, cache key, provider, schema, or snapshot changes.
- [ ] Run `rg -n "massagelab-(?:wordmark|mark|home-logo)|MassageLab"
  lib/public-product-identity.js components/shell/app-bar-brand-link.tsx
  app/page.tsx lib/seo.js public/offline.html public/sw.js` and inspect every
  remaining match. Expected: no obsolete current wordmark/social-image reference;
  any retained endpoint or compatibility value is explicitly accounted for.
- [ ] Independent specification review, repairs/re-review, then independent
  quality review and repairs/re-review.
- [ ] Coordinator stages only Task 1 files and commits:

  `feat: present AtmoShaper without legacy brand assets`

**Rollback:** Revert Task 1. This restores the Phase 5 presentation seam and old
preview copy without changing external state.

## Task 2: Add the Atmosphere public-label owner and migrate audio presentation

**Files:**

- Create: `lib/atmosphere/public-labels.js`
- Create: `tests/atmosphere-public-labels.test.mjs`
- Modify: `components/atmosphere/station-carousel.tsx`
- Modify: `components/atmosphere/station-artwork.tsx`
- Modify: `components/atmosphere/station-carousel-card.tsx`
- Modify: `components/atmoshaper/current-mix.tsx`
- Modify: `components/atmoshaper/atmoshaper-workspace.tsx`
- Modify: `components/atmoshaper/sound-library.tsx`
- Modify: `components/providers/music-provider.tsx`
- Modify: `components/providers/music-mini-player.tsx`
- Modify: `components/ui/music-player.tsx`
- Create: `lib/atmosphere/public-presentation.js`
- Modify: `lib/atmosphere/media-session-controller.js`
- Modify: `lib/atmosphere/stations.js`
- Create: `tests/atmosphere-public-presentation.test.mjs`
- Modify: `tests/atmosphere-media-session-controller.test.mjs`
- Modify: `tests/atmosphere-stations.test.mjs`
- Modify: `tests/carousel-lab-source.test.mjs`
- Modify: `tests/atmoshaper-layout-source.test.mjs`
- Modify: `tests/atmoshaper-ui-refinement-source.test.mjs`
- Modify: `tests/atmoshaper-workspace-source.test.mjs`
- Modify: `tests/music-mini-player-source.test.mjs`
- Modify: `tests/browser/atmoshaper.spec.ts`
- Modify: `tests/browser/music-media-session.spec.ts`

- [ ] Capture `TaskStartSnapshot` and complete the Existence Check in the Aegis
  checkpoint before adding the new module.
- [ ] Add exactly one dependency-free frozen noun owner:

  ```js
  /** Public nouns for the audio experience; internal implementation IDs remain stable. */
  export const ATMOSPHERE_PUBLIC_LABELS = Object.freeze({
    name: "Atmosphere",
    descriptor: "Atmosphere mixer",
  })
  ```

- [ ] Add a focused contract proving exact key order/values, immutability, and no
  imports, environment, browser, provider, or mutation dependencies.
- [ ] Change navigation/group title/page heading to `name`; compose controls,
  status/live-region text, dialog prose, empty/error states, and accessibility
  text from `name` or `descriptor` as appropriate. Do not centralize sentences.
- [ ] Make the persistent mini-player consume the noun owner for its default
  title, region label, and volume label; do not let its source contract bless
  repeated public literals.
- [ ] Add one dependency-light public-presentation boundary beside the noun
  owner. Its error formatter replaces the exact internal `AtmoShaper`
  compatibility token with `Atmosphere` only at public UI/error boundaries,
  preserves unrelated message text, accepts an explicit fallback, and never
  mutates or rewrites the stored runtime exception or telemetry value. Its
  title resolver maps only the exact compatibility-default recipe name
  `AtmoShaper` (or an absent name) to `Atmosphere` while preserving custom recipe
  names. Reuse the resolver at every provider/media title publication site.
  Cover exact error replacement, unrelated text, non-error/fallback input,
  error immutability, exact default-title mapping, absent names, and custom-name
  preservation.
- [ ] Media presentation uses `Atmosphere` for feature title and `AtmoShaper`
  from `PUBLIC_PRODUCT_IDENTITY` for artist/publisher/album copy. Rename the
  current proof-station display from `MassageLab Proof Drone` to
  `AtmoShaper Proof Drone`; keep its stable station ID, audio URL, license/source
  record, and playback behavior.
- [ ] Preserve component/filesystem/CSS/data/test symbols, category ID
  `atmoshaper`, playback kind `atmoshaper`, QA bridge names, runtime telemetry,
  and production catalog identifiers.
- [ ] Update focused tests and Browser-QA queries to prove visible/accessible
  `Atmosphere` copy and unchanged internal identifiers. Keep technical test names
  where they identify the implementation rather than rendered copy.
- [ ] Run:

  ```powershell
  node --test tests/atmosphere-public-labels.test.mjs tests/atmosphere-public-presentation.test.mjs tests/atmosphere-media-session-controller.test.mjs tests/atmosphere-stations.test.mjs tests/carousel-lab-source.test.mjs tests/atmoshaper-layout-source.test.mjs tests/atmoshaper-ui-refinement-source.test.mjs tests/atmoshaper-workspace-source.test.mjs tests/music-mini-player-source.test.mjs
  npm run typecheck
  git diff --check
  ```

  Expected: all focused tests/typecheck pass; internal IDs remain exact.
- [ ] Inspect `rg -n "AtmoShaper|Atmoshaper|atmoshaper"` over Task 2 files.
  Every public occurrence must now be Atmosphere; retained technical occurrences
  must be internal/provenance/compatibility only.
- [ ] Independent specification review, repair/re-review, quality review,
  repair/re-review.
- [ ] Coordinator stages only Task 2 files and commits:

  `feat: present the audio mixer as Atmosphere`

**Rollback:** Revert Task 2. No media ID, provider asset, or persisted data needs
rollback.

## Task 3: Migrate public routes, navigation, support, and commerce copy

**Files:**

- Modify: `app/about/page.tsx`
- Modify: `app/about/derrick/page.tsx`
- Modify: `app/anatomime/page.tsx`
- Modify: `app/book/[practiceSlug]/booking-picker.tsx`
- Modify: `app/book/layout.tsx`
- Modify: `app/browse/page.tsx`
- Modify: `app/browse/workspace.tsx`
- Modify: `app/calendar/page.tsx`
- Modify: `app/calendar/sync/page.tsx`
- Modify: `app/education/flashcards/decks/[slug]/page.tsx`
- Modify: `app/education/flashcards/flashcards-client.tsx`
- Modify: `app/global-error.tsx`
- Modify: `app/help/page.tsx`
- Modify: `app/notes/page.tsx`
- Modify: `app/onboarding/page.tsx`
- Modify: `app/pricing/page.tsx`
- Modify: `app/roadmap/page.tsx`
- Modify: `app/support/page.tsx`
- Modify: `app/support/support-contact-form.tsx`
- Modify: `app/support/support-diagnostic-report.tsx`
- Modify: `app/tools/page.tsx`
- Modify: `app/tools/business-planner/page.tsx`
- Modify: `app/wellness/page.tsx`
- Modify: `components/backgrounds/BackgroundCommerceCart.tsx`
- Modify: `components/commerce/CommerceCartTrigger.tsx`
- Modify: `components/sidebar/app-sidebar-client.tsx`
- Modify: `components/sidebar/sidebar.tsx`
- Modify: `components/social-links.tsx`
- Modify: `components/ui/loader.tsx`
- Modify: `lib/anatomy-foundation.ts`
- Modify: `lib/anatomy-legacy.js`
- Modify: `lib/flashcard-community.ts`
- Modify: `lib/flashcard-static-metadata.ts`
- Modify: `lib/membership-pricing.js`
- Modify: `lib/navigation.js`
- Modify: `lib/problem-report.js`
- Modify: `lib/quick-actions.js`
- Modify: `lib/social-links.js`
- Modify: `lib/support-contact.js`
- Modify: `tests/anatomy-foundation.test.mjs`
- Modify: `tests/membership-pricing.test.mjs`
- Modify: `tests/problem-report.test.mjs`
- Modify: `tests/roadmap-page.test.mjs`
- Modify: `tests/seo.test.mjs`
- Modify: `tests/support-contact.test.mjs`
- Modify: `tests/supporter-membership-final-review.test.mjs`
- Modify: `tests/browser/public-routes.spec.ts`
- Modify: `tests/browser/app-shell.spec.ts`
- Modify: `tests/browser/interaction-feedback.spec.ts`

- [ ] Capture `TaskStartSnapshot`.
- [ ] Migrate only current visitor-facing product mentions to AtmoShaper. Import
  `PUBLIC_PRODUCT_IDENTITY` where the product noun is already a repeated or
  structural field; keep complete contextual sentences in their existing owners.
- [ ] Preserve massage-domain language, page purpose, routes, link targets,
  support/social endpoint values, commerce behavior, entitlements, price IDs,
  and checkout metadata. A link may display AtmoShaper copy while retaining its
  existing massagelab.app or MassageLab-named external endpoint.
- [ ] Update focused tests for exact current product copy and add negative
  assertions proving the protected endpoint/provider identifiers remain.
- [ ] Run:

  ```powershell
  node --test tests/anatomy-foundation.test.mjs tests/membership-pricing.test.mjs tests/problem-report.test.mjs tests/roadmap-page.test.mjs tests/seo.test.mjs tests/support-contact.test.mjs tests/supporter-membership-final-review.test.mjs
  npm run typecheck
  git diff --check
  ```

  Expected: all focused tests/typecheck pass; no route, price, feature-key,
  provider URL, support address, or data behavior changes.
- [ ] Inspect all legacy matches in Task 3 files. Expected: zero unexplained
  current public-copy matches; remaining massagelab.app addresses and social
  handles are explicit endpoint compatibility.
- [ ] Independent specification review, repair/re-review, quality review,
  repair/re-review.
- [ ] Coordinator stages only Task 3 files and commits:

  `feat: migrate public product copy to AtmoShaper`

**Rollback:** Revert Task 3. External endpoints and provider state never change.

## Task 4: Migrate account, security, messaging, and local-first copy

**Files:**

- Modify: `app/account/app-settings-panel.tsx`
- Modify: `app/account/link-google/link-google-form.tsx`
- Modify: `app/account/page.tsx`
- Modify: `app/account/supporter-interests-panel.tsx`
- Modify: `app/api/account/security/google/link/confirm/route.ts`
- Modify: `app/api/clients/invitations/route.ts`
- Modify: `app/api/debug/sentry/route.ts`
- Modify: `app/api/education/flashcards/decks/[slug]/route.ts`
- Modify: `app/api/education/flashcards/decks/route.ts`
- Modify: `app/login/login-form.tsx`
- Modify: `app/notes/intake/client-page.tsx`
- Modify: `app/notes/journal/client-page.tsx`
- Modify: `app/notes/professional-record-vault-provider.tsx`
- Modify: `app/notes/rom/client-page.tsx`
- Modify: `app/notes/soap/client-page.tsx`
- Modify: `app/notes/soap/components/transcript-review.tsx`
- Modify: `app/notes/therapist-notes-gate.tsx`
- Modify: `app/register/register-form.tsx`
- Modify: `lib/account-security-email-intents.ts`
- Modify: `lib/admin/billing-goodwill.ts`
- Modify: `lib/admin/role-service.ts`
- Modify: `lib/admin/security-service.ts`
- Modify: `lib/admin/temporary-access.ts`
- Modify: `lib/auth-mail.ts`
- Modify: `lib/auth-registration.js`
- Modify: `lib/auth-security.js`
- Modify: `lib/commerce/credit-service.ts`
- Modify: `lib/license-verification.js`
- Modify: `lib/local-documents.js`
- Modify: `lib/local-intake-builder.js`
- Modify: `lib/professional-record-vault.js`
- Modify: `lib/sentry-options.js`
- Modify: `lib/sentry-privacy.js`
- Modify: `tests/account-security-email-intents.test.mjs`
- Modify: `tests/account-security-email-retry.test.mjs`
- Modify: `tests/account-security-request.test.mjs`
- Modify: `tests/account-security-routes.test.mjs`
- Modify: `tests/account-two-factor-management.test.mjs`
- Modify: `tests/admin-billing-goodwill.test.mjs`
- Modify: `tests/admin-operation-service.test.mjs`
- Modify: `tests/admin-role-service.test.mjs`
- Modify: `tests/admin-temporary-access.test.mjs`
- Modify: `tests/admin-user-detail.test.mjs`
- Modify: `tests/auth-mail-ceiling.test.mjs`
- Modify: `tests/auth-registration.test.mjs`
- Modify: `tests/local-intake-builder.test.mjs`
- Modify: `tests/password-reset-confirmation.test.mjs`
- Modify: `tests/problem-report-route.test.mjs`
- Modify: `tests/professional-record-vault.test.mjs`
- Modify: `tests/sentry-privacy.test.mjs`

- [ ] Capture `TaskStartSnapshot`.
- [ ] Migrate user-facing headings, notices, email subjects/bodies, API response
  messages, provisioning labels, export-facing display titles, and current
  explanatory copy to AtmoShaper.
- [ ] Keep internal operation names, audit actions, stored format identifiers,
  email intent kinds, idempotency/reconciliation descriptions, environment
  names, persistence keys, and provider payload contracts unchanged. In
  particular, changing a displayed product name must not rename a database,
  queue, event, Stripe description, Calendar summary, or serialized field.
- [ ] Preserve local-first/PHI boundaries and all account-linking, 2FA,
  notification, billing, role, temporary-access, Sentry privacy, and export
  behavior.
- [ ] Update tests to distinguish current rendered/message copy from retained
  technical values. Add explicit negative assertions for representative env,
  storage, audit, and provider contracts.
- [ ] Run:

  ```powershell
  node --test tests/account-security-email-intents.test.mjs tests/account-security-email-retry.test.mjs tests/account-security-request.test.mjs tests/account-security-routes.test.mjs tests/account-two-factor-management.test.mjs tests/admin-billing-goodwill.test.mjs tests/admin-operation-service.test.mjs tests/admin-role-service.test.mjs tests/admin-temporary-access.test.mjs tests/admin-user-detail.test.mjs tests/auth-mail-ceiling.test.mjs tests/auth-registration.test.mjs tests/local-intake-builder.test.mjs tests/password-reset-confirmation.test.mjs tests/problem-report-route.test.mjs tests/professional-record-vault.test.mjs tests/sentry-privacy.test.mjs
  npm run typecheck
  git diff --check
  ```

  Expected: all focused tests/typecheck pass; no schema, row, provider,
  identity-linking, PHI, or stored-format behavior change.
- [ ] Independently review all remaining legacy matches in Task 4 files. Reject
  both failure modes: stale user-facing copy and accidental technical renames.
- [ ] Independent specification review, repair/re-review, quality review,
  repair/re-review.
- [ ] Coordinator stages only Task 4 files and commits:

  `feat: migrate account and service copy to AtmoShaper`

**Rollback:** Revert Task 4. No provider or database rollback is permitted or
needed.

## Task 5: Rebrand background presentation without changing ownership

**Files:**

- Modify: `components/backgrounds/backgroundRegistry.ts`
- Modify: `app/chimer/set-timer.tsx`
- Modify: `app/chimer/running-timer.tsx`
- Modify: `components/backgrounds/effects/css-backgrounds.tsx`
- Modify: `components/backgrounds/effects/massage-lab-3d-globe-background.tsx`
- Review exactly the effect-source paths in the `Task 5 exact effect-source
  review set` below; modify only a path containing current prose or the one
  explicitly retired built-in legacy-brand visual. Every other path with
  identifier-only matches remains byte-unchanged.
- Modify: `data/background-branding-catalog.json`
- Modify: `data/background-branding-audit.json`
- Modify: `docs/background-branding-audit/batch-01-foundations.md`
- Modify: `docs/background-branding-audit/batch-02-flow-and-liquid.md`
- Modify: `docs/background-branding-audit/batch-03-light-and-rays.md`
- Modify: `docs/background-branding-audit/batch-04-grids-and-pixels.md`
- Modify: `docs/background-branding-audit/batch-05-atmosphere-and-cosmos.md`
- Modify: `docs/background-branding-audit/batch-06-digital-energy.md`
- Modify: `docs/background-branding-audit/batch-07-fields-and-celestial.md`
- Modify: `public/chimer/background-previews/index.json`
- Modify: `scripts/background-branding/audit-model.mjs`
- Modify: `scripts/repository-audit/policy.json`
- Modify: `tests/repository-audit.test.mjs`
- Modify: `tests/background-branding-audit.test.mjs`
- Modify: `tests/background-branding-catalog.test.mjs`
- Modify: `tests/background-catalog.test.mjs`
- Modify: `tests/background-options.test.mjs`
- Modify: `tests/background-preview-media.test.mjs`
- Modify: `tests/chimer-entitlements.test.mjs`
- Modify: `tests/chimer-timer.test.mjs`
- Modify: `tests/browser/background-commerce.spec.ts`
- Modify: `tests/browser/background-palette.spec.ts`
- Modify: `tests/browser/control-system-review.spec.ts`
- Modify: `tests/browser/dna-twisted-cubes-backgrounds.spec.ts`

- [ ] Capture `TaskStartSnapshot`.
- [ ] In the canonical registry, apply the exact approved display labels:
  `Lava Lamp`, `Tile grid`, and `Hex grid`. Change current publisher/provider
  presentation to AtmoShaper where `MassageLab` names the current product.
  Change current internal-implementation license prose to AtmoShaper, but retain
  dated provenance/source-review statements as historical evidence.
- [ ] Mirror only the canonical display/provider/license changes into the
  branding catalog, audit data, and preview manifest through their existing
  generators or exact deterministic contract. The checked-in audit batches are
  already stale against their canonical renderer at the Task start: Phase 6
  semantic changes belong only to batches 01 and 07, while batches 02-06 may
  change only to resynchronize pre-existing generated `Current name` fields
  with the canonical registry. Do not change image/video bytes.
- [ ] Before running the audit generator, record SHA-256 hashes over canonical
  LF-normalized UTF-8 content for its index and seven batch outputs. After
  generation, assert that the index's normalized content stayed identical,
  that Git's changed generated-output path set is exactly the seven listed
  batch files, and that no batch 02-06 delta contains anything beyond the
  pre-existing deterministic `Current name` resynchronization. Raw worktree
  byte hashes are not authoritative here because Windows checkout CRLF and the
  generator's LF output represent the same tracked content.
- [ ] In Chimer and effect-source prose, change current visible labels,
  aria-labels, user-facing errors, and current ownership comments from the old
  product to AtmoShaper or the exact unbranded catalog label. Preserve every
  `MassageLab...`/`massageLab...`/`MASSAGE_LAB_...` symbol, option key, export,
  component, file path, CSS token, persisted setting, and registry ID.
- [ ] Remove the 3D Globe's always-rendered built-in MassageLab marker without
  inventing a replacement: remove only its legacy image-loading/drawing path
  and current built-in-marker claims. Keep the background ID, component/file
  name, globe behavior, optional user-marker controls and symbols, preview
  media, and the existing legacy asset file itself unchanged. Update current
  registry/catalog/audit descriptions to describe only the optional user
  marker, and add focused negative source assertions proving the old brand mark
  is no longer loaded or drawn.
- [ ] Extend the policy's case-insensitive `legacyPattern` with the exact
  underscore-separated candidate form `massage_lab`, then extend
  `compatibilityIdentifierPatterns` with the exact uppercase internal form
  `MASSAGE_LAB_[A-Z0-9_]*`. Add a regression fixture containing that token
  beside a separate `MassageLab visible copy` literal and prove the matched
  identifier is compatibility while the literal remains public-copy. Keep the
  collector implementation byte-unchanged; do not classify the entire line or
  file.
- [ ] Add focused assertions that the three new labels resolve under the same
  exact IDs, prices/ownership modes, entitlements, checkout references, and
  preview asset paths as before.
- [ ] Run:

  ```powershell
  npm run backgrounds:branding:audit
  npm run backgrounds:branding:catalog
  node --test tests/background-branding-audit.test.mjs tests/background-branding-catalog.test.mjs tests/background-catalog.test.mjs tests/background-options.test.mjs tests/background-preview-media.test.mjs tests/chimer-entitlements.test.mjs tests/chimer-timer.test.mjs tests/repository-audit.test.mjs
  npm run typecheck
  git diff --check
  ```

  Expected: generated data is deterministic; focused tests/typecheck pass; the
  three display labels change while stable IDs/ownership/commerce remain exact.
- [ ] Compare before/after key sets for registry and preview manifest. Expected:
  identical stable key sets and asset paths; only approved current presentation
  fields differ.
- [ ] Independent specification review, repair/re-review, quality review,
  repair/re-review.
- [ ] Coordinator stages only Task 5 files and commits:

  `feat: rebrand background presentation labels`

### Task 5 exact effect-source review set

- `components/backgrounds/effects/css-backgrounds.tsx`
- `components/backgrounds/effects/massage-lab-3d-globe-background.tsx`
- `components/backgrounds/effects/massage-lab-aerial-rays-background.tsx`
- `components/backgrounds/effects/massage-lab-astral-flow-background.tsx`
- `components/backgrounds/effects/massage-lab-aurora-bars-background.tsx`
- `components/backgrounds/effects/massage-lab-balatro-background.tsx`
- `components/backgrounds/effects/massage-lab-beams-background.tsx`
- `components/backgrounds/effects/massage-lab-chrome-flow-background.tsx`
- `components/backgrounds/effects/massage-lab-color-bends-background.tsx`
- `components/backgrounds/effects/massage-lab-dark-veil-background.tsx`
- `components/backgrounds/effects/massage-lab-deep-space-nebula-background.tsx`
- `components/backgrounds/effects/massage-lab-dither-background.tsx`
- `components/backgrounds/effects/massage-lab-dna-background.tsx`
- `components/backgrounds/effects/massage-lab-dot-field-background.tsx`
- `components/backgrounds/effects/massage-lab-dot-grid-background.tsx`
- `components/backgrounds/effects/massage-lab-electric-mist-background.tsx`
- `components/backgrounds/effects/massage-lab-evil-eye-background.tsx`
- `components/backgrounds/effects/massage-lab-faulty-terminal-background.tsx`
- `components/backgrounds/effects/massage-lab-ferrofluid-background.tsx`
- `components/backgrounds/effects/massage-lab-floating-lines-background.tsx`
- `components/backgrounds/effects/massage-lab-galaxy-background.tsx`
- `components/backgrounds/effects/massage-lab-gradient-blinds-background.tsx`
- `components/backgrounds/effects/massage-lab-grainient-background.tsx`
- `components/backgrounds/effects/massage-lab-grid-bloom-background.tsx`
- `components/backgrounds/effects/massage-lab-grid-distortion-background.tsx`
- `components/backgrounds/effects/massage-lab-grid-motion-background.tsx`
- `components/backgrounds/effects/massage-lab-grid-scan-background.tsx`
- `components/backgrounds/effects/massage-lab-hex-grid-background.tsx`
- `components/backgrounds/effects/massage-lab-iridescence-background.tsx`
- `components/backgrounds/effects/massage-lab-letter-glitch-background.tsx`
- `components/backgrounds/effects/massage-lab-light-pillar-background.tsx`
- `components/backgrounds/effects/massage-lab-light-rays-background.tsx`
- `components/backgrounds/effects/massage-lab-light-speed-background.tsx`
- `components/backgrounds/effects/massage-lab-lightfall-background.tsx`
- `components/backgrounds/effects/massage-lab-lightning-background.tsx`
- `components/backgrounds/effects/massage-lab-line-waves-background.tsx`
- `components/backgrounds/effects/massage-lab-liquid-chrome-background.tsx`
- `components/backgrounds/effects/massage-lab-liquid-ether-background.tsx`
- `components/backgrounds/effects/massage-lab-matrix-rain-background.tsx`
- `components/backgrounds/effects/massage-lab-novatrix-background.tsx`
- `components/backgrounds/effects/massage-lab-orb-background.tsx`
- `components/backgrounds/effects/massage-lab-particles-background.tsx`
- `components/backgrounds/effects/massage-lab-photon-beam-background.tsx`
- `components/backgrounds/effects/massage-lab-pixel-blast-background.tsx`
- `components/backgrounds/effects/massage-lab-pixel-liquid-background.tsx`
- `components/backgrounds/effects/massage-lab-pixel-snow-background.tsx`
- `components/backgrounds/effects/massage-lab-plasma-background.tsx`
- `components/backgrounds/effects/massage-lab-plasma-wave-background.tsx`
- `components/backgrounds/effects/massage-lab-prism-background.tsx`
- `components/backgrounds/effects/massage-lab-prismatic-burst-background.tsx`
- `components/backgrounds/effects/massage-lab-radar-background.tsx`
- `components/backgrounds/effects/massage-lab-retro-grid-background.tsx`
- `components/backgrounds/effects/massage-lab-ripple-grid-background.tsx`
- `components/backgrounds/effects/massage-lab-shape-grid-background.tsx`
- `components/backgrounds/effects/massage-lab-shooting-stars-background.tsx`
- `components/backgrounds/effects/massage-lab-side-rays-background.tsx`
- `components/backgrounds/effects/massage-lab-silk-background.tsx`
- `components/backgrounds/effects/massage-lab-soft-aurora-background.tsx`
- `components/backgrounds/effects/massage-lab-sparkles.tsx`
- `components/backgrounds/effects/massage-lab-synthesis-background.tsx`
- `components/backgrounds/effects/massage-lab-threads-background.tsx`
- `components/backgrounds/effects/massage-lab-tile-grid-background.tsx`
- `components/backgrounds/effects/massage-lab-twisted-cubes-background.tsx`
- `components/backgrounds/effects/massage-lab-vortex-background.tsx`
- `components/backgrounds/effects/massage-lab-wave-current-background.tsx`
- `components/backgrounds/effects/massage-lab-waves-background.tsx`
- `components/backgrounds/effects/massage-lab-wavy-background.tsx`

**Rollback:** Revert Task 5. Existing purchases and identifiers remain usable
because they never changed.

## Task 6: Archive the exact pre-rebrand legal registry

**Files:**

- Create: `scripts/legal-document-archive.mjs`
- Create: `tests/legal-document-archive.test.mjs`
- Create: `data/legal-document-history/2026-06-legal-v2.json`
- Create: `data/legal-document-history/2026-07-digital-purchases-v2.json`
- Modify: `docs/aegis/work/2026-09-14-atmoshaper-phase6-preview-rebrand/90-evidence.md`
- Modify: `package.json`
- Modify: `scripts/repository-audit/policy.json`
- Modify: `tests/repository-audit.test.mjs`

- [ ] Capture `TaskStartSnapshot`. Confirm `lib/legal-documents.js` still has
  exact v2 versions/text and has no working-tree edit. If not, stop before
  archive generation.
- [ ] Add a dependency-free archive builder that imports current
  `LEGAL_DOCUMENTS`, groups documents by their current `documentVersion`, sorts
  documents deterministically by key, serializes a versioned JSON schema with a
  terminal newline, and writes only under `data/legal-document-history/` when
  invoked with `--write`.
- [ ] Make writes fail closed: refuse path traversal, refuse an unexpected
  version/filename, and refuse to overwrite an existing file unless generated
  bytes are identical. Do not read env, database, network, credentials, or user
  records.
- [ ] Add package script:

  ```json
  "legal:archive-current": "node scripts/legal-document-archive.mjs --write"
  ```

  Do not change `package-lock.json`; no dependency changes.
- [ ] Tests cover deterministic bytes, schema/key order, exact grouping (six
  general documents in `2026-06-legal-v2`, one digital document in
  `2026-07-digital-purchases-v2`), unique `key:version`, immutability of parsed
  records, path confinement, unexpected overwrite refusal, and byte-identical
  rerun acceptance.
- [ ] Run the focused test before generating data, then archive current exports:

  ```powershell
  node --test tests/legal-document-archive.test.mjs
  npm run legal:archive-current
  node --test tests/legal-document-archive.test.mjs tests/legal-documents.test.mjs tests/repository-audit.test.mjs
  ```

  Expected: both exact files exist; the second archive run is byte-identical;
  every archived document equals the still-current runtime export.
- [ ] Extend the brand policy's legal path set narrowly for the script, test, and
  `data/legal-document-history/`; add policy tests proving exact scope and that a
  lookalike path remains public-copy candidate.
- [ ] Record SHA-256 hashes of both archive files in Aegis evidence before any
  Task 7 legal edit.
- [ ] Stop condition: if any archive document differs from the current v2 export,
  stop the legal migration and report the mismatch. Do not edit current versions.
- [ ] Independent specification review, repair/re-review, quality review,
  repair/re-review.
- [ ] Coordinator stages only Task 6 files and commits:

  `feat: archive pre-rebrand legal documents`

**Rollback:** The archive remains valid historical evidence even if later
current-version work is reverted. Revert this commit only before Task 7 and only
if no later acceptance/evidence depends on it.

## Task 7: Publish new current legal versions without rewriting acceptance

**Files:**

- Modify: `lib/legal-documents.js`
- Modify: `lib/legal-acceptance-gate.js`
- Verify unchanged: `lib/legal-acceptance.js`. If a focused test exposes a
  current-set assumption in this owner, stop and amend/re-review the plan before
  modifying it.
- Modify: `app/legal/page.tsx`
- Modify: `app/legal/[slug]/page.tsx`
- Modify: `app/legal/accept/page.tsx`
- Modify: `components/sidebar/app-sidebar-client.tsx`
- Modify: `LICENSE`
- Modify: `tests/legal-documents.test.mjs`
- Modify: `tests/legal-acceptance.test.mjs`
- Modify: `tests/proprietary-license.test.mjs`
- Modify: `tests/seo.test.mjs`

- [ ] Capture `TaskStartSnapshot`. Verify Task 6 archive commit and recorded file
  hashes; rerun `node --test tests/legal-document-archive.test.mjs`. Stop if it
  fails.
- [ ] Set exact current legal values:

  ```js
  export const LEGAL_DOCUMENT_VERSION = "2026-09-legal-v3"
  export const DIGITAL_PURCHASES_REFUNDS_VERSION = "2026-09-digital-purchases-v3"
  export const LEGAL_EFFECTIVE_DATE = "September 14, 2026"
  export const LEGAL_BUSINESS_IDENTITY =
    "Derrick Bowersock, doing business as AtmoShaper"
  ```

- [ ] Migrate current headings, summaries, notices, body copy, metadata, sidebar
  copyright/legal presentation, and `LICENSE` from MassageLab to AtmoShaper.
  Preserve substantive privacy, local-first, professional-responsibility,
  billing, refund, warranty, and scope terms except bounded grammar changes.
- [ ] Do not edit the Task 6 archives. Do not change the Prisma schema,
  migrations, existing rows, timestamps, or acceptance IDs. Do not backfill v3.
- [ ] Add an acceptance coexistence test: seed a v2 acceptance for a test user;
  prove current v3 is not accepted; record a genuine v3 acceptance through the
  existing owner; prove both v2 and v3 rows remain and the v2 row is unchanged.
  Also prove no path silently treats old v2 as current v3.
- [ ] Update license tests for AtmoShaper and exact DBA wording. Do not add a
  trademark, registration, corporation, LLC, or filing-status claim.
- [ ] Run:

  ```powershell
  node --test tests/legal-document-archive.test.mjs tests/legal-documents.test.mjs tests/legal-acceptance.test.mjs tests/proprietary-license.test.mjs tests/seo.test.mjs
  npm run prisma:validate
  npm run prisma:generate
  npm run typecheck
  git diff --check
  ```

  Expected: archive and legal tests pass; v2/v3 coexistence is proven; Prisma
  reports no schema change; typecheck/diff check pass.
- [ ] Compare both archived file hashes with Task 6 evidence. Expected:
  byte-identical. Confirm `git diff -- prisma prisma.config.ts` is empty.
- [ ] Independent specification review, repair/re-review, quality review,
  repair/re-review.
- [ ] Coordinator stages only Task 7 files and commits:

  `feat: migrate current legal identity to AtmoShaper`

**Rollback:** Revert Task 7 to make v2 current again. Never delete the archive or
acceptance rows. If genuine v3 rows exist later, retain them as historical
evidence even while current code is reverted.

## Task 8: Close the semantic copy queue and add the Phase 6 browser oracle

**Files:**

- Review only: the exact remaining path/line/hash entries in
  `scripts/repository-audit/brand-reference-baseline.json`. Task 8 does not edit
  an application source file. A true current-copy miss routes back to its owning
  Task 1-7 commit for repair and review before Task 8 resumes.
- Modify: `scripts/repository-audit/policy.json`
- Modify: `tests/repository-audit.test.mjs`
- Create: `tests/browser/phase6-preview-rebrand.spec.ts`
- Modify: `tests/browser/ci-lanes.mjs`
- Modify: `tests/browser/ci-lanes.test.mjs`
- Modify: `tests/browser-qa-harness.test.mjs`
- Modify: existing Browser-QA specs only where current-copy assertions remain:
  `tests/browser/app-shell.spec.ts`, `tests/browser/atmoshaper.spec.ts`,
  `tests/browser/background-commerce.spec.ts`,
  `tests/browser/identity-method-safety.spec.ts`,
  `tests/browser/interaction-feedback.spec.ts`,
  `tests/browser/music-media-session.spec.ts`,
  `tests/browser/music-visualizer.spec.ts`, `tests/browser/public-routes.spec.ts`,
  and `tests/browser/pwa.spec.ts`

- [ ] Before Task 8 resumes, complete one separately reviewed owner-routed repair
  commit for the three current-copy misses found by its initial candidate:
  `app/dev/buttons/background-palette-gallery.tsx` must render the canonical
  `mlab-proof-drone` station title while preserving that ID;
  `app/dev/buttons/metal-ring-gallery.tsx` must use unbranded current prose;
  and `components/ui/sidebar.tsx` must compose its screen-reader navigation
  title from `PUBLIC_PRODUCT_IDENTITY.name`. Update the impacted contracts in
  `tests/app-settings.test.mjs`, and repair the existing compiled server-sidebar
  harness in `tests/sidebar-owner-validation.test.mjs` by supplying that same
  canonical identity owner. Update the impacted Browser-QA contracts in
  `tests/browser/background-palette.spec.ts`,
  `tests/browser/background-commerce.spec.ts`,
  `tests/browser/dna-twisted-cubes-backgrounds.spec.ts`, and
  `tests/browser/music-visualizer.spec.ts`. Do not change stable station IDs,
  playback behavior, layout, controls, routes, or historical snapshots.
- [ ] Before Task 8 resumes again, complete one separately reviewed owner-routed
  Browser-QA contract repair in `tests/browser/public-provider-ingress.spec.ts`.
  Its ambiguous diagnostic-delivery assertion must expect the current
  `AtmoShaper` product copy already emitted by
  `app/support/support-diagnostic-report.tsx`; change only that asserted product
  name. Do not edit application source, provider behavior, retry semantics, or
  any historical evidence. Prove by exact static comparison that the Browser-QA
  expectation matches the current runtime sentence and that the stale sentence
  is absent, then run typecheck and diff checks. Defer runtime execution of this
  Playwright scenario to Task 10's authorized Neon Browser-QA lifecycle. Complete
  independent specification and quality reviews before committing the one-file
  repair.
- [ ] Capture `TaskStartSnapshot`.
- [ ] Generate a review candidate without modifying the tracked baseline. Group
  remaining `pre-rebrand-public-copy` entries by semantic meaning, not file.
  For each occurrence do exactly one of: migrate current product/feature/legal
  copy; preserve domain language; preserve historical/provenance text; or add a
  narrow match-scoped compatibility classifier with a regression test.
- [ ] Do not classify current rendered prose as compatibility. Do not add a
  directory, extension, broad filename, or whole-line exemption merely because
  a file contains many internal names.
- [ ] Add `phase6-preview-rebrand.spec.ts` covering homepage text presentation;
  app-bar at desktop/tablet/narrow mobile; Atmosphere navigation, heading,
  closed/expanded mixer geometry and transport labels; install dialog and served
  manifest; SEO without social image; legal index/general/digital/acceptance
  versions; and Lava Lamp/Tile grid/Hex grid with unchanged ownership behavior.
- [ ] Use new Phase 6 snapshot names/paths only. Do not touch
  `tests/browser/atmoshaper-repository-migration-parity.spec.ts` or its snapshots.
- [ ] Add `phase6-preview-rebrand.spec.ts` to
  `ORDINARY_BROWSER_QA_SPEC_FILES`. Assign both `desktop-chromium` and
  `mobile-chromium` instances to lane 3. Update lane/harness tests for exact
  coverage with no duplicate or omitted project/spec pair.
- [ ] Run:

  ```powershell
  node --test tests/repository-audit.test.mjs tests/browser/ci-lanes.test.mjs tests/browser-qa-harness.test.mjs
  npm run brand:audit
  npm run typecheck
  git diff --check
  ```

  Expected before baseline regeneration: classifier/tests pass; brand audit may
  report only expected missing entries caused by intentionally changed lines,
  but zero unclassified entries. The generated candidate must contain zero
  `pre-rebrand-public-copy` entries.
- [ ] Run independent specification review over the complete remaining-occurrence
  decision table and diff. Repair/re-review. Then run independent quality review
  of classifier precision, Browser-QA coverage, and source changes; repair and
  re-review.
- [ ] Coordinator stages only Task 8 files and commits:

  `test: close phase 6 copy and browser contracts`

**Rollback:** Revert Task 8. Never use rollback to overwrite the historical
parity oracle.

## Task 9: Reconcile the deterministic audit baseline and current authority

**Files:**

- Modify: `scripts/repository-audit/brand-reference-baseline.json`
- Modify: `docs/superpowers/specs/2026-09-14-atmoshaper-phase6-preview-rebrand-design.md`
- Modify: `docs/project-state.md`
- Modify: `docs/project-log.md`
- Modify: `README.md`
- Modify: `docs/architecture.md`
- Modify: `docs/rebrand/atmoshaper-migration-charter.md`
- Modify: `docs/rebrand/atmoshaper-refactor-register.md`
- Modify: `docs/decisions/0002-public-identity-legal-and-compatibility-boundaries.md`
- Modify: `docs/decisions/README.md`
- Modify: `docs/aegis/work/2026-09-14-atmoshaper-phase6-preview-rebrand/20-checkpoint.md`
- Modify: `docs/aegis/work/2026-09-14-atmoshaper-phase6-preview-rebrand/90-evidence.md`
- Create: `docs/aegis/work/2026-09-14-atmoshaper-phase6-preview-rebrand/99-reflection.md`
- Modify: `tests/family-friends-server-workload.test.mjs`
- Modify: `tests/proprietary-license.test.mjs`

- [ ] Capture `TaskStartSnapshot`.
- [ ] Synchronize current authority with exact facts: Phase 5 PR #4 merged as
  `cdfa99e49cebf100fac1a5080d60514806eb17db`; Phase 6 current local commits;
  AtmoShaper/Atmosphere ownership;
  text-only fallback; legal archive/current versions; retained endpoints and
  compatibility names; final-logo, provider, deployment, domain, push/PR/merge
  status. Append the project log; do not rewrite dated historical entries.
- [ ] Update README's copyright/DBA identity and its focused proprietary-license
  assertion together to exact `Derrick Bowersock, doing business as AtmoShaper`.
  Do not remove or weaken the assertion.
- [ ] Amend ADR 0002 to the approved decision. Mark it Accepted only after all
  local implementation/verification evidence is complete; otherwise keep it
  Proposed with exact remaining gate. Record that legal migration was separately
  approved and archive/versioned acceptance preserves history.
- [ ] Advance the project-state verified-date bound in
  `tests/family-friends-server-workload.test.mjs` only with the same verified
  evidence change.
- [ ] Stage all intended Task 9 documents except the brand baseline. Print a
  candidate to a separate temporary path; inspect source commit/schema/category
  totals/path deltas and prove zero `pre-rebrand-public-copy`, missing, and
  unclassified entries. Replace the tracked baseline only after review, stage
  it, regenerate, and repeat until the fresh candidate is byte-identical to the
  staged Git blob. Never redirect generator output over its live input.
- [ ] Remove only the exact temporary candidate files after validating their
  absolute paths are inside the task temp directory.
- [ ] Run local closeout:

  ```powershell
  node --test tests/public-product-identity.test.mjs tests/atmosphere-public-labels.test.mjs tests/atmosphere-media-session-controller.test.mjs tests/atmosphere-stations.test.mjs tests/seo.test.mjs tests/app-settings.test.mjs tests/pwa-install.test.mjs tests/background-branding-audit.test.mjs tests/background-branding-catalog.test.mjs tests/background-catalog.test.mjs tests/background-options.test.mjs tests/background-preview-media.test.mjs tests/legal-document-archive.test.mjs tests/legal-documents.test.mjs tests/legal-acceptance.test.mjs tests/proprietary-license.test.mjs tests/repository-audit.test.mjs tests/browser/ci-lanes.test.mjs tests/browser-qa-harness.test.mjs tests/family-friends-server-workload.test.mjs
  npm run repository:inventory
  npm run brand:audit
  npm run prisma:validate
  npm run prisma:generate
  npm run typecheck
  npm run lint
  npm run test
  npm run build
  git diff --check
  ```

  Expected: every command exits zero; full suite has only documented
  host-dependent skips; build completes the full route table; brand has zero
  missing/unclassified/pre-rebrand-public-copy; inventory has zero forbidden
  paths; archive hashes remain exact; historical snapshot diff is empty.
- [ ] Run complete-branch independent specification review, repair/re-review,
  then complete-branch quality/first-principles review. Reviewers must look for
  systemic ownership errors and accidental contract migration, not merely stale
  strings.
- [ ] Coordinator stages only reviewed Task 9 files and commits:

  `docs: close local phase 6 rebrand`

- [ ] Stop before creating a Neon project. Present exact local results and ask
  for fresh disposable Browser-QA authorization.

**Rollback:** Revert current-presentation commits in reverse order. Preserve
legal archives and any genuine acceptance evidence. No provider rollback exists
because no provider was changed.

## Task 10: Run separately authorized disposable Browser QA and visual review

**Files:**

- Create only accepted PNGs under
  `tests/browser/phase6-preview-rebrand.spec.ts-snapshots/`, using these exact
  assertion names and platform suffixes generated by Playwright:
  `home-product`, `app-bar-tablet`, `atmosphere-closed`,
  `atmosphere-expanded`, `legal-general`, `legal-digital`, and
  `background-labels`
- Modify: `docs/aegis/work/2026-09-14-atmoshaper-phase6-preview-rebrand/20-checkpoint.md`
- Modify: `docs/aegis/work/2026-09-14-atmoshaper-phase6-preview-rebrand/90-evidence.md`
- Modify: `docs/project-state.md`
- Modify: `docs/project-log.md`
- Modify: `scripts/repository-audit/brand-reference-baseline.json`

- [ ] Capture `TaskStartSnapshot` immediately after fresh authorization. Confirm
  exact branch/HEAD, clean status, no active Git operation, and no pre-existing
  task-owned QA resource.
- [ ] Require fresh explicit authorization before creating the temporary Neon
  project. Record only non-secret evidence; never record connection strings,
  credentials, private provider IDs, fingerprints, or rows.
- [ ] Create a new independent empty QA project; prove it is not production;
  apply exactly the committed migration set; prove all application tables are
  empty before QA.
- [ ] Run `npm run build:browser-qa` immediately before Browser QA. Then run the
  four repository-owned lanes in the same authorized environment:

  ```powershell
  $env:PLAYWRIGHT_CI_LANE = "1"; npm run test:browser
  $env:PLAYWRIGHT_CI_LANE = "2"; npm run test:browser
  $env:PLAYWRIGHT_CI_LANE = "3"; npm run test:browser
  $env:PLAYWRIGHT_CI_LANE = "4"; npm run test:browser
  Remove-Item Env:PLAYWRIGHT_CI_LANE
  ```

  Expected: all four lanes pass. Never pass `--update-snapshots` for historical
  specs. Generate the new Phase 6 screenshots only in the first explicitly
  reviewed oracle capture, then rerun without update mode and require a pass.
- [ ] Inspect the new screenshots visually at desktop, tablet, and narrow mobile.
  Confirm unclipped full `AtmoShaper` text, unchanged hit areas/focus/geometry,
  correct Atmosphere controls, correct legal versions, correct catalog labels,
  and no stale wordmark/social image or broken icon.
- [ ] Prove all application tables remain empty after QA. Delete only the
  cycle-owned project and prove it absent; separately prove production still
  exists without reading or changing production data.
- [ ] If new Phase 6 snapshot files are accepted, run focused source/harness
  tests, audits, fixed-point regeneration, independent spec/quality review, and
  commit:

  `test: record phase 6 visual baseline`

- [ ] Repeat exact-head local diff/audit checks after receipt changes. Stop
  before push and request separate publication authorization.

**Rollback:** Revert only the new Phase 6 oracle/receipt commit. The temporary QA
project is already deleted; production was never changed.

## Task 11: Publish, babysit review, and stop before merge

**External gate:** Do not begin without separate user authorization to push and
open the Phase 6 PR.

- [ ] Capture `TaskStartSnapshot`: exact branch/HEAD, clean status, remote refs,
  open-PR search, archive hashes, and no active Git operation.
- [ ] Verify clean status, exact branch/HEAD, commits, remote tracking, archive
  hashes, brand fixed point, and latest local gates.
- [ ] Push `codex/atmoshaper-phase6-preview-rebrand` and open one PR against
  `main` with a concise public summary, tests, compatibility boundary, legal
  archive/version behavior, and rollback. Do not post internal planning notes.
- [ ] Wait for exact-head Code quality, Browser build, all Browser QA lanes,
  aggregate QA, and CodeRabbit. Validate every finding against current code;
  repair root causes only; independently review each fix; rerun proportional
  local gates; commit and push.
- [ ] Trigger CodeRabbit review only when the review window is eligible. Continue
  until the latest exact head has no actionable comments or unresolved threads
  and all required checks pass.
- [ ] Update only necessary repository receipt docs; do not add noisy PR comments.
- [ ] Stop before merge and request separate merge authorization.

**Rollback:** Keep the PR unmerged and repair or revert the affected branch
commit under normal review. Do not close the PR or delete the remote branch
without separate user direction.

## Completion Contract

Phase 6 is complete only when the exact PR head has all required hosted checks,
latest-head CodeRabbit coverage, no actionable unresolved thread, approved
visual evidence, deterministic zero-current-copy audit state, unchanged
protected contracts, deleted disposable QA resources, and separate user
authorization to merge. Merge is followed by a fresh readback of merge commit,
parents, timestamps, clean local state, and retained rollback/history evidence.
