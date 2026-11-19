# Beta purchase activation and remaining live acceptance

Status: **release/Ably and monetary checks passed; post-refund UI correction pending**.

The subsequent exact approval and
[one-record recovery](2026-11-18-owned-refund-recovery.md) resolve the permission
failure recorded below. The original refund succeeds with signed convergence
and preserved account state. A separate carousel adapter correction is still
needed before final beta acceptance; the historical stopped-state details are
retained rather than erased.

The owner separately approved PR #70 at `99c297b`, the exact 18 Production-only
settings in the all-payments plan, two owner payment checks capped at $7 total
including tax with one background-only refund up to $2, and one ten-minute
create/join/end lobby check without gameplay. Private financial submissions and
binding purchase terms remain owner handoffs. These scopes do not replay the
completed recurring-payment, Calendar, mail, backup or guest-game campaigns.

## Source and configuration

Fresh preflight verifies unchanged main `012952b`, exact PR head `99c297b`, all
seven CI jobs green, manual Production domain assignment disabled, the prior
public Calendar release and a complete 69-name Production inventory. Fresh
Stripe metadata agrees with the approved live account, active Tax settings,
one active Ohio registration and the enabled exact 15-event webhook/API contract.

Created the 18 absent settings once with upsert disabled and Production as their
sole target. Individual readbacks match every approved value. The complete CLI
inventory is now 87. Bulk connector metadata was truncated and could not prove
non-target equality; a CLI API projection with decryption disabled confirms all
69 prior settings retain timestamps before this operation. No existing secret
was decrypted or changed. There was no repeated create request.

Merged PR #70 once as `8d89550ab4529f1807b9ae69af43a1e117fb6e65`. Its Git tree
exactly matches the frozen candidate. One automatic Production build was
observed; no manual rebuild or intermediate older-dependency merge occurred.

## Candidate and publication

- The actual Production migration gate passes with all 46 migrations current;
  no migration is applied.
- The actual all-payments readiness gate passes, including the two newly enabled
  flows. Existing Supporter catalog/credentials/Portals are preserved.
- Compilation, TypeScript and all 115 static pages pass; the artifact is READY.
- Sentry accepts the two source-map archives, 521 client files and 2,620 server
  files, associated with the exact merge release. A debug ID from a script
  actually emitted by the staged HTML resolves to the new 521-file archive in
  Sentry. The observed client file has no public source-map directive. No new
  synthetic error or email is sent.
- Seven protected staged entry requests return 200 without generic error content.
  The actual Linux artwork route returns a valid 512-by-512 PNG, confirming
  Sharp/libvips function delivery rather than only a Windows-local raster.
- Promoted that existing artifact once. All six mappings complete, the public
  host matches the candidate and all unrelated project aliases are unchanged.
- Seven public entries also return 200 without generic error content; the public
  artwork is a valid 512-by-512 PNG and the observed candidate script is present.
  The apex retains its 308 redirect to the canonical www origin.

The prior READY `cdea4a6` artifact remains the compatible disabled-flow rollback.
The new release enables One-time support and $1 U.S./USD background purchasing.
At publication no new Checkout Session, payment or refund had been created. The separate
[one-lobby Ably campaign](2026-11-18-offered-ably-connection-check.md) passes and
is closed without gameplay or deletion. Invitations remain pending the approved
owned payment/refund acceptance and final handoff.

## Owned financial acceptance and stopped refund

The owner completes one $5 One-time support payment and one Skybreak payment
of $1 plus $0.07 Ohio tax, totaling $6.07 within the $7 ceiling. Only the exact
owned Sessions, PaymentIntents, expanded lines and product classifications are
verified. Both are paid/succeeded in payment mode with complete Automatic Tax.
The existing no-benefit support purpose has the retained `txcd_90000001` code
and zero tax; membership, credits and ownership remain unchanged. Its success
return matches the exact Session. It intentionally has no commerce receipt;
individual Stripe delivery acknowledgement was not separately inspected.

Skybreak uses the unchanged background key, `txcd_10000000`, exclusive tax and
the current digital-purchase version. Its exact owned order is PAID/FULFILLED
and the signed Checkout receipt is processed without failure. One permanent
purchase ownership is ACTIVE before the refund submission.

The owner submits the app's selected full $1.07 refund once. AtmoShaper saves
the original pending refund, its immutable item and REFUND_PENDING purchase
ownership. No processor refund appears in two exact-payment reads. The exact
Stripe request log proves HTTP 403 `more_permissions_required`; its request
retains the original amount, order/refund metadata and idempotency key. The
dedicated Production runtime key currently has Charges and Refunds Read; Stripe
requires its combined Write capability for this request.

The original campaign stops without a processor retry, new refund, batch repair,
database deletion or additional purchase. The one-field permission change is
prepared but unsaved. A read-only-by-default guarded one-record recovery tool
has 81 passing focused checks on `codex/beta-refund-recovery`; its use of the
existing Production bindings and one original-record processor submission need
fresh approval. The public artifact and all 18 settings remain as published;
the earlier release window is expired and was not reused for automatic rollback.
If remediation is declined, fresh containment authority must be prepared rather
than treating old release attempts as reusable. Invitations remain on hold.
