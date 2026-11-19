# Final small-beta publication and Google availability

Status: **published and accepted for the documented small, owner-led beta**.
The owner sends invitations; none have been sent by the agent. This closes the
approved publication and readback operation, not the broader migration, held
content admission, marketing activation or legacy retirement.

## Reviewed source and hosted checks

The owner approved the test-only amendment at `1748230` on
[PR #71](https://github.com/dsbowersock/atmoshaper/pull/71). One additional push
updated that existing PR. The corrected retention fixture passes on Windows and
Ubuntu, including both directory orders. The original review finding is resolved
and outdated. Application and NAS backup runtime were unchanged by the amendment.

All seven jobs in the corrected head's
[hosted run](https://github.com/dsbowersock/atmoshaper/actions/runs/44439412446)
succeed:

| Check | Actual result |
| --- | --- |
| JavaScript | 5,726 total; 5,721 passed, five explicit skips, zero failures/cancellations. |
| Synthetic backup suite | 46 total; 45 passed, one optional age-tool round-trip skip, zero failures. |
| Four Chromium lanes | 615 first-attempt passes plus one pass on its configured retry; 180 matrix/opt-in skips, zero terminal failures. Both new desktop/mobile post-refund cases pass. |
| Quality, browser build and aggregate | All succeed. No manual rerun or required-check bypass. |

The one retry is the unchanged mobile homepage heading test: its first locator
matched two headings, one hidden. The overflow assertion did not fail; configured
retry one passed. This is a recorded flaky check, not an all-first-attempt pass.
CodeRabbit skipped automatically; no CodeRabbit review was requested or claimed.

The PR merged once as `adb137e`. The fetched merge tree exactly equals the
approved candidate tree. The original `d04b785` failed-fixture run remains
historical evidence and is not relabeled as green.

## Actual Production build and promotion

One automatic Production artifact for `adb137e` reaches READY. Its actual build
passes all 46 current migrations without applying one, the live all-payments
readiness gate, compilation, TypeScript and all 115 pages. Sentry accepts 521
client and 2,620 server source/map files for this exact merge release.

A debug ID extracted from JavaScript actually emitted by staged HTML resolves
to the new release's client archive. The same unchanged chunk/debug ID also
belongs to the retained prior release; it is not a unique source fingerprint.
The merge-tree, build and new-archive association together bind this release.
The public script matches staged bytes and has no public source-map directive.

Authenticated staged and public requests each pass for `/`, `/login`,
`/register`, `/pricing`, `/clock`, `/music` and `/account`: all seven return 200
with expected app content and no generic error surface. Anonymous `/account`
serves the account shell; it is not a new-account or signed-in acceptance test.
The actual Linux Drone artwork route returns a valid 512-by-512 PNG. The apex
preserves its 308 redirect to the canonical `www` host.

Only after these gates, the same READY artifact is promoted once. All six
approved mappings complete; the other 34 entries in the 40-alias inventory are
unchanged. All 87 existing Production settings retain their names, types,
Production-only targets and timestamps. Only the existing non-secret payment
scope is read individually; no secret/configuration write occurs.

Existing protected-build access is reused without creating a share link. The
compatible READY `8d89550` all-payments artifact is retained for recovery. No
rollback is needed. The publication grant is closed: no further push, build,
promotion, configuration change or rollback is authorized by its unused time.
Exact provider references and raw receipts stay in ignored operator storage.

## Published owner readback

The live Clock shows Skybreak with independent Admin access, enabled selection,
the label **Refund revoked**, zero permanent-acquisition controls and the
unchanged two-credit balance. No selection, preference, preview toggle, cart or
acquisition action is submitted.

The original Admin order remains REFUNDED for $1.07, its original refund is
SUCCEEDED and purchase ownership is REFUND_REVOKED. Original processor/signed
receipt history remains. This confirms the access correction without restoring
purchase ownership or repeating any financial operation. The completed
[monetary recovery](2026-11-18-owned-refund-recovery.md) remains closed.

## Google availability, read-only

The owner's AtmoShaper Chrome profile is now connected through the browser
extension. Native whole-PC input is no longer used. The Calendar client's full
identifier in the production client's visible link exactly matches the existing
deployed non-secret Calendar configuration; no credential is opened or changed.

The matched Google Auth Platform project shows:

- Publishing status **In production**, user type **External**.
- Branding **verified and being shown to users**.
- Data-access verification **not required**, because no sensitive or restricted
  scopes are requested.
- The three Calendar scopes in published source are listed as non-sensitive:
  `calendar.app.created`, `calendar.calendarlist.readonly` and
  `calendar.events.freebusy`.
- App name AtmoShaper, support/developer contact `atmoshaper@gmail.com`, and the
  canonical site, privacy and terms URLs.

No publish/test-user/scope/client/IAM/branding setting is changed, and no new
OAuth grant or event is created. The audience page's generic 100-user cap warning
concerns unapproved sensitive/restricted scopes; it does not establish a new cap
on this currently non-sensitive flow. Existing owner sign-in and the bounded
[Calendar journey](2026-11-18-google-calendar-live-test.md) remain their own
acceptance evidence. A fresh tester's first account/consent is not claimed here.

## Handoff and limits

Use the reconciled [beta checkpoint](2026-11-18-beta-handoff.md) and
[tester guide](../beta-tester-guide.md). Derrick monitors `atmoshaper@gmail.com`.
Keep practice tests invented and PHI-bearing records on the person's device.
Hosted database backups do not cover those local vaults.

The accepted scheduler-context export, encrypted restore and authenticated
failure-alert checks are carried forward, without another NAS run or alert.
The first regular overnight backup remains due November 19 at 03:00
America/New_York; it has not occurred at this checkpoint. Read its saved result
afterward. Full hosting-outage recovery, long-lived token expiry, every audio
station/physical speaker path, new-account acceptance and a completed password
reset are not established by these scoped checks.

The remaining development-tooling vulnerability noted in the
[dependency audit](2026-11-18-beta-dependency-security.md) and the homepage
locator retry above remain follow-up work. No blanket security clearance is
claimed. These documentation updates are local-only after the accepted release;
they do not trigger an additional deployment.
