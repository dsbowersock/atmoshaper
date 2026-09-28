#!/usr/bin/env node

import process from "node:process"
import { pathToFileURL } from "node:url"
import Stripe from "stripe"
import {
  LEGACY_SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
  SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
  SUPPORTER_RECURRING_TAX_BEHAVIOR,
  recurringPriceSemanticsMatch,
} from "../lib/stripe-price-contract.js"
import {
  buildCurrentSupporterPriceMetadata,
  buildCurrentSupporterProductMetadata,
  classifySupporterPriceMetadata,
  classifySupporterProductMetadata,
  hasAnySupporterSchemaMetadata,
} from "../lib/stripe-provider-identity.js"
import {
  LEGACY_TARGET_PRICE_SPECS,
  TARGET_PRICE_SPECS,
} from "../lib/stripe-supporter-membership-migration-contract.js"
import {
  hasApprovedSupporterPortalManagementFeatures,
  hasApprovedSupporterPortalTransitionPolicy,
  normalizeSupporterPortalFeatures,
  supporterPortalAllowlistMatches,
} from "../lib/stripe-supporter-portal-contract.js"
import {
  STRIPE_API_VERSION,
  STRIPE_PINNED_WEBHOOK_URL,
  validatePinnedStripeWebhookEndpoint,
} from "../lib/stripe-webhook-contract.js"

const APPLY_CONFIRMATION = "CREATE_SUPPORTER_V2_SANDBOX_CATALOG"
const MAX_LIST_PAGES = 10_000
const MAX_MANAGED_OBJECTS = 1_000
const TERMINAL_SUBSCRIPTION_STATUSES = new Set(["canceled", "incomplete_expired"])
const PORTAL_METADATA_KEYS = Object.freeze([
  "app",
  "atmoshaper_catalog",
  "atmoshaper_membership_level",
  "atmoshaper_portal_supporter_use",
])

export const V2_TARGET_PRICE_SPECS = TARGET_PRICE_SPECS

/** Builds the six immutable amount/use Product targets from the Price contract. */
function buildTargetProductSpecs() {
  const grouped = new Map()
  for (const price of V2_TARGET_PRICE_SPECS) {
    const existing = grouped.get(price.productKey)
    if (existing) {
      if (
        existing.amountChoiceId !== price.amountChoiceId
        || existing.supporterUse !== price.supporterUse
        || existing.productName !== price.productName
        || existing.taxCode !== price.taxCode
      ) {
        throw new Error("Supporter v2 Product contract is contradictory.")
      }
      existing.priceKeys.push(price.key)
      continue
    }
    grouped.set(price.productKey, {
      key: price.productKey,
      amountChoiceId: price.amountChoiceId,
      supporterUse: price.supporterUse,
      productName: price.productName,
      taxCode: price.taxCode,
      priceKeys: [price.key],
    })
  }

  const products = [...grouped.values()].map((product) => {
    const prices = product.priceKeys.map((key) => (
      V2_TARGET_PRICE_SPECS.find((candidate) => candidate.key === key)
    ))
    const month = prices.find((price) => price?.interval === "month")
    const year = prices.find((price) => price?.interval === "year")
    if (
      prices.length !== 2
      || !month
      || !year
      || new Set(product.priceKeys).size !== 2
    ) {
      throw new Error("Each Supporter v2 Product must own one monthly and one annual Price.")
    }
    return Object.freeze({
      ...product,
      priceKeys: Object.freeze([...product.priceKeys]),
      description: `$${month.unitAmount / 100} monthly or $${year.unitAmount / 100} annually. Same Supporter Membership benefits; classified for ${product.supporterUse} use.`,
    })
  })
  if (products.length !== 6 || V2_TARGET_PRICE_SPECS.length !== 12) {
    throw new Error("Supporter v2 catalog must contain six Products and twelve Prices.")
  }
  return Object.freeze(products)
}

export const V2_TARGET_PRODUCT_SPECS = buildTargetProductSpecs()

