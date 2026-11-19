"use client"

import { Pause, Play, RotateCcw } from "lucide-react"
import { useEffect, useRef, useState, type CSSProperties } from "react"
import { Button } from "@/components/ui/button"
import { BREATHING_PRESETS, getBreathingState } from "@/lib/breathing-guide"
import styles from "./breathing-guide.module.css"

/** The page and overlay share a timer/view without touching global media state. */
export function AtmosphereBreathingGuide({ focusOnMount = false }: { focusOnMount?: boolean }) {
  const [presetId, setPresetId] = useState("coherent")
  const [status, setStatus] = useState<"ready" | "running" | "paused">("ready")
  const [elapsedMs, setElapsedMs] = useState(0)
  const primaryRef = useRef<HTMLButtonElement>(null)
  const current = getBreathingState(presetId, elapsedMs)
  const isRunning = status === "running"

  useEffect(() => {
    if (focusOnMount) primaryRef.current?.focus({ preventScroll: true })
  }, [focusOnMount])

  useEffect(() => {
    if (!isRunning) return
    // Account for tab throttling rather than stretching a five-second phase.
    // Pausing or unmounting clears the owner; it never touches the audio timer.
    let previousTick = performance.now()
    const interval = window.setInterval(() => {
      const now = performance.now()
      const delta = now - previousTick
      previousTick = now
      setElapsedMs((value) => value + delta)
    }, 250)
    return () => window.clearInterval(interval)
  }, [isRunning])

  function resetBreathing(nextPresetId = presetId) {
    setPresetId(nextPresetId)
    setElapsedMs(0)
    setStatus("ready")
  }

  const phaseLabel = isRunning ? current.phase.label : status === "paused" ? "Paused" : "Ready"
  const orbStyle = {
    "--breathing-progress": `${Math.round(current.progress * 360)}deg`,
    transform: `scale(${current.scale})`,
  } as CSSProperties

  return (
    <section className={styles.guide} aria-label="Breathing exercise" data-breathing-guide data-running={isRunning}>
      <div className={styles.presets} role="group" aria-label="Breathing pattern">
        {BREATHING_PRESETS.map((preset) => (
          <Button
            key={preset.id}
            type="button"
            variant={preset.id === presetId ? "success" : "cta"}
            aria-pressed={preset.id === presetId}
            className={styles.preset}
            onClick={() => resetBreathing(preset.id)}
          >
            <span className={styles.presetTitle}>{preset.title}</span>
            <span className={styles.presetDescription}>{preset.description}</span>
          </Button>
        ))}
      </div>
      <div className={styles.visual} data-breathing-visual>
        <div className={styles.orb} style={orbStyle} data-breathing-orb>
          <div className={styles.orbInner}>
            <p className={styles.phase} data-breathing-phase>{phaseLabel}</p>
            <p className={styles.countdown} aria-hidden="true" data-breathing-countdown>{current.remainingSeconds}</p>
            <p className={styles.cycle}>Cycle {current.cycle}</p>
          </div>
        </div>
        {/* Announce phase changes, not every quarter-second/countdown update. */}
        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{phaseLabel}</p>
      </div>
      <ol className={styles.phases} aria-label="Pattern timing" style={{ "--breathing-phases": current.preset.phases.length } as CSSProperties}>
        {current.preset.phases.map((phase, index) => (
          <li key={`${presetId}-${index}`} aria-current={isRunning && current.phaseIndex === index ? "step" : undefined}>
            <span>{phase.label}</span><span>{phase.seconds}s</span>
          </li>
        ))}
      </ol>
      <div className={styles.controls}>
        <Button ref={primaryRef} type="button" variant="success" className={styles.primary} data-breathing-primary onClick={() => setStatus((value) => value === "running" ? "paused" : "running")}>
          {isRunning ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
          {isRunning ? "Pause breathing" : "Start breathing"}
        </Button>
        <Button type="button" variant="cta" className={styles.reset} onClick={() => resetBreathing()} aria-label="Reset breathing">
          <RotateCcw aria-hidden="true" /><span>Reset</span>
        </Button>
      </div>
      <p className={styles.comfort}>Breathe comfortably. Pause whenever you need.</p>
    </section>
  )
}
