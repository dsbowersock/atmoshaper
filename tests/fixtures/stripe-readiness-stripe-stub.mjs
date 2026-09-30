import {
  STRIPE_API_VERSION,
  STRIPE_PINNED_WEBHOOK_EVENTS,
  STRIPE_PINNED_WEBHOOK_URL,
} from "../../lib/stripe-webhook-contract.js"
import {
  LEGACY_SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
  SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
  SUPPORTER_MEMBERSHIP_PRICE_CONTRACT,
} from "../../lib/stripe-price-contract.js"
import {
  buildCurrentSupporterPriceMetadata,
  buildCurrentSupporterProductMetadata,
} from "../../lib/stripe-provider-identity.js"
import { LEGACY_TARGET_PRICE_SPECS } from "../../lib/stripe-supporter-membership-migration-contract.js"
import { getStripeSecretKeyMode } from "../../lib/stripe-secret-key.js"

/** Mirrors runtime live-mode recognition for standard and restricted secret keys. */
function usesLiveStripeKey() {
  return getStripeSecretKeyMode(process.env.STRIPE_SECRET_KEY) === "live"
}

function supporterPrice(priceId) {
  const configuredPrice = SUPPORTER_MEMBERSHIP_PRICE_CONTRACT.find(
    ({ envKey }) => process.env[envKey] === priceId,
  )
  if (!configuredPrice) {
    throw new Error("Unexpected readiness Price fixture")
  }
  if (process.env.STRIPE_READINESS_STUB_FAIL_PRICE_ID === priceId) {
    throw new Error("Simulated Stripe Price retrieval failure")
  }

  const {
    interval,
    productKey,
    productName,
    taxCode,
    unitAmount,
  } = configuredPrice
  const singleSupporterProduct =
    process.env.STRIPE_READINESS_STUB_SINGLE_SUPPORTER_PRODUCT === "true"
  return {
    id: priceId,
    active: true,
    billing_scheme: "per_unit",
    currency: "usd",
    unit_amount: unitAmount,
    recurring: {
      interval,
      interval_count: 1,
      trial_period_days: null,
      usage_type: "licensed",
    },
    tax_behavior: "exclusive",
    transform_quantity: null,
    currency_options: null,
    product: {
      // Model the retired topology as one internally consistent Product so
      // per-slot metadata checks and aggregate topology checks both run.
      id: singleSupporterProduct
        ? "prod_support_1"
        : `prod_${productKey.replaceAll("-", "_")}`,
      active: true,
      name: productName,
      tax_code: taxCode,
      metadata: {
        app: "atmoshaper",
        atmoshaper_catalog: SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
        atmoshaper_membership_level: "SUPPORTER",
        atmoshaper_supporter_amount_choice: productKey,
      },
    },
  }
}

/** Returns exact retained v1 Price evidence for semantic and Portal validation. */
function legacySupporterPrice(priceId) {
  const expected = LEGACY_TARGET_PRICE_SPECS.find(
    ({ envKey }) => process.env[envKey] === priceId,
  )
  if (!expected) throw new Error("Unexpected retained v1 Price fixture")
  if (process.env.STRIPE_READINESS_STUB_FAIL_PRICE_ID === priceId) {
    throw new Error("Simulated Stripe Price retrieval failure")
  }
  const livemode = usesLiveStripeKey()
  const price = {
    id: priceId,
    active: true,
    livemode,
    billing_scheme: "per_unit",
    currency: "usd",
    unit_amount: expected.unitAmount,
    recurring: {
      interval: expected.interval,
      interval_count: 1,
      trial_period_days: null,
      usage_type: "licensed",
    },
    transform_quantity: null,
    currency_options: null,
    metadata: buildCurrentSupporterPriceMetadata({}, expected.key, {
      catalogVersion: LEGACY_SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
    }),
    product: {
      id: `prod_v1_${expected.productKey}`,
      active: true,
      livemode,
      name: expected.productName,
      tax_code: expected.taxCode,
      metadata: buildCurrentSupporterProductMetadata({}, expected.productKey, {
        catalogVersion: LEGACY_SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
      }),
    },
  }
  switch (process.env.STRIPE_READINESS_STUB_INVALID_LEGACY_PRICE) {
    case "inactive": price.active = false; break
    case "amount": price.unit_amount += 1; break
    case "interval": price.recurring.interval = expected.interval === "month" ? "year" : "month"; break
    case "product-inactive": price.product.active = false; break
    case "product": price.product.tax_code = "txcd_unrelated"; break
    case "product-metadata": price.product.metadata = {}; break
    case "price-metadata": price.metadata = {}; break
    default: break
  }
  return price
}

