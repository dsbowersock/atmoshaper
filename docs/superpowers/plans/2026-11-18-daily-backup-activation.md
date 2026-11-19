# Daily encrypted backup activation preparation

Status: **activated and accepted at the scheduled-test scope**.
The owner's November 18 request to finish daily backups and failure alerts
authorizes this prepared scope. Activation is a new operation; it does not
replay the closed first-export/restore or application error/email campaigns.
Use one new scheduled export and one synthetic backup-only failure check-in
to verify the scheduler and owner alert. Preserve all existing backups and
leave unrelated NAS services, project alerts and billing unchanged.
The owner confirmed the second recovery identity copy was saved privately in
their existing password manager. The agent did not inspect the password manager
or copy the identity into chat. The first encrypted export and isolated restore
remain accepted; that completed campaign is not replay authority.

The owner's subsequent security question adds a readiness gate: see the
[read-only NAS access review](../../audits/2026-11-18-nas-backup-access-review.md).
That gate is now accepted at the [HTTPS/firewall receipt's scope](../../audits/2026-11-18-nas-https-and-firewall.md):
secure administration works, the approved NAS firewall is active, and the owner
confirms DSM/Drive/files access on mobile data. Those settings are not authority
to activate this daily job or widen unrelated NAS/router behavior.

## Approved operation

The owner authorized activation covering the existing private NAS backup
root, existing verified read-only login/image/script and public-only operational
check-ins to the existing AtmoShaper Sentry project. Keep Neon Free, no new build,
database role, app deployment, schema migration or source database write.

- Daily export: 03:00 in the NAS's verified local timezone. Its configured
  `EST5EDT,M3.2.0,M11.1.0` rules match `America/New_York`; use that IANA timezone
  in Sentry with the same 03:00 schedule, including daylight saving changes.
- One attempt per UTC day, no automatic retries. Export retains the existing
  15-minute/256 MiB limit and 256 MiB no-swap container cap. The entire daily
  operation has a 20-minute limit. Prevent concurrent/manual overlap.
- Retention only after a newly completed, checksum-verified export. Remove only
  exact tool-owned archive/receipt pairs older than seven days, while retaining
  at least the latest seven successful copies. Invalid, linked, mismatched,
  unexpected or unpaired files are never deletion candidates. Failed export
  or validation means no retention. Report any retention failure honestly.
- One Sentry Cron monitor: existing project, matching daily schedule, 15-minute
  grace, 20-minute runtime ceiling, failure/recovery thresholds one. Confirm
  the intended owner alert recipient/rule before creating it. Fresh alert reads
  show the previous acceptance-only rule is disabled; preserve it and prepare
  one dedicated backup-only rule rather than re-enabling that closed campaign.
  The fresh billing
  page shows zero of one included Cron monitors used; no paid upgrade or trial.
- Check-ins send only status, duration, a monitor slug and random check-in ID.
  They send no database rows, dump names/contents, credentials, paths or raw
  diagnostics. Use the existing project's DSN/check-in mechanism, never its
  organization CI token. Read the current vendor protocol before implementation.
- Keep any NAS run output sanitized, and let the job return failure when export,
  retention or monitoring fails. Monitoring failure must not destroy a good
  archive or cause an automatic re-export. Sentry catches missing NAS check-ins;
  an additional same-NAS freshness job cannot replace that external observation.

## Evidence and remaining preparation

Read-only NAS preflight confirms Python 3.8, DSM Task Scheduler and notification
tools, owner-only retained backup assets and the accepted first closeout. Existing
NAS email configuration has two populated recipient fields; no address or secret
was emitted and no mail sent. That does not select those recipients for this job
or prove current delivery. No task/settings write was made.

Current provider metadata has approximately 33.7 MB of month-to-date transfer
and 1.08 compute-unit hours. The increase since preflight includes the export
and other activity; it is not an isolated per-backup meter. Current
[Neon pricing](https://neon.com/pricing) lists 100 CU-hours and 5 GB transfer per
Free project. Confirm integration-specific limits and refreshed consumption
before activation; do not derive source egress from the 2.25 MB ciphertext size.

Implementation order:

1. Add/test receipt, retention and freshness validation against invented copies,
   including corruption, failed-new-run, clock skew, links, races and file holds.
2. Prepare the bounded daily Docker runner and minimal check-in transport with
   fake subprocess/HTTP fixtures. The default command must remain inert.
3. Read back exact timezone and existing owner notification route. Prepare the
   unsaved Sentry/DSM settings and private config without exposing DSN/credentials.
4. Activate the reviewed settings under the owner's current authorization.
   First activation acceptance needs one bounded real scheduled job,
   readback of its new encrypted receipt, monitor check-in and sanitized owner
   notification proof. Do not replay the previous error/email campaign.
5. Verify the first actual scheduled run before claiming scheduled coverage.
   Leave the job disabled if binding, quota, recipient or operation state is
   ambiguous. Disabling only this new job/monitor is the rollback; preserve
   all encrypted archives, the login, tooling and recovery key.

## Prepared implementation evidence

### Activation result

One real DSM clock-triggered run at 18:15 UTC completed in approximately 13
seconds. The new encrypted pair and all retained checksums validate, Sentry
received start/success check-ins, and the synthetic failure issue resolved.
Exactly one backup-only owner notification was received with authenticated mail
headers. All 40 original containers are preserved. No archives were eligible for
retention deletion. The same enabled task is now saved at 03:00 America/New_York,
with November 19 at 03:00 local as its next run; the first permanent overnight
run is still future. See the [acceptance receipt](../../audits/2026-11-18-daily-encrypted-backups-and-alerts.md).

### Earlier preparation

The local operator/maintenance modules and 46 invented-data backup tests pass,
including the real age round-trip. A coarse socket assertion initially confused
the host CLI's explicit local daemon binding with a container mount; the corrected
check inspects only mounts and confirms no daemon socket enters the container.
Native NAS Python 3.8 imports and deadline interruption/restoration pass using
in-memory public source, with no installation or live job/check-in. The retained
encrypted archive passes the real readonly receipt/checksum reader; its old
success is correctly refused as authority for new retention.

The supported scheduler CLI cannot create tasks, so use the normal DSM UI. The
owner supplied their usual DSM address after the IP-based HTTPS address failed
certificate hostname validation; no warning was bypassed. The normal sign-in
page was opened in regular Chrome and the owner completed authentication. The
subsequent security review remains read-only; the exact URL/targets stay private.

Monitoring source: [Sentry Cron setup](https://docs.sentry.io/product/monitors-and-alerts/monitors/crons/getting-started/).
The database outage/cutover and external auth/payment/Calendar reconciliation
remain separate recovery procedures.
