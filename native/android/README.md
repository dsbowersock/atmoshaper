# AtmoShaper Android offline core

The current debug app packages Clock, timer, breathing and the three existing
free backgrounds (Lava Lamp, static gradient and solid color). It uses Android's
local asset loader on its reserved app-content origin. It no longer loads the
remote website at startup and declares no Internet permission. Packaged requests
are allowlisted; missing or foreign resources fail locally. There is no generic
JavaScript bridge or access to the browser's cookies/vault.

The app reuses the website's digital clock face/font geometry, breathing view,
timer helpers, procedural gradient renderer, static-gradient rules, buttons and
two-tone synthesized chime. Preferences and timer deadlines use a separate local
IndexedDB store with strict commit acknowledgement and serialized writes. They
are not account sync or clinical-record migration.

This is the first bundled core of the planned whole-platform app. Account-backed
tools, paid-background access, full media downloads, generated stations and native
Stripe/Square payment screens remain future work. See the
[offline plan](../../docs/superpowers/plans/2026-11-22-offline-android-core.md).

## Local build

Run `npm run android:doctor` from the repository root. The local tooling uses
Microsoft OpenJDK 17, Android platform 36/build-tools 35.0.0, Gradle 8.13 and
pinned Android Gradle Plugin 8.13.2. Tools/caches/debug signing data belong under
ignored `output/android-tools`, with no global PATH or existing SDK changes.
Official tool downloads and Android SDK license acceptance require the owner's
requested decision when the tools are absent.

`npm run build:offline-core` builds the actual client components and copies the
unmodified fonts/notice and wordmark into `output/offline-core`. The bundle
manifest records all core file sizes and hashes. No server/auth/test fixture
code is accepted by its dependency check.

`npm run android:build` first rebuilds that core, then runs Android lint and
assembles the debug APK at `output/android/AtmoShaper-preview.apk`. It does not
install on a phone, enroll in Google Play or change the website. The development
package remains separate from a future release package and uses debug signing.

`npm run test:offline-core-browser` verifies fresh local-asset launch with
networking disabled, at phone/landscape/desktop sizes. The opt-in
`test:offline-core-android` additionally requires `ATMOSHAPER_ANDROID_OFFLINE_TEST=1`
and this task's exact empty emulator. It refuses other devices and packages,
verifies actual APK assets, installs/clears only its synthetic app data, and
tests airplane-mode first launch and process-stop recovery. It never targets
the owner's phone. Screenshots can go to `ATMOSHAPER_OFFLINE_EVIDENCE_DIR`.

## Acceptance still required

The November 22 local emulator acceptance and exact artifact are recorded in the
[verification receipt](../../docs/audits/2026-11-22-offline-android-core.md).
Native backup/transfer exclusions apply to app-owned files only. Existing
browser-owned website storage retains its own controls and remains intact.

Timer deadlines and paused state survive acknowledged saves and app restarts.
Sound/flash alerts are currently foreground features; there is no closed-app
alarm/notification service. Test alert can re-enable the local audio context.
The foreground window keeps the screen awake, matching Clock's current default.

- Actual S24 installation, local tool/rotation/lifecycle acceptance and physical
  sound behavior. The current core provides no Google sign-in or station player.
- Existing local-vault/browser-profile behavior, no cross-device upload, and
  account changes retaining all owner/privacy boundaries.
- Stripe/Square native SDK capability checks and separately approved sandbox
  device flows, followed by a capped owner-only pilot with his own merchant.
- Verified web auth/deep-link association where needed; release key backup,
  third-party notices, Play policies (including digital platform purchases),
  privacy disclosures and signing/store publication review before distribution.
  Physical appointment payments and digital platform purchases are distinct.

Android implementation references are recorded in the parent specification.
