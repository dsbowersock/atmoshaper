import {
  LEGACY_SUPPORTER_RECURRING_TAX_CODE,
  SUPPORTER_MEMBERSHIP_PRICE_CONTRACT,
} from "./stripe-price-contract.js"

/**
 * Historical six-Price v1 target retained only so the already-run migration
 * stays verifiable and replay-safe while v2 is prepared separately.
 */
export const LEGACY_TARGET_PRICE_SPECS = Object.freeze([
  ["support-1-month", "STRIPE_SUPPORTER_1_MONTHLY_PRICE_ID", "support-1", 100, "month"],
  ["support-1-year", "STRIPE_SUPPORTER_1_YEARLY_PRICE_ID", "support-1", 1000, "year"],
  ["support-2-month", "STRIPE_SUPPORTER_2_MONTHLY_PRICE_ID", "support-2", 200, "month"],
  ["support-2-year", "STRIPE_SUPPORTER_2_YEARLY_PRICE_ID", "support-2", 2000, "year"],
  ["support-5-month", "STRIPE_SUPPORTER_5_MONTHLY_PRICE_ID", "support-5", 500, "month"],
  ["support-5-year", "STRIPE_SUPPORTER_5_YEARLY_PRICE_ID", "support-5", 5000, "year"],
].map(([key, envKey, amountChoiceId, unitAmount, interval]) => Object.freeze({
  key,
  envKey,
  amountChoiceId,
  supporterUse: null,
  productKey: amountChoiceId,
  productName: "AtmoShaper Supporter Membership",
  taxCode: LEGACY_SUPPORTER_RECURRING_TAX_CODE,
  unitAmount,
  interval,
})))

/**
 * Immutable Supporter Price targets shared by migration and catalog-parity
 * tests. This module intentionally contains no CLI startup or Stripe client
 * setup, so importing the contract cannot perform migration work.
 */
export const TARGET_PRICE_SPECS = Object.freeze(
  SUPPORTER_MEMBERSHIP_PRICE_CONTRACT.map(({
    key,
    envKey,
    amountChoiceId,
    supporterUse,
    productKey,
    productName,
    taxCode,
    unitAmount,
    interval,
  }) => Object.freeze({
    key,
    envKey,
    amountChoiceId,
    supporterUse,
    productKey,
    productName,
    taxCode,
    unitAmount,
    interval,
  })),
)
