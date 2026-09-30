#!/usr/bin/env node

import process from "node:process"
import { pathToFileURL } from "node:url"
import Stripe from "stripe"
import {
  SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
  SUPPORTER_RECURRING_TAX_BEHAVIOR,
  recurringPriceSemanticsMatch,
} from "../lib/stripe-price-contract.js"
import {
  classifySupporterPriceMetadata,
  classifySupporterProductMetadata,
  hasAnySupporterSchemaMetadata,
} from "../lib/stripe-provider-identity.js"
import {
  managedSupporterPortalAllowlistIsVerified,
  normalizeSupporterPortalFeatures,
  supporterPortalAllowlistMatches,
} from "../lib/stripe-supporter-portal-contract.js"
import {
  SUPPORTER_V2_USES,
  V2_TARGET_PRICE_SPECS,
  V2_TARGET_PRODUCT_SPECS,
  buildSupporterV2PortalPayload,
  buildSupporterV2PricePayload,
  buildSupporterV2ProductPayload,
  classifySupporterV2PortalMetadata,
  hasAnySupporterV2PortalMetadata,
  supporterV2LookupKey,
  supporterV2PortalIdempotencyKey,
  supporterV2PriceIdempotencyKey,
  supporterV2PriceSpecForLookupKey,
  supporterV2ProductIdempotencyKey,
} from "../lib/stripe-supporter-v2-catalog-contract.js"
import {
  STRIPE_API_VERSION,
  STRIPE_PINNED_WEBHOOK_URL,
  validatePinnedStripeWebhookEndpoint,
} from "../lib/stripe-webhook-contract.js"

const APPLY_CONFIRMATION = "CREATE_SUPPORTER_V2_LIVE_CATALOG"
const MAX_LIST_PAGES = 10_000
const MAX_MANAGED_OBJECTS = 1_000
const TERMINAL_SUBSCRIPTION_STATUSES = new Set(["canceled", "incomplete_expired"])

/**
 * Public profile and billing-management policy for the dedicated live account.
 * The use-specific Product allowlists are added from the immutable v2 contract.
 */
export const LIVE_SUPPORTER_PORTAL_PROFILE = Object.freeze({
  business_profile: Object.freeze({
    headline: "Manage your AtmoShaper Supporter membership.",
    privacy_policy_url: "https://www.atmoshaper.com/legal/privacy",
    terms_of_service_url: "https://www.atmoshaper.com/legal/terms",
  }),
  default_return_url: "https://www.atmoshaper.com/account?tab=membership",
  features: Object.freeze({
    customer_update: Object.freeze({
      enabled: true,
      allowed_updates: Object.freeze(["address", "email", "name"]),
    }),
    invoice_history: Object.freeze({ enabled: true }),
    payment_method_update: Object.freeze({ enabled: true }),
    subscription_cancel: Object.freeze({
      enabled: true,
      mode: "at_period_end",
      proration_behavior: "none",
      cancellation_reason: Object.freeze({
        enabled: true,
        options: Object.freeze([
          "missing_features",
          "other",
          "switched_service",
          "too_expensive",
          "unused",
        ]),
      }),
    }),
    subscription_update: Object.freeze({}),
  }),
})

/** Safe operator error carrying only fixed failure codes and retained causes. */
export class SupporterV2LiveMigrationError extends Error {
  constructor(failureCodes, checks = [], options = {}) {
    super("Stripe Supporter v2 live migration failed.", options)
    this.name = "SupporterV2LiveMigrationError"
    this.failureCodes = [...new Set(failureCodes)]
    this.checks = checks
  }
}

/** Builds one fixed-code operator check without embedding provider data. */
function check(code, passed) {
  return { code, status: passed ? "PASS" : "FAIL" }
}

/** Returns one trimmed string setting without coercing non-string inputs. */
function envValue(env, key) {
  return typeof env?.[key] === "string" ? env[key].trim() : ""
}

