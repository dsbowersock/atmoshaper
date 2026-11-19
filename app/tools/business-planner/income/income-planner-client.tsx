"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ArrowLeft, BadgeDollarSign, BriefcaseBusiness, CalendarDays, Clock3, Percent, Save, WalletCards } from "lucide-react"
import { AppInset } from "@/components/ui/app-surface"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  BUSINESS_INCOME_APP_SETTINGS_KEY,
  BUSINESS_INCOME_LOCAL_STORAGE_KEY,
  BUSINESS_INCOME_PRESETS,
  BUSINESS_INCOME_WEEKDAY_KEYS,
  calculateBusinessIncomePlan,
  normalizeBusinessIncomePlannerInput,
  sanitizeBusinessIncomePlannerPreference,
} from "@/lib/business-income-planner"
import { cn } from "@/lib/utils"
import { useBusinessPlannerDraft } from "@/lib/use-business-planner-draft"
import { BusinessDraftStorageNotice, NumberField, PlannerSection } from "../_components/business-tool-fields"
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
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
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
      <div className={styles.workspace}>
      <BusinessDraftStorageNotice unavailable={storageUnavailable} unreadDraft={unreadDraft} />
      <header className={styles.header} data-income-header>
        <div className={styles.titleRow}>
          <BriefcaseBusiness className={styles.titleIcon} aria-hidden="true" />
          <h1>Business Income Planner</h1>
          <Button asChild variant="ghost" className={styles.backLink}>
            <Link href="/tools/business-planner" aria-label="Back to business tools" title="Back to business tools"><ArrowLeft aria-hidden="true" /></Link>
          </Button>
        </div>
        <p className={styles.subtitle}>Pricing and workload for your massage practice.</p>
        <div className={styles.meta}>
          <p className={styles.saveStatus} aria-live="polite" aria-atomic="true"><Save aria-hidden="true" /><span>{savedLabel}</span></p>
          <details className={styles.help}>
            <summary>How this planner works</summary>
            <p>Estimate session pricing, workload, time off, and take-home possibilities for massage practice planning.</p>
            <p>Change the assumptions below to see how schedule, expenses, taxes, and session length affect the prices and workload needed to reach a personal take-home target.</p>
          </details>
        </div>
        {displayName ? (
          <p className={styles.account}>Current worksheet for {displayName}.</p>
        ) : null}
      </header>

      <div className={styles.main}>
        <div className={styles.column}>
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

          <PlannerSection
            title="Income and costs"
            description="Use take-home income as the personal amount you want left after your set-aside."
            icon={<BadgeDollarSign className="h-5 w-5" aria-hidden="true" />}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField
                id="desired-income"
                unit="$"
                description="US dollars you want left for yourself each year, after business costs and your tax set-aside."
                label="Desired yearly take-home"
                value={input.desiredTakeHomeIncome}
                onChange={(value) => updateField("desiredTakeHomeIncome", value)}
              />
              <NumberField
                id="monthly-fixed-expenses"
                unit="$"
                description="US dollars spent on regular monthly bills, such as rent, software and phone. Leave out costs counted per session."
                label="Monthly fixed expenses"
                value={input.monthlyFixedExpenses}
                onChange={(value) => updateField("monthlyFixedExpenses", value)}
              />
              <NumberField
                id="session-variable-cost"
                unit="$"
                description="Average US dollars spent for one appointment: supplies, laundry and payment fees. Do not include your monthly bills again."
                label="Per-session variable cost"
                value={input.perSessionVariableCost}
                onChange={(value) => updateField("perSessionVariableCost", value)}
              />
              <NumberField
                id="tax-set-aside"
                unit="%"
                description="Share of your income reserved for taxes. Enter 25 for 25%. Use your own planning estimate."
                label="Tax/set-aside percent"
                value={roundForInput(input.taxSetAsideRate * 100)}
                onChange={updateTaxRate}
                max={80}
                step="0.5"
              />
              <NumberField
                id="average-session-length"
                unit="min"
                description="Hands-on minutes in your typical appointment. Leave out intake, cleanup and time between clients."
                label="Average session minutes"
                value={input.averageSessionMinutes}
                onChange={(value) => updateField("averageSessionMinutes", value)}
                step="15"
              />
              <NumberField
                id="employee-wage"
                unit="$"
                description="Optional US dollars per hour for comparing an employee job. Leave 0 to skip this comparison."
                label="Optional employee hourly wage"
                value={input.employeeHourlyWage}
                onChange={(value) => updateField("employeeHourlyWage", value)}
              />
            </div>
          </PlannerSection>

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
                label="Vacation days"
                value={input.vacationDays}
                onChange={(value) => updateField("vacationDays", value)}
              />
              <NumberField
                id="holiday-days"
                unit="days"
                description="Additional calendar days off for holidays. Do not count vacation days again."
                label="Holiday days"
                value={input.holidayDays}
                onChange={(value) => updateField("holidayDays", value)}
              />
              <NumberField
                id="personal-days"
                unit="days"
                description="Other calendar days off for rest, illness or personal needs."
                label="Personal days"
                value={input.personalDays}
                onChange={(value) => updateField("personalDays", value)}
              />
            </div>
            <NumberField
              id="weekly-admin-hours"
                unit="h"
                description="Unpaid hours each week on scheduling, cleaning and paperwork. These add to your total workload, not client hours."
              label="Weekly unpaid admin hours"
              value={input.weeklyAdminHours}
              onChange={(value) => updateField("weeklyAdminHours", value)}
            />
            <p id="client-week-help" className="text-xs leading-relaxed text-muted-foreground">Client hours in a typical week: count hands-on time only, without breaks, travel or admin. Use 0 on days you do not see clients.</p>
            <div className={styles.weekGrid} aria-describedby="client-week-help">
              {BUSINESS_INCOME_WEEKDAY_KEYS.map((day) => (
                <NumberField
                  key={day}
                  id={`client-hours-${day}`}
                  label={weekdayLabels[day] ?? day}
                  unit="h"
                  value={input.weekdayClientHours[day]}
                  onChange={(value) => updateWeekdayHours(day, value)}
                  step="0.5"
                />
              ))}
            </div>
          </PlannerSection>
        </div>

        <div className={styles.column}>
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
              <BarChart data={chartData} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="capacity" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} width={48} />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="sessionPrice60" fill="var(--color-sessionPrice60)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
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
            description="A simple same-client-hours comparison for discussing employment, booth rent, and independent-practice tradeoffs."
          >
            {plan.employeeComparison ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <MetricTile label="Employee annual gross" value={formatMoney(plan.employeeComparison.annualGross)} />
                <MetricTile label="Estimated take-home" value={formatMoney(plan.employeeComparison.estimatedTakeHome)} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Add an employee hourly wage to compare the same client-hour schedule against an hourly job.</p>
            )}
          </PlannerSection>
        </div>
      </div>
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
      <p className="text-xs uppercase tracking-normal text-muted-foreground">{label}</p>
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
