import { TARGET_PRICE_SPECS } from "../../lib/stripe-supporter-membership-migration-contract.js"

/** Exact immutable twelve-slot Stripe Price environment shared by pricing tests. */
export const TWELVE_PRICE_ENVIRONMENT = Object.freeze(Object.fromEntries(
  TARGET_PRICE_SPECS.map(({ envKey, key }) => [
    envKey,
    `price_${key.replaceAll("-", "_")}`,
  ]),
))
