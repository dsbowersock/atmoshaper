import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  resolveSupporterPortalConfigurationId,
  resolveSupporterPortalForPrice,
  supporterPortalConfigurationEnvironmentKey,
  supporterUseForConfiguredPrice,
} from "../lib/supporter-portal.js"

function portalEnv(overrides = {}) {
  return {
    STRIPE_SUPPORTER_1_PERSONAL_MONTHLY_PRICE_ID: "price_personal_month",
    STRIPE_SUPPORTER_1_BUSINESS_MONTHLY_PRICE_ID: "price_business_month",
    STRIPE_SUPPORTER_PERSONAL_PORTAL_CONFIGURATION_ID: "bpc_personal",
    STRIPE_SUPPORTER_BUSINESS_PORTAL_CONFIGURATION_ID: "bpc_business",
    ...overrides,
  }
}

describe("Supporter Portal configuration selection", () => {
  it("derives only the two approved Portal environment keys", () => {
    assert.equal(
      supporterPortalConfigurationEnvironmentKey("personal"),
      "STRIPE_SUPPORTER_PERSONAL_PORTAL_CONFIGURATION_ID",
    )
    assert.equal(
      supporterPortalConfigurationEnvironmentKey("BUSINESS"),
      "STRIPE_SUPPORTER_BUSINESS_PORTAL_CONFIGURATION_ID",
    )
    assert.equal(supporterPortalConfigurationEnvironmentKey("other"), null)
  })

  it("maps configured v2 Prices to the matching use-specific Portal", () => {
    const env = portalEnv()
    assert.equal(supporterUseForConfiguredPrice("price_personal_month", env), "personal")
    assert.equal(supporterUseForConfiguredPrice("price_business_month", env), "business")
    assert.equal(resolveSupporterPortalConfigurationId("personal", env), "bpc_personal")
    assert.deepEqual(resolveSupporterPortalForPrice("price_personal_month", env), {
      supporterUse: "personal",
      configurationId: "bpc_personal",
    })
    assert.deepEqual(resolveSupporterPortalForPrice("price_legacy", env), {
      supporterUse: null,
      configurationId: null,
    })
  })

  it("fails closed when a recognized v2 Price lacks its Portal configuration", () => {
    assert.throws(
      () => resolveSupporterPortalForPrice(
        "price_personal_month",
        portalEnv({ STRIPE_SUPPORTER_PERSONAL_PORTAL_CONFIGURATION_ID: "" }),
      ),
      /use-specific Supporter Portal is not configured/,
    )
  })
})
