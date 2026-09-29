import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  SupporterV2LiveMigrationError,
  formatLiveMigrationFailure,
  runSupporterV2LiveMigration,
} from "../scripts/stripe-supporter-v2-live-catalog-migration.mjs"
import {
  MANAGED_SUPPORTER_PORTAL_CATALOG_CONFIRMATION,
} from "../lib/stripe-supporter-portal-contract.js"
import {
  V2_TARGET_PRICE_SPECS,
  supporterV2LookupKey,
} from "../lib/stripe-supporter-v2-catalog-contract.js"
import {
  STRIPE_API_VERSION,
  STRIPE_PINNED_WEBHOOK_EVENTS,
  STRIPE_PINNED_WEBHOOK_URL,
} from "../lib/stripe-webhook-contract.js"

function liveEnv(overrides = {}) {
  return {
    STRIPE_SECRET_KEY: "sk_live_do_not_print",
    ATMOSHAPER_STRIPE_LIVE_EXPECTED_ACCOUNT_ID: "acct_atmoshaper_live",
    ...overrides,
  }
}

function applyEnv(overrides = {}) {
  return liveEnv({
    ATMOSHAPER_STRIPE_LIVE_APPLY_CONFIRMATION: "CREATE_SUPPORTER_V2_LIVE_CATALOG",
    ...overrides,
  })
}

function clone(value) {
  return structuredClone(value)
}

function paged(values, params, pageSize) {
  const ordered = [...values]
  const cursorIndex = params.starting_after
    ? ordered.findIndex((entry) => entry.id === params.starting_after)
    : -1
  const start = cursorIndex + 1
  const size = Math.min(params.limit ?? 100, pageSize)
  const data = ordered.slice(start, start + size).map(clone)
  return { data, has_more: start + data.length < ordered.length }
}

function recurringPrice({
  id,
  product,
  unitAmount,
  interval,
  metadata,
  lookupKey,
  active = true,
}) {
  return {
    id,
    object: "price",
    livemode: true,
    active,
    product,
    unit_amount: unitAmount,
    currency: "usd",
    billing_scheme: "per_unit",
    recurring: {
      interval,
      interval_count: 1,
      trial_period_days: null,
      usage_type: "licensed",
    },
    tax_behavior: "exclusive",
    transform_quantity: null,
    currency_options: null,
    lookup_key: lookupKey,
    metadata,
  }
}

function canonicalPortalFeatures(features) {
  const result = clone(features)
  if (result.subscription_update?.schedule_at_period_end?.conditions === "") {
    result.subscription_update.schedule_at_period_end.conditions = []
  }
  return result
}

