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
