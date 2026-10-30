import type { AnatomyMediaAsset } from "./anatomy-foundation.ts"

const LEGACY_ANATOMY_MEDIA_ORIGIN = "https://anatomy-media.massagelab.app"
const BRANDED_ANATOMY_MEDIA_ORIGIN = "https://anatomy-media.atmoshaper.com"

export type AnatomyMediaDeliveryOrigin = typeof LEGACY_ANATOMY_MEDIA_ORIGIN | typeof BRANDED_ANATOMY_MEDIA_ORIGIN

/** Validates the public build setting without exposing its value in failures. */
export function resolveAnatomyMediaDeliveryOrigin(value: string | undefined): AnatomyMediaDeliveryOrigin {
  if (value === undefined || value === "" || value === LEGACY_ANATOMY_MEDIA_ORIGIN) {
    return LEGACY_ANATOMY_MEDIA_ORIGIN
  }
  if (value === BRANDED_ANATOMY_MEDIA_ORIGIN) return BRANDED_ANATOMY_MEDIA_ORIGIN

  throw new Error("Invalid NEXT_PUBLIC_ANATOMY_MEDIA_ORIGIN configuration.")
}

/**
 * Rebinds only an already-admitted image/diagram delivery URL. The literal
 * suffix is object identity, so slicing preserves bytes that URL serialization
 * could normalize. Eligibility and source/reference URLs remain caller-owned.
 */
export function anatomyMediaDeliveryUrl(
  url: string,
  mediaType: AnatomyMediaAsset["mediaType"],
  origin: AnatomyMediaDeliveryOrigin,
): string {
  if (origin === LEGACY_ANATOMY_MEDIA_ORIGIN || (mediaType !== "image" && mediaType !== "diagram")) return url
  if (!url.startsWith(LEGACY_ANATOMY_MEDIA_ORIGIN)) return url

  const suffix = url.slice(LEGACY_ANATOMY_MEDIA_ORIGIN.length)
  // Only a literal authority boundary may follow the exact legacy origin.
  if (suffix && !["/", "?", "#"].includes(suffix[0])) return url

  return origin + suffix
}
