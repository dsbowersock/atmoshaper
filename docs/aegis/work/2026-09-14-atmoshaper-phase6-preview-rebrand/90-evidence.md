# Phase 6 preview rebrand evidence

## Task 10 visual-baseline and QA closeout - 2026-09-19

This section owns local Task 10 evidence; [hosted review](../../../project-log.md#phase-6-publication-and-initial-hosted-review) is current delivery evidence. Earlier dated entries and next actions are
historical. Browser QA exercised clean source
`c25d0daf13bbec3eeabc740a0bf0008afce83015` on
`codex/atmoshaper-phase6-preview-rebrand`; final receipts, their date contract and
accepted image additions are not represented as a new application build.

| Gate | Observed result |
| --- | --- |
| Resource authority | Exactly one newly authorized independent empty QA project; the same project was retained through bounded repairs. No production-data access. |
| Database preflight | Exact committed set of 46 successful migrations; all 134 application tables empty. Native exports applied no additional migration. |
| Windows build | Exit 0; 115/115 static pages, 80 seconds, immediately before the accepted attempt-6 cycle. |
| Windows capture and visual review | 18/18 passed, zero skips/failures/retries; 14 candidates. All originals were directly inspected; final capture was accepted by exact filename/size/SHA-256 identity to those reviewed originals. |
| Windows comparison | 18/18 passed, zero skips/failures/retries. No update flag was supplied (Playwright default missing); immediate before/after checks proved the exact 14 files unchanged, with no missing or added file. This was not an explicit-none invocation. |
| Ordinary lane 1 | Exit 0: 137 passed, 7 declared skips, zero failures/retries; 638 seconds. |
| Ordinary lane 2 | Exit 0: 184 passed, 34 declared skips, zero failures/retries; 673 seconds. |
| Ordinary lane 3 | Exit 0: 178 passed, 34 declared skips, zero failures/retries; 770 seconds. |
| Ordinary lane 4 | Exit 0: 149 passed, 51 declared skips, zero failures/retries; 725 seconds. |
| Native Linux source/build | Exact Git export of all 1,970 tracked files; native dependencies/client generation; 115/115-page build passed in 65 seconds. Same QA project, no new migration. |
| Native Linux capture/review | 18/18 passed, zero skips/failures/retries; all 14 Linux originals directly inspected before approval. |
| Native Linux comparison | Explicit `--update-snapshots=none`: 18/18 passed, zero skips/failures/retries, 60 seconds. Accepted image names/bytes unchanged before copy into the source checkout. |
| Accepted inventory | 28 new PNGs: seven exact assertion names across desktop/mobile and Windows/Linux. Historical parity spec and all 24 existing PNGs unchanged from the Phase 5 merge. |
| Final database and provider cleanup | All 134 application tables empty immediately before deletion; cycle-owned project deleted and freshly proved absent. Pre-existing production project still present with unchanged stable metadata; no production rows read. |
| Local cleanup | Owned servers/browsers/private holders exited; listeners clear; both owned native exports removed; original test-run metadata restored. |
| Full provider-free unit suite | Exit 0 after provider cleanup and receipt/date changes: 4,769 total, 4,766 passed, three documented skips, zero failures; 368 suites, 518.419523 seconds. This exercised the staged receipt candidate before final result-only prose, not a later application build. |
| Focused checks, typecheck and lint | Focused source/harness/date coverage passed 599/599, no skips/failures. Typecheck passed. Full lint passed with zero errors and seven warnings confined to ignored QA scripts. Final result-only receipt text receives fresh focused/diff/audit readback. |
| Final staged audits and diff | Ordinary inventory: 1,998 files, no forbidden paths. Brand: missing=[] and unclassified=[], public-copy zero; compatibility 23,679, historical 1,675, legal 35. Policy/baseline unchanged. Exact final staged hashes/bytes and clean diff result are retained in the coordinator handoff after receipt synchronization. |
| Independent review | Specification review APPROVED, then independent quality review APPROVED, no findings. Final result-only receipt delta is re-read in that order before commit; reviews do not grant publication or merge authority. |
| Local commit | Containing coordinator commit: `test: record phase 6 visual baseline`. Exact SHA, committed paths and post-commit cleanliness are retained in the local handoff; no push or PR authorized. |

The four lanes total 648 passed, 126 declared skips and zero failures. None skipped
because a database was unavailable. Lane 1 skips six mobile-owned route copies and
one separate public-pause variant; lane 2 skips 30 mobile-owned App Shell cases,
three desktop-owned routes and one public-pause exclusion. All 34 lane-3 device
skips have exact passing complementary-project cases. Lane 4 has 30 such device
skips with passing counterparts plus 21 development-only exclusions against the
production build (20 control-review cases and one real-Popover fixture).

The full unit suite's three skips are two file-symlink cases unavailable on this
Windows host (`EPERM`) and one credential-free catalog dry run whose optional
ignored catalog is absent. No assertion was relaxed to obtain the green result.

Closeout judgment: the approved preview boundary is aligned. Actual owner and
readiness contracts were checked without treating test accommodation as a repair
of the two inherited product limitations below. Final receipt work introduces no
runtime owner, fallback or architectural decision; the only test edit advances
the still-enforced verification-date ceiling alongside real evidence. Evidence
confidence is B for this local slice, with hosted integration and the open
product follow-ups explicitly uncovered. The next valuable external verification
is exact-head PR CI/review, only after separate publication authorization.

### Environment incident and containment

The first native build compiled but its TypeScript worker exhausted the default
heap. The operating system generated a potentially secret-bearing crash dump;
metadata established task ownership, and the exact file was permanently removed
without reading, copying or hashing its contents. Its absence was independently
verified. The failed native workspace and private holder were also removed.
A credential-free abort probe verified inherited process-local dump prevention;
the successful retry used a build-only 4 GB heap. Subsequent dump inventories
remained empty. This is not a claim that the entire lifecycle was memory-only.
The temporary credentials were invalidated by deleting the project; production
credentials and data were never supplied to the QA runners.

### Boundaries and open follow-ups

- The approved full-text / temporary-mark / hidden-link responsive behavior uses
  the existing asset seam; final supplied artwork retires the stand-in without
  redesign. No final logo is implied by these accepted baselines.
- Pre-hydration current-password input can be lost during later form interaction;
  an arbitrarily early Stations-to-Atmosphere switch can retain an intermediate
  layout scale. These inherited product follow-ups remain open. Test readiness
  repairs do not fix or accept them, nor establish them as rebrand regressions.
- Evidence confidence is bounded to this local preview and the stated gates.
  No push, PR, merge, deployment, domain cutover or production-data change occurred.
  The next external step requires separate publication authorization.
- Detailed sanitized receipts, exact image manifests, cleanup proofs and failed-run
  history are retained in the ignored Task 10 QA evidence directory. Final staged
  identities and the containing local commit belong in the coordinator handoff,
  not recursively inside this tracked evidence record.

## 2026-09-15 — Task 9 local command-gate closeout

- Start state: clean `codex/atmoshaper-phase6-preview-rebrand` at
  `fb134e0c95d9a4d9ea2b4a786f517c2f5718289a`, tracking `origin/main` at
  `+29/-0`, with one worktree, empty index/worktree, and no active Git
  operation.
- Phase 5 authority: PR #4 merged as
  `cdfa99e49cebf100fac1a5080d60514806eb17db`. Phase 6 local implementation
  commits run from `b300382b8d4e14c858cc20a818649351ad996e48` through reviewed
  repair head `75e2741aa3ea5d2cb24fef62fdefb1b5564d4bfe`; planning and
  evidence commits remain in the same branch history. Commit `45947d7` owns the
  exact `Drone` title, stable artwork compatibility, and exact Browser selectors;
  commit `8645f26` owns the dependent test-contract repairs; commit `75e2741`
  makes five actual public-audio literals delegate to unchanged
  `ATMOSPHERE_PUBLIC_LABELS.name`.
- Owner result: current product presentation delegates to the AtmoShaper owner;
  the audio feature delegates exact `Atmosphere` and `Atmosphere mixer` labels;
  missing approved brand assets render accessible text. The proof station is
  titled `Drone`, keeps artist `AtmoShaper` and stable ID `mlab-proof-drone`, and
  preserves its reviewed artwork bytes/revision. Current general legal documents
  are `2026-09-legal-v3`, the digital-purchase policy is
  `2026-09-digital-purchases-v3`, and exact v2 archives plus acceptance history
  remain preserved.
- First fixed-point receipt: schema `1`, source
  `e74045c2fc85c2cb4df176fdb1aff2137c4d9848`, 25,383 entries across 528
  paths, 67 added and 67 removed occurrences with no path-set drift. Categories
  are 23,675 compatibility, 1,673 historical, 35 legal, and zero
  pre-rebrand-public-copy; missing and unclassified are both zero. The live and
  candidate SHA-256 is
  `a23537616cd2308a0e62029155d5d3e1e3b0fc62f2d079688ea6ad5d1ad8d748`;
  the candidate and staged Git blob are both
  `b639b9b1e9b5c236ccb6b93cb7b4c5c3adee5a80`.
- Temporary cleanup: the coordinator confirmed
  `C:\Users\derri\AppData\Local\Temp\atmoshaper-phase6-task9-01a09b4e` was
  the exact expected directory under `[IO.Path]::GetTempPath()` and contained
  only Task 9 candidates, indexes, and logs. The directory was permanently
  removed and its absence proved. The coordinator continues to own the real Git
  index and commit.
- Completed local command verification: focused closeout tests passed 332/332;
  inventory passed with 1,970 files, 48,331,625 bytes, SHA-256
  `0a418f314de41b98e85c1d30ef02f779ec454ad5a6bab70179aeba6bb244f049`,
  and no forbidden paths; brand audit passed with zero missing/unclassified;
  Prisma validate and generate passed; typecheck and lint passed; the full suite
  passed with 4,600 total, 4,597 passed, zero failed, and three documented
  skips. The production build passed with 115/115 generated static pages and
  the full route table; the production migration gate correctly skipped outside
  Vercel Production. Diff hygiene passed before these final receipt-only edits.
- Final receipt-only fixed point: schema `1`, source
  `e74045c2fc85c2cb4df176fdb1aff2137c4d9848`, 25,383 entries across 528
  paths, category totals of 23,675 compatibility, 1,673 historical, 35 legal,
  and zero pre-rebrand-public-copy, zero missing/unclassified, and no path
  drift. Candidate, live, and staged bytes were identical.
- Systemic owner-repair verification: TDD RED was 16 total with 11 passing and
  five expected failures; GREEN passed 16/16; focused five-suite verification
  passed 45/45; typecheck and diff check passed. Independent repair
  specification review APPROVED. The original complete-branch quality reviewer
  re-reviewed and APPROVED, confirming no runtime cycle or scope regression.
- Remaining local closeout: let the coordinator commit the reviewed Task 9
  files.
- External boundary: no disposable QA resource, Browser-QA run, provider or
  deployment change, domain/DNS action, production-data access, push, Phase 6
  PR, merge, or final-logo integration occurred.

## 2026-09-14 — Clean pre-implementation baseline

- Planning commit:
  `b3a3a91289a329729f809f78ff00fcb001014779`.
- Task start: `HEAD` was the planning commit; its parent was approved-design
  commit `1c3683c31dcb8624a61d749fbcacddd85973dbe2`; tracked `origin/main` was exact
  Phase 5 merge `cdfa99e49cebf100fac1a5080d60514806eb17db`.
- Worktree state: clean; one AtmoShaper worktree on
  `codex/atmoshaper-phase6-preview-rebrand`; no merge, rebase, cherry-pick,
  revert, or bisect operation was active.
- Retained local branches:
  `codex/atmoshaper-dead-code-audit`,
  `codex/atmoshaper-docs-consolidation`,
  `codex/atmoshaper-phase6-preview-rebrand`,
  `codex/atmoshaper-public-product-identity`,
  `codex/bootstrap-atmoshaper`, and `main`.
- `npm run repository:inventory`: passed with 1,959 tracked files,
  48,396,501 Git blob bytes, inventory SHA-256
  `11c75e2d168f549bdf95f417191fa4f434514eafc1749236a1ecf348826d2960`,
  and zero forbidden tracked paths.
- `npm run brand:audit`: passed with 26,462 entries: 22,909 compatibility,
  1,563 historical, 42 legal, and 1,948 pre-rebrand public-copy; missing and
  unclassified were both zero. The public-copy count is the deliberate
  pre-implementation queue, not a completion claim.
- `npm run build`: passed on Next.js 16.2.12. The production-migration gate
  correctly skipped outside Vercel Production; Prisma Client generation,
  optimized compilation, post-compile work, TypeScript, page-data collection,
  115/115 static pages, and the 146-route final table completed with exit zero.
- Build observation: the existing non-fatal Anatomime poll-shedder
  initialization message appeared during page-data collection. The build
  continued normally.
- Post-build state: clean tracked worktree and empty `git diff --check` output.
- Measurement boundary: file bytes, counts, and route totals are observations,
  not performance improvements. No tracked runtime source, test, legal, asset,
  provider, database, production, or hosted state changed during baseline
  capture. The build updated only ignored generated/dependency output such as
  Prisma Client and `.next`.

## 2026-09-15 — Task 6 exact pre-rebrand legal archive

- Task start: clean `codex/atmoshaper-phase6-preview-rebrand` at
  `f43e8f8554d6e97efb5df816bdde0027575a6484`, with an empty index and no
  working-tree edit to `lib/legal-documents.js`.
- Exact archives:
  `data/legal-document-history/2026-06-legal-v2.json` has SHA-256
  `8c7263b53697495f096f479484b6ccd7eae574f20111ecf0e0a44f7fd50017aa`;
  `data/legal-document-history/2026-07-digital-purchases-v2.json` has
  SHA-256
  `bdb76adf941e4e22022765734650d7e1224486d282d8303fa5869ee4fc25a4c8`.
- Equality: deterministic archive validation proved six
  `2026-06-legal-v2` documents plus the one
  `2026-07-digital-purchases-v2` document byte-for-byte equal to the
  still-current v2 runtime exports, with unique `key:version` identities.
  Two consecutive archive generations produced the same bytes and hashes.
- Validation: the pre-generation archive suite passed 4/4; the final archive,
  legal-registry, and repository-audit suite passed 35/35; lint, typecheck, and
  `git diff --check` passed. Failure/race coverage proves atomic no-replace
  publication, differing-overwrite refusal, and task-owned temporary cleanup.
- Boundaries: `lib/legal-documents.js` remained exact at Git blob
  `5e946a793f155b89454d34238d2463b66b074d5a`; `package-lock.json` remained
  unchanged. No acceptance row, environment, credential, user data, provider,
  database, network, production, or hosted state was read or mutated.
