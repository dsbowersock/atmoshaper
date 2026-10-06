# AtmoShaper Calendar permission comparison

Status: test configuration reported complete under `AtmoShaper Calendar Verify`.
Local runner implemented and mock/loopback checks passing. The concrete provider
comparison is now approved with two user-owned accounts. Credential preflight
passed October 3. The user identifies the configured test account separately
from the connected fixture owner. Both temporary calendar IDs are received
October 6; source 2's three synthetic resources are created and expanded
readback matches the four expected entries. The user now replies `events ready`
for source 1. The bounded identity-binding extension is implemented and locally
checked, allowing the event-read arm to run first with the same grant used for
binding. The first real consent passed issued-scope and account checks, then
stopped at source 1's calendar metadata before event reads. Its token was revoked.
The user's settings screenshots show source 1's calendar time zone is Eastern
Time – New York rather than UTC. Both temporary calendars must use UTC before a
fresh consent retry; no measured permission result is claimed.

Read [project state](../../project-state.md),
[project log](../../project-log.md), and the
[provider-stage checkpoint](2026-10-02-atmoshaper-calendar-provider-stage.md)
before using this plan. This comparison answers a permission question; it does
not replace full application, database-lock, or Calendar acceptance.

## Current next action and completed test-target discovery

Do not paste the usage draft or save the pending Production Data Access form.
The user was asked to discard only those unsaved changes and open the project
selector using the `AtmoShaper Production` name at the top of Google Console.
They replied `none` to the project inventory request: no
existing AtmoShaper testing/staging project is reported. This is a user readback,
not an independently authenticated project inventory or explicit discard receipt.
Automated Console access remains denied; no alternate control path is authorized.
The separate test setup is subsequently reported complete under the shortened
name below. Do not repeat this inventory or completed setup. The user supplied
the new test-credential JSON's local path and subsequently replies
`Approved; I have a second account` to the concrete test request. This authorizes
the bounded runtime and fixture operations below; do not request the same
approval again. The downloaded JSON was validated privately after that approval:
exact test project, Web registration, present secret, sole prepared callback and
no JavaScript origins all passed October 3. The user clarifies October 5 that
only the account they used to configure Google Cloud was added as a test user;
no calendars were made. Do not assert a provider-policy cause for their failed
other-account entry or repeat Console configuration. A fresh connected Calendar
profile read identifies their other owned account. Use the configured test user
for real OAuth consent and source 1 ownership, and the connected account for
source 2 ownership and its reader share to the test user. They need not be the
same account, and the fixture owner need not authorize the test app.
An operational preparation manifest outside tracked source retains the run
marker and private references without copying credential values. It is not
launchable comparison configuration until all exact fixture roots and expected
rows are bound. Both IDs are subsequently received and source-2 fixture
preparation is complete as recorded below. The first real consent and subsequent
metadata stop are recorded below; event binding and the measured comparison have
not started.

The existing Production registration, API enablement, working sign-in, and
declaration approval remain recorded. Do not repeat those operations. The
draft's video field does not establish whether Save can proceed without a URL;
never invent one or substitute a storyboard for a real demonstration.

## October 6 fixture preparation receipt and next user step

Both exact secondary-calendar IDs were supplied by the user and retained outside
tracked source. The connector profile still matches the approved fixture owner.
A source-2 read restricted to the fixed October 10–13 UTC window was empty.
Three sequential creates returned recorded synthetic identities and organizer
metadata matching source 2's exact run-specific name. The timed create initially
added the connector's own user as an attendee; that self-attendee was removed.
The other creates explicitly omitted self-attendance. No guests, reminders or
conference links remain. Expanded source-2 readback has exactly four confirmed
items with matching initial times and transparency. This is connector fixture
preparation, not evidence of either measured test-app permission.

Source 1 must be prepared manually in the configured test-user account; it is
unshared with the connector. Select the temporary calendar whose run-specific
name ends in `1` in each event's calendar selector. Do not use the account's
primary calendar. Create these three resources, with no guests, reminders,
conference links, descriptions or locations:

| Title | Initial event | Availability / repeat |
| --- | --- | --- |
| `Test timed` | October 10, 2026, 10:00–11:00 UTC | Busy; does not repeat |
| `Test all-day` | October 11, 2026 only; one all-day day | Busy; does not repeat |
| `Test recurring` | October 10, 2026, 14:00–14:30 UTC | Free; custom repeat every one day, ending after two occurrences |

