# AtmoShaper Cleanup Register

Historical Phase 1 baseline: `fa78ca01a42179329cc223df77c76f308e76320b`, inventoried 2026-09-06. It is not the Phase 2 export source; the [exact export manifest](atmoshaper-export-manifest.json) and [charter](atmoshaper-migration-charter.md) own the current lock, while the [reference inventory](atmoshaper-reference-inventory.md) controls classification. This register records candidates, evidence and later proof obligations; it does not itself authorize deletion. The separately approved Phase 3 plan and the exact omission receipts below govern the current documentation-only cleanup.

Status uses the design's classification vocabulary: `keep`, `omit from new repository`, `replace with concise current document`, `convert to ADR`, `remove after proof`, `retain as compatibility`, `retain in old repository only`, and `unresolved`. A proposed action is not an implementation approval. Unresolved items remain in the new tree.

Historical-plan rows H01-H22 partition 112 plans. The nine direct-test inputs and the separately listed operative Phase 1–2 migration plan complete the 122-plan inherited inventory. Every member of an H row has the identical complete non-self reference-owner set shown in that row and the identical retention action. Evidence is the source-locked whole-tree `git grep -l -I -F -e <exact path> -e <basename>` scan excluding `.env*` and the candidate itself; owner paths are code-point sorted. This proves identical lexical reference evidence, not identical subject matter or safe omission. Empty owner sets do not clear a plan's unique semantic value.

