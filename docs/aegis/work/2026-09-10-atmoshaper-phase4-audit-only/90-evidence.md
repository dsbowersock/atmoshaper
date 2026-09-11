# Phase 4 audit-only evidence

Date: 2026-09-10

## Scope and immutable capture point

- Branch: `codex/atmoshaper-dead-code-audit`
- Clean committed index: `656394639464601c6e8b0833389c8272a95c2a95`
- Package-lock blob: `0ca896d3ca82547cdc383100ba8986d92b30ec77`
- The worktree and index were clean before the report captures. Reports read only
  stage-0 committed blobs; no report file, candidate, lockfile or provider state was
  changed by the captures.
- Each exact command below was invoked twice. Standard-output bytes were compared
  in memory and hashed with SHA-256; all four pairs matched exactly.

## Report receipts

| Exact command | Bytes | Report SHA-256 | Evidence SHA-256 | Result |
| --- | ---: | --- | --- | --- |
| `npm run --silent dead-code:audit` | 221,887 | `76915575657c0c0687c653986a83cd0fb709f8b7b487690897f796e17a7d0e80` | `7f4de3d950d9b75bd5ad08ee0bde0fb4952c334e0f2125ae551d85608ed07db5` | byte-identical; `deletionAuthority: false` |
| `npm run --silent dependency:audit` | 756,241 | `5514fcaafd38f8360d93a485ecadb0f3a5045cf3aaef6799450f34d846cd0a9c` | `5338169d953fdfcda6b4c6974fc15fecf9548d46814c627bbc466056528e2b53` | byte-identical; `deletionAuthority: false` |
| `npm run --silent asset:audit` | 699,978 | `cf1a17d1f42f9c9ca53346437945f73c6aef9eba1a47da8205b4c809cc242725` | `e5d431e0f4a87e7102df0864d4021b618a0b071a624998affcd6e374e5df61ad` | byte-identical; `deletionAuthority: false` |
| `npm run --silent env:audit` | 158,628 | `ed6a4009cd3e545504c4b4ff61a08543934f02a063f1bf5429aa7fe640dddc93` | `0c69052b96ebef824fd5d0bbb8973b8ab20a3c0d80794f2e0ec828c33e63d74d` | byte-identical; `deletionAuthority: false` |

## Classification, scope and uncertainty summary

- Dead code: 29 unreferenced candidates (runtime 28, tool 1), 16 protected
  items (runtime 5, test 3, tool 8), 831 referenced modules (runtime 751,
  test 25, tool 51, other 4), 667 roots, and 186 uncertainties.
- Dependency: 133 dependencies, 17 dev dependencies, 141 referenced packages,
  and 8 declaration candidates split evenly between dependency sections.
  Nineteen uncertainties cover build-only, tooling-only, implicit compiler,
  dynamic-import and unresolved-literal evidence. Literal owners are runtime 988,
  test 65, tooling 65, framework-build 10 and other 3; built-in owners are runtime
  65, test 1,074, tooling 193 and framework-build 2.
- Asset: 73 tracked assets, all protected (runtime 70, test 3); 175 direct owners
  (runtime 71, test 14, tool 86, docs 4); 19 basename-only signals; zero
  unreferenced candidates; and 2,001 uncertainties from 526 dynamic expressions
  and 1,475 unresolved literals.
- Environment: 79 declared keys, 329 static reads, 234 missing-declaration
  findings, 44 unread-declaration candidates and 13 computed-read uncertainties.
  Static reads split runtime 120, test 145, tool 50 and other 14; missing
  declarations split runtime 91, test 110, tool 26 and other 7; computed reads
  split runtime 1, test 11 and tool 1.

These counts are triage inputs only. No large candidate list is copied into current
state or the project log. The cleanup register records direct/dynamic consumers,
framework roots, runtime/build/tests, visual/accessibility, provenance/licensing,
provider/object ownership, data/PWA compatibility and rollback as required later
corroboration for every class.

## Brand-baseline reconciliation

Initial `npm run --silent brand:audit` against the committed base found 9 expected
entries missing and 8 current occurrences unclassified. The reviewed candidate:

- retained schema version 1 and source commit
  `e74045c2fc85c2cb4df176fdb1aff2137c4d9848`;
- moved four historical occurrences in `MIGRATION_LINEAGE.md`, three public-copy
  occurrences in `README.md`, and one historical occurrence in
  `docs/project-state.md` without changing their text hashes or categories;
- removed one superseded public-copy occurrence from `README.md`;
- changed total entries from 26,381 to 26,380: compatibility 22,905 unchanged,
  historical 1,481 unchanged, legal 42 unchanged, and pre-rebrand public copy
  1,953 to 1,952; and
- required one self-reference fixed-point pass for five compatibility occurrences
  in the baseline file itself: three target the install dialog, and two target the
  retained color-harmony README on the same source line at distinct columns.

The final tracked baseline is 5,984,749 bytes with SHA-256
`774ad9f3179213d25b2e0e5be463343e42bd49084fd16430673e1651e133e261`.
`npm run --silent brand:audit` exits zero with zero missing and zero unclassified
references. Two fresh
`npm run --silent brand:audit -- --print-candidate-baseline` executions are
byte-identical to one another and to the tracked baseline.

## Supporting deterministic checks

- `npm run --silent repository:inventory` ran twice with byte-identical 1,626-byte
  output: 1,914 tracked files, 47,112,296 Git blob bytes, report SHA-256
  `27f6251e4e13aea58fb7bf4794ba7e5533467d40c40bd8346473992148459e9e`,
  and inventory SHA-256
  `594628be03cd63d56b2fdb014a72d0820f024d8c6053d1ac67b01f46941142cd`.
- `git diff --exit-code -- package-lock.json` and
  `git diff --cached --exit-code -- package-lock.json` exited zero.
- Focused audit, link/reference, allowed-scope and whitespace checks are recorded
  in the Task 5 subagent report and must be rerun by the coordinator after staging.

## Authority and next gate

Deletion authority: **none**. Candidate status is limited to `unresolved`,
`protected`, or `candidate`. No candidate was deleted, renamed, upgraded or
retired; no runtime, dependency version, lockfile, provider, database, production,
domain, payment, email, media, legal or external state changed.

