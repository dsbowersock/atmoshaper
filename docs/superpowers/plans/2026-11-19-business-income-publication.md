# Business Income Planner publication

Status: owner approved; integrated validation and fresh preflight in progress.

## Scope and source

The owner requests: “Okay, let's publish the Business Income Planner fixes too”.
Publish the compact mobile header, scenario layout and contained inputs/results
already verified at `0d48772`, integrated onto published `81b18e8` with its
completion records. Preserve the previous breathing/Clock fixes and all planner
calculations, defaults, account/device storage behavior and compatibility keys.
No provider-setting or credential change, payment/email campaign, clinical-data
access, database migration application or NAS operation is needed.

## Validation and review

1. Re-run all existing planner calculation/source/storage tests and focused
   lint on the integrated source. Build with the inert browser-QA environment.
2. Run both new actual-app planner cases in desktop and mobile Chromium. Cover
   320–412px phones, landscape, desktop and enlarged text, all presets, nested
   content containment, synthetic calculations and reload persistence. Reject
   client errors, failed responses and accidental anonymous account sync.
3. Confirm the financial domain, schema and dependency files are unchanged.
4. Freeze the verified candidate, push a review PR with protected Preview, and
   require all seven hosted jobs at the final source head. Inspect review
   findings; reproduce and resolve material findings before merging.

## Fresh service preflight and publication

Use the existing authenticated CLI and existing protected-deployment access.
Read complete Production setting metadata and routing; compare all 87 entries,
the existing all-payments scope, disabled automatic domain assignment and the
current 41-alias baseline. Confirm published `81b18e8` is READY and retain that
artifact for rollback. Store private references only in ignored operator files.

Begin a fresh bounded operation after successful preflight. Record actual
attempts and never retry an ambiguous write without reading its outcome.
Expect one PR, its protected Preview, one guarded merge, one automatic staged
Production build and one promotion of that same verified artifact. A focused
review correction stays within this planner publication scope; every changed
source head requires fresh applicable checks. Do not reuse a previous closed
operation or bypass required checks.

Before merge, verify the final head, hosted jobs, review threads, configuration
and alias baseline. Verify the merge tree equals the reviewed candidate. The
actual Production build must pass read-only migration status, live all-payments
readiness, compilation/TypeScript and client/server Sentry uploads. Verify an
emitted debug ID and corresponding source map in the new release archive.

Read staged entry routes including the planner, the reviewed clock font and
artwork. Recheck configuration/routing immediately before promotion. Promote
the READY artifact once, verify six public mappings and preserve the other 35
baseline mappings plus the expected new Preview alias. Check public routes,
canonical redirect and staged/public asset agreement, and confirm unchanged
Production setting metadata. Retain the prior READY release.

## Live acceptance and closure

Inspect the live planner layout without changing an existing user's business
draft. Synthetic edits and persistence checks belong to isolated QA fixtures.
Capture the compact header and contained form/results, check optional guidance
and captured browser errors, then record completion and limitations. Physical
phone and Safari acceptance remain owner checks. Close write slots and record
completion in a local documentation receipt without another deployment.
