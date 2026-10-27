# Wellness action lifecycle and local acceptance

Prepared October 27, 2026. Local candidate; not published or deployed.

## Problem and resulting behavior

Wellness could insert a returned entry while still displaying Working and disabling its controls. The component used a React transition that could remain pending beyond its own action result. Its callbacks also lacked synchronous duplicate admission and ordinary rejection recovery; malformed successful entry replies could display Saved without a normalized entry.

The component now owns the awaited action/result lifecycle with local pending state and a shared ref lock across Quick log, ROM, delete and export. The lock closes same-tick duplicate admission before disabled controls render. Finally releases it after completion or rejection. Ordinary failures use existing fixed messages, preserve input, and allow recovery; supported Next control-flow signals are rethrown. Quick log and ROM require a valid normalized entry before success/upsert/reset.

Normal server actions and their revalidation/cache behavior, normalization, access checks, page layout, confirmation and practice behavior are preserved. Completing one local action does not itself prove that Next's action queue is ready; two consecutive real saves were required for acceptance.

## Validation

- Ten actual-component/handler regression controls pass, with a genuine pre-edit failure for the stuck transition and duplicate dispatch. Scoped lint and whole-project typecheck pass; 62 existing clinical/privacy checks pass.
- The full local application build passes.
- A clean three-case browser journey passes with no retries or global errors: Income persistence/isolation; two consecutive distinct Wellness saves on the same page with usable controls, fresh signed-in owner hydration, other-user exclusion and exact database state; existing Notes access and local-vault handoff.
- All three fixed database inspections and ownership-bound cleanup pass; the fixed network guard reports zero denied HTTP/CONNECT traffic.

The browser check uses invented users and neutral records in a disposable local database. Notes creates an empty local encrypted vault and fills an unsaved synthetic Journal field; this does not certify every clinical workflow or hosted clinical storage. Earlier failed runs remain recorded; the latest pass does not identify every earlier transient failure's cause or establish blanket stability.

## Public delivery boundary

The source candidate consists of the Wellness component, its focused regression test, two named package scripts and this sanitized audit. Private browser fixtures/controllers, resource limits, authority/credential material, operation packets and row data are excluded. Hosted artifact compatibility, CI/review, public routing, purchases and Sentry activation remain separate gates.
