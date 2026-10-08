# Independent AtmoShaper marketing readiness

Recorded October 8, 2026. Read [project state](../../project-state.md),
[project log](../../project-log.md), and the [migration ledger](../../wiki/migration-status.md)
first. This is the implementation/handoff owner for the user's clarified goal,
not a receipt that the remaining providers are configured or a blanket approval
for unspecified Production writes, payments, database access, or retirement.

## Goal and finish line

AtmoShaper must operate independently and be ready to market its actual offered
features. Required remote Anatomime realtime, useful privacy-safe operational
monitoring, independent media and other provider administration, branded support,
and explicit purchase readiness belong in this goal. Preserve the user's current
MassageLab clock and tools throughout the transition; MassageLab's later product
direction is separate. Broad refactors remain deferred.

An independently administered app/project, appropriately scoped credentials,
billing ownership, and recoverable configuration can share an owner's provider
account if isolation is proved. Do not create extra accounts or paid plans merely
to change a display name. Conversely, renaming a resource is not proof that its
credentials, consumers, URLs, billing, or lifecycle are independent.

Completion requires:

1. Every launch dependency has an exact privately recorded owner, environment,
   billing/usage boundary, recovery path and independent AtmoShaper binding.
2. Offered user journeys work on the actual approved public release: account
   creation/sign-in/recovery, Clock/Chimer/Atmosphere, remote Anatomime, Calendar,
   Supporter purchases, and the additional purchasing paths after their gates.
3. Operational errors can produce sanitized diagnostics and useful alerts;
   clinical/local records remain local-first and absent from telemetry.
4. Media delivery and support contacts present the intended public brand, with
   compatible cache/range/CORS and access preserved for the legacy tools.
5. Source checks/reviews and the final exact-artifact rollout pass, public claims
   match observed functionality, and the remaining ledger has no required item
   hidden under an optional or historical label.

## Verified starting point

- Hosted main is `acd05b07fb67e2af1e49965ce3d2c11b97947d3f`, the approved PR #41
  merge. Its tree equals reviewed head `d99f931`. All seven reviewed-source CI
  jobs, clean Codex, full 18-file CodeRabbit coverage and 32 resolved findings
  are complete. Unit results: 5,201 total/5,199 passes/two skips/no failures or
  cancellations. Browser results: 596 passes/178 gated skips/no flakes or final
  failures. Historical earlier-head retries remain historical.
- The PR #41 automatic main candidate is READY and unpromoted. The approved
  PR #40 runtime `38d0ded` remains the public target for all six saved live
  aliases. Source-only operator changes do not require a new public release.
- Fresh hosting retains standard `npm run build`, GitHub/main, manual custom
  domain assignment and deployment protection. Complete October 8 name/target
  inventory: 60 Production-only settings, none in Preview/Development, no Ably,
  Sentry or R2/upload settings. No secret values were inspected.
- Registration and recurring Supporter Checkout are open. The dedicated live
  catalog, tax, Portals, webhook and completed payment/refund acceptance are
  retained. One-time support/background purchasing remain disabled.
- Calendar setup, permission comparisons, bounded application/database tests,
  cleanup, four-setting provisioning and public rollout are complete. A real
  signed-in Production OAuth/sync journey is not among those receipts.
- Current source includes Ably room-scoped tokens/signals and polling fallback,
  Sentry privacy controls, background commerce and the separate support payment
  route. Source presence is not evidence of an enabled hosted integration.

## Work order

### 1. Reconcile documents and private dependency inventory

- Update the current snapshot and ledger with PR #41's merged/completed status,
  the new required-service goal, prior completed receipts and exact proof gaps.
- Inventory Vercel, database, auth/Google, Stripe, Ably, Sentry, media, mail,
  domains and scheduled/operator dependencies. Identify hidden legacy endpoint,
  credential, resource or billing dependencies without copying user records.
- For each dependency classify: already independent; retain but reassign/rename;
  migrate with compatibility; or retire after all consumers are removed.
- Keep private resource references/credential recovery in owner-protected
  storage outside Git. Tracked records contain public outcomes only.
- Obtain only the precise missing read access. Initial CLI checks lacked
  authentication. Owner-requested Cloudflare and Sentry read-scope sign-ins are
  started and await completion; no authenticated provider inventory is claimed.
  Identify Ably/Sentry owner apps/projects before selecting or creating them.
- Ably's dashboard read is blocked because the browser cannot verify the
  admin-enforced policy. Do not bypass browser controls or retry until resolved.
  Continue source preparation while obtaining the exact missing owner/read
  access; an access failure does not establish the provider's current state.

Acceptance: one reconciled dependency register, named remaining gates and no
repetition of completed Google setup, Stripe bootstrap or acceptance cleanup.

### 2. Restore required Anatomime realtime

