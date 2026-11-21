# Release PR review corrections

PR [#78](https://github.com/dsbowersock/atmoshaper/pull/78) receives a substantive
full CodeRabbit review of all 57 selected paths at `bf58dca`. It raises eight
issues: five code behaviors and three outdated status passages. Codex's review
of that source completes with no issues. This is the grouped correction delta
within the owner's authorized publication plan, not another historical campaign.

| Review comment | Disposition and verification |
| --- | --- |
| 4654650615, Calendar loaded range | The page supplies the actual bounded server-read window. Every FullCalendar navigation path reports its visible range; leaving the loaded window hides and disables the stale practice grid, requests that date for the same authorized practice and scope, and restores the grid only after the replacement snapshot covers it. Real browser tests exercise Today, Previous and Next from a distant deep link and verify no scheduling writes. The page test binds both event and external-busy queries to the supplied window. |
| 4654650619, duplicate feeling words | Retain each selected word's chosen branch locally. A real component regression chooses Connected / Understood / Accepted, chooses and removes Sad, and retains the original context. Existing single/multiple removal and touch regressions remain. Durable stored feeling-word schemas are unchanged. |
| 4654650630, Checkout confirmation | Race current-Session retrieval against an absolute five-second timer, retaining the SDK inactivity timeout and clearing the timer on settlement. A controlled timer regression holds retrieval open and verifies bounded failure without another create. Existing slow successful-create cases still pass. No live Checkout runs. |
| 4654650638, shallow audit history | Reject shallow repositories before ancestry or inherited-root enumeration. A real isolated repository with an explicit shallow boundary demonstrates the false root and verifies rejection. |
| 4654650643, mode/type audit identity | Review transitions and baselines include mode, type and content identity. Raw blob IDs remain separate for batch object preparation. Real executable-bit and symlink-mode regressions require review even for identical content. Re-running the frozen evidence still proves all 703 changed code/test histories with zero gaps. |
| 4654650622, 4654650625, 4654650626, old status passages | Align the three retrospective handoffs with the completed `dfe4198` and `1c9a8f1` reviews. Preserve historical checkpoint context, the separate cleanup-fixture use gate and publication boundaries. |

The focused unit group passes 112 checks; Calendar server/controller and native
browser checks pass 29. Full lint and TypeScript pass. The initial hosted run
also exposes two Exercise test assertions that bypass native required/minimum
validation and a mobile-sidebar test that reopens a still-closing drawer. Keep
the native constraints, assert invalid-field focus/validity, leave already-open
optional sections open, and await drawer closure before targeting the active
navigation dialog. Both Exercise journeys pass on phone/desktop, and the
corrected drawer journey passes on phone (the desktop journey also passes).
These test corrections change no application validation or navigation behavior.
Fresh current-head hosted CI and correction-delta Codex/CodeRabbit review
remain publication gates. Original
raw reviews and synthetic acceptance receipts are retained in ignored operator
output. No live traffic, provider setting, record, credential, payment, email or
NAS installation changes during this correction step.
