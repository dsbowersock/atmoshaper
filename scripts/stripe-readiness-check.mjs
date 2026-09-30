#!/usr/bin/env node

/**
 * Checks the Stripe membership environment without printing secret values.
 * Use `--live` for production readiness and `--verify-stripe` when network
 * access is available to retrieve configured Price records from Stripe.
 */
import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import Stripe from "stripe"
import { config as loadDotenv } from "dotenv"
import { BACKGROUND_COMMERCE_TAX_PRODUCT_CODE } from "../lib/commerce/constants.js"
import { DIGITAL_PURCHASES_REFUNDS_VERSION } from "../lib/legal-documents.js"
import { getConfiguredMembershipReconciliationOptions } from "../lib/membership.js"
import {
  getOneTimeSupportTaxReadiness,
  getSupporterRecurringTaxReadiness,
  isExplicitTrue,
  REQUIRED_SUPPORTER_PRICE_CONTRACT,
  validateRetrievedDefaultSupporterPortalConfiguration,
  validateRetrievedLegacyMembershipPrice,
  validateRetrievedMembershipPrice,
  validateRetrievedSupporterPortalConfiguration,
  validateSupporterProductTopology,
} from "../lib/stripe-readiness.js"
import { LEGACY_TARGET_PRICE_SPECS } from "../lib/stripe-supporter-membership-migration-contract.js"
import {
  DEFAULT_SUPPORTER_PORTAL_CATALOG_CONFIRMATION,
  MANAGED_SUPPORTER_PORTAL_CATALOG_CONFIRMATION,
} from "../lib/stripe-supporter-portal-contract.js"
import {
  STRIPE_API_VERSION,
  STRIPE_BACKGROUND_COMMERCE_WEBHOOK_EVENTS,
  STRIPE_PINNED_WEBHOOK_URL,
  validatePinnedStripeWebhookEndpoint,
} from "../lib/stripe-webhook-contract.js"

const rawArgs = process.argv.slice(2)
const args = new Set(rawArgs.filter((arg) => !arg.startsWith("--env-file=")))
const envFileArg = rawArgs.find((arg) => arg.startsWith("--env-file="))
const explicitEnvFile = envFileArg ? envFileArg.slice("--env-file=".length) : ""
const liveMode = args.has("--live")
const verifyStripe = args.has("--verify-stripe")
const noDotenv = args.has("--no-dotenv")
const processLocalDefaultPortalCatalogConfirmation =
  process.env.ATMOSHAPER_STRIPE_DEFAULT_PORTAL_CATALOG_CONFIRMATION
const processLocalManagedPortalCatalogConfirmation =
  process.env.ATMOSHAPER_STRIPE_MANAGED_PORTAL_CATALOG_CONFIRMATION

const failures = []
const warnings = []
const priceIds = new Map()
const legacyPriceIds = new Map()
const portalConfigurationIds = new Map()
const verifiedPortalConfigurations = new Map([
  ["personal", false],
  ["business", false],
])
const managedPortalCatalogEvidence = new Map([
  ["personal", "not_checked"],
  ["business", "not_checked"],
])
let commerceWebhookCoverageComplete = false
let verifiedWebhookCoverageComplete = !verifyStripe
let verifiedWebhookEndpointEnabled = !verifyStripe
let verifiedWebhookApiVersionCurrent = !verifyStripe
let stripeRetrievalPerformed = false
let stripeSecretReady = false
let priceIdInventoryComplete = false
let defaultPortalCatalogEvidence = liveMode ? "not_applicable" : "not_checked"
let liveDefaultPortalVerified = false

if (!noDotenv) {
  loadEnvironment(explicitEnvFile)
}

function addFailure(message) {
  failures.push(message)
}

function addWarning(message) {
  warnings.push(message)
}

/** Reads the catalog attestation only from the inherited process environment. */
function envValue(key) {
  const value = key === "ATMOSHAPER_STRIPE_DEFAULT_PORTAL_CATALOG_CONFIRMATION"
    ? processLocalDefaultPortalCatalogConfirmation
    : key === "ATMOSHAPER_STRIPE_MANAGED_PORTAL_CATALOG_CONFIRMATION"
      ? processLocalManagedPortalCatalogConfirmation
      : process.env[key]
  return value?.trim() ?? ""
}

