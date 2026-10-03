# AtmoShaper local-record and PWA recovery preparation

Status: scope checkpoint after PR #38 merge and the user's clarification that
no existing users are expected to have records needing transfer. No existing-user
recovery campaign or migration warning is needed. This is user-provided scope,
not a private-data audit. Preserve contracts and the old service; no browser-record
access, QA resource, old-site change, provider activity, or device test is authorized.

Read [project state](../../project-state.md), [project log](../../project-log.md),
and the [remaining migration ledger](../../wiki/migration-status.md) first.
The [migration charter](../../rebrand/atmoshaper-migration-charter.md) preserves
local-first clinical data and stable private contracts. The earlier
[local-data/PWA inventory](../../rebrand/atmoshaper-local-data-and-pwa-plan.md)
and [domain plan](../../rebrand/atmoshaper-domain-cutover-plan.md) are historical
inputs; the user's current choice is to keep the full old site available.
Its future project direction is outside this migration.

## Current evidence and boundaries

- PR #38 merged as `c26e2f7b4c977a09f82f1eb83d1bde8f797f6bed` after all
  final-head checks passed, full CodeRabbit coverage of five files, clean Codex
  review, and closure of all three threads. Its automatic Production build is
  separately approved for verification and saved-live-assignment restoration.
  The automatic build reached `READY`, passing both actual readiness gates and
  seven authenticated GETs. Two moved convenience aliases were restored under
  the user's approval; all six saved live assignments and controls are intact.
  Public promotion of that build is not approved. The approved public source
  remains `f184fc1d2ea9cf0adfeff7d810d9db408fc6970e`.
- The existing old Production artifact is `READY` at locked source
  `e74045c2fc85c2cb4df176fdb1aff2137c4d9848`. Cookie-free public reads confirm
  old www Notes, manifest, and worker accessibility. Old apex Notes returns a
  `308` to www; that cannot establish access to apex-origin browser storage.
- Old and new source retain the same vault key, encrypted full-vault bundle
  discriminator, AES-GCM/PBKDF2 parameters, and legacy-input contracts. Their
  imports replace the destination payload with `mergeCurrentStored: false`.
  Ordinary save merging remains a different operation.
- Existing unit tests prove cryptographic helpers and conservative legacy-input
  handling. They do not prove the actual provider/transfer controls, old-origin
  access, server membership continuity, or an installed PWA upgrade.
- Professional-record routes require the server's
  `canUseLocalClinicalTools` capability. Public Notes accessibility and client
  session substitution cannot establish that capability. The existing
  database-free signed-in browser fixture rewrites client/bootstrap responses
  and disables service-worker registration; it is unsuitable for this proof.
- Served old/current workers preload anonymous Notes documents and delete all
  origin caches except the current shell cache on activation. These are two
  unresolved recovery cases: foreign-cache loss and offline reload displaying
  the membership gate. Do not cache personalized documents, remove membership
  enforcement, or invent an offline entitlement policy to close them.

## Generic import behavior: deferred product improvement

The finding concerns the ordinary file-import button replacing a populated
destination, not a vault-format mismatch or evidence of affected users. The
unpublished local replacement-warning draft was removed after the user's
clarification. No runtime code changed. Do not turn this general safety
improvement into a migration prerequisite.

If later taken up as product work, review explicit replacement consent and
independently usable backups, test the actual provider/control path, and retain
saved data on cancellation or failure. Preserve encryption, file/schema/storage
contracts and ordinary save merging. Real-user transfer requires its own
evidence and authority; no automatic data transfer is introduced here.

## Deferred worker cache and offline-access product work

Inventory owned historical cache names from source before selecting a cleanup
rule. Preserve every unrelated cache, current shell identity, local storage,
and installed-old-PWA behavior. Test the actual activation handler with owned
and foreign caches before changing cleanup. Do not add a recovery cache, change
worker identity, clear origin storage, or unregister an existing worker as
generic recovery. Keep this change separate from the vault-import branch.

## Reference matrix if recovery later becomes necessary

This matrix is retained for handoff, not scheduled launch work. The user's
clarification removes an existing-user transfer dependency. It does not prove
installed-PWA or offline clinical-tool behavior, and does not authorize a new
entitlement policy or unrelated runtime repair.

Before creating any QA context or resource, identify two unused loopback ports,
owned server processes, fresh isolated contexts, synthetic source/destination
records, evidence paths, and cleanup ownership. Follow the existing owned-server
contract; an occupied port is not permission to attach to another worker.
Use inert provider/telemetry settings, explicit empty database/provider aliases,
and no `.env.local` values. An authoritative server membership fixture needs a
reviewed approach. Any disposable database requires its own exact authorization;
no historical QA project can be assumed reusable.

| Case | Required proof |
| --- | --- |
| Source export | Locked/unlocked actual controls; independent bundle password; source ciphertext unchanged |
| Empty destination | Confirmed import, all four record families, lock/reload/unlock roundtrip |
| Populated destination | Independently decryptable backup; explicit replacement; destination changed only on success |
| Cancellation/failure | Cancel, invalid/unsupported/corrupt file, wrong password, and failed writes retain saved destination |
| Legacy input | Supported plaintext migrates only after encrypted persistence; malformed/older encrypted input retained |
| Privacy/ownership | No synthetic plaintext in network requests, logs, preference projection, or response caches; owner isolation |
| Offline access | Real worker lifecycle, Notes unlock/reload, online-only exclusions, return online without deletion |
| Separate installation | Distinct old/new origin and installation identity; no assumed in-place cross-origin migration |
| Cache ownership | Foreign caches survive; only demonstrated owned historical shells are eligible for cleanup |
| Old apex | Separate accessibility receipt or explicit blocked-by-redirect result; www proves no apex recovery |

Observe requests in memory; retain sanitized assertion counts/categories only,
without headers, cookies, bodies, PHI-bearing HARs, or traces. Preserve existing
ignored QA evidence with a verified ownership manifest before execution, and use
a unique output directory. Cleanup only the contexts, PIDs, and validated paths
created for the authorized task. Never automatically transfer real records.

Local browser proof cannot establish hosted membership continuity, access on the
current old apex, or recovery of a real installed device. Those remain separately
bounded acceptance decisions. Ask the user only when a concrete entrypoint,
entitlement policy, resource, or provider decision is ready for review.

## Completion and handoff

Mirror sanitized branch results into project state/log and the migration ledger.
Record the reviewed source and exact proof limits; the next migration focus is
the [Calendar provider stage](2026-10-02-atmoshaper-calendar-provider-stage.md).
Keep registration and recurring
Supporter Checkout open, one-time support/background purchases disabled, the
separate Calendar selection intact, and old hosting/routing untouched. Passing
helper or control-handler tests alone would not establish an actual recovery
receipt. No recovery or private-data absence audit is claimed here.
