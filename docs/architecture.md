# AtmoShaper Architecture Owner Map

This page routes architectural questions to their current documentation and code
owners. [Project state](project-state.md) owns current status; [project log](project-log.md)
owns this repository's chronology. Domain wikis own operating rules, and the
[decision index](decisions/README.md) records durable migration decisions. Plans
describe proposed execution and do not establish completed runtime or provider state.

## Repository boundary

AtmoShaper starts from MassageLab source
[`e74045c2fc85c2cb4df176fdb1aff2137c4d9848`](https://github.com/dsbowersock/massagelab/commit/e74045c2fc85c2cb4df176fdb1aff2137c4d9848).
Its sole fresh root is
[`7e89f7ba9508a1ad715c1824ea6099432e6a4ccd`](https://github.com/dsbowersock/atmoshaper/commit/7e89f7ba9508a1ad715c1824ea6099432e6a4ccd),
and bootstrap PR #1 merged as
[`f59e1b9371b06e7401740ae011f6dc911430a97c`](https://github.com/dsbowersock/atmoshaper/commit/f59e1b9371b06e7401740ae011f6dc911430a97c).
[Migration lineage](../MIGRATION_LINEAGE.md) and [ADR 0001](decisions/0001-fresh-root-lineage-and-history-ownership.md)
own the exact connection and historical/rollback ownership. These commits describe
repository history, not a production deployment or domain cutover.

## Current owners

Code links point to the working repository. The map was checked against the merged
bootstrap tree; historical provider receipts in linked wikis remain dated evidence.

| Boundary | Documentation owner | Code owner and responsibility |
| --- | --- | --- |
| App shell and routes | [Visual system](wiki/visual-system.md), [local development](wiki/local-development.md) | [Root layout](../app/layout.tsx) composes persistent settings, account, sidebar, music and PWA providers. [Layout wrapper](../components/layout-wrapper.tsx), [shell policy](../lib/app-shell.js), [sidebar](../components/sidebar/) and [App Router](../app/) own navigation, placement and route-specific layout. |
| Local professional records | [Privacy and PHI](wiki/privacy-and-phi.md), [data architecture](wiki/privacy-first-data-architecture.md) | [Vault domain](../lib/professional-record-vault.js) and [vault provider](../app/notes/professional-record-vault-provider.tsx) own encrypted browser persistence, session unlock, legacy inputs and user-controlled encrypted export/import for [Notes](../app/notes/). [Clinical sync route](../app/api/clinical/sync/route.ts) remains unavailable even when compliance flags open the gate. |
| Hosted account and client wellness data | [Data architecture](wiki/privacy-first-data-architecture.md), [privacy and PHI](wiki/privacy-and-phi.md) | [Prisma schema](../prisma/schema.prisma) owns persisted models; [account preferences](../lib/account-preferences.js) owns sanitized preference projection. [Wellness actions](../app/wellness/actions.ts) and [wellness domain](../lib/client-wellness.js) own signed-in, client-owned self-tracking; anonymous practice is in memory. These are separate from professional records; live therapist sharing remains deferred. |
| Account security | [Admin user operations](wiki/admin-user-operations.md), [deployment](wiki/deployment.md), [release checklist](wiki/release-checklist.md) | [Auth](../auth.ts), [method-intent proof](../lib/auth-method-intent-proof.ts), [account methods](../lib/account-security-methods.ts), [2FA management](../lib/account-two-factor-management.ts) and [schema](../prisma/schema.prisma) own identity, credential proofs, intent consumption, factor changes and session invalidation. The focused account-security wiki is added by Phase 3 Task 2; until then these code owners define the implementation. |
| Memberships and permanent background commerce | [Billing and memberships](wiki/billing-memberships.md) | [Membership policy](../lib/membership.js), [membership webhook service](../lib/membership-webhook-service.ts), [billing webhook](../app/api/billing/webhook/route.ts) and [commerce services](../lib/commerce/) own entitlement projection and durable purchase/credit ownership. [Background access](../lib/commerce/background-access.ts) owns selected-background access. Check feature keys such as `premium_backgrounds`; browser state and Checkout returns do not grant ownership. |
| Calendar and booking | [Calendar creation flows](wiki/calendar-creation-flows.md), [privacy and PHI](wiki/privacy-and-phi.md) | [Calendar actions](../app/calendar/actions/), [schema](../prisma/schema.prisma), [sync service](../lib/calendar-sync-service.ts) and [Google adapter](../lib/google-calendar-adapter.ts) own scheduling, availability and provider busy windows. Scheduling metadata stays separate from clinical content; notification intents do not imply message delivery or booking payment collection. |
| Shared audio | [Atmosphere audio](wiki/atmosphere-audio.md) | [Music provider](../components/providers/music-provider.tsx) owns one global playback surface shared by stations and the live-session mixer at [Music](../app/music/). [Atmosphere runtime](../lib/atmosphere/), [internal mixer domain](../lib/atmoshaper/) and [production catalog](../data/atmoshaper/production-audio-catalog.json) retain source, release and compatibility ownership. The live recipe is memory-only; saved mixes remain future work. |
| Operational diagnostics | [Privacy and PHI](wiki/privacy-and-phi.md#support-and-diagnostics-boundary), [deployment](wiki/deployment.md#anonymous-operational-boundary) | [Sentry options](../lib/sentry-options.js), [privacy scrubber](../lib/sentry-privacy.js), [problem-report domain](../lib/problem-report.js) and [report endpoint](../app/api/support/problem-report/route.ts) own anonymous operational diagnostics. No user/session identity, clinical or wellness content, screenshots, replay or freeform report text belongs in telemetry. |
| Visual controls and backgrounds | [Visual system](wiki/visual-system.md) | [Shared UI](../components/ui/), [global styles](../app/globals.css) and [Chimer controls](../components/chimer-controls/) own control mechanics, tokens, focus and motion. [Development review surface](../app/dev/buttons/) is the visual approval owner; route structure does not authorize duplicate control mechanics. |
| Origin, install and provider boundaries | [PWA strategy](wiki/pwa-offline-strategy.md), [deployment](wiki/deployment.md), [external checklist](rebrand/atmoshaper-external-account-checklist.md) | [Trusted form origin](../lib/trusted-form-origin.js), [auth environment](../lib/auth-env.ts), [SEO](../lib/seo.js), [manifest](../app/manifest.ts), [service worker](../public/sw.js) and [worker registration](../components/providers/service-worker-provider.tsx) own current origin behavior. Provider adapters retain their existing contracts; repository identity does not move traffic, credentials, data or installations. |

## Migration constraints and proposed architecture

[ADR 0002](decisions/0002-public-identity-legal-and-compatibility-boundaries.md),
[ADR 0003](decisions/0003-origin-bound-local-data-and-pwa-recovery.md) and
[ADR 0004](decisions/0004-parallel-provider-staging-and-cutover.md) remain Proposed.
Central public-brand ownership, dedicated old-origin recovery and parallel provider
staging are not implemented by this documentation phase. Existing runtime MassageLab
copy remains until the separately reviewed Phase 6 preview rebrand.

The [migration charter](rebrand/atmoshaper-migration-charter.md),
[local-data/PWA plan](rebrand/atmoshaper-local-data-and-pwa-plan.md),
[domain plan](rebrand/atmoshaper-domain-cutover-plan.md) and
[rollback plan](rebrand/atmoshaper-rollback-plan.md) own the later gates. The
[LICENSE](../LICENSE), [legal documents](../lib/legal-documents.js) and
[legal acceptance](../lib/legal-acceptance.js) retain legal identity and historical
agreements independently of public naming. No architecture-map entry changes those
owners, accepted text, compatibility IDs, runtime behavior or hosted state.
