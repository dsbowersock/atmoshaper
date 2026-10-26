# Ordinary Chimer primary boundary review correction

The completed included review of PR #52 at 2a7b5ef raised one outside-diff
comment in review 5648059816. The valid issue is the ordinary `.primaryDisplay`
rule: it added the immersive top reservation after choosing an already absolute
secondary edge. That can move the ordinary primary below the required boundary.
The two specialized timer-mode rules named in the suggestion already use the
correct absolute maximum and are preserved.

The ordinary rule now compares the complete control inset plus reservation
against the absolute secondary edge. Its bottom/right/left rules, font choice,
saved state, timers and the specialized modes are unchanged. With no secondary
reservation it retains the original ordinary control inset.

The actual component/CSS regression uses the existing inert shell, current
production classes and the real selected font at 320x740. A hidden layout probe
resolves the CSS control inset, including calc/safe-area values. Positive top
reservations exercise both sides of the maximum; hiding the accessory verifies
the existing ordinary inset and cleanup. All earlier geometry/owner tests remain.

Before the correction, 43 focused checks passed and the new case failed its
complete-boundary assertion. After the one-line CSS correction all 44 pass.
Named focused lint, typecheck and diff checks also pass. The suite
closes its browser/contexts and asserts no unexpected request; the component
bundle stays in memory and creates no application build or database.

Publication and review fixes use the owner's existing four-PR grant. Configured
CI/Preview and a fresh applicable included review must cover the new commit;
2a7b5ef coverage cannot be reused as new-head evidence. No full local app build,
protected account/admin test, provider test, merge, Production or Sentry action.

## Subsequent review coverage corrections

The included review of 2df4004 completed in review5648791397 with two trivial
outside-diff test-coverage comments. Both are valid gaps in the existing tests;
neither establishes another runtime defect. The visual-viewport case now moves
offsetTop beyond the earlier control-clearance boundary and asserts the new
vertical position while retaining horizontal/overlap/width checks. The font
case clears the controller-owned placement before changing font, then requires
fresh acquisition alongside the existing metric and owner-cleanup assertions.

All 44 focused cases, named lint, typecheck and diff checks pass. Application
runtime, CSS, font files and saved settings are unchanged by this follow-up.
Current-head CI/Preview and applicable included review remain required after
publication. The one-included-review-per-hour limit is preserved.

## Production display wiring review

The completed included review of 213bd45 (5650119063) raised two outside-diff
comments. The proposed pure-Clock CSS change does not apply to the current
rendering contract: status `clock` disables `shouldRenderTimerDisplay` and
forces `isCurrentTimePrimary`. If its clock is visible, it is the sole primary
display; if hidden, neither display renders. There is no auxiliary display to
produce the proposed secondary safe-top reservation in that mode. The existing
pure-Clock CSS remains unchanged rather than repairing an unreachable premise.

The production-marker coverage gap is valid. Two source-contract checks now
parse the actual RunningTimer declarations, button guards and marker expressions
with TypeScript's AST. A small evaluator accepts only the required inert boolean
syntax and never imports or executes the application. It verifies timer/clock
role swaps, hidden clocks and the absence of an accessory in pure Clock/Music
modes, independently of the geometry fixture's own markers. In-memory guard and
marker mutations prove the assertions reject regressions. This is a source
wiring check, not a complete rendered RunningTimer integration journey.

The earlier full focused attempt could not locate Chromium because the sandbox
redirected its default cache to a missing AppContainer path; it did not establish
a geometry regression. The existing owner cache was selected explicitly for
the follow-up, without any browser download or protection-setting change.

All 46 focused checks pass with cached Chromium; scoped lint, typecheck and
diff checks pass. The fixtures close their owned browser/contexts and reject
unexpected traffic. No full application build, account/admin case, database,
provider operation, runtime or permission change was performed for this review.
