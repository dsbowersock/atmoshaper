# A&P summary-source comparison and remaining corrections

## Result and scope

The comparison covers the anatomical clauses in all 53 current card summaries
linked to `openstax-anatomy-physiology`. It uses archived **Anatomy and Physiology
2e**, publisher revision `b0058a743bdd2cc08196abaaa7d5469970c0d80c`, whose work-
specific CC BY 4.0 evidence is pinned in the [edition plan](2026-10-25-anatomy-edition-provenance.md).
This is a summary-only review. Editorial descriptions of why AtmoShaper includes
a card remain site-authored. The full set of 272 runtime citations, related
terms, relations, answer variants, scientific acceptance and commercial release
are separate; none is automatically upgraded by this report.

The [machine-readable comparison](../../source-evidence/openstax-ap-2e-summary-review.json)
records every unchanged summary digest, the assessment rationale and 78 exact
publisher paragraph/line bindings. No book prose or figures are copied into this
report. The retained external texts stay outside Git.

## Completed comparison

- 45 summaries have matching source support for their core anatomical clauses.
- Seven have a specific evidence/wording gap; lack of support here is not proof
  that an anatomical statement is false.
- One musculoskeletal grouping is explicitly authored app taxonomy, with textbook
  context rather than a claim to reproduce a publisher organ-system list.

The bone-function and muscle-force review uses two additional modules from the
same collection/revision: [6.1 skeletal functions](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46341/index.cnxml)
and [10.1 muscle overview](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46473/index.cnxml).
Their hashes/sizes join the review evidence without changing the original
twenty-artifact archive manifest or its pending review flags.

## Specific remaining work

| Summary | Required correction or evidence |
| --- | --- |
| Collagen fiber | Pin the full fascia/capsule/organ-support examples, or narrow the examples to the supported tensile-strength and tendon/ligament/dermal context. |
| Connective tissue | Bind the complete named tissue list, particularly fascia, or identify the expanded membership as authored taxonomy. |
| Dense connective tissue | Add an exact fascial-sheet reference or remove that unsupported extension. |
| Extracellular matrix | Add the exact mechanical load-transfer source or use the directly supported organization/support description. |
| Loose connective tissue | Establish the specific superficial-fascia and lamina-propria pairing; the selected membrane passage only establishes connective tissue generally. |
| Muscular system | Make the extent of related contractile tissues precise; do not silently group cardiac and smooth tissue into the skeletal muscular system. |
| Clitoris | Distinguish the whole organ from the externally visible glans and pin complete erectile-tissue anatomy. The selected older passage alone is insufficient. |

## Every current summary

