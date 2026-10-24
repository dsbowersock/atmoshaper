# Professional-record vault lock lifecycle repair

Date: October 24, 2026. Local diagnosis and repair only; publication remains separate.

## Observed behavior and owner

The unchanged real React provider and real vault cryptography were bundled from
source `671d7f2`. Record storage was an in-memory Map in a fresh task-owned
Chromium profile. A normal save succeeded. Holding one genuine asynchronous
decrypt, choosing Lock, then releasing that earlier save changed the visible
state from `locked` back to `unlocked`. The diagnostic assertion failed for that
exact transition. The browser job is closed and its temporary profile removed.
No real vault, account, application database, credential or provider was used.

The provider owns both the lock intent and all asynchronous updates of its
plaintext payload/status. The confirmed mechanism is an older completion
updating the current view without retaining the lifecycle in which it started.
The pause changes only ordering; helper values, cryptography, React state and
the lock method remain real. Root closure still requires the counterfactual and
same-pattern regression coverage below; do not label the whole migration done.

## Change necessity and compatibility

Decision: code-change, at the existing provider owner. Requiring users to wait
before Lock or disabling that privacy control would preserve the defect's
responsibility and add user effort. Lock must immediately close the view.

Preserve already accepted encrypted saves: they may finish writing ciphertext
after Lock, but must not repopulate plaintext state, reopen the view, or replace
the current lock/error message. Explicit reset/recreation invalidates older
writes so they cannot restore a discarded vault. Do not change encrypted
formats, storage keys, PBKDF settings, normalization, existing merge rules,
entitlements, legal text, UI geometry or the public context's three-argument
persist API. Do not introduce a new queue, retry protocol or data migration.

## Patch shape and complexity

- Canonical owner: `app/notes/professional-record-vault-provider.tsx`.
- Shape: an in-memory lifecycle token issued before asynchronous work, checked
  at the owner's state/storage commit seams; no consumer-specific patches.
- View invalidation: Lock, reset, unmount and a newer explicit unlock/create.
- Storage-generation invalidation: explicit reset/recreation. Lock alone must
  preserve accepted ciphertext writes.
- Async import must carry its original token through its later persistence
  call; it must not acquire current-view authority after an await.
- Token roles are bound before work: render-bound view authority rejects callbacks
  captured before Lock; a module-private storage generation survives provider
  remounts and changes only for explicit reset/recreation. Neither stores keys,
  passphrases or record payloads.
- Metadata-only pending-write barriers let a fresh Unlock await accepted writes
  for its storage generation before reading ciphertext. They do not serialize
  writes, add retries or retain plaintext; each operation settles its own barrier
  in finally. Reset/recreation makes earlier-generation barriers irrelevant.
- Minimality/ripple check: changing only post-await view updates would fix the
  visible reopening but allow a fresh Unlock to read stale ciphertext. Separate
  view/storage checks plus pending-write settlement cover that same owner
  boundary without changing consumers, durable formats or merge policy.
- Existing pressure: the file contains provider logic and presentation. This
  is a local correction to its existing state authority, not a new owner or
  new responsibility. Keep helpers small and document their distinct checks.
- Retire: unconditional late completion authority over a closed view.
- Retain: legitimate local crypto, saves, imports, exports and cross-tab merge
  behavior. Do not claim linearizable multi-tab storage from this repair.

## Atomic work and verification

1. Create an isolated branch from the clean local review follow-up, preserving
   all existing worktrees and the independent R2 worker.
2. Add an actual-provider regression fixture with cached React/Chromium and
   controlled asynchronous seams. Use only invented in-memory records and
   virtual fulfilled navigation; no database or application server.
3. Repair lifecycle authority in the provider. Keep tokens private and transient;
   carry the original token through import/persist rather than re-infer it.
4. Prove normal save/unlock/import/export behavior, immediate lock, delayed
   save/unlock/create/import completion after lock, ciphertext-save preservation,
   reset/recreation protection, stale-error suppression and fresh unlock recovery.
   Use controlled promises/React act, not timing sleeps.
5. Run the new regressions plus existing local clinical/vault tests, TypeScript,
   scoped lint and diff checks. Verify source/durable-format boundaries and
   remove only task-owned browser profiles/cache junctions.
6. Record the result and remaining final-artifact/role acceptance. Keep this new
   source branch local until separately authorized for publication/review.

TDD Mode: off; formal TDD route skipped because it was not explicitly selected.
The existing failing diagnostic and targeted before/after regressions remain
required evidence for this privacy/persistence correction.

## Independent active work

The approved private media copy continues under its original eight-hour stop,
65,064 new reservations and $0 requests/$0.30 additional monthly storage bounds.
PR #49 remains published at `583c257`; its docstring-only local follow-up is
`671d7f2`, validated by 62 tests and lint, awaiting the next included review
window no earlier than 22:34 UTC. No paid review, merge, Production change,
Sentry activation, database operation or new provider scope is authorized here.

## Local implementation and evidence

The provider now binds callbacks to a state-issued view token, with a private
ref used only in effects/handlers to revoke that authority synchronously.
Lock clears the view immediately. Accepted saves/imports may finish ciphertext
writes, but cannot publish plaintext, status or a message to the closed view.
Explicit reset/recreation changes the module-private storage generation so a
write from an unmounted older provider cannot restore a discarded vault.
Metadata-only settlement barriers ensure a fresh Unlock reads accepted saves.

Before application edits, the real provider's normal save control passed and
ten lifecycle regressions failed. The first fixture run failed at a Webpack
API mismatch before establishing causal evidence; that harness-only error was
corrected before the application source changed. The repaired source passes all
thirteen browser cases, including Strict Mode replay, actual encrypted import,
fresh-unlock settlement, unmount recovery and reset/recreation. The existing
62 clinical/vault cases and scoped lint pass. The final TypeScript check also passes. The fixture uses real React and cryptography, invented
in-memory Map records and virtual fulfilled navigation. It starts no application
server, database, auth session or provider operation.

Storage keys, encrypted formats, KDF/crypto settings, existing merge policy,
public context signatures, export identities and presentation remain unchanged.
There is no new queue, retry protocol or persistent coordination state. These
results close the reproduced local mechanism; final integrated route/role
acceptance and independent review of this runtime repair remain required.
Publication of this new branch remains unapproved and has not occurred.
