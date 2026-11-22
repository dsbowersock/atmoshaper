# AtmoShaper Android offline preview

The debug app bundles Clock, timer, breathing, all 84 enabled backgrounds and the
code for all 57 Generative.fm stations. The 51 reviewed Atmosphere sound categories
and individual stations have explicit download controls. White/pink/brown noise
needs no download. Core launch and saved playback work without a connection.
This is the first native slice of the whole-platform app, not full web parity.

## Local content and downloads

The entry is fixed to Android's reserved local app-content asset origin. Only
packaged GET assets can become pages/scripts. Network permission supports a
separate native HTTP adapter for the existing public audio paths: HTTPS GET,
no redirects, cookies or account credentials. Missing/foreign requests fail
locally. File/content access and mixed content remain disabled. There is no
generic JavaScript interface or browser-cookie/vault extraction.

Download one selected pack explicitly. The complete index/manifest dependency
closure, byte bounds and ambient release checksums are checked before a strict
IndexedDB commit. Station downloads retain local hashes for offline readback.
Partial, failed and cancelled saves do not publish readiness. A separate metadata
store lists downloads without deserializing every audio buffer; schema upgrade
preserves earlier packs. Removal deletes only that pack. Uninstall/clear-data
removes app data. Persistent-storage requests are advisory, not an OS guarantee.

Playback uses local decoded samples with the actual generator packages and the
existing ambient scheduler/crossfade policies. It never falls through to network
for a missing sample. Tool navigation retains the audio owner. Core preferences,
end-time timer arithmetic and access receipts have separate local namespaces.
Foreground rotation retains the WebView/audio context. Background playback,
closed-app timer alarms and native media-service controls remain future work.

## Background access

All enabled renderers, fonts and the two unchanged globe textures ship in the
APK. Three backgrounds are free: Lava Lamp, In Transition (static gradient) and
Solid Color. Paid use follows the same `premium_backgrounds`/active-ownership
contract as the website; a cached plan name cannot unlock anything.

Account verification opens the normal external browser. Its explicit account
approval returns only an ES256 signed backgrounds capability bound to this app
installation and its latest challenge. The app verifies it before saving access.
Subscriptions last through their verified paid-through date (monthly or annual),
not one month from download. Active individual ownership has no scheduled expiry.
A fresh online receipt replaces the entire snapshot, including refunds/revocations.
Offline revocation cannot be immediate. Forget removes the receipt; old async
verification cannot resurrect it. No login/payment token enters the WebView.

The normal verifier-key file is currently empty. Live issuance is not activated.
Its separately approved binding needs a dedicated P-256 private signing key in
Production only, `ATMOSHAPER_OFFLINE_ACCESS_KEY_ID`, and
`ATMOSHAPER_OFFLINE_ACCESS_ENABLED=true`; the matching public JWK alone is bundled.
Do not print/persist the private key in source, logs, receipts or `.env` files.
The current return link targets the development package. Release signing, proper
store association/policies and publication require their own reviewed scope.

## Build and acceptance

Use `npm run android:doctor`, then `npm run android:build`. Existing owner-approved
JDK 17/SDK 36/build-tools 35.0.0/Gradle 8.13 tools and debug signing stay isolated
under ignored `output/android-tools`. The build unconditionally creates normal
assets, rejects server/auth/test imports, lints and assembles
`output/android/AtmoShaper-preview.apk`. Its manifest must report no synthetic
receipt authority. The development package/version is separate from a release.

`npm run test:offline-core` checks timers and denied/late storage recovery.
`npm run test:offline-media` checks pack integrity and signed issuer/access rules.
`npm run test:offline-browsers` explicitly opts into small real public audio
reads, then cuts networking. Its three concurrent suites use separate allowlisted
output directories. Ordinary wildcard tests skip the one live-media acceptance;
core/background acceptance needs no external image download. Exact existing globe
image bytes and publisher MIT notice are committed and checksum-bound.

`npm run check:offline-station-catalog` checks every station's public metadata.
`ATMOSHAPER_ANDROID_OFFLINE_TEST=1` opts into `test:offline-media-android` and
`test:offline-core-android` on the exact empty task-owned emulator only. They
refuse a physical phone/different package, compare actual APK assets and verify
real airplane-mode/process-stop playback and core persistence. Screenshots use
`ATMOSHAPER_OFFLINE_EVIDENCE_DIR` outside Git. No real user/clinical/payment data
belongs in those tests.

Actual S24 installation, speaker audibility, battery/OS behavior and whole-app
features remain separate acceptance. Account tools, Wellness/Calendar/study,
full preference sync and Stripe/Square native payment collection are not yet
part of this local slice. No app-store or website/provider publication is implied.
See the [plan](../../docs/superpowers/plans/2026-11-22-offline-audio-background-access.md)
and [review dispositions](../../docs/audits/2026-11-22-offline-audio-review.md).
