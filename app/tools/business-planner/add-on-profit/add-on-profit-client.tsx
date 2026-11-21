"use client"

import { PlannerHeader } from "../_components/planner-header"
import styles from "../_components/business-planner.module.css"
import { useMemo } from "react"
import { useBusinessPlannerDraft } from "@/lib/use-business-planner-draft"
import { PackagePlus, Plus, RotateCcw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  calculateAddOnProfitPlan,
  normalizeAddOnProfitInput,
} from "@/lib/business-plan-template-tools"
import {
  BusinessDraftStorageNotice,
  MetricTile,
  NumberField,
  TextField,
  formatMoney,
  formatNumber,
  PlannerSection,
} from "../_components/business-tool-fields"

type AddOnInput = ReturnType<typeof normalizeAddOnProfitInput>
type ProductItem = AddOnInput["products"][number]

const STORAGE_KEY = "massagelab-business-planner-add-on-profit-v1"

/** Keeps add-on calculations editable when this device cannot persist their draft. */
export function AddOnProfitClient() {
  const { value: input, setValue: setInput, storageReady, storageUnavailable, unreadDraft } = useBusinessPlannerDraft<AddOnInput>({
    storageKey: STORAGE_KEY,
    initialValue: () => normalizeAddOnProfitInput({}),
    normalize: normalizeAddOnProfitInput,
  })
  const plan = useMemo(() => calculateAddOnProfitPlan(input), [input])

  function updateProduct(index: number, field: keyof ProductItem, value: string | number) {
    setInput((current) => normalizeAddOnProfitInput({
      products: current.products.map((product, productIndex) => (
        productIndex === index ? { ...product, [field]: value } : product
      )),
    }))
  }

  function addProduct() {
    setInput((current) => normalizeAddOnProfitInput({
      products: [
        ...current.products,
        { name: "Product or add-on", wholesaleCost: 0, retailPrice: 0, estimatedMonthlySales: 0 },
      ],
    }))
  }

  function removeProduct(index: number) {
    setInput((current) => normalizeAddOnProfitInput({
      products: current.products.filter((_, productIndex) => productIndex !== index),
    }))
  }

  function resetWorksheet() {
    setInput(normalizeAddOnProfitInput({}))
  }

  return (
    <div className={styles.page} data-add-on-profit-planner>
      <div className={`${styles.workspace} ${styles.guidedWorkspace}`}>
        <BusinessDraftStorageNotice unavailable={storageUnavailable} unreadDraft={unreadDraft} />
        <PlannerHeader title="Add-On Profit Calculator" description="Compare what you charge, what each sale costs and what is left over." icon={PackagePlus}
          saveLabel={!storageReady ? "Opening saved draft" : storageUnavailable ? "Not saved on this device" : "Saved on this device"}
          guide={<p>Add each product or service upgrade, its cost per sale, your price and expected monthly sales. The estimate subtracts only that per-sale cost; it does not include other business expenses or taxes.</p>}
        >
          <Button type="button" variant="ghost" onClick={resetWorksheet}><RotateCcw aria-hidden="true" />Reset worksheet</Button>
        </PlannerHeader>
        <div className={styles.main}>
          <PlannerSection title="Products and add-ons" description="Start with one item. Add another row for each product or upgrade you want to compare.">
            <div className="space-y-3">
              {input.products.map((product, index) => (
                <div key={`product-${index}`} className={styles.lineItem}>
                  <div className={styles.itemHeading}>
                    <TextField id={`product-${index}-name`} label="Name" value={product.name} onChange={(value) => updateProduct(index, "name", value)} />
                    <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${product.name || "product"}`} onClick={() => removeProduct(index)} disabled={input.products.length <= 1}><Trash2 aria-hidden="true" /></Button>
                  </div>
                  <div className={styles.productFields}>
                    <NumberField id={`product-${index}-wholesale`} label="Cost per sale" unit="$" description="US dollars it costs you to provide one item or add-on, such as its purchase cost or supplies." value={product.wholesaleCost} onChange={(value) => updateProduct(index, "wholesaleCost", value)} />
                    <NumberField id={`product-${index}-retail`} label="Price per sale" unit="$" description="US dollars you charge for one item or add-on, before tax." value={product.retailPrice} onChange={(value) => updateProduct(index, "retailPrice", value)} />
                    <NumberField id={`product-${index}-sales`} label="Monthly sales" unit="sales" description="How many sales you expect in a typical month. Enter a count, not a dollar amount." value={product.estimatedMonthlySales} onChange={(value) => updateProduct(index, "estimatedMonthlySales", value)} />
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.formActions}><Button type="button" variant="ctaBlue" onClick={addProduct}><Plus aria-hidden="true" />Add product</Button></div>
          </PlannerSection>
          <PlannerSection title="Profit summary" description="Estimates update as you change a cost, price or sales count.">
            <div className={styles.metrics}>
              <MetricTile label="Monthly profit" value={formatMoney(plan.monthlyProfitTotal)} />
              <MetricTile label="Yearly profit" value={formatMoney(plan.yearlyProfitTotal)} />
              <MetricTile label="Average margin" value={plan.averageMarginPercent === null ? "Add price" : `${formatNumber(plan.averageMarginPercent)}%`} />
            </div>
            <div className="space-y-3">
              {plan.rows.map((row, index) => (
                <div key={`${row.name || "row"}-${index}`} className={styles.lineItem}>
                  <p className="text-sm font-medium">{row.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatMoney(row.profitPerSale)} profit per sale</p>
                  <p className="mt-2 text-sm font-semibold tabular-nums">{formatMoney(row.yearlyProfit)} / year</p>
                </div>
              ))}
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">Profit shown excludes other business expenses and taxes.</p>
          </PlannerSection>
        </div>
      </div>
    </div>
  )
}
