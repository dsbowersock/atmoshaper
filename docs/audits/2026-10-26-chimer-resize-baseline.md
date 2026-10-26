# Chimer resize-baseline synchronization

PR52 head 4e2bdf0, CI run 40313267992, Code quality job 121539619884 completed
with one assertion failure. All four browser lanes, build and Preview passed.
The unit failure was the resize/fade fixture at
`tests/secondary-display-layout.test.mjs:267`: its later geometry was compared
against the earlier `shown.top` snapshot. This was an assertion failure, not
another hosted setup/job-limit cancellation.

The existing helper accepted any acquired, clear frame satisfying the caller's
predicate. It did not distinguish an intermediate CSS position/font transition
from a settled resize baseline. CI did not retain that exact intermediate frame,
so the precise hosted trajectory is not reconstructed or claimed.

A controlled inert-fixture regression pauses a native CSS top transition at its
midpoint. Its 420px snapshot is clear of controls, but its target is 440px. The
old helper accepts the unfinished frame: 46 checks pass and this new rejection
assertion fails. This proves the synchronization gap without guessing a sleep,
changing app behavior or relying on host timing.

The helper now also requires geometry-changing CSS transitions to finish.
Opacity/glow effects are excluded; their visual fades do not move the box.
Paused unfinished geometry transitions remain unsettled. A short negative probe
requires rejection, then explicitly finishes the same native transition and
requires the final geometry. Every ordinary caller retains the five-second
deadline; the probe can shorten it to 100ms and cannot increase it. Existing
clearance, post-change state, fade, cleanup and overflow assertions remain.

All 47 focused component/font/source checks pass after the helper correction.
The real resize/fade case passes alongside the deterministic negative control.
Named lint and diff checks pass. The actual app CSS, controller, RunningTimer,
fonts and settings are unchanged. No local full app build, database, account/
admin case, external provider, download or protection change was used.

This establishes an improved fixture synchronization contract. The next actual
current-head CI must verify the hosted failure is gone; local success alone does
not close CI or application acceptance. The approved review/fix loop covers
publication, with PRs kept unmerged and Production/Sentry unchanged.
