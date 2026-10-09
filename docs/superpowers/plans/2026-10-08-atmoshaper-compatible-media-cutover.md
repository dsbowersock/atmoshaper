# Compatible AtmoShaper media cutover

Prepared October 8, 2026. Read [project state](../../project-state.md),
[project log](../../project-log.md), the [independent launch plan](2026-10-08-atmoshaper-independent-launch-readiness.md)
and [media consumer map](../../wiki/media-independence.md) first.
This prepares the next operation; no DNS, bucket, object, database, credential
or public deployment change is authorized by this document.

## Outcome and observed baseline

Offer independently managed AtmoShaper media while preserving the user's working
MassageLab clock and tools. Prefer new delivery bindings over copying immutable
objects. Bucket names, object keys, checksums and entitlement IDs remain
compatibility contracts unless a dedicated migration proves replacement safe.

The owner corrected the saved storage token's dates. The same identity is active,
currently valid and succeeds on the canonical bucket-list read. Do not repeat
capture, request another token or expand this read grant. Exact references and
dated responses remain protected outside Git.

Readback verifies three owner-confirmed default-jurisdiction buckets, Standard
storage in Eastern North America. EU/US inventories return none, with no returned
continuation cursor; federal jurisdictions remain unverified. Public/anatomy
retain active legacy custom domains with minimum TLS 1.2; private media has none.
Public development access is disabled on all three. Public CORS permits GET/HEAD
from all origins and exposes range/cache/type/length/ETag headers. Anatomy/private
have no CORS configuration. Their returned lifecycle rule aborts unfinished
multipart uploads after seven days, rather than expiring completed objects.

Owner overview: approximately 11.11k public objects/13.13 GB, 5.1k anatomy
objects/2.83 GB, zero private objects/bytes, and 15.95 GB total. These independently
rounded figures and zero shown-period billable usage are not exact object
integrity, future cost bounds or completed migration. No object list or payload
was requested. The separate public JSON inventory covers all 228 declared indexes
and finds 6,800 legacy-origin sample references; source inventories retain their
stated limits.

## 1. Prepare DNS onboarding while preserving existing services

Native authorized login includes the storage account and zone-read scope. The
approved owner-created resource is now verified as one pending full AtmoShaper
zone on Free in that exact account. Two assigned nameservers remain private;
fresh authoritative and recursive NS reads both retain Namecheap. The owner has
now imported the eight known records; the completed staging/readback below
supersedes the earlier empty table. The record-list API remains denied under
the existing grant; complete API inventory is not claimed.
October 9 UTC direct reads at both Namecheap authorities return no records at
proposed `media.atmoshaper.com` and `anatomy-media.atmoshaper.com` across A, AAAA,
CNAME, NS, TXT and CAA. Root CAA returns no data; root NS/SOA controls succeed.
One invented root-label A probe also has no answer. These scoped queries do not
prove complete zone inventory or absence of every wildcard/delegation.
Direct DS reads at two .com authorities return negative responses with a .com
SOA authority and no DS, with positive .com SOA controls. Parent DS absence is
now independently verified; refresh it immediately before any approved change.

