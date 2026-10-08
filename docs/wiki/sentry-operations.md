# AtmoShaper operational error monitoring

Read [project state](../project-state.md) and the
[independent launch plan](../superpowers/plans/2026-10-08-atmoshaper-independent-launch-readiness.md)
first. The approved separate destination project is created. This runbook owns
the remaining source-map, alert and hosted-collection gates; setup does
not establish operational monitoring.

## What Sentry is for

Sentry helps the owner notice and diagnose software failures: a broken page,
an unhandled server error, a new error after a release, or a recurring error
that comes back after a fix. Release-linked, source-mapped stacks should identify
the relevant code instead of relying on a user's description of what happened.
The voluntary support diagnostic adds only predefined issue/area/device buckets.

The current capture boundary is framework error hooks, the global error fallback
and the enum-only support diagnostic. A handled HTTP failure is not automatically
an error event merely because its response status is unsuccessful. Monitoring
must not be described as a complete audit of purchases, Calendar sync or game
actions, or as popularity, conversion, user-history or product analytics.

## Current proof and missing access

- October 8 local source disables both browser and process session integrations.
  Process-session envelopes have a separate SDK pipeline outside `beforeSend`;
  scrubbing normal events alone does not make those envelopes session-free.
- Provider-free tests use the installed browser, Node and edge defaults and an
  in-memory SDK transport. Ordinary errors retain release/environment and stack
  information after scrubbing. Requests, identity, local content and breadcrumbs
  are removed; no application DSN means no transport is constructed.
- The error fallback links a reference only when the SDK is enabled and the
  reference belongs to the current error. Capture failure leaves support usable.
  A reference is not a confirmed provider-delivery receipt.
- Initial October 8 `sentry-cli info --no-defaults` could not authenticate because
  no release-tool token was configured. At the owner's request, the separately
  installed official Sentry OAuth CLI is now authenticated after owner completion.
  Initial readback verified one organization/team and one legacy Next.js project,
  with no AtmoShaper project and complete pagination. A dry run selected that
  explicit team. Exact references remain in the protected operation journal.
  The [project-only setup packet](../superpowers/plans/2026-10-08-atmoshaper-independent-launch-readiness.md#3-enable-useful-privacy-safe-sentry-operations)
  is owner-approved. Initial writes returned 403 without creating a project;
  the existing member-creation policy required additional OAuth access. After
  that access and fresh baseline verification, one POST returns 201 with explicit
  `default_rules: false`. Complete inventory and individual readback verify the
  new AtmoShaper Next.js project, exact team and unchanged legacy project.
  No organization policy or legacy setting changes. No app/Production binding,
  upload or event is added; first event is null and sessions, replays, profiles
  and logs are absent in readback. The old issue-alert list returns 404, so do
  not equate the accepted disabled-default request with verified alert absence.
  Effective privacy/IP prevention, quotas, retention, current alerts and source
  maps were still pending at that creation checkpoint. Legacy settings do not
  establish readiness of the independent destination; never repeat project creation.
- The separately approved October 8 project-only privacy update is complete.
  One successful write and exact readback verify the six advanced removal rules
  for geography/server-name fields. Inherited IP prevention is enabled; other
  project fields, organization privacy and the legacy project are unchanged.
  Current monitor metadata has no attached workflows; this does not establish
  a delivered owner alert. No app binding, event, upload or notification was added.
  Quota/retention/billing, release/source maps and useful owner alerts remain gates.
- PR #42 is merged and its automatic main candidate is READY but unpromoted.
  Its build log identifies vendor-plugin telemetry, whose own DSN is separate
  from application collection and project scrubbing. The next local source
  correction sets `withSentryConfig`'s `telemetry: false` for all builds, preserving
  explicit release credentials and QA isolation. Provider-free tests execute the
  actual configuration for ordinary, migration and QA modes. This local change
  has not changed the hosted artifact or enabled application monitoring.
- The [August 17 provider audit](../audits/2026-08-17-anonymous-sentry-provider-settings.md)
  belongs to its named historical source/environment. It does not verify a new
  independent AtmoShaper destination. Do not repeat its completed diagnostic.

## Exact destination read gate

Use an owner-authorized read path to identify the destination organization and
project, independent administration/billing, environment boundaries, quota and
retention. Keep resource references and credentials in protected private storage.
Do not paste tokens into chat, repository files or command arguments.

Read the actual project and inherited organization settings before SDK activation:

| Control | Required proof |
| --- | --- |
| Data scrubbing and defaults | Enabled at the effective project/organization scope |
| IP storage | Provider prevention enabled in addition to the SDK's null IP marker |
| Sensitive fields and advanced rules | Reviewed against the [deployment privacy contract](deployment.md#sentry), with no broad exemption that weakens it |
| Issue sharing | Public sharing disabled |
| Prohibited collection | Replay, standard User Feedback, attachments, Logs, product metrics and browser/process sessions disabled or unused |
| Quota and retention | Actual plan limits, billing owner and retained-data duration recorded; no guessed free-tier or retention claim |
| Release/source maps | Repository/build linkage and authorized upload target belong to AtmoShaper |
| Alerts | Production new-error/regression rules and an explicitly approved owner destination |

Sentry's [project settings API](https://docs.sentry.io/api/projects/update-a-project/)
documents the relevant scrubbing/IP controls; consult its current read endpoints
for the actual destination. Documentation is not a provider readback and is not
authorization to use an update endpoint.

## Prepare activation and acceptance

1. Complete source checks/reviews and prepare the privately identified project,
   exact environment scope, DSN, build-secret target and saved prior settings.
   Preserve the stable `SENTRY_*` and `NEXT_PUBLIC_SENTRY_*` variable contracts.
2. Confirm the source-map upload target matches the SDK destination and source
   release. Uploads and release creation are provider writes and belong in the
   explicit activation packet. Never expose the build auth token to the browser.
3. Set the ordinary public debug route flag to false. Define a protected,
   owner-controlled verification target and one synthetic event before any
   temporary debug-route enablement; do not expose an error generator publicly.
   The historical debug flag/event identity remains a compatibility contract.
4. Specify the synthetic event, expected coarse route and scrubbed fields,
   source release, event/usage ceiling, cleanup/retention and rollback. Any use
   of the support POST must include its durable quota write in the exact scope;
   it is not a read-only provider check.
5. Obtain exact authority for configuration, upload and the single new event.
   Inspect only that owned synthetic event after ingestion, including the
   source-map result and absence of personal/clinical data or session envelopes.
6. Verify the approved owner alert and its release/environment filter. Sending
   an alert notification needs that explicit destination scope; source test
   passes cannot establish delivery.
7. Restore temporary flags, verify the actual public configuration/artifact and
   preserve saved hosting aliases and legacy Clock/tool access. If privacy,
   mapping or delivery fails, leave collection disabled and retain private proof.

## Operating after activation

Start with production new-issue and regression alerts. Add a failure-volume rule
only after its event definition, threshold, quota and noise budget are agreed;
session/adoption statistics are outside the current policy. Inspect the release,
coarse route, exception type and mapped frame; reproduce with synthetic data.
Keep clinical/local records, customer data, private provider references and raw
event payloads out of issues and public PR descriptions.

Use `npm run test:sentry` for local changes to this contract. It verifies SDK
defaults, sanitization, debug-route gating, voluntary diagnostic delivery/quota
behavior and error-fallback references without contacting Sentry or a database.
Actual destination settings, source-map ingestion and owner alert delivery still
require their separate receipts.
