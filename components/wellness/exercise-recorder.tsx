"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createExerciseDraft, exerciseComparisonKey, EXERCISE_CONTEXTS, EXERCISE_DISTANCE_UNITS, EXERCISE_KINDS, EXERCISE_LOAD_UNITS, EXERCISE_SET_LIMIT, EXERCISE_SIDES, type ExerciseDraft, type ExerciseRecord, type ExerciseSession } from "@/lib/exercise-recording"
import styles from "./exercise-recording.module.css"

/** Controlled measurements travel with the category draft, including set rows.
 * Reusing a past exercise copies identity only; every new measurement is blank. */
export function ExerciseRecorder({ draft, onChange, sessions, disabled, onHistory }: { draft: ExerciseDraft; onChange: (draft: ExerciseDraft) => void; sessions: ExerciseSession[]; disabled: boolean; onHistory: () => void }) {
  const update = <K extends keyof ExerciseDraft>(key: K, value: ExerciseDraft[K]) => onChange({ ...draft, [key]: value })
  // Sessions arrive newest first. Keep the most recent spelling and units when
  // older records share an identity, while still clearing all measurements.
  const identityMap = new Map<string, ExerciseRecord>()
  for (const session of sessions) { const key = exerciseComparisonKey(session.record); if (!identityMap.has(key)) identityMap.set(key, session.record) }
  const identities = [...identityMap.values()]
  const fresh = !draft.name && !draft.durationMinutes && !draft.distance && !draft.effort && !draft.comfort && draft.sets.every((row) => !row.reps && !row.weight && !row.holdSeconds)
  const select = (key: "kind" | "context" | "side" | "loadUnit" | "distanceUnit", label: string, options: Record<string,string>) => <div className="space-y-2"><Label htmlFor={`exercise-${key}`}>{label}</Label><select id={`exercise-${key}`} value={draft[key]} onChange={(event) => update(key, event.target.value)}>{Object.entries(options).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></div>
  const number = (key: "durationMinutes" | "distance" | "effort" | "comfort", label: string, max: number, step = "any") => <div className="space-y-2"><Label htmlFor={`exercise-${key}`}>{label}</Label><Input id={`exercise-${key}`} type="number" inputMode={step === "1" ? "numeric" : "decimal"} min="0" max={max} step={step} value={draft[key]} onChange={(event) => update(key, event.target.value)} /></div>
  return <fieldset disabled={disabled} className={styles.recorder} data-exercise-recorder>
    <legend className="sr-only">Exercise recording</legend>
    <div className="space-y-2"><Label htmlFor="exercise-name">Exercise or activity name</Label><Input id="exercise-name" maxLength={100} required value={draft.name} onChange={(event) => update("name", event.target.value)} placeholder="Walking, leg press, grip practice…" /></div>
    {fresh && identities.length ? <div className="space-y-2"><Label htmlFor="exercise-reuse">Or choose one you have logged</Label><select id="exercise-reuse" value="" onChange={(event) => { const identity = identities.find((item) => exerciseComparisonKey(item) === event.target.value); if (identity) onChange(createExerciseDraft(identity)) }}><option value="">Choose an exercise</option>{identities.map((record) => <option key={exerciseComparisonKey(record)} value={exerciseComparisonKey(record)}>{record.name} · {EXERCISE_KINDS[record.kind as keyof typeof EXERCISE_KINDS]} · {EXERCISE_CONTEXTS[record.context as keyof typeof EXERCISE_CONTEXTS]}{record.side !== "unspecified" ? ` · ${record.side}` : ""}{record.equipment ? ` · ${record.equipment}` : ""}</option>)}</select></div> : null}
    <div className={styles.columns}>{select("kind", "Exercise type", EXERCISE_KINDS)}{select("context", "Exercise context", EXERCISE_CONTEXTS)}</div>
    {draft.context !== "general" ? <p>Personal log of your existing routine, including everyday-task practice.</p> : null}

    <details open={draft.kind !== "cardio"} data-draft-section="exercise-sets"><summary>Sets, reps and resistance (optional)</summary>
      <div className="mt-3 space-y-3">{select("loadUnit", "Resistance / weight unit", EXERCISE_LOAD_UNITS)}
        <p>Reps are repetitions of a movement; each row records one set. Leave unused boxes blank.</p>
        {draft.sets.map((row, index) => <fieldset key={index} className={styles.set} data-exercise-set><legend>Set {index + 1}</legend><div className={styles.setFields}>
          {(["reps", "weight", "holdSeconds"] as const).map((key) => <div key={key} hidden={key === "weight" && !["lb", "kg"].includes(draft.loadUnit)} className="space-y-2"><Label htmlFor={`exercise-set-${index}-${key}`}>{key === "reps" ? "Reps" : key === "weight" ? `Weight (${draft.loadUnit})` : "Hold (seconds)"}</Label><Input id={`exercise-set-${index}-${key}`} type="number" min="0" max={key === "reps" ? 10000 : key === "weight" ? 5000 : 86400} step={key === "reps" ? "1" : "any"} inputMode={key === "reps" ? "numeric" : "decimal"} value={row[key]} onChange={(event) => update("sets", draft.sets.map((set, position) => position === index ? { ...set, [key]: event.target.value } : set))} /></div>)}
        </div><Button type="button" variant="ghost" aria-label={`Remove set ${index + 1}`} onClick={() => update("sets", draft.sets.filter((_, position) => position !== index))}>Remove set</Button></fieldset>)}
        <Button type="button" variant="glow" disabled={disabled || draft.sets.length >= EXERCISE_SET_LIMIT} onClick={() => update("sets", [...draft.sets, { reps: "", weight: "", holdSeconds: "" }])}>+ Add set</Button>
        {draft.sets.length >= EXERCISE_SET_LIMIT ? <p role="status">Up to {EXERCISE_SET_LIMIT} sets fit in one entry.</p> : null}
      </div>
    </details>

    <details open={draft.kind === "cardio"} data-draft-section="exercise-time"><summary>Time and distance (optional)</summary><div className={`${styles.columns} mt-3`}>{number("durationMinutes", "Exercise time (minutes)", 10080)}{number("distance", "Distance", 100000)}{select("distanceUnit", "Distance unit", EXERCISE_DISTANCE_UNITS)}</div></details>
    <details data-draft-section="exercise-extra"><summary>Equipment, side and how it felt (optional)</summary><div className="mt-3 grid gap-4">
      <div className="space-y-2"><Label htmlFor="exercise-equipment">Equipment, resistance or support used</Label><Input id="exercise-equipment" maxLength={160} value={draft.equipment} onChange={(event) => update("equipment", event.target.value)} placeholder="Light band, bodyweight, chair support, putty…" /></div>
      {select("side", "Side", EXERCISE_SIDES)}
      <div className={styles.columns}>{number("effort", "Effort (0–10)", 10, "1")}{number("comfort", "Comfort (0–10)", 10, "1")}</div>
      <p>Effort: 0 = no effort, 10 = maximum effort. Comfort: 0 = completely uncomfortable, 10 = completely comfortable.</p>
    </div></details>
    {sessions.length ? <Button type="button" variant="glow" onClick={onHistory} disabled={disabled}>View exercise progress</Button> : null}
    <input type="hidden" name="exerciseRecord" value={JSON.stringify(draft)} />
  </fieldset>
}
