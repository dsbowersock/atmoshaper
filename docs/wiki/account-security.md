# Account security

This page owns the current account-method and two-factor authentication (2FA)
rules in the AtmoShaper repository. It describes the implementation; deployment
status belongs to [project state](../project-state.md). Existing runtime copy and
private security identifiers remain unchanged until their separately reviewed
migration gates.

## Identity and sign-in methods

One normalized email identifies one user. Normalization trims and lowercases the
email; the database's `User_normalized_email_key` enforces uniqueness through
`lower(btrim("email"))` for non-null emails. Google accounts and password
credentials attach to that user and remain independently usable sign-in methods.
Matching a verified Google email to an existing user requires explicit linking;
it does not silently attach Google or create a duplicate user. Provider ownership
and normalized-email conflicts fail closed.

The owners are [normalized-email resolution](../../lib/normalized-user-email.ts),
the [concurrent index migration](../../prisma/migrations/20260828121000_identity_normalized_email_index/migration.sql),
[Google intent decisions](../../lib/auth-method-intents.ts),
[Auth.js integration](../../auth.ts), and the
[schema](../../prisma/schema.prisma). Automatic dangerous email linking must
remain absent.

Every method mutation requires explicit confirmation. The
[method service](../../lib/account-security-methods.ts) applies this proof matrix:

| Change | Required proof and remaining-method rule |
| --- | --- |
| Link Google to an existing account | Same-browser verified Google `SIGN_IN_OR_LINK` intent in `PROVIDER_PROVEN` state, then a fresh Credentials sign-in for the matching user, including 2FA when enabled. The password-authenticated session claim must be finite, not future-dated, and at most five minutes old. Confirmation rechecks the current normalized email against the provider email hash and rejects an already-owned provider identity. |
| Add a password | Cookie-bound `ADD_PASSWORD` Google reauthentication for the current user and the exact still-linked Google identity. The route resolves this proof before password hashing; the service rechecks and consumes it in the mutation transaction. Verified-email password recovery has its separate consumption owner below. |
| Change a password | Current password and applicable current 2FA proof through the shared password-proof service, followed by a transaction-time check of the proved session version. |
| Remove Google | Current password and applicable current 2FA proof; a password credential must remain. All Google account rows are removed, with the delete count checked before reporting Google disabled. |
| Remove a password | Fresh `REMOVE_PASSWORD` Google reauthentication; the exact proven Google account must still belong to the user and remain usable. Last-method removal is rejected. |

Password/2FA verification and password hashing run outside the short credential
mutation transaction. The [password-proof owner](../../lib/auth-method-proof.ts)
consumes a login or method-change backup code during that proof step; this is
distinct from the deferred current-factor consumption used for destructive 2FA
management below. The later method mutation rechecks current state and the
proved session version where direct password proof is required.

## Private intents and one-use proof

Each owned Google entry starts a ten-minute `AuthMethodIntent` after the Google
intent rate-limit check. Its opaque binding lives in the `ml-auth-method-binding`
cookie: HttpOnly, SameSite=Lax, Path=/, Max-Age=600, and Secure in production.
Persistence stores a domain-separated HMAC of the binding token. Server routes
resolve the cookie against the exact purpose, status, target, and expiration;
client-supplied intent IDs or return-state query parameters cannot authorize a
change.

Google reauthentication verifies the current session, normalized email, and
already-linked provider identity, then records a `CONSUMED` intent with a provider
proof timestamp. The [fresh-proof owner](../../lib/auth-method-intent-proof.ts)
requires that timestamp to be between zero and five minutes old and the intent
to remain unexpired. Consumption compares the exact user, purpose, provider,
provider account, proof timestamp, and expiration in an `updateMany`
compare-and-set (CAS). Exactly one winner clears `providerProvenAt`; status stays
`CONSUMED`, and later replay fails. When this consumption shares a transaction
with a mutation, rollback restores the proof too.

Matching-account linking has its own one-use transition from `PROVIDER_PROVEN`
to `CONSUMED`, committed with the Google account and security-notice intent. The
[confirmation route](../../app/api/account/security/google/link/confirm/route.ts)
owns the cookie and fresh Credentials-session boundary.

## Two-factor management

The [2FA management service](../../lib/account-two-factor-management.ts) owns
setup, enablement, disablement, and backup-code regeneration. Each operation
requires exact `confirmed: true`; a signed-in session alone is insufficient.

| Operation | Current proof contract |
| --- | --- |
| Start enrollment | An existing password credential is required. Password-only users prove that password; users with both methods may choose password or fresh linked-Google `ENROLL_TWO_FACTOR` proof. Google-only users must add a password first. Enabled state rejects setup before proof, generation, or writes. |
| Enable | The signed, unexpired enrollment cookie must match the user, session version, and exact pending secret row; a valid TOTP from the newly issued secret is also required. A pending row without this binding cannot be enabled. |
| Disable | Fresh primary proof plus an independent current TOTP or unused backup code. Google primary proof must have purpose `DISABLE_TWO_FACTOR`. |
| Regenerate backup codes | Fresh primary proof plus an independent current TOTP or unused backup code. Google primary proof must have purpose `REGENERATE_TWO_FACTOR_BACKUP_CODES`. |

