# Independent AtmoShaper media delivery

Read [project state](../project-state.md) and the
[independent launch plan](../superpowers/plans/2026-10-08-atmoshaper-independent-launch-readiness.md)
first. October 8 source inspection, public JSON-index reads and authenticated
bucket configuration reads identify the consumers and settings below. Owner
aggregate counts are separately labeled. Independent administration/billing,
object-level integrity and final hosted playback remain unverified.
This is the source-side cutover map, not an upload or retirement instruction.

## Reuse before copying

Cloudflare supports attaching a custom domain to an existing public bucket;
that can provide branded delivery without copying its media. The documented
[bucket PATCH](https://developers.cloudflare.com/api/resources/r2/subresources/buckets/methods/edit/)
changes the default storage class, not the bucket name. Read the actual owner,
account, bucket/domain bindings, billing and remaining consumers before choosing
an in-place domain/administration change or a new independently owned resource.
An extra domain alone does not prove lifecycle or administration independence.

Preserve legacy delivery while the user's MassageLab clock and tools depend on
it. Internal storage-variable names, object paths, selected-background IDs,
checksums and provenance are compatibility contracts. They need not change just
to remove public branding. Keep the public interface, ownership and recovery
requirements separate from those stable identifiers.

## Source consumer map

| Consumer | Current binding in source | Cutover work |
| --- | --- | --- |
| Signature audio in Atmosphere | [Committed production catalog](../../data/atmoshaper/production-audio-catalog.json) supplies absolute URLs through the [runtime catalog](../../lib/atmoshaper/production-catalog-runtime.ts) and [format selector](../../lib/atmoshaper/production-catalog.js) | Update every rendition URL together with the declared base using the [catalog builder](../../lib/atmoshaper/production-release-builder.js). Recompute the catalog revision; preserve payload/format hashes, IDs, pool order, playback rules and rights. Changing the base field alone does not redirect playback |
| Generative audio in Atmosphere | [Station metadata](../../lib/atmosphere/generative-fm-catalog.js) derives hosted index URLs from the [shared public base](../../lib/atmosphere/observable-streams-adaptation.js); the [index reader](../../lib/atmosphere/generative-fm-sample-index.js) uses the returned sample URL values | Inspect the offered indexes as public metadata under the approved read scope. Update both index locations and nested sample destinations if they retain legacy URLs. Use a versioned metadata release or separately reviewed runtime mapping; preserve old metadata for legacy tools |
| Published Chimer preview catalog | [Runtime resolver](../../lib/background-preview-runtime.js) combines relative paths from the [published manifest](../../data/background-preview-published-manifest.json) with `NEXT_PUBLIC_CHIMER_PREVIEW_CATALOG_BASE_URL` | Bind the verified branded custom-domain release base at build time. Preserve every relative path, rendition matrix and checksum. No media re-encoding or payload copy is inherently required |
| Earlier Chimer preview fallback | [Fallback manifest](../../components/backgrounds/backgroundPreviewManifest.ts) uses `NEXT_PUBLIC_CHIMER_PREVIEW_MEDIA_BASE_URL` or its legacy Production base | Bind the fallback too; do not silently assume all callers use the published catalog. Keep the earlier object namespace reachable until callers and rollback have been verified |
| Anatomy study images | [Study-media reader](../../lib/anatomy-study-media.ts) selects reviewed public media URLs from database records; the [admin upload owner](../../lib/anatomy-media-review-server.ts) uses the established R2 variables | A new upload base does not change existing records. Obtain exact aggregate-only database inspection authority before choosing a scoped URL migration or runtime mapping. No row export, blanket seed or upload is implied |
| Rendered backgrounds, local assets and external sources | [Background registry](../../components/backgrounds/backgroundRegistry.ts), bundled components and retained provenance distinguish rendering assets from attribution/source links | Verify actual asset requests on the final offered backgrounds. Keep licenses and attribution; a reference link is not necessarily a runtime storage dependency. Do not widen the catalog or fetch upstream media as an inventory shortcut |

## Local Generative.fm delivery preparation

The current local source adds `NEXT_PUBLIC_GENERATIVE_FM_MEDIA_ORIGIN` to the
browser runtime. Unset, empty or `https://media.massagelab.app` preserves existing
delivery. The sole opt-in is `https://media.atmoshaper.com`, the proposed public
host; other values are rejected before index fetching. No hosted setting or
domain binding has been added. Next embeds this public value at build time, so
changing it later requires a separately approved build and release.

The actual index loader maps both its request URL and nested string/array/note
collection values on the exact old origin, retaining literal object paths,
query/fragment suffixes, keys and order. Relative and other-origin references
retain their semantics. The original index object and old hosted indexes remain
unchanged. Both preparation caches include the delivery origin, preventing a
cached old payload set from satisfying new-host preparation. An opt-in failure
stays visible; there is no automatic fallback that would falsely pass acceptance.

Run `npm run test:generative-media-delivery` for invented-response checks of the
index loader, bounded provider and actual runtime prewarm/cache behavior, plus
related ownership/lazy-loading contracts. No remote media, audio graph or
application/provider starts in these tests. Type checking and lint also apply.
Actual browser playback and retained legacy-tool continuity still need their
separate bounded acceptance packet. Signature audio, both Chimer preview bases
and anatomy are separate required consumers, not covered by this switch.

## Local Signature catalog preparation

Run `npm run migration:media:signature-catalog` for a metadata-only, no-write
candidate plan. It uses committed public declarations and the existing release
builder to rebind every rendition URL to the exact proposed branded public host
and recompute the catalog revision. Raw and normalized metadata must both match
the input revision. Rights, summary counts, exact content-addressed paths and
repeated rendition owners are checked before preparing output.

The complete candidate keeps 51 concepts, 450 source references, 410 payloads,
1,800 format references and 1,640 distinct format objects. Declared format bytes
remain 6,308,427,694; no remote bytes are newly verified. Concept/source identity,
pool order, rights, playback policies, timings, hashes and sizes remain intact.
The candidate revision differs because URLs change. Reverse rebinding restores
the original catalog exactly; the established digest collation remains unchanged.

An explicit `-- --output NEW_LOCAL_FILE` exclusively writes a new candidate
file, never overwriting the current catalog or existing evidence. A verified
candidate is retained privately. This command loads no dotenv/credentials or
provider/upload client, reads no source audio and performs no encoding, remote
request or media mutation. It does not install the candidate into the runtime.

Run `npm run test:signature-media-delivery` for whole-catalog equality, revision,
rollback, browser-format and invented drift/ownership rejection cases, including
exclusive-output preservation. Source candidate installation/reviews, verified
branded bindings and separately authorized playback/legacy continuity remain
required. The current published/default catalog is unchanged.

## Reproducible source inventory

Run `npm run migration:media:inventory`. The command reads only the local public
declarations and pure catalog helpers. It does not load dotenv, credentials,
application/database owners or provider clients, request hosted objects, write
files, or start an application. It reports counts without resource identifiers
or URLs and stops if duplicate object declarations disagree on checksum/size,
audio summary counts disagree, or published runtime background IDs drift.

The October 8 result is:

| Declaration | Source evidence |
| --- | --- |
| Signature audio | 51 concepts, 450 source references, 410 distinct payloads; 1,800 format references and 1,640 distinct format objects, all still referencing the legacy media origin |
| Signature declared format bytes | 6,308,427,694 bytes across distinct declared format objects, including source WAV and browser renditions |
| Published Chimer previews | 84 backgrounds: 82 animated and two poster-only; 1,728 distinct objects with 862,078,635 declared bytes; URLs are relative and runtime background IDs match |
| Generative audio | 57 station declarations, all source-enabled with hosted index declarations; hosted nested URLs and actual playback have not been inspected by this command |
| Earlier Chimer fallback | Separate source inspection finds 83 manifest entries; this namespace is not included in the published-catalog object/byte totals |
| Anatomy and provider storage | This local command reads no database/provider rows or objects; later configuration reads and owner aggregate counts are recorded below, without object-level verification |

Declared bytes and hashes are metadata, not a new verification of remote bytes
or a complete bucket size/copy budget. The inventory intentionally does not
convert source-enabled audio into an observed-playback claim. At that inventory checkpoint, these media
declarations and runtime owners were unchanged against the recorded public
`38d0ded` source; hosting/configuration receipts retain their recorded dates.

## Bounded public index inventory

Run `npm run migration:media:public-inventory` for a no-network allowlist plan.
The explicit `-- --read-public-metadata` flag reads only the source-declared
primary and format JSON indexes on the existing public media host. It omits
credentials/cookies, refuses redirects and signed/credentialed destinations,
validates each station's required instrument groups, and never requests samples.
Four workers share a three-minute deadline and 32 MiB processed-JSON budget;
each index has a ten-second deadline and 2 MiB body limit. An excess chunk aborts
all workers before retention. Reported byte limits bound processed metadata,
not a promise about wire overhead. Failed or unvisited indexes make the result
incomplete; only aggregate counts and bounded error codes are emitted.

The October 8 read completes all 228 indexes with zero failures or unvisited
indexes, processing 867,736 bytes of JSON. It finds 6,800 sample references,
all absolute URLs using the legacy media origin, with no other or relative
destinations. Distinct counts are per index and summed across indexes, not a
global unique-object count. This public-index command reads no audio/image/video
payload, private object, database row or provider configuration and changes none. It establishes
the nested-URL cutover requirement, not playback, payload integrity, bucket
contents, ownership or a storage-copy budget.

## Verified provider inventory and remaining domain gate

The owner corrected the existing token's dates on October 8. Self-verification
matches the saved identity, reports active status and a valid start/expiry window;
the canonical bucket-list GET now succeeds. The former future start date explains
the historical HTTP 401/code `10000`. No replacement, re-entry or broader storage
permission is needed. Cloudflare's
[bucket-list API](https://developers.cloudflare.com/api/resources/r2/subresources/buckets/methods/list/)
accepts `Workers R2 Storage Read`. Exact references and credentials remain private.

Default-jurisdiction metadata returns three buckets. EU and US reads return none;
these lists have no returned continuation cursor. Federal jurisdictions remain
unavailable/unverified, so this does not claim complete account-wide storage.
All three verified buckets use Standard storage in Eastern North America.

| Media class | Authenticated configuration | Owner screenshot, rounded |
| --- | --- | --- |
| Public audio/previews | One enabled legacy custom domain, ownership/TLS active, minimum TLS 1.2; GET/HEAD CORS allows all origins and exposes range, cache, type, length and ETag headers | 11.11k objects, 13.13 GB |
| Anatomy | One enabled legacy custom domain, ownership/TLS active, minimum TLS 1.2; provider explicitly reports no CORS configuration | 5.1k objects, 2.83 GB |
| Reserved private media | No custom domain; provider explicitly reports no CORS configuration | Zero objects, zero bytes |

Public development access is disabled on all three. Their returned lifecycle
rule aborts unfinished multipart uploads after seven days; no completed-object
expiration rule is returned. No domain, CORS or lifecycle change occurred.
Missing anatomy CORS is not by itself evidence that ordinary image display
fails; any canvas/export requirement needs its own consumer/acceptance proof.

The owner overview reports 15.95 GB total and zero billable usage for its shown
period. Per-bucket and total figures round independently and do not establish a
future cost guarantee, exact object inventory, payload integrity or completed
migration. No private/public object list or payload was requested.

The approved owner-led pending-zone stage is complete. Exact native readback
verifies one pending full `atmoshaper.com` zone on Free in the storage account,
with two assigned nameservers held privately. The owner view shows no staged DNS
records; the record-list API returns 403 under the current grant, so complete API
inventory is not claimed. Fresh authoritative and recursive NS reads both match
Namecheap. Do not repeat zone creation or login/token setup.
October 9 UTC direct reads find no A, AAAA,
CNAME, NS, TXT or CAA records at either proposed branded media host at both
Namecheap authorities; root CAA has no data and NS/SOA controls succeed.
Independent reads at two .com authorities also verify no parent DS. These dated
checks must be refreshed before mutation and do not prove full-zone inventory.
Cloudflare
[requires the domain's zone in the same account as the bucket](https://developers.cloudflare.com/r2/buckets/public-buckets/#add-your-domain-to-cloudflare).
Its [partial CNAME setup](https://developers.cloudflare.com/dns/zone-setups/partial-setup/)
requires Business or Enterprise; no plan purchase is authorized or assumed.
Prepare a full DNS preservation/onboarding comparison before selecting an
operation. Agent dashboard policy remains unresolved and is not bypassed.

Owner Namecheap views now show BasicDNS, DNSSEC/Dynamic DNS off, no domain
redirects and Custom MX. Desktop view adds an email-related CNAME. Fresh paired
reads agree on eight known record rows, with all seven prior values unchanged.
The latest expanded owner view now shows both mail TXT rows. Fresh direct reads
confirm unchanged full values and matching visible SPF/DKIM content, resolving
the missing-TXT check; its support request is retired. The earlier CNAME still
resolves but is absent from this image, so retain it in the private comparison.
Its exact SMTP/application consumer is still unproved.
Known-name DNS queries do not prove full zone completeness. The private candidate
preserves these known values and is explicitly incomplete/not executable; no live
DNS record, nameserver, DNSSEC or mail-routing change has occurred. The pending-zone creation stage does not authorize activation or media bindings. The owner subsequently approved staging exactly eight preserved DNS-only records at 300 seconds; the independently checked import remains unexecuted. Current-authority values match in fourteen reads, and all four SOA/NS controls at the assigned pending authorities pass. Complete legacy inventory and staged comparison still gate nameserver approval.

The [compatible cutover plan](../superpowers/plans/2026-10-08-atmoshaper-compatible-media-cutover.md)
owns that prerequisite, two proposed delivery hosts, consumer changes and saved
rollback. Administrative/billing ownership, cache rules and exact cutover cost
remain open. Do not list private object content, use
credentials downloaded for a completed earlier operation, or create buckets
because an old environment example mentions them. A reserved private-media
name is not authority to inspect, transfer or host personal/clinical records.

Before requesting mutation authority, fill one concrete packet with the exact
privately held owner/account/bucket/zone and public delivery hostname, existing
consumers, intended domain/CORS/cache changes, AtmoShaper-only source/config
changes, cost/usage bounds, immutable payload allowlist and saved rollback.
If a copy is required, derive its allowlist and byte/checksum verification from
the approved release; preserve old paths and exclude unapproved/private media.
Do not rerun the existing publication uploader just to generate a new label.

## Acceptance and rollback

1. Read back the exact authorized domain/bucket/settings and final source/build
   binding. Compare metadata revisions, object paths and hashes; verify both
   new and retained legacy URLs under the approved bounded read scope.
2. Check TLS, GET/HEAD/range behavior, expected media type, length, cache and
   allowed/exposed CORS headers. Saved example CORS is not current provider proof.
3. On the final approved artifact, verify browser-selected audio formats,
   generative index and actual sample playback, previews/posters in all authored
   aspects, selected-background behavior and reviewed anatomy images. Preserve
   the existing entitlement decision and authored geometry.
4. Observe the user's working legacy Clock/tools and their required media/auth
   paths during the transition. Restore only the authorized AtmoShaper binding
   and saved settings if acceptance fails; keep old objects and metadata intact.
5. Update the migration ledger with observed ownership, branded delivery and
   continuity receipts. Bucket or old-domain retirement needs its own exact
   approval after consumers and recovery have cleared; no expiry is assumed.
