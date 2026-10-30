# Anatomy image delivery binding — source-only candidate

The local candidate adds a pure typed delivery helper and one wiring change in
the final shared study-media projection. `NEXT_PUBLIC_ANATOMY_MEDIA_ORIGIN` is
validated once before study cards/caches initialize. Unset, empty or exactly
`https://anatomy-media.massagelab.app` preserves existing URLs; the sole opt-in is
exactly `https://anatomy-media.atmoshaper.com`. Other values throw a fixed error
without echoing configuration. This is an immutable build setting, outside
request catch-to-empty/seed fallback paths. Rollback requires an authorized
build/release with the setting unset or explicitly legacy.

Only the already-selected public image/diagram `url` on the literal exact legacy
origin changes. Literal suffix bytes survive unchanged. Existing eligibility,
rejected/unreviewed link overrides, ordering, map/remote/thumbnail nullish
precedence and model exclusion are retained. Source-link/audio/video behavior,
source and license URLs, credits, input options, IDs, answers and grading stay
unchanged. Raw DB projection/query/cache code and seed/upload declarations are
untouched. No hosted URL is invented from `storagePath` or `sourceUrl`.

## Verification receipts

TDD route is auto/strict under the implementation plan. The retained RED ran the
actual unchanged production projection with an invented reviewed image map and
the proposed opt-in: it returned the legacy URL instead of the branded URL.
This was an assertion failure, not a missing-module failure. Initial GREEN
passed after the helper and wiring. Expanded GREEN passes 11 tests, covering
deep default/rollback comparison of all real-seed cards/prompts with invented
delivery fixtures; exact suffix and authority boundaries; invalid settings
before card construction; single validation and immutable later calls;
nullish/empty-map selection; review/source/model filters; ordering/credits;
absence of seed-only delivery URLs; and actual Anatomime deck/prompt and
flashcard prompt-cache integration. Grading results are compared across the
complete resulting prompt list. Tests compile real production owners with
explicit pure data dependencies and never import the real Prisma owner.

The combined focused and existing anatomy-study, region-answer, attribution,
Anatomime, flashcard-progress and Neon transfer-hardening run passes 61/61
checks. `npm run lint:anatomy-media-delivery`,
`npm run typecheck -- --incremental false` and `git diff --check` each exit 0.
Terminal evidence lives outside shared test-results in the task's private
temporary receipt directory. These are source-only checks; they do not prove a
new application build or hosted runtime acceptance.
No application build, browser, server, Docker, database, provider, credential,
ACL, media retrieval/mutation, network, dependency installation, publication or
deployment action is part of this slice.

## Limits before enablement

The only committed evidence for the legacy origin is the example at
`docs/anatomy-media-storage.md:32`. No actual DB origin distribution was read or
verified. Tests prove behavior for matching invented URLs, not coverage of
hosted rows, object integrity, rights admission, DNS/R2 configuration, CORS or
playback. Provider setup remains incomplete. Actual accepted-cohort coverage,
branded delivery, exact source/configuration/artifact agreement and separately
authorized build/release acceptance remain required. Expired private authority
and the revoked temporary token remain unusable. The source candidate does not
complete independent-media readiness or the full migration.
