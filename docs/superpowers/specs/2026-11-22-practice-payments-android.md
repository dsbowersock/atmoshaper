# Practice payments and the Android app

Status: owner-requested implementation, November 22, 2026. Source preparation
does not activate providers, change subscriptions, accept financial agreements,
move clinical data, publish an app, or authorize real payments.

## Accepted product direction

- Support Stripe and Square, optional for each business using practice tools.
- Support payment at an appointment, full prepayment, deposits, and optional
  card-on-file cancellation/no-show protection.
- The therapist reviews the applicable fee and can charge or waive it. Changing
  an appointment status never itself initiates payment.
- Phone Tap to Pay is a main goal; external readers follow. The first physical
  test device is the owner's expected Samsung Galaxy S24 Ultra, Android.
- Build an Android version of AtmoShaper with its broader toolset, rather than
  a payment-only companion. Share the web experience where capabilities allow.
- The pilot belongs to the owner's own contractor business using a separate
  Stripe merchant account. The salon continues independently with its own
  Square account and is not enrolled in AtmoShaper or this pilot.
- Include new-merchant onboarding now, alongside connecting an existing account.

## Business ownership and money

An individual remains the login identity. A business/practice workspace owns a
payment connection, customer/payment-method references, location, policies and
financial records. Being a member of two workspaces never lets one workspace
use the other's card or payment account. No platform-wide shared card wallet.

The therapist's business is the seller and recipient. Checkout, policy consent,
receipts and statement identity must consistently name that business. Appointment
revenue goes to its processor balance/bank, not through AtmoShaper's balance.
Existing AtmoShaper subscription/support/background billing is unchanged.

Stripe: direct charges; new merchant accounts use Accounts v2 with merchant
card-payments capability, full Dashboard, Stripe collecting processing fees and
connected-account losses. Provider-owned onboarding collects financial identity
and banking data. No application fees in this initial version. Existing-account
connection compatibility must be verified; do not invent a v2 OAuth migration or
silently replace an existing merchant account.

Square: seller-authorized OAuth, explicit verified seller/location, separate
encrypted tokens and lifecycle. A new seller first completes Square's own account
setup and then authorizes AtmoShaper. Return from signup/OAuth alone is not proof
that payments are enabled. Never connect the salon account for the owner pilot.

## Booking and payment rules

- No payment requirement, card to reserve, deposit, and full prepayment are
  distinct policies. Payment processing remains optional for scheduling.
- A deposit is an actual payment credited against the appointment balance.
  Monetary calculations use integer cents and integer basis points.
- Card saving uses processor-hosted fields and explicit consent for its stated
  purposes. Keep versioned policy/amount/timing acceptance per business and
  booking. A stored reference is neither a cash deposit nor reserved funds.
- A cancellation/no-show review uses the accepted policy snapshot, not today's
  edited policy. Check status, cutoff/grace time, consent, account scope, prior
  payments and previous fee attempts. Already-paid amounts cover the fee before
  any additional charge. Excess prepayments require separate refund review.
- Authorized staff must inspect the amount, payee and reason and explicitly
  confirm or waive. Fees cannot exceed the client's accepted limit. Booking
  status, payment status, refunds and disputes are independent.
- A saved-card charge can decline or require authentication. Provide a client
  recovery flow; do not label the booking paid before verified provider success.
- Persist one operation/idempotency key before dispatch. Pending/ambiguous
  outcomes retain their original operation and block replacement attempts until
  reconciled. Verify signed provider events and re-read authoritative state.
- Store only needed operational financial references. Raw PAN/CVC, bank details,
  clinical notes, body maps, diagnoses and journal/ROM content never enter these
  records, provider metadata, callback URLs, logs or analytics.

## Shared Android/web architecture

Subsequent owner clarification: core app use must work offline, including Clock,
backgrounds and as many tools as practical. The browser-backed launcher below is
an initial prototype, not the final architecture. Deliver a locally bundled
shared core and complete downloaded assets with explicit online boundaries.
Follow the [offline plan](../plans/2026-11-22-offline-android-core.md); the current
APK has not implemented or verified that requirement.

Start with an Android browser-backed application shell (Trusted Web Activity)
and native payment activities. This reuses the actual responsive web UI and its
browser authentication/storage, instead of maintaining a second full React UI or
putting Google login into an unsupported embedded WebView. The host app cannot
read browser cookies/local storage. Native financial actions therefore need a
separately designed authenticated, short-lived, one-use server handoff.

The Android app is the whole AtmoShaper launcher: music, Clock, Wellness,
Calendar, study/play and practice tools. Web features follow the deployed source;
native SDK changes require a new APK. Native acceptance includes audio/focus,
background behavior, notifications, fullscreen, offline recovery and navigation.
Do not claim complete native parity from a launcher test alone.

Account-backed settings and authorized scheduling follow their existing server
ownership rules. Device-only clinical/Wellness records stay device-only. Browser
storage may be shared by a chosen browser/profile on the same device, but is not
cross-device sync; never promise migration or upload from installing the app.

Tap to Pay uses Stripe Terminal or Square Mobile Payments SDK native screens.
NFC support alone is not eligibility: SDK, OS/security patch, hardware, country,
network and merchant readiness must pass. The S24 is a target, not a verified
device. Older phones are not fallback payment devices without current checks.

Use verified HTTPS app links and origin/signing association before trusted
fullscreen/financial handoff. Development fallback may show browser controls.
Untrusted links cannot supply a merchant, amount, payment method, callback or
claim of payment success. Native callbacks are hints; the server verifies the
original operation. No raw credentials or reusable secret is placed in a URI.

## New-account experience

Payments setup asks which business receives money, then Stripe or Square, then
"Connect an account" or "I need an account". Explain processing fees separately
from AtmoShaper access. The provider collects verification, banking and required
agreements. Return to a clear pending/ready/restricted status, with resumable
setup and ordinary scheduling still available when payments are off.

## Source references checked November 22

- [Stripe SaaS](https://docs.stripe.com/connect/saas)
- [Stripe account responsibilities](https://docs.stripe.com/connect/accounts-v2/connected-account-configuration)
- [Stripe saved payment authorization](https://docs.stripe.com/payments/save-and-reuse)
- [Stripe authorization holds](https://docs.stripe.com/payments/place-a-hold-on-a-payment-method)
- [Stripe Android Tap to Pay](https://docs.stripe.com/terminal/payments/setup-reader/tap-to-pay?platform=android)
- [Square OAuth](https://developer.squareup.com/docs/oauth-api/overview)
- [Square stored cards](https://developer.squareup.com/docs/cards-api/overview)
- [Square Android Tap to Pay](https://developer.squareup.com/docs/mobile-payments-sdk/android/tap-to-pay)
- [Chrome Android application architecture](https://developer.chrome.com/docs/android/trusted-web-activity)
- [Android Browser Helper releases](https://github.com/GoogleChrome/android-browser-helper/releases)
- [Android Gradle Plugin 8.13 requirements](https://developer.android.com/build/releases/agp-8-13-0-release-notes)
- [Android backup and device-transfer rules](https://developer.android.com/identity/data/autobackup)

The account-specific Stripe planning guide was completed read-only. It is design
evidence, not provider activation or proof of operational readiness.