/** Validates the live CLI boundary before any Stripe client or read is created. */
function buildConfig(env, mode) {
  const failureCodes = []
  if (!new Set(["verify", "plan", "apply"]).has(mode)) {
    failureCodes.push("migration_mode_invalid")
  }
  const secretKey = envValue(env, "STRIPE_SECRET_KEY")
  if (!secretKey.startsWith("sk_live_") && !secretKey.startsWith("rk_live_")) {
    failureCodes.push("live_secret_key_required")
  }
  const expectedAccountId = envValue(env, "ATMOSHAPER_STRIPE_LIVE_EXPECTED_ACCOUNT_ID")
  if (!expectedAccountId.startsWith("acct_")) {
    failureCodes.push("expected_live_account_id_required")
  }
  if (
    mode === "apply"
    && envValue(env, "ATMOSHAPER_STRIPE_LIVE_APPLY_CONFIRMATION") !== APPLY_CONFIRMATION
  ) {
    failureCodes.push("live_apply_confirmation_required")
  }
  if (failureCodes.length > 0) throw new SupporterV2LiveMigrationError(failureCodes)
  return {
    expectedAccountId,
    managedPortalCatalogConfirmation: envValue(
      env,
      "ATMOSHAPER_STRIPE_MANAGED_PORTAL_CATALOG_CONFIRMATION",
    ),
    secretKey,
  }
}

/** Reports whether one Stripe resource is explicitly live-mode. */
function modeMatches(object) {
  return object?.livemode === true
}

/** Normalizes an expandable Stripe relationship to its stable identifier. */
function idOf(value) {
  return typeof value === "string" ? value : value?.id ?? ""
}

/** Fully scans one Stripe list endpoint with bounded, progress-checked cursors. */
async function scanAll(list, params = {}) {
  const items = []
  let startingAfter = ""
  for (let pageNumber = 0; pageNumber < MAX_LIST_PAGES; pageNumber += 1) {
    const page = await list({
      ...params,
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    })
    if (!Array.isArray(page?.data) || typeof page?.has_more !== "boolean") {
      throw new SupporterV2LiveMigrationError(["stripe_list_response_invalid"])
    }
    items.push(...page.data)
    if (!page.has_more) return items
    const nextCursor = page.data.at(-1)?.id
    if (!nextCursor || nextCursor === startingAfter) {
      throw new SupporterV2LiveMigrationError(["stripe_list_pagination_stalled"])
    }
    startingAfter = nextCursor
  }
  throw new SupporterV2LiveMigrationError(["stripe_list_page_limit_exceeded"])
}

/** Adds one classified object while recording duplicate identities as drift. */
function addUnique(map, key, value, failureCodes, duplicateCode) {
  if (map.has(key)) {
    failureCodes.push(duplicateCode)
    return
  }
  map.set(key, value)
}

/** Resolves an immutable v2 Product target by its managed identity key. */
function v2ProductSpec(key) {
  return V2_TARGET_PRODUCT_SPECS.find((product) => product.key === key) ?? null
}

/** Resolves an immutable v2 Price target by its managed identity key. */
function v2PriceSpec(key) {
  return V2_TARGET_PRICE_SPECS.find((price) => price.key === key) ?? null
}

/** Verifies the live Product fields that must equal one immutable target. */
function exactProduct(candidate, spec) {
  return modeMatches(candidate)
    && candidate.active === true
    && candidate.name === spec.productName
    && candidate.description === spec.description
    && candidate.tax_code === spec.taxCode
}

/** Verifies one live Price's Product binding and recurring semantics. */
function exactPrice(candidate, spec, productId) {
  return modeMatches(candidate)
    && candidate.active === true
    && idOf(candidate.product) === productId
    && candidate.lookup_key === supporterV2LookupKey(spec)
    && recurringPriceSemanticsMatch(candidate, {
      unitAmount: spec.unitAmount,
      interval: spec.interval,
      taxBehavior: SUPPORTER_RECURRING_TAX_BEHAVIOR,
    })
}

