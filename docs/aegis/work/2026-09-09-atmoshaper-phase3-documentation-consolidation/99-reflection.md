# Phase 3 process reflection

Status: complete local closeout; publication remains separately authorized.

- Exact file ownership keeps documentation consolidation reviewable across tasks.
- Occurrence baselines require comparing identity and category separately; line
  movement can replace an identity without changing its meaning.
- Drafting token-free verification records before baseline generation prevents
  receipt updates from creating additional audit occurrences.
- When an audit includes its own generated JSON, repeat deterministic generation
  until the output is byte-identical; review any self-reference line shifts without
  changing classification policy.
- A successful audit process exit alone does not prove removed occurrences were
  reconciled; inspect both missing and unclassified arrays explicitly.
- Inventory describes staged blobs. Final receipts must distinguish staged-candidate
  measurements from exact-final-HEAD readbacks, especially when the receipt itself is
  included in the inventory.
- A no-index diff of a new file can exit 1 with no whitespace errors. Check its
  diagnostic output and expected status together.

Final review lessons: synchronize every current-status owner together, then request a
whole-branch re-review; otherwise individually correct documents can still disagree as
a set. Residual limitation: the branch is complete only locally until publication is
separately authorized, and hosted checks cannot cover an unpublished head.
