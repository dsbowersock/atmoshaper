# Shared database backups

Daily encrypted NAS backups and owner failure alerts were activated on November
18, 2026. See the [live receipt](../audits/2026-11-18-daily-encrypted-backups-and-alerts.md)
and [operator implementation](../../scripts/database-backup/README.md). Exact
locations, provider references and credentials remain in private owner storage.

## Coverage and schedule

The backup covers the shared hosted application database across users, including
accounts/sign-in, settings, scheduling, membership/purchase records and any
account-saved wellness data. Local professional-record vaults are separate;
this backup does not upload them. Source history, hosted media objects and
provider configuration also have separate recovery procedures.

One DSM task runs at 03:00 America/New_York, including daylight-saving changes.
The task runs under the verified NAS operator, using the accepted immutable
PostgreSQL 18/age image, private read-only export login and public encryption
recipient. The recovery identity stays with the owner on the protected PC and
in the password manager. Neither the job nor NAS needs the decryption identity.

There is one attempt per UTC day and no automatic retry. The entire operation
is bounded to 20 minutes. Retention executes only after a fresh, checksum-verified
success, retaining at least the latest seven successful copies and all copies
within seven days. Invalid, linked, changed or orphaned files stop retention;
they are preserved for review. At activation, both valid copies were retained.

## When an alert arrives

The backup-only Sentry monitor alerts the owner through the existing Sentry
member's email. A failure or regression notifies, throttled to 30 minutes.
No start within 15 minutes of the scheduled time, an explicit failure, or a job
running beyond 20 minutes produces a Cron failure. Only status, random check-in
identity and environment are transmitted; database data and raw diagnostics are
not included. A missing NAS is detected externally by Sentry.

1. Check the named monitor and the NAS task's last result. If the NAS is offline,
   restore its normal access first; preserve the encrypted copies.
2. Inspect the private sanitized daily result/attempt receipts. Do not paste
   raw logs, paths, credentials or account data into support requests.
3. Fix the specific cause before scheduling another export. A failed attempt
   marker intentionally prevents an automatic same-day retry; do not remove it
   merely to force another run.
4. For maintenance, disable only this DSM task and its monitor. Preserve the
   login, private configuration, tested image/scripts, all copies and recovery key.
5. Verify a later healthy check-in and newly verified encrypted pair before
   treating protection as restored. Never use an older success to authorize
   deleting retained copies.

## Held files and manual maintenance

An orphaned archive or malformed receipt intentionally stops retention; it does
not authorize deleting the file or repeatedly starting exports. For recovery,
first preserve the daily failure receipt and inventory the exact held names,
sizes and hashes privately. Verify every complete pair before choosing any
file to move. If a receipt is absent, do not fabricate one from the ciphertext.

Prepare an owner-reviewed maintenance plan naming only the suspect files and
an owner-only quarantine directory outside the scanned `backups` directory,
on the same filesystem. Stop the named scheduled task and confirm no backup
or retention process is active before the approved move. Preserve the suspect
files, their metadata and the inventory; move neither healthy pairs nor the
recovery key. A successful scan of the remaining complete pairs is only a
validation step. Older-copy deletion still requires a fresh successful export
through the normal daily operator. Do not clear the failed day's attempt marker
to force a retry. Resume the task and monitor after verifying the exact plan's
checks, and confirm the next normal run succeeds.

The daily operator's operation lock serializes its export and retention phases.
The standalone exporter's archive lock protects overlapping standalone exports;
it does not coordinate independent retention. After daily activation, use the
daily operator as the only writer. Manual standalone exports or retention need
the same separately approved task pause and proof that no operator is active.
Do not run them beside the scheduler. This procedure is prepared documentation;
the retrospective review has changed no NAS files, tasks or archives.

## Recovery evidence and limits

The [earlier isolated restore](../audits/2026-11-18-first-encrypted-backup-and-restore.md)
accepted all 135 tables, 46 migration checksums and the owned test-practice
fixture. The daily activation separately proved an actual scheduler-triggered
export, complete check-in/recovery, saved daily timing and authenticated owner
email delivery. The first permanent 03:00 run remains future at activation.

The beta target is up to one day of lost hosted changes and restoration by the
next day. A complete hosting outage/cutover has not been rehearsed. Restore to
an isolated compatible database first; production rebinding and source-data
replacement require their own concrete authorization and preservation checks.
