# Chimer auxiliary display and toolbar collision

## Scope and baseline

The built-app mobile screenshot retained during DSEG7 Modern verification shows
the auxiliary clock behind the immersive toolbar. Its fixed top/center rule and
the toolbar CSS are unchanged from the pre-font source. That comparison does not
claim a pre-font browser reproduction. PR #51 remains fixed at its reviewed head;
this separate local branch starts there and is not approved for publication.

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
   changes. Restore properties and disconnect observers/listeners on owner swap
   or unmount. Keep position stable while toolbar chrome fades.

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

Keep the current eight-PR merge proposal unchanged and await its owner decision.
This follow-up may be prepared and verified locally; publication needs its own
reviewable source decision. No push, merge, hosted configuration, media exposure,
Production promotion or Sentry activation is included. Preserve shared cached
dependencies, prior operation receipts and unrelated dirty worktrees. Remove
only task-owned browser/build resources after validation.

## Completed local validation

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
candidate is local and unpublished; the eight-PR merge decision remains pending.
