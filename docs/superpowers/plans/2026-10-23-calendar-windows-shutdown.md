# Calendar Windows process shutdown repair

## Goal and boundary

Close the local Calendar acceptance harness's Windows shutdown gate while keeping
its existing five-second cancellation/deadline tests and PID-owned tree semantics.
The initial phase was local source and invented-process verification only:
no Calendar game, provider, database, credential or deployment operation. At
that checkpoint PR #44 remained draft and publication was not authorized.
The later owner-approved PR publication/review loop, described below, supersedes
that initial no-push boundary. Merge and Production promotion remain excluded.

The canonical migration-records checkout is reused without switching branches.
Its existing Anatomime and documentation changes are preserved. The separate
reviewed Sentry checkout remains unchanged. This source slice can be extracted
for later independent publication. The initial local phase did not authorize
publication; the subsequent direct owner approval governs the follow-up below.

## Evidence and decision

The unchanged suite reproduced 41 passes, two failures and one POSIX-only skip.
Both failures are owned-worker termination deadlines. Controlled direct and
shell process-tree probes measured `taskkill /T /F` at 14,387/13,309 ms and the
installed PowerShell 7/.NET `Process.Kill(true)` API at 474/421 ms. Both probes
verified descendant exit and preservation of an unrelated sentinel.

Causal status: the deepest confirmed mechanism is the unbounded external
`taskkill` path at the canonical teardown owner; the underlying OS/tool latency
is outside this source repair. The same single owner causes both observed test
failures. A counterfactual with the same synthetic tree and only the termination
mechanism changed eliminated the delay. Timer weakening and parent-only kills
would not preserve the required contract.

Change Necessity: code-change. Minimum boundary is the acceptance launch/stop
owner, one Windows-only API helper and regression coverage. PowerShell 7 tree
control must be checked before spawning an owned worker. It is already installed;
no installation or dependency download is included. No slow fallback is added.
The POSIX process-group behavior and all provider/approval controls are preserved.
TDD Mode: off; existing failing tests are diagnostic evidence and must pass after
repair, with additional real descendant and fail-closed preflight coverage.

## Initial local execution (historical)

1. Preserve all pre-existing dirty files and the Sentry checkout head/index; record
   the migration-records head before one focused local commit. Do not push.
2. Add a fixed-argument PowerShell 7 helper using the supported .NET tree-kill API;
   check capability before worker launch, bound helper execution and propagate
   failures instead of claiming shutdown from a failed tool exit.
3. Verify actual direct/shell descendants stop within five seconds and an unrelated
   sentinel stays alive. Cover unavailable capability before any worker starts.
4. Run the complete existing acceptance-harness suite with credentials excluded
   and external networking denied. Run focused lint and diff/link checks.
5. Confirm no invented child remains, preserve unrelated work, update the
   canonical migration checklist and retain a dated non-secret audit.

## Remaining parent migration work

This repair does not finish the migration. Unpublished Anatomime source/bindings,
reviewed Sentry integration and hosted/browser/edge/Production gates, compatible
media/provider recovery, missing offered journeys and final release remain in
`docs/wiki/migration-status.md`. Completed Ably, persistence/browser and protected
Sentry tests stay closed. Anatomy content review remains before dependent polish.

## Executed local result

Before the review follow-up, the repaired harness passed 45 applicable tests
with zero failures and one POSIX-only skip on Windows (46 registered). The
post-follow-up suite passed 46 tests with zero failures and one POSIX-only skip
(47 registered), with cached focused ESLint passing. The original cancellation
and cleanup deadlines pass; new tests cover unavailable tree control and real
direct/shell descendants while preserving an unrelated sentinel. No deadline was
relaxed and no live Calendar operation was run. The initial phase ended with a
local candidate; later publication and hosted checks belong to the separately
authorized review loop below. See the linked audit.

## Review follow-up: failed tree-control recovery

PR #45 review reproduced a launcher hang when the bounded Windows tree helper
fails. Race its rejection into setup/worker waits, attempt only owned-leader
termination as bounded recovery, release owned pipes/handle and retain a private
PID plus explicit unverified full-tree cleanup status. Do not turn that fallback
into a successful cleanup receipt. Cover nonzero exit, spawn failure and timeout
for operator cancellation and watchdog expiry under the original five-second
test bound, preserving an unrelated sentinel. Publish the focused correction
through the approved PR review/fix loop and require new exact-head checks.

This published follow-up is covered by the owner's later authorization for
regular PRs, CI/Preview builds and review fixes. That authority supersedes the
initial local-only no-push instruction above; it does not authorize merge,
Production promotion or another live Calendar/provider test. The resulting
46-pass/one-skip local result is the post-follow-up checkpoint; the earlier
45-pass result remains historical evidence of the first repair.
