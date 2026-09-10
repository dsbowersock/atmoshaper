# ADR 0004: Parallel Provider Staging and Cutover

Status: Proposed

## Context

Repository publication does not migrate production infrastructure. Auth callbacks,
Calendar mappings, mail identity, Stripe reconciliation, media URLs, telemetry and
realtime connections each bind to existing configuration and environment roles.
Historical repository evidence does not establish current hosted configuration.

## Decision

Propose an isolated parallel project/environment before production traffic moves.
Phase 7 stages the environment; Phase 9 prepares provider/account transitions;
Phase 10 separately authorizes production cutover after recovery and rollback proof.
This staging architecture is not implemented by Phase 3. Earlier disposable QA
projects, which were deleted after verification, are not a persistent staging setup.

Binding now: each provider write needs separate exact authorization naming its target,
effect, rollback and readback. Do not infer deployment, database, DNS, mail, payment,
media or legal authority from a repository or ADR. The [external checklist](../rebrand/atmoshaper-external-account-checklist.md)
owns provider-specific evidence and the disposable database parity policy; the
[domain](../rebrand/atmoshaper-domain-cutover-plan.md) and [rollback](../rebrand/atmoshaper-rollback-plan.md)
plans own future traffic and reversal requirements.

## Rationale

Parallel validation permits provider contracts and rollback to be checked before
moving traffic. A combined rebrand/provider/cutover action hides which boundary
failed and makes reversal less reliable. Connecting production data, live payments
or sending mail simply because a new project exists is not an acceptable shortcut.

## Compatibility boundary

The proposed environment uses approved non-production Neon, Stripe test mode,
approved OAuth callbacks, non-sending or separately approved test mail, safe media
reads and a separate Sentry environment. Ably requires a deliberate isolated app/key
binding or an explicitly documented provider-disabled polling fallback; fallback
does not prove enabled-realtime parity. Production data must not participate in
disposable Browser QA, whose separate lifecycle requires fresh-empty identity gates,
committed migrations, synthetic fixtures, cleanup, deletion and absence proof.

Keep auth/security identifiers, Calendar summary lookup and mappings, Stripe
metadata/idempotency/catalog/webhook reconciliation, media object/release identities
and realtime channel contracts stable. Verify the exact auth host independently of
SEO. Preserve old callbacks/webhooks and both old-origin recovery paths until their
own retirement gates pass. Domain names in the design are intended targets, not
ownership or configuration claims.

## Revisit trigger

Revisit when Phase 7 staging is authorized, a provider cannot support parallel
origins, or Phase 9/10 preparation begins. Acceptance requires current readbacks with
sensitive values redacted for environment isolation and relevant auth, Calendar,
payment, mail, media, telemetry and realtime behavior, plus local-data/PWA recovery
and a rehearsed traffic reversal.
Production deployment and each provider/DNS mutation still require separate authority.

## Immutable source

- [Migration design, parallel environment](https://github.com/dsbowersock/massagelab/blob/e74045c2fc85c2cb4df176fdb1aff2137c4d9848/docs/superpowers/specs/2026-09-06-atmoshaper-repository-migration-design.md#phase-7-new-vercel-project-and-parallel-environment).
- [External checklist and Ably staging gate at merged bootstrap](https://github.com/dsbowersock/atmoshaper/blob/f59e1b9371b06e7401740ae011f6dc911430a97c/docs/rebrand/atmoshaper-external-account-checklist.md).
- [Domain prerequisites at merged bootstrap](https://github.com/dsbowersock/atmoshaper/blob/f59e1b9371b06e7401740ae011f6dc911430a97c/docs/rebrand/atmoshaper-domain-cutover-plan.md#prerequisites-and-order).
- [Rollback prerequisites at merged bootstrap](https://github.com/dsbowersock/atmoshaper/blob/f59e1b9371b06e7401740ae011f6dc911430a97c/docs/rebrand/atmoshaper-rollback-plan.md).

## Consequences

Future work needs provider-specific receipts and bounded rollback scopes. Failed
staging preserves evidence and current production service; rollback must not delete
records, rewrite history, replay payments or retire still-used endpoints. This record
creates no project, provider configuration, deployment, traffic change or live-system
verification claim.
