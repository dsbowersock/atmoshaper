# AtmoShaper Google Calendar preparation

Status: PR #36 merged under the user's source-only approval on 2026-10-02 as
`154f9b6d440e0842892b96e185190c5be1ed2e22`. The user selected
a separate calendar named `AtmoShaper`. Repository preparation is authorized by
the migration continuation; provider configuration and public activation remain
separate gates. This source preparation changed no provider configuration and
did not deploy.

Current continuation: the later approved PR #37 artifact promotion includes
this source in the live runtime; Calendar configuration and activation remain
absent. The [provider-stage checkpoint](2026-10-02-atmoshaper-calendar-provider-stage.md)
owns the next configuration/acceptance preparation. Source-stage baseline
observations below are historical and do not require repeating implemented code
or working Google sign-in setup.

Read [project state](../../project-state.md), [project log](../../project-log.md),
and the [remaining migration ledger](../../wiki/migration-status.md) first.
MassageLab will continue as a separate project after the platform migration.
Preserve its current full service and existing calendars. Its future product
direction is outside this AtmoShaper migration work.

## Historical source-stage evidence and continuing boundaries

- Reviewed AtmoShaper runtime source is merge
  `7756080c3bc650bdbcff33013ff67728a3f97efa`. The public Supporter launch
  does not prove Calendar readiness or authorize another deployment.
- Read-only Production variable-name inventory on 2026-10-01 does not list
  `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`,
  `GOOGLE_CALENDAR_REDIRECT_URI`, or `CALENDAR_SYNC_ENCRYPTION_KEY`.
  No credential values, tokens, connections, or calendar contents were read.
- `lib/calendar-sync-env.ts` requires separate Calendar client credentials;
  its callback defaults from the configured auth origin when no explicit URI
  is set. Google sign-in's operational receipt does not establish Calendar
  callback permission or scope approval.
- In the deployed source, `lib/google-calendar-adapter.ts` discovers a calendar by the
  `MassageLab` summary before creating one. A display-copy replacement alone
  would change that discovery contract. The user chose separate calendars;
  do not reuse, rename, delete, or copy the old project's calendar.
- `app/api/calendar/google/callback/route.ts` exchanges the OAuth code, ensures
  a dedicated calendar, persists encrypted tokens, and imports busy blocks.
  Completing this callback is a provider and database mutation, not a read-only
  smoke test.
- Token encryption uses `CALENDAR_SYNC_ENCRYPTION_KEY` through
  `lib/calendar-sync-secrets.ts`. Provider identity `GOOGLE`, the OAuth-state
  cookie, existing Prisma fields, and `massagelabEventId` reconciliation
  properties remain compatibility contracts.

## Repository change to prepare

1. Add a focused AtmoShaper calendar-discovery contract with the selected
   visible name. Preserve existing private namespaces and the old project's
   source. Keep existing connection IDs authoritative where ownership and
   provider-account identity are validated; do not adopt an arbitrary calendar
   solely because its display name matches. Define fail-closed handling for
   ambiguous matches and inaccessible or unexpected stored targets.
2. Ensure the new site's initial connection creates or safely reuses its own
   dedicated AtmoShaper calendar. No fallback to the `MassageLab` calendar,
   automatic event copying, old-token import, or cross-project connection
   adoption is permitted by the naming decision. If current AtmoShaper
   connections require reconciliation, obtain narrow read-only authority and
   evidence before proposing a row or provider migration.
3. Review generic outbound display summaries separately from private
   `massagelabEventId` metadata. Preserve generic busy-block normalization and
   the existing exclusion of client names, notes, locations, clinical fields,
   and arbitrary provider errors.
4. Add focused comments documenting the discovery and coexistence rules.
   Include provider-free regressions for an old calendar only, no target,
   one validated new target, ambiguous new targets, a renamed stored target,
   an inaccessible target, a different provider account, and reconnects that
   must not create duplicates. Exercise the callback/service path as well as
   the adapter. Run the repository lint, typecheck, relevant Calendar tests,
   and required hosted checks for the resulting branch.

## Provider preparation and missing authority

### Repository implementation checkpoint

- Baseline: PR #35 merged as `572691aad5e48e01089097d59799aea19d92ba83`;
  the reused migration worktree was clean with no active Git operation. The
  unrelated root checkout and its untracked artwork are preserved.
- Change necessity: the old adapter selects the first `MassageLab` title and
  ignores the stored target on reconnect. Configuration alone cannot supply the
  selected separate-calendar contract. Change only discovery, callback/service
  wiring, generic outbound display summaries, and focused regressions.
