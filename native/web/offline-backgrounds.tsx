import { Component, useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react"
import { backgroundRegistry, getBackgroundDefinition, userCanUseBackground, type BackgroundAccessSnapshot } from "@/components/backgrounds/backgroundRegistry"
import { resolveBackgroundEffectProps } from "@/components/backgrounds/resolveBackgroundEffectProps"
import { PATTERNED_ACTIVE_RENDERER_IDS } from "@/components/backgrounds/backgroundUnderlayPolicy"
import type { BackgroundEffectProps } from "@/components/backgrounds/effects/css-backgrounds"
import { useAmbientReducedMotion } from "@/components/backgrounds/use-ambient-reduced-motion"
import { useMediaQuery, BACKGROUND_COMPACT_VIEWPORT_QUERY } from "@/components/backgrounds/use-media-query"
import { createOfflineAccessStore, offlineBackgroundSnapshot, randomOfflineAccessId, verifyOfflineAccessReceipt, OFFLINE_ACCESS_REQUEST_TTL } from "@/lib/offline-background-access"
import publicKeys from "@/native/offline-access-public-keys.json"
import { Button } from "@/components/ui/button"
import styles from "./offline-core.module.css"
import { OfflineReducedMotion } from "./offline-moving-background"
import { resolveDnaTwistedCubesBackgroundHostProps } from "@/lib/dna-twisted-cubes-background-host"

const structuredDefaults = resolveDnaTwistedCubesBackgroundHostProps({ settings: {}, category: "clock" })

/** A failed effect cannot take the clock/timer with it. A new selection retries. */
class EffectBoundary extends Component<{ children: ReactNode; onFailed?: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onFailed?.() }
  render() { return this.state.failed ? null : this.props.children }
}

export function OfflineBackgroundSurface({ selectedId, access, mainColor, orbColor, motion, onFailed, onReady }: {
  selectedId: string; access: BackgroundAccessSnapshot; mainColor: string; orbColor: string; motion: boolean
  onFailed?: () => void; onReady?: () => void
}) {
  const selected = getBackgroundDefinition(selectedId)
  const entry = userCanUseBackground(selected, access) ? selected : getBackgroundDefinition("massage-lab-moving-gradient")
  const [loaded, setLoaded] = useState<{ id: string; component: ComponentType<BackgroundEffectProps> } | null>(null)
  const reduce = useAmbientReducedMotion(motion ? "system" : "reduced")
  const compactViewport = useMediaQuery(BACKGROUND_COMPACT_VIEWPORT_QUERY)
  const requiresFirstDraw = Boolean(onReady && PATTERNED_ACTIVE_RENDERER_IDS.has(entry.id))
  const onRenderReadyChange = useCallback((ready: boolean) => {
    if (ready) onReady?.()
  }, [onReady])
  useEffect(() => {
    let current = true
    void entry.component?.().then(module => { if (current) setLoaded({ id: entry.id, component: module.default }) }).catch(() => {
      if (current) { setLoaded(null); onFailed?.() }
    })
    return () => { current = false }
  }, [entry, onFailed])
  const effectProps = useMemo(() => resolveBackgroundEffectProps({
    selectedId: entry.id, canCustomize: true,
    palette: { mode: "custom", primaryColor: mainColor, swatches: [mainColor, orbColor] },
    effectProps: { ...structuredDefaults, mainColor, orbColor, solidColor: mainColor, reduceMotion: reduce, compactViewport,
      staticGradient: { type: "linear", angle: 145, colorCount: 2, colors: [mainColor, orbColor], stopPositions: [0, 100] } },
  }), [entry.id, mainColor, orbColor, reduce, compactViewport])
  const Effect = loaded?.id === entry.id ? loaded.component : null
  useEffect(() => {
    if (!Effect || !onReady || requiresFirstDraw) return
    const frame = window.requestAnimationFrame(onReady)
    return () => window.cancelAnimationFrame(frame)
  }, [Effect, onReady, requiresFirstDraw])
  return <div className={styles.background} data-offline-background={entry.id} style={entry.fallbackStyle}>
    {Effect && <OfflineReducedMotion.Provider value={reduce}><EffectBoundary key={entry.id} onFailed={onFailed}><Effect {...effectProps} className={styles.surface} onRenderReadyChange={requiresFirstDraw ? onRenderReadyChange : undefined} /></EffectBoundary></OfflineReducedMotion.Provider>}
  </div>
}

let nextAccessMutation = 0

