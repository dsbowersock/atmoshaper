# AtmoShaper Live Stripe Cutover Intent

Requested outcome: continue the AtmoShaper migration after PR #28 by preparing a reviewed, fail-closed live-mode Stripe rollout for the dedicated AtmoShaper account.

Scope: a code-only live catalog planner/verifier, shared v2 catalog contracts extracted from the sandbox migrator, focused tests, package command, operator documentation, and a review-ready branch.

Non-goals: live or sandbox Stripe writes, Vercel or database mutation, deployment, tax registration, payment or subscription activity, DNS, email-provider changes, public registration, Checkout activation, or removal of legacy reconciliation compatibility.

Risk hints: wrong Stripe account or mode, accidental live writes, hidden provider conflicts, Product/Price identity collisions, live/sandbox Portal confusion, omitted Portal catalog fields, stale webhook assumptions, and migration drift from the accepted sandbox contract.

BaselineReadSetHint: `AGENTS.md`, `docs/project-state.md`, `docs/project-log.md`, `docs/wiki/index.md`, `docs/wiki/billing-memberships.md`, `docs/wiki/deployment.md`, `docs/superpowers/plans/2026-09-29-atmoshaper-live-stripe-cutover.md`, the completed sandbox migration work record, and the current Stripe migration/readiness/runtime owners.

BaselineUsageDraft:
- Required: all refs above.
- Acknowledged: canonical project docs, accepted sandbox evidence, current provider boundaries, and the new parent plan.
- Cited: `docs/superpowers/plans/2026-09-29-atmoshaper-live-stripe-cutover.md` and `docs/aegis/work/2026-09-28-supporter-v2-sandbox-catalog-migration/`.
- Missing: no code-preparation baseline; live provider inventory requires a securely supplied live key only after review.
- Decision: continue with code-only preparation.

ImpactStatementDraft: add a separate live migration owner and extract shared immutable v2 contracts while preserving sandbox behavior and stopping before every provider-write boundary.

TDD Route:
- Mode: off.
- Decision: skipped because strict TDD was not requested.
- Test posture: focused contract and regression coverage alongside implementation.

Change Necessity:
- User-visible need: reproduce the accepted buyer-use catalog safely in the dedicated live AtmoShaper account before launch.
- No-change / non-code option: manual Dashboard setup cannot prove account/mode ownership, complete inventory, collision freedom, replay safety, or exact personal/business Portal isolation.
- Why code change is necessary: the current orchestrator intentionally rejects live keys and requires the retained v1 sandbox topology, which the dedicated live account does not have.
- Minimum change boundary: shared immutable v2 contract owner, separate live plan/verify/apply orchestrator, focused tests, package command, and operator documentation.
- Decision: code-change.

Complexity Budget:
- Artifact class: Source Complexity and Test Complexity.
- Target files / artifacts: the 1,000+ line sandbox migrator, its maintained tests, a new shared contract module, and a new live orchestrator/test owner.
- Current pressure: the sandbox migrator is 1,013 lines and its maintained test owner is 1,019 lines, putting both above the 800-line soft pressure signal; the orchestrator must not receive another responsibility.
- Projected post-change pressure: sandbox owner should become thinner or remain wiring-only; new live behavior must have a distinct owner.
- Budget result: at-risk.
- Planned governance: extract shared contract data/helpers first, preserve environment-specific orchestration, and split tests by owner.

Execution Readiness View:
- Intent lock: prepare reviewed live rollout code; do not execute a live rollout.
- Scope fence: code, tests, package command, and documentation only.
- Baseline lock: accepted sandbox topology and current canonical project state.
- Owner constraints: shared immutable contracts may be extracted; environment-specific inventory and mutation policy remain separate.
- Compatibility boundary: sandbox behavior and legacy reconciliation inputs remain unchanged.
- Retirement boundary: legacy identifiers remain until a separate evidence-backed migration; live apply confirmation is process-only.
- Test obligations: sandbox regressions, live planner contract tests, lint, typecheck, diff checks, broader relevant suite, hosted CI, Codex, and CodeRabbit.
- Review gates: no provider work until exact-head reviews are clean and the code PR is merged.
- Drift rule: pause if implementation needs provider mutation, runtime billing changes, a schema change, or a new compatibility exception.
