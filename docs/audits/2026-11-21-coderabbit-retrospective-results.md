# Bounded retrospective CodeRabbit results

Current handoff: the fixed wider review has now completed with all 60 paths.
Strict evidence covers all 703 changed post-bootstrap code/test histories at
the public tree, with zero remaining gaps. Its 64 observations and subsequent
local corrections are recorded in the [backfill register](2026-11-21-coderabbit-range-backfill-results.md).
The final 28-path correction review has since completed with four issues; its
dispositions and the subsequent Checkout correction are in that register.
The later 16-path and six-path follow-ups complete at `dfe4198` and `1c9a8f1`,
with zero issues in the final pass; see the [closure](2026-11-21-four-review-issues.md).
Historical pending language
below describes the checkpoints at which these original receipts were written.

Status: all five initial passes complete, with their 166 frozen selected paths
verified once each. CodeRabbit raised 46 issues (28 major, 18 minor), triaged
below. The 37-file correction review at `9712b16` then raises four major issues:
two Calendar questions are refuted and two audit defects are corrected locally.
The corrected range proof leaves a fixed 60-path wider backfill and one final
correction-delta request. Nothing is published. Selected-path completion alone
did not prove that every earlier change in those files had been reviewed.

The frozen source is `d7e30e022d825d9f26ed37bd6636f11bae1e8314`.
Fresh private authentication succeeds with the existing CodeRabbit account and
CLI 0.9.6. The previous Linux QA checkout contains unrelated test edits and is
preserved. A new Linux clone and independent worktrees retain the exact frozen
tree and local-only synthetic per-file baselines. No review refs are pushed.

| Initial cohort | Actual reviewed files | Issues raised | State |
| --- | ---: | ---: | --- |
| Accounts, Calendar and payments | 18 | 3 | Complete |
| Wellness and body | 48 | 25 | Complete |
| Business Planner | 25 | 4 | Complete |
| Operations/shared UI, first group | 70 | 14 | Complete |
| Operations/shared UI, second group | 5 | 0 | Complete |

Each completion has exit zero, a completed outcome, an exact reviewed-path list
and an issue count matching its NDJSON records. One local CLI preflight error
required an explicit base branch; it submitted no completed review and is not
counted. The included allowance is three reviews per rolling hour. Paid credits,
billing changes and new credentials are not enabled. The last two requests ran
only after the included allowance reopened, with no automatic review retry.

Issues are reviewer observations, not automatically confirmed defects. IDs below
use receipt order within each cohort. Raw receipts and exact path manifests are
retained in ignored `output/coderabbit-coverage/`; no private provider data is
included in this report. The correction checkout is
`codex/coderabbit-review-fixes`, based on the public source plus its local release
receipt. Reproductions first failed for confirmed cases; those local corrections
now pass focused checks. Browser acceptance, final consolidation and correction
review remain pending. Neither checkout is published.

## Accounts, Calendar and payments

| ID | Disposition | Evidence / intended correction |
| --- | --- | --- |
| A1 | Corrected locally | Cancellation compares two submission-time database reads, not the displayed block. Five added fixture cases reproduce stale time/owner/practice and missing-form-state admission. Bind the posted display state and recheck it under locks. |
| A2 | Refuted | The legal page and action both call `getRegistrationLegalAcceptanceSession`; the filtered ordinary session does not block acceptance. Existing RSC and session tests pass. |
| A3 | Corrected locally | Five inactive ownership states on an enabled free background incorrectly become permanent `owned` when a stale bridge remains. The surrounding 98 background checks pass. Keep free use separate from permanent ownership. |

## Wellness and body

