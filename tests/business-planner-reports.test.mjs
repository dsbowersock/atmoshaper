import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { BUSINESS_PLANNER_NOTICE, BUSINESS_PLANNER_SHORT_NOTICE } from "../lib/business-planner-guidance.js"
import { buildPlannerReport, LAUNCH_REPORT_QUESTIONS, normalizeLaunchDraft, normalizePlanOutline,
  outlineContextRows, PLANNER_REPORT_SOURCES, readPlannerReportSources } from "../lib/business-planner-reports.js"
import { plannerReportSample } from "./fixtures/business-planner-report-sample.mjs"

describe("Business planner answers and sourced reports", () => {
  it("migrates old checkmarks and keeps response text independent of completion", () => {
    const [first, second] = LAUNCH_REPORT_QUESTIONS
    const legacy = { [first.key]: true, [second.key]: false }
    const draft = normalizeLaunchDraft({ ...legacy, answers: { [second.key]: "Need to discuss ownership.", unknown: "drop" }, practice: { businessName: "Example", password: "never keep" }, clientName: "never keep" })
    assert.equal(draft[first.key], true)
    assert.equal(draft[second.key], false)
    assert.equal(draft.answers[second.key], "Need to discuss ownership.")
    assert.equal(Object.hasOwn(draft.answers, "unknown"), false)
    assert.equal(JSON.stringify(draft).includes("never keep"), false)
    assert.deepEqual(normalizeLaunchDraft(draft), draft)
    assert.equal(LAUNCH_REPORT_QUESTIONS.length, 25)
  })

  it("reports every checklist answer, real check state and informational limits", () => {
    const { launch, sources } = plannerReportSample()
    const report = buildPlannerReport("launch", launch, sources, "2026-11-20T12:00:00Z")
    const serialized = JSON.stringify(report)
    for (let index = 1; index <= 25; index += 1) assert.ok(serialized.includes(`EXAMPLE-ANSWER-${index}:`))
    assert.ok(serialized.includes("24 checklist tasks are not marked complete"))
    assert.ok(serialized.includes("Marked complete -"))
    assert.equal(report.practiceName, "Cedar Example Practice")
    assert.equal(report.notice, BUSINESS_PLANNER_NOTICE)
    assert.match(report.notice, /not legal, financial, tax or accounting advice/)
    assert.match(report.notice, /licensed or credentialed professionals/)
    assert.match(BUSINESS_PLANNER_SHORT_NOTICE, /Information only/)
    assert.match(serialized, /not prepare a complete loan application/)
  })

  it("reuses profile, services, policies and separate financial scenarios without rewriting notes", () => {
    const { sources } = plannerReportSample()
    const outline = normalizePlanOutline({ mission: "My exact mission.", finances: "My lender questions." })
    const before = JSON.stringify(outline)
    const report = buildPlannerReport("outline", outline, sources)
    assert.equal(JSON.stringify(outline), before)
    assert.deepEqual(normalizePlanOutline(outline), outline)
    assert.ok(outlineContextRows("profile", sources).some((row) => row.value.includes("EXAMPLE-ANSWER-22")))
    assert.ok(outlineContextRows("resume", sources).some((row) => row.value.includes("EXAMPLE-ANSWER-23")))
    assert.ok(outlineContextRows("service", sources).some((row) => row.label.startsWith("Service Menu")))
    const finances = report.sections.find((section) => section.title === "Financial Analysis")
    assert.equal(finances.paragraphs[0], "My lender questions.")
    for (const prefix of ["Income Planner", "Break-Even", "Add-On Profit"]) assert.ok(finances.rows.some((row) => row.label.startsWith(prefix)))
    const withoutIncome = buildPlannerReport("outline", outline, sources.filter((source) => source.id !== "income"))
    assert.ok(!JSON.stringify(withoutIncome).includes("Income Planner -"))
    assert.equal(outline.finances, "My lender questions.")
  })

  it("distinguishes missing, malformed, partial and unreadable sources without defaults or writes", () => {
    const bad = new Map([
      [PLANNER_REPORT_SOURCES[1].key, '{"desiredTakeHomeIncome":60000}'],
      [PLANNER_REPORT_SOURCES[2].key, "{broken"],
    ])
    const sources = readPlannerReportSources({ getItem: (key) => {
      if (key === PLANNER_REPORT_SOURCES[3].key) throw new Error("denied")
      return bad.get(key) ?? null
    } })
    assert.deepEqual(sources.map((source) => source.status), ["missing", "incomplete", "invalid", "unavailable", "missing"])
    assert.deepEqual(outlineContextRows("finances", sources), [])
    assert.equal(bad.size, 2)
    const incomplete = buildPlannerReport("outline", {}, sources)
    assert.ok(JSON.stringify(incomplete).includes("No narrative or saved context provided yet."))
    assert.ok(!JSON.stringify(incomplete).includes("$97,880"))
  })

  it("refreshed sources change reused facts, not authored narrative", () => {
    const { drafts, sources } = plannerReportSample()
    const service = PLANNER_REPORT_SOURCES.find((source) => source.id === "serviceMenu")
    const stored = JSON.parse(drafts.get(service.key))
    stored.services[0].price = 123
    drafts.set(service.key, JSON.stringify(stored))
    const fresh = readPlannerReportSources({ getItem: (key) => drafts.get(key) ?? null })
    assert.notDeepEqual(outlineContextRows("service", sources), outlineContextRows("service", fresh))
    assert.ok(outlineContextRows("service", fresh).some((row) => row.value.includes("$123.00")))
  })

  it("does not turn malformed financial rows or expense periods into imported estimates", () => {
    const { drafts } = plannerReportSample()
    const income = PLANNER_REPORT_SOURCES.find((source) => source.id === "income")
    const breakEven = PLANNER_REPORT_SOURCES.find((source) => source.id === "breakEven")
    const incomeDraft = JSON.parse(drafts.get(income.key))
    incomeDraft.monthlyExpenseItems[0].frequency = "week"
    drafts.set(income.key, JSON.stringify(incomeDraft))
    const breakEvenDraft = JSON.parse(drafts.get(breakEven.key))
    breakEvenDraft.startupCosts[0].amount = "unknown"
    drafts.set(breakEven.key, JSON.stringify(breakEvenDraft))
    const sources = readPlannerReportSources({ getItem: (key) => drafts.get(key) ?? null })
    assert.equal(sources.find((source) => source.id === "income").status, "incomplete")
    assert.equal(sources.find((source) => source.id === "breakEven").status, "incomplete")
    assert.ok(outlineContextRows("finances", sources).every((row) => row.label.startsWith("Add-On Profit")))
  })
})
