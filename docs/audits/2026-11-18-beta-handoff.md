# Small beta handoff checkpoint

Status: **release published; payments passed; refund recovery pending**. No invitations
have been sent. This checkpoint carries forward dated, scoped results rather
than repeating closed campaigns or declaring the full migration complete.

| Area | Accepted evidence and practical limit |
| --- | --- |
| Offered release | `8d89550` has the reviewed `99c297b` tree. All seven reviewed-head CI jobs pass, including 5,676 unit checks and 614 Chromium checks. The actual Production migration/all-payments gates, 115-page build, source-map association and eight staged/public page/artwork requests pass. Compatible prior artifact retained. [Receipt](2026-11-18-beta-purchase-activation.md). |
| Existing account | November 18 Google sign-in, Security, layout and local-first sync presentation were observed. The new release's Pricing page also recognizes the signed-in owner. No password or sign-in method was added. [Earlier account receipt](2026-11-18-offered-account-playback-and-recovery.md). |
| Account mail | One recovery message arrived with passing SPF and branded DKIM and the correct HTTPS link. The link was not consumed; this is delivery evidence, not a completed password reset or all-recipient-provider proof. [Receipt](2026-11-18-account-recovery-mail.md). |
| Google Calendar | The approved creation/cancellation, refresh, disconnect and equivalent reconnect checks pass, finishing connected with the synthetic mirror removed and original calendars preserved. This is not a long-running sync or full booking-conflict campaign. [Receipt](2026-11-18-google-calendar-live-test.md). |
| Anatomime | One no-gameplay lobby on this offered release proves scoped WebSocket/TLS attachment and backend join/end events; it reaches normal review and connections return to zero. The campaign is closed. [Receipt](2026-11-18-offered-ably-connection-check.md). |
| Music and artwork | Earlier offered Drone/Observable Streams browser play/pause/resume/stop observations are retained. The patched release's real Linux artwork returns a valid 512-pixel PNG. Physical speaker output, every station and long-session behavior are not established by those observations. [Playback scope](2026-11-18-offered-account-playback-and-recovery.md). |
| Sentry | Existing scrubbed error-only/owner-alert acceptance is retained; this release uploads its own client/server maps and its actual client debug ID resolves to the exact release. No additional synthetic error or email was sent. [Current release receipt](2026-11-18-beta-purchase-activation.md). |
| Hosted-data recovery | The encrypted export and isolated restore passed. Daily scheduling, guarded retention and an authenticated owner failure alert pass at the scheduled-test scope. First regular overnight run is November 19 at 03:00 America/New_York and is still future; a full hosting-outage cutover remains untested. [Daily acceptance](2026-11-18-daily-encrypted-backups-and-alerts.md), [operating runbook](../wiki/database-backups.md). |
| Support and tester instructions | Derrick will monitor `atmoshaper@gmail.com`; the public support page is reachable. The [tester guide](../beta-tester-guide.md) provides invented-data checks and a private-data-free reporting format. No test support message is necessary or authorized. |

## Remaining before invitations

Both approved owner payments pass: $5 support and $1.07 Skybreak including tax,
totaling $6.07. The original selected $1.07 app refund is locally pending, with
its purchase ownership suspended. Stripe rejected the processor call because
the runtime key lacks the required combined Charges and Refunds Write access.
The original campaign stopped, without another purchase or processor retry.

The owner completed terms, payment details and the original refund submission
privately. Exact transaction/tax/purpose and signed background fulfillment pass.
The one-field key edit and guarded resumption of only the original pending
refund are prepared but need fresh provider/credential/recovery approval. Keep
the original metadata and idempotency key; do not substitute a new dashboard
refund or broad reconciliation. Require processor/signed-webhook/ownership
convergence and preserve existing membership, credits and administrator access.
[Campaign receipt and stop](2026-11-18-beta-purchase-activation.md).

After those results, reconcile this checkpoint and the tester guide with the
offered scope before inviting people. Held content, broader migration/marketing,
legacy retirement and unrelated live campaigns are not silently approved or
completed by this beta checkpoint. Clinical vaults remain on each person's
device; shared hosted-data backups do not replace their local exports/recovery.
