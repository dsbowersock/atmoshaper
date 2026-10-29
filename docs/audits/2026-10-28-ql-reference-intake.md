# Quadratus-lumborum reference intake

This local slice registers one precise article-text bibliography record and one
pending exact-action citation in the existing catalog schema. It does not review
the complete action or change study eligibility. Baseline: `07de2cc`.

The publisher identifies the article as first online July 29, 2017, with the
January 2018 issue citation, *Surgical and Radiologic Anatomy* 40:91-98. Its
Rights and permissions paragraph states CC BY 4.0. All seven authors, DOI,
license link and the scope of the product paraphrase are recorded in the source.
No source prose, figure, table, supplement or third-party component is imported.

The Introduction supplies lumbar-stabilization background and pelvic support
during gait weight transfer with gluteus medius. The Discussion explicitly adds
rib-XII stabilization (PDF physical page 5, extracted lines 289-290). These are
background teaching statements, separate from the 58-specimen fetal measurements.
All three functions therefore have explicit narrative locators in this article.
The full unchanged action remains pending because this intake does not execute
the exact-action source binding, not because rib corroboration is missing or a
new experiment is required. Separately consulted references do not inherit this
article license.

The first draft incorrectly claimed the article lacked rib-fixation support.
That overbroad conclusion came from reading the selected Introduction passage
as article-wide coverage. Independent SPEC found the explicit Discussion text;
the root then confirmed it in both publisher HTML and the retained-copy PDF.
The initial frozen candidate/finding remain retained; this correction supersedes
that source-coverage claim.

The citation uses the existing `action` fact kind, exact action ID and
`needs_review` status. The action retains its previous source pointer. No
summary citation, action metadata, gate or media record changes. Existing
review-status and same-source checks remain the operative barriers. The generic
source scope does not mechanically enforce the descriptive component exclusions;
future media admission still needs its own review.

Change necessity: the existing review workflow needs the checked bibliography
and exact partial-support note, rather than a disconnected research report.
The minimum change is metadata in the two existing seed owners; no new helper,
framework, source-admission rule or schema is added. Architecture review is not
required. TDD is skipped for this reversible declarative intake; verification
uses the existing source suites and a full public-output comparison.

All 184 existing source tests pass, with scoped seed/test lint and no-emit
typecheck. The first suite run reported 183 passes and one pending-count
assertion: the intended new citation increased that count by one. The existing
expectation now checks the new pending identity/kind/status/source mismatch
separately, preserving the original 30-record remainder and 28 legacy groups.
No new test case, runtime guard or weaker inventory assertion was introduced.

Fresh tracked-source baseline/candidate compilation and actual study/grader
projection compare all 1,271 cards, 5,611 prompts and 10,553 accepted-answer
observations byte-for-byte equal. Source records increase 28 to 29 and citations
26,576 to 26,577; all other seed records are identical. All 34 held action IDs
remain held and foundation validation reports no issues. The local guard
records zero network, worker or unauthorized executable attempts. A snapshot
helper syntax failure before execution and a terminal encoding failure after
receipts were saved remain recorded; neither is an application failure.

Independent review and root verification receipts accompany the local candidate.
No application build, server,
browser, Docker, database, credential, authenticated provider, publication or
Production action is included. The full migration remains incomplete.

Evidence: [exact source and clause record](../source-evidence/quadratus-lumborum-grzonkowska-reference-intake-20261028.json).
Publisher: [DOI article](https://link.springer.com/article/10.1007/s00276-017-1901-4);
[article PDF](https://d-nb.info/114134209X/34), physical pages 1 and 7.
