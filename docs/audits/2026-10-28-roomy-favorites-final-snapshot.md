# Roomy Favorites carousel: coherent final geometry acceptance

The `70b0a80849ade712ff02b8ff9d8f5273689f2ef0` CI run `40688150341` failed the existing roomy Favorites workspace case at a 1460 by 1095 viewport. The final strict centered-distance assertion received 4.5 CSS pixels, including the configured retry. The CI merge source is `dc40d2cc9464e72605e07d195d9ae456c9724e26`; its three-line source offset does not change this method. Selected trace evidence is retained in `roomy-geometry-ci-evidence-70b0a80/selected-layout-evidence.json`, SHA-256 `ae516d20d998e16cd580ee9e8b1e321f2b1e5ddf7ae39b08d35fdb4225d0ccf8`.

The trace establishes an observation gap: the early stage/card centering poll passed, the card-only quiet helper returned, and the card width then changed from 255 to 254 while the track remained at -443.5 before the final geometry read. That evidence does not establish later recovery, permanent misalignment or a complete application/runtime cause.

## Invariant and minimum owner repair

Decision: code-change at the existing `Favorites use measured remaining space across roomy bottom-rail workspaces` test only. Its accepted final geometry must be the same complete stage/card snapshot that satisfies the existing distance limit of one CSS pixel after the existing quiet observation.

Keep the shared `waitForStableSlideGeometry` helper and every default caller unchanged. Move the existing relative-centering poll after that helper. Each poll attempt captures the existing complete `carouselGeometry` object and returns that object's centered distance; every existing final geometry assertion then uses the accepted plain-number snapshot. There is one centering poll, with its original matcher, one-pixel limit and repository-configured 7.5-second assertion deadline. No tolerance, retry or deadline is increased, and no application/controller/style behavior is changed. This is quiet-then-current-centering acceptance, not a new guarantee of sustained relative alignment.

The original complete capture callback is unchanged. All original final assertions, viewport sequences, mosaic checks, composition/gap constraints and mobile behavior are retained. No later unguarded carousel snapshot replaces the accepted geometry. A later DOM change cannot retroactively change the captured numeric values; this does not certify that no later DOM change occurs.

## Inert browser falsification and validation

Before the test edit, cached Playwright 1.60.0 and Chromium exercised only primitive invented DOM: a 1408-pixel stage, nine flex slides and centered index four. Width 255 with track -443.5 is aligned; width 254 with the same track produces an actual measured 4.5-pixel error. The fixture driver separately changes the actual track to -439 to correct that relation. Neither acceptance path writes layout, transforms, timings, fake success or application state.

The actual shared quiet helper, original relative predicate and full capture callback were extracted from source without importing the application or Playwright app configuration. The assertion timeout was parsed from the real configuration and bound to 7500 ms, avoiding the standalone library's different default. The pre-edit controls passed. The changed test's exact capture/declaration/poll source was then extracted and exercised against the same controls:

- The old card-only helper resolves while the stage/card relation remains 4.5 pixels wrong.
- Corrected final-snapshot acceptance observes 4.5 twice and remains pending; only the driver's actual track correction produces an accepted zero-distance snapshot.
- A width change deliberately applied after the old helper returns is caught before final snapshot acceptance; the corrected poll remains pending until real correction.
- A forever-wrong layout rejects through the original matcher within the configured deadline, with the actual final snapshot still 4.5. Playwright can stop before a next polling interval would fit; the observed changed-source rejection was 7012 ms, not a changed deadline.
- An aligned snapshot with a deliberately removed slide remains invalid: the unchanged final assertion rejects eight mounted cards against nine. Centering acceptance does not coerce or mask unrelated geometry.

The exact changed-source controls pass, context close and browser disconnection are observed, and HTTP/WebSocket intent counters remain zero. No application module, server, build, Docker resource, provider, credential or download runs. The first diagnostic AST-extraction failure occurred before browser launch and is retained. A later partial run passed the first three controls but its diagnostic expected an unavailable numeric field in Playwright's polling-error object; that failure is also retained. The successful successor reads the actual numeric geometry instead and preserves the genuine matcher rejection.

Public source, extracted callbacks, original/candidate snapshots and actual result files are retained under `roomy-final-snapshot-repair-v1/`. Fresh scoped lint, no-emit typechecking and AST preservation receipts accompany the source freeze. Independent specification and root quality review precede publication. Actual current-head CI remains required; these inert results do not establish whole-app layout recovery or authorize integration.
