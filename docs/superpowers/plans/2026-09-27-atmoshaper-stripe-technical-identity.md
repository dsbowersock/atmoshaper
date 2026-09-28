# AtmoShaper Stripe Technical Identity and Test-Account Readiness Plan

**Goal:** Make the dedicated, empty AtmoShaper Stripe account the next safe migration target without recreating new MassageLab-branded Stripe objects or weakening historical reconciliation.

**Architecture:** Add one Stripe technical-identity contract beside the existing public-product identity. New catalog objects use AtmoShaper metadata and the AtmoShaper production webhook URL; read and reconciliation paths continue to recognize exact legacy MassageLab metadata. Provider creation, Vercel secret/configuration writes, deployment, and Checkout/Portal testing remain a separately authorized execution stage after this code-only branch is reviewed and merged.

**Tech Stack:** Next.js, Node.js ES modules, Stripe Node SDK, Node test runner, Vercel.

**Baseline/Authority Refs:** `docs/project-state.md`, `docs/project-log.md`, `docs/rebrand/atmoshaper-external-account-checklist.md`, `docs/wiki/billing-memberships.md`, `docs/wiki/deployment.md`, merged PR #20 (`5e659560ae801d8765de2b6c1190c5c9c0ddb76d`), and merged PR #21 (`a5ad3d8f19e648bc626af7c1244fcce77d34740e`).

**Compatibility Boundary:** Exact legacy MassageLab Product metadata, one-time-support purpose values, idempotency namespaces, historical Price mappings, database fields, and webhook reconciliation remain readable. This slice changes no Stripe object, subscription, Vercel setting, database row, deployment, payment, or live environment. New provider catalog classification must be AtmoShaper-owned. Mixed metadata is accepted only when both complete schemas agree; partial or contradictory metadata fails closed.

**TDD Route:**
- Mode: off
- Decision: skipped
- Strict authority: not applicable
- Test posture: minimum source change plus focused post-change regression
- Reason: repository instructions do not require strict TDD, and the current behavior is already characterized by focused Stripe contract suites.
- Verification: focused identity/readiness/billing/webhook/migration tests, then typecheck, lint, full Node suite, production build, and diff checks.

## Scope and readiness

### Aegis Visibility

Planning is useful because Stripe metadata and endpoint identity are provider contracts whose retirement and compatibility boundaries must remain explicit before any external write.

### BaselineUsageDraft

- Required baseline refs: current state, current log, external account checklist, billing wiki, deployment wiki, merged PR #20.
- Delivered context refs: the dedicated AtmoShaper test account is connected and currently contains zero Products, Prices, webhook endpoints, Portal configurations, subscriptions, and tax registrations.
- Acknowledged before plan refs: all required refs above.
- Cited in plan refs: all required refs above.
- Missing refs: none for the code-only slice; current Stripe Tax registration authority remains a provider-stage gate.
- Decision: continue.

### Requirement Ready Check

- Requirement source refs: user direction to continue the migration, use AtmoShaper-specific accounts, and leave as few MassageLab remnants as safely possible.
- Goals and scope refs: current snapshot and external-account checklist Stripe rows.
- User / scenario refs: a fresh dedicated AtmoShaper Stripe test account must be configured before controlled Checkout and Portal testing.
- Requirement item refs: primary AtmoShaper catalog metadata, exact AtmoShaper webhook URL, public AtmoShaper one-time-support name, legacy dual-read compatibility, no provider writes in this branch.
- Acceptance / verification criteria refs: existing Stripe readiness, webhook, billing, and migration suites plus full repository gates.
- Open blocker questions: Stripe Tax registration and final provider mutations are intentionally deferred to the separately authorized provider stage.
- Decision: ready.

### Change Necessity

- User-visible need: the dedicated account must show and operate as AtmoShaper.
- No-change / non-code option: creating objects with current `main` would require MassageLab-only metadata and the old webhook URL, so readiness would either fail or perpetuate the wrong identity.
- Why code change is necessary: runtime readiness and the catalog migration owner currently treat MassageLab metadata and `www.massagelab.app` as canonical.
- Minimum change boundary: one shared Stripe identity helper and its direct readiness, migration, billing, webhook, test, environment-example, and operator-document consumers.
- Decision: code-change.

### Existence Check

- Proposed new surface: shared Stripe technical-identity helper.
- Existing owner / reuse candidate: `lib/public-product-identity.js` owns public presentation only and explicitly excludes provider compatibility identifiers.
- Why existing surface is insufficient: provider metadata requires dual-schema validation and retirement semantics that must not leak into public branding.
- Creation proof: readiness, migration, and billing currently duplicate direct metadata-key reads and can drift independently.
- Entropy / retirement impact: the helper reduces duplicated literals; its legacy schema remains until hosted inventory proves retirement safe.
- Decision: add-with-proof.

