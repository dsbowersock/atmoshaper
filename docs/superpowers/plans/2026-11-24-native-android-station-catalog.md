# Native Android station catalog

[Issue #90](https://github.com/dsbowersock/atmoshaper/issues/90) builds on
the [Aisatsana service proof](2026-11-24-native-android-aisatsana.md) in
Stage 1 of [issue #82](https://github.com/dsbowersock/atmoshaper/issues/82).

1. Package the website station descriptors with their original IDs, order,
   fields and credits. Record native playback availability next to each
   descriptor. The current catalog contains 57 Generative.fm pieces and the
   legacy Tone proof Drone. Drone remains searchable with its credits and a
   visible explanation that its engine is unavailable in the native player.
2. Choose a station in Compose through **Search stations**, inspect its
   **Credits**, and press **Play**. The search field is exposed as
   `native_station_query` to installed-app automation. Selecting a station
   leaves the current station audible until Play confirms the replacement.
3. Run Generative.fm pieces through the existing service-owned audio document
   and shared mixer. The foreground service validates the selected ID and
   uses the catalog title and artist in the Android media session. A new Play
   invalidates the previous request, cancels its sample preparation and
   clears its station graph without replacing the mixer. Stop invalidates
   pending station work. Stale replies cannot publish Playing or Failed.
4. Give a verified saved pack priority. Otherwise fetch the index and manifest
   first and stream the requested Opus samples one at a time. Deduplicate
   concurrent reads. Keep decoded buffers in the player and release raw
   bytes from the request cache once they settle. A canceled checksum or
   network response cannot supply bytes to another station request.

## Verification

- Run `node --test tests/native-station-catalog.test.mjs tests/native-station-sample-source.test.mjs tests/offline-media.test.mjs`.
  This covers full descriptor parity, unsupported-engine visibility at the
  packaging seam, metadata-first sample reads, deduplication, and cancellation
  during an online sample or saved-pack read.
- Run `NativeMusicJourneyTest` in the installed Android fixture. Search for
  **Little Bells**, inspect its existing author and license, and expect a
  disabled Play control with an explanation after selecting **Drone**.
- Build the development APK, then run `npm run test:android-station-catalog`
  on the guarded pilot emulator. The harness checks audible Aisatsana and
  Little Bells in one mixer and verifies that the app has a started Android
  audio track. It records device startup observations, the exact APK digest
  and any public media requests in `output/native-aisatsana-android/station-catalog.json`.
  Use an installation without a Little Bells download to observe its online
  index and manifest arriving before sample requests. A saved pack is a
  separate playback path.

Installed results, exact-range reviews and physical S24 acceptance must be
recorded against the corresponding candidate.
