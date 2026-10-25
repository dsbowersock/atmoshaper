/** Bibliographic provenance only: archive identity never implies clinical release approval. */
import { isEquivalentAnatomyNameAlias } from "./anatomy-name-aliases.js"

export const OPENSTAX_AP_SOURCE_SLUG = "openstax-anatomy-physiology"
export const OPENSTAX_AP_REVISION = "b0058a743bdd2cc08196abaaa7d5469970c0d80c"
export const OPENSTAX_AP_COLLECTION_URL = `https://github.com/openstax/osbooks-anatomy-physiology/blob/${OPENSTAX_AP_REVISION}/collections/anatomy-and-physiology-2e.collection.xml`

/** @type {Omit<import("./anatomy-foundation.ts").FoundationSource, "id" | "slug">} */
export const OPENSTAX_AP_SOURCE_METADATA = Object.freeze({
  name: "OpenStax Anatomy and Physiology 2e (archived CC BY edition)",
  url: OPENSTAX_AP_COLLECTION_URL,
  license: "CC BY 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  usageScope: "open_reuse",
  accessedAt: "2026-10-25T00:00:00.000Z",
  notes: "Reference applies to the pinned historical 2e revision, not the current website. Site-authored summaries use section-specific references. The book license is not applied to supplemental articles or third-party components; no article text or figures are reproduced.",
  attribution: `OpenStax, Anatomy and Physiology 2e, Rice University, archived revision ${OPENSTAX_AP_REVISION}, Creative Commons Attribution 4.0 International (https://creativecommons.org/licenses/by/4.0/). Site-authored summaries and supplemental bibliography are identified separately.`,
  sourceRef: "Version-pinned A&P reference for sourced summaries and explicitly identified teaching/search context.",
})