/** Compares normalized JSON-safe contract values without provider object noise. */
function jsonEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
}

/** Normalizes Stripe's omitted and empty optional Portal text to one value. */
function normalizeOptionalPortalText(value) {
  return typeof value === "string" && value.length > 0 ? value : null
}

/** Accepts Stripe's first managed personal Portal as the account default. */
function managedPortalDefaultStatusMatches(candidate, supporterUse) {
  return candidate.is_default === false
    || (supporterUse === "personal" && candidate.is_default === true)
}

/** Verifies every managed live Portal field Stripe reliably returns except its catalog. */
function portalBaseMatches(candidate, payload, supporterUse) {
  const candidateFeatures = normalizeSupporterPortalFeatures(candidate.features)
  const payloadFeatures = normalizeSupporterPortalFeatures(payload.features)
  delete candidateFeatures.subscription_update.products
  delete payloadFeatures.subscription_update.products
  return modeMatches(candidate)
    && candidate.active === true
    && managedPortalDefaultStatusMatches(candidate, supporterUse)
    && classifySupporterV2PortalMetadata(candidate.metadata) === supporterUse
    && jsonEqual(
      {
        headline: normalizeOptionalPortalText(candidate.business_profile?.headline),
        privacy_policy_url: normalizeOptionalPortalText(
          candidate.business_profile?.privacy_policy_url,
        ),
        terms_of_service_url: normalizeOptionalPortalText(
          candidate.business_profile?.terms_of_service_url,
        ),
      },
      {
        headline: normalizeOptionalPortalText(payload.business_profile?.headline),
        privacy_policy_url: normalizeOptionalPortalText(
          payload.business_profile?.privacy_policy_url,
        ),
        terms_of_service_url: normalizeOptionalPortalText(
          payload.business_profile?.terms_of_service_url,
        ),
      },
    )
    && normalizeOptionalPortalText(candidate.default_return_url)
      === normalizeOptionalPortalText(payload.default_return_url)
    && jsonEqual(candidateFeatures, payloadFeatures)
}

/** Verifies a managed Portal including its API-visible or attested catalog. */
function portalMatches(candidate, payload, supporterUse, catalogConfirmation = "") {
  return portalBaseMatches(candidate, payload, supporterUse)
    && managedSupporterPortalAllowlistIsVerified(
      candidate.features,
      payload.features?.subscription_update?.products,
      catalogConfirmation,
    )
}

/** Accepts an omitted post-write catalog only as pending fresh operator evidence. */
function portalMutationReceiptMatches(candidate, payload, supporterUse) {
  if (!portalBaseMatches(candidate, payload, supporterUse)) return false
  const products = candidate?.features?.subscription_update?.products
  return products === undefined || supporterPortalAllowlistMatches(
    candidate.features,
    payload.features?.subscription_update?.products,
  )
}

