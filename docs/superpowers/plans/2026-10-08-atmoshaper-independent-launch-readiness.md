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

## Historical verified starting point — before PR #42

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

Historical October 8 source/setup checkpoint: the owner approved draft publication and the
review/fix loop for PR #42, plus the separate initial Sentry project-only packet.
Initial source head `3ee84fd` has a READY Preview and clean Codex/full 34-file
CodeRabbit review, with the docstring pre-merge check still below threshold.
Initial CI also finds stale Anatomime inventory/historical-receipt assertions
and desktop/mobile expectations of the legacy SEO host. Focused JSDoc, contract
and current-record corrections require fresh exact-head checks and reviews.
The published `c1b0ce6` follow-up has a READY Preview, successful 115-page Browser
build and clean Codex; full CI was running at that dated checkpoint. These new
provider-record corrections need renewed exact-head proof.
Sentry's required OAuth access and approved one-project creation are now complete:
201 and fresh readback verify the exact new project/team and unchanged legacy
project. The accepted creation disables default alerts; the old alert-list
endpoint returns 404, leaving inventory unverified. No app binding or first event
exists; monitoring privacy, quotas, retention, current alerts and source maps
remain gates. R2 encrypted capture succeeds, and token self-verification confirms
an active User API Token. The owner's screenshot confirms storage Read,
all-account inclusion and no IP restriction; the owner confirms the account.
A standard GET against the same verified account still returns HTTP 401/code
`10000`, leaving a provider access denial to resolve through a read-only account/
bucket check. Do not ask for token re-entry or broader permissions without new
evidence. Neither setup outcome activates collection or media cutover. These
pending statements record that checkpoint; the completion below supersedes them.

Latest October 8 closeout: the owner-approved PR #42 merge is complete as
`357095d`, with reviewed/merged trees identical. All seven final-head CI jobs,
READY Preview, clean Codex and full 37-file CodeRabbit coverage pass. Units have
5,223 passes/two skips; browsers have 606 passes/178 gated skips, with no reported
flakes or final failures. All five pre-merge checks pass and touched-function
docstring coverage is 93.94%. The automatic main candidate is READY/unpromoted;
standard build, migration and Supporter gates and 115 static pages pass. Final
readback preserves the PR #40 public target and all six aliases, with no promotion
or restoration. Do not reopen completed review/merge work.

The approved Sentry project-only privacy change is complete and read back exactly:
six advanced removal rules, inherited IP prevention and unchanged other project,
organization and legacy settings. Current monitors have no attached workflows;
owner alert delivery is not proved. Collection is still unbound. The candidate's
build reveals separate vendor-plugin telemetry; a new local correction disables
that for every build without changing explicit release credentials or QA isolation.

The public media-index read completes all 228 source-declared primary/format
indexes and finds 6,800 sample references, all on the legacy media origin, with
no payload requests. The owner has corrected the existing R2 token's dates:
the same saved identity is active and currently valid, and the canonical bucket
read succeeds. Metadata verifies the three owner-confirmed buckets, active legacy
public/anatomy domains, no private domain and disabled public development access
on all three. Owner aggregate evidence shows about 15.95 GB. Exact native zone
read now verifies one owner-created pending full AtmoShaper zone on Free in the
storage account; fresh authoritative and recursive NS reads retain Namecheap. The [compatible media plan](2026-10-08-atmoshaper-compatible-media-cutover.md)
prepares the DNS baseline/onboarding gate, retained old domains and consumer
cutover without copying or deleting media. No token re-entry, replacement or
broader storage grant is needed. The owner's Namecheap views now establish
BasicDNS, disabled DNSSEC/Dynamic DNS, no domain redirects and Custom MX. Paired
authoritative reads now agree on eight known record rows, including the additional
email-related CNAME found in desktop view; all seven prior values are unchanged.
The latest expanded owner view shows both mail TXT rows; fresh paired DNS reads
verify unchanged values and matching visible content. The missing-TXT support
request is retired. The earlier CNAME remains live and retained despite absence
from the latest image. Full-zone comparison and exact onboarding/rollback remain
prerequisites; the screenshot is not nameserver-change approval.
October 9 UTC reads verify parent DS absence at two .com authorities and no
records at either proposed media host across six types at both Namecheap
servers. The owner approved only pending Free-zone creation/verification, and
that stage is complete: account/plan, pending full-zone state and two assigned
nameservers are verified. The owner view shows no staged DNS records; the
record-list API returns 403 under the existing grant, so complete API inventory
is not claimed. Full legacy-zone comparison, staged record access, TTL/proxy
choices and exact cutover/rollback remain gated by separate approval. Fresh Sentry metadata confirms unchanged privacy and no first
event, visible environments or release rows. Quota/retention/billing and mapped
stacks/owner alert delivery remain unproved.
Agent dashboard policy remains unresolved.
These new local source
and administrative changes need their own validation/reviews and publication
approval; no media/provider activation follows from inventory.

