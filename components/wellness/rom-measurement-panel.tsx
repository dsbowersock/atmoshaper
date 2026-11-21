"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { unstable_rethrow } from "next/navigation"
import { ArrowLeft, ArrowRight, Gauge, RotateCcw, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { BodyJointViewer } from "@/components/body/body-joint-viewer"
import { type MeasurementAxis, useDeviceMotionSensors } from "@/hooks/use-device-motion-sensors"
import { calculateRomAngleDelta } from "@/lib/client-wellness"
import { ROM_AREAS, ROM_MOVEMENTS, MOVEMENT_PARTS, parseRomAngles, romMeasurementContext } from "@/lib/rom-movements"
import { parseMovementComfort, type MovementComfortReference } from "@/lib/movement-comfort"
import styles from "./rom-measurement-panel.module.css"

export type RomMeasurementDraft = {
  movement: string; side: string; axis: MeasurementAxis; baselineAngle: number
  endAngle: number; changeDegrees: number; source: "device-orientation" | "manual"; note: string
}
export type MovementRecordingDraft = Pick<RomMeasurementDraft, "movement" | "side" | "source" | "note"> & Partial<Pick<RomMeasurementDraft, "axis" | "baselineAngle" | "endAngle" | "changeDegrees">> & { comfortScore?: number }
type DeviceBaseline = { context: string; value: number }

/** Guided UI retains the existing payload and save owner. The illustration
 * never supplies a measured angle; parent success/failure stays authoritative. */
export function RomMeasurementPanel({ isSignedIn, disabled, onMeasurement, active = true, privacyControl, focus = "range", comfortReferences = [] }: {
  isSignedIn: boolean; disabled: boolean; active?: boolean; privacyControl?: ReactNode
  focus?: "range" | "comfort"; comfortReferences?: MovementComfortReference[]
  onMeasurement: (draft: MovementRecordingDraft) => void | Promise<unknown>
}) {
  const [step, setStep] = useState(0)
  const [area, setArea] = useState<string | null>(null)
  const [part, setPart] = useState("all")
  const [side, setSide] = useState("Left")
  const [movementId, setMovementId] = useState("")
  const [choosingMovement, setChoosingMovement] = useState(true)
  const [customMovement, setCustomMovement] = useState("")
  const [mode, setMode] = useState<"manual" | "phone">("manual")
  const [axis, setAxis] = useState<MeasurementAxis>("beta")
  const [manualStart, setManualStart] = useState("0")
  const [manualEnd, setManualEnd] = useState("")
  const [note, setNote] = useState("")
  const [baseline, setBaseline] = useState<DeviceBaseline | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [comfort, setComfort] = useState("")
  const [addOther, setAddOther] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const previousStep = useRef(step)
  const includeRange = focus === "range" || addOther
  const includeComfort = focus === "comfort" || addOther
  const idPrefix = focus === "range" ? "rom" : "movementComfort"
  const parts = area === "hand" ? MOVEMENT_PARTS.hand : area === "toes" ? MOVEMENT_PARTS.toes : []
  const { orientation, requestAccess, state, message: sensorMessage } = useDeviceMotionSensors(active && includeRange && mode === "phone" && step === 2)
  const movement = ROM_MOVEMENTS.find((item) => item.id === movementId && item.area === area)
  const areaInfo = ROM_AREAS.find((item) => item.id === area)
  const movementName = movementId === "custom" ? customMovement.trim() : movement?.name ?? ""
  const selectionContext = JSON.stringify([movementName, side])
  const previousComfort = comfortReferences.find((item) => item.movement === movementName.toLowerCase() && item.side === side)
  const context = romMeasurementContext(movementName, side, axis)
  const currentAngle = orientation[axis]
  const usableBaseline = baseline?.context === context ? baseline : null
  const deviceChange = usableBaseline && currentAngle !== null ? calculateRomAngleDelta(axis, currentAngle, usableBaseline.value) : null
  const pending = disabled || saving
  const sidesNeeded = areaInfo?.paired || movement?.mirror || movementId === "custom"
  useEffect(() => { if (step !== previousStep.current) { previousStep.current = step; heading.current?.focus() } }, [step])
  useEffect(() => { setBaseline(null) }, [context, mode, active, step])
  // A starting reading belongs to the same movement/side/axis as its ending
  // reading. Ordinary save failures do not change this context or erase either.
  useEffect(() => { setManualStart("0"); setManualEnd("") }, [context])
  useEffect(() => { setComfort("") }, [selectionContext])
  useEffect(() => { if (step === 1 && movementId) heading.current?.focus() }, [movementId, step])

  function pickArea(next: string, nextSide: string) {
    if (pending) return
    if (next !== area) { setMovementId(""); setManualEnd(""); setPart("all"); setChoosingMovement(true) }
    const centerMovement = movement?.area === next && !ROM_AREAS.find((item) => item.id === next)?.paired && !movement.mirror
    setArea(next); setSide(centerMovement ? "Center" : nextSide === "Center" ? "Left" : nextSide); setBaseline(null); setMessage(null)
  }
  function chooseMovement(id: string) {
    setMovementId(id); setChoosingMovement(false); setManualEnd(""); setBaseline(null); setMessage(null)
    const next = ROM_MOVEMENTS.find((item) => item.id === id)
    if (next && !areaInfo?.paired && !next.mirror) setSide("Center")
    else if (side === "Center" && (id !== "custom" || areaInfo?.paired)) setSide("Left")
  }
  function captureBaseline() {
    if (currentAngle === null || state !== "active") { setMessage("Wait for a phone reading, or choose manual entry."); return }
    setBaseline({ context, value: currentAngle }); setMessage(null)
  }
  async function save() {
    if (pending) return
    if (!movementName) { setMessage("Choose a movement or enter its name before recording."); return }
    const score = includeComfort ? parseMovementComfort(comfort) : null
    if (includeComfort && comfort !== "" && score === null) { setMessage("Choose a comfort rating from 0 to 10."); return }
    const hasRangeInput = includeRange && (mode === "manual" ? manualEnd.trim() !== "" || manualStart !== "0" : usableBaseline !== null)
    const manual = hasRangeInput && mode === "manual" ? parseRomAngles(manualStart, manualEnd) : null
    if (hasRangeInput && mode === "manual" && !manual) { setMessage("Enter both angles as numbers between -360 and 360 degrees."); return }
    if (hasRangeInput && mode === "phone" && (!usableBaseline || currentAngle === null || deviceChange === null || state !== "active")) { setMessage("Capture a starting reading for this movement and side first."); return }
    if (!hasRangeInput && score === null) { setMessage(focus === "range" ? mode === "phone" ? "Capture a starting reading for this movement and side first." : "Enter both angles, or optionally add a comfort rating instead." : "Choose a comfort rating, or optionally add an angle measurement instead."); return }
    const measurement = hasRangeInput ? manual ?? { baselineAngle: usableBaseline!.value, endAngle: currentAngle! } : null
    setSaving(true); setMessage(null)
    try {
      const measurementAxis = mode === "manual" ? "beta" : axis
      await onMeasurement({ movement: movementName, side, ...(measurement ? { axis: measurementAxis, ...measurement, changeDegrees: calculateRomAngleDelta(measurementAxis, measurement.endAngle, measurement.baselineAngle) } : {}), ...(score !== null ? { comfortScore: score } : {}), source: measurement && mode === "phone" ? "device-orientation" : "manual", note: note.trim() })
      // Retain values even when the parent returns a structured failure rather
      // than throwing, or requires its existing privacy acknowledgement.
    } catch (error) { unstable_rethrow(error); setMessage("The measurement could not be saved. Your entries are still here; try again.") }
    finally { setSaving(false) }
  }

  const comfortFields = <div className={styles.comfort}>
    <Label htmlFor={`${idPrefix}ComfortScore`}>How comfortable did this movement feel?</Label>
    <select id={`${idPrefix}ComfortScore`} value={comfort} disabled={pending} onChange={(event) => setComfort(event.target.value)} aria-describedby={`${idPrefix}ComfortHelp`}>
      <option value="">Choose a rating</option>{Array.from({ length: 11 }, (_, value) => <option key={value} value={value}>{value}{value === 0 ? " — Not comfortable at all" : value === 10 ? " — Completely comfortable" : ""}</option>)}
    </select>
    <div className={styles.scaleEnds} id={`${idPrefix}ComfortHelp`}><span>0 · Not comfortable at all</span><span>10 · Completely comfortable</span></div>
    <p>Rate only the movement you just tried. Use a similar position and effort when comparing another day.</p>
    {previousComfort ? <p className={styles.previous}>Your last rating for this movement and side: <strong>{previousComfort.latestScore}/10</strong> · {new Date(previousComfort.latestAt).toLocaleDateString()}</p> : null}
  </div>
  const optionalRecording = <label className={styles.optional}><input type="checkbox" checked={addOther} disabled={pending} onChange={(event) => { setAddOther(event.target.checked); if (focus === "comfort") setBaseline(null) }} />{focus === "comfort" ? "Add an angle measurement (optional)" : "Add a comfort rating (optional)"}</label>

  return <section className={styles.recorder} data-rom-recorder data-recording-focus={focus}>
    <nav className={styles.steps} aria-label="Measurement steps">
      {["Body area", "Movement", "Record"].map((label, index) => <button key={label} type="button" aria-current={step === index ? "step" : undefined} disabled={pending || index > 0 && !area || index > 1 && !movementName} onClick={() => { setStep(index); setMessage(null) }}><span>{index + 1}</span>{label}</button>)}
    </nav>
    <div className={styles.stepHeading}><h3 ref={heading} tabIndex={-1}>{step === 0 ? "Where would you like to record?" : step === 1 ? `How are you moving your ${area === "back" ? "trunk" : area === "elbow" ? "elbow" : areaInfo?.label.toLowerCase()}?` : "Record your movement"}</h3>
      <p>{step === 0 ? "Tap a joint on the body, or choose its name below." : step === 1 ? "Choose the everyday description that fits. You can preview its direction." : focus === "comfort" ? "Record how this movement felt. An angle is optional." : "Record an angle. A comfort rating is optional."}</p></div>
    {step === 0 ? <>
      {active ? <BodyJointViewer area={area} side={side} onPick={pickArea} /> : null}
      {area ? <p className={styles.selection}>Selected: <strong>{areaInfo?.label}{areaInfo?.paired ? ` · ${side.toLowerCase()}` : ""}</strong></p> : null}
      {areaInfo?.paired ? <SideChoices side={side} disabled={pending} onChange={(value) => { setSide(value); setBaseline(null) }} /> : null}
    </> : null}
    {step === 1 ? <div className={styles.movementLayout}>
      {parts.length ? <div className={styles.field}><Label htmlFor={`${idPrefix}Part`}>{area === "hand" ? "Which part of your hand?" : "Which toes?"}</Label><select id={`${idPrefix}Part`} value={part} disabled={pending} onChange={(event) => { setPart(event.target.value); setMovementId(""); setChoosingMovement(true) }}>{parts.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div> : null}
      {!movement || choosingMovement ? <fieldset className={styles.movements}><legend className="sr-only">Movement choices</legend>
        {ROM_MOVEMENTS.filter((item) => item.area === area && (!item.part || item.part === part)).map((item) => <Button key={item.id} type="button" variant={movementId === item.id ? "default" : "secondary"} aria-pressed={movementId === item.id} disabled={pending} onClick={() => chooseMovement(item.id)}>{item.label}</Button>)}
        <Button type="button" variant="glow" aria-pressed={movementId === "custom"} disabled={pending} onClick={() => chooseMovement("custom")}>Other movement</Button>
        {movementId === "custom" ? <><div className={styles.field}><Label htmlFor={`${idPrefix}Movement`}>Movement name</Label><Input id={`${idPrefix}Movement`} maxLength={120} value={customMovement} onChange={(event) => setCustomMovement(event.target.value)} placeholder="Use the name given by your clinician" /><p>Use this for a movement or method your clinician has already shown you.</p></div><SideChoices side={side} disabled={pending} allowCenter={!areaInfo?.paired} onChange={setSide} /></> : null}
      </fieldset> : null}
      {movement && !choosingMovement ? <div className={styles.demonstration}>
        <Button type="button" variant="glow" onClick={() => setChoosingMovement(true)}>Choose a different movement</Button>
        <h4>{movement.label}</h4><p>{movement.cue}</p>
        <details className={styles.help}><summary>Technical name</summary><p>{movement.name}</p></details>
        {sidesNeeded ? <SideChoices side={side} disabled={pending} onChange={(value) => { setSide(value); setBaseline(null) }} /> : null}
        {active ? <BodyJointViewer key={movement.id} area={area} side={side} movement={movement} onPick={pickArea} /> : null}
      </div> : null}
    </div> : null}
    {step === 2 ? <div className={styles.recordFields}>
      <div className={styles.summary}><strong>{movement?.label || movementName}</strong><span>{areaInfo?.label}{side !== "Center" ? ` · ${side.toLowerCase()}` : ""}</span><Button type="button" variant="ghost" disabled={pending} onClick={() => { setChoosingMovement(true); setStep(1) }}>Change movement</Button></div>
      {privacyControl}
      {focus === "comfort" ? comfortFields : null}
      {focus === "comfort" ? optionalRecording : null}
      {includeRange ? <div className={styles.rangeFields}>
      <div className={styles.modeChoices} role="group" aria-label="Measurement method"><Button type="button" variant={mode === "manual" ? "default" : "secondary"} aria-pressed={mode === "manual"} disabled={pending} onClick={() => setMode("manual")}>Enter angles</Button><Button type="button" variant={mode === "phone" ? "default" : "secondary"} aria-pressed={mode === "phone"} disabled={pending} onClick={() => setMode("phone")}>Use phone readings</Button></div>
      {mode === "manual" ? <>
        <p className={styles.explanation}>Enter readings from your goniometer or angle finder. Use the same position and method when comparing entries.</p>
        <div className={styles.angleFields}><div className={styles.field}><Label htmlFor={`${idPrefix}ManualStart`}>Starting angle (°)</Label><Input id={`${idPrefix}ManualStart`} inputMode="decimal" type="number" min={-360} max={360} step="0.1" value={manualStart} onChange={(event) => setManualStart(event.target.value)} /></div><div className={styles.field}><Label htmlFor={`${idPrefix}ManualEnd`}>Ending angle (°)</Label><Input id={`${idPrefix}ManualEnd`} inputMode="decimal" type="number" min={-360} max={360} step="0.1" value={manualEnd} onChange={(event) => setManualEnd(event.target.value)} placeholder="Enter your reading" /></div></div>
        {parseRomAngles(manualStart, manualEnd) ? <output className={styles.readout}>Change <strong>{calculateRomAngleDelta("beta", Number(manualEnd), Number(manualStart))}°</strong></output> : null}
      </> : <>
        <p className={styles.explanation}>This records how the phone turns, not an automatic joint angle. Keep phone placement, grip and body position consistent. Use a clinician-shown setup for repeat measurements.</p>
        <Button type="button" variant="secondary" disabled={pending || state === "active"} onClick={async () => { await requestAccess(); setBaseline(null) }}>{state === "active" ? "Phone readings enabled" : "Enable phone readings"}</Button>
        <p className={styles.explanation}>{sensorMessage} Manual entry remains available.</p>
        <div className={styles.field}><Label htmlFor={`${idPrefix}Axis`}>Which phone direction are you tracking?</Label><select id={`${idPrefix}Axis`} value={axis} onChange={(event) => { setAxis(event.target.value as MeasurementAxis); setBaseline(null) }}><option value="beta">Front/back tilt</option><option value="gamma">Left/right tilt</option><option value="alpha">Rotation around the phone</option></select><p>Choose the reading that changes with your setup. The illustration does not choose a sensor axis.</p></div>
        <dl className={styles.readings}><RomStatus label="Phone now" value={currentAngle === null ? "Waiting" : `${currentAngle}°`} /><RomStatus label="Starting reading" value={usableBaseline ? `${usableBaseline.value}°` : "Not set"} /><RomStatus label="Change" value={deviceChange === null ? "—" : `${deviceChange}°`} /></dl>
        <div className={styles.actions}><Button type="button" variant="secondary" onClick={captureBaseline} disabled={pending || currentAngle === null}><Gauge aria-hidden="true" />Capture starting reading</Button><Button type="button" variant="ghost" onClick={() => setBaseline(null)} disabled={pending || !usableBaseline}><RotateCcw aria-hidden="true" />Reset reading</Button></div>
      </>}
      </div> : null}
      {focus === "range" ? optionalRecording : null}
      {focus === "range" && addOther ? comfortFields : null}
      <div className={styles.field}><Label htmlFor={`${idPrefix}Note`}>Notes (optional)</Label><Textarea id={`${idPrefix}Note`} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Position, equipment or anything to repeat next time" /></div>
      <Button type="button" variant="default" className={styles.save} disabled={pending} onClick={save}><Save aria-hidden="true" />{pending ? "Saving…" : focus === "comfort" ? isSignedIn ? "Save movement check-in" : "Add practice check-in" : isSignedIn ? "Save measurement" : "Add practice measurement"}</Button>
    </div> : null}
    {message ? <p className={styles.error} role="alert">{message}</p> : null}
    <div className={styles.actions}>
      {step > 0 ? <Button type="button" variant="glow" disabled={pending} onClick={() => { setStep(step - 1); setMessage(null) }}><ArrowLeft aria-hidden="true" />Back</Button> : <span />}
      {step < 2 ? <Button type="button" variant="default" disabled={pending || (step === 0 ? !area : !movementName)} onClick={() => setStep(step + 1)}>{step === 0 ? "Choose movement" : "Record this movement"}<ArrowRight aria-hidden="true" /></Button> : null}
    </div>
    <p className={styles.caution}>Move gently within a comfortable range. Stop if it hurts or makes you dizzy. Follow your clinician’s restrictions after injury or surgery. This is self-tracking, not a diagnosis or calibrated medical measurement.</p>
    <details className={styles.help}><summary>Sources and movement guidance</summary><p>The body shows direction. Its pose is not a recommended range or a measurement method.</p><a href="https://www.innerscene.com/tools/library/3d-parts/human-base-mesh-with-editable-53-bone-rig-8e7c8ab1" target="_blank" rel="noreferrer">Body model: Innerscene / MakeHuman (CC0, free)</a><a href="https://www.ada.org/-/media/project/ada-organization/ada/ada-org/files/resources/practice/health-and-wellness/ada_ergo_stretches.pdf" target="_blank" rel="noreferrer">Movement reference: American Dental Association</a><a href="https://www.orthoinfo.org/bodypart/shoulder/rotator-cuff-and-shoulder-conditioning-program/" target="_blank" rel="noreferrer">AAOS: movement and safety guidance</a></details>
  </section>
}

function SideChoices({ side, onChange, disabled, allowCenter = false }: { side: string; onChange: (value: string) => void; disabled: boolean; allowCenter?: boolean }) {
  return <fieldset className={styles.side}><legend>Which side of your body?</legend><div>{["Left", "Right", ...(allowCenter ? ["Center"] : [])].map((value) => <Button key={value} type="button" variant={side === value ? "default" : "secondary"} aria-pressed={side === value} disabled={disabled} onClick={() => onChange(value)}>{value}</Button>)}</div><p>Left and right refer to your body, even when it faces you.</p></fieldset>
}
function RomStatus({ label, value }: { label: string; value: string }) { return <div><dt>{label}</dt><dd>{value}</dd></div> }
