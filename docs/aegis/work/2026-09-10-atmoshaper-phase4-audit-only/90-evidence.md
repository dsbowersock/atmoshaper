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