/** Exact retained chapter/paragraph line locations; no publisher prose is bundled. */
const summaryLocations = {
  "anatomy_structure:hypothalamus": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46699/index.cnxml#L17-L17"
  ],
  "anatomy_structure:pineal-gland": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46693/index.cnxml#L16-L16",
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46693/index.cnxml#L22-L22"
  ],
  "anatomy_structure:blood": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46049/index.cnxml#L150-L150"
  ],
  "anatomy_concept:adipose-tissue": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46049/index.cnxml#L104-L104"
  ],
  "anatomy_concept:blood": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46049/index.cnxml#L150-L150"
  ],
  "anatomy_concept:bone-tissue": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46049/index.cnxml#L146-L146",
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46341/index.cnxml#L26-L26",
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46341/index.cnxml#L47-L47"
  ],
  "anatomy_concept:cardiac-muscle-tissue": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46055/index.cnxml#L58-L58"
  ],
  "anatomy_concept:cartilage": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46049/index.cnxml#L140-L140"
  ],
  "anatomy_concept:collagen-fiber": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46049/index.cnxml#L96-L96",
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46049/index.cnxml#L115-L115",
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46049/index.cnxml#L162-L162",
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46060/index.cnxml#L78-L78",
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46476/index.cnxml#L24-L24"
  ],
  "anatomy_concept:connective-tissue": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46046/index.cnxml#L23-L23",
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46049/index.cnxml#L19-L19",
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46049/index.cnxml#L26-L26",
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46476/index.cnxml#L24-L24"
  ],
  "anatomy_concept:connective-tissue-membrane": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46046/index.cnxml#L44-L44"
  ],
  "anatomy_concept:cutaneous-membrane": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46046/index.cnxml#L49-L49"
  ],
  "anatomy_concept:dense-connective-tissue": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46049/index.cnxml#L114-L114",
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46049/index.cnxml#L162-L162",
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46476/index.cnxml#L20-L20"
  ],
  "anatomy_concept:epithelial-membrane": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46046/index.cnxml#L48-L48",
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46046/index.cnxml#L56-L56"
  ],
  "anatomy_concept:epithelial-tissue": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46046/index.cnxml#L23-L23"
  ],
  "anatomy_concept:epithelium": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46046/index.cnxml#L23-L23"
  ],
  "anatomy_concept:extracellular-matrix": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46049/index.cnxml#L16-L16",
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46049/index.cnxml#L88-L88",
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46476/index.cnxml#L23-L23",
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46476/index.cnxml#L24-L24"
  ],
  "anatomy_concept:glandular-epithelium": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46048/index.cnxml#L25-L25"
  ],
  "anatomy_concept:loose-connective-tissue": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46049/index.cnxml#L103-L103",
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46049/index.cnxml#L26-L26",
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46060/index.cnxml#L83-L83",
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46506/index.cnxml#L95-L95"
  ],
  "anatomy_concept:mucous-membrane": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46046/index.cnxml#L48-L48"
  ],
  "anatomy_concept:muscle-tissue": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46055/index.cnxml#L17-L17",
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46473/index.cnxml#L20-L20"
  ],
  "anatomy_concept:muscular-system": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46055/index.cnxml#L57-L57",
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46476/index.cnxml#L20-L20",
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46476/index.cnxml#L24-L24"
  ],
  "anatomy_concept:musculoskeletal-system": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m45985/index.cnxml#L20-L20",
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46341/index.cnxml#L26-L26"
  ],
  "anatomy_concept:nervous-tissue": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46057/index.cnxml#L16-L16"
  ],
  "anatomy_concept:serous-membrane": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46046/index.cnxml#L48-L48"
  ],
  "anatomy_concept:simple-columnar-epithelium": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46048/index.cnxml#L48-L48"
  ],
  "anatomy_concept:simple-cuboidal-epithelium": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46048/index.cnxml#L47-L47"
  ],
  "anatomy_concept:simple-squamous-epithelium": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46048/index.cnxml#L46-L46",
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46048/index.cnxml#L105-L105"
  ],
  "anatomy_concept:skeletal-muscle-tissue": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46055/index.cnxml#L57-L57",
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46055/index.cnxml#L69-L69"
  ],
  "anatomy_concept:skeletal-system": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46341/index.cnxml#L16-L16",
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46341/index.cnxml#L26-L26",
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46341/index.cnxml#L47-L47"
  ],
  "anatomy_concept:smooth-muscle-tissue": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46055/index.cnxml#L59-L59"
  ],
  "anatomy_concept:stratified-squamous-epithelium": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46048/index.cnxml#L61-L61"
  ],
  "anatomy_concept:synovial-membrane": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46046/index.cnxml#L44-L44"
  ],
  "anatomy_structure:bronchiole": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46548/index.cnxml#L69-L69",
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46548/index.cnxml#L73-L73"
  ],
  "anatomy_structure:left-atrium": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46676/index.cnxml#L50-L50"
  ],
  "anatomy_structure:left-ventricle": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46676/index.cnxml#L142-L142"
  ],
  "anatomy_structure:right-atrium": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46676/index.cnxml#L51-L51"
  ],
  "anatomy_structure:right-ventricle": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46676/index.cnxml#L50-L50"
  ],
  "anatomy_structure:appendix": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46512/index.cnxml#L159-L159"
  ],
  "anatomy_structure:cecum": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46512/index.cnxml#L159-L159"
  ],
  "anatomy_structure:colon": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46512/index.cnxml#L163-L163",
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46512/index.cnxml#L176-L176"
  ],
  "anatomy_structure:duodenum": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46512/index.cnxml#L26-L26",
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46512/index.cnxml#L28-L28",
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46512/index.cnxml#L137-L137"
  ],
  "anatomy_structure:glomerulus": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46431/index.cnxml#L24-L24"
  ],
  "anatomy_structure:ileum": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46512/index.cnxml#L26-L26",
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46512/index.cnxml#L33-L33"
  ],
  "anatomy_structure:jejunum": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46512/index.cnxml#L32-L32",
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46512/index.cnxml#L225-L225"
  ],
  "anatomy_structure:renal-pelvis": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46429/index.cnxml#L40-L40"
  ],
  "anatomy_structure:renal-tubule": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46431/index.cnxml#L62-L62",
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46433/index.cnxml#L20-L20"
  ],
  "anatomy_structure:bulbourethral-gland": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46400/index.cnxml#L98-L98"
  ],
  "anatomy_structure:cervix": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46392/index.cnxml#L125-L125"
  ],
  "anatomy_structure:clitoris": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46392/index.cnxml#L27-L27"
  ],
  "anatomy_structure:scrotum": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46400/index.cnxml#L171-L171"
  ],
  "anatomy_structure:seminal-vesicle": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46400/index.cnxml#L103-L103"
  ],
  "anatomy_structure:vulva": [
    "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46392/index.cnxml#L27-L27"
  ]
}

