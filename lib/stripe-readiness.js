import {
  LEGACY_SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
  recurringPriceSemanticMismatches,
  SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
  SUPPORTER_MEMBERSHIP_PRICE_CONTRACT,
  SUPPORTER_RECURRING_TAX_BEHAVIOR,
} from "./stripe-price-contract.js"
import { ONE_TIME_SUPPORT_TAX_CODE } from "./donations.js"
import {
  classifySupporterPriceMetadata,
  classifySupporterProductMetadata,
} from "./stripe-provider-identity.js"
import { LEGACY_TARGET_PRICE_SPECS } from "./stripe-supporter-membership-migration-contract.js"
import {
  DEFAULT_SUPPORTER_PORTAL_CATALOG_CONFIRMATION,
  hasApprovedSupporterPortalManagementFeatures,
  hasApprovedSupporterPortalTransitionPolicy,
  normalizeSupporterPortalProfile,
  retainedDefaultSupporterPortalAllowlistIsVerified,
  supporterPortalAllowlistMatches,
} from "./stripe-supporter-portal-contract.js"

export {
  SUPPORTER_RECURRING_TAX_BEHAVIOR,
}

/**
 * The deployed Supporter catalog is a fixed set of twelve recurring USD
 * Prices across six use-classified Products.
 * Keep this contract separate from historical webhook price normalization.
 */
export const REQUIRED_SUPPORTER_PRICE_CONTRACT = Object.freeze([
  ...SUPPORTER_MEMBERSHIP_PRICE_CONTRACT.map(({
    envKey,
    amountChoiceId,
    supporterUse,
    productKey,
    productName,
    taxCode,
    level,
    interval,
    unitAmount,
  }) => Object.freeze({
    key: envKey,
    amountChoiceId,
    supporterUse,
    productKey,
    productName,
    taxCode,
    level,
    interval,
    unitAmount,
  })),
])

/**
 * Accepts only the explicit boolean or case-insensitive string `true` used by
 * operator readiness attestations; truthy aliases remain fail-closed.
 */
export function isExplicitTrue(value) {
  return String(value ?? "").trim().toLowerCase() === "true"
}

/**
 * Resolves the operator attestations that must all be explicit before a new
 * Supporter Checkout Session can request Stripe Automatic Tax.
 */
export function getSupporterRecurringTaxReadiness(env = process.env) {
  const automaticTaxEnabled = isExplicitTrue(
    env.STRIPE_SUPPORTER_AUTOMATIC_TAX_ENABLED,
  )
  const taxProductCodeConfigured = REQUIRED_SUPPORTER_PRICE_CONTRACT.every((entry) => {
    const environmentKey = `STRIPE_SUPPORTER_${entry.supporterUse.toUpperCase()}_TAX_PRODUCT_CODE`
    return String(env[environmentKey] ?? "").trim() === entry.taxCode
  })
  const taxProviderReady = isExplicitTrue(
    env.STRIPE_SUPPORTER_TAX_PROVIDER_READY,
  )
  const taxRegistrationsReady = isExplicitTrue(
    env.STRIPE_SUPPORTER_TAX_REGISTRATIONS_READY,
  )
  const taxClassificationConfirmed = isExplicitTrue(
    env.STRIPE_SUPPORTER_TAX_CLASSIFICATION_CONFIRMED,
  )

  return {
    automaticTaxEnabled,
    taxProductCodeConfigured,
    taxProviderReady,
    taxRegistrationsReady,
    taxClassificationConfirmed,
    ready: automaticTaxEnabled
      && taxProductCodeConfigured
      && taxProviderReady
      && taxRegistrationsReady
      && taxClassificationConfirmed,
  }
}

