import {
  SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
  SUPPORTER_RECURRING_TAX_BEHAVIOR,
} from "./stripe-price-contract.js"
import {
  buildCurrentSupporterPriceMetadata,
  buildCurrentSupporterProductMetadata,
} from "./stripe-provider-identity.js"
import { TARGET_PRICE_SPECS } from "./stripe-supporter-membership-migration-contract.js"
import { normalizeSupporterPortalFeatures } from "./stripe-supporter-portal-contract.js"

export const SUPPORTER_V2_USES = Object.freeze(["personal", "business"])

export const SUPPORTER_V2_PORTAL_METADATA_KEYS = Object.freeze([
  "app",
  "atmoshaper_catalog",
  "atmoshaper_membership_level",
  "atmoshaper_portal_supporter_use",
])

export const V2_TARGET_PRICE_SPECS = TARGET_PRICE_SPECS

/** Derives the six immutable amount/use Product targets from the Price contract. */
function buildTargetProductSpecs() {
  const grouped = new Map()
  for (const price of V2_TARGET_PRICE_SPECS) {
    const existing = grouped.get(price.productKey)
    if (existing) {
      if (
        existing.amountChoiceId !== price.amountChoiceId
        || existing.supporterUse !== price.supporterUse
        || existing.productName !== price.productName
        || existing.taxCode !== price.taxCode
      ) {
        throw new Error("Supporter v2 Product contract is contradictory.")
      }
      existing.priceKeys.push(price.key)
      continue
    }
    grouped.set(price.productKey, {
      key: price.productKey,
      amountChoiceId: price.amountChoiceId,
      supporterUse: price.supporterUse,
      productName: price.productName,
      taxCode: price.taxCode,
      priceKeys: [price.key],
    })
  }

  const products = [...grouped.values()].map((product) => {
    const prices = product.priceKeys.map((key) => (
      V2_TARGET_PRICE_SPECS.find((candidate) => candidate.key === key)
    ))
    const month = prices.find((price) => price?.interval === "month")
    const year = prices.find((price) => price?.interval === "year")
    if (prices.length !== 2 || !month || !year || new Set(product.priceKeys).size !== 2) {
      throw new Error("Each Supporter v2 Product must own one monthly and one annual Price.")
    }
    return Object.freeze({
      ...product,
      priceKeys: Object.freeze([...product.priceKeys]),
      description: `$${month.unitAmount / 100} monthly or $${year.unitAmount / 100} annually. Same Supporter Membership benefits; classified for ${product.supporterUse} use.`,
    })
  })
  if (products.length !== 6 || V2_TARGET_PRICE_SPECS.length !== 12) {
    throw new Error("Supporter v2 catalog must contain six Products and twelve Prices.")
  }
  return Object.freeze(products)
}

export const V2_TARGET_PRODUCT_SPECS = buildTargetProductSpecs()

/** Returns the immutable lookup key owned by one v2 Price target. */
export function supporterV2LookupKey(spec) {
  return `atmoshaper_supporter_v2_${spec.key.replaceAll("-", "_")}`
}

/** Returns the one v2 target whose immutable lookup key a Price claims. */
export function supporterV2PriceSpecForLookupKey(lookupKey) {
  return V2_TARGET_PRICE_SPECS.find(
    (spec) => supporterV2LookupKey(spec) === lookupKey,
  ) ?? null
}

/** Builds the exact create payload for one managed v2 Product. */
export function buildSupporterV2ProductPayload(spec) {
  return {
    name: spec.productName,
    description: spec.description,
    active: true,
    tax_code: spec.taxCode,
    metadata: buildCurrentSupporterProductMetadata({}, spec.key),
  }
}

/** Builds the exact create payload for one managed v2 recurring Price. */
export function buildSupporterV2PricePayload(spec, productId) {
  return {
    product: productId,
    unit_amount: spec.unitAmount,
    currency: "usd",
    billing_scheme: "per_unit",
    recurring: {
      interval: spec.interval,
      interval_count: 1,
      usage_type: "licensed",
    },
    tax_behavior: SUPPORTER_RECURRING_TAX_BEHAVIOR,
    lookup_key: supporterV2LookupKey(spec),
    transfer_lookup_key: false,
    metadata: buildCurrentSupporterPriceMetadata({}, spec.key),
  }
}

/** Returns the deterministic create key for one managed v2 Product. */
export function supporterV2ProductIdempotencyKey(spec) {
  return `atmoshaper:supporter:v2:product:${spec.key}`
}