Task 6 full local verification and broad review are the next internal gates after
Task 5 reviews and commit. Publication and every Phase 5 action remain separately
authorized boundaries.

## Historical Task 6 initial pre-review local verification receipt

This initial pre-review receipt is retained as chronological evidence. Its
staging and next-action language describes that earlier checkpoint and is
superseded by the authoritative final-review repair receipt below.

The verification sequence began at clean committed head
`a3b21624cb1891cfbc423aa43a482dffd023d3d7`. These measurements describe that
committed index plus the separately identified test-only freshness repair; the
coordinator must repeat index-sensitive checks after staging this receipt.

- `node --test tests/repository-audit.test.mjs tests/repository-cleanup-audit.test.mjs`
  passed 51/51 with zero skipped or failed.
- `npm run repository:inventory` exited zero with 1,915 tracked files,
  47,128,976 Git blob bytes, inventory SHA-256
  `4696fea80b57a9ee066d3e209335261ae1f91d3a1ced3218d3f70b428854f596`,
  and zero forbidden tracked paths.
- `npm run brand:audit` exited zero with zero missing and zero unclassified
  occurrences; category totals remain compatibility 22,905, historical 1,481,
  legal 42, and pre-rebrand public copy 1,952.
- `npm run dead-code:audit`, `npm run dependency:audit`, `npm run asset:audit`,
  and `npm run env:audit` each exited zero twice. Each pair had byte-identical
  standard output and empty standard error. Their non-silent byte counts were
  221,970, 756,326, 700,053, and 158,707 respectively.
- Against this final Task 5 committed index, the silent dead-code, dependency,
  asset, and environment reports measured 221,887, 756,241, 699,978, and 158,628
  bytes. Their report SHA-256 values were respectively
  `76915575657c0c0687c653986a83cd0fb709f8b7b487690897f796e17a7d0e80`,
  `5514fcaafd38f8360d93a485ecadb0f3a5045cf3aaef6799450f34d846cd0a9c`,
  `2efcc473d416b26427b91fd8708ed66b35b0e22a549d57992b4451e7ec277aea`,
  and `ed6a4009cd3e545504c4b4ff61a08543934f02a063f1bf5429aa7fe640dddc93`.
  The asset report differs from the earlier clean-index Task 5 hash after the
  subsequently committed evidence documentation entered the index; its counts
  remain 73 tracked and protected assets, 175 exact owners, zero
  candidates, 19 basename signals, and 2,001 uncertainties. The other report
  counts and evidence hashes remain as recorded above. This does not rewrite or
  invalidate the earlier immutable Task 5 capture.
- `npm run prisma:validate` reported the schema valid. `npm run prisma:generate`
  generated Prisma Client 7.9.1 without a tracked change. `npm run typecheck`
  exited zero. The first lint run found three `no-require-imports` errors only in
  two ignored task-local CommonJS verification helpers. Narrow file-level disables
  kept those scratch helpers lintable; the full rerun exited zero with only the
  inherited Babel large-file informational note for `app/chimer/running-timer.tsx`.
- The first `npm run test` run exposed the intended documentation-freshness guard:
  4,249 tests, 4,245 passed, 1 failed, and 3 skipped because the test ceiling still
  ended at 2026-09-09 while project-state evidence was verified on 2026-09-10.
  Coordinator-authorized fix round 1 changed only that ceiling. The focused file
  passed 15/15, and the complete rerun passed 4,246 with 3 skipped and zero failed.
- `npm run build` exited zero with Next.js 16.2.12. Compilation took 30.4 seconds,
  the post-compile hook 2.8 seconds, TypeScript 73 seconds, and static generation
  completed 115/115 pages. The emitted route table was recorded without claiming
  a bundle-size or performance improvement.

## Delta and closeout boundary

- The Phase 3 merge base contains 1,904 tracked files and 46,967,363 Git blob
  bytes. Task 5 head contains 1,915 files and 47,128,976 bytes: eleven added files
  and 161,613 additional bytes, all explained by the Phase 4 plan/evidence,
  cleanup policy and static audit tooling, focused tests, four package scripts,
  and deterministic brand-baseline reconciliation.
- `package.json` changes only by adding the exact `dead-code:audit`,
  `dependency:audit`, `asset:audit`, and `env:audit` scripts. Dependency fields,
  versions, overrides, patches, and `package-lock.json` are unchanged.
- `git diff --check`, worktree and index lockfile diffs, and a six-path
  final-newline/trailing-whitespace check all exited cleanly. The lockfile blob
  remains `0ca896d3ca82547cdc383100ba8986d92b30ec77`. The 21-path complete branch
  delta is limited to the approved plan, audit policy/tooling, focused tests,
  package scripts, deterministic baseline, and evidence documentation.
- The Task 6 test edit is a same-length, test-only date ceiling aligned to verified
  evidence. No runtime behavior changed. The six-path worktree candidate contains
  1,916 versioned files and 47,139,794 bytes when the five modified files and one
  new reflection are measured against the Task 5 tree. The paths await coordinator
  staging, so the staged inventory and all index-sensitive hashes require
  coordinator readback before commit.
- Task clean: **no at implementer handoff** — the six Task 6 paths are intentionally
  left unstaged for coordinator review. Repository clean: **no for the same bounded
  reason**; `git status --short` reports exactly five modified files and the new
  reflection, with no unrelated tracked change. Retained resources are the
  branch itself, the prior Phase 3 review branch, and the task-local ignored SDD
  workspace. No QA project or other provider resource exists for this task.
- The installed Aegis package exposed no workspace-helper executable, so structural
  bundle/check commands were unavailable. The work record was reviewed directly;
  this limitation does not substitute for evidence sufficiency.

Deletion authority remains **none**. Browser QA, a temporary QA project, push, PR,
merge, deployment, candidate retirement, and Phase 5 work were not performed and
remain separate authorization boundaries.

## Historical final-review repair receipt — first staged capture, superseded

