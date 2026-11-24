# Native Clock and repeatable fullscreen

Implement [#84](https://github.com/dsbowersock/atmoshaper/issues/84) on the
reviewed #83 head `ea3cbce`. Follow [the parent Android specification](https://github.com/dsbowersock/atmoshaper/issues/82).

1. Exercise the installed app from the native Home tile through fullscreen,
   Close, the second visit, Android Back and Activity recreation. Preserve
   the native Home task and the separate previous-tools entry.
2. Fit the original bold DSEG faces inside the Compose display. Reserve a
   leading day-period slot for digital 12-hour time and honor text scale for
   controls. Reapply immersive bars on recreation and restore them on exit.
3. Read the packaged origin through a single offline export document. Project
   only supported appearance settings, prefer the newer shared Clock store
   and fall back to the earlier preview only if no newer record exists.
   Abort IndexedDB creation. Persist the projected record atomically in a
   versioned native file and verify readback before enabling edits. A failed
   transfer remains retryable and retains the originals.
4. Check both settings stores and interruption/corruption handling through the
   transfer seam. Verify the v7 to v8 signer and in-place continuation on the
   synthetic emulator. Record native touch, recreated-window, large-text and
   visual outcomes separately from physical Galaxy S24 Ultra acceptance.
5. Review the complete implementation range with independent Codex Standards
   and Spec reviews and CodeRabbit. Keep #83 and its PR open for their own
   merge, and keep native timer scheduling and full native background effects
   in their staged issues.

The native DSEG7 Modern Bold and DSEG14 Modern Bold TTF resources are SFNT
decodings of the existing pinned v0.46 WOFF2 assets in [the DSEG directory](../../../public/fonts/dseg).
The packaged DSEG notice covers both representations.

| Resource | SHA-256 |
| --- | --- |
| `dseg7_bold.ttf` | `8784d18d00e94ff587e5ac6da3d04feae013f45febb9e7c6e0297c32e221135b` |
| `dseg14_bold.ttf` | `dfe44821ef1dbc61ecceec717cab6d776771ad253717004be1af3621e58b7909` |

## Preview scope

Compose applies time format, seconds, the four Clock fonts, digit color,
keep-awake, outer glow, drop shadow, stroke, display rotation and forward glow.
Imported parameters can be changed in the native dialog. Forward glow uses an
Android text reflection. The background projection uses canonical
color mappings for Solid Color, linear Static gradient and a native Lava Lamp
approximation. Other background geometry remains available through the
existing packaged tools. An unavailable transfer still shows a
read-only Clock, and retry never replaces either source.

## Local verification

- The Android 35 synthetic emulator ran all five installed-app tests at
  100% and 160% text scale. Both Clock journeys failed on reviewed v7
  before the native Clock was present. They passed on v8, including the
  second visit, both fullscreen exits, Close and Activity recreation.
- The v8 development APK built and passed Android lint. It matched the
  reviewed v7 signer and installed in place. The normal and immersive
  emulator captures at both text scales show bold DSEG numerals and
  centered leading AM/PM alongside the visible hour tens.
- Transfer coverage includes empty storage, both legacy stores, current
  store precedence, saved Harmony mappings, an interrupted first write and
  a malformed committed copy. The browser fixture verified that the input
  records are preserved and that no timer state is exported.
- The guarded v3 → v6 → v8 upgrade transferred the saved appearance and
  retained both download byte digests, the established settings, the timer
  deadline and a planner draft. It also verified Open timer, offline music,
  breathing and the packaged PDF save dialog.
- The existing web Clock and timer regressions passed 111 cases. The shared
  browser suite passed ten cases with one optional media case skipped. The
  native website contract suite passed 14 cases. The full Windows suite
  reported failures outside those focused checks and was stopped after the
  repository audit produced no new output for over twenty minutes. The
  full suite has no passing receipt.
- Codex Standards and Spec reviewed the application range and follow-up
  changes. Mixed gradients can still reduce system-bar or digit contrast,
  and a wide custom stroke can cover the safety outline on small AM/PM
  glyphs. CodeRabbit completed the main range review and the atomic-write
  and appearance-control corrections. Its CLI rate limit blocked the last
  compatibility delta.
- Physical Galaxy S24 Ultra acceptance remains pending. All installed-app
  results above are from the synthetic emulator.

## Independent review corrections

1. Resolve the public background access decisions when packaging the export
   document. Project only compatible renderers with that access, and keep the
   document on the same read-only transfer path.
2. Use separate non-translucent system-bar bands and test the gradient
   interpolation range for glyph contrast. Size the contrast outlines outside
   the custom stroke, and limit stroke width on the small day-period glyphs.
3. Keep the DSEG fragments ordered under RTL, restore the reduced trailing
   label for proportional fonts, and distinguish the Close and fullscreen
   controls. Group the font choices as a single selection and share effect
   ranges between the editor and the appearance decoder.
4. Measure the installed package versions and check that **Open timer**
   displays the packaged countdown with the retained deadline. Verify the
   corrected assets and journeys on the named synthetic emulator.

The corrected Android build and lint passed. At 160% text scale on the
synthetic emulator, an RTL capture kept the DSEG AM/PM on the left over a
black-to-white gradient with matching gray digits and maximum custom stroke.
A separate light-solid capture showed the smaller trailing AM/PM in Serif.
Both captures measured approximately 8.8:1 for the sampled navigation icon
and 18.1:1 for the sampled status icon against their respective surfaces.
Focused Windows verification passed typecheck, changed JavaScript lint,
111 Clock/timer cases, 14 native contract cases, and 10 packaged-browser
cases with one optional media case skipped.

The corrected APK passed the guarded upgrade on Android 35. Android
reported versions 3, 6, and 8 in sequence. **Open timer** displayed the
packaged countdown with the original deadline. The run also verified the
original settings, both downloaded byte digests, offline playback, the
planner draft, and the PDF save dialog. The acceptance and build receipts
match the corrected APK digest.

All six installed-app tests passed on that APK at both 100% and 160% text
scale. They include the contrast regression, system-bar appearance, repeat
visits, recreation, settings persistence, and native Home navigation.
Full Windows-suite completion, physical Galaxy S24 Ultra acceptance, and
CodeRabbit review of the correction remain open.
