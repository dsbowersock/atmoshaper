# AtmoShaper Project Log

## November 24 native Android Stage 1 integration checkpoint

Verify the Stage 1 issue graph and the exact `c7991eb` main commit. The approved local integration combines #86, #88, #89, #90 and #93 in [draft PR #136](https://github.com/dsbowersock/atmoshaper/pull/136). #89 currently includes the measured buffer-backed ambient loop and generated noise. The legacy regional player competes for Android audio focus, so its native buffer adaptation is being verified separately. #90 unlocks the explicit Downloads work in #91. #92 has already merged through #135.

The [#94 checkpoint](audits/2026-11-24-native-android-stage-1-acceptance.md) records individual installed evidence and remaining integrated gates. Move Home and the complementary tools suite to separate hosted emulators after two full runs lost the device during legacy navigation. Both new jobs passed on the mixer checkpoint.

The combined development APK passed the guarded v3 → v6 → v10 → v11 upgrade and played the retained Little Bells pack in airplane mode from the native UI. A separate release-variant emulator run recorded startup, warmed navigation and audio resource samples. The subsequent review corrections address Clock, timer, audio focus and Downloads lifecycle races. The acceptance record names both tested artifact digests and the corrective range.

## November 24 native timer hosted review follow-up

Address the four CodeRabbit findings on draft PR #134. Isolate malformed
optional templates and export valid Unicode labels within the Android length
limit. Retain a fresh completion cue when a duration or interval edit first
observes expiry. Verify that the two legacy storage sources have distinct
deadlines and their original records survive. Independent Standards and Spec
re-reviews found zero actionable issues.

The rebuilt APK passed Android lint and ten installed timer tests. Chromium
passed the focused transfer regression and all 14 native website contracts
passed. Investigate the three prior hosted failures separately in the
[timer plan](superpowers/plans/2026-11-24-native-timer.md#hosted-review-follow-up).

## November 24 independent native timer correction

Keep timer routing independent of the WebView export capability. Preserve
the visible packaged document when it opens Compose, and keep legacy setup
read failures retryable. Deliver the configured foreground completion cue
after a zero-duration adjustment commits. Share verified writes with Clock
and distinguish running cue deadlines from paused offsets while preserving
the stored representation. Check timer-control bounds in both runtimes.

The correction passed Android build and lint, ten installed tests at both
font scales, and the guarded v3 to v6 to v9 upgrade. Chromium passed all
11 enabled browser journeys. Independent Standards and Spec follow-ups
reported no remaining actionable findings.

## November 24 native Android timer implementation

Add Compose setup and running, paused and completed timer views for #85.
Start, pause, resume, adjustment and end commit through an atomic file.
Recover deadlines and skip missed cues on reopening. The isolated exporter
reads only timer state and settings from the packaged WebView stores.
Route packaged timer links to Compose while keeping the packaged music
visualizer and retaining the timer records used by older previews.

Independent standards and spec review identified missing setup durability,
the one-minute preset, foreground cues during adjustment, and earlier
interval progress after a backward clock change. The follow-up persists
valid setup edits, restores the preset, keeps adjustment in the timer
window, and imports consumed cue positions. Previously saved and last-used
setup choices also remain available locally.

CodeRabbit identified a due paused-cue transfer error and a cold packaged
link readiness race. The correction skips the overdue cue without losing
the paused timer and defers packaged navigation until the page has loaded.
The Android 35 emulator confirmed the v8-to-v9 transfer, process-stop
recovery, cold links, clean setup and all six timer tests at both scales.
The guarded v3-to-v6-to-v9 journey retained both downloaded files, the
deadline, settings and the planner draft. Offline music playback passed.

## November 24 native Clock swipe and acceptance follow-up

Reproduce low-contrast system icons after an immersive swipe on the guarded
Android 35 emulator. Use Android's standard reveal so the Clock receives
visible insets and restores its contrast bands. Add top and bottom swipe
regression coverage. Verify the timer's visible countdown against its
original deadline, exercise the exporter's public-access gate independently
of renderer compatibility, and attempt every fixture connection cleanup.

The swipe regression failed on the retained APK and passed on the correction.
Android build and lint, the guarded upgrade, and all seven installed tests
at both text scales passed. A Home-to-WebView timeout also reproduced on
the retained APK. Full details remain in the implementation plan.

## November 24 native Clock independent review corrections

Protect Clock digits and the system bars on mixed and light backgrounds.
Keep the digital readout ordered under RTL and restore proportional AM/PM.
Use canonical public background access during packaging and share native
appearance ranges between the settings editor and decoder. The guarded
upgrade now checks the timer and deadline from **Open timer** and reads each
installed version from Android.

The corrected Android build and lint, guarded v3 → v6 → v8 upgrade, and
six installed-app tests at both text scales passed on the synthetic
emulator. The implementation plan records the focused Windows and visual
results and the remaining acceptance gates.

## November 24 native Clock and repeatable fullscreen

Build issue #84 on the reviewed native Home head `ea3cbce`. Introduce a Compose
Clock with the existing bold DSEG faces, a bounded leading AM/PM inset, native
fullscreen ownership and a separate verified appearance file. The one-time
transfer reads only the packaged Clock settings generations and leaves legacy
state, including the timer deadline, with the existing host.

Android build and lint passed. All five installed-app tests passed at 100%
and 160% text scale on the synthetic emulator. The guarded v3 → v6 → v8
update retained the two download byte digests, settings, timer deadline and
planner draft. Physical Galaxy S24 Ultra acceptance and the rate-limited final
CodeRabbit delta remain open.

## November 23 native Home launcher and Back correction

On the guarded Android 35 emulator, a cold legacy tool link followed by the
launcher brought the Java task forward on `57d4faf`. With Home opened above the
Java task, **Open previous tools** removed Home and Back returned to Android's
launcher. Give Compose Home its own task affinity while preserving the legacy
host's intent filters and reuse behavior.

The same installed-app test APK failed the deep-link regression on the original
app APK and passed both journeys after the in-place update. The category
journey visits all six destinations and uses both Back controls. Android lint,
the app and instrumentation builds, preview signer comparison, and 40 focused
native/offline checks passed.

The standards follow-up packages the canonical public name with the wordmark,
records the Android CI lane, shares the preview verification task with CI, and
uses one documented read-only IndexedDB helper in the upgrade fixture. The
corrected preview passed Android build and lint, TypeScript, changed-file lint,
the 160-case native regression suite and the 40 focused contract/offline cases.
The v3 → v6 → v7 run retained both downloads byte-for-byte, the saved settings,
timer deadline and planner draft. It also passed offline playback and the PDF
dialog. The preview signer matched across all three APKs. CodeRabbit completed
review of all ten correction paths with zero findings.
Both installed-app journeys passed at 100% and 160% text scale. The Home
capture shows all launcher controls clear of the system bars.

## November 23 native Home enters the Android preview

Implement [#83](https://github.com/dsbowersock/atmoshaper/issues/83) in a
separate issue worktree based on `origin/main`. Pin the Compose toolchain in the
existing Android application module, add native launcher/build instrumentation
and retain the Java host as the previous-tools entry. Use the packaged
wordmark, Inter and the launcher icon and button treatments from the website.
Advance the development APK to v7 with its existing package and signer.

The guarded upgrade fixture installs v3 and v6, adds a representative planner
draft through the v6 interface, and installs v7 in place. It checks the native
launcher, Back from previous tools, the saved draft, settings, timer deadline
and download bytes. A separate Android CI job builds, lints and runs the native
Home instrumentation on a fresh emulator.

Local verification passed Android build and lint, preview signer comparison,
native Home instrumentation, the serial-guarded upgrade journey, TypeScript and
the focused native regression, offline core and offline media suites. The upgrade
restored both downloads byte-for-byte and reopened the saved draft, with offline
playback, fullscreen Back and the PDF dialog covered in the previous tools.
The full repository suite returned 5,942 passes, 15 failures, one cancellation
and seven skips. The non-passing cases came from the browser and Calendar
harnesses and donation checkout.

Codex Standards and Spec reviews cleared the corrected candidate. CodeRabbit
completed the application review and the final test-only follow-up with zero
findings. The two Inter font binaries were inspected locally for their source,
weights and license. The synthetic emulator was stopped after verification.

## November 23 corrected Preview passes; final mobile drawer issue held locally

After the owner approves `b2053cb`, renew the separate Vercel CLI session and
complete fresh read-only preflight. Push once to existing PR #81, verify its
protected Preview and pass 21 anonymous entry pages plus eight Home/Clock browser
journeys. Attach fixes/test evidence to all eight earlier threads and resolve
them. Request the current-head Codex review. Its one supported comment identifies
the native Link adapter omitting the shared drawer-closing navigation callback.
Hold before any merge, Production build or promotion. Public `5758fcb` stays live.

Reproduce the actual old asset-tree behavior, then commit focused correction
`2b06d64`, finalized by `d61de9a`: consume/invoke cancellable `onNavigate`, preserve ordinary link actions,
and add runtime plus actual drawer/focus regressions. Advance only the matching
development APK version. All 14 focused cases and ten shared browser cases pass;
lint/TypeScript and Android build/lint/signature pass. Independent Codex Standards
and Spec reviews report zero issues at the final application head. CodeRabbit
completes the four-file review and raises one null-download edge case, corrected
with actual React markup/routing coverage. All seven hosted checks also pass for
the previously approved `b2053cb`. Final `8f603319` normal-APK emulator acceptance
passes the upgrade/retained-downloads/settings/deadline, airplane-mode playback,
fullscreen Back and actual PDF-dialog journey with zero failures/skips. Stop
only the exact synthetic test emulator, preserving its data and owner devices.
Record the actual physical/connected-origin gates and
the [new amendment](superpowers/plans/2026-11-23-android-navigation-correction-publication.md)
before requesting approval for the final corrected head. Keep earlier installers,
provider settings, signing authority and real account/calendar/clinical data.

## November 23 approved Android release reaches hosted review; corrections held locally

Admit the owner-approved `57e4957` publication after fresh provider/source
preflight. Push once and open PR #81. Confirm protected Preview and existing
manual public promotion. Keep all 90 Production setting metadata entries,
the public background authority, prior READY release and existing aliases.
Do not merge or build Production after the hosted reviews identify corrections.

Codex raises two timer migration issues. CodeRabbit's automatic skip is followed
by an explicit full-review request and completed 81-path selection, with seven
comments. Consolidate the duplicate overdue-cue issue. Fix interval Off,
overdue/original-phase/paused scheduling, connected navigation markers,
startup-access readiness after Forget, gain before playback and inactive wake
locks. Strengthen saved-state failure coverage and document the retained upgrade
baseline. Actual browser execution also reveals that immersive sidebar CSS hides
the restored-audio alert's aside element; use an alert container that stays
visible on a direct timer launch. Do not change the global sidebar policy.

The first hosted full unit run records 5,945 passes, two stale variable-name
assertions and eight optional skips. Correct those two fixtures and pass all
14 cases; preserve their Music/background contracts. The browser build and all
four hosted browser lanes pass. Freeze local correction `6f8c107`; nine shared
browser cases, 13 focused contracts/runtime cases and 111 Clock cases pass.
Build version 0.4.1 with the existing certificate and prepare the distinct
`5d6c467f` installer. The complete emulator case passes: upgrade from version 3,
retained packs/settings/deadline, actual offline audio across breathing,
fullscreen Back and native PDF save dialog/cancel. Stop only the named task
emulator and retain its data. Codex inspects the grouped correction. After fixing
the isolated review clone's missing base branch and a Windows/WSL quoting issue,
the existing authenticated CodeRabbit CLI completes all 16 correction paths with
zero issues; failed setup attempts are not counted. Full lint and TypeScript pass.
Only receipt documentation follows the application freeze; no new APK build.
The approved publication is held for its required changed-candidate amendment;
no merge, Production build, promotion, provider setting or real account write.

## November 23 shared Android UI reviewed and local APK acceptance complete

Freeze application source at `a9ddca1` and the normal signed preview APK whose
SHA-256 starts `af746820`. Reuse the website's actual screens and keep connected
account/calendar/practice destinations inside a browser-owned trusted app window.
Keep the previous application/signing identity, device stores and background
authority. Online Play can use temporary verified bytes without implicitly saving
a download; offline access still requires complete saved packs.

Complete Codex inspection and four substantive CodeRabbit ranges, matching every
changed application path against Git's file lists. Resolve supported timer-audio,
document recovery and ambient-cancellation issues; refute speculative questions
against source and execution. Add the controlled same-ID stale-rejection check;
all 39 source/controller cases pass. Seven shared browser cases, responsive
previews, source lint/type checking and normal APK build/signature pass.

Consolidate Android fixture diagnostics: the system immersive-mode tutorial owns
Back until acknowledged, Clock controls intentionally hide, cold shared chunks
need mobile waits, and the fixed player can cover an in-viewport report button.
Remove speculative native fullscreen changes and correct user-input handling in
the synthetic fixture. Observe retained downloads/settings/deadline, actual
offline saved music across breathing, fullscreen Back and the native PDF dialog/
cancel tail on the unchanged APK. The final combined case passes all steps with
no skips. Stop only the task-created emulator after verifying its exact name.

After the stated free-review wait, the existing CLI completes the fixture-only
`a9ddca1..a2a24e1` pass. Refute its one conditional favorite-overwrite question:
the old app uses its separate offline player and never initializes the shared
Music preference store; the full run demonstrates the seeded favorite remains
available after upgrade. No application change is needed. Complete the local
review/acceptance record and prepare a distinct matching upgrade APK. Website
origin validation and the physical S24 check remain post-publication gates. No
provider/billing change, publication, real account/clinical write or physical-
phone command is performed. The publication plan remains unapproved.

## November 22 Android shares the website UI; local verification underway

Respond to the owner's installed-APK design mismatch by reusing the actual Home,
sidebar/main bar, Chimer, breathing, Music and planner components. The owner
chooses connected pages inside the app. Prepare browser-owned Trusted Web Activity
integration without transferring browser cookies, credentials or private records.
Keep the application/signing identity, media store and receipt authority. Import
the old timer/settings read-only into a separate atomic shared-screen snapshot;
failed initial reads cannot overwrite earlier data. Add native save/print and
fullscreen ports, bounded to packaged content and user-visible Android dialogs.

Initial shared-screen browser, storage/deadline and PDF checks pass. A shared Music
playback check identifies remaining online carrier/notification artwork bindings;
prepare packaged bindings. Continue fresh-emulator upgrade/media acceptance and
Codex/CodeRabbit review. Do not publish or hand off this candidate as complete yet.
The previous release remains live; its completed approval window is not reused.

## November 22 offline Android release published

Complete the approved PR #80 amendment: push `92585d9`, obtain fresh hosted
Codex/CodeRabbit review and all checks, then close three minor documentation
comments in receipt-only `8a6d096`. All 25 threads are resolved. Seven CI checks
pass on that head and merged `5758fcb`. One automatic Production build passes
existing gates and both Sentry uploads; actual script/map IDs match. Stage and
publicly verify the same artifact (14 pages, eight journeys, two fonts and issuer
denials). Promote once, retain `0eb02e0` for rollback, and preserve all settings.

Verify the matching APK's single owner backgrounds-only receipt from the live
issuer in the fixed task emulator, including durable access after airplane mode
and process restart. Close within the approved window without another key,
provider setting, payment, mail, migration or clinical/account-preference write.
Record the [full receipt](audits/2026-11-22-offline-android-publication.md); physical S24 and documented native
limitations remain. Save this local documentation closeout without redeploying.
## November 22 approved corrected head passes hosted review and CI

The owner explicitly approves `92585d9` and continuation of the guarded release.
Fresh preflight preserves all 90 setting metadata entries, the signing authority,
manual promotion, aliases and READY `0eb02e0` rollback. Push that candidate once
to existing PR #80. Its protected Preview passes 14 entry pages/eight journeys;
all seven hosted CI checks pass. Codex reviews the exact head with no findings.
Resolve the 22 original supported threads with recorded fixes/dispositions.

One bounded hosted CodeRabbit correction review completes across all 34 changed
paths. It reports three minor status-document issues and no new application
issue. Prepare this receipt-only closeout under the approved amendment's express
documentation-correction allowance. Keep application/trust source `15b7f55`, the
accepted APK and the existing admission deadline; recheck CI/Preview on the new
documentation head before merge. No new source review loop, key/settings change,
Production build or real owner receipt is performed at this checkpoint.

## November 22 full hosted review consolidated into one correction group

The explicitly requested hosted CodeRabbit full pass completes on `5f76890`,
processing 77 text paths and posting 21 comments. It independently confirms the
startup overwrite and identifies an abandoned generative Transport repeat.
Prepare one bounded group of supported corrections and original-head CI fixes;
record each in the [disposition receipt](audits/2026-11-22-offline-hosted-review-corrections.md).
The narrower CLI startup delta `5f76890..1ef8453` completes with zero issues;
the subsequent grouped delta `1ef8453..15b7f55` also completes, covering all 30
changed text paths. Its two test-switch questions are refuted by matching runner/
guard source and real combined Android execution with neither suite skipped.
Focused units/regressions, four browser cases, source lint/full TypeScript and
the matching normal APK build/signature/both serial emulator suites pass.
The tested APK hash matches all three build/media/Core receipts. Codex inspects
the correction diff; current-head hosted review/CI and one new source/publication
amendment remain before updating PR #80. Keep the configured signing authority and all 90 setting
metadata entries; make no additional provider, payment, email or database write.

## November 22 release PR review catches a startup overwrite

Push approved public binding `5f76890`, open PR #80 and obtain its READY protected
Preview. The narrow CodeRabbit binding review completes with two stale-status
documentation issues and a request for the planned real issuer/native key check.
Request one full hosted CodeRabbit review after the automatic low-star skip;
the app acknowledges the trigger. Hosted Codex independently reports a Core
fallback-autosave overwrite and provides a reproduction. Hold publication.

Add a real synthetic IndexedDB/browser regression. It fails before the fix with
the saved timer/color replaced after a transient initial open failure. Prepare
a mount-level autosave guard and truthful unsaved-session/timer copy. The same
test passes and confirms restoration after reopening. Broader local validation
and bounded delta review follow before any changed-candidate publication request.
The original PR checks/reviews cover `5f76890`, not this unpushed correction.
Keep the working signing settings; no new key, merge or promotion is attempted.
See the [local correction receipt](audits/2026-11-22-offline-startup-recovery.md).

## November 22 approved replacement-key upload succeeds

The owner approves the prepared recovery amendment. Recheck the live/source,
settings, aliases, existing credential and rollback baseline and open its fresh
120-minute admission. Generate one replacement key and make one explicit JSON
HTTPS upload without automatic retry. Read-back verifies all three settings
are Production-only, the private key is sensitive, and the original 87 setting
metadata entries are unchanged. Keep only the matching public verifier in source
and pass signature/install/challenge self-checks. No private key file is written.

Continue the already approved release under the recorded scope. The previous
public release is still active; no real receipt or phone installation occurs at
this checkpoint. See the
[activation receipt](audits/2026-11-22-offline-access-activation.md).

## November 22 approved offline activation attempt and bounded recovery

The owner approves the prepared activation plan. Recheck source `6490c75`, live
`0eb02e0`, all 87 settings, 48 aliases, manual promotion, existing protection and
the READY rollback. The prior explicit Vercel profile is valid; the CLI default
profile's logged-out state does not justify a new sign-in or account change.

Generate one authority in an isolated process, save only its public verifier and
attempt one bulk settings upload. The CLI exits unsuccessfully. Withhold raw
private-bearing output; provider HTTP status is not retained. Read-back confirms
all three requested names absent and the existing 87 settings unchanged. The
private key is discarded on exit. Preserve the discarded public key in ignored
operator evidence, restore source's verifier to `[]`, and stop rather than
regenerating or replaying the upload. No push, PR, deployment, promotion, account
receipt or other live-data/provider effect occurs.

Inspect the installed CLI and reproduce its array-body encoding with synthetic
Request objects and zero network calls. Prepare direct explicit-JSON HTTPS with
no automatic retry. Its existing-profile read-only project check passes; settings,
site, empty verifier and rollback still match. Prepare the
[one replacement-key amendment](superpowers/plans/2026-11-22-offline-activation-recovery.md)
for approval, preserving the already authorized publication scope and unchanged
application logic. No second key is generated under the first authorization.

## November 22 offline media and background verification closeout

Freeze application source at `194e385`. Complete the initial CodeRabbit range
`0eb02e0..c1d0def`, grouped corrections `c1d0def..2e0b90d`, and the final narrow
`2e0b90d..194e385` range after an actual built-page smoke exposes a missing
scoped SessionProvider. Correct receipt/Forget/Refresh races and blocked-open
recovery with real browser reproductions. Completed receipts cover every changed
text path in those transitions; publisher/license/hash evidence covers the two
new texture binaries. Retain one final minor retry-before-close migration edge
as an explicit follow-up; first installs use v2. Avoid another automatic loop.

All 326 focused/regression cases, three concurrent browser suites, focused lint,
ordinary type checking, inert-provider Next build and built-page/issuer HTTP
checks pass. The final normal debug APK passes actual airplane-mode media restart
and fresh Core persistence/rotation/two-note-chime acceptance; all packaged
assets and build/media/Core hashes match. See the
[verification receipt](audits/2026-11-22-offline-audio-backgrounds.md).

The owner explicitly selects verified paid-through dates, including the paid
annual period, and no scheduled expiry for active individual ownership. Public
verifier keys remain empty; no real premium receipt has been issued. Prepare
one exact signing/provider/release/APK/owner-check activation plan for approval.
No push, merge, deployment, provider, hosted database/payment/email or account
preference write occurs. Physical S24 and broader native/lifecycle gates remain.

## November 22 downloaded audio and offline background access implementation

Implement the owner's expanded native scope: explicit complete station/sound
downloads, strict durable pack saves, size/hash checks, cancellation/removal,
local-only generation and ambient scheduler playback, with generated noise.
Preserve existing public catalogs, sample IDs, source sequencing and rights.
Metadata-only reads verify all 57 station dependency closures. Actual offline
browser playback verifies Little Bells and one existing ambient category.

Bundle all 84 enabled background renderers and the existing globe image bytes.
Use the existing palette/default-geometry contracts, including required DNA/
Twisted Cubes inputs found by the all-renderer acceptance. Add signed background
capabilities derived from canonical feature provenance and active ownership;
subscriptions expire at their verified finite date and individual ownership
has no scheduled expiry. Synthetic acceptance covers expiry, revocation and
replay without touching any real account. Normal builds contain no synthetic
authority; live signing keys/configuration and publication remain unapproved.

Prepare Android's narrow public-media HTTP adapter and external-browser receipt
handoff. No account cookies/remote HTML/generic script bridge is introduced.
Final integrated checks, exact-APK emulator acceptance and bounded source review
are in progress. See the
[plan](superpowers/plans/2026-11-22-offline-audio-background-access.md).

## November 22 offline native core and actual airplane-mode acceptance

Implement the owner's priority Clock/timer/breathing/background slice with a
locally bundled shared client and an Android asset loader. Remove the remote
startup and Internet permission. Preserve the web UI contracts, stable background
IDs, fonts/license, account boundaries and browser records; retain the three
canonically free backgrounds without assuming paid ownership.

Share the procedural gradient surface and actual two-tone chime with the website.
Browser acceptance discovers that the repository notification MP3 is a placeholder;
use the existing synthesis instead. Actual emulator process-stop testing exposes
an unflushed localStorage save; replace native preferences with serialized strict
IndexedDB commits and match save acknowledgement to the displayed snapshot.
Visual acceptance corrects a landscape status overlap. Keep emulator cold-start/
commit waits bounded to observed latency; actual S24 acceptance remains separate.

All 262 focused/regression cases, three fresh network-disabled browser journeys,
focused lint/type checking and Android lint/build pass. Verify the exact final
APK's assets, no Internet permission, fresh airplane-mode launch, all four tools,
sound synthesis and real process-stop restore on the empty Android emulator.
The owner correctly distinguishes offline Generative.fm generation from live
broadcasts; document complete station packs as the next audio boundary. No
station player, paid access or production/provider/DB operation is claimed.
See the [verification receipt](audits/2026-11-22-offline-android-core.md).

## November 22 offline use clarified before Android installation

The owner asks whether the browser-backed APK needs internet and requests offline
Clock, backgrounds and as much of the toolset as possible. Inspect the actual
launcher, service worker, registration and existing PWA test. Confirm the current
APK has no bundled tool payload and web caching has narrower coverage than the
requested app. Do not equate local data or a successful build with offline use.

Record a locally bundled shared-core direction, downloadable media, preservation
of existing browser records and owner boundaries, and fresh-install/restart/
airplane-mode acceptance. Keep sign-in, authoritative shared scheduling and
financial actions online. No runtime/app/provider/storage change is made while
clarifying this architecture requirement. See the
[offline implementation plan](superpowers/plans/2026-11-22-offline-android-core.md).

## November 22 practice payment workflows and Android foundation

Record the owner's Stripe/Square appointment/deposit/prepayment/reviewed-fee
scope, new-merchant onboarding and whole-platform Android expansion. Clarify
that his own contractor business is the sole pilot; the salon remains outside.
Check current official provider/native documentation and complete the Stripe
implementation planning guide read-only, without financial/provider mutation.

Isolate source from current public `0eb02e0`. Add integer-cents payment rules,
scoped offline processor contracts and fictional mobile setup/booking/collection/
fee review. All 20 focused cases and eight Chromium journeys pass, including
consent invalidation on edits, prior-payment credit and processor-change reset.
Correct the phone notice/button overlap after actual screenshot inspection.
Focused lint, route type generation and the ordinary full type check pass.

After explicit tool/license approval, verify official archive SHA-256 values
and install the JDK/Gradle/Android SDK under ignored project output. Build the
whole-platform browser-backed Android launcher with lint, inspect its actual
debug signature/package/permissions and exclude native backup/transfer storage.
No SDK payment capability or physical device success is claimed. The local
receipt distinguishes all unfinished durable/provider/native/service/review/
publication gates. Public traffic and existing services are unchanged. See the
[verification receipt](audits/2026-11-22-practice-payments-android-foundation.md).

## November 22 Home/setup/Clock reviewed release published

Completed all source review amendments through `aaf422f`, including late
completion navigation after unmount. Independent Codex closure and three
completed CodeRabbit CLI correction ranges follow the initial actual full app
review; no skip/quota response is counted as coverage. All ten review threads
are resolved. All seven PR checks pass, including the full zero-failure suite.

Took fresh service admission at 18:18 UTC, merged PR #79 once as `0eb02e0`, and
verified its tree is identical to the reviewed source. The existing Git integration
builds one staged Production artifact with unchanged settings. Read-only live
readiness gates, TypeScript, both Sentry uploads and the actual script/map debug
ID pair pass. Wait for all seven merged-source checks before promotion.

Promoted the same artifact once; staged and public acceptance each verified 13
routes, three Home viewport journeys, five Clock cases, both fonts and actual
anonymous session behavior. Public script bytes/debug ID match the staged build.
All six public mappings are correct; 41 unrelated baseline aliases and 87
Production setting metadata entries remain unchanged. Keep READY `22010d0` for
rollback; none is needed. No real account/payment/mail/legal/record write occurs.
See the [publication receipt](audits/2026-11-22-home-onboarding-clock-publication.md).
Closed with local documentation only, without triggering another app build.

## November 22 Home/setup/Clock initial reviews and grouped corrections

The owner requests Codex and CodeRabbit review followed by publication. Preserve
the local source commit and prepare PR #79 on current public main with the same
tree. Hosted and separate read-only Codex reviews complete; the standalone CLI
environment failure is excluded. Manually request the existing CodeRabbit app's
full review after its automatic skip. Its completed full-range review selects
all 79 text/source paths and records eight actionable comments.

Group the supported corrections, reproduce the Next Link save/leave bug with
the actual handler, and protect current setup answers from ordinary sync replay.
Preserve registration return tasks, prevent late navigation after unmount and
restore Home keyboard focus. Correct obsolete contracts and visually verify
only the intended Home wordmark baselines on Linux and Windows. Full corrected
head coverage/checks and publication gates remain pending; no public promotion
has occurred. See the [review receipt](audits/2026-11-22-home-onboarding-clock-review.md).

## November 22 Clock AM/PM placement and digital lettering

The owner selects the trailing AM/PM on an enlarged clock and requests moving it
into the spare leading-hour space. They also request digital lettering. Extract
the shared current-time renderer, retain stable hour cells, hide the 12-hour
leading zero and inset the label without adding row width. Preserve the visible
leading 1, seconds, 24-hour/localized/fallback-font behavior and sizing safety.

Use the same author's unmodified DSEG14 Modern Bold alphabet companion for a
recognizable M beside unchanged DSEG7 Modern Bold numerals. Compare the original
release notice byte-for-byte and retain its binary hash/notice. All 111 focused
checks and 238 existing Clock regressions pass; route type generation and full
type checking pass. Local actual-route acceptance verifies enlargement and
trailing-digit geometry. See the [receipt](audits/2026-11-22-clock-meridiem.md).
No publication or live service/account change is included.

## November 21 optional setup, saved drafts and continuation

The owner requests a one-time setup choice at signup, permanent re-entry from
Account settings, and independent editing without reminders. Their follow-up
clarifies that unfinished guided setup should retain its progress and offer
continuation on return. Seed invitations only in actual new password/Google
account transactions; keep existing verification, consent and linking rules.
Return ordinary sign-ins Home/their safe callback instead of always onboarding.

Claim invitations through owner-checked POST actions under the preference owner
lock, keeping GET/prefetch read-only. Add separate bounded account drafts with
serial autosave, shortcut-reorder capture and acknowledgement before explicit
Leave/Finish. Prefill saved answers, offer one continuation on Home or sign-in,
and preserve progress after declining. Generic preference sync cannot reset
this lifecycle or overwrite the draft. Revision checks reject stale saves and
late writes after completion. Account settings retains manual setup and direct
profile/credentials/preferences controls.

Local auth/setup checks pass 167 cases and home regressions pass all 94. Browser
fixtures use the actual UI/CSS with fictional owners and no live services;
responsive choices, restore/reorder, continuation, failures and stale/unmounted
effects are exercised. Final focused lint and the ordinary full type check pass;
the embedded browser also verifies restoration and continuation. See the
[verification receipt](audits/2026-11-21-optional-onboarding.md). Source remains
local on the existing home dashboard branch, with review/release gates pending.

## November 21 Practice tools launcher color

The owner requests the regular orange style for the home-page Practice tools
button. Remove its teal setup tone so the existing default orange material
applies. Its category sheet and other launcher styles are unchanged. Local only.

## November 21 home header wordmark

The owner selects the home-page title and requests the existing wordmark.
Render the canonical brand PNG at a responsive width with its original aspect
ratio; retain one accessible heading through visually hidden product text and
decorative image alt text. No artwork, identity registry or app-bar changes.
Verify the actual loaded asset beside Sign in on the phone preview and update
the earlier text-only browser contracts. Streamed ownership checks pass, and
the real-component responsive/SSR journey passes after supplying Next's client
environment defaults to its isolated bundler. The historical Phase 6 home crop
baselines intentionally describe the earlier design and require explicit
platform-specific refresh before a later Phase 6 screenshot run. Save the
current proof as `output/home-dashboard/home-wordmark.jpg`; no publication.

## November 21 Clock route types and preview warning resolved locally

The owner asks what the Clock check means, reports a home hydration warning,
then explicitly requests the Clock correction. Move the unchanged Clock/Chimer
screen into `app/chimer/chimer-screen.tsx`; `/chimer`, `/clock` and the
production-disabled `/dev/clock` use thin route entry points. Preview options
remain ordinary screen inputs instead of unsupported Next page inputs. The
extracted screen matches the base implementation exactly after line-ending
normalization. Existing source-level regressions follow its new location.

Generate actual Next route validators with `npm run typegen`, then run the
ordinary full `npm run typecheck`: both pass, without the earlier source-only
configuration. All 238 related checks and Clock lint pass. Add an actual SSR
hydration case that delays the browser bundle, observes disabled pre-hydration
controls, then verifies returning state and a working directory without React
warnings. All 94 home checks and focused lint pass.

The user's warning references the older `useDashboard` client while the server
already emits the newer hydration guard. Confirm that the server's emitted
bundle contains the new handler and guard. Ordinary reload retains the mixed
version. Restart the owned preview and open the same server at
http://localhost:3025/; verify enabled controls, directory open/close and no
current error overlay. Do not clear browser storage, vaults, settings or records.
The screenshot is `output/home-dashboard/preview-hydration-fixed.jpg`. This
remains local work, with no provider change, remote push or deployment.

## November 21 home dashboard local redesign

The owner asks for an app-like mobile/tablet home screen and chooses balanced
emphasis across music, clock, wellness, calendar, study and practice. Implement
six default launchers, a concise introduction, returning mode, category sheets
and a filtered full directory. Preserve explicit shortcut order, current button
materials, shell/player, metadata and all destination authorization. Home reads
preferences and permissions only; browser state retains an intro-dismissal
boolean without account identity or private records.

Add keyboard focus restoration, native sheet descriptions, 44 px sheet close
target and a first-tap hydration guard. Replace obsolete home-hero tests with
actual component/geometry/state tests and current public-route assertions.
Prepare a restartable loopback preview isolated from live service credentials.
Record the unchanged Clock dev-validator conflict separately from passing
source validation. See the [home dashboard receipt](audits/2026-11-21-home-dashboard.md).
This work remains local for visual review; publication and source reviews are
not claimed complete.

## November 21 reviewed fixes published at 6:10 p.m. Eastern

CodeRabbit's actual five-path `7da07ef..f243ff4` follow-up completes with no
actionable findings; current-source Codex has none. All 14 threads are resolved,
all seven PR checks pass, and the mode/type-aware proof verifies complete state
chains for all 43 changed code/test paths. Fresh unchanged settings/routing and
protected acceptance admit one merge of PR #78 as `22010d0`; its tree matches
reviewed `f243ff4` exactly.

One automatic Production build passes live migration/all-payments checks and
both Sentry uploads. Actual Sentry UI readback matches the emitted script/map
debug ID to the merged release. Staged and public acceptance each pass 23 routes,
12 native journeys and both synthetic PDF downloads. Wait for all seven merged-
source CI jobs, then promote the same READY artifact once. Final public bytes,
canonical redirect, six public mappings, 40 unrelated mappings and 87 unchanged
Production setting metadata entries verify. The prior READY release is retained;
no rollback or additional live data/payment/email/provider-setting change occurs.

Save the [publication receipt](audits/2026-11-21-reviewed-fixes-publication.md)
and a local documentation-only closeout. Do not push that receipt to create
another build. NAS backup-script activation remains a separate operation.

## November 21 abandoned Calendar request lifetime

The included CodeRabbit follow-up completes its full 13-path correction range
at `7da07ef` and finds one minor supported stale-intent issue (4655155872).
Reproduce Today → Previous with the first response abandoned, commit only the
latest response, then explicitly return to Today. The old request history
incorrectly leaves October displayed. Replace that history with one active
Next-transition owner; retain existing date/source guards for its response.
The new regression and all existing native sequences pass, as do 120 Calendar
layer cases, focused lint and TypeScript. Fresh current-source review/CI gates
remain; no merge, public traffic or provider setting changes yet.

## November 21 Calendar source-transition follow-up

Codex review at `99a4da6` identifies a source-view remount that discards the
new date-intent guard. Bind remounting to account/practice ownership, preserve
newer date/source intents across automatic replies, and still apply explicit
route changes. Share the page's actual ownership key with the native fixture;
verify the page key is stable across source changes and different across owners
or practices. All 120 Calendar layer checks and native phone/desktop acceptance
pass, including the delayed Practice → Together sequence. Fresh included
CodeRabbit coverage will include both follow-up commits. No public or provider
change occurs during this amendment.

## November 21 completed correction review and focused follow-up

The included CodeRabbit review completes at `60bdc9e` across 22 paths, raising
three supported issues and a latent minor context fallback. Correct request-
owned Calendar date intent, reject sentinel-detected truncated snapshots, and
cancel only the confirmation read through response-body consumption. Preserve
normal SDK transport and committed-create handling. The browser fixture now
replies with the real route date as well as its actual read window. Verify a
delayed reply after a newer date choice, exactly 500 versus 501 event/busy rows,
and a trickling HTTP body with a concurrent unaffected SDK request. All 165
Stripe, 23 page-read, five feelings lifecycle and native phone/desktop Calendar
checks pass. The previous source's seven CI jobs pass; fresh current-source
review/CI/publication gates remain. This does not change public traffic, provider
settings, private records, live payments or NAS installation.

## November 21 Calendar month-end review amendment

Codex review at `9e0c7df` identifies a month-end replacement range that can stay
hidden behind loading. Share the bounded window rule between server reads and
the native fixture, expand the lookback to cover month padding, and verify
actual replacement windows plus January 31. All 33 applicable Calendar checks,
focused lint and TypeScript pass. The attempted CodeRabbit correction review
is OSS-rate-limited, not completed; wait for its included reset before release.
Previously verified Wellness/payment/audit source is unchanged. No public
traffic or provider setting moves during this amendment.

## November 21 release PR #78 grouped correction

The requested full PR review completes across 57 paths at `bf58dca`, raising
five code issues and three stale audit passages; the independent Codex pass
raises none. Correct Calendar range refresh/loading, duplicate-word feeling
context, absolute Checkout confirmation timeout, shallow-history refusal and
mode/type review identities. Align old handoffs with their completed reviews.
Focused checks pass 112 unit and 29 Calendar/controller/native-browser cases;
the frozen mode-aware inventory retains all 703 reviewed histories and zero
gaps. See the [register](audits/2026-11-21-release-review-corrections.md).
Full lint/TypeScript pass. Diagnose the initial hosted failures before retry:
align two Exercise tests with native browser validation and await mobile-drawer
closure before reopening; corrected isolated phone/desktop journeys pass.
Current-head review/CI and staged/public acceptance still precede publication;
public `d7e30e0`, provider settings and local/private records remain preserved.

## November 21 owner authorizes reviewed-fixes publication

Prepare one release branch/PR from `6c7a75d`, carrying every reviewed correction
and its complete range/path receipts. Public source remains `d7e30e0`. Require
current hosted review/CI, fresh unchanged settings/routing, protected acceptance,
staged migration/payment/Sentry proof and same-artifact public verification.
No provider setting, new credential, schema, live payment/mail/clinical/Calendar
write or NAS activation is included. Record live outcomes only after readback.

## November 21 four-issue follow-up verified and closed

The actual 16-path review at `dfe4198` completes with one minor fixture-reader
environment issue. Reproduce it with four failing child cases, propagate the
sanitized environment through all reader helpers, and verify actual execution
and byte-for-byte preservation of the caller's index. All seven proof cases,
163 payment checks, focused lint and TypeScript pass. Public inventory remains
703 reviewed changed code/test histories, zero gaps, with all 1,017 existing
baseline/coverage decisions unchanged.

The final actual six-path review at `1c9a8f1` completes with zero issues and
exact tree/path evidence. F1–F4 and the extra fixture-reader issue are closed.
Save the [verification receipt](audits/2026-11-21-four-review-issues.md) in a
documentation-only closeout; no additional automatic review cycle occurs.
Application build receipts remain valid for unchanged application source.
No push, merge, deployment, provider, database, NAS, payment or email occurs;
ordinary independent review/CI/publication and NAS activation remain separate.

## November 21 owner requests resolution of F1–F4

Continue from local `b316461`, preserving the closed campaign's receipts and
reviewed `07a3dcd` baseline. Reproduce the remaining nested-PR and literal-name
failures with real synthetic Git objects; keep a staged unrelated index entry
unchanged through actual batch preparation. Correct baseline selection and use
NUL-framed default tree records, exact diff names and literal preparation paths.
All six proof checks, 163 Stripe checks, audit lint and TypeScript pass. The
fresh whole inventory still proves 703 changed code/test histories, zero gaps,
and exactly the same baseline/coverage decisions for all 1,017 touched paths.
The actual included-allowance review at `dfe4198` completes across all 16 paths,
raising one minor fixture-reader environment issue and no further comments on
F1–F4. Reproduce the issue in a fresh Node worker with absolute `GIT_DIR` and
`GIT_INDEX_FILE` redirects. Explicit sanitized environments now reach all fixture
readers as well as writes. Seven proof checks pass, including four actual child
cases and byte-for-byte preservation of the caller's real index. One final
two-source-file correction review remains. No live/provider/NAS/release
operation is included.

## November 21 final planned CodeRabbit review completes

Verify the actual completed 28-path correction review at `07a3dcd`: four issues,
three major and one minor, with exact range/tree/path evidence. This is the
eighth request and closes the finite remote campaign. Reproduce the late
successful-create confirmation error, then give confirmation its own bounded
five-second read while retaining the original deadline for further creates.
Initial/retry success and slow-terminal fixtures pass. Later-page malformed
Portal inventories also exit nonzero, refuting the proposed recovery concern.
All 163 Stripe checks, focused lint and the last inert rebuild/TypeScript pass.

Record the two audit compatibility follow-ups and all earlier deferred work in
the [final register](audits/2026-11-21-coderabbit-range-backfill-results.md).
Do not start another remote cycle or claim the subsequent small source delta
has been reviewed. Its ordinary PR/CI/release gates remain, as does separate NAS
activation. Preserve the complete 703-path public coverage result and all raw
receipts. No push, deployment, provider or live-data change occurs.

## November 21 fixed range backfill completes and current-beta issues are triaged

Admit the actual 60-file completed receipt after exact path/tree/outcome checks.
All 703 changed post-bootstrap code/test histories now have complete range
proof; zero gaps remain. Preserve the older 643/60 and blob-only inventories as
history rather than rewriting their original receipts. CodeRabbit raises 64
observations, each recorded in the [bounded backfill register](audits/2026-11-21-coderabbit-range-backfill-results.md).

Reproduce and correct four Calendar boundary/date bugs and three Checkout/
readiness safeguards. Strengthen four small existing tests and add the actual
late-legacy-Session ordering regression. Current synthetic checks pass: Calendar
116, Stripe 161, route/security 207, anatomy delivery 12 and Production build
gates 20. The final inert build, full lint/TypeScript and three proof checks
also pass. One correction-delta review remains; no
further automatic review cycle is permitted. Older migration/cleanup and test
suggestions have explicit deferred/conditional dispositions and use gates.
No deployment, provider, database, NAS, payment or email operation occurs.

## November 21 correction receipt exposes incomplete range proof

The 37-file follow-up at `9712b16` completes with four major observations.
Calendar form/writer questions are refuted. The audit's fail-open Git reads and
blob-only coverage assumption are confirmed; correct them with real-Git missing-
parent tests and an incremental-label counterexample. Sixteen native browser
scenarios, final inert build, TypeScript, lint and relevant application/backup
regressions pass. No application source change is needed for the two refutations.

Reconstruct reviewed content transitions from each inherited pre-change file.
All 76 PR diffs read successfully. Both the strict audit and an independent
read-only reconciliation identify the same 60 unproven histories among 703
changed code/test paths; 643 have complete evidence. Freeze one 60-path wider
review at public `d7e30e0`, with one final correction-delta request afterward.
Preserve initial receipts, their exact ranges and the earlier inventory as
history; withdraw the old implication that a matching blob proves all earlier
changes. The explicit [bounded extension](superpowers/plans/2026-11-21-coderabbit-range-proof.md)
reuses only included allowance, without provider/NAS/deployment writes.

## November 21 retrospective reviews and local correction preparation

Fresh private CodeRabbit sign-in completes with the existing account. Freeze
the 166 previously unsupported shipped file versions at public `d7e30e0` and
retain their exact manifests and actual completed receipts. Three initial
passes cover 136 paths and raise 42 observations. After included allowance
reopens, the final 25/5-path passes raise four/zero issues. All 166 paths verify
once each, totaling 46 observations (28 major, 18 minor). Paid credits remain disabled. Keep the
older dirty Linux QA checkout intact and use independent native worktrees.

Reproduce supported stale-cancellation, inactive-background-ownership, movement
recorder, touch/focus, Quick Log and backup failure-path cases in a separate
local correction branch. Record refutations and conditional workload/portability
items in the [triage](audits/2026-11-21-coderabbit-retrospective-results.md).
Prepare an explicit Codex/CodeRabbit review policy and one correction follow-up;
CI or a skipped bot check cannot substitute for actual completed review.
The source changes, runbook and checks remain local. This task changes no live
service, NAS file/task, database, payment, email or deployment.

All initial observations are triaged: 21 behavior corrections, one strengthened
test, two runbook clarifications, 20 refutations and two conditional follow-ups.
Checkpoint `ce08c01` passes lint/TypeScript, an inert build, ten phone/desktop
Wellness scenarios and focused regressions. A final empty-list report-source
correction passes 13 report/PDF tests; its rebuild and one correction review
remain pending. Preserve the finite review boundary and later publication gates.

## November 21 sidebar and private Calendar public acceptance

The actual CodeRabbit follow-up completes at `61a7c6a`: 15 correction paths,
zero actionable issues. Completed receipts match all 35 current changed code/
configuration/test blobs; Codex is clear and all seven source-head checks pass.
PR #77 merges as `d7e30e0`, with exactly the reviewed tree. One staged Production
build passes the read-only migration/payment gates and both Sentry uploads.
Authenticated dashboard metadata matches the emitted script and map debug IDs.
Actual synthetic launch and outline PDF downloads pass readback before promotion.
One same-artifact promotion succeeds. All 23 public routes, phone/desktop Calendar
boundaries and emitted asset bytes pass; 87 setting metadata entries and unrelated
aliases remain unchanged. No rollback or live record/payment/provider-setting
change occurs. All seven merged-source CI jobs and final source/settings/routing
readback pass; the operation is verified and closed. The retrospective
audit remains separate and still needs private CLI authentication. See the
[receipt](audits/2026-11-21-sidebar-calendar-publication.md).

## November 21 final date continuity correction and review cooldown

Codex's `70b354a` review identifies loss of the viewed date when changing practices.
Retain the selected local calendar day in the new practice query, avoiding UTC
serialization drift. The 112 focused cases and actual phone/desktop month-switch
journey pass. This remains within the current Calendar behavior; no broad cleanup
is included. The 14-file CodeRabbit follow-up is rejected before execution by its
included OSS quota, with the next review available around 07:27 UTC. Keep the
release unmerged and use the next included pass after the reset. The five
retrospective cohorts separately await private CLI authentication.

## November 21 substantive hosted second review and focused corrections

An explicit command through the existing GitHub CodeRabbit app succeeds where
the CLI needs reauthentication. It completes all 40 text paths at `610c1ff`,
excluding only four independently verified PNG baselines, and raises one major
and three minor issues beyond the initial CLI correction batch. Codex's current-
head review is clear. The major issue opens the wrong eligible practice's service
catalog; no unauthorized-membership access is demonstrated. List/new/edit routes
and verified mutation redirects now retain the selected practice. Day-bound
controls are disabled and write-guarded for full-day personal layers; role-denied
creation links retain context. 112 focused cases, focused lint, TypeScript and actual phone/desktop Calendar
journeys pass. Changes stay within one reported focused correction batch.

The historical planner receipt is corrected to acknowledge the missed staged
PDF download readback. An actual synthetic six-page report (23,049 bytes) from
still-deployed `0976d7d` preserves every example answer, Unicode and professional
notices. All six public aliases still identify that artifact. Only isolated local
fictional drafts are used and no server writes occur. The upcoming staged build
must pass the same actual-download check before promotion. Current-head hosted
checks and correction review remain required; no merge or promotion occurs here.

## November 21 publication browser gates corrected

Hosted browser CI identifies two expected sidebar screenshot differences and a
planner save assertion that acts on a server-rendered input before device-draft
hydration. Regenerate four Linux reference images from the exact inert CI build;
all changed pixels stay inside the approved sidebar, with page geometry and all
other pixels unchanged. The planner test now waits for its real saved-draft
readiness signal before editing. All six focused Linux phone/desktop journeys
pass without updating reference images. Application runtime code is unchanged.
Fresh hosted CI/review and the actual CodeRabbit correction follow-up remain
required before merge; the review service still requires private reauthentication.
No source merge, Production build or public promotion occurs.

## November 21 sidebar/Calendar release preparation

PR #77 is open at initial `03675e4`. Codex identifies date resets on split/source
transitions and personal display values leaking into later full preference
saves. Explicit CodeRabbit CLI review covers all 40 changed files and raises
four issues: those two, stale-practice handling and browser-fixture cleanup.
The correction retains the active date across remounts, uses the existing locked
server patch merge, preserves the independent personal layer and always closes
the isolated test server. All 98 focused tests and actual phone/desktop,
no-practice and split-transition journeys pass. Follow-up review/hosted gates
remain before publication. The owner's separate bounded coverage audit stays
on its own local branch, with no old-PR reopening or broad rewrite loop.

The owner requests publishing the completed sidebar and Calendar updates. The
publication branch starts at `db1790e` above public `0976d7d` and local receipt
`f9f7d17`. Existing provider settings, payment gates and membership/clinical
boundaries remain unchanged. Review, exact-head CI and fresh service evidence
precede one verified staged build and same-artifact promotion under the
[publication plan](superpowers/plans/2026-11-21-sidebar-calendar-publication.md).

## November 21 navigation and private Calendar workspace completed locally

The owner approves targeted sidebar groups, separate My Calendar/Practice
Calendar launchers and a shared Calendar display without personal-data sharing.
They supply their earlier note about individual accounts/subscriptions, multiple
practice/group memberships and a possible sponsored or consensually split
practice fee. The note is retained as product direction; no billing model is
chosen or activated.

Branch `codex/sidebar-calendar-workspace` adds the groups and consolidated
launchers while retaining legacy URLs and role gates. Both Calendar entry points
reuse the existing scheduler, including people without practices. A bounded
owner/range controller, authenticated response binding, read-only projection and
private detail dialog support Personal/Practice/Together. Stale, mismatched,
disabled and expired-session results cannot populate the private display.
Practice switching verifies membership, preserves creation/return targets and
deduplicates visits. Month weekday labels are corrected after visual QA.

97 focused tests, 84 sync/isolation checks, 45 scheduling/cancellation checks,
phone/desktop/no-practice synthetic Calendar journeys and two full-app sidebar
journeys pass. Full and focused lint and the final inert TypeScript/116-page
build pass. The local sample preview uses fictional data only. No publication,
provider, membership, database, email, payment or NAS operation occurs. See the
[local receipt](audits/2026-11-21-sidebar-calendar-workspace.md) and
[implementation plan](superpowers/plans/2026-11-20-sidebar-calendar-workspace.md).

## November 20 planner reports and Body palette published

PR #76 merges reviewed `a4c23ef` as `0976d7d`, retaining the reviewed tree. The
remaining four planner changes, local publication records and six light blue Body
buttons are public. A stale h1 source guard was corrected without changing the
application. All seven source checks and hosted review pass; two configured
mobile timing retries pass a direct follow-up. One staged Production build passes
the existing read-only gates, TypeScript and both Sentry uploads. Exact map/script
pairing, 18 routes, PDF generation/reuse, asset hashes and public phone layout are
verified before/after one same-artifact promotion. Settings and unrelated routing
are unchanged. All seven automatic merge checks pass after retrying only a failed
runner font installation. Three configured timing retries pass six direct
desktop/phone follow-ups without retries. Final source/settings/routing readback
passes and the operation is closed. No new provider, database, payment, email or
NAS change occurs. The local receipt triggers no extra deployment. See the
[publication receipt](audits/2026-11-20-planner-beta-publication.md).

## November 20 remaining planner release preparation

The owner requests publishing the remaining Business Planner work and other local
changes, then selects light blue for all six Wellness Body launchers. Fresh main
is public `f6b80fb`. The release branch retains its local receipt and integrates
the four planner commits through `42006a9`, with both planner and Wellness test
imports preserved. The older local release records are inserted chronologically.
Inventory confirms the old beta Calendar/CI/backup edits are already published;
historical recovery branches, partial temporary checkouts and September branding
masters are preserved. No broad cleanup or media admission occurs. The publication
plan records existing draft-format/rollback limits and the current service gates.

## November 20 Wellness release published and read back

The authorized publication is live as merge `f6b80fb` from reviewed `b3fd1db`
in PR #75. An isolated branch excluded four newer planner commits while preserving
all nine Wellness changes through `7446c75`. One stale session-consumer inventory
was corrected and all seven hosted checks and current-head review passed. Local
focused browser QA passed all 54 cases. Two configured hosted retries were
investigated; readiness-aware shortcut and unchanged scaling diagnostics pass
without runtime or CI-setting changes.

One staged Production build passed read-only migration and all-payments gates,
uploaded Sentry client/server maps and passed route, font, artwork and body-model
readback. Authenticated archive inspection matched the actual emitted debug ID
and script/map pair. Fresh configuration/routing checks admitted one promotion
of that exact artifact. All six public aliases, 37 other baseline mappings,
one Preview alias and all 87 Production settings verify correctly afterward.
All 13 public route checks and staged/public byte identity pass. Live browser
review confirms Exercise, the 3D body and My calendar; the signed-in owner read
completes without errors or saved records. The previous release remains READY.
All seven main checks pass in run `44855104944`, including 680 browser cases
without retries and 180 configured skips. Local receipt closure consumes no extra
deployment. The operation is verified and closed with no remaining write capacity.

## November 20 Wellness publication preparation

The owner requests publishing all Wellness work including Exercise and My
calendar. Fresh `origin/main` is public `7785ae6`. Four unpublished planner
commits precede the nine Wellness commits in the development checkout, so a
separate branch integrates only the Wellness diff after `42006a9` through
`7446c75`. Shared browser-test imports are resolved without importing planner
report tests or runtime. Existing development branches and previews remain.
The new publication plan preserves review, hosted checks, fresh configuration
and routing checks, migration/payment read gates, Sentry maps and staged
same-artifact promotion. No provider configuration or database write is needed.

## November 20 Wellness grouping and owner-only My calendar

The owner wants Mind/Body/Context/Review & plan, and asks whether recordings
appear in Calendar. Current Calendar is practice scheduling; signing in alone
does not create a personal view and recordings are absent. Local branch
`codex/wellness-mind-body-calendar`, from `2598102`, groups Feelings/Sleep under
Mind, physical recording tools under Body, and Work/Home under Context. It adds
a private month/day view in Wellness and `/calendar/personal`, plus navigation
from existing scheduling and a nonmember Calendar entry point. Original records
are read through authenticated, bounded, owner-scoped range queries with stable
pagination; appointment reads use only the owner's client link. Generic reminders
are current-rule previews, not delivery/completion records. Readback is shared
with Timeline. No practice event, availability, Google, therapist sharing or
professional-record boundary is changed. Verification passes 85 Wellness
and 30 Calendar/domain/controller/recovery checks, lint, two guards and the
inert TypeScript/116-page build. Private views remount across account changes
and hide previously loaded snapshots on sign-out. Phone review removes a
duplicate header/inset card and wraps reminder controls at enlarged text sizes.
All 54 final desktop/mobile browser journeys pass in 6.4 minutes, including
older dates, complete record readback/deletion, reminders, keyboard navigation,
themes and narrow/enlarged text, and the existing recording flows. The in-app
phone/desktop review is complete and the viewport reset. New preview:
`http://127.0.0.1:3022/wellness`, open to grouped tools; existing tabs are
preserved. No publication or live data/provider write occurred. See the
[implementation record](superpowers/plans/2026-11-20-wellness-mind-body-calendar.md).

## November 20 Exercise recording and progress

The owner requests gym and PT/OT personal recording, with progress over time.
Branch `codex/wellness-exercise-tracking`, from `c158f69`, adds Exercise to the
physical recording group and a separate Exercise progress tool. A name is enough;
sets/reps/resistance, holds, time/distance, equipment/assistance, side, effort
and comfort are optional. Reuse copies identity only. Strict versioned metadata
validation preserves blanks/zeros, excludes irrelevant/private sync fields and
rejects invalid measurements before owner-scoped writes. Charts keep matching
identities and units distinct, with full set details below. Existing privacy,
save/pending, export and deletion contracts remain. All 85 focused tests, lint,
two guards and the final inert TypeScript/115-page build pass. All 50 desktop/
mobile browser cases pass in 6.8 minutes, including drafts, sets, latest-identity
reuse, units, PT/OT, cardio, history/deletion, themes and narrow/enlarged text,
plus existing surface/feelings/movement flows. Initial broader checks found two
lost clicks before hydration; static launchers now wait for their handlers, and
delayed-script coverage passes on both browser profiles. Phone review also
corrected set-input alignment. The final phone/desktop preview is fresh, the
temporary viewport reset and existing tabs preserved. Evidence is outside
source. New preview: `http://127.0.0.1:3021/wellness`, open to Exercise. No
publication or live private recording/provider/database write occurred. See the
[implementation record](superpowers/plans/2026-11-20-wellness-exercise-tracking.md).

## November 20 recording type first and separate check-in drafts

The owner reports unclear tools, excess text and an illogical field order. The
existing dirty-draft guard can override a newly clicked launcher with the old
category. Branch `codex/wellness-recording-flow`, from `3e923dd`, replaces that
guard with per-category in-memory drafts and makes type selection the first
control. Activity/Incident/Body/Feelings have distinct primary tasks; optional
sensations, timing and context are collapsed, with no default intensity value.
The existing shared save/privacy/pending boundary is retained. All 76 focused
checks, focused lint, two shell/style guards and the final inert TypeScript/
115-page build pass. All 44 desktop/mobile browser cases pass in 5.8 minutes,
including correct destinations, category-first order, distinct prompts, full
native/controlled draft restoration, separate saves and metadata isolation.
Existing body/ROM flows, feelings gestures, themes and narrow/enlarged-text
containment pass. In-app phone/desktop review confirms the new layout and an
Activity draft returning after type changes. Fictional review notes were cleared,
the viewport reset and existing tabs preserved. New preview uses loopback port
3020 and remains open to Activity. Evidence stays outside source. No private
recording, publication or live provider/database operation occurred. See the
[implementation record](superpowers/plans/2026-11-20-wellness-recording-flow.md).

## November 20 continuous feelings wheel and direct gestures

The owner likes the working wheel but wants parent and neighboring words to
remain visible, as well as the reference app's direct touch rotation. Local
branch `codex/feelings-wheel-context`, from `695e260`, adds a continuous three-ring
hierarchy and captured mouse/touch gestures. Choosing any level retains all
others; drags, pinches and cancelled touches do not record a word. Overview,
reading/reset, zoom/rotate controls, roving keyboard focus, full lists and the
existing search/custom/multiple choices remain available. Existing local-first
storage, plain word values and save/privacy lifecycle are retained. All 76
focused checks, focused lint, two shell/style guards and the inert TypeScript/
115-page build pass. Four final desktop/mobile browser cases pass, covering
native Chromium touch emulation for tap/drag/pinch/pan/cancellation, mouse and
keyboard interaction, retained drafts, multi/search/custom words, timeline
readback, themes and narrow/enlarged-text containment. Phone and desktop in-app
views were reviewed, direct dragging confirmed and the viewport override reset.
No physical-device check is claimed. The existing preview tab stays untouched;
the revised local preview uses port 3019. Evidence is outside source. No private
recording, publication, provider or database write occurred. See the
[implementation record](superpowers/plans/2026-11-20-continuous-feelings-wheel.md).

## November 20 progressive surface detail and tailored check-in tools

The owner clarifies that laterality alone is insufficient: front/back, medial/
lateral and top/sole locations need independent meaning, with optional close-ups
and more precise choices. They also request the body in Body sensation/Incident,
a feelings wheel, the ROM shortcut, contextual Work/Home observation prompts and
separate home self-care. They supply three wheel reference screenshots while
implementation proceeds. Local branch `codex/wellness-surface-detail`, from
`366951f`, retains broad historical labels while adding explicit surfaces/detail
and draft-only refinement. The same free model remains an illustrative surface.

The source adds hierarchical word navigation, multiple/search/custom choices,
bounded category-specific metadata and timeline/report readback. Work/Home
prompts invite noticing, without asserting a cause; private fields are excluded
from preference sync and diagnostics. Shared save/pending/privacy owners and
native drafts remain. All 73 focused checks, 76 Sentry checks, 24 preference
checks, two shell/style guards, focused lint and the inert TypeScript/115-page
build pass. All 42 final desktop/mobile browser cases pass, covering real surface
taps, close-ups, named fallback, independent labels, wheel navigation and
selection, draft retention, Work/Home readback and existing ROM/comfort flows.
Rendered theme/narrow/enlarged-text checks pass. In-app review at 390x844 confirms
the nine-family wheel and an actual inner-forearm tap. Evidence is outside source;
the viewport override is reset and the clean Feelings preview remains open on
loopback port 3018. No private recording, provider/database write or publication
occurred. See the
[implementation record](superpowers/plans/2026-11-20-wellness-surface-detail.md).

## November 20 detailed Activity regions and separate sides

The owner identifies incorrectly grouped sides, upper arms/forearms, missing
shins and overlapping profile markers, and asks about point versus drawn areas.
Branch `codex/activity-sided-regions`, from `6efe58c`, adds 52 paired surface
locations with distinct stored labels and Left side/Right side camera views.
Camera-relative rules hide the far side and wrong-facing surface; selections
remain independent as the view changes. Named alternatives are grouped by body
section and selected labels can be removed individually. The existing save
bound is enforced in the chooser; timeline can reveal all recorded areas.
Legacy unsided strings are preserved without inferring laterality. The model,
dependencies, export shape, action/privacy owner and other tools remain.

Named areas are recommended as the repeatable default; optional drawing and
reviewed anatomical context are documented follow-on designs. No sketch data or
automatic tissue assignment is added to this surface model. All 64 focused
checks, two shell/style guards, focused lint and the inert TypeScript/115-page
build pass. Initial screenshot review found floating profile offsets; markers
now snap to small actual neutral-surface patches, prepared once per viewer.
All 36 final desktop/mobile browser cases pass, including actual near-side
forearm and bilateral shin taps, distinct arm segments, save/timeline labels,
failure fallback, preserved drafts, themes and narrow/enlarged-text containment.
Rendered 390x844 profile/front images were reviewed. In-app control was unavailable
due to a Windows cursor-access failure; no manual in-app interaction with this
build is claimed. Fictional evidence remains outside source, with preview on
loopback port 3018. No private recording or publication occurred. See the
[design and validation record](superpowers/plans/2026-11-20-activity-sided-regions.md).

## November 20 Activity form and reusable body-region selection

The owner requests phone-oriented polish and the same body used by the movement
tools in Activity's Body regions section. Branch `codex/activity-body-polish`
starts at `cd1ea12`. It retains the shared mounted quick-log draft, action owner,
privacy acknowledgement, saved region vocabulary and other categories' region
grids. Activity now has compact guidance, optional sections and a bottom save
action. The existing free CC0 surface supports front/back views, explicit orbit
controls, multiple regions, visible selections and keyboard-friendly named
choices. Named choices open automatically if 3D fails. Closed/hidden sections
release the scene without dropping the serialized selections.

Inspection also found Activity's existing duration/detail inputs were dropped
by the metadata allowlist. These two fields now use the existing bounded
normalization; unrelated metadata remains excluded. No new model, dependency,
schema, provider or clinical connection is introduced. All 61 focused tests,
two style/shell guards, focused lint, TypeScript and the inert 115-page build
pass. All 34 desktop/mobile browser cases pass, including actual surface taps,
multiple regions and removal, preserved hidden native fields/drafts, saved
duration/detail, failure alternatives and note-only recording without a model
request. Both themes and narrow/enlarged-text containment pass. Manual phone
review confirms selected regions on the body; the viewport override was reset.
Evidence remains outside source and preview stays on loopback port 3018. No
private recording or publication occurred. See the
[implementation record](superpowers/plans/2026-11-20-activity-body-polish.md).

## November 20 expanded movements and comfort check-ins verified locally

The owner identifies missing shoulder horizontal motions, forearm rotations,
hand/finger/toe motions, hip rotations/adduction/straight-knee flexion, bent-knee
tibial rotations and foot inversion/eversion. They clarify two separate tools
with optional cross-recording and low friction, rather than requiring both
ratings and angles. Branch `codex/movement-comfort-checkins` extends the shared
body flow and existing self-tracking action, with independent drafts and no
new database schema or paid asset. New ratings are explicitly scale-marked,
validated before persistence, excluded from generic intensity and protected
from account preference/diagnostic payloads. Timeline and Patterns retain
descriptive, dated comparisons for the same movement/side/scale; ROM references
also separate measurement source and axis. Individual toe animations remain
written-only where the free rig has no corresponding bones.

Visual review found that fixed joint-centered camera crops could hide moving
hands/feet. The final renderer fits the actual selected-limb surface across
five authored poses, caches vertex membership and samples only on view reset/
resize. Side/angled defaults and small finger markers make the new motion cues
clearer. No recorded angle or comfort score controls the model.

All 57 focused movement/Wellness checks, 76 Sentry checks, 24 preferences, two
shared shell/style guards, consolidated lint and the inert TypeScript/115-page
build pass. All 28 final desktop/mobile browser cases pass. They cover the new
low-friction record paths, retained independent drafts, omitted optional data,
dated rating comparisons, actual left/right rig demonstrations, written-only
toe choices, responsive/themes and existing ROM sensor/pending/privacy guards.
Manual in-app review confirms the limb framing and focused comfort screen.
Fictional evidence is outside source; preview remains on loopback port 3018.
No live account/private recording, provider, database or publication operation
occurred. Physical-phone calibration and validated biomechanics are not claimed.
See the [implementation and verification record](superpowers/plans/2026-11-20-movement-comfort-checkins.md).

## November 20 guided ROM and reusable interactive body verified locally

The owner asks for a phone app layout, everyday movement labels, selectable
joints on a reusable 3D human and animated direction previews. Later references
permit skin/muscle realism as well as blue illumination, and clarify a free-only
asset budget with attribution acceptable. Work on `codex/rom-guided-mobile`
uses the author-published CC0 rigged surface model, pinning its file hash and
retaining license/source evidence locally. This does not activate the deferred
atlas/BodyParts3D candidate. Three real stages replace the original flat form.
The existing self-tracking action owner, payload and privacy acknowledgement
remain, with no camera or automatic joint-angle claim. Eight areas and 26
plain-language movements provide selectable sides, written cues, technical-name
details and an Other movement path. The blue body uses actual mapped rig joints,
explicit orbit controls and closer joint framing. Playback is bounded, pausable
and replaced by still positions for reduced motion. Unavailable WebGL/assets
leave equivalent named choices and written guidance. Hidden tools release the
renderer and sensor listener; context changes invalidate phone baselines. Manual
angles reject blank/invalid values. The timeline adds movement and side labels.

All 42 focused ROM/Wellness checks, two style/shell guards, focused ESLint,
TypeScript and the final inert 115-page build pass. The 22 selected desktop/
mobile cases all pass across the acceptance run and targeted playback rerun.
The playback test compares rendered pixels at CSS scale so fractional device
pixel ratios and PNG encoding do not masquerade as a changed pose; it still
requires actual rotation, still-pose changes, reset, a held pause and completion.
Manual in-app review confirms the phone body and close-up direction preview.
Tests use fictional practice entries and synthetic phone readings. No real-phone
calibration or validated biomechanics is claimed. Evidence remains outside
source, with loopback preview on port 3018. No publication, private recording,
provider, database, payment or email action occurred. See the
[implementation and verification record](superpowers/plans/2026-11-20-guided-rom-body.md).

## November 20 planner responses, reused information and reports verified locally

The owner's launch checklist request becomes 25 response fields, one set of
practice identity/contact fields and a final report stage. The additive saved
shape preserves legacy task keys/checkmarks; entering responses never completes
a task, and resetting checkmarks leaves the answers intact. The outline reads
known business-tool drafts locally and includes source-labelled facts alongside
its preserved narrative. Sources can be refreshed or excluded; unrelated data
is never read or changed. Financial tools remain separate planning scenarios.

Both reports have local PDF download and print-only-report controls. Lazy pinned
PDF libraries and an unmodified OFL-licensed Noto Sans report font provide
searchable, wrapped, paginated text; unsupported glyphs fail visibly with the
print fallback. New visible tool guidance covers informational use, no legal/
financial/tax/accounting advice and professional review, without changing
accepted legal documents. Reports label missing work and additional lender
needs instead of claiming a complete loan application or verified compliance.

Validation: 11 report/PDF checks, 49 existing planner checks, 24 preferences,
17 SEO/identity checks, two shared style/shell guards, focused ESLint and the
inert TypeScript/115-page build pass. All 30 actual-app desktop/mobile cases
pass, including PDF downloads, print isolation, export failure/recovery,
legacy-draft migration, responses/reload/reset, context refresh/exclusion and
phone/enlarged-text containment. Visual PDF review corrected dark print margins;
the compact header was tightened to retain its existing phone-height budget.
The isolated storage fixture now sets an explicit chunk path for its inline
bundle; actual-app tests exercise the real lazy export. Manual in-app review
confirms the answer fields and reused service context. Fictional artifacts are
outside source; the preview remains on loopback port 3018. Source branch
`codex/planner-reports-reuse` starts at `37bdcbc`. No deployment, live account,
provider, database, payment or email action occurred. See the
[implementation record](superpowers/plans/2026-11-20-planner-reports-reuse.md).

## November 19 Income expense, reserve and time workflows verified locally

The four-step Income worksheet now itemizes monthly/yearly business expenses
and session costs; each session cost can use appointment/month/year frequency.
Lists have named rows, add/remove controls, totals and retained drafts. Old
numeric estimates migrate to one named row; explicit empty lists stay empty,
and fractional per-session assumptions survive normalization. Stable browser
and appSettings keys remain. Account preference serialization retains the rows;
no new model, migration, dependency or provider operation is added.

Optional prompts cover retirement, health insurance, medical out-of-pocket
costs, dental/vision, life, disability/income protection and emergency reserves,
with custom entries. Reserves annualize into the personal target before the
existing user-selected set-aside. Guidance explains additional-to-take-home
budgeting, counting each expense once and no assumed tax deduction/plan limit.
The plan links the relevant IRS rules as background for this boundary.

Desired-days-off and daily hands-on labels are clearer. Per-appointment intake/
turnaround minutes plus other weekly admin now contribute visibly to total work
hours. The calculator keeps hands-on capacity separately entered. Chart bars
show currency with cents; the missing employee-wage action returns to Step 2
and focuses the wage field without resetting or navigating away. Comparison
copy explains its same-hours/weeks and set-aside assumptions.

All 49 planner checks, 24 preference checks, 24 desktop/mobile browser cases,
17 SEO/identity checks, two shell/style guards and focused lint pass. The final
inert TypeScript/115-page build passes. One build process exited before
compilation without diagnostics; the unchanged isolated retry passes. Narrow
enlarged-text amounts are fixed by reducing nested padding, preserving strict
containment assertions. The step-selection assertion is scoped to navigation
now that the worksheet has frequency selects. Chrome confirms the cents labels
and wage-field focus without client errors. The preview is open on loopback
port 3018, with screenshots/build evidence outside source. No live publication
or real account activity occurs. See the implementation/verification plan.

## November 19 Income Planner expense and benefits expansion requested

The owner asks for editable named expenses and yearly costs, session-cost
frequencies, benefits/reserves, clearer time and wage guidance, chart labels and
a direct return to the wage field. Local work on
`codex/income-expenses-benefits` keeps current storage/appSettings keys and
migrates scalar expense estimates to named rows. Personal reserve budgets are
additional to spendable take-home with no assumed tax deductions. A separate
per-appointment time allowance makes non-hands-on workload visible. See
`docs/superpowers/plans/2026-11-19-income-expenses-benefits.md`.

## November 19 Business Planner hub button material refined

The owner prefers the existing orange Glow outline material for the six hub
tool buttons. Only the hub's Button variant changes from `ctaBlue` to `glow`;
the centered labels/icons, compact grid and worksheet navigation are retained.
This remains local preview work on `codex/business-planner-steppers`.
Focused ESLint, the inert TypeScript/115-page build and both desktop/mobile hub
browser cases pass again, covering phone widths, enlarged text and both themes.
Manual Chrome review confirms all six links use Glow; the refreshed preview and
screenshots show the orange outlines. No global material or behavior changes.

## November 19 Business Planner polish and steppers verified locally

All six tools now share compact headers, contained fields and consistent
sections. The hub replaces tall outline cards and repeated Live badges with
six centered regular-blue tool buttons. Five staged worksheets have phone
section selectors, desktop step buttons, Back/Continue and focused headings;
Add-On Profit remains an immediate calculator. Input panels retain their
mounted controls, while the Income result chart waits until its stage is shown.
Checklist and outline progress still reflect actual entries. Dollar/duration
units and linked prompts clarify Service Menu and Add-On Profit fields.

All 46 planner tests and 22 desktop/mobile actual-app checks pass, as do 17
SEO/identity checks, two shell/style guards, focused ESLint and the inert
TypeScript/115-page build. The enlarged-text check found excessive suffix space
in narrow Minutes controls; short units now reserve less padding, and the same
containment check passes. The phone navigation helper uses the combobox's
accessible role, and theme screenshots wait for the existing transition to end.
Browser checks retain calculation, draft/reload and add/remove/reset assertions
and add all-stage navigation/focus coverage. Chrome review verifies the hub and
staged Income/Service Menu flows without client console errors. Preview remains
open on loopback port 3018; evidence is outside source.

The financial libraries, schemas, defaults, compatibility keys, dependencies and
server/data contracts are unchanged. This is local work on
`codex/business-planner-steppers`; no new publication or live operation occurs.
See `docs/superpowers/plans/2026-11-19-business-planner-steppers.md`.

## November 19 Business Planner polish and steppers requested

The owner supplies the phone hub screenshot and requests consistent polish for
all six tools plus steppers where the work has stages. The hub's large outline
cards, repeated Live badges and template eyebrow consume space; four remaining
tools still use large header cards and intrinsic wide grids. Local work will
reuse the accepted compact planner geometry and shared Button materials, add
step navigation to five staged tools, and keep Add-On Profit together as one
immediate calculation. Existing models and draft/account behavior are retained.
The prior publication stays closed. The detailed plan is in
`docs/superpowers/plans/2026-11-19-business-planner-steppers.md`.

## November 19 Wellness and planner publication completed

Final reviewed `724a151` on PR #74 passes all seven hosted jobs and merges as
tree-identical `7785ae6`. The full run has 5,749 JavaScript passes/five skips,
45 synthetic backup passes/one optional-tool skip, and 639 browser passes plus
one successful configured shortcut retry/180 matrix or opt-in skips. Final
review has no findings or unresolved threads. The draft-preservation regression
and test-only SEO correction are accepted before merge; no check is bypassed.

Actual Production migration/all-payments gates, TypeScript/115 pages and both
Sentry uploads pass. Authenticated archive readback matches the emitted
Wellness script and referenced map to the new release. All 12 staged/public
routes and reviewed font/artwork pass; staged/public bytes match and the apex
redirect is unchanged. One promotion updates six public mappings, preserving
36 unrelated baseline mappings, one expected Preview alias and all 87
Production setting metadata entries.

Live Chrome confirms Wellness colors/groups and centering, both planners'
currency/help and optional guidance, and breathing shortcut/focus return.
There is no captured live warning/error or horizontal overflow, and no existing
worksheet edit or Wellness save. Earlier Preview hydration behavior does not
recur on reload, a fresh tab or staged/public reads. Compatible `fa3a030` stays
READY; no rollback is needed. The campaign is closed and this local receipt
branch causes no extra build. See the
[publication receipt](audits/2026-11-19-wellness-planner-publication.md).

## November 19 hosted SEO assertion aligned with compact hub

Fresh review of `1719246` reports no findings; its protected Preview passes all
12 route/asset checks and rendered groups, units, help and guidance. One initial
recoverable hydration error is retained in evidence and does not recur after
reload or in a fresh tab; its cause is not established. No existing worksheet
is edited. The hosted unit run passes 5,748 cases with five skips and one failure:
an old source guard expects the deliberately replaced long Wellness heading.
The corrected guard checks the compact h1, the existing metadata binding and
unchanged route-specific search description. All 17 SEO/public-identity checks
pass locally, as does focused lint. All four hosted browser lanes finish
successfully on the corrected application; the aggregate correctly stays
failed because of the stale SEO assertion. The consolidated correction changes
tests and records only, retaining the application for a fresh hosted run.

## November 19 publication review catches draft relabeling

The initial `772e54d` candidate opens PR #74. Fresh preflight preserves all 87
Production setting metadata entries and 42 alias mappings; the protected Preview
passes 12 routes, the existing reviewed clock font, artwork and emitted bundle
readback. Hosted review identifies a shared-form defect: opening another
recording launcher keeps input but changes its category. The new actual-app
regression reproduces Incident becoming Sleep on the original build. Its first
attempt lacked hydration readiness; waiting for the existing Quick Log effect
corrects the harness before the accepted reproduction.

The focused fix retains the entire edited draft, including manual category
changes and body-map-only selections. A launcher seeds a category only while
the form is fresh; successful practice/persisted saves release that guard.
Failed saves preserve it. Save ownership and storage behavior remain intact.
All 11 existing action lifecycle checks, focused lint and the inert 115-page
TypeScript/build pass. Both original Wellness flow cases and both complete-draft
regressions pass in desktop/mobile Chromium, with no retries/skips. The new
checks cover category, note, intensity, context, manual category edits, fresh
selection after save and body-map-only input. The verified correction updates
the existing PR for fresh hosted QA/review before merge.

## November 19 Wellness and planner publication requested

The owner authorizes publication of the prepared Wellness and planner updates.
The clean application head is `ae3d327`; main and the accepted public source
remain `fa3a030`. Existing GitHub sign-in works in the native shell, and Vercel
confirms the existing project, owner and normal build command. Preparation adds
the scoped publication plan and these records, preserving the accepted source.
Fresh metadata/routing, review and actual Production/source-map gates follow.

## November 19 Wellness physical and context groups

The owner requests the regular blue Breathing Guide button, unchanged Music,
and separate check-in groups: orange Physical sensations (Range of motion,
Activity, Incident, Body check-in) and teal Context (Work context, Feelings,
Sleep, Home care). Existing Button materials supply these colors; Review & plan
stays green and all launcher content stays centered. Group metadata organizes
only the launchers; saved categories, ROM behavior and draft/focus handling
retain their existing contracts. Focused lint, the inert TypeScript/115-page
build and both existing desktop/mobile Wellness flow cases pass without retries
or skips. Chrome confirms exact group membership/colors, working Feelings/return
navigation and no captured warnings/errors. Phone and desktop screenshots are
in the external `physical-context` evidence folder and
`wellness-physical-context.jpg`. The unpublished preview remains on port 3018.

## November 19 Wellness button colors clarified

The owner clarifies that purple applies to the former blue-outline check-in
tools, not every launcher. Breathing Guide and Music return to their original
`success` and `glow` variants; the eight recording launchers stay `cta`, and
the three Review & plan launchers use green `success`. Centered icons and text
remain. Only three variant values change. Focused lint and the inert
TypeScript/115-page build pass; connected Chrome confirms every group, centered
labels, working Timeline/return navigation and no captured warnings/errors.
No additional tests or live/provider operations are needed for this appearance
correction. The local review preview remains open on port 3018.

## November 19 Wellness purple button and centering follow-up

The owner finds the outline launchers insufficiently button-like and requests
the existing purple material with centered text. All 13 launchers now use the
same `cta` variant as the breathing guide's purple controls. Icons sit above
centered titles/subtitles; styles remain scoped to the Wellness launcher.
The existing desktop/mobile Wellness flow cases pass again, including narrow
widths, enlarged text, draft retention and keyboard return. Focused lint and
the inert TypeScript/115-page build pass. Connected Chrome confirms all 13
filled purple faces, label centering within 0.02px and working navigation with
no captured warnings/errors. No new tests, dependency, provider write or
deployment is introduced; the local preview is left open on port 3018.

## November 19 planner guidance and Wellness hub verified locally

Break-Even now shares Income's compact heading, optional guidance and contained
card geometry. Both forms show currency/time/percentage affixes outside native
numeric values and connect plain-language input help with `aria-describedby`.
Break-Even money rows distinguish one-time/monthly/yearly amounts; its save
label correctly reports device-storage failures. Calculators, defaults,
compatibility keys, dependencies, schemas and server queries/actions are intact.

Wellness opens on grouped calming, recording and review tools. Selecting one
opens its pane with keyboard focus and a return to the launcher. Mounted hidden
panes retain unfinished drafts; category prompts and optional body details
match the selected check-in. Anonymous practice, private-save acknowledgment,
pending-operation admission, confirmation flows and Quick Log hash access stay
intact. Connected Chrome confirms all three local pages, guidance, category and
appointment navigation without captured warnings/errors; preview is loopback
only on port 3018.

All 46 planner tests, 11 action lifecycle tests, 62 existing clinical/Wellness
checks and two shared-shell/stylesheet guards pass, as do focused lint and the
inert TypeScript/115-page build. Rendered checks reproduce cramped weekday
numbers and enlarged Break-Even row/action overflow; card-width grid sizing,
full-width narrow money amounts and wrapping actions correct them. Native text
and date editors legitimately scroll internally, so the test checks their outer
borders while retaining strict numeric-value containment.

The final 14-case sweep passes 13 cases; the old Income text locator encounters
duplicate hidden streamed headings. It is narrowed to the visible semantic h1,
then that complete phone regression passes in both desktop/mobile projects.
All 14 selected cases therefore have passing coverage, with no configured retry
or skip in those accepted checks. They include 320–412px widths, landscape,
desktop, 24px root text, open check-in/ROM panes, calculations, reload persistence,
row add/remove/reset, draft retention, practice entry, timeline/pattern views,
same-page Quick Log, keyboard return, breathing shortcut and global route/media
layout continuity. Physical-phone/Safari acceptance and publication remain
separate. See the [completed local plan](superpowers/plans/2026-11-19-planner-guidance-wellness-hub.md).

## November 19 planner guidance and Wellness hub requested

The owner asks to match Break-Even to the newly published Income layout, clarify
monetary units and field meanings, and replace Wellness's large intro and stacked
forms with individual tool choices. A new local branch retains the published
source and receipt. Shared number fields now show optional units beside native
numeric controls and link explanatory text through `aria-describedby`; model
values and parsing remain unchanged. Break-Even shares compact planner card
geometry. Wellness uses grouped launchers, mounted hidden panes, category-aware
prompts, keyboard return and compatible Quick Log hash handling. Existing
acknowledgments and synchronous action admission remain in place.

Initial validation passes all 46 planner cases, 11 action lifecycle cases and 62
existing clinical/Wellness cases, including privacy guards. The inert runtime
build and rendered responsive/navigation tests are underway. No provider or
deployment boundary is crossed. The
[plan](superpowers/plans/2026-11-19-planner-guidance-wellness-hub.md) owns the work.

## November 19 Business Income Planner published and verified

Integrated `dc37c3b` passes all 46 local planner checks, focused lint, the inert
115-page TypeScript/build and four actual-app desktop/mobile cases without
retry/skip. Fresh complete preflight preserves 87 Production settings, the
all-payments scope, disabled automatic domain assignment and the 41-alias
baseline. One push opens PR #73 and its protected Preview.

Hosted review completes with no findings; CodeRabbit skips automatic review.
All seven CI jobs pass: 5,749 JavaScript passes/five skips, 45 synthetic backup
passes/one optional-tool skip, and 632 browser passes/180 matrix or opt-in skips
with no reported configured retry. The last lane's live log confirms continued
music/interruption test progress during the longer wait. A guarded merge yields
tree-identical `fa3a030` and one automatic staged Production build.

Actual migration-status/all-payments gates, TypeScript/115 pages and two Sentry
uploads pass. The operator verifier initially misses the planner chunk because
it scans only script tags; including App Router's emitted module references
finds the planner-specific script. Its debug ID and referenced map match the
new release archive. This corrects read-only verification, not application code.

An initial Preview load records one recoverable hydration warning; it does not
recur on reload, a fresh Preview tab, staged Production or public readback.
No root cause is established and no speculative source change is made. Staged
and public entry routes, planner/font bytes, artwork, optional guidance and
layout containment pass. Live worksheet values remain unchanged.

One promotion completes all six public mappings, preserving the other 35
baseline mappings, one expected new Preview alias and all 87 setting metadata
entries. The apex redirect is unchanged. Prior compatible `81b18e8` stays READY;
no rollback is needed. The operation closes with its
[receipt](audits/2026-11-19-business-income-publication.md) on a local-only
documentation branch, with no additional deployment.

## November 19 owner approves planner publication

After breathing/Clock publication, the owner requests publication of the
Business Income Planner fixes too. A new release branch integrates the original
local `0d48772` patch onto published `81b18e8` and its local completion records.
Three documentation-only conflicts are combined without losing either history;
application and browser-test changes merge cleanly. The original local branch
is preserved. Integrated validation and a fresh release preflight are underway;
this is a new publication operation, separate from the closed breathing release.
The [publication plan](superpowers/plans/2026-11-19-business-income-publication.md)
records its scope and remaining gates.

## November 19 breathing/Clock release published and verified

Corrected `7577cec` passes all seven hosted jobs: 5,749 JavaScript passes with
five skips, 45 synthetic backup passes with one optional-tool skip, and 628
browser passes with 180 matrix/opt-in skips and no reported configured retry.
The reproduced finding is resolved. PR #72 merges once as tree-identical
`81b18e8` and its one staged Production build passes real migration status,
all-payments readiness, TypeScript/115 pages and two Sentry uploads.

Sentry's new 521/2,608-file archives are linked to the merge release. An emitted
script's debug ID and referenced map resolve inside the client archive; the
unchanged common-chunk ID alone is not source identity. Nine staged/public
routes, font bytes and artwork pass. One promotion maps the same READY artifact
to six public aliases, preserving the other 34 original mappings, one expected
Preview alias, all 87 Production settings and the apex redirect.

Live Chrome confirms breathing Start/Reset, viewport fit and bold/centered
Clock/setup digits without captured warnings/errors. Retained `adb137e` stays
READY; no rollback is needed. No financial/email, clinical, NAS, migration-apply
or service-setting campaign is repeated. The planner remains unpublished.
The operation closes; this local-only documentation branch records the
[receipt and limits](audits/2026-11-19-breathing-clock-publication.md) without
triggering another build.

## November 19 breathing/Clock publication and review correction

The owner asks to publish the completed fixes. The first Vercel device sign-in
expires; a fresh private authorization succeeds. Complete current metadata
preflight verifies 87 unchanged Production settings, existing all-payments
scope, disabled automatic domain assignment, READY rollback and six matching
public aliases. A Windows batch launcher initially splits alias-query
ampersands; invoking the same installed Vercel CLI's Node entry directly
corrects the read-only request. No provider write occurs during that diagnosis.

One push opens PR #72 at `e944178`. Its READY protected Preview passes nine
entry pages, the reviewed bold font and actual Drone artwork. Its one expected
new branch alias is recorded separately from the original 40-entry baseline.
CodeRabbit skips; hosted Codex review reports a valid enlarged landscape
overflow. The new regression reproduces 7px at 667x375/24px. A named-container
condition now governs two-column layout by actual text-relative available
measure, with enough width for intact preset names. Screenshot review also
reveals the breathing overlay painted beneath the 10015 sidebar; a layer test
fails at modal layer 50 before the scoped backdrop/content correction.

All 16 final local runtime cases pass without retry/skip, including expanded
landscape typography, page/overlay control reachability, correct overlay layers,
focus return, native media/background continuity and Clock geometry. Focused
lint and the inert 115-page build/TypeScript pass. The original hosted full-unit
run separately finds two stale source contracts: 23 assumed stylesheets versus
24 tracked, and an overbroad route-key guard. Exact independent Git inventory
comparison replaces the fixed count; the sole ephemeral guide key is allowed
while the remaining shared-shell key ban remains. Both checks pass through a
named focused npm script before the PR update.

These corrections stay within the requested breathing UI publication. The
existing PR will receive the locally verified source once; original hosted
results/Preview remain historical and are not substituted for new-head gates.
The Production build/promotion slots are unused, the original operation window
is retained and the separate local planner branch is excluded. The
[publication plan](superpowers/plans/2026-11-19-breathing-clock-publication.md)
owns the remaining gates and evidence.
## November 19 Business Income Planner mobile layout repaired locally

While the approved breathing/Clock publication is awaiting Vercel CLI sign-in,
the owner reports phone-width overflow and an awkward oversized planner intro.
Created a separate branch from the unchanged `e944178` release candidate. A real
rendered regression reproduces 223px of nested overflow at 320px against that
old planner. Zero-minimum grid/field sizing and removing the chart's combined
aspect-ratio/minimum-height width constraint correct the cause without clipping
content. A compact semantic header, optional guidance, two-column preset choices
with one selected description and adaptive result tiles bring inputs forward.
Financial calculations, field meanings and persistence are unchanged.

The final candidate passes four actual-app desktop/mobile cases without retries
or skips, all 46 existing planner checks, focused lint and the inert full build
with TypeScript and 115 generated pages. Tests include all scenarios, 320–412px
phones, 24px root text, short landscape, desktop, concrete recalculation and
reload persistence, disclosure/back navigation, and anonymous traffic guards.
The isolated storage fixture now uses the real Next CSS module loader/trace
setup already established by the Clock fixture. Connected Chrome confirms the
compact default view and optional guidance with no captured warnings/errors.
Evidence and limits are recorded in the
[planner plan](superpowers/plans/2026-11-19-business-income-mobile.md).

No publication boundary was crossed. The breathing/Clock branch remains clean;
the Vercel device authorization expired before completion, so a fresh private
CLI sign-in is pending. The planner is a separate local candidate, with a
loopback-only review tab on port 3018; it is outside the approved release.

## November 19 owner-found button text spill and clock alignment corrections

The owner's follow-up screenshot reveals Coherent wrapping mid-word and its
timing outside the button. New rendered text-line measurements reproduce the
spill at 320px/16px before the fix; the prior button/page box checks missed it.
Computed styles show shared height/padding/gap utilities overriding the local
preset declarations. Scoped higher-specificity rules establish intrinsic grid
rows, appropriate padding/line heights and a responsive intact-title treatment.
Action buttons also retain their intended intrinsic height. The original phone
viewport/no-scroll and uninterrupted quick-access behavior are preserved.

While that correction is active, the owner reports raised, thin Clock and setup
digits on a work phone and requests bold. A real-font fixture identifies the
visible-ink offset; Clock mode additionally has a deliberate -4dvh transform.
Downloaded the author's original v0.46 release, verified its license is identical
to the preserved notice and copied only the unmodified 5,176-byte Modern Bold
font into source. Its separate `Digital Clock` alias normalizes line metrics and
includes space to own the CSS line box. The original Regular face and unrelated
consumers stay unchanged. Removed Clock's upward translation and centered setup's
duration row. Existing saved choices, width fitting, unit/meridiem fallbacks,
effects and immersive reservations remain in place.

Strengthened font QA measures actual painted pixels beyond the line-box edges,
so a clipped glyph cannot appear centered. Merely applying metric overrides
without space coverage fails; including the required character fixes the offset.
The author release and CSS Fonts first-available-font rule are linked in the
[clock plan](superpowers/plans/2026-11-19-clock-vertical-centering.md).
One intermediate mobile shortcut assertion races hydration; its fixture now
proves real Start/Reset interaction before sending the ephemeral chord, rather
than adding a delay or retry.

The final inert build passes TypeScript and all 115 pages. All 49 focused clock/
layout/font checks and 16 desktop/mobile browser cases pass without retry or skip,
including text containment across 13 size/text combinations, ordinary breathing
fit, key/focus guards, native media ownership, 12/24-hour seconds variants,
Clock/setup/running-timer centering and short landscape. Focused lint passes.
Connected Chrome confirms real bold/centered digits and Start/Reset/preset text
within their controls; duration adjustment remains interactive. Screenshots and
test output are outside source. The loopback inert preview stays available for
owner review. No hosted publication, service write, live payment/email, clinical
workflow or physical-phone/Safari acceptance occurs.

## November 19 compact breathing guide and uninterrupted shortcut, local only

The owner requests a phone-sized, app-like breathing interface using the existing
green and purple buttons and a keyboard entry that preserves music/backgrounds.
Reviewed the supplied screenshot and Moodist's visible breathing overlay as an
interaction reference; no upstream code or media is copied. Repository ownership
shows that route navigation preserves root music but can unmount route-owned
Clock/Chimer activity, so retain the full page and use Alt+Shift+B for quick access
above the current view. Escape restores focus; the dedicated page focuses its
existing action. Other dialogs and editable fields keep their keyboard ownership.

Extracted the unchanged three timing patterns into a tested elapsed-time helper,
shared the responsive page/dialog view and added shell-scoped height reservation
for navigation and active audio. The animation now spans each inhale/exhale and
catches up after throttled ticks. Reduced motion retains the countdown/phase.
Added a loopback QA start script using the established isolated environment.
The first rendered checks reveal an immediate-pause label defect, then a 10px
large-text overflow; both are corrected. A navigation fixture is corrected to
expand its Tools group before selecting Breathing. The final run passes without
retries: 15 browser cases and one device-inapplicable skip, including five phone/
landscape sizes, active-player reservations, 200% text, reduced motion, guards,
focus return and native media/background continuity. All 26 domain tests and
162 QA boundary/harness tests pass, alongside lint, typecheck and the isolated
115-page build. Windows' sandbox blocks Next's required junction and the native
browser cache, so those checks run through the approved native path; no provider
credentials or live database are loaded for this campaign.

Connected Chrome confirms the rendered controls, themes and overlay above Clock,
including the same Clock route and restored Close-clock focus after Escape.
Temporary viewport overrides are reset. Screenshots and test output are outside
tracked source. Chromium fixtures do not prove physical audio output or iOS/
Safari behavior. The [plan](superpowers/plans/2026-11-19-breathing-guide-mobile.md)
contains the verification commands and limits. Source is prepared locally only;
the prior public release and closed live-service campaigns remain unchanged.

## November 18 existing Voice number saved; final beta entry and handoff pass

The owner identifies an existing active Google Voice line and authorizes its
use for AtmoShaper. Fresh preflight verifies the temporary salon support contact
and existing branding/display setting. Filled only the public support-phone
field, checked the other visible public fields and submitted Save once. The
saved summary shows the selected Voice number and no salon contact; reopened
form comparison preserves all other public fields and receipt/invoice display
off. Cancelled the read-only reopen without another save. Saved screenshot
evidence privately in ignored output. No private verification/recovery-phone,
account, subscription, forwarding, greeting, payment or deployment change.

The canonical public host resolves read-only to READY `adb137e`; GitHub main
still matches it. Thirteen selected anonymous entries/manifest return 200 with
no generic server-error/personal-Gmail surface. Registration is open, offers
Google and password entry and retains its onboarding target. Manifest branding,
root entry, standalone display and four icons agree. These observations do not
create a new user or prove a fresh user's completed sign-up/install/offline use.

Prepared the owner's copyable [invitation and first-session plan](beta-invitation-draft.md),
reconciled the [handoff](audits/2026-11-18-beta-handoff.md) and retained the tester
guide. No invitations or other messages are sent. The remaining near-term owner
checks are the Voice greeting/number maintenance and first regular November 19
03:00 backup outcome. Prior scheduled/restore/alert and signed payment/Calendar/
game campaigns remain closed. Local docs do not trigger another deployment or
claim completion of broader migration/held-content/marketing work.

## November 18 owner-confirmed salon support number replaces the personal cell

The owner chooses the salon line temporarily and confirms the exact number and
AtmoShaper message routing before any save. Fresh Stripe preflight verifies the
reviewed account/public contact and receipt display off. The editor masks phone
values in DOM reads, so the initial field-value guard correctly stops without
editing; the fresh public summary then verifies the reviewed original contact.
Filled only the approved support-phone field, compared all other visible fields
and saved once. Static saved-summary readback shows the salon line and no
personal cell. Reopening the editor verifies every other visible public field
unchanged and receipt/invoice phone display still off. Cancelled this read-only
reopen without a second save. Saved a screenshot in ignored operator output.

Closed the public-phone privacy follow-up and restored the accepted small-beta
handoff scope. Private verification/recovery settings, address, legal identity,
branding, support email, payments and deployed application remain untouched.
Researched free phone-number retention/business-use policies and the standalone
paid Google Voice option; no new phone service, port, trial or billing change is
started. The [privacy receipt](audits/2026-11-18-public-contact-privacy.md) records
the result and qualified research. Canonical documentation remains local-only.

## November 18 public contact review finds a personal-cell exposure

The owner clarifies that customer-visible branding/privacy is the goal, rather
than moving private administrator logins. Public Support/Privacy/About reads,
runtime source and live Stripe public/customer-email settings show correct
AtmoShaper email/name branding on the checked surfaces. Carried forward the
matched Google consent and delivered branded recovery-message evidence without
a new grant or email. No personal Gmail is found on those checked surfaces.

Stripe's public support phone is the owner's personal cell. Its receipt/invoice
display checkbox is already off, while the editor and official US requirements
confirm support-number exposure to card networks/cardmember statements. The
owner wants to avoid that exposure. Prepared a replacement-only scope, awaiting
an owner-selected business support number. Cancelled the editor without saving;
no provider setting, legal identity, payment or deployment changed. Recorded the
[privacy receipt](audits/2026-11-18-public-contact-privacy.md); payment beta
outreach has this remaining contact-privacy item despite accepted release tests.

## November 18 corrected release published; Google availability and beta handoff accepted

After exact amendment approval, pushed `1748230` once to existing PR #71. All
seven hosted jobs succeed: 5,721 JavaScript passes/five skips, 45 backup passes/
one optional skip, and 615 first-attempt browser passes plus one configured-retry
success/180 explicit matrix skips. The unchanged mobile heading test retried a
two-match locator; no overflow assertion failed and no manual rerun was issued.
Resolved the now-outdated fixture review finding. Merged once as `adb137e` and
verified its tree exactly equals the approved candidate.

The single automatic Production build passes the real 46-migration/all-payments
gates and all 115 pages. Sentry accepts 521 client and 2,620 server files for the
exact merge; an emitted script resolves to its new archive. Its unchanged debug
ID also belongs to the prior archive, so it is not a unique source marker.
Seven staged and seven public entry checks, 512-pixel Linux artwork and apex
308 pass. Promoted that same artifact once; all six mappings complete, 34 other
aliases and all 87 Production settings remain unchanged. Retained compatible
READY `8d89550`; no rollback. Closed publication write slots after acceptance.

Fresh live Clock/Admin reads confirm independent Admin selection after refund,
revoked purchase ownership, no acquisition controls, two credits and the same
successful original $1.07 refund/history. No financial or preference mutation.

The owner enabled Google 2-step verification privately and installed the browser
extension in the AtmoShaper profile. Switched to its browser controls, ending
whole-PC input. Read-only matched-client inspection confirms External/In
production, verified branding and no sensitive/restricted scopes or required
data-access verification. No provider setting or OAuth grant changed.

Reconciled the [publication receipt](audits/2026-11-18-beta-final-publication.md),
canonical state, [handoff](audits/2026-11-18-beta-handoff.md) and
[tester guide](beta-tester-guide.md) locally. The small owner-led beta is ready
within that documented scope; no invitation is sent. The first regular 03:00
backup remains a future follow-up. No new deployment accompanies these docs;
broader migration/content/marketing/legacy-retirement gates remain separate.

## November 18 approved PR #71 held for a test-only review correction

The owner approves `d04b785`. Fresh release preflight verifies unchanged public
source/rollback, all six mappings, manual assignment and all 87 Production
metadata rows. The payment-scope row is encrypted Config rather than plain;
reading only that non-secret setting confirms the existing all-payments value.
No credential value or setting is changed. One branch push and PR #71 start
hosted CI/protected Preview; the Preview reaches READY and its root returns
200 using an existing automation access method, without a new share link.
The hosted browser build passes. All 5,721 applicable hosted JavaScript tests
pass, with five explicit skips out of 5,726. Code quality then fails precisely
the reviewed backup fixture; four browser lanes remain in progress.

The exact-head automated review flags an equal-timestamp fixture whose retention
assertion assumes creation/iteration order. A native-Ubuntu temporary copy
reproduces precisely that failure: 46 total, one error and one optional age skip.
The local correction makes the designated run strictly newest and checks both
forward/reverse iteration, preserving all ten recent invented recovery points.
All 45 applicable backup tests pass on native Windows and isolated Ubuntu.
No application or backup operator runtime changes. The approved source remains
unmerged; no Production build/promotion/payment runs. Preparing a new exact-head
amendment before another push, retaining the original grant/counters as history.

## November 18 post-refund access correction passes focused local checks

The client adapter preserves independently authorized background use after
purchase reversal, while historical ownership stays inactive and duplicate
acquisition controls stay hidden. Native red/green checks reproduce 18 access
failures, then pass all 98 focused checks. The optimized inert build passes
TypeScript and 115 pages; all 34 desktop/mobile commerce journeys and full lint
pass. Two screenshot-evidence cases pass without Checkout requests, ownership
restoration, credit use or cart mutation. Full regression finishes with 5,722
passes, four explicit platform/catalog skips and zero failures/cancellations
out of 5,726 in 850 seconds. Standalone typecheck and local Prisma schema
validation also pass.

Consolidated backup helpers pass 45 synthetic tests with one optional age skip,
and the existing one-record refund tool retains its 81 passing checks. Sandbox
filesystem restrictions require native validation for junctions and hard links;
they are not application failures. Current public source/READY rollback
`8d89550` and disabled automatic custom-domain assignment are rechecked read-only.
Prepared the exact-source publication packet; no push, new provider build, live
payment or deployment occurs under the consumed refund grant.

## November 18 original refund succeeds; final UI read exposes an access defect

Fresh scoped preflight confirms the original owned pending record and no
processor refund. The owner authorizes the one-field runtime-key permission
correction and one original-record resumption. Saved/read back only Charges
and Refunds Write, preserving eight other permissions and connected-account
scope. The Vercel credential reader stops before any command because it cannot
read the existing key. The original CurrentUser-encrypted runtime-key copy is
found and verified privately instead; the selected database binding is unchanged.
One read-only preflight and one guarded execution of `f0b3f94` pass, with exactly
one processor write and no automatic retry. No credential file is created.

Exact processor/app readback proves the original $1.07 refund SUCCEEDED, a
processed signed refund receipt, REFUNDED order/payment, REFUND_REVOKED purchase
ownership and unchanged membership/credits/Admin authority. The actual Admin
page agrees. The campaign closes inside its finite window, preserving history.

A fresh Clock view nevertheless disables the refunded item. Source traces this
to the client adapter's unconditional inactive-ownership precedence, contrary
to the server's independent feature/source grants. Preparing that source fix
and inert selection/rendering regressions; no additional live transaction is
proposed. The local candidate also consolidates the tested beta operations
source/records, preserving all branches and the current published runtime.

## November 18 two owner payments pass; refund permission gap stops acceptance

After the owner is ready, the separate thirty-minute payment campaign starts.
One $5 support Session and one $1 background Session are completed privately by
the owner. Exact processor/line readback confirms the reviewed distinct tax
codes, payment mode, complete Automatic Tax and $6.07 total. Support has zero
tax and leaves the owner's membership, two credits and ownership unchanged.
Skybreak has $0.07 Ohio tax, the current purchase document, a processed signed
Checkout receipt and one fulfilled permanent purchase ownership.

The owner submits the selected $1.07 app refund once. The original local refund
and REFUND_PENDING ownership remain, but two exact-payment processor reads are
empty. After private owner Stripe sign-in, the exact request log proves HTTP
403 `more_permissions_required`: the dedicated runtime key has Charges and
Refunds Read. Its combined Write capability is needed. Prepared that one change
without saving; all eight other permissions remain unchanged, with no connected-
account change. No key is revealed/rotated and no processor retry is made.

The existing batch reconciliation command is unsuitable for one owned fixture.
Prepared a separate guarded command on the published-source recovery branch;
81 focused checks pass. It preserves the original refund/idempotency identity,
filters owner/order/refund before reading, checks amount/item/live payment and
absence of an existing processor refund, and permits one bounded SDK write
without automatic retry. New permission, private Production binding use and
one-record execution require fresh approval. The original campaign's unused
attempts and expired release window stay closed; no deployment/rollback follows
automatically. Beta invitations remain on hold pending actual refund recovery.

## November 18 beta handoff assembled; private payment entry remains pending

Prepared the signed-in Pricing page without submitting an amount or creating
a Checkout Session. Source confirms its success return carries the exact
Session reference; the background refund uses the app's exact-order binding.
The beta checkpoint carries forward existing account, mail, Calendar, music,
recovery and support evidence with its limits, alongside the current release
and closed Ably result. It preserves the future first regular overnight backup
and remaining owned payment/refund acceptance. No invitations were sent.

## November 18 offered-release Ably binding verified; one-lobby campaign closed

After the exact owner approval, prepared two owned views before starting the
ten-minute clock. Created, joined and ended one generic lobby, one attempt each,
with no gameplay. Ably's live inspector proves a dedicated-key WebSocket/TLS
bearer connection, room-only presence/subscribe capability, attached room and
the backend player-joined/room-ended events. The app reaches review/recap.
Stopped the observer and closed both game views; a fresh connection listing is
zero. One scoped aggregate proves the retained REVIEW room, one player, zero
game runs and normal thirty-minute expiry. No replacement, direct publish,
database delete or key change occurred. Closed the campaign within its window.

Native window inspection was mismatched and was stopped without input. A fresh
provider tab and normal Google sign-in provided safe inspection instead. No
API key/token was revealed. Payment readiness has been requested as a private
handoff; no new Session, charge or refund has been created.

## November 18 all-payments release approved, built, mapped and published

The owner approves the frozen PR #70 release, 18 Production-only settings, two
capped owner payments/background refund and one no-gameplay lobby check. Fresh
preflight verifies exact source, CI, manual promotion and live Stripe metadata.
Created the 18 settings once with upsert disabled; individual values/targets
agree. Bulk metadata truncation initially prevents comparison; full encrypted
CLI metadata projected before output confirms all 69 prior timestamps untouched.
No secret values are exported and no create is retried.

PR #70 merges as `8d89550` with the exact reviewed tree. One automatic Production
build passes actual migration/all-payments gates, TypeScript and 115 pages.
Sentry archives (521/2,620 files) associate with the exact release; a real staged
client debug ID resolves to its new archive. Seven staged pages and a genuine
Linux 512-pixel artwork response pass. Promoted that artifact once, verified six
completed mappings and unchanged unrelated aliases, then repeated the eight
read-only public checks and preserved apex redirect. Prior READY `cdea4a6` is
retained. The approved payment/refund and one-lobby checks remain unstarted;
no new Session, charge, refund or game record exists from this campaign yet.

## November 18 browser corrections verified locally; bounded new-flow packets refined

Dependency commit `72ce62a` passes the full local unit run, with 5,677 passed,
four existing skips and zero failures. Hosted lane 3 finds two background CSS
ordering snapshots and one audio fault fixture; the other three lanes pass.
Follow-up `99c297b` restores existing responsive controls with a scoped selector
and makes the outage fixture span the framework's automatic transport retry.
Rebuilt focused desktop/mobile background and audio recovery checks pass, as
does portrait/short-landscape Info. Reviewed Windows baseline changes only
catch up to the existing guarded purchase wording; Linux baselines/tolerances
are preserved. Lint passes again. The optimized public Clock responsive journey
passes through a temporary owned copy with only its development entry path
changed; that copy is removed. Follow-up hosted CI passes every job on
`99c297b`: 5,676 unit checks passed with five Windows/catalog skips, plus all
four Chromium browser lanes green (614 passed, 180 matrix/opt-in skips). Main
remains unchanged and the candidate worktree is clean. Publication and live
new-flow acceptance remain separately authorized boundaries.

The all-payments proposal now names the app's exact-order Admin refund action:
a direct Stripe refund would bypass its pending-refund binding. A bounded
owner-only aggregate confirms existing verified full-Admin authority. No role,
order, payment, refund or provider setting was changed. Prepared a separate
ten-minute one-lobby Ably check with create/join/end only, no gameplay or hard
deletion. All proposed live operations remain unsubmitted.

## November 18 full patched-runtime regression passed; operation sources preserved

The frozen `72ce62a` application candidate passes all 5,681 local checks at the
reported scope: 5,677 passed, four environment-dependent skips and no failures
or cancellations. Build/115 pages, clean lint, typecheck and focused checks pass;
its hosted run remains in progress. The existing Calendar/CI follow-up passes
all hosted jobs. Publication and two additional payment activations remain
unsubmitted.

Saved the already accepted backup source, tests, runbooks and sanitized service
receipts on a separate operations branch, preserving every committed historical
state/log line. Its synthetic Python check reports 45 passed and one optional
age fixture skipped; the accepted earlier real encryption/restore receipt is
retained. Added that suite to CI and its named npm scripts. No backup/restore,
pruning, monitor signal, mail or provider operation was replayed by this save.

## November 18 purchase scope and support owner confirmed; dependency patch started

The owner confirmed all three purchase flows are required before beta and will
monitor the public support inbox. Updated the guide. Current read-only Stripe
metadata confirms active Tax/one Ohio registration, the v2 six/twelve recurring
catalog and exact enabled webhook/API contract. No provider write or new payment
test occurred; deployed settings and the two additional flows remain to prepare.

A fresh production audit reports Next.js advisories applicable to Server Actions.
Prepared an environment-free isolated dependency branch with patched Next.js,
Sharp and major-10 Sentry. A sandbox install stalled and was stopped; the normal
native install completed with the established package patch applied. A new audit
reports no critical entries, with remaining high/moderate entries under review.
Validation remains pending and the approved public artifact is preserved.

## November 18 one recovery email accepted and CI runner incompatibility corrected

The owner approved one recovery-mail check for the existing Google-linked
account. Submitted once; the neutral public notice and actual Inbox delivery
agree. The branded message has SPF/DKIM pass and the correct HTTPS reset target;
the returned header has no DMARC result. Did not open/consume its credential or
change a password/method. The [receipt](audits/2026-11-18-account-recovery-mail.md)
states those limits.

Read the focused PR's failed hosted jobs: lint/typecheck/browser build pass, but
Playwright 1.60 rejects Ubuntu 26.04 before tests start. Pinned the four CI jobs
to Ubuntu 24.04 in follow-up `2ab17b7`. All 162 local harness checks pass outside
the sandbox after its browser-cache path was unavailable. Pushed the correction
for hosted validation; no second Production promotion or application runtime
change occurred.

## November 18 approved cancellation release and Calendar acceptance completed

After the owner's private identity verification, inspected the automatically
started build rather than submitting another. The restored Vercel CLI confirms
the exact project/team and provides authenticated candidate entry checks.
Production readiness gates, compilation, TypeScript and 115 pages pass. Sentry
accepted the build's maps under `cdea4a6`; its observed client debug ID matches
the new release archive. Promoted this existing READY Production artifact once.
All six mappings complete, the public host matches, and the prior READY release
is retained. The focused source is preserved in draft PR #69, without a merge.

On the published build, Cancel block removes the one synthetic Personal fixture
from upcoming blocks and removes its generic Google mirror. Both explicit busy
refreshes pass. One Disconnect reports Not connected; one equivalent reconnect
uses the same owner account, existing permissions and dedicated calendar. Final
status is ACTIVE, with the original primary selection. Provider inventory keeps
all original calendars, adds no second app calendar and contains no test mirror.
The bounded workflow finished before its deadline. Natural token expiry was not
tested. Updated the [receipt](audits/2026-11-18-google-calendar-live-test.md);
no new event, message, clinical read or purchase was introduced.

## November 18 focused cancellation publication approved and staged in Vercel

The owner approved publishing exact fix `cdea4a6` and completing the already
approved Calendar test. Pushed only its isolated branch. The automatic Preview
build uses that commit; it is not the Production candidate. Fresh alias and
dashboard reads preserve the previous public release. The installed Vercel CLI
cannot access the specified account scope, so switched to the signed-in normal
dashboard without changing CLI credentials. Selected Production Redeploy of
the exact commit, with no cache and the explicit no-custom-domain-assignment
note. Submission opens Vercel's identity-verification step. Owner handoff is
pending; no code or secret was requested/read, and the build must not be blindly
submitted again after verification. No public promotion has occurred.

## November 18 approved Google connection exposed missing block cancellation

Completed the fresh approved Google grant after the prior prepared state expired
without a connection. Actual scopes match the prepared packet. The app's ACTIVE
status/initial sync and provider inventory agree on one new owned dedicated
calendar, preserving every original calendar ID. Created the one approved
Personal test entry and read its single generic, correctly timed provider mirror
with no guests or personal fields. The test then found missing cancellation
controls, so prepared an isolated source fix with 45 focused/84 sync checks,
typecheck, targeted lint and the 115-page local optimized build passing. The
first full-lint naming diagnostic was corrected. Publication and remaining live
steps are pending; the single approved test fixture is retained. See the
[receipt](audits/2026-11-18-google-calendar-live-test.md).

## November 18 offered Calendar consent prepared after daily activation

Read the current signed-in public Calendar sync page: configured, Not connected
and Connect offered. Entered its normal OAuth route and selected the existing
owner account, reaching the returning-account Continue review. No grant was
submitted. Source review confirms the initial primary-calendar busy import and
dedicated app-created target. Prepared the
[bounded test packet](superpowers/plans/2026-11-18-offered-google-calendar-acceptance.md)
before requesting approval for ongoing access and one synthetic event. Existing
practice and Google calendars remain unchanged at this preparation stage.

## November 18 daily backup schedule, retention and owner alert activated

Under the owner's explicit continuation request, installed the reviewed daily
operator beside the accepted private NAS backup assets. Original script bytes,
image, export credential and recovery identity are preserved. Fresh provider
usage and the unused included Sentry Cron slot were rechecked. Created one
daily monitor and one owner-only alert connected to that monitor alone, leaving
the disabled application acceptance alert and unrelated rules unchanged.

Sent exactly one synthetic backup error check-in, without a database export or
application data. Sentry created the expected Cron issue and recorded one alert
trigger. The matching owner email arrived with SPF, DKIM and DMARC pass; the
vendor sending-subdomain mismatch in the first mail search was corrected without
sending another test. No inbox state changed.

Created one disabled DSM task with the verified unprivileged operator, then
enabled a temporary clock-triggered acceptance time. It ran once at 18:15 UTC
and completed in about 13 seconds. Its private result, second encrypted pair,
checksum and Sentry success check-in validate; the test issue resolved. Zero
copies were pruned, and all 40 existing containers are unchanged. Returned the
same enabled task to 03:00 America/New_York; saved next run is November 19 at
03:00 local. The first permanent overnight run remains future, not observed.
Saved private closeout/recovery instructions and the
[sanitized receipt](audits/2026-11-18-daily-encrypted-backups-and-alerts.md).
No billing, application deployment, schema or credential change occurred.

## November 18 external NAS access accepted after HTTPS/firewall activation

The owner confirmed all three requested workflows work on mobile data after
activation: DSM administration, Synology Drive and files. Record this as private
owner functional confirmation, not an agent inspection of their files or a full
Drive sync/write campaign. The HTTPS/DSM firewall preservation operation is
accepted; the earlier pending external check below is superseded. Screenshots
and readback receipts are retained. Daily scheduling, retention and Sentry
monitoring remain a separate pending activation.

## November 18 approved HTTPS and firewall sequence applied

The owner explicitly approved working HTTPS first and then a firewall while
retaining QuickConnect, Drive, files and remote administration. The existing
HTTPS QuickConnect gateway opens the correct NAS without a certificate warning;
the owner signed in privately. Verified desktop/Control Panel access, enabled
the DSM desktop HTTP-to-HTTPS redirect, let the normal web-server reload finish,
and re-read the saved setting. No certificate warning was bypassed and no public
port, DNS record, hostname identity, certificate or account credential changed.

Prepared and saved a separate firewall profile while preserving both original
profiles. Verified the actual NAS interface/source route before configuring a
physical-interface allowlist and deny fallback. Existing local access, required
web/DSM/Drive/Plex TCP ports and ICMP remain permitted; the private-tunnel/VPN
route has an explicit allow. Submitted activation once. A new secure connection
still reaches the authenticated NAS, and fresh profile readback confirms the
enabled state and saved physical/tunnel rules.

Local SSH, SMB, HTTPS and Drive accept connections. The existing hostname
certificate verifies with TLS 1.3. All 40 existing container identities/images/
states match the pre-change inventory. These are transport/configuration checks;
requested the owner's private mobile-data DSM/Drive/files check before claiming
all external client workflows accepted. See the
[receipt](audits/2026-11-18-nas-https-and-firewall.md) for diagnostic corrections,
the root-HTTP probe limit, private evidence and Docker/WAN scope limits.
No file, share, database, app deployment, daily backup/retention, Sentry monitor,
email or unrelated NAS setting changed. Daily activation remains separate.

## November 18 owner-requested NAS security review before daily activation

The owner supplied their ordinary DSM address and completed private sign-in.
An intentional page reload picked up the authenticated session. They then asked
whether NAS backups expose security risks. Inspected connection/certificate,
firewall, QuickConnect permissions and DSM-listed router mappings, without
clicking Apply, setting up router access or performing an external scan.

The [review receipt](audits/2026-11-18-nas-backup-access-review.md) records existing
HTTP management, disabled NAS firewall and enabled remote DSM/app/file access.
The default hostname certificate is within its displayed validity period, but
the IP URL fails hostname validation and the hostname route timed out. No browser
warning was bypassed. The router page is not proof of the full router/WAN policy.
Explained the added persistent read-credential risk, distinct from archive
encryption and the absence of newly opened backup ports. Requested the owner's
remote-use requirements before preparing changes that could interrupt services.

The owner clarified that remote Drive, files and DSM administration are all
frequent requirements from work and while travelling. Preserve the full remote
workflow; the earlier choices did not adequately convey the question's purpose.
Prepare secure connections and account/router protections around those uses.
No remote-access removal, VPN requirement or firewall change is approved.

The local daily preparation now passes 46/46 tests with zero skips and Python
3.8 parsing; default operation remains inert. The final source/configuration and
deadline checks passed. Closed the unsaved Sentry alert draft and left DSM's
firewall page open for review. No daily task, Cron monitor/alert, mail/check-in,
new export, pruning or NAS security/network change occurred. Activation remains
pending a reviewed access plan and exact approval; first restore/key custody
acceptance remain complete at their recorded scope.

## November 18 password-manager recovery copy confirmed and daily controls prepared

The owner chose their existing password manager, privately saved the whole
recovery identity as instructed, and confirmed completion. Verified the original
PC key still exists under owner/SYSTEM-only inherited access from the protected
directory without reading its value. No password-manager automation or secret
transmission occurred. Treat second key custody as owner-confirmed complete.

Prepared a [separate daily activation plan](superpowers/plans/2026-11-18-daily-backup-activation.md)
and local operator/retention code. Invented fixtures cover fresh-success-only
retention, keeping seven successes/seven days, corruption/link/orphan/race holds,
one attempt per day, minimal fixed-destination check-ins, failed monitoring and
scoped timeout cleanup. Read-only in-memory NAS validation accepts the existing
encrypted pair, refuses to treat its old success as pruning authority, and proves
native Python 3.8 deadline interruption/restoration. No NAS source/config was
installed and no job, export, deletion, monitor or notification ran.

Fresh Sentry billing shows zero of one included Cron monitors used. Inspected
the normal Cron setup form without submitting it. Existing NAS notification
tools/configuration are present, but no recipients were selected or mail sent.
The supported scheduler CLI exposes reads/run/delete but no task-creation command;
prepare creation through DSM rather than editing its private task database.
Daily activation approval and first scheduled-run acceptance remain pending.

## November 18 approved first encrypted backup and restore completed

Executed the owner's exact first-run approval within the 60-minute window:
new private NAS folders with effective owner-only ACLs, one pinned isolated
tool build, one dedicated SELECT-only login, one PC-held age identity, one
encrypted shared-database export and one network-isolated temporary restore.
No existing role/password, application data, plan, parent share permission,
service, schedule or traffic binding changed.

The one export completed in approximately 18 seconds with 2,250,739 ciphertext
bytes, zero stage errors/diagnostics and matching checksum readback. Streaming
decryption kept the recovery identity on the PC and produced no plaintext dump
file. The restore completed in approximately 6 seconds. All 135 tables, all 46
source migration names/checksums, extension/constraint checks and the specifically
owned test practice/owner/default-service/60-minute-variant fixture pass. Removed
only the temporary database container/tmpfs. All 40 pre-existing NAS containers
match the same-format original baseline. Kept archive/receipt, private config,
read-only login, tested tooling and recovery identity; removed the ephemeral
credential-transfer private key.

The [dated receipt](audits/2026-11-18-first-encrypted-backup-and-restore.md)
records the public-script permission correction without rebuilding, client TLS
1.3 proof after an unsuitable backend SSL measurement, Docker display-format
correction, caps and cleanup. Failed preflight observations remain in private
receipts. The source Dockerfile fixes public script readability for future
builds; the actual retained image used the identical read-only script mount.

Daily scheduling, retention and alerts remain uninstalled, pending second key
custody, fresh quota/headroom and a separately approved activation packet.
Unchanged provider usage counters do not measure this export's egress/compute.
The first database restore is accepted; recurring protection and complete site
outage recovery are not claimed. No commit, push or site deployment occurred.

## November 18 NAS feasibility checked and encrypted backup tooling tested

The owner confirmed the NAS is normally on 24/7. Reused the homelab's established
authenticated SSH transport for bounded read-only metadata, without staging or
running an existing mutation helper. Verified Docker/Compose, storage capacity,
memory/swap support and absence of the proposed runtime directory. System
PostgreSQL is 11.11, so the prepared tool uses a separate PostgreSQL 18.7 image.
The parent directory is broadly writable; new private directory ownership/modes
and effective Synology ACLs must pass before writing secrets. The NAS does not
support CPU-quota/PID-limit controls, and the example does not claim otherwise.

Resolved the official public PostgreSQL image digest and age 1.3.2 release/checksums.
Prepared a one-shot Python export-to-age pipeline, inert Docker/Compose examples,
operator documentation, named npm commands and CI fixture step. It uses private
libpq files rather than URL/password arguments, direct TLS and read-only session
defaults, bounded output/time, an OS-released lock, exclusive ciphertext/receipt
publication, sanitized failures and ownership-bound partial cleanup. There is
no installed scheduler, automatic pruning, credential creation or restore command.

The initial local sandbox fixture attempt failed four file-publication cases
because Windows denied hard links. An inert diagnostic identified that boundary;
the same protections passed outside the sandbox. After adding version/credential
checks, all 17 tests pass with zero skips, including a genuine age round-trip and
wrong-key rejection using ephemeral invented fixture keys. No production data or
key was used. The NAS's Compose parser accepts the example with invented mount
inputs, without creating files or starting containers. All 162 existing CI-harness
checks pass outside the sandbox, with zero failures/skips. The initial sandbox
run lacked the redirected browser cache; no application change or assertion/
timeout weakening was needed. Hosted CI remains pending.

One explicitly scoped catalog-only query confirms the application database's
schema/ownership/RLS/extension prerequisites. No application row or credential
was read. Prepared the first export/isolated-restore approval packet and an
ignored private target/cap record; no NAS/provider/export/restore write followed.
The owner's 24/7 answer is a readiness fact, not a credential or export grant.

## November 18 test-calendar approval executed and backup scope clarified

The owner selected separate encrypted backups on the existing Free plan. They
prefer `Massage Lab` for their working calendar but approved `AtmoShaper Studio`
for testing. Fresh browser readback confirmed the prepared test name and signed-
in creation form before one submission. The mutation completes at an empty
calendar; no duplicate submission was made while navigation was pending.

Subsequent route reads confirm the persisted test practice name, zero availability
rules/blocks/named schedules and the default service with one variant. Google
Calendar connection controls become available after the owner membership exists.
Saved a visual receipt. No appointment, working hour, Google grant, real-calendar
rename, deletion or unrelated account setting changed.

Before selecting a storage location, the owner correctly asked what was being
backed up. Explained shared hosted database recovery for all users, distinct from
one user's account export, Git source, hosted media and device-local professional
records. Schema/privacy-document review additionally identifies account-saved
wellness logs as a separate hosted consumer-health domain included in a complete
database backup. No production row or secret inspection was needed.

Prepared a [scope-first encrypted-backup plan](superpowers/plans/2026-11-18-encrypted-database-backups.md)
with the daily/seven-day proposal, key custody, quotas, private runner/storage,
bounded export/restore acceptance and separate activation authority. No storage
choice is inferred from the unanswered premature location question. No export,
key, credential, scheduler, restore or billing change ran. The approved calendar
creation is complete; Google consent and operational recovery remain separate.

## November 18 offered account, playback and exact database attachment checked

The owner completed private Google sign-in after the normal Chrome login page
was brought into view. Read the signed-in onboarding/account shell, Security,
App layout and Data & sync surfaces. Used the existing Skip for now link rather
than saving onboarding answers. Security shows the existing linked method;
clinical sync remains explicitly off. No credential, setting, membership or
clinical record was changed or opened.

The account has no practice calendar. Availability shows the setup prerequisite,
and the Google sync page withholds connection controls without provider access.
Source review confirms creating the first practice also adds its owner and a
default 60-minute service/variant. Prepared the unsaved first-practice form and
requested exact creation approval or a preferred name. No scheduling row or
Google grant was created.

The normal Vercel Storage/connected-projects page confirms Production attachment
and an exact provider-project match to current scoped Neon metadata. The branch
remains ready with six hours of history; schedule/snapshot reads are empty.
Current primary documentation confirms paid-only automatic snapshot schedules.
The installation's plan preview explicitly covers both products; cancelled it
with no billing change. Requested a backup approach preference before preparing
credentials, an export destination or paid operation.

Live music checks reached Playing for Drone and Observable Streams. Both pause
and stop successfully; Observable Streams also resumes. Saved visual receipts,
stopped playback and closed the owned music/provider inspection tabs. No favorite,
media/catalog object, provider setting or deployed source changed. Physical audio
output, full-catalog/fallback and remaining offered journeys are not claimed.
Main and local HEAD still agree at reviewed `012952b`. The
[sanitized receipt](audits/2026-11-18-offered-account-playback-and-recovery.md)
records boundaries and pending decisions.

## November 18 recovery metadata distinguishes managed and legacy databases

The Neon connector's default organization initially selected the legacy resource.
Read-only organization discovery distinguishes the console-managed Launch
organization from the Vercel-managed Free organization. Explicitly scoped reads
then identify the separate AtmoShaper database project: one ready root main
branch, 21,600 seconds of history, no snapshot schedule and no listed snapshots.
The legacy production branch is archived and is not used as this app's recovery
proof. No database rows, schema, credentials or connection strings were read.

The latest Vercel integration-configuration endpoint returns 403, so fresh
store-to-project metadata agreement still needs its normal dashboard route.
No unchanged retry, credential export or CLI-auth workaround followed. Native
snapshot APIs are exposed, but current Free-plan eligibility/cost and a bounded
isolated restore remain unverified. No backup schedule, snapshot, branch, restore
or plan/billing write occurred. Prepared the
[next account/recovery plan](superpowers/plans/2026-11-18-beta-account-and-recovery.md)
while the owner signs in privately to the open app tab.

## November 18 Sentry connected, maps matched and original token revoked

The one approved corrected-token rebuild reaches READY on exact reviewed main
`012952bd9b21f6c49e9063d8a235d9bae65d0327`. Sentry's existing AtmoShaper project
shows two new archives containing 523 and 2,080 files, linked to that exact Git
release. Seven candidate browser entry points pass before the one approved
public promotion. Fresh complete alias readback places all six live names on
the same artifact, preserves the apex 308 redirect and changes no unrelated
mapping. All seven public HTTP checks return 200 with no generic server-error
surface and a null signed-out session.

Six bounded public client chunk reads find no organization-CI-token-shaped
value. The first check looked only for older Sentry debug-ID globals and found
none; direct source inspection identifies the native Turbopack `_debugIds`
registration and `debugId` comment. The corrected parser extracts the public
ID, and Sentry's exact-ID filter returns the matching new archive and release.
The paired anonymous map request returns 403; it is not publicly retrievable.
No deliberate error, support diagnostic, trace/span or email test was sent.

After replacement verification, revoked only the original operation-owned CI
token under the user's exact approval. Reloaded list readback confirms zero
active original-name tokens and one active replacement. The initial truncated-
token build stays unpromoted and is not source-map evidence. All credentials
remain concealed; no secret was printed, saved locally or committed. The prior
verified public artifact remains the rollback reference.

Read-only email-provider metadata also confirms the configured account domain
is verified with sending enabled, receiving disabled and open/click tracking
disabled. This is sender-configuration proof, not delivered account mail or
deployed SMTP-credential agreement. Representative Signature/generative audio
protocol checks retain their limited scope. Recovery targets are now accepted,
while adequate backup coverage and a bounded restore remain unfinished.

Opened the public app's login page in regular Chrome and handed it to the owner
for private sign-in before account/settings acceptance. No password or code is
requested in chat, and no clinical record is opened. See the
[Sentry receipt](audits/2026-11-18-sentry-runtime-and-source-maps.md).

## November 18 complete-token replacement saved and one retry started

The owner explicitly approved the prepared replacement, correction of the
Production secret, one retry build/upload/verified publication and revocation
of only the original operation-owned token after verification. An inert check
proves the corrected transfer preserves standard-base64 plus/slash characters
and rejects truncation. The new visible value validates a complete 43-character
secret component before storage; no actual token value was printed or saved.

Created `atmoshaper-vercel-sourcemaps-v2`, same native CI scope, and updated only
the existing Production Secret. Requested one fresh exact-main rebuild from
the currently published reviewed artifact. No attempt to reuse the unauthenticated
artifact or independently upload its removed maps occurred. Upload acceptance,
publication and original-token revocation remain pending. Fresh alias readback
after the first attempt preserves all six live mappings and unrelated aliases.

Representative read-only hosted-media checks also pass: one committed Signature
Opus payload returns 206/64 bytes with audio/ogg and allowed browser CORS; the
branded generative Opus index returns 200 JSON; a nested sample through the exact
source-defined origin rewrite returns 206/64 bytes with audio/ogg and allowed
CORS. These do not establish complete catalog, visual or audible playback
acceptance. No media write, copy, cleanup or legacy change occurred.

## November 18 Sentry handoff truncation diagnosed before promotion

The first configured build reaches READY, but its SDK logs show HTTP 401
Invalid org token for release creation and source-map upload. The SDK logs
these failures without rejecting the complete Next build, so READY alone is
insufficient. The candidate is not promoted and no accepted map upload follows.

Root's extraction expression excluded standard-base64 plus/slash characters.
Sanitized shape comparison finds the captured secret component has 27 rather
than 43 characters. Sentry's primary token format confirms those characters
are valid. This is an agent transfer error; no application code defect or
provider failure is inferred. Normal browser Back does not recover the already
acknowledged one-time full value. No secret was exposed in this diagnosis.

Prepared `atmoshaper-vercel-sourcemaps-v2` with the identical native CI scope,
without submitting it. Correction needs one replacement credential, update of
the existing Production Secret, a fresh authenticated exact-source build, and
explicit revocation of only the original operation-owned token after success.
No duplicate credential, revocation or upload retry has occurred yet.

## November 18 final Sentry access approved and saved; beta recovery target chosen

The owner explicitly approved the dedicated organization CI token, all four
Production-only Vercel variables, native same-build source-map upload and
verified publication. Created the one named token with native `org:ci`, then
saved the build token as Secret and the existing DSN/org/project as Config in
only the AtmoShaper project's Production environment. Concealed row metadata
confirms all four; no private value was printed, stored locally or committed.
The terminal login was not read or exported. Existing legacy resources remain.

Fresh remote main remains `012952b`; its current public artifact is READY and
the complete six-alias mapping is saved as the new rollback reference.
Requested one authenticated exact-source Production rebuild with no build or
project-setting override. The build is running; source-map delivery, READY,
candidate acceptance and publication are not yet complete.

The owner selected yesterday's backup and restoration by the next day as
acceptable for beta account/settings/scheduling recovery. Clinical records
remain on each person's device. Read-only Neon project discovery found no
AtmoShaper-named project and one existing legacy-named project reporting 21,600
seconds of history. That is not verified current Production binding or proof
that the selected recovery target is covered. No rows, schema, credentials,
backup export, branch creation or restore operation was read/performed.

## November 18 final Sentry binding prepared with native CI-token scope

The owner asked to finish Sentry/source maps and continue remaining beta work.
Read the retained November 6 build-map handoff: the normal SDK needs effective
build authentication before its configured client-map cleanup, so uploading
after an unauthenticated rebuild is not the selected path. Current source
already has the runtime policy, org/project/token inputs and post-upload map
cleanup. No application source change is needed for the proposed native path.

Fresh UI reads confirm the existing active DSN, no organization auth tokens,
and no `SENTRY` matches in Vercel's project or linked-shared-variable scopes.
Prepared one unsaved organization token named `atmoshaper-vercel-sourcemaps`.
Its native `org:ci` scope covers source maps, release creation and code mappings,
and is organization-wide with no per-project restriction in the form. Prepared
the exact Vercel Production-only Secret destination without entering a token.
The existing DSN remains ephemeral and undisclosed. No terminal credential or
credential store was read or exported.

The [final Sentry packet](superpowers/plans/2026-11-18-sentry-final-binding.md)
records the required action-time security decision, four-variable binding,
exact-source build/upload/publication, readback and rollback. Source review
confirms Production environment fallback and normal Git release derivation;
fresh remote main remains `012952b`. All 76 installed-SDK/privacy tests pass,
zero failures/skips, in 20,842 ms. No deliberate event/email campaign is proposed.
No provider write or rebuild occurred in this preparation.

## November 18 current-source build passed and public site updated

The one owner-authorized exact-main Production build reached READY. Actual
build logs confirm read-only migration status and live recurring Supporter
readiness passed; the other two purchase flows remain disabled. Compilation
completed in 92 seconds, TypeScript in 84 seconds, all 115 static pages generated,
and Vercel reported the build complete in four minutes. Source remains exact
`012952bd9b21f6c49e9063d8a235d9bae65d0327` (PR #68).

Seven staged anonymous browser entry points passed: home, login, registration,
pricing, music, Calendar entry and null signed-out session. Requested public
promotion once under the owner's additional deployment authorization. Fresh
complete alias readback confirms all six live aliases on the new artifact,
zero changed unrelated mappings and the preserved apex 308 redirect to www.
All seven post-promotion anonymous HTTP checks return 200 with application
content and no generic server-error surface. The public home also renders in
the owner's regular Chrome. The prior READY source `38d0ded` remains the saved
rollback reference; no rollback was needed. Local documentation/test-scheduling
changes remain uncommitted and were not substituted for the reviewed Git source.

The build reports no Sentry upload-auth token, so its source-map upload and
release creation did not run. The two approved privacy/security corrections are
complete; final error-reporting/build binding remains separate unfinished setup.
No new Sentry error/email campaign, Production game, account write, Calendar
sync, schema migration, payment, media mutation or hosted restore was performed.
This is successful configuration and code publication, not full beta acceptance.
See the [sanitized receipt](audits/2026-11-18-live-service-binding-and-site-update.md).

## November 18 service binding approved and saved; current-source build started

The owner explicitly approved all three prepared service changes and separately
authorized updating the deployed site to the completed application work.
Created one dedicated key in the existing main Ably app. Fresh reloaded
capability metadata confirms publish/subscribe/presence on `anatomime:*` only.
Saved the new credential as project Secret `ABLY_API_KEY`, Production only, and
verified the saved concealed row. Credential transfer used ephemeral browser
tool memory; no key was printed, placed in a local file or committed. Existing
keys and both apps are preserved. No plan or billing configuration changed.

Applied and reloaded the two AtmoShaper Sentry controls: JavaScript source
fetching is disabled and outbound certificate verification enabled. No
organization-wide or legacy-project setting changed. This configures the
project's protections; it does not establish runtime ingestion or source-map
upload authentication.

Fresh remote main remains exact `012952bd9b21f6c49e9063d8a235d9bae65d0327`.
Vercel's actual standard build command, Node 24, main branch and manual public
promotion are verified. All six current live aliases still point to the saved
October 7 artifact from source `38d0ded`. Requested one fresh Production-target
rebuild of the existing exact-main artifact with current configuration and no
project-setting override. The initial accepted result is initializing with the
expected source. Build gate readback, candidate checks and public promotion
remain pending. No schema migration, real payment/email, synthetic game/error
event, media mutation or deployment of uncommitted application source occurred.

## November 18 regular Chrome restored and live binding packet prepared

After the owner's full app restart and exact Ably-tab attachment, the browser
extension successfully controls the existing regular Chrome profile. Signed-in
dashboard reads work without copying browser credentials. Older inactive-tab
selection and background screenshot paths were unreliable; fresh task tabs in
the same profile and supported accessibility controls provide working access.

Verified the existing main Ably app plus its separate verification app. Existing
subscribe-only and broad Root key capability metadata were read without showing
or copying key values. Prepared one unsaved dedicated-key form with only
publish, subscribe and presence on `anatomime:*`, preserving the existing
one-room client-token contract. No persistent credential was generated.

Verified the existing AtmoShaper Vercel project and linked Git repository.
Targeted project and shared-variable searches both show no `ABLY_API_KEY`.
Prepared a project-only Secret variable form for Production, leaving its value
blank and Save untouched. The project overview shows the public Production
deployment still at October 7 source `38d0ded`; newer READY Production-target
metadata does not establish current public routing. No deployment was requested.

Sentry's AtmoShaper project inherits required default/server-side scrubbers,
IP removal and disabled minidump storage, with its six existing advanced removal
rules preserved. Automatic JavaScript source fetching is enabled and outbound
TLS/SSL verification is disabled. Prepared the exact project-only corrections;
no Sentry value, credential, organization setting or legacy project changed.

The [service-binding packet](superpowers/plans/2026-11-18-live-service-binding.md)
records creation, secret destination, readback, stop/rollback and remaining
activation boundaries. Browser forms are retained for the owner's exact
approval under AGENTS.md. Local review screenshots contain no credential values.
No provider write, database operation, synthetic event, email, payment, media
change, deployment or public promotion occurred.

## November 17 browser startup failure traced to a stale user override

The owner asked to continue service binding and be guided through connecting
the browser. Clarified that the bounded local test runner affects only test
scheduling, not the live application. A fresh controller reset reproduces the
app-server launch failure before Chrome access. The installed Codex CLI and
its app-server help run normally.

Selected path-only diagnostics show that `CODEX_CLI_PATH` is a stale per-user
override inherited by this process and points to a nonexistent executable.
The app-managed runtime, command resolution and running CLI agree on the
current working executable. No credential/configuration files or private
browser state were read in this diagnosis. OpenAI's current browser guide
provides the normal restart/profile/Computer Use reconnection flow.

Saved and verified a backup of that single environment value under ignored
`output/beta-readiness/`, then removed only the obsolete per-user override and
confirmed its absence. No runtime binary was copied, replaced or patched; no
browser security or service setting changed. Full owner-led app restart and
a successful controller retest remain required before claiming reconnection.
Existing regular-Chrome sessions can remain open. Service binding is still
pending; there is no new provider-write or deployment result.

## November 17 beta-readiness work resumed on integrated main

The owner returned to finish the existing documented feature set for a small
beta and confirmed no new features are being added to this pass. The chat's
attached checkout was still on a September branch. Preserved it, its untracked
images, and the separate migration worktree's unfinished November records;
created isolated local branch `codex/beta-readiness-20261117` from exact verified
main `012952bd9b21f6c49e9063d8a235d9bae65d0327`.

Routine connector reads confirm no open PRs and the existing successful main
CI run with all seven jobs passing. Vercel reports a READY Production-target
artifact with the same source; public routing and effective service bindings
were not established. Its truncated environment-list response cannot prove
absence of omitted keys. No secret values were requested or documented.

Installed the exact lockfile, including the existing package patch, and passed
local Prisma generation and schema validation using a dummy local connection
setting, without connecting or migrating. Fresh full-suite, lint/typecheck and
local build checks are underway. The
[resumption plan](superpowers/plans/2026-11-17-beta-readiness-resumption.md)
keeps completed scoped evidence distinct from remaining offered-artifact,
service, payment, media, recovery and final-release work. No existing campaign
or expired operation window was replayed; no external setup write or public
release occurred.

The first default unit run encountered Windows subprocess and native browser
failures while the machine had about 400 MB of free memory, and was stopped by
terminating only its verified owned runner tree. Both failed groups then passed
in isolation: Calendar 46 passed/one platform skip and commerce fixtures 23
passed. Added `test:beta` to run all existing test files with concurrency two;
no assertion, timeout or runtime behavior changed. Full lint and typecheck pass.
The complete bounded suite then passed: 5,663 total, 5,659 passed, four skipped,
zero failures/cancellations and 999,775 ms. Both attempts remain retained in
ignored local logs. Local production-mode webpack build then passed with live
credentials removed from its process: compilation, TypeScript, 115/115 static
pages, page optimization, build traces and the route table completed. The
Production migration/Stripe gates correctly skipped locally. All 52
desktop/mobile Chromium anonymous-route smoke cases then passed in 3.6 minutes,
with zero skips/retries, against that ordinary build with the repository's
inert provider/server environment and intercepted external resources. This is
local rendering/network-health acceptance, not real provider, hosted playback,
signed-in, account-email or payment proof.

The owner requested regular Chrome or Codex's native browser for service access.
Native browser/desktop control failed before dashboard inspection; the native
tab-open requests were queued, and the requested regular-Chrome pages opened.
The unused task-owned automation-browser login tabs were closed. No private
browser cookies or credential stores were extracted. Owner-provided Sentry
billing screenshots confirm organization-level Developer/5,000 included Errors,
five accepted and zero dropped for the displayed October 20–November 19 period.
The warning is uptime-monitor capacity, not exhausted Errors. Sentry's current
[pricing comparison](https://sentry.io/pricing/) publishes a 30-day Developer
lookback, and its [free-plan help](https://www.sentry.help/en/articles/13965037-can-i-set-up-an-on-demand-pay-as-you-go-budget-for-my-free-developer-plan)
states that pay-as-you-go overage is unavailable on this tier. Those public
plan facts close the billing-policy question, without pretending an effective
project retention setting was visible or establishing app-specific ingestion or
privacy. Recovery objectives remain undecided after clarification of the backup
question; no restore or backup operation has run.

The owner's Ably package screenshot confirms the existing Free resource-based
account package: six million monthly messages, 200 peak connections and 200
peak channels. The displayed MAU migration offer is separate from the observed
current package; no plan migration or billing change occurred. Actual usage,
runtime-key role/binding and the missing offered context remain separate facts.

Final documentation/server-workload contracts passed 16/16, diff hygiene passed,
and the owned browser-test port had zero remaining listeners after teardown.
All changes remain local on the isolated beta branch; original worktrees and
both public services are preserved. No invite-readiness, provider binding,
database restore, purchase activation or release is claimed by these checks.

## November 18 beta security candidate prepared with local checks passing

An audit during beta continuation found applicable framework security fixes.
Updated the isolated runtime dependency set and its nested-version regression
floors, retaining aliases, schema, provider contracts and normal navigation.
The installed production audit changes from 17 entries including critical/high
reports to eight moderate entries with zero critical/high. Documented residual
build-tool and separate development-only findings without claiming universal
reachability clearance. Prisma generation/validation, typecheck, clean lint,
19 dependency/artwork/inert-email checks and 76 SDK/privacy checks pass.
The optimized build passes compilation, TypeScript and page generation, with
provider gates correctly skipped locally. The complete provider-free suite
remains running. See the
[audit](audits/2026-11-18-beta-dependency-security.md).

The owner's first-beta scope explicitly includes all three purchase flows and
the existing public support inbox, which the owner will monitor. No provider
write, live payment or second release occurred during this source preparation.

## November 18 live Calendar acceptance and supported CI runner follow-up

Published only the separately approved `cdea4a6` artifact after real Production
gates, Sentry map association and seven staged entry checks. All six promotion
mappings complete and the previous READY build remains intact. Public Cancel
block cancels the sole fixture and removes its Google mirror. The approved two
refreshes, one Disconnect and one equivalent reconnect pass, preserving the
dedicated target and all original calendars, finishing ACTIVE within the window.
No new test event or broader permission was introduced.

The PR's hosted build, lint and typecheck pass, but Chromium installation fails
on Ubuntu 26.04 before tests execute. Logs identify the pinned Playwright 1.60
OS incompatibility. Pinned all CI jobs to Ubuntu 24.04 and documented the reason;
no browser/dependency upgrade or application runtime change is included. The
local CI harness passes all 162 checks outside the sandbox, whose browser path
was unavailable. Hosted
acceptance of this CI follow-up remains pending.

## November 18 focused personal blocked-time cancellation fix

The approved Google connection and synthetic outbound event work on the public
site. The test found no personal-block cancellation control, so prepared a
focused fix from current main without incorporating unrelated beta work. Added
an owner/own-therapist form on Availability > Blocked time and a locked server
action that preserves history and reports any post-commit Google failure.
Forty-five focused and 84 existing sync checks pass, with typecheck/targeted
lint; the local optimized build passes compilation, TypeScript and all 115 pages.
Its Production-provider gates correctly skip locally. Publication and the remaining approved live
journey are pending. No additional event, calendar or credential was created by
this source preparation. See the [plan](superpowers/plans/2026-11-18-personal-block-cancellation.md).

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


## October 29 canonical readiness documentation consolidated

Corrected the offered repository's canonical entry points, which still started with October 25 pending review labels while its migration guide already described later integrated source and closed campaigns. Added a concise current-state checkpoint and this chronological delta, preserving every existing entry. Kept the existing wiki index and added only the reconciliation link; did not import the other worktree's index or unrelated dirty files.

The selected evidence covers recorded source integration through PR #66, narrow closed acceptance campaigns, verified four-copy disposition, the 576-check source-only encrypted helper repair, and the prepared service/recovery/staged-release documents. It does not claim a new remote/provider/runtime observation, actual encrypted-login/media success, all-payments activation or final public release. The migration remains incomplete on media delivery/catalog binding, deployed all-purchase readiness, service/recovery and exact-artifact/rollback/owner-release gates.

The full owner-controlled continuation chronology and four source records remain retained separately, pinned in the [reconciliation audit](audits/2026-10-29-migration-gate-reconciliation.md). This is selective consolidation, not an import of that complete history or a rewrite of earlier findings. No application, database, credential, provider, Windows permission, publication or public-site operation accompanies this documentation correction.


## October 25 Calendar review documentation follow-up

The included review through `45d382d` had no actionable comments or unresolved
threads; its documentation check reported 60% coverage. Added intent/constraint
comments to the four previously undocumented page helpers without changing
statements or behavior. All 14 focused tests pass. Publication remains within
the existing PR #55 review/fix loop; current-head CI and included review remain
required. No main merge, Production change or Sentry activation occurred.

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


## October 25 Chimer current-head review finding repaired

Validated CodeRabbit's stale-observer-state finding and replaced fixed layout
delays with retrying assertions for the actual changed state. Hide/show and
unmount verify clear/reacquire explicitly; font, viewport, toolbar and primary
mode checks require their new state. Only the component test and its inert
fixture changed. All 43 focused checks and named lint/typecheck pass, using cached
Chromium and fully intercepted requests. Initial cache-discovery and sandbox
browser-launch failures remain recorded; the read-only Defender recheck found
no additional detection. Publication uses the existing four-PR review/fix grant;
new-head CI/review remain pending, with no merge or Production/Sentry activation.

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

## October 25 Chimer follow-up integrated with final main; position-only regression fixed

The approved PR #44-51 merge batch completed at main `af5373d`, with final CI,
READY hosted candidates and baseline routing verified. Reused the clean owned
Chimer checkout to create `codex/chimer-main-integration` from that main and
cherry-pick the original local repair; the original `68a116f` branch is retained.
The integration preserves all 80 page routes, 62 API handlers and the reviewed
Calendar changes. A source inventory is not whole-site runtime acceptance.

An initial focused check failed at 320px. A deterministic real-shell regression
then reproduced the actual missed case: inherited portal styles can move controls
without changing their dimensions or firing resize. The layout owner now also
observes class/style and child mutations in the portal controls' subtree, outside
its own display reservations, and disconnects that observer on disposal.
Diagnostic geometry/screenshots precede assertions. The old helper fails the
new regression; the repaired suite passes all 41 checks.

Integrated validation also passes 46 Calendar checks with one POSIX-only skip,
named focused lint, normal build TypeScript and the full inert-provider build.
A first lint wrapper timed out at 90 seconds without a terminal lint result;
that failure remains recorded. A distinct lint invocation completed successfully
in about 94 seconds with zero external attempts. The built app passes 16 cases
across four viewport sizes using actual DSEG7 Modern and saved Digital settings.
Inspected phone, landscape/settings and desktop screenshots preserve primary
display clearance and the existing landscape settings-sheet priority.

All owned validation processes are closed. Removed only the checked source/build
snapshot, its generated archive and one dependency junction after confirming
16 current runtime/test inputs match. Shared packages, generated Prisma schema,
receipts and screenshots are retained. No provider/database request, account,
game, payment, configuration change or source publication occurred. The local
follow-up needs its own publication/review decision; the completed merge batch
and broader migration release gates remain distinct.

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

This is the chronological log for the fresh AtmoShaper repository. Read [project-state.md](project-state.md) first for current truth. Complete development history before this bootstrap remains in [`dsbowersock/massagelab`](https://github.com/dsbowersock/massagelab); consult the [source-locked MassageLab project log](https://github.com/dsbowersock/massagelab/blob/e74045c2fc85c2cb4df176fdb1aff2137c4d9848/docs/project-log.md) rather than copying that history here.

## 2026-10-09 — Publish draft PR #43 and correct its first review findings

- The owner approved the prepared media/monitoring snapshot, ordinary CI/Preview,
  fresh Codex/full CodeRabbit reviews and valid owned fixes. The exact `fd50482`
  snapshot was published as [draft PR #43](https://github.com/dsbowersock/atmoshaper/pull/43)
  at 22:55 UTC. Publication does not approve merge or Production rollout.
- At that initial head, Preview is READY and Browser build passes against main
  `357095d`, including 115 static pages and the merged runtime artifact. Codex
  completed at 22:58:59 UTC with no major issues. Full CodeRabbit completed at
  23:01 UTC across all 26 files; its command reply confirms full review finished.
  These are dated initial-head receipts and become historical after a new head.
- The first full review found two valid documentation issues. The source follow-up
  removes completed DNS staging/readback/TTL decisions from open gates and records
  the verified export backup, while preserving old-zone completeness, fresh
  delegation/DS/collision checks, propagation, exact rollback and separate activation
  approval. Sentry guidance now describes the implemented telemetry setting and
  distinguishes the draft Preview from the unchanged live public artifact.
- Initial touched-function docstrings were 77.42%, below the configured 80% gate.
  Eight focused helper comments explain intent and constraints; the hosted gate
  must independently verify the follow-up. Two missing heading separators are
  corrected. Current state and morning review now record the completed approved
  publication instead of requesting it again.
- Follow-up validation passes all 16 documentation/workload checks and lint.
  All 223 relative targets across twelve changed Markdown files resolve; added
  documentation privacy/frozen-value and whitespace scans pass. Syntax-aware
  comparison of five script/test files confirms only comments changed. Completed
  provider acceptance and full local suites are not repeated for these changes.
- Latest-head CI, exact-SHA READY Preview, fresh Codex and full CodeRabbit coverage
  with no actionable threads and passing applicable pre-merge gates remain required.
  Keep the draft unmerged. The initial full-review cooldown is measured from its
  successful trigger; do not duplicate requests while a review is pending.

## 2026-10-09 — Complete the approved staged DNS export and backup

- The owner supplied the downloaded pending-zone export. Local verification at
  16:20 UTC matches all eight full record values against the frozen approved
  BIND file and preservation values, including MX priority 10, TTL 300 and four
  explicit DNS-only tags on eligible records. No proxy repair or reimport is
  needed.
- Its two generated NS entries match the assigned Cloudflare zone nameservers;
  the single SOA has the expected owner and structure. These are zone scaffolding
  and do not change or authorize live delegation.
- A byte-identical export backup and hash/comparison receipt are verified in the
  existing owner/SYSTEM-protected operation folder. The original download remains
  intact. Earlier local parser attempts stopped before backup and made no provider
  requests; their repaired directive/TTL assumptions are recorded privately.
- DNS staging/import/direct readback/export are complete. The earlier dated
  Namecheap authority receipt remains the live-authority evidence; this local
  comparison did not refresh it. Complete old-zone inventory, fresh parent/DS
  proof, exact propagation/rollback and separate nameserver approval remain gates.
  No provider, registrar, DNSSEC, media or hosting change occurred.

## 2026-10-09 — Verify the owner's eight-record Cloudflare staging

- The owner imported the approved preservation file into the existing Free zone.
  Screenshots show all eight rows as DNS-only with five-minute TTL, including
  both CNAMEs and all three TXT records. Its four explicit proxy tags override
  the accidentally selected proxy-import checkbox; no repair/reimport is needed.
- Fourteen direct queries at the two assigned Cloudflare authorities match all
  complete record values and TTL 300, including MX priority 10. Fourteen queries
  at the two current authorities preserve those values. Direct/recursive NS
  checks retain Namecheap; all four pending SOA/NS controls pass.
- The local readback writer first stopped on a PowerShell literal; the subsequent
  record adapter rebound its pipeline object within a switch. These failed local
  comparisons remain historical. The explicit-answer adapter passes four invented
  type cases before the successful full-value readback; no settings changed.
- The staged export/backup remains pending. Full legacy-zone completeness, fresh
  parent/DS evidence, exact propagation/rollback and separate nameserver authority
  remain required. No registrar, DNSSEC, media binding, hosting or agent provider
  write occurred. Keep Continue to activation untouched and do not repeat import.

## 2026-10-09 — Complete the approved Ably read-only inventory

- The owner completed a replacement hidden-input capture. The authenticated
  thirty-day token has exactly `read:app`, `read:namespace` and `read:stats`;
  the earlier broader/missing grant stopped before resource inventory. Local
  replacement preserves the original encrypted evidence and cumulative budget.
- Complete app metadata identifies one enabled `atmoshaper` app requiring TLS,
  in the authenticated account. Its complete channel-rule list is empty. Two
  bounded completed hourly statistics windows return no rows; this is not
  all-time usage, quota, billing or actual game acceptance evidence.
- Native helper repairs isolate the child PowerShell built-in modules and decode
  flat JSON arrays correctly. Thirty-six offline boundary cases pass with
  invented responses. Eleven of the twelve approved GET reservations are used,
  including unsuccessful attempts. No app key, token value, raw response, game
  traffic or provider write is retained or dispatched by this inventory.
- The [binding plan](superpowers/plans/2026-10-09-atmoshaper-ably-binding.md)
  prepares the existing app, isolated verification and server-key scope. Hosted
  binding, quota/ownership checks and actual host/phone/reconnect acceptance
  remain separately gated. Token setup is complete; do not repeat it.
- The morning review marks this owner step complete. The previously approved
  eight-record DNS staging remains pending; nameserver activation is unapproved.
  New source publication/review and the wider migration gates remain open.

## 2026-10-09 — Prepare a count-only anatomy media inspection

- Current source has a narrower reviewed BodyParts3D flashcard metadata loader
  and a broader entity-detail media query. The upload base affects future
  uploaded URLs; it cannot rebind existing catalog values. The new
  [inspection plan](superpowers/plans/2026-10-09-atmoshaper-anatomy-media-inspection.md)
  records both consumer boundaries without choosing a migration prematurely.
- Protected proposed SQL examines ten schema fields, then returns only fixed
  counts for all catalog media and the study-loader cohort. It excludes raw
  rows/URLs/IDs/notes, metadata JSON, clinical/user/Calendar/ROM/test tables and
  every write. Read-only/snapshot/time/output guards and exact target/read
  authority must precede dispatch; deployed credential/branch binding remains
  unproved.
- The existing independent-resource metadata matches the private candidate
  target. Neither proposed query was executed or engine-validated. No database,
  application, provider, media, seed or backfill operation occurred; source and
  query hashes are retained privately. Counts, real delivery and consumer
  acceptance are still outstanding.
- Local validation passes all 16 documentation/workload cases and 210 relative
  targets across eleven changed Markdown files, with zero added-source private
  references or whitespace errors. All ten proposed field types match local
  schema declarations; query hashes and static read boundaries pass. SQL engine
  validation and target queries remain unexecuted.

## 2026-10-09 — Prepare both Chimer delivery bindings without activation

- The metadata-only command resolves all 1,476 published renditions and 84
  vertical posters through the actual runtime helpers. The complete approved
  84-background release declares 1,728 distinct objects and 862,078,635 bytes;
  these counts do not newly verify remote payloads.
- Independent comparison with the earlier 83-entry index checks the actual
  fallback module. All 593 URL references, covering 255 distinct declared URLs,
  rebind by origin alone while IDs, geometry and checksum metadata remain intact.
- The two bases use different namespaces. The published base includes the
  approved release revision; fallback retains its earlier namespace. Production
  source defaults do not activate the published catalog. Adding a previously
  absent setting would activate it and requires exact authority and acceptance;
  this command has not inspected current hosted values.
- All 45 focused cases pass, including seven new full-plan/default/drift cases
  and existing preview contracts. Lint/typecheck pass. The protected journal
  retains the no-write plan and source hashes. No runtime declarations, hosted
  setting, media payload, application, provider or live Clock changes occur.
- All 16 documentation/workload cases, 198 relative targets across ten changed
  Markdown files, added-source privacy and whitespace checks pass on this local
  snapshot, including new untracked source files. Publication, DNS/R2 delivery, published-path
  activation and real playback/legacy continuity remain separate gates.

## 2026-10-09 — Prepare the branded Signature catalog without media mutation

- The metadata-only command rebuilds the complete committed catalog for the
  proposed branded host using the existing release builder. All 51 concepts,
  450 source references, 410 payload identities and 1,800 rendition references
  remain intact. The 1,640 distinct format objects retain declared hashes,
  sizes, paths, rights, timing and browser format choices.
- Incoming raw and normalized metadata must both match the existing revision.
  Exact origin/content-addressed paths, repeated rendition owners and summary
  counts are checked. Changed URL values produce a new revision; idempotence and
  reverse rebinding reproduce the original catalog exactly. The established
  revision collation is preserved rather than creating a new digest contract.
- Default execution prints a no-write plan. Explicit output exclusively creates
  a new local file and cannot overwrite stranded evidence. The verified branded
  candidate is saved only in the protected operation journal. Current runtime
  data is untouched; no credentials/dotenv, payload reads, encoding, provider
  requests, uploads or bucket mutations occur.
- All 13 focused catalog cases pass, including seven new whole-catalog and
  boundary cases. The first reference-digest test used a different key collation
  and stopped; correcting that test to the established contract verifies both
  revisions and the intended ownership rejection paths.
- Final lint/typecheck and all 16 documentation/workload checks pass. Whitespace,
  added-source privacy and all 197 relative targets across ten changed Markdown
  files passed at that local Signature checkpoint; its exact commit and private
  candidate were saved before the later Chimer preparation.
- Signature candidate installation/publication, branded DNS/R2 bindings and real
  playback/legacy continuity remain later exact operations. Generative preparation,
  the two Chimer bases, anatomy and other independent-service gates retain scope.

## 2026-10-09 — Prepare opt-in Generative.fm branded delivery locally

- The runtime now resolves the index and nested sample destinations together,
  preserving legacy delivery when the new public build setting is absent or
  explicitly selects the old origin. The only additional accepted origin is
  the prepared branded public host. Invalid bindings stop before index requests;
  branded errors do not silently fall back and hide a failed cutover.
- Instrument/note keys, ordering, literal paths, queries/fragments and cached
  relative or other-origin references remain intact. Metadata is copied for
  rebinding rather than changed in place. Metadata and payload-prewarm caches
  include the delivery origin, including when the index itself is unchanged.
- Focused regressions exercise actual index fetching, the bounded provider and
  the transpiled runtime prewarm/cache path with invented responses and replaced
  audio/network dependencies. No application, audio graph, listener, provider
  or database starts. This covers one consumer family, not completed media
  independence; Signature audio, both Chimer paths and anatomy remain required.
- Final local validation passes 76 focused cases, including nine new delivery
  cases, and all 16 documentation/workload cases. Lint/typecheck, whitespace and
  added-source private-reference scans pass; all 196 relative targets across the
  ten changed Markdown files resolve. Hosted CI/reviews remain unpublished.
- Source publication/review, hosted build binding, DNS/R2 configuration and real
  playback/legacy-continuity acceptance remain separate gates. The public release,
  old URLs/objects, credentials and the owner's already-approved morning steps
  are unchanged.

## 2026-10-09 — Approve scoped Ably access and prepare the morning review

- The owner approved the existing thirty-day, three-read-capability Ably packet,
  then asked to continue within existing authority and collect questions for the
  morning. Its hash-verified hidden-input window is open; owner token entry remains
  pending. No new token, provider GET, app key, game traffic or activation occurred.
- The protected inventory helper verifies the entire grant before resource reads,
  filters credential-bearing/unknown fields and durably reserves each request
  against the same twelve-GET ceiling. Twenty-four native offline boundary cases
  pass using invented responses, without credential or network reads. The older
  standalone token preflight is not additionally executed.
- The [morning review](superpowers/plans/2026-10-09-atmoshaper-morning-review.md)
  consolidates already-approved Ably/DNS owner steps, separate source publication,
  and missing provider/recovery/acceptance inputs. Current hosted main still matches
  the completed PR #42 merge, and no hosted PR exists for the owned source branch.
  These reads do not reopen the completed review loop.
- Normal Calendar Disconnect is an application connection deletion, not Google
  grant revocation or dedicated-calendar teardown. The later actual public journey
  must identify its own eligible account, synthetic state and cleanup intent;
  no real appointments, role grants or earlier completed acceptance are repeated.
- No push, source publication, Production build/promotion, nameserver/media change,
  collection/upload/notification, payment, database write or legacy retirement
  follows from the overnight continuation instruction.

## 2026-10-09 — Prepare scoped Ably management access

- No existing CLI package, default Ably config or Ably environment setting is
  present in the checked paths. Inspected official source requests full OAuth
  access and can save an app key. The narrower prepared packet asks for one
  thirty-day token limited to app/channel-rule metadata and aggregate statistics;
  existing app keys, game traffic, resource writes and activation are excluded.
- Hidden-input DPAPI capture and fixed-host token preflight helpers are prepared
  in the existing owner/SYSTEM-protected journal. Native synthetic encryption/
  decryption passes with invented input and its scratch removed. Preflight syntax
  passes; no real token is captured and no provider request or login is started.
- Exact access approval and owner capture are pending. This preparation does not
  establish Ably's current app inventory, billing or operational readiness. DNS
  staging approval remains unchanged; owner import is still pending. Source HEAD
  remains unchanged and new source publication remains separately gated.

## 2026-10-09 — Identify the independent Production database resource

- Current Vercel metadata binds both Production database variables to the same
  owned, active integration store. Its external resource ID exactly matches the
  separate AtmoShaper Neon project, and its sole connected app matches this
  Vercel project. Complete native inventories distinguish retained legacy projects.
- The existing Neon credential directory works with the current CLI; no new
  login or grant was needed. Project/branch/compute metadata confirms one branch,
  one compute endpoint and a six-hour history window on the current Free plan.
  Private identifiers stay in the protected operation journal. No connection
  strings, schema, user rows, database connections or provider writes occurred.
- The connector's store 404 and the denied installation-resource route are not
  evidence of an absent database. The successful native store read resolves its
  identity. The first cursor-only pagination attempt stopped on a repeated cursor;
  the native CLI's short-page completion and matching inventories supply proof.
- Exact deployed credential/branch binding, admin/billing accountability, recovery
  objectives and scoped restore acceptance remain gates. No migration, restore,
  credential change or legacy retirement is authorized from this inventory.
  DNS owner import remains pending and source HEAD stays unchanged.

## 2026-10-09 — Prepare existing Sentry key and release prerequisites

- Fresh identity and exact-key reads verify the approved project, unchanged
  privacy and an existing active client key. Only its public DSN and necessary
  metadata are retained privately; no secret or replacement key is retained.
  Key-list pagination is not proved, so this is selected-key evidence only.
- Its key-specific rate limit is unset; actual plan quotas, retention and billing
  ownership remain open. The documented project repository-link list is empty.
  Source-map upload does not inherently require a repository integration, but
  exact release/artifact identity and mapped-frame acceptance still require proof.
  Remote-loader Replay/performance defaults do not describe the bundled app SDK
  or authorize collection. No provider setting, event, upload or alert was sent.
- Pending Cloudflare authorities still answer all four SOA/NS controls and show
  no answers for the fourteen approved-record queries. Owner import remains
  pending; no import retry, nameserver change or hosting/media operation occurred.
  HEAD stays unchanged and all preparation evidence remains protected privately.

## 2026-10-09 — Prepare and approve eight-record staging; refresh payment metadata

- Fourteen current-authority queries match all eight known preservation rows.
  The first private shell comparison retained a record-object bug and stopped
  candidate generation; its failed receipt remains historical and is not proof.
  The corrected comparator requires nonempty exact sets and passes all fourteen.
- A protected BIND staging file and exact rollback/readback packet now preserve
  two A, two CNAME, one MX and three TXT rows. A separate local parser verifies
  contents, full TXT chunks, MX priority, DNS-only tags, TTL 300 and file hash.
  The owner explicitly approved staging these records only. Owner dashboard
  import is pending; no nameserver, media, hosting or DNS import was executed.
- All four SOA/NS controls at the assigned pending authorities pass, preparing
  direct record readback after import without another token setup. The native
  record-list API remains denied. Parent NS attempts remain unusable and are not
  counted as delegation proof; the existing authority and recursive reads retain
  Namecheap. Full old/staged inventories and later parent/DS/rollback proof still
  gate nameserver approval.
- The current Stripe account exactly matches the private prior purchase target.
  Read-only Tax metadata is active with a configured head office and one active
  registration; one page is complete. This does not prove product classification,
  all five one-time attestations, background provisioning/reconciliation or
  new-flow acceptance. No customer/payment rows or repeat live test were read/run.
- Current-state verification and its existing reviewed date ceiling advance
  together to October 9 with these new receipts. No application runtime/schema,
  source publication, deployment, payment, email or provider-setting write occurred.

## 2026-10-09 UTC — Verify the owner-created pending Free zone

- The approved owner-led stage is complete. Exact native readback verifies one
  pending full AtmoShaper zone on Free in the correct storage account. Its two
  assigned nameservers remain in the protected private operation packet.
- The owner-visible DNS table shows no records. The DNS-record API returns 403
  under the current grant; complete paginated API inventory was not obtained,
  correcting the earlier expectation that zone read alone would expose it.
  No replacement token, broader grant or repeated login was requested.
- Direct existing-authority and recursive NS reads match the saved Namecheap
  authority. A parent NS attempt returned a DNS server failure and is not counted
  as evidence. No DNS import, registrar, DNSSEC, media-binding or hosting change
  occurred. The empty pending zone does not mean the live zone has no records.
- Source HEAD remains unchanged. Readbacks and this stage receipt are protected
  privately. Do not repeat zone creation; complete the full legacy comparison,
  staged record access, TTL/proxy choices and exact rollback before separate
  record or nameserver approval.

## 2026-10-09 UTC — Authorize only the pending Free-zone stage

- The owner explicitly approved one pending Free AtmoShaper zone in the existing
  R2 account and settings verification. This does not approve registrar
  nameservers, live DNS, media bindings, paid plans or public hosting changes.
- The fresh native exact account/domain read succeeds with zero visible zones.
  Native session renewal completed without asking the owner to sign in again.
  Its grant remains zone-read-only; available Wrangler zone OAuth scopes do not
  provide a zone-edit grant. Agent dashboard policy remains unresolved.
- Creation therefore awaits the owner's same-account dashboard action: add the
  domain on Free, choose manual DNS entry, and stop with the zone pending before
  record entry or Namecheap nameserver changes. Existing read access can verify
  the resulting account/plan, assigned nameservers and complete DNS inventory.
  No replacement storage token, broad grant or repeated setup is required.
- Approval and the exact packet remain protected privately; creation has not
  occurred and all existing service/legacy routing remains unchanged.

## 2026-10-09 UTC — Complete parent DNS and proposed media-host preflight

- Direct DS reads at two .com authoritative servers return negative responses
  with a .com SOA authority and no DS; positive .com SOA controls succeed at
  both. This verifies the parent state independently of the owner's disabled
  DNSSEC toggle. Refresh this dated proof immediately before any DNS change.
- Direct reads at both existing Namecheap authorities return no records for
  either proposed media hostname across A, AAAA, CNAME, NS, TXT and CAA; root
  CAA returns no data and root NS/SOA controls succeed. One invented root-label
  A probe also has no answer. These scoped reads do not enumerate the full zone
  or prove absence of every wildcard or delegated record.
- A protected proposal prepares only one pending Free full zone in the already
  verified R2 account, followed by plan/account/nameserver and DNS inventory
  readbacks. No pending zone was created, and no paid plan, DNS record import,
  nameserver update, media binding or deployment is authorized by preparation.
  The eight known records remain preserved with TTL decisions still open.
- Four authenticated Sentry metadata GETs succeed. Project privacy controls and
  advanced rules remain unchanged; sharing is disabled and organization IP
  prevention is enabled. The project still has no first event, visible
  environments or release rows. Retention/quota/billing, mapped source stacks
  and useful delivered owner alerts remain unproved. No event payload, source
  map upload or notification was requested, and no settings were changed.
- Snapshots and the scoped preflight summary remain owner/SYSTEM-protected.
  Source was not published; existing website/mail routing, legacy media and
  working MassageLab tools remain unchanged.

## 2026-10-08 — Resolve the missing mail TXT owner-view check

- The owner supplied an expanded Namecheap view with Show Less visible. It
  explicitly names AtmoShaper and shows the Google ownership TXT, mail DKIM TXT
  and mail SPF TXT records, plus the existing website records and Custom MX.
  The visible full SPF value and DKIM prefix match independent reads at both
  authoritative servers; both complete mail values remain unchanged privately.
  DKIM is shortened in the image, so its full value remains DNS-derived.
- This resolves the missing-TXT owner-view check and supersedes the prepared
  support question and earlier missing-entry statements below. Expansion is
  consistent with the earlier incomplete display; exact user UI actions are
  unknown. No support contact or record recreation is needed for that issue.
- The earlier email-related CNAME still resolves unchanged at both servers but
  is not visible in this latest image. Keep it in the eight-known-row private
  preservation baseline; do not remove it or claim the image alone proves the
  entire zone inventory. Full comparison, parent DS/host collisions and exact
  onboarding/cost/propagation/rollback remain preflight work.
- The owner image is saved with a verified hash in the existing protected
  operation folder. No DNS, nameserver, provider, media or hosting change occurred;
  no source was published and no completed live acceptance was repeated.

## 2026-10-08 — Preserve owner DNS evidence and reconcile known authoritative records

- The owner's subsequent desktop view explicitly names AtmoShaper and shows
  five Host Records, including an additional email-related CNAME; the earlier
  Mail Settings view contains one MX row. Fresh direct reads at both Namecheap
  servers agree on eight known record rows. The new CNAME matches the screenshot
  and all seven previously saved values remain unchanged. No CNAME is returned
  at either of the two mail TXT owners; the additional CNAME does not replace
  those TXT records. Its intended application/SMTP consumer is not yet proved.
  Hash-verified owner evidence and a new eight-row preservation candidate remain
  private. Desktop mode still omits the two live mail TXT records. Stop requesting
  more screenshots; the next precise owner read is Namecheap's full authoritative
  record list or authenticated readback and explanation of the missing entries.
  Full-zone completeness and nameserver-change authority remain unproved.
- The owner supplied the requested Namecheap views. They show BasicDNS,
  DNSSEC/Dynamic DNS disabled, no domain redirects and Custom MX with the shown
  priority preserved. Domain identity is cropped out; the supplied context and
  independently matching apex addresses connect this evidence to AtmoShaper.
  Both original images are copied into the existing owner/SYSTEM-protected
  operation folder with matching SHA-256 hashes; no ACL was broadened.
  A subsequent owner screenshot explicitly confirms `atmoshaper.com` and shows
  only the Google ownership TXT record. Independent direct DNS reads reconfirm
  the two mail TXT records at both Namecheap servers, with values matching the
  prior reads; no separate account-subdomain NS or SOA records are returned.
  The owner-interface discrepancy remains unexplained. Do not ask the owner to
  recreate working mail records or infer that the full zone is inventoried.
- Paired reads at both existing authoritative servers agree on seven known
  website, ownership-verification and mail record rows. Full values shortened
  in the owner view are recovered privately, including mail TXT wire chunks.
  Observed DNS TTLs are retained separately from the registrar's Automatic label.
- The owner view contains four Host Records and one mail row, but omits two
  live mail TXT records. A filter control is visible; filtering is a possible
  explanation, not a confirmed cause. Public known-name reads cannot establish
  full zone completeness. The remaining owner check is the complete unfiltered
  Host Records view or export, including all pages.
- A private candidate baseline is prepared with preserved values, DNS-only
  intent and explicit incomplete/not-executable status. Parent DS, all-record
  completeness, host collisions, eligible zone/plan/nameservers, propagation and
  exact rollback still require completion before approval of a concrete change.
  Zero provider/DNS/media changes occurred; no zone was created and no
  nameservers were changed. Source publication approval remains separate.

## 2026-10-08 — Resolve R2 access and inventory all three existing media classes

- The owner corrected the existing token's dates. Fresh self-verification matches
  the saved token identity, confirms an active and currently valid start/expiry
  window, and the canonical bucket-list GET succeeds with HTTP 200. No token
  replacement, credential re-entry or permission expansion is needed.
- Default-jurisdiction metadata returns the three owner-confirmed media classes;
  EU/US lists return none, with no returned continuation cursor. Federal inventory
  remains unavailable/unverified; this is not an all-jurisdiction completeness
  claim. All three buckets are Standard storage in Eastern North America.
- Public and anatomy each retain one enabled legacy custom domain with active
  ownership/TLS and minimum TLS 1.2. Private media has no custom domain. Public
  development access is disabled on all three. Public CORS allows GET/HEAD from
  all origins and exposes range/cache/type/length/ETag headers; anatomy/private
  explicitly have no CORS configuration. Each lifecycle rule only aborts
  unfinished multipart uploads after seven days; no completed-object expiration
  rule is returned. No setting was changed and no object content was listed.
- The owner's aggregate screenshot reports about 5.1k anatomy objects/2.83 GB,
  11.11k public objects/13.13 GB and zero private objects/bytes; total storage is
  displayed as 15.95 GB. These are independently rounded owner observations,
  not exact object counts, copied-byte verification or completed media migration.
- The existing native Wrangler login is verified and includes the storage
  account with user/account/zone read scopes. The exact AtmoShaper zone GET
  succeeds but returns no zone; public DNS uses Namecheap nameservers. Existing
  storage access therefore works, while branded-domain onboarding still needs
  a complete authoritative DNS baseline and separately approved operation.
- The [compatible media cutover plan](superpowers/plans/2026-10-08-atmoshaper-compatible-media-cutover.md)
  prepares reuse of existing public/anatomy media, preservation of old domains,
  private-media isolation, source URL/revision changes and bounded acceptance/
  rollback. Private receipts retain exact references. Zero bucket/object/DNS,
  provider credential, hosting or database writes occurred during this inventory.
  Local documentation preparation does not publish source or activate delivery.
  Documentation/workload checks pass 16/16; all 189 relative targets across nine
  changed documents resolve, and added private-reference/whitespace scans pass.
  Earlier local code checks remain dated; no completed live acceptance is rerun.

## 2026-10-08 — Complete PR #42 and privacy approval; diagnose storage access and inventory public indexes

- The owner-approved PR #42 merge completes as `357095d`; its tree matches the
  exact reviewed head. All seven final-head CI jobs pass: 5,225 total unit tests,
  5,223 passes/two skips/zero failures or cancellations; 606 browser passes and
  178 gated skips, with no flakes/final failures reported. Codex is clean and the
  completed full CodeRabbit round covers all 37 files, passes all five pre-merge
  checks and reports 93.94% touched-function docstrings. Initial failed heads and
  earlier pending statements remain historical; final receipts stay private.
- Its automatic main candidate is READY and unpromoted. The standard build,
  actual migration/Supporter gates and all 115 static pages pass. Final authenticated
  readback preserves manual custom-domain assignment, main Git binding/protection,
  the PR #40 public target and all six saved live aliases. No manual build,
  promotion, alias restoration or environment change occurred. Complete name-only
  inventory still contains 60 Production-only settings and no Sentry binding.
- The separately approved Sentry project-only privacy update completes with one
  HTTP 200 write and exact readback of six advanced removal rules. Other project
  fields, organization privacy and legacy settings are preserved; inherited IP
  prevention is verified. Collection remains unbound, with no first event, upload
  or notification. Current monitors have no attached workflows; quota/retention,
  billing, release/source maps and useful owner-alert acceptance remain open.
- The automatic build identifies separate vendor-plugin telemetry, which uses
  its own destination rather than the app's DSN/scrubbing policy. New local source
  sets build telemetry false in every mode. The actual configuration regression
  verifies ordinary release credentials and migration/QA isolation remain intact.
  This source correction is not yet published or applied to the hosted artifact.
- The owner confirms existing R2 bucket Settings loads and provides evidence of
  active public delivery. The saved token's precise metadata reveals its future
  October 31 start date, explaining prior HTTP 401/code `10000` despite active
  administrative status and confirmed Read/account coverage. The owner is asked
  to correct only the existing start date, preserving expiry and permission scope.
  No re-entry, replacement, broader grant or repeated denied read is needed.
  Fresh time-window verification and one canonical read follow owner confirmation;
  agent dashboard policy remains unresolved and is not bypassed.
- A new bounded public metadata inventory completes all 228 source-declared
  primary/format JSON indexes, processing 867,736 bytes. All 6,800 sample references
  use the legacy media origin. Zero payloads, private objects or database rows are
  requested; this proves nested URLs need a compatible cutover, not playback or
  storage ownership. Synthetic boundary/deadline/budget and build-configuration
  checks pass 14/14, Sentry contracts pass 55/55 and documentation/workload checks
  pass 16/16; typecheck and lint pass. Current records distinguish completed
  approvals from remaining launch gates; publication remains separate.

## 2026-10-08 — Complete approved Sentry project setup and verify the R2 token (historical checkpoint)

- The source follow-up is published in draft PR #42. At the dated `c1b0ce6`
  checkpoint, the exact Preview is READY and Codex reports no major issues.
  Browser build binds the branch to merged main, generates all 115 pages and
  uploads that artifact. Full units and all four Browser QA lanes are running;
  initial failures remain historical. Full CodeRabbit coverage is still pending.
- The owner cannot find the prior Sentry window, so the prepared interactive
  authorization is reopened. Readback confirms the policy-required OAuth scope,
  unchanged organization policy and the exact approved organization/team/project
  baseline. The single approved project-only POST returns 201 with explicit
  `default_rules: false`. Fresh complete inventory confirms one new AtmoShaper
  Next.js project and the unchanged legacy project; the exact team matches.
- New-project readback has no first event and no sessions, replays, profiles or
  logs. No app/Production binding, event, upload, organization setting or legacy
  resource changed. The old issue-alert list returns 404, so disabled-default
  creation is an accepted request, not verified alert-inventory absence. Effective
  privacy/IP prevention, retention/quota, current alerts, source maps and hosted
  monitoring acceptance remain open before collection.
- Cloudflare's current token format and read-only self-verification confirm the
  saved credential is an active User API Token. The encrypted local capture is
  usable; no re-entry is needed. Storage listing still returns 401/code `10000`,
  initially requiring the owner's permission/account check. The owner confirms
  the match and supplies a screenshot showing storage Read, all-account inclusion
  and no IP restriction. A standard GET against the same verified account still
  returns 401/code `10000`; this is an unresolved provider access denial, not a
  reason to request token re-entry or broader permissions. No object content or
  provider setting changed.
- Current administrative records now distinguish completed setup from activation
  and retain earlier denied writes as dated history. This documentation-only
  checkpoint needs renewed exact-head hosted proof; subsequent final receipts
  stay private to keep the passing head stable. PR #42 remains draft/unmerged.

## 2026-10-08 — Publish independent launch source and reconcile setup approvals

- The owner approved publication of `3ee84fd` as draft PR #42 with automatic
  Preview/CI and the review/fix loop. Hosted main remains the PR #41 merge base.
  The exact initial Preview is READY; Browser build, lint and typecheck pass.
  Codex reports no major issues, and the explicit CodeRabbit full review finishes
  with all 34 changed files covered and no actionable inline comments.
- CodeRabbit's initial pre-merge docstring check reports 65.38% against the 80%
  threshold. Added focused JSDoc for touched auth ownership/cancellation,
  root-error reporting, SDK sanitization hooks, public SEO identity and synthetic
  test helpers. These JSDoc edits leave runtime logic unchanged. These source
  comments and current-record corrections require fresh exact-head hosted proof;
  the initial head's reviews and checks become historical after publication.
- The initial head's Linux unit run reports 5,225 total, 5,221 passed, two skips
  and two failures, with no cancellations. Both failures are stale Anatomime
  inventory/receipt assertions: the clock guard still expects 16 instead of 20
  authored bodies, and the receipt check incorrectly grows the locked bootstrap's
  historical browser result when new cases are registered. Updated the single
  authored-body guard and separated current inventory from inherited receipts.
  Current Anatomime test inventory registers 174 focused Node cases and 52
  intercepted desktop/mobile browser cases. Historical 174/174 and 42/42 remain
  intact; inventory is not a passing current-head acceptance receipt.
- Initial Browser QA reports 604 passed, 178 gated skips and two final failures;
  no recovered flake is reported. Both failures are the desktop/mobile SEO test
  still expecting the legacy canonical/OG host after the approved source identity
  correction. Updated those expectations to AtmoShaper without changing runtime,
  retries, screenshots or historical results. The aggregate is failed at this
  initial head; the correction requires fresh complete hosted checks.
- Separate Sentry project-only creation is approved. The first API write uses
  explicit `default_rules: false` and returns 403. Fresh project reconciliation
  confirms no AtmoShaper project was created. Opened a separate minimal
  project-write OAuth setup window while preserving the existing read-only login.
  Collection, events, uploads, plan/quota settings and legacy resources stay
  untouched; do not repeat the failed write before authorization and readback.
- The owner completes the separate project-write login. Fresh readback matches
  the approved organization/team, member authority and unchanged legacy project,
  with complete pagination and no AtmoShaper project. Creation remains denied:
  the provider explicitly says member project creation is disabled. Read-only
  policy confirms the authenticated owner role and missing OAuth organization
  write scope. Prepared the additional access helper for this approved project
  only; no organization policy or legacy resource changes are authorized.
- The owner supplied the requested R2 read token, but the original local capture
  exited with an empty file. The next interactive capture reports missing
  `ConvertFrom-SecureString`; the owner confirms that command name without
  exposing token values. The prepared retry explicitly imports the built-in
  security module and can reuse the existing in-memory SecureString. Its actual
  native PowerShell invented-token round trip passes, and only its owned scratch
  is removed. The owner runs the retry and confirms successful encrypted capture.
  Actual R2 bucket reads then return HTTP 401/code `10000`; trimming/quote checks
  find no formatting defect, and no object content or provider setting changes.
  Token type/status and exact-account read authority still need owner readback;
  bucket/domain inventory remains open. No request used the failed captures.
- Focused inventory/clock contracts pass 6/6 and documentation/workload checks
  pass 16/16; lint and typecheck pass. The five commented runtime files retain
  identical parsed code after normalizing Windows newlines. All 231 relative
  file targets across the branch's 15 changed Markdown documents resolve against
  current/base source, with zero added private indicators and clean whitespace.
  Full hosted units, all browser lanes, Preview and both reviews remain required
  for the resulting head; the initial failed run is preserved, not rerun away.
- Setup receipts and exact provider references remain in the protected private
  journal. PR #42 remains draft/unmerged; no Production or media cutover occurs.

## 2026-10-08 — Verify provider access and correct independent search identity

- The owner completed Wrangler and Sentry authorization. Read-only inventory
  verifies one Sentry organization/team and one legacy Next.js project, with no
  AtmoShaper project and no remaining project/team page. The team reports owner
  admin membership; a dry run selects that explicit team for one separate
  AtmoShaper Next.js project. No project, setting, DSN, release or event changed.
- Prepared the exact [initial project-only packet](superpowers/plans/2026-10-08-atmoshaper-independent-launch-readiness.md#3-enable-useful-privacy-safe-sentry-operations).
  Creation still needs its exact approval; collection, source maps, alert delivery
  and the final hosted binding remain later gates. Legacy resources stay intact.
- Wrangler account authentication verifies one account. R2 bucket listing is
  denied with provider code `10000`; it needs the exact storage-read credential,
  rather than another ordinary sign-in. No bucket absence, ownership transfer or
  media outage is inferred. No object content or storage configuration changed.
- Resend metadata verifies the AtmoShaper sending subdomain with sending enabled,
  receiving disabled and click/open tracking disabled; provider DKIM/SPF-labeled
  record statuses are verified. Actual Production SMTP binding, billing/admin,
  alignment/delivery and branded inbound routing remain open. No message sent.
  Provider references stay in the existing owner/SYSTEM-protected operation
  journal; mail evidence is status-only and excludes DNS values/identifiers.
- Public robots/sitemap readback still reports two/36 old-host references. The
  local common SEO owner now points canonical, metadata, robots, sitemap and
  structured-data identity to AtmoShaper www and omits unverified legacy social
  equivalence. Existing visible social links/account decisions remain open;
  callbacks, media contracts, legal text/dates and legacy tools are unchanged.
- Focused SEO/public-identity checks pass 17/17; lint and typecheck pass. The
  isolated provider-free build compiles and generates all 115 pages, with 36 new
  canonical sitemap URLs, zero old sitemap URLs and correct robots host/sitemap
  and private-route exclusions. No public artifact or hosted setting changed.
- Documentation/workload checks pass 16/16; all 228 relative file targets across
  the branch's 14 changed documents resolve, with zero added private indicators
  and clean whitespace checks. Hosted main still matches the branch's merge base.
- Prepared a visible owner-controlled R2 storage-read prompt using protected
  local storage and Windows user-bound encryption. It requests only a fresh
  exact-account read token; no credential is accepted through chat or printed.
  Until the owner supplies it and the bucket read passes, storage inventory stays
  open. Source publication/review and initial Sentry creation await exact approval.

## 2026-10-08 — Inventory media declarations and separate the remaining cutover paths

- Added a [media independence map](wiki/media-independence.md) covering Signature
  audio, generative indexes and samples, published Chimer previews, the earlier
  preview fallback, reviewed anatomy images and other rendered assets. A branded
  delivery domain can reuse existing payloads, but absolute audio URLs, nested
  sample destinations and existing anatomy records need their own binding work.
- The named `migration:media:inventory` command reads local public declarations
  and pure metadata helpers. It validates duplicate checksum/size declarations,
  audio summary counts and published/runtime background identity without
  credentials, provider requests, database reads, media downloads or file writes.
  The command passes and reports 51 audio concepts with 1,640 distinct format
  objects, 84 published preview backgrounds with 1,728 distinct objects and 57
  source-enabled generative stations. Declared bytes and source-enabled status
  are not current storage, ownership or hosted-playback proof.
- Updated deployment, anatomy-storage, migration-ledger and launch-plan guidance
  to distinguish historical examples from current configuration. Provider
  ownership, exact branded bindings, nested hosted metadata, anatomy URL evidence
  and legacy-tool continuity remain open. No application behavior, hosted
  setting, media payload, database row or legacy delivery changed.
- Lint and documentation/workload checks pass 16/16. All 226 relative file
  targets across the branch's 14 changed documents resolve; added-documentation
  private-indicator and whitespace checks pass. This inventory/documentation
  change does not require repeating the completed live tests or media publication.
- At 15:14 UTC, redacted status checks still show both CLI sign-ins incomplete.
  The first Sentry login command had ended. Opened a Sentry window that waits for
  the owner to press Enter before starting its read-only OAuth flow, matching the
  waiting Cloudflare window. Protected local credential storage remains intact;
  these windows are authentication preparation, not provider activation.

## 2026-10-08 — Prepare session-free operational Sentry and accurate error fallback

- The installed SDK's Node defaults include process-session reporting in a
  separate envelope pipeline outside the event sanitizer. Local source now
  excludes that integration alongside browser sessions, while retaining runtime
  error handlers and anonymous operational traces.
- The actual error fallback avoids capture when Sentry is disabled, binds a
  reference to its current error, makes no delivery claim and preserves support
  if capture fails. Existing diagnostic taxonomy and compatibility identifiers
  remain intact; no additional application capture site is introduced.
- Provider-free SDK/privacy/diagnostic/fallback checks pass 55/55. Actual installed
  browser/Node/edge defaults and in-memory SDK envelopes prove the session gap,
  retained release/stack utility, sanitized private fields and absent transport
  without an application DSN. All tokens, identity and clinical values in the
  regressions are invented test data; no provider, application or database starts.
- Added an [operational runbook](wiki/sentry-operations.md) explaining practical
  use, exact destination/privacy/source-map/alert gates and bounded acceptance.
  Lint, typecheck and the isolated 115-page Browser-QA build pass, along with
  documentation/workload checks 16/16. All 206 relative file targets across the
  branch's 13 changed documents resolve; added-documentation private indicators
  and whitespace checks pass.
- Initial read-only CLI checks lacked authentication. At the user's request,
  opened interactive Cloudflare and Sentry sign-in windows. The official Sentry
  OAuth CLI uses organization/project/alert read scopes and owner/SYSTEM-only
  local credential storage; Cloudflare uses account/user/zone read scopes.
  Both sign-ins still await owner completion at this checkpoint. Provider
  settings and alert delivery remain unverified. No provider configuration,
  source-map upload, synthetic hosted event or notification was submitted.

## 2026-10-08 — Prepare fresh Anatomime realtime authentication renewal

- The player previously returned its original signed setup request for every SDK
  authentication callback. Local source now consumes that request once and
  obtains each renewal from the joined-player endpoint with opaque player
  credentials in headers. SDK parameters cannot widen room authority.
- Every renewal bounds transport and successful JSON consumption at ten seconds,
  follows the owning room effect's cancellation, rejects late grants and returns
  sanitized errors. A transient failure permits a later fresh renewal, while
  existing polling and its server cooldown remain intact.
- Provider-free renewal, polling, actual-route and traffic checks pass 150/150.
  The isolated Browser-QA build compiles and generates all 115 pages; lint and
  typecheck pass. All 52 desktop/mobile Chromium traffic cases pass with local
  retries disabled, including ten new renewal cases and the prior recovery,
  cadence, cooldown, stalled setup/action and subscription-lifetime cases.
  Documentation/workload checks pass 16/16; all 196 relative file targets across
  the branch's 12 changed documents resolve, with no added private indicators.
- The browser harness exercises the actual player component's SDK callback with
  invented grants and intercepted provider traffic. This is local source proof,
  not live Ably authentication, publishing or a real host-and-phone game.
  Dedicated binding, exact provider-change scope and hosted acceptance remain
  pending; no provider, database, public release or legacy tool changed.

## 2026-10-08 — Prepare explicit all-payment Production build readiness

- The independent-launch source branch adds exact
  `STRIPE_PRODUCTION_READINESS_SCOPE=all-payments` selection to the existing
  Production build wrapper. An unset value retains Supporter-only checks;
  explicit Supporter-only remains supported. Empty or unknown values stop
  the build before checker dispatch without printing the invalid value.
- Full scope invokes the existing read-only checker with live retrieval,
  inherited build configuration, no dotenv fallback and the same two-minute
  deadline. Both additional purchasing paths must pass their existing gates;
  enabling runtime switches alone cannot widen the default scope. All recurring
  tax, Price, managed Portal, credential and pinned-webhook checks stay required.
- Provider-free actual-entrypoint regressions pass: Production readiness 20/20,
  Stripe readiness/webhook contracts 62/62, documentation/workload 16/16;
  lint and typecheck also pass. Tests use invented credentials and a replacement
  Stripe client, without provider requests, charges or database operations.
- The source and environment example are prepared for review. No hosted scope,
  purchase switch, provider configuration, public artifact or live alias changed.
  Real new-flow acceptance, exact activation settings and source review remain
  pending in the [independent launch plan](superpowers/plans/2026-10-08-atmoshaper-independent-launch-readiness.md).

## 2026-10-08 — Independent marketing-readiness goal replaces optional closeout

- The user wants all surrounding services independently usable by AtmoShaper
  before marketing, including required Ably-backed remote Anatomime. Sentry,
  media/provider ownership and branded support are completion work; generic
  refactors remain deferred. Preserve the working MassageLab clock and tools
  during the transition, with any later resource assignment or retirement
  limited to a concrete, dependency-verified operation.
- Added the [independent launch plan](superpowers/plans/2026-10-08-atmoshaper-independent-launch-readiness.md)
  and reconciled the current-state/wiki handoff. One-time support/background
  purchases have readiness gates but no automatic activation stage in the prior
  Supporter-only rollout. Current Production prebuild hardcodes that narrower
  check, so enabling either requires a reviewed build-gate change as well as
  the corresponding payment/tax/fulfillment proof.
- Refreshed hosted main and PR #41: the owner's clarified merge/verification/
  preservation approval was completed at `2026-10-08T12:09:07Z`, merge
  `acd05b07fb67e2af1e49965ce3d2c11b97947d3f`. Reviewed source has all seven CI
  jobs passing, clean Codex and completed full CodeRabbit coverage of all 18
  files; all 32 valid findings are resolved. Final receipts remain private.
  Its automatic candidate is READY and unpromoted; all six live aliases remain
  on the approved PR #40 public artifact. No alias repair was needed; the review
  heartbeat is paused. This closes source review, not the broader new goal.
- October 8 authenticated read-only hosting keeps standard `npm run build`,
  GitHub/main, manual custom-domain promotion and deployment protection. The
  complete name/target inventory has 60 Production-only settings and none in
  Preview/Development, with no Ably, Sentry or R2/upload configuration. No secret
  values, user records, production sync, provider changes or completed tests
  were accessed or repeated by this documentation/planning pass.
- Installed Wrangler's read-only identity check cannot authenticate; actual
  Cloudflare ownership/bucket configuration remains unread. Do not interpret
  this as a media outage or retry through a denied provider-admin path.
- Ably dashboard access was denied because the browser could not verify the
  admin-enforced policy. Do not bypass that control or retry until resolved;
  this is an access limitation, not a verified provider configuration failure.
- Local documentation/workload checks pass 16/16. All relative file targets
  in the changed documents resolve, and whitespace checks pass. Locked local
  test dependencies were installed with lifecycle scripts disabled; no hosted
  service, listener, database or real payment was started by these checks.

## 2026-10-08 — Codex recovers completed temporary token captures

- A stop after encrypted temporary-file writing and before replacement could
  strand a captured grant. Recovery now authenticates the temporary vault,
  verifies preserved token history and the exact pending journal intent, and
  promotes it privately under the ownership lock. Rejected scopes remain
  quarantined for revocation; partial, corrupted and mismatched files remain
  intact and stop dispatch. New writes cannot truncate stranded evidence.
- An interrupted empty-vault clear retains canonical tokens so owned cleanup
  can repeat revocation rather than prematurely discard grant ownership.
- Provider-free regressions pause the actual writer before rename, stop only
  the owned synthetic child, and recover valid/rejected exchange and refresh
  captures. Invalid replacement and interrupted-clear cases preserve prior
  grants. Local harness checks pass 43 with one POSIX-only Windows skip; all
  synthetic children and scratch are cleaned by ownership-bound finalizers.
- Live PR #41 retains fresh exact-head validation/reviews. Final receipts stay
  private, merge remains separately approved, and no completed provider or
  database acceptance is repeated.

## 2026-10-08 — Review dates the initial PR #41 publication checkpoint

- The current snapshot explicitly labels initial publication checks and pending
  hosted reviews as the October 7 checkpoint. Later dated results remain below,
  and PR #41 carries live exact-head validation and review status. Historical
  pending status no longer reads as the current gate.
- Merge and future Production activity retain separate approval. This correction
  changes only documentation; final check/review receipts stay private, and no
  completed acceptance, cleanup or public operation is repeated.

## 2026-10-08 — Codex binds full grant scope and durable token validation

- Scope validation now rejects every permission outside the approved Calendar
  and identity grant, while accepting Google's equivalent email-scope alias.
  Unrelated Drive or profile permissions cannot count as narrow acceptance.
- The first encrypted token capture persists its scope/exchange validation
  status. A stop after vault replacement or before the capture journal receipt
  no longer quarantines a valid grant needed for owned inventory/teardown.
  Invalid scopes or missing exchange fields remain encrypted solely for
  revocation and cannot dispatch Calendar requests.
- Provider-free cases interrupt both exchange and refresh captures, recover
  the encrypted attempt, and complete owned-target absence and revocation with
  invented responses after the prior access grant expires. They also verify
  rejected grants remain unusable but revocable. No provider, database or
  completed acceptance operation is repeated.
- Local harness checks pass 41 with one POSIX-only Windows skip. Fresh exact-head
  hosted validation and reviews remain on PR #41; final receipts stay private,
  and merge and future Production activity retain separate approval.

## 2026-10-08 — Codex closes cancellation before the first journal receipt

- The launcher previously installed signal handlers only after awaiting its
  initial child receipt. Handlers now own teardown before any awaited setup;
  cancellation and setup errors drain the same owned-tree stop, remove handlers
  on every exit path, and cannot claim command success.
- The actual-entrypoint provider-free regression cancels during journal waiting
  for both SIGINT and SIGTERM, including a subsequent setup failure. Windows
  delivers the synthetic signal event; Linux delivers the actual process signal.
  The real teardown stops only a synthetic worker, without starting a listener,
  application, provider or database. Ownership-bound finally blocks clean all
  synthetic children and temporary files. Fresh Linux CI must verify this path.
- Local harness checks pass 40 with one POSIX-only Windows skip. Exact-head hosted
  validation and reviews remain on PR #41; final receipts stay private. No
  completed provider operation is repeated; merge retains separate approval.

## 2026-10-08 — Codex protects form evidence and recovery chronology

- Persisted Disconnect form fields contain a private connection ID. A shared
  private artifact writer restricts new and existing files before writing;
  the form and raw diagnostics retain their protected operation-directory scope.
- Journal append time now overrides an inherited timestamp when recovery spreads
  an earlier intent. Provider-free cases recreate older interrupted calendar and
  token intents and verify that actual recovery receipts have fresh append times.
  New/permissive form files are checked through the writer used by the worker;
  fresh Linux CI supplies the independent POSIX permission proof.
- No application, provider or database acceptance is repeated. PR #41 owns fresh
  source publication/checks/reviews; final receipts remain private, and merge and
  future Production activity retain separate approval.
- Local harness checks pass 39 with one POSIX-only Windows skip. Lint,
  typecheck and documentation/workload checks 16/16 pass; all 137 relative
  targets resolve, with no added-documentation private-data or whitespace findings.

## 2026-10-08 — Codex makes bridge nonce claims single-use

- Concurrent bridge GETs could both read an unused nonce before either persisted
  the claim. The bridge now locks read/validation/persistence before issuing the
  synthetic session redirect; seed and reconnect writers share the same lock.
- The provider-free regression runs the actual server entrypoint with synthetic
  HTTP objects and replaced framework/session dependencies. Twelve simultaneous
  normal starts yield exactly one session redirect; invalid method/path/host,
  repeated requests and the pending-only variant yield no session. Invalid
  requests preserve the unused nonce. No real listener, application, provider
  or database starts. Source publication and fresh checks/reviews remain on
  PR #41; merge and future Production activity retain separate approval.
- Local harness checks pass 38 with one POSIX-only Windows skip. Lint,
  typecheck and documentation/workload checks 16/16 pass; all 137 relative
  targets resolve, with no added-documentation private-data or whitespace findings.

## 2026-10-08 — Codex closes interrupted lock release

- Fresh Codex review identifies an unlink-before-rmdir crash window: an empty
  canonical journal lock could prevent later owned cleanup. Release now claims
  the lock with a prepopulated PID-owned directory, verifies the original owner
  while holding that claim, and atomically retires the directory before deleting
  evidence. Dead claims use the same ownership proof for recovery; live and
  unrecognized locks are preserved. Directory claims also serialize competing
  releasers when Windows file renames resolve through stale handles.
- A provider-free regression pauses the actual guard before and after retirement,
  terminates only its synthetic child, and verifies recovery, concurrent exclusion
  and preservation of a replacement owner's lock. No application, provider or
  database acceptance is repeated. Source publication and exact-head checks and
  reviews remain under PR #41; merge and future Production activity retain their
  separate approval boundary, and final review receipts remain private.
- Local harness checks pass 37 with one POSIX-only Windows skip. Lint,
  typecheck and documentation/workload checks 16/16 pass; all 137 relative
  targets resolve, with no added-documentation private-data or whitespace findings.

## 2026-10-08 — Review makes cursor proof independent of source order

- The `2bd0d4c` checkpoint passes all seven CI jobs at `03:28:05Z`: 5,191 unit
  passes with two skips and 596 browser passes with 178 gated skips, no failures
  or flaky browser results reported in that run. Its exact-head Preview is READY
  and Codex reports no major issues. Full CodeRabbit coverage completes at
  `04:06:32Z` across all eighteen files, with two minor findings; all five
  pre-merge checks pass with 88.24% touched-function docstring coverage.
- Cursor preservation is compared by source identity rather than unordered
  relation position. The provider-free regression accepts reordered distinct
  cursors and rejects missing, duplicate, replaced or changed sources and absent
  failure status. Handoffs date their completed publication/checkpoint receipts
  and use PR #41 for live exact-head review/check status. Final receipts remain
  private without further receipt-only source commits.
- Provider-free harness checks pass 36 with one POSIX-only Windows skip; lint,
  typecheck and documentation/workload checks 16/16 pass. All 137 relative targets
  resolve, with no added-documentation private-data or whitespace findings.
- Source fixes need fresh exact-head hosted validation and reviews before merge
  can be proposed. Merge and future Production activity require separate approval;
  completed real acceptance, cleanup and public rollout are not repeated.

## 2026-10-07 — Review closes setup failures and repeated rejection evidence

- The explicit full CodeRabbit review completes at `2026-10-08T02:55:47Z`,
  covering all eighteen files at `cf889a0`; all five pre-merge checks pass with
  87.88% touched-function docstring coverage. Four findings are valid: two stale
  operator handoffs and two harness lifecycle/evidence gaps.
- Pre-rollout and pre-provisioning passages are explicitly historical. The
  completed operator/harness publication now points to PR #41's latest-head
  checks and reviews; merge and future Production work retain separate approval.
  Setup failures exit the owned server child immediately, even when framework
  or listener handles are active. Each new native rejection writes a receipt;
  a short tail catches split markers without recounting earlier stderr.
- Provider-free checks pass 35 with one POSIX-only skip on Windows. Regressions
  cover resumed rejection attempts and split/multiple markers, plus the actual
  server entrypoint's listen/readiness failure paths using synthetic dependency
  replacements and a retained framework handle. No real listener, app, provider
  or database starts in those regressions. Lint, typecheck and documentation/
  workload checks 16/16 pass; all 137 relative targets resolve, and added-doc
  private-data/whitespace scans pass. Hosted validation was outstanding at this
  publication checkpoint; the dated `2bd0d4c` completion is recorded in the
  October 8 entry above. Completed acceptance, cleanup and public rollout are
  not repeated.

## 2026-10-07 — Review aligns the migration handoff with the completed Calendar rollout

- The explicit full CodeRabbit review completes at `2026-10-08T01:47:58Z`,
  covering all eighteen files at `3735e6a` and passing all five pre-merge checks
  with 87.88% touched-function docstring coverage. Its one minor finding is valid:
  the migration wiki records the completed Calendar rollout but still names
  Calendar among the open migration gates.
- The handoff now names only old-origin recovery and other remaining gates,
  links its status to the completed Calendar ledger, and retains manual public
  promotion. The existing limits on Production OAuth and live sync proof remain.
  This documentation-only follow-up needs fresh latest-head hosted checks and
  reviews; application runtime, tests and provider settings are unchanged.
  Completed provider activity, cleanup and public rollout are not repeated.

## 2026-10-07 — Review gives cleanup its own deadline and preserves revoke failures

- The explicit full CodeRabbit review completes at `2026-10-08T00:43:19Z`,
  covers all eighteen files at `70a2ab1` and identifies two valid operator
  harness issues. A malformed or null revoke-error body now falls through to
  the HTTP-failure receipt and returns its status; it cannot establish prior
  revocation. Raw response contents remain private.
- Both cleanup variants now have a separate five-minute process deadline,
  independent of the expired normal run ceiling. Expiry immediately starts
  owned-tree teardown and records partial cleanup with the invocation's PID;
  intents and encrypted captures survive for scoped recovery. Completion drains
  that receipt and cannot report command success after the deadline. Normal
  fifteen/ninety-minute watchdog behavior remains unchanged.
- Provider-free harness checks pass 33 with one POSIX-only test skipped on
  Windows. They exercise both cleanup variants against stalled synthetic children,
  retained partial evidence, timer cancellation and malformed/null revoke errors.
  The first Windows sandbox run could not terminate its synthetic child; only
  that verified owned child was stopped, and the same suite passed with normal
  process control. Lint, typecheck, documentation/workload checks 16/16 and
  whitespace checks pass. Latest-head hosted checks/reviews and Linux process/
  permission proof are required again after these source changes.
  No provider resource, credential, consent, completed test, cleanup or public
  operation is repeated.

## 2026-10-07 — Review bounds process descendants and all cleanup requests

- Codex's review completes at `2026-10-07T23:36:32Z` on `8a12567` with two
  valid operator findings. POSIX children now start in an owned process group;
  deadline/interruption teardown signals the group and escalates after a short
  grace period, even if its leader exits first. The launcher observes completion
  immediately and waits for inherited pipes to close; Windows retains PID-scoped
  tree termination. Failed receipt writes also stop the owned child.
- Every cleanup provider dispatch combines an eight-second timeout with any
  existing adapter/operator signal. Direct DELETE and token revocation now have
  the same bounded transport as inventory/refresh. A timeout retains intents and
  captured tokens rather than emitting a false cleanup receipt, permitting a
  future authorized retry to reconcile absence/revocation.
- CodeRabbit's explicit full review completes at `2026-10-07T23:40:57Z` on
  `8a12567`, covers all eighteen files and passes its five pre-merge checks with
  86.67% touched-function docstring coverage. Its one minor stale-handoff finding
  is valid: both affected plans now mark completed registration guidance as
  historical and identify PR #41 as published with latest-head reviews/checks
  pending, linking the completed provisioning/public-activation receipt.
- Provider-free harness checks pass 30 with one POSIX-only process test skipped
  on Windows. Fresh latest-head Linux CI is still required for that test and the
  POSIX diagnostic permission assertions. Documentation/workload checks pass
  16/16; lint, typecheck and whitespace pass. Latest-head hosted results remain
  pending; the completed full review above does not cover this follow-up.
  Completed provider tests, cleanup, settings and public rollout are not repeated.

## 2026-10-07 — Review resolves definitively rejected create intents

- Codex's review completes at `2026-10-07T23:28:06Z` on `bc24073` with one
  valid finding: cleanup could stop before token revocation after a rejected
  Calendar-create request that produced no resource.
- A matching parsed Calendar client-error response at 400/401/403, with no
  resource ID, records non-creation for that exact marked intent. Cleanup accepts
  that terminal outcome alongside accepted/reconciled targets. When every create
  is positively rejected, it needs no inventory permission before revoking the
  captured tokens. Malformed, transport and server failures stay unresolved and
  require reconciliation; status alone is not treated as non-creation proof.
- The provider-free regression covers all three explicit rejection statuses,
  absence of inventory calls, owned-token revocation, and rejection of ambiguous
  responses without a success receipt. Harness checks pass 29/29; lint,
  typecheck, documentation/workload checks 16/16 and whitespace pass. Relative
  targets are unchanged. Latest-head hosted checks/reviews remain pending.
  No completed provider activity or cleanup is repeated.

## 2026-10-07 — Review fixes capture recovery and canonical private paths

- Codex's latest review completes at `2026-10-07T23:19:33Z` on `efd9b19`.
  Both valid operator findings are fixed. Every encrypted token capture retains
  its attempt identity and operation kind; cleanup can reconstruct a missing
  captured journal entry after vault replacement succeeds but a worker stops
  before the journal append. Recovery requires that exact identity/kind and
  preserves the token's rejected-for-use state while allowing owned revocation.
- The private-path helper canonicalizes both configuration and credential files
  and checks ancestry by path components. Ordinary sibling scratch directories
  are accepted; dot-prefixed in-checkout children and outside symlinks resolving
  inside the checkout are rejected. The loader reads the canonical credential.
- Local regression also exposed Windows pending-directory-delete contention;
  lock directory probes and removal now retry or defer within their bounds
  without interpreting permission failures as dead-owner proof.
- All 28 provider-free harness checks pass in three consecutive local runs,
  including interrupted capture/recovery/revocation, kind mismatch, canonical
  siblings, config/credential symlinks, and concurrent lock reuse. Lint,
  typecheck, documentation/workload checks 16/16 and whitespace pass; relative
  targets are unchanged. Latest-head hosted checks/reviews remain pending.
  No provider resource or completed
  acceptance/public operation is repeated.

## 2026-10-07 — Review closes uncaptured-token cleanup receipt gap

- Codex's review completes at `2026-10-07T23:10:02Z` on `83f5b33` with one
  valid operator finding: an accepted token exchange with a lost response can
  leave an active grant outside the vault, yet cleanup could report revocation.
- Every future exchange/refresh intent now carries its own attempt identity.
  Cleanup requires an exact captured or explicit non-issued outcome for every
  attempt; a captured retry cannot cover an earlier unknown response. Only
  parsed standard validation/authentication errors without token fields establish
  non-issuance; transport loss, malformed responses and server failures remain
  unresolved. Raw provider errors/credentials are not copied into journal receipts.
- Cleanup start freezes new provider activity from the application under the journal lock.
  Final outcome verification, vault clearing and success receipt share that lock,
  preventing a concurrent unfinished token request from producing a false receipt.
  Unresolved outcomes stop cleanup and retain evidence; any future independent
  provider grant-removal recovery needs exact approval. No current grant or
  completed run requires recovery or repetition on the recorded evidence.
- All 26 provider-free harness checks pass, including exchange and refresh loss,
  malformed/server-error responses, distinct captured retries, explicit rejection,
  completion refusal and the cleanup freeze. Lint, typecheck,
  documentation/workload checks 16/16 and whitespace pass; relative targets
  are unchanged. Latest-head hosted checks/reviews remain pending.
  Application runtime and all completed provider operations remain unchanged.

## 2026-10-07 — Review fixes protected diagnostics and terminated-worker locks

- Codex's next review completes at `2026-10-07T23:00:47Z` on `17e08e6`.
  Both valid operator findings are fixed. Raw child stderr is written only after
  applying owner-only POSIX file mode, including when an older diagnostic file
  exists; Windows retains the protected run directory's access controls.
- Journal locks publish a prepopulated PID/nonce ownership directory atomically.
  Recovery requires the recorded PID to be absent; age, denied process probes,
  live owners and unknown/empty lock directories never establish dead ownership.
  Cleanup removes only the exact owner entry, preserving any nonempty replacement
  lock. Windows pending-delete contention is retried within a bounded interval.
- All 25 provider-free harness checks pass, including a terminated owned local
  worker, live/unowned-lock rejection, concurrent reuse and diagnostic rewrites.
  Exact POSIX mode assertions await latest-head Linux CI. Lint, typecheck,
  documentation/workload checks 16/16 and whitespace pass; existing relative
  targets are unchanged. Latest-head hosted checks/reviews remain pending.
  This local process/filesystem test creates no
  provider resources and repeats no completed acceptance or public operation.

## 2026-10-07 — Follow-up review fixes refresh omission and cleanup retry

- Codex's follow-up review completes at `2026-10-07T22:47:57Z` on `c7de5c9`.
  Both valid operator-harness findings are fixed: a refresh response may omit
  unchanged scope, and a successful DELETE may lose its response before the
  accepted journal receipt. Application runtime remains unchanged.
- Refresh omission inherits only the validated grant captured for that exact
  refresh credential; explicit empty or broader scopes still fail. Token
  capture, validation and acceptance share one store lock. A later rejected
  response quarantines the same credential value even if an earlier copy was
  accepted; rejected credentials remain available only for owned revocation.
- Cleanup reconciles complete paged inventory before deleting only still-active
  owned targets. A lost DELETE response can therefore resume with absence proof
  rather than retrying an absent resource. Final absence receipts identify the
  current create intents, allowing partial token-revocation cleanup to resume.
- The latest provider-free harness checks pass 23/23. These regressions exercise
  the actual guarded adapter/cleanup helper and make no additional live
  acceptance claim. Lint, typecheck, documentation/workload checks 16/16,
  all 84 relative targets in the three updated documents, and whitespace checks
  pass. Final-head hosted checks and renewed reviews remain pending.
  No consent, fixture, provider
  configuration, database, payment test, deployment or completed cleanup is rerun.

## 2026-10-07 — Source-review fixes for guarded recovery and delayed cleanup

- The explicit full CodeRabbit review completes at `2026-10-07T22:35:16Z`,
  covering all eighteen files at `45bfb7805bea913cc04c5c686852bcdc62306881`.
  All five pre-merge checks pass, including 80.95% touched-function docstrings.
  Its valid launcher finding is repaired with platform-specific npm/shell
  selection. Codex's two valid findings identify transport-loss recovery and
  expired-token cleanup gaps in the operator harness, not deployed runtime.
- A future guarded create now adds a unique run/attempt description marker.
  Full inventory paging can recover only its uniquely marked owned secondary
  target; ordinary application metadata is restored at the task boundary.
  Duplicate markers, shared/primary targets and names alone remain fail-closed.
  Teardown reconciles before deletion, rejects unresolved intent and verifies
  active absence through every inventory page before revocation.
- Delayed cleanup may refresh only an already captured usable grant. Newly
  issued tokens are encrypted before validation so rejected grants can still
  be revoked; only accepted tokens are reused. Refreshed tokens join final
  revocation, and an absence receipt prevents a cleanup retry from needing a
  grant already revoked during partial teardown.
- Provider-free harness checks pass 21/21, including pre-parse transport loss,
  paged reconnect/cleanup, ambiguous ownership and delayed refresh/revocation.
  Documentation/workload checks pass 16/16, lint and typecheck pass, and
  whitespace checks pass. Existing relative link targets are unchanged.
  These are source-regression proofs, not additional live acceptance receipts.
  Exact-latest-head hosted checks and renewed full reviews remain required.
  No completed consent, fixtures, database/payment test, cleanup or public
  operation is repeated.

## 2026-10-07 — Calendar source closeout published for hosted review

- The owner approves publication of the prepared operator/guarded-acceptance
  closeout and shepherding hosted reviews. Fresh remote truth confirms `main`
  remains `38d0deddea484938e13df61927d07a7b21f92071`, the owned branch was absent,
  and no open PR duplicates it. Normal push publishes exact prepared head
  `577298385fa1f387e91e3e98f3fb5e1398a38847`; the hosted branch matches.
- [PR #41](https://github.com/dsbowersock/atmoshaper/pull/41) opens against `main`
  at `2026-10-07T22:28:33Z` and is attached to this task. Its eighteen changed
  files contain operator scripts/tests and migration receipts; application
  runtime remains unchanged. This publication receipt joins the source review
  before explicit full CodeRabbit and Codex requests. Hosted CI and latest-head
  coverage remain pending; carried statuses are not review coverage.
- The approved loop covers valid source fixes, normal pushes and renewed
  reviews/checks. It does not authorize merge or another Production operation.
  The completed Calendar/payment tests, credentials and public artifact are
  preserved; no new provider activity or cleanup is performed.

## 2026-10-07 — Approved Calendar artifact promoted; public checks pass

- The owner approved promotion of the exact checked PR #40 artifact, optional
  Calendar activation for eligible provider accounts, public checks and bounded
  rollback. Fresh preflight verified the exact READY source, unchanged 60-entry
  Production configuration, prior PR #37 target/all six aliases and normal
  build/Git/protection/manual-promotion controls before the single promotion.
- Final `2026-10-07T21:50:03Z` readback verifies reviewed merge
  `38d0deddea484938e13df61927d07a7b21f92071` as the READY public target and all
  six saved aliases on it. No rebuild, alias repair or rollback was needed.
  Both pause flags remain false; one-time support/background purchase switches
  remain absent. The stable key recovery copy and all 60 Production-only
  settings retain their verified metadata.
- All seven anonymous public GETs return `200`: home, Pricing, registration,
  support, Privacy, Terms and session. Registration is open, Checkout pause copy
  absent and session `null`. The Calendar GET shows only its signed-out guard;
  the apex still returns `308` to canonical www. This does not claim a real
  Production OAuth exchange, signed-in entitlement test or live sync. No consent,
  calendar/event/database activity, payment test, Google settings, credential
  rotation, verification submission or old-site change was performed.
- The [completed rollout/rollback receipt](superpowers/plans/2026-10-07-atmoshaper-calendar-production-credentials.md)
  preserves the saved PR #37 rollback and compatibility boundaries. The next
  source step is publishing/reviewing the local operator and guarded-acceptance
  closeout, which is not deployment source. No further setup/file input or
  completed provider test is needed.
- A read-only remaining-provider pass confirms no Ably, Sentry or R2/upload
  configuration names. Source keeps polling fallback and DSN-gated monitoring;
  SMTP names remain configured. Four representative public media HEADs return
  `200` with expected JSON/video types, byte-range support, cache policy and
  `Access-Control-Allow-Origin: *` for requests from the AtmoShaper origin.
  No media bodies were downloaded or provider settings changed. Full playback,
  whole-catalog availability and provider ownership are not proved. The legacy
  project's authenticated configuration read was unavailable; no current legacy
  parity claim or request to redo its setup is made. Preserve the existing host
  and immutable media identities until a dedicated migration is approved.
- Local source closeout checks pass: guarded provider-free harness 18/18,
  documentation/server-workload 16/16, lint and typecheck. All 137 relative links
  and six fragments across the branch's changed documents resolve; private-data
  and whitespace scans pass. The only connection-string-shaped match is the
  explicit invented ownership-test fixture, not a provider credential. No actual
  downloaded client secret/ID or stable encryption key occurs in branch additions.
  The source PR is concretely prepared but unpublished; its hosted CI and reviews
  remain pending. It contains guarded operator tools and receipts, not new app
  runtime changes, and its publication/reviews are the next requested scope.

## 2026-10-07 — Approved Production Calendar provisioning and candidate verified

- The owner authorized the concrete four-Production-setting, recoverable-key,
  single-unpromoted-build operation and restoration of saved aliases if moved.
  Fresh remote/source/configuration/alias preflight passed before writes.
  Exactly four settings were created with their specified encrypted or
  sensitive/write-only types. Complete final inventory has 60 Production-only
  entries; the original 56 IDs/types/targets/update timestamps are unchanged.
  Client/callback readbacks match the privately validated download. Both pause
  flags remain false; excluded purchase switches remain absent.
- The new cryptographically random stable key has an owner/SYSTEM-protected
  recovery copy outside Git, with a matching private fingerprint. Actual app
  encryption/decryption helpers pass a synthetic round trip. Temporary credential
  request files were removed and their private scratch area checked for raw
  secret/key remnants. No credentials or private identifiers enter source.
- One fresh Git-connected Production candidate uses exact reviewed merge
  `38d0deddea484938e13df61927d07a7b21f92071` and reached `READY` at
  `2026-10-07T21:03:42.652Z`. All four keys are present in its environment
  snapshot. The standard build passed actual migration-status/live Supporter
  gates, compilation and all 115 static pages; existing nonblocking Sentry
  release/source-map warnings remain outside Calendar readiness.
- All seven ordinary authenticated signed-out GETs return `200`; registration
  is open, Checkout pause copy absent and session `null`. The signed-out Calendar
  page shows its sign-in guard without a connect form. Final `21:09:12Z` readback
  retains PR #37 as public target and all six aliases, manual promotion, normal
  build/Git/protection, and disabled excluded purchases. No restoration was
  needed. The candidate remains unpromoted.
- The [completed stage and prepared rollout](superpowers/plans/2026-10-07-atmoshaper-calendar-production-credentials.md)
  retain exact artifact/rollback receipts privately. Public promotion/activation
  still need separate approval. Sensitive remote values remain write-only;
  configuration plus the local helper check does not prove Production OAuth.
  No Google settings, consent, calendar/event work, database test, completed
  payment test, source push or new PR was performed.
- The documentation/server-workload suite passes 16/16; 122 relative links and
  six Markdown fragments across the seven updated documents resolve. Added-doc
  private-data and whitespace checks pass. Runtime source is unchanged; these
  local operator receipts are not a new deployed or published source revision.

## 2026-10-07 — Production Calendar download validated; credential/build approval ready

- The owner supplies the existing Production client JSON path. Private reads
  validate a Web registration in the intended Production project, a correctly
  formed client ID matching the download, a non-placeholder secret, Google
  endpoints and only the canonical www Calendar callback. It is distinct from
  the known test client. A private source fingerprint and sanitized receipt are
  retained; no secret is printed, copied into source or used for a token exchange.
  Existing sign-in credentials are write-only; comparison of their raw ID is
  unavailable and is not claimed. No Google setup or consent is repeated.
- Fresh readbacks verify remote `main` and READY/unpromoted PR #40 source at
  `38d0ded`, PR #37's READY public artifact/all six aliases, manual custom-domain
  promotion, normal build/Git/protection and 56 Production-only settings. Calendar
  and excluded purchase keys are absent; both public pause flags read false.
- The [credential/build proposal](superpowers/plans/2026-10-07-atmoshaper-calendar-production-credentials.md)
  now specifies four Production-only settings, a new stable privately recoverable
  encryption key, one fresh Git build pinned to the reviewed SHA and saved-alias
  restoration if needed. Its private request is prepared without sending it.
  Exact approval is still required; public promotion/Calendar activation remain
  separate. The local receipt/harness branch is not deployment source.
- Documentation/server-workload checks pass 16/16; all 115 relative links and
  six Markdown fragments across these six documents resolve. Whitespace and
  added-document private-data scans pass. No provider write or build was run.

## 2026-10-07 — Final native Disconnect check passed; bounded Calendar acceptance closed

- The separately approved database-only follow-up passes against exact merged
  runtime `38d0ded`. The native multipart request preserves Next's hidden action
  selector, validates the real signed-in fixture, reaches the actual Disconnect
  action, and observes its exact reconciliation rejection from the current owned
  server. No success redirect occurs; the same ERROR/pending row and update time
  survive unchanged. This closes the missing native guard case rather than
  treating an arbitrary HTTP error as proof.
- Owned cleanup removes run-bound synthetic data and independently verifies all
  seven touched tables empty. The owned server is stopped and its port released.
  The exact additional empty Neon project is deleted and absent from the active
  organization listing. Ephemeral database/auth files are removed; private
  ownership/result receipts remain. Teardown began after 4.72 minutes, inside
  the approved 15-minute ceiling. No Google credential, token, consent, fixture,
  provider setting, payment or Production write was involved.
- Together with the prior completed application run, this passes the bounded
  Calendar acceptance gate. Fixture-only inventory, injected failures and ordinary
  primary-calendar/public-auth/Production proof limits remain explicit. Both
  database authorizations are exhausted; no test resources remain active.
- Fresh read-only hosting evidence retains PR #37's READY public target and all
  six live aliases, READY/unpromoted PR #40 candidate, manual custom-domain
  promotion, standard build and GitHub/main. The complete private API inventory
  verifies 56 Production-only variables and no Calendar settings or excluded
  purchase switches; both public pause flags read back false. A shortened
  connector inventory was not treated as complete name/target coverage.
- Prepared the [Production Calendar credential/build proposal](superpowers/plans/2026-10-07-atmoshaper-calendar-production-credentials.md).
  The owner's already-downloaded Production client JSON path is needed for
  private saved-callback/client validation. No further Google bootstrap, test
  consent or fixture work is requested. Credential writes, a build and public
  promotion retain their exact separate gates. No source was published.
- Documentation/server-workload checks pass 16/16. All 120 relative links,
  including six Markdown fragments across the seven changed documents, resolve;
  whitespace and added-document private-data scans pass. This receipt changes
  documentation only; the previously verified harness/runtime checks were not
  repeated.

## 2026-10-07 — Final pending Disconnect database test approved

This setup checkpoint is historical; the completed result and cleanup above
supersede its pending statements.

- The owner approves the prepared 15-minute database test. This separately
  authorizes one additional independent empty Neon project in the previously
  verified console-managed Launch organization, synthetic pending/access data,
  the exact merged runtime, and mandatory owned row/process/project cleanup.
  Possible Launch usage charges were disclosed. Google credentials, consent,
  fixtures and Production operations remain outside this bounded test.
- Fresh reads verify clean receipt head `9b9299d`, exact isolated runtime
  `38d0ded`, no dotenv files, free loopback port and the unchanged Launch target.
  Database-free setup passes; one fresh project is verified at PostgreSQL 17,
  fixed 0.25 CU with idle suspension. Private pooled/direct ownership and
  fingerprint checks pass before committed migration preparation. Native action
  acceptance and mandatory cleanup remain pending; no second project is permitted.

## 2026-10-07 — Calendar application run partial; all owned resources cleaned

- The approved run exercised merged runtime `38d0ded` with one independent empty
  Neon project, synthetic persisted access data, four secondary calendars, six
  event resources and three fresh application consents. The database window
  began at `2026-10-07T17:34:25.785Z`; teardown began about 38 minutes later,
  before the 90-minute ceiling. No Production settings, credentials or deployment
  changed, and completed permission comparisons/payment tests were not repeated.
- Actual callback/state-cookie/encryption, role/feature gates, target creation,
  PostgreSQL rollback and user-row lock serialization pass. The successful rename
  and final reconnect preserve the saved target ID. Real source-selection import,
  incremental update/cancellation, injected cursor failures/recovery, two generic
  outbound insert/update/cancellation cases and resolved Disconnect all pass.
  Lost-create-response injection retains a durable inactive intent; hidden-target
  discovery cannot dispatch a further create, and reconciliation reuses its known
  target. Provider failures are labelled injected, not observed Google outages.
- The pending Disconnect request did not establish acceptance: its HTTP 500 came
  from missing action dispatch, not the expected reconciliation rejection. A
  loopback wire probe found that Playwright's multipart-object encoder drops the
  empty hidden action field. Native FormData bytes preserve it; the new actual
  HTTP transport regression passes. The follow-up now also requires a current
  owned-server receipt of the exact native action error and unchanged pending row,
  rather than accepting HTTP failure alone. No application runtime code changed.
- Other task-only repairs used a Windows file-URL loader, checked JSON rename
  headers/returned metadata, and kept an outbound interval inside its fixture's
  own day. An earlier false rename receipt was explicitly invalidated; corrected
  rename/reconnect passed using the third and final approved consent. The two
  outbound accepted IDs were preserved across the interval correction.
- Both app-created targets have active-absence receipts; all three new test
  grants are revoked and the encrypted vault cleared. The owned server/listener
  is stopped. The exact Neon project was deleted and verified absent from the
  active organization list. The owner reports both source calendars permanently
  deleted, and independent active-list reads confirm absence in both accounts.
  Ephemeral credentials/configuration were removed; the original download and
  connector/Production grants remain intact. Private ownership receipts are retained.
- Prepared a [pending Disconnect follow-up](superpowers/plans/2026-10-07-atmoshaper-calendar-pending-disconnect-acceptance.md)
  for only the missing native action/database case: one additional independent
  empty Neon project, invented unusable token strings, blank Google credentials,
  no external fetch and a 15-minute ceiling with mandatory deletion. It remains
  unapproved; the prior exact one-project authorization is exhausted. Provider-free
  harness checks pass 18/18 in both owned checkouts; documentation/workload
  checks pass 16/16, lint and isolated typecheck pass, all 81 relative links in
  the four changed documents resolve, and whitespace/private-data scans pass.
  Full application acceptance and public Calendar
  activation remain pending. No source publication or hosting operation occurred.

## 2026-10-07 — Isolated Calendar application acceptance authorized

This entry records the initial setup checkpoint; the result and completed
cleanup above supersede its mid-run pending statements.

- The owner reports `Sources ready`. Both new secondary sources were verified
  against the run-bound names, intended owning accounts and shared-reader role;
  neither held events in the application import window. Created exactly four
  synthetic source events without guests, reminders, meeting links or recurrence.
- Created exactly one independent empty Neon project in the already approved
  console-managed Launch organization. PostgreSQL 17, region and one fixed
  0.25 CU read-write endpoint match the authorization. Current API schema confirms
  idle timeout `0` means enabled plan default; `-1` disables scale-to-zero.
  No compute, plan or idle-setting mutation was needed. Connection identities
  and credentials are retained privately, never in source or these receipts.
- The conservative database window starts at `2026-10-07T17:34:25.785Z`, with
  teardown beginning no later than `2026-10-07T19:04:25.785Z`. Committed migrations
  pass. Fixed the task launcher's Windows `--import` path with a proper file URL
  and retained failed child diagnostics privately. Synthetic persisted access
  gates and real local connect-route membership/feature denials pass; no provider
  activity occurred during those access checks. Harness boundary checks pass 14/14.
- The owned loopback application is ready and the first actual application
  consent link was sent to the owner. Callback, target, transaction and sync
  cases remain pending; do not treat setup as full provider acceptance.

- The user states `You are authorized to continue` in response to the prepared
  isolated test setup/run/cleanup request. This covers the existing Calendar
  Verify callback/narrow declaration edits, private test credential use locally,
  one empty independent Neon project and synthetic app data, at most four new
  secondary calendars/six event resources, the 90-minute database run limit,
  and mandatory owned token/process/calendar/database cleanup. Possible Launch
  usage charges were disclosed in the request.
- Clean owned receipt branch `af0eb5e` and hosted PR #40's merged source
  `38d0ded` are reverified before action. Prepare the guarded harness and obtain
  the new test callback/declaration save receipt before database creation. The
  owner performs Console edits because the earlier browser-policy verification
  denial remains unresolved; no retry or alternate control path is used.
- This does not grant source publication, merge, Production credential writes,
  deployment/promotion, verification submission or public Calendar activation.
  Preserve completed comparison/payment tests, unrelated work and the old service.
- The owner subsequently reports `Test setup saved`. Reuse that receipt for the
  existing test callback/narrow declaration; do not ask for another save or client.
  Created a fresh task-owned isolated checkout of merged runtime `38d0ded`, with
  no dotenv files. Installed locked dependencies without lifecycle scripts, then
  applied the named patch step and generated Prisma without a database connection.
- Implemented local-only launcher/transport/worker boundaries for exact source,
  stripped child environment, disposable database fingerprint/ownership, fresh
  scopes, encrypted token retention, cross-process lifetime write reservations,
  controlled faults, real callback/transaction/sync/action cases and scoped cleanup.
  The synthetic app sees fixture-only source inventory after complete metadata
  checks; ordinary primary-calendar defaults are explicitly outside this proof.
- Provider-free harness checks pass 14/14, Calendar regression checks 83/83,
  documentation/workload checks 16/16, lint and isolated typecheck.
  The retained test Web credential validates privately; both connector accounts
  match the intended owners. No database, event fixture or new consent started.
  Requested creation/sharing of only the two new empty source calendars while
  final harness validation continues. No source publication or hosting change.
- An auxiliary all-unit invocation did not terminate after the focused receipts;
  its positively identified root was stopped without touching another process.
  Its artifact is preserved privately and no fresh whole-suite pass is claimed.

## 2026-10-07 — Owner verification readback closes Calendar declaration gate

- After reporting the approved replacement declaration saved, the owner supplies
  Verification Center's Data access status: verification is not required because
  the app requests no sensitive or restricted scopes. They also report no entries
  under either category. This closes the declaration/status dependency by owner
  readback; no independent Console/API inspection of all saved URLs is claimed.
  No verification material/submission is currently required on this evidence.
- Prepared the [isolated application acceptance plan](superpowers/plans/2026-10-07-atmoshaper-calendar-application-acceptance.md)
  for real role/feature checks, dedicated target creation, PostgreSQL transactions,
  reconnect, generic sync and disconnect. It reuses the existing Calendar Verify
  setup with a proposed app callback/narrow declaration, one empty independent
  Neon project, one synthetic app account and bounded new provider fixtures.
  Mandatory token/process/calendar/database cleanup is part of the proposal.
- Read-only preparation verified clean owned branch `a33b00c`, merged PR #40
  hosted truth, the actual Neon adapter and free loopback ports. Neon CLI 6.1.0
  metadata reads work through its existing authenticated OAuth profile. Exactly
  one returned organization is unmanaged by Vercel and uses Launch, so the
  proposed short-lived database can incur usage charges. Private target identity
  stays outside source. No database connections/rows, new login or credentials,
  resources, consent, fixtures, provider settings or deployments were changed.
- Settings/resource/run/cleanup approval for the proposed application stage is
  still pending. Production credentials, public promotion and Calendar activation
  remain separate gates. Do not repeat Google bootstrap, declaration/save/status
  questions, completed permission comparisons/cleanup or the live payment test.
- Documentation/server-workload checks pass 16/16; all 99 relative links and
  referenced fragments across the five changed documents resolve, and whitespace
  and private-data scans pass. These are local documentation checks, not a
  provider acceptance receipt or publication/merge authorization.

## 2026-10-07 — Owner reports replacement Calendar declaration saved

- The owner replied `saved` after the approved six-entry Production declaration
  guidance. Record that execution receipt without claiming independently read
  scope URLs/categories or completed Google verification. Current Sensitive /
  Restricted entries and Verification Center Data access status remain pending.
- Repository readback verifies clean task-owned branch head `aa1ff9d`, and hosted
  PR #40 remains merged as `38d0ded`. Its existing candidate/live receipts keep
  their dates; no new deployment, credential write, consent, fixture or payment
  test was performed.
- Requested only read-only current category/Verification Center status. The
  next dependency is any required verification material and the remaining
  isolated application/provider acceptance, not another declaration setup/save.
  Corrected the provider checkpoint's stale completed-merge instruction and
  replacement-section anchor before continuing. Credentials, test resources,
  verification upload/submission, public promotion and activation remain gated.

## 2026-10-07 — Replacement Calendar declaration guidance approved

- The user answered `yes` to guidance for the prepared replacement Google
  declaration after PR #40's merge/candidate verification. This approval covers
  the six entries in the [provider checkpoint](superpowers/plans/2026-10-02-atmoshaper-calendar-provider-stage.md):
  existing identity entries plus app-created Calendar, calendar-list read access
  and event availability, replacing the earlier event-read proposal. It covers
  declaration setup and saving only when required fields can be truthfully
  completed. Actual Console selection, classification and save receipt remain
  pending; approval is not an execution or verification claim.
- The task-owned receipt branch is clean at `0cc2521`, based on PR #40's verified
  merge. Hosted PR truth confirms merge `38d0ded`; merged source requests
  `calendar.events.freebusy`. Public Google documentation confirms the Data
  Access selection flow and that event listing accepts this grant, without
  establishing this project's actual classification or verification outcome.
- Continue through the owner-operated Console path because its earlier
  automated browser security review was denied. No retry/bypass, new client,
  API enablement, consent, fixture or payment test is needed. Preserve existing
  sign-in, client/callback registrations, branding and audience. If Google asks
  for missing justification/video materials, keep the draft unsaved and prepare
  those dependencies. Video upload/submission, credentials, application/provider
  acceptance, public promotion and Calendar activation remain separate gates.

## 2026-10-07 — PR #40 merged; automatic candidate verified and unpromoted

- The user approved merging PR #40, verifying its automatic unpromoted build,
  and restoring any saved live aliases it moves. Fresh preflight verified clean
  local/hosted head `0f486e554c9b3104dee70a3f2c00c33ffe031c7a`, unchanged base,
  all seven CI jobs, ready Vercel Preview and clean Codex review. CI records
  5,155 unit passes, two skips and zero failures.
- The explicit final full CodeRabbit review covers all 20 changed files at that
  exact head. Its action reply confirms full review finished and its summary
  records the covered commit; no new actionable comments remain. Both earlier
  minor threads are fixed/resolved. All five pre-merge checks pass, with 100%
  touched-function docstring coverage. A carried successful check alone was
  not treated as final-head coverage.
- PR #40 merged at `2026-10-07T05:14:22Z` as
  `38d0deddea484938e13df61927d07a7b21f92071`. Its one automatic main Production
  candidate reached `READY` at `2026-10-07T05:17:34.607Z`. Actual remote logs
  confirm `npm run build`, all committed migrations applied, and live Supporter
  readiness passed. No duplicate manual build or migration write was run.
- All seven normal authenticated candidate GETs pass: home, pricing,
  registration, support, Privacy, Terms and signed-out session. They return real
  application content; registration inputs are open, Checkout pause copy is
  absent, and session is `null`. This is HTTP/HTML evidence, not a claim of
  interactive Calendar or full application/provider acceptance.
- All six saved live aliases and the public project target stayed on PR #37's
  approved artifact, `f184fc1d2ea9cf0adfeff7d810d9db408fc6970e`; no restoration
  was needed or performed. Post-build readback preserves verified domains/apex
  redirect, protection, manual custom-domain promotion, standard build and
  GitHub/`main`. Fresh inventory has 56 Production-only variables and none in
  Preview/Development. Both public pause flags are false; excluded purchase
  switches and all four Calendar keys remain absent.
- The review heartbeat remains paused. The candidate is unpromoted and public
  Calendar remains inactive. The replacement Production Google declaration,
  credentials, larger application/provider acceptance, any required truthful
  demo/submission, public promotion and activation retain separate approval
  gates. Completed Calendar comparisons, consent/fixtures/cleanup and the live
  payment test were not repeated. Next is the prepared availability declaration
  in the existing Production project, after its exact approval.

## 2026-10-06 — Calendar acceptance gate made explicit after full review

- Explicit CodeRabbit full review at `c2c51ab` completed at
  `2026-10-07T02:01:54Z`, covering all twenty changed files. It confirms the
  earlier comparison-instruction fix and identifies one minor wording gap:
  the current snapshot should explicitly say full application/provider
  acceptance remains pending. Added that sentence without changing the gate,
  runtime code, provider settings or test expectations.
- The wording follow-up passes all 16 server-workload/documentation checks and
  branch whitespace checks. The existing relative links are unchanged.
- At `c2c51ab`, all seven CI jobs pass, including 5,155 unit passes, two skips
  and zero failures; Vercel Preview is ready and Codex reports no major issues.
  Fresh connector readbacks retain the approved live artifact and six live
  assignments, both public pause flags false, 56 Production-only variables,
  absent Calendar keys and excluded purchase switches. This wording follow-up
  needs final-head checks and another eligible full review. Merge and all
  provider/application acceptance and activation operations remain separately
  gated; no completed comparison or payment test is repeated.

## 2026-10-06 — Final-head Calendar review completed; stale operator instructions corrected

- After the included window opened, explicitly requested CodeRabbit full review
  of `34cea53`. Its completed review at `2026-10-07T00:54:29Z` covers all
  twenty changed files. All five pre-merge checks pass, including 100% touched-
  function docstring coverage. One valid minor comment identifies stale guidance
  to prepare/request authority for the completed permission comparison.
- Replaced that guidance with the completed setup/run/cleanup outcome and the
  pending replacement-declaration approval and isolated application acceptance.
  Marked the earlier event-read comparison instructions as historical. Condensed
  duplicated diagnostic history in the current-state file; the detailed dated
  receipts remain here and in the comparison plan.
- The documentation follow-up passes all 16 server-workload/documentation
  checks, all 73 relative links across its three changed files, whitespace and
  the private-preparation-data scan. No runtime code or test expectations change.
- At reviewed head `34cea53`, all seven CI jobs pass, including 5,155 unit
  passes, two skips and zero failures, and all four Browser QA lanes. The Vercel
  Preview is ready and Codex reports no major issues. Fresh hosting reads retain
  the approved public PR #37 artifact, six live assignments, manual promotion,
  standard build command and deployment protection. This documentation follow-up
  still requires final-head checks and the next eligible full review. Merge,
  changed Google settings, provider acceptance and activation remain gated;
  no completed provider comparison or payment test is repeated.

## 2026-10-06 — Calendar PR published; full review finds no actionable comments

- Published [PR #40](https://github.com/dsbowersock/atmoshaper/pull/40) at
  `42466ba` after the approved branch push; local/remote heads agree and remote
  `main` remains the PR #39 merge. Attached the PR and explicitly requested
  CodeRabbit full review immediately. Its `Action performed` reply confirms the
  trigger, and completion covers all 20 changed files with zero actionable
  comments. Codex completes without actionable comments or inline threads.
- The protected Vercel Preview and CI Browser build pass; Code quality and all
  four Browser QA lanes remain in progress at this receipt. CodeRabbit reports
  an informational 72.97% touched-function docstring warning. Added focused
  comments for the comparison projection, independent fixture expectations,
  UTC-alias matching, private JSON loader and provider-test contracts. Runtime
  behavior is unchanged. Final-head review/checks remain pending before a merge
  request; the source/review approval does not authorize merge or activation.

## 2026-10-06 — Calendar source publication and review approved

- The user answered `yes` to publishing the prepared Calendar PR and shepherding
  CodeRabbit reviews after local source commit `de04c7b`. This authorizes the
  prepared branch push, new PR and review/fix loop, including the existing
  automatic protected Preview build. Merge, revised Production Google settings,
  credentials, full application acceptance, public promotion and Calendar
  activation retain their separate boundaries.
- Reverified the clean local branch/head, remote `main` at the PR #39 merge and
  the existing remote source branch. GitHub connector reads return no open PR,
  so publication can proceed without duplicating one. No Calendar grant, fixture
  setup, cleanup, sign-in setup or completed live payment test is repeated.

## 2026-10-06 — Availability comparison passes; narrower source prepared

- Reverified clean local head `78f60f6` and resumed the owned independent test
  after genuine consent. The exact issued availability-only scope set/account
  and both metadata/strict baselines pass before controlled writes. Refreshed
  both owner profiles and known root preconditions, then sequentially performed
  the same timed update/all-day deletion through each exact owner's connector,
  with private intent/outcome receipts and bounded active/cancelled readback.
- Both incremental comparisons pass with zero missing/unexpected entries or
  field mismatches. Baseline page counts are four/three for the two sources;
  incremental counts are two/two. Pagination, etags and cursors are present in
  all four reads. Cancellation counts remain two/three for source 1 and zero/one
  for source 2 across baseline/incremental. The report is `passed`/`compatible`,
  token revoked, grant cleanup not required, and process exit zero. Direct
  socket readback finds no callback listener; neither test process remains.
- The user now reports `Deleted both` after approved owner-side removal of only
  the two temporary secondary calendars. Record both owner cleanup receipts,
  without an independent API-absence claim or another grant. Both test tokens
  are revoked; no repeated test, restoration or fixture setup is required.
- Under the comparison plan's source-preparation step, replaced new event-read
  requests with availability access. Calendar-list read/app-created grants remain
  required. Existing event-read or combined tokens are accepted for inbound
  access on connect/cached/refresh paths, with no token rewrite or broader write
  scope. Incomplete/broader grants still fail before provider/persistence calls.
  Adapter/normalization and durable identities/cursors are unchanged. Prepared
  the replacement declaration and token-compatible rollback rule; no Google save,
  submission, provisioning, database write, deployment or activation occurs.
- Focused Calendar checks pass 83/83; comparison checks pass 40/40; typecheck
  and lint pass. Advanced the stale October 3 documentation date ceiling alongside
  fresh October 6 evidence, preserving the required standalone ISO date line.
  The full unit run records 5,153 passed, three skipped and one documentation
  date-format failure from loading the earlier header before its repair. All 16
  affected server-workload/documentation checks pass on the corrected source;
  no remaining failure is identified, and a fresh all-suite zero-failure run is
  not claimed. Relative documentation links and branch whitespace/privacy checks
  pass. The CLI's read-only PR query requires
  authentication; installed GitHub connector reads return no open repository PR.
  Remote `main` is independently read at the PR #39 merge after a Windows TLS
  setup failure is resolved by the exact outside-sandbox retry.
  Source publication/review approval is still needed; no new sign-in is requested.

## 2026-10-06 — Original all-day fixtures restored; availability arm started

- The user reports `Restored both`. Reverified clean local head `b464aa5`,
  both exact owner profiles, the six known roots and the fixed October 10–13
  active windows. Original all-day IDs are confirmed, with their initial dates
  and busy state retained. Both sources exactly match four initial expanded
  entries; timed/recurring roots, titles, COUNT=2 and disabled owner alerts are
  preserved, with no guests or Meet links. No fixture was recreated.
- Private intent/outcome receipts and the existing bound config retain the
  independently prescribed before/after expectations. The event-read token is
  already revoked and no preceding callback listener remains. Started the approved
  availability arm with its own manual genuine-consent link; no accumulated
  event-read grant, broader scope, provider settings or publication is added.
  It awaits consent before issued-scope/account checks, strict baselines and any
  new controlled mutation. No availability capability result is claimed yet.

## 2026-10-06 — Event-read comparison passes on both synthetic sources

- Reverified clean task-owned head `63c06ce` and resumed the owned consent run.
  Actual scopes/account, both exact metadata entries and empty effective defaults
  pass under the measured test grant. All six roots bind; both strict baselines
  match before any controlled write. The bound config keeps recorded fixture
  references and independent expectations outside tracked source; tokens and
  cursors are never written to it.
- Refreshed both owning connector profiles and known fixture preconditions.
  Sequentially moved each timed root to the approved available interval and
  deleted its designated all-day root, journaling intent/outcome privately.
  Exact deletion reads return cancelled; bounded active reads contain only the
  expected three entries per source, preserving both recurring occurrences.
- The same measured grant passes both incremental comparisons with no missing,
  unexpected or mismatched active entries. Source-1 baseline/incremental pagination
  uses four/two pages; source 2 uses two/two. Etags and sync cursors are present in
  all four results. Retained cancellation counts are two/three for source 1 and
  zero/one for source 2, accounting for recorded historical and controlled deletes.
  Final status is `passed`, compatibility true, token revoked, cleanup not required
  for that grant, and process exit zero. The callback listener is closed.
- Restored both timed roots to the initial busy interval; exact owner readbacks
  verify original IDs and disabled reminders. Asked the user to restore only the
  two original all-day roots from their respective owners' Calendar Trash because
  the connector cannot restore deleted events. Initial identity/value readbacks
  remain a prerequisite for the separately consented availability arm. No extra
  event resource, broader permission, Production setting or publication is added.
  Minimum-access proof, full application/database acceptance and final temporary-
  calendar cleanup remain open. Existing focused code validation remains 40/40
  with lint passing; this stage changes documentation only.

## 2026-10-06 — Source-1 binding passes; reader reminder defaults resolved per account

- Reverified clean local head `a0b3aaa`. Genuine consent passes scopes/account,
  both metadata entries and all source-1 active/retired/master binding checks.
  Source-2 page 1, entry 1 fails only `noDefaultReminders`: the test reader's
  event uses defaults, with no guests, conference data or reminder overrides.
  Token revocation succeeds, callback/process end, and no bound output, strict
  baseline or controlled changes occur.
- Refreshed both exact connector profiles and the three known source-2 roots.
  Owner reminders are disabled; reader timed/recurring resources use defaults.
  Google reminder fields are user-specific. Neither account's event flag alone
  proves effective reader alerts; the reader CalendarList default list has not
  yet been checked under the measured grant.
- The existing preparation binder now resolves effective default reminders from
  the same test grant's already-read exact CalendarList entry. Empty/omitted lists
  permit a default flag without an alert; configured defaults still fail for an
  event/master using them. Explicit overrides and malformed metadata remain
  rejected; event-specific opt-out remains valid. Diagnostics emit only booleans.
  No config/connector substitute, endpoint, permission, provider write, adapter or
  broad calendar inventory was added. Identity/title/schedule bounds remain.
- Focused regressions pass 40/40 and lint passes. Coverage includes empty/omitted
  defaults, explicit opt-out despite configured defaults, entry/master configured-
  alert rejection, malformed metadata, sanitized diagnostics and revocation.
  The fixture mock now passes source index to master mutations so both accounts'
  validation paths are exercised. Fresh consent must check the actual defaults;
  no measured result or manual settings task is inferred in advance.

## 2026-10-06 — Test-app diagnostics identify invalid deleted-title requirement

- Reverified clean local head `4755dba`. The first diagnostic wait expired before
  any issued token; its listener/process ended. Under the same bounded approval,
  the replacement consent completed. Actual scopes/account and both metadata
  entries pass. Binding stops at source-1 page 3, entry 1: the recorded cancelled
  ID is admitted, recurrence root/no-guests/no-conference flags pass, and only
  `retired_fields.title` is false. No raw deleted title is serialized. The token
  was revoked and the process ended before private bound output, strict baseline
  or controlled event changes.
- Google's event status contract guarantees deletion identity without an active
  summary contract, and the actual test-app response falsifies current-title
  equality for this known cancellation. The preparation binder imposed that
  extra condition; the real sync/strict comparison already uses cancellation
  identity and active conflict status. Removed only the recorded-deletion title
  requirement at that canonical validator. Exact two-ID allowlisting, cancellation
  state, recurrence-root/master binding, duplicate rejection and no guests/
  conference checks remain. Active entry/master titles and independent timing,
  role, scope, six-resource and request bounds remain strict. No keyword or
  specific replacement-title exception was added.
- Focused checks pass 38/38 and focused lint passes. Regressions cover arbitrary
  deleted-title variants through binding, real normalization/comparison and
  revocation, while wrong active titles and unknown/duplicate/foreign/active
  historical identities still fail. No event writes or resource creation were
  needed. This isolates the observed validator failure; full measured baseline,
  controlled changes/restoration and availability comparison are still pending.
  Fresh genuine consent is the next step because the preceding token was revoked.

## 2026-10-06 — Remaining Calendar binding rejection isolated for safe diagnostics

- Reverified clean task-owned head `82b4ae7` and resumed its owned run after
  `Consent received`. Scopes/account and both metadata checks pass again.
  Source-1 binding still rejects with `fixture_boundary`; token revocation
  succeeds, callback closes and process exits. No bound output, active baseline
  or controlled changes occur. The preceding retired-occurrence repair is not
  sufficient evidence that the entire mismatch is resolved.
- Exact owner connector profile and reads of the three active roots, two
  current instances and two recorded cancellations were refreshed. The active
  schedule, COUNT=2 and no-guest/reminder constraints match. The connector
  summarizes deletions; do not infer the test application's raw API title or
  missing fields from that representation. The rejecting predicate is unknown.
- Instrumented the canonical local fixture binder with fixed check-stage labels
  and boolean flags, plus bounded page/entry positions. It can distinguish
  page shape/cursor, retired identity/fields, active identity/fields/title/shape/
  root, occurrence fields and recurrence/master checks. No provider values are
  serialized and no acceptance predicate, scope or fixture ceiling is relaxed.
  Missing original-start timing now reports its fixed predicate failure rather
  than a generic date-format exception. Focused checks pass 37/37 and lint passes;
  tests cover sanitized diagnostics, fail-closed rejection, no change request
  and token revocation. No provider event write occurred during diagnosis.
- Next: fresh consent to acquire precise test-app diagnostic evidence, with
  revocation on failure. No claimed root cause, permission result, publication,
  Production setting, deployment or public Calendar activation is added.

## 2026-10-06 — Both test Calendar metadata checks pass; known retired occurrences bound safely

- Reverified clean task-owned head `0937027` and resumed its owned run after the
  user reports `Consent received`. Actual scopes/account and both metadata
  checks pass: supplied secondary IDs, full names, UTC-equivalent zones and
  owner/reader roles match. Source-1 fixture binding then stops with
  `fixture_boundary`; no bound output, active baseline or controlled changes
  occurred. The token was revoked, callback closed and run exited.
- Refreshed the source-1 connector profile and bounded active readback. Its
  four current shapes still match the independent schedule. Exact reads of the
  two recorded old recurrence-occurrence IDs return `cancelled`; Google's event
  reference documents retained deletion records with only ID guaranteed. The
  generic failure does not exclude another issue, but these historical entries
  violate the previous preparation requirement that every entry be confirmed.
- The preparation schema now permits at most two explicitly recorded source-1
  retired occurrence IDs with the fixed prior-date suffixes. Binding accepts
  those entries only while cancelled, rejects duplicates, checks any supplied
  title/root against the synthetic recurrence, and requires the IDs' root to
  match the validated current master. Unrecorded or active entries fail. The
  strict production-adapter comparison already handles cancellation rows;
  its active schedule and resource bounds are unchanged. Private operational
  state records the retired IDs; tracked docs contain no provider identities.
- Focused regression checks pass 36/36 and focused lint passes, including paged
  historical deletions through real normalization/strict comparison/revocation
  and invalid-root/unknown-ID/active/duplicate rejection. No event write or
  resource creation occurred during diagnosis. A fresh consent is the next
  bounded retry because the failed attempt's permission is already revoked.
  No measured minimum-access result or Production/deployment readiness is claimed.

## 2026-10-06 — Iceland settings reported; source-1 fixture schedule repaired and verified

- The user reports changing both temporary calendars to Iceland. Preserve that
  as their settings execution receipt; direct test-registration metadata checks
  remain before event reads. Refreshed both owning connector profiles and read
  only the exact recorded source-1 resources before writes.
- Under the existing synthetic-fixture authority, corrected its timed event and
  whole recurring series to the independent UTC schedule, explicitly preserved
  daily COUNT=2, and disabled default reminders on those two resources. Saved
  private intent/outcome records around each sequential write. The all-day
  fixture already has no reminders and remains unchanged; no resources were
  created and no guests or conference links were added.
- Fresh fixed-window reads of both sources each contain exactly four scheduled
  entries with prescribed times/transparency. Source-1 detail readback confirms
  retained timed/recurring roots, two occurrences, and no guests/reminders or
  conference links. This validates fixture assistance, not either measured
  permission. The next action is a fresh event-read consent at the checked local
  source, followed by direct metadata validation and same-grant comparison.
  Production, publication, database, deployment and payment boundaries remain.

## 2026-10-06 — Connector account access restored; current time-zone picker guide repaired

- Reverified clean task-owned head `4cb52dc`. After the app update, Calendar tool
  metadata exposes both user-owned links. The explicitly selected test-user
  profile matches; an exact source-1 read restricted to the approved window
  returns three resources/four expanded entries. Its timed and recurring starts
  are four hours later than independently prescribed. This was a read-only
  connector check; no fixture was changed and no measured test grant is active.
- The user cannot select a literal `UTC` entry. Refreshed Google's March 2026
  city/country-picker announcement and IANA zone data. Corrected the guide to
  search Iceland and select GMT+00:00 for both temporary calendar-level zones.
  Google storing timed-event instants in UTC does not set the calendar's own
  zone or change the intended absolute fixture times. All-day normalization uses
  the calendar zone, so this setup still matters for the fixed UTC expectations.
- Added only the verified Iceland/Reykjavik/Abidjan equivalents to the local
  binder's finite UTC-zone set for its fixed 2026 dates. Regression coverage
  compares winter/summer/test-date clocks and exercises real all-day normalization,
  binding, strict baseline/delta comparison and revocation with literal zones
  preserved; a seasonal zone still fails before event reads. Focused tests pass
  35/35 and focused lint passes. Independent dates, event bounds and scopes remain.
  The user-performed calendar-zone correction and owned fixture-time repairs
  precede fresh consent. No calendar-settings write, event write, Production
  change, source publication, deployment or payment activity occurred.

## 2026-10-06 — First test consent passes; metadata stop and UTC correction identified

- Started the approved event-read preparation at locally checked head `8c3afcd`.
  The user confirms the local page says `Consent received`. Actual token-response
  scopes and configured test-account identity passed before Calendar access.
  Source 1's metadata check then failed; no test-app event read, fixture binding,
  baseline or synthetic mutation occurred. The original generic failure does not
  distinguish HTTP access/API failure from a metadata-field mismatch.
- The issued test token was successfully revoked in the cleanup path, its
  callback listener closed and the owned process exited. Private preparation
  retains only a sanitized result and input references; no token, authorization
  code or raw provider response is retained.
- Added sanitized HTTP status, fixed allowlisted error reasons and per-field
  identity/secondary/name/UTC/role flags before metadata rejection. Tests verify
  that private provider values never enter diagnostics. The focused suite passes
  34/34 and focused lint passes; earlier full lint/typecheck remain recorded.
- The user's requested settings screenshots show the supplied source-1 ID and
  configured test-user owner, with Eastern Time – New York as calendar time zone.
  This establishes a fixture mismatch with the approved UTC schedule; it does
  not prove the original metadata rejection had no other cause. Asked the user
  to set both run-owned temporary calendars' calendar-level zones to UTC, without
  recreation or a broader permission. Source 2's zone remains unverified. This
  fixes the already approved setup; the agent made no calendar-settings write.
  A fresh genuine consent is needed for the same bounded retry because the first
  token is already revoked. No Production, hosting, payment or publication work
  occurred, and no permission-comparison result is claimed.

## 2026-10-06 — Owner fixtures reported ready; same-grant identity binding prepared

- The user replies `events ready`. Record source 1's manual creation as an owner
  execution receipt, not independent event proof. Reverified clean task-owned
  head `34fd4e2`, private preparation state and connected profile. A fresh bounded
  source-2 read still contains exactly four entries and no manual source-1 titles.
- Implemented a standalone preparation extension for the approved comparison.
  It checks exact secondary targets and the owner receipt before consent; after
  actual scope/account validation it validates both exact calendar entries before
  event reads. Binding accepts only the three named synthetic fixtures and four
  independently scheduled shapes per source, known source-2 roots, and identified
  recurring masters with daily COUNT=2. It rejects unexpected events, guests,
  reminders, changed times/recurrence, duplicate pages and non-UTC zones. Four
  finite UTC aliases are accepted semantically while their literal representation
  is retained for later strict equality. Paging/item/time limits remain explicit.
- Preparation writes only a newly created bound config within system temporary
  storage; tokens, codes, event text and cursors remain in memory. Failure still
  revokes the issued test token and prevents synthetic change dispatch. Run the
  event-read arm first with identity binding and strict comparison using that same
  grant, then restore fixtures and use a separately consented availability arm.
  This supersedes the previous ordering without adding a third consent or changing
  approved scopes, targets or fixture operations. The focused suite passes 33/33,
  typecheck passes and full lint passes; no app runtime or credential provisioning
  changed. Actual consent and measured provider results are not yet claimed.
- The user now reports connecting the configured test account to the Calendar
  connector. A fresh profile read in this chat still returns the previous fixture
  owner, and a single read confined to source 1's fixed window returns 404. That
  proves the current tool session cannot read source 1, not why the user's new
  connection is unavailable. No account replacement or sharing change was made.
  Continue the approved test-registration flow rather than repeating connector
  setup; refresh its actual profile before any later fixture write.

## 2026-10-06 — Temporary Calendar IDs received; source-2 fixtures prepared

- Reverified the clean task-owned branch at `ca52d61` and refreshed the connected
  Calendar profile before writes. It still matches the approved source-2 fixture
  owner. The user supplied the two created secondary calendars' exact IDs;
  retain those locators and event identities only in private preparation state.
- A read limited to source 2 and the fixed October 10–13 UTC window returned no
  events. Created exactly the three approved synthetic resources sequentially,
  recording each returned identity before the next write. Organizer readback
  matches the designated run-specific calendar. The connector initially added
  its own user as an attendee to the timed event; removed that self-attendee and
  explicitly omitted self-attendance on the other two creates. All fixtures have
  no guests, reminders or conference links. No other account was invited.
- Expanded source-2 readback contains exactly four confirmed entries: the timed
  Busy event, the all-day Busy event and two recurring Free occurrences. Times
  and transparency match the independent approved fixture table. This validates
  connector fixture preparation, not the test app's minimum permission.
- Source 1 remains unshared with the connector and needs three manually created
  fixtures in the configured test-user account. Prepared the exact user guide
  in the [comparison plan](superpowers/plans/2026-10-03-atmoshaper-calendar-scope-comparison.md#october-6-fixture-preparation-receipt-and-next-user-step).
  Its event-root binding and test-account calendar metadata validation remain
  before strict comparison. No real test-app OAuth consent/listener or measured
  permission run occurred; no Production, hosting, database, deployment, payment
  or verification-submission activity occurred. Existing execution approval is
  retained; no repeated approval or Google Cloud setup is needed.

## 2026-10-05 — Separate Calendar test-user and fixture-owner roles corrected

- The user reports that only the account used during Google Cloud setup was
  successfully added as a test user and that neither temporary calendar exists.
  Accept that as their configuration/execution receipt; the cause of the other
  account's rejected entry was not independently diagnosed. Do not ask for the
  same Console operation again or claim it is a general Google restriction.
- Reverified the clean task-owned branch at `42684ad` and refreshed only the
  Calendar connector profile. It remains linked to the user's other account.
  Corrected the approved procedure: the configured test user owns source 1 and
  grants the test app access; the connected account owns source 2 and shares
  it read-only with the test user. The fixture owner need not grant the test app
  access or join the Cloud test-user list. No project, permission, connector-link
  or existing-calendar change is needed to make this account assignment work.
- Updated private preparation state with separate test-user and fixture-owner
  roles, preserving the existing run marker, six-resource/two-calendar bounds,
  credential reference and fixed read window. No credentials were copied.
  Connector event assistance is limited to its owner's new source 2. The user
  prepares source 1 manually; bind its exact synthetic event roots through an
  approved bounded test-registration read or owner-provided identities before
  launching the strict comparison. The connector cannot read that unshared source.
- The next user action remains creation of the two empty UTC calendars, but
  with corrected owners and source-2 sharing direction. No real OAuth consent,
  Calendar inventory/event read/write, fixture creation or comparison has started.
  Production settings, deployment and payment activity remain untouched.
  Primary Google testing/sharing/creation instructions were refreshed. The
  prior October 3 credential preflight and local test results retain their dates;
  this turn makes no fresh hosted-readiness claim.

## 2026-10-03 — Isolated Calendar comparison approved; private credential preflight passes

- The user replies `Approved; I have a second account` to the two directly stated
  questions. This approves the bounded Calendar comparison using their downloaded
  test JSON, up to two user-owned accounts/two temporary calendars/six synthetic
  event resources, controlled event changes/deletion, and dedicated test-permission
  revocation. User-created calendar setup/removal and genuine consent prompts
  remain manual steps. Preserve this authority; do not repeat completed approval.
- Verified the clean task-owned branch at `97623f6` before proceeding. A private
  local read validates the supplied downloaded Web JSON against the exact chosen
  test project, a nonempty secret, the sole localhost callback and no JavaScript
  origins. All checks pass; no credential values or private provider identifiers
  enter documentation. No token exchange or real consent occurred. Read only
  the connected Calendar user's profile and retain that account reference in
  private preparation state. A preparation manifest outside source records run
  bounds and input references without copying the downloaded credentials.
- The next user action is to create two empty UTC secondary calendars with the
  provided run-specific names, share only the second to the first account with
  reader access, add it to the first calendar list, and provide their exact IDs.
  Confirm the connected account is the configured test user before event
  reads/writes. The connector cannot create/delete/share calendars. Primary
  calendars and existing real appointments are excluded. Google's current
  creation/sharing/Calendar-ID instructions were checked for the manual guide.
- No Calendar events, sharing rule or test grants were created by the agent,
  no comparison listener is running, and no provider-backed result is claimed.
  Production declaration save, verification submission, Vercel provisioning,
  database activity, deployment and public Calendar activation remain outside
  this run. No source push or completed payment test was performed.

## 2026-10-03 — Credential-path receipt and concrete Calendar comparison proposal

- Reverified the clean task-owned branch at `a3f2fcc` before changes. The user
  supplied the downloaded test JSON's local path. A metadata-only check confirms
  an existing, nonempty file; no contents were opened or credential values
  accessed. Neither the private path nor its client/project identifiers are
  recorded in repository documentation.
- Prepared the concrete provider-run proposal in the
  [comparison plan](superpowers/plans/2026-10-03-atmoshaper-calendar-scope-comparison.md):
  user-created secondary calendars, three synthetic resources per source,
  connector assistance bounded to exact new fixtures, separate measured
  consents, identical update/deletion changes, restoration between arms, and
  explicit owner-side calendar cleanup after token revocation. Asked whether
  the user has a second account they own for a shared-reader source. If not,
  one-account coverage is explicitly partial; it does not close shared-source
  or overall minimum-access proof. No extra Google declaration is proposed.
- A live-test preparation review found that Google can retain an organizer's
  deleted-event details. The real sync retains a CANCELLED row when it can
  normalize those details, and the conflict query excludes it. Corrected only
  the standalone comparison expectation to accept that removal shape and an
  ID-only tombstone while still detecting stale active conflicts. A regression
  exercises both retained cancellation and incorrect active-event responses.
  The comparison suite passes 23/23 and lint passes; runtime app behavior is unchanged.
- Configuration approval excludes this provider execution. Credential use,
  test-account grants, synthetic fixtures and revocation still need exact
  authority. Issued the concrete provider-run approval request for the bounded
  comparison, manual calendar operations and connected-account event assistance;
  the answer remains pending. No actual test consent, Calendar or database action, source push,
  deployment, public Calendar activation or repeated payment test occurred.

## 2026-10-03 — Test setup reported complete; local Calendar comparison runner prepared

- The user reports `setup complete` and names the test project
  `AtmoShaper Calendar Verify`, shortening the approved display name because it
  was too long. Record this harmless display-name adjustment and completion as
  their execution receipt. Do not recreate the project or repeat the approved
  configuration. Its private identifier, credential contents, and actual Google
  grants were not read or independently verified.
- Added named offline-plan, comparison, and focused-test npm commands. The
  standalone runner uses the real event-list adapter and busy normalization,
  exact private test credentials/account/secondary-calendar fixtures, one
  measured permission per consent, one-use callback state, GET-only fixture
  reads, and in-memory tokens. It bounds paging/time and attempts dedicated
  test-token revocation after success, interruption, or failed scope/account
  validation. Sanitized reports retain capability counts, not provider identities,
  event text, tokens, cursors, or private configuration. An unconfirmed revocation
  blocks success; fixture cleanup remains an explicit operator task.
- The offline default and 22 provider-free regression checks pass, including
  real adapter pagination/normalization, recurrence/all-day/free/shared fixtures,
  ID-only cancellation removal, scope/account drift, and loopback Host/state/
  interruption/closure checks. The loopback test was corrected to use raw HTTP
  for custom Host headers and manual redirects after an initial dummy redirect
  was followed; it used fake client values and produced no real credentials,
  consent, or Calendar grant. Existing Calendar regressions pass 83/83 and
  typecheck and lint pass. Corrected the adapter's documentation
  to distinguish typed fields from actual JSON payload filtering; runtime behavior
  is unchanged.
- Requested only the local test-credential JSON path to complete the concrete
  execution proposal. No credential file was read. The runner's local/mock checks
  do not prove Google's minimum permission or full application/database acceptance.
  Fixture/account targets, real consent, reads/changes/cleanup, and credential
  use need the next exact approval. No source was pushed, deployment or public
  Calendar activation performed, or completed live payment test repeated.

## 2026-10-03 — Concrete Calendar test-target discovery and permission comparison plan

- The user asked whether to paste the draft and save, and how to progress.
  Clarified that the draft remains unsaved while the permission choice is
  resolved. Asked them to discard only the pending form changes and use the
  project selector to identify an existing AtmoShaper test/staging project,
  or report none. The user replied `none`; no existing test project is reported.
  This user readback does not independently verify project inventory or explicitly
  confirm the unsaved-form discard.
- Prepared the [permission comparison plan](superpowers/plans/2026-10-03-atmoshaper-calendar-scope-comparison.md)
  with test-only settings, exact proposed loopback return address, scope-grant
  isolation, bounded synthetic fixtures, sanitized evidence, and cleanup.
  A smaller standalone permission comparison requires no application database;
  it does not replace full app/Neon provider acceptance. The runner is not yet
  implemented and no credentials, grants, fixtures, or provider execution were
  accessed. Issued an exact configuration-only approval request for a separate
  `AtmoShaper Calendar Verification` project, Calendar API, External / Testing
  access limited initially to the user's own Google account, one Web test client,
  loopback callback, and comparison scope declarations. The user replied `Yes`,
  approving that configuration only; setup and non-secret saved readback are
  pending. Prepared the complete user-guided sequence and an accurate test-only
  declaration explanation. Production necessity is still unproven;
  credential use, grants, fixtures, deployment, and verification submission are
  excluded. Working Production settings and completed setup are preserved.
- The user also authorizes agent execution if available and offers to perform
  the step otherwise. This does not resolve the previously denied browser policy
  check; no bypass, alternate console automation, or provider execution occurred.
  Provide the complete manual configuration checklist rather than ask again for
  an already approved operation.

## 2026-10-03 — Google draft requires justification; demo preparation and minimum-access proof remain open

- The user's Data Access screenshots show `calendar.events.readonly` under
  sensitive scopes with approval required and a usage-justification field.
  A second screenshot shows no restricted-scope rows in the visible section,
  a demonstration-video URL field, and Google's warning against unverified
  scopes in public traffic. These are unsaved draft UI observations, not a
  saved scope inventory, Verification Center outcome, or review submission.
- The earlier operator instructions omitted the explanation/video preparation.
  Asked the user to leave the draft unsaved while resolving minimum-access proof.
  Source inspection confirms event IDs, time windows, time zones, transparency,
  cancellation tombstones, pagination, and incremental cursors support the
  generic busy-block import. Personal event text is dropped before persistence.
  The event-list API also permits `calendar.events.freebusy`; using event reads
  alone therefore cannot prove that narrower scope insufficient. Do not submit
  a categorical unsupported justification or equate a Freebusy query response
  with the event-list response under an availability-only grant.
- Prepared a 650-character truthful usage draft, comparison criteria, and real
  staged-demo checklist in the
  [provider checkpoint](superpowers/plans/2026-10-02-atmoshaper-calendar-provider-stage.md).
  It explicitly keeps narrower-access necessity unresolved. Google requires
  a real consent/use demonstration for sensitive-scope review; no video, upload,
  verification request, QA resources, real account grant, provider/database action,
  new deployment, public Calendar activation, or payment test was performed.
  Declaration approval remains valid for its exact scope; an altered scope set
  or provider-backed comparison needs its own concrete authority.

## 2026-10-03 — Exact Google permission declaration approved; user save pending

- The user annotated the prepared Google permission-declaration approval request
  with `approved`. This authorizes the exact six-entry Data Access declaration
  in the existing AtmoShaper Production project and read-only saved category /
  Verification Center required-actions checks. Do not request the same approval
  again. The [provider checkpoint](superpowers/plans/2026-10-02-atmoshaper-calendar-provider-stage.md)
  owns the exact entries, preserved settings, and exclusions.
- Guide the existing Console's Add or Remove Scopes selection, update, and save.
  The three existing identity permissions and three reviewed Calendar grants
  preserve working sign-in, verified branding, and External / In production
  audience. Omit the removed duplicate availability grant. Browser automation
  remains denied; no alternate control path is attempted.
- Approval is not an execution receipt. Saved declarations, Google's actual
  classifications, and required verification actions remain pending. Verification
  submission, audience/publishing changes, client/secret edits, real user consent,
  hosting credentials, QA resources, calendar/event/database activity,
  deployment/promotion, and public Calendar activation remain excluded. No
  agent-side provider write, payment test, or hosted configuration change occurred.

## 2026-10-03 — Calendar permission PR merged; automatic candidate verified

- The user answered `Yes` to merging PR #39, verifying its automatic unpromoted
  build, and restoring any saved live aliases it moved. Fresh preflight verified
  the unchanged reviewed head, passing checks, no unresolved review threads,
  and all six saved live assignments. Merged
  [PR #39](https://github.com/dsbowersock/atmoshaper/pull/39) at
  `2026-10-03T17:02:47Z` as `2e01e8509b42ab73c85d286f2725c824770aeeec`,
  guarded by reviewed head `7064a6fb63340fabc29adfd695e0824a1d21c2ed`.
- All seven CI jobs and Vercel passed. CodeRabbit's explicitly triggered full
  review covered all thirteen files with zero actionable comments; Codex
  reported no major issues. The unchanged head needed no additional review.
- The automatic main Production candidate reached `READY` at
  `2026-10-03T17:05:28.696Z`. Actual build logs verify the migration-status gate
  and live Supporter readiness gate passed before the standard app build.
  The build-log connector was unavailable; normal authenticated CLI log reads
  supplied these receipts. No manual build, schema migration, or payment test
  was performed. All seven normal authenticated candidate GETs pass: home,
  Pricing, registration, support, Privacy, Terms, and signed-out session.
  Registration inputs are present, pause copy is absent, and session is `null`.
  This is page-response proof, not new interactive or live Calendar acceptance.
- Post-build assignment reads preserve all six saved live aliases on the
  approved PR #37 artifact and the apex-to-www `308` redirect. No restoration
  was needed and no alias write occurred. The public target, manual promotion,
  standard build command, protection, and empty Preview configuration remain
  intact. Both public pause flags read `false`; one-time support/background
  switches remain unset and all four Calendar configuration keys remain absent.
  PR #39's candidate remains unpromoted; the public source is unchanged.
- Fast-forwarded only the clean task-owned branch to the merged source.
  Prepared the exact Google Data Access proposal in the
  [provider checkpoint](superpowers/plans/2026-10-02-atmoshaper-calendar-provider-stage.md):
  declare the three existing sign-in identity permissions and three reviewed
  Calendar permissions, then inspect saved categories and required verification
  actions. Google settings, credentials, QA resources, provider/database activity,
  verification submission, and public Calendar activation remain unapproved.

## 2026-10-03 — Calendar permission PR published under exact approval

- The user answered `Yes` to publishing the prepared permission change and
  migration receipts and shepherding reviews. Published branch
  `codex/atmoshaper-migration-next-stage` and opened
  [PR #39](https://github.com/dsbowersock/atmoshaper/pull/39) against `main`,
  initially at validated `d841709701d2abbf2b5b692fd2dfb70eae087972`.
  The PR is attached to this chat. No merge, Google permission edit, credential
  provisioning, provider acceptance, or public Calendar rollout is authorized.
- Rechecked main at `c26e2f7b4c977a09f82f1eb83d1bde8f797f6bed`, clean
  local branch identity, manual custom-domain promotion, and empty Preview
  credentials. A fresh name-only assignment read after publication verifies
  all six saved live aliases on the approved PR #37 artifact, including the
  unchanged apex-to-www redirect. No hosting settings or aliases were changed.
- CodeRabbit's initial response says automatic reviews are skipped because
  the repository has fewer than ten stars; an explicit review trigger is
  necessary. Update this publication receipt before triggering full coverage
  of the latest head. CI and final-head reviews remain pending. The existing
  local source receipt below covers the unchanged runtime/tests; the additional
  publication receipt changes documentation only.

## 2026-10-03 — User reports Calendar API enabled; redundant grant removed locally

- The user replied `Enabled` after the exact API-only approval and guided step.
  Record completed enablement in the existing AtmoShaper Production project
  from that execution receipt. No independent provider read is claimed; browser
  access remains denied. Do not ask to repeat approval, creation, or enablement.
- Reviewing the actual inbound adapter shows event-page reads, not calls to the
  free/busy endpoint. Google's `events.list` reference accepts event-read access
  without the separate availability grant. A local source candidate removes
  `calendar.events.freebusy` from new requests and required grants while keeping
  event-read import behavior and the other three Calendar grants unchanged.
  Previously granted availability access remains accepted for compatibility;
  it cannot replace any required grant. Missing or broader grants fail before
  provider/transaction calls. Stored tokens and provider resources are untouched.
- Regressions exercise the actual authorization URL, service connection with
  current and prior grants, rejection of each missing/broader grant, and refresh
  of prior grants. The focused Calendar suite passes 83/83; lint and typecheck
  pass. The full unit suite finishes with 5,114 passed, three skipped, and zero
  failures (5,117 total). All 85 relative documentation links, private-pattern
  checks, and whitespace checks pass. The task-generated GPU diagnostic log is
  preserved outside the worktree with its hash verified. Calendar checks use
  synthetic provider/transaction doubles, not real consent,
  provider behavior, database locking, or public readiness proof.
- Updated the [provider checkpoint](superpowers/plans/2026-10-02-atmoshaper-calendar-provider-stage.md)
  with the narrowed candidate, legacy compatibility, and exact proposed declared
  permission set. Further availability-only design, minimum-access review,
  Console classification, applicable verification, and isolated acceptance are
  not claimed complete. No permission-setting edit is authorized yet.
- The local branch started clean at `01852a5dd54bf97285870f5a462927c8d184078d`.
  Publication/reviews require a new exact approval; merge, deployment, provider
  permissions, credential provisioning, and public Calendar activation are
  separate steps. Registration and recurring Supporter Checkout remain open;
  one-time support/background purchases stay disabled. No live payment test,
  provider access, database activity, or hosted assignment change was performed.

## 2026-10-03 — Calendar API-only enablement approved; user execution pending

- The user answered `yes` to guiding the exact API-only enablement step.
  This separately authorizes enabling Google Calendar API in the identified
  existing AtmoShaper Production project and checking the enabled/Manage result.
  Do not ask again for this same approval. Approval is not an execution receipt;
  the latest supplied API screenshot still shows Enable.
- Supplied the direct existing-project page and instructions to confirm its
  display, select Enable once, wait for the normal result, and report enabled
  or Manage. Automated Console access remains denied; no alternative browser
  or indirect control path is attempted.
- Scope/consent/publishing changes, verification submission, credential
  provisioning, QA resources, Calendar/event/database activity, deployment,
  and public activation remain outside this approval. No provider execution
  or enabled-state readback is recorded yet; runtime remains unchanged.

## 2026-10-03 — Branding verified; Calendar API disabled; enablement proposal prepared

- The user's Verification Center screenshot shows branding verified and shown
  to users. Its Data access status says verification is not required because
  no sensitive or restricted scopes are requested. This is the current declared
  configuration's outcome; it is not approval of the additional Calendar scopes.
- The Calendar API screenshot, in the same identified Production project,
  shows `Enable`. Record the API as disabled. Data Access, Audience,
  Verification Center, and API-state questions are now satisfied. Do not ask
  the user to repeat those readbacks or the completed registration creation.
- Prepared an exact user-guided API-only enablement proposal in the
  [provider checkpoint](superpowers/plans/2026-10-02-atmoshaper-calendar-provider-stage.md):
  enable Google Calendar API in the existing AtmoShaper Production project,
  then read back API enabled / Manage. Approval is pending; the prior exact
  registration approval explicitly excluded API changes. Browser automation
  remains denied, so no alternate control path is attempted.
- The proposal excludes scopes/consent/publishing edits, verification submission,
  credential provisioning, QA resources, Calendar/event/database activity,
  deployment, and public activation. Enabling an API alone does not grant a
  user's Calendar access or activate the app integration. Minimum-access
  scope review and isolated acceptance remain later prerequisites.
- The task branch was clean at `fb794c23ee043b5ef41b6cf3dfea6a08803916e1`
  before these documentation edits. No runtime, Google settings, credentials,
  Calendar contents, database, deployment, purchase gate, or payment test changed.
- Advanced the current-state/ledger review date and its existing test ceiling
  together for these fresh screenshot receipts. The provider-free workload/doc
  checks pass 16/16; all 78 relative links and whitespace/private-pattern checks
  pass. No new tests were added and no live provider calls were made by this
  validation.

## 2026-10-03 — Google publishing and declared permissions read back

- The user's Data Access screenshot shows no rows in the non-sensitive,
  sensitive, or restricted scope lists. Their Audience screenshot shows
  publishing status `In production` and user type `External` in the identified
  AtmoShaper Production project. Record these as screenshot readbacks of
  declared configuration, not actual user grants or Calendar verification.
- Checked the source and installed sign-in provider defaults: Calendar
  requests four Calendar scopes plus `openid`/`email`; working Google sign-in
  separately requests `openid profile email`. The empty declared lists do not
  establish a failed sign-in flow. Production publishing does not establish
  approval for new Calendar permissions.
- Prepared the exact source-requested permission inventory and proof limits
  in the [provider checkpoint](superpowers/plans/2026-10-02-atmoshaper-calendar-provider-stage.md).
  Google's primary guidance requires declaring used scopes, reviewing minimum
  access, and verifying applicable sensitive scopes before public use.
- Asked for the remaining read-only Verification Center status/required actions
  and Calendar API Enable-versus-Manage readback. Browser security denial
  remains in force; no alternate access was attempted. Saved new-client callback
  readback and isolated acceptance remain pending. Do not ask to repeat
  registration creation or the satisfied Data Access/Audience questions.
- Task branch was clean at `aaaef3537f205507ad88b22dcc2258224c7afc38` before
  recording these screenshots; remote main remains PR #38 merge
  `c26e2f7b4c977a09f82f1eb83d1bde8f797f6bed`. Unrelated root work is preserved.
  No runtime, Google settings, credentials, database, Calendar/event contents,
  deployment, purchase gates, or live payment test changed.

## 2026-10-02 — User reports Calendar registration created

- After the exact registration-only approval and user-guided instructions, the
  user replied `created`. Record this as their execution receipt for
  `AtmoShaper Calendar Production Web` in the existing Production project,
  not an independent saved-settings or API/consent/scope verification.
  Do not repeat Create or ask the user to redo the finished registration.
- The user also reports downloading the credential JSON from client creation.
  No file location, secret, client identifier, or file contents were accessed or
  recorded. Retain it privately outside source; hosting provisioning still
  requires separate approval and is not implied by the downloaded credential.
- Next read-only evidence is the new registration's saved Calendar callback,
  the existing project's Data Access scope list, and Audience publishing status.
  These are settings readbacks, not permission changes or a real Calendar flow.
  Keep credentials outside chat/source and leave sign-in unchanged.
- Registration creation does not provision hosting settings or activate sync.
  Consent/API changes, QA resources, tokens/database activity, Calendar/events,
  deployment, and public activation remain separately gated.

## 2026-10-02 — Calendar registration creation approved; user execution pending

- The user explicitly approved one Web application registration named
  `AtmoShaper Calendar Production Web` in the identified existing
  `AtmoShaper Production` project, using only
  `https://www.atmoshaper.com/api/calendar/google/callback` as its return URI.
  The existing sign-in registration and callback remain unchanged.
- Prepared user-guided creation instructions because automated browser access
  is denied. New credential retention stays outside chat/source/screenshot
  evidence; Google documents that the secret is shown at creation only.
  No creation receipt has been supplied yet. Do not repeat Create if the outcome
  becomes uncertain; read the Clients list before retrying.
- Approval excludes Vercel provisioning, consent/API/scope/publishing changes,
  QA resources, Calendar/event/database activity, deployment, and public activation.
  Updated current owners with the exact approval and pending execution status.

## 2026-10-02 — Google app registration identified from user screenshot

- The user supplied the existing `AtmoShaper Production` Clients page. It shows
  one visible Web application registration named `AtmoShaper Production Web`,
  created September 26. No separate Calendar registration is visible. A display
  name is not proof that the existing registration lacks Calendar configuration;
  return addresses and project-level consent/API/scope readiness are still needed.
  No private project/client identifiers or credential values are recorded here.
- A fresh read-only browser attempt was denied because the security check could
  not verify the admin-enforced policy. No alternate browser path or indirect
  workaround was attempted. Asked the user to open the existing registration
  and provide only its Authorized redirect URI URLs, leaving settings unchanged
  and sharing no secrets. This resolves the earlier client-list question without
  asking for another unnamed infrastructure choice or new setup.
- The user's reply supplies `https://www.atmoshaper.com/api/auth/callback/google`,
  the existing sign-in return address. The separate Calendar callback is absent
  from this supplied list. Prepared a new Calendar-only Web registration proposal
  in the already identified Production project, preserving sign-in unchanged.
  Google settings remain untouched; creation, secure credential retention,
  provisioning, QA, and activation are still separately gated.
- Updated the canonical snapshot, ledger, and Calendar provider checkpoint.
  No Google/provider settings, environment values, Calendar contents, database
  rows, or deployment assignments were changed.

## 2026-10-02 — Record-transfer scope clarified; Calendar preparation next

- The user clarified that no existing users are expected to have professional
  records needing transfer. Old/new vault contracts match; the finding concerned
  the ordinary file-import operation replacing a populated destination, not a
  format mismatch or evidence of actual users losing records. Removed this
  turn's unpublished generic import UI/test-script draft and kept runtime
  source unchanged. No user storage, account, or database rows were inspected.
- Saved a [local-record/PWA scope checkpoint](superpowers/plans/2026-10-02-atmoshaper-local-record-recovery.md)
  distinguishing retained compatibility from unnecessary existing-user transfer.
  General import/cache/offline improvements remain separate product work, not
  implied migration blockers. The full old service remains available.
- Consolidated the prepared Calendar provider proposal into a
  [checked-in checkpoint](superpowers/plans/2026-10-02-atmoshaper-calendar-provider-stage.md).
  Fresh Production name-only inventory still lacks Calendar credentials and
  its encryption key. Browser control fails before console access because its
  runtime cannot start; the Cloud CLI/admin connector is unavailable. Asked
  only whether the existing project's Clients page contains a Calendar client.
  Sign-in setup is operational and is not being repeated. Provider/client
  writes, QA resources, Calendar/database activity, and activation are unapproved.

## 2026-10-02 — PR #38 merged; automatic candidate verified and aliases restored

- The user explicitly approved source merge and automatic unpromoted Production
  build verification, including restoration of saved live assignments that moved.
  Fresh preflight preserved the exact reviewed head, clean merge state, all
  successful checks, resolved threads, manual promotion, and saved live artifact.
  Merged [PR #38](https://github.com/dsbowersock/atmoshaper/pull/38) at
  `2026-10-03T02:55:51Z` as `c26e2f7b4c977a09f82f1eb83d1bde8f797f6bed`.
  Reviewed head `3558ff4a81e03f347818acf6f14980c64a008118` has full
  CodeRabbit coverage of five files, clean Codex review, three resolved threads,
  and all seven CI jobs passing. Linux unit totals: 5,113 passes, two skips,
  zero failures from 5,115 tests.
- Git integration automatically built that exact merged main once. Actual logs
  prove migration status and live Supporter readiness passed; the candidate is
  `READY`. Seven normal authenticated GETs return application content with `200`:
  home, Pricing, registration, support, Privacy, Terms, and signed-out session.
  Registration is open and the session body is `null`. No forms were submitted.
- The build moved only `atmoshaper-dsbteam.vercel.app` and
  `atmoshaper-git-main-dsbteam.vercel.app` among the six saved live assignments.
  Both moves were positively attributed to this candidate and restored under
  the user's approval. Final readback preserves all six saved live assignments
  on `f184fc1d2ea9cf0adfeff7d810d9db408fc6970e`, the unchanged live project
  target, verified domains, apex redirect, protection, and manual promotion.
  No public promotion or second manual build was performed.
- Environment-name inventory remains Production-only. Excluded purchase switches
  and Calendar keys are absent. No secret export/replacement, migration
  application, payment test, provider catalog change, or old-site write occurred.

## 2026-10-02 — Hosting closeout documentation published as PR #38

- Under the user's source publication/review approval, published the five
  prepared operator-doc updates in
  [PR #38](https://github.com/dsbowersock/atmoshaper/pull/38). It records the
  verified existing-project Vercel integration, actual readiness gates,
  reviewed live source, candidate/public checks, saved rollback, and remaining
  migration boundaries. No runtime code or provider credentials are changed.
- Final-head CI, full CodeRabbit coverage, and review-thread closure remain
  pending. Source merge is separately gated; Git publication may start a Preview
  build under its existing configuration. Do not copy Production credentials
  into Preview or treat documentation publication as public-promotion authority.
- Fresh pre-publication readback confirms the approved live source remains
  `f184fc1d2ea9cf0adfeff7d810d9db408fc6970e` for all six recorded live aliases,
  with manual promotion preserved and excluded purchase/Calendar boundaries intact.
- Git publication added an ordinary Preview branch alias. Later readback
  preserves the six recorded live assignments and approved live artifact;
  additional Preview aliases are outside that promotion receipt's live count.

## 2026-10-02 — Checked artifact promoted; public GET checks verified

- The user explicitly approved promotion of the checked existing build to the
  live site, with rollback if verification failed. Fresh preflight verified the
  exact candidate and saved rollback were `READY` in the same immutable project,
  all original live assignments were unchanged, both remote readiness gates and
  all seven candidate GETs passed, and purchase/Calendar boundaries were intact.
- Normal CLI promotion reused the checked artifact from reviewed PR #37 merge
  `f184fc1d2ea9cf0adfeff7d810d9db408fc6970e`, without rebuilding. The live
  project target and all six recorded live aliases now point to that deployment;
  all four original alias names remain present. All three project domains remain verified,
  and the apex's `308` redirect to canonical `www` is preserved. Existing
  deployment protection and disabled custom-domain auto-assignment remain intact.
- Post-promotion signed-out GET checks of home, Pricing, registration, support,
  Privacy, Terms, and session all returned `200`. Registration inputs are
  present, registration/Checkout pause copy is absent, Supporter Pricing content
  is present, and the session body is `null`. Public Pricing script assets match
  the checked candidate. Fresh non-secret auth/pause-setting reads pass; all
  56 variables remain Production-only, with excluded purchase switches and
  Calendar credentials absent. No rollback was needed.
- The approved settings and exact-artifact promotion are verified; Calendar,
  old-origin recovery, and other migration gates remain open. No secret
  replacement, schema application,
  DNS change, Calendar activation, repeated payment test, or old MassageLab
  change occurred. Future Production builds remain staged until separately
  approved for promotion. These five updated operator-doc receipts are saved
  locally; publishing the documentation branch/PR and its reviews is the next
  source step, separate from this approved live artifact promotion.

## 2026-10-02 — Candidate page checks passed; public promotion prepared

- The user reported that the candidate pages they checked worked, but did not
  check every requested link. Their screenshot identifies the exact candidate's
  registration route and visibly shows the open AtmoShaper account form. This
  is partial human browser evidence, not an all-pages claim.
- The authenticated provider fetch now succeeds through the permitted normal
  access path. Completed all seven candidate signed-out GET checks: home,
  Pricing, registration, support, Privacy, Terms, and session each returned
  application content with `200`. Email/password inputs are present, registration
  and Checkout pause copy is absent, Supporter Pricing content is present, and
  the session body is `null`. No registration submission, Checkout, Calendar
  callback, email, fixture write, or repeated payment test occurred. The user
  does not need to repeat the remaining manual page checks.
- Fresh provider reads verify the same candidate is `READY` at merged PR #37,
  `f184fc1d2ea9cf0adfeff7d810d9db408fc6970e`, with the original live project
  target and all four original aliases unchanged. The saved live rollback at
  `7756080c3bc650bdbcff33013ff67728a3f97efa` remains `READY` in the same
  project. Custom-domain auto-assignment is still off; GitHub/`main` and standard
  `npm run build` remain configured. Excluded purchase switches remain absent.
- Prepared promotion of this already-built artifact with public GET and alias
  readback, restoring the saved prior artifact/assignments if verification fails.
  The earlier hosting approval explicitly excluded public promotion, so that
  exact live change is the next approval request. No promotion or new build has
  occurred. Calendar stays inactive and the separate MassageLab site is untouched.

## 2026-10-02 — Git connection verified; one staged Production build passed

- The user's new Dashboard screenshot shows the existing renamed project
  connected to `dsbowersock/atmoshaper`. A direct authenticated project read
  verifies GitHub, that repository, and Production branch `main`, with the same
  immutable project/scope, explicit `npm run build`, and custom-domain
  auto-assignment off. The user completed the normal App grant and Dashboard
  connection. Earlier repository-discovery responses incorrectly reported
  missing App access and are superseded by direct project evidence. The rejected
  CLI connection command never ran; no duplicate connection was attempted.
  Fresh deployment inventory confirms connection triggered no build.
- Remote `main` remained merged PR #37 at
  `f184fc1d2ea9cf0adfeff7d810d9db408fc6970e`. Under the existing hosting-stage
  approval, created exactly one staged Production build from that pinned Git
  source. It reached `READY` at `23:56:01Z`. Authenticated CLI logs prove the
  actual standard prebuild ran: read-only migration status reported the database
  schema up to date, and live Supporter-only readiness passed with both Portal
  catalogs verified through Stripe API evidence. The app build then completed.
  The build-log connector was unavailable; the normal authenticated CLI supplied
  the receipt. No secret was exported or replaced, schema applied, or payment
  transaction repeated.
- Final readback preserves every original alias assignment and the prior live
  project target at `7756080c3bc650bdbcff33013ff67728a3f97efa`. All three
  project domains remain verified and the apex's `308` redirect is unchanged.
  Two newly generated convenience aliases point to the candidate under the
  existing deployment protection; they do not move an original alias. No public
  promotion occurred. Fresh non-secret reads confirm canonical auth and both
  public pause flags `false`. All 56 project variables remain Production-only;
  excluded purchase switches and Calendar credentials are absent.
- Post-build public GET-only checks pass all seven approved routes with `200`,
  a present registration form, no registration/Checkout pause copy, and a `null`
  signed-out session. The apex returns `308` to canonical `www`. These check
  the preserved live artifact, not the protected candidate.
- Candidate application GET checks remain pending. The authenticated provider
  fetch was rejected by Vercel Authentication and returned no application
  content. Requested a normal browser check of the exact candidate, signed out
  of AtmoShaper, for home, Pricing, registration, support, Privacy, Terms, and
  the `null` session response. An incorrect URL in the first request was promptly
  corrected to the provider-returned candidate URL. Do not use the first URL or
  claim candidate page verification from existing-site checks. Public promotion
  needs the page receipt and later exact artifact/rollback approval.

## 2026-10-02 — Hosting stage approved; project rename and build safeguards applied

- The user authorized the prepared existing-project rename, Git connection,
  and one unpromoted build, plus normal narrowly scoped GitHub App access.
  Public promotion, Calendar activation, database writes, and repeated live
  payment tests remain excluded. The current source candidate is merged PR #37
  at `f184fc1d2ea9cf0adfeff7d810d9db408fc6970e`; its remote `main` is unchanged.
- Fresh preflight confirmed the saved existing target/scope, available proposed
  name, absent Git link, prior live artifact, all four unchanged alias
  assignments, and empty Preview project-variable inventory. Applied and read
  back custom-domain auto-assignment `false` and explicit Build Command
  `npm run build`, then renamed the same project to `atmoshaper`. Both writes
  preserved the approved live artifact. All four aliases, three verified
  project domains, apex `308` redirect, and deployment protection remain intact.
  Updated only the ignored local hosting-link name, preserving its target/scope.
- Correct-path GET-only checks of `/`, `/pricing`, `/register`, `/support`,
  `/legal/privacy`, `/legal/terms`, and `/api/auth/session` all returned `200`;
  the signed-out session body is `null`. An initial smoke command used obsolete
  `/privacy` and `/terms` paths and reused a prior response after their errors;
  that output is invalid and was discarded. The corrected independent status
  reads above are the actual receipt. No account, payment, email, or fixture was
  created by these public checks.
- Chrome automation cannot start its app-server; in-app browser access to
  GitHub is denied because the admin-enforced policy cannot be verified. No
  bypass was attempted. The user completed the normal GitHub App grant and
  reported access granted. Vercel's owner-specific lookup still reports
  `Vercel App is not installed`; its namespace listing remains incompatible
  with this CLI's automatic team scope. Account metadata does not expose App
  connections and cannot prove whether the grant is missing.
- Automatic approval review rejected `vercel git connect` because App access
  was still unverified. The command did not execute. Requested the normal App
  Configure-page address to identify the exact installation for a supported
  read-only check before retrying. No new Git link or build is claimed. Continue
  from the approved partial settings, or use only the approved owned recovery
  operations if needed; do not create another project or broaden App grants.
- The user provided the exact App installation reference. Installation-scoped
  repository reads still return missing access or no matching repositories.
  A read-only check confirms the existing MassageLab project retains its
  GitHub/`main` link; no old-project setting changed. Requested a normal
  AtmoShaper Vercel Git-selector check to distinguish account association from
  API discovery failure. The user should stop before Connect; the original
  hosting approval remains operative once the prerequisite is verified.

## 2026-10-02 — Production Supporter gate merged; hosting settings verified

- The user approved merging [PR #37](https://github.com/dsbowersock/atmoshaper/pull/37).
  The expected-head merge preserved reviewed
  `fa3e2f9081b37630584c979b92114379ba093e95` and completed at
  `22:54:54Z` as `f184fc1d2ea9cf0adfeff7d810d9db408fc6970e`.
  All seven hosted CI jobs passed; the Linux suite passed 5,113 of 5,115 tests,
  with two skips and zero failures. CodeRabbit's final full review covered all
  ten files with zero actionable comments, no retained architecture concerns,
  and 100% touched-function docstring coverage. Codex was clean and both prior
  threads were resolved. The final full review was triggered promptly after
  its included allowance reset. These counts do not replace PR #36's receipts.
- Review fixes clarified the hosting plan and classified build failures using
  four fixed messages without raw error or signal values. Production gate
  tests passed 14/14 and lint passed after those repairs. No live readiness
  request or payment test was performed by source validation.
- Fresh post-merge deployment reads confirm no build or deployment was
  triggered. The user then restored normal Vercel CLI login and approved
  read-only checks. Authenticated settings match the saved existing target:
  Next.js, Node 24, repository root, no Build/Install/Output override, no Git
  link, and enabled custom-domain auto-assignment. All four current aliases
  point to the approved `READY` live artifact. Both custom domains are verified;
  the apex retains its `308` redirect to canonical `www`.
- The canonical auth origin and both open public launch controls were read
  without recording their values. Excluded purchase switches and Calendar
  credentials remain absent. The 56 project variables target only Production;
  Preview/Development have none. Preview and direct Production deployment
  URLs require Vercel sign-in. No secret export occurred.
- Vercel's exact-owner repository query reports `Vercel App is not installed`.
  The general namespace endpoint cannot run through this CLI's automatic team
  scope, and the GitHub CLI credential cannot list App installations. These
  tool limits do not establish historical installation state. Use the normal
  GitHub App access flow for only AtmoShaper, preserve existing grants, and
  verify repository visibility before connection. The updated
  [hosting plan](superpowers/plans/2026-10-02-atmoshaper-vercel-git-integration.md)
  makes the execution and recovery request concrete.
- This continuation merged source and prepared local documentation only.
  Hosting writes, a remote candidate build, public promotion, Calendar provider
  work, database writes, and old-site changes remain separately gated.
  Registration and recurring Supporter Checkout remain open; one-time support
  and background purchases remain disabled. Do not repeat the live payment test.

## 2026-10-02 — Production Supporter build gate prepared for Git integration

- The user subsequently approved publishing this source PR and shepherding
  reviews. Current Dashboard screenshots show Production has no branch
  configuration and its `Auto-assign Custom Production Domains` control is
  present and enabled. The read-only check is satisfied; do not ask again.
  No hosting write, source merge, remote build, or promotion is authorized by
  this publication/review approval.
- Continued read-only access checks confirm the project-detail connector still
  fails its argument contract and browser use cannot verify its required policy.
  No bypass was attempted. Fresh project listing contains five projects, confirms
  the existing preview-named target, and shows the proposed `atmoshaper` name is
  unused in that scope. Fresh deployment listing reports the same latest `READY`
  Production deployment. No new Git connection or deployment occurred.
- Asked for one new read-only Dashboard observation: whether Production Branch
  Tracking offers `Auto-assign Custom Production Domains` and its current state.
  This was not a repeat of the satisfied Git-status check. The user's subsequent
  Production-detail screenshot establishes that the control is enabled.
- Standard `npm run build` now prepares a Production-only Supporter readiness
  gate between migration status and Prisma generation. It runs the existing
  read-only CLI with fixed live Supporter scope and `--no-dotenv`, preserves
  inherited build credentials, and fails closed on rejection, launch failure,
  signal, or a two-minute timeout. Local, development, and Preview builds skip
  provider access. No new provider owner, payment flow, or configuration is added.
- The focused Production group passes 14/14; existing Stripe readiness/webhook
  coverage passes 62/62 using synthetic provider fixtures. Real nested CLI cases
  prove rejection of missing credentials, drift in either Portal, and enablement
  of either excluded purchase flow. Lint, typecheck, and the standard local build
  pass. Its prebuild visibly skips both Production gates outside Vercel
  Production; this is not a new live readiness receipt.
- Publication/review, Vercel naming/connection/control writes, a remote candidate,
  and public promotion remain distinct checkpoints. The source gate alone does
  not read the unavailable hosting settings, configure Google, activate Calendar,
  change billing switches, or repeat the completed live payment test.

## 2026-10-02 — Calendar source merged; Vercel integration gap confirmed

- The user explicitly approved merging PR #36. The merge used the unchanged
  reviewed head `0c3241cb3052877f07453d31b97b71ae4337e3eb` as its expected
  head and completed at `18:17:55Z` as
  `154f9b6d440e0842892b96e185190c5be1ed2e22`. Fresh GitHub readback confirms
  it is merged. All seven exact-head CI jobs pass; full CodeRabbit coverage of
  all eighteen files has no actionable comments or retained architecture
  concerns, Codex reports no findings, and no review threads remain unresolved.
- Final local receipts for that reviewed source: 81 focused Calendar passes;
  5,108 full-suite tests, 5,105 passed, three expected skips, zero failures;
  lint, typecheck, build, diff checks, and 90 relative migration-doc links pass.
  These are the completed source receipts, not new provider acceptance.
- The user's current Vercel Dashboard screenshot shows the existing live
  AtmoShaper project's preview-era name and `Connect Git Repository`.
  It resolves the earlier manual Git-status question: currently disconnected.
  Existing hosting and sign-in were already operational; the live launch used
  explicit CLI deployments. Fresh post-merge deployment reads report the same
  latest `READY` Production/CLI deployment. PR #36 did not deploy, and the
  public runtime remains reviewed merge `7756080c3bc650bdbcff33013ff67728a3f97efa`.
- Prepared the [existing-project Vercel integration plan](superpowers/plans/2026-10-02-atmoshaper-vercel-git-integration.md)
  for the project name, Git connection, manual promotion control, configuration
  readback, and rollback. The project-detail connector's argument mismatch,
  unavailable local CLI login, and unavailable browser policy check still
  prevent a full current settings read. Do not bypass those access limits.
  The screenshot need not be requested again.
- This continuation performed the authorized source merge and local
  documentation preparation only. No Vercel rename/connection, build, promotion,
  provider configuration, database write, Calendar activation, old-site change,
  or repeated live payment test occurred. Registration and recurring Supporter
  Checkout remain open; one-time support and background purchases remain disabled.

## 2026-10-02 — Calendar PR #36 aggregate read budgets

- Full CodeRabbit review of `9759195` covered all eighteen files and found a
  valid remaining gap: ordinary inbound/outbound target validation paginated
  without a shared deadline, unlike the callback's lock-held discovery.
- Inbound token refresh, identity/target validation, and selected event pages
  now share a 60-second provider read budget. Outbound target validation uses
  a separate 30-second budget. Eight-second per-request limits remain. Inbound
  exhaustion records the failed source without advancing its cursor, stops
  later sources, and does not report a completed refresh. Database commits are
  not limited by these provider signals. New-event POSTs retain their existing
  wait contract so an accepted provider-generated ID cannot be discarded.
- Five regressions first failed against the published source. Six new cases
  cover cached/refreshed validation in both directions, aborted event pagination,
  and an accepted outbound ID returned after its read deadline expires. The
  focused Calendar group passes 81/81; lint, typecheck, local build, diff checks,
  and all 90 relative links in the current migration docs pass. Complete regression and
  required final-head hosted follow-up are tracked in PR #36. No provider,
  deployment, database, billing, or Calendar activation action occurred.

## 2026-10-02 — Calendar PR #36 retries proven pre-POST failures

- A valid Codex thread on the intermediate documentation head identified a
  transient second-phase read failure leaving a newly committed intent blocked
  even though no calendar POST had occurred. It also applies to the current code.
- The adapter reports the dispatch boundary after its abort check and before
  fetch. This invocation also records whether a target was resolved. After a
  proven pre-POST failure, cleanup reacquires the user lock and clears only the
  pending reason on its matching saved row/version. Credentials/history stay
  encrypted and inactive. Failed transactions cancel outstanding discovery
  before cleanup so a late callback cannot dispatch after the intent is released.
  A failed cleanup, changed row, attempted POST, or
  resolved target retains conservative recovery and cannot authorize new creation.
- Two retry regressions first failed against the published implementation, then
  passed after this repair. Five new cases cover UserInfo/inventory failures,
  successful retry, failed cleanup, changed-version protection, and cancellation
  of late discovery after transaction rejection. Existing
  accepted-but-invisible POST and source-rollback regressions remain green.
  The focused group passes 75/75; lint, typecheck, build, diff checks, and all
  65 relative documentation links pass. Complete regression and hosted
  follow-up are tracked in PR #36. No schema or provider identifier changed;
  no live action occurred.

## 2026-10-02 — Calendar PR #36 full review and action documentation

- Full CodeRabbit review admitted at its next included window covered all
  seventeen files through `2cb9a0a` and finished with no actionable comments.
  Codex also reviewed that head without findings; all original threads resolved.
- Its non-blocking documentation metric was 78.79%, below the configured 80%
  threshold. Added focused JSDoc for shared action authentication, active
  connection refresh, and source-selection/cursor rules. This follow-up changes
  documentation only; runtime behavior and the 70/70 focused and 5,094/5,097
  full-suite receipts are unchanged. Current-head hosted follow-up is tracked
  in PR #36; this entry does not authorize a merge or deployment.
- The access helper's existing comment now states the unresolved-intent
  exception instead of promising unconditional credential-row deletion.

## 2026-10-02 — Calendar PR #36 protects creation intent during disconnect

- Codex reviewed `34e5e09` without findings. CodeRabbit independently inspected
  the eight-file creation-intent repair and resolved its retry finding, then
  identified a related direct-action deletion gap outside that repair diff.
- The disconnect action now excludes pending creation intents in the atomic
  user/provider-scoped deletion. Nullable historical reasons and ordinary
  resolved connections remain removable; a rejected request cannot erase an
  unresolved intent or redirect as disconnected. The pending reason is shared
  by connection persistence and this guard without changing its value.
- Five real-action regressions cover pending, active/null, historical-error,
  other-user, and other-provider rows. The focused Calendar group passes 70/70;
  the full suite passes 5,094 of 5,097 tests with three expected skips and no
  failures. Lint, typecheck, build, diff checks, and all 65 relative documentation
  links pass. Latest-head hosted follow-up remains tracked in PR #36.
- This remains source-only preparation. No provider, database, deployment, or
  Calendar activation action occurred.

## 2026-10-02 — Calendar PR #36 durable creation intent

- CodeRabbit's next full review was triggered when its hourly window opened;
  it covered all sixteen files at `2311d61` and finished with no actionable
  comments. Codex identified a remaining valid creation retry gap: an accepted
  calendar POST could remain invisible in the listing after a local abort.
- Split read-only discovery from creation. Under the user-row lock, verified
  identity/scopes and target absence now precede a committed inactive intent.
  It stores encrypted credentials in existing fields with `ERROR` status and
  `GOOGLE_CALENDAR_CREATION_PENDING` reason. Only the invocation that committed
  a new intent may enter the lock-held creation phase. Activation and source
  persistence remain transactional after target readback.
- Retries may reconcile a discovered marked target; they cannot issue another
  POST when a pending intent has no discoverable target. A second-phase rollback
  retains the prior intent. This additive state changes no Prisma schema,
  encryption contract, existing target ID, or Google marker. Old inactive rows
  without that reason retain their previous continuity rules.
- Provider-free regressions model an accepted but invisible creation after
  abort, eventual readback, and source-inventory failure after a target save.
  The focused group passes 65/65. The final full suite passes 5,089 of 5,092
  tests with three expected skips and no failures. Lint, typecheck, build,
  diff checks, and all 65 relative documentation links pass. Latest-head hosted
  follow-up remains tracked in PR #36. The transaction double models rollback, not live
  PostgreSQL contention or provider consistency.
- Operator reconciliation must not clear the intent from elapsed time or an
  empty listing alone. Exact provider/row evidence and write approval are needed
  for an unresolved attempt. Rollback must disable the integration before
  restoring code that does not honor this pending reason; preserve the rows.

## 2026-10-02 — Calendar PR #36 event-insert timeout compatibility

- The second Codex review identified an introduced retry hazard: Google may
  accept a new-event POST before a local eight-second deadline expires, leaving
  no stored provider event ID and causing the next sync to insert a duplicate.
- Kept the existing wait behavior for new event inserts, one of the review's
  proposed remedies. Reads, existing-ID updates, and lock-held calendar
  discovery/creation remain bounded. This focused repair does not introduce
  deterministic provider event IDs or change the existing reconciliation keys.
- Added an actual-adapter regression that defers an insert response, retains
  its returned ID without creating a local timeout, and uses a bounded PATCH
  for the next update. The focused Calendar group passes 63/63. The final full
  suite passes 5,087 of 5,090 tests with three expected skips and no failures.
  Lint, typecheck, build, diff checks, and all 65 relative documentation links
  pass. Final-head hosted follow-up is tracked in PR #36.
- Existing transport failure and duplicate-retry acceptance still require
  isolated provider QA before public Calendar activation; preserving prior
  behavior is not a claim of end-to-end event-insert idempotency.

## 2026-10-02 — Calendar PR #36 initial review repairs

- Published [PR #36](https://github.com/dsbowersock/atmoshaper/pull/36) under the
  user's explicit source-publication and CodeRabbit shepherding approval.
  The initial full CodeRabbit review covered all fifteen files; Codex also
  reviewed the published head. Both returned one valid finding.
- Inactive connections for another Google account remain historical rows and
  no longer block a new connection. An active account still requires explicit
  disconnect before replacement; a returning account's stored target remains
  authoritative and must pass validation, even when its row is inactive.
- Google requests now have an eight-second limit. A shared 30-second deadline
  starts before lock acquisition and covers discovery, creation/readback, and
  source inventory, leaving room within the 45-second transaction budget.
  Paginated responses cannot start another provider request after that deadline.
  These limits retain discovery and creation under the user-row lock; they do
  not make a Google write atomic with the database transaction.
- Added regressions for all three inactive statuses, valid and invalid returning
  targets, single-request aborts, and paginated deadline exhaustion. The focused
  Calendar group passes 62/62. Initial CI and the first local repair run found
  only the stale project-state date ceiling; aligned it with October 2 evidence.
  The final full suite passes 5,086 of 5,089 tests with three expected skips and
  no failures. Lint, typecheck, build, diff checks, and all 65 relative links in
  changed docs pass. The local build skipped the Vercel Production migration
  gate and did not deploy. Required final-head hosted follow-up is tracked in
  PR #36.
- Merge, provider setup, live acceptance, deployment, and public Calendar
  activation are outside this approval. No old-site, payment, or provider change
  was performed.

## 2026-10-02 — Separate AtmoShaper Calendar compatibility preparation

- Verified hosted `main` at PR #35 merge
  `572691aad5e48e01089097d59799aea19d92ba83` and the clean existing migration
  worktree before creating `codex/atmoshaper-calendar-isolation`. The original
  root checkout and its unrelated untracked artwork remain intact.
- PR #35's full CodeRabbit review covered all twelve documentation files with
  no actionable comments; all seven CI jobs passed and all threads were resolved.
  The user explicitly authorized its merge. It did not deploy.
- Continued the selected separate-calendar plan with provider-free source
  changes. Discovery now requires Google subject identity, owner/non-primary
  evidence, an AtmoShaper marker, complete hidden/paginated inventory, limited
  Calendar grants, and API metadata. A stored target remains authoritative after
  a rename. Unmarked namesakes, ambiguity, inaccessible targets, and account
  mismatches stop before creation or persistence.
- Callback discovery and token persistence share the user-row lock. Account
  changes require explicit disconnect instead of deleting the old connection
  implicitly. Both inbound and outbound sync validate their target; generic
  display summaries use AtmoShaper while `GOOGLE`, the state cookie, Prisma
  fields, and `massagelabEventId` remain unchanged.
- Added the named `test:calendar-sync` group and actual adapter/callback/service
  regressions for reconnects, old-calendar coexistence, failures, scope limits,
  and privacy. The final focused group passes 55/55. The full regression run
  passed 5,077 tests with three skips and no failures; its 5,080-test snapshot
  predates the final two focused refresh/mapping regressions. The last mapping
  guard and those regressions pass in the current focused group. Local lint,
  typecheck, production build, diff checks, and all 65 relative documentation
  links pass. The user authorized publication and CodeRabbit shepherding;
  hosted review is pending. The new implementation is not deployed or activated.
- The exact Google Cloud/OAuth target remains a provider-stage input. No provider
  setting, calendar, token/row migration, environment, deployment, payment, or
  old-site mutation was performed. The prior live payment test remains complete.

## 2026-10-01 — Public registration and recurring Supporter activation

- Review identified stale pre-launch wording in the stable billing and release
  runbooks. Reconciled their current sections with the completed activation,
  exact v2 topology, scoped read-only verification, disabled purchase flows,
  and preserved historical receipts. This repair changes documentation only;
  it does not rerun provider setup, catalog migration, or the live payment test.
  A follow-up review corrected the v2 bootstrap verifier's placement: its empty
  subscription/Checkout prerequisites make it unsuitable for routine post-launch
  checks. Expected active enrollment does not imply catalog damage or authorize
  recovery; Supporter-only readiness is the routine current verification owner.
  Reconciled the indexed deployment runbook as well: its current gate preserves
  both open pause flags, its bootstrap sequences are historical, and any future
  one-time-support proof remains a separate disabled-flow launch requirement.
- The user clarified that MassageLab will continue after the migration as a
  separate project. The user then kept its future direction outside this work; the
  current AtmoShaper platform migration keeps its approved scope. Preserve the
  existing full legacy service and continue focusing on AtmoShaper.
- The user selected a separate Google calendar named `AtmoShaper`, rather than
  adopting or renaming the old project's calendar. Added the
  [Calendar preparation plan](superpowers/plans/2026-10-01-atmoshaper-google-calendar-preparation.md)
  with source owners, configuration evidence, compatibility tests, provider
  gates, and rollback boundaries. No Calendar runtime or provider change occurred.
- Read-only Production environment-name inventory still lacks Calendar OAuth
  credentials and its token-encryption key, Ably's server key, Sentry's DSN,
  and R2 upload credentials. Presence inventory is not credential validation
  or a playback/realtime test. The old production project remains `READY` at
  the preserved export source; a vault-source comparison changes only invalid
  format error copy and adds the public identity import, not the envelope or
  storage identifiers. This is source evidence, not encrypted browser recovery.
- After the read-only legacy routing check, the user chose to keep the full
  MassageLab site available alongside AtmoShaper. No old-domain deployment or
  routing change is authorized by that preference. Preserve the full existing
  service, local records, authentication, and legacy billing; migration to the
  new site does not authorize redirects, cancellations, transfer, or retirement.

- The user explicitly authorized the prepared two-flag activation, one build,
  conditional promotion, and bounded rollback. That approval replaced the
  earlier instruction to keep public registration and Checkout paused; excluded
  one-time support and background purchases remained disabled.
- Updated only `MASSAGELAB_PUBLIC_REGISTRATION_PAUSED` and
  `MASSAGELAB_SUPPORTER_CHECKOUT_PAUSED` to `false` in Production. Their exact
  readback passed; both excluded purchase switches remained unset.
- One activation candidate packaged only tracked source from reviewed merge
  `7756080c3bc650bdbcff33013ff67728a3f97efa`. Actual live Supporter-only
  readiness passed at `2026-10-02T01:21:04Z`, both managed catalogs reported
  `stripe_api`, and the read-only migration-status gate passed. The app build
  reached `READY`; the authorized promotion then moved the existing project
  aliases to that exact candidate. The pre-promotion convenience-alias side
  effect was restored before the promotion, preserving the saved live release.
- Final readback confirms all four original aliases point to the approved
  candidate. Apex `/register` returns `308` to the canonical matching route.
  GETs of home, Pricing, registration, support, Privacy, Terms, and anonymous
  session return `200`. Registration includes email/password inputs and no
  pause message; Pricing has no Supporter pause; the session response is `null`.
- Smoke-check assumptions were corrected to the actual `/legal/privacy` and
  `/legal/terms` routes and controlled registration inputs' IDs. Those were
  operator-check corrections, not application changes. Browser automation's
  policy check was unavailable, so no visual or interactive browser claim is
  made and no browser-policy workaround was attempted.
- No repeat live test, account submission, Checkout creation, payment, refund,
  email, migration application, catalog mutation, or private database-row write
  occurred. Existing credentials and compatibility contracts are unchanged.
  Temporary exports and the exact source staging directory were removed; the
  paused rollback deployment remains available.
- Canonical closeout documentation now links the
  [migration status guide](wiki/migration-status.md), which separates completed
  milestones from remaining old-origin/PWA proof, deferred provider decisions,
  compatibility retirement, and optional audit/refactor work.

## 2026-10-01 — Supporter live readiness passed; public activation prepared

- PR #34 merged as `7756080c3bc650bdbcff33013ff67728a3f97efa` after all seven
  hosted CI jobs passed at `896c6d3edd369ca13c8140f22f37c4ee239c84da`.
  Codex and CodeRabbit covered that head; the sole review thread was resolved.
  The hosted suite passed 5,053 tests with two skips and zero failures.
- Under separate authorization, one unpromoted Vercel Production-target build
  packaged only tracked files from the exact merge. Existing write-only
  credentials supplied to the remote build passed the live Supporter-only CLI
  at `2026-10-02T00:56:43Z`. Both exact Portal catalogs reported `stripe_api`;
  the twelve Prices, six-Product topology, recurring-tax attestations, and
  complete pinned webhook contract passed. Both excluded flows reported
  `not_applicable (disabled)`. The read-only migration-status gate passed,
  followed by a successful app build and `READY` deployment.
- The public domains remained on the previous deployment. Vercel assigned one
  convenience alias despite `--skip-domain`; the exact alias was restored and
  all four original assignments verified. Both public pauses remained `true`,
  both excluded purchasing switches remained unset, and public `/register`
  still displayed its pause message. Candidate application-page smoke remains
  unclaimed because the direct URL requires Vercel authentication.
- No secrets were replaced, permissions expanded, migration applied, catalog
  mutated, or live payment/refund test repeated. Temporary environment exports
  and the exact temporary source copy were removed. A sanitized receipt was
  retained locally and recorded in the merged PR's validation description.
- Continued from verified clean `main` in the existing rollout worktree on
  `codex/atmoshaper-supporter-launch-closeout`. Updated the canonical record and
  prepared the [public-activation plan](superpowers/plans/2026-10-01-atmoshaper-supporter-public-activation.md).
  This follow-up is documentation only. Public activation still needs explicit
  authorization overriding the current pause instruction; the plan itself
  changes no environment, deployment, domain, account, or payment state.

## 2026-10-01 — Supporter-only readiness merged; Portal readback follow-up

- PR #33 merged as `26413ee091e960a24a0eb3d67c25cfa0caafbf89` after a fresh
  clean-worktree and hosted-head check. All seven hosted CI jobs passed;
  Codex and CodeRabbit covered `c0e88e26f8fe524328ff1047c91b6719c5d3172a`
  without actionable findings, and hosted review threads were empty.
- Continued from that merged commit in the existing clean rollout worktree on
  `codex/stripe-portal-catalog-readback`. Explicit retrieval expansion of
  `features.subscription_update.products` returns both live managed catalogs.
  The checker now requests it rather than relying on an ordinary response.
  Default-topology list calls preserve their existing request contract.
- Independent read-only Stripe evidence, compared with the actual production
  billing configuration through repository validators, passes all twelve
  Price mappings, six-Product topology, both three-Product/six-Price Portal
  allowlists and management policies, tax attestations, and the exact pinned
  webhook. Ohio's live registration remains active. Dashboard supports the
  default personal Portal; non-default business settings are API-managed.
- Both public pause flags remain `true`; one-time support and background
  purchase enablement switches remain unset. Production is `READY`. Vercel
  secrets remain write-only: the full CLI run on a temporary config export
  fails because exported Stripe secrets are placeholders. The export was
  removed. Actual credential verification still requires a trusted process
  with those values and cannot be replaced with connector evidence.
- Focused CLI and webhook regressions pass 62/62. Two new tests first failed
  for the expected missing expansion and hidden drift, then passed with the
  explicit readback. Empty, mismatched, or cross-use catalogs still fail;
  operator confirmation cannot override returned drift. Hosted checks and
  reviews belong to the containing follow-up PR.
- No public activation, provider write, deployment, database write, or repeat
  of the completed live payment/refund test occurred.

## 2026-10-01 — Supporter-only readiness candidate

- Verified the clean existing Stripe rollout worktree and hosted `main` at
  `fcff28c01ebd545f310679961b7ca0da19e19c13`, then created the focused
  `codex/atmoshaper-supporter-only-readiness` branch under the existing PR
  preparation and review approval.
- The read-only readiness CLI adds `--supporter-only`. It checks false or
  unset runtime switches for one-time support and background purchases instead
  of requiring those excluded flows to be configured and enabled. Ambiguous
  switch values fail closed. Successful output labels both excluded flows
  `not_applicable (disabled)`; the default full-payment behavior is retained.
- Recurring tax, secret presence and mode, all twelve Price identities,
  reconciliation uniqueness, both managed Portals, live default topology, and
  the complete pinned webhook remain required. The new regression file runs
  the actual CLI with a hermetic environment and replaces only the Stripe SDK.
  Four expected missing-mode regressions failed before the repair; the named
  `test:stripe-readiness` group now passes 60/60 with no failures or skips.
- Prior controlled live-payment cleanup is complete: subscription cancellation,
  full refund, and webhook convergence were confirmed before this branch.
  That completed test is not repeated. Fresh Portal Dashboard evidence and
  credential verification in a trusted environment remain external launch
  gates. Vercel's inability to export write-only secrets does not establish
  that production lacks them.
- Registration and public Checkout remain paused. No runtime payment path,
  provider configuration, deployed environment, database, deployment, or
  payment changes occur. The containing readiness PR owns subsequent exact-head
  hosted checks and review; merge and activation remain separately authorized.
- Local verification passes: full tests 5,053 total, 5,050 passed, three
  documented skips, zero failures; Prisma validation; typecheck; lint; the
  production build with 115 static pages; and diff hygiene. The existing Babel
  large-file and Anatomime initialization notes remain non-failing. No local
  provider lifecycle or live payment test was needed for this CLI-only change.
- The optional brand audit exposes stale exact rules for earlier Stripe
  identity changes in unchanged billing, readiness, migration, and test owners.
  No policy category or baseline was changed to clear that existing failure.

## 2026-09-29 — Live default-Portal topology repair

- PR #29 merged as `ee932ef2c33a8c28bf7dd6cdce612955d81413ee` after its
  exact-head hosted checks and CodeRabbit review completed without actionable
  comments. The user explicitly treated hosted Codex review as a bonus rather
  than a merge gate while that separate quota was exhausted.
- The authorized live migration created all six Products, all twelve Prices,
  and the personal-use Portal, then stopped fail-closed before creating the
  business-use Portal. Stripe made the first API-created Portal the account
  default, but the reviewed migrator had modeled both managed Portals as
  non-default. No Customer, subscription, open Checkout Session, payment, or
  refund exists, and public registration and Checkout remain paused.
- The focused repair models Stripe's fresh-account behavior, accepts only the
  exact managed personal Portal as the single default, and still requires the
  managed business Portal to be non-default. Regressions prove a resumed plan
  preserves the existing personal Portal, requests only the missing business
  Portal, and rejects a business Portal promoted to default.
- CodeRabbit then identified that final readiness still enforced the sandbox
  retained-v1/non-default topology under `--live`. The shared default-status
  contract now permits only the managed personal Portal in Stripe's single live
  default slot. Dedicated live readiness uses the twelve v2 Price mappings,
  requires that exact personal default, keeps the business Portal non-default,
  and neither requires nor retrieves retained v1 sandbox mappings. Sandbox
  readiness preserves its retained-v1/default behavior. Integrated regressions
  prove a v2-only live account passes and a business default fails closed.
- This branch makes no Stripe, Vercel, Neon, database, deployment, payment,
  subscription, tax, DNS, or email-provider change. The adjacent Stripe,
  Portal, and readiness group passes 90/90; the compiled-module final-review
  contract passes 13/13; typecheck, lint, and diff checks pass; and the full
  suite records 5,037 tests with 5,034 passed, three host-dependent skips, and
  zero failures.

## 2026-09-29 — Supporter v2 live cutover candidate

- PR #28 merged as `0695c740f605b75a91d589c831ca236dff4230a2` after its
  exact-head hosted checks, Codex, CodeRabbit, and review-thread gates passed.
  The receipt removes the private deployment identifier and records the
  completed sandbox Checkout, Portal, signed-webhook, database, and cleanup
  acceptance without changing provider state.
- The next isolated branch extracts the immutable v2 catalog and managed-Portal
  request contract from the sandbox-only orchestrator. The accepted sandbox
  behavior remains covered while the oversized migration and test owners become
  smaller rather than receiving live responsibilities.
- A separate live verify/plan/apply command supports the empty dedicated
  AtmoShaper live account. It accepts live or restricted-live credentials,
  requires the expected account identity and live mode, blocks on any unowned
  catalog or non-default Portal, subscription, open subscription Checkout,
  target lookup-key collision, managed drift, or pinned live-webhook mismatch,
  and uses deterministic creation plus post-write readback.
- Provider-free fixture apply/replay proves the exact six Products, twelve
  Prices, and two use-specific Portals are created once. Omitted Portal
  catalogs require a fresh exact Dashboard inspection before verification.
  The first hosted review repair also requires each post-create Product and
  Price receipt to retain the requested managed identity before any dependent
  write, with a regression proving mismatches stop before Portal creation.
  Focused documentation now covers the non-obvious changed helpers. The
  focused live and sandbox migration suites pass 23/23, and the expanded
  Stripe/readiness/Checkout/Portal regression group passes 355/355. Typecheck
  and lint pass. The full suite records 5,032 tests: 5,029 passed, three
  host-dependent skips, and zero failures. The production build compiles,
  completes TypeScript, and generates all 115 static pages; its existing
  Anatomime poll-shedder initialization notice remains non-failing. No Stripe,
  Vercel, Neon, database, deployment, payment, subscription, tax, DNS, or
  email-provider mutation occurred.

## 2026-09-29 — Supporter v2 deployed sandbox acceptance and cleanup

- PR #27 merged as `9608849d08af3d7f919a6a472117d73baf5b4684` after
  exact-head hosted checks, Codex, CodeRabbit, and review-thread gates passed.
  The merged repair requires a fresh operator inspection after a managed Portal
  write and keeps API-visible catalog drift authoritative.
- The reviewed sandbox migration now has the complete retained v1 catalog,
  complete use-specific v2 catalog, separate personal and business Portals, the
  exact enabled test webhook, an active Ohio sandbox tax registration, and the
  required test identities in Vercel Production. Public registration and new
  Supporter Checkout remained paused outside the controlled test window.
- A bounded deployed acceptance used two exact owned `.example.test` users.
  The real hosted Checkout completed one personal and one business one-dollar
  monthly sandbox subscription with automatic tax. Signed webhook delivery
  created two active local subscriptions, and authenticated normal-management
  plus subscription-update Portal sessions preserved the expected catalog
  boundary for both users.
- Cleanup canceled both sandbox subscriptions and observed both signed deletion
  events applied locally before deleting the two sandbox Customers. It then
  deleted both synthetic users, six owned membership webhook receipts, and six
  owned legal acceptances. Closing proof found zero owned nonterminal Stripe
  subscriptions and zero owned database rows. Completed Stripe test Sessions
  and events remain only as immutable sandbox audit history.
- The final production deployment is ready at `atmoshaper.com` with both public
  registration and Supporter Checkout paused.
  The production build passed the migration gate, Prisma generation, Next.js
  compilation, and TypeScript. The public registration endpoint returned the
  expected `503`; the pre-existing missing Sentry source-map token warning
  remained non-failing.

## 2026-09-29 — Managed Portal catalog API-omission compatibility candidate

- PR #26 merged as `27acafb8946ba97b34061ac724b276c2eb74a312` after the
  exact-head checks, Codex, CodeRabbit, and review-thread gates passed.
- The authorized sandbox plan required only two managed Portal creations. The
  apply created the personal-use Portal, then failed closed at readback because
  Stripe omitted its `features.subscription_update.products` field. The
  post-failure read-only plan proved all Products and Prices remained complete,
  the personal Portal existed with exact API-visible settings, the business
  Portal was still absent, and no subscription or open Checkout inventory was
  introduced.
- Direct list and retrieve evidence confirmed Stripe omits the managed catalog
  just as it omits the retained default catalog. The focused repair keeps
  API-visible allowlist drift authoritative, classifies an exact omitted field
  as requiring operator evidence instead of a no-op update, and accepts only an
  exact process-local confirmation after both managed three-Product/six-Price
  catalogs are inspected in the Dashboard. Persisted dotenv evidence remains
  disallowed.
- The provider-shaped regression creates both managed Portals once despite the
  omission, requires the confirmation before completed verification, and proves
  the confirmation cannot override visible drift. Focused migration and
  readiness validation passes 56/56. Production Checkout remains paused.

## 2026-09-28 — Default Portal catalog API-omission compatibility candidate

- PR #24 merged as `4b5ef0580668f8abf54a0c6be79008390df3f427` after
  exact-head hosted checks, Codex, CodeRabbit, and review-thread gates passed.
- The first reviewed read-only provider plan exposed a Stripe response gap:
  both the pinned API and a newer preview response omitted the
  Dashboard-managed default Portal Product catalog. The Dashboard itself shows
  the intended retained v1 three Products and six Prices, with plan switching
  enabled and quantity changes disabled; no Dashboard edit was needed.
- A narrow follow-up now treats an omitted field separately from an empty or
  mismatched field. Only omission can use the exact process-local
  `ATMOSHAPER_STRIPE_DEFAULT_PORTAL_CATALOG_CONFIRMATION`; API-visible drift
  always fails closed. The same shared boundary covers migration planning and
  final Stripe readiness. Focused migration/readiness tests passed 50/50; the
  expanded final-review group passed 63/63. Typecheck, lint, diff validation,
  and the 115-page production build also passed.
- Exact-head Codex and CodeRabbit review then found that the confirmation could
  be loaded from a persisted dotenv file and that repeated Price keys/IDs or a
  split Product identity could satisfy the coarse inventory count. The repair
  captures the confirmation before dotenv loading, removes it from
  `.env.example`, and proves all six expected unique Price keys and IDs map as
  two Prices each to three distinct unsplit Products. Focused migration and
  readiness validation passes 52/52; lint, typecheck, and diff checks pass.
- No Stripe, Vercel, Neon, database, deployment, payment, subscription, tax,
  DNS, or email-provider mutation occurred in this compatibility candidate.

## 2026-09-28 — Supporter v2 sandbox migration candidate

- PR #23 merged at `b6652e0c2ed0dd5ce5e583cabdc9a8273d71bff2`, making
  buyer-selected personal or business use part of the reviewed public Checkout
  contract.
- Started the next slice from that exact merge in an isolated worktree. The
  candidate adds a test-only verify/plan/apply command for six amount/use
  Products, twelve recurring Prices, and two use-specific Customer Portal
  configurations. It requires a test key, exact expected account ID, safe
  inventory, and a process-local apply phrase; every write is reread and reruns
  converge through deterministic keys.
- Runtime Portal creation now selects the personal or business configuration
  from the persisted configured Price. Recognized v2 subscriptions fail closed
  if their required configuration is absent; retained v1 subscriptions keep
  default-Portal compatibility.
- Exact-head hosted review found two activation gaps. The candidate now rejects
  current Price IDs duplicated in any current, pre-classification, or historical
  reconciliation namespace, and Stripe readiness retrieves both configured
  Portals to verify their mode, AtmoShaper metadata, and exact use-specific
  Product/Price allowlists before Checkout can be enabled.
- A follow-up exact-head review tightened the Portal boundary again: the
  retained default v1 Portal cannot be classified or updated as a managed v2
  Portal, and readiness verifies the complete Price-only, unchanged-cycle,
  non-prorated, immediate trial-ending transition behavior.
- CodeRabbit then identified an unsupported nested Portal expansion in the
  readiness lookup plus the migration's Portal list and mutation-verification
  lookups. All Portal reads now omit that expansion and validate the
  Product/Price IDs returned directly by Stripe.
- The next exact-head Codex pass found two remaining readiness gaps. Readiness
  now rejects duplicate Price IDs across the same current and reconciliation
  union used by runtime, and a shared Portal contract verifies customer-profile
  fields, invoice history, payment-method updates, cancel-at-period-end without
  proration, and the exact approved cancellation reasons. Focused migration and
  readiness validation passed: 42 passed, 0 failed.
- The following exact-head Codex pass found that the retained default Portal's
  v1 transition topology and managed Portal profile inheritance were not yet
  proven. Migration planning now requires the default Portal's exact three-
  Product/six-Price v1 allowlist plus the shared transition policy. Readiness
  retrieves that default without unsupported expansions and compares its
  headline, policy URLs, and return URL with both managed Portals. The hosted
  compiled-module regression was updated for the new production dependency.
- The next exact-head review found that readiness used the retained default only
  as a profile template. Readiness now retrieves all six configured v1 Prices
  and independently requires the default Portal's complete three-Product/six-
  Price allowlist, billing-management features, and reviewed transition policy.
  Regressions fail closed on drift in each contract class.
- The following exact-head Codex review found that migration planning could
  accept archived retained-v1 Products or Prices and readiness trusted the six
  retrieved IDs without proving their catalog semantics. Migration now requires
  active retained objects. Readiness validates each Price's mode, recurring
  amount and interval, v1 metadata identity, and expanded Product's active mode,
  name, tax code, and v1 identity before using it as Portal evidence. Focused
  migration, readiness, and final-review validation passed: 58 passed, 0 failed;
  the adjacent six-suite membership/Portal group passed: 101 passed, 0 failed.
- Exact-head Codex and CodeRabbit then found two independent fail-closed gaps.
  Customer Portal creation now classifies every nonterminal subscription for
  the Stripe Customer and refuses a session when their personal/business Portal
  configurations disagree. Readiness now skips default-Portal allowlist
  comparison when any retained v1 Price retrieval failed, preserving the exact
  retrieval failure instead of adding a misleading drift diagnosis. The focused
  Portal, readiness, migration, final-review, and workload suites passed: 86
  passed, 0 failed; typecheck, lint, and diff checks passed.
- No Stripe, Vercel, Neon, database, deployment, payment, subscription, tax,
  DNS, or email-provider mutation occurred in this code-only candidate.

## 2026-09-27 — Buyer-selected Supporter use classification candidate

- Started from merged PR #22 at
  `fe66328c3c47ff2321654eea1749334f347bb1ce` in a separate isolated
  worktree. The buyer now must identify whether the Supporter membership is for
  personal non-business use or work/business use before new Checkout.
- Both choices retain the same $1/$2/$5 monthly and $10/$20/$50 yearly
  amounts, Supporter level, and benefits. The server maps the normalized choice
  to a fixed classification-specific Price; request input never supplies a tax
  code.
- The v2 target contract contains six amount/use Products and twelve Prices,
  using `txcd_10103000` for personal SaaS and `txcd_10103001` for business
  SaaS. The existing v1 generic catalog remains reconciliation-compatible but
  cannot satisfy a new public Checkout selection after cutover.
- Existing subscriptions, historical Price mappings, webhooks, and database
  rows remain readable. This candidate makes no Stripe, Vercel, database,
  deployment, payment, subscription, registration, or tax-setting mutation;
  Production Checkout remains paused.

## 2026-09-27 — AtmoShaper Stripe technical-identity candidate

- Began from merged PR #21 at
  `a5ad3d8f19e648bc626af7c1244fcce77d34740e` in a separate isolated
  worktree. A bounded read-only check found the dedicated AtmoShaper test
  environment empty of Products, recurring Prices, webhook endpoints, Portal
  configurations, and subscriptions.
- Added one shared Stripe provider-identity owner. New and repaired catalog
  objects use current AtmoShaper metadata; exact legacy metadata and agreeing
  dual schemas remain readable, while partial or contradictory ownership
  evidence fails closed.
- Readiness, open-Checkout compatibility, and the catalog migration now share
  that owner. The pinned endpoint is
  `https://www.atmoshaper.com/api/billing/webhook`, and inline one-time-support
  Checkout copy derives the AtmoShaper public identity.
- Historical `massagelab_*` metadata, idempotency families, one-time-support
  purpose, runtime Price mappings, database fields, and webhook reconciliation
  remain compatibility inputs. They are eligible for later retirement only
  after post-cutover inventory proves no dependency remains.
- This candidate made no Stripe, Vercel, Neon, database, deployment, payment,
  subscription, DNS, or email mutation.

## 2026-09-27 — Final AtmoShaper presentation assets merged

- Started from merged PR #20 at
  `5e659560ae801d8765de2b6c1190c5c9c0ddb76d` in a separate isolated
  worktree; the Stripe technical-identity work remains on its own branch.
- Promoted web-ready copies of the user-approved logo, logo-plus-name wordmark,
  and integrated word treatment into stable `/brand` paths. The full original
  export library, including oversized masters and light variants, remains
  untouched in the user's source checkout.
- Replaced the framework favicon, PWA icons, maskable icons, and Apple touch
  icon with the supplied exports. The installed-app assets deliberately use the
  dark variants to match the declared dark PWA theme. The file labeled as a
  16px favicon export is actually 20px and is not wired separately; the
  supplied ICO embeds 20px, 32px, and 48px entries.
- `PUBLIC_PRODUCT_IDENTITY` now selects the final wordmark and square logo. The
  responsive contract requires the wordmark where space permits, the logo in
  narrow containers, and a hidden brand link only where neither can fit.
  Focused identity, cache, app-shell, and provider-free browser-harness tests
  passed. PR #21 merged as
  `a5ad3d8f19e648bc626af7c1244fcce77d34740e`. No provider, deployment,
  domain, OAuth, Stripe, or database setting changed.

## 2026-09-27 — AtmoShaper Stripe public catalog identity candidate

- Started from current `origin/main` at
  `122dd9f07995f62c758627ea6fc4cd3da4909dfb` in an isolated worktree.
- The shared Stripe contract now derives the public Supporter Product name from
  `PUBLIC_PRODUCT_IDENTITY`, while migration reuse can repair a stale display
  name only after the exact private classification, tax, and active-state
  contract matches.
- Private `massagelab_*` metadata, idempotency keys, environment names,
  historical reconciliation inputs, prices, subscriptions, and webhook
  contracts remain unchanged. No provider write or deployment was performed.
- Focused red tests first proved the old public name, then the membership,
  migration, readiness, billing, and repository-audit suites were brought back
  to green. The 4,955-test suite, typecheck, lint, audits, and build all passed.

## 2026-09-27 — Production provider-readiness audit after migration merges

- Current `main` is `06cb73035c7695a5f96e19a5ee9274f2e16c1c6a`; the anatomy repair
  and support-contact update are merged, and CI `36296398216` passed all seven jobs.
- Production home, pricing, support, Privacy, Terms, and anonymous session
  endpoints returned 200; the anonymous session response remained `null`.
- Read-only Stripe inventory found three customer records, one active two-dollar
  monthly subscription, and one canceled one-dollar monthly subscription. The
  active subscription does not belong to the fresh administrator identity.
- The local Prisma client generated successfully and the schema validated.
  Production credentials remained non-exportable, while the authenticated Neon
  CLI still listed only the legacy source project, so no database rows were read.
- A one-week reminder owns the deferred OAuth branding-verification check. The
  sanitized receipt lists the remaining billing, Calendar, database, telemetry,
  realtime, and media decisions. No live payment, database, provider, DNS,
  deployment, or customer mutation was made during this audit.

## 2026-09-25 — Bounded anatomy consistency repair prepared before data cutover

- A read-only, isolated audit of the migrated anatomy catalog found nine
  muscle-action rows whose referenced movement belonged to a different joint,
  plus one definite extensor carpi radialis longus origin landmark mapped to a
  femur landmark despite the attachment bone being the humerus.
- Regression coverage reproduced all ten findings before the seed repair. The
  action validator now rejects joint/movement ownership mismatches. The bounded
  seed correction introduces an explicit metacarpophalangeal-flexion movement,
  reuses thoracic-cage expansion for thoracic rib mechanics, and adds the proper
  lateral supracondylar ridge of the humerus. Corrected generated actions retain
  their existing database slugs so idempotent seeding updates rather than
  duplicates the five affected rows.
- The anatomy foundation suite passes after the repair. No database, provider,
  deployment, production data, or identity cutover action is part of this branch.
- Larger catalog observations are preserved as non-blocking future work in
  [`audits/2026-09-25-anatomy-catalog-follow-ups.md`](audits/2026-09-25-anatomy-catalog-follow-ups.md).

## 2026-09-22 — PR #13 gated; final Phase 6 integration in progress

- The bounded Task 8 record correction reached open, unmerged PR #13 head
  `5345c7cc2f413e4dfd33def15bff5c8e99151243`. CodeRabbit and Codex
  completed clean exact-head reviews, all prior actionable threads are
  resolved, and all seven strict CI jobs in run `35768851810` passed. The
  first small replacement pilot had received actual CodeRabbit review before
  the later slices were published; these gates cover PR #13, not Task 9.
- In the approved isolated worktree, final Task 9 begins from that exact
  head on `codex/phase6-09-integration-closeout`. It restores missing Phase 6
  integration contracts and reconciles current authority with the reviewed
  recovery source without discarding later repairs. Source-equivalence proof,
  the exact occurrence-level audit fixed point, independent SPEC then QUALITY,
  a final replacement PR, its own hosted reviews and strict CI are pending.
  Original PR #5 and its branch remain intact and unmerged. The separate Linux
  Atmosphere snapshot-refresh decision remains pending; no PNG, provider,
  production, billing, deployment or merge action is authorized here.

## 2026-09-21–22 — Task 7 fully gated; Task 8 legal identity candidate implemented

- Final Task 7 amendment `995fc4f7ce44902002ef2b36c7af1195dbdcb562`
  repaired six verified current collision-note references and strengthened the
  all-note/all-batch oracle against overlapping current and retired names.
  Independent SPEC then separate QUALITY approved the frozen package. Codex and
  CodeRabbit completed clean on the exact head; strict CI `35578132889`
  passed quality, build, all four browser lanes and aggregate QA. PR #12 remains
  open and unmerged with all four prior threads resolved or outdated.
- Created `codex/phase6-08-legal-identity` from that exact reviewed head in the
  approved isolated worktree. Before implementation, the archive verifier passed
  9/9 and both immutable v2 SHA-256 pins matched their recorded values.
- Read-only scoping identified the 13 manifest paths plus required companions
  `lib/seo.js` and `tests/seo.test.mjs`. README is a partial current-record
  owner because the recovery copy contains obsolete completion claims. The
  shared public-routes source delta is streaming-only, and audit core/policy/test
  source copies would undo reviewed repairs, so neither shared owner enters this
  slice. The initial planned scope was 19 files.
- Test-first redistribution applied six source tests first. The old v2 code
  produced eight expected failures among 31 tests: registry/acceptance, license
  identity, legal-page copy and legal sitemap dates. At the initial pre-QUALITY
  freeze, after the eight product/legal owners moved, all 14 implementation/test
  blobs matched recovery source exactly. The later operator-doc repair moved
  `tests/stripe-readiness.test.mjs` out of that set, leaving 13 source-exact
  paths in the published 20-file scope. Archive verification passed 9/9; the focused final suite passed
  85/85; the post-ordering SEO run passed 12/12; focused ESLint and diff checks
  passed.
- The candidate sets current general and digital purchase versions to
  `2026-09-legal-v3` and `2026-09-digital-purchases-v3`, both effective
  September 14, 2026, under
  `Derrick Bowersock, doing business as AtmoShaper`. Tests prove an old v2
  acceptance does not satisfy v3 and remains byte-for-byte unchanged after a
  genuine v3 acceptance is recorded. No schema, migration or backfill changed.
- Root reconciled README and delivery records without importing recovery's stale
  Task 9/head/Browser-QA claims. Prisma validate/generate, typecheck, lint, the
  initial Node suite (4,728 passed, three skipped, zero failed), production and
  Browser-QA builds (115 pages each), and the existing anonymous-registration
  legal-gate smoke on desktop and mobile Chromium passed provider-free. No
  snapshot changed.
- Independent SPEC passed that frozen candidate. Separate QUALITY then found the
  operational billing wiki still instructed operators to configure the retired
  v2 digital-purchase document version, while runtime and readiness now require
  exact equality with v3. The base and recovery source were both stale, and no
  test coupled the operator instruction to the exported constant. A focused
  regression failed on the v2 literal, then passed after changing only that wiki
  value to `2026-09-digital-purchases-v3`; the full Stripe readiness file passed
  26/26. The updated focused suite passed 86/86 and the final full Node suite
  passed 4,729 with three skips and no failures. Final scope is 20 files: 13
  source-exact paths, the test/wiki repair pair and five coordinator-owned records.
- The repaired v2 package passed independent SPEC re-review then separate
  QUALITY. Exact staged identity produced commit
  `4ef561c75125ea3875da236759c10617cfdc8bb1`, published as open, unmerged PR #13
  with exact base `995fc4f7ce44902002ef2b36c7af1195dbdcb562`. CodeRabbit reviewed all 20 files,
  proving the smaller-PR path can receive actual coverage; Codex also completed
  exact-head review. The initial hosted CI passed build and code quality while
  browser lanes continued, but this head became historical once findings were
  accepted for repair.
- Codex identified two valid findings. Email/password success pushed its safe
  callback directly, unlike Google, so users with only v2 acceptance could
  bypass the current v3 gate. The canonical state also still described local
  review and publication as pending. CodeRabbit identified one valid auditability
  ambiguity: 14 paths were recovery-exact at the pre-QUALITY freeze, but the
  operator-doc repair left 13 in the published final scope without making that
  transition explicit.
- The first credential repair failed its focused assertion on direct
  `push:/account`, then routes default, explicit safe and already-gated callbacks
  through one normalized current legal gate. Its full auth-registration owner
  passes 17/17. The broad suite then correctly rejected a cross-domain schema
  assertion that still required the retired direct push; the corrected focused
  file passes 7/7 and the paired auth/schema run passes 24/24. Changed-file
  ESLint and diff checks pass. Fresh final validation passes the combined
  legal/auth/readiness slice 108/108, archive verification 9/9, Prisma
  validate/generate, typecheck, full lint, the 4,732-test Node suite with 4,729
  passes and three skips, both 115-page builds, and the existing legal-gate
  browser smoke on desktop and mobile Chromium.
- Independent SPEC passed that 23-file package, but separate QUALITY found that
  the redirect still followed session creation and therefore did not prevent an
  abandoned or direct Credentials callback from using a stale-v2 session. Root
  reproduced the issue at the shared server-session owner; no middleware or
  provider change was needed. The repair makes ordinary `getCurrentSession()`
  fail closed until current registration documents are accepted, keeps the raw
  Auth.js loader internal, and exposes one narrow pre-acceptance loader only to
  the legal acceptance page/action. Runtime and ownership tests each failed
  against the old implementation before passing; the combined focused slice is
  142/142. The full suite then exposed a stale dev-clock source assertion tied
  to `return auth()`; its corrected semantic boundary passes 7/7.
- Renewed SPEC passed that 31-file package. Separate QUALITY then found the
  Auth.js public session GET handler remained an externally observable raw
  session owner. Flashcards, Chimer and background hydration could therefore
  observe a stale-v2 session even though ordinary server loaders failed closed.
  The first public-session repair shared one current-registration predicate
  between the ordinary server loader and exact GET session responses. Final
  SPEC then proved Auth.js also exposes the session action through POST when a
  client updates session data. The final wrapper now filters exact GET and POST
  `/api/auth/session` responses, preserves Auth.js status, headers and cookies,
  returns `null` for stale evidence or lookup failure, and leaves all non-session
  handlers plus the legal raw loader unchanged. The affected auth/session suites
  pass 78/78.
- Strict CI `35591116189` on the initial published head passed quality, build
  and browser lanes 2–4 but failed lane 1 and aggregate. Both lane-1 attempts
  reproduced `clock.pauseAt` being asked to fast-forward to the past in the
  fixed-clock Anatomime Retry-After case. The installed Playwright clock advances
  between install and pause; installing one fixed minute earlier while pausing
  at the original phase removes that race without changing the scenario. The
  exact browser case passed three serial runs. Its actual-owner extraction test
  initially rejected the new constant, then passed with the dev-clock contracts.
  Final QUALITY then proved that contract still modeled no time between install
  and pause, so the old equal-target helper would falsely pass. Root reproduced
  the gap before repair. The strengthened real-owner contract advances a
  deterministic 25 ms after install, requires strictly earlier installation and
  rejects an extracted equal-target mutation. Its focused negative control first
  failed with `Missing expected rejection`, then the repaired clock contract plus
  dev-clock suite passed 12/12; the exact browser case passed again.
- Fresh final validation passes the 4,736-test Node suite with 4,733 passes and
  three skips, Prisma validate/generate, typecheck, full lint, both 115-page
  builds, archive verification 9/9, repository audit 28/28 and the desktop/
  mobile legal-gate smoke 2/2. The strict receipt reached the same fixed point
  with zero missing, unclassified or category mismatches; its exact hash is
  pinned in the frozen review evidence. Final scope is 33 files: 12 source-exact
  paths, 16 explicit repair paths and five coordinator-owned records; the
  amendment relative to `4ef561c` is 19 files. Frozen v7 passed independent
  SPEC then separate QUALITY without findings, and exact staged identity
  produced product amendment `2ab6382d2e944b75e8eb0e76808870f205d21736`,
  which was pushed to PR #13. A following coordinator-record synchronization
  does not change product scope; its exact gate status is kept in the ignored
  handoff so this chronological receipt does not become false merely when that
  record commit is created. GitHub remains authoritative for the live PR head,
  inline-thread state, renewed exact-head hosted reviews and strict CI. No
  merge, provider, billing, deployment, database, DNS/domain, PNG/frame/
  threshold, media or production action occurred.

- The durable record synchronization was published as `ecf30584`, and both
  hosted reviewers completed clean coverage of that exact head. Strict CI
  `35621507294` passed quality, build and browser lane 3, but lanes 1 and 2
  reproduced three desktop/mobile failures and lane 4 reproduced the same
  anonymous-fixture effect before its 25-minute timeout. The new acceptance
  gate correctly rejected synthetic Browser-QA users that had no current Terms
  or Privacy rows; provider-free JWTs also lacked the server-rendered account
  bootstrap, and reloads could bypass context routes through the service worker.
- The bounded repair preserves production policy and connected assertions:
  database fixtures create current registration acceptances atomically, verify
  exact ownership before child cleanup, and delete the restricted rows and
  owned user in one rollback-safe transaction; provider-free contexts project
  only the client session/account bootstrap and disable worker registration for
  that routed test context. The login recovery test now owns the legal-gate
  destination, owner-switch coverage proves the reloaded bootstrap, and cart
  labels remain `Open account cart` in connected QA. RED reproduced every
  recurrence, including zero-count and thrown-delete rollback oracles. GREEN
  passes the fixture contracts 64/64 and all five exact scenarios on desktop/
  mobile 10/10. The full Node suite passes 4,736 with three
  host-dependent skips and zero failures; typecheck, changed-file lint and diff
  checks are clean. The resulting 40-path candidate still requires frozen SPEC,
  separate QUALITY, exact staged identity, renewed hosted reviews and all seven
  strict CI jobs before Task 8 can close.

- Independent SPEC then QUALITY approved that frozen 40-path repair, and exact
  staged identity produced `26c76ada77c7d3977af666942101b6e5018e15f3` on
  PR #13. Codex completed clean exact-head review. Strict CI `35638346707`
  passed code quality, build, all four browser lanes and aggregate QA.
  CodeRabbit reviewed the exact 12-file amendment and raised two valid Minor
  fixture-contract findings, so the green hosted result is historical rather
  than final.
- The provider-free Auth.js projection omitted its required session expiry, and
  the same-origin HTML catch-all assumed every document contained the shared
  root-layout account bootstrap. The standalone global-error document disproves
  that assumption. Strict RED reproduced both defects while retaining the
  existing one-marker projection and duplicate-marker rejection. The bounded
  two-file repair adds a future ISO expiry, passes zero-marker HTML through,
  projects exactly one marker and still rejects duplicates.
- Independent QUALITY then found the expiry test accepted a short or already-
  expired mutation and the context-wide session glob fulfilled foreign origins.
  Executable mutation probes confirmed both before repair. Strict RED passed
  only the same-origin control and failed the short-lifetime and foreign-origin
  oracles; GREEN passes all three. The real extracted owners now enforce the
  sibling fixture's exact one-hour lifetime and fall back outside the configured
  origin.
- Frozen v12 passed independent SPEC, but separate QUALITY found that the signed
  cookie, provider-free fixture and oracle still carried three independent
  one-hour values. Changing the cookie lifetime left the consumer and all 70
  tests green, so v12 was invalidated before staging. Strict RED mutated the
  canonical cookie owner to 60 seconds and failed because the consumer remained
  one hour. GREEN exports one cookie-owned constant, wires both runtime test
  paths to it, and keeps an independent one-hour acceptance oracle.
- Frozen v13 passed independent SPEC, but separate QUALITY found that its
  harness removed the actual lifetime import and injected a value manually, so
  replacing the canonical import with a new local owner could remain falsely
  green. The frozen bytes were invalidated before staging. Strict RED removed
  the canonical import and inserted a local `60 * 60`; the old harness did not
  reject it. GREEN now uses TypeScript AST evidence to require exactly one
  unaliased import of the cookie-owned constant, rejects a top-level local
  replacement before controlled injection, and retains the independent timing
  and canonical-owner mutation oracles.
- Frozen v14 passed independent SPEC, but separate QUALITY proved its import
  tuple ignored whole-clause and inline TypeScript type-only flags. Both forms
  could satisfy the ownership assertion without a runtime binding, after which
  controlled injection could keep the executable checks green. Root reproduced
  both false positives and invalidated v14 before staging. Strict RED missed
  both mutations 0/2; GREEN requires non-type-only clause and specifier flags
  plus an explicitly unaliased binding, and passes both new negatives 2/2.
- Frozen v15 passed independent SPEC, but separate QUALITY found that the
  60-second canonical mutation only asserted rejection by the one-hour oracle.
  A type-safe consumer clamp to 120 seconds retained the canonical import and
  still passed. Root reproduced that false positive and invalidated v15 before
  staging. Strict RED failed both exact-propagation cases 0/2. GREEN
  parameterizes the timing bounds: the positive path retains its independent
  one-hour oracle, the canonical mutation must match the observed 60,000ms
  lifetime, and the real-source 120-second clamp is rejected.
- Frozen v16 passed independent SPEC, but separate QUALITY proved that its
  selected 60- and 3,600-second values and handler-duration window did not prove
  arbitrary owner-to-consumer identity. A nonlinear 3,600-second cap agreed at
  both selected values but failed at 7,200 seconds, while a five-millisecond
  consumer offset fit inside a ten-millisecond handler window. Root reproduced
  both actual-source counterexamples and invalidated v16 before staging. Strict
  RED failed both fixed-clock mutation cases 0/2. GREEN injects a deterministic
  `Date`, asserts exact ISO expiry at 17, 60, 3,600 and 7,200 seconds, rejects
  both mutation families and retains the real-clock one-hour integration oracle.
- The complete fixture/harness surface passes 76/76; six representative
  provider-free desktop/mobile browser journeys pass 6/6 with one worker and no
  retries because runtime bytes did not change; and the full Node suite passes
  4,751 total with 4,748 passes, three
  host-dependent skips and zero failures.
  Typecheck, changed-file lint and diff checks pass. The scope is now 41 paths:
  12 recovery-exact, 24 repairs and five records. A new frozen SPEC, separate
  QUALITY, exact staged identity, fresh
  exact-head hosted reviews and all seven strict CI jobs remain required.
- Frozen v17 passed independent SPEC then QUALITY, staged-blob identity and was
  published as `fd7d6124b57177a5f2266af8af82fb0561aba332`. Both hosted reviewers
  completed exact-head review. Codex found that matching-email Google linking
  could prove credentials, receive `AUTHENTICATION_REQUIRED` from confirmation
  and never route to the current registration legal gate. CodeRabbit found that
  the real-clock expiry window could false-fail under backward clock correction.
- Root verified both findings against the real owners before changing code.
  Strict RED reproduced the missing legal redirect and the rollback-sensitive
  timing failure. GREEN routes only the exact 401/code pair through the
  canonical legal-acceptance builder while preserving the cookie-bound intent,
  and an executable provider-free form harness proves the canonical callback.
  The real-clock case now asserts successful invocation and canonical ISO shape;
  deterministic-clock tests retain exact one-hour identity and the full
  17/60/3,600/7,200-second mutation matrix.
- The repaired fixture/database surface passes 78/78, legal/interaction tests
  pass 24/24, and the full Node suite passes 4,754 total / 4,751 pass / 3 skip /
  0 fail; typecheck, lint and diff checks pass. Superseded CI `35668571160`
  passed quality, build and every browser test body (lane 3: 152 pass / 42
  skip), but lane 3 diagnostics upload received a GitHub artifact-intermediary
  403 and aggregate QA failed. Do not rerun that superseded head; fresh CI will
  run on the repair. The local candidate is now 43 paths: 12 recovery-exact, 26
  repairs and five records, and still requires fresh freeze, SPEC, QUALITY,
  staged identity, publication and exact-head hosted/CI coverage.
- Frozen v18 passed independent SPEC with 97/97 focused actual-owner tests and
  no finding. Separate QUALITY then proved the positive-only real-form
  legal-routing test admitted an `&&` to `||` mutation, which incorrectly
  redirected both 401 + `PROOF_EXPIRED` and 403 +
  `AUTHENTICATION_REQUIRED`. Root reproduced the false-pass 1/1, restored the
  production blob and invalidated v18 before staging.
- The same implementer changed only the executable account-security contract.
  Both mismatched pairs now prove exact confirmation-recovery invocation and
  zero legal-builder callbacks, router pushes and refreshes. Correct-source
  focused tests pass 2/2; the controlled `||` mutation fails 0/1. The full
  account-security suite passes 20/20, legal/interaction companions pass 24/24,
  and the clean full Node suite passes 4,755 total / 4,752 pass / 3 skip /
  0 fail. Re-freeze the same 43-path classification as v19 and repeat SPEC then
  QUALITY before staging.
- Frozen v19 passed independent SPEC with 98/98 focused actual-owner tests and
  no finding. Separate QUALITY then proved the mismatched-pair matrix still
  admitted prefix matching and string coercion. Actual-source mutations
  redirected 401 + `AUTHENTICATION_REQUIRED_LATER` and 401 +
  `["AUTHENTICATION_REQUIRED"]` without failing any assertion. Root
  reproduced the coercion false-pass 1/1, restored the exact production blob
  and invalidated v19 before staging.
- The test-only matrix now includes near-match, case-changed and
  whitespace-padded strings plus null, array and object codes. Each requires
  exact confirmation-recovery arguments and zero legal-builder calls, pushes
  or refreshes. Correct-source focused tests pass 2/2; controlled prefix and
  coercion mutations each fail 0/1 and restore in `finally`. Account security
  remains 20/20 and legal/interaction companions 24/24. Re-freeze the same
  43-path classification as v20 and repeat SPEC then QUALITY before staging.
- Frozen v20 passed independent SPEC with 98/98 focused actual-owner tests and
  no finding. Separate QUALITY then proved the corpus omitted missing code, a
  fullwidth Unicode lookalike and rejected JSON. Actual-source undefined-
  acceptance, NFKC-normalization and JSON-fallback mutations preserved every
  v20 assertion. Root reproduced the JSON-fallback false-pass 2/2, restored the
  exact production blob and invalidated v20 before staging.
- The test-only corpus now includes 401 with a missing code, the fullwidth
  lookalike, rejected `response.json()` and string status `"401"`. Each
  requires exact confirmation-recovery arguments and zero legal-builder calls,
  pushes or refreshes. Correct-source focused tests pass 2/2; controlled
  undefined, NFKC and JSON-fallback mutations each fail 0/1 and restore in
  `finally`. Frozen v21 later passed SPEC then QUALITY and was published as `22eb0ef690b354317a74a74bf0318aa6c6f2a733`; the post-v21 OAuth repair `7ad60de8519e4a1d4bcc0bd892583b0c54d80186` followed.
  Each new PR #13 head must receive both hosted reviews and strict CI before Task 9; GitHub and the ignored handoff hold live status.

## 2026-09-21 — Catalog repair verified; remaining audit-note recurrence bounded

- Published the first hosted repair as `03d7762` after independent SPEC then
  QUALITY, 4,726 unit passes with three skips, 107 focused passes, lint/typecheck,
  strict receipt verification and exact staged-blob identity. All four inline
  threads are resolved. Both hosted reviewers ran on that head; Codex completed
  clean. All seven jobs in CI `35571083634` passed, aggregate at 07:23 UTC.
- CodeRabbit's outside-diff finding identifies Still Gradient in the current
  Color Drift collision note. Canonical catalog identity is In Transition.
  Root verified the source and rendered copy, then scanned all notes: five more
  references use Shape Grid, Aerial Rays or Retro Grid in place of Geometric
  Current, Skybreak or Endless Perspective. These are current comparisons, not
  historical aliases. Plasma inside the valid name Folded Plasma is not stale.
- The renderer faithfully copies source notes. The recurrence is incomplete
  current-prose synchronization and a three-note-only regression. Correct only
  the six proven source notes, regenerate four affected batches, and replace
  that narrow regression with all-note/all-batch checks and negative controls.
  Preserve every other data field, catalog alias, runtime, media and prior fix.
  Total PR scope remains 35; three more allocated documents become explicit
  repair deviations, leaving 17 of 30 source paths recovery-exact.
- The same implementer completed the six implementation paths with 107 focused
  passes and changed-file lint. The strengthened note contract rejected the old
  six references before correction; generated documents changed only those six
  note lines. SPEC then found that canonical masking hides three longer retired
  aliases. Root reproduced the false passes and bounded the repair to original-
  note match spans plus overlap counterfactuals in the same audit test. The data
  substitutions remain correct. The corrected oracle passes all 16 audit tests
  and changed-file lint, including overlap and standalone-alias controls. Nested
  retired aliases may both be reported; the fixture requires the target finding
  rather than suppressing other valid findings. Root owns records, receipt and
  Git. SPEC re-review then QUALITY precede
  publication. New-head hosted reviews and strict CI remain mandatory; the
  published hourly CodeRabbit window is tracked separately. Tasks 8-9 and the
  separate snapshot decision remain pending. No merge or provider action.

## 2026-09-21 — Catalog published; hosted findings verified before bounded repair

- Published and attached PR #12 at `30bd341eae393b7ddaa7d1c7f443ffdc5adf0925`,
  based on reviewed renderer head `04e3868e3ab39111e50b6c8cdc7d5a89bc7b60e2`.
  Final scoped SPEC and QUALITY approved the executable sweep guard; all 35
  staged blobs matched the frozen candidate. Strict receipt and tracked inventory
  passed. All seven initial CI jobs passed in run `35566555008`.
- Codex found nine license strings wrongly tied to public presentation identity.
  Root reproduced that attribution drift and the paired test's incorrect
  expectation. Restore the literal inherited attribution, preserving provider
  labels, and cover all nine exported values. The structural equivalence check
  must protect licenses rather than exclude them as presentation.
- CodeRabbit found 72 stale labels among 83 preview entries, a free-default
  entitlement test that also passes through the reset path, three current
  collision notes using retired names, and ambiguous 31-path baseline wording.
  Root verified each against actual owners. Existing generators are correct;
  this is incomplete metadata synchronization and weak test coverage, not a
  demonstrated runtime defect. Preserve preview identities and every non-label
  field; preserve legacy audit aliases. Regenerate only changed audit prose.
- One existing implementer owns eight bounded implementation/test paths; root
  owns delivery records and receipt. Total PR scope remains 35. Fresh focused
  and full-unit validation, lint/typecheck, independent SPEC then QUALITY,
  staged verification and both exact-head hosted reviews remain required.
  No merge, PNG, threshold, provider, billing or media-byte changes.

## 2026-09-21 — Catalog browser validation exposes inherited palette and media assumptions

- The v2 full unit suite passed 4,723 with three skips and zero failures.
  Independent QUALITY found one weakness in the new sweep companion: removing
  the actual per-mode assertion still satisfied its loop/count guards. Root
  reproduced that mutation, then the same implementer strengthened the existing
  helper to require the awaited assertion inside the mode loop before counting.
  Scoped SPEC exposed a further commented-out-call false positive; root verified
  it, and the existing comment masker now excludes inactive loop text. Removal,
  commented-call and out-of-loop placement mutations now fail; the final combined
  focused run passes 126/126 and changed-file lint passes. Browser/runtime hashes
  are unchanged. Broad-suite evidence remains explicitly v2; scoped SPEC then
  QUALITY and final staged/hosted gates still apply to the final amendment.
- Independent SPEC passed the first frozen candidate, but its final full-unit
  run completed with 4,722 passes, three skips and one stale source-contract
  failure. The bootstrap-era sitewide guard still requires the removed fixed
  palette count. The final amendment repairs that companion only, preserving
  registry-exact IDs, exhaustive modes and all Host assertions. Planned scope is
  now 35 files. The companion passes 18/18 and the combined focused run passes
  126/126, including two negative mutation controls; browser hashes are unchanged.
  Scoped SPEC recheck, fresh QUALITY and full-unit rerun are pending.
- Final exact-fixture validation passes all 38 paired carousel/control cases
  (2.7 minutes), with strict unfiltered console health. Both saved request-count
  attachments show one initial hit for each of the four known local assets and
  no additional hits during settled keyboard navigation/cleanup. That evidence
  preserves the initial-request race rather than claiming it disappeared.
  Final combined focused contracts pass 108/108; typecheck, full lint and nine
  legal archive checks pass. Full-unit reconciliation, final receipt and
  independent SPEC then QUALITY still precede publication.
- Effective-mode repair now passes 77 focused contracts and all six focused
  palette browser cases (4.5 minutes): every one of 84 enabled backgrounds in
  all three requested modes on desktop and mobile, label isolation and both
  currently unsupported adapters. Raw gallery diagnostics and exact effective
  renderer targets/overrides remain separate and strict. The full control
  fixture rerun and independent review are still pending.
- The control repair clears all ten original assertion failures. Full traced
  validation is still 36/38 because both console-health cases request the same
  four optional, gitignored local preview videos and receive 404s. An isolated
  unchanged 2/2 pass is not closure. No errors were filtered or media generated.
- Palette validation removed the stale count of 83 and obsolete Aurora
  unsupported assumption while retaining registry-exact IDs and all modes.
  Focused palette/control contracts pass 76/76; the six-case browser rerun is
  4/6, exposing Solid Color's unsupported-Harmony Source fallback. Root verified
  the unchanged canonical resolver and existing unit contract. Vortex shares
  that capability boundary; a Harmony-capable control retains generated colors.
- The bounded follow-up repairs only the browser oracle and its existing
  palette-registry test companion, bringing planned scope to 34 files. Raw
  gallery diagnostics remain distinct from renderer-effective colors and mode
  overrides. Missing-media diagnosis, complete browser validation, receipt
  reconciliation and independent SPEC then QUALITY remain pending. The media
  diagnosis also confirms an inherited initial reduced-motion request race.
  A subsequent exact-URL fixture amendment isolates missing local bytes while
  reporting transient request counts and checking no new settled-state fetches;
  it does not claim to fix that runtime behavior. No runtime, media, snapshot,
  provider, publication or merge action occurred.

## 2026-09-21 — Catalog source transferred; inherited lab test drift isolated

- The exact-source transfer passed 344 focused tests. Root verified stable
  registry/access/commerce structure, all 83 preview identities and media
  metadata, unchanged policy and earlier repairs. Full unit validation passed
  4,718 with three skips and zero failures before the test-only amendment;
  typecheck, lint and provider-free production build passed, as did all 32
  commerce browser cases.
- Development browser validation passed all 18 carousel cases, including the
  portrait geometry regression, but five control-lab definitions failed in both
  projects. Root and implementer independently traced unchanged base/recovery
  producers: the lab renders Selected/Select, Station summary layout is square,
  and loop buffers contain intentionally inaccessible physical clones. Old
  Unlock/193/physical-order test assumptions no longer address those owners.
- The bounded Task 7 amendment updates only that browser consumer and its
  existing source-test companion (32 planned paths). Strict acquisition,
  hit-target, zero-mutation, exact geometry, logical identity and clone
  accessibility checks remain required. No runtime, screenshot or threshold
  adjustment is part of this repair.
- Historical prototype/acquisition records conflict with the recovered lab
  behavior. Current source-preservation authority controls this replacement;
  this is not a new product-design decision or closure of that historical debt.
  Final browser evidence and independent SPEC then QUALITY remain pending.

## 2026-09-21 — Renderer gates verified; background catalog slice started

- PR #11 at `04e3868e3ab39111e50b6c8cdc7d5a89bc7b60e2` now has clean
  exact-head Codex and CodeRabbit reviews, both threads resolved and all seven
  jobs successful in CI `35556031421`. The formerly failing cadence case
  passed; no retry or production deadline change was used.
- Started Task 7 from that exact base in the existing approved worktree.
  Its explicit 30-path ownership includes the globe moved from Task 6; three
  browser companions are already complete, leaving 27 source changes and four
  delivery/audit records. The source renderer assertion moves into its combined
  registry/control test without dropping coverage.
- This slice preserves stable background/access/media identifiers, optional
  user markers and previous validated repairs. Only the always-rendered legacy
  globe mark is retired; its image asset remains. Portrait tray CSS and its
  geometry regression travel together. Current legal and final integration
  remain later tasks; no snapshot refresh, provider activity or merge.
- Local implementation/verification and both independent review stages are
  pending. Publication must receive its own exact-head hosted reviews and CI;
  the completed renderer gates are only its verified starting baseline.

## 2026-09-21 — Renderer CI exposed Anatomime test-clock race

- Exact head `3857f13d6b3c241061960f2d1d1f0740f4978166` received clean Codex
  review. CI `35552471156` passed quality/build/three browser lanes but lane 1
  failed the Anatomime polling cadence test on both attempts (118 passed,
  25 skipped, one failed). This was not a screenshot comparison failure.
- Trace evidence and a provider-free Chromium reproduction using the actual
  fetch-deadline helper show that the test's late wall-time pause advances an
  already-running request beyond its 1,500ms deadline before releasing a held
  response. The test and runtime owners were unchanged from recovery.
- The bounded Task 6 amendment moves clock setup before the tested request and adds a
  focused falsifying regression. It keeps genuine timeout/cadence controls and
  all application/provider/visual behavior unchanged. The two test-only source
  divergences bring planned scope from 65 to 67 files; record them in final
  equivalence rather than overwriting them with recovery bytes later.
- Local verification passes all 42 Anatomime browser cases across desktop/mobile
  and both cadence cases with a temporary 2.1-second observation delay (removed
  after the control). Focused checks pass 108/108, typecheck and changed-file
  lint pass, and strict audit/inventory remain clean. Independent SPEC then
  QUALITY and a reviewed repair push remain required. Both hosted reviewers and strict CI
  must cover the eventual new head. Task 7 and whole-sequence readiness remain
  pending; no unchanged CI retry, snapshot refresh or provider workaround.

## 2026-09-21 — Renderer slice published; hosted record corrections

- Published PR #11 at `6d92e6daa073be40db6f61e26c7ac8958b1ab0f1`, stacked on
  PR #10 with 64 changed files. Independent SPEC and QUALITY passed, including
  the earlier stale-status correction. Codex and CodeRabbit then completed
  hosted review and each raised one documentation finding.
- The canonical verification header and its companion test ceiling now advance
  together to the verified September 21 UTC checkpoint. The prior update changed
  the snapshot/log but omitted these paired freshness fields. No assertion is
  removed or weakened; the existing date-validation contract is preserved.
- The plan now explicitly assigns only effect prose and diagnostics to Task 6;
  globe-marker removal remains in Task 7 with its descriptions and tests. The
  earlier wording conflated the original source task with replacement slices.
  The 59/30 packaging boundary and source ownership are unchanged.
- Adding the date-test companion brings PR scope to 65 files. This bounded
  amendment requires scoped SPEC then QUALITY and renewed exact-head hosted
  reviews/strict CI. It does not close the remaining slices, combined-source
  ledger or pending Linux Atmosphere snapshot decision. No runtime, PNG, frame,
  threshold, provider, billing, deployment, merge or legal-version changes.

## 2026-09-21 — Account gates clean; background renderer local verification

- PR #10 head `3e29e6e696131450820e8b70cc195d6bf5849f8a` passed Codex review,
  CodeRabbit's incremental review and all seven jobs in CI `35545694616`.
  CodeRabbit accepted at 00:30:28 UTC and finished at 00:32 UTC with no new
  actionable comments. The prior documentation thread is resolved.
- Started the next stacked branch in the existing approved worktree. Task 6
  carries 59 renderer files plus its shared test hunk. Moved the single globe
  marker-removal file from the original 60-path allocation into Task 7, keeping
  it with registry/catalog/audit descriptions and marker tests (59/30 allocation).
  No source work is discarded. Verified change scope is 64 paths with receipts.
- All 59 renderer blobs match recovery. Focused checks passed 153/153;
  typecheck, lint, strict audit and inventory passed. The full unit suite
  passed 4,711 tests with three skips and zero failures (4,714 total).
- Independent SPEC passed; QUALITY found no runtime or companion-test defect
  but identified stale local-status wording. This checkpoint corrects those
  records; the bounded documentation/receipt delta receives SPEC then QUALITY
  confirmation before publication. No source or test changes were needed.
- Own-head hosted reviews and strict CI remain unverified, and whole-sequence
  reconciliation remains incomplete. Original and earlier branches remain
  unchanged/unmerged. No provider, screenshot, frame, threshold, billing,
  deployment or legal-version changes.

## 2026-09-20 — Account slice published; hosted manifest clarification

- Published and attached PR #10 at `487fd7bfa8e8c000d13743d13fbeba99eadf9cf8`
  against reviewed PR #9. Codex completed clean at 23:32 UTC. CodeRabbit's
  completed 53-file review found one documentation issue: the plan referenced
  49 source-owned account files while explicitly listing only 46.
- Verified the three additional members and documented the distinction between
  ownership, historical pre-amendment allocation and final change scope. The
  final arithmetic is 42 changed manifest members plus six companions/tests
  plus five delivery/audit files, totaling 53; 40 copies match recovery exactly.
  No runtime, test, policy, snapshot or provider change is part of this repair.
  Independent SPEC then QUALITY, strict receipt checks and new-head hosted gates
  remain required. Original PR #5 and previous replacements stay unmerged.

## 2026-09-20 — Public-content gates verified; account/service slice started

- Repaired candidate `65db8418bbca2c7ee134c5d7684af9fc68f61529` passed renewed
  independent SPEC then QUALITY. Root full unit run: 4,710 passed, three skipped,
  zero failures (4,713 total). The implementer passed 217 operation-owner and
  662 broader focused checks, typecheck and lint; root passed 146 audit/document/
  workload/archive checks. Both root and quality reviewer independently repeated
  successful actual-code upgrade and rollback replay after repair.
- The final local allocation has 53 paths: 40 exact recovery copies, five
  partial companions, two expanded owner tests, one new Sentry route test and
  five delivery/audit files. Twenty protected files match the reviewed base.
  Seven existing exact audit rules are retained and 41 inspected administrative
  compatibility occurrences are added; the generated receipt is byte-stable with
  zero missing/unclassified/category mismatches. No broad exclusions were added.
  This local receipt precedes publication; hosted review and CI remain required.

- Initial account candidate passed SPEC and 4,708 unit tests (three skipped),
  but independent QUALITY reproduced a P1 historical-operation replay failure.
  Root confirmed upgrade and rollback failure: changed immutable bundle text
  conflicts with the existing exact validator. The Task 5 amendment preserves
  five reviewed-base producers and adds all-family replay/tamper controls rather
  than accepting altered records or creating a migration. Publication is held
  for renewed SPEC, QUALITY and fresh verification. Administrative compatibility
  copy remains intentional; other account display copy is unchanged by this repair.

- PR #9 round 2 head `9f2afb41854a6600a2c94f0c416d0531c6b16e0a` passed
  independent SPEC then QUALITY, root validation and exact-head CI `35538608085`.
  Codex completed clean at 21:28 UTC; CodeRabbit accepted at 22:06:45 UTC and
  finished clean at 22:16 UTC. Both inline threads are resolved. Earlier review
  findings are repaired, not discarded; the Sentry/audit divergences remain in
  the final reconciliation ledger. No branch was merged.
- Created `codex/phase6-05-account-service` from that exact head in the existing
  approved worktree. Read-only allocation selected 48 manifest files, two full
  browser companions and one register-heading hunk. The omitted manifest route
  test already contains the required account behavior and the reviewed Sentry
  correction; copying its source version would regress that correction.
- The existing async drain and held-route teardown dependencies match recovery
  exactly and stay unchanged. The private account settlement repair travels with
  its owner; broader Phase 6 integration specs, lane registration, PNGs and final
  fingerprint policy stay with later owners. Implementation, independent review,
  local verification and hosted gates are still required for this new slice.
- Subsequent actual-route diagnosis found another source exception: enabling
  the synthetic Sentry debug route changes its emitted error name in recovery.
  The accepted contract forbids operational event renames for presentation.
  Preserve that route and correct its paired privacy-test expectation, reducing
  exact account copies to 46. Add a dedicated small behavioral regression.
  Include exact compatibility rules for the retained
  event/assertion while preserving the five reviewed rules and strict verifier.
- Original PR #5 and earlier published branches remain intact. No provider,
  billing, deployment, screenshot relaxation or merge action is part of this work.

## 2026-09-20 — Public-content audit category consistency repair

- Round 1 repair `b6645013086635cc1287725d0ea0d3678f4b6071` passed exact-head
  Codex review at 20:31 UTC and all seven hosted CI jobs in `35535560095`.
  Original PR #5 and earlier replacement branches remain unchanged/unmerged.
- CodeRabbit accepted its incremental review at 21:02:34 UTC and completed
  review `5261742961` at 21:07:30 UTC with one major outside-diff finding.
  Its prior two inline findings are resolved, but that does not close this new
  verification gap. Published review allowance remains one included review/hour.
- Read-only reproduction changed a valid exact occurrence rule from compatibility
  to historical. The classifier changed its result while the verifier returned
  zero missing/unclassified entries, allowing normal mode to retain the old
  category. The existing generator is not the failing owner in this recurrence.
- Round 2 adds matched-category consistency to the existing verifier and normal
  CLI. Keep identity matching, strict additions and informational removals;
  expose deterministic sanitized mismatches and fail rather than silently accept
  stale categories. No second classifier or broader policy exclusion is needed.
- The frozen three-file implementation passed 28/28 audit and 64/64 focused
  compatibility tests. Coordinator checks passed 101/101 focused/archive and
  25/25 delivery-document/archive cases. Typecheck and changed-file lint passed.
  Independent SPEC then QUALITY, final receipt verification and hosted gates
  remain pending; the previous head's CI is not evidence for this new repair.
  No account slice, PNG/frame/tolerance, provider, billing or runtime change is
  part of this bounded audit repair. The final source ledger must retain it.

## 2026-09-20 — Public-content replacement published; compatibility repair verified locally

- Published and attached PR #9 at `f8add328996c668243cc7c1dae6ba16f1d8da565`,
  stacked on exact audio head `f8c14f1812918b67051760669c4ccf07b5860ba7`.
  The 63-file initial tree passed independent SPEC then QUALITY and local
  verification recorded below. Earlier branches remain intact; nothing merged.
- Codex completed at 19:57 UTC with one operational-identity finding (review
  `5261580735`); CodeRabbit completed at 20:01 UTC with one exact-classification
  finding (review `5261595695`). Neither result is clean coverage. The accepted
  CodeRabbit request was at 19:55:06 UTC; its published one-hour allowance is
  tracked separately from Codex and from review completion.
- Local reproduction confirms the report payload message goes directly to
  Sentry, while the audit generator misclassifies a retained Stripe assertion.
  Preserve the historical event identity without changing public support copy;
  promote only the already-planned exact-occurrence API and five fresh current
  rules. Do not edit generated categories alone or widen path exclusions.
- The repair deliberately diverges from three original source files. Final
  integration must retain this validated compatibility correction and reconcile
  the early audit capability, alongside prior pilot and homepage repairs.
  The seven-file repair passes 91/91 focused checks; a fresh coordinator run
  passes all 100 focused/archive cases. Diagnostic controls isolated two old
  Sentry failures and one exact-classification failure before correction.
  Independent SPEC then QUALITY, regenerated audit verification and repair-head
  hosted reviews/CI are required before this slice can be called ready.
- Initial-head CI `35533833313` passed quality, build, all four browser lanes
  and aggregate `106141825509`, verified at 20:15 UTC. No provider, screenshot, threshold,
  billing, deployment or original-branch changes accompany this repair.

## 2026-09-20 — Audio replacement verified; public-content slice started

- PR #8 passed both hosted reviewers on `f8c14f1812918b67051760669c4ccf07b5860ba7`:
  Codex summary `5751739355` completed at 18:29 UTC with clean reaction
  `515768622`; CodeRabbit run `91e00cf5-ff83-4491-abba-fb28b89894c5` reviewed
  all 46 files against `06f3147` and completed without actionable findings at
  18:33 UTC. Its successful request was at 18:27 UTC. No threads remain.
- CI `35529020277` passed Code quality, Browser build, all four Browser QA
  lanes and aggregate `106129199412`. This proves the audio slice, not the
  unresolved original full-phase snapshot gate or later replacement slices.
- Started the bounded public routes/content slice from that exact audio head.
  Public wording and direct producer-owned assertions travel together; the
  remaining interaction-feedback delta is private account settlement and stays
  with its account owner. Preserve endpoint/provider identifiers and source
  attribution, as well as the prior verified date ceiling and homepage repair.
- Assembled 55 source-exact public files and four bounded test companions; the
  complete candidate has 63 paths including delivery documents and its generated
  brand receipt. Independent SPEC then QUALITY review passed without findings.
- Frozen tree `560521bd2f2c1220086240b46b19c7449ec9ee95` passed 4,661 unit tests
  with three skips and no failures (4,664 total). Focused regressions passed
  247/247; typecheck, lint and 25 documentation/archive checks also passed.
  Audit missing/unclassified lists are empty and inventory has no forbidden paths.
- Final receipt-only closeout precedes publication; this slice's own exact-head
  hosted reviews and strict CI remain required. No earlier branch was moved,
  no PR merged, and no provider, billing or screenshot action accompanies this step.

## 2026-09-20 — Identity replacement verified; audio slice started

- PR #7 passed both hosted reviewers on `06f3147ab3ffb7dc319ad93666dc0f3d7605d238`:
  Codex summary `5751392671` and clean reaction `515722116`; CodeRabbit run
  `acf5fa6b-a786-4a2d-9c3b-85d7fc9bd9cc` reviewed all 24 files against `96d94b1`
  with no actionable findings. Its successful request was at 17:26 UTC and
  completion at 17:31 UTC; unchanged clean code needs no repeated request.
- CI `35525692042` completed successfully, including all four browser lanes and
  aggregate `106120181911`, verified at 17:45 UTC. Both original recovery and
  earlier replacement branches remain unchanged; no PR was merged.
- Started the bounded Atmosphere audio owner in the existing isolated worktree.
  Preserve source `7e318558da425b8fcdddeb8df50e93a36900310a` audio changes and
  later station-artwork, carousel-resume and label-owner repairs together with
  their regressions. Shared browser files receive audio-owned assertions only.
- The first frozen audio candidate passed 4,659 unit tests with three skips and
  no failures (tree `b0df440f95c6b6a6e44b18f8ee275a424a260810`). Fresh focused
  checks passed 227 cases, typecheck and lint. Independent SPEC review caught one
  missed companion: the About link label is already changed by navigation, so
  its browser click assertion belongs here rather than the later About page.
  Carried only that existing source assertion and repeated independent SPEC then
  QUALITY review: both pass with no remaining findings. Fresh post-correction
  checks pass 132/132, typecheck and audit fixed-point verification. Independent
  quality checks pass 62/62 and prove unchanged SVG bytes for all 58 visible
  stations against the slice base. No runtime code changed after the full suite.
- The 46-file audio candidate is locally verified; publication and its own
  exact-head hosted reviews and strict CI remain required. The final combined-equivalence
  proof must retain pilot and homepage repairs, not silently replace them with
  older source bytes. Separate snapshot approval remains pending; no provider,
  payment, deployment, merge or screenshot changes accompany this step.

## 2026-09-20 — Archive pilot verified; identity replacement started

- Pilot PR #6 is clean on exact `96d94b1b0d779b998df01d07cfaec0198857d51d`:
  Codex result `5750877733`, CodeRabbit completed incremental run
  `dcabcf85-ccc3-4426-81eb-b96bf0070e79` following its full initial review,
  all four review threads resolved, and CI `35520831495` completed successfully.
  The 16:20 UTC readback proves the small-PR review path works without billing
  changes or review exclusions. The unchanged pilot does not need another review.
- Started the identity/shell replacement from the pilot in the existing approved
  worktree. Preserve original source `7e318558da425b8fcdddeb8df50e93a36900310a`
  and both published recovery branches. This changes delivery packaging, not
  the approved product design or authorization boundaries.
- Shared browser files are sliced by owner: identity navigation/home/install
  selectors and responsive-brand assertions travel with the runtime; audio,
  secondary-page, account and streaming changes remain with later owners.
  Carry the existing provider-free brand regression so text/mark/hidden states,
  320px cart pressure, control geometry and invisible-focus prevention remain
  verified together. Current legal dates and versions do not change in this slice.
- The initial 22-file candidate passed SPEC; QUALITY found a homepage heading
  sizing defect with the expanded desktop sidebar. At 1024px its column is
  368px but the fixed-size Inter text was 553.39px wide. The bounded owner repair
  uses inline-size containment and column-relative large-screen font sizing,
  preserving the grid, single visible heading and existing maximum size.
- Added a focused provider-free layout regression instead of growing the shared
  QA harness. It checks 23 viewport/sidebar combinations and two strict old-code
  overflow controls; the control computes the actual superseded 96px font size.
  No clipping, screenshots, dependencies, provider calls or tolerances changed.
- The first full suite completed 4,611 cases: 4,607 passed, three skipped and
  one failed because the paired Roadmap SEO description still expected the old
  name. Carrying its exact source assertion fixes the omission; later page-copy
  assertions remain deferred. Fresh coordinator focused checks pass 89/89,
  and separate actual-Inter bounds pass at six widths with zero network requests.
- The repaired 24-file candidate then passed independent SPEC followed by QUALITY
  with no actionable findings. Fresh full unit verification completed 4,638 cases:
  4,635 passed, three skipped, zero failures. Coordinator typecheck, lint,
  documentation checks (15/15) and immutable-archive checks (9/9) also passed.
  The intermediate brand receipt is a generated byte fixed point, with zero
  missing/unclassified references; tracked inventory has no forbidden paths.
- Publication and this slice's own exact-head hosted gates remain pending.
  Local completion does not imply hosted approval. Final source equivalence and the
  unresolved Linux ring snapshot remain whole-sequence gates. No merge, provider,
  deployment, payment or snapshot update occurred.

## 2026-09-20 — Pilot hosted-review repairs published; status corrected

- Published repair `f9c4a2b3ee1df9b0be17cc5e2dfc12bdb4113838` on PR #6.
  The audit policy now names only the two retained archives, with exact-positive
  and sibling/suffix/nested negative tests. Every fixture Git command uses a
  case-insensitively scrubbed `GIT_*` environment; the poisoned-child regression
  proves actual named test execution, rejects recursive/zero-match false greens,
  and checks unchanged decoy config, HEAD, index and content. Archive hashes,
  unrelated CRLF controls and all six recovery-source blobs remain intact.
- Independent SPEC then QUALITY review passed the repaired tree. Fresh local
  checks passed: 49 focused tests, 15 documentation-contract tests, typecheck,
  lint, and 4,568 full-suite cases (4,565 passed, 3 skipped, zero failures).
  All three implementation review threads were resolved after publication.
- Codex finished review of `f9c4a2b` at 15:34 UTC with one documentation finding,
  not a new implementation finding. The tracked state/log had retained pending
  repair language even though the ignored continuation checkpoint was current.
  This documentation-only follow-up records completed work separately from
  remaining gates. Future publication checkpoints must reconcile canonical
  state/log with the actual repair status, not only update the ignored handoff.
- At 15:39 UTC, repaired-head CI was running and CodeRabbit had not reviewed
  that head. Both hosted reviewers and green required CI are still required
  on the final follow-up head; prior-head checks cannot satisfy those gates.
  Original PR #5, its branch, and pending Linux snapshot authority are unchanged.

## 2026-09-20 — Review-sized Phase 6 delivery and archive pilot approved

- The user approved preparing and publishing coherent replacement PRs for
  oversized PR #5, then separately approved an isolated local worktree. The
  [delivery plan](superpowers/plans/2026-09-20-phase6-review-sized-prs.md) preserves
  all source work and repairs while keeping each PR below the observed review cap.
- The first pilot begins at `cdfa99e49cebf100fac1a5080d60514806eb17db` and carries
  only historical legal archives/verifier plus corresponding audit contracts.
  Original PR #5 and source `7e318558da425b8fcdddeb8df50e93a36900310a` stay intact.
  Current legal text, application runtime, acceptance storage and PNGs are not
  part of this slice. The one-shot archive writer stays retired.
- Fresh pre-change checks passed: locked npm install, local Prisma generation,
  and full unit tests, 4,557 total / 4,554 passed / 3 skipped / zero failures
  (510,204.5684 ms). No provider resource or copied environment file was used.
- A real Git checkout-filter reproduction found that `core.autocrlf=true`
  changed both pinned archives to CRLF. The narrow repair adds exact LF rules
  at the existing `.gitattributes` owner and a temporary-Git regression. It
  reproduced failure before repair and passed under three checkout settings
  afterward while preserving unrelated bytes. All six source files remain
  byte-identical; no verifier normalization or assertion weakening was used.
- Independent specification review, then quality review, fresh candidate gates
  and exact-head hosted reviews are required before a clean pilot claim. Further
  publication waits for an actual CodeRabbit pilot review; a capacity refusal
  stops expansion without spending, exclusions or repeated unchanged triggers.
- Original Linux ring snapshot approval remains pending. Merge, deployment,
  billing/provider changes and original PR/branch retirement are not authorized.
- Published the 15-file pilot as PR #6 at `6961b4f`; the full candidate suite
  passed 4,564 tests with 3 skips and zero failures. CodeRabbit successfully
  reviewed all 15 files and Codex also completed its review of that exact head.
  Both flagged the archive-directory prefix; CodeRabbit additionally flagged
  inherited Git repository-location variables in the checkout test. Those initial
  findings required the bounded repairs recorded above; they were not clean
  coverage. Original PR #5 remains unchanged.

## 2026-09-13 — Phase 5 identity Browser QA passed; temporary QA removed

- The user separately authorized one new independent empty temporary Neon
  Browser-QA lifecycle. The accepted project was proven distinct from the
  existing production project, initially contained no tables, received exactly
  the 46 committed migrations, and matched the committed migration-name set.
  All 134 application tables contained zero rows before Browser QA.
- `npm run build:browser-qa` completed immediately before
  `npm run test:browser -- tests/browser/pwa.spec.ts tests/browser/app-shell.spec.ts`.
  The exact selection enumerates 152 cases; Playwright's final run receipt was
  `passed` with zero failed tests. No snapshot update or runtime correction was
  made.
- Post-run exact row counts remained zero for all 134 application tables. The
  cycle-owned temporary project was deleted and proved absent, while the
  existing production project remained present. No production data was copied,
  read or altered.
- Phase 5 local implementation and its authorized Browser QA are complete. PR #4
  is open; initial published head `4f5485611e18327099081990d3d65e0943b89317`
  passed hosted CI and exact-head CodeRabbit without actionable comments. Successor heads repeat those gates before merge; deployment, Phase 6 and merge remain gated.

## 2026-09-13 — Phase 5 identity complete locally; fresh Browser QA gated

- Planning commit `dc42f074df48817f5bbbfe60576d1f81abbd5559` and
  pre-implementation evidence commit `e878432d5b2ad213ee887645e3b202fd65f56eb1`
  precede the three reviewed implementation commits: Task 1
  `c1715d24eefd12d05f38b7c90d1d16954ea9c039` adds the frozen, dependency-free
  owner and contract; Task 2 `ad0ae618648138295935cc701629369cc19481d7`
  delegates SEO compatibility exports/Open Graph alt, manifest names and Apple
  title; Task 3 `c9acf0fdcbfa7be8cb1fa3e004fa462054e27131` delegates app-bar
  label/assets, mobile navigation label and install action/title/iOS guidance.
  Each task passed independent specification and code-quality reviews with no
  findings. Task 2 passed 14/14 focused tests and typecheck; Task 3 passed 48/48
  focused tests and typecheck.
- Branch-wide focused tests passed 58/58. Full unit tests passed with 4,557
  total, 4,554 passed, 3 expected skips, zero failures and 527,763.2615 ms.
  Prisma validate/generate, typecheck and lint passed; lint emitted only the
  existing Babel deoptimization note for `app/chimer/running-timer.tsx`.
  The Next.js 16.2.12 production build passed compilation, TypeScript, 115/115
  static pages and the final route table with exit 0; the existing non-fatal
  `ANATOMIME_POLL_SHEDDER` initialization message remained. Prisma generation
  and builds left the worktree clean before these documentation edits.
- Post-code inventory measured 1,954 files and 48,276,437 tracked Git blob bytes,
  inventory SHA-256 `7b9b988b1316d3f75de31547ad07f44492ff990f59aa5d292dfe6e3d3f96e292`,
  with zero forbidden paths. Against the 1,952-file, 48,267,941-byte baseline,
  this is +2 files and +8,496 bytes; the 115-page route count is unchanged.
  These are observations, not performance claims, and precede document staging.
- Every affected runtime value remains `MassageLab`; assets, routes, layout,
  accessibility and install behavior are unchanged. SEO exports remain
  compatibility adapters. Only mapped inline presentation copies retired;
  legal/support/domain/provider/persistence/auth/billing/environment/storage/
  media/audit/historical/internal identifiers remain with their existing owners.
  Rollback reverts the three task commits or branch, restores mapped inline
  copies and removes the owner/test; no external rollback is needed.
- The local Phase 5 identity slice, staged brand fixed point and both
  complete-branch final specification and code-quality reviews passed. Fresh
  Browser QA is next and separately authorized; no independent empty QA
  environment is currently proven. A separately authorized empty temporary QA
  lifecycle must run `npm run build:browser-qa` immediately before scoped
  Playwright without snapshot updates; production must not be reused.
  No provider resource, production data, deployment, Phase 6 rebrand, push, PR
  or merge changed or was authorized by this local closeout.

## 2026-09-13 — Phase 4 merged; first Phase 5 subsystem approved and planned

- [PR #3](https://github.com/dsbowersock/atmoshaper/pull/3) merged into `main`
  at `2026-09-13T17:56:59Z` by `dsbowersock` as
  `a43d1a315e95d80d6570fb5e49d1e2dce5ce7ddb`. The merge includes exact reviewed
  head `69ff135aed8d0b1ecb43c054595d1e08e89a22b1`; all required hosted checks,
  latest-head CodeRabbit review and unresolved-thread verification were clean
  immediately before merge. The review branch remains retained.
- Created `codex/atmoshaper-public-product-identity` from the exact merge after a
  clean one-worktree snapshot. The user selected public product identity as the
  first Phase 5 subsystem.
- The approved design direction introduces one side-effect-free data owner for
  the current public presentation name and bounded SEO/app-shell image paths,
  then rewires only SEO identity, manifest/root metadata, app-bar/mobile-main-bar
  branding and PWA installation presentation.
- The behavior contract keeps every rendered `MassageLab` value, image, route,
  layout and accessibility label unchanged. Legal, support-address, domain,
  provider, persistence, auth, billing, environment, storage, media, audit and
  internal compatibility identifiers remain excluded.
- The user approved the written specification. The resulting
  [implementation plan](superpowers/plans/2026-09-13-atmoshaper-public-product-identity.md)
  defines four coherent local tasks with a fresh implementer and independent
  specification/code-quality reviews for each task.
- Independent plan review found that the app-shell browser suite needs
  `npm run build:browser-qa` immediately before Playwright because an ordinary
  production artifact lacks its proof route and Browser-QA hooks. The plan was
  corrected, gained a pre-refactor inventory/build measurement, and then passed
  re-review with no remaining issues.
- Local subagent-driven implementation is now active. Browser-QA provider
  creation, push, pull request, hosted review, merge, deployment and Phase 6
  rebrand remain separate later gates.

## 2026-09-08 — Fresh-history repository candidate materialized (historical Task 5 snapshot)

- Phase 1 passed. Phase 2 is in progress at Task 5. Source selection was relocked to exact merged MassageLab `main` commit `e74045c2fc85c2cb4df176fdb1aff2137c4d9848`; reviewed relock commit `f3b92a1afc44a5fdb2d56653bc82c8d0dc9a933e` descends from that immutable source and owns the migration-document overlays.
- Materialized the local AtmoShaper candidate with a history-free `git archive` export of the locked source. No MassageLab `.git` metadata, refs, worktrees, reflogs, tags, or commits were copied.
- Applied the four manifest-owned omissions: `.agents/refactor/2026-06-21-refactor-anatomime-session-wrapper.md` and the three MassageLab-only execution-governance records under `docs/aegis/work/2026-09-06-atmoshaper-repository-migration-execution/`.
- Applied only the ten reviewed relock overlays declared by `docs/rebrand/atmoshaper-export-manifest.json`: the nine migration documents under `docs/rebrand/` and the operative Phase 1–2 plan. Runtime, tests, configuration, parity tooling, and snapshots came from the locked source rather than working-tree state.
- Established the fresh-document boundary: add `MIGRATION_LINEAGE.md`; replace `README.md`, `docs/project-state.md`, and `docs/project-log.md`; and update `AGENTS.md` while preserving applicable safety, legal, PHI, entitlement, compatibility, planning, documentation, and Windows-shell rules.
- Existing MassageLab runtime design and copy remain unchanged through bootstrap and continue until the separately reviewed Phase 6 preview rebrand; no completed public runtime rebrand is claimed.
- Preserved the locked runtime source's current Layer B receipts: the exact 174/174 focused Anatomime matrix. Fresh exact-head full intercepted Anatomime Browser QA coverage reports 42/42 desktop/mobile cases ok in one post-fix run.
- Preserved public source/license provenance for the current display effects: the camera-yaw and decorative-glow concepts are an adaptation of CodePen author wheatup's public MIT-licensed [Neon Clock (CSS)](https://codepen.io/wheatup/pen/JjzdMbK) into native React and CSS, with no CodePen runtime dependency.
- The Task 5 path contract is `1,905 - 4 + 1 = 1,902`. The six Task 6 audit additions produce the final `1,908`-path contract. Task 6 remains pending.
- Git initialization, staging, exact path/blob audits, and Task 5 acceptance remain coordinator-owned next actions. Tasks 7–9 remain pending. No commit, remote, push, public repository, pull request, deployment, production/provider/database/payment/email/media mutation, DNS/domain cutover, runtime rebrand, or legal cutover is claimed by this entry.

## 2026-09-09 — Fresh-root bootstrap verified (historical Task 7 receipt)

- Created sole root commit `7e89f7ba9508a1ad715c1824ea6099432e6a4ccd` from locked source `e74045c2fc85c2cb4df176fdb1aff2137c4d9848`. Its tree is `e9a97bbe519a1cc52c7225eb600fd5d2473f6ded`, its parent record contains only the root SHA, and post-commit status was clean.
- Verified the exact initial inventory: 1,908 paths, 46,865,680 tracked blob bytes, aggregate SHA-256 `1d537a03b8a0294f1e68f56df718c29b5e5cf4bfedac01de7ae1cceb86aa3604`.
- Explicitly force-staged seven retained preview assets that matched destination ignore rules. They remain locked-source blobs; the path equation and destination-addition set did not change.
- Added deterministic repository and legacy-brand audits. The focused suite passed 21/21, and the accepted brand report counted 26,350 references: 22,905 compatibility, 1,451 historical, 42 legal, 1,952 pre-rebrand public copy, and zero missing or unclassified.
- Corrected occurrence-scoped classification and deterministic candidate-baseline serialization. Aligned fresh-authority documentation assertions and increased only the mocked password endpoint response allowance to 1,500 ms. The global staged whitespace command surfaced 24 inherited byte-identical source paths, so preserved blobs were left unchanged and the destination-authored scope passed its whitespace check.
- Passed the final unit suite at 4,219 total, 4,216 passed, 3 skipped, and zero failed; TypeScript and lint passed; production and Browser-QA builds each produced 115 pages. Installation reported three inherited high-severity advisories, and no automated dependency rewrite was applied.
- Verified 148 route-manifest keys, matching the source count, and exact source-aggregate server-app bytes. Static output measured 52 bytes above the source aggregate because fresh-build artifact identities differ, so no per-file bundle equality is claimed. The web manifest, robots, sitemap, service worker, and all 24 accepted PNGs matched exact source bytes and hashes; the owned server was stopped with port 3010 free.
- Passed ordinary Browser QA at lane counts 137/7, 184/34, 160/34, and 149/51 for passed/skipped. The first complete parity attempt had one transient desktop Home readiness failure; unchanged implementation/snapshot review and a focused 1/1 pass were followed by a separate fresh 22/22 full pass with no snapshot update or runtime fix.
- For the accepted browser lifecycle, created a new independent empty QA project, applied exactly 46/46 committed migrations, proved all 134 application tables empty after cleanup, deleted the project, and proved it absent. All earlier cycle-owned temporary projects were also absent, the unrelated pre-existing project was preserved, and no production data was copied, read, or altered.
- Future authenticated browser cycles must repeat that new-empty-project, fingerprint, committed-migration, zero-row, deletion, and absence sequence. Exact parity retains the repository-owned single-worker setting; it must not be overridden.
- At this Task 7 snapshot, Task 8 was next and Task 9 publication had not occurred. This snapshot is superseded by the Task 8–9 receipt below. Apart from the authorized disposable QA projects that were deleted and proved absent, no persistent destination deployment or provider configuration, domain/DNS, production database, payment, runtime rebrand, legal cutover, merge, or Phase 3 work occurred.

## 2026-09-09 — Public repository and bootstrap PR opened (historical pre-merge snapshot)

This entry preserves the publication-time state. Its open-PR and stop-before-Phase-3 statements are superseded by the merge and active consolidation entry below.

- Recorded the four-document Task 8 destination receipt in commit `953e04c680d497851cdb6b6533b92de8f9b1c4f2` on `codex/bootstrap-atmoshaper`.
- Created the public repository [`dsbowersock/atmoshaper`](https://github.com/dsbowersock/atmoshaper), with public visibility, default branch `main`, and no tags. Published the sole-root `main` commit `7e89f7ba9508a1ad715c1824ea6099432e6a4ccd` and review branch `codex/bootstrap-atmoshaper`, then opened [PR #1](https://github.com/dsbowersock/atmoshaper/pull/1) against `main`. The PR remains open and unmerged.
- The first hosted Code quality run exposed a stale 2026-09-08 project-state verification-date ceiling. Test-only commit `23f5b8654a89c83de4ae3c6454996e9f7bc6b283` advanced that upper bound to 2026-09-09; at that exact head, the focused test passed 15/15 and the full local suite passed 4,216 with 3 skips and no failures.
- Hosted run `34325535135` passed against exact `23f5b8654a89c83de4ae3c6454996e9f7bc6b283`: Code quality 4m11s, Browser build 2m26s, Browser QA lane 1 12m24s, lane 2 11m15s, lane 3 17m56s, lane 4 12m59s, and aggregate `qa` 3s. This evidence does not automatically cover a later receipt-only documentation head; that head must pass its own hosted checks.
- CodeQL, Vercel, and CodeRabbit did not appear or run in the new repository and remain later setup findings rather than passed checks. Codex GitHub review completed on `953e04c680d497851cdb6b6533b92de8f9b1c4f2`, not on the later `23f5b8654a89c83de4ae3c6454996e9f7bc6b283` head or any subsequent receipt-only head.
- External actions were creation of the public GitHub repository, publication of `main` and the review branch (including the test-only correction), opening the unmerged bootstrap PR, the recorded hosted CI runs, and the Codex GitHub review on the earlier receipt head. This receipt correction added no PR comment or internal note. No tag, PR merge, deployment, provider configuration, domain/DNS, production database, payment, email, media, runtime rebrand, legal cutover, or Phase 3 action occurred.
- Every later Browser QA acceptance cycle retains the disposable Neon contract: create a new independent empty QA project, pass identity and fingerprint checks, apply exactly the 46 committed migrations, prove all application tables empty, delete the cycle-owned project, and prove it absent. No production data may participate.
- Phase 1–2 bootstrap work is published for review, but the program stops before Phase 3. `codex/atmoshaper-docs-consolidation` is the recommended next branch only after a separate Phase 3 plan is reviewed and authorized; it has not been created and consolidation has not begun.

## 2026-09-09 — Bootstrap merged; Phase 3 completed locally

- [PR #1](https://github.com/dsbowersock/atmoshaper/pull/1) merged at `2026-09-09T09:36:44Z` by `dsbowersock` as `f59e1b9371b06e7401740ae011f6dc911430a97c`. The merge joins sole fresh root `7e89f7ba9508a1ad715c1824ea6099432e6a4ccd` and reviewed head `6f516b29a8f1be8c66b48663f1101b66efe3f7f9`; `codex/bootstrap-atmoshaper` remains retained. Exact source remains MassageLab `e74045c2fc85c2cb4df176fdb1aff2137c4d9848`; see [lineage](../MIGRATION_LINEAGE.md).
- Created the local `codex/atmoshaper-docs-consolidation` branch from that merge. Planning commit `7aedadb` records the approved [Phase 3 plan](superpowers/plans/2026-09-09-atmoshaper-phase3-documentation-consolidation.md).
- Task 1, committed as `99a1faa`, added the [architecture owner map](architecture.md) and [decision index](decisions/README.md). ADR 0001 is Accepted; ADRs 0002–0004 remain Proposed and do not claim implemented public-brand ownership, old-origin recovery, or parallel provider staging.
- Task 2, committed as `7be78ff`, added the current [account-security owner](wiki/account-security.md) and wiki navigation, reconciling account-method and 2FA rules against current code and tests.
- Task 3, committed as `49fba96`, omitted exactly 16 evidence-cleared historical plans and repaired their retained audio/Chimer references. The semantic review covered 150 inherited records: 134 remain (28 specifications and 106 plans), while MassageLab retains all originals. With the additional Phase 3 plan, the current directories contain 107 plans and 28 specifications. The [cleanup register](rebrand/atmoshaper-cleanup-register.md#phase-3-documentation-omissions--2026-09-09) records each exact path, current owner, immutable source, and rollback blob.
- Task 3 also reconciled the audio wiki with current code: permitted idle/hover compressed-payload preparation is network-gated, while focus/pointer-down use metadata-only defaults. This documentation correction changes no runtime behavior or media/provider state.
- Task 4 repository and migration authority synchronization is complete at `7daec8142d0353b33f5aaeabcccb7689f15c820b`. Task 5 reconciled the deterministic documentation audit baseline without weakening its classifier, received independent whole-branch specification and quality passes, and completed the focused, typecheck, lint, full-unit, production-build, inventory, brand, link, scope, and whitespace gates recorded in the [Phase 3 evidence](aegis/work/2026-09-09-atmoshaper-phase3-documentation-consolidation/90-evidence.md).
- Phase 3 local closeout completed at `62fd42beae83ea90b02a2ea321f7993c4b3661d1`. The authorized branch publication then opened [PR #2](https://github.com/dsbowersock/atmoshaper/pull/2) from `codex/atmoshaper-docs-consolidation`; this receipt synchronizes current repository status on that same branch. Hosted checks and review are active. Phase 4 has not started.
- No runtime rebrand, old-origin recovery implementation, provider staging, deployment, DNS/domain, production/database/payment/email/media, or legal change occurred through this local documentation work. Only the GitHub repository row is synchronized from verified repository facts; other hosted-provider observations remain dated evidence. Bootstrap checks above do not substitute for Phase 3 verification.

## 2026-09-10 — Phase 3 merged; Phase 4 audit-only work started

- [PR #2](https://github.com/dsbowersock/atmoshaper/pull/2) merged at `2026-09-10T00:57:48Z` as `7c07e4578307508ae2bdb784c4d7ad0d9fb64c65`. Its reviewed head was `9d2a8eca057f33354f2cbb50263c8e4f365a00f1`, and `codex/atmoshaper-docs-consolidation` remains retained.
- Created `codex/atmoshaper-dead-code-audit` from that exact merged `origin/main`. Planning commit `e27c1d0ce941fbf9610389b45b9a30c82caac873` records the approved [Phase 4 audit-only plan](superpowers/plans/2026-09-10-atmoshaper-phase4-audit-only.md).
- Phase 4 is evidence collection only. It may add deterministic read-only audits for possible dead-code, dependency, asset, and environment-configuration cleanup candidates. Audit findings are not deletion authority, and no candidate has approval for deletion, rename, upgrade, retirement, or runtime modification.
- Phases 5–10 remain unstarted. No push, pull request, deployment, provider/database/DNS/payment/email/media/production mutation, compatibility change, runtime rebrand, or legal cutover is authorized or claimed by this Phase 4 start record.
- Added the shared cleanup-evidence core at `f4cecfe`, dead-code and dependency lanes at `88829da`, and asset and environment lanes at `6563946`. The package lock and all candidate files remained unchanged.
- From clean committed index `656394639464601c6e8b0833389c8272a95c2a95`, each of the four reports was captured twice and matched byte for byte. The reports identify bounded candidates and uncertainties while setting `deletionAuthority: false`; the [cleanup register](rebrand/atmoshaper-cleanup-register.md#phase-4-audit-only-evidence--2026-09-10) and [Aegis evidence](aegis/work/2026-09-10-atmoshaper-phase4-audit-only/90-evidence.md) hold the exact hashes and counts.
- Reconciled the deterministic brand baseline after earlier authority-document line movements: schema and source stayed fixed, historical/legal/compatibility counts stayed fixed, and the pre-rebrand public-copy count decreased by one from 1,953 to 1,952. The final audit has zero missing and zero unclassified references, and a fresh candidate is byte-identical to the tracked baseline.
- Candidate status remains `unresolved`, `protected`, or `candidate`. Deletion authority is none. Task 6 local verification and independent review remain before any publication decision; no cleanup or external mutation occurred.
- Task 6 pre-commit verification passed the 51/51 focused audit suite, repository inventory with 1,915 files and 47,128,976 Git blob bytes, brand audit with zero missing or unclassified occurrences, and byte-identical double runs of all four audit reports. Prisma validation/generation, typecheck, lint, and the 115-page production build also passed.
- The first full unit run correctly caught a stale project-state verification-date ceiling: 4,249 tests, 4,245 passed, 1 failed, and 3 skipped. Coordinator-authorized fix round 1 advanced only the test ceiling from 2026-09-09 to 2026-09-10. Its focused file passed 15/15, and the full rerun passed 4,246 with 3 skips and no failures. No runtime behavior changed.
- Final receipt paths remain unstaged for coordinator review and exact staged-index rechecks. Independent whole-branch specification and quality review remain required. No candidate deletion, Browser QA, temporary QA project, push, pull request, merge, deployment, provider mutation, or Phase 5 work occurred.
- Independent whole-branch review found five valid audit-tooling defects: policy content was worktree-backed, the common report envelope diverged from the approved contract, a protected negative fixture appeared as an unresolved error, the shared implementation exceeded the source-size boundary, and environment aliases were not classified.
- The bounded final-review repair reads the policy and all evidence from one captured stage-0 entry set, exposes the exact seven-field report contract, makes the protected test-fixture boundary explicit while active paths fail closed, splits the shared implementation into bounded single-builder modules, and distinguishes proven environment aliases from named uncertainty. The focused suite passed 59/59; four real double runs were byte-identical with empty standard error and one inventory identity; inventory, brand, Prisma, typecheck, lint, full unit and build gates passed.
- The first fully staged repair capture, taken before receipt-only documentation synchronization, passed its index-sensitive readback: the focused suite was 59/59; inventory was 1,921 files and 47,170,491 Git blob bytes with common identity `4d826fc678cbb9303eb43805ece57978f1910d958b69cd65038c037f4a8bf827`; all four exact seven-field reports passed twice with byte-identical output and empty standard error; and the brand audit passed with zero missing, zero unclassified, and a byte-identical 5,984,749-byte baseline candidate. Those hashes describe that capture, not an immutable final commit candidate, because these synchronized versioned receipts change the index they describe. The preceding chronological unstaged snapshots remain historical evidence. Final receipt-document staging and one exact final-index readback remain; its hashes will be retained in the ignored SDD handoff and user-facing completion receipt instead of being embedded back into the self-hashed index. Repeat independent specification and quality reviews and the coordinator-owned commit then remain; none is claimed complete. Every candidate remains `candidate`, `protected` or `unresolved`; deletion authority is none. No publication, cleanup, external mutation or Phase 5 work occurred.
- Further quality review superseded the 59/59 capture for current-tooling decisions. The pre-publication final staged repair cycle sanitized malformed and path-like import specifiers, recognized destructured environment defaults, shared the installed Next 16.2.12 single-digit metadata convention across module and asset audits, preserved multi-digit lookalikes as candidates, modeled lexical shadowing and alias reassignment, and recorded literal `require.resolve()` ownership while hashing nonliteral arguments. Repair validation first confirmed three failing regression cases, then 3/3 passing after their fixes; strict TDD remained off. The combined focused suite passed 64/64. At this historical snapshot, semantic results were dead code 1,558 findings/186 uncertainties, dependency 2,859/19, asset 340/2,002, and environment 753/192. The full suite passed 4,259 tests with 3 host-dependent skips and zero failures; the 115-route production build passed. Exact final-index hashes remain outside the self-hashed versioned index. Repeat independent reviews and the coordinator-owned commit still remained. No candidate deletion, dependency/runtime change, publication, external mutation or Phase 5 work occurred.
- The exact pre-publication final-index readback then reported 1,921 tracked files, 47,190,661 Git blob bytes, and inventory SHA-256 `0ac48857cf1ac12b3e5c342cc3a3822c1ce020e947dae24ce4ab174d6800fa70`. Repeat independent specification and quality reviews passed, and the coordinator created local completion commit `e2aa080aa3e1c24f71bd401fe8b3f6720ce85671`. Separate publication authorization pushed the branch and opened [PR #3](https://github.com/dsbowersock/atmoshaper/pull/3) for hosted review. No candidate deletion, dependency/runtime change, provider mutation, or Phase 5 work occurred.
- Hosted review round 2 added config-alias, whole-object/computed environment, and browser-snapshot coverage while preserving the earlier 64/64 and 68/68 receipts as historical captures. That round's focused repository audit suites passed 74/74, with historical semantic results of dead code 1,558 findings/186 uncertainties, dependency 2,859/19, asset 388/2,003, and environment 587/191. Its historical pre-document receipt-synchronization snapshot measured 47,216,441 Git blob bytes.
- Hosted review round 3 added separately labeled exact declaration-companion/type evidence, two exact configuration/manifest dependency owners, and owner-relative bare asset paths that become exact only when tracked and in inventory and otherwise remain hash-only uncertainty. That round's focused repository audit suites passed 80/80. Its now-historical semantic results were dead code 1,558/186 with 842 referenced modules and 23 candidates; dependency 2,861/19 with 2 configuration owners and 6 candidates; asset 390/11,384 with 97 tracked assets, 97 protected items, 177 exact owners, zero candidates, 529 dynamic rows and 10,855 unresolved rows; and environment 587/191. Its tracked inventory contained 1,921 files. Exact staged bytes and identity remain in the ignored handoff and user-facing receipt rather than this self-referential versioned log. Brand verification was zero missing and zero unclassified, and every report kept `deletionAuthority: false`. No candidate deletion, dependency/runtime change, provider mutation, or Phase 5 work occurred.
- Hosted review round 4 moved exact configuration ownership into the validated stage-0 policy and conservatively covered direct, aliased, wrapped, logical and conditional whole-environment forwarding without changing asset semantics. That round's focused repository audit suites passed 83/83: 21 repository-audit tests and 62 cleanup-audit tests. Its now-historical semantic results were dead code 1,558/186 with 842 referenced modules and 23 candidates; dependency 2,861/19 with 2 configuration owners and 6 candidates; asset 390/11,384 with 97 tracked assets, 97 protected items, 177 exact owners, zero candidates, 529 dynamic rows and 10,855 unresolved rows; and environment 587/250 with 77 computed and 173 unproven-alias uncertainties and zero unread-declaration candidates. The tracked inventory contained 1,921 files. Brand verification was zero missing and zero unclassified, and every report kept `deletionAuthority: false`. Exact staged bytes and identity remain only in the ignored handoff and user-facing receipt. No candidate deletion, dependency/runtime change, provider mutation, or Phase 5 work occurred.
- Hosted review round 5 recognized runtime named `env` imports from the exact `node:process` and `process` modules and preserved their evidence through lexical loop/catch shadowing and function-scoped `var` behavior, including assignment-free redeclarations. It also repaired two historical receipt anchors in the reference inventory. That round's focused repository audit suites passed 86/86: 21 repository-audit tests and 65 cleanup-audit tests. Its now-historical semantic results were dead code 1,558/186 with 842 referenced modules and 23 candidates; dependency 2,861/19 with 2 configuration owners and 6 candidates; asset 390/11,384 with 97 tracked assets, 97 protected items, 177 exact owners, zero candidates, 529 dynamic rows and 10,855 unresolved rows; and environment 587/252 with 79 computed and 173 unproven-alias uncertainties and zero unread-declaration candidates. Its tracked inventory contained 1,921 files. Brand verification was zero missing and zero unclassified, and every report kept `deletionAuthority: false`. Exact staged bytes and identity remain only in the ignored handoff and user-facing receipt. No candidate deletion, dependency/runtime change, provider mutation, or Phase 5 work occurred.
- Hosted review round 6 recorded nested object destructuring defaults sourced from proven environment objects. That round's focused repository audit suites passed 87/87: 21 repository-audit tests and 66 cleanup-audit tests. Its now-historical semantic results were dead code 1,558/186 with 842 referenced modules and 23 candidates; dependency 2,861/19 with 2 configuration owners and 6 candidates; asset 390/11,384 with 97 tracked assets, 97 protected items, 177 exact owners, zero candidates, 529 dynamic rows and 10,855 unresolved rows; and environment 587/252 with 79 computed and 173 unproven-alias uncertainties and zero unread-declaration candidates. At the verified round-6 staged code snapshot, the full suite passed 4,282 tests with 3 host-dependent skips and zero failures; typecheck and lint passed. Its tracked inventory contained 1,921 files. Brand verification was zero missing and zero unclassified, and every report kept `deletionAuthority: false`. Exact staged bytes and identity remain only in the ignored handoff and user-facing receipt. No candidate deletion, dependency/runtime change, provider mutation, or Phase 5 work occurred.
- Hosted review round 7 recorded exact tracked runtime package metadata ownership, keeping `@generative-music/pieces-alex-bainter` out of unreferenced candidates without claiming an executable import. The generic parser required exact declared package names and versions and conservatively handled lexical shadows, duplicate or overridden properties, and spreads. That round's focused repository audit suites passed 88/88: 21 repository-audit tests and 67 cleanup-audit tests. Its now-historical semantic results were dead code 1,558/186 with 842 referenced modules and 23 candidates; dependency 2,863/19 with 2 configuration owners, 1 runtime-package-metadata owner, 144 referenced packages and 5 candidates; asset 390/11,384 with 97 tracked assets, 97 protected items, 177 exact owners, zero candidates, 529 dynamic rows and 10,855 unresolved rows; and environment 587/252 with 79 computed and 173 unproven-alias uncertainties and zero unread-declaration candidates. Round-7 verification passed: the full suite recorded 4,283 passed, 3 host-dependent skips and zero failures; typecheck passed; lint passed with no ESLint warnings; and the production build passed with 115 routes. The build's Babel deoptimization note was informational, not a lint warning. Earlier round-6 results remain historical supporting evidence. Its tracked inventory contained 1,921 files. Brand verification was zero missing and zero unclassified, and every report kept `deletionAuthority: false`. Exact staged bytes and identity remain only in the ignored handoff and user-facing receipt. No candidate deletion, dependency/runtime change, provider mutation, or Phase 5 work occurred.
- Hosted review round 8 added `data/` to the asset inventory and explicitly protected it as a conservative retained catalog/provenance boundary. Duplicate dependency declarations preserved all exact string versions across declaration sections for runtime metadata matching, without claiming an executable import. That round's focused repository audit suites passed 91/91: 21 repository-audit tests and 70 cleanup-audit tests. Its now-historical semantic results were dead code 1,558/186 with 842 referenced modules and 23 candidates; dependency 2,863/19 with 2 configuration owners, 1 runtime-package-metadata owner, 144 referenced packages and 5 candidates; asset 561/11,302 with 137 tracked assets, 137 protected items, 262 reference owners, 25 basename signals, zero candidates, 529 dynamic rows and 10,773 unresolved rows; and environment 587/252 with 79 computed and 173 unproven-alias uncertainties and zero unread-declaration candidates. At the verified round-8 staged snapshot, the full suite recorded 4,289 tests: 4,286 passed, 3 host-dependent skips and zero failures. Typecheck passed; lint passed with no ESLint warnings; and the production build passed with 115 routes. The Babel deoptimization note was informational, not a lint warning. All four audit CLIs ran twice with byte-identical output, zero stderr and `deletionAuthority: false`.
- Hosted review round 9 made global and exact imported process-object recognition scope-aware. Lexical/TDZ, `var`, function, class, catch, loop, module and static-block shadows no longer imply environment ownership. Parameter defaults were evaluated separately from body bindings, and namespace `ImportEquals` declarations shadowed outer process objects. The import classifier was consolidated; the environment analyzer contained 482 nonblank lines. These repairs changed no real-repository audit counts. That round's focused repository audit suites passed 95/95: 21 repository-audit tests and 74 cleanup-audit tests. Its now-historical semantic results were dead code 1,558 findings/186 uncertainties; dependency 2,863/19; asset 561/11,302; and environment 587/252: 306 static reads, 79 declared names, 202 missing declarations, zero unread-declaration candidates, 79 computed uncertainties and 173 unproven-alias uncertainties. At the verified round-9 staged code snapshot, the full suite recorded 4,293 tests: 4,290 passed, 3 host-dependent skips and zero failures. Typecheck passed; lint passed with no ESLint warnings; and the production build passed with 115 routes. Rounds 7 and 8 remain historical supporting evidence. Every report retains `deletionAuthority: false`.
- Hosted review round 10 repaired two validated latest-head findings: outer proven/unknown environment aliases leaking across inner declarations, and non-Node runtime imports locally named `env` or `environment` disappearing from the evidence. Inner declarations shadowed outer aliases without discarding existing same-scope bindings on assignment-free `var` redeclarations. Non-Node wrapper imports remain unproven-alias uncertainty, not exact environment ownership; exact Node imports and type-only exclusions remain distinct. The regression repair followed TDD RED/GREEN validation. The environment analyzer contained 490 nonblank lines. That round's focused repository audit suites passed 97/97: 21 repository-audit tests and 76 cleanup-audit tests. At the verified round-10 code snapshot, the full suite recorded 4,295 tests: 4,292 passed, 3 host-dependent skips and zero failures. Typecheck and lint passed; the Babel deoptimization note was informational, not an ESLint warning. The exact environment audit ran twice with byte-identical output, zero stderr and `deletionAuthority: false`. Its now-historical totals remained unchanged at 587 findings/252 uncertainties: 306 static reads, 79 declared names, 202 missing declarations, zero unread-declaration candidates, 79 computed uncertainties and 173 unproven-alias uncertainties. Round-9 verification remains historical supporting evidence, including its production-build receipt. At that snapshot, latest-head hosted review was pending; resolving hosted feedback and final checks/review precede any separately authorized merge. No cleanup deletion, provider mutation or Phase 5 action occurred; `deletionAuthority` remains false.

## 2026-09-11 — Phase 4 hosted review round 11 privacy and opaque-tool hardening

- Hosted review round 11 recorded the staged CodeRabbit/Codex privacy and opaque-tool hardening. Nested `.secrets/` and `secrets/` directories were rejected at any depth before policy, metadata or evidence blob reads. The tracked Python adapter was represented exactly once as an opaque manual-tool uncertainty without parsing its content; this does not claim a static import or authorize removal. That round's focused repository audit suites passed 98/98. The full suite recorded 4,296 tests: 4,293 passed, 3 host-dependent skips and zero failures. Typecheck and lint passed. Its now-historical semantic results were dead code 1,558 findings/187 uncertainties, including 2 manual-script uncertainties; dependency 2,863/19; asset 561/11,303; and environment 587/252. All four audits ran twice with byte-identical output, exit 0 and empty stderr; every report retained `deletionAuthority: false`. Brand verification reported zero missing and zero unclassified references, and the inventory reported zero forbidden tracked paths. The exact staged capture before this round's documentation synchronization contained 1,921 files and 47,355,254 Git blob bytes, with inventory SHA-256 `bb8b8c792c03a60bd5531e69e4f6c81d95781851b751c8b9a5824700036ded92`. This is a historical pre-document-synchronization capture, not the identity of the index after these versioned receipts are staged. Current final-index bytes and hashes remain outside these self-referential versioned documents. Round-10 results remain historical supporting evidence. At that snapshot, latest-head hosted review and final checks/review were pending before any separately authorized merge of PR #3. No cleanup deletion, provider mutation or Phase 5 action occurred; `deletionAuthority` remains false.

## 2026-09-11 — Phase 4 hosted review round 12 credential and stylesheet coverage

- Hosted review round 12 repaired two validated latest-head Codex findings: tracked credential/secret basename files could bypass privacy protection under non-JSON extensions, and 22 CSS files were absent from cleanup candidate/uncertainty coverage. Exact or dotted `credential`, `credentials`, `secret` and `secrets` basenames are now rejected independently of extension before blob reads, while lookalike names remain allowed. Policy-owned `.css` files each appear exactly once as metadata-only `stylesheetUsage` uncertainties, without JS/TS parsing or dependency evidence; existing imports and CSS asset-reference evidence remain preserved. TDD credential validation recorded RED with 0 of 1 targeted test passing, then GREEN 2/2. All 3 newly added CSS regression tests failed at RED for the expected missing coverage before implementation; the CSS GREEN slice passed 11/11. The authoritative staged focused repository audit suites passed 101/101. The full suite exited 0 with 4,299 tests: 4,296 passed, 3 host-dependent skips and zero failures. Typecheck and lint passed; the Babel deoptimization note was informational. Its now-historical semantic results were dead code 1,558 findings/209 uncertainties, including 22 `stylesheetUsage` and 2 `manualScripts` uncertainties; dependency 2,863/19; asset 561/11,305; and environment 587/252. All four audits ran twice with byte-identical output, exit 0 and empty stderr; every report retained `deletionAuthority: false`. Brand verification remained at zero missing and zero unclassified references. The historical pre-document-synchronization staged inventory contained 1,921 files and 47,369,668 Git blob bytes, with inventory SHA-256 `88baaae9e2ebd36cc66e06965ab3dee426a3c1bcaf1b3eaa110a1d8bd7c0d12a` and zero forbidden tracked paths. This capture does not identify the index after these versioned receipts are staged; current final-index bytes and hashes remain outside these self-referential documents. Round-11 results remain historical supporting evidence. At that snapshot, latest-head hosted checks and reviews remained pending before any separately authorized merge of PR #3. No deletion, merge, provider mutation or Phase 5 action occurred; `deletionAuthority` remains false.

## 2026-09-11 — Phase 4 hosted review round 13 credential-directory hardening

- Hosted review round 13 repaired one validated latest-head Codex finding at `3a10a1b`: nested exact plain or dotted singular/plural credential/secret directory segments could bypass the fail-before-read guard. Those directory segments are now rejected before metadata or blob reads, while lookalike names remain allowed. TDD validation recorded RED with 0 of 1 targeted test passing, then GREEN 1/1. The focused privacy/source-cap slice passed 8/8, and the CSS regression slice passed 3/3. The authoritative staged repository audit suites passed 101/101. The full suite exited 0 with 4,299 tests: 4,296 passed, 3 host-dependent skips and zero failures. Typecheck and lint passed; the Babel deoptimization note was informational. Its now-historical semantic results were dead code 1,558 findings/209 uncertainties, including 22 `stylesheetUsage` and 2 `manualScripts` uncertainties; dependency 2,863/19; asset 561/11,308; and environment 587/252. All four audits ran twice with byte-identical output, exit 0 and empty stderr; every report retained `deletionAuthority: false`. Brand verification remained at zero missing and zero unclassified references. The historical pre-document-synchronization staged inventory contained 1,921 files and 47,381,374 Git blob bytes, with inventory SHA-256 `1bf7e63a2192b624816da03083b867d45d6611b51d37a7d8bb10fe99c6bbbe9a` and zero forbidden tracked paths. This capture does not identify the index after these versioned receipts are staged; current final-index bytes and hashes remain outside these self-referential documents. Round-12 results remain historical supporting evidence. At that snapshot, latest-head hosted checks and reviews remained pending before any separately authorized merge of PR #3. No deletion, merge, provider mutation or Phase 5 action occurred; `deletionAuthority` remains false.

## 2026-09-11 — Phase 4 hosted review round 14 compound credential-artifact hardening

- Hosted review round 14 repairs one validated latest-head Codex finding on `9e5cb0c`: bounded compound credential-artifact basenames `client_secret_<identifier>` and exact `service-account-key` were reaching metadata or blob reads. They are now rejected before policy, metadata or evidence reads. Case and nesting variants were tested; benign lookalikes remain allowed. Strict TDD validation recorded RED with 0 of 1 targeted test passing, then GREEN 1/1. The relevant privacy/CSS/source-cap slice passed 11/11, and the authoritative staged focused repository audit suites passed 101/101. The full suite exited 0 with 4,299 tests: 4,296 passed, 3 host-dependent skips and zero failures. Typecheck and lint passed; the Babel deoptimization note was informational. Its now-historical semantic results were dead code 1,558 findings/209 uncertainties, including 22 `stylesheetUsage` and 2 `manualScripts` uncertainties; dependency 2,863/19; asset 561/11,312 with 529 dynamic and 10,783 unresolved uncertainties; and environment 587/252. All four audits ran twice with byte-identical output, exit 0 and empty stderr; every report retained `deletionAuthority: false`. Brand verification remained at zero missing and zero unclassified references. The historical pre-document-synchronization staged inventory contained 1,921 files and 47,391,330 Git blob bytes, with inventory SHA-256 `76816a9001dd302d4765da3dc868da9d9eb9636ee3809c71814659c3d2f6c046` and zero forbidden tracked paths. This capture does not identify the index after these versioned receipts are staged; exact final-index bytes and hashes remain outside these self-referential tracked documents. Round-13 results remain historical supporting evidence. At that snapshot, latest-head hosted checks and CodeRabbit/Codex reviews remained pending before any separately authorized merge of PR #3. No deletion, merge, provider mutation or Phase 5 action occurred; `deletionAuthority` remains false. At that snapshot, the tracked inventory contained 1,921 files. Brand verification was zero missing and zero unclassified, and every report kept `deletionAuthority: false`. Exact staged bytes and identity remain only in the ignored handoff and user-facing receipt. PR #3 remained in hosted review; resolving hosted feedback and final checks/review preceded any separately authorized merge. No candidate deletion, dependency/runtime change, provider mutation, or Phase 5 work occurred.

## 2026-09-11 — Phase 4 hosted review round 15 credential and CommonJS process hardening

- Hosted review round 15 records two validated latest-head Codex findings on `9946a24`: generic `client-secret.json`, `client_secret.json`, and `service-account.json` artifacts bypassed the fail-before-read guard, while direct CommonJS `const process = require("node:process")` and `require("process")` bindings were not recognized and caused false unread environment declarations. The bounded credential matcher now recognizes exact optionally dot-prefixed `client[-_]secret` and `service[-_]account` stems only at dot or end boundaries, preserves the earlier `client_secret_<identifier>` and `service-account-key` forms, and leaves benign guide/manager lookalikes allowed. The CommonJS process-binding scope model recognizes those exact direct requires and models `require`/`process` shadowing, assignment/update invalidation, loop evaluation order, merged enum members, and sloppy `.cjs` Annex-B block-function boundaries. Cross-file/global bindings and separately merged namespace enums remain explicitly unmodeled. The current real tracked-source search found no CommonJS process require outside audit fixtures. On the staged code, focused repository-audit tests passed 119/119; the full suite recorded 4,317 tests with 4,314 passed, 3 host-dependent skips and zero failures; and typecheck and lint passed. Pre-document audits ran twice with byte-identical output, exit 0 and empty stderr, and every report retained `deletionAuthority: false`: dead code 1,561 findings/209 uncertainties; dependency 2,864/19; asset 561/11,314; and environment 587/252. Brand verification reported zero missing and zero unclassified references. The pre-document staged inventory contained 1,922 files and 47,432,255 Git blob bytes with inventory SHA-256 `9ceea8c33aee9a51559efc389c9834e31fbecb4f40ee5154ae7d738b5638d6d0` and zero forbidden tracked paths. Repeat output SHA-256 values were dead code `a6357175f60ce4bba5fbcde50a93e262ebb5744c89c409b2b844cf78f68047a5`, dependency `f068dd6f6f219f9a0d5abbf4462752373cbca7bee02c9d9bd8756e142ec49a47`, asset `ad1f0bfacd3cdab11ba39986af151d760b9e750b48b94345f53c718ecf3a2051`, environment `c1dc9e91f3861926328721bd6e98d269c7eceb29f9970a09b18d047e31bd4acf`, inventory `82d2afaf5b953d9e2c2a83acd01d819ce2ea7a3d38c1c4bc293e8e86f0cafb4a`, and brand `50a8f6f48d60f51c00edfd2b0a5005289e007e9939f18862beaa5e83667ecd2b`. These are pre-document receipts, not final self-referential index hashes. Round-14 results remain historical supporting evidence. Hosted checks and reviews remain pending, and merge remains separately authorized. The current tracked inventory is 1,922 files. No deletion, merge, provider action or Phase 5 work occurred.

## 2026-09-11 — Phase 4 hosted review round 16 TypeScript import-equals evidence

- Hosted review round 16 records two validated latest-head Codex findings on `012945b`: TypeScript external import-equals references were absent from module/dependency evidence, and exact non-type source-level `import <alias> = require("process"|"node:process")` declarations were not proven for environment reads. The bounded module repair emits separately labeled `import-equals` literal/static evidence, preserves type-only declaration resolution, ignores internal aliases and keeps syntactically possible nonliteral external references as hash-only uncertainty. Process import-equals becomes proven only for valid source-level non-type declarations, preserving source order, shadowing and assignment/update invalidation while excluding unrelated, internal, type-only and nested-invalid forms. Independent review caught and repaired the TS1147 namespace false-positive. Current tracked source contains no import-equals `require(...)` syntax, so semantic totals remained dead code 1,561/209, dependency 2,864/19, asset 561/11,314 and environment 587/252. Staged validation passed module 3/3; environment RED 0/2 then GREEN 2/2; namespace correction RED 1/2 then GREEN 2/2; combined slice 52/52; focused audits 123/123; full suite 4,318 of 4,321 with 3 skips and zero failures; typecheck, lint and diff checks; and source caps module 500/environment 499/scope 131. The pre-document double-run output SHA-256 values were dead code `eb107cba04779167de1d5dd51d4853ec29f6dc7d033c2092df8a589c0db7de5d`, dependency `5a4bd9558096d5591631de4b08420265c7944bcf9f57a99da01ea485ca1e7987`, asset `7602647f66d3fcd49fe5e1c644ec257d3b1348b7d07f10ce0400c9ffa502bd92`, and environment `10eb84399aa88deedeae437526ae04151aa23a5a4d808dc0c5142f7606d0b19b`; each audit was byte-identical twice, exited 0 with empty stderr and retained `deletionAuthority: false`. The pre-document inventory was 1,922 files, 47,454,881 Git blob bytes, inventory SHA-256 `6f8dc45abda5436f0cb257583800959b55772f2ce35ffa38009b8534debb0541`, zero forbidden paths and output SHA-256 `b1fdcd9c5ab13ee2b2a1c4285d440bfbb0b5635a2e77c6c16d8b1933382ac6d3`; brand remained zero missing/zero unclassified with output SHA-256 `50a8f6f48d60f51c00edfd2b0a5005289e007e9939f18862beaa5e83667ecd2b`. Round 15 is now historical. Exact final staged bytes and identity remain only in the ignored SDD/user-facing receipt. Hosted reviews/checks remain pending, merge remains separately authorized, and no deletion, provider action or Phase 5 work occurred.

## 2026-09-11 — Phase 4 hosted review round 17 environment wrapper and assignment evidence

- Hosted review round 17 records two validated CodeRabbit findings on remote head `012945b`: `SatisfiesExpression` wrappers dropped proven environment/CommonJS flows, and destructuring assignments from proven environment objects omitted exact extracted top-level keys in favor of overbroad whole-object uncertainty. Shared `satisfies` transparency now covers aliases, direct reads, CommonJS recognition and escape traversal while preserving shadow and mutation boundaries. A focused environment-pattern helper records shorthand, renamed and literal-computed top-level keys, limits nested patterns to their source object's top level, recognizes separately sourced nested defaults, and preserves hash-only dynamic/rest/unproven-alias uncertainty, evaluated expressions, evaluation order, target invalidation, privacy, determinism and duplicate suppression. Independent final review also found and repaired a conditional destructuring-default provenance gap: simple assignment defaults sourced from proven or unknown environment objects now emit one hash-only unbounded `assignment-default` uncertainty and keep the target unknown, preserving shorthand and renamed cases, outer exact-key extraction, subsequent reads, shadows and invalidation without plaintext or duplicate rows. Strict TDD recorded `satisfies` RED 0/3 then GREEN 3/3, assignment RED 0/3 then GREEN 3/3, and conditional assignment-default RED 0/5 then GREEN 5/5; the combined assignment tests passed 8/8, the broad slice passed 58/58 and final independent review passed. Focused repository-audit tests passed 134/134; the full suite recorded 4,332 total, 4,329 passed, 3 host-dependent skips and zero failures; typecheck, lint, documentation-state and diff checks passed; and source caps were environment analyzer 486, environment-pattern helper 35, environment scope 132 and module evidence 500 nonblank lines. Pre-document audits ran twice byte-identically with exit 0, empty stderr and `deletionAuthority: false`: dead code 1,564/209 (`001c36b186d4021429bb94cb960b387d66cdc94b8757d14052d19147df8b3d5d`), dependency 2,865/19 (`87da875dc4bc725aca133f89517ca63361fd32f8b1bc057c5f72cd330a34b7c0`), asset 561/11,314 (`24ada69ed439ed7d3b1bf324d6145e73a73227f6df5e3abf7917f35510013202`) and environment 587/252 (`5e39857febefb3ba62bdd4ca03f879f8d055093e14e978193cdf42b3595cc026`). The pre-document-amendment inventory contained 1,923 files, 47,493,216 Git blob bytes, inventory SHA-256 `c3e05e17b166e8a8e8c69bf57321d27ea99c05a489a5a561bbb730bbfd31aafd`, zero forbidden paths and output SHA-256 `61060d4d4f24138872daf9dc42935c83afa349bfbd6a0ff72e79dce80046653f`; brand remained zero missing/zero unclassified with output SHA-256 `50a8f6f48d60f51c00edfd2b0a5005289e007e9939f18862beaa5e83667ecd2b`. Round 16 is now historical; exact final staged bytes and identity remain only in the ignored SDD/user-facing receipt. Four hosted threads remain until push. The latest CodeRabbit review completed with these two comments; latest-head re-review and checks remain pending. Merge remains separately authorized, and no deletion, provider action or Phase 5 work occurred.

## 2026-09-11 — Phase 4 hosted review round 18 loader ownership, NodeNext substitution, and logical-assignment evidence

- Hosted review round 18 records three validated latest-head findings on remote `01ae7fb`: bare loader spelling was insufficient proof when `require` or `createRequire` was shadowed; NodeNext resolution crossed extension families instead of keeping explicit `.cjs` and `.mjs` requests within `.cts`/`.d.cts` and `.mts`/`.d.mts`; and logical `&&=`, `||=` and `??=` assignments did not preserve conditional environment provenance. Loader evidence now requires scope-aware `require`/`createRequire` ownership, proves only exact `createRequire(import.meta.url)` construction, retains hash-only uncertainty for unproven loaders, and covers mutation and `.resolve` mutation. NodeNext substitution stays within the matching CommonJS or ESM family with no `.ts`/`.tsx` cross-family fallback. Logical assignments snapshot right-hand provenance after left-hand evaluation: proven or unknown environment sources emit one hash-only unbounded operator-specific uncertainty and downgrade simple identifier targets to unknown; member targets retain uncertainty without local alias rebinding, while unconditional `=` and assignment-default behavior remain unchanged. Exhaustive independent staged review found and fixed adjacent scope and evaluation-order gaps across parameter, switch, enum, loop, pattern, catch, class, decorator, Annex-B, `with`, optional-call and mutation boundaries, including `.resolve` mutation behavior. Final independent review passed with 53 accumulated reproductions and 16/16 targeted checks. The earlier 145/145 focused repository-audit result predates those follow-ups and is historical; the final loader slice passed 28/28 and environment slice passed 60/60, and the authoritative exact-staged focused repository-audit suite passed 162/162 after documentation synchronization. The full suite recorded 4,360 total, 4,357 passed, 3 host-dependent skips and zero failures; typecheck, lint and diff checks passed. Source caps were environment analyzer 496, environment-pattern helper 42, environment scope 132, module evidence 419, module loader 475 and module resolution 96 nonblank lines. Pre-document audits ran twice with byte-identical output, exit 0 and `deletionAuthority: false`: dead code 1,570/211 (`a035d78474f9fcb3ee465cf8e4f289a2112ef2cadcb4d86410faa8503a593cd4`), dependency 2,868/21 (`0e2c9ef622745d67b746e8f72ffecf74a48139095db67ddaf67a04f5e6ebeece`), asset 561/11,314 (`452217301e254a1ef5ec74abb4021eaddf1c01ade1c382e1ac3619acabdc1a00`) and environment 587/252 (`f87cac8099ec64eb613b6215202c5e461476f83164d452baa6fab4624851b91e`). The pre-document inventory contained 1,925 files and 47,569,581 Git blob bytes, inventory SHA-256 `c835271d633b07c09a58d6280cf1bfc520864674c7e34a2464f16f68db4d6619`, output SHA-256 `623f1bc01f36f8fab7f8db1e50b7448995323ef30dab6247a4130df2dfae684e` and zero forbidden paths. Brand verification remained zero missing/zero unclassified with output SHA-256 `50a8f6f48d60f51c00edfd2b0a5005289e007e9939f18862beaa5e83667ecd2b`. These pre-document hashes and identities become historical once the versioned receipts are staged; exact final identity remains only in the ignored SDD receipt. Latest-head hosted checks and reviews remain pending. Merge remains separately authorized, and no deletion, provider action or Phase 5 work occurred.

## 2026-09-11 — Phase 4 hosted review round 19 asset, module and successor evidence

- Hosted review round 19 records three validated latest-head findings and repairs. Bare owner-relative asset URLs now resolve as exact evidence only in parsed CSS `url(...)` tokens and Markdown link or image destinations; masked comments, fenced or inline code, ordinary prose and quoted content remain hash-only uncertainty. Strict TDD covered both context repairs and the follow-up masked slash-path regression. Independent final code review fixed and covered blockquote/list tilde fences, CSS escaped-newline and unclosed quoted strings, and CommonMark 5+ list-padding code boundaries. Explicit `.js`, `.jsx`, `.mjs` and `.cjs` imports preserve runtime ownership and separately record family-matched TypeScript substitution ownership for `.ts`, `.tsx`, `.mts` and `.cts`; declarations remain separately labeled declaration-companion evidence. The [tracked Round 18 successor attestation](aegis/work/2026-09-10-atmoshaper-phase4-audit-only/round-18-final-receipt.md) records immutable subject commit `f10773c7c94c9db9e4059a82dd45c5195fb83dc9`, tree `78b1b769413053bfb798038e31a6b4a21e8a52b9`, inventory identity and CRLF report hashes without claiming the later tree that contains the receipt. Independent staged review passed. The exact staged focused repository-audit suite passed 172/172; the full suite recorded 4,370 total, 4,367 passed, 3 host-dependent skips and zero failures; and typecheck, lint, documentation-state and working/staged diff checks passed. Source caps were asset evidence 253, module evidence 426, module resolution 101, module loader 475, environment analyzer 496, environment-pattern helper 42 and environment scope 132 nonblank lines. Current pre-document audits ran twice with byte-identical output, exit 0 and `deletionAuthority: false`: dead code 1,570/211 (`30ada36f1077ae197445417025da82cab1c3da73c452d66c3ceae1586509a5b0`), dependency 2,868/21 (`66403e4cde209e2cc387fa23f58639fc4de287b66f88b862b81f62287fd849e1`), asset 557/11,358 (`c4887ec9041c400a01201edca6368c27cdada07ec23808ee7e17faf45f6eeee6`) and environment 587/252 (`770bc579411453dda8a9df864492ff9d69cc1c724244cf442b8d802e01079313`). The current pre-document inventory contained 1,926 files and 47,629,855 Git blob bytes, inventory SHA-256 `55e5b16dc1055d424f305b9a5eebad8c72e157be236b6dc2ec1f9d5aae4a151d`, output SHA-256 `7b5f8db5051ab55762f054e07f7e7e61f0d580e6a6305ae95969b29d0d6a5fe1` and zero forbidden paths. Brand verification remained zero missing/zero unclassified with output SHA-256 `50a8f6f48d60f51c00edfd2b0a5005289e007e9939f18862beaa5e83667ecd2b`. This identity becomes historical when the synchronized documents are staged; the successor-attestation contract governs immutable subjects. Latest-head hosted checks and reviews remain pending. Merge remains separately authorized, and no deletion, provider action or Phase 5 work occurred.

## 2026-09-11 — Phase 4 hosted review round 20 HTML, module and receipt hardening

- Hosted review round 20 records six validated latest-head findings and repairs: extensionless bundler resolution now records separate TypeScript companion ownership, including dotted basenames; `.mts` and `.cts` asset sources use the TypeScript AST; and slashless quoted or unquoted HTML `src`, `href` and `poster` values become exact owner-relative evidence only in live start tags recognized by conservative stateful data/raw-text/comment tokenization. The tracked Round 18 successor receipt now rejects standard error, validates every trusted JSON field's existence and type before use, and removes only its bounded temporary checkout without masking an original error. Independent adversarial follow-ups covered case-insensitive duplicate attributes, ASCII/NBSP boundaries, PLAINTEXT through EOF, bogus and abrupt comments, quoted pseudo-tags, and raw end tags with attributes or slashes. The cleanup-audit suite passed 154/154, repository-audit passed 21/21, and the combined focused run passed 175/175. The full suite recorded 4,373 total, 4,370 passed, 3 host-dependent skips and zero failures; typecheck and lint passed, with lint's Babel note informational. Source caps were asset evidence 374, module evidence 426, module resolution 105, module loader 475, environment analyzer 496, environment-pattern helper 42 and environment scope 132 nonblank lines. The exact pre-document staged receipt ran twice with byte-identical output, exit 0, empty standard error, shared inventory and `deletionAuthority: false`: dead code 1,570/211 (`76b5c57f679d3199c3bd356c39a95a2e798121cab94343278da7158cea8dc334`), dependency 2,868/21 (`e78383f48cae71f4a183afab5eda173a19ab7de96cc64b7a82a4f9732fc16c1c`), asset 557/11,408 (`580499e903b1725957f4982250521e1996f2a99c6f48c893c2220a99c633081e`) and environment 587/252 (`55b5ff8b7480080551c471e503101a681e7f22769cfc5c18ccab485068f49362`). The pre-document inventory contained 1,926 files and 47,651,052 Git blob bytes, inventory SHA-256 `026219ea7eb8890b1215ed5558540fdfe3fb6b1e56eba8d0f0676ff312f5d091`, serialized-output SHA-256 `37764bb4f3947d438a004e7b9b0be4e1aa8ede7ffcd8ff16f0f790b917e4658a` and zero forbidden paths; brand remained zero missing/zero unclassified with output SHA-256 `50a8f6f48d60f51c00edfd2b0a5005289e007e9939f18862beaa5e83667ecd2b`. These values become historical when the synchronized documents are staged; the successor-attestation contract continues to govern immutable subjects. Latest-head hosted checks and reviews remain pending. Merge remains separately authorized, and no deletion, provider action or Phase 5 work occurred.

## 2026-09-11 — Phase 4 hosted review round 21 protocol, srcset and process-destructuring evidence

- Hosted review round 20 is now historical supporting evidence; round 21 is the current Phase 4 receipt. Three latest-head findings were validated and repaired: protocol-relative `//` asset references are external before root-relative handling; live HTML `srcset` values are parsed conservatively into candidate URLs with exact original offsets and are not rescanned by legacy literals; and CommonJS plus implicit process-object destructuring proves only exact, static, case-sensitive `env` bindings, including nested and assignment patterns, while preserving source-order mutation and shadow boundaries, including immediately executed class static propagation. Independent stage-1 specification review returned SPEC PASS. Three bounded quality rounds repaired false legacy `srcset` rescanning, declaration/assignment process-destructuring coverage, and implicit-process invalidation including class-static propagation; their RED receipts were 0/2, 0/1 and 0/1, and final code re-review returned PASS. Initial hosted regressions recorded RED 0/3 and GREEN 3/3. The final cleanup suite passed 161/161, repository audit 21/21 and combined focused run 182/182; the full suite recorded 4,380 total, 4,377 passed, 3 host-dependent skips and zero failures; typecheck passed, lint passed with only the informational Babel large-file note, and diff checks passed. Source caps were asset evidence 414, module evidence 426, module resolution 105, module loaders 475, environment evidence 499, environment patterns 73 and environment scope 144 nonblank lines. Pre-document staged audits each ran twice with exit 0, empty standard error, byte-identical output, shared inventory and `deletionAuthority: false`: dead code 1,570/211 (`f6072362bf363c8093c059bc2e545bf0e12f54b2bc99f779b142d4b70e669674`), dependency 2,868/21 (`a54ce7616a9271e804439a5026d4c834847ad7018b899e5ac43d5d9f3e2750d3`), asset 557/11,432 (`3012b71b2790b9885fc8cf6ce27bf6b988ddb8b2d670b9648803c62f9e3e15ab`) and environment 587/252 (`797f978ee56db6be1174bcac7d739bddd93d866d6b059b8568aab82c430fa5ba`). The inventory contained 1,926 files, 47,683,828 Git blob bytes, inventory SHA-256 `1860b5f32a83af6b433baf4b85937c363e216c7a910ce6615398663edf4f7fb8`, CRLF serialized-output SHA-256 `56ee8ed16eb397e994e957c9c4aa386b0d40c4ae7794e49ae496d24b2c569865` and zero forbidden paths; brand remained zero missing/zero unclassified with output SHA-256 `50a8f6f48d60f51c00edfd2b0a5005289e007e9939f18862beaa5e83667ecd2b`. These values become historical once the tracked documents are staged; the exact final staged snapshot remains pending in the ignored SDD receipt. Latest-head hosted checks and reviews remain pending. Merge remains separately authorized, and no deletion, provider action or Phase 5 work occurred.

## 2026-09-11 — Hosted review round 22

- Hosted review round 21 is now historical supporting evidence; hosted review round 22 is the current Phase 4 receipt. Six valid latest-head findings were repaired: aliases of proven process objects retain provenance; exact static bracket access to `env` is recognized; HTML character references decode before asset resolution while evidence retains original raw offsets; every exact top-level Sentry and instrumentation entrypoint is runtime-scoped; every parsed primary or duplicate `src`, `href`, `poster` and `srcset` value is masked from legacy scans while first-occurrence ownership is preserved; and parameter destructuring defaults sourced from `process` or a proven process alias propagate provenance. Review hardening added complete WHATWG named-reference and C1 decoding, fail-conservative handling for unknown references, non-ASCII whitespace preservation, and deterministic verification of the CPython 3.14.7 `html.entities.html5` snapshot. Code specification and quality reviews returned PASS. Cleanup passed 169/169, repository audit 21/21 and the combined focused audit 190/190; the full suite recorded 4,388 total, 4,385 passed, 3 host-dependent skips and zero failures; typecheck passed, and lint passed with only the informational Babel greater-than-500-KB note. Nonblank caps were asset evidence 436, HTML URL decoder 59, snapshot refresh verifier 34, environment evidence 498 and environment scope 157. Pre-document staged audits ran twice with exit 0, empty standard error, byte-identical output, shared inventory and `deletionAuthority: false`: dead code 1,575/211 (`cdd19f6df0eb0b72d07b42945fca148f2d9af1b3f7b0ecd03551dd06d9d41bf8`), dependency 2,872/21 (`039c715e5db07b08ff958b0322de6032be6a3e0a88599f65e369567df1d7538b`), asset 557/11,455 (`c90eab097560c71b8e92ab970e9e20ee4dcec1cb1e1e8b0160f3cc08e16ff2f8`) and environment 587/252 (`fb59f6fc055bd143b2cbff8f57b882078bb9c6fb0842d3a5848de3ae1a2c4829`). The inventory contained 1,929 files and 47,760,923 Git blob bytes, inventory SHA-256 `84208d00fae6678e4148c3c4fc3a6889921a85c99125f60299b3eff74b16f7a2`, serialized-output SHA-256 `517e85744eac31373ce529ada76032284d983da6cd9a13efa7ac46b433c3dadf` and zero forbidden paths; brand remained zero missing/zero unclassified with output SHA-256 `50a8f6f48d60f51c00edfd2b0a5005289e007e9939f18862beaa5e83667ecd2b`. These pre-document values become historical once the tracked documents are staged; the exact final staged snapshot remains pending in the ignored SDD receipt. Latest-head PR checks and reviews remain pending. Merge remains separately authorized, and no candidate deletion, provider mutation, merge or Phase 5 action occurred.

## 2026-09-11 — Hosted review round 23

- Hosted review round 22 is now historical supporting evidence; hosted review round 23 is the current Phase 4 receipt. Five valid latest-head findings were repaired: exact `.d.ts`, `.d.mts` and `.d.cts` files classify as generated/type-input uncertainty without widening to ordinary or lookalike sources; CSS `url(...)` evidence uses escape-aware tokenization/decoding with exact raw offsets; a proven environment object on a `for...in` right-hand side records one unbounded whole-environment uncertainty; defaulted process-object aliases in identifier and binding-element patterns inherit proven provenance while retaining TDZ, shadow and invalidation boundaries; and the round 22 receipt now has its own project-log heading. Independent hardening covered complete CSS identifier decoding, non-ASCII prefixes, at-keyword/hash-token and dimension-token boundaries, raw NUL replacement, URL whitespace preprocessing and raw offsets; array and catch binding defaults; and conditional, logical, assignment, logical-assignment and comma-expression `for...in` result provenance. Stage 1 ultimately returned SPEC PASS and iterative quality review ultimately returned QUALITY PASS. Cleanup passed 182/182, repository audit 21/21 and the combined focused run 203/203; the full suite recorded 4,401 total, 4,398 passed, 3 host-dependent skips and zero failures; typecheck passed; lint passed with only the informational Babel greater-than-500-KB note; and diff/source-cap checks passed. Nonblank caps were CSS helper 211, asset evidence 444, environment evidence 499, environment patterns 111, environment scope 152 and dead code 139. Pre-document staged audits each ran twice with exit 0, empty standard error, byte-identical output, shared inventory and `deletionAuthority: false`: dead code 1,578/211 (`6c3fb5ce9ffb974d7903bbc0b463e5ffba45a6b36be28891fea908b91b4b9269`), dependency 2,872/21 (`a5f2a2dc8089984b8186d25fbea5f7e80eec9027ac3cd0645db56fa7cd99463d`), asset 557/11,510 (`e90d29669bb91913b77a1a422376f1f2416b7ff5e0f7f355ca6cdca306f821ad`) and environment 587/252 (`d7f8e34534a05bc096c263768821b1ede2de9c4d565c706b93a5bed7a70ec775`). Inventory contained 1,930 files, 47,805,304 Git blob bytes, inventory SHA-256 `fb2258c19f5c8fe2649e5368db1b029e85e7dfe0e4a139e3ea520c61b42783ba`, CRLF output SHA-256 `3d9a205a6ede27c170f94f5c154bdb064ba835515c8d1510a602ceafccffa56a` and zero forbidden paths; brand remained zero missing/zero unclassified with output SHA-256 `50a8f6f48d60f51c00edfd2b0a5005289e007e9939f18862beaa5e83667ecd2b`. These pre-document values become historical once the tracked documents are staged; the exact final staged snapshot remains pending in the ignored SDD receipt. Latest-head hosted checks and reviews remain pending. Merge remains separately authorized, and no candidate deletion, provider mutation, merge or Phase 5 action occurred.

## 2026-09-11 — Hosted review round 24

- Hosted review round 23 is now historical supporting evidence; hosted review round 24 is historical. Five validated hosted findings were repaired: scope-safe loader provenance across plain assignments; exact or conservative environment `in` evidence; semantic CommonMark reference-definition asset ownership; full malformed CSS `url(...)` recovery masking; and root-or-nested `generated/` path classification. Successive review hardening covered loader execution regions and binding legality, evaluation-time environment joins, CommonMark label/title/container/lazy-continuation/HTML-block semantics, and CSS recovery boundaries. Quality review ultimately returned PASS with 34 focused Round 24 checks. The full suite recorded 4,434 total, 4,431 passed, 3 host-dependent skips and zero failures; typecheck, lint and build passed. Lint emitted only the informational Babel greater-than-500-KB note; the build skipped its production migration gate outside Vercel Production, generated 115 static pages, and retained the existing Anatomime poll-shedder initialization notice. Pre-document staged commands each ran twice with exit 0, empty stderr, byte-identical output, shared inventory and `deletionAuthority: false`: dead code 1,584/211 (`b65ebdc62722c5b15c4fa48e49f9e9e50189f027f333e1ad1aaa9980764895b3`), dependency 2,873/21 (`75e280f7a660eb2dbbeca004e75a4f0e1a767307dd7e8035391bf0b7fa0dcbee`), asset 557/11,630 (`10ac976ea6b661b0784bde6c5466f56cc6b1f6952b0fb21693ad3ba5504af1b1`) and environment 587/252 (`a1479454e1d7a56218cbd5cb72f173b2fd45a0b3d0026a95448a580b827b43ed`). Inventory contained 1,932 files, 47,888,742 Git blob bytes, inventory SHA-256 `467f98da77b03130be36c7e9203940dcc75bc4ed8b8e2c4aad8035aedee02076`, CRLF output SHA-256 `189751af76d128a4b07faf215c8a5d795810d3b1c737e4215e3d26e6bb68bf17` and zero forbidden paths; brand remained zero missing/zero unclassified (`50a8f6f48d60f51c00edfd2b0a5005289e007e9939f18862beaa5e83667ecd2b`). These values became historical after document staging. Round 24 head `889ab55` is already pushed; later hosted follow-up is recorded in the current round, merge remains separately authorized, and no candidate deletion, provider mutation, merge or Phase 5 action occurred.

## 2026-09-13 — Round 27 integrated closeout awaiting final-index proof

- The staged candidate repairs finally-aware break/continue state, anonymous default function declarations, captured/default environment provenance, and BigInt zero spellings. Independent specification review found a reciprocal provenance case; the repair passed scoped re-review, and full-candidate quality review passed. The Code quality timeout changes from 12 to 20 minutes because the previous hosted job was cancelled during unit tests, not because an assertion failed.
- Fresh coordinator verification passed: focused audit/browser-harness tests 386/386; full tests 4,552 total, 4,549 passed, 3 expected skips, zero failures; Prisma validate/generate, typecheck, lint, build (115 pages), and cached diff check. Twice-identical pre-document audit receipts remain historical after documentation staging; final exact identity belongs in the ignored handoff. Ordinary brand audit was zero missing/unclassified. Generated candidates A/B had 26,380 identical entries, unchanged source/categories, and zero occurrence deltas; only LF versus Windows CRLF serialization differed from the checked-out baseline.
- Pushed PR #3 head remains `ce337648fc9b99a8b9724214ab8c961120d40afc`. After staging bounded docs/test changes, the coordinator regenerates and reviews any actual occurrence deltas, updates/stages the baseline if required, and compares generated bytes with the staged Git blob rather than CRLF worktree bytes. Final index-sensitive audits, commit/push, and latest-head hosted checks/CodeRabbit follow. Merge remains separately authorized. No candidate deletion, product-runtime, provider, lockfile, dependency, or Phase 5 action occurred; every cleanup report retains `deletionAuthority: false`.

## 2026-09-12 — Hosted review round 26 integrated fix wave accepted (historical)

- Integrated review first returned CHANGES REQUIRED for compound-assignment callable/provenance, sloppy CommonJS Annex-B block-function ownership, getter-before-setter destructuring evidence, and five documentation/index-status contradictions. All four findings were addressed; re-review returned SPEC PASS / QUALITY APPROVED with 58/58 focused checks.
- Only plain `=` preserves RHS callable/provenance; all 12 arithmetic/bitwise compounds avoid false exact evidence while logical assignments remain supported. Sloppy `.cjs` Annex-B outer callable binding is retained, with strict `.cjs`/`.mjs` block scope preserved. A getter survives its paired setter, with later data/getter definitions replacing it in source order. Full cleanup passed 324/324, the source-cap maximum was 480 nonblank lines, and environment evidence remained 559 findings/5,751 uncertainties with `deletionAuthority: false` (291 confirmed static reads, not 5,751 confirmed reads).
- The final repository suite initially failed only on the stale project-state date bound. A one-line ceiling change in `tests/family-friends-server-workload.test.mjs`, `2026-09-11` to `2026-09-12`, passed focused 1/1 and file 15/15 checks and independent PASS review. The authoritative final `npm run test` exited 0 with 4,543 total, 4,540 passed, 3 expected skips, zero failures, 365 suites and 785,574.5335 ms; no OOM occurred.
- Typecheck, lint and build passed on the same production code before the one-line test-date edit. Build generated 115 static pages with only standard informational notes. No deletion, provider mutation, product-runtime change or Phase 5 action occurred.
- These five documentation records are included in the proposed commit. Commit, push and latest-head hosted review remain pending; pushed PR head remains `9c6550f`. Existing audit hashes are historical because code/test/docs changed afterward. The final post-fix staged audit identity is pending the coordinator rerun and will be recorded only in the ignored SDD/current handoff. Merge remains separately authorized.

## 2026-09-12 — Hosted review round 26 before integrated fixes (historical)

The following preserves the earlier checkpoint; its test totals, index status
and audit hashes are historical, not the current integrated-fix receipt above.

- Round 26 accepted the audit-only repairs for class-static-block `var` ownership, completion-state compaction that prevents recursive-finally OOM, mixed process/CommonJS-loader provenance, mixed whole-environment value forwarding, and exhausted deferred-invocation scope isolation. The changes preserve conservative uncertainty rather than creating exact evidence. No candidate deletion, provider mutation, product-runtime change, merge or Phase 5 action occurred; every cleanup report retains `deletionAuthority: false`.
- Final current-code verification passed: 4,540 tests total, 4,537 passed, 3 expected skips, zero failed, 554,265.5792 ms and no OOM. Typecheck, lint and build passed; 115 static pages were generated. The Babel greater-than-500-KB and Anatomime poll-shedder messages were informational only.
- The accepted PRE-DOCUMENT staged-index commands ran twice with exit 0, empty stderr, valid byte-identical JSON and identical raw/CRLF-normalized hashes. Inventory: 1,947 files, 48,145,340 bytes, zero forbidden paths, identity `06d007d1caeee21ab8b7ed9b7a4d6fe9c41f5e6fa0a274587675d607f92019a3`, 1,627-byte stdout, SHA-256 `de29376b2ca6352baae3a19733e9f9d84c12d3c2daf10039f2dddb2707b14391`. Brand: 189 bytes, SHA-256 `fd1b776fe062af1215ef24b18f14fab558f9c13265f4f1d78aa483d74d361c84`, zero missing/unclassified, totals compatibility 22,905, historical 1,481, legal 42 and pre-rebrand public copy 1,952.
- Cleanup reports: dead code 292,753 bytes, SHA-256 `86cb4b040755dfc70b15c90958b94903827f37f27f723d2059294810deaf8a5a`, 1,629 findings/211 uncertainties; dependency 852,950 bytes, SHA-256 `6a0ac92a3ab4679f19fcfd6392169de69840fff76b8510cff0fc47e4169ba01c`, 2,886/21; asset 3,789,218 bytes, SHA-256 `2e2d4e1670f24c6cad1399f72fe0a97c8e3ba5b19f7cce202d92b868f4ca4402`, 557/11,630; environment 2,282,003 bytes, SHA-256 `b1017d716e8be2161559f3eb287b1cd4e02e868c05443fba0988c47c570e433c`, 559/5,751.
- Environment acceptance distinguishes 291 confirmed static reads (within 559 findings: 79 declarations, 189 missing declarations and zero unread candidates) from 5,751 uncertainties: 94 computed and 5,657 unproven. The latter comprise 3,608 call-expansion-budget receipts, 2,017 property accesses, 17 element accesses and 15 spreads, split runtime 2,852, tests 2,118 and tools 687. Analysis is limited to 128 expansions per outer invocation and 64 nested levels; above 32 outcomes, environment-only compaction joins matching completion kinds and target identities. Immediate exhaustion retains conservative widening, while exhausted deferred inspection is isolated. All 15 formerly exact sites are accounted for: seven by site-specific uncertainty and eight by containing budget receipts. The 120/130/200-uncalled-arrow probes retained exact reads without ordinary-object uncertainty, with 0/3/73 budget receipts. Accumulated controls passed 111/111, the cleanup file 321/321 and independent final acceptance checks 7/7. These uncertainties are bounded conservative evidence, not confirmed reads or exhaustive coverage.
- These measurements become historical when the tracked documentation is staged. Exact post-document staged hashes remain for the ignored SDD/current handoff. Round 26 code is accepted locally; documentation is updated and staged. Coordinator code fixes, final verification, commit, push and latest-head hosted review remain pending. Pushed PR head remains `9c6550f`.

## 2026-09-12 — Hosted review round 25 (historical)

- Round 24 head `889ab55` is pushed and now historical supporting evidence; round 25 is the current staged, pre-push Phase 4 audit-only receipt. Four valid hosted findings were repaired: conditional and loop environment assignments join every normal-reaching path; deferred function-body alias writes are analyzed without mutating declaration-time outer state; branch joins retain possible CommonJS-loader provenance; and loop assignment/incrementor proof includes every reaching `continue` path. Two findings were rejected without behavior changes: Markdown inline/fenced-code destinations intentionally remain hash-only uncertainty, and CSS bad-URL recovery already follows CSS Syntax 4.3.15, where comments are not special and the first unescaped `)` terminates bad-URL remnants. Independent SPEC and QUALITY reviews passed. The accumulated focused Round 25 suite passed 46/46; the full suite recorded 4,480 total, 4,477 passed, 3 host-dependent skips and zero failures; typecheck, lint and the 115-route build passed, with the Babel greater-than-500-KB and existing Anatomime poll-shedder notices informational. Diff/source checks passed and maintained sources stayed at or below 499 nonblank lines. Pre-document staged commands ran twice with exit 0, empty stderr, byte-identical output, shared inventory SHA-256 `e5228c0739194704755eabbce0896b0c6dd490c5421c64827e6ad9aff492436a` and `deletionAuthority: false`: dead 1,608/211 (raw `f15f7817bb2a2eed9fcd8af86cfea6853bdc40691dace3c2a1a71739353425f9`, CRLF `e12412da7923f04f772ce28bdc622e3a87a9cc257d5d8078b55f8e0ed3f5808c`), dependency 2,879/21 (raw `ca5113c8ab5f8dc8b4cc6955f4660378f78f89acf4e505841e10b38fd08140d4`, CRLF `6c6d5d7d4f5b70cfbdc1be2d526921b4b56a49e6a0fe868ea66de0f6679c1176`), asset 557/11,630 (raw `e5b1c9293a0eff98647bde6b111af82332a034abad2194e5797cd355b6dfbae0`, CRLF `e9f5046ba4a65fe271e31621e25e3604fd3cc1c8aca5b40d4b87c3e900067b52`) and environment 587/252 (raw `8a57296a932ac5066605b77b404c9a9c530dec1951d58e41ced946b138c7f0d3`, CRLF `2f7ab1fd70ca723b8ffa328fdc7c7ec0c6359d5fabe15d89da58c8e4364d0196`). Inventory was 1,940 files/48,002,713 bytes, raw output `f808ed400b25234f19c32bec5fa967a2ac741ee258df741b9b5589a41b0c5d07`, CRLF `1e71bdb69781109c5e33420f550575994d42a5b6e3feb7e3b334fe1e5eeb5763`, forbidden 0; brand was zero missing/zero unclassified (raw `fd1b776fe062af1215ef24b18f14fab558f9c13265f4f1d78aa483d74d361c84`, CRLF `50a8f6f48d60f51c00edfd2b0a5005289e007e9939f18862beaa5e83667ecd2b`). These pre-document values become historical after staging; exact final staged identity remains in the ignored SDD handoff. Round 25 is staged for verification but not committed or pushed. Latest-head hosted follow-up remains pending; merge remains separately authorized. No candidate deletion, provider mutation, merge or Phase 5 action occurred.