Independent review found five valid defects in the audit implementation. The
bounded repair preserves the Task 6 work and addresses each finding without
changing a candidate, runtime path, dependency, lockfile, asset, schema,
migration, snapshot or provider:

- Policy selection now resolves under the audit root, rejects private, untracked
  and out-of-root paths before content access, reads the tracked stage-0 blob and
  passes one captured entry set into the report inventory. An unstaged policy
  edit is proven unable to change output.
- Every lane exposes exactly `schemaVersion`, `auditKind`, hard-coded
  `deletionAuthority: false`, `inventorySha256`, `summary`, `findings` and
  `uncertainties`. The earlier Task 5 and first Task 6 `kind`, `evidenceSha256`
  and nested `evidence` captures above remain historical receipts, explicitly
  superseded for current tooling.
- An unresolved literal module is a named negative-fixture uncertainty only when
  its path is both in test scope and under a policy-owned protected prefix.
  Active code and unprotected tests fail closed. The staged repository has zero
  unresolved literal-module errors.
- The 937-nonblank-line shared module is split into cohesive source, module,
  dependency, asset, environment and index/privacy/envelope owners. The largest
  audit source is 335 nonblank lines; every source is at most 500, every CLI is
  at most 188 and no source mixes two evidence or candidate report builders.
- Direct and default-parameter environment aliases produce proven reads.
  Unproven aliases remain named uncertainties rather than unread declarations;
  the prior false unread Stripe key is a proven static read.

Before receipt-only documentation synchronization, the first fully staged repair
capture contained 1,921 files and 47,170,491 Git blob bytes, had no forbidden
tracked path, and had inventory SHA-256
`4d826fc678cbb9303eb43805ece57978f1910d958b69cd65038c037f4a8bf827`.
Its focused staged suite passed 59/59. Each silent CLI passed twice with
byte-identical standard output, empty standard error, the exact seven-field
contract and that same inventory identity:

| Lane | Report SHA-256 | Bytes | Findings | Uncertainties |
| --- | --- | ---: | ---: | ---: |
| Dead code | `ac5f292e82da5134f29b0c0c24e01cfdcaaa06f62625c62f8aafc71bb083da6c` | 273,359 | 1,558: 29 candidates, 21 protected, 836 referenced and 672 roots | 186 |
| Dependency | `8c0ad3e2d171a549cea55d89548175d654b0b41e4d913ea7448fb714ad45c884` | 842,988 | 2,858 | 19 |
| Asset | `d3b0fe054db44c73f7b42f84ea0d0a38270228c7a01677411e3cfddd4f92f7f4` | 752,047 | 340 | 2,002: 526 dynamic and 1,476 unresolved literals |
| Environment | `b1b7db47add403da40156606065fd0bacb185d2bcc3cc5dbf0bd13a7948207db` | 251,117 | 719 | 186 |

Brand audit remains at zero missing and zero unclassified occurrences, with
compatibility 22,905, historical 1,481, legal 42 and pre-rebrand public copy
1,952. The tracked fixed point remains 5,984,749 bytes. Earlier local Prisma,
typecheck, lint, full-unit and 115-page production-build results remain valid
supporting receipts; the staged focused and index-sensitive gates above are the
first fully staged repair readback.

Those inventory and report hashes describe that first capture, not an immutable
final commit candidate. This versioned receipt cannot embed the hash of an index
that includes its own updated blob. After the synchronized final receipt
documents are staged, the coordinator must run one exact final-index readback;
its inventory and report hashes will be retained in the ignored SDD handoff and
user-facing completion receipt rather than embedded back into the self-hashed
index.

Deletion authority remains **none**. Every candidate is retained with status
`candidate`, `protected` or `unresolved`. This 59/59 capture remains historical
evidence and is superseded for current-tooling decisions by the repair cycle
below.

## Final repair-cycle receipt — staged local gate complete

The final quality-review cycle adds five bounded scanner corrections without
changing dependencies, runtime behavior, candidates or external state:

- Malformed or path-like module specifiers now fail closed through hash-only
  sanitized evidence; a Windows absolute-path sentinel proves that neither the
  literal nor the workstation root is serialized.
- Destructured environment aliases in default parameters are recognized, while
  explicit lexical non-alias bindings, correct parameter-initializer scope and
  assignment invalidation prevent outer aliases from leaking through shadows or
  reassignment.
- Module and asset audits share the installed Next 16.2.12 metadata convention:
  zero or one numeric suffix is protected, so `icon9` is framework metadata and
  `icon10` remains a lookalike candidate.
- Static literal `require.resolve()` calls contribute package ownership; a
  nonliteral argument remains a hash-only uncertainty.

Repair validation first confirmed all three targeted regression groups failed
(0/3 passed), then passed them after the minimum implementation changes (3/3
passed); strict TDD remained off. The pre-publication combined repository-audit
and repository-cleanup-audit suites subsequently passed 64/64 with zero failures
or skips. Hosted review round 1 then corrected environment evidence so assignment and
delete targets no longer count as reads; its focused slice passed 7/7, and the
combined focused audit suites passed 68/68. That round's semantic evaluation
against one captured stage-0 source produced:

| Lane | Findings | Uncertainties | Hosted-review round 1 classification |
| --- | ---: | ---: | --- |
| Dead code | 1,558 | 186 | 29 candidates, 21 protected, 836 referenced and 672 roots; unchanged from the historical staged capture. |
| Dependency | 2,859 | 19 | One additional literal-import owner records the repository's static `require.resolve()` usage; candidate authority is unchanged. |
| Asset | 340 | 2,002 | 526 dynamic and 1,476 unresolved literals; single-digit metadata parity is enforced and no asset deletion is authorized. |
| Environment | 612 | 178 | 79 declared, 202 missing, 306 static-read and 25 unread findings; 9 computed-read and 169 unproven uncertainties. |

Hosted review round 2 added config-alias, whole-object/computed environment, and
browser-snapshot coverage. Its focused repository audit suites passed 74/74.
Its historical semantic evaluation against the captured stage-0 source was:

| Lane | Findings | Uncertainties | Hosted-review round 2 classification |
| --- | ---: | ---: | --- |
| Dead code | 1,558 | 186 | Candidate authority is unchanged. |
| Dependency | 2,859 | 19 | Candidate authority is unchanged. |
| Asset | 388 | 2,003 | Browser snapshots are covered and no asset deletion is authorized. |
| Environment | 587 | 191 | Whole-object and computed environment access remain conservatively evidenced. |

Round 2's historical pre-document receipt-synchronization snapshot measured
47,216,441 Git blob bytes.

Hosted review round 3 added separately labeled exact declaration-companion/type
evidence, two exact configuration/manifest dependency owners, and owner-relative
bare asset paths that become exact only when tracked and in inventory and
otherwise remain hash-only uncertainty. That round's focused repository audit
suites passed 80/80, with these now-historical semantic results:

| Lane | Findings | Uncertainties | Round-3 bounded classification |
| --- | ---: | ---: | --- |
| Dead code | 1,558 | 186 | 842 referenced modules and 23 candidates; declaration/type evidence preserves implementation edges. |
| Dependency | 2,861 | 19 | Two configuration owners and 6 candidates; no runtime import is inferred. |
| Asset | 390 | 11,384 | 97 tracked assets, 97 protected items, 177 exact owners and zero candidates; 529 dynamic and 10,855 unresolved rows. |
| Environment | 587 | 191 | Unchanged from hosted review round 2. |

Hosted review round 4 moved exact configuration ownership into the validated
stage-0 policy and conservatively covered direct, aliased, wrapped, logical and
conditional whole-environment forwarding without changing asset semantics. The
focused repository audit suites passed 83/83: 21 repository-audit tests and 62
cleanup-audit tests. Its now-historical semantic results were:

| Lane | Findings | Uncertainties | Round-4 bounded classification |
| --- | ---: | ---: | --- |
| Dead code | 1,558 | 186 | 842 referenced modules and 23 candidates. |
| Dependency | 2,861 | 19 | Two configuration owners and 6 candidates. |
| Asset | 390 | 11,384 | 97 tracked assets, 97 protected items, 177 exact owners and zero candidates; 529 dynamic and 10,855 unresolved rows. |
| Environment | 587 | 250 | 77 computed and 173 unproven-alias uncertainties; zero unread-declaration candidates. |

Hosted review round 5 recognized runtime named `env` imports from the exact
`node:process` and `process` modules and preserved their evidence through
lexical loop/catch shadowing and function-scoped `var` behavior, including
assignment-free redeclarations. It also repaired the two historical receipt
anchors in the reference inventory. That round's focused repository audit suites
passed 86/86: 21 repository-audit tests and 65 cleanup-audit tests. Its now-historical
semantic results were:

| Lane | Findings | Uncertainties | Round-5 bounded classification |
| --- | ---: | ---: | --- |
| Dead code | 1,558 | 186 | 842 referenced modules and 23 candidates. |
| Dependency | 2,861 | 19 | Two configuration owners and 6 candidates. |
| Asset | 390 | 11,384 | 97 tracked assets, 97 protected items, 177 exact owners and zero candidates; 529 dynamic and 10,855 unresolved rows. |
| Environment | 587 | 252 | 79 computed and 173 unproven-alias uncertainties; zero unread-declaration candidates. |

Hosted review round 6 recorded nested object destructuring defaults sourced
from proven environment objects. That round's focused repository audit suites
passed 87/87: 21 repository-audit tests and 66 cleanup-audit tests. Its now-historical
semantic results were:

| Lane | Findings | Uncertainties | Round-6 bounded classification |
| --- | ---: | ---: | --- |
| Dead code | 1,558 | 186 | 842 referenced modules and 23 candidates. |
| Dependency | 2,861 | 19 | Two configuration owners and 6 candidates. |
| Asset | 390 | 11,384 | 97 tracked assets, 97 protected items, 177 exact owners and zero candidates; 529 dynamic and 10,855 unresolved rows. |
| Environment | 587 | 252 | 79 computed and 173 unproven-alias uncertainties; zero unread-declaration candidates. |

At the verified round-6 staged code snapshot, the full suite passed 4,282
tests with 3 host-dependent skips and zero failures; typecheck and lint
passed.

Hosted review round 7 recorded exact tracked runtime package metadata
ownership, keeping `@generative-music/pieces-alex-bainter` out of unreferenced
candidates without claiming an executable import. The generic parser required
exact declared package names and versions and conservatively handled lexical
shadows, duplicate or overridden properties, and spreads. That round's focused repository audit suites passed 88/88: 21 repository-audit tests and 67
cleanup-audit tests. Its now-historical semantic results were:

| Lane | Findings | Uncertainties | Round-7 bounded classification |
| --- | ---: | ---: | --- |
| Dead code | 1,558 | 186 | 842 referenced modules and 23 candidates. |
| Dependency | 2,863 | 19 | Two configuration owners, 1 runtime-package-metadata owner, 144 referenced packages and 5 candidates; metadata does not prove an import. |
| Asset | 390 | 11,384 | 97 tracked assets, 97 protected items, 177 exact owners and zero candidates; 529 dynamic and 10,855 unresolved rows. |
| Environment | 587 | 252 | 79 computed and 173 unproven-alias uncertainties; zero unread-declaration candidates. |

Round-7 verification passed: the full suite recorded 4,283 passed, 3
host-dependent skips and zero failures; typecheck passed; lint passed with no
ESLint warnings; and the production build passed with 115 routes. The build's
Babel deoptimization note was informational, not a lint warning. Earlier
round-6 results remain historical supporting evidence.

Hosted review round 8 added `data/` to the asset inventory and explicitly
protected it as a conservative retained catalog/provenance boundary. Duplicate
dependency declarations preserved all exact string versions across
declaration sections for runtime metadata matching, without claiming an
executable import. That round's focused repository audit suites passed 91/91: 21
repository-audit tests and 70 cleanup-audit tests. Its now-historical semantic
results were:

