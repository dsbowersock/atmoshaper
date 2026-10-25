# Local clinical-source parity and Windows privacy-guard repair

Date: October 24, 2026. Local migration verification; no provider or data access.

## Scope and observed result

The reviewed application source at `d6fd043` was compared with approved migration
baseline `e74045c` for the complete defined Notes, Wellness, clinical-sync,
breathing, vault, intake, handoff, local-export and account-preference cohort.
Both sides contain 47 selected files, with no added or missing files. Thirty-five
are byte-identical. The twelve remaining diffs contain the approved public
identity imports/strings and export display labels, without other changes in
those inspected diffs. Stable vault keys/formats, encrypted payload contracts,
local-first boundaries and the selected existing domain logic are preserved.

This is source evidence for that defined cohort, not an equivalence claim for all
eighty routes, transitive dependencies, authorization or the final public release.
No real patient/client record, browser profile, encrypted user vault, database,
credential, provider or clinical export was opened. Existing committed tests use
invented data in memory.

## Confirmed Windows defect

`tests/client-wellness-source-guards.test.mjs` used a file URL's `.pathname` as a
native repository path. On Windows the resulting `/C:/...` path does not exist;
paths with URL escapes are also not decoded. The directory helper then returned
an empty array for a missing root. Its two recursive negative checks could pass
without scanning the intended Wellness/Calendar implementation source.

An offline probe confirmed the old root absent with zero Wellness entries, while
`fileURLToPath` resolves the actual directory and its five component entries.
Two regression cases were added before repair: require known source files in
each of the four scanned implementation roots, and reject a missing required
path. The focused run had sixty passes and exactly those two failures.

## Focused repair

- Convert the module-relative file URL with Node's `fileURLToPath` before joining
  implementation paths.
- Make a missing required source path fail the privacy guard instead of becoming
  an empty collection.
- Retain concrete scan-coverage and missing-path regression cases, with comments
  explaining the platform and vacuous-pass risks.
- Add `test:clinical-local` for the eight existing pure helper/source test files
  and `lint:clinical-local` for the changed guard file.

No application source, CSS, route, entitlement, storage identifier, schema,
encryption, export format, migration, configuration or legal contract changes.
The source repair is an isolated local branch based on the reviewed candidate;
it does not modify any existing reviewed PR branch.

## Actual local validation

| Check | Result |
| --- | --- |
| Regression before repair | 62 cases: 60 pass, two new cases fail |
| `npm run test:clinical-local` after repair | 62 pass, zero fail/skip |
| `npm run lint:clinical-local` | Exit zero |
| `git diff --check` | Pass |

The focused cases cover encrypted vault roundtrips/bundles, malformed legacy
preservation, stale-tab merging, intake normalization/handoff, Notes entitlement
source contracts and Wellness normalization, reporting, ownership-source and
payload-separation guards. The corrected recursive scans now read their required
files on Windows. Static source guards do not execute the hosted actions or prove
their runtime authorization and persistence behavior.

Tests run with provider environment variables removed and networking disabled.
Lint uses matching cached dependencies without installation or client generation.
Owned temporary exports and the cache junction are removed after checks; the
original cache, schema, reviewed sources and previous provider receipts remain.

## Remaining release boundary

Publication/review of this local testing repair is still required before treating
it as part of a final release candidate. No push, merge, Preview build, Production
promotion, new database, provider request, email, payment, media transfer or Sentry
activation is included. Existing protected purchase, Anatomime and Sentry
acceptance remain closed; this does not repeat them.

Final browser sign-in/role decisions, cross-origin data transfer/recovery and
invented-record Notes/Wellness journeys on the exact offered artifact remain
separate acceptance work. Hosted clinical storage remains gated. The private R2
copy proposal is unchanged and still awaits its own actual owner approval.
