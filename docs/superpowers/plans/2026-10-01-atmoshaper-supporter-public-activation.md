# AtmoShaper Supporter public activation

Status: executed under separate user authorization on 2026-10-01
(America/New_York). Future activation or rollback operations still need their
own applicable authorization; this receipt is not standing deployment authority.

## Execution receipt

- The user approved the exact two flag updates, one candidate build, conditional
  promotion, and bounded rollback. This superseded the earlier pause instruction.
- Only the two Production pause controls changed to `false`; both excluded
  purchase switches remained unset. Existing credentials were retained.
- The activation candidate used exact reviewed source
  `7756080c3bc650bdbcff33013ff67728a3f97efa`. The actual live Supporter-only
  check passed at `2026-10-02T01:21:04Z`, both catalogs reported `stripe_api`,
  the read-only migration-status gate passed, and the app build reached `READY`.
- The owned convenience alias was restored before promotion after Vercel's
  known `--skip-domain` side effect. Conditional promotion then succeeded and
  all four original aliases read back at the approved candidate.
- Public GETs of `/`, `/pricing`, `/register`, `/support`, `/legal/privacy`,
  `/legal/terms`, and `/api/auth/session` returned `200`. Registration renders
  controlled email/password inputs by ID, and both public pause messages are
  absent. The signed-out session body is `null`; apex `/register` redirects
  with `308` to the canonical matching route.
- No submission, live test, charge, refund, test email, migration application,
  catalog mutation, or private database-row write occurred. Temporary source
  staging and environment exports were removed; the prior paused deployment is
  retained for rollback. Browser automation was unavailable because its policy
  check could not be verified; GET/source proof does not claim a browser smoke.

The reviewed proposal below preserves the operation's scope and rollback
contract. Variable values in its table describe this completed change.

## Intended result and authority

Open new-account registration and recurring Supporter Checkout on the existing
AtmoShaper production site. Keep one-time support and background purchases
disabled. Preserve personal/business classification, Portal isolation, existing
entitlements, compatibility identifiers, legal acceptance, and local-first records.

When this proposal was prepared, the latest instruction kept registration and
Checkout paused. Earlier activation approval from the reference chat did not
override that newer instruction. The PR #34 merge and first unpromoted verification
build did not authorize activation; the subsequent explicit approval above did.
[AGENTS.md](../../../AGENTS.md) requires exact separate authorization for provider
writes and production changes. This plan makes those actions reviewable.

## Completed prerequisites

- PR #34 merged as `7756080c3bc650bdbcff33013ff67728a3f97efa`. All seven hosted
  CI jobs, exact-head Codex and CodeRabbit reviews, and actionable-thread closure
  passed for its reviewed head.
- The actual live Supporter-only readiness command passed in one authorized
  remote Production-target build using existing write-only credentials. Both
  Portal catalogs had Stripe API evidence; all twelve Prices, six-Product
  topology, recurring-tax attestations, and the pinned webhook passed.
- The read-only migration-status gate and app build passed. This candidate
  contains the paused configuration and cannot open registration or Checkout
  simply by being promoted.
- The controlled live payment, cancellation, full refund, and signed-webhook
  convergence are complete. Do not repeat them.

These are dated receipts. Refresh the exact source and provider state before
executing an authorized activation; preserve private identifiers only in the
protected operator context, never this plan or public evidence.

## Exact authorized changes

Use only the existing linked AtmoShaper Vercel project's Production environment.
Update the two existing, non-secret controls explicitly:

| Control | Before | After |
| --- | --- | --- |
| `MASSAGELAB_PUBLIC_REGISTRATION_PAUSED` | `true` | `false` |
| `MASSAGELAB_SUPPORTER_CHECKOUT_PAUSED` | `true` | `false` |

Leave `STRIPE_ONE_TIME_SUPPORT_AUTOMATIC_TAX_ENABLED` and
`BACKGROUND_COMMERCE_PURCHASING_ENABLED` false or unset. Do not change Stripe
keys, signing secrets, Prices, Portals, tax settings, webhook permissions, database
configuration, domains, DNS, mail, media, or legal documents.

## Execution sequence after approval

1. Verify hosted `main`, its reviewed source, the clean rollout worktree, and no
   conflicting operator activity. Start from the reviewed PR #34 merge unless a
   newer reviewed source is separately selected. Capture current alias owners,
   a READY paused rollback deployment, both pause flags, and both disabled-flow
   switches. Stop on unexplained drift or any loss of readiness evidence.
2. Update only the two Production pause controls to `false`. Existing deployment
   instances retain their saved environment; the live paused release stays in
   place while the replacement builds. Read back the exact changes without
   exporting or printing secret values. Keep rollback references locally.
3. Package only tracked files from the approved source. Use a temporary source
   copy, the existing project link, and an external one-off build configuration.
   Dry-run the upload to exclude local evidence, dependencies, `.vercel`, and
   credential files; `.env.example` is the only permitted dotenv example.
4. Run one Production-target candidate with `--prod --skip-domain`, using existing
   secrets and this temporary build command:

   ```text
   npm run stripe:readiness -- --supporter-only --live --verify-stripe --no-dotenv && npm run build
   ```

   Preserve the normal read-only Production migration-status gate. Readiness
   failure must stop before the app build. Apply no migration and make no charge.
5. Confirm exact-source READY status, the actual readiness PASS, all required
   Stripe API results, the migration-status PASS, both new pause values, and both
   excluded flows disabled. `--skip-domain` previously moved one convenience
   alias while retaining the public domains: inspect all captured assignments
   and restore that exact convenience alias if it moves before promotion.
   Do not replace an alias whose ownership changed through unrelated work.
6. Promote only the verified new candidate to the existing project domains. This
   is the public activation step and must be included in the authorization.
   Confirm the canonical public hosts resolve to the approved candidate and
   preserve the existing apex redirect contract.
7. Use GET-only public smoke checks on home, Pricing, registration, and signed-out
   session handling. Confirm registration renders the normal form and the
   Supporter pause message is absent. Verify the two excluded flows remain
   disabled. Submit no registration, create no Checkout Session, open no new
   subscription, send no test email, and repeat no live transaction.
8. Record only sanitized outcomes in project state and log. Remove temporary
   environment exports, source copies, and the one-off build override. Preserve
   the prior deployment, completed payment-test evidence, and billing history.

## Stop and rollback

- Before promotion: on readiness/build/configuration failure, stop and restore
  both Production pause controls to `true`. Keep public aliases on the saved
  paused release; restore only an exact owned convenience-alias side effect.
  Do not repeat builds or replace credentials to force a pass.
- After promotion: if registration, Supporter pause behavior, alias ownership,
  or another required public smoke fails, restore both controls to `true` and
  return the captured project aliases to the saved READY paused deployment.
  Verify closed gates and preserve all users, memberships, webhook receipts,
  legal acceptances, and other data. Rollback must not refund, cancel, delete,
  rewrite history, change DNS, or retire provider endpoints.

Authorization should cover the two flag updates, one candidate build, promotion
after all checks pass, and the bounded rollback above. One-time support and
background purchasing remain outside the approved launch scope.
