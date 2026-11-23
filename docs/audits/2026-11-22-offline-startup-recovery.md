# Local correction for failed startup reads

November 22, 2026. Prepared locally; not pushed, merged or published.

Current closeout: the startup delta completes CodeRabbit review with zero issues
on all 10 changed paths. The later [grouped hosted-review correction receipt](2026-11-22-offline-hosted-review-corrections.md)
supersedes the in-progress validation checkpoint below: application `15b7f55`
passes its local checks and exact normal APK acceptance. The grouped delta is
also reviewed; fresh hosted checks/review and the source/publication amendment
remain required before updating PR #80.

Hosted Codex review on PR #80 identifies a real preservation failure in the
initial native settings load. `store.load()` fulfills with fallback defaults and
`ready:false` after a transient opening failure. The app previously autosaved
that fallback immediately; if opening then recovered, it replaced an existing
committed timer/settings record and reported the replacement as saved.

A real Chromium/IndexedDB regression seeds a synthetic running timer and color,
fails only the first Core opening, then interacts with the fallback timer. It
fails against release candidate `5f76890` because the committed deadline/color
are overwritten. The prepared guard refuses all Core autosaves for a mount whose
initial read failed. Tools remain available for an explicitly unsaved session;
the status explains that reopening retries the saved settings. The timer hint
claims a saved deadline only after acknowledgement.

The same regression passes after the guard: the prior record remains unchanged,
breathing works during the fallback session, and reopening restores the original
timer deadline and color. Both full Core browser cases, all 11 Core/storage unit
cases, focused Core ESLint and ordinary full TypeScript checks pass. Delta review
and the corrected exact APK remain in progress at this checkpoint. No production
account or actual user data is used.

The public verification key and all 90 provider setting metadata entries are
unchanged. The current live release remains `0eb02e0`. PR #80's hosted build/
checks and full CodeRabbit review still refer to `5f76890`; they do not certify
the unpushed correction. No merge, Production build, promotion or real receipt
has occurred. The already built `5f76890` APK is not the corrected phone artifact.

The [release amendment](../superpowers/plans/2026-11-22-offline-startup-recovery-release.md)
will identify the tested correction candidate, its bounded delta review and the
additional PR push/Preview/checks before publication. It requires authorization
because the original activation scope freezes application logic beyond its
expected public-key binding. The previously approved signing settings and
publication objective are retained; no additional key is proposed.
