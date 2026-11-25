# Native Android Stage 1 integration

The owner approved the remaining Stage 1 batch under [spec #82](https://github.com/dsbowersock/atmoshaper/issues/82), starting from `c7991eb9eb4f073456df70c907fc9dbf4ff576b1` on `main`. [PR #135](https://github.com/dsbowersock/atmoshaper/pull/135) delivered #87 and #92. The baseline [Android workflow](https://github.com/dsbowersock/atmoshaper/actions/runs/45525739225/attempts/2) passed after a retry and [CI](https://github.com/dsbowersock/atmoshaper/actions/runs/45525739278) passed on its first attempt. The integration branch is `codex/native-android-stage1`.

## Live issue graph

GitHub's native issue dependencies and the parent sub-issue list were checked at kickoff. GitHub reported zero open PRs in the repository.

| Ticket | Prerequisites | Integration order |
| --- | --- | --- |
| [#86](https://github.com/dsbowersock/atmoshaper/issues/86) Timer alerts and reboot | #85 completed | First group |
| [#88](https://github.com/dsbowersock/atmoshaper/issues/88) Aisatsana playback | #83 completed | First group, supplies playback ownership |
| [#89](https://github.com/dsbowersock/atmoshaper/issues/89) Atmosphere mixing | #88 | After #88 integrates |
| [#90](https://github.com/dsbowersock/atmoshaper/issues/90) Generative catalog | #88 | After #88 integrates |
| [#91](https://github.com/dsbowersock/atmoshaper/issues/91) Explicit downloads | #89 and #90 | After both integrate |
| [#92](https://github.com/dsbowersock/atmoshaper/issues/92) Offline background rendering | #83 completed | Merged by #135, regression baseline |
| [#93](https://github.com/dsbowersock/atmoshaper/issues/93) Offline background access | #92 completed | First group, follow the [approved access plan](2026-11-24-native-android-93-offline-background-access.md) |
| [#94](https://github.com/dsbowersock/atmoshaper/issues/94) Upgrade and phone acceptance | #86, #87 (completed), #91 and #93 | Integrated evidence, owner completes physical acceptance |

Use a fresh implementer and isolated worktree per open delivery ticket. Synchronize against the integration tip before handing off a ticket and integrate one validated ticket at a time. The merged state on GitHub will follow the owner’s eventual merge. Within this batch, the integration branch establishes whether a dependency is ready for its downstream implementation.

Open one draft PR following the first successful integration and link #82 and #94. Use closing links for delivered #86, #88, #89, #90, #91 and #93. #82 has later stages and #94 includes the owner’s S24 acceptance. Keep #92 as a regression baseline and reference #135.

## Integrated verification for #94

1. Record the exact base, integrated code SHA, APK digest, signer continuity, build variant, Android/AVD version, font scales, graphics settings and run conditions. Build and lint the candidate with the named Android scripts. Keep any synthetic receipt or media fixtures out of the candidate.
2. Retain the existing guarded earlier-install test. Verify the signed in-place update, the original saved-pack byte digests, timer deadline, background/appearance settings, existing receipt and synthetic planner draft. Use the fixed disposable emulator identity and marker before any reset. Verify both earlier packaged and inherited native entry points.
3. In one installed journey, cold-launch Home offline, enter Clock and repeatedly use Close, fullscreen and Back, verify the saved background and timer, start saved audio from native Music, and navigate to breathing and back while it plays. Verify actual audio output and the original timer deadline throughout. Inspect native Downloads, relaunch offline, and verify that the saved pack remains playable. Check access denial and fallback independently with synthetic receipts while preserving the saved selection and appearance.
4. Add OS receipts for permitted and denied timer alerts, reboot and recovery, lock and task dismissal, and audible playback with audio focus loss and recovery. Separate the semantics of force-stop, process loss and powered-off time. Do not infer hardware call behavior from a fixture focus request or sound from notification presence.
5. Measure launch, warm navigation, station start to actual output, and representative process resources on an installable performance build, with the build configuration and limitations recorded. Measure cold and warm conditions separately. Carry any hardware-dependent measurements and prolonged battery observation to the owner's S24 handoff.
6. Run affected web and offline contract suites, installed Android tests and hosted Android/CI. Review the full integrated range with the code-review skill and obtain completed CodeRabbit coverage of the range and corrections. Wait for current-head hosted results and review threads, then mark the combined PR ready when its software gates pass.
7. Link the integrated receipt from the PR’s #94 handoff. The owner retains the merge and physical S24 installation/acceptance. Remove only this batch’s clean implementer worktrees after verifying their commits are integrated and the evidence has been retained.
