import fs from "node:fs"
import { auditMuscleActionEvidence, assertMuscleActionPublisherLocators } from "../scripts/audit-muscle-action-citations.mjs"
import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { ANATOMY_FOUNDATION_SEED as seed } from "../lib/anatomy-foundation.js"
import { getAnatomyStudyPrompts, getAnatomyStudyCards, checkFlashcardAnswer } from "../lib/anatomy-study.js"
import { REVIEWED_MUSCLE_ACTION_BINDINGS as bindings, REVIEWED_LUMBAR_STUDY_SOURCE, OFFERED_FOOT_SOURCE_BINDING as foot, withReviewedMuscleActionEvidence } from "../lib/anatomy-muscle-action-provenance.js"

const selected = new Set(bindings.map(binding => binding.muscle))
const actionPrompts = () => getAnatomyStudyPrompts({promptTypes:["muscle_action"]}).filter(prompt => selected.has(prompt.entitySlug))

describe("Precisely sourced existing muscle actions", () => {
  it("binds all seven unchanged authored facts to exact reviewed citation IDs and sources", () => {
    for (const binding of bindings) {
      const action = seed.muscleActions.find(row => row.id === binding.id)
      assert.equal(action.description, binding.description)
      assert.equal(action.sourceRef, binding.sourceRef)
      const citation = seed.citations.find(row => row.id === binding.citationId)
      assert.ok(citation, binding.id)
      assert.equal(citation.factSlug, action.id)
      assert.equal(citation.sourceRef, action.sourceRef)
      assert.equal(citation.reviewStatus, "reviewed")
      assert.equal(citation.sourceLocator, binding.sourceLocator)
    }
  })

  it("exposes four actual action prompts with every sourced action in their answers", () => {
    const prompts = actionPrompts()
    assert.equal(prompts.length, 4)
    for (const muscle of selected) {
      const prompt = prompts.find(row => row.entitySlug === muscle)
      const facts = bindings.filter(binding => binding.muscle === muscle)
      assert.equal(prompt.citations.length, facts.length)
      assert.ok(facts.every(fact => prompt.answerFields[0].answer.includes(fact.description)))
      assert.ok(facts.every(fact => prompt.sources.some(source => source.id === fact.sourceRef)))
      assert.equal(checkFlashcardAnswer(prompt, {action:prompt.answerFields[0].answer}).correct, true)
    }
  })

  it("records the separately licensed primary study without relabeling muscle summaries", () => {
    assert.deepEqual(seed.sources.find(source => source.slug === REVIEWED_LUMBAR_STUDY_SOURCE.slug), REVIEWED_LUMBAR_STUDY_SOURCE)
    for (const card of getAnatomyStudyCards().filter(row => selected.has(row.entitySlug) && row.entityType === "muscle")) {
      assert.ok(card.sourceRefs.includes("applied-human-anatomy"))
      assert.equal(card.sourceRefs.includes(REVIEWED_LUMBAR_STUDY_SOURCE.slug), false)
    }
  })

  it("keeps the four original group-pointer IDs as pending historical references", () => {
    for (const muscle of selected) {
      const citation = seed.citations.find(row => row.id === `citation-${muscle}-action`)
      assert.ok(citation)
      assert.equal(citation.factSlug, `${muscle}-actions`)
      assert.equal(citation.reviewStatus, "needs_review")
    }
  })

  it("continues to suppress an action when its exact citation is pending, mismatched or source-inconsistent", () => {
    const citation = seed.citations.find(row => row.id === "citation-reviewed-action-frontalis-brow-elevation")
    assert.ok(citation)
    const original = {...citation}
    try {
      for (const patch of [{reviewStatus:"needs_review"},{factSlug:"frontalis-actions"},{sourceRef:"applied-human-anatomy"}]) {
        Object.assign(citation, original, patch)
        assert.equal(actionPrompts().some(prompt => prompt.entitySlug === "frontalis"), false)
      }
    } finally { Object.assign(citation, original) }
    assert.equal(actionPrompts().some(prompt => prompt.entitySlug === "frontalis"), true)
  })

  it("rejects changed input facts instead of silently reapproving them", () => {
    const changed = structuredClone(seed)
    changed.muscleActions.find(action => action.id === bindings[0].id).description += " Unreviewed extension."
    assert.throws(() => withReviewedMuscleActionEvidence(changed), /Reviewed action input changed/)
  })

  it("does not approve another action merely because it belongs to a selected muscle", () => {
    const changed = structuredClone(seed)
    const extra = {...changed.muscleActions.find(action => action.id === bindings[0].id),id:"unreviewed-test-action",sourceRef:"future-clinical-citation-needed"}
    changed.muscleActions.push(extra)
    const result = withReviewedMuscleActionEvidence(changed)
    assert.equal(result.muscleActions.find(action => action.id === extra.id).sourceRef, extra.sourceRef)
    assert.equal(result.citations.some(citation => citation.factType === "action" && citation.factSlug === extra.id), false)
  })
})

