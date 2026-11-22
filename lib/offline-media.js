import { getPlayableAtmosphereStations } from "./atmosphere/stations.js"
import { assertGenerativeFmSampleIndex } from "./atmosphere/generative-fm-sample-index.js"
import { validateAtmoShaperProductionCatalog } from "./atmoshaper/production-catalog.js"

export const OFFLINE_MEDIA_ORIGIN = "https://media.atmoshaper.com"
export const OFFLINE_MEDIA_DB = "atmoshaper.android.media.v1"
export const MAX_PACK_BYTES = 512 * 1024 * 1024
const MAX_FILE_BYTES = 96 * 1024 * 1024

/** Keep downloads inside existing public audio, without cookies or arbitrary URLs. */
export function mediaUrl(raw) {
  const value = String(raw).replace(/^https:\/\/media\.massagelab\.app\//, OFFLINE_MEDIA_ORIGIN + "/")
  const url = new URL(value)
  if (url.origin !== OFFLINE_MEDIA_ORIGIN || !/^\/atmosphere\/(?:generative-fm|observable-streams-vsco-adaptation|atmoshaper\/v1\/audio)\//.test(url.pathname)
    || url.username || url.password || url.search || url.hash || /%2f|%5c|%2e|\\/i.test(url.pathname)) throw new Error("This audio URL is outside the published catalog.")
  return url.href
}

/** Public catalog only. Original sequence, source-selection and rights stay intact. */
export function offlineAudioCatalog(rawAmbientCatalog) {
  const ambient = validateAtmoShaperProductionCatalog(rawAmbientCatalog)
  return [
    ...getPlayableAtmosphereStations().filter(item => item.runtime.pieceId).map(station => ({
      id: station.id, title: station.title, kind: "station", station,
      description: station.description, attribution: station.attribution,
    })),
    ...ambient.concepts.map(concept => ({ id: concept.id, title: concept.label, kind: "ambient", concept,
      description: concept.description, attribution: { artist: ambient.rights.source, license: ambient.rights.license } })),
  ]
}

/** Byte-limited streaming prevents a dishonest Content-Length from filling storage. */
async function readLimited(response, limit, signal) {
  if (!response.ok || response.type === "opaque") throw new Error("Audio download failed. Reconnect and retry.")
  if (Number(response.headers.get("content-length")) > limit) throw new Error("The download exceeds its size limit.")
  const reader = response.body?.getReader()
  if (!reader) throw new Error("This device cannot safely download audio.")
  const chunks = []; let size = 0
  try {
    for (;;) {
      signal?.throwIfAborted()
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > limit) throw new Error("The download exceeds its size limit.")
      chunks.push(value)
    }
  } catch (error) { await reader.cancel().catch(() => undefined); throw error }
  const result = new Uint8Array(size); let offset = 0
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.byteLength }
  return result.buffer
}

async function downloadBytes(url, limit, signal, fetchImpl) {
  return readLimited(await fetchImpl(mediaUrl(url), { credentials: "omit", redirect: "error", cache: "no-store", signal }), limit, signal)
}

export async function sha256(bytes) {
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map(value => value.toString(16).padStart(2, "0")).join("")
}

/** Close the complete index dependency graph, not merely its first warmup batch. */
export async function describeOfflinePack(item, { signal, fetchImpl = fetch } = {}) {
  if (item.kind === "ambient") {
    const files = [...new Map(item.concept.sources.map(source => {
      const format = source.formats.find(value => value.id === "opus")
      if (!format) throw new Error("This sound has no supported offline format.")
      return [mediaUrl(format.publicUrl), { url: mediaUrl(format.publicUrl), bytes: format.byteSize, sha256: format.sha256, type: format.contentType }]
    })).values()]
    return { id: item.id, kind: item.kind, files, sampleIndex: null }
  }
  const runtime = item.station.runtime
  const [indexBytes, manifestBytes] = await Promise.all([
    downloadBytes(runtime.hostedSampleIndexFormatUrls.opus, 2 * 1024 * 1024, signal, fetchImpl),
    downloadBytes(runtime.hostedManifestFormatUrls.opus, 4 * 1024 * 1024, signal, fetchImpl),
  ])
  const sampleIndex = assertGenerativeFmSampleIndex(JSON.parse(new TextDecoder().decode(indexBytes)), runtime.sampleNameGroups)
  const manifest = JSON.parse(new TextDecoder().decode(manifestBytes))
  if (!Array.isArray(manifest.assets) || manifest.assets.length > 4096) throw new Error("Invalid station download manifest.")
  const assets = new Map(manifest.assets.map(asset => [mediaUrl(asset.publicUrl), asset]))
  const rebind = value => typeof value === "string" ? mediaUrl(value) : Array.isArray(value) ? value.map(rebind) : Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, rebind(nested)]))
  const index = rebind(sampleIndex)
  const urls = new Set(Object.values(index).flatMap(value => typeof value === "string" ? [value] : Array.isArray(value) ? value : Object.values(value)))
  const files = [...urls].map(url => {
    const asset = assets.get(url)
    if (!asset || !Number.isSafeInteger(asset.sizeBytes) || asset.sizeBytes <= 0 || asset.sizeBytes > MAX_FILE_BYTES) throw new Error("Station samples do not match their complete manifest.")
    return { url, bytes: asset.sizeBytes, type: "audio/ogg; codecs=opus" }
  })
  return { id: item.id, kind: item.kind, files, sampleIndex: index }
}