- TDD route: `Mode: off / Decision: skipped`; no strict TDD authority is assumed.
  Provider-free regression tests and required checks remain mandatory.
- Complexity: adapter and service are cohesive existing owners below the
  800-line pressure signal. Edit in place for this compatibility repair;
  the callback gets smaller, and no schema or parallel provider owner is added.
- Discovery uses an exact AtmoShaper description marker, owner/non-primary
  CalendarList evidence, complete paginated/hidden inventory, and Calendar API
  metadata readback. The service rejects broader Calendar grants so the
  metadata read uses the existing `calendar.app.created` permission. The marker
  distinguishes this project's calendar from old app-created calendars; names
  alone never authorize adoption. An unmarked namesake or multiple candidates
  fails closed. A validated stored ID remains authoritative after a rename.
- The Google UserInfo subject must match the current token/connection account.
  Each callback phase holds the user-row lock. A different active account or saved target
  requires explicit disconnect instead of silently deleting its sync state.
  Inactive rows for other accounts remain preserved history; a returning
  account still validates its stored target. Eight-second request limits and
  a shared 30-second provider deadline start before lock acquisition and stop
  further paginated requests before the 45-second transaction expires.
  Read-only target validation also precedes inbound and outbound sync.
- Outside the callback, inbound token refresh, target validation, and all selected
  sources' event pages share a 60-second provider read budget. Outbound target
  validation has a separate 30-second read budget. Cached and refreshed tokens
  forward the deadline through account, paginated inventory, and metadata checks.
  An exhausted inbound source records failure without advancing its old cursor,
  stops later sources, and does not mark the refresh completed. Database commits
  and already-dispatched new-event POST responses are outside these read budgets.
- New event inserts preserve the existing provider-generated ID and wait
  behavior. An introduced local timeout could discard an accepted POST's ID
  and cause a duplicate retry. Reads and existing-ID updates remain bounded;
  do not introduce a durable event-ID contract without its own compatibility
  proof. End-to-end duplicate/transport-failure acceptance remains in provider QA.
- Creation has two transaction phases. Read-only discovery first validates the
  account and target. If no target exists, commit encrypted credentials as an
  inactive `ERROR` connection with `GOOGLE_CALENDAR_CREATION_PENDING` reason
  before the Google POST. Only the invocation that committed this intent can
  create; its next lock-held transaction verifies the target before activating
  and saving sources. Existing fields, encryption, IDs, and markers are retained.
- A failed or interrupted provider operation can leave an owned, marked calendar
  before the final transaction commits. That rollback cannot erase the prior
  intent. A later callback may reconcile a discovered verified target, but a
  pending intent with no target cannot issue another POST, even if the provider
  listing is temporarily empty. No calendar is automatically deleted or renamed.
- The disconnect action excludes unresolved creation intents in the atomic
  user/provider-scoped deletion. Pending rows cannot be erased by a direct
  action request; ordinary active/null-reason and resolved historical rows
  remain removable. Rejected requests do not report a successful disconnect.
- A transient second-phase read failure before POST can release this invocation's
  saved intent. The adapter reports dispatch only after its abort check, immediately
  before fetch. After rollback, cleanup reacquires the user lock and matches the
  saved row/version, user/provider/account, pending state, and absent target before
  clearing only the reason. Attempted POSTs, resolved targets, changed rows, and
  failed cleanup retain conservative recovery. This is positive invocation-local
  boundary evidence, not inference from error labels or an empty inventory.
  Failed transactions cancel late discovery before cleanup; a still-running
  callback therefore cannot issue a POST after release.
- Provider-free tests exercise the actual adapter, callback, and service.
  Provider consent, scope behavior, transaction timeouts, interrupted creation,
  and isolated acceptance still require the separately authorized QA stage.
- Current local receipt: the named Calendar group passes 81/81, including
  inactive-history, provider deadlines, deferred event inserts, accepted but
  invisible calendar creation, final-transaction rollback, and direct disconnect
  protection, proven pre-POST retry/release safeguards, and late-discovery
  cancellation, aggregate validation/event pagination, and outbound ID retention
  after read-budget exhaustion. The transaction
  double models rollback; it does not prove live PostgreSQL concurrency.
  Initial CI and the first local repair run found the stale project-state date
  ceiling; its bound now matches the October 2 evidence. The final full suite
  passed 5,105 of 5,108 tests with three expected skips and no failures. Final
  lint, typecheck, build, diff checks, and all 90 relative links in the reviewed
  migration docs pass. All seven hosted CI jobs pass at reviewed head
  `0c3241cb3052877f07453d31b97b71ae4337e3eb`. Full CodeRabbit review covers
  all eighteen files without actionable comments or retained architecture
  concerns; Codex reports no findings and no review threads remain unresolved.
  Local builds skip the
  Vercel Production migration gate and do not deploy. Historical
  pre-publication validation remains in the dated project log.
