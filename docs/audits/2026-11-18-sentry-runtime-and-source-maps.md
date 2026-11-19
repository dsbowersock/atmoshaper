# Live Sentry runtime and source-map connection

## Approved operation and result

The owner approved the [final binding packet](../superpowers/plans/2026-11-18-sentry-final-binding.md),
including the native organization CI token, four Production-only Vercel variables,
same-build source-map upload and verified publication. The owner then expressly
approved a replacement and revocation of only the original operation-owned token
after the initial handoff failure described below.

The existing AtmoShaper DSN, organization and project are bound through the
three Config variables. `SENTRY_AUTH_TOKEN` is a project Secret, Production only.
No Preview/Development or team-shared binding was created. The replacement uses
only native `org:ci`, which covers source maps, release creation and code mappings
across the organization; its actual use is limited to this project. No broader
terminal/personal credential was exported. Values, private provider IDs and
connection strings are excluded from this receipt.

The corrected build uses unchanged reviewed main
`012952bd9b21f6c49e9063d8a235d9bae65d0327`, reaches READY under the standard
gated Production build and is published. Existing manual custom-domain promotion,
privacy protections, local-first clinical boundaries, disabled additional purchase
flows, other service settings and legacy resources remain intact.

## Fresh verification

| Check | Observed result |
| --- | --- |
| Installed Sentry SDK/application privacy tests | 76 passed, zero failed/skipped; 20,842 ms |
| Concealed saved configuration | Auth token Secret and three destination Config values, Production only |
| Source-map destination | Existing project lists two new archives containing 523 and 2,080 files |
| Release agreement | Both new archives are linked to the exact Git source release |
| Candidate browser entry points | Home, login, registration, pricing, music, Calendar entry and null signed-out session pass |
| Publication | All six live aliases reference the corrected READY artifact; unrelated mappings unchanged |
| Public health | Seven paths return 200 without a generic server-error surface; signed-out session is null |
| Redirect | Apex remains 308 to the canonical www site |
| Bounded client-secret check | Six public client chunks contain no CI-token-shaped value |
| Actual code/map association | A native Turbopack debug ID from deployed JavaScript matches the new Sentry archive and exact release |
| Public map access | The sampled paired map URL returns 403, without source content |
| Original token cleanup | Explicitly revoked; reloaded list shows no active original and one active replacement |

The source-map association used the public artifact's native `_debugIds`
registration and `debugId` comment, not an assumed older injection pattern.
The sample does not prove all client assets, physical cleanup of every map or a
new live symbolicated error. Existing configured post-upload cleanup remains.
The earlier accepted protected mapped-error/owner-email campaign is carried
forward at its original scope and was not replayed.

## Retained failed attempt and correction

The initial transfer expression incorrectly excluded valid standard-base64
plus/slash characters, capturing a 27-character secret component instead of 43.
Sentry rejected release/map requests with HTTP 401. The SDK logged these errors
without failing the complete Next build, so that artifact reached READY but
was never promoted or accepted for source maps. No successful upload is inferred
from its status.

The already-acknowledged one-time full token was not available through normal
UI. The owner approved one replacement with identical permissions and cleanup
of the original. Inert checks now preserve plus/slash and reject truncation;
the actual full replacement validates before storage. The corrected native
same-source rebuild produced the accepted archives. Original-token revocation
followed verification. No secret value was exposed or stored locally.

Future promotions must require actual successful map/artifact evidence in
addition to READY; default SDK error logging alone is not a hard build gate.
The prior verified public artifact remains the immediate rollback reference.
No destructive database rollback or credential-wide cleanup was performed.

## Parallel beta findings and next acceptance

Representative hosted media reads pass: one committed Signature Opus payload
and one nested generative Opus sample return 206/64 bytes with audio/ogg and
allowed CORS; the branded generative index returns 200 JSON. This is bounded
protocol coverage, not full catalog or audible playback acceptance.

Provider metadata reports the account sending domain verified, sending enabled,
receiving disabled and open/click tracking disabled. No email was sent, and this
does not prove the offered SMTP credential or account recovery delivery.

The owner accepted up to one day's lost hosted account/settings/scheduling
changes and restoration by the next day. Further explicitly scoped metadata
reads identify the Vercel-managed AtmoShaper project on Free, distinct from the
archived legacy project: one ready root main branch, six hours of history,
empty snapshot schedule and no listed snapshots. Fresh Vercel integration-store
agreement is permission-limited in the connector and remains to confirm through
the normal dashboard. Adequate backup coverage/cost and actual isolated restore
acceptance remain pending. No database rows, credentials, export, branch write
or restore were accessed.

Continue private owner sign-in/account/settings checks, consenting Calendar
acceptance, final Anatomime runtime context, hosted media playback and recovery/
support. The remaining purchase flows retain their documented independent gates.
No clinical records, new synthetic event, actual mail/payment, schema migration,
media mutation or legal cutover belongs to this operation.
