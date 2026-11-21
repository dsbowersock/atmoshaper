"use client"

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ALL_FEELING_WORDS } from "@/lib/wellness-reflection"
import { buildFeelingWheelSegments, feelingAngleDelta, feelingSectorPath, feelingWheelFrame, type FeelingSegment } from "@/lib/feelings-wheel-layout"
import styles from "./feelings-wheel.module.css"

const SEGMENTS = buildFeelingWheelSegments()
const SEGMENT_BY_KEY = new Map(SEGMENTS.map((segment) => [segment.key, segment]))
type Pointer = { x: number; y: number; startX: number; startY: number; word?: FeelingSegment }
type Pinch = { distance: number; zoom: number; anchorX: number; anchorY: number }

/** Continuous three-ring wheel. Captured drag/pinch navigation is separate
 * from choosing a word: moving or cancelling never records an accidental
 * feeling. All words stay mounted; no level replaces another. */
export function FeelingsWheel({ selected, onChange, disabled }: { selected: string[]; onChange: (words: string[]) => void; disabled: boolean }) {
  const [search, setSearch] = useState("")
  const [custom, setCustom] = useState("")
  const [multiple, setMultiple] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [zoom, setZoom] = useState(2)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [aspect, setAspect] = useState(1.15)
  const [dragging, setDragging] = useState(false)
  const [activePath, setActivePath] = useState<string[]>([])
  const [focusKey, setFocusKey] = useState(SEGMENTS[0].key)
  const svg = useRef<SVGSVGElement>(null)
  const paths = useRef(new Map<string, SVGPathElement>())
  const pointers = useRef(new Map<number, Pointer>())
  const gesture = useRef<{ moved: boolean; angle: number; pinched: boolean; pinch?: Pinch }>({ moved: false, angle: 0, pinched: false })
  const instructionsId = useId()
  const frame = feelingWheelFrame(aspect, zoom, pan)

  useEffect(() => {
    const element = svg.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => { if (entry.contentRect.width) setAspect(entry.contentRect.height / entry.contentRect.width) })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const choose = (word: string, context?: string[]) => {
    if (disabled || !word.trim() || multiple && selected.length >= 16 && !selected.includes(word)) return
    setActivePath(context ?? SEGMENTS.find((segment) => segment.word === word)?.path ?? [word])
    onChange(multiple ? selected.includes(word) ? selected.filter((item) => item !== word) : [...selected, word] : [word])
  }
  const changeZoom = (next: number) => { setZoom(Math.max(1, Math.min(3.5, next))); setPan({ x: 0, y: 0 }) }
  const angleAt = (x: number, y: number) => {
    const matrix = svg.current?.getScreenCTM()
    if (!matrix) return 0
    const point = new DOMPoint(x, y).matrixTransform(matrix.inverse())
    return Math.atan2(point.y, point.x)
  }
  const startPointer = (event: PointerEvent<SVGSVGElement>) => {
    if (disabled || event.pointerType === "mouse" && event.button !== 0) return
    const key = (event.target as Element).closest("[data-feeling-key]")?.getAttribute("data-feeling-key")
    if (!pointers.current.size) gesture.current = { moved: false, angle: angleAt(event.clientX, event.clientY), pinched: false }
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, word: key ? SEGMENT_BY_KEY.get(key) : undefined })
    event.currentTarget.setPointerCapture(event.pointerId)
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()], box = event.currentTarget.getBoundingClientRect()
      gesture.current.moved = true; gesture.current.pinched = true
      gesture.current.pinch = { distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), zoom, anchorX: frame.x + ((a.x + b.x) / 2 - box.left) / box.width * frame.width, anchorY: frame.y + ((a.y + b.y) / 2 - box.top) / box.height * frame.height }
    }
  }
  const movePointer = (event: PointerEvent<SVGSVGElement>) => {
    const pointer = pointers.current.get(event.pointerId)
    if (!pointer || disabled) return
    pointer.x = event.clientX; pointer.y = event.clientY
    const pinch = gesture.current.pinch
    if (pointers.current.size === 2 && pinch) {
      const [a, b] = [...pointers.current.values()], box = event.currentTarget.getBoundingClientRect()
      const nextZoom = Math.max(1, Math.min(3.5, pinch.zoom * Math.hypot(a.x - b.x, a.y - b.y) / pinch.distance))
      const next = feelingWheelFrame(aspect, nextZoom)
      setZoom(nextZoom)
      setPan({ x: pinch.anchorX - ((a.x + b.x) / 2 - box.left) / box.width * next.width - next.x, y: pinch.anchorY - ((a.y + b.y) / 2 - box.top) / box.height * next.height - next.y })
      return
    }
    if (gesture.current.pinched || Math.hypot(pointer.x - pointer.startX, pointer.y - pointer.startY) < 7) return
    const angle = angleAt(pointer.x, pointer.y), delta = feelingAngleDelta(gesture.current.angle, angle)
    gesture.current.moved = true; gesture.current.angle = angle
    setDragging(true); setRotation((value) => value + delta)
  }
  const endPointer = (event: PointerEvent<SVGSVGElement>, cancelled = false) => {
    const pointer = pointers.current.get(event.pointerId)
    pointers.current.delete(event.pointerId)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    if (!pointers.current.size) setDragging(false)
    if (!cancelled && !gesture.current.moved && pointer?.word) choose(pointer.word.word, pointer.word.path)
    if (cancelled) gesture.current.moved = true
  }
  const navigateWord = (event: KeyboardEvent<SVGPathElement>, segment: FeelingSegment) => {
    if (disabled) return
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); choose(segment.word, segment.path); return }
    const peers = SEGMENTS.filter((item) => item.level === segment.level), index = peers.indexOf(segment)
    const nextKey = event.key === "ArrowUp" ? segment.parent : event.key === "ArrowDown" ? segment.children[0] : event.key === "ArrowLeft" ? peers[(index + peers.length - 1) % peers.length].key : event.key === "ArrowRight" ? peers[(index + 1) % peers.length].key : undefined
    const next = nextKey ? SEGMENT_BY_KEY.get(nextKey) : undefined
    if (!next) return
    event.preventDefault(); setFocusKey(next.key)
    // Bring keyboard focus into the readable sector without hiding any ring.
    setRotation(-(next.start + next.end) / 2); paths.current.get(next.key)?.focus()
  }

  return <fieldset disabled={disabled} className={styles.wheel} data-feelings-wheel>
    <legend>What are you feeling?</legend>
    <p id={instructionsId}>Drag the wheel to rotate. Tap any word to choose it. Pinch to zoom; use two fingers to move the view.</p>
    <div className={styles.actions}><Button type="button" variant={multiple ? "cta" : "glow"} aria-pressed={multiple} onClick={() => setMultiple(!multiple)}>Choose multiple feelings</Button></div>
    <svg ref={svg} viewBox={`${frame.x} ${frame.y} ${frame.width} ${frame.height}`} className={styles.diagram} role="group" aria-label="Explore feeling words" aria-describedby={instructionsId} aria-disabled={disabled} data-dragging={dragging} data-wheel-rotation={rotation.toFixed(4)} data-wheel-zoom={zoom.toFixed(3)}
      onPointerDown={startPointer} onPointerMove={movePointer} onPointerUp={(event) => endPointer(event)} onPointerCancel={(event) => endPointer(event, true)} onLostPointerCapture={(event) => { if (pointers.current.has(event.pointerId)) endPointer(event, true) }}>
      <g transform={`rotate(${rotation * 180 / Math.PI})`}>
        {SEGMENTS.map((segment) => {
          const middle = (segment.start + segment.end) / 2, radius = (segment.inner + segment.outer) / 2
          const x = Math.cos(middle) * radius, y = Math.sin(middle) * radius, screenAngle = Math.atan2(Math.sin(middle + rotation), Math.cos(middle + rotation))
          const flip = Math.abs(screenAngle) > Math.PI / 2 ? 180 : 0
          return <g key={segment.key}>
            <desc id={`${instructionsId}-${segment.key}`}>{segment.path.join(", ")}</desc>
            <path ref={(node) => { if (node) paths.current.set(segment.key, node); else paths.current.delete(segment.key) }} d={feelingSectorPath(segment)} fill={segment.color} role="button" tabIndex={!disabled && focusKey === segment.key ? 0 : -1} aria-label={`Choose ${segment.word}`} aria-describedby={`${instructionsId}-${segment.key}`} aria-pressed={selected.includes(segment.word)} data-feeling-key={segment.key} data-feeling-level={segment.level} data-related={activePath[0] === segment.path[0]} onFocus={() => setFocusKey(segment.key)} onKeyDown={(event) => navigateWord(event, segment)} onClick={(event) => { if (event.detail === 0) choose(segment.word, segment.path) }} />
            <text x={x} y={y} transform={`rotate(${middle * 180 / Math.PI + flip} ${x} ${y})`} dominantBaseline="middle" textAnchor="middle" className={segment.level === 1 ? styles.familyWord : segment.level === 2 ? styles.groupWord : styles.specificWord} aria-hidden="true">{segment.word}</text>
          </g>
        })}
      </g>
      <circle r="30" className={styles.center} /><text textAnchor="middle" dominantBaseline="middle" className={styles.centerText}>Feelings</text>
    </svg>
    <div className={styles.controls} aria-label="Wheel view">
      <Button type="button" variant="ghost" onClick={() => setRotation(rotation - Math.PI / 6)}>Rotate left</Button><Button type="button" variant="ghost" onClick={() => setRotation(rotation + Math.PI / 6)}>Rotate right</Button>
      <Button type="button" variant="glow" aria-label="Zoom out" disabled={disabled || zoom <= 1} onClick={() => changeZoom(zoom - 0.25)}>−</Button><Button type="button" variant="glow" aria-label="Zoom in" disabled={disabled || zoom >= 3.5} onClick={() => changeZoom(zoom + 0.25)}>+</Button>
      <Button type="button" variant="ghost" onClick={() => changeZoom(1)}>Show whole wheel</Button><Button type="button" variant="ghost" onClick={() => { changeZoom(2); setRotation(0) }}>Reset view</Button>
    </div>
    <p className={styles.context} aria-live="polite">{activePath.length ? activePath.join(" › ") : "Broad feelings are at the center; more specific words are toward the edge."}</p>
    <details><summary>Choose from a word list</summary><p>On the wheel, arrow keys move between words and levels. Enter or Space chooses a word.</p><div className={styles.wordList}>{SEGMENTS.filter((segment) => segment.level === 1).map((family) => <section key={family.key}><h4>{family.word}</h4><div className={styles.words}>{SEGMENTS.filter((segment) => segment.path[0] === family.word).map((segment) => <Button key={segment.key} type="button" variant={selected.includes(segment.word) ? "cta" : "secondary"} aria-pressed={selected.includes(segment.word)} aria-describedby={`${instructionsId}-${segment.key}`} onClick={() => choose(segment.word, segment.path)}>{segment.word}</Button>)}</div></section>)}</div></details>
    <label htmlFor="feelingSearch">Find a feeling word</label><Input id="feelingSearch" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search the wheel" />
    {search.trim() ? <div className={styles.words}>{ALL_FEELING_WORDS.filter((word) => word.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 24).map((word) => <Button key={word} type="button" variant="secondary" onClick={() => choose(word)}>{word}</Button>)}</div> : null}
    <label htmlFor="feelingCustom">Or use your own word</label><div className={styles.custom}><Input id="feelingCustom" value={custom} onChange={(event) => setCustom(event.target.value)} maxLength={80} /><Button type="button" variant="glow" disabled={disabled || !custom.trim() || multiple && selected.length >= 16 && !selected.includes(custom.trim())} onClick={() => { choose(custom.trim()); setCustom("") }}>Add my word</Button></div>
    {multiple && selected.length >= 16 ? <p role="status">Up to 16 feeling words fit in one entry. Remove a word to choose another.</p> : null}
    <p aria-live="polite">{selected.length ? `${selected.length} feeling${selected.length === 1 ? "" : "s"} chosen` : "No feeling chosen yet. A note on its own is also welcome."}</p><div className={styles.words}>{selected.map((word) => <Button key={word} type="button" variant="glow" aria-label={`Remove feeling ${word}`} onClick={() => onChange(selected.filter((item) => item !== word))}>{word} ×</Button>)}</div>
    {selected.map((word) => <input key={word} type="hidden" name="feelingWords" value={word} />)}
  </fieldset>
}