| Item | Current path | Type | Why it may be obsolete | Runtime references | Test references | Historical value | Proposed action | Proof required | Rollback | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Completed wrapper-removal receipt | `.agents/refactor/2026-06-21-refactor-anatomime-session-wrapper.md` | Historical report; 1369 bytes | Removed one-line JS wrapper is absent from locked tree; report contains old test totals only | Zero non-self path/basename matches; TS implementation remains | No report consumer; current dynamic compatibility test remains | Original removal/validation evidence retained at locked old SHA | Omit exact report from destination only | Full content read, all tracked-text exact-path/basename scan, folder consumer scan and wrapper absence satisfied | Restore source blob `6f811591f79b24c75181a82db1b30fcada896e8f` | omit from new repository |
| Remaining historical refactor receipts | Eight retained files in `.agents/refactor/` | Refactor evidence | Dated completed-work reports | Individual exact-path/basename scan found zero non-self references; absence is insufficient semantic proof | Lazy-runtime reports point to current compatibility/lazy-boundary tests | Performance/architecture/database/concurrency constraints may still explain current code | Retain, then review each report before any Phase 3 omission | Determine unique decision/incident value and replacement ADR owner individually; shared current action is retention because proof is incomplete | Retain exact source blobs; restore any later bounded doc-only change | unresolved |
| Active Neon instructions | `.agents/skills/neon-postgres/SKILL.md`, `skills-lock.json` | Agent instructions | Hidden directory could look like disposable task output | Operational agent consumer | No runtime requirement needed for active instructions | Current database safety/workflow guidance | Keep | Active instructions are a mandatory keep class | Restore exact source instructions | keep |
| Source task reports | Five files under `.superpowers/sdd/` | Commerce/background task evidence | Completed task outputs | Exact file scan plus current-log link to `final-fixes-report.md` | No task-report direct test read proven | Durable commerce/background changes may require incident history | Retain all five; no group omission | Full semantic/legal/provider review for each before later retirement | Original Git history/source blobs | unresolved |
| Plans consumed by tests | Nine exact `docs/superpowers/plans/` files listed in reference inventory | Contract inputs | Historical dates can conceal executable test dependency | Current implementation/rollout explanations | Auth schema, limiter schema, workload, immersive panel and control rollout tests directly read them | Security/privacy/rollout decisions | Keep until tests and current decision owners are separately redesigned | Equivalent current contract owner plus dedicated test change, not filename-only cleanup | Restore source plan/test pair | keep |
| Operative Phase 1–2 migration plan | `docs/superpowers/plans/2026-09-06-atmoshaper-repository-migration.md` | Current migration authority | Not a historical-cleanup candidate | Owns the exact source, export, verification, publication, and rollback contract | No direct test read required | Durable fresh-root bootstrap and provenance record | Keep as the completed Phase 1–2 owner | Replacement would require a separately reviewed authority transition | Restore the PR #1 version if a bounded documentation change is reverted | keep |
| Historical plans H01 (26) | `docs/superpowers/plans/2026-05-27-local-first-client-intake-forms.md`; `docs/superpowers/plans/2026-05-27-project-source-of-truth-consolidation.md`; `docs/superpowers/plans/2026-05-28-intake-form-builder-local-documents-v1.md`; `docs/superpowers/plans/2026-05-30-privacy-first-records-framework.md`; `docs/superpowers/plans/2026-06-03-intake-to-soap-continuity.md`; `docs/superpowers/plans/2026-06-03-member-supported-voice-notes-signals.md`; `docs/superpowers/plans/2026-06-12-anatomy-image-review-queue.md`; `docs/superpowers/plans/2026-06-13-anatomime-shared-sessions.md`; `docs/superpowers/plans/2026-06-16-body-sensation-tracker.md`; `docs/superpowers/plans/2026-06-16-client-calendar-reminders.md`; `docs/superpowers/plans/2026-06-16-wellness-patterns-and-reports.md`; `docs/superpowers/plans/2026-06-17-anatomy-media-review-filters.md`; `docs/superpowers/plans/2026-06-17-atmosphere-sample-asset-intake.md`; `docs/superpowers/plans/2026-06-17-legal-trust-pages.md`; `docs/superpowers/plans/2026-06-18-atmosphere-generative-fm-adapter.md`; `docs/superpowers/plans/2026-06-18-atmosphere-prerendered-samples.md`; `docs/superpowers/plans/2026-06-18-atmosphere-r2-sample-hosting.md`; `docs/superpowers/plans/2026-06-18-atmosphere-rendered-sample-planner.md`; `docs/superpowers/plans/2026-06-18-atmosphere-wellness-surface.md`; `docs/superpowers/plans/2026-06-19-atmosphere-performance-audio-qa.md`; `docs/superpowers/plans/2026-06-19-atmosphere-polish-qa.md`; `docs/superpowers/plans/2026-06-21-focused-seo-landing-pages.md`; `docs/superpowers/plans/2026-06-21-technical-seo-foundation.md`; `docs/superpowers/plans/2026-06-22-business-income-planner.md`; `docs/superpowers/plans/2026-06-22-business-plan-template-tools.md`; `docs/superpowers/plans/2026-06-22-privacy-safe-sentry-feedback.md` | Plans/receipts | Historical dates do not establish obsolescence | No runtime/script/CI matches; complete non-self textual owner set: `docs/project-log.md` | No test matches | Unique legal, privacy, provider, provenance or architecture value is not semantically cleared | Retain pending individual Phase 3 review | Review each plan's unique role and still-binding decisions before any omission; no filename-only deletion proof | Old exact SHA; bounded restoration | unresolved |
| Historical plans H02 (1) | `docs/superpowers/plans/2026-06-01-role-aware-module-surfaces.md` | Plans/receipts | Historical dates do not establish obsolescence | No runtime/script/CI matches; complete non-self textual owner set: `docs/project-log.md`; `docs/superpowers/plans/2026-06-16-public-client-wellness-tools.md` | No test matches | Unique legal, privacy, provider, provenance or architecture value is not semantically cleared | Retain pending individual Phase 3 review | Review each plan's unique role and still-binding decisions before any omission; no filename-only deletion proof | Old exact SHA; bounded restoration | unresolved |
| Historical plans H03 (52) | `docs/superpowers/plans/2026-06-04-flashcard-community-decks.md`; `docs/superpowers/plans/2026-06-04-sourced-anatomy-flashcards.md`; `docs/superpowers/plans/2026-06-07-flashcard-mastery-progress.md`; `docs/superpowers/plans/2026-06-08-flashcard-runner-polish.md`; `docs/superpowers/plans/2026-06-10-anatomy-admin-media-accuracy-review.md`; `docs/superpowers/plans/2026-06-10-flashcard-mastery-rounds.md`; `docs/superpowers/plans/2026-06-10-flashcard-progress-dashboard.md`; `docs/superpowers/plans/2026-06-15-anatomime-shared-room-game-run.md`; `docs/superpowers/plans/2026-06-15-public-homepage-refresh.md`; `docs/superpowers/plans/2026-06-16-post-account-role-onboarding.md`; `docs/superpowers/plans/2026-06-17-atmosphere-audio-runtime-spike.md`; `docs/superpowers/plans/2026-06-22-big-visual-refresh.md`; `docs/superpowers/plans/2026-06-25-google-calendar-provider-sync.md`; `docs/superpowers/plans/2026-07-05-chimer-redesign-implementation-checklist.md`; `docs/superpowers/plans/2026-07-07-sitewide-visual-system-rollout.md`; `docs/superpowers/plans/2026-07-14-sitewide-control-system-review.md`; `docs/superpowers/plans/2026-07-17-app-shell-install-help.md`; `docs/superpowers/plans/2026-07-17-public-roadmap-refresh.md`; `docs/superpowers/plans/2026-07-18-background-commerce-foundation.md`; `docs/superpowers/plans/2026-07-18-background-purchase-surfaces.md`; `docs/superpowers/plans/2026-07-18-carousel-prototype-lab.md`; `docs/superpowers/plans/2026-07-18-dna-twisted-cubes-backgrounds.md`; `docs/superpowers/plans/2026-07-18-shared-background-palette.md`; `docs/superpowers/plans/2026-07-20-carousel-production-rollout.md`; `docs/superpowers/plans/2026-07-23-background-commerce-tax-license-amendment.md`; `docs/superpowers/plans/2026-07-23-supporter-membership-restructure.md`; `docs/superpowers/plans/2026-08-03-background-branding-audit.md`; `docs/superpowers/plans/2026-08-03-background-preview-pilot.md`; `docs/superpowers/plans/2026-08-03-five-card-adaptive-preview-runtime.md`; `docs/superpowers/plans/2026-08-03-mobile-visual-panel-and-render-lifecycle-remediation.md`; `docs/superpowers/plans/2026-08-04-background-animation-autonomy-remediation.md`; `docs/superpowers/plans/2026-08-04-background-layering-and-framing-remediation.md`; `docs/superpowers/plans/2026-08-04-grid-motion-responsive-mantras.md`; `docs/superpowers/plans/2026-08-06-background-preview-full-catalog.md`; `docs/superpowers/plans/2026-08-07-background-preview-publication-runtime.md`; `docs/superpowers/plans/2026-08-07-proprietary-repository-licensing.md`; `docs/superpowers/plans/2026-08-08-mobile-media-carousel-controls.md`; `docs/superpowers/plans/2026-08-09-admin-jwt-session-revocation-correction.md`; `docs/superpowers/plans/2026-08-11-admin-operations-production-activation.md`; `docs/superpowers/plans/2026-08-11-password-reset-integrity.md`; `docs/superpowers/plans/2026-08-14-media-notifications-audio-interruptions.md`; `docs/superpowers/plans/2026-08-15-atmosphere-artwork-vinyl-player.md`; `docs/superpowers/plans/2026-08-16-atmosphere-physical-fixes.md`; `docs/superpowers/plans/2026-08-16-faster-pr-feedback.md`; `docs/superpowers/plans/2026-08-17-anonymous-operational-sentry-hardening.md`; `docs/superpowers/plans/2026-08-27-atmoshaper-production-catalog-r2-rollout.md`; `docs/superpowers/plans/2026-08-27-atmoshaper-stadium-dynamics-leveling.md`; `docs/superpowers/plans/2026-08-27-production-migration-deployment-gate.md`; `docs/superpowers/plans/2026-08-29-2fa-management-hardening.md`; `docs/superpowers/plans/2026-09-04-dependency-maintenance-gate.md`; `docs/superpowers/plans/chimer-redesign-batch-1-haptics-and-controls-implementation.md`; `docs/superpowers/plans/chimer-redesign-implementation-checklist-2026-07-06.md` | Plans/receipts | Historical dates do not establish obsolescence | No runtime/script/CI matches; complete non-self textual owner set: none | No test matches | Unique legal, privacy, provider, provenance or architecture value is not semantically cleared | Retain pending individual Phase 3 review | Review each plan's unique role and still-binding decisions before any omission; no filename-only deletion proof | Old exact SHA; bounded restoration | unresolved |
| Historical plans H04 (1) | `docs/superpowers/plans/2026-06-12-anatomy-media-view-coverage.md` | Plans/receipts | Historical dates do not establish obsolescence | No runtime/script/CI matches; complete non-self textual owner set: `docs/superpowers/plans/2026-06-10-anatomy-admin-media-accuracy-review.md` | No test matches | Unique legal, privacy, provider, provenance or architecture value is not semantically cleared | Retain pending individual Phase 3 review | Review each plan's unique role and still-binding decisions before any omission; no filename-only deletion proof | Old exact SHA; bounded restoration | unresolved |
| Historical plans H05 (1) | `docs/superpowers/plans/2026-06-16-public-client-wellness-tools.md` | Plans/receipts | Historical dates do not establish obsolescence | No runtime/script/CI matches; complete non-self textual owner set: `docs/project-log.md`; `docs/project-state.md`; `docs/superpowers/plans/2026-06-16-wellness-patterns-and-reports.md` | No test matches | Unique legal, privacy, provider, provenance or architecture value is not semantically cleared | Retain pending individual Phase 3 review | Review each plan's unique role and still-binding decisions before any omission; no filename-only deletion proof | Old exact SHA; bounded restoration | unresolved |
| Historical plans H06 (12) | `docs/superpowers/plans/2026-06-18-atmosphere-first-batch-hosting.md`; `docs/superpowers/plans/2026-06-18-atmosphere-generative-fm-sample-coverage.md`; `docs/superpowers/plans/2026-06-18-atmosphere-hosted-opus-sidecars.md`; `docs/superpowers/plans/2026-06-18-atmosphere-second-batch-hosting.md`; `docs/superpowers/plans/2026-06-18-atmosphere-startup-performance.md`; `docs/superpowers/plans/2026-06-18-atmosphere-third-batch-listener-copy.md`; `docs/superpowers/plans/2026-06-18-atmosphere-web-audio-format-pilot.md`; `docs/superpowers/plans/2026-06-19-atmosphere-aac-mp3-sidecars.md`; `docs/superpowers/plans/2026-06-19-atmosphere-playback-performance.md`; `docs/superpowers/plans/2026-06-19-atmosphere-remaining-generators.md`; `docs/superpowers/plans/2026-06-19-atmosphere-rendered-piano-batch.md`; `docs/superpowers/plans/2026-06-19-ci-build-cache.md` | Plans/receipts | Historical dates do not establish obsolescence | No runtime/script/CI matches; complete non-self textual owner set: `docs/project-log.md`; `docs/wiki/atmosphere-audio.md` | No test matches | Unique legal, privacy, provider, provenance or architecture value is not semantically cleared | Retain pending individual Phase 3 review | Review each plan's unique role and still-binding decisions before any omission; no filename-only deletion proof | Old exact SHA; bounded restoration | unresolved |
| Historical plans H07 (1) | `docs/superpowers/plans/2026-06-20-codebase-refactor-optimization.md` | Plans/receipts | Historical dates do not establish obsolescence | No runtime/script/CI matches; complete non-self textual owner set: `.agents/refactor/2026-06-20-music-provider-lazy-runtime.md`; `.agents/refactor/2026-06-20-refactor-calendar-actions.md`; `docs/project-log.md`; `docs/project-state.md` | No test matches | Unique legal, privacy, provider, provenance or architecture value is not semantically cleared | Retain pending individual Phase 3 review | Review each plan's unique role and still-binding decisions before any omission; no filename-only deletion proof | Old exact SHA; bounded restoration | unresolved |
| Historical plans H08 (2) | `docs/superpowers/plans/2026-06-21-launch-neon-transfer-hardening.md`; `docs/superpowers/plans/2026-06-23-invite-readiness-stabilization.md` | Plans/receipts | Historical dates do not establish obsolescence | No runtime/script/CI matches; complete non-self textual owner set: `docs/project-log.md`; `docs/project-state.md` | No test matches | Unique legal, privacy, provider, provenance or architecture value is not semantically cleared | Retain pending individual Phase 3 review | Review each plan's unique role and still-binding decisions before any omission; no filename-only deletion proof | Old exact SHA; bounded restoration | unresolved |
| Historical plans H09 (1) | `docs/superpowers/plans/2026-07-26-supporter-membership-three-product-portal-followup.md` | Plans/receipts | Historical dates do not establish obsolescence | No runtime/script/CI matches; complete non-self textual owner set: `docs/project-state.md`; `docs/superpowers/plans/2026-07-23-supporter-membership-restructure.md`; `docs/wiki/billing-memberships.md` | No test matches | Unique legal, privacy, provider, provenance or architecture value is not semantically cleared | Retain pending individual Phase 3 review | Review each plan's unique role and still-binding decisions before any omission; no filename-only deletion proof | Old exact SHA; bounded restoration | unresolved |
| Historical plans H10 (1) | `docs/superpowers/plans/2026-08-11-admin-queue-navigation.md` | Plans/receipts | Historical dates do not establish obsolescence | No runtime/script/CI matches; complete non-self textual owner set: `docs/superpowers/specs/2026-08-11-admin-operations-closure-design.md` | No test matches | Unique legal, privacy, provider, provenance or architecture value is not semantically cleared | Retain pending individual Phase 3 review | Review each plan's unique role and still-binding decisions before any omission; no filename-only deletion proof | Old exact SHA; bounded restoration | unresolved |
| Historical plans H11 (1) | `docs/superpowers/plans/2026-08-11-billing-goodwill-reconciliation-correction.md` | Plans/receipts | Historical dates do not establish obsolescence | No runtime/script/CI matches; complete non-self textual owner set: `docs/aegis/work/2026-08-13-billing-goodwill-reconciliation-correction/10-intent.md` | No test matches | Unique legal, privacy, provider, provenance or architecture value is not semantically cleared | Retain pending individual Phase 3 review | Review each plan's unique role and still-binding decisions before any omission; no filename-only deletion proof | Old exact SHA; bounded restoration | unresolved |
| Historical plans H12 (1) | `docs/superpowers/plans/2026-08-21-atmoshaper-core-mixer.md` | Plans/receipts | Historical dates do not establish obsolescence | No runtime/script/CI matches; complete non-self textual owner set: `docs/superpowers/plans/2026-08-22-atmoshaper-overlay-drawer-preview-ui.md` | No test matches | Unique legal, privacy, provider, provenance or architecture value is not semantically cleared | Retain pending individual Phase 3 review | Review each plan's unique role and still-binding decisions before any omission; no filename-only deletion proof | Old exact SHA; bounded restoration | unresolved |
| Historical plans H13 (1) | `docs/superpowers/plans/2026-08-22-atmoshaper-overlay-drawer-preview-ui.md` | Plans/receipts | Historical dates do not establish obsolescence | No runtime/script/CI matches; complete non-self textual owner set: `docs/aegis/work/2026-08-23-atmoshaper-signature-sound-catalog/10-intent.md`; `docs/superpowers/plans/2026-08-23-atmoshaper-signature-sound-catalog.md` | No test matches | Unique legal, privacy, provider, provenance or architecture value is not semantically cleared | Retain pending individual Phase 3 review | Review each plan's unique role and still-binding decisions before any omission; no filename-only deletion proof | Old exact SHA; bounded restoration | unresolved |
| Historical plans H14 (1) | `docs/superpowers/plans/2026-08-23-atmoshaper-signature-candidate-review.md` | Plans/receipts | Historical dates do not establish obsolescence | No runtime/script/CI matches; complete non-self textual owner set: `docs/aegis/plans/2026-08-25-atmoshaper-signature-construction-audition.md`; `docs/aegis/plans/2026-08-25-atmoshaper-signature-review-reconciliation.md`; `docs/aegis/work/2026-08-25-atmoshaper-signature-construction-audition/10-intent.md`; `docs/superpowers/plans/2026-08-23-atmoshaper-signature-review-curation.md` | No test matches | Unique legal, privacy, provider, provenance or architecture value is not semantically cleared | Retain pending individual Phase 3 review | Review each plan's unique role and still-binding decisions before any omission; no filename-only deletion proof | Old exact SHA; bounded restoration | unresolved |
| Historical plans H15 (1) | `docs/superpowers/plans/2026-08-23-atmoshaper-signature-review-curation.md` | Plans/receipts | Historical dates do not establish obsolescence | No runtime/script/CI matches; complete non-self textual owner set: `docs/aegis/plans/2026-08-25-atmoshaper-signature-review-reconciliation.md`; `docs/aegis/work/2026-08-23-atmoshaper-signature-sound-catalog/10-intent.md`; `docs/aegis/work/2026-08-23-atmoshaper-signature-sound-catalog/20-checkpoint.md` | No test matches | Unique legal, privacy, provider, provenance or architecture value is not semantically cleared | Retain pending individual Phase 3 review | Review each plan's unique role and still-binding decisions before any omission; no filename-only deletion proof | Old exact SHA; bounded restoration | unresolved |
| Historical plans H16 (1) | `docs/superpowers/plans/2026-08-23-atmoshaper-signature-sound-catalog.md` | Plans/receipts | Historical dates do not establish obsolescence | No runtime/script/CI matches; complete non-self textual owner set: `docs/superpowers/plans/2026-08-23-atmoshaper-signature-candidate-review.md` | No test matches | Unique legal, privacy, provider, provenance or architecture value is not semantically cleared | Retain pending individual Phase 3 review | Review each plan's unique role and still-binding decisions before any omission; no filename-only deletion proof | Old exact SHA; bounded restoration | unresolved |
| Historical plans H17 (1) | `docs/superpowers/plans/2026-08-26-atmoshaper-batch-09-51-review-amendments.md` | Plans/receipts | Historical dates do not establish obsolescence | No runtime/script/CI matches; complete non-self textual owner set: `docs/aegis/plans/2026-08-26-atmoshaper-second-whole-concept-review.md` | No test matches | Unique legal, privacy, provider, provenance or architecture value is not semantically cleared | Retain pending individual Phase 3 review | Review each plan's unique role and still-binding decisions before any omission; no filename-only deletion proof | Old exact SHA; bounded restoration | unresolved |
| Historical plans H18 (1) | `docs/superpowers/plans/2026-08-28-family-friends-readiness-program.md` | Plans/receipts | Historical dates do not establish obsolescence | No runtime/script/CI matches; complete non-self textual owner set: `docs/superpowers/plans/2026-08-29-2fa-management-hardening.md` | No test matches | Unique legal, privacy, provider, provenance or architecture value is not semantically cleared | Retain pending individual Phase 3 review | Review each plan's unique role and still-binding decisions before any omission; no filename-only deletion proof | Old exact SHA; bounded restoration | unresolved |
| Historical plans H19 (2) | `docs/superpowers/plans/2026-08-28-navigation-action-feedback.md`; `docs/superpowers/plans/2026-08-28-server-cost-controls.md` | Plans/receipts | Historical dates do not establish obsolescence | No runtime/script/CI matches; complete non-self textual owner set: `docs/superpowers/plans/2026-08-28-family-friends-readiness-program.md` | No test matches | Unique legal, privacy, provider, provenance or architecture value is not semantically cleared | Retain pending individual Phase 3 review | Review each plan's unique role and still-binding decisions before any omission; no filename-only deletion proof | Old exact SHA; bounded restoration | unresolved |
| Historical plans H20 (1) | `docs/superpowers/plans/2026-08-31-family-friends-abuse-cost-hardening-program.md` | Plans/receipts | Historical dates do not establish obsolescence | No runtime/script/CI matches; complete non-self textual owner set: `docs/aegis/work/2026-09-05-layer-d-public-ingress/10-intent.md` | No test matches | Unique legal, privacy, provider, provenance or architecture value is not semantically cleared | Retain pending individual Phase 3 review | Review each plan's unique role and still-binding decisions before any omission; no filename-only deletion proof | Old exact SHA; bounded restoration | unresolved |
| Historical plans H21 (1) | `docs/superpowers/plans/2026-08-31-public-provider-ingress-hardening.md` | Plans/receipts | Historical dates do not establish obsolescence | No runtime/script/CI matches; complete non-self textual owner set: `docs/aegis/work/2026-09-05-layer-d-public-ingress/10-intent.md`; `docs/superpowers/plans/2026-08-31-family-friends-abuse-cost-hardening-program.md` | No test matches | Unique legal, privacy, provider, provenance or architecture value is not semantically cleared | Retain pending individual Phase 3 review | Review each plan's unique role and still-binding decisions before any omission; no filename-only deletion proof | Old exact SHA; bounded restoration | unresolved |
| Historical plans H22 (2) | `docs/superpowers/plans/chimer-background-preview-media-workflow.md`; `docs/superpowers/plans/chimer-music-player-inspiration-note-2026-07-06.md` | Plans/receipts | Historical dates do not establish obsolescence | No runtime/script/CI matches; complete non-self textual owner set: `docs/superpowers/plans/chimer-redesign-implementation-checklist-2026-07-06.md` | No test matches | Unique legal, privacy, provider, provenance or architecture value is not semantically cleared | Retain pending individual Phase 3 review | Review each plan's unique role and still-binding decisions before any omission; no filename-only deletion proof | Old exact SHA; bounded restoration | unresolved |
| Current audio audit | `docs/superpowers/reports/2026-08-23-atmoshaper-signature-sound-catalog-audit.md` | Audio research/provenance | Historical discovery counts differ from shipped catalog | Source state/log/audio wiki reference it | Validator/runtime catalog evidence stays elsewhere too | Exact research lineage; does not clear every audio file or claim 84 shipped concepts | Keep and label historical discovery correctly | None for retention; exact-file rights/QA before publishing any expansion | Old blob/current catalogs retained | keep |
| Workload report | `docs/superpowers/reports/2026-08-29-bootstrap-pricing-cost-hardening.md` | Operational test input | Historical performance report | Describes server/provider boundaries | `tests/family-friends-server-workload.test.mjs` reads it | Explains workload measurement and limits | Keep | New current evidence owner and test change before retirement | Restore report/test pair | keep |
| Audio device QA | Two files in `docs/superpowers/qa/` | Device/interruptions/startup QA | Old manual results | Current audio behavior; linked historical plans | Automated tests do not replace all device/hearing evidence | Platform-specific interruption and timing coverage | Keep both pending equivalent current device proof | Fresh same-device behavior and explicit retirement decision | Preserve original QA evidence | keep |
| Aegis work records | 30 files in `docs/aegis/work/` | Security/billing/audio evidence | Completed intent/checkpoint/reflection records | Basename scan includes repeated generic names, so no safe whole-group conclusion | Current auth/billing/audio contracts elsewhere | Security, durable external operations, source provenance | Retain entire group while semantic proof remains incomplete | Per-record unique evidence/incident/rollback analysis before consolidation | Old exact source archive | unresolved |
| Aegis audio plans | Four files in `docs/aegis/plans/` | Audio preparation/review plans | Older review workflow | Current audio review/prepared/release process | Checksum/QA validators preserve contract | Sound-source and reviewer decisions | Keep | Any ADR replacement must preserve exact source/QA/provenance links | Restore exact plans | keep |
| Operations/compatibility audits | Seven files in `docs/audits/` | Audit evidence | Dates are historical | State/log refer to performance, Neon and control inventory | Compatibility/control/privacy tooling can depend on decisions without direct links | Security/privacy/provider/runtime explanations | Keep; later consolidate individually | Fresh audit and semantic ownership before retirement | Old exact audit blobs | keep |
| Generated branding audit | Eight files in `docs/background-branding-audit/` | Generated Markdown index/batches | Re-creatable output may seem removable | `scripts/background-branding/render-audit.mjs` resolves this output directory | `tests/background-branding-audit.test.mjs` verifies exact generated filenames through an injected writer; it does not read these Markdown files | Per-background attribution/brand/control review | Keep all eight | Prove current generator/output/docs ownership can retire or replace with equivalent owner | Reproduce against exact source inputs and restore original blobs | keep |
| TODO and roadmap | `TODO.md`; `docs/roadmap.md` | Product/history evidence | Headline status can lag current state | AGENTS, README, source state/log/wiki references | Calendar creation test reads roadmap | Earlier product decisions and open work | Retain as evidence, not authority; later reconcile separately | Review linked/current decisions and direct test read before consolidation | Restore original evidence | keep |
| Current authority documents | `AGENTS.md`, `README.md`, `docs/project-state.md`, `docs/project-log.md` | Current project authority | Old project identity/history should not become new current log | Agent/docs readers | Docs references and runtime statement checks must remain valid | Full prior history remains old repository's responsibility | Task 5 concise replacement with lineage and preserved legal/safety rules | Exact approved difference contract and destination tests | Original source docs retained in old Git | replace with concise current document |
| Architecture decisions | Approved migration design sections 3, 7, 19, 21.8 | Still-binding program decisions | Long program prose needs focused future decision records | Future architecture/recovery/provider work | Future verification owns acceptance | Fresh-root lineage, legal/private split, recovery, parallel staging | Phase 3 convert to ADR after behavior is implemented/verified | Decision/rationale/compatibility/revisit trigger/source link; no acceptance by documentation alone | Retain approved design; revert bounded ADR change | unresolved |
| Compatibility wrappers / legacy models | `lib/anatomy-legacy.js`, `lib/anatomy.js`, remaining TS/JS adapters; `prisma/schema.prisma` legacy `AuthAttempt` | Runtime/data history | Legacy names tempt deletion | Sourced anatomy compatibility and rollback/data ownership | `tests/ts-js-compatibility.test.mjs`, auth schema guards | Data/identity history and bridge rollback | Preserve; any model/drop or wrapper retirement gets its own proof | Exact import/runtime/provider/rollback inventory; separately authorized schema/data cleanup | Restore compatibility code; never use destructive DB rollback | retain as compatibility |
| Package/dependency/patch set | `package.json`, `package-lock.json`, `patches/` | Build dependencies | Historical libraries may appear unused | Dynamic imports/build tools/patch scripts | Full install/typecheck/test/build/QA | Installed behavior and dependency-security acceptance | Only planned scripts change now; audit dependencies in separate Phase 4 branch | Direct and dynamic import/CLI/config evidence, fresh install/audit/build/bundle comparison | Restore lock/package/patch set as one bounded change | unresolved |
| Assets/media/catalogs/scripts | 72 `public/` files, 40 `data/` files, 71 `scripts/` files | Runtime/media/generation | Generated and old-named assets may seem redundant | Manifest/dynamic/public URL/code-generation/maintenance consumers | Current catalog/schema/browser/QA tests | Licenses, exact sources, immutable releases and recovery | Keep all; no binary/object cleanup | Exact-file reference/provenance and build/visual tests; provider objects separately authorized | Restore source blobs and existing immutable URLs | unresolved |
| Old browser data / caches | Local-data register; `public/sw.js` cache family | Origin-bound state | Old product/domain labels | Installed PWAs and legacy import/readers | Vault/PWA/storage/browser contracts | User-owned records and recovery | Retain; later scoped Phase 8 ownership plan | Both old origins, offline installed app, round-trip imports, explicit recovery-period approval | Preserve old origin and encrypted exports; no blanket clearing | retain as compatibility |
| Migration parity spec/snapshots/audits | Exact future manifest task-add and overlay sets | Migration evidence/tooling | Will eventually be program-specific | No runtime imports allowed | Source/destination parity and audits | Falsifiable lineage/parity through rebrand | Retain through Phases 3-6; explicit keep/update/retire review after Phase 6 | Equal source/destination behavior evidence and recorded replacement/retirement reason | Restore accepted source snapshots; never update destination to hide drift | keep |