/** Safe operator error carrying only fixed failure codes and retained causes. */
export class SupporterV2MigrationError extends Error {
  constructor(failureCodes, checks = [], options = {}) {
    super("Stripe Supporter v2 sandbox migration failed.", options)
    this.name = "SupporterV2MigrationError"
    this.failureCodes = [...new Set(failureCodes)]
    this.checks = checks
  }
}

function check(code, passed) {
  return { code, status: passed ? "PASS" : "FAIL" }
}

function envValue(env, key) {
  return typeof env?.[key] === "string" ? env[key].trim() : ""
}

/** Validates the command boundary before any Stripe client or read is created. */
function buildConfig(env, mode) {
  const failureCodes = []
  if (!new Set(["verify", "plan", "apply"]).has(mode)) {
    failureCodes.push("migration_mode_invalid")
  }
  const secretKey = envValue(env, "STRIPE_SECRET_KEY")
  if (!secretKey.startsWith("sk_test_")) {
    failureCodes.push("sandbox_secret_key_required")
  }
  const expectedAccountId = envValue(env, "ATMOSHAPER_STRIPE_V2_EXPECTED_ACCOUNT_ID")
  if (!expectedAccountId.startsWith("acct_")) {
    failureCodes.push("expected_account_id_required")
  }
  if (
    mode === "apply"
    && envValue(env, "ATMOSHAPER_STRIPE_V2_APPLY_CONFIRMATION") !== APPLY_CONFIRMATION
  ) {
    failureCodes.push("sandbox_apply_confirmation_required")
  }
  if (failureCodes.length > 0) {
    throw new SupporterV2MigrationError(failureCodes)
  }
  return { expectedAccountId, secretKey }
}

function modeMatches(object) {
  return object?.livemode === false
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
      throw new SupporterV2MigrationError(["stripe_list_response_invalid"])
    }
    items.push(...page.data)
    if (!page.has_more) return items
    const nextCursor = page.data.at(-1)?.id
    if (!nextCursor || nextCursor === startingAfter) {
      throw new SupporterV2MigrationError(["stripe_list_pagination_stalled"])
    }
    startingAfter = nextCursor
  }
  throw new SupporterV2MigrationError(["stripe_list_page_limit_exceeded"])
}

function idOf(value) {
  return typeof value === "string" ? value : value?.id ?? ""
}

function v1ProductSpec(key) {
  const prices = LEGACY_TARGET_PRICE_SPECS.filter((price) => price.productKey === key)
  return prices.length === 2
    ? {
        key,
        productName: prices[0].productName,
        taxCode: prices[0].taxCode,
        priceKeys: prices.map((price) => price.key),
      }
    : null
}

function v2ProductSpec(key) {
  return V2_TARGET_PRODUCT_SPECS.find((product) => product.key === key) ?? null
}

function v1PriceSpec(key) {
  return LEGACY_TARGET_PRICE_SPECS.find((price) => price.key === key) ?? null
}

function v2PriceSpec(key) {
  return V2_TARGET_PRICE_SPECS.find((price) => price.key === key) ?? null
}

function exactProduct(candidate, spec) {
  return modeMatches(candidate)
    && candidate.active === true
    && candidate.name === spec.productName
    && candidate.description === spec.description
    && candidate.tax_code === spec.taxCode
}

function exactV1Product(candidate, spec) {
  return modeMatches(candidate)
    && candidate.active === true
    && candidate.name === spec.productName
    && candidate.tax_code === spec.taxCode
}

function lookupKeyFor(spec) {
  return `atmoshaper_supporter_v2_${spec.key.replaceAll("-", "_")}`
}

/** Returns the one v2 target whose immutable lookup key a Price claims. */
function v2PriceSpecForLookupKey(lookupKey) {
  return V2_TARGET_PRICE_SPECS.find((spec) => lookupKeyFor(spec) === lookupKey) ?? null
}

function exactPrice(candidate, spec, productId) {
  return modeMatches(candidate)
    && candidate.active === true
    && idOf(candidate.product) === productId
    && candidate.lookup_key === lookupKeyFor(spec)
    && recurringPriceSemanticsMatch(candidate, {
      unitAmount: spec.unitAmount,
      interval: spec.interval,
      taxBehavior: SUPPORTER_RECURRING_TAX_BEHAVIOR,
    })
}

