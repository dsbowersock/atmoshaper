import assert from "node:assert/strict"
import test from "node:test"
import { parseMoneyCents, calculatePaymentPortion, quoteBookingPayment, paymentPolicyKey,
  summarizeAppointmentPayments, reviewNoShowFee, mayStartPaymentAttempt } from "../lib/practice-payments/domain.js"
import { buildSavedCardCharge, stripeMerchantConfiguration, paymentConnectionState, phonePaymentAvailability } from "../lib/practice-payments/provider-contracts.js"

const policy = { version: "example-v1", mode: "deposit", deposit: { kind: "fixed", value: 2500 },
  noShowProtection: true, fee: { kind: "percent", value: 5000 }, cancelHours: 24, graceMinutes: 15 }
const appointment = { id: "example-appointment", practiceId: "example-business", clientRef: "example-client",
  merchantRef: "acct_example", provider: "stripe", totalCents: 10000, startsAt: "2030-01-02T15:00:00Z", status: "NO_SHOW" }
const consent = { practiceId: appointment.practiceId, appointmentId: appointment.id, merchantRef: appointment.merchantRef,
  provider: "stripe", policyVersion: policy.version, policyKey: paymentPolicyKey(policy), authorizesFee: true, acceptedAt: "2030-01-01T10:00:00Z" }
const savedCard = { practiceId: appointment.practiceId, merchantRef: appointment.merchantRef, clientRef: appointment.clientRef, provider: "stripe", active: true }
const receipt = { id: "example-deposit", practiceId: appointment.practiceId, appointmentId: appointment.id,
  merchantRef: appointment.merchantRef, provider: "stripe", currency: "USD", amountCents: 2500, refundedCents: 0, verified: true, status: "SUCCEEDED" }
const review = changes => reviewNoShowFee({ appointment, policy, consent, savedCard, records: [receipt], now: "2030-01-02T15:20:00Z", ...changes })

test("money rejects lost precision and accepts exact integer cents", () => {
  for (const [input, expected] of [["0", 0], ["0.01", 1], ["19.9", 1990], ["999999.99", 99999999], [" 1.20 ", 120]]) assert.equal(parseMoneyCents(input), expected)
  for (const input of ["", "1e3", "-1", "1.001", "Infinity", "1,000", ".50", "1000000", "1.", "NaN", 2]) assert.throws(() => parseMoneyCents(input))
})

test("basis points round half cents up and fixed deposits cannot exceed service price", () => {
  assert.equal(calculatePaymentPortion(9999, { kind: "percent", value: 5000 }), 5000)
  assert.equal(calculatePaymentPortion(10000, { kind: "fixed", value: 20000 }), 10000)
  for (const rule of [{kind:"percent",value:10001},{kind:"percent",value:0},{kind:"fixed",value:1.5},{kind:"unknown",value:1}]) assert.throws(() => calculatePaymentPortion(10000, rule))
})

test("the four booking requirements keep deposits, card saving and prepayment distinct", () => {
  assert.deepEqual(quoteBookingPayment(10000, policy), { totalCents:10000,dueNowCents:2500,remainingCents:7500,saveCardRequired:true,maximumFeeCents:5000,reservesFunds:false })
  assert.equal(quoteBookingPayment(10000, {...policy,mode:"full"}).dueNowCents, 10000)
  assert.equal(quoteBookingPayment(10000, {...policy,mode:"card"}).dueNowCents, 0)
  const none=quoteBookingPayment(10000, {...policy,mode:"none",noShowProtection:false})
  assert.equal(none.saveCardRequired,false);assert.equal(none.dueNowCents,0)
  assert.throws(()=>quoteBookingPayment(1,{...policy,deposit:{kind:"percent",value:1}}),/one cent/)
})

test("a deposit is credited once against the accepted no-show fee", () => {
  assert.deepEqual(review(), { eligible:true, reason:"Review the amount and accepted policy, then choose whether to charge or waive.", feeCents:5000,additionalChargeCents:2500,creditCents:2500,refundReviewCents:0 })
})

