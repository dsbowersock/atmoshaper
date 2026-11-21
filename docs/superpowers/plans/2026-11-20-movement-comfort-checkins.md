# Expanded movements and comfort check-ins

Status: implemented and verified, local source/preview only. Branch
`codex/movement-comfort-checkins` starts at `1c32975`.

## Owner request and design

Add shoulder horizontal abduction/adduction, forearm pronation/supination,
hand/finger/thumb and toe movements, hip adduction/cross-body adduction,
straight-knee flexion and rotations, bent-knee tibial rotations, and foot
inversion/eversion. Extend the same body/movement choices to recording how a
movement feels, independent of a measured range. Keep all assets and tools free.

The owner clarifies: two separate tools, each focused on its own recording,
with a quiet optional control for the other. Reuse the shared Body area ->
Movement -> Record component with independent retained drafts and explicit
active lifecycle. Neither score nor angle is required when the other is being
recorded; an explicitly started optional entry must still be valid. Avoid a
long combined questionnaire. A labelled 0-10 comfort scale
uses 0 = not comfortable at all, 10 = completely comfortable. No default score
is silently saved. A higher self-rating means more reported comfort, not a
validated clinical improvement or diagnosis. Notes are optional. No angle or
sensor is needed for comfort. Preserve the manual/device ROM flow separately.

Retain the existing font, physical buttons, charcoal/theme surfaces and focused
body view. Hand/finger and toe subchoices progressively reveal a small movement
list; do not make a single long list of all digits. Each digit/joint variant has
a distinct canonical movement name so comparisons cannot conflate them. Compact
record controls and visible score endpoints suit phone use. No global redesign.

## Asset and movement boundary

The pinned CC0 rig includes each finger's three bones and one collective toe
bone per foot. Add hand/toe selection locations and close-up framing. Use
explicit starting and moving bone poses for multi-joint demonstrations. Resolve
mirrored sides using world-space axes; demonstrations remain direction cues,
never measurement targets. Distinguish inversion/eversion from the combined
foot pronation/supination patterns. Individual-toe and toe-spreading motions
without matching rig bones receive written guidance and an explicit unavailable
demo state; never animate the entire foot as if it were an isolated toe.

Primary terminology references (original cues, no copied programs/artwork):

- https://openstax.org/books/anatomy-and-physiology-2e/pages/9-5-types-of-body-movements
- https://www.orthoinfo.org/bodypart/hip-thigh/hip-conditioning-program/
- https://pubmed.ncbi.nlm.nih.gov/25142267/
- https://www.orthoinfo.org/bodypart/foot-ankle/walking-pronation-animation/
- https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6602390/

No prescribed repetitions, normal ranges, forceful knee twisting or new
calibration claims. Existing stop/restriction guidance remains.

## Data, privacy and comparisons

Keep the existing `rom` compatibility category and owner-scoped wellness action.
Comfort records have a distinct recording-kind marker, versioned scale, score,
movement and side in the existing allowlisted metadata. They have no fabricated
angle and do not reuse generic symptom intensity. Existing ROM fields and
records keep their meanings. No Prisma schema, migration, new hosted store,
provider operation or clinical-record connection is needed. Existing signed-in
self-tracking acknowledgement and anonymous page-session practice behavior
remain authoritative. No note, movement or rating goes to telemetry or the
model asset request.

Timeline badges clearly distinguish Comfort from ROM. Patterns compare comfort
only within the same movement, side and scale version. Show previous/latest
ratings, dates and signed point difference, with descriptive language. Keep
comfort out of generic intensity averages and ROM degree summaries. Do not infer
clinical recovery from a higher score. Export includes the additive metadata.
Legacy entries without side/scale cannot silently join new comparisons.

## Verification plan

Test required movement coverage and every referenced bone on both sides, plus
written-only demo boundaries. Test invalid/missing ratings, zero/ten endpoints,
normalization allowlists and exclusion from telemetry. Test separate movement/
side/scale comparisons, missing/malformed data, zero scores and legacy ROM
compatibility. Exercise real action pending/privacy/failure ownership for both
draft kinds. Browser-check new choices, comfort practice saves, retained draft,
switching to ROM, comparison rendering, fallback and responsive/light/dark
layouts. Inspect representative new animations and written-only toe guidance.
Run focused tests/lint/typecheck and an inert Browser-QA build, retaining evidence
outside source. Leave a working local preview. No publication is authorized.

## Implemented behavior

