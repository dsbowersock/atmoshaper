# Grouped PR #80 recovery corrections

November 22, 2026. Local preparation; no additional push, merge or publication.

Hosted Codex reviews `5f76890` and reports one confirmed initial-load overwrite.
Hosted CodeRabbit's explicitly requested full review completes on the same head,
processing 77 text paths and posting 21 comments. It independently confirms that
overwrite and identifies a major abandoned Transport repeat. These are actual
completed reviews, distinct from the initial low-star automatic skip. The CLI
review of `5f76890..1ef8453` then completes with zero issues across all 10 paths;
that receipt covers the startup guard, not the later group below.

## Supported corrections, grouped once

| Hosted comment | Verified behavior and prepared disposition |
| --- | --- |
| 4660933912 | Spec's obsolete offline status updated; physical-device/parity gates retained. |
| 4660933916 | Ambient output disposed when engine startup rejects before returning a handle. |
| 4660933922 | Media connection close/versionchange clears only its own cached open promise. |
| 4660933926 | Missing/blank merchant references cannot report payment readiness. This remains a local, inactive provider contract. |
| 4660933931 | Native public-media connection disconnected if response setup fails before stream handoff. |
| 4660933935 | Native README distinguishes completed signing configuration from pending issuer publication. |
| 4660933943 | Station import precedes graph allocation; acquired scheduling, generator and output resources cleaned on startup failure. |
| 4660933949 | Station-owned Transport registrations, including recursive callbacks, cleared at Stop without cancelling another owner's events. Shared methods restored synchronously. Upstream final gain-disposal callback remains outside the stopped scope. |
| 4660933955 | Cancellation ends at durable pack commit; a later metadata-list failure reports a saved pack. |
| 4660933958 | Rejected runtime-import promise released for Play retry. |
| 4660933964 | An old Stop completion cannot clear the controls owned by a newer Play. |
| 4660933972 | Stop all stays available while audio is preparing, including after filtering the card away. |
| 4660933977 | Hash failure has a distinct verification error and damaged-pack state; unrelated playback errors do not label downloads damaged. Remove remains available. |
| 4660933984 | Active-layer volume is retained across category/card remounts. |
| 4660933987 | Forget clears active access immediately but retains its removal action until durable deletion succeeds. |
| 4660933991; Codex 4660888543 | Failed initial Core read cannot autosave fallback defaults; committed timer/settings survive until successful reopen. See the dedicated before/after receipt. |
| 4660934001 | Timer editor shares the domain maximum, rejecting unsupported final seconds without corrupting the saved duration. |
| 4660934008 | Named emulator commands opt into distinct suites; combined acceptance runs serially. Ordinary wildcard tests skip emulator mutations. |
| 4660934016 | Stage APK/proof first, invalidate previous proof before replacing APK, publish new proof last. |
| 4660934020 | Owned-access future-time test waits for the actual access observer. |
| 4660934025 | Duplicate-receipt test waits for saved verification before installing its counted gate. |

CI on the original PR head separately finds a duplicate route `main` landmark,
an outdated source-location assertion after extracting the shared moving-gradient
renderer, and the same saved-verification race. The approval page now uses a
named section inside the existing shell main. The motion check verifies both
the real website adapter and its extracted renderer; its reduced-motion
assertions remain intact. Original-head CI is not proof for this correction.

## Validation and retained boundaries

Focused synthetic tests cover owned/repeated Transport scheduling and failure
cleanup, media connection reacquisition, blank merchant evidence, timer limit,
durable initial-load preservation, failed receipt removal/retry, active volume
remount and damaged download readiness. Updated browser, lint/type and exact
APK acceptance are in progress at this checkpoint. A redirected sandbox browser
lookup is an environment failure; reruns use the existing outside-sandbox
Chromium, with no browser installation. The SIM-less emulator's stale default
cellular preference is explicitly disabled along with airplane mode/radios.

The original minor legacy-v1 blocked-open early-retry edge remains recorded in
the audio review backlog. No additional key or signing-setting operation is
proposed. All 90 setting metadata entries, existing public release and rollback
are retained. One new source/publication amendment is required before updating
the existing PR; see the [prepared plan](../superpowers/plans/2026-11-22-offline-startup-recovery-release.md).