/** One strict transaction exposes a complete pack. Interrupted downloads never
 * publish readiness; replacement failures preserve the previously committed pack. */
export function createOfflineMediaStore(indexedDb = globalThis.indexedDB) {
  const opened = new Promise((resolve, reject) => {
    const request = indexedDb.open(OFFLINE_MEDIA_DB, 1)
    request.onupgradeneeded = () => request.result.createObjectStore("packs", { keyPath: "id" })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error("Close another app window and retry storage."))
  })
  async function operation(mode, action) {
    const db = await opened
    return new Promise((resolve, reject) => {
      const tx = db.transaction("packs", mode, { durability: "strict" })
      if (mode === "readwrite" && tx.durability !== "strict") { tx.abort(); reject(new Error("Durable downloads are unavailable.")); return }
      const request = action(tx.objectStore("packs"))
      tx.oncomplete = () => resolve(request.result)
      tx.onabort = tx.onerror = () => reject(tx.error ?? new Error("Local audio storage failed."))
    })
  }
  return {
    async list() { return (await operation("readonly", store => store.getAll())).map(pack => ({ id: pack.id, bytes: pack.bytes, revision: pack.revision })) },
    get(id) { return operation("readonly", store => store.get(id)) },
    put(pack) { return operation("readwrite", store => store.put(pack)) },
    remove(id) { return operation("readwrite", store => store.delete(id)) },
  }
}

/** Explicit, bounded, cancellation-safe download. Checksums from the ambient
 * release are authoritative; station HTTPS manifests supply exact byte sizes,
 * and persisted local hashes are checked again before offline playback. */
/** @param {any} item @param {any} store
 * @param {{signal?: AbortSignal, onProgress?: (value: {loaded:number,total:number}) => void, fetchImpl?: typeof fetch}} options */
export async function downloadOfflinePack(item, store, { signal, onProgress = () => {}, fetchImpl = fetch } = {}) {
  const descriptor = await describeOfflinePack(item, { signal, fetchImpl })
  const total = descriptor.files.reduce((sum, file) => sum + file.bytes, 0)
  if (!total || total > MAX_PACK_BYTES) throw new Error("This pack exceeds the 512 MB download limit.")
  const estimate = await globalThis.navigator?.storage?.estimate?.()
  if (estimate?.quota && estimate.quota - (estimate.usage ?? 0) < total * 1.15) throw new Error("Not enough device storage. Remove a downloaded pack and retry.")
  let loaded = 0
  onProgress({ loaded, total })
  const files = []
  for (const file of descriptor.files) {
    signal?.throwIfAborted()
    const data = await downloadBytes(file.url, Math.min(file.bytes, MAX_FILE_BYTES), signal, fetchImpl)
    if (data.byteLength !== file.bytes || new TextDecoder().decode(data.slice(0, 4)) !== "OggS") throw new Error("An audio file is incomplete or invalid. Retry the download.")
    const hash = await sha256(data)
    if (file.sha256 && hash !== file.sha256) throw new Error("An audio checksum did not match. Retry the download.")
    files.push({ ...file, sha256: hash, data })
    loaded += data.byteLength; onProgress({ loaded, total })
  }
  signal?.throwIfAborted()
  const pack = { ...descriptor, version: 1, bytes: total, files, revision: await sha256(new TextEncoder().encode(JSON.stringify(descriptor))) }
  await store.put(pack)
  return pack
}

/** No network fallback. Missing or changed bytes invalidate readiness. */
export async function readVerifiedOfflinePack(id, store) {
  const pack = await store.get(id)
  if (!pack || pack.version !== 1 || pack.id !== id || !Array.isArray(pack.files) || pack.files.length === 0) throw new Error("Download this sound for offline use first.")
  for (const file of pack.files) {
    if (!(file.data instanceof ArrayBuffer) || file.data.byteLength !== file.bytes || await sha256(file.data) !== file.sha256) throw new Error("The saved download is damaged. Remove it and download again.")
  }
  return pack
}
