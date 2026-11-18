# Offered-release Ably connection acceptance

Status: **passed and closed** on published source `8d89550`. The owner approved
one ten-minute lobby-only check. Earlier guest and password/progress campaigns
remain closed and were not replayed.

Native window inspection returned a mismatched surface, so no native controls
were used. The provider's live connection/channel inspector supplied the needed
wire evidence instead. Normal existing Google sign-in restored the Ably session;
no new key, permission, rule, retention setting or provider plan was changed.
The provider's onboarding demo was closed without publishing anything.

- Baseline: zero Ably connections. Prepared two owned views and generic team
  names before starting the finite clock.
- Created one lobby and joined it once from a second view in the same owner
  account. No game was started, scored or answered.
- The provider identifies one new connected WebSocket, SDK 2.30.0, TLS and bearer
  authentication through the dedicated Production key. Its token capability
  contains only this room's presence/subscribe permissions; the exact room
  channel is attached. No key/token value is read or exported.
- The owned channel shows the backend player-joined event matching the joined
  client, establishing the deployed publish and subscribe binding.
- Ended the room once through the host UI. The same channel reports room-ended,
  the host enters REVIEW and the joined view displays Game recap. This result
  combines actual connection/attachment and provider event evidence; it does
  not infer realtime from a polling-capable UI update alone.
- Stopped/detached the read-only observer and closed both game views. A fresh
  provider connection listing reports zero connections.
- A single owner-and-code-scoped aggregate confirms one retained REVIEW room,
  one player, zero game runs and the normal thirty-minute review/expiry interval.
  No raw rows, game/player/provider identifiers or IP addresses are recorded.

Create/join/end each used one attempt. The campaign and connection cleanup
finish within ten minutes; the no-gameplay five-second polling cadence remains
below the 240-read cap. No replacement fixture, direct synthetic publish,
manual event replay, forced expiry, database deletion or key revocation occurred.
The ordinary ended-room history is preserved. The campaign is closed, including
unused request slots.
