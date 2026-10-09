// @ts-check

/**
 * @typedef {Record<string, string | string[] | Record<string, string>>} GenerativeFmSampleIndex
 * @typedef {string | string[]} GenerativeFmSampleGroup
 */

/**
 * Fetches and validates a Generative.fm-style sample index before a browser
 * runtime starts downloading sample payloads. Each sample group may list a
 * rendered instrument first and a source fallback second, matching the package
 * manifest convention used by `@generative-music/piece-observable-streams`.
 *
 * @param {{
 *   sampleIndexUrl: string,
 *   sampleGroups: GenerativeFmSampleGroup[],
 *   fetchImpl?: typeof fetch,
 *   cacheMode?: RequestCache,
 *   mediaOrigin?: string,
 * }} params
 * @returns {Promise<GenerativeFmSampleIndex>}
 */
export async function fetchGenerativeFmSampleIndex({
  sampleIndexUrl,
  sampleGroups,
  fetchImpl = globalThis.fetch,
  cacheMode = "default",
  mediaOrigin,
}) {
  if (typeof fetchImpl !== "function") {
    throw new Error("A browser fetch implementation is required to load the hosted sample index.")
  }

  const deliveryOrigin = resolveGenerativeFmMediaOrigin(mediaOrigin)
  const deliveryUrl = resolveGenerativeFmSampleUrl(sampleIndexUrl, deliveryOrigin)
  const response = await fetchImpl(deliveryUrl, {
    cache: cacheMode,
    headers: {
      Accept: "application/json",
    },
  })
  if (!response.ok) {
    throw new Error(`Hosted sample index request failed: HTTP ${response.status} for ${deliveryUrl}`)
  }

  const sampleIndex = assertGenerativeFmSampleIndex(await response.json(), sampleGroups)
  if (deliveryOrigin === LEGACY_GENERATIVE_FM_MEDIA_ORIGIN) return sampleIndex

  // Copy only URL-bearing collection values; keep instrument/note keys and order.
  return /** @type {GenerativeFmSampleIndex} */ (Object.fromEntries(Object.entries(sampleIndex).map(([name, collection]) => {
    if (typeof collection === "string") {
      return [name, resolveGenerativeFmSampleUrl(collection, deliveryOrigin)]
    }
    if (Array.isArray(collection)) {
      return [name, collection.map((url) => typeof url === "string" ? resolveGenerativeFmSampleUrl(url, deliveryOrigin) : url)]
    }
    if (isPlainObject(collection)) {
      return [name, Object.fromEntries(Object.entries(collection).map(([note, url]) => [
        note, typeof url === "string" ? resolveGenerativeFmSampleUrl(url, deliveryOrigin) : url,
      ]))]
    }
    return [name, collection]
  })))
}

/**
 * @param {unknown} value
 * @param {GenerativeFmSampleGroup[]} sampleGroups
 * @returns {GenerativeFmSampleIndex}
 */
export function assertGenerativeFmSampleIndex(value, sampleGroups) {
  if (!isPlainObject(value)) {
    throw new Error("Hosted sample index must be a JSON object.")
  }

  const normalizedGroups = normalizeSampleGroups(sampleGroups)
  const missingGroups = normalizedGroups.filter((group) => !group.some((name) => hasUsableSampleCollection(value[name])))
  if (missingGroups.length > 0) {
    throw new Error(
      `Hosted sample index is missing required instruments: ${missingGroups
        .map((group) => group.join(" or "))
        .join(", ")}`,
    )
  }

  return /** @type {GenerativeFmSampleIndex} */ (value)
}

/**
 * @param {GenerativeFmSampleGroup[]} sampleGroups
 * @returns {string[][]}
 */
export function normalizeSampleGroups(sampleGroups) {
  return sampleGroups.map((group) => {
    const names = Array.isArray(group) ? group : [group]
    return names.map((name) => name.trim()).filter(Boolean)
  }).filter((group) => group.length > 0)
}

/**
 * Selects a bounded, deterministic set of audio sample URLs that can be fetched
 * opportunistically before playback. Each Generative.fm sample group uses its
 * first available rendered/source candidate so fallback ordering stays aligned
 * with the runtime package's expected instrument names.
 *
 * @param {{
 *   sampleIndex: GenerativeFmSampleIndex,
 *   sampleGroups: GenerativeFmSampleGroup[],
 *   maxUrls?: number,
 * }} params
 * @returns {string[]}
 */