## Historical Phase 1 omission and rollback receipts

The exact omission set is one tracked Markdown file; no directory is omitted. All 191 candidate file paths were individually checked with `git grep -l -I -F -e <path> -e <basename>` at the source SHA, excluding self-hits and private env files. Generic basenames can overcount references; no deletion rests on those counts alone. Folder/dynamic consumer searches and full content review support the single omission. Its 1,369 bytes are old measurement history; the current implementation and dynamic compatibility test remain.

Task 2 removed nothing. Later Task 5 omission affects only the verified fresh destination snapshot. The old repository, old commit and omitted blob remain available. Any cleanup beyond the manifest needs a separately reviewed evidence/rollback boundary and its owning phase.

## Phase 3 documentation omissions — 2026-09-09

The approved [Phase 3 plan](../superpowers/plans/2026-09-09-atmoshaper-phase3-documentation-consolidation.md) owns this separate 16-file omission boundary. The Phase 1 inventory and its unresolved H01–H22 rows above remain historical evidence; only the exact members listed below are superseded by these Phase 3 decisions. No other member inherits clearance.

Before omission, all 16 plans were read completely and their Git blob IDs matched the exact MassageLab source commit `e74045c2fc85c2cb4df176fdb1aff2137c4d9848`. All 122 inherited plans and the separate Phase 3 plan existed, yielding 123 plans alongside 28 specifications. The current owners below retain the durable rules; source links retain full licensing, provider/upload, decision, and verification history without claiming those dated checks were rerun. No source file or source Git object was removed.

