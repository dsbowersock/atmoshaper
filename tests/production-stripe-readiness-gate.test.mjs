import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { readFile } from "node:fs/promises"
import { describe, it } from "node:test"
import { fileURLToPath } from "node:url"
import { DIGITAL_PURCHASES_REFUNDS_VERSION } from "../lib/legal-documents.js"
import { REQUIRED_SUPPORTER_PRICE_CONTRACT } from "../lib/stripe-readiness.js"
import { STRIPE_BACKGROUND_COMMERCE_WEBHOOK_EVENTS } from "../lib/stripe-webhook-contract.js"
import {
  runProductionStripeReadinessGate,
  shouldCheckProductionStripeReadiness,
} from "../scripts/assert-production-stripe-readiness.mjs"

const gatePath = fileURLToPath(new URL("../scripts/assert-production-stripe-readiness.mjs", import.meta.url))
const readinessPath = fileURLToPath(new URL("../scripts/stripe-readiness-check.mjs", import.meta.url))
const hookUrl = new URL("./fixtures/stripe-readiness-hook.mjs", import.meta.url).href

/** Exercises both real CLI processes with synthetic credentials and the read-only Stripe stub. */
function runFixtureBuildGate(overrides = {}) {
  const env = {
    PATH: process.env.PATH,
    ...(process.env.SystemRoot ? { SystemRoot: process.env.SystemRoot } : {}),
    ...(process.env.COMSPEC ? { COMSPEC: process.env.COMSPEC } : {}),
    NODE_OPTIONS: `--import=${hookUrl}`,
    VERCEL_ENV: "production",
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
    STRIPE_READINESS_STUB_MANAGED_PRODUCTS_REQUIRE_EXPANSION: "true",
    ...Object.fromEntries(REQUIRED_SUPPORTER_PRICE_CONTRACT.map(({ key }) => [key, `price_${key}`])),
    ...overrides,
  }
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete env[key]
  }
  return spawnSync(process.execPath, [gatePath], { env, encoding: "utf8", timeout: 15_000 })
}

/** Supplies the separate full-payment attestations with no provider credentials. */
function allPaymentsFixtureOverrides(overrides = {}) {
  return {
    STRIPE_PRODUCTION_READINESS_SCOPE: "all-payments",
    STRIPE_ONE_TIME_SUPPORT_AUTOMATIC_TAX_ENABLED: "true",
    STRIPE_ONE_TIME_SUPPORT_TAX_PRODUCT_CODE: "txcd_90000001",
    STRIPE_ONE_TIME_SUPPORT_TAX_PROVIDER_READY: "true",
    STRIPE_ONE_TIME_SUPPORT_TAX_REGISTRATIONS_READY: "true",
    STRIPE_ONE_TIME_SUPPORT_TAX_CLASSIFICATION_CONFIRMED: "true",
    BACKGROUND_COMMERCE_PURCHASING_ENABLED: "true",
    BACKGROUND_COMMERCE_PRICE_CENTS: "100",
    BACKGROUND_COMMERCE_CURRENCY: "usd",
    BACKGROUND_COMMERCE_PURCHASE_COUNTRIES: "US",
    BACKGROUND_COMMERCE_DIGITAL_PURCHASE_DOCUMENT_VERSION: DIGITAL_PURCHASES_REFUNDS_VERSION,
    BACKGROUND_COMMERCE_WEBHOOK_READY: "true",
    BACKGROUND_COMMERCE_WEBHOOK_EVENTS: STRIPE_BACKGROUND_COMMERCE_WEBHOOK_EVENTS.join(","),
    BACKGROUND_COMMERCE_RECONCILIATION_READY: "true",
    BACKGROUND_COMMERCE_TAX_MODE: "stripe",
    BACKGROUND_COMMERCE_TAX_PRODUCT_CODE: "txcd_10000000",
    BACKGROUND_COMMERCE_TAX_PROVIDER_READY: "true",
    BACKGROUND_COMMERCE_TAX_REGISTRATIONS_READY: "true",
    ...overrides,
  }
}