/** Builds the exact use-specific Product and Price allowlist for one Portal. */
function supporterPortal(supporterUse) {
  const expectedId = process.env[
    `STRIPE_SUPPORTER_${supporterUse.toUpperCase()}_PORTAL_CONFIGURATION_ID`
  ]
  if (!expectedId || expectedId === "bpc_stale") {
    throw new Error("Simulated Stripe Portal retrieval failure")
  }

  const configuredUse = process.env.STRIPE_READINESS_STUB_SWAP_PORTALS === "true"
    ? supporterUse === "personal" ? "business" : "personal"
    : supporterUse
  const products = new Map()
  for (const contract of SUPPORTER_MEMBERSHIP_PRICE_CONTRACT) {
    if (contract.supporterUse !== configuredUse) continue
    const productId = `prod_${contract.productKey.replaceAll("-", "_")}`
    const prices = products.get(productId) ?? []
    prices.push(process.env[contract.envKey])
    products.set(productId, prices)
  }
  const allowlist = [...products].map(([product, prices]) => ({
    product,
    prices,
    adjustable_quantity: { enabled: false },
  }))
  if (process.env.STRIPE_READINESS_STUB_INVALID_PORTAL_ALLOWLIST === supporterUse) {
    allowlist[0].prices = ["price_unrelated"]
  }

  const livemode = usesLiveStripeKey()
  const liveDefaultSupporterUse = process.env.STRIPE_READINESS_STUB_LIVE_DEFAULT_USE
    ?? "personal"
  const configuration = {
    id: expectedId,
    active: true,
    is_default: livemode && supporterUse === liveDefaultSupporterUse,
    livemode,
    business_profile: {
      headline: "Manage your AtmoShaper Supporter membership.",
      privacy_policy_url: "https://www.atmoshaper.com/legal/privacy",
      terms_of_service_url: "https://www.atmoshaper.com/legal/terms",
    },
    default_return_url: "https://www.atmoshaper.com/account?tab=membership",
    metadata: {
      app: "atmoshaper",
      atmoshaper_catalog: SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
      atmoshaper_membership_level: "SUPPORTER",
      atmoshaper_portal_supporter_use: configuredUse,
    },
    features: {
      customer_update: {
        enabled: true,
        allowed_updates: ["address", "email", "name"],
      },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: {
        enabled: true,
        mode: "at_period_end",
        proration_behavior: "none",
        cancellation_reason: {
          enabled: true,
          options: [
            "missing_features",
            "other",
            "switched_service",
            "too_expensive",
            "unused",
          ],
        },
      },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ["price"],
        billing_cycle_anchor: "unchanged",
        proration_behavior: "none",
        schedule_at_period_end: { conditions: [] },
        trial_update_behavior: "end_trial",
        products: allowlist,
      },
    },
  }
  if (process.env.STRIPE_READINESS_STUB_INVALID_PORTAL_PROFILE === supporterUse) {
    configuration.business_profile.headline = "Stale Portal profile"
  }
  if (process.env.STRIPE_READINESS_STUB_OMIT_MANAGED_PORTAL_PRODUCTS === "true") {
    delete configuration.features.subscription_update.products
  }
  return configuration
}

