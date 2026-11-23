import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react"
import { Clock3, Hourglass, Wind, Palette, Music, Pause, Play, RotateCcw, Maximize, Minimize } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CurrentTimeDisplay } from "@/app/chimer/current-time-display"
import { AtmosphereBreathingGuide } from "@/components/atmosphere/breathing-guide"
import { formatCurrentTimeParts, formatDurationParts } from "@/lib/chimer-timer"
import { getChimerClockFontMetrics } from "@/lib/chimer-clock-font-metrics"
import { playChimerChime } from "@/lib/chimer-chime"
import {
  defaultOfflineCoreState,
  MAX_OFFLINE_TIMER_DURATION_MS,
  getOfflineTimerInterval, readOfflineTimer, startOfflineTimer, pauseOfflineTimer, resumeOfflineTimer,
} from "@/lib/offline-core"
import type { createOfflineCoreStorage } from "@/lib/offline-core-storage"
import styles from "./offline-core.module.css"
import { OfflineAudio } from "./offline-audio"
import { OfflineBackgroundChoices, OfflineBackgroundSurface, useOfflineBackgroundAccess } from "./offline-backgrounds"

const tools = [
  { id: "clock", title: "Clock", icon: Clock3, variant: "ctaBlue" },
  { id: "timer", title: "Timer", icon: Hourglass, variant: "default" },
  { id: "breathing", title: "Breathing", icon: Wind, variant: "cta" },
  { id: "backgrounds", title: "Backgrounds", icon: Palette, variant: "success" },
  { id: "music", title: "Music", icon: Music, variant: "glow" },
] as const

/** The bundled entry uses only device-owned preferences and local product code.
 * No account bootstrap, credential bridge, checkout or hosted route is mounted. */
