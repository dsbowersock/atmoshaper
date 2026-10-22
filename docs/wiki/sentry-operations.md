# AtmoShaper operational error monitoring

Read [project state](../project-state.md) and the
[independent launch plan](../superpowers/plans/2026-10-08-atmoshaper-independent-launch-readiness.md)
first. The approved separate destination project is created. This runbook owns
the remaining source-map, alert and hosted-collection gates; setup does
not establish operational monitoring.

## October 22 manual review: final span-envelope boundary

Manual review of [draft PR #44](https://github.com/dsbowersock/atmoshaper/pull/44)
identified a remaining standalone-span escape. Installed SDK 10.59.0 does apply
its span hooks to ordinary standalone spans, but unnamed spans with missing or
non-string origin attributes can miss the configured matchers. Direct span
envelopes can bypass those hooks entirely.

The candidate now registers a per-client `beforeEnvelope` integration that
removes every `span` item, including span containers. The SDK's real transport
suppresses a resulting empty envelope before its request executor is called;
mixed envelopes retain their error items. Existing sampling/propagation,
transaction, session and privacy restrictions remain.

The expanded regression uses the installed integration resolver and transport
with an in-memory request executor. Name/origin combinations and direct/mixed
envelopes failed in all three runtimes before the policy fix (six failures).
All 75 focused checks now pass, including 24 SDK cases, together with typecheck,
full lint and final changed-source lint. The original Linux CI unit run also
passed 5,270 tests with two skips; the two previously disclosed local Windows
Calendar deadline failures remain a separate platform-specific safety gate.
Updated-head hosted checks and review still need their own completion proof.
No provider ingestion, source-map upload, owner notification or activation is
part of this source correction. The earlier checkpoint below retains its date.

## October 22 local source validation refresh

The existing errors-only candidate was reviewed against installed SDK 10.59.0
and all three runtime entrypoints. Fresh `npm run test:sentry` passes 71/71
checks, including 20 actual SDK envelope cases; `typecheck` and `lint` pass too.
The broader run has 5,266 passes, two Calendar process-deadline failures and four
skips. The same two unchanged Calendar tests reproduce alone; a single synthetic
Windows shutdown probe took 7,615 ms against their five-second expectation and
verified its child closed. Keep that local Calendar safety gate open; the full
suite is not recorded as green. No deadline was relaxed.
These checks use invented inputs, in-memory Sentry transports and no inherited
provider credentials. They do not deliver a hosted event or owner notification.

The reviewed policy is the October 12 explicit-zero/deny-sampler version below,
with final name/origin filters and client reports disabled. No app/test source
change was needed during this refresh. The four-file source/test patch is
prepared separately from unrelated dirty work; publication and hosted reviews
remain open. The deployment and this runbook's Sentry-only documentation changes
accompany that review candidate. No source push, binding, upload or event has
occurred in this continuation.

The next operational work is current destination/privacy and actual
quota/retention/overage/billing proof, followed by an exact protected
release/source-map, single sanitized error and named owner-alert packet under
the existing activation gates. Do not repeat completed project/privacy setup
or reuse the closed Anatomime operation allowances.

## What Sentry is for

Sentry helps the owner notice and diagnose software failures: a broken page,
an unhandled server error, a new error after a release, or a recurring error
that comes back after a fix. Release-linked, source-mapped stacks should identify
the relevant code instead of relying on a user's description of what happened.
The voluntary support diagnostic adds only predefined issue/area/device buckets.

The error capture boundary is framework error hooks, the global error fallback
and the enum-only support diagnostic. A handled HTTP failure is not automatically
an error event merely because its response status is unsuccessful. Monitoring
must not be described as a complete audit of purchases, Calendar sync or game
actions, or as popularity, conversion, user-history or product analytics.
The merged baseline also allows anonymous operational tracing. The October 11
local follow-up prepares errors-only collection; it remains unpublished and does
not change the preserved public artifact or enable hosted collection.

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
  from application collection and project scrubbing. Merged PR #43 sets
  `withSentryConfig`'s `telemetry: false` for all builds, preserving explicit
  release credentials and QA isolation. Provider-free tests execute the actual
  configuration for ordinary, migration and QA modes. PR #43 merged on October 10
  after final-head checks/reviews; its READY main candidate remains unpromoted.
  The live public artifact is preserved and application monitoring remains unbound.
- The [August 17 provider audit](../audits/2026-08-17-anonymous-sentry-provider-settings.md)
  belongs to its named historical source/environment. It does not verify a new
  independent AtmoShaper destination. Do not repeat its completed diagnostic.

## October 9 UTC metadata checkpoint

Four authenticated metadata GETs succeed for the approved project and its
organization, visible environments and the first release-list page. Project
privacy controls and advanced rules match the approved readback; project and
organization sharing are disabled, scrubbers are enabled and organization IP
prevention remains enabled. The project reports no first event, replay, session,
log or feedback data; visible environments and release rows are empty. Spike
protection is not disabled. These metadata flags do not prove source-map
acceptance or a complete audit of ingestion/configuration.

The read endpoints do not establish actual retention, plan quotas or billing
ownership. Keep those controls open rather than infer a Free plan or duration.
Release-linked mapped frames and delivered owner alerts still require their exact
activation/acceptance packet. No event contents were read, and no new setting,
event, upload, notification or application binding was submitted.

The later October 9 client-key list and exact-key GET verify an existing active
key and a public DSN that belongs to the approved project. Its secret was not
retained, and no key was created or changed. The list's pagination was not proved;
this verifies the selected existing key rather than a complete key inventory.
Its key-specific rate limit is unset, which does not establish organization
billing limits or authorize uncapped collection. Read actual plan limits and
retention before deciding the activation budget.

The documented project repository-link GET returns an empty list. Repository
source context is therefore not configured; a separate repository integration is
not required merely to upload source maps. Exact release/artifact identity and
mapped-frame acceptance still need proof. The key's remote SDK loader metadata
has Replay/performance options enabled, but the application imports its bundled
SDK and applies its own privacy policy. Do not use that remote loader as an
activation shortcut or treat those metadata options as proof of app ingestion.
The private preparation packet keeps exact references, existing public DSN and
remaining gates; no binding, source-map upload, event or notification occurred.

## October 10 source and envelope-scope checkpoint

The shared source sets error `sampleRate` to 1.0 and obtains trace sampling from
[the privacy helper](../../lib/sentry-privacy.js): 1.0 in development, 0.1
otherwise. This helper has no trace-rate environment override. Installed SDK
10.59.0 includes browser tracing, and transactions/spans pass through the existing
sanitizers. Sampling describes a probabilistic selection, not a hard envelope or
span count. Confirm the plan's error and trace/span allowances, retention and
overage controls if retaining that policy.

Six provider-free calls to the installed sampler use invented rates, parent
decisions and random values. Unparented zero rate rejects sampling, but a positive
parent decision is inherited before the configured rate. Omitting both trace
sampling options or using a deny sampler rejects the tested positive-parent
input. Those utility branches do not constitute a complete runtime policy test.
If the initial approval permits errors only, first review a source policy and
SDK-envelope tests that prevent spans, including inherited sampled inputs; merely
setting a provider quota or assuming a zero rate is sufficient does not prove it.
No application/SDK client, transport, database or provider was started by the probes.

The debug GET route has only the existing environment-flag gate. Keep the ordinary
public flag false and name a protected verification deployment before enabling
it temporarily. The support POST uses a durable operational limiter; its write
must be named in any acceptance scope. Retain the historical debug flag/event
compatibility identifiers and do not substitute a real support submission for
the separately approved synthetic event.

## October 11 local errors-only source preparation

The unpublished follow-up leaves both trace sampling options undefined, disables
trace-header propagation and removes BrowserTracing while preserving browser,
Node and edge error hooks. Explicitly captured transactions are dropped before
transport. Existing error sanitization, release/environment and compatibility
settings remain intact; an absent application DSN still disables collection.

The installed SDK regression first proves that a zero-rate policy can emit both
transaction and standalone-span envelopes after inheriting a sampled parent.
The actual shared policy and all three compiled entrypoints then produce only
the sanitized error envelope for active, child, manual and standalone span
attempts with and without sampled incoming context. All 62 focused Sentry tests
pass locally, using temporary scopes and an in-memory transport; lint and
typecheck also pass. No provider request, database connection, event ingestion, upload or alert is included.

Source publication/reviews, actual error quota/retention/billing, release/source
maps and the separately scoped synthetic-event/owner-alert acceptance remain
required. Future performance tracing needs its own reviewed privacy and usage
scope; the historical trace helpers do not activate it in this policy.

## October 12 inherited SDK environment and external-span hardening

The October 11 undefined-rate policy is historical preparation. Installed Node
initialization can replace that undefined rate from SENTRY_TRACES_SAMPLE_RATE,
and local sampled parents can bypass a deny sampler for child spans. Both paths
are reproduced using real installed SDK merging/envelopes with invented inputs;
their pre-fix failures are retained.

The current unpublished policy uses explicit zero plus a deny sampler, disables
trace-header propagation, and adds final span-name/SDK-origin filters. The origin
filter covers empty/unnamed SDK spans as well as the named path. Client reports
are disabled so dropping spans cannot emit a separate span-count envelope.
Existing session/replay/console exclusions, error scrubbing and error handlers
remain. No application DSN still means disabled collection.

All 71 focused checks, lint and typecheck pass. The SDK policy
slice includes 20 in-memory cases, including inherited rates, sampled context,
externally recorded spans and preserved sanitized error delivery. No SDK global
initializer, provider ingestion or credential capture is used. Publication and
fresh hosted reviews remain pending; this source correction enables no provider
collection, upload, alert, Production change or new source archive deployment.

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
| Quota and retention | Actual error and trace/span allowances, overage controls, billing owner and retained-data duration recorded; align the approved envelope scope with the reviewed SDK policy |
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
   source release, separate error and trace/span ceilings, cleanup/retention and
   rollback. An errors-only initial scope requires the reviewed source policy
   described above before dispatch. Any use
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
