# Offered-release Ably connection check

Status: **passed and closed**. See the
[acceptance receipt](../../audits/2026-11-18-offered-ably-connection-check.md).
The earlier guest and
password/progress campaigns remain accepted and closed. This checks only the
current offered artifact's new Production key binding and signed-in context.

## Prepared fixture

After the final release is verified, propose one new owner-controlled lobby,
one join from the same signed-in owner in a second view, and one End room action.
Use generic invented names. No other participant, invitation, match start,
answer, score, achievement, subscription, clinical record or provider-key change.
Both views belong to the operator; do not use an expired room or old grant.

The source creates a room, teams and host; its join grants the view's player
credentials and realtime setup. The host dashboard uses ordinary polling; the
joined play view obtains a signed room-scoped Ably grant. Observe token success,
actual Ably connection/channel attachment and receipt of the owned room-ended
event. A UI update or HTTP 200 alone is insufficient: fallback polling can also
refresh the page. Inspect transport proof without recording token/credential
bodies. If the available browser tools cannot establish attachment/event proof,
record that limit instead of claiming realtime passed.

## Finite operation and cleanup

- Ten-minute window after fresh approval/preflight; one room-create, one join,
  one End room, at most two realtime-grant starts and two owned browser views.
- Stay in LOBBY/REVIEW: no gameplay writes. At most 240 automatic room snapshot
  reads across both views (normal lobby cadence is five seconds; hidden views
  back off). Stop and close the views at the cap, deadline or unexpected state.
- Expect only the normal room-created, player-joined and room-ended publishes
  on the one fixture channel; no direct synthetic publish or event replay.
- Stop after an ambiguous mutation and inspect the known room; do not create a
  replacement fixture or retry the action automatically.
- End through the app, leaving the normal 30-minute review/expiry record, then
  close both views and their realtime connections. Retain recap/audit history;
  no database delete, broad cleanup, forced expiry or unrelated key revocation.
- Save only status/timing/event-kind proof in tracked records. Exact room and
  player/provider identifiers stay privately in ignored operator artifacts.

The owner approved this exact bounded current-binding check on November 18.
Start its ten-minute clock only after the fixture/inspection preflight is ready.
Close the campaign after its result; unused slots do not authorize a replay.
