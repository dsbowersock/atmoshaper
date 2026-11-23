# Android website parity: local review and acceptance

The owner requests the website's Home, navigation and tools inside Android while
preserving offline features, and explicitly chooses the full connected experience
inside the app. Implementation is on `codex/android-website-parity`, based on
`b55c4ab`. The public website remains `5758fcb`; this work is not published.

## Implementation and preservation

The packaged client mounts the actual Home dashboard, navigation model, sidebar,
main bar, Clock/timer, breathing, Music and six planner screens. Native route,
asset, saved-audio and document ports replace platform bindings. Connected pages
use the actual website in a browser-owned Trusted Web Activity; no login cookie,
account token or clinical vault is copied into the local WebView. Online planners
keep their account/browser storage; offline drafts are explicitly device-local.

The application and signing identity, download store and background verification
authority stay unchanged. A separate atomic Clock store imports the earlier
preview read-only. Failed reads block default replacement; serialized strict
writes preserve deadline and adjustment order. The normal bundle excludes server,
authentication implementation and test code, and inventories all packaged bytes.
The seven Inter subsets retain their original bytes and included OFL provenance.

Online Play also works without a prior saved download. It loads the same bounded,
verified public sample pack into playback-owned memory; the Downloads action is
still the only path that persists it. Offline playback requires a complete saved
pack. A damaged pack or failed storage read cannot silently fall back to network.
Temporary station requests check playback ownership before further network reads
and before claiming output. Prewarm does not start a download.

## Review coverage and grouped disposition

Codex inspects the shared-component boundaries, Android entry/intent/document
ports, persistence, signed background access and saved-audio lifecycle. Local
acceptance exposes and corrects a no-WebGL decorative effect crash. Codex also
identifies restored audio readiness and moves document-provider writes off the
UI thread. No production data or real account content is used for this review.

CodeRabbit CLI 0.9.6 completes `b55c4ab..856adbf`: 68 text paths reviewed, seven
font binaries explicitly excluded, eight issues (one major, seven minor). Its
exact-base/head context and completed reviewed-file manifest are retained in the
ignored local receipt. The isolated clone's local source remote is not recognized
as the hosted repository, so this completed initial pass uses its free CLI
allowance. A grouped follow-up will use the correct hosted remote identity.

| Issue | Grouped correction |
| --- | --- |
| Restored timer can silently lack audio readiness | Visible Enable timer sound action, including while Home is visible; unlock preserves deadline. Actual completion regression confirms one two-tone chime. |
| Graphics decision can replace a focused child | Resolve graphics support before mounting interactive descendants; server/client placeholder is consistent and keeps geometry probes measurable. |
| Save can claim success after a failed close | Publish saved only after the output stream closes successfully; write/close/permission failures remain failed. |
| PDF bytes lost during Activity recreation | Preserve pending request metadata and explicitly explain that saving must be retried if Android reclaims the app during the picker. Drafts remain unchanged; no report-content temporary file is introduced. |
| Foreign image/srcSet bindings | Native image port accepts packaged/data images and consumes srcSet; CSP/native network denials remain additional boundaries. |
| Home blank with a query string | Select Home by pathname; cold offline Home query regression. |
| Protocol-relative external link becomes a hash | Use one internal-route predicate for both rendering and interception. Explicit external HTTPS taps open the system browser. |
| Embedded question mark truncates query | Preserve everything after the first question mark. |

Grouped correction review and final APK verification remain in progress. Do not
count the completed initial review as coverage of this later correction delta.

The same correction group includes two findings from actual APK inspection:
retain the timer display stage for an imported running timer reached through the
single Clock & timer entry, and restore a hidden native fullscreen view before
waiting for document callbacks. Acceptance uses genuine Chromium touch events;
its desktop mouse auto-scroll and fullscreen-transition acknowledgement were
unreliable on this Android WebView. State/visibility/fullscreen postconditions
remain mandatory. Browser fixtures now build their own isolated asset tree, so
a fresh CI checkout needs no Android SDK and concurrent APK output cannot race it.

## Completed local evidence and remaining gates

- Responsive shared Home/Clock previews pass phone, tablet and landscape sizes,
  without script errors or failed asset requests.
- Shared-screen offline browser acceptance passes seven cases: Home/navigation/
  tool screens, legacy read-only deadline import, failed-open protection, restored
  sound readiness and one completion chime, real PDF generation with packaged
  fonts, no-WebGL controls, and actual downloaded station plus ambient playback.
- Focused Home/navigation/Clock/audio contracts pass 157 cases; audio delivery
  boundaries pass 76, planner/storage 49, planner report/PDF 13, breathing 26,
  Core/storage 11 and media/access/Transport 15. Counts overlap. Website Home and
  Clock browser regressions also pass, including the 50-case secondary Clock set.
- Earlier-preview compatibility remains an explicitly separate test-only entry;
  both Core browser cases pass. The normal app cannot select that legacy entry.
- An initial normal APK passes Android lint/build and a fresh-emulator upgrade
  from the prior accepted APK. Both downloads, settings, receipt identity and
  running deadline survive; actual saved music plays in airplane mode across
  shared-tool navigation. The owner-receipt emulator and physical phone are not
  cleared or modified. Final corrected APK/fullscreen/document-dialog checks
  are still pending.

The full regression run completes with 5,929 passes, 15 failures and seven
optional skips. All failures are inert fixture imports after adding the no-DOM
native navigation component and separating the safe calendar contract from the
server loader. The corrected main-landmark fixture passes all seven cases; the
calendar/provider fixture rerun passes all 23 cases. The three additional native
online-source tests pass. No application behavior is weakened to satisfy those
fixtures; final grouped review and Android acceptance remain pending.

The proposed app-origin association is source-only. It names the existing preview
package and actual public signing fingerprint. Browser origin verification,
connected account/calendar/practice journeys and physical S24 acceptance remain
required. No origin/certificate check is bypassed. Closed-app alarms and reliable
screen-off audio remain separate native lifecycle work, as in the earlier preview.
No deployment, provider setting, database write, payment, email or account/legal
acceptance is performed under this local implementation request.
