"use client"

import { useCallback, useEffect, useState, type ComponentType } from "react"
import { Pause, Play, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ROM_AREAS, type RomMovement } from "@/lib/rom-movements"
import type { BodySceneProps, BodyView } from "./body-joint-scene"
import { BodyRegionExplorer } from "./body-region-explorer"
import styles from "./body-joint-viewer.module.css"

type JointProps = { mode?: "joints"; area: string | null; side: string; movement?: RomMovement; onPick: (area: string, side: string) => void; disabled?: boolean }
type BodyViewerProps = JointProps | { mode: "regions"; selectedRegions: string[]; onChange: (regions: string[]) => void; disabled?: boolean }

/** Keep the joint guide's public API stable while surface exploration owns its
 * own camera, refinement and fallback state. Only the active child owns WebGL. */
export function BodyJointViewer(props: BodyViewerProps) {
  return props.mode === "regions" ? <BodyRegionExplorer selectedRegions={props.selectedRegions} onChange={props.onChange} disabled={props.disabled} /> : <JointBodyGuide {...props} />
}

/** Established joint/movement behavior, independent of optional surface detail. */
function JointBodyGuide({ area, side, movement, onPick, disabled = false }: JointProps) {
  const [Scene, setScene] = useState<ComponentType<BodySceneProps> | null>(null)
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading")
  const [view, setView] = useState<BodyView>("front")
  const [rotate, setRotate] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [endPose, setEndPose] = useState(false)
  const [reduced, setReduced] = useState(false)
  const ready = useCallback((value: "ready" | "failed") => setState(value), [])
  const stop = useCallback(() => setPlaying(false), [])
  useEffect(() => {
    let mounted = true
    import("./body-joint-scene").then((module) => { if (mounted) setScene(() => module.default) }).catch(() => { if (mounted) setState("failed") })
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)")
    const changed = () => { setReduced(preference.matches); if (preference.matches) setPlaying(false) }
    changed(); preference.addEventListener("change", changed)
    return () => { mounted = false; preference.removeEventListener("change", changed) }
  }, [])
  useEffect(() => { setPlaying(false); setEndPose(false); setView(movement?.view ?? "front"); setResetKey((key) => key + 1) }, [movement, side])
  return <div className={styles.viewer} data-body-viewer data-body-state={state} data-body-mode="joints">
    <div className={styles.toolbar} role="group" aria-label="Body view">
      {(["front", "back", "side", "angled"] as const).map((value) => <Button key={value} type="button" variant={view === value ? "secondary" : "ghost"} aria-pressed={view === value} disabled={disabled} onClick={() => { setView(value); setResetKey((key) => key + 1) }}>{value === "front" ? "Front" : value === "back" ? "Back" : value === "side" ? "Side view" : "Angle view"}</Button>)}
      <Button type="button" variant="ghost" aria-pressed={rotate} onClick={() => setRotate(!rotate)} disabled={disabled || state !== "ready"}>{rotate ? "Lock view" : "Rotate view"}</Button>
    </div>
    <div className={styles.stage}>
      {state !== "ready" ? <BodySilhouette /> : null}
      {Scene && state !== "failed" ? <Scene area={area} side={side} movement={movement} playing={playing && !reduced} endPose={endPose} view={view} rotate={rotate} resetKey={resetKey} disabled={disabled} onPick={onPick} onReady={ready} onPlaybackEnd={stop} /> : null}
      <span className={styles.viewHint}>{state === "loading" ? "Loading 3D body…" : state === "failed" ? "Use the named choices below" : rotate ? "Drag to turn • pinch to zoom" : movement?.demo === false ? "Body location reference" : movement ? "Illustrative movement" : "Tap a lit joint"}</span>
    </div>
    {state === "failed" ? <p className={styles.notice} role="status">3D is unavailable here. Choose a body area below and follow the written movement guide.</p> : null}
    {movement?.demo === false ? <p className={styles.notice} role="status">A separate animation for this toe movement is not available in this model. Follow the written cue; you can still record comfort or an angle.</p> : movement ? <>
      <div className={styles.playback} role="group" aria-label="Movement demonstration">
        {!reduced ? <Button type="button" variant="secondary" disabled={state !== "ready" || disabled} onClick={() => { setEndPose(false); setPlaying(!playing) }}>{playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}{playing ? "Pause movement" : "Play movement"}</Button> : null}
        <Button type="button" variant="glow" disabled={state !== "ready" || disabled} aria-pressed={endPose} onClick={() => { setPlaying(false); setEndPose(!endPose) }}>{endPose ? "Show starting position" : "Show movement position"}</Button>
        <Button type="button" variant="ghost" aria-label="Reset movement view" disabled={disabled} onClick={() => { setPlaying(false); setEndPose(false); setView(movement.view ?? "front"); setRotate(false); setResetKey((key) => key + 1) }}><RotateCcw aria-hidden="true" /></Button>
      </div>
      <p className={styles.notice}>{reduced ? "Reduced motion: use the two still positions. " : ""}The model shows direction only. Its angle is not a target or your measurement.</p>
    </> : <fieldset className={styles.choices}><legend>Or choose a body area</legend><div>{ROM_AREAS.map((item) => <Button key={item.id} type="button" variant={area === item.id ? "default" : "secondary"} aria-pressed={area === item.id} disabled={disabled} onClick={() => onPick(item.id, side === "Center" ? "Left" : side)}>{item.label}</Button>)}</div></fieldset>}
  </div>
}

/** Original lightweight fallback artwork, independent of the model download. */
function BodySilhouette() {
  return <svg className={styles.silhouette} viewBox="0 0 220 350" aria-hidden="true"><defs><linearGradient id="body-fallback-fill" x2="1" y2="1"><stop stopColor="#80dbf4" /><stop offset="1" stopColor="#1767aa" /></linearGradient></defs><g fill="url(#body-fallback-fill)" stroke="#7fd7f1" strokeWidth="1.5"><ellipse cx="110" cy="32" rx="18" ry="24" /><path d="M101 54L100 65Q75 66 67 85L41 157L31 187L39 191L53 164L78 112L83 182L81 211L87 319L99 331L108 327L106 216L114 216L112 327L122 331L134 319L139 211L137 182L142 112L167 164L181 191L189 187L179 157L153 85Q145 66 120 65L119 54Z" /></g><g fill="#b9f5ff">{[[110,65],[77,84],[143,84],[58,137],[162,137],[43,172],[177,172],[110,159],[93,204],[127,204],[94,263],[126,263],[97,316],[123,316]].map(([cx,cy],index) => <circle key={index} cx={cx} cy={cy} r="3" />)}</g></svg>
}
