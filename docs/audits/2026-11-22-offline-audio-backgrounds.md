# Downloaded audio and offline backgrounds verification

November 22, 2026. Application source frozen at `194e385` on
`codex/practice-payments`. This is local implementation and acceptance evidence;
it is not a publication, provider-activation or physical-phone receipt.

## Implemented behavior

The native Music screen offers explicit complete-pack downloads for all 57
existing generative stations and 51 reviewed Atmosphere sound categories, plus
locally generated white/pink/brown noise. Downloads expose progress, saved size,
cancellation, retry and removal. Only a complete strict IndexedDB transaction
marks a pack ready. Payloads are size/hash checked and playback uses saved bytes
without falling back to the network. Metadata listing does not read all audio
payloads. Schema v2 preserves existing v1 packs while adding its metadata store.

Station engines remain generative, using the original modules/sample dependency
closures. Ambient playback reuses the existing reviewed source sequencing and
scheduler. Website streaming behavior and stable media IDs remain unchanged.
Audio survives switching among the bundled tools. Reliable screen-off/background
playback is not implemented; the preview asks users to keep the app open.

All 84 enabled background renderers are bundled, including both fixed globe
images. Three canonical free backgrounds work immediately. Premium access uses
the feature key `premium_backgrounds` and the account's verified paid-through
date, including the full verified annual period. Active individual ownership
has no scheduled expiry. Fresh authoritative verification replaces the complete
snapshot, including refunds/revocations; offline revocation cannot be immediate.

The backgrounds-only ES256 receipt contains install/challenge nonces, an account
pseudonym, issue/expiry dates and owned background IDs. It contains no login,
payment or clinical credentials. Explicit browser approval uses the existing
account session outside the WebView. Signature/install/challenge/replay/clock
checks and serialized durable saves protect acceptance. Forget rotates the
installation binding and removes local access; obsolete async verification
cannot restore it afterward. A fresh signed server timestamp permits recovery
after correcting a device clock.

The normal public verifier list is **empty** and the live issuer is
**unconfigured**. Synthetic acceptance keys are isolated to their test output.
Real-account verification therefore remains unavailable until the separately
approved activation. No subscription or purchase has been fabricated.

## Validation receipts

- 326 focused/regression cases pass: Core/storage 11, media/access/issuer 12,
  fictional payment domain 20, background regressions 116, breathing 26,
  existing audio/catalog regressions 30 and Clock/meridiem 111.
- Focused offline Core/media/payment ESLint and ordinary full TypeScript checks
  pass. Android lint and assembly pass. Android tooling reports the already
  documented pinned-library/icon/SDK-metadata/Gradle-deprecation warnings.
- The inert-provider Next website build passes. The built approval page renders
  with HTTP 200; anonymous issuer requests return 401 and foreign-origin requests
  return 403, both private/no-store. Use the matching `localhost` loopback origin
  for this harness because Next normalizes its local Request URL to localhost.
  The first smoke check exposed the missing scoped SessionProvider and the
  corrected built page is checked again; build success alone was insufficient.
- All three final browser suites pass concurrently with independent output
  directories. Fresh network-disabled Core entry covers phone, landscape and
  desktop sizes. Real-media acceptance downloads Little Bells and Grinding
  Pepper, restarts offline, verifies non-silent generator buffer execution and
  advancing local ambient playback, switches tools, and removes a download.
  No offline audio request is made. Cancellation during the actual pack commit
  rolls back readiness; reload/retry and v1 metadata migration also pass.
  A deliberately retained v1 connection blocks the first upgrade; closing it
  permits the same store's later download operation to recover without reload.
- Synthetic signed browser acceptance loads all 84 enabled renderers offline
  and checks expiry, permanent ownership, authoritative revocation, stale replay
  and Forget racing an obsolete async verifier. Duplicate rejected replies do
  not invalidate an earlier committed result, and Refresh during initialization
  preserves the saved receipt. These are synthetic access
  tests, not evidence of a live account connection.
- Metadata-only validation checks all 57 complete station closures: 249,986,446
  bytes if every station is selected, maximum 11,237,510 bytes per station.
  It does not download or play all 57 stations. Actual browser/Android playback
  covers the representative station/sound above. Reviewed ambient descriptors
  carry expected hashes; station source manifests carry sizes, with saved-byte
  hashes checked during later playback. Do not claim independently signed
  station content manifests.
