import {
  BILLING_INTERVALS,
  SUPPORTER_AMOUNT_CHOICES,
  supporterPriceEnvironmentKey,
} from "./membership.js"
import { PUBLIC_PRODUCT_IDENTITY } from "./public-product-identity.js"
import {
  supporterUseOption,
  SUPPORTER_USE_OPTIONS,
} from "./supporter-use.js"

/**
 * Public Supporter Product name shared by catalog migration and readiness.
 * Private Stripe metadata remains on its stable compatibility namespace.
 */
export const SUPPORTER_MEMBERSHIP_PRODUCT_NAME = `${PUBLIC_PRODUCT_IDENTITY.name} Supporter Membership`
export const SUPPORTER_RECURRING_TAX_BEHAVIOR = "exclusive"
export const LEGACY_SUPPORTER_RECURRING_TAX_CODE = "txcd_10000000"
export const LEGACY_SUPPORTER_MEMBERSHIP_CATALOG_VERSION = "supporter_membership_v1"
export const SUPPORTER_MEMBERSHIP_CATALOG_VERSION = "supporter_membership_v2"

/** Returns the Stripe-visible Product identity for one declared buyer use. */
export function supporterMembershipProductName(supporterUse) {
  const option = supporterUseOption(supporterUse)
  return option ? `${SUPPORTER_MEMBERSHIP_PRODUCT_NAME} — ${option.label}` : null
}

/** Combines amount and use into the existing provider metadata identity slot. */
export function supporterProductKey(amountChoiceId, supporterUse) {
  const option = supporterUseOption(supporterUse)
  return option ? `${amountChoiceId}-${option.id}` : null
}

/** Ordered fixed-price catalog shared by runtime readiness and migration. */
export const SUPPORTER_MEMBERSHIP_PRICE_CONTRACT = Object.freeze(
  SUPPORTER_AMOUNT_CHOICES.flatMap((choice) => (
    SUPPORTER_USE_OPTIONS.flatMap((useOption) => (
      BILLING_INTERVALS.map((interval) => Object.freeze({
        key: `${choice.id}-${useOption.id}-${interval}`,
        envKey: supporterPriceEnvironmentKey(choice.id, interval, useOption.id),
        // Stable amount-and-use Product slot; neither dimension changes the
        // Supporter entitlement level.
        amountChoiceId: choice.id,
        supporterUse: useOption.id,
        productKey: supporterProductKey(choice.id, useOption.id),
        productName: supporterMembershipProductName(useOption.id),
        taxCode: useOption.taxCode,
        level: "SUPPORTER",
        interval,
        unitAmount: interval === "year"
          ? choice.yearAmountCents
          : choice.monthAmountCents,
      }))
    ))
  )),
)

/**
 * Returns whether expanded currency options fail the single-currency Supporter
 * contract. Null and empty expansions are valid; omitted or contradictory
 * expansions fail closed because they cannot prove the Price is USD-only.
 */
function hasCurrencyOptionsMismatch(candidate) {
  if (!Object.hasOwn(candidate ?? {}, "currency_options")) {
    return true
  }

  const currencyOptions = candidate?.currency_options
  if (currencyOptions == null) {
    return false
  }
  if (typeof currencyOptions !== "object" || Array.isArray(currencyOptions)) {
    return true
  }

  const currencyOptionKeys = Object.keys(currencyOptions)
  if (currencyOptionKeys.length === 0) {
    return false
  }
  if (currencyOptionKeys.length !== 1) {
    return true
  }

  const [currencyOptionKey] = currencyOptionKeys
  const baseCurrencyOption = currencyOptions[currencyOptionKey]
  return currencyOptionKey !== candidate?.currency
    || baseCurrencyOption == null
    || typeof baseCurrencyOption !== "object"
    || Array.isArray(baseCurrencyOption)
    || baseCurrencyOption.unit_amount !== candidate?.unit_amount
    || baseCurrencyOption.tax_behavior !== candidate?.tax_behavior
}

/**
 * Reports the exact reusable recurring Price semantics shared by ongoing
 * readiness and the one-time catalog migration. Product ownership, active
 * state, and Product tax classification remain caller-owned checks. Callers
 * must retrieve or list Prices with `currency_options` expanded; a missing
 * field cannot prove that no additional currencies exist. `taxBehavior` stays
 * optional so the migration can identify legacy Prices whose historical tax
 * behavior is not part of their retirement contract.
 */
export function recurringPriceSemanticMismatches(
  candidate,
  {
    unitAmount,
    interval,
    taxBehavior,
  } = {},
) {
  const mismatches = []

  if (candidate?.unit_amount !== unitAmount) mismatches.push("unit_amount")
  if (candidate?.currency !== "usd") mismatches.push("currency")
  if (candidate?.billing_scheme !== "per_unit") mismatches.push("billing_scheme")
  if (candidate?.recurring?.interval !== interval) mismatches.push("recurring.interval")
  if (candidate?.recurring?.interval_count !== 1) mismatches.push("recurring.interval_count")
  if (candidate?.recurring?.trial_period_days != null) mismatches.push("recurring.trial_period_days")
  if (candidate?.recurring?.usage_type !== "licensed") mismatches.push("recurring.usage_type")
  if (taxBehavior !== undefined && candidate?.tax_behavior !== taxBehavior) {
    mismatches.push("tax_behavior")
  }
  if (candidate?.transform_quantity != null) mismatches.push("transform_quantity")

  if (hasCurrencyOptionsMismatch(candidate)) {
    mismatches.push("currency_options")
  }

  return mismatches
}

/** Returns true only when every shared recurring Price semantic is exact. */
export function recurringPriceSemanticsMatch(candidate, expected) {
  return recurringPriceSemanticMismatches(candidate, expected).length === 0
}