/** Supplemental published facts are cited, without relabeling article copyright as CC BY. */
const supplementalLocations = {
  "anatomy_concept:collagen-fiber": [
    "https://pubmed.ncbi.nlm.nih.gov/19166469/"
  ],
  "anatomy_concept:dense-connective-tissue": [
    "https://pubmed.ncbi.nlm.nih.gov/19166469/"
  ],
  "anatomy_structure:clitoris": [
    "https://pubmed.ncbi.nlm.nih.gov/15879834/"
  ]
}

/**
 * Pin existing citation identities to the reviewed book edition and explicit context.
 * Generic source-linkage rows stay distinguishable from authored-summary comparison.
 * This preserves every input review flag and never promotes source safety to
 * clinical acceptance. Missing entity/term/relation bindings fail rather than
 * silently inheriting a moving or unrelated source URL.
 *
 * @param {import("./anatomy-foundation.ts").AnatomyFoundationSeed} seed
 * @returns {import("./anatomy-foundation.ts").AnatomyFoundationSeed}
 */
export function withPinnedOpenstaxApReferences(seed) {
  const terms = new Map(seed.entityTerms.map(term => [term.id, term]))
  const relationships = new Map(seed.relationships.map(relation => [relation.id, relation]))
  return {
    ...seed,
    citations: seed.citations.map(citation => {
      if (citation.sourceRef !== OPENSTAX_AP_SOURCE_SLUG) return citation
      let key = `${citation.entityType}:${citation.entitySlug}`
      let context = "Source linkage for the existing entity; this is not a separate summary review."
      if (citation.factType === "clinical_summary") {
        context = "Site-authored summary compared with the archived edition; supplemental factual references are listed separately."
      } else if (citation.factType !== "seed_source_reference") {
        throw new Error(`Unreviewed A&P citation kind: ${citation.factType}`)
      } else if (citation.factSlug?.startsWith("entity_term:")) {
        const term = terms.get(citation.factSlug.slice("entity_term:".length))
        if (!term) throw new Error("Unresolved A&P term citation")
        key = `${term.anatomyEntityType}:${term.anatomyEntitySlug}`
        context = isEquivalentAnatomyNameAlias(term.anatomyEntityType, term.anatomyEntitySlug, term.term)
          ? "Source context for an existing name or authored lookup label; this does not claim a verbatim publisher term."
          : "Retained broader search/category label, not an equivalent anatomical name or accepted name answer."
      } else if (citation.factSlug?.startsWith("relationship:")) {
        const relation = relationships.get(citation.factSlug.slice("relationship:".length))
        if (!relation) throw new Error("Unresolved A&P relationship citation")
        key = relation.relationshipType === "includes_structure"
          ? `${relation.targetEntityType}:${relation.targetEntitySlug}`
          : `${relation.sourceEntityType}:${relation.sourceEntitySlug}`
        context = "Source context for the structured anatomical association; the source-reference flag is not independent clinical approval."
        if (relation.sourceEntitySlug === "musculoskeletal-system" || relation.targetEntitySlug === "musculoskeletal-system") {
          context = "Site-authored practical browsing grouping; not an additional textbook organ system or a literal publisher hierarchy."
        } else if (relation.relationshipType === "belongs_to_tissue_type") {
          context = "Teaching-category association; a component or composite membrane is not thereby classified as a primary tissue type."
        }
      }
      const locations = summaryLocations[key]
      if (!locations?.length) throw new Error(`Missing pinned A&P entity reference: ${key}`)
      const supplements = supplementalLocations[key] ?? []
      const supplementNote = supplements.length
        ? " Supplemental bibliography cross-check only; no article text/media is reproduced or licensed by the book record."
        : ""
      const groupingNote = key === "anatomy_concept:musculoskeletal-system"
        ? " The combined musculoskeletal browsing membership is site-authored."
        : ""
      // The admin source-link renderer expects one URL. Keep all additional
      // paragraph and bibliography references in the explanatory citation note.
      const additionalLocations = [...locations.slice(1), ...supplements]
      const additionalNote = additionalLocations.length ? ` Additional references: ${additionalLocations.join("; ")}` : ""
      return { ...citation, sourceLocator: locations[0], citationNote: context + groupingNote + supplementNote + additionalNote }
    }),
  }
}
