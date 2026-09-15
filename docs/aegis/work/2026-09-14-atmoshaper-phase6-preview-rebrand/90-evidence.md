# Phase 6 preview rebrand evidence

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
