# Chimer state-aware layout assertions

CodeRabbit's current-head review of PR #52 found a valid test race: a non-empty
observer property could belong to the previous UI state, and a fixed 250 ms
delay did not prove that the changed layout had been applied.

The geometry helper now retries an acquired, unobstructed layout and each
caller's expected state. Display swaps require the new owner; position-only
toolbar movement requires the moved toolbar and displaced display; visual
viewport changes retry their new bounds. Font and chrome checks require their
updated rendered state. Hiding explicitly waits for both owner/stage properties
to clear and no active owner; showing reacquires the owner. Unmount cleanup is
also observed directly. Primary-mode assertions retry the actual greater-boundary
geometry. Two test-fixture data attributes identify rendered mode/chrome state;
application runtime code and styling are unchanged.

Validation: all 43 focused Chimer/font/component checks and named lint/typecheck pass.
The first validation could not locate Chromium in a stripped environment;
the explicit existing cache path corrected that prerequisite without a download.
A subsequent sandboxed browser launch exited with access denied. Defender's
read-only status recheck showed no new detection or active threat, with protection
enabled. The approved source validation then passed outside the sandbox. These
attempts remain recorded and do not reopen the held account/admin harness.
The real shell fixture intercepts every request and creates no application
server, database, game, payment, email or provider activity.

Publication follows the existing four-PR review/fix approval. Configured
CI/Preview must validate the new commit; the earlier review does not cover it.
Included CodeRabbit capacity gates the next review. No PR merge, public routing,
Production promotion, Sentry activation or paid review is included.