For timed events set the event's time zone to UTC in More options > Time zone;
the calendar grid may otherwise display local time. The repeating event should
appear on October 10 and 11 only. Google's
[time-zone instructions](https://support.google.com/calendar/answer/37064?hl=en)
and [recurrence instructions](https://support.google.com/calendar/answer/37115?hl=en)
were checked October 6. Request a simple `events ready` receipt once saved;
do not ask the user to repeat Google Cloud setup or execution approval.

The user subsequently replies `events ready`, satisfying manual creation as an
owner execution receipt. Do not ask them to recreate events. The bounded binding
extension below is now implemented. It resolves source 1's roots under the
event-read arm after actual account/scope and both calendar metadata checks,
then invokes the strict known-ID comparison with the same grant. Source 2's roots
must still match the previously recorded connector identities. No real grant or
measured result is claimed by these local checks. Do not delete the temporary
calendars yet; cleanup follows the measured arms and revocation.

### First consent receipt and calendar time-zone correction

The user confirms the local page reported `Consent received`. Actual issued
scopes and configured test-account identity passed before Calendar access.
Preparation then stopped at source 1's calendar metadata check, before any
test-app event read or baseline. The original generic failure cannot distinguish
an HTTP access/API error from a name, zone or role mismatch. The issued test token
was successfully revoked, the callback listener closed and the owned run exited.
No bound fixture configuration or permission-comparison result exists yet.

The user's requested settings screenshots match the supplied source-1 ID and
configured test-user owner. The name's visible prefix matches the intended name,
but its full value is truncated. Its calendar time zone is Eastern Time – New
York instead of UTC, confirming one setup mismatch without proving it was the
only rejected field. Source 2's calendar time zone remains unverified.

The immediate user action is to set both run-owned temporary calendars' calendar
time zones to UTC in each calendar's Settings and sharing > Time zone. This is
distinct from a timed event's time zone or the account's display time zone; it
controls the all-day fixture's interpretation. This completes the existing
approved UTC setup. Keep the calendars, event identities, dates and recurrence;
do not recreate fixtures. After the user reports the correction, start a fresh
consent for the same bounded event-read preparation. The previous link is closed.

Metadata diagnostics now report only HTTP status, fixed allowlisted error reasons
and identity/secondary/name/UTC/role match flags. Tests ensure private provider
values and arbitrary error bodies never enter output. These flags make any
remaining mismatch actionable; they do not relax the fixture boundary.

## Approved test configuration and user execution receipt

The earlier proposal preferred an appropriate existing test project after its
display name, ownership, audience, and unrelated usage were checked. A project's
name alone does not prove it is isolated. The user's `none` readback supported
proposing a separate project
with the originally approved display name `AtmoShaper Calendar Verification`.
The user reports setup complete and shortened that display name to
`AtmoShaper Calendar Verify` because it was too long. This is their execution
receipt, not independently verified settings or OAuth readiness. Use the reported
name; do not recreate or rename anything. No private project identifier belongs
in this plan.

| Setting | Prepared value / constraint |
| --- | --- |
| API | Google Calendar API only; no billing attachment or other service provisioning |
| Audience | External / Testing, restricted to explicitly identified user-owned test accounts |
| Client | One Web application registration named `AtmoShaper Calendar Verification Web` |
| Return address | `http://localhost:3317/oauth/callback`; no JavaScript origins or Production return addresses |
| Declared permissions | Keep Google's default identity entries; add only `calendar.calendarlist.readonly`, `calendar.events.freebusy`, and `calendar.events.readonly` using the full Google scope URI prefix |
| Credentials | Test-only credentials through a local private channel; no Production JSON, chat values, repository values, or Vercel provisioning |
| Retention | Keep approved test configuration available for subsequent isolated QA; fixture and token cleanup below is mandatory after comparison |

Port 3317 was unused at the local preparation check and remains unused after
local validation. It is not reserved; recheck before starting an approved run.
The callback listener and comparison runner are now implemented. Provider-free
listener tests use ephemeral loopback ports and close their owned listeners.
The downloaded JSON passed the separately approved private credential preflight
and was subsequently used for the approved first real consent. That attempt
passed scope/account checks, stopped at calendar metadata and revoked its token
as recorded above. The original configuration approval alone did not authorize
consent or Calendar activity; the subsequent run approval does.

The user replied `Yes` to the exact configuration-only approval request for this
new project,
Calendar API, External / Testing audience limited initially to the user's own
Google account, one Web client/return address, and the declarations above.
It excludes credential use, actual account grants, fixtures, deployment, and
verification submission. Do not treat the Production declaration approval as
authority for this separate setup. The user will operate Console because the
automated route remains denied.

The user subsequently also permits agent execution if possible and offers manual
execution otherwise. The earlier admin-policy verification denial is not
resolved by that authorization. Do not bypass it through a different browser,
native UI, shell-driven browser, or indirect console automation. Give the user
the complete approved checklist; no further approval is needed for those steps.

### Completed user-guided configuration sequence; reference only

The user reports completion. Preserve this guide as the intended configuration;
do not ask them to recreate it. Independent saved-value checks remain bounded
to the later approved credential read/test flow, not another generic Console audit.

1. Create the project named `AtmoShaper Calendar Verification` and select it.
   Use Google's generated project ID; keep private identifiers out of source.
2. In that project, enable Google Calendar API. This is the newly approved test
   project's API setting, not a repeat of Production enablement.
3. Google Auth Platform > Get started: app name `AtmoShaper Calendar Verification`,
   the user's own support/contact email, and External audience. In Audience keep
   publishing status Testing and add only the user's own Google account.
4. In Data Access retain default identity entries and add the three Calendar
   declarations from the table, then save the test declaration. If Google asks
   for its use, the accurate test-only text below describes the intended flow.
   A mandatory demonstration URL or different Console requirement is a new
   readback to resolve, not authority to fabricate a video or publish the app.
5. Clients > Create client > Web application: use the exact client name and one
   redirect URI from the table. Leave JavaScript origins empty. Download issued
   test credential JSON locally if offered; do not share its contents in chat.
6. Obtain a non-secret completion receipt for project display name, API enabled,
   External / Testing with only the user's account, saved Calendar scope URLs,
   and exact saved client redirect. No real account consent is part of this step.

Proposed usage text for the test project's declaration only:

> This testing-only app will compare read-only Calendar permissions using synthetic events in explicitly designated test calendars. It will check whether availability-only access returns the event IDs, timings, cancellation changes and incremental sync cursors needed for AtmoShaper's busy-block import. Full event-read access will be used only in the comparison arm to establish whether narrower access is sufficient. No public users, real appointments or Production Calendar credentials will be used.

This describes planned testing; it is not a Production least-access justification
or evidence that comparison execution has occurred.

## Local comparison implementation

Implemented commands:

- `npm run calendar:scope-comparison:plan`: safe offline outline; reads no files,
  credentials, environment settings, or providers.
- `npm run test:calendar-scope-comparison`: 34 mock/owned-ephemeral-loopback tests;
  callback HTTP tests never follow external redirects.
- `npm run calendar:scope-comparison -- --run --arm <availability|event-read> --config <absolute-private-config-path>`:
  approved one-arm execution with previously bound exact fixture identities.
- `npm run calendar:scope-comparison -- --prepare --config <absolute-private-preparation-path> --output <absolute-private-bound-config-path>`:
  bind the approved synthetic roots and run the first event-read comparison with
  one grant. Output must be a new file within the system temporary directory.
  The default with no arguments is offline.

The preparation mode fixes the approved October 10–13 UTC window, exactly two
secondary sources with owner/reader roles, exactly three designated fixture names
per source, and the owner's ready receipt. It validates those targets before
consent. After the usual issued-scope/account checks, it validates both calendar
entries before any event read, then reads only their bounded synthetic window
at page size two. Unexpected names, guests, reminders, timings, statuses,
duplicate rows, unknown source-2 IDs or changed recurrences stop binding. Only
the identified recurring masters are read to confirm daily COUNT=2. Pages are
bounded to sixteen per source and 24 items, under one sixty-second binding budget.
The UTC aliases `UTC`, `Etc/UTC`, `Etc/GMT` and `GMT` are explicitly equivalent
for this UTC fixture schedule; all other zones fail. Their verified literal
representations are retained for strict comparison, while timings, transparency,
all-day and recurrence expectations remain independently prescribed. Source-1
identities are discovered rather than guessed or substituted with iCalUIDs.
Only the resulting bound configuration is written privately; no token, code,
raw provider response, event text or cursor is written. Output failure still
revokes the issued test token and prevents fixture-change dispatch.

The runner uses the actual adapter event-list and normalization behavior without
starting the public app or connecting to Prisma/Neon. The browser callback binds
only to IPv4 loopback, validates a fresh one-use state, and retains authorization
codes/tokens only in process memory. The user opens the local consent link
manually; this does not automate or bypass the denied Google Console route.
No secret, raw response, or OAuth code is printed or sent to callback HTML.
The report includes fixture-match/field-mismatch counts, paging, etag presence,
cursor presence, and sanitized failure categories, without private identities
or event values. Missing identities/timings, unsupported permissions, changed
fixture metadata, and failed cleanup remain explicit non-passing outcomes.

The private config stays outside tracked source. It requires exact test project,
approved account email and absolute test-credential JSON path; a 32-hex-character
run marker; a bounded UTC time window of at most fourteen days; and one or two
explicit secondary sources. Each source provides exact private calendar ID,
synthetic summary `AtmoShaper scope test <run-marker> <one-based-source-number>`,
owner/reader role, time zone, known event roots, and expected before/after rows.
Expected fields are event identity, UTC start/end, time zone, all-day flag, and
BUSY/FREE/CANCELLED status. At most six event roots and 24 expanded items per
source are allowed. At least one changed time/status and one removed block must
be exercised. This schema is not a fixture-creation tool or execution approval.

Production project names and primary calendars are rejected. Credential JSON
must match the explicitly approved test project and contain exactly the prepared
callback, with no JavaScript origins. Live UserInfo verifies the expected account
before Calendar reads. Only the designated calendar-list entries are read; the
runner does not enumerate unrelated calendars. Event reads use page size two
(versus Production's 2,500), at most sixteen requests per source/read phase, a
shared sixty-second budget per baseline/incremental phase, and disabled redirects.
Only known synthetic event identities/expanded instances are accepted. No Calendar
or database writes are implemented; the operator performs approved synthetic
changes after the baseline. Token revocation is the runner's only cleanup write.

Compare two separately consented grants: identity (`openid` and `email`) plus
`calendar.calendarlist.readonly`, with either `calendar.events.freebusy` or
`calendar.events.readonly`. Do not include `calendar.app.created` in this inbound
comparison: it could mask which event-read permission allows a fixture read.
Disable inclusion of previously granted scopes for the comparison. Verify the
actual granted scope set, reject broader Calendar permissions, and stop if grant
isolation cannot be demonstrated. Separate client names alone are not proof.
Revoke the dedicated test grant between arms and after completion; never revoke
a working Production grant. The runner requests online access and revokes its
issued test token in a `finally` path. Failure to confirm revocation is a hard stop
requiring dedicated test-app grant cleanup; do not start the other arm. Restore
the exact initial synthetic fixtures before the other arm, retaining their IDs
where possible. Do not silently change the private expectation file merely to
make a failing response pass. Etags are optional in current normalization and
reported as capability evidence rather than an invented necessity gate.
Google can retain details on an owner's deleted event. The real sync then stores
a CANCELLED row, which the conflict query excludes. The comparison accepts that
row or an ID-only tombstone as removal from active conflicts; unexpected active
rows still fail. Reports count retained cancellations without exposing identities.

Use the same explicitly owned synthetic source fixtures for both arms. Obtain
separate exact authority before consent, local credential use, provider reads,
fixture creation/change/sharing/deletion, or test-token revocation. Set a ceiling
of two user-owned Google test accounts, two secondary synthetic calendars, and
six synthetic event resources. The second account supports a deliberately shared
source; no primary calendar or existing real event belongs in the comparison.
Fixture creation and updates must use the owner's UI or a separately approved
fixture mechanism, not broaden the measured grant to gain write access.

Check IDs, etags, start/end/time zones, all-day and transparency, expanded
recurrences, cancellation tombstones, pagination, and incremental cursors.
Use a bounded test page size to exercise pagination with the small fixture set;
record that difference from the production adapter's page size. Reconcile a
synthetic update and deletion through normalization, including stale-block
removal. Retain only sanitized capability results and synthetic expected/actual
comparisons. Keep private ownership/fixture locators out of repository docs.

Delete only this run's recorded synthetic calendars/events and sharing grants,
revoke its test tokens, close the listener, and verify absence. An uncertain
creation outcome must be reconciled before retry or cleanup; never sweep an
account by name. A passing standalone comparison does not prove database
serialization, outbound target isolation, or full app consent/activation.

## Approved concrete provider-run procedure

The purpose is to establish whether the narrower availability permission can
perform the current busy-block import. The following bounded workflow uses the
already configured test registration; no further Cloud settings or permissions
are proposed. The user's `Approved; I have a second account` reply approves
credential inspection, dedicated test consents and revocations, and only these
synthetic fixture actions. It also confirms availability of a second account
they own. Do not repeat this approval or availability question.
Before dispatch, record the chosen account and source IDs in private local
configuration. Do not infer an unspecified account's identity, obtain another
person's account, or extend the test-user list. A second account owns the reader fixture but does not grant
the test app access. If unavailable, use one owned source first, explicitly
leaving shared-source and overall minimum-access proof pending.

The October 5 account correction preserves the already approved two-account
boundary. It changes the role assignment, not Google configuration or requested
permissions:

| Role | Account authority | Calendar / permitted operations |
| --- | --- | --- |
| OAuth test user | Account successfully added by the user during Cloud setup | Owns source 1; grants both measured permissions separately; reader of source 2 |
| Connected fixture owner | Other user-owned account verified through the Calendar connector profile | Owns source 2; user shares it with the test user; connector assistance may act only on this exact new source |

Only the OAuth test user grants access to the test registration. The fixture
owner needs no test-user entry or project-management role. Do not relink the
connector, add an account, or share source 1 back to the connected account.
Retain actual addresses only in private operational state. Google's
[Testing guidance](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification)
and [Calendar sharing model](https://developers.google.com/workspace/calendar/api/concepts/sharing)
describe separate app-authorization and calendar-access controls.

1. Completed October 3: privately validated the supplied JSON against the previously
   selected test project and exact loopback callback, without copying credentials.
   All checks passed. The connected Calendar profile was re-read October 5;
   it identifies the fixture owner rather than the OAuth test user. Private
   preparation state now retains these identities separately. Before connector
   event activity, validate only its owner's new source 2; before test-app reads,
   validate the OAuth test account and source 1 owner / source 2 reader metadata.
2. The user creates source 1 in the configured test-user account and source 2
   in the connected fixture-owner account. Preserve the existing run marker
   and exact two synthetic names previously supplied. Both IDs are received
   October 6; retain this creation guide as reference, not a repeat request.
   Use UTC for both calendars. The source 2 owner shares
   only that calendar with the test user using reader access. Capture their exact
   Calendar IDs privately from settings and verify the owner's execution receipt.
   These manual Calendar operations do not automate the previously denied Cloud
   Console route. The connector has no calendar-create/delete/sharing tool.
   In Calendar's browser UI use Other calendars > Add > Create new calendar,
   and set the new calendar's time zone to UTC. In the second calendar's settings
   share only with the first account using the reader-level `See event details`
   option. Add it to the first account's calendar list from Google's sharing
   email. This is a user-performed sharing notification between their own
   accounts, not an agent-sent email or event invitation. Obtain each ID from
   Settings and sharing > Integrate calendar > Calendar ID. Do not create any
   events until the exact IDs and account match are confirmed. See Google's
   [calendar creation guide](https://support.google.com/calendar/answer/37095?hl=en),
   [sharing guide](https://support.google.com/calendar/answer/37082?hl=en), and
   [Calendar ID instructions](https://support.google.com/calendar/answer/44105?hl=en).
3. Populate each new source with the three resources in the table below. The
   connected Calendar tool may create its owner's three events in source 2,
   always specifying that exact new secondary ID. The test user creates source
   1's three resources manually. The test app has only reader access to source 2;
   no write access is requested through its measured grant. Use no attendees,
   invitations, reminders, Meet link, clinical information, or real appointments.
   Bound any connector discovery to those exact secondary IDs and the fixed
   window, with at most 24 expanded results per source. Read only the six known
   synthetic roots to bind identities, recurrence, timings and transparency.
   Keep identities outside tracked source, and derive expected times from this
   table, rather than copying a measured arm's output as its own expectation.
   The connector cannot discover source 1 while it remains unshared. Prepare a
   bounded source-1 identity-binding read through the approved test registration
   or obtain exact fixture identities from its owner before comparison. The
   current runner requires those known roots; do not launch with guessed IDs,
   treat iCalUID as an event ID, widen to unrelated calendars, or bypass that
   requirement. No such preparatory provider read has occurred yet.

| Fixture in each source | Initial shape in UTC | Controlled change after each arm's baseline |
| --- | --- | --- |
| Timed busy event | October 10, 2026, 10:00–11:00; opaque | Move to 10:30–11:30 and mark available/transparent |
| All-day busy event | October 11 through exclusive October 12; opaque | Delete only this event |
| Recurring available event | October 10, 2026, 14:00–14:30; daily, two occurrences; transparent | Preserve both occurrences |

Use the fixed October 10–13, 2026 UTC read window. Each source starts with four
expanded items, exercising page size two within the existing resource ceiling.
If execution occurs after this window or any fixture cannot match it, stop and
prepare a new explicit fixture proposal; do not silently widen provider reads.

4. Run the event-read arm first using preparation mode. This supersedes the
   original availability-first ordering to bind the manually prepared owner
   fixtures without requiring an extra consent grant. The scopes and two-account,
   two-calendar, six-resource boundaries are unchanged. The user confirms the genuine test-app
   consent in their browser. Validate actual issued scopes and expected account
   before exact-source metadata and event reads. At the baseline pause, change
   only the two designated resources in each source. Connector assistance can
   update/delete its owner's recorded IDs in source 2; the test user makes source
   1's changes manually. Preserve recurring roots. Confirm each write outcome;
   reconcile uncertain writes before retry. Record sanitized results and revoke
   only the issued test-app token even if comparison fails.
5. Restore the exact initial fixtures before the availability arm: restore the
   deleted all-day event from that owner's Calendar Trash and reset the timed
   event. Verify retained event IDs and baseline values using the owner's receipt
   and bounded connector reads. If restoration changes an ID, retain the original
   identity mapping and explain the change before another run; never rewrite
   expectations just to make a failure pass. Run the second arm with its own
   consent and verified scope set, make the same changes, and revoke its token.
6. Delete only the two recorded run-owned secondary calendars (one if that is
   the confirmed scope) using their owners' Calendar UI. This removes their
   synthetic events and sharing rule. Both measured grants have already been
   revoked, so obtain an explicit owner-side deletion receipt for each exact
   calendar. Do not claim independently authenticated API absence from that
   receipt or initiate an extra grant just to check it. Close the owned
   callback listener and confirm no run process remains. Unconfirmed cleanup
   remains an open outcome, not a passing readiness claim.

The run ceiling is two user-owned accounts, two secondary calendars and six
event resources, with no broad inventory search or default-primary operations.
It excludes Production settings/grants, Vercel credentials, Prisma/Neon writes,
deployment, payment testing, verification upload/submission and public activation.
The separate Google Calendar connector is fixture assistance only; its existing
grant cannot establish what the AtmoShaper test registration permits. The actual
two-arm runner is the permission measurement.

Provider-reference check: Google's event documentation permits retained
organizer-side cancellation details, while calendar creation/deletion and sharing
use distinct write permissions. Do not broaden either measured read grant to
automate those fixture operations. See
[event lifecycle](https://developers.google.com/workspace/calendar/api/v3/reference/events/insert),
[secondary-calendar creation](https://developers.google.com/workspace/calendar/api/v3/reference/calendars/insert),
[secondary-calendar deletion](https://developers.google.com/workspace/calendar/api/v3/reference/calendars/delete),
and [sharing permissions](https://developers.google.com/workspace/calendar/api/v3/reference/acl/insert).

## Decision and subsequent progress

If narrower access supports the required import, prepare a focused source change
and updated declaration proposal. Otherwise document the precise missing Google
capability and use that evidence in the sensitive-scope justification.

If sensitive access remains necessary, complete isolated app acceptance and a
real English sign-in/Calendar consent/use recording covering the applicable
clients. Prepare the genuine video and final justification before returning to
the Production form. Upload and verification submission require their exact
separate authority. Production credential provisioning and public Calendar
activation follow only after their own checks and approval.

Primary references checked October 3:
[event-list permissions](https://developers.google.com/workspace/calendar/api/v3/reference/events/list),
[testing and verification requirements](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification),
and [Web OAuth callback rules](https://developers.google.com/identity/protocols/oauth2/web-server).
