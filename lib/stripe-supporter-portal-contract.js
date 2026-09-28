export const APPROVED_SUPPORTER_PORTAL_CANCELLATION_REASONS = Object.freeze([
  "missing_features",
  "other",
  "switched_service",
  "too_expensive",
  "unused",
])

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
      products: Array.isArray(features?.subscription_update?.products)
        ? features.subscription_update.products.map((entry) => ({
          product: stripeObjectId(entry?.product),
          prices: (entry?.prices ?? []).map(stripeObjectId).sort(),
          adjustable_quantity: {
            enabled: entry?.adjustable_quantity?.enabled === true,
          },
        })).sort((left, right) => left.product.localeCompare(right.product))
        : [],
    },
  }
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
