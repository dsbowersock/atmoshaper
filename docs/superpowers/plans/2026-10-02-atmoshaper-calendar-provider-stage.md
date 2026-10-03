# AtmoShaper Calendar provider-stage checkpoint

Status: local preparation; registration created by user report. October 3
screenshots establish External / In production and empty declared scope lists;
branding is verified/shown. After the separately approved API-only step, the user
reports `Enabled`; independent provider readback is not claimed. PR #39
removes one redundant requested grant while preserving prior-token compatibility.
Its final-head reviews and separately approved merge and automatic unpromoted
build are complete. The exact Google declaration is separately approved;
user save and classification/Verification Center readback, applicable
verification, provider acceptance, and test targets remain pending. The earlier
selection/save guide omitted justification and video preparation. Subsequent
draft UI screenshots classify event-read access as sensitive and request a
usage explanation and demonstration link. Leave the draft unsaved while
checking the narrower availability grant; no saved declaration is claimed.
The earlier
implementation merged in PR #36 and is included in the approved public PR #37
artifact; the narrower PR #39 candidate is verified but unpromoted. Working sign-in and Vercel integration remain
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
  are declared. The earlier Google Calendar API page showed `Enable`.
  Following the exact approved step, the user now reports `Enabled`; this is
  an execution receipt, not an independent provider read. API enablement does
  not approve future Calendar scopes or establish a completed user consent flow.
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
declared permissions. The PR #39 candidate and unchanged sign-in provider
defaults use the following six semantic permissions. The Console uses the full
`userinfo` URLs for the `email`/`profile` aliases. The user separately approved
this exact declaration after source review. Saved Console classifications and
applicable verification remain pending; approval is not an execution receipt
or a completed least-access/verification review.

| Approved declaration; user save pending | Candidate/current use and access limit |
| --- | --- |
| `openid` | Google account identity for sign-in and Calendar account matching |
| `https://www.googleapis.com/auth/userinfo.email` | The `email` request alias supplies email identity in both flows |
| `https://www.googleapis.com/auth/userinfo.profile` | The `profile` alias is the existing sign-in default for name/picture; Calendar does not request it |
| `https://www.googleapis.com/auth/calendar.app.created` | Create the dedicated secondary calendar and manage its events; validated app-owned target required by the source |
| `https://www.googleapis.com/auth/calendar.calendarlist.readonly` | Discover the user's calendars and validate/select sync sources |
| `https://www.googleapis.com/auth/calendar.events.readonly` | Read event pages and incremental sync state for busy-block import; this Google grant permits event reads beyond the minimal fields AtmoShaper persists |

