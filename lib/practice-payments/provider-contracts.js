import { assertCents, PAYMENT_PROVIDERS } from "./domain.js"

function requireValue(condition, message) {
  if (!condition) throw new Error(message)
}

function reference(value) {
  requireValue(typeof value === "string" && /^[A-Za-z0-9_-]{1,120}$/.test(value), "Use a server-issued opaque reference.")
  return value
}

function paymentReference(value) {
  requireValue(typeof value === "string" && /^[A-Za-z0-9_:-]{1,500}$/.test(value), "Use a processor-issued payment reference.")
  return value
}

/**
 * Offline request contracts, deliberately without transport or secret loading.
 * They are not proof of a working integration. Before using them, the durable
 * service must authorize/lock its business records and verify provider state.
 */
export function buildSavedCardCharge({ connection, operation, source }) {
  requireValue(connection && PAYMENT_PROVIDERS.includes(connection.provider), "Choose a supported processor.")
  requireValue(connection.status === "READY" && connection.capabilityVerified === true, "Finish payment-account setup first.")
  requireValue(connection.environment === "sandbox" || connection.environment === "live", "A verified provider environment is required.")
  reference(connection.practiceId)
  reference(connection.id)
  reference(operation.clientRef)
  requireValue(operation.practiceId === connection.practiceId && operation.connectionRef === connection.id
    && operation.merchantRef === connection.merchantRef && operation.provider === connection.provider
    && operation.environment === connection.environment, "Payment and account scope do not match.")
  requireValue(operation.currency === "USD", "This pilot supports USD payments.")
  assertCents(operation.amountCents)
  requireValue(operation.amountCents > 0, "There is no remaining amount to collect.")
  requireValue(["APPOINTMENT", "NO_SHOW"].includes(operation.purpose), "On-page deposits/prepayments use their separate buyer-confirmed checkout flow.")
  const key = reference(operation.id), merchant = reference(connection.merchantRef)
  requireValue(key.length <= 40, "The operation key exceeds the processor reference limit.")
  const sourceRef = paymentReference(source.paymentMethodRef), customerRef = reference(source.customerRef)
  requireValue(source.practiceId === connection.practiceId && source.merchantRef === merchant
    && source.provider === connection.provider && source.clientRef === operation.clientRef, "Payment method belongs to a different business or client.")
  requireValue(source.active === true && !source.revokedAt, "The saved-card authorization is no longer active.")
  if (operation.purpose === "NO_SHOW") requireValue(operation.reviewConfirmed === true && operation.reviewRef && source.authorizesFee === true, "Review and authorize the applicable fee first.")
  else requireValue(source.authorizesAppointment === true, "The client must authorize saved-card appointment collection.")
  requireValue(source.usage === "off_session", "An off-session saved-card authorization is required.")
  requireValue(operation.dispatchState === "RESERVED", "Reserve the original payment operation before dispatch.")
  if (connection.provider === "stripe") {
    requireValue(/^acct_[A-Za-z0-9]+$/.test(merchant), "A connected merchant account is required.")
    return {
      provider: "stripe", method: "POST", path: "/v1/payment_intents",
      headers: { "Stripe-Account": merchant, "Idempotency-Key": key },
      // The connected account, never AtmoShaper, receives this direct charge.
      body: { amount: operation.amountCents, currency: "usd", customer: customerRef,
        payment_method: sourceRef, confirm: true, off_session: true,
        metadata: { operation_ref: key } },
    }
  }
  return {
    provider: "square", method: "POST", path: "/v2/payments",
    // The server selects this seller's encrypted OAuth credential separately.
    credentialOwner: merchant,
    body: { idempotency_key: key, source_id: sourceRef, customer_id: customerRef,
      location_id: reference(connection.locationRef),
      amount_money: { amount: operation.amountCents, currency: "USD" },
      reference_id: key, autocomplete: true },
  }
}

/** New accounts use provider-managed identity collection; no private KYC data. */
export function stripeMerchantConfiguration() {
  return {
    dashboard: "full",
    defaults: { responsibilities: { fees_collector: "stripe", losses_collector: "stripe" } },
    configuration: { merchant: { capabilities: { card_payments: { requested: true } } } },
  }
}

/** OAuth return is not readiness; stale, revoked or mismatched evidence is closed. */
export function paymentConnectionState({ provider, expectedMerchantRef, evidence }) {
  requireValue(PAYMENT_PROVIDERS.includes(provider), "Choose a supported processor.")
  if (!evidence) return "NOT_CONNECTED"
  if (typeof expectedMerchantRef !== "string" || !expectedMerchantRef.trim()
    || typeof evidence.merchantRef !== "string" || !evidence.merchantRef.trim()) return "NEEDS_REVIEW"
  if (evidence.provider !== provider || evidence.merchantRef !== expectedMerchantRef || evidence.verified !== true) return "NEEDS_REVIEW"
  if (evidence.revoked) return "DISCONNECTED"
  if (evidence.restricted) return "RESTRICTED"
  return evidence.cardPaymentsActive === true ? "READY" : "SETUP_REQUIRED"
}

/**
 * Browser NFC is not a card reader. Only an installed native adapter's verified
 * SDK capability may enable phone acceptance; a model/OS guess never does.
 */
export function phonePaymentAvailability({ provider, platform, nativeSdkReady, deviceEligible, merchantReady }) {
  requireValue(PAYMENT_PROVIDERS.includes(provider), "Choose a supported processor.")
  if (!merchantReady) return { available: false, reason: "Finish your payment-account setup first." }
  if (platform !== "android" && platform !== "ios") return { available: false, reason: "Phone Tap to Pay needs the AtmoShaper mobile app." }
  if (nativeSdkReady !== true) return { available: false, reason: "Phone payments are not available in this app build yet." }
  if (deviceEligible !== true) return { available: false, reason: "This device has not passed the processor's Tap to Pay checks." }
  return { available: true, reason: "Ready for the native payment review." }
}