describe("Already offered foot descriptions retain their answers with precise attribution", () => {
  it("shows both independently licensed supports without changing the offered action or summary", () => {
    const card = getAnatomyStudyCards().find(row => row.entityType === "muscle" && row.entitySlug === foot.muscle)
    assert.equal(card.summary, foot.summary)
    assert.deepEqual(new Set(card.sourceRefs), new Set([foot.sourceRef, foot.supplementRef]))
    const prompt = getAnatomyStudyPrompts({promptTypes:["muscle_action"]}).find(row => row.entitySlug === foot.muscle)
    assert.ok(prompt)
    for (const answer of ["Toe Flexion at Metatarsophalangeal Joints", foot.description]) {
      assert.equal(checkFlashcardAnswer(prompt, {action:answer}).correct, true)
    }
    for (const sourceRef of [foot.sourceRef, foot.supplementRef]) {
      const id = sourceRef === foot.sourceRef ? "citation-lumbricals-foot-action" : "citation-lumbricals-foot-action-posnik-2024"
      assert.ok(prompt.citations.some(row => row.id === id && row.sourceRef === sourceRef))
    }
    const held = seed.muscleActions.find(row => row.id === "action-lumbricals-foot-toe-extension")
    assert.equal(held.sourceRef, "applied-human-anatomy")
    assert.equal(checkFlashcardAnswer(prompt, {action:held.description}).correct, false)
    assert.equal(checkFlashcardAnswer(prompt, {action:`${foot.description}; ${held.description}`}).correct, false)
  })

  it("keeps the citation correction idempotent and refuses changed description or source input", () => {
    assert.deepEqual(withReviewedMuscleActionEvidence(structuredClone(seed)), seed)
    const changed = structuredClone(seed)
    changed.muscles.find(row => row.slug === foot.muscle).description += " Unreviewed claim."
    assert.throws(() => withReviewedMuscleActionEvidence(changed), /Offered foot description input changed/)
    const conflict = structuredClone(seed)
    conflict.citations.find(row => row.id === "citation-lumbricals-foot-action-posnik-2024").sourceLocator = "https://example.invalid/"
    assert.throws(() => withReviewedMuscleActionEvidence(conflict), /Offered foot supplemental citation conflict/)
  })
})

describe("Action evidence integrity boundaries", () => {
  const manifest = () => JSON.parse(fs.readFileSync(new URL("../docs/source-evidence/anatomy-muscle-action-review-20261025.json",import.meta.url)))
  it("does not turn a source check into clinical acceptance", () => {
    const changed = manifest()
    changed.clinicalAcceptanceComplete = true
    assert.throws(()=>auditMuscleActionEvidence(changed,seed,()=>{throw new Error("must not read artifacts")}),/Expected values/)
  })
  it("rejects a replaced artifact even when its size is unchanged", () => {
    const data = manifest()
    assert.throws(()=>auditMuscleActionEvidence(data,seed,name=>Buffer.alloc(data.publisherArtifacts.find(artifact=>artifact.file===name).bytes)),/Artifact digest/)
  })
})

// Retained element ranges are independent of matching runtime citation strings.
describe("Audited action locator boundaries", () => {
  const manifest = () => JSON.parse(fs.readFileSync(new URL("../docs/source-evidence/anatomy-muscle-action-review-20261025.json", import.meta.url)))
  it("requires runtime and manifest locators to point to the audited OpenStax element", () => {
    const data = manifest()
    assertMuscleActionPublisherLocators(data)
    for (const binding of data.bindings) assert.equal(bindings.find(row => row.id === binding.id).sourceLocator, binding.sourceLocator)
  })
  it("rejects citation and manifest strings that agree but drift beyond the audited element", () => {
    const data = manifest(), changed = structuredClone(seed)
    const binding = data.bindings.find(row => row.id === "action-frontalis-brow-elevation")
    binding.sourceLocator = binding.sourceLocator.replace(/#L\d+-L\d+$/, "#L24-L27")
    changed.citations.find(row => row.id === binding.citationId).sourceLocator = binding.sourceLocator
    assert.equal(changed.citations.find(row => row.id === binding.citationId).sourceLocator, binding.sourceLocator)
    assert.throws(() => assertMuscleActionPublisherLocators(data), /Publisher element locator/)
  })
  it("rejects an unbound or ambiguous publisher element", () => {
    for (const duplicate of [false, true]) {
      const data = manifest(), binding = data.bindings.find(row => row.id === "action-frontalis-brow-elevation")
      if (duplicate) data.publisherElements.push({...data.publisherElements.find(row => row.elementId === binding.publisherElementId)})
      else binding.publisherElementId = "unreviewed-element"
      assert.throws(() => assertMuscleActionPublisherLocators(data), /Unique publisher element/)
    }
  })
})