// Keep recurring-membership and one-time-support normalization explicit and
// separate: their environment gates and reviewed tax classifications must not
// become interchangeable through a shared configuration path.
/**
 * Resolves the independent operator attestations required before one-time
 * support can request Stripe Automatic Tax under its reviewed classification.
 *
 * @param {Record<string, string | undefined>} [env=process.env] Environment
 * containing `STRIPE_ONE_TIME_SUPPORT_AUTOMATIC_TAX_ENABLED`,
 * `STRIPE_ONE_TIME_SUPPORT_TAX_PRODUCT_CODE`,
 * `STRIPE_ONE_TIME_SUPPORT_TAX_PROVIDER_READY`,
 * `STRIPE_ONE_TIME_SUPPORT_TAX_REGISTRATIONS_READY`, and
 * `STRIPE_ONE_TIME_SUPPORT_TAX_CLASSIFICATION_CONFIRMED`.
 * @returns {{automaticTaxEnabled: boolean, taxProductCodeConfigured: boolean,
 * taxProviderReady: boolean, taxRegistrationsReady: boolean,
 * taxClassificationConfirmed: boolean, ready: boolean}} The five normalized
 * attestations and a fail-closed aggregate that is true only when all five are
 * valid.
 */
export function getOneTimeSupportTaxReadiness(env = process.env) {
  const automaticTaxEnabled = isExplicitTrue(
    env.STRIPE_ONE_TIME_SUPPORT_AUTOMATIC_TAX_ENABLED,
  )
  const taxProductCodeConfigured = String(
    env.STRIPE_ONE_TIME_SUPPORT_TAX_PRODUCT_CODE ?? "",
  ).trim() === ONE_TIME_SUPPORT_TAX_CODE
  const taxProviderReady = isExplicitTrue(
    env.STRIPE_ONE_TIME_SUPPORT_TAX_PROVIDER_READY,
  )
  const taxRegistrationsReady = isExplicitTrue(
    env.STRIPE_ONE_TIME_SUPPORT_TAX_REGISTRATIONS_READY,
  )
  const taxClassificationConfirmed = isExplicitTrue(
    env.STRIPE_ONE_TIME_SUPPORT_TAX_CLASSIFICATION_CONFIRMED,
  )

  return {
    automaticTaxEnabled,
    taxProductCodeConfigured,
    taxProviderReady,
    taxRegistrationsReady,
    taxClassificationConfirmed,
    ready: automaticTaxEnabled
      && taxProductCodeConfigured
      && taxProviderReady
      && taxRegistrationsReady
      && taxClassificationConfirmed,
  }
}

/**
 * Validates one retrieved recurring Supporter Price against its public catalog
 * slot.
 *
 * @param {object} price Stripe Price retrieved with both `product` and
 * `currency_options` expanded.
 * @param {{key: string, interval: string, unitAmount: number}} expected The
 * environment key and exact recurring amount/interval contract for this slot.
 * @returns {string[]} Non-secret operator-facing failures; an empty array means
 * the active USD Price, Product tax code, and expanded currency set are exact.
 *
 * The caller owns Stripe retrieval and reporting. A string Product reference
 * or omitted `currency_options` is insufficient evidence and fails closed.
 */
