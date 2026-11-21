# Resolve the four final review issues

The owner now requests resolution of F1–F4 from the completed review at
`07a3dcd`. This is a new bounded follow-up to the closed eight-request campaign.
Preserve its receipts and the already tested local checkpoint `b316461`.

1. Retain F1's independent bounded Checkout confirmation and original create
   deadline. Re-run its slow initial/retry success and terminal replay fixtures.
2. Reproduce F2 with a real synthetic child-before-parent Git history. When the
   first observed baseline contains branch work, use the actual bootstrap blob
   and commit. Coverage still requires a completed range chain or wider receipt;
   changing the baseline alone never grants coverage.
3. Reproduce F3 with literal Unicode, tab, newline, quote and whitespace Git
   names. Read diff and tree paths with NUL framing; use the same literal paths
   in local batch preparation. Keep existing raw receipts unchanged.
4. Preserve F4's real CLI tests proving missing/string pagination markers on
   both first and later pages result in failure, never partial readiness.
5. Run focused audit/payment checks and lint, TypeScript and the full captured
   public inventory. Freeze one correction delta from `07a3dcd`, then request
   one included-allowance CodeRabbit follow-up and verify its actual path set.

No automatic wider re-audit or repeated review/rewrite loop, paid review,
provider/database/NAS/payment/mail write, push or deployment is included. If the
follow-up raises a new supported issue, consolidate and report it concretely.
Publication retains its ordinary independent Codex, hosted CI and owner gates.

The new fixtures first fail at all three intended boundaries: nested baseline,
literal Git pathname decoding and Unicode batch preparation. All six proof
checks then pass with the fixes. The full captured inventory remains 703/703,
zero gaps; all 1,017 touched paths retain the previous baseline/coverage values.
All 163 Stripe checks, focused audit lint and TypeScript pass. Application
source remains the already built `b316461` version; changes in this task affect
only audit tools, their fixtures and records. The one correction review remains.

Literal pathname framing follows the primary Git
[diff documentation](https://git-scm.com/docs/git-diff) and
[tree documentation](https://git-scm.com/docs/git-ls-tree). Tests use actual Git
objects, including names Windows cannot check out, without creating such files
or changing the real index. Custom `%(path)` formatting still quotes names on
the tested Git version, so the tree reader uses default NUL-framed records.
