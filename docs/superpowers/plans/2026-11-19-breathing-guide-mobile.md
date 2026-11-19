# Breathing guide: phone viewport and uninterrupted quick access

Status: implemented and verified locally on `codex/breathing-guide-mobile`;
not published.

## User outcome

The normal `/wellness/breathing` page should feel like one focused tool, fit a
phone's available viewport without ordinary scrolling and use the established
green/purple button materials. A global keyboard shortcut must expose the guide
without interrupting music, the current background or an active underlying tool.

## Evidence and design

The supplied phone screenshot shows stacked introductory/navigation/music cards,
a repeated tool heading, orange actions and the pacer below the first viewport.
The root MusicProvider persists across routes, while Clock/Chimer own their
backgrounds and route state. A navigation shortcut would therefore not preserve
every underlying activity. Keep the dedicated page as the normal entry and use
an accessible quick-access overlay for Alt+Shift+B. This follows the requested
fallback while keeping the current route/music/background mounted.

Use the existing Inter typeface and theme surfaces, leaf-green success material
(`--button-calendar-leaf`, approximately #40824f), purple CTA material
(`--button-cta-face`, approximately #bb19ff), foreground and muted text. These
are existing tokens, not a new global palette or button redesign. Preserve the
site's current light/dark themes. The breathing circle is the one animated focal
point; do not add decorative autoplay motion.

Phone hierarchy, centered within the shell's actual available space:

```text
Breathing guide             quiet Wellness / Music links
Coherent           Box                Settle

                 breathing circle
                 phase / seconds

             compact phase sequence
Start / Pause                         Reset
       short music / shortcut / comfort guidance
```

Use a compact two-column arrangement for short landscape space. Shrink the pacer
before controls; retain usable touch targets. At unusually large text zoom or
extreme heights, allow accessible overflow instead of clipping controls. Respect
reduced motion, keyboard focus and assistive announcements without reading a
quarter-second countdown on every update.

## Implementation boundaries

1. Replace the duplicated route chrome and card stack with one height-aware
   workspace. Reuse the existing preset timings and Start/Pause/Reset behavior.
2. Share the guide view between the dedicated route and a lazy quick-access
   dialog mounted alongside shared shell content, preserving media/background
   owners and avoiding a second guide on the dedicated page.
3. Guard the shortcut against typing/editable fields, composition, repeats,
   handled events and unrelated open dialogs. Alt+Shift+B toggles the quick
   guide; Escape closes it and returns focus. On the dedicated page, focus its
   existing Start/Pause control instead of opening another instance.
4. Scope styling to the breathing workspace; preserve unrelated routes, global
   button tokens, legal/clinical behavior, storage and provider configuration.
5. Add focused regression coverage for the timing/shortcut domain and rendered
   phone fit, landscape, palette, start/pause/reset, shortcut/focus and underlying
   media/background continuity. Add focused comments for lifecycle and layout
   constraints.

## Validation and handoff

Use the existing inert Browser-QA environment; do not load Production secrets or
run provider/database/payment/email operations. Verify the rendered flow through
the connected Browser controls and repository tests, including small phone,
ordinary phone, short landscape and desktop sizes, plus zoom/reduced motion.
Capture screenshots outside tracked source. Run applicable named lint/typecheck
and browser/logic checks. Keep failures/skips and physical-audio limitations
explicit. Reconcile canonical state/log with actual outcomes.

This local work does not authorize a push/Preview, merge, deployment or promotion.
Prepare the finished source and validation evidence before requesting any new
publication authority. Earlier release operations remain closed.

## Accepted implementation and verification

Implemented the shared compact guide and lazy quick-access dialog. The three
timings remain 5/5, 4/4/4/4 and 4/7/8. Elapsed-time derivation drives countdown,
phase, cycle and continuous circle scale, with throttled-tick catch-up and
pause/unmount cleanup. Explicit ready/running/paused state covers a pause before
the first timer tick. The header wraps and actions stack at enlarged text; the
shell reserves the measured bottom navigation/player space. All styling stays
within this workspace and the existing palette.

Validation on November 19:

| Check | Accepted result |
| --- | --- |
| `npm run test:breathing` | 26 passed, no skips/failures |
| `npm run test:ci-harness` | 162 passed, no skips/failures |
| `npm run lint` | Pass |
| `npm run typecheck` | Pass |
| `npm run build:browser-qa` | Pass, 115 pages; providers/telemetry inert and database blank |
| Focused `test:browser` | 15 passed, one desktop-inapplicable existing mobile-shell skip; zero retries/failures |
| Connected Chrome review | Meaningful page, no framework overlay, no captured warnings/errors; controls/themes and overlay above Clock verified |

The accepted browser command selects `public-routes.spec.ts` and
`app-shell.spec.ts`, both desktop/mobile Chromium projects, one worker, and grep
`Breathing|RSC session snapshot count|anonymous quick actions stay focused|narrow mobile keeps every tool`.
Output and screenshots use a dedicated directory outside the repository.

Normal-size tests cover 320×568, 360×640, 390×714, 412×824 and 667×375; all
patterns fit without page scrolling and controls retain 44px minimum height.
Additional checks cover the full page with a playing music toolbar, 200% root
text reachability without sideways overflow, reduced motion, immediate pause,
reset, typing/modal guards, same-page focus, toggle/Escape and reopen reset.
The fixture-backed Last Transit journey uses real native media methods with
exact external fixtures; opening/running/closing the guide issues no new
play/pause call and retains the original background node and route.

Connected Chrome manual review uses its normal zoom/window geometry (including
632×979 and 1707×1200 CSS viewports), rather than claiming its outer-window
override produces exact phone emulation. Exact phone geometry is verified by
the automated device contexts. Temporary overrides are reset. Screenshots show
the phone composition, landscape and quick overlay. An early sandbox junction
failure and sandbox browser-cache lookup are environment failures; approved
native runs pass. The known Sentry import deprecation and inert Anatomime
initialization warning do not represent new browser/application failures.

Limits: no physical handset, Safari/iOS, screen-reader listening or speaker-output
acceptance is claimed. No provider writes, live media mutation, payments, email,
deployment or account creation occurs. The loopback QA preview may be started
with `npm run start:browser-qa -- --port 3014`; it does not deploy the candidate.
