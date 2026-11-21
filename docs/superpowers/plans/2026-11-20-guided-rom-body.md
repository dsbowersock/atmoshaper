# Guided ROM recorder and reusable interactive body

Status: implemented and verified locally on `codex/rom-guided-mobile`, from `42006a9`.
No publication, provider or live recording operation is included.

Budget clarification: the owner requires free usage rights and accepts
attribution. The chosen model has an author-published CC0 dedication, also
embedded in the GLB. The author terms say existing copies remain CC0 if the
library later removes the download. The model and MIT Three.js library require
no purchase, subscription, account or paid runtime viewer. Source credits are
available inside the tool and in the repository asset record.

## Design and scope

The owner wants a phone app interaction: pick a joint on a convincing human
body, choose an understandable movement, see its direction and record it.
Reference images allow a blue illuminated body, realistic skin or muscles.
Use the existing AtmoShaper font and physical button materials. The body is the
visual focus; compact headings and one task at a time replace the long form.
Existing charcoal/card surfaces and blue, teal and orange theme tokens remain
the authorities. The three real stages are Body area -> Movement -> Record.
Show everyday names first, with technical terminology available as supporting
information. Use large tap targets and a fully equivalent named joint list.

The current body region tools are button grids; the spatial anatomy foundation
is a deferred candidate without a runtime model. This anatomy-focused local
request reopens a new ROM viewer, not those deferred region maps or an atlas
rollout. Use a dedicated reusable body component with explicit bone mappings.
The selected Innerscene 53-bone MakeHuman/MPFB GLB carries embedded CC0 metadata,
matching its author page and upstream asset license. Pin and record its hash,
keep a local asset, and retain provenance. No unreviewed BodyParts3D atlas asset
is activated. Skin/muscle layers remain replaceable model assets; do not invent
muscle texture or label surface geometry as a reviewed anatomical atlas.

Primary references:

- https://www.innerscene.com/tools/library/3d-parts/human-base-mesh-with-editable-53-bone-rig-8e7c8ab1
- https://www.innerscene.com/tools/library/terms
- https://raw.githubusercontent.com/makehumancommunity/makehuman/master/LICENSE.ASSETS.md
- https://threejs.org/docs/pages/OrbitControls
- https://threejs.org/docs/pages/GLTFLoader
- https://www.ada.org/-/media/project/ada-organization/ada/ada-org/files/resources/practice/health-and-wellness/ada_ergo_stretches.pdf
- https://www.orthoinfo.org/bodypart/shoulder/rotator-cuff-and-shoulder-conditioning-program/
- https://www.orthoinfo.org/bodypart/foot-ankle/foot-and-ankle-conditioning-program/

Movement descriptions are original plain-language direction cues, not copied
exercise programs, prescribed stretches, goniometer placement instructions or
normal-range targets. The animation is illustrative; it cannot supply the
recorded angle. Keep the existing manual/device payload and owner callback.
No camera capture, automatic measurement, diagnosis or new hosted storage.
The sensor is a phone orientation reference, not a calibrated joint instrument.
Stop guidance and professional help are relevant to demonstrating body motion.

## Implementation boundaries

- Catalog common neck, back, shoulder, elbow/forearm, wrist, hip, knee and ankle
  movements. Preserve the existing `Cervical rotation` name for comparisons;
  keep an Other movement route for existing or professional custom labels.
- Shared lazy Three.js viewer: local skinned model, blue surface material,
  rotatable camera, reset/front/back controls, joint picking and an equivalent
  accessible HTML list. Do not load/render the scene on hidden Wellness tools.
  Release GPU resources/listeners on exit; handle loading, model errors and
  missing/lost WebGL with an SVG joint map and text guidance.
- Playback is explicit, pausable, bounded and off when hidden. Honor reduced
  motion with a static start/end control. Keep animation direction and the
  manual/sensor measurement independent.
- Manual and phone modes are separate. Validate blank/non-finite/out-of-bound
  angles. Invalidate a sensor baseline when movement, side, axis, mode or active
  tool changes; a previously captured context must not be silently relabelled.
- Existing self-tracking privacy acknowledgement, action ownership, failure
  reporting, practice mode and timeline remain authoritative. No actual private
  recordings are created during QA. Clinical vault/PHI workflows stay untouched.
- Compact the existing ROM-specific privacy presentation without hiding the
  acknowledgement or changing its wording, and preserve other Wellness tools.

## Verification

Check the model signature, hash, skin/bone references and external-resource-free
GLB. Test all catalog/joint/rig mappings, angle validation and baseline context.
Exercise actual-app manual/practice saves, custom movements, step/back edits,
pending/failure ownership, mocked phone readings/permission denial, baseline
invalidation, body pick/rotate/reset, bounded playback, reduced motion and model
failure fallback. Check 320px phones, landscape, enlarged text and both themes.
Run existing Wellness lifecycle/source/domain checks, focused lint, TypeScript
and an inert browser-QA build. Review through CUA, save fictional evidence
outside source and leave a working local preview. Document actual results before
claiming completion. A real-phone sensor comparison remains a hardware check.