- Eight fictional payment processor/viewport journeys pass, including clearing
  an inactive cancellation-notice input. No real processor, charge or consent
  is involved.

The final normal debug APK is `output/android/AtmoShaper-preview.apk`, version
`0.3.0-offline-media-preview` (code 3), 12,136,918 bytes. SHA-256:

`1da7150d286a15ac278d9ebfe6bbf5b0218fa33ccf02dee1a28f6c735774812d`

Its v2 signature verifies. Build, media and Core emulator receipts all match
that exact hash. All 143 packaged assets match the bundle inventory; synthetic
receipt authority is false. Internet permission is now present for explicit
downloads. The native boundary permits only existing allowlisted public audio
GETs, without redirects/cookies; startup and saved playback remain local.

On the task's empty API 35 emulator, download actual media online, force-stop,
enable airplane mode, disable Wi-Fi/cellular and relaunch. The exact APK plays
the local station and ambient sound with zero offline audio requests. A separate
fresh-data airplane-mode journey verifies Core entry, unchanged committed timer
deadline/color after process stop, paused reload and breathing. Rotation retains
the same live WebView and timer deadline; completion schedules exactly one
two-note chime without another user gesture. Physical speaker audibility is
not established by execution in a headless emulator.

Machine-readable receipts/logs remain under ignored `output`; screenshots are
in this chat's approved visualization directory. Tests only target the named
empty emulator and development package, never a phone or real account records.

## Source review and remaining gates

The completed initial CodeRabbit review covers `0eb02e0..c1d0def`. Supported
issues are consolidated into `c1d0def..2e0b90d`; see the
[issue dispositions](2026-11-22-offline-audio-review.md). The completed
`c1d0def..2e0b90d` follow-up raises one refuted origin-check question and three
supported recovery issues. `2e0b90d..194e385` addresses these plus the page's
observed missing-provider blocker. That final narrow review is complete and
raises one minor issue, retained below. The completed receipts cover all 71,
29 and 6 changed text paths respectively, with no missing text paths in those
transitions. Binary images retain their separate evidence.

The remaining supported minor issue is retrying before an old v1 connection
has stopped blocking its upgrade: another open may queue behind the abandoned
request and wait indefinitely. Closing the blocking connection permits recovery,
which passes the browser journey. A future hardening change should bound the
acquisition or retain blocked-request state, with a retry-before-close regression.
This is retained explicitly as an older-preview migration follow-up, rather than
starting another review/rewrite pass. First installs use v2 directly; the actual
single-Activity Android first-install/current-version flows pass. It is not a
claim that this edge is fixed, and a zero-issue review is not claimed.

Codex inspection covers the native network/handoff boundary, complete pack
closure and transaction cancellation, storage-open recovery, stale playback
ownership, account-result/Forget races, issuer ownership/origin/body limits,
paid-through rules and standalone bundle module/secret exclusions. Browser and
emulator tests exercise those supported corrections.

The two texture binaries are unchanged publisher bytes from three-globe v2.31.0
`example/img`, with the publisher's MIT notice committed and bundled. Build
checks enforce SHA-256 `228deba2e4b600146bdcb6cfa359b8ead6aacc2b1c13550a29cd82824cfa1c01`
for `earth-blue-marble.jpg` and
`839b12da2e4dd346b256cebae72e10c479a102c8980a22084c41275e4b9a0e12` for
`earth-topology.png`. This is publisher/license/hash and renderer evidence,
not a claim that a text review bot inspected the image pixels.

The [prepared activation plan](../superpowers/plans/2026-11-22-offline-access-activation.md)
names the one new signing authority, three Production-only settings, matching
public key/APK, reviewed website publication and one owner receipt check. None
has been executed. Physical S24 sound/battery acceptance, reliable background
media, closed-app alarms, whole-platform native parity, real practice payments
and public app-store distribution retain their separate gates. Existing browser
clinical records remain untouched. No push, merge, deployment, provider setting,
hosted database/payment/email operation or account-preference write occurs.