export function OfflineCoreApp({ store, initial }: {
  store: ReturnType<typeof createOfflineCoreStorage>,
  initial: { state: ReturnType<typeof defaultOfflineCoreState>, ready: boolean },
}) {
  const account = useOfflineBackgroundAccess()
  const [state, setState] = useState(initial.state)
  const [now, setNow] = useState(() => Date.now())
  const [message, setMessage] = useState("")
  const [saveResult, setSaveResult] = useState<{ snapshot: typeof state | null, ok: boolean }>({ snapshot: null, ok: initial.ready })
  // Correlate acknowledgement with the exact immutable snapshot being shown;
  // an old successful write must never mark a newly started timer as saved.
  const saveStatus = !initial.ready ? "failed" : saveResult.snapshot !== state ? "saving" : saveResult.ok ? "saved" : "failed"
  const [immersive, setImmersive] = useState(false)
  const [flash, setFlash] = useState(false)
  const audioRef = useRef<AudioContext | null>(null)
  const timer = readOfflineTimer(state.timer, now)
  const active = timer.status === "running" || timer.status === "paused"
  const currentTime = formatCurrentTimeParts(new Date(now), { timeFormat: state.timeFormat, showCurrentTimeSeconds: state.showSeconds }, "en-US")
  const duration = formatDurationParts(timer.status === "idle" ? state.durationMs : timer.remainingMs)
  const config = formatDurationParts(state.durationMs)
  const fontStyle = getChimerClockFontMetrics("digital") as CSSProperties
  const signal = useCallback(() => {
    setFlash(true)
    if (state.sound) {
      if (audioRef.current?.state === "running") playChimerChime(audioRef.current)
      else setMessage("Tap Test alert to enable sound. The visual timer still works.")
    }
  }, [state.sound])

  useEffect(() => {
    // A fallback load is not an empty durable record. Keep this mount ephemeral;
    // reopening must read the saved record successfully before autosave resumes.
    if (!initial.ready) return
    let current = true
    void store.save(state).then(ok => { if (current) setSaveResult({ snapshot: state, ok: ok === true }) })
    return () => { current = false }
  }, [state, store, initial.ready])
  useEffect(() => {
    const update = () => setNow(Date.now())
    const interval = window.setInterval(update, 250)
    document.addEventListener("visibilitychange", update)
    window.addEventListener("pageshow", update)
    return () => { window.clearInterval(interval); document.removeEventListener("visibilitychange", update); window.removeEventListener("pageshow", update) }
  }, [])

  useEffect(() => {
    if (state.timer.status !== "running") return
    const reading = readOfflineTimer(state.timer, now)
    const interval = getOfflineTimerInterval(state.timer, state.intervalMinutes, now)
    if (reading.status === "complete") {
      setState(previous => ({ ...previous, timer: { ...reading, endsAt: null } }))
      setMessage("Timer finished.")
      if (!document.hidden && now - (state.timer.endsAt ?? 0) < 1250) signal()
    } else if (interval.index > state.timer.lastAlertIndex) {
      setState(previous => ({ ...previous, timer: { ...previous.timer, lastAlertIndex: interval.index } }))
      if (interval.alert && !document.hidden) signal()
    }
    // The interval consumes its durable position before the next tick; missed
    // intervals never produce a burst when Android resumes a suspended WebView.
  }, [now, state.timer, state.intervalMinutes, signal])

  useEffect(() => {
    if (!flash) return
    const timeout = window.setTimeout(() => setFlash(false), 500)
    return () => window.clearTimeout(timeout)
  }, [flash])

  useEffect(() => {
    if (!immersive) return
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setImmersive(false) }
    window.addEventListener("keydown", close)
    return () => window.removeEventListener("keydown", close)
  }, [immersive])

  useEffect(() => () => { void audioRef.current?.close().catch(() => undefined) }, [])

  function unlockSound(test = false) {
    if (!state.sound) return
    try {
      audioRef.current ??= new AudioContext()
      const context = audioRef.current
      void context.resume().then(() => { if (test) { playChimerChime(context); setMessage("Test alert played.") } }).catch(() => setMessage("Sound could not start. The visual timer still works."))
    } catch { setMessage("Sound is unavailable. The visual timer still works.") }
  }

  function changeDuration(part: "hours" | "minutes" | "seconds", value: string) {
    if (!/^\d{0,2}$/.test(value)) return
    const values = { hours: Number(config.hours), minutes: Number(config.minutes), seconds: Number(config.seconds), [part]: Number(value || 0) }
    if (values.hours > 23 || values.minutes > 59 || values.seconds > 59) return
    const durationMs = (values.hours * 3600 + values.minutes * 60 + values.seconds) * 1000
    if (durationMs > MAX_OFFLINE_TIMER_DURATION_MS) { setMessage("The longest timer is 23 hours and 59 minutes."); return }
    setState(previous => ({ ...previous, durationMs, timer: { status: "idle", durationMs, remainingMs: durationMs, endsAt: null, lastAlertIndex: 0 } }))
  }

  function start() {
    try {
      const timer = startOfflineTimer(state.durationMs)
      unlockSound()
      setNow(Date.now()); setState(previous => ({ ...previous, timer })); setMessage("")
    } catch (error) { setMessage(error instanceof Error ? error.message : "Check the timer duration.") }
  }

  function reset() {
    setState(previous => ({ ...previous, timer: { status: "idle", durationMs: previous.durationMs, remainingMs: previous.durationMs, endsAt: null, lastAlertIndex: 0 } }))
    setMessage("")
  }

  return <main className={`${styles.app} ${immersive ? styles.immersive : ""} ${flash ? styles.flash : ""}`} data-offline-save-state={saveStatus}>
    <OfflineBackgroundSurface selectedId={state.backgroundId} access={account.access} mainColor={state.mainColor} orbColor={state.orbColor} motion={state.motion} />
    <header className={styles.header}>
      {/* eslint-disable-next-line @next/next/no-img-element -- Packaged local PNG, without a Next image server. */}
      <img src="./wordmark.png" alt="AtmoShaper" width="188" height="54" />
      <span>Offline tools</span>
    </header>
    <div className={styles.content}>
      <section className={styles.tool} hidden={state.tool !== "clock"} aria-labelledby="clock-title">
        <div className={styles.title}><h1 id="clock-title">Clock</h1><Button variant="glow" size="icon" aria-label={immersive ? "Exit focus view" : "Focus Clock"} onClick={() => setImmersive(value => !value)}>{immersive ? <Minimize /> : <Maximize />}</Button></div>
        <div className={`${styles.readout} ${state.showSeconds ? styles.withSeconds : ""}`} style={fontStyle} role="timer" aria-label={`${currentTime.time} ${currentTime.meridiem}`} data-offline-clock>
          <CurrentTimeDisplay currentTime={currentTime} isPrimary fontFamily="digital" />
        </div>
        <p className={styles.date}>{new Date(now).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
        <div className={styles.options}><label><input type="checkbox" checked={state.timeFormat === "24h"} onChange={event => setState(previous => ({ ...previous, timeFormat: event.target.checked ? "24h" : "12h" }))} />24-hour time</label><label><input type="checkbox" checked={state.showSeconds} onChange={event => setState(previous => ({ ...previous, showSeconds: event.target.checked }))} />Show seconds</label></div>
      </section>
      <section className={`${styles.tool} ${styles.timerTool}`} hidden={state.tool !== "timer"} aria-labelledby="timer-title">
        <div className={styles.title}><h1 id="timer-title">Timer</h1><span data-timer-status>{timer.status === "idle" ? "Set your time" : timer.status}</span></div>
        <div className={`${styles.readout} ${styles.timerDigits}`} data-offline-timer role="timer" aria-label={`${duration.hours} hours ${duration.minutes} minutes ${duration.seconds} seconds`}>{duration.hours}:{duration.minutes}:{duration.seconds}</div>
        <fieldset disabled={active} className={styles.duration}><legend>Session duration</legend>{(["hours", "minutes", "seconds"] as const).map(part => <label key={part}>{part}<input aria-label={`Timer ${part}`} inputMode="numeric" value={String(Number(config[part]))} onChange={event => changeDuration(part, event.target.value)} /></label>)}</fieldset>
        <div className={styles.actions}>
          {!active ? <Button variant="success" onClick={start} disabled={state.durationMs === 0}><Play />Start timer</Button> : <Button variant="success" onClick={() => { if (timer.status === "paused") unlockSound(); setNow(Date.now()); setState(previous => ({ ...previous, timer: previous.timer.status === "running" ? pauseOfflineTimer(previous.timer) : resumeOfflineTimer(previous.timer) })) }}>{timer.status === "running" ? <Pause /> : <Play />}{timer.status === "running" ? "Pause timer" : "Resume timer"}</Button>}
          <Button variant="cta" onClick={reset}><RotateCcw />Reset timer</Button>
        </div>
        <div className={styles.timerOptions}><label>Interval alert <select aria-label="Interval alert" disabled={active} value={state.intervalMinutes} onChange={event => setState(previous => ({ ...previous, intervalMinutes: Number(event.target.value) }))}>{[0, 1, 5, 10, 15, 20, 30, 60].map(value => <option key={value} value={value}>{value ? `Every ${value} minutes` : "Off"}</option>)}</select></label><label className={styles.check}><input type="checkbox" checked={state.sound} onChange={event => setState(previous => ({ ...previous, sound: event.target.checked }))} />Sound alerts</label><Button variant="glow" onClick={() => unlockSound(true)} disabled={!state.sound}>Test alert</Button></div>
        <p className={styles.hint}>{saveStatus === "saved" ? "Your end time is saved on this device." : "This timer has not been saved."} Alerts play while the app is open.</p>
      </section>
      <section className={`${styles.tool} ${styles.breathing}`} hidden={state.tool !== "breathing"} aria-labelledby="breathing-title"><div className={styles.title}><h1 id="breathing-title">Breathing guide</h1><span>One calm breath at a time.</span></div><AtmosphereBreathingGuide /></section>
      <section className={`${styles.tool} ${styles.longTool}`} hidden={state.tool !== "backgrounds"} aria-labelledby="backgrounds-title">
        <div className={styles.title}><h1 id="backgrounds-title">Backgrounds</h1><span>Included on your device</span></div>
        {/* Selectors have no ongoing work; keep the hidden 84-button grid out
            of Clock's quarter-second render loop. Access stays in the root. */}
        {state.tool === "backgrounds" && <OfflineBackgroundChoices selectedId={state.backgroundId} account={account} onSelect={backgroundId => setState(previous => ({ ...previous, backgroundId }))} />}
        <div className={styles.colors}><label>Main color<input type="color" value={state.mainColor} onChange={event => setState(previous => ({ ...previous, mainColor: event.target.value }))} /></label>{state.backgroundId !== "solid-color" && <label>Second color<input type="color" value={state.orbColor} onChange={event => setState(previous => ({ ...previous, orbColor: event.target.value }))} /></label>}</div>
        <label className={styles.check}><input type="checkbox" checked={state.motion} onChange={event => setState(previous => ({ ...previous, motion: event.target.checked }))} />Animate backgrounds</label>
        <p className={styles.hint}>Backgrounds need no download. Your accessible choice stays with every tool.</p>
      </section>
      <section className={`${styles.tool} ${styles.longTool}`} hidden={state.tool !== "music"} aria-label="Music and Atmosphere"><OfflineAudio /></section>
      <p className={styles.status} role="status">{!initial.ready ? "Saved settings could not be opened. This session will not replace them. Reopen the app to retry." : saveStatus === "failed" ? "Changes could not be saved on this device. Keep the app open to retain this timer." : saveStatus === "saving" ? "Saving on this device…" : message}</p>
    </div>
    <nav className={styles.nav} aria-label="Offline tools">{tools.map(tool => <Button key={tool.id} variant={tool.variant} aria-current={state.tool === tool.id ? "page" : undefined} onClick={() => { setState(previous => ({ ...previous, tool: tool.id })); setImmersive(false) }}><tool.icon aria-hidden="true" /><span>{tool.title}</span></Button>)}</nav>
  </main>
}
