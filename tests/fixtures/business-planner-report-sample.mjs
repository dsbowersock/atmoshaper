import { BUSINESS_INCOME_PRESETS, normalizeBusinessIncomePlannerInput } from "../../lib/business-income-planner.js"
import { normalizeBreakEvenInput, normalizeServiceMenuInput, normalizeAddOnProfitInput } from "../../lib/business-plan-template-tools.js"
import { LAUNCH_REPORT_QUESTIONS, normalizeLaunchDraft, PLANNER_REPORT_SOURCES, readPlannerReportSources } from "../../lib/business-planner-reports.js"

/** Fictional, complete local drafts shared by model/PDF tests. No real user data. */
export function plannerReportSample() {
  const launch = normalizeLaunchDraft({
    practice: { businessName: "Cedar Example Practice", preparedBy: "Renée Müller", contact: "example@example.invalid" },
    answers: Object.fromEntries(LAUNCH_REPORT_QUESTIONS.map(({ key }, index) => [key, `EXAMPLE-ANSWER-${index + 1}: Working notes for professional review.`])),
    [LAUNCH_REPORT_QUESTIONS[0].key]: true,
  })
  const values = {
    checklist: launch,
    income: normalizeBusinessIncomePlannerInput({ presetKey: "growing_solo_practice", ...BUSINESS_INCOME_PRESETS.growing_solo_practice.values }),
    breakEven: normalizeBreakEvenInput({}),
    serviceMenu: normalizeServiceMenuInput({}),
    addOn: normalizeAddOnProfitInput({}),
  }
  const drafts = new Map(PLANNER_REPORT_SOURCES.map((source) => [source.key, JSON.stringify(values[source.id])]))
  return { launch, values, drafts, sources: readPlannerReportSources({ getItem: (key) => drafts.get(key) ?? null }) }
}
