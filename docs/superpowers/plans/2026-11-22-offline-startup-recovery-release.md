# Reviewed recovery corrections for the existing release PR

Status: prepared locally, not authorized for push/publication. November 22, 2026.

Frozen application candidate: `15b7f55`, plus receipt-only closeout. The complete
30-path correction review finishes with two test-switch questions, refuted by
source and actual serial execution. Local browser, unit/regression, source lint,
full TypeScript and matching normal APK lint/build/signature/emulator acceptance
pass; see the grouped receipt. This is the concrete source amendment presented
for owner review, not permission to replace the existing signing authority.

The original activation and one replacement-key recovery are approved. The three
Production-only settings are successfully configured, with the original 87
metadata entries unchanged. PR #80 is open at `5f76890`; its protected Preview is
READY. The current public release/rollback remains `0eb02e0`.

Hosted Codex review identifies a confirmed overwrite after an initial Core
storage read fails and a later autosave succeeds. The
[local correction receipt](../../audits/2026-11-22-offline-startup-recovery.md)
records a failing-before/passing-after real IndexedDB reproduction. The focused
change keeps fallback sessions unsaved until reopening successfully loads the
existing record. It also makes the saved-timer wording truthful.

The completed hosted CodeRabbit pass reports 21 comments, including the same
startup overwrite and a station Transport-event leak. Consolidate these in one
bounded correction group: scoped station scheduling/cleanup, startup-failure
cleanup, storage reopening, truthful download readiness/cancellation, runtime
retry and stop/volume controls, retryable receipt removal, consistent timer
limits, missing merchant-readiness evidence, Android connection/build-proof
cleanup, serial emulator acceptance and stale documentation/test synchronization.
The [grouped disposition receipt](../../audits/2026-11-22-offline-hosted-review-corrections.md)
identifies each comment and its validation. This does not activate practice
payments or change entitlement, clinical, account, billing or provider policy.

## Prepared publication amendment

1. Identify the completed local corrections' source/tree, actual focused checks
   and bounded Codex/CodeRabbit delta review. Consolidate any supported remaining
   hosted issues before freezing the candidate. Do not treat CI on `5f76890` as
   validation of the unpushed correction.
2. With owner approval and fresh source/provider/rollback preflight, open a new
   120-minute admission. Permit one additional push to the existing PR #80, its
   protected Preview and current-head hosted checks/reviews. Necessary test and
   receipt/documentation corrections within this recovery scope are included;
   do not broaden beyond this enumerated correction group or start an automatic
   rewrite loop. Request the existing hosted Codex correction review and one
   bounded CodeRabbit follow-up; a quota/authentication blocker stays explicit.
3. Once substantive reviews and required checks pass, complete the already
   approved one merge, one Production build with existing Sentry maps/settings,
   staged acceptance and promotion of that same verified artifact. Retain the
   current release for one rollback. Build/verify the corrected matching APK and
   finish the one owner backgrounds-only receipt check in the task emulator.
4. Preserve the successful signing authority and all 90 setting metadata entries.
   No additional key, secret replacement, settings change, payment/email,
   Calendar/clinical/account-preference write or native store enrollment is
   included. Physical S24, reliable background audio/closed-app alarms and the
   documented older-preview migration retry edge remain separate gates.

This is a changed application candidate beyond the public-key-only amendment.
The original approval explicitly excludes further application-logic changes;
source preparation is complete/reviewable before requesting this amendment.
