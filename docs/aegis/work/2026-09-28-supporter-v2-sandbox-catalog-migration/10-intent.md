# Supporter v2 Sandbox Catalog Migration Intent

Requested outcome: continue the AtmoShaper migration after PR #23 by preparing a reviewed, replay-safe Stripe sandbox migration for the six buyer-use Products and twelve recurring Prices.

Scope: a new v2 sandbox verify/plan/apply command, isolated contract tests, safe operator output, current documentation, and a review-ready code branch.

Non-goals: live Stripe changes, sandbox writes before explicit apply authorization, Vercel or database mutation, tax registration, deployment, real payment activity, or removal of the existing v1 catalog.

Risk hints: wrong Stripe account or mode, partial pagination, metadata collisions, duplicate catalog objects, silent buyer-use changes through Customer Portal, non-idempotent creation, and loss of v1 reconciliation evidence.

BaselineReadSetHint: `docs/project-state.md`, `docs/project-log.md`, `docs/wiki/index.md`, `docs/wiki/billing-memberships.md`, `docs/superpowers/plans/2026-09-27-supporter-v2-sandbox-catalog-migration.md`, the merged buyer-use contract modules, the retained v1 migration command, and current read-only Stripe/Vercel inventory.

BaselineUsageDraft:
- Required: all refs above.
- Acknowledged: canonical project docs, parent plans, merged Stripe modules, retained v1 migration, and sanitized provider inventories.
- Cited: `docs/superpowers/plans/2026-09-27-supporter-v2-sandbox-catalog-migration.md`.
- Missing: no code-preparation baseline; actual sandbox apply remains separately gated.
- Decision: continue.

ImpactStatementDraft: add a dedicated v2 provider-migration owner and tests without modifying runtime billing, the historical v1 command, provider state, deployments, or the database.

TDD Route:
- Mode: off.
- Decision: skipped because strict TDD was not requested.
- Test posture: focused contract and regression coverage alongside implementation.

Change Necessity:
- User-visible need: create the personal/business Supporter catalog safely and repeatably.
- No-code option: manual dashboard edits cannot prove full inventory, deterministic recovery, v1 preservation, or idempotent reruns.
- Minimum boundary: one new v2 migration owner, one focused test owner, package command, and operator documentation.
- Decision: code-change.

Execution Readiness View: the parent v2 migration plan owns the scope fence, compatibility boundary, task batches, review gates, and provider-write pause.
