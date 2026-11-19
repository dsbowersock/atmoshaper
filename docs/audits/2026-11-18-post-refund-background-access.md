# Post-refund independent background access

Status: **published and accepted after the approved test-only amendment**.
Corrected head `1748230` passes all seven hosted jobs and merges as `adb137e`
with an identical tree. Actual Production gates/maps, one promotion and live
readback pass: independent Admin selection is enabled, purchase ownership stays
revoked, acquisition controls stay absent and the original refund is unchanged.
See the [final publication receipt](2026-11-18-beta-final-publication.md) for
qualified hosted totals and actual artifact/Google availability evidence.
The review/prepublication sections below are historical snapshots, not current
pending work or permission to replay a closed operation.
The original live [refund recovery](2026-11-18-owned-refund-recovery.md) is
complete and closed. This source correction requires no further payment,
refund, entitlement edit or account repair.

## Hosted review and test-only follow-up

The owner approves `d04b785`; [PR #71](https://github.com/dsbowersock/atmoshaper/pull/71)
holds that exact head. The protected Preview is READY and its authenticated root
returns 200 without generic error content. Existing automation access is reused;
no share link is created. Hosted browser build and all 5,721 applicable JavaScript
tests pass, with five explicit skips out of 5,726. Code quality then fails only
the reviewed backup fixture; four browser lanes are still running.
The current public artifact remains `8d89550`, with no merge,
Production build or promotion.

The automated review identifies a real retention-fixture ordering assumption.
The ten runs had equal completion times, so the selected fresh run depended on
filesystem enumeration. A native-Ubuntu copy reproduces the exact failure
(46 tests: one error, one optional age skip). The corrected fixture gives each
run explicit increasing timestamps and tests both forward/reverse enumeration.
Native Windows and native-Ubuntu synthetic suites each pass 45 tests with one
optional age skip. All ten recent recovery points remain intact. No application
or NAS backup runtime file changes. The table below remains dated `d04b785`
evidence; a new exact-head hosted run is required after the separately approved
[amendment](../superpowers/plans/2026-11-18-beta-final-acceptance-publication.md#test-only-review-amendment).

## Observed problem and correction

The public Clock disables the refunded Skybreak item even though the owner's
independent premium access remains. The server already permits use through
free access, active permanent ownership or an independent membership, temporary
or Admin feature grant. The client carousel incorrectly lets every inactive
ownership record override those separate grants.

The adapter now distinguishes active ownership from historical ownership. It
allows independent use without reporting permanent ownership. The inactive
record still blocks a stale ownership-only bridge. Registry disablement still
wins, and denied premium access stays denied. Permanent-acquisition controls
remain hidden for any existing ownership record, matching server eligibility
and preventing another purchase or credit redemption for the reversed item.
No backend grant, history, legal text, durable identifier, layout or dependency
changed.

## Local verification

| Check | Result and scope |
| --- | --- |
| Regression before correction | 98 focused checks: 80 passed, 18 failed, zero skipped/cancelled. Native rerun isolates the access defect from sandbox browser-cache restrictions. |
| Corrected access matrix | 98/98 pass. All five inactive statuses with membership/temporary/Admin grants, enabled free access, disabled entries, denied access and stale ownership-only bridges. No permanent ownership or duplicate acquisition is granted. |
| Existing refund tool | 81/81 focused checks pass after consolidation. No live invocation is repeated. |
| Backup helpers | 46 synthetic tests: 45 pass, one optional age-tool round trip skipped. Native rerun resolves sandbox hard-link restrictions; earlier accepted actual encrypted backup/restore remains separate. No NAS run occurs here. |
| Optimized Browser-QA build | Compilation, TypeScript and 115/115 pages pass. Native rerun resolves sandbox junction restrictions. This inert artifact is not a Production migration/all-payments or Sentry-upload pass. |
| Desktop/mobile commerce journeys | 34/34 pass, including refunded-item selection/rendering. |
| Persisted screenshot check | 2/2 desktop/mobile cases pass after saving file-backed evidence. Both preserve revoked ownership, empty permanent-owned IDs/cart, two credits and zero Checkout requests. |
| Full regression | 5,726 total: 5,722 pass, four skip, zero failed/cancelled; exit zero in 850 seconds. Skips cover two unavailable Windows file-link fixtures, one POSIX-only teardown and the absent ignored optional catalog. Hosted Linux acceptance remains separate. |
| Full lint and standalone typecheck | Both named npm scripts pass, exit zero. |
| Prisma schema | `npm run prisma:validate` passes locally; no database connection or migration. |

Focused lint also passes. Screenshots and raw logs remain in ignored test/output
directories. No private provider identifier or credential is added here. The
already tested backup helpers, guarded refund tool and dated operational records
are consolidated so canonical documentation and the tester guide accompany the
candidate. Original branches and unrelated work remain preserved.

## Remaining release boundary

Public source is still `8d89550`; this correction is local. Fresh read-only
checks confirm that artifact is READY, the canonical public alias still serves
it, and automatic Production custom-domain assignment remains disabled.
The complete 87-setting Production metadata inventory matches the accepted
activation snapshot in name, type, target and both timestamps. All 87 remain
solely Production; no value is decrypted or setting changed. The CLI's deprecated
list-query warning required using its default encrypted list response before
projecting metadata; it was not a configuration or application failure.
Freeze the candidate and follow the
[bounded publication packet](../superpowers/plans/2026-11-18-beta-final-acceptance-publication.md)
before any push/Preview, merge, Production build or promotion. Hosted checks,
new artifact/map association and the final existing-account readback are not
claimed by these local tests.
