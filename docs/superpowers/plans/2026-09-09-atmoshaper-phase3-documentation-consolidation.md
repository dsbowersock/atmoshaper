# AtmoShaper Phase 3 Documentation Consolidation Plan

> **For agentic workers:** Execute with Superpowers subagent-driven development and
> Aegis ownership, compatibility, migration, review, and verification gates. A fresh
> implementer performs each task; separate reviewers check specification compliance
> and document/code quality; the coordinator alone stages and commits.

**Goal:** Replace inherited documentation sprawl with a concise, linked current
authority layer while retaining every uncertain or still-consumed record and making
no runtime behavior change.

**Architecture:** Add one architecture owner map, a decision index, four migration
ADRs, and one missing account-security owner. Omit only 16 plans whose durable rules
are already owned elsewhere and whose immutable originals remain in MassageLab.
Synchronize the fresh repository's current-state documents with the merged bootstrap,
then reconcile the deterministic legacy-brand baseline and run complete repository
verification.

**Tech stack:** Markdown, JSON audit policy, Node.js repository audits and tests,
Git, GitHub CLI readback, TypeScript, ESLint, Next.js production build.

**Spec:**
`docs/superpowers/specs/2026-09-06-atmoshaper-repository-migration-design.md`
Phase 3 and Sections 17, 19, 21.7, and 21.8.

## Baseline lock

- Repository: `C:/Users/derri/code/my_projects/atmoshaper`.
- Branch: `codex/atmoshaper-docs-consolidation`.
- Base: merged bootstrap commit `f59e1b9371b06e7401740ae011f6dc911430a97c`.
- Bootstrap PR: `https://github.com/dsbowersock/atmoshaper/pull/1`, merged at
  `2026-09-09T09:36:44Z` by `dsbowersock`.
- Immutable historical source: `dsbowersock/massagelab` commit
  `e74045c2fc85c2cb4df176fdb1aff2137c4d9848`.
- Fresh root: `7e89f7ba9508a1ad715c1824ea6099432e6a4ccd`.
- Bootstrap reviewed head: `6f516b29a8f1be8c66b48663f1101b66efe3f7f9`.
- Runtime/public rebrand remains deferred to Phase 6.

## Scope and invariants

- Documentation-only, except the deterministic JSON legacy-brand baseline may be
  reconciled for changed documentation occurrences.
- Preserve runtime, routes, visuals, accessibility, APIs, schemas, migrations,
  provider boundaries, feature-key entitlements, local-first PHI ownership, PWA
  behavior, storage/export formats, legal records, media identities, and all stable
  private compatibility identifiers.
- Do not globally replace `MassageLab` or rename `MASSAGELAB_`, Prisma, Stripe,
  auth/security, storage/cache/vault/export, R2/audio, or durable operation IDs.
- Do not deploy, alter providers, change DNS, touch production data, send email,
  create payments, mutate media, change legal text, tag a release, or retire an old
  origin.
- Keep every specification in the fresh repository. Keep every plan not listed in
  the exact omission set below.
- Keep test-consumed documents, active migration documents, parity tooling and all
  24 accepted parity PNGs through Phase 6.
- A future-facing ADR remains Proposed until its architecture is implemented and
  verified. Binding compatibility constraints may be documented without claiming
  the future implementation exists.
- Historical provider observations remain dated evidence, not confirmed-current
  state, unless refreshed read-only during this phase.

## TDD route

- Mode: off.
- Decision: strict RED/GREEN skipped; the branch changes documentation and a
  deterministic audit baseline, not runtime behavior.
- Test posture: focused content/reference/audit checks per task; full typecheck,
  lint, unit suite, and production build before completion.

## Semantic inventory result

The preflight review classified 150 inherited design records: all 28 inherited
specifications and 106 inherited plans remain, while these exact 16 superseded plans
may be omitted only after their current owners and immutable historical source are
linked:

