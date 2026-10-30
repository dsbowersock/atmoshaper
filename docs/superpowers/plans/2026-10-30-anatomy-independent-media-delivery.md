# Anatomy image delivery binding — local source preparation

## Purpose and authority

Prepare the missing anatomy consumer binding for the existing independent-media
migration. The owner selected `anatomy-media.atmoshaper.com`; provider setup is
still incomplete. This plan authorizes no credential, provider, database, Windows
security, object, publication, build, deployment or public configuration action.
Existing private windows are closed and the owner reports the temporary R6 token
revoked. Do not reuse it or the expired ownership-correction card.

Aegis and Superpowers shape this slice because one shared public projection feeds
flashcards and local/remote Anatomime, while durable answers, review decisions,
source credits and caches must retain their contracts. Change necessity: changing
the upload base cannot redirect already-selected stored URLs. A view-only binding
avoids rewriting records or broad replacement of source/reference links.

## Baseline and architecture

- Reuse the current bound clean workspace; no new worktree. Preserve the separate
  documentation branch and its clean candidate.
- Start from locally retained reviewed integrated source
  `908cba9f5c2a398518bf20e46acb76a33dc46c18` on the new local branch
  `codex/anatomy-independent-media-delivery`. It was imported from the existing
  local documentation clone, without network or a claim of fresh remote state.
- The original workspace and documentation candidate have identical tree
  `f94cb0eb9cb5cf917cf5ee6f3d9de52c700a41a2`; their difference from that integrated
  source is twelve documents and one static notice. Preserve those histories.
- `lib/anatomy-study.ts` owns the public projection after asset/link eligibility.
  `lib/anatomy-study-media.ts` supplies raw projected DB options and a 60-second
  cache. Anatomime instead constructs seed-only cards/prompts through the same
  public study owner. Do not add queries or change either cache's inputs.
- Rejected/unreviewed DB links must continue overriding seeded approvals before
  public filtering. Retain source restrictions, ordering, nullish URL precedence,
  model exclusion and every existing eligibility rule.

Architecture review is required for the new build-setting/consumer boundary;
one pure helper and the existing canonical projection remain the sole delivery
owners. No generic rewrite framework or second eligibility owner is needed.

## Exact source contract

1. Add one direct public build setting, `NEXT_PUBLIC_ANATOMY_MEDIA_ORIGIN`.
   Unset/empty or the exact legacy origin preserves every URL byte. The only new
   accepted value is `https://anatomy-media.atmoshaper.com`; reject malformed or
   other values with a fixed error, without echoing values.
2. Capture/validate the setting once in the study module, before module-built
   cards or prompt caches. It is immutable for an artifact, not a per-request
   switch. Invalid configuration must not be swallowed by a catch-to-empty or
   seed-only fallback. Enabling/changing it later requires its own build/release.
3. At the final existing `AnatomyStudyMedia.url` projection only, rebind eligible
   IMAGE/DIAGRAM delivery URLs on the exact literal legacy anatomy origin to the
   exact branded origin. Preserve the complete literal suffix, including encoded
   paths, repeated slashes, query order and fragment. Do not use URL serialization
   to normalize object identity. Respect the origin boundary; lookalike hosts,
   userinfo, other origins and relative references remain unchanged.
4. Preserve `source_link` and other media-type behavior rather than tightening
   existing public type filters. Do not alter `sourceUrl`, license URLs, source
   references, credits, raw assets/maps/links, IDs, answers, grading, seed
   declarations, upload variables or database records.
5. Never manufacture a hosted URL from `storagePath`. A seed without a selected
   remote/thumbnail/override URL stays without delivered media. Held/rejected and
   model entries stay excluded before delivery mapping.
6. No fetch, retry or automatic legacy-host fallback belongs in this helper.
   The normal image consumers use the selected URL. Default behavior is retained
   until the separate candidate setting is deliberately enabled.

The committed legacy origin is supported by the existing source documentation
example, `https://anatomy-media.massagelab.app`; it is **not** a current inventory
of private DB URLs. This local candidate proves mapping for matching URLs, not
actual hosted-origin distribution, object existence, rights admission, CORS,
playback or complete live binding. Those facts must be established before enablement.

## Implementation and verification

TDD route: **auto / strict**, for shared producer/consumer and compatibility
behavior. No configured off mode was found. Use a meaningful actual-projection
assertion that fails on the current source under the proposed opt-in, followed
by focused regression checks. A missing-module failure alone is not evidence of
the current projection gap. All checks are provider-free/source-only.

- [ ] Add a named focused npm test entry and an actual study-projection fixture;
  retain the initial failure on the unchanged production projection.
- [ ] Implement the small typed pure delivery helper/normal JS bridge and wire
  it at the one shared projection; document intent and immutable build scope.
- [ ] Test default and reverse/rollback equality; exact origin and suffix bytes;
  map/remote/thumbnail precedence; unchanged caller inputs, sources, IDs, order,
  answers and grading; rejected-link/model/held filtering; source-link retention;
  invalid configuration; actual study/Anatomime shared-owner wiring.
- [ ] Use real production projection with invented public fixtures or dependency
  doubles. Never import/execute the real Prisma owner or read a live row. Keep
  the loader query and its rejected-link propagation unchanged.
- [ ] Add a short media-runbook entry and sanitized audit. Preserve the distinction
  between local source proof and pending exact-artifact/provider acceptance.
- [ ] Run the focused suite and relevant existing study, attribution, Anatomime,
  flashcard-progress and transfer-hardening source checks, scoped lint,
  nonincremental typecheck and diff checks. No app/build/browser/DB campaign.
- [ ] Obtain SPEC then independent QUALITY review, correct valid findings, run
  fresh necessary root checks, and make one scoped local commit. No push/PR/merge.

## Completion and retirement

This source slice is complete when the coherent local change has applicable
reviews and fresh source-only verification, the default output remains exactly
compatible, and the consumer/binding limitations are explicit. It does not close
the media or migration goal. Keep the legacy delivery path for the default and
rollback; retirement or broad data rewriting is neither needed nor authorized.

Next actual enablement still needs verified branded delivery, bounded actual
origin coverage and accepted cohort, exact source/configuration/artifact agreement,
and separately approved publication/build/release operations. Both public apps,
original buckets, PHI/local records and unrelated work remain preserved.
