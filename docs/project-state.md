# AtmoShaper Project State

Verified: 2026-09-22

This is the read-first source of truth for the fresh AtmoShaper repository. Use it before `docs/project-log.md`, roadmaps, TODO files, audits, plans, or wiki pages when deciding what is active now.

## Current Snapshot — Phase 6 Final Integration Candidate

- Task 8's bounded record correction is published on open, unmerged
  [PR #13](https://github.com/dsbowersock/atmoshaper/pull/13) at
  `5345c7cc2f413e4dfd33def15bff5c8e99151243`. Both hosted reviewers
  completed clean exact-head coverage, all seven strict CI jobs in
  `35768851810` passed, and no actionable thread remains. Task 9 has started
  only in the approved isolated worktree on
  `codex/phase6-09-integration-closeout`; no final integration PR exists yet.
  Source equivalence, independent Task 9 review and its own hosted gates remain
  pending. Original PR #5 remains open and unmerged as the recovery source;
  the separate Linux Atmosphere snapshot-refresh decision is still pending.

- Task 7 is complete for its own slice at
  `995fc4f7ce44902002ef2b36c7af1195dbdcb562` on open, unmerged
  [PR #12](https://github.com/dsbowersock/atmoshaper/pull/12). Independent SPEC
  then QUALITY approved the final amendment; Codex and CodeRabbit completed
  clean on that exact head; all seven jobs in strict CI `35578132889` passed;
  and all four prior inline threads are resolved or outdated. No merge occurred.
- Task 8 is published as open, unmerged
  [PR #13](https://github.com/dsbowersock/atmoshaper/pull/13), stacked on that
  exact Task 7 head. Its initial `4ef561c75125ea3875da236759c10617cfdc8bb1`
  head contained 20 files and passed independent SPEC then QUALITY before
  publication. Both hosted reviewers completed on that exact head. Codex found
  a credential-sign-in legal-gate bypass and this stale state checkpoint;
  CodeRabbit found an ambiguous source-exact count in the chronological log.
- The pre-CI legal/session candidate had 33 paths: 12 implementation/test paths
  still
  match recovery source `7e318558da425b8fcdddeb8df50e93a36900310a`
  byte for byte, 16 paths are explicit repairs, and README, this state, the
  project log, delivery plan and generated brand receipt remain
  coordinator-owned records. The original test/wiki repair keeps the operator
  environment value synchronized with the exported digital-purchase version.
  The first login/test repair routes successful email/password sign-ins through
  the same current Terms/Privacy page as Google while preserving safe callbacks.
  Independent QUALITY then proved that navigation was not authoritative because
  the session already existed. The shared server-session owner now fails closed
  until current registration documents are accepted, while a narrow raw loader
  remains available only to the legal acceptance page/action. The public
  `/api/auth/session` GET and POST owners apply the same predicate, return `null` for
  stale or unavailable evidence while preserving Auth.js response metadata,
  and leave non-session handlers and the narrow legal loader unchanged.
- Current legal values are `2026-09-legal-v3`,
  `2026-09-digital-purchases-v3`, `September 14, 2026` and
  `Derrick Bowersock, doing business as AtmoShaper`. The current legal pages,
  sidebar/license presentation and legal sitemap revision dates move together.
  Canonical `massagelab.app` URLs, provider identifiers and stable Stripe
  metadata remain compatibility facts.
- Test-first redistribution produced eight expected failures against the old v2
  code, then passed the archive verifier 9/9, the focused legal/SEO/checkout
  suite 85/85, the post-ordering SEO regression 12/12, focused ESLint and diff
  checks. QUALITY then found that the base and recovery source both retained a
  stale v2 operator-wiki literal. A new focused test failed on that mismatch,
  passed after the one-value v3 repair, and the updated focused suite passed
  86/86.
- The immutable v2 archive hashes remain
  `8c7263b53697495f096f479484b6ccd7eae574f20111ecf0e0a44f7fd50017aa`
  and `bdb76adf941e4e22022765734650d7e1224486d282d8303fa5869ee4fc25a4c8`.
  `lib/legal-acceptance.js`, Prisma, existing acceptance rows/IDs, audit,
  product browser owners, public/media bytes and provider state remain unchanged.
  The focused coexistence test proves an old v2 row does not satisfy v3 and is
  retained unchanged when a genuine v3 acceptance is recorded.
- Fresh provider-free validation of the final candidate passed Prisma
  validate/generate, typecheck, full lint, the 4,736-test Node suite with 4,733
  passes and three skips, production and Browser-QA builds with 115 pages, and
  the existing anonymous-registration legal-gate smoke on desktop and mobile
  Chromium. The authoritative session repair followed two focused red/green
  cycles and its combined legal/auth/readiness slice passes 142/142. The full
  suite exposed one stale dev-clock implementation assertion; that companion
  failed before correction and now passes 7/7 against the new named boundary.
  The public-session handler repair passes its affected 78-test suite. Initial
  head CI `35591116189` then exposed a real-time race in the otherwise fixed
  Anatomime clock helper: both lane-1 attempts tried to pause at an instant that
  had already passed. The helper now installs one minute before the unchanged
  deterministic phase and pauses at that phase; the exact browser case passed
  three serial runs. Final QUALITY then proved the first extracted-owner test
  could not falsify the old equal-target helper because its virtual clock modeled
  no install latency. The strengthened contract advances a deterministic 25 ms,
  requires the install instant to be strictly earlier, and rejects an extracted
  equal-target mutation; it and the dev-clock contracts pass 12/12.
  Archive 9/9, repository audit 28/28 and diff checks are clean. The strict
  brand receipt reaches a fixed point with zero missing, unclassified or
  category mismatches; its exact hash is pinned in the frozen review evidence.
  No snapshot changed.
- The pre-CI 33-file package and 19-file amendment passed independent SPEC then
  separate QUALITY on one frozen byte set. Exact staged identity produced and
  pushed product amendment `2ab6382d2e944b75e8eb0e76808870f205d21736`, then
  durable record synchronization `ecf30584cf689edca4bfe2566e1d9a795253fd29`,
  to PR #13. Both hosted reviewers completed clean coverage of the synchronized
  head, but strict CI `35621507294` exposed a Browser-QA fixture recurrence:
  synthetic users lacked current registration acceptances, provider-free JWTs
  did not project server-rendered account ownership, and service workers could
  bypass context routing on reload.
- The bounded repair keeps the legal gate intact. Authorized connected fixtures
  atomically create current Terms and Privacy acceptance rows, verify exact
  ownership before cleanup, and delete the restricted rows and owned user in one
  rollback-safe transaction. Provider-free tests own only context-local session
  and account-bootstrap projections, preserve owner switching, and keep the
  connected `Open account cart` assertion unchanged. That 40-path repair was
  published as `26c76ada77c7d3977af666942101b6e5018e15f3`. Codex completed clean
  exact-head review and strict CI `35638346707` passed quality, build, all four
  browser lanes and aggregate QA. CodeRabbit reviewed the exact 12-file
  amendment and found two valid fixture-contract gaps, so those green checks are
  historical rather than final: the provider-free Auth.js response omitted its
  required expiry, and the same-origin HTML route rejected standalone documents
  that correctly contain zero shared-layout account-bootstrap markers.
- The bounded follow-up changes only the signed-in cookie/session fixtures and
  their executable contract owner. Zero markers now pass through unchanged,
  one marker is still
  projected, duplicates still fail closed, and provider-free sessions carry a
  future ISO expiry. RED reproduced both hosted defects. Independent QUALITY
  then proved the expiry oracle accepted short or already-expired mutations and
  the broad session glob fulfilled foreign origins. The repaired actual-owner
  contracts enforce the exact one-hour lifetime, reject a short-lifetime
  mutation, fulfill only the configured origin and fall back for foreign
  origins. A later QUALITY review proved the cookie and provider-free fixtures
  still owned separate lifetime literals, invalidating v12 before staging. The
  cookie fixture now exports the sole canonical one-hour constant used by both
  paths, and a canonical-owner mutation proves the consumer cannot silently
  drift. Although frozen v13 passed SPEC, separate QUALITY proved its harness
  dropped the real import and manually injected the lifetime, so replacing the
  import with a new local owner could remain falsely green. That freeze was
  invalidated before staging. The repaired executable oracle uses TypeScript
  AST evidence to require the exact unaliased canonical import and rejects a
  local replacement before controlled injection. Frozen v14 then passed SPEC,
  but separate QUALITY proved that whole-clause and inline type-only imports
  still produced the accepted tuple despite owning no runtime binding. Root
  reproduced both forms and invalidated v14 before staging. The repaired guard
  now requires a non-type-only clause, non-type-only specifier and literal
  unaliased binding; strict negative mutations cover both TypeScript forms.
  Frozen v15 then passed SPEC, but separate QUALITY showed the canonical
  mutation proved only “not one hour”: a consumer clamp to 120 seconds still
  passed after a 60-second owner mutation. Root reproduced the false positive
  and invalidated v15 before staging. The v16 parameterized timing oracle kept
  the independent one-hour positive bound, required a 60-second mutation to
  match the observed cookie lifetime exactly and rejected a real-source
  120-second clamp. Frozen v16 passed SPEC, but separate QUALITY proved the two
  selected values and handler-duration window still admitted a nonlinear
  3,600-second cap and a five-millisecond consumer offset. Root reproduced both
  actual-source counterexamples and invalidated v16 before staging. The repaired
  controlled compiler injects a deterministic `Date`, asserts the exact ISO
  expiry at 17, 60, 3,600 and 7,200 seconds, rejects both mutation families and
  retains a shape-only real-clock integration check. Frozen v17 passed
  independent SPEC then QUALITY and was published as
  `fd7d6124b57177a5f2266af8af82fb0561aba332`. Both hosted reviewers completed
  exact-head review and each found one valid follow-up. The matching-email
  Google-linking flow could prove credentials and then receive the legal gate's
  `AUTHENTICATION_REQUIRED` response without routing to current registration
  acceptance. The real-clock oracle compared separately sampled wall-clock
  bounds and could false-fail if the clock moved backward.
- Strict RED reproduced both hosted findings. The bounded local repair routes
  only that exact 401/code pair through the canonical legal-acceptance builder,
  keeps the cookie-bound linking intent intact, and leaves other errors on the
  existing recovery path. Its provider-free form harness executes the real
  submit flow and proves the canonical `/account/link-google` callback. The
  real-clock integration now proves successful invocation and canonical ISO
  shape only; fixed-clock tests retain exact one-hour identity and the 17, 60,
  3,600 and 7,200-second mutation probes. Focused fixture/database contracts
  pass 78/78, legal/interaction contracts pass 24/24, and the full Node suite
  passes 4,754 total with 4,751 passes, three host-dependent skips and zero
  failures; typecheck, lint and diff checks pass.
- Superseded strict CI `35668571160` passed code quality, build and all browser
  test bodies (lane 3: 152 passed, 42 skipped), but lane 3 diagnostics upload
  received a GitHub artifact-intermediary 403 and aggregate QA therefore failed.
  No superseded-head rerun is warranted; the repaired head receives fresh CI.
- Frozen v18 passed independent SPEC, but separate QUALITY proved the
  positive-only real-form legal-routing test admitted an `&&` to `||`
  mutation. Root independently reproduced the false-pass 1/1 and restored the
  production blob before editing. The test-only recurrence repair now checks
  401 + `PROOF_EXPIRED` and 403 + `AUTHENTICATION_REQUIRED`: both must call
  existing confirmation recovery with the exact pair and produce zero legal
  callbacks, pushes or refreshes. The controlled `||` mutation now fails
  0/1. Account-security passes 20/20, legal/interaction passes 24/24, and the
  clean full Node suite passes 4,755 total with 4,752 passes, three
  host-dependent skips and zero failures.
- The published v21 candidate contains 43 paths: 12 recovery-exact, 26 repairs
  and five records. It was published as `22eb0ef690b354317a74a74bf0318aa6c6f2a733`; CodeRabbit completed product review,
  Codex found only its then-current record issue, and all seven strict CI jobs passed. The post-v21 OAuth amendment is published as `7ad60de8519e4a1d4bcc0bd892583b0c54d80186`;
  it switches public Google callbacks to the acceptance-filtered session identity while keeping raw access in the legal gate. Current status for the latest PR #13 head is delegated to GitHub and the ignored review handoff;
  its hosted-review and strict-CI gates passed on `5345c7cc2f413e4dfd33def15bff5c8e99151243`
  before Task 9 started. Combined-source equivalence and the separate Linux
  Atmosphere snapshot decision remain pending.
- Frozen v19 passed independent SPEC, but separate QUALITY proved the two
  mismatched pairs still did not lock exact response-code value and shape.
  Prefix matching accepted `AUTHENTICATION_REQUIRED_LATER`; string coercion
  accepted `["AUTHENTICATION_REQUIRED"]`. Root independently reproduced the
  coercion false-pass 1/1 and restored the production blob before editing.
  The test-only matrix now also covers near-match, case-changed and
  whitespace-padded strings plus null, array and object values. Every case
  requires exact confirmation-recovery arguments and zero legal callback,
  navigation or refresh. Controlled prefix and coercion mutations both fail
  0/1; the production form remains byte-identical. Re-freeze these exact bytes
  as v20 and repeat SPEC then QUALITY before staging.
- Frozen v20 passed independent SPEC, but separate QUALITY proved the corpus
  omitted missing code, a fullwidth Unicode lookalike and rejected JSON.
  Actual-source mutations accepting undefined, NFKC-normalizing strings or
  defaulting rejected JSON to `AUTHENTICATION_REQUIRED` preserved all v20
  assertions. Root independently reproduced the JSON-fallback false-pass 2/2
  and restored the production blob. The test-only corpus now adds those three
  cases plus string status `"401"`; every negative requires exact recovery
  arguments and zero legal callback/navigation/refresh. Controlled undefined,
  NFKC and JSON-fallback mutations each fail 0/1 and restore exactly. Frozen v21
  passed independent SPEC then separate QUALITY, retained the 43-path
  classification, and was published as `22eb0ef690b354317a74a74bf0318aa6c6f2a733`.
- Original PR #5 and replacements #6–#13 remain open and unmerged. No provider,
  billing, deployment, database, domain/DNS, PNG, frame, threshold, media-byte
  or production action occurred.

## Historical Snapshot — Phase 6 Background Catalog and Controls

- Renderer PR #11 is verified at `04e3868e3ab39111e50b6c8cdc7d5a89bc7b60e2`:
  Codex completed clean at 03:04 UTC and CodeRabbit at 03:05 UTC on September 21.
  Both prior threads are resolved; all seven jobs in CI `35556031421` passed,
  including the repaired Anatomime cadence case. No merge occurred.
- Task 7 of the [delivery plan](superpowers/plans/2026-09-20-phase6-review-sized-prs.md)
  is published as [PR #12](https://github.com/dsbowersock/atmoshaper/pull/12) at
  `03d7762d38b46dc73d1dbd149b911508be0359d8` on
  `codex/phase6-07-background-catalog` in the same approved
  isolated worktree, based on that exact reviewed head. It carries background
  catalog/control labels, optional-only globe-marker presentation and the
  source-approved portrait tray repair with paired tests.
- The initial head passed all seven jobs in CI `35566555008`. Codex completed
  at 06:02 UTC and CodeRabbit at 06:08 UTC on September 21, with five verified
  findings in total: nine license attributions coupled to presentation identity,
  72 stale preview labels, a free-background test masked by the reset path,
  three stale current collision notes and ambiguous initial file-count wording.
  The first repair batch passed independent SPEC then QUALITY and was published
  as `03d7762`. Its full unit suite passed 4,726 with three skips; all seven jobs
  in strict CI `35571083634` passed. Codex completed clean at 07:13 UTC, but
  CodeRabbit reported one remaining current-note naming mismatch. Root verified
  six stale references across four audit batches, including the reported example.
  A bounded data/generated-prose/test amendment has 107 focused passes and awaits
  independent review. SPEC verified the data but found a false pass when a
  retired name contains a current name. The scoped occurrence-span repair passes
  all 16 audit tests and awaits SPEC re-review, then separate QUALITY.
  The old regression covered only three grid notes; its
  replacement covers all 84 notes and all seven generated batches, preserving
  historical aliases and valid longer names.
  Scope stays 35 files. Independent SPEC then QUALITY and both new exact-head
  hosted reviews/CI remain required; no runtime or media change is involved.
- Ownership covers 30 source paths, of which three browser companions were
  already recovery-exact in the reviewed base. Bounded inherited browser-test
  repairs and their three companions bring planned scope to 35 files. Stable IDs,
  entitlements, purchase references, user-marker controls, media bytes and all
  earlier Sentry/admin/browser-clock repairs remain protected.
- Source transfer passed 344 focused checks; the pre-repair full unit suite
  passed 4,718 with three skips and zero failures. Typecheck, lint and the
  provider-free production build passed; all 32 commerce browser cases passed.
  All 18 carousel cases pass and the ten original control-lab failures are
  repaired. An intermediate full rerun exposed four missing, intentionally untracked
  preview videos in its strict console case. Diagnosis confirms a transient
  initial video request before reduced-motion state settles; that unchanged
  runtime behavior remains unresolved. An exact provider-free fixture amendment
  retains unfiltered console checks and records initial request counts, without
  claiming zero-fetch mount behavior or fixing the runtime race.
  Palette inventory, unsupported-adapter and effective-mode checks are repaired
  (77 focused checks pass). All six focused palette browser cases now pass,
  including all 84 backgrounds in three requested modes on desktop and mobile.
  Unsupported Harmony correctly preserves Source at the renderer boundary,
  separately from raw gallery role diagnostics. All 38 final carousel/control
  cases now pass with the exact fixture; each project records one initial hit
  per known URL and zero additional hits after reduced motion settles. Final
  focused contracts pass 108/108; typecheck, lint and nine archive checks pass.
  No runtime or media change is part of the validation repairs.
- This replacement preserves recovered lab behavior, not a new design:
  Selected/Select remains the lab acquisition trigger and surrounding Station
  previews remain square. Historical Unlock/193-pixel product records conflict
  with these owners; this slice records but does not settle that design debt.
- Independent SPEC passed the first frozen candidate. Final full-unit validation
  then returned 4,722 passes, three skips and one failure: the unchanged sitewide
  source contract still requires the retired fixed-count palette token. A bounded
  companion amendment now guards the registry-owned exhaustive sweep; no browser
  or runtime change was needed. The v2 full suite passed 4,723 tests with three
  skips and zero failures. Independent QUALITY then identified a gap in that
  companion: a mode loop could count cases without asserting their behavior.
  Root verified the finding before a same-file repair. All 126 final focused
  checks and changed-file lint pass; removal, out-of-loop placement and commented
  assertion mutations now fail closed alongside the ID/fixed-count controls.
  The existing comment masker closes the scoped SPEC finding without changing
  the browser or adding a parser. The broad result covers
  v2; the final guard-only amendment has focused verification, with unchanged
  browser/runtime hashes. Scoped SPEC and QUALITY approved that final guard;
  staged audit and initial publication are complete. The audit-note recurrence
  amendment now requires its own validation and review gates. Tasks 8-9, combined-source reconciliation and the
  separate Linux Atmosphere snapshot-refresh decision remain pending.
- Original PR #5 and replacements #6-#12 remain open and unmerged. No PNG,
  frame, threshold, provider, billing, deployment or legal-version changes.

## Historical Snapshot — Phase 6 Background Renderer Slice

- Account/service PR #10 is verified at `3e29e6e696131450820e8b70cc195d6bf5849f8a`:
  Codex and CodeRabbit completed clean on the exact head, its prior thread is
  resolved, and all seven jobs in CI `35545694616` passed. Nothing was merged.
- Task 6 of the existing delivery plan is published as
  [PR #11](https://github.com/dsbowersock/atmoshaper/pull/11) on
  `codex/phase6-06-background-renderers` in the approved isolated worktree.
  It carries 59 recovery-exact renderer prose/diagnostic files and one partial
  shared test companion. The globe-marker retirement stays with the next
  catalog slice and its descriptions/tests, preserving coherent ownership.
- Repair scope is 67 files: 59 renderer files, the shared renderer test,
  verified-date companion, Anatomime browser-clock repair and its regression,
  plus four delivery/audit records. Initial publication had 64 files; the date
  amendment raised it to 65. The CI amendment adds two test-only paths. Existing
  shader, animation, lifecycle, identifiers, catalog, legal and provider
  boundaries stay unchanged. Prior Sentry and immutable admin replay repairs
  remain authoritative, including their deliberate compatibility-era copy.
- All 59 renderer files match recovery exactly. Local checks passed: 153
  focused tests, typecheck, lint, strict audit/inventory, and the full unit
  suite (4,711 passed, three skipped, zero failures; 4,714 total).
- The initial 64-file candidate passed independent SPEC then QUALITY, including
  the stale-status documentation correction. Both hosted reviewers completed
  on initial head `6d92e6daa073be40db6f61e26c7ac8958b1ab0f1` and raised record-only
  findings: align the verification date and test ceiling with this September 21
  UTC checkpoint, and explicitly retain globe-marker ownership in Task 7.
  This amendment addresses both without changing renderer behavior or assertions.
- Each amendment must pass scoped SPEC then QUALITY before publication.
  Head `3857f13d6b3c241061960f2d1d1f0740f4978166` has clean exact-head Codex
  review, but CI `35552471156` failed one Anatomime polling test on both attempts.
  Quality, build and the other three browser lanes passed. The test held a
  response while its late clock pause advanced past the real request deadline;
  a controlled actual-helper browser reproduction confirms that mechanism.
  The bounded repair freezes the test clock before the tested request, preserves all
  production deadlines/assertions and adds a falsifying regression. No renderer
  or application behavior changes. All 42 Anatomime browser cases pass across
  desktop/mobile; the cadence case also passes both with a temporary 2.1-second
  observation delay, removed afterward. Focused checks pass 108/108, along with
  typecheck, changed-file lint and strict audit/inventory. Independent SPEC then
  QUALITY precedes push; the eventual head needs both hosted reviews and strict
  CI. CodeRabbit's full coverage still belongs to the initial head.
  The final combined-source ledger and separate Linux Atmosphere
  snapshot-refresh approval remain incomplete.
- Original PR #5 and all published replacements remain recovery references,
  open and unmerged. No snapshot, provider, billing or deployment change is
  authorized by this slice.

## Historical Snapshot — Phase 6 Account and Service Slice

- [Public-content PR #9](https://github.com/dsbowersock/atmoshaper/pull/9) is
  verified at `9f2afb41854a6600a2c94f0c416d0531c6b16e0a`, stacked on
  `f8c14f1812918b67051760669c4ccf07b5860ba7`. Codex completed clean at
  21:28 UTC and CodeRabbit completed clean at 22:16 UTC. Both prior inline
  threads are resolved; all seven jobs in CI `35538608085` passed.
- The approved isolated checkout now assembles the next account/service slice
  on `codex/phase6-05-account-service` from that exact reviewed head. Original
  PR #5 and published replacements #6–#9 remain recovery references, unmerged.
- Task 5 of the [delivery plan](superpowers/plans/2026-09-20-phase6-review-sized-prs.md)
  carries account, security-message and local-first presentation with direct
  tests, including existing private-account browser settlement repairs. It
  preserves authentication, billing, provider, persistence and PHI boundaries.
- The stable Sentry event correction and exact audit-classification/verification
  repairs remain authoritative. Do not restore their source defects while
  copying account files. Earlier pilot, homepage and audio fixes also stay intact.
- An offline actual-route check found the recovery source also renames the
  synthetic Sentry debug event. Keep that route at its reviewed-base bytes and
  correct its paired static privacy expectation and add focused flag/event-identity
  coverage; these two additional source divergences follow
  the existing no-operational-event-rename contract, not a provider change.
- Independent QUALITY found a historical admin-operation replay regression in
  five source-copy producers despite a passing initial full unit suite. Root
  confirmed both upgrade and rollback failures with in-memory actual-code
  fixtures. Preserve the established immutable bundle templates and strict
  equality validator; add producer-owned replay and corruption controls.
  These administrative notifications retain compatibility-era copy until a
  separately planned versioned migration. No database/provider was touched.
- The repaired 53-file slice passed independent specification then quality
  review on tree `65db8418bbca2c7ee134c5d7684af9fc68f61529`. Full provider-free
  unit verification passed: 4,710 tests, three skipped, zero failures (4,713
  total); 662 focused checks, typecheck, lint and 146 coordinator audit/document/
  archive/workload checks also passed. Root and quality review both reproduced
  successful upgrade and rollback replay without changing stored state.
- Forty source-owned files equal recovery exactly; twenty protected paths equal
  the reviewed base. The intermediate audit receipt is a generated fixed point
  with zero missing, unclassified or category-mismatched entries, using 48 exact
  compatibility rules. Inventory reports no forbidden paths.
- [Account/service PR #10](https://github.com/dsbowersock/atmoshaper/pull/10) is
  published at `487fd7bfa8e8c000d13743d13fbeba99eadf9cf8`, stacked on PR #9.
  Codex completed clean on that head at 23:32 UTC. CodeRabbit reviewed all 53
  files and found one valid documentation ambiguity: the 49-path ownership
  manifest and superseded pre-amendment counts were not clearly distinguished
  from the final 53-file change scope. The plan now defines and reconciles them;
  no source, test or classification-policy change is needed. CI is still running.
- This documentation-only repair needs independent SPEC then QUALITY, strict
  receipt verification, and renewed exact-head hosted reviews and CI after push.
  It is not hosted approval or merge readiness. The whole-sequence
  source ledger and separate Linux Atmosphere snapshot approval remain incomplete.
- No PNG, frame, tolerance, provider, billing, deployment or merge changes are
  authorized by this work. Current legal versions and dates remain unchanged.

## Historical Snapshot — Phase 6 Public Routes and Content Slice

- The 46-file [Atmosphere audio PR #8](https://github.com/dsbowersock/atmoshaper/pull/8)
  is verified at `f8c14f1812918b67051760669c4ccf07b5860ba7`, stacked on
  `06f3147ab3ffb7dc319ad93666dc0f3d7605d238`. Codex completed clean at 18:29 UTC;
  CodeRabbit reviewed all 46 files and completed without actionable findings at
  18:33 UTC. No review threads remain. Fresh hosted evidence confirms CI
  `35529020277` passed quality, build, all four browser lanes and aggregate QA.
- The 67-file [public-content PR #9](https://github.com/dsbowersock/atmoshaper/pull/9)
  is published at `b6645013086635cc1287725d0ea0d3678f4b6071` against that exact
  audio head. The approved isolated checkout remains on
  `codex/phase6-04-public-content`. Original PR #5 and published replacements
  #6-#8 remain unchanged and unmerged.
- This slice carries source-approved public page, support, social, membership,
  cart and education display copy with producer-owned tests. It preserves
  endpoints, social handles, support addresses, Google calendar names, source
  attribution, stable anatomy IDs, Stripe identity and entitlement behavior.
- The [delivery plan](superpowers/plans/2026-09-20-phase6-review-sized-prs.md)
  names all shared-file boundaries. Private account settlement stays with its
  later owner; current legal dates/versions and the verified documentation date
  ceiling are preserved. Earlier pilot and homepage repairs remain intact.
- At initial publication, 55 full-source files matched recovery
  `7e31855` exactly, and four shared test files contain only their assigned
  companion changes. Independent specification then quality review passed with
  no implementation findings; earlier pilot and homepage repairs are preserved.
- Fresh verification on frozen tree `560521bd2f2c1220086240b46b19c7449ec9ee95`
  passed the full unit suite: 4,661 passed, three skipped, zero failures (4,664
  total), plus 247 focused regressions, typecheck, lint and 25 documentation/
  archive checks. The intermediate brand receipt has zero missing/unclassified
  entries and inventory reports no forbidden paths. Between that tested candidate
  and initial publication, only delivery receipts and generated offsets changed.
- Hosted reviews completed with two verified findings: retain the stable Sentry
  problem-report event name, and classify retained Stripe assertions as exact
  compatibility occurrences. The bounded repair restores that event identity
  and promotes only the necessary exact-occurrence audit API with five fresh
  rules. The source event-name defect is corrected, not preserved for equivalence.
  Its three intentional source divergences and early audit API promotion must
  remain explicit in the final combined-source reconciliation.
- The audit generator, not only its generated receipt, must retain the corrected
  classification without hiding neighboring public copy. Fresh focused checks
  pass 91/91; the coordinator's focused/archive run passes 100/100. Independent SPEC then
  QUALITY and strict validation precede a repair push. Both hosted reviewers
  must subsequently cover the new exact head without actionable findings.
- Initial-head CI `35533833313` passed quality, build, all four browser lanes
  and aggregate QA, verified at 20:15 UTC. This is not repair-head evidence.
  Earlier PR coverage does not cover this slice or its repair.
- Round 1 repair head `b664501` passed all seven jobs in CI `35535560095`, and
  Codex completed clean on that exact head at 20:31 UTC. CodeRabbit completed
  its incremental review at 21:07 UTC with a new outside-diff audit finding:
  identity-matched baseline entries can retain stale categories after valid
  policy edits. This is not clean CodeRabbit coverage or slice completion.
- The reproduced gap is in the shared verifier, not candidate generation.
  Round 2 must compare matched categories against the existing classifier,
  report sanitized mismatches, and fail normal audit mode. Strict new-reference
  rejection, informational removals and existing classification precedence stay
  intact. The repair requires independent SPEC then QUALITY, local verification,
  and fresh exact-head hosted reviews and CI before the account slice starts.
- Round 2's three-file implementation passed 28 audit tests and 64 focused
  compatibility regressions; a coordinator run passed 101 focused/archive
  checks and 25 delivery-document/archive checks. Typecheck and changed-file
  lint passed. Independent review and repair publication remain pending;
  these local results do not establish new hosted coverage.
- The final combined-source equivalence and separate Linux Atmosphere snapshot
  decision remain whole-sequence gates. No PNG, frame, threshold, provider,
  billing, deployment or merge changes are authorized by this slice.

## Historical Snapshot — Phase 6 Atmosphere Audio Slice

- The 24-file [identity PR #7](https://github.com/dsbowersock/atmoshaper/pull/7)
  is verified at `06f3147ab3ffb7dc319ad93666dc0f3d7605d238`, stacked on pilot
  `96d94b1b0d779b998df01d07cfaec0198857d51d`. Codex completed clean at 17:25 UTC;
  CodeRabbit reviewed all 24 files and completed without actionable findings at
  17:31 UTC. No review threads remain. Fresh 17:45 UTC evidence confirms CI
  `35525692042` passed quality, build, all four browser lanes and aggregate QA.
- The approved isolated worktree now assembles the next delivery-plan owner,
  Atmosphere audio, on `codex/phase6-03-atmosphere-audio` from that exact head.
  Original PR #5 and published PRs #6–#7 remain intact and unmerged.
- This slice carries the source-approved feature labels, public error/title
  presentation, Drone display label, stable artwork identity, carousel-resume
  repair and matching audio/browser contracts. Stored identifiers, media/source
  records, playback kinds, external endpoints and legal records remain unchanged.
- All 35 audio-owned files match the recovery source exactly. Fresh local checks
  pass 227 focused audio/navigation/document/archive cases, typecheck and lint.
  The frozen first candidate passed the full unit suite: 4,659 passed, three
  skipped, zero failures (4,662 total). SPEC review found one missed paired
  About navigation assertion, which must travel with its changed label owner.
- The one-line source correction passed repeated independent SPEC then QUALITY
  review. Fresh affected browser-harness/navigation/document/audit checks pass
  132/132, with typecheck and a byte-stable brand receipt containing zero missing
  or unclassified entries. Independent quality checks pass 62/62 and confirm
  byte-identical artwork for all 58 visible stations against this slice's base.
- The 46-file candidate is locally verified; publication and its own exact-head
  hosted reviews and strict CI remain required. Shared files carry only current
  producer-owned hunks; public/account/background/legal/integration work remains
  with later owners. Earlier-slice hosted evidence does not cover this delta.
- The separate Linux Atmosphere snapshot decision and final combined-source
  equivalence remain whole-sequence gates. No PNG, threshold, frame, provider,
  billing, deployment or merge changes are authorized by this slice.

## Historical Snapshot — Phase 6 Product Identity Slice

- The 15-file [archive pilot PR #6](https://github.com/dsbowersock/atmoshaper/pull/6)
  passed both hosted reviewers on exact head
  `96d94b1b0d779b998df01d07cfaec0198857d51d`. Codex completed clean at
  15:53 UTC; CodeRabbit completed its full-source plus repair-delta review at
  16:02 UTC with no actionable comments. All four review threads are resolved.
  Fresh hosted evidence at 16:20 UTC confirms CI run `35520831495` completed
  successfully, including all four browser lanes and aggregate `qa`.
- The next [delivery-plan](superpowers/plans/2026-09-20-phase6-review-sized-prs.md)
  slice is product identity and shell, stacked from that pilot head on
  `codex/phase6-02-product-identity`. The approved isolated checkout is reused;
  the pilot branch and original PR #5 recovery source remain intact and unmerged.
- This slice carries the approved AtmoShaper identity, responsive text/temporary
  mark/hidden brand states, homepage, metadata with no unapproved social image,
  offline copy and matching contracts. It preserves canonical endpoints, icon
  assets, routes, private identifiers, cache keys and the existing legal registry.
  Secondary pages, audio labels, account copy, legal versions and final integration
  remain later slices; this is not a claim that the whole rebrand is complete.
- Local quality review found the new homepage text exceeding its hero column
  with an expanded desktop sidebar. The heading now sizes to that column at
  large widths, retaining its existing maximum size and layout without clipping.
  A focused provider-free regression checks 23 viewport/sidebar combinations
  and proves the old viewport-only sizing overflows at both reproduced widths.
- Fresh coordinator checks pass all 89 focused identity/SEO/PWA/layout cases.
  A separate zero-network check with the actual locally bundled Inter font also
  verifies text bounds at 768, 1023, 1024, 1025, 1100 and 1280px. The first full
  suite found one omitted paired Roadmap metadata assertion; only that exact
  source assertion is now included, while later Roadmap page copy stays deferred.
- The repaired 24-file candidate passed repeated independent SPEC then QUALITY
  review and fresh full unit verification: 4,635 passed, three skipped, zero
  failures (4,638 total). Coordinator typecheck, lint, 15 documentation checks
  and nine immutable-archive checks also passed. The generated intermediate
  brand receipt is byte-stable with zero missing or unclassified references.
- Publication, both exact-head hosted reviews and strict CI remain required
  for this slice; earlier pilot evidence does not cover it. Final equivalence must keep
  the verified heading repair and new regression as additions to the source,
  alongside the pilot repairs and all later original-source fixes.
- The separate Linux Atmosphere snapshot-refresh decision remains pending.
  No PNG update, assertion relaxation, provider creation, billing change,
  deployment or merge is authorized by this delivery work.

## Historical Snapshot — Phase 6 Legal Archive Pilot

- The user approved replacing oversized [PR #5](https://github.com/dsbowersock/atmoshaper/pull/5)
  with smaller dependency-ordered PRs and approved one isolated worktree. The
  [delivery plan](superpowers/plans/2026-09-20-phase6-review-sized-prs.md) owns the
  sequence. This first pilot starts at `cdfa99e49cebf100fac1a5080d60514806eb17db`;
  the original branch and source `7e318558da425b8fcdddeb8df50e93a36900310a`
  remain recovery references, not replaced or merged work.
- Pilot scope is immutable historical legal archives, their read-only verifier,
  exact archive-path audit classification, and the retained-data inventory test.
  Application runtime, current legal versions, acceptance storage, dependencies,
  providers and screenshots remain unchanged from the pilot base.
- Verification exposed Git's Windows checkout conversion changing the pinned
  archive bytes. Two exact `.gitattributes` LF rules now preserve those bytes;
  the temporary-Git regression failed before the repair and passes afterward,
  including an unrelated-path control. The six recovery-source files stay exact.
- Fresh clean-base verification passed: locked dependency install, Prisma
  generation, and 4,557 unit tests (4,554 passed, 3 skipped, zero failures).
  The published repair below passed independent specification/quality review
  and fresh local verification; exact-head hosted gates remain separate.
- CodeRabbit has not reviewed the original PR: its 291 selected files exceeded
  the observed 100-file cap, and its status also reported unavailable capacity.
  Publish only this pilot until actual CodeRabbit review is confirmed. Do not
  infer coverage from a skipped review or change billing, filters or assertions.
- The 15-file [pilot PR #6](https://github.com/dsbowersock/atmoshaper/pull/6)
  first published `6961b4f`, which both hosted bots reviewed. CodeRabbit processed
  all 15 files, confirming that the pilot clears the size blocker. That head's
  CI passed, but the reviews identified two valid implementation findings.
- Published repair `f9c4a2b3ee1df9b0be17cc5e2dfc12bdb4113838` restricts the
  audit policy to the two exact archive filenames and isolates every fixture Git
  command from inherited `GIT_*` variables. Regressions cover sibling/suffix/
  nested paths, actual poisoned-child execution, recursive/zero-match false
  success, unchanged decoy repository bytes, strict hashes and CRLF controls.
  Both implementation findings are fixed; their three hosted threads resolved.
- The repair passed independent SPEC then QUALITY review, 49 focused checks,
  15 documentation-contract checks, typecheck, lint, and full unit verification:
  4,565 passed, 3 skipped, zero failures. Source archive bytes remain unchanged.
- As of 2026-09-20 15:39 UTC, Codex completed review of `f9c4a2b` with one
  documentation-only finding: this state and the log had not recorded the
  completed repairs. This follow-up corrects that stale status; it does not
  reopen implementation work. CodeRabbit has not reviewed `f9c4a2b`, and its CI
  is still running. The final follow-up head still needs both hosted reviewers
  clean and required CI green before a clean pilot claim or further publication.
  Check live hosted evidence before acting; earlier-head results are not coverage
  of a later head. No additional implementation finding was reported by Codex.
- The original Linux Atmosphere ring snapshot failure remains unresolved;
  snapshot-refresh authorization is separate and pending. Splitting does not
  approve PNG changes, production access, provider creation, deployment or merge.
  Earlier dated snapshots below remain historical evidence only.

## Historical Snapshot — Phase 5 Public Product Identity and Browser QA Complete Locally

- Phase 4 is merged. [PR #3](https://github.com/dsbowersock/atmoshaper/pull/3)
  merged into `main` at `2026-09-13T17:56:59Z` by `dsbowersock` as
  `a43d1a315e95d80d6570fb5e49d1e2dce5ce7ddb`. Its exact reviewed head was
  `69ff135aed8d0b1ecb43c054595d1e08e89a22b1`; the retained review branch is
  `codex/atmoshaper-dead-code-audit`.
- The user selected public product identity as the first Phase 5 subsystem. The
  clean branch `codex/atmoshaper-public-product-identity` starts from the exact
  Phase 4 merge. The user approved its [written design](superpowers/specs/2026-09-13-atmoshaper-public-product-identity-design.md),
  and the [implementation plan](superpowers/plans/2026-09-13-atmoshaper-public-product-identity.md)
  passed independent review after its Browser-QA build prerequisite was made
  explicit.
- Local Tasks 1–3 are complete: one frozen, dependency-free identity owner now
  serves the mapped SEO/metadata, app-shell and PWA consumers. Each task passed
  independent specification and code-quality reviews with no findings. All
  affected runtime values remain `MassageLab`, with the same assets, routes,
  layout, accessibility and install behavior; SEO exports remain compatibility
  adapters. Only mapped inline presentation copies retired.
- Broad local verification passed: focused tests 58/58; full unit tests 4,557
  total, 4,554 passed, 3 expected skips and zero failures; Prisma validate and
  generate, typecheck, lint and production build. Next.js 16.2.12 generated
  115/115 static pages and the complete route table, unchanged from baseline.
  The [evidence record](aegis/work/2026-09-13-atmoshaper-phase5-public-product-identity/90-evidence.md)
  records exact commits, inventory observations and non-fatal build/lint notes.
- The staged brand baseline reached a byte-identical generated fixed point with
  zero unexplained category drift. The local Phase 5 identity slice and both
  complete-branch final specification and code-quality reviews passed.
- The separately authorized Browser-QA lifecycle used a new independent empty
  temporary Neon project. Its non-production identity was proven before use,
  exactly 46 committed migrations were applied, and all 134 application tables
  were empty both before and after the run. `npm run build:browser-qa` completed
  immediately before the exact scoped Playwright command for `pwa.spec.ts` and
  `app-shell.spec.ts`; the 152-case selection completed with status `passed`,
  zero failed tests and no snapshot update. The temporary project was deleted
  and proved absent; the existing production project remained present, and no
  production data was copied, read or altered.
- PR #4 is open. Initial published head `4f5485611e18327099081990d3d65e0943b89317`
  passed Code quality, Browser build, all four Browser QA lanes, aggregate QA
  and exact-head CodeRabbit with no actionable comments. Successor heads must repeat these gates before merge; deployment, Phase 6 rebrand and merge remain gated.

## Historical Snapshot — Phase 4 Audit-Only Round 27 Pre-Merge Closeout

- The staged Round 27 candidate addresses finally-aware break/continue state, anonymous default function declarations, captured/default environment provenance, and BigInt zero spellings. Independent specification review found one reciprocal provenance case; it was fixed, and scoped specification re-review and full-candidate quality review passed. Code quality's CI timeout increases from 12 to 20 minutes after the prior hosted job was cancelled during unit tests, without an assertion failure.
- Fresh coordinator checks passed: focused audit/browser-harness tests 386/386; full tests 4,552 total, 4,549 passed, 3 expected skips, zero failures; Prisma validate/generate, typecheck, lint, build (115 pages), and cached diff check. Pre-document audit receipts are historical once these records are staged; [the evidence record](aegis/work/2026-09-10-atmoshaper-phase4-audit-only/90-evidence.md#round-27-integrated-closeout--2026-09-13) records their boundary. Ordinary brand audit reported zero missing/unclassified. Generated candidates A/B had 26,380 identical entries, unchanged source/categories, and zero occurrence deltas; their difference from the checked-out baseline was only generated LF versus Windows CRLF serialization.
- Pushed PR #3 head remains `ce337648fc9b99a8b9724214ab8c961120d40afc`. Next: coordinator stages bounded docs/test changes, regenerates and reviews any actual occurrence deltas, updates/stages the baseline if required, and proves the fixed point against staged Git blob bytes rather than CRLF worktree bytes. Index-sensitive audits, commit/push, and latest-head hosted checks/CodeRabbit follow. Exact final-index identity stays in the ignored handoff to avoid self-reference. Merge remains separately authorized. No candidate deletion, product-runtime, provider, lockfile, dependency, or Phase 5 action occurred; `deletionAuthority: false` remains binding.

## Historical Snapshot — Phase 4 through Round 26

The dated receipts and earlier next-action statements below are historical;
the Round 27 snapshot above owns current status.

- Phase 1–2 bootstrap is merged. [PR #1](https://github.com/dsbowersock/atmoshaper/pull/1) merged into `main` at `2026-09-09T09:36:44Z` by `dsbowersock` as `f59e1b9371b06e7401740ae011f6dc911430a97c`. Its reviewed head was `6f516b29a8f1be8c66b48663f1101b66efe3f7f9`; `codex/bootstrap-atmoshaper` remains retained.
- The sole fresh root is `7e89f7ba9508a1ad715c1824ea6099432e6a4ccd`, exported from MassageLab source `e74045c2fc85c2cb4df176fdb1aff2137c4d9848`. The initial 1,908-path contract and bootstrap checks below remain historical receipts, not fresh verification of this branch.
- The approved [Phase 3 plan](superpowers/plans/2026-09-09-atmoshaper-phase3-documentation-consolidation.md) is complete. [PR #2](https://github.com/dsbowersock/atmoshaper/pull/2) merged at `2026-09-10T00:57:48Z` as `7c07e4578307508ae2bdb784c4d7ad0d9fb64c65`; its reviewed head was `9d2a8eca057f33354f2cbb50263c8e4f365a00f1`, and `codex/atmoshaper-docs-consolidation` remains retained.
- Phase 4 audit-only work is complete locally on `codex/atmoshaper-dead-code-audit`, created from the exact Phase 3 merge. Planning commit `e27c1d0ce941fbf9610389b45b9a30c82caac873` records the approved [Phase 4 plan](superpowers/plans/2026-09-10-atmoshaper-phase4-audit-only.md). The pre-publication final repair cycle sanitizes malformed and path-like module specifiers, recognizes destructured environment defaults, matches the installed Next 16.2.12 single-digit metadata convention, models lexical shadowing and alias reassignment, and records literal `require.resolve()` ownership with hash-only nonliteral uncertainty. Repair validation confirmed three failing regression cases before their fixes and 3/3 passing afterward; strict TDD remained off. The pre-publication combined focused audit suite passed 64/64. Hosted review round 1 then corrected environment evidence so assignment and delete targets no longer count as reads; its focused slice passed 7/7, and the combined focused audit suites passed 68/68 with historical semantic results of dead code 1,558 findings/186 uncertainties, dependency 2,859/19, asset 340/2,002, and environment 612/178. Hosted review round 2 added config-alias, whole-object/computed environment, and browser-snapshot coverage; its focused repository audit suites passed 74/74 with historical semantic results of dead code 1,558/186, dependency 2,859/19, asset 388/2,003, and environment 587/191. Round 2's historical pre-document-synchronization snapshot measured 47,216,441 Git blob bytes. Hosted review round 3 added separately labeled exact declaration-companion/type evidence, two exact configuration/manifest dependency owners, and owner-relative bare asset paths that become exact only when tracked and in inventory and otherwise remain hash-only uncertainty. That round's focused repository audit suites passed 80/80; its now-historical semantic results were dead code 1,558/186 with 842 referenced modules and 23 candidates, dependency 2,861/19 with 2 configuration owners and 6 candidates, asset 390/11,384 with 97 tracked assets, 97 protected items, 177 exact owners, zero candidates, 529 dynamic rows and 10,855 unresolved rows, and environment 587/191. Its tracked inventory contained 1,921 files. Hosted review round 4 moved exact configuration ownership into the validated stage-0 policy and conservatively covered direct, aliased, wrapped, logical and conditional whole-environment forwarding without changing asset semantics. That round's focused repository audit suites passed 83/83: 21 repository-audit tests and 62 cleanup-audit tests. Its now-historical semantic results were dead code 1,558/186 with 842 referenced modules and 23 candidates, dependency 2,861/19 with 2 configuration owners and 6 candidates, asset 390/11,384 with 97 tracked assets, 97 protected items, 177 exact owners, zero candidates, 529 dynamic rows and 10,855 unresolved rows, and environment 587/250 with 77 computed and 173 unproven-alias uncertainties and zero unread-declaration candidates. At that snapshot, the tracked inventory contained 1,921 files and brand verification was zero missing and zero unclassified. Hosted review round 5 recognized runtime named `env` imports from the exact `node:process` and `process` modules and preserved their evidence through lexical loop/catch shadowing and function-scoped `var` behavior, including assignment-free redeclarations. It also repaired two historical receipt anchors in the reference inventory. That round's focused repository audit suites passed 86/86: 21 repository-audit tests and 65 cleanup-audit tests. Its now-historical semantic results were dead code 1,558/186 with 842 referenced modules and 23 candidates, dependency 2,861/19 with 2 configuration owners and 6 candidates, asset 390/11,384 with 97 tracked assets, 97 protected items, 177 exact owners, zero candidates, 529 dynamic rows and 10,855 unresolved rows, and environment 587/252 with 79 computed and 173 unproven-alias uncertainties and zero unread-declaration candidates. Hosted review round 6 recorded nested object destructuring defaults sourced from proven environment objects. That round's focused repository audit suites passed 87/87: 21 repository-audit tests and 66 cleanup-audit tests. Its now-historical semantic results were dead code 1,558/186 with 842 referenced modules and 23 candidates, dependency 2,861/19 with 2 configuration owners and 6 candidates, asset 390/11,384 with 97 tracked assets, 97 protected items, 177 exact owners, zero candidates, 529 dynamic rows and 10,855 unresolved rows, and environment 587/252 with 79 computed and 173 unproven-alias uncertainties and zero unread-declaration candidates. At the verified round-6 staged code snapshot, the full suite passed 4,282 tests with 3 host-dependent skips and zero failures; typecheck and lint passed. Hosted review round 7 recorded exact tracked runtime package metadata ownership, keeping `@generative-music/pieces-alex-bainter` out of unreferenced candidates without claiming an executable import. The generic parser required exact declared package names and versions and conservatively handled lexical shadows, duplicate or overridden properties, and spreads. That round's focused repository audit suites passed 88/88: 21 repository-audit tests and 67 cleanup-audit tests. Its now-historical semantic results were dead code 1,558/186 with 842 referenced modules and 23 candidates; dependency 2,863/19 with 2 configuration owners, 1 runtime-package-metadata owner, 144 referenced packages and 5 candidates; asset 390/11,384 with 97 tracked assets, 97 protected items, 177 exact owners, zero candidates, 529 dynamic rows and 10,855 unresolved rows; and environment 587/252 with 79 computed and 173 unproven-alias uncertainties and zero unread-declaration candidates. Round-7 verification passed: the full suite recorded 4,283 passed, 3 host-dependent skips and zero failures; typecheck passed; lint passed with no ESLint warnings; and the production build passed with 115 routes. The build's Babel deoptimization note was informational, not a lint warning. Earlier round-6 results remain historical supporting evidence. Hosted review round 8 added `data/` to the asset inventory and explicitly protected it as a conservative retained catalog/provenance boundary. Duplicate dependency declarations preserved all exact string versions across declaration sections for runtime metadata matching, without claiming an executable import. That round's focused repository audit suites passed 91/91: 21 repository-audit tests and 70 cleanup-audit tests. Its now-historical semantic results were dead code 1,558/186 with 842 referenced modules and 23 candidates; dependency 2,863/19 with 2 configuration owners, 1 runtime-package-metadata owner, 144 referenced packages and 5 candidates; asset 561/11,302 with 137 tracked assets, 137 protected items, 262 reference owners, 25 basename signals, zero candidates, 529 dynamic rows and 10,773 unresolved rows; and environment 587/252 with 79 computed and 173 unproven-alias uncertainties and zero unread-declaration candidates. At the verified round-8 staged snapshot, the full suite recorded 4,289 tests: 4,286 passed, 3 host-dependent skips and zero failures. Typecheck passed; lint passed with no ESLint warnings; and the production build passed with 115 routes. The Babel deoptimization note was informational, not a lint warning. All four audit CLIs ran twice with byte-identical output, zero stderr and `deletionAuthority: false`. Hosted review round 9 made global and exact imported process-object recognition scope-aware. Lexical/TDZ, `var`, function, class, catch, loop, module and static-block shadows no longer imply environment ownership. Parameter defaults were evaluated separately from body bindings, and namespace `ImportEquals` declarations shadowed outer process objects. The import classifier was consolidated; the environment analyzer contained 482 nonblank lines. These repairs changed no real-repository audit counts. That round's focused repository audit suites passed 95/95: 21 repository-audit tests and 74 cleanup-audit tests. Its now-historical semantic results were dead code 1,558 findings/186 uncertainties; dependency 2,863/19; asset 561/11,302; and environment 587/252: 306 static reads, 79 declared names, 202 missing declarations, zero unread-declaration candidates, 79 computed uncertainties and 173 unproven-alias uncertainties. At the verified round-9 staged code snapshot, the full suite recorded 4,293 tests: 4,290 passed, 3 host-dependent skips and zero failures. Typecheck passed; lint passed with no ESLint warnings; and the production build passed with 115 routes. Rounds 7 and 8 remain historical supporting evidence. Every report retains `deletionAuthority: false`. Hosted review round 10 repaired two validated latest-head findings: outer proven/unknown environment aliases leaking across inner declarations, and non-Node runtime imports locally named `env` or `environment` disappearing from the evidence. Inner declarations shadowed outer aliases without discarding existing same-scope bindings on assignment-free `var` redeclarations. Non-Node wrapper imports remain unproven-alias uncertainty, not exact environment ownership; exact Node imports and type-only exclusions remain distinct. The regression repair followed TDD RED/GREEN validation. The environment analyzer contained 490 nonblank lines. That round's focused repository audit suites passed 97/97: 21 repository-audit tests and 76 cleanup-audit tests. At the verified round-10 code snapshot, the full suite recorded 4,295 tests: 4,292 passed, 3 host-dependent skips and zero failures. Typecheck and lint passed; the Babel deoptimization note was informational, not an ESLint warning. The exact environment audit ran twice with byte-identical output, zero stderr and `deletionAuthority: false`. Its now-historical totals remained unchanged at 587 findings/252 uncertainties: 306 static reads, 79 declared names, 202 missing declarations, zero unread-declaration candidates, 79 computed uncertainties and 173 unproven-alias uncertainties. Round-9 verification remains historical supporting evidence, including its production-build receipt. At that snapshot, latest-head hosted review was pending; resolving hosted feedback and final checks/review precede any separately authorized merge. No cleanup deletion, provider mutation or Phase 5 action occurred; `deletionAuthority` remains false. Hosted review round 11 recorded the staged CodeRabbit/Codex privacy and opaque-tool hardening. Nested `.secrets/` and `secrets/` directories were rejected at any depth before policy, metadata or evidence blob reads. The tracked Python adapter was represented exactly once as an opaque manual-tool uncertainty without parsing its content; this does not claim a static import or authorize removal. That round's focused repository audit suites passed 98/98. The full suite recorded 4,296 tests: 4,293 passed, 3 host-dependent skips and zero failures. Typecheck and lint passed. Its now-historical semantic results were dead code 1,558 findings/187 uncertainties, including 2 manual-script uncertainties; dependency 2,863/19; asset 561/11,303; and environment 587/252. All four audits ran twice with byte-identical output, exit 0 and empty stderr; every report retained `deletionAuthority: false`. Brand verification reported zero missing and zero unclassified references, and the inventory reported zero forbidden tracked paths. The exact staged capture before this round's documentation synchronization contained 1,921 files and 47,355,254 Git blob bytes, with inventory SHA-256 `bb8b8c792c03a60bd5531e69e4f6c81d95781851b751c8b9a5824700036ded92`. This is a historical pre-document-synchronization capture, not the identity of the index after these versioned receipts are staged. Current final-index bytes and hashes remain outside these self-referential versioned documents. Round-10 results remain historical supporting evidence. At that snapshot, latest-head hosted review and final checks/review were pending before any separately authorized merge of PR #3. No cleanup deletion, provider mutation or Phase 5 action occurred; `deletionAuthority` remains false. Hosted review round 12 repaired two validated latest-head Codex findings: tracked credential/secret basename files could bypass privacy protection under non-JSON extensions, and 22 CSS files were absent from cleanup candidate/uncertainty coverage. Exact or dotted `credential`, `credentials`, `secret` and `secrets` basenames are now rejected independently of extension before blob reads, while lookalike names remain allowed. Policy-owned `.css` files each appear exactly once as metadata-only `stylesheetUsage` uncertainties, without JS/TS parsing or dependency evidence; existing imports and CSS asset-reference evidence remain preserved. TDD credential validation recorded RED with 0 of 1 targeted test passing, then GREEN 2/2. All 3 newly added CSS regression tests failed at RED for the expected missing coverage before implementation; the CSS GREEN slice passed 11/11. The authoritative staged focused repository audit suites passed 101/101. The full suite exited 0 with 4,299 tests: 4,296 passed, 3 host-dependent skips and zero failures. Typecheck and lint passed; the Babel deoptimization note was informational. Its now-historical semantic results were dead code 1,558 findings/209 uncertainties, including 22 `stylesheetUsage` and 2 `manualScripts` uncertainties; dependency 2,863/19; asset 561/11,305; and environment 587/252. All four audits ran twice with byte-identical output, exit 0 and empty stderr; every report retained `deletionAuthority: false`. Brand verification remained at zero missing and zero unclassified references. The historical pre-document-synchronization staged inventory contained 1,921 files and 47,369,668 Git blob bytes, with inventory SHA-256 `88baaae9e2ebd36cc66e06965ab3dee426a3c1bcaf1b3eaa110a1d8bd7c0d12a` and zero forbidden tracked paths. This capture does not identify the index after these versioned receipts are staged; current final-index bytes and hashes remain outside these self-referential documents. Round-11 results remain historical supporting evidence. At that snapshot, latest-head hosted checks and reviews remained pending before any separately authorized merge of PR #3. No deletion, merge, provider mutation or Phase 5 action occurred; `deletionAuthority` remains false. Hosted review round 13 repaired one validated latest-head Codex finding at `3a10a1b`: nested exact plain or dotted singular/plural credential/secret directory segments could bypass the fail-before-read guard. Those directory segments are now rejected before metadata or blob reads, while lookalike names remain allowed. TDD validation recorded RED with 0 of 1 targeted test passing, then GREEN 1/1. The focused privacy/source-cap slice passed 8/8, and the CSS regression slice passed 3/3. The authoritative staged repository audit suites passed 101/101. The full suite exited 0 with 4,299 tests: 4,296 passed, 3 host-dependent skips and zero failures. Typecheck and lint passed; the Babel deoptimization note was informational. Its now-historical semantic results were dead code 1,558 findings/209 uncertainties, including 22 `stylesheetUsage` and 2 `manualScripts` uncertainties; dependency 2,863/19; asset 561/11,308; and environment 587/252. All four audits ran twice with byte-identical output, exit 0 and empty stderr; every report retained `deletionAuthority: false`. Brand verification remained at zero missing and zero unclassified references. The historical pre-document-synchronization staged inventory contained 1,921 files and 47,381,374 Git blob bytes, with inventory SHA-256 `1bf7e63a2192b624816da03083b867d45d6611b51d37a7d8bb10fe99c6bbbe9a` and zero forbidden tracked paths. This capture does not identify the index after these versioned receipts are staged; current final-index bytes and hashes remain outside these self-referential documents. Round-12 results remain historical supporting evidence. At that snapshot, latest-head hosted checks and reviews remained pending before any separately authorized merge of PR #3. No deletion, merge, provider mutation or Phase 5 action occurred; `deletionAuthority` remains false. Hosted review round 14 repairs one validated latest-head Codex finding on `9e5cb0c`: bounded compound credential-artifact basenames `client_secret_<identifier>` and exact `service-account-key` were reaching metadata or blob reads. They are now rejected before policy, metadata or evidence reads. Case and nesting variants were tested; benign lookalikes remain allowed. Strict TDD validation recorded RED with 0 of 1 targeted test passing, then GREEN 1/1. The relevant privacy/CSS/source-cap slice passed 11/11, and the authoritative staged focused repository audit suites passed 101/101. The full suite exited 0 with 4,299 tests: 4,296 passed, 3 host-dependent skips and zero failures. Typecheck and lint passed; the Babel deoptimization note was informational. Its now-historical semantic results were dead code 1,558 findings/209 uncertainties, including 22 `stylesheetUsage` and 2 `manualScripts` uncertainties; dependency 2,863/19; asset 561/11,312 with 529 dynamic and 10,783 unresolved uncertainties; and environment 587/252. All four audits ran twice with byte-identical output, exit 0 and empty stderr; every report retained `deletionAuthority: false`. Brand verification remained at zero missing and zero unclassified references. The historical pre-document-synchronization staged inventory contained 1,921 files and 47,391,330 Git blob bytes, with inventory SHA-256 `76816a9001dd302d4765da3dc868da9d9eb9636ee3809c71814659c3d2f6c046` and zero forbidden tracked paths. This capture does not identify the index after these versioned receipts are staged; exact final-index bytes and hashes remain outside these self-referential tracked documents. Round-13 results remain historical supporting evidence. Latest-head hosted checks and CodeRabbit/Codex reviews remain pending before any separately authorized merge of PR #3. No deletion, merge, provider mutation or Phase 5 action occurred; `deletionAuthority` remains false. At that now-superseded snapshot, the tracked inventory was 1,921 files and brand verification was zero missing and zero unclassified. The pre-publication Prisma validation/generation, typecheck, lint, full suite (4,259 passed, 3 host-dependent skips, 0 failed), 115-route production build, and independent specification and quality reviews passed. Exact current staged byte totals and identities are retained outside this self-referential versioned index. The local completion commit was published in [PR #3](https://github.com/dsbowersock/atmoshaper/pull/3) for hosted review; resolving hosted feedback and final checks/review precede any separately authorized merge. Every report hard-codes `deletionAuthority: false`; no deletion, rename, upgrade, retirement, runtime change, or Phase 5 work is authorized. Hosted review round 15 is now historical; round 14 remains historical. Latest-head Codex review on `9946a24` validated that generic `client-secret.json`, `client_secret.json`, and `service-account.json` artifacts bypassed fail-before-read, and that direct CommonJS `const process = require("node:process")` / `require("process")` bindings were not recognized, causing false unread environment declarations. The bounded credential matcher now recognizes exact optionally dot-prefixed `client[-_]secret` and `service[-_]account` stems only at dot or end boundaries, while preserving `client_secret_<identifier>`, `service-account-key`, and benign guide/manager lookalikes. The CommonJS process-binding scope model recognizes those exact direct requires and models `require`/`process` shadowing, assignment/update invalidation, loop evaluation order, merged enum members, and sloppy `.cjs` Annex-B block-function boundaries. Cross-file/global bindings and separately merged namespace enums remain explicitly unmodeled; a current real tracked-source search found no CommonJS process require outside audit fixtures. Staged-code validation passed 119/119 focused repository-audit tests, 4,314 of 4,317 full-suite tests with 3 host-dependent skips and zero failures, typecheck, and lint. Pre-document audits ran twice with byte-identical output, exit 0 and empty stderr; every report retained `deletionAuthority: false`: dead code 1,561/209, dependency 2,864/19, asset 561/11,314, and environment 587/252. Brand verification was zero missing and zero unclassified. The current tracked inventory contains 1,922 files with zero forbidden paths; exact final staged bytes and identity are retained only in the ignored SDD/user-facing receipt. Pre-document repeat output SHA-256 values were dead code `a6357175f60ce4bba5fbcde50a93e262ebb5744c89c409b2b844cf78f68047a5`, dependency `f068dd6f6f219f9a0d5abbf4462752373cbca7bee02c9d9bd8756e142ec49a47`, asset `ad1f0bfacd3cdab11ba39986af151d760b9e750b48b94345f53c718ecf3a2051`, environment `c1dc9e91f3861926328721bd6e98d269c7eceb29f9970a09b18d047e31bd4acf`, inventory `82d2afaf5b953d9e2c2a83acd01d819ce2ea7a3d38c1c4bc293e8e86f0cafb4a`, and brand `50a8f6f48d60f51c00edfd2b0a5005289e007e9939f18862beaa5e83667ecd2b`; these remain historical raw-output receipts and do not identify the final staged index. Hosted checks/reviews remain pending, merge remains separately authorized, and no deletion, merge, provider action or Phase 5 work occurred. The current tracked inventory is 1,922 files. Hosted review round 16 is now historical. Hosted review round 17 is the current Phase 4 receipt. Latest-head Codex review on `012945b` validated that TypeScript external import-equals module references were absent from module/dependency evidence and that exact non-type source-level `import <alias> = require("process"|"node:process")` declarations were not proven for environment reads. The module audit now records separately labeled `import-equals` literal/static evidence, preserves type-only declaration resolution, ignores internal aliases, and keeps syntactically possible nonliteral external references as hash-only uncertainty. Environment evidence proves process import-equals only for valid source-level non-type declarations, preserving source order, lexical shadowing and assignment/update invalidation while excluding unrelated, internal, type-only and nested-invalid forms. Independent review caught and repaired the TS1147 namespace false-positive before final validation. Current tracked source contains no import-equals `require(...)` syntax, so semantic totals remain dead code 1,561 findings/209 uncertainties, dependency 2,864/19, asset 561/11,314, and environment 587/252. Staged validation passed the module slice 3/3; environment strict RED 0/2 then GREEN 2/2; namespace correction RED 1/2 then GREEN 2/2; combined slice 52/52; focused repository audits 123/123; full suite 4,318 of 4,321 with 3 host-dependent skips and zero failures; typecheck, lint and diff checks; and source caps of 500 module, 499 environment and 131 scope nonblank lines. Pre-document audits were byte-identical across two runs, brand verification remained zero missing and zero unclassified, every report retained `deletionAuthority: false`, and the current tracked inventory is 1,922 files. Detailed pre-document bytes and hashes remain in the other round-16 receipts; exact final staged bytes and identity remain only in the ignored SDD/user-facing receipt. Hosted reviews and checks remain pending, merge remains separately authorized, and no deletion, provider action or Phase 5 work occurred. Latest CodeRabbit review on remote head `012945b` validated that `SatisfiesExpression` wrappers dropped proven environment/CommonJS flows and that destructuring assignments sourced from proven environment objects omitted exact extracted top-level keys in favor of overbroad whole-object uncertainty. Shared `satisfies` transparency now covers aliases, direct reads, CommonJS recognition and escape traversal while preserving shadow and mutation boundaries. The focused environment-pattern helper records shorthand, renamed and literal-computed top-level keys, top-level-only nested semantics and separately sourced nested defaults while preserving hash-only dynamic/rest/unproven-alias uncertainty, evaluated expressions, ordering, target invalidation, privacy, determinism and duplicate suppression. Independent final review also repaired a conditional destructuring-default provenance gap: simple assignment defaults from proven or unknown environment objects now emit one hash-only unbounded `assignment-default` uncertainty and retain unknown target provenance, preserving shorthand/renamed cases, outer exact keys, later reads, shadows and invalidation without plaintext or duplicates. Strict TDD recorded `satisfies` RED 0/3 then GREEN 3/3, assignment RED 0/3 then GREEN 3/3, and conditional assignment-default RED 0/5 then GREEN 5/5; combined assignment tests passed 8/8, the broad slice passed 58/58 and final independent review passed. Focused repository-audit tests passed 134/134; the full suite recorded 4,332 total, 4,329 passed, 3 host-dependent skips and zero failures; typecheck, lint, documentation-state and diff checks passed; and source caps were environment analyzer 486, environment-pattern helper 35, environment scope 132 and module evidence 500 nonblank lines. Pre-document audits ran twice byte-identically with dead code 1,564/209, dependency 2,865/19, asset 561/11,314 and environment 587/252; brand remained zero missing and zero unclassified, every report retained `deletionAuthority: false`, and the current tracked inventory contains 1,923 files with zero forbidden paths. Detailed pre-document bytes and hashes remain in the round-17 evidence receipts; exact final staged bytes and identity remain only in the ignored SDD/user-facing receipt. Four hosted threads remain until push. The latest CodeRabbit review completed with these two comments; latest-head re-review and checks remain pending. Merge remains separately authorized, and no deletion, provider action or Phase 5 work occurred.
- Hosted review round 18 is now historical supporting evidence. Three latest-head findings on remote `01ae7fb` were validated and repaired: loader evidence now requires scope-aware ownership of `require` and `createRequire`; NodeNext explicit `.cjs` and `.mjs` specifiers substitute only within their `.cts`/`.d.cts` and `.mts`/`.d.mts` families, without cross-family fallback; and environment evidence preserves conditional provenance through logical `&&=`, `||=` and `??=` assignments with hash-only uncertainty where ownership remains unproven. Exhaustive independent staged review also found and fixed adjacent scope and evaluation-order gaps across parameter, switch, enum, loop, pattern, catch, class, decorator, Annex-B, `with`, optional-call and mutation boundaries, including `.resolve` mutation behavior. Final independent review passed with 53 accumulated reproductions and 16/16 targeted checks. The earlier 145/145 focused repository-audit result is historical; the final loader and environment slices passed 28/28 and 60/60, and the authoritative exact-staged focused repository-audit suite passed 162/162 after documentation synchronization. The full suite recorded 4,360 total, 4,357 passed, 3 host-dependent skips and zero failures; typecheck, lint and diff checks passed. Source caps were environment analyzer 496, environment-pattern helper 42, environment scope 132, module evidence 419, module loader 475 and module resolution 96 nonblank lines. Pre-document audits ran twice byte-identically with exit 0 and `deletionAuthority: false`: dead code 1,570/211 (`a035d78474f9fcb3ee465cf8e4f289a2112ef2cadcb4d86410faa8503a593cd4`), dependency 2,868/21 (`0e2c9ef622745d67b746e8f72ffecf74a48139095db67ddaf67a04f5e6ebeece`), asset 561/11,314 (`452217301e254a1ef5ec74abb4021eaddf1c01ade1c382e1ac3619acabdc1a00`) and environment 587/252 (`f87cac8099ec64eb613b6215202c5e461476f83164d452baa6fab4624851b91e`). The pre-document tracked inventory contained 1,925 files and 47,569,581 Git blob bytes, inventory SHA-256 `c835271d633b07c09a58d6280cf1bfc520864674c7e34a2464f16f68db4d6619`, output SHA-256 `623f1bc01f36f8fab7f8db1e50b7448995323ef30dab6247a4130df2dfae684e` and zero forbidden paths. Brand remained zero missing and zero unclassified with output SHA-256 `50a8f6f48d60f51c00edfd2b0a5005289e007e9939f18862beaa5e83667ecd2b`. These pre-document hashes and identities become historical when these documents are staged, and the exact final identity remains only in the ignored SDD receipt. Latest-head hosted checks and reviews remain pending. Merge remains separately authorized, and no deletion, provider action or Phase 5 work occurred. Hosted review round 19 adds the [tracked Round 18 successor attestation](aegis/work/2026-09-10-atmoshaper-phase4-audit-only/round-18-final-receipt.md) for immutable subject commit `f10773c7c94c9db9e4059a82dd45c5195fb83dc9` and tree `78b1b769413053bfb798038e31a6b4a21e8a52b9`. It records the final subject inventory and CRLF report hashes previously retained only outside Git, while explicitly not attesting the later tree that contains the receipt itself. Hosted checks and reviews remain pending; merge remains separately authorized, and no deletion, provider action or Phase 5 work occurred. Hosted review round 19 is now the current Phase 4 receipt. Bare owner-relative asset URLs resolve as exact evidence only in parsed CSS `url(...)` tokens and Markdown link or image destinations; masked comments, fenced or inline code, ordinary prose and quoted content remain hash-only uncertainty. Strict TDD covered both context repairs and the follow-up masked slash-path regression. Independent final code review fixed and covered blockquote/list tilde fences, CSS escaped-newline and unclosed quoted strings, and CommonMark 5+ list-padding code boundaries. Explicit `.js`, `.jsx`, `.mjs` and `.cjs` imports preserve runtime ownership and separately record family-matched TypeScript substitution ownership for `.ts`, `.tsx`, `.mts` and `.cts`; declarations remain separately labeled declaration-companion evidence. The tracked successor attestation continues to govern immutable subject commit `f10773c7c94c9db9e4059a82dd45c5195fb83dc9` and tree `78b1b769413053bfb798038e31a6b4a21e8a52b9` without self-attesting the later tree that contains it. Independent staged review passed. The exact staged focused repository-audit suite passed 172/172; the full suite recorded 4,370 total, 4,367 passed, 3 host-dependent skips and zero failures; and typecheck, lint, documentation-state and working/staged diff checks passed. Source caps were asset evidence 253, module evidence 426, module resolution 101, module loader 475, environment analyzer 496, environment-pattern helper 42 and environment scope 132 nonblank lines. Current pre-document audits ran twice with byte-identical output, exit 0 and `deletionAuthority: false`: dead code 1,570/211 (`30ada36f1077ae197445417025da82cab1c3da73c452d66c3ceae1586509a5b0`), dependency 2,868/21 (`66403e4cde209e2cc387fa23f58639fc4de287b66f88b862b81f62287fd849e1`), asset 557/11,358 (`c4887ec9041c400a01201edca6368c27cdada07ec23808ee7e17faf45f6eeee6`) and environment 587/252 (`770bc579411453dda8a9df864492ff9d69cc1c724244cf442b8d802e01079313`). The current pre-document inventory contained 1,926 files and 47,629,855 Git blob bytes, inventory SHA-256 `55e5b16dc1055d424f305b9a5eebad8c72e157be236b6dc2ec1f9d5aae4a151d`, output SHA-256 `7b5f8db5051ab55762f054e07f7e7e61f0d580e6a6305ae95969b29d0d6a5fe1` and zero forbidden paths. Brand verification remained zero missing and zero unclassified with output SHA-256 `50a8f6f48d60f51c00edfd2b0a5005289e007e9939f18862beaa5e83667ecd2b`. This pre-document identity becomes historical when the synchronized documents are staged; the successor-attestation contract governs immutable subjects. Latest-head hosted checks and reviews remain pending. Merge remains separately authorized, and no deletion, provider action or Phase 5 work occurred. Hosted review round 20 is now historical supporting evidence. Six validated latest-head findings were repaired: extensionless bundler resolution records separate TypeScript companion ownership including dotted basenames; `.mts` and `.cts` asset sources use the TypeScript AST; slashless quoted/unquoted HTML `src`, `href` and `poster` values become exact owner-relative evidence only in live start tags recognized by conservative stateful data/raw-text/comment tokenization; and the tracked Round 18 successor receipt rejects standard error, validates all trusted JSON field existence/types before use, and removes only its bounded temporary checkout without masking an original error. Independent adversarial follow-ups covered case-insensitive duplicate attributes, ASCII/NBSP boundaries, PLAINTEXT through EOF, bogus and abruptly closed comments, quoted pseudo-tags, and raw-text end tags with attributes or self-closing slashes. Cleanup audit passed 154/154, repository audit 21/21 and the combined focused run 175/175; the full suite recorded 4,373 total, 4,370 passed, 3 host-dependent skips and zero failures; typecheck and lint passed, with the Babel note informational. Source caps were asset 374, module evidence 426, module resolution 105, loader 475, environment 496, patterns 42 and scope 132. The exact pre-document staged receipt repeated twice with exit 0, empty standard error, byte-identical output, shared inventory and `deletionAuthority: false`: dead code 1,570/211 (`76b5c57f679d3199c3bd356c39a95a2e798121cab94343278da7158cea8dc334`), dependency 2,868/21 (`e78383f48cae71f4a183afab5eda173a19ab7de96cc64b7a82a4f9732fc16c1c`), asset 557/11,408 (`580499e903b1725957f4982250521e1996f2a99c6f48c893c2220a99c633081e`) and environment 587/252 (`55b5ff8b7480080551c471e503101a681e7f22769cfc5c18ccab485068f49362`). Its inventory contained 1,926 files, 47,651,052 Git blob bytes, SHA-256 `026219ea7eb8890b1215ed5558540fdfe3fb6b1e56eba8d0f0676ff312f5d091`, output SHA-256 `37764bb4f3947d438a004e7b9b0be4e1aa8ede7ffcd8ff16f0f790b917e4658a` and zero forbidden paths; brand remained zero/zero with output SHA-256 `50a8f6f48d60f51c00edfd2b0a5005289e007e9939f18862beaa5e83667ecd2b`. These values become historical after document staging; the successor-attestation contract governs immutable subjects. Latest-head hosted checks/reviews remain pending; merge remains separately authorized, and no deletion, provider action or Phase 5 work occurred. Hosted review round 21 is now the current Phase 4 receipt. Three latest-head findings were validated and repaired: protocol-relative `//` asset references are external before root-relative handling; live HTML `srcset` values are parsed conservatively into candidate URLs with exact original offsets and are excluded from the legacy literal rescan; and CommonJS plus implicit process-object destructuring proves only exact, static, case-sensitive `env` bindings, including nested and assignment patterns, while preserving source-order mutation and shadow boundaries, including immediately executed class static propagation. Independent stage-1 specification review returned SPEC PASS. Three bounded quality rounds repaired false legacy `srcset` rescanning, process-destructuring declaration and assignment coverage, and implicit-process invalidation including class-static propagation; their RED receipts were 0/2, 0/1 and 0/1, and final code re-review returned PASS. Initial hosted regressions recorded RED 0/3 and GREEN 3/3. The final cleanup suite passed 161/161, repository audit 21/21 and combined focused run 182/182; the full suite recorded 4,380 total, 4,377 passed, 3 host-dependent skips and zero failures; typecheck passed, lint passed with only the informational Babel large-file note, and diff checks passed. Source caps were asset evidence 414, module evidence 426, module resolution 105, module loaders 475, environment evidence 499, environment patterns 73 and environment scope 144 nonblank lines. The pre-document staged audits each ran twice with exit 0, empty standard error, byte-identical output, shared inventory and `deletionAuthority: false`: dead code 1,570/211 (`f6072362bf363c8093c059bc2e545bf0e12f54b2bc99f779b142d4b70e669674`), dependency 2,868/21 (`a54ce7616a9271e804439a5026d4c834847ad7018b899e5ac43d5d9f3e2750d3`), asset 557/11,432 (`3012b71b2790b9885fc8cf6ce27bf6b988ddb8b2d670b9648803c62f9e3e15ab`) and environment 587/252 (`797f978ee56db6be1174bcac7d739bddd93d866d6b059b8568aab82c430fa5ba`). Its inventory contained 1,926 files, 47,683,828 Git blob bytes, inventory SHA-256 `1860b5f32a83af6b433baf4b85937c363e216c7a910ce6615398663edf4f7fb8`, CRLF serialized-output SHA-256 `56ee8ed16eb397e994e957c9c4aa386b0d40c4ae7794e49ae496d24b2c569865` and zero forbidden paths; brand remained zero missing/zero unclassified with output SHA-256 `50a8f6f48d60f51c00edfd2b0a5005289e007e9939f18862beaa5e83667ecd2b`. These pre-document values become historical once the tracked documents are staged; the exact final staged snapshot remains pending in the ignored SDD receipt. Latest-head hosted checks and reviews remain pending. Merge remains separately authorized, and no deletion, provider action or Phase 5 work occurred. Hosted review round 21 is now historical supporting evidence; hosted review round 22 is the current Phase 4 receipt. Six valid latest-head findings were repaired: aliases of proven process objects retain provenance; exact static bracket access to `env` is recognized; HTML character references decode before asset resolution while evidence retains original raw offsets; every exact top-level Sentry and instrumentation entrypoint is runtime-scoped; every parsed primary or duplicate `src`, `href`, `poster` and `srcset` value is masked from legacy scans while first-occurrence ownership is preserved; and parameter destructuring defaults sourced from `process` or a proven process alias propagate provenance. Review hardening added complete WHATWG named-reference and C1 decoding, fail-conservative handling for unknown references, non-ASCII whitespace preservation, and deterministic verification of the CPython 3.14.7 `html.entities.html5` snapshot. Code specification and quality reviews returned PASS. Cleanup passed 169/169, repository audit 21/21 and the combined focused audit 190/190; the full suite recorded 4,388 total, 4,385 passed, 3 host-dependent skips and zero failures; typecheck passed, and lint passed with only the informational Babel greater-than-500-KB note. Nonblank caps were asset evidence 436, HTML URL decoder 59, snapshot refresh verifier 34, environment evidence 498 and environment scope 157. Pre-document staged audits ran twice with exit 0, empty standard error, byte-identical output, shared inventory and `deletionAuthority: false`: dead code 1,575/211 (`cdd19f6df0eb0b72d07b42945fca148f2d9af1b3f7b0ecd03551dd06d9d41bf8`), dependency 2,872/21 (`039c715e5db07b08ff958b0322de6032be6a3e0a88599f65e369567df1d7538b`), asset 557/11,455 (`c90eab097560c71b8e92ab970e9e20ee4dcec1cb1e1e8b0160f3cc08e16ff2f8`) and environment 587/252 (`fb59f6fc055bd143b2cbff8f57b882078bb9c6fb0842d3a5848de3ae1a2c4829`). The inventory contained 1,929 files and 47,760,923 Git blob bytes, inventory SHA-256 `84208d00fae6678e4148c3c4fc3a6889921a85c99125f60299b3eff74b16f7a2`, serialized-output SHA-256 `517e85744eac31373ce529ada76032284d983da6cd9a13efa7ac46b433c3dadf` and zero forbidden paths; brand remained zero missing/zero unclassified with output SHA-256 `50a8f6f48d60f51c00edfd2b0a5005289e007e9939f18862beaa5e83667ecd2b`. These pre-document values become historical once the tracked documents are staged; the exact final staged snapshot remains pending in the ignored SDD receipt. Latest-head PR checks and reviews remain pending. Merge remains separately authorized, and no candidate deletion, provider mutation, merge or Phase 5 action occurred. Hosted review round 22 is now historical supporting evidence; hosted review round 23 is the current Phase 4 receipt. Five valid latest-head findings were repaired: exact `.d.ts`, `.d.mts` and `.d.cts` files classify as generated/type-input uncertainty without widening to ordinary or lookalike sources; CSS `url(...)` evidence uses escape-aware tokenization/decoding with exact raw offsets; a proven environment object on a `for...in` right-hand side records one unbounded whole-environment uncertainty; defaulted process-object aliases in identifier and binding-element patterns inherit proven provenance while retaining TDZ, shadow and invalidation boundaries; and the round 22 project-log receipt now has its own heading. Independent hardening covered complete CSS identifier decoding, non-ASCII prefixes, at-keyword/hash-token and dimension-token boundaries, raw NUL replacement, URL whitespace preprocessing and exact raw offsets; array and catch binding defaults; and conditional, logical, assignment, logical-assignment and comma-expression `for...in` result provenance. Stage 1 ultimately returned SPEC PASS and iterative quality review ultimately returned QUALITY PASS. Cleanup passed 182/182, repository audit 21/21 and the combined focused run 203/203; the full suite recorded 4,401 total, 4,398 passed, 3 host-dependent skips and zero failures; typecheck passed; lint passed with only the informational Babel greater-than-500-KB note; and diff/source-cap checks passed. Nonblank caps were CSS helper 211, asset evidence 444, environment evidence 499, environment patterns 111, environment scope 152 and dead code 139. Pre-document staged audits ran twice with exit 0, empty standard error, byte-identical output, shared inventory and `deletionAuthority: false`: dead code 1,578/211 (`6c3fb5ce9ffb974d7903bbc0b463e5ffba45a6b36be28891fea908b91b4b9269`), dependency 2,872/21 (`a5f2a2dc8089984b8186d25fbea5f7e80eec9027ac3cd0645db56fa7cd99463d`), asset 557/11,510 (`e90d29669bb91913b77a1a422376f1f2416b7ff5e0f7f355ca6cdca306f821ad`) and environment 587/252 (`d7f8e34534a05bc096c263768821b1ede2de9c4d565c706b93a5bed7a70ec775`). The pre-document inventory contained 1,930 files, 47,805,304 Git blob bytes, inventory SHA-256 `fb2258c19f5c8fe2649e5368db1b029e85e7dfe0e4a139e3ea520c61b42783ba`, CRLF output SHA-256 `3d9a205a6ede27c170f94f5c154bdb064ba835515c8d1510a602ceafccffa56a` and zero forbidden paths; brand remained zero missing/zero unclassified with output SHA-256 `50a8f6f48d60f51c00edfd2b0a5005289e007e9939f18862beaa5e83667ecd2b`. These pre-document values become historical once the tracked documents are staged; the exact final staged identity remains pending in the ignored SDD receipt. Latest-head hosted checks and reviews remain pending. Merge remains separately authorized, and no candidate deletion, provider mutation, merge or Phase 5 action occurred.
- The semantic review covered 150 inherited records: 28 specifications and 122 plans. All 28 specifications and 106 plans remain (134 inherited records); 16 exact superseded plans were omitted with current-owner, immutable-source, and rollback evidence in the [cleanup register](rebrand/atmoshaper-cleanup-register.md#phase-3-documentation-omissions--2026-09-09). MassageLab retains every original. Including the new Phase 3 plan, there are 107 plans and 28 specifications.
- [Architecture](architecture.md) maps current owners; [ADR 0001](decisions/0001-fresh-root-lineage-and-history-ownership.md) is Accepted. The other three [decisions](decisions/README.md) remain Proposed: central public-brand ownership, dedicated old-origin recovery, and parallel provider staging are not implemented by Phase 3. [Account security](wiki/account-security.md) owns current identity and 2FA rules.
- Runtime design/copy still presents MassageLab until the separately reviewed Phase 6 preview rebrand. Old-origin recovery implementation, provider staging, deployment, DNS/domain changes, production/database/payment/email/media changes, and legal cutover remain future-gated work. Unrelated hosted-provider observations retain their recorded dates; this synchronization does not refresh them.

## Historical Task 5 Snapshot — Superseded by Current Snapshot

- Phase 1 passed. Its source-baseline, migration-parity, classification, and read-only external-boundary evidence are retained in the migration documents and the historical MassageLab repository.
- Phase 2 is in progress at Task 5. The immutable source is `dsbowersock/massagelab` commit `e74045c2fc85c2cb4df176fdb1aff2137c4d9848`; the reviewed relock commit is `f3b92a1afc44a5fdb2d56653bc82c8d0dc9a933e`.
- The locked source contains 1,905 paths. The reviewed Task 5 contract is four exact omissions and one source-absent addition: `1,905 - 4 + 1 = 1,902` paths. Task 6 adds six repository-audit files, producing the exact final bootstrap contract of `1,908` paths.
- The history-free source export, four omissions, and ten reviewed document overlays have been applied to the local candidate. Task 5's five fresh authority documents are the current review boundary. Git initialization, staging, and exact path/blob verification remain coordinator-owned Task 5 actions.
- Repository identity is AtmoShaper, but the runtime intentionally retains the existing MassageLab design and copy until the separately reviewed Phase 6 preview rebrand. No completed public runtime rebrand is claimed.
- Complete prior development history, historical evidence, and rollback history remain in [`dsbowersock/massagelab`](https://github.com/dsbowersock/massagelab). This repository intentionally starts with fresh Git history.
- No production deployment, provider migration, database or payment change, DNS or domain cutover, old-origin retirement, or legal cutover has occurred through this bootstrap boundary.
- Task 6's deterministic repository and legacy-brand audits remain pending. Tasks 7–9—destination verification and initial commit, verification recording, and public repository/bootstrap-PR publication—also remain pending and must follow their exact gates.

## Current Boundaries

- Preserve current behavior, routes, responsive design, accessibility, privacy, local-first data ownership, feature-key entitlements, APIs, provider-call boundaries, and compatibility identifiers during bootstrap.
- Keep clinical notes, intake forms, journals, ROM sessions, encrypted professional records, and other PHI-bearing workflows local-first until hosted clinical storage passes the documented compliance gates.
- Preserve the legal operator, copyright owner, proprietary license, legal-document versions and effective dates, accepted text, and acceptance history unless a later legal transition is separately reviewed and approved.
- Treat AtmoShaper as the platform identity, `Atmosphere` or `Atmosphere mixer` as the later public audio label, and existing internal `atmoshaper` names as stable compatibility identifiers.

## Authority and Next Reads

- [Project log](project-log.md) — fresh-repository chronological progress.
- [Migration lineage](../MIGRATION_LINEAGE.md) — exact source, date, history owner, and legal boundary.
- [Export manifest](rebrand/atmoshaper-export-manifest.json) — exact path-difference contract.
- [Migration charter](rebrand/atmoshaper-migration-charter.md) — authority, invariants, and external mutation boundary.
- [Operative Phase 1–2 plan](superpowers/plans/2026-09-06-atmoshaper-repository-migration.md) — task sequence and acceptance gates.
- [Phase 3 plan](superpowers/plans/2026-09-09-atmoshaper-phase3-documentation-consolidation.md) — completed consolidation scope, verification, and publication boundary.
- [Phase 4 audit-only plan](superpowers/plans/2026-09-10-atmoshaper-phase4-audit-only.md) — active deterministic evidence-collection scope and no-deletion boundary.
- [Architecture](architecture.md), [decisions](decisions/README.md), and [account security](wiki/account-security.md) — current ownership and migration constraints.
- [Project wiki](wiki/index.md) — stable operational documentation.

## Documentation Rules

- Update this file first when the active phase, current gate, provider/database state, live surfaces, or priority order changes.
- Update `docs/project-log.md` for chronological progress, meaningful decisions, completed branches, and verified receipts.
- Keep historical detail in the MassageLab repository and link to it instead of recreating a competing history here.
- Keep stable operating instructions in `docs/wiki/` and detailed implementation plans in `docs/superpowers/plans/`.
- Do not turn a plan, audit finding, or intended later phase into a completed-state claim without fresh evidence.

## Inherited Verification Receipts

The locked source records the exact 174/174 focused Anatomime matrix. Fresh exact-head full intercepted Anatomime Browser QA coverage reports 42/42 desktop/mobile cases ok in one post-fix run. These are inherited source receipts from `e74045c2fc85c2cb4df176fdb1aff2137c4d9848`, not Task 7 candidate-run evidence.

## Historical Snapshot — Phase 1–2 Bootstrap Published for Review

This is the 2026-09-09 pre-merge publication snapshot, superseded by the current Phase 4 snapshot above. Its open-PR, review-coverage, and stop-before-Phase-3 statements describe that earlier boundary only.

- Tasks 5–7 are complete. Fresh-root `main` is `7e89f7ba9508a1ad715c1824ea6099432e6a4ccd`: the repository has one root, that commit has no parent, and the worktree was clean after creation.
- The initial commit contains the exact 1,908-path contract, 46,865,680 tracked blob bytes, tree `e9a97bbe519a1cc52c7225eb600fd5d2473f6ded`, and aggregate staged-tree SHA-256 `1d537a03b8a0294f1e68f56df718c29b5e5cf4bfedac01de7ae1cceb86aa3604`.
- Repository inventory and legacy-brand audits passed. The final unit suite passed 4,216 of 4,219 tests with 3 intentional skips and no failures; typecheck and lint passed; both builds produced 115 pages.
- The destination route manifest contained 148 keys, matching the source count; server-app bytes matched the source aggregate exactly. Static assets measured 52 bytes above the source aggregate because fresh-build artifact identities differ, so no per-file bundle equality is claimed. The web manifest, robots, sitemap, service worker, and all 24 accepted PNGs matched their source bytes and hashes.
- All four Browser-QA lanes passed at their accepted counts, and the final fresh migration-parity lifecycle passed 22/22 without snapshot updates. A prior transient desktop Home readiness failure was followed by a focused 1/1 pass and a separate full 22/22 pass; no runtime or snapshot change was required.
- The accepted empty QA project received exactly 46/46 committed migrations. All 134 application tables were empty after cleanup. Every cycle-owned temporary project was deleted and verified absent, the unrelated pre-existing project was preserved, and no production data was copied or altered.
- Task 8 recorded the destination receipt in commit `953e04c680d497851cdb6b6533b92de8f9b1c4f2`. Task 9 then created the public repository at [`dsbowersock/atmoshaper`](https://github.com/dsbowersock/atmoshaper), published `main` and `codex/bootstrap-atmoshaper`, and opened [PR #1](https://github.com/dsbowersock/atmoshaper/pull/1). The repository is public, its default branch is `main`, and it has no tags. PR #1 remains open and unmerged with base `main` and review branch `codex/bootstrap-atmoshaper`.
- One test-only correction commit, `23f5b8654a89c83de4ae3c6454996e9f7bc6b283`, advanced the project-state verification-date upper bound to 2026-09-09 after the first hosted Code quality run exposed the stale 2026-09-08 ceiling. At that exact head, the focused test passed 15/15 and the full local suite passed 4,216 with 3 skips and 0 failures.
- Hosted run `34325535135` passed at exact `23f5b8654a89c83de4ae3c6454996e9f7bc6b283`: Code quality in 4m11s, Browser build in 2m26s, Browser QA lanes 1–4 in 12m24s, 11m15s, 17m56s, and 12m59s, and aggregate `qa` in 3s. Any later head, including a receipt-only documentation head, must pass its own hosted checks before it can be treated as exact-head evidence.
- CodeQL, Vercel, and CodeRabbit did not appear or run in the new repository; they remain later setup findings, not passed gates. Codex GitHub review completed only on the earlier `953e04c680d497851cdb6b6533b92de8f9b1c4f2` head and is not an exact-final-head review.
- Every future Browser QA acceptance cycle must create a new independent empty QA project, pass the non-production identity and fingerprint gates, apply exactly the 46 committed migrations, prove every application table empty, delete the cycle-owned project, and prove it absent. Production data must not be supplied, copied, read, or altered.
- Stop before Phase 3. The recommended next branch is `codex/atmoshaper-docs-consolidation`, but Phase 3 planning and execution require separate review and authorization and have not begun. No deployment, provider/domain cutover, production database change, runtime rebrand, legal cutover, or bootstrap-PR merge is authorized.

## Historical Snapshot Addendum — Hosted review round 24

- This addendum supersedes the round-23 current-receipt wording above without changing the historical line-addressed evidence. Hosted review round 24 is now historical. Five validated hosted findings were repaired: plain assignment can preserve scope-safe `createRequire(import.meta.url)` loader provenance; environment `in` checks distinguish exact static keys from hash-only dynamic or joined provenance; semantic CommonMark reference definitions provide owner-relative asset evidence; malformed CSS `url(...)` recovery is fully masked without hiding adjacent valid URLs; and `generated/` is recognized at repository root or deeper. Quality review ultimately returned PASS after 34 focused Round 24 checks. The full suite recorded 4,434 total, 4,431 passed, 3 host-dependent skips and zero failures; typecheck, lint and build passed. The informational Babel greater-than-500-KB note remained non-failing. The build skipped the production migration gate outside Vercel Production, generated 115 static pages, and retained the existing Anatomime poll-shedder initialization notice. Pre-document staged audits ran twice with exit 0, empty stderr, byte-identical output, shared inventory and `deletionAuthority: false`: dead code 1,584/211 (`b65ebdc62722c5b15c4fa48e49f9e9e50189f027f333e1ad1aaa9980764895b3`), dependency 2,873/21 (`75e280f7a660eb2dbbeca004e75a4f0e1a767307dd7e8035391bf0b7fa0dcbee`), asset 557/11,630 (`10ac976ea6b661b0784bde6c5466f56cc6b1f6952b0fb21693ad3ba5504af1b1`) and environment 587/252 (`a1479454e1d7a56218cbd5cb72f173b2fd45a0b3d0026a95448a580b827b43ed`). The pre-document inventory contained 1,932 files, 47,888,742 Git blob bytes, inventory SHA-256 `467f98da77b03130be36c7e9203940dcc75bc4ed8b8e2c4aad8035aedee02076`, CRLF output SHA-256 `189751af76d128a4b07faf215c8a5d795810d3b1c737e4215e3d26e6bb68bf17` and zero forbidden paths; brand remained zero missing/zero unclassified (`50a8f6f48d60f51c00edfd2b0a5005289e007e9939f18862beaa5e83667ecd2b`). These values became historical after tracked-document staging. Round 24 head `889ab55` is already pushed. Later hosted follow-up is recorded in round 25; merge remains separately authorized. No candidate deletion, provider mutation, merge or Phase 5 action occurred.

## Historical Snapshot Addendum — Hosted review round 26 integrated fix wave

- The integrated review initially returned CHANGES REQUIRED for compound-assignment callable/provenance promotion, sloppy CommonJS Annex-B block-function ownership, getter-before-setter destructuring evidence, and five documentation/index-status contradictions. All four findings are addressed; re-review returned SPEC PASS / QUALITY APPROVED with 58/58 focused checks.
- Only plain `=` preserves RHS callable/provenance. All 12 arithmetic/bitwise compound assignments avoid false exact evidence; logical assignments remain supported. Sloppy `.cjs` Annex-B block functions retain the outer callable binding, while strict `.cjs` and `.mjs` retain block scope. A paired setter preserves the preceding getter; later data/getter definitions still replace it in source order. Full cleanup passed 324/324; environment evidence remains 559 findings and 5,751 uncertainties with `deletionAuthority: false`; the source-cap maximum is 480 nonblank lines. The 291 confirmed static reads remain distinct from uncertainty.
- The final repository run initially failed only on the stale project-state date ceiling. The minimal test-only change in `tests/family-friends-server-workload.test.mjs` advanced that ceiling from `2026-09-11` to `2026-09-12`; the focused check passed 1/1, the file passed 15/15 and independent review returned PASS. The authoritative final `npm run test` exited 0: 4,543 total, 4,540 passed, 3 expected skips, zero failures, 365 suites and 785,574.5335 ms, with no OOM.
- Typecheck, lint and build passed on the same production code before the one-line test-date edit; the build generated 115 static pages with only standard informational notes. No candidate deletion, provider mutation, product-runtime change or Phase 5 action occurred.
- These five documentation records are included in the proposed commit. Commit, push and latest-head hosted review remain pending; the pushed PR head remains `9c6550f` until those coordinator actions occur. Existing audit hashes are historical because code, tests and documentation changed after those receipts. The final post-fix staged audit identity awaits the coordinator rerun and belongs only in the ignored SDD/current handoff, not these tracked documents. Merge remains separately authorized.

## Historical Snapshot Addendum — Hosted review round 26 before integrated fixes

The following preserves the earlier checkpoint; its test totals, index status
and audit hashes are historical, not the current integrated-fix receipt above.

- Round 26 code is accepted locally. It fixes class-static-block `var` ownership, compacts wide completion states so recursive finally replay completes without out-of-memory failure, preserves mixed process/CommonJS-loader provenance and mixed whole-environment value forwarding, and isolates exhausted deferred invocations from caller scope. These are conservative audit-only repairs; no candidate was deleted and no provider or product-runtime state changed. Every cleanup report retains `deletionAuthority: false`.
- Final current-code gates passed. `npm run test` recorded 4,540 total, 4,537 passed, 3 expected skips, zero failures and 554,265.5792 ms, with no OOM. Typecheck, lint and build passed; the build generated 115 static pages. The Babel greater-than-500-KB message and Anatomime poll-shedder initialization message were informational only.
- The accepted PRE-DOCUMENT staged-index audit receipt ran inventory, brand, dead-code, dependency, asset and environment commands twice. Every run exited 0 with empty standard error, valid byte-identical JSON, and identical raw/CRLF-normalized hashes in this run. Inventory was 1,947 files, 48,145,340 bytes, zero forbidden paths, and identity `06d007d1caeee21ab8b7ed9b7a4d6fe9c41f5e6fa0a274587675d607f92019a3`. Dead code was 1,629 findings/211 uncertainties; dependency 2,886/21; asset 557/11,630; environment 559/5,751; brand remained zero missing and zero unclassified.
- Environment evidence is precision-limited: 559 findings comprise 79 declarations, 189 missing declarations, 291 confirmed static reads and zero unread candidates; the separate 5,751 uncertainties are not confirmed reads. They comprise 94 computed accesses and 5,657 unproven aliases: 3,608 call-expansion-budget receipts, 2,017 property accesses, 17 element accesses and 15 spreads, with unproven scopes split runtime 2,852, tests 2,118 and tools 687. Invocation analysis permits 128 expansions per outer invocation and 64 nested levels; environment-only completion compaction joins matching completion kinds and target identities above 32 outcomes. Exhausted immediate calls conservatively widen reachable bindings; exhausted deferred inspection uses an isolated scope. All 15 formerly exact sites are accounted for by seven site-specific uncertainties and eight sites inside containing budget receipts. Independent 120/130/200-uncalled-arrow probes retain the exact environment read with no ordinary-object uncertainty and 0/3/73 budget receipts. This is bounded audit evidence, not exhaustive environment coverage or deletion authority.
- This receipt is historical once these tracked documents are staged because their blobs change the inventory identity. Exact post-document staged hashes belong in the ignored SDD handoff and current coordinator receipt, not recursively in these tracked documents. Documentation is updated and staged; coordinator code fixes, final verification, commit, push and latest-head hosted review remain pending. The pushed PR head remains `9c6550f` until the coordinator performs those steps. Merge and Phase 5 remain separately authorized.

## Historical Snapshot Addendum — Hosted review round 25

- This addendum supersedes the round-24 current-receipt wording above without changing historical line-addressed evidence. Round 24 head `889ab55` is pushed and historical; round 25 is the current staged, pre-push Phase 4 audit-only receipt. Four valid hosted findings were repaired: conditional and loop environment assignments join every normal-reaching path; deferred function-body alias writes are analyzed without changing declaration-time outer state; branch joins retain possible CommonJS-loader provenance; and loop assignment/incrementor proof includes every reaching `continue` path. Markdown inline/fenced-code destinations remain intentionally hash-only uncertainty, and CSS bad-URL recovery already follows CSS Syntax 4.3.15, so those two findings were rejected without behavior changes. Independent SPEC and QUALITY reviews passed. The accumulated focused Round 25 suite passed 46/46; the full suite recorded 4,480 total, 4,477 passed, 3 host-dependent skips and zero failures; typecheck, lint and the 115-route build passed, with the Babel greater-than-500-KB and existing Anatomime poll-shedder notices informational. Diff/source checks passed and the maximum maintained source size was 499 nonblank lines. Pre-document staged commands ran twice with exit 0, empty stderr, byte-identical output, shared inventory SHA-256 `e5228c0739194704755eabbce0896b0c6dd490c5421c64827e6ad9aff492436a` and `deletionAuthority: false`: dead 1,608/211 (raw `f15f7817bb2a2eed9fcd8af86cfea6853bdc40691dace3c2a1a71739353425f9`, CRLF `e12412da7923f04f772ce28bdc622e3a87a9cc257d5d8078b55f8e0ed3f5808c`), dependency 2,879/21 (raw `ca5113c8ab5f8dc8b4cc6955f4660378f78f89acf4e505841e10b38fd08140d4`, CRLF `6c6d5d7d4f5b70cfbdc1be2d526921b4b56a49e6a0fe868ea66de0f6679c1176`), asset 557/11,630 (raw `e5b1c9293a0eff98647bde6b111af82332a034abad2194e5797cd355b6dfbae0`, CRLF `e9f5046ba4a65fe271e31621e25e3604fd3cc1c8aca5b40d4b87c3e900067b52`) and environment 587/252 (raw `8a57296a932ac5066605b77b404c9a9c530dec1951d58e41ced946b138c7f0d3`, CRLF `2f7ab1fd70ca723b8ffa328fdc7c7ec0c6359d5fabe15d89da58c8e4364d0196`). The pre-document inventory was 1,940 files/48,002,713 bytes, raw output `f808ed400b25234f19c32bec5fa967a2ac741ee258df741b9b5589a41b0c5d07`, CRLF `1e71bdb69781109c5e33420f550575994d42a5b6e3feb7e3b334fe1e5eeb5763`, forbidden 0; brand was zero missing/zero unclassified (raw `fd1b776fe062af1215ef24b18f14fab558f9c13265f4f1d78aa483d74d361c84`, CRLF `50a8f6f48d60f51c00edfd2b0a5005289e007e9939f18862beaa5e83667ecd2b`). These pre-document values become historical after staging; exact final staged identity remains only in the ignored SDD handoff. Round 25 is not committed or pushed; latest-head hosted follow-up remains pending and merge separately authorized. No candidate deletion, provider mutation, merge or Phase 5 action occurred.
