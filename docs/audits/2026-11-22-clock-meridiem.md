# Clock AM/PM position and lettering - local verification

The owner requests AM/PM in the unused space beside the leading hour digit,
allowing the final minute/second digit to occupy the row's trailing edge. The
follow-up requests the clock's digital lettering style.

## Implementation

- Extract current-time markup into `app/chimer/current-time-display.tsx`, used
  by the existing Clock, secondary clock and display-effect layers. Keep the
  fitting stage and sizing algorithm intact.
- In digital English 12-hour mode, reserve two hour cells, hide the leading
  zero for 1-9, and place AM/PM out of flow inside the first cell. The visible
  1 at 10-12 retains its full advance and never overlaps the label. Width stays
  stable across hour and AM/PM changes. Other fonts, localized day-period text
  and 24-hour mode retain their existing layout.
- Use unmodified DSEG14 Modern Bold v0.46 for the label, beside the unchanged
  DSEG7 Modern Bold numerals. The seven-segment M is arch-shaped; the Modern
  alphabet companion supplies readable segmented lettering. Its 5,916-byte
  asset, original hash and byte-identical release license are recorded in
  `public/fonts/dseg/README.md`. No font purchase or internal binary modification.
  [Author/source](https://www.keshikan.net/fonts-e.html),
  [pinned release](https://github.com/keshikan/DSEG/releases/tag/v0.46).
- Limit the label face to space/A/M/P. Ordinary Digital consumers and timer unit
  labels keep their existing faces. Saved font/background settings are retained.

## Verification

- `npm run test:clock-meridiem`: 111 checks pass, including real original fonts,
  actual ink/label bounds at phone, landscape and desktop sizes, 1/9/10/11/12
  AM/PM, seconds, stable width, 24-hour mode and other selected fonts. The binary
  font hashes and original notice remain checked.
- `npm run test:clock-entrypoints`: all 238 existing regressions pass. An initial
  run lacked the installed browser cache path; supplying the established path
  resolved that validation prerequisite without downloading a browser.
- Full route type generation and ordinary `npm run typecheck` pass. Focused
  lint covers the component, renderer, metrics, tests and preview acceptance.
- `npm run verify:clock-meridiem-preview` uses the actual local `/clock` route
  with fictional settings, fixed AM/PM times and inert provider configuration.
  Its acceptance checks enlargement controls, containment, correct loaded faces
  and the final digit reaching the row's trailing edge. The existing fitter's
  safety limits are retained; no claim requires filling every viewport pixel.

Early preview checks read an increment during a pending fit, and an auxiliary
route could expose the app bar over it. The final acceptance uses the canonical
Clock route, waits for the immersive shell and observes fit completion. A
temporary 97% viewport-width assertion was outside the request and existing
fitter contract; it is replaced with the requested trailing-digit geometry,
while keeping containment and real maximum-size controls checked.

Screenshots and local receipts are ignored under `output/clock-leading-period/`.
Emulated Chromium does not establish physical-device/Safari acceptance.

## Release status

This remains local on `codex/home-dashboard` with the earlier home/onboarding
work preserved. No account, provider, database, live email/payment, deployment,
push or merge operation is performed. Source reviews and applicable release
checks remain required before separately authorized publication.
