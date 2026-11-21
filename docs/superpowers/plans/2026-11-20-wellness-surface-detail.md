# Surface-specific body locations and category recording flows

Status: implemented and verified locally on `codex/wellness-surface-detail`,
from `366951f`. No publication is included.

## Owner request

Front, back, inner/medial and outer/lateral body surfaces must save independently.
Add diagonal, top and bottom views and optional body-part close-ups with finer
points, retaining a broad/general choice. Use the body in Activity, Body
sensation and Incident. Feeling needs a wheel; ROM needs a shortcut to the
dedicated recorder. Work and home context should prompt awareness of repeated
activities, sustained positions and surroundings. Home also needs a distinct
self-care recording section. These prompts invite observation, not diagnosis.

## Implementation sequence

1. Add a versioned-in-source location catalog with distinct surface labels and
   optional finer labels. Keep old 15 broad/52 sided strings unchanged, with no
   inferred surface or historical rewrite. Reuse the existing bounded regions
   list and export shape; no database schema migration. Broad location selection
   is explicit. Choosing to refine replaces only that broad selection in the
   current draft; other surfaces and older saved entries remain independent.
2. Extend the existing free neutral surface renderer with normal-based facing,
   actual depth/occlusion, diagonal/top/bottom cameras and bounded close-ups.
   Close-ups clip the illustrative model to the chosen part; they do not claim
   reviewed tissue segmentation. Only the active tool owns one lazy scene.
   Named alternatives cover every surface/detail even without WebGL.
3. Carry the explorer into Body sensation/Incident and optional contextual body
   detail while keeping native drafts and the single save/pending/privacy owner.
   Add the ROM shortcut without discarding an unfinished quick note.
4. Add a feelings wheel and equivalent named choices/custom words. The owner
   subsequently supplied three My Feelings Wheel screenshots: preserve the
   broad-family -> related-word -> finer-word navigation, multiple selection
   option and optional comment in original AtmoShaper artwork. Do not claim a
   validated psychological scale. Store optional feeling words only for emotion.
5. Add optional Work prompts and separate Home surroundings / Self-care groups.
   Store bounded, allowlisted reflection data only for work/home categories.
   Preserve draft inputs across category/tool changes, omit inactive metadata,
   retain timeline/export visibility and keep all sensitive values out of
   diagnostics, preferences, Calendar and notifications.

## Design

Retain the current font, themed surfaces and established orange/teal/purple/
blue/green button materials. Whole-body selection stays simple; close-up detail
and reflective prompts are optional. Plain words lead, with anatomical surface
terms as supporting labels. Drawn annotations and muscle/bone atlas layers are
outside this request's implementation; no new paid asset or viewer service.

## Validation and closure

Domain checks cover surface independence, refinement, legacy retention, actual
bone mappings, camera directions, bounds and metadata allowlists. Action tests
retain one owner and reject malformed results. Browser journeys cover real
front/back and inner/outer/sole/top selections, close-up framing, named fallback,
draft/category transitions, wheel and context recordings, timeline/filter/export
data, ROM shortcut and existing movement flows. Check both themes, 320px and
enlarged text. Build with inert QA configuration, review screenshots and leave
the local preview working. Mirror actual results into state/log/wiki before a
local commit. No publication, live provider/database/private recording, payment,
email or new secret is authorized by this source task.

Renderer API checks use the official [Three.js material clipping documentation](https://threejs.org/docs/pages/Material.html) and [Raycaster documentation](https://threejs.org/docs/pages/Raycaster).

## Verification receipt

- `npm run test:wellness-detail`: 73 passing domain, adapter, action lifecycle,
  privacy, Activity, ROM and movement-comfort checks.
- `npm run lint:wellness-detail`: passes; TypeScript also passes in the final
  inert `npm run build:browser-qa` build, which generates all 115 pages.
- Existing Sentry checks: 76 passing. Account-preference checks: 24 passing.
  Shared shell/style guards: two passing.
- Rendered acceptance runs on inert loopback configuration with fictional
  practice entries. All 42 final desktop/mobile cases pass in 5.1 minutes,
  including real surface taps, close-ups, fallback, preserved drafts, feeling
  choices, context readback and existing ROM/comfort flows. Theme, 320px and
  enlarged-text checks pass. The initial focused run also passed 14 cases.
- In-app browser review at 390x844 confirms the nine-family wheel and a real
  inner-forearm tap selecting `left inner forearm, middle area`. Close-ups and
  points use the existing CC0 surface, with no tissue-identification claim.
  Evidence images and command logs remain outside the repository. The temporary
  viewport override is reset and the clean Feelings tool is left open.

The local preview is `http://127.0.0.1:3018/wellness`. No new asset, dependency,
paid service, private recording, hosted write, provider setting or deployment
was used. The new category fields follow the existing local-first entry/export
path; old broad and sided labels are preserved without inferred surfaces.
