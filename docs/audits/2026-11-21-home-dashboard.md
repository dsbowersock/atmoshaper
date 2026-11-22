# Local home dashboard review

Scope: the owner requests a quieter home page, with an informational launch pad
for first visitors and an app-like dashboard for returning users. They choose
balanced emphasis across music, clock, wellness, calendar, study and practice.
This candidate is local; no release, provider or live-record write is authorized.

## Behavior and preservation

- Six default launchers replace repeated hero, proof cards, rails and catalog.
  Phones use two columns; wider screens use three. Study and practice open
  category sheets; All tools uses the canonical permission-filtered sidebar.
- Explicit saved shortcut order, keys and destinations remain compatible.
  Inferred role defaults are replaced only on home by the balanced defaults.
  The existing onboarding editor and its available shortcut catalog are retained.
- Signed-in visitors see their launcher immediately. Guests can dismiss the
  introduction; browser storage retains only a boolean, with an in-memory
  fallback if storage is denied. About remains available in both modes.
- Home reads preferences and navigation permissions only. It never reads or
  summarizes wellness, clinical or calendar records. Preference failure falls
  back to public defaults. Navigation visibility grants no additional access.
- The shared shell, bottom controls, persistent player, routes, metadata, legal
  document versions, authentication and entitlements remain with their owners.
- Shared Radix sheet descriptions and focus restoration are verified. Sheet
  controls wait for hydration so a cold first tap cannot be silently lost.

## Visual fidelity ledger

Concept: `output/home-dashboard/design-concept.png`, generated as a three-screen
390 × 844 reference board. It is review material, never used as application UI.
The native render uses actual React controls, current Inter font and site CSS.

| Point | Concept | Render / decision |
| --- | --- | --- |
| Primary hierarchy | Small brand, one introduction, launcher | Same hierarchy; no large marketing hero |
| Phone grid | Two columns, three rows, centered icons/text | Same six positions; all labels fit at 320 and 390 px |
| Action colors | Music glow, clock blue, wellness purple, calendar green, study light blue, practice teal | Existing button variants and setup tone supply these materials |
| Page density | Six tiles and a compact footer | 112 px minimum phone tiles; the first-visit footer fits above navigation at 390 × 844 |
| Returning mode | Welcome back / Your tools | Same copy; signed-in accounts retain explicit custom picks |
| Directory | Bottom sheet, four sidebar groups | Same grouping and native sheet; scrolls when contents exceed screen height |
| Persistent controls | Existing bottom app bar | Actual unchanged shared shell; source fixture reserves its footprint only |
| Wider layout | Phone-first reference | Three columns at wider widths, retaining existing sidebar space |

Intentional deviations: keep existing muted leaf green and teal instead of the
concept's brighter saturation; keep current button corners, shadows, font and
actual app-bar geometry. Guest returners retain Sign in / Create an account.
Only signed-in accounts get Account / Edit shortcuts. A small Use dashboard
action is added for explicit intro dismissal. Sheet close targets are 44 px.

Subsequent owner amendment: use the existing canonical wordmark at the top in
place of visible heading text. Its natural aspect ratio is preserved at 224 px
on the inspected phone (64 px high), with flexible shrinking and a wider
desktop size. A hidden text span keeps one accessible AtmoShaper heading; the
image is decorative to assistive technology. Actual asset loading and fit are
verified in the embedded preview; proof: `output/home-dashboard/home-wordmark.jpg`.
The existing geometry/SSR journey and 93 model/streamed-owner checks pass.
Historical Phase 6 home-crop screenshots now have an intentional visual delta;
refresh each platform's baseline on the verified candidate before that legacy
screenshot suite is used for release acceptance. No such baseline run is
claimed here.

Above-fold copy comparison: brand, introduction, Start here / Your tools, all
six default tile labels, About AtmoShaper, account link and public-tools note
match the reference intent. All tools is also available on first visit. The
long audience animation, repeated discovery headings, descriptions and badges
are removed. Additional product/privacy/membership explanations move into About.

## Verification

The owner subsequently chooses the regular orange material for Practice tools,
replacing its teal setup tone. The existing default Button variant supplies it;
the mobile preview confirms the result. Proof:
`output/home-dashboard/practice-tools-orange.jpg`.

- `npm run test:home-dashboard`: 94 checks pass, including real rendered
  components, 320 × 640, 390 × 844, 768 × 1024 with expanded-sidebar footprint,
  1280 × 900, short landscape, both themes, explicit order, denied storage,
  sheet keyboard/focus handling and accessible streamed owners. No fixture
  runtime warnings/errors or external requests are observed.
- `npm run lint:home-dashboard` passes, including both preview scripts.
- The earlier Clock page-prop conflict is corrected at the owner's explicit
  request. The screen is extracted unchanged to `app/chimer/chimer-screen.tsx`,
  and route entry points no longer accept its internal preview option. Actual
  Next route generation (`npm run typegen`) and the normal full
  `npm run typecheck` now pass, superseding the earlier source-only result.
  All 238 related checks and Clock lint pass. The normalized extracted source
  SHA-256 is `72459eb518b7d4e2b5cb7ac003505f96fcf546604229e0397681535f7c77ade0`,
  matching the base screen implementation.
- Actual SSR hydration is now covered in the home regression: hold the client
  bundle, verify pre-hydration controls are disabled, then release it and verify
  a saved returning preference and functional sheet with no React hydration or
  recoverable errors. The complete 94-check home suite and focused lint pass.
- The embedded browser shows the actual home, directory, returning mode and
  theme switch. Later DOM/screenshot timeouts require standalone Chromium for
  final native acceptance. Temporary embedded viewport sizing is reset.
- `npm run verify:home-dashboard-preview` passes in standalone Chromium against
  the actual Next guest preview at 390 × 844, 768 × 1024 and 1280 × 900. Both
  themes, directory routes, Escape/focus restoration, returning state after
  reload, Clock navigation and browser Back pass. No page/console errors,
  missing-description warnings or external requests are observed. Development
  route compilation is allowed to complete before asserting navigation.
- Native receipt: `output/home-dashboard/native-acceptance.json`. Screenshots:
  `native-{phone,tablet,desktop}-{first,returning,directory,light}.png` in the
  same folder. The final reference concept and latest native screenshot are
  visually inspected alongside the phone render; the ledger above records
  matching points and intentional deviations. This is local acceptance, not a
  replacement for production-build, hosted or physical-device verification.

## Preview and remaining release gates

Run `npm run preview:home-dashboard` from this isolated checkout, then open
http://127.0.0.1:3025/. The restart command refuses environment files and passes
only OS/tooling environment variables, a fresh local auth secret and closed
loopback database target. It is a guest visual preview, not a real account login.

The user's existing embedded tab retained older client code while receiving new
HTML. A normal reload did not clear the mismatch. The same restarted server is
verified interactively at http://localhost:3025/ with enabled controls and a
working directory, without a current hydration overlay. Proof screenshot:
`output/home-dashboard/preview-hydration-fixed.jpg`. No browser settings,
clinical vaults, local records or cache databases are deleted. This establishes
the recovered preview, not the particular browser cache layer responsible.

Before publication: run required release checks, obtain substantive current-source Codex and
CodeRabbit review, and complete protected/staged acceptance. No PR, remote push,
provider configuration, hosted data write or deployment occurs in this task.
