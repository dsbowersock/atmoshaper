import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  buildCurrentSupporterPriceMetadata,
  buildCurrentSupporterProductMetadata,
  classifySupporterPriceMetadata,
  classifySupporterProductMetadata,
  hasAnySupporterSchemaMetadata,
  hasCurrentSupporterSchemaMetadata,
} from "../lib/stripe-provider-identity.js"
import {
  LEGACY_SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
  SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
} from "../lib/stripe-price-contract.js"

const currentProduct = {
  app: "atmoshaper",
  atmoshaper_catalog: SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
  atmoshaper_membership_level: "SUPPORTER",
  atmoshaper_supporter_amount_choice: "support-2",
}
const legacyProduct = {
  app: "massagelab",
  massagelab_catalog: SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
  massagelab_membership_level: "SUPPORTER",
  massagelab_supporter_amount_choice: "support-2",
}
const currentPrice = {
  app: "atmoshaper",
  atmoshaper_catalog: SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
  atmoshaper_membership_level: "SUPPORTER",
  atmoshaper_supporter_price_key: "support-2-month",
}
const legacyPrice = {
  app: "massagelab",
  massagelab_catalog: SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
  massagelab_membership_level: "SUPPORTER",
  massagelab_supporter_price_key: "support-2-month",
}

describe("Stripe provider identity", () => {
  it("continues to classify the deployed v1 catalog for reconciliation", () => {
    assert.deepEqual(classifySupporterProductMetadata({
      ...currentProduct,
      atmoshaper_catalog: LEGACY_SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
    }), {
      schema: "current",
      amountChoiceId: "support-2",
    })
    assert.deepEqual(classifySupporterPriceMetadata({
      ...currentPrice,
      atmoshaper_catalog: LEGACY_SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
    }), {
      schema: "current",
      priceKey: "support-2-month",
    })
    assert.equal(classifySupporterProductMetadata({
      ...currentProduct,
      atmoshaper_catalog: LEGACY_SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
    }, {
      catalogVersion: SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
    }), null)
    assert.equal(classifySupporterPriceMetadata({
      ...currentPrice,
      atmoshaper_catalog: LEGACY_SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
    }, {
      catalogVersion: SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
    }), null)
  })

  it("classifies exact current and legacy Product metadata", () => {
    assert.deepEqual(classifySupporterProductMetadata(currentProduct), {
      schema: "current",
      amountChoiceId: "support-2",
    })
    assert.deepEqual(classifySupporterProductMetadata(legacyProduct), {
      schema: "legacy",
      amountChoiceId: "support-2",
    })
  })

  it("accepts dual Product metadata only when both complete schemas agree", () => {
    assert.deepEqual(classifySupporterProductMetadata({
      ...currentProduct,
      massagelab_catalog: SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
      massagelab_membership_level: "SUPPORTER",
      massagelab_supporter_amount_choice: "support-2",
    }), {
      schema: "dual",
      amountChoiceId: "support-2",
    })
    assert.equal(classifySupporterProductMetadata({
      ...currentProduct,
      massagelab_catalog: SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
      massagelab_membership_level: "SUPPORTER",
      massagelab_supporter_amount_choice: "support-5",
    }), null)
    assert.equal(classifySupporterProductMetadata({
      ...currentProduct,
      massagelab_catalog: LEGACY_SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
      massagelab_membership_level: "SUPPORTER",
      massagelab_supporter_amount_choice: "support-2",
    }), null)
  })

  it("rejects partial, mislabeled, unrelated, and malformed Product metadata", () => {
    assert.equal(classifySupporterProductMetadata({
      app: "atmoshaper",
      atmoshaper_catalog: SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
    }), null)
    assert.equal(classifySupporterProductMetadata({
      ...currentProduct,
      app: "massagelab",
    }), null)
    assert.equal(classifySupporterProductMetadata({
      ...currentProduct,
      atmoshaper_supporter_price_key: "support-2-month",
    }), null)
    assert.equal(classifySupporterProductMetadata({
      ...currentProduct,
      massagelab_supporter_price_key: "support-2-month",
    }), null)
    assert.equal(classifySupporterProductMetadata({ owner: "atmoshaper" }), null)
    assert.equal(classifySupporterProductMetadata([]), null)
    assert.equal(classifySupporterProductMetadata(null), null)
  })

  it("classifies exact current, legacy, and agreeing dual Price metadata", () => {
    assert.deepEqual(classifySupporterPriceMetadata(currentPrice), {
      schema: "current",
      priceKey: "support-2-month",
    })
    assert.deepEqual(classifySupporterPriceMetadata(legacyPrice), {
      schema: "legacy",
      priceKey: "support-2-month",
    })
    assert.deepEqual(classifySupporterPriceMetadata({
      ...legacyPrice,
      atmoshaper_catalog: SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
      atmoshaper_membership_level: "SUPPORTER",
      atmoshaper_supporter_price_key: "support-2-month",
    }), {
      schema: "dual",
      priceKey: "support-2-month",
    })
  })

  it("rejects partial and contradictory Price metadata", () => {
    assert.equal(classifySupporterPriceMetadata({
      ...currentPrice,
      massagelab_catalog: SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
      massagelab_membership_level: "SUPPORTER",
    }), null)
    assert.equal(classifySupporterPriceMetadata({
      ...currentPrice,
      massagelab_catalog: SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
      massagelab_membership_level: "SUPPORTER",
      massagelab_supporter_price_key: "support-5-year",
    }), null)
    assert.equal(classifySupporterPriceMetadata({
      ...currentPrice,
      atmoshaper_supporter_amount_choice: "support-2",
    }), null)
    assert.equal(classifySupporterPriceMetadata({
      ...currentPrice,
      massagelab_supporter_amount_choice: "support-2",
    }), null)
  })

  it("detects partial managed schemas without treating app metadata alone as ownership", () => {
    assert.equal(hasCurrentSupporterSchemaMetadata({
      atmoshaper_catalog: SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
    }), true)
    assert.equal(hasCurrentSupporterSchemaMetadata(legacyProduct), false)
    assert.equal(hasAnySupporterSchemaMetadata({
      massagelab_supporter_price_key: "support-2-month",
    }), true)
    assert.equal(hasAnySupporterSchemaMetadata({ app: "atmoshaper" }), false)
  })

  it("builds current Product metadata without copying managed legacy keys", () => {
    assert.deepEqual(buildCurrentSupporterProductMetadata({
      ...legacyProduct,
      massagelab_supporter_price_key: "stale-price",
      unrelated: "keep",
    }, "support-5"), {
      unrelated: "keep",
      app: "atmoshaper",
      atmoshaper_catalog: SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
      atmoshaper_membership_level: "SUPPORTER",
      atmoshaper_supporter_amount_choice: "support-5",
    })
  })

  it("emits Stripe metadata tombstones only for managed keys on updates", () => {
    assert.deepEqual(buildCurrentSupporterProductMetadata({
      ...legacyProduct,
      massagelab_supporter_price_key: "stale-price",
      unrelated: "keep",
    }, "support-5", { forUpdate: true }), {
      unrelated: "keep",
      massagelab_catalog: "",
      massagelab_membership_level: "",
      massagelab_supporter_amount_choice: "",
      massagelab_supporter_price_key: "",
      app: "atmoshaper",
      atmoshaper_catalog: SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
      atmoshaper_membership_level: "SUPPORTER",
      atmoshaper_supporter_amount_choice: "support-5",
    })
  })

  it("builds current Price metadata and validates required identities", () => {
    assert.deepEqual(buildCurrentSupporterPriceMetadata({
      ...currentPrice,
      massagelab_supporter_amount_choice: "stale-choice",
      unrelated: "keep",
    }, "support-5-year"), {
      unrelated: "keep",
      app: "atmoshaper",
      atmoshaper_catalog: SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
      atmoshaper_membership_level: "SUPPORTER",
      atmoshaper_supporter_price_key: "support-5-year",
    })
    assert.throws(
      () => buildCurrentSupporterProductMetadata({}, ""),
      /non-empty string/,
    )
    assert.throws(
      () => buildCurrentSupporterPriceMetadata({}, null),
      /non-empty string/,
    )
  })

  it("allows the retained migration to pin legacy catalog metadata", () => {
    assert.equal(
      buildCurrentSupporterProductMetadata({}, "support-1", {
        catalogVersion: LEGACY_SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
      }).atmoshaper_catalog,
      LEGACY_SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
    )
    assert.equal(
      buildCurrentSupporterPriceMetadata({}, "support-1-month", {
        catalogVersion: LEGACY_SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
      }).atmoshaper_catalog,
      LEGACY_SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
    )
    assert.throws(
      () => buildCurrentSupporterProductMetadata({}, "support-1", {
        catalogVersion: "supporter_membership_unknown",
      }),
      /supported non-empty string/,
    )
  })
})
