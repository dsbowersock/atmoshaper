"use client"

import Link from "next/link"
import { useMemo } from "react"
import { useBusinessPlannerDraft } from "@/lib/use-business-planner-draft"
import { ArrowLeft, BadgeDollarSign, BriefcaseBusiness, Plus, RotateCcw, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  calculateBreakEvenPlan,
  normalizeBreakEvenInput,
} from "@/lib/business-plan-template-tools"
import {
  BusinessDraftStorageNotice,
  PlannerSection,
  MetricTile,
  NumberField,
  TextField,
  formatMoney,
  formatNumber,
} from "../_components/business-tool-fields"

import styles from "../_components/business-planner.module.css"

type BreakEvenInput = ReturnType<typeof normalizeBreakEvenInput>
type MoneyItem = BreakEvenInput["startupCosts"][number]
type MoneySectionKey = "startupCosts" | "monthlyExpenses" | "annualExpenses" | "fundingSources"

const STORAGE_KEY = "massagelab-business-planner-break-even-v1"

const moneySectionLabels: Record<MoneySectionKey, { title: string; description: string; emptyLabel: string }> = {
  startupCosts: {
    title: "Startup costs",
    description: "One-time costs to get started: equipment, deposits and opening supplies. Enter US dollars paid once.",
    emptyLabel: "Startup item",
  },
  monthlyExpenses: {
    title: "Monthly expenses",
    description: "Regular monthly bills, such as rent, phone, software and utilities. Enter each cost once; do not repeat it under yearly expenses.",
    emptyLabel: "Monthly item",
  },
  annualExpenses: {
    title: "Annual expenses",
    description: "Bills paid once a year, such as insurance and license renewals. Enter the full yearly amount; the estimate spreads it over 12 months.",
    emptyLabel: "Annual item",
  },
  fundingSources: {
    title: "Initial capital",
    description: "Money available before opening: savings, loans or other funding. Enter available US dollars, not expected sales.",
    emptyLabel: "Funding source",
  },
}

