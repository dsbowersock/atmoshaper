# Detailed and sided Activity body regions

Status: verified locally on `codex/activity-sided-regions`, from `6efe58c`.

The owner corrects the first Activity map: left/right must remain separate;
upper arm/forearm and shin/calf need distinct choices; profile views must not
show the opposite side's markers through the body. They are considering fixed
points versus drawing and ultimately want anatomical context.

## Decision and scope

Use named, repeatable areas as the default low-friction recording path. Provide
52 paired choices, including face/head/neck, torso, arm segments/joints/hands,
leg segments, shins/calves and foot areas. Add explicit Left side and Right side
camera views with viewer-relative visibility. Preserve all 15 old broad values
without inferring a side or rewriting a saved entry. New sided labels use the
existing regions string list and export shape; no schema migration is needed.
Keep the existing 16-region save bound visible/enforced and let selected labels
be removed individually, including legacy labels retained in an unfinished
draft. Group named alternatives so the default body view stays compact.

Drawing would be an optional later surface annotation for an area that crosses
named boundaries. It would need rotation/drawing modes, touch-safe undo/erase,
stable surface coordinates, export and comparison behavior before shipping.
This branch does not add an unreviewed sketch payload or claim anatomical
tissue identification. The current free CC0 asset is one skinned surface, not
a reviewed muscle/bone atlas. A future anatomy layer requires independently
reviewed locations/provenance; a surface selection alone does not identify
which underlying tissue someone is describing.

Keep the current typography, button palette, native drafts, scene cleanup,
practice/save/privacy ownership and other tools' broad maps. No new paid asset,
dependency, hosted recording, provider operation or publication.

## Surface placement

Initial browser journeys passed sided recording, but screenshot review found
authored torso offsets could float outside the silhouette in a profile view.
The renderer now samples actual neutral skin vertices once and prepares a small
local surface patch for each region. Markers snap to the nearest vertex in that
patch as the camera moves, instead of drawing a bone offset in empty space.
The far-side/facing rules remain independent. This is surface placement only,
not an attribution to a muscle, joint or bone. Movement demonstrations retain
their bone-driven markers and allocate no surface patches.

## Verification

Test distinct sides, all real bone mappings, shin/calf and arm segment splits,
camera-facing rules, legacy preservation, selection bound and normalizer/export
compatibility. Browser-check actual sided body taps, left/right profiles without
far-side picks, adding both sides, named alternatives, hidden draft retention,
save/timeline readback, failure fallback, narrow/enlarged-text/themes and the
existing shared ROM/comfort renderer. Run focused lint/tests, shell/style guards
and the inert build. Review the phone layout and keep evidence outside source.

## Completed validation

- `npm run test:activity-body`: all 64 checks pass, including legacy/sided
  normalization, 52 real bone mappings, independent sides/segments, camera-facing
  rules, matching selection/save bounds and existing pending/privacy owners.
- `npm run lint:activity-body` and the two `npm run test:breathing-guards`
  shell/style checks pass. The final inert `npm run build:browser-qa` passes
  TypeScript and all 115 pages; no live credentials or source-map upload are used.
- The final artifact passes all 36 selected desktop/mobile browser cases. Real
  torso/profile taps, independent forearms, both shins, separate upper arms,
  individual removal, full timeline labels, hidden draft retention, note-only
  recording, failed-model alternatives and the shared ROM/comfort journeys pass.
  Both themes, 320-1280px widths and 24px root text remain contained.
- Rendered 390x844 front/profile screenshots confirm surface-bound markers and
  independent selected regions. In-app browser control failed with Windows
  cursor-access denial, so this review used isolated browser artifacts rather
  than manual interaction. Physical-phone touch comfort is not established.
- The final preview serves HTTP 200 on loopback port 3018. Fictional screenshots
  and logs live outside source in `activity-sided-regions` evidence, with final
  browser output kept separately from the interrupted initial visual-review run.

No new paid asset/service, schema/export-format change, private recording,
provider/hosted database write, source push or publication occurred. Drawing and
reviewed anatomical layers remain design follow-ons, not implemented features.
