# Encrypted database backups for the beta

Status: **first live encrypted backup and isolated restore accepted; daily
protection is not active**. The owner approved the first-run packet below after
confirming the NAS runs continuously. One build, one encrypted export and one
actual restore completed within the approved caps. See the
[live receipt](../../audits/2026-11-18-first-encrypted-backup-and-restore.md).
The encrypted copy and protected PC recovery identity are retained; the temporary
database is removed. The owner subsequently confirmed saving a second identity
copy in their existing password manager. Current quota/headroom and separately
approved daily scheduling/retention/alerts remain; see the
[daily activation preparation](2026-11-18-daily-backup-activation.md). Neon stays on Free.

## What is being protected?

This protects AtmoShaper's shared hosted database across all users. It is not
an individual user's account-download feature and not a complete copy of every
service that runs the website.

| Information | Included in this database backup? | Recovery purpose |
| --- | --- | --- |
| Accounts, profiles, sign-in/security records and account permissions | Yes, where stored in the application database | Reconstruct account relationships and access after database loss |
| Saved app preferences, learning progress, decks and game records | Yes, where hosted | Recover saved work and preferences |
| Practices, services, availability, appointments and booking metadata | Yes | Recover scheduling information |
| Memberships, purchase/ownership records, legal acceptances and operational/audit records | Yes, for application-held records | Recover application state; reconcile external services separately |
| Personal wellness logs saved to an account | Yes, if present in hosted storage | Recover client-owned self-tracking; treat the backup as sensitive |
| Anatomy/reference/catalog information stored in the database | Yes | Preserve hosted content and database relationships |
| Therapist SOAP notes, intake contents, journals and professional ROM records in a browser vault | No; these are not fetched from devices | Users retain their separate encrypted local-vault export responsibility |
| Website source and Git history | No | Recover using the Git repository and reviewed release |
| Hosted audio, background media and other stored objects | No | Separate media preservation and provider recovery |
| Deployment settings, DNS, API keys and provider-account access | No, except application-held values already in the database | Separate protected configuration/access recovery |
| Actual Stripe charges or external Google Calendar contents | No; database references are not provider backups | Reconcile with the provider before re-enabling side effects |

The schema and [privacy boundary](../../wiki/privacy-and-phi.md) distinguish
hosted personal wellness from device-local professional records. A complete
database export is sensitive even though professional records stay local. It
must not be described as containing only anonymous settings or non-health data.
No existing production rows were inspected to prepare this scope.

If an accidental deletion, database corruption or hosting failure loses hosted
records, a verified copy lets the operator rebuild those records in a separate
database, check them, then prepare a controlled service recovery. Restoring an
older database does not reverse an external payment or revive an expired token.
Authentication/session and provider reconciliation are part of recovery.

## Proposed beta behavior

- One full encrypted copy daily, with seven days of completed copies retained.
- Check that a new copy succeeded before removing any older operation-owned copy;
  never expire the last good copy just because a scheduled run failed.
- Report failure and stale-backup age to an owner-controlled destination selected
  before activation. A missed backup is a recovery-target failure to address,
  not a silent success.
- Keep the decryption key separately from the backup files and the automated
  runner. The scheduled runner needs an encryption recipient, not that key.
- Prove one copy can be decrypted and restored into an isolated database before
  calling this recovery protection operational.

These are proposals, not an already configured seven-day policy. They support
the accepted target of roughly yesterday's data and next-day restoration. A
successful live recovery drill and measured backup freshness are still required.

## Runner and storage decision

The owner subsequently confirmed the NAS runs 24/7. Read-only authenticated
preflight now verifies its Docker/Compose availability and ample free storage.
System PostgreSQL 11.11 is too old for this database. Existing host tools and
services remain unchanged; the proposed isolated container has matching tools.
The current Windows workspace's Docker engine and WSL are inaccessible under
this session, so no local-container success is claimed. A hash-verified official
Windows age download was used only for invented local encryption fixtures.

An existing always-on private NAS/computer is a reasonable first candidate if
the owner confirms one is suitable: the job can run there and retain encrypted
copies without upgrading Neon. This is not a claim that a particular device,
folder, uptime, access policy, recovery key store or off-device copy is verified.
A private object-storage destination is an alternative if preferred. Keep backup
files private; never use the public media bucket, a public repository/artifact,
chat attachment or email attachment as the default destination.

