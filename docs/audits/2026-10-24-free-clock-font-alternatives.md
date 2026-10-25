# Free clock-font alternatives — October 24, 2026

The owner requested free alternatives before seeking commercial permission for
Digital-7, then selected **DSEG7 Modern** from the comparison. The existing inquiry
remains unsent. No font was purchased; source publication and Production remain
separate. The [selected-font implementation](../superpowers/plans/2026-10-24-local-digital-font-rights.md)
records local validation.

| Candidate | Appearance and use | License/source evidence |
| --- | --- | --- |
| DSEG7 Classic Regular v0.46 | Traditional seven-segment display; recommended first visual candidate for preserving Chimer's digital-clock character | [Author's DSEG page](https://www.keshikan.net/fonts-e.html), SIL OFL 1.1 |
| DSEG7 Modern Regular v0.46 | A smoother seven-segment variation | Same author and original DSEG license |
| Digital Numbers Regular | Squared LCD segments and fixed-width numbers; different spacing/colon appearance | [Author's repository](https://github.com/s-a/digital-numbers-font), [Google Fonts original OFL notice](https://github.com/google/fonts/blob/main/ofl/digitalnumbers/OFL.txt) |
| Share Tech Mono Regular | Continuous technical strokes and readable letters, without separated LCD segments | [Google Fonts metadata](https://github.com/google/fonts/blob/main/ofl/sharetechmono/METADATA.pb), [original OFL notice](https://github.com/google/fonts/blob/main/ofl/sharetechmono/OFL.txt) |

All four permit commercial use and web delivery under OFL 1.1, with the applicable
copyright/license notices retained. The [OFL FAQ](https://openfontlicense.org/ofl-faq/)
specifically covers bundling with proprietary/commercial software and same-server
webfont delivery. No paid font license or author request is needed for those
uses when the OFL conditions are met. Preserve original font bytes and notices;
reserved-font-name conditions still apply if a font is modified.

Two existing original DSEG WOFF2 files were reused. Two original Google Fonts
TTF files and their matching notices were downloaded for local comparison only
(four public downloads, 73,188 bytes total). Nothing was installed globally or
added to an application asset path for these new alternatives during comparison.
The provisional Classic prototype was subsequently superseded by the owner's
Modern selection.

A self-contained HTML comparison includes the original font files, notices,
editable clock text and a size control. The cached Chromium rendered all four
families at desktop and mobile widths. Both views loaded all four fonts, had no
horizontal clipping or script exception, and passed the text-input interaction.
Browser requests were fulfilled locally with zero external browser requests;
no HTTP server was started and the browser was closed afterward. Both images
were visually inspected. These are style specimens, not actual-app geometry,
selected-font or final release acceptance.

The Modern selection is now being verified in the real Chimer clock/countdown
and other Digital consumers at mobile/desktop widths. Saved Digital settings,
readable suffixes, compatibility identifiers and the original notice are retained.
Follow the separate publication/review boundary after local validation.
No merge, Production change or Sentry activation is included.
