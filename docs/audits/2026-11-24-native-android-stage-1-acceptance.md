# Stage 1 software acceptance checkpoint for #94

The approved source base is `c7991eb9eb4f073456df70c907fc9dbf4ff576b1`. The combined [draft PR #136](https://github.com/dsbowersock/atmoshaper/pull/136) targets `main`. #92 was completed by #135 and serves as the Clock background regression baseline. The local and hosted merge boundaries are recorded in the integration plan. The owner will perform the GitHub merge and the Galaxy S24 Ultra acceptance.

| Scope | Observed result |
| --- | --- |
| #86 timer | Guarded Android 35 emulator. Eight state tests, three Compose journeys and notification denial passed. Android delivered a locked-screen completion and its published End action canceled the current timer. A stale End action preserved the new session. Actual reboot kept a future deadline and rescheduled it without an old cue. An elapsed timer recovered as a missed completion. Android Force stop canceled its pending alarm. Recent-task dismissal and precise-alarm permission revocation require separate checks. |
| #88 Aisatsana | Development APK `5ec349fe0a0ec1bc52b8c1944042dd6e06e5f9443a226b2cf136e4e38f4fff0f`. The same service-owned audio document produced a non-silent waveform and an active Android audio player during breathing, app switching, lock and Recents dismissal. A targeted run reattached to the same document, verified silent Pause, audible resume and renderer release on Stop. A separate installed focus test recovered from transient loss and preserved Stop during interruption. This receipt precedes the synchronized integration build. |
| #89 mixer | Development APK `990a5790488f70e4f8cdc830dcfe2138fe153fde0d80c00b688e81f3b039a700` verified two simultaneous offline noise layers, independent Stop, lock and Pause/Resume. Connected Boiling Water produced a waveform and an active Android audio player. The Heavy Rain correction at APK `efd70746cafdd48a65720860482a917ec99f85df3755f6e5a1e8724e1c0abe37` kept focus with the audio service and produced non-silent output across a complete locked 10-second crossfade, connected and from an explicit saved pack in airplane mode. Connected playback passed Recents dismissal, reattachment, Pause/Resume and Stop. The supplemental offline Recents attempt could not disambiguate the launcher cards. |
| #90 catalog | Development APK `0cf7574b6995c91ab358648965ca8a064521c137d71d44f617fce05bf82c81b4`. The 58-entry picker preserved published station identities and credits. Picker search, credits and Drone's explicit unavailable state passed at 100% and 160% font scales. Aisatsana and Little Bells produced non-silent output and an active Android audio player in the same renderer. Little Bells fetched two metadata files before ten used Opus samples, with observed output after 13.651 seconds. The fixture began with no Little Bells pack. |
| #91 downloads | Combined development APK `effb9c5bc2eee74a8709b89bfc0f9fe9ee88867b7fc41882264861936db6f641` passed Android assembly and lint. The guarded installed run passed four cases. Process stop, in-flight cancellation and injected quota failure published neither pack nor metadata. A corrupt pack blocked readiness and playback, an explicit retry repaired it, and Boiling Water produced a non-silent waveform and active Android audio track after a cold airplane-mode restart. |
| #93 background access | The corrected normal candidate passed Android assembly and lint at APK SHA-256 `43d8e0d9e5da124468657e26afc30f10d1a97e45c0a9ad89c9c6870807b24de6`. A separate synthetic APK upgraded the earlier installation in place, retained the signed local receipt and authored style, and rendered Pegboard pixels after Clock re-entry. A signed empty replacement removed access, the existing approval UI granted a short subscription, and the displayed effect lost access at its signed expiry in the same process. Seven Clock checks passed. An immediate switch before the approval page confirmed the new lease temporarily stayed free-only until re-entry. |
| Hosted Android | Two earlier PR heads lost the hosted emulator during the legacy Home journey after 18 completed tests. Home and the complementary tools job both passed on separate emulators at `f6e6637`. [Android run](https://github.com/dsbowersock/atmoshaper/actions/runs/45541877362) |

Local integration `439c5d0` contains the complete remaining ticket batch.

## Combined build before review corrections

The guarded signed upgrade on APK `effb9c5bc2eee74a8709b89bfc0f9fe9ee88867b7fc41882264861936db6f641` passed version codes 3 → 6 → 10 → 11. It preserved the earlier native Clock appearance, original timer deadline, both saved-pack byte digests and the planner draft. In airplane mode, native Downloads verified the earlier Little Bells pack. The same native audio document produced non-silent output and an active Android audio track in Music, breathing and timer. Clock fullscreen and Back passed on repeated visits.

The Android 35 emulator measured a separate release-variant APK `2ff6a5c4645279ad31c1f670c435c4292c844a48fe5742e3bb6bb9ad69e25537`, signed with the existing debug fixture signer. The foreground renderer ran with the pilot emulator's host graphics mode and Wi-Fi enabled. Initial display uses Android's reported launch time. Clock entry includes ADB and accessibility-hierarchy polling. Aisatsana timing ends when Android first reports a started player. [Android startup measurement](https://developer.android.com/topic/performance/issues/launch-time) · [Android frame and memory diagnostics](https://developer.android.com/tools/dumpsys)

| Sample | Observed result |
| --- | --- |
| Cold Home initial display | 688–1,453 ms, median 1,136 ms across five launches |
| Hot Home return with the same process | 71–129 ms, median 95 ms across five returns |
| Warm Clock entry observed through accessibility | 2,221–2,692 ms, median 2,259 ms across three visits |
| Connected Aisatsana Android player start | 769 ms observed in one launch |
| App-process proportional memory | 39,277 KiB at idle Home and 94,505 KiB while playing |

## Review corrections

The Standards and Spec reviews on `9ec0c7d` identified an interrupted Clock permission handoff, a timer completion race, a prepared station that could start after an interruption, and Downloads failure and stale readiness. Integration `57ae8f5` includes the corrective batch and harmonizes the Android check names with the CI guide. Hosted re-runs, the corrected build's installed journey, and CodeRabbit coverage remain open. Physical S24 timing, long-running battery behavior and speaker audibility remain for owner acceptance.