export function validateRetrievedMembershipPrice(price, expected) {
  const failures = []

  if (price?.active !== true) {
    failures.push(`${expected.key} points to an inactive Stripe Price.`)
  }

  const semanticFailures = recurringPriceSemanticMismatches(price, {
    interval: expected.interval,
    unitAmount: expected.unitAmount,
    taxBehavior: SUPPORTER_RECURRING_TAX_BEHAVIOR,
  })
  const semanticMessages = {
    unit_amount: `${expected.key} must have unit_amount ${expected.unitAmount}; received ${price?.unit_amount ?? "missing"}.`,
    currency: `${expected.key} must use usd currency; received ${price?.currency ?? "missing"}.`,
    billing_scheme: `${expected.key} billing_scheme must be per_unit.`,
    "recurring.interval": `${expected.key} must be a ${expected.interval} recurring Price.`,
    "recurring.interval_count": `${expected.key} recurring interval_count must be exactly 1.`,
    "recurring.trial_period_days": `${expected.key} must not define a recurring trial period.`,
    "recurring.usage_type": `${expected.key} recurring usage_type must be licensed.`,
    tax_behavior: `${expected.key} must use exclusive tax behavior.`,
    transform_quantity: `${expected.key} must not transform quantity.`,
    currency_options: Object.hasOwn(price ?? {}, "currency_options")
      ? `${expected.key} must not define additional currency options.`
      : `${expected.key} must be retrieved with currency_options expanded.`,
  }

  for (const semanticFailure of semanticFailures) {
    failures.push(
      semanticMessages[semanticFailure]
      ?? `${expected.key} failed an unmapped recurring Price check: ${semanticFailure}.`,
    )
  }

  const product = (
    price?.product
    && typeof price.product !== "string"
  )
    ? price.product
    : null
  if (!product) {
    failures.push(`${expected.key} Product must be expanded for validation.`)
  } else {
    if (product.active !== true) {
      failures.push(`${expected.key} belongs to an inactive Stripe Product.`)
    }
    if (product.name !== expected.productName) {
      failures.push(`${expected.key} Product name must be ${expected.productName}.`)
    }
    if (product.tax_code !== expected.taxCode) {
      failures.push(`${expected.key} Product must use tax code ${expected.taxCode}.`)
    }
    // Product metadata is authorization evidence, not descriptive copy. The
    // Both metadata namespaces remain readable, but public v2 authorization
    // requires the v2 catalog stamp as well as the expected Product identity.
    const productIdentity = classifySupporterProductMetadata(product.metadata, {
      catalogVersion: SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
    })
    const expectedProductKey = (
      typeof expected?.productKey === "string"
      && expected.productKey.length > 0
    )
      ? expected.productKey
      : null
    if (!expectedProductKey) {
      failures.push(`${expected.key} Price contract must identify a string Product key.`)
    } else if (productIdentity?.amountChoiceId !== expectedProductKey) {
      failures.push(`${expected.key} Product must identify Product key ${expectedProductKey}.`)
    }
  }

  return failures
}

/**
 * Verifies the twelve expanded Prices form six Products: one monthly and one
 * annual Price for each amount/use pair, with no Product shared across pairs.
 */
export function validateSupporterProductTopology(entries) {
  const failures = []
  const productIdsByKey = new Map()

  for (const { expected, price } of entries) {
    const productId = typeof price?.product === "string"
      ? price.product
      : price?.product?.id
    // Per-Price validation reports malformed entries; topology counts only
    // resolved amount-choice-to-Product relationships.
    if (!productId || !expected?.productKey) continue
    const ids = productIdsByKey.get(expected.productKey) ?? new Set()
    ids.add(productId)
    productIdsByKey.set(expected.productKey, ids)
  }

  const expectedProductKeys = [...new Set(
    REQUIRED_SUPPORTER_PRICE_CONTRACT.map(({ productKey }) => productKey),
  )]
  for (const productKey of expectedProductKeys) {
    const observedIds = [...(productIdsByKey.get(productKey) ?? [])].sort()
    if (observedIds.length !== 1) {
      const idDetails = observedIds.length > 0
        ? ` (${observedIds.join(", ")})`
        : ""
      failures.push(
        `Supporter Product key ${productKey} must use exactly one Stripe Product; found ${observedIds.length}${idDetails}.`,
      )
    }
  }

  const productIds = [...productIdsByKey.values()]
    .flatMap((ids) => [...ids])
  const distinctProductIds = [...new Set(productIds)].sort()
  if (distinctProductIds.length !== expectedProductKeys.length) {
    const idDetails = distinctProductIds.length > 0
      ? ` (${distinctProductIds.join(", ")})`
      : ""
    failures.push(
      `The Supporter catalog must use ${expectedProductKeys.length} distinct amount-and-use Stripe Products; found ${distinctProductIds.length}${idDetails}.`,
    )
  }

  return failures
}

/**
 * Validates one retained v1 Price and its expanded Product before either is
 * trusted as evidence for the default Customer Portal allowlist.
 */
