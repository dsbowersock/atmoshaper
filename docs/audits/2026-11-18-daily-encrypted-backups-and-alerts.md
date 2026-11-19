# Daily encrypted database backup and owner alert

The owner explicitly requested finishing daily backups and failure alerts after
accepting the earlier isolated restore, second recovery-key custody and NAS
HTTPS/firewall checks. This is a new daily-activation operation. The completed
first-export/restore and application error/email campaigns remain closed.

## Applied preparation

- Rechecked private NAS paths, native operator identity and timezone, original
  backup-script digest, tested immutable image and the one retained encrypted
  copy. No daily operator/configuration/attempt existed before installation.
- Installed the three reviewed operator modules together under a new private
  directory, preserving exact source bytes and the original export script.
  Readback validates private ownership, strict configuration and image/script
  binding. Existing export credentials and recovery identity are unchanged.
- Rechecked the included Sentry Cron allowance, then created one dedicated
  monitor for 03:00 America/New_York, 15-minute grace, 20-minute maximum runtime
  and failure/recovery thresholds of one. No upgrade/trial was started.
- Created a separate backup-only alert connected to that monitor alone, with
  the owner's existing Sentry member as the sole recipient. New failures and
  regressions notify, with a 30-minute throttle. Existing alerts are preserved.
- Saved one new DSM task under the verified operator, initially disabled. Its
  script uses the private daily configuration; no credential is in the command.

## Accepted live checks

One synthetic error check-in was accepted by Sentry's HTTP endpoint; this sends
only random check-in identity, status and the production environment. No export
or application data accompanies the alert test. Sentry displays the expected
backup-specific Cron failure, and the dedicated alert records exactly one trigger.
The corresponding owner email was received at 18:10 UTC, with the expected
backup-monitor subject and sole intended recipient. Gmail's received headers
report SPF, DKIM and DMARC pass. Earlier domain-filtered mail searches missed
the vendor's actual sending subdomain; the exact-subject search found this
single test message. No additional notification was sent to work around that
search mismatch, and no inbox state was changed.

The same DSM task ran once by the scheduler at 18:15 UTC. It completed in
12.758 seconds, with a fresh private success result and two checksum-verified
encrypted pairs retained. The new encrypted file is 2,250,739 bytes. Sentry
shows its paired start/success check-in lasting 13 seconds, and the synthetic
failure issue is resolved. No manual export or retry was used. All 40 original
containers retain their identity, image and state, with zero extra containers.

Returned that same enabled task to 03:00 America/New_York and verified its saved
next run: November 19 at 03:00 local. This matches the monitor's schedule and
timezone. The first permanent overnight run has not occurred; acceptance proves
the actual scheduler context through the temporary clock time. A private
activation receipt and recovery/operator instructions are saved on the NAS.

## Retained boundaries

The existing Free database plan is preserved. Retention runs only after a new
verified success, keeps at least seven successful copies and seven days, and
refuses invalid/orphaned/linked/changed files. At this small initial copy count,
no archive is eligible for deletion. There is one attempt per UTC day, no
automatic re-export, private operational output and an overall 20-minute bound.
The container has no decryption identity or Docker socket.

These shared hosted-data backups do not include local professional-record vaults,
Git history, media objects or every provider setting. The earlier isolated
database restore remains accepted; a full hosting outage/cutover is not tested.