Each row is a historical-plan omission receipt. Exact path/basename searches across the working tree, including hidden workflow files, found no application, test, workflow, or script consumer of these documents. The only retained document consumers needing repair were the audio wiki and Chimer checklist; both now use immutable source links. Folder-level consumer searches confirmed the existing test-consumed plans are outside this set. Remaining exact-name occurrences are classified as the operative plan's approved omission list, this register's historical inventory/receipts, and immutable historical-source URLs. The brand baseline remains Task 5's audit evidence and is not a document-link consumer.

Current-code review found a conflict with the operative plan's metadata-only hover wording: `canPrewarmCompressedSamplePayloads()` allows compressed payloads unless `saveData` or a `slow-2g`/`2g` connection blocks them. The workspace requests them for three idle starter stations; hover can request them per station. Focus, pointer-down, and carousel centering use metadata-only defaults. The wiki now states those actual conditions; no runtime or policy changed.

| Omitted fresh-repository path | Current replacement owner | Omission reason and semantic evidence | Immutable historical source | Rollback | Status |
| --- | --- | --- | --- | --- | --- |
| `docs/superpowers/plans/2026-05-27-project-source-of-truth-consolidation.md` | [Current state](../project-state.md), [log](../project-log.md), and [AGENTS](../../AGENTS.md) | Completed authority setup; read order and evidence hierarchy now live in fresh authority documents. | [Exact source](https://github.com/dsbowersock/massagelab/blob/e74045c2fc85c2cb4df176fdb1aff2137c4d9848/docs/superpowers/plans/2026-05-27-project-source-of-truth-consolidation.md) | Restore blob `6175ea7516e3d238518d0f81b08a510b0c2a9be2` at the path in column 1 | retain in old repository only |
| `docs/superpowers/plans/2026-05-28-intake-form-builder-local-documents-v1.md` | [Privacy architecture](../wiki/privacy-first-data-architecture.md) and `app/notes/intake/client-page.tsx`, `lib/local-intake-builder.js` | Older route implementation recipe; current intake remains local-first and uses the shared encrypted vault, superseding standalone plaintext exports. | [Exact source](https://github.com/dsbowersock/massagelab/blob/e74045c2fc85c2cb4df176fdb1aff2137c4d9848/docs/superpowers/plans/2026-05-28-intake-form-builder-local-documents-v1.md) | Restore blob `6e5e7039dc4fe43c52a8ec37db40e365b252f70f` at the path in column 1 | retain in old repository only |
| `docs/superpowers/plans/2026-05-30-privacy-first-records-framework.md` | [Privacy architecture](../wiki/privacy-first-data-architecture.md), `lib/professional-record-vault.js`, and `app/notes/professional-record-vault-provider.tsx` | Vault creation recipe; encryption, session-only unlock, legacy migration, and encrypted bundle contracts remain in current code and privacy owner. | [Exact source](https://github.com/dsbowersock/massagelab/blob/e74045c2fc85c2cb4df176fdb1aff2137c4d9848/docs/superpowers/plans/2026-05-30-privacy-first-records-framework.md) | Restore blob `7bb81d8852ba08cee5b80fa0c2ffa56595882063` at the path in column 1 | retain in old repository only |
| `docs/superpowers/plans/2026-06-18-atmosphere-first-batch-hosting.md` | [Audio wiki](../wiki/atmosphere-audio.md#public-r2-sample-hosting), `lib/atmosphere/generative-fm-catalog.js` | Three-station rollout receipt; piece-scoped indexes, source choices, upload totals and header checks remain in wiki and immutable source. | [Exact source](https://github.com/dsbowersock/massagelab/blob/e74045c2fc85c2cb4df176fdb1aff2137c4d9848/docs/superpowers/plans/2026-06-18-atmosphere-first-batch-hosting.md) | Restore blob `8a897d27d27dff5162905905d134876266fa4731` at the path in column 1 | retain in old repository only |
| `docs/superpowers/plans/2026-06-18-atmosphere-generative-fm-sample-coverage.md` | [Audio coverage/source owner](../wiki/atmosphere-audio.md#catalog-wide-generativefm-sample-coverage), `lib/atmosphere/generative-fm-sample-coverage.js` | Earlier 1/38/18 availability queue is superseded by 57 enabled stations; source licensing and SSO adaptations remain in coverage owner and immutable source. | [Exact source](https://github.com/dsbowersock/massagelab/blob/e74045c2fc85c2cb4df176fdb1aff2137c4d9848/docs/superpowers/plans/2026-06-18-atmosphere-generative-fm-sample-coverage.md) | Restore blob `425e856fdf2304027b991aeaabbdf2f51d279aa2` at the path in column 1 | retain in old repository only |
| `docs/superpowers/plans/2026-06-18-atmosphere-hosted-opus-sidecars.md` | [Audio format/runtime owner](../wiki/atmosphere-audio.md#generativefm-adapter-runtime), `lib/atmosphere/web-audio-format-pilot.js` | Ten-station Opus rollout is historical; ordered formats and preserved WAV fallback now have current owners; exact upload receipt remains linked. | [Exact source](https://github.com/dsbowersock/massagelab/blob/e74045c2fc85c2cb4df176fdb1aff2137c4d9848/docs/superpowers/plans/2026-06-18-atmosphere-hosted-opus-sidecars.md) | Restore blob `0999186c958adcea035b39b2c800a6502c21075c` at the path in column 1 | retain in old repository only |
| `docs/superpowers/plans/2026-06-18-atmosphere-second-batch-hosting.md` | [Audio hosting owner](../wiki/atmosphere-audio.md#public-r2-sample-hosting), `lib/atmosphere/generative-fm-render-plan.js` | Four-station piano rollout receipt; piece-scoped source evidence and historical upload/header results remain linked. | [Exact source](https://github.com/dsbowersock/massagelab/blob/e74045c2fc85c2cb4df176fdb1aff2137c4d9848/docs/superpowers/plans/2026-06-18-atmosphere-second-batch-hosting.md) | Restore blob `3e722c743b353f225bbdd123e194306eb3546b74` at the path in column 1 | retain in old repository only |
| `docs/superpowers/plans/2026-06-18-atmosphere-startup-performance.md` | [Audio runtime owner](../wiki/atmosphere-audio.md#generativefm-adapter-runtime), `lib/atmosphere/generative-fm-runtime.ts` | Early startup recipe; runtime owns cache-aware metadata/module preparation, gesture-gated audio start, and timing signals. | [Exact source](https://github.com/dsbowersock/massagelab/blob/e74045c2fc85c2cb4df176fdb1aff2137c4d9848/docs/superpowers/plans/2026-06-18-atmosphere-startup-performance.md) | Restore blob `0798d975cdbc4af680279d2f02f8cb1b60d62f4a` at the path in column 1 | retain in old repository only |
| `docs/superpowers/plans/2026-06-18-atmosphere-third-batch-listener-copy.md` | [Audio hosting owner](../wiki/atmosphere-audio.md#public-r2-sample-hosting), `lib/atmosphere/generative-fm-catalog.js` | Three-station rollout and listener-copy recipe; current catalog owns descriptions and piece-scoped enablement; exact upload receipt remains linked. | [Exact source](https://github.com/dsbowersock/massagelab/blob/e74045c2fc85c2cb4df176fdb1aff2137c4d9848/docs/superpowers/plans/2026-06-18-atmosphere-third-batch-listener-copy.md) | Restore blob `97de6502b959ef938f9b7f57e95a4c8258baf04d` at the path in column 1 | retain in old repository only |
| `docs/superpowers/plans/2026-06-18-atmosphere-web-audio-format-pilot.md` | [Audio format owner](../wiki/atmosphere-audio.md#generativefm-adapter-runtime), `lib/atmosphere/web-audio-format-pilot.js` | Observable Streams pilot is superseded by catalog-wide formats; original WAV preservation, encoding and upload evidence remain linked. | [Exact source](https://github.com/dsbowersock/massagelab/blob/e74045c2fc85c2cb4df176fdb1aff2137c4d9848/docs/superpowers/plans/2026-06-18-atmosphere-web-audio-format-pilot.md) | Restore blob `b8f79a9dcb028dfd3abdedd4a7d3de1a39bb1c98` at the path in column 1 | retain in old repository only |
| `docs/superpowers/plans/2026-06-19-atmosphere-aac-mp3-sidecars.md` | [Audio format owner](../wiki/atmosphere-audio.md#generativefm-adapter-runtime), `lib/atmosphere/generative-fm-runtime.ts` | Completed AAC/MP3 rollout; current runtime retains Opus/AAC/MP3/WAV order and format-specific preparation; exact provider receipt remains linked. | [Exact source](https://github.com/dsbowersock/massagelab/blob/e74045c2fc85c2cb4df176fdb1aff2137c4d9848/docs/superpowers/plans/2026-06-19-atmosphere-aac-mp3-sidecars.md) | Restore blob `786012a07dcb232cba0c77bd34af73eeaa32c810` at the path in column 1 | retain in old repository only |
| `docs/superpowers/plans/2026-06-19-atmosphere-playback-performance.md` | [Audio runtime owner](../wiki/atmosphere-audio.md#generativefm-adapter-runtime), `app/browse/workspace.tsx`, `components/atmosphere/station-carousel-card.tsx` | Earlier warmup recipe; current code permits gated idle/hover payloads but focus/pointer-down remain metadata-only, as reconciled in wiki. | [Exact source](https://github.com/dsbowersock/massagelab/blob/e74045c2fc85c2cb4df176fdb1aff2137c4d9848/docs/superpowers/plans/2026-06-19-atmosphere-playback-performance.md) | Restore blob `e3fa85ebd96f5d1b10b7fe96d6752aaa9d5c2227` at the path in column 1 | retain in old repository only |
| `docs/superpowers/plans/2026-06-19-atmosphere-remaining-generators.md` | [Audio source/coverage owner](../wiki/atmosphere-audio.md#catalog-wide-generativefm-sample-coverage), `lib/atmosphere/generative-fm-sample-coverage.js` | Final 18-station enablement receipt; source adaptations and exact historical object/header results remain in wiki and immutable source. | [Exact source](https://github.com/dsbowersock/massagelab/blob/e74045c2fc85c2cb4df176fdb1aff2137c4d9848/docs/superpowers/plans/2026-06-19-atmosphere-remaining-generators.md) | Restore blob `2661e2386d3a41b2f074fe1514b633fdfe723963` at the path in column 1 | retain in old repository only |
| `docs/superpowers/plans/2026-06-19-atmosphere-rendered-piano-batch.md` | [Audio hosting owner](../wiki/atmosphere-audio.md#public-r2-sample-hosting), `lib/atmosphere/generative-fm-render-plan.js` | Three rendered plus 25 source-station rollout receipt; package-derived groups, source adaptations, upload totals and rollback evidence remain linked. | [Exact source](https://github.com/dsbowersock/massagelab/blob/e74045c2fc85c2cb4df176fdb1aff2137c4d9848/docs/superpowers/plans/2026-06-19-atmosphere-rendered-piano-batch.md) | Restore blob `df60fe433dbc82fa044c814ca8bce05b92305d35` at the path in column 1 | retain in old repository only |
| `docs/superpowers/plans/2026-06-19-ci-build-cache.md` | [CI guide](../wiki/ci-pr-checks.md) and [workflow](../../.github/workflows/ci.yml) | Old v4/build:next recipe is superseded by current v6.1.0 cache and build:browser-qa workflow; CI guide owns operations. | [Exact source](https://github.com/dsbowersock/massagelab/blob/e74045c2fc85c2cb4df176fdb1aff2137c4d9848/docs/superpowers/plans/2026-06-19-ci-build-cache.md) | Restore blob `4b8463f1492c44a20cd1c4d723a8a835cd56b3c5` at the path in column 1 | retain in old repository only |
| `docs/superpowers/plans/chimer-music-player-inspiration-note-2026-07-06.md` | [Retained Chimer checklist](../superpowers/plans/chimer-redesign-implementation-checklist-2026-07-06.md) | Deferred inspiration only; checklist status and unimplemented music-player intent remain unchanged, with exact source link. | [Exact source](https://github.com/dsbowersock/massagelab/blob/e74045c2fc85c2cb4df176fdb1aff2137c4d9848/docs/superpowers/plans/chimer-music-player-inspiration-note-2026-07-06.md) | Restore blob `7b167d4644b2d7d4884fdee14c4c550052b21cca` at the path in column 1 | retain in old repository only |

Rollback is document-only: restore each listed source blob at its exact omitted path, or revert the bounded Phase 3 omission commit `49fba96`. Restoring a plan does not repeat its historical provider, upload, or runtime actions. All 28 specifications and 106 inherited retained plans remain; including the operative Phase 3 plan, the resulting directory counts are 107 plans and 28 specifications. Runtime, media, migration/parity evidence, tests, workflows, and all uncertain records remain outside this omission set.

## Phase 4 audit-only evidence — 2026-09-10

The four reports below were each run twice from the same clean committed index, `656394639464601c6e8b0833389c8272a95c2a95`. Each pair was byte-identical. Reports are measurements of static evidence, not cleanup instructions, and every report states `deletionAuthority: false`.

| Lane and exact command | Report and evidence SHA-256 | Classification counts | Scope counts | Status |
| --- | --- | --- | --- | --- |
| Dead code: `npm run --silent dead-code:audit` | Report `76915575657c0c0687c653986a83cd0fb709f8b7b487690897f796e17a7d0e80`; evidence `7f4de3d950d9b75bd5ad08ee0bde0fb4952c334e0f2125ae551d85608ed07db5` | 29 unreferenced candidates; 16 protected; 831 referenced; 667 roots; 186 uncertainties (171 framework conventions, 7 generated inputs, 1 manual script, 6 nonliteral imports, 1 unresolved literal) | Candidates: runtime 28, tool 1. Protected: runtime 5, test 3, tool 8. Referenced: runtime 751, test 25, tool 51, other 4. | Candidates remain `candidate`; guarded roots remain `protected`; dynamic/generated questions remain `unresolved`. |
| Dependency: `npm run --silent dependency:audit` | Report `5514fcaafd38f8360d93a485ecadb0f3a5045cf3aaef6799450f34d846cd0a9c`; evidence `5338169d953fdfcda6b4c6974fc15fecf9548d46814c627bbc466056528e2b53` | 133 dependencies; 17 dev dependencies; 141 referenced packages; 8 unreferenced declaration candidates (4 dependencies, 4 dev dependencies); 19 uncertainties | Literal owners: runtime 988, test 65, tooling 65, framework-build 10, other 3. Built-in owners: runtime 65, test 1,074, tooling 193, framework-build 2. Script/CLI/patch owners: tooling 74/13 and patch 1. | Declaration findings remain `candidate`; build-, tooling-, compiler-, dynamic-, and unresolved-literal evidence remains `unresolved`. |
| Asset: `npm run --silent asset:audit` | Report `cf1a17d1f42f9c9ca53346437945f73c6aef9eba1a47da8205b4c809cc242725`; evidence `e5d431e0f4a87e7102df0864d4021b618a0b071a624998affcd6e374e5df61ad` | 73 tracked assets; all 73 protected; 175 direct reference owners; 19 basename-only signals; zero unreferenced candidates; 2,001 uncertainties (526 dynamic expressions, 1,475 unresolved literals) | Tracked/protected: runtime 70, test 3. Direct owners: runtime 71, test 14, tool 86, docs 4. Basename signals: test 11, tool 8. | All assets remain `protected`; indirect and dynamic evidence remains `unresolved`. |
| Environment: `npm run --silent env:audit` | Report `ed6a4009cd3e545504c4b4ff61a08543934f02a063f1bf5429aa7fe640dddc93`; evidence `0c69052b96ebef824fd5d0bbb8973b8ab20a3c0d80794f2e0ec828c33e63d74d` | 79 declared keys; 329 static reads; 234 missing-declaration findings; 44 unread-declaration candidates; 13 computed-read uncertainties | Static reads: runtime 120, test 145, tool 50, other 14. Missing declarations: runtime 91, test 110, tool 26, other 7. Computed reads: runtime 1, test 11, tool 1. | Declaration/read mismatches and computed access remain `unresolved`. |

### Later corroboration required

| Candidate class | Evidence required before a later bounded proposal |
| --- | --- |
| Dead code | Prove direct and dynamic consumers, framework roots and conventions, generated inputs, runtime/build/test reachability, and any rendered visual/accessibility role. Check provenance/licensing, provider or object ownership, data/export/PWA compatibility, and an exact-blob rollback. |
| Dependency | Reconcile direct and dynamic imports, package scripts, framework/compiler/config roots, patches, generated code, and transitive consumers. Pass clean install, runtime, build, test, bundle, visual/accessibility, license/provenance and security review; check provider/data/PWA contracts; preserve a package-and-lock rollback. |
| Asset | Reconcile literal, basename-only and dynamic consumers, framework metadata roots, manifests, generated catalogs, runtime/build/test behavior, pixel/visual/accessibility use, provenance/licensing, provider/object ownership, caching and offline/PWA contracts, data/export references, and exact-byte rollback. |
| Environment | Reconcile direct and computed reads, framework/build roots, tests and operational tooling; verify runtime and user-facing failure behavior including accessibility. Confirm provider ownership, credential-rotation and legal/privacy boundaries, data/PWA compatibility, deployment documentation, and a reversible example/config rollback without exposing values. |

Deletion authority: **none**. No row may advance to `remove after proof` on this branch. All candidates remain present and retain status `unresolved`, `protected`, or `candidate` until a later plan supplies the class-specific proof, a bounded diff, validation, and rollback.

### Deterministic supporting receipts

- The inventory command `npm run --silent repository:inventory` was run twice and matched byte for byte: 1,914 tracked files, 47,112,296 Git blob bytes, report SHA-256 `27f6251e4e13aea58fb7bf4794ba7e5533467d40c40bd8346473992148459e9e`, and inventory SHA-256 `594628be03cd63d56b2fdb014a72d0820f024d8c6053d1ac67b01f46941142cd`.
- Earlier authority-document edits moved eight classified legacy-reference occurrences and removed one pre-rebrand public-copy occurrence. The candidate baseline kept schema version 1 and the same source commit; compatibility stayed 22,905, historical stayed 1,481, legal stayed 42, and pre-rebrand public copy changed from 1,953 to 1,952. After its self-reference fixed-point pass, the tracked baseline is byte-identical to a fresh `npm run --silent brand:audit -- --print-candidate-baseline` result at 5,984,749 bytes and SHA-256 `774ad9f3179213d25b2e0e5be463343e42bd49084fd16430673e1651e133e261`. `npm run --silent brand:audit` reports zero missing and zero unclassified references.
- `package-lock.json` remains the exact committed blob `0ca896d3ca82547cdc383100ba8986d92b30ec77`; no dependency version, candidate, runtime path, asset, environment key, provider object, or external state changed during this reconciliation.

### Historical final-review repair receipt — first staged capture, superseded

The Task 5 table above is an immutable historical capture. Its `kind`,
`evidenceSha256`, and nested `evidence` report contract is superseded for current
tooling by the exact top-level `auditKind`, `deletionAuthority`, `findings`,
`inventorySha256`, `schemaVersion`, `summary`, and `uncertainties` contract.
Before receipt-only documentation synchronization, the first fully staged repair
capture contained 1,921 files and 47,170,491 Git blob bytes. All four repaired
reports shared inventory SHA-256
`4d826fc678cbb9303eb43805ece57978f1910d958b69cd65038c037f4a8bf827`
and each passed two byte-identical silent executions with empty standard error:

| Lane | Current report SHA-256 and bytes | Current bounded classification |
| --- | --- | --- |
| Dead code | `ac5f292e82da5134f29b0c0c24e01cfdcaaa06f62625c62f8aafc71bb083da6c`; 273,359 bytes | 1,558 findings: 29 candidates, 21 protected, 836 referenced and 672 roots. The 186 uncertainties include one named protected negative fixture; unresolved literal-module errors are zero. |
| Dependency | `8c0ad3e2d171a549cea55d89548175d654b0b41e4d913ea7448fb714ad45c884`; 842,988 bytes | 2,858 findings; 19 uncertainties include the same named protected fixture. Unresolved literal-module errors are zero. |
| Asset | `d3b0fe054db44c73f7b42f84ea0d0a38270228c7a01677411e3cfddd4f92f7f4`; 752,047 bytes | 340 findings and 2,002 uncertainties: 526 dynamic expressions and 1,476 unresolved literals. No asset candidate is authorized for removal. |
| Environment | `b1b7db47add403da40156606065fd0bacb185d2bcc3cc5dbf0bd13a7948207db`; 251,117 bytes | 719 findings and 186 uncertainties. The previously false unread Stripe key is a proven static read. |

The focused suite for that staged capture passed 59/59. Brand audit remains zero missing and zero
unclassified with the same category totals, and the tracked 5,984,749-byte fixed
point remains stable. Candidate states and later corroboration requirements are
unchanged. These hashes describe the first staged capture, not an immutable final
commit candidate. After the synchronized receipt documents are staged, the
coordinator will run one exact final-index readback and retain its hashes in the
ignored SDD handoff and user-facing completion receipt rather than embed them
back into this self-hashed index. Repeat independent whole-branch reviews and the
coordinator-owned commit then remain; none is claimed complete here.

### Final repair-cycle receipt — staged local gate complete

The current bounded scanner repair adds hash-only sanitization for malformed or
path-like module specifiers; destructured default-parameter environment aliases;
explicit lexical shadowing and reassignment invalidation; static literal
`require.resolve()` ownership with hash-only nonliteral uncertainty; and shared
module/asset parity with the installed Next 16.2.12 zero-or-one-digit metadata
convention. Thus `icon9` is protected metadata while `icon10` remains a
lookalike candidate.

Repair validation first confirmed all three targeted regression groups failed
(0/3 passed), then passed them after implementation (3/3 passed); strict TDD
remained off. The pre-publication combined focused audit suites passed 64/64.
Hosted review round 1 then corrected environment evidence so assignment and delete
targets no longer count as reads; its focused slice passed 7/7, and the current
combined focused audit suites passed 68/68. That round's stage-0 semantic results were:

| Lane | Findings | Uncertainties | Hosted-review round 1 note |
| --- | ---: | ---: | --- |
| Dead code | 1,558 | 186 | 29 candidates, 21 protected, 836 referenced and 672 roots; unchanged. |
| Dependency | 2,859 | 19 | Includes one additional literal-import owner from static `require.resolve()` use. |
| Asset | 340 | 2,002 | 526 dynamic and 1,476 unresolved literals; no candidate is authorized for removal. |
| Environment | 612 | 178 | 79 declared, 202 missing, 306 static-read and 25 unread findings; 9 computed-read and 169 unproven uncertainties. |

Hosted review round 2 added config-alias, whole-object/computed environment, and
browser-snapshot coverage. Its focused repository audit suites passed 74/74,
and its historical stage-0 semantic results were:

| Lane | Findings | Uncertainties | Hosted-review round 2 note |
| --- | ---: | ---: | --- |
| Dead code | 1,558 | 186 | Candidate authority is unchanged. |
| Dependency | 2,859 | 19 | Candidate authority is unchanged. |
| Asset | 388 | 2,003 | Browser snapshots are covered; no candidate is authorized for removal. |
| Environment | 587 | 191 | Whole-object and computed environment access remain conservatively evidenced. |

Round 2's historical pre-document receipt-synchronization snapshot measured
47,216,441 Git blob bytes.

Hosted review round 3 added separately labeled exact declaration-companion/type
evidence, two exact configuration/manifest dependency owners, and owner-relative
bare asset paths that become exact only when tracked and in inventory and
otherwise remain hash-only uncertainty. That round's focused repository audit
suites passed 80/80, and its now-historical stage-0 semantic results were:

| Lane | Findings | Uncertainties | Round-3 semantic note |
| --- | ---: | ---: | --- |
| Dead code | 1,558 | 186 | 842 referenced modules and 23 candidates; implementation and declaration/type evidence remain distinct. |
| Dependency | 2,861 | 19 | Two configuration owners and 6 candidates; no runtime import is inferred. |
| Asset | 390 | 11,384 | 97 tracked assets, 97 protected items, 177 exact owners and zero candidates; 529 dynamic and 10,855 unresolved rows. |
| Environment | 587 | 191 | Unchanged from hosted review round 2. |

Hosted review round 4 moved exact configuration ownership into the validated
stage-0 policy and conservatively covered direct, aliased, wrapped, logical and
conditional whole-environment forwarding without changing asset semantics. The
focused repository audit suites passed 83/83: 21 repository-audit tests and 62
cleanup-audit tests. Its now-historical stage-0 semantic results were:

| Lane | Findings | Uncertainties | Round-4 semantic note |
| --- | ---: | ---: | --- |
| Dead code | 1,558 | 186 | 842 referenced modules and 23 candidates. |
| Dependency | 2,861 | 19 | Two configuration owners and 6 candidates. |
| Asset | 390 | 11,384 | 97 tracked assets, 97 protected items, 177 exact owners and zero candidates; 529 dynamic and 10,855 unresolved rows. |
| Environment | 587 | 250 | 77 computed and 173 unproven-alias uncertainties; zero unread-declaration candidates. |

Hosted review round 5 recognized runtime named `env` imports from the exact
`node:process` and `process` modules and preserved their evidence through
lexical loop/catch shadowing and function-scoped `var` behavior, including
assignment-free redeclarations. It also repaired the two historical receipt
anchors in the reference inventory. That round's focused repository audit suites
passed 86/86: 21 repository-audit tests and 65 cleanup-audit tests. Its now-historical
stage-0 semantic results were:

| Lane | Findings | Uncertainties | Round-5 semantic note |
| --- | ---: | ---: | --- |
| Dead code | 1,558 | 186 | 842 referenced modules and 23 candidates. |
| Dependency | 2,861 | 19 | Two configuration owners and 6 candidates. |
| Asset | 390 | 11,384 | 97 tracked assets, 97 protected items, 177 exact owners and zero candidates; 529 dynamic and 10,855 unresolved rows. |
| Environment | 587 | 252 | 79 computed and 173 unproven-alias uncertainties; zero unread-declaration candidates. |

Hosted review round 6 recorded nested object destructuring defaults sourced
from proven environment objects. That round's focused repository audit suites
passed 87/87: 21 repository-audit tests and 66 cleanup-audit tests. Its now-historical
semantic results were:

| Lane | Findings | Uncertainties | Round-6 semantic note |
| --- | ---: | ---: | --- |
| Dead code | 1,558 | 186 | 842 referenced modules and 23 candidates. |
| Dependency | 2,861 | 19 | Two configuration owners and 6 candidates. |
| Asset | 390 | 11,384 | 97 tracked assets, 97 protected items, 177 exact owners and zero candidates; 529 dynamic and 10,855 unresolved rows. |
| Environment | 587 | 252 | 79 computed and 173 unproven-alias uncertainties; zero unread-declaration candidates. |

At the verified round-6 staged code snapshot, the full suite passed 4,282
tests with 3 host-dependent skips and zero failures; typecheck and lint
passed.

Hosted review round 7 recorded exact tracked runtime package metadata
ownership, keeping `@generative-music/pieces-alex-bainter` out of unreferenced
candidates without claiming an executable import. The generic parser required
exact declared package names and versions and conservatively handled lexical
shadows, duplicate or overridden properties, and spreads. That round's focused repository audit suites passed 88/88: 21 repository-audit tests and 67
cleanup-audit tests. Its now-historical semantic results were:

| Lane | Findings | Uncertainties | Round-7 semantic note |
| --- | ---: | ---: | --- |
| Dead code | 1,558 | 186 | 842 referenced modules and 23 candidates. |
| Dependency | 2,863 | 19 | Two configuration owners, 1 runtime-package-metadata owner, 144 referenced packages and 5 candidates; metadata does not prove an import. |
| Asset | 390 | 11,384 | 97 tracked assets, 97 protected items, 177 exact owners and zero candidates; 529 dynamic and 10,855 unresolved rows. |
| Environment | 587 | 252 | 79 computed and 173 unproven-alias uncertainties; zero unread-declaration candidates. |

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
results were:

| Lane | Findings | Uncertainties | Historical round-8 semantic note |
| --- | ---: | ---: | --- |
| Dead code | 1,558 | 186 | 842 referenced modules and 23 candidates. |
| Dependency | 2,863 | 19 | Two configuration owners, 1 runtime-package-metadata owner, 144 referenced packages and 5 candidates; metadata does not prove an import. |
| Asset | 561 | 11,302 | 137 tracked assets, 137 protected items, 262 reference owners, 25 basename signals and zero candidates; 529 dynamic and 10,773 unresolved rows. |
| Environment | 587 | 252 | 79 computed and 173 unproven-alias uncertainties; zero unread-declaration candidates. |

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

Hosted review round 12 repaired two validated latest-head Codex findings:
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

Its now-historical semantic results were dead code 1,558 findings/209
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

At that snapshot, latest-head hosted checks and reviews remained pending before any separately
authorized merge of PR #3. No deletion, merge, provider mutation or Phase 5
action occurred; `deletionAuthority` remains false.

Hosted review round 13 repairs one validated latest-head Codex finding at
`3a10a1b`: nested exact plain or dotted singular/plural credential/secret
directory segments could bypass the fail-before-read guard. Those directory
segments are now rejected before metadata or blob reads, while lookalike names
remain allowed.

TDD validation recorded RED with 0 of 1 targeted test passing, then GREEN
1/1. The focused privacy/source-cap slice passed 8/8, and the CSS regression
slice passed 3/3. The authoritative staged repository audit suites passed
101/101. The full suite exited 0 with 4,299 tests: 4,296 passed, 3
host-dependent skips and zero failures. Typecheck and lint passed; the Babel
deoptimization note was informational.

Current staged semantic results are dead code 1,558 findings/209
uncertainties, including 22 `stylesheetUsage` and 2 `manualScripts`
uncertainties; dependency 2,863/19; asset 561/11,308; and environment
587/252. All four audits ran twice with byte-identical output, exit 0 and
empty stderr; every report retained `deletionAuthority: false`. Brand
verification remained at zero missing and zero unclassified references.

The historical pre-document-synchronization staged inventory contained
1,921 files and 47,381,374 Git blob bytes, with inventory SHA-256
`1bf7e63a2192b624816da03083b867d45d6611b51d37a7d8bb10fe99c6bbbe9a`
and zero forbidden tracked paths. This capture does not identify the index
after these versioned receipts are staged; current final-index bytes and
hashes remain outside these self-referential documents. Round-12 results
remain historical supporting evidence.

Latest-head hosted checks and reviews remain pending before any separately
authorized merge of PR #3. No deletion, merge, provider mutation or Phase 5
action occurred; `deletionAuthority` remains false.

The current tracked inventory remains 1,921 files. Brand verification remains
zero missing and zero unclassified. Exact current staged bytes and identity
remain in the ignored SDD handoff and user-facing receipt rather than this
self-referential versioned register, and every report keeps
`deletionAuthority: false`.

The earlier 59/59 staged capture, its hashes and the 4,249-test unit receipt are
historical and superseded for current-tooling decisions. Against the
pre-publication final staged repair, the complete suite passed 4,259 tests with
3 host-dependent skips and zero failures, and the 115-route production build
passed. At that snapshot, the coordinator still had to run one
receipt-synchronized exact-index readback.
Because a versioned receipt cannot safely embed the hash of an index containing
its own updated blob, final inventory and report hashes belong only in the
ignored SDD handoff and user-facing completion receipt. Those independent
whole-branch reviews, the final-index readback and the coordinator-owned commit
subsequently completed before separate publication authorization opened
[PR #3](https://github.com/dsbowersock/atmoshaper/pull/3).
PR #3 remains in hosted review; resolving hosted feedback and final
checks/review precede any separately authorized merge.

Deletion authority is **none**. All entries retain their existing `candidate`,
`protected` or `unresolved` status. No candidate deletion, rename, upgrade,
retirement, provider mutation, merge or Phase 5 action occurred.
