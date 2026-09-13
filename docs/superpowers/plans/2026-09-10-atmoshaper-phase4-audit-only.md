# AtmoShaper Phase 4 Audit-Only Implementation Plan

> **For agentic workers:** Execute with Superpowers subagent-driven development and
> Aegis ownership, anti-entropy, review, and verification gates. A fresh implementer
> performs each implementation task; separate reviewers check specification
> compliance and code quality; the coordinator alone stages and commits. Steps use
> checkbox syntax for execution tracking.

**Goal:** Establish deterministic, secret-safe evidence for dead-code, dependency,
asset, and environment cleanup candidates without deleting, renaming, upgrading, or
retiring any candidate.

**Architecture:** Extend the existing repository-audit boundary with one cleanup
policy and one shared static-evidence engine, then expose four thin JSON CLIs. The
engine reads only Git-tracked paths, records literal references and uncertainty
signals, and never treats missing static references as deletion authority. Current
authority and the cleanup register record the audit results and the later proof each
candidate still needs.

**Tech stack:** Node.js 24 ESM, Node built-ins, the already-installed TypeScript
compiler API, Git index queries, JSON policy, Node's built-in test runner, npm,
TypeScript, ESLint, Next.js, Playwright, Git, and GitHub hosted review.

**Spec:**
`docs/superpowers/specs/2026-09-06-atmoshaper-repository-migration-design.md`,
especially Sections 8, Phase 4, 16, 18, and 19.

## Global constraints

- This branch is audit-only. It must not delete or rename application code, routes,
  components, assets, scripts, flags, dependencies, patches, tests, documentation,
  migrations, schemas, storage keys, or provider objects.
- Reports are evidence sources, never deletion authority. A no-reference result is a
  candidate requiring independent behavior, build, runtime, test, provenance, and
  rollback proof.
- Preserve runtime behavior, routes, copy, visuals, accessibility, APIs, schemas,
  migrations, provider boundaries, feature-key entitlements, local-first records,
  PWA behavior, storage/export formats, legal records, media identities, and stable
  compatibility identifiers.
- Do not rebrand the runtime, refactor application owners, change dependency versions,
  regenerate the lockfile, update patches, or modify production bundles intentionally.
- Do not read `.env.local`, any untracked or ignored file, process-environment values,
  database rows, credentials, connection strings, or provider secrets. Environment
  reports may contain variable names and tracked source locations only.
- Do not deploy, alter providers, change DNS, touch production data, send email,
  create payment activity, mutate hosted media, change legal text, tag a release, or
  retire an old origin.
- Keep compatibility wrappers and legacy models, origin-bound browser data and
  caches, and migration-parity tooling/snapshots. Their later retirement gates are
  outside this branch.
- Any Browser QA acceptance cycle requiring a database must use a newly authorized,
  independent, empty temporary QA project, prove the non-production fingerprint,
  apply only committed migrations, prove application tables empty, delete the
  cycle-owned project, and prove it absent. Production data must not participate.
- Push, PR creation, external QA-resource creation, and merge remain separate actions
  requiring their own authorization.

## Baseline/authority refs

- Branch: `codex/atmoshaper-dead-code-audit`.
- Exact base and starting `HEAD`:
  `7c07e4578307508ae2bdb784c4d7ad0d9fb64c65`.
- Phase 3 reviewed head:
  `9d2a8eca057f33354f2cbb50263c8e4f365a00f1`.
- Phase 3 PR: `https://github.com/dsbowersock/atmoshaper/pull/2`, merged at
  `2026-09-10T00:57:48Z` by `dsbowersock`.
- Fresh root: `7e89f7ba9508a1ad715c1824ea6099432e6a4ccd`.
- Immutable historical source:
  `e74045c2fc85c2cb4df176fdb1aff2137c4d9848` in the historical repository.
- Current authorities: `AGENTS.md`, `docs/project-state.md`,
  `docs/project-log.md`, `docs/architecture.md`, `docs/decisions/README.md`,
  `docs/rebrand/atmoshaper-cleanup-register.md`, and
  `docs/wiki/dependency-security.md`.
- Starting inventory: 1,904 tracked files and 46,967,363 tracked blob bytes;
  352 `app/`, 257 `components/`, 352 `lib/`, 78 `scripts/`, 72 `public/`,
  40 `data/`, and 422 `tests/` paths.
