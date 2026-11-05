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
