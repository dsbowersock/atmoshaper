# Offline background access activation and release

November 22, 2026. Publication is in progress, not complete.

PR #80 at `5f76890` has a READY protected Preview. Hosted Codex review identifies
a confirmed startup fallback-autosave overwrite; publication is held while the
[focused correction](2026-11-22-offline-startup-recovery.md) is prepared locally.
No merge/Production build/promotion or real-account receipt has occurred.

The owner approves the original activation plan and then its one-key recovery
amendment after the installed CLI's failed bulk-array request. Fresh recovery
preflight matches application source `194e385` plus documentation, live main
`0eb02e0`, all 87 original setting metadata entries, all 48 existing aliases,
manual promotion, existing protection and the READY rollback release.

One replacement P-256 key is generated in the isolated operation process. An
explicitly encoded HTTPS JSON upload succeeds once, without automatic retry.
Read-back verifies exactly these three new settings, all Production-only:

- `ATMOSHAPER_OFFLINE_ACCESS_PRIVATE_KEY`, stored as a sensitive Secret;
- `ATMOSHAPER_OFFLINE_ACCESS_KEY_ID`;
- `ATMOSHAPER_OFFLINE_ACCESS_ENABLED=true`.

The original 87 setting metadata entries are unchanged. No Preview/Development
setting is added or changed. The private key and existing CLI credential never
enter files, command arguments, source or output. The matching public JWK and
public key ID alone are bound in the native verifier. Local signature and
install/challenge self-checks pass. The discarded first authority is not reused.

The live site still uses the previous release. These new settings take effect
for a later build; the account verification page/issuer has not been published.
No real account receipt or native phone installation has occurred. PR checks,
review of the final public binding, Production/Sentry build, same-artifact staged
acceptance/promotion, matching APK and the one owner receipt check remain.

The [recovery amendment](../superpowers/plans/2026-11-22-offline-activation-recovery.md)
and [original activation scope](../superpowers/plans/2026-11-22-offline-access-activation.md)
remain the exact authorization boundary. Application logic is unchanged from
the reviewed offline candidate. The documented minor older-preview migration
retry limitation is retained; this is not a zero-issue or full-native-parity claim.
