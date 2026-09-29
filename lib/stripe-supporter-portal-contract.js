export const APPROVED_SUPPORTER_PORTAL_CANCELLATION_REASONS = Object.freeze([
  "missing_features",
  "other",
  "switched_service",
  "too_expensive",
  "unused",
])

export const DEFAULT_SUPPORTER_PORTAL_CATALOG_CONFIRMATION =
  "CONFIRM_RETAINED_V1_SUPPORTER_CATALOG_3_PRODUCTS_6_PRICES"

export const MANAGED_SUPPORTER_PORTAL_CATALOG_CONFIRMATION =
  "CONFIRM_MANAGED_V2_SUPPORTER_PORTALS_3_PRODUCTS_6_PRICES_EACH"

/** Resolves an expanded Stripe object or bare object ID to its stable ID. */
function stripeObjectId(value) {
  return typeof value === "string" ? value : value?.id
}

/** Canonicalizes the cancellation-reason response for exact comparison. */
function normalizeCancellationReason(value) {
  return {
    enabled: value?.enabled === true,
    options: Array.isArray(value?.options) ? [...value.options].sort() : [],
  }
}

/** Canonicalizes a Portal Product/Price allowlist independent of Stripe order. */
export function normalizeSupporterPortalProducts(products) {
  return Array.isArray(products)
    ? products.map((entry) => ({
      product: stripeObjectId(entry?.product) ?? null,
      prices: Array.isArray(entry?.prices)
        ? entry.prices.map(stripeObjectId).sort()
        : [],
      adjustable_quantity: {
        enabled: entry?.adjustable_quantity?.enabled === true,
      },
    })).sort((left, right) => String(left.product).localeCompare(String(right.product)))
    : []
}

/** Canonicalizes the customer-facing profile inherited by managed Portals. */
export function normalizeSupporterPortalProfile(configuration) {
  const normalizeText = (value) => (
    typeof value === "string" && value.length > 0 ? value : null
  )
  return {
    business_profile: {
      headline: normalizeText(configuration?.business_profile?.headline),
      privacy_policy_url: normalizeText(
        configuration?.business_profile?.privacy_policy_url,
      ),
      terms_of_service_url: normalizeText(
        configuration?.business_profile?.terms_of_service_url,
      ),
    },
    default_return_url: normalizeText(configuration?.default_return_url),
  }
}

/**
 * Canonicalizes every Customer Portal feature owned by the Supporter rollout.
 * Stripe does not promise response ordering for option or Product collections.
 */
export function normalizeSupporterPortalFeatures(features) {
  return {
    customer_update: {
      enabled: features?.customer_update?.enabled === true,
      allowed_updates: Array.isArray(features?.customer_update?.allowed_updates)
        ? [...features.customer_update.allowed_updates].sort()
        : [],
    },
    invoice_history: { enabled: features?.invoice_history?.enabled === true },
    payment_method_update: { enabled: features?.payment_method_update?.enabled === true },
    subscription_cancel: {
      enabled: features?.subscription_cancel?.enabled === true,
      mode: features?.subscription_cancel?.mode ?? null,
      proration_behavior: features?.subscription_cancel?.proration_behavior ?? null,
      cancellation_reason: normalizeCancellationReason(
        features?.subscription_cancel?.cancellation_reason,
      ),
    },
    subscription_update: {
      enabled: features?.subscription_update?.enabled === true,
      default_allowed_updates: Array.isArray(
        features?.subscription_update?.default_allowed_updates,
      )
        ? [...features.subscription_update.default_allowed_updates].sort()
        : [],
      billing_cycle_anchor: features?.subscription_update?.billing_cycle_anchor ?? null,
      proration_behavior: features?.subscription_update?.proration_behavior ?? null,
      schedule_at_period_end: {
        conditions: Array.isArray(
          features?.subscription_update?.schedule_at_period_end?.conditions,
        )
          ? features.subscription_update.schedule_at_period_end.conditions
            .map((condition) => condition?.type ?? "")
            .filter(Boolean)
            .sort()
          : [],
      },
      trial_update_behavior: features?.subscription_update?.trial_update_behavior ?? null,
      products: normalizeSupporterPortalProducts(
        features?.subscription_update?.products,
      ),
    },
  }
}

/** Checks the exact non-prorated Price-transition policy shared by all Portals. */
export function hasApprovedSupporterPortalTransitionPolicy(features) {
  const update = normalizeSupporterPortalFeatures(features).subscription_update
  return update.enabled
    && JSON.stringify(update.default_allowed_updates) === JSON.stringify(["price"])
    && update.billing_cycle_anchor === "unchanged"
    && update.proration_behavior === "none"
    && update.schedule_at_period_end.conditions.length === 0
    && update.trial_update_behavior === "end_trial"
}

/** Checks that a Portal exposes exactly the supplied Product and Price allowlist. */
export function supporterPortalAllowlistMatches(features, expectedProducts) {
  const actual = normalizeSupporterPortalFeatures(features).subscription_update.products
  const expected = normalizeSupporterPortalProducts(expectedProducts)
  return JSON.stringify(actual) === JSON.stringify(expected)
}

/**
 * Verifies a managed v2 Portal allowlist without letting operator evidence
 * override API-visible drift. Stripe may omit the Product catalog from both
 * list and retrieve responses; only that absent-field case may use the exact
 * process-local confirmation after both use-specific Portals are checked in
 * the Dashboard.
 */
export function managedSupporterPortalAllowlistIsVerified(
  features,
  expectedProducts,
  confirmation = "",
) {
  const products = features?.subscription_update?.products
  if (products !== undefined) {
    return supporterPortalAllowlistMatches(features, expectedProducts)
  }
  return confirmation === MANAGED_SUPPORTER_PORTAL_CATALOG_CONFIRMATION
}

/**
 * Verifies the retained default Portal catalog without allowing an operator
 * confirmation to override API-visible drift. Stripe currently omits the
 * Dashboard-managed default catalog from some configuration responses; only
 * that absent-field case may use the exact process-local confirmation.
 */
export function retainedDefaultSupporterPortalAllowlistIsVerified(
  features,
  expectedProducts,
  confirmation = "",
) {
  const products = features?.subscription_update?.products
  if (products !== undefined) {
    return supporterPortalAllowlistMatches(features, expectedProducts)
  }
  return confirmation === DEFAULT_SUPPORTER_PORTAL_CATALOG_CONFIRMATION
}

/**
 * Checks the exact billing-management capabilities inherited by both managed
 * Supporter Portals, independently of their use-specific Price allowlists.
 */
export function hasApprovedSupporterPortalManagementFeatures(features) {
  const normalized = normalizeSupporterPortalFeatures(features)
  return normalized.customer_update.enabled
    && JSON.stringify(normalized.customer_update.allowed_updates)
      === JSON.stringify(["address", "email", "name"])
    && normalized.invoice_history.enabled
    && normalized.payment_method_update.enabled
    && normalized.subscription_cancel.enabled
    && normalized.subscription_cancel.mode === "at_period_end"
    && normalized.subscription_cancel.proration_behavior === "none"
    && normalized.subscription_cancel.cancellation_reason.enabled
    && JSON.stringify(normalized.subscription_cancel.cancellation_reason.options)
      === JSON.stringify(APPROVED_SUPPORTER_PORTAL_CANCELLATION_REASONS)
}