/** Creates a deterministic live-mode Stripe fixture with no provider side effects. */
function stripeFixture({ pageSize = 100, omitManagedPortalProducts = false } = {}) {
  const calls = []
  const products = new Map()
  const prices = new Map()
  const portals = new Map()
  const subscriptions = new Map()
  const sessions = new Map()
  const endpoints = new Map([[
    "we_live_atmoshaper",
    {
      id: "we_live_atmoshaper",
      object: "webhook_endpoint",
      livemode: true,
      url: STRIPE_PINNED_WEBHOOK_URL,
      status: "enabled",
      api_version: STRIPE_API_VERSION,
      enabled_events: [...STRIPE_PINNED_WEBHOOK_EVENTS],
    },
  ]])

  function log(operation, payload, options) {
    calls.push({ operation, payload: clone(payload), options: clone(options ?? {}) })
  }

  function portalResponse(portal) {
    const response = clone(portal)
    if (
      omitManagedPortalProducts
      && response?.metadata?.atmoshaper_portal_supporter_use
    ) {
      delete response.features.subscription_update.products
    }
    return response
  }

  const stripe = {
    accounts: {
      retrieve: async () => {
        log("accounts.retrieve", {}, {})
        return { id: "acct_atmoshaper_live", object: "account" }
      },
    },
    balance: {
      retrieve: async () => {
        log("balance.retrieve", {}, {})
        return { object: "balance", livemode: true }
      },
    },
    products: {
      list: async (params) => {
        log("products.list", params, {})
        return paged(products.values(), params, pageSize)
      },
      retrieve: async (id) => {
        log("products.retrieve", { id }, {})
        return clone(products.get(id))
      },
      create: async (payload, options) => {
        log("products.create", payload, options)
        const key = payload.metadata.atmoshaper_supporter_amount_choice
        const id = `prod_live_${key}`
        const created = { id, object: "product", livemode: true, ...clone(payload) }
        products.set(id, created)
        return clone(created)
      },
    },
    prices: {
      list: async (params) => {
        log("prices.list", params, {})
        const visible = [...prices.values()].filter((price) => (
          typeof params.active === "boolean" ? price.active === params.active : true
        ))
        return paged(visible, params, pageSize)
      },
      retrieve: async (id, params) => {
        log("prices.retrieve", { id, ...params }, {})
        return clone(prices.get(id))
      },
      create: async (payload, options) => {
        log("prices.create", payload, options)
        const key = payload.metadata.atmoshaper_supporter_price_key
        const id = `price_live_${key}`
        const created = recurringPrice({
          id,
          product: payload.product,
          unitAmount: payload.unit_amount,
          interval: payload.recurring.interval,
          metadata: payload.metadata,
          lookupKey: payload.lookup_key,
        })
        prices.set(id, created)
        return clone(created)
      },
    },
    subscriptions: {
      list: async (params) => {
        log("subscriptions.list", params, {})
        return paged(subscriptions.values(), params, pageSize)
      },
    },
    checkout: {
      sessions: {
        list: async (params) => {
          log("checkout.sessions.list", params, {})
          return paged(sessions.values(), params, pageSize)
        },
      },
    },
    billingPortal: {
      configurations: {
        list: async (params) => {
          if (params?.expand !== undefined) {
            throw new Error("Portal list must not request unsupported expansions")
          }
          log("portal.list", params, {})
          return paged([...portals.values()].map(portalResponse), params, pageSize)
        },
        retrieve: async (id, params) => {
          if (params !== undefined) {
            throw new Error("Portal retrieval must not request unsupported expansions")
          }
          log("portal.retrieve", { id }, {})
          return portalResponse(portals.get(id))
        },
        create: async (payload, options) => {
          log("portal.create", payload, options)
          assert.equal(Object.hasOwn(payload, "active"), false)
          assert.equal(payload.features.subscription_update.schedule_at_period_end, undefined)
          const supporterUse = payload.metadata.atmoshaper_portal_supporter_use
          const id = `bpc_live_${supporterUse}`
          const created = {
            id,
            object: "billing_portal.configuration",
            livemode: true,
            is_default: false,
            active: true,
            ...clone(payload),
            features: canonicalPortalFeatures(payload.features),
          }
          portals.set(id, created)
          return portalResponse(created)
        },
        update: async (id, payload) => {
          log("portal.update", { id, ...payload }, {})
          const current = portals.get(id)
          const updated = {
            ...current,
            ...clone(payload),
            features: canonicalPortalFeatures(payload.features),
          }
          portals.set(id, updated)
          return portalResponse(updated)
        },
      },
    },
    webhookEndpoints: {
      list: async (params) => {
        log("webhookEndpoints.list", params, {})
        return paged(endpoints.values(), params, pageSize)
      },
    },
  }

  return {
    calls,
    endpoints,
    portals,
    prices,
    products,
    sessions,
    stripe,
    subscriptions,
  }
}

function mutationCalls(fixture) {
  return fixture.calls.filter(({ operation }) => (
    operation.endsWith(".create") || operation.endsWith(".update")
  ))
}

async function expectFailure(run, code) {
  await assert.rejects(run, (error) => {
    assert.equal(error instanceof SupporterV2LiveMigrationError, true)
    assert.equal(error.failureCodes.includes(code), true, formatLiveMigrationFailure(error))
    return true
  })
}

