# AtmoShaper Phase 5 Public Product Identity Implementation Plan

> **For agentic workers:** Execute with Superpowers subagent-driven development
> and Aegis ownership, review, anti-entropy, and verification gates. A fresh
> implementer performs each implementation task; separate reviewers check
> specification compliance and code quality; the coordinator alone stages and
> commits. Steps use checkbox syntax for execution tracking.

**Goal:** Give the current public product name and core presentation image paths
one explicit data-only owner while preserving every rendered MassageLab value,
asset, route, metadata field, accessibility label, layout, and runtime behavior.

**Architecture:** Add one frozen, dependency-free identity record in
lib/public-product-identity.js. Existing SEO exports delegate to it for
compatibility. The manifest, root Apple metadata, app-bar, mobile main bar, and
PWA install surfaces import only the fields they already duplicate and continue
to own their contextual wording and behavior.

**Tech stack:** Node.js 24 ESM, TypeScript/React 19, Next.js 16 metadata and
manifest APIs, Node's built-in test runner, ESLint, Prisma validation/generation,
Playwright, repository/brand audit tooling, Git, and GitHub hosted review.

**Spec:**
docs/superpowers/specs/2026-09-13-atmoshaper-public-product-identity-design.md

## Global constraints

- Runtime output remains MassageLab. This branch establishes the identity seam;
  it does not perform the Phase 6 rebrand.
- Change only the approved public-presentation consumers: lib/seo.js,
  app/manifest.ts, app/layout.tsx, the app-bar and mobile-main-bar labels/assets,
  and PWA installation presentation.
- Preserve the canonical massagelab.app host, route copy, legal/support/provider
  identity, email subjects, auth, billing, persistence, environment, storage,
  cache, vault, media, audit and compatibility identifiers.
- Preserve the exact app-bar href, image files, image dimensions, sizes,
  priority, CSS classes, responsive geometry, navigation behavior, install
  eligibility, dialog behavior, help route, and all existing browser snapshots.
- Keep SEO_SITE_NAME and SEO_DEFAULT_IMAGE exported from lib/seo.js so unrelated
  callers keep their current API.
- The identity module imports nothing, reads no environment or browser globals,
  exposes no mutation API, and contains only the approved small key set.
- Do not rename components or files, including InstallMassageLabDialog. Do not
  change dependencies, package-lock.json, schemas, migrations, workflows, image
  bytes, snapshot files, or provider configuration.
- No performance improvement is claimed. Record only observed build route/bundle
  output and tracked-file deltas.
- Browser migration-parity QA may use only a newly authorized, independent,
  empty temporary QA database lifecycle. Do not create it during local
  implementation without that separate authorization.
- Push, pull-request creation, hosted review, merge, deployment, provider
  mutation, and Phase 6 values remain separate gates.

## Baseline and authority refs

- Branch: codex/atmoshaper-public-product-identity.
- Exact Phase 5 design commit and starting HEAD:
  330b71ebb96a59f7f93876ee241f81ee6e26cc21.
- Exact Phase 4 merge and tracked origin/main:
  a43d1a315e95d80d6570fb5e49d1e2dce5ce7ddb.
- Phase 4 reviewed head:
  69ff135aed8d0b1ecb43c054595d1e08e89a22b1.
- Phase 4 integration:
  https://github.com/dsbowersock/atmoshaper/pull/3.
- Current authorities: AGENTS.md, docs/project-state.md, docs/project-log.md,
  docs/wiki/index.md, the approved written design, and
  docs/rebrand/atmoshaper-refactor-register.md.
- Existing behavior oracles: tests/seo.test.mjs,
  tests/app-settings.test.mjs, tests/pwa-install.test.mjs,
  tests/browser/pwa.spec.ts, tests/browser/app-shell.spec.ts, and
  tests/browser/atmoshaper-repository-migration-parity.spec.ts.

## BaselineUsageDraft

- Required refs: all authority and behavior-oracle refs listed above.
- Acknowledged before planning: all required refs; the project log was read by
  bounded current windows because it contains extensive historical receipts.
- Cited in plan: approved design, mapped consumer files, focused tests, browser
  oracles, repository/brand audit owners, and current Aegis work records.
- Missing refs: none for local implementation. A fresh temporary Browser-QA
  resource remains intentionally unavailable until separately authorized.
- Decision: continue with local implementation and verification.

## Requirement Ready Check

- Requirement source: approved Phase 5 written design and the user's explicit
  approval to proceed.