/** Classifies exact live v2 objects and rejects every hidden catalog conflict. */
function classifyCatalog(products, prices) {
  const failureCodes = []
  const v2Products = new Map()
  const v2Prices = new Map()
  let managedCount = 0

  for (const candidate of products) {
    if (!hasAnySupporterSchemaMetadata(candidate.metadata)) {
      failureCodes.push("unexpected_unmanaged_product_inventory")
      continue
    }
    managedCount += 1
    const classification = classifySupporterProductMetadata(candidate.metadata, {
      catalogVersion: SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
    })
    if (!classification || classification.schema !== "current") {
      failureCodes.push("managed_product_metadata_mismatch")
      continue
    }
    const spec = v2ProductSpec(classification.amountChoiceId)
    if (!spec) {
      failureCodes.push("unexpected_managed_product")
      continue
    }
    if (!exactProduct(candidate, spec)) {
      failureCodes.push("v2_product_semantics_mismatch")
      continue
    }
    addUnique(v2Products, spec.key, candidate, failureCodes, "v2_product_duplicate")
  }

  for (const candidate of prices) {
    const claimedTarget = supporterV2PriceSpecForLookupKey(candidate.lookup_key)
    if (!hasAnySupporterSchemaMetadata(candidate.metadata)) {
      failureCodes.push(
        claimedTarget
          ? "target_price_lookup_key_collision"
          : "unexpected_unmanaged_price_inventory",
      )
      continue
    }
    managedCount += 1
    const classification = classifySupporterPriceMetadata(candidate.metadata, {
      catalogVersion: SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
    })
    if (!classification || classification.schema !== "current") {
      failureCodes.push("managed_price_metadata_mismatch")
      continue
    }
    if (claimedTarget && classification.priceKey !== claimedTarget.key) {
      failureCodes.push("target_price_lookup_key_collision")
      continue
    }
    const spec = v2PriceSpec(classification.priceKey)
    const product = spec ? v2Products.get(spec.productKey) : null
    if (!spec) {
      failureCodes.push("unexpected_managed_price")
      continue
    }
    if (!product) {
      failureCodes.push("v2_price_product_missing")
      continue
    }
    if (!exactPrice(candidate, spec, product.id)) {
      failureCodes.push("v2_price_semantics_mismatch")
      continue
    }
    addUnique(v2Prices, spec.key, candidate, failureCodes, "v2_price_duplicate")
  }

  if (managedCount > MAX_MANAGED_OBJECTS) {
    failureCodes.push("managed_object_limit_exceeded")
  }
  return { failureCodes, v2Products, v2Prices }
}

/** Classifies the two managed live Portals, including Stripe's first default Portal. */
function classifyPortals(portals) {
  const failureCodes = []
  const managed = new Map()
  const defaults = portals.filter((portal) => portal.is_default === true && modeMatches(portal))
  for (const portal of portals) {
    if (!hasAnySupporterV2PortalMetadata(portal.metadata)) {
      if (portal.is_default === true) continue
      failureCodes.push("unexpected_unmanaged_portal_inventory")
      continue
    }
    const supporterUse = classifySupporterV2PortalMetadata(portal.metadata)
    if (!supporterUse) {
      failureCodes.push("managed_portal_metadata_mismatch")
      continue
    }
    if (!modeMatches(portal) || !managedPortalDefaultStatusMatches(portal, supporterUse)) {
      failureCodes.push("managed_portal_mode_mismatch")
      continue
    }
    addUnique(managed, supporterUse, portal, failureCodes, "v2_portal_duplicate")
  }
  if (defaults.length > 1) failureCodes.push("default_portal_inventory_ambiguous")
  return { failureCodes, managed }
}

/** Retains only live subscriptions that can still affect billing state. */
function nonTerminalSubscriptions(subscriptions) {
  return subscriptions.filter((subscription) => (
    modeMatches(subscription)
    && !TERMINAL_SUBSCRIPTION_STATUSES.has(String(subscription.status ?? "").toLowerCase())
  ))
}

/** Retains only open live Checkout Sessions capable of creating subscriptions. */
function openSubscriptionSessions(sessions) {
  return sessions.filter((session) => (
    modeMatches(session)
    && session.status === "open"
    && session.mode === "subscription"
  ))
}