/** Returns the deterministic create key for one managed v2 Price. */
export function supporterV2PriceIdempotencyKey(spec) {
  return `atmoshaper:supporter:v2:price:${spec.key}`
}

/** Returns the deterministic create key for one use-specific managed Portal. */
export function supporterV2PortalIdempotencyKey(supporterUse) {
  return `atmoshaper:supporter:v2:portal:${supporterUse}`
}

/** Builds the exact managed metadata for one use-specific v2 Portal. */
export function buildSupporterV2PortalMetadata(supporterUse) {
  return {
    app: "atmoshaper",
    atmoshaper_catalog: SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
    atmoshaper_membership_level: "SUPPORTER",
    atmoshaper_portal_supporter_use: supporterUse,
  }
}

/** Reports whether a Portal carries any managed v2 Portal metadata key. */
export function hasAnySupporterV2PortalMetadata(value) {
  return Boolean(value && typeof value === "object" && SUPPORTER_V2_PORTAL_METADATA_KEYS.some(
    (key) => Object.hasOwn(value, key),
  ))
}

/** Returns the trusted use classification for exact managed Portal metadata. */
export function classifySupporterV2PortalMetadata(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const supporterUse = value.atmoshaper_portal_supporter_use
  if (
    value.app !== "atmoshaper"
    || value.atmoshaper_catalog !== SUPPORTER_MEMBERSHIP_CATALOG_VERSION
    || value.atmoshaper_membership_level !== "SUPPORTER"
    || !SUPPORTER_V2_USES.includes(supporterUse)
  ) {
    return null
  }
  return supporterUse
}

/**
 * Validates the managed Portal default slot for the selected deployment
 * topology. Sandbox keeps both v2 Portals non-default beside retained v1,
 * while the dedicated live account may use personal as its only default.
 */
export function managedSupporterPortalDefaultStatusMatches(
  configuration,
  supporterUse,
  { personalMayBeDefault = false } = {},
) {
  return configuration?.is_default === false
    || (
      personalMayBeDefault
      && supporterUse === "personal"
      && configuration?.is_default === true
    )
}

/** Builds use-specific Portal features from a reviewed management baseline. */
export function buildSupporterV2PortalFeatures(
  managementFeatures,
  supporterUse,
  products,
  prices,
  { create = false } = {},
) {
  const base = normalizeSupporterPortalFeatures(managementFeatures)
  const targetProducts = V2_TARGET_PRODUCT_SPECS
    .filter((product) => product.supporterUse === supporterUse)
    .map((product) => ({
      product: products.get(product.key).id,
      prices: product.priceKeys.map((key) => prices.get(key).id).sort(),
      adjustable_quantity: { enabled: false },
    }))
    .sort((left, right) => left.product.localeCompare(right.product))

  return {
    customer_update: base.customer_update,
    invoice_history: base.invoice_history,
    payment_method_update: base.payment_method_update,
    subscription_cancel: base.subscription_cancel,
    subscription_update: {
      enabled: true,
      default_allowed_updates: ["price"],
      billing_cycle_anchor: "unchanged",
      proration_behavior: "none",
      ...(create ? {} : { schedule_at_period_end: { conditions: "" } }),
      trial_update_behavior: "end_trial",
      products: targetProducts,
    },
  }
}

/**
 * Builds a managed Portal request while excluding response-only and
 * update-only fields from Stripe's configuration-create endpoint.
 */
export function buildSupporterV2PortalPayload(
  profileSource,
  supporterUse,
  products,
  prices,
  { create = false } = {},
) {
  const businessProfile = Object.fromEntries(Object.entries({
    headline: profileSource.business_profile?.headline,
    privacy_policy_url: profileSource.business_profile?.privacy_policy_url,
    terms_of_service_url: profileSource.business_profile?.terms_of_service_url,
  }).flatMap(([key, value]) => {
    if (typeof value === "string" && value.length > 0) return [[key, value]]
    return create ? [] : [[key, ""]]
  }))

  return {
    ...(create ? { name: `AtmoShaper Supporter Portal — ${supporterUse}` } : {}),
    ...(create ? {} : { active: true }),
    ...(Object.keys(businessProfile).length > 0 ? { business_profile: businessProfile } : {}),
    ...(
      profileSource.default_return_url || !create
        ? { default_return_url: profileSource.default_return_url ?? "" }
        : {}
    ),
    features: buildSupporterV2PortalFeatures(
      profileSource.features,
      supporterUse,
      products,
      prices,
      { create },
    ),
    metadata: buildSupporterV2PortalMetadata(supporterUse),
  }
}