/** Restores the existing break-even draft while keeping storage failures recoverable in this tab. */
export function BreakEvenPlannerClient() {
  const { value: input, setValue: setInput, storageUnavailable, unreadDraft } = useBusinessPlannerDraft<BreakEvenInput>({
    storageKey: STORAGE_KEY,
    initialValue: () => normalizeBreakEvenInput({}),
    normalize: normalizeBreakEvenInput,
  })
  const plan = useMemo(() => calculateBreakEvenPlan(input), [input])
  const breakEvenSessionLabel = plan.monthlyBreakEvenSessions === null
    ? "Set service price"
    : `${formatNumber(plan.monthlyBreakEvenSessions)} / month`
  const breakEvenSessionDescription = plan.weeklyBreakEvenSessions === null
    ? undefined
    : `${formatNumber(plan.weeklyBreakEvenSessions)} each week`

  function updateTopLevel(field: keyof Pick<BreakEvenInput, "servicePrice" | "sessionsPerWeek" | "weeksPerYear" | "taxSetAsideRate">, value: number) {
    setInput((current) => normalizeBreakEvenInput({
      ...current,
      [field]: field === "taxSetAsideRate" ? value / 100 : value,
    }))
  }

  function updateMoneyItem(section: MoneySectionKey, index: number, field: keyof MoneyItem, value: string | number) {
    setInput((current) => normalizeBreakEvenInput({
      ...current,
      [section]: current[section].map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      )),
    }))
  }

  function addMoneyItem(section: MoneySectionKey) {
    setInput((current) => normalizeBreakEvenInput({
      ...current,
      [section]: [
        ...current[section],
        { label: moneySectionLabels[section].emptyLabel, amount: 0 },
      ],
    }))
  }

  function removeMoneyItem(section: MoneySectionKey, index: number) {
    setInput((current) => normalizeBreakEvenInput({
      ...current,
      [section]: current[section].filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  function resetWorksheet() {
    setInput(normalizeBreakEvenInput({}))
  }

  return (
    <div className={styles.page} data-break-even-planner>
      <div className={styles.workspace}>
      <BusinessDraftStorageNotice unavailable={storageUnavailable} unreadDraft={unreadDraft} />
      <header className={styles.header} data-break-even-header>
        <div className={styles.titleRow}>
          <BadgeDollarSign className={styles.titleIcon} aria-hidden="true" />
          <h1>Startup Costs and Break-Even</h1>
          <Button asChild variant="ghost" className={styles.backLink}>
            <Link href="/tools/business-planner" aria-label="Back to business tools" title="Back to business tools"><ArrowLeft aria-hidden="true" /></Link>
          </Button>
        </div>
        <p className={styles.subtitle}>Plan opening costs and the sessions needed to cover your bills.</p>
        <div className={styles.meta}>
          <p className={styles.saveStatus} aria-live="polite" aria-atomic="true"><Save aria-hidden="true" />{storageUnavailable ? "Not saved on this device" : "Saved on this device"}</p>
          <details className={styles.help}>
            <summary>How this planner works</summary>
            <p>Add your service price, working schedule and business costs in US dollars. Keep one-time, monthly and yearly costs separate so each expense is counted once.</p>
            <p>Break-even covers operating costs before owner income or tax. Startup funding is shown separately. These are estimates based on the numbers you enter.</p>
          </details>
        </div>
      </header>

      <div className={styles.main}>
        <div className={styles.column}>
          <PlannerSection
            title="Service and schedule"
            description="Enter a typical appointment price and a realistic working schedule."
            icon={<BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField
                id="break-even-service-price"
                unit="$"
                description="US dollars charged for one typical appointment, before tips. Use an average if your services have different prices."
                label="Main service price"
                value={input.servicePrice}
                onChange={(value) => updateTopLevel("servicePrice", value)}
              />
              <NumberField
                id="break-even-sessions-week"
                unit="sessions"
                description="Appointments you expect to complete in a normal working week, not the number of open time slots."
                label="Sessions per week"
                value={input.sessionsPerWeek}
                step="0.5"
                onChange={(value) => updateTopLevel("sessionsPerWeek", value)}
              />
              <NumberField
                id="break-even-weeks-year"
                unit="weeks"
                description="Weeks you expect to work this year after vacations and other time off."
                label="Working weeks per year"
                value={input.weeksPerYear}
                onChange={(value) => updateTopLevel("weeksPerYear", value)}
              />
              <NumberField
                id="break-even-tax-rate"
                unit="%"
                description="Share of projected gross sales to reserve for taxes. Enter 25 for 25%; use your own planning estimate."
                label="Tax set-aside percent"
                value={Number((input.taxSetAsideRate * 100).toFixed(1))}
                max={80}
                step="0.5"
                onChange={(value) => updateTopLevel("taxSetAsideRate", value)}
              />
            </div>
            <Button type="button" variant="secondary" className="h-auto min-h-11 w-fit max-w-full whitespace-normal" onClick={resetWorksheet}>
              <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
              Reset worksheet
            </Button>
          </PlannerSection>

          {moneySectionOrder.map((section) => (
            <MoneySection
              key={section}
              section={section}
              items={input[section]}
              onUpdate={updateMoneyItem}
              onAdd={addMoneyItem}
              onRemove={removeMoneyItem}
            />
          ))}
        </div>

        <div className={styles.column}>
          <PlannerSection title="Break-even estimate" description="Sessions needed to cover ongoing business costs, before paying yourself or setting aside tax.">
            <div className={styles.metrics}>
              <MetricTile label="Startup funding gap" value={formatMoney(plan.startupFundingGap)} />
              <MetricTile label="Monthly operating cost" value={formatMoney(plan.monthlyOperatingCost)} />
              <MetricTile label="Break-even sessions" value={breakEvenSessionLabel} description={breakEvenSessionDescription} />
              <MetricTile label="Projected yearly gross" value={formatMoney(plan.projectedAnnualGross)} />
            </div>
          </PlannerSection>
          <PlannerSection
            title="Financial analysis"
            description="Gross is sales before costs. The final estimate subtracts operating costs and your tax set-aside; it does not repay startup funding."
          >
            {plan.warnings.length > 0 ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {plan.warnings.join(" ")}
              </div>
            ) : null}
            <div className={styles.metrics}>
              <MetricTile label="Startup costs" value={formatMoney(plan.startupCostTotal)} />
              <MetricTile label="Initial capital" value={formatMoney(plan.fundingTotal)} />
              <MetricTile label="Monthly expenses" value={formatMoney(plan.monthlyExpenseTotal)} />
              <MetricTile label="Annual expenses" value={formatMoney(plan.annualExpenseTotal)} />
              <MetricTile label="Projected monthly gross" value={formatMoney(plan.projectedMonthlyGross)} />
              <MetricTile label="Projected yearly gross" value={formatMoney(plan.projectedAnnualGross)} />
              <MetricTile label="Tax set-aside" value={formatMoney(plan.taxSetAside)} description={`${Math.round(input.taxSetAsideRate * 100)}% of projected gross`} />
              <MetricTile label="After expenses and tax" value={formatMoney(plan.projectedNetAfterExpensesAndTax)} />
            </div>
          </PlannerSection>

          <PlannerSection
            title="Business plan wording"
            description="A concise sentence students can adapt into the Financial Analysis section."
          >
            <p className="text-sm leading-6 text-muted-foreground">
              Based on a {formatMoney(input.servicePrice)} service price and {formatNumber(input.sessionsPerWeek)} sessions per week for {formatNumber(input.weeksPerYear)} weeks, this plan projects {formatMoney(plan.projectedAnnualGross)} in yearly gross income. Estimated operating costs are {formatMoney(plan.annualOperatingCost)} per year, with {formatMoney(plan.taxSetAside)} set aside for taxes.{" "}
              {plan.monthlyBreakEvenSessions === null
                ? "Set a non-zero service price to estimate break-even sessions."
                : `The practice needs about ${formatNumber(plan.monthlyBreakEvenSessions)} sessions per month to cover monthly operating costs before owner income.`}
            </p>
          </PlannerSection>
        </div>
      </div>
      </div>
    </div>
  )
}

const moneySectionOrder: MoneySectionKey[] = ["startupCosts", "fundingSources", "monthlyExpenses", "annualExpenses"]

function MoneySection({
  section,
  items,
  onUpdate,
  onAdd,
  onRemove,
}: {
  section: MoneySectionKey
  items: MoneyItem[]
  onUpdate: (section: MoneySectionKey, index: number, field: keyof MoneyItem, value: string | number) => void
  onAdd: (section: MoneySectionKey) => void
  onRemove: (section: MoneySectionKey, index: number) => void
}) {
  const labels = moneySectionLabels[section]

  return (
    <PlannerSection id={`break-even-${section}`} title={labels.title} description={labels.description}>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={`${section}-${index}`} className={`${styles.moneyRow} rounded-md border border-border/80 bg-background/70 p-3`}>
            <TextField
              id={`${section}-${index}-label`}
              label="Item"
              value={item.label}
              onChange={(value) => onUpdate(section, index, "label", value)}
            />
            <NumberField
              id={`${section}-${index}-amount`}
              label={section === "monthlyExpenses" ? "Monthly amount" : section === "annualExpenses" ? "Yearly amount" : "One-time amount"}
              unit="$"
              value={item.amount}
              onChange={(value) => onUpdate(section, index, "amount", value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-11 w-11"
              aria-label={`Remove ${item.label || labels.emptyLabel}`}
              onClick={() => onRemove(section, index)}
              disabled={items.length <= 1}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="secondary" className="h-auto min-h-11 w-fit max-w-full whitespace-normal" onClick={() => onAdd(section)} aria-label={`Add row to ${labels.title}`}>
        <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
        Add row
      </Button>
    </PlannerSection>
  )
}
