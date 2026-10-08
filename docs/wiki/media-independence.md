# Independent AtmoShaper media delivery

Read [project state](../project-state.md) and the
[independent launch plan](../superpowers/plans/2026-10-08-atmoshaper-independent-launch-readiness.md)
first. October 8 source inspection and public JSON-index reads identify the
consumers below. Provider ownership, current bucket contents and final hosted
playback remain unverified.
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
| Anatomy and provider storage | No database or provider rows/objects were read; current hosted counts and ownership are unknown |

Declared bytes and hashes are metadata, not a new verification of remote bytes
or a complete bucket size/copy budget. The inventory intentionally does not
convert source-enabled audio into an observed-playback claim. These media
declarations and runtime owners are unchanged against the recorded public
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
global unique-object count. No audio/image/video payload, private object,
database row or provider configuration was read or changed. This establishes
the nested-URL cutover requirement, not playback, payload integrity, bucket
contents, ownership or a storage-copy budget.

## Provider read gate and exact operation

The owner-requested Cloudflare login begins with account/user/zone read scopes.
The owner completed login on October 8 and supplied a separate encrypted API
token with confirmed storage Read/account coverage. Its self-verification shows
administrative status `active`, but a future October 31 start date. That time
restriction explains the recorded HTTP 401/code `10000`; it is not evidence of
an empty inventory or media outage. The owner can open existing bucket Settings
and supplied evidence of an active public custom domain and disabled public
development URL. Agent dashboard access remains blocked by browser policy.

The pending owner action is to correct only the existing token's start date,
preserving its expiry and permissions. No replacement or re-entry is needed.
After owner confirmation, verify that the same saved credential is within its
valid time window, then make one standard canonical bucket-list GET. Continue
pagination/configuration reads only after that succeeds; a further denial needs
new precise evidence, not repeated identical attempts. Cloudflare's
[bucket-list API](https://developers.cloudflare.com/api/resources/r2/subresources/buckets/methods/list/)
accepts `Workers R2 Storage Read`; use read access rather than expanding to
unneeded storage mutation. Store credentials and resource references privately.

Read all pages of bucket metadata and the relevant jurisdiction, custom-domain
bindings/status, managed-public-access state, CORS, cache rules, administrative
roles and aggregate usage/billing. Do not list private object content, use
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
