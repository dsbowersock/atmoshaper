# AtmoShaper Live Stripe Cutover

## Goal

Prepare a reviewed, fail-closed live-mode Stripe rollout for the dedicated AtmoShaper account while public registration and Checkout remain paused. The first branch is code and documentation only: it must not create or change live Stripe objects, Vercel configuration, database rows, deployments, tax registrations, payments, subscriptions, DNS, or email-provider state.

## Starting State

- Stripe sandbox v2 is accepted: six Products, twelve recurring Prices, separate personal and business Portal configurations, the exact test webhook, Ohio sandbox tax registration, and controlled Checkout/Portal/webhook/database testing are complete.
- The dedicated AtmoShaper live account is expected to begin without the retained v1 sandbox catalog. Live and sandbox Stripe objects are separate.
- Registration and Checkout remain paused in Production.
- The existing sandbox migrator intentionally requires the retained v1 three-Product/six-Price catalog and must keep that behavior.
- `scripts/stripe-supporter-v2-sandbox-catalog-migration.mjs` is already large. New live capabilities should be composed from extracted shared contracts instead of being added directly to that orchestrator.

## Architecture

1. Extract immutable v2 Product, Price, Portal, metadata, and idempotency contracts into a focused shared module.
2. Preserve the existing sandbox orchestrator and its retained-v1 transition rules.
3. Add a separate live orchestrator that supports a dedicated empty live account and rejects test keys, the wrong account, test-mode objects, conflicting lookup keys or metadata, nonterminal subscriptions, and open Checkout Sessions.
4. Keep live webhook creation and webhook-secret transfer outside the catalog migrator. The live planner verifies the required endpoint and event set without printing secrets.
5. Require an explicit process-only confirmation for any future apply run. Plan and verify modes remain read-only.
6. Reuse the repository's central Stripe API version and established fail-closed classifiers.

## Compatibility

- Do not rename or remove existing `massagelab_*` reconciliation inputs in this branch.
- Do not change sandbox object identities, Portal behavior, readiness semantics, or accepted migration receipts.
- Do not combine dependency upgrades or unrelated cleanup with this cutover slice.
- Keep personal and business buyer-use catalogs isolated and preserve the customer-selected use classification.

## Implementation Sequence

1. Add focused regression tests that lock the existing sandbox contract before extraction.
2. Extract shared v2 catalog and Portal contract helpers without changing sandbox behavior.
3. Add a live-mode planner/verifier CLI and package script with explicit account and mode gates.
4. Cover live-key rejection/acceptance, account mismatch, empty-account planning, existing-object conflicts, lookup-key collisions, subscription/session blockers, webhook drift, idempotent retrieval, Portal API omissions, and apply-confirmation handling.
5. Document only variable names and operator steps; never commit account identifiers, keys, webhook secrets, deployment identifiers, or provider object IDs.
6. Run focused tests, lint, typecheck, diff checks, and the broader relevant suite before opening a review PR.
7. Shepherd the code-only PR through exact-head Codex and CodeRabbit reviews before any live execution.

## Provider Cutover After Code Review

1. Request fresh authorization and create the exact live webhook dependency, then store its signing secret securely without exposing it in logs or documentation.
2. Load the live restricted key through the approved secure local mechanism and run the reviewed command in read-only plan mode.
3. Verify the dedicated account identity, empty/conflict-free live catalog, zero nonterminal subscriptions, zero open Checkout Sessions, live Portal prerequisites, and live webhook readiness.
4. Establish an exclusive catalog-writer window, rerun the read-only plan, and request fresh authorization for its exact writes. Stop if any Product, Price, lookup-key, or Portal state changes between the final plan and apply.
5. Create the live Products, Prices, and managed Portal configurations with the reviewed migrator, then verify the resulting inventory.
6. Configure live catalog IDs and restricted keys in Vercel while registration and Checkout remain paused, then redeploy.
7. Configure and verify the AtmoShaper live tax registration separately. The MassageLab account's settings may guide the choice, but its Stripe registration object is not reusable.
8. Run final readiness, then request separate authorization for one controlled live transaction and refund.
9. Open registration and Checkout only after all live readiness and cleanup gates pass.

## Validation and Evidence

- Focused sandbox migration tests remain green after extraction.
- New live planner tests prove all write boundaries and fail-closed conditions.
- Lint, typecheck, diff checks, relevant full tests, hosted CI, exact-head Codex review, and exact-head CodeRabbit review are green.
- The final cutover receipt records only non-secret object identities and outcomes in canonical project documentation.
- No readiness claim is made from local tests alone; hosted Stripe, Vercel, database, and deployment state must be rechecked at each provider boundary.

## Test Posture

- Mode: off
- Decision: skipped
- Reason: this migration continues an existing reviewed Stripe integration; focused regression tests will be added alongside each extracted or new contract.

## Retirement

- Retain the live bootstrap command until post-launch reconciliation proves the live catalog and Portal configurations stable.
- Remove apply confirmation from the process environment after the authorized run.
- Retain the sandbox migrator for incident reproduction and acceptance testing.
- Retire legacy compatibility identifiers only in a separate reviewed migration after live inventory proves they are no longer needed.