function exactV1Price(candidate, spec, productId) {
  return modeMatches(candidate)
    && candidate.active === true
    && idOf(candidate.product) === productId
    && recurringPriceSemanticsMatch(candidate, {
      unitAmount: spec.unitAmount,
      interval: spec.interval,
    })
}

function portalMetadata(supporterUse) {
  return {
    app: "atmoshaper",
    atmoshaper_catalog: SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
    atmoshaper_membership_level: "SUPPORTER",
    atmoshaper_portal_supporter_use: supporterUse,
  }
}

function hasAnyPortalMetadata(value) {
  return Boolean(value && typeof value === "object" && PORTAL_METADATA_KEYS.some(
    (key) => Object.hasOwn(value, key),
  ))
}

function classifyPortalMetadata(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const supporterUse = value.atmoshaper_portal_supporter_use
  if (
    value.app !== "atmoshaper"
    || value.atmoshaper_catalog !== SUPPORTER_MEMBERSHIP_CATALOG_VERSION
    || value.atmoshaper_membership_level !== "SUPPORTER"
    || !new Set(["personal", "business"]).has(supporterUse)
  ) {
    return null
  }
  return supporterUse
}

function jsonEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
}

/** Builds the exact retained v1 Product and Price allowlist for its default Portal. */
function retainedV1PortalProducts(products, prices) {
  return [...new Set(LEGACY_TARGET_PRICE_SPECS.map(({ productKey }) => productKey))]
    .map((productKey) => ({
      product: products.get(productKey)?.id ?? null,
      prices: LEGACY_TARGET_PRICE_SPECS
        .filter((spec) => spec.productKey === productKey)
        .map((spec) => prices.get(spec.key)?.id ?? null),
      adjustable_quantity: { enabled: false },
    }))
}

function defaultPortalBaseIsSafe(portal, products, prices) {
  return modeMatches(portal)
    && portal.active === true
    && portal.is_default === true
    && hasApprovedSupporterPortalManagementFeatures(portal.features)
    && hasApprovedSupporterPortalTransitionPolicy(portal.features)
    && supporterPortalAllowlistMatches(
      portal.features,
      retainedV1PortalProducts(products, prices),
    )
}

function desiredPortalFeatures(defaultPortal, supporterUse, products, prices) {
  const base = normalizeSupporterPortalFeatures(defaultPortal.features)
  const targetProducts = V2_TARGET_PRODUCT_SPECS
    .filter((product) => product.supporterUse === supporterUse)
    .map((product) => ({
      product: products.get(product.key).id,
      prices: product.priceKeys.map((key) => prices.get(key).id).sort(),
      adjustable_quantity: { enabled: false },
    }))
    .sort((left, right) => left.product.localeCompare(right.product))

  return {
    customer_update: base.customer_update,
    invoice_history: base.invoice_history,
    payment_method_update: base.payment_method_update,
    subscription_cancel: base.subscription_cancel,
    subscription_update: {
      enabled: true,
      default_allowed_updates: ["price"],
      billing_cycle_anchor: "unchanged",
      proration_behavior: "none",
      // The Stripe form encoder needs an explicit empty scalar to clear this
      // nested array; response normalization treats it as an empty list.
      schedule_at_period_end: { conditions: "" },
      trial_update_behavior: "end_trial",
      products: targetProducts,
    },
  }
}

function portalPayload(defaultPortal, supporterUse, products, prices, { create = false } = {}) {
  const businessProfile = Object.fromEntries(Object.entries({
    headline: defaultPortal.business_profile?.headline,
    privacy_policy_url: defaultPortal.business_profile?.privacy_policy_url,
    terms_of_service_url: defaultPortal.business_profile?.terms_of_service_url,
  }).flatMap(([key, value]) => {
    if (typeof value === "string" && value.length > 0) return [[key, value]]
    return create ? [] : [[key, ""]]
  }))

  return {
    ...(create ? { name: `AtmoShaper Supporter Portal — ${supporterUse}` } : {}),
    active: true,
    ...(Object.keys(businessProfile).length > 0 ? { business_profile: businessProfile } : {}),
    ...(
      defaultPortal.default_return_url || !create
        ? { default_return_url: defaultPortal.default_return_url ?? "" }
        : {}
    ),
    features: desiredPortalFeatures(defaultPortal, supporterUse, products, prices),
    metadata: portalMetadata(supporterUse),
  }
}

