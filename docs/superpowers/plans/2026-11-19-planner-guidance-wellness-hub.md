# Planner guidance and Wellness tool hub

Status: **implemented and verified locally** on `codex/planner-wellness-polish`,
based on published `fa3a030` and its local completion receipt. Not published.

## Requested outcome

Match Startup Costs and Break-Even to the compact Income Planner layout. Make
currency, percentages and time units visible in both forms, and explain what
belongs in each field in plain language. Replace Wellness's oversized intro,
separate music/breathing containers and long stack of recording tools with a
compact landing hub that opens one selected tool at a time.

## Implementation

1. Extend the existing number-field component with optional visible units and
   descriptions connected through `aria-describedby`. Reuse it in Income;
   preserve native numeric values, calculations, IDs, defaults and storage.
   Explain amounts and periods, fixed versus per-session costs, tax-estimate
   inputs, time off, hands-on hours and optional wage comparison. Copy must
   describe each calculator's actual model rather than invent financial advice.
2. Reuse the Income layout's compact header, optional guidance, narrow-width
   constraints and result tiles for Break-Even. Clarify one-time, monthly and
   yearly amounts, prevent duplicate expense counting and preserve dynamic
   add/remove/reset and device-draft recovery.
3. Make Wellness a compact header and grouped launcher for calming tools,
   recording categories, range of motion, timeline, patterns and appointment
   reminders. Open one pane within the existing page, with a clear return to
   all tools. Keep mounted drafts, pending-action admission, acknowledgments,
   existing server actions/data queries and confirmation flows intact. Preserve
   `/wellness#quick-log` and breathing/music navigation. Keep keyboard focus
   meaningful when entering and leaving a tool.

## Verification and boundaries

Use isolated, invented-data QA only. Cover both planners at 320–412px, landscape,
desktop and enlarged text; unit/help associations; calculations and reload
persistence; Break-Even add/remove/reset. Test Wellness's initial launcher,
category selection, pane isolation, draft retention, in-page practice entry,
timeline/report access, hash quick access and keyboard return. Retain existing
action lifecycle and privacy/source guards. Run focused lint and the inert
TypeScript/build, inspect rendered screenshots and console health.

This request authorizes local implementation and verification. The previous
publication operation is closed; no deployment, live financial or wellness
record writes, provider-setting changes, schema or storage migration, clinical
data access, or new dependency is part of this change.

## Completed verification

- 46 planner calculation/source/storage tests pass, including an explicit check
  that the new Break-Even save label does not claim a saved draft after denied
  device access. All 11 existing action-lifecycle cases and 62 clinical/Wellness
  checks pass. Shared-shell ownership and exact stylesheet inventory pass.
- Focused lint passes. The final inert build passes compilation, TypeScript and
  all 115 pages. Financial domain, Prisma and dependency files are unchanged.
- The final browser sweep passes 13 of 14 selected cases; one existing Income
  readiness text locator also matches a hidden streamed h1. A semantic visible
  heading locator corrects that test, and the complete affected case passes in
  both desktop/mobile Chromium. All 14 selected cases have passing evidence.
  Accepted checks use no configured retries or skips.
- Both planners fit 320–412px widths, landscape/desktop and 24px root text.
  Units and accessible descriptions are verified; calculations, storage reload,
  Break-Even row add/remove/reset and optional guidance work. Weekday inputs
  size by card width; narrow money rows give the amount a full row; action labels
  wrap at large text. Numeric values remain visible and all control borders fit.
  Native text/date editors keep their normal internal editing scroll behavior.
- Wellness starts with tool choices and hidden forms. Category selection,
  keyboard focus, unfinished-note retention, anonymous practice entry, timeline,
  patterns, range of motion, same-page Quick Log and return navigation pass.
  Open check-in and ROM panes also fit narrow enlarged-text layouts. Existing
  breathing shortcut/focus behavior and route/media layout continuity pass.
- Connected Chrome confirms the three local pages, real units/help, optional
  guidance, category and appointment navigation, with no captured warnings or
  errors. Exact phone sizes come from automated device contexts because the
  existing Chrome window/zoom changes manual CSS dimensions. Screenshots remain
  outside source in the session's `planner-wellness-polish` evidence directory.

Local review runs at `http://127.0.0.1:3018/`; the three preview tabs are left
open. Physical-phone, Safari, screen-reader listening and live signed-in save
acceptance are not claimed. Original save/confirmation behavior has isolated
action and privacy coverage. No release push, provider write or deployment
occurs; the previously published source remains the public release.

## Purple button follow-up

The owner requests replacing outline launchers with the established purple
button material and centering their text. All 13 now use the existing `cta`
variant, with icons above centered title/description lines. Existing responsive
and draft/navigation Wellness cases pass in desktop/mobile Chromium (two cases,
no retry/skip). Focused lint and the inert 115-page TypeScript/build pass.
Connected Chrome confirms the purple faces, centered text and working tool
selection without captured warnings/errors. Screenshots are in the external
`purple-buttons` evidence folder. This is still an unpublished local candidate.

The owner subsequently clarifies the final grouping: restore the original green
Breathing Guide and Glow Music styles; retain purple for eight check-in tools;
use green for all three Review & plan tools. Centered content remains. This
three-variant correction passes focused lint and the inert 115-page
TypeScript/build. Chrome confirms the final materials, centered labels and
Timeline/return interaction without captured warnings/errors. The final image
is `wellness-button-groups.jpg` in external evidence. No behavioral changes,
additional tests, provider writes or publication are part of this correction.

## Physical and context grouping follow-up

The owner's next revision uses regular blue for Breathing Guide and leaves
Music's Glow style intact. Physical sensations now groups Range of motion,
Activity, Incident and Body check-in with orange buttons. Context groups Work
context, Feelings, Sleep and Home care with the shared teal setup tone. Review
& plan remains green; centered icons and label lines remain. Group metadata is
presentation-only: existing category values, ROM pane and draft/focus behavior
are preserved. No shared Button or global palette changes are required.

Focused lint, the inert TypeScript/115-page build and the two existing Wellness
desktop/mobile flow cases pass without retries/skips. Those cases cover widths
320 through 1280, enlarged text, category selection, draft retention, practice
entries, timeline/pattern/ROM panes and Quick Log/keyboard return. Connected
Chrome confirms exact group membership and materials, Feelings/return navigation
and no captured warnings/errors. The external `physical-context` directory has
phone captures; `wellness-physical-context.jpg` shows the complete desktop hub.
The preview remains on loopback port 3018; this revision is not published.
