# AtmoShaper provider-readiness evidence

## Readback evidence

- Exact source commit: `06cb73035c7695a5f96e19a5ee9274f2e16c1c6a`.
- Exact-main CI: run `36296398216`, seven jobs passed.
- HTTP: six public or anonymous endpoints returned 200; signed-out session was
  exactly `null`.
- Prisma: client generation passed; schema validation passed.
- Stripe: three customers, one active monthly subscription, one canceled monthly
  subscription, six current recurring Prices, one active default portal, and one
  enabled fifteen-event legacy webhook. No object was changed.
- Vercel: required auth/database/SMTP variable names are present; Stripe,
  Calendar, Sentry, Ably, and R2 credential variable names are absent.
- Neon: destination aggregate readback not established because authenticated
  CLI scope exposes only the source project and protected Vercel secrets are not
  exportable.

## Evidence boundary

Provider identifiers, customer identities, secret values, database rows, and
connection strings are deliberately omitted. Detailed command output remains
ephemeral and is not a substitute for a current provider readback.

## Validation

- `npm run prisma:generate`: passed.
- `npm run prisma:validate`: passed.
- Focused provider and migration contracts: 65 passed, zero failed.
- Focused Windows mutation-probe contracts after the portability repair: 93
  passed, zero failed.
- `npm run test`: 4,955 passed, zero failed, three skipped.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run brand:audit`: zero missing, unclassified, or category-mismatch
  references.
- `npm run repository:inventory`: 2,012 tracked files and zero forbidden paths.
- `git diff --cached --check`: passed.

The PR is intentionally left unmerged for morning review. Hosted check identity
is external to this committed evidence record and must be read fresh from GitHub.
