# Clear Wellness recording flow and separate drafts

Status: implemented and verified locally on `codex/wellness-recording-flow`,
from `3e923dd`. No publication or live recording is included.

## Owner request and finding

Activity, Incident and Body check-in feel indistinguishable, the recording type
is buried beneath other fields, and the page is too wordy to know where to start.
The former dirty-draft guard also opens the old category after a different named
launcher is clicked. This preserves input but contradicts the selected tool.

## Implementation

1. Put one full-width recording-type selector first in both DOM and visual order.
   Use the same visible names on the hub, selector, heading and save action.
2. Tailor the main task: Activity asks what the user was doing; Incident asks
   what happened; Body check-in leads with the body map; Feelings uses the wheel.
   Work/Home and Sleep have their own short primary prompts.
3. Remove repeated page/form introductions in the active workspace. Keep body
   areas optional for Activity/Incident, collapse sensation/intensity and timing/
   context groups, and leave intensity empty unless the person supplies a value.
   The existing privacy acknowledgment remains before the final save action.
4. Keep an in-memory draft per category, including native text/check boxes,
   optional-group expansion, controlled body locations and feeling words. A
   named launcher always opens its named category. A deliberate category change
   restores that category's draft without copying or relabeling another one.
   Restore native controls after React commits the category; explicitly align the
   controlled category select after native reset. Save clears only that entry.
5. Keep action pending/admission/result ownership, ROM/comfort drafts, stored
   category tokens, export shape and existing privacy boundaries unchanged.
   No new browser storage, provider, dependency or database schema is added.

## Design

Retain the site font, orange physical actions, teal context actions and purple
Feelings action. The selector establishes the task, the main input invites one
useful observation, optional sections offer more detail, and a named save action
ends the flow. This uses a single form rather than adding mandatory wizard steps.
Keyboard order follows the same progression as the visible layout.

## Verification

Run existing domain, privacy and real-handler lifecycle checks; lint changed
code and create an inert Browser-QA build with TypeScript. Verify the complete
desktop/mobile Wellness/ROM suite, including exact launcher destinations, first
control order, distinct prompts, per-category native/controlled draft restoration,
saving one draft without clearing others, and timeline metadata isolation.
Retain body surface, feelings gesture, theme, narrow and enlarged-text coverage.
Review phone screenshots in a separate preview tab so existing drafts are not
discarded. Mirror actual results into state/log, then commit locally.

## Verification receipt

- `npm run test:wellness-detail`: all 76 domain, privacy and real-handler lifecycle
  checks pass. The save control is found by its existing data hook in inert-owner
  tests so its visible category-specific name does not weaken handler coverage.
- `npm run lint:wellness-detail`: final source passes without warnings. Both
  `test:breathing-guards` checks pass. The final inert Browser-QA build passes
  TypeScript and generates all 115 pages.
- All 44 desktop/mobile Browser-QA cases pass in 5.8 minutes. They include
  first-control order, tailored questions, native/controlled draft restoration,
  optional-section state, separate saves, metadata isolation, the existing body
  surface and movement flows, the continuous feelings wheel and its native touch
  emulation, plus themes, narrow widths and enlarged text.
- In-app phone review at 390x844 confirms distinct Activity/Incident/Body starting
  points and an Activity note returning after category changes. The normal desktop
  viewport was also reviewed on reset. Fictional review notes were discarded in
  the isolated preview; no actual entry was saved through computer use. The
  temporary viewport override is reset and existing preview tabs remain untouched.

Images and command logs are outside the repository. New clean preview:
`http://127.0.0.1:3020/wellness`, left open to Activity. No new dependency, browser
storage, provider setting, hosted write or publication was needed.