/** Builds the retained default Portal profile inherited by managed Portals. */
function defaultPortal() {
  const products = new Map()
  for (const expected of LEGACY_TARGET_PRICE_SPECS) {
    const entry = products.get(expected.productKey) ?? {
      product: `prod_v1_${expected.productKey}`,
      prices: [],
      adjustable_quantity: { enabled: false },
    }
    entry.prices.push(process.env[expected.envKey])
    products.set(expected.productKey, entry)
  }
  const configuration = {
    id: "bpc_default",
    active: true,
    is_default: true,
    livemode: usesLiveStripeKey(),
    business_profile: {
      headline: "Manage your AtmoShaper Supporter membership.",
      privacy_policy_url: "https://www.atmoshaper.com/legal/privacy",
      terms_of_service_url: "https://www.atmoshaper.com/legal/terms",
    },
    default_return_url: "https://www.atmoshaper.com/account?tab=membership",
    features: {
      customer_update: {
        enabled: true,
        allowed_updates: ["address", "email", "name"],
      },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: {
        enabled: true,
        mode: "at_period_end",
        proration_behavior: "none",
        cancellation_reason: {
          enabled: true,
          options: [
            "missing_features",
            "other",
            "switched_service",
            "too_expensive",
            "unused",
          ],
        },
      },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ["price"],
        billing_cycle_anchor: "unchanged",
        proration_behavior: "none",
        schedule_at_period_end: { conditions: [] },
        trial_update_behavior: "end_trial",
        products: [...products.values()],
      },
    },
  }
  if (process.env.STRIPE_READINESS_STUB_INVALID_DEFAULT_PORTAL === "management") {
    configuration.features.invoice_history.enabled = false
  }
  if (process.env.STRIPE_READINESS_STUB_INVALID_DEFAULT_PORTAL === "transition") {
    configuration.features.subscription_update.proration_behavior = "create_prorations"
  }
  if (process.env.STRIPE_READINESS_STUB_INVALID_DEFAULT_PORTAL === "allowlist") {
    configuration.features.subscription_update.products[0].prices = ["price_unrelated"]
  }
  if (process.env.STRIPE_READINESS_STUB_OMIT_DEFAULT_PORTAL_PRODUCTS === "true") {
    delete configuration.features.subscription_update.products
  }
  return configuration
}

/** Hermetic Stripe client used only by readiness CLI child-process tests. */
export default class StripeReadinessStub {
  constructor(_apiKey, config = {}) {
    // Match the app's pinned Stripe client while preserving explicit test overrides.
    this.config = {
      ...config,
      apiVersion: config.apiVersion ?? STRIPE_API_VERSION,
    }
    this.prices = {
      retrieve: async (priceId) => (
        LEGACY_TARGET_PRICE_SPECS.some(({ envKey }) => process.env[envKey] === priceId)
          ? legacySupporterPrice(priceId)
          : supporterPrice(priceId)
      ),
    }
    this.billingPortal = {
      configurations: {
        list: async (params) => {
          if (params?.expand !== undefined) {
            throw new Error("Portal configuration list must not request unsupported expansions")
          }
          const livemode = usesLiveStripeKey()
          const liveDefaultSupporterUse = process.env.STRIPE_READINESS_STUB_LIVE_DEFAULT_USE
            ?? "personal"
          return {
            data: [livemode ? supporterPortal(liveDefaultSupporterUse) : defaultPortal()],
            has_more: false,
          }
        },
        retrieve: async (configurationId, params) => {
          if (params !== undefined) {
            throw new Error("Portal configuration retrieval must not request unsupported expansions")
          }
          const personalId = process.env.STRIPE_SUPPORTER_PERSONAL_PORTAL_CONFIGURATION_ID
          const businessId = process.env.STRIPE_SUPPORTER_BUSINESS_PORTAL_CONFIGURATION_ID
          if (configurationId === personalId) return supporterPortal("personal")
          if (configurationId === businessId) return supporterPortal("business")
          throw new Error("Unexpected readiness Portal fixture")
        },
      },
    }
    this.webhookEndpoints = {
      list: async () => ({
        data: [{
          url: STRIPE_PINNED_WEBHOOK_URL,
          status: "enabled",
          api_version: this.config.apiVersion,
          enabled_events: [...STRIPE_PINNED_WEBHOOK_EVENTS],
        }],
      }),
    }
  }
}
