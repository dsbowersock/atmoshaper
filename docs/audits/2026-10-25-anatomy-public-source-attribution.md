# Public anatomy attribution and source-link validation - October 25, 2026

## Result and tested owner

Source `0a28c2782772ba3ca4c08b26d465e4d7327d6a68` passes the local
source/UI gate. This follows `4a235fd` and the earlier Human Biology (`f952231`)
and Applied Human Anatomy (`8070bb0`) edition work. The closeout commit changes
only this audit, project state/log and wiki index. Nothing is published.

The checked flow renders an existing flashcard answer/image, makes its actual
credit and license available, opens the native credits disclosure by keyboard
without flipping, and isolates the inactive card face from focus. Anatomime's
existing credit footer uses the same license-label component; no room or game
was started in this phase.

## Primary evidence and repair

Four fixed anonymous publisher HTML responses are retained outside Git with
byte lengths and SHA-256 hashes in the [evidence manifest](../source-evidence/anatomy-public-source-licenses-20261025.json).

- [BodyParts3D description](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html)
  replaces the obsolete directory link that returned 404.
- [BodyParts3D license](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html),
  updated February 27, 2025, explicitly specifies CC BY 4.0 and the full credit.
  Its [update page](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/update.html)
  is retained separately. No legacy mirror grant is relabeled by inference.
- [Human Bio Media's biceps lesson](https://www.humanbiomedia.org/biceps-brachii-lesson/)
  explicitly states CC BY 4.0 and requests its free-access credit on each page
  redistributing the material. That requested credit now reaches the renderer.

The adapter preserves existing optional source/media license URLs. Shared
components render supplied credits and link only valid HTTP(S) license URLs
without embedded credentials; missing/unsafe links keep readable license text.
Image captions use the selected asset's attribution rather than a hard-coded
provider name. Two existing image generators now retain the archive's full
credit, changing exactly 92 image attribution fields. Full review/rights fields,
asset identity/content references, answers and citation records are preserved.

Two legacy source-link placeholders are reference candidates, not admitted
image/diagram questions. This repair does not change their historical metadata
or create a new release gate from unused candidates.

## Verification

| Check | Actual result |
| --- | --- |
| Original rendered regressions | Six failures retained before repair; the later full-image-credit case initially failed separately |
| Final focused suite | 201 pass, zero failures or skips, including seven actual-render attribution cases |
| Changed-file lint and typecheck | Both pass |
| Full cached webpack build | Pass at `0a28c27`; local Inter fixture, real selected DSEG7 font, no install/Prisma regeneration |
| Source integrity | All 82 archive input hashes match; worktree contents match after configured CRLF/LF conversion |
| Default study comparison | 1,271 cards and 5,582 questions preserve identity/order/answers/grading/review fields |
| Invented media-map comparison | 1,271 cards and 9,398 questions preserve the same study contracts |
| Seed comparison | Exactly two source records and 92 image attribution fields change; all citations unchanged |
| Browser interaction | Five viewports pass; ten screenshots retained outside Git |
| Runtime health | No console/page errors, failed requests, unexpected requests or overlays |
| Network/executable guards | Zero network attempts or blocked unrelated executables in final tests, lint, typecheck, builds and browser |

The seven rendered regressions cover supplied source credit/license, the real
Human Bio Media adapter credit, selected-image credit, license URL propagation,
all admitted BodyParts3D image credits, the working source URL, and unsafe/missing
license-link fallback. They render actual TSX, not an implementation-text mirror.

The browser uses actual `FlashcardSurface` React and final built CSS with real
source metadata. Only image bytes are an invented inline SVG marked as a local
fixture. Cached Playwright is used because the browser plugin was unavailable.
No local HTTP server was started; the single loopback fixture route is fulfilled
in memory. External traffic is denied. This is component acceptance, not a
whole-site, hosted-image, account, game or scientific acceptance claim.

| Viewport | Measured image height | Outcome |
| --- | ---: | --- |
| 320 x 568 | 119 px | Pass |
| 390 x 844 | 154 px | Pass |
| 640 x 360 | 30.5 px | Pass |
| 844 x 390 | 44.25 px | Pass |
| 1440 x 900 | 240 px | Pass |

Each case verifies meaningful content, no horizontal overflow/caption overlap,
keyboard disclosure without a flip, active-face focus isolation and license
links. Manual inspection of both portrait and the shortest landscape screenshots
confirms visible credits and fixture imagery. The short landscape image remains
small within the existing fixed card geometry; whole-screen image usability is
not inferred from this credit/layout check.

React review confirms a type-only study import, no data/seed bundle added to the
credit component, only used license data serialized, no hooks/effects/provider
or dependency additions, and stable top-level component definitions. Native
`details`/`summary` supplies disclosure semantics.

## Retained failures and method corrections

The first build at `4a235fd` passed, but the first browser run failed the
image-height bound at 844 x 390 after two portrait cases passed. Its exact failing
height was not retained and is not invented. Compact inline credit typography
and reduced vertical image padding correct that measured defect; outer card
geometry and full credit text remain. The second build and five-size browser run
are the final evidence. Both original build/browser receipts remain.

A VM test harness initially lacked the standard URL global; it was corrected.
Early pre-build preparation stopped for extra EOF whitespace and then raw
Git-archive/worktree line-ending differences. No build ran from those rejected
preparations. Semantic-equivalent EOF repair and Git-blob verification after
configured CRLF conversion are recorded separately, without rewriting failures.

## Cleanup, preservation and open migration work

Owned Chromium is closed and recorded browser/build process IDs are absent.
Three exact dependency junctions were unlinked without traversing their shared
target. The new compiler cache, stopped browser profile, disposable source trees
and their archives were removed. Shared dependencies and their Prisma schema,
publisher pages, screenshots, receipts, earlier evidence and unrelated worktrees
are preserved. The original pinned anatomy and Chimer publication heads remain.

Only anonymous public bibliography research and local source/validation work
occurred. No private credential, database, cloud media, authenticated provider,
publication, merge, routing, Production or Sentry action is included. The rejected
$15 media proposal is closed. Media requests remain capped at $0; the separate
approved 30-cent monthly storage cap is unchanged.

All six sources exposed by the current public adapter now have retained primary
edition/license evidence through the combined local follow-ups. This is not
blanket permission for individual photographs/models, re-approval of every
scientific claim, or whole-migration completion. Private media disposition,
independent delivery/catalog binding, purchase activation, remaining release
journeys and final hosting/promotion/rollback decisions remain separately open.
Wider content follow-ups keep their recorded scope.
