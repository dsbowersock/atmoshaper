/**
 * Pure US/USD pilot rules. Inputs must come from the owning business's verified
 * server records before any real operation; this module performs no I/O and
 * does not turn browser-supplied consent/status into payment authorization.
 */
export const PAYMENT_PROVIDERS = Object.freeze(["stripe", "square"])
export const BOOKING_PAYMENT_MODES = Object.freeze(["none", "card", "deposit", "full"])
export const MAX_PAYMENT_CENTS = 99_999_999

function requireValue(condition, message) {
  if (!condition) throw new Error(message)
}

/** Reject precision loss, signs, scientific notation and fractional cents. */
export function parseMoneyCents(value) {
  requireValue(typeof value === "string" && /^\d{1,6}(?:\.\d{1,2})?$/.test(value.trim()), "Enter a dollar amount with up to two decimal places.")
  const [whole, fraction = ""] = value.trim().split(".")
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"))
  return assertCents(cents)
}

export function assertCents(value) {
  requireValue(Number.isSafeInteger(value) && value >= 0 && value <= MAX_PAYMENT_CENTS, "Amount must be nonnegative whole cents within the supported limit.")
  return value
}

export function formatPaymentMoney(cents) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(assertCents(cents) / 100)
}

function assertAmountRule(rule) {
  requireValue(rule && (rule.kind === "fixed" || rule.kind === "percent"), "Choose a fixed amount or percentage.")
  requireValue(Number.isSafeInteger(rule.value) && rule.value > 0, "Enter a positive amount or percentage.")
  requireValue(rule.kind === "percent" ? rule.value <= 10000 : rule.value <= MAX_PAYMENT_CENTS, "Amount or percentage exceeds its limit.")
  return { kind: rule.kind, value: rule.value }
}

/** Percentages are integer basis points; half cents round up, never float. */
export function calculatePaymentPortion(totalCents, rule) {
  assertCents(totalCents)
  assertAmountRule(rule)
  const requested = rule.kind === "fixed"
    ? rule.value
    : Number((BigInt(totalCents) * BigInt(rule.value) + 5000n) / 10000n)
  return Math.min(totalCents, requested)
}

/** A policy snapshot is immutable booking evidence, not the current editor state. */
export function validatePaymentPolicy(policy) {
  requireValue(policy && typeof policy === "object", "Choose payment settings.")
  requireValue(typeof policy.version === "string" && /^[a-zA-Z0-9_-]{1,80}$/.test(policy.version), "A policy version is required.")
  requireValue(BOOKING_PAYMENT_MODES.includes(policy.mode), "Choose a booking payment requirement.")
  requireValue(typeof policy.noShowProtection === "boolean", "Choose whether no-show protection is enabled.")
  if (policy.mode === "deposit") assertAmountRule(policy.deposit)
  if (policy.noShowProtection) {
    assertAmountRule(policy.fee)
    requireValue(Number.isInteger(policy.cancelHours) && policy.cancelHours >= 0 && policy.cancelHours <= 720, "Cancellation notice must be between 0 and 720 hours.")
    requireValue(Number.isInteger(policy.graceMinutes) && policy.graceMinutes >= 0 && policy.graceMinutes <= 1440, "No-show grace must be between 0 and 1440 minutes.")
  }
  return policy
}

export function quoteBookingPayment(totalCents, policy) {
  assertCents(totalCents)
  validatePaymentPolicy(policy)
  const dueNowCents = policy.mode === "full" ? totalCents
    : policy.mode === "deposit" ? calculatePaymentPortion(totalCents, policy.deposit) : 0
  requireValue(policy.mode !== "deposit" || totalCents === 0 || dueNowCents > 0, "The deposit rounds below one cent.")
  return {
    totalCents, dueNowCents, remainingCents: totalCents - dueNowCents,
    saveCardRequired: policy.mode === "card" || policy.noShowProtection,
    maximumFeeCents: policy.noShowProtection ? calculatePaymentPortion(totalCents, policy.fee) : 0,
    reservesFunds: false,
  }
}

/** Canonical comparison of trusted saved policy facts, not a browser signature. */
export function paymentPolicyKey(policy) {
  validatePaymentPolicy(policy)
  return JSON.stringify({ version: policy.version, mode: policy.mode,
    deposit: policy.mode === "deposit" ? assertAmountRule(policy.deposit) : null,
    noShowProtection: policy.noShowProtection,
    fee: policy.noShowProtection ? assertAmountRule(policy.fee) : null,
    cancelHours: policy.noShowProtection ? policy.cancelHours : null,
    graceMinutes: policy.noShowProtection ? policy.graceMinutes : null })
}

