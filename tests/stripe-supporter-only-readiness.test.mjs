import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { describe, it } from "node:test"
import { REQUIRED_SUPPORTER_PRICE_CONTRACT } from "../lib/stripe-readiness.js"
import { MANAGED_SUPPORTER_PORTAL_CATALOG_CONFIRMATION } from "../lib/stripe-supporter-portal-contract.js"

const scriptPath = fileURLToPath(new URL("../scripts/stripe-readiness-check.mjs", import.meta.url))
const hookUrl = new URL("./fixtures/stripe-readiness-hook.mjs", import.meta.url).href

/** Runs the actual live CLI with a hermetic environment and read-only Stripe fixture. */
function runSupporterReadiness(overrides = {}, args = ["--supporter-only", "--live", "--verify-stripe"]) {
  const env = {
    PATH: process.env.PATH,
    ...(process.env.SystemRoot ? { SystemRoot: process.env.SystemRoot } : {}),
    ...(process.env.COMSPEC ? { COMSPEC: process.env.COMSPEC } : {}),
    STRIPE_SECRET_KEY: "rk_live_readiness",
    STRIPE_WEBHOOK_SECRET: "whsec_readiness",
    STRIPE_SUPPORTER_PERSONAL_PORTAL_CONFIGURATION_ID: "bpc_personal",
    STRIPE_SUPPORTER_BUSINESS_PORTAL_CONFIGURATION_ID: "bpc_business",
    STRIPE_SUPPORTER_AUTOMATIC_TAX_ENABLED: "true",
    STRIPE_SUPPORTER_PERSONAL_TAX_PRODUCT_CODE: "txcd_10103000",
    STRIPE_SUPPORTER_BUSINESS_TAX_PRODUCT_CODE: "txcd_10103001",
    STRIPE_SUPPORTER_TAX_PROVIDER_READY: "true",
    STRIPE_SUPPORTER_TAX_REGISTRATIONS_READY: "true",
    STRIPE_SUPPORTER_TAX_CLASSIFICATION_CONFIRMED: "true",
    STRIPE_ONE_TIME_SUPPORT_AUTOMATIC_TAX_ENABLED: "false",
    BACKGROUND_COMMERCE_PURCHASING_ENABLED: "false",
    ...Object.fromEntries(REQUIRED_SUPPORTER_PRICE_CONTRACT.map(({ key }) => [key, `price_${key}`])),
    ...overrides,
  }
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete env[key]
  }
  return spawnSync(process.execPath, ["--import", hookUrl, scriptPath, "--no-dotenv", ...args], {
    encoding: "utf8",
    env,
  })
}

