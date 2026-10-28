/** Exact 2024 bibliography and six separately compared descriptions; no group approval. */
export const TEMPLE_HANDS_ON_ANATOMY_SOURCE_METADATA = Object.freeze({
  "name": "Hands-on Anatomy (Jacqueline Phillips and Michael O'Hara, 2024)",
  "url": "https://temple.manifoldapp.org/projects/hands-on-anatomy",
  "license": "CC BY 4.0",
  "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
  "usageScope": "open_reuse",
  "accessedAt": "2026-10-28T00:00:00.000Z",
  "attribution": "Jacqueline Phillips and Michael O'Hara, Hands-on Anatomy (2024), North Broad Press/Temple University Press. DOI 10.34944/381c-cx44; ebook ISBN 9781439921241. CC BY 4.0 unless otherwise noted.",
  "notes": "The publisher copyright page applies CC BY 4.0 unless otherwise noted. Permission-only photographs and illustrations, including Alsup/Fox figures, are not cleared by this source record. Only six independently compared unchanged action descriptions use this bibliography. No source prose, figures or palpation instructions are bundled; this is not clinical or whole-record acceptance.",
  "sourceRef": "Exact 2024 work, DOI 10.34944/381c-cx44; evidence: docs/source-evidence/temple-hands-on-anatomy-actions-20261028.json. Retained catalogue/copyright and four named chapter captures pin publication identity, component exceptions and the six comparisons."
})

