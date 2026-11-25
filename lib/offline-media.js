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
    ...ambient.concepts.map(concept => ({ id: concept.id, title: concept.label.replace(/\s*— candidate pool$/i, ""), kind: "ambient", concept,
      // This published pepper source retains an old copied footstep description.
      // Correct only native presentation; keep checked media/sequence IDs intact.
      description: concept.id === "signature-expansion-grinding-pepper-candidate" ? "Pepper-grinder sounds for your atmosphere." : concept.description,
      attribution: { artist: ambient.rights.source, license: ambient.rights.license } })),
  ]
}

/** Byte-limited streaming prevents a dishonest Content-Length from filling storage. */
async function readLimited(response, limit, signal, onBytes) {
  if (!response.ok || response.type === "opaque") throw new Error("Audio download failed. Reconnect and retry.")
  if (Number(response.headers.get("content-length")) > limit) throw new Error("The download exceeds its size limit.")
  const reader = response.body?.getReader()
  if (!reader) throw new Error("This device cannot safely download audio.")
  const chunks = []; let size = 0
  try {
    for (;;) {
      signal?.throwIfAborted()
      const { done, value } = await reader.read()
      signal?.throwIfAborted()
      if (done) break
      size += value.byteLength
      if (size > limit) throw new Error("The download exceeds its size limit.")
      chunks.push(value)
      onBytes?.(size)
    }
  } catch (error) { await reader.cancel().catch(() => undefined); throw error }
  const result = new Uint8Array(size); let offset = 0
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.byteLength }
  return result.buffer
}

async function downloadBytes(url, limit, signal, fetchImpl, onBytes = undefined) {
  return readLimited(await fetchImpl(mediaUrl(url), { credentials: "omit", redirect: "error", cache: "no-store", signal }), limit, signal, onBytes)
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
  let opened
  function database() {
    if (opened) return opened
    const attempt = new Promise((resolve, reject) => {
    const request = indexedDb.open(OFFLINE_MEDIA_DB, 2)
    let abandoned = false
    request.onupgradeneeded = event => {
      const db = request.result
      if (event.oldVersion < 1) db.createObjectStore("packs", { keyPath: "id" })
      const metadata = db.createObjectStore("metadata", { keyPath: "id" })
      // Upgrade existing local downloads one at a time. Normal listing never
      // deserializes their potentially large audio buffers after migration.
      const cursor = request.transaction.objectStore("packs").openCursor()
      cursor.onsuccess = () => {
        const entry = cursor.result
        if (!entry) return
        const { id, bytes, revision } = entry.value
        metadata.put({ id, bytes, revision }); entry.continue()
      }
    }
    request.onsuccess = () => {
      if (abandoned) { request.result.close(); return }
      const db = request.result
      // An older connection's delayed close must not discard a newer attempt.
      const release = () => { if (opened === retryable) opened = undefined }
      db.onclose = release
      db.onversionchange = () => { release(); db.close() }
      resolve(db)
    }
    request.onerror = () => { abandoned = true; reject(request.error) }
    // A blocked open may still succeed after its caller has retried. Close that
    // abandoned connection, and let the next operation acquire a fresh one.
    request.onblocked = () => { abandoned = true; reject(new Error("Close another app window and retry storage.")) }
    })
    const retryable = attempt.catch(error => { if (opened === retryable) opened = undefined; throw error })
    opened = retryable
    return opened
  }
  /** @returns {Promise<any>} */
  async function operation(mode, action, signal) {
    const db = await database()
    signal?.throwIfAborted()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(["packs", "metadata"], mode, { durability: "strict" })
      if (mode === "readwrite" && tx.durability !== "strict") { tx.abort(); reject(new Error("Durable downloads are unavailable.")); return }
      const abort = () => { try { tx.abort() } catch { /* Already committed transactions cannot be undone by a late cancel. */ } }
      const cleanup = () => signal?.removeEventListener("abort", abort)
      signal?.addEventListener("abort", abort, { once: true })
      let request
      tx.oncomplete = () => { cleanup(); resolve(request.result) }
      tx.onabort = tx.onerror = () => { cleanup(); reject(signal?.aborted ? signal.reason : tx.error ?? new Error("Local audio storage failed.")) }
      try { request = action(tx) } catch (error) { abort(); cleanup(); reject(error) }
    })
  }
  return {
    list() { return operation("readonly", tx => tx.objectStore("metadata").getAll())
      .then(rows => rows.map(({ id, bytes, revision }) => ({ id, bytes, revision }))) },
    get(id) { return operation("readonly", tx => tx.objectStore("packs").get(id)) },
    /** Read the pack and its optional failed sample from the same transaction. */
    getWithDecodeFailure(id) { return operation("readonly", tx => {
      const pack = tx.objectStore("packs").get(id)
      const metadata = tx.objectStore("metadata").get(id)
      return { get result() { return { pack: pack.result, failure: metadata.result?.failedSample } } }
    }) },
    /** Save bounded playback evidence beside the corresponding pack, never
     * mutate its bytes. The next complete pack publication clears the mark. */
    async markDecodeFailure(id, { revision, url, sha256 }) {
      const hash = /^[a-f0-9]{64}$/
      if (!hash.test(revision) || !hash.test(sha256) || typeof url !== "string" || url.length > 2048) return
      return operation("readwrite", tx => {
        const metadata = tx.objectStore("metadata")
        const request = metadata.get(id)
        request.onsuccess = () => {
          if (request.result?.revision === revision) metadata.put({
            ...request.result, failedSample: { revision, url, sha256 },
          })
        }
        return request
      })
    },
    put(pack, signal) { return operation("readwrite", tx => {
      tx.objectStore("packs").put(pack)
      return tx.objectStore("metadata").put({ id: pack.id, bytes: pack.bytes, revision: pack.revision })
    }, signal) },
    remove(id) { return operation("readwrite", tx => { tx.objectStore("metadata").delete(id); return tx.objectStore("packs").delete(id) }) },
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
  let reportedPercent = 0
  for (const file of descriptor.files) {
    const downloaded = await readOfflineMediaAsset(file, { signal, fetchImpl, onBytes(received) {
      // Keep UI updates bounded even when the stream emits tiny chunks.
      const percent = Math.floor(100 * (loaded + received) / total)
      if (percent > reportedPercent) {
        reportedPercent = percent
        onProgress({ loaded: loaded + received, total })
      }
    } })
    files.push(downloaded)
    loaded += downloaded.data.byteLength
  }
  signal?.throwIfAborted()
  const pack = { ...descriptor, version: 1, bytes: total, files, revision: await sha256(new TextEncoder().encode(JSON.stringify(descriptor))) }
  signal?.throwIfAborted()
  await store.put(pack, signal)
  return pack
}

