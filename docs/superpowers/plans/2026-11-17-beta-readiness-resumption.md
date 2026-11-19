# Beta readiness resumption

## Scope and source

Finish the already documented feature set for a small beta. The owner confirmed
on November 17 that there are no new feature requests for this pass. Preserve
local-first clinical records, feature-key entitlements, legal history and durable
compatibility identifiers.

The isolated branch `codex/beta-readiness-20261117` starts from verified GitHub
main `012952bd9b21f6c49e9063d8a235d9bae65d0327` (PR #68). Its existing
[hosted CI](https://github.com/dsbowersock/atmoshaper/actions/runs/42125868836)
passed. GitHub reported no open PRs during this resumption. The chat's original
checkout remains on an older September branch, and the retained migration
worktree contains uncommitted November 5–7 continuation records. Preserve both;
do not substitute their uncommitted source for the integrated release.

Use the canonical state/log, the existing migration status and the
[service/recovery acceptance plan](2026-10-29-final-service-recovery-and-release-acceptance.md)
as the existing owners. This plan coordinates resumption, not a new definition
of launch readiness. November continuation results remain dated evidence with
their original limits; expired operation windows and unused reservations are
not reusable authority.

## 1. Re-establish a reproducible local baseline

- Install the exact lockfile in this isolated checkout; do not copy environment
  files or credentials from another worktree.
- Generate the local Prisma client and validate the schema without migrations
  or a database connection.
- Run repository lint, typecheck and the complete provider-free unit suite.
  Save local logs under ignored `output/beta-readiness/`.
- Use `npm run test:beta` for the full local rerun with two active files. The
  initial default run was stopped after failures under severe memory pressure;
  its failing Calendar/commerce groups pass in isolation (69 passed, one
  platform skip). Keep the first attempt's log and assertions unchanged.
- Run a local production build with provider configuration absent. Distinguish
  its local compile result from deployed migration/payment readiness.
- Fix reproducible beta-relevant failures with focused regression evidence.
  Record environmental prerequisites and genuine skips explicitly.

## 2. Reconcile remaining beta work

| Area | Carry forward | Missing acceptance / implementation |
| --- | --- | --- |
| Application and local records | Integrated account/Admin, local Calendar, clinical/public-tool, Chimer and persistence campaigns at their recorded scopes | Fresh local baseline and only genuinely uncovered final-release journeys; preserve encrypted local-first records |
| Media and anatomy | Integrated independent delivery source; dated protocol checks and four-card hosted pilot in the continuation records | Offered catalog/playback/fallback and remaining individually offered image dispositions; do not require every held image to be activated |
| Realtime | Accepted isolated Anatomime guest and password/progress campaigns | Verify the offered artifact's existing Ably app binding and final signed-in context |
| Error reporting | Accepted protected Sentry error/map/privacy/owner-email campaign; screenshot-confirmed Developer plan and published plan limits below | Current effective privacy/inheritance/retention and final runtime/build binding; reuse the existing project and avoid another synthetic event |
| Account mail and Google Calendar | Existing local account/Calendar proof and dated public sender-DNS evidence | Exact offered-origin sign-in/recovery/mail authentication and consenting Calendar sync/reconnect/disconnect |
| Purchases | Accepted recurring and separate sandbox campaigns; dated live catalog/Portal proof | Exact artifact account/key/reference/signing-secret agreement, applicable tax/legal prerequisites and missing signed/browser/fulfillment acceptance for all three paths; retain disabled flows until their gates pass |
| Recovery and support | Existing recovery-capability observations and local Notes recovery proof | Owner recovery objectives/capacity, isolated restore acceptance, support/limits handoff |
| Release | PR #68 and its successful hosted CI | Exact offered artifact/configuration, compatible rollback, final acceptance and owner release decision |

## 3. Prepare external setup as concrete decisions

Routine connector metadata may establish current gaps without exposing secret
values. Prepare the smallest reviewable configuration/acceptance change from
actual evidence. Under repository AGENTS.md, deployment, DNS/provider/database
writes, real email or payment, media mutation and public promotion each require
exact separate authorization. Do useful local work first; ask only at that
concrete boundary. Existing successful campaigns remain closed.

## Completion record

November 18 live continuation: the owner explicitly approved the scoped Ably
key, Production-only Vercel Secret and two Sentry protections, then separately
authorized updating the public site. All three service changes are saved and
verified. A fresh exact-main Production build passed both actual readiness
gates, compilation, TypeScript and all 115 pages. Seven staged browser entry
checks passed; the approved promotion is verified on all six live aliases,
with zero unrelated mappings changed. Seven post-promotion HTTP checks return
200 and the apex 308 redirect is preserved. The prior READY source `38d0ded`
remains the rollback reference. See the
[service/deployment receipt](../../audits/2026-11-18-live-service-binding-and-site-update.md).
Sentry runtime/source-map authentication and the remaining hosted journeys,
recovery and beta acceptance are still pending; publication alone does not
close those gates.

| Local check | Result |
| --- | --- |
| Locked install | Passed; 1,163 packages, existing patch applied |
| Prisma generate / validate | Passed without a database connection |
| Repository lint | Passed, zero errors/warnings; existing Babel size note is informational |
| Typecheck | Passed |
| Isolated failed groups | 69 passed, one platform skip |
| Full `test:beta` | 5,663 total; 5,659 passed, four skipped, zero failed/cancelled; 999,775 ms |
| Local production-mode webpack build | Passed; compilation, TypeScript, 115/115 static pages, optimization and traces; Production migration/Stripe gates correctly skip locally |
| Desktop/mobile Chromium anonymous public routes | 52/52 passed in 3.6 minutes, zero skips/retries, ordinary production build with inert provider/server configuration and intercepted external resources |
| Final documentation contracts / hygiene | 16/16 passed; diff check passed; owned browser-test port has zero remaining listeners |

Logs are in ignored `output/beta-readiness/`. The first default-concurrency run
was stopped after failures under memory pressure; the passing bounded run does
not erase that attempt. Only test-file scheduling changed; runtime code,
assertions and deadlines are unchanged.

The four full-suite skips are two native file-link fixtures unavailable under
this Windows host's privileges, one POSIX-only process-group fixture, and one
credential-free dry run requiring an unavailable ignored local catalog. No host
permission or catalog setup was changed to force these cases to run.

November 17 service evidence: owner-supplied Sentry organization billing
screenshots confirm Developer plan/5,000 included Errors, five accepted and
zero dropped in the displayed period. The uptime-monitor capacity warning is
separate. Sentry's [published plan](https://sentry.io/pricing/) includes a 30-day
Developer lookback and [no pay-as-you-go overage](https://www.sentry.help/en/articles/13965037-can-i-set-up-an-on-demand-pay-as-you-go-budget-for-my-free-developer-plan).
No overage-budget configuration is needed on the observed free tier. Effective
project retention was not shown; app-specific binding/privacy remain unverified.
Dashboard automation initially could not start; after the owner-led app restart,
November 18 regular-Chrome access succeeds. Recovery
objectives remain open; the owner requested a clearer explanation and no option
was selected.

The owner's Ably package screenshot confirms Free resource-based pricing,
six million messages/month, 200 peak connections and 200 peak channels. Use the
observed existing package, rather than substituting a newer public MAU plan's
allowance. Current usage and the app's effective runtime key/binding remain
unverified. No upgrade, plan migration, new app or key was created.

The next work remains existing-service binding and genuinely missing offered
journeys. The November 17 connection diagnosis found a persistent per-user
`CODEX_CLI_PATH` override pointing at a removed executable. The one value was
backed up in ignored output, removed, and independently read back as absent;
the app-managed current executable is present and runs. The owner then fully
restarted Codex and attached the exact Ably tab; November 18 dashboard reads
successfully use the existing signed-in Chrome profile. See the
[official browser troubleshooting flow](https://learn.chatgpt.com/docs/chrome-extension#troubleshooting).

The [November 18 service-binding packet](2026-11-18-live-service-binding.md)
now prepares the exact scoped Ably key, Vercel Production-only secret destination,
two Sentry project corrections, readback and recovery boundaries. The forms are
unsaved; provider-write approval is the next boundary. Vercel's live overview
also identifies the public artifact as October 7 source `38d0ded`, distinct
from newer READY Production-target metadata. No deployment is authorized by
the binding packet. The public-route smoke does not replace
real sign-in/recovery, consenting Calendar synchronization, hosted media,
signed payment fulfillment, recovery or final release acceptance.

Update project state and chronological log with actual local outcomes, any fixes
and the next concrete external step. A green local suite does not mark the beta,
all-payments configuration, hosted recovery or public release complete.
