# AtmoShaper provider readiness audit — 2026-09-27

## Purpose and boundary

This receipt records the safe work completed after the whole-site migration
reached Production. It contains only aggregate or configuration-name evidence.
No credential, provider identifier, customer identity, database row, connection
string, or token is recorded.

The audit was read-only except for creating the previously requested one-time
branding follow-up reminder. It did not create, update, cancel, replay, rotate,
deploy, or delete any provider or customer object.

## Verified baseline

- Repository `main` was
  `06cb73035c7695a5f96e19a5ee9274f2e16c1c6a`.
- Strict CI run `36296398216` passed all seven jobs on that exact commit.
- The bounded anatomy repair and public support-contact change are merged.
- Production returned HTTP 200 for home, pricing, support, Privacy, Terms, and
  the anonymous session endpoint. The signed-out session body was `null`.
- Local Prisma generation and schema validation passed on the exact baseline.

## Production configuration inventory

Vercel Production contains the required database, authentication, Google
sign-in, administrator, and SMTP variable names. It does not contain Stripe,
Calendar, Sentry, Ably, or R2 credential variable names. Values were not
recorded. Public media playback remains an already verified compatibility path;
the absence of upload credentials does not by itself indicate a playback fault.

Google sign-in has been exercised successfully on the public origin. Domain
ownership is verified, the OAuth application is in Production, and the uploaded
branding still awaits Google's branding review. A one-time reminder is active
for Sunday, October 4, 2026 at 9:00 AM local time.

SMTP delivery is operational through the verified sending domain. The public
support address uses the dedicated project inbox. Inbound domain-address mail
forwarding remains intentionally deferred.

## Read-only Stripe findings

The authorized live account is the existing business account. It contains:

- three customer records, none marked delinquent;
- one active two-dollar monthly subscription that is not attached to the fresh
  administrator identity;
- one canceled one-dollar monthly subscription;
- three current Supporter amount choices with six active recurring Prices;
- one active default customer-portal configuration; and
- one enabled webhook that still points at the legacy Production endpoint and
  subscribes to the exact fifteen-event application contract.

No Checkout or Portal session was created, no webhook was replayed, and no
catalog, customer, subscription, branding, or account setting was changed.
AtmoShaper Production remains unable to initiate live billing because its Stripe
variables are absent.

## Database verification boundary

The Vercel CLI correctly refused to export four protected Production secrets.
The authenticated Neon CLI still sees only the legacy source project, not the
connected destination resource. Consequently, this audit does not claim a
fresh aggregate count, migration-status readback, or direct inspection of any
Production row. The user-visible Google sign-in proof and valid local schema are
useful evidence, but they do not replace that pending database readback.

The next database action is read-only: repair the Neon account or project scope,
then verify migration status and aggregate counts only. Do not expose row data,
connection strings, or provider identifiers.

## Morning decisions and prepared next steps

1. Decide whether the legacy active two-dollar subscription should remain or be
   canceled at period end. Do not infer cancellation from the fresh-start data
   decision.
2. If billing should continue, retain the current account and compatibility
   metadata, configure test mode first, add a separate AtmoShaper webhook and
   signing secret, prove the exact event contract, then authorize live variables
   and a controlled Checkout/Portal smoke test. Keep the legacy endpoint active
   until reconciliation and rollback gates pass.
3. Calendar requires a separate Google OAuth client with the documented Calendar
   scopes and callback. Preserve the existing generated-calendar summary lookup
   until duplicate-calendar risk is explicitly resolved.
4. Keep realtime in its documented polling-fallback mode until an isolated Ably
   application and key are separately authorized. Sentry and media-provider
   administration are also separate provider decisions.
5. Complete the aggregate-only destination database readback after its Neon
   ownership scope is visible to the authenticated CLI or connector.

## Rollback position

No rollback is required because the audit made no runtime or provider mutation.
The current site, Google sign-in, SMTP delivery, database connection, legacy
webhook, and active subscription were left untouched.
