# Wellness, Exercise and My calendar publication

Status: published, verified and closed, including all seven merged-source checks.
No unused write capacity remains. See the
[publication receipt](../../audits/2026-11-20-wellness-beta-publication.md).

## Authorization and selected source

The owner requests: "Okay, let's publish all of the wellness updates we've made
so far, including the exercise tool and My calendar." This authorizes a new
publication operation, independent of the closed November 19 release.

Start from public `7785ae6` and integrate only the nine Wellness changes from
`1c32975` through `7446c75` (the aggregate diff after `42006a9`). The four newer
business-planner commits remain in their existing checkout. Resolve shared test,
package and chronological-document contexts while preserving the public planner
baseline. Preserve the original checkout, previews and private drafts.

The story is: a person chooses a Mind, Body or Context tool, records the detail
they want, then reviews their own records through Timeline, progress or My
calendar. Anonymous practice data stays in memory. Signed-in consumer Wellness
uses the existing owner-scoped storage; therapist professional records remain
in the local encrypted vault. Calendar is a read projection, not a copy into
practice scheduling or Google Calendar. No schema migration is introduced.

## Review and validation

Run full lint, unit tests, Prisma validation/generation, an inert TypeScript
build and the applicable desktop/mobile Wellness browser journeys on this
isolated candidate. Inspect the diff to prove planner runtime and schema are
unchanged. Use the repository's configured hosted review and require all current-head
hosted checks and review issues resolved before merge. The local CodeRabbit run
was rejected before execution by automatic approval review and provides no
review evidence. Any in-scope correction
requires fresh relevant validation and review at the resulting head.

## Service preflight and publication

Reuse the existing Vercel project and access. Compare complete Production
setting metadata and alias mappings against the closed November 19 receipt.
Require all 87 settings unchanged, the all-payments gate intact, automatic
custom-domain assignment disabled, and the current public artifact READY.
Record exact provider references only in ignored operator receipts. Do not
create a token, share URL or new service binding.

Expect one review PR and its protected Preview, one guarded merge, one automatic
staged Production build and one promotion of that same verified artifact.
Retain the current artifact for a single rollback if needed. Bound the live
operation to four hours after fresh service preflight. Read an uncertain write's
outcome before any retry; diagnose a failure before another build or mutation.
Recheck configuration, aliases, source, checks and review immediately before
merge and promotion. The merge tree must match the reviewed tree.

The actual Production build must pass read-only migration status, all-payments
readiness, TypeScript and Sentry client/server uploads. Match an emitted debug ID
and its script/map pair in the authenticated Sentry release archive. Check the
protected staged Wellness, Exercise and My calendar entry points, body asset,
existing entry routes, clock font and artwork. Promote once; verify the public
alias mappings, preserved unrelated aliases and settings, canonical redirect,
and matching staged/public assets. Keep protected access enabled.

Live browser verification is read-only: inspect launchers, anonymous tools and
account access without saving private records, scheduling events or opening
clinical notes. Synthetic recording and calendar tests stay in isolated QA.
Physical-phone, Safari and screen-reader listening remain owner acceptance.

Close with a tracked local receipt without causing another deployment. This
release does not authorize provider configuration, credential, payment, email,
NAS, database/schema, remote media or legal changes.

## Integrated hosted-check correction

PR #75 at `03b61c4` passes hosted lint, TypeScript and browser build. Hosted
unit checks find one stale closed inventory: the RSC-session consumer list omits
the new `app/calendar/personal/page.tsx`. Add that expected Server Component
caller and the separately compiled Calendar Server Action while retaining the
existing request-scoped cache and direct-action authentication checks. The new
action exception explicitly requires its server directive; it is not a broad
filename exemption. Application code is unchanged. The corrected head requires
fresh hosted checks, review and protected Preview before merge.
