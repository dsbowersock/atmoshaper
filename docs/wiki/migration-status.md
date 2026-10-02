# AtmoShaper migration status and remaining work

Read [project state](../project-state.md) first for the active snapshot and
[project log](../project-log.md) for dated receipts. This guide connects the
original migration scope with the work still needed; it does not replace those
owners or authorize provider changes. Verified: 2026-10-02.

## Completed milestones

| Area | Recorded outcome | Evidence owner |
| --- | --- | --- |
| Repository and history | Fresh AtmoShaper repository, preserved MassageLab history and rollback lineage, merged bootstrap and documentation/audit phases | [Lineage](../../MIGRATION_LINEAGE.md), [charter](../rebrand/atmoshaper-migration-charter.md), project log |
| Public identity | Reviewed rebrand and final assets are merged; established feature/domain language and private compatibility identifiers remain | Project log, [identity decision](../decisions/README.md), [brand-assets plan](../superpowers/plans/2026-09-27-atmoshaper-final-brand-assets.md) |
| Existing production site | The rebranded site is operational on the canonical AtmoShaper host; Google sign-in, administrator access, SMTP delivery, and support routing have dated operational receipts | Project state, [historical provider audit](../audits/2026-09-27-atmoshaper-provider-readiness.md) |
| Recurring Supporter billing | Dedicated live catalog and tax setup, use-specific Portals, pinned webhook, restricted credentials, idempotency, and live readiness passed; public registration and Supporter Checkout are now open | [Activation receipt](../superpowers/plans/2026-10-01-atmoshaper-supporter-public-activation.md), project state/log |
| Controlled live test | Payment, cancellation, full refund, and signed-webhook convergence completed before activation | Project state/log; do not repeat this completed gate |
| Separate Calendar source | PR #36 merged at its unchanged reviewed head after all seven CI jobs, full CodeRabbit coverage, and Codex review passed; provider acceptance and activation remain pending | [Calendar preparation plan](../superpowers/plans/2026-10-01-atmoshaper-google-calendar-preparation.md), project state/log |
| Production build safeguard | PR #37 merged after all seven CI jobs, clean full CodeRabbit/Codex reviews, and resolved threads; the standard build now checks live Supporter readiness after migration status | [Vercel integration plan](../superpowers/plans/2026-10-02-atmoshaper-vercel-git-integration.md), project state/log; remote gate execution remains pending |

These are bounded milestones. They do not establish that every provider was
migrated or that old-origin recovery and compatibility retirement are complete.

Read-only old-origin checks on 2026-10-01 returned `200` for the legacy www
home, Notes, manifest, service worker, and signed-out session (`null`). Requests
to the old apex followed its configured `308` redirect to legacy www. This
proves current public routing, not access to browser records on the apex origin,
encrypted export/import, old-origin authentication, or installed-PWA recovery.
The Phase 8 proof must distinguish those origins before any retirement decision.

The user chose to keep the full MassageLab site available alongside AtmoShaper.
MassageLab will continue after the migration as a separate project. Its future
product direction is outside this work. The current platform migration to
AtmoShaper retains its approved feature scope.
Preserve its current deployment and routing, local-data access, authentication,
and billing endpoints. Do not prepare an old-to-AtmoShaper redirect or retire
the old service by default. Account, record, membership, and endpoint transfers
or retirement remain separate decisions with their own evidence and approval.

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

