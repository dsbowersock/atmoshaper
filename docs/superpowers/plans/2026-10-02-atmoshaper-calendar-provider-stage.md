# AtmoShaper Calendar provider-stage checkpoint

Status: local preparation; registration created by user report. October 3
screenshots establish External / In production and empty declared scope lists;
branding is verified/shown, while Calendar API is disabled. Minimum-access
Calendar permission review, provider acceptance, and test targets remain pending.
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
- The user's 2026-10-03 Data Access screenshot shows no rows in all three
  declared scope lists: non-sensitive, sensitive, and restricted. Their Audience
  screenshot shows `In production` and `External`. This establishes declared
  configuration only, not actual token grants, Calendar API enablement, or
  Calendar permission verification. Do not switch this working Production
  project back to Testing or assume an empty list means sign-in is broken.
- Later October 3 screenshots show branding verified and shown to users, with
  data-access verification not required because no sensitive/restricted scopes
  are declared. The Google Calendar API page shows `Enable`: it is disabled in
  this project. This is proof of those settings only, not approval of future
  Calendar scopes or a completed user consent/Calendar flow.
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
  access is unavailable; isolated test targets remain unverified. All requested
  Data Access, Audience, Verification Center, and Calendar API readbacks are
  satisfied by the user's screenshots; do not ask to repeat them.

## Exact registration setup; user reports created

The user approved this exact registration-only scope and subsequently replied
`created` after following the user-guided instructions. Creation is recorded
from that user receipt; saved return settings and API/consent/scope readiness
are not independently verified. Do not repeat Create. Automated browser access
remains denied. All requested project-level readbacks are now received;
the new registration's saved non-secret callback remains pending before
credential provisioning. Do not repeat the completed setup or scope/audience
questions.
The user also reports downloading the credential JSON issued at creation.
Its location and contents were not accessed, and no values are recorded here.
Retain it privately outside source trees; provisioning remains separately gated.

The approved, user-reported registration in the identified existing
`AtmoShaper Production` project has this intended configuration:

| Setting | Approved intended value; saved readback pending |
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

Historical user-guided creation steps (completed by user report): in the existing project, choose Create client, select Web
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

## October 3 declared-permission checkpoint

The screenshots establish publishing and audience configuration, with no
declared permissions. The app's reviewed source and installed provider defaults
request the following permissions. This inventory is a configuration proposal
input, not approval to add them or a completed least-access/verification review.

| Requested permission | Current use / access limit |
| --- | --- |
| `openid` | Google account identity for sign-in and Calendar account matching |
| `email` | Email identity in both flows; the Console may display the equivalent `userinfo.email` URL |
| `profile` | Existing sign-in provider default for name/picture; not requested separately by Calendar. The Console may display the equivalent `userinfo.profile` URL |
| `https://www.googleapis.com/auth/calendar.app.created` | Create the dedicated secondary calendar and manage its events; validated app-owned target required by the source |
| `https://www.googleapis.com/auth/calendar.calendarlist.readonly` | Discover the user's calendars and validate/select sync sources |
| `https://www.googleapis.com/auth/calendar.events.freebusy` | Availability access in the existing Calendar request/validator; review its necessity alongside the event-read permission before a scope edit |
| `https://www.googleapis.com/auth/calendar.events.readonly` | Read event pages and incremental sync state for busy-block import; this Google grant permits event reads beyond the minimal fields AtmoShaper persists |

The list above comes from `lib/calendar-sync-constants.ts`, `auth.ts`, and the
installed Auth.js provider defaults. Inbound normalization drops personal event
details from persisted busy blocks; this must not be described as proof that
Google grants only time/status access or that the provider response contains no
event details. Review each permission's necessity and Console classification
before declaring a final set. No new broad Calendar write scope is proposed.

The remaining read-only questions were sent together and are now satisfied:

1. Verification Center shows branding verified/shown and data-access review not
   required for the currently empty declared sensitive/restricted scope lists.
2. Google Calendar API shows Enable, establishing it is disabled.

Do not repeat those checks. API enablement needs exact approval as proposed
below; the missing permission declaration needs a separate scoped settings
proposal. Changing publishing/audience, submitting verification, granting user
access, provisioning credentials, and activating Calendar are not implied.
Keep working sign-in and the existing Production publishing state intact.

Primary guidance checked 2026-10-03:
[declaring permissions](https://developers.google.com/workspace/guides/configure-oauth-consent),
[minimum access and Production verification](https://developers.google.com/identity/protocols/oauth2/policies),
and [Calendar permission meanings](https://developers.google.com/workspace/calendar/api/auth).
These are provider requirements, not proof of this project's review outcome.

## Exact next operation: enable Calendar API only; approval pending

| Boundary | Proposed operation |
| --- | --- |
| Existing target | Identified AtmoShaper Production project, already shown in the user's screenshots |
| Service | Google Calendar API only |
| Action | On the observed API page, choose Enable once after exact approval |
| Acceptance | Read back API enabled / Manage in that same project |
| Execution | User-guided Console step because browser automation remains denied; no alternate control path |
| Excluded | Scope/consent/publishing edits, verification submission, client/secret changes, hosting provisioning, QA resources, Calendar/event/database activity, deployment, and activation |

API enablement makes the service available to this project's permitted API
callers. It does not itself authorize a user's Calendar access, create a
calendar, store tokens, or activate AtmoShaper sync. Existing working sign-in
registration/callback and Production publishing configuration remain intact.
The prior registration-only approval explicitly excluded API changes; approval
for this specific operation is pending. Do not instruct execution as already
authorized or infer approval from a screenshot supplied for readback.

After approval, use the already observed Google Calendar API page, verify the
project display, select Enable, wait for its normal result, and obtain only
the non-secret enabled-state readback. Finish at that boundary. Follow-on
permission declaration, minimum-access review, isolated provider acceptance,
secure credential provisioning, and public activation retain their own scope.
Do not change audience back to Testing in this working Production project.

[Google's API enablement instructions](https://developers.google.com/workspace/calendar/api/quickstart/nodejs#enable_the_api)
confirm the project-level prerequisite. Only that subsection is relevant here;
its desktop-client sample, credential-file placement, and live Calendar reads
are not the approved Web integration workflow.

## Resolve exact targets before configuration approval

Use the identified Production project and user-reported separate Calendar
registration; do not propose another client or repeat its creation. Confirm the
saved Calendar redirect, Calendar API enablement, Verification Center outcome,
and appropriate isolated test targets before provisioning. Audience/publishing
and Data Access readbacks are recorded above. Preserve shared consent settings.
Keep private project/client identifiers, credentials, tokens, accounts, and
calendar contents out of repository docs. Record sanitized readiness only.

Keep the existing working sign-in client/callback unchanged. Project-level
declared-permission changes are shared by the project's clients; they do not
change the separate permission lists each runtime flow actually requests.
Review their consequences before asking for a settings change. No legacy
Google project or client change is proposed.

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
