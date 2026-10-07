# AtmoShaper Production Calendar credentials and candidate build

Status: approved credential provisioning and the single source-pinned candidate
build are complete and verified on October 7. The candidate is unpromoted;
public promotion and Calendar activation still need their separate exact approval.

Read [project state](../../project-state.md), [project log](../../project-log.md)
and the [provider checkpoint](2026-10-02-atmoshaper-calendar-provider-stage.md).

## Completed dependencies and pre-provision hosting baseline

Both permission comparisons and their cleanup are complete. The owner's saved
availability declaration/category/status receipts report no sensitive/restricted
scopes and no verification requirement. The bounded
[application run](2026-10-07-atmoshaper-calendar-application-acceptance.md) and
[native pending Disconnect follow-up](2026-10-07-atmoshaper-calendar-pending-disconnect-acceptance.md)
pass; all test grants, fixtures, databases and owned processes are cleaned up.
Their explicit fixture and injected-failure proof limits remain. Neither database
authorization permits another run. Do not repeat those tests or the payment test.

The October 7 pre-provision read-only hosting evidence verified:

- The existing `atmoshaper` project uses GitHub `dsbowersock/atmoshaper`, branch
  `main`, and standard `npm run build`. Custom-domain auto-assignment is disabled;
  deployment protection remains enabled for Production deployment URLs/previews.
- The READY public artifact and all six live aliases retain PR #37 source
  `f184fc1d2ea9cf0adfeff7d810d9db408fc6970e`.
- The READY, unpromoted PR #40 artifact contains reviewed merge
  `38d0deddea484938e13df61927d07a7b21f92071`; fresh remote `main` matches.
- The complete private API inventory has 56 Production-only variables, none in
  Preview/Development, and none of the four Calendar settings below. A truncated
  connector inventory does not establish complete key/target coverage.
- Both public pause flags are false: registration and recurring Supporter
  Checkout stay open. One-time support and background purchases stay disabled.

## Validated existing Production client download

The owner supplied the path of the JSON already downloaded for `AtmoShaper
Calendar Production Web`. Private inspection passes: Web registration, intended
Production project, correctly formed client matching the download, non-placeholder
secret, Google OAuth endpoints and sole exact Calendar callback. It differs from
the known Calendar Verify client; test credentials must not supply Production.

The saved download contains only:

`https://www.atmoshaper.com/api/calendar/google/callback`

The separate working sign-in callback `/api/auth/callback/google` stays unchanged.
Vercel's existing sign-in client ID is sensitive/write-only; its raw comparison
was unavailable and is not claimed. A private source-file fingerprint and
sanitized receipt bind later provisioning to this validated download; recheck
the fingerprint before use. This is a downloaded settings/format receipt, not
proof of a live credential exchange or later Console changes. No credential copy
or new token exchange was made during that validation. The subsequent approved
provisioning is recorded below. No additional file/setup input is needed.
Console automation remains denied. Keep IDs, secret contents and download paths
out of tracked files. The owner subsequently authorized only the concrete
four-setting/build/restoration operation below.

## Approved exact credential and build operation

After input validation, the owner approved these four settings in the existing
project's **Production environment only**, a recoverable key and one unpromoted
candidate at the reviewed PR #40 source, including restoration of any saved live
aliases moved by the build. The following procedure is the executed scope;
it is not authority for another provisioning or build run.

| Setting | Source and constraint |
| --- | --- |
| `GOOGLE_CALENDAR_CLIENT_ID` | Validated existing Production Calendar Web registration; encrypted configuration |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | Same registration's private downloaded secret; sensitive/write-only |
| `GOOGLE_CALENDAR_REDIRECT_URI` | Exact canonical www Calendar callback above; encrypted configuration |
| `CALENDAR_SYNC_ENCRYPTION_KEY` | New cryptographically random, stable Calendar-only key; sensitive/write-only, never the test or TOTP key |

Generate a 32-byte random key only after provisioning approval. Keep a privately
recoverable copy outside source before writing it, with no value/path in tracked
receipts. Privately verify a synthetic encryption/decryption round trip using
the application's helper. The key must remain stable once encrypted connections
exist; arbitrary rotation/deletion makes their stored tokens unreadable.

Refresh hosted source, settings, complete variable names/targets, public artifact
and all six alias assignments before writes. Recheck that the four keys remain
absent; existing values require reconciliation rather than blind replacement.
Use reviewed `38d0ded` source, not the unreviewed local harness/receipt branch.
Change no Google settings, sign-in credentials, auth host, Stripe configuration,
legal versions, database schema or excluded purchase gate. Copy no credentials
to Preview/Development. No separate migration or database-write operation is
proposed; retain the normal migration-status/readiness gates in `npm run build`.

