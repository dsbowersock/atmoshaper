# Offered account recovery email

Status: **one-message delivery and link target accepted; password unchanged**.

The owner approved one request to the existing account and clarified that its
normal sign-in method is Google. This test does not need or establish a local
password. Consuming a valid reset link could add password sign-in to that linked
account, so no reset-form submission or credential change was performed.

Submitted the public Forgot password form once on the published cancellation
release. The page returns the expected neutral account-entry notice. One matching
message arrived in the owner's Gmail Inbox during the bounded window, from
the branded account subdomain with the expected reset subject. Gmail's received
headers report SPF pass and aligned branded DKIM pass. The returned header does
not state a DMARC result; do not claim that it does. The message link uses the
correct HTTPS public origin and reset-password path. No credential-bearing link,
message reference, raw header or recipient is included in this tracked receipt.

The link remains unused and expires after sixty minutes. No new account,
password, sign-in method, session revocation or second message was requested.
This is delivery and destination evidence, not password-reset completion,
new-registration verification or every-recipient-provider acceptance. The
[packet](../superpowers/plans/2026-11-18-offered-account-mail-check.md) is consumed.
