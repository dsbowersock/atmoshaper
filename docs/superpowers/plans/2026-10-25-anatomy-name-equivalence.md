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
