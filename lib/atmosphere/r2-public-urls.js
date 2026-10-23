// @ts-check

// Public URL construction is shared with browser catalogs; keep signing, credentials
// and Node builtins in the server-only hosting module.

/**
 * @param {string | undefined} publicBaseUrl
 * @param {string} objectKey
 */
export function publicUrlForR2Object(publicBaseUrl, objectKey) {
  const normalizedBaseUrl = normalizePublicBaseUrl(publicBaseUrl)
  if (!normalizedBaseUrl) {
    throw new Error("MASSAGELAB_PUBLIC_MEDIA_PUBLIC_BASE_URL is required to build hosted sample URLs.")
  }

  return `${normalizedBaseUrl}/${encodeR2Path(normalizeR2ObjectKey(objectKey))}`
}

/**
 * @param {string | undefined} value
 */
export function normalizePublicBaseUrl(value) {
  const cleaned = value?.trim() || undefined
  return cleaned?.replace(/\/+$/, "")
}

/**
 * @param {string} value
 */
export function normalizeR2ObjectKey(value) {
  const normalized = value.trim().replace(/\\/g, "/").replace(/^\/+|\/+$/g, "").replace(/\/+/g, "/")
  if (!normalized || normalized.split("/").some((part) => part === "." || part === "..")) {
    throw new Error(`Invalid R2 object key: ${value}`)
  }
  return normalized
}

/**
 * @param {string} objectKey
 */
export function encodeR2Path(objectKey) {
  return objectKey.split("/").map(encodeURIComponent).join("/")
}
