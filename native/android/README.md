# AtmoShaper Android shared-website preview

The debug app reuses the actual website Home, sidebar/main bar, Clock/timer,
breathing, Music and all six business planner screens. All 84 enabled backgrounds
and the code for all 57 Generative.fm stations are packaged. Individual stations
and the 51 reviewed Atmosphere sound categories have explicit download controls.
White/pink/brown noise needs no download. Core launch and saved playback work
without a connection; online Play can load temporary verified audio without saving.

Connected account, calendar, practice, Wellness and study pages use the actual
website in a browser-owned Trusted Web Activity, inside the app. The public app
association/navigation integration is prepared locally and not yet published.
Actual origin validation and connected journeys remain acceptance gates. No
browser-origin or certificate check is bypassed, and no website account cookie,
token or clinical vault is copied into the local WebView. Online Home/planner
pages retain their ordinary website session/storage; offline planner drafts are
explicitly device-local. See the [current parity receipt](../../docs/audits/2026-11-22-android-website-parity.md).

## Local content and downloads

The packaged entry is fixed to Android's reserved local app-content asset origin. Only
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

Playback uses verified decoded samples with the actual generator packages and
the existing ambient scheduler/crossfade policies. A missing saved pack may load
into temporary playback memory when online; only Downloads persists a pack.
Damaged saved bytes or failed storage reads never silently fall back to network.
Tool navigation retains the audio owner. Clock imports earlier preferences and
timer deadlines read-only into a separate atomic snapshot; a failed initial read
cannot overwrite saved state. Access receipts retain their existing namespace.
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

The approved public authority is bundled, and its three Production-only signing
settings are configured. Website issuance and one real owner receipt check are
complete for the earlier release; see the [publication record](../../docs/audits/2026-11-22-offline-android-publication.md).
Do not repeat the completed key setup. The matching public JWK alone is bundled.
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
`npm run test:native-website-browser` builds its own isolated shared-screen tree.
Set `ATMOSHAPER_OFFLINE_REAL_MEDIA_TEST=1` to include actual public online Play
and downloaded playback after an offline restart.

`npm run test:native-website-android` verifies the normal APK on only the fixed
synthetic `AtmoShaper_WebParity_35` emulator at serial 5582. It requires its own
fixture marker before resetting that synthetic installation, upgrades the prior
accepted APK, compares actual packaged assets and tests airplane-mode playback,
preserved downloads/settings/deadline, fullscreen Back and Android's PDF dialog.
The older Android test commands delegate to this guard. They never target the
owner-receipt emulator 5580 or a physical phone. Evidence stays under ignored
output. No real user/clinical/payment data belongs in those tests.

Actual S24 upgrade, speaker audibility, battery/OS behavior and browser origin
validation remain separate acceptance. Connected pages still require networking;
there is no automatic merge of device-local offline planner drafts into website
storage. Native Stripe/Square payment collection remains future work. No app-store
or website/provider publication is implied. See the [implementation plan](../../docs/superpowers/plans/2026-11-22-android-website-parity.md)
and [prepared publication plan](../../docs/superpowers/plans/2026-11-22-android-website-parity-publication.md).
