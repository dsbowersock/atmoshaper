# Exercise recording and personal progress

Status: implemented and verified locally on
`codex/wellness-exercise-tracking`, from `c158f69`. No publication is included.

## Owner request and scope

Add a distinct Exercise recording type to Wellness, with useful gym measurements
and room for people recording an existing physical therapy or occupational
therapy routine. Keep entry quick and optional so a person can record what is
useful now and compare it over time.

This belongs to the existing consumer self-tracking domain described in
[Privacy and PHI](../../wiki/privacy-and-phi.md). Anonymous entries stay in
memory. Signed-in entries use the existing privacy-acknowledged, owner-scoped
Wellness actions and export/deletion contract. This does not introduce therapist
records, clinician sharing, professional care plans or exercise prescriptions.
No new persistence service, migration, dependency or browser storage is needed.

## Implementation

1. Add Exercise to the physical launcher group, category selector and timeline,
   and Exercise progress to review tools. Retain existing orange/green actions.
2. Start with a name, then type and context. Types cover strength, cardio,
   mobility/stretching, balance and everyday-task practice. Context is general,
   PT or OT. A name alone is sufficient.
3. Offer optional sets/reps/weight/hold time, duration/distance, equipment or
   assistance, side, effort and comfort. Support pounds, kilograms, bodyweight,
   bands/other resistance, miles, kilometers and meters. Define the two ratings
   in opposite directions explicitly. Do not supply suggested loads or doses.
4. Keep measurements controlled within each category's in-memory draft. Reusing
   an exercise copies its identity and units only, never completed measurements.
   Preserve the existing synchronous action lock, privacy and failure ownership.
5. Normalize a versioned exercise record under the existing metadata field.
   Require known choices; bound sets and numbers; reject invalid measurements
   rather than clamping. Blank stays missing and explicit zero stays zero.
   Strip unrecognized fields, unrelated category data and preference-sync keys.
   Keep exercise content outside diagnostics, analytics and symptom averages.
6. Load the latest 250 owner-scoped exercise entries separately from the shorter
   timeline window, plus entries added during this visit. Deduplicate overlapping
   windows. Exclude invalid/future entries from progress. Compare only the same
   normalized name, kind, context, side and equipment. Separate weight/distance
   units in charts, with real timestamp spacing and gaps for missing values.
   Show the last 30 matching entries in the chart and all loaded matching entries
   with full set details below. Do not infer recovery or whether higher is better.
7. Preserve export readback and soft deletion. Deletion removes the corresponding
   entry from both the timeline and exercise history in the current view.
8. Keep server-rendered tool launchers disabled until their client handlers are
   connected. Initial regression checks found two lost early launch clicks;
   delayed-script browser coverage must demonstrate disabled static controls,
   enabled hydrated controls and a successful first exercise launch.

## Field coverage references

The [ACSM resistance training overview](https://acsm.org/resistance-training-guidelines-update-2026/)
informed support for loads, volume, bands and bodyweight. The
[NHS exercise resource](https://www.nth.nhs.uk/resources/standing-exercises/)
informed the plain-language reps/sets distinction. The
[AOTA occupations overview](https://www.aota.org/practice/domain-and-process/occupations-everyday-activities)
informed everyday-task practice alongside gym exercise. No exercise prescription,
dose recommendation, external artwork or proprietary routine was copied.

## Verification plan

- Domain checks: strict records, bounds, zero/missing values, context/side/unit
  distinctions, identity-only reuse, history dates/deduplication and gaps.
- Execute the real server action with inert auth/Prisma boundaries: validate
  before writes, preserve owner scope, reject unauthenticated calls, export
  normalized exercise records and retain deletion/admission owners.
- Check preference/diagnostic exclusions and symptom report separation. Run
  focused lint, stylesheet/shell guards and an inert TypeScript/Next build.
- Run the complete Wellness/ROM desktop/mobile browser suite, including exercise
  drafts, sets, invalid input, PT/OT task practice, cardio, units, progress,
  deletion, themes, narrow widths and enlarged text. Existing body, feelings and
  movement flows must remain usable.
- Review a separate phone/desktop preview without altering the owner's older
  tabs. Keep fixtures and receipts outside source, mirror results into state/log
  and commit locally. Publishing remains a separate step.

## Verification receipt

Initial domain/privacy/action checks pass all 85 tests, focused lint and both
shell/style guards pass, and the first inert build passes TypeScript and all
115 pages. Four dedicated desktop/mobile Exercise cases pass, covering drafts,
sets, reuse, PT/OT, cardio, units, history and deletion. Phone review found a
wrapped label leaving one set input misaligned; align row contents at the bottom.
The initial broader suite exposed two early clicks on static launchers before
their handlers connected. Add the narrow hydration gate and a delayed-script
regression; stop that superseded run before rebuilding. Final validation pending.

The corrected final source passes all 85 focused checks and lint. Its inert
Browser-QA build passes TypeScript and generates all 115 pages. In-app phone
review confirms a short initial form and aligned optional set inputs; the
normal desktop view was reviewed after resetting the viewport. The preview is
left open to a fresh Exercise form, without private data or a submitted entry.
All 50 final desktop/mobile Browser-QA cases pass in 6.8 minutes against that
same build. They cover initial validation, controlled set/category draft
restoration, identity-only reuse with the most recent units, distinct PT/OT
contexts and sides, pounds/kilograms, holds/resistance, cardio time/distance,
numeric history/readback and deletion. Delayed-script launchers pass on both
profiles. Existing body surfaces, movement/ROM, feelings touch gestures, themes,
narrow widths and enlarged text remain covered. Both final shell/style guards
also pass. Evidence and the phone JPEG are outside source.

Clean local preview: `http://127.0.0.1:3021/wellness`, left open to Exercise.
Existing tabs are preserved. No private record was submitted, no provider or
live database write was performed, and nothing was published.
