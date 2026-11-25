export const OFFLINE_ACCESS_AUDIENCE = "atmoshaper.android.backgrounds.v1"
export const OFFLINE_ACCESS_DB = "atmoshaper.android.background-access.v1"
export const OFFLINE_ACCESS_REQUEST_TTL = 10 * 60 * 1000
const MAX_RECEIPT_LENGTH = 24000
const idPattern = /^[A-Za-z0-9_-]{43}$/
const bytes = value => Uint8Array.from(atob(value.replaceAll("-", "+").replaceAll("_", "/")), character => character.charCodeAt(0))

export function randomOfflineAccessId() {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "")
}

/** Signed access is backgrounds-only: no login credential, raw account ID,
 * payment identity, clinical data, client entitlement flag or plan-name grant. */
export function validateOfflineAccessClaims(input) {
  if (!input || input.version !== 1 || input.aud !== OFFLINE_ACCESS_AUDIENCE
    || !idPattern.test(input.device) || !idPattern.test(input.challenge) || !idPattern.test(input.account)
    || !Number.isSafeInteger(input.issuedAt) || input.issuedAt <= 0
    || !(input.premiumUntil === null || Number.isSafeInteger(input.premiumUntil) && input.premiumUntil > input.issuedAt)
    || !Array.isArray(input.owned) || input.owned.length > 128
    || input.owned.some(value => typeof value !== "string" || !/^[a-z0-9-]{1,100}$/.test(value))) throw new Error("The offline access receipt is invalid.")
  return { version: 1, aud: input.aud, device: input.device, challenge: input.challenge, account: input.account,
    issuedAt: input.issuedAt, premiumUntil: input.premiumUntil, owned: [...new Set(input.owned)] }
}

/** Verify before trusting any payload. The app contains public keys only. */
export async function verifyOfflineAccessReceipt(receipt, device, publicKeys) {
  if (typeof receipt !== "string" || receipt.length > MAX_RECEIPT_LENGTH) throw new Error("The offline access receipt is invalid.")
  const parts = receipt.split(".")
  if (parts.length !== 3 || parts.some(part => !/^[A-Za-z0-9_-]+$/.test(part))) throw new Error("The offline access receipt is invalid.")
  const header = JSON.parse(new TextDecoder().decode(bytes(parts[0])))
  if (header.alg !== "ES256" || header.typ !== "atmoshaper-offline-access") throw new Error("Unsupported offline access signature.")
  const binding = publicKeys.find(key => key.id === header.kid)
  if (!binding) throw new Error("Reconnect after updating the app to verify this access receipt.")
  const key = await crypto.subtle.importKey("jwk", binding.jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"])
  if (!await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, bytes(parts[2]), new TextEncoder().encode(parts[0] + "." + parts[1]))) throw new Error("The offline access signature did not match.")
  const claims = validateOfflineAccessClaims(JSON.parse(new TextDecoder().decode(bytes(parts[1]))))
  if (claims.device !== device) throw new Error("This receipt belongs to another app installation.")
  return claims
}

/** Finite verified expiry, never purchase-date arithmetic or cached plan names.
 * A fresh receipt replaces ownership completely, including refunds/revocations. */
export function offlineBackgroundSnapshot(claims, now = Date.now(), lastSeen = 0) {
  const timeValid = now >= offlineBackgroundClockFloor(claims, lastSeen)
  return {
    featureKeys: timeValid && claims.premiumUntil !== null && now < claims.premiumUntil ? ["premium_backgrounds"] : [],
    ownedBackgroundIds: claims.owned,
  }
}

function offlineBackgroundClockFloor(claims, lastSeen) {
  return Math.max(claims.issuedAt, lastSeen) - 60000
}

export const deniedOfflineBackgroundAccess = status => ({ status, paidThrough: null, clockValidAfter: null, ownedIds: [] })

/** Reduce the original verified record to Clock-only authority. Catalog
 * membership is supplied by the packaged build, never by the receipt. */
