# Supporter Buyer-Use Classification Plan

**Goal:** Let each prospective AtmoShaper Supporter identify whether the membership will be used personally or for business before Stripe Checkout, then route the request to a price whose Product carries the matching Stripe Tax code.

**Architecture:** Extend the existing fixed Supporter catalog contract with one required `supporterUse` dimension. The browser submits the selection, the server validates it, the environment resolver selects a classification-specific Price, and Checkout records the normalized selection as metadata. Stripe remains the authority for tax calculation after the operator has an active registration; application readiness continues to fail closed until then.

**Tech Stack:** Next.js 16, React 19, Node test runner, Stripe Billing/Checkout/Tax, Vercel environment configuration.

**Baseline/Authority Refs:** `docs/project-state.md`, `docs/project-log.md`, `docs/wiki/index.md`, `docs/wiki/billing-memberships.md`, `lib/membership.js`, `lib/membership-checkout.js`, `lib/stripe-price-contract.js`, `lib/stripe-readiness.js`, `lib/stripe-billing.js`, `scripts/stripe-supporter-membership-migration.mjs`, and Stripe's product tax-code guidance for mixed personal/business SaaS.

**Compatibility Boundary:** Existing subscriptions, historical prices, webhook reconciliation, customer records, database rows, and private idempotency namespaces remain readable. The six current generic-code Prices are not offered for new Checkout after cutover, but remain valid reconciliation inputs. No registration is created, no live Stripe object is changed, and Automatic Tax remains disabled until an active registration and the existing explicit readiness gates are confirmed.

**TDD Route:**
- Mode: off
- Decision: skipped
- Strict authority: not applicable
- Test posture: focused post-change contract and regression coverage
- Reason: the user did not request strict TDD; the existing Node suites provide direct producer/consumer regression coverage.
- Verification: targeted membership, Checkout, pricing UI, readiness, migration, billing, repository-audit, lint, typecheck, and build checks.

## Requirement Ready Check

- Requirement source refs: user decision that the customer should choose; Stripe guidance for mixed-use SaaS.
- Goals and scope refs: required personal/business choice before Checkout; identical price and entitlements.
- User/scenario refs: a buyer may use AtmoShaper personally or in a business and chooses the intended use for the subscription being purchased.
- Requirement item refs: exact codes `txcd_10103000` (personal) and `txcd_10103001` (business); server-side validation; fail-closed configuration.
- Acceptance/verification criteria refs: invalid or missing choices cannot reach Stripe; each valid choice resolves only its own catalog; Checkout metadata records the choice; legacy subscriptions still reconcile.
- Open blocker questions: none for code and sandbox catalog preparation. Live activation remains blocked on actual tax registration status.
- Decision: ready.

## Change Necessity

- User-visible need: the buyer, not the operator, identifies personal or business use.
- No-change/config-only option: one generic Product cannot represent two customer-dependent Stripe Tax codes, and configuration alone cannot collect or validate the buyer's choice.
- Why code change is necessary: the choice must cross the public form, server validation, price resolver, Checkout metadata, and catalog-readiness boundary.
- Minimum change boundary: existing membership/catalog owners and their focused tests; no database schema change.
- Decision: code-change.

## Files and Ownership

- `lib/supporter-use.js` (new): canonical personal/business values, labels, and exact tax codes.
- `lib/membership.js`: validated selection and classification-specific environment-key/Price resolution; legacy Price compatibility.
- `components/membership/pricing-cards.tsx`: required buyer-use radio choice in each actionable Checkout form.
- `lib/membership-checkout.js`: request parsing, fail-closed validation, resolver forwarding, and Checkout forwarding.
- `lib/stripe-price-contract.js`: twelve target Price slots and six classification-specific Product identities.
- `lib/stripe-provider-identity.js`: metadata identity includes amount choice plus use class without accepting partial or conflicting schemas.
- `lib/stripe-readiness.js`: validate each Product against its expected use-specific name and tax code; topology becomes one Product per amount/use pair.
- `lib/stripe-billing.js`: require normalized use, prevent incompatible open-Session reuse, and stamp Session/subscription metadata.
- `lib/membership-pricing.js`: advertise an amount/interval only when both use-specific Prices are configured and readable, while displaying one shared amount.
- `scripts/stripe-supporter-membership-migration.mjs` and its contract: preserve the already-run v1 migration as a replay-verifiable historical tool while publishing the v2 twelve-Price target contract for a separate provider-migration follow-up.
- `scripts/browser-qa-environment.mjs`, deployment docs, project state/log/wiki: document the new environment contract and the activation boundary.
- Focused tests under `tests/`: producer, consumer, UI, readiness, migration, billing, source guard, and compatibility coverage.

## Complexity and Architecture Integrity

- Canonical contract: `lib/supporter-use.js` owns use values and codes; `lib/stripe-price-contract.js` owns catalog expansion; callers do not duplicate strings.
- Owner fit: parsing stays in `membership-checkout`; resolution stays in `membership`; provider semantics stay in readiness/migration modules.
- Current pressure: `lib/stripe-billing.js` and the migration script are already large. Changes there must be wiring and exact contract adaptation only; no new unrelated responsibilities.
- Better boundary: add the small canonical use module rather than duplicating use/code mappings across UI, runtime, and migration.
- Retirement: old six Price environment keys become reconciliation-only compatibility inputs. Removal requires proof that no live or historical record references them.

