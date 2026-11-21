# Continuous feelings wheel and direct interaction

Status: implemented and verified locally on `codex/feelings-wheel-context`,
from `695e260`. Publication is outside this request.

## Owner correction

The drill-in wheel works but removes the neighboring and parent words that give
feelings their context. The owner wants all three levels together, as in their
reference, and direct touch rotation as well as mouse interaction. Preserve
AtmoShaper styling and the existing optional, low-friction recording flow.

## Design and scope

- Render a single three-ring SVG with family, related and specific words aligned
  into continuous sectors. Leaf counts allocate angular space. Every word remains
  mounted after any choice; selecting a child never replaces its ancestors.
- Retain the current font, themed app surfaces and established button materials.
  Wheel colors remain Happy `#706019`, Sad `#315677`, Connected `#266660`,
  Angry `#853c42`, Fearful `#5c427e` and the other existing family colors.
- Start with a readable partial wheel on phones, with the center near the left
  edge so all three rings fit across the width. Rotate to compare neighbors;
  an overview control fits the complete circle. Pinch zoom and two-finger pan
  allow closer reading without a separate drill-in page.
- Capture pointer gestures on the wheel only. A tap chooses the word under its
  initial contact; crossing the drag threshold, pinching or cancelling cannot
  choose a word. Rotation is direct and has no inertia or unsolicited animation.
- Keep explicit rotate/zoom/reset controls, a complete word list, search/custom
  words and optional multi-selection. Roving keyboard focus moves among siblings
  and parent/child levels without replacing the artwork.
- Keep plain stored words, the 16-word bound, the existing save/pending owner,
  local-first metadata and preference/diagnostic exclusions. No new dependency,
  image asset, provider, storage migration or live recording is involved.

The first design kept only one ring at a time. This revision preserves the
reference's comparative context and direct rotation while using original SVG
artwork and the site's existing materials. Dense labels intentionally have an
overview and a reading view rather than shrinking every word to phone width.

## Verification

Check hierarchy geometry, contiguous parent/child alignment and angle-wrap
math. Exercise native mouse drags and Chromium touch contacts, tap selection,
pinch/pan and cancellation, plus keyboard selection. Retain the existing
multi/search/custom/draft/timeline journey, narrow/enlarged-text and theme checks.
Run focused lint, domain/privacy/lifecycle checks and an inert build, then inspect
rendered phone and desktop views. Leave a loopback preview available, mirror the
actual results in current state/log and commit locally.

Pointer APIs were checked against the primary [MDN capture documentation](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture)
and [pinch gesture example](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Pinch_zoom_gestures).

## Verification receipt

- `npm run test:wellness-detail`: all 76 checks pass, including geometry,
  normalization, privacy, lifecycle and existing body/ROM/comfort behavior.
- `npm run lint:feelings-wheel`: passes without warnings. The inert
  `npm run build:browser-qa` passes TypeScript and generates all 115 pages.
  An initial browser-helper typing error was corrected before that build.
- `npm run test:breathing-guards`: both shared feedback/style guards pass.
- Four focused desktop/mobile Browser-QA cases pass in 51.2 seconds on the final
  build. Actual Chromium touch events exercise tap, drag, pinch, two-finger pan
  and cancellation; the desktop lane exercises real mouse dragging. Selection
  survives gestures, and every hierarchy level remains. Keyboard parent/child
  navigation, multi/search/custom words, native drafts and timeline readback pass.
  Both themes, 320px and enlarged-text containment pass.
- In-app review at 390x844 and 1280x900 confirms the reading and overview layouts;
  direct dragging rotates without selecting. No real entry was saved. Temporary
  viewport sizing is reset. These are rendered and emulated-touch checks;
  physical phone testing is not claimed.

Screenshots and logs remain outside the repository. The new clean preview is
`http://127.0.0.1:3019/wellness`, with the prior preview tab left untouched. No
new asset/dependency, paid service, publication or live provider/database write
was needed.
