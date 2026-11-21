# Wellness, Exercise and My calendar publication receipt

Status: published, verified and closed. No unused write capacity remains.

The owner requested publication of all Wellness updates including Exercise and
My calendar. The release is live at [Wellness](https://www.atmoshaper.com/wellness)
and [My calendar](https://www.atmoshaper.com/calendar/personal).

## Source and scope

- Review PR: [#75](https://github.com/dsbowersock/atmoshaper/pull/75).
- Reviewed source: `b3fd1db972002169738ed95f38e7444a530f98c0`.
- Published merge: `f6b80fb85cd1c6bfbd3077b02b4a3fcdf55b51cb`.
- Identical reviewed/merge tree: `77e61fe849fa6bdafdbf023461cf8f75c4f5ed00`.
- Baseline public source and retained rollback: `7785ae6`.

Only the nine Wellness changes after `42006a9` through `7446c75` were integrated
onto the public baseline. The four newer planner commits remain in their original
checkout. Application comparison proves Wellness runtime equivalence with
`7446c75`; planner runtime and Prisma schema are unchanged. The development
checkout, local previews and user drafts remain intact.

The release includes Mind/Body/Context grouping, category-first recording with
separate drafts, the interactive body and surface-specific selections, guided
ROM and movement comfort, the continuous feelings wheel, Work/Home reflection,
Exercise recording and progress, and the owner-only personal calendar. Anonymous
practice recordings stay in memory. Signed-in consumer Wellness uses its existing
owner-scoped domain; professional clinical records remain in the local vault.
Calendar reads do not copy recordings into practice events or Google Calendar.

## Validation and review

All seven required hosted checks passed at the reviewed source in
[run 44853304029](https://github.com/dsbowersock/atmoshaper/actions/runs/44853304029).
Current-head hosted review reported no findings or unresolved threads.

| Check | Verified result |
| --- | --- |
| Hosted lint, TypeScript and unit suite | 5,806 pass, five configured skips, zero failures |
| Backup process/file checks | 45 pass, one optional skip |
| Local inert build | TypeScript and 116-page build pass |
| Focused desktop/phone browser selector | 54 pass in 7.8 minutes, no retries or skips |
| Full hosted browser matrix | 678 pass, two cases succeed on configured retries, 180 configured opt-in/matrix skips |
| Corrected session ownership inventory | All ten checks pass locally and in the hosted suite |
| Protected Preview | 13 routes and reviewed body/font assets pass |

The first hosted run found a stale RSC-session inventory. The correction adds
the personal Calendar page and a narrow, server-directive-checked exception for
its independently authenticated Server Action. Application code is unchanged.
The superseded local broad run was stopped; it is not recorded as a completed
Windows full-suite pass. Fresh hosted checks provide the complete unit result.

The hosted retries were the existing desktop fluid-scaling assertion and mobile
breathing-shortcut case. A no-retry shortcut follow-up reproduced a startup
interaction before client readiness. A temporary diagnostic using the existing
visible mounted-theme marker passed the entire shortcut/focus flow without a
retry; its first probe incorrectly selected a hidden duplicate control, which
was corrected. The unchanged desktop scaling case separately passed without a
retry. Temporary test files were removed. No application or CI retry setting was
changed to obtain these diagnostics. The original retry evidence is retained.

The local CodeRabbit run was rejected before execution by automatic approval
review and supplies no evidence. The configured GitHub review completed at the
actual reviewed head instead.

## Production and public readback

Fresh checks before merge, before promotion and after promotion prove all 87
Production setting metadata entries unchanged, the all-payments readiness gate
intact and automatic custom-domain assignment still disabled. All six public
aliases now point at the verified artifact; all 37 other baseline mappings and
the single current Preview alias remain. There are 44 mappings in total.

One guarded merge triggered one staged Production build. Its read-only gate
verified all 46 committed migrations current; the live all-payments readiness
gate passed. TypeScript and the build passed. Sentry uploaded client and server
archives containing 531 and 2,636 files, associated with the exact merge release.
Authenticated archive inspection matched an actual emitted script's debug ID,
its recorded source-map reference and the map's identical debug ID. The public
script has no public source-map directive. Exact provider references and archive
details remain in ignored operator receipts.

All 13 staged and public route checks pass. The public script/debug ID, body
model bytes and clock font match the verified staged build. The reviewed CC0
body model is exactly 4,994,820 bytes; existing artwork returns the expected
512-pixel PNG. The apex domain returns the expected 308 canonical redirect.
Promotion assigned public traffic to that same READY artifact without rebuilding.
The prior compatible artifact remains READY for rollback.

Live browser readback verifies the grouped hub, Exercise form, My calendar and
the actually loaded interactive body. Phone and desktop views have no document
width overflow; all 16 visible launcher tiles contain their content. A signed-in
owner Calendar read completes with refresh enabled, no loading/error state and
zero items on the selected day. Private contents were not printed or opened.
No records, appointments, payments or emails were created. Screenshots and
sanitized readback evidence are stored outside source. The temporary viewport
override was reset, and the public Wellness page remains open as the deliverable.

All seven final merged-source checks passed in
[run 44855104944](https://github.com/dsbowersock/atmoshaper/actions/runs/44855104944).
Its browser matrix has 680 passing cases, no retries and 180 configured skips.
The two earlier retry cases both pass on their first attempts in this run.

The release changed no provider settings, credentials, billing, schema, live
database data, NAS configuration, remote media or legal identity. Physical-phone,
Safari and screen-reader listening remain distinct owner acceptance checks.
Closure records stay local on `codex/wellness-beta-publication-receipt` and cause
no additional build or deployment. The operation used one PR, two pushes, one
merge, one staged Production build and one same-artifact promotion. No rollback
was needed. The publication operation is closed and cannot authorize later writes.
