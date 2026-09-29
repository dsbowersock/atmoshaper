# Supporter v2 Sandbox Catalog Migration Reflection

The code-preparation slice reached its authorized stop: a locally validated,
review-ready candidate with no provider or deployment mutation. The migration
command owns exact sandbox inventory, safe planning, deterministic creation,
post-write readback, and repeatable completion checks. The one bounded
exception is the retained default Portal catalog when Stripe omits that field
from its API response: a process-local operator confirmation may attest the
exact Dashboard-visible v1 allowlist, but it cannot override API-visible drift.

The main design correction was separating personal and business Customer Portal
allowlists. A shared Portal would have allowed a buyer to cross the use boundary
without making the choice explicit. Runtime routing now derives the Portal from
the persisted configured Price, while retained v1 subscriptions continue through
the existing default configuration until post-cutover inventory supports their
retirement.

Complexity Closure:
- Budget status: within-budget with a soft pressure signal.
- Governed now: one cohesive migration owner, one focused test owner, isolated runtime resolver, deterministic keys, bounded output, explicit compatibility behavior, and fail-closed provider guards.
- Deferred follow-up: any new migration capability should be extracted from the 873-line command instead of extending it in place; v1 retirement requires post-cutover evidence and a separate authorized migration.
- Completion impact: the code-only slice is ready for hosted review, but the overall migration remains incomplete until reviewed code, read-only provider verification, separately authorized sandbox apply, secure deployment configuration, and controlled synthetic testing finish.

The next evidence-bearing step is a hosted review of this exact branch. After
that review passes, the operator should run read-only `plan` and `verify` against
the dedicated AtmoShaper test account before asking for fresh, exact apply
authorization.
