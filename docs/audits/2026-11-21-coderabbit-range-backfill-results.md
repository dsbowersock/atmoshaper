# CodeRabbit range backfill: results and bounded triage

Current follow-up: the owner requests closure of F1–F4. F1's local Checkout fix
and F4's fail-closed pagination checks remain passing; the F2/F3 deferred work
is now corrected and tested. All six real-Git proof cases and 163 Stripe checks
pass. One focused review from `07a3dcd` remains. See the
[specific follow-up plan](../superpowers/plans/2026-11-21-four-review-issues.md).

## Actual completed review

The fixed wider-range request completes on November 21 at the public `d7e30e0`
tree. All 60 manifest paths appear exactly once in the actual completed CLI
receipt: 30 runtime/configuration paths and 30 tests. CodeRabbit raises **64
issues: 25 major, 31 minor and eight trivial**. These are review observations,
not 64 established application defects. Raw receipts remain in ignored operator
output; no private provider identifiers or data are copied into this report.

The strict range audit admits this receipt only after checking its raw outcome,
attempt metadata, exact diff/path set and frozen head tree. All **703 changed
code/configuration/test histories** now have complete post-bootstrap evidence;
zero remain unproven. The 1,021 untouched inherited paths remain a distinct
baseline. This does not claim a fresh whole-source security audit.

This closes the missing historical range proof. It does not close the final
review of subsequent local corrections or their later release gates.

## Current-beta corrections

Seven supported behavior issues receive focused local corrections: requested-
date Calendar loading, three local-day/reminder boundary errors, stale cached
Checkout responses, incomplete managed Portal catalog evidence, and malformed
Portal pagination. They use synthetic inputs and provider stubs only.

Four small existing test gaps are strengthened (business Session identity,
business Portal selection, the second post-transition reminder, and private
schedule fields). A separate late-legacy-Session regression refutes the proposed
duplicate Checkout path. Other suggestions remain explicit finite follow-ups.

## Complete disposition register

IDs follow receipt order, independently of the initial A/W/O/B and C registers.
"Deferred test" means an accepted coverage improvement, not a reproduced runtime
bug. "Deferred tool" requires work before using that affected operator path.
"Conditional" means the proposed failure has not been established by a fixture
or provider evidence and must not be described as refuted or fixed.