/** Reads every live dependency and returns a mutation-free migration plan. */
async function collectInventory(stripe, config) {
  let account
  let balance
  let products
  let prices
  let subscriptions
  let sessions
  let portals
  let endpoints
  try {
    account = await stripe.accounts.retrieve()
    balance = await stripe.balance.retrieve()
    products = await scanAll((params) => stripe.products.list(params))
    const [activePrices, inactivePrices] = await Promise.all([
      scanAll((params) => stripe.prices.list(params), {
        active: true,
        expand: ["data.currency_options"],
      }),
      scanAll((params) => stripe.prices.list(params), {
        active: false,
        expand: ["data.currency_options"],
      }),
    ])
    prices = [...activePrices, ...inactivePrices]
    subscriptions = await scanAll((params) => stripe.subscriptions.list(params), {
      status: "all",
    })
    sessions = await scanAll((params) => stripe.checkout.sessions.list(params), {
      status: "open",
    })
    portals = await scanAll((params) => stripe.billingPortal.configurations.list(params))
    endpoints = await scanAll((params) => stripe.webhookEndpoints.list(params))
  } catch (error) {
    if (error instanceof SupporterV2LiveMigrationError) throw error
    throw new SupporterV2LiveMigrationError(
      ["stripe_dependency_read_failed"],
      [],
      { cause: error },
    )
  }

  const failureCodes = []
  const accountMatches = account?.id === config.expectedAccountId && modeMatches(balance)
  if (!accountMatches) failureCodes.push("stripe_account_mode_mismatch")
  if (nonTerminalSubscriptions(subscriptions).length > 0) {
    failureCodes.push("unexpected_subscription_inventory")
  }
  if (openSubscriptionSessions(sessions).length > 0) {
    failureCodes.push("unexpected_open_checkout_session")
  }

  const catalog = classifyCatalog(products, prices)
  failureCodes.push(...catalog.failureCodes)
  const portal = classifyPortals(portals)
  failureCodes.push(...portal.failureCodes)

  const pinnedEndpoints = endpoints.filter((endpoint) => endpoint.url === STRIPE_PINNED_WEBHOOK_URL)
  if (
    pinnedEndpoints.length !== 1
    || !validatePinnedStripeWebhookEndpoint(pinnedEndpoints[0]).ready
    || !modeMatches(pinnedEndpoints[0])
  ) {
    failureCodes.push("webhook_dependency_mismatch")
  }

  const portalActions = new Map()
  for (const supporterUse of SUPPORTER_V2_USES) {
    const current = portal.managed.get(supporterUse)
    if (!current) {
      portalActions.set(supporterUse, "create")
      continue
    }
    if (
      catalog.v2Products.size === V2_TARGET_PRODUCT_SPECS.length
      && catalog.v2Prices.size === V2_TARGET_PRICE_SPECS.length
    ) {
      const payload = buildSupporterV2PortalPayload(
        LIVE_SUPPORTER_PORTAL_PROFILE,
        supporterUse,
        catalog.v2Products,
        catalog.v2Prices,
      )
      portalActions.set(
        supporterUse,
        portalMatches(
          current,
          payload,
          supporterUse,
          config.managedPortalCatalogConfirmation,
        )
          ? "none"
          : portalBaseMatches(current, payload, supporterUse)
            && current.features?.subscription_update?.products === undefined
            ? "confirmation"
            : "update",
      )
    } else {
      portalActions.set(supporterUse, "update")
    }
  }

  const complete = catalog.v2Products.size === V2_TARGET_PRODUCT_SPECS.length
    && catalog.v2Prices.size === V2_TARGET_PRICE_SPECS.length
    && portal.managed.size === SUPPORTER_V2_USES.length
    && [...portalActions.values()].every((action) => action === "none")
  const empty = products.length === 0
    && prices.length === 0
    && portal.managed.size === 0
  const state = complete ? "COMPLETED" : empty ? "PRE_MIGRATION" : "TRANSITIONAL"

  const checks = [
    check("live_account", accountMatches),
    check("subscriber_inventory", !failureCodes.includes("unexpected_subscription_inventory")),
    check("open_checkout_inventory", !failureCodes.includes("unexpected_open_checkout_session")),
    check("dedicated_catalog", !failureCodes.some((code) => code.includes("inventory"))),
    check("managed_catalog_consistent", !failureCodes.some((code) => (
      code.includes("managed_") || code.startsWith("v2_") || code.includes("lookup_key")
    ))),
    check("portal_dependencies", !failureCodes.some((code) => code.includes("portal_"))),
    check("webhook_dependency", !failureCodes.includes("webhook_dependency_mismatch")),
  ]
  if (failureCodes.length > 0) {
    throw new SupporterV2LiveMigrationError(failureCodes, checks)
  }
  return { ...catalog, ...portal, checks, portalActions, state }
}

