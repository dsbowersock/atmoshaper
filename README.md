# AtmoShaper

This repository contains the AtmoShaper codebase: a local-first toolkit for learning, independent practice, and client-centered work. Its current tools support massage therapy, anatomy education, scheduling, session timing, and small-practice workflows.

## Repository Status

AtmoShaper is the repository and local preview platform identity. The dependency-ordered Phase 6 replacement stack presents the application as `AtmoShaper` and the audio mixer as `Atmosphere` while preserving private compatibility identifiers. These changes remain unmerged preview work; they are not a production, provider, domain, deployment, or payment cutover.

The Phase 1–2 bootstrap is merged: [PR #1](https://github.com/dsbowersock/atmoshaper/pull/1) merged on 2026-09-09 at 09:36:44 UTC by `dsbowersock` as `f59e1b9371b06e7401740ae011f6dc911430a97c`. The reviewed head was `6f516b29a8f1be8c66b48663f1101b66efe3f7f9`; `codex/bootstrap-atmoshaper` is retained.

Phase 3 documentation consolidation is complete. [PR #2](https://github.com/dsbowersock/atmoshaper/pull/2) merged at `2026-09-10T00:57:48Z` as `7c07e4578307508ae2bdb784c4d7ad0d9fb64c65`; its reviewed head was `9d2a8eca057f33354f2cbb50263c8e4f365a00f1`, and `codex/atmoshaper-docs-consolidation` remains retained. Of 150 inherited design records reviewed, 134 remain and 16 exact superseded plans were omitted with [source and rollback receipts](docs/rebrand/atmoshaper-cleanup-register.md#phase-3-documentation-omissions--2026-09-09). The new Phase 3 plan is additional to those records.

Phase 4 [PR #3](https://github.com/dsbowersock/atmoshaper/pull/3) and Phase 5 [PR #4](https://github.com/dsbowersock/atmoshaper/pull/4) are merged. Phase 6 is being delivered as smaller dependency-ordered replacements for preserved [PR #5](https://github.com/dsbowersock/atmoshaper/pull/5). Replacement PRs #6–#12 remain open and unmerged after completing their individual exact-head review and CI gates. [PR #13](https://github.com/dsbowersock/atmoshaper/pull/13) is the active Task 8 legal-identity replacement. Successive hosted and local review rounds exposed verified server-session, public-session and deterministic-clock boundary findings; the final local candidate now passes provider-free validation. Its amended head still requires renewed independent SPEC then QUALITY review, exact-head hosted review and strict CI before any merge decision.

Full development history and historical evidence remain in [`dsbowersock/massagelab`](https://github.com/dsbowersock/massagelab). See [MIGRATION_LINEAGE.md](MIGRATION_LINEAGE.md) for the exact source and migration boundary.

## Current Runtime

The current application includes:

- Chimer treatment-room timing and standalone clock tools;
- local-first SOAP notes, intake forms, journals, and ROM sessions;
- Calendar scheduling, availability, booking, and conflict-prevention foundations;
- Anatomime anatomy-learning experiences;
- the audio mixer, presented publicly as `Atmosphere` in the local Phase 6 stack while internal `atmoshaper` identifiers remain compatibility identifiers; and
- optional accounts for preferences, profiles, role verification, templates, and security settings.

Clinical notes, intake forms, journals, ROM sessions, and other PHI-bearing professional-record workflows remain local-first. They are not authorized for hosted clinical storage unless the documented compliance gates pass.

## Documentation

Start with:

1. [Project state](docs/project-state.md) for current truth and the next gate.
2. [Project log](docs/project-log.md) for chronological AtmoShaper progress.
3. [Project wiki](docs/wiki/index.md) for stable operational documentation.
4. [Migration lineage](MIGRATION_LINEAGE.md) for the exact source and history boundary.
5. [Architecture](docs/architecture.md), [decisions](docs/decisions/README.md), and [account security](docs/wiki/account-security.md) for current owners and constraints.

The [migration charter](docs/rebrand/atmoshaper-migration-charter.md) and [Phase 6 replacement delivery plan](docs/superpowers/plans/2026-09-20-phase6-review-sized-prs.md) govern the current local branch. Earlier plans, the [export manifest](docs/rebrand/atmoshaper-export-manifest.json), and the [project log](docs/project-log.md) retain completed and historical contracts.

The local Phase 6 stack remains review work. Task 8 introduces new current legal-version IDs without rewriting archived v2 documents or existing acceptance rows. The current amendment, merge, old-origin recovery, provider staging, deployment, domain/DNS cutover, production/database/payment/email/media mutation, final-logo integration, and the separate Linux Atmosphere snapshot decision remain independently gated.

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
- Treat AtmoShaper as the platform identity, `Atmosphere` or `Atmosphere mixer` as the current public audio label in the Phase 6 preview, and existing internal `atmoshaper` names as compatibility identifiers. Global text replacement is prohibited.

## License

Copyright © 2025–2026 Derrick Bowersock, doing business as AtmoShaper. All rights reserved.

The codebase remains source-visible proprietary software, not open-source software. Public repository access does not grant permission to reuse, modify, or redistribute owner-controlled source code or assets. The migration does not change the legal owner or license. See [LICENSE](LICENSE) for the complete terms and the separate treatment of third-party materials.