- Starting package surface: 133 dependencies, 17 development dependencies,
  14 override owners, and 85 npm scripts.

## BaselineUsageDraft

- Required baseline refs: migration design, current state/log, architecture map,
  decision index, cleanup register, dependency-security owner, package manifest,
  TypeScript/Next configuration, existing repository-audit implementation/tests.
- Acknowledged before plan refs: all required refs above.
- Cited in plan refs: all required refs above.
- Missing refs: none for audit-tool implementation; runtime/provenance evidence for
  individual cleanup candidates intentionally remains future work.
- Decision: continue.

## Requirement Ready Check

- Requirement source refs: the approved migration design and the user's authorization
  to begin Phase 4 planning and an audit-only branch without deleting candidates.
- Goal and scope refs: Phase 4 audit evidence only; no cleanup execution.
- Acceptance refs: deterministic commands, secret-safe failure envelopes, explicit
  uncertainty, current-state synchronization, focused and broad verification.
- Open blocker questions: none for local planning and audit implementation.
- Decision: ready.

## Compatibility boundary

The four audit commands may observe tracked repository structure but may not change
runtime or provider behavior. Framework entrypoints, dynamic imports, package-script
CLIs, patched packages, generated catalogs, public URL construction, manual
maintenance scripts, and compatibility carriers must be represented as roots,
references, protected items, or uncertainties rather than silently classified as
unused. The current tracked residual dependency advisory remains documented; this
branch neither forces a major upgrade nor claims a clean dependency inventory.

## TDD Route

- Mode: off.
- Decision: skipped.
- Strict authority: not applicable.
- Test posture: post-change regression with fixture repositories and real-repository
  smoke checks.
- Reason: the branch adds read-only diagnostic tooling and documentation, not runtime
  behavior; no strict TDD route was requested.
- Verification: focused cleanup-audit tests after each task, then repository/brand
  audits, typecheck, lint, full unit suite, production build, and separately
  authorized Browser QA/hosted review.

## Change Necessity

- User-visible need: later cleanup must not remove live behavior based on guesses.
- No-change option: manual searches alone are not reproducible, do not preserve
  uncertainty consistently, and cannot provide a stable before/after Phase 4 receipt.
- Why code change is necessary: the approved design requires deterministic,
  testable, CI-safe dead-code, asset, and environment inventory commands; dependency
  cleanup also needs equivalent static-usage evidence.
- Minimum change boundary: repository-audit scripts/policy, their focused test, npm
  script entries, and audit/current-authority documentation only.
- Decision: code-change, confined to development-time tooling.

## Existence Check

- Proposed new surface: cleanup policy, shared static-evidence engine, four CLIs, and
  one focused test owner.
- Existing reuse candidate: `scripts/repository-audit/core.mjs`, `policy.json`, and
  `tests/repository-audit.test.mjs`.
- Why existing surface is insufficient: the current core owns tracked-file inventory
  and legacy-reference classification; its policy schema has no module graph, package
  CLI mapping, asset root, environment-read, or uncertainty contract. Mixing cleanup
  fields into the brand policy would couple unrelated baselines and make failures less
  diagnosable.
- Creation proof: reuse path normalization, stable JSON, tracked-file, and private-path
  guards from `core.mjs`; add one focused `cleanup-core.mjs`, one
  `cleanup-policy.json`, thin CLIs, and one test file under the same audit owner.
- Entropy/retirement impact: the new audit owner remains through Phases 4-6 and may be
  retired only after the migration program records a replacement or completion
  decision.
- Decision: add-with-proof.

## Architecture Integrity Lens

- Invariant: diagnostics never become runtime dependencies or deletion authority.
- Canonical owner: `scripts/repository-audit/` owns repository-structure diagnostics;
  `docs/rebrand/atmoshaper-cleanup-register.md` owns human cleanup decisions.
- Responsibility overlap: CLIs collect facts; the register classifies decisions; later
  deletion branches own runtime corroboration and rollback.
- Higher-level simplification: one shared evidence engine prevents four independent
  scanners from drifting on path, privacy, ordering, and uncertainty semantics.
- Retirement/falsifier: reject the design if runtime code imports the tooling, output
  contains source text or values, results vary on an unchanged index, or a report
  presents a candidate as approved for deletion.
