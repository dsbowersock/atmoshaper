# Native Android Atmosphere mixing

[Issue #89](https://github.com/dsbowersock/atmoshaper/issues/89) extends the [Aisatsana playback lifetime proof](2026-11-24-native-android-aisatsana.md). The native Music screen exposes Boiling Water, Heavy Rain, and white, pink, and brown noise. The service uses the processed intro and loop artifact, a buffered regional recording, and the generated noise graph respectively.

1. Keep a single foreground playback service, media session, audio context, and mixer. Compose attaches to service-published layer state. A new user request identifies the sound and a fresh revision. Stop cancels that request and the corresponding graph. Stop all also releases the foreground service and audio focus.
2. Follow Android audio focus at the shared output. Manual Pause and Stop clear any automatic resume. Transient loss suspends the audio context. Reattachment reads layer state, including volume, without creating a new graph. A failed layer leaves other layers playing.
3. Read verified ambient packs from the existing download store when available. Connected Play verifies the published recordings into memory using their catalog hashes. Generated noise makes no media request. Use the existing explicit download flow for saved packs and preserve its storage schema, media identities, and credits.
4. Verify native controls with `NativeAtmosphereMixJourneyTest` on the guarded Stage 1 emulator. Confirm the generated and ambient paths with a live output waveform and an Android audio player in the app process. Exercise per-layer volume and Stop, navigation, screen lock, Recents dismissal, transient focus interruption, and Activity reattachment. Use airplane mode for generated noise and a verified saved ambient pack. Record fixture and artifact evidence separately from physical-device checks.

## Ambient scheduler boundary

On the guarded API 35 emulator, Boiling Water produced a waveform and a started Android audio track. Two generated layers played in airplane mode with the same audio document, and the remaining layer kept producing sound after an independent Stop, screen lock, and Pause/Resume.

Heavy Rain's original sequence uses HTML media elements. The emulator showed Chromium's `AudioFocusDelegate` acquiring Android audio focus from the service when the element began playing. The element advanced with decoded media while the service's shared audio context suspended and its output became silent.

The native correction decodes Heavy Rain's single verified Opus recording once per play request. It shares the existing reviewed region chooser and queues one transition ahead on the service's audio clock. Each transition has a 10-second linear overlap. Suspending the shared context retains both the playback offset and fade position. Other ambient sequences remain available in Previous Tools.

## Heavy Rain installed proof

The guarded API 35 emulator ran the APK built from `0ed7662` with SHA-256
`efd70746cafdd48a65720860482a917ec99f85df3755f6e5a1e8724e1c0abe37`.
Android build and lint passed, and the preview signer matched the previous APK.
The real Opus decode reported 143.413375 seconds. Connected Play requested the
published Opus file once. An explicit download in Previous Tools reported
**Ready offline**. After a cold airplane-mode launch, the service played that
pack from local storage with zero Opus requests.

The service retained Android audio focus and an active app audio track through
an isolated Heavy Rain crossfade with the display asleep. The mixer measured
98 nonzero waveform samples through the connected overlap and 91 through the
offline overlap. In the connected run, the same audio document continued
through Recents dismissal and Music reattachment. Pause froze the audio clock,
Resume restored output, and Stop released the renderer. The separate offline
Recents check was inconclusive because the launcher displayed two AtmoShaper
cards with the same label after the download. The post-sync source passed 14
native website contracts and seven focused regional, ambient, and station tests.
Physical Galaxy S24 Ultra and multi-source ambient sequence acceptance remain
open.