- Goal and scope: one behavior-preserving public-presentation identity boundary.
- Acceptance: exact values and keys, frozen nested data, compatible SEO exports,
  every mapped consumer delegated, unchanged focused behavior, clean audits,
  broad local verification, and independent per-task review.
- Open blocker questions: none for local implementation.
- External blocker: migration-parity Browser QA and all publication actions stay
  behind their separate authorization gates.
- Decision: ready.

## Files and ownership

| File | Planned ownership |
| --- | --- |
| lib/public-product-identity.js | New canonical public name and three core presentation asset paths |
| tests/public-product-identity.test.mjs | Exact data shape, values, freeze, and dependency-free contract |
| lib/seo.js | Compatibility exports and SEO image alt delegate to identity |
| app/manifest.ts | Manifest name and short_name delegate to identity |
| app/layout.tsx | Apple web-app title delegates to identity |
| components/shell/app-bar-brand-link.tsx | Home label and two image paths delegate to identity |
| components/shell/mobile-main-bar.tsx | Main-navigation label delegates to identity |
| components/sidebar/app-sidebar-client.tsx | Install action delegates to identity |
| components/pwa/install-massagelab-dialog.tsx | Install title and iOS guidance delegate to identity |
| tests/seo.test.mjs | Exact metadata, Open Graph alt, and compatibility-export behavior |
| tests/app-settings.test.mjs | Delegation source shape plus unchanged shell ownership |
| tests/pwa-install.test.mjs | Delegation source shape plus unchanged eligibility/menu/dialog copy |
| docs/project-state.md | Current Phase 5 implementation status |
| docs/project-log.md | Chronological implementation and verification receipt |
| docs/rebrand/atmoshaper-refactor-register.md | Candidate, measurement, rollback, and retirement status |
| docs/aegis/work/2026-09-13-atmoshaper-phase5-public-product-identity/20-checkpoint.md | Resumable plan/task state |
| docs/aegis/work/2026-09-13-atmoshaper-phase5-public-product-identity/90-evidence.md | Exact local verification evidence |
| scripts/repository-audit/brand-reference-baseline.json | Generated classification fixed point for new documentation occurrences |

## Compatibility boundary

Only mapped presentation tokens move behind the new owner. Public route titles
and descriptions, legal and provider wording, support addresses, canonical URL,
social account identifiers, PWA cache identifiers, component names, database
records, environment names, exports and internal compatibility identifiers stay
unchanged. Existing SEO constants remain compatibility adapters rather than
forcing a repository-wide API migration.

## TDD Route

- Mode: off.
- Decision: strict RED/GREEN skipped.
- Reason: this is an approved behavior-preserving ownership refactor with strong
  existing focused and browser behavior oracles, not a requested bug fix.
- Verification: add the focused owner contract with the owner, update
  source-structure checks only where inline values disappear, run focused tests
  after each slice, then broad local, audit, build, and authorized browser gates.

## Change Necessity

- Observed problem: the same correct public name and three brand paths are
  duplicated across seven presentation consumers without an owner boundary.
- No-change option: leaving the copies inline makes Phase 6 depend on a broad
  search whose results mix presentation identity with legal, provider,
  persistence, historical, and compatibility meanings.
- Minimum code change: one data record, seven mapped consumers, and focused tests
  that prove both ownership and unchanged output.
- Decision: code-change, bounded to presentation identity.

## Existence Check

- Existing reuse candidate: SEO_SITE_NAME and SEO_DEFAULT_IMAGE in lib/seo.js.
- Why reuse alone is insufficient: lib/seo.js is a policy-rich SEO owner and
  cannot be imported cleanly into client shell/PWA components without coupling
  them to canonical-domain, route, robots, JSON-LD, legal and social concerns.
- New-surface proof: lib/public-product-identity.js is the smallest neutral,
  server/client-safe owner; the existing SEO constants remain adapters.
- Entropy/retirement impact: mapped inline copies retire; no new helper,
  registry, class, function, environment override or fallback layer is added.
- Decision: add-with-proof.

## Architecture Integrity Lens

- Invariant: changing the owner value later can affect only approved public
  presentation fields, never provider, legal, persistence or compatibility
  identity.
- Canonical owner: PUBLIC_PRODUCT_IDENTITY owns exactly name, shortName and the
  three named asset paths.
- Consumer responsibility: contextual phrases and component behavior remain in
  their existing files.