- Verdict: proceed.

## Plan Pressure Test

- Owner/contract/retirement: audit owner and decision owner are separate; candidate
  retirement is explicitly deferred.
- Architecture integrity/higher-level path: shared scanner plus thin commands is the
  lowest-duplication boundary.
- Verification scope: fixture tests cover privacy, determinism, resolution, dynamic
  uncertainty, sanitization, and exit behavior; real-repository checks cover
  integration and regression.
- Task executability: each task has exact files, output fields, and commands.
- Pressure result: proceed.

## Plan-Time Complexity Check

- Artifact class: development-time repository scanner.
- Target files: `cleanup-core.mjs`, four thin CLIs, one JSON policy, and one focused
  test file.
- Current pressure: the existing brand/inventory core is cohesive and should not
  absorb module-graph and reference-domain behavior.
- Projected pressure: one cleanup core can become broad if it parses and decides at
  the same time.
- Planned governance: keep parsing/resolution helpers pure; keep report builders
  separate; keep CLIs below the error-envelope/output boundary; place all allowlists
  and framework roots in JSON policy; split later if any source file exceeds 500
  nonblank lines or mixes more than one report builder.
- Budget result: within-budget with the split below.

## Audit report contract

Every CLI writes exactly one stable JSON object to stdout and nothing to stderr on
success. Findings exit zero; scan/config/privacy failures exit nonzero with a fixed
error code and no path, source text, environment value, or exception message.

Common fields:

```json
{
  "schemaVersion": 1,
  "auditKind": "dead-code | dependency | asset | environment",
  "deletionAuthority": false,
  "inventorySha256": "64 lowercase hexadecimal characters",
  "summary": {},
  "findings": [],
  "uncertainties": []
}
```

Finding and uncertainty arrays use normalized repository paths and deterministic
code-point ordering. They may expose package names, environment-variable names, and
tracked locations, but never source lines, literals, values, absolute workstation
paths, ignored/untracked filenames, or stack traces.

## Execution Readiness View

- Intent Lock: build reproducible cleanup evidence without deleting candidates.
- Scope Fence: repository-audit tooling, focused tests, package scripts, and audit
  documentation only.
- Baseline Lock: exact merge commit `7c07e4578307508ae2bdb784c4d7ad0d9fb64c65`.
- Approved Behavior: no runtime, visible, provider, data, schema, dependency-version,
  asset, or PWA behavior change.
- Owner/Contract Constraints: audit CLIs collect facts; the cleanup register owns
  decisions; later bounded branches own deletion proof.
- Compatibility Boundary: preserve framework/dynamic/manual/provenance uncertainty
  and every currently protected migration or compatibility carrier.
- Retirement Boundary: no candidate retirement in this plan.
- Task Batches: authority/work record; shared engine; dead-code/dependency reports;
  asset/environment reports; evidence reconciliation; complete verification.
- Test Obligations: focused fixtures and CLI smoke checks, existing repository audit,
  brand audit, typecheck, lint, full unit suite, production build, and later authorized
  Browser QA/hosted review.
- Review Gates: independent specification review, independent code-quality review,
  clean scoped commits, exact-head hosted checks, and zero unresolved review findings.
- Drift/Rewind Rules: stop on runtime imports, private-file reads, value leakage,
  nondeterminism, unexplained lockfile changes, candidate deletion, or a branch too
  broad for meaningful review.
- Evidence Required Before Completion: stable outputs at the committed index, recorded
  candidate counts/checksums, all local gates passing, no restricted-path diff, and
  later authorized hosted exact-head review.
- Advisory Boundary: method-pack execution guidance only; not a completion or deletion
  authority.

## Task 1: Record the merged baseline and audit-only intent

**Files:**

- Create: `docs/aegis/work/2026-09-10-atmoshaper-phase4-audit-only/10-intent.md`
- Create: `docs/aegis/work/2026-09-10-atmoshaper-phase4-audit-only/20-checkpoint.md`
- Modify: `docs/project-state.md`
- Modify: `docs/project-log.md`
- Modify: `MIGRATION_LINEAGE.md`
- Modify: `README.md`

**Why:** Current authority must stop describing PR #2 as active and must identify the
new branch as evidence collection rather than cleanup approval.

**Change necessity:** Documentation-only synchronization is sufficient; no runtime
source change belongs in this task.

