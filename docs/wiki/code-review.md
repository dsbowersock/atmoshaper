# Code review before publication

Codex and CodeRabbit provide separate review perspectives. Require substantive
review of the application source being shipped, then ordinary tests and release
verification. A green CI run or a skipped CodeRabbit check does not establish
that second review.

## Ordinary pull requests

1. Identify the current PR head and changes. Read the actual review receipt,
   reviewed commit range, selected paths and any unavailable files.
2. If CodeRabbit skips automatic review, explicitly request `@coderabbitai review`
   through its existing GitHub app. Do not interpret the skipped check as approval.
   The owner has requested this review workflow; requesting a review does not
   authorize CodeRabbit Autofix or provider changes.
3. Check that the completed receipt covers the current source files. An old review
   may support unchanged Git blobs, but it does not cover later edits. Keep missing
   or partially processed files as gaps. Preserve the actual receipt and source
   identity in the release evidence.
   A zero-issue review can finish by updating the bot's walkthrough comment rather
   than creating a PR review submission. Accept its explicit completed outcome,
   range and file list, supported by the finished acknowledgement or exact-head
   reviewed-coverage metadata. Do not count in-progress or rate-limited comments
   merely because they already contain a selected-file list. When comparing
   receipts, any completed exact Git-blob match supports that file version; a
   newer comment about an older version does not revoke that coverage.
4. Consolidate Codex and CodeRabbit issues. Verify each against current behavior,
   fix supported problems with focused tests, and record why others are deferred.
5. Obtain one bounded correction follow-up and current-head CI before merge.
   Report a new serious blocker explicitly; retain unrelated or speculative
   suggestions in a backlog. Avoid an automatic review/rewrite loop.

CodeRabbit's [official manual-review guidance](https://kb.coderabbit.ai/articles/8856795235-how-do-i-activate-coderabbit-pro-for-my-open-source-project)
explains why a public repository with fewer than ten stars can require manual
triggering. This was the observed skip reason on recent AtmoShaper PRs. No billing
upgrade or settings change is needed merely to request that existing app's review.

## Retrospective batches and CLI

Use the existing Ubuntu CLI through WSL; a Windows linked-worktree Git pointer
requires an isolated Linux clone. Confirm authentication and use the relevant
`AGENTS.md` as review context. A saved login may still return
`reauthentication_required` when the service starts a review. That is an unfinished
review, not a successful zero-issue result. Complete private authentication before
retrying; never reuse an expired callback or ask for tokens in chat.

The [bounded coverage campaign](../superpowers/plans/2026-11-21-bounded-coderabbit-coverage.md)
freezes the shipped source, identifies missing reviewed versions, and prepares
five exact-diff cohorts. Keep review-only commits local and never deploy them.
Verify completion and actual reviewed paths against each manifest. Keep inherited
baseline code separate from later shipped changes, and distinguish coverage from
a guarantee that the code contains no bugs. Quota or authentication problems must
remain visible; they do not authorize paid credits or a new key.

Review approval is one release gate. It does not itself authorize publication,
database/provider changes, live email or payment activity.