function normalizeOptionalPortalText(value) {
  return typeof value === "string" && value.length > 0 ? value : null
}

function portalMatches(candidate, payload, supporterUse) {
  return modeMatches(candidate)
    && candidate.active === true
    && candidate.is_default === false
    && classifyPortalMetadata(candidate.metadata) === supporterUse
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
    && jsonEqual(
      normalizeSupporterPortalFeatures(candidate.features),
      normalizeSupporterPortalFeatures(payload.features),
    )
}

function addUnique(map, key, value, failureCodes, duplicateCode) {
  if (map.has(key)) {
    failureCodes.push(duplicateCode)
    return
  }
  map.set(key, value)
}

/** Classifies every managed catalog object and refuses ambiguous ownership. */
function classifyCatalog(products, prices) {
  const failureCodes = []
  const v1Products = new Map()
  const v2Products = new Map()
  const v1Prices = new Map()
  const v2Prices = new Map()
  let managedCount = 0

  for (const candidate of products) {
    if (!hasAnySupporterSchemaMetadata(candidate.metadata)) continue
    managedCount += 1
    const v1 = classifySupporterProductMetadata(candidate.metadata, {
      catalogVersion: LEGACY_SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
    })
    const v2 = classifySupporterProductMetadata(candidate.metadata, {
      catalogVersion: SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
    })
    if (!v1 && !v2) {
      failureCodes.push("managed_product_metadata_mismatch")
      continue
    }
    const classification = v2 ?? v1
    const spec = v2
      ? v2ProductSpec(classification.amountChoiceId)
      : v1ProductSpec(classification.amountChoiceId)
    if (!spec) {
      failureCodes.push("unexpected_managed_product")
      continue
    }
    if (v2 && !exactProduct(candidate, spec)) {
      failureCodes.push("v2_product_semantics_mismatch")
      continue
    }
    if (v1 && !exactV1Product(candidate, spec)) {
      failureCodes.push("v1_product_semantics_mismatch")
      continue
    }
    addUnique(
      v2 ? v2Products : v1Products,
      spec.key,
      candidate,
      failureCodes,
      v2 ? "v2_product_duplicate" : "v1_product_duplicate",
    )
  }

  for (const candidate of prices) {
    const claimedTarget = v2PriceSpecForLookupKey(candidate.lookup_key)
    if (!hasAnySupporterSchemaMetadata(candidate.metadata)) {
      if (claimedTarget) failureCodes.push("target_price_lookup_key_collision")
      continue
    }
    managedCount += 1
    const v1 = classifySupporterPriceMetadata(candidate.metadata, {
      catalogVersion: LEGACY_SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
    })
    const v2 = classifySupporterPriceMetadata(candidate.metadata, {
      catalogVersion: SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
    })
    if (!v1 && !v2) {
      failureCodes.push("managed_price_metadata_mismatch")
      continue
    }
    if (claimedTarget && (!v2 || v2.priceKey !== claimedTarget.key)) {
      failureCodes.push("target_price_lookup_key_collision")
      continue
    }
    const classification = v2 ?? v1
    const spec = v2 ? v2PriceSpec(classification.priceKey) : v1PriceSpec(classification.priceKey)
    const product = spec
      ? (v2 ? v2Products : v1Products).get(spec.productKey)
      : null
    if (!spec) {
      failureCodes.push("unexpected_managed_price")
      continue
    }
    if (!product) {
      failureCodes.push(v2 ? "v2_price_product_missing" : "v1_price_product_missing")
      continue
    }
    if (v2 && !exactPrice(candidate, spec, product.id)) {
      failureCodes.push("v2_price_semantics_mismatch")
      continue
    }
    if (v1 && !exactV1Price(candidate, spec, product.id)) {
      failureCodes.push("v1_price_semantics_mismatch")
      continue
    }
    addUnique(
      v2 ? v2Prices : v1Prices,
      spec.key,
      candidate,
      failureCodes,
      v2 ? "v2_price_duplicate" : "v1_price_duplicate",
    )
  }

  if (managedCount > MAX_MANAGED_OBJECTS) {
    failureCodes.push("managed_object_limit_exceeded")
  }
  if (
    v1Products.size !== 3
    || v1Prices.size !== LEGACY_TARGET_PRICE_SPECS.length
  ) {
    failureCodes.push("v1_catalog_incomplete")
  }
  return { failureCodes, v1Products, v1Prices, v2Products, v2Prices }
}

