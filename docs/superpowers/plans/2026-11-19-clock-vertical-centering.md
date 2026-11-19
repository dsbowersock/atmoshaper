# Clock and timer: centered visible digits and a real bold face

Status: published as `81b18e8` through
[PR #72](https://github.com/dsbowersock/atmoshaper/pull/72). The separately
owner-approved publication passes hosted and actual Production/map/public
gates; see the [receipt](../../audits/2026-11-19-breathing-clock-publication.md).
The original local implementation and acceptance record remain below.

The owner's phone screenshots show both the running clock and duration setup
digits above their intended center, with strokes thinner than desired. Preserve
the selected DSEG7 Modern design, saved `digital` setting, controls/backgrounds,
other font choices and the existing original Regular font used elsewhere.

The real Regular font fixture reproduces an approximately 8px upward visible-ink
offset at 48px type despite a centered element box. Clock mode also applies an
explicit upward four-viewport-percent transform. Neither whole-element bounds
nor width-only font tests can accept vertical ink alignment.

Use the author's unmodified DSEG7 Modern Bold from the same pinned v0.46 release.
Verify its release license is byte-identical to the preserved original notice.
Register a separate `Digital Clock` CSS face with weight 700 and normalized
ascent/descent/line gap, keeping the existing `Digital` face and unrelated timer
consumers unchanged. The selected `digital` value still controls the same clock
setting. Apply the bold face/weight only to Clock/Chimer displays and duration
setup. Center setup's digit row and remove Clock's deliberate upward translation.
Retain measured immersive reservations, user sizing, effects and fit behavior.

Verify actual font ink centering, real bold loading, equal digit widths, full
glyph advances and fallback suffixes. Exercise rendered Clock, duration setup and
running timer at phone portrait/landscape and desktop sizes, including toolbar
reservations and 12/24-hour/seconds variants where applicable. Capture screenshots
outside source, inspect them, and run the applicable font/layout/typing/build
checks. Local QA must keep providers, telemetry and database access inert.

Finish the already active breathing-label correction alongside this work. The
prior Production release remains unchanged; source work does not authorize
push, Preview, provider writes or deployment.

## Accepted result

The separate bold face is 5,176 bytes, SHA-256
`05eab7015f3aaba2ffc32b4d29362f9b470e1a4afe8d2c8332d301bb061a83cf`.
Source: [author's v0.46 release](https://github.com/keshikan/DSEG/releases/tag/v0.46),
linked by the [author's font page](https://www.keshikan.net/fonts-e.html).
The preserved license and original Regular binary hashes still pass.

The font's line-metric correction also needs U+0020 coverage: CSS selects the
[first available font](https://www.w3.org/TR/css-fonts-4/#first-available-font)
for line metrics using that character. Excluding it leaves the fallback
monospace strut in charge and the real painted ink remains roughly 8px high at
48px type. A negative check reproduces that failure. With space included,
painted digit/separator centers fall within 1.5px of their line center; this
allows the font's differing segment tips and pixel rounding. The test scans
margin around each actual glyph rather than clipping its screenshot to the
line box. Unit and AM/PM labels explicitly use their existing readable fallback
family for Digital, while other saved font choices retain inherited styling.

Validation on November 19:

- `npm run test:secondary-clock`: 49 passed, including five real font checks,
  immersive panel/viewport reservations and actual accessory/toolbar geometry.
- `npm run lint:timer-font` plus focused lint of the changed breathing component
  and browser spec: pass.
- `npm run build:browser-qa`: pass, including TypeScript and all 115 pages.
  No live provider, telemetry or database is enabled.
- `npm run test:browser -- tests/browser/public-routes.spec.ts` with grep
  `Breathing|Clock keeps bold|Timer setup and running`, both desktop/mobile
  Chromium projects, one worker and external dedicated output: 16 passed,
  no retries/skips/failures.

Clock checks cover 320×568, 390×714, 780×360 and 1280×900 in 12-hour and 24-hour/
seconds modes. Setup checks additionally cover 746×284; its digit rows are
centered and contained in the duration field. A generic one-minute local timer
starts, uses the real bold face, centers within its reserved stage and ends.
Breathing checks include 13 viewport/text-size combinations with true glyph
containment, ordinary no-scroll fit and unchanged audio/background ownership.
Connected Chrome verifies Clock, setup and duration adjustment, with zero center
offset for setup's digit buttons, real 700-weight Digital Clock styles, an
unshifted Clock transform and no captured browser warnings/errors.

The first post-button-fix browser run had one mobile shortcut assertion before
hydration completed. The fixture now proves Start/Reset interaction before its
chord, with no delay/retry workaround; the final full selection passes.

Screenshots and retained output remain outside tracked source. Chromium/device
emulation does not establish physical Android, iOS/Safari, screen-reader or
speaker-output acceptance. The previous public deployment remains unchanged.