/** Re-reads one mutation result and rejects it before dependent writes on drift. */
async function retrieveAndRequire(retrieve, id, validate, failureCode) {
  const candidate = await retrieve(id)
  if (!validate(candidate)) throw new SupporterV2LiveMigrationError([failureCode])
  return candidate
}

/** Applies only the exact live objects proven safe by the preceding inventory. */
async function applyMigration(stripe, inventory) {
  const products = new Map(inventory.v2Products)
  for (const spec of V2_TARGET_PRODUCT_SPECS) {
    if (products.has(spec.key)) continue
    const created = await stripe.products.create(buildSupporterV2ProductPayload(spec), {
      idempotencyKey: supporterV2ProductIdempotencyKey(spec),
    })
    const product = await retrieveAndRequire(
      (id) => stripe.products.retrieve(id),
      created.id,
      (candidate) => {
        const classification = classifySupporterProductMetadata(candidate.metadata, {
          catalogVersion: SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
        })
        return exactProduct(candidate, spec)
          && classification?.schema === "current"
          && classification.amountChoiceId === spec.key
      },
      "v2_product_mutation_unverified",
    )
    products.set(spec.key, product)
  }

  const prices = new Map(inventory.v2Prices)
  for (const spec of V2_TARGET_PRICE_SPECS) {
    if (prices.has(spec.key)) continue
    const product = products.get(spec.productKey)
    const created = await stripe.prices.create(
      buildSupporterV2PricePayload(spec, product.id),
      { idempotencyKey: supporterV2PriceIdempotencyKey(spec) },
    )
    const price = await retrieveAndRequire(
      (id) => stripe.prices.retrieve(id, { expand: ["currency_options"] }),
      created.id,
      (candidate) => {
        const classification = classifySupporterPriceMetadata(candidate.metadata, {
          catalogVersion: SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
        })
        return exactPrice(candidate, spec, product.id)
          && classification?.schema === "current"
          && classification.priceKey === spec.key
      },
      "v2_price_mutation_unverified",
    )
    prices.set(spec.key, price)
  }

  for (const supporterUse of SUPPORTER_V2_USES) {
    const current = inventory.managed.get(supporterUse)
    const action = inventory.portalActions.get(supporterUse)
    if (action === "none" || action === "confirmation") continue
    const payload = buildSupporterV2PortalPayload(
      LIVE_SUPPORTER_PORTAL_PROFILE,
      supporterUse,
      products,
      prices,
      { create: !current },
    )
    if (!current) {
      const created = await stripe.billingPortal.configurations.create(payload, {
        idempotencyKey: supporterV2PortalIdempotencyKey(supporterUse),
      })
      await retrieveAndRequire(
        (id) => stripe.billingPortal.configurations.retrieve(id),
        created.id,
        (candidate) => portalMutationReceiptMatches(candidate, payload, supporterUse),
        "v2_portal_mutation_unverified",
      )
      continue
    }
    await stripe.billingPortal.configurations.update(current.id, payload)
    await retrieveAndRequire(
      (id) => stripe.billingPortal.configurations.retrieve(id),
      current.id,
      (candidate) => portalMutationReceiptMatches(candidate, payload, supporterUse),
      "v2_portal_mutation_unverified",
    )
  }
}

/** Summarizes the bounded writes or confirmations needed by one inventory. */
function planFor(inventory) {
  return {
    createProducts: V2_TARGET_PRODUCT_SPECS.length - inventory.v2Products.size,
    createPrices: V2_TARGET_PRICE_SPECS.length - inventory.v2Prices.size,
    createPortals: [...inventory.portalActions.values()].filter(
      (action) => action === "create",
    ).length,
    updatePortals: [...inventory.portalActions.values()].filter(
      (action) => action === "update",
    ).length,
    confirmPortals: [...inventory.portalActions.values()].filter(
      (action) => action === "confirmation",
    ).length,
  }
}

