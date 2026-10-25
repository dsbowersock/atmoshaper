# Pinned A&P edition evidence and claim-review boundary

## Current result

The publisher's public license history identifies commit `fdfa6e21ac3bc372dc2802a9952df124a619fdcc`
(March 19, 2026) as the CC BY-NC-SA change. Its parent,
`b0058a743bdd2cc08196abaaa7d5469970c0d80c`, retains a CC BY 4.0 license.
The same revision's README and collection explicitly identify **Anatomy and
Physiology 2e** under that license. This is direct publisher evidence for an
archived second edition. It is not proof that the runtime's unversioned first-
edition URL or every existing claim already maps to that edition.

The retained LICENSE, README and collection plus seventeen selected text modules
have SHA-256/size pins. A local manifest contains all 53 current A&P-dependent
card selectors and candidate modules. Every binding remains `needs_review`.
It preserves authored claim text digests, rather than silently making a new
edition or a generic source URL authorize every fact.

## Scope and compatibility

- Keep `openstax-anatomy-physiology` as the stable compatibility source key.
- Do not change runtime source metadata, source usage scopes, scientific-review
  flags, citation identities, card text, questions or database records in this slice.
- Keep the distinct Cushwa Human Biology and Applied Human Anatomy works separate.
- Preserve publisher attribution and component-specific exceptions. No textbook
  image, media body or clinical/private record is imported by the evidence packet.
- Earlier valid CC grants may continue under their original conditions; current
  website policy is not silently used to revoke or extend a past grant.
- Publication, cloud/provider mutation and Production remain separate decisions.

## Executed evidence

1. One unauthenticated public publisher-history GET identifies the change and
   parent. Two public artifact GETs retain the parent license/directory, two retain
   README/collection and seventeen retain selected text modules. The 22 direct
   artifact/history requests have no retries, authentication or image requests.
   Public browser-based bibliography/license research is recorded separately.
2. The named local audit checks twenty retained artifact hashes/sizes, work-
   specific license/collection identity, module membership and the exact authored
   inputs/selectors of all 53 cards. It uses no network or retrieval fallback.
3. Six invented-input tests reject changed bytes, moving revision URLs, changed or
   missing claim coverage, duplicate bindings, unretained modules, path traversal
   and an automatic review upgrade. A successful result still reports scientific
   review, commercial clearance and runtime retargeting as false.
4. Changed-script lint and ownership-bound dependency cleanup must have terminal
   evidence before this local candidate is reported complete. The external public
   source bodies stay outside Git; the committed manifest records their immutable
   public locations and hashes. Missing local evidence makes the audit fail.

Commands:

```sh
npm run test:anatomy-source-provenance
npm run audit:anatomy-source-provenance -- --artifact-root <retained-public-evidence-directory>
npm run lint:anatomy-source-provenance
```

The current retained directory is documented in the task's local closeout receipt;
no path or credential is required in the published manifest. Reacquiring a public
artifact is distinct from accepting a scientific claim or changing its source.

## Remaining acceptance

Review the 53 claims against the selected text sections and add precise locators,
including any site-authored taxonomy qualifications. Only then prepare a reviewed
source-retargeting/citation change, attribution display and corresponding artifact
validation. Do not upgrade these pending bindings because an edition hash passes.
The existing four component-action binding gaps, 31 direct muscle-detail gaps,
non-skeletal modeling/content, media, purchase activation and final launch gates
remain open. The earlier grading safeguard stays intact on its own branch.

## Primary evidence

- [Publisher license change](https://github.com/openstax/osbooks-anatomy-physiology/commit/fdfa6e21ac3bc372dc2802a9952df124a619fdcc)
- [Pinned publisher license](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/LICENSE)
- [Pinned book collection](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/collections/anatomy-and-physiology-2e.collection.xml)
- [Creative Commons prior-grant guidance](https://creativecommons.org/faq/#what-if-i-change-my-mind-about-using-a-cc-license)
## Terminal local validation

The corrected final script passes all six tests, the actual twenty-artifact/
53-card audit and changed-script lint. The original lint failure for a reserved
variable name remains separate. Six final process-denial receipts record zero
network or blocked-executable attempts. All final check PIDs are absent; the one
owned dependency junction is removed and the shared schema hash matches. All
52 runtime/seed files match the prior validated candidate. Public source bodies
and receipts remain retained outside Git. No app build was needed for this
script/manifest-only slice; full runtime acceptance is not inferred from it.
