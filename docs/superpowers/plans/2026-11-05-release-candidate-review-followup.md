# Release candidate review follow-up

November 5, 2026. Local corrective source; publication remains separate.

## Purpose and boundaries

The published candidate's review identified two reproducible runtime gaps and a
missing worker regression. Keep the published source and both public sites intact
while preparing this branch. No database, provider configuration, credential,
payment, email or media request is needed for these corrections.

## Corrections

1. Validate every explicitly selected image against the complete eligible prompt
   pool before count sampling or mastered-prompt filtering. A successful but
   incomplete catalog must retain the existing retry response instead of silently
   starting a smaller text-only deck. Preserve intentionally smaller counts,
   mastered-image filtering and broad text fallback.
2. Require the new anatomy bucket and branded public URL together, even when the
   public delivery setting is unset. Reject mismatches before source download or
   object upload. Preserve the existing valid legacy pair and exact branded pair.
3. Exercise the actual worker's allowlisted public navigation cache read and its
   shell-cache miss fallback while a competing unrelated cache exists. No worker
   runtime change is required.

## Stripe review disposition

The endpoint-selection change checks complete inventory, enabled uniqueness and
mode. It does not prove that the separately configured signing secret belongs to
the selected endpoint. The existing secret check only establishes presence and
syntax; invalid runtime signatures are rejected before processing. Preserve the
existing pending gate for exact deployed-secret binding and signed delivery with
fulfillment on the offered artifact. A new confirmation flag would not establish
that proof, and no provider activation is part of this source follow-up.

## Verification

The new selected-image and default-origin upload controls both failed against the
published source; the worker coverage passed. With the local corrections, all
20 tests in the three focused files pass under the existing network-denial
preload with invented provider/auth data. No real database or provider was used.
The related Flashcards suite passes all 37 tests, including legitimate one-card
sampling and mastered-image filtering. Its old source contract named the deck
wrapper; it now accepts the same cached full-pool owner used before sampling.
Repository lint, nonincremental type checking and whitespace checks passed.

Independent source review found no actionable issue in the corrective runtime
and regression changes. An independent structural comparison also covered the
large audio catalog that the hosted reviewer could not read: all 1,801 URL changes
replace only the exact legacy origin and preserve every suffix byte. Structure,
ordering and array lengths match, and catalog revision is the sole other value
change. Applying those substitutions reproduces the full committed blob. This
closes the source-review omission, not hosted audio-delivery acceptance.

The published candidate's seven CI jobs and protected automatic Preview passed.
Those results cover that published head, not this corrective source. Do not spend
the remaining branded Preview on a known incomplete source. Prepare one concrete
new-head continuation after the corrections and independent review are complete.
No merge or public rollout is included.

## Equivalent upload origins

The next completed included review found one remaining pairing bypass: mixed
hostname casing or explicit HTTPS port 443 was not recognized as the branded
host with the delivery flag unset. The new negative control failed against the
published corrective source. The upload guard now detects equivalent hosts with
the URL parser and accepts only the matching new bucket and clean HTTPS root.
Accepted branded bases produce the canonical origin. Prefixed paths, query,
fragment, userinfo, nondefault ports, HTTP and trailing-dot authorities are
rejected before any fetch. Valid legacy/custom prefixes and private legacy
uploads without a public base remain supported. This changes future import
validation only; it performs no upload or database operation in this campaign.

All 37 focused/related tests, named media lint (including the upload helper),
nonincremental type checking and whitespace checks pass. Independent review of
this exact three-file correction found no actionable issue. Hosted checks and
the next applicable included review still need to cover the resulting head.

## Final URL representation controls

The completed included review of `2e1fc15` found two additional cases, including
one outside the diff. An empty query or fragment delimiter serializes in the
URL even though its `search` or `hash` accessor is empty. The anatomy uploader
now requires the complete serialized branded root, so these forms are rejected
before any source fetch or upload. Equivalent casing and HTTPS port 443 remain
accepted and canonicalized.

The audio release resolver now compares parsed origins for its known branded
and legacy bucket guards. It preserves the supplied base spelling and path in
the staged manifest; this is classification for bucket pairing, not a rewrite
of existing object paths. Equivalent known authorities cannot bypass either
guard, while valid branded, legacy and custom-prefix destinations retain their
configured base. These are future tool validations; no media operation ran.

The added controls failed against `2e1fc15` (16 passed, two failed), then all
43 focused/related tests passed with the corrections. The first local launch
lacked its dependency junction and stopped at imports; that infrastructure
failure is separate from the reproduced assertions. Cached dependencies were
linked for the actual checks without a download. No protected app build,
database, credential or provider access was part of these source checks.

Named lint, nonincremental type checking and whitespace checks pass. Independent
review found no actionable issue in this exact five-path delta. Applicable
source coverage combines the completed included reviews through `2e1fc15` with
that substantive independent correction review; it is not a literal full
CodeRabbit review of the final follow-up hash. The Calendar ingress blobs are
unchanged. Final-head CI and protected artifact/browser acceptance remain open.
