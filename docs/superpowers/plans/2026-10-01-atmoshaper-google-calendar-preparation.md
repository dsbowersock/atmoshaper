# AtmoShaper Google Calendar preparation

Status: published as PR #36; CodeRabbit shepherding authorized,
2026-10-02. The user selected
a separate calendar named `AtmoShaper`. Repository preparation is authorized by
the migration continuation; provider configuration and public activation remain
separate gates. This branch applies no hosted changes.

Read [project state](../../project-state.md), [project log](../../project-log.md),
and the [remaining migration ledger](../../wiki/migration-status.md) first.
MassageLab will continue as a separate project after the platform migration.
Preserve its current full service and existing calendars. Its future product
direction is outside this AtmoShaper migration work.

## Evidence and boundaries

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
  Callback discovery and persistence share the existing user-row lock;
  concurrent reconnects serialize. A different active account or saved target
  requires explicit disconnect instead of silently deleting its sync state.
  Inactive rows for other accounts remain preserved history; a returning
  account still validates its stored target. Eight-second request limits and
  a shared 30-second provider deadline start before lock acquisition and stop
  further paginated requests before the 45-second transaction expires.
  Read-only target validation also precedes inbound and outbound sync.
- New event inserts preserve the existing provider-generated ID and wait
  behavior. An introduced local timeout could discard an accepted POST's ID
  and cause a duplicate retry. Reads and existing-ID updates remain bounded;
  do not introduce a durable event-ID contract without its own compatibility
  proof. End-to-end duplicate/transport-failure acceptance remains in provider QA.
- A failed provider operation can leave an owned, marked calendar before the
  database transaction commits. The next connection discovers that calendar;
  this code does not delete it or rename an existing calendar during recovery.
- Provider-free tests exercise the actual adapter, callback, and service.
  Provider consent, scope behavior, transaction timeouts, interrupted creation,
  and isolated acceptance still require the separately authorized QA stage.
- Current local receipt: the named Calendar group passes 63/63, including
  inactive-history, provider-deadline, and deferred event-insert regressions.
  Initial CI and the first local repair run found the stale project-state date
  ceiling; its bound now matches the October 2 evidence. The final full suite
  passes 5,087 of 5,090 tests with three skips and no failures. Lint, typecheck,
  build, diff checks, and all 65 relative documentation links pass. Required
  final-head hosted follow-up is tracked in PR #36. Local builds skip the
  Vercel Production migration gate and do not deploy. Historical
  pre-publication validation remains in the dated project log.
- Completion boundary: local preparation only. The existing source owners
  remain below the 800-line pressure signal; the callback is smaller and no
  schema, parallel provider owner, or dependency was added. Compatibility
  identifiers are retained for both projects and require a separate proven
  migration before retirement. No provider behavior is claimed from fixtures.
- Next steps: complete final-head hosted checks and reviews in the
  user-authorized [PR #36](https://github.com/dsbowersock/atmoshaper/pull/36),
  triggering CodeRabbit when eligible. Merge requires separate approval.
  Then identify the
  authorized Cloud/OAuth target and prepare the exact provider/QA proposal.

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
Preserve existing calendar contents, mappings, tokens, and both projects' data;
calendar deletion or token revocation is not an implied rollback operation.