**Impact/compatibility:** Record the exact merge metadata and audit scope without
refreshing unrelated hosted-provider claims or claiming Phase 4 cleanup is complete.

**Verification:** `git diff --check`, focused exact-string/status checks, repository
inventory, and brand audit after the final baseline reconciliation.

- [ ] Add a TaskStartSnapshot with branch, exact base/head, tracked `origin/main`,
  clean-state result, one-worktree result, and no-active-Git-operation result.
- [ ] Define the intent lock, allowed diagnostic paths, prohibited deletion/runtime/
  external paths, acceptance conditions, and stop conditions.
- [ ] Update current state, log, lineage, and README with PR #2 merge commit
  `7c07e4578307508ae2bdb784c4d7ad0d9fb64c65`, reviewed head
  `9d2a8eca057f33354f2cbb50263c8e4f365a00f1`, merge time
  `2026-09-10T00:57:48Z`, retained review branch, and active audit-only branch.
- [ ] State explicitly that no candidate has deletion approval and that Phases 5-10
  remain unstarted.
- [ ] Run `git diff --check` and exact-string checks for the four commit/time facts.
- [ ] Commit only Task 1 paths after coordinator review.

## Task 2: Add the shared static-evidence engine

**Files:**

- Create: `scripts/repository-audit/cleanup-policy.json`
- Create: `scripts/repository-audit/cleanup-core.mjs`
- Create: `tests/repository-cleanup-audit.test.mjs`
- Reuse: `scripts/repository-audit/core.mjs`

**Interfaces:**

- Consumes: `normalizeRepoPath`, `stableJson`, `listTrackedIndexEntries`,
  `assertPrivatePathsAbsent`, and `loadJson` from `core.mjs`.
- Produces: `buildTrackedTextIndex(root, policy)`,
  `buildModuleEvidence(index, policy)`, `buildDependencyEvidence(index, policy)`,
  `buildAssetEvidence(index, policy)`, `buildEnvironmentEvidence(index, policy)`,
  and `buildAuditEnvelope(kind, evidence)`.

**Why:** All four reports need identical tracked-path, privacy, ordering, source-scope,
literal-reference, and uncertainty rules.

**Change necessity:** Reusing the current inventory/brand core alone would mix a new
module/reference graph into an unrelated occurrence-baseline owner; one cleanup core
is the minimum isolated boundary.

**Impact/compatibility:** Development-time only. Runtime prefixes must never import
the audit directory. Use the existing TypeScript package rather than adding a parser
dependency or changing the lockfile.

**Verification:** `node --test tests/repository-cleanup-audit.test.mjs`.

- [ ] Define policy schema version 1 with source/text extensions, runtime/tool/test/doc
  scopes, Next/framework roots, top-level config roots, package-script CLI ownership,
  protected path prefixes, asset roots/extensions, environment declaration paths, and
  exact ignored generated/workstation prefixes.
- [ ] Reject unknown policy fields, non-normalized paths, duplicate entries, missing
  required scopes, and any forbidden tracked path before opening content.
- [ ] Read canonical stage-0 blobs by object ID from the Git index; do not let
  unstaged worktree transformations or ignored files change audit evidence. Parse
  tracked JS/TS/JSX/TSX with the existing TypeScript compiler API. Record
  static `import`, `export ... from`, literal `import()`, and literal `require()`
  references; record nonliteral module expressions only as uncertainty sites.
- [ ] Resolve relative modules, root-relative `@/` aliases, supported extensions, and
  index files against the tracked-path set. Record unresolved literal imports as
  evidence errors rather than dropping them.
- [ ] Extract literal strings from tracked source/config/CSS/HTML/JSON/Markdown for
  reference evidence while emitting only path/location metadata and hashes, never
  literal contents.
- [ ] Extract static `process.env.NAME`, `process.env["NAME"]`, and destructured
  `process.env` keys; classify computed reads as uncertainties without evaluating the
  expression or reading `process.env`.
- [ ] Build the common envelope with a hash derived from canonical evidence rows and
  `deletionAuthority: false` hard-coded by the engine.
- [ ] Add fixtures proving deterministic output, index-versus-worktree byte isolation,
  Windows path normalization, alias and extension resolution, package/subpath
  ownership, asset URL normalization, static environment-name extraction, dynamic
  uncertainty, and rejection of policy drift.
