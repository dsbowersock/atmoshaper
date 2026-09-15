# AtmoShaper

This repository contains the AtmoShaper codebase: a local-first toolkit for learning, independent practice, and client-centered work. Its current tools support massage therapy, anatomy education, scheduling, session timing, and small-practice workflows.

## Repository Status

AtmoShaper is the repository and current platform identity. Phase 6 implements the local preview as `AtmoShaper`, with the audio mixer presented as `Atmosphere`. Until approved logo assets exist, the preview uses accessible text instead of inventing replacements. This remains separate from production, provider, domain, and deployment cutover.

The Phase 1–2 bootstrap is merged: [PR #1](https://github.com/dsbowersock/atmoshaper/pull/1) merged on 2026-09-09 at 09:36:44 UTC by `dsbowersock` as `f59e1b9371b06e7401740ae011f6dc911430a97c`. The reviewed head was `6f516b29a8f1be8c66b48663f1101b66efe3f7f9`; `codex/bootstrap-atmoshaper` is retained.

Phase 3 documentation consolidation is complete. [PR #2](https://github.com/dsbowersock/atmoshaper/pull/2) merged at `2026-09-10T00:57:48Z` as `7c07e4578307508ae2bdb784c4d7ad0d9fb64c65`; its reviewed head was `9d2a8eca057f33354f2cbb50263c8e4f365a00f1`, and `codex/atmoshaper-docs-consolidation` remains retained. Of 150 inherited design records reviewed, 134 remain and 16 exact superseded plans were omitted with [source and rollback receipts](docs/rebrand/atmoshaper-cleanup-register.md#phase-3-documentation-omissions--2026-09-09). The new Phase 3 plan is additional to those records.

Phase 4 [PR #3](https://github.com/dsbowersock/atmoshaper/pull/3) and Phase 5 [PR #4](https://github.com/dsbowersock/atmoshaper/pull/4) are merged. Phase 5 added the public-product identity owner without changing rendered values; PR #4 merged as `cdfa99e49cebf100fac1a5080d60514806eb17db`. Phase 6 Task 9 local implementation, command verification, exact temporary cleanup, and complete-branch reviews are complete on `codex/atmoshaper-phase6-preview-rebrand`. Current head `75e2741aa3ea5d2cb24fef62fdefb1b5564d4bfe` includes the reviewed systemic repair that makes five public-audio literals delegate to the unchanged Atmosphere label owner without a runtime cycle or scope regression. Only the coordinator Task 9 commit remains before disposable Browser QA. The legal change preserves exact prior documents before using new current version IDs, so old acceptance evidence is not rewritten.

Full development history and historical evidence remain in [`dsbowersock/massagelab`](https://github.com/dsbowersock/massagelab). See [MIGRATION_LINEAGE.md](MIGRATION_LINEAGE.md) for the exact source and migration boundary.

## Current Runtime

The current application includes:

- Chimer treatment-room timing and standalone clock tools;
- local-first SOAP notes, intake forms, journals, and ROM sessions;
- Calendar scheduling, availability, booking, and conflict-prevention foundations;
- Anatomime anatomy-learning experiences;
- the audio mixer, presented publicly as `Atmosphere` while internal `atmoshaper` identifiers remain compatibility identifiers; and
- optional accounts for preferences, profiles, role verification, templates, and security settings.

Clinical notes, intake forms, journals, ROM sessions, and other PHI-bearing professional-record workflows remain local-first. They are not authorized for hosted clinical storage unless the documented compliance gates pass.

## Documentation

Start with:

1. [Project state](docs/project-state.md) for current truth and the next gate.
2. [Project log](docs/project-log.md) for chronological AtmoShaper progress.
3. [Project wiki](docs/wiki/index.md) for stable operational documentation.
4. [Migration lineage](MIGRATION_LINEAGE.md) for the exact source and history boundary.
5. [Architecture](docs/architecture.md), [decisions](docs/decisions/README.md), and [account security](docs/wiki/account-security.md) for current owners and constraints.

The [migration charter](docs/rebrand/atmoshaper-migration-charter.md), approved [Phase 6 design](docs/superpowers/specs/2026-09-14-atmoshaper-phase6-preview-rebrand-design.md), and [Phase 6 implementation plan](docs/superpowers/plans/2026-09-14-atmoshaper-phase6-preview-rebrand.md) govern the current local branch. Earlier plans, the [export manifest](docs/rebrand/atmoshaper-export-manifest.json), and [project log](docs/project-log.md) retain completed and historical contracts.

Phase 6 local preview and current legal-version work are implemented, locally command-verified, and independently reviewed under their exact plan. Exact Task 9 temporary cleanup is complete with the authorized root proved absent, and the final receipt-only brand baseline reached its fixed point with zero missing or unclassified references and byte-identical candidate, live, and staged content. The coordinator Task 9 commit remains before disposable Browser QA; publication, merge, old-origin recovery, provider staging, deployment, domain/DNS cutover, production/database/payment/email/media mutation, and final-logo integration remain separately gated.

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
- Treat AtmoShaper as the platform identity, `Atmosphere` or `Atmosphere mixer` as the current public audio label, and existing internal `atmoshaper` names as compatibility identifiers. Global text replacement is prohibited.

## License

Copyright © 2025–2026 Derrick Bowersock, doing business as AtmoShaper. All rights reserved.

The codebase remains source-visible proprietary software, not open-source software. Public repository access does not grant permission to reuse, modify, or redistribute owner-controlled source code or assets. The migration does not change the legal owner or license. See [LICENSE](LICENSE) for the complete terms and the separate treatment of third-party materials.
