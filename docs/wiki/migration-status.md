# AtmoShaper migration status and remaining work

Read [project state](../project-state.md) first for the active snapshot and
[project log](../project-log.md) for dated receipts. This guide connects the
original migration scope with the work still needed; it does not replace those
owners or authorize provider changes. PR #40's approved merge and automatic
unpromoted candidate were verified on 2026-10-07. Calendar comparison/cleanup
receipts are dated 2026-10-06. Bounded application acceptance and its database-only
follow-up/cleanup completed on October 7. The subsequently approved four-setting
credential stage and exact-artifact public Calendar rollout are complete;
final public/configuration readback is dated `2026-10-07T21:50:03Z`. Other
receipts retain their original dates. October 8 hosted truth now confirms PR #41
merged, its automatic candidate READY and unpromoted, and all six live aliases
still on the approved PR #40 public artifact. Its final source checks/reviews
are complete; historical pending statements below do not reopen that work.

## Current finish line — Independent operation before marketing

The user clarified the goal on October 8: complete the surrounding-service
migration, including required remote Anatomime realtime, so AtmoShaper is
independently operational and ready to market. The narrower public launch is
complete; the following required work is still open. Broad refactors stay deferred.
The [independent launch plan](../superpowers/plans/2026-10-08-atmoshaper-independent-launch-readiness.md)
owns the implementation order and exact acceptance/provider-change packets.

| Work | Completed evidence | Required next gate |
| --- | --- | --- |
| Source and administrative closeout | PR #41 merged as `acd05b0`; all seven final-source CI jobs, clean Codex/full CodeRabbit and 32 resolved findings; final receipts private and review heartbeat paused | Keep current-state/handoff records aligned with the new goal; new source changes receive appropriate reviews/checks |
| Hosting and environments | Approved PR #40 artifact remains READY/public on all six saved aliases; PR #41 candidate READY/unpromoted. October 8 readback preserves standard build, main Git binding, manual custom-domain assignment/protection, 60 Production-only settings and no Preview/Development settings | Preserve controls and alias recovery through each separately approved future exact-artifact rollout |
| Anatomime realtime | Existing room-scoped tokens/signals and bounded polling fallback are implemented; local source fixes fresh SDK renewal with provider-free checks passing. Production has no Ably setting | Source review, independently owned app/key/environment binding, real authorized host/phone turn updates and reconnect proof; fallback alone is insufficient |
| Sentry operations | Anonymous operational/privacy contract and DSN-gated source exist; Production has no Sentry configuration | Independent project, provider privacy settings, source maps and useful owner alerts; one separately scoped sanitized synthetic event |
| Media independence and branding | Existing delivery and limited HEAD checks have dated receipts; Production has no R2/upload configuration | Exact ownership/consumer inventory, independently administered resource and branded delivery, actual offered playback and compatible legacy URLs; decide in-place changes versus a bounded copy from evidence |
| Production Calendar journey | Credentials, permissions, bounded isolated application/provider tests, cleanup and public rollout complete | Normal public-app sign-in/Connect/sync/control-change journey with exact owned state and agreed cleanup; never repeat completed setup/comparison tests |
| One-time support and permanent backgrounds | Both remain disabled under the completed Supporter-only launch; local source prepares an explicit all-payment build scope, with provider-free nested-CLI regressions passing and the default boundary preserved | Source review and exact scope selection, corresponding tax/payment/fulfillment/reconciliation checks, scoped new-flow acceptance and exact activation approval; no automatic enablement exists |
| Mail, domains, database and other provider ownership | Dated auth/SMTP/support/migration-status/public-domain receipts exist | Verify independent admin/billing/recovery and any remaining branded inbound routing or hidden legacy bindings; no user-row exports or unapproved credential rotation |
| Legacy separation | User still needs MassageLab's working clock/tools while its later direction becomes a separate project | Transfer/reassign useful resources only after exact consumers and rollback are known; preserve working tools until observed replacement continuity and any separate retirement approval |

The goal is not complete until these required gates are proved or the user
explicitly changes the offered scope. Administrative documentation alone does
not make the unconfigured services ready.

## Completed milestones

