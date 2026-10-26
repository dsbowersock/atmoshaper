# Commerce purchase availability implementation plan

> For agentic workers: use Superpowers subagent-driven development (or executing-plans) and Aegis ownership/verification checks. Do not begin until the native checkout binding is verified. This is local source preparation, not provider or publication authority.

Goal: customers should see an unavailable purchase state whenever the existing server configuration would reject that path, while preserving all three intended purchase options, free credits and existing access.

Spec: the existing October23 media/full-commerce readiness plan and original migration charter; the owner explicitly requires recurring Supporter, one-time support and permanent backgrounds. No merge, push, new provider operation, live payment, Production change or Sentry activation is included.

## Baseline and workspace

Source baseline: af5373dee55586d2dc21ca1622231cc4d9c4611d. The native task-owned commerce-purchase-availability worktree and default cwd/Git root were jointly verified clean at that baseline before creating codex/commerce-purchase-availability. Eighteen relevant source owners match the independent audit. Reuse this checkout; preserve separate review/anatomy/diagnostic branches. Archive through the native recoverable lifecycle only after this work is integrated or deliberately abandoned.

Reuse only the matching cached dependencies through an owned ignored junction. No install, download, database, full application build/server, actual Checkout, email, provider, publication, merge, Production or Sentry change. This base's older project-state entries are historical; preserve the independently maintained current migration records rather than overwrite them with this branch's history.

## Approved scope and observable behavior

The owner requires recurring Supporter memberships, one-time support and permanent backgrounds in the finished platform. This bug-fix slice changes only configuration availability for the latter two; it does not remove them from release scope. Customers receive fixed unavailable copy and cannot start a known-disabled paid attempt. Free credits, existing ownership, membership benefits and customization remain usable. Recurring Supporter behavior and all server/build safeguards remain unchanged.

The original migration charter and the existing billing/payment contracts supply the compatibility boundary. Aegis owns scope, canonical readiness ownership and evidence limits; Superpowers supplies reproduction, delegated implementation, separate spec/quality review and final verification. Keep one plan-scoped ledger, not a separate plan for each control.

## Change necessity and ownership

Decision: code-change. A documentation warning cannot stop an enabled control from inviting a Checkout that the existing configuration rejects. The minimum repair projects the existing configuration decision into the existing server-rendered props/context and paid controls. It is not a new global launch-readiness framework.

Support's existing pure getOneTimeSupportTaxReadiness(env).ready owns its five tax attestations; reuse its meaning exactly. It does not promise credential health. Backgrounds need the existing environment-owned conjuncts extracted once from assertBackgroundCommercePurchasingReady into the existing catalog.ts owner; getCommerceTaxReadiness alone covers only tax. Preserve current two nonempty key-presence checks and all other existing conjuncts without adding CLI-only currency/event/scope rules. The assertion still owns request country/catalog/consent and throws the same CommerceError(TAX_NOT_READY), returning the same tax shape.

Ripple boundary: server readiness producer, SSR boolean projection and existing paid-action consumers. No entitlement, persisted schema, guest storage, snapshot API, auth, compatibility ID or provider configuration changes. Configuration booleans never establish final deployed health or release approval. Keep server/build checks authoritative and fail closed if the client prop is missing/nonboolean. Do not expose configuration reasons, keys, values or tax details.

Verification follows Superpowers' bug-reproduction-before-repair workflow and Aegis' scoped evidence review: reproduce unavailable controls/requests, make the minimum change, verify the positive and negative cases below. No broad test or timeout changes. The tests must use actual components/production guards, not copied fixture conditions.

## Task 1: reuse canonical readiness owners

