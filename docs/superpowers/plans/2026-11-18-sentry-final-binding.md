# Final Sentry runtime and source-map binding

Status: complete for runtime binding, uploaded-map association, verified public
publication and approved original-token cleanup. Full beta acceptance continues.
The owner requested completion of Sentry/source maps and continuing beta work.
The current public deployment and approved provider protections are retained.
This packet coordinates the existing Sentry and final-release owners; it does
not reopen the closed protected error/map/owner-email campaign.

## Verified basis

- Existing AtmoShaper project has an active Default DSN. Reuse it; no new key,
  project, repository integration, loader, relay or drain is needed.
- Existing organization has no organization auth tokens. The native creation
  form exposes only `org:ci`: Source Map Upload, Release Creation, Code Mappings.
  This permission applies across the organization, including the legacy project;
  the form offers no project restriction. The proposed token will be used only
  for AtmoShaper. Do not substitute a broader personal/terminal credential.
- Complete targeted Vercel project/shared searches find no `SENTRY` names.
- Existing source reads `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`
  and `SENTRY_AUTH_TOKEN`. Runtime environment already resolves from Vercel
  Production; SDK build release derivation uses the normal Git revision.
- Existing source permits only scrubbed error/enum-diagnostic event envelopes,
  disables default PII, breadcrumbs, tracing, spans, sessions, Replay, Logs,
  metrics and build telemetry, and deletes generated client maps after upload.
  All 76 installed-SDK/privacy checks pass in the fresh November 18 run.
- Billing remains the observed free Developer tier with 5,000 included Errors
  and published 30-day lookback/no pay-as-you-go policy. Existing provider
  scrubbing, IP removal, minidump and sharing protections remain unchanged.

## Proposed exact action

1. Create one organization token named `atmoshaper-vercel-sourcemaps` with only
   the native `org:ci` scope. Stop if permissions or scope differ from the draft.
2. Transfer its value directly from the creation result into the existing
   AtmoShaper Vercel project's `SENTRY_AUTH_TOKEN`, type Secret, Production only.
   Keep it in ephemeral tool memory; no chat output, file, command argument,
   screenshot or repository storage. Do not expose it through a public prefix.
3. Add three Production-only Config variables in that same project:
   `NEXT_PUBLIC_SENTRY_DSN` from the existing project DSN, `SENTRY_ORG` from
   the observed organization and `SENTRY_PROJECT` for the existing AtmoShaper
   project. No shared, Preview or Development binding. Keep private values out
   of tracked documentation and screenshots.
4. Recheck exact main source, current aliases/rollback, standard gated build and
   manual promotion. Rebuild the existing reviewed main source `012952b` once
   using the effective Production settings. The SDK may create/finalize the Git
   release, upload that build's generated source/map artifact cohort to Sentry
   and remove its client maps afterward. This uploads application source and
   maps, without clinical records or deliberate error payloads. No later upload
   of an independently rebuilt or unauthenticated artifact is substituted.
5. Require successful normal migration-status/payment gates, actual authenticated
   upload success and READY before public promotion. Verify destination/release
   and source-map artifact metadata in the AtmoShaper project without opening
   unrelated events. Check the staged anonymous entry points, then publish the
   same artifact and verify live aliases, public health and apex redirect.

This activates the existing error-only app connection on the offered Production
artifact. Ordinary runtime failures may produce scrubbed error events. Do not
enable the public debug route, replay the protected event/email test, create an
alert or issue a support-diagnostic POST. A newly required deliberate event
would need its own concrete data/destination/write decision.

## Failure, containment and completion

Make each provider write once; inspect an ambiguous result before any follow-up.
Do not create duplicate tokens or continue a failed/mismatched map upload into
public activation. The current published artifact, without the new DSN binding
compiled into it, remains the immediate rollback reference. Preserve its alias
map and configuration baseline. On failure before promotion, leave it serving;
report any new unused token/variables. Revocation or removal of credentials
still needs an exact decision; do not silently delete pre-existing resources.

If activation fails privacy, routing or health checks, restore the saved prior
artifact as necessary to contain this deployment, preserving unrelated aliases
and the legacy app. Configuration removal/revocation is a separate explicitly
scoped cleanup decision. Do not weaken map deletion, scrubbing or certificate
validation to force success.

Completion requires concealed configuration metadata, the authenticated upload
result and matching artifact/project/release, successful build, exact-artifact
publication and bounded public checks. Carry forward the previously accepted
mapped-error/owner-email proof with its original limits. Record ordinary new
monitoring evidence only when available; do not invent a fresh mapped error.

## Execution checkpoint

The owner approved creation, storage, native source/map upload and verified
redeployment. Created the single reviewed token and saved `SENTRY_AUTH_TOKEN`
as Secret plus the existing DSN/org/project Config variables, Production only.
Concealed metadata readback passes. No terminal export, local secret file or
existing-key change occurred. One fresh unchanged-source Production rebuild
is running from the currently published reviewed Git source. Its existing
READY artifact and complete live-alias map remain the rollback reference.
Upload acceptance, candidate checks and publication are still pending.

## Token-handoff correction proposal

The first attempt captured a partial token because the expression excluded valid
standard-base64 plus/slash characters. The secret component has 27 characters
instead of 43. Sentry rejected the requests with 401; the full original is no
longer visible through normal UI. The unpromoted build cannot be used as map
acceptance and will not be reused for a later independent upload.

Prepare exactly one replacement `atmoshaper-vercel-sourcemaps-v2`, same `org:ci`
scope. Capture the entire visible UI field, validate standard-base64 structure
and complete secret length without printing values, then update only the
existing Production `SENTRY_AUTH_TOKEN`. Preserve the other three destination
variables. Run one fresh exact-source native build, verify authenticated upload
and the existing acceptance steps, then revoke only the original token created
in this operation. The owner explicitly approved this correction. No automatic
duplicate, credential deletion or broad token cleanup is authorized by this text.

## Beta work after connection

The corrected build is READY and published. Two new archives (523 and 2,080
files) match the Git release, and a deployed public JavaScript debug ID filters
to its uploaded archive. Seven candidate and seven public entry checks pass;
all six live aliases match, unrelated mappings are unchanged, and the original
token is verified revoked. See the
[execution receipt](../../audits/2026-11-18-sentry-runtime-and-source-maps.md).

Continue offered account sign-in/recovery and consenting Calendar journeys,
Anatomime runtime context, hosted media playback/catalog coverage, recovery and
support. All three purchase paths retain their existing independent acceptance
gates; the two disabled flows are not enabled by this packet. Ask the owner for
backup coverage against the now accepted one-day loss/restoration targets
before choosing a restore method. No
hosted clinical storage, real payment, schema migration or media mutation is
authorized here.

Primary references: [Sentry auth tokens](https://docs.sentry.io/account/auth-tokens/),
[Next.js source maps](https://docs.sentry.io/platforms/javascript/guides/nextjs/sourcemaps/).
