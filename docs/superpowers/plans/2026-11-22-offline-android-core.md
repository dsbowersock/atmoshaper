# Offline-capable Android core and shared web tools

November 22, 2026. The owner clarifies, before installing the first APK, that
Clock, backgrounds and as many other tools as practical must work without an
internet connection. Payment processing can require connectivity. This is an
application requirement, not permission to upload records or activate providers.

## Verified gap in the first APK

The initial native `MainActivity` opens the remote site using Android Browser
Helper. It packages no HTML/JavaScript tool bundle, Clock fonts, body model or
media catalog. A fresh installation cannot supply those tools without fetching
the website. The APK's successful build/lint/signature checks do not demonstrate
offline usability.

The current `public/sw.js` warms anonymous documents for Home, Notes, Clock/
Chimer and Anatomime. Runtime caching is limited to `/_next/static/` and
`/offline.html`. It does not implement media-pack downloads, complete dependency
preparation or the newer Wellness and Business Planner routes. Sensitive routes
and API responses are deliberately excluded. A locally saved record alone does
not make its screen available offline. Existing browser/PWA tests are narrower
than the owner's new full-app expectation.

## Architecture direction

The remote-only launcher remains a prototype. Deliver a shared, locally bundled
core that opens on the installed device without a server or previous online
visit. Reuse actual product components, styles, domain calculations and asset
identities between web and app; do not build a second unrelated design or ship
test fixtures. Separate those components from Next server rendering, server
actions, browser-only routing and mandatory session fetches using explicit
platform adapters.

Select the local host/build boundary with a small actual Clock/breathing
vertical slice before expanding. Android's supported local-content loading can
serve bundled web UI without internet. Browser-based sign-in and online account
services remain separate from the local content host; do not put Google OAuth
in an unsupported embedded login or copy browser cookies into native storage.
Do not impersonate the production origin to get access to browser storage.

Core free local tools must not require an online sign-in at launch. Existing
feature-key and selected-background access rules still apply to paid features.
Design explicit offline access grants separately; incidental cached files are
not proof of an entitlement and are not a new license to unlock paid content.

## Feature expectations

| Area | Offline target | Online boundary |
| --- | --- | --- |
| Home/navigation | Bundled launcher and local tool navigation | New account/session, remote information |
| Clock/timer/breathing | Full local calculations, controls, fonts and bundled alerts | Optional account preference sync |
| Backgrounds | Bundled starter choices; user-selected complete downloaded packs | Browse/download additional assets, buy content, verify access when required |
| Audio | Local generation and downloaded licensed tracks/sound packs | Radio/live streams and new downloads |
| Planner | Local worksheets/calculations/reuse, saved drafts and PDF generation | Optional authorized account sync |
| Wellness/local recording | Device-owned recording and review with all required UI/body assets available | Existing authorized hosted functions; no new clinical upload implied |
| Study/Anatomime | Bundled or downloaded study content and supported solo modes | Shared rooms, community updates and multiplayer |
| Calendar | Later owner-scoped last-synced viewing and local personal tools where supported | Authoritative shared availability, bookings, Google sync and invitations |
| Practice payments | View explicitly saved non-sensitive local status only if designed | Setup, charges, card saving, refunds and confirmed reconciliation |

An offline queue must never dispatch a payment, refund or no-show fee when the
network returns. Confirmed booking availability likewise requires the server.
Read-only calendar snapshots need a visible last-synced time and must not imply
that cached availability is current.

## Data, media and updates

- Keep existing browser local records intact. A new app content origin will not
  automatically share the browser vault. Any owner-approved transfer needs a
  verified export/import path, backup and explicit destination ownership.
- Distinguish encrypted local clinical records, ordinary local planner drafts,
  and already approved account-backed data. Preserve current storage contracts.
  Reconnection is not authorization for a new clinical cloud-sync feature.
- Partition local account data by owner and workspace; handle sign-out/account
  changes without exposing another person's cached records or credentials.
- Add explicit download availability, size, progress, storage use, cancellation
  and removal. Verify a complete versioned asset manifest and checksums before
  marking a pack ready; retain an existing working pack on interrupted updates.
- Bundle essential fonts/icons/UI and a useful starter background, with approved
  rights and attribution. Large video/audio/model packs can be optional; don't
  silently download the entire library or use mobile data for large packs.
- App core changes need versioned app updates; share source with the website
  while handling app/API version compatibility. Web and app do not have to be
  on identical deployed versions to remain compatible.

## Implementation and acceptance sequence

1. Inventory actual tool imports, routing, providers, storage and asset/network
   dependencies. Define platform adapter interfaces and a source/build boundary
   that excludes server-only code, secrets and financial endpoints.
2. Package actual Clock and breathing UI with their fonts/alerts, one background
   and local navigation. Test a clean install with networking disabled before
   the first app launch. Only claim the features actually included and exercised.
3. Test same-device lifecycle, rotate/resize, full-screen, process termination/
   restart and background audio/timer behavior. An emulator can verify UI/state;
   physical S24 acceptance is required for Android lifecycle/audio guarantees.
4. Add complete versioned media downloads and applicable access decisions; test
   partial/corrupt downloads, space exhaustion, offline playback and atomic
   updates. Exercise unvisited tools and all dependent fonts/models/PDF assets.
5. Extend planner, local recording and study functionality with owner-safe
   persistence. Review the existing browser-vault preservation/import boundary
   before moving any real data. Keep account/booking/payment services separate.
6. Verify reconnection, account switching, denied/expired online sessions and
   failed sync. Offline edits must not be discarded or sent to another owner.
   Preserve prior paid-access rules; do not introduce blind credential caching.
7. Complete Codex and CodeRabbit review, actual airplane-mode acceptance and
   separately authorized website/app publication. Improving the web PWA is a
   parallel delivery path, not proof of an offline-first native package.

No runtime, APK, service worker, provider or storage behavior changes in this
requirements/plan update. Current APK remains a network-backed prototype.

## Primary references checked

- [Chrome: initial offline TWA launch and service-worker limitation](https://developer.chrome.com/docs/android/trusted-web-activity/offline-first)
- [Android: locally packaged web content](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content)
- [Android: offline-first data architecture](https://developer.android.com/topic/architecture/data-layer/offline-first)
