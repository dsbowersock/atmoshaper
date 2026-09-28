import { getConfiguredMembershipOptions } from "./membership.js"
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
 * Selects the Portal configuration for a persisted v2 Supporter Price.
 * Legacy or unknown Prices keep the default configuration; a recognized v2
 * Price fails closed if its use-specific configuration is absent.
 */
export function resolveSupporterPortalForPrice(priceId, env = process.env) {
  const supporterUse = supporterUseForConfiguredPrice(priceId, env)
  if (!supporterUse) {
    return { supporterUse: null, configurationId: null }
  }
  const configurationId = resolveSupporterPortalConfigurationId(supporterUse, env)
  if (!configurationId) {
    throw new Error("The use-specific Supporter Portal is not configured.")
  }
  return { supporterUse, configurationId }
}
