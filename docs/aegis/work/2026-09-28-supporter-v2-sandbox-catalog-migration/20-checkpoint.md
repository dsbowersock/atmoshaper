# Supporter v2 Sandbox Catalog Migration Checkpoint

Slice Card:
- Goal: prepare the reviewed v2 sandbox migration command without provider mutation.
- Parent plan/spec: `docs/superpowers/plans/2026-09-27-supporter-v2-sandbox-catalog-migration.md`.
- Files: new v2 migration command and tests, package script, billing/operator docs, and this work record.
- Boundary: preserve v1; no Stripe, Vercel, Neon, database, deployment, tax-registration, or real-payment writes.
- Verification: focused Node tests, lint, typecheck, build, diff checks, and dry verify/plan only after code review.
- Stop: pause on ambiguous provider ownership, unexpected subscriptions, incomplete metadata, Portal behavior that could change buyer use, or any need for live mutation.

TodoCheckpointDraft:
- Completed: PR #23 merged; dedicated clean rollout checkout updated to the merge commit; read-only Stripe and Vercel inventories captured; parent plan and current contract owners read; replay-safe v2 migration command, use-specific Portal routing, tests, and operator documentation implemented; focused and full local validation passed; PR #24 opened and exact-head Codex findings verified and repaired.
- Active: push the focused Portal-readiness and duplicate-identity repairs, then obtain clean exact-head hosted Codex and CodeRabbit reviews without mutating a provider.
- Pending: merge PR #24 after all hosted gates are clean, run the reviewed read-only sandbox verify/plan, request fresh authorization for sandbox apply, configure Vercel securely, redeploy while Checkout remains paused, and run controlled synthetic personal/business Checkout and Portal tests.
- Blocked: live activation remains blocked by no active tax registration and is outside this slice.
- Next: complete the exact-head review loop and merge only after all authorized gates pass; provider work remains paused.

ResumeStateHint: branch `codex/supporter-v2-sandbox-catalog-migration` in `.worktrees/stripe-sandbox-rollout`, based on PR #23 merge `b6652e0c2ed0dd5ce5e583cabdc9a8273d71bff2`. The original AtmoShaper checkout and all other worktrees are out of scope.

DriftCheckDraft:
- Intent and scope match the parent plan.
- v1 compatibility and retirement boundaries remain explicit.
- No provider or deployment write has occurred in this slice.
- The new 873-line migration owner is a cohesive operator command but is a soft complexity-pressure signal; it remains bounded to inventory, verification, deterministic apply, and privacy-safe reporting. Further provider capabilities should be extracted rather than added in place.
- Decision: the verified hosted-review repairs remain inside the code-only slice; stop before provider work and merge only after the latest head clears every authorized review gate.
