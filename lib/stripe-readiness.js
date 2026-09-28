import {
  recurringPriceSemanticMismatches,
  SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
  SUPPORTER_MEMBERSHIP_PRICE_CONTRACT,
  SUPPORTER_RECURRING_TAX_BEHAVIOR,
} from "./stripe-price-contract.js"
import { ONE_TIME_SUPPORT_TAX_CODE } from "./donations.js"
import { classifySupporterProductMetadata } from "./stripe-provider-identity.js"

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