- Higher-level simplification: one importable record replaces parallel copies
  without creating a universal brand/config registry.
- Falsifier: stop if a consumer needs canonical-domain, legal, provider, route,
  persisted-data, arbitrary-copy, or compatibility ownership.
- Verdict: proceed.

## Plan Pressure Test

- Owner and contract: one frozen data owner; exact keys and values are tested.
- Compatibility: SEO exports remain; every visible value and path remains exact.
- Retirement: only mapped inline copies retire after broad verification.
- Test integrity: source checks prove delegation, behavior checks retain exact
  output, and browser snapshots are not updated.
- Task executability: each task below has exact files, edits, commands, review
  criteria, and coordinator commit boundary.
- Pressure result: proceed.

## Complexity and execution readiness

- Complexity budget: one new module; no new runtime functions, branches, state,
  fallbacks, dependencies, schemas, migrations, provider calls, or files outside
  the owner/test/docs set.
- Dependency direction: SEO, Next metadata, and React consumers depend inward on
  the data-only owner; the owner depends on nothing.
- Review route: fresh implementer, specification reviewer, and code-quality
  reviewer for each task; implementers/reviewers do not stage or commit.
- Coordinator route: inspect working-tree scope, run coordinator checks, stage
  only reviewed files, regenerate the brand baseline when docs add classified
  terms, and make one coherent commit per task.
- Readiness verdict: executable.

## Pre-implementation measurement

- [ ] Before Task 1 changes runtime files, run npm run repository:inventory and
  npm run build from the design/planning-only branch state. Record the exact
  tracked file count, tracked blob bytes, inventory identity, forbidden-path
  count, and production build route summary in the Aegis evidence record.
- [ ] Treat these values as observation baselines only. Do not claim a
  performance improvement, and do not change application code to optimize the
  reported numbers.

## Task 1: Add the canonical data-only owner

**Files:**

- Create: lib/public-product-identity.js
- Create: tests/public-product-identity.test.mjs

- [ ] Implement exactly one frozen exported record:

~~~js
/**
 * Canonical public presentation identity. Provider, legal, persistence, and
 * compatibility identifiers remain with their existing owners.
 */
export const PUBLIC_PRODUCT_IDENTITY = Object.freeze({
  name: "MassageLab",
  shortName: "MassageLab",
  assets: Object.freeze({
    appBarWordmark: "/brand/massagelab-wordmark-final-20260622.png",
    appBarMark: "/brand/massagelab-mark-final-20260622.png",
    socialPreview: "/brand/massagelab-home-logo-badge-padded-20260622.png",
  }),
})
~~~

- [ ] Add a Node test that imports PUBLIC_PRODUCT_IDENTITY and proves:
  Object.keys(root) equals ["name", "shortName", "assets"];
  Object.keys(assets) equals
  ["appBarWordmark", "appBarMark", "socialPreview"]; every exact value matches
  the approved design; the root and assets are frozen; assignment to root and
  nested keys throws TypeError; and reading lib/public-product-identity.js shows
  no import/export-from statement and no process, window, document or
  globalThis dependency.
- [ ] Run:

    node --test tests/public-product-identity.test.mjs

  Expected: all focused identity tests pass.
- [ ] Confirm git diff --check and that only the two Task 1 files changed.
- [ ] Run independent specification review, then code-quality review; repair and
  re-review until both approve.
- [ ] Coordinator stages only the reviewed Task 1 files and commits:

    refactor: add public product identity owner

## Task 2: Delegate server and metadata identity

**Files:**

- Modify: lib/seo.js
- Modify: app/manifest.ts
- Modify: app/layout.tsx
- Modify: tests/seo.test.mjs
- Modify: tests/public-product-identity.test.mjs

- [ ] Import PUBLIC_PRODUCT_IDENTITY into lib/seo.js. Preserve its public API:

~~~js
export const SEO_SITE_NAME = PUBLIC_PRODUCT_IDENTITY.name
export const SEO_DEFAULT_IMAGE = PUBLIC_PRODUCT_IDENTITY.assets.socialPreview
~~~

  Change only the Open Graph image alt from its inline literal to
  PUBLIC_PRODUCT_IDENTITY.name. Leave the canonical base URL, route catalog,
  descriptions, robots behavior, JSON-LD structure and social URLs untouched.
- [ ] Import the owner into app/manifest.ts and delegate only:

~~~ts
name: PUBLIC_PRODUCT_IDENTITY.name,
short_name: PUBLIC_PRODUCT_IDENTITY.shortName,
~~~

