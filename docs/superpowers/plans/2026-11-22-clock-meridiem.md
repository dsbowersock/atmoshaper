# Clock AM/PM placement and digital lettering

The owner requests using the spare leading-hour cell for AM/PM, freeing the
trailing edge for enlarged clock digits. They also request digital lettering.

1. Keep two stable hour cells. In digital English 12-hour mode, hide the leading
   zero and position AM/PM over the unpainted part of that cell. Retain the hour
   1's visible segments at 10-12; preserve seconds, 24-hour, other selected fonts,
   localized day-period labels, secondary clock and display effects.
2. Extract the existing current-time renderer into a focused shared component,
   keeping the fitting stage/algorithm unchanged. The label must occupy no row
   width and never overlap the leading digit's ink.
3. Use the author's unmodified DSEG14 Modern Bold v0.46 for readable AM/PM
   lettering beside unchanged DSEG7 Modern Bold digits. The seven-segment M is
   arch-shaped; the Modern alphabet companion preserves segmented styling.
   Compare the release license byte-for-byte with the existing original notice,
   retain original bytes/hash, and change no other Digital consumers or labels.
4. Test 1/9/10/11/12 AM and PM, seconds/24-hour, fallback fonts, localization and
   secondary rendering. Measure actual ink and label bounds with the owned
   fonts. Verify the real development Clock route enlarged to its fitted maximum
   on phone, landscape and desktop, plus lint and full type checking.

Keep all work local with fictional QA settings and inert services. Existing
home/onboarding work stays intact. No publication or provider operation is
included; reviews and release authorization remain separate.
