# Offline Android core verification

November 22, 2026. Local debug app milestone; no website or provider publication.
The owner requests offline Clock, timer, breathing and backgrounds before phone
installation, and correctly identifies generated stations as offline-capable.
See the [implementation plan](../superpowers/plans/2026-11-22-offline-android-core.md).

## What is actually delivered

Replace the remote-site launcher with a locally bundled client entry served by
Android's reserved app-content asset loader. This APK declares no Internet
permission. Only packaged GET resources on its fixed local path are allowed;
foreign/missing requests return a local error. File/content access, mixed content
and automatic script windows are disabled. There is no account-cookie extraction,
generic JavaScript bridge or hosted financial surface.

The core includes Clock (12/24-hour, optional seconds and focus view), one timer
with pause/resume/reset and interval alerts, all three breathing patterns, and
the three canonically free backgrounds: Lava Lamp, static gradient and solid
color. Background/color/motion choices persist across tools. Other paid catalog
entries are not unlocked by cached files or guessed ownership.

Reuse actual product code: the digital time renderer and leading AM/PM geometry,
unmodified DSEG fonts and notice, breathing view, timer/gradient calculations,
buttons and wordmark. Extract the existing moving-gradient renderer behind the
website's unchanged settings adapter. Extract the existing two-note Clock chime
for both platforms, retaining its envelope and adding node cleanup. The existing
`notification.mp3` is a placeholder, so it is deliberately not packaged or played.
No downloaded recording is required for alerts.

Native preferences/deadlines use a separate local IndexedDB store. Writes are
serialized and acknowledged only after a strict durable transaction completes;
acknowledgements match the exact displayed immutable state. The emulator exposed
that WebView localStorage could lose its latest unflushed update on process death;
the actual process-stop test now passes with committed storage. Saving/failure
feedback never marks an older snapshot as a newly saved timer. Existing browser
account preferences and encrypted records are neither read nor migrated.

## Exact artifact and executable evidence

- APK: `output/android/AtmoShaper-preview.apk`, development package version
  `0.2.0-offline-preview` (version code 2), debug signing only.
- SHA-256: `d691a1def00502dba07817b6390ca4f03028f3629d72b3e047b3df7aab36c26c`.
- The core is about 1.51 MB across eight declared assets, plus its manifest.
  Actual APK ZIP readback checks each asset's size/hash against that manifest
  and the current built bundle; no previsited server page supplies the tools.
- `npm run test:offline-core`: 9 focused cases pass, including time arithmetic,
  pause/restart/completion, invalid input, missed-interval suppression, isolated
  preference keys/storage failures and the synthesized two-tone schedule.
- `npm run test:clock-meridiem`: all 111 existing timer/font/AM-PM checks pass.
  The sandbox browser-cache failure is excluded; the same named check passes
  outside the sandbox with the installed Chromium.
- `npm run test:breathing`: all 26 existing timing/shortcut cases pass.
- `npm run test:offline-core-regression`: all 116 background/motion cases pass.
- `npm run test:offline-core-browser`: the real bundle passes phone 390×844,
  landscape 852×393 and desktop 1280×900 journeys with networking disabled
  before first load and service workers blocked. Verify fonts, time modes,
  all bundled backgrounds/colors, reload, saved pause/resume, completion while
  another tool is open, breathing controls and viewport containment. Actual
  screenshot inspection finds and fixes a landscape status/control overlap;
  an explicit geometry check now passes. No console/runtime errors, framework
  overlays, unexpected resources or external requests occur.
- `npm run android:build`: Android lint and APK assembly pass. There are zero
  lint errors; warnings flag the intentionally pinned older stable AndroidX
  Activity/WebKit versions and the unchanged square launcher icon. Build tools
  also report SDK-metadata/Gradle-deprecation warnings; none is counted as a
  functional failure or proof of physical-device success.
- Focused ESLint and the ordinary full `npm run typecheck` pass.
- Opt-in `npm run test:offline-core-android` passes on the task's empty Android
  35 AOSP emulator (WebView 124), using this exact APK. Before fresh launch,
  airplane mode is on, Wi-Fi/cellular are off and the installed package has no
  Internet permission. Verify cold Clock/font rendering, background selection,
  timer save, actual process stop/relaunch with unchanged deadline/color,
  paused reload, synthesized alert, short timer completion and breathing.
  The test has no server/resource interception; the native asset loader supplies
  actual APK bytes. Cold-start and durable-save waits are bounded for observed
  emulator latency. No incomplete save is treated as acknowledged success.

Machine-readable build/bundle/emulator receipts are under ignored `output`.
Phone, landscape, desktop and real-emulator screenshots are stored outside the
repository in this chat's approved visualization folder. Browser plugin/skill
is not listed; use installed Playwright for repeatable browser/Android checks.
The test only accepts the exact synthetic emulator and development package;
it never targets the owner's phone or real user records.

## Limits and next steps

- Physical S24 installation, audibility, OS lifecycle/rotation and battery use
  remain unverified. Emulator audio confirms local synthesis execution, not a
  physical speaker check.
- Timer deadlines survive committed state and restarts, but sound/flash alerts
  are foreground features. There is no closed-app alarm/notification service.
  The foreground window keeps the screen awake, matching Clock's current default.
  Test alert can enable sound after reopening the app. Do not promise an alarm
  while Android has suspended or killed this build.
- This is the first offline core, not full native parity. Account, Wellness,
  Calendar, study, purchased-background access/downloads, actual station player
  and practice payments retain their separate implementation/review gates.
- Generated stations can run offline once their code, index and all required
  samples are locally available. Existing sample caching is useful groundwork,
  not a complete download/readiness guarantee. Explicit station packs, storage
  management and actual offline generator acceptance follow; external live
  broadcasts still need connectivity. See the
  [sample-provider contract](https://github.com/generative-music/web-provider).
- Codex/CodeRabbit source coverage, release signing, complete third-party
  notices, phone acceptance and separately authorized publication/distribution
  remain before an app release. No PR merge or provider/DB/payment/email/
  production write is performed in this milestone.
