# Business Income Planner phone layout

Status: verified locally on `codex/business-income-mobile`, based on the
separately approved breathing/Clock candidate. No planner publication yet.

## Requested outcome

The owner's phone screenshots show the scenario/input/result column exceeding
the viewport and an introductory callout consuming most of the first screen.
Keep all calculations, presets, field meanings, account/device persistence and
the established visual materials. Make this feel like an integrated working
tool, with inputs visible sooner and no sideways page scrolling.

## Design and implementation

- Replace the large orange callout with one compact semantic page heading, a
  brief purpose line, a quiet business-tools back link and the existing save
  status. Put the fuller explanation in an optional disclosure.
- Use four compact scenario buttons in a two-column phone grid and show the
  selected scenario's description once. Keep all four existing preset actions
  and values, accessible pressed state and the same application button library.
- Give every grid/flex boundary an explicit zero minimum inline size. Use
  `minmax(0, 1fr)` for tracks and constrain native inputs to their field width.
  Bound the chart by its available width and explicit height rather than letting
  a minimum height plus aspect ratio impose an oversized intrinsic width.
- Keep form/results cards in the existing theme surfaces with tighter phone
  spacing and compact two-column result tiles. Use wider form/result columns
  only when the viewport can support them. Allow ordinary vertical scrolling.
- Scope all styling to this route. Do not hide horizontal overflow as a way to
  conceal content, alter financial assumptions/formulas, change storage keys,
  add live account reads/writes or modify the approved release branch.

## Verification

Reproduce the old overflow with a rendered regression before the fix. Check
320/360/390/412px phones, short landscape and desktop; normal and enlarged text;
all scenario choices; inputs, explanatory copy, results, chart and scroll owners.
Require no horizontal overflow and a compact header. Exercise a synthetic input
edit, result recalculation, device-draft reload and disclosure/back navigation.
Preserve anonymous no-account-sync behavior and use the existing inert QA build
and exact external-fixture network guard. Run focused planner domain/browser
checks, lint and TypeScript/build validation. Inspect actual screenshots and
save evidence outside source. Reconcile canonical state/log with outcomes.

The active breathing/Clock publication remains a separate operation. This local
planner work does not extend that release's source or provider authority.

## Accepted results

The new actual-app regression reproduces 223px of nested horizontal overflow at
320px against the unchanged `e944178` QA build before the planner repair. The
first control interaction must wait for the synthetic device draft to hydrate;
an earlier click before hydration was not valid layout evidence.

The repaired route passes four actual-app cases across desktop Chromium and
mobile Chromium, with no retries or skips. Each layout case exercises all four
presets at 320/360/390/412px, 780x360 landscape and 1280x900 desktop. Nested
cards, buttons, inputs, labels and copy stay within their own widths, including
320px with 24px root text. Ordinary phone headers are at most 180px high and the
take-home input is fully within the viewport at the top of the scroller.

The behavior case verifies the existing default $97,880 gross target, a
synthetic $65,000 take-home edit yielding $104,547, and the same edited value and
result after reload. It checks the help disclosure and business-tools back link,
and rejects client errors, failed local responses, external traffic and anonymous
account-sync requests. This does not exercise a live signed-in account save.

All 46 existing planner calculation/source/storage checks pass, including denied
reads, quota failure, corrupt-draft recovery and isolated mocked account saves.
The fixture bundler now loads the real route CSS using the same Next stylesheet
and trace setup used by the Clock fixtures. Focused lint and the inert 115-page
build, including TypeScript, pass. A fresh local Prisma client was generated from
the existing schema; no database was contacted or changed.

Connected Chrome confirms the compact heading, default scenario/inputs, working
optional guidance and zero horizontal overflow, with no captured warnings or
errors. Exact phone coverage comes from the automated viewports; physical-phone
and Safari acceptance are still owner checks. Screenshots are outside source in
the session's `planner-accepted-final` evidence folder. The local preview runs
at `http://127.0.0.1:3018/tools/business-planner/income`.

The approved breathing/Clock branch remains clean at `e944178`. Its publication
has not started because Vercel CLI authentication is unavailable; the browser
device request expired and a fresh private sign-in is pending. This planner
candidate has not been pushed, deployed or added to that approved release.