| ID | Disposition | Evidence / intended correction |
| --- | --- | --- |
| W1 | Refuted | After a paired area is chosen, the parent recorder renders keyboard-operable Left/Right controls independently of WebGL. |
| W2 | Corrected locally | The stop transition adds `now - playbackStart` after a deferred hidden-tab frame. Preserve only the elapsed time actually displayed. |
| W3 | Corrected locally | More detail/Whole body remove their focused controls without handing focus to the persistent part selector. |
| W4 | Refuted | Successful deletion explicitly removes the ID from `exerciseEntries`, as well as timeline/report state. Old history-only entries use that same removal path. |
| W5 | Corrected locally | Resize clears `previousView`, taking the branch that resets held pose and elapsed playback. Refit independently of playback reset. |
| W6 | Refuted | `isValidMovementRecording` preserves legacy metadata without the new comfort/both marker. Existing normalization and ROM contracts pass. |
| W7 | Corrected locally | One shared pointer-down coordinate does not bind selection to a single-pointer gesture; reject multi-touch and cancelled gestures. |
| W8 | Corrected locally | Removing a region or clearing the selected list removes the focused button. Restore focus to a remaining Remove control or persistent selector. |
| W9 | Refuted | `createExerciseDraft` explicitly blanks every set/scalar measurement and reuses identity/units only. Existing exercise contracts pass. |
| W10 | Refuted | The entire badge expression is a ternary with a `null` false branch. A zero count therefore renders no badge, including while loading; it is not a bare `0 && ...` JSX child. |
| W11 | Corrected locally | Hidden movement-effect fields still enter non-Activity payloads as `unsure`. Serialize only fields applicable to the selected category. |
| W12 | Corrected locally | The direct save button bypasses native validity; out-of-range intensity is silently clamped. Validate applicable controls before dispatch, retaining blank and zero. |
| W13 | Corrected locally | Global Quick Log link/hash listeners bypass the existing pending-action ref. Keep the active recorder and its draft while a save settles. |
| W14 | Corrected locally | The custom branch lacks side controls and turns Center into Left. A new actual-recorder fixture cannot choose Center. |
| W15 | Corrected locally | The actual recorder retains a 20-degree starting value after switching sides. Reset both readings on context change; retain both after a failed save with unchanged context. |
| W16 | Refuted in supported parent | The Wellness hub is keyed by authenticated owner or anonymous identity. Sign-out replaces the instance and its open detail dialog; the 33 owner/Calendar checks pass. |
| W17 | Corrected locally | The retained opener can be inside the workspace hidden by All wellness tools. Restore to a visible launcher or the persistent default. |
| W18 | Corrected locally | Replacing one member of a three-finger gesture leaves a pinch baseline for the old pair. Rebase on a new pair and continue suppressing taps. |
| W19 | Refuted | `exerciseSessions` deduplicates by durable entry ID before adding a session. Overlapping save/history lists do not double-count a recording. |
| W20 | Refuted | The save adapter supplies feeling words in metadata, and the server persists normalized metadata without requiring summary text. Existing word-only normalization contracts pass. |
| W21 | Corrected locally | Adding optional comfort clears a captured phone baseline. The actual recorder fixture saves comfort without its captured angle. Preserve the baseline while angle recording remains enabled. |
| W22 | Corrected locally | Removing the selected word does not update `activePath`; derive the displayed selected context from current selections. |
| W23 | Refuted | Selected regions are transported as repeated FormData values and read as an array, preserving comma-bearing detail IDs. Existing surface/normalization contracts pass. |
| W24 | Refuted | `summarizeMovementComfort` uses `new Date(entry.occurredAt)`, accepting Date objects as well as timestamp strings. Existing pattern/comfort contracts pass. |
| W25 | Test strengthened locally | The source regex can cross into a later query's `take`. Assert the actual exercise query arguments or isolate its boundary. No oversized live query is demonstrated. |

## Business Planner

| ID | Disposition | Evidence / correction |
| --- | --- | --- |
| B1 | Refuted | Each storage read is inside `readPlannerReportSources`' try/catch and returns an unavailable-source result. The throwing-adapter checks pass without propagating. |
| B2 | Refuted | `text` preserves spaces, tabs and newlines. Character-by-character normalization of a multiword answer and practice name preserves every separator. |
| B3 | Refuted | Outline normalization uses the default infinite text limit, independently of the 12,000-character checklist answer cap. A 15,000-character note survives normalization and report generation; reports intentionally trim surrounding whitespace. |
| B4 | Corrected locally | Empty arrays are accepted as saved source rows, but these calculators synthesize zero-valued editable placeholder rows. Mark those report sources incomplete instead of representing a placeholder service/budget as a saved fact. Preserve Income Planner's genuine empty-expense semantics. |

## Operations and shared UI

| ID | Disposition | Evidence / intended correction |
| --- | --- | --- |
| O1 | Refuted | The pre-acceptance helper still invokes the same Auth.js JWT/session path, including session-version revocation. It bypasses only acceptance filtering; focused auth checks pass. |
| O2 | Duplicate/refuted | Same acceptance-resolver concern as A2; both consumers use the same intended helper. |
| O3 | Refuted | Unknown persisted Prices resolve to null and throw in the Portal selector. The configured legacy path is separate; focused Portal checks pass. |
| O4 | Corrected locally | The operation alarm is cleared before final reporting. Fake-signal and reporting-timeout fixtures reproduce the missing wall-clock bound/result persistence. |
| O5 | Runbook prepared locally | Invalid/orphaned pairs intentionally stop retention and remain preserved. The correction branch documents exact-file inventory, an approved task pause, private quarantine and complete-pair verification. No automatic deletion or NAS move is added. |
| O6 | Conditional workload follow-up | Near-limit archive scanning under a nearly exhausted export budget has not been measured on the NAS. No live workload failure is established; a future stress check needs its own bounded storage/IO plan. |
| O7 | Corrected locally | A failed final check-in replaces `DAILY_EXPORT_FAILED`. The new fake-export/notification test reproduces this loss of the primary error. |
| O8 | Corrected locally | Expiration during archive/receipt durability sync can still return a complete pair. Deterministic clock fixtures reproduce this; recheck the deadline during finalization/publication. |
| O9 | Runbook prepared locally | Standalone export and daily retention have different lock scopes. The supported daily operator remains the only writer; independent maintenance requires an approved task pause and proof no operator is active. No NAS change occurs. |
| O10 | Unsafe-removal concern refuted | The separate dead-code report retains opaque-source uncertainty. The cleanup register independently forbids removal from static candidates and requires class-specific proof, a reviewed plan and rollback (lines 112 and 334-338). A dependency-report clarity improvement remains optional; no removal is authorized. |
| O11 | Conditional portability | The tested backup image installs an amd64 age binary. Native arm64 support is not established by this NAS-specific setup; avoid claiming multi-platform support or downloading new binaries in this campaign. |
| O12 | Corrected locally | ConfigParser accepts spaces in a key before `=`, while libpq compares the original key literally. The added preflight fixture incorrectly reaches tools. Require compatible service syntax before starting tools. See the PostgreSQL implementation below. |
| O13 | Refuted | The synthetic isolation error serializes all three counters together, so a simultaneous media miss cannot hide the WebSocket counter. |
| O14 | Refuted in supported runner | Strict synthetic-media QA uses the inert production build with `next start`, not a development HMR server. Its zero-WebSocket contract is intentional. |

