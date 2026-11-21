# Bounded CodeRabbit coverage audit

Amendment: the actual 37-file correction review identifies an audit range-proof
defect. Matching head blobs cannot prove review of earlier changes already in
their base. The first five receipts remain valid for their recorded ranges;
the [finite range-proof correction](2026-11-21-coderabbit-range-proof.md) supersedes
the old completeness implication and freezes 60 wider ranges plus one final
correction-delta review. It preserves the no-paid-credit/no-automatic-loop boundary.

The owner requests the second CodeRabbit perspective on shipped changes that
missed it, without reopening old PRs or creating an endless review/rewrite loop.
This campaign is isolated from the now-completed sidebar/Calendar publication.

## Frozen evidence and scope

The shipped snapshot is `d7e30e022d825d9f26ed37bd6636f11bae1e8314`. Inventory all
76 merged AtmoShaper PRs reachable from it using actual review submissions and
issue-comment receipts. Count only the known CodeRabbit author, substantive
commit ranges, selected paths and available Git objects. A skipped check, bot
presence or a review of a different file version does not establish coverage.
Retain unavailable/partially processed files as gaps, not successful reviews.

The refreshed inventory finds 163 distinct completed file-selection receipts and
537 current application/configuration/test file versions matching reviewed Git
blobs. Another 166 such paths have missing or stale source coverage: 109 runtime/
configuration paths and 57 tests. The receipt parser accepts both historical
parenthesized counts and newer colon/HTML forms. Every parsed count agrees with
its selected-path list. These counts describe coverage, not a bug-free guarantee.

The 1,021 code/test paths inherited from the MassageLab export and untouched by
AtmoShaper PR diffs are recorded separately. This targeted campaign addresses the
owner's minimum requested scope: later shipped AtmoShaper changes missing the
second review. It does not claim a new whole-file review of that imported baseline.

## One initial pass over five fixed cohorts

| Cohort | Paths |
| --- | ---: |
| Accounts, Calendar and payments | 18 |
| Wellness and body tools | 48 |
| Business Planner | 25 |
| Operations and shared UI, first group | 70 |
| Operations and shared UI, second group | 5 |

The ignored `output/coderabbit-coverage/batches.json` records every path, current
blob and last supported baseline. Each path appears once, and each cohort stays
below the known 100-file review boundary. Keep all current application context
available while presenting only the selected missing changes to CodeRabbit. A
review-only synthetic base may limit the diff, but its reviewed head tree must
exactly equal the frozen shipped tree. Never deploy these review-only commits.

The five snapshots are prepared in local `refs/codex/review-only/2026-11-21/`
refs. Their heads all have the exact shipped tree; the changed-path set matches
each cohort. The normal index and application branches are preserved.

Verify the CLI's completion record and actual reviewed-file list against the
manifest. Do not count errors, rejected runs, missing paths or partial processing
as coverage. Reuse the existing account and included allowance. No plan upgrade,
new API key, paid credit activation or provider setting is authorized here.

## Triage and one correction follow-up

After the five first passes, consolidate and deduplicate findings. For each issue,
record current-code evidence, impact and disposition. Fix supported functional,
privacy/security and reliability issues with focused tests on new branches/PRs;
retain old PRs as history. Defer speculative cleanup and style-only rewrites.
Do not make provider, database, payment, live email, NAS or deployment changes
merely because a reviewer suggests them.

Run one follow-up review of the chosen correction delta, supported by relevant
tests and ordinary Codex/CI gates. Keep further out-of-scope findings in a finite
backlog instead of re-reviewing/re-writing the entire app. A new serious blocker
must be reported explicitly, not silently passed or allowed to expand the loop.
The resulting application changes need their concrete release decision; this
audit itself changes no live service.

## Current prerequisite

PR #77 is independently reviewed and published as `d7e30e0`, with an identical
reviewed `61a7c6a` tree. Its actual GitHub-app correction pass covers 15 files and
raises zero issues; all 35 current changed code/configuration/test blobs have
completed coverage. All seven source/merged CI checks and live release gates pass.
The prepublication inventory is archived and refreshed before the first
retrospective pass. Explicit completion evidence excludes in-progress/rejected
file lists, and any exact matching review remains valid despite later comments
about old versions. The current five heads must exactly match the new frozen tree.

Fresh private CLI authentication now succeeds. All five passes complete with
exact 18/48/25/70/5-file lists and 3/25/4/14/0 issues. Actual receipts verify all
166 paths once each. All 46 observations are triaged; local corrections and one
follow-up review remain. The observed included limit is three reviews per rolling
hour; the last two passes waited for its reopening. No paid credits are enabled. See the
[receipt/disposition record](../../audits/2026-11-21-coderabbit-retrospective-results.md).
The older `reauthentication_required` attempt and expired callback are historical
failures, not completed reviews; the successful fresh session supersedes them.
