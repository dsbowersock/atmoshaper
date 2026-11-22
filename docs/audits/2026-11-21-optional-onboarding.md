# Optional setup and saved progress - local verification

The owner requests a one-time optional invitation after signup and a permanent
guided setup entry in Account settings. The follow-up asks to save unfinished
progress and offer to continue on return. This is source work on
`codex/home-dashboard`, alongside the existing local home and Clock changes.

## Result

- Only a newly created password or Google account receives a pending invitation.
  Existing sign-in, account linking and registration retry paths do not reset it.
- Verification and current Terms/Privacy acceptance remain required. Ordinary
  entry returns Home or the original safe destination, rather than forcing
  onboarding on every login. New users can Start guided setup or choose Not now.
- An authenticated action claims the invitation once. GET, SSR and prefetch do
  not write. Parallel tabs share the owner lock; stale choices cannot replace an
  already made choice. Claim/choice actions check the rendered account owner.
- Guided setup autosaves bounded role, use-case, jurisdiction and shortcut
  answers into a separate account draft, beginning when setup is explicitly
  opened. Drafts do not apply preferences or claim completion. No clinical
  content is collected. Save & leave and Finish wait for acknowledgement.
- Saved drafts prefill the form. A started unfinished draft receives one
  Continue setup / Not now offer at the next sign-in or return to Home. Home
  displays an inline card without hiding its tools. A consumed/declined
  continuation is not automatically offered again. Drafts remain accessible in
  Account settings, including after Not now.
- Draft revisions and the same owner lock reject stale tab saves and late
  autosaves after completion. Completing applies the answers, removes the draft
  and ends reminders. Generic preference sync cannot replay lifecycle/draft
  fields from another device. Unrelated app settings are retained.
- Account > App settings keeps Open guided setup, Edit profile and Credentials
  alongside the independent theme/layout preferences. Manual setup needs no
  invitation and never grants verified roles or entitlements.

## Local checks

- `npm run test:optional-onboarding`: 167 passing checks. Includes actual
  registration transactions, legal-gate action/page routing, invitation ownership,
  parallel claim locking, continuation state, normalized draft restore,
  completion, stale revisions, unsafe callbacks and preference preservation.
- `npm run test:optional-onboarding-browser`: real UI/CSS in installed Chromium
  with fictional loopback actions. Covers 320px/390px phones, tablet/desktop,
  touch-target containment, keyboard access, Strict Mode, explicit choices,
  retry, unmounted replies, serialized autosave, shortcut reorder persistence,
  saved-answer restoration, continuation, Finish waiting and revision conflict.
- `npm run test:home-dashboard`: all 94 checks pass after adding the optional
  continuation slot. The redesigned launcher, wordmark and streaming/hydration
  behavior remain intact.
- `npm run lint:optional-onboarding` and the ordinary full `npm run typecheck`
  both pass on the final candidate. No type-check exclusions are introduced.
- The embedded browser confirms saving a fictional answer, leaving, restoring
  that answer after reload and showing the Continue setup offer. No real account
  is opened or changed.

Ignored evidence lives under `output/optional-onboarding/`, including phone
invitation, saved-progress and continuation screenshots. A fictional preview is
available with `npm run preview:optional-onboarding` on loopback port 3028.
It is not a signed-in account or a live signup test. The regular guest home
preview remains on port 3025.

## Release boundaries

No schema migration, live signup/email, provider write, hosted database write,
push, merge, build publication or deployment occurs. No legal documents or
acceptance versions change. The final branch still needs Codex/CodeRabbit source
reviews, applicable hosted checks, approved release preparation and verified
publication. The public site remains on its previously verified release.
