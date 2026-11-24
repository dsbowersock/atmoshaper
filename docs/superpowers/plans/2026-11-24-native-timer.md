# Native timer setup and durable foreground use

[Issue #85](https://github.com/dsbowersock/atmoshaper/issues/85) is stacked on
the reviewed native Clock preview at `95127de`. Its parent is issue #82.

1. Add a versioned timer snapshot in Android app-private storage. Test the
   deadline transitions with explicit time and test interruption at the atomic
   file boundary. Persist a deadline for running sessions and frozen remaining
   time for paused sessions. Preserve interval phase across pause and resume.
2. Read only the timer fields from the packaged app's known stores, with the
   newest record taking precedence. Check the exported fields and committed
   copy before enabling controls. Preserve the browser originals for rollback
   and keep errors retryable when the source cannot be read.
   Carry over the timer choices in saved and last-used setups for reuse.
   Keep their packaged records and visual settings in the original stores.
3. Open the Compose timer from Clock and packaged timer links. Keep the
   packaged music visualizer and connected website available. Provide setup,
   active adjustments, completion and foreground cue controls. Keep Android
   alarm scheduling and delivery away from the timer screen for the separate
   background-alert work.
4. Verify the shipped routing, file and deadline behavior, fixed-clock and
   installed app journeys, and a guarded upgrade with a retained deadline.
   Record native and website regression results and current-range review.

## Verification

The final Android preview assembled and passed lint. Six installed timer
tests passed on the guarded Android 35 emulator at 100% and 160% font
scale. The journeys exercised saved setup reuse, closing a setup before
starting, active countdown, pause, adjustment, resume, end, recreation
and reopening an expired timer. Fixed-clock checks also covered durable
deadline arithmetic, interval consumption, an interrupted write and
reading the first native timer snapshot format.

An offline in-place update from the reviewed v8 preview to v9 preserved
the running deadline, original packaged timer record, saved setup and a
synthetic planner draft. The same deadline survived a process stop. Cold
links opened the Compose timer and the packaged Clock and Business
Planner. A clean synthetic profile opened usable timer setup. The v9
APK SHA-256 was `3449c4df2e1bce90f34f1755316f39db18db46dc81fa8589f4f6f00df88f9b8b`.

The guarded v3-to-v6-to-v9 upgrade retained both download digests, the
timer deadline, Clock settings and the planner draft. It also verified
offline music and breathing, packaged navigation and the Android PDF
save dialog.

TypeScript, changed-file ESLint, 111 Clock and timer checks, and 14 native
website contract checks passed. The packaged-browser regression passed
against the final assets, including a previously consumed legacy cue and
a paused timer with a cue already due.

The full repository suite reported 5,960 passed, seven skipped and zero
failures. It started before the final review correction. The focused
packaged-browser test and emulator checks above cover that correction.

## Review

Independent standards and spec reviews led to the setup durability,
preset, foreground cue and transfer corrections in the project log.
CodeRabbit completed the application range and the correction range
through `7746b68`. The confirmed findings concerned the due paused cue
and delivery of a cold packaged link before the navigation listener was
installed. The final browser and installed checks verified both fixes.
The follow-up's remaining cold-link question was resolved by tracing the
listener's synchronous registration in the deferred entry bundle and
opening the packaged Clock and Business Planner from cold processes.

Physical-device acceptance and background alert delivery belong to
separate verification.

## Independent correction range

The installed WebView identifies its timer owner independently of the
message listener used for legacy export. Its route handler classifies both
timer path spellings and the packaged visualizer exceptions. Android accepts
only the fixed local launch command from the packaged entry. A first transfer
on a WebView without export support shows the native retry state. An existing
native snapshot opens without that export capability.

Template read failures follow the retryable transfer error path. Absent or
malformed optional templates are omitted, with the source records retained.
Active adjustments to zero use the same commit-before-delivery rule as
foreground deadline completion. Running cue deadlines and paused offsets use
distinct Kotlin types with the original v1 representation. Clock and timer
share the staged write and verified readback sequence.

The correction APK assembled and passed lint. SHA-256
`785e8838bb1b7db8fd1ae9a812588c81bdab8190ae6b52a4ef4d4d065290a0cf`.
The guarded Android 35 emulator passed ten instrumentation tests at each of
100% and 160% font scale. The adjustment journey observed the visible flash,
verified durable completion, and checked that reopening did not flash again.
Browser journeys passed 11 tests with one optional live-media case skipped.
TypeScript, changed-file ESLint, 14 native website contracts, and 111 Clock
and timer checks passed.

The guarded v3 to v6 to v9 upgrade passed against that same APK. It kept the
original countdown deadline, settings, two byte-identical downloads, and a
synthetic planner draft. After closing the native timer, the test verified
that the original packaged document was still visible, then reattached the
test client to the same process for the remaining Clock, playback, breathing,
and planner PDF checks.

Independent Standards and Spec follow-ups found no remaining actionable
findings in the correction. The browser fixture covered a packaged shell
without the timer transfer channel. The Android 35 provider supports legacy
export, so the unsupported-provider retry branch was traced in source.