- [x] Read current lib/stripe-readiness.js, lib/commerce/catalog.ts and lib/stripe-billing.js completely around the readiness functions; confirm source matches the audit before edits.
- [x] Add pure getBackgroundCommercePurchaseReadiness(env) in existing catalog.ts, returning { ready:boolean, tax:CommerceTaxReadiness }. Extract only the exact existing environment conjuncts. No private configuration values leave this function.
- [x] Reuse the helper in assertBackgroundCommercePurchasingReady, preserving request-specific guards, exception code and successful return.
- [x] Extend existing background-checkout pure tests: each missing/invalid conjunct is false; complete fixture true; request-country/catalog/consent failures still reject with original code after configuration passes.
- [x] Add named test:commerce-purchase-domain and lint:commerce-purchase-domain scripts for tests/background-checkout.test.mjs and the changed domain files if no equivalent commands exist. Run only the focused source tests/lint. Independent task review verifies exact conjunct equivalence and no readiness weakening.

## Task 2: project availability to the existing controls

- [x] app/pricing/page.tsx supplies required checkoutAvailable:boolean from existing support readiness to DonationCheckoutForm. Unavailable displays fixed copy, disables amount/attempt controls and guards submit before storage/native submission. Preserve ready amounts, consent, notices, idempotency and native form action.
- [x] app/layout.tsx passes only backgroundPurchasesAvailable:boolean through components/layout-wrapper.tsx to BackgroundCommerceProvider. Expose it via existing context; missing/nonboolean means false. No state-route, snapshot or account-preferences change.
- [x] Provider startCheckout rejects unavailable attempts before queuing/fetching. Leave credit redemption, cart maintenance, cancellation, ownership and membership access unchanged.
- [x] A paid operation queued while ready must recheck latest committed availability before its paid fetch. Keep availability updates separate from owner-generation cleanup so disabling purchases does not cancel free-credit/cart/cancellation work.
- [x] BackgroundAcquisitionDialog disables paid Buy only, preserving credit confirmation/redemption and existing access/customization. Adjust zero-credit guidance without suggesting an unavailable purchase.
- [x] BackgroundCommerceCart preserves visible cart/removal/reservation cancellation while disabling checkout-oriented actions. BackgroundCheckoutReview disables and directly guards submission, preserving legal documents and consent.
- [x] Fixed public copy: One-time support is temporarily unavailable. / Background purchases are temporarily unavailable. No implementation or tax-setup details in customer flows.
- [x] Use semantic disabled controls; unavailable anchors must not navigate (aria-disabled alone is insufficient). Keep membership, policy, cart-removal and reservation-cancel navigation/actions usable. Distinguish unavailable cursor/feedback from an in-progress Checkout without changing the ready layout.
- [x] Extend actual inert UI/provider/source-wiring tests: unavailable support makes0storage/native submissions; unavailable background makes0fetches even with consent; ready restores current actions; unavailable plus2credits still permits credit redemption; owned/subscriber selection/customization works; guest/account receive SSR boolean; layout-wrapper-provider real guard wiring is covered.
- [x] Keep the full-app Browser-QA provider environment inert. Its existing commerce cases currently assume purchases are enabled despite disabled server configuration; adapt those expectations to the real unavailable state and seed existing cart fixtures where cart persistence, removal or cancellation is the behavior under test. Preserve ready purchase/duplicate-submit coverage in actual inert component/provider tests. Do not skip cases, enable provider flags, inject a production test bypass, change snapshots/APIs or claim full-app browser acceptance from source checks.
- [x] Run focused donations, background-checkout, background-commerce-provider and background-checkout-surfaces named scripts plus changed-source lint/typecheck if cached. Do not replace meaningful assertions with source-only string matches.
- [ ] Independent task review checks specification and code quality, then a broad whole-branch review checks all affected surfaces. Fix only valid findings and retain red/green evidence. Root owns staging/commits.

## Done for this source slice

Unavailable controls and direct handlers reject before attempt side effects; ready behavior and all existing server/build gates remain; free credits and existing access remain; meaningful positive/negative checks pass; docs/JSDoc explain non-obvious readiness semantics. Source remains local/unpublished until a concrete reviewable publication request is authorized. This does not close deployed three-option acceptance, tax/legal/rights approval, webhook/reconciliation/reversal acceptance, the account/admin runtime gate or final launch.
