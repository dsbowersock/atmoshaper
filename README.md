# AtmoShaper

This repository contains the AtmoShaper codebase: a local-first toolkit for learning, independent practice, and client-centered work. Its current tools support massage therapy, anatomy education, scheduling, session timing, and small-practice workflows.

## Bootstrap Status

AtmoShaper is the repository and future platform identity. The runtime has **not** completed its public rebrand: it intentionally continues to present the existing MassageLab design and copy until the separately reviewed Phase 6 preview rebrand. This fresh-history bootstrap is behavior-preserving and is not a production, provider, domain, or legal cutover.

Phase 1 passed. Phase 2 is in progress at Task 5; repository audits, local bootstrap verification, and publication remain gated later work.

Full development history and historical evidence remain in [`dsbowersock/massagelab`](https://github.com/dsbowersock/massagelab). See [MIGRATION_LINEAGE.md](MIGRATION_LINEAGE.md) for the exact source and migration boundary.

## Current Runtime

The current application includes:

- Chimer treatment-room timing and standalone clock tools;
- local-first SOAP notes, intake forms, journals, and ROM sessions;
- Calendar scheduling, availability, booking, and conflict-prevention foundations;
- Anatomime anatomy-learning experiences;
- the existing audio mixer, scheduled to receive the public `Atmosphere` label only in Phase 6, whose internal `atmoshaper` identifiers remain compatibility identifiers; and
- optional accounts for preferences, profiles, role verification, templates, and security settings.

Clinical notes, intake forms, journals, ROM sessions, and other PHI-bearing professional-record workflows remain local-first. They are not authorized for hosted clinical storage unless the documented compliance gates pass.

## Documentation

Start with:

1. [Project state](docs/project-state.md) for current truth and the next gate.
2. [Project log](docs/project-log.md) for chronological AtmoShaper progress.
3. [Project wiki](docs/wiki/index.md) for stable operational documentation.
4. [Migration lineage](MIGRATION_LINEAGE.md) for the exact source and history boundary.

The [migration charter](docs/rebrand/atmoshaper-migration-charter.md), [export manifest](docs/rebrand/atmoshaper-export-manifest.json), and [operative plan](docs/superpowers/plans/2026-09-06-atmoshaper-repository-migration.md) govern the repository bootstrap.

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
npm run prisma:validate
npm run prisma:generate
npm run typecheck
npm run lint
npm run test
npm run build
git diff --check
```

See the [release checklist](docs/wiki/release-checklist.md) before inviting users, tagging, or deploying. Provider writes, database migrations, live payments, email delivery, DNS changes, and production actions require their documented gates and separate authorization.

## Safety and Compatibility

- Keep PHI-bearing professional records local-first and preserve encrypted-vault and import/export compatibility.
- Use feature-key entitlement checks such as `premium_backgrounds`; never infer access from a displayed plan name.
- Preserve stable private identifiers, legal records, provider reconciliation identifiers, and old-origin recovery behavior until a dedicated migration proves compatibility and rollback.
- Treat AtmoShaper as the platform identity, `Atmosphere` or `Atmosphere mixer` as the later public audio label, and existing internal `atmoshaper` names as compatibility identifiers. Global text replacement is prohibited.

## License

Copyright © 2025–2026 Derrick Bowersock, doing business as Massage Lab. All rights reserved.

The codebase remains source-visible proprietary software, not open-source software. Public repository access does not grant permission to reuse, modify, or redistribute owner-controlled source code or assets. The migration does not change the legal owner or license. See [LICENSE](LICENSE) for the complete terms and the separate treatment of third-party materials.