For disablement and regeneration, password-only accounts use password plus the
current factor. Linked accounts may choose password or linked Google plus the
current factor. Existing enabled Google-only legacy accounts remain manageable
with Google plus the current factor. Enabled state with no usable primary method
rejects self-service; lost-factor and inconsistent-account recovery remain with
the [full-Admin security controls](admin-user-operations.md#security-remediation-controls).

The three 2FA Google purposes are separate, action-specific schema values. A proof
for one action cannot authorize another. The retained historical plan's
`LINK_GOOGLE` carrier recipe is superseded; do not reuse it for 2FA management.

The [enrollment-binding owner](../../lib/two-factor-enrollment-binding.ts) signs a
five-minute snapshot of user, session version, secret-row identity, update time,
and secret-row fingerprint. The `ml-two-factor-enrollment` cookie is HttpOnly,
SameSite=Strict, Secure in production, and scoped to `/api/account/security/totp`.
It contains no TOTP secret. Fresh proved setup may replace only the exact disabled
pending row, invalidating its previous binding. Invalid-code or rate-limited
enable attempts retain a still-valid binding for retry; successful or invalidated
enrollment clears it.

Destructive management prepares current-factor proof outside the mutation
transaction through [auth-two-factor-proof.ts](../../lib/auth-two-factor-proof.ts).
The transaction reloads and compares method identities, session version, the exact
enabled secret, and any Google proof. It consumes the prepared current-factor
proof and optional Google proof, applies the state change, increments
`authSessionVersion` exactly once, and deletes compatibility `Session` rows as
one unit. Used backup codes, replaced secrets, changed methods or versions, and
lost CAS races reject the operation. A transaction failure rolls back all these
effects. Concurrent operations permit one committed winner.

Enablement likewise commits its pending-row CAS, eight prehashed backup codes,
one session-version increment, and compatibility-session deletion together.
Regeneration replaces the entire eight-code set while preserving the enabled
secret; disablement removes the secret and backup codes. Setup alone does not
revoke sessions. Expensive proof and code hashing stay outside the bounded
[serializable transaction owner](../../lib/commerce/transactions.ts).

The [request boundary](../../lib/account-security-request.ts) and
[2FA route boundary](../../lib/account-two-factor-route-boundary.ts) enforce
trusted same-origin JSON requests, bounded exact-key bodies, private no-store
responses, allowlisted failure codes, and bounded `Retry-After` values. The
[2FA panel](../../app/account/security/two-factor-management-panel.tsx) owns proof
selection, recovery, backup-code acknowledgment, and re-sign-in presentation.

## Sessions, recovery, and security notices

`User.authSessionVersion` is the canonical JWT invalidation owner. Password
change, password removal, and Google removal increment it in their method
mutation transaction. Linking Google and adding a password do not rotate it.
The method service does not delete adapter `Session` rows; 2FA enablement,
disablement, regeneration, and password-reset consumption include that cleanup
in their own transactions. Auth.js rejects an old version on the next successful
database-backed refresh. Deleted adapter rows are never an active-JWT count or
an exact count of users signed out. See
[Admin session semantics](admin-user-operations.md#jwt-session-invalidation).

[Password-reset consumption](../../lib/password-reset-confirmation.ts) atomically
changes the credential, consumes all outstanding reset links for that account,
increments the session version once, removes compatibility sessions, and queues
one `PASSWORD_RECOVERED` notice. Self-service and Admin-requested reset links use
this same boundary. Consumption does not create a second Admin evidence bundle;
Admin request-time evidence and recovery authority remain with
[Admin user operations](admin-user-operations.md).

Method changes queue their durable security notice in the credential transaction.
The [security-email owner](../../lib/account-security-email-intents.ts) delivers
after commit using an intent claim, five-minute lease, and CAS result recording.
Delivery failure does not undo the credential change; ambiguous provider
acceptance can produce a duplicate on retry, so delivery is at-least-once.
Current 2FA management does not queue these account-method notices.

## Verification and operating boundaries

The focused regression owners are
[intent proof](../../tests/auth-method-intent-proof.test.mjs),
[2FA management](../../tests/account-two-factor-management.test.mjs),
[account methods](../../tests/account-security-methods.test.mjs), and
[schema/migration contracts](../../tests/auth-schema-migration.test.mjs).
They cover proof mismatch/replay, rollback, concurrency, last-method protection,
session revocation, and persistence/documentation contracts. Route, enrollment,
current-factor, and UI tests provide adjacent coverage; a local test pass is not
evidence of a live provider flow or deployment.

Use [deployment](deployment.md#identity-membership-schema-and-writer-rollout)
for collision/index recovery, migration/writer rollout, OAuth configuration,
and separately authorized security-mail retries. Use the
[release checklist](release-checklist.md#identity-and-account-method-gate) and its
[password-reset gate](release-checklist.md#password-reset-integrity-gate) for
acceptance. Their inherited provider receipts remain historical evidence until
current authority and exact-target verification establish otherwise.

Keep credentials, OAuth tokens, submitted codes, secret material, binding values,
provider identifiers, raw email/network identifiers, and private rows out of
URLs, local/session storage, routine logs, and release evidence. Setup secrets
and newly issued backup codes belong only in their authorized private UI flow.
This documentation does not authorize database/provider writes, real OAuth or
email activity, deployment, or a runtime/legal rebrand.

## Historical sources

The retained [identity safety plan](../superpowers/plans/2026-08-28-identity-account-method-safety.md)
and [2FA hardening plan](../superpowers/plans/2026-08-29-2fa-management-hardening.md)
record implementation history, including superseded recipes. Current rules are
owned here and by the linked implementation/tests. Immutable originals remain
in the locked MassageLab source:
[identity safety](https://github.com/dsbowersock/massagelab/blob/e74045c2fc85c2cb4df176fdb1aff2137c4d9848/docs/superpowers/plans/2026-08-28-identity-account-method-safety.md)
and [2FA hardening](https://github.com/dsbowersock/massagelab/blob/e74045c2fc85c2cb4df176fdb1aff2137c4d9848/docs/superpowers/plans/2026-08-29-2fa-management-hardening.md).
