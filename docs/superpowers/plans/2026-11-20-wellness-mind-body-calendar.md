# Mind, Body, Context and a private personal calendar

Status: implemented and verified locally on `codex/wellness-mind-body-calendar`, from
`2598102`. Source/local validation only; no publication or live data operation.

## Request and current behavior

The owner wants Mind for internal state, Body for physical recordings, Context
for surroundings, and Review & plan. They also want their recordings visible
in the project's Calendar. Current Calendar requires practice membership or
practice creation and displays scheduling events, not Wellness recordings.
The existing Wellness companion lists appointments and generic reminder rules.

## Design and scope

Use the established site font, dark/light surfaces, centered tactile tool buttons
and existing materials. Reference swatches are charcoal #1b1c20, foreground
#f5f5f5, body orange #ff7a1a, mind purple #b91aff, context teal #51afb1 and review
green #488251; actual styles reuse semantic theme variables and Button variants.
Mind contains Feelings/Sleep; Body contains the existing movement, activity,
exercise, incident and body tools; Context contains Work/Home. Stored categories
and drafts keep their meanings.

The calendar should open on the dates, not a large introductory card. A compact
month grid leads to the selected day's dated items. Use one-column stacking on
phones and a calendar/day arrangement when space permits. Counts, text labels,
44px targets and native focus/keyboard controls carry the hierarchy.

    [My calendar] [Practice scheduling]
    [Previous] November 2026 [Next] [Today]
    [All items / Recordings / Appointments / Reminders]
    [seven-column month]  [Selected day's items]
    [load more if needed] [open an entry to read its full details]

Retain practice scheduling's existing routes, roles, editing and Google sync.
Every signed-in user gets a My calendar view without creating a practice. For
nonmembers the Calendar entry point opens this view, with explicit practice
creation still available. Practice members can switch from their existing
workspace to My calendar. The Wellness appointments/reminders tool also uses
this private view, including in-memory practice entries when signed out.

## Data boundaries

Read the signed-in owner's non-deleted Wellness entries for the visible month,
with stable pagination and explicit partial/loading/error states. Do not rely
on the 25-entry timeline or 30-day report window. Load only appointments linked
to that same user's client identity, and generic schedules from their existing
Wellness preference. Ignore client-supplied owner/practice identities.

These are read-only projections in the account owner's interface. Do not create
CalendarEvent rows, modify availability, copy notes into practice event payloads,
sync records to Google, send notifications, or expose a therapist dashboard.
Professional notes/intake/ROM vaults remain local-first. Private responses remain
outside PWA caches, telemetry, preferences and provider adapters. No migration,
new service or dependency is needed. The existing consent and save/delete/export
owners remain responsible for recordings.

## Implementation and validation

1. Centralize display labels/group mappings and regroup launchers, preserving
   category tokens, drafts, orange/teal/green actions and the purple mind material.
2. Add bounded, owner-scoped range reads under the Wellness domain and pure local
   month/day/recurrence helpers. Page stably through records and appointments.
   Generic reminder occurrences describe the current rule, not past delivery.
3. Reuse one readback card for timeline and private calendar entry detail. Show
   all existing record types, including comfort and exercise, without editing
   completed entries through scheduling actions.
4. Add the private personal route, Calendar view navigation, nonmember entry
   point and in-memory Wellness companion integration. Preserve practice setup
   and required-read failures; private read failure must never look like no data.
5. Test date boundaries, DST, pagination, auth/ownership, deleted/duplicate rows,
   stale responses, recurrence, failed reads/retry and practice isolation. Run
   focused domain/action checks, existing Calendar recovery checks, privacy/shell
   guards, lint, TypeScript/build and desktop/mobile browser journeys.
6. Review the actual phone and desktop interface in a new inert preview, preserve
   existing user tabs/drafts, reset the temporary viewport, record receipts and
   commit locally. Publication remains separate.

## Verification receipt

- All 85 existing Wellness/domain/action/privacy tests pass. All 30 private
  Calendar, date/DST, auth, keyset pagination, stale-response, failure/retry,
  account-change and practice recovery checks pass. Existing save/delete/export
  ownership and all prior recording formats remain covered.
- Lint and both shell/style inventory guards pass. The corrected inert build
  passes TypeScript and generates all 116 pages, including the private route.
- Initial browser review found a test using a date outside the rendered week
  rows; that test date was corrected. It then exposed overflowing reminder rows
  at narrow/enlarged-text sizes. Labels/actions now wrap without truncation.
  Visual review also removed a duplicate Calendar heading, introduction and
  inset card, putting the dates first.
- In-app 390x844 and normal desktop review confirms the four group colors,
  compact month/day view and real month navigation. The temporary viewport is
  reset and the new preview is left open to the grouped tools. Manual in-app
  review did not submit entries; automated journeys used fictional in-memory
  practice records. Existing tabs remain untouched. JPEGs/logs stay outside source.
- Personal views are keyed by authenticated account; sign-out also hides a
  loaded private snapshot before a remount. No practice CalendarEvent, external
  provider, availability, notification or professional-vault path is changed.

All 54 final desktop/mobile browser journeys pass in 6.4 minutes. They include
group destinations/colors, full readback, deletion updates, older month/date
navigation, reminder previews, keyboard controls, private-route sign-in gates,
themes, narrow widths and enlarged text, alongside all prior body/feelings/ROM/
comfort/Exercise behavior. All 115 focused tests, two guards, lint and the final
inert TypeScript/116-page build pass.

Preview: `http://127.0.0.1:3022/wellness`, open to the grouped tools. No private
record, provider/database write or publication was performed.
