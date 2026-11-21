# AtmoShaper Project State

## November 21 sidebar/Calendar publication in preparation

The initial PR #77 review finds two Calendar display issues. An explicit
CodeRabbit CLI pass covers all 40 changed files at `03675e4`, repeats those two
issues and adds stale-practice personal fallback and test-server cleanup issues.
Focused corrections pass 98 ownership/navigation/controller checks and actual
phone/desktop/no-practice/split-source journeys. Hosted CI exposes two stale
sidebar screenshot baselines and a planner autosave check acting before draft
hydration. Four Linux baselines are regenerated; every changed pixel is confined
to the approved sidebar. The save check waits for the real readiness signal.
All six affected Linux phone/desktop journeys pass without snapshot updates.
The corrected head still needs fresh hosted checks/review and the bounded
CodeRabbit follow-up before merge. Its saved login is reported authenticated,
but the review service requires fresh private reauthentication; expired URLs
cannot be reused.
The owner also requests a separate, bounded retrospective CodeRabbit coverage
audit, isolated on `codex/coderabbit-coverage-audit`; that work does not reopen
old PRs or authorize an automatic app-wide rewrite.

The owner authorizes publication of the locally verified sidebar and private
Calendar work `db1790e`. Branch `codex/sidebar-calendar-publication` retains public
`0976d7d` and its local receipt. One reviewed/protected candidate, all current-head
checks, fresh settings/routing preflight and staged same-artifact verification
precede public promotion. Personal/practice ownership and current subscriptions
are preserved. No live result is claimed yet. See the
[publication plan](superpowers/plans/2026-11-21-sidebar-calendar-publication.md).

## November 21 sidebar and private combined Calendar verified locally

Local branch `codex/sidebar-calendar-workspace` reorganizes the sidebar into
Atmosphere, My Wellness, My Practice and Learn & Play. Clock & timer and Business
Planner each have one launcher. My Calendar and Practice Calendar open the same
workspace with Personal, Practice and Together sources. Together displays the
owner's private items beside one selected authorized practice; existing multiple
memberships remain selectable. Selected-practice creation and return paths are
preserved. Personal data stays owner-bound, read-only and outside scheduling
writes, availability/free-busy, preferences and external sync.

All 97 focused checks, 84 sync/isolation checks, 45 scheduling/cancellation checks,
the fictional-data phone/desktop Calendar journeys and both full-app sidebar
journeys pass. Whole-repository and focused lint pass. The final inert Next build
passes TypeScript and all 116 generated pages. The owner's individual-account,
multiple-practice and potential practice-fee note is recorded; billing design
remains unresolved and no subscription or membership is changed. This candidate
is not published; no live service or data operation occurs. See the
[local verification receipt](audits/2026-11-21-sidebar-calendar-workspace.md).

## November 20 remaining planners and light blue Body buttons published

