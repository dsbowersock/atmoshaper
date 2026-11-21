"use client"

import { PlannerHeader } from "../_components/planner-header"
import { PlannerStep, PlannerStepper } from "../_components/planner-stepper"
import styles from "../_components/business-planner.module.css"
import { useBusinessPlannerDraft } from "@/lib/use-business-planner-draft"
import { BusinessDraftStorageNotice, PlannerSection, TextAreaField, TextField } from "../_components/business-tool-fields"
import { PlannerReportReview, SavedPlannerContext, usePlannerReportSources } from "../_components/planner-report"
import { ListChecks, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { BUSINESS_LAUNCH_CHECKLIST_SECTIONS } from "@/lib/business-plan-template-tools"
import { checklistContextRows, LAUNCH_REPORT_QUESTIONS, LAUNCH_CHECKLIST_STORAGE_KEY, normalizeLaunchDraft, PLANNER_ANSWER_LIMIT } from "@/lib/business-planner-reports"

const checklistStepLabels = ["Structure", "Licensing", "Location", "Management", "Policies", "Presentation"]

/** Hydrates known checklist keys and preserves unread device work when storage is denied. */
export function LaunchChecklistClient() {
  const { value: draft, setValue: setDraft, storageReady, storageUnavailable, unreadDraft } = useBusinessPlannerDraft({
    storageKey: LAUNCH_CHECKLIST_STORAGE_KEY,
    initialValue: () => normalizeLaunchDraft({}),
    normalize: normalizeLaunchDraft,
  })
  const { sources, ready, refresh } = usePlannerReportSources()
  const completedCount = LAUNCH_REPORT_QUESTIONS.filter(({ key }) => draft[key] === true).length

  function setItemChecked(key: string, checked: boolean) {
    setDraft((current) => ({
      ...current,
      [key]: checked,
    }))
  }

  function resetChecklist() {
    // Written work survives the original checkmark-reset action.
    setDraft((current) => normalizeLaunchDraft({ ...current, ...Object.fromEntries(LAUNCH_REPORT_QUESTIONS.map(({ key }) => [key, false])) }))
  }

  function setAnswer(key: string, value: string) {
    setDraft((current) => normalizeLaunchDraft({ ...current, answers: { ...current.answers, [key]: value } }))
  }

  function setPractice(field: keyof typeof draft.practice, value: string) {
    setDraft((current) => normalizeLaunchDraft({ ...current, practice: { ...current.practice, [field]: value } }))
  }

  return (
    <div className={styles.page} data-launch-checklist-planner>
      <div className={`${styles.workspace} ${styles.guidedWorkspace}`}>
        <BusinessDraftStorageNotice unavailable={storageUnavailable} unreadDraft={unreadDraft} />
        <PlannerHeader title="Practice Launch Checklist" description="Work through the practical tasks for opening your massage practice." icon={ListChecks}
          saveLabel={!storageReady ? "Opening saved draft" : storageUnavailable ? "Not saved on this device" : "Saved on this device"}
          guide={<p>Write your responses and mark tasks you have actually completed. Writing or visiting a step does not check a task. At the end, review and download a working report for discussion with licensed professionals. Do not enter client information, tax IDs, bank details or credentials.</p>}
        >
          <p>{completedCount} of {LAUNCH_REPORT_QUESTIONS.length} tasks checked · responses save on this device</p>
          <Button type="button" variant="ghost" onClick={resetChecklist}><RotateCcw aria-hidden="true" />Reset checkmarks</Button>
        </PlannerHeader>
        <PlannerStepper label="Practice launch sections">
          {BUSINESS_LAUNCH_CHECKLIST_SECTIONS.map((section, index) => (
            <PlannerStep key={section.id} id={section.id} title={section.title} shortTitle={checklistStepLabels[index]}
              description={`${LAUNCH_REPORT_QUESTIONS.filter((question) => question.sectionId === section.id && draft[question.key] === true).length} of ${section.items.length} tasks checked in this section. Responses and completion are separate.`}
            >
              {index === 0 ? <PlannerSection title="Practice details" description="Collected once and reused in reports. Use business contact information you want included in the document.">
                <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                  <TextField id="launch-business-name" label="Business name" value={draft.practice.businessName} onChange={(value) => setPractice("businessName", value)} />
                  <TextField id="launch-prepared-by" label="Prepared by (optional)" value={draft.practice.preparedBy} onChange={(value) => setPractice("preparedBy", value)} />
                </div>
                <TextAreaField id="launch-business-contact" label="Business contact (optional)" rows={2} maxLength={600} value={draft.practice.contact} onChange={(value) => setPractice("contact", value)} />
              </PlannerSection> : null}
              <div className="grid min-w-0 gap-3">
                {LAUNCH_REPORT_QUESTIONS.filter((question) => question.sectionId === section.id).map(({ key, item, hint }) => {
                  return <div key={key} className={styles.checklistItem}>
                    <Checkbox id={key} checked={draft[key] === true} onCheckedChange={(value) => setItemChecked(key, value === true)} />
                    <div className="min-w-0 flex-1 space-y-3">
                      <Label htmlFor={key} className="cursor-pointer text-sm">{item}</Label>
                      <SavedPlannerContext rows={checklistContextRows(key, sources)} />
                      <TextAreaField id={`${key}-answer`} label="Response / notes" ariaLabel={`${item} Response`} description={hint} rows={3} maxLength={PLANNER_ANSWER_LIMIT}
                        value={draft.answers[key]} onChange={(value) => setAnswer(key, value)} />
                    </div>
                  </div>
                })}
              </div>
            </PlannerStep>
          ))}
          <PlannerStep id="report" title="Review and download your launch report" shortTitle="Report">
            <PlannerReportReview kind="launch" draft={draft} sources={sources} ready={ready && storageReady} refresh={refresh} />
          </PlannerStep>
        </PlannerStepper>
      </div>
    </div>
  )
}
