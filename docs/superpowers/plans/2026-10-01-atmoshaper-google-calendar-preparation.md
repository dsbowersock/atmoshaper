# AtmoShaper Google Calendar preparation

Status: prepared, 2026-10-01. The user selected a separate calendar named
`AtmoShaper`. This plan records the next integration work; no runtime, OAuth,
calendar, database, environment, or deployment change is implemented here.

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
- `lib/google-calendar-adapter.ts` currently discovers a calendar by the
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