export const REVIEWED_TEMPLE_ACTION_BINDINGS = Object.freeze([
  {
    "id": "action-external-oblique-flexion",
    "muscle": "external-oblique",
    "description": "Assists trunk flexion.",
    "descriptionSha256": "cab13fe47ea1bc24144b6e764fb3feaeadd9575fb9d5e748b136f537894b39b1",
    "originalSourceRef": "applied-human-anatomy",
    "sourceRef": "temple-hands-on-anatomy-2024",
    "sourceLocator": "https://temple.manifoldapp.org/read/hands-on-anatomy-c6538f97-bc62-44ae-96ff-0f1f97d6c977/section/8ff57319-f921-4deb-b896-585474a87763",
    "evidenceFile": "spine-thorax-abdomen.body.txt",
    "startLine": 208,
    "endLine": 211,
    "selectedTextSha256": "b166cb720c276a24bda49039cbe603edf9dba20febd533c9b6247cd4212d52b7",
    "requiresBreathingContext": false,
    "expectedAction": {
      "id": "action-external-oblique-flexion",
      "muscle": "external-oblique",
      "joint": "lumbar-spine",
      "movement": "lumbar-flexion",
      "role": "secondary",
      "contractionType": "concentric",
      "description": "Assists trunk flexion."
    },
    "relationshipId": "relationship-enrichment-muscle-action-action-external-oblique-flexion-belongs-to-system-anatomy-concept-muscular-system",
    "sourcePointerIds": [
      "citation-source-ref-muscle-action-action-external-oblique-flexion-muscle-action-action-external-oblique-flexion-applied-human-anatomy",
      "citation-source-ref-muscle-action-action-external-oblique-flexion-relationship-relationship-enrichment-muscle-action-action-external-oblique-flexion-belongs-to-system-anatomy-concept-muscular-system-applied-human-anatomy"
    ],
    "sourcePointerFactSlugs": [
      "muscle_action:action-external-oblique-flexion",
      "relationship:relationship-enrichment-muscle-action-action-external-oblique-flexion-belongs-to-system-anatomy-concept-muscular-system"
    ],
    "legacyGroupCitationIds": [
      "citation-external-oblique-action"
    ],
    "citationId": "citation-reviewed-action-external-oblique-flexion",
    "reviewNote": "Chapter 5, External Oblique, Action(s). The named muscle explicitly flexes the spine; this supports the unchanged limited trunk-flexion description. Independently compared as an exact educational description; no clinical, other-fact or whole-content acceptance follows."
  },
  {
    "id": "action-anterior-scalene-rib-elevation",
    "muscle": "anterior-scalene",
    "description": "Assists elevation of the first rib during accessory breathing mechanics.",
    "descriptionSha256": "86815122796e3b35a64952580748b18432ea540a7ece2cb0aa472ba68d643ad4",
    "originalSourceRef": "applied-human-anatomy",
    "sourceRef": "temple-hands-on-anatomy-2024",
    "sourceLocator": "https://temple.manifoldapp.org/read/hands-on-anatomy-c6538f97-bc62-44ae-96ff-0f1f97d6c977/section/7e2046c8-f989-4c7b-805e-0f5ce7321e23",
    "evidenceFile": "head-neck.body.txt",
    "startLine": 167,
    "endLine": 176,
    "selectedTextSha256": "69d08d32381f5882c9d2781d87e2f1af62c2736acd408e0b59024107f03a2c33",
    "requiresBreathingContext": true,
    "expectedAction": {
      "id": "action-anterior-scalene-rib-elevation",
      "muscle": "anterior-scalene",
      "joint": "cervical-spine",
      "movement": "rib-elevation",
      "role": "secondary",
      "contractionType": "concentric",
      "description": "Assists elevation of the first rib during accessory breathing mechanics."
    },
    "relationshipId": "relationship-enrichment-muscle-action-action-anterior-scalene-rib-elevation-belongs-to-system-anatomy-concept-muscular-system",
    "sourcePointerIds": [
      "citation-source-ref-muscle-action-action-anterior-scalene-rib-elevation-muscle-action-action-anterior-scalene-rib-elevation-applied-human-anatomy",
      "citation-source-ref-muscle-action-action-anterior-scalene-rib-elevation-relationship-relationship-enrichment-muscle-action-action-anterior-scalene-rib-elevation-belongs-to-system-anatomy-concept-muscular-system-applied-human-anatomy"
    ],
    "sourcePointerFactSlugs": [
      "muscle_action:action-anterior-scalene-rib-elevation",
      "relationship:relationship-enrichment-muscle-action-action-anterior-scalene-rib-elevation-belongs-to-system-anatomy-concept-muscular-system"
    ],
    "legacyGroupCitationIds": [],
    "citationId": "citation-reviewed-action-anterior-scalene-rib-elevation",
    "reviewNote": "Chapter 9, Scalenes, Anterior and Middle, Action(s). Temple explicitly assigns first-rib elevation to these named muscles. Accessory-breathing context additionally uses the pinned A&P 2e deep-inhalation paragraph: https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46484/index.cnxml#L284-L284. No exclusive recruitment, magnitude or quiet-breathing claim is inferred. Independently compared as an exact educational description; no clinical, other-fact or whole-content acceptance follows."
  },
  {
    "id": "action-middle-scalene-rib-elevation",
    "muscle": "middle-scalene",
    "description": "Assists first-rib elevation and thoracic inlet breathing mechanics.",
    "descriptionSha256": "0da9dfcc9efc3dbd8bb67f745ca28c6670e9348af02902540f57d0d6022d3c50",
    "originalSourceRef": "applied-human-anatomy",
    "sourceRef": "temple-hands-on-anatomy-2024",
    "sourceLocator": "https://temple.manifoldapp.org/read/hands-on-anatomy-c6538f97-bc62-44ae-96ff-0f1f97d6c977/section/7e2046c8-f989-4c7b-805e-0f5ce7321e23",
    "evidenceFile": "head-neck.body.txt",
    "startLine": 167,
    "endLine": 176,
    "selectedTextSha256": "69d08d32381f5882c9d2781d87e2f1af62c2736acd408e0b59024107f03a2c33",
    "requiresBreathingContext": true,
    "expectedAction": {
      "id": "action-middle-scalene-rib-elevation",
      "muscle": "middle-scalene",
      "joint": "cervical-spine",
      "movement": "rib-elevation",
      "role": "secondary",
      "contractionType": "concentric",
      "description": "Assists first-rib elevation and thoracic inlet breathing mechanics."
    },
    "relationshipId": "relationship-enrichment-muscle-action-action-middle-scalene-rib-elevation-belongs-to-system-anatomy-concept-muscular-system",
    "sourcePointerIds": [
      "citation-source-ref-muscle-action-action-middle-scalene-rib-elevation-muscle-action-action-middle-scalene-rib-elevation-applied-human-anatomy",
      "citation-source-ref-muscle-action-action-middle-scalene-rib-elevation-relationship-relationship-enrichment-muscle-action-action-middle-scalene-rib-elevation-belongs-to-system-anatomy-concept-muscular-system-applied-human-anatomy"
    ],
    "sourcePointerFactSlugs": [
      "muscle_action:action-middle-scalene-rib-elevation",
      "relationship:relationship-enrichment-muscle-action-action-middle-scalene-rib-elevation-belongs-to-system-anatomy-concept-muscular-system"
    ],
    "legacyGroupCitationIds": [],
    "citationId": "citation-reviewed-action-middle-scalene-rib-elevation",
    "reviewNote": "Chapter 9, Scalenes, Anterior and Middle, Action(s). Temple supplies named first-rib elevation; the pinned A&P 2e deep-inhalation paragraph supplies breathing context: https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/modules/m46484/index.cnxml#L284-L284. Thoracic inlet is the unchanged limited regional description of that contribution, not measured expansion or an additional mechanism. Independently compared as an exact educational description; no clinical, other-fact or whole-content acceptance follows."
  },
  {
    "id": "action-posterior-scalene-cervical-lateral-flexion",
    "muscle": "posterior-scalene",
    "description": "Assists cervical side bending from the posterior scalene line of pull.",
    "descriptionSha256": "16f57cf6fb3625a9b7e4a3b1acdfddcbd076c8b34b959624fb8ba55eabed4b84",
    "originalSourceRef": "applied-human-anatomy",
    "sourceRef": "temple-hands-on-anatomy-2024",
    "sourceLocator": "https://temple.manifoldapp.org/read/hands-on-anatomy-c6538f97-bc62-44ae-96ff-0f1f97d6c977/section/7e2046c8-f989-4c7b-805e-0f5ce7321e23",
    "evidenceFile": "head-neck.body.txt",
    "startLine": 167,
    "endLine": 176,
    "selectedTextSha256": "69d08d32381f5882c9d2781d87e2f1af62c2736acd408e0b59024107f03a2c33",
    "requiresBreathingContext": false,
    "expectedAction": {
      "id": "action-posterior-scalene-cervical-lateral-flexion",
      "muscle": "posterior-scalene",
      "joint": "cervical-spine",
      "movement": "cervical-lateral-flexion",
      "role": "secondary",
      "contractionType": "concentric",
      "description": "Assists cervical side bending from the posterior scalene line of pull."
    },
    "relationshipId": "relationship-enrichment-muscle-action-action-posterior-scalene-cervical-lateral-flexion-belongs-to-system-anatomy-concept-muscular-system",
    "sourcePointerIds": [
      "citation-source-ref-muscle-action-action-posterior-scalene-cervical-lateral-flexion-muscle-action-action-posterior-scalene-cervical-lateral-flexion-applied-human-anatomy",
      "citation-source-ref-muscle-action-action-posterior-scalene-cervical-lateral-flexion-relationship-relationship-enrichment-muscle-action-action-posterior-scalene-cervical-lateral-flexion-belongs-to-system-anatomy-concept-muscular-system-applied-human-anatomy"
    ],
    "sourcePointerFactSlugs": [
      "muscle_action:action-posterior-scalene-cervical-lateral-flexion",
      "relationship:relationship-enrichment-muscle-action-action-posterior-scalene-cervical-lateral-flexion-belongs-to-system-anatomy-concept-muscular-system"
    ],
    "legacyGroupCitationIds": [],
    "citationId": "citation-reviewed-action-posterior-scalene-cervical-lateral-flexion",
    "reviewNote": "Chapter 9, Scalenes, Posterior, Action(s). Named posterior-scalene cervical side bending supports the unchanged limited description. Line of pull adds no quantitative angle, force, side, fixation condition or segment-specific claim. Independently compared as an exact educational description; no clinical, other-fact or whole-content acceptance follows."
  },
  {
    "id": "action-adductor-magnus-hip-adduction",
    "muscle": "adductor-magnus",
    "description": "Adducts the hip through its adductor portion.",
    "descriptionSha256": "78bac5994eae459a365cc46802030eb811eede019faf3851a327092c78ccdfc4",
    "originalSourceRef": "applied-human-anatomy",
    "sourceRef": "temple-hands-on-anatomy-2024",
    "sourceLocator": "https://temple.manifoldapp.org/read/hands-on-anatomy-c6538f97-bc62-44ae-96ff-0f1f97d6c977/section/c56ce988-f5f2-42ae-950a-4e8ca4d98263",
    "evidenceFile": "hip-thigh.body.txt",
    "startLine": 253,
    "endLine": 262,
    "selectedTextSha256": "175fd8d2ff7a17e0e5d9333b1748612414068680fc4c9da3f7d94be5327d112c",
    "requiresBreathingContext": false,
    "expectedAction": {
      "id": "action-adductor-magnus-hip-adduction",
      "muscle": "adductor-magnus",
      "joint": "hip-joint",
      "movement": "hip-adduction",
      "role": "primary",
      "contractionType": "concentric",
      "description": "Adducts the hip through its adductor portion."
    },
    "relationshipId": "relationship-enrichment-muscle-action-action-adductor-magnus-hip-adduction-belongs-to-system-anatomy-concept-muscular-system",
    "sourcePointerIds": [
      "citation-source-ref-muscle-action-action-adductor-magnus-hip-adduction-muscle-action-action-adductor-magnus-hip-adduction-applied-human-anatomy",
      "citation-source-ref-muscle-action-action-adductor-magnus-hip-adduction-relationship-relationship-enrichment-muscle-action-action-adductor-magnus-hip-adduction-belongs-to-system-anatomy-concept-muscular-system-applied-human-anatomy"
    ],
    "sourcePointerFactSlugs": [
      "muscle_action:action-adductor-magnus-hip-adduction",
      "relationship:relationship-enrichment-muscle-action-action-adductor-magnus-hip-adduction-belongs-to-system-anatomy-concept-muscular-system"
    ],
    "legacyGroupCitationIds": [
      "citation-adductor-magnus-action"
    ],
    "citationId": "citation-reviewed-action-adductor-magnus-hip-adduction",
    "reviewNote": "Chapter 6, Adductor Magnus, Adductor Portion, Action(s). The named subdivision explicitly adducts the hip. The separate posterior-fiber hip-extension description is not approved. Independently compared as an exact educational description; no clinical, other-fact or whole-content acceptance follows."
  },
  {
    "id": "action-fibularis-tertius-eversion",
    "muscle": "fibularis-tertius",
    "description": "Assists foot eversion through the fifth metatarsal attachment.",
    "descriptionSha256": "e61aed5149bdeb0c045d28c1242ba331ab193333c1ad0a51dbc3ce61a3c5a86e",
    "originalSourceRef": "applied-human-anatomy",
    "sourceRef": "temple-hands-on-anatomy-2024",
    "sourceLocator": "https://temple.manifoldapp.org/read/hands-on-anatomy-c6538f97-bc62-44ae-96ff-0f1f97d6c977/section/fbaf4654-749e-4c63-baed-5d17cf03aafe",
    "evidenceFile": "knee-lower-leg.body.txt",
    "startLine": 222,
    "endLine": 229,
    "selectedTextSha256": "e93bb7f04f36eb857c3980661abb4fc1e203294a245c253aa4f2a95d68e45a42",
    "requiresBreathingContext": false,
    "expectedAction": {
      "id": "action-fibularis-tertius-eversion",
      "muscle": "fibularis-tertius",
      "joint": "subtalar-joint",
      "movement": "foot-eversion",
      "role": "secondary",
      "contractionType": "concentric",
      "description": "Assists foot eversion through the fifth metatarsal attachment."
    },
    "relationshipId": "relationship-enrichment-muscle-action-action-fibularis-tertius-eversion-belongs-to-system-anatomy-concept-muscular-system",
    "sourcePointerIds": [
      "citation-source-ref-muscle-action-action-fibularis-tertius-eversion-muscle-action-action-fibularis-tertius-eversion-applied-human-anatomy",
      "citation-source-ref-muscle-action-action-fibularis-tertius-eversion-relationship-relationship-enrichment-muscle-action-action-fibularis-tertius-eversion-belongs-to-system-anatomy-concept-muscular-system-applied-human-anatomy"
    ],
    "sourcePointerFactSlugs": [
      "muscle_action:action-fibularis-tertius-eversion",
      "relationship:relationship-enrichment-muscle-action-action-fibularis-tertius-eversion-belongs-to-system-anatomy-concept-muscular-system"
    ],
    "legacyGroupCitationIds": [],
    "citationId": "citation-reviewed-action-fibularis-tertius-eversion",
    "reviewNote": "Chapter 7, Fibularis Tertius, Insertion(s), Action(s), and the connected same-muscle tendon passage. Named eversion and the dorsal fifth-metatarsal-base attachment support the unchanged limited description; no quantitative leverage, exclusive tendon function or subtalar-specific mechanics is inferred. Independently compared as an exact educational description; no clinical, other-fact or whole-content acceptance follows."
  }
].map(binding => Object.freeze({
  ...binding,
  expectedAction: Object.freeze(binding.expectedAction),
  sourcePointerIds: Object.freeze(binding.sourcePointerIds),
  sourcePointerFactSlugs: Object.freeze(binding.sourcePointerFactSlugs),
  legacyGroupCitationIds: Object.freeze(binding.legacyGroupCitationIds),
})))

