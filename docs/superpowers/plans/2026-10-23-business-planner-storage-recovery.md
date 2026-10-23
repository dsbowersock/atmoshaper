# Business planner browser-storage recovery

## Scope and evidence

Continue the migration's offered-tool readiness while the separate shared-media
inventory cost decision is pending. No provider request, database operation,
payment, account/email mutation, publication, merge or Production action is part
of this branch. Dependencies and Chromium must come from the existing cache.

The baseline is reviewed `877d50d`. A provider-free Chromium fixture renders all
six actual planner clients and their real calculation/normalization code. With
working storage they expose 22, 8, 13, 25, 8 and 17 controls respectively. With
an injected browser `SecurityError` at the `localStorage` getter, every client
reaches the error boundary and exposes zero controls. All fixture requests were
fulfilled locally; no other request occurred. The browser and temporary bundle
were closed/removed. This is a browser API failure reproduction, not evidence
that the current public deployment is experiencing that browser policy.

## Repair decision

- Change Necessity: **code-change**. Current effects access browser storage
  outside a failure boundary; configuration or documentation cannot make these
  six components tolerate the platform API's failure contract.
- Canonical owner: a shared business-planner draft-storage hook; each form keeps
  its existing normalization/calculation and input state contract.
- Patch shape: replace six duplicated hydration/write effects with the shared
  lifecycle; do not scatter six catch blocks or add a remote persistence fallback.
- Causal status: confirmed proximate mechanism, with the browser policy or
  storage-capacity condition an external input. The application-owned recurrence
  is treating storage access as infallible in each duplicated effect.
- Falsifier: the same real clients mount with available storage and fail after
  only the getter changes to a throwing API. Calculation inputs and component
  dependencies do not change between those cases.
- Ripple: six clients, shared draft state, and Income's existing account-sync
  boundary. Anonymous work must never start account requests.
- Minimality: one shared hook and one notice, preserving normal-case geometry,
  stable keys/JSON formats, normalizers, calculations, URLs and account ownership.
  No generic application-wide persistence abstraction or new storage backend.
- TDD Mode: off; diagnostic reproduction plus post-change behavioral regression.
  No strict/test-first route was requested.

## Behavior to preserve and verify

1. A valid existing local draft hydrates before the first automatic write,
   including React Strict Mode. Unknown keys remain untouched.
2. Getter/read failure keeps the calculator usable in memory, exposes a polite
   local-save notice and prevents automatic writes to an unread draft.
3. A quota/write failure preserves the current input and existing stored data;
   a later successful save clears the notice. Do not reset user input.
4. Corrupt JSON retains the existing reset behavior only when removing that
   form's own invalid key succeeds; a failed removal preserves the raw value
   and prevents overwriting it. Do not clear browser storage broadly.
5. Each client keeps its existing `massagelab-*` compatibility key and existing
   normalized JSON shape. Do not rename keys or migrate stored values.
6. Income's accepted account seed takes precedence over a browser draft. Its
   existing signed-in sync remains separately reported and uses only its existing
   app-settings contract; anonymous fixtures make zero account requests.
7. Local-save failure must not claim that the draft was saved on this device.
   Existing account success/error reporting stays distinct from local storage.

## Implementation and validation

1. Add the focused shared hook and notice with intent/constraint documentation.
2. Rebind the six clients and preserve Income's hydrated synchronization anchor.
3. Add a named, provider-free focused regression script. Use the actual clients,
   real normalizers and cached Chromium; stub only navigation, browser-storage
   failures and the existing account endpoint. Fulfill fixture traffic locally
   and abort any other request. Fixtures contain invented worksheet values.
4. Cover available/blocked/read-failed/quota/corrupt/recovery states, stored-draft
   preservation, affected controls and guest/account boundaries. Verify desktop
   and mobile notice behavior without changing normal visual baselines.
5. Run the focused script, existing business calculation/source tests, changed-
   file lint and typecheck. Check source/index/lock/dependency preservation.
6. Record the actual result and remaining final-artifact acceptance. Keep this
   source branch local until publication is separately authorized; do not reopen
   the completed PR review monitor or modify those reviewed branches.

The browser fixture demonstrates the client seam without a full Next deployment,
live sign-in, real account write or final public artifact. Those broader claims
remain part of the migration's separate release acceptance.

## Review counterexample: recreated initial account props

The first shared-hook version treated every new server-seed object as a new
hydration instruction. A real-browser counterexample entered an unsaved value,
then recreated the same account's original seed object: the input reverted.
This branch-only regression was caught before publication. The account page's
existing `useState` initializer uses the server worksheet as an initial value,
not a continuing overwrite channel.

Decision: code-change at the shared lifecycle owner. Retire continuous seed
rehydration; capture the caller's initial-value preference for this mounted
worksheet. Do not infer account identity from display names, input equality or
content hashes. Preserve drafts across ordinary props refresh, and retain the
existing account-sync boundary. A new form mount still accepts its own initial
seed. Actual authenticated account transitions remain outside this invented
client fixture and require the migration's existing separate acceptance.

## Local validation complete

- `npm run test:business-planners`: 46 passed, zero failed/skipped; 28 browser
  scenarios plus 18 existing calculation/source regressions.
- `npm run typecheck`: passed on the final source.
- Offline changed-file ESLint: passed for all twelve changed source/test paths.
  Full-tree lint also passed before the final initial-value-only correction;
  the final affected paths are covered by the subsequent scoped check.
- Real clients remain usable after getter/read/quota failures. Valid reload,
  Strict Mode hydration, unread-draft preservation after API recovery, corrupt
  key boundaries, write recovery, Income account-seed precedence/mocked saves,
  refreshed-props edit preservation and mobile notice/focus cases pass.
- All six compatibility keys, calculation modules, schema and dependency lock
  are unchanged. Six duplicate storage-effect owners are retired; only the
  shared hook accesses device storage in these clients.
- Cached dependencies/Chromium were reused. Temporary bundles and browser
  contexts are closed/removed. Account requests are invented fixtures fulfilled
  locally; there is no real account/database/provider operation.

The first expanded test run exposed two test-contract assumptions: storage now
belongs to the hook, and the existing checklist normalizer expands absent entries
to false. Those assertions were aligned with the existing intended behavior,
without changing the normalizers. A separate actual regression in the first
shared hook (recreated initial props replacing an edit) was reproduced and fixed
at the lifecycle owner before publication. Baseline and working evidence have
separate receipts after an earlier diagnostic filename was reused.

Local repair verification is complete, with bounded remaining scope: no full
Next artifact/production CSS comparison, real sign-in/account write, hosted CI or
independent PR review on this new branch. Retain the managed worktree for review;
source publication requires its separate owner authorization. The overall
migration remains open, with the shared-media read still held at the current
$0 budget boundary. No merge or Production change is authorized.
