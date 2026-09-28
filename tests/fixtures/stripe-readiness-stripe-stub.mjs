import {
  STRIPE_API_VERSION,
  STRIPE_PINNED_WEBHOOK_EVENTS,
  STRIPE_PINNED_WEBHOOK_URL,
} from "../../lib/stripe-webhook-contract.js"
import {
  SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
  SUPPORTER_MEMBERSHIP_PRICE_CONTRACT,
} from "../../lib/stripe-price-contract.js"

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

/** Hermetic Stripe client used only by readiness CLI child-process tests. */
export default class StripeReadinessStub {
  constructor(_apiKey, config = {}) {
    // Match the app's pinned Stripe client while preserving explicit test overrides.
    this.config = {
      ...config,
      apiVersion: config.apiVersion ?? STRIPE_API_VERSION,
    }
    this.prices = {
      retrieve: async (priceId) => supporterPrice(priceId),
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