function notifyNativeAccessChange(status: "replacing" | "replaced" | "replace-failed" | "removing" | "removed" | "remove-failed", mutation: number) {
  const { AtmoShaperBackgroundAccessChanged: port, atmoNativeAccessDocument: documentId } = window as Window & {
    AtmoShaperBackgroundAccessChanged?: { postMessage: (value: string) => void }
    atmoNativeAccessDocument?: string
  }
  try { if (documentId) port?.postMessage(`${documentId}:${status}:${mutation}`) } catch { /* A detached native observer cannot block a durable receipt update. */ }
}

/** Receipt acceptance is one serialized compare-and-replace, bound to the most
 * recent user-requested challenge. Out-of-order browser returns never restore
 * an older account's purchases. No session token enters this origin. */
export function useOfflineBackgroundAccess() {
  const [store] = useState(() => createOfflineAccessStore())
  const [record, setRecord] = useState<any>(null)
  const [claims, setClaims] = useState<any>(null)
  const [loaded, setLoaded] = useState(false)
  const [message, setMessage] = useState("")
  const [removalPending, setRemovalPending] = useState(false)
  const [now, setNow] = useState(Date.now)
  const recordRef = useRef<any>(null)
  // Forget invalidates all older work. Refresh changes only the pending nonce;
  // rejected/duplicate replies must not invalidate an already committed receipt.
  const epoch = useRef(0)
  useEffect(() => {
    let current = true
    const startedAtEpoch = epoch.current
    void store.update(value => ({ ...value, lastSeen: Math.max(value.lastSeen, Date.now()) })).then(async value => {
      if (!current || epoch.current !== startedAtEpoch) return
      recordRef.current = value; setRecord(value)
      try {
        const verified = value.receipt ? await verifyOfflineAccessReceipt(value.receipt, value.device, publicKeys) : null
        if (current && epoch.current === startedAtEpoch && recordRef.current?.device === value.device && recordRef.current?.receipt === value.receipt) setClaims(verified)
      } catch { if (current && epoch.current === startedAtEpoch) setMessage("Saved access could not be verified. Refresh account access; free backgrounds remain available.") }
    }).catch(() => { if (current && epoch.current === startedAtEpoch) setMessage("Offline account access could not be loaded. Free backgrounds are available.") })
      // Readiness belongs to this mount; Forget invalidates entitlement work,
      // but must not leave free tools waiting on a superseded startup epoch.
      .finally(() => { if (current) setLoaded(true) })
    const tick = window.setInterval(() => setNow(Date.now()), 1000)
    const remember = window.setInterval(() => {
      const operationEpoch = epoch.current
      void store.update(value => ({ ...value, lastSeen: Math.max(value.lastSeen, Date.now()) })).then(value => {
        if (current && operationEpoch === epoch.current) { recordRef.current = value; setRecord(value) }
      }).catch(() => undefined)
    }, 30000)
    return () => { current = false; window.clearInterval(tick); window.clearInterval(remember) }
  }, [store])
  useEffect(() => {
    const receive = (event: Event) => {
      const operationEpoch = epoch.current
      delete (window as Window & { atmoOfflineReceipt?: string }).atmoOfflineReceipt
      const receipt = (event as CustomEvent).detail
      let mutation: number | undefined
      void store.update(async value => {
        const verified = await verifyOfflineAccessReceipt(receipt, value.device, publicKeys)
        if (!value.pending || verified.challenge !== value.pending.challenge || Date.now() > value.pending.at + OFFLINE_ACCESS_REQUEST_TTL
          || verified.issuedAt < value.pending.at - 60000 || verified.issuedAt > Date.now() + 60000 || verified.issuedAt <= value.lastIssuedAt) throw new Error("This approval expired or was replaced. Verify access again from this app.")
        if (operationEpoch === epoch.current) {
          mutation = ++nextAccessMutation
          // Invalidate an overlapping native read before a verified
          // replacement can commit. Rejected approvals never enter this state.
          notifyNativeAccessChange("replacing", mutation)
        }
        // A fresh challenge-bound server timestamp can recover a legitimately
        // corrected device clock; an offline cache cannot reset this floor.
        return { ...value, receipt, pending: null, lastIssuedAt: verified.issuedAt, lastSeen: Math.max(verified.issuedAt, Date.now()) }
      }).then(async value => {
        if (operationEpoch !== epoch.current) return
        recordRef.current = value; setRecord(value)
        // A committed replacement can revoke the old capability. Hide it
        // while the replacement is checked for the still-mounted web view.
        setClaims(null)
        if (mutation !== undefined) notifyNativeAccessChange("replaced", mutation)
        mutation = undefined
        const verified = await verifyOfflineAccessReceipt(value.receipt, value.device, publicKeys)
        if (operationEpoch !== epoch.current || recordRef.current?.device !== value.device || recordRef.current?.receipt !== value.receipt) return
        setClaims(verified); setMessage("Background access saved for offline use.")
      }).catch(error => {
        if (operationEpoch !== epoch.current) return
        if (mutation !== undefined) notifyNativeAccessChange("replace-failed", mutation)
        setMessage(error instanceof Error ? error.message : "Offline access could not be saved.")
      })
    }
    window.addEventListener("atmoshaper:offline-access", receive)
    // Native launch returns can precede React's effect registration.
    const pending = (window as Window & { atmoOfflineReceipt?: string }).atmoOfflineReceipt
    if (pending) { delete (window as Window & { atmoOfflineReceipt?: string }).atmoOfflineReceipt; receive(new CustomEvent("atmoshaper:offline-access", { detail: pending })) }
    return () => window.removeEventListener("atmoshaper:offline-access", receive)
  }, [store])
  async function refresh() {
    const operationEpoch = epoch.current
    try {
      const value = await store.update(previous => ({ ...previous, pending: { challenge: randomOfflineAccessId(), at: Date.now() } }))
      if (operationEpoch !== epoch.current) return
      recordRef.current = value; setRecord(value)
      window.location.href = `https://www.atmoshaper.com/account/offline-access?device=${value.device}&challenge=${value.pending.challenge}`
    } catch { setMessage("The app could not save a verification request. Retry when local storage is available.") }
  }
  async function forget() {
    const operationEpoch = ++epoch.current
    const mutation = ++nextAccessMutation
    notifyNativeAccessChange("removing", mutation)
    recordRef.current = null
    setClaims(null); setRemovalPending(true)
    try {
      const value = await store.update(() => ({ device: randomOfflineAccessId(), receipt: null, pending: null, lastIssuedAt: 0, lastSeen: Date.now() }))
      if (operationEpoch !== epoch.current) return
      recordRef.current = value; setRecord(value); setClaims(null); setRemovalPending(false); setMessage("Account access removed from this app. Downloads and free tools are unchanged.")
      notifyNativeAccessChange("removed", mutation)
    } catch {
      if (operationEpoch !== epoch.current) return
      notifyNativeAccessChange("remove-failed", mutation)
      setMessage("Account access could not be removed. Check local storage and retry.")
    }
  }
  return { access: claims ? offlineBackgroundSnapshot(claims, now, record?.lastSeen) : { featureKeys: [], ownedBackgroundIds: [] },
    claims, loaded, canForget: Boolean(record?.receipt) || removalPending, message, refresh, forget, ready: publicKeys.length > 0 && record !== null }
}

