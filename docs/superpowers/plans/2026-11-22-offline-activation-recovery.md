# One replacement key after the failed offline activation upload

Status: owner approved November 22, 2026. Fresh preflight and the one corrected
replacement-key upload pass; the three new Production settings are verified,
with all 87 original settings unchanged. Publication/owner acceptance continues
under the original scope. See the
[activation receipt](../../audits/2026-11-22-offline-access-activation.md).

The owner approved the original
[offline activation plan](2026-11-22-offline-access-activation.md).
Fresh preflight matched source `6490c75` (application source `194e385`), live
source `0eb02e0`, all 87 existing setting metadata entries, all 48 aliases, manual
promotion, existing deployment protection and the READY rollback artifact.

The first isolated process generated one P-256 authority and attempted its
single bulk settings upload through the installed Vercel CLI 60.1.3. The command
exited unsuccessfully; raw private-bearing output was withheld and its exact
provider HTTP status was not retained. Read-back confirms all three requested
names are absent and the existing 87 settings are unchanged. No source was
pushed and no deployment, promotion or real-account receipt occurred.

The private key was discarded when that process ended. Its public verifier is
preserved only in the ignored operation folder; source is restored to `[]`.
There is no provider key to revoke. Do not treat the discarded public verifier
as an activated authority or rerun the original generator.

## Reproduced cause and prepared correction

The installed CLI parses stdin into an array, but its `_fetch` JSON serialization
branch handles objects only. Passing that array into `Request` creates
`[object Object]` text instead of a JSON array. A no-network reproduction with
synthetic data confirms that behavior; explicitly serialized JSON parses back
to the exact intended bulk body. Generate-curl mode formats JSON correctly but
does not exercise the faulty execution branch, so it was insufficient proof.

The prepared replacement uses one direct HTTPS `fetch` to Vercel's existing
environment API, explicit `Content-Type: application/json`, `JSON.stringify`,
redirect rejection and a bounded timeout. It has no automatic retry layer.
The existing CLI profile is read privately in that same isolated process; its
token and the generated private key never enter command arguments, files, chat
or output. A direct read-only HTTPS project check using that profile passes.
The old settings, empty verifier, current site and rollback also recheck cleanly.
The prepared JSON body follows Vercel's
[environment API](https://vercel.com/docs/rest-api/projects/create-one-or-more-environment-variables).

## Exact proposed amendment

1. Begin one fresh 120-minute admission after owner approval and preflight.
   Recheck current source, empty verifier, unchanged main/aliases/settings,
   existing profile and rollback. Stop on drift or unexpected existing key names.
2. Generate **one additional replacement P-256 key pair**. Self-check its
   signature, save/commit only the matching public JWK and public key ID, then
   make **one** direct JSON upload for only these Production settings:
   `ATMOSHAPER_OFFLINE_ACCESS_PRIVATE_KEY` as a sensitive Secret,
   `ATMOSHAPER_OFFLINE_ACCESS_KEY_ID`, and
   `ATMOSHAPER_OFFLINE_ACCESS_ENABLED=true`.
   No upsert/overwrite, private-key file, credential-file change, automatic retry
   or further replacement is included. Read back targets/types and preserve the
   existing 87 metadata entries plus all Preview/Development settings.
3. Continue the already approved original release: one reviewed PR/protected
   Preview with hosted checks, one merge/Production build with Sentry maps,
   verified promotion of that same artifact, matching normal owner-only APK and
   one explicit owner-approved backgrounds receipt in the task emulator. Retain
   the previous release for one rollback. The expected public-key and receipt-
   only documentation amendment is included; application logic is unchanged.

Do not replay any ambiguous effect. On a rejected/uncertain request, reconcile
read-only and stop. Existing payment, email, Calendar, clinical data, account
preferences, billing and unrelated provider configuration remain outside this
amendment. The minor older-preview migration retry limitation and physical S24,
background-audio/closed-app-alarm and broader native gates remain as recorded.

The original plan explicitly says: "Do not retry ambiguous provider effects,
replace the key, change source logic," under that plan. A second key therefore
needs this amendment; the previous publication approval is not being discarded
or requested again.