function classifyPortals(portals, v1Products, v1Prices) {
  const failureCodes = []
  const managed = new Map()
  const defaults = portals.filter((portal) => portal.is_default === true && modeMatches(portal))
  const defaultPortal = defaults[0] ?? null
  for (const portal of portals) {
    if (!hasAnyPortalMetadata(portal.metadata)) continue
    const supporterUse = classifyPortalMetadata(portal.metadata)
    if (!supporterUse) {
      failureCodes.push("managed_portal_metadata_mismatch")
      continue
    }
    if (portal.is_default !== false || portal.id === defaultPortal?.id) {
      failureCodes.push("managed_portal_default_conflict")
      continue
    }
    addUnique(managed, supporterUse, portal, failureCodes, "v2_portal_duplicate")
  }
  if (
    defaults.length !== 1
    || !defaultPortalBaseIsSafe(defaults[0], v1Products, v1Prices)
  ) {
    failureCodes.push("default_portal_dependency_mismatch")
  }
  return { failureCodes, defaultPortal, managed }
}

function openSubscriptionSessions(sessions) {
  return sessions.filter((session) => (
    modeMatches(session)
    && session.status === "open"
    && session.mode === "subscription"
  ))
}

function nonTerminalSubscriptions(subscriptions) {
  return subscriptions.filter((subscription) => (
    modeMatches(subscription)
    && !TERMINAL_SUBSCRIPTION_STATUSES.has(String(subscription.status ?? "").toLowerCase())
  ))
}

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
    const priceListParams = { expand: ["data.currency_options"] }
    const [activePrices, inactivePrices] = await Promise.all([
      scanAll((params) => stripe.prices.list(params), {
        ...priceListParams,
        active: true,
      }),
      scanAll((params) => stripe.prices.list(params), {
        ...priceListParams,
        active: false,
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
    if (error instanceof SupporterV2MigrationError) throw error
    throw new SupporterV2MigrationError(["stripe_dependency_read_failed"], [], { cause: error })
  }

  const failureCodes = []
  // Stripe's Account object does not carry `livemode`; the account identity
  // and the mode-bearing Balance together prove the exact sandbox boundary.
  const accountMatches = account?.id === config.expectedAccountId
    && modeMatches(balance)
  if (!accountMatches) failureCodes.push("stripe_account_mode_mismatch")
  if (nonTerminalSubscriptions(subscriptions).length > 0) {
    failureCodes.push("unexpected_subscription_inventory")
  }
  if (openSubscriptionSessions(sessions).length > 0) {
    failureCodes.push("unexpected_open_checkout_session")
  }

  const catalog = classifyCatalog(products, prices)
  failureCodes.push(...catalog.failureCodes)
  const portal = classifyPortals(portals, catalog.v1Products, catalog.v1Prices)
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
  if (portal.defaultPortal) {
    for (const supporterUse of ["personal", "business"]) {
      const current = portal.managed.get(supporterUse)
      if (!current) {
        portalActions.set(supporterUse, "create")
        continue
      }
      if (
        catalog.v2Products.size === V2_TARGET_PRODUCT_SPECS.length
        && catalog.v2Prices.size === V2_TARGET_PRICE_SPECS.length
      ) {
        const payload = portalPayload(
          portal.defaultPortal,
          supporterUse,
          catalog.v2Products,
          catalog.v2Prices,
        )
        portalActions.set(
          supporterUse,
          portalMatches(current, payload, supporterUse) ? "none" : "update",
        )
      } else {
        portalActions.set(supporterUse, "update")
      }
    }
  }

  const complete = catalog.v2Products.size === V2_TARGET_PRODUCT_SPECS.length
    && catalog.v2Prices.size === V2_TARGET_PRICE_SPECS.length
    && portal.managed.size === 2
    && [...portalActions.values()].every((action) => action === "none")
  const empty = catalog.v2Products.size === 0
    && catalog.v2Prices.size === 0
    && portal.managed.size === 0
  const state = complete ? "COMPLETED" : empty ? "PRE_MIGRATION" : "TRANSITIONAL"

  const checks = [
    check("sandbox_account", accountMatches),
    check("subscriber_inventory", !failureCodes.includes("unexpected_subscription_inventory")),
    check("open_checkout_inventory", !failureCodes.includes("unexpected_open_checkout_session")),
    check("v1_catalog_preserved", !failureCodes.some((code) => code.startsWith("v1_"))),
    check("managed_catalog_consistent", !failureCodes.some((code) => (
      code.includes("managed_") || code.startsWith("v2_")
    ))),
    check("portal_dependencies", !failureCodes.some((code) => code.includes("portal_"))),
    check("webhook_dependency", !failureCodes.includes("webhook_dependency_mismatch")),
  ]
  if (failureCodes.length > 0) {
    throw new SupporterV2MigrationError(failureCodes, checks)
  }
  return { ...catalog, ...portal, checks, portalActions, state }
}

function productPayload(spec) {
  return {
    name: spec.productName,
    description: spec.description,
    active: true,
    tax_code: spec.taxCode,
    metadata: buildCurrentSupporterProductMetadata({}, spec.key),
  }
}

function pricePayload(spec, productId) {
  return {
    product: productId,
    unit_amount: spec.unitAmount,
    currency: "usd",
    billing_scheme: "per_unit",
    recurring: {
      interval: spec.interval,
      interval_count: 1,
      usage_type: "licensed",
    },
    tax_behavior: SUPPORTER_RECURRING_TAX_BEHAVIOR,
    lookup_key: lookupKeyFor(spec),
    transfer_lookup_key: false,
    metadata: buildCurrentSupporterPriceMetadata({}, spec.key),
  }
}

function productIdempotencyKey(spec) {
  return `atmoshaper:supporter:v2:product:${spec.key}`
}

function priceIdempotencyKey(spec) {
  return `atmoshaper:supporter:v2:price:${spec.key}`
}

function portalIdempotencyKey(supporterUse) {
  return `atmoshaper:supporter:v2:portal:${supporterUse}`
}

async function retrieveAndRequire(retrieve, id, validate, failureCode) {
  const candidate = await retrieve(id)
  if (!validate(candidate)) {
    throw new SupporterV2MigrationError([failureCode])
  }
  return candidate
}

async function applyMigration(stripe, inventory) {
  const products = new Map(inventory.v2Products)
  for (const spec of V2_TARGET_PRODUCT_SPECS) {
    if (products.has(spec.key)) continue
    const created = await stripe.products.create(productPayload(spec), {
      idempotencyKey: productIdempotencyKey(spec),
    })
    const product = await retrieveAndRequire(
      (id) => stripe.products.retrieve(id),
      created.id,
      (candidate) => exactProduct(candidate, spec)
        && classifySupporterProductMetadata(candidate.metadata, {
          catalogVersion: SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
        })?.amountChoiceId === spec.key,
      "v2_product_mutation_unverified",
    )
    products.set(spec.key, product)
  }

  const prices = new Map(inventory.v2Prices)
  for (const spec of V2_TARGET_PRICE_SPECS) {
    if (prices.has(spec.key)) continue
    const product = products.get(spec.productKey)
    const created = await stripe.prices.create(pricePayload(spec, product.id), {
      idempotencyKey: priceIdempotencyKey(spec),
    })
    const price = await retrieveAndRequire(
      (id) => stripe.prices.retrieve(id, { expand: ["currency_options"] }),
      created.id,
      (candidate) => exactPrice(candidate, spec, product.id)
        && classifySupporterPriceMetadata(candidate.metadata, {
          catalogVersion: SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
        })?.priceKey === spec.key,
      "v2_price_mutation_unverified",
    )
    prices.set(spec.key, price)
  }

  for (const supporterUse of ["personal", "business"]) {
    const current = inventory.managed.get(supporterUse)
    const payload = portalPayload(
      inventory.defaultPortal,
      supporterUse,
      products,
      prices,
      { create: !current },
    )
    if (!current) {
      const created = await stripe.billingPortal.configurations.create(payload, {
        idempotencyKey: portalIdempotencyKey(supporterUse),
      })
      await retrieveAndRequire(
        (id) => stripe.billingPortal.configurations.retrieve(id),
        created.id,
        (candidate) => portalMatches(candidate, payload, supporterUse),
        "v2_portal_mutation_unverified",
      )
      continue
    }
    if (portalMatches(current, payload, supporterUse)) continue
    await stripe.billingPortal.configurations.update(current.id, payload)
    await retrieveAndRequire(
      (id) => stripe.billingPortal.configurations.retrieve(id),
      current.id,
      (candidate) => portalMatches(candidate, payload, supporterUse),
      "v2_portal_mutation_unverified",
    )
  }
}

function planFor(inventory) {
  return {
    createProducts: V2_TARGET_PRODUCT_SPECS.length - inventory.v2Products.size,
    createPrices: V2_TARGET_PRICE_SPECS.length - inventory.v2Prices.size,
    createPortals: [...inventory.portalActions.values()].filter((action) => action === "create").length,
    updatePortals: [...inventory.portalActions.values()].filter((action) => action === "update").length,
  }
}

/** Runs a read-only verify/plan or the explicitly confirmed sandbox apply. */
export async function runSupporterV2SandboxMigration({
  stripe,
  mode,
  env = process.env,
} = {}) {
  const config = buildConfig(env, mode)
  let inventory = await collectInventory(stripe, config)
  const plan = planFor(inventory)

  if (mode === "verify" && inventory.state !== "COMPLETED") {
    throw new SupporterV2MigrationError(["v2_catalog_not_completed"], inventory.checks)
  }
  if (mode === "apply" && inventory.state !== "COMPLETED") {
    try {
      await applyMigration(stripe, inventory)
    } catch (error) {
      if (error instanceof SupporterV2MigrationError) throw error
      throw new SupporterV2MigrationError(["stripe_mutation_failed"], inventory.checks, {
        cause: error,
      })
    }
    inventory = await collectInventory(stripe, config)
    if (inventory.state !== "COMPLETED") {
      throw new SupporterV2MigrationError(["v2_catalog_not_completed"], inventory.checks)
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

export function formatMigrationChecklist(result) {
  return [
    ...result.checks.map(({ status, code }) => `${status} ${code}`),
    `STATE ${result.state}`,
    `PLAN products_create=${result.plan.createProducts}`,
    `PLAN prices_create=${result.plan.createPrices}`,
    `PLAN portals_create=${result.plan.createPortals}`,
    `PLAN portals_update=${result.plan.updatePortals}`,
  ].join("\n")
}

export function formatMigrationFailure(error) {
  return [
    ...(error?.checks ?? []).map(({ status, code }) => `${status} ${code}`),
    ...(error?.failureCodes ?? ["unexpected_migration_failure"])
      .map((code) => `FAIL ${code}`),
  ].join("\n")
}

function argumentValue(name) {
  const prefix = `${name}=`
  return process.argv.slice(2).find((argument) => argument.startsWith(prefix))?.slice(prefix.length) ?? ""
}

async function main() {
  const mode = argumentValue("--mode")
  try {
    const config = buildConfig(process.env, mode)
    const stripe = new Stripe(config.secretKey, { apiVersion: STRIPE_API_VERSION })
    const result = await runSupporterV2SandboxMigration({ stripe, mode, env: process.env })
    console.log(formatMigrationChecklist(result))
  } catch (error) {
    console.error(formatMigrationFailure(error))
    process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main()
}
