# AtmoShaper Reference Inventory

Source repository: `dsbowersock/massagelab`. Locked Phase 2 source: merged `main` `e74045c2fc85c2cb4df176fdb1aff2137c4d9848`. Inventory date: 2026-09-08. Relock branch: `codex/atmoshaper-phase2-relock`.

Authority: [charter](atmoshaper-migration-charter.md), [approved design](../superpowers/specs/2026-09-06-atmoshaper-repository-migration-design.md), [bootstrap plan](../superpowers/plans/2026-09-06-atmoshaper-repository-migration.md), [Phase 3 plan](../superpowers/plans/2026-09-09-atmoshaper-phase3-documentation-consolidation.md), [Phase 4 audit-only plan](../superpowers/plans/2026-09-10-atmoshaper-phase4-audit-only.md), and [rollback plan](atmoshaper-rollback-plan.md). This document retains the Task 2 classification contract and accepted Task 3/4 source, Task 7 destination, and Task 9 publication receipts. The Phase 4 update at the end supersedes their timing and next-action statements; historical source/initial-tree counts and dated provider receipts are preserved.

## Historical Phase 3 Update — 2026-09-09

Bootstrap [PR #1](https://github.com/dsbowersock/atmoshaper/pull/1) merged at `2026-09-09T09:36:44Z` by `dsbowersock` as `f59e1b9371b06e7401740ae011f6dc911430a97c`, joining sole fresh root `7e89f7ba9508a1ad715c1824ea6099432e6a4ccd` and reviewed head `6f516b29a8f1be8c66b48663f1101b66efe3f7f9`. The bootstrap review branch `codex/bootstrap-atmoshaper` is retained. Source remains `e74045c2fc85c2cb4df176fdb1aff2137c4d9848`.

Phase 3 is complete on `codex/atmoshaper-docs-consolidation`, based on that merge and published in [PR #2](https://github.com/dsbowersock/atmoshaper/pull/2). Tasks 1–3 are committed (`99a1faa`, `7be78ff`, `49fba96`), Task 4 authority synchronization is complete at `7daec8142d0353b33f5aaeabcccb7689f15c820b`, and Task 5 completed the deterministic audit reconciliation and closeout evidence at `62fd42beae83ea90b02a2ea321f7993c4b3661d1`. Hosted checks and review are active; Phase 4 has not started.

The semantic review covered 150 inherited records: 122 plans and 28 specifications. All 28 specifications and 106 inherited plans remain (134 records). Exactly 16 superseded plans were omitted under the [Phase 3 cleanup receipts](atmoshaper-cleanup-register.md#phase-3-documentation-omissions--2026-09-09), with an exact path, replacement owner, immutable MassageLab source, and rollback blob for each. MassageLab retains every original. The additional Phase 3 plan gives 107 plans and 28 specifications; no uncertain or test-consumed record was omitted. This subsequent cleanup does not alter the initial 1,908-path bootstrap contract or its four export omissions.

The [architecture map](../architecture.md), [decision index](../decisions/README.md), and [account-security owner](../wiki/account-security.md) now exist. ADR 0001 is Accepted; ADRs 0002–0004 remain Proposed. Historical ADR-candidate wording below describes the export boundary before these files existed.

Runtime/public rebrand, dedicated old-origin recovery, provider staging, deployment, DNS/domain, production/database/payment/email/media, and legal changes remain future-gated work. No unrelated provider observations were refreshed by this documentation synchronization. [Project state](../project-state.md) owns the current hosted-review gate.

## Historical Source Tree Summary

`git rev-parse HEAD` and `git rev-parse origin/main` matched the charter before inspection. `git ls-tree -r --name-only` and `git ls-tree -r -l` at that exact SHA report **1,905 tracked files, 41,591,234 blob bytes, 41 top-level entries**. Bytes are summed uncompressed Git blob sizes, not working-tree allocation, Git history size or bundle size. No untracked/ignored workstation file is an export input.

The table partitions every source path by its first path component. More specific rules below override the parent classification; otherwise all descendants are retained unchanged. These are classification prefixes, never recursive deletion instructions.

| Top-level entry | Files | Blob bytes | Classification |
| --- | ---: | ---: | --- |
| `.agents` | 10 | 27158 | Keep active skill; historical refactor records unresolved/retained except the exact omission below. |
| `.env.example` | 1 | 7320 | Keep secret-free example; values are examples, not provider readback. |
| `.gitattributes` | 1 | 233 | Keep byte/line-ending contracts. |
| `.github` | 1 | 7367 | Keep CI. |
| `.gitignore` | 1 | 2021 | Keep private/generated-file exclusions. |
| `.nvmrc` | 1 | 3 | Keep toolchain. |
| `.superpowers` | 5 | 64171 | Unresolved; retain commerce/background receipts. |
| `AGENTS.md` | 1 | 2678 | Replace only destination project authority/terminology; retain safety rules. |
| `app` | 352 | 3975008 | Keep all runtime/routes. |
| `auth.ts` | 1 | 10947 | Retain as compatibility. |
| `components` | 257 | 2942468 | Keep all UI/runtime/assets. |
| `components.json` | 1 | 443 | Keep configuration. |
| `data` | 40 | 4756674 | Keep catalogs, provenance and release evidence. |
| `docs` | 238 | 5457661 | Keep except exact current-document replacements and the three MassageLab-only execution records; candidate subgroups below remain retained. |
| `eslint.config.mjs` | 1 | 607 | Keep configuration. |
| `hooks` | 3 | 9766 | Keep runtime. |
| `instrumentation-client.ts` | 1 | 202 | Keep telemetry boundary. |
| `instrumentation.ts` | 1 | 322 | Keep telemetry boundary. |
| `lib` | 352 | 5332401 | Keep runtime/domain/adapters/compatibility. |
| `LICENSE` | 1 | 1691 | Keep proprietary ownership/license verbatim. |
| `next.config.mjs` | 1 | 3659 | Keep build/provider/cache policy. |
| `package-lock.json` | 1 | 657252 | Keep dependency bytes. |
| `package.json` | 1 | 14439 | Keep the merged parity script; Task 6 may add only approved repository/brand audit scripts. |
| `patches` | 2 | 59137 | Keep installed-dependency patches. |
| `playwright.config.ts` | 1 | 14612 | Keep browser projects/fixtures/gates. |
| `postcss.config.mjs` | 1 | 135 | Keep configuration. |
| `prisma` | 49 | 375411 | Keep schema, seed, lock and all 46 migrations. |
| `prisma.config.ts` | 1 | 462 | Keep database configuration boundary. |
| `public` | 72 | 5606288 | Keep icons/media/offline assets. |
| `README.md` | 1 | 3510 | Replace destination current introduction; retain legal/history links. |
| `scripts` | 73 | 612767 | Keep all maintenance, generation and release owners. |
| `sentry.edge.config.ts` | 1 | 126 | Keep telemetry. |
| `sentry.options.ts` | 1 | 1400 | Keep privacy/environment policy. |
| `sentry.server.config.ts` | 1 | 164 | Keep telemetry. |
| `skills-lock.json` | 1 | 283 | Keep active skill lock. |
| `styles` | 1 | 2428 | Keep visual behavior. |
| `tailwind.config.ts` | 1 | 2797 | Keep visual configuration. |
| `tests` | 421 | 11626021 | Keep all contracts/fixtures/CI lanes. |
| `TODO.md` | 1 | 6846 | Keep referenced source evidence; not current authority. |
| `tsconfig.json` | 1 | 735 | Keep compiler aliases/options. |
| `types` | 4 | 3621 | Keep contracts. |

Candidate groups were counted separately; these rows are subsets of the source summary, not additional files.

| Candidate group | Files | Blob bytes | Bootstrap disposition and evidence |
| --- | ---: | ---: | --- |
| `docs/superpowers/plans/` | 122 | 2716827 | Referenced plans and protected security/legal/provider decisions stay; all other plans are unresolved and retained until semantic review. Direct test owners are listed below. |
| `docs/superpowers/reports/` | 2 | 84656 | Keep both: current audio provenance reference and direct workload-test input. |
| `docs/superpowers/qa/` | 2 | 39028 | Keep audio interruption/startup device evidence pending equivalent current proof. |
| `docs/aegis/work/` | 33 | 310882 | Retain 30 security, durable billing and audio decision records; omit only the three exact MassageLab migration-execution records listed below. |
| `docs/aegis/plans/` | 4 | 96212 | Keep audio review/provenance decisions; no whole-group omission. |
| `docs/audits/` | 7 | 67757 | Keep operational/security/compatibility/control evidence pending consolidation. |
| `docs/background-branding-audit/` | 8 | 48847 | Keep generated audit and all seven batches: generator owns this directory and its tests require the exact output filenames. |
| `.superpowers/` | 5 | 64171 | Unresolved/retained: commerce and background history, including a current-log reference. |
| `.agents/` | 10 | 27158 | Keep active Neon skill; eight historical refactor records retained pending semantic review; one exact receipt omitted below. |
| `TODO.md` | 1 | 6846 | Keep: referenced by current authority and wiki. |
| `docs/roadmap.md` | 1 | 13973 | Keep: authority/wiki plus direct calendar test read. |

## Historical Bootstrap Required Keep Set

Every source file outside `omitPaths` is retained; only `replacePaths` may change bytes. This includes all runtime, tests, CI, legal/acceptance code, entitlement keys, schema/migrations, fixtures, media, source attribution, secret-free examples, deployment/privacy/PWA/billing/security/release instructions and active agent instructions. No filename containing MassageLab is obsolete on that basis.

In particular retain `LICENSE`, `lib/legal-documents.js`, `lib/legal-acceptance.js`, `lib/legal-acceptance-gate.js`, `docs/background-sources.md`, `docs/carousel-sources.md`, `docs/licenses/componentry-mit.txt`, `docs/wiki/atmosphere-audio.md`, all `data/atmoshaper/` material and its `lib/atmoshaper/` validators/release tooling. Source-visible proprietary ownership and `UNLICENSED` package metadata stay unchanged. Public repository visibility does not grant reuse rights.

The source audio wiki distinguishes the shipped **51-concept** release (four processed, 47 dynamic) from historical **84-concept** taxonomy/research. Moodist media is retired and prohibited as runtime fallback. Neither research rows, MIT code licensing nor a general library description replaces exact-file provenance, license, source mapping and audio QA.

Reference proof at the locked SHA:

| Retained exact path or bounded family | Direct consumer / corroboration |
| --- | --- |
| `docs/superpowers/plans/2026-08-28-release-soft-launch.md`; `2026-08-28-identity-account-method-safety.md`; `2026-08-28-subscription-entitlement-convergence.md` in that same directory | `tests/auth-schema-migration.test.mjs:43-45` reads all three. Also protect irreversible rollout history. |
| `docs/superpowers/plans/2026-08-29-bootstrap-pricing-cost-hardening.md`; `docs/superpowers/reports/2026-08-29-bootstrap-pricing-cost-hardening.md` | `tests/family-friends-server-workload.test.mjs` reads both. |
| `docs/superpowers/plans/2026-07-18-clock-chimer-music-visualizer.md` | `tests/immersive-panel-shell.test.mjs:19` reads the plan. |
| `docs/superpowers/plans/2026-08-31-operational-limiter-email-ceiling.md`; `2026-08-31-public-booking-traffic-hardening.md`; `2026-08-31-anatomime-traffic-hardening.md` in that same directory | `tests/operational-rate-limit-schema.test.mjs` reads all three. |
| `docs/superpowers/plans/2026-07-15-sitewide-control-system-rollout-actions.md` | `tests/sitewide-control-rollout.test.mjs:92` reads the plan. |
| `docs/roadmap.md` | `tests/calendar-creation-routes.test.mjs` plus AGENTS, README, state, log, wiki. |
| `docs/background-branding-audit/` | `scripts/background-branding/render-audit.mjs:13` resolves the output directory; `tests/background-branding-audit.test.mjs` verifies the generated filename set through an injected writer, without reading these Markdown outputs. |
| `docs/superpowers/reports/2026-08-23-atmoshaper-signature-sound-catalog-audit.md` | Current source state, log and audio wiki link this research/provenance evidence. |
| `.superpowers/sdd/final-fixes-report.md` | Source `docs/project-log.md` references the completed fix receipt. |
| `docs/wiki/` current operational set | `docs/wiki/index.md`, source state/log and AGENTS form the read-first graph; preserve linked current operations and privacy boundaries. |

## Historical Bootstrap Evidence-Backed Omission Set

Only the following four source files are omitted from the new repository. They remain in the old repository at the locked commit. No omission executes during this relock.

| Item | Current path | Type | Why it may be obsolete | Runtime references | Test references | Historical value | Proposed action | Proof required | Rollback | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Completed one-line wrapper retirement receipt | `.agents/refactor/2026-06-21-refactor-anatomime-session-wrapper.md` | Historical refactor report; 1369 bytes | Describes removal of an already-absent one-line JS wrapper and old 663-test results; defines no current operational contract. | Zero path/basename matches outside the report; source has the TS implementation and no JS wrapper. | Zero report consumers; `tests/ts-js-compatibility.test.mjs` owns the current dynamic compatibility check. | Preserved as old measurement/retirement evidence at exact old SHA. | Omit this exact file from the new tree only. | Full report read plus whole tracked-text path/basename grep, folder-consumer scan and source-tree absence of removed wrapper; all satisfied. | Restore exact blob `6f811591f79b24c75181a82db1b30fcada896e8f` from old source without changing runtime. | omit from new repository |
| MassageLab migration execution intent | `docs/aegis/work/2026-09-06-atmoshaper-repository-migration-execution/10-intent.md` | Source-repository work record; 5468 bytes | Owns the MassageLab coordinator's branch, task, and external-write boundaries, not destination authority. | None; documentation-only. | No runtime/test consumer. | Preserved in MassageLab `main` and history at the locked source. | Omit this exact file; create destination lineage/current authority through Task 5 instead. | Exact-path source presence and document-role review; satisfied. | Restore the exact locked-source blob if destination review requires it. | omit from new repository |
| MassageLab migration execution checkpoint | `docs/aegis/work/2026-09-06-atmoshaper-repository-migration-execution/20-checkpoint.md` | Source-repository work checkpoint; 1387 bytes | Records how to resume work in MassageLab and would be stale/misleading as a destination checkpoint. | None; documentation-only. | No runtime/test consumer. | Preserved in MassageLab `main` and history at the locked source. | Omit this exact file; Task 5 writes fresh destination state. | Exact-path source presence and document-role review; satisfied. | Restore the exact locked-source blob if destination review requires it. | omit from new repository |
| MassageLab migration execution evidence | `docs/aegis/work/2026-09-06-atmoshaper-repository-migration-execution/90-evidence.md` | Source-repository execution evidence; 7849 bytes | Records old-repository task commits and lifecycle receipts; lineage links back to the old repository instead of duplicating its active work record. | None; documentation-only. | No runtime/test consumer. | Preserved in MassageLab `main` and history at the locked source. | Omit this exact file; retain source evidence by exact lineage. | Exact-path source presence and document-role review; satisfied. | Restore the exact locked-source blob if destination review requires it. | omit from new repository |

Historical source: [completed wrapper receipt](https://github.com/dsbowersock/massagelab/blob/fa78ca01a42179329cc223df77c76f308e76320b/.agents/refactor/2026-06-21-refactor-anatomime-session-wrapper.md). New documents refer to that historical location, not a broken destination-relative link.

## Historical Bootstrap Replacement and ADR Set

Task 5 replaces `README.md`, `AGENTS.md`, `docs/project-state.md` and `docs/project-log.md` with concise destination authority. The new log begins at migration and links old history; it must not recast MassageLab events as AtmoShaper events. Existing licensing and operational safety rules survive. The merged source already contains the approved migration-parity package script and all reviewed Task 3/4A runtime, harness, fixture, and snapshot bytes; Task 5 must export them unchanged. Source-present `package.json` is nevertheless a declared non-overlay replacement because Task 6 adds exactly the `repository:inventory` and `brand:audit` command registrations there. No package identity, dependency or runtime change is authorized.

Task 3 also replaces the source-present `tests/browser-qa-harness.test.mjs` with one explicit migration-only spec exclusion and an independent assertion that the excluded file exists. Its previous directory scan treated every non-development spec as an ordinary CI-lane member, contradicting the approved migration-only gate. The exact 17 ordinary specs, 34 project/spec assignments, and `tests/browser/ci-lanes.mjs` remain unchanged; this is a test-harness compatibility correction with no runtime effect.

Task 3 replaces source-present `playwright.config.ts` to recognize the exact migration-spec invocation, disable existing-server reuse, and require/apply the explicit telemetry-disabled environment for enabled migration execution. Its focused matcher accepts normalized exact paths and line selectors; broad substrings, ordinary specs, and option values retain ordinary behavior. Discovery does not require capture credentials. Source and destination parity commands build the current checkout with `npm run build:browser-qa` before Playwright starts its server. An occupied port must fail instead of consuming a stale server's rendering.

Task 3 also replaces source-present `next.config.mjs` narrowly for `ATMOSHAPER_MIGRATION_PARITY=1`: require explicitly empty `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, and `SENTRY_AUTH_TOKEN`, plus `NEXT_TELEMETRY_DISABLED=1`, before compilation/provider hooks, then pass `telemetry: false` to the Sentry build plugin. The same preflight runs before the fresh build and enabled exact-spec capture; its owned server receives the same values. Empty values prevent dotenv fallback, and the public DSN must be blank at build time because it is inlined. `sentry.options.ts` enables runtime Sentry solely from the public DSN; the installed `@sentry/bundler-plugin-core` separately defaults plugin telemetry on with its own DSN. Blanking the upload token prevents release/source-map upload. Ordinary builds and runtime behavior outside explicit migration mode are unchanged; no production Sentry configuration or provider resource is modified.

Phase 3 ADR candidates are fresh-root lineage, permanent old-history/rollback ownership, product/legal/private-identifier separation, old-origin recovery, and parallel provider staging. Their current owner is design sections 3, 7, 19 and 21.8. ADRs are **unresolved**, not accepted or source omissions. `docs/architecture.md` and `docs/decisions/` belong to Phase 3 consolidation and are deliberately not undeclared Task 5 additions.

## Historical Bootstrap Unresolved Set

All eight retained `.agents/refactor/` records, all five source `.superpowers/` records, the other 30 `docs/aegis/work/` records, and plans not independently proven historical-only stay in the destination. The two inspected lazy-runtime reports contain architectural/performance explanations; zero filename hits alone does not justify their removal. Source/current-document links may omit basenames, and generic names such as `index.md`, `10-intent.md` and `90-evidence.md` create false positive basename hits. Positive matches are conservative retention evidence; negative matches are only one part of omission proof.

The scan covered all 191 candidate files individually with both exact path and basename: 63 had at least one non-self match in runtime/test/script/CI/current-authority/wiki scopes, 128 had none in those scopes, and 69 had no non-self textual match anywhere scanned. Those counts are lexical candidates, not unused-file or deletion counts. Only the single fully inspected historical wrapper receipt clears omission.

Provider console state, domain ownership/DNS, the installed baseline's complete framework cookie set, actual Task 3 snapshot filenames/hashes, and legacy-origin behavior on installed PWAs remain verification items. Missing evidence stops the dependent phase; it does not authorize new omissions or source changes.

## Destination Overlay Set

The manifest contains ten exact `codex/atmoshaper-phase2-relock` overlay paths: the manifest, charter, reference inventory, external-account checklist, implementation plan, and five carried planning/register documents whose historical Phase 1 headers must not masquerade as the current lock. Task 5 separately creates `MIGRATION_LINEAGE.md` and the four replacement authority documents.

Overlay is a **copy mechanism**, while add/replace describes the **difference from the source**. All ten overlays are source-present and therefore also appear in `replacePaths`. No overlay may be omitted, and every source-present overlay must differ byte-for-byte from the locked source at the reviewed relock branch. `MIGRATION_LINEAGE.md` is created during export and is not an overlay.

The 24 PNG names below are the exact accepted Windows Task 3 capture contract: twelve names for each existing `desktop-chromium` and `mobile-chromium` project. PR #206 merged them into the locked source, so Task 5 exports their exact source blobs rather than overlaying them. It may not silently add extra files or infer descendants at export. Task-local briefs/reports under the current `.superpowers/sdd/2026-09-06-atmoshaper-repository-migration/` directory are not source files or destination overlays.

## Visual Parity Determinism and Activity Inventory

The following subsections retain chronological capture/debugging evidence. Their earlier pending/reopening statements are superseded by **Final accepted Task 3 source parity — 2026-09-07** below, which owns the current accepted source-image/repeat status.

No masks are declared. Both Chromium projects use the same `UTC` timezone and `en-US` locale. For Clock only, before navigation the spec seeds the existing `massage-lab-settings` preference with `ambientMotionMode: "reduced"`, using the established `tests/browser/public-routes.spec.ts` pattern. This is a real user-visible app setting, not a DOM/style override, hidden image, substituted background, or weakened comparison. `SettingsProvider` normalizes the partial preference while retaining all other defaults. The selected background stays `massage-lab-moving-gradient`; `BackgroundHost` renders that registry entry's canonical visible static fallback when the app preference suppresses its animated effect.

Before `/clock` navigation, the spec also installs Playwright's clock at `2026-09-06T09:55:00.000Z`, allowing loading timers to run. After load it asserts the `chimer-running` body state, visible `chimer-premium-background` host with the exact selected ID, `data-background-effect-mounted=false`, `data-background-fallback-only=false`, `data-background-underlay=visible`, no canvas, and one visible radial-gradient child with no animation. The mounted/pending pair distinguishes settled static presentation from an initial lazy-load fallback. It then pauses at `2026-09-06T10:00:00.000Z`, clicks the existing `Reveal clock controls` button, advances exactly 1,000ms, and remains paused at `2026-09-06T10:00:01.000Z`. The `Immersive display controls` group must be visible, `[data-immersive-shell]` opacity `1`, and current-time display `10:00 AM`. Every glyph, shadow, glow, separator, control, and background/layout area remains compared. New Clock receipts additionally declare `ambientMotionMode: "reduced"`, `backgroundId: "massage-lab-moving-gradient"`, and `backgroundPresentation: "static-fallback"`.

The source timing owners are `app/chimer/page.tsx` (one-second time updates), `lib/chimer-timer.js` (default 12-hour display), `app/chimer/running-timer.tsx` (reveal, three-second fade, six-second hide), and `app/chimer/immersive-panel-shell.module.css` (900ms opacity transition). The 1,000ms settling advance completes that transition before either hide timer; controls remain visible while screenshot capture runs. The installed official `Clock.install`, `Clock.pauseAt`, and `Clock.runFor` API documentation in `node_modules/playwright-core/types/types.d.ts` owns clock emulation semantics.

Render-only parity permits no browser writes. Every non-GET/HEAD request is recorded and aborted at its first hop, including local requests, so a local 307/308 cannot forward a write externally. Observers stay active through explicit closure of the owned browser context; exact fixture cleanup then runs even if closure fails, and the inventory/error assertions follow cleanup. Read-only external request method/origin/path/resource type is recorded separately, without URL queries or credentials.

The coordinator's first authorized 2026-09-06 capture used a separate empty disposable QA target after all 46 source migrations and a current-checkout build. It returned **18 passed / 4 failed** and generated 22 of the 24 intended PNGs. Neither Education baseline exists: both readiness assertions selected hidden navigation/screen-reader labels. The corrected readiness owner is the exact visible `Open flashcards` link in `app/education/page.tsx`. Both signed-in tests reached profile/security screenshots but then failed the unchanged zero-mutation assertion on a Sentry envelope POST. Their separate contexts visit only account routes, so Education's test-runner assertion does not explain the signed-in telemetry attempt. The exact envelope kind cannot be established without a payload/trace; none was retained.

All 22 generated baseline PNGs and all four failure screenshots were visually inspected. All 22 `*-actual.png` files in `test-results` are byte-identical to those inspected baselines. Home, Tools, Music, Chimer, Clock, Wellness, Notes, Pricing, Support, and account profile/security render their current desktop/mobile surfaces; Clock shows `10:00 AM`, visible controls, and unmasked glow/shadows in both projects. The app renders its existing dark theme despite light media emulation. These full-page captures cover the initial viewport of the app's internal scroll containers, not unseen lower content; Pricing shows the empty-QA-target unavailable-price state. These are source-state observations, not permission for application/UI changes or accepted parity evidence.

The initial run above is historical failed-run evidence. Its console-only reporter did not preserve body inventory attachments; no external-read cleanliness was inferred from that run. The corrected spec persists `migration-parity-inventory.json` inside each owned test output directory before attaching it. The subsequent clean recapture receipt below supersedes the missing-PNG/inventory status, but repeat comparison and the stated visual qualifications still gate final acceptance.

### Historical post-Chimer-wait capture and failed repeat — 2026-09-06

**Historical acceptance withdrawn:** the subsequent no-update repeat passed 21/22 tests but failed desktop Clock with 12,875 differing pixels. The images in this historical section are not accepted repeatable baselines. That failure led to the explicit app-reduced Clock contract and coherent recapture recorded in the later Accepted Reduced-motion source capture section; its final no-update repeat remains pending. Neither PNGs nor application code were changed by the implementer.

The preceding clean run passed 22 tests but its entire 24-PNG set was rejected because Chimer's temporary guest notice covered the stepper. The coordinator then ran a fresh full capture after the source-owned lifecycle wait: **22/22 passing tests and 24 fresh PNGs**. This final set was individually inspected again and is accepted as source-image evidence for the documented initial-viewport scope; full Task 3 acceptance still requires the no-update repeat. No further recapture or deletion is indicated by this inspection.

Local readback confirms `test-results/.last-run.json` is `passed` with no failed tests and no retained failure screenshot/error-context files. All **24 PNGs** match the manifest's exact name set: twelve per project (`account-profile`, `account-security`, `chimer`, `clock`, `education`, `home`, `music`, `notes`, `pricing`, `support`, `tools`, `wellness`), with no missing/extra names. Desktop PNGs are 1280×900 and mobile PNGs are 412×839. Every corresponding `*-actual.png` is byte-identical to its baseline. No blank, error-page, loading-placeholder, missing-glyph, or stale clock-digit state was observed. Education clearly shows both content cards and Source Boundary in each viewport.

All **22 persisted activity inventories** were read and validated: eleven unique tests per project, all mask lists empty, all mutation-attempt lists empty, and only the two Clock tests carry clock receipts. All 22 attached JSON copies equal their persisted owners. Both Clock receipts exactly match `UTC`, `en-US`, install `2026-09-06T09:55:00.000Z`, pause `2026-09-06T10:00:00.000Z`, and `controlsSettleMs=1000`. Both images show `10:00 AM`, revealed controls, complete warm-brown/blue gradient backgrounds, and unmasked glyph glow/shadows. Exact final virtual time, control visibility/opacity, horizontal document overflow, and console/page-error absence are enforced by the unchanged passing spec; those assertions are not separate JSON fields, so their evidence is the passing run, not an invented inventory value.

Final external-read receipts contain **38 entries / 27 distinct sanitized request descriptions**, all GETs, with no query, fragment, username, password, Sentry endpoint, or unexpected origin. The earlier 44/33 receipt belongs only to the rejected pre-wait capture:

| Tests | Observed read-only requests | Source owner |
| --- | --- | --- |
| Chimer and Clock, both projects | One font GET each to `https://db.onlinewebfonts.com/t/8e22783d707ad140bffe18b2a3812529.woff2` (four entries total) | `app/globals.css` Digital font |
| Music desktop | Eight `media.massagelab.app/atmosphere/` sample-index JSON GETs | Existing station-carousel/provider prewarm and Generative.fm catalog/runtime |
| Music mobile | The same eight indexes plus 18 Opus sample GETs: aisatsana 9, day-dream 6, Observable Streams adaptation 3 (26 entries total) | Same opportunistic prewarm owners; payload progress can differ before context closure |
| Other sixteen tests | Empty external-read arrays | Observed empty, not assumed |

The eight indexes are `generative-fm/{aisatsana,at-sunrise,day-dream,eno-machine,lemniscate,peace,trees}/sample-index.opus.json` and `observable-streams-vsco-adaptation/sample-index.opus.json`, all beneath that existing media origin's `/atmosphere/` prefix. These are expected read-only font/media dependencies, not permission for provider mutation or proof of individual response contents.

Both final Chimer PNGs show the settled initial `00:00` setup with the guest notice absent. The desktop `1 Time` step and all five step tabs are unobscured; mobile `STEP 1 OF 5` / `Enter time` is fully visible. The spec observes the exact resolved guest notice inside the `Chimer setup` region, then polls for its DOM count to reach zero with a 12,000ms deadline. `app/chimer/set-timer.tsx` owns the normal 7,500ms visible interval and subsequent 420ms exit/unmount; reduced-motion CSS does not remove that final JavaScript unmount delay. Observing the resolved guest text first prevents an absent pre-hydration notice from being mistaken for completed dismissal. Waiting for unmount, rather than opacity alone, proves the normal lifecycle ended. No DOM hiding/removal, mask, settings mutation, arbitrary sleep, or Chimer clock emulation is introduced.

After unmount, the spec asserts the responsive source marker (`1 Time` desktop button or `Step 1 of 5` mobile text) is visible, inside the viewport, and contains the center-point hit-test result. These assertions passed in both projects, matching direct image inspection. The 12,000ms value is a bounded polling deadline with headroom beyond the source's 7,920ms lifecycle, not a fixed delay or a replacement lifecycle. Clock's separate pinned-time/control sequence, telemetry preflight, and first-hop zero-write contract are unchanged. Prior local focused checks passed 49/49. This inspection changed only documentation, not the spec or any snapshot.

Music intentionally clips neighboring carousel cards/category items inside horizontal scrollers. Longer shell pages show only their initial internal-scroll viewport (including partially visible lower account/Notes/Pricing/Support/Wellness content); no blanket full-content/no-clipping claim is made. No unexpected overlay, clipping artifact, or document-wide horizontal overflow is apparent within that scope, and all overflow assertions passed in the final capture. Pricing retains the empty-QA-target unavailable-price state.

Both inspected Clock PNG hashes differed from the earlier pre-wait capture while pinned digits/control state remained correct. The required repeat subsequently falsified background determinism: desktop Clock failed (21/22 tests passed), while mobile Clock and all other tests passed and all 24 baseline hashes were unchanged. The exact threshold-highlighted region is x=75–251, y=734–854 inclusive in the lower-left lamp field; the pure-white glyph/control pixel membership is identical between expected and actual. The field also visibly shifts outside this threshold-highlighted region. Its Clock inventory still has no masks/mutations, exact original time/control receipt, and only the expected font GET; no activity-related error is indicated.

The source mechanism is `lib/motion-preferences.js`: active `chimer-running` route ownership intentionally overrides the OS reduced-motion signal unless the explicit app preference is reduced. `components/moving-background.tsx` initializes eight canvas orbs using unseeded `Math.random()` and renders them through requestAnimationFrame. Pinning Date/timers does not seed those positions/colors' spatial distribution, and Playwright's CSS-animation suppression does not normalize canvas pixels. `app/globals.css` likewise exempts active Chimer from its generic OS-reduced fallback-drift rule. The explicit app preference is the existing owner that wins over both paths; no production repair or random-number override is needed. Local focused coverage is now 50 checks; corrected static-presentation capture evidence follows below, with repeat comparison still pending.

The coordinator was instructed to archive/remove the exact prior 24 PNGs and recapture all 24 coherently under the new Clock contract, rather than changing only desktop or loosening thresholds. The completed recapture below supersedes that pending instruction. All other surface readiness, source scope, telemetry, zero-write, and exact fixture-cleanup contracts remain unchanged.

### Accepted Reduced-motion source capture — 2026-09-06

The coordinator reports **22/22 passing tests and 24 fresh PNGs** under the explicit app Reduced-motion contract. Every PNG was individually viewed and all 22 persisted inventories plus their attached copies were validated again. The exact manifest names are present, twelve per project; desktop images are 1280×900 and mobile images 412×839. All 24 actual PNGs were byte-identical to their baselines. At that capture, the last-run receipt was `passed` with no failed tests or retained failure screenshot/error-context artifacts. This set is accepted as source-capture evidence within the documented initial internal-scroll viewport scope, not yet final Task 3 acceptance; the subsequent repeat/readiness correction is recorded below.

Both Clock images visibly show the source-owned static lamp: warm upper-left and blue upper-right radial light over a dark base, with no random orb field, exactly `10:00 AM`, complete digit glow/shadows, top controls/close button, and bottom minus/plus controls. The passing spec additionally proves the selected default ID, zero canvases, no mounted/pending effect, visible static underlay/gradient, and no gradient animation. Those DOM measurements are assertions, not separate inventory fields. Both Chimer images show `00:00`, clear desktop/mobile initial step markers, and no guest notice. All other surfaces render their expected source content. No blank/error/loading state or unexpected overlay/clipping/overflow artifact was observed; intentional Music scrollers and below-fold internal-scroll limitations remain as documented.

All mask and mutation-attempt arrays are empty. Only the two Clock inventories declare the exact new receipt: `UTC`, `en-US`, `ambientMotionMode: "reduced"`, `backgroundId: "massage-lab-moving-gradient"`, `backgroundPresentation: "static-fallback"`, install `2026-09-06T09:55:00.000Z`, pause `2026-09-06T10:00:00.000Z`, and `controlsSettleMs: 1000`. The passing run also enforces final virtual time `10:00:01`, control opacity/visibility, no browser console/page errors through closure, and horizontal document fit. Error arrays are not invented as persisted fields.

This capture has **44 external GET entries / 33 distinct sanitized descriptions**: four font reads (Chimer/Clock once per project), Music desktop eight indexes, and Music mobile 32 reads (the same eight indexes plus aisatsana nine, day-dream twelve, Observable Streams adaptation three Opus samples). The other sixteen tests have empty external-read arrays. Only the known `db.onlinewebfonts.com` font and `media.massagelab.app/atmosphere/` media paths occur; no query, fragment, credentials, Sentry endpoint, or unexpected origin. These counts are specific to this new capture, not the earlier coincidentally equal 44/33 receipt with a different sample mix. The exact descriptions and all 24 SHA-256 values are recorded in the Task 3 report.

Preserve this current 24-PNG set and run the existing fresh-child QA/telemetry-inert build/owned-server **22-test no-update comparison**. Do not delete or refresh these images unless new evidence requires a reviewed correction. This inspection ran no Git, browser, database, provider, fixture, or snapshot mutation.

### Route-owned readiness after strict-locator repeat failure — 2026-09-06

The next fresh-build no-update repeat passed **20/22 tests**. Desktop Clock failed before pause/capture because the document-wide `chimer-premium-background` locator matched two nodes; its error log identifies the active match inside the `Chimer clock` region. Mobile Pricing failed before capture because the document-wide donation-form locator matched two nodes, with a hidden match reported while waiting. Both error contexts and failure screenshots were inspected. Clock shows the expected static lamp at the pre-pause `09:55 AM`; Pricing shows normal mobile membership content. These are readiness failures, not pixel mismatches. The artifacts do not establish what created the extra nodes, and no producer cause is assumed.

The parity owner now requires one accessible exact `Chimer clock` region, one background host within it, and one current-time display within it; the reveal action is scoped to that region too. `app/chimer/running-timer.tsx` owns all these descendants. Its separate `ImmersivePanelShell` portal remains outside the region: require one visible exact `Immersive display controls` group and one visible `[data-immersive-shell]` root containing it, retaining opacity `1`. Pricing readiness uses the one visible `#one-time-support` AppSurface from `app/pricing/page.tsx`, then requires exactly one visible native donation form within it. `AppSurface` forwards that ID to its card, and `DonationCheckoutForm` owns the form. Multiple visible owners still fail; no `.first()`/`.nth()` or arbitrary delay is introduced.

This test-only targeting correction does not change selected settings, Clock time/glow/background/control state, Chimer lifecycle, screenshot options, masks, or thresholds. All 24 inspected Reduced-motion baseline SHA-256 hashes remain unchanged. **Retain all 24; no recapture is required for this locator-only correction.** Run the full 22-test no-update comparison again under the existing fresh-build/QA/telemetry/owned-server gate. Task 3 remains needs-verification until it passes; do not update snapshots to dismiss a mismatch.

All 22 failed-repeat inventories have empty masks/mutation arrays. Only mobile Clock has the exact complete Clock receipt; desktop correctly has none because it failed before the receipt boundary. External activity is **105 GET entries / 79 distinct sanitized descriptions**: four known font reads, Music desktop 78 media reads and mobile 23, other sixteen tests zero. Only known font/media paths occur, without query/fragment/credentials/Sentry. This is a distinct failed-repeat receipt, not a replacement for the accepted capture's 44/33 external-read receipt. A new focused source-owner/uniqueness contract test raises local coverage to **51 checks**; browser correction remains pending the coordinator's repeat.

### Home first-frame determinism after pixel repeat failure — 2026-09-06

The next full repeat passes the corrected Clock/Pricing and every other non-Home test (**20/22 total**). Only Home fails: four desktop/five mobile counted pixels. Original-resolution expected/actual/diff images place every counted pixel on the left edge of the hero `Create a free account` CTA's MetalFx ring, not text or wordmark. Zero-based PNG coordinates: desktop `(84,788)`, `(84,796)`, `(84,797)`, `(84,798)`; mobile `(16,684)`, `(16,692)`, `(16,693)`, `(16,694)`, `(20,714)`. Maximum raw channel changes are 68/69; the exact RGBA receipt is in the Task 3 report. This is not assumed to be generic anti-aliasing. Desktop has 544 >1-level changed ring pixels plus eight isolated 2-level pixels elsewhere; mobile has 538 >1-level ring changes. Remaining raw changes are one channel level, below the unchanged comparator threshold. The default comparator already excludes antialiased pixels, marking 39/35 ring-edge pixels yellow separately from the 4/5 red failures.

The source owner is `MetalAttentionRing`: it starts playing, then its reduced-motion effect changes to paused. Installed `metal-fx` freezes the last copied 2D canvas frame and explicitly gives already-paused instances one initial copy; its shared shader phase uses elapsed `performance.now()`. Thus a stable paused image can retain a different shader frame across loads. CSS-animation suppression, font readiness, or a longer wait cannot reset that copied frame. Fonts/content/wordmark geometry are stable in the artifacts; Home uses the local Next Inter font and priority local PNG, FlipWords' reduced-motion branch retains `therapists`, and ambient reduced-motion CSS stops the background animation. No safe tolerance ceiling was established, so none is requested or added.

The attempted single pre-navigation `pauseAt` / zero-performance / 80ms-first-frame setup is **disproved by the actual browser run**. Desktop reports `performance.now() === 101`, not zero; mobile passes the zero check but its upstream inline first-copy visibility stays `hidden` after the 80ms advance for the full 7,500ms assertion timeout. No Home screenshot or complete Home receipt was written. The passing 53-check local suite included a GPU-stubbed controller/selection model that omitted injected clock resume, native observer delivery, and actual React/renderer mounting; it is not proof of this browser contract. No replacement Home timing contract is accepted yet.

After the coordinator's ownership-checked removal of those two old Home files, the missing-only attempt passed the other **20/22 tests** and retained all **22 non-Home hashes unchanged**; both Home PNGs remain absent. Read-only inspection confirms 22 persisted inventories and their matching attachments, empty masks/mutations, both exact Clock receipts, no Home receipts, and **23 expected sanitized GET entries / 12 distinct descriptions**: four font reads, eight Music desktop indexes, and eight Music mobile indexes plus three aisatsana samples (`a0`, `c-sharp1`, `f1`). Every other journey, including Home, has zero external reads. No URL query, fragment, credentials, Sentry, or unexpected origin is recorded. The older 26/15 receipt belongs to the preceding pixel-comparison run.

Playwright 1.60's installed implementation injects a resumed real-time driver before navigation log replay; the replay `pauseAt` branch changes wall time but does not reset monotonic ticks. A driver wake before first replay can therefore preserve 101 ticks. Merely adding `install` before the pre-navigation pause also preserves the real gap between those separate log entries. MetalFx 1.0.4 separately gates copies on its native IntersectionObserver and queues resizing through rAF; computed wrapper visibility is not its first-copy signal because app CSS forces the wrapper visible. The current artifacts do not identify which observer/frame ordering prevented the mobile copy, so that cause remains unproven.

The coordinator authorized ignored diagnostics under `.superpowers/sdd/2026-09-06-atmoshaper-repository-migration/` before selecting another tracked contract. C stopped at an outdated Tools heading role. D's frozen first client transition committed URL/same Document but failed to mount Home in four desktop observations. E passed ten observations only by allowing conditional pre-mount progress, yielding two shader phases: mount/copy at 300000/300016 or 300300/300304. F's warm Home visits and actual teardown were valid, but the Back readiness locator crossed route-title and body-level announcement ownership; all ten stopped before a frozen remount. The correction scopes Tools to LayoutWrapper's unique `main .ml-app-content`, without first/nth or text-exception rules. Next's source establishes a body-level shadow announcer that also publishes document.title; F did not persist matching runtime node identities, so that particular node attribution remains an inference. These rounds are diagnostic history, not accepted screenshots.

### G-proven warm-cache/remount Home contract — 2026-09-06

Terminal diagnostic G passed the coordinator's target verification, fresh build and **10/10 tests in 28.8s**. Every primary receipt matches its attachment. All five repetitions per viewport record complete retirement of both warmed MetalFx roots, zero roots on restored Tools, exact pause at performance **300000** / **2026-09-06T10:00:00.000Z**, zero pre-mount clock advances, both new roots mounted at that same frozen time, delivered native owner intersection, and hidden/transparent pre-copy state. First actual paint is at **300016** and remains byte-identical through every sampled 16ms boundary to **300512**:

| Viewport | Actual canvas | Nontransparent pixels | First-copy and retained RGBA SHA-256 |
| --- | --- | --- | --- |
| Desktop | 215x46 | 670 | `3240c273e2e44528f31c23a42dc7dd0268aa61fccc52efbab8d0aec78a8855ab` |
| Mobile | 564x121 | 4,898 | `1794ab023393a430d0ac88adb47fbadde69a16ed9bed4f2192d3e1dbd6df215b` |

These hashes match D's successful and E's early cohorts, not E's delayed phase. Warm-up timings vary, but the post-teardown origin/first-copy phase does not. All ten G observations have **zero browser mutation attempts, external reads, console/page errors, dropped events, screenshots and fixture operations**. No source PNG was created by G. Preserved C–G evidence and the 22 non-Home baseline hashes remain unchanged.

The tracked Home test now uses this observed sequence: official clock installed at 09:55; actual Tools -> Home link while running; decoded assets/fonts, unique hero/ring, reduced-motion therapists/paused state and visible actual warm paint; real Back to structurally scoped Tools in the same document; zero DOM roots plus both native observer cleanups for every warm instance; pause at 10:00; cached same-document Home remount with all new native observer registrations at frozen 300000 and no pre-mount clock progression. It waits for MetalFx's own 64px intersection callback, asserts upstream hidden/transparent state, and samples all 32 official 16ms steps, requiring first paint immediately at 300016 and one identical canvas hash through 300512 before the unmodified screenshot comparison. Only native observer state needed for readiness/cleanup is retained; the diagnostic event/rAF/timeout logger is not promoted. No production app behavior, reduced-motion preference, image, mask or pixel threshold is changed.

Home inventories now carry install/pause times, pausedPerformanceMs=300000, frameStepMs=16, frameSteps=32, paused motion state, actual warm/retired/remount counts, and first/final paint receipts (clock, dimensions, expected dimensions, real nontransparent count, SHA-256, inline visibility, native opacity and paused state). Full diagnostic logs and image bytes are not persisted in parity. The obsolete 0/80ms assumption and misleading local-model claim are removed; focused regression coverage is **54 checks**. Helpers remain in the existing spec/harness, so this correction required no additional path owner; the later Task 4A contract below supersedes the interim manifest counts.

The first full tracked adoption used two workers and passed 20/22; both Home tests completed warm-up and teardown but stalled at the second frozen remount (prepareHomeCapture line 279). The coordinator then ran the **unchanged tracked Home tests with one worker** into a protected ignored output directory with snapshot updates disabled. Both reached captureSurface and failed only for the intentionally absent expected PNGs. Their complete Home receipts match G exactly: warm/retired/remount counts 2/2/2, first paint 300016, final paint 300512, the same desktop/mobile hashes above, real pixels/geometry, visible/paused state and opacity 0.72. Both inventories have zero external reads, mutation attempts and masks. No baseline was created. This isolates the migration execution contract rather than requiring another clock or observer change.

The canonical `playwright.config.ts` now uses **one worker for exact migration parity invocations**, retaining the existing worker default for ordinary runs and one worker for CI. The same exact-path matcher owns migration serialization and fresh-server selection; source capture, missing-only capture, repeat and destination comparison inherit it without an ad hoc CLI flag. Focused coverage remains 54 checks, expanded to exercise the actual worker expression with exact/non-exact invocation variants and CI values. Manifest paths/counts remain unchanged because this config already belongs to replacePaths/overlayPaths. No wait, clock progression, pixel assertion, app behavior or snapshot was changed by this repair.

**Historical Home reopening gate, now completed:** serialized missing-only capture created the two Home PNGs while preserving the other 22. Their full-image and Home-receipt review is followed by the final accepted full repeat below. No H was required or authorized; a future timing recurrence returns to coordinator review rather than adding a fallback.

### Profile form metadata spacing: proven defect and reviewed repair

After the serialized source capture created both Home images, the next fresh-build repeat exposed a mobile account-profile difference of 3,834 pixels: visible fields were exactly 20px higher while page/Card headers and navigation aligned. All 24 baseline hashes remained unchanged. The five ignored profile-layout-1 mobile receipts and matching attachments prove the spacing source: every HTML-arrival sample includes a direct type=hidden/display:none child without [hidden], so space-y-5 gives the following first grid margin-top:20px. Repetitions 0/2/4 remove it before visible nonzero geometry and settle at grid y341/label y345 with margin0; repetitions 1/3 retain it through all 180 observed frames and settle at y361/y365 with margin20. CardContent padding-top remains 0px. Early streamed samples have zero bounds and are not represented as visible geometry. All five receipts report cleanup=true and zero mutations/external reads/browser errors/screenshots/drops; coordinator SQL independently confirms zero synthetic fixture users.

The coordinator-approved product correction changes only ProfileTab's server-action form from space-y-5 to grid gap-5, with justify-self-start preserving the existing Save profile button's content width. Layout gaps ignore display:none metadata naturally, retain 20px between visible children and remove the accidental leading gap without depending on framework-private names or hydration timing. The canonical account-page-tabs test checks this exact owner and preserves the button sizing contract. Shared form/Card behavior, actions, fixture safety, inner field layouts and parity thresholds remain unchanged. Under the historical pre-merge contract these two paths were replacements/overlays within omit1/replace44/task5Add47/task6Add6/overlay86 and source1856/Task51902/final1908. PR #206 merged their reviewed bytes into the relocked source, so they are now ordinary retained source paths.

**Source baseline choice accepted after visual review:** both old Profile images recorded the extra leading gap. The post-fix no-update comparison failed only those two (desktop 11,348 pixels; mobile 3,834), and coordinator review confirmed precisely the 20px correction, preserved Save button content width and unchanged card/header/navigation. A fresh-build, exact signed-in-test refresh passed 2/2 using changed-only updates: exactly the two Profile PNGs changed, while both Security and all other 20 images retained their hashes. The no-leading-gap state is canonical; no pt-5 compensation, DOM mask, sleep or tolerance is introduced.

### Final accepted Task 3 source parity — 2026-09-07

The final fresh-build full no-update comparison **passed 22/22**. All **24 accepted PNG hashes remained unchanged during that repeat**, and test-results contains no failure screenshot/diff/error-context artifact; its last-run status is passed with no failed tests. The coordinator visually inspected both refreshed Profile images and accepts the corrected layout. Accepted Profile files:

| PNG | Bytes | SHA-256 |
| --- | ---: | --- |
| account-profile-desktop-chromium-win32.png | 130305 | D13936F708A17851088B2C5A20A281FF5C64E17DA67A8BB3C33F8C2F699E4A08 |
| account-profile-mobile-chromium-win32.png | 58169 | D93DFE8F511AAC63EB21EA127AA9ACBD5F5B871CFCE3FA14FE4AA43FBD9D425B |

All 22 canonical inventories equal their attachments: 11 tests per project, zero mutation attempts/masks, two complete static-fallback Clock receipts and two complete G-matching Home receipts. External reads are **68 GET entries / 57 distinct sanitized descriptions**: four font reads, Music desktop eight indexes, Music mobile eight indexes plus 48 Opus samples (aisatsana18/day-dream18/Observable Streams12). The other sixteen tests have empty read arrays. Only db.onlinewebfonts.com and the existing media.massagelab.app/atmosphere paths occur, without query/fragment/credentials. These counts supersede earlier run-specific read summaries, not the underlying read-only dependency contract. Coordinator SQL confirms synthetic fixture count0 after the failed compare, targeted refresh and final repeat.

Task 3 implementation/source-capture/repeat evidence and its coordinator-owned commit are accepted. Its no-further-refresh instruction is superseded only by the Task 4A Pricing amendment below. The historical pre-merge machine contract at this point was omit1/replace44/task5Add47/task6Add6/overlay86 and source1856/Task51902/final1908. The relocked current contract is recorded below and leaves the Task 5/final totals unchanged.

**Task 4A Pricing-only parity acceptance — 2026-09-08:** the shared fail-closed Browser-QA environment forces `MASSAGELAB_SUPPORTER_CHECKOUT_PAUSED=true`, while Pricing application source remains unchanged. The controlled changed-only refresh passed **2/2** and changed exactly `pricing-desktop-chromium-win32.png` and `pricing-mobile-chromium-win32.png`; the other 22 PNGs stayed byte-identical. Accepted Pricing evidence is desktop **167815 bytes**, SHA-256 `6cadc650bc1e88608e822ad9dc1daf56fca9d995ce48484c088efc8dae54f437`, and mobile **102456 bytes**, SHA-256 `6cee3ef80384efad6d63dccaf42597cc14c401de9620218b9f6b81fe903c05ba`. Visual review confirmed only the neutral paused-checkout banner/state and the resulting downstream content shift, without clipping or unrelated visual change.

The fresh-build no-update parity confirmation passed **22/22 in 1.3m**, with post-run hashes stable **24/24**. The last-run receipt is passed and has no failed tests or failure artifacts. Its 22 inventories divide 11 per project and contain read-only external activity of **29 GET entries / 18 distinct sanitized descriptions**, zero mutation attempts, zero masks, two Clock receipts, and two Home receipts. The five checked application tables retained zero Browser-QA fixture rows before deletion. The temporary empty QA project was deleted and verified absent; the production project remains present and untouched, with no project identifiers, URLs, credentials, or secrets recorded here. Historically the two Pricing PNGs were source-absent additions/overlays under omit1/replace44/task5Add47/task6Add6/overlay86 and source1856/Task51902/final1908. PR #206 merged them into the current source. This receipt accepts only Task 4A source Pricing parity and makes no destination-parity claim.

Task 4A's full source QA exposed baseline blockers in the ordinary Browser-QA environment, authenticated fixture isolation, connected Admin-action rendering, carousel synchronization, homepage measurement readiness, and affected acceptance contracts. The preparation branch carried 33 additional source-present replacements and ten source-absent helpers/tests as exact overlays, plus the separate `tests/family-friends-server-workload.test.mjs` prepublication repair. PR #206 merged those reviewed bytes into `main`; Task 5 now exports them directly from `e74045c2fc85c2cb4df176fdb1aff2137c4d9848`. These changes alter no production or destination provider/DNS configuration, schema, migration, or rebrand behavior; the disclosed temporary empty QA-project lifecycle remains the sole historical provider mutation in the source gate.

## Accepted Task 4 MassageLab Source Baseline — 2026-09-08

This is the historical local source-gate receipt for old lock `fa78ca01a42179329cc223df77c76f308e76320b` plus its then-declared preparation overlays. Task 3 migration parity is committed as `ecd28af0`; the reviewed Task 4A source-QA hardening is committed as `a8fe56fd`. PR #206 later merged the complete reviewed tree as `e74045c2fc85c2cb4df176fdb1aff2137c4d9848`, which is now the immutable Phase 2 source. Neither receipt accepts or implies destination parity, deployment, production or destination provider/DNS configuration, or production database mutation. The only provider mutation in the historical gate is the disclosed, authorization-bound temporary empty QA-project lifecycle below.

### Setup, quality, builds, and Browser QA

| Check | Accepted result |
| --- | --- |
| Dependency and schema setup | `npm ci`, `npm run prisma:validate`, and `npm run prisma:generate` exited zero. The repository contains 46 committed migration directories. |
| Static quality | `npm run typecheck` and `npm run lint` exited zero. The only noted non-failing build/lint output is Babel's established large-file deoptimization note for `app/chimer/running-timer.tsx` over 500 KB; no new build warning is recorded. |
| Unit suite | 4,197 total; 4,194 passed; 0 failed; 3 intentional skips; 33.5251438 seconds. |
| Production build | Passed with 115 generated pages. |
| Browser-QA build | Passed with 115 generated pages. |
| Browser QA lane 1 | 144 discovered; 137 passed; 7 skipped; 0 failed; 0 retried. |
| Browser QA lane 2 | 218 discovered; 184 passed; 34 skipped; 0 failed; 0 retried. |
| Browser QA lane 3 | 194 discovered; 160 passed; 34 skipped; 0 failed; 0 retried. |
| Browser QA lane 4 | 200 discovered; 149 passed; 51 skipped; 0 failed; 0 retried. |
| PWA contract | Four rows passed across desktop and mobile Chromium: each project passed manifest/install metadata plus resolvable icons, and each passed service-worker registration/control with offline Chimer reload plus the Calendar offline fallback. No PWA row failed or retried. |
| Migration parity | A fresh Browser-QA build followed by a no-update comparison passed 22/22 in 1.3 minutes. Hashes stayed stable 24/24; the passed last-run receipt had no failed-test or failure artifact. All 22 activity inventories were present, 11 per project, with 29 read-only GET entries / 18 distinct sanitized descriptions, zero mutation attempts, zero masks, two Clock receipts, and two Home receipts. |

The temporary database used for the authenticated rows was a newly created empty Neon QA project, within the user's exact authorization. It received exactly the 46 committed migrations and no production data. Fixture cleanup left zero retained Browser-QA fixture rows in the five checked application tables; the temporary project was deleted and verified absent. The production project remained present and untouched. No project identifier, database URL, credential, fingerprint, row content, or secret is recorded.

### Route and production build artifact ledger

The final production measurement recorded 148 keys in `.next/server/app-paths-manifest.json`, 19,074,461 bytes under `.next/static`, and 11,806,033 bytes under `.next/server/app`. The manifest keys below are code-point sorted:

```text
/_global-error/page
/_not-found/page
/about/derrick/page
/about/page
/account/link-google/page
/account/page
/account/security/page
/admin/anatomy/media-review/page
/admin/anatomy/page
/admin/commerce/[orderId]/page
/admin/commerce/page
/admin/page
/admin/users/[userId]/page
/admin/users/page
/anatomime/join/page
/anatomime/page
/anatomime/play/[code]/page
/anatomy/corrections/page
/api/account/email-verification/request/route
/api/account/password-reset/confirm/route
/api/account/password-reset/request/route
/api/account/preferences/route
/api/account/profile/route
/api/account/register/route
/api/account/security/backup-codes/route
/api/account/security/google/link/confirm/route
/api/account/security/google/unlink/route
/api/account/security/password/disable/route
/api/account/security/password/route
/api/account/security/totp/disable/route
/api/account/security/totp/enable/route
/api/account/security/totp/setup/route
/api/account/templates/route
/api/admin/anatomy/media-flags/route
/api/anatomime/sessions/[code]/end/route
/api/anatomime/sessions/[code]/guess/route
/api/anatomime/sessions/[code]/host-election/route
/api/anatomime/sessions/[code]/host-judged/route
/api/anatomime/sessions/[code]/host/transfer/route
/api/anatomime/sessions/[code]/join/route
/api/anatomime/sessions/[code]/next-game/route
/api/anatomime/sessions/[code]/next-team/route
/api/anatomime/sessions/[code]/realtime-token/route
/api/anatomime/sessions/[code]/route
/api/anatomime/sessions/[code]/start/route
/api/anatomime/sessions/[code]/team/route
/api/anatomime/sessions/[code]/timeout/route
/api/anatomime/sessions/route
/api/atmosphere/stations/[stationId]/artwork/route
/api/auth/[...nextauth]/route
/api/auth/google/intent/route
/api/background-commerce/cart/route
/api/background-commerce/checkout/cancel/route
/api/background-commerce/checkout/route
/api/background-commerce/credits/redeem/route
/api/background-commerce/state/route
/api/billing/checkout/route
/api/billing/donation/route
/api/billing/membership-status/route
/api/billing/portal/route
/api/billing/webhook/route
/api/book/[practiceSlug]/sequence-options/route
/api/calendar/google/callback/route
/api/calendar/google/connect/route
/api/calendar/sidebar-context/route
/api/clients/invitations/route
/api/clinical/sync/route
/api/debug/sentry/route
/api/dev/atmoshaper-candidates/audio/[sourceId]/route
/api/dev/atmoshaper-candidates/derived/[batchOrOutputIdentity]/[outputIdentity]/route
/api/dev/atmoshaper-candidates/derived/[batchOrOutputIdentity]/route
/api/dev/atmoshaper-candidates/speech-reduction/[batchId]/[outputIdentity]/route
/api/education/flashcards/decks/[slug]/route
/api/education/flashcards/decks/route
/api/education/flashcards/progress/round/route
/api/education/flashcards/progress/route
/api/education/flashcards/prompts/route
/api/education/flashcards/sessions/[sessionId]/complete/route
/api/education/flashcards/sessions/route
/api/support/problem-report/route
/book/[practiceSlug]/[bookingSlug]/page
/book/[practiceSlug]/page
/browse/page
/calendar/availability/page
/calendar/booking/page
/calendar/new/appointment/page
/calendar/new/class/page
/calendar/new/page
/calendar/new/personal/page
/calendar/new/reminder/page
/calendar/page
/calendar/requests/page
/calendar/services/[serviceId]/page
/calendar/services/new/page
/calendar/services/page
/calendar/sync/page
/chimer/background-preview/[backgroundId]/page
/chimer/page
/clock/page
/dev/bgpreviews/page
/dev/buttons/page
/dev/candidates/concepts/page
/dev/candidates/construction/page
/dev/candidates/page
/dev/candidates/prepared/page
/dev/candidates/processing/page
/dev/candidates/recordings/page
/dev/clock/page
/dev/rsc-session-proof/page
/education/flashcards/decks/[slug]/page
/education/flashcards/decks/page
/education/flashcards/page
/education/page
/favicon.ico/route
/forgot-password/page
/help/page
/legal/[slug]/page
/legal/accept/page
/legal/page
/login/page
/manifest.webmanifest/route
/music/page
/notes/intake/page
/notes/journal/page
/notes/page
/notes/rom/page
/notes/soap/page
/onboarding/page
/page
/pricing/page
/register/page
/reset-password/page
/roadmap/page
/robots.txt/route
/settings/page
/sitemap.xml/route
/support/page
/tools/business-planner/add-on-profit/page
/tools/business-planner/break-even/page
/tools/business-planner/income/page
/tools/business-planner/launch-checklist/page
/tools/business-planner/page
/tools/business-planner/plan-outline/page
/tools/business-planner/service-menu/page
/tools/page
/verify-email/page
/wellness/breathing/page
/wellness/page
```

The ten largest JavaScript files under the measured production `.next/server/app` tree were:

| File | Bytes |
| --- | ---: |
| `.next/server/app/account/page_client-reference-manifest.js` | 383455 |
| `.next/server/app/admin/users/[userId]/page_client-reference-manifest.js` | 348824 |
| `.next/server/app/pricing/page_client-reference-manifest.js` | 332546 |
| `.next/server/app/dev/bgpreviews/page_client-reference-manifest.js` | 330643 |
| `.next/server/app/onboarding/page_client-reference-manifest.js` | 325019 |
| `.next/server/app/chimer/background-preview/[backgroundId]/page_client-reference-manifest.js` | 317786 |
| `.next/server/app/admin/commerce/[orderId]/page_client-reference-manifest.js` | 317570 |
| `.next/server/app/admin/commerce/page_client-reference-manifest.js` | 317540 |
| `.next/server/app/admin/page_client-reference-manifest.js` | 317513 |
| `.next/server/app/dev/buttons/page_client-reference-manifest.js` | 103653 |

### Local public-output ledger

The exact owned production server on localhost port 3010 returned HTTP 200 for every requested output and was stopped afterward. The root HTML is dynamically rendered, so its hash is a nonnormative same-run observation rather than a durable parity key.

| Path | Status | Content type | Bytes | SHA-256 | Normative use |
| --- | ---: | --- | ---: | --- | --- |
| `/` | 200 | `text/html` | 242331 | `9305714075b40e5f9434e0c2d52e45feef66ca361ce1ab94fe06fe7661d357ad` | Nonnormative dynamic receipt |
| `/manifest.webmanifest` | 200 | `application/manifest+json` | 703 | `dc428665e722fbe81f1240ad2fd6f0a8256bbca812f8c96e1144af63c641c2ae` | Source metadata baseline |
| `/robots.txt` | 200 | `text/plain` | 554 | `df9d029b2e1ce198ce143f22574fd82f7667fa150e6715b7bc1d1fd5a9cd1413` | Source metadata baseline |
| `/sitemap.xml` | 200 | `application/xml` | 4290 | `5ba6ff754a94e3e2a16a39eb3439b7ce6f0cda31fc83bc97eca181d2d303ebae` | Source metadata baseline |
| `/sw.js` | 200 | `application/javascript` | 5037 | `c47bb1b21c79a76bde8385f3a3d9d0afa8aac8ccb813987a65518e65c0f0c247` | Source service-worker baseline |

### Accepted migration-parity screenshots

These are the complete 24 accepted Windows PNGs after the reviewed Pricing-only Task 4A correction. The final no-update run left every byte and hash unchanged.

| PNG | Bytes | SHA-256 |
| --- | ---: | --- |
| `account-profile-desktop-chromium-win32.png` | 130305 | `d13936f708a17851088b2c5a20a281ff5c64e17da67a8bb3c33f8c2f699e4a08` |
| `account-profile-mobile-chromium-win32.png` | 58169 | `d93dfe8f511aac63eb21ea127aa9acbd5f5b871cfce3fa14fe4aa43fbd9d425b` |
| `account-security-desktop-chromium-win32.png` | 132115 | `f8d815d5a9090b6a78edeef6ca1aba1c51d35131f0afa3066da906a959311ec4` |
| `account-security-mobile-chromium-win32.png` | 65619 | `02bcbe425b7827e01c100bc953d2afb7f96592b38227c9e22f59b415e968773d` |
| `chimer-desktop-chromium-win32.png` | 111787 | `20632d5bc45f579a9797547960142f25344a8193d83aec0a0fb9775769ce61c1` |
| `chimer-mobile-chromium-win32.png` | 74047 | `d91c25c959464b71d0e9741c665375c04e5ebfe2c3cd57737e52bb5ed6a1eea2` |
| `clock-desktop-chromium-win32.png` | 652613 | `a74c0fc0583d423caf7e24a1a909a876336db7653ae6549ca2b975f0e60328e8` |
| `clock-mobile-chromium-win32.png` | 219632 | `34819a15f7b6407d1e635253567480add824dd2f4466409f45b61e0c63a6f198` |
| `education-desktop-chromium-win32.png` | 129741 | `36164f0af16b4b20716da04c8471a41f888abe9171327db35377c2cfc6a54e1b` |
| `education-mobile-chromium-win32.png` | 85445 | `f3359bfe6e17cfd565e5e637de8a61ee4128b693eb46bad8d480a5d078b005db` |
| `home-desktop-chromium-win32.png` | 307314 | `45f7a4b56ecd0495b9d7533800b91ec9a83aac8a6c6d2e9bf4e3689ab2fcd2cd` |
| `home-mobile-chromium-win32.png` | 158290 | `062d87f7402bab921a6b69a51c19751b53adf034e6057c6603a9dd17ee4955e9` |
| `music-desktop-chromium-win32.png` | 337278 | `c5e751d5b9222b7d0c67e39491d0b0dd29766be2778a6f69a4c9e614da509c0c` |
| `music-mobile-chromium-win32.png` | 167679 | `a38ef19093dcb9360a8fe9194f3f3d97f8154b30419afd4d5467049447e3bf34` |
| `notes-desktop-chromium-win32.png` | 215654 | `3f8ed1a1eb17561d50d367a4e006f7441155d63e1ecd4aa20d99aa64a6e14911` |
| `notes-mobile-chromium-win32.png` | 120602 | `5d7a826adf10a7d16e4d982740f36612e5cc55abbea101a7ced30cd123eb7773` |
| `pricing-desktop-chromium-win32.png` | 167815 | `6cadc650bc1e88608e822ad9dc1daf56fca9d995ce48484c088efc8dae54f437` |
| `pricing-mobile-chromium-win32.png` | 102456 | `6cee3ef80384efad6d63dccaf42597cc14c401de9620218b9f6b81fe903c05ba` |
| `support-desktop-chromium-win32.png` | 121806 | `54bc34fcfde448ba70d87fbdaf1bac14729e9798fb56ce0bf95de0b895eb3b28` |
| `support-mobile-chromium-win32.png` | 63199 | `401f376f790d12e56ec79e770255a2043341da5af33d409f1585ba949b5c1b92` |
| `tools-desktop-chromium-win32.png` | 151007 | `bbe2f76e010f852a0bff15fbff98fdf351749a210e0dfb7a70903774fa5b7b2f` |
| `tools-mobile-chromium-win32.png` | 109451 | `72af12857d87745ef2eac3707efbcd5d0dcc0b2903ce269ffb9b0b4bd97e79c0` |
| `wellness-desktop-chromium-win32.png` | 168180 | `f72bd5d7bf65d64bcf4b8e4b2a319bd576c34f8a768923066632bb7d161c5203` |
| `wellness-mobile-chromium-win32.png` | 108037 | `06ed9916bc7ae22250b2e77e7c7ce55b0c7b74d7a01fab9a028fd036c5da5828` |

### Redacted hosted source identity

- GitHub read-only inspection confirmed `dsbowersock/massagelab` is public, its default branch is `main`, and it is not archived. PR #206 merged as `e74045c2fc85c2cb4df176fdb1aff2137c4d9848`; its tree `0370e1d2749f9644efdc3ccbcb832c8d7965ec0d` exactly matches reviewed head `971c453ebb50127bb3ffd1d9f5e4f133dbf9df82`, and this exact merge is the selected source lock.
- Vercel CLI `59.11.7` read-only inspection confirmed project `massagelab`, framework Next.js, Node.js 22.x, and production domains `massagelab.app` and `www.massagelab.app`. No project, deployment, alias, domain, or environment setting changed.
- Neon evidence is limited to the authorization-bound temporary empty QA lifecycle described above and a read-only confirmation that production remained present. No production connection, row, schema, setting, or data was copied or changed. This entire hosted-source subsection is a historical Task 4R snapshot; its forward-looking Task 5 sentence below is superseded by the Task 7 and Task 9 receipts at the end of this inventory and is not current status.

The relocked exact difference contract is omit4/replace15/task5Add1/task6Add6/overlay10. With 1,905 locked source files, the computed Task 5 and final inventories remain 1,902 and 1,908 paths. MassageLab pull request [#206](https://github.com/dsbowersock/massagelab/pull/206) is merged; exact merge-head Code quality, Browser build, Browser QA lanes 1–4, aggregate `qa`, and CodeQL Actions/JavaScript/Python passed, and Vercel reported its automatic `main` deployment complete. The user authorized Phase 2 through Task 9 after this relock; Task 5 is the next gated action. Destination creation, deployment configuration, production or destination provider/DNS work, and production database mutation have not occurred in Task 4R. The disclosed temporary empty QA-project lifecycle is complete and does not broaden future authorization.

## Compatibility Map

This map owns one row per identity surface; detailed browser keys appear once in the [local-data register](atmoshaper-local-data-and-pwa-plan.md), provider sub-surfaces once in the [account checklist](atmoshaper-external-account-checklist.md), and hosts once in the [host matrix](atmoshaper-domain-cutover-plan.md).

| Public concept | Current public value | Future public value | Stable private identifiers | Owner | Phase |
| --- | --- | --- | --- | --- | --- |
| Platform | MassageLab | AtmoShaper | Current route names, API shapes, CSS `ml-` classes and internal module names | `lib/seo.js`, `app/layout.tsx`, `components/sidebar/app-sidebar-client.tsx` | Public copy Phase 6; canonical host Phase 10 |
| Audio mixer | AtmoShaper | Atmosphere / Atmosphere mixer | `atmoshaper` paths/types/scripts/catalogs/source IDs/releases; `lib/atmosphere/` runtime; existing storage schemas | `components/atmoshaper/`, `lib/atmoshaper/`, `data/atmoshaper/` | Label only Phase 6; internal identifiers retained |
| Established features | Chimer, Anatomime, Calendar, Notes, Wellness | Same | Routes, feature keys, fixture/test names | `app/`, `lib/membership.js` | Retain |
| Repository | dsbowersock/atmoshaper; bootstrap PR #1 merged | Same repository for future work | Locked MassageLab source/history and fresh-root provenance links | Charter, lineage, CI | Phase 3 complete; PR #2 in hosted review |
| Legal/operator | Derrick Bowersock, doing business as Massage Lab | Unchanged until separate legal approval | `LICENSE`, `UNLICENSED`, document keys/versions/effective dates/acceptances/audit records | `LICENSE`, `lib/legal-documents.js`, `lib/legal-acceptance.js` | Separately approved legal transition only |
| Access and data | Existing accounts and memberships | Same behavior | `premium_backgrounds`, other feature keys, Prisma tables/enums/migrations, durable audit/operation IDs | `lib/membership.js`, `prisma/schema.prisma`, `prisma/migrations/` | Dedicated future migration only |
| Environment/deployment | MassageLab service | Separate AtmoShaper staging later | `MASSAGELAB_` variables, auth/security keys, source deployment rollback identity | `.env.example`, `next.config.mjs`, deployment wiki | Isolated Phase 7; authorized provider work Phase 9/10 |
| Authentication | Current Auth.js / Google sign-in | Same methods on approved new origin | Cookie/binding namespaces, account/provider mappings, TOTP encryption and recovery contracts | `auth.ts`, auth/security owners; local-data register | Phase 8/9 domain proof; no token transport |
| Google Calendar | MassageLab calendar | Display change undecided | `GOOGLE`, `MASSAGELAB_GOOGLE_CALENDAR_SUMMARY`, provider calendar/event mappings | `lib/calendar-sync-constants.ts`, `lib/google-calendar-adapter.ts` | Phase 9 explicit compatibility plan |
| Payments | MassageLab Supporter / One-time support / backgrounds | Display copy undecided | Stripe catalog/metadata/idempotency families and legacy Price mappings in account checklist | `lib/stripe-billing.js`, `lib/stripe-price-contract.js`, `lib/stripe-webhook-contract.js` | Separate Phase 9/10 authorization |
| Media | Existing public media/artwork | Same content initially | R2 buckets, immutable object prefixes/hashes/catalog IDs, `massage-lab-*` background IDs | Media manifests, `lib/background-options.js`, audio wiki | Retain; separate media migration only |
| Support/mail | Existing public support address and SMTP display identity | Undecided | Current support delivery and sender/authentication contracts | `lib/support-contact.js`, deployment wiki | Phase 9 approval; do not retire old support |
| Local records, preferences and PWA | Existing origin-bound browser data/install | New installation with user-controlled recovery | All keys/formats/cache names in local-data register | Vault/storage/SW/manifest owners | Phase 8 proof, Phase 10 recovery gate |

## Historical Bootstrap Exact Destination Difference Contract

The following JSON is the same ordered path contract as [the machine-readable manifest](atmoshaper-export-manifest.json). Paths are normalized files, not globs. Arrays are code-point sorted and duplicate-free. The relocked source contains 1,905 paths. Four source paths are omitted, 15 source-present paths are declared replacements, `MIGRATION_LINEAGE.md` is the only source-absent Task 5 addition, six Task 6 audit paths remain source-absent, and ten relock-branch documents are overlays.

`Task5Paths = (SourcePaths - omitPaths) union task5AddPaths` gives `1,905 - 4 + 1 =` **1,902** paths.
`FinalPaths = Task5Paths union task6AddPaths` gives `1,902 + 6 =` **1,908** paths.
The source tree contains **1,905** files / **41,591,234** blob bytes. The retained source set contains **1,901** files / **41,575,161** original blob bytes before replacements/additions. Task 6 additions must remain absent until Task 6. All other source blobs must match exactly; a declared replacement is not permission to change arbitrary contents.

The original historical artifact remains omitted. The three `docs/aegis/work/2026-09-06-atmoshaper-repository-migration-execution/` records were added by PR #206 solely to preserve MassageLab execution governance and now join the omission set: they remain in MassageLab history and current source evidence, while the destination receives fresh authority and lineage rather than inheriting an old-repository work checkpoint.

```json
{
  "schemaVersion": 1,
  "sourceRepository": "dsbowersock/massagelab",
  "sourceCommit": "e74045c2fc85c2cb4df176fdb1aff2137c4d9848",
  "omitPaths": [
    ".agents/refactor/2026-06-21-refactor-anatomime-session-wrapper.md",
    "docs/aegis/work/2026-09-06-atmoshaper-repository-migration-execution/10-intent.md",
    "docs/aegis/work/2026-09-06-atmoshaper-repository-migration-execution/20-checkpoint.md",
    "docs/aegis/work/2026-09-06-atmoshaper-repository-migration-execution/90-evidence.md"
  ],
  "replacePaths": [
    "AGENTS.md",
    "README.md",
    "docs/project-log.md",
    "docs/project-state.md",
    "docs/rebrand/atmoshaper-cleanup-register.md",
    "docs/rebrand/atmoshaper-domain-cutover-plan.md",
    "docs/rebrand/atmoshaper-export-manifest.json",
    "docs/rebrand/atmoshaper-external-account-checklist.md",
    "docs/rebrand/atmoshaper-local-data-and-pwa-plan.md",
    "docs/rebrand/atmoshaper-migration-charter.md",
    "docs/rebrand/atmoshaper-refactor-register.md",
    "docs/rebrand/atmoshaper-reference-inventory.md",
    "docs/rebrand/atmoshaper-rollback-plan.md",
    "docs/superpowers/plans/2026-09-06-atmoshaper-repository-migration.md",
    "package.json"
  ],
  "task5AddPaths": [
    "MIGRATION_LINEAGE.md"
  ],
  "task6AddPaths": [
    "scripts/repository-audit/brand-reference-baseline.json",
    "scripts/repository-audit/brand.mjs",
    "scripts/repository-audit/core.mjs",
    "scripts/repository-audit/inventory.mjs",
    "scripts/repository-audit/policy.json",
    "tests/repository-audit.test.mjs"
  ],
  "overlayPaths": [
    "docs/rebrand/atmoshaper-cleanup-register.md",
    "docs/rebrand/atmoshaper-domain-cutover-plan.md",
    "docs/rebrand/atmoshaper-export-manifest.json",
    "docs/rebrand/atmoshaper-external-account-checklist.md",
    "docs/rebrand/atmoshaper-local-data-and-pwa-plan.md",
    "docs/rebrand/atmoshaper-migration-charter.md",
    "docs/rebrand/atmoshaper-refactor-register.md",
    "docs/rebrand/atmoshaper-reference-inventory.md",
    "docs/rebrand/atmoshaper-rollback-plan.md",
    "docs/superpowers/plans/2026-09-06-atmoshaper-repository-migration.md"
  ]
}
```

## Reproduction and Verification

For any pre-export/current-lock decision, first run Task 5 Step 1 of the [bootstrap plan](../superpowers/plans/2026-09-06-atmoshaper-repository-migration.md#task-5-materialize-the-classified-source-snapshot-in-a-fresh-sibling-repository); its clean committed-relock, manifest, tracked/live `main`, and ancestry gate is canonical. After that gate passes, reproduce this historical inventory from the old repository using only the manifest source, never the current overlay tree or the potentially stale local `main` branch pointer:

```powershell
$manifest = Get-Content -LiteralPath 'docs/rebrand/atmoshaper-export-manifest.json' -Raw | ConvertFrom-Json
$sourceSha = $manifest.sourceCommit
if ($sourceSha -cne 'e74045c2fc85c2cb4df176fdb1aff2137c4d9848') { throw 'Inventory source differs from the reviewed manifest contract' }
git ls-tree -r --name-only $sourceSha
git ls-tree -r -l $sourceSha
# For each candidate path from the eleven candidate groups:
# $candidate is the exact source path; $basename is its final path component.
git grep -l -I -F -e $candidate -e $basename $sourceSha -- . ':(exclude).env*'
# Inspect content and folder/dynamic consumers before any omission.
git show "${sourceSha}:.agents/refactor/2026-06-21-refactor-anatomime-session-wrapper.md"
git grep -n -I -F '.agents/refactor' $sourceSha -- app components lib hooks tests scripts .github package.json
```

Exclude the candidate's own path from reference counts; classify the remaining owner paths, not captured line contents. `git grep` exit 1 means no match and is not a tool failure. Do not read or print private environment files. Source tree inspection found 46 `prisma/migrations/*/migration.sql` files; this is a committed-file count, not a new database query.

Task 2 checks JSON/Markdown equality, normalized sorted unique arrays, source-present omit/replace sets, source-absent/disjoint task add sets, overlay coverage, exact count equations, all 41 top-level partitions, direct retained dependencies and the omission proof. Source/destination install/build/browser/provider receipts remain Task 3/4/7 obligations.

The Task 4R paragraph above is a historical source-baseline boundary: its Task 5 next-action and uncreated-destination statements are superseded by the Task 7 and Task 9 receipts that follow. They are not current repository status.

## Accepted Task 7 Destination Baseline — 2026-09-09 (Historical Prepublication Snapshot)

### Fresh-root and inventory identity

- Locked source: `e74045c2fc85c2cb4df176fdb1aff2137c4d9848`.
- Initial destination commit: `7e89f7ba9508a1ad715c1824ea6099432e6a4ccd`; tree `e9a97bbe519a1cc52c7225eb600fd5d2473f6ded`.
- Fresh-history proof: one root; the parent record contains only that root SHA; post-commit status was clean.
- Exact committed inventory before this Task 8 documentation branch: 1,908 paths, 46,865,680 blob bytes, aggregate SHA-256 `1d537a03b8a0294f1e68f56df718c29b5e5cf4bfedac01de7ae1cceb86aa3604`.
- Difference contract: four omissions, 15 source-present replacements, one Task 5 source-absent addition, six Task 6 source-absent additions, and ten reviewed overlays.

Seven retained source preview assets—six WebM renditions and their index—matched destination ignore rules and therefore required explicit force-staging. They remain source-owned blobs and do not change the 1,908-path equation or count as destination additions. This corrects the Task 5 staging procedure without changing its file-classification contract.

### Audit implementation corrections

Task 6 made classification occurrence-scoped: a compatibility-shaped identifier classifies its matched occurrence rather than every reference on the surrounding line. Candidate-baseline generation was also corrected to retain the established schema key order and end with exactly one newline. The focused audit suite passed 21/21.

The accepted audit reported 26,350 active references: 22,905 compatibility, 1,451 historical, 42 legal, 1,952 pre-rebrand public copy, and zero missing or unclassified. Runtime surfaces do not import repository-audit tooling.

The Task 7 candidate also aligned fresh-authority documentation tests and stabilized only the password endpoint's mocked response allowance at 1,500 ms; the profile and Google-intent timings were not changed. The plan's global staged whitespace command identified 24 inherited paths whose bytes match the locked source. Those preserved blobs were not rewritten; the scope-correct check for destination-authored changes passed.

### Local, Browser QA, and visual verification

| Check | Destination result |
| --- | --- |
| Dependency/schema | Installation, Prisma validation, and Prisma generation exited zero. Installation reported three inherited high-severity advisories; no automated fix was applied. |
| TypeScript/lint | Both exited zero. |
| Unit suite | 4,219 total; 4,216 passed; 3 skipped; 0 failed. |
| Production build | Passed with 115 generated pages. |
| Browser-QA build | Passed with 115 generated pages. |
| Browser QA lane 1 | 137 passed; 7 skipped. |
| Browser QA lane 2 | 184 passed; 34 skipped. |
| Browser QA lane 3 | 160 passed; 34 skipped. |
| Browser QA lane 4 | 149 passed; 51 skipped. |
| Migration parity | Final fresh run passed 22/22 with no snapshot update; all 24 accepted PNGs remained byte-identical to the locked source. |

The destination app-paths manifest contained 148 keys, matching the source count. `.next/server/app` measured 11,806,033 bytes and matched the source aggregate exactly. `.next/static` measured 19,074,513 bytes, 52 bytes above the source ledger's 19,074,461 bytes because fresh-build artifact identities differ. This receipt does not claim per-file bundle equality.

The owned local server reproduced the four normative source outputs exactly:

| Path | Status | Content type | Bytes | SHA-256 |
| --- | ---: | --- | ---: | --- |
| `/manifest.webmanifest` | 200 | `application/manifest+json` | 703 | `dc428665e722fbe81f1240ad2fd6f0a8256bbca812f8c96e1144af63c641c2ae` |
| `/robots.txt` | 200 | `text/plain` | 554 | `df9d029b2e1ce198ce143f22574fd82f7667fa150e6715b7bc1d1fd5a9cd1413` |
| `/sitemap.xml` | 200 | `application/xml` | 4290 | `5ba6ff754a94e3e2a16a39eb3439b7ce6f0cda31fc83bc97eca181d2d303ebae` |
| `/sw.js` | 200 | `application/javascript` | 5037 | `c47bb1b21c79a76bde8385f3a3d9d0afa8aac8ccb813987a65518e65c0f0c247` |

The dynamic root HTML returned HTTP 200 at 239,647 bytes; consistent with the source ledger's rule, its same-run hash is nonnormative and is not used as a parity key. The owned server was stopped and port 3010 had zero listeners.

The first complete run reached all ordinary lanes but had one desktop Home readiness failure during parity. Independent comparison found the Home implementation and all accepted snapshots byte-identical to the locked source, with no candidate edit owning that route. The focused desktop row then passed 1/1, and a new complete disposable-project cycle passed 22/22. No application or snapshot change was made in response to the transient failure.

### Disposable QA database receipt and future lifecycle

The accepted cycle created a new independent empty QA project, passed the non-production identity and fingerprint gates, applied the repository's exact 46/46 committed migrations, and ran the authenticated browser rows. Read-only cleanup verification found every one of the 134 application tables empty. The project was deleted and verified absent; the one unrelated pre-existing project remained present. Failed or superseded cycle-owned projects were likewise deleted and proven absent. No production rows were supplied, copied, read, or altered, and no connection value, credential, fingerprint, project identifier, or row content is recorded.

Ordinary authenticated private browser rows require this authorized empty QA target; they cannot reproduce the accepted source counts without it. Exact migration-parity execution also retains the repository-configured `workers=1`; an ad hoc concurrency override is not valid acceptance evidence. Future cycles must create a new independent empty project, pass identity and fingerprint gates, apply only committed migrations, run the required rows, prove all application tables empty, delete every cycle-owned project in outer cleanup, and prove post-delete absence.

### Hosted and mutation boundary

At this Task 7 snapshot, the local root had no Git remote and Task 9 had not started. Apart from the authorized disposable QA projects that were deleted and proved absent, no persistent destination deployment, environment, provider configuration, alias, domain, DNS, payment, email, media, production database, runtime rebrand, or legal setting was created or changed. Existing legal owners and stable compatibility identifiers remained unchanged. The Task 9 receipt below supersedes this prepublication timing; Phase 3 remains separately gated.

## Task 9 Publication and Phase 1–2 Completion Receipt — 2026-09-09 (Historical Pre-merge Snapshot)

This receipt preserves publication-time facts. Its open-PR, uncreated-Phase-3-branch, and no-cleanup statements are superseded by the current Phase 3 update above; its exact-head checks and provider observations remain dated evidence.

### Repository, commits, pull request, and hosted checks

- Public repository: [`https://github.com/dsbowersock/atmoshaper`](https://github.com/dsbowersock/atmoshaper); visibility public; default branch `main`; no tags.
- Initial `main`: sole root `7e89f7ba9508a1ad715c1824ea6099432e6a4ccd`, tree `e9a97bbe519a1cc52c7225eb600fd5d2473f6ded`. Complete pre-bootstrap Git history remains intact in the historical source repository identified at the top of this inventory, at locked source `e74045c2fc85c2cb4df176fdb1aff2137c4d9848`.
- Task 8 receipt commit: `953e04c680d497851cdb6b6533b92de8f9b1c4f2`. Test-only correction commit: `23f5b8654a89c83de4ae3c6454996e9f7bc6b283`, which advanced the project-state verification-date upper bound to 2026-09-09 after the first hosted Code quality run exposed the stale 2026-09-08 ceiling.
- [PR #1](https://github.com/dsbowersock/atmoshaper/pull/1) is open and unmerged from `codex/bootstrap-atmoshaper` into `main`.
- At exact `23f5b8654a89c83de4ae3c6454996e9f7bc6b283`, the focused test passed 15/15 and the full local suite passed 4,216 with 3 skips and 0 failures. Hosted run `34325535135` passed Code quality in 4m11s, Browser build in 2m26s, Browser QA lanes 1–4 in 12m24s, 11m15s, 17m56s, and 12m59s, and aggregate `qa` in 3s.
- CodeQL, Vercel, and CodeRabbit did not appear or run in the new repository and remain later setup findings, not passed checks. Codex GitHub review completed only on `953e04c680d497851cdb6b6533b92de8f9b1c4f2`. A later head, including the receipt-only documentation head produced from this correction, requires its own hosted pass and exact-head review assessment.

### Completion-report cross-check

- Copied/difference scope: the locked source contains 1,905 paths. The destination's initial 1,908 paths are explained by four exact omissions, 15 source-present replacements, one Task 5 source-absent addition, six Task 6 source-absent audit additions, and ten reviewed overlays. All other source blobs were retained; unresolved cleanup candidates remain in the destination rather than being silently omitted.
- Verification and parity: source and destination install, Prisma, typecheck, lint, unit, production-build, Browser-QA-build, four ordinary Browser QA lanes, and migration-parity receipts are recorded above. Destination unit acceptance was 4,216 passed, 3 skipped, 0 failed; both builds produced 115 pages; parity passed 22/22 with all 24 PNGs byte-identical. The 148 route keys matched; server-app aggregate bytes matched; static aggregate bytes differed by 52 because fresh-build artifact identities differ, so per-file bundle equality is not claimed.
- Metadata/PWA/storage/export/legal/compatibility: the web manifest, robots, sitemap, and service worker matched the source ledger. Origin-bound PWA installation and browser storage do not transfer automatically. User-controlled export formats, legal operator and accepted-document history, stable private identifiers, provider contracts, old-origin recovery, and local-first PHI boundaries remain unchanged and require their separately owned later gates.
- External dependencies inventoried for later work include GitHub; Vercel; Namecheap/DNS and both current production hosts; Neon; Google OAuth/Auth.js callbacks and Google Calendar; Resend/SMTP, SPF/DKIM/DMARC, and support email/forwarding; Stripe business, Checkout, Portal, catalog, webhook, metadata, and idempotency surfaces; Cloudflare R2/media/CORS/cache; Sentry; search/sitemap; social identity; and PWA/app-store identity. Inventory is not authorization to configure or mutate any of them.
- Highest-risk cleanup areas are retained compatibility wrappers/models, origin-bound browser data and caches, dependencies/patches, and assets/media/catalogs where deletion could break data, build, provenance, or recovery contracts. No cleanup is approved. The highest-value refactor candidate is a focused public-product-identity boundary that centralizes display identity while explicitly excluding legal and private compatibility identifiers; provider/trusted-origin, Stripe, Chimer, and music-provider work remains higher risk and separately gated.
- External actions were creation of the public GitHub repository, publication of `main` and `codex/bootstrap-atmoshaper` (including the test-only correction), opening the unmerged bootstrap PR, the recorded hosted CI runs, and the Codex GitHub review on the earlier receipt head. This receipt correction added no PR comment or internal note. No tag, merge, deployment, provider configuration, DNS/domain, production database, email, payment, media, runtime rebrand, legal cutover, or Phase 3 action occurred.

Every future Browser QA acceptance cycle must create a new independent empty QA project, pass the non-production identity and fingerprint gates, apply exactly the 46 committed migrations, prove all application tables empty after cleanup, delete every cycle-owned project, and prove post-delete absence. Production data must never be supplied, copied, read, or altered.

Phase 1–2 bootstrap work is published for review and stops here. The recommended next branch is `codex/atmoshaper-docs-consolidation`, but Phase 3 planning and execution are future work requiring separate review and authorization; the branch has not been created and consolidation has not begun.

## Historical Phase 4 Task 5 Audit Capture — 2026-09-10

PR #2 merged as `7c07e4578307508ae2bdb784c4d7ad0d9fb64c65`; the Phase 4 branch began from that exact merge. Audit implementation reached `656394639464601c6e8b0833389c8272a95c2a95`, and Task 5 ran each report twice against that unchanged committed index. The table below is the bounded Task 5 capture and is superseded by the later repair-cycle summary.

| Lane | Bounded result | Report SHA-256 | Status |
| --- | --- | --- | --- |
| Dead code | 29 zero-incoming static-reference candidates; 16 protected items; 186 uncertainty records | `76915575657c0c0687c653986a83cd0fb709f8b7b487690897f796e17a7d0e80` | `candidate`, `protected`, or `unresolved` |
| Dependency | 8 declaration candidates; 141 referenced packages; 19 uncertainty records | `5514fcaafd38f8360d93a485ecadb0f3a5045cf3aaef6799450f34d846cd0a9c` | `candidate` or `unresolved` |
| Asset | 73 tracked and protected assets; zero unreferenced candidates; 2,001 uncertainty records | `cf1a17d1f42f9c9ca53346437945f73c6aef9eba1a47da8205b4c809cc242725` | `protected` or `unresolved` |
| Environment | 79 declared keys, 329 static reads, 234 missing-declaration findings, 44 unread-declaration candidates, and 13 computed-read uncertainties | `ed6a4009cd3e545504c4b4ff61a08543934f02a063f1bf5429aa7fe640dddc93` | `unresolved` |

The [Phase 4 cleanup register](atmoshaper-cleanup-register.md#phase-4-audit-only-evidence--2026-09-10) records classification and scope totals plus the corroboration needed before any later bounded cleanup proposal. The [Aegis evidence](../aegis/work/2026-09-10-atmoshaper-phase4-audit-only/90-evidence.md) records commands, report/evidence hashes, deterministic-repeat proof, inventory fixed-point proof, and brand-baseline reconciliation.

Deletion authority is none. Every candidate remains in the repository. No report establishes runtime unreachability, safe dependency removal, asset ownership or provenance clearance, environment-key retirement, data/PWA compatibility, provider-object deletion, or rollback sufficiency by itself. At this historical capture, Task 6 verification and review remained next; Phase 5 and every external mutation remained separately gated.

### Historical final-review repair — first fully staged 59/59 capture

The preceding Task 5 table is a historical capture whose old envelope and hashes
are superseded for current tooling. Before receipt-only documentation
synchronization, the first fully staged repair capture contained 1,921 files and
47,170,491 Git blob bytes. Its repaired CLIs share the exact seven-field report
contract and inventory SHA-256
`4d826fc678cbb9303eb43805ece57978f1910d958b69cd65038c037f4a8bf827`.
Each silent CLI passed twice with byte-identical output and empty standard error.
The first-capture report SHA-256 values are dead code
`ac5f292e82da5134f29b0c0c24e01cfdcaaa06f62625c62f8aafc71bb083da6c`,
dependency `8c0ad3e2d171a549cea55d89548175d654b0b41e4d913ea7448fb714ad45c884`,
asset `d3b0fe054db44c73f7b42f84ea0d0a38270228c7a01677411e3cfddd4f92f7f4`,
and environment `b1b7db47add403da40156606065fd0bacb185d2bcc3cc5dbf0bd13a7948207db`.

Bounded counts remain 29 dead-code candidates, 8 dependency candidates, zero
asset candidates and 25 unread environment candidates. The added audit modules
raise staged graph totals to 21 protected modules, 836 referenced modules and
672 roots. The asset lane records 2,002 uncertainties: 526 dynamic and 1,476
unresolved literals. One intentionally broken module under both protected-prefix
and test-fixture policy is a named uncertainty; the staged repository has zero
unresolved literal-module errors. Proven environment aliases produce 369 static
reads, while 169 unproven aliases remain explicit uncertainties rather than
removal evidence. The focused staged suite passed 59/59.

The [cleanup register](atmoshaper-cleanup-register.md#historical-final-review-repair-receipt--first-staged-capture-superseded)
and [Aegis evidence](../aegis/work/2026-09-10-atmoshaper-phase4-audit-only/90-evidence.md#historical-final-review-repair-receipt--first-staged-capture-superseded)
record the first staged capture's hashes, counts and validation receipts. Brand verification remains
at zero missing and zero unclassified occurrences with the same category totals
and 5,984,749-byte fixed point. All candidates and later corroboration requirements
remain unchanged. Deletion authority is none. These hashes are not an immutable
final commit-candidate identity because the synchronized versioned receipts
change their own index. Final receipt-document staging and one exact final-index
readback remain; the resulting hashes will be retained in the ignored SDD
handoff and user-facing completion receipt rather than embedded back into the
self-hashed index. At this historical capture, repeat independent whole-branch
reviews and the coordinator-owned commit still remained.

### Current Phase 4 closeout

The subsequent pre-publication final repair cycle supersedes the 59/59 capture
for current-tooling decisions. Repair validation first confirmed three failing
regression cases and then 3/3 passing after their fixes; strict TDD remained off
under the governing intent and plan. The combined focused suite passed 64/64.
Hosted review round 1 then corrected environment evidence so assignment and delete
targets no longer count as reads; its focused slice passed 7/7, and the current combined
focused audit suites passed 68/68. That round's semantic totals were dead code 1,558
findings/186 uncertainties, dependency 2,859/19, asset
340/2,002, and environment 612/178: 79 declared keys, 202 missing declarations,
306 static reads and 25 unread findings; 9 computed reads and 169 unproven-alias
uncertainties. Before publication, the full suite passed 4,259 tests with 3
host-dependent skips and zero failures, and the 115-route production build passed.

Hosted review round 2 added config-alias, whole-object/computed environment, and
browser-snapshot coverage. Its focused repository audit suites passed 74/74.
Its historical semantic totals were dead code 1,558 findings/186 uncertainties,
dependency 2,859/19, asset 388/2,003, and environment 587/191. Round 2's
historical pre-document receipt-synchronization snapshot measured 47,216,441 Git
blob bytes.

Hosted review round 3 added separately labeled exact declaration-companion/type
evidence, two exact configuration/manifest dependency owners, and owner-relative
bare asset paths that become exact only when tracked and in inventory and
otherwise remain hash-only uncertainty. That round's focused repository audit
suites passed 80/80. Its now-historical semantic totals were dead code 1,558/186 with 842
referenced modules and 23 candidates; dependency 2,861/19 with 2 configuration
owners and 6 candidates; asset 390/11,384 with 97 tracked assets, 97 protected
items, 177 exact owners, zero candidates, 529 dynamic rows and 10,855 unresolved
rows; and environment 587/191.

Hosted review round 4 moved exact configuration ownership into the validated
stage-0 policy and conservatively covered direct, aliased, wrapped, logical and
conditional whole-environment forwarding without changing asset semantics. The
focused repository audit suites passed 83/83: 21 repository-audit tests and 62
cleanup-audit tests. Its now-historical semantic totals were dead code 1,558/186 with
842 referenced modules and 23 candidates; dependency 2,861/19 with 2
configuration owners and 6 candidates; asset 390/11,384 with 97 tracked assets,
97 protected items, 177 exact owners, zero candidates, 529 dynamic rows and
10,855 unresolved rows; and environment 587/250 with 77 computed and 173
unproven-alias uncertainties and zero unread-declaration candidates.

Hosted review round 5 recognized runtime named `env` imports from the exact
`node:process` and `process` modules and preserved their evidence through
lexical loop/catch shadowing and function-scoped `var` behavior, including
assignment-free redeclarations. It also repaired the two historical receipt
anchors above. That round's focused repository audit suites passed 86/86: 21
repository-audit tests and 65 cleanup-audit tests. Its now-historical semantic totals were
dead code 1,558/186 with 842 referenced modules and 23 candidates; dependency
2,861/19 with 2 configuration owners and 6 candidates; asset 390/11,384 with 97
tracked assets, 97 protected items, 177 exact owners, zero candidates, 529
dynamic rows and 10,855 unresolved rows; and environment 587/252 with 79
computed and 173 unproven-alias uncertainties and zero unread-declaration
candidates.

Hosted review round 6 recorded nested object destructuring defaults sourced
from proven environment objects. That round's focused repository audit suites
passed 87/87: 21 repository-audit tests and 66 cleanup-audit tests. Its now-historical
semantic results were dead code 1,558/186 with 842 referenced modules and 23
candidates; dependency 2,861/19 with 2 configuration owners and 6 candidates;
asset 390/11,384 with 97 tracked assets, 97 protected items, 177 exact owners,
zero candidates, 529 dynamic rows and 10,855 unresolved rows; and environment
587/252 with 79 computed and 173 unproven-alias uncertainties and zero
unread-declaration candidates.

At the verified round-6 staged code snapshot, the full suite passed 4,282
tests with 3 host-dependent skips and zero failures; typecheck and lint
passed.

Hosted review round 7 recorded exact tracked runtime package metadata
ownership, keeping `@generative-music/pieces-alex-bainter` out of unreferenced
candidates without claiming an executable import. The generic parser required
exact declared package names and versions and conservatively handled lexical
shadows, duplicate or overridden properties, and spreads. That round's focused repository audit suites passed 88/88: 21 repository-audit tests and 67
cleanup-audit tests. Its now-historical semantic results were dead code 1,558/186 with 842
referenced modules and 23 candidates; dependency 2,863/19 with 2 configuration
owners, 1 runtime-package-metadata owner, 144 referenced packages and 5
candidates; asset 390/11,384 with 97 tracked assets, 97 protected items, 177
exact owners, zero candidates, 529 dynamic rows and 10,855 unresolved rows;
and environment 587/252 with 79 computed and 173 unproven-alias uncertainties
and zero unread-declaration candidates.

Round-7 verification passed: the full suite recorded 4,283 passed, 3
host-dependent skips and zero failures; typecheck passed; lint passed with no
ESLint warnings; and the production build passed with 115 routes. The build's
Babel deoptimization note was informational, not a lint warning. Earlier
round-6 results remain historical supporting evidence.

Hosted review round 8 added `data/` to the asset inventory and explicitly
protected it as a conservative retained catalog/provenance boundary. Duplicate
dependency declarations preserved all exact string versions across
declaration sections for runtime metadata matching, without claiming an
executable import. That round's focused repository audit suites passed 91/91: 21
repository-audit tests and 70 cleanup-audit tests. Its now-historical semantic
results were dead code 1,558/186 with 842 referenced modules and 23 candidates;
dependency 2,863/19 with 2 configuration owners, 1 runtime-package-metadata
owner, 144 referenced packages and 5 candidates; asset 561/11,302 with 137
tracked assets, 137 protected items, 262 reference owners, 25 basename
signals, zero candidates, 529 dynamic rows and 10,773 unresolved rows; and
environment 587/252 with 79 computed and 173 unproven-alias uncertainties and
zero unread-declaration candidates.

At the verified round-8 staged snapshot, the full suite recorded 4,289 tests:
4,286 passed, 3 host-dependent skips and zero failures. Typecheck passed; lint
passed with no ESLint warnings; and the production build passed with 115
routes. The Babel deoptimization note was informational, not a lint warning.
All four audit CLIs ran twice with byte-identical output, zero stderr and
`deletionAuthority: false`.

Hosted review round 9 made global and exact imported process-object
recognition scope-aware. Lexical/TDZ, `var`, function, class, catch, loop,
module and static-block shadows no longer imply environment ownership.
Parameter defaults were evaluated separately from body bindings, and
namespace `ImportEquals` declarations shadowed outer process objects. The
import classifier was consolidated; the environment analyzer contained 482
nonblank lines. These repairs changed no real-repository audit counts.
That round's focused repository audit suites passed 95/95: 21 repository-audit
tests and 74 cleanup-audit tests. Its now-historical semantic results were dead code
1,558 findings/186 uncertainties; dependency 2,863/19; asset 561/11,302;
and environment 587/252: 306 static reads, 79 declared names, 202 missing
declarations, zero unread-declaration candidates, 79 computed uncertainties
and 173 unproven-alias uncertainties.

At the verified round-9 staged code snapshot, the full suite recorded 4,293
tests: 4,290 passed, 3 host-dependent skips and zero failures. Typecheck
passed; lint passed with no ESLint warnings; and the production build passed
with 115 routes. Rounds 7 and 8 remain historical supporting evidence.
Every report retains `deletionAuthority: false`.

Hosted review round 10 repaired two validated latest-head findings: outer
proven/unknown environment aliases leaking across inner declarations, and
non-Node runtime imports locally named `env` or `environment` disappearing
from the evidence. Inner declarations shadowed outer aliases without
discarding existing same-scope bindings on assignment-free `var`
redeclarations. Non-Node wrapper imports remain unproven-alias uncertainty,
not exact environment ownership; exact Node imports and type-only exclusions
remain distinct. The regression repair followed TDD RED/GREEN validation.
The environment analyzer contained 490 nonblank lines.

That round's focused repository audit suites passed 97/97: 21 repository-audit
tests and 76 cleanup-audit tests. At the verified round-10 code snapshot, the
full suite recorded 4,295 tests: 4,292 passed, 3 host-dependent skips and zero
failures. Typecheck and lint passed; the Babel deoptimization note was
informational, not an ESLint warning. The exact environment audit ran twice
with byte-identical output, zero stderr and `deletionAuthority: false`.
Its now-historical totals remained unchanged at 587 findings/252 uncertainties:
306 static reads, 79 declared names, 202 missing declarations, zero
unread-declaration candidates, 79 computed uncertainties and 173
unproven-alias uncertainties. Round-9 verification remains historical
supporting evidence, including its production-build receipt.

At that snapshot, latest-head hosted review was pending; resolving hosted feedback and final
checks/review precede any separately authorized merge. No cleanup deletion,
provider mutation or Phase 5 action occurred; `deletionAuthority` remains
false.

Hosted review round 11 recorded the staged CodeRabbit/Codex privacy and
opaque-tool hardening. Nested `.secrets/` and `secrets/` directories were
rejected at any depth before policy, metadata or evidence blob reads. The
tracked Python adapter was represented exactly once as an opaque manual-tool
uncertainty without parsing its content; this does not claim a static import
or authorize removal.

That round's focused repository audit suites passed 98/98. The full suite
recorded 4,296 tests: 4,293 passed, 3 host-dependent skips and zero failures.
Typecheck and lint passed. Its now-historical semantic results were dead code 1,558
findings/187 uncertainties, including 2 manual-script uncertainties;
dependency 2,863/19; asset 561/11,303; and environment 587/252. All four
audits ran twice with byte-identical output, exit 0 and empty stderr;
every report retained `deletionAuthority: false`. Brand verification reported
zero missing and zero unclassified references, and the inventory reported
zero forbidden tracked paths.

The exact staged capture before this round's documentation synchronization
contained 1,921 files and 47,355,254 Git blob bytes, with inventory SHA-256
`bb8b8c792c03a60bd5531e69e4f6c81d95781851b751c8b9a5824700036ded92`.
This is a historical pre-document-synchronization capture, not the identity
of the index after these versioned receipts are staged. Current final-index
bytes and hashes remain outside these self-referential versioned documents.
Round-10 results remain historical supporting evidence.

At that snapshot, latest-head hosted review and final checks/review were pending before any
separately authorized merge of PR #3. No cleanup deletion, provider mutation
or Phase 5 action occurred; `deletionAuthority` remains false.

Hosted review round 12 repairs two validated latest-head Codex findings:
tracked credential/secret basename files could bypass privacy protection
under non-JSON extensions, and 22 CSS files were absent from cleanup
candidate/uncertainty coverage. Exact or dotted `credential`, `credentials`,
`secret` and `secrets` basenames are now rejected independently of extension
before blob reads, while lookalike names remain allowed. Policy-owned `.css`
files each appear exactly once as metadata-only `stylesheetUsage`
uncertainties, without JS/TS parsing or dependency evidence; existing imports
and CSS asset-reference evidence remain preserved.

TDD credential validation recorded RED with 0 of 1 targeted test passing,
then GREEN 2/2. All 3 newly added CSS regression tests failed at RED for the
expected missing coverage before implementation; the CSS GREEN slice passed
11/11. The authoritative staged focused repository audit suites passed
101/101. The full suite exited 0 with 4,299 tests: 4,296 passed, 3
host-dependent skips and zero failures. Typecheck and lint passed; the Babel
deoptimization note was informational.

Current staged semantic results are dead code 1,558 findings/209
uncertainties, including 22 `stylesheetUsage` and 2 `manualScripts`
uncertainties; dependency 2,863/19; asset 561/11,305; and environment
587/252. All four audits ran twice with byte-identical output, exit 0 and
empty stderr; every report retained `deletionAuthority: false`. Brand
verification remained at zero missing and zero unclassified references.

The historical pre-document-synchronization staged inventory contained
1,921 files and 47,369,668 Git blob bytes, with inventory SHA-256
`88baaae9e2ebd36cc66e06965ab3dee426a3c1bcaf1b3eaa110a1d8bd7c0d12a`
and zero forbidden tracked paths. This capture does not identify the index
after these versioned receipts are staged; current final-index bytes and
hashes remain outside these self-referential documents. Round-11 results
remain historical supporting evidence.

Latest-head hosted checks and reviews remain pending before any separately
authorized merge of PR #3. No deletion, merge, provider mutation or Phase 5
action occurred; `deletionAuthority` remains false.

The current tracked inventory remains 1,921 files.
Brand verification remains zero missing and zero unclassified. Exact current
staged bytes and identity remain only in the ignored SDD handoff and user-facing
receipt. Every report retains `deletionAuthority: false`.

The exact final-index readback, repeat independent specification and quality
reviews, and coordinator-owned completion commit all completed before separate
publication authorization opened [PR #3](https://github.com/dsbowersock/atmoshaper/pull/3).
PR #3 remains in hosted review; resolving hosted feedback and final
checks/review precede any separately authorized merge.
Historical report hashes above remain attached only to the exact captures that
produced them; current self-hashed index identities remain outside this versioned
inventory. Every candidate remains retained and `deletionAuthority` remains false.