function loadEnvironment(envFile) {
  const candidates = envFile
    ? [envFile]
    : [".env.local", ".env"]

  if (envFile) {
    const absolutePath = path.resolve(envFile)
    if (!fs.existsSync(absolutePath)) {
      addFailure(`Env file not found: ${absolutePath}`)
      return
    }
  }

  for (const candidate of candidates) {
    const absolutePath = path.resolve(candidate)
    if (fs.existsSync(absolutePath)) {
      loadDotenv({ path: absolutePath, override: false, quiet: true })
    }
  }
}

function checkSecretKey() {
  const key = envValue("STRIPE_SECRET_KEY")
  if (!key) {
    addFailure("STRIPE_SECRET_KEY is missing.")
    return
  }

  if (liveMode && !key.startsWith("sk_live_")) {
    addFailure("STRIPE_SECRET_KEY must be a live secret key for production readiness.")
    return
  }

  if (!liveMode && !key.startsWith("sk_test_") && !key.startsWith("sk_live_")) {
    addWarning("STRIPE_SECRET_KEY is configured but does not use the expected sk_test_ or sk_live_ prefix.")
  }
  stripeSecretReady = true
}

function checkWebhookSecret() {
  const secret = envValue("STRIPE_WEBHOOK_SECRET")
  if (!secret) {
    addFailure("STRIPE_WEBHOOK_SECRET is missing.")
    return
  }

  if (!secret.startsWith("whsec_")) {
    addFailure("STRIPE_WEBHOOK_SECRET should use Stripe's whsec_ webhook signing secret format.")
  }
}

function checkPriceIds() {
  // Validate every required membership-interval Price ID and reject either a
  // non-Stripe prefix or reuse of the same ID across contract entries.
  for (const expected of REQUIRED_SUPPORTER_PRICE_CONTRACT) {
    const priceId = envValue(expected.key)
    if (!priceId) {
      addFailure(`${expected.key} is missing.`)
      continue
    }

    if (!priceId.startsWith("price_")) {
      addFailure(`${expected.key} must be a Stripe Price ID.`)
      continue
    }

    if (priceIds.has(priceId)) {
      const duplicate = priceIds.get(priceId)
      addFailure(`${expected.key} duplicates ${duplicate.key}; each membership interval needs its own Price ID.`)
      continue
    }

    priceIds.set(priceId, expected)
  }
  if (!liveMode) {
    for (const expected of LEGACY_TARGET_PRICE_SPECS) {
      const priceId = envValue(expected.envKey)
      if (!priceId) {
        addFailure(`${expected.envKey} is missing.`)
        continue
      }
      if (!priceId.startsWith("price_")) {
        addFailure(`${expected.envKey} must be a Stripe Price ID.`)
        continue
      }
      if (legacyPriceIds.has(priceId)) {
        addFailure(`${expected.envKey} duplicates a retained v1 Price mapping.`)
        continue
      }
      legacyPriceIds.set(priceId, expected)
    }
  }
  const reconciliationCounts = new Map()
  for (const { priceId } of getConfiguredMembershipReconciliationOptions(process.env)) {
    reconciliationCounts.set(priceId, (reconciliationCounts.get(priceId) ?? 0) + 1)
  }
  const reconciliationIdsUnique = [...reconciliationCounts.values()]
    .every((count) => count === 1)
  if (!reconciliationIdsUnique) {
    addFailure(
      "Stripe membership Price mappings must be unique across current and reconciliation namespaces.",
    )
  }

  priceIdInventoryComplete = priceIds.size === REQUIRED_SUPPORTER_PRICE_CONTRACT.length
    && (liveMode || legacyPriceIds.size === LEGACY_TARGET_PRICE_SPECS.length)
    && reconciliationIdsUnique
}

/** Validates both use-specific Portal IDs before any Stripe retrieval. */
function checkPortalConfigurationIds() {
  for (const supporterUse of ["personal", "business"]) {
    const key = `STRIPE_SUPPORTER_${supporterUse.toUpperCase()}_PORTAL_CONFIGURATION_ID`
    const configurationId = envValue(key)
    if (!configurationId) {
      addFailure(`${key} is missing.`)
      continue
    }
    if (!configurationId.startsWith("bpc_")) {
      addFailure(`${key} must be a Stripe Portal configuration ID.`)
      continue
    }
    if (portalConfigurationIds.has(configurationId)) {
      addFailure(`${key} duplicates ${portalConfigurationIds.get(configurationId).key}; each buyer use needs its own Portal configuration.`)
      continue
    }
    portalConfigurationIds.set(configurationId, { key, supporterUse })
  }
}