### Architecture Integrity Lens

- Invariant: new objects are AtmoShaper-owned while historical objects remain reconcilable.
- Canonical owner / contract: `lib/stripe-provider-identity.js` owns metadata schemas; `lib/stripe-webhook-contract.js` owns the endpoint/event/API-version contract.
- Responsibility overlap: remove direct current-schema checks from readiness, migration, and billing; legacy names may remain only in the helper and explicitly historical tests/docs.
- Higher-level simplification: use shared builders/matchers instead of caller-specific fallback logic.
- Retirement / falsifier: remove the legacy schema only after all retained Stripe accounts and persisted references prove no remaining legacy dependencies.
- Verdict: proceed.

### Plan Pressure Test

- Owner / contract / retirement: explicit current owner plus dual-read retirement boundary.
- Architecture integrity / higher-level path: centralized helper prevents three competing metadata authorities.
- Verification scope: focused Stripe suites plus full repository gates.
- Task executability: branch-sized and code-only; provider writes remain outside the branch.
- Pressure result: proceed.

### Plan-Time Complexity Check

- Target files: `lib/stripe-provider-identity.js`, `lib/stripe-readiness.js`, `lib/stripe-billing.js`, `lib/stripe-webhook-contract.js`, `scripts/stripe-supporter-membership-migration.mjs`.
- Existing size / shape signals: the migration script is large and already owns catalog mutation; adding more inline schema logic would increase drift.
- Owner fit: a small dependency-free helper fits all three consumers.
- Add-in-place risk: medium for the migration script, low elsewhere.
- Better file boundary: extract schema construction/classification and keep orchestration in existing owners.
- Recommendation: add owner file, then edit consumers in place.

### Execution Readiness View

- Intent Lock: prepare code for the dedicated AtmoShaper Stripe test account.
- Scope Fence: no provider, Vercel, database, deployment, payment, subscription, DNS, or email mutation.
- Baseline Lock: branch begins at merged `origin/main` `a5ad3d8f19e648bc626af7c1244fcce77d34740e` in its own clean worktree.
- Approved Behavior: AtmoShaper current writes; exact legacy reads; unchanged billing amounts, entitlements, tax codes, event set, API version, and persistence.
- Owner / Contract Constraints: public identity remains separate; Stripe helper owns technical metadata; webhook owner retains exact 15 events.
- Compatibility Boundary: no idempotency, database, historical Price, or legacy one-time-purpose retirement in this slice.
- Retirement Boundary: legacy metadata is retained until post-cutover inventory proves zero dependencies.
- Task Batches: identity helper; consumer migration; endpoint/public copy/docs; validation and PR review.
- Test Obligations: focused and full gates listed below.
- Review Gates: clean diff, exact-head hosted checks, CodeRabbit coverage, no unresolved review threads; merge remains separately authorized.
- Drift / Rewind Rules: stop and rebase/replan if `origin/main` advances with overlapping Stripe changes or if provider inventory is no longer empty.
- Evidence Required Before Completion: exact SHA, clean status, command exits/counts, hosted checks, latest-head review, zero provider mutations.
- Advisory Boundary: this plan does not authorize provider writes, deployment, or merge.

## Task 1: Centralize current and legacy Stripe catalog metadata

**Files:**
- Create `lib/stripe-provider-identity.js`.
- Create `tests/stripe-provider-identity.test.mjs`.

**Why:** New AtmoShaper objects need a canonical technical identity, while historical objects require exact compatibility reads.

**Change Necessity:** Duplicated key literals cannot reliably reject partial/mixed schemas. The minimum repair is a dependency-free helper shared by current consumers.

**Impact/Compatibility:** Builders emit only AtmoShaper keys. Matchers accept a complete current schema, a complete legacy schema, or two complete agreeing schemas; partial and contradictory records fail closed.

**Verification:** `node --test tests/stripe-provider-identity.test.mjs`.

1. Define frozen current and legacy schema descriptors for app, catalog, membership level, amount choice, and Price key.
2. Add builders for current Product and Price metadata that preserve unrelated metadata without copying managed legacy keys into fresh objects.
3. Add exact classifiers/readers for Product and Price metadata with explicit mixed-schema consistency rules.
4. Cover current-only, legacy-only, agreeing dual-schema, partial, contradictory, unrelated-metadata, and malformed-input cases.

## Task 2: Route readiness, billing, and catalog migration through the shared identity

**Files:**
- Modify `lib/stripe-readiness.js`.
- Modify `lib/stripe-billing.js`.
- Modify `scripts/stripe-supporter-membership-migration.mjs`.
- Modify `tests/stripe-readiness.test.mjs`.
- Modify `tests/stripe-billing.test.mjs`.
- Modify `tests/stripe-supporter-membership-migration.test.mjs`.
- Modify `tests/fixtures/stripe-readiness-stripe-stub.mjs`.

