// @ts-check
import { BUSINESS_LAUNCH_CHECKLIST_SECTIONS, BUSINESS_PLAN_OUTLINE_SECTIONS,
  calculateBreakEvenPlan, calculateServiceMenuPlan, calculateAddOnProfitPlan } from "./business-plan-template-tools.js"
import { BUSINESS_INCOME_LOCAL_STORAGE_KEY, calculateBusinessIncomePlan } from "./business-income-planner.js"
import { BUSINESS_PLANNER_NOTICE } from "./business-planner-guidance.js"

export const LAUNCH_CHECKLIST_STORAGE_KEY = "massagelab-business-planner-launch-checklist-v1"
export const PLAN_OUTLINE_STORAGE_KEY = "massagelab-business-planner-plan-outline-v1"
export const PLANNER_ANSWER_LIMIT = 12000
export const PLANNER_SOURCE_STATUS_LABELS = Object.freeze({ saved: "Saved draft", missing: "No saved draft", invalid: "Unreadable draft", unavailable: "Storage unavailable", incomplete: "Incomplete draft" })

export const PLANNER_REPORT_SOURCES = Object.freeze([
  { id: "checklist", label: "Practice Launch Checklist", key: LAUNCH_CHECKLIST_STORAGE_KEY, href: "/tools/business-planner/launch-checklist" },
  { id: "income", label: "Business Income Planner", key: BUSINESS_INCOME_LOCAL_STORAGE_KEY, href: "/tools/business-planner/income" },
  { id: "breakEven", label: "Startup Costs and Break-Even", key: "massagelab-business-planner-break-even-v1", href: "/tools/business-planner/break-even" },
  { id: "serviceMenu", label: "Service Menu and Policies", key: "massagelab-business-planner-service-menu-v1", href: "/tools/business-planner/service-menu" },
  { id: "addOn", label: "Add-On Profit Calculator", key: "massagelab-business-planner-add-on-profit-v1", href: "/tools/business-planner/add-on-profit" },
])

const answerHints = [
  ["Name the structure you are considering and what a legal or tax professional still needs to confirm.", "Explain why it fits your ownership, risk, tax and operating plans.", "Describe who works with whom, who pays whom and questions about the relationship to review with a professional.", "List the agreements, adviser and questions you need resolved before signing."],
  ["Record the license type, issuing authority, current status and requirements to confirm. Do not enter sensitive identifiers.", "List registration agencies, actions and any confirmation still needed.", "Describe planned retail sales and what the relevant authority has confirmed or needs to check.", "List renewal names, dates and budget references. Reuse saved expense budgets rather than counting costs twice."],
  ["Describe the type of location and the business location you are considering.", "Record the authority contacted, permission status and open questions.", "Summarize terms to review and who will review them. Do not paste confidential signed contracts.", "Describe privacy, accessibility, parking, arrival and mobile-service arrangements."],
  ["Name each owner and describe their role and responsibilities.", "List supporting roles and what each will handle.", "Identify documents and professional review needed; do not enter tax IDs, bank details or credentials.", "Assign responsibility for scheduling, finances, records, supplies and marketing."],
  ["Saved Service Menu prices are reused when available. Add only further service details here.", "Describe bookable days/times and booking arrangements. Hands-on capacity from Income is a separate planning assumption.", "Saved Service Menu notice rules are reused when available. Add exceptions or further notes here.", "Saved Service Menu fees are reused when available. Add only further policy notes here.", "Saved Service Menu privacy steps are reused when available. Describe processes, never client records."],
  ["Describe your training, strengths, professional interests and intended client experience. This can be reused in the outline.", "Record education, relevant work history, license/training summary and continuing education. This can be reused in the outline.", "Practice name and business contact are collected once above. Note logo/brand materials available; do not paste an image or secret information.", "Record review feedback, remaining changes and which professionals should review the draft."],
]

/** Existing text-based keys remain compatibility identifiers for all 25 checks.
 * @param {string} sectionId @param {string} item */