/** Retrieves every Portal configuration without unsupported expansion options. */
async function listPortalConfigurations(stripe) {
  const configurations = []
  let startingAfter = ""
  for (let pageNumber = 0; pageNumber < 100; pageNumber += 1) {
    const page = await stripe.billingPortal.configurations.list({
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    })
    if (!Array.isArray(page?.data)) throw new Error("Invalid Portal configuration page")
    configurations.push(...page.data)
    if (page.has_more !== true) return configurations
    const nextCursor = page.data.at(-1)?.id
    if (!nextCursor || nextCursor === startingAfter) {
      throw new Error("Portal configuration pagination did not advance")
    }
    startingAfter = nextCursor
  }
  throw new Error("Portal configuration pagination exceeded its safety bound")
}

/**
 * Validates the non-secret deployment attestations required for recurring
 * Supporter Automatic Tax. Stripe retrieval separately proves Product/Price
 * classification when --verify-stripe is enabled.
 */
function checkSupporterRecurringTaxReadiness() {
  const recurringTax = getSupporterRecurringTaxReadiness({
    STRIPE_SUPPORTER_AUTOMATIC_TAX_ENABLED: envValue(
      "STRIPE_SUPPORTER_AUTOMATIC_TAX_ENABLED",
    ),
    STRIPE_SUPPORTER_PERSONAL_TAX_PRODUCT_CODE: envValue(
      "STRIPE_SUPPORTER_PERSONAL_TAX_PRODUCT_CODE",
    ),
    STRIPE_SUPPORTER_BUSINESS_TAX_PRODUCT_CODE: envValue(
      "STRIPE_SUPPORTER_BUSINESS_TAX_PRODUCT_CODE",
    ),
    STRIPE_SUPPORTER_TAX_PROVIDER_READY: envValue(
      "STRIPE_SUPPORTER_TAX_PROVIDER_READY",
    ),
    STRIPE_SUPPORTER_TAX_REGISTRATIONS_READY: envValue(
      "STRIPE_SUPPORTER_TAX_REGISTRATIONS_READY",
    ),
    STRIPE_SUPPORTER_TAX_CLASSIFICATION_CONFIRMED: envValue(
      "STRIPE_SUPPORTER_TAX_CLASSIFICATION_CONFIRMED",
    ),
  })

  if (!recurringTax.automaticTaxEnabled) {
    addFailure("Supporter recurring tax automatic-tax enablement is not configured.")
  }
  if (!recurringTax.taxProductCodeConfigured) {
    addFailure("Supporter recurring tax product classification is not configured.")
  }
  if (!recurringTax.taxProviderReady) {
    addFailure("Supporter recurring tax provider readiness is not configured.")
  }
  if (!recurringTax.taxRegistrationsReady) {
    addFailure("Supporter recurring tax registrations are not confirmed.")
  }
  if (!recurringTax.taxClassificationConfirmed) {
    addFailure("Supporter recurring tax classification is not professionally confirmed.")
  }

  return recurringTax
}

/**
 * Validates the deployment attestations for one-time support independently
 * from recurring memberships and permanent background purchases.
 *
 * Reads the Automatic Tax enablement, exact tax Product code, provider
 * readiness, registrations readiness, and classification-confirmation
 * environment attestations. Missing or invalid values fail closed through
 * `addFailure`.
 *
 * @returns {ReturnType<typeof getOneTimeSupportTaxReadiness>} The five
 * normalized attestation booleans and their all-required `ready` aggregate.
 */
