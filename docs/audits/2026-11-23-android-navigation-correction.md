# PR #81 mobile navigation correction

The owner-approved `b2053cb` amendment passes fresh preflight and its one
additional push/protected Preview. Preview acceptance checks 21 entry pages,
three Home layouts, five Clock layouts, both digital fonts, the app marker and
Digital Asset Links, with no real writes or page errors. Current-head Codex
review then identifies one supported native Link lifecycle omission. Hold the
operation before merge/Production build/promotion. Public `5758fcb` is unchanged.

## Confirmed behavior and focused change

On the actual prior packaged asset tree, expand Atmosphere in the mobile drawer
and select Music. The URL changes to the Music destination while the drawer
remains visible and makes the underlying page inaccessible. The shared sidebar
already supplies `closeMobileSidebar` through `onNavigate`; the native Link
adapter forwards that prop to the DOM instead of consuming and invoking it.

Correction `2b06d64`, finalized by `d61de9a`, calls the synchronous, cancellable navigation callback before
handled internal navigation and keeps it out of DOM props. Preserve existing
native/connected route ownership and normal modified/external clicks. Downloads
retain their browser behavior without firing the navigation lifecycle. The
focused runtime test checks callback order, cancellation, prevented clicks,
external/protocol-relative links, new tabs, modifier gestures and downloads.
The actual mobile browser case checks Music and Breathing selection, drawer
closure and restored focus. Its initial fixture omitted expanding the group;
that setup failure is not the before/after proof. The separate old-tree journey
confirms destination-open/drawer-still-visible before correction.

All 14 focused contract/runtime cases and all ten shared browser cases pass,
including real online playback, explicit downloads, offline reload/navigation,
timer recovery and PDF output. Focused native-source lint and full TypeScript
pass. The normal 0.4.2/version-code-6 APK passes Android build/lint and v2
signature verification with the unchanged development certificate. Its SHA-256
is `8f603319474beaf5650d278d1ce802e93eee37a8fd8d731536614607d0264da2`.

CodeRabbit completes the four-file review at `2b06d64` and raises one conditional
edge case: `download={null}` is an absent React attribute but the new guard treats
it as a download. Confirm the actual rendered attribute behavior, then correct
nullish absence in `d61de9a` and test both markup and routing for undefined, null,
false, true, empty-string and filename values. Codex Standards and Spec reviewers
independently inspect the final combined four-file correction at `d61de9a`,
verify the disposition and report zero supported outstanding issues. Do not count
the initial non-login-shell command-not-found as a review; the existing login-shell
CLI completes the actual review without an installation or account change.
The final matching `8f603319` APK passes the complete normal-APK emulator journey
once with zero failures/skips: upgrade from the accepted version 3, retention of
both actual downloads/settings/receipt identity/deadline, airplane-mode station
playback across breathing, fullscreen Back and the actual Android PDF dialog.
The earlier `b959f79c` check is preserved separately rather than used as proof for
the final bytes. Stop only the exact task-owned emulator afterward, preserving
its data and all other devices. No physical S24 or connected-origin success is
claimed. The previous accepted installers remain. The distinct handoff is
`output/android/AtmoShaper-shared-website-preview-0.4.2-8f603319.apk`.
The [prepared amendment](../superpowers/plans/2026-11-23-android-navigation-correction-publication.md)
requires approval of the final corrected head before another push/publication.

The previously approved `b2053cb` completes all seven hosted checks successfully.
Those results remain evidence for that source; fresh checks on the final corrected
head and eventual merge are still required.

## CLI sign-in investigation

Chrome and the publishing CLI have separate sessions. The renewed CLI login
saves both its access and refresh credential in the existing configuration
location; no environment token overrides it. The installed CLI clears its
saved authentication after a token-refresh error. The exact preceding refresh
failure was not retained, so a concurrent-refresh bug or filesystem/network
cause is not asserted as proven. The guarded operator uses one explicit config
location, sequential Vercel calls and classified failure diagnostics that contain
no credential values. No new API token or provider setting is introduced.
