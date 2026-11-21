# Activity recording polish and shared body-region selection

Status: verified locally, local preview only. Branch `codex/activity-body-polish`
starts at `cd1ea12`. The owner asks for Activity form polish and the same 3D body
in its Body regions section. No publication, provider or live recording is
included.

## Design and preservation

Keep the existing font, physical buttons, themed surfaces and quick-log save
owner. Make Activity read as its own tool with concise headings, contextual
guidance, compact privacy presentation and optional context/body detail groups.
Preserve the mounted native fields, IDs, names, existing intensity meaning and
complete unfinished draft across tool/category changes. No new questionnaire,
measurement scale, required body-region selection or stepper is needed.

The current body maps are two tall button grids. Activity instead uses the
existing lazy CC0 surface/renderer with region markers, front/back/orbit views,
multiple selections, a selected-region summary and named keyboard alternatives.
Joint selection and body-region selection are distinct modes: preserve the 15
canonical region tokens, including torso/back/limb regions rather than replacing
them with ROM joint IDs or new side-specific storage values. Either side maps
to the existing grouped region. Selections are illustrative broad areas, not
precise anatomy or diagnosis. No patient measurements affect the model.

Only an active, expanded Activity region section owns a renderer. Closed or
hidden tools release it; selections and hidden form inputs remain. Loading,
failed models and missing WebGL keep the named selection path usable. Pending
saves block region edits. Other tools retain their existing region presentation;
this local anatomy-focused request does not approve a global map rollout.

## Data boundary

Reuse the existing selectedRegions state, repeated `regions` inputs, action
lock, acknowledgement, practice mode and server ownership. Activity's existing
duration/activity-detail fields currently reach the normalizer but are dropped
because their whitelist is body-sensation-only. Allow those two existing fields
for Activity, with the same bounds/text normalization. Body-position and movement-
effect semantics remain unchanged for other categories. No schema, migration,
clinical-store connection, telemetry or provider change is needed.

## Verification

Test all region mappings against actual rig bones and stable tokens, selected/
unselected/pending behavior, saved duration/detail normalization and unchanged
action ownership. Browser-check actual body taps, front/back selection, multiple
regions, removal, retained drafts, failure fallback, closed/hidden scene release,
practice saves/timeline and narrow/enlarged-text/light/dark layouts. Recheck the
shared ROM/comfort renderer and existing Wellness draft lifecycle. Run focused
lint/domain tests, shared style guards and an inert TypeScript/app build. Review
the phone layout through the in-app browser and leave a working local preview.
Keep fictional evidence outside source and record actual results before closure.

## Completed verification

- `npm run test:activity-body`: 61 checks pass, including real asset mappings,
  stable tokens, hidden serialized selections, disabled propagation, Activity
  metadata bounds and existing action/privacy/ROM/comfort lifecycle checks.
- `npm run lint:activity-body`, `npm run typecheck` and both
  `npm run test:breathing-guards` shell/style checks pass.
- `npm run build:browser-qa`: TypeScript and all 115 pages pass. The initial
  sandbox build could not create dependency junctions; the unchanged inert
  build succeeded outside that Windows sandbox. No live credentials or source
  map upload were involved.
- The final inert artifact passes all 34 selected desktop/mobile browser cases.
  New journeys exercise real front/back torso taps, selected-region removal,
  named selection, retained hidden fields, unfinished tool navigation,
  duration/detail timeline readback, failed-model fallback and note-only saves
  without requesting the model. Existing ROM/comfort and Wellness journeys
  remain green. Both themes, 320-1280px widths and 24px root text are checked.
- Manual 390x844 in-app review confirms the compact Activity form, selected
  upper-back/hands markers, ordinary named alternatives and bottom action.
  The viewport override was reset; preview remains on port 3018. Fictional
  screenshots and logs are outside source in `activity-body-polish` evidence.

No paid asset/service, private recording, hosted database/provider write, source
push or publication occurred. The region markers are broad selection aids,
not precise anatomical or measurement claims.