- Completion boundary: reviewed, merged source preparation only. The existing source owners
  remain below the 800-line pressure signal; the callback is smaller and no
  schema, parallel provider owner, or dependency was added. Compatibility
  identifiers are retained for both projects and require a separate proven
  migration before retirement. No provider behavior is claimed from fixtures.
- Next steps: identify the existing Cloud/OAuth targets and prepare the exact
  provider/QA proposal; technical target identification is operator work, not
  an unexplained project-choice question for the user. Source-only PR #36 is
  merged and its final reviews are complete. The separate
  [Vercel integration plan](2026-10-02-atmoshaper-vercel-git-integration.md)
  owns project naming, repository linkage, and deployment controls. Neither
  source merge nor a future Git connection authorizes Calendar activation.

API contract sources: [Calendar metadata retrieval and authorized scopes](https://developers.google.com/workspace/calendar/api/v3/reference/calendars/get),
[calendar inventory pagination](https://developers.google.com/workspace/calendar/api/v3/reference/calendarList/list),
[Google UserInfo](https://developers.google.com/identity/openid-connect/openid-connect#obtaininguserprofileinformation).

Before any provider write, identify the exact authorized AtmoShaper Google
Cloud project, Calendar OAuth client, deployment tier, and callback. Do not
infer these from the legacy client or from a public hostname. Prepare the
canonical callback `https://www.atmoshaper.com/api/calendar/google/callback`
and reconcile it against the actual auth host before configuring it.

The current source requests `openid`, `email`, `calendar.app.created`,
`calendar.calendarlist.readonly`, `calendar.events.freebusy`, and
`calendar.events.readonly` (Calendar scopes use Google's full URI prefix).
Google documents the scope permissions and calls for the narrowest required
access. Scope verification is a separate readiness gate; completed brand
verification for sign-in does not establish approval of Calendar scopes.
Use separate testing and production projects as required by Google's OAuth
policies. Record only sanitized readiness outcomes in repository docs.

Sources: [Calendar API scopes](https://developers.google.com/workspace/calendar/api/auth),
[sensitive-scope verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification),
[OAuth project policy](https://developers.google.com/identity/protocols/oauth2/policies).

Provider setup, secret provisioning, callback/scope changes, and public
activation each need exact authorization under the migration charter. Prepare
the actual configuration proposal and rollback first. Do not ask for a blanket
integration approval before the target and operations are reviewable.

## Isolated acceptance and rollout

Pending-intent recovery is fail-closed. First obtain authorized read-only
identity, scope, complete hidden/paginated inventory, and metadata evidence.
One validated target can be reconciled by reconnecting without a new POST.
An empty listing, elapsed time, or a generic provider error does not prove the
previous insert was never accepted. Unresolved/ambiguous outcomes require exact
provider/row authority and a reviewable reconciliation proposal; do not clear
the reason, delete rows, or repeat creation automatically. An interrupted
invocation may also have committed its intent before submitting the POST.

Prepare a separate, explicitly authorized QA scope with an owned synthetic
account and calendar, approved callback, non-production database, and no real
appointments, client data, or browser records. Its authorization must state
calendar creation/event mutation, token/row writes, exact cleanup, and the
permitted build or deployment. No repeated live payment test is needed.

Verify consent and anti-CSRF handling, encrypted token persistence, reconnect
without duplicates, independent calendar selection, generic busy-block import,
minimal outbound events, and retained access to the old project's calendar.
Preserve sanitized receipts; deleting fixtures requires exact ownership proof
and never includes pre-existing calendars or events.

Public activation follows separate reviewed code, provider readiness, QA, and
exact deployment authorization. Rollback disables only the new integration's
approved configuration and restores its saved deployment/configuration.
Disable the integration before restoring older code that does not recognize
the pending intent; otherwise it could blindly retry the uncertain creation.
Preserve existing calendar contents, mappings, tokens, and both projects' data;
calendar deletion or token revocation is not an implied rollback operation.
