import { SUPPORTER_MEMBERSHIP_CATALOG_VERSION } from "./stripe-price-contract.js"

const CURRENT_APP = "atmoshaper"
const LEGACY_APP = "massagelab"
const SUPPORTER_LEVEL = "SUPPORTER"

const CURRENT_KEYS = Object.freeze({
  catalog: "atmoshaper_catalog",
  membershipLevel: "atmoshaper_membership_level",
  amountChoice: "atmoshaper_supporter_amount_choice",
  priceKey: "atmoshaper_supporter_price_key",
})
const LEGACY_KEYS = Object.freeze({
  catalog: "massagelab_catalog",
  membershipLevel: "massagelab_membership_level",
  amountChoice: "massagelab_supporter_amount_choice",
  priceKey: "massagelab_supporter_price_key",
})
const MANAGED_KEYS = Object.freeze([
  "app",
  ...Object.values(CURRENT_KEYS),
  ...Object.values(LEGACY_KEYS),
])

function metadataRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : null
}

function nonEmptyString(value) {
  return typeof value === "string" && value.length > 0 ? value : null
}

function hasAnySchemaKey(metadata, keys, identityKey) {
  return [keys.catalog, keys.membershipLevel, keys[identityKey]]
    .some((key) => Object.hasOwn(metadata, key))
}

function readSchema(metadata, keys, identityKey) {
  if (!hasAnySchemaKey(metadata, keys, identityKey)) return null

  const catalog = nonEmptyString(metadata[keys.catalog])
  const membershipLevel = nonEmptyString(metadata[keys.membershipLevel])
  const identity = nonEmptyString(metadata[keys[identityKey]])
  if (!catalog || !membershipLevel || !identity) {
    return { complete: false }
  }

  return {
    complete: true,
    catalog,
    membershipLevel,
    identity,
  }
}

function schemaMatchesContract(schema) {
  return schema?.complete === true
    && schema.catalog === SUPPORTER_MEMBERSHIP_CATALOG_VERSION
    && schema.membershipLevel === SUPPORTER_LEVEL
}

/**
 * Classifies exact current, legacy, or agreeing dual Supporter metadata.
 * Partial schemas, conflicting dual schemas, and unrelated records fail closed.
 *
 * @param {unknown} value Stripe metadata to classify.
 * @param {"amountChoice" | "priceKey"} identityKey Managed identity field.
 * @returns {{schema: "current" | "legacy" | "dual", identity: string} | null}
 * A trusted classification, or null when ownership is not proven.
 */
function classifySupporterMetadata(value, identityKey) {
  const metadata = metadataRecord(value)
  if (!metadata) return null

  const current = readSchema(metadata, CURRENT_KEYS, identityKey)
  const legacy = readSchema(metadata, LEGACY_KEYS, identityKey)
  if (!current && !legacy) return null
  if ((current && !schemaMatchesContract(current))
    || (legacy && !schemaMatchesContract(legacy))) {
    return null
  }

  if (current && legacy) {
    if (
      ![CURRENT_APP, LEGACY_APP].includes(metadata.app)
      || current.identity !== legacy.identity
    ) {
      return null
    }
    return { schema: "dual", identity: current.identity }
  }

  if (current && metadata.app === CURRENT_APP) {
    return { schema: "current", identity: current.identity }
  }
  if (legacy && metadata.app === LEGACY_APP) {
    return { schema: "legacy", identity: legacy.identity }
  }
  return null
}

function stripManagedMetadata(value) {
  const metadata = metadataRecord(value) ?? {}
  return Object.fromEntries(
    Object.entries(metadata).filter(([key]) => !MANAGED_KEYS.includes(key)),
  )
}

function managedMetadataTombstones(value, retainedKeys) {
  const metadata = metadataRecord(value)
  if (!metadata) return {}

  return Object.fromEntries(
    MANAGED_KEYS
      .filter((key) => key !== "app")
      .filter((key) => !retainedKeys.includes(key))
      .filter((key) => Object.hasOwn(metadata, key))
      .map((key) => [key, ""]),
  )
}

/**
 * Builds metadata for a new AtmoShaper Supporter Product while retaining only
 * unrelated caller metadata and removing every current or legacy managed key.
 */
export function buildCurrentSupporterProductMetadata(
  value,
  amountChoiceId,
  { forUpdate = false } = {},
) {
  const identity = nonEmptyString(amountChoiceId)
  if (!identity) {
    throw new TypeError("Supporter Product amount choice must be a non-empty string.")
  }

  return {
    ...stripManagedMetadata(value),
    ...(forUpdate
      ? managedMetadataTombstones(value, [
          CURRENT_KEYS.catalog,
          CURRENT_KEYS.membershipLevel,
          CURRENT_KEYS.amountChoice,
        ])
      : {}),
    app: CURRENT_APP,
    [CURRENT_KEYS.catalog]: SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
    [CURRENT_KEYS.membershipLevel]: SUPPORTER_LEVEL,
    [CURRENT_KEYS.amountChoice]: identity,
  }
}

/** Builds metadata for a new AtmoShaper Supporter Price. */
export function buildCurrentSupporterPriceMetadata(
  value,
  priceKey,
  { forUpdate = false } = {},
) {
  const identity = nonEmptyString(priceKey)
  if (!identity) {
    throw new TypeError("Supporter Price key must be a non-empty string.")
  }

  return {
    ...stripManagedMetadata(value),
    ...(forUpdate
      ? managedMetadataTombstones(value, [
          CURRENT_KEYS.catalog,
          CURRENT_KEYS.membershipLevel,
          CURRENT_KEYS.priceKey,
        ])
      : {}),
    app: CURRENT_APP,
    [CURRENT_KEYS.catalog]: SUPPORTER_MEMBERSHIP_CATALOG_VERSION,
    [CURRENT_KEYS.membershipLevel]: SUPPORTER_LEVEL,
    [CURRENT_KEYS.priceKey]: identity,
  }
}

/** Returns a trusted Supporter Product identity or null. */
export function classifySupporterProductMetadata(value) {
  const classification = classifySupporterMetadata(value, "amountChoice")
  return classification
    ? { schema: classification.schema, amountChoiceId: classification.identity }
    : null
}

/** Returns a trusted Supporter Price identity or null. */
export function classifySupporterPriceMetadata(value) {
  const classification = classifySupporterMetadata(value, "priceKey")
  return classification
    ? { schema: classification.schema, priceKey: classification.identity }
    : null
}
