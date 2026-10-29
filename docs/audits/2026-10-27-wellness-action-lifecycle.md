# Wellness action lifecycle and local acceptance

Prepared October 27, 2026. Source candidate published for review in PR #59; not merged or promoted to the public site.

## Problem and resulting behavior

Wellness could insert a returned entry while still displaying Working and disabling its controls. The component used a React transition that could remain pending beyond its own action result. Its callbacks also lacked synchronous duplicate admission and ordinary rejection recovery; malformed successful entry replies could display Saved without a normalized entry.

The component now owns the awaited action/result lifecycle with local pending state and a shared ref lock across Quick log, ROM, delete and export. The lock closes same-tick duplicate admission before disabled controls render. Finally releases it after completion or rejection. Ordinary failures use existing fixed messages, preserve input, and allow recovery; supported Next control-flow signals are rethrown. Quick log and ROM require a valid normalized entry before success/upsert/reset.

Normal server actions and their revalidation/cache behavior, normalization, access checks, page layout, confirmation and practice behavior are preserved. Completing one local action does not itself prove that Next's action queue is ready; two consecutive real saves were required for prior local acceptance.

## Validation

### Source regression checks

The original local acceptance recorded ten actual-component/handler regression controls passing, with a genuine pre-edit failure for the stuck transition and duplicate dispatch. Earlier public PR packaging checks passed the original ten controls, scoped lint, whole-project typecheck and 62 existing clinical/privacy checks; the typecheck and 62 clinical/privacy checks were not rerun for this review follow-up. Root validation of this follow-up passes all eleven lifecycle controls and scoped lint, each with exit 0. The added control directly invokes staged delete and export confirmation handlers while Save is pending. Root also verified that compiling with comments removed produces JavaScript byte-identical to published revision 24c58e8; the focused component JSDoc changes no runtime implementation.

### Prior local runtime acceptance

The following are prior local acceptance receipts from the private QA composition, whose production Wellness runtime implementation is unchanged in the component proposed in PR #59. The component source now includes focused JSDoc; compiled code remains unchanged. The full build, browser journey and database inspections/cleanup were not rerun for this PR or its current published revision:

- The prior full local application build passed.
- The prior clean three-case browser journey passed with no retries or global errors: Income persistence/isolation; two consecutive distinct Wellness saves on the same page with usable controls, fresh signed-in owner hydration, other-user exclusion and exact database state; existing Notes access and local-vault handoff.
- All three prior fixed database inspections and ownership-bound cleanup passed; the fixed network guard reported zero denied HTTP/CONNECT traffic.

That prior browser check used invented users and neutral records in a disposable local database. Notes created an empty local encrypted vault and filled an unsaved synthetic Journal field; this does not certify every clinical workflow or hosted clinical storage. Earlier failed runs remain recorded; the latest prior pass does not identify every earlier transient failure's cause or establish blanket stability. Hosted browser acceptance for the current published source remains unverified.

## Public delivery boundary

The source candidate consists of the Wellness component, its focused regression test, two named package scripts and this sanitized audit. Private browser fixtures/controllers, resource limits, authority/credential material, operation packets and row data are excluded. Hosted artifact compatibility, CI/review, public routing, purchases and Sentry activation remain separate gates.
