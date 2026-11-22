# Downloaded audio and offline background access

Owner request: downloadable Generative.fm stations and Atmosphere sounds, and
every enabled background available offline subject to verified account access.
Work starts from local `55c342a` on `codex/practice-payments`; no deployment,
provider credentials/settings, payment, database migration or account writes are
authorized by this source task.

## Product and security contract

- Bundle generator modules and every enabled procedural background renderer.
  Only audio payloads require an explicit download. Preserve catalog IDs and
  original audio sequencing; do not replace a generative station with a loop.
- Expose searchable Stations and Atmosphere sounds, separate download/play
  actions, byte counts/progress, cancel/retry, remove, and storage feedback.
  No automatic large downloads or silent deletion of user-selected packs.
- Save complete versioned packs atomically in app-owned IndexedDB. Partial,
  cancelled, corrupt, quota-failed or missing payloads are never called ready.
  Read playback from committed local bytes; do not fall through to networking.
  Persisted recipes/preferences contain no clinical or account credentials.
- Restrict network GETs to the exact public audio origin/path. No remote HTML,
  scripts, arbitrary URL bridge, account-cookie extraction or payment WebView.
- Use the existing reviewed ambient source/catalog/sequence policy. Keep source
  attribution available. Generated noise/tone layers require no download.
- Verify paid background access online with the existing session and fresh
  feature-key/ownership data. Sign a minimal install/challenge-bound receipt
  using a server-only asymmetric key. Bundle only its public verifier.
- Membership access ends at a verified finite paid-through date, never at
  `download date + month`. Temporary/admin access is separately bounded; active
  individual ownership has no scheduled expiry. A fresh authoritative receipt
  replaces the entire snapshot, including revoked/refunded purchases.
- Signed receipts are capabilities for backgrounds only, not login/payment
  credentials. Explicit forget removes access. Reject malformed signatures,
  wrong install/challenge, stale replies and clock rollback. Offline revocation
  cannot be immediate; refresh reconciles it when the owner reconnects.
- Online verification opens the system browser, uses the user's normal account
  sign-in, requires explicit approval and returns only the signed receipt to
  the app. The app continues to cold-start locally without any connection.
- New signing/provider configuration and publication are a later exact approval
  boundary. Tests use ephemeral synthetic authority, never production secrets.

## Implementation and acceptance

1. Inspect current catalogs, dependency and asset contracts; freeze complete
   public pack metadata and retain licenses/source attribution.
2. Add transactional pack storage, bounded verified downloads, cancellation,
   quota handling, removal and deterministic offline-only playback adapters.
3. Bundle all existing background loaders; preserve canonical access decisions,
   local fonts/textures and motion fallbacks. Add signed receipt rules, issuer,
   account approval page and narrow native handoff.
4. Integrate mobile download/access controls without interrupting clock, timer,
   breathing or existing playback when navigating.
5. Test download then restart and airplane-mode playback of actual generator
   samples and ambient audio; all catalog dependency closures, failed downloads,
   cancellation/removal/retry, access expiry/ownership/revocation, forged/stale
   receipts, account replacement, cold offline entry and core regressions.
6. Build/lint/typecheck and inspect the exact final APK. Keep actual physical S24,
   background playback/closed-app alarms, substantive Codex/CodeRabbit review,
   live receipt service and separately authorized publication gates explicit.

Browser plugin/skill is not listed in this session. Use installed Playwright
and the task-owned empty Android emulator for repeatable acceptance; never
target a real phone or real user records automatically.
