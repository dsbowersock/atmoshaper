# AtmoShaper Android foundation

This is the whole-platform Android launcher, not a separate payment-only app.
Google's Android Browser Helper opens the current AtmoShaper web interface using
the device's compatible browser. It does not fork the web tools or extract the
browser's cookies/local records. Same-account hosted data follows existing
authorization; device-only records do not become cloud-synced.

**Readiness:** native Stripe/Square SDKs, financial handoff, reciprocal website
association, release signing, physical device acceptance and distribution are
separate unfinished gates. The launcher alone does not enable Tap to Pay.
The debug app may show browser controls until the signing/domain association is
published with approval. Do not disable origin verification to simulate success.

## Local build

Run `npm run android:doctor` from the repository root. The local tooling uses
Microsoft OpenJDK 17, Android platform 36/build-tools 35.0.0, Gradle 8.13 and
pinned Android Gradle Plugin 8.13.2. Tools/caches/debug signing data belong under
ignored `output/android-tools`, with no global PATH or existing SDK changes.
Official tool downloads and Android SDK license acceptance require the owner's
requested decision when the tools are absent.

`npm run android:build` runs Android lint and assembles a debug APK, then copies
it to `output/android/AtmoShaper-preview.apk`. It does not install it, enroll in
Google Play, publish association files, or change the website. The development
package is separate from a future release package, and uses only debug signing.

## Acceptance still required

The November 22 local build passes Android lint and creates the debug APK.
Official `apksigner` verifies the packaged signature. This verifies a build,
not phone behavior. Native backup/transfer exclusions apply to the host app's
own files only; browser-owned website storage retains its existing controls.

- Actual S24 installation, browser/Google sign-in, navigation, process restore,
  music/focus/background controls, Clock fullscreen, downloads and offline paths.
- Existing local-vault/browser-profile behavior, no cross-device upload, and
  account changes retaining all owner/privacy boundaries.
- Stripe/Square native SDK capability checks and separately approved sandbox
  device flows, followed by a capped owner-only pilot with his own merchant.
- Origin association with the intended signing certificate; release key backup,
  Play policies (including existing digital memberships/background purchases),
  privacy disclosures and signing/store publication review before distribution.
  Physical appointment payments and digital platform purchases are distinct.

Android implementation references are recorded in the parent specification.