| ID | Disposition | Evidence or next bounded action |
| --- | --- | --- |
| R1 | Corrected locally | Pass the validated requested local date to the practice loader; anchor both event and external-busy read windows to it. The distant-date query fixture reproduces the omission and now passes. |
| R2 | Refuted | The seed explicitly lists the obsolete action slug and deletes those persisted actions before upserts. A live reseed is neither needed nor authorized; stronger persistence coverage is separately R30. |
| R3 | Refuted | A signed-in user without a practice is forced to Personal. The owner-bound private controller loads appointments independently of empty practice data; owner/isolation checks pass. |
| R4 | Deferred tool | Include Git mode in the cleanup inventory identity before treating it as a complete index snapshot. It is not the CodeRabbit range auditor and authorizes no deletion. |
| R5 | Corrected locally | Construct next-month midnight independently of a skipped first-day midnight. America/Asuncion October 2023 reproduces the inherited 01:00 error. |
| R6 | Corrected locally | Iterate reminder candidate days from local midnight, retaining the exact requested start/end filter. A final partial day containing a reminder is no longer skipped. |
| R7 | Conditional capacity | Cleanup's bounded whole-corpus read can fail closed above 128 MiB. No supported current corpus failure is established. Size-based batching needs a separate capacity fixture before increasing supported scope. |
| R8 | Refuted | `membership-checkout.js` passes `supporterUse`; the helper rejects absent/mismatched use before Stripe work. The existing personal/business catalog and invalid-selection tests pass. |
| R9 | Corrected locally | Freshly retrieve every created/replayed membership Session before exposing its URL. Require matching ID, open status and URL under a bounded confirmation read; the original deadline still gates further creates. Cached expired responses reconcile and permit at most the existing one additional create; the second terminal result stops. See final correction F1 below. |
| R10 | Corrected locally | Construct each day end independently from a noon anchor. America/Havana March 2026 reproduces a point appearing on two days after a skipped midnight. |
| R11 | Refuted | The classifier accepts nonempty composite identities and checks the explicit catalog version. Actual v2 expanded Product readiness and current Session compatibility controls pass; v1/wrong-use cases are rejected. |
| R12 | Refuted | Production readiness is selected only by `VERCEL_ENV=production`; it runs before Prisma and reads inherited settings with `--no-dotenv`. Local inert builds and the Production rejection contract checks pass. |
| R13 | Corrected locally | An omitted Portal allowlist confirmation now additionally requires six distinct nonempty Price IDs, three distinct Products and two Prices per Product. Valid control passes; missing/empty/duplicate IDs and reused Products fail. |
| R14 | Conditional historical overlap | An in-flight donation spanning a product-name change can conflict on its preserved idempotency key. This candidate does not change that name or key. Establish recovery with a fixture before any future payload/branding transition; do not blindly rotate or create another payment. |
| R15 | Refuted | `route-entrypoints.test.mjs` already includes all four wrappers and verifies runtime exports/re-export binding, separately from injected handler tests. All 207 selected route/security/commerce tests pass. |
| R16 | Deferred tool | The closed sandbox migration's summary omits reserved lookup-key collisions from one consistency label, although failure codes stop apply. Correct that receipt label before future use. |
| R17 | Deferred tool; apply gate | The sandbox migration reads subscriptions before open Sessions. Before any future apply, require a Checkout creation pause and test completion between inventory reads; reorder the reads. No migration apply occurs here. |
| R18 | Deferred tool | Cleanup package-script parsing needs quote-aware command boundaries. Add quoted-separator and environment-assignment fixtures before relying on those root candidates. |
| R19 | Deferred test | Independently decode the legal acceptance callback destination rather than deriving both sides from the same helper. Current form behavior is not shown incorrect. |
| R20 | Deferred tool | Preserve an unknown computed segment when resolving cleanup alias chains; add computed-versus-literal fixtures. Static candidates remain non-authoritative. |
| R21 | Conditional retired migration | Reproduce the metadata-only interrupted v1 Price state against the actual classifier before changing compatibility. Future v1 retry requires this investigation; no migration is run. |
| R22 | Deferred tool | Preserve safe source/line/diagnostic fields in failed dead-code evidence. Current failure remains nonzero and withholds the candidate report. |
| R23 | Conditional retired migration | The broad partial-schema candidate check may include an approved historical Therapist Product. Freeze a representative synthetic retirement fixture before future v1 use; do not reinterpret or mutate actual provider objects in this review. |
| R24 | Conditional provider shape | List omission plus a contradictory expanded Portal retrieve is not established against the pinned API. Before future sandbox migration, compare both reads and test differing evidence. An operator attestation must not override returned contradictory data. |
| R25 | Refuted by deployment contract | The shared webhook intentionally requires the combined exact 15-event set even when only Supporter checkout is enabled. The wiki, central validator and tests agree; omitting commerce events is not an approved deployment topology. |
| R26 | Deferred tool; apply gate | Sandbox migration scans inactive v1 Prices and can block on retired duplicates. Add explicit retirement classification before future reuse; retain rejection of active duplicates. This is an operator availability problem, not permission to alter provider records. |
| R27 | Corrected locally | Portal pagination now requires boolean `has_more` and ends only at explicit false. Real CLI fixtures with missing/string markers fail while the valid complete inventory passes. |
| R28 | Refuted | `getConfiguredMembershipReconciliationOptions` retains duplicate IDs; the readiness guard counts them. The existing CLI collision test covers current/retained-v1 and historical-tier aliases and passes. |
| R29 | Refuted | Donation tax readiness is checked before creating the Stripe client or Session; absent tax gates fail closed. The actual helper and readiness tests pass. |
| R30 | Deferred test | Add a synthetic persisted-obsolete-action/dependent-row seed test. Source deletion is explicit (R2), but regex coverage alone does not prove a real reseed. |
| R31 | Deferred test | Register browser cleanup immediately after launch and protect context setup/close failures. No application lifecycle defect is demonstrated. |
| R32 | Refuted at reviewed source | Named Phase 6 baselines are tracked for desktop/mobile and Windows/Linux, and the public source receipt records all browser lanes passing. No missing baseline is established. |
| R33 | Deferred test | Return the rectangle that passed the layout-settle poll, avoiding a second unsynchronized measurement. |
| R34 | Deferred test | Bound the brand nowrap source assertion to its own CSS rule or assert computed style. Current visual tests do not establish a missing nowrap rule. |
| R35 | Deferred test | Replace the fixed pause-sampling delay with renderer acknowledgment before treating it as deterministic pose proof. Separate component lifecycle regressions already cover pause behavior. |
| R36 | Refuted for current serializer | Checklist v2 deliberately stores completion booleans at the top level, alongside nested answers/practice. The nested-checkmark premise is false. Selecting the specific key is still an optional assertion improvement. |
| R37 | Deferred test | Match the exact muscle/joint/movement tuple before historical ID comparison; do not depend on the last row's order. |
| R38 | Deferred test | Assert the selected subscription identity using the update destination or selection boundary, not merely two identical personal Portal results. |
| R39 | Deferred test | Require at least one intercepted GLB 503 in both failure tests before accepting their error list. |
| R40 | Deferred test | Use hit testing at an overlap point to prove actual dialog/shell stacking rather than comparing unrelated numeric z-index values. |
| R41 | Refuted by execution | The supported Node command imports the server's explicit relative `.ts` dependency and all 12 anatomy media delivery checks pass. No tsconfig alias failure occurs. |
| R42 | Refuted by existing execution | Both Phase 6 projects passed at the reviewed public source; readiness here uses document/font promises and synchronous storage initialization. No paused-clock stall was established. Future fixture changes must retain that journey. |
| R43 | Conditional test isolation | This spec does not locally install all public-route media/font fixtures. Capture its actual external requests before claiming complete network isolation; prior successful visual execution alone is not isolation proof. |
| R44 | Strengthened locally | The business create stub now persists a business-use Session and asserts its returned identity, retaining outbound Price/metadata checks. |
| R45 | Deferred test | Snapshot the retained default Portal before sandbox apply and assert no mutation targets it. No apply is authorized by this campaign. |
| R46 | Deferred test | Add a held legacy in-flight request case alongside the existing cached-error ordering and in-use rejection tests. It is a coverage improvement, not evidence of an actual duplicate payment. |
| R47 | Deferred test; apply gate | Repeat sandbox safety-matrix cases in apply mode with zero mutations before any future migration use. |
| R48 | Deferred test | Use actual v2 lookup-key formatting in the v1 coexistence fixture; preserve legacy formatting for retained Prices. |
| R49 | Deferred test | Make the sandbox Price list stub honor Product filtering and retain the unowned collision fixture. |
| R50 | Deferred test | Stage malformed fixture policies before asserting their content-validation errors; retain the separate untracked-policy rejection case. |
| R51 | Deferred test; fixture gate | Cleanup fixtures inherit Git repository/index variables. Do not run that suite from Git hooks or an environment supplying `GIT_INDEX_FILE`/`GIT_DIR` until setup, reads and workers are isolated. This campaign does not run that suite or alter the caller's index through fixtures. |
| R52 | Deferred test | Add passing unmodified Portal controls and diagnostic-specific assertions to the two mutation matrices; unrelated failures must not substitute for the intended rejection. New R13 inventory tests already include a valid control. |
| R53 | Deferred test | Assert each legal route's generated metadata independently rather than matching three concatenated files. |
| R54 | Deferred test | Check decoded JSON string values or both escaped/unescaped Windows paths in privacy assertions. No private path disclosure is demonstrated here. |
| R55 | Deferred test | Split compaction probes so each actually receives both input states despite earlier callable failures. |
| R56 | Deferred tool/test | Reconcile CommonMark reference-label entity semantics with an independently verified fixture before using those asset candidates. Existing policy forbids deleting from static candidates alone. |
| R57 | Refuted with new regression | A legacy Session appearing only after the first list is expired and confirmed before replacement. The real helper's synthetic payload-conflict fixture asserts exact create → expire → create order and stops at two creates. |
| R58 | Strengthened locally | Assert that the business Price actually resolves to the business Portal configuration, not only the buyer-use helper. |
| R59 | Strengthened locally | Assert the second reminder's exact post-transition UTC time. The existing first reminder was already after the transition; this additionally guards later daily stepping. |
| R60 | Strengthened locally | Put the private sentinel directly on the schedule input and assert it is absent from the normalized owner-bound schedule result. |
| R61 | Deferred test | Vary recurring and one-time support controls independently across all four combinations. |
| R62 | Deferred test | Select lifetime/import mutation targets with syntax nodes so equivalent formatting does not look like a security regression. |
| R63 | Deferred test | Exercise decreasing clock readings during the runtime call or remove the unsupported rollback claim; post-call timestamps alone do not test it. |
| R64 | Refuted by CI configuration | The ordinary code-quality job explicitly provisions matching Chromium before `npm run test`. The browser jobs provision it separately. |

