# Native Android Stage 1 S24 acceptance index

Physical acceptance for [#94](https://github.com/dsbowersock/atmoshaper/issues/94)
passed on November 25, 2026. The Galaxy S24 Ultra ran Android 17. The signed
development preview updated in place from version code 8 to 11.

- Reviewed source: `b418d0ed935d67aa9b3f76d2939b507bee8faf9a`
- Tested APK SHA-256: `2e2f592a6dbf93cce90aeaa387c67309777b7f68084c546990f6655a551fd2e5`
- [Owner and wireless debugging results](https://github.com/dsbowersock/atmoshaper/issues/94#issuecomment-7173700239)
- [Merged Stage 1 PR #136](https://github.com/dsbowersock/atmoshaper/pull/136) and [#94 closeout](https://github.com/dsbowersock/atmoshaper/issues/94#issuecomment-7174266851)

| Check | Recorded result |
| --- | --- |
| In-place update and Clock | Planner draft fingerprint, offline Little Bells, and Clock choices carried over. The Lava Lamp appeared darker with the same colors. Fullscreen and Back worked twice. Breathing opened while the timer kept counting down. The selected background and visible locked choices were confirmed on the phone. |
| Offline audio | After cold offline launches, Little Bells and saved Boiling Water played in Airplane mode with Wi-Fi off. Pink noise also worked offline. Little Bells continued through screen lock, Home, and Recents dismissal. Pause, resume, and stop worked. Stopping Boiling Water silenced the mix and cleared its notification. |
| Incoming calls | Little Bells went silent during the first answered call and resumed on hang-up. Stopping playback during a second call kept it silent after hang-up. |
| Timer and restart | The timer chimed in the foreground with notifications off. With notifications and precise alerts enabled, the locked completion alert became audible after raising notification volume. Ending the timer from the notification canceled it. An unexpired timer recovered after reboot. A timer that expired during shutdown showed the missed-alert message without a late sound. |
| Restart with audio active | After reboot the owner heard silence for 30 seconds. Android showed no preview player, media session, or playback service before the app was reopened. |
| Launch, navigation, and audio startup | Android reported median cold launch of 411 ms and same-process return of 43 ms across five runs each. Median wireless screen probes were 759 ms into Clock and 614 ms back to Home, including capture overhead. Android first reported a started player 598 ms after the Little Bells command, and the owner confirmed audible playback. |
| Playback battery | Battery went from 79% to 77% in 30 minutes unplugged with the screen locked and Wi-Fi on. Playback was active at every sample. This was a single whole-device observation. |

The [software acceptance audit](2026-11-24-native-android-stage-1-acceptance.md)
records the release-variant emulator measurements and the synthetic receipt
checks. Keep raw device receipts with the local test artifacts. The posted
owner and wireless debugging results above are the shareable evidence.
