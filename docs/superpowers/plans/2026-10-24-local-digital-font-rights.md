# Selected DSEG7 Modern clock font

The owner selected DSEG7 Modern after comparing four free alternatives. This
replaces the provisional Classic candidate and supersedes seeking Digital-7
commercial permission. The permission inquiry remains unsent. The local source
change is authorized. The owner subsequently approved regular PR #51 and its
CI/Preview and included review/fix loop; merge and Production remain held.

## Implementation

Vendor the unmodified DSEG7 Modern Regular v0.46 WOFF2 and the author's original
copyright/SIL Open Font License 1.1. The font permits commercial website use
under that license; the application's proprietary license and legal operator
remain unchanged. See the [source comparison](../../audits/2026-10-24-free-clock-font-alternatives.md)
and [vendored notice](../../../public/fonts/dseg/DSEG-LICENSE.txt).

Keep the CSS family Digital, saved clockFontFamily digital choices, other
font options, accessible time text, routes and controls. Digits, colon, minus and
decimal use the segmented face; unit/meridiem letters retain the existing readable
fallback stack. No font package, global installation, binary modification or
internal font rename is needed.

The build-relative CSS font URL emits a fingerprinted /_next/static/media/
asset. The existing service-worker static policy can cache that URL without
changing cache identifiers or extending caching to another route.

Modern's wider digits exposed overlap inside the clock's legacy fixed slots.
Digital now measures each slot as 1ch, and its separators use their natural
width. The other font options keep their established em widths. Existing actual
content measurement remains responsible for fitting the complete clock/timer.

## Verification

The focused named scripts are npm run test:timer-font and
npm run lint:timer-font. Three tests pass: original font/license hashes, real
segmented digit stability and readable suffixes, and actual stylesheet glyph-box
fit. The overlap test first failed against the old slot widths, then passed with
the repair. Focused lint passes.

Actual application validation uses an isolated source snapshot, cached packages
and Chromium, inert provider/database settings and a network-denial guard. The
vendored Modern font is real; only the unrelated build-time Inter font uses the
existing local test fixture. No account, payment, game, room/token, database or
provider test is included.

The first build failed on Windows separators in that fixture. A second was
ownership-checked and stopped to correct the offline-delivery path. A third full
build passed, and ten real-app parent-fit/offline checks passed; visual review
then found the narrower per-digit boxes. Those receipts remain retained and do
not establish final visual acceptance. The fourth full build passes, including TypeScript. Ten strengthened actual-app
cases pass at desktop/mobile widths: primary glyph and parent fit, fullscreen,
setup/countdown, saved Digital selection and exact warmed-cache font readback
while offline. Zero external browser/server requests or provider/database
operations occurred. Screenshots were visually inspected.

Anatomime's actual solo/shared timer CSS was separately rendered with invented
00:30 and 30s display values at desktop/mobile widths. All four style cases
fit, with zero external requests and the browser closed. This is font styling
evidence, not a replay of the closed realtime/game verification.

The owned browser/server, two temporary dependency junctions and source/build
snapshot are closed or removed. Exact build-input hashes, results and screenshots
remain retained; unrelated worktrees and shared dependencies/Prisma are unchanged.
Regular PR #51 is now open under that publication approval. Its CI/review loop
is in progress at this checkpoint. Production is unchanged and merge remains held.

This evidence covers the selected font and primary display, not all immersive
controls/background combinations. The mobile running-timer image shows the
auxiliary clock under the open toolbar; that layout observation has not been
isolated against the base and remains a separate investigation before full
immersive-screen acceptance. Do not call the complete migration or site ready
on the strength of these font checks.