1. `docs/superpowers/plans/2026-05-27-project-source-of-truth-consolidation.md`
2. `docs/superpowers/plans/2026-05-28-intake-form-builder-local-documents-v1.md`
3. `docs/superpowers/plans/2026-05-30-privacy-first-records-framework.md`
4. `docs/superpowers/plans/2026-06-18-atmosphere-first-batch-hosting.md`
5. `docs/superpowers/plans/2026-06-18-atmosphere-generative-fm-sample-coverage.md`
6. `docs/superpowers/plans/2026-06-18-atmosphere-hosted-opus-sidecars.md`
7. `docs/superpowers/plans/2026-06-18-atmosphere-second-batch-hosting.md`
8. `docs/superpowers/plans/2026-06-18-atmosphere-startup-performance.md`
9. `docs/superpowers/plans/2026-06-18-atmosphere-third-batch-listener-copy.md`
10. `docs/superpowers/plans/2026-06-18-atmosphere-web-audio-format-pilot.md`
11. `docs/superpowers/plans/2026-06-19-atmosphere-aac-mp3-sidecars.md`
12. `docs/superpowers/plans/2026-06-19-atmosphere-playback-performance.md`
13. `docs/superpowers/plans/2026-06-19-atmosphere-remaining-generators.md`
14. `docs/superpowers/plans/2026-06-19-atmosphere-rendered-piano-batch.md`
15. `docs/superpowers/plans/2026-06-19-ci-build-cache.md`
16. `docs/superpowers/plans/chimer-music-player-inspiration-note-2026-07-06.md`

The new operative Phase 3 plan is additional to that inherited inventory. Therefore,
the post-omission directory counts must be 107 plans and 28 specifications: 134
retained inherited records plus this plan.

## Preflight conflict table

| Task pair | Shared surface | Ruling |
| --- | --- | --- |
| 1 and 2 | Wiki navigation and account-security ownership | Task 2 exclusively owns `docs/wiki/index.md`; Task 1 does not edit it. |
| 1 and 4 | Architecture/current-state navigation | Task 1 owns new architecture and decision files; Task 4 only links them from current authority. |
| 2 and 3 | Historical plan references | Task 2 owns account-security source links; Task 3 may delete only the enumerated plans and must not edit account-security. |
| 3 and 5 | Legacy-brand baseline | Task 3 does not modify the baseline. Task 5 reconciles it once against the complete documentation diff. |
| 4 and 5 | Final receipts | Task 4 records current authority; Task 5 owns only Aegis evidence/reflection and audit baseline. |
| Every task | Runtime and compatibility boundary | No task may change runtime, legal text, providers, schemas, assets, or stable identifiers. |

Internal-consistency rulings:

- Task 1 must keep ADR statuses, architecture prose, and the decision index aligned.
- Task 2 must derive 2FA intent names from current code/tests, not the superseded plan.
- Task 3 must link the exact immutable source for every omission and leave all 134
  retained plans/specs in place.
- Task 4 must distinguish historical evidence, confirmed current repository state,
  and future work; it may not refresh unrelated hosted-provider claims by assumption.
- Task 5 must preserve the audit classifier's strength and make only occurrence-level
  changes justified by the final documentation tree.

## Task 1: Establish the architecture and decision authority

**Files:**

- Create: `docs/architecture.md`
- Create: `docs/decisions/README.md`
- Create: `docs/decisions/0001-fresh-root-lineage-and-history-ownership.md`
- Create: `docs/decisions/0002-public-identity-legal-and-compatibility-boundaries.md`
- Create: `docs/decisions/0003-origin-bound-local-data-and-pwa-recovery.md`
- Create: `docs/decisions/0004-parallel-provider-staging-and-cutover.md`

**Steps:**

1. Read the migration design, `MIGRATION_LINEAGE.md`, current authority, rebrand
   plans, and the existing domain wikis before drafting.
2. Write `docs/architecture.md` as an owner map, not a duplicate specification. Map
   the app shell/routes, local encrypted professional records versus hosted
   account/wellness data, account security, commerce, Calendar, shared audio,
   operational diagnostics, visual system, and origin/provider boundaries to their
   current documentation and code owners.
3. Write the decision index with statuses, immutable sources, compatibility
   boundaries, and revisit triggers.
4. Record ADR 0001 as Accepted: fresh root, MassageLab history/archive/rollback
   ownership, exact source/root/merge lineage, and rejected alternatives.
5. Record ADRs 0002–0004 as Proposed. State which constraints bind now while making
   clear that central public-brand ownership, old-origin recovery, and parallel
   provider staging are not implemented.
