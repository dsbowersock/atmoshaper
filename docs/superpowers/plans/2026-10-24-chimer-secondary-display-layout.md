# Chimer auxiliary display and toolbar collision

## October 25 review follow-up

The separate four-PR publication/review approval now covers PR #52 and its
validated review fixes. Its latest follow-up changes only state-aware component
assertions and fixture state markers; all 43 focused checks and named lint/typecheck pass.
The [review audit](../../audits/2026-10-25-chimer-state-aware-layout-waits.md)
records the prerequisite failures and successful isolated validation. New-head
CI/Preview and included review are still required. Historical publication holds
below describe the original local candidate; they do not revoke the later grant.

## Scope and baseline

The built-app mobile screenshot retained during DSEG7 Modern verification shows
the auxiliary clock behind the immersive toolbar. Its fixed top/center rule and
the toolbar CSS are unchanged from the pre-font source. That comparison does not
claim a pre-font browser reproduction. The original local candidate started at
PR #51's reviewed head. The owner-approved eight-PR batch has since merged; the
current candidate is integrated on final main `af5373d`, with the original local
`68a116f` branch retained. This follow-up is not approved for publication.

## Implementation

1. Mark the currently auxiliary timer/clock with one transient DOM attribute.
   Preserve saved settings, accessible labels, actions and primary selection.
2. Let the existing immersive shell own a small lifecycle controller. Read the
   actual toolbar/top-control rectangles, viewport frame, auxiliary dimensions
   and a hidden CSS inset probe. Keep the ordinary desktop position whenever it
   fits. On collision, place the auxiliary display below the intersecting controls
   and reserve its bottom edge in the primary display's existing safe region.
3. Clamp the auxiliary display to the visual viewport's horizontal bounds and
   reduce only its accessory font scale when necessary. Measure stable layout
   dimensions rather than animated swap/glow transforms. Do not change the
   selected font or the primary font-fit owner.
4. Observe size, secondary-owner changes, font readiness and layout/visual viewport
   changes. Also observe the portal control root's class/style and child changes:
   inherited styles can move controls without resizing them. The display's own
   inline reservations are outside that subtree. Restore properties and disconnect
   observers/listeners on owner swap or unmount. Keep position stable while toolbar
   chrome fades.

## Validation

First reproduce the overlap using real timer/shell CSS and the actual vendored
font in cached Chromium. Add a named, network-isolated component/browser suite
covering phone portrait, narrow and ordinary landscape, wide desktop, display
swap, resizing, visible/faded/hidden chrome and cleanup. Exercise the real shell
lifecycle, not a replacement toolbar policy. Use the existing pure layout/font
and immersive source checks alongside focused lint/typecheck. Then validate the
actual inert-provider application build and inspect desktop/mobile screenshots.
No database, game, account, checkout, telemetry or external provider is involved.

## Delivery boundaries

The owner-approved PR #44-51 batch is complete, with final combined-main CI,
READY candidates and baseline public routing verified. This separate follow-up
may be prepared and verified locally; publication needs its own reviewable source
decision. No new push, merge, hosted configuration, media exposure, Production
promotion or Sentry activation is included. Preserve shared cached dependencies,
prior operation receipts and unrelated dirty worktrees. Remove only task-owned
browser/build resources after validation.

## Original October 24 local validation checkpoint

The real-shell baseline reproduced four failures/two passes under the old
placement. After the repair, all 40 named checks pass, including eight responsive
browser cases and the existing immersive/font regressions. Focused lint,
repository typecheck and the full inert-provider build pass. Six build and seven
suite guard receipts show zero network attempts, with no package download.

Sixteen built-application checks pass at 320x740, 390x844, 640x360 and 1440x1000,
covering the standalone clock, timer, Clock settings and display swap. Screenshots
were inspected. The protected primary display stays clear of the settings panel;
the existing landscape side sheet can still cover part of the auxiliary clock.
That deliberate panel priority is separate from this toolbar-clearance repair.
The evidence does not assert always-visible secondary text while editing.

The server/browser, owned source/build snapshot and two dependency junctions are
closed or removed; shared dependencies/schema, the existing typecheck cache and
receipts/screenshots are retained. The published font branch is unchanged. This
candidate was local and unpublished at this checkpoint; the eight-PR merge
decision was pending then and is now complete as recorded above.

## October 25 merged-main integration and fresh validation

The local integration starts on `af5373d` and retains all 80 pages, 62 API
handlers and reviewed Calendar source. An initial 320px focused failure led to
a deterministic regression that moves the real control root without changing
its dimensions or dispatching resize. The old helper fails that new case; the
additional lifecycle-owned mutation observer fixes it. All 41 named checks pass,
with seven denial-guard receipts and zero network attempts.

The reviewed Calendar suite passes 46 checks with one POSIX-only skip and 32
guard receipts. A first 90-second lint wrapper timeout has no terminal lint
outcome; a distinct focused-lint run passes in about 94 seconds. The full build,
including ordinary TypeScript validation, passes with six guard receipts and no
network, database or provider access. Cached dependencies and the local Inter
fixture were reused; the selected DSEG7 Modern binary is real and unchanged.

Sixteen actual built-app cases pass across the same four viewport sizes, covering
standalone clock, timer, Clock settings and primary display swap. Screenshots
were inspected. The runtime reports no client errors, server 5xx, external
attempts or non-read requests. Settings-sheet priority in landscape remains
intentional and separate from toolbar clearance. No account or game is exercised.

The owned server/browser are closed. Sixteen current runtime/test inputs match
the validated snapshot. Removed only that checked source/build snapshot, its
temporary generated archive and one dependency junction; shared dependencies,
Prisma schema, receipts and screenshots are retained. This integrated follow-up
remains local and unpublished. Whole-site/provider acceptance and release remain
separate gates.

## October 26 ordinary primary boundary review follow-up

The included review of 2a7b5ef completed and raised one valid outside-diff
ordinary-primary inset issue. The existing specialized timer-mode maxima are
correct; only the base ordinary rule needs to compare its complete control
inset against the already absolute secondary edge. The actual component
regression reproduces the failure and then passes, exercising both sides of
the maximum and accessory removal. All 44 focused checks, named lint, typecheck
and diff checks pass. The
[review audit](../../audits/2026-10-26-chimer-ordinary-primary-boundary.md)
records the narrow source change and evidence. The existing four-PR review/fix
grant covers this correction, CI/Preview and dependency synchronization, with
no PR/main merge, Production promotion or Sentry activation.

## October 26 production-marker review follow-up

The 213bd45 included review identified a valid gap between the inert fixture's
markers and RunningTimer's production wiring. Add source-contract coverage of
the actual guards and marker roles, including pure Clock's lack of an accessory;
use inert AST evaluation and mutation controls without importing the full app.
The suggested pure-Clock safe-top CSS change is not applicable because the
production timer guard excludes status `clock` and the visible clock is primary.
Preserve its runtime CSS and validate the source contract alongside the existing
component/font checks. Publication remains within the approved review-fix loop;
new-head CI/Preview and applicable included coverage remain separate gates.