| Lane | Findings | Uncertainties | Historical round-8 bounded classification |
| --- | ---: | ---: | --- |
| Dead code | 1,558 | 186 | 842 referenced modules and 23 candidates. |
| Dependency | 2,863 | 19 | Two configuration owners, 1 runtime-package-metadata owner, 144 referenced packages and 5 candidates; metadata does not prove an import. |
| Asset | 561 | 11,302 | 137 tracked assets, 137 protected items, 262 reference owners, 25 basename signals and zero candidates; 529 dynamic and 10,773 unresolved rows. |
| Environment | 587 | 252 | 79 computed and 173 unproven-alias uncertainties; zero unread-declaration candidates. |

At the verified round-8 staged snapshot, the full suite recorded 4,289 tests:
4,286 passed, 3 host-dependent skips and zero failures. Typecheck passed; lint
passed with no ESLint warnings; and the production build passed with 115
routes. The Babel deoptimization note was informational, not a lint warning.
All four audit CLIs ran twice with byte-identical output, zero stderr and
`deletionAuthority: false`.

Hosted review round 9 made global and exact imported process-object
recognition scope-aware. Lexical/TDZ, `var`, function, class, catch, loop,
module and static-block shadows no longer imply environment ownership.
Parameter defaults were evaluated separately from body bindings, and
namespace `ImportEquals` declarations shadowed outer process objects. The
import classifier was consolidated; the environment analyzer contained 482
nonblank lines. These repairs changed no real-repository audit counts.
That round's focused repository audit suites passed 95/95: 21 repository-audit
tests and 74 cleanup-audit tests. Its now-historical semantic results were dead code
1,558 findings/186 uncertainties; dependency 2,863/19; asset 561/11,302;
and environment 587/252: 306 static reads, 79 declared names, 202 missing
declarations, zero unread-declaration candidates, 79 computed uncertainties
and 173 unproven-alias uncertainties.

At the verified round-9 staged code snapshot, the full suite recorded 4,293
tests: 4,290 passed, 3 host-dependent skips and zero failures. Typecheck
passed; lint passed with no ESLint warnings; and the production build passed
with 115 routes. Rounds 7 and 8 remain historical supporting evidence.
Every report retains `deletionAuthority: false`.

Hosted review round 10 repaired two validated latest-head findings: outer
proven/unknown environment aliases leaking across inner declarations, and
non-Node runtime imports locally named `env` or `environment` disappearing
from the evidence. Inner declarations shadowed outer aliases without
discarding existing same-scope bindings on assignment-free `var`
redeclarations. Non-Node wrapper imports remain unproven-alias uncertainty,
not exact environment ownership; exact Node imports and type-only exclusions
remain distinct. The regression repair followed TDD RED/GREEN validation.
The environment analyzer contained 490 nonblank lines.

That round's focused repository audit suites passed 97/97: 21 repository-audit
tests and 76 cleanup-audit tests. At the verified round-10 code snapshot, the
full suite recorded 4,295 tests: 4,292 passed, 3 host-dependent skips and zero
failures. Typecheck and lint passed; the Babel deoptimization note was
informational, not an ESLint warning. The exact environment audit ran twice
with byte-identical output, zero stderr and `deletionAuthority: false`.
Its now-historical totals remained unchanged at 587 findings/252 uncertainties:
306 static reads, 79 declared names, 202 missing declarations, zero
unread-declaration candidates, 79 computed uncertainties and 173
unproven-alias uncertainties. Round-9 verification remains historical
supporting evidence, including its production-build receipt.

At that snapshot, latest-head hosted review was pending; resolving hosted feedback and final
checks/review precede any separately authorized merge. No cleanup deletion,
provider mutation or Phase 5 action occurred; `deletionAuthority` remains
false.

Hosted review round 11 recorded the staged CodeRabbit/Codex privacy and
opaque-tool hardening. Nested `.secrets/` and `secrets/` directories were
rejected at any depth before policy, metadata or evidence blob reads. The
tracked Python adapter was represented exactly once as an opaque manual-tool
uncertainty without parsing its content; this does not claim a static import
or authorize removal.

That round's focused repository audit suites passed 98/98. The full suite
recorded 4,296 tests: 4,293 passed, 3 host-dependent skips and zero failures.
Typecheck and lint passed. Its now-historical semantic results were dead code 1,558
findings/187 uncertainties, including 2 manual-script uncertainties;
dependency 2,863/19; asset 561/11,303; and environment 587/252. All four
audits ran twice with byte-identical output, exit 0 and empty stderr;
every report retained `deletionAuthority: false`. Brand verification reported
zero missing and zero unclassified references, and the inventory reported
zero forbidden tracked paths.

The exact staged capture before this round's documentation synchronization
contained 1,921 files and 47,355,254 Git blob bytes, with inventory SHA-256
`bb8b8c792c03a60bd5531e69e4f6c81d95781851b751c8b9a5824700036ded92`.
This is a historical pre-document-synchronization capture, not the identity
of the index after these versioned receipts are staged. Current final-index
bytes and hashes remain outside these self-referential versioned documents.
Round-10 results remain historical supporting evidence.

At that snapshot, latest-head hosted review and final checks/review were pending before any
separately authorized merge of PR #3. No cleanup deletion, provider mutation
or Phase 5 action occurred; `deletionAuthority` remains false.

Hosted review round 12 repaired two validated latest-head Codex findings:
tracked credential/secret basename files could bypass privacy protection
under non-JSON extensions, and 22 CSS files were absent from cleanup
candidate/uncertainty coverage. Exact or dotted `credential`, `credentials`,
`secret` and `secrets` basenames are now rejected independently of extension
before blob reads, while lookalike names remain allowed. Policy-owned `.css`
files each appear exactly once as metadata-only `stylesheetUsage`
uncertainties, without JS/TS parsing or dependency evidence; existing imports
and CSS asset-reference evidence remain preserved.

TDD credential validation recorded RED with 0 of 1 targeted test passing,
then GREEN 2/2. All 3 newly added CSS regression tests failed at RED for the
expected missing coverage before implementation; the CSS GREEN slice passed
11/11. The authoritative staged focused repository audit suites passed
101/101. The full suite exited 0 with 4,299 tests: 4,296 passed, 3
host-dependent skips and zero failures. Typecheck and lint passed; the Babel
deoptimization note was informational.

