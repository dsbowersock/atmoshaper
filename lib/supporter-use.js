/**
 * Canonical buyer-declared uses for new Supporter membership Checkout.
 * Request input selects only an ID; tax codes remain application-owned.
 */
export const SUPPORTER_USE_OPTIONS = Object.freeze([
  Object.freeze({
    id: "personal",
    label: "Personal use",
    description: "I am buying this membership for my own non-business use.",
    taxCode: "txcd_10103000",
  }),
  Object.freeze({
    id: "business",
    label: "Business use",
    description: "I am buying this membership for use in my work or business.",
    taxCode: "txcd_10103001",
  }),
])

/** Returns a canonical use definition or null for unsupported input. */
export function supporterUseOption(value) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : ""
  return SUPPORTER_USE_OPTIONS.find(({ id }) => id === normalized) ?? null
}

/** Returns the canonical use ID or null without exposing tax-code selection. */
export function normalizeSupporterUse(value) {
  return supporterUseOption(value)?.id ?? null
}

/** Reports whether a value resolves to an approved buyer-use declaration. */
export function isSupporterUse(value) {
  return normalizeSupporterUse(value) !== null
}
