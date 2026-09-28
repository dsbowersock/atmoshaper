# Supporter v2 Sandbox Catalog Migration Plan

**Goal:** After the buyer-use application contract is reviewed and merged,
create and verify the dedicated AtmoShaper sandbox's six use-classified Products
and twelve recurring Prices without deleting the existing v1 catalog.

**Prerequisite:** The buyer-use runtime PR is merged, Production Supporter
Checkout remains paused, and the exact Stripe sandbox account/mode is reverified.

## Safety boundary

- Sandbox only; no live Stripe, Vercel Production, database, payment, or tax
  registration mutation.
- Do not repurpose the completed v1 migration command or its historical
  idempotency keys.
- Inventory Products, Prices, subscriptions, open Checkout Sessions, Portal
  configurations, and webhook endpoints before any write.
- Preserve every v1 object needed for reconciliation or an existing synthetic
  subscription. New v2 objects get new deterministic idempotency keys.
- Stop on partial/contradictory metadata, unrecognized managed objects, or an
  unexpected subscription.

## Target topology

- Six Products: each combination of support amount (`support-1`, `support-2`,
  `support-5`) and buyer use (`personal`, `business`).
- Personal Products use `txcd_10103000`; business Products use
  `txcd_10103001`.
- Each Product owns one monthly and one annual exclusive USD Price with the
  fixed existing amounts and no trial, quantity transform, tiering, or extra
  currency option.
- Portal switching must not allow a customer to silently change declared use.
  The provider-migration PR must either constrain compatible transitions or
  route use changes back through application Checkout after cancel/end-state;
  this decision requires focused Portal evidence before apply.

## Execution batches

1. Add a new v2 verify/plan/apply command and isolated contract tests.
2. Prove inventory pagination, ownership classification, v1 preservation,
   deterministic creation, post-write rereads, and idempotent reruns.
3. Run verify and plan against the dedicated sandbox and record only sanitized
   counts/statuses.
4. Obtain explicit authorization for the sandbox writes, then apply and rerun
   exact verification.
5. Configure sandbox-only Price variables, Portal/webhook settings, redeploy the
   paused build, and run controlled personal and business synthetic Checkouts.
6. Keep Production paused; live activation requires a separate registration,
   tax, Vercel, deployment, and smoke-test decision.