6. Verify no ADR changes legal identity, accepted documents, compatibility IDs,
   PWA behavior, provider state, or production state.

**Focused verification:**

```powershell
rg -n "^Status:|^## (Context|Decision|Rationale|Compatibility boundary|Revisit trigger|Immutable source|Consequences)" docs/decisions
rg -n "f59e1b9371b06e7401740ae011f6dc911430a97c|e74045c2fc85c2cb4df176fdb1aff2137c4d9848|7e89f7ba9508a1ad715c1824ea6099432e6a4ccd" docs/decisions docs/architecture.md
git diff --check
```

**Acceptance:** One current architecture map exists; all ADRs contain the required
fields and correct status; no runtime file changes.

## Task 2: Add the current account-security owner and navigation

**Files:**

- Create: `docs/wiki/account-security.md`
- Modify: `docs/wiki/index.md`

**Steps:**

1. Reconcile the enduring account-method and 2FA rules against current code and
   tests, especially `lib/auth-method-intent-proof.ts`,
   `lib/account-two-factor-management.ts`, and `prisma/schema.prisma`.
2. Document normalized-email identity, independently usable Google/password
   credentials, explicit proof-based method linking/removal, private same-browser
   intent binding, one-use proof, current-factor confirmation, concurrency guards,
   last-method protection, and transaction-bound session revocation.
3. Use the current `ENROLL_TWO_FACTOR`, `DISABLE_TWO_FACTOR`, and
   `REGENERATE_TWO_FACTOR_BACKUP_CODES` intent purposes. Do not revive the
   superseded `LINK_GOOGLE` recipe.
4. Link admin recovery/session semantics to `admin-user-operations.md`; link rollout
   and verification to deployment/release owners.
5. Rename the wiki heading to AtmoShaper and add architecture, decisions, account
   security, and migration lineage navigation.

**Focused verification:**

```powershell
rg -n "ENROLL_TWO_FACTOR|DISABLE_TWO_FACTOR|REGENERATE_TWO_FACTOR_BACKUP_CODES" lib prisma tests docs/wiki/account-security.md
rg -n "MassageLab Wiki|AtmoShaper Wiki|account-security|decisions|architecture" docs/wiki/index.md
node --test tests/auth-method-intent-proof.test.mjs tests/account-two-factor-management.test.mjs tests/account-security-methods.test.mjs tests/auth-schema-migration.test.mjs
if ($LASTEXITCODE -ne 0) { throw "Focused account-security tests failed" }
git diff --check
```

**Acceptance:** The security page agrees with current code/tests, wiki navigation is
current, and no old plan becomes a competing authority.

## Task 3: Omit only the evidence-cleared historical plans

**Files:**

- Delete: exactly the 16 paths in the Semantic inventory result.
- Modify: `docs/wiki/atmosphere-audio.md`
- Modify: `docs/rebrand/atmoshaper-cleanup-register.md`
- Modify:
  `docs/superpowers/plans/chimer-redesign-implementation-checklist-2026-07-06.md`

**Steps:**

1. Confirm all 16 candidates exist and all 134 retained plan/spec records remain.
2. Recheck direct consumers. Repair only the explicitly owned retained-document
   references below, then stop if any unresolved application, test, workflow, script,
   or current-authority consumer still depends on a candidate's fresh-repository path.
3. Replace the audio wiki's links to superseded execution plans with a compact
   historical-source section linking the immutable MassageLab source commit. Resolve
   current runtime wording against code: `/music` is current; metadata-only
   hover/focus/pointer-down behavior must not be contradicted by speculative warming
   prose. Treat old hosting/upload plans as dated receipts, not current operations.
4. Replace the retained Chimer checklist's link to the omitted inspiration note with
   the exact immutable MassageLab source URL, while keeping the current checklist
   status unchanged.
5. Record each omission, replacement owner, evidence, immutable source URL, and
   rollback path in the cleanup register.
6. Delete exactly the 16 plans. Do not delete specifications, test-consumed plans,
   migration materials, Aegis records, refactor records, audits, parity evidence,
   media, assets, scripts, or uncertain documents.