test("a full prepayment does not add another fee and exposes excess for separate refund review", () => {
  const value=review({records:[{...receipt,amountCents:10000}]})
  assert.equal(value.additionalChargeCents,0);assert.equal(value.refundReviewCents,5000)
  assert.equal(review({records:[{...receipt,amountCents:10000}],savedCard:null}).eligible,true)
})

test("settled partial refunds restore only the appropriate remaining fee", () => {
  assert.equal(review({records:[{...receipt,refundedCents:1000}]}).additionalChargeCents,3500)
})

for (const status of ["PENDING","UNKNOWN","DISPUTED"]) test(`${status} blocks additional fee dispatch`,()=> {
  assert.equal(review({records:[{...receipt,status}]}).eligible,false)
})

test("late cancellation is strict at the deadline and no-show grace is respected",()=> {
  assert.equal(review({now:"2030-01-02T15:14:59Z"}).eligible,false)
  assert.equal(review({now:"2030-01-02T15:15:00Z"}).eligible,true)
  assert.equal(review({appointment:{...appointment,status:"CANCELED",canceledAt:"2030-01-01T15:00:00Z"}}).eligible,false)
  assert.equal(review({appointment:{...appointment,status:"CANCELED",canceledAt:"2030-01-01T15:00:01Z"}}).eligible,true)
  assert.equal(review({appointment:{...appointment,status:"CONFIRMED"}}).eligible,false)
  assert.equal(review({appointment:{...appointment,status:"CANCELED",canceledAt:"2031-01-01T00:00:00Z"}}).eligible,false)
})

test("edited policy facts cannot reuse consent even if a version string is reused",()=> {
  for (const patch of [{fee:{kind:"fixed",value:6000}},{cancelHours:48},{graceMinutes:0},{mode:"full"}]) assert.equal(review({policy:{...policy,...patch}}).eligible,false)
})

test("missing, revoked, late and cross-business consent cannot authorize a fee",()=> {
  for (const value of [null,{...consent,revokedAt:"2030-01-01T12:00:00Z"},{...consent,acceptedAt:"2030-01-02T15:05:00Z"},
    {...consent,practiceId:"other"},{...consent,appointmentId:"other"},{...consent,merchantRef:"acct_other"},
    {...consent,provider:"square"},{...consent,authorizesFee:false}]) assert.equal(review({consent:value}).eligible,false)
})

test("saved cards are isolated by business, merchant, client and processor",()=> {
  for (const patch of [{practiceId:"other"},{merchantRef:"acct_other"},{clientRef:"other"},{provider:"square"},{active:false}]) assert.equal(review({savedCard:{...savedCard,...patch}}).eligible,false)
})

test("ledger refuses duplicate, unverified, foreign and impossible financial records",()=> {
  const summarize=records=>summarizeAppointmentPayments({practiceId:appointment.practiceId,appointmentId:appointment.id,merchantRef:appointment.merchantRef,provider:"stripe",records})
  assert.equal(summarize([receipt]).netPaidCents,2500)
  for(const patch of [{practiceId:"other"},{appointmentId:"other"},{merchantRef:"acct_other"},{provider:"square"},{currency:"CAD"},{verified:false},{status:"MADE_UP"},{refundedCents:2501},{amountCents:1.2}]) assert.throws(()=>summarize([{...receipt,...patch}]))
  assert.throws(()=>summarize([receipt,receipt]))
})

test("unknown/successful original operations cannot create replacement attempts",()=> {
  assert.equal(mayStartPaymentAttempt([]),true)
  assert.equal(mayStartPaymentAttempt([{status:"FAILED"},{status:"CANCELED"}]),true)
  for(const status of ["UNKNOWN","PENDING","SUCCEEDED"]) assert.equal(mayStartPaymentAttempt([{status}]),false)
  assert.throws(()=>mayStartPaymentAttempt([{status:"UNRECOGNIZED"}]))
})

