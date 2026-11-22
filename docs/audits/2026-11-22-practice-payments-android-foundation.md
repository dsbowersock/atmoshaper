# Practice payments and Android foundation verification

Local source milestone, November 22, 2026. Public web source remains `0eb02e0`.
Work is isolated on `codex/practice-payments`, based on that public source plus
its documentation closeout. This is not a release or payment activation receipt.

## Accepted scope and implementation

The owner requests optional Stripe and Square appointment collection, deposits,
prepayment, saved-card no-show protection with explicit fee review, and onboarding
for new merchants. The pilot is the owner's contractor business, not the salon.
The follow-up expands the mobile work to a whole-platform Android application.
See the [specification](../superpowers/specs/2026-11-22-practice-payments-android.md)
and [implementation plan](../superpowers/plans/2026-11-22-practice-payments-android.md).

Pure payment rules now handle integer cents/basis points, booking requirements,
deposit/balance credit, immutable accepted policies, cancellation/grace deadlines,
payment/refund/dispute state and duplicate-operation blocking. Offline request
contracts retain merchant, client, environment, location and original-operation
scope, reject inactive/revoked cards, and give Stripe direct charges to the
connected merchant. They load no credentials and make no requests. They are
not a substitute for the unfinished durable service and its authorization/locks.

A four-step local design preview covers account setup, booking, collection and
fee review. Fictional account readiness and payments are labeled simulations.
Policy edits clear the example consent; accepted bookings lock their facts.
There are no card fields, financial endpoints, active application route, provider
connection, persisted consent or real payment in this preview.

The Android launcher uses Android Browser Helper 2.7.4 and opens the actual web
platform through a compatible browser, without extracting browser credentials or
local records. Untrusted inbound URIs are ignored. No native payment SDK/bridge,
reader permissions or live financial authority is present. Website association
is intentionally unpublished, so browser controls may remain visible. The app
does not certify native audio, offline, login, storage or fullscreen behavior.

## Approved tooling and APK verification

The owner explicitly approves the Android SDK license and isolated official
build tools. Downloaded Microsoft OpenJDK 17.0.21.1, Gradle 8.13 and Android
command-line tools 15859902; each archive's SHA-256 matches its official source.
Install Android platform 36 and build-tools 35.0.0. Gradle additionally installs
the official platform-tools dependency under the same SDK and accepted license.
Tools, caches and the disposable debug key stay under ignored
`output/android-tools`; no global PATH or existing SDK is changed.

`npm run android:doctor` confirms all five prerequisites. `npm run android:build`
runs `lintDebug assembleDebug` using Android Gradle Plugin 8.13.2 and JDK 17.
The packaged app is `com.atmoshaper.app.development`, labeled AtmoShaper Preview,
with minimum Android API 28 and target API 36. The existing approved icon is
copied without alteration. The application declares Internet; AndroidX adds its
own signature-protected non-exported receiver permission. There is no card/NFC,
camera, microphone, contact, storage or location permission in this build.

Native backup and device-transfer rules exclude all app-owned storage domains;
older Android also has `allowBackup` and `fullBackupContent` disabled. These rules
do not control browser-owned website storage or imply cross-device sync. This
follows [Android's documented backup rules](https://developer.android.com/identity/data/autobackup).

The final APK, lint report, signing readback and hashes are recorded locally
under ignored `output/android` and `native/android/app/build/reports`. The APK
uses a disposable debug certificate, not release signing. Physical device
installation, domain association and distribution are still unverified.

Final APK SHA-256:
`503549b24bd68fb49213c64507f7c6aedb21cb71a97a2ba82b0034813e7a877b`.
Signature scheme v2 verifies with one signer. Android lint has zero errors and
one cosmetic `IconLauncherShape` warning for the unchanged square preview icon.
The native storage-extraction warning is resolved by the explicit rules above.
Gradle also reports SDK-metadata/deprecation warnings; the pinned build succeeds.

## Local executable evidence

- `npm run test:practice-payments`: all 20 focused rule/contract tests pass.
  Includes precision, zero/fractional-cent limits, four booking modes, prior
  payment credit, partial refunds, deadline/grace boundaries, changed/revoked/
  foreign consent, foreign cards/ledger rows, duplicate/ambiguous operations,
  processor-owned charges and closed native eligibility gates.
- `npm run test:practice-payments-browser`: one test passes eight real Chromium
  journeys, Stripe/Square at 320, 390, 768 and 1440 pixels. Verifies pending setup,
  fresh consent after edits, locked booking facts, deposit/balance, disabled phone
  acceptance, one explicit example fee, and cleared state on processor changes.
  Phone notice/reset text does not overlap. No JavaScript errors, external
  requests or non-GET requests occur; an explicit POST is refused with 405.
- Final focused ESLint and ordinary full `npm run typecheck` pass. Route type
  generation passes. Prisma client generation needed an outside-sandbox retry
  after a Windows cache-permission error; generation contacts no database.
- Browser screenshots are in `output/practice-payments`. The local review URL
  is `http://127.0.0.1:3034/` via `npm run preview:practice-payments`.

These are isolated source/browser/build checks. No provider sandbox transaction,
physical tap, production account mutation or paid transaction is represented.

## Remaining work

1. Durable business-owned schema, authorization/feature checks, consent history,
   operation locks, provider event reconciliation and credential lifecycle.
2. Actual Stripe/Square account setup and web checkout/saved-card adapters;
   native SDK screens and authenticated one-use server handoff.
3. Separately approved sandbox registrations/settings/migrations, real processor
   test flows and cross-business/retry failure acceptance.
4. Actual S24 installation and platform feature acceptance. Verify the phone
   model/OS/security state through the SDK before claiming Tap to Pay support.
5. Substantive Codex and CodeRabbit reviews through final shipped source,
   signed association/release distribution, legal/payment terms, publication
   approvals, and a separately capped owner-only financial pilot.

No provider setting, existing billing object, merchant account, database schema,
clinical storage, live payment/email or public web deployment changes here.
