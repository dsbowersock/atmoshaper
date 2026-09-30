import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { getStripeSecretKeyMode } from "../lib/stripe-secret-key.js"

describe("Stripe secret-key mode", () => {
  /** Locks the supported server-side prefix matrix across both credential types. */
  function verifySupportedStripeSecretKeyModes() {
    assert.equal(getStripeSecretKeyMode("sk_test_example"), "test")
    assert.equal(getStripeSecretKeyMode("rk_test_example"), "test")
    assert.equal(getStripeSecretKeyMode("sk_live_example"), "live")
    assert.equal(getStripeSecretKeyMode("rk_live_example"), "live")
  }

  /** Keeps public, malformed, and noncanonical credentials outside trusted modes. */
  function verifyRejectedStripeCredentialShapes() {
    assert.equal(getStripeSecretKeyMode(undefined), null)
    assert.equal(getStripeSecretKeyMode(""), null)
    assert.equal(getStripeSecretKeyMode("pk_live_example"), null)
    assert.equal(getStripeSecretKeyMode("rk_example"), null)
    assert.equal(getStripeSecretKeyMode(" rk_live_example"), null)
  }

  it("classifies standard and restricted keys in both Stripe modes", verifySupportedStripeSecretKeyModes)
  it("rejects missing, public, malformed, and whitespace-prefixed values", verifyRejectedStripeCredentialShapes)
})