## Final correction review and finite closure

The eighth and final remote request completes at `07a3dcd`, covering every one
of its 28 exact correction paths from `9712b16`. CodeRabbit raises **four issues:
three major and one minor**. The raw completed outcome, matching issue count,
Git tree and exact actual path set verify. There is no paid request or omitted
path. Do not call this a zero-issue review.

| ID | Severity | Disposition and concrete remaining scope |
| --- | --- | --- |
| F1 | Major | Confirmed in `lib/stripe-billing.js`: a successful create finishing after the reconciliation deadline cannot be confirmed. The synthetic slow-create regression fails before correction. Confirmation now has its own five-second read allowance; the original deadline still prevents further creates. Initial and retry successes pass; a slow terminal result cannot expose a URL or start another create. This small local correction is subsequent to the last reviewed head and needs ordinary PR review before release. |
| F2 | Major | Corrected locally in `scripts/coderabbit-coverage-audit.mjs` and its shared proof helper. A nested PR whose first parent contains branch work now uses the actual bootstrap blob/commit. Matching baselines stay unchanged. The real-Git regression proves a child-only review remains insufficient, while a wider complete range or full transition chain is accepted. Current 703-path proof remains unchanged. Focused follow-up review pending. |
| F4 | Major | Refuted in `scripts/stripe-readiness-check.mjs`: the caller catches a malformed inventory, records failure and exits nonzero; it cannot recover earlier accumulated pages as complete evidence. New real-CLI fixtures cover missing/string `has_more` on a second page as well as the first, with no successful default-topology result. |
| F3 | Minor | Corrected locally in `scripts/coderabbit-coverage-proof.mjs` and batch preparation. Default NUL-framed tree records and diff paths preserve Unicode, tab, newline, quote and edge whitespace names under both quotePath modes. Synthetic completed-receipt admission and actual Unicode/space/bracket/comma batch preparation pass; an unrelated staged index entry is preserved. Focused follow-up review pending. |