7. Verify all 28 inherited specs and 106 inherited retained plans remain; with this
   operative Phase 3 plan, the exact directory counts are 107 plans and 28 specs.

**Focused verification:**

```powershell
$plans = @(Get-ChildItem docs/superpowers/plans -File -Filter *.md)
$specs = @(Get-ChildItem docs/superpowers/specs -File -Filter *.md)
if ($plans.Count -ne 107 -or $specs.Count -ne 28) { throw "Unexpected plan/spec count" }
$omittedPaths = @(
  'docs/superpowers/plans/2026-05-27-project-source-of-truth-consolidation.md',
  'docs/superpowers/plans/2026-05-28-intake-form-builder-local-documents-v1.md',
  'docs/superpowers/plans/2026-05-30-privacy-first-records-framework.md',
  'docs/superpowers/plans/2026-06-18-atmosphere-first-batch-hosting.md',
  'docs/superpowers/plans/2026-06-18-atmosphere-generative-fm-sample-coverage.md',
  'docs/superpowers/plans/2026-06-18-atmosphere-hosted-opus-sidecars.md',
  'docs/superpowers/plans/2026-06-18-atmosphere-second-batch-hosting.md',
  'docs/superpowers/plans/2026-06-18-atmosphere-startup-performance.md',
  'docs/superpowers/plans/2026-06-18-atmosphere-third-batch-listener-copy.md',
  'docs/superpowers/plans/2026-06-18-atmosphere-web-audio-format-pilot.md',
  'docs/superpowers/plans/2026-06-19-atmosphere-aac-mp3-sidecars.md',
  'docs/superpowers/plans/2026-06-19-atmosphere-playback-performance.md',
  'docs/superpowers/plans/2026-06-19-atmosphere-remaining-generators.md',
  'docs/superpowers/plans/2026-06-19-atmosphere-rendered-piano-batch.md',
  'docs/superpowers/plans/2026-06-19-ci-build-cache.md',
  'docs/superpowers/plans/chimer-music-player-inspiration-note-2026-07-06.md'
)
foreach ($path in $omittedPaths) {
  if (Test-Path -LiteralPath $path) { throw "Omitted plan still exists: $path" }
}
$verificationPlan = 'docs/superpowers/plans/2026-09-09-atmoshaper-phase3-documentation-consolidation.md'
$immutableSourcePrefix = 'https://github.com/dsbowersock/massagelab/blob/e74045c2fc85c2cb4df176fdb1aff2137c4d9848/'
$rgPath = (Get-Command rg -CommandType Application -ErrorAction Stop).Source
$staleMatches = @()
foreach ($path in $omittedPaths) {
  $matches = @(& $rgPath -n --hidden -F $path . --glob '!.git/**' --glob "!$verificationPlan" --glob '!scripts/repository-audit/brand-reference-baseline.json' --glob '!docs/rebrand/atmoshaper-cleanup-register.md')
  $rgExitCode = $LASTEXITCODE
  if ($rgExitCode -notin @(0, 1)) { throw "Reference scan failed for $path" }
  foreach ($match in $matches) {
    $withoutImmutableSource = $match.Replace("$immutableSourcePrefix$path", '')
    if ($withoutImmutableSource -match [regex]::Escape($path)) { $staleMatches += $match }
  }
}
if ($staleMatches.Count -gt 0) {
  $staleMatches
  throw 'Stale fresh-repository references to omitted plans remain'
}
node --test tests/repository-audit.test.mjs
if ($LASTEXITCODE -ne 0) { throw "Repository-audit tests failed" }
git diff --check
if ($LASTEXITCODE -ne 0) { throw "Whitespace check failed" }
```

**Acceptance:** Exactly 16 cleared duplicates are absent, every omission has a
current owner and immutable historical source, and all 134 inherited retained records
plus this operative plan remain.

## Task 4: Synchronize current repository and migration authority

**Files:**

- Modify: `README.md`
- Modify: `MIGRATION_LINEAGE.md`
- Modify: `docs/project-state.md`
- Modify: `docs/project-log.md`
- Modify: `docs/rebrand/atmoshaper-migration-charter.md`
- Modify: `docs/rebrand/atmoshaper-reference-inventory.md`
- Modify: `docs/rebrand/atmoshaper-external-account-checklist.md`

