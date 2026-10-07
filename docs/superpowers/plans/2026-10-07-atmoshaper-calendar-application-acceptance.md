# AtmoShaper isolated Calendar application acceptance

Status: the original approved October 7 run completed with partial acceptance and
all owned resources cleaned. Callback, access, PostgreSQL, reconnect, sync,
resolved Disconnect and uncertain-create/reconciliation cases pass. The missing
native pending-Disconnect rejection subsequently passed in a separately approved
database-only follow-up. The completed-run harness checkpoint passed 18 checks;
the later source-review follow-up below passes 29 provider-free checks. The
[one-case follow-up](2026-10-07-atmoshaper-calendar-pending-disconnect-acceptance.md)
and its cleanup are now complete, closing this bounded application acceptance
gate. No Google consent or fixture work was repeated. The execution sequence
below is historical; both exact database authorizations are exhausted.

Read [project state](../../project-state.md), [project log](../../project-log.md),
the [provider checkpoint](2026-10-02-atmoshaper-calendar-provider-stage.md), and
the [migration charter](../../rebrand/atmoshaper-migration-charter.md).

## Source-only review follow-up

Published [PR #41](https://github.com/dsbowersock/atmoshaper/pull/41) records these
completed operations and improves the operator harness after hosted review.
The launcher selects npm and shell use by platform. Future task-only Calendar
creates carry a unique run/attempt description marker, normalized to the
ordinary application description in guarded responses. This permits recovery
when transport fails before the returned ID is parsed, without treating a
calendar name as ownership. Inventory recovery requires one marked owned
secondary target; duplicates, primary/shared targets and unresolved intent stop
cleanup. Teardown uses complete inventory paging before deletion and absence
proof, and may refresh only this run's captured usable grant after expiry.
Every newly issued token remains encrypted for revocation even if its scope is
rejected; rejected tokens are not reused for Calendar work. An omitted refresh
scope inherits only the captured validated grant; explicit drift still fails.
Capture and acceptance share one lock, and later rejected credential values
cannot reuse an earlier accepted copy. Cleanup skips owned IDs already absent
from complete inventory after a lost DELETE response, then proves final absence.
An absence receipt covers the current create intents before tokens are revoked.
Diagnostic writes use owner-only POSIX mode before raw stderr is written, while
Windows keeps the protected run directory's access controls. Atomic populated
lock directories identify their PID/nonce owner; recovery requires that PID to
be absent and never steals a live or unowned lock.
Every token intent has a unique attempt identity. Cleanup starts only when each
exchange/refresh has an exact captured or explicit non-issued outcome; a later
captured retry cannot cover a lost response. Parsed validation/authentication
errors without token fields can establish non-issuance; malformed/server-error
or lost responses remain unresolved. Cleanup freezes new provider activity from
the application and verifies outcomes again under the same lock as its final vault clear
and success receipt. If a future response is unresolved, stop without claiming
revocation, retain evidence and prepare independently verified provider grant
removal under a new exact approval. This does not request recovery or repetition
of any completed run.
Encrypted captures retain their attempt identity and operation kind. If vault
replacement finishes before its journal append, cleanup reconstructs only that
exact capture and retains its rejected-for-use state for owned revocation.
Configuration and credential paths are canonicalized and checked by ancestry
components; sibling scratch directories pass, while dot-prefixed children and
outside symlinks pointing inside the checkout fail.
An exact create intent may also terminate with non-creation after a parsed
matching Calendar 400/401/403 error with no resource ID. When every create is
positively rejected, cleanup needs no inventory permission before owned-token
revocation. Ambiguous response/transport failures still require reconciliation.

All 29 provider-free checks pass locally; exact POSIX permission assertions
still require latest-head Linux CI. The original real run used the earlier
unmodified description and injected response loss after ID capture; the new
pre-parse recovery and delayed-refresh proofs are provider-free. They do not
retroactively broaden the completed real acceptance claim or authorize a rerun.
Future execution of the updated harness needs its own exact resource approval.

## Purpose and current evidence

The completed two-arm permission comparison proved compatible inbound reads
under availability access. It did not exercise the application's persisted
connection, practice/feature gates, dedicated target creation, PostgreSQL locks,
outbound events, reconnect or disconnect. This is a new application acceptance
stage; do not repeat that comparison or the completed live payment test.

PR #40 merged as `38d0deddea484938e13df61927d07a7b21f92071`. Its checked
automatic candidate is unpromoted. The owner reports saving the approved
replacement Production declaration and supplies Verification Center's message:

> Verification is not required since your app is not requesting any sensitive or restricted scopes.

The owner also reports no Sensitive or Restricted entries. This closes the
declaration/status gate by owner readback, not independent Console/API inspection
of every saved URL. No verification submission is currently required on that
evidence. Production Calendar credentials, public promotion and activation
remain separate future operations.

Read-only preparation on October 7 verified a clean owned receipt branch,
merged hosted PR truth, the real Neon Prisma adapter, and available loopback
ports 3317/3318. Installed Neon CLI 6.1.0 uses an existing authenticated OAuth
profile; organization metadata reads succeed. Exactly one returned organization
is unmanaged by Vercel, and its plan is Launch. Its identity is recorded only
in the private preparation journal. No new login, API key or account change is
needed. No database connection or rows were read during this preparation.

## Exact approved scope of the completed run

| Resource / operation | Limit and ownership |
| --- | --- |
| Google configuration | Reuse the owner's existing `AtmoShaper Calendar Verify` project and its existing test Web client; no new project/client or Production setting edit |
| Local application | One fresh task-owned checkout of the merged runtime above, without `.env.local`, and one owned server bound to loopback port 3318; recheck availability before starting |
| Temporary database | One new independent empty Neon project in the authenticated account's identified unmanaged organization; no template, cloned branch/rows, existing database substitution or Vercel-managed target |
| Database configuration | PostgreSQL 17, `aws-us-east-2`, one primary endpoint requested at fixed 0.25 CU, scale-to-zero retained; stop if unsupported rather than increase compute or change plans |
| Synthetic application data | One persisted synthetic verified user, one practice, OWNER membership and a bounded `external_calendar_sync` feature grant; no ADMIN bypass, real user rows, PHI or payment fixture |
| Google accounts | The existing OAuth test account plus the second owner-controlled account only as a fixture owner/shared-reader source; no second OAuth test-user addition required |
| Provider fixtures | At most four newly created secondary calendars and six synthetic event resources across the entire run, including failure cases; never recreate the deleted comparison fixtures |
| Consent | At most three fresh application Calendar consent flows through the real callback, only for the existing test client/account; do not replay comparison tokens/codes or broaden scopes |
| Duration | At most 90 minutes from database creation to teardown beginning; stop sooner on an unsafe or unresolved result. Complete deletion/receipts even if teardown exceeds that limit |
| Cleanup | Revoke only this run's test tokens, stop owned processes, delete only its positively owned calendar fixtures and exact temporary Neon project, and prove active resource absence |

The Launch organization can incur usage charges. Fixed small compute, one
project, a short run and mandatory teardown bound resource use; this is not
represented as a free test or a guaranteed charge estimate. No plan upgrade,
autoscaling increase, always-on endpoint, read replica or auxiliary service is
proposed. [Neon billing](https://neon.com/docs/introduction/about-billing),
[scale-to-zero](https://neon.com/docs/introduction/scale-to-zero), and
[current CLI project operations](https://neon.com/docs/cli/projects) were checked
through the documentation connector on October 7.

## Preparation before resource creation

1. Reverify exact local/hosted source and owned checkout status. Prepare a
   task-only launcher and acceptance harness with named npm entrypoints,
   focused comments, and provider-free checks. Do not add fault switches to
   publicly deployed routes. Keep any product fix separate for normal review.
2. Reuse the existing Google test Web client. Preserve its original
   `http://localhost:3317/oauth/callback` redirect and add only
   `http://localhost:3318/api/calendar/google/callback`. Keep External / Testing
   and its existing single OAuth test user unchanged. In that test project's
   Data Access declaration retain existing identity defaults and set Calendar
   entries to `calendar.app.created`, `calendar.calendarlist.readonly`, and
   `calendar.events.freebusy`; remove the former event-read comparison entry.
   These edits are now approved. The owner operates the Console because
   the earlier automated browser security review was denied; do not retry or
   bypass that path. Obtain a non-secret callback/scope save receipt.
3. Validate the existing privately retained test credential JSON locally only
   under the new run approval: test-project/client identity, Web type and saved
   loopback redirect. Never print or track its contents, rotate the client,
   provision Production or ask for a second download unnecessarily.
4. Build a child-only environment from explicit inert unrelated-provider and
   telemetry settings. Supply only this test client's Calendar ID/secret,
   exact local Calendar redirect, a fresh ephemeral encryption key, and local
   auth settings. Keep Google sign-in, SMTP, Stripe, media writes, Ably, Sentry
   and hosted PHI inert. The generic Browser-QA launcher blanks Calendar keys;
   it cannot be used unchanged for this run. Never inherit `.env.local` or
   Production credentials. Do not log secrets, OAuth URLs/codes or token payloads.
5. Implement controlled fault observation at the task-only provider/transaction
   boundary. Validate fail-closed dispatch against private fixture allowlists,
   exact loopback origin, database fingerprint, write budgets and owned process
   IDs before any real provider write. Dry-run all interception rules without
   credentials. A missing rule or incomplete harness is a stop, not permission
   to improvise a live fault or claim coverage.

## Database and fixture setup after approval

Create exactly one empty Neon project using explicit organization, region,
PostgreSQL and fixed-compute arguments. Do not set the shared CLI context,
create an API key or enable Auth/Data API/replication. Capture output privately;
use `--no-secrets` for metadata where available. Resolve only this new project's
runtime pooled and direct migration connection pair, with private ownership and
fingerprint receipts. An uncertain create response requires reconciliation by
the exact run name/organization before any retry; never create a second target.

Use the existing database-target guards with `VERCEL_ENV=development` and the
approved QA URL pair/fingerprint. Apply committed schema migrations only to
this empty target through `npm run prisma:migrate:deploy`, then generate the
client through `npm run prisma:generate`. Confirm no production URL aliases can
reach fixtures or scripts. Seed the synthetic account/practice/feature grant
through the guarded QA path. The signed-in fixture uses a persisted synthetic
identity and a guarded local session; this is Calendar access/callback proof,
not another test of public registration or Google sign-in.

Use two newly created source calendars: one owned by the OAuth test account,
the other owned by the second account and shared read-only with the test account.
Owners/tool actions create four synthetic source event resources in total.
Use fresh UTC-relative times within the app's read window; never inspect real
event contents or change any existing calendar's time zone/sharing. The app
creates its dedicated target and up to two generic outbound events. Reserve the
fourth calendar for a controlled creation-failure case; the lifetime limits
include deleted/replaced fixtures and recurring masters. Updates/tombstones may
only reference this run's known event IDs.

Calendar-list metadata for the test account is needed for real target discovery;
existing names/IDs stay private, and their event contents are not read. Source
reads and all event/calendar mutations are allowlisted to new owned fixtures.
The task transport reads complete inventory pages for pre-existing target checks,
then exposes only its source/created calendars to the synthetic app account.
This explicit fixture-only inventory mapping prevents the app's default primary
source selection from importing ordinary event contents. It is a test limitation,
not proof of the ordinary primary-calendar default or a runtime product change.
If a pre-existing marked/named candidate prevents fresh creation, preserve it
and stop that case. Do not rename/delete it or claim a new-calendar proof.

## Acceptance sequence and evidence

The local npm launcher supports database-free `setup`, full `preflight`, `generate`, `migrate`, `seed`,
`server`, stage-specific `check`, and `cleanup` modes, with its configuration
held privately outside the checkout. `calendar:application-acceptance:plan`
prints a provider-free outline; `test:calendar-application-acceptance` tests the
resource/credential dispatch boundaries without reading real settings. Native
worker imports map only Next's `server-only` marker to its server implementation;
the access, entitlement, session, service and Prisma logic remain real.
The local server and descendants have an owned-process deadline. Its one-use
loopback bridge installs the persisted synthetic user's session, then delegates
to the actual app connect/callback routes. Google consent remains owner-operated.
No special route or fault switch is added to the deployed application.

Run checks in this order: `access-http` before fresh consent; `connected` after
the real callback; `transactions`; one fresh real reconnect and `reconnected`;
`inbound`; connector updates/deletes only the known synthetic source events;
`incremental`; `outbound`; `disconnect`; `uncertain`; then scoped cleanup.
Each pass receives a private dated case receipt. This is the execution plan,
not a claim that application/provider cases have already run.

| Case | Execution and pass criterion |
| --- | --- |
| Access and callback | With real persisted data, absent practice role and absent feature grant each deny before provider activity; OWNER plus `external_calendar_sync` permits connection. Invalid/replayed state is rejected and its one-use cookie cleared. The real callback validates the newly returned grant and encrypts stored credentials |
| Fresh target | Actual discovery validates account subject and an owned non-primary marked target. A verified absence permits one create POST; validate the accepted provider ID before activation. Record create counts privately |
| Reconnect and rejected targets | Rename only the newly created dedicated fixture, reconnect and prove the same stored ID is reused with zero create POSTs. Use QA-only state/fault setup to reject mismatched subject, primary/shared target and ambiguous task-owned candidates; never mutate a real account or pre-existing calendar |
| PostgreSQL serialization | Run concurrent real connection work against the approved Neon database with controlled provider barriers. Prove user-row lock ordering, rollback and a committed inactive intent; a transaction double is not this proof |
| Uncertain creation | In the reserved fixture case, deliberately lose only the response/activation after a positively journaled create attempt. Preserve the inactive intent, prove an empty/interrupted discovery cannot trigger a second POST, then reconcile only that known fixture. Stop on unknown identity; do not create again |
| Inbound/outbound sync | Select only the two synthetic sources. Prove generic busy-block create/update/cancellation and cursor handling, plus two generic outbound events with accepted IDs retained. Imported titles/descriptions/locations/attendees are not persisted or rendered. Observe bounded reads without timing out new-event POST responses |
| Disconnect | An unresolved intent cannot be deleted through ordinary disconnect. After reconciliation, disconnect clears app connection state while preserving the provider fixture/calendar contents until separately approved cleanup |

Provider failures and cursor/budget cases use deterministic task-only transport
interception around real application/database work. Label them as injected
failures, distinct from real successful Google responses. Do not claim actual
large-calendar pagination, every provider timing race, full public authentication
or Production acceptance from a small bounded fixture set. Existing completed
comparison receipts retain their original pagination/compatibility proof.

Retain a private chronological journal of resource ownership, consent scopes,
sanitized request counts, accepted IDs, database identity hash, process identity,
fault outcomes and teardown. Tracked receipts contain only source/check IDs,
counts, redacted pass/fail outcomes and proof limitations. No raw provider
payloads, rows, private identifiers, credentials or connection strings enter docs.

## Mandatory teardown and stop conditions

Stop new work on the first unresolved identity, grant, transport outcome, failed
ownership guard, fixture-budget limit or time ceiling. Preserve the known state;
do not substitute another database/account, repeat a blind POST, broaden grants
or proceed to Production. A failed case requires a concrete source diagnosis and
review before another separately authorized resource run if needed.

1. Drain this run's work and retain its test tokens privately long enough for
   scoped revocation, even if ordinary disconnect removed database records.
   Revoke only the new test-client tokens. Preserve the connector grant,
   Production/sign-in grants, existing CLI profile and original credential JSON.
   Delete the positively journaled app-created targets and prove active absence
   before revoking the narrow token needed for that cleanup. The first target is
   deleted only after resolved disconnect proves its provider contents preserved,
   establishing genuine absence for the separately reserved uncertain-create case.
2. Stop only the recorded owned server/harness processes and verify the local
   ports/listener are released. Remove task-owned ephemeral credential copies
   and scratch environment files after their resolved workspace paths are checked.
3. Delete only newly created fixture calendars from their owning accounts;
   their contained synthetic events go with them. If tools lack calendar-delete,
   the owner completes Settings > Remove calendar > Delete > Delete permanently
   for those exact fixtures. Record owner deletion receipts separately from any
   independently observed active-list absence. Never reuse old comparison IDs.
4. Delete the exact new Neon project through the authenticated CLI and prove
   it is absent from the active organization listing. Neon has a documented
   deleted-project recovery period; active absence is not a claim of immediate
   irreversible erasure. No production or pre-existing branch/project is deleted.
5. Record partial cleanup explicitly and continue only the outstanding owned
   cleanup until complete. Do not claim acceptance complete with leaked active
   resources or missing required cases.

## Result and subsequent migration steps

The run used exactly one empty Neon project, four calendar resources, six event
resources and three fresh consents. Real callback/state-cookie/encryption and
persisted practice/feature gates pass. Dedicated target creation, wrong-subject
and injected primary/shared/ambiguous-target rejection, PostgreSQL rollback and
user-row serialization pass. The corrected rename and final reconnect preserve
the accepted target ID. Actual source-selection import, incremental busy update/
cancellation, injected 503 cursor preservation and 410 reset/recovery pass.
Two generic outbound accepted IDs are retained through update/cancellation;
resolved Disconnect clears app state while preserving provider contents.
Injected lost-create response leaves an inactive durable intent, hidden discovery
does not issue another create, and reconciliation reuses the known second target.

In this original run, the pending Disconnect POST returned a framework error before the action because
the client dropped Next's empty hidden selector. Row preservation and HTTP 500
are insufficient proof of the action's guard. Native multipart bytes now preserve
that selector in an actual loopback test. The separately approved follow-up
subsequently establishes the native reconciliation rejection from the current
owned server, correct session/form identity, no success redirect and an unchanged
pending row, as recorded below.

Task-only repairs also corrected Windows loader URL handling, a missing JSON
header/unchecked rename response, and an outbound interval that overlapped its
second fixture. The earlier rename receipt is invalidated privately; the final
allowed reconnect proves the corrected rename. Outbound recovery uses the two
already accepted IDs, with no extra insertion. Product runtime remains exact.

Teardown began about 38 minutes after the database creation window started at
`2026-10-07T17:34:25.785Z`. Both app targets are absent and all new test grants
revoked. The exact temporary Neon project is absent from active listings, owned
processes/listeners are stopped and ephemeral credentials removed. Both source
calendars are permanently deleted by owner receipt and independently absent from
their owners' active lists. Neon active absence retains its documented recovery
period limitation. No resources remain active from this approved run.

The separately approved database-only follow-up now proves the native action's
pending rejection with correct session/form identity, a current-server error
receipt, no success redirect and unchanged pending row. All seven touched tables
were emptied before exact project deletion; active absence, server/port release
and ephemeral credential removal are confirmed. Teardown began after 4.72 minutes.
This does not erase the original transport failure or repeat any completed
Google consent/provider operation.

The [Production credential/build and rollout receipt](2026-10-07-atmoshaper-calendar-production-credentials.md)
now records separately approved provisioning, stable key recovery, the single
checked candidate and exact-artifact public promotion. Those later approvals
do not authorize repeating this completed acceptance run. Operator/harness source
publication/review is the next closeout step; no additional provider test or
verification upload/submission is granted here. Registration/recurring Supporter Checkout remain open; one-time
support/background purchases and hosted clinical storage remain disabled.