- [ ] Import the owner into app/layout.tsx and delegate only:

~~~ts
title: PUBLIC_PRODUCT_IDENTITY.name,
~~~

- [ ] Extend tests/seo.test.mjs to import SEO_SITE_NAME,
  SEO_DEFAULT_IMAGE, and createPublicPageMetadata. Assert the compatibility
  exports still equal MassageLab and the exact social-preview path; root
  metadata keeps applicationName and openGraph.siteName at MassageLab; the
  single Open Graph image keeps the exact URL, dimensions, and alt MassageLab.
- [ ] Extend tests/public-product-identity.test.mjs with bounded source-shape
  assertions proving manifest name/short_name and Apple web-app title reference
  PUBLIC_PRODUCT_IDENTITY while their exact surrounding manifest/layout fields
  remain present. Do not turn this into a broad snapshot.
- [ ] Run:

    node --test tests/public-product-identity.test.mjs tests/seo.test.mjs
    npm run typecheck

  Expected: focused tests and typecheck pass with unchanged observable values.
- [ ] Confirm git diff --check; confirm no canonical URL, route copy, icons,
  colors, viewport, JSON-LD structure, provider/legal field or snapshot changed.
- [ ] Run independent specification review, then code-quality review; repair and
  re-review until both approve.
- [ ] Coordinator stages only reviewed Task 2 files and commits:

    refactor: centralize public metadata identity

## Task 3: Delegate app-shell and PWA presentation identity

**Files:**

- Modify: components/shell/app-bar-brand-link.tsx
- Modify: components/shell/mobile-main-bar.tsx
- Modify: components/sidebar/app-sidebar-client.tsx
- Modify: components/pwa/install-massagelab-dialog.tsx
- Modify: tests/app-settings.test.mjs
- Modify: tests/pwa-install.test.mjs

- [ ] Import PUBLIC_PRODUCT_IDENTITY directly from
  @/lib/public-product-identity in each mapped consumer.
- [ ] In AppBarBrandLink, delegate only aria-label, wordmark src, and mark src:

~~~tsx
aria-label={PUBLIC_PRODUCT_IDENTITY.name + " home"}
src={PUBLIC_PRODUCT_IDENTITY.assets.appBarWordmark}
src={PUBLIC_PRODUCT_IDENTITY.assets.appBarMark}
~~~

  Preserve href, alt values, dimensions, classes, sizes, priority and element
  order exactly.
- [ ] In MobileMainBar, delegate only:

~~~tsx
aria-label={PUBLIC_PRODUCT_IDENTITY.name + " main navigation"}
~~~

- [ ] In AppSidebarClient, delegate only the install action text:

~~~tsx
{"Install " + PUBLIC_PRODUCT_IDENTITY.name}
~~~

- [ ] In InstallMassageLabDialog, retain the component/file name and delegate
  the two public strings:

~~~tsx
{"Install " + PUBLIC_PRODUCT_IDENTITY.name}
{"On iPhone or iPad, Safari installs " + PUBLIC_PRODUCT_IDENTITY.name + " from the Share menu."}
~~~

  Preserve icons, ordered steps, exact instruction wording, help href, click
  behavior, dialog state and layout.
- [ ] Update tests/app-settings.test.mjs so the brand-link check proves the
  identity import and the three owner references while continuing to prove no
  SidebarLogoHomeLink exists. Update the mobile-main-bar check to prove its
  identity-derived aria-label while preserving all other layout assertions.
- [ ] Update tests/pwa-install.test.mjs so it proves the owner import and
  identity-derived menu label, dialog title, and complete exact iOS guidance
  composition while retaining the status, menu grouping, route-map and install
  eligibility assertions.
- [ ] Run:

    node --test tests/public-product-identity.test.mjs tests/app-settings.test.mjs tests/pwa-install.test.mjs
    npm run typecheck

  Expected: focused tests and typecheck pass; the browser-visible strings remain
  byte-for-byte MassageLab.
- [ ] Confirm git diff --check; confirm no CSS, asset, route, component name,
  browser snapshot, provider or persistence file changed.
- [ ] Run independent specification review, then code-quality review; repair and
  re-review until both approve.
- [ ] Coordinator stages only reviewed Task 3 files and commits:

    refactor: centralize shell install identity

## Task 4: Reconcile authority records and complete local closeout

**Files:**

