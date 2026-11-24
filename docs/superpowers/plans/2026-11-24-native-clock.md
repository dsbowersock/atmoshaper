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
