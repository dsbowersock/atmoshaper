# Launch answers, shared planner context and PDF reports

Status: implemented and verified locally on `codex/planner-reports-reuse`, from
`37bdcbc`. No deployment, live account, database or provider action is included.

## Intended result

Turn the launch checklist into a useful working document: retain the existing
25 checkmarks and six groups, add a response for every task, optional practice
identity/contact fields and a final report stage. Writing does not check a task.
Resetting checkmarks preserves written responses. Migrate old flat boolean drafts
additively under their existing key and preserve unread-storage recovery.

The outline reads locally saved checklist, Income, Break-Even, Service Menu and
Add-On drafts. Reuse structured facts as labelled context and report content,
without overwriting the user's eight existing narrative fields or requiring
copies. Profile/resume/checklist details and service/policy information can be
used directly. Financial tools remain separate scenarios with named assumptions;
never sum or reconcile their estimates automatically. Missing, corrupt or
unreadable sources are identified, never replaced with invented sample budgets.
Allow source refresh and inclusion choices before export; reads never mutate
other tools. Existing browser/account identifiers remain unchanged.

Both review stages provide a report preview, direct on-device PDF download and
print option. PDFs have searchable text, wrapped paragraphs, page numbers,
source labels, estimates/incomplete markers and clear professional-review needs.
Use lazy PDF dependencies and a self-hosted licensed report font; no planner
contents go to a PDF service. Unsupported glyphs must fail visibly with the
browser print option available, rather than silently dropping text. Keep the
app's existing fonts/materials outside the report unchanged.

All planner headers visibly state informational use and no legal, financial,
tax or accounting advice. Reports include the full notice and tell the user to
review with appropriately licensed/credentialed professionals before decisions
or funding applications. This is tool guidance, not a rewrite of accepted legal
terms. No claim of lender approval, regulatory compliance or a completed loan
application. The SBA's planning guidance informs the report's purpose and
remaining-documents prompts: https://legacy.sba.gov/business-guide/plan-your-business/write-your-business-plan

## Verification

Test legacy migration, response/checkmark independence, safe known-field
normalization, source availability/reuse without overwrite, refreshed drafts,
separate financial estimates and report coverage of all answers/disclaimers.
Generate representative multi-page PDFs (long text, accents, empty/incomplete
plans), extract text and render/inspect pages for clipping, blanks or missing
content. Verify PDF bytes and failure paths, text wrapping and page counts.
In actual-app browser QA, fill/reload checklist answers, revisit steps, reuse
other saved tool values, preserve narrative edits, change inclusion/refresh,
download reports and check phone/desktop/enlarged-text containment. Keep the
existing storage-denial/quota/corrupt recovery and calculation coverage.

Run focused lint, planner/report/preference/metadata checks, inert app build and
applicable browser regressions. Review through CUA, leave the local preview
available and store generated samples/screenshots outside source. Update state
and log with actual results. Old clients cannot preserve new answer metadata;
export an extended draft/report before any later old-client rollback.

## Implementation and results

- The existing checklist key now retains its 25 original flat boolean keys and
  adds `schemaVersion: 2`, known-task `answers` and `practice` fields. Each answer
  has a 12,000-character limit; contact has 600, name/preparer 160. Original
  outline strings retain their full text. Reset checkmarks preserves written
  work; the old client cannot round-trip the new metadata. No identifier or
  account-sync migration is performed.
- The pure report adapter reads only five named business keys. It checks required
  fields, numeric/row shapes and expense periods before importing calculations.
  Missing, malformed, incomplete or denied drafts are identified, with no source
  writes or invented calculator fallback budgets. Opening a tool once can save
  its starting assumptions; users still need to confirm every included value.
  Other tools' scenarios stay independent, with source labels and units.
- Source context refreshes on navigation/remount, window focus, cross-tab storage
  events and explicit refresh. Report inclusion choices do not rewrite original
  fields or source drafts. Checklist responses, profile/resume, services,
  policies, daily capacity, named expenses/reserves and financial assumptions
  appear in their relevant outline sections and in the report.
- Reports use an in-memory snapshot and a self-hosted font request. There is no
  PDF service upload or stored report copy. `pdf-lib@1.17.1` and
  `@pdf-lib/fontkit@1.1.1` are exact pinned dependencies; the added dependency
  names have no npm audit advisories in the checked graph. Existing unrelated
  audit findings are not changed. The font source, hash and OFL license are
  recorded under `public/fonts/reports/`.
- Download text is searchable and measured by glyph width, with line wrapping,
  Letter pages, headers, footers and page counts. Unsupported font glyphs and
  reports over 250,000 characters fail visibly and preserve the draft; browser
  Print / save PDF remains available. The font is scoped to report export.
- Print CSS isolates the semantic report from mounted forms and app navigation,
  removes fixed/scroll constraints and forces a light paper color scheme.
  Header spacing retains the existing 180px phone budget. The report title is
  distinct from the step's focus heading; the focus assertion targets the
  deliberately focusable stage heading.

Final verification passes:

- `npm run test:planner-reports`: 11 tests, including text wrapping, all 25
  responses, old checkmarks, source refresh/exclusion, malformed sources,
  unchanged narrative, PDF bytes/pages, accented names and export failure.
- `npm run test:business-planners`: 49 tests, including existing Strict Mode,
  denied-read, quota and corrupt-draft recovery. Its inline fixture needs a
  known Webpack public path now that real clients reference a lazy PDF bundle;
  export itself is checked against the actual app below.
- `npm run test:income-preferences`: 24 tests; `test:seo`: 17; shared shell/style
  guards: two. Typecheck and focused ESLint pass.
- Final `npm run build:browser-qa`: TypeScript and all 115 pages pass, with inert
  providers and no production gate or migration operation.
- Actual-app desktop/mobile Chromium matrix: all 30 cases pass. This covers
  every guided tool, saved drafts, answers/reload/reset, source reuse after an
  actual Service Menu edit, source inclusion/refresh, preserved authored notes,
  downloaded launch/outline PDFs, browser-printed report isolation, font-fetch
  failure fallback, 320-1280px widths and 24px root text. Existing Income and
  Break-Even results and phone header budget still pass.
- Representative fictional PDFs were extracted with Poppler and rendered for
  visual inspection. All answer markers, accented names and the last long-text
  paragraph survive extraction. Layout inspection covers first/middle/last
  pages, page breaks, footers and browser print. A dark-margin defect found in
  visual review is corrected and the final printed page is white.
- Manual in-app review confirms the phone response controls, Report stage and
  expandable reused service facts without editing user drafts. The temporary
  viewport override is cleared and the preview stays available on loopback
  port 3018. Screenshots, generated PDFs, browser artifacts and build receipts
  are outside source under the session's `planner-reports-reuse` evidence folder.

This is local source/preview completion. No PR, publication, live account,
provider, payment, email, database or legal-document change is included.
