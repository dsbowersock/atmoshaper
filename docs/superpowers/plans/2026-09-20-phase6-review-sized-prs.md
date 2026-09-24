# Phase 6 review-sized delivery plan

## Goal

Deliver the approved Phase 6 source as coherent, dependency-ordered PRs that
CodeRabbit can actually review. Preserve original PR 5 and its source branch;
do not merge any replacement without separate authorization.

## Architecture and authority

This changes delivery packaging, not application architecture. Reuse existing
source owners and tests. No new runtime abstraction, dependency, schema, legal
text, provider resource, review exclusion, or tolerance change is needed.

- Base: `cdfa99e49cebf100fac1a5080d60514806eb17db` (Phase 5 merge).
- Recovery source: `7e318558da425b8fcdddeb8df50e93a36900310a` from
  [PR 5](https://github.com/dsbowersock/atmoshaper/pull/5).
- Product requirements remain the source-locked
  [Phase 6 design](https://github.com/dsbowersock/atmoshaper/blob/7e318558da425b8fcdddeb8df50e93a36900310a/docs/superpowers/specs/2026-09-14-atmoshaper-phase6-preview-rebrand-design.md)
  and its corresponding implementation plan, not a new product design here.
- Read `AGENTS.md`, `docs/project-state.md`, `docs/project-log.md`,
  `docs/wiki/index.md`, and `docs/wiki/ci-pr-checks.md` before each slice.
- User approved preparing/publishing the sequence and one isolated worktree on
  2026-09-20. Root coordinates and owns all Git mutations; agents share that checkout.
- Tech stack: Node 24, existing npm lockfile, JavaScript/TypeScript, Node tests,
  Prisma generation/validation, Next.js and strict hosted Playwright CI.

## Compatibility and execution readiness

Keep runtime behavior, routes, stable IDs, data/acceptance history, provider
contracts and every already-reviewed repair from the recovery source. The pilot
does not change application code, live legal versions, or screenshots from main.
No merge, deployment, billing, provider lifecycle, production access, or original
CI rerun is authorized. The separate Linux ring snapshot-refresh decision remains
pending; splitting is not approval to alter its PNGs or assertions.

Requirement readiness is satisfied for the archive pilot. Its only unknowns are
fresh verification and whether CodeRabbit can review it despite the reported
capacity restriction. Publish only that pilot until actual code-review evidence
exists; skipped/status-only output is not coverage. Target fewer than 85 changed
paths per PR, and stop before publication at 100 reviewable paths or unclear scope.

Change necessity: existing changes must be redistributed because PR 5 exceeds
the hosted review file cap. Exact source blobs and scoped intermediate audit
receipts are sufficient; packaging alone does not justify a new runtime fix.
Separately verified findings follow the bounded repair gates below.
Existing legal verifier and audit owners remain canonical. Large existing audit
tests receive only their owning contract hunks, with no broad cleanup.

TDD route: mode off; decision skipped for mechanical redistribution; strict
authority not applicable. Retain behavioral tests and verify source equivalence.
For any new finding, establish the failure and recurrence cause before a bounded
repair; do not weaken tests to make an intermediate tree pass.

Execution route: subagent-driven, one bounded implementer at a time, followed by
independent SPEC then QUALITY review. Root performs fresh verification and one
coherent commit per slice. If delegation is unavailable, execute inline while
retaining independent review. This plan is guidance, not completion authority.

## Task 1: legal archive pilot

Why: archive preservation is a small prerequisite for the later current-legal
identity slice. Preserve the retired one-shot generator repair already in PR 5.

1. Start the isolated pilot branch at the locked base; run `npm ci --no-audit
   --no-fund`, `npm run prisma:generate`, and `npm run test` before source edits.
   Record exact failures rather than assuming a clean baseline.
2. Use `git show 7e318558da425b8fcdddeb8df50e93a36900310a:<path>` as the exact
   content specification and apply these six final-source files:
   - `data/legal-document-history/2026-06-legal-v2.json`
   - `data/legal-document-history/2026-07-digital-purchases-v2.json`
   - `scripts/legal-document-archive.mjs`
   - `tests/legal-document-archive.test.mjs`
   - `package.json`
   - `tests/repository-cleanup-audit.test.mjs`
3. Package delta must be only `legal:verify-archives`, invoking
   `node --test tests/legal-document-archive.test.mjs`. Cleanup audit delta must
   compare the retained data catalog with exact tracked JSON inventory instead
   of the obsolete fixed count of 40. Preserve all other tests.
4. Read `git show 59a46cad702c0e97fc2bedf238f3f8f979293d42 --
   scripts/repository-audit/policy.json tests/repository-audit.test.mjs`.
   Apply only legal archive path classification and its exact-positive and
   lookalike-negative tests. Do not copy final whole-phase fingerprints or audit
   APIs into this earlier tree.
5. Update `docs/project-state.md` and `docs/project-log.md` concisely for this
   pilot, linking this plan and preserving dated evidence as historical. Do not
   claim the later product rebrand, legal v3, review coverage or CI is complete.
6. Root stages only these owned paths for index-sensitive audits. Regenerate
   `scripts/repository-audit/brand-reference-baseline.json` using existing
   `scripts/repository-audit/brand.mjs --print-candidate-baseline`; inspect all
   changed categories and occurrence paths. Generated baseline must be stable
   against staged bytes with zero missing/unclassified entries, not final-tree
   source receipts or broad exclusions.
7. Verify archive SHA-256 values remain exactly
   `8c7263b53697495f096f479484b6ccd7eae574f20111ecf0e0a44f7fd50017aa` and
   `bdb76adf941e4e22022765734650d7e1224486d282d8303fa5869ee4fc25a4c8`.
   Six final-source paths must match source blobs. Runtime, current registry,
   acceptance rows, lockfile and PNGs must match main.
8. Run `npm run legal:verify-archives` (9 tests), `node --test
   tests/legal-documents.test.mjs tests/legal-acceptance.test.mjs
   tests/legal-document-archive.test.mjs tests/repository-audit.test.mjs
   tests/repository-cleanup-audit.test.mjs`, `npm run test`,
   `npm run prisma:validate`, `npm run prisma:generate`, `npm run typecheck`,
   `npm run lint`, `npm run brand:audit`, `npm run repository:inventory`,
   and `git diff --check`. Verify actual test filenames before the focused run.
9. Independent SPEC review must check the exact scope/equivalence, then independent
   QUALITY review checks behavior, maintainability, tests and audit receipts.
   Resolve findings, refresh validation, commit/push a new `codex/` branch,
   create/attach one PR and verify hosted base/head/count.
10. Observe each bot before triggering. Record successful request, exact reviewed
    SHA and outcome separately. Confirm CodeRabbit actually reviews this pilot
    before expanding publication. If capacity prevents review, stop expansion
    and report the refusal; no spending, upgrade or repeated unchanged request.

### Pilot portability repair discovered during verification

Git checkout filtering reproduced an archive-byte contract failure before
publication: with this repository's `core.autocrlf=true`, both exact LF blobs
would be checked out as CRLF, invalidating strict archive verification. Changing
only the command-local setting to false preserved both blob hashes, excluding
archive-content corruption as the explanation. Existing `.gitattributes` owns
LF rules for other byte-pinned fixtures but omits these two archives.

Decision: config-only production repair plus a regression test. Add exact
`text eol=lf` entries for the two legal archive paths in `.gitattributes`, and
`tests/legal-archive-checkout.test.mjs` to exercise Git checkout filters in an
isolated temporary repository under LF and CRLF settings. Prove the old rules
fail and the new rules preserve the same immutable bytes; unrelated paths must
retain their normal checkout behavior. Do not change Git's user/repository
settings, the six preserved source blobs, hash assertions or legal contents.
The pilot now owns these two additional paths, and independent SPEC then QUALITY
review must include the recurrence fix. Final source equivalence must explicitly
account for this validated repair rather than silently discard it.

### Pilot current-state date contract

The full candidate suite exposed one required companion to the dated delivery
notes: `tests/family-friends-server-workload.test.mjs` deliberately caps the
project-state Verified date and instructs that both dates advance in the same
verified evidence change. This pilot's September 20 snapshot has fresh baseline,
source/hosted-state, scope and verification evidence, while earlier operational
receipts stay explicitly historical. Carry only the fixed date-ceiling hunk to
`2026-09-20`; retain the real-calendar, upper-bound and operational-evidence
assertions and do not import later identity/mock changes from the recovery file.
This makes 15 pilot paths. Future slices must carry documentation consumers with
their owning changes and must not revert the date ceiling to the older source
date. Verify the focused file, repeat SPEC then QUALITY for this delta, and rerun
the full candidate suite before publication.

### Pilot hosted-review repair gate

PR #6 at `6961b4f` received actual completed reviews from both hosted bots.
Keep the policy matcher unchanged: replace only the legal-archive directory
prefix with the two retained filenames and cover exact positives, same-directory
unreviewed files, suffixes and nested descendants. The previous lookalike-folder
negative did not detect the same-directory widening.

The checkout test must own its Git subprocess environment as well as its working
directory. Validate inherited repository-location overrides using only temporary
decoy repositories, isolate every fixture Git command, and prove the actual test
passes with a poisoned child environment without modifying the decoy repository
or index. Preserve strict hashes and unrelated-path CRLF controls. Do not alter
global Git settings, archive contents or application code. The coordinator owns
documentation and generated audit receipts; one implementer owns policy and
the two affected test files. Independent SPEC then QUALITY and fresh regression
checks precede publishing the repaired head. Record both repairs in final source
equivalence; source redistribution must not restore the directory-wide rule.

## Task 2: product identity and shell

The pilot gate passed on exact `96d94b1b0d779b998df01d07cfaec0198857d51d`:
both hosted reviewers clean, all threads resolved, CI `35520831495` successful.
Stack this slice from that head in the approved existing worktree. Keep pilot
and recovery branches unchanged. The original Phase 6 Task 1 and its approved
responsive amendment supply the implementation; this task only redistributes it.

1. Carry exact source changes for `lib/public-product-identity.js`,
   `components/shell/app-bar-brand-link.tsx`, `components/ui/sidebar.tsx`,
   `app/globals.css`, `app/page.tsx`, `public/offline.html` and `public/sw.js`.
   Preserve temporary square-mark identity, text/mark/hidden container behavior,
   home semantics, controls, existing icons, routes, cache keys and endpoints.
2. Carry `lib/seo.js` presentation and null-image changes plus its shared revision
   date. Retain both legal revision-date values at `2026-06-17` until the current
   legal slice; do not claim unchanged legal documents were revised.
3. Carry source identity/settings/PWA unit contracts. In `tests/seo.test.mjs`,
   defer current legal-page and social-description assertions to their owners.
   Keep the strict date test with unchanged intermediate legal dates; the later
   legal slice advances those expectations with its runtime metadata.
4. In shared `app-shell.spec.ts`, `public-routes.spec.ts` and `pwa.spec.ts`, carry
   only current identity/home/navigation/install and responsive-brand hunks.
   Defer audio, secondary-page, account and streaming hunks. Also carry only the
   main-navigation selector in `interaction-feedback.spec.ts` and home-link
   selector in `music-media-session.spec.ts`. Leave the old About-page selector
   until its current owner changes. The sidebar-owner validation mock addition
   is unnecessary until the later authenticated-user presentation change.
5. Carry only the source `Phase 6 brand collapse preserves controls at 320px
   with and without cart` test from `tests/browser-qa-harness.test.mjs`. It
   executes the real component, CSS and Browser-QA helpers without a server or
   provider, including negative controls and focus order. Do not import later
   integration oracle, lane, account or ring tests. No PNG changes are included.
6. Update canonical state/log for completed versus pending work and regenerate
   the intermediate brand baseline to an exact staged fixed point. Preserve
   exact archive policy and all pilot regression repairs; do not copy the final
   source baseline, use broad exclusions or require zero public-copy candidates
   while their owning slices are explicitly still pending.
7. Run focused identity/SEO/settings/PWA and provider-free brand tests, the full
   unit suite, typecheck, lint, archive verification, inventory and brand audit;
   require clean diff checks and source-hunk accounting. Independently review
   SPEC then QUALITY, repair any valid findings, and repeat proportional checks.
8. Publish a replacement PR against `codex/phase6-01-legal-archives`, measure
   its actual changed paths below the review cap, attach it to the task, and
   obtain its own exact-head hosted reviews and strict browser CI. Do not count
   pilot coverage as review of this delta. No merge or provider changes.

The source/test allocation is 19 paths plus the new geometry regression below,
recurring delivery docs and the generated receipt. Shared paths are intentionally incomplete relative to the
final recovery source; remaining hunks stay in the equivalence ledger until
their owners are delivered. No new product decision or architecture is introduced.

### Task 2 verified repair extension

Independent quality review reproduced the text homepage heading overflowing its
hero column with the normal expanded desktop sidebar: at 1024px the column is
368px but the rendered Inter name is 553.39px wide; 1100px also fails. The image
to text migration kept viewport-sized typography rather than sizing to the
available column. Repair the existing homepage sizing owner, preserving the
single visible name, page layout, accessible heading and unchanged assets. Add
a portable provider-free regression that executes actual source classes/CSS,
checks narrow and breakpoint widths with expanded/collapsed sidebar geometry,
and rejects the old overflowing behavior. Do not clip the text, weaken bounds,
add a provider dependency or update snapshots. Record this verified repair as an
intentional addition beyond the recovery source in final equivalence accounting.

The first full identity suite found one missed paired metadata contract in
`tests/roadmap-page.test.mjs`: carry only the exact source description assertion
for the already-owned shared SEO identity. Keep its later Roadmap page-copy
assertions deferred. Recheck metadata consumers, repeat independent SPEC then
QUALITY and fresh verification before publication.

## Task 3: Atmosphere audio and paired browser contracts

Why: deliver the approved feature-name boundary as a reviewable unit without
losing its later station-artwork, carousel-resume or shared-label fixes. PR #7
passed both hosted reviews and CI `35525692042` on exact `06f3147`; use that as
this slice's base and keep all previously published branches unchanged.

1. Reuse the approved checkout on `codex/phase6-03-atmosphere-audio`. Read the
   source-locked Phase 6 design's audio-label/public-presentation contract and
   source Task 2. Exact `7e31855` content is the implementation specification,
   including later repairs; do not reconstruct only the earliest rename commit.
2. Carry the 35 audio-owned paths in the retained manifest: browse workspace;
   the three `components/atmoshaper` UI owners; favorites, station artwork/card/
   carousel; adaptive-carousel model; music provider/mini-player/player;
   generative catalog/runtime, media-session controller, labels, presentation,
   artwork, groups and stations; navigation; their 12 focused unit/source tests;
   and the Atmoshaper and media-session browser specs. Preserve any prior-slice
   additions when reconciling exact source blobs.
3. Carry only audio-owned source hunks in `tests/browser/app-shell.spec.ts`,
   `tests/browser/public-routes.spec.ts` and `tests/browser/music-visualizer.spec.ts`:
   Drone title with strict exact selectors, Atmosphere heading/feature labels,
   and the owning accessibility assertions. Keep unrelated public-page/account/
   background/streaming assertions deferred. A further companion needs concrete
   dependency evidence and a recorded boundary before editing.
   The pre-edit consumer scan identified four more required browser companions:
   `background-palette.spec.ts` and `dna-twisted-cubes-backgrounds.spec.ts` each
   carry only their exact Play Drone assertion; `background-commerce.spec.ts`
   carries two audio-heading selectors, two Play Drone assertions and the exact
   toolbar title, but no cart copy; `interaction-feedback.spec.ts` carries its
   four Drone setup/continuity assertions, but no account/abort-settlement work.
   Each hunk exists in the recovery source and is required by the audio owner,
   not an expansion into its containing spec's other responsibilities.
   SPEC review identified one further pairing within the same app-shell file:
   exact source `lib/navigation.js` also changes the About link label. Carry its
   matching `About AtmoShaper` click assertion now, even though About page copy
   remains deferred. Producer-owned navigation, not the destination page name,
   determines this assertion's allocation; the old selector matches no link.
4. Preserve frozen noun ownership, public-only error/default-recipe formatting,
   custom recipe names and raw runtime errors. Keep Drone's media ID, audio URL,
   source/license attribution and artwork compatibility metadata stable. Keep
   the source carousel-resume model and its falsifying regression together.
   Do not rename internal `atmoshaper` identifiers or add a new public alias.
5. Root updates canonical delivery state/log and regenerates only the intermediate
   brand receipt after staging owned paths. No final fingerprint import, broad
   exclusion, PNG, dependency, legal registry or provider change is permitted.
   Existing large source/test owners receive wiring or exact source repair hunks,
   not new responsibilities or opportunistic refactors. Naming authority is
   unchanged from the approved design; no new glossary or architecture is needed.
6. Run the 12 focused audio unit/source files listed by the manifest with
   `node --test`, then the affected shared-browser consumer contracts. Run
   `npm run typecheck`, `npm run lint`, `npm run legal:verify-archives`,
   `npm run test`, `npm run brand:audit`, `npm run repository:inventory`,
   documentation contracts and `git diff --check`. Verify all exact blobs and
   enumerate shared hunks retained/deferred; require zero missing/unclassified
   audit entries and a generated staged-byte fixed point.
7. Independent SPEC review must verify scope and source equivalence before
   independent QUALITY review evaluates behavior, compatibility and tests.
   Root then verifies, commits and publishes against
   `codex/phase6-02-product-identity`, attaches the PR, and confirms actual
   base/head/file count plus both hosted reviews and strict CI. Target fewer
   than 85 paths and never publish 100 reviewable paths. No merge is authorized.

Mechanical redistribution retains the existing TDD-off route. Any newly observed
defect requires causal evidence and a bounded repair before extending this task.
Final equivalence must retain pilot and heading repairs beyond the source tree.
The separate ring snapshot decision remains pending and cannot be bypassed here.

The first frozen audio candidate passed its 4,662-case unit suite (4,659 passed,
three skipped). Independent SPEC review separately caught the missing About
navigation assertion described above. Its exact source correction changes only
that paired browser selector; recheck its actual navigation producer, browser
harness and final audit receipts, and repeat SPEC before QUALITY. This first
full-suite receipt covers tree `b0df440f95c6b6a6e44b18f8ee275a424a260810`, not an
unmeasured later tree; hosted browser CI remains required after publication.

## Task 4: public routes and content

Why: carry the approved public product wording and its direct consumers as one
reviewable unit. PR #8 is clean on exact `f8c14f1812918b67051760669c4ccf07b5860ba7`:
both hosted reviewers completed without findings, all threads are resolved, and
CI `35529020277` passed quality, build, four browser lanes and aggregate QA.
Reuse the approved isolated checkout on `codex/phase6-04-public-content`; preserve
PRs #5-#8 and their branches. No new product or architecture decision is made.

1. Use exact `7e318558da425b8fcdddeb8df50e93a36900310a` content for the 53 paths in
   the retained manifest's `groups.public.paths`, excluding
   `tests/browser/interaction-feedback.spec.ts`. The remaining interaction
   delta belongs to private account settlement and must stay with Task 5 and
   its paired helper/contract. Do not copy this file in Task 4.
2. Carry the required direct companions identified before editing:
   - Full source `tests/sidebar-owner-validation.test.mjs`: the sidebar now
     imports the canonical public identity, so its compiled-loader mock must
     provide that dependency, paired with the public-group auth-session test.
   - Full source `tests/problem-report-route.test.mjs`: public report message
     assertion and canonical-alias test description; preserve all route behavior.
   - `tests/family-friends-server-workload.test.mjs`: only the identity import
     and two membership-pricing/sidebar loader mocks. Preserve the verified
     date ceiling `2026-09-20`, not the older source ceiling.
   - `tests/seo.test.mjs`: only the social-links import and three-description
     assertion. Keep legal-page and legal-date assertions unchanged.
   - `tests/browser/public-routes.spec.ts`: only Tools and Roadmap heading
     assertions. Defer register and visualizer/streaming hunks to their owners.
   - `tests/browser/background-commerce.spec.ts`: the three guest cart
     name/trigger/dialog assertions. Existing audio hunks remain intact.
3. Preserve canonical URLs, social handles and destinations, support address,
   dedicated Google calendar names, source attribution and stable anatomy IDs,
   Stripe product identity and billing/entitlement behavior. Change presentation
   only. No provider calls, schema/data writes, new public identity owner,
   dependency, layout restructuring, PNG/frame/tolerance or legal-version change.
4. Before extending any path beyond this list, show its concrete producer/
   consumer dependency to the coordinator. Preserve prior pilot and homepage
   fixes. Large source and test owners get only existing-source presentation
   wiring and paired assertions, not new responsibilities or broad cleanup.
5. Coordinator owns canonical state/log, this parent plan, Git mutations and
   generated intermediate brand receipt. Stage only owned paths; regenerate
   using the existing audit command, inspect semantic deltas, and prove a
   staged-byte fixed point with zero missing/unclassified entries. Do not
   import final-source fingerprints, receipt files or broad exclusions.
6. Run source equivalence for the 55 full-source files and enumerate the four
   partial companions. Run the public-group unit tests plus sidebar-owner,
   problem-report-route, family-friends workload, SEO, quick-actions, flashcard
   and calendar-adapter regressions; run typecheck, lint, documentation/archive
   checks, full unit suite, inventory, audit and diff checks. Hosted strict
   browser CI is required after publication; local fixtures do not replace it.
7. Independent SPEC review precedes independent QUALITY. Root verifies the
   exact frozen candidate, creates one coherent commit, publishes against
   `codex/phase6-03-atmosphere-audio`, attaches the PR, and confirms its own
   exact-head bot reviews and CI. The expected scope is 63 paths including
   three delivery docs and the generated receipt; measure before publishing,
   target under 85 and never reach the observed 100-file review cap.

Change necessity is mechanical source redistribution; a documentation-only
change cannot deliver the approved visible copy. Existing owners are sufficient.
TDD stays off for redistribution; any new defect first requires causal evidence.
Retirement is limited to old current-presentation wording. Compatibility values
and historical attribution remain active for their documented external/data
contracts; changing them requires a separate migration. No durable architecture
or baseline status is changed here. The whole sequence and separate Linux
Atmosphere snapshot decision remain incomplete.

Task 4 local evidence: the frozen 63-path candidate
`560521bd2f2c1220086240b46b19c7449ec9ee95` passed independent SPEC then QUALITY
review. All 55 complete source files match `7e31855`; four partial companions
match the boundaries above. Full unit suite: 4,661 passed, three skipped, zero
failures. Focused checks: 247/247; documentation/archive checks: 25/25;
typecheck and lint passed. Final receipt-only closeout passed SPEC then QUALITY;
the candidate was published as PR #9 at `f8add32`. These are historical initial
receipts, not verification of the hosted repair below. Exact-head hosted reviews
and CI remain separate gates and do not close the whole replacement sequence.

### Task 4 hosted repair round 1: operational identity and exact audit classification

PR #9 review of `f8add328996c668243cc7c1dae6ba16f1d8da565` identified a
Sentry event identity rename and a retained Stripe assertion misclassified as
public copy. Both reproduce locally. The problem-report route forwards the
payload message directly to Sentry; the candidate generator derives the wrong
category from the intermediate structural policy, so editing generated JSON
alone is not a durable repair.

Ruling: preserve `MassageLab privacy-safe problem report` as the operational
message, independent of public display identity. This intentionally corrects
three source-exact files rather than preserving a source defect. Keep public
support copy, sanitized payload fields, tags, route responses and provider
behavior unchanged. A dedicated observability migration is required to retire
the stable message; this slice does not perform that migration.

Ruling: promote only the source design's exact-occurrence classification API
and validation into this slice as the generator dependency for the review fix.
Generate fresh rules for the two changed Stripe assertions and the restored
Sentry message's runtime/unit/route occurrences in this actual tree. Do not
import the final-tree fingerprint table, whole-file categories or broad regex
exclusions. Preserve structural precedence and existing baseline verification
semantics; reject malformed, duplicate, stale and overlapping exact rules.
Final integration must reconcile these current rules rather than overwrite them.

Allowed implementation files: `lib/problem-report.js`, its two unit/route test
files, repository-audit `core.mjs`, `brand.mjs`, `policy.json`, and
`tests/repository-audit.test.mjs`. Coordinator owns generated baseline and the
three delivery documents. Verify the original assertions fail on the old
behavior, the real payload and route preserve the event, and exact audit rules
cannot classify neighboring copy, moved/changed text, or unrelated files.
Use focused regression, typecheck/lint, generator fixed point and inventory;
independent SPEC then QUALITY precede commit/push and fresh hosted gates.
No screenshots, provider calls, original-branch writes or public configuration
changes. If wrong, this ruling costs bounded local rework, not an external cutover.

### Task 4 hosted repair round 2: enforce current category semantics

CodeRabbit review `5261742961` of `b664501` found an outside-diff verification
gap after the exact-rule API promotion. An in-memory reproduction changed one
valid exact rule from compatibility to historical: classification changed, but
the verifier returned zero missing and unclassified entries, so normal audit
mode would still pass using the old saved category. The generator is correct;
identity-only baseline matching omits current classification validation.

Repair the existing verifier and normal CLI, not just the generated receipt.
For every identity-matched active occurrence, compare its saved category to
the canonical classifier, report deterministic sanitized category mismatches
separately, and fail normal audit mode when any exist. Preserve exact identity
matching, strict new-reference rejection, informational removals, structural
precedence, exact-rule validation and the five current compatibility rules.
This deliberately strengthens round 1's retained verifier semantics; final
integration must preserve the new check rather than restore the source defect.

Allowed source/test files are repository-audit `core.mjs`, `brand.mjs`, and
`tests/repository-audit.test.mjs`. Extend the existing owner with a local fix,
not a new responsibility or parallel classifier. Add focused documentation to
the changed verifier and append regression coverage without moving exact-rule
targets. Include real normal-mode CLI controls: correct baseline passes,
changed exact category without regeneration fails, refreshed baseline passes,
and removed rules or changed structural classification cannot retain stale
categories. Cover deterministic sanitized mismatch output and unchanged
addition/removal behavior. Existing test-file size is a pressure signal; keep
new coverage cohesive and bounded rather than restructuring unrelated tests.

Coordinator owns the generated receipt and delivery documents. Require fresh
focused checks, typecheck/lint, staged receipt fixed point, zero missing,
unclassified and category-mismatched entries, and independent SPEC then QUALITY.
Only then commit and push this repair and obtain fresh exact-head hosted gates.
No account slice, runtime change, screenshot, provider or earlier-branch edit.

## Task 5: Account, service and local-first presentation

PR #9 is verified at `9f2afb41854a6600a2c94f0c416d0531c6b16e0a`:
Codex completed clean at 21:28 UTC, CodeRabbit completed clean at 22:16 UTC,
both existing threads are resolved, and all seven jobs in CI `35538608085`
passed. This opens the next slice, not merge authorization or sequence completion.

Use `codex/phase6-05-account-service` from that exact public-content head in
the existing approved isolated checkout. Preserve every published branch and
the original `7e318558da425b8fcdddeb8df50e93a36900310a` recovery source.
The product/requirement baseline is source Task 4 (account/security/messaging/
local-first presentation), the source design's curated-copy and compatibility
boundaries, and this bounded allocation. The runtime/architecture baseline is
unchanged account/security, billing and local-first ownership: only presentation
and its existing source-owned browser repairs move into this slice.

The original account ownership manifest contains exactly 49 paths: the 46
listed in item 1 plus `app/api/debug/sentry/route.ts`,
`tests/problem-report-route.test.mjs`, and `tests/sentry-privacy.test.mjs`.
Membership describes recovery-source ownership, not permission to copy every
file unchanged. Items 1–7 record the pre-administrative-amendment allocation;
the amendment below supersedes its affected copies and counts. Apply the final
amended scope when checking source equivalence or assembling this slice.

1. The pre-amendment full-source account list contains these 46 paths:
   - `app/account/app-settings-panel.tsx`, `app/account/link-google/link-google-form.tsx`,
     `app/account/page.tsx`, `app/account/supporter-interests-panel.tsx`;
   - `app/api/account/security/google/link/confirm/route.ts`,
     `app/api/clients/invitations/route.ts`,
     `app/api/education/flashcards/decks/[slug]/route.ts`,
     `app/api/education/flashcards/decks/route.ts`;
   - `app/login/login-form.tsx`, `app/register/register-form.tsx`,
     `app/notes/intake/client-page.tsx`, `app/notes/journal/client-page.tsx`,
     `app/notes/professional-record-vault-provider.tsx`, `app/notes/rom/client-page.tsx`,
     `app/notes/soap/client-page.tsx`, `app/notes/soap/components/transcript-review.tsx`,
     `app/notes/therapist-notes-gate.tsx`;
   - `lib/account-security-email-intents.ts`, `lib/admin/billing-goodwill.ts`,
     `lib/admin/role-service.ts`, `lib/admin/security-service.ts`,
     `lib/admin/temporary-access.ts`, `lib/auth-mail.ts`, `lib/auth-registration.js`,
     `lib/commerce/credit-service.ts`, `lib/license-verification.js`,
     `lib/local-documents.js`, `lib/local-intake-builder.js`,
     `lib/professional-record-vault.js`, `lib/sentry-options.js`, `lib/sentry-privacy.js`;
   - `tests/account-security-email-intents.test.mjs`, `tests/account-security-routes.test.mjs`,
     `tests/admin-billing-goodwill.test.mjs`, `tests/admin-operation-service.test.mjs`,
     `tests/admin-role-service.test.mjs`, `tests/admin-security-ui.test.mjs`,
     `tests/admin-temporary-access.test.mjs`, `tests/auth-mail-ceiling.test.mjs`,
     `tests/auth-registration.test.mjs`, `tests/browser/admin-user-operations.spec.ts`,
     `tests/local-intake-builder.test.mjs`, `tests/password-reset-confirmation.test.mjs`,
     `tests/professional-record-vault.test.mjs`,
     `tests/supporter-interests-panel.test.mjs`, `tests/task-4a-browser-harness-contract.test.mjs`.
2. Exclude `tests/problem-report-route.test.mjs` from the 49-path manifest's
   source copying. Its only remaining source delta would undo the validated
   stable Sentry event repair. Preserve that route test, `lib/problem-report.js`
   and `tests/problem-report.test.mjs` byte-for-byte from the reviewed base.
   Also exclude `app/api/debug/sentry/route.ts`: an offline execution of the
   actual base/source GET functions proves that source changes the enabled
   synthetic event name while disabled responses remain identical. Source Task 4
   explicitly forbids renaming an event/provider identity for presentation.
   Preserve the complete reviewed-base route, including its existing flag, and
   add a small `tests/sentry-debug-route.test.mjs` behavioral contract for the
   actual route's disabled/enabled behavior and independence from public identity.
   Also carry the canonical-origin assertions from `tests/sentry-privacy.test.mjs`,
   but correct its paired static test: retain the original environment-name checks
   and reject public-identity wiring instead of requiring the source defect.
   The new behavioral contract proves the actual emitted name. These two paths
   add the fourth and fifth intentional Sentry source divergences, not a provider migration.
3. Carry two full-source direct companions: `tests/browser/identity-method-safety.spec.ts`
   (four account link selectors), and `tests/browser/interaction-feedback.spec.ts`
   (two account selectors plus deterministic private-account abort settlement).
   The latter carries the source's held abort gates, readiness/overlap assertions,
   bounded handler drain and exact teardown-cancellation classification together.
   Its two helper dependencies already match source; do not edit them or replace
   behavior proof with string-only checks. Run their existing contracts and the
   paired account harness contract. Hosted browser CI remains required.
4. In shared `tests/browser/public-routes.spec.ts`, change only the register
   heading to `Create AtmoShaper account`. Defer its two remaining visualizer
   hunks. Do not import the full Phase 6 spec, its sidebar-hydration/ring/heading
   contracts, lane registration, PNGs, current legal versions or final fingerprints.
   `tests/browser-qa-harness.test.mjs` and the existing async/teardown helpers
   stay unchanged; their applicable existing tests provide dependency evidence.
5. Preserve internal operation names, audit actions, stored formats, email-intent
   kinds, idempotency/reconciliation descriptions, environment values and provider
   payload identities. No authentication, same-account proof, 2FA, authorization,
   billing, entitlement, PHI-storage or provider behavior changes. Keep earlier
   pilot, homepage, audio, Sentry and audit-verifier repairs. AtmoShaper is the
   current public name; retained MassageLab compatibility values are not stale copy.
6. Before the amendment, the implementer owned 51 changed source/test paths. Coordinator owns this
   parent plan, canonical state/log, Git and the generated intermediate brand
   receipt and necessary exact classification rules. Preserve the five existing
   exact rules and add only fresh compatibility occurrences for the retained
   debug event and its regression assertion. Regenerate through the existing command;
   classifier precedence, mismatch rejection and strict addition detection.
   Verify a staged-byte fixed point, not final-source fingerprint substitution.
7. The pre-amendment proof covered 48 full-source files, the register-only
   companion, corrected privacy-test companion and added debug-route regression.
   Run focused account/admin/mail/local-first/privacy and existing
   helper/browser contracts, typecheck, full lint, full provider-free unit suite,
   documentation/archive tests, brand audit, inventory and diff checks. Then
   independent SPEC followed by QUALITY, root exact-candidate verification,
   commit, publish against `codex/phase6-04-public-content`, attach, and obtain
   both hosted reviewers and strict CI on the actual base/head. Expected scope
   was 56 paths with delivery docs/policy/receipt; the amendment below replaces
   these counts. Measure the final scope, target under 85 and never 100.

No-code or documentation-only work cannot deliver the accepted copy. Existing
owners suffice; no new runtime architecture, abstraction or ADR is needed.
Large files receive only existing-source presentation wiring and cohesive paired
test repairs, not broad restructuring or another responsibility. TDD remains
off/skipped for mechanical redistribution; a new defect requires causal evidence
and its own bounded repair. Retire only old current-presentation wording; stable
external/data compatibility identities remain until separately migrated. Final
source equivalence must retain validated divergences, including Sentry and audit
repairs. The separate Linux Atmosphere snapshot decision remains pending.

The debug recurrence is source allocation treating an emitted synthetic event as
public display copy, analogous to the already corrected problem-report event.
The canonical route is the producer; preserving it is sufficient at runtime,
without a second identity owner, fallback or new branch. The focused test executes
the route under controlled flags and alternate public identity, and the existing
problem-report regressions preserve the other known manifestation. No semantic
decision changed: public presentation and operational identity remain distinct.
The new small test owner avoids adding route execution to the unrelated SDK-options
tests or enlarging the existing operational-boundary scanner. Fresh exact audit
rules prevent regeneration from misclassifying these retained values as public copy.
Independent SPEC then QUALITY must review this explicit source exception.

### Task 5 amendment: immutable administrative bundle compatibility

This amendment supersedes the five producer copies, three paired full-source
test copies, and pre-amendment 51-source/test, 48-full-source and 56-total counts
in Task 5 above. Independent QUALITY found a P1 after SPEC passed
and the full provider-free suite passed (4,708 passed, three skipped). Root
reproduced it using actual reviewed-base and candidate role implementations in
the same transactional fixture: base create and replay succeed; candidate
replay rejects the unchanged historical operation key. The inverse candidate
create then base replay also rejects. Failed replay leaves stored state unchanged.

The shared recurrence is classifying persisted evidence as mutable presentation.
Five producer families rebuild changed explanations/subjects/messages; the
unchanged exact comparator in `lib/admin/operation-service.ts` correctly rejects
them. That strict owner is not defective. All production bundle call sites are
in the five files below. Account-security email intents instead retain an existing
row through an empty-update upsert and deliver its stored copy; they do not
reconstruct an immutable bundle, so their presentation changes remain in scope.
No database/provider was used to create candidate records during this slice.

Change necessity: the unchanged candidate violates Task 4's idempotency and
rollback boundaries; documentation alone cannot make historical keys replay.
Decision: remove the five incompatible producer deltas, not weaken validation.
Restore exact base `9f2afb41854a6600a2c94f0c416d0531c6b16e0a` content in:

- `lib/admin/role-service.ts`
- `lib/admin/security-service.ts`
- `lib/admin/temporary-access.ts`
- `lib/commerce/credit-service.ts`
- `lib/admin/billing-goodwill.ts`

Existing builders remain the only copy owners; no new fallback, alias, text
normalization, copy-from-existing input, version field, operation-key version,
send-time rewriting or schema/data migration is permitted. The comparator and
every action kind, payload, Stripe description, transaction and delivery contract
remain unchanged. Retain the brand-agnostic supplied-bundle fixture change in
`tests/admin-operation-service.test.mjs`.

Use the real existing service fixtures to assert exact base-era bundle copy,
then unchanged-key replay without duplicate effects. Cover role assign/revoke;
session revoke, 2FA reset and password-reset request; temporary grant and both
temporary-revoke effective states; background-credit grant; verified goodwill.
For every case, independently corrupt a persisted explanation, subject or
message and require rejection without state/delivery/provider changes. Include
the unpublished AtmoShaper variant as a negative, not an accepted template.
Owner test files are `tests/admin-role-service.test.mjs`,
`tests/admin-security-service.test.mjs`, `tests/admin-temporary-access.test.mjs`,
`tests/admin-background-credit-grant.test.mjs`, and
`tests/admin-billing-goodwill.test.mjs`. No external provider or persistent DB.

Complexity: these existing fixtures are large (security 972, temporary 1,494,
goodwill 1,675 lines), so use compact table-driven cases and existing helpers;
do not add another fixture/loader architecture. Intent is a local contract
regression, not new responsibility. Broader fixture extraction is a separate
follow-up and not a prerequisite for preserving this already-defined contract.
Runtime owners become smaller by removing public-identity wiring. TDD remains
off/skipped, with diagnostic reproduction and behavioral regression coverage.

Verify the six-file operation/producer test group, then amended Task 5 focused
tests, full provider-free unit suite, typecheck, lint, audit and inventory.
Root independently proves all five runtime blobs equal base; this also gives
bidirectional copy compatibility without accepting altered evidence. Regenerate
only exact compatibility occurrence rules/receipt while preserving the seven
existing rules and strict classifier. Renew independent SPEC then QUALITY on
the final candidate before any commit or publication. Expected scope is now
53 paths: 40 full-source files, five partial source/test companions, two expanded
existing owner tests, one new debug test, and five delivery/audit files.

Reconcile that final scope from the original 49-path ownership manifest: retain
the debug route, problem-report route test and five administrative producers
unchanged (seven paths), leaving 42 changed manifest members: 38 exact recovery
copies and four partial companions (privacy, role, temporary-access and goodwill
tests). Add the two exact browser companions, the register-only shared browser
companion, two expanded owner tests and the new debug test: 48 source/test paths.
The plan, project state, project log, audit policy and generated baseline add five
delivery/audit paths, for 53 total. The 40 exact copies are those 38 manifest
members plus the two full-source browser companions; unchanged exceptions are
still accounted for and must not be restored from recovery during integration.

Retirement decision: bounded compatibility exception at the documented durable
operation contract. Existing canonical templates remain active, including their
legacy brand wording in administrative evidence and notifications. Observation
is the exact-template/replay matrix; retirement requires a separately approved
version-aware rollout and removal of the old rollback target before new writes.
No current records are changed or deleted. Rebranding these immutable notices
is deferred, explicitly not claimed complete. Original source equivalence must
record these five runtime and three paired-test exceptions alongside Sentry.

Execution readiness: same approved branch/worktree and sole implementer;
coordinator owns docs, policy, receipt and Git. Intent is replay preservation;
scope is the ten files named above, no provider or snapshot work. Stop on any
unexpected runtime delta, need for persistent-data migration, failed behavioral
case, or review finding. Method guidance does not grant completion authority.

## Remaining ownership sequence

Task 5 local verification receipt: repaired tree
`65db8418bbca2c7ee134c5d7684af9fc68f61529` passed SPEC then QUALITY, 4,710 unit
tests with three skips and zero failures, 662 focused checks, 146 coordinator
checks, typecheck and full lint. The scope is 53 paths, with 40 exact recovery
copies and 20 unchanged protected-base paths. Both independent actual-code
reproductions now pass upgrade and rollback. The 48 exact audit rules preserve
all seven prior rules and classify 41 inspected administrative occurrences;
the 26,024-entry receipt is a staged-byte fixed point with zero discrepancies.
Final delivery-document receipt edits require focused revalidation; hosted gates
remain pending until publication. This is not completion of later slices.

The source has 319 changed paths: 291 non-PNG plus 28 PNG. The independently
mapped allocation below is final-file ownership, not permission to copy shared
files early. Earlier slices must carry matching owner-specific test/audit hunks.

| Order | Source ownership group | Unique non-PNG paths |
| --- | --- | ---: |
| 1 | Legal archives/verifier | 6 |
| 2 | Product identity and shell | 16 |
| 3 | Atmosphere audio | 35 |
| 4 | Public routes/content | 54 |
| 5 | Account/service copy | 49 |
| 6 | Background renderer presentation | 60 |
| 7 | Background catalog/controls | 29 |
| 8 | Current legal identity | 13 |
| 9 | Integration/audits/authority | 29 |

Slice 9 also owns 28 source PNGs. Shared docs, policy and test hunks can recur,
so actual PR file counts must be measured before publication. Exact manifests
and bounded Slice Cards are recorded in the coordinator handoff before each
slice is dispatched; no later implementation is authorized by a count alone.

Preserve shared browser/SEO/app-settings contracts with their runtime owners.
Audio includes browse/navigation/favorites/station groups and the Drone artwork,
carousel and shared-label repairs. Legal includes README/LICENSE/sidebar
copyright and dynamic legal-version fixtures. Renderer changes are not merely
comments. Final integration carries the full Phase 6 browser spec, QA harness,
streaming/ring contracts, lane registration, final audit APIs and fingerprints.
Do not copy final fingerprint policy into intermediate trees where it is stale.

## Verification, risks and retirement

Each PR requires all actionable threads addressed, both hosted reviewers clean
on its exact final head and actual slice base, and green required CI. Published
cooldowns belong to each bot/PR independently; do not invent review windows.
Any head/base change requires coverage reconciliation. Required CI stays strict.

Before declaring the sequence ready, compare its combined tree with recovery
source, account for every path/hunk and repair, and explain intentional
delivery-document/intermediate-receipt differences and separately verified repairs. Missing equivalence proof,
unreviewed slices, capacity refusal and the unresolved Linux ring check prevent
completion. No screenshot relaxation is an acceptable substitute.

Preserve PR 5 and its branch as recovery references. Closure, merge order and
worktree cleanup require separate ownership/authorization checks. Rollback is
retaining the source and declining to merge replacements; no external resource
rollback is needed. Future validated fixes must not silently disappear when
the stack is reconciled. No new architectural ADR is needed for repackaging.
