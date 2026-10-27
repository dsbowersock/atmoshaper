# Preserve a committed Notes vault after legacy-cleanup failure

## Scope and evidence

This bounded repair belongs to the existing MassageLab-to-AtmoShaper migration and its required same-origin legacy-draft recovery. It does not restart cross-origin transfer, generic import/cache/PWA improvements or a real-user data campaign. Base is local `903523f` (public `471ccd6e` plus the separately reviewed two-file Help/billing correction); retain both branches and their separate publication decisions.

The real provider, real recovery controls, native browser storage and unmodified crypto reproduced a controlled failure: the complete four-family encrypted vault committed; SOAP cleanup succeeded; an injected later intake cleanup exception left the setup form available. An actual same-page Create retry replaced the complete ciphertext with remaining legacy inputs. Fresh remount/unlock then failed SOAP preservation. Normal four-family migration and a failed first ciphertext write followed by retry passed. This establishes exceptional application control flow; it does not establish spontaneous browser failure, frequency, affected users or a Production incident.

## Owner and change decision

Decision: **code-change** at `ProfessionalRecordVaultProvider.createVault`. Cleanup currently controls whether the view acknowledges an already committed encrypted write. The canonical vault owner must preserve that commit truth; changing only the form button, format, encryption, collector, browser adapter or test deadline would not repair it.

Keep the normal create path, pre-commit failure/retry, stable storage keys/formats, crypto parameters, generation authority, ordinary save/import semantics, explicit reset/recreation and accepted-write/locked-view behavior. On a post-commit cleanup exception in the still-current view, move to the existing locked-vault recovery state and display an honest warning that plaintext cleanup was incomplete. Reuse the existing lock transition rather than inventing a second state owner. Real Unlock must recover the full committed payload; the failed setup flow must not remain available. Closed/replaced views may not be reopened or expose plaintext by this error handling.

No schema, storage migration, new service, permission, entitlement, host, provider or legal behavior is introduced. The natural origin of a partial native cleanup failure remains unknown; the repair is conditional data preservation under that controlled fault.

## Implementation and verification

1. Add a focused existing-provider regression for committed ciphertext plus partial cleanup failure: locked view, visible-context warning, complete ciphertext and successful original-passphrase unlock. Preserve all existing lifecycle controls.
2. Track whether the encrypted write committed; isolate subsequent cleanup failure from pre-commit failure. Use the existing lock state owner. Add an intent comment explaining why a second setup attempt would be unsafe.
3. Run the relevant vault lifecycle/crypto/collector controls, scoped lint and no-emit typecheck using cached dependencies and a credential-free child. This is diagnostic reproduction plus regression verification, not a new blanket acceptance campaign.
4. Rebind a fresh copy of the reviewed three-case native-storage/UI packet to the repaired source. Preserve the original failed receipt and all assertions. Require normal migration, failed-write retry, actual post-commit warning/Unlock, complete fresh-remount recovery, unrelated-storage preservation, zero external activity and verified owned cleanup.
5. Independently review the complete candidate and actual evidence, then make one local commit. Publication and any merge require their own concrete decision; no push or public activation follows from local verification.

The three-case client proof does not establish server membership, full Next routing, final hosted/default transport, installed PWA behavior or whole-site acceptance. Previously accepted local/database/provider results remain closed within their scopes.
