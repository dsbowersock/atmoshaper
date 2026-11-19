# Offered Google Calendar test

Status: **approved live journey accepted; connection left ACTIVE**.
The owner explicitly approved the displayed Google account, existing test
practice, one generic event/cancellation and refresh/disconnect/reconnect scope.

## Observed connection and outbound behavior

The prepared earlier OAuth request expired. The app returned Not connected with
the safe expired-state message; callback source rejects that state before token
exchange or target creation. Started a fresh request under the new approval.
Google's actual consent shows exactly the three requested Calendar permissions:
calendar list, app-created secondary calendars/events and availability. Selected
those permissions and completed the approved grant.

The app reports ACTIVE, the correct owner account, dedicated AtmoShaper calendar
and a successful initial sync. The primary busy source is selected as disclosed.
Provider inventory changes from 18 to 19 calendars, with one new owned secondary
AtmoShaper calendar and all original calendar IDs preserved. The connector does
not expose the description marker; app callback validation owns that check.

Verified the test practice uses America/New_York. Created exactly one Personal
entry at the approved November 20, 12:00-12:15 time with the generic test label.
The public app displays it as Active. Its single provider mirror is confirmed
at the matching local/UTC time with summary AtmoShaper blocked time, no guests,
no location and no non-whitespace description. Real appointment details were
not opened. Imported busy blocks render only the generic Google busy label.

## Beta issue found and published fix

The original deployed workspace had no event-click action and Upcoming blocks
had no cancellation control. Retained the one fixture while preparing the
focused [cancellation fix](../superpowers/plans/2026-11-18-personal-block-cancellation.md).

Prepared that fix separately from unrelated beta changes. Forty-five focused
checks, 84 existing Calendar sync checks, typecheck, targeted lint and a local
optimized build with 115 pages pass. Full lint found one test variable naming
error; it was corrected and the affected lint scope passes. Local provider gates
correctly skip and do not substitute for a real Production build or source-map
upload. The owner separately approved publishing exact commit `cdea4a6`.

## Exact release acceptance

The owner privately completed Vercel's identity step. Its resulting staged
Production build passed actual migration-status and Supporter readiness gates,
compilation, TypeScript and all 115 pages. Seven authenticated candidate entry
requests returned 200: home, login, Calendar, clock, music, pricing and support.
Sentry accepted archives containing 523 and 2,080 files under that exact Git
release. A debug ID read from a deployed public client chunk matches the new
release's archive; that unchanged client chunk also belongs to the older release.
The chunk has no public source-map reference. No new synthetic error was sent.

Fresh preflight confirmed READY, Production, approved commit and correct project,
while the public host still served the saved prior release. Promoted the existing
artifact once; all six requested mappings completed and the public host points
to it. The previous READY artifact remains available for rollback. The source is
preserved in [draft PR #69](https://github.com/dsbowersock/atmoshaper/pull/69),
without a main merge. Build acceptance does not enable the two disabled purchase
flows or certify every asset.

## Cancellation, refresh and reconnect

On the public release, the sole fixture row exposes Cancel block. One submission
returns `block=cancelled`, the Blocked time tab reports cancellation and zero
upcoming blocks, and no Google-failure notice is present. A bounded provider
search for the approved mirror/window returns zero events. The application keeps
cancelled history rather than hard-deleting the parent or Personal child.

The first explicit Refresh now returns the success notice and a newer last-sync
time. One Disconnect reports Not connected. Provider inventory still contains
the dedicated calendar. One equivalent reconnect to the same owner account shows
only the existing three Calendar permissions plus existing identity/email access;
no expanded permission was accepted. Callback returns connected/ACTIVE and a
new successful initial-sync time. The second and final explicit refresh succeeds.

Final inventory is the same 19-calendar ID set, preserving every original one
and the same dedicated target. Exactly one busy-source checkbox remains selected,
the original primary calendar. A final bounded mirror search returns zero.
The approved workflow completed within its finite window, finishing connected.
No natural token-expiry interval, long-running sync, full external-conflict
booking scenario or physical speaker output was established by these steps.

Private target/event references and the consumed finite test counters are held
in ignored local operation storage. No second event or calendar is authorized;
do not widen Google scopes or replay this completed Calendar campaign.
