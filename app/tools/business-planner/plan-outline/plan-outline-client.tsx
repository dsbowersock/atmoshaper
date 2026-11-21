"use client"

import { PlannerHeader } from "../_components/planner-header"
import { PlannerStep, PlannerStepper } from "../_components/planner-stepper"
import styles from "../_components/business-planner.module.css"
import { useMemo } from "react"
import { useBusinessPlannerDraft } from "@/lib/use-business-planner-draft"
import { NotebookPen, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BUSINESS_PLAN_OUTLINE_SECTIONS } from "@/lib/business-plan-template-tools"
import { BusinessDraftStorageNotice, PlannerSection, TextAreaField } from "../_components/business-tool-fields"
import { normalizePlanOutline, outlineContextRows, PLAN_OUTLINE_STORAGE_KEY } from "@/lib/business-planner-reports"
import { PlannerReportReview, SavedPlannerContext, usePlannerReportSources } from "../_components/planner-report"

type OutlineState = Record<string, string>

// Presentation groups retain the original section IDs and browser draft schema.
const outlineStepGroups = [
  { id: "purpose", title: "Explain your purpose", shortTitle: "Purpose", sections: ["mission", "purpose"] },
  { id: "operations", title: "Describe your services and operations", shortTitle: "Services and operations", sections: ["service", "operations"] },
  { id: "marketing", title: "Plan your marketing and finances", shortTitle: "Marketing and finances", sections: ["marketing", "finances"] },
  { id: "profile", title: "Introduce your professional background", shortTitle: "Profile and resume", sections: ["profile", "resume"] },
]

/** Keeps the local business outline editable even when its saved draft cannot be accessed. */
export function PlanOutlineClient() {
  const { value: outline, setValue: setOutline, storageReady, storageUnavailable, unreadDraft } = useBusinessPlannerDraft<OutlineState>({
    storageKey: PLAN_OUTLINE_STORAGE_KEY,
    initialValue: () => normalizePlanOutline({}),
    normalize: normalizePlanOutline,
  })
  const { sources, ready, refresh } = usePlannerReportSources()
  const completedSections = useMemo(() => (
    BUSINESS_PLAN_OUTLINE_SECTIONS.filter((section) => outline[section.id]?.trim()).length
  ), [outline])

  function updateSection(sectionId: string, value: string) {
    setOutline((current) => ({
      ...current,
      [sectionId]: value,
    }))
  }

  function resetOutline() {
    setOutline(normalizePlanOutline({}))
  }

  return (
    <div className={styles.page} data-plan-outline-planner>
      <div className={`${styles.workspace} ${styles.guidedWorkspace}`}>
        <BusinessDraftStorageNotice unavailable={storageUnavailable} unreadDraft={unreadDraft} />
        <PlannerHeader title="Business Plan Outline" description="Turn your ideas into a clear outline for your massage practice." icon={NotebookPen}
          saveLabel={!storageReady ? "Opening saved draft" : storageUnavailable ? "Not saved on this device" : "Saved on this device"}
          guide={<p>Saved checklist, services and financial planning facts are reused without overwriting your notes. Add only the narrative or explanation still needed. Open a source tool to change its facts, then refresh the report. This is a starting point for professional/lender discussion, not a complete loan application.</p>}
        >
          <p>{completedSections} of {BUSINESS_PLAN_OUTLINE_SECTIONS.length} sections with additional notes</p>
          <Button type="button" variant="ghost" onClick={resetOutline}><RotateCcw aria-hidden="true" />Reset outline notes</Button>
        </PlannerHeader>
        <PlannerStepper label="Business plan outline steps">
          {outlineStepGroups.map((group) => <PlannerStep key={group.id} id={group.id} title={group.title} shortTitle={group.shortTitle}>
            {BUSINESS_PLAN_OUTLINE_SECTIONS.filter((section) => group.sections.includes(section.id)).map((section) => (
              <PlannerSection key={section.id} title={section.title} description={section.prompt}>
                <SavedPlannerContext rows={outlineContextRows(section.id, sources)} />
                <TextAreaField id={`outline-${section.id}`} label={`${section.title} notes`} description="Add narrative or interpretation that is not already in the saved information. Your existing wording is preserved."
                  value={outline[section.id] ?? ""} placeholder={section.prompt} rows={5} onChange={(value) => updateSection(section.id, value)} />
              </PlannerSection>
            ))}
          </PlannerStep>)}
          <PlannerStep id="review" title="Review your complete outline" shortTitle="Review">
            <PlannerReportReview kind="outline" draft={outline} sources={sources} ready={ready && storageReady} refresh={refresh} />
          </PlannerStep>
        </PlannerStepper>
      </div>
    </div>
  )
}