Keeping Neon Free is not a promise that exports consume no quota. Measure the
first authorized export's duration and transfer, then check its monthly compute,
egress and storage budget with existing application usage before scheduling.
No paid destination or plan change is inferred from this plan.

## Prepared tooling and validation

The [one-shot operator tool](../../../scripts/database-backup/README.md) defaults
to an inert plan. Its explicit live command has fixed 15-minute/256 MiB caps,
streams a custom database export through age, uses private libpq files, rejects
older tools/insecure or pooled configuration, and never inherits unrelated app
secrets. Failed exports/encryption, stderr, timeout, output limits and collisions
cannot publish a completed archive/receipt. Existing copies are never pruned.

All 17 invented-data local tests pass with zero skips, including official age
encryption/decryption and wrong-key rejection. Windows initially denied hard
links inside the sandbox; the same tests passed outside it with controls intact.
All 162 existing CI-harness checks also pass outside the sandbox; its initial
attempt lacked the redirected browser cache. Hosted checks on this unpushed
branch are still pending. No assertion or timeout was changed.
The NAS Compose example parses successfully using invented mount inputs.
The approved isolated build and real encryption fixture subsequently passed.
The first live export and restore also passed. Private folders, one read-only
login, one PC-held production recovery identity and one encrypted archive now
exist; no scheduler or pruning was installed. The retained tested image uses
the verified public script mounted read-only after a preflight permission fix.

Catalog-only database metadata confirms the expected single application schema,
common ownership, absence of RLS tables and supported extension prerequisites.
The approved role's full table read coverage and lack of unintended write/admin
privileges were verified before export. Preparation queried no application rows;
the actual approved export necessarily copied the whole hosted database.

The NAS supports memory/swap limits, but not CPU-quota or PID-limit controls.
The example uses the supported no-swap memory cap and does not imply unavailable
kernel protections. Check effective ACLs on newly created private directories;
do not alter the broadly writable parent or existing share/stack permissions.

## First NAS backup and restore packet

The owner approved and executed this scope on November 18. It is retained as
the completed attempt's contract, not authority to repeat it:

1. Create only the new operation-owned private NAS runtime/config/archive
   directories listed in the ignored private target packet, with owner-only
   access and verified effective ACLs. Build one isolated image from the pinned
   PostgreSQL 18.7 parent and checked age 1.3.2 download. Build cap: 15 minutes,
   2 GiB additional image/runtime storage, no automatic retries. Do not replace
   any existing image tag, directory, service or share setting.
2. Generate one dedicated production-backup encryption identity in the proposed
   protected owner-PC recovery directory, outside Git and the NAS. Restrict its
   Windows ACL to the owner/System. Send only its public recipient to the NAS.
   The owner must retain a separate recovery copy before unattended activation;
   no password-manager automation or key pasted into chat.
3. Create one new login with `read_only` access to this application's database
   and application schema, including the SELECT permissions required by a full
   table/sequence export. Do not use the provider's default admin role mode,
   join the administrative role, grant writes, change existing credentials or
   alter application data. Reconfirm exact project/branch/database linkage and
   name availability first; abort on ambiguity or unexpected policy/ownership.
4. Store that credential only in the new private NAS libpq passfile and bind the
   exact direct TLS endpoint. No connection string/password in argv, terminal
   output, repository, receipt or application environment. Verify effective read
   coverage and lack of admin/write privileges before the export.
5. Run exactly one full shared-database export to encrypted NAS storage, capped
   at 15 minutes and 256 MiB ciphertext, without retries. This includes all the
   hosted data classes explained above. Preserve the archive/receipt, report
   actual elapsed time/size and assess Free-plan transfer/compute headroom.
6. Decrypt that copy into exactly one new operation-owned temporary PostgreSQL
   18 restore container on the NAS. No external network or published ports;
   no persistent database volume; 1 GiB no-swap memory cap and at most 512 MiB
   temporary database storage. Use a 15-minute rehearsal cap. Only database
   tools run there: no application, jobs, SMTP, Stripe or Google integrations.
   This is a private production-data copy, not an anonymous fixture environment.
