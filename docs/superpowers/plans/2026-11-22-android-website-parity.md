# Android uses the website experience

Owner request: make Android match the website's home page, navigation and tools,
while retaining the accepted offline functionality. The earlier five-tool shell
is a functional prototype, not the accepted product design.

## Implementation boundaries

- Reuse actual website components and route/navigation models. Do not draw a
  second approximate dashboard, sidebar, Clock setup or breathing screen.
- Keep an explicit platform boundary for route navigation, local assets, media
  source resolution and connected services. Never bundle server actions, Prisma,
  credentials or development entitlement grants into the native client.
- Preserve the development application ID/signing identity and existing storage
  namespaces, downloaded packs, installed-background receipt and verification
  authority. Upgrade installation must retain those records.
- Keep public web behavior unchanged by default. Native adapters must not turn
  a background capability into an authenticated account session.
- The owner explicitly chooses the full experience inside the app, including
  connected account/calendar/practice screens. The connected experience uses
  the actual website in a browser-owned Trusted Web Activity; device-capable
  tools use the same components from packaged assets. No replacement native
  login or account-token bridge is introduced. Website/app origin association
  and the navigation integration need separately approved website publication.
- This request authorizes local source, preview, build and synthetic acceptance;
  it does not reuse the completed publication window for new provider changes,
  website publication, payments, email or clinical data writes.

## Work sequence

1. Capture the current responsive website design and dependency boundaries.
   Introduce native routing and local asset adapters, then mount the real home
   dashboard, grouped sidebar and main bar with the website's providers/styles.
2. Mount the existing Clock/timer, breathing and other device-capable tool
   components. Use shared playback UI with offline source adapters and a clear
   download manager. Retain continuous audio across internal routes.
3. Bring planner and local tools into the shared route map; retain every normal
   navigation destination. Implement connected-service behavior according to
   the owner's answer, with accurate offline and sign-in states.
4. Preserve older preview preferences without overwriting unread or existing
   shared-screen state. Do not clear the owner's emulator/phone data for tests.
5. Verify actual shared component geometry at phone/tablet/landscape sizes,
   navigation/back behavior and keyboard accessibility. Run focused domain and
   browser regressions, source lint/TypeScript, Android lint/build/signature,
   and isolated emulator airplane-mode/process-restart/upgrade acceptance.
6. Record Codex/CodeRabbit source review and resolve supported findings in a
   bounded group. Produce a distinctly named APK and side-by-side screenshots;
   clearly name any remaining connected/OS limitations. Do not describe a
   functionally passing five-tool prototype as complete visual parity again.

## Platform references

- [Android Trusted Web Activity overview](https://developer.android.com/develop/ui/views/layout/webapps/trusted-web-activities)
- [Chrome offline-first launcher guide](https://developer.chrome.com/docs/android/trusted-web-activity/offline-first)
- [Official Android Browser Helper](https://github.com/GoogleChrome/android-browser-helper)

The prepared app association names only the existing development package and
its actual public signing fingerprint. It is source preparation, not a live
association. Browser verification and authenticated connected journeys remain
required before claiming the full installed experience is ready. No certificate
warning, browser-origin check or cookie isolation is disabled for acceptance.

## Acceptance

Cold launch opens the same home dashboard as the website, using its wordmark,
six launch tiles, colors, sheets and spacing. The main bar and grouped navigation
share their actual components. Clock/timer setup and running screens, breathing,
music and planner tools use the website screens. Downloaded stations/ambient
sounds and all bundled backgrounds retain accepted offline behavior and access
rules. No route silently disappears, no connected feature falsely claims to
work offline and no private browser/website storage is copied into native.
