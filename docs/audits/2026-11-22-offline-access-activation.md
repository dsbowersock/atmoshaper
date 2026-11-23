# Offline background access activation and release

November 22, 2026. Publication is in progress, not complete.

PR #80 receives the owner-approved corrected candidate `92585d9`. Its protected
Preview/CI and hosted Codex/CodeRabbit correction coverage are complete. The
three new CodeRabbit comments concern status documents only; this receipt-only
closeout corrects them while preserving application/trust source `15b7f55` and
the verified APK. Fresh documentation-head checks/Preview remain merge gates.
See the [grouped correction receipt](2026-11-22-offline-hosted-review-corrections.md).
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
No real account receipt or native phone installation has occurred. Source/key
binding reviews and matching-APK acceptance pass. After the documentation-head
CI/Preview gates, Production/Sentry build, same-artifact staged acceptance/
promotion and the one owner receipt check remain.

The [recovery amendment](../superpowers/plans/2026-11-22-offline-activation-recovery.md)
and [original activation scope](../superpowers/plans/2026-11-22-offline-access-activation.md)
remain the exact authorization boundary. Application logic is unchanged from
the reviewed offline candidate. The documented minor older-preview migration
retry limitation is retained; this is not a zero-issue or full-native-parity claim.
