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

## Remaining ownership sequence

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