export function launchChecklistKey(sectionId, item) { return `${sectionId}:${item}` }

export const LAUNCH_REPORT_QUESTIONS = BUSINESS_LAUNCH_CHECKLIST_SECTIONS.flatMap((section, sectionIndex) => section.items.map((item, index) => ({
  key: launchChecklistKey(section.id, item), sectionId: section.id, sectionTitle: section.title,
  item, index, hint: answerHints[sectionIndex][index],
})))

/** @typedef {Record<string, unknown> & { schemaVersion: 2, answers: Record<string, string>, practice: { businessName: string, preparedBy: string, contact: string } }} LaunchDraft */
/** @typedef {{label: string, value: string}} ReportRow */
/** @typedef {{title: string, paragraphs: string[], rows: ReportRow[]}} ReportSection */
/** @typedef {{ kind: "launch" | "outline", title: string, practiceName: string, preparedBy: string, contact: string, generatedAt: string, notice: string, sections: ReportSection[] }} PlannerReport */
/** @typedef {{id: string, label: string, key: string, href: string, status: "saved" | "missing" | "invalid" | "unavailable" | "incomplete", draft: unknown}} PlannerSource */

/** Migrates legacy flat booleans additively, keeping answers independent from
 * checkmarks. Only known task responses and business identity fields survive.
 * @param {unknown} value
 * @returns {LaunchDraft}
 */
export function normalizeLaunchDraft(value) {
  const source = record(value)
  const answers = record(source.answers)
  const practice = record(source.practice)
  return { ...Object.fromEntries(LAUNCH_REPORT_QUESTIONS.map(({ key }) => [key, source[key] === true])),
    schemaVersion: 2,
    answers: Object.fromEntries(LAUNCH_REPORT_QUESTIONS.map(({ key }) => [key, text(answers[key], PLANNER_ANSWER_LIMIT)])),
    practice: { businessName: text(practice.businessName, 160), preparedBy: text(practice.preparedBy, 160), contact: text(practice.contact, 600) } }
}

/** Keep the original eight narrative fields and their full text; reuse does not
 * copy facts into them or overwrite existing wording. @param {unknown} value */
export function normalizePlanOutline(value) {
  const source = record(value)
  return Object.fromEntries(BUSINESS_PLAN_OUTLINE_SECTIONS.map(({ id }) => [id, text(source[id])]))
}

/** Reads only known tool keys. An unreadable source never erases another draft,
 * and partial objects never turn into apparently user-provided default budgets.
 * @param {{getItem: (key: string) => string | null}} storage
 * @returns {PlannerSource[]}
 */
export function readPlannerReportSources(storage) {
  return PLANNER_REPORT_SOURCES.map((definition) => {
    try {
      const raw = storage.getItem(definition.key)
      if (raw === null) return { ...definition, status: "missing", draft: null }
      let value
      try { value = JSON.parse(raw) } catch { return { ...definition, status: "invalid", draft: null } }
      if (!isRecord(value)) return { ...definition, status: "invalid", draft: null }
      const required = /** @type {Record<string, string[]>} */ ({
        checklist: [], income: ["desiredTakeHomeIncome", "taxSetAsideRate", "averageSessionMinutes", "weekdayClientHours", "vacationDays", "holidayDays", "personalDays", "weeklyAdminHours"],
        breakEven: ["servicePrice", "sessionsPerWeek", "weeksPerYear", "taxSetAsideRate", "startupCosts", "monthlyExpenses", "annualExpenses", "fundingSources"],
        serviceMenu: ["services", "cancellationNoticeHours", "lateCancellationFee", "noShowFee", "privacySteps"], addOn: ["products"],
      })[definition.id] ?? []
      if (required.some((key) => !Object.hasOwn(value, key))) return { ...definition, status: "incomplete", draft: null }
      if (!validSourceShape(definition.id, value)) return { ...definition, status: "incomplete", draft: null }
      if (definition.id === "income" && (!Object.hasOwn(value, "monthlyFixedExpenses") && !Array.isArray(value.monthlyExpenseItems)
        || !Object.hasOwn(value, "perSessionVariableCost") && !Array.isArray(value.sessionExpenseItems))) return { ...definition, status: "incomplete", draft: null }
      if (definition.id === "checklist" && !LAUNCH_REPORT_QUESTIONS.some(({ key }) => Object.hasOwn(value, key)) && !Object.hasOwn(value, "answers") && !Object.hasOwn(value, "practice")) return { ...definition, status: "incomplete", draft: null }
      return { ...definition, status: "saved", draft: definition.id === "checklist" ? normalizeLaunchDraft(value) : value }
    } catch { return { ...definition, status: "unavailable", draft: null } }
  })
}