**Why:** These are the three current metadata authorities and must agree before the empty account receives any catalog object.

**Change Necessity:** A documentation-only change would leave executable validators and writers on MassageLab-only metadata.

**Impact/Compatibility:** Readiness recognizes exact AtmoShaper and legacy products. Migration writes AtmoShaper metadata for future operations and recognizes legacy objects for recovery. Historical Price IDs, subscription reconciliation, tax semantics, amount topology, and Portal policy remain unchanged.

**Repair Track:** Replace direct managed-metadata access with shared builders/classifiers; preserve unrelated metadata; keep exact fail-closed behavior.

**Retirement Track:** Keep the legacy schema and legacy lookup/idempotency families active. Record their later removal gate rather than deleting them during provider bootstrap.

**Verification:** `node --test tests/stripe-provider-identity.test.mjs tests/stripe-readiness.test.mjs tests/stripe-billing.test.mjs tests/stripe-supporter-membership-migration.test.mjs tests/supporter-membership-final-review.test.mjs`.

1. Update readiness to validate the shared Product classification and current public Product name/tax contract.
2. Update billing Product ownership checks to use the shared classifier.
3. Update migration discovery, verification, repairability, and payload creation to use shared metadata builders/readers.
4. Add regression cases proving current AtmoShaper objects pass, exact legacy objects remain compatible, and mixed contradictions fail.

## Task 3: Point new provider-facing surfaces at AtmoShaper

**Files:**
- Modify `lib/stripe-webhook-contract.js`.
- Modify `lib/stripe-billing.js`.
- Modify `tests/stripe-webhook-contract.test.mjs`.
- Modify `tests/stripe-billing.test.mjs`.
- Modify `.env.example`.
- Modify `docs/wiki/billing-memberships.md`.
- Modify `docs/wiki/deployment.md`.
- Modify `docs/rebrand/atmoshaper-external-account-checklist.md`.
- Modify `docs/project-state.md`.
- Modify `docs/project-log.md`.

**Why:** The dedicated account must send webhooks to AtmoShaper and display AtmoShaper in one-time Checkout.

**Change Necessity:** Stripe endpoint validation and inline Checkout Product copy are executable source contracts, not dashboard-only settings.

**Impact/Compatibility:** Change the pinned URL to `https://www.atmoshaper.com/api/billing/webhook` and derive one-time-support Product copy from public identity. Keep the exact 15 events, API version, one-time purpose, idempotency keys, and historical webhook parsing unchanged.

**Verification:** `node --test tests/stripe-webhook-contract.test.mjs tests/stripe-billing.test.mjs tests/donations.test.mjs tests/membership-webhook-route.test.mjs tests/user-facing-copy.test.mjs`.

1. Update the exact pinned webhook URL and endpoint tests.
2. Replace the inline MassageLab one-time-support Product name with public AtmoShaper identity.
3. Document the fresh-account test-mode sequence and explicitly list retained compatibility identifiers plus their retirement gate.
4. Update current-state and chronological records without including account IDs, object IDs, secrets, or connection strings.

## Task 4: Verify and publish the code-only branch

**Files:** all changed paths above.

**Why:** Provider setup must start only from a reviewed exact head.

**Change Necessity:** No additional source change; this task proves the prior changes.

**Impact/Compatibility:** No external state changes.

**Verification:** Run:

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
git diff --check
git status --short
```

1. Run focused Task 1-3 suites and repair only causally related failures.
2. Run full typecheck, lint, Node suite, and production build.
3. Review the complete diff for secret/private-ID output and unintended legacy retirement.
4. Commit, push, open a reviewer-facing PR, and shepherd exact-head CodeRabbit/hosted checks until clean. Do not merge without fresh authorization.

## Provider stage after this PR

After the reviewed code head is merged, request one exact authorization covering only AtmoShaper test mode: create three Supporter Products and six recurring Prices with current metadata, configure one Customer Portal allowlist, create the exact 15-event AtmoShaper webhook, store test credentials and six Price mappings in Vercel through approved secret management, deploy, and run controlled Checkout/Portal/webhook tests with synthetic data. Tax registration and any live-mode activation remain separate decisions.

## Risks and retirement

- **Cross-schema ambiguity:** partial or contradictory current/legacy metadata must fail closed.
- **Accidental provider mutation:** this branch uses only local tests and read-only inventory.
- **Premature legacy removal:** idempotency, purpose, historical Price, and database identifiers stay until post-cutover inventory proves retirement safe.
- **Tax authority:** an empty test account has no tax registrations; do not attest provider/registration readiness or create a registration without separate evidence and authorization.
- **Rollback:** revert the code-only commit before provider setup. After provider objects exist, rollback must preserve their IDs and webhook secret while restoring the last reviewed app/configuration together.
