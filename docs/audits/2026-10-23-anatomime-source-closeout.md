# Anatomime runtime source closeout — October 23, 2026

Four existing repairs are validated for review: explicit opaque room IDs for
Prisma's optional composite-FK create shape; canonical room-scoped Ably MACs;
joined-room URL recovery without player passes in the location; and PostgreSQL
advisory-lock int4 parameters with a supported decoded result. Schemas, the lock
namespace, account attribution, permissions, selected content and stable IDs
remain unchanged.

## Local evidence

A clean export of reviewed PR #44 `2feac62` received only four runtime files and
five regression files. Its application edits do not overlap that branch. Cached
dependencies, Chromium and the repository font fixture were reused, with no
install/download. The production webpack build and normal TypeScript validation
passed; Sentry collection/upload inputs were empty and external Node transport
denied. All application/schema files match the saved archive plus the reviewed
overlays. Windows archive CRLF conversion was separately proven against canonical
Git LF blobs; no unexplained runtime source change remained.

| Check | Result |
| --- | --- |
| Realtime/auth/traffic | 157 pass |
| Installed-Prisma room insertion | One pass; guest/account host IDs non-null and distinct |
| Progress/lock/shared rules | 43 pass |
| Inventory/historical receipt contracts | Six pass after current inventory correction |
| Focused lint | Nine runtime/regression files pass |
| Production webpack and TypeScript | Pass; eight guarded Node processes, zero external attempts |
| Distinct desktop browser cases | All 29 pass |
| Distinct mobile browser cases | All 29 pass |

The first combined browser invocation reached an operator-chosen six-minute
suite cap after 23 passes, zero unexpected/flaky assertions and 35 unrun cases.
That non-green result remains recorded. After its Job and port closed, exactly
the 35 unrun cases completed in serial project batches: six desktop, 29 mobile.
The same production build and source hashes were required throughout; completed
cases were not repeated. Assertions and case timing limits stayed unchanged,
with one worker and zero retries. This proves all 58 distinct cases, not success
of the initial capped invocation.

New cases cover manual-code, query-invite and path-invite joins, saved-team and
auth-header recovery after reload, and explicit exit to an unbound join page.
Player passes do not enter the URL. Existing polling, credential-bound renewal,
cooldown and stalled/failed request behavior remain covered. This is intercepted
UI QA, not another real sign-in, room/answer, phone or database/provider test.
The selected eight-file Node inventory remains 174 registrations; the browser
inventory is now 58. These are separate from the executed suites above and the
immutable historical 174/174 and 42/42 Layer B receipts.

## Cleanup and remaining boundary

Owned Jobs and the loopback port closed. The exact dependency junction was
removed before deleting the disposable source/build. Shared dependencies,
cached Chromium/font, source archive and provider evidence/credentials remain.
No database/container was created. Previous physical-phone, real PostgreSQL,
actual password/progress and hosted-cleanup acceptance remain separate dated
evidence. No private row, real credential, provider identifier or raw provider
body is recorded here; anatomy content readiness is not certified.

Hosted CI/Preview and independent source review are still required before
integration. PR #44 remains draft. This local closeout makes no push, merge,
Production promotion, Sentry activation or deployment configuration change.
Final public/provider binding, media/recovery and offered journeys remain in the
[migration checklist](../wiki/migration-status.md).