[PR #76](https://github.com/dsbowersock/atmoshaper/pull/76) is public as
`0976d7d7ada270b9449be2c23a67bbe08e14f856`, with the same tree as reviewed
`a4c23ef`. Guided planner tools, named expenses/reserves, checklist answers, local
PDF reports and labelled cross-tool information reuse are published. All six
Wellness Body launchers use the existing light blue Secondary material; other
Wellness colors and features are preserved. Seven reviewed-source checks and
hosted review pass, including 5,821 unit checks, 45 backup checks and 702 browser
cases (two configured retries, then successful direct follow-up). All 32 focused
desktop/phone checks pass. Production gates, Sentry pairing, all 18 public routes,
same-artifact bytes, live phone containment and unchanged settings/mappings pass.
All seven merged-source checks also pass after retrying only one runner's failed
OS font installation. Three configured timing retries pass a six-case direct
desktop/phone follow-up. Final source/configuration/routing readback passes, and
the publication operation is verified and closed. See the
[publication receipt](audits/2026-11-20-planner-beta-publication.md) for exact limits
and draft recovery constraints. This local receipt causes no extra deployment.

## November 20 remaining planner publication in preparation

The owner authorizes publishing the remaining planner work, including PDF reports
and cross-tool source reuse, plus the six Wellness Body buttons in the existing
light blue Secondary material. Branch `codex/planner-beta-publication` starts
from public `f6b80fb` and local receipt `f769ca7`, integrating four planner commits
through `42006a9` while retaining the published Wellness features. Earlier local
release records are included. Other recovery checkouts and September media masters
remain preserved. Source review, focused/hosted checks and fresh service preflight
precede staged same-artifact publication. See the
[publication plan](superpowers/plans/2026-11-20-planner-beta-publication.md).

## November 20 Wellness, Exercise and My calendar published

[PR #75](https://github.com/dsbowersock/atmoshaper/pull/75) is merged as
`f6b80fb85cd1c6bfbd3077b02b4a3fcdf55b51cb`, with the same tree as reviewed
`b3fd1db`. The nine Wellness changes through `7446c75` are public; newer planner
work remains separate. All seven reviewed-source checks and hosted review pass,
including 5,806 unit checks, 45 backup checks, the inert TypeScript/116-page build
and 54 focused desktop/phone cases. The staged Production migration/payment gates,
Sentry script/map pairing, all 13 public routes and same-artifact byte readback
pass. Settings and unrelated aliases are unchanged; the prior release remains
available for rollback. Live Exercise, body loading and the signed-in owner's
personal calendar read succeed without saving records. The public Wellness page
is open; temporary viewport overrides are reset. All seven merged-source checks
also pass, including 680 browser cases without retries and 180 configured skips.
The publication operation is verified and closed; local receipt documentation
causes no extra deployment. See the
[publication receipt](audits/2026-11-20-wellness-beta-publication.md).

## November 20 Wellness publication in preparation

The owner authorizes publication of all Wellness updates through Exercise and
My calendar. The isolated `codex/wellness-beta-publication` branch starts from
public `7785ae6` and integrates only the nine Wellness changes through `7446c75`.
The newer planner runtime remains outside this release. Source integration,
fresh service preflight, review and hosted checks precede a staged Production
build and verified same-artifact promotion. No live result is claimed yet. See
the [publication plan](superpowers/plans/2026-11-20-wellness-beta-publication.md).

## November 20 Mind, Body, Context and private Calendar verified locally

The owner requests Mind for internal state, Body for physical recordings,
Context for surroundings, and recordings visible in Calendar. Branch
`codex/wellness-mind-body-calendar`, from `2598102`, regroups display-only
launchers and adds an owner-only My calendar view for every signed-in user,
without practice creation. Existing practice members retain scheduling and can
switch views; nonmembers open the private view by default, with explicit setup
still available. The Wellness companion uses the same calendar, including
anonymous in-memory practice entries. Month reads are owner-scoped, paginated
and independent of Timeline/report limits. Recordings remain separate from
practice events, Google sync and therapist access. All 85 Wellness checks and
30 Calendar/domain/controller/recovery checks pass, including account-change
isolation. Lint, two guards and the final inert TypeScript/116-page build pass.
All 54 desktop/mobile browser journeys pass in 6.4 minutes, including older
dates, record readback/deletion, reminder previews, keyboard controls, both
themes and narrow/enlarged text, plus existing body/feelings/ROM/Exercise flows.
In-app phone/desktop review passes. The temporary viewport is reset and the new preview
uses `http://127.0.0.1:3022/wellness`, open to the grouped tools. No publication
or live private-data, provider or database change occurred. See the
[implementation record](superpowers/plans/2026-11-20-wellness-mind-body-calendar.md).

## November 20 Exercise self-tracking verified locally

The owner requests a distinct exercise recorder with sets, reps, weight and
progress, also useful for recording an existing PT/OT routine. Local branch
`codex/wellness-exercise-tracking`, from `c158f69`, adds named exercises, optional
measurements and ratings, identity-only reuse and separate exercise history.
Consumer self-tracking uses the existing privacy/action/export/deletion owners;
anonymous recordings remain in memory. No therapist professional-record storage,
prescription, migration, dependency or publication is introduced. All 85 focused
checks, focused lint, both shell/style guards and the final inert TypeScript/
115-page build pass. All 50 desktop/mobile browser cases pass in 6.8 minutes,
including optional measurements, PT/OT, cardio, category drafts, latest-setup
reuse, distinct contexts/sides/units, history, deletion, delayed-script launchers
and existing body/feelings/ROM flows. Themes, narrow widths and enlarged text
pass. In-app phone/desktop review confirms a fresh Exercise form and aligned
set inputs; the temporary viewport is reset. Evidence is outside source. No
private recording, live provider/database operation or publication occurred.
Preview: `http://127.0.0.1:3021/wellness`, open to Exercise; existing tabs remain
untouched. See the
[implementation record](superpowers/plans/2026-11-20-wellness-exercise-tracking.md).

## November 20 Wellness recording flow verified locally

The owner finds Activity/Incident/Body check-in unclear and the recording type
buried beneath unrelated fields. Branch `codex/wellness-recording-flow`, from
`3e923dd`, puts the type first, tailors primary prompts and optional sections,
and gives each category its own in-memory draft. Named launchers now select
their named tool rather than continuing another category's draft. Stored tokens,
save/pending/privacy ownership and export contracts remain. All 76 focused checks,
focused lint, two shell/style guards and the final inert TypeScript/115-page build
pass. All 44 desktop/mobile browser cases pass, including exact launchers, first
control order, distinct prompts, native/controlled draft and section restoration,
separate saves, metadata isolation, body/ROM behavior and feelings touch gestures.
Both themes, narrow widths and enlarged text pass. In-app phone and normal
desktop views were reviewed; an Activity draft returned correctly after a type
change. Fictional review notes were discarded and the temporary viewport reset.
New clean preview: `http://127.0.0.1:3020/wellness`, open to Activity; existing
preview tabs remain untouched. Evidence is outside source. No publication or
private recording/live provider/database write occurred. See the
[implementation record](superpowers/plans/2026-11-20-wellness-recording-flow.md).

## November 20 continuous feelings wheel verified locally

The owner requests all word levels together and direct touch/mouse rotation,
preserving the reference wheel's comparative context. Branch
`codex/feelings-wheel-context`, from `695e260`, replaces drill-in navigation with
one three-ring wheel, direct drag rotation, pinch zoom/two-finger pan, overview
and reading views, keyboard navigation and full named alternatives. Selection
keeps parents and neighbors mounted. Gesture navigation never adds a feeling.
All 76 focused checks, focused lint, two shell/style guards and the inert
TypeScript/115-page build pass. Four final desktop/mobile browser cases pass,
including native Chromium touch emulation for rotation, tapping, pinch/pan and
cancellation, plus mouse, keyboard, multi/search/custom choices, draft retention,
timeline readback and theme/narrow/enlarged-text containment. In-app phone and
desktop views were reviewed and direct dragging confirmed; the temporary viewport
is reset. This is emulated touch coverage, not a physical-device check.
Stored words, draft/save/privacy ownership and local-first handling are unchanged.
See the [implementation record](superpowers/plans/2026-11-20-continuous-feelings-wheel.md).
New preview: `http://127.0.0.1:3019/wellness`; the existing preview tab was left
untouched. Evidence is outside source. No publication or private recording/live
provider/database change occurred.

## November 20 surface detail and category flows verified locally

The owner requests independent front/back/inner/outer surfaces, diagonal/top/
bottom views, optional body-part close-ups and finer points, with a general-area
choice. They also request a shared body for Body sensation/Incident, a feelings
wheel, a ROM shortcut, observational Work/Home prompts and distinct home
self-care. Three My Feelings Wheel screenshots subsequently supplied the word
navigation reference. Branch `codex/wellness-surface-detail` starts at `366951f`.
See the [implementation record](superpowers/plans/2026-11-20-wellness-surface-detail.md).

The local source adds a surface catalog, optional close-up explorer, original
wheel with named/search/custom alternatives, bounded emotion/context metadata,
timeline/report visibility and preference-sync exclusions. Old labels remain
unchanged. Existing save/pending/privacy ownership is retained; refinements
change only a current draft's broad parent. All 73 focused tests, 76 Sentry
checks, 24 preference checks, two shell/style guards, focused lint and the inert
TypeScript/115-page build pass. All 42 final desktop/mobile browser cases pass,
including actual surface taps, optional close-ups, independent saved labels,
wheel levels/multiple/search/custom choices, category drafts, timeline readback,
Work/Home prompts and existing ROM/comfort behavior. In-app 390x844 review
confirms the wheel and inner-forearm selection; the temporary viewport is reset.
Evidence remains outside source. Preview: `http://127.0.0.1:3018/wellness`, left
open to Feelings with a clean draft. No publication, private recording or live
provider/database write occurred. Drawing and reviewed tissue-atlas layers
remain separate follow-ons.

## November 20 sided and detailed Activity regions verified locally

The owner corrects the initial grouped Activity map: laterality, arm segments,
shins and profile views need more detail. Branch `codex/activity-sided-regions`
starts at `6efe58c`. Activity now offers 52 distinct left/right surface regions,
explicit Left side/Right side views, camera-facing marker visibility, grouped
named choices and individually removable selections. Old unsided values remain
unchanged and removable; other quick-log maps retain their broad choices. The
existing 16-region bound is visible/enforced so saves cannot silently truncate
new selections. Timeline can reveal every selected region beyond its first five.

Named areas are the default recommendation; optional drawing is a later
surface-annotation design, not an implemented sketch or tissue-identification
claim. The existing CC0 asset is one surface/rig, not a muscle/bone atlas.
See the [design and validation record](superpowers/plans/2026-11-20-activity-sided-regions.md).
All 64 focused tests, two style/shell guards, focused lint and the inert
TypeScript/115-page build pass. All 36 final desktop/mobile browser cases pass
after screenshot-led correction of floating markers using actual skin patches.
They include real profile/forearm and bilateral shin taps, arm-segment separation,
saved labels, full timeline readback, fallback/draft lifecycle, both themes and
narrow/enlarged-text containment. Rendered 390x844 profile/front screenshots were
reviewed. In-app control was unavailable due to a Windows cursor-access failure;
there was no manual in-app interaction with this build. Evidence remains outside
source. Preview: `http://127.0.0.1:3018/wellness` -> Activity. No private recording,
live provider/database operation or publication occurred. The regions remain
illustrative surface locations, without reviewed tissue identification.

## November 20 Activity polish and shared body regions verified locally

Branch `codex/activity-body-polish`, from `cd1ea12`, gives Activity a compact
form, optional context/detail sections and a bottom save action. Its Body
regions section reuses the existing free CC0 blue body with front/back/orbit
views, multiple selected regions, a selection summary and named alternatives.
The 15 existing unsided storage tokens remain compatible; this is broad region
selection, separate from ROM joint/movement IDs. Other quick-log tools retain
their region grids. Only the active, expanded Activity section owns a scene;
closing it preserves the selected values and all native draft fields.

The existing save/pending/privacy owner remains. Activity duration and activity
detail now survive the existing metadata normalizer with the same bounds as
body-sensation entries. No schema or clinical-store change is involved. All 61
focused tests, both shell/style guards, focused lint, TypeScript and the inert
115-page build pass. All 34 desktop/mobile browser cases pass, including real
front/back taps, multiple-region removal, retained drafts, duration/detail
timeline readback, no-model note-only recording and failed-model alternatives.
Narrow/enlarged-text containment and both themes pass. Manual phone review
confirms the body and selected regions; the viewport override was reset.
Evidence stays outside source.
See the [implementation record](superpowers/plans/2026-11-20-activity-body-polish.md).
Local preview: `http://127.0.0.1:3018/wellness` -> Activity. No publication,
private recording, live provider or database operation is included.

## November 20 expanded movements and separate comfort tool verified locally

The owner requests missing shoulder/forearm/hip/knee/foot motions plus hand,
finger and toe movements. Their clarification calls for separate Movement
comfort and Range of motion tools, each leading with its own recording and
offering the other optionally. Branch `codex/movement-comfort-checkins` starts
at `1c32975`. The shared recorder has independent drafts, explicit 0-10 comfort
ratings, optional combined records and descriptive same-movement/side trends.
The expanded rig uses actual finger bones; unsupported individual-toe animations
remain written guidance. The camera fits actual selected-limb geometry across
the authored motion so moving hands/feet remain visible. Ratings have an explicit
scale/direction and never replace degrees or generic symptom intensity. The
existing shared save owner, acknowledgement and clinical separation remain.

All 57 focused movement/Wellness checks, 76 Sentry checks, 24 preference checks,
two shared shell/style guards and consolidated lint pass. The final inert build
passes TypeScript and all 115 pages. All 28 final desktop/mobile browser cases
pass, including independent drafts, comfort-only/combined/angle-only practice
records, zero/endpoints, optional-field exclusion, same-movement/side rating
comparisons, new real-rig demos on both sides, written-only toe guidance and the
existing ROM sensor/baseline/fallback lifecycle. Phone/enlarged-text containment
and both themes pass. Manual in-app review confirms complete moving limbs and
the focused comfort form; the viewport override was reset. Evidence is outside
source. Preview: `http://127.0.0.1:3018/wellness`. See the
[implementation plan](superpowers/plans/2026-11-20-movement-comfort-checkins.md).
This work is local only. No private recording, live provider/database operation
or publication occurred. Real-phone repeatability/calibration and validated
biomechanics remain unestablished; the model is a direction illustration.

## November 20 guided ROM recorder and reusable body verified locally

The owner requests a phone-oriented joint -> movement -> recording flow,
plain-language presets and an interactive human body with movement previews.
Reference images allow blue illumination, skin or accurate muscles. The owner
clarifies that assets must be free; attribution is acceptable. Local branch
`codex/rom-guided-mobile`, from `42006a9`, uses a free CC0 surface/rig asset and
local Three.js, with no paid license or viewer service. The
[implementation plan](superpowers/plans/2026-11-20-guided-rom-body.md) records
provenance, preservation and test boundaries. Eight body areas and 26 everyday
movement choices lead through Body area, Movement and Record. The shared blue
surface viewer supports joint taps, rotation, closer demonstrations, bounded
pausable playback and reduced-motion still positions. Named choices and written
cues remain usable without 3D. The illustration never supplies a measured angle.
Manual entry, optional phone readings, custom movements and the existing save
owner/privacy boundary remain. Timeline entries now identify movement and side.

All 42 focused ROM/Wellness checks, two shared style/shell guards, focused ESLint,
TypeScript and the final inert 115-page build pass. All 22 selected desktop/mobile
browser cases pass across the acceptance run and targeted playback rerun. They
cover manual practice saves, phone permission/baseline lifecycle, failure paths,
actual joint picking/rotation, playback/reset/pause, reduced motion and narrow/
enlarged-text containment. Manual in-app review confirms the realistic blue
body and close-up demonstration. Evidence is outside source. Preview:
`http://127.0.0.1:3018/wellness` -> Range of motion. Sensor readings in QA are
synthetic; real-phone comparison and measurement accuracy are not established.
No publication, private recording, provider or database operation occurred.

## November 20 launch answers, reused planner facts and PDF reports verified locally

Local branch `codex/planner-reports-reuse`, from `37bdcbc`, adds written responses
to all 25 launch tasks, shared practice details and a seventh Report stage.
Checkmarks remain separate; resetting them preserves written work. The outline
reuses saved checklist, services, policies and separate financial scenarios,
without overwriting its eight narrative fields. Users can refresh sources and
choose which tools to include. Missing/unreadable drafts are identified; they
never become invented default estimates. See the
[implementation and verification record](superpowers/plans/2026-11-20-planner-reports-reuse.md).

Both tools offer on-device searchable PDF download and report-only printing.
All planner headers visibly state informational use and no legal, financial,
tax or accounting advice; reports require appropriately licensed/credentialed
professional review and identify further lender documents, estimates and gaps.
These are working drafts, not verified compliance or a completed loan package.
Pinned lazy PDF dependencies and an unmodified licensed self-hosted report font
leave the app fonts unchanged. Unsupported download characters have a visible
print fallback. Sources are drafts in the same browser; existing account-sync
ownership is unchanged. Export extended work before an old-client rollback,
because the old checklist normalizer cannot preserve the new answer metadata.

All 11 report/PDF tests, 49 planner tests, 24 preference tests, 17 SEO/identity
checks, two shell/style guards and focused ESLint pass. The final inert build
passes TypeScript and all 115 pages; all 30 desktop/mobile browser cases pass.
They cover old-draft migration, answers/reload/reset, source refresh/exclusion,
narrative preservation, actual PDF downloads, report-only print and failure
fallback, 320px/enlarged text and the existing financial workflows. Fictional
PDFs were text-extracted, rendered and visually reviewed, including long notes,
accented names and print-page margins. Manual in-app review confirms answer
fields and reused context. Evidence stays outside source. Preview:
`http://127.0.0.1:3018/tools/business-planner`.
No live account, provider, database or publication operation occurred.

## November 19 Income Planner expenses, benefits and time expansion verified locally

Income now has named monthly/yearly/session expense lists with add/remove and
saved amounts, frequency-aware session budgets, optional personal benefits and
reserves, desired-days-off/daily hands-on prompts, per-appointment support time,
visible chart prices with cents and a result-to-wage-field return action.
Local branch `codex/income-expenses-benefits` starts from `1e8c708`. The
[implementation plan](superpowers/plans/2026-11-19-income-expenses-benefits.md)
records the additive saved shape, legacy-total migration, budget/set-aside model,
time assumptions and verification. Legacy totals become named rows, including
fractional unit-cost precision; explicit empty lists stay empty. Personal reserve
budgets add to spendable take-home before the user's set-aside is applied. No tax
deductions or contribution limits are inferred. Monthly/yearly session budgets
stay fixed in capacity comparisons; per-session costs scale with appointments.
Support/admin hours add to displayed workload without silently reducing the
hands-on hours entered. Existing default estimates remain unchanged.

All 49 planner tests, 24 preference tests, 24 desktop/mobile browser cases,
17 SEO/identity checks, two shell/style guards and focused ESLint pass. The final
inert build passes TypeScript and all 115 pages. Browser checks cover named-row
edits/frequencies, reload, last-row removal, exact estimates, visible bar labels,
wage-jump focus and 320px/enlarged-text containment. Chrome review confirms
prices with cents and a return to the actual wage field, without client errors.
The local preview remains at `http://127.0.0.1:3018/tools/business-planner/income`.
Evidence is outside source. No live account, provider, database or publication
operation occurred. Older-client rollback needs an exported extended draft;
reverse-schema compatibility is not claimed.

## November 19 Business Planner polish and steppers completed locally

Local branch `codex/business-planner-steppers`, from published `7785ae6` and its
completion receipt, polishes the hub and all six tools. The compact hub shows
six centered orange Glow outline tool buttons; every worksheet shares a
compact header and accurate save state. Income, Break-Even, Service Menu, Launch Checklist and
Plan Outline have staged navigation with Back/Continue and direct section
jumps. Add-On Profit keeps its inputs and live results together. Monetary and
duration fields have units and linked guidance. Original financial models,
defaults, field IDs, storage schemas/keys and account-sync ownership remain.
Input steps stay mounted; Income's result chart mounts only when visible.
Visiting a step never marks checklist tasks or outline sections complete.

Validation passes: all 46 planner calculation/source/storage tests, 22 actual-app
desktop/mobile Chromium checks, 17 SEO/identity tests, two shell/style guards,
focused ESLint and the inert TypeScript/115-page app build. Browser coverage
includes all stages, Back/direct jumps/focus, draft reload, calculation results,
add/remove/reset, 320–412px phones, landscape/desktop, 24px root text and the
hub in both themes. A narrow enlarged-text Minutes field was corrected without
weakening containment assertions. Manual Chrome review finds no client errors.
The local preview is open at `http://127.0.0.1:3018/tools/business-planner`.
Screenshots/build evidence stay outside source. See the
[implementation and verification record](superpowers/plans/2026-11-19-business-planner-steppers.md).
The owner's subsequent orange Glow refinement passes fresh focused ESLint,
the inert TypeScript/115-page build and both hub browser cases (desktop/mobile,
phone widths, enlarged text and both themes); the worksheet matrix above is
the preceding implementation baseline. Chrome confirms all six links use Glow.
This task has no publication, provider, database, payment, email or live-account
operation. Hosted review/checks and a new publication remain separate work.

## November 19 Wellness and planner updates published

Reviewed `724a151` on [PR #74](https://github.com/dsbowersock/atmoshaper/pull/74)
passes all seven hosted jobs and fresh review, then merges as tree-identical
`7785ae6`. The compact Income/Break-Even guidance and grouped, centered Wellness
hub are live. The complete-draft correction preserves category and details
across launcher navigation. The stale SEO source assertion is aligned with the
approved compact heading while retaining the existing search metadata.

The actual Production build passes all 46 read-only migration checks,
all-payments readiness, TypeScript/115 pages and both Sentry uploads. The
emitted Wellness script and referenced map match the merge release's 523/2,612
file archives. All 12 staged/public entry routes, font/artwork and canonical
redirect pass. One same-artifact promotion updates six public mappings;
36 unrelated baseline mappings, the expected new Preview alias and all 87
Production setting metadata entries remain intact.

Live Chrome confirms all three layouts, field units/help, colors, centering
and breathing shortcut/focus return without captured warnings/errors or
horizontal overflow. No worksheet values are edited or Wellness entries saved.
One hosted mobile shortcut case passes its configured retry; earlier Preview
hydration behavior does not recur on reload, a fresh tab, staged/public reads.
Physical-phone and Safari acceptance remain owner checks. Compatible `fa3a030`
remains READY for rollback. See the
[completion receipt](audits/2026-11-19-wellness-planner-publication.md).
The operation is closed; these local receipt records trigger no extra build.
Earlier pending/local-only entries below are historical checkpoints.

## November 19 Wellness and planner publication approved

Corrected runtime `1719246` passes fresh hosted review with no findings and
protected Preview acceptance. The hosted unit suite identifies one stale SEO
source assertion expecting the intentionally replaced long Wellness heading.
Its correction checks the compact heading, the unchanged metadata binding and
the route's existing search description separately. All 17 SEO/identity checks
pass locally. Application source is unchanged by this test-only correction;
all four hosted browser lanes pass on the corrected runtime. The final
candidate still requires fresh hosted checks before merge.

PR [#74](https://github.com/dsbowersock/atmoshaper/pull/74) has a READY protected
Preview and passing route/asset readback. Hosted review finds that switching
recording launchers can relabel an unfinished shared draft. An isolated browser
regression reproduces Incident becoming Sleep. The focused correction seeds a
launcher category only for a fresh form and retains native/body-map edits until
a successful save. All 11 action lifecycle checks, focused lint and the inert
TypeScript/115-page build pass. All four desktop/mobile Wellness cases pass,
including the complete-draft regression, with no retries/skips. The corrected
source must pass fresh hosted checks before merge.

The owner requests publication of the verified `ae3d327` application on
`codex/planner-wellness-polish`: both planner guidance/layout improvements and
the latest grouped, centered Wellness launchers. Fresh service preflight,
current-head hosted review/QA, protected Preview, gated Production build,
authenticated Sentry map proof and same-artifact promotion precede live
acceptance. Public `fa3a030` remains the rollback baseline. The new
[publication plan](superpowers/plans/2026-11-19-wellness-planner-publication.md)
owns this operation; previous campaigns stay closed. Earlier local-only status
below records the accepted implementation checkpoint.

## November 19 planner guidance and Wellness hub ready locally

The owner's latest Wellness grouping uses the regular blue Breathing Guide and
unchanged Glow Music buttons. Physical sensations contains Range of motion,
Activity, Incident and Body check-in in orange; Context contains Work context,
Feelings, Sleep and Home care in teal. The three Review & plan buttons remain
green, with centered icons, titles and subtitles throughout. Focused lint, the
inert 115-page TypeScript/build and both existing desktop/mobile Wellness flow
cases pass, including narrow widths, enlarged text and draft/navigation checks.
Connected Chrome confirms all four groups, colors and Feelings/return navigation
without captured warnings/errors. This remains an unpublished local preview.

The owner requests a compact Break-Even layout matching Income, visible money
and time units, clearer input guidance in both planners, and a Wellness landing
hub instead of every form stacked on one page. Local branch
`codex/planner-wellness-polish` starts from published `fa3a030` and its completion
receipt. Shared field units/help and compact planner geometry are implemented;
Wellness now has grouped launchers and one selected pane while retaining drafts,
existing action owners and `/wellness#quick-log`. All 46 planner, 11 action
lifecycle, 62 clinical/Wellness and two shared-shell/inventory checks pass.
Focused lint and the inert TypeScript/115-page build pass. All 14 selected
desktop/mobile browser cases have passing evidence across the final sweep and
focused visible-heading readiness correction, recorded in the plan.

Responsive checks cover 320–412px, landscape, desktop and 24px root text,
including open check-in/ROM panes. Calculations, saved drafts, add/remove/reset,
tool selection, unfinished-entry retention, practice entry, timeline/pattern
access, Quick Log hash navigation, focus return and breathing shortcut pass.
Connected Chrome confirms all three local views and appointment-tool navigation
without captured warnings/errors. The loopback-only review preview runs on
port 3018; physical-phone and Safari acceptance remain owner checks.

Calculators, defaults, storage keys, server queries/actions and schemas remain
unchanged. This work is not published and does not reopen the closed publication
operation. See the [implementation plan](superpowers/plans/2026-11-19-planner-guidance-wellness-hub.md).

## November 19 Business Income Planner fixes published

Reviewed `dc37c3b` on [PR #73](https://github.com/dsbowersock/atmoshaper/pull/73)
passes all seven hosted jobs and merges as tree-identical `fa3a030`. Its actual
Production build passes read-only status for all 46 migrations, all-payments
readiness, TypeScript/115 pages and both Sentry uploads. The emitted planner
script and referenced map match the new release's 522/2,608-file archives.

One same-artifact promotion completes six public mappings. All 35 unrelated
baseline mappings and all 87 Production setting metadata entries are preserved;
one expected planner Preview alias makes 42 total. Ten staged/public entry
routes, emitted planner/clock-font bytes, artwork and canonical redirect pass.
Live Chrome confirms the compact heading, contained fields/results and working
optional guidance without captured warnings/errors or edits to the existing
worksheet. Exact phone/enlarged-text coverage comes from synthetic browser QA;
physical-phone and Safari acceptance remain owner checks.

Compatible `81b18e8` remains READY for rollback. The operation is completed and
closed. These completion records stay local on
`codex/business-income-publication-receipt` and trigger no additional build.
See the [receipt](audits/2026-11-19-business-income-publication.md). Earlier
pending/local-only entries below are historical checkpoints.

## November 19 Business Income Planner publication approved

The owner now requests publication of the planner fixes. Release branch
`codex/business-income-release` integrates the previously verified `0d48772`
patch with published `81b18e8` and its completion records. Existing breathing
and Clock corrections remain included. The planner changes only its layout,
presentation and corresponding synthetic fixtures; calculations, storage
contracts and account synchronization remain unchanged.

Integrated validation and fresh provider preflight precede one review PR and
protected Preview, hosted checks, a real gated Production build with Sentry
maps, same-artifact promotion and public readback. The current compatible
published release stays available for rollback. See the
[planner publication plan](superpowers/plans/2026-11-19-business-income-publication.md).
Earlier local-only and pending-sign-in entries below are historical checkpoints.

## November 19 breathing guide and centered bold clocks published

Corrected `7577cec` on [PR #72](https://github.com/dsbowersock/atmoshaper/pull/72)
passes all seven hosted jobs and merges as tree-identical `81b18e8`. Its actual
Production build passes all 46 read-only migration status checks, all-payments
readiness, TypeScript/115 pages and both Sentry uploads. The emitted script and
referenced map resolve inside the new release archive. Nine staged/public entry
routes, reviewed bold-font bytes, actual artwork and canonical redirect pass.

One same-artifact promotion completes six public mappings; all 34 unrelated
original aliases remain unchanged. One expected Preview alias makes 41 total.
All 87 Production setting metadata entries remain unchanged. Live Chrome
confirms breathing controls/viewport fit and centered 700-weight Clock/setup
digits without captured warnings/errors. Physical-phone/Safari checks remain
owner acceptance. See the [receipt](audits/2026-11-19-breathing-clock-publication.md).

Previous compatible `adb137e` is retained READY; no rollback is needed. The
operation is closed. These completion records remain local-only on
`codex/breathing-clock-publication-receipt` and trigger no additional deployment.
The separate planner candidate remains local at `0d48772`.

## November 19 approved breathing/Clock publication under review

The owner requests publication of the breathing guide and Clock fixes. Fresh
Vercel CLI sign-in succeeds. All 87 Production setting metadata entries match
the accepted configuration, payment scope is `all-payments`, automatic domain
assignment is off and the existing public release remains READY at `adb137e`.
The original `e944178` is pushed once as
[PR #72](https://github.com/dsbowersock/atmoshaper/pull/72); its protected Preview
passes nine entry routes, the actual reviewed bold-font hash and artwork.

Hosted review identifies enlarged-text landscape overflow, reproduced locally
at 667x375/24px. A focused container-width correction and expanded page/overlay
checks are being prepared before the PR update. Screenshot review also finds
the breathing dialog below the wide-phone sidebar; the reproduced stacking
defect receives a breathing-only correction. All 16 corrected-runtime local
desktop/mobile cases, focused lint and the inert 115-page TypeScript/build
pass. The original hosted unit job also flags two stale source guards: a fixed
stylesheet count and a route-key ban that must remain on shared owners while
permitting only the ephemeral guide controller. Both corrected checks pass with
their protections intact before the single PR update. See the
[publication plan](superpowers/plans/2026-11-19-breathing-clock-publication.md).
No merge, actual Production build or public promotion has occurred yet.

The Business Income Planner repair is independently ready locally at `0d48772`
on `codex/business-income-mobile`, with its own records and inert port-3018
preview. It is not included in this approved breathing/Clock release.
## November 19 Business Income Planner phone repair ready locally

The owner's phone screenshots reveal sideways scenario/input/result overflow
and an oversized introductory callout. A separate local branch,
`codex/business-income-mobile`, replaces the callout with a compact tool heading,
save indicator, business-tools back link and optional guidance. Four compact
scenario choices share one selected description. Explicit zero-minimum grid,
field and chart sizing removes intrinsic overflow; result tiles adapt to their
available width. Calculations, preset values, storage keys, account/device save
behavior and shared theme components are preserved.

The old QA build reproduces 223px of nested overflow at 320px. The repaired
candidate passes four actual-app desktop/mobile cases covering 320–412px phones,
enlarged text, landscape, desktop, all presets, result recalculation, device-draft
reload and navigation. All 46 existing planner checks, focused lint and the inert
115-page TypeScript/build pass. Connected Chrome confirms the compact default
view and optional guidance with no horizontal overflow or captured errors.
Physical-phone and Safari acceptance are not claimed. See the
[planner implementation and results](superpowers/plans/2026-11-19-business-income-mobile.md).

The local review tab uses `http://127.0.0.1:3018/tools/business-planner/income`.
This branch remains unpublished. The owner-approved breathing/Clock release is
separate and its source is unchanged at `e944178`; fresh Vercel CLI sign-in is
required before publication can proceed. No release push, merge or deployment
has occurred during this work.

## November 19 breathing text correction and centered bold clocks ready locally

The owner identifies text spilling from the breathing preset buttons, then
reports upward-shifted/thin digits in Clock and timer setup. These are corrected
locally on `codex/breathing-guide-mobile`; the earlier viewport-bound checks
below did not establish text containment inside each button.

Breathing preset rules now outrank shared button size utilities, use intrinsic
two-row sizing, retain intact names and widen to rows at large text sizes.
Actual text-line rectangles remain inside every tested button face at 320,
360 and 390px with 16/20/24/32px root text, plus short landscape. Ordinary phone
fit, shortcut/focus and music/background continuity still pass.

Clock/Chimer and duration setup use the author's unmodified DSEG7 Modern Bold
v0.46 through a clock-only alias with normalized line metrics. Space is included
so the browser uses those metrics rather than the fallback font's line box.
Clock's explicit upward 4dvh translation is removed; setup centers its digit
row. Saved `digital` selections, other font choices, readable unit labels and
the original Regular `Digital` face used elsewhere remain intact. The existing
original OFL notice matches the release byte for byte.

Accepted checks: 49 clock/layout/font tests and 16 actual-app desktop/mobile
browser cases pass with no skips, retries or terminal failures. Focused lint and
the inert 115-page build, including TypeScript, pass. Tests cover centered visible
font pixels, true bold loading, digit widths, 12/24-hour and seconds displays,
phone/landscape/desktop Clock, setup and running-timer geometry, and enlarged
breathing labels. Connected Chrome confirms centered bold Clock/setup digits,
contained preset text and no captured browser warnings/errors. No physical-phone
or Safari acceptance is claimed.

The [breathing correction record](superpowers/plans/2026-11-19-breathing-guide-mobile.md)
and [clock plan/results](superpowers/plans/2026-11-19-clock-vertical-centering.md)
record the evidence and scope. A loopback-only inert preview remains available
for review. No push, hosted Preview, provider write or deployment occurs; the
accepted public release is unchanged.

## November 19 breathing workspace and quick access ready locally

The owner's phone screenshot drives a focused redesign on
`codex/breathing-guide-mobile`. The full breathing page now uses one viewport
workspace, the existing green/purple button materials, a continuously paced
circle and compact timing/actions. It fits the tested normal phone and short
landscape sizes with and without the active music player. Enlarged text can
scroll vertically while keeping all actions reachable without horizontal overflow.

Alt+Shift+B opens a lazy breathing dialog over other routes; Escape closes it
and restores focus. The current route, background and media owners stay mounted.
On the breathing page the chord focuses the existing primary action instead of
creating another guide. Typing, composition, repeats, handled keys and unrelated
dialogs retain their keyboard ownership. Preset durations remain unchanged.

Accepted local verification: 26 timeline/chord tests, 162 QA-isolation/harness
tests, 15 desktop/mobile browser passes and one desktop-inapplicable skip;
lint, TypeScript and the inert-provider 115-page build pass. The browser matrix
covers 320×568 through 412×824, 667×375 landscape, 200% root text and reduced
motion. Native media calls and background-node continuity are unchanged while
the overlay opens/runs/closes. Connected Chrome also verifies page controls,
light/dark themes and quick access above Clock with focus restored afterward.
These are local Chromium/fixture results, not physical-phone, Safari or speaker
output acceptance. Early immediate-pause/large-text defects are fixed and the
final selected browser run has no retry or terminal failure.

The [implementation and validation record](superpowers/plans/2026-11-19-breathing-guide-mobile.md)
records scope and limitations. No push, hosted Preview, merge, provider write or
deployment is performed. The previously accepted public release below remains
unchanged; publication requires separate authorization.

## November 18 Google Voice support contact accepted; final invitation pass complete

The owner supplies an existing active Google Voice number for AtmoShaper and
authorizes using it instead of the temporary salon line. Fresh Stripe preflight
matches the salon contact and branded public fields. Changed only the support
phone and saved once. Static saved-summary and reopened-editor reads verify the
Voice contact, absent salon contact, receipt/invoice phone display still off and
all other visible public fields unchanged. Closed the editor without another
save. Private verification/recovery settings and transactions remain untouched.
The [privacy receipt](audits/2026-11-18-public-contact-privacy.md) supersedes the
temporary-contact choice without a new service, subscription, port or deployment.

Fresh read-only Vercel resolution of the canonical public host is READY on the
approved `adb137e`, and GitHub main remains that same source. All 13 selected
anonymous public page/manifest requests return 200, with no generic server-error
surface or personal Gmail in rendered content. Registration is open and offers
Google and email/password entry with its onboarding target. The install manifest
has AtmoShaper name/short name, root start URL, standalone display and four icons.
These are entry/metadata checks, not new-account, install or offline acceptance.

The [small-beta handoff](audits/2026-11-18-beta-handoff.md),
[tester guide](beta-tester-guide.md) and copyable
[invitation/first-session plan](beta-invitation-draft.md) are ready locally.
No invitation, new account, mail, payment or live clinical-data workflow is
created. No known blocker remains in the documented small-beta scope. The
first regular 03:00 backup is still future; the owner should also check the Voice
greeting/continued number activity. Broader migration/content/marketing gates,
the recorded development-tooling finding and unrelated test retry remain separate
follow-ups. Earlier temporary-phone and pending-contact sections are historical.

## November 18 temporary business support phone saved and verified

The owner selects the existing salon number for temporary AtmoShaper support,
confirms its exact digits and that callers can reach the owner or leave an
AtmoShaper message, and approves replacing only Stripe's public support phone.
One save completes that field change. The saved public summary and reopened
editor agree: the salon contact replaces the personal cell, receipt/invoice
phone display stays off, and all other visible public-contact fields match the
pre-save form. The editor is closed without a second save. Private verification
and recovery phones are outside this operation and remain untouched.

The [privacy receipt](audits/2026-11-18-public-contact-privacy.md) closes the
personal-cell item. The small-beta handoff is accepted again within its existing
scope; a dedicated AtmoShaper phone service remains an optional later choice.
Research finds inactivity/recycling limits on the examined free services, not a
verified permanent free-number solution. No phone account, subscription, port,
payment, email, application deployment or unrelated provider change occurs.
The earlier pending-phone section below is historical and superseded.

## November 18 customer-facing privacy review; support phone replacement pending

The owner narrows account cleanup to information customers actually see.
Fresh public-page/source and live Stripe reads find correct AtmoShaper support
email/name branding on the checked surfaces. Prior verified Google consent and
branded recovery-mail evidence are retained. No private administrator-account
consolidation or new payment/mail campaign is needed for this goal.

The owner identifies the configured Stripe public support phone as a personal
cell number. Receipt/invoice display is already off, but Stripe says card/bank
statements still show the support number. Its US requirements call for a valid
customer-support number. A business replacement is needed to meet the owner's
privacy preference before payment beta outreach. Await the selected number;
do not invent one, change private verification phones or remove legal identity.
The public editor is cancelled without a save. No provider/deployment change.
The [privacy receipt](audits/2026-11-18-public-contact-privacy.md) records the
checked surfaces, source limits and one-field replacement scope. The accepted
release checks below remain valid; this new customer-contact item is unresolved.

## November 18 final release accepted; small beta handoff ready

The owner-approved corrected head `1748230` passes all seven hosted CI jobs on
PR #71 and merges once as `adb137e` with an identical Git tree. Hosted results:
5,721 JavaScript passes/five skips; 45 backup passes/one optional skip; 615 browser
first-attempt passes plus one configured-retry success and 180 matrix/opt-in
skips, with zero terminal failures. The unrelated mobile heading locator retry
is recorded, not hidden. The reviewed backup fixture finding is resolved.

The one actual Production build passes all 46 migrations without applying one,
live all-payments readiness, TypeScript and 115 pages. Its client/server Sentry
uploads and emitted-script association pass. Seven staged and seven public
entry requests, real Linux artwork and the canonical apex redirect pass. One
same-artifact promotion completes all six mappings; 34 unrelated aliases and
all 87 Production settings are unchanged. READY `8d89550` remains the compatible
rollback. The publication operation is complete and its write authority closed.

Live owner readback proves selectable Skybreak through independent Admin access,
retained refunded ownership, no duplicate acquisition controls, unchanged two
credits and the same successful original $1.07 refund/history. No preference,
cart, payment, refund or entitlement mutation is repeated.

The correct AtmoShaper-profile Chrome extension now works. Read-only Google
inspection matches the deployed Calendar client and confirms External/In
production, verified AtmoShaper branding and no required data-access verification.
All three requested Calendar scopes are non-sensitive; no Google setting changes.

The [final publication receipt](audits/2026-11-18-beta-final-publication.md),
[small-beta handoff](audits/2026-11-18-beta-handoff.md) and
[tester guide](beta-tester-guide.md) now support the documented small,
owner-led beta. Derrick monitors `atmoshaper@gmail.com` and sends invitations;
none are sent by the agent. Keep tests invented and clinical vaults local-first.
The first regular backup is still due November 19 at 03:00 America/New_York;
scheduled-context export, encrypted restore and failure-alert acceptance already
pass. Review that run afterward without repeating a closed campaign. Broader
migration, held media/rights, marketing and legacy retirement remain outside
this acceptance. Postpublication documentation is local-only, not another build.
Earlier pending-release/refund sections below are historical and superseded by
this dated checkpoint.

## November 18 publication approved; test-only review correction prepared

The owner approves candidate `d04b785` and its bounded publication/readback.
Fresh preflight preserves main/public `8d89550`, its READY rollback, all six
mappings and all 87 Production settings. Manual domain assignment and the
existing all-payments scope are verified. One push and PR #71 create a healthy
protected Preview; its authenticated root returns 200 through existing access,
without creating a share link. The hosted browser build and all 5,721 applicable
JavaScript checks pass, with five explicit skips out of 5,726. Code quality
fails only the backup fixture described below; four browser lanes remain running.
No merge, Production build, promotion or live transaction
occurs.

Hosted review finds a real filesystem-order dependency in one synthetic backup
test. Ubuntu reproduces the failure. A local test-only correction gives the
designated fresh run strictly later timestamps and exercises forward/reverse
directory order. Windows and isolated native-Ubuntu backup suites both pass
45 tests with one optional age-tool skip. Application/backup runtime source and
the validated dependency/migration tree are unchanged. The full JavaScript and
browser results below remain `d04b785` evidence, not new hosted-head results.
The [amendment packet](superpowers/plans/2026-11-18-beta-final-acceptance-publication.md#test-only-review-amendment)
requires approval for the new exact head and one additional PR push/Preview
before the same gated publication can continue. Public source stays `8d89550`;
invitations remain on hold. The consumed original refund stays closed.

## November 18 original refund recovered; local access correction passes

The new exact approval is completed: one runtime key permission is saved and
verified, then the original $1.07 refund is resumed once with its original
metadata/idempotency key. Stripe and the app agree on success, the signed refund
receipt is processed, and order/payment/purchase ownership converge to refunded
and revoked. Membership, two credits, Admin authority and history are preserved.
The failed write-only credential reader ran no refund command; the guarded
execution used the original encrypted runtime-key copy privately. No new
purchase, refund record, key, migration or deployment occurred. The
[recovery receipt](audits/2026-11-18-owned-refund-recovery.md) closes that campaign.

A fresh Clock check exposes a separate adapter defect: an inactive ownership
row disables selection even with an independent current premium grant. The local
correction preserves independent membership/temporary/Admin/free use while
retaining revoked ownership and blocking duplicate acquisition. All 98 focused
checks, 34 desktop/mobile commerce journeys, full lint/typecheck and the inert optimized
115-page build pass. Full regression passes: 5,722 passed, four explicit
platform/catalog skips, zero failed/cancelled out of 5,726 total. The
[local receipt](audits/2026-11-18-post-refund-background-access.md) and
[correction plan](superpowers/plans/2026-11-18-post-refund-background-access.md)
own the narrow client fix and inert regression/browser checks. The candidate
also consolidates the tested beta operations tools/records; it is not published.
Public source remains `8d89550`; its READY artifact and manual domain-assignment
setting were rechecked. A [publication packet](superpowers/plans/2026-11-18-beta-final-acceptance-publication.md)
is prepared, not approved. Invitations stay on hold; no further payment
or expired operation is authorized by this checkpoint. Older pending-refund
entries below are historical and superseded by the successful recovery above.

## November 18 patched all-payments release published; owned live checks approved

The owner approved the exact release/configuration and bounded payment/lobby
checks. PR #70 merged as `8d89550`; its tree equals reviewed `99c297b`. Created
and individually verified only the 18 approved Production settings; complete
metadata/name checks confirm all 69 prior settings were untouched. The one real
Production build passes the 46-migration and all-payments gates, compilation,
TypeScript and 115 pages. New Sentry archives and a deployed client debug ID
match the exact release. Eight staged/public page/artwork checks pass, and one
promotion completes all six mappings without changing unrelated aliases.
The prior READY `cdea4a6` remains rollback. See the
[activation receipt](audits/2026-11-18-beta-purchase-activation.md).

One-time support and $1 U.S. backgrounds are now enabled. The approved one-lobby
Ably check passes: dedicated-key WebSocket/TLS authentication, room-only token
capability, attached channel and backend events are observed. End runs once,
both views reach recap/review, provider connections return to zero and a scoped
aggregate confirms one REVIEW room, one player, zero game runs and normal
expiry. The [campaign](audits/2026-11-18-offered-ably-connection-check.md) is closed
without gameplay or deletion. Both owned payments pass: $5 One-time support and
$1.07 Skybreak including $0.07 tax, totaling $6.07 within the $7 cap. Support
creates no entitlement change; signed background fulfillment and its purchase
ownership are verified. The owner's one $1.07 app refund submission is retained
as PENDING with suspended purchase ownership, but Stripe rejects the processor
call with 403 `more_permissions_required`. Exact-payment reads return no refund.
The runtime key needs the combined Charges and Refunds Write capability; the
one-field change is prepared but unsaved. A guarded local command on
`codex/beta-refund-recovery` prepares one original-record resume, with 81 focused
checks passing. Fresh permission/credential/recovery approval is required; no
automatic retry, replacement refund or batch reconciliation ran. Invitations
remain on hold. The published artifact/settings are unchanged, and the expired
release window has not been reused for a rollback or another build.
The [beta handoff checkpoint](audits/2026-11-18-beta-handoff.md) now records the
carried-forward scopes, monitored support contact and outstanding refund
recovery. The original payment campaign stopped at the rejected refund. Later
prepublication sections below are chronological snapshots superseded by this
published-release entry.

## November 18 corrected security candidate; payment activation prepared

Candidate `99c297b` on [PR #70](https://github.com/dsbowersock/atmoshaper/pull/70)
contains the published Calendar fix, the supported CI correction and the patched
runtime dependency set. Prisma generate/validate, clean lint, typecheck, 19
dependency/artwork/inert-mail checks, 76 Sentry/privacy checks and the optimized
115-page build pass. The complete local regression also passes: 5,681 total,
5,677 passed, four skipped and zero failed/cancelled on dependency commit
`72ce62a`. Its hosted run exposed two background CSS snapshots and a Music fault
fixture. Follow-up `99c297b` corrects CSS specificity and holds the fixture outage
through automatic transport retries, preserving audio recovery assertions and
Linux baselines. Two reviewed Windows snapshots catch up to existing guarded
purchase wording. The rebuilt focused desktop/mobile and compact-landscape
journeys pass; lint passes again. The optimized public Clock responsive journey
also passes, including compact Info. Every job in this follow-up's
[hosted CI](https://github.com/dsbowersock/atmoshaper/actions/runs/44391726173)
passes: 5,676 unit checks passed with five explicit Windows/catalog skips and
all four Chromium browser lanes green (614 passed, 180 matrix/opt-in skips).
The inherited Calendar/CI commit passes every hosted job.
The final production audit has zero critical/high and eight moderate build-tool
entries; the separate development-only finding and reachability limits are in
the [audit](audits/2026-11-18-beta-dependency-security.md). No new public release.

The [all-payments packet](superpowers/plans/2026-11-18-all-payments-beta-activation.md)
prepares the 18 absent Production-only Config settings, actual all-payments
build/map/entry gates, saved disabled-flow rollback and two owned new-flow tests.
The database binding/name and ready main branch agree. Aggregate checks find no
missing wallets, negative balance or ledger/owner mismatch and no commerce order
drift. Retain the processed unknown-refund receipt; no backfill or repair ran.
Neither a new Session/payment/refund nor configuration activation has occurred.
The owner requires all three flows before beta and will monitor the public
support inbox. The public artifact remains the approved `cdea4a6`.

The bounded proposal uses the app's exact-order Admin refund binding, not a
direct processor refund. Owner-only aggregate verification confirms existing
verified full-Admin authority. A separate
[one-lobby Ably check](superpowers/plans/2026-11-18-offered-ably-connection-check.md)
is prepared for missing offered-release connectivity; no room or new grant was
created. These operations remain unsubmitted and require exact approval.

## November 18 all three purchase flows retained for beta; dependency patch prepared

The owner explicitly requires recurring Supporter, one-time support and paid
backgrounds before inviting beta testers, and will monitor the existing public
support inbox. Do not treat the two disabled flows as a beta exclusion. Fresh
read-only Stripe metadata confirms the named live account, active Tax settings,
one active Ohio registration, six v2 Supporter Products/twelve exclusive Prices
and the enabled exact 15-event canonical webhook contract. Inline one-time and
background Products are created by Checkout; their absence from catalog search
is not a failure. No Session, payment, customer/registration write or activation
occurred. Deployed all-payment settings and new-flow acceptance remain separate.

The production dependency audit found applicable Next.js security advisories.
A separate isolated `codex/beta-dependency-refresh` candidate updates Next.js/
ESLint config to 16.4.6, Sharp and its override to 0.35.5, and Sentry within major
10. The resulting audit has zero critical-labelled entries, with 15 other
package entries requiring reachability/fix triage. Local validation is underway;
this candidate is not deployed and is not beta-ready. See the
[dependency plan](superpowers/plans/2026-11-18-beta-dependency-security.md).

## November 18 recovery-mail delivery accepted; CI environment fix under validation

The owner approved one recovery email and clarified that normal sign-in uses
Google. One public form submission returns the neutral notice, and one expected
branded message reaches the Inbox. Received headers report SPF and branded DKIM
pass; no DMARC result is stated. Its link targets the correct HTTPS site/reset
path. The link is unused; password and Google methods are unchanged. This closes
the observed delivery/destination gap, not password mutation or new-account
verification. See the [receipt](audits/2026-11-18-account-recovery-mail.md).

The focused PR's first hosted run passed lint, typecheck and browser build, then
failed Chromium installation because the moving Ubuntu runner selected 26.04,
which pinned Playwright 1.60 does not support. Follow-up `2ab17b7` pins all CI
jobs to Ubuntu 24.04; the local CI harness passes 162/162 outside the Windows
sandbox. The follow-up is pushed for hosted validation, without another public
promotion. The live artifact remains the approved `cdea4a6`. Final review and
source integration, uncovered feature checks, disabled-commerce scope and the
owner's support/invitation handoff remain open.

## November 18 cancellation fix published and Google Calendar journey accepted

The approved exact commit `cdea4a6` is now public. Its staged Production build
passed the real migration and Supporter readiness gates, TypeScript and all
115 pages. Seven authenticated entry requests returned 200. Sentry accepted
the two source-map archives under that exact Git release; an observed client
debug ID matches its archive. All six promotion mappings completed and the
public host resolves to that same artifact. The previous READY build is retained
for rollback. No rebuild, billing change, schema migration or broader purchase
activation was substituted for this promotion. The focused source remains on
[draft PR #69](https://github.com/dsbowersock/atmoshaper/pull/69), not merged.

The single approved Personal fixture cancelled through the new public Cancel
block control. The page reports cancellation, zero upcoming blocks and no
Google-error warning; bounded provider searches find zero remaining mirrors.
Two explicit refreshes, one Disconnect and one equivalent reconnect pass within
the approved test window. Google permissions are unchanged, all 18 original
calendars and the same dedicated calendar are preserved, and the app finishes
ACTIVE with only the original primary busy source selected. No clinical content
or existing appointment details were opened. This proves the observed manual
journey, not natural token expiry or long-session behavior. See the
[live Calendar receipt](audits/2026-11-18-google-calendar-live-test.md).

The dated pending Calendar/publication statements below are superseded. Daily
backups, failure alerts and isolated restore retain their accepted scopes.
Remaining work is genuinely missing offered account-mail/recovery evidence,
any uncovered feature/fallback checks, the scope of disabled commerce and final
support/release acceptance. No invitations have been sent.

## November 18 cancellation publication approved; Vercel identity check pending

The owner explicitly approved publishing focused commit `cdea4a6` after staged
Production/source-map/entry checks, retaining the current release for rollback
and finishing the existing Calendar fixture test. Its isolated branch is pushed;
the automatic Preview build is distinct from the requested Production candidate.
The public alias still matches the prior Sentry-enabled release. A CLI account
scope check failed without a deployment; normal signed-in Vercel UI confirms
the correct project, source commit and disabled custom-domain auto-assignment.
Prepared Redeploy with Production selected and cache disabled. Vercel requires
owner identity verification before proceeding; handed that step to the owner
without reading or requesting codes. Do not repeat the build submission until
the post-verification state is inspected. No publication has occurred yet.

## November 18 Google connection and outbound mirror pass; cancellation fix prepared

The owner approved the bounded Calendar test. Fresh Google consent matches the
three reviewed Calendar permissions. The public app reports ACTIVE and a
successful initial busy sync. Exactly one owned dedicated calendar was added;
all original calendar IDs are preserved. The one approved Personal entry mirrors
to Google at the correct time with generic title, no guests, no location and
no non-whitespace description. Real appointment details were not opened.

The test found no personal-block cancellation control. Prepared a focused fix
on an isolated branch: an authorized Cancel block form, locked role/ownership/
snapshot rechecks, retained history and honest post-commit Google-failure notice.
Forty-five focused checks, 84 existing sync checks, typecheck, targeted lint and
the local 115-page optimized build pass. Publication and live cancellation/
refresh/disconnect/reconnect are pending; the one synthetic fixture remains
active for that test. See the [live receipt](audits/2026-11-18-google-calendar-live-test.md).

## November 18 offered Calendar connection prepared for owner consent

The current public signed-in Calendar sync page is configured and Not connected.
Its normal Google account picker and returning-account review load successfully;
the Continue step is waiting without a new grant. The
[bounded Calendar acceptance packet](superpowers/plans/2026-11-18-offered-google-calendar-acceptance.md)
discloses the primary-calendar busy import, ongoing Google grant, dedicated
app-calendar creation and one synthetic test entry. Approval is needed at this
Google-access boundary; no event, token grant or Calendar connection was created.
An owner-review [beta tester guide](beta-tester-guide.md) is also drafted; it is
not an invitation or release approval.

## November 18 daily encrypted backups and owner failure alerts accepted

The owner explicitly requested daily activation. One enabled DSM task now runs
at 03:00 America/New_York with one attempt per UTC day, checksum validation and
retention preserving at least seven successes and seven days. One real
clock-triggered acceptance run completed in about 13 seconds, producing a
second verified encrypted copy; no archive was eligible for deletion. Sentry
received the paired start/success check-ins and resolved the synthetic failure.
The permanent saved schedule's next run is November 19 at 03:00 local; that
overnight run has not occurred yet. Existing Free plans are unchanged.

The dedicated backup-only Sentry alert records one test trigger. Its owner email
was received with the expected monitor subject and SPF/DKIM/DMARC pass. Missing
check-ins have a 15-minute grace and running jobs a 20-minute ceiling. All 40
pre-existing NAS containers retain their identities, images and states; the
private operator/configuration and two encrypted pairs validate. Recovery-key
custody and the earlier isolated restore remain accepted. The
[daily activation receipt](audits/2026-11-18-daily-encrypted-backups-and-alerts.md)
and [operator runbook](wiki/database-backups.md) supersede earlier pending daily
activation statements below. Full hosting-outage cutover is not tested.
Remaining beta work includes the consenting Google Calendar journey, genuine
remaining account-mail/recovery and offered-feature checks, commerce scope and
final support/release acceptance. No beta-ready claim follows from backups alone.

## November 18 HTTPS and firewall accepted with remote access preserved

The approved sequence is applied: secure QuickConnect sign-in/Control Panel
works; DSM HTTP-to-HTTPS desktop redirect is saved; a separate firewall profile
is enabled and re-read from a fresh secure session. The physical interface allows
the existing home subnet/link-local IPv6, required existing web/DSM/Drive/Plex
ports and ICMP, then denies unmatched traffic. The private tunnel remains allowed.
Original profiles, QuickConnect permissions and all 40 container identities/
images/states are preserved. Local SSH/SMB/HTTPS/Drive transports pass, and the
existing certificate validates with TLS 1.3. No router/DNS/account/file or backup
activation change occurred.

See the [activation receipt](audits/2026-11-18-nas-https-and-firewall.md).
The owner confirmed DSM administration, Drive and files all work on mobile data.
The requested remote-access preservation check is accepted. The bare-IP
certificate mismatch remains a reason to use the working HTTPS QuickConnect
entry point. All published container ports and full WAN exposure were not
certified by the host-firewall checks. Daily backups/retention/Sentry activation
remain separately unapproved and uninstalled.

## November 18 HTTPS/firewall changes approved and secure route established

The owner explicitly approved working HTTPS first and then a firewall preserving
QuickConnect, Drive, files and remote administration. The
[execution plan](superpowers/plans/2026-11-18-nas-https-and-firewall.md) owns this
bounded NAS-setting authority; earlier no-write observations below are historical.
The existing secure QuickConnect gateway reaches the correct NAS without a
certificate warning. The owner signed in privately; authenticated desktop and
Control Panel access work over HTTPS. Applied the approved DSM HTTP redirect
with existing ports and certificate/QuickConnect identity preserved. DSM's
expected web-server reload completed and the secure administrative session
survived. Persistent readback/redirect acceptance and firewall preparation remain
in progress. No public port, DNS, credential, daily backup or Sentry change is
authorized by this NAS-setting operation.

## November 18 NAS access review requested before daily activation

The owner completed DSM sign-in and asked about backup/NAS security. The
[read-only review](audits/2026-11-18-nas-backup-access-review.md) confirms existing
HTTP management, disabled DSM firewall, enabled QuickConnect/relay and remote
DSM/app/Drive/file permissions, plus an existing DSM-listed Drive mapping. These
were not enabled by the backup setup. Current router-wide/WAN reachability and
account-protection posture remain unverified. A working certificate-matched HTTPS
route and owner-required remote services need review before unattended activation.
No NAS security or network setting changed; daily jobs/retention/Sentry monitoring
remain uninstalled. The protected credential, encrypted first copy and accepted
restore are retained. NAS administrator compromise could expose the read-only
export credential and live hosted data even with encrypted archive files.

The owner clarified that Drive, file access and DSM administration are all used
frequently away from home. Preserve all remote workflows while preparing HTTPS
and account/router protection improvements. No removal of remote access, VPN
requirement or NAS security policy change is approved by that clarification.

Local daily/retention preparation passes all 46 backup tests with zero skips,
including genuine age encryption, checksum/ownership/race failures, duplicate-day
prevention, minimal check-ins, scoped cleanup and private config/script binding.
All three modules parse as Python 3.8; the inert plan and `git diff --check` pass.
No second live export, pruning, check-in or test email occurred.

## November 18 second recovery-key copy confirmed; daily activation being prepared

The owner selected their existing password manager and confirmed saving the
entire recovery identity privately. This is owner-confirmed custody; the agent
did not inspect the password manager or key contents. The protected PC identity
and instructions remain available. The second-copy prerequisite is satisfied.

Prepared the [daily activation plan](superpowers/plans/2026-11-18-daily-backup-activation.md)
and local daily/retention tooling. Read-only checks confirm the retained encrypted
copy passes the new checksum/receipt validator and cannot authorize pruning as
an old success. Native NAS Python 3.8 imports and deadline interruption/restoration
pass without installation, database connections, deletion or check-ins. Fresh
Sentry billing shows one unused included Cron monitor; its setup form was read
and closed without submission. Daily scheduling, retention and alerts remain
uninstalled and require the prepared separate activation approval.

## November 18 first encrypted backup and isolated restore accepted

The owner approved the first live NAS backup/restore packet. One isolated tool
image was built, one dedicated read-only database login was created, and one
owner-only encrypted archive was produced: 2,250,739 bytes in approximately
18 seconds. The PC-held recovery key restored that archive through pipes into
one network-disabled temporary PostgreSQL database in approximately 6 seconds.
All 135 tables, 46 migration names/checksums, expected extensions, constraints,
and the owned test-practice/default-service fixture pass acceptance. The
temporary database was removed; all 40 existing NAS containers match their
original identities/images/states. The archive, private configuration, tested
tooling/login and protected PC recovery identity are retained. Neon remains Free.

The [recovery receipt](audits/2026-11-18-first-encrypted-backup-and-restore.md)
records controls, bounded attempts, preflight corrections and acceptance limits.
The first restore is complete; unattended recovery coverage is **not active**.
Next: owner-held second key copy, current quota/headroom check, then separately
approved daily scheduling, retention and failure/staleness alerts. No daily job
or older-copy deletion was installed. A full hosting outage/cutover was not tested.
Google Calendar consent/sync and other remaining offered-release journeys stay open.

## November 18 NAS preflight and encrypted one-shot backup tool prepared

The owner confirmed the NAS runs continuously. Read-only authenticated checks
verify reachable storage, Docker/Compose, ample capacity, and supported memory/
swap limits. The built-in PostgreSQL 11 client is unsuitable for the application's
PostgreSQL 18 database; it stays unchanged. The proposed isolated image pins
official PostgreSQL 18.7 and age 1.3.2. New private directories need effective ACL
verification because the existing parent is broadly writable. No NAS directory,
container, image, schedule, permission or production key/credential was changed.

Added [inert one-shot backup tooling](../scripts/database-backup/README.md).
All 17 local tests pass, including actual age encryption/decryption, wrong-key
rejection, partial export, timeout, size limit, collision/concurrency preservation,
and credential/log boundaries. A Windows sandbox file-link denial was resolved
by running these invented-data tests outside the sandbox, without weakening
publication safeguards. The inert plan opens no database. NAS Compose parsing
also passes without creating files or starting containers. Hosted CI includes
the failure-boundary fixtures but has not run this branch. All 162 existing
CI-harness checks also pass outside the sandbox; the initial sandbox run could
not find the already-installed browser cache. No assertion or timeout changed.

A bounded catalog-only Production read verifies one application schema, expected
extension compatibility, common object ownership and no row-level-security
tables. No application rows were read. Prepared the
[first backup/restore packet](superpowers/plans/2026-11-18-encrypted-database-backups.md#first-nas-backup-and-restore-packet)
for one read-only backup credential, private NAS tooling/configuration, separate
owner-held key, one encrypted export and one network-isolated temporary restore.
This is the next exact write-approval boundary. Daily scheduling, alerts and
retention remain uninstalled; recovery acceptance is still pending.

## November 18 test practice created; separate encrypted database backups selected

The owner selected separate encrypted backups while retaining Neon's Free plan.
They also approved `AtmoShaper Studio` for testing, while naming `Massage Lab`
as their intended working calendar name. Submitted the approved first-practice
form once. The resulting empty calendar loads; a subsequent availability-page
read confirms the saved test name, no availability rules/blocks/schedules, and
the services page lists the default service with one variant. Google sync now
offers Connect Google Calendar. No connection, appointment, availability change,
working-calendar rename or deletion was performed.

The owner requested a clear explanation of backup scope before choosing storage.
This is recovery for the shared hosted application database across all users,
including account/sign-in records, preferences/progress, scheduling, membership/
purchase records, reference/operational records and any account-saved personal
wellness logs. It does not upload or copy users' local professional-record vaults.
Git source, hosted media and provider configuration are separate recovery assets.
Backups contain sensitive data even with local-first professional documentation.

Prepared the [plain-language scope and encrypted-backup plan](superpowers/plans/2026-11-18-encrypted-database-backups.md).
Daily copies, seven-day retention, separate key custody, failure reporting and
an isolated restore are proposed, not active. Storage/runner choice remains
deferred until the owner understands the scope. No export, credential, key,
scheduler, storage or restore write is authorized by the preference choice.
No billing change occurred, and beta recovery acceptance remains open.

## November 18 offered account checks pass; practice setup and backup choice pending

After private owner sign-in in regular Chrome, the deployed account shell,
Security, App layout and Data & sync pages load correctly. The existing Google
method is linked, and the displayed clinical-sync boundary remains local-first.
No authentication method, preference, membership or clinical record changed.
The optional onboarding form was bypassed using its existing navigation link,
without saving its answers.

Calendar reports no practice membership and offers the first-practice form;
Google Calendar is not connected and its controls require provider access.
Prepared an unsaved `AtmoShaper Studio` form for owner review. Creation would add
the owner membership and default 60-minute service/variant. The name/creation
decision is pending; no practice, appointment or Google permission was created.

Fresh Vercel dashboard metadata confirms the database is connected to this
project's Production environment, and its provider ID matches the explicitly
scoped Neon project read. It remains Free with six hours of history, no snapshots
and no schedule. Native automatic snapshots require a paid plan. The billing
preview applies to both products in this installation; it was cancelled without
changing the plan. The owner was asked to choose separate encrypted backups or
a paid-plan comparison. Adequate coverage and isolated restore proof stay open.

Two representative live stations, Drone and Observable Streams, leave loading
and report Playing. Pause/stop pass for both; resume also passes for Observable
Streams. Playback was stopped and test tabs closed. This is browser control/state
evidence, not physical-listening, complete-catalog or forced-fallback acceptance.
See the [account/playback/recovery receipt](audits/2026-11-18-offered-account-playback-and-recovery.md).

## November 18 Sentry runtime and source maps connected on the live build

The approved corrected build is READY and published from unchanged reviewed
main `012952b`. Sentry lists two new archives, 523 and 2,080 files, under the
expected project and exact Git release. A debug ID read from deployed public
JavaScript filters Sentry to its matching new archive/release. The paired public
map request returns 403, and six sampled client chunks contain no CI-token-shaped
value. These are artifact association/access checks, not a new synthetic error
or proof of every asset. The prior protected mapped-error/email campaign remains
closed at its accepted scope.

All seven candidate browser entry checks and seven post-promotion public HTTP
checks pass. All six live aliases reference the new artifact, unrelated mappings
are unchanged, and the apex 308 redirect is preserved. The original setup token
was revoked under explicit approval; a reloaded organization-token list confirms
only the replacement remains active. The previous verified public artifact is
the saved rollback. No secret was printed, saved locally or committed. See the
[Sentry connection receipt](audits/2026-11-18-sentry-runtime-and-source-maps.md).

The user accepted up to one day's lost hosted account/settings/scheduling changes
and restoration by the next day. Further read-only discovery identifies the
separate Vercel-managed AtmoShaper Neon project on the Free plan: one ready root
main branch, six hours of history, no configured snapshot schedule and no listed
snapshots. The earlier console-managed legacy project is separate and archived.
Fresh integration-store linkage is still to confirm because the Vercel connector
rejects that metadata endpoint with 403. No secret or row access was substituted.
Adequate backup coverage, cost/eligibility and isolated recovery proof remain
pending. Representative audio
protocol checks pass, and the configured account sending domain is provider-
verified with sending enabled and open/click tracking disabled. No email was
sent. Full playback and account/Calendar offered-context journeys remain open.

The next hands-on beta step is private owner sign-in in the opened regular-Chrome
app tab, followed by account/settings checks without opening clinical records.
No sign-in credential is requested in chat, and no account/clinical data has
been inspected in this handoff. Full beta readiness is not yet claimed.

## November 18 Sentry correction approved; complete-token retry building

The owner approved the replacement and revocation of only the original token.
The corrected handoff passes inert plus/slash and truncation checks, and the
new visible token validates with its complete 43-character secret component.
Created `atmoshaper-vercel-sourcemaps-v2` with the same `org:ci` scope and updated
only the existing Production Secret. One fresh exact-source retry build is
running. Authenticated upload, candidate acceptance, publication and the
approved original-token revocation remain pending. All six live aliases were
verified unchanged after the first attempt; its unpromoted READY artifact is
not accepted for source maps.

Parallel read-only media checks pass for one committed Signature Opus payload
(206, 64-byte range, audio/ogg, CORS allowed), the branded generative Opus index
(200 JSON), and one nested generative sample through the source-defined origin
mapping (206, 64-byte range, audio/ogg, CORS allowed). These are representative
protocol checks, not full catalog or audible-playback acceptance. No media
object, catalog, provider setting or legacy consumer changed.

## November 18 Sentry upload stopped at token-handoff failure

The first configured build reached READY but Sentry rejected release/map
requests with HTTP 401. It is not promoted. Root's token-copy expression
incorrectly excluded valid standard-base64 characters and captured only 27
characters of the 43-character secret component. This was an agent handoff
error, not an application or Sentry service failure. The one-time full value
is no longer visible. Do not retry the partial credential or treat READY as
source-map acceptance.

A replacement token draft with the same native `org:ci` scope is prepared.
The exact correction is one replacement, updating only the existing Production
secret, one fresh authenticated build, and revoking only the original token
created in this operation after replacement verification. Creation/revocation
approval is pending; no replacement or revocation has occurred. The current
public build remains the verified rollback reference. Beta recovery targets
are accepted as recorded below; implementation/restore proof remain pending.

## November 18 final Sentry binding approved; first build attempt

The owner requested completing Sentry/source maps and continuing beta readiness.
Pre-write UI reads confirmed the existing active project DSN, no organization
build tokens, and no `SENTRY` variable matches in either Vercel project or linked
shared-variable scope. The owner then explicitly approved the complete token,
Production binding, source-map build/upload and same-artifact publication.
Created one dedicated `org:ci` organization token and saved the four approved
Vercel project variables, Production only. Reloaded metadata confirms the auth
token is Secret and the three destination variables are Config; values remain
concealed. No terminal credential was exported or secret saved locally.

The narrow native token scope is `org:ci` (source-map upload, release creation,
code mappings). It is organization-wide; the form offers no per-project scope.
The creation approval was received at action time. The
[final Sentry packet](superpowers/plans/2026-11-18-sentry-final-binding.md)
owns the four Production-only variables, one exact-source SDK upload/build,
readback, contained activation and rollback. The current error-only policy,
map cleanup, destination protections and closed error/email campaign remain.
Fresh `npm run test:sentry` passes all 76 tests with zero skips/failures. One
authenticated Production rebuild of unchanged reviewed main `012952b` is in
progress. The currently serving same-source build is the saved rollback;
upload/readback, candidate checks and public promotion remain pending.

The owner also accepted a beta recovery target of at most one day's lost
account/settings/scheduling changes and restoration by the next day. This is a
target, not backup or restore proof. A read-only Neon discovery found no project
named AtmoShaper and an existing legacy-named project with six hours of history;
its exact deployed binding and adequate independent backup coverage still need
verification. No database rows, backup export or restore operation were accessed.

## November 18 approved service changes saved and current application published

The owner explicitly approved the prepared Ably key, Production-only Vercel
secret and two Sentry project corrections, then additionally authorized updating
the deployed site to the completed application work.

Created one `production-anatomime-server` key in the existing main Ably app.
Reloaded metadata confirms only publish/subscribe/presence on `anatomime:*`.
Saved it as the existing Vercel project's Secret `ABLY_API_KEY`, Production only;
the saved variable is verified and concealed. No key value was logged or saved
locally. Both Sentry project changes persist after reload: automatic JavaScript
source fetching off and outbound TLS/SSL verification on. Existing keys, apps,
inherited privacy protections, legacy project and organization settings remain.

Fresh remote Git still identifies main as `012952b` (PR #68), the exact source
of the completed local full-suite/build/browser checks. Vercel still uses
`npm run build`, Node 24, main tracking and disabled automatic custom-domain
assignment. Saved the current six live alias mappings as the rollback reference;
their artifact source is `38d0ded`. One fresh Production-target build of exact
`012952b` completed using current settings, including the newly saved secret.
Its actual read-only migration-status and live Supporter-readiness gates passed,
as did compilation, TypeScript and all 115 static pages. Seven staged anonymous
browser entry points passed before the separately owner-authorized public
promotion. All six live aliases now point to that new build; unrelated branch
aliases are unchanged. All seven post-promotion public HTTP checks return 200,
the signed-out session is null, and the apex redirect remains 308 to the www
site. The current public home also renders correctly in regular Chrome. The
prior READY artifact remains the rollback reference. No database migration or
additional payment activation occurred. See the
[service and deployment receipt](audits/2026-11-18-live-service-binding-and-site-update.md).

This publishes the latest merged application work, not a full beta-readiness
claim. The build reported no Sentry upload-auth token, so source-map upload and
release creation did not run; final runtime/source-map binding remains pending.
No Production game, synthetic error, real account/email/payment, Calendar sync,
restore or hosted-media playback campaign was run in this operation. Continue
the remaining offered-context and recovery work in the resumption plan.

## November 18 browser restored; live binding prepared

The owner restarted Codex and attached the existing Ably tab. Regular Chrome
control now works through the extension, including the owner's signed-in Ably,
Sentry and Vercel dashboards. This supersedes the connection blocker below.

Read-only live checks identify the existing main Ably app and the separate
verification app; preserve both. A new-key form is prepared but unsaved for
`production-anatomime-server`, limited to `anatomime:*` and only publish,
subscribe and presence. No existing key value was revealed and no key created.
Vercel's project and linked-shared-variable searches both return no result for
`ABLY_API_KEY`. Its unsaved project-variable form selects Secret and Production
only, with the value blank.

The AtmoShaper Sentry project inherits required server-side/default scrubbing,
IP removal and disabled minidump storage. Six existing project removal rules
remain in place. Project JavaScript source fetching is enabled and outbound
TLS/SSL verification is disabled; their narrow corrections are proposed,
not saved. Organization-wide and legacy-project settings remain untouched.

Vercel's project overview identifies the current public Production deployment as
the October 7 artifact from source `38d0ded`, despite newer READY
Production-target artifact metadata. Ready target metadata is not current public
alias proof. No deployment or promotion has occurred. The next step is exact
approval of the [prepared service-binding packet](superpowers/plans/2026-11-18-live-service-binding.md),
followed by configuration readback. Sentry runtime/source-map activation and
offered-artifact acceptance remain separate, unfinished work.

## November 17 browser connection repair awaits app restart

The owner authorized continuing live-service bindings and requested connection
instructions. A fresh controller reset still fails before browser access.
Read-only diagnostics found the per-user and running-process `CODEX_CLI_PATH`
pointing to a removed executable, while the app-managed runtime, resolved CLI
and running CLI path agree on an existing working executable.

Backed up and verified the one obsolete per-user value in ignored local output,
removed only that user override, and confirmed it is absent. The current app
process still holds its inherited environment; the owner must fully quit and
reopen Codex, return to this chat and request a connection retest. Chrome and
the existing Sentry/Ably sign-ins can remain open. The repair has not yet been
proven through a successful browser-controller launch. No service key, provider
setting, browser permission, account or deployment changed.

## November 17 beta-readiness resumption

The owner resumed work toward a small beta using the already documented feature
set, with no new feature requests. Work continues in isolated local branch
`codex/beta-readiness-20261117` from verified GitHub main `012952b` (PR #68).
The chat's September checkout and the retained migration worktree's unfinished
November continuation records are preserved. This section supersedes older
next-action statements below; those remain dated history.

Fresh GitHub reads confirm the November 5 main commit, no open PRs, and all
seven jobs passing in its [existing CI run](https://github.com/dsbowersock/atmoshaper/actions/runs/42125868836).
Fresh Vercel metadata reports a READY Production-target artifact with that Git
source. This does not prove public routing, effective credentials or user
journeys. The environment-list connector response is truncated, so it cannot
reconfirm that any omitted setting is absent.

The exact lockfile install, offline Prisma generation/schema validation, full
lint and typecheck passed. The full bounded suite passed: 5,663 tests total,
5,659 passed, four skipped and zero failures in 999,775 ms. The local
production-mode webpack build passed, including TypeScript, 115/115 static
pages and build traces. Its Production migration and Stripe gates correctly
skipped outside Vercel Production. All 52 desktop/mobile Chromium public-route
smoke cases passed in 3.6 minutes, with no skips/retries, against that ordinary
build using inert providers and intercepted external resources. This proves
local anonymous rendering/health, not hosted media, sign-in, provider writes or
full authenticated journeys. No beta-ready claim follows yet. The initial default-concurrency run
was stopped after failures under memory pressure. Its failing Calendar and
commerce groups pass in isolation (69 passed, one platform skip); the full
`npm run test:beta` rerun limits active files to two without changing assertions.
The
[resumption plan](superpowers/plans/2026-11-17-beta-readiness-resumption.md)
coordinates the existing migration/service/recovery requirements and records
the next concrete work.

Owner-supplied November 17 Sentry organization billing screenshots show the
Developer plan, 5,000 included Errors, five accepted and zero dropped in the
displayed October 20–November 19 period. The usage warning concerns the one
uptime-monitor allowance. Sentry's [published Developer plan](https://sentry.io/pricing/)
lists a 30-day lookback, and its [free-plan policy](https://www.sentry.help/en/articles/13965037-can-i-set-up-an-on-demand-pay-as-you-go-budget-for-my-free-developer-plan)
does not offer pay-as-you-go overage. The screenshots do not show an effective
project retention setting; the published plan contract and observed account
plan are distinct evidence. No overage-budget configuration is needed on this
free tier. These organization-level facts do not establish final app/project
binding, privacy or collection. Native dashboard control failed to launch;
the requested regular-Chrome tabs were opened without changing service settings.

The owner's November 17 Ably package screenshot confirms the existing Free
resource-based package: six million monthly messages, 200 peak connections and
200 peak channels. These are account package limits, not current usage or proof
of the offered app's runtime-key binding. The advertised MAU-pricing migration
was not performed or required as a condition of this local verification.

Carry forward dated accepted application, local-record, sandbox-payment,
realtime, Sentry and media/image proofs at their original scopes. Remaining
work is exact offered-artifact service binding, account/mail/Calendar journeys,
all-three-purchase readiness, offered media acceptance, recovery/support and
final release/rollback acceptance. The November continuation records contain
later narrow proofs than the historical snapshots below; they are not fresh
live observations or authority to replay expired operations.

Clinical/PHI workflows remain local-first. No provider configuration, database
write, real email/payment, media mutation, deployment, public promotion or legal
cutover has been performed in this resumption. Those external changes retain
the exact separate authorization boundary in AGENTS.md.

## November 18 patched runtime dependencies prepared; release validation running

Prepared a separate environment-free branch containing the published Calendar
fix and supported CI runner. Next.js/ESLint config 16.4.6, Sharp 0.35.5, Sentry
10.78.0, the retained Nodemailer alias at 10.6.0, aligned Prisma 7.10.1 and patched
transitive overrides pass local typecheck, clean lint, Prisma generation/
validation, 19 dependency/artwork/inert-mail checks and 76 Sentry/privacy checks.
The unused root Zod dependency is removed. Application navigation is preserved.
The optimized build passes; its live provider gates correctly skip locally.
The complete provider-free regression run is in progress.

The production dependency audit now has zero critical/high entries and eight
moderate build-tool entries; the separate development tree still has a critical
proxy-addr report. The [audit](audits/2026-11-18-beta-dependency-security.md) records
the limited source/dependency reachability assessment. No package-wide security
clearance, provider activation or beta-ready claim is made. The approved public
artifact remains `cdea4a6`, with rollback retained.

The owner requires all three purchase flows before beta and will monitor the
existing public support inbox. Current all-payments preparation/receipts remain
in the retained beta-readiness checkout. No new transaction or activation is
authorized by this dependency branch.

## November 18 cancellation published; Calendar accepted; CI runner corrected

The owner-approved exact commit `cdea4a6` passed its real Production migration
and Supporter gates, 115-page build, seven authenticated candidate entry checks
and Sentry source-map/debug-ID association. The existing staged artifact was
promoted once; all six mappings completed and the public host matches. The prior
READY build remains available for rollback. Draft PR #69 preserves the focused
source and has not been merged.

On the public site, the one approved Personal fixture cancelled through Cancel
block; upcoming blocks became zero and its generic Google mirror disappeared.
Two explicit refreshes, one Disconnect and one equivalent reconnect pass. The
same dedicated calendar and all original calendars are preserved; the connection
finishes ACTIVE with the original primary busy source selected. The finite
campaign is complete and must not be replayed. Natural token expiry was not tested.

Hosted PR CI passes lint, typecheck and browser build, but its moving Ubuntu
runner selects 26.04, unsupported by pinned Playwright 1.60. Browser installation
fails before Node/browser tests. This follow-up pins all CI jobs to supported
Ubuntu 24.04 without changing runtime source, dependencies or test assertions.
The local CI harness passes all 162 checks using the installed browser outside
the sandbox; the sandbox browser path was unavailable. The next hosted run must
establish that the tests execute successfully; the
earlier setup failure is not a passing test result. Broader beta records remain
in the retained beta-readiness checkout.

## November 18 personal blocked-time cancellation prepared for beta

The owner-approved live Google Calendar test connected successfully and produced
one correctly timed generic mirror without guests. It exposed missing personal
block cancellation controls. The focused fix adds Cancel block to Availability
> Blocked time, retains history, clears availability blocking, and uses the
existing Google removal after commit with an honest partial-failure notice.
It rechecks current owner, practice, role and event times under scheduling locks.
No schema, scope, credential or billing change is needed. Forty-five focused
checks and 84 existing Calendar sync checks pass; typecheck and targeted lint
pass. The local optimized build passes all 115 pages, TypeScript and compilation;
its Production-provider gates correctly skip outside Vercel. Publication and live cancellation/
disconnect/reconnect acceptance remain pending. The synthetic fixture is still
retained for the approved test. See the [fix plan](superpowers/plans/2026-11-18-personal-block-cancellation.md).
This source branch contains only the focused fix; broader beta operations are
tracked in the retained beta-readiness checkout and are not replay authority.

## October 30 local anatomy delivery and current media hold

The reviewed local anatomy delivery source at `e0e877f` is composed with the retained documentation candidate on `codex/migration-readiness-20261030`; no publication or PR/main merge has occurred. All 61 source-only checks, scoped lint and nonincremental typecheck pass, with independent specification and quality reviews. The opt-in final image/diagram URL binding covers the shared study projection used by database-backed consumers and seed-only Anatomime. Defaults preserve existing delivery. No setting is enabled, and actual database-origin coverage, branded delivery and final artifact acceptance remain unverified. See the [anatomy delivery audit](audits/2026-10-30-anatomy-independent-media-delivery.md).

The private copy/restoration and four-copy exclusion are complete, and the owner admitted the resulting 16,268-file cohort for public setup on retained grant evidence. The later October 30 setup stopped at file-owner metadata admission before credential reading or any provider request. Its window and correction card expired; the owner reported revoking the temporary setup token. That owner report is not an API revocation check. Local encrypted-holder cleanup remains unverified after the pre-admission stop. No expired grant or unused request slot is reusable.

The source-only capture producer correction now passes independent specification/quality reviews and root's fresh 164-test offline run. It reuses the existing explicit-owner CREATE_NEW primitive for the five new capture files, including continuation in a validated existing root; strict readers remain unchanged. No existing file ownership or permissions were changed. These invented-boundary tests do not prove native owner assignment, live capture or provider delivery. A later token/setup operation still requires a new security/provider decision.

The README and [migration guide](wiki/migration-status.md) now distinguish completed scoped campaigns from remaining independent media delivery, all-three-purchase deployed readiness/activation, service/recovery and exact public-release decisions. Historical state/log entries remain intact. Both public apps and originals retain their existing versions; the full MassageLab-to-AtmoShaper migration remains incomplete.

## October 30 temporary-token media preparation accepted locally

The owner selected preparation of a temporary-token route. The new source-only successor avoids the saved CLI login and keeps one canonical authentication lease and media workflow. A future custom USER token needs account-wide R2 Edit on the intended account plus Zone/DNS Read only on the intended zone; source guards are not provider-enforced two-bucket scope. The owner-launched masked entry uses CurrentUser DPAPI and new-task-only protected artifacts. Existing credentials and Windows permissions remain untouched.

Independent specification and quality reviews, including the exact test-only follow-up, pass. Root's fresh native run passes all 159 tests; all 22 source pins, three physical runtimes, 37 source/test inputs and 49 inventory files match. The earlier helper remains unchanged. Tests cover invented protected boundaries and ordinary owned-file leases; actual protected creation, form visibility, DPAPI, token/API effectiveness and media delivery remain unverified. No private credential-store metadata/key contents, provider operation, app/database/build, installation, publication or public change occurred.

Review closed late/ambiguous-save admission and unnecessary console-history clearing. Successful save metadata also needs a separately bound OWNER-SOURCE report of the visible CAPTURE_SAVED_CLOSED label; it is not independent machine-exit proof. One root fixture race with a transient Windows file was fixed by parsing the complete closed source set, preserving all expected parse errors and protection settings.

The complete later security/provider proposal remains inactive: one new token, separate 30-minute capture and later 50-minute media readiness, 75 HTTP attempts, $0 requests, the existing 30-cent additional monthly-storage cap, two public media hosts and owner revocation. No token, operational grant, nonce or clock exists. A direct decision is still required before credential creation/use and public access. See the [native media entry plan](superpowers/plans/2026-10-29-native-media-host-entry.md). Actual media/catalog, all-purchase/service/recovery and final artifact/rollback/public release remain incomplete.


## October 29 enabled background notices completed at source scope

The [background notice coverage audit](audits/2026-10-29-background-notice-coverage.md) maps all 84 enabled entries and their declared source families, keeping cobe/simplex subcomponents additive. The canonical static notice file now also preserves the complete Chamaac, Magic, Eldora, cobe and two original Jhey notices, plus the existing simplex package and source notices. Prior React Bits/Animate UI bytes remain unchanged. Custom-source credits retain separate terms; no universal media or licensing clearance is claimed.

Exact body/prefix, source/legal/history and link/diff checks pass with independent source review. Purchase availability, entitlement, renderer and legal-policy code is unchanged. No app build/test, dependency install, media/cloud-account operation, credential read or Windows permission change occurred. This prepares source distribution only; exact artifact notice delivery, publication, the separate media-access route choice and the full release gates remain pending.

## October 29 background license notices preserved locally

A bounded source review found the React Bits/Animate UI copyright summaries and links lacked their full permission notices. The [notice-preservation audit](audits/2026-10-29-background-license-notice-preservation.md) records the pinned public sources and scope. One static third-party-notices file now preserves both complete license bodies; the source guide reflects the already-approved permanent in-app access alongside membership access. Existing legal text/versions, registry IDs, availability and purchase behavior are unchanged.

Literal source counts are 88 registry definitions and 81 purchase-eligible entries: 35 verified/46 caution, with no blocked or unclear eligible entry. Those labels are not a blanket clearance. Independent review established no runtime defect or new permanent-use rights decision; only notice preservation and stale explanatory wording needed correction. Exact notice bytes, preserved source/history and relative links are checked locally. Publication and exact final-artifact notice delivery remain pending; no protected operation, public change or closed-campaign replay follows. The separate media-route owner choice and full migration gates remain open.

## October 29 exact-artifact release checklist clarified

The release checklist now distinguishes the intended all-three-purchase migration from retained October 1 Supporter-only activation evidence. It points to the existing staged acceptance record for source/catalog/configuration/READY artifact, missing offered-context checks, all-flow backout and final decision. Command examples explicitly disclose environment loading, direct database/live Stripe reads and the separate audio release tooling; none was executed. This is local documentation preparation, not provider readiness, build acceptance or public activation. Media remains on hold for the pending owner route choice.


## October 29 product migration readiness checkpoint

The MassageLab → AtmoShaper product migration remains **incomplete**. This is a consolidation of dated source/acceptance evidence, not a new provider inspection or permission to activate the site. Continue building on the existing Vercel setup; hosting alternatives remain deferred.

Reviewed source batches through PR #66 were integrated. The last recorded integration main is `908cba9`, whose tree matched the final reviewed source `4f0c124`; no current remote-head claim is made here. Closed account/Admin, Calendar, persistence, clinical/public-tool/Chimer, Anatomime realtime/progress, protected Sentry and sandbox-purchase campaigns remain accepted only at their recorded scope. Carry them forward rather than replaying them. See the [dated migration table](wiki/migration-status.md) and [evidence reconciliation](audits/2026-10-29-migration-gate-reconciliation.md).

The remaining finish line is:

1. **Independent media:** complete the approved-cohort public delivery, CORS/range/playback, exact catalog binding and backout. Four-copy removal/preservation is already verified. The encryption-only helper repair passes 576 offline checks and independent reviews, but actual saved-login eligibility and media delivery remain unverified. All private windows are closed; source preparation grants no private retry.
2. **All three purchases:** preserve recurring Supporter, one-time support and permanent-background scope. Complete deployed configuration, applicable tax/legal/rights, signed webhook/fulfillment/reconciliation and final artifact/browser evidence before activation. Sandbox success and a Supporter-only build do not enable the two other flows.
3. **Services and recovery:** verify the final owned bindings, administration/billing/limits, offered provider journeys, agreed recovery objectives and bounded restore/support acceptance. Use the [service/recovery runbook](wiki/service-recovery-readiness.md) and [staged acceptance plan](superpowers/plans/2026-10-29-final-service-recovery-and-release-acceptance.md). Their preparation is not actual restore evidence.
4. **Final release:** agree the exact offered source/catalog/configuration/artifact, then obtain the public activation/promotion decision with rollback and legacy continuity. Both public versions remain protected; no local documentation or old approval performs a rollout.

Clinical/PHI records remain local-first. Stable legal/data/entitlement/compatibility identifiers and the decision not to invent an existing-user transfer campaign remain. Held anatomy facts are a disposition worklist, not a requirement to activate every held row or repeat a whole-corpus review.

This concise offered-source checkpoint consolidates selected owner-controlled continuation records through the encrypted-helper source closeout. Their complete chronology is retained separately; existing entries below are preserved as dated history, not fresh pending instructions. Provenance, input hashes and limits are in the reconciliation audit.


## October 25 Calendar review documentation follow-up

The included CodeRabbit review through `45d382d` reported no actionable
comments and no unresolved threads. Its function-documentation check reported
60% coverage. Focused JSDoc now explains the page read boundary, shared shell,
private-read recovery message and date parsing constraint. Runtime behavior is
unchanged; all 14 Calendar read-recovery tests pass. The new comment-only head
still requires CI/Preview and its queued included review. No merge, Production
change or Sentry activation is authorized.

## October 25 committed-save result after a vault lock

CodeRabbit's included review of `020c48c` identified a valid save-result edge:
an already accepted encrypted write could commit after a lock but return null,
causing Journal, ROM and SOAP to report failure. The provider now returns the
normalized accepted result after the write while retaining the authority guard
around every view update. It does not unlock the vault or restore its plaintext
view. Rejected or superseded storage operations still return null.

All 13 real-crypto lifecycle cases pass, including new committed-result assertions
for both delayed decrypt and encrypt saves, plus lock preservation, rejected
stale callbacks, import/export, remount and reset protection. These use invented
in-memory fixtures and the cached browser with no application services or database.
No public/provider state or clinical storage boundary changed.


## October 25 Chimer review follow-up uses state-aware layout assertions

PR #52's valid review finding is repaired in the component test: every changed
state now waits for its expected owner/geometry, and hide/unmount cleanup is
observed directly. No application runtime or stylesheet changed. All 43 focused
checks and named lint/typecheck pass; new-commit CI/Preview and included review remain
required after publication under the existing four-PR approval. No PR merge or
Production/Sentry activation is authorized. See the
[validation audit](audits/2026-10-25-chimer-state-aware-layout-waits.md).

## October 25 Calendar workspace read recovery verified locally

Local runtime candidate `16e99df` now shows the existing generic Calendar
unavailable surface if any required event, provider, preference, availability,
schedule-interval or external-busy read fails. It never turns those failed reads
into a successful empty schedule. Earlier sign-in/readiness/membership gates,
valid empty workspaces, practice/user scope and date behavior are preserved.
All seven Prisma query projections match after explicit helper-parameter and
object-shorthand normalization; no privacy selection, row limit or filter changes.

The actual-page regression improves from 8 passes/6 failures to all 14 passing.
All 155 related Calendar cases, scoped lint, typecheck and the cached full build
pass. All 2,189 archived inputs match the build snapshot and checkout through
Git's configured text conversion. The actual page and presentation owners render
the outage safely at 1440x1000, 390x844 and 320x740 using the completed candidate's
CSS, with no overflow, browser errors, blocked requests or private error detail.
This is invented-read/static-SSR acceptance, not database or hosted Google sync.

Owned browser profiles/processes, source/build/archive, compiler/npm caches and
two dependency junctions are cleaned up. Shared dependencies, unrelated work,
receipts/screenshots, the three prior publication refs and the unapproved
account/admin database packet remain intact. No authenticated provider, database,
credential-holder, media, publication, Production or Sentry operation occurred.
The paid media proposal stays declined; its request cap remains $0. Other
migration release gates remain open.

See the [Calendar recovery audit](audits/2026-10-25-calendar-workspace-read-recovery.md).

## October 25 local Notes save/recovery acceptance and three defects closed

Local runtime source `f85c10b` preserves a chosen SOAP session date when Identify
remounts or therapist defaults update, keeps encrypted-backup controls within
narrow cards, and makes rejected Journal/ROM/SOAP saves visibly report failure.
Intake's existing failure path remains. Encryption, schemas, keys, date policy,
entitlement gates and accepted-write/merge behavior are unchanged.

The retained original date editor yields two passes and three failures in the
same settled regression that passes all five cases on the repair. All 62 existing
clinical tests, scoped lint and typecheck pass. The exact cached full application
build passes; all 2,186 archive inputs match the checkout after configured text
line-ending conversion, and the real selected DSEG7 font is hash-verified in its
output. The external Inter fixture stays local; no install or Prisma generation.

Twenty-three actual client workflow cases pass at 1440x1000, 390x844 and 320x740:
all four encrypted saves, intake-to-SOAP handoff, retained date, lock/reload and
wrong-password recovery, four single-write quota failures, plaintext-warning
cancellation and encrypted backup/import into an isolated browser context.
All twelve tool/viewport widths fit. Four further final denial observations
confirm visible feedback and preserved ciphertext. Final browser/build checks
record zero external-network or unrelated-executable attempts and zero
runtime/console errors.

This is real client/provider/cryptography and compiled-CSS evidence with invented
records and fixture navigation after the entitlement boundary. It does not prove
server membership authorization, physical-device sensors/printing, authenticated
routes, hosted PHI storage, final PWA/hosted behavior or the whole migration.

Owned browser profiles, temporary encrypted downloads, source snapshots/archives,
compiler cache and dependency links are cleaned up. Shared dependencies, all
unrelated work and historical receipts/screenshots remain. No provider, actual
application database, credential, cloud media, publication, Production or Sentry
action occurred. Original Chimer/anatomy publication refs stay pinned; this Notes
child branch is an additional local follow-up. R2 requests remain capped at $0;
the declined paid proposal remains closed. Other release gates remain open.

See the [local client audit](audits/2026-10-25-local-notes-client-readiness.md).

## October 25 public anatomy credits and publisher links verified locally

The local source candidate `0a28c27` follows the exact textbook edition repairs.
It retains four hash-verified public publisher pages for BodyParts3D and Human
Bio Media, corrects the broken archive description link, and displays supplied
source/image credits with linked licenses. The publisher's full BodyParts3D
credit replaces shortened text in 92 existing image records. Historical mirror
licenses, asset URLs, usage/review flags and all citation IDs stay unchanged.

All 1,271 cards and 5,582 default questions preserve study identity, order,
answers and grading; only declared attribution/link metadata is different.
An invented local media map additionally verifies all 9,398 expanded questions.
This does not establish scientific acceptance or permission for every asset.

All 201 focused tests, changed-file lint, typecheck and the exact cached full
build pass. The actual React flashcard with built CSS passes five viewport
checks, including short landscape, native keyboard disclosure without a flip,
active-face focus isolation and linked licenses. The measured first landscape
failure is retained; compact inline credits and reduced vertical image padding
correct it without changing outer card geometry. Images in this local browser
fixture are invented; hosted media and gameplay were not exercised.

All 82 build inputs match after the configured Git line-ending conversion.
Local validation records zero network/unrelated-executable attempts. Three owned
dependency junctions, the compiler cache, stopped browser profile and temporary
build/baseline snapshots are removed. Shared dependencies, screenshots, publisher
evidence and unrelated work remain. No cloud media, credential, database,
publication, Production or Sentry action ran. The $15 media proposal stays
declined; R2 requests stay at $0. Other migration gates remain open.

See the [validation audit](audits/2026-10-25-anatomy-public-source-attribution.md).

## October 25 Applied Human Anatomy exact publication and component caveat pinned locally

The remaining major textbook source now identifies the exact 2022 Applied
Human Anatomy PDF by Michael F. Nolan and John P. McNamara, DOI
`10.21061/applied-human-anatomy`, PDF ISBN `978-1-957213-41-5`. Its 189-page,
639,383-byte retained artifact is hash-verified. Physical page 5 explicitly
states CC BY 4.0 and warns that some photographs, illustrations or quotations
may have separate rights. That caveat is preserved rather than treating the
book's license as permission for every component.

Only this source record's private-facing evidence metadata and review date
change. Its ID, slug, catalogue URL, displayed name, attribution, license and
usage scope remain. The complete seed comparison preserves every citation and
review state, all 1,271 cards and all 5,582 questions byte-for-byte. The source
is listed by 853 cards and 4,145 questions; no factual re-approval or new prose,
image import or media permission is claimed.

All 193 focused tests, typecheck and changed-file lint pass. Network-denied
validation records zero attempted connections or unrelated executables. The
already retained public PDF was reused; this follow-up made no retrieval,
credential, database or authenticated-provider request. No new full build,
publication, Production or Sentry action is claimed.

The actual public adapter lists six sources across cards and questions. The
three main textbook editions and the Wang study have retained exact evidence;
BodyParts3D and Human Bio Media remain distinct source/media provenance items.
This inventory does not accept all linked claims or any third-party media.
Wider content follow-ups keep their recorded scope. Media disposition/delivery,
all-purchase activation and remaining launch journeys/decisions stay open.
The declined paid media proposal remains closed and R2 requests stay at $0.

## October 25 Human Biology edition and explicit license verified locally

Human Biology now identifies Willy Cushwa's OpenStax-CNX collection
`col11903/1.3`, revised December 1, 2015, in the retained June 27, 2018 PDF.
Physical page 4 explicitly grants CC BY 4.0 for the collection; the attribution
section lists the same license for all 70 modules. The exact 508-page artifact,
identity/license pages and module-version index are hashed in the retained
evidence. The generic library listing alone was not used to infer a version.

Only this source record's bibliography is corrected. Its stable ID/slug, existing
catalogue URL, usage scope and all 2,212 citation records/review states remain.
All 1,271 cards and 5,582 questions retain identity, order and study content;
364 cards and 1,247 questions show the clarified bibliography. No source prose
or figures are bundled. This verifies edition/license metadata, not every
existing factual claim, third-party image permission or commercial/clinical
acceptance. No wider content backlog is promoted into a new release gate.

All 193 focused tests, typecheck and changed-file lint pass with zero network
attempts during validation. The prior full build remains evidence for its pinned
candidate; no new full build is claimed for this metadata-only follow-up. Early
snapshot URL/normalization method errors and the unnecessary generated-locator
retarget were corrected, with their receipts retained. Source research retained
three public artifacts after discovery browsing; validation remained offline.

This work is on its own local child branch. The pending publication heads
`58a34e9` (Chimer) and `75d599a` (anatomy) remain unchanged. No push, authenticated provider,
database, credential, Production or Sentry action ran. The declined paid media
proposal remains closed; R2 request authority stays at $0. Other migration
release gates remain open.

## October 25 seven existing muscle actions now have exact reviewed citations locally

A complete source-only inspection found 100 declared-reusable action rows across
68 muscles without an exact reviewed action-ID citation. Seven existing actions
across Frontalis, Rectus Femoris, Lumbar Erector Spinae and Lumbar Multifidus are
now bound to precise, independently compared references. Four previously absent
action prompts become available. No authored action description is changed.

All original source, action and citation IDs remain. Five fact-source references
and corresponding teaching-membership references are corrected. Ten existing
source-pointer metadata rows are retargeted in place; only seven new exact
citations and one separately licensed primary-study source are added. The four
old action-group pointer IDs remain as pending history, distinct from the original
30 pending records. The adapter still requires exact reviewed IDs and matching
reusable fact/citation sources; negative runtime tests preserve these filters.

References use the already pinned historical A&P 2e chapters, the exact 2022
Applied Human Anatomy artifact and Wang et al. 2023's CC BY 4.0 modeling study.
Actual one-based PDF pages, article license metadata, selected study paragraphs
and all eight retained artifact hashes are checked. A frontalis article is
explicitly factual bibliography only, with its non-commercial license retained;
no article text or figures are bundled or assigned the book's license. Modeling
evidence does not establish patient outcomes or an exclusive stabilizer claim.

The original five regression failures are retained. All 193 final focused tests,
lint, typecheck, the exact-action audit and the existing 53-summary audit pass.
Whole before/after comparison preserves every original ID, all 1,271 cards and
all 5,578 original prompts byte-for-byte, adding exactly four action prompts.
The first integration's duplicate/stale pointer issue was fixed by preserving
reference cardinality in place. Early test/API, source-service and page-label
method errors and their accurate dispositions remain retained; successful public
reads were reused rather than repeated. Only public anonymous bibliography reads
occurred; local validation records no network or blocked-executable attempts.

Source commit `f65a004` passes the exact cached offline full webpack build.
All 80 source input pins match. No database, credential, authenticated provider,
source publication, Production or Sentry action ran. Both owned dependency links,
the generated compiler cache and temporary build/baseline source archives are
cleaned up. Retained evidence, shared caches and unrelated work are preserved.

The broader action-citation backlog is now 93 rows across 64 muscles; it is not
reported complete. The separately documented 31 sparse muscle records remain
content follow-ups and are not silently promoted into a new migration release
gate. Other source/version review, media independence, all-purchase activation
and final journey/launch decisions remain open. This source candidate remains
local and unpublished; hosted reconciliation needs its own scoped approval.
Media request cost stays at $0 and the declined paid proposal remains closed.

## October 25 reviewed A&P summary sources pinned and clarified locally

The 53 current A&P summaries now identify the exact retained Anatomy and
Physiology 2e revision rather than a moving first-edition URL. All seven earlier
summary-source gaps are resolved with retained publisher sections, three precise
description changes and two clearly separate supplemental bibliography references.
Dense fascia is qualified, muscular support tissue is distinguished from skeletal
contraction, and the whole clitoris is distinguished from its external glans.
No article text or figures are bundled or assigned the book's CC BY license.

The 271 retained citations now have exact archived paragraph references and
explicit authored-summary, source-linkage, broader-lookup or teaching-group
context. Each keeps one clickable primary URL; secondary references remain in
its explanatory note. Existing review flags are preserved, not presented as
271 independently clinically accepted facts. A substring-derived urinary-system
association for the bulbourethral gland and its generated citation are removed
locally; reproductive and true urinary memberships are preserved. Hosted rows
are untouched and need separately authorized targeted reconciliation before
future seeding or cutover.

All 184 focused tests, typecheck, changed-file lint and both audit commands pass.
The live-source audit matches 25 retained artifacts, 87 paragraph bindings and
all 53 current authored summaries. Complete before/after comparison preserves
all 1,271 cards and 5,578 prompt IDs, order and coverage. Only declared source
metadata, citations, three descriptions and the false association change.

Source commit `fca21b8` passes the full cached offline webpack build.
All 73 build input pins match. Local validation records no network or blocked
executable attempts; no Prisma generation, database, credential, authenticated
provider or Production action ran. Earlier public bibliography research remains
separate from this zero-network validation. The two owned dependency junctions,
temporary build source/archive and generated compiler cache are cleaned up;
shared cached dependencies and unrelated local work are preserved.

This local candidate is unpublished. The field-level muscle gaps and exact action
citation bindings, other source collections, media independence, all-purchase
activation and final journey/launch acceptance remain open. The owner declined
the optional $15 media-verification ceiling; that proposal is closed. R2 requests
stay at $0 and approved additional storage at 30 cents/month before tax. Unknown
operation counts are not zero evidence. No further paid run is activated.

## October 25 broader anatomy labels no longer grade as equivalent names locally

The real study adapter previously accepted fluid connective tissue as the name
of blood and large bowel as the name of colon. A focused entity-specific rule
now omits those two broader labels from public aliases and all derived name
answers. Existing raw terms/IDs, source/citation rows, summary text and lookup
remain intact. Legacy large-bowel lookup still maps to the large intestine;
blood lookup and other valid aliases retain their observed behavior. No global
terminology blacklist or new anatomy classification was introduced.

The two actual grading regressions fail before integration and pass afterward.
All 48 focused study/region/community/Anatomime/provenance tests pass, as do
typecheck, changed-file lint and the retained-edition audit. The initial new test
incorrectly expected legacy large-bowel lookup to choose colon; that method error
and the original result remain retained. A separate corrected original-source
run isolates the two real grading failures. The first sandbox typecheck failed
only writing its generated cache; its distinct permitted rerun passes.

Actual before/after projection compares every card/question: all 1,271 cards and
5,578 prompts keep IDs, order and coverage. Only two card alias sets, eight prompt
alias lists and the two derived name-answer sets change; every other field is
byte-equivalent. The raw seed and all 53 authored A&P summaries are unchanged.

The exact local source commit passes the full cached webpack build with the
local Inter fixture and real DSEG7 Modern font. Six build-denial receipts record
zero network or blocked-executable attempts. No Prisma regeneration, database,
credential, authenticated provider, source publication or Production action ran.
All 67 build input pins match. The two owned dependency junctions, temporary
build source/archive and new compiler cache are removed; shared dependencies
and unrelated work remain intact. No browser/hosted acceptance is inferred.

The local candidate remains unpublished. The seven summary-source gaps, exact
term/relationship attribution, field-level muscle content, media, all-purchase
activation and final launch acceptance remain open. Three further public archived
text sections are retained for that next source review, without changing summaries
or scientific-review flags. Those public bibliography/text reads are separate
from the zero-network validation; no R2 read or paid media run was performed.

## October 25 exact A&P citation scope classified locally

The remaining 272 A&P source rows were read from the actual bundled seed and
bound to their current records: 53 authored summaries, 53 entity-source pointers,
77 terms and 89 relationships. Every row currently carries reviewed status.
The 219 generated source-reference rows inherit that status from source usage
scope; the generator note describes source linkage, not an independent review
of each anatomical claim. Do not report 272 scientifically verified facts or
silently upgrade them based on the historical edition license.

The next source review must cover exact names/aliases and relationship semantics,
as well as the seven summary gaps. In particular, inspect the broad blood/fluid-
connective-tissue and colon/large-bowel aliases, tissue-category versus material
grouping, practical musculoskeletal cross-links and bulbourethral urinary-system
membership. These are review targets, not already executed corrections or a
claim that every existing association is false. Preserve stable identifiers.

The pure source reader resolved every binding, preserved all 52 runtime/seed
hashes and recorded zero network, child-process, database or credential attempts.
No runtime or scientific-review flag changed. This narrows the concrete review
work before source retargeting; it does not close clinical or commercial release.
The paid media proposal is separately declined and remains closed at $0.

## October 25 anatomy summary comparison completed; seven evidence gaps isolated

All 53 A&P-dependent authored summaries now have an explicit comparison against
the pinned CC BY 2e text: 45 have supporting passages for their core anatomical
clauses, seven need additional evidence or narrower wording, and one is expressly
AtmoShaper-authored browsing taxonomy. Seventy-eight paragraph bindings retain
exact revision, element, line and text-digest evidence. Educational-purpose
sentences are distinguished from external anatomical claims.

The seven pending summaries concern collagen-fiber examples, connective-tissue
membership, dense connective tissue, extracellular-matrix load transfer, loose
connective tissue, muscular-system membership and whole-clitoris versus glans
description. A missing locator is not proof that a statement is false. Preserve
those distinctions when preparing corrections; do not silently approve them.

Two additional public text modules close the bone-function and muscle-force
locators. Both are collection members at the same pinned revision. Their 24,262
bytes are retained outside Git with hash/size pins; no images are fetched. This
slice made two unauthenticated direct public text GETs, separate from public web
research. No authenticated provider, database, credential or Production action ran.

The independent integrity check matches all 53 unchanged summaries and all 78
paragraph/line bindings. The six provenance tests and actual retained-artifact
audit pass again, with four denial receipts and zero network/executable attempts.
All 52 runtime/seed pins remain unchanged; no dependency link, browser or server
was created. This is summary-source comparison, not clinical acceptance, a review
of all 272 citation rows or commercial clearance. Runtime source/summary/citation
flags stay unchanged, and the local candidate remains unpublished.

Next resolve the seven wording/evidence gaps, distinguish authored taxonomy in
attribution and review the remaining term/relation/citation bindings before an
explicit versioned runtime source change. The four action-binding and 31 direct
detail gaps, media, all-purchase activation and final launch gates remain open.

## October 25 publisher-pinned CC BY edition evidence verified locally

Direct public publisher history identifies the March 19, 2026 CC BY-NC-SA change
at `fdfa6e2`. Its parent `b0058a743bdd2cc08196abaaa7d5469970c0d80c` retains CC BY
4.0. The same revision's README and collection explicitly identify Anatomy and
Physiology 2e under that license. This is a verified historical second-edition
candidate, not a blanket clearance for today's website, third-party components
or the existing unversioned first-edition source record.

The local `codex/anatomy-source-provenance` candidate retains a hash/size manifest
for LICENSE, README, collection and seventeen selected text modules. It records
all 53 current A&P-dependent card selectors and their unchanged authored inputs,
with candidate chapter locators. Every claim binding remains needs_review;
runtime source metadata, source IDs, usage scopes, citations, cards and review
flags are unchanged. No textbook prose or figures are copied into the app.

The named audit matches all twenty retained artifacts (644,933 bytes) and all 53
current card inputs. Six negative/positive tests pass for tampering, moving
revisions, changed or missing coverage, duplicates, unretained modules, path
traversal and accidental review promotion. Changed-script lint passes after a
reserved local variable was renamed; the first lint failure is retained. Six
final denial receipts record zero network/blocked-executable attempts. Archive
integrity remains distinct from scientific approval and commercial acceptance.

Twenty-two direct unauthenticated public history/text requests retained the
publisher evidence, with no retries or image requests; public web bibliography
checks are separate. No authenticated provider, database, credential, cloud
mutation, source publication or Production action occurred. All 52 runtime/seed
pins match the prior clean candidate. The owned dependency junction is removed;
shared dependencies/schema and unrelated work are preserved. The original
region-answer branch stays clean. This local evidence branch is unpublished.

Next review the 53 claims against these retained sections, prepare precise
field-level citations and explicitly review any source-edition retargeting and
attribution. Do not infer approval from an archive hash. The four action-binding
and 31 direct muscle-detail gaps, broader content/model acceptance, media,
all-purchase activation, hosting and public-cutover gates remain open.

## October 25 source-backed region answers repaired and verified locally

The local candidate on `codex/anatomy-region-answer` requires an explicit,
recognized source region before generating a graded region question. It omits
229 concept and ten body-surface questions whose answers came from the Spine
fallback. All 1,271 card DTOs, every non-region question and all 1,032 retained
region questions remain byte-equivalent to `58a34e9`; no fact, citation, stored
configuration, stable identifier or new anatomical classification is changed.
Legacy display/filter grouping remains compatibility data pending content review.

The original adapter fails three meaningful regressions. The final candidate
passes all 37 focused study/community/Anatomime contracts, repository typecheck,
changed-file lint and the full cached provider-free build. Six actual anonymous
Chromium cases pass at 1440x1000, 390x844 and 320x740: unsupported region-only
selection renders zero eligible prompts with Start disabled; selecting a supported
category question recovers the deck; a supported upper-extremity region question
still grades correctly. Each typed answer reaches 1/1 correct, guest saving shows
the sign-in requirement, Setup remains usable and the original stored config
is preserved. Representative desktop/phone screenshots were inspected.

Browser scope is the real bundled client fallback: the two exact prompt/deck
APIs deliberately return 503 before database-capable handlers dispatch. Twenty-
four resource-error entries match those fixed boundaries; twelve warnings are
the expected fallback or Playwright service-worker isolation warning. They are
retained and classified, with zero unclassified errors/warnings, client errors,
blocked external requests or unexpected mutation attempts. No fixture supplies
question/count content. This does not verify normal hosted APIs, persisted
progress, PWA behavior or a new scientific taxonomy.

The browser/server are closed, port 3194 is clear and owned profiles, temporary
source/build/archive and two dependency junctions are removed. All 65 pinned
inputs still match; shared dependencies/schema and unrelated work remain intact.
The validated application source is `5f5b4a4`; publication/review is still pending.
No provider, credential, database, account, media, payment, email, Sentry or
Production operation ran. The separate Chimer publication and media budget
decisions remain pending. Full anatomy/content/rights, the 31-muscle/citation
work, all-purchase activation and public launch are not closed by this safeguard.

## October 25 Chimer repair integrated with merged main and revalidated locally

The owner-approved PR #44-51 batch is complete at main `af5373d`; all eight
hosted candidates are READY, final combined-main CI passes and captured public
routing is unchanged. The historical pending-merge checkpoints below do not
reopen that completed batch. No public promotion or Sentry activation occurred.

The separate auxiliary-display repair now starts from that merged main on
`codex/chimer-main-integration`. Its original `68a116f` branch is retained.
All 80 pages, 62 API handlers and reviewed Calendar changes are preserved.
This route/source comparison does not claim whole-site journey acceptance.

Fresh real-shell verification exposed a position-only control-root change that
the dimension observer missed. The shell now observes that portal owner's
class/style and child changes as well, coalesces measurements through the
existing animation-frame owner and disconnects the added observer on disposal.
The deterministic regression fails before the fix and passes after it.

All 41 focused Chimer checks pass. The integrated Calendar suite has 46 passes
and one POSIX-only skip. Named focused lint and the full provider-free build,
including normal TypeScript validation, pass. The earlier 90-second lint wrapper
timeout remains an unverified attempt; the separate terminal lint result passes.
Sixteen actual built-app cases pass across 320px/390px phones, 640px landscape
and 1440px desktop with the real DSEG7 Modern font and saved Digital selection.
Screenshots were inspected; the existing landscape settings-sheet priority is
preserved. Only unrelated Inter uses the local build fixture.

The owned browser/server are closed; the exact source/build snapshot, temporary
archive and one dependency junction are removed. Sixteen current runtime/test
inputs match the validated snapshot. Shared dependencies and generated Prisma
schema are preserved; receipts and screenshots remain. No provider request,
database, real account, game, checkout or configuration change ran. This follow-up
is local and unpublished; its publication/review and final migration release
gates remain separate from the completed eight-PR batch.

## October 24 Chimer auxiliary-toolbar collision repaired and locally verified

The auxiliary timer/clock now uses actual toolbar and top-control bounds. It
moves below those controls only when they intersect, stays within the visual
viewport and reserves its lower edge in the primary display's existing safe
region. Wide-screen placement, the selected DSEG7 Modern font, saved Digital
settings and display actions are preserved. The shell releases its inline
reservations and observers on owner removal or unmount.

The meaningful browser baseline reproduced the collision at phone and narrow
landscape sizes. The repaired named suite passes all 40 focused checks, including
eight real-shell browser scenarios, existing immersive contracts and real-font
checks. Focused lint, repository typecheck and the complete inert-provider build
pass. Six build guard receipts and seven focused-suite receipts record zero
network attempts. Earlier fixture setup failures remain separate from the
reproduced application geometry failure; no dependency was downloaded.

The built application passes 16 checks across 320px/390px phones, 640px landscape
and 1440px desktop: standalone clock, running timer, Clock settings and primary
display swap. Screenshots were inspected. Toolbar clearance and the protected
centered-display/settings-panel contract pass; this does not claim the accessory
is always visible beneath an intentional settings sheet. The landscape side
sheet retains priority over part of the auxiliary display, as before.

The browser/server are closed, and the owned source/build snapshot plus two
dependency junctions are removed. Shared packages, the cached Prisma schema,
existing typecheck cache, receipts and screenshots are retained. No database,
real account, game, payment, provider request or configuration change ran.

This is a separate local candidate on codex/chimer-secondary-clock-layout.
PR #51's reviewed branch remains at 5769db5; all eight existing PRs retain their
green reviewed heads and the earlier no-merge hold. The prepared complete merge
batch awaits the owner's decision. This new runtime candidate is unpublished;
no push, merge, Production promotion, media exposure or Sentry activation follows.

## October 24 selected DSEG7 Modern implemented and locally verified

The owner selected DSEG7 Modern. The unmodified v0.46 WOFF2 and author's original
OFL/copyright are vendored; the Digital family and saved digital settings remain
compatible. Unit and meridiem letters retain readable fallback fonts. The
Digital-7 permission inquiry is superseded and remains unsent. No font purchase
or global installation occurred.

The build-relative font URL emits a fingerprinted static asset that the existing
service worker caches. Digital's digit slots now use its real fixed advance,
with natural separator widths; all other font choices retain their prior widths.
The overlap regression failed before that repair and passed afterward.

Three focused tests, changed-source lint and the complete inert-provider build
(including TypeScript) pass. Ten desktop/mobile built-app cases verify primary
clock/countdown fit, individual glyph fit, fullscreen, saved Digital selection
and exact cached-font readback while offline. Four actual Anatomime timer-style
cases also fit; no game/controller or closed realtime test was replayed.
The real Modern binary was used throughout; only unrelated build-time Inter
used the cached local fixture. Zero external/provider/database requests ran.

Screenshots were inspected. The browser/server, both owned dependency junctions
and temporary source/build snapshot are closed or removed; shared packages and
the Prisma schema are preserved. Receipts and screenshots remain retained.
This closes the local font slice, not full immersive-screen or release acceptance.
The mobile running-timer screenshot also exposes the auxiliary clock beneath the
open toolbar; its cause and layout repair remain a separate investigation.

The [selected-font plan](superpowers/plans/2026-10-24-local-digital-font-rights.md)
records scope and evidence. The owner subsequently approved regular PR #51,
stacked on #50, and its CI/Preview and included review/fix loop. At this
publication checkpoint, checks and documentation follow-up are in progress.
Merge, Production promotion and Sentry activation remain held.

## October 24 free clock-font alternatives requested and compared

The owner requested free alternatives before any Digital-7 commercial-permission
request. Four candidates now have current original-license evidence: DSEG7
Classic, DSEG7 Modern, Digital Numbers and Share Tech Mono. All are OFL 1.1;
commercial website use and self-hosting are permitted with their applicable
copyright/license notices retained. Classic is the first visual recommendation,
not a selected replacement. The existing permission inquiry remains unsent.

A self-contained local comparison rendered all four original fonts at desktop
and mobile widths. Both views passed font loading, clipping and editable-text
checks, with zero external browser requests, no server and the browser closed.
The images were visually inspected. This is style comparison, not actual-app
geometry or release acceptance. The live font is unchanged, and no font was
purchased, installed globally or published. Owner choice and real-app validation
of the selected font remain pending. Other migration work and the original
private-copy worker continue within their existing authority.


## October 24 font permission investigation; optional local candidate held

The owner asked whether the existing Chimer font must be replaced. Keeping the
current design is preferred if applicable commercial web-use permission can be
established. The owner confirms there is no existing commercial license or
written permission. No replacement has been selected. The author's old README,
reproduced at https://urbanfonts.com/free-font/digital-7-1, mentions a historical
$24.95 commercial offer; no current price, working purchase channel or grant for
this exact website is verified. The author product page could not be accessed.
Do not treat that old price or the separate freeware clause as current clearance.
No author message or purchase has been sent.

This worktree contains only an unpublished provisional Classic alternative,
including original OFL/copyright, stable Digital settings and ordinary suffix
fallbacks. Its two font-delivery/metric tests and scoped lint pass. No app build,
site activation or source publication occurred; its browser and dependency
junction are closed/removed. The live font is unchanged. The
[local plan](superpowers/plans/2026-10-24-local-digital-font-rights.md) is a held
candidate, not a selected substitution or authority to publish it.

Independent migration work continues: PR #49 at `671d7f2` has passing exact-head
CI/Preview, completed CodeRabbit with no actionable findings and 100% docstrings,
and no unresolved review threads. PR #50's included review found one test-driver
dependency issue. It is fixed and published at `5c8a133`, with thirteen lifecycle
cases and focused lint passing; the thread is resolved. All eight exact-head
GitHub checks and Vercel Preview now pass.
Fresh included review confirmation remains queued no earlier than October 25 at
00:35:35 UTC. Both PRs are regular and unmerged.
The approved private media-copy worker remains active under its original
October 25 05:14:25 UTC absolute stop, with no new work after 04:59:25 UTC and
65,064 new reservations retained as spent. Do not restart/retry that worker or
reuse its credential for another operation. Final copy verification, temporary
cleanup and owner revocation are still pending. Preserve source buckets, old
sites and all unrelated resources. No merge, Production change or Sentry
activation is authorized. The full migration remains active; inherited older
snapshots below do not reopen closed Ably/Sentry/Stripe test scopes.

## October 23 business planner storage recovery — locally verified

The six real business clients now keep working when device storage cannot be
read or written. A shared hydration/autosave owner protects unread drafts and
preserves existing keys, normalization and calculations; a polite notice reports
read/save failure. Income's initial server seed and existing account-sync
boundary remain separate, and refreshed initial props cannot replace an edit.

Local validation passes: 46 tests (28 actual-client Chromium scenarios and 18
calculation/source regressions), final typecheck and changed-source ESLint. Six
duplicate storage-effect owners are retired. Cached dependencies/Chromium were
reused; fixture bundles and contexts are closed. No real account/database or
provider workflow ran. The [repair plan](superpowers/plans/2026-10-23-business-planner-storage-recovery.md)
records evidence and remaining hosted/artifact acceptance. This new branch is
local and unpublished; no merge or Production change occurred.

The separate global review checkpoint at 23:11 UTC had #44 `2feac62`, #45
`f0d9e5c` and #46 `877d50d` green with zero unresolved threads and no merge.
The R2 inventory budget decision remains pending. Older base-branch snapshots
below are historical; they do not reopen those completed review requests.

## October 23 Anatomime runtime-repair candidate

Room creation now supplies an opaque primary key, Ably requests use canonical
capabilities and LF-terminated MAC fields, joined-room URLs survive reload without
exposing player passes, and progress locks use PostgreSQL/adapter-supported
parameter/result types. Schemas, permissions, attribution and stable identifiers
are preserved.

Production webpack/TypeScript and focused lint pass on this candidate's reviewed
Sentry base plus its four runtime repairs. Named suites pass 157 realtime, one
room-insert, 43 progress and six receipt cases. All 58 distinct intercepted
browser cases pass (29 desktop, 29 mobile), with unchanged assertions/timing
limits, one worker and zero retries. The initial operator-capped run retained
23 passes; exactly its 35 unrun cases completed under the same build/source.
Current Anatomime test inventory registers 174 focused Node cases and 58 intercepted desktop/mobile browser cases.
The selected Node inventory is separate from added signer/room/progress suites;
historical 174/174 and 42/42 Layer B receipts stay fixed.

The [source audit](audits/2026-10-23-anatomime-source-closeout.md) records scope,
cleanup and the retained capped-run result. This is source/intercepted QA, not
another real database, phone or sign-in run. Those earlier acceptances remain
separate. Hosted CI/Preview/review and final public/provider binding remain open;
no merge, Production promotion or Sentry activation follows from this candidate.

Verified: 2026-10-09

Evidence scope: October 8 hosted main/PR #42 merge truth, authenticated hosting,
Sentry project privacy readbacks, public media-index and R2 configuration metadata,
owner aggregate-storage evidence, authorized zone/DNS reads and current source
inspection. October 9 reads additionally verify the approved pending Free zone,
owner-completed eight-record staging and exact pending/current-authority values,
unchanged eight-row DNS contents at both current authorities, pending-authority
readback controls, current Stripe Tax settings/registrations, parent DS absence,
proposed media-host collision checks, unchanged Sentry privacy metadata and exact
current Production database configuration/resource identity. The approved scoped
Ably inventory is complete: the replacement token has the exact three permitted
capabilities, and complete app/channel-rule metadata identifies one enabled,
TLS-only app with no configured channel rules. Two completed hourly statistics
windows return no rows; keys, billing limits and actual game acceptance remain
unverified. Earlier payment,
Calendar, public-page, and provider receipts retain their original dates. A name
inventory does not verify secret values or live feature acceptance.

This is the read-first source of truth for the fresh AtmoShaper repository. Use it before `docs/project-log.md`, roadmaps, TODO files, audits, plans, or wiki pages when deciding what is active now.

## Current Goal — Independent AtmoShaper Ready for Marketing

The user clarified the finish line on October 8: complete the surrounding service
migration so AtmoShaper can operate independently and be marketed with working
functionality. Ably-backed remote Anatomime is required; polling fallback alone
does not close it. Include privacy-safe operational Sentry, media administration
and branding, independent mail/support/provider ownership, and the remaining
purchase activation gates. Broader refactors stay deferred.

The user's working MassageLab clock and tools must remain available during the
transition. Useful legacy resources may be assigned or migrated to AtmoShaper
after their consumers and rollback are known. Do not infer permanent shared
infrastructure or blanket old-site retirement from this scope. The future
MassageLab product remains separate. No automatic account, billing, or PHI
transfer is authorized.

The [independent launch plan](superpowers/plans/2026-10-08-atmoshaper-independent-launch-readiness.md)
owns the remaining work, acceptance evidence, and exact provider-change packets.
The [morning review](superpowers/plans/2026-10-09-atmoshaper-morning-review.md) consolidates already-approved owner steps, source publication and the remaining inputs.

This goal is active; the narrower public launch is complete, while independent
marketing readiness is not yet proved.

| Area | Current state | Remaining gate |
| --- | --- | --- |
| Source and review closeout | PR #41 merged on October 8 as `acd05b07fb67e2af1e49965ce3d2c11b97947d3f`; that merge is the completed source checkpoint. Reviewed source passed all seven jobs, 5,199 unit passes/two skips and 596 browser passes/178 gated skips, clean Codex/full CodeRabbit, and all 32 valid threads resolved | These results cover that source; later changes need their own applicable validation/reviews |
| Independent launch source | PR #42 merged as `357095da32e561d28d2aa7fdd8bf784f74b45d2b` on October 8 after exact-head CI, Preview, clean Codex and full 37-file CodeRabbit coverage. All seven jobs pass: 5,223 unit passes/two skips and 606 browser passes/178 gated skips, no final failures or flakes reported; five pre-merge checks pass with 93.94% touched-function docstrings. Reviewed and merged trees match | The user approved publication of the media/monitoring follow-up as [draft PR #43](https://github.com/dsbowersock/atmoshaper/pull/43), including ordinary CI/Preview, fresh reviews and valid owned fixes. Its initial `fd50482` checkpoint has READY Preview, passing Browser build and clean Codex; full 26-file CodeRabbit completed with two documentation findings and 77.42% touched-function docstrings, below the 80% gate. The source follow-up corrects those summaries and adds focused helper comments. All latest-head checks and reviews, including full coverage and the docstring gate, must pass before readiness; publication does not approve merge or Production rollout. Initial receipts become historical after a new head; do not reopen completed PR #42 |
| Public release and hosting | PR #40's reviewed `38d0ded` artifact remains READY and assigned to all six saved live aliases. PR #42's automatic main candidate at `357095d` is READY and unpromoted; its standard build, migration/Supporter gates and 115 static pages pass. Final October 8 readback verifies preserved aliases, manual custom-domain assignment, Git/main and protection; no restoration or promotion occurred | Keep standard build and saved alias recovery; future public release is a separate exact-artifact operation |
| Environment inventory | October 8 readback has 60 Production-only settings and none in Preview/Development; no Ably, Sentry, or R2/upload configuration | Identify exact independent provider resources without exposing values; absence of upload settings does not prove media playback absent |
| Database resource identity | October 9 current Vercel metadata binds both Production database variables to one owned, active integration store. Its external resource ID exactly matches the separate AtmoShaper Neon project; the store has one connected project, matching this app. Native project inventories distinguish the retained legacy projects. Metadata confirms one branch/compute endpoint and a six-hour history window on the current Free plan; no connection strings or user rows were read | Exact deployed credential/branch binding, administration and billing accountability, agreed recovery objectives and bounded restore acceptance remain gates. Configuration identity is proved; no database migration, restore, credential change or legacy retirement follows |
| Registration and recurring Supporter | Open; completed dedicated billing/readiness and controlled payment/refund receipts retained | Preserve existing purchases and reconciliation; do not repeat the completed bootstrap/payment test |
| One-time support and permanent backgrounds | Disabled under the completed Supporter-only launch, rather than permanently excluded from the product design; reviewed PR #42 adds an explicit all-payment build scope with an unchanged Supporter-only default | October 9 exact-account reads confirm active Stripe Tax settings and one active registration with complete one-page inventory. These do not establish the five one-time attestations, product classification, background wallet/reconciliation or new-flow acceptance; all remain required before hosted activation |
| Calendar | Separate credentials and approved public rollout complete; bounded provider/application tests and teardown complete | A separately scoped real signed-in Production connection/sync is still needed for the broader readiness goal; do not redo setup or earlier tests |
| Anatomime realtime | Reviewed PR #42 fixes SDK renewal to obtain a fresh room-authorized grant rather than replaying setup. Current Production still lacks Ably configuration. October 9 approved read-only inventory is complete: one enabled app named `atmoshaper` requires TLS; its channel-rule list is empty. The exact thirty-day grant is limited to app/channel-rule metadata and aggregate statistics. Two completed hourly windows return no statistics rows; this is not historical-use or quota proof | Administration/billing and quota limits, isolated verification app, dedicated server-key/environment binding and bounded host/phone game/reconnect acceptance remain gates. The [binding plan](superpowers/plans/2026-10-09-atmoshaper-ably-binding.md) preserves room-scoped client tokens and server-only publishing. No key read, game traffic or provider write occurred; agent dashboard policy remains unresolved |
| Sentry | Separate project creation and the approved project-only privacy change are complete. Readback verifies six removal rules, inherited IP prevention and unchanged other project, organization and legacy settings. Current monitors have no attached workflows; no owner alert delivery is proved. October 9 exact existing-key readback verifies an active key for this project without retaining its secret; its key-specific rate limit is unset and the documented project repository-link list is empty. The bundled SDK remains the activation path; remote-loader defaults are not an application collection receipt. October 9 metadata confirms unchanged privacy, disabled sharing and inherited IP prevention, no first event, no visible environments and no release rows. Collection remains unbound | Retention/quota/billing, release/source maps, approved owner alerts and one sanitized synthetic-event acceptance remain gates. The automatic build exposed separate vendor-plugin telemetry; a local correction disables it in all builds. Follow the [operational runbook](wiki/sentry-operations.md) |
| Media, mail, domains and other providers | The [media consumer map](wiki/media-independence.md) distinguishes cutovers. All 228 declared public JSON indexes contain 6,800 legacy-origin sample references, with zero payload requests. Read-only R2 inventory verifies the three owner-confirmed buckets: public/anatomy retain active legacy custom domains; the private bucket has no custom domain, and public development access is disabled on all three. Owner aggregate evidence shows about 15.95 GB, including an empty private bucket | Local Generative.fm preparation adds an exact-origin opt-in for index and nested sample URLs, with legacy default and partitioned caches; no hosted binding is set. Metadata-only Signature preparation rebuilds all 1,800 rendition references with a verified new revision and exact rollback, retaining the current runtime catalog; its candidate is private. The Chimer metadata plan verifies both exact bases against actual resolvers: the 84-entry published release and 83-entry fallback retain identities and geometry. Configuring a previously absent published base activates that existing path; current hosted values are not inspected by this plan. Source inspection now distinguishes anatomy's study-loader cohort from broader entity-detail media. A protected two-query count-only packet is prepared but unexecuted; exact target/read authority and deployed binding remain gates. Independent administration/billing, exact DNS onboarding, anatomy and remaining consumers, branded delivery and offered playback/legacy-tool continuity remain open. The [compatible media plan](superpowers/plans/2026-10-08-atmoshaper-compatible-media-cutover.md) preserves old domains and payloads; rounded owner counts are not object-level integrity or migration proof |
| Cloudflare storage and domain access | The corrected saved storage token is valid and bucket metadata access works; three default-jurisdiction buckets are verified, EU/US have none and federal jurisdictions remain unverified. The approved owner-created full Free zone exists in the correct storage account. October 9 owner import and direct readback now verify all eight preserved rows: two A, two CNAME, one MX and three TXT. All eight displayed records are DNS-only with five-minute TTL. Fourteen pending-authority queries match complete values and TTL 300, including MX priority 10; fourteen current-authority queries retain the same values. Direct/recursive NS checks retain Namecheap as live authority | October 9, 16:20 UTC local export verification matches all eight complete values, MX priority, TTL 300 and four explicit DNS-only tags against the approved file; a byte-identical protected backup is saved. Cloudflare-generated NS/SOA entries match the assigned zone and do not authorize delegation. Full old-zone completeness, fresh parent delegation/DS, exact cutover/propagation and saved-Namecheap rollback remain gates before separate nameserver approval. The existing record-list API grant remains denied and agent dashboard policy unresolved; no expanded credential or repeat import is needed. The owner forgot the proxy-import checkbox, but the prepared file's four explicit DNS-only tags override it and visible/readback settings pass. No agent DNS write, registrar change, private-object request, new media binding or hosting change occurred |
| Mail/support identity | Resend readback verifies `account.atmoshaper.com`, sending enabled, receiving disabled and click/open tracking disabled; advertised support remains the branded Gmail inbox | Actual Production SMTP binding, independent administration/billing, DNS alignment/delivery proof and any separately approved inbound domain routing |
| Search identity | Public robots/sitemap retain their dated old-www binding. Reviewed PR #42 corrects metadata, all 36 sitemap URLs and structured-data identity to canonical AtmoShaper www, omitting unverified legacy social equivalence | Exact-artifact public rollout; social-account ownership/link decisions remain separate and legacy callbacks/media are preserved |

PR #41/#42 final receipts remain private; the completed PR #40/#41 review heartbeats are paused. The
historical publication/review checkpoints below explain the completed work and
do not reopen completed PRs or override their merged status. Current source work begins
from the merged main above. Repository preparation and this clarified goal do
not identify an exact provider mutation, charge, database target, or retirement
operation; prepare those concrete packets before the applicable approval gate.

Current Anatomime test inventory registers 174 focused Node cases and 58
intercepted desktop/mobile browser cases. These inventory counts are separate
from the locked bootstrap's inherited 174/174 and 42/42 receipts below; added
renewal cases do not rewrite historical acceptance evidence.

## Historical Launch Receipt — Registration and Supporter Checkout Open

- The separately approved [Production Calendar credential/build stage](superpowers/plans/2026-10-07-atmoshaper-calendar-production-credentials.md)
  is complete. Exactly four Calendar settings were added to the existing
  project's Production environment; complete readback contains 60
  Production-only entries, with the original 56 entries' metadata unchanged
  and none in Preview/Development. The new stable encryption key has a private
  protected recovery copy; the actual app helpers pass a synthetic round trip.
  The single source-pinned candidate reached `READY` at
  `2026-10-07T21:03:42.652Z` from reviewed merge
  `38d0deddea484938e13df61927d07a7b21f92071`, with all four keys in its deployment
  snapshot. Actual migration-status/live Supporter gates and all seven ordinary
  authenticated signed-out GETs pass; the Calendar page exposes only its
  sign-in guard. Sensitive values remain write-only; no real Production token
  exchange or signed-in Production Calendar acceptance is claimed. Final
  `21:09:12Z` hosting readback retains the PR #37 public target, all six saved
  live aliases, manual promotion, normal build/Git/protection, both pause flags
  false and absent excluded purchase switches. No alias restoration was needed.
  Temporary credential request files are removed; stable recovery is retained.
  The owner subsequently approved exact-artifact promotion and optional Calendar
  activation with bounded rollback. Final `21:50:03Z` readback verifies reviewed
  `38d0ded` as the READY public target and all six saved aliases on it, with
  configuration/build/Git/protection/manual promotion and key recovery retained.
  All seven anonymous public GETs and the Calendar sign-in guard pass; the apex
  retains its `308` redirect to canonical www. Registration and recurring
  Supporter Checkout stay open; the two other purchase flows stay disabled.
  No rebuild or rollback was needed. Calendar is available to eligible provider
  accounts; no Production OAuth exchange or live sync was initiated. The operator
  and guarded-harness closeout is published as [PR #41](https://github.com/dsbowersock/atmoshaper/pull/41)
  under the owner's source publication/review approval. At the initial October 7
  publication checkpoint, provider-free harness checks passed 30 with one
  POSIX-only test skipped on Windows; documentation/workload checks 16/16, lint,
  typecheck and branch private-data/link checks passed.
  Initial published head was `577298385fa1f387e91e3e98f3fb5e1398a38847`; hosted CI
  and full CodeRabbit/Codex reviews were pending at that checkpoint. Later dated
  results are recorded below; PR #41 carries live exact-head validation and review
  status. Merge and any future Production operation require separate approval.
  The initial full CodeRabbit review covers all eighteen files at `45bfb78`
  and finds one valid platform-command issue; Codex finds two valid operator
  cleanup gaps. The source follow-up fixes platform selection, run-marked lost
  response recovery and owned-token refresh after expiry. These improvements
  have provider-free regression coverage; the completed real tests are not rerun.
  The follow-up Codex review at `c7de5c9` finds two valid cleanup edge cases.
  The latest source fixes inherit an omitted refresh scope only from its
  validated captured grant and reconcile a lost DELETE response through complete
  inventory absence. Explicit scope drift remains rejected, rejected credential
  values remain quarantined, and absence receipts cover the current create intents.
  The next Codex round at `17e08e6` identifies diagnostics permissions and
  terminated-worker lock recovery. Source fixes protect diagnostic writes and
  reclaim only a recorded dead owner's lock while preserving live/unowned locks.
  POSIX permission assertions still require latest-head Linux CI.
  The following Codex review at `83f5b33` identifies a possible false token
  cleanup receipt after an uncaptured response. Unique token-attempt outcomes
  now gate cleanup start and completion; unresolved issuance cannot report
  revocation. Cleanup freezes new provider activity from the application before teardown.
  The latest Codex round at `efd9b19` identifies the vault/journal crash window
  and private-path containment. Encrypted captures now retain attempt/kind
  identity for exact journal recovery; canonical component checks preserve
  private siblings and reject files or symlink targets inside the checkout.
  The subsequent Codex review at `bc24073` identifies definitively rejected
  create intents. Matching parsed Calendar client errors now record non-creation,
  so cleanup can revoke tokens without inventory when every create was rejected;
  ambiguous responses retain reconciliation requirements.
  Codex's review at `8a12567` identifies POSIX descendant termination and
  direct cleanup request bounds. The launcher now owns and stops its POSIX
  process group, including escalation for ignoring descendants. Every cleanup
  provider request combines an eight-second deadline with its existing signal;
  interrupted requests retain intent/token evidence for scoped retries.
  Latest-head Linux CI must still verify the POSIX process/permission cases.
  The explicit full CodeRabbit review completes at `2026-10-07T23:40:57Z`,
  covering all eighteen files at `8a12567` with one minor stale-handoff finding.
  Both affected plans now identify completed setup as historical and point to
  the current published PR/provisioning/public-activation receipts. Its five
  pre-merge checks pass, including 86.67% touched-function docstring coverage;
  that review does not cover the subsequent source/documentation fixes.
  No further setup, file or completed-test rerun is needed.
  The next explicit full CodeRabbit review completes at `2026-10-08T00:43:19Z`,
  covering all eighteen files at `70a2ab1` with two valid harness findings.
  Malformed or null revoke-error bodies now preserve the HTTP failure receipt
  without claiming revocation. Both cleanup modes have an independent five-minute
  owned-process deadline; expiry stops the tree and records partial cleanup while
  retaining private recovery evidence. Normal run ceilings remain unchanged.
  Provider-free harness checks pass 33 with one POSIX-only test skipped on Windows,
  using normal process control after sandbox termination was denied. Lint,
  typecheck and documentation/workload checks 16/16 pass; renewed latest-head
  hosted validation and reviews remain pending.
  No completed provider activity, cleanup or public operation is repeated.
  The subsequent full CodeRabbit review completes at `2026-10-08T01:47:58Z`,
  covering all eighteen files at `3735e6a` with one minor stale Calendar-gate
  sentence in the migration wiki. That handoff now distinguishes the completed
  Calendar rollout from remaining old-origin and other gates, preserving manual
  public promotion and the Production acceptance limits. This documentation-only
  follow-up still needs renewed latest-head hosted validation and reviews.
  The next full CodeRabbit review completes at `2026-10-08T02:55:47Z`,
  covering all eighteen files at `cf889a0` with four valid findings. Historical
  pre-rollout handoffs are now dated and completed source publication points to
  latest-head reviews/checks. Server setup failures terminate the owned child;
  each new native pending-Disconnect rejection records its own current-server
  receipt, including markers split across stderr chunks. Provider-free checks
  pass 35 with one POSIX-only skip on Windows; lint, typecheck and documentation/
  workload checks 16/16 pass. The `2bd0d4c` checkpoint subsequently passed all
  seven CI jobs at `2026-10-08T03:28:05Z`: 5,191 unit passes with two skips and
  596 browser passes with 178 gated skips, no failures or flaky browser results
  reported in that run. Its exact-head Preview is READY and Codex is clean.
  Full CodeRabbit coverage completes at `2026-10-08T04:06:32Z`, covering all
  eighteen files with two minor findings and five passing pre-merge checks.
  The follow-up compares preserved cursors by source identity, accepting reordered
  rows while rejecting missing, duplicate, replaced or changed sources. Its local
  provider-free checks pass 36 with one POSIX-only Windows skip; lint, typecheck
  and documentation/workload checks 16/16 pass. Handoffs
  now date completed checks and point to PR #41 for live exact-head review/check
  status; final receipts stay private so recording them does not change the head.
  Later source fixes require their own checks and reviews. Merge remains separately
  authorized. No completed provider activity is repeated.
- The subsequent Codex finding closes an interrupted lock-release gap in the
  operator harness. A prepopulated PID-owned release claim serializes competing
  releasers, and the ownership-verified directory moves out of the canonical
  lock path before any owner record is deleted. Dead release claims remain
  recoverable; live and unrecognized locks stay protected. The provider-free
  regression interrupts the actual release before and after retirement and
  checks concurrent recovery and replacement-owner preservation. Live PR #41
  checks and reviews must cover this source fix before merge is proposed.
- The next Codex finding serializes bridge nonce read/claim/persistence under
  the shared ownership lock before issuing a synthetic session redirect. Seed
  and reconnect nonce publication use that same lock. The actual-entrypoint
  regression submits concurrent synthetic HTTP requests: exactly one normal
  request receives a session; invalid, repeated and pending-only requests are
  rejected. Framework/session dependencies are replaced and no real listener,
  application, provider or database starts. Live PR #41 remains the source for
  fresh exact-head validation and review status.
- Subsequent Codex findings protect the persisted Disconnect form, including
  rewrites of previously permissive files, and assign each recovery receipt its
  actual append time rather than an inherited intent time. The same private-file
  writer protects form fields and diagnostics. Provider-free cases cover new and
  existing files plus delayed calendar-inventory and encrypted-token recovery.
  Fresh Linux checks must independently prove POSIX permissions; live PR #41
  retains exact-head checks/reviews and the separate merge approval boundary.
- The next Codex finding closes cancellation during the launcher's initial
  journal-lock wait. Signal handlers own the child before awaited setup; every
  exit path drains teardown and removes the handlers, and cancellation cannot
  report command success. An actual-entrypoint provider-free regression signals
  the launcher while journal acquisition waits, with both successful acquisition
  and setup failure. Only synthetic children start; fresh Linux CI independently
  verifies POSIX signal delivery and the separately owned process group.
- Subsequent Codex findings require the entire returned grant to stay within
  approved Calendar and identity scopes, including Google's equivalent email
  alias, and persist token validation with the first encrypted capture. An
  interrupted valid exchange or refresh can therefore supply owned cleanup;
  unrelated scopes and incomplete exchange fields remain quarantined solely
  for revocation. Invented-token regressions cover both capture crash points,
  scope drift and cleanup after an expired prior grant. Live PR #41 retains
  fresh exact-head validation/review status and separate merge approval.
- The next Codex finding covers a stop after the encrypted temporary vault
  write but before its final rename. Recovery authenticates that file, checks
  the complete preserved history and matching pending token intent, and promotes
  the capture under the ownership lock. Rejected grants remain revocable only;
  partial, corrupted or mismatched replacements stay intact and stop dispatch.
  An interrupted empty-vault clear retains canonical grants for revocation.
  Provider-free regressions pause the actual writer and stop only its owned
  synthetic child. Local checks pass 43 with one POSIX-only Windows skip; live
  PR #41 carries fresh exact-head validation/reviews before separate merge approval.
- [PR #40](https://github.com/dsbowersock/atmoshaper/pull/40) merged under the
  user's exact approval at `2026-10-07T05:14:22Z` as
  `38d0deddea484938e13df61927d07a7b21f92071`. Reviewed head
  `0f486e554c9b3104dee70a3f2c00c33ffe031c7a` passes all seven CI jobs,
  Vercel Preview and clean Codex review. The completed explicit CodeRabbit full
  review covers all 20 changed files at that head with no new actionable
  comments; both earlier minor threads are fixed/resolved. All five pre-merge
  checks pass, including 100% touched-function docstring coverage. Its one
  automatic Production candidate reached `READY` at
  `2026-10-07T05:17:34.607Z`; actual migration-status and live Supporter readiness
  gates and all seven normal authenticated candidate GETs pass. Registration
  is open, Checkout pause copy is absent, and signed-out session is `null`.
  The candidate remains unpromoted. All six saved live aliases and the public
  target remain on PR #37; no alias restoration was needed. Fresh hosting
  readbacks retain manual custom-domain promotion, standard `npm run build`,
  GitHub/`main`, protection, verified domains/apex redirect, and then 56 Production-only
  variables with none in Preview/Development. Both public pause flags are
  `false`; excluded purchase switches and all four Calendar keys were absent at
  that initial candidate checkpoint, before the approved provisioning above.
  The owner reports `saved` after the approved six-entry replacement Google
  declaration guidance, then supplies Verification Center's exact message:
  verification is not required because the app requests no sensitive or
  restricted scopes. The owner also reports no entries in either category.
  This completes the declaration/status gate by owner receipt, not independent
  Console/API readback or inspection of every saved scope URL. No verification
  material or submission is currently required on that evidence. Bounded application/provider
  acceptance subsequently passed as recorded below; the later separate public
  activation is recorded above. That initial merge operation ran no manual build or completed
  live payment/Calendar comparison test; the later single credential build is
  separately approved and recorded above.
- [PR #39](https://github.com/dsbowersock/atmoshaper/pull/39) merged under the
  user's exact approval at `2026-10-03T17:02:47Z` as
  `2e01e8509b42ab73c85d286f2725c824770aeeec`. Reviewed head
  `7064a6fb63340fabc29adfd695e0824a1d21c2ed` passed all seven CI jobs and
  Vercel. CodeRabbit's explicitly triggered full review covered all thirteen
  files with zero actionable comments; Codex reported no major issues and no
  inline review threads remained. Its automatic Production candidate reached
  `READY` at `2026-10-03T17:05:28.696Z`, with actual migration-status and live
  Supporter readiness gates passing. All seven normal authenticated candidate
  GETs pass, including open registration, no Checkout pause copy, and a `null`
  signed-out session. This candidate remains unpromoted. All six saved live
  assignments and the public project target still use the approved PR #37
  artifact; no alias restoration was needed. Manual custom-domain promotion,
  apex redirect, deployment protection, and empty Preview credentials remain
  intact. Public registration/recurring Supporter flags remain `false` for
  pause, excluded purchase switches remain unset, and all four Calendar keys
  remain absent. No live payment test was repeated. The earlier event-read
  declaration approval is historical; the October 6 comparison supports a
  prepared availability replacement, recorded below. At that earlier checkpoint
  no replacement declaration had been approved or saved; the October 7 approval
  and subsequent owner save receipt above supersede that earlier status.
- [PR #38](https://github.com/dsbowersock/atmoshaper/pull/38) merged under the
  user's exact approval at `2026-10-03T02:55:51Z` as
  `c26e2f7b4c977a09f82f1eb83d1bde8f797f6bed`. Its reviewed head
  `3558ff4a81e03f347818acf6f14980c64a008118` passed all seven CI jobs,
  Vercel, full CodeRabbit coverage of all five files, and clean Codex review;
  all three review threads are resolved. The automatic main Production build
  reached `READY`, with actual migration-status and live Supporter gates passing.
  All seven normal authenticated candidate GETs pass, including open
  registration and a signed-out session of `null`. This is an unpromoted,
  documentation-only candidate, not a new public rollout.
  The build moved two convenience aliases to itself. Under the user's explicit
  saved-assignment restoration approval, both were restored to the saved public
  artifact. Final readback verifies all six recorded live assignments, public
  project target, domains/apex redirect, protection, and manual promotion intact.
  Public source remains `f184fc1d2ea9cf0adfeff7d810d9db408fc6970e`.
- The user clarified that no existing users are expected to have professional
  records needing migration. This is user-provided scope information, not a
  browser-storage or database audit. No vault-format mismatch was found: old
  and new source retain the established encrypted-bundle/storage contracts.
  Existing-user record transfer and a migration warning are not launch
  prerequisites on that basis. A briefly prepared generic import-replacement
  UI change was removed without publication; it left runtime unchanged.
  The [local-record/PWA scope checkpoint](superpowers/plans/2026-10-02-atmoshaper-local-record-recovery.md)
  preserves compatibility findings and proof limits without scheduling
  unnecessary user recovery or old-site changes.
- Next migration focus is the already-selected separate AtmoShaper Calendar.
  The [provider-stage checkpoint](superpowers/plans/2026-10-02-atmoshaper-calendar-provider-stage.md)
  owns the exact replacement declaration, completed bounded acceptance and
  rollback boundaries. Google sign-in is operational. The user reports creating
  the separate Production Calendar Web registration with only
  `https://www.atmoshaper.com/api/calendar/google/callback` as its return URI,
  and enabling Calendar API under separate approvals. The owner supplies the
  downloaded Production JSON path; private inspection validates the Web/client
  format, Production project and sole exact Calendar callback. This is a saved
  download receipt, not a new live token exchange or Console readback.
  The October 7 owner save/category/status receipts close the replacement
  declaration gate; do not repeat scope selection, save or the completed
  Verification Center question. Preserve identity/client/audience settings.
  The [isolated application acceptance plan](superpowers/plans/2026-10-07-atmoshaper-calendar-application-acceptance.md)
  now records a completed, partial application run against exact merged runtime
  `38d0ded`. Real callback/encryption, persisted access, PostgreSQL rollback/locks,
  rename/reconnect, source selection, inbound changes/cursors, generic outbound
  events, resolved Disconnect, and durable uncertain-create/no-repost/reconciliation
  checks pass. All three approved consents and the four-calendar/six-event lifetime
  budget were used. Teardown began about 38 minutes after database creation,
  within the approved 90-minute ceiling. Both app targets are absent, all new
  test tokens are revoked, the exact temporary Neon project is absent from its
  active organization list, owned processes are stopped and ephemeral credentials
  removed. The owner reports both source calendars permanently deleted; independent
  active-list reads confirm absence in both owning accounts. No resources remain
  active from this run.
  The remaining native pending-Disconnect case now passes in its separately
  approved database-only follow-up. The corrected native multipart request reaches
  the actual action, whose exact current-server reconciliation error, correct
  session/form identity, absent success redirect and unchanged pending row are
  verified. All seven touched tables are empty before exact project deletion;
  independent active-list absence, stopped server/released port and ephemeral
  credential removal complete cleanup. Teardown began after 4.72 minutes, within
  the approved 15-minute ceiling. No Google credentials, grants or fixtures were
  used or repeated. The two runs close the bounded application acceptance gate.
  At that completed-run checkpoint, the local harness passed 18/18 provider-free
  checks, including blank Google
  credentials, no external fetch and a 15-minute bound for the completed
  [pending-action follow-up](superpowers/plans/2026-10-07-atmoshaper-calendar-pending-disconnect-acceptance.md).
  Both exact database authorizations are exhausted; no test resource remains
  active. Runtime source remains unchanged. The subsequently approved
  [Production credential/build stage](superpowers/plans/2026-10-07-atmoshaper-calendar-production-credentials.md)
  now passes with 60 Production-only settings and one new exact-`38d0ded` READY
  candidate. The subsequent separately approved promotion now makes that exact
  artifact the public target for all six saved live aliases. The supplied
  Production JSON and private key recovery are
  validated; no further setup/file input is needed. Current sign-in credentials are
  write-only, so their raw client ID was not independently compared or changed.
  The completed run exposed fixture-only source inventory after complete target
  metadata checks; ordinary primary-calendar defaults are outside its proof.
  Production live grant acceptance is not claimed. Do not
  repeat client creation, API enablement or the completed saved identity checks.
  Earlier absent-key readbacks are historical; public PR #40 now has the four
  settings. The retained PR #37 rollback snapshot has no Calendar configuration.
- Both independently consented test permission arms passed the same strict
  initial and controlled-change comparisons on owned and shared-reader synthetic
  sources. All missing/unexpected entries and shape mismatches were zero;
  pagination, etags and incremental cursors were present. Both test tokens were
  revoked, the callback listener exited, and the user reports `Deleted both`
  temporary calendars. Calendar absence is an owner receipt, not an independent
  API-absence claim. No repeated consent, fixtures, restoration or cleanup is
  needed. Detailed setup, diagnostic and execution history remains in the
  [project log](project-log.md) and
  [comparison plan](superpowers/plans/2026-10-03-atmoshaper-calendar-scope-comparison.md).
- Merged source requests availability instead of event-read access, retaining
  required calendar-list/app-created grants and compatibility with existing
  event-read/combined tokens on connect, cached use and refresh. Incomplete or
  broader Calendar grants still fail before provider work/token persistence.
  Calendar regressions pass 83/83, comparison checks 40/40 and documentation
  checks 16/16; the reviewed `0f486e5` CI run passes all seven jobs, including
  5,155 unit passes, two skips and zero failures. The measured inbound result
  does not establish full application/database acceptance, verification or
  whole-integration minimum access. The subsequent two bounded application runs
  now pass with their documented fixture limitations; real Production OAuth/sync
  acceptance is not claimed by the separately approved public activation.
  The approved declaration has owner save/category/status receipts;
  Google reports verification unnecessary for that saved state. Credential
  provisioning, the single candidate and exact public promotion/activation are
  complete. Additional isolated application/provider resources and future
  hosting changes remain separately gated. Preserve the legacy-token-compatible rollback in
  the provider checkpoint.

- Fresh remaining-provider name inventory confirms no Ably, Sentry or R2/upload
  configuration in Production. Reviewed source retains the existing polling
  fallback and disables Sentry when its DSN is absent. New realtime, monitoring
  and upload administration are separately scoped provider decisions, not
  failed or repeated Calendar setup. Four representative existing public media
  HEADs pass with expected types, byte-range support, cache policy and CORS for
  the AtmoShaper origin; bodies were not downloaded. This is bounded header
  evidence, not full playback/catalog proof or provider ownership. Legacy
  project's authenticated configuration read was unavailable; current legacy
  configuration parity is not claimed. Preserve the existing media host and
  immutable identities until a dedicated migration is reviewed and approved.

- PR #35's documentation closeout merged as
  `572691aad5e48e01089097d59799aea19d92ba83`. Its full CodeRabbit review
  covered all twelve files with no actionable comments; all seven hosted CI
  jobs passed and all review threads were resolved. This merge did not deploy.
- [PR #36](https://github.com/dsbowersock/atmoshaper/pull/36) merged as
  `154f9b6d440e0842892b96e185190c5be1ed2e22` at `2026-10-02T18:17:55Z`
  under the user's exact source-only merge approval. Its unchanged reviewed
  head is `0c3241cb3052877f07453d31b97b71ae4337e3eb`. The change prepares
  the selected separate AtmoShaper Google calendar. Discovery validates Google's account
  subject, an owned secondary calendar's project marker, narrow Calendar
  permissions, and API metadata. Reconnects preserve validated stored IDs after
  renames; unexpected accounts, targets, and ambiguous names fail closed.
  Generic outbound titles use AtmoShaper while stable private identifiers remain.
  The initial hosted reviews identified inactive connection history blocking a
  new account and unbounded Google requests. Repairs preserve inactive history,
  validate a returning account's saved target, and keep discovery under the lock
  with eight-second request limits and a shared 30-second provider deadline.
  A subsequent Codex finding limits the new timeout policy: new event inserts
  retain their existing wait behavior so an accepted POST's provider-generated
  ID is not lost to a local deadline and retried as a duplicate. Discovery,
  reads, and existing-ID updates remain bounded; no identifier migration is
  introduced. Another Codex finding closes the calendar-create retry gap: a
  verified account's encrypted, inactive creation intent is committed before
  the Google POST. Later callbacks may activate a discovered, validated target,
  but cannot create again while the first attempt is unresolved. The final
  target/source transaction cannot erase that prior intent on rollback.
  The disconnect action protects unresolved intents in its atomic, owned-row
  deletion and fails without a success redirect; resolved connections remain
  removable. This guard also covers direct server-action requests.
  A final Codex finding adds safe retry for this invocation's proven pre-POST
  failure: the adapter marks dispatch immediately before fetch, and cleanup
  reacquires the user lock to clear only the matching saved intent's reason.
  Failed transactions cancel late discovery before cleanup, preventing their
  outstanding callbacks from dispatching a later POST.
  Any attempted POST, resolved target, changed row, or failed cleanup retains
  conservative recovery. Generic errors and empty listings alone remain
  insufficient evidence for clearing an intent.
  Existing fields carry this additive state; no schema migration is added.
  CodeRabbit's full review found a remaining aggregate pagination gap outside
  the callback. Inbound validation and all selected sources' event reads now
  share a 60-second provider budget; outbound validation has its own 30-second
  read budget. Cached and refreshed tokens forward that deadline through account,
  inventory, and metadata checks. An exhausted inbound run keeps its old cursor,
  records failure, and stops later sources. New-event inserts still retain their
  returned IDs when the read deadline expires after dispatch. These are provider
  read budgets, not database-commit or new-event POST time limits.
  Final provider-free adapter/callback/service/action regressions pass 81/81;
  the full suite passes 5,105 of 5,108 tests with three expected skips and no
  failures. Lint, typecheck, build, diff checks, and all 90 relative links in
  the reviewed migration docs pass. All seven exact-head hosted CI jobs pass.
  CodeRabbit's final full review covers all eighteen files with no actionable
  comments or retained architecture concerns; Codex reports no findings and
  no review threads remain unresolved. Initial CI's stale project-state date
  ceiling was repaired before these final receipts.
  That source-only merge did not establish integration readiness. The later
  approved hosting promotion includes this code in the live runtime, while
  Calendar credentials and activation remain absent. No Calendar provider
  configuration, calendar creation, or hosted Calendar database write occurred.

- Earlier 2026-10-02 Dashboard screenshots established the preview-era project
  name, absent Git connection, and enabled custom-domain auto-assignment at the
  start of this hosting stage. The earlier Supporter activation used
  explicit CLI deployments. The user subsequently approved the existing-project
  rename, Git connection, and one unpromoted Production build with narrowly
  scoped normal GitHub App access. The
  [Vercel integration plan](superpowers/plans/2026-10-02-atmoshaper-vercel-git-integration.md)
  owns that stage and the later, separate public-promotion gate. Current provider
  outcomes are recorded below; the earlier screenshots are historical evidence.

- [PR #37](https://github.com/dsbowersock/atmoshaper/pull/37) merged under the
  user's separate source approval at `2026-10-02T22:54:54Z` as
  `f184fc1d2ea9cf0adfeff7d810d9db408fc6970e`. Its unchanged reviewed head is
  `fa3e2f9081b37630584c979b92114379ba093e95`. All seven hosted CI jobs passed;
  the Linux unit receipt is 5,113 passes of 5,115 tests, two skips, zero failures.
  CodeRabbit's final full review covered all ten files with zero actionable
  comments and no retained architecture concerns; Codex was clean and both
  earlier threads were resolved. Fresh post-merge reads confirm the same latest
  `READY` Production deployment. No Vercel build or deployment was triggered.
  The merged source for Vercel Git integration adds a Production-only
  Supporter prebuild gate after the existing read-only migration-status gate.
  It invokes the existing checker with fixed `--supporter-only --live
  --verify-stripe --no-dotenv` arguments and inherited build configuration.
  Local and Preview builds skip it; provider reads are bounded to two minutes.
  Checker failures, launch errors, signals, and timeouts fail the build.
  This closes the need for a separate manual readiness command in each approved
  `npm run build` candidate, provided Vercel's actual Build Command uses that
  entrypoint. Failure messages distinguish rejection, launch failure, signal,
  and timeout using fixed text without raw error or signal values. Hosting
  changes remain separately gated. No live readiness request, remote build,
  deployment, provider write, or payment test occurred in preparing it.
  Provider-free tests exercise the real nested CLI against synthetic Stripe
  fixtures, including missing credentials, both Portal catalogs, and forbidden
  purchase enablement. Public activation and disabled purchase boundaries remain.
  The Production group passes 14/14 and existing Stripe coverage passes 62/62;
  lint, typecheck, and the local build pass. The local build visibly skips both
  Production gates, so this is not remote provider-readiness proof.

- The approved hosting stage now has a renamed, connected project and one
  successful staged Production candidate. Direct authenticated API readback
  verifies the same immutable project/scope, name `atmoshaper`, GitHub repository
  `dsbowersock/atmoshaper`, Production branch `main`, explicit Build Command
  `npm run build`, and custom-domain auto-assignment off. The user completed the
  normal App grant and Git connection in the Dashboard; no duplicate connection
  was attempted. Earlier repository-discovery responses were misleading and
  are superseded by this direct project read. Automatic approval review had
  rejected the CLI connection attempt before execution while access was
  unverified; that attempt is no longer needed. Connection itself triggered no
  build. The ignored local hosting link preserves its original target/scope.
- Exactly one separately authorized Production candidate from merged PR #37,
  `f184fc1d2ea9cf0adfeff7d810d9db408fc6970e`, reached `READY` at
  `2026-10-02T23:56:01Z`. Actual remote `npm run build` logs show read-only
  migration status passing and the live Supporter-only readiness gate passing,
  including both Portal catalogs through Stripe API evidence. One-time support
  and background commerce remain disabled. Existing write-only credentials were
  used without export or replacement; no payment test was repeated.
- The user separately approved public promotion of the checked existing build,
  with restoration of the saved live deployment if verification failed. Normal
  CLI promotion reused that exact artifact without rebuilding. The live project
  target and all six recorded live alias assignments now point to
  `f184fc1d2ea9cf0adfeff7d810d9db408fc6970e`; all four original alias names
  remain present. All three project domains remain verified, with the apex's
  `308` redirect to canonical `www` intact. Deployment protection is unchanged
  and automatic custom-domain assignment remains off for future builds.
  Fresh non-secret setting reads confirm canonical Production auth and both
  pause flags `false`; metadata confirms all 56 variables are Production-only,
  excluded purchase switches are absent, and Calendar credentials remain absent.
- Post-promotion signed-out GET checks of the public site's home, Pricing,
  registration, support, Privacy, Terms, and session all returned `200`; the
  registration form is present, pause copy is absent, and the session is `null`.
  The apex still returns `308` to canonical `www`.
- Candidate page verification is now complete. The user supplied a screenshot
  of the exact candidate's open registration form and reported that the pages
  they checked worked, while explicitly leaving some links unchecked. A fresh
  permitted authenticated fetch succeeded after the earlier authentication
  failure. All seven candidate GETs returned application content with `200`:
  home, Pricing, registration, support, Privacy, Terms, and signed-out session.
  Registration inputs are present, registration/Checkout pause copy is absent,
  and the session response is `null`. This is GET/HTML evidence plus the user's
  registration screenshot; no account creation or Checkout interaction was tested.
  Post-promotion provider reads confirm the exact `READY` artifact is live.
  Public Pricing script assets match the checked candidate. The saved previous
  live deployment remains recoverable; no rollback was needed because every
  approved public check passed. No additional page checks or repeated hosting
  setup are requested from the user. The approved settings and exact-artifact
  promotion are verified; Calendar, old-origin recovery, and other migration
  gates remain open. The five
  updated operator receipts were published in
  [PR #38](https://github.com/dsbowersock/atmoshaper/pull/38); its final-head checks,
  reviews, and separately approved merge are now recorded above. That merge
  does not authorize another public promotion or Calendar activation. Git
  publication added an ordinary Preview branch alias; fresh readback preserves
  the six recorded live assignments and the approved live artifact. Additional
  Preview aliases are outside that live-assignment count.

- Deployed runtime source is reviewed merge `f184fc1d2ea9cf0adfeff7d810d9db408fc6970e`.
  The prior Supporter activation runtime and saved rollback source is
  `7756080c3bc650bdbcff33013ff67728a3f97efa`.
  PR #34 merged after all seven hosted CI jobs passed at reviewed head
  `896c6d3edd369ca13c8140f22f37c4ee239c84da`, with exact-head Codex and
  CodeRabbit coverage and no unresolved actionable review threads. The full
  hosted suite passed 5,053 tests with two skips and zero failures. PRs #30–#33's
  live default topology, restricted runtime credentials, Checkout idempotency,
  and Supporter-only readiness contracts remain in that base.
- The approved readiness scope is recurring Supporter membership only.
  `stripe:readiness -- --supporter-only --live --verify-stripe` still requires
  credentials, all twelve unique v2 Prices, recurring-tax attestations, both
  use-specific Portals, the live personal-default topology, and the complete
  pinned webhook contract. One-time support and background purchases must have
  their runtime enablement switches false or unset; their excluded readiness
  sections report `not_applicable (disabled)`. The default full-payment check
  remains available and unchanged in scope.
- The prior controlled live Supporter payment test is complete, including
  cancellation, full refund, and signed-webhook convergence. It was not repeated.
  Earlier no-payment/no-subscription cutover statements below describe
  historical provider checkpoints.
- The read-only checker explicitly expands
  `features.subscription_update.products` when retrieving each managed Portal.
  Live API readback then exposes both exact three-Product/six-Price catalogs;
  the repository validators confirm those catalogs, twelve deployed Price
  mappings, six-Product topology, recurring-tax attestations, and the pinned
  webhook without operator catalog confirmation. Stripe's Dashboard manages
  only the default personal Portal; the non-default business Portal uses the
  API. Ordinary list calls retain their existing no-expansion contract.
- One separately authorized, unpromoted Vercel Production-target build used
  only tracked source from the exact PR #34 merge. The actual
  `stripe:readiness -- --supporter-only --live --verify-stripe --no-dotenv`
  command passed at `2026-10-02T00:56:43Z` using the existing write-only
  credentials. Both Portal catalogs reported `stripe_api`; all twelve Prices,
  six-Product topology, recurring-tax attestations, and the pinned webhook
  passed. The read-only migration-status gate passed, and the app build reached
  `READY`. No credential replacement, environment change, catalog mutation,
  migration application, or payment test was required.
- The public domains stayed on the prior deployment. Vercel moved one
  convenience alias despite `--skip-domain`; its exact assignment was restored.
  Final readback confirmed all four original aliases matched their pre-build
  deployment, both public pauses remained `true`, and one-time support and
  background-purchase switches remained unset. The public registration page
  showed its pause message. The candidate's direct URL requires Vercel sign-in;
  its anonymous request did not verify an application page.
- The user subsequently authorized public registration and recurring Supporter
  activation, replacing the earlier pause instruction. Only the two Production
  pause controls changed to `false`. One authorized activation build used the
  same reviewed merge, passed actual live Supporter readiness at
  `2026-10-02T01:21:04Z`, passed read-only migration status, and reached `READY`.
  After those gates passed, that exact candidate was promoted. All four original
  aliases resolve to the approved candidate; the apex still redirects to
  canonical `www` with the route preserved. One-time support and background
  purchasing remain disabled with both enablement switches unset.
- GET-only public checks passed for home, Pricing, registration, support,
  Privacy, Terms, and signed-out session handling. Registration renders its
  email/password inputs without the pause message; Pricing no longer displays
  the Supporter pause; the signed-out session body remains `null`. No account,
  Checkout Session, payment, refund, test email, or database write was created
  by the verification. Browser automation was unavailable because its policy
  check could not be verified; no visual or interactive browser smoke is claimed.
- The [activation plan and execution receipt](superpowers/plans/2026-10-01-atmoshaper-supporter-public-activation.md)
  records the bounded scope, rollback, and public readback. The
  [migration status guide](wiki/migration-status.md) indexes remaining work,
  missing evidence, and decisions. This Supporter milestone does not complete
  old-origin recovery/PWA work, deferred providers, or legacy retirement.
- The user selected keeping the full MassageLab site available alongside
  AtmoShaper and clarified that MassageLab will continue as a separate project
  after the migration. Its future product direction is outside this work; the current
  platform migration to AtmoShaper retains its approved feature scope. Preserve
  the existing MassageLab deployment, routing, local-data access,
  authentication, and billing endpoints. The observed old-apex-to-www redirect
  is existing behavior; do not introduce an old-to-AtmoShaper redirect or infer
  account, record, membership, or endpoint retirement from the new site's launch.
- The user selected a separate Google calendar named `AtmoShaper` for the new
  site's Calendar sync. The [Calendar preparation plan](superpowers/plans/2026-10-01-atmoshaper-google-calendar-preparation.md)
  preserves the old project's `MassageLab` calendar and compatibility contracts.
  This decision authorizes preparation, not OAuth/provider writes, calendar
  creation, user-data transfer, a deployment, or public Calendar activation.
- Provider-free focused CLI and webhook regressions pass 62/62, with zero
  failures or skips. Two new expansion regressions first failed as expected.
  PR #34's hosted CI and remote verification receipts cover their exact source,
  not the subsequent Calendar preparation. PR #35 merged the executed receipt,
  current operator runbooks, and separate Calendar preparation plan without
  runtime or provider changes. The existing rollout worktree is now reused for
  the provider-free Calendar slice described above.
  The optional brand audit has stale exact occurrence rules from earlier
  Stripe identity changes; those broader audit receipts are not repaired by
  this readiness-only branch.

## Historical Snapshot — Whole-Site Migration Live; Provider Cutover Staged

- The full rebranded site is live at `atmoshaper.com`; public smoke checks cover
  home, pricing, support, Privacy, Terms, and signed-out session handling. Current
  `main` is `ee932ef2c33a8c28bf7dd6cdce612955d81413ee`; PR #19's
  provider-readiness record, PR #20's public Stripe catalog identity, and PR
  #21's final brand assets, PR #22's Stripe technical identity, and PR #23's
  buyer-selected Supporter use classification, PR #24's reviewed sandbox
  catalog migration, PR #25's default-Portal omission compatibility, and PR
  #26's Portal-create request contract, PR #27's omitted managed-Portal
  compatibility repair, PR #28's sandbox acceptance receipt, and PR #29's live
  catalog cutover preparation are merged.
  Earlier CI evidence
  remains historical until the next exact-head run.
- Production Google sign-in, the fresh administrator account, domain ownership,
  SMTP delivery, support routing, and verified Google branding are operational;
  the verified branding is being shown to users.
- The dedicated AtmoShaper Stripe sandbox is connected and complete for the
  reviewed Supporter v2 contract. It retains the three v1 amount-specific
  Products and six recurring Prices, has all six v2 amount/use Products and all
  twelve v2 recurring Prices, and has separate managed personal-use and
  business-use Portals. The exact test webhook is enabled for the reviewed
  event set, Stripe Tax uses the home origin with an active Ohio sandbox
  registration, and Vercel Production holds only the corresponding test-mode
  Stripe identities and secrets. Public registration and new Supporter Checkout
  are both paused. The Vercel-managed destination retains the committed
  database migration state; the personal Neon organization lists only its
  directly owned projects, as expected.
- Controlled deployed sandbox QA passed on merged commit
  `9608849d08af3d7f919a6a472117d73baf5b4684`. Two exact owned
  `.example.test` users completed the real hosted personal and business
  one-dollar monthly Checkout paths with automatic tax, the signed production
  webhook converged both subscriptions into the database, and both the normal
  and subscription-update Portal routes preserved their personal/business
  catalog boundaries. Cleanup then canceled both sandbox subscriptions, deleted
  both sandbox Customers, and removed both synthetic users plus their owned
  webhook receipts and legal acceptances. The final paused production deployment
  is ready at `atmoshaper.com`; the public registration endpoint returns `503`,
  and no owned nonterminal subscription or synthetic database row remains.
  Stripe's completed test Session and event history is immutable sandbox audit
  history, not live billing state.
- The merged live cutover command extracts
  the immutable Supporter v2 Product, Price, Portal, metadata, and idempotency
  contract from the sandbox-only orchestrator and adds a separate live
  verify/plan/apply owner. The live command accepts only live or restricted-live
  credentials, proves the dedicated account and live mode, requires the exact
  pinned live webhook, rejects hidden catalog/subscription/Checkout/Portal
  conflicts, and supports a truly empty dedicated live catalog rather than the
  retained v1 sandbox baseline. Provider writes, Vercel configuration,
  deployment, tax registration, live payment/refund testing, registration, and
  Checkout activation remain separately authorized operations. Provider-free
  validation passes the 23 focused live/sandbox migration cases, the 355-case expanded
  Stripe regression group, typecheck, lint, the production build, and the full
  5,032-test suite with 5,029 passed, three host-dependent skips, and zero
  failures. The hosted repair requires post-create Product and Price
  receipts to retain the requested managed identity before any dependent live
  write.
- The first authorized live apply created the six managed Products, twelve
  recurring Prices, and personal-use Portal, then stopped fail-closed before
  the business-use Portal because Stripe made the first Portal the account
  default. The live account still has no Customer, subscription, open Checkout
  Session, payment, or refund. A focused code-only follow-up accepts only the
  exact managed personal Portal in that single default slot, keeps the managed
  business Portal non-default, and proves a resumed plan requests only the one
  missing Portal. The same focused follow-up aligns final readiness with the
  dedicated live topology: `--live` uses only the v2 Price inventory, requires
  the configured personal Portal as Stripe's single default, keeps the business
  Portal non-default, and does not require or retrieve retained v1 sandbox
  identities. Registration and Checkout remain paused, and this repair does not
  authorize or perform another provider write. The adjacent Stripe, Portal, and
  readiness group passes 90/90; typecheck, lint, and diff checks pass; and the
  full suite records 5,037 tests with 5,034 passed, three host-dependent skips,
  and zero failures.
- The merged migration command adds a bounded verify/plan/apply
  command for the dedicated AtmoShaper sandbox and separates Customer Portal
  configuration by persisted personal or business Price identity. It preserves
  the retained v1 catalog and exact historical `massagelab_*` metadata,
  idempotency, purpose, Price mappings, database fields, and reconciliation
  inputs until post-cutover inventory proves retirement safe. Runtime Portal
  routing rejects a current Price duplicated in any current,
  pre-classification, or historical mapping namespace. The activation readiness
  command enforces that same full-union Price uniqueness contract, retrieves
  both configured Portals, and verifies their mode, default-slot topology,
  metadata, exact
  use-specific Product/Price allowlists, complete Price-only transition
  behavior, customer-profile fields, invoice history, payment-method updates,
  and cancellation policy and reasons. In sandbox mode, readiness also requires
  both managed non-default Portals to inherit the retained default Portal's
  profile URLs, headline, and return URL. It retrieves the six retained v1
  Prices and requires
  each Price and expanded Product to remain active in the selected mode with
  its exact recurring semantics, tax classification, and v1 metadata identity.
  In dedicated live mode, the managed personal Portal is the required account
  default and supplies that shared profile to the non-default business Portal;
  retained v1 mappings are not part of the live inventory.
  An incomplete retained-v1 retrieval remains a retrieval-specific failure and
  cannot be misreported as default-Portal allowlist drift. Runtime Portal
  creation requires every nonterminal subscription for the Stripe Customer to
  resolve to one compatible personal, business, or retained-default Portal
  boundary before opening the customer-wide session.
  Their default Portal must preserve its exact three-Product/six-Price
  allowlist, reviewed update policy, and billing-management features. The
  migration rejects archived retained-v1 catalog objects and refuses to
  repurpose the retained default v1 Portal as a managed v2 Portal under the
  same contract. Stripe currently omits that Dashboard-managed allowlist from
  the API response even though the Dashboard shows all three retained Products
  and six Prices. A focused follow-up accepts an exact process-local operator
  confirmation only for that omitted-field case; the readiness CLI captures it
  before loading dotenv files, and it is intentionally absent from the shared
  environment template. The confirmation is accepted only after all six unique
  expected Price identities resolve to three distinct unsplit Product
  identities. An API-visible mismatch still fails closed.
- Stripe also omits the managed v2 Portal Product allowlists from both list and
  retrieve responses. The first authorized apply therefore created the
  personal-use Portal, then failed closed before creating the business-use
  Portal when its readback could not prove the omitted allowlist. A focused
  follow-up distinguishes omitted managed catalogs from API-visible drift,
  prevents a no-op update loop, accepts only an exact process-local confirmation
  after both use-specific three-Product/six-Price catalogs are checked in the
  Dashboard, and keeps visible mismatches authoritative.
- The final user-approved logo, logo-plus-name wordmark, integrated word
  treatment, favicon, PWA icons, and Apple touch icon are merged. The app bar
  uses the wordmark at wide widths and the square logo at narrow widths. The
  installed-app assets use the supplied dark variants; no dedicated social-card
  aspect ratio was supplied, so social image metadata remains unset.

- Task 7's reviewed head
  `995fc4f7ce44902002ef2b36c7af1195dbdcb562` merged through
  [PR #12](https://github.com/dsbowersock/atmoshaper/pull/12) as `cb152b4`. Independent SPEC
  then QUALITY approved the final amendment; Codex and CodeRabbit completed
  clean on that exact head; all seven jobs in strict CI `35578132889` passed;
  and all four prior inline threads were resolved or outdated before merge.
- Task 8's legal-identity work was published and later merged through
  [PR #13](https://github.com/dsbowersock/atmoshaper/pull/13) as `935413c`, stacked on that
  exact Task 7 head. Its initial `4ef561c75125ea3875da236759c10617cfdc8bb1`
  head contained 20 files and passed independent SPEC then QUALITY before
  publication. Both hosted reviewers completed on that exact head. Codex found
  a credential-sign-in legal-gate bypass and an earlier stale state checkpoint;
  CodeRabbit found an ambiguous source-exact count in the chronological log.
- The pre-CI legal/session candidate had 33 paths: 12 implementation/test paths
  still
  match recovery source `7e318558da425b8fcdddeb8df50e93a36900310a`
  byte for byte, 16 paths are explicit repairs, and README, this state, the
  project log, delivery plan and generated brand receipt remain
  coordinator-owned records. The original test/wiki repair keeps the operator
  environment value synchronized with the exported digital-purchase version.
  The first login/test repair routes successful email/password sign-ins through
  the same current Terms/Privacy page as Google while preserving safe callbacks.
  Independent QUALITY then proved that navigation was not authoritative because
  the session already existed. The shared server-session owner now fails closed
  until current registration documents are accepted, while a narrow raw loader
  remains available only to the legal acceptance page/action. The public
  `/api/auth/session` GET and POST owners apply the same predicate, return `null` for
  stale or unavailable evidence while preserving Auth.js response metadata,
  and leave non-session handlers and the narrow legal loader unchanged.
- Current legal values are `2026-09-legal-v3`,
  `2026-09-digital-purchases-v3`, `September 14, 2026` and
  `Derrick Bowersock, doing business as AtmoShaper`. The current legal pages,
  sidebar/license presentation and legal sitemap revision dates move together.
  Canonical `massagelab.app` URLs, provider identifiers and stable Stripe
  metadata remain compatibility facts.
- Test-first redistribution produced eight expected failures against the old v2
  code, then passed the archive verifier 9/9, the focused legal/SEO/checkout
  suite 85/85, the post-ordering SEO regression 12/12, focused ESLint and diff
  checks. QUALITY then found that the base and recovery source both retained a
  stale v2 operator-wiki literal. A new focused test failed on that mismatch,
  passed after the one-value v3 repair, and the updated focused suite passed
  86/86.
- The immutable v2 archive hashes remain
  `8c7263b53697495f096f479484b6ccd7eae574f20111ecf0e0a44f7fd50017aa`
  and `bdb76adf941e4e22022765734650d7e1224486d282d8303fa5869ee4fc25a4c8`.
  `lib/legal-acceptance.js`, Prisma, existing acceptance rows/IDs, audit,
  product browser owners, public/media bytes and provider state remain unchanged.
  The focused coexistence test proves an old v2 row does not satisfy v3 and is
  retained unchanged when a genuine v3 acceptance is recorded.
- Fresh provider-free validation of the final candidate passed Prisma
  validate/generate, typecheck, full lint, the 4,736-test Node suite with 4,733
  passes and three skips, production and Browser-QA builds with 115 pages, and
  the existing anonymous-registration legal-gate smoke on desktop and mobile
  Chromium. The authoritative session repair followed two focused red/green
  cycles and its combined legal/auth/readiness slice passes 142/142. The full
  suite exposed one stale dev-clock implementation assertion; that companion
  failed before correction and now passes 7/7 against the new named boundary.
  The public-session handler repair passes its affected 78-test suite. Initial
  head CI `35591116189` then exposed a real-time race in the otherwise fixed
  Anatomime clock helper: both lane-1 attempts tried to pause at an instant that
  had already passed. The helper now installs one minute before the unchanged
  deterministic phase and pauses at that phase; the exact browser case passed
  three serial runs. Final QUALITY then proved the first extracted-owner test
  could not falsify the old equal-target helper because its virtual clock modeled
  no install latency. The strengthened contract advances a deterministic 25 ms,
  requires the install instant to be strictly earlier, and rejects an extracted
  equal-target mutation; it and the dev-clock contracts pass 12/12.
  Archive 9/9, repository audit 28/28 and diff checks are clean. The strict
  brand receipt reaches a fixed point with zero missing, unclassified or
  category mismatches; its exact hash is pinned in the frozen review evidence.
  No snapshot changed.
- The pre-CI 33-file package and 19-file amendment passed independent SPEC then
  separate QUALITY on one frozen byte set. Exact staged identity produced and
  pushed product amendment `2ab6382d2e944b75e8eb0e76808870f205d21736`, then
  durable record synchronization `ecf30584cf689edca4bfe2566e1d9a795253fd29`,
  to PR #13. Both hosted reviewers completed clean coverage of the synchronized
  head, but strict CI `35621507294` exposed a Browser-QA fixture recurrence:
  synthetic users lacked current registration acceptances, provider-free JWTs
  did not project server-rendered account ownership, and service workers could
  bypass context routing on reload.
- The bounded repair keeps the legal gate intact. Authorized connected fixtures
  atomically create current Terms and Privacy acceptance rows, verify exact
  ownership before cleanup, and delete the restricted rows and owned user in one
  rollback-safe transaction. Provider-free tests own only context-local session
  and account-bootstrap projections, preserve owner switching, and keep the
  connected `Open account cart` assertion unchanged. That 40-path repair was
  published as `26c76ada77c7d3977af666942101b6e5018e15f3`. Codex completed clean
  exact-head review and strict CI `35638346707` passed quality, build, all four
  browser lanes and aggregate QA. CodeRabbit reviewed the exact 12-file
  amendment and found two valid fixture-contract gaps, so those green checks are
  historical rather than final: the provider-free Auth.js response omitted its
  required expiry, and the same-origin HTML route rejected standalone documents
  that correctly contain zero shared-layout account-bootstrap markers.
- The bounded follow-up changes only the signed-in cookie/session fixtures and
  their executable contract owner. Zero markers now pass through unchanged,
  one marker is still
  projected, duplicates still fail closed, and provider-free sessions carry a
  future ISO expiry. RED reproduced both hosted defects. Independent QUALITY
  then proved the expiry oracle accepted short or already-expired mutations and
  the broad session glob fulfilled foreign origins. The repaired actual-owner
  contracts enforce the exact one-hour lifetime, reject a short-lifetime
  mutation, fulfill only the configured origin and fall back for foreign
  origins. A later QUALITY review proved the cookie and provider-free fixtures
  still owned separate lifetime literals, invalidating v12 before staging. The
  cookie fixture now exports the sole canonical one-hour constant used by both
  paths, and a canonical-owner mutation proves the consumer cannot silently
  drift. Although frozen v13 passed SPEC, separate QUALITY proved its harness
  dropped the real import and manually injected the lifetime, so replacing the
  import with a new local owner could remain falsely green. That freeze was
  invalidated before staging. The repaired executable oracle uses TypeScript
  AST evidence to require the exact unaliased canonical import and rejects a
  local replacement before controlled injection. Frozen v14 then passed SPEC,
  but separate QUALITY proved that whole-clause and inline type-only imports
  still produced the accepted tuple despite owning no runtime binding. Root
  reproduced both forms and invalidated v14 before staging. The repaired guard
  now requires a non-type-only clause, non-type-only specifier and literal
  unaliased binding; strict negative mutations cover both TypeScript forms.
  Frozen v15 then passed SPEC, but separate QUALITY showed the canonical
  mutation proved only “not one hour”: a consumer clamp to 120 seconds still
  passed after a 60-second owner mutation. Root reproduced the false positive
  and invalidated v15 before staging. The v16 parameterized timing oracle kept
  the independent one-hour positive bound, required a 60-second mutation to
  match the observed cookie lifetime exactly and rejected a real-source
  120-second clamp. Frozen v16 passed SPEC, but separate QUALITY proved the two
  selected values and handler-duration window still admitted a nonlinear
  3,600-second cap and a five-millisecond consumer offset. Root reproduced both
  actual-source counterexamples and invalidated v16 before staging. The repaired
  controlled compiler injects a deterministic `Date`, asserts the exact ISO
  expiry at 17, 60, 3,600 and 7,200 seconds, rejects both mutation families and
  retains a shape-only real-clock integration check. Frozen v17 passed
  independent SPEC then QUALITY and was published as
  `fd7d6124b57177a5f2266af8af82fb0561aba332`. Both hosted reviewers completed
  exact-head review and each found one valid follow-up. The matching-email
  Google-linking flow could prove credentials and then receive the legal gate's
  `AUTHENTICATION_REQUIRED` response without routing to current registration
  acceptance. The real-clock oracle compared separately sampled wall-clock
  bounds and could false-fail if the clock moved backward.
- Strict RED reproduced both hosted findings. The bounded local repair routes
  only that exact 401/code pair through the canonical legal-acceptance builder,
  keeps the cookie-bound linking intent intact, and leaves other errors on the
  existing recovery path. Its provider-free form harness executes the real
  submit flow and proves the canonical `/account/link-google` callback. The
  real-clock integration now proves successful invocation and canonical ISO
  shape only; fixed-clock tests retain exact one-hour identity and the 17, 60,
  3,600 and 7,200-second mutation probes. Focused fixture/database contracts
  pass 78/78, legal/interaction contracts pass 24/24, and the full Node suite
  passes 4,754 total with 4,751 passes, three host-dependent skips and zero
  failures; typecheck, lint and diff checks pass.
- Superseded strict CI `35668571160` passed code quality, build and all browser
  test bodies (lane 3: 152 passed, 42 skipped), but lane 3 diagnostics upload
  received a GitHub artifact-intermediary 403 and aggregate QA therefore failed.
  No superseded-head rerun is warranted; the repaired head receives fresh CI.
- Frozen v18 passed independent SPEC, but separate QUALITY proved the
  positive-only real-form legal-routing test admitted an `&&` to `||`
  mutation. Root independently reproduced the false-pass 1/1 and restored the
  production blob before editing. The test-only recurrence repair now checks
  401 + `PROOF_EXPIRED` and 403 + `AUTHENTICATION_REQUIRED`: both must call
  existing confirmation recovery with the exact pair and produce zero legal
  callbacks, pushes or refreshes. The controlled `||` mutation now fails
  0/1. Account-security passes 20/20, legal/interaction passes 24/24, and the
  clean full Node suite passes 4,755 total with 4,752 passes, three
  host-dependent skips and zero failures.
- The published v21 candidate contains 43 paths: 12 recovery-exact, 26 repairs
  and five records. It was published as `22eb0ef690b354317a74a74bf0318aa6c6f2a733`; CodeRabbit completed product review,
  Codex found only its then-current record issue, and all seven strict CI jobs passed. The post-v21 OAuth amendment is published as `7ad60de8519e4a1d4bcc0bd892583b0c54d80186`;
  it switches public Google callbacks to the acceptance-filtered session identity while keeping raw access in the legal gate. That work merged through PR #13 as `935413c`;
  its hosted-review and strict-CI gates passed on `5345c7cc2f413e4dfd33def15bff5c8e99151243`
  before Task 9 started. PR #14 later completed combined-source integration;
  current provider and deployment gates are summarized at the top of this file.
- Frozen v19 passed independent SPEC, but separate QUALITY proved the two
  mismatched pairs still did not lock exact response-code value and shape.
  Prefix matching accepted `AUTHENTICATION_REQUIRED_LATER`; string coercion
  accepted `["AUTHENTICATION_REQUIRED"]`. Root independently reproduced the
  coercion false-pass 1/1 and restored the production blob before editing.
  The test-only matrix now also covers near-match, case-changed and
  whitespace-padded strings plus null, array and object values. Every case
  requires exact confirmation-recovery arguments and zero legal callback,
  navigation or refresh. Controlled prefix and coercion mutations both fail
  0/1; the production form remains byte-identical. Re-freeze these exact bytes
  as v20 and repeat SPEC then QUALITY before staging.
- Frozen v20 passed independent SPEC, but separate QUALITY proved the corpus
  omitted missing code, a fullwidth Unicode lookalike and rejected JSON.
  Actual-source mutations accepting undefined, NFKC-normalizing strings or
  defaulting rejected JSON to `AUTHENTICATION_REQUIRED` preserved all v20
  assertions. Root independently reproduced the JSON-fallback false-pass 2/2
  and restored the production blob. The test-only corpus now adds those three
  cases plus string status `"401"`; every negative requires exact recovery
  arguments and zero legal callback/navigation/refresh. Controlled undefined,
  NFKC and JSON-fallback mutations each fail 0/1 and restore exactly. Frozen v21
  passed independent SPEC then separate QUALITY, retained the 43-path
  classification, and was published as `22eb0ef690b354317a74a74bf0318aa6c6f2a733`.
- Original PR #5 is closed unmerged; replacements #6–#13 are merged. This
  historical candidate slice itself performed no provider, billing, deployment,
  database, domain/DNS, PNG, frame, threshold, media-byte, or production action.

## Historical Snapshot — Phase 6 Background Catalog and Controls

- Renderer PR #11 is verified at `04e3868e3ab39111e50b6c8cdc7d5a89bc7b60e2`:
  Codex completed clean at 03:04 UTC and CodeRabbit at 03:05 UTC on September 21.
  Both prior threads are resolved; all seven jobs in CI `35556031421` passed,
  including the repaired Anatomime cadence case. No merge occurred.
- Task 7 of the [delivery plan](superpowers/plans/2026-09-20-phase6-review-sized-prs.md)
  is published as [PR #12](https://github.com/dsbowersock/atmoshaper/pull/12) at
  `03d7762d38b46dc73d1dbd149b911508be0359d8` on
  `codex/phase6-07-background-catalog` in the same approved
  isolated worktree, based on that exact reviewed head. It carries background
  catalog/control labels, optional-only globe-marker presentation and the
  source-approved portrait tray repair with paired tests.
- The initial head passed all seven jobs in CI `35566555008`. Codex completed
  at 06:02 UTC and CodeRabbit at 06:08 UTC on September 21, with five verified
  findings in total: nine license attributions coupled to presentation identity,
  72 stale preview labels, a free-background test masked by the reset path,
  three stale current collision notes and ambiguous initial file-count wording.
  The first repair batch passed independent SPEC then QUALITY and was published
  as `03d7762`. Its full unit suite passed 4,726 with three skips; all seven jobs
  in strict CI `35571083634` passed. Codex completed clean at 07:13 UTC, but
  CodeRabbit reported one remaining current-note naming mismatch. Root verified
  six stale references across four audit batches, including the reported example.
  A bounded data/generated-prose/test amendment has 107 focused passes and awaits
  independent review. SPEC verified the data but found a false pass when a
  retired name contains a current name. The scoped occurrence-span repair passes
  all 16 audit tests and awaits SPEC re-review, then separate QUALITY.
  The old regression covered only three grid notes; its
  replacement covers all 84 notes and all seven generated batches, preserving
  historical aliases and valid longer names.
  Scope stays 35 files. Independent SPEC then QUALITY and both new exact-head
  hosted reviews/CI remain required; no runtime or media change is involved.
- Ownership covers 30 source paths, of which three browser companions were
  already recovery-exact in the reviewed base. Bounded inherited browser-test
  repairs and their three companions bring planned scope to 35 files. Stable IDs,
  entitlements, purchase references, user-marker controls, media bytes and all
  earlier Sentry/admin/browser-clock repairs remain protected.
- Source transfer passed 344 focused checks; the pre-repair full unit suite
  passed 4,718 with three skips and zero failures. Typecheck, lint and the
  provider-free production build passed; all 32 commerce browser cases passed.
  All 18 carousel cases pass and the ten original control-lab failures are
  repaired. An intermediate full rerun exposed four missing, intentionally untracked
  preview videos in its strict console case. Diagnosis confirms a transient
  initial video request before reduced-motion state settles; that unchanged
  runtime behavior remains unresolved. An exact provider-free fixture amendment
  retains unfiltered console checks and records initial request counts, without
  claiming zero-fetch mount behavior or fixing the runtime race.
  Palette inventory, unsupported-adapter and effective-mode checks are repaired
  (77 focused checks pass). All six focused palette browser cases now pass,
  including all 84 backgrounds in three requested modes on desktop and mobile.
  Unsupported Harmony correctly preserves Source at the renderer boundary,
  separately from raw gallery role diagnostics. All 38 final carousel/control
  cases now pass with the exact fixture; each project records one initial hit
  per known URL and zero additional hits after reduced motion settles. Final
  focused contracts pass 108/108; typecheck, lint and nine archive checks pass.
  No runtime or media change is part of the validation repairs.
- This replacement preserves recovered lab behavior, not a new design:
  Selected/Select remains the lab acquisition trigger and surrounding Station
  previews remain square. Historical Unlock/193-pixel product records conflict
  with these owners; this slice records but does not settle that design debt.
- Independent SPEC passed the first frozen candidate. Final full-unit validation
  then returned 4,722 passes, three skips and one failure: the unchanged sitewide
  source contract still requires the retired fixed-count palette token. A bounded
  companion amendment now guards the registry-owned exhaustive sweep; no browser
  or runtime change was needed. The v2 full suite passed 4,723 tests with three
  skips and zero failures. Independent QUALITY then identified a gap in that
  companion: a mode loop could count cases without asserting their behavior.
  Root verified the finding before a same-file repair. All 126 final focused
  checks and changed-file lint pass; removal, out-of-loop placement and commented
  assertion mutations now fail closed alongside the ID/fixed-count controls.
  The existing comment masker closes the scoped SPEC finding without changing
  the browser or adding a parser. The broad result covers
  v2; the final guard-only amendment has focused verification, with unchanged
  browser/runtime hashes. Scoped SPEC and QUALITY approved that final guard;
  staged audit and initial publication are complete. The audit-note recurrence
  amendment now requires its own validation and review gates. Tasks 8-9, combined-source reconciliation and the
  separate Linux Atmosphere snapshot-refresh decision remain pending.
- Original PR #5 and replacements #6-#12 remain open and unmerged. No PNG,
  frame, threshold, provider, billing, deployment or legal-version changes.

## Historical Snapshot — Phase 6 Background Renderer Slice

- Account/service PR #10 is verified at `3e29e6e696131450820e8b70cc195d6bf5849f8a`:
  Codex and CodeRabbit completed clean on the exact head, its prior thread is
  resolved, and all seven jobs in CI `35545694616` passed. Nothing was merged.
- Task 6 of the existing delivery plan is published as
  [PR #11](https://github.com/dsbowersock/atmoshaper/pull/11) on
  `codex/phase6-06-background-renderers` in the approved isolated worktree.
  It carries 59 recovery-exact renderer prose/diagnostic files and one partial
  shared test companion. The globe-marker retirement stays with the next
  catalog slice and its descriptions/tests, preserving coherent ownership.
- Repair scope is 67 files: 59 renderer files, the shared renderer test,
  verified-date companion, Anatomime browser-clock repair and its regression,
  plus four delivery/audit records. Initial publication had 64 files; the date
  amendment raised it to 65. The CI amendment adds two test-only paths. Existing
  shader, animation, lifecycle, identifiers, catalog, legal and provider
  boundaries stay unchanged. Prior Sentry and immutable admin replay repairs
  remain authoritative, including their deliberate compatibility-era copy.
- All 59 renderer files match recovery exactly. Local checks passed: 153
  focused tests, typecheck, lint, strict audit/inventory, and the full unit
  suite (4,711 passed, three skipped, zero failures; 4,714 total).
- The initial 64-file candidate passed independent SPEC then QUALITY, including
  the stale-status documentation correction. Both hosted reviewers completed
  on initial head `6d92e6daa073be40db6f61e26c7ac8958b1ab0f1` and raised record-only
  findings: align the verification date and test ceiling with this September 21
  UTC checkpoint, and explicitly retain globe-marker ownership in Task 7.
  This amendment addresses both without changing renderer behavior or assertions.
- Each amendment must pass scoped SPEC then QUALITY before publication.
  Head `3857f13d6b3c241061960f2d1d1f0740f4978166` has clean exact-head Codex
  review, but CI `35552471156` failed one Anatomime polling test on both attempts.
  Quality, build and the other three browser lanes passed. The test held a
  response while its late clock pause advanced past the real request deadline;
  a controlled actual-helper browser reproduction confirms that mechanism.
  The bounded repair freezes the test clock before the tested request, preserves all
  production deadlines/assertions and adds a falsifying regression. No renderer
  or application behavior changes. All 42 Anatomime browser cases pass across
  desktop/mobile; the cadence case also passes both with a temporary 2.1-second
  observation delay, removed afterward. Focused checks pass 108/108, along with
  typecheck, changed-file lint and strict audit/inventory. Independent SPEC then
  QUALITY precedes push; the eventual head needs both hosted reviews and strict
  CI. CodeRabbit's full coverage still belongs to the initial head.
  The final combined-source ledger and separate Linux Atmosphere
  snapshot-refresh approval remain incomplete.
- Original PR #5 and all published replacements remain recovery references,
  open and unmerged. No snapshot, provider, billing or deployment change is
  authorized by this slice.

## Historical Snapshot — Phase 6 Account and Service Slice

- [Public-content PR #9](https://github.com/dsbowersock/atmoshaper/pull/9) is
  verified at `9f2afb41854a6600a2c94f0c416d0531c6b16e0a`, stacked on
  `f8c14f1812918b67051760669c4ccf07b5860ba7`. Codex completed clean at
  21:28 UTC and CodeRabbit completed clean at 22:16 UTC. Both prior inline
  threads are resolved; all seven jobs in CI `35538608085` passed.
- The approved isolated checkout now assembles the next account/service slice
  on `codex/phase6-05-account-service` from that exact reviewed head. Original
  PR #5 and published replacements #6–#9 remain recovery references, unmerged.
- Task 5 of the [delivery plan](superpowers/plans/2026-09-20-phase6-review-sized-prs.md)
  carries account, security-message and local-first presentation with direct
  tests, including existing private-account browser settlement repairs. It
  preserves authentication, billing, provider, persistence and PHI boundaries.
- The stable Sentry event correction and exact audit-classification/verification
  repairs remain authoritative. Do not restore their source defects while
  copying account files. Earlier pilot, homepage and audio fixes also stay intact.
- An offline actual-route check found the recovery source also renames the
  synthetic Sentry debug event. Keep that route at its reviewed-base bytes and
  correct its paired static privacy expectation and add focused flag/event-identity
  coverage; these two additional source divergences follow
  the existing no-operational-event-rename contract, not a provider change.
- Independent QUALITY found a historical admin-operation replay regression in
  five source-copy producers despite a passing initial full unit suite. Root
  confirmed both upgrade and rollback failures with in-memory actual-code
  fixtures. Preserve the established immutable bundle templates and strict
  equality validator; add producer-owned replay and corruption controls.
  These administrative notifications retain compatibility-era copy until a
  separately planned versioned migration. No database/provider was touched.
- The repaired 53-file slice passed independent specification then quality
  review on tree `65db8418bbca2c7ee134c5d7684af9fc68f61529`. Full provider-free
  unit verification passed: 4,710 tests, three skipped, zero failures (4,713
  total); 662 focused checks, typecheck, lint and 146 coordinator audit/document/
  archive/workload checks also passed. Root and quality review both reproduced
  successful upgrade and rollback replay without changing stored state.
- Forty source-owned files equal recovery exactly; twenty protected paths equal
  the reviewed base. The intermediate audit receipt is a generated fixed point
  with zero missing, unclassified or category-mismatched entries, using 48 exact
  compatibility rules. Inventory reports no forbidden paths.
- [Account/service PR #10](https://github.com/dsbowersock/atmoshaper/pull/10) is
  published at `487fd7bfa8e8c000d13743d13fbeba99eadf9cf8`, stacked on PR #9.
  Codex completed clean on that head at 23:32 UTC. CodeRabbit reviewed all 53
  files and found one valid documentation ambiguity: the 49-path ownership
  manifest and superseded pre-amendment counts were not clearly distinguished
  from the final 53-file change scope. The plan now defines and reconciles them;
  no source, test or classification-policy change is needed. CI is still running.
- This documentation-only repair needs independent SPEC then QUALITY, strict
  receipt verification, and renewed exact-head hosted reviews and CI after push.
  It is not hosted approval or merge readiness. The whole-sequence
  source ledger and separate Linux Atmosphere snapshot approval remain incomplete.
- No PNG, frame, tolerance, provider, billing, deployment or merge changes are
  authorized by this work. Current legal versions and dates remain unchanged.

## Historical Snapshot — Phase 6 Public Routes and Content Slice

- The 46-file [Atmosphere audio PR #8](https://github.com/dsbowersock/atmoshaper/pull/8)
  is verified at `f8c14f1812918b67051760669c4ccf07b5860ba7`, stacked on
  `06f3147ab3ffb7dc319ad93666dc0f3d7605d238`. Codex completed clean at 18:29 UTC;
  CodeRabbit reviewed all 46 files and completed without actionable findings at
  18:33 UTC. No review threads remain. Fresh hosted evidence confirms CI
  `35529020277` passed quality, build, all four browser lanes and aggregate QA.
- The 67-file [public-content PR #9](https://github.com/dsbowersock/atmoshaper/pull/9)
  is published at `b6645013086635cc1287725d0ea0d3678f4b6071` against that exact
  audio head. The approved isolated checkout remains on
  `codex/phase6-04-public-content`. Original PR #5 and published replacements
  #6-#8 remain unchanged and unmerged.
- This slice carries source-approved public page, support, social, membership,
  cart and education display copy with producer-owned tests. It preserves
  endpoints, social handles, support addresses, Google calendar names, source
  attribution, stable anatomy IDs, Stripe identity and entitlement behavior.
- The [delivery plan](superpowers/plans/2026-09-20-phase6-review-sized-prs.md)
  names all shared-file boundaries. Private account settlement stays with its
  later owner; current legal dates/versions and the verified documentation date
  ceiling are preserved. Earlier pilot and homepage repairs remain intact.
- At initial publication, 55 full-source files matched recovery
  `7e31855` exactly, and four shared test files contain only their assigned
  companion changes. Independent specification then quality review passed with
  no implementation findings; earlier pilot and homepage repairs are preserved.
- Fresh verification on frozen tree `560521bd2f2c1220086240b46b19c7449ec9ee95`
  passed the full unit suite: 4,661 passed, three skipped, zero failures (4,664
  total), plus 247 focused regressions, typecheck, lint and 25 documentation/
  archive checks. The intermediate brand receipt has zero missing/unclassified
  entries and inventory reports no forbidden paths. Between that tested candidate
  and initial publication, only delivery receipts and generated offsets changed.
- Hosted reviews completed with two verified findings: retain the stable Sentry
  problem-report event name, and classify retained Stripe assertions as exact
  compatibility occurrences. The bounded repair restores that event identity
  and promotes only the necessary exact-occurrence audit API with five fresh
  rules. The source event-name defect is corrected, not preserved for equivalence.
  Its three intentional source divergences and early audit API promotion must
  remain explicit in the final combined-source reconciliation.
- The audit generator, not only its generated receipt, must retain the corrected
  classification without hiding neighboring public copy. Fresh focused checks
  pass 91/91; the coordinator's focused/archive run passes 100/100. Independent SPEC then
  QUALITY and strict validation precede a repair push. Both hosted reviewers
  must subsequently cover the new exact head without actionable findings.
- Initial-head CI `35533833313` passed quality, build, all four browser lanes
  and aggregate QA, verified at 20:15 UTC. This is not repair-head evidence.
  Earlier PR coverage does not cover this slice or its repair.
- Round 1 repair head `b664501` passed all seven jobs in CI `35535560095`, and
  Codex completed clean on that exact head at 20:31 UTC. CodeRabbit completed
  its incremental review at 21:07 UTC with a new outside-diff audit finding:
  identity-matched baseline entries can retain stale categories after valid
  policy edits. This is not clean CodeRabbit coverage or slice completion.
- The reproduced gap is in the shared verifier, not candidate generation.
  Round 2 must compare matched categories against the existing classifier,
  report sanitized mismatches, and fail normal audit mode. Strict new-reference
  rejection, informational removals and existing classification precedence stay
  intact. The repair requires independent SPEC then QUALITY, local verification,
  and fresh exact-head hosted reviews and CI before the account slice starts.
- Round 2's three-file implementation passed 28 audit tests and 64 focused
  compatibility regressions; a coordinator run passed 101 focused/archive
  checks and 25 delivery-document/archive checks. Typecheck and changed-file
  lint passed. Independent review and repair publication remain pending;
  these local results do not establish new hosted coverage.
- The final combined-source equivalence and separate Linux Atmosphere snapshot
  decision remain whole-sequence gates. No PNG, frame, threshold, provider,
  billing, deployment or merge changes are authorized by this slice.

## Historical Snapshot — Phase 6 Atmosphere Audio Slice

- The 24-file [identity PR #7](https://github.com/dsbowersock/atmoshaper/pull/7)
  is verified at `06f3147ab3ffb7dc319ad93666dc0f3d7605d238`, stacked on pilot
  `96d94b1b0d779b998df01d07cfaec0198857d51d`. Codex completed clean at 17:25 UTC;
  CodeRabbit reviewed all 24 files and completed without actionable findings at
  17:31 UTC. No review threads remain. Fresh 17:45 UTC evidence confirms CI
  `35525692042` passed quality, build, all four browser lanes and aggregate QA.
- The approved isolated worktree now assembles the next delivery-plan owner,
  Atmosphere audio, on `codex/phase6-03-atmosphere-audio` from that exact head.
  Original PR #5 and published PRs #6–#7 remain intact and unmerged.
- This slice carries the source-approved feature labels, public error/title
  presentation, Drone display label, stable artwork identity, carousel-resume
  repair and matching audio/browser contracts. Stored identifiers, media/source
  records, playback kinds, external endpoints and legal records remain unchanged.
- All 35 audio-owned files match the recovery source exactly. Fresh local checks
  pass 227 focused audio/navigation/document/archive cases, typecheck and lint.
  The frozen first candidate passed the full unit suite: 4,659 passed, three
  skipped, zero failures (4,662 total). SPEC review found one missed paired
  About navigation assertion, which must travel with its changed label owner.
- The one-line source correction passed repeated independent SPEC then QUALITY
  review. Fresh affected browser-harness/navigation/document/audit checks pass
  132/132, with typecheck and a byte-stable brand receipt containing zero missing
  or unclassified entries. Independent quality checks pass 62/62 and confirm
  byte-identical artwork for all 58 visible stations against this slice's base.
- The 46-file candidate is locally verified; publication and its own exact-head
  hosted reviews and strict CI remain required. Shared files carry only current
  producer-owned hunks; public/account/background/legal/integration work remains
  with later owners. Earlier-slice hosted evidence does not cover this delta.
- The separate Linux Atmosphere snapshot decision and final combined-source
  equivalence remain whole-sequence gates. No PNG, threshold, frame, provider,
  billing, deployment or merge changes are authorized by this slice.

## Historical Snapshot — Phase 6 Product Identity Slice

- The 15-file [archive pilot PR #6](https://github.com/dsbowersock/atmoshaper/pull/6)
  passed both hosted reviewers on exact head
  `96d94b1b0d779b998df01d07cfaec0198857d51d`. Codex completed clean at
  15:53 UTC; CodeRabbit completed its full-source plus repair-delta review at
  16:02 UTC with no actionable comments. All four review threads are resolved.
  Fresh hosted evidence at 16:20 UTC confirms CI run `35520831495` completed
  successfully, including all four browser lanes and aggregate `qa`.
- The next [delivery-plan](superpowers/plans/2026-09-20-phase6-review-sized-prs.md)
  slice is product identity and shell, stacked from that pilot head on
  `codex/phase6-02-product-identity`. The approved isolated checkout is reused;
  the pilot branch and original PR #5 recovery source remain intact and unmerged.
- This slice carries the approved AtmoShaper identity, responsive text/temporary
  mark/hidden brand states, homepage, metadata with no unapproved social image,
  offline copy and matching contracts. It preserves canonical endpoints, icon
  assets, routes, private identifiers, cache keys and the existing legal registry.
  Secondary pages, audio labels, account copy, legal versions and final integration
  remain later slices; this is not a claim that the whole rebrand is complete.
- Local quality review found the new homepage text exceeding its hero column
  with an expanded desktop sidebar. The heading now sizes to that column at
  large widths, retaining its existing maximum size and layout without clipping.
  A focused provider-free regression checks 23 viewport/sidebar combinations
  and proves the old viewport-only sizing overflows at both reproduced widths.
- Fresh coordinator checks pass all 89 focused identity/SEO/PWA/layout cases.
  A separate zero-network check with the actual locally bundled Inter font also
  verifies text bounds at 768, 1023, 1024, 1025, 1100 and 1280px. The first full
  suite found one omitted paired Roadmap metadata assertion; only that exact
  source assertion is now included, while later Roadmap page copy stays deferred.
- The repaired 24-file candidate passed repeated independent SPEC then QUALITY
  review and fresh full unit verification: 4,635 passed, three skipped, zero
  failures (4,638 total). Coordinator typecheck, lint, 15 documentation checks
  and nine immutable-archive checks also passed. The generated intermediate
  brand receipt is byte-stable with zero missing or unclassified references.
- Publication, both exact-head hosted reviews and strict CI remain required
  for this slice; earlier pilot evidence does not cover it. Final equivalence must keep
  the verified heading repair and new regression as additions to the source,
  alongside the pilot repairs and all later original-source fixes.
- The separate Linux Atmosphere snapshot-refresh decision remains pending.
  No PNG update, assertion relaxation, provider creation, billing change,
  deployment or merge is authorized by this delivery work.

## Historical Snapshot — Phase 6 Legal Archive Pilot

- The user approved replacing oversized [PR #5](https://github.com/dsbowersock/atmoshaper/pull/5)
  with smaller dependency-ordered PRs and approved one isolated worktree. The
  [delivery plan](superpowers/plans/2026-09-20-phase6-review-sized-prs.md) owns the
  sequence. This first pilot starts at `cdfa99e49cebf100fac1a5080d60514806eb17db`;
  the original branch and source `7e318558da425b8fcdddeb8df50e93a36900310a`
  remain recovery references, not replaced or merged work.
- Pilot scope is immutable historical legal archives, their read-only verifier,
  exact archive-path audit classification, and the retained-data inventory test.
  Application runtime, current legal versions, acceptance storage, dependencies,
  providers and screenshots remain unchanged from the pilot base.
- Verification exposed Git's Windows checkout conversion changing the pinned
  archive bytes. Two exact `.gitattributes` LF rules now preserve those bytes;
  the temporary-Git regression failed before the repair and passes afterward,
  including an unrelated-path control. The six recovery-source files stay exact.
- Fresh clean-base verification passed: locked dependency install, Prisma
  generation, and 4,557 unit tests (4,554 passed, 3 skipped, zero failures).
  The published repair below passed independent specification/quality review
  and fresh local verification; exact-head hosted gates remain separate.
- CodeRabbit has not reviewed the original PR: its 291 selected files exceeded
  the observed 100-file cap, and its status also reported unavailable capacity.
  Publish only this pilot until actual CodeRabbit review is confirmed. Do not
  infer coverage from a skipped review or change billing, filters or assertions.
- The 15-file [pilot PR #6](https://github.com/dsbowersock/atmoshaper/pull/6)
  first published `6961b4f`, which both hosted bots reviewed. CodeRabbit processed
  all 15 files, confirming that the pilot clears the size blocker. That head's
  CI passed, but the reviews identified two valid implementation findings.
- Published repair `f9c4a2b3ee1df9b0be17cc5e2dfc12bdb4113838` restricts the
  audit policy to the two exact archive filenames and isolates every fixture Git
  command from inherited `GIT_*` variables. Regressions cover sibling/suffix/
  nested paths, actual poisoned-child execution, recursive/zero-match false
  success, unchanged decoy repository bytes, strict hashes and CRLF controls.
  Both implementation findings are fixed; their three hosted threads resolved.
- The repair passed independent SPEC then QUALITY review, 49 focused checks,
  15 documentation-contract checks, typecheck, lint, and full unit verification:
  4,565 passed, 3 skipped, zero failures. Source archive bytes remain unchanged.
- As of 2026-09-20 15:39 UTC, Codex completed review of `f9c4a2b` with one
  documentation-only finding: this state and the log had not recorded the
  completed repairs. This follow-up corrects that stale status; it does not
  reopen implementation work. CodeRabbit has not reviewed `f9c4a2b`, and its CI
  is still running. The final follow-up head still needs both hosted reviewers
  clean and required CI green before a clean pilot claim or further publication.
  Check live hosted evidence before acting; earlier-head results are not coverage
  of a later head. No additional implementation finding was reported by Codex.
- The original Linux Atmosphere ring snapshot failure remains unresolved;
  snapshot-refresh authorization is separate and pending. Splitting does not
  approve PNG changes, production access, provider creation, deployment or merge.
  Earlier dated snapshots below remain historical evidence only.

## Historical Snapshot — Phase 5 Public Product Identity and Browser QA Complete Locally

- Phase 4 is merged. [PR #3](https://github.com/dsbowersock/atmoshaper/pull/3)
  merged into `main` at `2026-09-13T17:56:59Z` by `dsbowersock` as
  `a43d1a315e95d80d6570fb5e49d1e2dce5ce7ddb`. Its exact reviewed head was
  `69ff135aed8d0b1ecb43c054595d1e08e89a22b1`; the retained review branch is
  `codex/atmoshaper-dead-code-audit`.
- The user selected public product identity as the first Phase 5 subsystem. The
  clean branch `codex/atmoshaper-public-product-identity` starts from the exact
  Phase 4 merge. The user approved its [written design](superpowers/specs/2026-09-13-atmoshaper-public-product-identity-design.md),
  and the [implementation plan](superpowers/plans/2026-09-13-atmoshaper-public-product-identity.md)
  passed independent review after its Browser-QA build prerequisite was made
  explicit.
- Local Tasks 1–3 are complete: one frozen, dependency-free identity owner now
  serves the mapped SEO/metadata, app-shell and PWA consumers. Each task passed
  independent specification and code-quality reviews with no findings. All
  affected runtime values remain `MassageLab`, with the same assets, routes,
  layout, accessibility and install behavior; SEO exports remain compatibility
  adapters. Only mapped inline presentation copies retired.
- Broad local verification passed: focused tests 58/58; full unit tests 4,557
  total, 4,554 passed, 3 expected skips and zero failures; Prisma validate and
  generate, typecheck, lint and production build. Next.js 16.2.12 generated
  115/115 static pages and the complete route table, unchanged from baseline.
  The [evidence record](aegis/work/2026-09-13-atmoshaper-phase5-public-product-identity/90-evidence.md)
  records exact commits, inventory observations and non-fatal build/lint notes.
- The staged brand baseline reached a byte-identical generated fixed point with
  zero unexplained category drift. The local Phase 5 identity slice and both
  complete-branch final specification and code-quality reviews passed.
- The separately authorized Browser-QA lifecycle used a new independent empty
  temporary Neon project. Its non-production identity was proven before use,
  exactly 46 committed migrations were applied, and all 134 application tables
  were empty both before and after the run. `npm run build:browser-qa` completed
  immediately before the exact scoped Playwright command for `pwa.spec.ts` and
  `app-shell.spec.ts`; the 152-case selection completed with status `passed`,
  zero failed tests and no snapshot update. The temporary project was deleted
  and proved absent; the existing production project remained present, and no
  production data was copied, read or altered.
- PR #4 is open. Initial published head `4f5485611e18327099081990d3d65e0943b89317`
  passed Code quality, Browser build, all four Browser QA lanes, aggregate QA
  and exact-head CodeRabbit with no actionable comments. Successor heads must repeat these gates before merge; deployment, Phase 6 rebrand and merge remain gated.

## Historical Snapshot — Phase 4 Audit-Only Round 27 Pre-Merge Closeout

- The staged Round 27 candidate addresses finally-aware break/continue state, anonymous default function declarations, captured/default environment provenance, and BigInt zero spellings. Independent specification review found one reciprocal provenance case; it was fixed, and scoped specification re-review and full-candidate quality review passed. Code quality's CI timeout increases from 12 to 20 minutes after the prior hosted job was cancelled during unit tests, without an assertion failure.
- Fresh coordinator checks passed: focused audit/browser-harness tests 386/386; full tests 4,552 total, 4,549 passed, 3 expected skips, zero failures; Prisma validate/generate, typecheck, lint, build (115 pages), and cached diff check. Pre-document audit receipts are historical once these records are staged; [the evidence record](aegis/work/2026-09-10-atmoshaper-phase4-audit-only/90-evidence.md#round-27-integrated-closeout--2026-09-13) records their boundary. Ordinary brand audit reported zero missing/unclassified. Generated candidates A/B had 26,380 identical entries, unchanged source/categories, and zero occurrence deltas; their difference from the checked-out baseline was only generated LF versus Windows CRLF serialization.
- Pushed PR #3 head remains `ce337648fc9b99a8b9724214ab8c961120d40afc`. Next: coordinator stages bounded docs/test changes, regenerates and reviews any actual occurrence deltas, updates/stages the baseline if required, and proves the fixed point against staged Git blob bytes rather than CRLF worktree bytes. Index-sensitive audits, commit/push, and latest-head hosted checks/CodeRabbit follow. Exact final-index identity stays in the ignored handoff to avoid self-reference. Merge remains separately authorized. No candidate deletion, product-runtime, provider, lockfile, dependency, or Phase 5 action occurred; `deletionAuthority: false` remains binding.

## Historical Snapshot — Phase 4 through Round 26

The dated receipts and earlier next-action statements below are historical;
the Round 27 snapshot above owns current status.

- Phase 1–2 bootstrap is merged. [PR #1](https://github.com/dsbowersock/atmoshaper/pull/1) merged into `main` at `2026-09-09T09:36:44Z` by `dsbowersock` as `f59e1b9371b06e7401740ae011f6dc911430a97c`. Its reviewed head was `6f516b29a8f1be8c66b48663f1101b66efe3f7f9`; `codex/bootstrap-atmoshaper` remains retained.
- The sole fresh root is `7e89f7ba9508a1ad715c1824ea6099432e6a4ccd`, exported from MassageLab source `e74045c2fc85c2cb4df176fdb1aff2137c4d9848`. The initial 1,908-path contract and bootstrap checks below remain historical receipts, not fresh verification of this branch.
- The approved [Phase 3 plan](superpowers/plans/2026-09-09-atmoshaper-phase3-documentation-consolidation.md) is complete. [PR #2](https://github.com/dsbowersock/atmoshaper/pull/2) merged at `2026-09-10T00:57:48Z` as `7c07e4578307508ae2bdb784c4d7ad0d9fb64c65`; its reviewed head was `9d2a8eca057f33354f2cbb50263c8e4f365a00f1`, and `codex/atmoshaper-docs-consolidation` remains retained.
- Phase 4 audit-only work is complete locally on `codex/atmoshaper-dead-code-audit`, created from the exact Phase 3 merge. Planning commit `e27c1d0ce941fbf9610389b45b9a30c82caac873` records the approved [Phase 4 plan](superpowers/plans/2026-09-10-atmoshaper-phase4-audit-only.md). The pre-publication final repair cycle sanitizes malformed and path-like module specifiers, recognizes destructured environment defaults, matches the installed Next 16.2.12 single-digit metadata convention, models lexical shadowing and alias reassignment, and records literal `require.resolve()` ownership with hash-only nonliteral uncertainty. Repair validation confirmed three failing regression cases before their fixes and 3/3 passing afterward; strict TDD remained off. The pre-publication combined focused audit suite passed 64/64. Hosted review round 1 then corrected environment evidence so assignment and delete targets no longer count as reads; its focused slice passed 7/7, and the combined focused audit suites passed 68/68 with historical semantic results of dead code 1,558 findings/186 uncertainties, dependency 2,859/19, asset 340/2,002, and environment 612/178. Hosted review round 2 added config-alias, whole-object/computed environment, and browser-snapshot coverage; its focused repository audit suites passed 74/74 with historical semantic results of dead code 1,558/186, dependency 2,859/19, asset 388/2,003, and environment 587/191. Round 2's historical pre-document-synchronization snapshot measured 47,216,441 Git blob bytes. Hosted review round 3 added separately labeled exact declaration-companion/type evidence, two exact configuration/manifest dependency owners, and owner-relative bare asset paths that become exact only when tracked and in inventory and otherwise remain hash-only uncertainty. That round's focused repository audit suites passed 80/80; its now-historical semantic results were dead code 1,558/186 with 842 referenced modules and 23 candidates, dependency 2,861/19 with 2 configuration owners and 6 candidates, asset 390/11,384 with 97 tracked assets, 97 protected items, 177 exact owners, zero candidates, 529 dynamic rows and 10,855 unresolved rows, and environment 587/191. Its tracked inventory contained 1,921 files. Hosted review round 4 moved exact configuration ownership into the validated stage-0 policy and conservatively covered direct, aliased, wrapped, logical and conditional whole-environment forwarding without changing asset semantics. That round's focused repository audit suites passed 83/83: 21 repository-audit tests and 62 cleanup-audit tests. Its now-historical semantic results were dead code 1,558/186 with 842 referenced modules and 23 candidates, dependency 2,861/19 with 2 configuration owners and 6 candidates, asset 390/11,384 with 97 tracked assets, 97 protected items, 177 exact owners, zero candidates, 529 dynamic rows and 10,855 unresolved rows, and environment 587/250 with 77 computed and 173 unproven-alias uncertainties and zero unread-declaration candidates. At that snapshot, the tracked inventory contained 1,921 files and brand verification was zero missing and zero unclassified. Hosted review round 5 recognized runtime named `env` imports from the exact `node:process` and `process` modules and preserved their evidence through lexical loop/catch shadowing and function-scoped `var` behavior, including assignment-free redeclarations. It also repaired two historical receipt anchors in the reference inventory. That round's focused repository audit suites passed 86/86: 21 repository-audit tests and 65 cleanup-audit tests. Its now-historical semantic results were dead code 1,558/186 with 842 referenced modules and 23 candidates, dependency 2,861/19 with 2 configuration owners and 6 candidates, asset 390/11,384 with 97 tracked assets, 97 protected items, 177 exact owners, zero candidates, 529 dynamic rows and 10,855 unresolved rows, and environment 587/252 with 79 computed and 173 unproven-alias uncertainties and zero unread-declaration candidates. Hosted review round 6 recorded nested object destructuring defaults sourced from proven environment objects. That round's focused repository audit suites passed 87/87: 21 repository-audit tests and 66 cleanup-audit tests. Its now-historical semantic results were dead code 1,558/186 with 842 referenced modules and 23 candidates, dependency 2,861/19 with 2 configuration owners and 6 candidates, asset 390/11,384 with 97 tracked assets, 97 protected items, 177 exact owners, zero candidates, 529 dynamic rows and 10,855 unresolved rows, and environment 587/252 with 79 computed and 173 unproven-alias uncertainties and zero unread-declaration candidates. At the verified round-6 staged code snapshot, the full suite passed 4,282 tests with 3 host-dependent skips and zero failures; typecheck and lint passed. Hosted review round 7 recorded exact tracked runtime package metadata ownership, keeping `@generative-music/pieces-alex-bainter` out of unreferenced candidates without claiming an executable import. The generic parser required exact declared package names and versions and conservatively handled lexical shadows, duplicate or overridden properties, and spreads. That round's focused repository audit suites passed 88/88: 21 repository-audit tests and 67 cleanup-audit tests. Its now-historical semantic results were dead code 1,558/186 with 842 referenced modules and 23 candidates; dependency 2,863/19 with 2 configuration owners, 1 runtime-package-metadata owner, 144 referenced packages and 5 candidates; asset 390/11,384 with 97 tracked assets, 97 protected items, 177 exact owners, zero candidates, 529 dynamic rows and 10,855 unresolved rows; and environment 587/252 with 79 computed and 173 unproven-alias uncertainties and zero unread-declaration candidates. Round-7 verification passed: the full suite recorded 4,283 passed, 3 host-dependent skips and zero failures; typecheck passed; lint passed with no ESLint warnings; and the production build passed with 115 routes. The build's Babel deoptimization note was informational, not a lint warning. Earlier round-6 results remain historical supporting evidence. Hosted review round 8 added `data/` to the asset inventory and explicitly protected it as a conservative retained catalog/provenance boundary. Duplicate dependency declarations preserved all exact string versions across declaration sections for runtime metadata matching, without claiming an executable import. That round's focused repository audit suites passed 91/91: 21 repository-audit tests and 70 cleanup-audit tests. Its now-historical semantic results were dead code 1,558/186 with 842 referenced modules and 23 candidates; dependency 2,863/19 with 2 configuration owners, 1 runtime-package-metadata owner, 144 referenced packages and 5 candidates; asset 561/11,302 with 137 tracked assets, 137 protected items, 262 reference owners, 25 basename signals, zero candidates, 529 dynamic rows and 10,773 unresolved rows; and environment 587/252 with 79 computed and 173 unproven-alias uncertainties and zero unread-declaration candidates. At the verified round-8 staged snapshot, the full suite recorded 4,289 tests: 4,286 passed, 3 host-dependent skips and zero failures. Typecheck passed; lint passed with no ESLint warnings; and the production build passed with 115 routes. The Babel deoptimization note was informational, not a lint warning. All four audit CLIs ran twice with byte-identical output, zero stderr and `deletionAuthority: false`. Hosted review round 9 made global and exact imported process-object recognition scope-aware. Lexical/TDZ, `var`, function, class, catch, loop, module and static-block shadows no longer imply environment ownership. Parameter defaults were evaluated separately from body bindings, and namespace `ImportEquals` declarations shadowed outer process objects. The import classifier was consolidated; the environment analyzer contained 482 nonblank lines. These repairs changed no real-repository audit counts. That round's focused repository audit suites passed 95/95: 21 repository-audit tests and 74 cleanup-audit tests. Its now-historical semantic results were dead code 1,558 findings/186 uncertainties; dependency 2,863/19; asset 561/11,302; and environment 587/252: 306 static reads, 79 declared names, 202 missing declarations, zero unread-declaration candidates, 79 computed uncertainties and 173 unproven-alias uncertainties. At the verified round-9 staged code snapshot, the full suite recorded 4,293 tests: 4,290 passed, 3 host-dependent skips and zero failures. Typecheck passed; lint passed with no ESLint warnings; and the production build passed with 115 routes. Rounds 7 and 8 remain historical supporting evidence. Every report retains `deletionAuthority: false`. Hosted review round 10 repaired two validated latest-head findings: outer proven/unknown environment aliases leaking across inner declarations, and non-Node runtime imports locally named `env` or `environment` disappearing from the evidence. Inner declarations shadowed outer aliases without discarding existing same-scope bindings on assignment-free `var` redeclarations. Non-Node wrapper imports remain unproven-alias uncertainty, not exact environment ownership; exact Node imports and type-only exclusions remain distinct. The regression repair followed TDD RED/GREEN validation. The environment analyzer contained 490 nonblank lines. That round's focused repository audit suites passed 97/97: 21 repository-audit tests and 76 cleanup-audit tests. At the verified round-10 code snapshot, the full suite recorded 4,295 tests: 4,292 passed, 3 host-dependent skips and zero failures. Typecheck and lint passed; the Babel deoptimization note was informational, not an ESLint warning. The exact environment audit ran twice with byte-identical output, zero stderr and `deletionAuthority: false`. Its now-historical totals remained unchanged at 587 findings/252 uncertainties: 306 static reads, 79 declared names, 202 missing declarations, zero unread-declaration candidates, 79 computed uncertainties and 173 unproven-alias uncertainties. Round-9 verification remains historical supporting evidence, including its production-build receipt. At that snapshot, latest-head hosted review was pending; resolving hosted feedback and final checks/review precede any separately authorized merge. No cleanup deletion, provider mutation or Phase 5 action occurred; `deletionAuthority` remains false. Hosted review round 11 recorded the staged CodeRabbit/Codex privacy and opaque-tool hardening. Nested `.secrets/` and `secrets/` directories were rejected at any depth before policy, metadata or evidence blob reads. The tracked Python adapter was represented exactly once as an opaque manual-tool uncertainty without parsing its content; this does not claim a static import or authorize removal. That round's focused repository audit suites passed 98/98. The full suite recorded 4,296 tests: 4,293 passed, 3 host-dependent skips and zero failures. Typecheck and lint passed. Its now-historical semantic results were dead code 1,558 findings/187 uncertainties, including 2 manual-script uncertainties; dependency 2,863/19; asset 561/11,303; and environment 587/252. All four audits ran twice with byte-identical output, exit 0 and empty stderr; every report retained `deletionAuthority: false`. Brand verification reported zero missing and zero unclassified references, and the inventory reported zero forbidden tracked paths. The exact staged capture before this round's documentation synchronization contained 1,921 files and 47,355,254 Git blob bytes, with inventory SHA-256 `bb8b8c792c03a60bd5531e69e4f6c81d95781851b751c8b9a5824700036ded92`. This is a historical pre-document-synchronization capture, not the identity of the index after these versioned receipts are staged. Current final-index bytes and hashes remain outside these self-referential versioned documents. Round-10 results remain historical supporting evidence. At that snapshot, latest-head hosted review and final checks/review were pending before any separately authorized merge of PR #3. No cleanup deletion, provider mutation or Phase 5 action occurred; `deletionAuthority` remains false. Hosted review round 12 repaired two validated latest-head Codex findings: tracked credential/secret basename files could bypass privacy protection under non-JSON extensions, and 22 CSS files were absent from cleanup candidate/uncertainty coverage. Exact or dotted `credential`, `credentials`, `secret` and `secrets` basenames are now rejected independently of extension before blob reads, while lookalike names remain allowed. Policy-owned `.css` files each appear exactly once as metadata-only `stylesheetUsage` uncertainties, without JS/TS parsing or dependency evidence; existing imports and CSS asset-reference evidence remain preserved. TDD credential validation recorded RED with 0 of 1 targeted test passing, then GREEN 2/2. All 3 newly added CSS regression tests failed at RED for the expected missing coverage before implementation; the CSS GREEN slice passed 11/11. The authoritative staged focused repository audit suites passed 101/101. The full suite exited 0 with 4,299 tests: 4,296 passed, 3 host-dependent skips and zero failures. Typecheck and lint passed; the Babel deoptimization note was informational. Its now-historical semantic results were dead code 1,558 findings/209 uncertainties, including 22 `stylesheetUsage` and 2 `manualScripts` uncertainties; dependency 2,863/19; asset 561/11,305; and environment 587/252. All four audits ran twice with byte-identical output, exit 0 and empty stderr; every report retained `deletionAuthority: false`. Brand verification remained at zero missing and zero unclassified references. The historical pre-document-synchronization staged inventory contained 1,921 files and 47,369,668 Git blob bytes, with inventory SHA-256 `88baaae9e2ebd36cc66e06965ab3dee426a3c1bcaf1b3eaa110a1d8bd7c0d12a` and zero forbidden tracked paths. This capture does not identify the index after these versioned receipts are staged; current final-index bytes and hashes remain outside these self-referential documents. Round-11 results remain historical supporting evidence. At that snapshot, latest-head hosted checks and reviews remained pending before any separately authorized merge of PR #3. No deletion, merge, provider mutation or Phase 5 action occurred; `deletionAuthority` remains false. Hosted review round 13 repaired one validated latest-head Codex finding at `3a10a1b`: nested exact plain or dotted singular/plural credential/secret directory segments could bypass the fail-before-read guard. Those directory segments are now rejected before metadata or blob reads, while lookalike names remain allowed. TDD validation recorded RED with 0 of 1 targeted test passing, then GREEN 1/1. The focused privacy/source-cap slice passed 8/8, and the CSS regression slice passed 3/3. The authoritative staged repository audit suites passed 101/101. The full suite exited 0 with 4,299 tests: 4,296 passed, 3 host-dependent skips and zero failures. Typecheck and lint passed; the Babel deoptimization note was informational. Its now-historical semantic results were dead code 1,558 findings/209 uncertainties, including 22 `stylesheetUsage` and 2 `manualScripts` uncertainties; dependency 2,863/19; asset 561/11,308; and environment 587/252. All four audits ran twice with byte-identical output, exit 0 and empty stderr; every report retained `deletionAuthority: false`. Brand verification remained at zero missing and zero unclassified references. The historical pre-document-synchronization staged inventory contained 1,921 files and 47,381,374 Git blob bytes, with inventory SHA-256 `1bf7e63a2192b624816da03083b867d45d6611b51d37a7d8bb10fe99c6bbbe9a` and zero forbidden tracked paths. This capture does not identify the index after these versioned receipts are staged; current final-index bytes and hashes remain outside these self-referential documents. Round-12 results remain historical supporting evidence. At that snapshot, latest-head hosted checks and reviews remained pending before any separately authorized merge of PR #3. No deletion, merge, provider mutation or Phase 5 action occurred; `deletionAuthority` remains false. Hosted review round 14 repairs one validated latest-head Codex finding on `9e5cb0c`: bounded compound credential-artifact basenames `client_secret_<identifier>` and exact `service-account-key` were reaching metadata or blob reads. They are now rejected before policy, metadata or evidence reads. Case and nesting variants were tested; benign lookalikes remain allowed. Strict TDD validation recorded RED with 0 of 1 targeted test passing, then GREEN 1/1. The relevant privacy/CSS/source-cap slice passed 11/11, and the authoritative staged focused repository audit suites passed 101/101. The full suite exited 0 with 4,299 tests: 4,296 passed, 3 host-dependent skips and zero failures. Typecheck and lint passed; the Babel deoptimization note was informational. Its now-historical semantic results were dead code 1,558 findings/209 uncertainties, including 22 `stylesheetUsage` and 2 `manualScripts` uncertainties; dependency 2,863/19; asset 561/11,312 with 529 dynamic and 10,783 unresolved uncertainties; and environment 587/252. All four audits ran twice with byte-identical output, exit 0 and empty stderr; every report retained `deletionAuthority: false`. Brand verification remained at zero missing and zero unclassified references. The historical pre-document-synchronization staged inventory contained 1,921 files and 47,391,330 Git blob bytes, with inventory SHA-256 `76816a9001dd302d4765da3dc868da9d9eb9636ee3809c71814659c3d2f6c046` and zero forbidden tracked paths. This capture does not identify the index after these versioned receipts are staged; exact final-index bytes and hashes remain outside these self-referential tracked documents. Round-13 results remain historical supporting evidence. Latest-head hosted checks and CodeRabbit/Codex reviews remain pending before any separately authorized merge of PR #3. No deletion, merge, provider mutation or Phase 5 action occurred; `deletionAuthority` remains false. At that now-superseded snapshot, the tracked inventory was 1,921 files and brand verification was zero missing and zero unclassified. The pre-publication Prisma validation/generation, typecheck, lint, full suite (4,259 passed, 3 host-dependent skips, 0 failed), 115-route production build, and independent specification and quality reviews passed. Exact current staged byte totals and identities are retained outside this self-referential versioned index. The local completion commit was published in [PR #3](https://github.com/dsbowersock/atmoshaper/pull/3) for hosted review; resolving hosted feedback and final checks/review precede any separately authorized merge. Every report hard-codes `deletionAuthority: false`; no deletion, rename, upgrade, retirement, runtime change, or Phase 5 work is authorized. Hosted review round 15 is now historical; round 14 remains historical. Latest-head Codex review on `9946a24` validated that generic `client-secret.json`, `client_secret.json`, and `service-account.json` artifacts bypassed fail-before-read, and that direct CommonJS `const process = require("node:process")` / `require("process")` bindings were not recognized, causing false unread environment declarations. The bounded credential matcher now recognizes exact optionally dot-prefixed `client[-_]secret` and `service[-_]account` stems only at dot or end boundaries, while preserving `client_secret_<identifier>`, `service-account-key`, and benign guide/manager lookalikes. The CommonJS process-binding scope model recognizes those exact direct requires and models `require`/`process` shadowing, assignment/update invalidation, loop evaluation order, merged enum members, and sloppy `.cjs` Annex-B block-function boundaries. Cross-file/global bindings and separately merged namespace enums remain explicitly unmodeled; a current real tracked-source search found no CommonJS process require outside audit fixtures. Staged-code validation passed 119/119 focused repository-audit tests, 4,314 of 4,317 full-suite tests with 3 host-dependent skips and zero failures, typecheck, and lint. Pre-document audits ran twice with byte-identical output, exit 0 and empty stderr; every report retained `deletionAuthority: false`: dead code 1,561/209, dependency 2,864/19, asset 561/11,314, and environment 587/252. Brand verification was zero missing and zero unclassified. The current tracked inventory contains 1,922 files with zero forbidden paths; exact final staged bytes and identity are retained only in the ignored SDD/user-facing receipt. Pre-document repeat output SHA-256 values were dead code `a6357175f60ce4bba5fbcde50a93e262ebb5744c89c409b2b844cf78f68047a5`, dependency `f068dd6f6f219f9a0d5abbf4462752373cbca7bee02c9d9bd8756e142ec49a47`, asset `ad1f0bfacd3cdab11ba39986af151d760b9e750b48b94345f53c718ecf3a2051`, environment `c1dc9e91f3861926328721bd6e98d269c7eceb29f9970a09b18d047e31bd4acf`, inventory `82d2afaf5b953d9e2c2a83acd01d819ce2ea7a3d38c1c4bc293e8e86f0cafb4a`, and brand `50a8f6f48d60f51c00edfd2b0a5005289e007e9939f18862beaa5e83667ecd2b`; these remain historical raw-output receipts and do not identify the final staged index. Hosted checks/reviews remain pending, merge remains separately authorized, and no deletion, merge, provider action or Phase 5 work occurred. The current tracked inventory is 1,922 files. Hosted review round 16 is now historical. Hosted review round 17 is the current Phase 4 receipt. Latest-head Codex review on `012945b` validated that TypeScript external import-equals module references were absent from module/dependency evidence and that exact non-type source-level `import <alias> = require("process"|"node:process")` declarations were not proven for environment reads. The module audit now records separately labeled `import-equals` literal/static evidence, preserves type-only declaration resolution, ignores internal aliases, and keeps syntactically possible nonliteral external references as hash-only uncertainty. Environment evidence proves process import-equals only for valid source-level non-type declarations, preserving source order, lexical shadowing and assignment/update invalidation while excluding unrelated, internal, type-only and nested-invalid forms. Independent review caught and repaired the TS1147 namespace false-positive before final validation. Current tracked source contains no import-equals `require(...)` syntax, so semantic totals remain dead code 1,561 findings/209 uncertainties, dependency 2,864/19, asset 561/11,314, and environment 587/252. Staged validation passed the module slice 3/3; environment strict RED 0/2 then GREEN 2/2; namespace correction RED 1/2 then GREEN 2/2; combined slice 52/52; focused repository audits 123/123; full suite 4,318 of 4,321 with 3 host-dependent skips and zero failures; typecheck, lint and diff checks; and source caps of 500 module, 499 environment and 131 scope nonblank lines. Pre-document audits were byte-identical across two runs, brand verification remained zero missing and zero unclassified, every report retained `deletionAuthority: false`, and the current tracked inventory is 1,922 files. Detailed pre-document bytes and hashes remain in the other round-16 receipts; exact final staged bytes and identity remain only in the ignored SDD/user-facing receipt. Hosted reviews and checks remain pending, merge remains separately authorized, and no deletion, provider action or Phase 5 work occurred. Latest CodeRabbit review on remote head `012945b` validated that `SatisfiesExpression` wrappers dropped proven environment/CommonJS flows and that destructuring assignments sourced from proven environment objects omitted exact extracted top-level keys in favor of overbroad whole-object uncertainty. Shared `satisfies` transparency now covers aliases, direct reads, CommonJS recognition and escape traversal while preserving shadow and mutation boundaries. The focused environment-pattern helper records shorthand, renamed and literal-computed top-level keys, top-level-only nested semantics and separately sourced nested defaults while preserving hash-only dynamic/rest/unproven-alias uncertainty, evaluated expressions, ordering, target invalidation, privacy, determinism and duplicate suppression. Independent final review also repaired a conditional destructuring-default provenance gap: simple assignment defaults from proven or unknown environment objects now emit one hash-only unbounded `assignment-default` uncertainty and retain unknown target provenance, preserving shorthand/renamed cases, outer exact keys, later reads, shadows and invalidation without plaintext or duplicates. Strict TDD recorded `satisfies` RED 0/3 then GREEN 3/3, assignment RED 0/3 then GREEN 3/3, and conditional assignment-default RED 0/5 then GREEN 5/5; combined assignment tests passed 8/8, the broad slice passed 58/58 and final independent review passed. Focused repository-audit tests passed 134/134; the full suite recorded 4,332 total, 4,329 passed, 3 host-dependent skips and zero failures; typecheck, lint, documentation-state and diff checks passed; and source caps were environment analyzer 486, environment-pattern helper 35, environment scope 132 and module evidence 500 nonblank lines. Pre-document audits ran twice byte-identically with dead code 1,564/209, dependency 2,865/19, asset 561/11,314 and environment 587/252; brand remained zero missing and zero unclassified, every report retained `deletionAuthority: false`, and the current tracked inventory contains 1,923 files with zero forbidden paths. Detailed pre-document bytes and hashes remain in the round-17 evidence receipts; exact final staged bytes and identity remain only in the ignored SDD/user-facing receipt. Four hosted threads remain until push. The latest CodeRabbit review completed with these two comments; latest-head re-review and checks remain pending. Merge remains separately authorized, and no deletion, provider action or Phase 5 work occurred.
- Hosted review round 18 is now historical supporting evidence. Three latest-head findings on remote `01ae7fb` were validated and repaired: loader evidence now requires scope-aware ownership of `require` and `createRequire`; NodeNext explicit `.cjs` and `.mjs` specifiers substitute only within their `.cts`/`.d.cts` and `.mts`/`.d.mts` families, without cross-family fallback; and environment evidence preserves conditional provenance through logical `&&=`, `||=` and `??=` assignments with hash-only uncertainty where ownership remains unproven. Exhaustive independent staged review also found and fixed adjacent scope and evaluation-order gaps across parameter, switch, enum, loop, pattern, catch, class, decorator, Annex-B, `with`, optional-call and mutation boundaries, including `.resolve` mutation behavior. Final independent review passed with 53 accumulated reproductions and 16/16 targeted checks. The earlier 145/145 focused repository-audit result is historical; the final loader and environment slices passed 28/28 and 60/60, and the authoritative exact-staged focused repository-audit suite passed 162/162 after documentation synchronization. The full suite recorded 4,360 total, 4,357 passed, 3 host-dependent skips and zero failures; typecheck, lint and diff checks passed. Source caps were environment analyzer 496, environment-pattern helper 42, environment scope 132, module evidence 419, module loader 475 and module resolution 96 nonblank lines. Pre-document audits ran twice byte-identically with exit 0 and `deletionAuthority: false`: dead code 1,570/211 (`a035d78474f9fcb3ee465cf8e4f289a2112ef2cadcb4d86410faa8503a593cd4`), dependency 2,868/21 (`0e2c9ef622745d67b746e8f72ffecf74a48139095db67ddaf67a04f5e6ebeece`), asset 561/11,314 (`452217301e254a1ef5ec74abb4021eaddf1c01ade1c382e1ac3619acabdc1a00`) and environment 587/252 (`f87cac8099ec64eb613b6215202c5e461476f83164d452baa6fab4624851b91e`). The pre-document tracked inventory contained 1,925 files and 47,569,581 Git blob bytes, inventory SHA-256 `c835271d633b07c09a58d6280cf1bfc520864674c7e34a2464f16f68db4d6619`, output SHA-256 `623f1bc01f36f8fab7f8db1e50b7448995323ef30dab6247a4130df2dfae684e` and zero forbidden paths. Brand remained zero missing and zero unclassified with output SHA-256 `50a8f6f48d60f51c00edfd2b0a5005289e007e9939f18862beaa5e83667ecd2b`. These pre-document hashes and identities become historical when these documents are staged, and the exact final identity remains only in the ignored SDD receipt. Latest-head hosted checks and reviews remain pending. Merge remains separately authorized, and no deletion, provider action or Phase 5 work occurred. Hosted review round 19 adds the [tracked Round 18 successor attestation](aegis/work/2026-09-10-atmoshaper-phase4-audit-only/round-18-final-receipt.md) for immutable subject commit `f10773c7c94c9db9e4059a82dd45c5195fb83dc9` and tree `78b1b769413053bfb798038e31a6b4a21e8a52b9`. It records the final subject inventory and CRLF report hashes previously retained only outside Git, while explicitly not attesting the later tree that contains the receipt itself. Hosted checks and reviews remain pending; merge remains separately authorized, and no deletion, provider action or Phase 5 work occurred. Hosted review round 19 is now the current Phase 4 receipt. Bare owner-relative asset URLs resolve as exact evidence only in parsed CSS `url(...)` tokens and Markdown link or image destinations; masked comments, fenced or inline code, ordinary prose and quoted content remain hash-only uncertainty. Strict TDD covered both context repairs and the follow-up masked slash-path regression. Independent final code review fixed and covered blockquote/list tilde fences, CSS escaped-newline and unclosed quoted strings, and CommonMark 5+ list-padding code boundaries. Explicit `.js`, `.jsx`, `.mjs` and `.cjs` imports preserve runtime ownership and separately record family-matched TypeScript substitution ownership for `.ts`, `.tsx`, `.mts` and `.cts`; declarations remain separately labeled declaration-companion evidence. The tracked successor attestation continues to govern immutable subject commit `f10773c7c94c9db9e4059a82dd45c5195fb83dc9` and tree `78b1b769413053bfb798038e31a6b4a21e8a52b9` without self-attesting the later tree that contains it. Independent staged review passed. The exact staged focused repository-audit suite passed 172/172; the full suite recorded 4,370 total, 4,367 passed, 3 host-dependent skips and zero failures; and typecheck, lint, documentation-state and working/staged diff checks passed. Source caps were asset evidence 253, module evidence 426, module resolution 101, module loader 475, environment analyzer 496, environment-pattern helper 42 and environment scope 132 nonblank lines. Current pre-document audits ran twice with byte-identical output, exit 0 and `deletionAuthority: false`: dead code 1,570/211 (`30ada36f1077ae197445417025da82cab1c3da73c452d66c3ceae1586509a5b0`), dependency 2,868/21 (`66403e4cde209e2cc387fa23f58639fc4de287b66f88b862b81f62287fd849e1`), asset 557/11,358 (`c4887ec9041c400a01201edca6368c27cdada07ec23808ee7e17faf45f6eeee6`) and environment 587/252 (`770bc579411453dda8a9df864492ff9d69cc1c724244cf442b8d802e01079313`). The current pre-document inventory contained 1,926 files and 47,629,855 Git blob bytes, inventory SHA-256 `55e5b16dc1055d424f305b9a5eebad8c72e157be236b6dc2ec1f9d5aae4a151d`, output SHA-256 `7b5f8db5051ab55762f054e07f7e7e61f0d580e6a6305ae95969b29d0d6a5fe1` and zero forbidden paths. Brand verification remained zero missing and zero unclassified with output SHA-256 `50a8f6f48d60f51c00edfd2b0a5005289e007e9939f18862beaa5e83667ecd2b`. This pre-document identity becomes historical when the synchronized documents are staged; the successor-attestation contract governs immutable subjects. Latest-head hosted checks and reviews remain pending. Merge remains separately authorized, and no deletion, provider action or Phase 5 work occurred. Hosted review round 20 is now historical supporting evidence. Six validated latest-head findings were repaired: extensionless bundler resolution records separate TypeScript companion ownership including dotted basenames; `.mts` and `.cts` asset sources use the TypeScript AST; slashless quoted/unquoted HTML `src`, `href` and `poster` values become exact owner-relative evidence only in live start tags recognized by conservative stateful data/raw-text/comment tokenization; and the tracked Round 18 successor receipt rejects standard error, validates all trusted JSON field existence/types before use, and removes only its bounded temporary checkout without masking an original error. Independent adversarial follow-ups covered case-insensitive duplicate attributes, ASCII/NBSP boundaries, PLAINTEXT through EOF, bogus and abruptly closed comments, quoted pseudo-tags, and raw-text end tags with attributes or self-closing slashes. Cleanup audit passed 154/154, repository audit 21/21 and the combined focused run 175/175; the full suite recorded 4,373 total, 4,370 passed, 3 host-dependent skips and zero failures; typecheck and lint passed, with the Babel note informational. Source caps were asset 374, module evidence 426, module resolution 105, loader 475, environment 496, patterns 42 and scope 132. The exact pre-document staged receipt repeated twice with exit 0, empty standard error, byte-identical output, shared inventory and `deletionAuthority: false`: dead code 1,570/211 (`76b5c57f679d3199c3bd356c39a95a2e798121cab94343278da7158cea8dc334`), dependency 2,868/21 (`e78383f48cae71f4a183afab5eda173a19ab7de96cc64b7a82a4f9732fc16c1c`), asset 557/11,408 (`580499e903b1725957f4982250521e1996f2a99c6f48c893c2220a99c633081e`) and environment 587/252 (`55b5ff8b7480080551c471e503101a681e7f22769cfc5c18ccab485068f49362`). Its inventory contained 1,926 files, 47,651,052 Git blob bytes, SHA-256 `026219ea7eb8890b1215ed5558540fdfe3fb6b1e56eba8d0f0676ff312f5d091`, output SHA-256 `37764bb4f3947d438a004e7b9b0be4e1aa8ede7ffcd8ff16f0f790b917e4658a` and zero forbidden paths; brand remained zero/zero with output SHA-256 `50a8f6f48d60f51c00edfd2b0a5005289e007e9939f18862beaa5e83667ecd2b`. These values become historical after document staging; the successor-attestation contract governs immutable subjects. Latest-head hosted checks/reviews remain pending; merge remains separately authorized, and no deletion, provider action or Phase 5 work occurred. Hosted review round 21 is now the current Phase 4 receipt. Three latest-head findings were validated and repaired: protocol-relative `//` asset references are external before root-relative handling; live HTML `srcset` values are parsed conservatively into candidate URLs with exact original offsets and are excluded from the legacy literal rescan; and CommonJS plus implicit process-object destructuring proves only exact, static, case-sensitive `env` bindings, including nested and assignment patterns, while preserving source-order mutation and shadow boundaries, including immediately executed class static propagation. Independent stage-1 specification review returned SPEC PASS. Three bounded quality rounds repaired false legacy `srcset` rescanning, process-destructuring declaration and assignment coverage, and implicit-process invalidation including class-static propagation; their RED receipts were 0/2, 0/1 and 0/1, and final code re-review returned PASS. Initial hosted regressions recorded RED 0/3 and GREEN 3/3. The final cleanup suite passed 161/161, repository audit 21/21 and combined focused run 182/182; the full suite recorded 4,380 total, 4,377 passed, 3 host-dependent skips and zero failures; typecheck passed, lint passed with only the informational Babel large-file note, and diff checks passed. Source caps were asset evidence 414, module evidence 426, module resolution 105, module loaders 475, environment evidence 499, environment patterns 73 and environment scope 144 nonblank lines. The pre-document staged audits each ran twice with exit 0, empty standard error, byte-identical output, shared inventory and `deletionAuthority: false`: dead code 1,570/211 (`f6072362bf363c8093c059bc2e545bf0e12f54b2bc99f779b142d4b70e669674`), dependency 2,868/21 (`a54ce7616a9271e804439a5026d4c834847ad7018b899e5ac43d5d9f3e2750d3`), asset 557/11,432 (`3012b71b2790b9885fc8cf6ce27bf6b988ddb8b2d670b9648803c62f9e3e15ab`) and environment 587/252 (`797f978ee56db6be1174bcac7d739bddd93d866d6b059b8568aab82c430fa5ba`). Its inventory contained 1,926 files, 47,683,828 Git blob bytes, inventory SHA-256 `1860b5f32a83af6b433baf4b85937c363e216c7a910ce6615398663edf4f7fb8`, CRLF serialized-output SHA-256 `56ee8ed16eb397e994e957c9c4aa386b0d40c4ae7794e49ae496d24b2c569865` and zero forbidden paths; brand remained zero missing/zero unclassified with output SHA-256 `50a8f6f48d60f51c00edfd2b0a5005289e007e9939f18862beaa5e83667ecd2b`. These pre-document values become historical once the tracked documents are staged; the exact final staged snapshot remains pending in the ignored SDD receipt. Latest-head hosted checks and reviews remain pending. Merge remains separately authorized, and no deletion, provider action or Phase 5 work occurred. Hosted review round 21 is now historical supporting evidence; hosted review round 22 is the current Phase 4 receipt. Six valid latest-head findings were repaired: aliases of proven process objects retain provenance; exact static bracket access to `env` is recognized; HTML character references decode before asset resolution while evidence retains original raw offsets; every exact top-level Sentry and instrumentation entrypoint is runtime-scoped; every parsed primary or duplicate `src`, `href`, `poster` and `srcset` value is masked from legacy scans while first-occurrence ownership is preserved; and parameter destructuring defaults sourced from `process` or a proven process alias propagate provenance. Review hardening added complete WHATWG named-reference and C1 decoding, fail-conservative handling for unknown references, non-ASCII whitespace preservation, and deterministic verification of the CPython 3.14.7 `html.entities.html5` snapshot. Code specification and quality reviews returned PASS. Cleanup passed 169/169, repository audit 21/21 and the combined focused audit 190/190; the full suite recorded 4,388 total, 4,385 passed, 3 host-dependent skips and zero failures; typecheck passed, and lint passed with only the informational Babel greater-than-500-KB note. Nonblank caps were asset evidence 436, HTML URL decoder 59, snapshot refresh verifier 34, environment evidence 498 and environment scope 157. Pre-document staged audits ran twice with exit 0, empty standard error, byte-identical output, shared inventory and `deletionAuthority: false`: dead code 1,575/211 (`cdd19f6df0eb0b72d07b42945fca148f2d9af1b3f7b0ecd03551dd06d9d41bf8`), dependency 2,872/21 (`039c715e5db07b08ff958b0322de6032be6a3e0a88599f65e369567df1d7538b`), asset 557/11,455 (`c90eab097560c71b8e92ab970e9e20ee4dcec1cb1e1e8b0160f3cc08e16ff2f8`) and environment 587/252 (`fb59f6fc055bd143b2cbff8f57b882078bb9c6fb0842d3a5848de3ae1a2c4829`). The inventory contained 1,929 files and 47,760,923 Git blob bytes, inventory SHA-256 `84208d00fae6678e4148c3c4fc3a6889921a85c99125f60299b3eff74b16f7a2`, serialized-output SHA-256 `517e85744eac31373ce529ada76032284d983da6cd9a13efa7ac46b433c3dadf` and zero forbidden paths; brand remained zero missing/zero unclassified with output SHA-256 `50a8f6f48d60f51c00edfd2b0a5005289e007e9939f18862beaa5e83667ecd2b`. These pre-document values become historical once the tracked documents are staged; the exact final staged snapshot remains pending in the ignored SDD receipt. Latest-head PR checks and reviews remain pending. Merge remains separately authorized, and no candidate deletion, provider mutation, merge or Phase 5 action occurred. Hosted review round 22 is now historical supporting evidence; hosted review round 23 is the current Phase 4 receipt. Five valid latest-head findings were repaired: exact `.d.ts`, `.d.mts` and `.d.cts` files classify as generated/type-input uncertainty without widening to ordinary or lookalike sources; CSS `url(...)` evidence uses escape-aware tokenization/decoding with exact raw offsets; a proven environment object on a `for...in` right-hand side records one unbounded whole-environment uncertainty; defaulted process-object aliases in identifier and binding-element patterns inherit proven provenance while retaining TDZ, shadow and invalidation boundaries; and the round 22 project-log receipt now has its own heading. Independent hardening covered complete CSS identifier decoding, non-ASCII prefixes, at-keyword/hash-token and dimension-token boundaries, raw NUL replacement, URL whitespace preprocessing and exact raw offsets; array and catch binding defaults; and conditional, logical, assignment, logical-assignment and comma-expression `for...in` result provenance. Stage 1 ultimately returned SPEC PASS and iterative quality review ultimately returned QUALITY PASS. Cleanup passed 182/182, repository audit 21/21 and the combined focused run 203/203; the full suite recorded 4,401 total, 4,398 passed, 3 host-dependent skips and zero failures; typecheck passed; lint passed with only the informational Babel greater-than-500-KB note; and diff/source-cap checks passed. Nonblank caps were CSS helper 211, asset evidence 444, environment evidence 499, environment patterns 111, environment scope 152 and dead code 139. Pre-document staged audits ran twice with exit 0, empty standard error, byte-identical output, shared inventory and `deletionAuthority: false`: dead code 1,578/211 (`6c3fb5ce9ffb974d7903bbc0b463e5ffba45a6b36be28891fea908b91b4b9269`), dependency 2,872/21 (`a5f2a2dc8089984b8186d25fbea5f7e80eec9027ac3cd0645db56fa7cd99463d`), asset 557/11,510 (`e90d29669bb91913b77a1a422376f1f2416b7ff5e0f7f355ca6cdca306f821ad`) and environment 587/252 (`d7f8e34534a05bc096c263768821b1ede2de9c4d565c706b93a5bed7a70ec775`). The pre-document inventory contained 1,930 files, 47,805,304 Git blob bytes, inventory SHA-256 `fb2258c19f5c8fe2649e5368db1b029e85e7dfe0e4a139e3ea520c61b42783ba`, CRLF output SHA-256 `3d9a205a6ede27c170f94f5c154bdb064ba835515c8d1510a602ceafccffa56a` and zero forbidden paths; brand remained zero missing/zero unclassified with output SHA-256 `50a8f6f48d60f51c00edfd2b0a5005289e007e9939f18862beaa5e83667ecd2b`. These pre-document values become historical once the tracked documents are staged; the exact final staged identity remains pending in the ignored SDD receipt. Latest-head hosted checks and reviews remain pending. Merge remains separately authorized, and no candidate deletion, provider mutation, merge or Phase 5 action occurred.
- The semantic review covered 150 inherited records: 28 specifications and 122 plans. All 28 specifications and 106 plans remain (134 inherited records); 16 exact superseded plans were omitted with current-owner, immutable-source, and rollback evidence in the [cleanup register](rebrand/atmoshaper-cleanup-register.md#phase-3-documentation-omissions--2026-09-09). MassageLab retains every original. Including the new Phase 3 plan, there are 107 plans and 28 specifications.
- [Architecture](architecture.md) maps current owners; [ADR 0001](decisions/0001-fresh-root-lineage-and-history-ownership.md) is Accepted. The other three [decisions](decisions/README.md) remain Proposed: central public-brand ownership, dedicated old-origin recovery, and parallel provider staging are not implemented by Phase 3. [Account security](wiki/account-security.md) owns current identity and 2FA rules.
- Runtime design/copy still presents MassageLab until the separately reviewed Phase 6 preview rebrand. Old-origin recovery implementation, provider staging, deployment, DNS/domain changes, production/database/payment/email/media changes, and legal cutover remain future-gated work. Unrelated hosted-provider observations retain their recorded dates; this synchronization does not refresh them.

## Historical Task 5 Snapshot — Superseded by Current Snapshot

- Phase 1 passed. Its source-baseline, migration-parity, classification, and read-only external-boundary evidence are retained in the migration documents and the historical MassageLab repository.
- Phase 2 is in progress at Task 5. The immutable source is `dsbowersock/massagelab` commit `e74045c2fc85c2cb4df176fdb1aff2137c4d9848`; the reviewed relock commit is `f3b92a1afc44a5fdb2d56653bc82c8d0dc9a933e`.
- The locked source contains 1,905 paths. The reviewed Task 5 contract is four exact omissions and one source-absent addition: `1,905 - 4 + 1 = 1,902` paths. Task 6 adds six repository-audit files, producing the exact final bootstrap contract of `1,908` paths.
- The history-free source export, four omissions, and ten reviewed document overlays have been applied to the local candidate. Task 5's five fresh authority documents are the current review boundary. Git initialization, staging, and exact path/blob verification remain coordinator-owned Task 5 actions.
- Repository identity is AtmoShaper, but the runtime intentionally retains the existing MassageLab design and copy until the separately reviewed Phase 6 preview rebrand. No completed public runtime rebrand is claimed.
- Complete prior development history, historical evidence, and rollback history remain in [`dsbowersock/massagelab`](https://github.com/dsbowersock/massagelab). This repository intentionally starts with fresh Git history.
- No production deployment, provider migration, database or payment change, DNS or domain cutover, old-origin retirement, or legal cutover has occurred through this bootstrap boundary.
- Task 6's deterministic repository and legacy-brand audits remain pending. Tasks 7–9—destination verification and initial commit, verification recording, and public repository/bootstrap-PR publication—also remain pending and must follow their exact gates.

## Current Boundaries

- Preserve current behavior, routes, responsive design, accessibility, privacy, local-first data ownership, feature-key entitlements, APIs, provider-call boundaries, and compatibility identifiers during bootstrap.
- Keep clinical notes, intake forms, journals, ROM sessions, encrypted professional records, and other PHI-bearing workflows local-first until hosted clinical storage passes the documented compliance gates.
- Preserve the legal operator, copyright owner, proprietary license, legal-document versions and effective dates, accepted text, and acceptance history unless a later legal transition is separately reviewed and approved.
- Treat AtmoShaper as the platform identity, `Atmosphere` or `Atmosphere mixer` as the later public audio label, and existing internal `atmoshaper` names as stable compatibility identifiers.

## Authority and Next Reads

- [Project log](project-log.md) — fresh-repository chronological progress.
- [Migration lineage](../MIGRATION_LINEAGE.md) — exact source, date, history owner, and legal boundary.
- [Export manifest](rebrand/atmoshaper-export-manifest.json) — exact path-difference contract.
- [Migration charter](rebrand/atmoshaper-migration-charter.md) — authority, invariants, and external mutation boundary.
- [Operative Phase 1–2 plan](superpowers/plans/2026-09-06-atmoshaper-repository-migration.md) — task sequence and acceptance gates.
- [Phase 3 plan](superpowers/plans/2026-09-09-atmoshaper-phase3-documentation-consolidation.md) — completed consolidation scope, verification, and publication boundary.
- [Phase 4 audit-only plan](superpowers/plans/2026-09-10-atmoshaper-phase4-audit-only.md) — active deterministic evidence-collection scope and no-deletion boundary.
- [Architecture](architecture.md), [decisions](decisions/README.md), and [account security](wiki/account-security.md) — current ownership and migration constraints.
- [Project wiki](wiki/index.md) — stable operational documentation.

## Documentation Rules

- Update this file first when the active phase, current gate, provider/database state, live surfaces, or priority order changes.
- Update `docs/project-log.md` for chronological progress, meaningful decisions, completed branches, and verified receipts.
- Keep historical detail in the MassageLab repository and link to it instead of recreating a competing history here.
- Keep stable operating instructions in `docs/wiki/` and detailed implementation plans in `docs/superpowers/plans/`.
- Do not turn a plan, audit finding, or intended later phase into a completed-state claim without fresh evidence.

## Inherited Verification Receipts

The locked source records the exact 174/174 focused Anatomime matrix. Fresh exact-head full intercepted Anatomime Browser QA coverage reports 42/42 desktop/mobile cases ok in one post-fix run. These are inherited source receipts from `e74045c2fc85c2cb4df176fdb1aff2137c4d9848`, not Task 7 candidate-run evidence.

## Historical Snapshot — Phase 1–2 Bootstrap Published for Review

This is the 2026-09-09 pre-merge publication snapshot, superseded by the current Phase 4 snapshot above. Its open-PR, review-coverage, and stop-before-Phase-3 statements describe that earlier boundary only.

- Tasks 5–7 are complete. Fresh-root `main` is `7e89f7ba9508a1ad715c1824ea6099432e6a4ccd`: the repository has one root, that commit has no parent, and the worktree was clean after creation.
- The initial commit contains the exact 1,908-path contract, 46,865,680 tracked blob bytes, tree `e9a97bbe519a1cc52c7225eb600fd5d2473f6ded`, and aggregate staged-tree SHA-256 `1d537a03b8a0294f1e68f56df718c29b5e5cf4bfedac01de7ae1cceb86aa3604`.
- Repository inventory and legacy-brand audits passed. The final unit suite passed 4,216 of 4,219 tests with 3 intentional skips and no failures; typecheck and lint passed; both builds produced 115 pages.
- The destination route manifest contained 148 keys, matching the source count; server-app bytes matched the source aggregate exactly. Static assets measured 52 bytes above the source aggregate because fresh-build artifact identities differ, so no per-file bundle equality is claimed. The web manifest, robots, sitemap, service worker, and all 24 accepted PNGs matched their source bytes and hashes.
- All four Browser-QA lanes passed at their accepted counts, and the final fresh migration-parity lifecycle passed 22/22 without snapshot updates. A prior transient desktop Home readiness failure was followed by a focused 1/1 pass and a separate full 22/22 pass; no runtime or snapshot change was required.
- The accepted empty QA project received exactly 46/46 committed migrations. All 134 application tables were empty after cleanup. Every cycle-owned temporary project was deleted and verified absent, the unrelated pre-existing project was preserved, and no production data was copied or altered.
- Task 8 recorded the destination receipt in commit `953e04c680d497851cdb6b6533b92de8f9b1c4f2`. Task 9 then created the public repository at [`dsbowersock/atmoshaper`](https://github.com/dsbowersock/atmoshaper), published `main` and `codex/bootstrap-atmoshaper`, and opened [PR #1](https://github.com/dsbowersock/atmoshaper/pull/1). The repository is public, its default branch is `main`, and it has no tags. PR #1 remains open and unmerged with base `main` and review branch `codex/bootstrap-atmoshaper`.
- One test-only correction commit, `23f5b8654a89c83de4ae3c6454996e9f7bc6b283`, advanced the project-state verification-date upper bound to 2026-09-09 after the first hosted Code quality run exposed the stale 2026-09-08 ceiling. At that exact head, the focused test passed 15/15 and the full local suite passed 4,216 with 3 skips and 0 failures.
- Hosted run `34325535135` passed at exact `23f5b8654a89c83de4ae3c6454996e9f7bc6b283`: Code quality in 4m11s, Browser build in 2m26s, Browser QA lanes 1–4 in 12m24s, 11m15s, 17m56s, and 12m59s, and aggregate `qa` in 3s. Any later head, including a receipt-only documentation head, must pass its own hosted checks before it can be treated as exact-head evidence.
- CodeQL, Vercel, and CodeRabbit did not appear or run in the new repository; they remain later setup findings, not passed gates. Codex GitHub review completed only on the earlier `953e04c680d497851cdb6b6533b92de8f9b1c4f2` head and is not an exact-final-head review.
- Every future Browser QA acceptance cycle must create a new independent empty QA project, pass the non-production identity and fingerprint gates, apply exactly the 46 committed migrations, prove every application table empty, delete the cycle-owned project, and prove it absent. Production data must not be supplied, copied, read, or altered.
- Stop before Phase 3. The recommended next branch is `codex/atmoshaper-docs-consolidation`, but Phase 3 planning and execution require separate review and authorization and have not begun. No deployment, provider/domain cutover, production database change, runtime rebrand, legal cutover, or bootstrap-PR merge is authorized.

## Historical Snapshot Addendum — Hosted review round 24

- This addendum supersedes the round-23 current-receipt wording above without changing the historical line-addressed evidence. Hosted review round 24 is now historical. Five validated hosted findings were repaired: plain assignment can preserve scope-safe `createRequire(import.meta.url)` loader provenance; environment `in` checks distinguish exact static keys from hash-only dynamic or joined provenance; semantic CommonMark reference definitions provide owner-relative asset evidence; malformed CSS `url(...)` recovery is fully masked without hiding adjacent valid URLs; and `generated/` is recognized at repository root or deeper. Quality review ultimately returned PASS after 34 focused Round 24 checks. The full suite recorded 4,434 total, 4,431 passed, 3 host-dependent skips and zero failures; typecheck, lint and build passed. The informational Babel greater-than-500-KB note remained non-failing. The build skipped the production migration gate outside Vercel Production, generated 115 static pages, and retained the existing Anatomime poll-shedder initialization notice. Pre-document staged audits ran twice with exit 0, empty stderr, byte-identical output, shared inventory and `deletionAuthority: false`: dead code 1,584/211 (`b65ebdc62722c5b15c4fa48e49f9e9e50189f027f333e1ad1aaa9980764895b3`), dependency 2,873/21 (`75e280f7a660eb2dbbeca004e75a4f0e1a767307dd7e8035391bf0b7fa0dcbee`), asset 557/11,630 (`10ac976ea6b661b0784bde6c5466f56cc6b1f6952b0fb21693ad3ba5504af1b1`) and environment 587/252 (`a1479454e1d7a56218cbd5cb72f173b2fd45a0b3d0026a95448a580b827b43ed`). The pre-document inventory contained 1,932 files, 47,888,742 Git blob bytes, inventory SHA-256 `467f98da77b03130be36c7e9203940dcc75bc4ed8b8e2c4aad8035aedee02076`, CRLF output SHA-256 `189751af76d128a4b07faf215c8a5d795810d3b1c737e4215e3d26e6bb68bf17` and zero forbidden paths; brand remained zero missing/zero unclassified (`50a8f6f48d60f51c00edfd2b0a5005289e007e9939f18862beaa5e83667ecd2b`). These values became historical after tracked-document staging. Round 24 head `889ab55` is already pushed. Later hosted follow-up is recorded in round 25; merge remains separately authorized. No candidate deletion, provider mutation, merge or Phase 5 action occurred.

## Historical Snapshot Addendum — Hosted review round 26 integrated fix wave

- The integrated review initially returned CHANGES REQUIRED for compound-assignment callable/provenance promotion, sloppy CommonJS Annex-B block-function ownership, getter-before-setter destructuring evidence, and five documentation/index-status contradictions. All four findings are addressed; re-review returned SPEC PASS / QUALITY APPROVED with 58/58 focused checks.
- Only plain `=` preserves RHS callable/provenance. All 12 arithmetic/bitwise compound assignments avoid false exact evidence; logical assignments remain supported. Sloppy `.cjs` Annex-B block functions retain the outer callable binding, while strict `.cjs` and `.mjs` retain block scope. A paired setter preserves the preceding getter; later data/getter definitions still replace it in source order. Full cleanup passed 324/324; environment evidence remains 559 findings and 5,751 uncertainties with `deletionAuthority: false`; the source-cap maximum is 480 nonblank lines. The 291 confirmed static reads remain distinct from uncertainty.
- The final repository run initially failed only on the stale project-state date ceiling. The minimal test-only change in `tests/family-friends-server-workload.test.mjs` advanced that ceiling from `2026-09-11` to `2026-09-12`; the focused check passed 1/1, the file passed 15/15 and independent review returned PASS. The authoritative final `npm run test` exited 0: 4,543 total, 4,540 passed, 3 expected skips, zero failures, 365 suites and 785,574.5335 ms, with no OOM.
- Typecheck, lint and build passed on the same production code before the one-line test-date edit; the build generated 115 static pages with only standard informational notes. No candidate deletion, provider mutation, product-runtime change or Phase 5 action occurred.
- These five documentation records are included in the proposed commit. Commit, push and latest-head hosted review remain pending; the pushed PR head remains `9c6550f` until those coordinator actions occur. Existing audit hashes are historical because code, tests and documentation changed after those receipts. The final post-fix staged audit identity awaits the coordinator rerun and belongs only in the ignored SDD/current handoff, not these tracked documents. Merge remains separately authorized.

## Historical Snapshot Addendum — Hosted review round 26 before integrated fixes

The following preserves the earlier checkpoint; its test totals, index status
and audit hashes are historical, not the current integrated-fix receipt above.

- Round 26 code is accepted locally. It fixes class-static-block `var` ownership, compacts wide completion states so recursive finally replay completes without out-of-memory failure, preserves mixed process/CommonJS-loader provenance and mixed whole-environment value forwarding, and isolates exhausted deferred invocations from caller scope. These are conservative audit-only repairs; no candidate was deleted and no provider or product-runtime state changed. Every cleanup report retains `deletionAuthority: false`.
- Final current-code gates passed. `npm run test` recorded 4,540 total, 4,537 passed, 3 expected skips, zero failures and 554,265.5792 ms, with no OOM. Typecheck, lint and build passed; the build generated 115 static pages. The Babel greater-than-500-KB message and Anatomime poll-shedder initialization message were informational only.
- The accepted PRE-DOCUMENT staged-index audit receipt ran inventory, brand, dead-code, dependency, asset and environment commands twice. Every run exited 0 with empty standard error, valid byte-identical JSON, and identical raw/CRLF-normalized hashes in this run. Inventory was 1,947 files, 48,145,340 bytes, zero forbidden paths, and identity `06d007d1caeee21ab8b7ed9b7a4d6fe9c41f5e6fa0a274587675d607f92019a3`. Dead code was 1,629 findings/211 uncertainties; dependency 2,886/21; asset 557/11,630; environment 559/5,751; brand remained zero missing and zero unclassified.
- Environment evidence is precision-limited: 559 findings comprise 79 declarations, 189 missing declarations, 291 confirmed static reads and zero unread candidates; the separate 5,751 uncertainties are not confirmed reads. They comprise 94 computed accesses and 5,657 unproven aliases: 3,608 call-expansion-budget receipts, 2,017 property accesses, 17 element accesses and 15 spreads, with unproven scopes split runtime 2,852, tests 2,118 and tools 687. Invocation analysis permits 128 expansions per outer invocation and 64 nested levels; environment-only completion compaction joins matching completion kinds and target identities above 32 outcomes. Exhausted immediate calls conservatively widen reachable bindings; exhausted deferred inspection uses an isolated scope. All 15 formerly exact sites are accounted for by seven site-specific uncertainties and eight sites inside containing budget receipts. Independent 120/130/200-uncalled-arrow probes retain the exact environment read with no ordinary-object uncertainty and 0/3/73 budget receipts. This is bounded audit evidence, not exhaustive environment coverage or deletion authority.
- This receipt is historical once these tracked documents are staged because their blobs change the inventory identity. Exact post-document staged hashes belong in the ignored SDD handoff and current coordinator receipt, not recursively in these tracked documents. Documentation is updated and staged; coordinator code fixes, final verification, commit, push and latest-head hosted review remain pending. The pushed PR head remains `9c6550f` until the coordinator performs those steps. Merge and Phase 5 remain separately authorized.

## Historical Snapshot Addendum — Hosted review round 25

- This addendum supersedes the round-24 current-receipt wording above without changing historical line-addressed evidence. Round 24 head `889ab55` is pushed and historical; round 25 is the current staged, pre-push Phase 4 audit-only receipt. Four valid hosted findings were repaired: conditional and loop environment assignments join every normal-reaching path; deferred function-body alias writes are analyzed without changing declaration-time outer state; branch joins retain possible CommonJS-loader provenance; and loop assignment/incrementor proof includes every reaching `continue` path. Markdown inline/fenced-code destinations remain intentionally hash-only uncertainty, and CSS bad-URL recovery already follows CSS Syntax 4.3.15, so those two findings were rejected without behavior changes. Independent SPEC and QUALITY reviews passed. The accumulated focused Round 25 suite passed 46/46; the full suite recorded 4,480 total, 4,477 passed, 3 host-dependent skips and zero failures; typecheck, lint and the 115-route build passed, with the Babel greater-than-500-KB and existing Anatomime poll-shedder notices informational. Diff/source checks passed and the maximum maintained source size was 499 nonblank lines. Pre-document staged commands ran twice with exit 0, empty stderr, byte-identical output, shared inventory SHA-256 `e5228c0739194704755eabbce0896b0c6dd490c5421c64827e6ad9aff492436a` and `deletionAuthority: false`: dead 1,608/211 (raw `f15f7817bb2a2eed9fcd8af86cfea6853bdc40691dace3c2a1a71739353425f9`, CRLF `e12412da7923f04f772ce28bdc622e3a87a9cc257d5d8078b55f8e0ed3f5808c`), dependency 2,879/21 (raw `ca5113c8ab5f8dc8b4cc6955f4660378f78f89acf4e505841e10b38fd08140d4`, CRLF `6c6d5d7d4f5b70cfbdc1be2d526921b4b56a49e6a0fe868ea66de0f6679c1176`), asset 557/11,630 (raw `e5b1c9293a0eff98647bde6b111af82332a034abad2194e5797cd355b6dfbae0`, CRLF `e9f5046ba4a65fe271e31621e25e3604fd3cc1c8aca5b40d4b87c3e900067b52`) and environment 587/252 (raw `8a57296a932ac5066605b77b404c9a9c530dec1951d58e41ced946b138c7f0d3`, CRLF `2f7ab1fd70ca723b8ffa328fdc7c7ec0c6359d5fabe15d89da58c8e4364d0196`). The pre-document inventory was 1,940 files/48,002,713 bytes, raw output `f808ed400b25234f19c32bec5fa967a2ac741ee258df741b9b5589a41b0c5d07`, CRLF `1e71bdb69781109c5e33420f550575994d42a5b6e3feb7e3b334fe1e5eeb5763`, forbidden 0; brand was zero missing/zero unclassified (raw `fd1b776fe062af1215ef24b18f14fab558f9c13265f4f1d78aa483d74d361c84`, CRLF `50a8f6f48d60f51c00edfd2b0a5005289e007e9939f18862beaa5e83667ecd2b`). These pre-document values become historical after staging; exact final staged identity remains only in the ignored SDD handoff. Round 25 is not committed or pushed; latest-head hosted follow-up remains pending and merge separately authorized. No candidate deletion, provider mutation, merge or Phase 5 action occurred.