October 9 later staging checkpoint: the owner imported all eight approved
DNS-only records. Full values and TTL 300 match at both assigned Cloudflare
authorities, with unchanged values at both current authorities; direct/recursive
NS checks retain Namecheap. The explicit proxy tags override the import checkbox.
The staged export/backup and complete legacy-zone inventory remain pending before
any separate nameserver authority. Do not repeat import or infer activation.
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
  authentication. The owner subsequently completed Cloudflare and Sentry login.
  Current readback identifies one Cloudflare account. The saved token is active
  and storage-read/account coverage is owner-confirmed. Its former future start
  date explains historical R2 `10000`; the owner's correction and successful
  metadata inventory are complete. Full authoritative DNS/admin/billing evidence
  remains open; do not repeat capture or corrected-date setup. Sentry has one
  organization/team and initially one legacy Next.js project. The separately
  approved new AtmoShaper project is now created and verified; legacy resources
  stay intact. Provider references and status receipts remain private. Identify Ably owner
  apps before selecting or creating them; neither login activates an integration.
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

October 9 approved read-only access and inventory are complete. The owner-captured
replacement token authenticates with exactly `read:app`, `read:namespace` and
`read:stats`, and a thirty-day expiry. It is a management read token, separate
from the application server key; no app keys were read. No full-access CLI login
is needed. See [Ably access-token capabilities](https://ably.com/docs/platform/account/access-tokens).

Complete app metadata identifies one enabled `atmoshaper` app in the authenticated
account with TLS required. Its complete channel-rule inventory is empty. Two
bounded completed hourly statistics windows contain no rows; no broader usage,
quota, billing or game acceptance conclusion follows. Private identifiers and
filtered receipts remain in the protected operation journal.

The native reader durably reserves each dispatch under the original twelve-GET
ceiling, carrying unsuccessful requests across the owner-captured replacement.
Eleven reservations are used. Thirty-six offline boundary cases pass, including
flat-array parsing in Windows PowerShell. No key, raw response, room/player data,
message, presence action or provider write was read, retained or sent. Do not
repeat the completed token setup or inventory. The older standalone preflight
remains unexecuted. Agent dashboard policy remains unresolved.

The [binding plan](2026-10-09-atmoshaper-ably-binding.md) turns this inventory into
server-key, isolated-verification and bounded hosted-acceptance prerequisites.
The [morning review](2026-10-09-atmoshaper-morning-review.md) now marks access
complete and retains the missing administration/billing/quota inputs.
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

Reviewed PR #42 excludes the SDK's separate process-session pipeline
as well as browser sessions, preserves sanitized errors and gates error references
on the current enabled SDK/error. Provider-free SDK/privacy/diagnostic/fallback
checks pass 55/55. The owner subsequently completed OAuth CLI authentication.
Initial metadata identified one organization, one existing team with owner admin
membership, and one legacy Next.js project; no AtmoShaper project existed and
the project/team inventories have no further page. The project-creation dry run
passes with the existing team explicitly selected; no DSN is returned or bound.
Exact references and source/read receipts are kept in the protected journal.
Do not infer provider readiness from source checks or the historical audit.

The completed provider packet was **initial project creation only**:

- Create exactly one `atmoshaper` project with platform `javascript-nextjs` under
  the privately identified existing organization and team. Recheck the baseline
  immediately before applying; if a matching project already exists or the
  selected owner/team changes, stop and reconcile rather than creating duplicates.
- Preserve the existing legacy project/team and their settings. Do not create
  another organization/team, start a trial, change a plan or increase a quota.
  This operation has no event, span, session, source-map or attachment ingestion.
- Read back the new project's name/platform/team association and record its
  exact owned identifier privately. SDK collection and hosted environment
  bindings remain disabled/absent, with zero synthetic events or notifications.
- Inspect the new effective privacy, retention, quota and billing controls
  before preparing the later configuration/upload/alert/acceptance packet.
  Legacy settings and missing fields do not establish the new project's readiness.
- On any failure, stop, keep collection disabled and retain the private receipt;
  no legacy resource or new project is automatically deleted. The owner has
  approved this packet. Initial 403 attempts created no project; the existing
  member-creation policy required additional OAuth organization write access.
  That access is complete, and the baseline-matched single creation returns 201
  with default issue alerts disabled in its request. The project/team and legacy
  preservation are verified; never repeat this completed creation. The old alert
  list returned 404 at that checkpoint. Current monitor readback has no attached
  workflows and does not prove owner alert delivery. This credential
  capability did not change organization settings or authorize collection.

- Identify an independent AtmoShaper project/environment and appropriate quotas,
  source-map/release linkage, retention and alert ownership.
- Read and confirm provider scrubbing, default scrubbers, IP-storage prevention,
  sensitive-field rules and disabled public issue sharing before SDK enablement.
  The subsequently approved project-only privacy correction is now complete;
  exact readback and unchanged organization/legacy settings are recorded privately.
  Do not repeat that write. Quota/retention/billing and activation remain open.
- Preserve anonymous route families and scrubbed stack traces; disable personal
  identifiers, request/response content, clinical/local-vault data, automatic
  breadcrumbs, Replay, standard User Feedback, attachments and Logs.
- October 9 read-only preparation verifies one selected existing active client
  key by exact-key GET, keeps its public DSN privately and retains no key secret.
  Key-list pagination remains unproved; no new key is needed for this candidate.
  Its key-specific rate limit is unset and project repository links are empty.
  Read actual plan/retention/billing before selecting a collection ceiling; use
  the bundled SDK rather than the remote loader's Replay/performance defaults.
  A repository integration is not inherently required for source-map upload;
  exact reviewed artifact/release and mapped-stack proof remain required.
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
provider storage or playback proof. The [compatible media cutover plan](2026-10-08-atmoshaper-compatible-media-cutover.md)
owns the verified three-bucket settings, missing zone/DNS onboarding, preserved
legacy domains, consumer work and acceptance/rollback. Use the Cloudflare skill
and current provider docs.

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
- Source inspection confirms normal Disconnect removes the owned resolved application connection; it does not revoke the Google grant or delete the dedicated Google calendar. Identify any separately approved provider teardown and preserve pre-existing state before describing cleanup as complete.
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

October 9 metadata refresh matches the current Stripe self-account exactly to
the privately recorded prior purchase target. Tax settings are active, head
office is configured and the complete registration list has one active row with
no continuation. No customer/payment rows, Session, payment, registration write
or repeat recurring acceptance occurred. A default tax-code value is absent;
product-specific classification and actual new-flow evidence remain separate
requirements. These readbacks do not authorize changing the five one-time
attestations, background provisioning/reconciliation, public flags or tax policy.

### 7. Finish independent mail, domains and legacy separation

October 8 Resend metadata readback identifies one verified AtmoShaper sending
subdomain, with sending enabled, receiving disabled and click/open tracking off.
Provider DKIM/SPF-labeled record statuses are verified; no DNS values, provider
identifiers, recipients or messages are stored in tracked evidence. This does
not prove the current Production SMTP binding, DMARC alignment, plan ownership,
actual delivery, or an inbound support route; no mail or verification was sent.

October 9 database metadata closes resource identification for the current
Production configuration. Both Vercel database variables point to one owned,
active integration store whose external resource ID exactly matches the separate
AtmoShaper Neon project. Its sole connected project matches this Vercel app.
The existing Neon login works when the CLI explicitly selects its existing
credential directory; no new login or grant was needed. Native complete project
inventories distinguish the retained legacy projects. The selected project has
one branch and compute endpoint, with a configured six-hour history window on
its current Free plan. Private references and comparison receipts stay outside
Git; no connection string, schema, user row or database connection was requested.

This proves current configuration/resource identity, not the exact deployed
credential/branch target or recovery readiness. Finish administration and billing
accountability, agree recovery objectives and prepare a bounded restore scope
before requesting any database write. Do not recreate the database, rotate its
credentials, restore it or retire a legacy project from this inventory. A denied
installation-resource route and the connector's store 404 remain failed access
checkpoints; the successful native store read supplies the binding evidence.

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

October 8 public `robots.txt` and `sitemap.xml` retain their dated old-www binding.
Reviewed PR #42 fixes the common canonical/metadata/structured-data owner to AtmoShaper www
and omits unverified legacy Organization social equivalence. Focused checks pass
17/17; the isolated build emits all 36 sitemap URLs and robots host/sitemap on the
new canonical with private-route exclusions intact. Existing visible social
links still require an ownership/branding decision; no profile is invented,
reserved or renamed. Public output changes only after source review and the
later exact-artifact rollout; old callbacks, media and legal dates remain intact.

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
