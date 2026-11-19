# November 18 live-service binding packet

Status: explicitly approved by the owner November 18; all three configuration
changes applied and reloaded/read back. The owner subsequently authorized a
separate current-source site update, tracked in project state/log. Read the existing
[Ably contract](2026-10-09-atmoshaper-ably-binding.md) first. Existing successful
verification campaigns remain closed; no expired credential or grant is reused.

## Current evidence

- Regular Chrome dashboard access works after the owner-led Codex restart.
- The main AtmoShaper Ably app and separate verification app already exist.
  Preserve both and all existing keys. The observed account remains Free with
  resource-based allowances; no plan migration or upgrade is proposed.
- Current source uses server-only `ABLY_API_KEY` for REST change notifications
  and one-hour HMAC-signed client tokens. Each client token is restricted to one
  joined room with subscribe/presence; browser publishing is not granted.
- Both the existing Vercel project's project-variable and linked shared-variable
  searches show no `ABLY_API_KEY`. The project is linked to this repository.
- Vercel's current public Production deployment is the October 7 source
  `38d0ded`. Newer READY Production-target metadata is a separate artifact fact.
- Sentry inherits required default/server-side scrubbing, IP removal and
  disabled minidump storage. Preserve the six project removal rules, all other
  settings and the legacy project. The AtmoShaper project's automatic JavaScript
  source fetching is enabled; outbound TLS/SSL verification is disabled.

## Exact proposed operation

1. Create exactly one key in the existing main Ably app, named
   `production-anatomime-server`. Permit only publish, subscribe and presence,
   restricted to normal channels matching `anatomime:*`. No queue/metachannel,
   history, statistics, push, object or elevated permissions. Preserve the
   existing token format and revocation-mode contract. Recheck the unsaved
   form's app and capability selections immediately before creation.
2. Transfer that new key only into the existing AtmoShaper Vercel project's
   `ABLY_API_KEY`, type Secret, Production only. Do not create a team-shared
   variable or grant Preview/Development access. Recheck exact key-name absence
   before the save. The reviewed form is blank until approval.
3. In only the AtmoShaper Sentry project, disable automatic JavaScript source
   fetching and enable outbound TLS/SSL certificate verification. Apply each
   project control and reload/read back both states. Preserve inherited protections and removal
   rules; do not change organization-wide or legacy-project settings.

The new key gives a future Production server authority to send and authorize
Anatomime realtime notifications. Transfer is limited to the named Vercel
project's secret store. Keep the value in ephemeral browser-tool memory only;
never print it, place it in chat/Git/docs, save it in a local file, or include it
in screenshots. Do not inspect existing key values or credential stores.

No app creation, plan change, deployment, public promotion, DNS, database write,
real game, synthetic Sentry event, email, payment or media operation belongs to
this packet. Saving Vercel configuration does not update an existing artifact;
a later separately reviewed build/release decision is still needed.

## Readback, failures and recovery

- Confirm the new Ably key's nickname, exact channel restriction and capability
  metadata without displaying its value. Confirm Vercel has exactly the named
  operation-owned project variable with Secret/Production metadata, then leave
  its value concealed. Confirm Sentry's two effective project checkbox states.
- Make each write once. If submission times out or the result is ambiguous,
  inspect the resulting UI/metadata before any further action; do not generate
  another key or repeat an ambiguous save. Stop if the app/project, key absence,
  scope, costs or settings differ from this packet.
- A partial failure may leave the newly created key unused. Report the exact
  stage and retain its safe identity metadata, never its secret. Revocation or
  removal needs an explicit scoped decision; do not remove an existing key.
- Reversing this packet means removing only its new Vercel binding, revoking
  only its new Ably key, and restoring the two recorded Sentry project settings.
  No rollback, deletion or credential revocation is executed by this proposal.
- Record only sanitized outcomes in project state/log. Do not claim runtime
  connectivity, Sentry ingestion or beta readiness from configuration alone.

## Execution result

Created exactly one named key; reloaded metadata confirms the reviewed scope.
Saved the matching Vercel project Secret for Production only and verified its
concealed saved row. Both Sentry checkbox corrections persist after reload.
Existing credentials, apps, organization settings and legacy project remain.
No secret value was printed, stored in a local file, documented or included in
screenshots. No rollback or revocation was needed.

One clipboard-copy attempt did not yield a valid key and was not used or
retried. The newly created key was instead read from its already-visible
creation result into ephemeral browser-tool memory and transferred directly
to the approved secret field. No existing key was revealed.

## Remaining after configuration

Prepare the final Sentry runtime DSN and source-map upload/auth agreement for the
exact offered artifact, then identify the smallest missing hosted journey.
Reuse the existing protected Sentry and isolated Ably verification evidence;
do not repeat campaigns merely to produce another test event or game. Account
mail, consenting Calendar, offered media, all-three-purchase readiness,
recovery/support and final release/rollback acceptance remain open.
