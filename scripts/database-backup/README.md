# Encrypted database backup operator tools

The one-shot `backup.py` defaults to an inert plan. It does not install a schedule,
prune copies, generate a key, create a database role, restore data or change a
provider plan. The separately prepared `daily.py` adds explicitly approved
retention/check-ins; its default is also inert and it installs no schedule.
See the [scope and approval plan](../../docs/superpowers/plans/2026-11-18-encrypted-database-backups.md).

`npm run database:backup:plan` prints the scope and fixed caps without reading
credentials or contacting a database. `npm run test:database-backup` runs invented
local process/file fixtures using Python. Neither test uses a production URL.

The Linux/amd64 image combines reviewed PostgreSQL 18 tooling and official age
1.3.2. The public parent digest and age download checksum were resolved on
November 18, 2026. The approved first NAS build, encrypted export and isolated
restore passed; see the [live receipt](../../docs/audits/2026-11-18-first-encrypted-backup-and-restore.md).
The retained tested image uses the identical public script mounted read-only.
Its build predates the Dockerfile's explicit readability correction; that
correction applies to future builds. NAS system PostgreSQL 11
tools are intentionally not used for the PostgreSQL 18 application database.

## Private deployment inputs

Supply these only after exact deployment/export approval:

- A private config directory and output directory, both mode 0700 and owned by
  the chosen unprivileged NAS user. No symlinked directory or shared permissions.
- `pg_service.conf`, mode 0600, with exactly one `[backup]` service. Allowed keys:
  `host`, optional `port`, `dbname`, `user`, `sslmode=verify-full`,
  `sslrootcert=system`, `channel_binding=require`. The host must be the verified
  direct Neon endpoint. Passwords, alternate service files and shell options are
  not accepted there. The operator still verifies exact project/database identity.
- A private libpq `pgpass` file, mode 0600, containing only the separately approved
  least-privilege export credential for that endpoint/database/role.
- `recipient.txt`, mode 0600, with one dedicated native age public recipient.
  The owner keeps the corresponding recovery identity outside the NAS/runner,
  in a separately approved protected location and an owner-controlled recovery copy.
- The reviewed derived image digest, private mount paths and actual NAS UID/GID.
  No docker socket, published ports, private recovery identity or application
  provider/email/payment credentials are mounted into the job.

`compose.example.yml` defaults to `plan`. Live execution additionally requires
the explicit `run --execute` command. The initial cap is one attempt, 15 minutes
and 256 MiB ciphertext, with no retries. Each successful run produces a `.dump.age`
archive and paired JSON receipt; raw exporter stderr and plaintext are not saved.
Any stderr or failed stage aborts conservatively and removes only that attempt's
new paths. An OS-released lock prevents overlapping runs. The tool never deletes
an older backup; daily scheduling, owner alerts and seven-day retention must be
reviewed and installed separately after real export/restore acceptance.

The NAS's broad existing parent permissions require checking the new private
directories' effective ACLs before secrets or archives are written. No parent
permissions or existing share/stack may be changed to accommodate this job.
Fresh host metadata supports memory/swap limits but not CPU-quota or PID-limit
controls. The example therefore does not claim those unavailable protections;
it uses a 256 MiB no-swap memory cap and a bounded one-shot pipeline. Image build
and restore need their own separately reviewed resource caps.

## Recovery limits

The paired receipt and encryption header are completion/integrity checks, not
proof that the database can be restored. Run a complete decrypt/restore rehearsal
in one approved isolated target; check schema/migrations and invented test-practice
fixtures. Keep external mail/payment/Calendar effects disabled. Never point this
tool at a live restore target, place a recovery identity beside the archives,
claim an existing daily schedule, or infer cleanup authority for unrelated files.

## Prepared daily operator

`npm run database:backup:daily:plan` reads no private configuration and opens no
network connection. `npm run test:database-backup` now covers the one-shot exporter,
retention/receipt validation and daily operator, with fake Docker/HTTP calls and
invented local copies. The optional age fixture remains a genuine round-trip.
See the [daily activation plan](../../docs/superpowers/plans/2026-11-18-daily-backup-activation.md)
for the still-pending live installation, monitoring and scheduling approval.

Install the three Python files together in a new private operator directory only
after approval. They need owner-only access; the host helper and the readonly
container script must both match the configured source checksum. Do not rebuild
the accepted image merely to install this host-side orchestration.

The owner-only `config/daily.json` schema contains exactly `schemaVersion: 1`,
`root`, `image`, `uid`, `gid`, `backupScriptSha256` and `checkinUrl`. Populate it
privately from verified existing bindings. The check-in URL must be the existing
project's official HTTPS Sentry Cron endpoint; no CI/organization auth token is
needed. No private config example or real URL belongs in Git.

Live execution requires `run --execute --config` plus that private file path.
The operator binds the local Docker socket explicitly, uses an existing image ID
without pulling, and never mounts that socket or a recovery identity into the
container. The existing export cap remains. A native NAS deadline interrupts
active work after 19 minutes, reserving the remainder of the 20-minute budget for
label/image-bound cleanup and final reporting. Failed/ambiguous attempts keep
their per-day marker; a schedule cannot silently retry them the same day.

Retention verifies the new export and every exact owned pair's receipt, SHA-256,
age header, UTC times, ownership, link count and unchanged file identity. It only
deletes completed pairs older than seven days after a new success, keeping the
latest seven successes (or all copies while fewer exist). Unknown/partial files
are held; invalid or orphaned owned files stop retention. A monitoring failure
never triggers re-export and a failed start check-in prevents older-copy deletion.

The transport sends only `status`, a random `check_in_id` and the fixed
`production` environment to the private configured monitor endpoint. It rejects
redirects, disables environment proxies, has a bounded request and sends no
monitor-configuration/upsert payload. No database content, paths, receipts or raw
diagnostics are transmitted. An independent Sentry Cron monitor is required to
notice a missing NAS job; a freshness check on the NAS alone cannot detect NAS loss.