function checkOneTimeSupportTaxReadiness() {
  const oneTimeTax = getOneTimeSupportTaxReadiness({
    STRIPE_ONE_TIME_SUPPORT_AUTOMATIC_TAX_ENABLED: envValue(
      "STRIPE_ONE_TIME_SUPPORT_AUTOMATIC_TAX_ENABLED",
    ),
    STRIPE_ONE_TIME_SUPPORT_TAX_PRODUCT_CODE: envValue(
      "STRIPE_ONE_TIME_SUPPORT_TAX_PRODUCT_CODE",
    ),
    STRIPE_ONE_TIME_SUPPORT_TAX_PROVIDER_READY: envValue(
      "STRIPE_ONE_TIME_SUPPORT_TAX_PROVIDER_READY",
    ),
    STRIPE_ONE_TIME_SUPPORT_TAX_REGISTRATIONS_READY: envValue(
      "STRIPE_ONE_TIME_SUPPORT_TAX_REGISTRATIONS_READY",
    ),
    STRIPE_ONE_TIME_SUPPORT_TAX_CLASSIFICATION_CONFIRMED: envValue(
      "STRIPE_ONE_TIME_SUPPORT_TAX_CLASSIFICATION_CONFIRMED",
    ),
  })

  if (!oneTimeTax.automaticTaxEnabled) {
    addFailure("One-time support tax automatic-tax enablement is not configured.")
  }
  if (!oneTimeTax.taxProductCodeConfigured) {
    addFailure("One-time support tax product classification is not configured.")
  }
  if (!oneTimeTax.taxProviderReady) {
    addFailure("One-time support tax provider readiness is not configured.")
  }
  if (!oneTimeTax.taxRegistrationsReady) {
    addFailure("One-time support tax registrations are not confirmed.")
  }
  if (!oneTimeTax.taxClassificationConfirmed) {
    addFailure("One-time support tax classification is not professionally confirmed.")
  }

  return oneTimeTax
}

/**
 * Validates only explicit, deploy-time background-commerce signals. Values are
 * reported as booleans or non-secret identifiers so the check cannot expose
 * Stripe credentials or processor payloads.
 */
function checkBackgroundCommerceReadiness() {
  const purchasingEnabled = isExplicitTrue(envValue("BACKGROUND_COMMERCE_PURCHASING_ENABLED"))
  const fixedUsdPriceConfigured = envValue("BACKGROUND_COMMERCE_PRICE_CENTS") === "100"
    && envValue("BACKGROUND_COMMERCE_CURRENCY").toLowerCase() === "usd"
  const purchaseCountries = envValue("BACKGROUND_COMMERCE_PURCHASE_COUNTRIES")
    .split(",")
    .map((country) => country.trim().toUpperCase())
    .filter(Boolean)
  const purchaseCountryAllowlistConfigured = purchaseCountries.length === 1
    && purchaseCountries[0] === "US"
  const digitalPurchaseDocumentCurrent = envValue("BACKGROUND_COMMERCE_DIGITAL_PURCHASE_DOCUMENT_VERSION")
    === DIGITAL_PURCHASES_REFUNDS_VERSION
  const configuredEvents = new Set(envValue("BACKGROUND_COMMERCE_WEBHOOK_EVENTS")
    .split(",")
    .map((event) => event.trim())
    .filter(Boolean))
  commerceWebhookCoverageComplete = configuredEvents.size === STRIPE_BACKGROUND_COMMERCE_WEBHOOK_EVENTS.length
    && STRIPE_BACKGROUND_COMMERCE_WEBHOOK_EVENTS.every((event) => configuredEvents.has(event))
  const webhookReady = isExplicitTrue(envValue("BACKGROUND_COMMERCE_WEBHOOK_READY"))
  const reconciliationReady = isExplicitTrue(envValue("BACKGROUND_COMMERCE_RECONCILIATION_READY"))
  const taxMode = envValue("BACKGROUND_COMMERCE_TAX_MODE").toLowerCase()
  const taxModeRecognized = taxMode === "disabled" || taxMode === "stripe"
  const taxProductCodeConfigured = envValue("BACKGROUND_COMMERCE_TAX_PRODUCT_CODE")
    === BACKGROUND_COMMERCE_TAX_PRODUCT_CODE
  const taxProviderReady = isExplicitTrue(envValue("BACKGROUND_COMMERCE_TAX_PROVIDER_READY"))
  const taxRegistrationsReady = isExplicitTrue(envValue("BACKGROUND_COMMERCE_TAX_REGISTRATIONS_READY"))
  const stripeTaxReady = taxMode === "stripe"
    && taxProductCodeConfigured
    && taxProviderReady
    && taxRegistrationsReady
  const internationalEnabled = purchaseCountries.some((country) => country !== "US")

  if (!purchasingEnabled) addFailure("Background commerce purchasing enablement is not configured.")
  if (!fixedUsdPriceConfigured) addFailure("Background commerce fixed USD price is not configured.")
  if (!purchaseCountryAllowlistConfigured) addFailure("Background commerce purchase-country allowlist is not configured.")
  if (!digitalPurchaseDocumentCurrent) addFailure("Background commerce digital-purchase document version is not current.")
  if (!webhookReady) addFailure("Background commerce webhook readiness is not configured.")
  if (!commerceWebhookCoverageComplete) addFailure("Background commerce webhook event coverage is incomplete.")
  if (!reconciliationReady) addFailure("Background commerce reconciliation readiness is not configured.")
  if (!taxModeRecognized) addFailure("Background commerce tax mode is not configured.")
  if (taxMode === "disabled") addFailure("Paid background commerce requires Stripe automatic tax.")
  if (taxMode === "stripe" && !taxProductCodeConfigured) {
    addFailure("Background commerce Stripe Tax product code is not configured.")
  }
  if (taxMode === "stripe" && !taxProviderReady) {
    addFailure("Background commerce Stripe Tax provider readiness is not configured.")
  }
  if (taxMode === "stripe" && !taxRegistrationsReady) {
    addFailure("Background commerce Stripe Tax registrations are not confirmed.")
  }
  if (liveMode && internationalEnabled && !stripeTaxReady) {
    addFailure("Live international background commerce requires Stripe tax mode with explicit registration and product-code readiness.")
  }

  return {
    fixedUsdPriceConfigured,
    purchaseCountryAllowlistConfigured,
    digitalPurchaseDocumentCurrent,
    webhookReady,
    reconciliationReady,
    taxMode: taxModeRecognized ? taxMode : "missing",
    taxProductCodeConfigured,
    taxProviderReady,
    taxRegistrationsReady,
  }
}

