"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"
import { BadgeDollarSign, BriefcaseBusiness, CalendarDays, Clock3, Percent, WalletCards } from "lucide-react"
import { AppInset } from "@/components/ui/app-surface"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  BUSINESS_INCOME_APP_SETTINGS_KEY,
  BUSINESS_INCOME_LOCAL_STORAGE_KEY,
  BUSINESS_INCOME_PRESETS,
  BUSINESS_INCOME_RESERVE_IDEAS,
  BUSINESS_INCOME_WEEKDAY_KEYS,
  calculateBusinessIncomePlan,
  normalizeBusinessIncomePlannerInput,
  sanitizeBusinessIncomePlannerPreference,
} from "@/lib/business-income-planner"
import { cn } from "@/lib/utils"
import { useBusinessPlannerDraft } from "@/lib/use-business-planner-draft"
import { BusinessDraftStorageNotice, NumberField, PlannerSection } from "../_components/business-tool-fields"
import { PlannerHeader } from "../_components/planner-header"
import { PlannerStep, PlannerStepper, PlannerStepJump } from "../_components/planner-stepper"
import { IncomeExpenseList } from "./income-expense-list"
import styles from "../_components/business-planner.module.css"

type PlannerInput = ReturnType<typeof normalizeBusinessIncomePlannerInput>
type PlannerPresetKey = keyof typeof BUSINESS_INCOME_PRESETS

type IncomePlannerClientProps = {
  isSignedIn: boolean
  displayName: string | null
  initialAccountPlanner: unknown
}

const presetKeys: PlannerPresetKey[] = [
  "starting_part_time",
  "growing_solo_practice",
  "full_schedule",
  "custom",
]

const weekdayLabels: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
}

const chartConfig = {
  sessionPrice60: {
    label: "60 minute session",
    color: "hsl(var(--primary))",
  },
} as const

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const preciseMoneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
})

function serializePlannerInput(value: PlannerInput) {
  return JSON.stringify(sanitizeBusinessIncomePlannerPreference(value))
}

/**
 * Seeds one worksheet from the account or device draft, then syncs actual edits.
 * Device-storage failure leaves account persistence independent and usable.
 */
