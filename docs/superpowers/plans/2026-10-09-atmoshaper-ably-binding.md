# AtmoShaper Ably binding and remote Anatomime acceptance

Prepared October 9, 2026 after the approved read-only inventory. Read
[project state](../../project-state.md), [project log](../../project-log.md) and
[the independent launch plan](2026-10-08-atmoshaper-independent-launch-readiness.md)
first. This is preparation for later exact approvals, not authorization to create
keys/apps, change environments, deploy or play a provider-backed game.

## Verified inventory and its limits

The owner's replacement management token has exactly `read:app`, `read:namespace`
and `read:stats`, with a thirty-day expiry. Complete account app metadata identifies
one enabled app named `atmoshaper`, requiring TLS. Its channel-rule list is empty.
Two completed hourly statistics windows return no rows; this proves neither
absence of historical use nor current quotas, billing or application connectivity.

The protected cumulative ledger reserves eleven of twelve approved GETs, including
unsuccessful attempts. Private account/app identifiers and encrypted captures stay
outside Git. No app keys, channel messages, player records or presence data were
read, and no provider write or game request occurred. Access setup is complete;
use these receipts rather than collecting the token again.

## Source contract and proposed credentials

The [server helper](../../../lib/anatomime-realtime.ts) uses the server-only
`ABLY_API_KEY` for REST publishing and HMAC signing. Preserve that variable and
the normalized `anatomime:<ROOM>` namespace. Publish requests carry compact change
signals with a three-second timeout; the database remains game-state authority.

The proposed dedicated server key is limited to `anatomime:*` with `publish`,
`subscribe` and `presence`. This is derived from the current publisher and signed
client grant. Ably's [capability model](https://ably.com/docs/auth/capabilities)
requires client-token permissions to fit the issuing key. The existing helper
signs one-hour tokens for exactly one joined room and its player ID, with
`subscribe` and `presence`; it grants no browser publishing. Preserve this
compatibility boundary rather than broadening it to all channels.

The [token route](../../../app/api/anatomime/sessions/[code]/realtime-token/route.ts)
requires an authenticated or valid joined-player viewer, narrow room preflight
and operational allowance. The [client](../../../app/anatomime/shared-session-client.tsx)
subscribes to signals, wakes polling and closes its owned client on teardown.
Reviewed renewal fetches a fresh joined-player grant. The current client does
not enter or update presence, so the proposed acceptance does not add those
operations merely because existing tokens allow them.

The inventory token cannot supply `ABLY_API_KEY`: account-management access and
an app's server key have different roles. Key creation or credential capture must
be a separately approved, hidden-input operation with private recovery and exact
app/environment references. Existing keys remain unchanged; their inventory and
owners were not inspected. The empty channel-rule list provides no basis for an
unrequested namespace-rule or retention change.

## Remaining inputs and exact configuration packets

1. Confirm administration and billing ownership, actual connection/channel/message
   quotas, notification ownership and whether paid overage is possible. The app's
   name and two empty statistics windows do not establish these limits.
2. Privately pin the verified existing app as the Production candidate. It is
   already present; do not create a duplicate or rename it. Prepare one dedicated
   scoped server key only after that ownership and quota baseline is known.
3. Prepare one isolated non-production verification app and its own scoped key.
   No verification app appeared in the complete inventory. Creation needs exact
   approval, a just-in-time duplicate/ownership check, no trial/plan upgrade and
   an explicit recovery decision; preserve the existing app and keys.
4. Identify one exact protected verification deployment and approved host. Its
   database/fixtures must be separately approved and isolated from real games.
   Add a key only to that approved environment/deployment, preserving other
   settings. A generic Preview-wide key would not prove isolated verification.
5. After reviewed source and isolated acceptance, prepare the exact Production
   binding/build/artifact operation. Recheck hosted key-name absence and app
   identity; keep all existing live aliases and legacy tools recoverable. No
   Production binding, build or promotion is authorized by this plan.

The packets must specify credential handling, environment/resource identity,
readback, costs, retry/stop limits and exact rollback. An environment rollback
restores only the operation-owned prior binding; removal of an operation-owned
key or app needs explicit authority. No existing credential is rotated or retired.

## Proposed bounded acceptance to make review concrete

Use one synthetic game room, one host and two invented players on separate
browser/device contexts, with no clinical records, real customers or appointments.
Proposed limits: twenty minutes, three simultaneous connections, forty explicit
player/game actions, two controlled reconnects and twenty token issuances. Record
source/artifact identity and stop at any limit, cross-room event, authorization
failure, unexpected paid usage or unowned data. These bounds are proposals;
request the final named account, database/fixture and provider scope before use.

Before dispatch, derive the conservative message cost from actual server publish
call sites and deliveries to connected clients, including renewals/reconnects.
Explicit UI-action limits alone are not a provider-message ceiling. Record agreed
usage ceilings and the permitted verification hosts, without changing channel
rules or plan limits to accommodate a test.

Observe authenticated subscribe and server publication, host/phone turn changes,
fresh authorization on renewal, reconnect and fallback after interruption.
Unauthorized or other-room viewers must not obtain a room token. Polling success
alone does not close required realtime acceptance. Provider-free regressions are
source evidence; they do not replace these actual hosted observations.

The test writes application game state and issues provider tokens/messages, so
its approval must name those effects and cleanup. Close owned clients, remove
only the authorized synthetic room/player state through a reviewed cleanup path,
verify that state absent, and record bounded provider usage. Do not scan real
rooms, enter/update presence, replay messages, retain channel history, delete
pre-existing games or claim no channel retention from an empty rule inventory.

## Current next step

Access and inventory are complete. Prepare ownership/usage and isolated-target
inputs from the [morning review](2026-10-09-atmoshaper-morning-review.md), then
submit exact app/key/binding and acceptance packets. Approved DNS staging,
readback and export are complete; they do not authorize Ably activation.
