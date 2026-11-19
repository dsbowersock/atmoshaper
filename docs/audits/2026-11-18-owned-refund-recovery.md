# Original owner refund recovered

Status: **approved monetary recovery passed and closed** on November 18.
The published app remains `8d89550`; no new deployment or database migration
was needed for this recovery. A separate post-refund carousel defect remains
open and prevents final beta acceptance.

## Authorized correction and one-record execution

The owner approves the prepared Charges and Refunds Read → Write change on the
existing AtmoShaper Production runtime key, including the combined charge-write
capability, and one resumption of the existing $1.07 refund. The fresh window is
twenty minutes, with no new purchase, replacement refund or automatic retry.

Fresh readback confirms the same public artifact, one owned pending refund,
one suspended purchase ownership and no processor refund. Saved the single key
permission once. Reopened its review and verified nine total permissions:
five read/four write, the other eight unchanged, and no connected-account
permissions. No key value was revealed, rotated or changed.

The initial private Vercel reader could not obtain the existing runtime key and
stopped before either refund command ran. The preparation had assumed that key
was readable; its existing write-only protection should have been checked first.
The original CurrentUser-encrypted runtime-key copy was present. A subsequent
credential-bearing runner validated that same key privately and obtained only
the selected, unchanged pooled database binding through Vercel. It created no
credential file, printed no secret, and restored its process environment on exit.
No catalog or webhook credential was read. The guarded application command was
unchanged at executed source `f0b3f94`.

One read-only preflight passed. One execution made exactly one processor write
with SDK retries disabled, preserving the original refund, amount, metadata and
idempotency key. The command reported SUCCEEDED with no reconciliation required.
The permission Save, execution and final financial readbacks completed inside
the authorized window. All remaining write/request slots are closed.

## Observed convergence

- Stripe lists exactly one successful USD refund for $1.07 on the owned payment,
  with the original order/refund metadata.
- The application retains exactly the original refund record, now SUCCEEDED;
  the order and payment are REFUNDED, with no failure marker.
- The actual signed `refund.created` receipt is processed successfully. The
  earlier signed Checkout receipt and immutable order history remain intact.
- The original purchase ownership is REFUND_REVOKED. No replacement ownership,
  credit, refund, Session or payment is created.
- The existing membership record/timestamp, two credits and one credit-ledger
  entry are unchanged. Verified Admin authority remains; the cart is empty.
- The actual Admin page displays the refunded amount and revoked purchase.

The two original charges total $6.07; $1.07 is refunded, leaving the intentionally
unrefunded $5 support payment. Original processor fees are not returned, as
disclosed before approval. Processor success does not prove the bank has already
posted the credit.

## Separate UI follow-up

A fresh Clock view still disables Skybreak despite the preserved independent
Admin grant. The client carousel adapter makes every inactive ownership row
unavailable, whereas the server's canonical decision preserves independent
membership, temporary, Admin and free access. The
[focused correction plan](../superpowers/plans/2026-11-18-post-refund-background-access.md)
owns this source fix and its browser verification. Do not replay payments or
change financial history to work around that UI defect. Invitations stay on
hold until the corrected offered behavior and final handoff are accepted.