| Area | Recorded outcome | Evidence owner |
| --- | --- | --- |
| Repository and history | Fresh AtmoShaper repository, preserved MassageLab history and rollback lineage, merged bootstrap and documentation/audit phases | [Lineage](../../MIGRATION_LINEAGE.md), [charter](../rebrand/atmoshaper-migration-charter.md), project log |
| Public identity | Reviewed rebrand and final assets are merged; established feature/domain language and private compatibility identifiers remain | Project log, [identity decision](../decisions/README.md), [brand-assets plan](../superpowers/plans/2026-09-27-atmoshaper-final-brand-assets.md) |
| Existing production site | The rebranded site is operational on the canonical AtmoShaper host; Google sign-in, administrator access, SMTP delivery, and support routing have dated operational receipts | Project state, [historical provider audit](../audits/2026-09-27-atmoshaper-provider-readiness.md) |
| Recurring Supporter billing | Dedicated live catalog and tax setup, use-specific Portals, pinned webhook, restricted credentials, idempotency, and live readiness passed; public registration and Supporter Checkout are now open | [Activation receipt](../superpowers/plans/2026-10-01-atmoshaper-supporter-public-activation.md), project state/log |
| Controlled live test | Payment, cancellation, full refund, and signed-webhook convergence completed before activation | Project state/log; do not repeat this completed gate |
| Separate Calendar source | Reviewed PR #40 availability source, completed comparisons/bounded acceptance and four-setting provisioning are followed by the separately approved exact-artifact public promotion. Seven anonymous public GETs and the Calendar sign-in guard pass; real Production OAuth/sync is not claimed | [Calendar provider checkpoint](../superpowers/plans/2026-10-02-atmoshaper-calendar-provider-stage.md), [rollout receipt](../superpowers/plans/2026-10-07-atmoshaper-calendar-production-credentials.md), project state/log |
| Production build safeguard | PR #37 merged after clean reviews and CI; one Production build passed actual migration-status and live Supporter gates, all seven candidate GETs, and the separately approved public rollout | [Vercel integration plan](../superpowers/plans/2026-10-02-atmoshaper-vercel-git-integration.md), project state/log |
| Existing Vercel project and Git integration | Existing project renamed `atmoshaper`, GitHub/`main` verified, standard build configured, and custom-domain auto-assignment disabled; checked PR #37 artifact promoted without rebuilding and all public checks passed | Vercel integration plan, project state/log; operator closeout [PR #38](https://github.com/dsbowersock/atmoshaper/pull/38) merged; automatic unpromoted build verified and moved convenience aliases restored |

These are bounded milestones. They do not establish that every provider was
migrated or that old-origin recovery and compatibility retirement are complete.

Read-only old-origin checks on 2026-10-01 returned `200` for the legacy www
home, Notes, manifest, service worker, and signed-out session (`null`). Requests
to the old apex followed its configured `308` redirect to legacy www. This
proves current public routing, not access to browser records on the apex origin,
encrypted export/import, old-origin authentication, or installed-PWA recovery.
Any future old-record recovery proof must distinguish those origins before
claiming recovery. The user subsequently clarified that no existing users are
expected to have professional records needing migration. This is scope input,
not an audit of private data. Existing-user transfer and a migration warning
are not current launch prerequisites. Preserve origin-bound storage, matching
vault contracts, and the full old site. The
[local-record/PWA checkpoint](../superpowers/plans/2026-10-02-atmoshaper-local-record-recovery.md)
retains the findings and separates general product improvements from migration.

The earlier direction retained the full MassageLab site alongside AtmoShaper.
On October 8 the user clarified that useful surrounding resources should move
to independently operated AtmoShaper, while the current MassageLab clock and
tools must keep working during the transition. MassageLab's future product
direction remains separate. Preserve its current deployment/routing, local-data
access, authentication, media and billing dependencies until a concrete change
has consumer/rollback evidence and exact authority. No blanket redirect or
retirement follows from the new goal. Account, record and membership transfers
remain distinct operations; no automatic PHI transfer is authorized.

The user selected a separate Google calendar named `AtmoShaper`; the old
project's `MassageLab` calendar remains intact. The
[Calendar preparation plan](../superpowers/plans/2026-10-01-atmoshaper-google-calendar-preparation.md)
records implementation and provider gates. The Production variable-name
inventory on 2026-10-01 lacks Calendar OAuth credentials and its token-encryption key,
Ably's server key, Sentry's DSN, and R2 upload credentials. This inventory does
not verify existing media playback, polling behavior, provider permissions,
or any user's connection or records.

