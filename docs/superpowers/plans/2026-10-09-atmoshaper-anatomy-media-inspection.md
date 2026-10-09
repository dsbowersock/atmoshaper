# Anatomy media inspection before a branded cutover

Prepared October 9, 2026. Read [project state](../../project-state.md),
[project log](../../project-log.md), the
[independent launch plan](2026-10-08-atmoshaper-independent-launch-readiness.md)
and [compatible media plan](2026-10-08-atmoshaper-compatible-media-cutover.md)
first. This is source inspection and a prepared read scope. It does not authorize
a database connection, catalog query, URL change, upload or provider operation.

## Two consumer paths need evidence

The [study metadata reader](../../../lib/anatomy-study-media.ts) selects IMAGE/
DIAGRAM assets with OPEN_REUSE and REVIEWED status, the BodyParts3D source and at
least one non-null remote/thumbnail value. The
[study builder](../../../lib/anatomy-study.ts) then applies further source,
license and link gates before choosing uploaded, remote or thumbnail media.
Counts satisfying the loader predicate do not prove actual image visibility.

The [entity-detail query owner](../../../lib/anatomy-queries.ts) reads linked
media assets more broadly; its detail path does not apply that same study
predicate. Inspect the full media catalog alongside the separately labeled
study-loader cohort. Do not claim a flashcard-only change covers entity detail,
model/source-link media or administrative consumers.

The [upload owner](../../../lib/anatomy-media-review-server.ts) builds URLs for
future uploads from the existing public-base setting. Changing that setting
does not rewrite existing `remoteUrl`/`thumbnailUrl` values. Preserve object
keys, storage-variable names, asset/link identities, review state and legal
source/license/attribution references. Do not run the existing uploader, seed or
backfill as an inventory shortcut.

## Prepared aggregate-only inspection

Two proposed SQL files and their source/query hashes are retained in the
owner/SYSTEM-protected operation journal. They have not been executed or
validated by a PostgreSQL engine; no database or application was started.
The privately named candidate resource matches the previously verified
independent integration project and its sole metadata-listed branch. That
metadata does not establish the deployed credential/branch binding. Refresh
the exact target and obtain explicit read authority before dispatch.

The first query examines only ten named schema fields in `information_schema`
and requires matching types, read-only mode and a repeatable snapshot. The
second query reads only `AnatomyMediaAsset` and `AnatomySource`, returning one
aggregate JSON object. Its output contains fixed numeric counters and at most
24 groups: two cohorts, two URL fields and six fixed reference classes.
No IDs, slugs, raw URLs, object keys, titles, notes, arbitrary metadata or
source/license text return. User, clinical, practice, Calendar, Notes, ROM,
media-view-request and test-state tables are excluded.

The classes distinguish absent, empty, exact legacy path, exact proposed branded
path, relative path and other reference. Literal origin comparisons deliberately
leave alternate case, ports and other noncanonical forms in the last class;
they do not justify rewriting those values. Per-group distinct counts are not
a global unique-object count. Storage-path counters expose no path values.

Proposed execution bounds are two result rows, 16 KiB retained output, five
seconds per statement, one second waiting for locks, ten seconds idle in the
transaction and twenty seconds overall, with no retry. Execute the guard first
and stop unless all three booleans pass. Always roll back and close only the
owned session on success, stop or deadline. A future executor must enforce
output/overall bounds and reject unexpected response fields before persistence.

Use one explicitly read-only repeatable-read transaction with transaction-local
timeouts, following PostgreSQL's [transaction controls](https://www.postgresql.org/docs/18/sql-set-transaction.html)
and [local-setting semantics](https://www.postgresql.org/docs/18/sql-set.html).
No session-wide setting, role/grant change, temporary table, function, mutation
or explain/analyze operation is part of the packet. Do not use credentials from
completed earlier acceptance or print a connection string.

## Decision after authorized counts

Confirm which actual consumer paths need legacy-origin rebinding. Choose a
reviewed runtime mapping or a separately scoped persisted-URL migration based
on those counts and the exact target, preserving unrelated origins and legal
references. Unknown forms need further bounded evidence rather than a blanket
replacement. Counts do not prove payload existence, private-storage contents,
rights acceptance or complete independence.

Before activation, verify the independently managed branded anatomy domain,
exact allowed object paths and browser GET/HEAD behavior. Include flashcard and
entity-detail image delivery, any offered model/source-link behavior, review/
entitlement preservation and the user's legacy tools in the acceptance scope.
Canvas/export needs determine any separately authorized CORS change; ordinary
image display alone does not establish that requirement. Keep old domains,
objects and database values available for the exact rollback.
