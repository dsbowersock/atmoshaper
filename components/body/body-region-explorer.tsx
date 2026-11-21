"use client"

import { useEffect, useLayoutEffect, useRef, useState, useCallback, type ComponentType } from "react"
import { Button } from "@/components/ui/button"
import { BODY_PARTS, BODY_SURFACES, SURFACE_VIEW_LABELS, bodyViewForNormal, toggleBodySurface } from "@/lib/body-surface-regions"
import { BODY_REGION_SELECTION_LIMIT } from "@/lib/body-regions"
import type { BodySceneProps, BodyView } from "./body-joint-scene"
import styles from "./body-joint-viewer.module.css"

/** One optional explorer, shared by all quick-log categories. Camera/focus are
 * presentation state; only explicit location choices change the form values. */
export function BodyRegionExplorer({ selectedRegions, onChange, disabled = false }: { selectedRegions: string[]; onChange: (regions: string[]) => void; disabled?: boolean }) {
  const [Scene, setScene] = useState<ComponentType<BodySceneProps> | null>(null)
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading")
  const [view, setView] = useState<BodyView>("front")
  const [focusPart, setFocusPart] = useState("")
  const [lastLocation, setLastLocation] = useState("")
  const [rotate, setRotate] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const partSelect = useRef<HTMLSelectElement>(null)
  const removeButtons = useRef(new Map<string, HTMLButtonElement>())
  const pendingFocus = useRef<string | null | undefined>(undefined)
  const ready = useCallback((value: "ready" | "failed") => setState(value), [])
  const part = BODY_PARTS.find((item) => item.id === focusPart)
  const last = BODY_SURFACES.find((item) => item.id === lastLocation)
  useEffect(() => {
    let mounted = true
    import("./body-joint-scene").then((module) => { if (mounted) setScene(() => module.default) }).catch(() => { if (mounted) setState("failed") })
    return () => { mounted = false }
  }, [])
  // Focus only after the replacement controls and their refs have committed.
  useLayoutEffect(() => {
    if (pendingFocus.current === undefined) return
    const id = pendingFocus.current
    pendingFocus.current = undefined
    const target = id ? removeButtons.current.get(id) ?? partSelect.current : partSelect.current
    target?.focus()
  }, [selectedRegions, focusPart])
  function show(next: BodyView) { setView(next); setRotate(false); setResetKey((key) => key + 1) }
  function focus(id: string, restoreFocus = false) { if (restoreFocus) pendingFocus.current = null; setFocusPart(id); setResetKey((key) => key + 1); setRotate(false) }
  function remove(id: string) {
    const index = selectedRegions.indexOf(id)
    const next = selectedRegions.filter((value) => value !== id)
    pendingFocus.current = next[index] ?? next.at(-1) ?? null
    onChange(next)
  }
  function choose(id: string, reveal = false) {
    if (disabled) return
    onChange(toggleBodySurface(selectedRegions, id, BODY_REGION_SELECTION_LIMIT))
    setLastLocation(id)
    const location = BODY_SURFACES.find((item) => item.id === id)
    if (reveal && location) show(bodyViewForNormal(location.normal) as BodyView)
  }
  const choices = (partId: string, details: boolean) => BODY_SURFACES.filter((item) => item.partId === partId && item.detail === details)
  const button = (id: string, label: string) => <Button key={id} type="button" variant={selectedRegions.includes(id) ? "default" : "secondary"} aria-pressed={selectedRegions.includes(id)} disabled={disabled || !selectedRegions.includes(id) && toggleBodySurface(selectedRegions, id) === selectedRegions} onClick={() => choose(id, true)}>{label}</Button>
  return <div className={styles.viewer} data-body-viewer data-body-mode="regions" data-body-state={state} data-body-focus={focusPart}>
    <div className={styles.toolbar} role="group" aria-label="Body view">
      {(["front", "back", "left", "right"] as const).map((value) => <Button key={value} type="button" variant={view === value ? "secondary" : "ghost"} aria-pressed={view === value} disabled={disabled} onClick={() => show(value)}>{SURFACE_VIEW_LABELS[value]}</Button>)}
      <Button type="button" variant="ghost" aria-pressed={rotate} disabled={disabled || state !== "ready"} onClick={() => setRotate(!rotate)}>{rotate ? "Lock view" : "Rotate view"}</Button>
    </div>
    <div className={styles.explorerFields}>
      <label>More views<select aria-label="More body views" value={view in SURFACE_VIEW_LABELS ? view : "front"} disabled={disabled} onChange={(event) => show(event.target.value as BodyView)}>{Object.entries(SURFACE_VIEW_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>Zoom into a body part<select ref={partSelect} aria-label="Zoom into a body part" value={focusPart} disabled={disabled} onChange={(event) => focus(event.target.value)}><option value="">Whole body</option>{BODY_PARTS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
    </div>
    {part ? <div className={styles.focusHeading}><strong>{part.label} close-up</strong><Button type="button" variant="glow" disabled={disabled} onClick={() => focus("", true)}>Whole body</Button></div> : null}
    <div className={styles.stage}>
      <span data-body-view-label className={styles.sideLabel}>{part ? part.label + " · " : ""}{SURFACE_VIEW_LABELS[view as keyof typeof SURFACE_VIEW_LABELS] ?? "Body view"}</span>
      {Scene && state !== "failed" ? <Scene area={null} side="Center" playing={false} endPose={false} regionMode selectedRegions={selectedRegions} focusPart={focusPart || undefined} disabled={disabled} view={view} rotate={rotate} resetKey={resetKey} onRegionPick={choose} onPick={() => {}} onReady={ready} onPlaybackEnd={() => {}} /> : null}
      {state !== "ready" ? <div className={styles.loadingBody} aria-hidden="true">{state === "loading" ? "Loading body…" : "Choose an area by name below"}</div> : null}
    </div>
    <p className={styles.notice}>{rotate ? "Drag to turn. Pinch or scroll to zoom." : "Tap a lit surface. Front, back, inner and outer areas are separate."} Left and right mean your own body.</p>
    {state === "failed" ? <p className={styles.notice} role="status">3D is unavailable here. All locations can still be chosen by name.</p> : null}
    {!part && last && selectedRegions.includes(last.id) ? <Button type="button" variant="glow" disabled={disabled} onClick={() => focus(last.partId, true)}>Be more specific: {last.label}</Button> : null}
    {part ? <div className={styles.refinement}>
      <p>Record a general area, a surface, or a more specific point. Refining replaces its broad selection in this draft.</p>
      <div className={styles.choices}><div>{button(part.generalId, `General area: ${part.label}`)}</div></div>
      {choices(part.id, false).map((location) => <details key={location.id} className={styles.regionGroup} data-surface-choice={location.id}><summary>{location.label}</summary><div className={styles.choices}><div>{button(location.id, `Whole area: ${location.label}`)}{choices(part.id, true).filter((item) => item.parentId === location.id).map((item) => button(item.id, item.label))}</div></div></details>)}
    </div> : <details className={styles.regionNames} open={state === "failed"}><summary>Choose regions by name</summary>{["Head and neck", "Torso", "Arms and hands", "Legs and feet"].map((group) => <details key={group} className={styles.regionGroup}><summary>{group}</summary>{BODY_PARTS.filter((item) => item.group === group).map((item) => <details key={item.id} className={styles.regionGroup} data-body-part-choice={item.id}><summary>{item.label}</summary><div className={styles.choices}><div>{button(item.generalId, `General area: ${item.label}`)}{choices(item.id, false).filter((location) => !location.focusOnly).map((location) => button(location.id, location.label))}<Button type="button" variant="glow" disabled={disabled} onClick={() => focus(item.id, true)}>More detail: {item.label}</Button></div></div></details>)}</details>)}</details>}
    <p className={styles.regionSummary} aria-live="polite">{selectedRegions.length ? `${selectedRegions.length} ${selectedRegions.length === 1 ? "area" : "areas"} selected` : "No body regions selected"}</p>
    {selectedRegions.length ? <div className={styles.selectedRegions} role="group" aria-label="Selected body regions">{selectedRegions.map((id) => <Button key={id} ref={(node) => { if (node) removeButtons.current.set(id, node); else removeButtons.current.delete(id) }} type="button" variant="glow" disabled={disabled} aria-label={`Remove ${id}`} onClick={() => remove(id)}>{id} <span aria-hidden="true">×</span></Button>)}</div> : null}
    {selectedRegions.length >= BODY_REGION_SELECTION_LIMIT ? <p role="status">Up to {BODY_REGION_SELECTION_LIMIT} areas fit in one entry. Remove an area to add another.</p> : null}
    {selectedRegions.length ? <Button type="button" variant="glow" disabled={disabled} onClick={() => { pendingFocus.current = null; onChange([]) }}>Clear selected regions</Button> : null}
  </div>
}
