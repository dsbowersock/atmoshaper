# Notes access guidance

The Notes dashboard and direct-route gate previously said an active Therapist or
Team/Practice membership was required. The current public catalog and Checkout
offer only Supporter, whose benefits exclude documentation access. The actual
gate already checks `canUseLocalClinicalTools`; compatible historical
memberships, full-administrator access and eligible current feature grants can
supply that capability. The old purchase-oriented wording did not describe
those rules accurately.

The dashboard and gate now describe documentation access on the account and
explicitly say that Supporter does not unlock these tools. The signed-in button
says “View account access” and retains the existing account destination, which
can show current entitlements and temporary grants. Support is suggested only
when the user expected access; the copy promises neither a grant nor a new
membership tier. The existing development-funding card remains separate from
access eligibility.

No capability, entitlement resolver, membership compatibility, route, link
destination, CSS class, local-vault behavior or legal text changes. Existing
browser expectations are updated to the new wording without changing their
flows or assertions about denial. The focused gate JSDoc records why the copy
must describe the capability rather than a purchasable tier.

## Validation

Based on merged source `d1a5474908e0d4a8f6a976060f6f80a6fe110c46`:

- All three existing `tests/notes-entitlements.test.mjs` checks pass.
- ESLint passes for both changed components and all three changed test files.
- `npm run typecheck -- --incremental false` passes.
- The exact diff contains only guidance, one JSDoc and expected-copy selectors;
  whitespace checks pass.
- Independent source review finds no actionable issue in this bounded change.

No application build, server, browser campaign, database, provider, payment,
email, credential access or Production operation was needed. Browser expectation
updates have not been exercised against a running application in this local
copy-only check. Shared publication, hosted CI/review, merge and public release
remain separate decisions; this document does not claim final migration or
deployed-product acceptance.

## Review follow-up: remaining dashboard selectors

The initial expected-copy update missed the anonymous Notes dashboard assertion
in local-first.spec.ts. Codex identified it in review: the removed
Therapist/Team-Practice wording would prevent that test from reaching its
direct-route and clinical-network checks. A same-pattern search found the
obsolete Notes readiness locator in the explicitly gated migration-parity spec
as well. The earlier source review did not catch these two consumers.

Both selectors now require the actual “Documentation access required” copy.
Navigation, lock/denial and network assertions remain unchanged. The parity
change affects readiness only: screenshot assertions and existing baselines are
preserved, and no parity capture or baseline update is claimed. Any intentional
copy difference still needs its proper visual disposition when that campaign
runs. Independent source review confirms the owner/scope boundary.

All three Notes entitlement checks, scoped lint for the two affected browser
specs and whitespace checks pass. No app/runtime source changes or new local
browser campaign were needed; the new PR head still requires its own CI and
applicable hosted review.
