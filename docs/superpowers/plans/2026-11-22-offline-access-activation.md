# Prepared offline access activation and owner APK handoff

Status: owner approved November 22, 2026. The first upload failed with no new
settings. The separately approved one-key recovery succeeds; all three new
Production settings are verified and the original 87 remain unchanged. The
reviewed PR/build/publication/owner-check stages are in progress, not complete.
See the [recovery amendment](2026-11-22-offline-activation-recovery.md) and
[activation receipt](../../audits/2026-11-22-offline-access-activation.md).
Application candidate: `194e385`, plus receipt-only documentation closeout.
The owner selected verified subscription paid-through dates and non-expiring
active individual ownership. Local verification and the three source review
transitions are complete; see the
[verification receipt](../../audits/2026-11-22-offline-audio-backgrounds.md).
One supported minor older-preview migration issue is retained: a retry can wait
behind a still-blocked v1 opening until the old connection closes. First installs
use v2 directly and the current Android flows pass. This limitation is disclosed
in this proposed scope; no zero-issue review or completed fix is claimed.

## Exact proposed authorization

1. Freshly verify the current project/branch/review state, Production deployment,
   existing environment-setting metadata and rollback artifact. Stop on unknown
   drift or unresolved substantive review/check failures. No paid credits.
2. Generate one dedicated P-256 key pair for background capabilities. Keep the
   private key out of Git, chat, logs, environment files and generated artifacts.
   Use an isolated in-memory process for its provider upload. Bundle/commit only
   its matching public JWK and public key ID in the existing native verifier file.
   This expected key-binding amendment is part of the proposed approval; it does
   not authorize other application logic changes or additional authorities.
3. Add only the following settings to the existing project's Production target:
   `ATMOSHAPER_OFFLINE_ACCESS_PRIVATE_KEY`,
   `ATMOSHAPER_OFFLINE_ACCESS_KEY_ID`,
   `ATMOSHAPER_OFFLINE_ACCESS_ENABLED=true`.
   Preserve all unrelated Production settings and all Preview/Development
   settings. If these names unexpectedly exist, stop rather than overwrite an
   unknown key. Do not replace session, Stripe, Sentry, Ably or database secrets.
4. Create one review/release PR for this branch, including the expected public
   key binding; require actual Codex/CodeRabbit application-source coverage and
   hosted checks. Binary texture evidence is the exact publisher source, MIT
   notice and committed/build hash comparison, not a claim of text-bot pixel review.
5. Build the approved web source with existing Production/Sentry settings;
   verify the source maps and staged entry/account routes, then promote that same
   verified artifact once, retaining the prior release for one rollback. No
   public app-store enrollment or native release signing is proposed.
6. Build the matching normal debug APK; verify its public key, no synthetic
   authority, signature/assets and actual emulator offline audio/core checks.
   The normal APK is the owner-only S24 test artifact, not a general store release.
7. Verify unauthenticated/foreign-origin issuer failures. With the owner's
   existing AtmoShaper session and explicit browser approval, mint one minimal
   backgrounds-only receipt for the task emulator's pending challenge. Verify
   signature, install binding, authoritative access and offline continuation;
   do not copy browser cookies/passwords/session tokens into the native origin.
   Private sign-in remains the owner's action if needed. No purchase, refund,
   subscription, calendar, email, clinical or account-preference write is included.

The proposed operation has a fresh 120-minute window after approval/preflight.
Do not retry ambiguous provider effects, replace the key, change source logic,
buy reviews/services or broaden targets under this plan. Record final public
source/build identities and non-secret verification facts only.

## Explicit limits

This does not finish whole-platform native parity, payment collection, reliable
screen-off/background audio, closed-app timer alarms, physical S24 sound/battery
acceptance, or public native distribution. Existing local clinical records stay
in their current browser/device storage; no migration/upload is proposed.

Offline revocation cannot be instantaneous. The existing verified capability
remains usable while disconnected; a fresh authoritative receipt replaces it
when the owner verifies online. Individually owned access has no scheduled
expiry, while refund/revocation reconciliation still applies on refresh.