/** Retrieves and validates every configured Stripe dependency without mutation. */
async function verifyStripePrices() {
  if (!verifyStripe || !stripeSecretReady || !priceIdInventoryComplete) {
    return
  }

  const stripe = new Stripe(envValue("STRIPE_SECRET_KEY"), {
    apiVersion: STRIPE_API_VERSION,
  })

  // Retrieval completion is separate from catalog validity: topology uses
  // every successfully fetched Price, while API failures alone make
  // `stripeRetrievalPerformed` false.
  let allPricesRetrieved = true
  const expectedLivemode = envValue("STRIPE_SECRET_KEY").startsWith("sk_live_")
  const retrievedMembershipPrices = []
  for (const [priceId, expected] of priceIds) {
    try {
      const price = await stripe.prices.retrieve(priceId, { expand: ["product", "currency_options"] })
      const validationFailures = validateRetrievedMembershipPrice(price, expected)
      retrievedMembershipPrices.push({ expected, price })
      for (const failure of validationFailures) {
        addFailure(failure)
      }
    } catch {
      allPricesRetrieved = false
      addFailure(`${expected.key} could not be retrieved from Stripe.`)
    }
  }
  const topologyFailures = validateSupporterProductTopology(retrievedMembershipPrices)
  if (topologyFailures.length > 0) {
    for (const failure of topologyFailures) addFailure(failure)
  }
  const retrievedLegacyMembershipPrices = []
  if (!liveMode) {
    for (const [priceId, expected] of legacyPriceIds) {
      try {
        const price = await stripe.prices.retrieve(priceId, { expand: ["product", "currency_options"] })
        retrievedLegacyMembershipPrices.push({ expected, price })
        for (const failure of validateRetrievedLegacyMembershipPrice(
          price,
          expected,
          expectedLivemode,
        )) addFailure(failure)
      } catch {
        allPricesRetrieved = false
        addFailure(`${expected.envKey} could not be retrieved from Stripe.`)
      }
    }
  }
  const allLegacyPricesRetrieved = !liveMode
    && retrievedLegacyMembershipPrices.length === legacyPriceIds.size
  stripeRetrievalPerformed = allPricesRetrieved

  let defaultConfiguration = null
  try {
    const configurations = await listPortalConfigurations(stripe)
    const defaults = configurations.filter((configuration) => (
      configuration?.active === true
      && configuration?.is_default === true
      && configuration?.livemode === expectedLivemode
    ))
    if (defaults.length !== 1) {
      addFailure(
        liveMode
          ? "The live default Stripe Portal configuration could not be uniquely verified."
          : "The retained default Stripe Portal configuration could not be uniquely verified.",
      )
    } else {
      defaultConfiguration = defaults[0]
      if (liveMode) {
        const personalPortalId = [...portalConfigurationIds]
          .find(([, value]) => value.supporterUse === "personal")?.[0]
        liveDefaultPortalVerified = defaultConfiguration.id === personalPortalId
        if (!liveDefaultPortalVerified) {
          addFailure(
            "The live default Stripe Portal must be the configured personal Supporter Portal.",
          )
        }
      } else if (allLegacyPricesRetrieved) {
        const defaultPortalCatalogConfirmation = envValue(
          "ATMOSHAPER_STRIPE_DEFAULT_PORTAL_CATALOG_CONFIRMATION",
        )
        const productsReturned = defaultConfiguration?.features
          ?.subscription_update?.products !== undefined
        if (productsReturned) {
          defaultPortalCatalogEvidence = "stripe_api"
        } else if (
          defaultPortalCatalogConfirmation
          === DEFAULT_SUPPORTER_PORTAL_CATALOG_CONFIRMATION
        ) {
          defaultPortalCatalogEvidence = "operator_confirmation"
        } else {
          defaultPortalCatalogEvidence = "missing"
        }
        for (const failure of validateRetrievedDefaultSupporterPortalConfiguration(
          defaultConfiguration,
          {
            defaultPortalCatalogConfirmation,
            retrievedLegacyMembershipPrices,
            livemode: expectedLivemode,
          },
        )) addFailure(failure)
      }
    }
  } catch {
    addFailure(
      liveMode
        ? "The live default Stripe Portal configuration could not be retrieved."
        : "The retained default Stripe Portal configuration could not be retrieved.",
    )
  }
  for (const [configurationId, { key, supporterUse }] of portalConfigurationIds) {
    try {
      const configuration = await stripe.billingPortal.configurations.retrieve(configurationId)
      const managedPortalCatalogConfirmation = envValue(
        "ATMOSHAPER_STRIPE_MANAGED_PORTAL_CATALOG_CONFIRMATION",
      )
      const productsReturned = configuration?.features?.subscription_update?.products !== undefined
      managedPortalCatalogEvidence.set(
        supporterUse,
        productsReturned
          ? "stripe_api"
          : managedPortalCatalogConfirmation === MANAGED_SUPPORTER_PORTAL_CATALOG_CONFIRMATION
            ? "operator_confirmation"
            : "missing",
      )
      const portalFailures = validateRetrievedSupporterPortalConfiguration(
        configuration,
        {
          configurationId,
          supporterUse,
          retrievedMembershipPrices,
          livemode: expectedLivemode,
          defaultConfiguration,
          personalMayBeDefault: liveMode,
          defaultProfileDescription: liveMode
            ? "managed personal default Portal"
            : "retained default Portal",
          managedPortalCatalogConfirmation,
        },
      )
      for (const failure of portalFailures) addFailure(failure)
      verifiedPortalConfigurations.set(supporterUse, portalFailures.length === 0)
    } catch {
      addFailure(`${key} could not be retrieved from Stripe.`)
    }
  }

  try {
    const endpoints = await stripe.webhookEndpoints.list({ limit: 100 })
    const endpoint = endpoints.data.find((candidate) => candidate.url === STRIPE_PINNED_WEBHOOK_URL)
    const endpointResult = validatePinnedStripeWebhookEndpoint(endpoint)
    verifiedWebhookCoverageComplete = endpointResult.eventSetExact
    verifiedWebhookEndpointEnabled = endpointResult.enabled
    verifiedWebhookApiVersionCurrent = endpointResult.apiVersionCurrent
    if (!endpointResult.endpointFound) addFailure("The pinned Stripe webhook endpoint was not found.")
    if (endpointResult.endpointFound && !endpointResult.enabled) addFailure("The pinned Stripe webhook endpoint is not enabled.")
    if (endpointResult.endpointFound && !endpointResult.apiVersionCurrent) {
      addFailure("The pinned Stripe webhook endpoint API version does not match the app.")
    }
    if (endpointResult.endpointFound && !endpointResult.eventSetExact) {
      addFailure("The pinned Stripe webhook endpoint event set does not exactly match the app contract.")
    }
  } catch {
    verifiedWebhookCoverageComplete = false
    verifiedWebhookEndpointEnabled = false
    verifiedWebhookApiVersionCurrent = false
    addFailure("The pinned Stripe webhook endpoint could not be verified.")
  }
}

