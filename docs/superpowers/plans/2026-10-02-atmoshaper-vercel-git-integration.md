# AtmoShaper existing-project Vercel integration

Status: source publication and review authorized, 2026-10-02, on
`codex/atmoshaper-vercel-integration-plan`. PR #36's source-only merge
is complete. The hosting plan has not been executed and grants no provider-write,
build, deployment, or public promotion authority.

Read [project state](../../project-state.md), [project log](../../project-log.md),
and the [migration ledger](../../wiki/migration-status.md) first. Preserve the
existing live AtmoShaper project and the separate full MassageLab service.
Do not reimport the app, create a replacement hosting project, or transfer
provider ownership to repair a name or Git connection.

## Verified starting point

- The user's current Dashboard screenshot shows the existing AtmoShaper
  project serving `www.atmoshaper.com`, a preview-era project name, and
  `Connect Git Repository`. Its Git connection is currently absent. This
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
- The deployed runtime remains reviewed merge
  `7756080c3bc650bdbcff33013ff67728a3f97efa`. The newer Calendar source is
  provider preparation, not activated integration. Keep Calendar configuration
  inactive during this hosting stage; its acceptance follows the separate
  [Calendar plan](2026-10-01-atmoshaper-google-calendar-preparation.md).
- Project/deployment reads work, but the project-detail connector's advertised
  argument differs from its server requirement. The local CLI has no usable
  login; browser navigation could not satisfy its required policy check.
  These limits prevent full settings/alias readback. Obtain an ordinary working
  access path before execution; do not extract credentials or bypass the check.
  An empty or omitted alias array in a deployment summary is not an inventory.

## Proposed result

| Item | Proposed setting / behavior |
| --- | --- |
| Existing project name | `atmoshaper`, subject to availability and reference audit |
| Git repository | `dsbowersock/atmoshaper`, connected to the existing project |
| Production branch | `main` |
| Production promotion | Staged builds with manual promotion; no standing approval to publish every merge |
| Live site and services | Preserve the canonical custom host, current approved deployment, environment, provider identity, and separate MassageLab service |
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
   should need no change if they do not reference the preview-era generated
   host. Explain any actual exception before expanding the requested scope.
4. Check the proposed name is available in the existing scope, and verify the
   GitHub integration can access this repository. Identify required app access
   privately. Do not broaden installation permissions to unrelated repositories.
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
- disabling automatic assignment of custom Production domains and reading back
  that setting before repository connection;
- connecting only `dsbowersock/atmoshaper` with Production branch `main`;
- a possible first unpromoted Production candidate build from the approved
  reviewed source, including read-only migration and Supporter readiness checks;
- restoration of the exact owned pre-operation assignments/settings if an
  unexpected movement occurs, and disconnecting only the new Git link if needed.

This does not include public promotion, DNS changes, secret replacement,
provider callbacks, database migrations, Calendar activation, payments, emails,
or changes to MassageLab. If the reference audit finds additional necessary
operations, make those concrete before asking; do not assume them approved.

After approval, set and verify the promotion control first. Apply the rename
and verify its identity/custom-domain readback, then connect the approved
repository/branch. Read back the connection and control after each write.
Observe any build started by the connection; do not start a duplicate build
merely to recreate evidence. Record its actual source commit and environment.
Stop on unexpected settings, builds, domain movement, or inaccessible candidate
protection and apply only the explicitly authorized recovery operations.

## Candidate and public-promotion gates

Publish, review, and separately approve the source gate before merging it while
Git remains disconnected. The first connected candidate must use that reviewed
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
Source publication and hosted review are authorized; their exact-head outcomes
must be verified before a merge request. This authority excludes merging,
provider writes, remote builds, and public promotion.

- Record the source/merge and deployment distinction in project state/log.
- Record sanitized name/connection/branch/control outcomes and actual candidate
  gates. Keep credential and provider-ID evidence private.
- Record whether public promotion was authorized/executed and its public
  checks. A successful connection or candidate is not a completed public rollout.
- Keep the Calendar provider acceptance, old-origin local/PWA recovery, and
  deferred provider work visible in the migration ledger.
- Preserve public registration/Supporter activation, disabled one-time/background
  purchasing, the completed payment-test boundary, and both projects' data.

Execution remains pending full current settings access and exact authorization.
The user does not need to repeat hosting setup, choose an unexplained Google
project, or supply the already established Git-status observation.
