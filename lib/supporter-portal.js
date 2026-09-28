import {
  getConfiguredMembershipOptions,
  getConfiguredMembershipReconciliationOptions,
} from "./membership.js"
import { normalizeSupporterUse } from "./supporter-use.js"

/** Returns the buyer-use class for one configured v2 Supporter Price. */
export function supporterUseForConfiguredPrice(priceId, env = process.env) {
  const normalizedPriceId = typeof priceId === "string" ? priceId.trim() : ""
  if (!normalizedPriceId) return null
  return getConfiguredMembershipOptions(env)
    .find((option) => option.priceId === normalizedPriceId)?.supporterUse ?? null
}

/** Maps one trusted buyer-use value to its dedicated Portal configuration key. */
export function supporterPortalConfigurationEnvironmentKey(supporterUse) {
  const normalizedUse = normalizeSupporterUse(supporterUse)
  return normalizedUse
    ? `STRIPE_SUPPORTER_${normalizedUse.toUpperCase()}_PORTAL_CONFIGURATION_ID`
    : null
}

/** Resolves a configured use-specific Portal without accepting arbitrary keys. */
export function resolveSupporterPortalConfigurationId(supporterUse, env = process.env) {
  const envKey = supporterPortalConfigurationEnvironmentKey(supporterUse)
  return envKey ? env[envKey]?.trim() || null : null
}

/**
 * Selects the Portal configuration for one persisted Supporter Price. A blank
 * Price means there is no subscription to classify and keeps Stripe's default
 * Portal. Configured v1 Prices retain that default for reconciliation, while
 * unknown nonblank Prices and incomplete v2 Portal configuration fail closed.
 */
export function resolveSupporterPortalForPrice(priceId, env = process.env) {
  const normalizedPriceId = typeof priceId === "string" ? priceId.trim() : ""
  if (!normalizedPriceId) {
    return { supporterUse: null, configurationId: null }
  }

  const configuredPrice = getConfiguredMembershipReconciliationOptions(env)
    .find((option) => option.priceId === normalizedPriceId)
  if (!configuredPrice) {
    throw new Error("The Supporter subscription Price is not configured.")
  }

  const supporterUse = configuredPrice.supporterUse
  if (!supporterUse) {
    return { supporterUse: null, configurationId: null }
  }
  const configurationId = resolveSupporterPortalConfigurationId(supporterUse, env)
  if (!configurationId) {
    throw new Error("The use-specific Supporter Portal is not configured.")
  }
  return { supporterUse, configurationId }
}