describe("Supporter-only readiness CLI", () => {
  it("passes with disabled payment flows and no unrelated commerce configuration", () => {
    const result = runSupporterReadiness()
    assert.equal(result.status, 0, result.stderr || result.stdout)
    assert.match(result.stdout, /Stripe readiness scope: supporter-only/)
    assert.match(result.stdout, /One-time support tax readiness: not_applicable \(disabled\)/)
    assert.match(result.stdout, /Background commerce readiness: not_applicable \(disabled\)/)
    assert.match(result.stdout, /Supporter personal Portal configuration verified: true/)
    assert.match(result.stdout, /Supporter business Portal configuration verified: true/)
    assert.match(result.stdout, /Pinned Stripe webhook event coverage complete: true/)
    assert.doesNotMatch(result.stdout, /One-time support tax readiness: ready|Background commerce readiness: ready/)
    assert.doesNotMatch(`${result.stdout}${result.stderr}`, /rk_live_readiness|whsec_readiness/)
  })

  it("accepts unset fail-closed switches and explicit false regardless of case", () => {
    for (const value of [undefined, "", " FALSE "]) {
      const result = runSupporterReadiness({
        STRIPE_ONE_TIME_SUPPORT_AUTOMATIC_TAX_ENABLED: value,
        BACKGROUND_COMMERCE_PURCHASING_ENABLED: value,
      })
      assert.equal(result.status, 0, result.stderr || result.stdout)
    }
  })

  it("rejects enabled or ambiguous excluded-flow switches even when other gates are missing", () => {
    for (const key of ["STRIPE_ONE_TIME_SUPPORT_AUTOMATIC_TAX_ENABLED", "BACKGROUND_COMMERCE_PURCHASING_ENABLED"]) {
      for (const value of ["true", " TRUE ", "1", "yes", "flase"]) {
        const result = runSupporterReadiness({ [key]: value })
        assert.equal(result.status, 1, `${key}=${value}`)
        assert.match(result.stderr, new RegExp(`${key} must be false or unset for --supporter-only`))
        assert.doesNotMatch(result.stdout, /PASS Stripe membership/)
      }
    }
  })

  it("preserves the full-payment default and live provider-verification requirement", () => {
    const full = runSupporterReadiness({}, ["--live", "--verify-stripe"])
    assert.equal(full.status, 1)
    assert.match(full.stderr, /One-time support tax|Background commerce/)
    const unverified = runSupporterReadiness({}, ["--supporter-only", "--live"])
    assert.equal(unverified.status, 1)
    assert.match(unverified.stderr, /Live Stripe readiness requires --verify-stripe/)
  })

  it("still requires both secrets and every recurring-tax attestation", () => {
    for (const key of [
      "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET",
      "STRIPE_SUPPORTER_AUTOMATIC_TAX_ENABLED", "STRIPE_SUPPORTER_PERSONAL_TAX_PRODUCT_CODE",
      "STRIPE_SUPPORTER_BUSINESS_TAX_PRODUCT_CODE", "STRIPE_SUPPORTER_TAX_PROVIDER_READY",
      "STRIPE_SUPPORTER_TAX_REGISTRATIONS_READY", "STRIPE_SUPPORTER_TAX_CLASSIFICATION_CONFIRMED",
    ]) {
      const result = runSupporterReadiness({ [key]: undefined })
      assert.equal(result.status, 1, key)
      assert.doesNotMatch(result.stdout, /PASS Stripe membership/)
    }
  })

  it("retains Price retrieval, topology, uniqueness and Portal boundaries", () => {
    for (const overrides of [
      { STRIPE_SUPPORTER_1_PERSONAL_MONTHLY_PRICE_ID: undefined },
      { STRIPE_THERAPIST_MONTHLY_PRICE_ID: "price_STRIPE_SUPPORTER_1_PERSONAL_MONTHLY_PRICE_ID" },
      { STRIPE_READINESS_STUB_FAIL_PRICE_ID: "price_STRIPE_SUPPORTER_1_PERSONAL_MONTHLY_PRICE_ID" },
      { STRIPE_READINESS_STUB_SINGLE_SUPPORTER_PRODUCT: "true" },
      { STRIPE_SUPPORTER_BUSINESS_PORTAL_CONFIGURATION_ID: "bpc_stale" },
      { STRIPE_READINESS_STUB_LIVE_DEFAULT_USE: "business" },
      { STRIPE_READINESS_STUB_SWAP_PORTALS: "true" },
      { STRIPE_READINESS_STUB_INVALID_PORTAL_ALLOWLIST: "business" },
      { STRIPE_READINESS_STUB_INVALID_PORTAL_PROFILE: "business" },
    ]) {
      const result = runSupporterReadiness(overrides)
      assert.equal(result.status, 1, JSON.stringify(overrides))
      assert.doesNotMatch(result.stdout, /PASS Stripe membership/)
    }
  })

  it("requires fresh managed-Portal evidence and never overrides visible drift", () => {
    const omitted = { STRIPE_READINESS_STUB_OMIT_MANAGED_PORTAL_PRODUCTS: "true" }
    assert.equal(runSupporterReadiness(omitted).status, 1)
    const confirmed = runSupporterReadiness({
      ...omitted,
      ATMOSHAPER_STRIPE_MANAGED_PORTAL_CATALOG_CONFIRMATION: MANAGED_SUPPORTER_PORTAL_CATALOG_CONFIRMATION,
    })
    assert.equal(confirmed.status, 0, confirmed.stderr || confirmed.stdout)
    assert.match(confirmed.stdout, /Supporter business Portal catalog evidence: operator_confirmation/)
    const drift = runSupporterReadiness({
      ATMOSHAPER_STRIPE_MANAGED_PORTAL_CATALOG_CONFIRMATION: MANAGED_SUPPORTER_PORTAL_CATALOG_CONFIRMATION,
      STRIPE_READINESS_STUB_INVALID_PORTAL_ALLOWLIST: "personal",
    })
    assert.equal(drift.status, 1)
  })

  it("keeps the complete pinned webhook contract even with background purchases disabled", () => {
    for (const drift of ["missing", "disabled", "api-version", "events"]) {
      const result = runSupporterReadiness({ STRIPE_READINESS_STUB_INVALID_WEBHOOK: drift })
      assert.equal(result.status, 1, drift)
      assert.match(result.stderr, /pinned Stripe webhook endpoint/)
      assert.doesNotMatch(result.stdout, /PASS Stripe membership/)
    }
  })
})
