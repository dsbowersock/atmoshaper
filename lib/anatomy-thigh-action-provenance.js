/** Exact educational-action comparisons; no group-level or clinical acceptance is inferred. */
export const REVIEWED_THIGH_ACTION_BINDINGS = Object.freeze(
[
  {
    "id": "action-semitendinosus-hip-extension",
    "muscle": "semitendinosus",
    "description": "Assists hip extension.",
    "descriptionSha256": "e259f453163439bd48064993f24a1cb2b4835cddd2f09b6f04b7e1db37023a4a",
    "originalSourceRef": "applied-human-anatomy",
    "sourceRef": "openstax-anatomy-physiology",
    "sourceLocator": "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46482/index.cnxml#L34-L34",
    "reviewNote": "The text identifies semitendinosus within the thigh-extending posterior compartment; the named table description independently describes moving the thigh down and back. Exact passage review covers only this unchanged educational action description; other actions and clinical acceptance remain separate.",
    "citationId": "citation-reviewed-action-semitendinosus-hip-extension"
  },
  {
    "id": "action-semimembranosus-hip-extension",
    "muscle": "semimembranosus",
    "description": "Assists hip extension.",
    "descriptionSha256": "e259f453163439bd48064993f24a1cb2b4835cddd2f09b6f04b7e1db37023a4a",
    "originalSourceRef": "applied-human-anatomy",
    "sourceRef": "openstax-anatomy-physiology",
    "sourceLocator": "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46482/index.cnxml#L34-L34",
    "reviewNote": "The text identifies semimembranosus within the thigh-extending posterior compartment; the named table description independently describes moving the thigh down and back. Exact passage review covers only this unchanged educational action description; other actions and clinical acceptance remain separate.",
    "citationId": "citation-reviewed-action-semimembranosus-hip-extension"
  },
  {
    "id": "action-gracilis-hip-adduction",
    "muscle": "gracilis",
    "description": "Assists hip adduction.",
    "descriptionSha256": "a3346bb60c57b2fefd79b6ee3d0aab9735b24970e0525a309e73722f7edf650c",
    "originalSourceRef": "applied-human-anatomy",
    "sourceRef": "openstax-anatomy-physiology",
    "sourceLocator": "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46482/index.cnxml#L31-L31",
    "reviewNote": "The prose explicitly says gracilis adducts the thigh. The conflicting table image description is excluded as evidence for this action. Exact passage review covers only this unchanged educational action description; other actions and clinical acceptance remain separate.",
    "citationId": "citation-reviewed-action-gracilis-hip-adduction"
  },
  {
    "id": "action-sartorius-hip-flexion",
    "muscle": "sartorius",
    "description": "Assists hip flexion.",
    "descriptionSha256": "ec725f9d11fa6436eaccad4ce90a32105e04e440dfebe68580c871a445cf75d5",
    "originalSourceRef": "applied-human-anatomy",
    "sourceRef": "openstax-anatomy-physiology",
    "sourceLocator": "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46482/index.cnxml#L34-L34",
    "reviewNote": "The prose explicitly assigns hip flexion to sartorius. Exact passage review covers only this unchanged educational action description; other actions and clinical acceptance remain separate.",
    "citationId": "citation-reviewed-action-sartorius-hip-flexion"
  },
  {
    "id": "action-sartorius-knee-flexion",
    "muscle": "sartorius",
    "description": "Assists knee flexion.",
    "descriptionSha256": "05b92fb1b790ff61c8e4d25f9d5a11d76836f77c49643b2a31bcf64f518c9047",
    "originalSourceRef": "applied-human-anatomy",
    "sourceRef": "openstax-anatomy-physiology",
    "sourceLocator": "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46482/index.cnxml#L34-L34",
    "reviewNote": "The prose explicitly assigns knee flexion to sartorius. Exact passage review covers only this unchanged educational action description; other actions and clinical acceptance remain separate.",
    "citationId": "citation-reviewed-action-sartorius-knee-flexion"
  },
  {
    "id": "action-sartorius-hip-abduction",
    "muscle": "sartorius",
    "description": "Assists hip abduction.",
    "descriptionSha256": "211971f529c50b937a367079dc6df60bdd913dee4b1680d49200634d0965b595",
    "originalSourceRef": "applied-human-anatomy",
    "sourceRef": "openstax-anatomy-physiology",
    "sourceLocator": "https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46482/index.cnxml#L34-L34",
    "reviewNote": "The prose explicitly assigns hip abduction to sartorius. Exact passage review covers only this unchanged educational action description; other actions and clinical acceptance remain separate.",
    "citationId": "citation-reviewed-action-sartorius-hip-abduction"
  }
].map(Object.freeze))