/** Shared byte validation for explicit downloads and on-demand station samples.
 * @param {any} file
 * @param {{signal?: AbortSignal, fetchImpl?: typeof fetch, onBytes?: (size:number) => void}} options
 */
export async function readOfflineMediaAsset(file, { signal, fetchImpl = fetch, onBytes } = {}) {
  signal?.throwIfAborted()
  const data = await downloadBytes(file.url, Math.min(file.bytes, MAX_FILE_BYTES), signal, fetchImpl, onBytes)
  if (data.byteLength !== file.bytes || new TextDecoder().decode(data.slice(0, 4)) !== "OggS") throw new Error("An audio file is incomplete or invalid. Retry the download.")
  const hash = await sha256(data)
  if (file.sha256 && hash !== file.sha256) throw new Error("An audio checksum did not match. Retry the download.")
  return { ...file, sha256: hash, data }
}

/** No network fallback. Missing or changed bytes invalidate readiness. */
export class OfflinePackVerificationError extends Error {}

/** Verify a committed pack, stopping between files when playback is canceled. */
export async function readVerifiedOfflinePack(id, store, { signal } = {}) {
  signal?.throwIfAborted()
  const pack = await store.get(id)
  signal?.throwIfAborted()
  if (pack === undefined) throw new OfflinePackVerificationError("Download this sound for offline use first.")
  const damaged = () => new OfflinePackVerificationError("The saved download is damaged. Download it again.")
  if (!pack || pack.version !== 1 || pack.id !== id || !["ambient", "station"].includes(pack.kind)
    || !Array.isArray(pack.files) || !pack.files.length || pack.files.length > 4096
    || !Number.isSafeInteger(pack.bytes) || pack.bytes <= 0 || pack.bytes > MAX_PACK_BYTES) throw damaged()
  let bytes = 0
  const files = []
  for (const file of pack.files) {
    const validSize = file?.data instanceof ArrayBuffer && file.data.byteLength === file.bytes
      && file.bytes > 0 && file.bytes <= MAX_FILE_BYTES
    if (!validSize || (bytes += file.bytes) > pack.bytes) throw damaged()
    const validChecksum = await sha256(file.data) === file.sha256
    signal?.throwIfAborted()
    if (!validChecksum) throw damaged()
    // Every v1 pack already records its full descriptor revision. Station
    // descriptors acquire a local checksum on save, whereas ambient release
    // checksums are part of the descriptor and must also match the revision.
    const { url, type, sha256: hash } = file
    files.push(pack.kind === "station" ? { url, bytes: file.bytes, type } : { url, bytes: file.bytes, sha256: hash, type })
  }
  const descriptor = { id, kind: pack.kind, files, sampleIndex: pack.sampleIndex }
  if (bytes !== pack.bytes || await sha256(new TextEncoder().encode(JSON.stringify(descriptor))) !== pack.revision) throw damaged()
  signal?.throwIfAborted()
  return pack
}
