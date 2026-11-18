# NAS backup access review

Status: **read-only findings; daily activation pending**.

This is the pre-change review. The owner subsequently approved HTTPS/firewall
changes; the [activation receipt](2026-11-18-nas-https-and-firewall.md) supersedes
the connection/firewall states below and records passing owner mobile-data access.

After private DSM sign-in, the owner asked whether NAS backups are safe and
whether they create security exposure. Inspected existing DSM connection,
certificate, firewall and external-access settings without applying changes.
Exact hostnames, remote identifiers and connection details remain private.

## What the backup adds

The completed backup setup introduced one persistent database-reading credential
in an owner-only NAS configuration directory, an isolated tool image/public
script and encrypted archive storage. It did not create router port forwards,
publish a container port, enable a NAS share, enable SSH/QuickConnect or change
the NAS firewall. Backups use an outbound certificate-verified database
connection; source data is encrypted before durable archive output.

The key tradeoff is that NAS administrative compromise could expose the export
credential and permit reading the live hosted database. Archive encryption does
not protect that live-credential path. The dedicated role has the verified
SELECT-only table grants and lacks inherited/admin access recorded in the first
restore receipt. Its credential is sensitive even though it is not the app's
administrative or runtime credential. The recovery identity was not installed
in the NAS backup runner/configuration; the owner retains the protected PC copy
and confirms a password-manager copy. No password-manager contents were inspected.

## Existing NAS observations

| Observation | Meaning and limit |
| --- | --- |
| Owner's ordinary DSM connection uses HTTP | Browser-to-DSM transport is not protected by HTTPS. This is separate from the verified TLS database export connection. |
| Default hostname certificate is within its displayed validity period | The IP-based HTTPS attempt failed hostname validation. The certificate-matched DDNS route did not load during the bounded attempt; valid certificate inventory alone does not prove a working HTTPS access path. No warning was bypassed. |
| DSM firewall unchecked, dependent profile controls disabled | The NAS firewall is off. This does not establish the upstream router's rules or actual WAN reachability. |
| QuickConnect and relay enabled | Existing remote-access mechanism is configured; the backup did not enable it. |
| QuickConnect permits DSM, mobile applications, Drive and file sharing | Remote administration and app access need an owner usage decision before reducing them. Do not disable services blindly. |
| DSM's router page lists an existing Drive/QuickConnect mapping | Only DSM-managed entries were viewed. Manual router rules, all other ingress paths, enabled enforcement and external reachability were not certified. No connection test or router setup was run. |

DSM remained on the firewall page for owner review. The unsaved Sentry alert
draft was closed; no Cron monitor, alert, test notification or daily task was
created. No NAS security/network setting changed. The first encrypted copy is
retained and the prior restore acceptance remains valid.

## Before recommending unattended activation

The owner clarified that remote Drive, file access and DSM administration are
all frequent requirements from work and while travelling. Preserve all of those
workflows. Review HTTPS and account/router protections around the existing uses.
No VPN mandate, QuickConnect removal or firewall policy has been approved.

1. Establish which remote NAS services the owner uses, including administration,
   app/file access and other current consumers. An existing setting is not a
   reason to remove working household services without review.
2. Prepare a working HTTPS management route using the existing certificate or a
   separately reviewed certificate/local-DNS solution. Do not open WAN management
   ports just to make the certificate hostname reachable.
3. Review the actual router/remote-access boundaries and relevant account
   protections before proposing targeted firewall/access changes. Do not enable
   a default-deny policy without the actual allowlist, recovery path and approval.
4. Keep daily backup/retention/monitor activation pending the reviewed access
   decision and its exact separate approval. The already completed first export
   is not an open-ended grant for further database copies or deletion.

Synology recommends
[HTTPS, valid certificates, restricted access and VPN for remote DSM administration](https://kb.synology.com/en-us/DSM/tutorial/How_to_add_extra_security_to_your_Synology_NAS).
Its [QuickConnect documentation](https://kb.synology.com/en-us/DSM/help/DSM/AdminCenter/connection_quickconnect)
explains remote/relay access and application-specific permissions. This review
is not a full NAS penetration test, patch audit or internet exposure scan.
