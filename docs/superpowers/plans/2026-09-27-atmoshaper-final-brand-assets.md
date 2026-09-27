# AtmoShaper Final Brand Assets Plan

**Goal:** Replace the remaining temporary placeholder mark, favicon, and PWA
icons with the user-approved AtmoShaper exports while preserving the original
export library outside this focused runtime branch.

**Architecture:** Keep `PUBLIC_PRODUCT_IDENTITY` as the presentation owner.
Promote only web-ready copies into stable `/brand` and `/icons` paths; use the
provided dark-background PWA/Apple variants because the installed app declares
a dark theme. The integrated word treatment is retained as an approved variant
without forcing it into a layout that currently expects the logo-plus-name
wordmark.

**Scope:** App-bar wordmark and compact mark, framework favicon, manifest icons,
Apple touch icon, focused identity/PWA tests, current-state documentation, and
visual responsive validation. No provider, deployment, domain, OAuth, Stripe,
database, or source-export mutation.

## Task 1: Promote web-ready assets

- Copy the approved 512px logo, word, and wordmark into stable `/brand` names.
- Replace `app/favicon.ico` with the supplied ICO.
- Replace installed-app icon files with the supplied dark PWA/Apple variants.
- Do not commit oversized master exports or the mislabeled 20px
  `favicon-16.png` as runtime assets.

## Task 2: Point the public identity at the final assets

- Set `appBarWordmark` and `appBarMark` to the stable AtmoShaper paths.
- Correct the app-bar image intrinsic dimensions to the 512x147 wordmark.
- Keep `socialPreview` unset because no dedicated 1.91:1 social card was
  supplied.
- Update focused identity and app-shell contract tests.

## Task 3: Verify rendering and publish

- Run focused identity, app-settings, manifest/PWA, cache-header, and brand
  audits, then typecheck, lint, full tests, and build.
- Inspect desktop/tablet/mobile app-bar geometry plus icon responses.
- Publish an unmerged PR and shepherd exact-head hosted and CodeRabbit review.
