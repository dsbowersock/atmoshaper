# Music native-delivery acceptance at the canonical browser-test owner

Decision: code-change at `tests/browser/music-media-session.spec.ts`. Retire the custom Windows wrapper from active validation while retaining every historical packet and failed receipt. This plan transfers the same temporary diagnostic acceptance into the existing compiled browser campaign; it does not claim player success from source checks.

## Execution readiness

- Intent lock: prove the same page and compiled application cannot complete native Music startup while its invented payload is held, then can decode/start after release; retain deliberate fail-closed unknown-media acceptance.
- Baseline: `codex/anatomy-temple-exact-sources` at `fb2d26ff96bbfc3c0aa79c8693feaf0f1e31ddd0`, clean working tree and empty index, upstream divergence 0/0. No active merge/rebase was found. Existing managed checkout is reused; root owns Git mutation and publication.
- Scope fence: this plan, the Music fixture audit, existing Music browser spec and the synthetic fixture's WebSocket isolation seam only. Root expanded the fixture scope for the verified review finding that same-origin WebSockets escaped counting. No product, package, lockfile, CI configuration, canonical state/log, other checkout or wrapper edits.
- Authority: routine source-only preparation and cached static checks. No app import/execution, build/server/browser campaign, network/provider/credential access or new private approval is inferred.
- TDD Route Guard: Mode off; Decision skipped; Strict authority none. Test posture is transfer of diagnostic assertions into their existing owner. Static preservation checks precede independent specification then quality review; browser execution belongs to the canonical current-head CI gate.

## Change necessity and complexity

The temporary wrapper has not reached application acceptance, while the existing CI browser owner builds and runs the application. A documentation-only transfer cannot exercise the acceptance. The minimum change is passive counters within the existing ownership instrumentation and two scoped test registrations. No launcher, separate prototype wrapper or new test owner is needed.

The spec is large and already mixes related Music ownership cases. This is a local fix without a new responsibility: native decoder counters belong beside its existing decode interception, and causal cases belong beside startup assertions. Edit in place, retain all existing tests verbatim, and avoid a parallel instrumentation abstraction. Complexity remains bounded to those two seams and their audit.

## Acceptance and preservation

1. Extend the existing single ownership init script with native-decoder availability and started/completed/rejected counts. Invoke the original decoder with the original receiver/arguments; preserve its returned buffer and thrown/rejected error. Only the native branch installs this instrumentation; the non-native graph fallback cannot satisfy the counters.
2. Add a desktop Chromium causal case with zero retries and the diagnostic's 90-second case / 60-second playing limits. Install the synthetic Observable fixture with `holdPayloads: true` before navigation. Use `openStation` and its actual Play button. Require selected-index fulfillment, held payload intent, loading, no fulfilled selected payload, no completed native decode and no actual startup timing while held. Release the same gate; require selected payload fulfillment, native decode completion, actual startup timing for the station, playing, no decode rejection, isolation and Stop. Retain abort-only disposal in a finally block.
3. Transfer the deliberate unknown-media rejection as a separate desktop control with scoped blocked service workers and zero retries. Require fetch rejection, exactly one media miss and the expected isolation assertion throw. Also require a same-origin socket to close with exactly one blocked-socket count; remove the fixture's active same-origin forwarding exception so every socket remains unconnected. Retire fulfillment and require another fetch rejection via the retained abort-only guard, preserving the original media miss. Do not run this expected negative through the successful synthetic fixture's zero-miss teardown.
4. Preserve every original test case, assertion, timeout, retry and mobile coverage. New controls explicitly skip non-desktop projects. Emit only synthetic-local counts/asserted states, with no raw event/provider/error payloads.
5. Run cached lint and no-emit type analysis plus an inert AST comparison against the baseline for original case bodies/assertions. Independently review specification, then quality before root publication. Current-head CI must subsequently prove actual player acceptance; no source-only result substitutes for that gate.

## Checkpoint and remaining evidence

The source transfer is prepared in the four scoped paths. Repository/scoped lint, no-emit typechecking, original-case/assertion preservation and inert decoder/transport-sentinel checks pass. Independent reviews remain the coordinator's next gate before publication. The six existing selected project-case executions passed on published `fb2d26f` in CI `40678349816`, job `122783174221`; preserving them alongside the two new desktop controls retains the eight-case acceptance scope. The two new controls and WebSocket correction still require future current-head CI evidence. The earlier 17 inert passes/four expected negatives and native PCM positive/invalid-payload negative remain historical fixture evidence. The historical hosted-CI cause remains unproven. No private Cloudflare readiness/security reply or fresh credential authority is inferred.
