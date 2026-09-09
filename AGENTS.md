# AtmoShaper Agent Instructions

Read these files first, in order:

1. `docs/project-state.md` for the current source of truth.
2. `docs/project-log.md` for chronological progress, decisions, and change history.
3. `docs/wiki/index.md` for stable operational documentation.

## Operating Rules

- Treat `docs/project-state.md` as the canonical current-state file.
- Treat `docs/project-log.md` as the canonical chronological history for this fresh repository. Use `MIGRATION_LINEAGE.md` and `dsbowersock/massagelab` for history before the AtmoShaper bootstrap.
- Treat `docs/roadmap.md`, `TODO.md`, audits, plans, and wiki pages as source evidence unless their status is mirrored into the current state or project log.
- Keep clinical notes, intake forms, journals, ROM sessions, and other PHI-bearing workflows local-first unless hosted clinical storage passes the documented compliance gates.
- Do not document secrets, database rows, private provider or project identifiers, credentials, connection strings, or `.env.local` values.
- Use feature-key entitlement checks such as `premium_backgrounds`; customization follows the canonical selected-background access decision, never displayed plan names.
- Prefer targeted, branch-sized changes over broad cleanup.
- Add detailed implementation plans under `docs/superpowers/plans/` when a task spans multiple subsystems or needs future agent handoff.
- For every branch, add useful docstrings/JSDoc or focused comments when writing new or changed non-obvious code, especially shared helpers, domain rules, server actions, data adapters, and scripts. Treat this as current branch work, not something to defer entirely to the later repo-wide docstring cleanup. Keep documentation focused on intent, inputs, outputs, and constraints; avoid noisy comments that restate self-explanatory code.

## Identity, Legal, and Compatibility Boundaries

- AtmoShaper is the repository and future public platform identity. Until the separately reviewed Phase 6 preview rebrand, preserve the existing MassageLab runtime design, copy, routes, behavior, accessibility, and visual geometry. Do not describe the runtime rebrand as complete.
- `Atmosphere` or `Atmosphere mixer` is the approved later public label for the audio feature. Existing internal `atmoshaper` modules, paths, scripts, tests, storage keys, data, and release identifiers remain compatibility identifiers. Do not perform global replacement.
- Preserve established feature and domain language, including Chimer, Anatomime, Calendar, Notes, Wellness, massage, anatomy, education, treatment-room, clinical, and practice terminology.
- Keep public product identity separate from the legal operator, copyright owner, proprietary license, accepted legal text, document versions and effective dates, and historical acceptance records. Do not change legal identity or claim trademark registration without separate review and approval.
- Preserve stable private identifiers and reconciliation contracts, including Prisma objects and migrations, environment-variable names, auth and security identifiers, Stripe metadata and idempotency namespaces, browser storage/cache/vault identifiers, media identities, export schemas, and durable audit or operation identifiers, unless a dedicated migration proves compatibility and rollback.
- Repository work does not authorize deployment, DNS or domain changes, provider writes, database writes or migrations, live payment or email activity, media mutation, production changes, or legal cutover. Follow the migration charter and operative plan, and obtain exact separate authorization before crossing those boundaries.

## Local Shell Reliability

- On Windows, sandboxed shell launches can intermittently fail before the command starts with `CreateProcessAsUserW failed: 1312`. Treat this as Codex/Windows process-launch noise, not as an AtmoShaper, Node, npm, Prisma, or Git failure.
- If a read-only or validation command hits that sandbox-token failure, rerun the same command through the approved outside-sandbox path instead of repeatedly retrying in the sandbox or reporting it as an application failure.
- Prefer repository npm scripts such as `npm run lint`, `npm run test`, `npm run typecheck`, `npm run build`, `npm run prisma:generate`, and `npm run prisma:validate` over ad hoc Node invocations. If a recurring generator or check needs Node directly, add a named npm script for it and use that script.
- Keep user-facing updates terse: mention that a command was rerun because the Windows sandbox failed before execution only when that context matters. Do not repeat long sandbox-token status messages for routine validation retries.