7. Check archive completion, schema/migration compatibility and the specifically
   owned test-practice/default-service fixture without browsing other users'
   content. Do not overwrite/finalize/swap Production, change URLs or promote a
   deployment. Record only sanitized outcomes. Stop on an unexpected extension,
   role/restore failure, cap breach or source/target mismatch.
8. Remove only that operation-owned temporary restore container and its ephemeral
   database after recording the result. Keep the encrypted archive/receipt,
   private backup configuration, new backup login, isolated tooling image and
   separately protected recovery key. Never delete pre-existing resources.

The whole first-run window is bounded to 60 minutes with one build/export/
restore attempt each and no paid plan/resource change. Live execution starts
only after fresh preflight; a denied or ambiguous operation is not auto-retried.
Daily scheduler, seven-day pruning and owner alerts remain a later concrete
activation step after actual restore proof and recovery-key custody. The tool
being prepared and passing fixtures does not imply either is operational.

## Technical preparation after destination selection

1. Privately bind the exact confirmed Production database and direct endpoint,
   approved runner/destination and owner. Preserve the existing application and
   legacy resources. Choose a least-privilege export credential with sufficient
   read access to every required table; verify policies/ownership rather than
   assuming a partial dump is complete. Credential creation is a separate write.
2. Use reviewed PostgreSQL 18 client tools, matching the current server major,
   and a pinned official `age` release. Prepare installation/dependency checks
   on the chosen runner, with no production connection during local fixture tests.
3. Export schema and data in PostgreSQL custom format over the direct TLS
   connection. Include required application schemas and migration history; do
   not silently omit security or wellness tables to make the file look safer.
   Cluster roles, provider configuration and external objects need separate
   reconstruction records. No connection string belongs in a command argument,
   repository, log or screenshot.
4. Stream into `age` encryption before persistent output. Write only ciphertext
   to a unique private partial file, check exporter and encryptor exit status,
   then publish a completed file atomically. Stop/clean only this run's partial
   output on failure; preserve all prior completed copies. Do not log raw stderr,
   archive contents, table rows or secret-bearing environment values.
5. Keep a small protected receipt with timestamp, elapsed time, encrypted byte
   count, ciphertext checksum, tool versions and result. Database identities,
   restore manifest and configuration recovery material stay outside Git.
   Checksums detect file changes; they do not prove a successful restore.
6. Proposed first-run cap: one export, 15 minutes and 256 MiB encrypted output,
   no automatic retry. Confirm these against current database size and quotas
   before asking execution approval. Do not treat this proposed cap as authority.
7. Prepare scheduler, locking, failed-run cleanup, stale-backup alerts and
   ownership-bound retention. Select a fixed UTC schedule once the runner and
   its clock are verified. Test interruption, full storage, wrong key/recipient,
   partial export and unavailable destination with invented local fixtures.

This uses the vendor-supported
[Neon export route](https://neon.com/docs/manage/backup-pg-dump), with a direct
connection and matching PostgreSQL client tools. PostgreSQL documents
[custom-format exports](https://www.postgresql.org/docs/18/app-pgdump.html)
and [archive restoration](https://www.postgresql.org/docs/18/app-pgrestore.html).
The [official age project](https://age-encryption.org/) supplies the proposed
encryption tool. No shell example here is a ready-to-run live export command.

## Bounded restore and activation packet

Prepare one explicit reviewable operation after runner/storage/key custody are
known. It must identify the exported data class and private destination, proposed
read credential and key handling, measured quotas, exact scheduler/retention/
alert effects, one isolated restore target, time/transfer/cost caps, success
checks and cleanup. Creation of persistent credentials and access requires its
own applicable action-time confirmation. Owner-held secrets stay out of chat.

Restore testing must never overwrite, finalize into, swap endpoints with or point
Production traffic at the test target. Decrypt only in the approved isolated
environment; inspect schema/migration compatibility and the operation-owned test
practice/default-service fixture instead of browsing other users' rows. Suppress
mail, payment/webhook, Calendar sync and scheduled side effects. Define any
temporary plaintext handling, target expiry and exact owned cleanup in advance.
An older backup also needs an auth/session/token recovery and external-service
reconciliation decision before a real cutover.

Finish by checking application/legacy preservation, fixture readback, restore
duration, retained ciphertext/key availability and alert behavior. Only then
activate the separately approved schedule and verify its first real scheduled
run. Until then, record backup coverage and restoration as pending.
