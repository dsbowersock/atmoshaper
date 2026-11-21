# Income Planner: named expenses, benefits and realistic time

Status: implemented and verified locally after `1e8c708`, on
`codex/income-expenses-benefits`.

## Scope and behavior

Keep four stages and the established materials. Step 2 gets named, editable
monthly/yearly business expense lists, session costs with per-session/monthly/
yearly frequency, and optional personal benefits/reserves. Each list supports
adding and removing rows, shows its total and retains names/amounts on reload.
Existing scalar expenses become one named row without changing their total.
Keep existing storage and appSettings keys; normalization remains idempotent
and allowlists the extended business-only shape. No new database or provider.

Business annual costs are monthly costs * 12 + yearly costs + session costs
budgeted monthly/yearly. Per-session amounts scale with annual appointments.
Never count the same cost in two lists. Personal reserves are additional to
desired spendable take-home: annualize monthly/yearly amounts, then gross up
take-home plus reserves using the user's existing tax set-aside assumption.
Do not assume tax deductions, contribution limits or recommended amounts.
Offer optional retirement, health, dental/vision, life, disability and emergency
reserve prompts, plus custom entries. Explain zero/omission and double counting.

IRS retirement contribution/deduction rules and health deduction limitations
are separate from a simple budget: https://www.irs.gov/retirement-plans/self-employed-individuals-calculating-your-own-retirement-plan-contribution-and-deduction
and https://www.irs.gov/instructions/i7206. These sources inform the decision
to keep reserve planning separate from tax eligibility calculations.

Step 3 asks how many calendar days off the user wants and identifies each day's
hands-on massage hours. Add per-appointment intake/turnaround minutes to weekly
workload separately from weekly admin. Hands-on hours remain explicitly entered;
extra time increases workload, without silently changing the client's schedule.
Keep the existing calendar-days-to-weeks model and show its assumption.

Step 4 shows currency labels directly on bars, a transparent cost/reserve/time
breakdown and a button returning to the Step 2 wage field with focus. Explain
the employee comparison's same hands-on hours/weeks and simple set-aside model;
it does not value tips, commissions or employer benefits.

## Verification and boundaries

Test legacy migration/idempotence, empty-list authority, strict sanitized rows,
frequency conversion, no double counting, benefits gross-up, workload and all
existing defaults. Extend draft/account preference round-trip checks. In actual
app QA edit/add/remove/reload each list, exercise the wage jump, inspect visible
bar labels and compare known estimates. Cover phone/desktop/enlarged text,
existing staged worksheets and storage error recovery. Run focused lint, planner
and account tests, inert app build and applicable browser checks. Review through
CUA, save evidence outside source and update canonical state/log.

No publication, live account write, payment, email, provider or database operation
is part of this request. Old clients cannot edit the new named rows, so any
later rollback needs to preserve an exported extended draft before using an
older client's normalizer. Do not claim reverse-schema compatibility.

## Completed behavior and verification

The four-stage flow is retained. Expense lists can be collapsed, edited, added
to or emptied. New rows receive stable IDs and keyboard focus; removing a row
returns focus to an adjacent row or the add control. A 100-row limit per list
and 120-character business labels bound saved data. Normalization strips unknown
row fields, keeps legacy scalar totals as derived compatibility values and
preserves fractional per-appointment assumptions. All stored/calculated totals
come from the authoritative lists; empty lists never revive legacy totals.
The existing account and device draft ownership/error recovery stays intact.

Benefits also include a medical out-of-pocket prompt. Suggestions start at zero
and are not recommended contribution amounts. No deductions, employer benefits,
tips or commissions are fabricated. Per-session frequency scales by appointment
counts; monthly/yearly session budgets remain fixed at each capacity. Support
time increases workload only. Existing presets, calendar-days-to-weeks and
same-hands-on-hours wage assumptions are retained and described in the UI.

- `npm run test:business-planners`: 49/49, including legacy/idempotent migration,
  fractional precision, clearing, frequency math, reserves/workload, all existing
  planner storage failures and mocked account-sync checks.
- `npm run test:income-preferences`: 24/24, including named budgets through the
  actual appSettings serialization helpers. This named script is added for reuse.
- Focused ESLint passes. `npm run test:seo`: 17/17;
  `npm run test:breathing-guards`: 2/2.
- Final `npm run build:browser-qa`: compile, TypeScript and 115/115 pages pass.
  One earlier build process exited before compilation with no diagnostic; a
  clean isolated retry of the same source passes. Provider settings stay inert.
- Actual-app public-route QA: 24/24 on desktop/mobile Chromium. New coverage
  migrates a scalar draft, edits/reloads all expense frequencies and reserve
  amounts, verifies a known estimate, removes named and final rows, checks visible
  cents labels, employee field focus and 320–1280px/enlarged-text containment.
  The original staged-tool/calculation checks remain. No failed local responses,
  client errors or forbidden requests are observed. The enlarged-text correction
  reduces nested padding; assertions are not relaxed.
- Manual Chrome review confirms the named groups, exact chart prices and the
  Step 4-to-Step 2 wage focus. The refreshed preview remains open at
  `http://127.0.0.1:3018/tools/business-planner/income`. Screenshots/build logs
  stay outside source. Real signed-in/provider flows and publication are not
  exercised by this local task.