/** Consume only verified, business/appointment/provider-scoped payment records. */
export function summarizeAppointmentPayments({ practiceId, appointmentId, merchantRef, provider, records }) {
  requireValue(typeof practiceId === "string" && practiceId && typeof appointmentId === "string" && appointmentId, "Payment scope is required.")
  requireValue(PAYMENT_PROVIDERS.includes(provider), "Choose a supported payment provider.")
  requireValue(typeof merchantRef === "string" && merchantRef, "A verified merchant is required.")
  requireValue(Array.isArray(records), "Payment records are required.")
  const ids = new Set()
  let receivedCents = 0, refundedCents = 0
  for (const record of records) {
    requireValue(record.practiceId === practiceId && record.appointmentId === appointmentId && record.merchantRef === merchantRef && record.provider === provider && record.currency === "USD", "Payment record does not belong to this appointment and business.")
    requireValue(typeof record.id === "string" && record.id && !ids.has(record.id), "Payment records must have unique identifiers.")
    ids.add(record.id)
    requireValue(record.verified === true, "Payment status must be verified with the processor.")
    requireValue(["SUCCEEDED", "PENDING", "UNKNOWN", "FAILED", "CANCELED", "DISPUTED"].includes(record.status), "Unrecognized payment state.")
    assertCents(record.amountCents)
    assertCents(record.refundedCents)
    requireValue(record.refundedCents <= record.amountCents, "Refund exceeds the original payment.")
    if (record.status === "SUCCEEDED" || record.status === "DISPUTED") {
      receivedCents += record.amountCents
      refundedCents += record.refundedCents
    } else requireValue(record.refundedCents === 0, "An unsettled payment cannot have a settled refund.")
  }
  assertCents(receivedCents)
  assertCents(refundedCents)
  return {
    receivedCents, refundedCents, netPaidCents: receivedCents - refundedCents,
    unresolved: records.some(record => ["PENDING", "UNKNOWN", "DISPUTED"].includes(record.status)),
  }
}

function timestamp(value) {
  const ms = typeof value === "string" ? Date.parse(value) : Number.NaN
  requireValue(Number.isFinite(ms), "A valid timestamp is required.")
  return ms
}

/**
 * Computes a review, never a charge. A durable service must recheck the original
 * review, permission, consent and ledger under its lock before dispatch.
 */
export function reviewNoShowFee({ appointment, policy, consent, savedCard, records, now }) {
  validatePaymentPolicy(policy)
  assertCents(appointment.totalCents)
  const blocked = reason => ({ eligible: false, reason, feeCents: 0, additionalChargeCents: 0, creditCents: 0, refundReviewCents: 0 })
  if (!policy.noShowProtection) return blocked("No-show protection is off for this booking.")
  if (!['NO_SHOW', 'CANCELED'].includes(appointment.status)) return blocked("Mark the appointment as a no-show or record its cancellation first.")
  const time = timestamp(now), start = timestamp(appointment.startsAt)
  if (appointment.status === "NO_SHOW" && time < start + policy.graceMinutes * 60000) return blocked("The appointment's no-show grace period has not ended.")
  let decisionTime = start
  if (appointment.status === "CANCELED") {
    decisionTime = timestamp(appointment.canceledAt)
    if (decisionTime > time) return blocked("The cancellation time is in the future.")
    if (decisionTime <= start - policy.cancelHours * 3600000) return blocked("The client canceled within the allowed notice period.")
  }
  if (!consent || consent.practiceId !== appointment.practiceId || consent.appointmentId !== appointment.id
    || consent.policyVersion !== policy.version || consent.merchantRef !== appointment.merchantRef
    || consent.provider !== appointment.provider || consent.policyKey !== paymentPolicyKey(policy)
    || consent.authorizesFee !== true || consent.revokedAt) return blocked("This booking has no matching, active authorization for the fee.")
  if (timestamp(consent.acceptedAt) > Math.min(time, decisionTime)) return blocked("The policy was accepted after the fee-triggering event.")
  const ledger = summarizeAppointmentPayments({ practiceId: appointment.practiceId, appointmentId: appointment.id, merchantRef: appointment.merchantRef, provider: appointment.provider, records })
  if (ledger.unresolved) return blocked("Resolve the existing payment or dispute before reviewing another fee.")
  const feeCents = calculatePaymentPortion(appointment.totalCents, policy.fee)
  const additionalChargeCents = Math.max(0, feeCents - ledger.netPaidCents)
  if (additionalChargeCents > 0 && (!savedCard || savedCard.practiceId !== appointment.practiceId
    || savedCard.provider !== appointment.provider || savedCard.merchantRef !== appointment.merchantRef
    || savedCard.clientRef !== appointment.clientRef || savedCard.active !== true)) return blocked("A usable card authorized for this business and client is required.")
  return {
    eligible: true, reason: "Review the amount and accepted policy, then choose whether to charge or waive.",
    feeCents, additionalChargeCents, creditCents: Math.min(feeCents, ledger.netPaidCents),
    refundReviewCents: Math.max(0, ledger.netPaidCents - feeCents),
  }
}

/** Attempts are for ONE durable operation; success/unknown cannot be re-dispatched. */
export function mayStartPaymentAttempt(attempts) {
  requireValue(Array.isArray(attempts), "Existing attempts must be loaded first.")
  for (const attempt of attempts) requireValue(["PENDING", "UNKNOWN", "SUCCEEDED", "FAILED", "CANCELED"].includes(attempt.status), "Unrecognized attempt state.")
  return !attempts.some(attempt => ["PENDING", "UNKNOWN", "SUCCEEDED"].includes(attempt.status))
}
