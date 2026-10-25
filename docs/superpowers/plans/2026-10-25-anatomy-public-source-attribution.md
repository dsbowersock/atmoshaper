# Public anatomy source links and rendered attribution — October 25, 2026

The flow under test is: a public flashcard's image/answer is rendered → its
credit/linked license is available → the credits disclosure opens without
navigating or changing study state. The Anatomime footer uses the same license
label; no game, room, sign-in or provider test is started.

## Concrete defects and evidence

- The bundled BodyParts3D directory source URL returns 404. The official archive
  description, license and update pages are available. Its license page dated
  February 27, 2025 states CC BY 4.0 and specifies an attribution credit.
- Human Bio Media's biceps lesson explicitly states CC BY 4.0 and requests its
  free-access attribution on pages redistributing its materials.
- Flashcard source links currently omit supplied attribution/license text.
- The selected-image caption hard-codes BodyParts3D instead of displaying the
  selected asset's credit. The adapter drops existing license URLs.

## Source and data changes

1. Retain and hash the four fixed anonymous publisher HTML pages. Do not fetch
   any images, models, bucket objects or private provider data.
2. Correct the two source records' exact credit/evidence fields, including the
   working BodyParts3D description URL. Keep source/citation IDs, usage/review
   states, study answers, outer card dimensions and asset identities/URLs intact. Correct only the shortened generic credit in the two existing image generators; preserve all license and review fields. Classify
   only the generated source-pointer metadata affected by that URL correction.
3. Add existing optional license URLs to public source/media projections; do not
   infer an asset's license from a book or unrelated mirror. Historical mirror
   ShareAlike/review-only records remain separate.

## Rendered changes

4. Use a shared license label that links only valid HTTP(S) URLs without embedded
   credentials and falls back to plain license text otherwise.
5. Retain source-name links and add an accessible credits/licenses disclosure.
   Show the selected image's actual attribution and license in its caption.
6. Reuse the license label in Anatomime's existing attribution footer. No room
   issuance, game, realtime connection or closed protected test is replayed.

## Validation and ownership

7. First render the actual unmodified TSX with invented media and actual source
   records to prove the credit, link and adapter regressions. Keep original
   failures and method errors. Test the actual changed owners after repair.
8. Compare every bundled seed record/card/question. Permit only the declared
   metadata changes and additive license URLs; preserve IDs, order, answers,
   grading, selectors, review flags, study coverage and asset contents.
9. Run focused existing contracts, changed-file lint, typecheck and one cached
   provider-free build with the existing local font fixture. No install or Prisma
   regeneration. Pin inputs and reject network/unrelated executables.
10. Browser plugin is not listed; use cached Playwright. Check actual rendered
    owners with real built CSS at desktop/mobile sizes, meaningful identity,
    content, console/overlay health, disclosure interaction and screenshots.
    Invented inline imagery proves credit/layout behavior only; no image rights,
    model accuracy, hosted delivery or whole-site acceptance is inferred.
11. Remove only owned browser/server processes, profiles, dependency junctions,
    compiler cache and temporary build snapshot. Preserve shared caches, old
    evidence, unrelated work and the two pending publication heads.

## Boundaries and release status

This is local source/UI work plus anonymous public bibliography research. It
authorizes no credential/provider/database/media access, migration, mutation,
deployment, publication, merge, public exposure, Production routing or Sentry
activation. The declined $15 proposal stays closed; R2 requests stay at $0 and
the separate approved storage cap stays unchanged. Publisher licenses do not
independently establish every linked claim, individual asset or clinical use.
Remaining media disposition/delivery, all-purchase activation and final release
journeys/decisions stay open. No broader content backlog becomes a new gate.