The libpq syntax check uses the primary
[PostgreSQL 18 service-file parser](https://github.com/postgres/postgres/blob/REL_18_STABLE/src/interfaces/libpq/fe-connect.c#L5680-L5784).

## Validation and remaining gate

The 46 initial observations resolve to 21 locally corrected behavior issues,
one strengthened query-bound test, two prepared operator-runbook clarifications,
20 refutations and two conditional workload/portability follow-ups. No initial
observation is left untriaged. The two conditional cases are finite backlog
items, not demonstrated failures on the current beta setup. Dependency advisory
maintenance is tracked separately and no package versions are changed.

The unchanged RSC session checks pass 10/10; focused auth/Portal checks pass
21/21; Wellness detail contracts pass 90/90; owner/Calendar checks pass 33/33.
Corrected cancellation checks pass 50/50, background contracts 103/103, actual
ROM component cases 4/4, body-scene cases 5/5 and feelings-wheel cases 3/3.
The backup suite runs 52 cases on each OS: Windows skips two POSIX/external-tool
cases and Linux skips only the optional external age fixture; all applicable
cases pass. Lint and TypeScript pass before the final browser additions; the
complete inert production build then passes with those additions. Ten native
Chromium scenarios pass across desktop and phone: body focus, a replaced
three-finger pinch pair, comfort/optional-angle flow, ordinary ROM recording and
sensor-baseline context changes. The fresh final lint pass succeeds, and the
Linux backup suite is repeated against the checkpoint's exact Python source.
Planner report/PDF checks pass 13/13 after the final application correction.
Its fresh build, TypeScript and lint succeed, as do six further native Planner
report/PDF scenarios on desktop and phone (16 native scenarios total).
These are fixture-only checks, with fictional files, inert subprocesses and
fake HTTP/Docker calls. These browser checks use fictional signed-out entries
and block external requests. The range backfill and final audit/correction review
remain pending. No live
record, provider, payment, email, NAS or deployment operation occurs.

## Correction review and amended coverage gate

The actual 37-file review at `9712b16` completes with exactly its expected path
set, zero exit and four major issues. Its receipt is retained separately in
ignored `output/coderabbit-corrections/`. Do not label it a zero-issue review.

| ID | Disposition | Evidence / correction |
| --- | --- | --- |
| C1 | Refuted in supported writers | Personal creation writes the event and block in one transaction. Rescheduling updates both intervals under the same transaction/locks. Google sync reads the owned event and updates external links, not its local interval. The direct edits in its gated acceptance worker affect synthetic fixtures without blocks. |
| C2 | Corrected locally; final review pending | Required diff reads now throw. Ancestry status 1 is a valid non-ancestor; command/launch errors stop enumeration. Real-Git fixtures prove a readable head with a missing parent cannot become an empty diff. All 76 actual PR diffs still read successfully. |
| C3 | Confirmed and corrected locally; wider proof pending | A matching reviewed head did not prove earlier code in that receipt's base was reviewed. The audit now follows completed `base..head` content transitions from the inherited pre-change baseline. It and an independent implementation agree on all 60 remaining unproven histories. |
| C4 | Refuted | Availability submits `expectedStartsAt`, `expectedEndsAt`, `expectedOwnerUserId` and `expectedPracticeId`. Dates use ISO strings accepted by the action; owner/practice fields match the displayed block. |

The corrected inventory verifies 643 of 703 changed code/test histories and
leaves exactly 60 (30 runtime/configuration, 30 tests). Fifty-one had been
overstated by the old blob-only rule; nine selected in the first five passes
need a wider baseline. These are missing proof, not 60 demonstrated code bugs.
The 1,021 untouched inherited paths remain a separate baseline. The old 537/166
inventory is historical and cannot be presented as complete range coverage.

The [finite range-proof plan](../superpowers/plans/2026-11-21-coderabbit-range-proof.md)
freezes one 60-file request at the public tree and one final correction-delta
request, using included allowance only. Original manifests/receipts are kept.
No automatic retry, whole-codebase rewrite or provider/NAS/publication change
is added. Real-Git and incremental-range regression checks pass; raw receipt
admission verifies the actual outcome, manifest, Git diff and frozen tree.
