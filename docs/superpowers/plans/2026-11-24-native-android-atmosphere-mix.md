# Native Android Atmosphere mixing

[Issue #89](https://github.com/dsbowersock/atmoshaper/issues/89) extends the [Aisatsana playback lifetime proof](2026-11-24-native-android-aisatsana.md). The native Music screen exposes Boiling Water and white, pink, and brown noise. These use the existing processed intro and loop artifact and the generated noise graph.

1. Keep a single foreground playback service, media session, audio context, and mixer. Compose attaches to service-published layer state. A new user request identifies the sound and a fresh revision. Stop cancels that request and the corresponding graph. Stop all also releases the foreground service and audio focus.
2. Follow Android audio focus at the shared output. Manual Pause and Stop clear any automatic resume. Transient loss suspends the audio context. Reattachment reads layer state, including volume, without creating a new graph. A failed layer leaves other layers playing.
3. Read verified ambient packs from the existing download store when available. Connected Play verifies the published recordings into memory using their catalog hashes. Generated noise makes no media request. Use the existing explicit download flow for saved packs and preserve its storage schema, media identities, and credits.
4. Verify native controls with `NativeAtmosphereMixJourneyTest` on the guarded Stage 1 emulator. Confirm the generated and ambient paths with a live output waveform and an Android audio player in the app process. Exercise per-layer volume and Stop, navigation, screen lock, Recents dismissal, transient focus interruption, and Activity reattachment. Use airplane mode for generated noise and a verified saved ambient pack. Record fixture and artifact evidence separately from physical-device checks.

## Ambient scheduler boundary

On the guarded API 35 emulator, Boiling Water produced a waveform and a started Android audio track. Two generated layers played in airplane mode with the same audio document, and the remaining layer kept producing sound after an independent Stop, screen lock, and Pause/Resume.

Heavy Rain's existing sequence uses HTML media elements. The emulator showed Chromium's `AudioFocusDelegate` acquiring Android audio focus from the service when the element began playing. The element advanced with decoded media while the service's shared audio context suspended and its output became silent. The native player rejects this family before constructing a voice. The existing catalog, pack identities, and Previous Tools playback remain available.

Before exposing this ambient family in the service, supply buffer-backed voices to the existing scheduler. Retain catalog-selected sources, reviewed regions, fades and cadence, and schedule against the service's audio clock so a suspended context retains its position. Verify continuous regional transitions and a representative multi-source sequence, both online and from verified packs, while the native service remains the Android focus owner.
