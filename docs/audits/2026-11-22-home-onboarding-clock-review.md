# Home, optional setup and Clock release review

The owner requests Codex and CodeRabbit reviews followed by publication.
PR [#79](https://github.com/dsbowersock/atmoshaper/pull/79) starts from public
baseline `22010d0`; initial candidate `4aed130` has the identical tree as the
preserved local Home/setup/Clock source. Publication remains pending the
corrected-source follow-up, complete hosted checks and staged release gates in
the [operative plan](../superpowers/plans/2026-11-22-home-onboarding-clock-publication.md).

## Actual initial coverage

The standalone Codex CLI could not provision its review environment and inspected
no files; its exit status is not a completed review. A separate read-only Codex
reviewer inspected the full initial diff and relevant callers. Hosted Codex also
completed on `4aed130` and identified the save/leave navigation defect.

CodeRabbit's existing app initially skipped the small public repository. One
explicit full review then completed on November 22, covering `22010d0..4aed130`:
79 selected text/source paths, eight actionable comments, an exact-head reviewed
coverage marker and a finished full-review acknowledgement. The one excluded
binary is the DSEG14 font; its existing provenance, license/hash checks and visual
acceptance cover that asset separately. No partially processed source paths are
reported. The shared Chimer screen is the exact original page blob, with its
entry points separately reviewed.

CodeRabbit's optional Biome tool cannot parse the existing Tailwind syntax and
its ESLint install times out. These are tool limitations, not completed lint
results; the repository's actual lint, type and build checks remain required.

## Grouped corrections and dispositions

- **Save before leaving:** intercept the real Next Link click in capture, before
  its client navigation. A new regression with Next's actual app-router Link
  fails before the fix and passes afterward, including pending save, failure,
  retained answers and successful retry. Prefetch/navigation dispatch remains
  fictional in the fixture; no real account or provider is used.
- **Navigation after unmount:** finish an already captured draft save but never
  navigate to the old Leave destination after the form unmounts. The browser
  regression waits for the saved answers and verifies no stale navigation.
- **Registration return task:** unwrap one recognized legal-gate callback and
  sanitize its nested destination. The actual Register page is exercised for
  ordinary, duplicate, unsafe, malformed and recursively nested callbacks.
  Verification and OAuth retain the same safe destination.
- **Stale settings:** setup actions are the sole writers of setup answers,
  drafts and lifecycle. Ordinary sync retains the locked current onboarding
  answers, while updating ordinary settings. This explicit ownership policy is
  stronger than accepting a client freshness claim. It also applies to manual
  guided setup, which still uses the revision-checked action. Route regressions
  cover older/current snapshots, null/replayed state and first ordinary sync.
  Existing read/local projections continue to carry the current onboarding data.
- **Home keyboard focus:** activating Use dashboard moves focus to the tools
  heading. Shortcut and sheet focus behavior stays independent; the actual
  component test exercises keyboard dismissal and existing sheet restoration.
- **Home independent reads:** resolve owner preferences and navigation in
  parallel. Anonymous requests still omit the preference read; preference
  failures still fall back without disclosing provider details.
- **Preview documentation:** identify the actual guest-only preview and the
  fictional signed-in component test/screenshots separately. The plan no longer
  promises an interactive signed-in account in the guest preview.
- **Clock acceptance filter:** reject an unknown case before acquiring a browser
  or replacing a receipt. A mistyped case fails without creating a receipt;
  known case selection and the five existing cases are retained.
- **Fixture cleanup:** acquire the setup server/browser inside the cleanup
  scope, and close the server even if browser acquisition/closure fails.
- **Changed contracts:** align old hero/copy, default callback and cached-session
  caller inventories with the new design. Preserve the historical rebrand
  comparison fixture. Use the actual Wellness launcher in the audio-preserving
  Home navigation journey. Require a settled single Music visualizer owner before
  testing its controls, without masking or selecting an arbitrary duplicate.

## Verification before the correction follow-up

All 59 grouped account/settings/setup/Home/Clock checks pass, including the real
Next Link and keyboard regressions. The callback/legal focused group passes all
26 checks; updated Home copy contracts pass 13. Ordinary full lint passes, and
the isolated QA build passes with an explicitly generated local Prisma client.
Client generation makes no database connection or schema change.

Only four owner-approved Home wordmark baselines change. Linux captures come
from the actual initial hosted build, match their retry byte-for-byte and are
visually checked. Windows captures come from the local real-route QA build and
are visually checked. Both complete Windows identity journeys then pass with
snapshot updating disabled; unrelated baselines are preserved.

Initial hosted checks correctly expose obsolete expectations; that run is not
release evidence. Full corrected-head hosted CI, the separate correction reviews,
protected Preview acceptance and live artifact/source-map verification remain
required. No real signup, email, payment, clinical record or calendar write occurs.