/** Prints non-secret readiness evidence and every accumulated diagnostic. */
function printResults(supporterTax, oneTimeTax, commerce) {
  console.log(`Stripe readiness mode: ${liveMode ? "live" : "non-live"}`)
  console.log(`Stripe API retrieval requested: ${verifyStripe}`)
  console.log(`Stripe API retrieval performed: ${stripeRetrievalPerformed}`)
  console.log(`Supporter personal Portal configuration verified: ${verifiedPortalConfigurations.get("personal")}`)
  console.log(`Supporter business Portal configuration verified: ${verifiedPortalConfigurations.get("business")}`)
  console.log(`Supporter personal Portal catalog evidence: ${managedPortalCatalogEvidence.get("personal")}`)
  console.log(`Supporter business Portal catalog evidence: ${managedPortalCatalogEvidence.get("business")}`)
  console.log(`Retained default Portal catalog evidence: ${defaultPortalCatalogEvidence}`)
  console.log(`Live default personal Portal topology verified: ${liveMode ? liveDefaultPortalVerified : "not_applicable"}`)
  console.log(`Supporter recurring automatic tax enabled: ${supporterTax.automaticTaxEnabled}`)
  console.log(`Supporter recurring tax product code configured: ${supporterTax.taxProductCodeConfigured}`)
  console.log(`Supporter recurring tax provider ready: ${supporterTax.taxProviderReady}`)
  console.log(`Supporter recurring tax registrations confirmed: ${supporterTax.taxRegistrationsReady}`)
  console.log(`Supporter recurring tax classification confirmed: ${supporterTax.taxClassificationConfirmed}`)
  console.log(`One-time support automatic tax enabled: ${oneTimeTax.automaticTaxEnabled}`)
  console.log(`One-time support tax product code configured: ${oneTimeTax.taxProductCodeConfigured}`)
  console.log(`One-time support tax provider ready: ${oneTimeTax.taxProviderReady}`)
  console.log(`One-time support tax registrations confirmed: ${oneTimeTax.taxRegistrationsReady}`)
  console.log(`One-time support tax classification confirmed: ${oneTimeTax.taxClassificationConfirmed}`)
  console.log(`Background commerce fixed USD price configured: ${commerce.fixedUsdPriceConfigured}`)
  console.log(`Background commerce purchase-country allowlist configured: ${commerce.purchaseCountryAllowlistConfigured}`)
  console.log(`Background commerce digital-purchase document current: ${commerce.digitalPurchaseDocumentCurrent}`)
  console.log(`Background commerce webhook readiness configured: ${commerce.webhookReady}`)
  console.log(`Background commerce webhook event coverage complete: ${commerceWebhookCoverageComplete && verifiedWebhookCoverageComplete}`)
  console.log(`Pinned Stripe webhook endpoint enabled: ${verifiedWebhookEndpointEnabled}`)
  console.log(`Pinned Stripe webhook API version current: ${verifiedWebhookApiVersionCurrent}`)
  console.log(`Background commerce reconciliation configured: ${commerce.reconciliationReady}`)
  console.log(`Background commerce tax mode: ${commerce.taxMode}`)
  console.log(`Background commerce tax product code configured: ${commerce.taxProductCodeConfigured}`)
  console.log(`Background commerce tax provider ready: ${commerce.taxProviderReady}`)
  console.log(`Background commerce tax registrations confirmed: ${commerce.taxRegistrationsReady}`)

  for (const warning of warnings) {
    console.log(`WARN ${warning}`)
  }

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(`FAIL ${failure}`)
    }
    process.exitCode = 1
    return
  }

  console.log("One-time support tax readiness: ready")
  console.log("Background commerce readiness: ready")
  console.log("PASS Stripe membership environment is ready for the selected mode.")
}

checkSecretKey()
checkWebhookSecret()
checkPriceIds()
checkPortalConfigurationIds()
if (liveMode && !verifyStripe) {
  addFailure("Live Stripe readiness requires --verify-stripe.")
}
const supporterTax = checkSupporterRecurringTaxReadiness()
const oneTimeTax = checkOneTimeSupportTaxReadiness()
const commerce = checkBackgroundCommerceReadiness()
await verifyStripePrices()
if (verifyStripe && !stripeRetrievalPerformed) {
  addFailure("Stripe Price retrieval did not complete for every required Supporter contract slot.")
}
if (
  verifyStripe
  && [...verifiedPortalConfigurations.values()].some((verified) => !verified)
) {
  addFailure("Stripe Portal verification did not complete for both Supporter buyer uses.")
}
printResults(supporterTax, oneTimeTax, commerce)
