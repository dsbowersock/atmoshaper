# Supporter Buyer-Use Classification Intent

Requested outcome: require each new Supporter buyer to choose personal or business use before Checkout and route that choice to the matching Stripe Tax-classified catalog without changing price or entitlements.

Scope: the recurring Supporter membership UI, request contract, Price resolution, Checkout metadata, readiness verification, sandbox catalog migration, documentation, and tests.

Non-goals: live Stripe changes, a tax registration, Automatic Tax activation, a production deployment, a database schema change, one-time support, permanent-background commerce, or retirement of historical Price IDs.

Risk hints: tax misclassification, partial environment configuration, open-Session reuse across classifications, Portal topology drift, and accidental loss of legacy reconciliation.

BaselineReadSetHint: `docs/project-state.md`, `docs/project-log.md`, `docs/wiki/index.md`, `docs/wiki/billing-memberships.md`, the existing Stripe membership contract modules, and the parent plan.

BaselineUsageDraft:
- Required: all refs above.
- Acknowledged: project state/log/wiki and current merged Stripe modules.
- Cited: `docs/superpowers/plans/2026-09-27-supporter-buyer-use-classification.md`.
- Missing: none for code preparation; active tax registration remains an external activation prerequisite.
- Decision: continue.

ImpactStatementDraft: new Checkout inputs and twelve sandbox Price slots; no database or entitlement change; six current Price IDs become reconciliation-only after cutover.

Execution Readiness View: use the view in the parent plan. The intent, scope, compatibility, retirement, tests, review gate, and no-live-activation locks apply to every slice.