- [ ] Add privacy fixtures proving ignored/untracked `.env.local` is never opened,
  tracked private paths fail before content access, and reports/failures contain no
  source literal, environment value, absolute fixture root, or stack trace.
- [ ] Add a real-repository assertion that `app/`, `components/`, `hooks/`, `lib/`,
  `prisma/`, and `public/` do not import `scripts/repository-audit`.
- [ ] Run the focused test and `git diff --check`; commit only Task 2 paths after both
  independent reviews pass.

## Task 3: Add dead-code and dependency candidate reports

**Files:**

- Create: `scripts/repository-audit/dead-code.mjs`
- Create: `scripts/repository-audit/dependency.mjs`
- Modify: `package.json`
- Modify: `tests/repository-cleanup-audit.test.mjs`

**Interfaces:**

- `npm run dead-code:audit` emits roots, referenced modules, unreferenced candidates,
  protected items, and dynamic/framework/manual-tool uncertainties.
- `npm run dependency:audit` emits declared dependencies/devDependencies, literal
  import owners, package-script CLI owners, patch owners, unreferenced candidates,
  and dynamic/build/tooling uncertainties.

**Why:** Later cleanup branches need reproducible candidate evidence without treating
lexical absence as proof.

**Change necessity:** Thin CLIs are required so developers and CI can reproduce the
same evidence without ad hoc shell pipelines.

**Impact/compatibility:** Do not change dependency declarations, versions, overrides,
lockfile, patches, source modules, or npm commands other than adding the two audit
entries.

**Verification:** Focused test, both CLIs twice with byte-identical output, package and
lockfile diff inspection, and `git diff --check`.

- [ ] Make every Next special file under `app/`, documented top-level/config entries,
  npm-script targets, tests, and explicitly protected compatibility paths roots in
  the appropriate scope.
- [ ] Classify zero-incoming-reference modules as candidates only when they are not a
  root or protected path. Preserve separate uncertainties for nonliteral imports,
  framework conventions, manual scripts, generated inputs, and unresolved literals.
- [ ] Map scoped imports to the first two segments and unscoped imports to the first
  segment. Count type-only imports as dependency evidence and Node built-ins as
  built-ins rather than packages.
- [ ] Map existing script executables through policy: `next`, `eslint`, `tsc`,
  `prisma`, `playwright`, `patch-package`, and Node-executed repository scripts.
- [ ] Treat every package with a tracked patch as referenced. Treat dependencies used
  only by framework/build configuration as referenced with that scope, not runtime.
- [ ] Add exact npm scripts `dead-code:audit` and `dependency:audit`; verify no other
  package or lock field changes.
- [ ] Add fixtures for Next roots, unreferenced modules, protected modules, dynamic
  imports, scoped package subpaths, type imports, CLI owners, patched packages, and
  unreferenced declared-package candidates.
- [ ] Verify findings exit zero, malformed policy/import evidence exits nonzero, and
  sanitized error envelopes are exactly `DEAD_CODE_AUDIT_FAILED` and
  `DEPENDENCY_AUDIT_FAILED`.
- [ ] Run each CLI twice, compare exact bytes in memory through the focused test, run
  `npm run dead-code:audit`, `npm run dependency:audit`, and `git diff --check`.
- [ ] Commit only Task 3 paths after both independent reviews pass.

## Task 4: Add asset-reference and environment-read reports

**Files:**

- Create: `scripts/repository-audit/asset.mjs`
- Create: `scripts/repository-audit/environment.mjs`
- Modify: `package.json`
- Modify: `tests/repository-cleanup-audit.test.mjs`

**Interfaces:**

- `npm run asset:audit` emits tracked asset identities, exact reference owners,
  unreferenced candidates, protected assets, basename-only signals, and dynamic/
  generated/public-URL uncertainties.
- `npm run env:audit` emits static environment-variable names and read locations,
  names declared by tracked `.env.example` keys, unread declaration candidates, and
  computed-read uncertainties. It never emits values.

**Why:** Local assets and environment declarations are high-risk cleanup surfaces:
framework URLs and provider/config ownership make false positives costly.

**Change necessity:** Separate thin reports keep asset and environment uncertainty
visible without coupling them to the module/dependency graph presentation.

**Impact/compatibility:** Do not modify or delete any asset, catalog, script,
environment declaration, hosted object, or provider configuration.

