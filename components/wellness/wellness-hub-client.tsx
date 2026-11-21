"use client"

import Link from "next/link"
import { unstable_rethrow } from "next/navigation"
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import { Activity, ArrowLeft, BarChart3, BriefcaseBusiness, CalendarDays, Clock3, Download, Dumbbell, HeartPulse, Leaf, Moon, MoveUpRight, Radio, Save, Smile, TriangleAlert, Wind } from "lucide-react"
import {
  createClientWellnessEntryAction,
  deleteClientWellnessEntryAction,
  exportClientWellnessEntriesAction,
} from "@/app/wellness/actions"
import { BodyRegionSelector, BODY_REGION_OPTIONS } from "@/components/wellness/body-region-selector"
import { RomMeasurementPanel, type MovementRecordingDraft } from "@/components/wellness/rom-measurement-panel"
import { MOVEMENT_COMFORT_SCALE, summarizeMovementComfort } from "@/lib/movement-comfort"
import {
  WellnessCalendarCompanion,
  type ClientWellnessReminderSchedule,
  type WellnessAppointmentSummary,
} from "@/components/wellness/wellness-calendar-companion"
import { WellnessPatternReport } from "@/components/wellness/wellness-pattern-report"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CLIENT_WELLNESS_CATEGORIES } from "@/lib/client-wellness"
import { cn } from "@/lib/utils"
import activityStyles from "./activity-recording.module.css"
import { FeelingsWheel } from "./feelings-wheel"
import { ContextReflection } from "./context-reflection"
import { normalizeContextCheckIn, reflectionWords } from "@/lib/wellness-reflection"
import { createExerciseDraft, exerciseComparisonKey, exerciseSessions, validateExerciseRecord, type ExerciseDraft } from "@/lib/exercise-recording"
import { ExerciseRecorder } from "./exercise-recorder"
import { ExerciseHistory } from "./exercise-history"
import { WellnessEntryCard } from "./wellness-entry-card"
import { WELLNESS_CATEGORY_LABELS } from "@/lib/wellness-catalog"

export type WellnessTimelineEntry = {
  id: string
  category: string
  occurredAt: string
  timezone: string
  summary: string | null
  intensity: number | null
  regions: string[]
  sensations: string[]
  contexts: string[]
  source: string
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
  persisted: boolean
}

type ActionData = {
  entry?: WellnessTimelineEntry
  entries?: WellnessTimelineEntry[]
  filename?: string
  exportedAt?: string
}

const categoryLabels: Record<string, string> = WELLNESS_CATEGORY_LABELS

type WellnessTool = "log" | "rom" | "comfort" | "timeline" | "patterns" | "calendar" | "exercise-history" | null

const recordingTools = [
  { group: "body", category: "activity", title: "Activity", hint: "Movement or tasks", icon: Activity },
  { group: "body", category: "exercise", title: "Exercise", hint: "Sets, reps or timed practice", icon: Dumbbell },
  { group: "body", category: "incident", title: "Incident", hint: "Something that happened", icon: TriangleAlert },
  { group: "body", category: "body_sensation", title: "Body check-in", hint: "Physical sensations", icon: HeartPulse },
  { group: "context", category: "work_context", title: "Work context", hint: "Note your workday", icon: BriefcaseBusiness },
  { group: "mind", category: "emotion", title: "Feelings", hint: "Name how you feel", icon: Smile },
  { group: "mind", category: "sleep", title: "Sleep", hint: "Reflect on your rest", icon: Moon },
  { group: "context", category: "home_care", title: "Home care", hint: "Track your routine", icon: Leaf },
] as const
// Groups organize launchers only; saved check-in categories keep their existing meaning.
const recordingGroups = [
  { id: "mind", title: "Mind", tone: "default" },
  { id: "body", title: "Body", tone: "default" },
  { id: "context", title: "Context", tone: "setup" },
] as const
const reviewTools = [
  { tool: "timeline", title: "Timeline", hint: "Review your entries", icon: Clock3 },
  { tool: "exercise-history", title: "Exercise progress", hint: "Compare your recordings", icon: BarChart3 },
  { tool: "patterns", title: "Patterns", hint: "Reflect on trends", icon: BarChart3 },
  { tool: "calendar", title: "My calendar", hint: "Recordings, visits & reminders", icon: CalendarDays },
] as const

const contextOptions = ["desk", "sleep", "work", "movement", "exercise", "stress", "commute", "home care"]
const sensationOptions = ["tight", "achy", "sharp", "dull", "warm", "tingly", "numb", "tired", "burning", "pins and needles", "heavy", "tender"]
const bodyPositionOptions = ["sitting", "standing", "lying down", "walking", "working", "exercising", "unsure"]
const movementEffectOptions = [
  { value: "unsure", label: "Unsure" },
  { value: "better", label: "Better" },
  { value: "worse", label: "Worse" },
  { value: "unchanged", label: "Unchanged" },
]

const recordingQuestions: Record<string, { note: string; placeholder: string; hint: string }> = {
  activity: { note: "What were you doing?", placeholder: "A walk, gardening, lifting, or another activity…", hint: "Record a movement or task and what you noticed." },
  exercise: { note: "Anything you want to note?", placeholder: "How it went, a change you noticed, or something to remember…", hint: "Log one exercise or task. Add only the measurements you want to track." },
  incident: { note: "What happened?", placeholder: "Describe the event and anything you noticed afterward…", hint: "Record a specific event, such as a slip, bump or sudden change." },
  body_sensation: { note: "What do you notice?", placeholder: "Describe how this area feels, in your own words…", hint: "Mark an area or describe a physical sensation." },
  emotion: { note: "Anything you want to add?", placeholder: "A few words about how you feel…", hint: "Choose a feeling, write a note, or do both." },
  sleep: { note: "What was your sleep like?", placeholder: "When you slept and how rested you felt…", hint: "Record your rest and how you felt afterward." },
  work_context: { note: "What did you notice at work?", placeholder: "A task, repeated movement, position or workstation setup…", hint: "Notice tasks, positions or surroundings in your workday." },
  home_care: { note: "What did you notice at home?", placeholder: "A home routine, your surroundings, or something you did for yourself…", hint: "Record home routines, surroundings or self-care." },
  rom: { note: "Anything to note about the movement?", placeholder: "A note to keep with this check-in…", hint: "Open the guided recorder to measure a movement." },
}

