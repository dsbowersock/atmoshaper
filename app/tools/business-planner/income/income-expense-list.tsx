"use client"

import { useEffect, useRef } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BUSINESS_INCOME_MAX_ITEMS, normalizeBusinessIncomePlannerInput } from "@/lib/business-income-planner"
import { NumberField } from "../_components/business-tool-fields"
import styles from "../_components/business-planner.module.css"

type ExpenseItem = ReturnType<typeof normalizeBusinessIncomePlannerInput>["monthlyExpenseItems"][number]

/** Edits one named budget list without storing a second total or moving state
 * out of the worksheet. Focus follows added/removed rows for keyboard users. */
export function IncomeExpenseList({ id, title, description, items, total, addLabel,
  frequency, frequencies, ideas = [], onChange,
}: {
  id: string
  title: string
  description: string
  items: ExpenseItem[]
  total: string
  addLabel: string
  frequency: ExpenseItem["frequency"]
  frequencies?: ExpenseItem["frequency"][]
  ideas?: readonly string[]
  onChange: (items: ExpenseItem[]) => void
}) {
  const rootRef = useRef<HTMLDetailsElement>(null)
  const focusId = useRef<string | null>(null)
  useEffect(() => {
    if (!focusId.current) return
    const target = document.getElementById(focusId.current)
    if (target && rootRef.current?.contains(target)) {
      target.focus()
      focusId.current = null
    }
  }, [items])

  function addItem(name = "") {
    if (items.length >= BUSINESS_INCOME_MAX_ITEMS) return
    const rowId = crypto.randomUUID()
    focusId.current = `${id}-${rowId}-name`
    onChange([...items, { id: rowId, name, amount: 0, frequency }])
  }

  function updateItem(rowId: string, patch: Partial<ExpenseItem>) {
    onChange(items.map((item) => item.id === rowId ? { ...item, ...patch } : item))
  }

  function removeItem(index: number) {
    const remaining = items.filter((_, itemIndex) => itemIndex !== index)
    const nextItem = remaining[Math.min(index, remaining.length - 1)]
    focusId.current = nextItem ? `${id}-${nextItem.id}-name` : `${id}-add`
    onChange(remaining)
  }

  return (
    <details ref={rootRef} open className={styles.expenseGroup} data-income-expenses={id}>
      <summary><span>{title}</span><span className="tabular-nums">{total}</span></summary>
      <div className={styles.expenseBody}>
        <p id={`${id}-help`} className="text-xs leading-relaxed text-muted-foreground">{description}</p>
        {items.length === 0 ? <p className="text-xs text-muted-foreground">No items added. Use + to start your list.</p> : null}
        {items.map((item, index) => <div key={item.id} className={styles.expenseRow} role="group" aria-label={`${title} item ${index + 1}`}>
          <div className={styles.itemHeading}>
            <div className="min-w-0 space-y-2">
              <Label htmlFor={`${id}-${item.id}-name`} className="text-xs text-muted-foreground">Name</Label>
              <Input id={`${id}-${item.id}-name`} value={item.name} maxLength={120} placeholder="e.g. business expense"
                aria-describedby={`${id}-help`} onChange={(event) => updateItem(item.id, { name: event.target.value })} />
            </div>
            <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${item.name || "item"}`} onClick={() => removeItem(index)}><Trash2 aria-hidden="true" /></Button>
          </div>
          <div className={frequencies ? styles.expenseAmounts : undefined}>
            <NumberField id={`${id}-${item.id}-amount`} label="Amount" unit="$" value={item.amount}
              description={frequencies ? "US dollars for the frequency you select." : `US dollars per ${frequency}.`}
              onChange={(amount) => updateItem(item.id, { amount })} />
            {frequencies ? <div className={styles.field}>
              <Label htmlFor={`${id}-${item.id}-frequency`} className="text-xs text-muted-foreground">Frequency</Label>
              <select id={`${id}-${item.id}-frequency`} className={styles.expenseSelect} value={item.frequency}
                onChange={(event) => updateItem(item.id, { frequency: event.target.value as ExpenseItem["frequency"] })}>
                {frequencies.map((option) => <option key={option} value={option}>{option === "session" ? "Per session" : option === "month" ? "Monthly" : "Yearly"}</option>)}
              </select>
            </div> : null}
          </div>
        </div>)}
        {ideas.length > 0 ? <div className={styles.reserveIdeas} aria-label="Benefits and reserves to consider">
          {ideas.map((idea) => <Button key={idea} type="button" variant="glow" disabled={items.length >= BUSINESS_INCOME_MAX_ITEMS || items.some((item) => item.name.toLowerCase() === idea.toLowerCase())}
            onClick={() => addItem(idea)}><Plus aria-hidden="true" />{idea}</Button>)}
        </div> : null}
        <div className={styles.formActions}>
          <Button id={`${id}-add`} type="button" variant="ctaBlue" disabled={items.length >= BUSINESS_INCOME_MAX_ITEMS} onClick={() => addItem()}><Plus aria-hidden="true" />{addLabel}</Button>
          {items.length >= BUSINESS_INCOME_MAX_ITEMS ? <p className="text-xs text-muted-foreground">This list holds up to {BUSINESS_INCOME_MAX_ITEMS} items.</p> : null}
        </div>
      </div>
    </details>
  )
}