export function selectGenerativeFmSampleWarmupUrls({
  sampleIndex,
  sampleGroups,
  maxUrls = 24,
}) {
  const urlLimit = Math.max(0, Math.floor(Number.isFinite(maxUrls) ? maxUrls : 0))
  if (urlLimit === 0 || !isPlainObject(sampleIndex)) {
    return []
  }

  const selectedUrls = []
  const seenUrls = new Set()
  for (const group of normalizeSampleGroups(sampleGroups)) {
    const collection = group.map((name) => sampleIndex[name]).find(hasUsableSampleCollection)
    for (const sampleUrl of sampleCollectionUrls(collection)) {
      if (!seenUrls.has(sampleUrl)) {
        seenUrls.add(sampleUrl)
        selectedUrls.push(sampleUrl)
      }
      if (selectedUrls.length >= urlLimit) {
        return selectedUrls
      }
    }
  }

  return selectedUrls
}

/**
 * Checks whether a sample collection can be used by the Generative.fm web
 * library: either a non-empty array of URL strings or a plain note-to-URL
 * object whose values are non-empty strings.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
function hasUsableSampleCollection(value) {
  if (Array.isArray(value)) {
    return value.length > 0 && value.every(isNonEmptyString)
  }

  if (isPlainObject(value)) {
    const urls = Object.values(value)
    return urls.length > 0 && urls.every(isNonEmptyString)
  }

  return false
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
function sampleCollectionUrls(value) {
  if (Array.isArray(value)) {
    return value.filter(isNonEmptyString)
  }

  if (isPlainObject(value)) {
    return Object.values(value).filter(isNonEmptyString)
  }

  return []
}

/**
 * Checks whether a value is a JSON-style object, excluding null and arrays.
 *
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/**
 * Checks whether a value is a string with non-whitespace content.
 *
 * @param {unknown} value
 * @returns {value is string}
 */
function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0
}

const LEGACY_GENERATIVE_FM_MEDIA_ORIGIN = "https://media.massagelab.app"
const BRANDED_GENERATIVE_FM_MEDIA_ORIGIN = "https://media.atmoshaper.com"

/**
 * Resolves the opt-in Generative.fm delivery setting. Empty/unset preserves the
 * legacy host; an explicit legacy origin supports rollback. Only the prepared
 * branded origin is accepted, so an invalid build binding stops before fetching.
 *
 * @param {string | undefined} configuredOrigin Public build-time origin.
 * @returns {string} Exact origin, without a trailing slash.
 */
export function resolveGenerativeFmMediaOrigin(configuredOrigin) {
  if (configuredOrigin === undefined || configuredOrigin === "" || configuredOrigin === LEGACY_GENERATIVE_FM_MEDIA_ORIGIN) {
    return LEGACY_GENERATIVE_FM_MEDIA_ORIGIN
  }
  if (configuredOrigin === BRANDED_GENERATIVE_FM_MEDIA_ORIGIN) return configuredOrigin
  throw new Error("Generative.fm media origin must be the legacy or prepared AtmoShaper HTTPS origin.")
}

/**
 * Rebinds only the exact legacy public origin, retaining the literal object path,
 * query and fragment. Other origins, relative cache paths and lookalike hosts
 * retain their existing semantics. No index/object/storage identity is changed.
 *
 * @param {string} sampleUrl Existing index or payload URL.
 * @param {string | undefined} mediaOrigin Optional validated delivery setting.
 * @returns {string} Rebound or original URL.
 */
export function resolveGenerativeFmSampleUrl(sampleUrl, mediaOrigin) {
  const deliveryOrigin = resolveGenerativeFmMediaOrigin(mediaOrigin)
  const legacyPrefix = LEGACY_GENERATIVE_FM_MEDIA_ORIGIN + "/"
  return sampleUrl.startsWith(legacyPrefix)
    ? deliveryOrigin + sampleUrl.slice(LEGACY_GENERATIVE_FM_MEDIA_ORIGIN.length)
    : sampleUrl
}