function chargeFixture(provider="stripe") {
  const merchantRef=provider==="stripe"?"acct_example":"EXAMPLE_SELLER"
  const connection={id:"example-connection",practiceId:"example-business",provider,merchantRef,locationRef:"EXAMPLE_LOCATION",status:"READY",capabilityVerified:true,environment:"sandbox"}
  const operation={id:"example-operation",practiceId:connection.practiceId,connectionRef:connection.id,merchantRef,provider,environment:"sandbox",currency:"USD",amountCents:2500,purpose:"NO_SHOW",reviewConfirmed:true,reviewRef:"example-review",clientRef:"example-client",dispatchState:"RESERVED"}
  const source={provider,practiceId:connection.practiceId,merchantRef,clientRef:operation.clientRef,paymentMethodRef:provider==="stripe"?"pm_example":"ccof:example",customerRef:"customer_example",active:true,authorizesFee:true,authorizesAppointment:true,usage:"off_session"}
  return {connection,operation,source}
}

for(const provider of ["stripe","square"]) test(`${provider} saved-card contract uses the merchant and original idempotency key only`,()=> {
  const f=chargeFixture(provider),value=buildSavedCardCharge(f)
  assert.equal(value.body.amount??value.body.amount_money.amount,2500)
  assert.equal(value.headers?.["Idempotency-Key"]??value.body.idempotency_key,f.operation.id)
  if(provider==="stripe") assert.equal(value.headers["Stripe-Account"],f.connection.merchantRef)
  else {assert.equal(value.credentialOwner,f.connection.merchantRef);assert.equal(value.body.location_id,"EXAMPLE_LOCATION")}
  const serialized=JSON.stringify(value)
  for(const prohibited of ["transfer_data","application_fee","on_behalf_of","notes","diagnosis"]) assert.ok(!serialized.includes(prohibited))
  for(const [field,patch] of [["operation",{practiceId:"other"}],["operation",{environment:"live"}],["operation",{connectionRef:"other"}],
    ["operation",{merchantRef:"other"}],["operation",{amountCents:0}],["operation",{reviewConfirmed:false}],
    ["operation",{dispatchState:"UNKNOWN"}],["source",{clientRef:"other"}],["source",{usage:"on_session"}],
    ["source",{authorizesFee:false}],["source",{active:false}],["source",{revokedAt:"2030-01-01T00:00:00Z"}],
    ["operation",{clientRef:undefined}],["connection",{practiceId:undefined}],["connection",{id:undefined}],
    ["connection",{status:"SETUP_REQUIRED"}]]) assert.throws(()=>buildSavedCardCharge({...f,[field]:{...f[field],...patch}}))
})

test("new Stripe merchant contract assigns fees/losses to Stripe, without personal or banking data",()=> {
  const value=stripeMerchantConfiguration()
  assert.equal(value.dashboard,"full")
  assert.deepEqual(value.defaults.responsibilities,{fees_collector:"stripe",losses_collector:"stripe"})
  assert.equal(value.configuration.merchant.capabilities.card_payments.requested,true)
})

test("setup return and pending/revoked evidence do not mark an account ready",()=> {
  const f={provider:"square",expectedMerchantRef:"example",evidence:{provider:"square",merchantRef:"example",verified:true,cardPaymentsActive:true}}
  assert.equal(paymentConnectionState(f),"READY")
  assert.equal(paymentConnectionState({...f,evidence:null}),"NOT_CONNECTED")
  assert.equal(paymentConnectionState({...f,evidence:{...f.evidence,cardPaymentsActive:false}}),"SETUP_REQUIRED")
  assert.equal(paymentConnectionState({...f,evidence:{...f.evidence,merchantRef:"other"}}),"NEEDS_REVIEW")
  assert.equal(paymentConnectionState({...f,evidence:{...f.evidence,revoked:true}}),"DISCONNECTED")
  for (const missing of [undefined, "", "   "]) {
    assert.equal(paymentConnectionState({...f,expectedMerchantRef:missing,evidence:{...f.evidence,merchantRef:missing}}),"NEEDS_REVIEW")
  }
})

test("web NFC and an assumed S24 model never substitute for native SDK eligibility",()=> {
  const f={provider:"stripe",platform:"android",nativeSdkReady:true,deviceEligible:true,merchantReady:true}
  assert.equal(phonePaymentAvailability(f).available,true)
  for(const patch of [{platform:"web"},{nativeSdkReady:false},{deviceEligible:undefined},{deviceEligible:false},{merchantReady:false}]) assert.equal(phonePaymentAvailability({...f,...patch}).available,false)
})
