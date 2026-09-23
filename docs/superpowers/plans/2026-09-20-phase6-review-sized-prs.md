# Phase 6 review-sized delivery plan

## Goal

Deliver the approved Phase 6 source as coherent, dependency-ordered PRs that
CodeRabbit can actually review. Preserve original PR 5 and its source branch;
do not merge any replacement without separate authorization.

## Architecture and authority

This changes delivery packaging, not application architecture. Reuse existing
source owners and tests. No new runtime abstraction, dependency, schema, legal
text, provider resource, review exclusion, or tolerance change is needed.

- Base: `cdfa99e49cebf100fac1a5080d60514806eb17db` (Phase 5 merge).
- Recovery source: `7e318558da425b8fcdddeb8df50e93a36900310a` from
  [PR 5](https://github.com/dsbowersock/atmoshaper/pull/5).
- Product requirements remain the source-locked
  [Phase 6 design](https://github.com/dsbowersock/atmoshaper/blob/7e318558da425b8fcdddeb8df50e93a36900310a/docs/superpowers/specs/2026-09-14-atmoshaper-phase6-preview-rebrand-design.md)
  and its corresponding implementation plan, not a new product design here.
- Read `AGENTS.md`, `docs/project-state.md`, `docs/project-log.md`,
  `docs/wiki/index.md`, and `docs/wiki/ci-pr-checks.md` before each slice.
- User approved preparing/publishing the sequence and one isolated worktree on
  2026-09-20. Root coordinates and owns all Git mutations; agents share that checkout.
- Tech stack: Node 24, existing npm lockfile, JavaScript/TypeScript, Node tests,
  Prisma generation/validation, Next.js and strict hosted Playwright CI.

## Compatibility and execution readiness

Keep runtime behavior, routes, stable IDs, data/acceptance history, provider
contracts and every already-reviewed repair from the recovery source. The pilot
does not change application code, live legal versions, or screenshots from main.
No merge, deployment, billing, provider lifecycle, production access, or original
CI rerun is authorized. The separate Linux ring snapshot-refresh decision remains
pending; splitting is not approval to alter its PNGs or assertions.

Requirement readiness is satisfied for the archive pilot. Its only unknowns are
fresh verification and whether CodeRabbit can review it despite the reported
capacity restriction. Publish only that pilot until actual code-review evidence
exists; skipped/status-only output is not coverage. Target fewer than 85 changed
paths per PR, and stop before publication at 100 reviewable paths or unclear scope.

Change necessity: existing changes must be redistributed because PR 5 exceeds
the hosted review file cap. Exact source blobs and scoped intermediate audit
receipts are sufficient; no new runtime fix is justified by this delivery task.
Existing legal verifier and audit owners remain canonical. Large existing audit
tests receive only their owning contract hunks, with no broad cleanup.

TDD route: mode off; decision skipped for mechanical redistribution; strict
authority not applicable. Retain behavioral tests and verify source equivalence.
For any new finding, establish the failure and recurrence cause before a bounded
repair; do not weaken tests to make an intermediate tree pass.

Execution route: subagent-driven, one bounded implementer at a time, followed by
independent SPEC then QUALITY review. Root performs fresh verification and one
coherent commit per slice. If delegation is unavailable, execute inline while
retaining independent review. This plan is guidance, not completion authority.

## Task 1: legal archive pilot

Why: archive preservation is a small prerequisite for the later current-legal
identity slice. Preserve the retired one-shot generator repair already in PR 5.

1. Start the isolated pilot branch at the locked base; run `npm ci --no-audit
   --no-fund`, `npm run prisma:generate`, and `npm run test` before source edits.
   Record exact failures rather than assuming a clean baseline.
2. Use `git show 7e318558da425b8fcdddeb8df50e93a36900310a:<path>` as the exact
   content specification and apply these six final-source files:
   - `data/legal-document-history/2026-06-legal-v2.json`
   - `data/legal-document-history/2026-07-digital-purchases-v2.json`
   - `scripts/legal-document-archive.mjs`
   - `tests/legal-document-archive.test.mjs`
   - `package.json`
   - `tests/repository-cleanup-audit.test.mjs`
3. Package delta must be only `legal:verify-archives`, invoking
   `node --test tests/legal-document-archive.test.mjs`. Cleanup audit delta must
   compare the retained data catalog with exact tracked JSON inventory instead
   of the obsolete fixed count of 40. Preserve all other tests.
4. Read `git show 59a46cad702c0e97fc2bedf238f3f8f979293d42 --
   scripts/repository-audit/policy.json tests/repository-audit.test.mjs`.
   Apply only legal archive path classification and its exact-positive and
   lookalike-negative tests. Do not copy final whole-phase fingerprints or audit
   APIs into this earlier tree.
5. Update `docs/project-state.md` and `docs/project-log.md` concisely for this
   pilot, linking this plan and preserving dated evidence as historical. Do not
   claim the later product rebrand, legal v3, review coverage or CI is complete.
6. Root stages only these owned paths for index-sensitive audits. Regenerate
   `scripts/repository-audit/brand-reference-baseline.json` using existing
   `scripts/repository-audit/brand.mjs --print-candidate-baseline`; inspect all
   changed categories and occurrence paths. Generated baseline must be stable
   against staged bytes with zero missing/unclassified entries, not final-tree
   source receipts or broad exclusions.
7. Verify archive SHA-256 values remain exactly
   `8c7263b53697495f096f479484b6ccd7eae574f20111ecf0e0a44f7fd50017aa` and
   `bdb76adf941e4e22022765734650d7e1224486d282d8303fa5869ee4fc25a4c8`.
   Six final-source paths must match source blobs. Runtime, current registry,
   acceptance rows, lockfile and PNGs must match main.
8. Run `npm run legal:verify-archives` (9 tests), `node --test
   tests/legal-documents.test.mjs tests/legal-acceptance.test.mjs
   tests/legal-document-archive.test.mjs tests/repository-audit.test.mjs
   tests/repository-cleanup-audit.test.mjs`, `npm run test`,
   `npm run prisma:validate`, `npm run prisma:generate`, `npm run typecheck`,
   `npm run lint`, `npm run brand:audit`, `npm run repository:inventory`,
   and `git diff --check`. Verify actual test filenames before the focused run.
9. Independent SPEC review must check the exact scope/equivalence, then independent
   QUALITY review checks behavior, maintainability, tests and audit receipts.
   Resolve findings, refresh validation, commit/push a new `codex/` branch,
   create/attach one PR and verify hosted base/head/count.
10. Observe each bot before triggering. Record successful request, exact reviewed
    SHA and outcome separately. Confirm CodeRabbit actually reviews this pilot
    before expanding publication. If capacity prevents review, stop expansion
    and report the refusal; no spending, upgrade or repeated unchanged request.

### Pilot portability repair discovered during verification

Git checkout filtering reproduced an archive-byte contract failure before
publication: with this repository's `core.autocrlf=true`, both exact LF blobs
would be checked out as CRLF, invalidating strict archive verification. Changing
only the command-local setting to false preserved both blob hashes, excluding
archive-content corruption as the explanation. Existing `.gitattributes` owns
LF rules for other byte-pinned fixtures but omits these two archives.

Decision: config-only production repair plus a regression test. Add exact
`text eol=lf` entries for the two legal archive paths in `.gitattributes`, and
`tests/legal-archive-checkout.test.mjs` to exercise Git checkout filters in an
isolated temporary repository under LF and CRLF settings. Prove the old rules
fail and the new rules preserve the same immutable bytes; unrelated paths must
retain their normal checkout behavior. Do not change Git's user/repository
settings, the six preserved source blobs, hash assertions or legal contents.
The pilot now owns these two additional paths, and independent SPEC then QUALITY
review must include the recurrence fix. Final source equivalence must explicitly
account for this validated repair rather than silently discard it.

### Pilot current-state date contract

The full candidate suite exposed one required companion to the dated delivery
notes: `tests/family-friends-server-workload.test.mjs` deliberately caps the
project-state Verified date and instructs that both dates advance in the same
verified evidence change. This pilot's September 20 snapshot has fresh baseline,
source/hosted-state, scope and verification evidence, while earlier operational
receipts stay explicitly historical. Carry only the fixed date-ceiling hunk to
`2026-09-20`; retain the real-calendar, upper-bound and operational-evidence
assertions and do not import later identity/mock changes from the recovery file.
This makes 15 pilot paths. Future slices must carry documentation consumers with
their owning changes and must not revert the date ceiling to the older source
date. Verify the focused file, repeat SPEC then QUALITY for this delta, and rerun
the full candidate suite before publication.

### Pilot hosted-review repair gate

PR #6 at `6961b4f` received actual completed reviews from both hosted bots.
Keep the policy matcher unchanged: replace only the legal-archive directory
prefix with the two retained filenames and cover exact positives, same-directory
unreviewed files, suffixes and nested descendants. The previous lookalike-folder
negative did not detect the same-directory widening.

The checkout test must own its Git subprocess environment as well as its working
directory. Validate inherited repository-location overrides using only temporary
decoy repositories, isolate every fixture Git command, and prove the actual test
passes with a poisoned child environment without modifying the decoy repository
or index. Preserve strict hashes and unrelated-path CRLF controls. Do not alter
global Git settings, archive contents or application code. The coordinator owns
documentation and generated audit receipts; one implementer owns policy and
the two affected test files. Independent SPEC then QUALITY and fresh regression
checks precede publishing the repaired head. Record both repairs in final source
equivalence; source redistribution must not restore the directory-wide rule.

## Remaining ownership sequence

The source has 319 changed paths: 291 non-PNG plus 28 PNG. The independently
mapped allocation below is final-file ownership, not permission to copy shared
files early. Earlier slices must carry matching owner-specific test/audit hunks.

| Order | Source ownership group | Unique non-PNG paths |
| --- | --- | ---: |
| 1 | Legal archives/verifier | 6 |
| 2 | Product identity and shell | 16 |
| 3 | Atmosphere audio | 35 |
| 4 | Public routes/content | 54 |
| 5 | Account/service copy | 49 |
| 6 | Background renderer presentation | 60 |
| 7 | Background catalog/controls | 29 |
| 8 | Current legal identity | 13 |
| 9 | Integration/audits/authority | 29 |

Slice 9 also owns 28 source PNGs. Shared docs, policy and test hunks can recur,
so actual PR file counts must be measured before publication. Exact manifests
and bounded Slice Cards are recorded in the coordinator handoff before each
slice is dispatched; no later implementation is authorized by a count alone.

Preserve shared browser/SEO/app-settings contracts with their runtime owners.
Audio includes browse/navigation/favorites/station groups and the Drone artwork,
carousel and shared-label repairs. Legal includes README/LICENSE/sidebar
copyright and dynamic legal-version fixtures. Renderer changes are not merely
comments. Final integration carries the full Phase 6 browser spec, QA harness,
streaming/ring contracts, lane registration, final audit APIs and fingerprints.
Do not copy final fingerprint policy into intermediate trees where it is stale.

## Verification, risks and retirement

Each PR requires all actionable threads addressed, both hosted reviewers clean
on its exact final head and actual slice base, and green required CI. Published
cooldowns belong to each bot/PR independently; do not invent review windows.
Any head/base change requires coverage reconciliation. Required CI stays strict.

Before declaring the sequence ready, compare its combined tree with recovery
source, account for every path/hunk and repair, and explain intentional
delivery-document/intermediate-receipt differences and separately verified repairs. Missing equivalence proof,
unreviewed slices, capacity refusal and the unresolved Linux ring check prevent
completion. No screenshot relaxation is an acceptable substitute.

Preserve PR 5 and its branch as recovery references. Closure, merge order and
worktree cleanup require separate ownership/authorization checks. Rollback is
retaining the source and declining to merge replacements; no external resource
rollback is needed. Future validated fixes must not silently disappear when
the stack is reconciled. No new architectural ADR is needed for repackaging.