export function OfflineBackgroundChoices({ selectedId, onSelect, account }: {
  selectedId: string; onSelect(id: string): void; account: ReturnType<typeof useOfflineBackgroundAccess>
}) {
  const [search, setSearch] = useState("")
  return <>
    <div className={styles.downloadNotice}>
      <p>All backgrounds are included on your device. Free backgrounds work immediately. Connect once to verify a subscription or individual purchase.</p>
      <p>{account.claims?.premiumUntil ? `Premium background access verified through ${new Date(account.claims.premiumUntil).toLocaleString()}.` : "Purchased backgrounds have no scheduled expiry."} Refresh access after renewal or account changes.</p>
      <Button variant="glow" disabled={!account.ready} onClick={() => void account.refresh()}>Verify or refresh account access</Button>
      {account.canForget && <Button variant="glow" onClick={() => void account.forget()}>Forget account access</Button>}
      {!account.ready && <p>Account verification is not available in this preview yet. Free backgrounds are ready to use.</p>}
      <p role="status">{account.message}</p>
    </div>
    <label>Find a background<input className={styles.search} value={search} onChange={event => setSearch(event.target.value)} type="search" /></label>
    <div className={styles.backgroundChoices}>{backgroundRegistry.filter(entry => entry.enabled && entry.label.toLowerCase().includes(search.toLowerCase())).map(entry => {
      const allowed = userCanUseBackground(entry, account.access)
      return <Button key={entry.id} variant={selectedId === entry.id && allowed ? "success" : "glow"} aria-pressed={selectedId === entry.id && allowed} disabled={!allowed} onClick={() => onSelect(entry.id)}>{entry.label}{!allowed ? " · Verify access online" : account.access.ownedBackgroundIds.includes(entry.id) ? " · Owned" : ""}</Button>
    })}</div>
  </>
}
