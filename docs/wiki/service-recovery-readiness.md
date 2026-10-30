# Service, recovery and release readiness

This runbook prepares the remaining independent-operation and release gates. It does not authorize a provider read/write, backup, restore, mail send, payment, build, deployment, permission change or traffic move. AtmoShaper continues on the existing Vercel setup; hosting alternatives are deferred.

Read [current state](../project-state.md), [project log](../project-log.md) and the [current migration table](migration-status.md) first. The [migration charter](../rebrand/atmoshaper-migration-charter.md) and [independent launch plan](../superpowers/plans/2026-10-08-atmoshaper-independent-launch-readiness.md) own scope and preservation. Use the [acceptance plan](../superpowers/plans/2026-10-29-final-service-recovery-and-release-acceptance.md) to prepare a bounded next operation.

## Evidence rules

- Canonical state/log own current outcomes; the dated current migration table separates completed evidence from remaining gates. Plans and old checklist rows are requirements or historical evidence, not fresh provider truth or operational grants.
- Source shows intended controls. A green source test, migration-status check or READY build does not prove deployed bindings, backup coverage, restore acceptance, public promotion or commercial activation.
- Carry dated receipts forward only at their recorded source/environment/fixture scope. Record missing facts as **pending**, failed observations as **failed**, and work outside authority as **not authorized**. No missing item becomes a pass or an optional item through silence.
- Keep exact provider references, owners' private contact details, recovery locations, credentials, configuration values and provider receipts in owner-protected storage outside Git. Tracked records contain public logical service names and sanitized outcomes only. Do not hash or copy secrets into a public readiness record.

## Service register

Complete one private row for every launch dependency using the fields below. The public counterpart records only the logical service, source owner, dated proof scope and pending category. Sharing an owner account is acceptable when app/project lifecycle, credentials and consumers are isolated; a name change alone proves none of this.

| Private field | Required record / public-safe counterpart |
| --- | --- |
| Owner and administration | Exact service/resource and responsible administrator; account recovery and who can act during an incident. Public: responsibility/recovery recorded or pending. |
| Environment and consumers | Exact build/runtime/Production/Preview binding, credential role and all retained legacy consumers. Public: isolated binding verified, dated or pending; no IDs or values. |
| Billing and usage | Responsible payer/admin, plan/limits, alert recipient, agreed usage/cost ceiling and stop action. Public: accountability/limits accepted or pending; do not assume current plan features. |
| Recovery | Configuration/credential recovery, data coverage where applicable, owner-approved recovery objectives and observed rehearsal scope. Public: objectives/acceptance status and receipt date only. |
| Disposition and handoff | Independent; retain/reassign; migrate with compatibility; or retire only after consumers and approval permit. Name the operator, support route, rollback dependency and required next decision privately. |

Seed the register from these source owners; this is a dependency map, not a claim that current provider facts are verified:

