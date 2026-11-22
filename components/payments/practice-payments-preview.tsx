"use client"

import { useMemo, useState } from "react"
import { CreditCard, Smartphone, ShieldCheck, ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { calculatePaymentPortion, formatPaymentMoney, parseMoneyCents, paymentPolicyKey, quoteBookingPayment, reviewNoShowFee } from "@/lib/practice-payments/domain"
import styles from "./practice-payments-preview.module.css"

const steps = ["Set up", "Booking", "Collect", "Fee review"]
const modes = [
  ["none", "Pay at the appointment", "No payment needed to book"],
  ["card", "Card to reserve", "Save an authorized card; no payment now"],
  ["deposit", "Deposit", "Pay part now and the rest at the appointment"],
  ["full", "Pay in full", "Collect the appointment price when booking"],
]

/**
 * A fictional, provider-free design workspace. Every outcome is explicitly a
 * simulation; it never mounts card fields, reads an account, or dispatches money.
 */
export function PracticePaymentsPreview() {
  const [step, setStep] = useState(0)
  const [provider, setProvider] = useState("stripe")
  const [accountPath, setAccountPath] = useState("new")
  const [accountStage, setAccountStage] = useState("not-connected")
  const [mode, setMode] = useState("deposit")
  const [protection, setProtection] = useState(true)
  const [total, setTotal] = useState("100.00")
  const [deposit, setDeposit] = useState("25.00")
  const [notice, setNotice] = useState("24")
  const [fee, setFee] = useState("50.00")
  const [agreed, setAgreed] = useState(false)
  const [booked, setBooked] = useState(false)
  const [paid, setPaid] = useState(0)
  const [waived, setWaived] = useState(false)
  const [feeCollected, setFeeCollected] = useState(false)
  const [message, setMessage] = useState("")
  const providerName = provider === "stripe" ? "Stripe" : "Square"
  const settings = useMemo(() => {
    try {
      const priceCents = parseMoneyCents(total)
      const noticeHours = protection ? Number(notice) : 24
      if (protection && !/^\d{1,3}$/.test(notice)) throw new Error("Enter cancellation notice as whole hours.")
      const policy = { version: "fictional-policy-v1", mode, noShowProtection: protection,
        deposit: { kind: "fixed", value: mode === "deposit" ? parseMoneyCents(deposit) : 0 },
        fee: { kind: "fixed", value: protection ? parseMoneyCents(fee) : 0 }, cancelHours: noticeHours, graceMinutes: 15 }
      return { priceCents, policy, quote: quoteBookingPayment(priceCents, policy), error: "" }
    } catch (error) { return { error: error instanceof Error ? error.message : "Check the payment settings." } }
  }, [total, deposit, fee, mode, protection, notice])
  const { policy, quote, priceCents } = settings
  const merchantRef = provider === "stripe" ? "acct_example" : "EXAMPLE_SELLER"
  const appointment = { id: "example-appointment", practiceId: "example-business", clientRef: "example-client",
    merchantRef, provider, totalCents: priceCents ?? 0, startsAt: "2030-01-02T15:00:00Z", status: "NO_SHOW" }
  const feeReview = policy ? reviewNoShowFee({ appointment, policy,
    consent: booked && agreed ? { practiceId: appointment.practiceId, appointmentId: appointment.id, merchantRef, provider,
      policyVersion: policy.version, policyKey: paymentPolicyKey(policy), authorizesFee: true, acceptedAt: "2030-01-01T10:00:00Z" } : null,
    savedCard: { practiceId: appointment.practiceId, merchantRef, provider, clientRef: appointment.clientRef, active: booked && agreed },
    records: paid ? [{ id: "example-receipt", practiceId: appointment.practiceId, appointmentId: appointment.id,
      merchantRef, provider, currency: "USD", amountCents: paid, refundedCents: 0, verified: true, status: "SUCCEEDED" }] : [],
    now: "2030-01-02T15:20:00Z",
  }) : null
  const remaining = Math.max(0, (priceCents ?? 0) - paid)

  function move(next: number) { setStep(next); setMessage("") }
  // Consent applies to the displayed facts, so edits require a fresh choice.
  function editPolicy(change: () => void) { change(); setAgreed(false); setMessage("") }
  function resetBooking() { setBooked(false); setPaid(0); setAgreed(false); setWaived(false); setFeeCollected(false); setMessage("") }
  function changeProvider(next: string) { setProvider(next); setAccountStage("not-connected"); resetBooking() }
  function recordBooking() {
    if (!quote || accountStage !== "ready" || (quote.saveCardRequired && !agreed)) return
    setBooked(true); setPaid(quote.dueNowCents); setMessage("Example booking prepared. No card was saved and no payment was sent.")
  }

  return <main className={styles.workspace}>
    <div className={styles.previewNotice}><strong>Local design preview</strong><span>Fictional business and client. No account connections or payments.</span></div>
    <header className={styles.header}><div><p className={styles.eyebrow}>Example solo practice</p><h1>Payments</h1><p>Booking to checkout, in one place.</p></div><CreditCard aria-hidden="true" /></header>
    <nav className={styles.steps} aria-label="Payment workflow">
      {steps.map((label, index) => <Button key={label} variant={step === index ? "default" : "glow"} aria-current={step === index ? "step" : undefined} onClick={() => move(index)}>{index + 1}. {label}</Button>)}
    </nav>
    <section className={styles.panel} aria-labelledby="payment-step-title">
      <h2 id="payment-step-title">{["Your payment account", "What clients need to book", "At the appointment", "Review a no-show fee"][step]}</h2>
      {step === 0 && <>
        <p>Connect the account for the business receiving the client&apos;s payment.</p>
        <div className={styles.choices}>{["stripe", "square"].map(value => <Button key={value} variant={provider === value ? "cta" : "glow"} aria-pressed={provider === value} onClick={() => changeProvider(value)}>{value === "stripe" ? "Stripe" : "Square"}</Button>)}</div>
        <fieldset><legend>Do you already have a {providerName} account?</legend><div className={styles.choices}>
          <Button variant={accountPath === "new" ? "secondary" : "glow"} aria-pressed={accountPath === "new"} onClick={() => setAccountPath("new")}>I need an account</Button>
          <Button variant={accountPath === "existing" ? "secondary" : "glow"} aria-pressed={accountPath === "existing"} onClick={() => setAccountPath("existing")}>Connect my account</Button>
        </div></fieldset>
        <div className={styles.inset}><ShieldCheck aria-hidden="true" /><div><strong>{accountPath === "new" ? `Create your account with ${providerName}` : `Authorize your ${providerName} business`}</strong><p>{providerName} handles business verification, bank details and its agreements. You can return and finish setup later.</p></div></div>
        <p className={styles.subtle}>Client payments go to your business. AtmoShaper access and processing fees are separate.</p>
        <p><strong>Example account status:</strong> <span data-testid="account-state">{accountStage === "ready" ? "Ready (simulated)" : accountStage === "pending" ? "Verification pending (simulated)" : "Not connected"}</span></p>
        <div className={styles.actions}><Button onClick={() => { setAccountStage("pending"); setMessage("A real setup would open the processor's secure onboarding. Returning alone does not enable payments.") }}>Preview {accountPath === "new" ? "new-account setup" : "account connection"}</Button>
          {accountStage === "pending" && <Button variant="success" onClick={() => { setAccountStage("ready"); setMessage("Fictional verification completed for the preview only.") }}>Simulate verification complete</Button>}
        </div>
      </>}
      {step === 1 && <>
        <p>Choose your booking requirement. You can still collect the remaining balance at the appointment.</p>
        {booked && <div className={styles.inset}><p>The example booking keeps its accepted settings. Reset it to try a different policy.</p><Button variant="glow" onClick={resetBooking}>Reset example booking</Button></div>}
        <fieldset disabled={booked} className={styles.fields}><label>Appointment price <div className={styles.money}><span aria-hidden="true">$</span><input aria-label="Appointment price in dollars" inputMode="decimal" value={total} onChange={e => editPolicy(() => setTotal(e.target.value))} /></div></label>
          <div className={styles.modeGrid}>{modes.map(([value, title, description]) => <Button className={styles.mode} key={value} variant={mode === value ? "default" : "glow"} aria-pressed={mode === value} onClick={() => editPolicy(() => setMode(value))}><strong>{title}</strong><span>{description}</span></Button>)}</div>
          {mode === "deposit" && <label>Deposit collected at booking <div className={styles.money}><span aria-hidden="true">$</span><input aria-label="Deposit in dollars" inputMode="decimal" value={deposit} onChange={e => editPolicy(() => setDeposit(e.target.value))} /></div><small>Applied toward the appointment price, rather than added to it.</small></label>}
          <label className={styles.check}><input type="checkbox" checked={protection} onChange={e => editPolicy(() => setProtection(e.target.checked))} />Offer card-on-file no-show protection</label>
          {protection && <div className={styles.fieldGrid}><label>Cancellation notice <div className={styles.money}><input aria-label="Cancellation notice in hours" inputMode="numeric" value={notice} onChange={e => editPolicy(() => setNotice(e.target.value))} /><span>hours</span></div></label><label>Maximum late/no-show fee <div className={styles.money}><span aria-hidden="true">$</span><input aria-label="No-show fee in dollars" inputMode="decimal" value={fee} onChange={e => editPolicy(() => setFee(e.target.value))} /></div></label></div>}
        </fieldset>
        {quote && <div className={styles.summary}><div><span>Pay at booking</span><strong data-testid="booking-due-now">{formatPaymentMoney(quote.dueNowCents)}</strong></div><div><span>At the appointment</span><strong data-testid="booking-balance">{formatPaymentMoney(quote.remainingCents)}</strong></div></div>}
        {quote?.saveCardRequired && <label className={styles.check}><input type="checkbox" disabled={booked} checked={agreed} onChange={e => setAgreed(e.target.checked)} />{protection ? `Example client agrees to save a card and authorizes the stated policy, with a fee up to ${formatPaymentMoney(quote.maximumFeeCents)}. This is not real consent.` : "Example client agrees to save a card for the stated appointment-payment purpose. This is not real consent."}</label>}
        {protection && <p className={styles.subtle}>A saved card does not reserve money. A future payment can be declined or need the client to verify it.</p>}
        {accountStage !== "ready" && <p className={styles.subtle}>Finish the fictional account setup in step 1 to preview booking.</p>}
        <Button disabled={!quote || booked || accountStage !== "ready" || (quote.saveCardRequired && !agreed)} onClick={recordBooking}>Prepare example booking</Button>
      </>}
      {step === 2 && <>
        <p>Example client · 60-minute appointment</p>
        <div className={styles.summary}><div><span>Already paid</span><strong>{formatPaymentMoney(paid)}</strong></div><div><span>Still to collect</span><strong data-testid="collection-balance">{formatPaymentMoney(remaining)}</strong></div></div>
        <div className={styles.inset}><Smartphone aria-hidden="true" /><div><strong>Tap to Pay on your phone</strong><p>Uses the Android app and a supported device. A real payment-account connection and device check are required.</p></div></div>
        <Button disabled className={styles.fullButton}>Phone payment unavailable in this preview</Button>
        <p>Other choices will include a secure payment form and an authorized saved card. Processor fields—not AtmoShaper—collect card details.</p>
        <Button variant="success" disabled={!booked || remaining === 0 || feeCollected || waived} onClick={() => { setPaid(priceCents ?? 0); setMessage("Example appointment payment completed locally. No payment request was sent.") }}>Simulate collecting {formatPaymentMoney(remaining)}</Button>
        {!booked && <p className={styles.subtle}>Prepare the example booking first.</p>}
      </>}
      {step === 3 && <>
        <p>Example appointment marked no-show after its grace period. This does not charge the client.</p>
        {policy?.noShowProtection && <p>Accepted policy: {policy.cancelHours} hours&apos; notice · fee up to {formatPaymentMoney(calculatePaymentPortion(priceCents ?? 0, policy.fee))}.</p>}
        <div className={styles.summary}><div><span>Covered by prior payment</span><strong>{formatPaymentMoney(feeReview?.creditCents ?? 0)}</strong></div><div><span>Additional fee to review</span><strong data-testid="additional-fee">{formatPaymentMoney(feeReview?.additionalChargeCents ?? 0)}</strong></div></div>
        <p>{waived ? "Example fee waived. No payment sent." : feeCollected ? "Example fee recorded locally. No payment sent." : feeReview?.reason}</p>
        {!!feeReview?.refundReviewCents && <p className={styles.inset}>Prior payments exceed this fee by {formatPaymentMoney(feeReview.refundReviewCents)}. Review a refund separately; this preview does not refund money.</p>}
        <div className={styles.actions}><Button disabled={!feeReview?.eligible || feeReview.additionalChargeCents === 0 || waived || feeCollected} onClick={() => { if (!feeReview?.eligible) return; setPaid(paid + feeReview.additionalChargeCents); setFeeCollected(true); setMessage("Reviewed example fee recorded once, without a provider request.") }}>Simulate reviewed fee</Button><Button variant="secondary" disabled={!booked || waived || feeCollected} onClick={() => { setWaived(true); setMessage("Example fee waived without a charge.") }}>Waive example fee</Button></div>
      </>}
      {settings.error && <p role="alert" className={styles.error}>{settings.error}</p>}
      <p role="status" className={styles.status}>{message}</p>
    </section>
    <footer className={styles.footer}><Button variant="glow" disabled={step === 0} onClick={() => move(step - 1)}><ArrowLeft aria-hidden="true" />Back</Button><span>{step + 1} of {steps.length}</span><Button variant="cta" disabled={step === 3} onClick={() => move(step + 1)}>Next<ArrowRight aria-hidden="true" /></Button></footer>
  </main>
}
