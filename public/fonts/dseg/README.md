# DSEG timer font

Unmodified DSEG7 Modern Regular, selected by the owner, from the author keshikan's DSEG v0.46 release:
https://github.com/keshikan/DSEG/releases/tag/v0.46

The original copyright, reserved-name notice and SIL Open Font License 1.1 are
preserved in [DSEG-LICENSE.txt](DSEG-LICENSE.txt). The application's proprietary
license is unchanged. This font must retain its own copyright/license when
redistributed; it is not an AtmoShaper-authored font.

The CSS alias Digital preserves existing clock settings. Only digits, colon,
minus and decimal point use the segmented face; suffix/meridiem letters retain
the existing readable fallback stack. The WOFF2 binary is not subset or renamed
internally. Its SHA-256 is
3ea4cfd8ce47d00563bf967151cea3a4be9109edb49d38d8b48f98fe5abf1780.

The build-relative CSS URL lets Next emit a fingerprinted static font asset.
The existing service-worker static-asset policy can cache that emitted URL;
no cache identifier or broader service-worker routing rule changes are needed.

The owner requested heavier, vertically centered Clock/Chimer digits on November
19. The unmodified **DSEG7 Modern Bold v0.46** is bundled for the clock-only CSS
alias `Digital Clock` at weight 700. Its SHA-256 is
05eab7015f3aaba2ffc32b4d29362f9b470e1a4afe8d2c8332d301bb061a83cf.
The author's release notice is byte-identical to the existing preserved license.
CSS ascent/descent/line-gap overrides center the visible digits; no font bytes,
internal family name or saved `digital` setting are changed. The original
Regular `Digital` face remains available unchanged for other consumers.
The clock alias also includes U+0020 so CSS line metrics use the normalized face,
as specified by [CSS Fonts' first available font](https://www.w3.org/TR/css-fonts-4/#first-available-font).
Unit and AM/PM labels use their readable fallback family explicitly.