The user's current Vercel Dashboard screenshot confirms that the existing live
project retains its preview-era name and has no Git connection (`Connect Git
Repository`). This completes the earlier manual observation request. It does
not mean hosting, sign-in, or Supporter activation must be repeated. Fresh
post-merge deployment reads showed the same latest Production/CLI deployment.
The [Vercel integration plan](../superpowers/plans/2026-10-02-atmoshaper-vercel-git-integration.md)
owns the remaining naming, repository connection, and manual promotion proposal.
The subsequent Production-detail screenshot confirms that `Auto-assign Custom
Production Domains` is present and enabled. That read-only check is complete.
The user separately approved the Production build gate's merge through PR #37
as `f184fc1d2ea9cf0adfeff7d810d9db408fc6970e`. Fresh post-merge reads confirm
the same live artifact. Restored normal CLI login now permits settings readback:
the existing project has no build override, no Git link, and enabled automatic
custom-domain assignment. All four aliases retain the approved live target.
Production configuration preserves the launch boundaries; Preview/Development
have no project variables. Vercel's owner-specific repository read reports its
GitHub App is not installed. The user subsequently authorized the bounded
hosting stage and reported granting App access. The existing project is now
named `atmoshaper`, custom-domain auto-assignment is off, and the explicit Build
Command is `npm run build`; all four aliases retain the prior live artifact.
Git connection and one unpromoted candidate still await verified App access.
The connection command was rejected before execution by automatic approval
review while Vercel still reported missing access. Public promotion is separate.

## Remaining migration ledger

| Work | Present boundary / missing evidence | Next authorized-safe step | Input or separate authority needed |
| --- | --- | --- | --- |
| Vercel project name and Git integration | Approved rename and build/promotion safeguards are applied to the same project; all four aliases retain the prior live artifact. User reported App grant, but Vercel access lookup remains unresolved and Git is absent | Follow the [existing-project integration plan](../superpowers/plans/2026-10-02-atmoshaper-vercel-git-integration.md); verify the exact App installation through supported reads, then retry the authorized connection and one unpromoted candidate | Hosting stage already authorized; exact App Configure-page reference requested for access verification. Public promotion remains a later approval. Do not reimport the app or repeat satisfied settings/login questions |
| Old-origin local records and PWA | The inventory and recovery contract exist; no current end-to-end old-origin encrypted export/import or installed-old-PWA receipt is established by the Supporter launch | Reconcile the [local-data/PWA plan](../rebrand/atmoshaper-local-data-and-pwa-plan.md) and [domain plan](../rebrand/atmoshaper-domain-cutover-plan.md) against current code and both old origins; prepare a bounded synthetic recovery matrix | Ask before choosing a new recovery entrypoint, creating QA resources, changing old-origin behavior, or performing user-data access. Never transfer PHI automatically |
| Legacy Stripe coexistence and possible later retirement | The old site is to remain fully available. The 2026-09-27 subscription inventory is historical and does not establish current retirement safety | Refresh bounded aggregate/provider evidence only when needed; preserve the existing service and both reconciliation histories | Ask for an exact subscription/endpoint decision after fresh evidence. New-account activation does not authorize legacy cancellation, refund, or deletion |
| Google Calendar | A separate `AtmoShaper` calendar is selected and its source preparation is merged; OAuth/client/callback readiness and actual provider behavior remain unverified | Follow the [Calendar preparation plan](../superpowers/plans/2026-10-01-atmoshaper-google-calendar-preparation.md); identify the existing technical targets and prepare isolated provider acceptance | Ask before client/callback writes, QA resource or calendar creation/sync, token or row migration, a deployment, or public activation |
| Ably realtime | The historical provider audit documents polling fallback; no hosted isolated-realtime parity receipt is added by this launch | Verify fallback configuration and prepare an isolated connectivity plan if realtime is wanted | Ask whether to retain fallback or authorize a scoped Ably setup; no room publication, presence mutation, channel rename, or key rotation |
| Sentry | Public activation adds no monitoring-project or credential configuration; build-plugin telemetry is not evidence of application monitoring | Inventory sanitized runtime configuration and the existing privacy boundary | Ask before enabling a project or DSN. Session Replay, screenshots, attachments, logs, and broader feedback remain gated |
| Media provider administration | Existing playback/immutable media identities are preserved; missing upload credentials alone do not prove playback failure | Read known public media headers and reconcile R2/CORS/cache owners | Ask before upload, object move/delete, host retirement, CORS/configuration write, or provenance promotion |
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