export function validateRetrievedLegacyMembershipPrice(price, expected, livemode) {
  const failures = []

  if (price?.active !== true || price?.livemode !== livemode) {
    failures.push(
      `${expected.envKey} must identify an active retained v1 Stripe Price in the selected mode.`,
    )
  }
  if (recurringPriceSemanticMismatches(price, {
    interval: expected.interval,
    unitAmount: expected.unitAmount,
  }).length > 0) {
    failures.push(`${expected.envKey} does not match the retained v1 recurring Price contract.`)
  }
  const priceIdentity = classifySupporterPriceMetadata(price?.metadata, {
    catalogVersion: LEGACY_SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
  })
  if (priceIdentity?.priceKey !== expected.key) {
    failures.push(`${expected.envKey} metadata does not identify the retained v1 Price.`)
  }

  const product = price?.product && typeof price.product !== "string"
    ? price.product
    : null
  if (!product) {
    failures.push(`${expected.envKey} must expand its retained v1 Stripe Product.`)
  } else {
    if (product.active !== true || product.livemode !== livemode) {
      failures.push(
        `${expected.envKey} must expand an active retained v1 Stripe Product in the selected mode.`,
      )
    }
    if (product.name !== expected.productName || product.tax_code !== expected.taxCode) {
      failures.push(`${expected.envKey} Product does not match the retained v1 semantic contract.`)
    }
    const productIdentity = classifySupporterProductMetadata(product.metadata, {
      catalogVersion: LEGACY_SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
    })
    if (productIdentity?.amountChoiceId !== expected.productKey) {
      failures.push(`${expected.envKey} Product metadata does not identify the retained v1 Product.`)
    }
  }

  return failures
}

/** Resolves an expanded Stripe object or bare object ID to its stable ID. */
function stripeObjectId(value) {
  return typeof value === "string" ? value : value?.id
}

/**
 * Canonicalizes a Portal subscription-update allowlist for exact comparison.
 * Product entries and nested Price IDs are sorted because Stripe does not
 * promise response ordering for either collection.
 */
/**
 * Validates one retrieved use-specific Customer Portal against the exact
 * Product and Price evidence already retrieved for Supporter readiness.
 */
export function validateRetrievedSupporterPortalConfiguration(
  configuration,
  {
    configurationId,
    supporterUse,
    retrievedMembershipPrices,
    livemode,
    defaultConfiguration,
  },
) {
  const environmentKey = `STRIPE_SUPPORTER_${supporterUse.toUpperCase()}_PORTAL_CONFIGURATION_ID`
  const failures = []
  if (configuration?.id !== configurationId) {
    failures.push(`${environmentKey} retrieved an unexpected Stripe Portal configuration.`)
  }
  if (
    configuration?.active !== true
    || configuration?.is_default !== false
    || configuration?.livemode !== livemode
  ) {
    failures.push(
      `${environmentKey} must identify an active non-default Portal in the selected Stripe mode.`,
    )
  }
  if (
    configuration?.metadata?.app !== "atmoshaper"
    || configuration?.metadata?.atmoshaper_catalog !== SUPPORTER_MEMBERSHIP_CATALOG_VERSION
    || configuration?.metadata?.atmoshaper_membership_level !== "SUPPORTER"
    || configuration?.metadata?.atmoshaper_portal_supporter_use !== supporterUse
  ) {
    failures.push(`${environmentKey} metadata must identify the ${supporterUse} Supporter Portal.`)
  }
  if (!hasApprovedSupporterPortalTransitionPolicy(configuration?.features)) {
    failures.push(
      `${environmentKey} must preserve the reviewed Price-only, unchanged-cycle, non-prorated subscription-update behavior.`,
    )
  }
  if (!hasApprovedSupporterPortalManagementFeatures(configuration?.features)) {
    failures.push(
      `${environmentKey} must preserve the reviewed customer, invoice, payment-method, and cancellation-management behavior.`,
    )
  }

  const expectedEntries = retrievedMembershipPrices.filter(
    ({ expected }) => expected?.supporterUse === supporterUse,
  )
  const expectedProducts = new Map()
  for (const { price, expected } of expectedEntries) {
    const productId = stripeObjectId(price?.product)
    if (!productId || typeof price?.id !== "string") continue
    const entry = expectedProducts.get(expected.productKey) ?? {
      product: productId,
      prices: [],
      adjustable_quantity: { enabled: false },
    }
    if (entry.product !== productId) {
      entry.product = null
    }
    entry.prices.push(price.id)
    expectedProducts.set(expected.productKey, entry)
  }
  const expectedAllowlist = [...expectedProducts.values()]
    .map((entry) => ({ ...entry, prices: entry.prices.sort() }))
    .sort((left, right) => String(left.product).localeCompare(String(right.product)))
  const expectedContractCount = REQUIRED_SUPPORTER_PRICE_CONTRACT.filter(
    (entry) => entry.supporterUse === supporterUse,
  ).length
  if (
    expectedEntries.length !== expectedContractCount
    || expectedProducts.size !== expectedContractCount / 2
    || !supporterPortalAllowlistMatches(configuration?.features, expectedAllowlist)
  ) {
    failures.push(
      `${environmentKey} Product and Price allowlist does not match the ${supporterUse} Supporter catalog.`,
    )
  }
  if (
    !defaultConfiguration
    || JSON.stringify(normalizeSupporterPortalProfile(configuration))
    !== JSON.stringify(normalizeSupporterPortalProfile(defaultConfiguration))
  ) {
    failures.push(
      `${environmentKey} must inherit the retained default Portal profile and return URL.`,
    )
  }

  return failures
}