- Modify: docs/project-state.md
- Modify: docs/project-log.md
- Modify: docs/rebrand/atmoshaper-refactor-register.md
- Modify: docs/aegis/work/2026-09-13-atmoshaper-phase5-public-product-identity/20-checkpoint.md
- Modify: docs/aegis/work/2026-09-13-atmoshaper-phase5-public-product-identity/90-evidence.md
- Modify: scripts/repository-audit/brand-reference-baseline.json

- [ ] Record the approved design, plan path, exact task commits, mapped inline
  copies retired, excluded occurrences retained, rollback path, tests, audit
  counts, build result, and any authorized browser result. Do not record secrets,
  connection strings, private provider IDs, database fingerprints or local
  absolute paths.
- [ ] Mark the register candidate implemented only after Tasks 1-3 reviews and
  local gates pass. State clearly that Phase 6 rebrand, provider changes,
  migration-parity Browser QA, push, PR and merge remain separately gated.
- [ ] Stage the bounded documentation changes, print a generated brand candidate
  from the staged index, review that every delta belongs to these Phase 5 paths
  and intended categories, then replace and stage the baseline. Repeat until a
  fresh candidate is byte-identical to the staged baseline. Remove only the
  exact temporary candidate file.
- [ ] Run focused and audit gates:

    node --test tests/public-product-identity.test.mjs tests/seo.test.mjs tests/app-settings.test.mjs tests/pwa-install.test.mjs
    npm run repository:inventory
    npm run brand:audit
    npm run prisma:validate
    npm run prisma:generate
    npm run typecheck
    npm run lint

- [ ] Run the full local gates:

    npm run test
    npm run build
    git diff --cached --check
    git status --short

  Expected: all commands pass; brand audit reports zero missing and zero
  unclassified references; inventory reports zero forbidden paths; Prisma
  generation produces no unexplained tracked diff; the production build
  completes; only planned files are staged.
- [ ] If a currently authorized local Browser-QA environment exists and its
  non-production isolation is proven, run:

    npm run build:browser-qa
    npm run test:browser -- tests/browser/pwa.spec.ts tests/browser/app-shell.spec.ts

  The specialized build must immediately precede Playwright because the
  app-shell suite requires its RSC proof route and Browser-QA provider hooks.
  Otherwise record these as deferred to the separately authorized empty-QA
  lifecycle. Do not reuse an ordinary production build, substitute production
  data, or update snapshots.
- [ ] Run independent final specification review and final code-quality review
  over the complete branch diff; repair and re-run affected gates until both
  approve.
- [ ] Coordinator stages only reviewed closeout files and commits:

    docs: close public product identity refactor

## Risks and mitigations

- Risk: centralization becomes a hidden global rebrand. Mitigation: exact
  consumer allowlist, exact owner key test, and explicit exclusions.
- Risk: server/client import coupling. Mitigation: dependency-free JS data module
  with source-shape test and no environment/browser access.
- Risk: tests merely follow implementation and lose behavior coverage.
  Mitigation: keep exact output assertions in SEO/PWA/browser oracles and change
  only source-shape expectations for retired inline literals.
- Risk: accidental layout or asset drift. Mitigation: no CSS/image changes,
  preserve JSX structure and image props, and retain app-shell browser geometry
  tests without snapshot updates.
- Risk: SEO compatibility break. Mitigation: retain exported constants and test
  their exact values plus generated metadata.
- Risk: audit-baseline self-reference. Mitigation: stage bounded docs first,
  regenerate from the index, review deltas, and prove byte-identical fixed point.

## Rollback and retirement

- Rollback is one branch revert: restore the seven mapped inline consumer values
  and remove lib/public-product-identity.js plus its focused tests. No asset,
  provider, legal, persisted value or external resource needs rollback.
- Retire only the exact duplicated mapped tokens after focused, broad and review
  gates pass.
- Keep every excluded MassageLab occurrence active under its current owner.
- Keep the identity module only while at least two approved presentation
  consumers share it.
- If the owner begins accumulating sentences, domain policy, legal/provider
  identifiers, persistence names, environment behavior or compatibility logic,
  split or revert the boundary before publication.

## Completion and next gates

Local Phase 5 slice completion requires all four tasks, exact reviewed commits,
clean current-state records, zero missing/unclassified brand references, broad
local gates, and independent final review. Publication then requires separate
authorization to push and open the PR. Any empty Browser-QA project lifecycle,
hosted review babysitting, merge, deployment, or Phase 6 rebrand begins only at
its own explicit gate.