**Verification:** Focused test, both CLIs twice with byte-identical output, explicit
private-file sentinels, and `git diff --check`.

- [ ] Inventory only tracked assets under policy-owned roots and extensions. Record
  blob identity and byte size from Git metadata rather than filesystem allocation.
- [ ] Match exact normalized public URLs, repository-relative paths, CSS `url()`
  values, HTML/Markdown URLs, JSON strings, and static JS/TS literals. Keep docs,
  tests, tooling, and runtime reference scopes distinct.
- [ ] Record basename-only matches and interpolated/dynamic URL construction as
  uncertainties. Protect generated catalogs, provenance-licensed media, parity
  snapshots, PWA/manifest/service-worker assets, and compatibility paths through
  explicit policy rather than hidden exceptions.
- [ ] Parse only key names from tracked `.env.example`; never retain or emit the text
  to the right of `=`. Do not enumerate the host environment.
- [ ] Report static environment reads by scope, unread tracked declarations as
  candidates, static reads absent from the example as findings, and computed reads as
  uncertainties. Do not classify any key for removal.
- [ ] Add exact npm scripts `asset:audit` and `env:audit`; verify no other package or
  lock field changes.
- [ ] Add fixtures for direct/public/CSS/Markdown references, duplicate basenames,
  dynamic URL composition, protected assets, declaration/read overlap, missing and
  unread names, destructuring, bracket access, computed reads, and values containing
  secret sentinels.
- [ ] Verify ignored/untracked `.env.local` cannot affect output and tracked private
  paths fail before any content is opened. Verify exact sanitized errors
  `ASSET_AUDIT_FAILED` and `ENVIRONMENT_AUDIT_FAILED`.
- [ ] Run `npm run asset:audit`, `npm run env:audit`, the focused test, and
  `git diff --check`; commit only Task 4 paths after both independent reviews pass.

## Task 5: Reconcile the human audit record without deleting candidates

**Files:**

- Modify: `docs/rebrand/atmoshaper-cleanup-register.md`
- Modify: `docs/rebrand/atmoshaper-reference-inventory.md`
- Modify: `docs/project-state.md`
- Modify: `docs/project-log.md`
- Modify: `docs/aegis/work/2026-09-10-atmoshaper-phase4-audit-only/20-checkpoint.md`
- Create: `docs/aegis/work/2026-09-10-atmoshaper-phase4-audit-only/90-evidence.md`
- Modify only if required: `scripts/repository-audit/brand-reference-baseline.json`

**Why:** Deterministic output becomes useful only when later workers can distinguish
measured facts, protected items, uncertainties, and still-required deletion proof.

**Change necessity:** Documentation and, only if changed documentation moves/adds
legacy-reference occurrences, deterministic brand-baseline reconciliation are the
minimum current-authority changes.

**Impact/compatibility:** Keep every candidate in the tree. Do not reinterpret Phase 3
historical-document omissions, compatibility retention, or future Phase 5-10 work.

**Verification:** Four CLI reports, zero missing/unclassified brand findings, inventory
fixed point, exact restricted-path allowlist, link/reference checks, and whitespace.

- [ ] Capture each report twice from the same staged index and prove byte identity.
- [ ] Record report hashes, counts by classification/scope, uncertainty counts, and
  the exact commands in the cleanup register and Aegis evidence. Do not paste large
  candidate lists into current state/log.
- [ ] For each candidate class, record the later corroboration required: direct and
  dynamic consumers, framework roots, runtime/build/tests, visual/accessibility,
  provenance/licensing, provider/object ownership, data/PWA compatibility, and
  rollback.
- [ ] Record explicit `Deletion authority: none` and keep candidate status
  `unresolved`, `protected`, or `candidate`; do not use `remove after proof` until a
  later bounded deletion plan supplies that proof.
- [ ] If documentation changes affect the brand audit, print the candidate baseline to
  a separate temporary path, compare schema/source/categories and exact occurrence
  deltas, replace the tracked baseline only after review, then prove a second
  candidate generation is byte-identical. Never redirect generator output onto its
  live input.
- [ ] Update current state/log with audit-only progress and current merge truth, not a
  Phase 4 cleanup-complete claim.
