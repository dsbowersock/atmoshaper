# Native Android downloads

Issue [#91](https://github.com/dsbowersock/atmoshaper/issues/91) delivers the
explicit download journey from the native Android specification in
[#82](https://github.com/dsbowersock/atmoshaper/issues/82).

## User journey

1. Open Music, then Downloads. Search by station or sound and select a result.
2. The detail checks the saved bytes on the device. Download makes the complete
   pack request. The transfer shows byte progress and can be cancelled before
   publication. A failed save offers retry or a new storage check.
3. Ready offline appears after verified readback. Play saved audio starts the
   selected station or supported Atmosphere sound through the app's existing
   audio service. Stop also uses that service.
4. A damaged pack shows repair copy. An explicit successful retry atomically
   replaces it. An interrupted repair leaves existing data available for
   inspection and retry.

The native list uses the station player's support decision and the mixer's
supported ambient IDs. Previous Tools retains access to the broader Atmosphere
sound catalog, the older download controls and existing packs. Generated noise
requires no download. Closing Downloads leaves the audio service running.

## Storage and transport

The storage document is bundled on the established app-assets origin. It reads
and writes the shared `atmoshaper.android.media.v1` pack store through
`lib/offline-media.js`. The existing store migration creates the metadata
index for earlier APKs in place. Download does not move or transform existing
records. The same v1 version, file hashes, descriptor revision, ID and byte
count are verified by the Downloads and playback paths.

A native download request accepts a known public catalog ID. It fetches only
the published public media paths, with bounded bytes and a cancellation scope.
The existing strict IndexedDB transaction exposes the complete pack and
metadata together. The packaged document reports catalog titles and status to
Compose without transferring media bytes or account or practice state. An
ordinary Music Play may fetch temporary bytes if the saved pack is missing.
Play saved audio requires local verified bytes even if the device is connected.

## Verification

- Run `npm run test:native-downloads` for the in-process download contract.
  The installed case is opt-in and targets only the named and marked synthetic
  pilot emulator with the exact locally built APK.
- Run that installed case with `ATMOSHAPER_NATIVE_DOWNLOADS_ANDROID_TEST=1`
  to exercise the native catalog, interrupted transfer, cancellation,
  atomic storage failure, damage detection, repair, offline cold launch and
  an audible saved render. Its original-row guard protects prior downloads.
- Run the Stage 1 guarded upgrade journey separately to demonstrate both
  byte-identical retained packs and their native use after an earlier APK
  installation. Physical-device and hosted-review gates are separate.
