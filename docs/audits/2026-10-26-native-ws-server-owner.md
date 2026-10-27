# Native WebSocket package ownership

## Problem and repair

Next's Node optional-peer resolver can replace a missing `bufferutil` peer with a successfully loaded empty module. The installed `ws` package treats a successful require as an available accelerator, then calls its mask method for sufficiently large client frames. Native Node resolution instead throws for the absent optional package, preserving ws's built-in JavaScript fallback.

Keep `ws` on its native Node package owner with `serverExternalPackages: ["ws"]`. This is a server bundling policy at the canonical Next config owner. It preserves existing authentication, queries, cache policy and transport options. It adds no dependency, environment override or custom fallback.

The installed Next/ws source chain and an isolated resolver counterfactual support this repair. The historical protected exception's raw message was not retained, so its exact message is not reconstructed here.

## Focused regression

`tests/ws-native-owner.test.mjs` loads the actual config through an inert VM boundary with a synthetic environment and identity Sentry wrapper. It calls the installed Next external handler using deterministic resolution and verifies native ws ownership for the selected server layers and QA configuration. Removing only the app's ws opt-out restores RSC bundling in its negative control.

A separate check evaluates the installed ws JavaScript masking code with a synthetic missing optional dependency. An 80-byte mask/unmask round trip succeeds; returning an empty optional module reproduces a TypeError. This tests the native-resolution fallback contract without a server, socket, database or provider.

Run:

```sh
npm run test:ws-native-owner
npm run lint:ws-native-owner
```

The test genuinely failed against the prior config, then passed both checks after the repair. Scoped lint passes. The source test uses injected CommonJS resolution; it is not itself a complete production bundle or every possible ESM resolution condition.

## Executed integration evidence

A bounded tiny webpack control used the actual installed Next optional-peer resolver and native ws Sender with invented bytes. All four bundled native/observed Buffer/offset-view cases failed before frame writes. Restoring the unbundled ws owner made the same four cases return through one callback, write the expected 86 bytes and verify cleanup. The counterfactual uses a CommonJS external and carries that interpretation limit.

The protected local application then passed its cached build and initial database inspection. The formerly stalled Admin directory loaded in 1,871 ms; its directory, detail and security checks passed, and app-server model reads completed. Twenty account/admin cases passed before a Google-only guidance assertion stopped the matrix. A separate fixture identity/cache-lifetime mismatch was reproduced with the actual account loader and a fake clock. Fixture invocation isolation then exposed an oversized synthetic notification key; compact fixture identifiers now pass real link/add-password/disable-password queue regressions without changing product limits or security behavior.

The subsequent cached application build and initial inspection pass. All eight Admin cases and the earlier sign-in/password-guidance cases pass: 22 cases pass before the security-change acknowledgment's expected sign-in URL fails, leaving 25 unrun with no retries. Cleanup is verified. That remaining redirect failure is not yet classified as an application or fixture defect; the full account/admin matrix remains open. It is not evidence that the original Admin read hang returned.

That local application artifact combined approved public source with reviewed QA instrumentation. It is supporting integration evidence, not literal public-candidate or hosted acceptance. This patch contains the config owner, focused regression and named commands; private diagnostic controllers and observations remain outside its publication scope.

## Release boundary

This local candidate is based on approved main `11417ff`. Publication, hosted CI/Preview review, guarded integration and final public rollout require their applicable decisions. Public routing, Sentry activation and purchase activation are not changed by these local checks.

See [Next's documented native package opt-out](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverExternalPackages).
