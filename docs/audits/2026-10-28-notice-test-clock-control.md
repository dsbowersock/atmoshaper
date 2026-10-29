# Interruption notice: control the test clock before playback

The mobile interruption-notice timing test assumes exactly 24 seconds of active,
unhovered and unfocused reading time. Its clock previously continued advancing
between automation operations. The explicit 10,000 and 13,500 ms advances left
only 500 ms for all other active wall time. A correctly dismissed notice could
therefore fail the test's intermediate visibility assertion.

Playwright 1.60's installed clock resumes normal progression after installation
and after a fast-forward on a running clock. Its documented
[load, pause, then advance pattern](https://playwright.dev/docs/clock#consistent-time-and-timers)
provides the required deterministic time source.

## Evidence and limits

Hosted CI failed at that assertion on both the initial attempt and its configured
retry. The failing test and notice component are outside the anatomy PR's diff.
The hosted run retained no active-time measurements, so its exact timing history
has not been reconstructed.

A network-blocked fixture using the real, unchanged notice component introduced
a controlled 900 ms automation delay. With the running clock, the observed clock
delta was 902 ms and the notice was absent at the nominal 23,500 ms checkpoint.
Pausing before the session instead produced zero clock drift across the same
delay, preserved the notice at 23,500 active ms and dismissed it at 24,000 ms.
The 40-second hover and 60-second focus pauses preserved their remaining budgets.

The full application was then built once from the pinned main source with cached
dependencies, the local font fixture, inert providers and empty database URLs.
Build and TypeScript passed with zero build-network attempts. On that artifact:

- The original browser setup plus the controlled 900 ms delay failed at the same
  intermediate visibility assertion.
- The corrected setup plus that same delay passed the complete hover/focus case.
- The exact corrected case without the injected delay and the adjacent
  exact-24,000-ms scheduling case both passed.

These browser runs used one worker, no retries, a task-owned localhost server,
GET/HEAD-only local requests, blocked external networking and cached Chromium.
Three earlier diagnostic-launch attempts stopped before any case body: the
temporary config lacked ESM package context, its guard omitted Playwright's
exact owned-server shell invocation, and its server cwd pointed at the config
folder. Those attempts remain recorded; no application repair is inferred from
them. The component fixture also encountered a sandbox browser-start denial
before its successful outside-sandbox run.

## Owner and repair boundary

Change necessity: change the test's uncontrolled time source; rerunning the same
test or changing the production duration would not repair this assertion.
Only this test's setup is changed. It lets the route and carousel become ready,
then pauses before Play creates the notice deadline. A fixed installed epoch
and a pause target one hour later avoid a sampled-current-time race within the
case's finite 60-second timeout.

The shared session helper, every hover/focus operation, explicit clock advance
and visibility assertion remain unchanged. The production 24-second timer,
remaining-time subtraction, session behavior and UI are unchanged. There is no
new runtime timer, fallback, retry, helper option or longer test deadline.

Independent source review confirmed that boundary and identified the initial
one-second pause-target headroom issue; the fixed-epoch setup resolved it.
Scoped lint and diff checks pass. The diagnostic reproduction is evidence,
not a strict TDD requirement or a full-suite/hosted CI pass.

Retire the assumption that a running fake clock advances only when requested.
Keep normal-time page preparation and the production reading-time contract.
This local correction still requires its own publication decision; it is not
part of the anatomy or Notes publication grants. No merge, public rollout,
database, provider, purchase or Sentry activation is included.