export function IncomePlannerClient({
  isSignedIn,
  displayName,
  initialAccountPlanner,
}: IncomePlannerClientProps) {
  const { value: input, setValue: setInput, storageReady, storageUnavailable, unreadDraft, hydratedValue } = useBusinessPlannerDraft<PlannerInput>({
    storageKey: BUSINESS_INCOME_LOCAL_STORAGE_KEY,
    initialValue: () => normalizeBusinessIncomePlannerInput(initialAccountPlanner ?? presetPayload("growing_solo_practice")),
    normalize: normalizeBusinessIncomePlannerInput,
    preferInitialValue: Boolean(initialAccountPlanner),
    serialize: sanitizeBusinessIncomePlannerPreference,
  })
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const lastSyncedPlannerRef = useRef<string | null>(null)
  const plan = useMemo(() => calculateBusinessIncomePlan(input), [input])
  const chartData = useMemo(() => plan.workloadScenarios.map((scenario) => ({
    capacity: `${scenario.capacityPercent}%`,
    sessionPrice60: scenario.sessionPrice60 ?? 0,
  })), [plan])

  // A local-storage failure must not disable or manufacture an account save.
  useEffect(() => {
    if (!storageReady) return
    lastSyncedPlannerRef.current = serializePlannerInput(hydratedValue)
  }, [hydratedValue, storageReady])

  // Debounced account sync starts after hydration, cancels stale requests, and stores one current worksheet in appSettings.
  useEffect(() => {
    if (!isSignedIn) return
    if (!storageReady) return
    const serializedInput = serializePlannerInput(input)
    if (lastSyncedPlannerRef.current === serializedInput) return

    const controller = new AbortController()
    const timeoutId = window.setTimeout(async () => {
      setSaveState("saving")
      let requestTimedOut = false
      const requestTimeoutId = window.setTimeout(() => {
        requestTimedOut = true
        controller.abort()
      }, 30_000)
      try {
        const response = await fetch("/api/account/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appSettings: {
              [BUSINESS_INCOME_APP_SETTINGS_KEY]: sanitizeBusinessIncomePlannerPreference(input),
            },
          }),
          signal: controller.signal,
        })

        if (!response.ok) throw new Error("Unable to save planner preferences.")
        lastSyncedPlannerRef.current = serializedInput
        setSaveState("saved")
      } catch {
        if (!controller.signal.aborted || requestTimedOut) {
          setSaveState("error")
        }
      } finally {
        window.clearTimeout(requestTimeoutId)
      }
    }, 700)

    return () => {
      controller.abort()
      window.clearTimeout(timeoutId)
    }
  }, [input, isSignedIn, storageReady])

  function applyPreset(key: PlannerPresetKey) {
    if (key === "custom" && input.presetKey === "custom") return

    setInput(normalizeBusinessIncomePlannerInput(presetPayload(key)))
  }

  function updateField(field: keyof PlannerInput, value: number) {
    setInput((current) => normalizeBusinessIncomePlannerInput({
      ...current,
      presetKey: "custom",
      [field]: value,
    }))
  }

  function updateTaxRate(value: number) {
    setInput((current) => normalizeBusinessIncomePlannerInput({
      ...current,
      presetKey: "custom",
      taxSetAsideRate: value / 100,
    }))
  }

  /** Named rows are authoritative; normalization derives compatibility totals. */
  function updateExpenseItems(field: "monthlyExpenseItems" | "yearlyExpenseItems" | "sessionExpenseItems" | "personalReserveItems", items: PlannerInput["monthlyExpenseItems"]) {
    setInput((current) => normalizeBusinessIncomePlannerInput({ ...current, presetKey: "custom", [field]: items }))
  }

  function updateWeekdayHours(day: string, value: number) {
    setInput((current) => normalizeBusinessIncomePlannerInput({
      ...current,
      presetKey: "custom",
      weekdayClientHours: {
        ...current.weekdayClientHours,
        [day]: value,
      },
    }))
  }

  const savedLabel = isSignedIn
    ? saveState === "saving"
      ? "Saving to account"
      : saveState === "error"
        ? "Account save needs retry"
        : "Saved to this account"
    : storageUnavailable ? "Not saved on this device" : "Saved on this device"
  const selectedPreset = BUSINESS_INCOME_PRESETS[presetKeys.find((key) => key === input.presetKey) ?? "custom"]

  return (
    <div className={styles.page} data-income-planner>
      <div className={`${styles.workspace} ${styles.guidedWorkspace}`}>
      <BusinessDraftStorageNotice unavailable={storageUnavailable} unreadDraft={unreadDraft} />
      <PlannerHeader data-income-header title="Business Income Planner" description="Pricing and workload for your massage practice." icon={BriefcaseBusiness} saveLabel={savedLabel}
        guide={<><p>Estimate session pricing, workload, time off, and take-home possibilities for massage practice planning.</p><p>Change the assumptions below to see how schedule, expenses, taxes, and session length affect the prices and workload needed to reach a personal take-home target.</p></>}
      >
        {displayName ? <p className={styles.account}>Current worksheet for {displayName}.</p> : null}
      </PlannerHeader>

      <PlannerStepper label="Income planning steps">
        <PlannerStep id="scenario" title="Choose a starting point" shortTitle="Scenario">
          <PlannerSection
            title="Scenario"
            description="Start with a realistic pattern, then customize the numbers."
            icon={<WalletCards className="h-5 w-5" aria-hidden="true" />}
          >
            <div className={styles.scenarioChoices}>
              <div className={styles.scenarioGrid} role="group" aria-label="Income scenario">
              {presetKeys.map((key) => {
                const preset = BUSINESS_INCOME_PRESETS[key]
                const selected = input.presetKey === key
                return (
                  <Button
                    key={key}
                    type="button"
                    variant={selected ? "default" : "outline"}
                    className={styles.scenarioButton}
                    aria-pressed={selected}
                    aria-describedby={selected ? "income-scenario-description" : undefined}
                    onClick={() => applyPreset(key)}
                  >
                    <span>{preset.label}</span>
                  </Button>
                )
              })}
              </div>
              <p id="income-scenario-description" className={styles.scenarioDescription}>{selectedPreset.description}</p>
            </div>
          </PlannerSection>

        </PlannerStep>
        <PlannerStep id="income" title="Set your income target" shortTitle="Income and costs">
          <PlannerSection
            title="Income and costs"
            description="Start with the money you want left to spend, then plan business costs and benefits below."
            icon={<BadgeDollarSign className="h-5 w-5" aria-hidden="true" />}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField
                id="desired-income"
                unit="$"
                description="US dollars you want for everyday personal spending each year, after business costs, tax set-aside and any additional benefits/reserves below. Count each amount only once."
                label="Desired yearly take-home"
                value={input.desiredTakeHomeIncome}
                onChange={(value) => updateField("desiredTakeHomeIncome", value)}
              />
              <NumberField
                id="tax-set-aside"
                unit="%"
                description="Estimated share of business income reserved for income and self-employment taxes. Enter 25 for 25%; the planner uses your estimate, not an actual tax calculation."
                label="Tax/set-aside percent"
                value={roundForInput(input.taxSetAsideRate * 100)}
                onChange={updateTaxRate}
                max={80}
                step="0.5"
              />
              <NumberField
                id="average-session-length"
                unit="min"
                description="Hands-on massage minutes in a typical appointment. Enter intake, cleanup and turnaround separately in Step 3 so you can see the full workload."
                label="Average session minutes"
                value={input.averageSessionMinutes}
                onChange={(value) => updateField("averageSessionMinutes", value)}
                step="15"
              />
              <NumberField
                id="employee-wage"
                unit="$"
                description="What would an employer pay you per paid hour of massage? Enter gross US dollars per hour to compare wages for the same hands-on hours and weeks. Tips, commissions and employer benefits are not added. Leave 0 to skip."
                label="Optional employee hourly wage"
                value={input.employeeHourlyWage}
                onChange={(value) => updateField("employeeHourlyWage", value)}
              />
            </div>
          </PlannerSection>

          <PlannerSection title="Business expenses" description="Name each cost so you can return and update it. Use business labels only, without client information. Enter each expense once.">
            <IncomeExpenseList id="monthly-expenses" title="Monthly fixed expenses" frequency="month"
              description="Regular monthly business bills, such as rent, software and phone. Totals are multiplied by 12. Rename the carried-over estimate as you replace it with your own items."
              items={input.monthlyExpenseItems} total={`${formatMoney(input.monthlyFixedExpenses)} / month`} addLabel="Add monthly expense"
              onChange={(items) => updateExpenseItems("monthlyExpenseItems", items)} />
            <IncomeExpenseList id="yearly-expenses" title="Yearly business expenses" frequency="year"
              description="Bills paid once a year, such as license renewal, professional liability insurance, continuing education or equipment replacement. Leave out costs already in another list."
              items={input.yearlyExpenseItems} total={`${formatMoney(input.yearlyFixedExpenses)} / year`} addLabel="Add yearly expense"
              onChange={(items) => updateExpenseItems("yearlyExpenseItems", items)} />
            <IncomeExpenseList id="session-expenses" title="Per-session costs" frequency="session" frequencies={["session", "month", "year"]}
              description="Supplies, laundry or payment fees. Enter the cost per appointment, or choose Monthly/Yearly if that is how you track it. Do not also enter it in the lists above. Monthly/yearly budgets stay fixed across capacity comparisons; per-session amounts scale with appointments."
              items={input.sessionExpenseItems} total={`${formatMoney(input.perSessionVariableCost)} / session + ${formatMoney(plan.annualBudgetedSessionCosts)} / year`}
              addLabel="Add session cost" onChange={(items) => updateExpenseItems("sessionExpenseItems", items)} />
          </PlannerSection>

          <PlannerSection title="Benefits and personal reserves" description="Make room for the benefits an employer might otherwise help provide, and for your own financial safety net.">
            <IncomeExpenseList id="personal-reserves" title="Plan for your future" frequency="month" frequencies={["month", "year"]}
              description="Add amounts you want to fund on top of your desired yearly take-home. If you already included an amount in take-home or business costs, leave it out here. Suggestions start at $0; enter your own monthly or yearly budget."
              items={input.personalReserveItems} total={`${formatMoney(plan.annualPersonalReserves)} / year`} addLabel="Add another reserve"
              ideas={BUSINESS_INCOME_RESERVE_IDEAS} onChange={(items) => updateExpenseItems("personalReserveItems", items)} />
            <p className="text-xs leading-relaxed text-muted-foreground">These reserves increase the income target before your tax set-aside is applied. This budget does not calculate tax deductions or retirement contribution limits. Time off is planned in Step 3; business renewals and training belong in business expenses.</p>
            <details className={styles.help}><summary>About benefit and tax assumptions</summary><p>Eligibility and deductions depend on your circumstances. See the <a className="underline" href="https://www.irs.gov/retirement-plans/self-employed-individuals-calculating-your-own-retirement-plan-contribution-and-deduction" target="_blank" rel="noreferrer">IRS retirement rules</a> and <a className="underline" href="https://www.irs.gov/instructions/i7206" target="_blank" rel="noreferrer">self-employed health insurance instructions</a> when reviewing your own plan.</p></details>
          </PlannerSection>

        </PlannerStep>
        <PlannerStep id="schedule" title="Plan your working time" shortTitle="Time and schedule">
          <PlannerSection
            title="Time and schedule"
            description="Plan your time off and a typical client week. The calculator converts calendar days off into available working weeks."
            icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <NumberField
                id="vacation-days"
                unit="days"
                description="Calendar days away for vacation this year. A full week is 7 days."
                label="Vacation days you want off"
                value={input.vacationDays}
                onChange={(value) => updateField("vacationDays", value)}
              />
              <NumberField
                id="holiday-days"
                unit="days"
                description="Additional calendar days off for holidays. Do not count vacation days again."
                label="Holiday days you want off"
                value={input.holidayDays}
                onChange={(value) => updateField("holidayDays", value)}
              />
              <NumberField
                id="personal-days"
                unit="days"
                description="Other calendar days off for rest, illness or personal needs."
                label="Personal or sick days you want off"
                value={input.personalDays}
                onChange={(value) => updateField("personalDays", value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
            <NumberField id="session-support-minutes" unit="min" label="Intake and turnaround minutes per appointment"
              description="Average extra minutes for intake, cleanup and time between clients. These add to workload without adding paid massage hours. Leave 0 only if you include all this time in weekly admin below."
              value={input.sessionSupportMinutes} onChange={(value) => updateField("sessionSupportMinutes", value)} step="5" />
            <NumberField
              id="weekly-admin-hours"
                unit="h"
                description="Other unpaid hours for scheduling, bookkeeping, marketing and paperwork. Do not count intake/turnaround time entered beside this field again. These add to workload, not client hours."
              label="Weekly unpaid admin hours"
              value={input.weeklyAdminHours}
              onChange={(value) => updateField("weeklyAdminHours", value)}
            />
            </div>
            <p id="client-week-help" className="text-xs leading-relaxed text-muted-foreground">Client hours in a typical week: how many hours will you devote to hands-on massage with clients on each day? Leave out intake, cleanup, breaks, travel and admin. Use 0 on days you do not see clients.</p>
            <div className={styles.weekGrid} aria-describedby="client-week-help">
              {BUSINESS_INCOME_WEEKDAY_KEYS.map((day) => (
                <NumberField
                  key={day}
                  id={`client-hours-${day}`}
                  label={`${weekdayLabels[day] ?? day} hands-on massage hours`}
                  description="Hours of hands-on massage with clients on this day."
                  unit="h"
                  value={input.weekdayClientHours[day]}
                  onChange={(value) => updateWeekdayHours(day, value)}
                  step="0.5"
                />
              ))}
            </div>
          </PlannerSection>
        </PlannerStep>
        <PlannerStep id="estimate" title="Review your estimate" shortTitle="Estimate" keepMounted={false}>
          <div className={styles.reviewGrid}>
          <PlannerSection
            title="What this means"
            description={buildInterpretation(plan)}
            icon={<Percent className="h-5 w-5" aria-hidden="true" />}
          >
            {plan.warnings.length > 0 ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {plan.warnings.join(" ")}
              </div>
            ) : null}
            <div className={styles.metrics}>
              <MetricTile label="Gross revenue needed" value={formatMoney(plan.requiredGrossRevenue)} />
              <MetricTile label="Hourly target" value={formatMoney(plan.hourlyRevenueTarget)} />
              <MetricTile label="Sessions each week" value={formatNumber(plan.sessionsPerWeek)} />
              <MetricTile label="Available weeks" value={String(plan.availableWeeks)} />
              <MetricTile label="Business costs each year" value={formatMoney(plan.annualBusinessCosts)} description="Monthly/yearly budgets plus appointment costs" />
              <MetricTile label="Benefits and reserves each year" value={formatMoney(plan.annualPersonalReserves)} description="Additional to desired spendable take-home" />
            </div>
            <div className={styles.metrics}>
              <MetricTile label="30 min" value={formatMoney(plan.sessionPrices[30])} description="Suggested session price" />
              <MetricTile label="60 min" value={formatMoney(plan.sessionPrices[60])} description="Suggested session price" />
              <MetricTile label="90 min" value={formatMoney(plan.sessionPrices[90])} description="Suggested session price" />
              <MetricTile label="120 min" value={formatMoney(plan.sessionPrices[120])} description="Suggested session price" />
            </div>
          </PlannerSection>

          <PlannerSection
            title="60-minute price by capacity"
            description="Lower client-hour capacity usually means the hourly target must rise to reach the same take-home goal."
            icon={<Clock3 className="h-5 w-5" aria-hidden="true" />}
          >
            <ChartContainer config={chartConfig} className={styles.chart}>
              <BarChart data={chartData} margin={{ left: 0, right: 12, top: 30, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="capacity" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} width={48} />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="sessionPrice60" fill="var(--color-sessionPrice60)" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="sessionPrice60" position="top" fill="hsl(var(--foreground))" fontSize={11}
                    formatter={(value: unknown) => typeof value === "number" ? formatMoney(value) : ""} />
                </Bar>
              </BarChart>
            </ChartContainer>
          </PlannerSection>

          <PlannerSection title="Time behind the sessions" description="Your session prices fund the annual target across hands-on massage hours. Support and admin time increase your workload; they are not automatically subtracted from the client hours you enter.">
            <div className={styles.metrics}>
              <MetricTile label="Hands-on hours / week" value={formatNumber(plan.weeklyClientHours)} />
              <MetricTile label="Intake and turnaround / week" value={formatNumber(plan.weeklySessionSupportHours)} description="Hours based on your average appointment length" />
              <MetricTile label="Other admin hours / week" value={formatNumber(plan.weeklyAdminHours)} />
              <MetricTile label="Total work hours / week" value={formatNumber(plan.weeklyTotalWorkHours)} />
            </div>
          </PlannerSection>

          <PlannerSection
            title="Workload scenarios"
            description="Compare what the same goal looks like at partial, strong, and full client-hour capacity."
          >
            <div className="grid gap-3 md:grid-cols-2">
              {plan.workloadScenarios.map((scenario) => (
                <AppInset key={scenario.capacityPercent} className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{scenario.capacityPercent}% capacity</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatNumber(scenario.sessionsPerWeek)} sessions/week, {formatNumber(scenario.annualClientHours)} client hours/year
                      </p>
                    </div>
                    <p className="text-right text-sm font-semibold">{formatMoney(scenario.sessionPrice60)}</p>
                  </div>
                </AppInset>
              ))}
            </div>
          </PlannerSection>

          <PlannerSection
            title="Employee wage comparison"
            description="Estimated employee wages for the same hands-on massage hours and working weeks. Uses the same tax set-aside, without tips, commissions or employer benefits."
          >
            {plan.employeeComparison ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <MetricTile label="Employee annual gross" value={formatMoney(plan.employeeComparison.annualGross)} />
                <MetricTile label="Pay after the same set-aside" value={formatMoney(plan.employeeComparison.estimatedTakeHome)} />
              </div>
            ) : (
              <div className="space-y-3"><p className="text-sm text-muted-foreground">Add an employee hourly wage to compare the same client-hour schedule against an hourly job.</p>
                <div className={styles.formActions}><PlannerStepJump stepId="income" focusId="employee-wage">Add an employee wage in Step 2</PlannerStepJump></div>
              </div>
            )}
          </PlannerSection>
          </div>
        </PlannerStep>
      </PlannerStepper>
      </div>
    </div>
  )
}

function MetricTile({
  label,
  value,
  description,
}: {
  label: string
  value: string
  description?: string
}) {
  return (
    <AppInset className={cn("p-3", styles.metric)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
      {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
    </AppInset>
  )
}

function presetPayload(key: PlannerPresetKey) {
  const preset = BUSINESS_INCOME_PRESETS[key]

  return {
    presetKey: key,
    ...preset.values,
  }
}

function roundForInput(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function formatMoney(value: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Add hours"

  return Math.abs(value) >= 1_000 ? moneyFormatter.format(value) : preciseMoneyFormatter.format(value)
}

function formatNumber(value: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "0"

  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value)
}

function buildInterpretation(plan: ReturnType<typeof calculateBusinessIncomePlan>) {
  if (plan.warnings.length > 0) {
    return "Add enough schedule detail to calculate practical pricing and workload options."
  }

  return `At ${formatNumber(plan.weeklyClientHours)} client hours per week and ${formatNumber(plan.availableWeeks)} working weeks, this plan needs about ${formatMoney(plan.requiredGrossRevenue)} in yearly gross revenue. A 60-minute session lands near ${formatMoney(plan.sessionPrices[60])} before any market or positioning adjustments.`
}
