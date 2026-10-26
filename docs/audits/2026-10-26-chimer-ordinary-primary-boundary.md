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
