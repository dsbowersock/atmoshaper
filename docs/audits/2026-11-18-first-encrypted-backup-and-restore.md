# First encrypted NAS backup and isolated restore

Status: **first live export and restore accepted; unattended protection pending**.

The owner explicitly approved the prepared first-backup packet, including new
private NAS tooling/folders, one read-only database login, a separate PC-held
recovery key, one encrypted export and one temporary isolated restore. Daily
scheduling, older-copy deletion and alerts were excluded from that approval.
Exact targets, credentials, key locations and private receipts remain outside Git.

## Observed result

| Check | November 18 result |
| --- | --- |
| Approved operation window | Started 14:58:33 UTC; temporary restore removed at 15:28:44 UTC, within the 60-minute cap |
| Tool build | One successful build, approximately 79 seconds; 785,707,008 additional storage bytes, below 2 GiB |
| Tools | Pinned official PostgreSQL 18.7 parent and checksum-verified age 1.3.2; system PostgreSQL 11 unchanged |
| Private destination | New owner-only NAS directories/files with inherited Synology ACLs removed only from the new root; existing parent/share permissions preserved |
| Export credential | Dedicated read-only login; all 135 application tables readable, SELECT-only explicit grants, no inherited/admin/create/bypass-RLS privileges; no application sequences or large objects present |
| Connection | Correct dedicated role/database and read-only session; client reports TLS 1.3 using certificate/hostname verification and required channel binding |
| Encrypted export | One attempt; 2,250,739 bytes (about 2.15 MiB), approximately 18 seconds; exporter/encryptor/container exit zero with no diagnostics |
| Integrity | Exactly one completed archive and paired receipt; ciphertext checksum readback matches; files owner-only |
| Restore | One actual archive restore; approximately 6 seconds including the PC streaming pipeline; all stages exit zero with no diagnostics |
| Compatibility | All 135 tables; all 46 source migration names/checksums; no failed migrations; expected extensions and valid constraints |
| Owned fixture | Test practice, owner membership, default Massage Session service and 60-minute variant all present |
| Cleanup | Temporary database container removed; no persistent database volume created; all 40 pre-existing containers match the original identity/image/state/name baseline |

The archive covers the **whole shared hosted application database**, including
account/security, scheduling, membership/purchase and hosted personal wellness
records. Device-local professional record vaults were not fetched. Source code,
media and provider configuration retain their separate recovery requirements.

## Isolation and key handling

The export job ran unprivileged with a read-only root/script/config, dropped
capabilities, no-new-privileges and a 256 MiB no-swap memory cap. Its only writable
durable output was encrypted backup storage. The pipeline did not create a
plaintext dump file or expose credentials in arguments, output or tracked files.

The recovery identity is held in a protected owner-PC directory accessible only
to the owner and SYSTEM. Only its public encryption recipient is on the NAS.
Actual NAS encryption and the final restore both proved the PC-held identity
works. A separate recovery copy is still pending. The temporary credential-transfer
private key was removed after verification; the recovery identity was preserved.

For restoration, NAS ciphertext streamed to the PC, through age decryption, and
back over SSH into database tools. No recovery identity was sent to the NAS and
no plaintext dump was written. The temporary PostgreSQL target had network mode
`none`, no published ports, no persistent volumes, a read-only root, a 1 GiB
no-swap memory cap and a 512 MiB database tmpfs. SQL/row error logging was
suppressed before data arrived; diagnostic streams were discarded rather than
saved. No app, mail, payment, Calendar or scheduler process ran there. Acceptance
queries examined metadata and only the specifically owned test fixture.

## Corrections during preflight

- Docker COPY preserved the private staging file's mode while changing its
  owner, preventing the unprivileged image user from reading the public script.
  A read-only bind of the identical verified script corrected the runtime path,
  and real Linux encryption passed before the export. No second image build was
  performed. The source Dockerfile now makes public script readability explicit
  for future builds; the retained tested image uses the read-only script mount.
- A server-side `pg_stat_ssl` check returned false. It was retained as a failed
  preflight rather than misrepresented as client-channel proof. The subsequent
  client-side `psql` connection check confirmed TLS 1.3 with the same strict
  service settings. No TLS option was relaxed. Neon documents
  [certificate/hostname verification](https://neon.com/blog/postgres-needs-better-connection-security-defaults).
- The first container-preservation comparison mixed Docker's full and compact
  display formats. A direct comparison using the original format matched all
  40 containers exactly. Both observations remain in private receipts.

## Remaining before daily activation

1. Owner retains a second private recovery-key copy outside this PC/NAS failure
   pair and confirms access. Never paste the identity into chat.
2. Prepare and approve the exact daily job, retention and failure/staleness
   notification destination. They are not installed. Retention must only remove
   validated operation-owned completed pairs after a new success and preserve
   the last good copy on failure.
3. Recheck current Free-plan consumption/headroom before scheduling. Project
   usage counters were unchanged between preflight and post-run metadata reads;
   they do not isolate this export's network/compute cost. Ciphertext size is
   not a measurement of source database egress. No billing or plan changed.
4. Verify a real scheduled run and failure/staleness reporting, then update the
   recovery objective status. This drill proves archive/database recovery, not
   a complete hosting outage or next-day service restoration.

The encrypted archive, private export configuration/login, tested image/script
and PC recovery identity are retained. Production data, app credentials, live
traffic and existing NAS services were not changed by the export/restore.

Final local verification: `npm run test:database-backup` passes all 17 tests
with zero skips, including genuine encryption/decryption and wrong-key rejection;
the default plan remains inert and `git diff --check` passes. Private recovery
instructions were saved beside the protected identity. Temporary credential
handoff keys/ciphertext were removed. No second recovery-key copy was made.
