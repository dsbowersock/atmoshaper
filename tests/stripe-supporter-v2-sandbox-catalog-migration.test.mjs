import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { describe, it } from "node:test"
import { fileURLToPath } from "node:url"
import {
  SupporterV2MigrationError,
  V2_TARGET_PRICE_SPECS,
  V2_TARGET_PRODUCT_SPECS,
  formatMigrationFailure,
  runSupporterV2SandboxMigration,
} from "../scripts/stripe-supporter-v2-sandbox-catalog-migration.mjs"
import {
  LEGACY_SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
  LEGACY_SUPPORTER_RECURRING_TAX_CODE,
  SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
  SUPPORTER_MEMBERSHIP_PRODUCT_NAME,
} from "../lib/stripe-price-contract.js"
import {
  buildCurrentSupporterPriceMetadata,
  buildCurrentSupporterProductMetadata,
  classifySupporterProductMetadata,
} from "../lib/stripe-provider-identity.js"
import { LEGACY_TARGET_PRICE_SPECS } from "../lib/stripe-supporter-membership-migration-contract.js"
import {
  STRIPE_API_VERSION,
  STRIPE_PINNED_WEBHOOK_EVENTS,
  STRIPE_PINNED_WEBHOOK_URL,
} from "../lib/stripe-webhook-contract.js"

function migrationEnv(overrides = {}) {
  return {
    STRIPE_SECRET_KEY: "sk_test_do_not_print",
    ATMOSHAPER_STRIPE_V2_EXPECTED_ACCOUNT_ID: "acct_atmoshaper_sandbox",
    ...overrides,
  }
}

function clone(value) {
  return structuredClone(value)
}

