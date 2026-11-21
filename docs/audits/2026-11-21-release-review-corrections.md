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
The Codex follow-up at `9e0c7df` identifies one additional supported boundary
(comment 4654733330): a month-end anchor can place leading grid days before the
old 30-day lookback, leaving the replacement grid loading indefinitely. A
shared, bounded 45-day lookback now covers full month padding and local/UTC
offsets. Native Today/Previous/Next acceptance uses that actual replacement
window, and a January 31 month-grid case remains visible without a reload loop.
Calendar/page/controller/workspace and native checks pass 33; focused lint and
TypeScript pass. This focused amendment does not change the previously checked
Wellness, payment or audit source.
The included follow-up subsequently completes at `60bdc9e` across all 22
selected paths. All seven CI jobs pass on that source. The completed review
raises three supported issues and one latent minor fallback, corrected together:

| Review comment | Follow-up disposition and verification |
| --- | --- |
| 4654913250, late Calendar replacement | Associate each automatic range request with its date-intent epoch. Ignore the reply's route-date reset after a newer local choice, and guard the scheduled animation frame too. The native fixture updates both the route date and the real read window; Today followed by a return to February 2030 survives the delayed reply and requests the newly needed snapshot. Normal completions still restore the grid. |
| 4654913256, truncated reads | Read 501 sentinel rows for both events and external busy blocks. Exactly 500 is complete; 501 refuses the entire practice snapshot through the existing generic recovery surface. Actual-page regressions verify both collections and the independently available personal view. |
| 4654913257, underlying confirmation transport | Use a request-owned confirmation client and abort signal through full body consumption. Normal SDK transport is preserved; no shared client is mutated. A real loopback response trickles past five seconds: the caller fails, the server observes body/socket closure, one committed create is retained, and a concurrent request on the original client succeeds. Normal confirmation also succeeds through the same real transport. |
| Review summary, preselected feeling context | Resolve an externally supplied word through the wheel segments before falling back to a one-word path. Stored branch choices still take precedence; a controlled component regression preserves family context after choosing/removing another feeling. |

The Codex review at `99a4da6` identifies a further supported remount boundary
(comment 4655007853): switching locally from Practice to Together before a
replacement changes the route's source view, remounting the old source-based
workspace key. Use a shared account/practice ownership key and associate each
automatic response with both date and source intent. The actual-page key test
proves stability across source changes and isolation across ownership changes;
the native fixture uses that same helper and changes both returned route props.
The browser regression now exercises Practice and Together delayed replies,
newer Personal selection, and a later explicit external route change.

The next complete CodeRabbit review covers all 13 paths in `60bdc9e..7da07ef`
and raises one minor supported lifetime issue (4655155872). A superseded
automatic request's retained history can intercept a later explicit route to
the same day. The native regression reproduces October remaining displayed
after a deliberate return to November. Track only the active Next navigation
intent, replacing its predecessor when a newer request starts and consuming it
when route props arrive. Existing delayed date/source sequences still pass.

All 165 Stripe, 120 Calendar layer, five feelings lifecycle and native phone/desktop
Calendar checks pass. Current-source hosted CI, Codex and CodeRabbit review
remain publication gates. Use the next included review slot without paid
credits or another broad historical campaign. Original
raw reviews and synthetic acceptance receipts are retained in ignored operator
output. No live traffic, provider setting, record, credential, payment, email or
NAS installation changes during this correction step.