Its now-historical semantic results were dead code 1,558 findings/209
uncertainties, including 22 `stylesheetUsage` and 2 `manualScripts`
uncertainties; dependency 2,863/19; asset 561/11,305; and environment
587/252. All four audits ran twice with byte-identical output, exit 0 and
empty stderr; every report retained `deletionAuthority: false`. Brand
verification remained at zero missing and zero unclassified references.

The historical pre-document-synchronization staged inventory contained
1,921 files and 47,369,668 Git blob bytes, with inventory SHA-256
`88baaae9e2ebd36cc66e06965ab3dee426a3c1bcaf1b3eaa110a1d8bd7c0d12a`
and zero forbidden tracked paths. This capture does not identify the index
after these versioned receipts are staged; current final-index bytes and
hashes remain outside these self-referential documents. Round-11 results
remain historical supporting evidence.

At that snapshot, latest-head hosted checks and reviews remained pending before any separately
authorized merge of PR #3. No deletion, merge, provider mutation or Phase 5
action occurred; `deletionAuthority` remains false.

Hosted review round 13 repaired one validated latest-head Codex finding at
`3a10a1b`: nested exact plain or dotted singular/plural credential/secret
directory segments could bypass the fail-before-read guard. Those directory
segments are now rejected before metadata or blob reads, while lookalike names
remain allowed.

TDD validation recorded RED with 0 of 1 targeted test passing, then GREEN
1/1. The focused privacy/source-cap slice passed 8/8, and the CSS regression
slice passed 3/3. The authoritative staged repository audit suites passed
101/101. The full suite exited 0 with 4,299 tests: 4,296 passed, 3
host-dependent skips and zero failures. Typecheck and lint passed; the Babel
deoptimization note was informational.

Its now-historical semantic results were dead code 1,558 findings/209
uncertainties, including 22 `stylesheetUsage` and 2 `manualScripts`
uncertainties; dependency 2,863/19; asset 561/11,308; and environment
587/252. All four audits ran twice with byte-identical output, exit 0 and
empty stderr; every report retained `deletionAuthority: false`. Brand
verification remained at zero missing and zero unclassified references.

The historical pre-document-synchronization staged inventory contained
1,921 files and 47,381,374 Git blob bytes, with inventory SHA-256
`1bf7e63a2192b624816da03083b867d45d6611b51d37a7d8bb10fe99c6bbbe9a`
and zero forbidden tracked paths. This capture does not identify the index
after these versioned receipts are staged; current final-index bytes and
hashes remain outside these self-referential documents. Round-12 results
remain historical supporting evidence.

At that snapshot, latest-head hosted checks and reviews remained pending before any separately
authorized merge of PR #3. No deletion, merge, provider mutation or Phase 5
action occurred; `deletionAuthority` remains false.

Hosted review round 14 repairs one validated latest-head Codex finding on
`9e5cb0c`: bounded compound credential-artifact basenames
`client_secret_<identifier>` and exact `service-account-key` were reaching
metadata or blob reads. They are now rejected before policy, metadata or
evidence reads. Case and nesting variants were tested; benign lookalikes
remain allowed.

Strict TDD validation recorded RED with 0 of 1 targeted test passing, then
GREEN 1/1. The relevant privacy/CSS/source-cap slice passed 11/11, and the
authoritative staged focused repository audit suites passed 101/101.
The full suite exited 0 with 4,299 tests: 4,296 passed, 3 host-dependent
skips and zero failures. Typecheck and lint passed; the Babel deoptimization
note was informational.

Its now-historical semantic results were dead code 1,558 findings/209
uncertainties, including 22 `stylesheetUsage` and 2 `manualScripts`
uncertainties; dependency 2,863/19; asset 561/11,312 with 529 dynamic and
10,783 unresolved uncertainties; and environment 587/252. All four audits
ran twice with byte-identical output, exit 0 and empty stderr; every report
retained `deletionAuthority: false`. Brand verification remained at zero
missing and zero unclassified references.

The historical pre-document-synchronization staged inventory contained
1,921 files and 47,391,330 Git blob bytes, with inventory SHA-256
`76816a9001dd302d4765da3dc868da9d9eb9636ee3809c71814659c3d2f6c046`
and zero forbidden tracked paths. This capture does not identify the index
after these versioned receipts are staged; exact final-index bytes and
hashes remain outside these self-referential tracked documents. Round-13
results remain historical supporting evidence.

Latest-head hosted checks and CodeRabbit/Codex reviews remain pending
before any separately authorized merge of PR #3. No deletion, merge,
provider mutation or Phase 5 action occurred; `deletionAuthority` remains
false.

Hosted review round 15 records two validated latest-head Codex findings on
`9946a24`: generic `client-secret.json`, `client_secret.json` and
`service-account.json` artifacts bypassed the fail-before-read guard, and
direct CommonJS `const process = require("node:process")` / `require("process")`
bindings were not recognized, causing false unread environment declarations.
The bounded credential matcher now recognizes exact optionally dot-prefixed
`client[-_]secret` and `service[-_]account` stems only at dot or end
boundaries, while preserving the earlier `client_secret_<identifier>` and
`service-account-key` forms and benign guide/manager lookalikes.

The CommonJS process-binding scope model recognizes those exact direct
requires and models `require`/`process` shadowing, assignment and update
invalidation, loop evaluation order, merged enum members, and sloppy `.cjs`
Annex-B block-function boundaries. Cross-file/global bindings and separately
merged namespace enums remain explicitly unmodeled. The current real tracked
source search found no CommonJS process require outside audit fixtures.

On the staged code, the focused repository-audit tests passed 119/119, the
full suite recorded 4,317 tests with 4,314 passed, 3 host-dependent skips and
zero failures, and typecheck and lint passed. The pre-document deterministic
audits ran twice with byte-identical output, exit 0 and empty stderr; every
report retained `deletionAuthority: false`: dead code 1,561 findings/209
uncertainties, dependency 2,864/19, asset 561/11,314, and environment 587/252.
Brand verification reported zero missing and zero unclassified references.