function recurringPrice({
  id,
  product,
  unitAmount,
  interval,
  metadata,
  lookupKey = null,
  active = true,
}) {
  return {
    id,
    object: "price",
    livemode: false,
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

function targetLookupKey(spec) {
  return `atmoshaper_supporter_v2_${spec.key.replaceAll("-", "_")}`
}

function defaultPortal() {
  return {
    id: "bpc_default_v1",
    object: "billing_portal.configuration",
    active: true,
    is_default: true,
    livemode: false,
    name: "AtmoShaper Supporter Portal",
    metadata: {},
    business_profile: {
      headline: "Manage your AtmoShaper Supporter membership.",
      privacy_policy_url: "https://www.atmoshaper.com/legal/privacy",
      terms_of_service_url: "https://www.atmoshaper.com/legal/terms",
    },
    default_return_url: "https://www.atmoshaper.com/account?tab=membership",
    features: {
      customer_update: {
        enabled: true,
        allowed_updates: ["address", "email", "name"],
      },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: {
        enabled: true,
        mode: "at_period_end",
        proration_behavior: "none",
        cancellation_reason: {
          enabled: true,
          options: [
            "missing_features",
            "other",
            "switched_service",
            "too_expensive",
            "unused",
          ],
        },
      },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ["price"],
        billing_cycle_anchor: "unchanged",
        proration_behavior: "none",
        schedule_at_period_end: { conditions: [] },
        trial_update_behavior: "end_trial",
        products: [
          {
            product: "prod_v1_support-1",
            prices: ["price_v1_support-1-month", "price_v1_support-1-year"],
            adjustable_quantity: { enabled: false },
          },
          {
            product: "prod_v1_support-2",
            prices: ["price_v1_support-2-month", "price_v1_support-2-year"],
            adjustable_quantity: { enabled: false },
          },
          {
            product: "prod_v1_support-5",
            prices: ["price_v1_support-5-month", "price_v1_support-5-year"],
            adjustable_quantity: { enabled: false },
          },
        ],
      },
    },
  }
}

function v1Catalog() {
  const products = new Map()
  const prices = new Map()
  for (const productKey of ["support-1", "support-2", "support-5"]) {
    const id = `prod_v1_${productKey}`
    products.set(id, {
      id,
      object: "product",
      livemode: false,
      active: true,
      name: SUPPORTER_MEMBERSHIP_PRODUCT_NAME,
      description: "Retained v1 Supporter Product.",
      tax_code: LEGACY_SUPPORTER_RECURRING_TAX_CODE,
      metadata: buildCurrentSupporterProductMetadata({}, productKey, {
        catalogVersion: LEGACY_SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
      }),
    })
  }
  for (const spec of LEGACY_TARGET_PRICE_SPECS) {
    const id = `price_v1_${spec.key}`
    prices.set(id, recurringPrice({
      id,
      product: `prod_v1_${spec.productKey}`,
      unitAmount: spec.unitAmount,
      interval: spec.interval,
      metadata: buildCurrentSupporterPriceMetadata({}, spec.key, {
        catalogVersion: LEGACY_SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
      }),
      lookupKey: `massagelab_${spec.key.replaceAll("-", "_")}`,
    }))
  }
  return { products, prices }
}

function paged(values, params, pageSize) {
  const ordered = [...values]
  const cursorIndex = params.starting_after
    ? ordered.findIndex((entry) => entry.id === params.starting_after)
    : -1
  const start = cursorIndex + 1
  const size = Math.min(params.limit ?? 100, pageSize)
  const data = ordered.slice(start, start + size).map(clone)
  return {
    data,
    has_more: start + data.length < ordered.length,
  }
}

function canonicalPortalFeatures(features) {
  const result = clone(features)
  if (result.subscription_update?.schedule_at_period_end?.conditions === "") {
    result.subscription_update.schedule_at_period_end.conditions = []
  }
  return result
}

function stripeFixture({ pageSize = 100, failFirstPriceCreate = false } = {}) {
  const calls = []
  const catalog = v1Catalog()
  const products = catalog.products
  const prices = catalog.prices
  const portals = new Map([["bpc_default_v1", defaultPortal()]])
  const subscriptions = new Map()
  const sessions = new Map()
  const endpoints = new Map([[
    "we_atmoshaper",
    {
      id: "we_atmoshaper",
      object: "webhook_endpoint",
      livemode: false,
      url: STRIPE_PINNED_WEBHOOK_URL,
      status: "enabled",
      api_version: STRIPE_API_VERSION,
      enabled_events: [...STRIPE_PINNED_WEBHOOK_EVENTS],
    },
  ]])
  let shouldFailPriceCreate = failFirstPriceCreate

  function log(operation, payload, options) {
    calls.push({ operation, payload: clone(payload), options: clone(options ?? {}) })
  }

  const stripe = {
    accounts: {
      retrieve: async () => {
        log("accounts.retrieve", {}, {})
        return { id: "acct_atmoshaper_sandbox", object: "account" }
      },
    },
    balance: {
      retrieve: async () => {
        log("balance.retrieve", {}, {})
        return { object: "balance", livemode: false }
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
        const identity = classifySupporterProductMetadata(payload.metadata, {
          catalogVersion: SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
        })?.amountChoiceId
        const id = `prod_v2_${identity}`
        const created = {
          id,
          object: "product",
          livemode: false,
          ...clone(payload),
        }
        products.set(id, created)
        return clone(created)
      },
    },
    prices: {
      list: async (params) => {
        log("prices.list", params, {})
        const visiblePrices = [...prices.values()].filter((price) => (
          typeof params.active === "boolean" ? price.active === params.active : price.active === true
        ))
        return paged(visiblePrices, params, pageSize)
      },
      retrieve: async (id, params) => {
        log("prices.retrieve", { id, ...params }, {})
        return clone(prices.get(id))
      },
      create: async (payload, options) => {
        log("prices.create", payload, options)
        if (shouldFailPriceCreate) {
          shouldFailPriceCreate = false
          throw Object.assign(new Error("temporary create failure"), {
            type: "StripeConnectionError",
          })
        }
        const key = payload.metadata.atmoshaper_supporter_price_key
        const id = `price_v2_${key}`
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
          return paged(portals.values(), params, pageSize)
        },
        retrieve: async (id, params) => {
          if (params !== undefined) {
            throw new Error("Portal retrieval must not request unsupported expansions")
          }
          log("portal.retrieve", { id, ...params }, {})
          return clone(portals.get(id))
        },
        create: async (payload, options) => {
          log("portal.create", payload, options)
          const supporterUse = payload.metadata.atmoshaper_portal_supporter_use
          const id = `bpc_v2_${supporterUse}`
          const created = {
            id,
            object: "billing_portal.configuration",
            livemode: false,
            is_default: false,
            ...clone(payload),
            features: canonicalPortalFeatures(payload.features),
          }
          portals.set(id, created)
          return clone(created)
        },
        update: async (id, payload) => {
          log("portal.update", { id, ...payload }, {})
          const current = portals.get(id)
          const businessProfile = payload.business_profile
            ? Object.fromEntries(Object.entries({
              ...current.business_profile,
              ...clone(payload.business_profile),
            }).map(([key, value]) => [key, value === "" ? null : value]))
            : current.business_profile
          const updated = {
            ...current,
            ...clone(payload),
            business_profile: businessProfile,
            default_return_url: payload.default_return_url === ""
              ? null
              : payload.default_return_url ?? current.default_return_url,
            features: canonicalPortalFeatures(payload.features),
          }
          portals.set(id, updated)
          return clone(updated)
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

function applyEnv(overrides = {}) {
  return migrationEnv({
    ATMOSHAPER_STRIPE_V2_APPLY_CONFIRMATION: "CREATE_SUPPORTER_V2_SANDBOX_CATALOG",
    ...overrides,
  })
}

async function expectFailure(run, code) {
  await assert.rejects(run, (error) => {
    assert.equal(error instanceof SupporterV2MigrationError, true)
    assert.equal(error.failureCodes.includes(code), true, formatMigrationFailure(error))
    return true
  })
}

describe("Supporter v2 sandbox catalog migration", () => {
  it("derives exactly six use-classified Products and twelve recurring Prices", () => {
    assert.equal(V2_TARGET_PRODUCT_SPECS.length, 6)
    assert.equal(V2_TARGET_PRICE_SPECS.length, 12)
    assert.deepEqual(
      new Set(V2_TARGET_PRODUCT_SPECS.map(({ supporterUse }) => supporterUse)),
      new Set(["personal", "business"]),
    )
    assert.deepEqual(
      new Set(V2_TARGET_PRODUCT_SPECS.map(({ taxCode }) => taxCode)),
      new Set(["txcd_10103000", "txcd_10103001"]),
    )
    assert.equal(V2_TARGET_PRICE_SPECS.every(({ productKey }) => (
      V2_TARGET_PRODUCT_SPECS.some(({ key }) => key === productKey)
    )), true)
  })

  it("fully paginates a safe pre-migration inventory without writing", async () => {
    const fixture = stripeFixture({ pageSize: 2 })
    const result = await runSupporterV2SandboxMigration({
      stripe: fixture.stripe,
      mode: "plan",
      env: migrationEnv(),
    })

    assert.equal(result.state, "PRE_MIGRATION")
    assert.deepEqual(result.plan, {
      createProducts: 6,
      createPrices: 12,
      createPortals: 2,
      updatePortals: 0,
    })
    assert.equal(mutationCalls(fixture).length, 0)
    assert.equal(fixture.calls.some(({ payload }) => payload.starting_after), true)
    assert.deepEqual(
      new Set(fixture.calls
        .filter(({ operation }) => operation === "prices.list")
        .map(({ payload }) => payload.active)),
      new Set([true, false]),
    )
    assert.equal(
      fixture.calls
        .filter(({ operation }) => operation === "portal.list")
        .every(({ payload }) => payload.expand === undefined),
      true,
    )
  })

  it("detects an archived managed Price instead of recreating its identity", async () => {
    const fixture = stripeFixture()
    await runSupporterV2SandboxMigration({
      stripe: fixture.stripe,
      mode: "apply",
      env: applyEnv(),
    })
    const archived = [...fixture.prices.values()].find(({ id }) => id.startsWith("price_v2_"))
    archived.active = false
    fixture.calls.length = 0

    await expectFailure(
      () => runSupporterV2SandboxMigration({
        stripe: fixture.stripe,
        mode: "plan",
        env: migrationEnv(),
      }),
      "v2_price_semantics_mismatch",
    )
    assert.equal(mutationCalls(fixture).length, 0)
    assert.equal(
      fixture.calls.some(({ operation, payload }) => (
        operation === "prices.list" && payload.active === false
      )),
      true,
    )
  })

  it("repairs inherited Portal profile and return URL drift", async () => {
    const fixture = stripeFixture()
    await runSupporterV2SandboxMigration({
      stripe: fixture.stripe,
      mode: "apply",
      env: applyEnv(),
    })
    const personalPortal = [...fixture.portals.values()].find(
      ({ metadata }) => metadata.atmoshaper_portal_supporter_use === "personal",
    )
    personalPortal.business_profile.headline = "Stale headline"
    personalPortal.default_return_url = "https://www.atmoshaper.com/stale"
    fixture.calls.length = 0

    const plan = await runSupporterV2SandboxMigration({
      stripe: fixture.stripe,
      mode: "plan",
      env: migrationEnv(),
    })
    assert.equal(plan.state, "TRANSITIONAL")
    assert.equal(plan.plan.updatePortals, 1)
    assert.equal(mutationCalls(fixture).length, 0)

    const applied = await runSupporterV2SandboxMigration({
      stripe: fixture.stripe,
      mode: "apply",
      env: applyEnv(),
    })
    assert.equal(applied.state, "COMPLETED")
    assert.equal(personalPortal.business_profile.headline, "Stale headline")
    const repairedPortal = fixture.portals.get(personalPortal.id)
    assert.equal(
      repairedPortal.business_profile.headline,
      "Manage your AtmoShaper Supporter membership.",
    )
    assert.equal(
      repairedPortal.default_return_url,
      "https://www.atmoshaper.com/account?tab=membership",
    )
  })

  it("explicitly clears managed Portal profile fields removed from the default", async () => {
    const fixture = stripeFixture()
    await runSupporterV2SandboxMigration({
      stripe: fixture.stripe,
      mode: "apply",
      env: applyEnv(),
    })
    const defaultConfiguration = fixture.portals.get("bpc_default_v1")
    defaultConfiguration.business_profile = {
      headline: null,
      privacy_policy_url: null,
      terms_of_service_url: null,
    }
    defaultConfiguration.default_return_url = null
    fixture.calls.length = 0

    const plan = await runSupporterV2SandboxMigration({
      stripe: fixture.stripe,
      mode: "plan",
      env: migrationEnv(),
    })
    assert.equal(plan.state, "TRANSITIONAL")
    assert.equal(plan.plan.updatePortals, 2)

    const applied = await runSupporterV2SandboxMigration({
      stripe: fixture.stripe,
      mode: "apply",
      env: applyEnv(),
    })
    assert.equal(applied.state, "COMPLETED")
    const updates = fixture.calls.filter(({ operation }) => operation === "portal.update")
    assert.equal(updates.length, 2)
    assert.equal(updates.every(({ payload }) => (
      payload.business_profile.headline === ""
      && payload.business_profile.privacy_policy_url === ""
      && payload.business_profile.terms_of_service_url === ""
      && payload.default_return_url === ""
    )), true)
    assert.equal([...fixture.portals.values()]
      .filter(({ metadata }) => metadata.atmoshaper_portal_supporter_use)
      .every((portal) => (
        portal.business_profile.headline === null
        && portal.business_profile.privacy_policy_url === null
        && portal.business_profile.terms_of_service_url === null
        && portal.default_return_url === null
      )), true)
  })

  it("requires completed state for verify and an explicit phrase for apply", async () => {
    const fixture = stripeFixture()
    await expectFailure(
      () => runSupporterV2SandboxMigration({
        stripe: fixture.stripe,
        mode: "verify",
        env: migrationEnv(),
      }),
      "v2_catalog_not_completed",
    )
    await expectFailure(
      () => runSupporterV2SandboxMigration({
        stripe: fixture.stripe,
        mode: "apply",
        env: migrationEnv(),
      }),
      "sandbox_apply_confirmation_required",
    )
    assert.equal(mutationCalls(fixture).length, 0)
  })

  it("creates v2 deterministically, preserves v1, and makes reruns write-free", async () => {
    const fixture = stripeFixture()
    const v1ProductsBefore = [...fixture.products.values()].map(clone)
    const v1PricesBefore = [...fixture.prices.values()].map(clone)

    const result = await runSupporterV2SandboxMigration({
      stripe: fixture.stripe,
      mode: "apply",
      env: applyEnv(),
    })
    assert.equal(result.state, "COMPLETED")
    assert.equal(fixture.calls.filter(({ operation }) => operation === "products.create").length, 6)
    assert.equal(fixture.calls.filter(({ operation }) => operation === "prices.create").length, 12)
    assert.equal(fixture.calls.filter(({ operation }) => operation === "portal.create").length, 2)
    assert.deepEqual(
      [...fixture.products.values()].slice(0, 3),
      v1ProductsBefore,
    )
    assert.deepEqual(
      [...fixture.prices.values()].slice(0, 6),
      v1PricesBefore,
    )

    const creates = mutationCalls(fixture).filter(({ operation }) => operation.endsWith(".create"))
    assert.equal(creates.every(({ options }) => (
      options.idempotencyKey?.startsWith("atmoshaper:supporter:v2:")
    )), true)
    assert.equal(JSON.stringify(creates).includes("massagelab:"), false)

    for (const supporterUse of ["personal", "business"]) {
      const portal = [...fixture.portals.values()].find(
        ({ metadata }) => metadata.atmoshaper_portal_supporter_use === supporterUse,
      )
      assert.ok(portal)
      const productIds = portal.features.subscription_update.products
        .map(({ product }) => product)
      assert.equal(productIds.length, 3)
      assert.equal(productIds.every((id) => id.endsWith(`-${supporterUse}`)), true)
      assert.equal(portal.features.subscription_update.products.every(
        ({ prices }) => prices.length === 2,
      ), true)
    }

    fixture.calls.length = 0
    const rerun = await runSupporterV2SandboxMigration({
      stripe: fixture.stripe,
      mode: "apply",
      env: applyEnv(),
    })
    assert.equal(rerun.state, "COMPLETED")
    assert.deepEqual(rerun.plan, {
      createProducts: 0,
      createPrices: 0,
      createPortals: 0,
      updatePortals: 0,
    })
    assert.equal(mutationCalls(fixture).length, 0)
  })

  it("recovers an exact partial apply without duplicating created Products", async () => {
    const fixture = stripeFixture({ failFirstPriceCreate: true })
    await expectFailure(
      () => runSupporterV2SandboxMigration({
        stripe: fixture.stripe,
        mode: "apply",
        env: applyEnv(),
      }),
      "stripe_mutation_failed",
    )
    assert.equal(fixture.calls.filter(({ operation }) => operation === "products.create").length, 6)

    fixture.calls.length = 0
    const recovered = await runSupporterV2SandboxMigration({
      stripe: fixture.stripe,
      mode: "apply",
      env: applyEnv(),
    })
    assert.equal(recovered.state, "COMPLETED")
    assert.equal(fixture.calls.filter(({ operation }) => operation === "products.create").length, 0)
    assert.equal(fixture.calls.filter(({ operation }) => operation === "prices.create").length, 12)
  })

  it("fails closed on account, subscriber, Checkout, webhook, and metadata drift", async () => {
    const cases = [
      ["stripe_account_mode_mismatch", (fixture, env) => {
        env.ATMOSHAPER_STRIPE_V2_EXPECTED_ACCOUNT_ID = "acct_other"
      }],
      ["unexpected_subscription_inventory", (fixture) => {
        fixture.subscriptions.set("sub_active", {
          id: "sub_active",
          object: "subscription",
          livemode: false,
          status: "active",
        })
      }],
      ["unexpected_open_checkout_session", (fixture) => {
        fixture.sessions.set("cs_open", {
          id: "cs_open",
          object: "checkout.session",
          livemode: false,
          mode: "subscription",
          status: "open",
        })
      }],
      ["webhook_dependency_mismatch", (fixture) => {
        fixture.endpoints.get("we_atmoshaper").enabled_events = ["checkout.session.completed"]
      }],
      ["default_portal_dependency_mismatch", (fixture) => {
        fixture.portals.get("bpc_default_v1")
          .features.subscription_cancel.cancellation_reason.enabled = false
      }],
      ["default_portal_dependency_mismatch", (fixture) => {
        fixture.portals.get("bpc_default_v1")
          .features.subscription_cancel.cancellation_reason.options = ["other"]
      }],
      ["default_portal_dependency_mismatch", (fixture) => {
        fixture.portals.get("bpc_default_v1").features.subscription_update.enabled = false
      }],
      ["default_portal_dependency_mismatch", (fixture) => {
        fixture.portals.get("bpc_default_v1")
          .features.subscription_update.default_allowed_updates = ["price", "quantity"]
      }],
      ["default_portal_dependency_mismatch", (fixture) => {
        fixture.portals.get("bpc_default_v1")
          .features.subscription_update.billing_cycle_anchor = "now"
      }],
      ["default_portal_dependency_mismatch", (fixture) => {
        fixture.portals.get("bpc_default_v1")
          .features.subscription_update.proration_behavior = "create_prorations"
      }],
      ["default_portal_dependency_mismatch", (fixture) => {
        fixture.portals.get("bpc_default_v1")
          .features.subscription_update.schedule_at_period_end.conditions = [
            { type: "decreasing_item_amount" },
          ]
      }],
      ["default_portal_dependency_mismatch", (fixture) => {
        fixture.portals.get("bpc_default_v1")
          .features.subscription_update.trial_update_behavior = "continue_trial"
      }],
      ["default_portal_dependency_mismatch", (fixture) => {
        fixture.portals.get("bpc_default_v1")
          .features.subscription_update.products[0].prices = ["price_v1_support-1-month"]
      }],
      ["default_portal_dependency_mismatch", (fixture) => {
        fixture.portals.get("bpc_default_v1")
          .features.subscription_update.products.push({
            product: "prod_unmanaged",
            prices: ["price_unmanaged"],
            adjustable_quantity: { enabled: false },
          })
      }],
      ["managed_portal_default_conflict", (fixture) => {
        fixture.portals.get("bpc_default_v1").metadata = {
          app: "atmoshaper",
          atmoshaper_catalog: SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
          atmoshaper_membership_level: "SUPPORTER",
          atmoshaper_portal_supporter_use: "personal",
        }
      }],
      ["managed_product_metadata_mismatch", (fixture) => {
        fixture.products.set("prod_partial", {
          id: "prod_partial",
          object: "product",
          livemode: false,
          active: true,
          name: "partial",
          tax_code: "txcd_10103000",
          metadata: { app: "atmoshaper", atmoshaper_catalog: SUPPORTER_MEMBERSHIP_CATALOG_VERSION },
        })
      }],
      ["v1_product_semantics_mismatch", (fixture) => {
        fixture.products.get("prod_v1_support-1").active = false
      }],
      ["v1_price_semantics_mismatch", (fixture) => {
        fixture.prices.get("price_v1_support-1-month").active = false
      }],
      ["target_price_lookup_key_collision", (fixture) => {
        const spec = V2_TARGET_PRICE_SPECS[0]
        fixture.prices.set("price_unowned_collision", recurringPrice({
          id: "price_unowned_collision",
          product: "prod_unowned",
          unitAmount: spec.unitAmount,
          interval: spec.interval,
          metadata: {},
          lookupKey: targetLookupKey(spec),
        }))
      }],
    ]

    for (const [code, mutate] of cases) {
      const fixture = stripeFixture()
      const env = migrationEnv()
      mutate(fixture, env)
      await expectFailure(
        () => runSupporterV2SandboxMigration({
          stripe: fixture.stripe,
          mode: "plan",
          env,
        }),
        code,
      )
      assert.equal(mutationCalls(fixture).length, 0)
    }
  })

  it("never prints keys or provider identifiers at the CLI boundary", () => {
    const secret = "sk_test_secret_material_that_must_not_print"
    const result = spawnSync(
      process.execPath,
      [
        fileURLToPath(new URL("../scripts/stripe-supporter-v2-sandbox-catalog-migration.mjs", import.meta.url)),
        "--mode=plan",
      ],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          STRIPE_SECRET_KEY: secret,
          ATMOSHAPER_STRIPE_V2_EXPECTED_ACCOUNT_ID: "",
        },
      },
    )
    assert.notEqual(result.status, 0)
    assert.doesNotMatch(`${result.stdout}\n${result.stderr}`, /sk_test_secret|acct_/)
    assert.match(result.stderr, /FAIL expected_account_id_required/)
  })
})
