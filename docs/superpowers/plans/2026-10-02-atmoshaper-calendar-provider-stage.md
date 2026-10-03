# AtmoShaper Calendar provider-stage checkpoint

Status: local preparation; existing Production project/registration identified
from user readback, with API/consent/scope readiness and test targets unverified.
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
- The user's Clients screenshot shows the `AtmoShaper Production` project and
  one visible Web application registration, `AtmoShaper Production Web`, created
  September 26. No separate Calendar row is shown. This satisfies the original
  inventory question but does not prove the existing registration's saved
  redirects or its project's API/scope/consent readiness. Do not infer that
  another client must be created from its display name. The subsequent user's
  URL-only readback lists `https://www.atmoshaper.com/api/auth/callback/google`;
  the Calendar callback is absent from this supplied list.
- Earlier browser inventory failed during startup. The current read-only
  Console attempt was denied because the browser security check could not
  verify its admin-enforced policy. No indirect workaround or alternate browser
  was used. The client-list and URL-only questions are now satisfied, with no
  secrets or setting changes. Google Cloud-admin CLI/connector
  access is unavailable; saved API/consent readiness and test targets remain
  unverified.

## Exact registration setup; approved, execution pending

The user approved this exact registration-only scope. Automated browser access
remains denied; the user will perform the Google UI step. Creation and saved
return-URI verification are not yet confirmed. Do not create a duplicate if a
submission's outcome is uncertain; first inspect the Clients list.

Prepare one new Web application registration in the user's identified existing
`AtmoShaper Production` project:

| Setting | Proposed value |
| --- | --- |
| Application type | Web application |
| Name | AtmoShaper Calendar Production Web |
| Authorized redirect URI | `https://www.atmoshaper.com/api/calendar/google/callback` |
| JavaScript origins | No additional origin required by this server-side Calendar redirect flow |
| Existing registration | Preserve `AtmoShaper Production Web` and its sign-in callback unchanged |

This is an operator recommendation to keep Calendar credentials separate from
the already working sign-in credentials, not a Google requirement to use a
different client for each API. No project replacement or legacy change is
proposed. Creating this registration alone does not enable Calendar sync in the
app, grant a user's Calendar permission, create a calendar, or deploy anything.

Creation authority is now received for the scope above. Automated browser access
is denied, so do not attempt another browser
or indirect control path. The user must perform the approved Google UI step.
Retain the newly issued credential securely outside chat, source trees, and
screenshots before closing its creation dialog; Google documents that the
secret is shown only at creation. Secure hosting provisioning is a separate
later operation. Do not rotate/export the existing sign-in secret or add the
new client ID/secret to Vercel as an implied follow-up.

User-guided steps: in the existing project, choose Create client, select Web
application, enter the approved name, leave JavaScript origins empty for this
server-side flow, add the single approved redirect URI, and choose Create.
Securely retain the issued credential outside the source tree before closing
the result. Obtain only a creation confirmation and non-secret callback
readback. Any prompt to change API, consent, publishing, or scopes is outside
this approval and requires a separate reviewable proposal.

No API enablement, consent audience/publishing/scope edit, verification submission,
QA resource, database write, Calendar/event operation, or Production activation
is included in this registration-only proposal. Saved API/consent/scope checks
and isolated test-project/client identification remain required before those
later exact proposals. Starting the app integration by provisioning credentials
would expose its connect route before full acceptance, so defer that operation.

Primary creation/callback/credential-retention reference:
[Google's server-side OAuth guide](https://developers.google.com/identity/protocols/oauth2/web-server).

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
