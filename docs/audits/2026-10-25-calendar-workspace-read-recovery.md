# Local Calendar workspace read recovery — October 25

Runtime/source commit: `16e99df85ed83b2368efad373bc1ac082357261a`.
Local branch: `codex/calendar-workspace-read-recovery`, child of the pinned Notes
candidate. No push, PR, merge, deployment or provider operation is included.

## Problem and change

Membership lookup had a friendly unavailable result, but six later required read
failures escaped the real async Calendar page. All required workspace reads now
produce one usable result, or the existing generic unavailable surface. Failed
reads cannot look like an empty, available schedule. Data transformations remain
outside the I/O catch. The helper receives the authorized practice and current
user explicitly. It adds no query, mutation, schema or entitlement behavior.

## Evidence

- Same actual-page fixture on the retained parent: 8 pass, 6 fail. Final: 14 pass,
  zero fail/skip. It covers six faults, earlier gates, no practice, empty/populated
  workspaces, unauthorized practice input, dates and generic busy-block privacy.
- Existing related suites: 83 sync/adapter/isolation and 72 display, creation,
  availability, policy, preference and workspace tests pass. Total: 169 pass.
- AST comparison preserves all seven Prisma call argument projections after only
  practice/user helper-parameter and shorthand normalization.
- Scoped lint and typecheck pass. Full cached webpack Browser-QA build passes;
  six guard receipts have zero network or unrelated-executable attempts. The real
  selected DSEG7 asset is included. No install or Prisma generation occurred.
- All 2,189 archive inputs match the frozen snapshot and checkout under Git's
  configured text conversion. Screenshots use the actual page, AppSurface, Card
  and CalendarOperatorShell with the completed candidate's compiled CSS.
- Static SSR fallback is visible and fits 1440x1000, 390x844 and 320x740. Final
  browser errors, blocked requests and private-error exposure are zero. Browser
  plugin is absent; cached Playwright/Chromium is used. This does not exercise
  an authenticated route or real database/provider outage.

## Retained corrections and cleanup

The first extraction omitted the current-user helper input; positive regressions
caught it and it was corrected before final validation. Initial Chromium launch
exited before the fixture and its cleanup executable was denied; the exact PID
was proved absent before the outside-sandbox check. TypeScript's first cache
write was denied; the same typecheck passed outside the sandbox. These outcomes
remain recorded, without application-error or success claims for those attempts.

The earlier parent CSS differs from the final bundle, so the three views were
repeated successfully with the actual completed candidate CSS. Both results and
the original comparison are retained. Final screenshots were visually inspected.

Task-owned browser profiles/processes, source/build/archive, compiler/npm caches
and two dependency links are absent. Shared dependencies/generated schema,
unrelated work, historical evidence and the separate prepared account/admin
artifact remain. No account, calendar row, provider credential, email, payment,
cloud media, public routing or Sentry state was accessed or mutated.

## Remaining gates

Local account/admin database acceptance and publication decisions remain pending.
Real Calendar persistence, Google provider acceptance, independent media delivery,
all-purchase activation and final hosted/PWA/artifact/rollback/commercial-hosting
decisions remain separate migration gates. This is a narrow source recovery pass,
not completion of Calendar integration or the full migration.
