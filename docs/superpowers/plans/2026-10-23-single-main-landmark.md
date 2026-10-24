# One main landmark in the application shell

## Observed problem and scope

An ordinary combined build of reviewed source returned HTTP 200 and no uncaught
page errors on twenty-five anonymous pages. Every page exposed two main
landmarks; Chimer exposed three. Feature-title and minimal Clock-text assertions
also need alignment with the existing source contract, not product rewrites. The real
`SidebarInset` already renders `main`, while the root sizing wrapper and several
route wrappers add nested mains. This is a rendered accessibility defect, not
just a Playwright selector issue. The public
[W3C landmark guidance](https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/main.html)
recommends one top-level main landmark per ordinary document.

Source begins at reviewed `1029603` in a separate local branch. Keep the shared
SidebarInset as the main owner and make the six competing root/route wrappers
neutral divs: root layout, Chimer layout, background capture scene, Google-link
recovery, anatomy media-review content and development RSC proof. Preserve every
class, child, data attribute, route, authorization operation, legal version and
background binding. The standalone global-error document bypasses the shell and
retains its own main. No CSS, feature title or clock display change is intended.

## Validation sequence

1. Reproduce the original duplicate DOM with the actual root, shared inset and
   route JSX in cached Chromium; keep auth/media/provider dependencies inert.
2. Confirm the new regression fails before repair: ordinary two, Chimer three,
   preview four and account-link three mains; the route-source scan identifies
   exactly six competing owners. The standalone-error exception passes.
3. Apply only the neutral-wrapper changes and focused intent comments. Run the
   named `test:app-landmarks` suite, scoped lint and TypeScript validation. Compare
   parsed source against the parent to prove unchanged logic/props except the
   six tag substitutions and comments.
4. Build a new exact disposable source export combined with Calendar's reviewed
   six paths. Reuse cached dependencies and the offline font fixture; deny all
   provider traffic, exclude private envfiles and keep an owned bounded process
   job. This code build is not Production prebuild/provider acceptance.
5. Check actual compiled pages at desktop/mobile sizes, one exposed main and
   unchanged shell geometry. Match approved feature metadata rather than demanding
   that every feature title contain the platform name; preserve the time-only
   Clock view. The font fixture is not final visual/media acceptance.
6. Remove only owned build/profile/junction resources, verify the shared cache and
   existing worktrees, and record the result in the canonical migration worktree.
   Keep the repair local until separately approved publication/review.

## Existing boundaries

All existing PRs remain unmerged; this local repair does not authorize push,
merge, Production promotion, Sentry activation, provider or database operation,
new credential use, media mutation or setup replay. The pending protected
purchase proposal stays pinned to its reviewed source, without silent retargeting.
The separate R2 budget decision remains pending. Keep completed acceptance closed.

The original combined Next build passed TypeScript/static generation and compiled
all eighty pages/sixty-two handlers. Its strict supervisor reported four prevented
auxiliary launches. A separate inert SDK probe reproduced one Next-Sentry and
three bundler Git-revision lookups; attributing the original four is an inference
because their stacks were not captured. No network request occurred and no guard
was relaxed. Preserve the original nonzero supervisor receipt and disposition.

## Local implementation checkpoint

The new six-case regression reproduced five failures before repair and now passes
all six, with zero skips. Complete TypeScript validation and scoped ESLint pass.
Parsed/compiled token comparison proves that the six main-to-div pairs and
comments are the only runtime edits; classes, props, children and control flow
are identical, and the standalone global-error file is unchanged. The first lint
invocation also scanned the full repository and found only a reserved variable
name in the new test helper; that variable was renamed before scoped lint passed.
The fixed combined-artifact/responsive checks follow this checkpoint; their actual
results belong in the canonical migration state/log rather than inferred here.