Owners: [realtime server](../../../lib/anatomime-realtime.ts),
[token route](../../../app/api/anatomime/sessions/[code]/realtime-token/route.ts),
[player client](../../../app/anatomime/shared-session-client.tsx),
[provider checklist](../../rebrand/atmoshaper-external-account-checklist.md#ably-staging-gate).

- Identify an independently owned AtmoShaper Ably Production app and isolated
  verification app, existing if available. Read role/capability/origin/usage
  metadata without returning credentials or real room/player data.
- Prepare exact app/key/environment changes and cost/rollback scope. Preserve
  `ABLY_API_KEY`, room-channel normalization and database authority. Client
  tokens stay limited to the joined room; server publishing stays server-only.
- Use existing provider-free/browser harnesses for signal-triggered refresh,
  unauthorized-token rejection, reconnect and subscription cleanup.
- Local source preparation now consumes the setup TokenRequest once and obtains
  fresh renewal grants through the joined-player route. The callback preserves
  room/player authority, bounds transport and JSON at ten seconds, cancels on
  owner teardown and sanitizes failures. Renewal/polling/route checks pass
  150/150; all 52 desktop/mobile Chromium traffic cases pass without retries.
  Lint, typecheck and the isolated 115-page Browser-QA build also pass.
  Hosted source review, provider binding and actual multi-device acceptance are
  still required; intercepted browser transport is not provider acceptance.
- Separately scope actual hosted authentication, subscription, publishing and
  synthetic multi-device room actions. Existing no-publication inventory gates
  do not authorize game writes or presence. Define room/player lifetime, data
  budget, cleanup and independent absence proof before those actions.
- Verify host and phone participants receive turn/state changes, reconnect
  after interruption, and use fallback safely when realtime is interrupted.

Acceptance: observed realtime on the final target, bounded traffic and cleanup,
with no cross-environment room leakage. Polling-only success is insufficient.

### 3. Enable useful privacy-safe Sentry operations

Owners: [deployment privacy contract](../../wiki/deployment.md#sentry) and
[operational readiness/use runbook](../../wiki/sentry-operations.md).

October 8 local preparation excludes the SDK's separate process-session pipeline
as well as browser sessions, preserves sanitized errors and gates error references
on the current enabled SDK/error. Provider-free SDK/privacy/diagnostic/fallback
checks pass 55/55. Initial release-CLI authentication was absent. The separately
installed official OAuth CLI's owner-requested read-scope sign-in is started and
awaits completion; destination settings, source maps and alerts remain unread.
Do not infer provider readiness from source checks or the historical audit.

- Identify an independent AtmoShaper project/environment and appropriate quotas,
  source-map/release linkage, retention and alert ownership.
- Read and confirm provider scrubbing, default scrubbers, IP-storage prevention,
  sensitive-field rules and disabled public issue sharing before SDK enablement.
- Preserve anonymous route families and scrubbed stack traces; disable personal
  identifiers, request/response content, clinical/local-vault data, automatic
  breadcrumbs, Replay, standard User Feedback, attachments and Logs.
- Prepare exact DSN/build-secret/environment settings and alert changes; do not
  expose credentials or send notifications to others without that explicit scope.
- Separately authorize one enum-only synthetic error and inspection of its
  sanitized payload/source map. Verify configured new-error/regression/failure
  alert behavior using the agreed owner destination.

Acceptance: actionable release-linked errors and a working owner alert, with
independently verified privacy controls and no copied personal/clinical data.

### 4. Establish independent, branded media delivery

Owners: [media deployment](../../wiki/deployment.md#public-media-r2),
[domain plan](../../rebrand/atmoshaper-domain-cutover-plan.md), existing manifests
and publication receipts. The [source consumer/cutover map](../../wiki/media-independence.md)
and `npm run migration:media:inventory` distinguish absolute audio URLs,
generative hosted/nested indexes, relative published previews, their earlier
fallback, and database-controlled anatomy URLs. Source declarations are not
provider storage or playback proof. Use the Cloudflare skill and current provider docs.

- Read exact account/bucket/domain/CORS/cache/usage bindings and classify their
  AtmoShaper and legacy consumers. Do not list private object content or download
  media merely to inventory it.
- Prefer in-place resource ownership/display-name changes and an AtmoShaper
  media domain where supported. Cloudflare's documented R2 patch is not a
  bucket rename; never assume names can be edited safely.
- A branded domain may serve existing objects without copying them, but its
  DNS/domain/CORS changes still need exact reviewed scope. Preserve old URLs
  while MassageLab tools depend on them. A new URL alone does not prove resource
  ownership/administration independence.
- If a new bucket is required, prepare an explicit bounded copy/verification
  plan, unchanged object identity/bytes, range/cache/CORS tests, consumer cutover
  and rollback. No upload, copy, object delete or bucket retirement is implied.
- Verify actual offered audio/video/background playback and the relevant saved
  licensing/provenance receipts; do not broaden the launch catalog by default.

Acceptance: independent administration and branded delivery for the offered
media, compatible playback and no loss of legacy Clock/tool assets.

### 5. Close the real Production Calendar journey

- Prepare an exact eligible test-user/account, owned source/target, event and
  time budget, consent, rollback and cleanup packet. Do not reuse downloaded
  Production credentials or earlier revoked tokens/test fixtures.
- Use the normal public app: sign in, Connect Google, consent, discover/create
  the app-owned AtmoShaper calendar, select an agreed synthetic source and sync.
- Verify an initial sync and an agreed controlled change, reconnect/refresh and
  normal Disconnect/cleanup through the actual deployed paths. Avoid importing
  real appointments or customer details into an acceptance fixture.
- Distinguish user-created state intended to remain from temporary owned test
  state; no blanket calendar deletion or token revocation is authorized.

Acceptance: a recorded actual Production journey and any approved cleanup,
without repeating the already completed isolated comparison/application tests.

### 6. Activate the two remaining purchasing paths

Owner: [billing and memberships](../../wiki/billing-memberships.md).

There is no automatic activation date in the completed Supporter-only plan.
Activation follows this dedicated readiness stage, before marketing these paths
as available. They remain disabled until exact deployment approval.

- The source branch prepares `scripts/assert-production-stripe-readiness.mjs`
  with exact `STRIPE_PRODUCTION_READINESS_SCOPE=all-payments`. Unset scope
  preserves Supporter-only checks, enabled runtime switches do not widen scope,
  and unknown/empty scope fails before provider dispatch. Full scope invokes
  every existing payment prerequisite with live verification, inherited build
  credentials, no dotenv fallback and the same deadline. Complete source review
  and meaningful real-entrypoint synthetic regressions before any hosted change;
  source preparation does not complete payment acceptance or activation.
- One-time support: confirm all five independent tax/classification/provider/
  registration/enablement gates, correct payment-mode/copy, no entitlement grant,
  and the required actual Session/line-item evidence under a new scoped test.
  Preserve historical reconciliation identifiers and current legal text.
- Backgrounds: verify exact current database authority, migration and wallet
  provisioning/backfill evidence, read-only reconciliation, price/currency/country,
  digital-purchase version, tax, webhook/refund/dispute and fulfillment readiness.
  Do not blindly rerun a historical backfill or read/export user rows.
- Prepare distinct bounded new-flow test/cleanup scopes. Test successful purchase,
  duplicate/delayed webhook recovery, refund/dispute ownership and failed payment
  without repeating the completed recurring Supporter live test.
- Verify a source-pinned candidate, readiness/build results, customer-facing
  copy and rollback before exact flag changes and public promotion.

Acceptance: both advertised paths function with correct tax, durable ownership
or no-benefit support semantics, reconciliation and rollback; recurring billing
continues unchanged.

### 7. Finish independent mail, domains and legacy separation

- Reconcile the actual AtmoShaper database/admin/backup ownership, Google auth and
  Calendar clients, SMTP sender/support destination, DNS, domains, build service,
  scheduled jobs and credentials. Prior success is dated evidence, not a new
  authority to rotate keys or move data.
- Complete branded inbound support routing if it still depends on a legacy
  address. Prepare exact sender/DNS/forwarding and bounded delivery scopes;
  do not send mail or retire addresses as part of an inventory.
- Identify resources worth transferring/reassigning to AtmoShaper, and keep
  current MassageLab Clock/tools and their auth/media/hosting dependencies alive
  until replacement continuity is observed and any retirement is separately
  approved. No blanket redirect, cancellation, refund or deletion.
- Retain stable internal contracts unless a dedicated compatibility change is
  necessary. Internal legacy strings alone do not require a risky rename or new
  paid resource; user-visible brand and independent lifecycle are the criteria.

Acceptance: documented independent ownership/recovery, usable branded support,
no unexplained legacy dependency, and observed working legacy tools throughout.

### 8. Final offered-feature verification and marketing handoff

- Run appropriate final-source CI/reviews and targeted offered-feature browser
  checks. Keep skips and retries visible; never rerun success to erase flakes.
- Review the public feature/pricing/support/legal/metadata/install presentation
  against enabled behavior and accepted media scope, with mobile/desktop checks.
  Sentry is operational monitoring, not marketing/product analytics.
- Prepare the exact existing READY artifact, provider settings and saved alias/
  rollback packet. Only after its approval perform the final promotion and
  approved acceptance checks; preserve the user's legacy tools.
- Record each required gate as complete with dated proof, or obtain an explicit
  scope decision for an intentionally excluded feature. Leave broader refactors
  and future MassageLab product work outside this goal.

## Authorization and continuation

The user authorizes the goal, local documentation/source preparation and required
integration investigation. Prepare each concrete provider operation first:
exact privately held target, changes, usage/cost, bounded fixtures, teardown,
verification, rollback and preserved legacy dependencies. Ask only for genuinely
missing input or exact authority at that boundary; do not repeat approvals for
an operation already authorized. No provider/credential mutation occurred in
this initial reconciliation, and the completed PR #40/#41 review heartbeats stay
paused. Keep useful local work moving while access/input is pending.
