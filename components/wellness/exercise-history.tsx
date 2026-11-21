"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { EXERCISE_CONTEXTS, EXERCISE_DISTANCE_UNITS, EXERCISE_KINDS, EXERCISE_SIDES, exerciseComparisonKey, exerciseMetricOptions, exerciseMetricValue, type ExerciseRecord, type ExerciseSession } from "@/lib/exercise-recording"
import styles from "./exercise-recording.module.css"

const number = (value: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 }).format(value)
const date = (value: string) => new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })

/** The same complete readback is used in history and the timeline. Missing
 * measurements are omitted, not printed as zero or inferred from other fields. */
export function ExerciseDetails({ record }: { record: ExerciseRecord }) {
  return <div className={styles.readback} data-exercise-details>
    <strong>{record.name}</strong>
    <p>{EXERCISE_KINDS[record.kind as keyof typeof EXERCISE_KINDS]} · {EXERCISE_CONTEXTS[record.context as keyof typeof EXERCISE_CONTEXTS]}{record.side !== "unspecified" ? ` · ${EXERCISE_SIDES[record.side as keyof typeof EXERCISE_SIDES]}` : ""}</p>
    {record.equipment ? <span>Equipment / support: {record.equipment}</span> : null}
    {record.loadUnit === "bodyweight" ? <span>Bodyweight</span> : record.loadUnit === "other" ? <span>Band / other resistance</span> : null}
    {record.sets.length ? <ul>{record.sets.map((row, index) => <li key={index}>Set {index + 1}: {[row.reps !== undefined ? `${number(row.reps)} reps` : "", row.weight !== undefined ? `${number(row.weight)} ${record.loadUnit}` : "", row.holdSeconds !== undefined ? `${number(row.holdSeconds)} second hold` : ""].filter(Boolean).join(" · ")}</li>)}</ul> : null}
    {record.durationMinutes !== undefined ? <span>Time: {number(record.durationMinutes)} minutes</span> : null}
    {record.distance !== undefined ? <span>Distance: {number(record.distance)} {EXERCISE_DISTANCE_UNITS[record.distanceUnit as keyof typeof EXERCISE_DISTANCE_UNITS]}</span> : null}
    {record.effort !== undefined ? <span>Effort: {record.effort}/10 · higher means more effort</span> : null}
    {record.comfort !== undefined ? <span>Comfort: {record.comfort}/10 · higher means more comfortable</span> : null}
  </div>
}

/** Compare only explicitly matching exercise identities. Units remain separate
 * metrics. This is an account-owned record view, not a training recommendation
 * or an interpretation of rehabilitation/recovery. */
