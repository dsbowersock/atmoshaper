# AtmoShaper provider-readiness intent

## Intent lock

Advance the whole-site migration through every safe read-only provider audit and
repository preparation step that can be completed without user interaction,
then leave exact morning decisions for live billing and remaining providers.

## Scope fence

Allowed:

- Read current repository, CI, deployment-variable-name, HTTP, Stripe aggregate,
  and provider-account visibility state.
- Validate the local Prisma schema and focused migration contracts.
- Record sanitized current evidence and prepare a reviewable documentation PR.
- Create the already requested one-time branding-verification reminder.

Not allowed:

- Customer, subscription, catalog, webhook, database, DNS, OAuth, email, media,
  telemetry, realtime, deployment, or secret mutation.
- Production-row or credential disclosure.
- Guessing the disposition of the existing active subscription.
- Merging the prepared PR without the user's review.

## Baseline

- Branch: `codex/atmoshaper-provider-readiness`
- Base: `06cb73035c7695a5f96e19a5ee9274f2e16c1c6a`
- Canonical inputs: project state, project log, wiki index, provider checklist,
  billing contract, Calendar contract, and provider-staging ADR.
- TDD route: off; this slice changes records only and uses readback plus focused
  contract validation.
