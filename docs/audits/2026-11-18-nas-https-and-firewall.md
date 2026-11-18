# NAS HTTPS and firewall activation

Status: **HTTPS/DSM firewall applied and owner mobile-data access accepted**.

The owner explicitly approved HTTPS first and then a firewall preserving
QuickConnect, Drive, files and remote administration. Followed the
[execution plan](../superpowers/plans/2026-11-18-nas-https-and-firewall.md).
Private addresses/hostnames, full interface/rule snapshots and screenshots are
kept in ignored working evidence. No credential or database content was read.

## HTTPS

The existing HTTPS QuickConnect gateway reaches the correct NAS with browser
certificate verification intact. The owner signed in privately at the new
secure origin. Authenticated desktop and Control Panel access work over that
route; no cookies/passwords were copied from the HTTP session.

Enabled DSM's automatic HTTP-to-HTTPS desktop redirect. The expected web-server
reload completed; the secure session survived, and a freshly reopened settings
page shows the redirect checked. Existing web ports, certificates, custom-domain
field and HSTS state were preserved. No WAN port or DNS record was opened/changed.
The working owner entry point is the existing **HTTPS QuickConnect gateway**;
the bare IP does not match the hostname certificate.

A post-change local TLS handshake validates the existing hostname certificate
and reports TLS 1.3, without disabling certificate checks. A root-only unauthenticated
HTTP probe returned 200 rather than an HTTP Location header, so it is not evidence
of the browser/desktop redirect chain. Do not describe it as an observed 301/302.
The saved DSM setting and successful secure route are the accepted observations.

## Firewall

Created a separate profile, preserving the existing original profiles. Fresh
readback after activation confirms the firewall and notifications enabled and
the new profile selected. Reopened the saved profile and verified:

| Interface | Saved behavior |
| --- | --- |
| Physical bonded interface | Allow the verified existing home IPv4 subnet and IPv6 link-local traffic; allow existing web/certificate/DSM/Drive/Plex TCP ports 80, 443, 5001, 6690 and 32400; allow ICMP; deny unmatched traffic |
| Private tunnel / VPN interface | Explicit allow rule and allow fallback preserve existing tunnel/QuickConnect connectivity |
| Global rules | No broad allow rule overriding the physical-interface policy |

The IPv4 allow rule covers the actual source observed by NAS SSH. Initial local
route discovery used a shared/VPN address, so an unnecessary private-address
assertion stopped read-only inventory. Corrected the diagnostic to use the
NAS-observed source before choosing rules; no setting changed during that failure.

A new unsaved-profile VPN radio did not retain a selection initially. Added an
explicit allow rule before saving; fresh persisted readback confirms that rule
and the allow fallback. Original profiles were not overwritten or deleted.
Firewall activation was submitted once after rules and recovery-path checks.

## Acceptance and limits

| Check | Observed result |
| --- | --- |
| Fresh secure QuickConnect browser connection after activation | Authenticated DSM desktop and Control Panel load |
| Fresh firewall readback | Enabled; new profile selected; four physical-interface allow rules plus deny fallback and the saved private-tunnel allow rule |
| Local SSH, SMB, HTTPS and Drive transports | All four accept connections; these are protocol reachability checks, not file-content or sync tests |
| Local NAS certificate | Existing hostname verifies; TLS 1.3 |
| Container preservation | All 40 pre-existing container identities, images and states match the pre-change baseline |
| True external client acceptance | Owner confirmed all three work on mobile data: DSM administration, Drive and files |

QuickConnect/relay and its existing application permissions were retained.
No router/public-DNS, NAS account/credential, file/share, app deployment, daily
backup, retention, monitor, test email or database change was made. Existing
NAS backup assets and protected recovery identity remain in place.

This is NAS HTTPS/host-firewall acceptance, not a full router/WAN exposure,
patching, account-protection or Docker-port audit. Filtering of every published
container port was not certified; Docker documents separate
[packet-filtering behavior](https://docs.docker.com/engine/network/firewall-iptables/).
Do not infer all-service internet isolation from the DSM firewall checkbox.

The owner mobile-data result is their private functional confirmation, not an
agent-observed document inspection or a full Drive upload/download/sync campaign.
The requested remote-access preservation check is accepted. Daily scheduling,
retention and new Sentry monitoring remain a separate pending activation.

Keep the original profiles for rollback. An access regression should be traced
to its actual route before altering a rule; preserve the existing working
administrative path and never widen unrelated exposure as a shortcut.
