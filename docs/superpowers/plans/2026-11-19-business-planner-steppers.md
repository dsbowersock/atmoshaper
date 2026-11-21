# Business Planner tool polish and guided steps

Status: **implemented and verified locally**, from published `7785ae6` and its
local completion receipt on `codex/business-planner-steppers`.

## Requested experience

Polish the Business Planner hub and all six tools for phone-first use. Use a
stepper where the worksheet has distinct stages, reducing the long stack of
forms while keeping navigation, existing entries and results easy to find.
Keep the established AtmoShaper font, dark/light surfaces, icons and tactile
Button materials. No new dependency, asset, account feature or financial model
is needed. The previous publication operation stays closed.

## Design and flow

The hub uses a compact title and six centered orange Glow outline tool buttons
with short descriptions. Repeated Live badges and the template eyebrow give way to useful
tool choices; the planning-estimate explanation remains available inline.
Tool headers share compact geometry, a back link, accurate save state and
optional guidance. Existing blue buttons carry navigation, quiet surfaces carry
form groups, and tabular figures carry estimates. Existing tokens own palette
and typography; no global styling changes are proposed.

`Hub -> tool -> current step -> Back/Continue or section jump -> review` is the
flow. Desktop step buttons and a phone section selector show the current step.
Input sections remain mounted behind explicit hidden state, retaining drafts.
The result-only Income stage defers its chart until visible to avoid measuring
a hidden container.
Changing steps focuses its heading and returns the step navigation into view.
Any section can be revisited; visiting is not represented as task completion.

- Income: Scenario, Income and costs, Time and schedule, Estimate.
- Break-Even: Service and schedule, Opening costs/funding, Ongoing costs, Estimate.
- Service Menu: Services/prices, Client policies/privacy, Review.
- Launch Checklist: the existing six task groups, retaining actual checked counts.
- Plan Outline: Purpose, Services/operations, Marketing/finances, Profile/resume,
  then the existing complete outline preview.
- Add-On Profit: one contained workspace for products/costs/prices and results;
  a stepper would separate a single immediate calculation unnecessarily.

New or existing monetary inputs use visible dollar units, duration/volume inputs
use explicit units, and ambiguous fields receive linked plain-language help.
Keep existing IDs, defaults, calculations, category/section keys, storage keys,
normalizers, account-sync ownership and reset/add/remove behavior unchanged.
Storage failures remain visible outside the selected step. Do not imply a
successful save or completed business task merely because a step is visited.

## Verification

Reuse the existing planner calculation/source/storage and SEO/identity checks.
Add real-browser coverage for hub containment and all tools, step navigation,
focus, Back, direct jumps, draft retention/reload, add/remove/reset, live results
and units/help. Update earlier whole-worksheet browser cases to select the
relevant steps rather than weakening their assertions. Cover 320–412px phones,
landscape/desktop, enlarged text and light/dark presentation. Preserve all
storage-denial, unread/corrupt draft and mocked account-sync tests.

Run focused lint, the inert TypeScript/115-page browser-QA build and applicable
actual-app regressions. Inspect rendered screenshots and console health in the
connected browser. Store screenshots/traces outside source. Verify domain,
dependency, schema and server/data contracts remain unchanged. Record actual
results and any gaps in canonical state/log before handoff.

This is local work only. Deployment, provider settings, database operations,
payments, email, legal changes and changes to the previous release are outside
this request. The final local preview will be available for review.

## Completed validation and handoff

- `npm run test:business-planners`: 46/46 pass, including all six tools' storage
  denial/quota/corrupt recovery, Strict Mode hydration and mocked Income sync.
- Focused ESLint passes for the planner directory and changed tests/helpers.
- `npm run test:seo`: 17/17; `npm run test:breathing-guards`: 2/2.
- `npm run build:browser-qa`: compilation, TypeScript and all 115 pages pass.
  This uses the existing inert provider environment; no live build gates run.
- The focused public-route browser suite passes 22/22, on desktop and mobile
  Chromium. It covers the six-tool launcher, every guided stage, keyboard focus,
  Back/Continue/direct jumps, values through reload, unchanged calculations,
  add/remove/reset, explicit units/help, 320–412px phones, 780px landscape,
  1280px desktop and 24px root text. Hub screenshots cover dark and light themes
  after the existing theme transition completes. No client errors, failed local
  responses or forbidden requests are observed in these checks.
- The first responsive pass exposed over-reserved unit padding in enlarged
  Minutes controls. Short units now leave more space for digits/native controls;
  containment assertions are retained and pass. The Add-On test also checks
  enlarged text. The navigation helper finds the actual combobox role rather
  than matching all text inside a wrapping label.
- Manual Chrome review verifies the compact hub and Income/Service Menu steps,
  estimates and navigation without client errors. Temporary viewport overrides
  are reset. The hub preview remains open at
  `http://127.0.0.1:3018/tools/business-planner`; screenshots/build logs are
  outside the repository.

Financial libraries, original defaults/IDs, schemas, storage keys, account-sync
ownership, dependencies and server/data contracts are unchanged. This task does
not exercise a real signed-in account or claim hosted/live release validation.
Review/publication is the next separate operation if requested.

### Owner's hub material refinement

After reviewing the preview, the owner selects the existing orange Glow outline
material for all six hub links. Only that page's Button variant changes from
`ctaBlue` to `glow`; worksheet step controls and global styles remain intact.
Fresh focused ESLint, the inert TypeScript/115-page build and both hub browser
cases pass. Those cases recheck phone widths, enlarged text and both themes.
Chrome also confirms Glow on all six rendered links. Updated screenshots stay
outside source and the local preview remains available; no publication occurs.
