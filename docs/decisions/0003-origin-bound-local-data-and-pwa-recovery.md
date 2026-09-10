# ADR 0003: Origin-Bound Local Data and PWA Recovery

Status: Proposed

## Context

Professional records are encrypted in browser-local storage, with session-memory
unlock and user-controlled exports. Cookies, preferences, payment attempts and PWA
installations also have origin-specific behavior. The old apex and www are separate
origins; a new domain does not carry those records or installations with it.

## Decision

Propose host-aware recovery/export on both old origins before broad redirects,
with explicit user-controlled encrypted export/import, safe sign-in and installed
PWA replacement guidance. A dedicated recovery entrypoint, migration experience
and scoped worker-transition implementation are not implemented by Phase 3. The
[local-data plan](../rebrand/atmoshaper-local-data-and-pwa-plan.md) and
[domain plan](../rebrand/atmoshaper-domain-cutover-plan.md) own Phase 8 requirements.

Binding now: preserve readable old-origin records and all valid legacy imports.
Never automatically upload, relay or synchronize PHI or encrypted vault contents
between origins. Do not forward cookies, OAuth codes, binding proofs, reset secrets
or room credentials in redirects or migration exports. Keep unknown storage intact;
source-search absence does not prove that historical installations contain none.

## Rationale

A blanket redirect can strand origin-bound records and old installed PWAs. Automatic
cross-origin transfer would bypass the user-controlled professional-record boundary.
Independent recovery tests on both old origins make the proposed transition
falsifiable without changing current source behavior merely to simplify migration.

## Compatibility boundary

The [vault](../../lib/professional-record-vault.js), [manifest](../../app/manifest.ts)
and [service worker](../../public/sw.js) retain current keys, formats, scope and
behavior. The worker warms only anonymous allowlisted documents; it is not a PHI
cache or hosted sync queue. Its current activation deletes every cache other than
its current cache. That existing broad behavior is a known Phase 8 hazard, not a
recommended migration operation: prove scoped ownership before introducing recovery
caches or changing worker identity. This ADR does not change activation behavior.

Do not clear storage, unregister installations or destroy browser data as migration
cleanup. Current explicit user deletion and validated legacy migration behavior
remain unchanged. Hosted professional-record storage and therapist viewing of cloud
wellness records remain separately gated. There is no approved recovery end date or
automatic expiry.

## Revisit trigger

Revisit before any domain, manifest, worker, export-format or old-origin change.
Acceptance requires synthetic-record proof on both old origins and the new origin:
offline/online old-PWA recovery, locked/unlocked vaults, wrong-passphrase handling,
legacy/malformed imports, encrypted round trips, credential isolation and no automatic
PHI transfer. Any domain-bound credential dependency stops the dependent cutover.
Broad redirects and eventual retirement require a separate recovery-period decision.

## Immutable source

- [Migration design, local-data/PWA transition](https://github.com/dsbowersock/massagelab/blob/e74045c2fc85c2cb4df176fdb1aff2137c4d9848/docs/superpowers/specs/2026-09-06-atmoshaper-repository-migration-design.md#phase-8-local-first-data-and-pwa-transition).
- [Local-data inventory and required proof at merged bootstrap](https://github.com/dsbowersock/atmoshaper/blob/f59e1b9371b06e7401740ae011f6dc911430a97c/docs/rebrand/atmoshaper-local-data-and-pwa-plan.md).
- [Domain recovery contract at merged bootstrap](https://github.com/dsbowersock/atmoshaper/blob/f59e1b9371b06e7401740ae011f6dc911430a97c/docs/rebrand/atmoshaper-domain-cutover-plan.md#legacy-recovery-route-contract).
- [Existing worker behavior](https://github.com/dsbowersock/atmoshaper/blob/f59e1b9371b06e7401740ae011f6dc911430a97c/public/sw.js).

## Consequences

Future cutover must retain old-origin service and support long enough for the
separately approved recovery contract. A new origin may require sign-in and PWA
reinstallation. No recovery capability, storage migration, worker repair, redirect
or origin retirement is claimed by this record.
