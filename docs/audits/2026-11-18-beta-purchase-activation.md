# Beta purchase activation and remaining live acceptance

Status: **approved release published; Ably check passed; owner payments pending**.

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
No new Checkout Session, payment or refund has yet been created. The separate
[one-lobby Ably campaign](2026-11-18-offered-ably-connection-check.md) passes and
is closed without gameplay or deletion. Invitations remain pending the approved
owned payment/refund acceptance and final handoff.
