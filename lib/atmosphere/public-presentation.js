import { ATMOSPHERE_PUBLIC_LABELS } from "./public-labels.js"

/**
 * Translates the stored compatibility-default recipe title at the public edge.
 *
 * @param {string | null | undefined} name
 * @returns {string}
 */
export function resolveAtmospherePublicTitle(name) {
  if (!name || name === "AtmoShaper") return ATMOSPHERE_PUBLIC_LABELS.name
  return name
}

/**
 * Formats an internal audio failure for public presentation without mutating
 * the supplied value or changing the runtime and telemetry owners that retain it.
 *
 * @param {unknown} error
 * @param {string} fallback
 * @returns {string}
 */
export function formatAtmospherePublicError(error, fallback) {
  const message = error instanceof Error
    ? error.message
    : typeof error === "string"
      ? error
      : ""
  if (!message) return fallback
  return message.replace(/\bAtmoShaper\b/g, ATMOSPHERE_PUBLIC_LABELS.name)
}
