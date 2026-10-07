# AtmoShaper existing-project Vercel integration

Latest hosting continuation: the separately approved October 7
[Production Calendar credential/build stage](2026-10-07-atmoshaper-calendar-production-credentials.md)
created exactly four Production-only settings and one fresh candidate at reviewed
`38d0ded`. It reached `READY` at `2026-10-07T21:03:42.652Z`; actual build gates,
seven ordinary GETs and the signed-out Calendar guard pass. All 60 settings are
Production-only; original 56 metadata, public PR #37 target, all six aliases and
manual promotion/build/Git/protection remain intact. No restoration was needed.
This candidate is unpromoted; public Calendar activation needs separate approval.
No Production OAuth or completed provider test was repeated.

Earlier source-merge continuation receipt: [PR #40](https://github.com/dsbowersock/atmoshaper/pull/40)
merged under exact approval at `2026-10-07T05:14:22Z` as
`38d0deddea484938e13df61927d07a7b21f92071`. Reviewed head
`0f486e554c9b3104dee70a3f2c00c33ffe031c7a` passes all seven CI jobs, Vercel,
clean Codex review and completed explicit full CodeRabbit coverage of all 20
files with no new actionable comments. Its one automatic Production candidate
reached `READY` at `2026-10-07T05:17:34.607Z`; actual migration-status and live
Supporter gates and all seven normal authenticated GETs pass. Post-build
readbacks retain all six saved live aliases and the public target on PR #37,
verified domains/apex redirect, protection, manual custom-domain promotion,
standard build and GitHub/`main`. No alias restoration was needed. The candidate
remains unpromoted, all four Calendar keys remain absent, both public pause
flags remain false, and excluded purchase switches remain unset. No duplicate
manual build, completed Calendar comparison or live payment test was repeated.

Earlier continuation receipt: [PR #39](https://github.com/dsbowersock/atmoshaper/pull/39)
merged under exact approval at `2026-10-03T17:02:47Z` as
`2e01e8509b42ab73c85d286f2725c824770aeeec`. Reviewed head
`7064a6fb63340fabc29adfd695e0824a1d21c2ed` passed all seven CI jobs, Vercel,
full CodeRabbit coverage of thirteen files with no actionable comments, and
clean Codex review. Its automatic Production candidate reached `READY` at
`2026-10-03T17:05:28.696Z`; both actual readiness gates and all seven normal
authenticated GETs pass. All six saved live assignments and the public project
target remain on PR #37, with the same apex redirect, protection, standard
build command, manual promotion, and empty Preview configuration. No alias
restoration was needed. The candidate remains unpromoted, Calendar keys remain
absent, and no manual build or live payment test was repeated.

Continuation receipt: PR #38 merged under exact approval at
`2026-10-03T02:55:51Z` as `c26e2f7b4c977a09f82f1eb83d1bde8f797f6bed`.
Reviewed head `3558ff4a81e03f347818acf6f14980c64a008118` passed all seven
CI jobs, Vercel, full CodeRabbit coverage of five files, and clean Codex review;
all three threads are resolved. Its automatic Production candidate is `READY`,
with both actual readiness gates and seven authenticated GETs passing. The
build moved two saved convenience aliases to itself; both were restored under
the user's explicit approval. Final readback preserves all six saved live
assignments and public project target on `f184fc1d2ea9cf0adfeff7d810d9db408fc6970e`,
verified domains/apex redirect, protection, and manual promotion. This candidate
is unpromoted; no second manual build or public rollout occurred.

Status: existing-project settings, exact-artifact promotion, and public GET
checks verified under separate approvals, 2026-10-02. Remaining migration gates
are still open. PR #37's separately approved source merge is complete
as `f184fc1d2ea9cf0adfeff7d810d9db408fc6970e`; its reviewed gate is on `main`.
PR #36's Calendar source-only merge is also complete. Preflight verified the
settings and all four original live alias assignments through normal
authenticated CLI reads. The user subsequently approved the bounded hosting
stage below, including narrow App access and one unpromoted candidate, while
excluding public promotion.
The same project's rename, manual promotion control, explicit Build Command, and
GitHub/`main` connection are verified. One staged Production build reached `READY`
with both remote readiness gates passing. All seven protected candidate GET
checks pass. The user separately approved promotion of this exact existing
artifact with rollback if verification failed. Promotion and all public checks
passed without rebuilding or rollback. Sanitized operator receipts are published
in [PR #38](https://github.com/dsbowersock/atmoshaper/pull/38), reviewed and merged
under its separate approval as recorded above.

Read [project state](../../project-state.md), [project log](../../project-log.md),
and the [migration ledger](../../wiki/migration-status.md) first. Preserve the
existing live AtmoShaper project and the separate full MassageLab service.
Do not reimport the app, create a replacement hosting project, or transfer
provider ownership to repair a name or Git connection.

## Verified starting point before approved execution

- The user's current Dashboard screenshot shows the existing AtmoShaper
  project serving `www.atmoshaper.com`, a preview-era project name, and
  `Connect Git Repository`. Its Git connection was absent at preflight. This
  satisfies the earlier manual observation request; do not request it again
  or infer that the repository was never connected historically.
- Subsequent user screenshots show Production's `No branch configuration`
  overview and its Branch Tracking detail. `Auto-assign Custom Production
  Domains` is present and enabled. This read-only check is satisfied; do not
  request it again. No setting was changed. The screenshot's domain section
  is not a complete deployment/alias rollback inventory.
- Hosting, Google sign-in, administration, SMTP/support routing, and recurring
  Supporter billing already have operational receipts. Public registration
  and recurring Supporter Checkout are open. One-time support and background
  purchases remain disabled. Do not repeat the completed live payment test.
- PR #36 merged as `154f9b6d440e0842892b96e185190c5be1ed2e22` at reviewed
  head `0c3241cb3052877f07453d31b97b71ae4337e3eb`. Fresh post-merge reads show
  the same latest `READY` Production deployment with source CLI. No build or
  public deployment was triggered by that source-only merge.
- The starting live runtime was reviewed merge
  `7756080c3bc650bdbcff33013ff67728a3f97efa`. The newer Calendar source is
  provider preparation, not activated integration. Keep Calendar configuration
  inactive during this hosting stage; its acceptance follows the separate
  [Calendar plan](2026-10-01-atmoshaper-google-calendar-preparation.md).
- The project-detail connector's argument mismatch and the browser policy
  limitation remain tool issues. The user restored normal CLI login and approved
  read-only checks; authenticated API reads now verify the saved existing target
  and scope. All four aliases point to the approved `READY` deployment at
  `7756080c3bc650bdbcff33013ff67728a3f97efa`; both custom domains are verified
  and the apex retains its `308` redirect to canonical `www`. Private rollback
  metadata is captured without recording provider IDs or secret values here.
- Starting settings were Next.js, Node 24, repository root, and no
  Build/Install/Output override. Git was absent and custom-domain auto-assignment
  enabled. Approved execution changes are recorded below.
  Production auth uses the canonical custom origin; both public pauses remain
  `false`. Excluded purchase switches and Calendar credentials are absent. All
  56 project variables target only Production; Preview/Development have none.
  Direct Production URLs and Preview deployments require Vercel sign-in.
- Vercel's owner-specific repository search initially reported `Vercel App is not installed`.
  Its namespace listing cannot run through this CLI's automatic team scope;
  the GitHub CLI credential cannot list App installations. Do not infer the
  owner's entire installation history from those limits. The user completed
  normal App access and the Dashboard connection; direct project readback now
  verifies the repository/branch. That evidence supersedes repository discovery.
  Do not repeat the grant or connection. Preserve existing repository grants.
  See [Vercel's repository-access guide](https://vercel.com/kb/guide/unable-to-find-github-repository)
  and the [Vercel GitHub App](https://github.com/apps/vercel).

## Approved hosting result

| Item | Verified setting / behavior |
| --- | --- |
| Existing project name | `atmoshaper`, same immutable project/scope |
| Git repository | `dsbowersock/atmoshaper`, connected to the existing project |
| Production branch | `main` |
| Production promotion | Staged builds with manual promotion; no standing approval to publish every merge |
| Live site and services | Checked reviewed PR #37 artifact promoted without rebuilding; canonical host, environment, provider identity, and separate MassageLab service preserved |
| Calendar | Source may be included in an approved candidate build; provider configuration and activation remain gated |

Vercel Git integration normally builds pushed branches and production-branch
merges. Connecting a repository can therefore have deployment consequences;
it is not merely a label change. Vercel documents a Production Branch Tracking
control to disable **Auto-assign Custom Production Domains**, after which new
Production deployments await manual promotion to serve those domains.
Confirm the control exists and applies to this actual project before connecting.
If it cannot be established, stop and present the actual consequence instead
of promising that a Git connection cannot publish.

Sources: [Git deployments](https://vercel.com/docs/git),
[staged Production deployments](https://vercel.com/docs/deployments/environments).

## Read-only preparation before requesting execution

1. Read the existing project's General, Git, Environments/Production, Domains,
   Build, and Deployment Protection settings through a permitted normal access
   path. Identify the exact target privately from its saved immutable project
   identity and canonical domain. Do not put provider IDs or credentials here.
2. Capture private rollback evidence: prior project name, current branch/control
   values, all current custom and convenience alias assignments, approved live
   deployment, and relevant configuration. Record only sanitized outcomes in
   this repository. Verify the current deployment is recoverable; a project
   list or summary is insufficient.
3. Audit name-based references without exporting secret values: generated-host
   origins, environment settings, callbacks, webhook endpoints, deploy hooks,
   CI and local links. Existing canonical-domain sign-in and billing endpoints
   should need no change if they do not reference the generated host for the
   preview-era project. Explain any actual exception before expanding the
   requested scope.
4. Check the proposed name is available in the existing scope, and verify the
   GitHub integration can access this repository. Identify required app access
   privately. Do not broaden installation permissions to unrelated repositories.
   At preflight the scope had no project named `atmoshaper`; the approved existing
   project now has that name and verified Git access. If an existing installation is present,
  add only this repository while retaining its other grants. This step has now
  completed under the hosting approval. If future installation or
   account association requires a human confirmation, supply the exact normal
   screen and wait; do not replace the project or alter unrelated installations.
5. Verify install/build/root settings against this source's package scripts.
   Require the standard `npm run build` entrypoint so its Production prebuild
   runs read-only migration status, live Supporter readiness, then Prisma
   generation. A direct `next build` bypasses that npm lifecycle. Reconcile any
   actual override before approval; never substitute automatic schema application
   for a failed migration-status check.
6. Read the Preview configuration boundary. Do not give ordinary branch/PR
   deployments Production database or service credentials. If existing Preview
   configuration cannot safely build, keep that behavior gated until appropriate
   isolated resources and exact authority exist. A staged Production candidate
   uses Production configuration and is not isolated provider QA.

Vercel keeps its immutable project identity across a rename. New generated
deployment URLs use the new name; old generated URLs are not guaranteed.
Environment and provider references are not rewritten automatically. Custom
domains have separate assignments that must be verified. Renaming back alone
is not proof that old generated links recovered.

Source: [Vercel project rename behavior](https://vercel.com/kb/guide/how-do-i-change-the-name-of-my-vercel-project).

## Bounded execution proposal after settings are known

Request one concrete authorization for the verified existing target that names:

- the rename to `atmoshaper`;
- normal Vercel GitHub App access to only `dsbowersock/atmoshaper`, preserving
  existing grants, with any required human installation/account confirmation;
- disabling automatic assignment of custom Production domains and reading back
  that setting before repository connection;
- setting the existing project's Build Command explicitly to `npm run build`,
  without changing install, root, runtime, environment, or protection settings;
- connecting only `dsbowersock/atmoshaper` with Production branch `main`;
- a possible first unpromoted Production candidate build from the approved
  reviewed source, including read-only migration and Supporter readiness checks;
- restoration of the exact owned pre-operation assignments/settings if an
  unexpected movement occurs, and disconnecting only the new Git link if needed.

This does not include public promotion, DNS changes, secret replacement,
provider callbacks, database migrations, Calendar activation, payments, emails,
or changes to MassageLab. If the reference audit finds additional necessary
operations, make those concrete before asking; do not assume them approved.

After approval, verify the App grant and repository visibility. Set and verify
the promotion control and explicit standard Build Command before connecting.
Apply the rename and verify its identity/custom-domain readback, then connect the approved
repository/branch. Read back the connection and control after each write.
Observe any build started by the connection; do not start a duplicate build
merely to recreate evidence. Record its actual source commit and environment.
Stop on unexpected settings, builds, domain movement, or inaccessible candidate
protection and apply only the explicitly authorized recovery operations.

## Candidate and public-promotion gates

The source gate's publication, full review, and separately approved merge through
PR #37 are complete. The first connected candidate must use that reviewed
source, not the earlier PR #36 merge alone or a dirty local checkout. A gate
merge is still source-only until the provider connection/build is authorized.

Require successful read-only migration status and the standard build's actual
Production Supporter gate. It invokes
`stripe-readiness-check.mjs --supporter-only --live --verify-stripe --no-dotenv`
with the inherited remote credentials, without exporting them. A two-minute
deadline or any checker/start failure rejects the build. Local/Preview skips
and synthetic tests are not remote Production receipts. Require both gates'
actual successful logs and the app build reaching `READY`; a custom command
that bypasses prebuild does not pass. These provider reads do not repeat the
live transaction test or authorize billing mutations.

Read back that registration/Supporter pause controls remain `false` and that
one-time support/background enablement remains false or unset. Require Calendar
configuration to remain inactive; if the current inventory differs from the
dated audit, stop for reconciliation rather than silently disabling a service.
Verify every saved alias assignment before
and after the candidate. The earlier `--skip-domain` build moved a convenience
alias despite its name; do not use that flag as complete assignment proof.

Use the protected candidate only through permitted access. A sign-in page or
anonymous denial is not application verification. Do not bypass deployment
protection. Perform only the approved signed-out GET checks of home, Pricing,
registration, support, Privacy, Terms, and session handling. Account creation,
Checkout, Calendar callbacks, database fixture writes, and emails are outside
this hosting smoke scope. Claim visual/interactive checks only if actually run.

Public promotion requires a later exact approval for the checked candidate and
saved rollback deployment. After approval, promote that same artifact without
rebuilding; verify all approved domains/aliases and the public signed-out GET
checks. Preserve existing apex-to-canonical routing. If verification fails,
restore the saved approved deployment and assignments within the authorized
rollback scope. Do not retire generated URLs, change DNS, or activate Calendar
as collateral work.

## Acceptance receipt and handoff

Local preparation receipt: Production gate tests 14/14, existing Stripe
readiness/webhook tests 62/62, lint, typecheck, and standard local build pass.
Both Production gates visibly skip locally. The new child CLI tests use only
synthetic credentials and a read-only provider fixture. No live readiness
request, payment test, remote build, or provider configuration was performed.
Source publication, full hosted review, and the separately approved merge are
complete. Reviewed head `fa3e2f9081b37630584c979b92114379ba093e95` passed all
seven CI jobs, with 5,113 of 5,115 Linux unit tests passing and two skips.
CodeRabbit's final full review covered all ten files with zero actionable
comments or retained architecture concerns. Codex was clean; both prior threads
were resolved. Merge `f184fc1d2ea9cf0adfeff7d810d9db408fc6970e` triggered no
Vercel build or deployment. Provider writes, remote builds, and public promotion
remain outside that source approval.

- Record the source/merge and deployment distinction in project state/log.
- Record sanitized name/connection/branch/control outcomes and actual candidate
  gates. Keep credential and provider-ID evidence private.
- Record whether public promotion was authorized/executed and its public
  checks. A successful connection or candidate is not a completed public rollout.
- Keep the Calendar provider acceptance, old-origin local/PWA recovery, and
  deferred provider work visible in the migration ledger.
- Preserve public registration/Supporter activation, disabled one-time/background
  purchasing, the completed payment-test boundary, and both projects' data.

## Approved execution progress — 2026-10-02

The user's approval covers this prepared hosting stage and normal App access to
only AtmoShaper, preserving existing grants. Fresh preflight matched the saved
existing target/scope, unchanged reviewed `main`, and all four original live
aliases. Applied and read back custom-domain auto-assignment off and explicit
Build Command `npm run build` before renaming the same project to `atmoshaper`.
All four aliases retain the original approved live artifact; the three project
domains, apex `308` redirect, and protection remain intact. Correct-path public
GET checks passed for all seven approved routes with a `null` signed-out session.

Browser automation could not verify its required admin policy for GitHub and
was denied. The user completed the normal App grant and Dashboard Git connection.
Earlier repository-discovery responses misleadingly reported absent access;
automatic approval review stopped the CLI connection attempt before execution.
The user's connected-project screenshot prompted a direct project read, which
verifies GitHub repository `dsbowersock/atmoshaper` and Production branch `main`.
The rejected command is no longer needed; no duplicate connection was attempted.
Connection itself triggered no build. The old MassageLab Git link was read
without mutation and remains intact.

Exactly one authorized staged Production candidate from pinned merged PR #37,
`f184fc1d2ea9cf0adfeff7d810d9db408fc6970e`, reached `READY` at
`2026-10-02T23:56:01Z`. Actual standard-build logs show migration status passing
and the live Supporter-only gate passing with both Portal catalogs API-verified.
One-time support and background purchases remain disabled. No schema was applied,
credential exported/replaced, Calendar configured, or payment test repeated.

Pre-promotion readback preserved all four original alias assignments and the live project
target at `7756080c3bc650bdbcff33013ff67728a3f97efa`. All three project domains
remain verified, with the apex `308` redirect intact. Two new generated
convenience aliases point to the candidate under unchanged deployment protection.
Fresh non-secret reads confirm canonical auth and both public pause flags `false`;
all 56 project variables remain Production-only, with excluded purchase switches
and Calendar credentials absent. The later approved public rollout is recorded below.

Protected candidate GET verification is now complete. The user supplied the exact
candidate's open-registration screenshot and reported successful partial browser
checks, while acknowledging some links were unchecked. A later normal
authenticated provider fetch succeeded after the initial authentication failure.
All seven candidate GETs returned application content with `200`; registration
inputs are present, registration/Checkout pause copy is absent, Pricing includes
Supporter content, and the signed-out session is `null`. No account, Checkout,
Calendar connection, email, or fixture was created. These receipts do not claim
interactive coverage beyond the user's supplied registration screenshot.

The user then approved the prepared exact-artifact public promotion with saved
rollback. Fresh preflight verified the same `READY` candidate, original live
assignments, and `READY` saved rollback in the same project. Normal CLI promotion
reused the checked artifact without rebuilding. Final readback verifies the live
project target and all six recorded live aliases now use it, with original alias
names, verified domains, apex redirect, protection, and manual promotion control intact.
All seven public signed-out GET checks pass; registration inputs are present,
pause copy is absent, session is `null`, and public Pricing assets match the
candidate. Fresh non-secret auth/pause reads pass; excluded purchase switches and
Calendar credentials remain absent. No rollback was needed. Preserve the saved
prior live artifact and do not repeat the completed build or payment test.

The approved settings and exact-artifact promotion are verified; Calendar,
old-origin recovery, and other migration gates remain open. These five
sanitized operator-doc receipts are
published in PR #38 under source publication/review authority. Git publication may
start a Preview build using its existing configuration; do not copy Production
credentials into Preview to repair a failure. Source merge and any later public
promotion remain separately gated. Continue the migration ledger's local-data/PWA
recovery and provider preparation after this closeout; the full old site remains
available and its future separate product direction is outside this work.