describe("Supporter v2 live catalog migration", () => {
  it("fully paginates an empty dedicated account and reports a read-only plan", async () => {
    const fixture = stripeFixture({ pageSize: 1 })
    const result = await runSupporterV2LiveMigration({
      stripe: fixture.stripe,
      mode: "plan",
      env: liveEnv(),
    })

    assert.equal(result.state, "PRE_MIGRATION")
    assert.deepEqual(result.plan, {
      createProducts: 6,
      createPrices: 12,
      createPortals: 2,
      updatePortals: 0,
      confirmPortals: 0,
    })
    assert.equal(mutationCalls(fixture).length, 0)
  })

  it("accepts a restricted live key but rejects test keys and account-mode drift", async () => {
    const restricted = stripeFixture()
    const result = await runSupporterV2LiveMigration({
      stripe: restricted.stripe,
      mode: "plan",
      env: liveEnv({ STRIPE_SECRET_KEY: "rk_live_do_not_print" }),
    })
    assert.equal(result.ok, true)

    await expectFailure(
      () => runSupporterV2LiveMigration({
        stripe: stripeFixture().stripe,
        mode: "plan",
        env: liveEnv({ STRIPE_SECRET_KEY: "sk_test_wrong_mode" }),
      }),
      "live_secret_key_required",
    )

    const mismatch = stripeFixture()
    await expectFailure(
      () => runSupporterV2LiveMigration({
        stripe: mismatch.stripe,
        mode: "plan",
        env: liveEnv({ ATMOSHAPER_STRIPE_LIVE_EXPECTED_ACCOUNT_ID: "acct_other" }),
      }),
      "stripe_account_mode_mismatch",
    )
  })

  it("requires completion for verify and an exact process-only phrase for apply", async () => {
    await expectFailure(
      () => runSupporterV2LiveMigration({
        stripe: stripeFixture().stripe,
        mode: "verify",
        env: liveEnv(),
      }),
      "v2_live_catalog_not_completed",
    )
    await expectFailure(
      () => runSupporterV2LiveMigration({
        stripe: stripeFixture().stripe,
        mode: "apply",
        env: liveEnv(),
      }),
      "live_apply_confirmation_required",
    )
  })

  it("creates the exact catalog once and makes a replay write-free", async () => {
    const fixture = stripeFixture()
    const applied = await runSupporterV2LiveMigration({
      stripe: fixture.stripe,
      mode: "apply",
      env: applyEnv(),
    })

    assert.equal(applied.state, "COMPLETED")
    assert.equal(fixture.products.size, 6)
    assert.equal(fixture.prices.size, 12)
    assert.equal(fixture.portals.size, 2)
    assert.equal(mutationCalls(fixture).length, 20)
    const lookupKeys = new Set([...fixture.prices.values()].map(({ lookup_key }) => lookup_key))
    assert.deepEqual(
      lookupKeys,
      new Set(V2_TARGET_PRICE_SPECS.map(supporterV2LookupKey)),
    )

    const writesBeforeReplay = mutationCalls(fixture).length
    const replay = await runSupporterV2LiveMigration({
      stripe: fixture.stripe,
      mode: "apply",
      env: applyEnv(),
    })
    assert.equal(replay.state, "COMPLETED")
    assert.equal(mutationCalls(fixture).length, writesBeforeReplay)
  })

  it("requires fresh exact operator evidence after Stripe omits created Portal catalogs", async () => {
    const fixture = stripeFixture({ omitManagedPortalProducts: true })
    await expectFailure(
      () => runSupporterV2LiveMigration({
        stripe: fixture.stripe,
        mode: "apply",
        env: applyEnv({
          ATMOSHAPER_STRIPE_MANAGED_PORTAL_CATALOG_CONFIRMATION:
            MANAGED_SUPPORTER_PORTAL_CATALOG_CONFIRMATION,
        }),
      }),
      "managed_portal_catalog_confirmation_required",
    )

    const verified = await runSupporterV2LiveMigration({
      stripe: fixture.stripe,
      mode: "verify",
      env: liveEnv({
        ATMOSHAPER_STRIPE_MANAGED_PORTAL_CATALOG_CONFIRMATION:
          MANAGED_SUPPORTER_PORTAL_CATALOG_CONFIRMATION,
      }),
    })
    assert.equal(verified.state, "COMPLETED")
  })

  it("fails closed on hidden catalog, subscriber, Checkout, webhook, and lookup drift", async () => {
    const unmanaged = stripeFixture()
    unmanaged.products.set("prod_unknown", {
      id: "prod_unknown",
      object: "product",
      livemode: true,
      active: true,
      metadata: {},
    })
    await expectFailure(
      () => runSupporterV2LiveMigration({ stripe: unmanaged.stripe, mode: "plan", env: liveEnv() }),
      "unexpected_unmanaged_product_inventory",
    )

    const collision = stripeFixture()
    const target = V2_TARGET_PRICE_SPECS[0]
    collision.prices.set("price_collision", recurringPrice({
      id: "price_collision",
      product: "prod_unknown",
      unitAmount: target.unitAmount,
      interval: target.interval,
      lookupKey: supporterV2LookupKey(target),
      metadata: {},
    }))
    await expectFailure(
      () => runSupporterV2LiveMigration({ stripe: collision.stripe, mode: "plan", env: liveEnv() }),
      "target_price_lookup_key_collision",
    )

    const subscriber = stripeFixture()
    subscriber.subscriptions.set("sub_live", {
      id: "sub_live",
      object: "subscription",
      livemode: true,
      status: "active",
    })
    await expectFailure(
      () => runSupporterV2LiveMigration({ stripe: subscriber.stripe, mode: "plan", env: liveEnv() }),
      "unexpected_subscription_inventory",
    )

    const checkout = stripeFixture()
    checkout.sessions.set("cs_live", {
      id: "cs_live",
      object: "checkout.session",
      livemode: true,
      status: "open",
      mode: "subscription",
    })
    await expectFailure(
      () => runSupporterV2LiveMigration({ stripe: checkout.stripe, mode: "plan", env: liveEnv() }),
      "unexpected_open_checkout_session",
    )

    const webhook = stripeFixture()
    webhook.endpoints.clear()
    await expectFailure(
      () => runSupporterV2LiveMigration({ stripe: webhook.stripe, mode: "plan", env: liveEnv() }),
      "webhook_dependency_mismatch",
    )
  })

  it("formats only fixed failure codes and never echoes keys or account IDs", async () => {
    const secret = "sk_live_sensitive_value"
    const account = "acct_sensitive_value"
    try {
      await runSupporterV2LiveMigration({
        stripe: stripeFixture().stripe,
        mode: "invalid",
        env: liveEnv({
          STRIPE_SECRET_KEY: secret,
          ATMOSHAPER_STRIPE_LIVE_EXPECTED_ACCOUNT_ID: account,
        }),
      })
      assert.fail("Expected invalid mode to fail")
    } catch (error) {
      const output = formatLiveMigrationFailure(error)
      assert.equal(output.includes(secret), false)
      assert.equal(output.includes(account), false)
      assert.equal(output.includes("FAIL migration_mode_invalid"), true)
    }
  })
})