/** Distinguishes a confirmation-only stop from incomplete catalog topology. */
function completionFailureCode(inventory) {
  const actions = [...inventory.portalActions.values()]
  return actions.every((action) => action === "none" || action === "confirmation")
    && actions.some((action) => action === "confirmation")
    ? "managed_portal_catalog_confirmation_required"
    : "v2_live_catalog_not_completed"
}

/** Runs a read-only verify/plan or the explicitly confirmed live apply. */
export async function runSupporterV2LiveMigration({
  stripe,
  mode,
  env = process.env,
} = {}) {
  const config = buildConfig(env, mode)
  let inventory = await collectInventory(stripe, config)
  const plan = planFor(inventory)

  if (mode === "verify" && inventory.state !== "COMPLETED") {
    throw new SupporterV2LiveMigrationError(
      [completionFailureCode(inventory)],
      inventory.checks,
    )
  }
  if (mode === "apply" && inventory.state !== "COMPLETED") {
    try {
      await applyMigration(stripe, inventory)
    } catch (error) {
      if (error instanceof SupporterV2LiveMigrationError) throw error
      throw new SupporterV2LiveMigrationError(
        ["stripe_mutation_failed"],
        inventory.checks,
        { cause: error },
      )
    }
    const wrotePortal = plan.createPortals > 0 || plan.updatePortals > 0
    inventory = await collectInventory(
      stripe,
      wrotePortal
        ? { ...config, managedPortalCatalogConfirmation: "" }
        : config,
    )
    if (inventory.state !== "COMPLETED") {
      throw new SupporterV2LiveMigrationError(
        [completionFailureCode(inventory)],
        inventory.checks,
      )
    }
  }

  return {
    ok: true,
    mode,
    state: inventory.state,
    plan,
    checks: [
      ...inventory.checks,
      check(mode === "apply" ? "post_apply_verification" : "read_only_inventory", true),
    ],
  }
}

/** Formats a non-secret operator receipt for a successful live migration run. */
export function formatLiveMigrationChecklist(result) {
  return [
    ...result.checks.map(({ status, code }) => `${status} ${code}`),
    `STATE ${result.state}`,
    `PLAN products_create=${result.plan.createProducts}`,
    `PLAN prices_create=${result.plan.createPrices}`,
    `PLAN portals_create=${result.plan.createPortals}`,
    `PLAN portals_update=${result.plan.updatePortals}`,
    `PLAN portals_confirm=${result.plan.confirmPortals}`,
  ].join("\n")
}

/** Formats only fixed failure codes and precomputed non-secret checks. */
export function formatLiveMigrationFailure(error) {
  return [
    ...(error?.checks ?? []).map(({ status, code }) => `${status} ${code}`),
    ...(error?.failureCodes ?? ["unexpected_migration_failure"])
      .map((code) => `FAIL ${code}`),
  ].join("\n")
}

/** Reads one exact --name=value command-line argument. */
function argumentValue(name) {
  const prefix = `${name}=`
  return process.argv.slice(2).find((argument) => argument.startsWith(prefix))?.slice(prefix.length) ?? ""
}

/** Runs the standalone CLI while keeping provider values out of its receipt. */
async function main() {
  const mode = argumentValue("--mode")
  try {
    const config = buildConfig(process.env, mode)
    const stripe = new Stripe(config.secretKey, { apiVersion: STRIPE_API_VERSION })
    const result = await runSupporterV2LiveMigration({ stripe, mode, env: process.env })
    console.log(formatLiveMigrationChecklist(result))
  } catch (error) {
    console.error(formatLiveMigrationFailure(error))
    process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main()
}
