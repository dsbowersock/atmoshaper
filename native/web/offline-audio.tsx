import { memo, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import catalogJson from "@/data/atmoshaper/production-audio-catalog.json"
import { createOfflineMediaStore, downloadOfflinePack, offlineAudioCatalog, OfflinePackVerificationError } from "@/lib/offline-media"
import styles from "./offline-core.module.css"
import type { createOfflineAudioRuntime } from "./offline-audio-runtime"

const catalog = offlineAudioCatalog(catalogJson)
const generated = ["white", "pink", "brown"].map(type => ({ id: `noise:${type}`, title: `${type[0].toUpperCase()}${type.slice(1)} noise`, description: "Generated on this device. No download needed.", kind: "generated" }))
const mb = (size: number) => `${(size / 1048576).toFixed(1)} MB`

/** Explicit downloads and local-only playback. Kept mounted across tool tabs so
 * navigating to Clock or breathing never stops music or an in-progress save. */
export const OfflineAudio = memo(function OfflineAudio() {
  const [store] = useState(() => createOfflineMediaStore())
  const [packs, setPacks] = useState<Array<{ id: string; bytes: number }>>([])
  const [section, setSection] = useState("station"), [search, setSearch] = useState("")
  const [message, setMessage] = useState("")
  const [download, setDownload] = useState<{ id: string; loaded: number; total: number } | null>(null)
  const [active, setActive] = useState<string[]>([]), [starting, setStarting] = useState<string[]>([])
  const [damaged, setDamaged] = useState<string[]>([])
  const [volumes, setVolumes] = useState<Record<string, number>>({})
  const abortRef = useRef<AbortController | null>(null)
  const runtimeRef = useRef<ReturnType<typeof createOfflineAudioRuntime> | null>(null)
  const runtimePromise = useRef<Promise<ReturnType<typeof createOfflineAudioRuntime>> | null>(null)
  const playingRef = useRef(new Map<string, number>())
  const requestRef = useRef(0)
  const aliveRef = useRef(true)
  useEffect(() => {
    aliveRef.current = true
    void store.list().then(setPacks).catch(() => setMessage("Downloads could not be loaded. Check device storage."))
    const failure = (event: Event) => {
      const { id, message } = (event as CustomEvent).detail
      playingRef.current.delete(id); setActive(previous => previous.filter(value => value !== id)); setStarting(previous => previous.filter(value => value !== id)); setMessage(message)
    }
    window.addEventListener("atmoshaper:offline-audio-error", failure)
    return () => { aliveRef.current = false; abortRef.current?.abort(); void runtimeRef.current?.dispose(); runtimeRef.current = null; window.removeEventListener("atmoshaper:offline-audio-error", failure) }
  }, [store])
  async function save(item: (typeof catalog)[number]) {
    if (abortRef.current) return
    const controller = new AbortController(); abortRef.current = controller
    setDownload({ id: item.id, loaded: 0, total: 0 }); setMessage("")
    // Persistent-storage requests belong to this explicit download gesture.
    void navigator.storage?.persist?.().catch(() => false)
    try {
      await downloadOfflinePack(item, store, { signal: controller.signal,
        onProgress(progress: { loaded: number; total: number }) { if (aliveRef.current) setDownload({ id: item.id, ...progress }) } })
      // Cancellation ends at durable commit, before the separate metadata read.
      abortRef.current = null; setDownload(null)
      setDamaged(previous => previous.filter(id => id !== item.id))
      try { setPacks(await store.list()); setMessage(`${item.title} is ready offline.`) }
      catch { setMessage(`${item.title} was saved, but the download list could not refresh. Restart the app to refresh the list.`) }
    } catch (error) { setMessage(controller.signal.aborted ? "Download cancelled. Saved packs are unchanged." : error instanceof Error ? error.message : "Download failed. Check storage and retry.") }
    finally { if (abortRef.current === controller) { abortRef.current = null; setDownload(null) } }
  }
  async function getRuntime() {
    if (!runtimePromise.current) {
      const attempt = import("./offline-audio-runtime").then(module => { const runtime = module.createOfflineAudioRuntime(store); runtimeRef.current = runtime; return runtime })
      const retryable = attempt.catch(error => { if (runtimePromise.current === retryable) runtimePromise.current = null; throw error })
      runtimePromise.current = retryable
    }
    return runtimePromise.current
  }
  async function play(item: { id: string; kind: string; title: string; station?: any }) {
    if (item.kind === "station") {
      const replaced = new Set(catalog.filter(entry => entry.kind === "station" && entry.id !== item.id).map(entry => entry.id))
      for (const id of replaced) playingRef.current.delete(id)
      setActive(previous => previous.filter(id => !replaced.has(id)))
      setStarting(previous => previous.filter(id => !replaced.has(id)))
    }
    const request = ++requestRef.current
    setActive(previous => previous.filter(id => id !== item.id))
    playingRef.current.set(item.id, request); setStarting(previous => [...new Set([...previous, item.id])]); setMessage(`Preparing ${item.title}…`)
    try {
      const runtime = await getRuntime()
      if (playingRef.current.get(item.id) !== request) return
      const started = await runtime.play(item)
      if (!started || playingRef.current.get(item.id) !== request) return
      setVolumes(previous => ({ ...previous, [item.id]: item.kind === "station" ? 0.75 : 0.5 }))
      setActive(previous => item.kind === "station" ? [...previous.filter(id => !catalog.some(entry => entry.id === id && entry.kind === "station")), item.id] : [...new Set([...previous, item.id])])
      setMessage(`${item.title} is playing from this device.`)
    } catch (error) { if (playingRef.current.get(item.id) === request) {
      playingRef.current.delete(item.id)
      if (error instanceof OfflinePackVerificationError) setDamaged(previous => [...new Set([...previous, item.id])])
      setMessage(error instanceof Error ? error.message : "Audio could not start. Retry this sound.")
    } }
    finally { if (!playingRef.current.has(item.id) || playingRef.current.get(item.id) === request) setStarting(previous => previous.filter(id => id !== item.id)) }
  }
  async function stop(id: string) {
    playingRef.current.delete(id)
    await runtimeRef.current?.stop(id)
    if (!playingRef.current.has(id)) { setActive(previous => previous.filter(value => value !== id)); setStarting(previous => previous.filter(value => value !== id)) }
  }
  async function remove(id: string) {
    await stop(id)
    try { await store.remove(id); setDamaged(previous => previous.filter(value => value !== id)); setPacks(await store.list()); setMessage("Download removed. You can download it again later.") } catch { setMessage("The download could not be removed. Check device storage and retry.") }
  }
  const items: Array<{id:string; title:string; description:string; kind:string; station?:any; attribution?: {artist:string;license:string;sourceUrl?:string}}> = (section === "generated" ? generated : catalog.filter(item => item.kind === section)).filter(item => item.title.toLowerCase().includes(search.toLowerCase()))
  return <div className={styles.audio}>
    <div className={styles.title}><h1>Music &amp; Atmosphere</h1><span>{packs.length} downloads · {mb(packs.reduce((sum, pack) => sum + pack.bytes, 0))}</span></div>
    <div className={styles.actions}>{[["station", "Stations"], ["ambient", "Atmosphere sounds"], ["generated", "Generated sounds"]].map(([id, title]) => <Button key={id} variant={section === id ? "ctaBlue" : "glow"} aria-pressed={section === id} onClick={() => setSection(id)}>{title}</Button>)}</div>
    <p className={styles.hint}>Download the sounds you want to keep. Saved sounds work offline after app restarts. Uninstalling or clearing app data removes downloads. Keep the app open for reliable playback in this preview.</p>
    <label>Find a sound<input className={styles.search} type="search" value={search} onChange={event => setSearch(event.target.value)} /></label>
    {download && <div role="status" className={styles.downloadNotice}><p>Downloading {catalog.find(item => item.id === download.id)?.title}: {download.total ? `${mb(download.loaded)} / ${mb(download.total)}` : "Reading complete pack…"}</p><progress aria-label="Download progress" max={download.total || 1} value={download.loaded} /><Button variant="glow" onClick={() => abortRef.current?.abort()}>Cancel download</Button></div>}
    <p role="status">{message}</p>
    {(active.length > 0 || starting.length > 0) && <Button variant="glow" onClick={() => void Promise.all([...playingRef.current.keys()].map(stop))}>Stop all audio</Button>}
    <div className={styles.audioGrid}>{items.map(item => {
      const pack = packs.find(pack => pack.id === item.id), invalid = damaged.includes(item.id), ready = (Boolean(pack) && !invalid) || item.kind === "generated"
      const playing = active.includes(item.id), loading = starting.includes(item.id)
      return <article key={item.id} className={styles.audioCard} data-offline-audio={item.id}>
        <h2>{item.title}</h2><p className={styles.hint}>{item.description}</p>
        <p className={styles.hint}>{invalid ? "Download damaged · Remove and download again" : pack ? `Ready offline · ${mb(pack.bytes)}` : item.kind === "generated" ? "Ready offline" : "Not downloaded"}</p>
        <div className={styles.actions}><Button variant="success" disabled={!ready} onClick={() => void (playing || loading ? stop(item.id) : play(item))}>{playing || loading ? "Stop" : "Play"} {item.title}</Button>
          {item.kind !== "generated" && (!pack ? <Button variant="glow" disabled={Boolean(download)} onClick={() => void save(item as (typeof catalog)[number])}>Download {item.title}</Button> : <Button variant="glow" onClick={() => void remove(item.id)}>Remove download</Button>)}</div>
        {playing && <label>Volume<input aria-label={`${item.title} volume`} type="range" min="0" max="1" step="0.05" value={volumes[item.id] ?? (item.kind === "station" ? 0.75 : 0.5)} onChange={event => { const value = Number(event.target.value); setVolumes(previous => ({ ...previous, [item.id]: value })); runtimeRef.current?.volume(item.id, value) }} /></label>}
        {item.attribution && <details className={styles.hint}><summary>Credits</summary>{item.attribution.artist} · {item.attribution.license}{item.attribution.sourceUrl && <p>{item.attribution.sourceUrl}</p>}</details>}
      </article>
    })}</div>
  </div>
})
