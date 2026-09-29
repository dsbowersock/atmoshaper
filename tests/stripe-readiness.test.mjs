import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, it } from "node:test"
import { fileURLToPath } from "node:url"
import { DIGITAL_PURCHASES_REFUNDS_VERSION } from "../lib/legal-documents.js"
import {
  getOneTimeSupportTaxReadiness,
  isExplicitTrue,
  REQUIRED_SUPPORTER_PRICE_CONTRACT,
  validateRetrievedDefaultSupporterPortalConfiguration,
  validateRetrievedMembershipPrice,
  validateRetrievedSupporterPortalConfiguration,
  validateSupporterProductTopology,
} from "../lib/stripe-readiness.js"
import { STRIPE_API_VERSION } from "../lib/stripe-webhook-contract.js"
import { SUPPORTER_AMOUNT_CHOICES } from "../lib/membership.js"
import {
  LEGACY_SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
  recurringPriceSemanticMismatches,
  SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
} from "../lib/stripe-price-contract.js"
import StripeReadinessStub from "./fixtures/stripe-readiness-stripe-stub.mjs"
import { LEGACY_TARGET_PRICE_SPECS } from "../lib/stripe-supporter-membership-migration-contract.js"
import {
  DEFAULT_SUPPORTER_PORTAL_CATALOG_CONFIRMATION,
  MANAGED_SUPPORTER_PORTAL_CATALOG_CONFIRMATION,
} from "../lib/stripe-supporter-portal-contract.js"

const readinessScriptPath = fileURLToPath(
  new URL("../scripts/stripe-readiness-check.mjs", import.meta.url),
)
const readinessHookUrl =
  new URL("./fixtures/stripe-readiness-hook.mjs", import.meta.url).href

/**
 * Creates a valid expanded Product for one Supporter amount-and-use slot.
 * Top-level overrides intentionally model isolated invalid Product states.
 */
function supporterProduct(expected = REQUIRED_SUPPORTER_PRICE_CONTRACT[0], overrides = {}) {
  return {
    id: `prod_${expected.productKey.replaceAll("-", "_")}`,
    active: true,
    name: expected.productName,
    tax_code: expected.taxCode,
    metadata: {
      app: "atmoshaper",
      atmoshaper_catalog: SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
      atmoshaper_membership_level: "SUPPORTER",
      atmoshaper_supporter_amount_choice: expected.productKey,
    },
    ...overrides,
  }
}

const membershipPrices = Object.fromEntries(
  REQUIRED_SUPPORTER_PRICE_CONTRACT.map(({ key }) => [
    key,
    `price_${key.toLowerCase().replaceAll("stripe_supporter_", "supporter_").replaceAll("_price_id", "")}`,
  ]),
)
const legacyMembershipPrices = Object.fromEntries(
  LEGACY_TARGET_PRICE_SPECS.map(({ envKey }) => [
    envKey,
    `price_v1_${envKey.toLowerCase().replaceAll("stripe_supporter_", "supporter_").replaceAll("_price_id", "")}`,
  ]),
)

/** Builds exact retrieved Price evidence for one use-specific Portal contract. */
function retrievedMembershipPricesForUse(supporterUse) {
  return REQUIRED_SUPPORTER_PRICE_CONTRACT
    .filter((expected) => expected.supporterUse === supporterUse)
    .map((expected) => ({
      expected,
      price: {
        id: membershipPrices[expected.key],
        product: supporterProduct(expected),
      },
    }))
}

/** Builds a valid managed Portal response for direct readiness validation. */
function supporterPortalConfiguration(supporterUse = "personal") {
  const entries = retrievedMembershipPricesForUse(supporterUse)
  const products = new Map()
  for (const { expected, price } of entries) {
    const current = products.get(expected.productKey) ?? {
      product: price.product.id,
      prices: [],
      adjustable_quantity: { enabled: false },
    }
    current.prices.push(price.id)
    products.set(expected.productKey, current)
  }
  return {
    id: `bpc_${supporterUse}`,
    active: true,
    is_default: false,
    livemode: false,
    business_profile: {
      headline: "Manage your AtmoShaper Supporter membership.",
      privacy_policy_url: "https://www.atmoshaper.com/legal/privacy",
      terms_of_service_url: "https://www.atmoshaper.com/legal/terms",
    },
    default_return_url: "https://www.atmoshaper.com/account?tab=membership",
    metadata: {
      app: "atmoshaper",
      atmoshaper_catalog: SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
      atmoshaper_membership_level: "SUPPORTER",
      atmoshaper_portal_supporter_use: supporterUse,
    },
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
        products: [...products.values()],
      },
    },
  }
}

/** Builds the retained default Portal profile used by managed Portal validation. */
function defaultPortalConfiguration() {
  const configuration = supporterPortalConfiguration()
  return {
    ...configuration,
    id: "bpc_default",
    is_default: true,
    metadata: {},
  }
}

/** Builds the six retained v1 Price records used to attest the default Portal. */
function retrievedLegacyMembershipPrices() {
  return LEGACY_TARGET_PRICE_SPECS.map((expected) => ({
    expected,
    price: {
      id: legacyMembershipPrices[expected.envKey],
      product: { id: `prod_v1_${expected.productKey}` },
    },
  }))
}

/**
 * Returns the complete hermetic child environment for readiness checks.
 */
function readinessEnvironment(overrides = {}) {
  const environment = {
    PATH: process.env.PATH,
    ...(process.env.SystemRoot ? { SystemRoot: process.env.SystemRoot } : {}),
    ...(process.env.COMSPEC ? { COMSPEC: process.env.COMSPEC } : {}),
    STRIPE_SECRET_KEY: "sk_test_readiness",
    STRIPE_WEBHOOK_SECRET: "whsec_readiness",
    STRIPE_SUPPORTER_PERSONAL_PORTAL_CONFIGURATION_ID: "bpc_personal",
    STRIPE_SUPPORTER_BUSINESS_PORTAL_CONFIGURATION_ID: "bpc_business",
    BACKGROUND_COMMERCE_PURCHASING_ENABLED: "true",
    BACKGROUND_COMMERCE_PRICE_CENTS: "100",
    BACKGROUND_COMMERCE_CURRENCY: "usd",
    BACKGROUND_COMMERCE_PURCHASE_COUNTRIES: "US",
    BACKGROUND_COMMERCE_DIGITAL_PURCHASE_DOCUMENT_VERSION: DIGITAL_PURCHASES_REFUNDS_VERSION,
    BACKGROUND_COMMERCE_WEBHOOK_READY: "true",
    BACKGROUND_COMMERCE_WEBHOOK_EVENTS: "checkout.session.completed,checkout.session.expired,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,refund.created,refund.updated,refund.failed,charge.dispute.created,charge.dispute.updated,charge.dispute.closed",
    BACKGROUND_COMMERCE_RECONCILIATION_READY: "true",
    BACKGROUND_COMMERCE_TAX_MODE: "stripe",
    BACKGROUND_COMMERCE_TAX_PRODUCT_CODE: "txcd_10000000",
    BACKGROUND_COMMERCE_TAX_PROVIDER_READY: "true",
    BACKGROUND_COMMERCE_TAX_REGISTRATIONS_READY: "true",
    STRIPE_SUPPORTER_AUTOMATIC_TAX_ENABLED: "true",
    STRIPE_SUPPORTER_PERSONAL_TAX_PRODUCT_CODE: "txcd_10103000",
    STRIPE_SUPPORTER_BUSINESS_TAX_PRODUCT_CODE: "txcd_10103001",
    STRIPE_SUPPORTER_TAX_PROVIDER_READY: "true",
    STRIPE_SUPPORTER_TAX_REGISTRATIONS_READY: "true",
    STRIPE_SUPPORTER_TAX_CLASSIFICATION_CONFIRMED: "true",
    STRIPE_ONE_TIME_SUPPORT_AUTOMATIC_TAX_ENABLED: "true",
    STRIPE_ONE_TIME_SUPPORT_TAX_PRODUCT_CODE: "txcd_90000001",
    STRIPE_ONE_TIME_SUPPORT_TAX_PROVIDER_READY: "true",
    STRIPE_ONE_TIME_SUPPORT_TAX_REGISTRATIONS_READY: "true",
    STRIPE_ONE_TIME_SUPPORT_TAX_CLASSIFICATION_CONFIRMED: "true",
    ...membershipPrices,
    ...legacyMembershipPrices,
    ...overrides,
  }
  // Delete undefined overrides so spawned tests receive an unset environment key.
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) delete environment[key]
  }
  return environment
}

