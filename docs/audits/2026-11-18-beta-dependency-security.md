# Beta runtime dependency security update

Status: **the reviewed dependency update is published in `8d89550`**.
The historical validation below describes its preparation and green `99c297b`
checks. The [release receipt](2026-11-18-beta-purchase-activation.md) records
publication. The subsequent post-refund access correction is a separate local
candidate; this dependency receipt does not claim that correction is published.

## Resolved changes

| Component | Prepared version/change | Purpose |
| --- | --- | --- |
| Next.js / ESLint config | 16.4.6 | Patch framework advisories, including the applicable App Router Server Actions denial of service |
| Sharp, direct and Next override | 0.35.5 | Include fixed image-processing native dependencies rather than retaining the old explicit override |
| Sentry Next.js | 10.78.0 resolved, minimum 10.75.2 | Patched major-10 SDK; preserve error-only/privacy/source-map policy |
| Nodemailer | 10.6.0 behind the unchanged historical alias | Patch mail parser/transport advisories while retaining the fixed-field API and Node 24 |
| Prisma CLI/client/Neon adapter | 7.10.1 | Align the major-7 packages with fixed config/deepmerge dependencies; no schema change |
| brace-expansion / source-map-js | Existing major-specific overrides raised; source-map-js 1.2.2 | Prevent an older transitive copy from surviving installation |
| Root Zod 3 | Unused direct dependency removed | No application/library/script import or non-root consumer used that copy; development tools retain their own dependencies |

The original Sentry tunnel advisory's vendor prerequisites do not match this
application: no tunnel is configured and the public build uses Turbopack. Its
aggregate audit label was not evidence of an observed authorization bypass.
Two new ESLint warnings are handled with focused documented exceptions retaining
existing full-document navigation, including escape from a revoked auth session.
No navigation or authorization behavior was rewritten for the dependency update.

Hosted Browser QA found a real CSS ordering regression: the shared Button's
display utility overrode the background tray's single-class hidden rule. The
focused selector now wins independently of stylesheet order while retaining
the existing short-landscape Info control. Both desktop/mobile assertions
reproduce the problem on the previous artifact; Linux baselines remain unchanged.
The two Windows baselines still contained older purchase wording superseded by
the October 26 source/CI fixture repair. Their reviewed differences are that
hint and its mobile text wrapping; those two images are refreshed to the
existing guarded copy. No product copy or screenshot tolerance is changed.

The Music outage fixture also needed to cover the framework's new automatic
chunk transport retry. One rejected request now recovers successfully, so it
cannot test the app's explicit recovery control. The fixture fails matching
loads throughout the initial document and permits them after the user's Retry
reload. The same visible-error, hover/focus stability, reload and physical-tap
activation assertions remain; the corrected test passes locally. No audio
runtime behavior or timeout is weakened.

## Audit result and residual scope

The original production audit reports 17 affected package entries: two critical,
eight high and seven moderate. The final aligned production audit reports
**zero critical, zero high and eight moderate**. This is not a zero-finding
whole-repository claim.

The residual direct reports concern fast-uri under Ajv, glob/minimatch under
Sentry's bundler or transpilation tooling, and postcss-selector-parser under
Tailwind/PostCSS. Sentry bundler/webpack/Next and Sucrase entries also inherit
those reports. Source/dependency review finds build/schema/CSS/file-pattern
inputs rather than an application HTTP input path. Those package flaws remain;
major build-tool overrides were not forced into incompatible consumers. This
limited reachability assessment is an inference, not an exploit test or proof
of every possible consumer.

The all-dependency audit separately retains a critical proxy-addr finding in
the development-only Express tree. It is excluded from the production audit;
no application Express server or development tool server was launched here.
Its development-tooling remediation is still open. Do not describe all reported
vulnerabilities as fixed.

## Validation

- Environment-free isolated install completes and the existing package patch applies.
- Prisma 7.10.1 generate and validate pass without a database connection.
- Final typecheck passes; final lint passes with zero warnings/errors.
- Nineteen final dependency/artwork/inert-mail checks pass. They check every
  resolved security-floor copy and exercise actual fixed-field stream delivery.
- Seventy-six Sentry/privacy checks pass on the resolved 10.78.0 SDK.
- Optimized build passes compilation, TypeScript and page generation. Its live
  Production readiness gates correctly skip outside Vercel Production.
- The complete bounded provider-free suite passes: 5,681 total, 5,677 passed,
  four existing host/context skips, zero failed/cancelled.
- Initial hosted code quality, browser build and three browser lanes pass.
  Lane 3 reports the two background snapshots and Music outage fixture above.
- Rebuilt isolated Browser QA artifact passes. Corrected desktop/mobile
  background checks and the mobile full Retry/playback journey pass without
  snapshot-update mode (one desktop ownership skip is expected).
- The existing production-background responsive journey passes both portrait
  and short landscape, including opening Info in the compact layout.
- Full lint passes again.
- Follow-up `99c297b` passes every job in
  [hosted CI](https://github.com/dsbowersock/atmoshaper/actions/runs/44391726173):
  5,676 unit checks passed, five explicit Windows/catalog skips, zero failures.
  All four Chromium browser lanes pass: 127/174/172/141 passed and
  25/52/44/59 skipped respectively. Matrix ownership and opt-in/live-provider
  cases are separate from executed browser evidence; no real payment or game
  binding is proved by these provider-free fixtures.
- The existing responsive journey also passes against the optimized artifact
  through the public `/clock` caller, including portrait, short landscape and
  opening Info. An initial extra attempt used the development-only Clock caller
  and reached its production 404 rather than the panel. A temporary owned test
  copy changed only that entry path; the full unchanged assertions passed and
  the temporary copy was removed. The candidate worktree remains clean.

No credential, provider setting, database migration, real message/payment or
public promotion belongs to this local preparation. Build/publication and the
remaining payment activation need their concrete reviewed operation scope.
