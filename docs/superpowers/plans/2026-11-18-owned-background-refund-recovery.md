# Recover the single owned beta refund

Status: **prepared locally; new provider/credential/recovery approval required**.
Public source remains `8d89550`. The two approved owner payments succeeded:
$5 One-time support with zero tax, and $1 Skybreak plus $0.07 Ohio tax. Their
$6.07 combined total is below the $7 cap. The background's signed Checkout
receipt is processed and its original permanent ownership was fulfilled.

The owner submitted the exact-item $1.07 refund once through AtmoShaper. The
app retains its original pending refund and suspended purchase ownership.
Stripe's exact request log reports HTTP 403 `more_permissions_required`: the
dedicated Production runtime key has Charges and Refunds Read, while this API
operation needs the combined Write capability. Two exact-payment refund reads
return no processor refund. No automatic retry, replacement refund, direct
dashboard refund, database repair or additional purchase occurred.

## Prepared permission change

The unsaved Stripe review changes only **Charges and Refunds: Read → Write**
on the existing **AtmoShaper production runtime** key. This combined capability
also permits charge creation/update/capture/redaction and refund
creation/update/cancellation; do not describe it as refund-only access. The
other eight permissions and all connected-account permissions stay unchanged.
The existing key value, Vercel settings, API version and deployed artifact are
preserved. Do not save before exact action-time approval.

## One-record recovery, rather than batch reconciliation

The existing batch `commerce:reconcile -- --repair` can resume multiple records
and is outside this scope. The prepared
[owned-refund command](../../../scripts/commerce-resume-owned-refund.mjs)
requires the privately held refund, order, owner, background key, exact amount
and expiry. Its default mode is read-only. It:

1. Filters the database read by refund, order and owner together. Requires the
   original unresolved placeholder, one immutable purchased background,
   suspended purchase ownership, a full matching USD payment and no other
   pending/successful refund or dispute.
2. Retrieves only that PaymentIntent, verifies live mode and matching
   owner/order/purpose/amount, and requires an empty exact-payment refund list.
3. In separately approved `--execute` mode, calls the existing shared refund
   resumption helper once. The processor callback rechecks the deadline and
   original metadata/idempotency key immediately before writing; SDK write
   retries are disabled. No replacement local refund is created.
4. Reports sanitized states only. A pending/ambiguous result stops without
   claiming success or retrying. Signed webhook and durable ownership/payment
   readback are required afterward.

Proposed recovery window: twenty minutes beginning after fresh approval.
Maximum: one permission Save and one processor submission of the **existing
$1.07 refund**, no new Session/payment/charge, thirty exact-record operator
reads and six delayed-status polls. Run one read-only preflight and one
execution at most. Stop on a changed owner/order/item/amount/status, existing
processor refund, scope expiry, unexpected permission delta or ambiguous write.
Keep unused attempts closed after completion or a stop.

For the command only, obtain the existing Production `DATABASE_URL` and
`STRIPE_SECRET_KEY` privately through the authenticated Vercel CLI. Decrypt
only those two selected settings into the short-lived process environment,
never into dotenv files, chat, tracked output or a broad environment export.
The command does not load dotenv files. Use the app's existing runtime bindings;
create no database role, key, credential rotation or wider data access.

## Acceptance and preservation

Require one processor refund matching the original pending record's metadata,
amount/currency and PaymentIntent; its successful signed webhook receipt; the
order/payment REFUNDED projection; the original purchase ownership
REFUND_REVOKED; unchanged existing credits, membership and administrator access;
and retained order/refund history. Do not assume that account-derived access to
Skybreak should disappear after permanent purchase ownership is revoked.

Local validation: 81 focused recovery/reversal/reconciliation/Admin checks pass
without provider credentials, including wrong-target/amount, prior refund,
expiry, immutable scope, changed callback and second-submission rejection.
Focused lint and diff/link checks pass. No live recovery has run.

The original payment campaign stopped at the rejected request. Its unused
attempts and the earlier ninety-minute release window are not renewed by this
plan. Public routing/configuration remain unchanged while fresh remediation is
prepared. If correction is declined or cannot be accepted, prepare fresh
authorization for containment using the saved compatible artifact/settings;
do not run an expired release operation automatically. Invitations remain on
hold until refund recovery and the remaining handoff are accepted.
