/** Exact reviewed action bindings only; broad source pointers cannot authorize another fact. */
/** @type {import("./anatomy-foundation.ts").FoundationSource} */
export const REVIEWED_LUMBAR_STUDY_SOURCE = Object.freeze({
  "id": "source-wang-2023-lumbar-multifidus-biomechanics",
  "slug": "wang-2023-lumbar-multifidus-biomechanics",
  "name": "Wang et al. (2023), lumbar multifidus biomechanics",
  "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC9854514/",
  "license": "CC BY 4.0",
  "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
  "usageScope": "open_reuse",
  "accessedAt": "2026-10-25T00:00:00.000Z",
  "notes": "Primary musculoskeletal modeling study; educational structural facts only. No patient outcomes, treatment efficacy, article figures or dataset redistribution are inferred. Article XML and license were checked through the NLM public dataset; NLM does not endorse this application.",
  "attribution": "Kuan Wang, Zhen Deng, Xinpeng Chen, Jiang Shao, Lulu Qiu, Chenghua Jiang and Wenxin Niu (2023). The Role of Multifidus in the Biomechanics of Lumbar Spine: A Musculoskeletal Modeling Study. Bioengineering 10(1):67. DOI 10.3390/bioengineering10010067. CC BY 4.0. Bibliographic evidence accessed through NLM PubMed Central; no endorsement implied.",
  "sourceRef": "Primary biomechanics evidence for the two specified existing lumbar action facts."
})

/** Existing authored descriptions and stable IDs are checked before source retargeting. */
export const REVIEWED_MUSCLE_ACTION_BINDINGS = Object.freeze([
  {
    "id": "action-lumbar-erector-extension",
    "muscle": "lumbar-erector-spinae",
    "description": "Extends the lumbar spine.",
    "descriptionSha256": "76efc21e15ee309ec50ff5627e5a541d806ca8a70a655c2e69b1146567e54c18",
    "originalSourceRef": "applied-human-anatomy",
    "sourceRef": "openstax-anatomy-physiology",
    "sourceLocator": "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46484/index.cnxml#L281-L281",
    "reviewNote": "Archived paragraph fs-id2586421 identifies erector spinae as a vertebral-column extensor, including its lumbar component.",
    "citationId": "citation-reviewed-action-lumbar-erector-extension"
  },
  {
    "id": "action-lumbar-erector-stabilization",
    "muscle": "lumbar-erector-spinae",
    "description": "Contributes to loaded lumbar postural control.",
    "descriptionSha256": "8aed8192e23a314b8e23e9f5b0d569e5aec8da0fad40ec8ee479426753cc73ec",
    "originalSourceRef": "applied-human-anatomy",
    "sourceRef": "wang-2023-lumbar-multifidus-biomechanics",
    "sourceLocator": "https://pmc.ncbi.nlm.nih.gov/articles/PMC9854514/#sec1-bioengineering-10-00067",
    "reviewNote": "Study introduction describes paraspinal muscles balancing upper-body loading in static postures; the existing educational contribution statement does not claim a unique stabilizer or patient outcome.",
    "citationId": "citation-reviewed-action-lumbar-erector-stabilization"
  },
  {
    "id": "action-lumbar-multifidus-stabilizer",
    "muscle": "lumbar-multifidus",
    "description": "Contributes to segmental lumbar control.",
    "descriptionSha256": "74b5d41988a79c17366879851326ddbeec947d891b0157b425e98af49286a8ec",
    "originalSourceRef": "applied-human-anatomy",
    "sourceRef": "wang-2023-lumbar-multifidus-biomechanics",
    "sourceLocator": "https://pmc.ncbi.nlm.nih.gov/articles/PMC9854514/#sec4-bioengineering-10-00067",
    "reviewNote": "Study discussion supports multifidus contribution to segmental balance in the modeled lumbar spine. This is a modeling study, not proof of treatment outcomes or an exclusive stabilizing role.",
    "citationId": "citation-reviewed-action-lumbar-multifidus-stabilizer"
  },
  {
    "id": "action-lumbar-multifidus-extension",
    "muscle": "lumbar-multifidus",
    "description": "Assists lumbar extension and segmental control.",
    "descriptionSha256": "8536361a4049324600995a9798537f8ca7d6516baf17850d010e800dbc29217a",
    "originalSourceRef": "applied-human-anatomy",
    "sourceRef": "openstax-anatomy-physiology",
    "sourceLocator": "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46484/index.cnxml#L283-L283",
    "reviewNote": "Archived paragraph fs-id2808964 supports lumbar extension; segmental-control wording is corroborated separately by Wang et al. 2023, CC BY 4.0. https://pmc.ncbi.nlm.nih.gov/articles/PMC9854514/#sec4-bioengineering-10-00067",
    "citationId": "citation-reviewed-action-lumbar-multifidus-extension"
  },
  {
    "id": "action-rectus-femoris-hip-flexion",
    "muscle": "rectus-femoris",
    "description": "Assists hip flexion.",
    "descriptionSha256": "ec725f9d11fa6436eaccad4ce90a32105e04e440dfebe68580c871a445cf75d5",
    "originalSourceRef": "applied-human-anatomy",
    "sourceRef": "applied-human-anatomy",
    "sourceLocator": "https://open.umn.edu/opentextbooks/formats/3154#page=166",
    "reviewNote": "Applied Human Anatomy 2022: printed page 53 (PDF page 62), exercise B1, paired with printed page 157 (PDF page 166), answer B1c; rectus femoris is included among hip flexors.",
    "citationId": "citation-reviewed-action-rectus-femoris-hip-flexion"
  },
  {
    "id": "action-rectus-femoris-knee-extension",
    "muscle": "rectus-femoris",
    "description": "Extends the knee.",
    "descriptionSha256": "14fd90e0b0ece2cbb1222600257fe63c8343f07de8345bc45c83f6ae829cc0b7",
    "originalSourceRef": "applied-human-anatomy",
    "sourceRef": "applied-human-anatomy",
    "sourceLocator": "https://open.umn.edu/opentextbooks/formats/3154#page=55",
    "reviewNote": "Applied Human Anatomy 2022: printed pages 45-46 (PDF pages 54-55), exercise A3 identifies rectus femoris as a quadriceps head and A4 describes quadriceps knee extension; exercise B2 on PDF page 62 and its answer on PDF page 166 corroborate the action.",
    "citationId": "citation-reviewed-action-rectus-femoris-knee-extension"
  },
  {
    "id": "action-frontalis-brow-elevation",
    "muscle": "frontalis",
    "description": "Elevates the eyebrows and wrinkles forehead soft tissue.",
    "descriptionSha256": "544e52339ab8036f44effa30492c442ba574c67de9de27f75029791263add99f",
    "originalSourceRef": "applied-human-anatomy",
    "sourceRef": "openstax-anatomy-physiology",
    "sourceLocator": "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46484/index.cnxml#L24-L26",
    "reviewNote": "Frontal-belly eyebrow action in the archived figure description; forehead wrinkling independently corroborated by Kwon et al. 2023. Supplemental article is CC BY-NC 4.0 and is bibliography only: no article text, media or license is adopted. https://pubmed.ncbi.nlm.nih.gov/37365738/",
    "citationId": "citation-reviewed-action-frontalis-brow-elevation"
  }
])
const bindingById = new Map(REVIEWED_MUSCLE_ACTION_BINDINGS.map(binding => [binding.id, binding]))
const legacyGroups = new Set(["frontalis-actions", "rectus-femoris-actions", "lumbar-erector-spinae-actions", "lumbar-multifidus-actions"])