**Steps:**

1. Replace stale Task 5/open-PR/stop-before-Phase-3 claims with exact facts: PR #1
   merged, merge commit `f59e1b9...`, Phase 3 branch and approved scope, and the
   bootstrap review branch retained.
2. Preserve earlier snapshots as explicitly historical receipts; do not rewrite
   their then-current statements as errors.
3. Add links to architecture, decisions, account security, and the Phase 3 plan.
4. Record the 150-record semantic review and 16 exact evidence-backed omissions;
   make clear that MassageLab retains the originals.
5. Update the GitHub/repository row in the external checklist using verified current
   facts. Leave other provider rows dated unless independently refreshed read-only.
6. Reassert that runtime rebrand, old-origin recovery, provider staging, deployment,
   production/database/payment/email/media/legal changes remain future gated work.
7. State the next gate accurately: Phase 3 verification and review, not Phase 4.

**Focused verification:**

```powershell
$projectStateCurrent = ((Get-Content docs/project-state.md -Raw -ErrorAction Stop) -split '(?m)^## Historical Task 5 Snapshot', 2)[0]
$currentAuthority = [string]::Join("`n", @(
  Get-Content README.md -Raw -ErrorAction Stop
  Get-Content MIGRATION_LINEAGE.md -Raw -ErrorAction Stop
  $projectStateCurrent
))
foreach ($staleStatus in @('Phase 2 is in progress at Task 5', 'PR #1 remains open', 'Stop before Phase 3')) {
  if ($currentAuthority -match [regex]::Escape($staleStatus)) { throw "Stale current-authority status remains: $staleStatus" }
}
if ($currentAuthority -match '(?i)(Phase 3[^\r\n]*has not begun|has not begun[^\r\n]*Phase 3)') { throw 'Current authority still says Phase 3 has not begun' }
foreach ($requiredStatus in @('f59e1b9371b06e7401740ae011f6dc911430a97c', 'Phase 3', 'PR #2', 'Phase 4 has not started')) {
  if ($currentAuthority -notmatch [regex]::Escape($requiredStatus)) { throw "Required current status is missing: $requiredStatus" }
}
node --test tests/repository-audit.test.mjs
if ($LASTEXITCODE -ne 0) { throw "Repository-audit tests failed" }
git diff --check
if ($LASTEXITCODE -ne 0) { throw "Whitespace check failed" }
```

**Acceptance:** Current authority accurately reflects the merged bootstrap and active
Phase 3; dated provider evidence is not misrepresented as current verification.

## Task 5: Reconcile audits and prove the documentation-only boundary

**Files:**

- Modify only if required:
  `scripts/repository-audit/brand-reference-baseline.json`
- Create/update coordinator evidence:
  `docs/aegis/work/2026-09-09-atmoshaper-phase3-documentation-consolidation/90-evidence.md`
- Create at closeout:
  `docs/aegis/work/2026-09-09-atmoshaper-phase3-documentation-consolidation/99-reflection.md`

**Steps:**

1. Run the brand audit before changing its baseline. Inspect every missing and
   unclassified occurrence produced by the complete documentation diff.
2. Reconcile occurrence-level entries deterministically. Preserve historical
   baseline evidence where the audit contract requires it; do not weaken categories,
   exclusions, or failure behavior merely to produce a pass.
3. Draft the evidence and reflection records before tracked-tree verification.
4. Obtain a fresh whole-branch specification review and quality review. Resolve every
   valid finding and rerun affected focused gates.
5. The coordinator stages the complete candidate, then proves the staged, unstaged,
   and untracked path boundary. Stop on any runtime, schema, configuration, workflow,
   dependency, asset, or test diff.
6. With every new evidence file staged and therefore visible to `git ls-files`, run
   repository inventory, brand audit, focused tests, full typecheck, lint, unit suite,
   production build, and whitespace checks. Explicitly assert that brand-audit JSON
   has both `missing.length === 0` and `unclassified.length === 0`; its CLI exit status
   alone is insufficient for missing entries.
7. Record exact commands, counts, exit results, diff boundary, and any residual risk
   in `90-evidence.md`; record workflow lessons in `99-reflection.md`.
8. Restage the final evidence/checkpoint updates, recheck all path boundaries and
   focused audits, commit through the coordinator, then run an exact-final-HEAD
   inventory audit, brand audit, base-to-HEAD path review, and clean-status readback.
   If the receipt-only update changes any executable input, rerun all affected gates.

**Verification:**

```powershell
npm run repository:inventory
if ($LASTEXITCODE -ne 0) { throw "Repository inventory failed" }
$brandOutput = & npm run --silent brand:audit
if ($LASTEXITCODE -ne 0) { throw "Brand audit failed" }
try { $brandReport = ($brandOutput -join "`n") | ConvertFrom-Json -ErrorAction Stop }
catch { throw "Brand audit did not return valid JSON" }
if (@($brandReport.missing).Count -ne 0 -or @($brandReport.unclassified).Count -ne 0) {
  throw "Brand audit reported missing or unclassified references"
}
$brandReport | ConvertTo-Json -Depth 5
node --test tests/repository-audit.test.mjs tests/auth-method-intent-proof.test.mjs tests/account-two-factor-management.test.mjs tests/auth-schema-migration.test.mjs tests/operational-rate-limit-schema.test.mjs tests/family-friends-server-workload.test.mjs tests/sitewide-control-rollout.test.mjs tests/calendar-creation-routes.test.mjs
if ($LASTEXITCODE -ne 0) { throw "Focused tests failed" }
npm run typecheck
if ($LASTEXITCODE -ne 0) { throw "Typecheck failed" }
npm run lint
if ($LASTEXITCODE -ne 0) { throw "Lint failed" }
npm run test
if ($LASTEXITCODE -ne 0) { throw "Unit suite failed" }
npm run build
if ($LASTEXITCODE -ne 0) { throw "Production build failed" }
git diff --cached --check
if ($LASTEXITCODE -ne 0) { throw "Staged whitespace check failed" }
git diff --check
if ($LASTEXITCODE -ne 0) { throw "Unstaged whitespace check failed" }
$allowedChangedPaths = @(
  'MIGRATION_LINEAGE.md',
  'README.md',
  'docs/aegis/work/2026-09-09-atmoshaper-phase3-documentation-consolidation/10-intent.md',
  'docs/aegis/work/2026-09-09-atmoshaper-phase3-documentation-consolidation/20-checkpoint.md',
  'docs/aegis/work/2026-09-09-atmoshaper-phase3-documentation-consolidation/90-evidence.md',
  'docs/aegis/work/2026-09-09-atmoshaper-phase3-documentation-consolidation/99-reflection.md',
  'docs/architecture.md',
  'docs/decisions/0001-fresh-root-lineage-and-history-ownership.md',
  'docs/decisions/0002-public-identity-legal-and-compatibility-boundaries.md',
  'docs/decisions/0003-origin-bound-local-data-and-pwa-recovery.md',
  'docs/decisions/0004-parallel-provider-staging-and-cutover.md',
  'docs/decisions/README.md',
  'docs/project-log.md',
  'docs/project-state.md',
  'docs/rebrand/atmoshaper-cleanup-register.md',
  'docs/rebrand/atmoshaper-external-account-checklist.md',
  'docs/rebrand/atmoshaper-migration-charter.md',
  'docs/rebrand/atmoshaper-reference-inventory.md',
  'docs/superpowers/plans/2026-05-27-project-source-of-truth-consolidation.md',
  'docs/superpowers/plans/2026-05-28-intake-form-builder-local-documents-v1.md',
  'docs/superpowers/plans/2026-05-30-privacy-first-records-framework.md',
  'docs/superpowers/plans/2026-06-18-atmosphere-first-batch-hosting.md',
  'docs/superpowers/plans/2026-06-18-atmosphere-generative-fm-sample-coverage.md',
  'docs/superpowers/plans/2026-06-18-atmosphere-hosted-opus-sidecars.md',
  'docs/superpowers/plans/2026-06-18-atmosphere-second-batch-hosting.md',
  'docs/superpowers/plans/2026-06-18-atmosphere-startup-performance.md',
  'docs/superpowers/plans/2026-06-18-atmosphere-third-batch-listener-copy.md',
  'docs/superpowers/plans/2026-06-18-atmosphere-web-audio-format-pilot.md',
  'docs/superpowers/plans/2026-06-19-atmosphere-aac-mp3-sidecars.md',
  'docs/superpowers/plans/2026-06-19-atmosphere-playback-performance.md',
  'docs/superpowers/plans/2026-06-19-atmosphere-remaining-generators.md',
  'docs/superpowers/plans/2026-06-19-atmosphere-rendered-piano-batch.md',
  'docs/superpowers/plans/2026-06-19-ci-build-cache.md',
  'docs/superpowers/plans/2026-09-09-atmoshaper-phase3-documentation-consolidation.md',
  'docs/superpowers/plans/chimer-music-player-inspiration-note-2026-07-06.md',
  'docs/superpowers/plans/chimer-redesign-implementation-checklist-2026-07-06.md',
  'docs/wiki/account-security.md',
  'docs/wiki/atmosphere-audio.md',
  'docs/wiki/index.md',
  'scripts/repository-audit/brand-reference-baseline.json'
)
$baseToHeadPaths = @(git diff --name-only f59e1b9371b06e7401740ae011f6dc911430a97c...HEAD)
if ($LASTEXITCODE -ne 0) { throw "Base-to-HEAD path check failed" }
$stagedPaths = @(git diff --name-only --cached)
if ($LASTEXITCODE -ne 0) { throw "Staged path check failed" }
$unstagedPaths = @(git diff --name-only)
if ($LASTEXITCODE -ne 0) { throw "Unstaged path check failed" }
$untrackedPaths = @(git ls-files --others --exclude-standard)
if ($LASTEXITCODE -ne 0) { throw "Untracked path check failed" }
$observedPaths = @(
  $baseToHeadPaths
  $stagedPaths
  $unstagedPaths
  $untrackedPaths
) | Where-Object { $_ } | Sort-Object -Unique
$outsideAllowedPaths = @($observedPaths | Where-Object { $_ -cnotin $allowedChangedPaths })
if ($outsideAllowedPaths.Count -gt 0) {
  $outsideAllowedPaths
  throw 'Changed or untracked paths exceed the approved documentation/baseline set'
}
```

After the final coordinator commit, rerun inventory and brand audits, assert empty
missing/unclassified arrays, inspect
`git diff --name-only f59e1b9371b06e7401740ae011f6dc911430a97c...HEAD`,
run `git diff --check f59e1b9371b06e7401740ae011f6dc911430a97c...HEAD`,
and require both commands to succeed with clean `git status --short`.

Verification-date note: `tests/family-friends-server-workload.test.mjs` currently
caps the project-state `Verified:` date at 2026-09-09. This plan executes on that
date. If resumed later, do not advance the date or change the test outside this
documentation-only scope without a separately reviewed decision.

**Acceptance:** Audits pass without policy weakening; full checks pass; changed paths
stay inside the approved documentation/baseline boundary; branch-wide reviews have
no unresolved valid findings.

## Superpowers SDD execution protocol

Use workspace `.superpowers/sdd/2026-09-09-atmoshaper-phase3-documentation-consolidation/`
with this exact ledger header:

```text
# SDD ledger — plan: docs/superpowers/plans/2026-09-09-atmoshaper-phase3-documentation-consolidation.md
```

For each task, in order:

1. Capture a clean coordinator snapshot and assign exact file ownership.
2. Dispatch one fresh implementer with the task text, required current files, allowed
   paths, stop conditions, and explicit instruction not to stage or commit.
3. Run a separate specification-compliance review.
4. Run a separate documentation/code-quality review.
5. Coordinator verifies the diff, runs focused checks, records receipts, stages only
   the task-owned files, and commits one bounded change.
6. Update the SDD ledger and Aegis checkpoint before dispatching the next task.

Do not run implementation tasks in parallel. Read-only reviewers may work in
parallel only when their ownership does not overlap a writer.

## Completion and publication boundary

Phase 3 is locally complete only when all five tasks, whole-branch reviews, audits,
and full verification pass on the final committed head. Pushing the existing local
Phase 3 branch and opening a new pull request is a separate publication action; do
not merge that future pull request without explicit authorization. Phase 4 does not
begin in this plan.
