# AtmoShaper

This repository contains the AtmoShaper codebase: a local-first toolkit for learning, independent practice, and client-centered work. Its current tools support massage therapy, anatomy education, scheduling, session timing, and small-practice workflows.

## Repository Status

The retained source includes the reviewed migration integration through PR #66. Local source and documentation candidates are tracked separately in [project state](docs/project-state.md) and the [migration status](docs/wiki/migration-status.md). Bootstrap and phase history remain in [migration lineage](MIGRATION_LINEAGE.md) and the [project log](docs/project-log.md).

The complete MassageLab → AtmoShaper migration remains in progress. Scoped application, local-first records, realtime/progress, monitoring and sandbox-purchase campaigns have completed receipts; final media delivery and catalog binding, deployed service/recovery readiness, exact release-artifact agreement and public release still need their recorded acceptance. Existing public sites retain their separately approved versions.

Recurring Supporter billing has separate acceptance and activation receipts. One-time support and permanent-background purchases remain part of the release scope and have passed their sandbox fulfillment/readback checks. Their final deployed readiness and activation remain pending. Current work continues on the existing Vercel setup.

## Current Runtime

The current application includes:

- Chimer treatment-room timing and standalone clock tools;
- local-first SOAP notes, intake forms, journals, and ROM sessions;
- Calendar scheduling, availability, booking, and conflict-prevention foundations;
- Anatomime anatomy-learning experiences;
- the audio mixer, presented as `Atmosphere` in the reviewed source while internal `atmoshaper` identifiers remain compatibility identifiers; and
- optional accounts for preferences, profiles, role verification, templates, and security settings.

Clinical notes, intake forms, journals, ROM sessions, and other PHI-bearing professional-record workflows remain local-first. They are not authorized for hosted clinical storage unless the documented compliance gates pass.

## Documentation

Start with:

1. [Project state](docs/project-state.md) for current truth and the next gate.
2. [Project log](docs/project-log.md) for chronological AtmoShaper progress.
3. [Project wiki](docs/wiki/index.md) for stable operational documentation.
4. [Migration lineage](MIGRATION_LINEAGE.md) for the exact source and history boundary.
5. [Architecture](docs/architecture.md), [decisions](docs/decisions/README.md), and [account security](docs/wiki/account-security.md) for current owners and constraints.

The [migration charter](docs/rebrand/atmoshaper-migration-charter.md) remains current policy. The [Phase 6 replacement delivery plan](docs/superpowers/plans/2026-09-20-phase6-review-sized-prs.md), earlier plans, the [export manifest](docs/rebrand/atmoshaper-export-manifest.json), and the [project log](docs/project-log.md) retain the merged stack's implementation history and completed contracts.

The Phase 6 replacement stack is merged. Task 8 introduced new current legal-version IDs without rewriting archived v2 documents or existing acceptance rows. Old-origin recovery remains a compatibility requirement. The current remaining service, purchase, media and exact-release gates are tracked in [migration status](docs/wiki/migration-status.md); earlier PR and phase snapshots remain historical evidence.

## Local Development

Requirements:

- Node.js `24.x`
- npm
- a non-production Neon Postgres target when exercising account, Prisma, Calendar, anatomy-publishing, or billing-persistence flows

Follow [local development](docs/wiki/local-development.md) for the complete setup. A minimal local start is:

```bash
npm install
npm run prisma:generate
npm run dev
```

Copy `.env.example` to `.env.local` only for local configuration. Never commit secrets or use a production database or provider account for ordinary development.

For a clean verification install, use `npm ci`, then run the repository-owned checks:

```bash
npx playwright install chromium
npm run prisma:validate
npm run prisma:generate
npm run typecheck
npm run lint
npm run test
npm run build
git diff --check
```

See the [release checklist](docs/wiki/release-checklist.md) before inviting users, tagging, or deploying. Provider writes, database migrations, live payments, email delivery, DNS changes, and production actions require their documented gates and separate authorization.

### Retained anatomy source audit

The exact muscle-action audit requires the caller's retained public-evidence
directory. Replace the quoted placeholder with that existing local directory:

```bash
npm run audit:muscle-action-citations -- --artifact-root "PATH_TO_RETAINED_PUBLIC_EVIDENCE"
```

The command checks the eight pinned artifacts and current source bindings. It
does not download missing evidence or use a provider/database credential. An
absent directory, missing artifact or changed hash fails the audit; a pass does
not establish complete scientific or clinical acceptance. See the
[exact muscle-action plan](docs/superpowers/plans/2026-10-25-exact-muscle-action-citations.md)
for the scope and remaining content work.

## Safety and Compatibility

- Keep PHI-bearing professional records local-first and preserve encrypted-vault and import/export compatibility.
- Use feature-key entitlement checks such as `premium_backgrounds`; never infer access from a displayed plan name.
- Preserve stable private identifiers, legal records, provider reconciliation identifiers, and old-origin recovery behavior until a dedicated migration proves compatibility and rollback.
- Treat AtmoShaper as the platform identity, `Atmosphere` or `Atmosphere mixer` as the current public audio label in the Phase 6 preview, and existing internal `atmoshaper` names as compatibility identifiers. Global text replacement is prohibited.

## License

Copyright © 2025–2026 Derrick Bowersock, doing business as AtmoShaper. All rights reserved.

The codebase remains source-visible proprietary software, not open-source software. Public repository access does not grant permission to reuse, modify, or redistribute owner-controlled source code or assets. The migration does not change the legal owner or license. See [LICENSE](LICENSE) for the complete terms and the separate treatment of third-party materials.
