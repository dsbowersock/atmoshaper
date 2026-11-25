# AtmoShaper Android native core Stage 1 preview

The Android launcher opens Kotlin/Compose Home with Music, Clock & timer,
Wellness, My Calendar, Study & play and Practice tools. The development preview
includes the native Clock and timer, breathing guide, Music and Downloads.
**Open previous tools** opens the existing installed experience, including its
saved work, additional audio and connected links.

Install the candidate as an update to the same package with the same signer.
Native Home uses the existing APK wordmark and two static weights converted
from the website's Inter Latin subset. The corresponding SIL Open Font License
ships in the existing `fonts/inter/OFL.txt` assets. The six launcher icons
adapt their matching Lucide vectors from the website Home. Home reads no app or browser
records. The Java host keeps its app-content origin, browser-owned account
session, tool links and offline-background authorization return.

## Previous tools

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
If a verified saved station sample fails decoding during playback, Downloads
marks those bytes for repair and checks that sample before publishing a retry.

Playback uses verified decoded samples with the actual generator packages and
the existing ambient scheduler/crossfade policies. A missing saved pack may load
into temporary playback memory when online; only Downloads persists a pack.
Damaged saved bytes or failed storage reads never silently fall back to network.
Tool navigation retains the audio owner. Clock imports earlier preferences and
timer deadlines read-only into a separate atomic snapshot; a failed initial read
cannot overwrite saved state. Access receipts retain their existing namespace.
Native Music uses one foreground media service for station playback and the
supported Atmosphere sounds. The native mixer includes Boiling Water, Heavy
Rain and generated white, pink and brown noise. Additional ambient sounds are
available in Previous Tools. The catalog shows unavailable engines explicitly.
Android notification permission controls timer alerts while the screen is
away. Android can delay timer alarms when precise-alarm access is unavailable.
An expired timer accepts a matching background callback for up to 30 seconds
after the deadline, then recovers silently. The timer reconciles its saved
deadline after reboot and music awaits Play.

## Background access

All enabled renderers, fonts and the two unchanged globe textures ship in the
APK. Three backgrounds are free: Lava Lamp, In Transition (static gradient) and
Solid Color. Paid use follows the same `premium_backgrounds`/active-ownership
contract as the website; a cached plan name cannot unlock anything.

The native Clock picker applies the verified access decision to selection,
rendering and customization. When access ends it uses a safe background and
keeps the saved style and selected ID. **Open previous background tools**
provides the existing account approval, refresh and forget actions.

Account verification uses the normal website in the browser-owned app window. Its explicit account
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
assets, rejects server/auth/test imports, lints and assembles the app and its
separate instrumentation APK. The app artifact is
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

`npm run test:native-website-android` verifies the normal APK on the fixed
synthetic `AtmoShaper_WebParity_35` emulator at serial 5582. For the breathing
and backgrounds pilot, set `ATMOSHAPER_ANDROID_WEBSITE_FIXTURE=pilot-87-92` to
select the fixed `AtmoShaper_Pilot_87_92_API35` emulator at serial 5594. The
test requires its fixture marker before resetting either synthetic installation.
Set `ATMOSHAPER_ANDROID_WEBSITE_FIXTURE=stage-1` on the same guarded Android 35
fixture for the combined signed upgrade through the retained pilot APK, native
Downloads readiness and non-silent native station output across breathing and
timer. The [Stage 1 acceptance record](../../docs/audits/2026-11-24-native-android-stage-1-acceptance.md)
records exact build, device and review coverage.
It upgrades the prior accepted APK, opens native Home in airplane mode and continues to the previous
tools. It compares actual packaged assets, retained download byte digests,
settings and a synthetic planner draft, and checks the retained deadline across
native breathing, fullscreen Back and Android's PDF dialog. For the saved
station, it verifies advancing Web Audio time and scheduling of non-silent
source buffers while native breathing is open. Android CI builds
and lints the candidate and runs native Home instrumentation on a fresh
emulator.
The older Android test commands delegate to this guard. They never target the
owner-receipt emulator 5580 or a physical phone. Evidence stays under ignored
output. No real user/clinical/payment data belongs in those tests.

The first upgrade baseline is the retained, owner-accepted version 0.3.0 installer
from the [completed offline release](../../docs/audits/2026-11-22-offline-android-publication.md),
not a newly built copy. This linked-worktree test resolves it at
`../../output/android/AtmoShaper-offline-preview-0.3.0-8abbb7c3.apk` relative to
the repository root. Its required SHA-256 is
`8abbb7c366aa75d03f207428e19bafa0f673fff104d7e34c92dc3500ff43af4a`.
The second baseline is the retained version 0.4.2 installer,
`AtmoShaper-shared-website-preview-0.4.2-8f603319.apk`, in the same directory.
Its required SHA-256 is
`8f603319474beaf5650d278d1ce802e93eee37a8fd8d731536614607d0264da2`.
On a fresh checkout, obtain both retained installers from the owner and put
them at those exact paths before running the opt-in Android check. The fixture
creates a draft using version 0.4.2 before applying the native Home update.
Ordinary browser tests build their own fixtures and do not need these APKs.

Actual S24 upgrade, speaker audibility, battery/OS behavior and browser origin
validation remain separate acceptance. Connected pages still require networking;
there is no automatic merge of device-local offline planner drafts into website
storage. Native Stripe/Square payment collection remains future work. No app-store
or website/provider publication is implied. See the [implementation plan](../../docs/superpowers/plans/2026-11-22-android-website-parity.md)
and [prepared publication plan](../../docs/superpowers/plans/2026-11-22-android-website-parity-publication.md).
