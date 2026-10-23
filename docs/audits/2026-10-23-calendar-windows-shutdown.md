# Calendar Windows shutdown gate — October 23, 2026

## Result and scope

The local acceptance-harness shutdown gate passes on repaired source. This does
not publish the repair or prove a normal Production Calendar OAuth/sync journey.
The existing cancellation/deadline tests retain their five-second limits.
PowerShell 7 was already installed; no dependency download or install occurred.

The repair stays in the migration-records checkout and leaves reviewed Sentry
PR #44 source unchanged. A separate read-only GitHub inventory confirmed that
PR #44 is the only open PR, still draft/unmerged at `2feac62`, based on `b6a7d7`.
No push, merge, deployment or Production action occurred.

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
| Full local harness suite | 45 pass, zero fail, one POSIX-only skip; 46 tests, 23,910 ms |
| Original launcher cancellation/setup-failure cases | Pass; four signal/failure variants, 3,966 ms combined |
| Original two cleanup modes | Pass, 1,161 ms combined; independent deadlines and partial evidence retained |
| Missing Windows control | Refuses launch before a fixture worker starts |
| Real Windows direct/shell tree and unrelated sentinel | Pass, 1,674 ms combined; original five-second stop bound |
| Focused cached ESLint for changed JavaScript/tests | Pass |
| Environment/network boundary | Credentials excluded; external DNS/fetch/socket destinations denied; loopback fixtures only |

The unit fixtures contain invented identities and tokens only. No database,
Google, Sentry, Ably, Vercel or Neon operation, credential entry, ingestion,
notification, payment or media mutation was run. The controlled probe's local
children and sentinel were verified stopped; fixture cleanup completes in the
full suite. Source and document preservation/diff/link checks are recorded in
local non-secret receipts.

## Publication and parent migration boundary

This is a local repair candidate. Linux execution, hosted CI/review and source
publication remain to be performed before release reliance. The existing
reviewed Sentry PR remains a draft; its uploaded/hosted protected-test evidence
and retained encrypted credentials were untouched. Broader Anatomime source/
binding, media/provider recovery, offered journeys and final public release
remain tracked in the [migration checklist](../wiki/migration-status.md).
