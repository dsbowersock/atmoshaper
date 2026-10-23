# Calendar Windows shutdown gate — October 23, 2026

## Result and scope

The local acceptance-harness shutdown gate passes on repaired source. This does
not publish the repair or prove a normal Production Calendar OAuth/sync journey.
The existing cancellation/deadline tests retain their five-second limits.
PowerShell 7 was already installed; no dependency download or install occurred.

The initial local repair stayed in the migration-records checkout and left
reviewed Sentry PR #44 source unchanged. At that local-phase checkpoint, a
read-only GitHub inventory found only PR #44 open, draft/unmerged at `2feac62`,
based on `b6a7d7`. During that local verification phase, no push, merge,
deployment or Production action occurred. The later authorized publication and
review follow-up are recorded below.

## Reproduction and causal evidence

The unchanged `npm run test:calendar-application-acceptance` reproduced 41 passes,
two failures and one platform skip across 44 tests in 138,669 ms. The failures
were launcher cancellation during the initial journal wait and both cleanup
modes' independent deadline. They concern owned synthetic child shutdown, not
booking or appointment calculations.

An invented direct tree and a shell tree each contained a worker and descendant;
an independent sentinel was required to survive. Changing only the termination
mechanism gave these measured results:

| Termination | Direct tree | Shell tree | Descendants closed | Sentinel preserved |
| --- | --- | --- | --- | --- |
| Existing `taskkill /PID /T /F` | 14,387 ms | 13,309 ms | Yes | Yes |
| Installed PowerShell/.NET tree API | 474 ms | 421 ms | Yes | Yes |

The deepest confirmed mechanism is the owner's unbounded external `taskkill`
path. This audit does not claim the underlying Windows/tool latency's cause is
known. The same owner accounts for both observed failures; the unchanged-tree
counterfactual rejects a journal/deadline-configuration explanation for this
measured delay.

## Repair and preserved contracts

`scripts/calendar-application-acceptance.mjs` now checks the Windows-only tree
control before spawning a worker and invokes a fixed PowerShell 7 helper with
only its owned PID. The helper uses the supported .NET descendant-termination
API. Helpers exclude application/provider credentials, hide their windows and
have a three-second control bound. Nonzero/timeout/error outcomes propagate as
failure rather than being treated as proof of shutdown. Known-exited Windows
children need no further process-control call.

The POSIX group/grace/escalation path remains intact. Application source, live
Calendar scopes, manifest ownership, journal/vault semantics and provider budgets
are unchanged. Slow taskkill responsibility is retired only from this acceptance
owner; the separate Chimer pilot cleanup remains outside this slice.

[Microsoft's API documentation](https://learn.microsoft.com/en-us/dotnet/api/system.diagnostics.process.kill)
distinguishes parent exit from descendant completion. Accordingly, the real
Windows regression checks descendant PIDs and the unrelated sentinel; a parent
`WaitForExit` alone is not used as evidence of descendant shutdown.

## Verification

| Check | Actual result |
| --- | --- |
| Initial local harness suite, before review follow-up | 45 pass, zero fail, one POSIX-only skip; 46 tests, 23,910 ms |
| Post-follow-up local harness suite | 46 pass, zero fail, one POSIX-only skip; 47 registered tests |
| Original launcher cancellation/setup-failure cases | Pass; four signal/failure variants, 3,966 ms combined |
| Original two cleanup modes | Pass, 1,161 ms combined; independent deadlines and partial evidence retained |
| Missing Windows control | Refuses launch before a fixture worker starts |
| Real Windows direct/shell tree and unrelated sentinel | Pass, 1,674 ms combined; original five-second stop bound |
| Focused cached ESLint for changed JavaScript/tests | Pass |
| Environment/network boundary | Credentials excluded; external DNS/fetch/socket destinations denied; loopback fixtures only |

The unit fixtures contain invented identities and tokens only. No database,
Google, Sentry, Ably, Vercel or Neon operation, credential entry, ingestion,
notification, payment or media mutation was run. The controlled probe's owned children stopped while the unrelated sentinel
remained alive during the shutdown assertion. The sentinel was stopped only
during final fixture cleanup; it was not terminated by owned-tree teardown. Source and document preservation/diff/link checks are recorded in
local non-secret receipts.

## Published review follow-up

The exact initial repair is published in [PR #45](https://github.com/dsbowersock/atmoshaper/pull/45).
Codex review identified a real exception path: an unsuccessful tree helper could
leave the launcher waiting for its worker before surfacing the failure. A new
actual-entrypoint regression reproduced this at the existing five-second bound.

Tree-control failure now interrupts both the initial journal and worker waits.
Windows failure recovery attempts termination of only the owned leader, releases
its inherited pipes/handle and fails the stage. It never reports successful full-
tree cleanup from that fallback. A protected diagnostic retains the owned PID
and explicit `full_tree_cleanup_unverified` status for operator recovery.

The final local suite passes 46 tests with zero failures and one POSIX-only
skip (47 registered); focused cached ESLint passes. The new six-case regression
reproduced the pre-fix hang, then passes in 15.7 seconds combined with each
case retaining its five-second bound. It covers helper nonzero exit, spawn
error and timeout under both operator cancellation and the watchdog deadline. It checks failed
stage status, no success message, owned-worker termination, retained recovery
status and unrelated-sentinel preservation. Original success deadlines and
POSIX group escalation remain intact. Hosted checks/review for the follow-up
head are required; no live Calendar/provider test is repeated.

## Publication and parent migration boundary

The initial local candidate is now published, with a focused review follow-up
prepared. Exact follow-up-head Linux CI/review remains required before release
reliance. The existing reviewed Sentry PR is ready for review; its uploaded/hosted protected-test evidence
and retained encrypted credentials were untouched. Broader Anatomime source/
binding, media/provider recovery, offered journeys and final public release
remain tracked in the [migration checklist](../wiki/migration-status.md).
