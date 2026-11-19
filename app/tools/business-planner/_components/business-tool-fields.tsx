"use client"

import { type ChangeEvent, type ComponentProps } from "react"
import { AppInset, AppSurface, appCalloutClassName } from "@/components/ui/app-surface"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import styles from "./business-planner.module.css"

/** Shares the compact card geometry without changing a worksheet's domain behavior. */
export function PlannerSection(props: ComponentProps<typeof AppSurface>) {
  return <AppSurface {...props} className={cn(styles.surface, props.className)} headerClassName={cn(styles.sectionHeader, props.headerClassName)} contentClassName={cn(styles.sectionContent, props.contentClassName)} />
}

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

/** Explains failed device persistence without interrupting the live worksheet. */
export function BusinessDraftStorageNotice({ unavailable, unreadDraft }: { unavailable: boolean; unreadDraft: boolean }) {
  if (!unavailable) return null

  return (
    <p role="status" className={`${appCalloutClassName} rounded-lg border px-4 py-3 text-sm text-foreground`}>
      {unreadDraft ? "Device storage could not be read. " : "Local saving is unavailable. "}
      You can keep working in this tab, but copy your changes before leaving.
    </p>
  )
}

/** Displays units beside the control and links plain-language help without
 * putting currency symbols or formatted text into the persisted number. */
export function NumberField({
  id,
  label,
  value,
  onChange,
  max,
  step = "1",
  unit,
  description,
}: {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
  max?: number
  step?: string
  unit?: "$" | "%" | "h" | "days" | "min" | "weeks" | "sessions"
  description?: string
}) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(numberFromInput(event.currentTarget.value))
  }

  return (
    <div className={cn("space-y-2", styles.field)}>
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="relative min-w-0">
      {unit ? <span data-field-unit={unit} aria-hidden="true" className={cn("pointer-events-none absolute inset-y-0 z-10 flex items-center text-sm text-muted-foreground", unit === "$" ? "start-3" : "end-3")}>{unit}</span> : null}
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        className={cn(styles.numberInput, "tabular-nums", unit === "$" ? "ps-8" : unit ? "pe-20" : "", unit === "%" || unit === "h" ? "pe-8" : "")}
        aria-describedby={description ? `${id}-help` : undefined}
        min={0}
        max={max}
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={handleChange}
      />
      </div>
      {description ? <p id={`${id}-help`} className="text-xs leading-relaxed text-muted-foreground">{description}</p> : null}
    </div>
  )
}

export function TextField({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="min-w-0 space-y-2">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Input id={id} value={value} onChange={(event) => onChange(event.currentTarget.value)} />
    </div>
  )
}

export function TextAreaField({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 5,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Textarea
        id={id}
        value={value}
        placeholder={placeholder}
        rows={rows}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </div>
  )
}

export function MetricTile({
  label,
  value,
  description,
}: {
  label: string
  value: string
  description?: string
}) {
  return (
    <AppInset className="p-3">
      <p className="text-xs uppercase tracking-normal text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
      {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
    </AppInset>
  )
}

/**
 * Formats planner money metrics while making incomplete inputs obvious.
 * Null and non-finite values return "Add numbers"; small values keep cents so
 * startup/add-on tools do not hide low-cost worksheet assumptions.
 */
export function formatMoney(value: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Add numbers"

  return Math.abs(value) >= 1_000 ? moneyFormatter.format(value) : preciseMoneyFormatter.format(value)
}

/**
 * Formats compact numeric worksheet metrics for labels and summaries.
 * Null and non-finite values return "0", so only call this where zero is an
 * honest fallback; use explicit null checks for values that need a prompt.
 */
export function formatNumber(value: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "0"

  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value)
}

/**
 * Parses numeric form-control text from worksheet inputs.
 * Blank or non-finite text becomes 0 so controlled number fields remain stable
 * while users clear and retype values.
 */
export function numberFromInput(value: string) {
  if (value.trim() === "") return 0

  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}
