# November 18 service binding and public application update

## Authority and scope

The owner explicitly approved the three changes in the
[service-binding packet](../superpowers/plans/2026-11-18-live-service-binding.md),
then separately authorized updating the deployed site to the completed
application work. This report contains no credential values, provider resource
identifiers, connection strings, database records or private environment values.

## Saved configuration

| Change | Fresh result |
| --- | --- |
| Existing main Ably app | One new `production-anatomime-server` key; reloaded metadata confirms only publish, subscribe and presence on `anatomime:*` |
| Existing Vercel project | New project Secret `ABLY_API_KEY`, Production only; saved concealed row verified |
| AtmoShaper Sentry project | JavaScript source fetching disabled; outbound TLS/SSL verification enabled; both persist after reload |

Existing Ably keys and both apps, the Free account package, inherited Sentry
scrubbing/IP/minidump protections, the six advanced removal rules, organization
settings and legacy project are preserved. No new DSN or source-map credential
was configured. The credential transfer remained in ephemeral browser-tool
memory; no key value was printed, saved locally or included in screenshots.

## Build and publication

Fresh remote Git identifies main as
`012952bd9b21f6c49e9063d8a235d9bae65d0327`, the source of PR #68 and the
completed local full-suite, production build and anonymous browser smoke checks.
The local branch adds documentation and a test scheduling script, with no
application runtime changes. The deployment rebuilds the existing exact-main
artifact using current project settings and the newly saved Production secret.

Live preflight verifies `npm run build`, Next.js, Node 24, repository-root build,
main branch tracking, disabled automatic custom-domain assignment and existing
deployment protection. No project-setting override, plan upgrade, new project,
Git reconnect or local secret import was needed.

Actual Vercel build logs verify:

- Production migration-status gate passed with all committed migrations applied;
  this gate reads status and does not apply a migration.
- Live recurring Supporter-readiness gate passed. One-time support and background
  commerce remain disabled and were reported not applicable.
- Compilation passed in 92 seconds, TypeScript in 84 seconds, all 115 static
  pages generated, and Vercel reported the build complete in four minutes.
- The artifact reached READY with the exact approved source. Sentry reported no
  upload-auth token; source-map upload and release creation did not run.

Before promotion, regular Chrome rendered home, login, registration, pricing,
music, signed-out Calendar entry and the null signed-out session on the staged
artifact without a generic error surface. No login or form was submitted.

One public-promotion request was submitted under the owner's authorization.
Complete readback confirms all six existing live aliases now reference the new
artifact. All unrelated branch-alias mappings are unchanged. The apex retains
its 308 redirect to `https://www.atmoshaper.com/`. The prior READY artifact from
source `38d0deddea484938e13df61927d07a7b21f92071` and its pre-operation alias
mapping remain the rollback reference. No rollback was needed.

Post-promotion HTTP checks on the www site return 200 for `/`, `/login`,
`/register`, `/pricing`, `/music`, `/calendar` and `/api/auth/session`.
Each has application content, no generic server-error marker, and the session
response is null. The updated public home also renders in regular Chrome.

## Practical limits and next work

This verifies the approved configuration changes and current-source publication.
It does not verify new Production realtime traffic, authenticated account/mail
journeys, actual Calendar sync, payment fulfillment, hosted-media playback,
backup restoration or full beta readiness. Clinical workflows remain local-first.
Carry existing scoped campaigns forward at their recorded limits.

Next service setup is the final Sentry runtime DSN and source-map upload/auth
agreement for this offered artifact, followed by genuinely missing hosted
journeys and recovery/support acceptance. No synthetic game/error, real mail or
payment, schema migration, DNS change or media mutation occurred here.