| Dependency | Source / operational owner | Remaining focus |
| --- | --- | --- |
| GitHub and build service | [CI](../../.github/workflows/ci.yml), [package scripts](../../package.json), [CI runbook](ci-pr-checks.md) | Administration/recovery, exact reviewed source/check receipts, build-service billing/limits. |
| Existing Vercel app | [deployment runbook](deployment.md), [migration gate](../../scripts/assert-production-migrations-current.mjs), [payment gate](../../scripts/assert-production-stripe-readiness.mjs) | Final artifact/environment/alias agreement, manual promotion and saved rollback. |
| Neon / application database | [runtime connection validation](../../lib/prisma.ts), [schema](../../prisma/schema.prisma), [migration configuration](../../prisma.config.ts) | Deployed branch/credential binding, ownership, agreed recovery objectives and bounded restore acceptance. Migration status is not backup proof. |
| Account authentication / Google sign-in | [auth](../../auth.ts), [auth configuration](../../lib/auth-env.ts), [account security](account-security.md) | Final origin/client binding, administrator/recovery continuity and actual offered account journeys. |
| Google Calendar | [configuration](../../lib/calendar-sync-env.ts), [adapter](../../lib/google-calendar-adapter.ts), [launch-plan journey](../superpowers/plans/2026-10-08-atmoshaper-independent-launch-readiness.md) | Actual offered Production OAuth/sync journey and ownership; local Calendar persistence does not substitute. |
| Resend / SMTP | [bounded mail transport](../../lib/auth-mail.ts), [mail ceilings](deployment.md#operational-abuse-and-email-ceilings) | Production transport/sender alignment, billing/health/limits and any genuinely missing bounded delivery proof. |
| Public support inbox | [support target and mailto](../../lib/support-contact.js), [support page](../../app/support/page.tsx) | Reachable branded inbox, responsible responder and diagnostic/incident handoff. `atmoshaper@gmail.com` is the current source target; domain forwarding is explicitly postponed in the [external checklist](../rebrand/atmoshaper-external-account-checklist.md). |
| Stripe / purchases | [billing owner](../../lib/stripe-billing.js), [readiness contract](../../lib/stripe-readiness.js), [billing runbook](billing-memberships.md) | Exact deployed all-payments scope, catalog/tax/legal/rights/webhook/reconciliation evidence and later activation. |
| Ably / remote Anatomime | [realtime owner](../../lib/anatomime-realtime.ts) | Final app/key-role/environment isolation, quota/billing/recovery and offered-release connectivity; preserve completed guest realtime acceptance. |
| Sentry | [SDK policy](../../lib/sentry-options.js), [privacy boundary](../../lib/sentry-privacy.js), [operations](sentry-operations.md) | Final DSN/app/release binding, owner alerts/limits and any distinct offered runtime context. Preserve the closed event/email campaign. |
| Media / Cloudflare | [media independence](media-independence.md), [R2 transport](../../lib/atmosphere/r2-sample-hosting.js), [audio release builder](../../lib/atmoshaper/production-release-builder.js) | Rights/cohort, branded delivery, cache/CORS/range/playback, exact catalog binding and write-backout; ownership/usage/recovery separately. |
| Domains / DNS / public metadata | [SEO owner](../../lib/seo.js), [robots](../../app/robots.ts), [sitemap](../../app/sitemap.ts), [external checklist](../rebrand/atmoshaper-external-account-checklist.md) | Registrar/DNS recovery and billing, exact host behavior and final output. Social ownership is a fact to establish, not a profile to invent. |
| Local records / installed app | [vault](../../lib/professional-record-vault.js), [manifest](../../app/manifest.ts), [service worker](../../public/sw.js), [privacy](privacy-and-phi.md) | Preserve local-first PHI, compatibility and both working sites. No assumed existing-user transfer or generic new import/offline campaign. |
| Scheduled / operator dependencies | [CI](../../.github/workflows/ci.yml), [deployment](deployment.md), private owner inventory | Identify actual scheduled jobs, maintenance consumers and credential recovery. Source search alone cannot certify that provider-side jobs do not exist. |

## Carry forward closed evidence

The October 29 [current migration table](migration-status.md) carries forward integrated source/reviews and READY builds; account/Admin, local Calendar, persistence, clinical/public-tool and Chimer outcomes; separate guest realtime/password-progress/source-UI receipts; recurring Supporter activation; the two additional purchase sandbox fulfillment/readback/cleanup campaigns; protected Sentry Node/error/source-map/privacy/count/owner-email acceptance; and completed four-copy media cleanup with original/other-object preservation.

Do not replay those campaigns because an older runbook says pending. Final deployed bindings and truly missing offered-release context remain separate. Media integrity is not rights/admission; a Supporter-only build is not all-payments readiness; source-only credential-helper acceptance is not permission to read a real credential. Historical windows and spent attempts remain closed.

## Prepare database recovery acceptance

Recovery-point objective (acceptable data loss) and recovery-time objective (acceptable restoration time) are **unknown pending owner decision**. A historically observed history window is not a promised backup feature, an agreed objective or a tested restore. Confirm current coverage through a separately scoped fact check before selecting a method.

Prepare the following privately before any restore operation:

1. Exact source, recovery mechanism and eligible restore point; who can recover access/configuration; owner-selected objectives and budget/deadline. Record limitations and the required evidence for each objective.
2. One isolated target, its environment/consumer separation, allowed data class and access. Prefer synthetic fixtures where they answer the question. A synthetic rehearsal cannot prove recovery of unexamined real application data; any production-derived content needs its own privacy and access scope.
3. Proposed cap: one selected restore point into one isolated target, no Production data/configuration changes, no traffic rebinding, no credential rotation and no legacy retirement. Creation/restoration/cleanup are future provider writes requiring exact approval; cost and time caps remain unset until agreed.
4. Pre-agreed success checks: schema/migration compatibility, required application invariants and explicitly owned synthetic readback where allowed; elapsed recovery and achieved restore point; no rows, connection strings or raw provider output in tracked evidence.
5. Abort on source/target ambiguity, inadequate coverage, unexpected consumers/data, unapproved cost or failed isolation. Preserve existing service and evidence; do not retry by widening access. Privately bind cleanup to the owned target and verify preservation, without deleting pre-existing resources.

Keep runtime `DATABASE_URL` pooled and maintenance roles separate. The [migration runbook](deployment.md#production-migrations) describes a separately authorized schema-maintenance procedure; it is not a data-restoration procedure and never authorizes destructive database rollback.

## Release rollback and support handoff

Use the [rollback plan](../rebrand/atmoshaper-rollback-plan.md) to prepare the source, proposed candidate configuration, acceptance scope and saved prior artifact/settings/aliases first. Once a separately approved build exists, bind the packet to that exact **existing READY artifact** and its catalog/media scope. Include privately held targets, operator, stop triggers, compatible provider-specific reversal, acceptance limits, verification, cost and preservation. Missing artifact-dependent proof remains pending while its acceptance proposal is prepared; no placeholder is an approval.

The [registration and recurring Checkout pauses](../../lib/public-launch-controls.js) are independent exact-`true` controls. They preserve existing sign-in/recovery, entitlements and Portal access. They do not contain donation or background purchases, and no global purchase/media pause is claimed. Any provisional acceptance proposal must identify feasible containment for every purchase flow, including in-flight webhook/reconciliation effects, before execution. Reversing only the build scope selector while additional purchase switches stay enabled is not the saved approved configuration.

Support handoff must name the private responder/escalation and recovery responsibility, current branded contact, permitted coarse diagnostic fields, alerts/usage watch, incident containment and recovery dependencies. Follow [Sentry's operating boundary](sentry-operations.md#operating-after-activation); do not put PHI, customer data or raw provider events into tickets or public evidence.

Sequence acceptance without inventing proof: first satisfy pre-build source/provider prerequisites and truthfully backed readiness attestations; then use a separately approved isolated/staged all-payments candidate, enabling its flags only within that approved candidate while preserving public routing. Never set `BACKGROUND_COMMERCE_WEBHOOK_READY` or another attestation merely to obtain a build. If an observation needs an artifact or public context, prepare an explicit staged/provisional acceptance proposal that identifies a feasible environment, protection, webhook path and all-flow containment/rollback; do not mark a missing field true. Public-context observations may follow only a separately approved bounded provisional promotion/activation. Old merge or activation receipts grant none of this.

Final acceptance and unrestricted public/marketing activation follow the actual required evidence. Reconcile feature/pricing/support/legal/metadata/install claims with enabled behavior and perform only missing checks on the exact authorized artifact; artifact-dependent public checks are not prerequisites to ever creating a candidate. Record each required gate as complete with dated proof or obtain an explicit scope decision. Keep local professional records local-first, durable/legal/entitlement identifiers intact, and both existing sites/tools working. Broad old-origin redirects or retirement additionally require the existing old-origin recovery provisions; they are not proposed here.