type QuickLogDraft = { values: Record<string, string[]>; sections: Record<string, boolean>; regions: string[]; feelings: string[]; bodyOpen: boolean; exercise: ExerciseDraft }

// Server-rendered launchers wait for hydration so an early tap cannot be lost
// before React attaches their handlers. This static store has no subscriptions.
const subscribeHydration = () => () => {}
const hydratedSnapshot = () => true
const serverSnapshot = () => false

/** Render supplied timeline/report entries, display name and calendar context.
 * Signed-out additions stay in page state; signed-in saves require self-tracking
 * acknowledgment. Therapist sharing is disabled; these are not professional records.
 * Own pending/result state until each action promise settles and release the shared
 * admission lock; Next retains dispatch/revalidation ownership. */
export function WellnessHubClient({
  isSignedIn,
  displayName,
  initialEntries,
  initialReportEntries,
  initialExerciseEntries = [],
  appointments,
  reminderSchedules,
}: {
  isSignedIn: boolean
  displayName: string | null
  initialEntries: WellnessTimelineEntry[]
  initialReportEntries: WellnessTimelineEntry[]
  initialExerciseEntries?: WellnessTimelineEntry[]
  appointments: WellnessAppointmentSummary[]
  reminderSchedules: ClientWellnessReminderSchedule[]
}) {
  const launchersReady = useSyncExternalStore(subscribeHydration, hydratedSnapshot, serverSnapshot)
  const [activeTool, setActiveTool] = useState<WellnessTool>(null)
  const [logCategory, setLogCategory] = useState("body_sensation")
  const [bodyDetailsOpen, setBodyDetailsOpen] = useState(true)
  const isActivity = logCategory === "activity"
  const [selectedFeelings, setSelectedFeelings] = useState<string[]>([])
  const [exerciseDraft, setExerciseDraft] = useState<ExerciseDraft>(() => createExerciseDraft())
  const [exerciseHistoryKey, setExerciseHistoryKey] = useState("")
  const [exerciseEntries, setExerciseEntries] = useState(initialExerciseEntries)
  const toolHeadingRef = useRef<HTMLHeadingElement>(null)
  const defaultLauncherRef = useRef<HTMLButtonElement>(null)
  const launcherRef = useRef<HTMLButtonElement | null>(null)
  const moveFocus = useRef(false)

  // Preserve the existing global Quick Log destination without remounting the
  // page or shared music owner. Hash reads happen after hydration only.
  useEffect(() => {
    const openHashTool = () => {
      if (window.location.hash === "#quick-log") {
        moveFocus.current = true
        setActiveTool("log")
      }
    }
    const openQuickLogLink = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = event.target instanceof Element ? event.target.closest("a") : null
      if (anchor?.origin === window.location.origin && anchor.pathname === "/wellness" && anchor.hash === "#quick-log") {
        moveFocus.current = true
        setActiveTool("log")
      }
    }
    openHashTool()
    document.addEventListener("click", openQuickLogLink, true)
    window.addEventListener("hashchange", openHashTool)
    return () => {
      window.removeEventListener("hashchange", openHashTool)
      document.removeEventListener("click", openQuickLogLink, true)
    }
  }, [])
  useEffect(() => {
    if (!moveFocus.current) return
    moveFocus.current = false
    if (activeTool) toolHeadingRef.current?.focus()
    else (launcherRef.current ?? defaultLauncherRef.current)?.focus()
  }, [activeTool])

  const formRef = useRef<HTMLFormElement>(null)
  const categoryDrafts = useRef(new Map<string, QuickLogDraft>())
  const draftToRestore = useRef<{ draft?: QuickLogDraft } | null>(null)
  const [entries, setEntries] = useState(initialEntries)
  const [reportEntries, setReportEntries] = useState(initialReportEntries)
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [timelineCategoryFilter, setTimelineCategoryFilter] = useState("all")
  const [timelineRegionFilter, setTimelineRegionFilter] = useState("all")
  const [timelineSignalFilter, setTimelineSignalFilter] = useState("all")
  const [acknowledged, setAcknowledged] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmExport, setConfirmExport] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const actionPending = useRef(false)

  // Restore native inputs after the new category's controls commit. Controlled
  // region/feeling values are restored by React; only this page owns the drafts.
  useLayoutEffect(() => {
    if (!draftToRestore.current || !formRef.current) return
    restoreQuickLogDraft(formRef.current, draftToRestore.current.draft, logCategory)
    draftToRestore.current = null
  }, [logCategory])

  function selectRecordingCategory(category: string) {
    if (actionPending.current || category === logCategory || !CLIENT_WELLNESS_CATEGORIES.includes(category)) return
    if (formRef.current) categoryDrafts.current.set(logCategory, captureQuickLogDraft(formRef.current, selectedRegions, selectedFeelings, bodyDetailsOpen, exerciseDraft))
    const draft = categoryDrafts.current.get(category)
    draftToRestore.current = { draft }
    setLogCategory(category)
    setSelectedRegions(draft?.regions ?? [])
    setSelectedFeelings(draft?.feelings ?? [])
    setExerciseDraft(draft?.exercise ?? createExerciseDraft())
    setBodyDetailsOpen(draft?.bodyOpen ?? category === "body_sensation")
    setStatus(null); setError(null)
  }

  /** Own only this component's action promise and result application. Next still
   * owns dispatch/revalidation; local completion alone does not prove queue readiness.
   * The ref closes same-tick admission before React renders the disabled controls. */
  const runOwnedAction = async (operation: () => Promise<void>, failureMessage: string) => {
    if (actionPending.current) return
    actionPending.current = true
    setIsPending(true)
    setError(null)
    setStatus(null)
    try {
      await operation()
    } catch (error) {
      unstable_rethrow(error)
      setError(failureMessage)
    } finally {
      actionPending.current = false
      setIsPending(false)
    }
  }

  /** A named launcher always opens that recording type. Keep each type's native
   * fields and controlled choices separately instead of silently relabeling or
   * reopening another tool's unfinished entry. Pending actions still own the lock. */
  function openTool(tool: WellnessTool, opener: HTMLButtonElement, category?: string) {
    if (actionPending.current) return
    launcherRef.current = opener
    moveFocus.current = true
    if (category) selectRecordingCategory(category)
    setActiveTool(tool)
  }
  function returnToTools() {
    if (actionPending.current) return
    if (window.location.hash === "#quick-log") {
      window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search)
    }
    moveFocus.current = true
    setActiveTool(null)
  }
  const activeTitle = activeTool === "log"
    ? categoryLabels[logCategory] ?? "Check-in"
    : activeTool === "rom" ? "Range of motion" : activeTool === "comfort" ? "Movement comfort" : reviewTools.find((tool) => tool.tool === activeTool)?.title

  const timelineSignalOptions = useMemo(() => (
    [...new Set(entries.flatMap((entry) => [...entry.sensations, ...entry.contexts, ...reflectionWords(entry.metadata.feelingWords), ...reflectionWords(normalizeContextCheckIn(entry.category, entry.metadata.contextCheckIn)?.prompts)]))].sort((a, b) => a.localeCompare(b))
  ), [entries])
  const timelineRegionOptions = useMemo(() => (
    [...new Set([...BODY_REGION_OPTIONS, ...entries.flatMap((entry) => entry.regions)])].sort((a, b) => a.localeCompare(b))
  ), [entries])

  const filteredEntries = useMemo(() => entries.filter((entry) => (
    matchesTimelineFilter(entry, timelineCategoryFilter, timelineRegionFilter, timelineSignalFilter)
  )), [entries, timelineCategoryFilter, timelineRegionFilter, timelineSignalFilter])

  const reportEntriesForPanel = useMemo(() => (
    isSignedIn ? reportEntries : entries
  ), [entries, isSignedIn, reportEntries])
  const comfortReferences = useMemo(() => summarizeMovementComfort(reportEntriesForPanel), [reportEntriesForPanel])
  const exerciseHistorySessions = useMemo(() => exerciseSessions([...exerciseEntries, ...entries]), [exerciseEntries, entries])

  const saveQuickLog = () => {
    if (actionPending.current) return
    const form = formRef.current

    if (!form) {
      return
    }

    const formData = wellnessFormData(form)
    if (stringFormValue(formData, "category") === "exercise") {
      const result = validateExerciseRecord(parseJsonRecord(stringFormValue(formData, "exerciseRecord")))
      if (result.error) { setError(result.error); form.reportValidity?.(); return }
    }

    if (!isSignedIn) {
      const entry = localEntryFromFormData(formData)
      setEntries((current) => upsertTimelineEntry(entry, current))
      setStatus("Practice entry added for this page session. Sign in before saving anything permanently.")
      setError(null)
      form.reset()
      categoryDrafts.current.delete(logCategory)
      setSelectedRegions([])
      setSelectedFeelings([])
      setExerciseDraft(createExerciseDraft())
      return
    }

    if (!acknowledged) {
      setError("Acknowledge the self-tracking privacy boundary before saving.")
      return
    }

    return runOwnedAction(async () => {
      const result = await createClientWellnessEntryAction(formData)

      if (result?.ok !== true) {
        setError(actionReason(result?.reason, "Could not save this entry."))
        return
      }

      const data = actionData(result.data)
      const entry = normalizeTimelineEntry(data.entry, true)
      if (!entry) { setError("Could not save this entry."); return }
      setEntries((current) => upsertTimelineEntry(entry, current))
      setReportEntries((current) => upsertTimelineEntry(entry, current))
      if (entry.category === "exercise") setExerciseEntries((current) => upsertTimelineEntry(entry, current))
      setStatus("Saved to your client-owned wellness timeline.")
      form.reset()
      categoryDrafts.current.delete(logCategory)
      setSelectedRegions([])
      setSelectedFeelings([])
      setExerciseDraft(createExerciseDraft())
    }, "Could not save this entry.")
  }

  const saveRomMeasurement = (draft: MovementRecordingDraft) => {
    if (actionPending.current) return
    const formData = romFormData(draft)
    const label = draft.comfortScore !== undefined ? "movement check-in" : "ROM measurement"

    if (!isSignedIn) {
      const entry = localEntryFromFormData(formData)
      setEntries((current) => upsertTimelineEntry(entry, current))
      setStatus(`Practice ${label} added for this page session. Sign in to keep recordings over time.`)
      setError(null)
      return
    }

    if (!acknowledged) {
      setError(`Acknowledge the self-tracking privacy boundary before saving a ${label}.`)
      return
    }

    return runOwnedAction(async () => {
      const result = await createClientWellnessEntryAction(formData)

      if (result?.ok !== true) {
        setError(actionReason(result?.reason, `Could not save this ${label}.`))
        return
      }

      const data = actionData(result.data)
      const entry = normalizeTimelineEntry(data.entry, true)
      if (!entry) { setError(`Could not save this ${label}.`); return }
      setEntries((current) => upsertTimelineEntry(entry, current))
      setReportEntries((current) => upsertTimelineEntry(entry, current))
      setStatus(`${label === "ROM measurement" ? "ROM measurement" : "Movement check-in"} saved to your wellness timeline.`)
    }, `Could not save this ${label}.`)
  }

  const deleteEntry = (entry: WellnessTimelineEntry) => {
    if (actionPending.current) return
    if (!entry.persisted) {
      setEntries((current) => removeTimelineEntry(entry.id, current))
      setConfirmDeleteId(null)
      setStatus("Removed the practice entry from this page session.")
      return
    }

    if (confirmDeleteId !== entry.id) {
      setConfirmDeleteId(entry.id)
      return
    }

    const formData = new FormData()
    formData.set("id", entry.id)

    return runOwnedAction(async () => {
      const result = await deleteClientWellnessEntryAction(formData)

      if (result?.ok !== true) {
        setError(actionReason(result?.reason, "Could not delete this entry."))
        return
      }

      setEntries((current) => removeTimelineEntry(entry.id, current))
      setReportEntries((current) => removeTimelineEntry(entry.id, current))
      setExerciseEntries((current) => removeTimelineEntry(entry.id, current))
      setConfirmDeleteId(null)
      setStatus("Entry deleted from your wellness timeline.")
    }, "Could not delete this entry.")
  }

  const exportEntries = () => {
    if (actionPending.current) return
    if (!isSignedIn) {
      setError("Sign in before exporting saved wellness entries.")
      return
    }

    if (!confirmExport) {
      setConfirmExport(true)
      return
    }

    return runOwnedAction(async () => {
      const result = await exportClientWellnessEntriesAction()

      if (result?.ok !== true) {
        setError(actionReason(result?.reason, "Could not export wellness entries."))
        return
      }

      const data = actionData(result.data)
      downloadJson(data.filename ?? "massagelab-wellness-export.json", {
        exportedAt: data.exportedAt,
        entries: data.entries ?? [],
      })
      setConfirmExport(false)
      setStatus("Export prepared in your browser.")
    }, "Could not export wellness entries.")
  }

  const question = recordingQuestions[logCategory]
  const showSensationTerms = ["body_sensation", "activity", "incident", "work_context", "home_care"].includes(logCategory)
  const bodyRegionControl = <details data-log-body className={activityStyles.body} open={bodyDetailsOpen} onToggle={(event) => {
    if (event.target === event.currentTarget && event.currentTarget.open !== bodyDetailsOpen) setBodyDetailsOpen(event.currentTarget.open)
  }}>
    <summary>{logCategory === "body_sensation" ? "Where do you notice it?" : isActivity ? "Body regions (optional)" : logCategory === "incident" ? "Where on your body? (optional)" : "Body regions (optional)"}</summary>
    <div className="mt-3"><BodyRegionSelector interactive active={activeTool === "log" && bodyDetailsOpen} disabled={isPending} selectedRegions={selectedRegions} onChange={setSelectedRegions} /></div>
  </details>

  return (
    <div data-wellness-hub>
      <div hidden={activeTool !== null} data-wellness-home>
        <section aria-labelledby="wellness-reset-title">
          <h2 id="wellness-reset-title">Take a moment</h2>
          <div data-wellness-tool-grid>
            <Button asChild variant="ctaBlue" data-wellness-tile aria-label="Open breathing guide">
              <Link href="/wellness/breathing"><Wind aria-hidden="true" /><span><strong>Breathing guide</strong><small>Follow a calm rhythm</small></span></Link>
            </Button>
            <Button asChild variant="glow" data-wellness-tile aria-label="Open music">
              <Link href="/music"><Radio aria-hidden="true" /><span><strong>Music</strong><small>Find your atmosphere</small></span></Link>
            </Button>
          </div>
        </section>
        {recordingGroups.map((group) => (
          <section key={group.id} aria-labelledby={`wellness-${group.id}-title`}>
            <h2 id={`wellness-${group.id}-title`}>{group.title}</h2>
            <div data-wellness-tool-grid>
              {group.id === "body" && <>
                <Button type="button" variant="secondary" data-wellness-tile disabled={isPending || !launchersReady} aria-label="Open movement comfort" onClick={(event) => openTool("comfort", event.currentTarget)}>
                  <HeartPulse aria-hidden="true" /><span><strong>Movement comfort</strong><small>How movement feels</small></span>
                </Button>
                <Button type="button" variant="secondary" data-wellness-tile disabled={isPending || !launchersReady} aria-label="Open range of motion" onClick={(event) => openTool("rom", event.currentTarget)}>
                  <MoveUpRight aria-hidden="true" /><span><strong>Range of motion</strong><small>Measure movement</small></span>
                </Button>
              </>}
              {recordingTools.filter((tool) => tool.group === group.id).map(({ category, title, hint, icon: Icon }) => (
                <Button key={category} ref={category === "body_sensation" ? defaultLauncherRef : undefined} type="button" variant={group.id === "mind" ? "cta" : group.id === "body" ? "secondary" : "default"} tone={group.tone} data-wellness-tile disabled={isPending || !launchersReady} aria-label={`Record ${title.toLowerCase()}`} onClick={(event) => openTool("log", event.currentTarget, category)}>
                  <Icon aria-hidden="true" /><span><strong>{title}</strong><small>{hint}</small></span>
                </Button>
              ))}
            </div>
          </section>
        ))}
        <section aria-labelledby="wellness-review-title">
          <h2 id="wellness-review-title">Review & plan</h2>
          <div data-wellness-tool-grid>
            {reviewTools.map(({ tool, title, hint, icon: Icon }) => (
              <Button key={tool} type="button" variant="success" data-wellness-tile disabled={isPending || !launchersReady} aria-label={`Open ${title.toLowerCase()}`} onClick={(event) => openTool(tool, event.currentTarget)}>
                <Icon aria-hidden="true" /><span><strong>{title}</strong><small>{hint}</small></span>
              </Button>
            ))}
          </div>
        </section>
      </div>
      <div hidden={activeTool === null} data-wellness-workspace>
        <div className="mb-4 flex min-w-0 flex-wrap items-center gap-3">
          <Button type="button" variant="ghost" onClick={returnToTools} disabled={isPending}><ArrowLeft aria-hidden="true" />All wellness tools</Button>
          <h1 data-wellness-tool-title ref={toolHeadingRef} tabIndex={-1} className="text-lg font-semibold">{activeTitle}</h1>
        </div>
        <div hidden={activeTool !== "calendar"} data-wellness-pane>
        <WellnessCalendarCompanion
          isSignedIn={isSignedIn}
          appointments={appointments}
          reminderSchedules={reminderSchedules}
          entries={entries}
          active={activeTool === "calendar"}
        />
        </div>

        <div hidden={activeTool !== "patterns"} data-wellness-pane><WellnessPatternReport entries={reportEntriesForPanel} isSignedIn={isSignedIn} /></div>
        <div hidden={activeTool !== "exercise-history"} data-wellness-pane>{activeTool === "exercise-history" ? <ExerciseHistory sessions={exerciseHistorySessions} selectedKey={exerciseHistoryKey} onSelect={setExerciseHistoryKey} isSignedIn={isSignedIn} /> : null}</div>

        <div id="quick-log" hidden={activeTool !== "log"} data-wellness-pane>
        <form ref={formRef} onSubmit={(event) => { event.preventDefault(); void saveQuickLog() }} data-activity-form={isActivity || undefined} data-check-in-category={logCategory} className={activityStyles.form} aria-busy={isPending}>
          <fieldset disabled={isPending} className={activityStyles.fields}>
            <div data-log-type className={activityStyles.typeChoice}>
              <Label htmlFor="wellnessCategory">What would you like to record?</Label>
              <select id="wellnessCategory" name="category" value={logCategory} onChange={(event) => selectRecordingCategory(event.target.value)}>
                {CLIENT_WELLNESS_CATEGORIES.map((category) => <option key={category} value={category}>{categoryLabels[category] ?? category}</option>)}
              </select>
              <p>{question.hint}</p>
            </div>

            {logCategory === "body_sensation" ? bodyRegionControl : null}
            {logCategory === "exercise" ? <ExerciseRecorder draft={exerciseDraft} onChange={setExerciseDraft} sessions={exerciseHistorySessions} disabled={isPending} onHistory={() => {
              const record = validateExerciseRecord(exerciseDraft).record
              setExerciseHistoryKey(record ? exerciseComparisonKey(record) : "")
              moveFocus.current = true; setActiveTool("exercise-history")
            }} /> : null}
            <div data-log-feelings hidden={logCategory !== "emotion"}><FeelingsWheel selected={selectedFeelings} disabled={isPending} onChange={setSelectedFeelings} /></div>
            {logCategory === "rom" ? <div data-log-reflection><Button type="button" variant="ctaBlue" disabled={isPending} onClick={(event) => openTool("rom", event.currentTarget)}>Open range of motion recorder</Button></div> : null}

            <div data-log-note className="space-y-2">
              <Label htmlFor="wellnessSummary">{question.note} <span className={activityStyles.optional}>(optional)</span></Label>
              <Textarea id="wellnessSummary" name="summary" placeholder={question.placeholder} />
            </div>

            <details data-log-reflection data-draft-section="reflection" hidden={logCategory !== "work_context" && logCategory !== "home_care"}>
              <summary>{logCategory === "home_care" ? "Home routines and self-care (optional)" : "Work situation (optional)"}</summary>
              <div className="mt-3"><ContextReflection category={logCategory} disabled={isPending} /></div>
            </details>
            {logCategory !== "body_sensation" ? bodyRegionControl : null}

            <details data-log-sensations data-activity-extra data-draft-section="sensations" hidden={logCategory === "exercise"}>
              <summary>{showSensationTerms ? "Sensations and intensity (optional)" : "Intensity (optional)"}</summary>
              <div className="mt-3 grid gap-4">
                <fieldset hidden={!showSensationTerms}>
                  <legend className="text-sm font-medium">How does it feel?</legend>
                  <div className={activityStyles.chips}>{sensationOptions.map((sensation) => <label key={sensation}><input name="sensations" value={sensation} type="checkbox" />{sensation}</label>)}</div>
                  <div className="mt-3 space-y-2"><Label htmlFor="wellnessCustomTerm">Your own sensation word</Label><Input id="wellnessCustomTerm" name="customTerm" placeholder="Your words" /></div>
                </fieldset>
                <div className="space-y-2"><Label htmlFor="wellnessIntensity">How strong is it?</Label><Input id="wellnessIntensity" name="intensity" type="number" min="0" max="10" inputMode="numeric" placeholder="0–10" aria-describedby="wellness-intensity-help" /><p id="wellness-intensity-help">0 = none · 10 = strongest you notice. Leave blank to skip.</p></div>
              </div>
            </details>

            <details data-log-context data-draft-section="timing">
              <summary>Timing and context (optional)</summary>
              <div className="mt-3 grid gap-4">
                <div className={activityStyles.twoColumns}>
                  <div className="space-y-2"><Label htmlFor="wellnessOccurredAt">When was this?</Label><Input id="wellnessOccurredAt" name="occurredAt" type="datetime-local" /></div>
                  <div hidden={logCategory === "exercise"} className="space-y-2"><Label htmlFor="wellnessDuration">Duration in minutes</Label><Input id="wellnessDuration" name="durationMinutes" type="number" min="0" max="10080" inputMode="numeric" placeholder="15" /></div>
                </div>
                <div hidden={!showSensationTerms} className={activityStyles.twoColumns}>
                  <div hidden={isActivity} className="space-y-2"><Label htmlFor="wellnessBodyPosition">Body position</Label><select id="wellnessBodyPosition" name="bodyPosition" defaultValue=""><option value="">Not selected</option>{bodyPositionOptions.map((position) => <option key={position} value={position}>{position}</option>)}</select></div>
                  <div hidden={isActivity} className="space-y-2"><Label htmlFor="wellnessMovementEffect">Movement effect</Label><select id="wellnessMovementEffect" name="movementEffect" defaultValue="unsure">{movementEffectOptions.map((effect) => <option key={effect.value} value={effect.value}>{effect.label}</option>)}</select></div>
                  <div className="space-y-2"><Label htmlFor="wellnessActivityContext">Activity detail</Label><Input id="wellnessActivityContext" name="activityContext" placeholder="Typing, driving, lifting, gardening" /></div>
                </div>
                <fieldset><legend className="text-sm font-medium">What else was going on?</legend><div className={activityStyles.chips}>{contextOptions.map((context) => <label key={context}><input name="contexts" value={context} type="checkbox" />{context}</label>)}</div></fieldset>
              </div>
            </details>

            <div className={activityStyles.privacy}>
              {!isSignedIn ? <p>Practice entries stay on this page. <Link href="/login" className="text-primary underline">Sign in</Link> to keep your history.</p> : <div className="flex items-start gap-3">
                <Checkbox id="wellnessPrivacy" checked={acknowledged} onCheckedChange={(value) => setAcknowledged(value === true)} aria-describedby="wellnessPrivacyDescription" />
                <div className="min-w-0"><Label htmlFor="wellnessPrivacy">Save as self-tracking data</Label><p id="wellnessPrivacyDescription" className="mt-1">These entries are not therapist professional records, diagnosis, emergency monitoring, or a live therapist dashboard.</p></div>
              </div>}
            </div>
            <Button data-activity-save type="button" variant={recordingTools.find((tool) => tool.category === logCategory)?.group === "mind" ? "cta" : "default"} tone={recordingTools.find((tool) => tool.category === logCategory)?.group === "context" ? "setup" : "default"} onClick={saveQuickLog} disabled={isPending}><Save aria-hidden="true" />{isSignedIn ? "Save" : "Add practice"} {activeTitle?.toLowerCase()}</Button>
          </fieldset>
        </form>
        </div>

        {/* Separate mounted drafts preserve each tool's focus and unsaved work;
            only the active instance can own sensors or a 3D scene. */}
        {(["rom", "comfort"] as const).map((tool) => <div key={tool} hidden={activeTool !== tool} data-wellness-pane>
        <RomMeasurementPanel focus={tool === "rom" ? "range" : "comfort"} comfortReferences={comfortReferences} isSignedIn={isSignedIn} disabled={isPending} active={activeTool === tool} onMeasurement={saveRomMeasurement}
          privacyControl={isSignedIn ? <div className="flex items-start gap-3 rounded-md border border-border/80 bg-card/70 p-3">
            <Checkbox id={`${tool}WellnessPrivacy`} checked={acknowledged} onCheckedChange={(value) => setAcknowledged(value === true)} aria-describedby={`${tool}WellnessPrivacyDescription`} />
            <div className="min-w-0"><Label htmlFor={`${tool}WellnessPrivacy`}>Save as self-tracking data</Label><p id={`${tool}WellnessPrivacyDescription`} className="mt-1 text-xs leading-relaxed text-muted-foreground">These entries are not therapist professional records, diagnosis, emergency monitoring, or a live therapist dashboard.</p></div>
          </div> : <p className="text-xs leading-relaxed text-muted-foreground">Practice recordings stay on this page only. <Link href="/login" className="text-primary underline">Sign in</Link> to keep recordings over time.</p>}
        />
        </div>)}

        {(status || error || isPending) ? (
          <div
            className={cn(
              "rounded-md border p-3 text-sm",
              error ? "border-destructive/40 bg-destructive/10" : "border-primary/50 bg-primary/10",
            )}
            role="status"
          >
            {isPending ? "Working..." : error ?? status}
          </div>
        ) : null}
      </div>

      <aside hidden={activeTool !== "timeline"} data-wellness-pane className="mt-4 min-w-0">
        <div className="rounded-md border border-border/80 bg-card/95 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Timeline</h3>
              <p className="mt-1 text-sm text-muted-foreground">{displayName ? `${displayName}'s entries` : "Recent entries"}</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={exportEntries} disabled={!isSignedIn || isPending}>
              <Download className="h-4 w-4" aria-hidden="true" />
              {confirmExport ? "Confirm" : "Export"}
            </Button>
          </div>

          {entries.length === 0 ? (
            <div className="mt-4 rounded-md border border-border/80 bg-background/80 p-3 text-sm text-muted-foreground">
              No wellness entries yet.
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              <div className="grid gap-2">
                <Label htmlFor="timelineCategoryFilter">Filter timeline</Label>
                <select
                  id="timelineCategoryFilter"
                  value={timelineCategoryFilter}
                  onChange={(event) => setTimelineCategoryFilter(event.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All categories</option>
                  {CLIENT_WELLNESS_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category === "rom" ? "Movement comfort & ROM" : categoryLabels[category] ?? category}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Filter timeline by body region"
                  value={timelineRegionFilter}
                  onChange={(event) => setTimelineRegionFilter(event.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All regions</option>
                  {timelineRegionOptions.map((region) => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
                <select
                  aria-label="Filter timeline by sensation or context"
                  value={timelineSignalFilter}
                  onChange={(event) => setTimelineSignalFilter(event.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All sensations and contexts</option>
                  {timelineSignalOptions.map((signal) => (
                    <option key={signal} value={signal}>{signal}</option>
                  ))}
                </select>
              </div>

              {filteredEntries.length === 0 ? (
                <div className="rounded-md border border-border/80 bg-background/80 p-3 text-sm text-muted-foreground">
                  No entries match these filters.
                </div>
              ) : filteredEntries.map((entry) => (
                <WellnessEntryCard
                  key={entry.id}
                  entry={entry}
                  confirmDelete={confirmDeleteId === entry.id}
                  disabled={isPending}
                  onDelete={() => deleteEntry(entry)}
                />
              ))}
            </div>
          )}

          {confirmExport ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Export downloads a JSON copy of saved self-tracking entries to this browser.
            </p>
          ) : null}
        </div>
      </aside>
    </div>
  )
}

/** In-memory snapshots include unchecked native controls via restore defaults,
 * plus explicit controlled selections. Nothing is written to browser storage,
 * diagnostics, preferences or the server until the existing save action runs. */
function captureQuickLogDraft(form: HTMLFormElement, regions: string[], feelings: string[], bodyOpen: boolean, exercise: ExerciseDraft): QuickLogDraft {
  const values: Record<string, string[]> = {}
  for (const [name, value] of new FormData(form)) if (typeof value === "string" && name !== "category") (values[name] ??= []).push(value)
  const sections = Object.fromEntries([...form.querySelectorAll<HTMLDetailsElement>("details[data-draft-section]")].map((section) => [section.dataset.draftSection!, section.open]))
  return { values, sections, regions: [...regions], feelings: [...feelings], bodyOpen, exercise }
}

/** Run after a category commit so native values and optional-section expansion
 * match that category's own draft. Controlled category/hidden choices stay with
 * React; resetting one completed entry never clears another category's draft. */
function restoreQuickLogDraft(form: HTMLFormElement, draft: QuickLogDraft | undefined, category: string) {
  form.reset()
  // Native reset restores the select's original default, even though React has
  // already committed the next category. Keep the DOM payload and view aligned.
  const categoryField = form.querySelector<HTMLSelectElement>("#wellnessCategory")
  if (categoryField) categoryField.value = category
  if (draft) for (const element of form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input[name],select[name],textarea[name]")) {
    if (element.name === "category" || element.type === "hidden") continue
    const values = draft.values[element.name] ?? []
    if (element.type === "checkbox" || element.type === "radio") (element as HTMLInputElement).checked = values.includes(element.value)
    else element.value = values[0] ?? ""
  }
  for (const section of form.querySelectorAll<HTMLDetailsElement>("details[data-draft-section]")) section.open = draft?.sections[section.dataset.draftSection!] ?? false
}

function wellnessFormData(form: HTMLFormElement) {
  const formData = new FormData(form)
  const customTerm = stringFormValue(formData, "customTerm")
  const occurredAt = stringFormValue(formData, "occurredAt")

  if (customTerm) {
    formData.append("sensations", customTerm)
    formData.append("customSensations", customTerm)
  }
  if (occurredAt) {
    const occurredAtDate = new Date(occurredAt)
    if (Number.isFinite(occurredAtDate.getTime())) {
      formData.set("occurredAt", occurredAtDate.toISOString())
    } else {
      formData.delete("occurredAt")
    }
  }

  formData.set("timezone", browserTimezone())
  formData.set("source", "quick-log")
  const category = stringFormValue(formData, "category")
  const feelingWords = category === "emotion" ? reflectionWords(formData.getAll("feelingWords")) : []
  const prompts = category === "work_context" ? formData.getAll("workPrompts") : category === "home_care" ? [...formData.getAll("homePrompts"), ...formData.getAll("carePrompts")] : []
  const contextCheckIn = normalizeContextCheckIn(category, { ...Object.fromEntries(["activity", "posture", "repetition", "surroundings", "noticed", "careAction", "careEffect"].map((key) => [key, stringFormValue(formData, `reflection-${key}`)])), prompts })
  const exerciseRecord = category === "exercise" ? validateExerciseRecord(parseJsonRecord(stringFormValue(formData, "exerciseRecord"))).record : null
  if (category === "exercise") formData.delete("intensity")
  for (const prompt of prompts) formData.append("contexts", prompt)
  formData.set("metadata", JSON.stringify({
    durationMinutes: durationMinutesOrNull(stringFormValue(formData, "durationMinutes")),
    activityContext: stringFormValue(formData, "activityContext"),
    ...(stringFormValue(formData, "category") !== "activity" ? { bodyPosition: stringFormValue(formData, "bodyPosition"), movementEffect: stringFormValue(formData, "movementEffect") } : {}),
    ...(feelingWords.length ? { feelingWords } : {}),
    ...(contextCheckIn ? { contextCheckIn } : {}),
    ...(exerciseRecord ? { exerciseRecord } : {}),
  }))
  return formData
}

/** Keep angle-only payloads compatible. Comfort is a separately versioned
 * self-rating, never a substitute value for degrees or symptom intensity. */
function romFormData(draft: MovementRecordingDraft) {
  const formData = new FormData()
  formData.set("category", "rom")
  formData.set("occurredAt", new Date().toISOString())
  formData.set("timezone", browserTimezone())
  formData.set("source", draft.source)
  formData.set("summary", draft.note)
  formData.set("metadata", JSON.stringify({
    movement: draft.movement,
    side: draft.side,
    axis: draft.axis,
    baselineAngle: draft.baselineAngle,
    endAngle: draft.endAngle,
    changeDegrees: draft.changeDegrees,
    ...(draft.comfortScore !== undefined ? { recordingKind: draft.changeDegrees !== undefined ? "both" : "comfort", comfortScore: draft.comfortScore, comfortScale: MOVEMENT_COMFORT_SCALE } : {}),
  }))
  return formData
}

function localEntryFromFormData(formData: FormData): WellnessTimelineEntry {
  const now = new Date().toISOString()
  const metadata = parseJsonRecord(stringFormValue(formData, "metadata"))

  return {
    id: `practice-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    category: stringFormValue(formData, "category") || "body_sensation",
    occurredAt: stringFormValue(formData, "occurredAt") || now,
    timezone: stringFormValue(formData, "timezone") || browserTimezone(),
    summary: stringFormValue(formData, "summary") || null,
    intensity: numberOrNull(stringFormValue(formData, "intensity")),
    regions: stringList(formData.getAll("regions")),
    sensations: stringList(formData.getAll("sensations")),
    contexts: stringList(formData.getAll("contexts")),
    source: stringFormValue(formData, "source") || "manual",
    metadata,
    createdAt: now,
    updatedAt: now,
    persisted: false,
  }
}

function actionData(value: unknown): ActionData {
  return value && typeof value === "object" ? (value as ActionData) : {}
}

function normalizeTimelineEntry(value: unknown, persisted: boolean): WellnessTimelineEntry | null {
  const entry = value && typeof value === "object" ? value as Partial<WellnessTimelineEntry> : null

  if (!entry || typeof entry.id !== "string" || typeof entry.category !== "string" || typeof entry.occurredAt !== "string") {
    return null
  }

  const now = new Date().toISOString()

  return {
    id: entry.id,
    category: entry.category,
    occurredAt: entry.occurredAt,
    timezone: typeof entry.timezone === "string" ? entry.timezone : browserTimezone(),
    summary: typeof entry.summary === "string" ? entry.summary : null,
    intensity: typeof entry.intensity === "number" ? entry.intensity : null,
    regions: Array.isArray(entry.regions) ? entry.regions.filter((item): item is string => typeof item === "string") : [],
    sensations: Array.isArray(entry.sensations) ? entry.sensations.filter((item): item is string => typeof item === "string") : [],
    contexts: Array.isArray(entry.contexts) ? entry.contexts.filter((item): item is string => typeof item === "string") : [],
    source: typeof entry.source === "string" ? entry.source : "manual",
    metadata: entry.metadata && typeof entry.metadata === "object" && !Array.isArray(entry.metadata) ? entry.metadata : {},
    createdAt: typeof entry.createdAt === "string" ? entry.createdAt : now,
    updatedAt: typeof entry.updatedAt === "string" ? entry.updatedAt : now,
    persisted,
  }
}

function actionReason(reason: string | undefined, fallback: string) {
  if (reason === "invalid-exercise-recording") return "Check the exercise name, measurements and units before saving."
  if (reason === "sign-in-required") {
    return "Sign in before saving wellness entries."
  }
  return fallback
}

function matchesTimelineFilter(entry: WellnessTimelineEntry, category: string, region: string, signal: string) {
  if (category !== "all" && entry.category !== category) {
    return false
  }

  if (region !== "all" && !entry.regions.includes(region)) {
    return false
  }

  if (signal !== "all" && !entry.sensations.includes(signal) && !entry.contexts.includes(signal) && !reflectionWords(entry.metadata.feelingWords).includes(signal) && !reflectionWords(normalizeContextCheckIn(entry.category, entry.metadata.contextCheckIn)?.prompts).includes(signal)) {
    return false
  }

  return true
}

function upsertTimelineEntry(entry: WellnessTimelineEntry, entries: WellnessTimelineEntry[]) {
  return [entry, ...entries.filter((candidate) => candidate.id !== entry.id)]
    .sort((a, b) => timelineTime(b.occurredAt) - timelineTime(a.occurredAt))
}

function removeTimelineEntry(id: string, entries: WellnessTimelineEntry[]) {
  return entries.filter((candidate) => candidate.id !== id)
}

function timelineTime(value: string) {
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : 0
}

function stringFormValue(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === "string" ? value.trim() : ""
}

function stringList(values: FormDataEntryValue[]) {
  return values.filter((value): value is string => typeof value === "string" && value.trim().length > 0).map((value) => value.trim())
}

function numberOrNull(value: string) {
  if (!value.trim()) return null
  const number = Number(value)
  return Number.isFinite(number) ? Math.min(Math.max(Math.trunc(number), 0), 10) : null
}

function durationMinutesOrNull(value: string) {
  if (!value) {
    return null
  }

  const number = Number(value)
  return Number.isFinite(number) ? Math.min(Math.max(Math.trunc(number), 0), 10080) : null
}

function parseJsonRecord(value: string) {
  if (!value) {
    return {}
  }

  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {}
  } catch {
    return {}
  }
}

function browserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York"
}

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
