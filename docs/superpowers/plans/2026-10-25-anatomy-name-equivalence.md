# Preserve lookup labels without grading broader categories as equivalent names

## Problem and source evidence

The actual bundled blood structure has fluid connective tissue as a clinical term,
and colon has large bowel as a common term. The study adapter currently copies
those terms into public aliases and accepted name answers. The [pinned 4.3 text](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46049/index.cnxml)
identifies both blood and lymph as fluid connective tissues. The [pinned 23.5 text](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46512/index.cnxml)
distinguishes the cecum, colon and rectum within the large intestine. Broader class
and whole-organ labels do not uniquely identify those narrower entities.

## Compatible correction

Use a focused, entity-specific name-equivalence helper when projecting public
aliases. Keep all existing seed terms and their IDs, source/citation rows, legacy
lookup behavior, card/question IDs, counts, saved selections and source license
flags. Do not change summaries or invent new anatomy. The helper excludes only
the two reviewed broader phrases from public aliases and derived name answers;
it is not a global terminology blacklist. Other valid aliases remain accepted.

## Verification and completion

1. Real bundled-card regressions must fail before the helper is connected.
2. Verify correct names/other aliases and raw/legacy lookup still work.
3. Compare every actual card and prompt before/after: only the two intended
   alias projections and their derived name answers may differ; coverage and
   every other field must remain unchanged.
4. Run named focused contracts, typecheck and lint with cached dependencies,
   network/process denial and no hosted adapter/provider/credential access.
5. Verify the local production build and remove only owned temporary build and
   dependency links. Retain source evidence; do not publish or change Production.

This fixes a concrete grading defect, not the remaining seven summary-source
gaps or full scientific/commercial acceptance. The $15 media proposal is declined;
the $0 remote hold remains. No old provider/test grant is reopened.

## Executed result

Application source `d70f7dc` passes all 48 focused tests, typecheck, changed-file
lint and the actual retained-edition audit. The corrected original-source run
fails exactly the two intended grading cases. The first test run's incorrect
legacy-lookup assertion is retained with a method-error disposition; large bowel
already selected the large intestine before this change. The sandbox compiler-
cache write failure is also retained separately from the successful rerun.

All 1,271 actual cards and 5,578 prompts preserve coverage, IDs and order. Only
two card alias sets, eight prompt alias lists and two name-answer sets change;
every other field is byte-equivalent. The original seed/term/citation IDs and
all summaries stay intact. Real equivalent names and raw/legacy lookup pass.

The exact-commit cached webpack build succeeds with six denial receipts and zero
network/executable attempts. The build uses the local Inter fixture, preserves
the real selected clock font, skips provider prebuild/Prisma generation and never
starts a browser or server. All 67 build-source pins match. Owned snapshot/archive,
two dependency junctions and the newly created compiler cache are removed. Shared
dependencies/schema and unrelated worktrees remain intact. No provider/DB/credential,
publication or Production action occurred. This is local library/build evidence;
it does not close whole-site browser, content, licensing or launch acceptance.
