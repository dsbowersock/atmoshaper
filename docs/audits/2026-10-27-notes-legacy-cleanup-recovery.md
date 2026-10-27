# Notes committed-vault recovery after partial legacy cleanup

## Finding and scope

The October 27 controlled same-origin diagnostic exercised the actual Notes vault provider and recovery controls with native browser storage and real crypto. Normal four-family migration and failed-first-write retry passed. In the third case, ciphertext containing all four supported draft families committed, SOAP plaintext cleanup succeeded, and an injected intake cleanup exception left Create available. Actual Create retry then replaced the full vault with the remaining legacy inputs; fresh unlock lost the SOAP draft. The retained diagnostic ended with `CONTROLLED_CLEANUP_RETRY_LOST_SOAP`, 102 checks, zero page errors or blocked network/WebSocket requests, and completed compiler/context/browser/temporary-resource cleanup.

This is conditional application behavior under a controlled cleanup fault. It does not establish a naturally observed browser failure, failure frequency, affected users or a Production incident. The original failed receipt remains evidence; it is not replaced by later candidate checks.

## Bounded repair

`ProfessionalRecordVaultProvider.createVault` now records ciphertext commit only after `localStorage.setItem` returns. If subsequent cleanup throws while that operation still owns the view, it calls the existing `lockVault` transition and displays a warning that encrypted storage succeeded, plaintext cleanup is incomplete, and Unlock recovers the drafts. The failed create still returns false. A closed or superseded view cannot publish this recovery transition or warning.

Using the existing lock owner clears the in-memory payload and passphrase, revokes older view authority and updates revision. The existing gate offers Unlock instead of setup. Pre-commit error feedback and retry, normal create, explicit reset/recreation, crypto parameters, storage keys/formats, collection rules and accepted-write generation authority remain unchanged. Unlock recovers the committed vault; this repair does not claim that surviving plaintext cleanup has completed.

The focused lifecycle regression uses the actual provider and real crypto through the existing fixture's in-memory Map storage adapter. It seeds four invented draft families, captures SOAP absence and ciphertext presence at the injected intake-removal fault, restores the adapter in `finally`, and checks false create result, locked state/warning, full encrypted payload, hidden view payload, exact failed-intake/unrelated bytes and recovery of all four families through actual `unlockVault`. Other legacy keys may remain unchanged or be removed by legitimate post-commit cleanup; Unlock must preserve the captured post-fault storage bytes. Presentation is stubbed in this fixture; it is not native-storage or actual-UI evidence.

## Verification status

Final root-owned source validation passes scoped lifecycle lint, whole-project no-emit typecheck and all 14 lifecycle controls, including the recovery regression. The earlier 62/62 clinical-local passes are retained with their helpers unchanged, for 76 passing source controls. The existing `lockVault` definition and JSDoc are placed unchanged before the new caller to give React analysis a direct lexical dependency. No suppression, configuration change or generation-authority redesign was added. Independent complete-candidate source review passes.

The rebound actual-controls/native-storage proof passes all three cases and 108 checks in 11.389 seconds: normal four-family migration, failed-write retry, and committed-vault recovery after the controlled cleanup fault. Assertions, entry and loader remain byte-identical to the original diagnostic. Actual form controls, the real provider and crypto, native browser storage and fresh-remount Unlock recover all four selected invented draft shapes. Page errors and unexpected request/WebSocket counters are zero; the expected virtual document loads were fulfilled locally. Compiler, contexts, browser and owned temporary-resource cleanup complete, with terminal exit zero.

This native proof is bounded to those selected invented shapes and local recovery controls. It does not establish natural Chrome failures, a user incident, authentication or membership, full Next routing, hosted/default transport, installed PWA behavior or whole-site acceptance. The original failed diagnostic remains preserved alongside the passing repaired-source evidence.

Existing Help/billing guidance and canonical project records are outside this patch. Publication, merge, deployment, provider writes, hosted clinical storage and public activation remain separate decisions. Prior accepted local/provider campaigns remain closed within their original scopes.