The merged [Calendar PR #36](https://github.com/dsbowersock/atmoshaper/pull/36)
prepares account-bound, marked-calendar discovery and stored-ID reconnects,
with 81 focused regressions passing. Review repairs preserve inactive history
and bound discovery while retaining serialization. New event inserts keep
their existing wait behavior to avoid losing accepted POST IDs to local
timeouts; no event-ID migration or end-to-end idempotency claim is introduced.
A committed inactive intent also prevents a blind calendar-create retry while
its earlier outcome is unknown. A discovered valid target can be reconciled
without another POST. The disconnect action also blocks direct deletion of
unresolved intents while retaining ordinary resolved disconnects. This invocation's
proven pre-POST failure can release only its matching saved intent under the user
lock; attempted/uncertain creation, changed state, and failed cleanup stay
conservative. Failed transactions cancel late discovery before cleanup so it
cannot create afterward. Separate aggregate read budgets also cover inbound
validation/event pagination (60 seconds) and outbound validation (30 seconds).
They preserve failed cursors and stop later source reads without timing out
new-event POST responses. Its reviewed head is
`0c3241cb3052877f07453d31b97b71ae4337e3eb`; the separately approved source-only
merge is `154f9b6d440e0842892b96e185190c5be1ed2e22`. Final full regression
passes 5,105 of 5,108 tests with three expected skips and no failures. All seven
CI jobs, full CodeRabbit coverage of all eighteen files, Codex review, and
static checks pass; no actionable review threads remain. The merge did not deploy.
This source preparation does not identify or configure the Cloud project/client, validate hosted consent,
create a calendar, or activate Calendar sync.

Earlier Dashboard screenshots established the hosting stage's starting name,
absent Git link, and enabled automatic custom-domain assignment. Under the
user's subsequent hosting approval, the same project is now named `atmoshaper`,
custom-domain auto-assignment is off, and Build Command is `npm run build`.
The user completed normal App access and the Dashboard connection; direct
authenticated project readback verifies `dsbowersock/atmoshaper` on `main`.
That evidence supersedes misleading repository-discovery responses. Do not
repeat setup or reconnect. One approved candidate from merged PR #37,
`f184fc1d2ea9cf0adfeff7d810d9db408fc6970e`, reached `READY` at
`2026-10-02T23:56:01Z` with actual remote migration-status and live Supporter
readiness gates passing. The user subsequently approved promotion of that exact
existing artifact with rollback if verification failed. It is now the live
project target for all six recorded live aliases, preserving all four original
alias names, verified domains, apex redirect, and protection. All seven post-promotion public
GETs pass and Public Pricing assets match the checked candidate. No rollback
was needed. Public
registration/Supporter flags remain open and excluded purchases disabled.
Calendar credentials were absent at that earlier public rollout; the October 7
credential stage below added them to a new checked candidate, which was later
promoted under separate exact approval.
The initial authenticated fetch failed, but a later
normal authenticated retry succeeded and all seven candidate GET checks now
pass. The user supplied an open-registration screenshot and reported successful
partial browser checks. No additional manual page readback is needed. The
[Vercel integration plan](../superpowers/plans/2026-10-02-atmoshaper-vercel-git-integration.md)
records the exact approval, verified artifact promotion, and saved rollback.
Old-origin recovery and other migration gates remain open. The Calendar rollout
is complete as recorded in the ledger below; future builds retain manual public
promotion.

## Historical remaining ledger — Before October 8 goal clarification

This table preserves the earlier Supporter/public-rollout handoff. Its optional
classifications and PR #41 pending statements are superseded by the current
required-work table above. Dated proof limits and compatibility rules remain.

| Work | Present boundary / missing evidence | Next authorized-safe step | Input or separate authority needed |
| --- | --- | --- | --- |
| Hosting closeout documentation | PR #38's documentation-only candidate/alias-restoration receipt is complete; later public source is the separately approved PR #40 Calendar artifact. The operator and guarded-acceptance closeout is published in [PR #41](https://github.com/dsbowersock/atmoshaper/pull/41); its `2bd0d4c` checkpoint passes all seven CI jobs, READY Preview and clean Codex, followed by the October 8 full CodeRabbit review and two source/doc follow-ups | Preserve manual promotion and the [integration receipt](../superpowers/plans/2026-10-02-atmoshaper-vercel-git-integration.md); use PR #41 for live exact-head review/check status and retain final receipts privately | Later source fixes require fresh hosted coverage; merge needs separate approval. No hosting setup, App grant or completed test rerun is needed |
| Old-origin local records and PWA | No existing-user record transfer is expected under the user's clarification; stable contracts and both sites are retained. Actual transfer/installed-upgrade acceptance is not claimed | Retain the [scope checkpoint](../superpowers/plans/2026-10-02-atmoshaper-local-record-recovery.md); defer generic import/cache/offline improvements to separate product work | Ask only if real transfer, new recovery entrypoint, QA resources, old-origin behavior, or user-data access becomes needed. Never transfer PHI automatically |
| Legacy Stripe coexistence and possible later retirement | The old site is to remain fully available. The 2026-09-27 subscription inventory is historical and does not establish current retirement safety | Refresh bounded aggregate/provider evidence only when needed; preserve the existing service and both reconciliation histories | Ask for an exact subscription/endpoint decision after fresh evidence. New-account activation does not authorize legacy cancellation, refund, or deletion |
| Google Calendar | Reviewed [PR #40](https://github.com/dsbowersock/atmoshaper/pull/40) is merged; comparisons/bounded acceptance and cleanup pass. Owner scope/status receipts report no Sensitive/Restricted scopes or verification requirement. The approved credential-equipped exact-`38d0ded` artifact is now READY/live on all six saved aliases. All 60 settings remain Production-only; public pages/guard/redirect and build gates pass. No real Production OAuth exchange is claimed | Preserve the [completed rollout and saved rollback](../superpowers/plans/2026-10-07-atmoshaper-calendar-production-credentials.md); shepherd published PR #41's guarded-harness and operator receipts | No new file, setup, consent, fixture, database test or verification submission is needed. Source merge, new live provider tests and future hosting changes still require exact scope |
| Ably realtime | October 7 complete name inventory has no Ably configuration; reviewed source retains polling fallback. No new hosted room/parity test is claimed | Retain the existing fallback; prepare an isolated connectivity plan only if a realtime change is requested | New Ably setup, room publication, presence mutation, channel rename and key rotation remain separately scoped |
| Sentry | October 7 complete name inventory has no Sentry configuration; reviewed source disables collection without its DSN. Build-plugin notices do not establish application monitoring | Retain DSN-gated behavior and the documented privacy boundary; prepare exact sanitized monitoring scope if requested | Enabling a project/DSN requires separate authority. Session Replay, screenshots, attachments, logs and broader feedback remain gated |
| Media provider administration | No R2/upload configuration is present. Four existing source-referenced media HEADs pass type/range/cache/CORS checks from the AtmoShaper origin; no bodies were downloaded. Full playback/catalog and provider ownership are not proved | Preserve the compatible existing host and immutable media identities; prepare dedicated ownership/URL/rollback evidence before any media-host migration | Upload, object move/delete, host retirement, CORS/configuration writes and provenance promotion need exact authority. The failed legacy-project configuration read is a readback limit, not proof of parity or a setup failure |
| Mail and support refinements | SMTP delivery and current support routing are operational; inbound branded-domain forwarding was deliberately deferred | Recheck published sender authentication and support presentation without sending mail | Ask before enabling forwarding, retiring a legacy address, changing DNS/mail settings, or a delivery/bounce test |
| Database/provider scope | Production migration status passed in the authorized remote build; historical personal-Neon project listings did not prove direct destination access | Identify the correct read-only destination authority before any additional aggregate audit | Ask for exact target and access if the available connector does not expose it; never guess a project or export rows |
| Remaining host/retirement decisions | Public AtmoShaper apex/canonical behavior is verified for this release; protective-domain and broad old-origin redirect/retirement receipts remain separate | Reconcile the host matrix and saved rollback/recovery requirements | Ask before DNS, redirect, project/alias retirement, or recovery-period changes |
| Optional cleanup/refactors | The optional brand audit has stale occurrence rules; broad cleanup and identifier retirement were not part of Supporter readiness | Prepare focused evidence-backed audit reconciliation or a measured refactor | Preserve old identifiers and evidence; ask before a dedicated retirement or scope change |

## Next-agent rules

1. Verify repository branch, head, clean/dirty state, hosted source, and current
   provider state before taking the next step. Preserve unrelated local work.
2. Use this ledger to find the next incomplete dependency and its detailed owner;
   do not repeat completed tests, migrations, refunds, or provider bootstraps.
3. Historical tables and audits preserve what was true when recorded. Their
   pending/open statements do not override the current project snapshot, and a
   historical success is not fresh authority for another provider operation.
4. Complete read-only investigation and prepare a concrete, bounded change before
   asking for a provider write. Check in whenever a missing fact, user decision,
   or exact authorization is needed; do not invent an integration choice.
5. Keep one-time support and background purchases disabled unless a separately
   reviewed readiness scope and exact activation approval change that boundary.
6. Put fresh sanitized outcomes in project state and log. Never record secrets,
   private provider/project identifiers, connection strings, customer data, or
   browser records. Preserve legal acceptance and local-first PHI boundaries.
