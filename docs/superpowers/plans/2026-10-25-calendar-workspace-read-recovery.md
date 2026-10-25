# Calendar workspace read recovery

The real async Calendar page catches its membership read, but later event,
provider, preference, availability, schedule-interval and external-busy reads
escape that boundary. Six dependency failures were reproduced with the actual
page and invented read doubles; the permanent baseline yields 8 passes and
6 failures across 14 cases. No application database or provider was contacted.

Keep the existing sign-in, schema-readiness, practice-creation, membership and
requested-practice boundaries. Load all required workspace reads into one result;
on failure render the existing generic Calendar unavailable surface. Never
convert a failed read into an empty successful schedule. Preserve filters,
selected-field privacy, row limits, ordering, date handling, event mapping and
successful empty-calendar behavior. Keep transformation/programming errors
outside the I/O catch. No writes, migration, Google sync, provider permissions,
new entitlement policy, routing or notification behavior is added.

Validate the actual async page across all six faults and existing earlier gates,
positive empty/populated workspaces, unowned practice input, date normalization
and generic busy metadata. Run the related provider-free Calendar cohort,
changed-file lint, typecheck and full cached build with networking disabled.
Render the existing outage surface at desktop/mobile widths with invented reads;
that is source/rendered acceptance, not a real database or hosted-provider claim.

Use a child branch of the pinned local Notes candidate; leave all three pending
publication refs and the separate unapproved account/admin database packet
unchanged. Reconcile the four owned canonical migration records after validation.
Clean only task-owned build/browser artifacts and dependency links, retaining
failure and validation receipts. Publication and final migration acceptance
remain separately pending.

## Completed local validation

Runtime source `16e99df` passes all 169 targeted Calendar cases, scoped lint,
typecheck and the full cached build. The original parent fails the six new read
cases. All seven query projections and 2,189 frozen inputs are preserved. Three
final static-SSR views use the completed candidate CSS and pass without overflow
or browser errors. Owned temporary artifacts and links are removed. See the
[validation audit](../../audits/2026-10-25-calendar-workspace-read-recovery.md)
for exact limits and retained corrections. The source is local/unpublished;
real database/provider and complete migration acceptance remain open.