The candidate comes from `lib/calendar-sync-constants.ts`, `auth.ts`, and the
installed Auth.js provider defaults. It removes `calendar.events.freebusy` from
new Calendar requests and required grants. The actual adapter uses `events.list`,
whose [authorization reference](https://developers.google.com/workspace/calendar/api/v3/reference/events/list)
accepts event-read access without a separate free/busy grant. The candidate keeps
the existing event-read import, event IDs, cancellations, transparency, paging,
and incremental cursor behavior. It does not switch to an availability-only
implementation or prove that no narrower future design is possible.

The validator still requires all three Calendar grants and rejects additional
Calendar permissions, except the prior `calendar.events.freebusy` grant. That
legacy read-only grant cannot replace required grants or broaden calendar
metadata/write access; accepting it preserves reconnect and token refresh
without rewriting, revoking, or rotating existing credentials. The public
PR #37 request still contains all four Calendar grants until a separately
reviewed and approved rollout replaces it.

Inbound normalization drops personal event
details from persisted busy blocks; this must not be described as proof that
Google grants only time/status access or that the provider response contains no
event details. Review each permission's necessity and Console classification
before declaring a final set. No new broad Calendar write scope is proposed.

The remaining read-only questions were sent together and are now satisfied:

1. Verification Center shows branding verified/shown and data-access review not
   required for the currently empty declared sensitive/restricted scope lists.
2. Google Calendar API initially showed Enable. The user subsequently reports
   enabled after the exact approved API-only step.

Do not repeat those checks or API enablement. The completed API-only step is
recorded below; the missing permission declaration needs a separate scoped settings
proposal. Changing publishing/audience, submitting verification, granting user
access, provisioning credentials, and activating Calendar are not implied.
Keep working sign-in and the existing Production publishing state intact.

Primary guidance checked 2026-10-03:
[declaring permissions](https://developers.google.com/workspace/guides/configure-oauth-consent),
[minimum access and Production verification](https://developers.google.com/identity/protocols/oauth2/policies),
and [Calendar permission meanings](https://developers.google.com/workspace/calendar/api/auth).
These are provider requirements, not proof of this project's review outcome.

## Completed API-only operation; user execution receipt

| Boundary | Approved operation and receipt |
| --- | --- |
| Existing target | Identified AtmoShaper Production project, already shown in the user's screenshots |
| Service | Google Calendar API only |
| Action | Enable only the Google Calendar API under the received exact approval |
| Receipt | User replied `Enabled` on October 3 after the guided step; no independent API read is claimed |
| Execution | Performed by the user; browser automation remains denied and no alternate control path was used |
| Excluded | Scope/consent/publishing edits, verification submission, client/secret changes, hosting provisioning, QA resources, Calendar/event/database activity, deployment, and activation |

API enablement makes the service available to this project's permitted API
callers. It does not itself authorize a user's Calendar access, create a
calendar, store tokens, or activate AtmoShaper sync. Existing working sign-in
registration/callback and Production publishing configuration remain intact.
The prior registration-only approval explicitly excluded API changes. The user
subsequently answered `yes` to guiding this exact API-only operation, then
reported `Enabled`. Record that execution receipt and do not repeat the step.

That approved operation is finished at its boundary. Follow-on
permission declaration, minimum-access review, isolated provider acceptance,
secure credential provisioning, and public activation retain their own scope.
Do not change audience back to Testing in this working Production project.

[Google's API enablement instructions](https://developers.google.com/workspace/calendar/api/quickstart/nodejs#enable_the_api)
confirm the project-level prerequisite. Only that subsection is relevant here;
its desktop-client sample, credential-file placement, and live Calendar reads
are not the approved Web integration workflow.

## Completed source review, merge, and unpromoted candidate

[PR #39](https://github.com/dsbowersock/atmoshaper/pull/39) passed all seven CI
jobs and Vercel at reviewed head `7064a6fb63340fabc29adfd695e0824a1d21c2ed`.
CodeRabbit's explicitly triggered full review covered all thirteen files with
zero actionable comments; Codex reported no major issues and no unresolved
inline threads remained. Local Calendar tests pass 83/83; lint/typecheck pass;
the full unit suite passes with 5,114 passed, three skipped, and zero failures.
These Calendar tests use synthetic provider and transaction doubles.

After separate exact approval, PR #39 merged at `2026-10-03T17:02:47Z` as
`2e01e8509b42ab73c85d286f2725c824770aeeec`. Its automatic Production candidate
reached `READY` at `2026-10-03T17:05:28.696Z`, with actual migration-status and
live Supporter readiness gates and all seven normal authenticated GET checks
passing. Registration remains open and the signed-out session is `null`.
All six saved live assignments and the public target remain on PR #37; no
restoration was needed. Manual promotion, apex redirect, protection, empty
Preview configuration, and absent Calendar keys remain verified. The candidate
is unpromoted. No manual build or completed live payment test was repeated.

## Exact Google Data Access operation approved; user save pending

The existing project already has working sign-in, verified branding, the
user-created Calendar registration, and completed API enablement. Its supplied
Data Access lists are empty. This step declares what the reviewed app needs;
it does not repeat client creation or API enablement.

| Boundary | Prepared operation |
| --- | --- |
| Target | Existing AtmoShaper Production project, Google Auth Platform > Data Access |
| Exact declaration | The six approved entries in the permission table above: three identity entries and three Calendar entries; omit the redundant `calendar.events.freebusy` grant |
| Operator action | Use Add or Remove Scopes, select only those six entries, update the selection, and save the declaration |
| Readback | Copy only the saved scope URLs and their non-sensitive/sensitive/restricted categories; inspect Verification Center and report required actions |
| Preserved settings | Working sign-in registration/callback, verified branding, and External / In production audience |
| Execution | User-guided Console step because automated access remains denied; no alternate control path |
| Excluded | Verification submission, audience/publishing changes, client/secret edits, real user consent, hosting credentials, QA resources, calendar/event/database activity, deployment/promotion, and public activation |

The sign-in identity entries preserve its existing defaults; Calendar does not
request profile access. App-created-calendar access supports the dedicated
target, calendar-list read access supports discovery/source selection, and
event-read access preserves event-page/incremental import. Event-read access is
broader than the minimal busy-block fields retained by AtmoShaper. This proposal
does not claim that an alternative availability-only implementation could not
use narrower access. Inspect Google's actual saved classifications and required
verification actions before planning the subsequent provider acceptance stage.

The user annotated this prepared Google settings request with `approved`.
This is separate from the PR #39 merge/build approval and satisfies authority
for only the operation above. Do not ask for the same declaration approval
again. Guide the user save and collect the non-secret outcome; no execution or
verification result is claimed until that receipt arrives.

## Draft justification and video checkpoint; declaration remains unsaved

The user's subsequent screenshots show the event-read grant in the sensitive
section with approval required, a justification field limited to 1,000
characters, and a demonstration-video section. The visible restricted section
has no rows. Neither screenshot proves all six entries saved or establishes a
Verification Center decision. The demo warning prohibits exposing unverified
permissions to Production users and asks for a staged/test demonstration. The
video must cover the OAuth clients assigned to the project. Do not infer that
the video link is optional for Save, invent a link, delete a client to avoid
coverage, or treat Save as a completed verification submission.

The following 650-character text is an accurate usage draft, not a final
justification that all narrower permissions are insufficient:

> AtmoShaper's optional Calendar sync reads calendars selected by the user to create generic busy blocks and prevent scheduling conflicts. It uses event IDs, start/end times, time zones, busy/free status and cancellation changes for incremental synchronization. Imported event titles, descriptions, locations and attendees are not stored or displayed. App-created-calendar access alone cannot read existing selected calendars. Imported calendars are read-only; writes use a separate app-created-calendar permission. We are evaluating whether narrower availability-only access can preserve this behavior before public rollout or verification submission.

The actual adapter calls `events.list` with single-event expansion, deleted
events, paging, and a sync cursor. Normalization persists provider event ID,
etag, time window/time zone, all-day/transparency and busy/free/cancelled status;
cancelled tombstones remove stale blocks. It drops personal event text. The
adapter does not currently use a response-field mask; TypeScript response
types do not filter Google's payload. Do not claim only time/status reaches
the server or that the event-read grant cannot expose personal event details.

Google's [event-list authorization reference](https://developers.google.com/workspace/calendar/api/v3/reference/events/list)
also accepts `calendar.events.freebusy`. The
[Freebusy query](https://developers.google.com/workspace/calendar/api/v3/reference/freebusy/query)
returns time ranges without per-event identities/cursors, but that fact does
not establish which fields event-list reads return under the narrower grant.
The merged duplicate-grant reduction does not prove least-access necessity.
Keep the current source unchanged until the comparison establishes a concrete
compatible alternative or a documented missing capability.

Extend the bounded isolated acceptance proposal below with these comparisons
before requesting execution authority:

| Comparison | Evidence needed |
| --- | --- |
| Availability grant vs event-read grant | Real event-list responses for the same owned synthetic fixtures; confirm IDs, times/time zones, transparency, cancellations, etags, paging and incremental cursors without collecting real event data |
| Recurring/change handling | Expanded instances, changed times, transparent events and cancelled/deleted instances preserve busy-block updates and removal under each grant |
| Selected sources | Distinguish owned and explicitly shared synthetic source access; app-created-only or owned-only access must not silently exclude allowed selected sources |
| Decision | Prefer a narrower compatible grant if proven; otherwise identify the exact missing fields/operations and explain the feature need. Source mocks and scope validators are not provider proof |

No provider-backed comparison or test-resource creation is authorized by the
declaration approval. Keep the existing fixture ceilings and settle exact
targets/callbacks, grants, operations, data ownership, and cleanup first. A
changed declaration set needs a new exact proposal, not a silent substitution.

If a sensitive grant remains necessary, prepare an English recording of actual
Google sign-in and the isolated Calendar grant/use flow, app branding, the
required OAuth address-bar/client context, user-selected source import,
synthetic change/cancellation reconciliation, and generic busy blocks. Include
all applicable project clients as the Console requires. Preserve Production
sign-in/publishing and do not put unverified Calendar grants in public traffic.
No Production credentials or real calendars/events belong in this demo.
Uploading the real video as Unlisted and submitting a verification request are
separate future operations requiring exact authority. A storyboard is not
evidence of a working consent flow.

Primary [sensitive-scope review guidance](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification)
checked October 3 requires the least necessary permissions, a narrower-scope
justification, and a real consent/functionality video for sensitive-scope review.
Saved classifications, the scope comparison, demo, and verification remain open.

## Resolve exact targets before configuration approval

Use the identified Production project and user-reported separate Calendar
registration; do not propose another client or repeat its creation. Confirm the
saved Calendar redirect, applicable new-scope Verification Center outcome,
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

The PR #39 candidate requests `openid`, `email`, `calendar.app.created`,
`calendar.calendarlist.readonly`, and `calendar.events.readonly`, using Google's
full URI prefix for Calendar scopes. Published/live source additionally requests
`calendar.events.freebusy`; see the compatibility boundary above.
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