The expected complete inventory becomes 60 Production-only entries, with no
changes to the original 56 and no Preview/Development settings. Use one fresh
Git-connected deployment request for the existing project, `target: production`,
`gitSource.type: github`, the privately verified repository ID, `ref: main` and
exact `sha: 38d0deddea484938e13df61927d07a7b21f92071`, with `forceNew: 1`.
The one private request was sent successfully. Use the project's current settings;
omit source files, inline environment values, `deploymentId`, latest-commit
selection and custom build settings. This avoids inheriting an older deployment's
environment snapshot or uploading the local harness/receipt tree.
Vercel documents the Git deployment request in its
[REST deployment API](https://vercel.com/docs/rest-api/deployments/create-a-new-deployment)
and [official OpenAPI schema](https://openapi.vercel.sh). Changed environment
settings apply to new deployments, as described in its
[environment guidance](https://vercel.com/docs/environment-variables/managing-environment-variables).
Refresh these controls immediately before the approved operation and verify the
actual resulting source and configuration rather than assuming request success.

Check candidate source/READY state and actual migration/Supporter build gates,
complete configuration presence without logging secrets, normal signed-out GETs
and inactive role/feature boundaries. Snapshot and restore only saved live
assignments under the exact approved restoration scope. Public source must remain
PR #37 throughout this stage. Calendar access still requires OWNER/THERAPIST
practice role plus `external_calendar_sync`; Supporter membership alone does not
grant it.

The canonical callback still reaches the existing public site. Do not start
Production consent, create/sync calendars or add a candidate callback as a smoke
test. Configuration presence and a local encryption round trip do not prove a
real Production grant; any necessary bounded live acceptance needs its own exact
scope. Do not silently repeat completed tests.

## Completed provisioning and candidate receipt

Fresh preflight verified remote `main` at the exact reviewed `38d0ded` merge,
the existing project/build/Git/protection controls, 56 Production-only settings
and all six live assignments on PR #37 before any writes. The supplied client
download still matched its private validation fingerprint.

Exactly the four settings above were created, with the specified encrypted or
sensitive/write-only types. Final complete API readback contains 60
Production-only entries; the original 56 entries retain their IDs, types,
targets and update timestamps. Client ID and callback readbacks match the
validated input. Sensitive secret/key values cannot be read back from Vercel;
their successful creation is not a claim of a remote OAuth/decryption test.
Both public pause flags read `false`, and the two excluded purchase-enablement
switches remain absent. No credentials were copied to Preview/Development.

The new 32-byte key has a privately recoverable, owner/SYSTEM-protected copy
outside Git. Its private fingerprint still matches, and the actual application
encryption/decryption helpers passed a synthetic round trip. Temporary
credential request files were removed and their private scratch area was
checked for remaining raw secret/key values. Keep the stable recovery copy;
do not rotate or delete this key as routine cleanup.

The single new Git-connected candidate reached `READY` at
`2026-10-07T21:03:42.652Z`, with actual source
`38d0deddea484938e13df61927d07a7b21f92071` and all four keys present in its
deployment environment snapshot. The normal `npm run build` passed the actual
Production migration-status and live Supporter readiness gates, compiled and
generated all 115 static pages. Existing Sentry release/source-map warnings
are nonblocking and do not establish application monitoring readiness.

Authenticated signed-out requests to `/`, `/pricing`, `/register`, `/support`,
`/legal/privacy`, `/legal/terms` and `/api/auth/session` all return `200`.
Registration is open, Checkout pause copy is absent, and the session is `null`.
An additional `/calendar/sync` GET returns the sign-in guard without a connect
form. This does not prove a signed-in user's role or Production Google grant;
reviewed access still requires OWNER/THERAPIST plus `external_calendar_sync`.

The `2026-10-07T21:09:12Z` final readback retains the PR #37 public target and
all six saved aliases, manual promotion, standard build, GitHub/`main` and
deployment protection. No alias restoration was needed. The candidate's exact
identity and rollback assignments are retained privately. No public promotion,
Production OAuth exchange, calendar/event activity, database test or completed
payment test was performed. Provisioning/build authority is now exhausted.

## Prepared exact public rollout; approval pending

The next proposed operation is promotion of this already checked artifact,
without rebuilding, to the canonical AtmoShaper site and its six saved live
assignments. This would expose the reviewed optional Calendar integration to
eligible provider accounts. It does not grant Supporter-only accounts Calendar
access or authorize the agent to start consent, create records or run live sync.

1. Refresh the candidate's exact source/READY state and the saved public target,
   all six assignments, manual-promotion/protection controls and configuration.
   Stop if they differ from this receipt; do not substitute another artifact.
2. After separate exact rollout approval, promote only the privately recorded
   candidate and reconcile those six saved assignments to it. Preserve canonical
   www/apex routing and manual promotion. Make no DNS, Google, credential,
   entitlement, legal, database or excluded-purchase changes.
3. Repeat the seven ordinary public GET checks and signed-out Calendar guard;
   verify public source/assignments, open registration/Supporter Checkout and
   disabled excluded purchases. Do not invoke an OAuth callback or consent as
   a page smoke check.
4. If immediate verification fails before Calendar work has started, restore
   the saved PR #37 public artifact and assignments under the requested rollback
   authority. Its environment snapshot has no Calendar configuration. If new
   Calendar work has started, stop and reconcile/drain in-flight work before an
   older-code rollback; preserve the stable key, encrypted tokens, pending
   intents, connections, sources, mappings and provider contents. Do not use
   older request code to operate the newly narrowed grants.

Only the owner’s exact promotion/activation and bounded rollback approval is
needed for this prepared step. No new setup, client file, provider test or
verification upload/submission is requested. The migration charter separates
public rollout from credential/build authority.

## Failure recovery boundaries

Before public promotion, preserve PR #37 and its saved assignments if the
credential/build stage fails. Remove only the four newly added settings if no
encrypted token or durable intent has used them; retain the private key until
that absence is established. Do not revoke Google grants or delete provider
contents, connection rows, pending intents or mappings as rollback.

After successful checks, present the exact new artifact and request separate
public promotion/Calendar activation approval. If later traffic uses Calendar,
disable the new integration and drain in-flight work before an older-code
rollback; preserve the encryption key, encrypted tokens and pending intent/data.
Restore only the saved approved artifact/assignments under explicit rollout
rollback authority. The existing provider checkpoint owns these compatibility
constraints. No upload, verification submission or public activation is approved
by this local plan.