/** @param {PlannerSource[]} sources @param {string} id */
function savedSource(sources, id) { return sources.find((source) => source.id === id && source.status === "saved") }

/** Structured facts keep their source labels and stay distinct from narrative.
 * Calculators are independent scenarios; their totals are never added together.
 * @param {string} sectionId @param {PlannerSource[]} sources
 * @returns {ReportRow[]}
 */
export function outlineContextRows(sectionId, sources) {
  const rows = /** @type {ReportRow[]} */ ([])
  const checklist = savedSource(sources, "checklist")
  if (checklist) {
    const draft = normalizeLaunchDraft(checklist.draft)
    const matching = sectionId === "operations" ? ["structure", "licensing", "location", "management", "client-policies"] : []
    for (const question of LAUNCH_REPORT_QUESTIONS) {
      const use = matching.includes(question.sectionId) || sectionId === "profile" && question.sectionId === "presentation" && question.index === 0
        || sectionId === "resume" && question.sectionId === "presentation" && question.index === 1
        || sectionId === "marketing" && question.sectionId === "presentation" && question.index === 2
      if (use && draft.answers[question.key].trim()) rows.push({ label: `Launch checklist - ${question.item}`, value: draft.answers[question.key] })
    }
  }
  const service = savedSource(sources, "serviceMenu")
  if (service && (sectionId === "service" || sectionId === "operations")) {
    const plan = calculateServiceMenuPlan(service.draft)
    if (sectionId === "service") rows.push(...plan.rows.map((row) => ({ label: `Service Menu - ${row.name}`, value: `${row.minutes} hands-on minutes; ${money(row.price)} per appointment` })))
    else rows.push({ label: "Service Menu - client policies", value: plan.policySummary })
  }
  const income = savedSource(sources, "income")
  if (income && (sectionId === "finances" || sectionId === "operations")) {
    const plan = calculateBusinessIncomePlan(income.draft)
    const input = plan.input
    if (sectionId === "operations") rows.push({ label: "Income Planner - planned capacity, not booking availability", value: `${plan.weeklyClientHours} hands-on hours/week; ${plan.weeklyTotalWorkHours} total work hours/week; ${plan.availableWeeks} working weeks/year. Daily hands-on hours: ${Object.entries(input.weekdayClientHours).map(([day, hours]) => `${day}: ${hours}`).join(", ")}. Desired calendar days off: vacation ${input.vacationDays}, holidays ${input.holidayDays}, personal/sick ${input.personalDays}.` })
    else {
      rows.push({ label: "Income Planner - spendable take-home target", value: `${money(input.desiredTakeHomeIncome)} / year` },
        { label: "Income Planner - estimated gross revenue needed", value: money(plan.requiredGrossRevenue) },
        { label: "Income Planner - annual business costs", value: money(plan.annualBusinessCosts) },
        { label: "Income Planner - additional personal benefits/reserves", value: `${money(plan.annualPersonalReserves)} / year` },
        { label: "Income Planner - user tax set-aside", value: `${input.taxSetAsideRate * 100}% (estimate, not a tax calculation)` },
        { label: "Income Planner - goal-based session prices", value: Object.entries(plan.sessionPrices).map(([minutes, price]) => `${minutes} min: ${price === null ? "Not calculable" : money(price)}`).join("; ") },
        { label: "Income Planner - schedule assumptions", value: `${plan.weeklyClientHours} hands-on hours/week, ${plan.availableWeeks} working weeks/year, ${input.averageSessionMinutes} hands-on minutes/appointment; ${input.sessionSupportMinutes} extra minutes/appointment and ${input.weeklyAdminHours} admin hours/week.` })
      for (const [label, items] of [["monthly expenses", input.monthlyExpenseItems], ["yearly expenses", input.yearlyExpenseItems], ["session costs", input.sessionExpenseItems], ["personal reserves", input.personalReserveItems]]) {
        for (const item of /** @type {typeof input.monthlyExpenseItems} */ (items)) rows.push({ label: `Income Planner - ${label}: ${item.name || "Unnamed item"}`, value: `${money(item.amount)} / ${item.frequency}` })
      }
      if (plan.warnings.length) rows.push({ label: "Income Planner - unresolved assumptions", value: plan.warnings.join(" ") })
      if (plan.employeeComparison) rows.push({ label: "Income Planner - optional employee comparison", value: `${money(input.employeeHourlyWage)} per paid hands-on hour; estimated yearly gross ${money(plan.employeeComparison.annualGross)}, after the same set-aside ${money(plan.employeeComparison.estimatedTakeHome)}. Excludes tips, commissions and employer benefits.` })
    }
  }
  if (sectionId === "finances") {
    const breakEven = savedSource(sources, "breakEven")
    if (breakEven) {
      const plan = calculateBreakEvenPlan(breakEven.draft)
      rows.push({ label: "Break-Even - startup costs", value: money(plan.startupCostTotal) }, { label: "Break-Even - planned funding", value: money(plan.fundingTotal) },
        { label: "Break-Even - unfunded startup amount", value: money(plan.startupFundingGap) }, { label: "Break-Even - annual operating costs", value: money(plan.annualOperatingCost) },
        { label: "Break-Even - projected annual gross", value: money(plan.projectedAnnualGross) },
        { label: "Break-Even - projected amount after expenses and gross-revenue tax set-aside", value: money(plan.projectedNetAfterExpensesAndTax) },
        { label: "Break-Even - assumed service volume", value: `${money(plan.input.servicePrice)} per session, ${plan.input.sessionsPerWeek} sessions/week, ${plan.input.weeksPerYear} weeks/year; ${plan.input.taxSetAsideRate * 100}% gross-revenue set-aside.` },
        { label: "Break-Even - monthly sessions to cover operating costs", value: plan.monthlyBreakEvenSessions === null ? "Not calculable - add a service price" : String(plan.monthlyBreakEvenSessions) })
      const groups = /** @type {const} */ ([
        { id: "startupCosts", label: "Startup cost", unit: "one time" }, { id: "fundingSources", label: "Funding source", unit: "one time" },
        { id: "monthlyExpenses", label: "Monthly expense", unit: "month" }, { id: "annualExpenses", label: "Yearly expense", unit: "year" },
      ])
      for (const group of groups) for (const item of plan.input[group.id]) rows.push({ label: `Break-Even - ${group.label}: ${item.label}`, value: `${money(item.amount)} / ${group.unit}` })
      if (plan.warnings.length) rows.push({ label: "Break-Even - unresolved assumptions", value: plan.warnings.join(" ") })
    }
    const addOn = savedSource(sources, "addOn")
    if (addOn) {
      const plan = calculateAddOnProfitPlan(addOn.draft)
      rows.push(...plan.rows.map((row) => ({ label: `Add-On Profit - ${row.name}`, value: `Cost ${money(row.wholesaleCost)}, price ${money(row.retailPrice)}, ${row.estimatedMonthlySales} sales/month; estimated annual profit ${money(row.yearlyProfit)} before overhead/taxes.` })))
    }
  }
  return rows
}

