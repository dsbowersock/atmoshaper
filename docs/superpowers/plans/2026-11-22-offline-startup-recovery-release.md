# Corrected startup-recovery candidate for the existing release PR

Status: prepared locally, not authorized for push/publication. November 22, 2026.

The original activation and one replacement-key recovery are approved. The three
Production-only settings are successfully configured, with the original 87
metadata entries unchanged. PR #80 is open at `5f76890`; its protected Preview is
READY. The current public release/rollback remains `0eb02e0`.

Hosted Codex review identifies a confirmed overwrite after an initial Core
storage read fails and a later autosave succeeds. The
[local correction receipt](../../audits/2026-11-22-offline-startup-recovery.md)
records a failing-before/passing-after real IndexedDB reproduction. The focused
change keeps fallback sessions unsaved until reopening successfully loads the
existing record. It also makes the saved-timer wording truthful. No account,
clinical, audio-engine, entitlement or payment rule changes are proposed.

## Prepared publication amendment

1. Identify the completed local correction's source/tree, actual focused checks
   and bounded Codex/CodeRabbit delta review. Consolidate any supported remaining
   hosted issues before freezing the candidate. Do not treat CI on `5f76890` as
   validation of the unpushed correction.
2. With owner approval and fresh source/provider/rollback preflight, open a new
   120-minute admission. Permit one additional push to the existing PR #80, its
   protected Preview and current-head hosted checks/reviews. Necessary test and
   receipt/documentation corrections within this recovery scope are included;
   do not broaden application behavior or start an automatic rewrite loop.
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
