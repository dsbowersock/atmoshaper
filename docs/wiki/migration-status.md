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

The published [Calendar PR #36](https://github.com/dsbowersock/atmoshaper/pull/36)
prepares account-bound, marked-calendar discovery and stored-ID reconnects,
with 75 focused regressions passing. Review repairs preserve inactive history
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
cannot create afterward. Final complete-regression and hosted-review receipts
for this retry repair are tracked in PR #36.
Publication and CodeRabbit shepherding are authorized; required final-head
hosted checks and follow-up are tracked in PR #36. Merge is separately authorized.
This source preparation does not identify or configure the Cloud project/client, validate hosted consent,
create a calendar, or activate Calendar sync.

## Remaining migration ledger

| Work | Present boundary / missing evidence | Next authorized-safe step | Input or separate authority needed |
| --- | --- | --- | --- |
| Old-origin local records and PWA | The inventory and recovery contract exist; no current end-to-end old-origin encrypted export/import or installed-old-PWA receipt is established by the Supporter launch | Reconcile the [local-data/PWA plan](../rebrand/atmoshaper-local-data-and-pwa-plan.md) and [domain plan](../rebrand/atmoshaper-domain-cutover-plan.md) against current code and both old origins; prepare a bounded synthetic recovery matrix | Ask before choosing a new recovery entrypoint, creating QA resources, changing old-origin behavior, or performing user-data access. Never transfer PHI automatically |
| Legacy Stripe coexistence and possible later retirement | The old site is to remain fully available. The 2026-09-27 subscription inventory is historical and does not establish current retirement safety | Refresh bounded aggregate/provider evidence only when needed; preserve the existing service and both reconciliation histories | Ask for an exact subscription/endpoint decision after fresh evidence. New-account activation does not authorize legacy cancellation, refund, or deletion |
| Google Calendar | A separate `AtmoShaper` calendar is selected; OAuth/client/callback readiness and safe discovery remain unverified | Follow the [Calendar preparation plan](../superpowers/plans/2026-10-01-atmoshaper-google-calendar-preparation.md); prepare a focused provider-free compatibility change | Ask before client/callback writes, calendar creation/sync, token or row migration, a deployment, or public activation |
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