## Implemented behavior

The recorder has eight body-area choices and 26 original everyday movement
labels, with optional technical names and an Other movement path. Selecting a
movement replaces its choice list with the demonstration, keeping the phone
screen focused; a change control returns to the list. Step navigation preserves
the draft. Changing the actual movement/side clears the ending reading rather
than silently reassigning an earlier measurement. Midline flexion/extension
remains unsided when revisiting its joint.

The reusable `components/body` viewer lazy-loads the locally pinned 4,994,820-byte
GLB and Three.js only while the active ROM stage needs it. The mesh has 53 bones,
one skinned surface and no textures or external resource references. Its SHA-256
is recorded in `public/body-models/README.md` and checked by the focused tests.
The renderer uses local material/lighting; no imported muscle atlas is claimed.
Neutral hand orientation follows the actual thumb/finger bones so mirrored wrist
direction cues follow the intended side. The model remains an illustration,
not validated biomechanics, a normal-range target or a measurement protocol.

Joint taps use projected bone locations with a generous screen-space hit area;
orbit drags are distinguished from taps. The named HTML area/side choices provide
an equivalent selection path. Front/back/profile controls reset the camera, and
an explicit rotation mode avoids trapping ordinary page scrolling. Demonstrations
frame the chosen joint more closely, support still start/end positions and a
bounded five-second direction cycle. Pause holds its current pose; reduced
motion offers still positions. Hidden tools, record-entry stages and lost WebGL
release the scene, requests, event listeners, geometry, materials and skeleton
GPU textures. Loading/failed WebGL or model loads retain the named choices and
written cues with original lightweight fallback artwork.

Manual angles reject blanks/non-finite/out-of-range values and use an ordinary
angle difference, independent of a previously selected phone compass axis.
Phone mode requires explicit permission and a fresh reading. Its baseline is
bound to movement, side and axis and is cleared across mode/stage/tool changes.
Only the existing payload is sent to the existing parent action owner; pending,
privacy acknowledgement and success/failure remain authoritative there. Next
control signals are rethrown. The timeline now shows the movement and side as
well as its degree change, including plain-language aliases for known presets.
No recorded data, note text, identity or angle goes into the 3D asset request.

## Verification results

- `npm run body-model:inspect` parses the pinned local GLB, its bounds and all
  53 bones. The asset test confirms its exact hash, skin joints/weights and lack
  of external resources. No added 3D dependency name has an audit advisory in the
  captured dependency audit; existing baseline findings are unchanged.
- `npm run test:rom`: 42/42 pass, including the real parent action lifecycle,
  duplicate/pending protection, failures/Next control signals, practice/privacy
  boundaries, sensitive-data source guards and the new catalog/asset checks.
- `npm run test:breathing-guards`: 2/2 shared shell/stylesheet checks pass.
  Focused ESLint and `npm run typecheck` pass.
- `npm run build:browser-qa`: final inert build passes TypeScript and all 115
  pages. The preview and browser tests use that artifact. No live provider or
  production migration/payment gate is executed.
- The 22 cases selected by `ROM |Wellness` in `public-routes.spec.ts` pass on
  desktop/mobile Chromium across `complete.log` (18 unchanged cases pass) and
  `themes-playback.log` (all four recording/playback cases pass with final theme
  coverage). Manual/practice
  saves, custom movements, baseline invalidation across side/axis/tool changes,
  denied permission, model failure and the existing Wellness draft flows pass.
  Browser health checks find no unexpected external requests or application
  errors. Automated layout checks cover 320/390/780/1280px and 24px root text.
  Both existing themes pass containment checks; light/dark body and recording
  screenshots were visually reviewed.
- Real-renderer checks tap a projected joint, turn the camera, show the still
  positions, reset, animate/pause/resume to bounded completion and honor reduced
  motion. Screenshot comparisons decode pixels at CSS scale to avoid PNG-byte
  and fractional-DPR artifacts. Reset allows under 0.5 average RGB level of
  compositor rounding; pause allows under 0.25, while movement must exceed 0.5.
  Recorded angles stay blank until entered; model poses never populate them.
- Manual in-app browser review confirms a realistic blue body, accessible
  joint choices and the closer neck demonstration on a 390x844 viewport. The
  temporary viewport override was reset and the existing preview tab retained.
  Fictional screenshots/logs are in the external `rom-guided-mobile` evidence
  folder, including `rom-body-phone.jpg` and `rom-demonstration-phone.jpg`.

The local server remains at `http://127.0.0.1:3018/wellness`; open Range of
motion. No live account or private recording was used. Real hardware permission,
placement, repeatability and calibrated joint-angle accuracy remain physical
device/professional checks. The animation is an original direction illustration,
not validated biomechanics or a reviewed muscle atlas. No publication, provider,
database, email or payment operation occurred.