const bindingById = new Map(REVIEWED_THIGH_ACTION_BINDINGS.map(binding => [binding.id, binding]))
const selectedMuscles = new Set(REVIEWED_THIGH_ACTION_BINDINGS.map(binding => binding.muscle))

/**
 * Attach exact citations only to six unchanged existing actions. Stable IDs and
 * authored descriptions remain; historical group pointers become pending and
 * source-pointer metadata follows the corrected fact/teaching relationship.
 * Validation completes before any new result is returned; input is never mutated.
 * @param {import("./anatomy-foundation.ts").AnatomyFoundationSeed} seed
 * @returns {import("./anatomy-foundation.ts").AnatomyFoundationSeed}
 */
export function withReviewedThighActionEvidence(seed) {
  const source = seed.sources.find(row => row.slug === "openstax-anatomy-physiology")
  if (!source || source.usageScope !== "open_reuse" || source.license !== "CC BY 4.0") {
    throw new Error("Reviewed thigh-action source changed")
  }
  for (const binding of REVIEWED_THIGH_ACTION_BINDINGS) {
    const matches = seed.muscleActions.filter(row => row.id === binding.id)
    const action = matches[0]
    if (matches.length !== 1 || action.muscle !== binding.muscle || action.description !== binding.description || ![binding.originalSourceRef, binding.sourceRef].includes(action.sourceRef)) {
      throw new Error(`Reviewed thigh-action input changed: ${binding.id}`)
    }
  }
  const muscleActions = seed.muscleActions.map(action => {
    const binding = bindingById.get(action.id)
    return binding ? {...action, sourceRef:binding.sourceRef} : action
  })
  const relationships = seed.relationships.map(relation => {
    const binding = relation.sourceEntityType === "muscle_action" ? bindingById.get(relation.sourceEntitySlug) : undefined
    return binding ? {...relation, sourceRef:binding.sourceRef} : relation
  })
  const citations = seed.citations.map(citation => {
    if (citation.entityType === "muscle" && selectedMuscles.has(citation.entitySlug) && citation.factType === "action" && citation.factSlug === `${citation.entitySlug}-actions`) {
      return {...citation, reviewStatus:"needs_review", citationNote:"Historical group pointer retained. Only separately compared exact action-ID citations are reviewed; other action qualifiers remain unresolved."}
    }
    const binding = citation.factType === "seed_source_reference" && citation.entityType === "muscle_action" ? bindingById.get(citation.entitySlug) : undefined
    if (binding && citation.sourceRef !== binding.sourceRef) {
      return {...citation, sourceRef:binding.sourceRef, sourceLocator:binding.sourceLocator, citationNote:"Stable source-reference ID retained while its fact/teaching source metadata follows the exact action comparison. This pointer is not independent clinical acceptance."}
    }
    return citation
  })
  for (const binding of REVIEWED_THIGH_ACTION_BINDINGS) {
    const exact = {id:binding.citationId, slug:binding.citationId, entityType:"muscle", entitySlug:binding.muscle, factType:"action", factSlug:binding.id, sourceRef:binding.sourceRef, sourceLocator:binding.sourceLocator, citationNote:binding.reviewNote, reviewStatus:"reviewed"}
    const existing = citations.filter(citation => citation.id === exact.id)
    if (existing.length > 1 || (existing.length === 1 && JSON.stringify(existing[0]) !== JSON.stringify(exact))) {
      throw new Error(`Exact thigh-action citation conflict: ${exact.id}`)
    }
    if (existing.length === 0) citations.push(exact)
  }
  return {...seed, muscleActions, relationships, citations}
}