/**
 * Runs readiness in a hermetic child process so repository dotenv files cannot
 * satisfy or alter an individual deployment-contract test.
 */
function runReadiness(overrides = {}, args = []) {
  return spawnSync(process.execPath, [readinessScriptPath, "--no-dotenv", ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: readinessEnvironment(overrides),
  })
}

/** Runs the real readiness CLI with only the Stripe SDK replaced by a test client. */
function runReadinessWithStripeStub(overrides = {}, args = []) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      readinessHookUrl,
      readinessScriptPath,
      "--no-dotenv",
      ...args,
    ],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: readinessEnvironment(overrides),
    },
  )
}

describe("Stripe readiness background-commerce contract", () => {
  it("keeps the operator wiki on the exact current digital-purchase document version", async () => {
    const operatorWiki = await readFile(
      new URL("../docs/wiki/billing-memberships.md", import.meta.url),
      "utf8",
    )
    const documentedVersions = [
      ...operatorWiki.matchAll(
        /`BACKGROUND_COMMERCE_DIGITAL_PURCHASE_DOCUMENT_VERSION=([^`]+)`/g,
      ),
    ].map((match) => match[1])

    assert.deepEqual(documentedVersions, [DIGITAL_PURCHASES_REFUNDS_VERSION])
    assert.doesNotMatch(operatorWiki, /2026-07-digital-purchases-v2/)
  })

  it("uses the pinned API version by default while preserving explicit stub overrides", async () => {
    const defaultEndpoint = await new StripeReadinessStub("sk_test_default")
      .webhookEndpoints.list()
    const overrideEndpoint = await new StripeReadinessStub("sk_test_override", {
      apiVersion: "2026-06-24.dahlia",
    }).webhookEndpoints.list()

    assert.equal(defaultEndpoint.data[0].api_version, STRIPE_API_VERSION)
    assert.equal(overrideEndpoint.data[0].api_version, "2026-06-24.dahlia")
  })

  it("accepts boolean true or a trimmed case-insensitive true string and rejects other values", () => {
    assert.deepEqual(
      [true, " TRUE ", false, "1", "yes", undefined].map(isExplicitTrue),
      [true, true, false, false, false, false],
    )
  })

  it("requires the exact reviewed one-time support tax classification", () => {
    assert.equal(getOneTimeSupportTaxReadiness(readinessEnvironment()).ready, true)
    assert.equal(getOneTimeSupportTaxReadiness(readinessEnvironment({
      STRIPE_ONE_TIME_SUPPORT_TAX_PRODUCT_CODE: "txcd_10000000",
    })).ready, false)
  })

  it("ignores the retired Early Access environment flag", () => {
    const result = runReadiness({ MASSAGELAB_EARLY_ACCESS_DISCOUNT_ENABLED: "not-a-boolean" })

    assert.equal(result.status, 0, result.stderr || result.stdout)
    assert.doesNotMatch(`${result.stdout}${result.stderr}`, /EARLY_ACCESS|Early Access|early access/)
  })
  it("requires the approved Supporter amounts during Stripe Price verification", () => {
    const runtimeAmounts = SUPPORTER_AMOUNT_CHOICES.flatMap((choice) => [
      [choice.monthAmountCents, "month"],
      [choice.yearAmountCents, "year"],
      [choice.monthAmountCents, "month"],
      [choice.yearAmountCents, "year"],
    ])

    assert.deepEqual(
      REQUIRED_SUPPORTER_PRICE_CONTRACT.map(({ unitAmount, interval }) => [
        unitAmount,
        interval,
      ]),
      runtimeAmounts,
      "readiness and migration provisioning must use the public runtime catalog amounts",
    )
    assert.deepEqual(
      REQUIRED_SUPPORTER_PRICE_CONTRACT.map(({ key, unitAmount }) => [key, unitAmount]),
      Object.entries(membershipPrices).map(([key]) => [
        key,
        REQUIRED_SUPPORTER_PRICE_CONTRACT.find((entry) => entry.key === key).unitAmount,
      ]),
    )

    const expected = REQUIRED_SUPPORTER_PRICE_CONTRACT[2]
    assert.deepEqual(
      validateRetrievedMembershipPrice({
        active: true,
        billing_scheme: "per_unit",
        recurring: {
          interval: expected.interval,
          interval_count: 1,
          trial_period_days: null,
          usage_type: "licensed",
        },
        currency: "usd",
        unit_amount: 201,
        tax_behavior: "exclusive",
        transform_quantity: null,
        currency_options: null,
        product: supporterProduct(expected),
      }, expected),
      [`${expected.key} must have unit_amount ${expected.unitAmount}; received 201.`],
    )
  })
  it("requires exactly six amount-and-use Products across the twelve Prices", () => {
    const entries = REQUIRED_SUPPORTER_PRICE_CONTRACT.map((expected) => ({
      expected,
      price: {
        product: supporterProduct(expected),
      },
    }))

    assert.deepEqual(validateSupporterProductTopology(entries), [])

    const oneProduct = entries.map(({ expected, price }) => ({
      expected,
      price: {
        ...price,
        product: supporterProduct(REQUIRED_SUPPORTER_PRICE_CONTRACT[0]),
      },
    }))
    assert.deepEqual(
      validateSupporterProductTopology(oneProduct),
      [
        "The Supporter catalog must use 6 distinct amount-and-use Stripe Products; found 1 (prod_support_1_personal).",
      ],
    )

    const splitChoice = entries.map(({ expected, price: candidate }) => ({
      expected,
      // Replace only the yearly support-1 owner to model one amount choice
      // incorrectly spanning two Products while every other slot stays valid.
      price: expected.key === "STRIPE_SUPPORTER_1_PERSONAL_YEARLY_PRICE_ID"
        ? {
            ...candidate,
            product: supporterProduct(expected, { id: "prod_support_1_personal_alt" }),
          }
        : candidate,
    }))
    assert.deepEqual(
      validateSupporterProductTopology(splitChoice),
      [
        "Supporter Product key support-1-personal must use exactly one Stripe Product; found 2 (prod_support_1_personal, prod_support_1_personal_alt).",
        "The Supporter catalog must use 6 distinct amount-and-use Stripe Products; found 7 (prod_support_1_business, prod_support_1_personal, prod_support_1_personal_alt, prod_support_2_business, prod_support_2_personal, prod_support_5_business, prod_support_5_personal).",
      ],
    )
  })
  it("requires exclusive recurring tax Prices on the confirmed Supporter classification", () => {
    const expected = REQUIRED_SUPPORTER_PRICE_CONTRACT[0]
    const basePrice = {
      active: true,
      billing_scheme: "per_unit",
      recurring: {
        interval: expected.interval,
        interval_count: 1,
        trial_period_days: null,
        usage_type: "licensed",
      },
      currency: "usd",
      unit_amount: expected.unitAmount,
      tax_behavior: "exclusive",
      transform_quantity: null,
      currency_options: null,
      product: supporterProduct(expected),
    }

    assert.deepEqual(validateRetrievedMembershipPrice(basePrice, expected), [])

    assert.deepEqual(validateRetrievedMembershipPrice({
      ...basePrice,
      product: supporterProduct(expected, {
        metadata: {
          ...basePrice.product.metadata,
          atmoshaper_catalog: LEGACY_SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
        },
      }),
    }, expected), [
      `${expected.key} Product must identify Product key ${expected.productKey}.`,
    ])

    assert.deepEqual(validateRetrievedMembershipPrice({
      ...basePrice,
      product: supporterProduct(expected, {
        metadata: {
          app: "massagelab",
          massagelab_catalog: SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
          massagelab_membership_level: "SUPPORTER",
          massagelab_supporter_amount_choice: expected.productKey,
        },
      }),
    }, expected), [])

    assert.deepEqual(validateRetrievedMembershipPrice({
      ...basePrice,
      product: supporterProduct(expected, {
        metadata: {
          ...basePrice.product.metadata,
          massagelab_catalog: SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
          massagelab_membership_level: "SUPPORTER",
          massagelab_supporter_amount_choice: "support-5-business",
        },
      }),
    }, expected), [
      `${expected.key} Product must identify Product key ${expected.productKey}.`,
    ])

    const expectedWithoutProductKey = { ...expected }
    delete expectedWithoutProductKey.productKey
    const metadataWithoutAmountChoice = { ...basePrice.product.metadata }
    delete metadataWithoutAmountChoice.atmoshaper_supporter_amount_choice
    assert.deepEqual(
      validateRetrievedMembershipPrice({
        ...basePrice,
        product: {
          ...basePrice.product,
          metadata: metadataWithoutAmountChoice,
        },
      }, expectedWithoutProductKey),
      [
        `${expected.key} Price contract must identify a string Product key.`,
      ],
    )

    assert.deepEqual(
      validateRetrievedMembershipPrice({
        ...basePrice,
        tax_behavior: "inclusive",
        product: supporterProduct(expected, {
          tax_code: "txcd_10202003",
        }),
      }, expected),
      [
        `${expected.key} must use exclusive tax behavior.`,
        `${expected.key} Product must use tax code ${expected.taxCode}.`,
      ],
    )
  })
  it("fails closed with structured Price checks when Stripe retrieval is nullish", () => {
    const expected = REQUIRED_SUPPORTER_PRICE_CONTRACT[0]

    assert.deepEqual(
      validateRetrievedMembershipPrice(null, expected),
      [
        `${expected.key} points to an inactive Stripe Price.`,
        `${expected.key} must have unit_amount ${expected.unitAmount}; received missing.`,
        `${expected.key} must use usd currency; received missing.`,
        `${expected.key} billing_scheme must be per_unit.`,
        `${expected.key} must be a ${expected.interval} recurring Price.`,
        `${expected.key} recurring interval_count must be exactly 1.`,
        `${expected.key} recurring usage_type must be licensed.`,
        `${expected.key} must use exclusive tax behavior.`,
        `${expected.key} must be retrieved with currency_options expanded.`,
        `${expected.key} Product must be expanded for validation.`,
      ],
    )
  })
  it("requires the same strict recurring Price semantics as the migration", () => {
    const expected = REQUIRED_SUPPORTER_PRICE_CONTRACT[0]
    const basePrice = {
      active: true,
      billing_scheme: "per_unit",
      recurring: {
        interval: expected.interval,
        interval_count: 1,
        trial_period_days: null,
        usage_type: "licensed",
      },
      currency: "usd",
      unit_amount: expected.unitAmount,
      tax_behavior: "exclusive",
      transform_quantity: null,
      currency_options: null,
      product: supporterProduct(expected),
    }
    assert.deepEqual(
      validateRetrievedMembershipPrice({
        ...basePrice,
        currency_options: {
          usd: {
            unit_amount: expected.unitAmount,
            tax_behavior: "exclusive",
          },
        },
      }, expected),
      [],
      "Stripe may expand currency_options with only the base currency",
    )
    const cases = [
      [
        (candidate) => { candidate.active = false },
        `${expected.key} points to an inactive Stripe Price.`,
      ],
      [
        (candidate) => { candidate.product.active = false },
        `${expected.key} belongs to an inactive Stripe Product.`,
      ],
      [
        (candidate) => { candidate.product.name = "MassageLab Supporter" },
        `${expected.key} Product name must be ${expected.productName}.`,
      ],
      [
        (candidate) => { candidate.currency = "cad" },
        `${expected.key} must use usd currency; received cad.`,
      ],
      [
        (candidate) => { candidate.recurring.interval = "year" },
        `${expected.key} must be a month recurring Price.`,
      ],
      [
        (candidate) => { candidate.recurring.interval_count = 2 },
        `${expected.key} recurring interval_count must be exactly 1.`,
      ],
      [
        (candidate) => { candidate.recurring.trial_period_days = 14 },
        `${expected.key} must not define a recurring trial period.`,
      ],
      [
        (candidate) => { candidate.recurring.usage_type = "metered" },
        `${expected.key} recurring usage_type must be licensed.`,
      ],
      [
        (candidate) => { candidate.billing_scheme = "tiered" },
        `${expected.key} billing_scheme must be per_unit.`,
      ],
      [
        (candidate) => {
          candidate.transform_quantity = { divide_by: 10, round: "up" }
        },
        `${expected.key} must not transform quantity.`,
      ],
      [
        (candidate) => {
          candidate.currency_options = {
            usd: {
              unit_amount: expected.unitAmount + 1,
              tax_behavior: "exclusive",
            },
          }
        },
        `${expected.key} must not define additional currency options.`,
      ],
      [
        (candidate) => {
          candidate.currency_options = {
            usd: {
              unit_amount: expected.unitAmount,
              tax_behavior: "inclusive",
            },
          }
        },
        `${expected.key} must not define additional currency options.`,
      ],
      [
        (candidate) => {
          candidate.currency_options = {
            usd: {
              unit_amount: expected.unitAmount,
              tax_behavior: "exclusive",
            },
            eur: {
              unit_amount: expected.unitAmount,
              tax_behavior: "exclusive",
            },
          }
        },
        `${expected.key} must not define additional currency options.`,
      ],
      [
        (candidate) => {
          candidate.currency_options = { usd: null }
        },
        `${expected.key} must not define additional currency options.`,
      ],
      [
        (candidate) => {
          candidate.currency_options = "usd"
        },
        `${expected.key} must not define additional currency options.`,
      ],
    ]

    for (const [mutate, expectedFailure] of cases) {
      const candidate = structuredClone(basePrice)
      mutate(candidate)
      assert.deepEqual(
        validateRetrievedMembershipPrice(candidate, expected),
        [expectedFailure],
      )
    }

    const withoutExpandedCurrencyOptions = structuredClone(basePrice)
    delete withoutExpandedCurrencyOptions.currency_options
    assert.deepEqual(
      validateRetrievedMembershipPrice(withoutExpandedCurrencyOptions, expected),
      [`${expected.key} must be retrieved with currency_options expanded.`],
      "missing currency_options cannot prove the expanded Price has no alternatives",
    )
  })

  it("checks tax behavior only when it belongs to the caller's Price contract", () => {
    const legacyPrice = {
      billing_scheme: "per_unit",
      recurring: {
        interval: "month",
        interval_count: 1,
        trial_period_days: null,
        usage_type: "licensed",
      },
      currency: "usd",
      unit_amount: 900,
      tax_behavior: "unspecified",
      transform_quantity: null,
      currency_options: null,
    }

    assert.deepEqual(
      recurringPriceSemanticMismatches(legacyPrice, {
        interval: "month",
        unitAmount: 900,
      }),
      [],
      "legacy retirement identity deliberately does not classify historical tax behavior",
    )
    assert.deepEqual(
      recurringPriceSemanticMismatches(legacyPrice, {
        interval: "month",
        unitAmount: 900,
        taxBehavior: "exclusive",
      }),
      ["tax_behavior"],
      "the current Supporter catalog must require its explicit tax behavior",
    )
  })
  it("requires twelve unique Supporter amount-and-use Prices and ignores legacy catalog variables", () => {
    const missing = runReadiness({ STRIPE_SUPPORTER_2_BUSINESS_YEARLY_PRICE_ID: "" })
    assert.equal(missing.status, 1)
    assert.match(missing.stderr, /STRIPE_SUPPORTER_2_BUSINESS_YEARLY_PRICE_ID is missing/)

    const duplicate = runReadiness({ STRIPE_SUPPORTER_5_BUSINESS_YEARLY_PRICE_ID: membershipPrices.STRIPE_SUPPORTER_5_BUSINESS_MONTHLY_PRICE_ID })
    assert.equal(duplicate.status, 1)
    assert.match(duplicate.stderr, /STRIPE_SUPPORTER_5_BUSINESS_YEARLY_PRICE_ID duplicates STRIPE_SUPPORTER_5_BUSINESS_MONTHLY_PRICE_ID/)

    const legacyOnly = runReadiness({
      ...Object.fromEntries(Object.keys(membershipPrices).map((key) => [key, ""])),
      STRIPE_SUPPORTER_MONTHLY_PRICE_ID: "price_supporter_legacy_monthly",
      STRIPE_SUPPORTER_YEARLY_PRICE_ID: "price_supporter_legacy_yearly",
      STRIPE_THERAPIST_MONTHLY_PRICE_ID: "price_therapist_monthly",
      STRIPE_THERAPIST_YEARLY_PRICE_ID: "price_therapist_yearly",
      STRIPE_PRACTICE_MONTHLY_PRICE_ID: "price_practice_monthly",
      STRIPE_PRACTICE_YEARLY_PRICE_ID: "price_practice_yearly",
    })
    assert.equal(legacyOnly.status, 1)
    assert.match(legacyOnly.stderr, /STRIPE_SUPPORTER_1_PERSONAL_MONTHLY_PRICE_ID is missing/)
  })
  it("reports the complete fail-closed commerce configuration without changing membership readiness output", () => {
    const result = runReadiness()

    assert.equal(result.status, 0, result.stderr || result.stdout)
    assert.match(result.stdout, /PASS Stripe membership environment is ready for the selected mode\./)
    assert.match(result.stdout, /Supporter recurring automatic tax enabled: true/)
    assert.match(result.stdout, /Supporter recurring tax classification confirmed: true/)
    assert.match(result.stdout, /One-time support tax readiness: ready/)
    assert.match(result.stdout, /One-time support tax product code configured: true/)
    assert.match(result.stdout, /Background commerce readiness: ready/)
    assert.match(result.stdout, /Background commerce fixed USD price configured: true/)
    assert.match(result.stdout, /Background commerce webhook event coverage complete: true/)
    assert.doesNotMatch(result.stdout, /sk_test_readiness|whsec_readiness/)
  })

  it("fails when any required commerce webhook event is absent", () => {
    const result = runReadiness({
      BACKGROUND_COMMERCE_WEBHOOK_EVENTS: "checkout.session.completed,refund.created",
    })

    assert.equal(result.status, 1)
    assert.match(result.stderr, /FAIL Background commerce webhook event coverage is incomplete\./)
    assert.doesNotMatch(`${result.stdout}${result.stderr}`, /sk_test_readiness|whsec_readiness/)
  })

  it("fails when the configured commerce webhook contract includes unrecognized extras", () => {
    const result = runReadiness({
      BACKGROUND_COMMERCE_WEBHOOK_EVENTS: "checkout.session.completed,checkout.session.expired,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,refund.created,refund.updated,refund.failed,charge.dispute.created,charge.dispute.updated,charge.dispute.closed,customer.created",
    })

    assert.equal(result.status, 1)
    assert.match(result.stderr, /FAIL Background commerce webhook event coverage is incomplete\./)
  })

  it("fails closed on stale price, currency, country, document, webhook, reconciliation, and tax settings", () => {
    const cases = [
      ["price", { BACKGROUND_COMMERCE_PRICE_CENTS: "200" }],
      ["currency", { BACKGROUND_COMMERCE_CURRENCY: "cad" }],
      ["country", { BACKGROUND_COMMERCE_PURCHASE_COUNTRIES: "CA" }],
      ["document", { BACKGROUND_COMMERCE_DIGITAL_PURCHASE_DOCUMENT_VERSION: "stale" }],
      ["webhook", { BACKGROUND_COMMERCE_WEBHOOK_READY: "false" }],
      ["reconciliation", { BACKGROUND_COMMERCE_RECONCILIATION_READY: "false" }],
      ["tax", { BACKGROUND_COMMERCE_TAX_MODE: "unknown" }],
      ["tax code", { BACKGROUND_COMMERCE_TAX_PRODUCT_CODE: "" }],
      ["wrong tax code", { BACKGROUND_COMMERCE_TAX_PRODUCT_CODE: "txcd_10202003" }],
      ["tax provider", { BACKGROUND_COMMERCE_TAX_PROVIDER_READY: "false" }],
      ["tax registrations", { BACKGROUND_COMMERCE_TAX_REGISTRATIONS_READY: "false" }],
    ]

    for (const [name, overrides] of cases) {
      const result = runReadiness(overrides)
      assert.equal(result.status, 1, `${name}: ${result.stdout}${result.stderr}`)
      assert.match(result.stderr, /FAIL Background commerce/, name)
    }
  })

  it("fails closed on every Supporter recurring-tax deployment gate", () => {
    const cases = [
      ["enablement", { STRIPE_SUPPORTER_AUTOMATIC_TAX_ENABLED: "false" }],
      ["personal tax code", { STRIPE_SUPPORTER_PERSONAL_TAX_PRODUCT_CODE: "" }],
      ["wrong personal tax code", { STRIPE_SUPPORTER_PERSONAL_TAX_PRODUCT_CODE: "txcd_10202003" }],
      ["business tax code", { STRIPE_SUPPORTER_BUSINESS_TAX_PRODUCT_CODE: "" }],
      ["wrong business tax code", { STRIPE_SUPPORTER_BUSINESS_TAX_PRODUCT_CODE: "txcd_10202003" }],
      ["provider", { STRIPE_SUPPORTER_TAX_PROVIDER_READY: "false" }],
      ["registrations", { STRIPE_SUPPORTER_TAX_REGISTRATIONS_READY: "false" }],
      ["classification", { STRIPE_SUPPORTER_TAX_CLASSIFICATION_CONFIRMED: "false" }],
    ]

    for (const [name, overrides] of cases) {
      const result = runReadiness(overrides)
      assert.equal(result.status, 1, `${name}: ${result.stdout}${result.stderr}`)
      assert.match(result.stderr, /FAIL Supporter recurring tax/, name)
      assert.doesNotMatch(`${result.stdout}${result.stderr}`, /sk_test_readiness|whsec_readiness/)
    }
  })

  it("fails closed on every one-time support tax deployment gate", () => {
    const cases = [
      ["missing enablement", { STRIPE_ONE_TIME_SUPPORT_AUTOMATIC_TAX_ENABLED: undefined }],
      ["enablement", { STRIPE_ONE_TIME_SUPPORT_AUTOMATIC_TAX_ENABLED: "false" }],
      ["missing tax code", { STRIPE_ONE_TIME_SUPPORT_TAX_PRODUCT_CODE: undefined }],
      ["tax code", { STRIPE_ONE_TIME_SUPPORT_TAX_PRODUCT_CODE: "" }],
      ["wrong tax code", { STRIPE_ONE_TIME_SUPPORT_TAX_PRODUCT_CODE: "txcd_10000000" }],
      ["missing provider", { STRIPE_ONE_TIME_SUPPORT_TAX_PROVIDER_READY: undefined }],
      ["provider", { STRIPE_ONE_TIME_SUPPORT_TAX_PROVIDER_READY: "false" }],
      ["missing registrations", { STRIPE_ONE_TIME_SUPPORT_TAX_REGISTRATIONS_READY: undefined }],
      ["registrations", { STRIPE_ONE_TIME_SUPPORT_TAX_REGISTRATIONS_READY: "false" }],
      ["missing classification", { STRIPE_ONE_TIME_SUPPORT_TAX_CLASSIFICATION_CONFIRMED: undefined }],
      ["classification", { STRIPE_ONE_TIME_SUPPORT_TAX_CLASSIFICATION_CONFIRMED: "false" }],
    ]

    for (const [name, overrides] of cases) {
      const result = runReadiness(overrides)
      assert.equal(result.status, 1, `${name}: ${result.stdout}${result.stderr}`)
      assert.match(result.stderr, /FAIL One-time support tax/, name)
      assert.doesNotMatch(`${result.stdout}${result.stderr}`, /sk_test_readiness|whsec_readiness/)
    }
  })

  it("loads every Supporter recurring-tax gate from an explicit env file", async () => {
    const directory = await mkdtemp(join(tmpdir(), "massagelab-readiness-"))
    const envFile = join(directory, "supporter-tax.env")
    const supporterTaxKeys = [
      "STRIPE_SUPPORTER_AUTOMATIC_TAX_ENABLED",
      "STRIPE_SUPPORTER_PERSONAL_TAX_PRODUCT_CODE",
      "STRIPE_SUPPORTER_BUSINESS_TAX_PRODUCT_CODE",
      "STRIPE_SUPPORTER_TAX_PROVIDER_READY",
      "STRIPE_SUPPORTER_TAX_REGISTRATIONS_READY",
      "STRIPE_SUPPORTER_TAX_CLASSIFICATION_CONFIRMED",
      "STRIPE_ONE_TIME_SUPPORT_AUTOMATIC_TAX_ENABLED",
      "STRIPE_ONE_TIME_SUPPORT_TAX_PRODUCT_CODE",
      "STRIPE_ONE_TIME_SUPPORT_TAX_PROVIDER_READY",
      "STRIPE_ONE_TIME_SUPPORT_TAX_REGISTRATIONS_READY",
      "STRIPE_ONE_TIME_SUPPORT_TAX_CLASSIFICATION_CONFIRMED",
    ]
    const environment = readinessEnvironment()
    for (const key of supporterTaxKeys) {
      delete environment[key]
    }
    assert.equal(
      Object.hasOwn(environment, "STRIPE_SUPPORTER_PERSONAL_TAX_PRODUCT_CODE"),
      false,
      "the valid tax code must exist only in the temporary env file",
    )

    try {
      await writeFile(envFile, [
        "STRIPE_SUPPORTER_AUTOMATIC_TAX_ENABLED=true",
        "STRIPE_SUPPORTER_PERSONAL_TAX_PRODUCT_CODE=\" txcd_10103000 \"",
        "STRIPE_SUPPORTER_BUSINESS_TAX_PRODUCT_CODE=\" txcd_10103001 \"",
        "STRIPE_SUPPORTER_TAX_PROVIDER_READY=true",
        "STRIPE_SUPPORTER_TAX_REGISTRATIONS_READY=true",
        "STRIPE_SUPPORTER_TAX_CLASSIFICATION_CONFIRMED=true",
        "STRIPE_ONE_TIME_SUPPORT_AUTOMATIC_TAX_ENABLED=true",
        "STRIPE_ONE_TIME_SUPPORT_TAX_PRODUCT_CODE=\" txcd_90000001 \"",
        "STRIPE_ONE_TIME_SUPPORT_TAX_PROVIDER_READY=true",
        "STRIPE_ONE_TIME_SUPPORT_TAX_REGISTRATIONS_READY=true",
        "STRIPE_ONE_TIME_SUPPORT_TAX_CLASSIFICATION_CONFIRMED=true",
      ].join("\n"))

      const dotenvDisabled = spawnSync(
        process.execPath,
        [
          readinessScriptPath,
          "--no-dotenv",
          `--env-file=${envFile}`,
        ],
        {
          cwd: directory,
          encoding: "utf8",
          env: environment,
        },
      )
      assert.equal(dotenvDisabled.error, undefined, dotenvDisabled.error?.message)
      assert.equal(dotenvDisabled.status, 1)
      assert.match(
        dotenvDisabled.stderr,
        /FAIL Supporter recurring tax automatic-tax enablement is not configured\./,
      )

      const result = spawnSync(
        process.execPath,
        [
          readinessScriptPath,
          `--env-file=${envFile}`,
        ],
        {
          cwd: directory,
          encoding: "utf8",
          env: environment,
        },
      )

      assert.equal(result.error, undefined, result.error?.message)
      assert.equal(result.status, 0, result.stderr || result.stdout)
      assert.match(result.stdout, /Supporter recurring automatic tax enabled: true/)
      assert.match(result.stdout, /Supporter recurring tax classification confirmed: true/)
      assert.match(result.stdout, /One-time support automatic tax enabled: true/)
      assert.match(result.stdout, /One-time support tax classification confirmed: true/)
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("rejects live international commerce while background purchases remain U.S.-only", () => {
    const result = runReadiness({
      STRIPE_SECRET_KEY: "sk_live_readiness",
      BACKGROUND_COMMERCE_PURCHASE_COUNTRIES: "US,CA",
    }, ["--live"])

    assert.equal(result.status, 1)
    assert.match(result.stderr, /FAIL Background commerce purchase-country allowlist is not configured\./)
  })

  it("requires Stripe retrieval before live readiness can pass", () => {
    const result = runReadiness({
      STRIPE_SECRET_KEY: "sk_live_readiness",
    }, ["--live"])

    assert.equal(result.status, 1)
    assert.match(result.stderr, /FAIL Live Stripe readiness requires --verify-stripe\./)
    assert.match(result.stdout, /Stripe API retrieval requested: false/)
    assert.match(result.stdout, /Stripe API retrieval performed: false/)
    assert.doesNotMatch(result.stdout, /PASS Stripe membership environment is ready/)
  })

  it("reports requested Stripe verification as not performed when its prerequisites fail", () => {
    const result = runReadiness({
      STRIPE_SECRET_KEY: "",
    }, ["--live", "--verify-stripe"])

    assert.equal(result.status, 1)
    assert.match(result.stdout, /Stripe API retrieval requested: true/)
    assert.match(result.stdout, /Stripe API retrieval performed: false/)
  })

  it("does not use unrelated readiness failures to suppress Stripe verification", () => {
    const result = runReadinessWithStripeStub({
      BACKGROUND_COMMERCE_RECONCILIATION_READY: "false",
    }, ["--verify-stripe"])

    assert.equal(result.status, 1, result.stderr || result.stdout)
    assert.match(result.stderr, /FAIL Background commerce reconciliation readiness is not configured\./)
    assert.match(result.stdout, /Stripe API retrieval performed: true/)
    assert.match(result.stdout, /Pinned Stripe webhook endpoint enabled: true/)
    assert.match(result.stdout, /Pinned Stripe webhook API version current: true/)
    assert.match(result.stdout, /Supporter personal Portal configuration verified: true/)
    assert.match(result.stdout, /Supporter business Portal configuration verified: true/)
  })

  it("rejects Price collisions across current and reconciliation mappings", () => {
    const currentPrice = membershipPrices.STRIPE_SUPPORTER_1_PERSONAL_MONTHLY_PRICE_ID
    for (const reconciliationKey of [
      "STRIPE_SUPPORTER_1_MONTHLY_PRICE_ID",
      "STRIPE_THERAPIST_MONTHLY_PRICE_ID",
    ]) {
      const result = runReadiness({ [reconciliationKey]: currentPrice })
      assert.equal(result.status, 1, reconciliationKey)
      assert.match(
        result.stderr,
        /Stripe membership Price mappings must be unique across current and reconciliation namespaces/,
        reconciliationKey,
      )
    }
  })

  it("requires distinct use-specific Portal configuration IDs", () => {
    const missing = runReadiness({
      STRIPE_SUPPORTER_PERSONAL_PORTAL_CONFIGURATION_ID: "",
    })
    assert.equal(missing.status, 1)
    assert.match(
      missing.stderr,
      /STRIPE_SUPPORTER_PERSONAL_PORTAL_CONFIGURATION_ID is missing/,
    )

    const duplicate = runReadiness({
      STRIPE_SUPPORTER_BUSINESS_PORTAL_CONFIGURATION_ID: "bpc_personal",
    })
    assert.equal(duplicate.status, 1)
    assert.match(
      duplicate.stderr,
      /STRIPE_SUPPORTER_BUSINESS_PORTAL_CONFIGURATION_ID duplicates STRIPE_SUPPORTER_PERSONAL_PORTAL_CONFIGURATION_ID/,
    )
  })

  it("fails Stripe verification for stale or cross-use Portal configurations", () => {
    const stale = runReadinessWithStripeStub({
      STRIPE_SUPPORTER_PERSONAL_PORTAL_CONFIGURATION_ID: "bpc_stale",
    }, ["--verify-stripe"])
    assert.equal(stale.status, 1, stale.stderr || stale.stdout)
    assert.match(
      stale.stderr,
      /STRIPE_SUPPORTER_PERSONAL_PORTAL_CONFIGURATION_ID could not be retrieved from Stripe/,
    )
    assert.match(
      stale.stdout,
      /Supporter personal Portal configuration verified: false/,
    )

    const swapped = runReadinessWithStripeStub({
      STRIPE_READINESS_STUB_SWAP_PORTALS: "true",
    }, ["--verify-stripe"])
    assert.equal(swapped.status, 1, swapped.stderr || swapped.stdout)
    assert.match(
      swapped.stderr,
      /STRIPE_SUPPORTER_PERSONAL_PORTAL_CONFIGURATION_ID metadata must identify the personal Supporter Portal/,
    )
    assert.match(
      swapped.stderr,
      /STRIPE_SUPPORTER_PERSONAL_PORTAL_CONFIGURATION_ID Product and Price allowlist does not match the personal Supporter catalog/,
    )
  })

  it("fails Stripe verification for Portal allowlist drift", () => {
    const result = runReadinessWithStripeStub({
      STRIPE_READINESS_STUB_INVALID_PORTAL_ALLOWLIST: "personal",
    }, ["--verify-stripe"])

    assert.equal(result.status, 1, result.stderr || result.stdout)
    assert.match(
      result.stderr,
      /STRIPE_SUPPORTER_PERSONAL_PORTAL_CONFIGURATION_ID Product and Price allowlist does not match the personal Supporter catalog/,
    )
    assert.match(
      result.stdout,
      /Supporter personal Portal configuration verified: false/,
    )
  })

  it("fails Stripe verification for inherited Portal profile drift", () => {
    const result = runReadinessWithStripeStub({
      STRIPE_READINESS_STUB_INVALID_PORTAL_PROFILE: "personal",
    }, ["--verify-stripe"])

    assert.equal(result.status, 1, result.stderr || result.stdout)
    assert.match(
      result.stderr,
      /STRIPE_SUPPORTER_PERSONAL_PORTAL_CONFIGURATION_ID must inherit the retained default Portal profile and return URL/,
    )
    assert.match(
      result.stdout,
      /Supporter personal Portal configuration verified: false/,
    )
  })

  it("fails Stripe verification for every retained default Portal contract drift", () => {
    const cases = [
      ["management", /must preserve the reviewed customer, invoice, payment-method, and cancellation-management behavior/],
      ["transition", /must preserve the reviewed Price-only, unchanged-cycle, non-prorated subscription-update behavior/],
      ["allowlist", /Product and Price allowlist must match the complete v1 Supporter catalog/],
    ]
    for (const [drift, failure] of cases) {
      const result = runReadinessWithStripeStub({
        STRIPE_READINESS_STUB_INVALID_DEFAULT_PORTAL: drift,
      }, ["--verify-stripe"])
      assert.equal(result.status, 1, drift)
      assert.match(result.stderr, failure, drift)
    }
  })

  it("requires exact operator evidence when Stripe omits the default catalog", () => {
    const omitted = runReadinessWithStripeStub({
      STRIPE_READINESS_STUB_OMIT_DEFAULT_PORTAL_PRODUCTS: "true",
    }, ["--verify-stripe"])
    assert.equal(omitted.status, 1, omitted.stderr || omitted.stdout)
    assert.match(
      omitted.stderr,
      /Stripe omitted the retained default Portal catalog/,
    )
    assert.match(
      omitted.stdout,
      /Retained default Portal catalog evidence: missing/,
    )

    const confirmed = runReadinessWithStripeStub({
      ATMOSHAPER_STRIPE_DEFAULT_PORTAL_CATALOG_CONFIRMATION:
        DEFAULT_SUPPORTER_PORTAL_CATALOG_CONFIRMATION,
      STRIPE_READINESS_STUB_OMIT_DEFAULT_PORTAL_PRODUCTS: "true",
    }, ["--verify-stripe"])
    assert.equal(confirmed.status, 0, confirmed.stderr || confirmed.stdout)
    assert.match(
      confirmed.stdout,
      /Retained default Portal catalog evidence: operator_confirmation/,
    )
  })

  it("requires exact operator evidence when Stripe omits both managed catalogs", () => {
    const omitted = runReadinessWithStripeStub({
      STRIPE_READINESS_STUB_OMIT_MANAGED_PORTAL_PRODUCTS: "true",
    }, ["--verify-stripe"])
    assert.equal(omitted.status, 1, omitted.stderr || omitted.stdout)
    assert.match(omitted.stderr, /Stripe omitted the managed Portal catalogs/)
    assert.match(omitted.stdout, /Supporter personal Portal catalog evidence: missing/)
    assert.match(omitted.stdout, /Supporter business Portal catalog evidence: missing/)

    const confirmed = runReadinessWithStripeStub({
      ATMOSHAPER_STRIPE_MANAGED_PORTAL_CATALOG_CONFIRMATION:
        MANAGED_SUPPORTER_PORTAL_CATALOG_CONFIRMATION,
      STRIPE_READINESS_STUB_OMIT_MANAGED_PORTAL_PRODUCTS: "true",
    }, ["--verify-stripe"])
    assert.equal(confirmed.status, 0, confirmed.stderr || confirmed.stdout)
    assert.match(
      confirmed.stdout,
      /Supporter personal Portal catalog evidence: operator_confirmation/,
    )
    assert.match(
      confirmed.stdout,
      /Supporter business Portal catalog evidence: operator_confirmation/,
    )
  })

  it("does not accept managed catalog evidence loaded from a dotenv file", async () => {
    const root = await mkdtemp(join(tmpdir(), "atmoshaper-managed-portal-readiness-"))
    const envFile = join(root, "confirmation.env")
    try {
      await writeFile(
        envFile,
        `ATMOSHAPER_STRIPE_MANAGED_PORTAL_CATALOG_CONFIRMATION=${MANAGED_SUPPORTER_PORTAL_CATALOG_CONFIRMATION}\n`,
        "utf8",
      )
      const result = spawnSync(
        process.execPath,
        [
          "--import",
          readinessHookUrl,
          readinessScriptPath,
          `--env-file=${envFile}`,
          "--verify-stripe",
        ],
        {
          cwd: process.cwd(),
          encoding: "utf8",
          env: readinessEnvironment({
            STRIPE_READINESS_STUB_OMIT_MANAGED_PORTAL_PRODUCTS: "true",
          }),
        },
      )

      assert.equal(result.status, 1, result.stderr || result.stdout)
      assert.match(result.stderr, /Stripe omitted the managed Portal catalogs/)
      assert.match(result.stdout, /Supporter personal Portal catalog evidence: missing/)
      assert.match(result.stdout, /Supporter business Portal catalog evidence: missing/)
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  it("does not accept default catalog evidence loaded from a dotenv file", async () => {
    const root = await mkdtemp(join(tmpdir(), "atmoshaper-stripe-readiness-"))
    const envFile = join(root, "confirmation.env")
    try {
      await writeFile(
        envFile,
        `ATMOSHAPER_STRIPE_DEFAULT_PORTAL_CATALOG_CONFIRMATION=${DEFAULT_SUPPORTER_PORTAL_CATALOG_CONFIRMATION}\n`,
        "utf8",
      )
      const result = spawnSync(
        process.execPath,
        [
          "--import",
          readinessHookUrl,
          readinessScriptPath,
          `--env-file=${envFile}`,
          "--verify-stripe",
        ],
        {
          cwd: process.cwd(),
          encoding: "utf8",
          env: readinessEnvironment({
            STRIPE_READINESS_STUB_OMIT_DEFAULT_PORTAL_PRODUCTS: "true",
          }),
        },
      )

      assert.equal(result.status, 1, result.stderr || result.stdout)
      assert.match(result.stderr, /Stripe omitted the retained default Portal catalog/)
      assert.match(result.stdout, /Retained default Portal catalog evidence: missing/)
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  it("requires six unique retained Prices on three unsplit Products before attestation", () => {
    const cases = [
      ["duplicate expected Price key", (entries) => {
        entries[1].expected = entries[0].expected
      }],
      ["duplicate Price ID", (entries) => {
        entries[1].price.id = entries[0].price.id
      }],
      ["split Product identity", (entries) => {
        entries[1].price.product.id = "prod_v1_split"
      }],
    ]

    for (const [label, mutate] of cases) {
      const entries = structuredClone(retrievedLegacyMembershipPrices())
      mutate(entries)
      const configuration = defaultPortalConfiguration()
      delete configuration.features.subscription_update.products
      const failures = validateRetrievedDefaultSupporterPortalConfiguration(
        configuration,
        {
          defaultPortalCatalogConfirmation:
            DEFAULT_SUPPORTER_PORTAL_CATALOG_CONFIRMATION,
          retrievedLegacyMembershipPrices: entries,
          livemode: false,
        },
      )
      assert.deepEqual(
        failures,
        ["The complete retained v1 Price inventory is required before validating the default Stripe Portal catalog."],
        label,
      )
    }
  })

  it("does not let operator evidence override visible default catalog drift", () => {
    const result = runReadinessWithStripeStub({
      ATMOSHAPER_STRIPE_DEFAULT_PORTAL_CATALOG_CONFIRMATION:
        DEFAULT_SUPPORTER_PORTAL_CATALOG_CONFIRMATION,
      STRIPE_READINESS_STUB_INVALID_DEFAULT_PORTAL: "allowlist",
    }, ["--verify-stripe"])

    assert.equal(result.status, 1, result.stderr || result.stdout)
    assert.match(
      result.stderr,
      /Product and Price allowlist must match the complete v1 Supporter catalog/,
    )
  })

  it("fails Stripe verification for every retained v1 Price and Product semantic drift", () => {
    const cases = [
      ["inactive", /must identify an active retained v1 Stripe Price/],
      ["amount", /does not match the retained v1 recurring Price contract/],
      ["interval", /does not match the retained v1 recurring Price contract/],
      ["product-inactive", /must expand an active retained v1 Stripe Product/],
      ["product", /Product does not match the retained v1 semantic contract/],
      ["product-metadata", /Product metadata does not identify the retained v1 Product/],
      ["price-metadata", /metadata does not identify the retained v1 Price/],
    ]
    for (const [drift, failure] of cases) {
      const result = runReadinessWithStripeStub({
        STRIPE_READINESS_STUB_INVALID_LEGACY_PRICE: drift,
      }, ["--verify-stripe"])
      assert.equal(result.status, 1, drift)
      assert.match(result.stderr, failure, drift)
    }
  })

  it("rejects default Portals and every managed subscription-update behavior drift", () => {
    const retrievedMembershipPrices = retrievedMembershipPricesForUse("personal")
    const cases = [
      ["default Portal", (configuration) => { configuration.is_default = true }],
      ["allowed updates", (configuration) => {
        configuration.features.subscription_update.default_allowed_updates = ["price", "quantity"]
      }],
      ["billing anchor", (configuration) => {
        configuration.features.subscription_update.billing_cycle_anchor = "now"
      }],
      ["proration", (configuration) => {
        configuration.features.subscription_update.proration_behavior = "create_prorations"
      }],
      ["scheduled update", (configuration) => {
        configuration.features.subscription_update.schedule_at_period_end.conditions = [
          { type: "decreasing_item_amount" },
        ]
      }],
      ["trial behavior", (configuration) => {
        configuration.features.subscription_update.trial_update_behavior = "continue_trial"
      }],
    ]

    for (const [label, mutate] of cases) {
      const configuration = supporterPortalConfiguration()
      mutate(configuration)
      const failures = validateRetrievedSupporterPortalConfiguration(configuration, {
        configurationId: "bpc_personal",
        supporterUse: "personal",
        retrievedMembershipPrices,
        livemode: false,
        defaultConfiguration: defaultPortalConfiguration(),
      })
      assert.equal(failures.length > 0, true, label)
    }
  })

  it("rejects every managed Portal billing-management feature drift", () => {
    const retrievedMembershipPrices = retrievedMembershipPricesForUse("personal")
    const cases = [
      ["customer update", (configuration) => {
        configuration.features.customer_update.enabled = false
      }],
      ["customer fields", (configuration) => {
        configuration.features.customer_update.allowed_updates = ["email"]
      }],
      ["invoice history", (configuration) => {
        configuration.features.invoice_history.enabled = false
      }],
      ["payment methods", (configuration) => {
        configuration.features.payment_method_update.enabled = false
      }],
      ["cancellation", (configuration) => {
        configuration.features.subscription_cancel.enabled = false
      }],
      ["cancellation timing", (configuration) => {
        configuration.features.subscription_cancel.mode = "immediately"
      }],
      ["cancellation proration", (configuration) => {
        configuration.features.subscription_cancel.proration_behavior = "create_prorations"
      }],
      ["cancellation reasons", (configuration) => {
        configuration.features.subscription_cancel.cancellation_reason.enabled = false
      }],
      ["cancellation reason options", (configuration) => {
        configuration.features.subscription_cancel.cancellation_reason.options = ["other"]
      }],
    ]

    for (const [label, mutate] of cases) {
      const configuration = supporterPortalConfiguration()
      mutate(configuration)
      const failures = validateRetrievedSupporterPortalConfiguration(configuration, {
        configurationId: "bpc_personal",
        supporterUse: "personal",
        retrievedMembershipPrices,
        livemode: false,
        defaultConfiguration: defaultPortalConfiguration(),
      })
      assert.equal(failures.length > 0, true, label)
    }
  })

  it("rejects the retired six-Prices-on-one-Product topology", () => {
    const result = runReadinessWithStripeStub({
      STRIPE_READINESS_STUB_SINGLE_SUPPORTER_PRODUCT: "true",
    }, ["--verify-stripe"])

    assert.equal(result.status, 1, result.stderr || result.stdout)
    assert.match(
      result.stderr,
      /FAIL The Supporter catalog must use 6 distinct amount-and-use Stripe Products; found 1 \(prod_support_1\)\./,
    )
    assert.match(result.stdout, /Stripe API retrieval performed: true/)
  })

  it("reports partial Stripe Price verification as incomplete", () => {
    const result = runReadinessWithStripeStub({
      STRIPE_READINESS_STUB_FAIL_PRICE_ID:
        membershipPrices.STRIPE_SUPPORTER_2_PERSONAL_MONTHLY_PRICE_ID,
    }, ["--verify-stripe"])

    assert.equal(result.status, 1, result.stderr || result.stdout)
    assert.match(result.stdout, /Stripe API retrieval performed: false/)
    assert.match(
      result.stderr,
      /STRIPE_SUPPORTER_2_PERSONAL_MONTHLY_PRICE_ID could not be retrieved from Stripe/,
    )
    assert.doesNotMatch(
      result.stderr,
      /Simulated Stripe Price retrieval failure/,
    )
    assert.match(
      result.stderr,
      /Stripe Price retrieval did not complete for every required Supporter contract slot/,
    )
  })

  it("does not infer default Portal drift from an incomplete retained v1 Price retrieval", () => {
    const [failedLegacyPrice] = LEGACY_TARGET_PRICE_SPECS
    const result = runReadinessWithStripeStub({
      STRIPE_READINESS_STUB_FAIL_PRICE_ID:
        legacyMembershipPrices[failedLegacyPrice.envKey],
    }, ["--verify-stripe"])

    assert.equal(result.status, 1, result.stderr || result.stdout)
    assert.match(result.stdout, /Stripe API retrieval performed: false/)
    assert.match(
      result.stderr,
      new RegExp(`${failedLegacyPrice.envKey} could not be retrieved from Stripe`),
    )
    assert.doesNotMatch(
      result.stderr,
      /retained default Stripe Portal Product and Price allowlist/,
    )
  })

  it("checks the complete Price ID inventory before Stripe retrieval", () => {
    const result = runReadiness({
      ...Object.fromEntries(Object.keys(membershipPrices).map((key) => [key, ""])),
    }, ["--verify-stripe"])
    assert.equal(result.status, 1)
    assert.match(result.stderr, /STRIPE_SUPPORTER_1_PERSONAL_MONTHLY_PRICE_ID is missing/)
    assert.match(result.stdout, /Stripe API retrieval requested: true/)
    assert.match(result.stdout, /Stripe API retrieval performed: false/)
  })
})
