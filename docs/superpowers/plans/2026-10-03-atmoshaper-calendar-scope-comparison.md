# AtmoShaper Calendar permission comparison

Status: test configuration reported complete under `AtmoShaper Calendar Verify`.
Local runner implemented and mock/loopback checks passing; provider execution
authority and exact private fixture/credential inputs remain pending.

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
name below. Do not repeat this inventory or completed setup. Next obtain only
the new test-credential JSON's local path and settle the exact fixture/account
targets and preparation method for one concrete provider-run approval. Path
disclosure is not authority to read/use credential contents; that remains gated.

The existing Production registration, API enablement, working sign-in, and
declaration approval remain recorded. Do not repeat those operations. The
draft's video field does not establish whether Save can proceed without a URL;
never invent one or substitute a storyboard for a real demonstration.

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
No real credential was accessed or consent flow started. The downloaded JSON
will verify the exact test target and saved callback only after credential-use
authority is obtained. Configuration approval does not authorize consent or
Calendar activity.

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
- `npm run test:calendar-scope-comparison`: 22 mock/owned-ephemeral-loopback tests;
  callback HTTP tests never follow external redirects.
- `npm run calendar:scope-comparison -- --run --arm <availability|event-read> --config <absolute-private-config-path>`:
  future approved one-arm execution only. The default with no arguments is offline.

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