describe("Production Stripe build gate", () => {
  it("skips local, Preview and development without starting a provider process", () => {
    for (const value of [undefined, "preview", "development"]) {
      const env = { VERCEL_ENV: value, STRIPE_PRODUCTION_READINESS_SCOPE: "all-payments" }
      assert.equal(shouldCheckProductionStripeReadiness(env), false)
      assert.deepEqual(runProductionStripeReadinessGate({
        env,
        spawnSyncImpl: () => assert.fail("Non-Production must not invoke live readiness"),
        log: () => {},
      }), { checked: false })
    }
    assert.equal(shouldCheckProductionStripeReadiness({ VERCEL_ENV: "production" }), true)
  })

  it("uses the real read-only CLI with fixed live Supporter scope and inherited configuration", () => {
    const env = { VERCEL_ENV: "production", STRIPE_SECRET_KEY: "private-sentinel" }
    let invocation
    const result = runProductionStripeReadinessGate({
      env,
      spawnSyncImpl: (command, args, options) => {
        invocation = { command, args, options }
        return { status: 0 }
      },
      log: () => {},
    })
    assert.deepEqual(result, { checked: true })
    assert.equal(invocation.command, process.execPath)
    assert.deepEqual(invocation.args, [readinessPath, "--supporter-only", "--live", "--verify-stripe", "--no-dotenv"])
    assert.equal(invocation.options.env, env)
    assert.equal(invocation.options.stdio, "inherit")
    assert.equal(invocation.options.timeout, 120_000)
  })

  it("delegates explicit all-payment scope to the full live checker without dotenv fallback", () => {
    const env = { VERCEL_ENV: "production", STRIPE_PRODUCTION_READINESS_SCOPE: "all-payments" }
    let invocation
    runProductionStripeReadinessGate({
      env,
      spawnSyncImpl: (command, args, options) => {
        invocation = { command, args, options }
        return { status: 0 }
      },
      log: () => {},
    })
    assert.equal(invocation.command, process.execPath)
    assert.deepEqual(invocation.args, [readinessPath, "--live", "--verify-stripe", "--no-dotenv"])
    assert.equal(invocation.options.env, env)
    assert.equal(invocation.options.stdio, "inherit")
    assert.equal(invocation.options.timeout, 120_000)
  })

  it("rejects empty or unknown scopes before starting a checker without echoing their value", () => {
    for (const scope of ["", "all", "ALL-PAYMENTS", "all-payments ", "private-sentinel"]) {
      assert.throws(() => runProductionStripeReadinessGate({
        env: { VERCEL_ENV: "production", STRIPE_PRODUCTION_READINESS_SCOPE: scope },
        spawnSyncImpl: () => assert.fail("Invalid scope must not invoke a provider process"),
        log: () => {},
      }), (error) => {
        assert.match(error.message, /scope is invalid; refusing this build/)
        assert.doesNotMatch(error.message, /private-sentinel/)
        return true
      })
    }
    const result = runFixtureBuildGate({ STRIPE_PRODUCTION_READINESS_SCOPE: "private-sentinel" })
    assert.equal(result.status, 1, result.stderr || result.stdout)
    assert.match(result.stderr, /scope is invalid/)
    assert.doesNotMatch(`${result.stdout}${result.stderr}`, /private-sentinel|Stripe readiness scope:/)
  })

  it("fails closed on checker rejection, a signal, spawn failure or timeout without echoing credentials", () => {
    for (const [result, cause] of [
      [{ status: 1 }, "checker rejected readiness"],
      [{ status: null, signal: "private-sentinel" }, "checker ended by a signal"],
      [{ status: null, error: new Error("private-sentinel spawn failure") }, "checker could not start"],
      [{ status: null, error: Object.assign(new Error("private-sentinel"), { code: "ETIMEDOUT" }) }, "checker timed out"],
    ]) {
      assert.throws(() => runProductionStripeReadinessGate({
        env: { VERCEL_ENV: "production", STRIPE_SECRET_KEY: "private-sentinel" },
        spawnSyncImpl: () => result,
        log: () => {},
      }), (error) => {
        assert.match(error.message, /refusing this build/)
        assert.ok(error.message.includes(cause), error.message)
        assert.doesNotMatch(error.message, /private-sentinel/)
        return true
      })
    }
  })

  it("passes the actual nested CLI only with a valid synthetic live catalog", () => {
    const result = runFixtureBuildGate()
    assert.equal(result.status, 0, result.stderr || result.stdout)
    assert.match(result.stdout, /Supporter business Portal catalog evidence: stripe_api/)
    assert.match(result.stdout, /Production Supporter readiness gate passed/)
    assert.doesNotMatch(`${result.stdout}${result.stderr}`, /rk_live_readiness|whsec_readiness/)
  })

  it("passes the actual full-payment nested CLI with both flows and all their attestations", () => {
    const result = runFixtureBuildGate(allPaymentsFixtureOverrides())
    assert.equal(result.status, 0, result.stderr || result.stdout)
    assert.match(result.stdout, /Stripe readiness scope: all-payments/)
    assert.match(result.stdout, /One-time support tax classification confirmed: true/)
    assert.match(result.stdout, /Background commerce readiness: ready/)
    assert.match(result.stdout, /Production all-payments readiness gate passed/)
    assert.doesNotMatch(`${result.stdout}${result.stderr}`, /rk_live_readiness|whsec_readiness/)
  })

  it("keeps explicit Supporter-only scope and never infers full scope from enabled switches", () => {
    const explicit = runFixtureBuildGate({ STRIPE_PRODUCTION_READINESS_SCOPE: "supporter-only" })
    assert.equal(explicit.status, 0, explicit.stderr || explicit.stdout)
    assert.match(explicit.stdout, /Stripe readiness scope: supporter-only/)
    const enabled = runFixtureBuildGate(allPaymentsFixtureOverrides({
      STRIPE_PRODUCTION_READINESS_SCOPE: undefined,
    }))
    assert.equal(enabled.status, 1, enabled.stderr || enabled.stdout)
    assert.match(enabled.stderr, /must be false or unset for --supporter-only/)
  })

  it("full scope cannot bypass missing credentials, Supporter tax or managed Portal drift", () => {
    for (const overrides of [
      { STRIPE_SECRET_KEY: undefined },
      { STRIPE_SUPPORTER_TAX_CLASSIFICATION_CONFIRMED: "false" },
      { STRIPE_READINESS_STUB_INVALID_PORTAL_ALLOWLIST: "personal" },
      { STRIPE_READINESS_STUB_INVALID_PORTAL_ALLOWLIST: "business" },
    ]) {
      const result = runFixtureBuildGate(allPaymentsFixtureOverrides(overrides))
      assert.equal(result.status, 1, result.stderr || result.stdout)
      assert.match(result.stderr, /Production all-payments readiness failed/)
      assert.doesNotMatch(result.stdout, /Production all-payments readiness gate passed/)
    }
  })

  it("full scope requires each one-time tax attestation and background fulfillment/tax readiness", () => {
    for (const overrides of [
      { STRIPE_ONE_TIME_SUPPORT_AUTOMATIC_TAX_ENABLED: "false" },
      { STRIPE_ONE_TIME_SUPPORT_TAX_PRODUCT_CODE: undefined },
      { STRIPE_ONE_TIME_SUPPORT_TAX_PROVIDER_READY: "false" },
      { STRIPE_ONE_TIME_SUPPORT_TAX_REGISTRATIONS_READY: "false" },
      { STRIPE_ONE_TIME_SUPPORT_TAX_CLASSIFICATION_CONFIRMED: "false" },
      { BACKGROUND_COMMERCE_PURCHASING_ENABLED: "false" },
      { BACKGROUND_COMMERCE_RECONCILIATION_READY: "false" },
      { BACKGROUND_COMMERCE_WEBHOOK_EVENTS: "checkout.session.completed" },
      { BACKGROUND_COMMERCE_TAX_MODE: "disabled" },
      { BACKGROUND_COMMERCE_TAX_REGISTRATIONS_READY: "false" },
    ]) {
      const result = runFixtureBuildGate(allPaymentsFixtureOverrides(overrides))
      assert.equal(result.status, 1, result.stderr || result.stdout)
      assert.match(result.stderr, /Production all-payments readiness failed/)
      assert.doesNotMatch(result.stdout, /Production all-payments readiness gate passed/)
    }
  })

  it("blocks actual builds for missing credentials or either managed Portal's catalog drift", () => {
    for (const overrides of [
      { STRIPE_SECRET_KEY: undefined },
      { STRIPE_READINESS_STUB_INVALID_PORTAL_ALLOWLIST: "personal" },
      { STRIPE_READINESS_STUB_INVALID_PORTAL_ALLOWLIST: "business" },
    ]) {
      const result = runFixtureBuildGate(overrides)
      assert.equal(result.status, 1, result.stderr || result.stdout)
      assert.match(result.stderr, /Production Supporter readiness failed/)
      assert.doesNotMatch(result.stdout, /Production Supporter readiness gate passed/)
    }
  })

  it("blocks either excluded purchase flow if its runtime switch becomes enabled", () => {
    for (const key of ["STRIPE_ONE_TIME_SUPPORT_AUTOMATIC_TAX_ENABLED", "BACKGROUND_COMMERCE_PURCHASING_ENABLED"]) {
      const result = runFixtureBuildGate({ [key]: "true" })
      assert.equal(result.status, 1, result.stderr || result.stdout)
      assert.match(result.stderr, new RegExp(`${key} must be false or unset`))
      assert.doesNotMatch(result.stdout, /Production Supporter readiness gate passed/)
    }
  })

  it("wires the gate after migration status and before Prisma generation", async () => {
    const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"))
    assert.equal(packageJson.scripts["production:stripe-readiness:check"], "node scripts/assert-production-stripe-readiness.mjs")
    assert.equal(packageJson.scripts.prebuild, "npm run production:migrations:check && npm run production:stripe-readiness:check && prisma generate")
  })
})