| Card selector | Assessment | Paragraph locators |
| --- | --- | --- |
| `anatomy_structure:hypothalamus` | Core summary supported | [m46699:eip-577](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46699/index.cnxml#L17-L17) |
| `anatomy_structure:pineal-gland` | Core summary supported | [m46693:fs-id1355539](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46693/index.cnxml#L16-L16); [m46693:fs-id1388310](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46693/index.cnxml#L22-L22) |
| `anatomy_structure:blood` | Core summary supported | [m46049:fs-id1471531](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46049/index.cnxml#L150-L150) |
| `anatomy_concept:adipose-tissue` | Core summary supported | [m46049:fs-id1323875](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46049/index.cnxml#L104-L104) |
| `anatomy_concept:blood` | Core summary supported | [m46049:fs-id1471531](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46049/index.cnxml#L150-L150) |
| `anatomy_concept:bone-tissue` | Core summary supported | [m46049:fs-id1286153](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46049/index.cnxml#L146-L146); [m46341:fs-id1082253](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46341/index.cnxml#L26-L26); [m46341:fs-id1265514](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46341/index.cnxml#L47-L47) |
| `anatomy_concept:cardiac-muscle-tissue` | Core summary supported | [m46055:fs-id1269818](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46055/index.cnxml#L58-L58) |
| `anatomy_concept:cartilage` | Core summary supported | [m46049:fs-id1141589](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46049/index.cnxml#L140-L140) |
| `anatomy_concept:collagen-fiber` | Evidence/wording gap | [m46049:fs-id1303675](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46049/index.cnxml#L96-L96); [m46049:fs-id1284451](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46049/index.cnxml#L115-L115) |
| `anatomy_concept:connective-tissue` | Evidence/wording gap | [m46046:fs-id1312224](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46046/index.cnxml#L23-L23); [m46049:fs-id1481373](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46049/index.cnxml#L19-L19); [m46049:fs-id1452498](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46049/index.cnxml#L26-L26) |
| `anatomy_concept:connective-tissue-membrane` | Core summary supported | [m46046:fs-id1102328](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46046/index.cnxml#L44-L44) |
| `anatomy_concept:cutaneous-membrane` | Core summary supported | [m46046:fs-id1432081](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46046/index.cnxml#L49-L49) |
| `anatomy_concept:dense-connective-tissue` | Evidence/wording gap | [m46049:fs-id1180376](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46049/index.cnxml#L114-L114); [m46049:fs-id1307738](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46049/index.cnxml#L162-L162) |
| `anatomy_concept:epithelial-membrane` | Core summary supported | [m46046:fs-id1522633](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46046/index.cnxml#L48-L48); [m46046:fs-id1462627](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46046/index.cnxml#L56-L56) |
| `anatomy_concept:epithelial-tissue` | Core summary supported | [m46046:fs-id1312224](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46046/index.cnxml#L23-L23) |
| `anatomy_concept:epithelium` | Core summary supported | [m46046:fs-id1312224](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46046/index.cnxml#L23-L23) |
| `anatomy_concept:extracellular-matrix` | Evidence/wording gap | [m46049:fs-id1514526](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46049/index.cnxml#L16-L16); [m46049:fs-id1508104](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46049/index.cnxml#L88-L88) |
| `anatomy_concept:glandular-epithelium` | Core summary supported | [m46048:fs-id1300309](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46048/index.cnxml#L25-L25) |
| `anatomy_concept:loose-connective-tissue` | Evidence/wording gap | [m46049:fs-id1138718](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46049/index.cnxml#L103-L103); [m46049:fs-id1452498](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46049/index.cnxml#L26-L26); [m46046:fs-id1522633](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46046/index.cnxml#L48-L48) |
| `anatomy_concept:mucous-membrane` | Core summary supported | [m46046:fs-id1522633](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46046/index.cnxml#L48-L48) |
| `anatomy_concept:muscle-tissue` | Core summary supported | [m46055:fs-id1524010](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46055/index.cnxml#L17-L17); [m46473:fs-id2017239](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46473/index.cnxml#L20-L20) |
| `anatomy_concept:muscular-system` | Evidence/wording gap | [m46055:fs-id1508374](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46055/index.cnxml#L57-L57); [m46473:fs-id2017239](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46473/index.cnxml#L20-L20) |
| `anatomy_concept:musculoskeletal-system` | Authored app grouping | [m45985:fs-id2292264](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m45985/index.cnxml#L20-L20); [m46341:fs-id1082253](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46341/index.cnxml#L26-L26) |
| `anatomy_concept:nervous-tissue` | Core summary supported | [m46057:fs-id1119252](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46057/index.cnxml#L16-L16) |
| `anatomy_concept:serous-membrane` | Core summary supported | [m46046:fs-id1110348](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46046/index.cnxml#L48-L48) |
| `anatomy_concept:simple-columnar-epithelium` | Core summary supported | [m46048:fs-id1319983](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46048/index.cnxml#L48-L48) |
| `anatomy_concept:simple-cuboidal-epithelium` | Core summary supported | [m46048:fs-id1511558](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46048/index.cnxml#L47-L47) |
| `anatomy_concept:simple-squamous-epithelium` | Core summary supported | [m46048:fs-id1321611](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46048/index.cnxml#L46-L46); [m46048:fs-id1053236](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46048/index.cnxml#L105-L105) |
| `anatomy_concept:skeletal-muscle-tissue` | Core summary supported | [m46055:fs-id1508374](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46055/index.cnxml#L57-L57); [m46055:fs-id1306966](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46055/index.cnxml#L69-L69) |
| `anatomy_concept:skeletal-system` | Core summary supported | [m46341:fs-id1641272](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46341/index.cnxml#L16-L16); [m46341:fs-id1082253](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46341/index.cnxml#L26-L26); [m46341:fs-id1265514](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46341/index.cnxml#L47-L47) |
| `anatomy_concept:smooth-muscle-tissue` | Core summary supported | [m46055:fs-id1515671](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46055/index.cnxml#L59-L59) |
| `anatomy_concept:stratified-squamous-epithelium` | Core summary supported | [m46048:fs-id1178293](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46048/index.cnxml#L61-L61) |
| `anatomy_concept:synovial-membrane` | Core summary supported | [m46046:fs-id1102328](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46046/index.cnxml#L44-L44) |
| `anatomy_structure:bronchiole` | Core summary supported | [m46548:fs-id2138728](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46548/index.cnxml#L69-L69); [m46548:fs-id2757673](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46548/index.cnxml#L73-L73) |
| `anatomy_structure:left-atrium` | Core summary supported | [m46676:fs-id1236860](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46676/index.cnxml#L50-L50) |
| `anatomy_structure:left-ventricle` | Core summary supported | [m46676:fs-id2663012](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46676/index.cnxml#L142-L142) |
| `anatomy_structure:right-atrium` | Core summary supported | [m46676:fs-id2175356](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46676/index.cnxml#L51-L51) |
| `anatomy_structure:right-ventricle` | Core summary supported | [m46676:fs-id1236860](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46676/index.cnxml#L50-L50) |
| `anatomy_structure:appendix` | Core summary supported | [m46512:fs-id2020835](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46512/index.cnxml#L159-L159) |
| `anatomy_structure:cecum` | Core summary supported | [m46512:fs-id2020835](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46512/index.cnxml#L159-L159) |
| `anatomy_structure:colon` | Core summary supported | [m46512:fs-id1583646](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46512/index.cnxml#L163-L163); [m46512:fs-id1247327](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46512/index.cnxml#L176-L176) |
| `anatomy_structure:duodenum` | Core summary supported | [m46512:fs-id2142277](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46512/index.cnxml#L26-L26); [m46512:fs-id2227124](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46512/index.cnxml#L28-L28); [m46512:fs-id1638653](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46512/index.cnxml#L137-L137) |
| `anatomy_structure:glomerulus` | Core summary supported | [m46431:fs-id2001225](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46431/index.cnxml#L24-L24) |
| `anatomy_structure:ileum` | Core summary supported | [m46512:fs-id2142277](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46512/index.cnxml#L26-L26); [m46512:fs-id1921294](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46512/index.cnxml#L33-L33) |
| `anatomy_structure:jejunum` | Core summary supported | [m46512:fs-id2311182](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46512/index.cnxml#L32-L32); [m46512:fs-id1391067](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46512/index.cnxml#L225-L225) |
| `anatomy_structure:renal-pelvis` | Core summary supported | [m46429:fs-id1764618](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46429/index.cnxml#L40-L40) |
| `anatomy_structure:renal-tubule` | Core summary supported | [m46431:fs-id2686216](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46431/index.cnxml#L62-L62); [m46433:fs-id1949601](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46433/index.cnxml#L20-L20) |
| `anatomy_structure:bulbourethral-gland` | Core summary supported | [m46400:fs-id2428415](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46400/index.cnxml#L98-L98) |
| `anatomy_structure:cervix` | Core summary supported | [m46392:fs-id2132572](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46392/index.cnxml#L125-L125) |
| `anatomy_structure:clitoris` | Evidence/wording gap | [m46392:fs-id1978861](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46392/index.cnxml#L27-L27) |
| `anatomy_structure:scrotum` | Core summary supported | [m46400:fs-id2633121](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46400/index.cnxml#L171-L171) |
| `anatomy_structure:seminal-vesicle` | Core summary supported | [m46400:fs-id2790773](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46400/index.cnxml#L103-L103) |
| `anatomy_structure:vulva` | Core summary supported | [m46392:fs-id2174284](https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46392/index.cnxml#L27-L27) |

## Validation and compatibility

The independent local check matches all 53 summary digests, unique selectors,
78 paragraph-text hashes and their exact XML element and line ranges. It checks
supplementary module membership and every retained module hash. These checks
make the manual comparison reproducible; they cannot determine clinical truth.
The first draft's XML-ID URL fragments were replaced with verified GitHub line
anchors before this candidate was recorded. Both drafts remain in local evidence.

The six named provenance tests and real archive audit pass with network/process
denial enabled. The existing linted verifier/test/package inputs have unchanged
hashes. No app build is repeated for this documentation/evidence-only addition.
All 52 runtime/seed files match the validated region-answer candidate. No source
identity, URL, summary, citation, scientific-review flag, media, DB row, stored
configuration, app behavior or provider state changes in this slice. Dependencies
and unrelated worktrees remain intact; no temporary dependency link is created.

Next prepare the seven precise corrections and a complete citation/term/relation
review, then explicitly decide versioned runtime source attribution. Publication
and provider/Production actions remain outside this local comparison.

## Executed full citation-scope classification

An independent source-only reader resolved every current A&P citation binding:

| Kind | Rows | Remaining acceptance |
| --- | ---: | --- |
| Authored summaries | 53 | Resolve seven evidence/wording gaps and authored grouping attribution. |
| Entity-source pointers | 53 | Bind source-edition provenance; these duplicate entity linkage rather than adding 53 independent summary reviews. |
| Term references | 77 | Check preferred names, authored plain-language labels and the exact breadth of aliases. |
| Relationship references | 89 | Check real anatomical membership versus authored browsing/grouping semantics. |

All 272 rows currently say reviewed. In `lib/anatomy-foundation.ts`, the
`sourceReferenceCitationTargets` and `seedSourceReferenceReviewStatus` helpers
generate 219 of these rows from sourceRef/usageScope. Their notes distinguish a
source-linkage review from an exact scientific locator. Keep that distinction;
no blanket claim-review promotion or blanket deletion is justified by the count.

The executed reader used the real bundled source, resolved all term/relationship
IDs and denied networking/subprocesses. All 52 runtime/seed hashes match. Its
retained data is public app source, not hosted DB rows. Specific next inspections
include blood's broad fluid-connective-tissue alias, colon's large-bowel alias,
matrix/fiber tissue grouping, practical musculoskeletal cross-links and the
bulbourethral urinary-system association. Inspect how the application uses each
relation/alias before deciding the compatible correction and its source. This
classification makes no clinical acceptance or runtime change.