const byAction = new Map(REVIEWED_TEMPLE_ACTION_BINDINGS.map(row => [row.id, row]))
const byRelation = new Map(REVIEWED_TEMPLE_ACTION_BINDINGS.map(row => [row.relationshipId, row]))
const byPointer = new Map(REVIEWED_TEMPLE_ACTION_BINDINGS.flatMap(row => row.sourcePointerIds.map(id => [id, row])))
const groupIds = new Set(REVIEWED_TEMPLE_ACTION_BINDINGS.flatMap(row => row.legacyGroupCitationIds))

/**
 * Retarget only the six unchanged description identities and their known teaching
 * pointers. Compatibility checks on other action fields do not scientifically
 * approve those fields. Validate all inputs before constructing fresh arrays;
 * preserve historical IDs, unrelated objects and idempotent exact citations.
 * @param {import("./anatomy-foundation.ts").AnatomyFoundationSeed} seed
 * @returns {import("./anatomy-foundation.ts").AnatomyFoundationSeed}
 */
export function withReviewedTempleActionEvidence(seed) {
  const expectedSources = {
    "temple-hands-on-anatomy-2024": {id:"source-temple-hands-on-anatomy-2024", ...TEMPLE_HANDS_ON_ANATOMY_SOURCE_METADATA},
    "applied-human-anatomy": {id:"source-applied-human-anatomy", url:"https://open.umn.edu/opentextbooks/textbooks/1266", license:"CC BY 4.0", usageScope:"open_reuse"},
    "openstax-anatomy-physiology": {id:"source-openstax-anatomy-physiology", url:"https://github.com/openstax/osbooks-anatomy-physiology/blob/b0058a743bdd2cc08196abaaa7d5469970c0d80c/collections/anatomy-and-physiology-2e.collection.xml", license:"CC BY 4.0", usageScope:"open_reuse"},
  }
  for (const [slug, expected] of Object.entries(expectedSources)) {
    const rows = seed.sources.filter(row => row.slug === slug)
    if (rows.length !== 1 || Object.entries(expected).some(([key, value]) => rows[0][key] !== value)) throw new Error(`Reviewed Temple source changed: ${slug}`)
  }
  for (const binding of REVIEWED_TEMPLE_ACTION_BINDINGS) {
    const actions = seed.muscleActions.filter(row => row.id === binding.id)
    if (actions.length !== 1 || Object.entries(binding.expectedAction).some(([key, value]) => actions[0][key] !== value) || ![binding.originalSourceRef, binding.sourceRef].includes(actions[0].sourceRef)) throw new Error(`Reviewed Temple action changed: ${binding.id}`)
    const relations = seed.relationships.filter(row => row.id === binding.relationshipId)
    if (relations.length !== 1 || relations[0].sourceEntityType !== "muscle_action" || relations[0].sourceEntitySlug !== binding.id || relations[0].relationshipType !== "belongs_to_system" || relations[0].targetEntityType !== "anatomy_concept" || relations[0].targetEntitySlug !== "muscular-system" || ![binding.originalSourceRef, binding.sourceRef].includes(relations[0].sourceRef)) throw new Error(`Reviewed Temple teaching context changed: ${binding.id}`)
    const pointers = seed.citations.filter(row => binding.sourcePointerIds.includes(row.id))
    if (pointers.length !== 2 || new Set(pointers.map(row => row.factSlug)).size !== 2 || pointers.some(row => row.slug !== row.id || row.entityType !== "muscle_action" || row.entitySlug !== binding.id || row.factType !== "seed_source_reference" || row.factSlug !== binding.sourcePointerFactSlugs[binding.sourcePointerIds.indexOf(row.id)] || ![binding.originalSourceRef, binding.sourceRef].includes(row.sourceRef) || row.sourceLocator !== (row.sourceRef === binding.originalSourceRef ? expectedSources[binding.originalSourceRef].url : binding.sourceLocator))) throw new Error(`Reviewed Temple source-pointer context changed: ${binding.id}`)
    for (const id of binding.legacyGroupCitationIds) {
      const groups = seed.citations.filter(row => row.id === id)
      if (groups.length !== 1 || groups[0].entityType !== "muscle" || groups[0].entitySlug !== binding.muscle || groups[0].factType !== "action" || groups[0].factSlug !== `${binding.muscle}-actions`) throw new Error(`Reviewed Temple group context changed: ${binding.id}`)
    }
  }
  const muscleActions = seed.muscleActions.map(row => byAction.has(row.id) ? {...row, sourceRef:byAction.get(row.id).sourceRef} : row)
  const relationships = seed.relationships.map(row => byRelation.has(row.id) ? {...row, sourceRef:byRelation.get(row.id).sourceRef} : row)
  const citations = seed.citations.map(row => {
    if (groupIds.has(row.id)) return {...row, reviewStatus:"needs_review", citationNote:"Historical group pointer retained. Only separately compared exact action-ID citations authorize the named facts; no other action is approved by this group pointer."}
    const binding = byPointer.get(row.id)
    return binding ? {...row, sourceRef:binding.sourceRef, sourceLocator:binding.sourceLocator, citationNote:"Stable source-reference ID retained while its exact reviewed description/teaching locator is corrected. Other record fields and clinical use are not approved by this pointer."} : row
  })
  for (const binding of REVIEWED_TEMPLE_ACTION_BINDINGS) {
    const exact = {id:binding.citationId, slug:binding.citationId, entityType:"muscle", entitySlug:binding.muscle, factType:"action", factSlug:binding.id, sourceRef:binding.sourceRef, sourceLocator:binding.sourceLocator, citationNote:binding.reviewNote, reviewStatus:"reviewed"}
    const existing = citations.filter(row => row.id === exact.id)
    if (existing.length > 1 || (existing.length === 1 && JSON.stringify(existing[0]) !== JSON.stringify(exact))) throw new Error(`Exact Temple action citation conflict: ${exact.id}`)
    if (existing.length === 0) citations.push(exact)
  }
  return {...seed, muscleActions, relationships, citations}
}
