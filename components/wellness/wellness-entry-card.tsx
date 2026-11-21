"use client"
import { Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ROM_MOVEMENTS } from "@/lib/rom-movements"
import { MOVEMENT_COMFORT_SCALE, parseMovementComfort } from "@/lib/movement-comfort"
import { reflectionWords, normalizeContextCheckIn } from "@/lib/wellness-reflection"
import { validateExerciseRecord } from "@/lib/exercise-recording"
import { WELLNESS_CATEGORY_LABELS } from "@/lib/wellness-catalog"
import { cn } from "@/lib/utils"
import { ExerciseDetails } from "./exercise-history"
import type { WellnessTimelineEntry } from "./wellness-hub-client"
const contextReflectionLabels: Record<string, string> = { activity: "Activity", posture: "Position or posture", repetition: "Repetition or time", surroundings: "Surroundings", noticed: "What you noticed", careAction: "Self-care action", careEffect: "Afterward", prompts: "Chosen prompts" }
/** One private readback for the timeline and personal calendar. Calendar callers
 * use readOnly so a recording cannot become an editable scheduling event. */
export function WellnessEntryCard({
  entry,
  confirmDelete,
  disabled,
  onDelete,
  readOnly = false,
}: {
  entry: WellnessTimelineEntry
  confirmDelete?: boolean
  disabled?: boolean
  onDelete?: () => void
  readOnly?: boolean
}) {
  const changeDegrees = typeof entry.metadata.changeDegrees === "number" ? entry.metadata.changeDegrees : null
  const comfortScore = entry.metadata.comfortScale === MOVEMENT_COMFORT_SCALE ? parseMovementComfort(entry.metadata.comfortScore) : null
  const romMovement = stringMetadata(entry.metadata.movement)
  const romSide = stringMetadata(entry.metadata.side)
  const romLabel = ROM_MOVEMENTS.find((movement) => movement.name === romMovement)?.label ?? romMovement
  const durationMinutes = numberMetadata(entry.metadata.durationMinutes)
  const bodyPosition = stringMetadata(entry.metadata.bodyPosition)
  const activityContext = stringMetadata(entry.metadata.activityContext)
  const movementEffect = stringMetadata(entry.metadata.movementEffect)
  const feelingWords = reflectionWords(entry.metadata.feelingWords)
  const contextCheckIn = normalizeContextCheckIn(entry.category, entry.metadata.contextCheckIn)
  const exercise = entry.category === "exercise" ? validateExerciseRecord(entry.metadata.exerciseRecord).record : null

  return (
    <div className="rounded-md border border-border/80 bg-background/80 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{entry.category === "rom" && comfortScore !== null ? changeDegrees === null ? "Movement comfort" : "Movement & range" : WELLNESS_CATEGORY_LABELS[entry.category as keyof typeof WELLNESS_CATEGORY_LABELS] ?? entry.category}</p>
            {!entry.persisted ? <Badge variant="outline">Practice</Badge> : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(entry.occurredAt)}</p>
        </div>
        {!readOnly && onDelete ? <Button type="button" variant={confirmDelete ? "destructive" : "ghost"} size="icon" onClick={onDelete} disabled={disabled} aria-label={confirmDelete ? "Confirm delete entry" : "Delete entry"}>
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button> : null}
      </div>
      {entry.summary ? <p className="mt-3 text-sm">{entry.summary}</p> : null}
      {exercise ? <div className="mt-3"><ExerciseDetails record={exercise} /></div> : null}
      {entry.category === "rom" && romMovement ? <div className="mt-3 text-sm"><p>{romLabel}{romSide && romSide !== "Center" ? ` · ${romSide.toLowerCase()}` : ""}</p>{romLabel !== romMovement ? <p className="mt-1 text-xs text-muted-foreground">{romMovement}</p> : null}</div> : null}
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        {entry.category !== "exercise" && entry.intensity !== null ? <span>Intensity {entry.intensity}/10</span> : null}
        {changeDegrees !== null ? <span>ROM {changeDegrees} deg</span> : null}
        {entry.category === "rom" && comfortScore !== null ? <span>Comfort {comfortScore}/10 · higher means more comfortable</span> : null}
        {durationMinutes !== null ? <span>{formatDuration(durationMinutes)}</span> : null}
        {bodyPosition ? <span>{bodyPosition}</span> : null}
        {movementEffect ? <span>Movement {movementEffect}</span> : null}
        {activityContext ? <span>{activityContext}</span> : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {entry.regions.slice(0, 5).map((region) => <TimelineChip key={`region-${region}`} label={region} />)}
        {entry.sensations.slice(0, 5).map((sensation) => <TimelineChip key={`sensation-${sensation}`} label={sensation} />)}
        {feelingWords.map((word) => <TimelineChip key={`feeling-${word}`} label={word} />)}
        {entry.contexts.slice(0, 4).map((context) => <TimelineChip key={`context-${context}`} label={context} muted />)}
      </div>
      {entry.regions.length > 5 ? <details className="mt-2 text-xs"><summary className="min-h-10 cursor-pointer content-center">More body regions ({entry.regions.length - 5})</summary><div className="mt-2 flex flex-wrap gap-2">{entry.regions.slice(5).map((region) => <TimelineChip key={`region-more-${region}`} label={region} />)}</div></details> : null}
      {contextCheckIn ? <details className="mt-3 text-sm"><summary className="min-h-11 cursor-pointer content-center">{entry.category === "home_care" ? "Home and self-care details" : "Work situation details"}</summary><dl className="mt-2 grid gap-3">{Object.entries(contextCheckIn).map(([key, value]) => <div key={key}><dt className="font-medium">{contextReflectionLabels[key] ?? key}</dt><dd className="whitespace-pre-wrap break-words">{Array.isArray(value) ? value.join(", ") : String(value)}</dd></div>)}</dl></details> : null}
      {confirmDelete ? <p className="mt-2 text-xs text-destructive">Select delete again to remove this saved entry.</p> : null}
    </div>
  )
}

function TimelineChip({ label, muted = false }: { label: string; muted?: boolean }) {
  return (
    <span className={cn(
      "rounded-md border px-2 py-1 text-xs",
      muted ? "border-border/80 bg-muted/60 text-muted-foreground" : "border-primary/20 bg-primary/10 text-foreground",
    )}>
      {label}
    </span>
  )
}


function numberMetadata(value: unknown) { return typeof value === "number" && Number.isFinite(value) ? value : null }
function stringMetadata(value: unknown) { return typeof value === "string" && value.trim() ? value : "" }
function formatDateTime(value: string) { const date = new Date(value); return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date) : "Unknown time" }
function formatDuration(minutes: number) { if (minutes < 60) return `${minutes} min`; const hours = Math.floor(minutes / 60), rest = minutes % 60; return rest > 0 ? `${hours} hr ${rest} min` : `${hours} hr` }
