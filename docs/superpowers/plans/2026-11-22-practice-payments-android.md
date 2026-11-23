# Implement practice payments and Android AtmoShaper

Owner scope: both processors, appointment collection, prepayment, deposits,
reviewed no-show fees, new-account onboarding, full Android/web experience and
the owner's own Stripe/S24 pilot. Follow the
[accepted specification](../specs/2026-11-22-practice-payments-android.md).

## Delivery sequence and truthful status

1. **Rules and reviewable workflows.** Add provider-independent cents, deposit,
   balance and cancellation/no-show review rules, scoped provider request
   contracts, fictional mobile-first setup/booking/collection/fee-review UI, and
   executable negative/duplicate/scope tests. No active financial route.
2. **Android application foundation.** Reuse the responsive web platform through
   a browser-backed Android launcher. Prepare origin/signing configuration,
   native capabilities, payment availability boundary and build verification.
   No generic JavaScript bridge with payment/credential authority. Confirm build
   tools/licenses separately when absent; do not claim an APK from source alone.
3. **Durable payment service.** Add reviewed additive schema for business-owned
   connections, pinned policy/consent, payment attempts, fee reviews, receipts,
   refunds and provider events. Use database locks/unique constraints before
   dispatch, ownership and feature-key checks on every operation, encrypted
   credentials, anti-CSRF account linking and token refresh. Extend booking only
   after migration/readiness gates pass; never reuse platform Commerce orders.
4. **Provider and native adapters.** Connect new/existing merchants; embedded
   Checkout/SetupIntents and Square Web Payments/Cards, webhook reconciliation,
   original-operation recovery and native SDK server handoff. Add Android Stripe
   and Square SDK screens, runtime eligibility, foreground confirmation and safe
   cancel/resume. Physical taps cannot be replaced by synthetic SDK success.
5. **Isolated acceptance.** Exact sandbox/app registrations, credentials, URLs,
   webhook events and scopes are prepared before requesting provider writes.
   Use synthetic businesses/clients and official test cards. Verify another
   business cannot view/use cards, policies, receipts or native tickets; cover
   CSRF/replayed links, failed/ambiguous responses, partial refunds, double taps,
   stale policies, abandoned bookings and consent withdrawal. No real payments.
6. **Owner pilot and publication.** Substantive Codex/CodeRabbit review through
   final source; hosted checks; approved database/provider/asset-link/deployment
   and signed-app publication. Owner personally completes merchant/bank identity,
   financial agreements and final real transactions under an exact capped plan.
   Use only the owner's merchant, never the salon's Square account. Test the
   S24's actual tap, cancel, declined card, receipt, recovery and app lifecycle.
   Keep web rollback and app rollback/signing recovery. Beta availability stays
   off until these gates and payment terms are satisfied.

## Stop conditions and boundaries

Current milestone: phase 1's pure rules and fictional UI are verified, and phase
2's launcher debug APK is built with approved isolated tools. Native payment
activities/capability verification and the secure handoff remain future work;
phases 3-6 are not complete. See the
[local receipt](../../audits/2026-11-22-practice-payments-android-foundation.md).

- No implicit migration of membership tiers, private identifiers, app billing,
  clinical storage, personal calendar data or other businesses' records.
- No automatic real charge/refund, merchant signup, terms acceptance, API-key
  creation, provider activation, DB migration, app/domain association publication
  or store enrollment from source preparation.
- Report missing native tooling/physical device, provider approvals and actual
  unsupported SDK/device behavior. Do not present a simulated charge as a test
  payment or a browser form as native Tap to Pay.
- For an ambiguous financial result, inspect/reconcile the saved operation;
  never create a new purchase or refund because a request timed out.
- Initial synthetic examples are US/USD. International merchant/currency rollout
  requires explicit capability and policy design rather than blind enablement.

## Evidence to record

Record exact source/checks and local screenshots without secrets or provider
identifiers. Distinguish source-only, simulated provider, real sandbox, staged
artifact, physical device and live pilot evidence. Mirror progress and remaining
gates in project-state/project-log. Plans alone never certify a feature as live.
