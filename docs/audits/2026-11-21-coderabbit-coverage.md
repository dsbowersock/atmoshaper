# CodeRabbit coverage inventory

Status: fresh authentication succeeds; three initial review passes cover 136
of 166 frozen paths. Two await included allowance. See the
[actual receipts and triage](2026-11-21-coderabbit-retrospective-results.md).
The table below preserves the historical pre-review inventory, not the current
retrospective completion count. No publication occurs in this campaign.

The owner requests actual CodeRabbit coverage alongside Codex and a bounded
retrospective pass. Source is frozen at public `d7e30e0`. All 76 merged PRs are
inventoried from primary GitHub metadata. Historic comments/submissions provide
163 distinct completed CodeRabbit file-selection receipts. Selected file counts,
unavailable paths, commit identities and exact Git blobs are checked. Final
classification includes extensionless Docker/build inputs and repository audit
policy. Generated baselines remain outside executable source. Receipt admission
requires an actual submission or an explicit completed zero-issue/reviewed-head
outcome, not just a selected-file table. Any exact current-blob review counts;
newer comments about old versions cannot revoke it. The retained preliminary
`0976d7d` inventory is superseded before any retrospective pass runs.

| Application, configuration and test paths changed in AtmoShaper PRs | Count |
| --- | ---: |
| Current versions matching known reviewed file blobs | 537 |
| Current versions with missing/stale coverage evidence | 166 |
| Runtime/configuration portion of those gaps | 109 |
| Test portion of those gaps | 57 |

PRs #69–#76 have no substantive parsed CodeRabbit file-selection receipt. Earlier
PRs do have substantive reviews; a few later edits and missing records also remain
in the path manifest. PR #1 is a bootstrap verification receipt, not an independent
review of all source imported from MassageLab. The separate inherited baseline
contains 1,021 code/test paths untouched by AtmoShaper PR diffs; no new whole-file
CodeRabbit coverage is claimed for those paths here.

Five local review-only snapshots have been prepared and verified against the
shipped Git tree. Each diff matches its cohort exactly; no review-only ref is
pushed or deployable through the release plan. `npm run
review:coderabbit-prepare-batches` reproduces their local preparation. Focused
ESLint and whitespace checks pass.

The fixed cohorts contain 18, 48, 25, 70 and 5 paths. There are no duplicate or
omitted paths relative to the gap manifest. Generated data, binary assets and prose
history are classified separately; no application or provider setting is changed.
See the [bounded campaign](../superpowers/plans/2026-11-21-bounded-coderabbit-coverage.md)
for scope, evidence rules and the one-follow-up limit.

The inventory can be reproduced with `npm run review:coderabbit-coverage` from
the retained primary-source snapshots in ignored `output/coderabbit-coverage/`.
That command reads Git objects and local review metadata only; it does not call
providers, run reviews, mutate source or publish branches.

The separate sidebar/Calendar publication is complete as `d7e30e0`. CodeRabbit's
initial CLI pass covers 40 files and identifies four issues; the GitHub app's
substantive 40-file pass at `610c1ff` identifies four more. Codex also identifies
practice-switch date loss. All supported corrections pass focused regressions.
The final 15-file CodeRabbit follow-up at `61a7c6a` completes with zero issues,
and all 35 current changed code/configuration/test blobs match completed receipts.
All seven source/merged CI checks, staged Sentry/PDF gates and public acceptance
pass. No rejected or skipped attempt is counted. Fresh CLI authentication now
succeeds; remaining completion and correction-review gates are recorded in the
linked retrospective results. An expired login URL cannot be reused.
