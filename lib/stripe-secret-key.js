/**
 * Classifies standard and restricted Stripe secret keys without exposing or
 * otherwise retaining the credential value.
 *
 * @param {string | undefined} value
 * @returns {"test" | "live" | null}
 */
export function getStripeSecretKeyMode(value) {
  if (typeof value !== "string") return null
  if (value.startsWith("sk_live_") || value.startsWith("rk_live_")) return "live"
  if (value.startsWith("sk_test_") || value.startsWith("rk_test_")) return "test"
  return null
}