/** Returns optional source facts beside a checklist answer without marking it
 * complete or copying those facts into the user's editable response.
 * @param {string} key @param {PlannerSource[]} sources */
export function checklistContextRows(key, sources) {
  const question = LAUNCH_REPORT_QUESTIONS.find((item) => item.key === key)
  if (!question || question.sectionId !== "client-policies") return []
  if (question.index === 1) return outlineContextRows("operations", sources).filter((row) => row.label.startsWith("Income Planner"))
  const source = savedSource(sources, "serviceMenu")
  if (!source) return []
  const plan = calculateServiceMenuPlan(source.draft)
  if (question.index === 0) return outlineContextRows("service", sources)
  if (question.index === 2) return [{ label: "Service Menu - cancellation notice", value: `${plan.input.cancellationNoticeHours} hours` }]
  if (question.index === 3) return [{ label: "Service Menu - missed appointment fees", value: `Late cancellation: ${money(plan.input.lateCancellationFee)}; no-show: ${money(plan.input.noShowFee)}` }]
  return [{ label: "Service Menu - documentation privacy steps", value: plan.input.privacySteps.join("\n") }]
}

/** @param {"launch" | "outline"} kind @param {unknown} draft @param {PlannerSource[]} sources @param {string} [generatedAt] @returns {PlannerReport} */
export function buildPlannerReport(kind, draft, sources, generatedAt = new Date().toISOString()) {
  const ownLaunch = kind === "launch" ? normalizeLaunchDraft(draft) : normalizeLaunchDraft(savedSource(sources, "checklist")?.draft)
  const outline = normalizePlanOutline(draft)
  const sections = /** @type {ReportSection[]} */ ([])
  if (kind === "launch") {
    for (const section of BUSINESS_LAUNCH_CHECKLIST_SECTIONS) {
      const questions = LAUNCH_REPORT_QUESTIONS.filter((question) => question.sectionId === section.id)
      sections.push({ title: section.title, paragraphs: [], rows: questions.flatMap((question) => [
        { label: `${ownLaunch[question.key] === true ? "Marked complete" : "Not marked complete"} - ${question.item}`, value: ownLaunch.answers[question.key].trim() || "No written response provided." },
        ...checklistContextRows(question.key, sources),
      ]) })
    }
    const financialRows = outlineContextRows("finances", sources)
    if (financialRows.length) sections.push({ title: "Saved financial planning scenarios", paragraphs: ["These tools are separate planning scenarios. Their totals are not combined or reconciled automatically. Review differences, source assumptions and current costs with a professional."], rows: financialRows })
  } else {
    for (const section of BUSINESS_PLAN_OUTLINE_SECTIONS) {
      const rows = outlineContextRows(section.id, sources)
      sections.push({ title: section.title, paragraphs: [outline[section.id].trim() || (rows.length ? "Saved planner information is included below. Add narrative or interpretation if needed." : "No narrative or saved context provided yet.")], rows })
    }
  }
  const sourceRows = sources.map((source) => ({ label: source.label, value: source.status === "saved" ? "Included from the locally saved draft. User-entered, not independently verified." : `${PLANNER_SOURCE_STATUS_LABELS[source.status]}: no information imported. Open this tool to review its draft.` }))
  const outstanding = kind === "launch" ? `${LAUNCH_REPORT_QUESTIONS.filter(({ key }) => ownLaunch[key] !== true).length} checklist tasks are not marked complete. A checkmark is not proof of compliance.`
    : "Review each narrative section, the imported facts and any gaps before sharing this working draft."
  sections.push({ title: "Sources and review needs", paragraphs: [outstanding, "Financial tools may use different assumptions. Reconcile differences; figures are estimates, not financial statements. Ask your lender which funding-request details, cash-flow/projections, market research and supporting documents are required. This report does not prepare a complete loan application.", "Do not include client information, passwords, tax IDs, bank-account details or other secrets. Review all contents before sharing."], rows: sourceRows })
  return { kind, title: kind === "launch" ? "Practice Launch Report" : "Business Plan Working Draft", practiceName: ownLaunch.practice.businessName.trim() || "Practice name not provided", preparedBy: ownLaunch.practice.preparedBy, contact: ownLaunch.practice.contact, generatedAt, notice: BUSINESS_PLANNER_NOTICE, sections }
}

