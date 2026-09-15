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

Code links point to the working repository. Public-identity, Atmosphere, legal,
and catalog owners reflect the reviewed local Phase 6 implementation through
`75e2741aa3ea5d2cb24fef62fdefb1b5564d4bfe`; its systemic repair makes five
actual public-audio literals delegate to the unchanged Atmosphere label owner.
Historical provider receipts in
linked wikis remain dated evidence and do not prove current hosted state.

| Boundary | Documentation owner | Code owner and responsibility |
| --- | --- | --- |
| App shell and routes | [Visual system](wiki/visual-system.md), [local development](wiki/local-development.md) | [Root layout](../app/layout.tsx) composes persistent settings, account, sidebar, music and PWA providers. [Layout wrapper](../components/layout-wrapper.tsx), [shell policy](../lib/app-shell.js), [sidebar](../components/sidebar/) and [App Router](../app/) own navigation, placement and route-specific layout. |
| Local professional records | [Privacy and PHI](wiki/privacy-and-phi.md), [data architecture](wiki/privacy-first-data-architecture.md) | [Vault domain](../lib/professional-record-vault.js) and [vault provider](../app/notes/professional-record-vault-provider.tsx) own encrypted browser persistence, session unlock, legacy inputs and user-controlled encrypted export/import for [Notes](../app/notes/). [Clinical sync route](../app/api/clinical/sync/route.ts) remains unavailable even when compliance flags open the gate. |
| Hosted account and client wellness data | [Data architecture](wiki/privacy-first-data-architecture.md), [privacy and PHI](wiki/privacy-and-phi.md) | [Prisma schema](../prisma/schema.prisma) owns persisted models; [account preferences](../lib/account-preferences.js) owns sanitized preference projection. [Wellness actions](../app/wellness/actions.ts) and [wellness domain](../lib/client-wellness.js) own signed-in, client-owned self-tracking; anonymous practice is in memory. These are separate from professional records; live therapist sharing remains deferred. |
| Account security | [Account security](wiki/account-security.md), [Admin user operations](wiki/admin-user-operations.md), [deployment](wiki/deployment.md), [release checklist](wiki/release-checklist.md) | [Auth](../auth.ts), [method-intent proof](../lib/auth-method-intent-proof.ts), [account methods](../lib/account-security-methods.ts), [2FA management](../lib/account-two-factor-management.ts) and [schema](../prisma/schema.prisma) own identity, credential proofs, intent consumption, factor changes and session invalidation. |
| Memberships and permanent background commerce | [Billing and memberships](wiki/billing-memberships.md) | [Membership policy](../lib/membership.js), [membership webhook service](../lib/membership-webhook-service.ts), [billing webhook](../app/api/billing/webhook/route.ts) and [commerce services](../lib/commerce/) own entitlement projection and durable purchase/credit ownership. [Background access](../lib/commerce/background-access.ts) owns selected-background access. Check feature keys such as `premium_backgrounds`; browser state and Checkout returns do not grant ownership. |
| Calendar and booking | [Calendar creation flows](wiki/calendar-creation-flows.md), [privacy and PHI](wiki/privacy-and-phi.md) | [Calendar actions](../app/calendar/actions/), [schema](../prisma/schema.prisma), [sync service](../lib/calendar-sync-service.ts) and [Google adapter](../lib/google-calendar-adapter.ts) own scheduling, availability and provider busy windows. Scheduling metadata stays separate from clinical content; notification intents do not imply message delivery or booking payment collection. |
| Public product identity | [Phase 6 design](superpowers/specs/2026-09-14-atmoshaper-phase6-preview-rebrand-design.md), [ADR 0002](decisions/0002-public-identity-legal-and-compatibility-boundaries.md) | [Public identity](../lib/public-product-identity.js) owns exact `AtmoShaper` product/short names and approved presentation-asset availability. Its null logo/social-image values drive the accessible text-only fallback; consumers own contextual sentences, while legal, provider, domain, persistence, and compatibility identifiers remain separate. |
| Shared audio | [Atmosphere audio](wiki/atmosphere-audio.md) | [Music provider](../components/providers/music-provider.tsx) owns one global playback surface shared by stations and the live-session mixer at [Music](../app/music/). [Public feature labels](../lib/atmosphere/public-labels.js) own exactly `Atmosphere` and `Atmosphere mixer`. The reviewed proof-station presentation is title `Drone`, artist `AtmoShaper`, and stable ID `mlab-proof-drone`; the ID-keyed artwork compatibility model preserves its existing bytes and revision. [Atmosphere runtime](../lib/atmosphere/), [internal mixer domain](../lib/atmoshaper/) and [production catalog](../data/atmoshaper/production-audio-catalog.json) retain source, release and compatibility ownership. The live recipe is memory-only; saved mixes remain future work. |
| Legal presentation and acceptance | [Phase 6 design](superpowers/specs/2026-09-14-atmoshaper-phase6-preview-rebrand-design.md), [ADR 0002](decisions/0002-public-identity-legal-and-compatibility-boundaries.md) | [Legal documents](../lib/legal-documents.js) remain the only current registry and expose the approved v3 versions and exact DBA identity. [Legal acceptance](../lib/legal-acceptance.js) retains versioned-row ownership. [Evidence-only archives](../data/legal-document-history/) preserve the exact prior v2 exports and never become a runtime fallback. |
| Operational diagnostics | [Privacy and PHI](wiki/privacy-and-phi.md#support-and-diagnostics-boundary), [deployment](wiki/deployment.md#anonymous-operational-boundary) | [Sentry options](../lib/sentry-options.js), [privacy scrubber](../lib/sentry-privacy.js), [problem-report domain](../lib/problem-report.js) and [report endpoint](../app/api/support/problem-report/route.ts) own anonymous operational diagnostics. No user/session identity, clinical or wellness content, screenshots, replay or freeform report text belongs in telemetry. |
| Visual controls and backgrounds | [Visual system](wiki/visual-system.md) | [Shared UI](../components/ui/), [global styles](../app/globals.css) and [Chimer controls](../components/chimer-controls/) own control mechanics, tokens, focus and motion. [Development review surface](../app/dev/buttons/) is the visual approval owner; route structure does not authorize duplicate control mechanics. |
| Origin, install and provider boundaries | [PWA strategy](wiki/pwa-offline-strategy.md), [deployment](wiki/deployment.md), [external checklist](rebrand/atmoshaper-external-account-checklist.md) | [Trusted form origin](../lib/trusted-form-origin.js), [auth environment](../lib/auth-env.ts), [SEO](../lib/seo.js), [manifest](../app/manifest.ts), [service worker](../public/sw.js) and [worker registration](../components/providers/service-worker-provider.tsx) own current origin behavior. Provider adapters retain their existing contracts; repository identity does not move traffic, credentials, data or installations. |

## Migration constraints and proposed architecture

[ADR 0002](decisions/0002-public-identity-legal-and-compatibility-boundaries.md)
is Accepted because Task 9 completed local implementation and command
verification of the public-identity, legal-version, and compatibility decision.
Exact Task 9 temporary cleanup is complete with absence proved, and its final
receipt-only baseline reached a byte-identical fixed point with zero missing or
unclassified references. Complete-branch reviews are APPROVED; coordinator
commit remains a repository-integration gate, not an open architecture question.
[ADR 0003](decisions/0003-origin-bound-local-data-and-pwa-recovery.md)
and [ADR 0004](decisions/0004-parallel-provider-staging-and-cutover.md) remain
Proposed. The central public-brand owner came from merged Phase 5; Phase 6 now
uses it for current AtmoShaper presentation, adds the noun-only Atmosphere owner,
and completes the archive-first versioned legal transition. Dedicated old-origin
recovery and parallel provider staging remain future work.

The [migration charter](rebrand/atmoshaper-migration-charter.md),
[local-data/PWA plan](rebrand/atmoshaper-local-data-and-pwa-plan.md),
[domain plan](rebrand/atmoshaper-domain-cutover-plan.md) and
[rollback plan](rebrand/atmoshaper-rollback-plan.md) own the later gates. The
[LICENSE](../LICENSE), [legal documents](../lib/legal-documents.js) and
[legal acceptance](../lib/legal-acceptance.js) retain legal identity and historical
agreements independently of public naming. Phase 6 may change current legal
presentation after exact prior-version archiving and under new version IDs; it
does not rewrite old acceptance rows, compatibility IDs, or hosted state.
