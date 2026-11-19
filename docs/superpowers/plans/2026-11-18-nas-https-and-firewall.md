# NAS HTTPS and firewall with remote-workflow preservation

Status: **approved HTTPS/DSM firewall operation accepted, including owner mobile-data access**.
The owner requested working HTTPS first, then a firewall while retaining
QuickConnect, Drive, files and remote administration from work and travel.
This supersedes the earlier absence of NAS-setting authority only for these
scoped changes. It does not authorize unrelated NAS cleanup, router/public-DNS
changes, account/credential replacement or disabling existing remote workflows.

The [dated receipt](../../audits/2026-11-18-nas-https-and-firewall.md) records
secure sign-in, saved redirect, new active profile, physical/tunnel rules,
local transport/certificate checks and container preservation. The owner confirms
external DSM/Drive/files access works on mobile data; do not replay activation.

## Execution and preservation

1. Fresh-read the authenticated DSM state and preserve current web ports,
   redirect, certificate, QuickConnect permissions and firewall profile outside
   Git. Keep a working authenticated administrative/recovery path.
2. Establish an existing certificate-valid HTTPS route without opening a WAN
   port or bypassing a certificate warning. The secure QuickConnect gateway now
   reaches the correct NAS login without a certificate error. Owner sign-in at
   that new origin is pending; no cookie/credential transfer is performed.
3. Verify the secure signed-in DSM shell and offered Drive/File Station routes
   without opening private documents. Only then apply the approved HTTP redirect
   with ports/identity/QuickConnect preserved. Re-read and test the resulting URL.
   Do not enable HSTS simultaneously or create a redirect loop.
4. Collect actual interfaces, source route, listening/published services and
   existing firewall rules. Prepare a separate profile or preserve the original
   profile's exact reversal. Allow the operator's LAN/recovery path and necessary
   remote-service traffic before default-deny. Respect physical/LAN interfaces,
   IPv6 and container networks; a DSM firewall is not proof of Docker-port
   filtering. Do not rewrite Docker's own chains or restart services.
5. Verify rule order and the active interface/profile before enabling the
   firewall once. Preserve QuickConnect/relay and its existing app permissions;
   do not use WAN port forwarding as the HTTPS fix. If DSM provides a connectivity
   confirmation/automatic rollback, keep it available through acceptance.
6. Test secure DSM, Drive and File Station entry, local SSH recovery and the
   existing container identity/image/state baseline. Require an owner cellular/
   away-from-home check for true external acceptance; a local gateway check does
   not prove every client or network. Never open clinical or unrelated files.
7. If access regresses, use the held recovery session to reverse only the new
   rule/profile/redirect change. Record any partial result instead of calling
   remote access complete. Keep backup credentials/archive/key and all current
   services intact. Daily backup/retention/Sentry activation stays separate.

## Evidence and closeout

Record only public-safe service names, observed setting states and acceptance
limits in the canonical state/log and a dated receipt. Private addresses,
hostnames, source rules and provider identifiers remain in ignored/private
evidence. Save a screenshot after each persistent UI change for owner review.
Use current vendor-supported DSM UI rather than hidden APIs or editing its task/
firewall databases. No additional generic approval is needed for this approved
sequence; request missing authentication or a materially different scope only.
