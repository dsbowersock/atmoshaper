# Preserve independent background access after a refund

Status: **completed, published and verified on the owner account**. The approved
amended candidate `1748230` merges as `adb137e`; actual Production checks and
live readback pass. Selection through independent Admin access is available
while purchase ownership and the original refund stay revoked/successful.
See the [final receipt](../../audits/2026-11-18-beta-final-publication.md).
The preparation requirements below are retained as historical implementation
and validation scope, not another live-operation grant.
The [monetary recovery](../../audits/2026-11-18-owned-refund-recovery.md) passed.
The earlier published Clock disabled the refunded background despite unchanged
Admin authority; the corrected release resolves it. No additional financial test
is required.
The [local receipt](../../audits/2026-11-18-post-refund-background-access.md)
records the correction, green full regression and focused validation. The
[publication packet](2026-11-18-beta-final-acceptance-publication.md) defines the
separate exact-source release boundary.

## Domain rule and narrow source change

The [canonical server decision](../../../lib/commerce/background-access.ts)
allows a background through free access, active permanent ownership or an
independent premium feature grant. Revoking a purchase revokes that purchase;
it does not revoke membership, temporary or Admin access. Registry disablement
still defeats every grant. Entitlement decisions remain feature/source based,
never based on displayed plan names.

Correct only the [carousel adapter](../../../lib/background-commerce-client.js):

1. Distinguish active ownership from an inactive historical row.
2. Permit independent authoritative use while keeping inactive ownership
   visible and permanently unowned. An ownership-only stale bridge must not
   defeat a refund, dispute or retirement row.
3. Hide permanent-acquisition actions for any existing ownership row, matching
   the existing server eligibility rule. Do not offer duplicate credit use or
   purchase to repair a revoked record.
4. Preserve current copy, geometry, legal versions, durable background keys,
   backend entitlement/reversal rules and unrelated controls.

## Verification before a new release proposal

- Add failing regressions for independent membership/temporary/Admin access
  across inactive ownership states, the free case, disabled registry entries,
  denied/stale ownership-only access and absence of permanent ownership or
  acquisition controls.
- Update the two older expectations that incorrectly made a refund override
  a still-valid membership source; retain explicit negative access assertions.
- Add an inert desktop/mobile browser journey proving selection and rendering
  after a refund, with no new acquisition action or financial request.
- Run focused client/server/provider/surface tests, the accepted backup helper
  tests, lint, typecheck and the isolated optimized browser build/journey. Keep
  provider secrets absent; do not borrow the live recovery environment.
- Consolidate the already tested beta operations source and dated receipts so
  canonical state, recovery tools and the tester guide can travel with the
  candidate. Preserve newer runtime dependency/CSS fixes when resolving the
  documentation-only merge conflicts.

Freeze the exact candidate and local results before requesting a new publishing
operation. Hosted CI, any automatic protected Preview, an actual Production
all-payments build/map check, one same-artifact promotion and compatible current
`8d89550` rollback need their exact bounded release authority. The recovery's
permission/refund grant does not authorize another deployment. After an approved
publication, verify the existing refunded account's selectable background and
retained refund history without a new payment or preference change. Then finish
the beta scope/support handoff; do not imply full legacy migration or held-media
admission is complete.
