"use client"

import { PlannerHeader } from "../_components/planner-header"
import { PlannerStep, PlannerStepper } from "../_components/planner-stepper"
import styles from "../_components/business-planner.module.css"
import { useMemo } from "react"
import { useBusinessPlannerDraft } from "@/lib/use-business-planner-draft"
import { ClipboardList, Plus, RotateCcw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  calculateServiceMenuPlan,
  normalizeServiceMenuInput,
} from "@/lib/business-plan-template-tools"
import {
  BusinessDraftStorageNotice,
  MetricTile,
  NumberField,
  TextAreaField,
  TextField,
  formatMoney,
  formatNumber,
  PlannerSection,
} from "../_components/business-tool-fields"

type ServiceMenuInput = ReturnType<typeof normalizeServiceMenuInput>
type ServiceItem = ServiceMenuInput["services"][number]

const STORAGE_KEY = "massagelab-business-planner-service-menu-v1"

/** Edits one device-local service menu without letting storage access disable its controls. */
export function ServiceMenuClient() {
  const { value: input, setValue: setInput, storageReady, storageUnavailable, unreadDraft } = useBusinessPlannerDraft<ServiceMenuInput>({
    storageKey: STORAGE_KEY,
    initialValue: () => normalizeServiceMenuInput({}),
    normalize: normalizeServiceMenuInput,
  })
  const plan = useMemo(() => calculateServiceMenuPlan(input), [input])

  function updateService(index: number, field: keyof ServiceItem, value: string | number) {
    setInput((current) => normalizeServiceMenuInput({
      ...current,
      services: current.services.map((service, serviceIndex) => (
        serviceIndex === index ? { ...service, [field]: value } : service
      )),
    }))
  }

  function addService() {
    setInput((current) => normalizeServiceMenuInput({
      ...current,
      services: [
        ...current.services,
        { name: "Massage service", minutes: 60, price: 0 },
      ],
    }))
  }

  function removeService(index: number) {
    setInput((current) => normalizeServiceMenuInput({
      ...current,
      services: current.services.filter((_, serviceIndex) => serviceIndex !== index),
    }))
  }

  function updatePolicy(field: keyof Pick<ServiceMenuInput, "cancellationNoticeHours" | "lateCancellationFee" | "noShowFee">, value: number) {
    setInput((current) => normalizeServiceMenuInput({
      ...current,
      [field]: value,
    }))
  }

  function updatePrivacySteps(value: string) {
    setInput((current) => normalizeServiceMenuInput({
      ...current,
      privacySteps: value.split("\n"),
    }))
  }

  function resetWorksheet() {
    setInput(normalizeServiceMenuInput({}))
  }

  return (
    <div className={styles.page} data-service-menu-planner>
      <div className={`${styles.workspace} ${styles.guidedWorkspace}`}>
        <BusinessDraftStorageNotice unavailable={storageUnavailable} unreadDraft={unreadDraft} />
        <PlannerHeader title="Service Menu and Policies" description="Build your service list, then draft the policies clients need to know." icon={ClipboardList}
          saveLabel={!storageReady ? "Opening saved draft" : storageUnavailable ? "Not saved on this device" : "Saved on this device"}
          guide={<p>List services and prices, set cancellation and privacy policies, then review the complete draft. This worksheet does not change your booking calendar or publish a client policy.</p>}
        >
          <Button type="button" variant="ghost" onClick={resetWorksheet}><RotateCcw aria-hidden="true" />Reset worksheet</Button>
        </PlannerHeader>
        <PlannerStepper label="Service menu planning steps">
          <PlannerStep id="services" title="Build your service menu" shortTitle="Services and prices">
            <PlannerSection title="Service menu" description="Add the services you plan to offer. Use hands-on minutes and the price of one appointment.">
              <div className="space-y-3">
                {input.services.map((service, index) => (
                  <div key={`service-${index}`} className={styles.lineItem}>
                    <div className={styles.itemHeading}>
                      <TextField id={`service-${index}-name`} label="Service" value={service.name} onChange={(value) => updateService(index, "name", value)} />
                      <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${service.name || "service"}`} onClick={() => removeService(index)} disabled={input.services.length <= 1}><Trash2 aria-hidden="true" /></Button>
                    </div>
                    <div className={styles.serviceFields}>
                      <NumberField id={`service-${index}-minutes`} label="Minutes" unit="min" description="Hands-on minutes for one appointment. Leave out cleanup and time between clients." value={service.minutes} step="15" onChange={(value) => updateService(index, "minutes", value)} />
                      <NumberField id={`service-${index}-price`} label="Price" unit="$" description="US dollars charged for one appointment, before tips or tax." value={service.price} onChange={(value) => updateService(index, "price", value)} />
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.formActions}><Button type="button" variant="ctaBlue" onClick={addService}><Plus aria-hidden="true" />Add service</Button></div>
            </PlannerSection>
          </PlannerStep>
          <PlannerStep id="policies" title="Set your client policies" shortTitle="Client policies">
            <PlannerSection title="Client policies" description="Describe how cancellations and missed appointments will be handled.">
              <div className="grid gap-4 sm:grid-cols-3">
                <NumberField id="policy-cancellation-hours" label="Cancellation notice hours" unit="h" description="Minimum notice in hours. Enter 24 for one day." value={input.cancellationNoticeHours} onChange={(value) => updatePolicy("cancellationNoticeHours", value)} />
                <NumberField id="policy-late-fee" label="Late-cancellation fee" unit="$" description="US dollars charged when a client cancels inside that notice period. Use 0 if there is no fee." value={input.lateCancellationFee} onChange={(value) => updatePolicy("lateCancellationFee", value)} />
                <NumberField id="policy-no-show-fee" label="No-show fee" unit="$" description="US dollars charged for a missed appointment without notice. Use 0 if there is no fee." value={input.noShowFee} onChange={(value) => updatePolicy("noShowFee", value)} />
              </div>
              <TextAreaField id="policy-privacy-steps" label="Documentation privacy steps" description="Write one step per line, such as locking devices or limiting access to records. Describe your process; do not enter client information." value={input.privacySteps.join("\n")} rows={5} onChange={updatePrivacySteps} />
            </PlannerSection>
          </PlannerStep>
          <PlannerStep id="review" title="Review your menu and policies" shortTitle="Review">
            <div className={styles.reviewGrid}>
              <PlannerSection title="Menu summary" description="Compare the prices and hourly rates implied by your service list.">
                <div className={styles.metrics}>
                  <MetricTile label="Services" value={String(plan.serviceCount)} />
                  <MetricTile label="Average hourly rate" value={formatMoney(plan.averageHourlyRate)} />
                  <MetricTile label="Lowest price" value={formatMoney(plan.lowestPrice)} />
                  <MetricTile label="Highest price" value={formatMoney(plan.highestPrice)} />
                </div>
                <div className="space-y-3">
                  {plan.rows.map((service, index) => <div key={`${service.name}-${index}`} className={styles.lineItem}>
                    <p className="text-sm font-medium">{service.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatNumber(service.minutes)} minutes at {formatMoney(service.price)}</p>
                    <p className="mt-2 text-sm font-semibold tabular-nums">{formatMoney(service.hourlyRate)} / hour</p>
                  </div>)}
                </div>
              </PlannerSection>
              <PlannerSection title="Policy summary" description="Review this draft before using it in your business plan."><p className="text-sm leading-relaxed text-muted-foreground">{plan.policySummary}</p></PlannerSection>
            </div>
          </PlannerStep>
        </PlannerStepper>
      </div>
    </div>
  )
}
