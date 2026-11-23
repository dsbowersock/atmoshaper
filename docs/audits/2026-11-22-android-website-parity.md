# Android website parity: local review and acceptance

The owner requests the website's Home, navigation and tools inside Android while
preserving offline features, and explicitly chooses the full connected experience
inside the app. Implementation is on `codex/android-website-parity`, based on
`b55c4ab`. The last recorded publication is `5758fcb`. This candidate is not
published; fresh live-state preflight remains required.

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
allowance. Subsequent completed passes use the correct hosted remote identity.

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

CodeRabbit completes the grouped `856adbf..4de2927` correction review across all
21 changed paths. Four issues receive these dispositions:

| Follow-up issue | Disposition |
| --- | --- |
| Document request ID lost after a second Activity recreation | Supported; preserve any positive pending ID independently of whether PDF bytes survived. The result callback remains responsible for clearing it. |
| Online pack might require a persisted readback | Refuted: `downloadOfflinePack` returns the complete pack after `put`; the memory store returns those exact bytes directly for verification. Real online ambient playback passes with no saved record. |
| Stopped temporary ambient loading lacks ownership | Supported; pass the mixer's existing `isCurrent` callback through the ambient port. Further requests and stale handoff stop when the layer is removed. Existing ownership/controller and native-source checks pass. |
| Saved stations might require a network-first lookup | Refuted: the first lookup reads the saved store and returns it before checking online state. Unit checks and actual offline restart/playback pass without network. |

Codex confirms these dispositions against source and actual execution. CodeRabbit
completes `4de2927..5f66407` across all seven changed paths. Its one major-labeled
question asks whether a cancelled ambient rejection can fail a replacement. Both
preview and recipe rejection handlers check their operation lease before changing
state, so this is refuted. A controlled same-ID stop/restart test releases the old
rejection after the replacement is playing and confirms it stays playing. The
39-case source/controller boundary set passes. The final fixture/revert review
completes with zero issues. Actual APK acceptance and the later fixture-only
review are also complete, as recorded below.

Completed receipts match Git's complete changed-file lists for every range:

| Base to head | Reviewed text paths | Explicit binary exclusions | Issues |
| --- | ---: | ---: | ---: |
| `b55c4ab..856adbf` | 68 | 7 licensed font binaries | 8 |
| `856adbf..4de2927` | 21 | 0 | 4 |
| `4de2927..5f66407` | 7 | 0 | 1 refuted question |
| `5f66407..a9ddca1` | 5 | 0 | 0 |
| `a9ddca1..a2a24e1` | 1 | 0 | 1 refuted question |

There is no application-file coverage gap through `a9ddca1`. A later request for
the Android fixture interactions returns `rate_limit`, with a 17-minute free CLI
wait. That failed request is not counted. After the wait, the existing CLI
completes coverage through `a2a24e1`. Its question asks whether the old app could
overwrite the seeded shared Music favorite. The old app uses `OfflineAudio`, not
the website Music provider, and never reads/writes that preference key. The
complete real upgrade run also reaches the favorite and plays it offline, so the
concern is refuted. No source rewrite follows. No seat, billing, key or provider
change bypasses the limit. Current-head hosted checks remain publication gates.

The same correction group includes two findings from actual APK inspection:
retain the timer display stage for an imported running timer reached through the
single Clock & timer entry, and restore a hidden native fullscreen view before
waiting for document callbacks. Acceptance uses genuine Chromium touch events;
its desktop mouse auto-scroll and fullscreen-transition acknowledgement were
unreliable on this Android WebView. State/visibility/fullscreen postconditions
remain mandatory. Browser fixtures now build their own isolated asset tree, so
a fresh CI checkout needs no Android SDK and concurrent APK output cannot race it.

Native window/focus inspection identifies Android's first-use immersive-mode
tutorial as the consumer of Back, rather than the application's fullscreen
handler. Its exact system window has focus and its native hierarchy contains
"Viewing full screen" and "Got it". The test acknowledges only that tutorial
on its synthetic emulator before checking Back. Speculative extra fullscreen
ports/overlay callbacks are removed; the earlier reviewed handler is retained.
No system setting, browser-origin check or owner device is changed. The temporary
loopback debugger used to confirm callback state is detached and removed.
The final actual APK case confirms fullscreen entry and Back after that normal
system tutorial, without a native fullscreen state bridge or origin bypass.

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
- The final normal APK passes Android lint/build, v2 signature verification and
  the complete fixed-emulator upgrade case (one pass, zero failures/skips). It
  upgrades the prior accepted version 3 without uninstalling. Both downloads,
  original settings, device/receipt identity and running deadline survive; actual
  saved music plays in airplane mode across shared breathing. Fullscreen/Back,
  download readiness and the actual Android PDF dialog/cancel all pass. No
  unexpected script error or offline media request is recorded. Stop only the
  exact task-created emulator afterward; the owner-receipt emulator, other
  emulators and physical phone are untouched.

The frozen application is `a9ddca1d7d7cd5d6bbcc2741c5ed739107b42b5b`; the corrected
fixture is reviewed at `a2a24e1`. The normal APK's SHA-256 is
`af74682094ff6b0b8786ebc7e01d19fc9f68d29dd1db4eabe78ad61929259ea8`.
Its existing signing certificate is retained. The complete acceptance receipt is
checked at `2026-11-23T06:53:48.550Z`; normal bundle inventory reports 188 files,
26,752,904 bytes, shared website entry and no synthetic receipt authority. The
distinct matching handoff file is
`output/android/AtmoShaper-shared-website-preview-0.4.0-af746820.apk`. Keep the
previous accepted installer. Documentation-only closeout does not rebuild or
change this APK.

The full regression run completes with 5,929 passes, 15 failures and seven
optional skips. All failures are inert fixture imports after adding the no-DOM
native navigation component and separating the safe calendar contract from the
server loader. The corrected main-landmark fixture passes all seven cases; the
calendar/provider fixture rerun passes all 23 cases. The three additional native
online-source tests pass. No application behavior is weakened to satisfy those
fixtures. Final grouped review and Android acceptance are complete; fresh
current-head hosted checks remain publication gates.

The proposed app-origin association is source-only. It names the existing preview
package and actual public signing fingerprint. Browser origin verification,
connected account/calendar/practice journeys and physical S24 acceptance remain
required. No origin/certificate check is bypassed. Closed-app alarms and reliable
screen-off audio remain separate native lifecycle work, as in the earlier preview.
No deployment, provider setting, database write, payment, email or account/legal
acceptance is performed under this local implementation request.