The pre-document staged inventory contained 1,922 files and 47,432,255 Git
blob bytes, with inventory SHA-256
`9ceea8c33aee9a51559efc389c9834e31fbecb4f40ee5154ae7d738b5638d6d0`
and zero forbidden tracked paths. Repeat output SHA-256 values were dead code
`a6357175f60ce4bba5fbcde50a93e262ebb5744c89c409b2b844cf78f68047a5`,
dependency `f068dd6f6f219f9a0d5abbf4462752373cbca7bee02c9d9bd8756e142ec49a47`,
asset `ad1f0bfacd3cdab11ba39986af151d760b9e750b48b94345f53c718ecf3a2051`,
environment `c1dc9e91f3861926328721bd6e98d269c7eceb29f9970a09b18d047e31bd4acf`,
inventory `82d2afaf5b953d9e2c2a83acd01d819ce2ea7a3d38c1c4bc293e8e86f0cafb4a`,
and brand `50a8f6f48d60f51c00edfd2b0a5005289e007e9939f18862beaa5e83667ecd2b`.
These are pre-document receipts, not the identity or output hashes of the
self-referential final index after these versioned documents are staged.
Round-14 results remain historical supporting evidence. Hosted checks and
reviews remain pending, and merge remains separately authorized. No deletion,
merge, provider action or Phase 5 work occurred.

The current tracked inventory remains 1,922 files. Brand verification remains
zero missing and zero unclassified. Every report keeps
`deletionAuthority: false`; exact current staged bytes and identity remain only
in the ignored SDD handoff and user-facing receipt rather than this
self-referential versioned evidence.