The Wellness launcher has separate Movement comfort and Range of motion tools.
Both use the same recorder component with separately retained drafts. Comfort
leads with one explicitly chosen rating; ROM leads with manual/optional phone
angles. Each offers a quiet optional checkbox for the other recording. A rating,
an angle or both can be saved; an untouched optional field is skipped. Turning
the optional section off excludes its retained values from the payload.
Changing movement/side clears the previous rating and ending reading. Hidden
tools own neither sensors nor a renderer. Input IDs remain unique across the
two mounted drafts. The existing shared action lock and acknowledgement apply
to both tools; no additional questionnaire or recording quota is introduced.

Ten body areas include hand/finger and toe locations. Hand choices progressively
reveal whole-hand, thumb and individual-finger movements, with distinct MCP,
PIP and DIP identities. Toe choices distinguish individual toes and base/tip
motions. Inversion/eversion and combined foot pronation/supination are separate
choices. New poses reference actual rig bones on both sides. Unsupported toe
motions keep written guidance and suppress an invented animation/marker.

Side/angled defaults make raised-arm, forearm and bent-knee motion easier to
see. Camera fitting uses the selected limb's actual skinned vertices across
five authored poses, with depth/aspect-aware padding; it is recalculated on
explicit view resets or resizing. Vertex membership is cached per limb/side.
Only the selected region needs CPU sampling, not every playback frame. This
keeps moving fingertips/feet in frame without using a recorded angle. Smaller
close-up markers identify the actual finger joint without covering the finger.

New comfort metadata is explicitly kind/scale-marked, allowlisted and validated
before the existing owner-scoped database action can write. Zero is valid;
blank/out-of-range/fractional ratings are not silently turned into a value.
Comfort-only records have no degree fields. Generic symptom intensity remains
null for comfort/combined records. The new fields are stripped from general
account preference sync and diagnostic exception data. Timeline labels and
Patterns distinguish ratings from degrees. Comparisons retain dates, exact
movement/side/scale and descriptive point changes; ROM degree references now
also distinguish side, source and phone axis. Unknown legacy context cannot
silently join a newly specified context.

Existing category, identifiers, asset bytes/hash, schemas and degree-only
payloads remain. This is additive source compatibility, not a promise that an
older server/client understands new comfort writes. Export the extended data
and coordinate client refresh before any later rollback to pre-comfort code.
Release/rollback procedures remain part of separately approved publication.

## Verification results

- `npm run test:rom`: 57/57 pass. Includes required movement coverage, exact
  asset hash and every new pose/focus bone on both sides; invalid/zero/ten
  ratings; allowlists; real server action validation/owner scope; actual client
  pending/privacy/failure ownership; legacy degree compatibility; separate
  movement/side/scale trends and ROM source/axis separation. Frustum tests fit
  every corner of wide/tall/deep swept bounds at phone/landscape aspect ratios.
- `npm run test:sentry`: 76/76 pass. `npm run test:income-preferences`: 24/24
  pass. New tests confirm nested comfort data cannot enter general preference
  sync or diagnostic exceptions. `npm run test:breathing-guards`: 2/2 pass.
- Consolidated `npm run lint:movement-checkins` passes. The final
  `npm run build:browser-qa` in `build-framed.log` passes TypeScript and all 115
  pages. It uses inert provider/database settings; no production gate is run.
- All 28 selected `ROM |Wellness` desktop/mobile Chromium cases pass against
  that final artifact (`framed.log`). New cases exercise comfort-only zero and
  ten ratings, absent default angles, independent tool drafts, optional combined
  recording from both tools, excluded unchecked values, retained ratings and
  dated comparisons. Existing manual/custom, baseline/permission-denial/model-
  failure, pending/privacy and Wellness draft cases remain green. The new
  eight-family real-renderer journey verifies both sides across the two projects.
- Phone containment checks cover 320px/enlarged 24px text and both existing
  themes. Actual rig screenshots cover shoulder horizontal motion, forearm
  rotation, hip and bent-knee rotation, index PIP, thumb opposition, combined
  foot movement and toe-base motion. Individual-toe written-only recording is
  verified. Browser health checks find no application errors or unexpected
  external requests. Tests use fictional anonymous page-session practice data
  and synthetic phone readings, never private records or live writes.
- Manual in-app phone review confirms the full moving forearm/hand stays in
  frame, shoulder motion is visible, finger markers do not cover the joint,
  and the comfort screen starts with one blank rating and no angle fields.
  The temporary 390x844 viewport was reset and the existing local tab retained.
  JPEG proof and logs remain in the external `movement-comfort` evidence folder,
  including `movement-comfort-phone.jpg` and `forearm-guide.jpg`.

Preview remains at `http://127.0.0.1:3018/wellness`. No provider, database,
deployment, private-record, payment or email operation occurred. No real-phone
sensor repeatability/calibration, clinical recovery inference or validated
biomechanical simulation is claimed. Asset cost remains zero.
