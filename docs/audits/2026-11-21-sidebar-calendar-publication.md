# Sidebar and private Calendar publication

Published November 21, 2026. Public acceptance, all seven merged-source CI checks
and final source/settings/routing readback pass. The release operation is closed.

## Source and independent review

[PR #77](https://github.com/dsbowersock/atmoshaper/pull/77) merges reviewed
`61a7c6ae35bb3e2c3fa07b5f8de11e407a10de80` as
`d7e30e022d825d9f26ed37bd6636f11bae1e8314`. Both Git trees are identical.
The owner authorizes the sidebar and Calendar publication. The separate bounded
retrospective review of older shipped work is not completed by this release.

The sidebar groups Atmosphere, My Wellness, My Practice and Learn & Play, with
one Clock & timer and one Business Planner entry. My Calendar and Practice
Calendar open the shared Personal/Practice/Together workspace. Together displays
the owner's private layer beside one selected authorized practice; existing
multiple memberships remain selectable. This does not implement practice fees
or change subscription levels, memberships or account ownership.

Personal records remain owner/window bound, read-only, paginated and separate
from scheduling writes, preferences, availability/free-busy and Google sync.
Selected-practice service list/new/edit routes, creation/return links and the
viewed local date remain consistent. Full-day personal layers cannot write
ineffective day-bound settings.

The initial actual CodeRabbit CLI review covers 40 changed paths and identifies
four issues, two shared with Codex. The GitHub app then completes a substantive
40-file review at `610c1ff`, raising four additional supported issues. Those
include selected-practice services, day-bound writes, role-denied context and
an overstated historical PDF acceptance record. Codex subsequently identifies
practice-switch date loss. All nine distinct supported issues are addressed.

The final CodeRabbit follow-up at `61a7c6a` processes all 15 selected correction
files and reports no actionable findings. It is a completed bot-comment update
with an explicit finished acknowledgement, not an empty PR review submission.
Across actual completed receipts, all 35 current changed code/configuration/test
paths have exact matching reviewed Git blobs. Four binary screenshot references
are verified separately. Skipped/rate-limited attempts are not counted.

## Source validation

All seven reviewed-source repository checks succeed. Current-head Codex review
is clear and all six inline discussion threads are resolved. All 112 focused
checks, lint, TypeScript and actual phone/desktop Calendar regressions pass,
including moved-date source/split changes, practice switching, explicit preference
patches, stale-practice recovery and independent personal access.

The first hosted run also finds four intended sidebar screenshot changes and
a planner test acting before hydration. Only the four Linux references change;
every changed pixel is inside the approved collapsed sidebar. The planner test
waits for its saved-draft readiness message. All six affected Linux phone/desktop
journeys pass without further reference updates. These corrections change tests,
not application behavior outside the requested navigation.

## Staged and public acceptance

Fresh initial, premerge, prepromotion and public snapshots verify unchanged
metadata for all 87 Production settings, the all-payments gate and disabled
automatic domain assignment. Of 45 baseline aliases, six public mappings move
to the new artifact and 39 remain unchanged. One expected Preview alias brings
the total to 46. Exact private provider references stay in ignored receipts.

One automatic staged Production build is READY and matches the merged source.
Its existing read-only migration/payment gates, TypeScript, client Sentry upload
and server Sentry upload pass. The authenticated Sentry dashboard shows 539
client artifacts and 2,658 server artifacts for the exact merged release. The
actual staged script's debug ID matches its uploaded script and referenced map.
This pairing is verified through artifact metadata in the dashboard, not a
claim to have downloaded map bytes. The sensitive CI token remains unreadable.

Actual staged PDF downloads pass byte/text readback using fictional isolated
device drafts. The launch report has six pages and 23,078 bytes, all 25 example
answers, Unicode and professional-review notices. The outline has seven pages
and 23,735 bytes, relevant reused checklist answers, its own narrative, Unicode
and notices. No server writes or owner worksheets are used. This also clears
the previously documented deployed-export evidence gap without rewriting the
historical fact that the preceding release missed staged readback.

That same verified build is promoted once. All 23 public entry routes pass,
including anonymous personal/practice Calendar and service-management boundaries.
Public script bytes, bold normalized Clock font, PDF font, body model and artwork
match the staged artifact. Public phone and desktop sidebar/Calendar journeys
pass without browser errors, scheduling writes or opening real records.
No provider-setting, credential, database/schema, payment/email, NAS, legal or
media mutation is part of this release.

## Recovery and closure

The previous compatible `0976d7d` artifact remains READY for the single allowed
rollback; none is used. One review PR, merge, Production build and promotion are
complete. All seven checks in the merged-source
[CI run](https://github.com/dsbowersock/atmoshaper/actions/runs/44881426442) succeed.
Final source/settings/routing readback passes at closure. This local receipt
branch is not pushed and triggers no additional build.