The hosted-review tables contain semantic counts, not embedded final-index
hashes. The earlier 59/59, 64/64, and 68/68 captures and their report hashes
remain historical and superseded for current-tooling decisions. Against the
pre-publication final staged repair, the complete suite
passed 4,259 tests with 3 host-dependent skips and zero failures, and the
115-route production build passed. At that snapshot, the coordinator still had
to perform the receipt-synchronized exact-index readback, retain its hashes only
in the ignored SDD handoff and user-facing completion receipt, repeat independent
whole-branch reviews, and create the coordinator-owned commit. Those gates later
completed before separate publication authorization opened
[PR #3](https://github.com/dsbowersock/atmoshaper/pull/3).

Deletion authority remains **none**. Every candidate stays `candidate`,
`protected` or `unresolved`. Separate publication authorization pushed the
branch and opened [PR #3](https://github.com/dsbowersock/atmoshaper/pull/3);
it remains in hosted review, and resolving hosted feedback plus final
checks/review precede any separately authorized merge. No candidate deletion,
rename, upgrade, retirement, provider mutation, merge or Phase 5 action
occurred.

Hosted review round 16 records two validated latest-head Codex findings on
`012945b`: TypeScript external import-equals module references were absent from
module/dependency evidence, and exact non-type source-level
`import <alias> = require("process"|"node:process")` declarations were not
proven for environment reads. The module repair emits separately labeled
`import-equals` literal/static evidence, preserves type-only declaration
resolution, ignores internal aliases, and retains syntactically possible
nonliteral external references only as hash-only uncertainty.

Environment evidence now proves process import-equals only for valid
source-level non-type declarations, with source-order, lexical-shadowing and
assignment/update-invalidation behavior preserved. Unrelated, internal,
type-only and nested-invalid forms remain excluded. Independent review caught
and repaired the TS1147 namespace false-positive. Current tracked source has no
import-equals `require(...)` syntax, so real semantic totals did not move.

Staged validation passed the module import-equals slice 3/3; environment strict
RED 0/2 then GREEN 2/2; namespace correction RED 1/2 then GREEN 2/2; combined
slice 52/52; focused repository audits 123/123; and the full suite with 4,321
total, 4,318 passed, 3 host-dependent skips and zero failures. Typecheck, lint
and diff checks passed. Source caps were module 500, environment 499 and scope
131 nonblank lines.

Pre-document audits ran twice with byte-identical output, exit 0 and empty
stderr; every report retained `deletionAuthority: false`: dead code 1,561
findings/209 uncertainties with output SHA-256
`eb107cba04779167de1d5dd51d4853ec29f6dc7d033c2092df8a589c0db7de5d`;
dependency 2,864/19 with
`5a4bd9558096d5591631de4b08420265c7944bcf9f57a99da01ea485ca1e7987`;
asset 561/11,314 with
`7602647f66d3fcd49fe5e1c644ec257d3b1348b7d07f10ce0400c9ffa502bd92`;
and environment 587/252 with
`10eb84399aa88deedeae437526ae04151aa23a5a4d808dc0c5142f7606d0b19b`.

The pre-document inventory contained 1,922 files and 47,454,881 Git blob
bytes, with inventory SHA-256
`6f8dc45abda5436f0cb257583800959b55772f2ce35ffa38009b8534debb0541`,
zero forbidden paths, and output SHA-256
`b1fdcd9c5ab13ee2b2a1c4285d440bfbb0b5635a2e77c6c16d8b1933382ac6d3`.
Brand verification was zero missing and zero unclassified with output SHA-256
`50a8f6f48d60f51c00edfd2b0a5005289e007e9939f18862beaa5e83667ecd2b`.
These are pre-document receipts; final self-referential index bytes and identity
remain only in the ignored SDD handoff and user-facing receipt.

Round-15 results above are historical supporting evidence. Hosted checks and
reviews remain pending, merge remains separately authorized, and no candidate
deletion, provider mutation or Phase 5 work occurred.

Hosted review round 17 records two validated CodeRabbit findings on remote
head `012945b`. `SatisfiesExpression` wrappers dropped proven environment and
CommonJS flows, while destructuring assignments sourced from proven
environment objects failed to record their exact extracted top-level keys and
fell back to overbroad whole-object uncertainty.

Environment scope handling now shares `satisfies` transparency across aliases,
direct reads, CommonJS recognition and escape traversal while preserving
shadow and mutation boundaries. A focused environment-pattern helper records
shorthand, renamed and literal-computed top-level keys; keeps nested patterns
limited to their source object's top level; recognizes separately sourced
nested defaults; and retains hash-only uncertainty for dynamic keys, rest
elements and unproven aliases. Computed/default expressions, evaluation order,
target invalidation, privacy, determinism and duplicate suppression remain
preserved. Independent final review also found and repaired a conditional
destructuring-default provenance gap: simple assignment defaults sourced from
proven or unknown environment objects now emit one hash-only unbounded
`assignment-default` uncertainty and keep the target unknown, preserving
shorthand and renamed cases, outer exact-key extraction, subsequent reads,
shadows and invalidation without plaintext or duplicate rows.

Strict TDD recorded `satisfies` RED 0/3 then GREEN 3/3 and assignment-pattern
RED 0/3 then GREEN 3/3. Conditional assignment defaults recorded RED 0/5 then
GREEN 5/5, and the combined assignment tests passed 8/8. The broad slice passed
58/58, final independent review passed, focused repository-audit tests passed
134/134, and the full suite recorded 4,332 total, 4,329 passed, 3
host-dependent skips and zero failures. Typecheck, lint, documentation-state and
diff checks passed. Source caps were environment analyzer 486,
environment-pattern helper 35, environment scope 132 and module evidence 500
nonblank lines.

Pre-document audits ran twice with byte-identical output, exit 0 and empty
stderr; every report retained `deletionAuthority: false`: dead code 1,564
findings/209 uncertainties with output SHA-256
`001c36b186d4021429bb94cb960b387d66cdc94b8757d14052d19147df8b3d5d`;
dependency 2,865/19 with
`87da875dc4bc725aca133f89517ca63361fd32f8b1bc057c5f72cd330a34b7c0`;
asset 561/11,314 with
`24ada69ed439ed7d3b1bf324d6145e73a73227f6df5e3abf7917f35510013202`;
and environment 587/252 with
`5e39857febefb3ba62bdd4ca03f879f8d055093e14e978193cdf42b3595cc026`.

The pre-document-amendment inventory contained 1,923 files and 47,493,216 Git blob
bytes, inventory SHA-256
`c3e05e17b166e8a8e8c69bf57321d27ea99c05a489a5a561bbb730bbfd31aafd`,
zero forbidden paths and output SHA-256
`61060d4d4f24138872daf9dc42935c83afa349bfbd6a0ff72e79dce80046653f`.
Brand verification was zero missing and zero unclassified with output SHA-256
`50a8f6f48d60f51c00edfd2b0a5005289e007e9939f18862beaa5e83667ecd2b`.
Round-16 results are now historical; exact final staged bytes and identity
remain only in the ignored SDD/user-facing receipt.

Four hosted threads remain until the fix is pushed. The latest CodeRabbit
review completed with these two comments; latest-head re-review and checks
remain pending. Merge remains separately authorized, and no candidate deletion,
provider action or Phase 5 work occurred.

Hosted review round 18 records three validated latest-head findings on remote
`01ae7fb`: loader ownership was inferred from bare `require` or `createRequire`
spelling despite lexical shadows; NodeNext explicit `.cjs` and `.mjs`
resolution crossed extension families; and logical `&&=`, `||=` and `??=`
assignments dropped conditional environment provenance. Loader evidence now
requires scope-aware ownership, proves only exact `createRequire(import.meta.url)`
construction, retains hash-only uncertainty for unproven loaders, and covers
mutation and `.resolve` mutation. NodeNext substitution stays within the
`.cts`/`.d.cts` CommonJS or `.mts`/`.d.mts` ESM family without `.ts`/`.tsx`
cross-family fallback. Logical assignments snapshot right-hand provenance after
left-hand evaluation: proven or unknown environment sources emit one hash-only
unbounded operator-specific uncertainty and downgrade simple identifier targets
to unknown; member targets retain uncertainty without local alias rebinding,
while unconditional `=` and assignment-default behavior remain unchanged.

Exhaustive independent staged review found and fixed adjacent scope and
evaluation-order gaps across parameter, switch, enum, loop, pattern, catch,
class, decorator, Annex-B, `with`, optional-call and mutation boundaries,
including `.resolve` mutation behavior. Final independent review passed with 53
accumulated reproductions and 16/16 targeted checks. The earlier 145/145
focused repository-audit result predates these follow-ups and is historical.
The final loader slice passed 28/28 and the environment slice passed 60/60; the
authoritative exact-staged focused repository-audit suite passed 162/162 after
documentation synchronization.
The full suite recorded 4,360 total, 4,357 passed, 3 host-dependent skips and
zero failures. Typecheck, lint and diff checks passed. Source caps were
environment analyzer 496, environment-pattern helper 42, environment scope 132,
module evidence 419, module loader 475 and module resolution 96 nonblank lines.

Pre-document audits ran twice with byte-identical output and exit 0; every
report retained `deletionAuthority: false`: dead code 1,570
findings/211 uncertainties with output SHA-256
`a035d78474f9fcb3ee465cf8e4f289a2112ef2cadcb4d86410faa8503a593cd4`;
dependency 2,868/21 with
`0e2c9ef622745d67b746e8f72ffecf74a48139095db67ddaf67a04f5e6ebeece`;
asset 561/11,314 with
`452217301e254a1ef5ec74abb4021eaddf1c01ade1c382e1ac3619acabdc1a00`;
and environment 587/252 with
`f87cac8099ec64eb613b6215202c5e461476f83164d452baa6fab4624851b91e`.

The pre-document inventory contained 1,925 files and 47,569,581 Git blob bytes,
inventory SHA-256
`c835271d633b07c09a58d6280cf1bfc520864674c7e34a2464f16f68db4d6619`,
output SHA-256
`623f1bc01f36f8fab7f8db1e50b7448995323ef30dab6247a4130df2dfae684e`
and zero forbidden paths. Brand verification was zero missing and zero
unclassified with output SHA-256
`50a8f6f48d60f51c00edfd2b0a5005289e007e9939f18862beaa5e83667ecd2b`.
These pre-document hashes and identities become historical once these versioned
receipts are staged; exact final identity remains only in the ignored SDD
receipt.

Latest-head hosted checks and reviews remain pending. Merge remains separately
authorized, and no candidate deletion, provider action or Phase 5 work occurred.