The final post-review Stripe suite passes 163/163, including the reproduced
slow-create boundary, bounded terminal behavior and later-page failures.
Focused lint and the subsequent inert application rebuild/TypeScript pass.
The current inventory contains zero code/test paths requiring Git pathname
quoting, confirming that F3 does not change this frozen result. This run also
has no inherited Git repository/index redirect variables. Keep the R51 fixture
use gate for future hook/custom-index runs, including the new coverage-proof
fixture, until environment isolation is implemented.
These later changes are not represented as CodeRabbit-
reviewed merely because the earlier versions of their files were reviewed.
No ninth request is started: all eight planned remote reviews are closed.

## Remaining boundary

The additional Calendar checks pass 116/116, Stripe 161/161, route/security
207/207, anatomy delivery 12/12 and Production gate contracts 20/20. The three
raw-receipt/range proof regressions, full lint and TypeScript pass, and the inert
local application build succeeds. Provider requests in these tests are stubs;
none is a live financial or database operation. Earlier application changes
retain their 16 native phone/desktop scenario receipts and applicable Windows/
Linux backup tests. Hosted checks and a newly built release remain later gates.

The final correction-delta review was the last request in this finite
campaign. No further automatic review/fix loop, whole-source rewrite, old-PR
reopening or paid review is included. Any serious issue from that final request
has been reported concretely above rather than silently expanding scope.

Deferred migration and cleanup work is not a hidden beta-application rewrite.
The affected dormant operator paths must satisfy their listed gates before
future use. Application corrections still require ordinary independent Codex
review, fresh hosted checks and specific publication authorization. Backup
script changes additionally require their separate NAS activation gate. This
review changes no provider settings, hosted rows, NAS files, payments, mail or
public deployment.