- [ ] Verify the task-owned diff contains only allowed audit, test, package-script,
  baseline, and documentation paths; verify `package-lock.json` is unchanged.
- [ ] Run focused content/audit checks and `git diff --check`; commit only Task 5 paths
  after both independent reviews pass.

## Task 6: Complete local verification and stop before external actions

**Files:**

- Modify: `docs/aegis/work/2026-09-10-atmoshaper-phase4-audit-only/20-checkpoint.md`
- Modify: `docs/aegis/work/2026-09-10-atmoshaper-phase4-audit-only/90-evidence.md`
- Create: `docs/aegis/work/2026-09-10-atmoshaper-phase4-audit-only/99-reflection.md`
- Modify: `docs/project-state.md`
- Modify: `docs/project-log.md`

**Why:** The audit branch needs a falsifiable handoff while preserving separate
authorization for temporary provider resources, publication, and merge.

**Change necessity:** Closeout documentation is required because this long-running
audit introduces durable developer tooling and future cleanup evidence.

**Impact/compatibility:** Verification must not update snapshots, mutate providers,
or weaken tests to accommodate findings.

**Verification:** Run in this order and record complete result counts:

```powershell
node --test tests/repository-audit.test.mjs tests/repository-cleanup-audit.test.mjs
npm run repository:inventory
npm run brand:audit
npm run dead-code:audit
npm run dependency:audit
npm run asset:audit
npm run env:audit
npm run prisma:validate
npm run prisma:generate
npm run typecheck
npm run lint
npm run test
npm run build
git diff --check
git status --short
```

- [ ] Run the focused audit suite and all four CLIs twice; stop on nondeterminism,
  privacy leakage, unresolved literal imports, or policy/schema failure.
- [ ] Run repository inventory and brand audit; require zero forbidden tracked paths,
  zero missing legacy-baseline entries, and zero unclassified entries.
- [ ] Run Prisma validation/generation, typecheck, lint, full unit suite, and production
  build; record exact counts and page/route/bundle measurements available from the
  build without claiming a performance improvement.
- [ ] Compare starting and final tracked files/bytes, package fields, build output, and
  changed-path scope. Explain every delta as audit tooling/documentation only.
- [ ] Run independent whole-branch specification and code-quality reviews. Repair only
  valid audit-branch findings and repeat focused verification.
- [ ] Stop before creating a temporary QA project, running database-backed acceptance
  Browser QA, pushing, opening a PR, or merging. Request the exact next authorization
  only after local verification and review pass.
- [ ] Record Task clean and Repository clean independently, with branch/head and each
  retained resource.

## Risks and stop conditions

- Stop if a scanner needs to read untracked/ignored files, `.env.local`, process
  values, source literals in output, or provider/database state.
- Stop if TypeScript parsing or import resolution cannot distinguish a literal edge
  from a computed/dynamic uncertainty.
- Stop if a candidate is treated as deletion-approved, or if a requested fix would
  delete/rename/upgrade any candidate on this branch.
- Stop if `package-lock.json`, dependency versions, overrides, patches, runtime paths,
  schema/migrations, assets, snapshots, or provider configuration change.
- Stop if framework roots, manual scripts, generated catalogs, public URL construction,
  compatibility carriers, or provenance cannot be represented without a hidden
  allowlist.
- Stop if branch scope grows beyond deterministic audit tooling and evidence records.
- Stop before any external mutation without exact target/effect/rollback/readback
  authorization.

## Repair and retirement tracks

**Repair track:** If an audit misclassifies evidence, repair the shared parser,
resolver, policy, or scope owner and add a focused fixture. Never add a one-off
candidate exception merely to make output smaller.

**Retirement track:** This plan retires nothing. Every candidate remains active or
retained until a later branch establishes its behavior contract, independent
corroboration, bounded rollback, and deletion approval. The audit tooling itself is
retained through the migration program and may be retired only through a separately
recorded owner transition.

## Execution route

- Decision: subagent-driven.
- Evidence: shared-engine, module/dependency, asset/environment, documentation, and
  verification tasks have bounded ownership and benefit from fresh implementation and
  two-stage review while sharing one branch/workspace.
- Fallback: inline execution if a subagent is unavailable; preserve the same task and
  review boundaries.
- User confirmation required: no for local Tasks 1-6 within the audit-only scope; yes
  before temporary provider-resource creation, push, PR creation, or merge.