Owner DNS evidence now shows Namecheap BasicDNS, DNSSEC/Dynamic DNS disabled,
no domain redirects and Custom MX. The latest expanded owner view explicitly
names `atmoshaper.com` and shows the Google ownership TXT plus both mail TXT
records. The full visible SPF value and shortened DKIM prefix match unchanged
complete values read at both authoritative servers. Hash-verified copies and
full recovered values are saved privately. An earlier desktop view adds an
email-related CNAME. Paired reads preserve eight known rows: two apex A,
two CNAME, one ownership TXT, one mail MX and two mail TXT records; the seven
earlier values remain unchanged. The extra CNAME's exact consumer is unproved.
No CNAME is returned at either mail TXT owner. Preserve
TXT wire chunks and MX priority; observed DNS TTLs are separate from the owner's
Automatic setting. The latest view has Show Less visible and six Host Records
plus Custom MX. The earlier incomplete-display TXT check is resolved; retire
its support request. The exact UI actions that produced expansion are unknown.
The earlier CNAME still resolves unchanged but is absent from this latest image;
retain it in the preservation comparison. Do not infer whole-zone completeness
from one image or known-name queries; reconcile all owner-visible and published
records, including any managed/automatic records, before nameserver cutover.
Independent direct DNS reads reconfirm both mail TXT values at both Namecheap
servers, matching the prior reads. Account-subdomain NS/SOA reads return no data;
separate account DNS hosting is not established. Namecheap's
[TXT guide](https://www.namecheap.com/support/knowledgebase/article.aspx/317/2237/how-do-i-add-txtspfdkimdmarc-records-for-my-domain/)
places these record types in Advanced DNS Host Records for BasicDNS. Preserve
their complete values; no TXT recreation or missing-TXT support contact is needed.
Namecheap documents a read-only
[getHosts method](https://www.namecheap.com/support/api/methods/domains-dns/get-hosts/).
The installed connector supports registration checks only; no authenticated DNS
API access is available here. That method or an owner-provided full record list
can resolve any remaining inventory discrepancy if required; the earlier support
request about missing TXT entries is superseded. Do not request a new token or
mail-service reconfiguration for the completed TXT evidence check.

Cloudflare [requires a zone in the bucket's account](https://developers.cloudflare.com/r2/buckets/public-buckets/#add-your-domain-to-cloudflare).
Its [partial CNAME setup](https://developers.cloudflare.com/dns/zone-setups/partial-setup/)
requires Business or Enterprise. Do not buy a plan, substitute a legacy zone
identifier or point a CNAME at the development endpoint as a shortcut.

1. Obtain authorized read access to the complete authoritative zone, registrar/
   nameserver and DNSSEC configuration. Public lookups cannot discover every
   record. Save the baseline privately, including TTLs and any registrar
   forwarding/synthetic features a simple DNS export omits.
2. Identify website/apex/www routing, Vercel verification, mail/DKIM/SPF, Google
   ownership dependencies, CAA, wildcard/delegated records and DNSSEC/DS state.
   Preserve values and behavior; do not add DMARC or change mail routing as an
   unreviewed side effect of this media operation.
3. Compare an eligible full Cloudflare zone in the verified storage account with
   that baseline. Record exact plan/cost, nameservers, permissions, DNS-only/proxy
   decisions, DNSSEC sequence and propagation window. Keep website/mail records
   DNS-only unless separately reviewed.
4. Prepare the exact zone/import/nameserver-change packet, complete comparison,
   bounded resolution checks and old-nameserver rollback. Even creating a pending
   zone is a provider write. Obtain approval for the concrete packet first.
5. Verify the approved zone is active, belongs to the storage account and retains
   every baseline record. Check proposed host collisions and zone holds before
   preparing the R2 binding operation.

The private candidate retains known records and owner controls. Parent DS and
proposed-host collision reads are complete at the dated checkpoint. Full
unfiltered record completeness, staged record access and readback,
TTL/proxy decisions, propagation and exact rollback still gate live cutover.
Agent dashboard policy remains unresolved; do not bypass it.

### Completed approved stage: one pending Free zone

The protected proposal targets only `atmoshaper.com` in the existing verified
R2 account. Cloudflare's [create-zone API](https://developers.cloudflare.com/api/resources/zones/methods/create/)
creates a pending zone; the [full-setup guide](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/)
separates domain addition, record review and registrar nameserver replacement.
The owner procedure required one creation, exact account readback and Free selection
with no paid subscription/trial operation. Do not assume the API's plan default.
If a prior or uncertain request may have created the zone, read and reconcile it
before retrying; do not blindly create a duplicate.

The owner approved only pending Free-zone creation and settings verification,
then completed the dashboard creation with manual DNS entry. Exact native
readback verifies the pending full zone, correct account, Free plan and two
assigned nameservers. The owner-visible DNS table is empty. The DNS-record API
returns 403 under the current grant; it did not provide complete paginated
inventory, and no login/token recapture or scope expansion was attempted.
Namecheap remains authoritative in fresh direct and recursive NS reads.

Do not repeat zone creation. No record import, proxy/DNSSEC change, registrar
nameserver update, R2 binding or deployment is part of this completed stage.
The known eight-row baseline remains private for comparison; exact TTLs remain
undecided because the owner's Automatic setting is not a numeric TTL. Complete
legacy inventory, usable staged record access and readback, TTL/proxy decisions,
refreshed preflight and exact rollback must be prepared before separate record
or nameserver approval. Agent dashboard policy remains unresolved and is not
bypassed. Approval did not expand the existing read token.

### Completed approved staging: import, direct readback and protected export

The owner imported the prepared eight-row file on October 9. Screenshots show
all eight rows: two A, two CNAME, one MX and three TXT records, all DNS-only
with five-minute TTL. The file's four explicit `cf-proxied:false` tags override
the accidentally selected import checkbox, as documented by
[Cloudflare's import rules](https://developers.cloudflare.com/dns/manage-dns-records/how-to/import-and-export/).
No correction or repeat import is needed. The approved 300-second TTL remains
separate from the former Namecheap Automatic display setting.

Fourteen queries at the two assigned pending authorities match all complete
values and TTL 300, including MX priority 10 and complete TXT content. Fourteen
current-authority queries preserve the same values; direct/recursive NS reads
retain Namecheap. All four pending SOA/NS controls pass. The local response
adapter was corrected and verified with invented records before the successful
comparison; failed writer/adapter attempts remain private historical evidence.

The owner supplied the staged zone export. Local verification at October 9,
16:20 UTC matches every application record against the frozen approved BIND
file and preservation values: eight rows, MX priority 10, TTL 300 and four
explicit eligible DNS-only tags. The two generated NS entries match the assigned
zone nameservers and its single SOA has the expected zone structure; these are
zone scaffolding, not an authority change. A byte-identical backup and hash receipt
are saved with owner/SYSTEM-only access, preserving the original download.
No provider request or write occurred in this export comparison.

The staging export/backup gate is complete. Agent dashboard policy and the
record-list API denial remain unresolved; direct DNS, owner-visible settings
and this full staged export supply scoped evidence without expanding credentials.

This does not establish complete old-zone inventory, activate the domain or
approve nameserver changes. Preserve the known earlier mail CNAME, every current
row and existing Namecheap authority. Full legacy comparison, export/configuration
readback, fresh parent delegation/DS, exact propagation and saved-nameserver
rollback still precede a separate nameserver packet. No agent DNS write, registrar,
DNSSEC, new media host, mail policy, bucket/object or hosting change occurred.
Leave Continue to activation untouched.

## 2. Prepare only two new public delivery bindings

After the zone gate, privately prepare exact existing public/anatomy bucket
references, active zone, proposed hosts, minimum TLS and readbacks. Add branded
bindings while retaining both old custom domains. Keep private media without
custom domains or public development access. An empty owner count does not
authorize deletion or future personal/clinical storage.

Scope excludes bucket rename/create, object upload/copy/delete, lifecycle change
and private-object inspection. Preserve public GET/HEAD CORS. Missing anatomy
CORS does not by itself prove ordinary image display fails; identify offered
canvas/export needs before preparing any exact origin/header change. Cache
policy, admin roles, operational credentials, billing/usage and recovery need
verification before declaring resource independence. Keep the read token narrow.

## 3. Review every AtmoShaper consumer

Use the [consumer map](../../wiki/media-independence.md) for source owners:

- Signature audio: change the base and every absolute rendition URL through the
  catalog builder, recompute revision, and preserve hashes, IDs, pool order,
  rights and browser format selection.
- Generative audio: change both index locations and nested sample destinations,
  using a versioned metadata release or narrowly reviewed runtime mapping.
  Preserve instrument groups/formats and old indexes for legacy consumers.
- Published Chimer and earlier fallback: bind both exact branded release bases;
  retain relative paths, aspect/rendition matrices, checksums and selected-
  background access. Published-catalog success alone does not cover fallback.
- Anatomy: obtain exact aggregate-only database target authority before choosing
  a scoped URL migration or runtime mapping. No row export, seed/backfill or
  upload is implied; preserve reviewed image identity and admin ownership.

Do not rerun completed uploaders to create a new label. Validate URL/path/revision
transformations locally with invented data and actual helpers, then use the
authorized source publication/review loop. Hosted build bindings, provider
changes and exact-artifact public promotion remain separate operations.

### October 9 local Generative.fm preparation

The narrow runtime mapping is prepared locally. The public build setting
`NEXT_PUBLIC_GENERATIVE_FM_MEDIA_ORIGIN` defaults to the retained legacy host;
the exact proposed branded host is its sole additional allowed value. Both
index and nested payload URLs move together, and both in-memory preparation
caches partition by origin. Instrument/note keys, literal paths, formats,
ordering and old indexes remain unchanged. Invalid settings or branded fetch
errors stop rather than silently retry the old host.

Focused invented-response regressions cover the actual loader/provider/runtime
prewarm and cache path, including rollback, exact-origin boundaries, invalid
configuration, a third-party index with old-host payloads and lazy WAV fallback.
No audio graph, application, provider or remote object starts. See the
[consumer runbook](../../wiki/media-independence.md) for the named check.

This preparation does not set a hosted value, bind a media domain, verify
payloads/playback or cover Signature audio, Chimer's two bases or anatomy.
Source publication/reviews and the existing DNS, R2, build/release and acceptance
gates still apply. Clearing the hosted opt-in requires an approved rebuild;
old domains/objects/indexes remain available for that rollback.

### October 9 local Signature catalog candidate

The metadata-only preparation command now rebuilds all 1,800 rendition references
through the existing release builder, with a changed checksum-bound revision.
The original and normalized revision, approved rights, exact object paths,
repeated rendition ownership and full counts must pass first. All catalog
identity/playback/provenance and declared payload metadata remain intact.
Reverse rebinding reproduces the original catalog exactly.

Default execution only plans; explicit candidate export creates a new local file
exclusively. The branded candidate is retained privately and current runtime data
is unchanged. No credential/dotenv, payload read, encoding, provider request,
upload or media mutation occurs. Whole-catalog, revision, rollback and invented
boundary tests pass. The [runbook](../../wiki/media-independence.md) lists the
named plan/test commands.

After verified DNS/R2 binding and exact source authority, install the reviewed
candidate through the source/review loop before an approved candidate build,
playback/legacy acceptance and final exact-artifact public rollout. Do not run
the existing staging/upload tool merely to change delivery URLs. Its historical
encoding/upload receipts remain complete. Both Chimer bases and anatomy are
still separate required consumer work.

### October 9 local Chimer binding plan

The no-write metadata command checks both delivery paths through actual runtime
helpers and complete committed declarations. It resolves 1,476 published
renditions and 84 vertical posters, preserving the 84-entry approved release.
The earlier 83-entry fallback is independently compared with its index; all
593 URL references retain paths, identities, geometry and checksum metadata.

The published proposed base is
`https://media.atmoshaper.com/chimer/background-preview-catalog/catalog-approved-1`;
the earlier fallback proposed base is
`https://media.atmoshaper.com/chimer/background-previews`. They are separate
public build settings, with no provider write or runtime-data change. The
protected plan retains complete counts and source hashes. Its focused checks,
lint and typecheck pass; the [runbook](../../wiki/media-independence.md) lists
the named plan/test commands.

Current hosted values have not been inspected by this command. A previously
absent published setting would activate the existing published-catalog path;
include that behavior explicitly in a later configuration/acceptance approval.
First verify exact branded domains and object namespaces, then prepare the
candidate build, all offered aspect/codec/fallback checks and saved-binding
rollback. Resolution and declared bytes do not prove hosted payloads, playback
or legacy continuity. Anatomy's [count-only inspection plan](2026-10-09-atmoshaper-anatomy-media-inspection.md)
now distinguishes the study loader from broader entity-detail media. Its
protected schema/count queries remain unexecuted and require exact target/read
authority; the current resource metadata does not prove deployed branch binding.

## 4. Bounded acceptance and rollback

Specify immutable object/index allowlists, request count, streamed-byte caps,
request/overall deadlines, final candidate and browser journeys in the approval
packet. Include retained legacy paths; no broad crawl or full-bucket download.

1. Read back ownership/TLS, old domains, CORS/cache and disabled public development
   access, with private access unchanged. Verify agreed GET/HEAD/range responses,
   types, lengths and headers; record exactly which remote bytes were compared.
2. Check actual browser audio/generative playback, authored previews/posters,
   fallback, entitlements and reviewed anatomy images on the approved release.
   Preserve geometry and verify the user's legacy Clock/tool media/auth paths.
3. On failure restore only approved AtmoShaper source/build bindings and saved
   settings. Disable/remove only newly owned domains when explicitly authorized;
   retain old objects/indexes/domains. DNS recovery uses the full baseline and
   agreed DNSSEC sequence, not automatic zone deletion. Do not clear browser
   storage, redirect legacy endpoints or retire the old site.

## Completion boundary

Read access and configuration inventory are complete for the three specified
buckets. DNS onboarding, branded delivery, admin/billing and playback/legacy
continuity are not complete. Retirement requires separate exact approval after
retained consumers and recovery clear. Ably, operational Sentry, Calendar,
additional purchase paths and mail/support remain in the independent plan.