export function ExerciseHistory({ sessions, selectedKey, onSelect, isSignedIn }: { sessions: ExerciseSession[]; selectedKey: string; onSelect: (key: string) => void; isSignedIn: boolean }) {
  const [chosenMetric, setChosenMetric] = useState("")
  const groups = new Map<string, ExerciseSession[]>()
  for (const session of sessions) { const key = exerciseComparisonKey(session.record); groups.set(key, [...groups.get(key) ?? [], session]) }
  const selected = groups.has(selectedKey) ? selectedKey : groups.keys().next().value ?? ""
  const current = groups.get(selected) ?? [], record = current[0]?.record
  const options = exerciseMetricOptions(current), metric = options.some((item) => item.key === chosenMetric) ? chosenMetric : options[0]?.key ?? ""
  const points = [...current.slice(0, 30)].reverse().map((session) => ({ at: session.at, value: exerciseMetricValue(session.record, metric) }))
  const measured = points.filter((point): point is { at: string; value: number } => point.value !== null)
  const latest = measured.at(-1), previous = measured.at(-2)
  return <section className={styles.history} data-exercise-history>
    <p>{isSignedIn ? "Your latest 250 saved exercise entries, plus new entries from this visit." : "Practice entries from this page session."} Compare the same exercise, side and equipment; each unit has its own chart.</p>
    {!record ? <p>Record an exercise to start a history. A name is enough; add measurements whenever they are useful.</p> : <>
      <div className="space-y-2"><Label htmlFor="exercise-history-choice">Exercise to review</Label><select id="exercise-history-choice" value={selected} onChange={(event) => onSelect(event.target.value)}>{[...groups].map(([key, rows]) => <option key={key} value={key}>{rows[0].record.name} · {EXERCISE_KINDS[rows[0].record.kind as keyof typeof EXERCISE_KINDS]} · {EXERCISE_CONTEXTS[rows[0].record.context as keyof typeof EXERCISE_CONTEXTS]}{rows[0].record.side !== "unspecified" ? ` · ${rows[0].record.side}` : ""}{rows[0].record.equipment ? ` · ${rows[0].record.equipment}` : ""}</option>)}</select></div>
      <h2 className="text-lg font-semibold">{record.name}</h2>
      <p>{current.length} {current.length === 1 ? "entry" : "entries"} · {EXERCISE_KINDS[record.kind as keyof typeof EXERCISE_KINDS]} · {EXERCISE_CONTEXTS[record.context as keyof typeof EXERCISE_CONTEXTS]}{record.side !== "unspecified" ? ` · ${EXERCISE_SIDES[record.side as keyof typeof EXERCISE_SIDES]}` : ""}{record.equipment ? ` · ${record.equipment}` : ""}</p>
      {options.length ? <>
        <div className="space-y-2"><Label htmlFor="exercise-history-metric">Measurement to compare</Label><select id="exercise-history-metric" value={metric} onChange={(event) => setChosenMetric(event.target.value)}>{options.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}</select></div>
        <ExerciseChart points={points} label={options.find((option) => option.key === metric)?.label ?? "Exercise recordings"} fixedTen={metric === "effort" || metric === "comfort"} />
        {latest ? <p data-exercise-latest>Latest recorded value: <strong>{number(latest.value)}</strong> on {date(latest.at)}{previous ? ` · Previous recorded value: ${number(previous.value)} on ${date(previous.at)}` : ""}</p> : null}
        <p>Chart: latest 30 matching entries. Gaps mean that measurement was not recorded. Values describe what you logged, without judging whether more or less is better.</p>
      </> : <p>No numeric measurements yet. Your notes and named exercises still appear below.</p>}
      <ol className="grid gap-3" aria-label="Exercise entries">{current.map((session) => <li key={session.id} className={styles.entry}>
        <p className="mb-3"><time dateTime={session.at}>{date(session.at)}</time>{!session.persisted ? " · Practice" : ""}</p>
        <ExerciseDetails record={session.record} />
        {session.summary ? <p className="mt-3 whitespace-pre-wrap break-words">{session.summary}</p> : null}
      </li>)}</ol>
    </>}
  </section>
}

/** Actual timestamps determine horizontal spacing; missing values break the
 * line. The visible readback above and entry list provide every numeric value. */
function ExerciseChart({ points, label, fixedTen }: { points: { at: string; value: number | null }[]; label: string; fixedTen: boolean }) {
  const values = points.flatMap((point) => point.value === null ? [] : [point.value])
  const max = fixedTen ? 10 : Math.max(1, Math.ceil(Math.max(0, ...values) * 1.1 * 10) / 10)
  const start = Date.parse(points[0]?.at ?? ""), end = Date.parse(points.at(-1)?.at ?? "")
  const x = (at: string) => 40 + (end === start ? 0.5 : (Date.parse(at) - start) / (end - start)) * 370
  const y = (value: number) => 170 - value / max * 140
  let path = "", continuous = false
  for (const point of points) { if (point.value === null) { continuous = false; continue } path += `${continuous ? "L" : "M"}${x(point.at)},${y(point.value)} `; continuous = true }
  return <svg viewBox="0 0 440 210" className={styles.chart} role="img" aria-label={`${label} over time`}>
    <title>{label} over time</title>
    {[0, max / 2, max].map((value) => <g key={value}><line x1="40" x2="410" y1={y(value)} y2={y(value)} /><text x="34" y={y(value)} textAnchor="end" dominantBaseline="middle">{number(value)}</text></g>)}
    <path d={path} />{points.map((point, index) => point.value === null ? null : <circle key={index} cx={x(point.at)} cy={y(point.value)} r="3" />)}
    {points.length ? <><text x="40" y="195">{new Date(points[0].at).toLocaleDateString()}</text><text x="410" y="195" textAnchor="end">{new Date(points.at(-1)!.at).toLocaleDateString()}</text></> : null}
  </svg>
}