export async function projectOfflineBackgroundAccess(record, publicKeys, catalogIds, now = Date.now()) {
  if (record === undefined || record?.receipt === null) return deniedOfflineBackgroundAccess("missing")
  try {
    const claims = await verifyOfflineAccessReceipt(record.receipt, record.device, publicKeys)
    if (claims.issuedAt !== record.lastIssuedAt || !Number.isSafeInteger(record.lastSeen) || record.lastSeen < 0) {
      return deniedOfflineBackgroundAccess("invalid")
    }
    const { featureKeys, ownedBackgroundIds } = offlineBackgroundSnapshot(claims, now, record.lastSeen)
    const ownedIds = ownedBackgroundIds.filter(id => catalogIds.has(id))
    const clockValidAfter = offlineBackgroundClockFloor(claims, record.lastSeen)
    const status = featureKeys.includes("premium_backgrounds") ? "verified"
      : claims.premiumUntil !== null ? (now < clockValidAfter ? "clock" : "expired")
      : ownedIds.length > 0 ? "verified" : "no-grant"
    return { status, paidThrough: claims.premiumUntil, clockValidAfter, ownedIds }
  } catch {
    return deniedOfflineBackgroundAccess("invalid")
  }
}

/** IndexedDB may replace the record while Web Crypto verifies it. Never return
 * capabilities from an obsolete record, including one removed by Forget. */
export async function readProjectedOfflineBackgroundAccess(readRecord, publicKeys, catalogIds, now = Date.now()) {
  try {
    const initial = await readRecord()
    const access = await projectOfflineBackgroundAccess(initial, publicKeys, catalogIds, now)
    const current = await readRecord()
    if (["device", "receipt", "lastIssuedAt", "lastSeen"].every(key => initial?.[key] === current?.[key])) return access
  } catch { /* A busy or unavailable store grants no access. */ }
  return deniedOfflineBackgroundAccess("unavailable")
}

/** The server reduces canonical additive feature provenance to a finite lease.
 * Missing subscription expiry never grants an unbounded offline subscription. */
export function offlinePremiumUntil(featureAccess, now = Date.now()) {
  const sources = featureAccess.find(feature => feature.featureKey === "premium_backgrounds")?.sources ?? []
  const ends = sources.flatMap(source => {
    if (source.source === "admin") return [now + 30 * 24 * 60 * 60 * 1000]
    const expiry = Date.parse(source.expiresAt)
    return ["membership", "temporary", "student"].includes(source.source) && Number.isFinite(expiry) && expiry > now ? [expiry] : []
  })
  return ends.length ? Math.max(...ends) : null
}

/** App-only durable state: install nonce, pending approval, latest signed receipt
 * and clock high-water mark. It cannot inspect the website's account or vault. */
export function createOfflineAccessStore() {
  const opened = new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_ACCESS_DB, 1)
    request.onupgradeneeded = () => request.result.createObjectStore("access")
    request.onsuccess = () => resolve(request.result)
    request.onerror = request.onblocked = () => reject(new Error("Offline access storage is unavailable."))
  })
  let queue = Promise.resolve()
  /** @returns {Promise<any>} */
  async function load() {
    const db = await opened
    return new Promise((resolve, reject) => {
      const request = db.transaction("access").objectStore("access").get("state")
      request.onsuccess = () => resolve(request.result ?? { device: randomOfflineAccessId(), receipt: null, pending: null, lastIssuedAt: 0, lastSeen: 0 })
      request.onerror = () => reject(request.error)
    })
  }
  /** @param {(state: any) => any | Promise<any>} transform */
  function update(transform) {
    const result = queue.then(async () => {
      const next = await transform(await load())
      const db = await opened
      await new Promise((resolve, reject) => {
        const tx = db.transaction("access", "readwrite", { durability: "strict" })
        if (tx.durability !== "strict") { tx.abort(); reject(new Error("Durable access storage is unavailable.")); return }
        tx.objectStore("access").put(next, "state")
        tx.oncomplete = () => resolve()
        tx.onabort = tx.onerror = () => reject(tx.error)
      })
      return next
    })
    queue = result.catch(() => undefined)
    return result
  }
  return { load, update }
}