/**
 * Correct only the seven explicitly compared facts. All prior IDs and authored
 * descriptions remain. Old umbrella pointers stay as pending history; source-pointer IDs stay stable;
 * only the new exact citations are reviewed. Never match a muscle's other actions.
 * @param {import("./anatomy-foundation.ts").AnatomyFoundationSeed} seed
 * @returns {import("./anatomy-foundation.ts").AnatomyFoundationSeed}
 */
export function withReviewedMuscleActionEvidence(seed) {
  for (const binding of REVIEWED_MUSCLE_ACTION_BINDINGS) {
    const action = seed.muscleActions.find(row => row.id === binding.id)
    if (!action || action.muscle !== binding.muscle || action.description !== binding.description || ![binding.originalSourceRef, binding.sourceRef].includes(action.sourceRef)) {
      throw new Error(`Reviewed action input changed: ${binding.id}`)
    }
  }
  const existingSource = seed.sources.find(source => source.slug === REVIEWED_LUMBAR_STUDY_SOURCE.slug)
  if (existingSource && JSON.stringify(existingSource) !== JSON.stringify(REVIEWED_LUMBAR_STUDY_SOURCE)) throw new Error("Reviewed lumbar source conflict")
  const actions = seed.muscleActions.map(action => {
    const binding = bindingById.get(action.id)
    return binding ? {...action, sourceRef:binding.sourceRef} : action
  })
  const relationships = seed.relationships.map(relation => {
    const binding = relation.sourceEntityType === "muscle_action" ? bindingById.get(relation.sourceEntitySlug) : undefined
    return binding ? {...relation, sourceRef:binding.sourceRef} : relation
  })
  const citations = seed.citations.map(citation => {
    if (citation.factType === "action" && legacyGroups.has(citation.factSlug ?? "")) {
      return {...citation, reviewStatus:"needs_review", citationNote:"Retained historical action-group pointer. It is not an exact action-ID citation; the specifically reviewed replacement citations are separate."}
    }
    const binding = citation.factType === "seed_source_reference" && citation.entityType === "muscle_action" ? bindingById.get(citation.entitySlug) : undefined
    if (binding && citation.sourceRef !== binding.sourceRef) {
      return {...citation, sourceRef:binding.sourceRef, sourceLocator:binding.sourceLocator, citationNote:"Stable source-reference ID retained while its source metadata is corrected by the exact action review. This source pointer is not independent clinical acceptance."}
    }
    return citation
  })
  for (const binding of REVIEWED_MUSCLE_ACTION_BINDINGS) {
    const exact = {id:binding.citationId, slug:binding.citationId, entityType:"muscle", entitySlug:binding.muscle, factType:"action", factSlug:binding.id, sourceRef:binding.sourceRef, sourceLocator:binding.sourceLocator, citationNote:binding.reviewNote, reviewStatus:"reviewed"}
    const existing = citations.find(citation => citation.id === exact.id)
    if (existing) {
      if (JSON.stringify(existing) !== JSON.stringify(exact)) throw new Error(`Exact action citation conflict: ${exact.id}`)
    } else citations.push(exact)
  }
  return {...seed, sources:existingSource ? seed.sources : [...seed.sources,REVIEWED_LUMBAR_STUDY_SOURCE], muscleActions:actions, relationships, citations}
}
