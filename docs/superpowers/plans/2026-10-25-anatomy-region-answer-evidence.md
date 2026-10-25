# Source-supported region answers

## Problem and boundary

The bundled concept model has no explicit region. All 229 public concept-region
questions nevertheless grade the legacy Spine display/filter fallback as the
answer. A pure audit on clean `58a34e9` reproduced this through the real checker.
The same fallback also affects ten body-surface structures. This source-only
change prevents unsupported grading. It does not complete the
concept-region taxonomy, independent scientific/content review or media gates.

## Implementation

1. Keep all current study cards, IDs, summary/category/name-recall prompts,
   stored region values and legacy filter grouping intact. No new taxonomy,
   unsupported anatomical classification, data seed or migration is introduced.
2. Distinguish explicit recognized source regions from missing/unmapped values.
   Bone landmarks may inherit their existing parent bone's explicit region.
3. Generate a primary-region question only when that explicit mapping exists.
   A display/filter fallback remains compatibility data, never a scored answer.
4. Keep unsupported legacy region-only or pinned selections empty; do not change
   their config or silently substitute a different question. Verify the existing
   no-eligible-prompts UI and recovery to supported questions.

## Validation

- Reproduce the five real systemic-concept failures before the source repair.
- Run focused study, community-config and Anatomime contract tests offline.
- Compare full before/after card and prompt identities/content; all cards and
  non-region prompts remain byte-equivalent. Removed region questions must have
  only missing/unmapped source locations, not a newly assigned location.
- Typecheck, changed-file lint, full cached provider-free build and actual local
  flashcard setup/runner checks at desktop and phone widths.
- Use invented browser-local selections only. No account, database, image
  provider, valid sign-in, email, payment, live game or Sentry request.
- Clean owned browser/server/build copies; preserve the source branch, shared
  dependencies/schema, all prior worktrees and closed provider ledgers.

Publication/review, merge and Production are not authorized by this local repair.
The remaining curated concept-location model and 31-muscle/citation work stay
visible. An eligibility safeguard does not clear full anatomy acceptance.
