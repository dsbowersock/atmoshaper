# Offline Android source review and dispositions

November 22, 2026. Local source only; no merge/publication/provider mutation.
Initial CodeRabbit CLI review is complete for `0eb02e0..c1d0def`, using the
existing authenticated Ubuntu installation and an isolated Linux clone. It
raised 18 issues/questions: nine major and nine minor. Original NDJSON is kept
under ignored `output`; the receipt lists actual reviewed paths and excludes
the pre-existing launcher binary. Do not count a heartbeat as completion.

## Supported corrections

| Review issue | Correction and evidence |
| --- | --- |
| 1 | Approval form is keyed to account/session/install/challenge. Context changes discard its result and abort the older request; unchanged context retains its return link. |
| 2 | The fictional payment preview validates cancellation hours only while protection is active. Inactive policy receives a valid neutral default. Eight processor/viewport journeys verify clearing the field, disabling/re-enabling protection and normal consent behavior. No live payment code is activated. |
| 4 | Check cancellation after the final digest and pass its signal into the strict storage transaction. Abort rolls back both metadata and payload. Real browser acceptance cancels synchronously during the pack write, reloads, verifies Play stays disabled, then retries successfully. |
| 5 | Failed/timed-out Core storage openings are retryable. Late successful connections from abandoned attempts close. A controlled timeout/recovery case passes, along with a denied-storage fulfilled fallback. |
| 6 | Media schema version 2 has a separate metadata store. Metadata and payload writes/removals share one transaction. The upgrade retains v1 packs, migrating metadata with a cursor. Browser acceptance seeds v1 data, checks migration, and rejects any attempt to list the payload store with `getAll()`. |
| 7 | Handle rotation/window configuration changes without destroying the live WebView/audio context. Deadline persistence was already present, but audio recreation required correction. Exact-APK rotation/deadline/chime acceptance remains required for the corrected artifact. |
| 8 | Save/restore an undelivered signed receipt with Activity state and clear consumed Intent data. Signature/install/current-challenge verification still controls acceptance. |
| 9 | An account-operation epoch prevents verification started before Forget or a newer request from restoring stale claims. Browser acceptance holds post-commit verification, completes Forget, releases the old continuation, then confirms access remains removed across reload. |
| 12 | The standalone station metadata command creates its receipt directory before writing. |
| 13, 18 | Duplicate shared-output concern confirmed for a wildcard concurrent run. Core/media/background acceptance builds use three distinct allowlisted directories; Android uses the normal fourth directory. Three concurrent suites pass without mixed/missing assets. |
| 14 | Create the synthetic public-key fixture's parent before writing it. |
| 15 | Synthetic membership expiry exceeds the entire test budget; explicit clock advance still verifies expiry. |

## Refuted questions

| Review issue | Current-source evidence |
| --- | --- |
| 3 | Native startup and request creation expose device state only after `store.update()` commits initialization. Production callers do not publish the uncommitted default returned by an independent `load()`. |
| 10 | `createOfflineCoreStorage.save()` serializes all writes through one promise queue, waiting for strict transaction completion. The UI additionally matches acknowledgement to its immutable displayed snapshot. Prototype localStorage helpers are not a native write fallback. Actual process-stop recovery checks the acknowledged deadline. |
| 11 | Core `load()` catches open/read failures and fulfills defaults with `ready:false`. A denied-open regression verifies that contract; the entry therefore still renders free tools. |
| 16 | `android:build` already unconditionally rebuilt without a synthetic key override, and exact-APK acceptance asserts `syntheticReceiptAuthority:false`. Isolated background acceptance now also cannot replace normal Android assets. |
| 17 | `mediaUrl()` explicitly rebinds only the exact legacy public media origin to the prepared AtmoShaper origin and rejects foreign URLs. Actual Little Bells/ambient browser and Android downloads use that origin; offline replay requests no audio URLs. |

## Additional Codex inspection

Before the bounded follow-up, tighten Stop during pending ambient preparation so
an obsolete graph is disposed before fade-in; preserve request generations for
rapid Stop/restart. Match the website's conservative station gain mapping and
initial slider value. Test the issuer directly: same-origin explicit approval,
session-owner-only reads, ignored client entitlement/account spoofing, bounded
request bytes, anonymous/malformed/configuration failure and private no-store
responses. A valid signed online timestamp permits recovery after correcting a
device clock; an offline cache cannot reset that clock floor.

Keep both existing globe images as exact pinned native source assets with the
publisher MIT notice, so ordinary clean-checkout tests/builds need no image
download. Real public-audio acceptance is explicitly opt-in through its named
script; ordinary wildcard tests remain independent of the media host. Preserve
the original checked audio catalog; native presentation only removes one old
candidate label and corrects its copied footstep description.

## Remaining review boundary

One bounded correction-range CodeRabbit review and final exact-APK checks remain
before this receipt can close. Initial source coverage alone does not cover the
correction delta. The two added texture binaries require publisher/license/hash
verification rather than claiming automated text review of their pixels.
Live signing-key configuration, publication and physical S24 acceptance remain
separate gates. No reviewer output authorizes Autofix, provider or payment work.
