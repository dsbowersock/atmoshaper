# Offered account recovery mail check

Status: completed at the approved delivery/link scope; see the
[receipt](../../audits/2026-11-18-account-recovery-mail.md).
The owner approved one recovery email and clarified that the existing account
uses Google sign-in. This approval covers delivery/link inspection only; do not
consume the link or add password sign-in to the Google-linked account.

The public artifact now contains the approved cancellation fix. Existing Google
sign-in, account/settings reads and Calendar consent/sync pass. Those results do
not prove that account recovery mail reaches an inbox from this offered origin.
Provider sender verification and tracking settings are previously recorded.

## Exact proposed boundary

Use the existing signed-in owner's verified Google-account email as the sole
recipient, through the public Forgot password form. Submit Send reset link once,
then allow up to ten minutes for one message. Do not retry automatically. The
source creates a hashed, account-bound recovery token, valid for sixty minutes,
and consumes the normal email rate-limit buckets. It sends no mail for an absent
or unverified account and always gives a neutral public response. The response
alone cannot establish delivery. No new account or legal acceptance is proposed.

With approval, inspect only this newly requested message's subject, sender,
delivery time and SPF/DKIM/DMARC outcome. Keep message IDs, recipient values,
raw headers and token-bearing links in protected ignored storage, never Git or
chat. Confirm the link uses the offered HTTPS public origin without printing
the credential. The owner may open it privately to check the reset form.

Do not enter, change, submit, add or remove a password, unlink Google, sign out
the owner's sessions or create a second reset request. Let the unused link
expire naturally. A completed password-reset/login journey would be a separate
owner-entered credential change, with its security notices explicitly included.

## Acceptance and limits

Record one submitted request, neutral UI outcome, actual message receipt and
authentication results; distinguish missing delivery or unavailable headers.
This proves recovery-mail delivery/link presentation only. It does not prove
new-account verification, password mutation, every recipient provider or support
inbox monitoring. Preserve all completed Calendar and Sentry campaigns.