/** @param {unknown} value @returns {value is Record<string, unknown>} */
function isRecord(value) { return typeof value === "object" && value !== null && !Array.isArray(value) }
/** @param {unknown} value @returns {Record<string, unknown>} */
function record(value) { return isRecord(value) ? value : {} }
/** Removes invisible control codes for document safety, never HTML-encodes or
 * silently shortens existing narrative. @param {unknown} value @param {number} [limit] */
function text(value, limit = Infinity) { return typeof value === "string" ? value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").slice(0, limit) : "" }
/** @param {number} value */
function money(value) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value) }

/** Partial/invalid saved objects are not evidence for a calculator's defaults.
 * Only complete numeric/row shapes may generate sourced estimates.
 * @param {string} id @param {Record<string, unknown>} value */
function validSourceShape(id, value) {
  const numeric = /** @type {Record<string, string[]>} */ ({
    income: ["desiredTakeHomeIncome", "taxSetAsideRate", "averageSessionMinutes", "vacationDays", "holidayDays", "personalDays", "weeklyAdminHours"],
    breakEven: ["servicePrice", "sessionsPerWeek", "weeksPerYear", "taxSetAsideRate"],
    serviceMenu: ["cancellationNoticeHours", "lateCancellationFee", "noShowFee"],
  })[id] ?? []
  if (numeric.some((key) => !finite(value[key]))) return false
  if (id === "income") {
    const days = record(value.weekdayClientHours)
    if (["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].some((day) => !finite(days[day]))) return false
    for (const [arrayKey, scalarKey] of [["monthlyExpenseItems", "monthlyFixedExpenses"], ["sessionExpenseItems", "perSessionVariableCost"]]) {
      if (Object.hasOwn(value, arrayKey) ? !validItems(value[arrayKey], ["amount"], "name") : !finite(value[scalarKey])) return false
    }
    for (const key of ["yearlyExpenseItems", "personalReserveItems"]) if (Object.hasOwn(value, key) && !validItems(value[key], ["amount"], "name")) return false
    const periods = /** @type {Record<string, string[]>} */ ({ monthlyExpenseItems: ["month"], yearlyExpenseItems: ["year"], sessionExpenseItems: ["session", "month", "year"], personalReserveItems: ["month", "year"] })
    for (const [key, allowed] of Object.entries(periods)) if (Array.isArray(value[key]) && value[key].some((item) => !isRecord(item) || !allowed.includes(String(item.frequency)))) return false
  }
  if (id === "breakEven") for (const key of ["startupCosts", "monthlyExpenses", "annualExpenses", "fundingSources"]) if (!validCalculatorItems(value[key], ["amount"], "label")) return false
  if (id === "serviceMenu" && (!validCalculatorItems(value.services, ["minutes", "price"], "name") || !Array.isArray(value.privacySteps) || value.privacySteps.some((step) => typeof step !== "string"))) return false
  if (id === "addOn" && !validCalculatorItems(value.products, ["wholesaleCost", "retailPrice", "estimatedMonthlySales"], "name")) return false
  return true
}
/** @param {unknown} value */
function finite(value) { return typeof value === "number" && Number.isFinite(value) && value >= 0 }
/** @param {unknown} value @param {string[]} numbers @param {string} name */
function validItems(value, numbers, name) { return Array.isArray(value) && value.every((item) => isRecord(item) && typeof item[name] === "string" && numbers.every((key) => finite(item[key]))) }
/** These calculators replace empty arrays with editable placeholder rows. Such
 * a draft is incomplete report evidence, not a saved service or budget item.
 * Income expense arrays keep their separate, genuinely empty-list semantics.
 * @param {unknown} value @param {string[]} numbers @param {string} name */
function validCalculatorItems(value, numbers, name) { return Array.isArray(value) && value.length > 0 && validItems(value, numbers, name) }
