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