## Task 1 — Canonical use and runtime selection

1. Add the canonical use values, labels, and exact tax codes.
2. Expand membership selection validation and environment-key derivation.
3. Keep legacy six-key Price normalization separate from new-Checkout resolution.
4. Update membership unit tests for valid, invalid, missing, and tampered input.

Verification: `node --test tests/membership.test.mjs`.

## Task 2 — Browser and Checkout boundary

1. Add a required personal/business radio group to each enabled signed-in Checkout form with plain-language copy that states price and features are unchanged.
2. Parse and validate `supporterUse` for form and JSON requests.
3. Forward the normalized value into Price resolution and Checkout creation.
4. Add UI and route tests proving missing/invalid values fail before customer, legal-write, database, or Stripe work.

Verification: `node --test tests/membership-pricing-cards.test.mjs tests/membership-checkout-route.test.mjs`.

## Task 3 — Stripe runtime contract and compatibility

1. Increment the Checkout contract version so old open Sessions are not reused under the new classification contract.
2. Require the requested use to match the configured Price record.
3. Stamp use on Checkout Session and subscription metadata.
4. Include use in current-session matching while continuing to normalize old completed subscriptions by Price ID.
5. Add focused billing tests for personal/business routing, cross-use rejection, metadata, reuse, and legacy reconciliation.

Verification: `node --test tests/stripe-billing.test.mjs tests/membership-webhook-service.test.mjs`.

## Task 4 — Catalog, readiness, and migration

1. Expand the target contract to six amount/use Products and twelve recurring Prices.
2. Validate Product name, amount choice, use metadata, exact tax code, and one monthly plus one annual Price per Product.
3. Preserve the historical v1 migration planner/apply path and its exact six-Price contract so its completed state remains replay-verifiable.
4. Preserve the current generic-code catalog as inactive-for-new-Checkout compatibility data; do not delete it.
5. Prepare a separate reviewed v2 provider-migration plan for six Products, twelve Prices, Portal compatibility, and idempotent sandbox application; do not overload the historical v1 command in this branch.
6. Add readiness regression tests for partial catalogs, wrong-use codes, cross-linked Products, legacy records, and current-contract topology.

Verification: `node --test tests/stripe-readiness.test.mjs tests/stripe-supporter-membership-migration.test.mjs tests/stripe-provider-identity.test.mjs tests/supporter-membership-final-review.test.mjs`.

## Task 5 — Documentation and full validation

1. Update environment examples, deployment guidance, billing wiki, project state, and chronological project log.
2. State that customer use changes tax classification only, never price or entitlement.
3. Record that no registration exists and Checkout remains paused/Automatic Tax disabled.
4. Run focused suites, repository audit, lint, typecheck, and production build.
5. Review the diff for secrets, accidental provider values, user asset overlap, and unowned changes.

Verification:

```text
npm run test
npm run lint
npm run typecheck
npm run build
git diff --check
git status --short
```

## Execution Readiness View

- Intent Lock: collect the buyer's intended personal/business use and route to the matching tax-classified catalog.
- Scope Fence: Supporter recurring membership only; one-time support and permanent backgrounds do not inherit this decision.
- Baseline Lock: start from merged `origin/main` at `fe66328` in the isolated worktree.
- Approved Behavior: required use choice, identical public benefits/amounts, exact two-code routing.
- Owner/Contract Constraints: no database schema; no request-controlled tax code; constants and configured Price identities are authoritative.
- Compatibility Boundary: legacy prices and subscriptions remain readable, but legacy prices are not new-Checkout targets.
- Retirement Boundary: do not remove old identifiers until provider inventory proves they are unreferenced.
- Task Batches: runtime/UI; Stripe runtime; migration/readiness; docs/full validation.
- Test Obligations: producer/consumer coverage plus Checkout security and compatibility regression.
- Review Gates: focused self-review, hosted checks, CodeRabbit on latest head, then user merge review.
- Drift/Rewind Rules: stop if Stripe Product topology or Portal behavior cannot preserve existing subscriptions, or if an active registration assumption appears.
- Evidence Required Before Completion: clean isolated worktree, passing required checks, no unresolved actionable review comments, and no provider mutation beyond separately authorized sandbox preparation.
- Advisory Boundary: this plan does not authorize live activation, a tax registration, deployment, or merge.

## Risks and Rollback

- Misclassification risk: only the two canonical values are accepted; request input never supplies a tax code.
- Partial configuration risk: a displayed amount is unavailable unless both use-specific Prices are valid.
- Compatibility risk: current generic-code Price IDs stay in reconciliation-only normalization until inventory proves retirement is safe.
- Provider drift risk: migration verification re-retrieves Product/Price/Portal state after writes and remains sandbox-only.
- Rollback: keep Checkout paused, revert the code PR, and leave newly created sandbox objects inactive/unreferenced; no live customer is affected.