/**
 * Validates the retained default Portal used by historical v1 subscriptions.
 * The retrieved legacy Prices supply the provider-owned Product IDs needed for
 * an exact three-Product/six-Price allowlist comparison.
 */
export function validateRetrievedDefaultSupporterPortalConfiguration(
  configuration,
  {
    defaultPortalCatalogConfirmation = "",
    retrievedLegacyMembershipPrices,
    livemode,
  },
) {
  const failures = []
  if (
    configuration?.active !== true
    || configuration?.is_default !== true
    || configuration?.livemode !== livemode
  ) {
    failures.push(
      "The retained default Stripe Portal must remain active, default, and in the selected mode.",
    )
  }
  if (!hasApprovedSupporterPortalManagementFeatures(configuration?.features)) {
    failures.push(
      "The retained default Stripe Portal must preserve the reviewed customer, invoice, payment-method, and cancellation-management behavior.",
    )
  }
  if (!hasApprovedSupporterPortalTransitionPolicy(configuration?.features)) {
    failures.push(
      "The retained default Stripe Portal must preserve the reviewed Price-only, unchanged-cycle, non-prorated subscription-update behavior.",
    )
  }

  const expectedEntries = Array.isArray(retrievedLegacyMembershipPrices)
    ? retrievedLegacyMembershipPrices
    : []
  const expectedProducts = new Map()
  for (const { price, expected } of expectedEntries) {
    const productId = stripeObjectId(price?.product)
    const priceId = stripeObjectId(price)
    const entry = expectedProducts.get(expected?.productKey) ?? {
      product: productId ?? null,
      prices: [],
      adjustable_quantity: { enabled: false },
    }
    if (entry.product !== productId) entry.product = null
    if (priceId) entry.prices.push(priceId)
    expectedProducts.set(expected?.productKey, entry)
  }
  const expectedAllowlist = [...expectedProducts.values()]
  const productsReturned = configuration?.features
    ?.subscription_update?.products !== undefined
  const allowlistVerified = retainedDefaultSupporterPortalAllowlistIsVerified(
    configuration?.features,
    expectedAllowlist,
    defaultPortalCatalogConfirmation,
  )
  const expectedCatalogComplete = (
    expectedEntries.length === LEGACY_TARGET_PRICE_SPECS.length
    && expectedProducts.size === 3
  )
  if (!expectedCatalogComplete) {
    failures.push(
      "The complete retained v1 Price inventory is required before validating the default Stripe Portal catalog.",
    )
  } else if (!allowlistVerified) {
    failures.push(!productsReturned
      ? `Stripe omitted the retained default Portal catalog; ATMOSHAPER_STRIPE_DEFAULT_PORTAL_CATALOG_CONFIRMATION must equal ${DEFAULT_SUPPORTER_PORTAL_CATALOG_CONFIRMATION} only after the exact three-Product/six-Price v1 catalog is verified in the Dashboard.`
      : "The retained default Stripe Portal Product and Price allowlist must match the complete v1 Supporter catalog.")
  }
  return failures
}
