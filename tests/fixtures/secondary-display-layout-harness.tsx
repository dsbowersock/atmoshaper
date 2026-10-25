import React, { useRef, useState } from "react"
import { createRoot } from "react-dom/client"
import { ImmersivePanelShell } from "../../app/chimer/immersive-panel-shell"
import timer from "../../app/chimer/running-timer.module.css"
import { getChimerClockFontMetrics } from "../../lib/chimer-clock-font-metrics"
import "./secondary-display-layout-harness.css"

declare global {
  interface Window {
    secondaryFixture: {
      setClockPrimary: (value: boolean) => void
      setCompactTimer: (value: boolean) => void
      setShowSecondary: (value: boolean) => void
      setChrome: (value: "visible" | "faded" | "hidden") => void
      setFont: (value: string) => void
    }
    unmountSecondaryFixture: () => void
  }
}

/** Real shell/stylesheet geometry with inert display text and no app/provider owners. */
function Fixture() {
  const [clockPrimary, setClockPrimary] = useState(false)
  const [compactTimer, setCompactTimer] = useState(false)
  const [showSecondary, setShowSecondary] = useState(true)
  const [chrome, setChrome] = useState<"visible" | "faded" | "hidden">("visible")
  const [panel, setPanel] = useState<"clock" | "visual" | "background" | null>(null)
  const [font, setFont] = useState('"Digital", monospace')
  const protectedDisplayRef = useRef<HTMLSpanElement | null>(null)
  Object.assign(window, { secondaryFixture: { setCompactTimer, setClockPrimary, setShowSecondary, setChrome, setFont } })
  // Match the production conditional classes so geometry tests cover both timer overrides.
  const primaryClass = `${timer.displayButton} ${timer.primaryDisplay} ${clockPrimary ? timer.timerModeClockPrimary : compactTimer ? timer.timerModeCompactTimer : ""}`
  const secondaryClass = `${timer.displayButton} ${timer.secondaryDisplay}`
  return <section className={timer.container} data-immersive-stage style={{ ...getChimerClockFontMetrics("digital"), "--chimer-primary-font-size": "48px", "--chimer-display-font-family": font } as React.CSSProperties}>
    <button className={`${clockPrimary ? secondaryClass : primaryClass} ${timer.timerDisplay}`} data-testid="timer" data-immersive-primary-display={!clockPrimary ? "true" : undefined} data-immersive-secondary-display={clockPrimary && showSecondary ? "true" : undefined} style={clockPrimary && !showSecondary ? { display: "none" } : undefined} onClick={() => setClockPrimary(false)}>
      <span ref={!clockPrimary ? protectedDisplayRef : undefined}>{compactTimer ? "01:25" : "01:25:00"}</span>
    </button>
    <button className={`${clockPrimary ? primaryClass : secondaryClass} ${timer.currentTimeDisplay}`} data-testid="clock" data-immersive-primary-display={clockPrimary ? "true" : undefined} data-immersive-secondary-display={!clockPrimary && showSecondary ? "true" : undefined} style={!clockPrimary && !showSecondary ? { display: "none" } : undefined} onClick={() => setClockPrimary(true)}>
      <span ref={clockPrimary ? protectedDisplayRef : undefined}>12:34:56</span>
    </button>
    <div className={timer.chrome}>
      <button className={`${timer.control} ${timer.fullscreenButton}`} data-chimer-control="true" aria-label="Fullscreen">↗</button>
      <button className={`${timer.control} ${timer.closeButton}`} data-chimer-control="true" aria-label="Close timer">×</button>
      <ImmersivePanelShell activePanel={panel} onActivePanelChange={setPanel} protectedDisplayRef={protectedDisplayRef} clockContent={<p>Clock settings</p>} visualContent={<p>Visual settings</p>} backgroundContent={<p>Backgrounds</p>} hapticsEnabled={false} chromeVisibility={chrome} toolbarButtonClassName={`${timer.control} ${timer.immersiveToolbarControl}`} toolbarButtonActiveClassName={timer.immersiveToolbarControlActive} />
    </div>
  </section>
}

const root = createRoot(document.getElementById("root")!)
root.render(<Fixture />)
Object.assign(window, { unmountSecondaryFixture: () => root.unmount() })
