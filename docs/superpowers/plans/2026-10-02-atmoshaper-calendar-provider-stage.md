# AtmoShaper Calendar provider-stage checkpoint

Status: local preparation; exact Google-console targets remain unverified.
Source implementation is reviewed, merged in PR #36, and included in the
approved public PR #37 artifact. Working sign-in and Vercel integration remain
complete. Do not repeat them or the completed live payment test.

Read [project state](../../project-state.md), [project log](../../project-log.md),
the [migration ledger](../../wiki/migration-status.md), and the
[Calendar compatibility plan](2026-10-01-atmoshaper-google-calendar-preparation.md).
This consolidates earlier operator drafts into the repository. Provider writes,
QA resource creation, Calendar/event activity, token/database writes, deployment,
and public activation require their own exact, reviewable authorization.

## Current evidence

- The user selected a separate calendar named `AtmoShaper`. Keep the existing
  MassageLab calendars, full service, sign-in client, and histories intact.
  This naming choice alone does not require a new Google Cloud project.
- Fresh authenticated Vercel name-only inventory lacks
  `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`,
  `GOOGLE_CALENDAR_REDIRECT_URI`, and `CALENDAR_SYNC_ENCRYPTION_KEY`.
  Existing variables remain Production-only; none were copied into Preview.
  This proves incomplete app configuration, not absence of a Google-side client.
- Existing Google sign-in works. Calendar needs additional API grants and
  separate configuration. Sign-in branding verification does not establish
  saved Calendar-scope verification or callback permission.
- Browser inventory fails before console access because its runtime cannot
  start; no Google Cloud-admin connector or installed Cloud CLI is available.
  A narrow user question asks whether the existing project's Clients page has
  a Calendar-specific Web application client. No secret values are requested.

## Resolve exact targets before configuration approval

Privately identify the existing sign-in project's ownership and deployment
tier, any Calendar Web application client, and shared legacy consent settings.
Read its saved redirects, Calendar API enablement, consent audience/publishing
status, Data Access scopes, Verification Center outcome, and test-account access.
Keep private project/client identifiers, credentials, tokens, accounts, and
calendar contents out of repository docs. Record sanitized readiness only.

Prefer an appropriate existing Calendar client. If absent, propose a dedicated
Calendar Web application client in the existing AtmoShaper Production project
after ownership/tier and shared-consent consequences are known. Preserve the
working sign-in callback. If this would affect the old service, explain the
specific consequence and alternative before asking for a decision.

The proposed Production callback is
`https://www.atmoshaper.com/api/calendar/google/callback`, distinct from sign-in's
`/api/auth/callback/google`. Reconcile it with the saved canonical auth host.
Provisioning the four settings is a later exact operation; never paste secrets
into chat or commit them. The presence helper alone does not prove encryption
key validity, consent readiness, or provider acceptance.

Current source requests `openid`, `email`, `calendar.app.created`,
`calendar.calendarlist.readonly`, `calendar.events.freebusy`, and
`calendar.events.readonly`, using Google's full URI prefix for Calendar scopes.
Review each grant's necessity and saved classification/verification; do not
substitute broader Calendar write grants. Use separate testing and Production
projects under Google's policy; locate an appropriate existing test project
before proposing a new one.

Primary references checked 2026-10-02:
[Calendar scopes](https://developers.google.com/workspace/calendar/api/auth),
[scope verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification),
and [OAuth project policy](https://developers.google.com/identity/protocols/oauth2/policies).
These explain requirements, not this project's saved state.

## Bounded isolated acceptance proposal

Prepare an owned local app and explicit Google-permitted test callback; choose
the exact loopback port after availability and cookie/origin checks. Do not
attach to occupied servers or create a public deployment solely for this draft.
Use test-project credentials, inert unrelated providers/telemetry, and no
Production secrets or real data. Never load `.env.local` values as QA authority.

The real application uses the Neon Prisma adapter. Ordinary local PostgreSQL
availability does not prove compatibility with that path. If temporary Neon is
needed, propose one independent empty target, exact owner, schema initialization,
synthetic writes, and mandatory owned deletion/absence proof before execution.
Do not use Production, clone rows, or silently substitute an existing project.

Proposed maximum: one synthetic app account, two owned Google test accounts,
four owned secondary calendars, and six synthetic events. These are limits,
not creation/deletion authority. App access must use authoritative
OWNER/THERAPIST practice role plus `external_calendar_sync`; Supporter membership
alone does not establish it. Provision fixtures without Checkout or payments.

| Acceptance | Required proof |
| --- | --- |
| Access/consent | Real role/feature gate, allowed scopes, one-use state and rejected-state handling on the approved callback |
| Isolation | Account subject, owned non-primary target, marker, full hidden/paginated inventory and metadata agree; legacy calendar untouched |
| Reconnect | Renamed stored target reused without another POST; changed account, shared/primary and ambiguous targets fail closed |
| Transactions | Real PostgreSQL lock serialization and rollback; committed inactive intent survives failed activation |
| Interrupted creation | Accepted/uncertain POST retains intent; an empty listing or lost response cannot authorize another create |
| Sync | Generic times/status only, bounded reads, failed cursors preserved, accepted event IDs retained |
| Disconnect | Pending intent protected from direct deletion; resolved disconnect preserves provider contents |
| Cleanup | Delete only positively owned task-created fixtures under exact approval; preserve pre-existing/primary/legacy resources |

Settle exact account access, harness/fault injection, callback/provider operations,
database writes, output ownership, and cleanup before asking for execution.
Transaction/transport doubles do not establish real locks or provider consistency.

## Activation and rollback

After isolated acceptance and scope readiness pass, prepare exact Production
configuration, reviewed source, one staged build, verification, and a separate
public-promotion decision. Keep manual promotion and registration/Supporter
Checkout open; one-time support and background purchases remain disabled.

Disable only the new integration and drain its in-flight work before restoring
older code that lacks pending-intent handling. Preserve encrypted tokens,
pending intents, connections/sources/mappings, calendar/event contents, and both
projects' data. Revocation, calendar deletion, and row cleanup are not implied
rollback actions. Record the concrete procedure before rollout.
