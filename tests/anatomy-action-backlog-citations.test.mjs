import { REVIEWED_TEMPLE_ACTION_BINDINGS } from "../lib/anatomy-temple-action-provenance.js"
import { auditActionBacklogEvidence } from "../scripts/audit-action-backlog-citations.mjs"
import assert from "node:assert/strict"
import fs from "node:fs"
import { describe, it } from "node:test"
import { ANATOMY_FOUNDATION_SEED as seed } from "../lib/anatomy-foundation.js"
import { getAnatomyStudyCards, getAnatomyStudyPrompts, checkFlashcardAnswer } from "../lib/anatomy-study.js"
import { REVIEWED_ACTION_BACKLOG_BINDINGS as bindings, withReviewedActionBacklogEvidence, isReviewedActionFigureCitation } from "../lib/anatomy-action-backlog-provenance.js"

const muscles = new Set(bindings.map(binding => binding.muscle))
const prompts = () => getAnatomyStudyPrompts({promptTypes:["muscle_action"]}).filter(prompt => muscles.has(prompt.entitySlug))
const manifest = () => JSON.parse(fs.readFileSync(new URL("../docs/source-evidence/muscle-action-backlog-integration-20261025.json", import.meta.url)))

/** Make a public citation fixture for validator rejection cases, not a runtime approval. */
const exactFor = binding => ({id:binding.citationId, slug:binding.citationId, entityType:"muscle", entitySlug:binding.muscle, factType:"action", factSlug:binding.id, sourceRef:binding.sourceRef, sourceLocator:binding.sourceLocator, reviewStatus:"reviewed"})

describe("Complete supported action-citation batch", () => {
  it("binds all 47 unchanged descriptions to their exact primary-source citations", () => {
    assert.equal(bindings.length, 47)
    assert.equal(muscles.size, 32)
    for (const binding of bindings) {
      const action = seed.muscleActions.find(row => row.id === binding.id)
      assert.equal(action.muscle, binding.muscle)
      assert.equal(action.description, binding.description)
      assert.equal(action.sourceRef, binding.sourceRef)
      const citation = seed.citations.find(row => row.id === binding.citationId)
      assert.ok(citation, binding.id)
      for (const [key, value] of Object.entries(exactFor(binding))) assert.equal(citation[key], value)
      assert.equal(citation.citationNote, binding.reviewNote)
    }
  })
  it("puts each selected fact into the actual 32 answer/credit surfaces and grades those answers", () => {
    const all = prompts()
    assert.equal(all.length, 32)
    for (const muscle of muscles) {
      const prompt = all.find(row => row.entitySlug === muscle)
      const selected = bindings.filter(binding => binding.muscle === muscle)
      assert.ok(prompt)
      for (const binding of selected) {
        assert.ok(prompt.answerFields[0].answer.includes(binding.description), binding.id)
        assert.ok(prompt.citations.some(citation => citation.id === binding.citationId), binding.id)
        assert.ok(prompt.sources.some(source => source.id === binding.sourceRef), binding.id)
      }
      assert.equal(checkFlashcardAnswer(prompt, {action:prompt.answerFields[0].answer}).correct, true)
    }
  })
  it("preserves the historical 40-row remainder and keeps the other 34 rows unapproved", () => {
    const historical = manifest().remainingUnapproved
    assert.equal(historical.length, 40)
    const successors = new Set(REVIEWED_TEMPLE_ACTION_BINDINGS.map(row => row.id))
    const remaining = historical.filter(row => !successors.has(row.actionId))
    assert.equal(remaining.length, 34)
    for (const pending of remaining) {
      const action = seed.muscleActions.find(row => row.id === pending.actionId)
      assert.equal(action.description, pending.description)
      assert.equal(action.sourceRef, pending.currentSourceRef)
      assert.equal(seed.citations.some(citation => citation.factType === "action" && citation.factSlug === pending.actionId && citation.reviewStatus === "reviewed"), false)
      // Identical wording on another muscle cannot approve this held action ID.
      assert.equal(prompts().some(prompt => prompt.entitySlug === pending.muscle && prompt.answerFields[0].answer.includes(pending.description)), false)
    }
  })
  it("uses the qualified-knee book evidence as primary attribution", () => {
    const qualified = bindings.filter(binding => binding.primaryEvidenceKind === "book_question_answer")
    assert.equal(qualified.length, 3)
    for (const binding of qualified) {
      const action = seed.muscleActions.find(row => row.id === binding.id)
      assert.equal(action.sourceRef, "applied-human-anatomy")
      const citation = seed.citations.find(row => row.id === binding.citationId)
      assert.equal(citation.sourceLocator, "https://open.umn.edu/opentextbooks/formats/3154#page=165")
      assert.ok(citation.citationNote.includes("#page=59") && citation.citationNote.includes("#page=60"))
      assert.ok(prompts().find(prompt => prompt.entitySlug === binding.muscle).sources.some(source => source.id === "applied-human-anatomy"))
    }
  })
  it("preserves the 94 exact source-pointer IDs and their fact/teaching context", () => {
    assert.equal(new Set(bindings.flatMap(binding => binding.sourcePointerIds)).size, 94)
    for (const binding of bindings) {
      const actual = seed.citations.filter(citation => binding.sourcePointerIds.includes(citation.id))
      assert.equal(actual.length, 2)
      assert.deepEqual(new Set(actual.map(row => row.factSlug)), new Set(binding.sourcePointerFactSlugs))
      assert.ok(actual.every(row => row.entityType === "muscle_action" && row.entitySlug === binding.id && row.sourceRef === binding.sourceRef && row.sourceLocator === binding.sourceLocator))
      assert.equal(seed.relationships.find(row => row.id === binding.relationshipId).sourceRef, binding.sourceRef)
    }
  })
  it("retains all 22 existing group-pointer IDs as pending history", () => {
    const ids = new Set(bindings.flatMap(binding => binding.legacyGroupCitationIds))
    assert.equal(ids.size, 22)
    for (const id of ids) assert.equal(seed.citations.find(citation => citation.id === id).reviewStatus, "needs_review")
  })
  it("is idempotent and does not mutate caller-owned input", () => {
    const input = structuredClone(seed)
    const before = structuredClone(input)
    const result = withReviewedActionBacklogEvidence(input)
    assert.deepEqual(input, before)
    assert.deepEqual(withReviewedActionBacklogEvidence(result), result)
  })
  it("rejects changed descriptions, muscles, sources and duplicate IDs without mutation", () => {
    for (const change of [
      copy => { copy.muscleActions.find(row => row.id === bindings[0].id).description += " An unreviewed claim." },
      copy => { copy.muscleActions.find(row => row.id === bindings[0].id).muscle = "another-muscle" },
      copy => { copy.muscleActions.find(row => row.id === bindings[0].id).sourceRef = "future-unreviewed-source" },
      copy => { copy.muscleActions.push({...copy.muscleActions.find(row => row.id === bindings[0].id)}) },
    ]) {
      const input = structuredClone(seed)
      change(input)
      const before = structuredClone(input)
      assert.throws(() => withReviewedActionBacklogEvidence(input), /Reviewed backlog action changed/)
      assert.deepEqual(input, before)
    }
  })
  it("rejects a changed publisher identity or source scope", () => {
    for (const patch of [{url:"https://example.test/unreviewed"}, {usageScope:"reference_only"}, {license:"unreviewed license"}]) {
      const input = structuredClone(seed)
      Object.assign(input.sources.find(row => row.slug === "openstax-anatomy-physiology"), patch)
      assert.throws(() => withReviewedActionBacklogEvidence(input), /Reviewed action source changed/)
    }
  })
  it("does not retarget an unrelated relationship or an unknown source-pointer ID", () => {
    const input = structuredClone(seed)
    const otherRelation = {...input.relationships.find(row => row.id === bindings[0].relationshipId), id:"unreviewed-relation", targetEntitySlug:"skeletal-system", sourceRef:bindings[0].originalSourceRef}
    const otherPointer = {...input.citations.find(row => row.id === bindings[0].sourcePointerIds[0]), id:"unreviewed-pointer", slug:"unreviewed-pointer", sourceRef:bindings[0].originalSourceRef}
    input.relationships.push(otherRelation)
    input.citations.push(otherPointer)
    const result = withReviewedActionBacklogEvidence(input)
    assert.deepEqual(result.relationships.find(row => row.id === otherRelation.id), otherRelation)
    assert.deepEqual(result.citations.find(row => row.id === otherPointer.id), otherPointer)
  })
  it("rejects changed teaching and source-pointer context", () => {
    for (const change of [
      copy => { copy.relationships.find(row => row.id === bindings[0].relationshipId).targetEntitySlug = "another-system" },
      copy => { copy.citations.find(row => row.id === bindings[0].sourcePointerIds[0]).factSlug = "another-fact" },
      copy => { copy.citations.push({...copy.citations.find(row => row.id === bindings[0].sourcePointerIds[0])}) },
    ]) {
      const input = structuredClone(seed)
      change(input)
      const before = structuredClone(input)
      assert.throws(() => withReviewedActionBacklogEvidence(input), /Reviewed action (teaching|source-pointer) context changed/)
      assert.deepEqual(input, before)
    }
  })
  it("rejects a conflicting exact citation instead of overwriting it", () => {
    const input = withReviewedActionBacklogEvidence(structuredClone(seed))
    input.citations.find(row => row.id === bindings[0].citationId).sourceLocator = "https://example.test/conflict"
    const before = structuredClone(input)
    assert.throws(() => withReviewedActionBacklogEvidence(input), /Exact backlog action citation conflict/)
    assert.deepEqual(input, before)
  })
  it("does not approve a new fact merely because its muscle was selected", () => {
    const input = structuredClone(seed)
    const other = {...input.muscleActions.find(row => row.id === bindings[0].id), id:"action-new-unreviewed-example", sourceRef:"future-clinical-citation-needed"}
    input.muscleActions.push(other)
    const result = withReviewedActionBacklogEvidence(input)
    assert.deepEqual(result.muscleActions.find(row => row.id === other.id), other)
    assert.equal(result.citations.some(row => row.factType === "action" && row.factSlug === other.id), false)
  })
  it("suppresses an actual sole-fact prompt for pending, source or identity mismatch", () => {
    const citation = seed.citations.find(row => row.id === "citation-reviewed-action-masseter-jaw-elevation")
    assert.ok(citation)
    const original = {...citation}
    try {
      for (const patch of [{reviewStatus:"needs_review"}, {sourceRef:"applied-human-anatomy"}, {factSlug:"masseter-actions"}, {entitySlug:"temporalis"}]) {
        Object.assign(citation, original, patch)
        assert.ok(getAnatomyStudyCards().some(card => card.entitySlug === "masseter"))
        assert.equal(prompts().some(prompt => prompt.entitySlug === "masseter"), false)
      }
    } finally { Object.assign(citation, original) }
    assert.equal(prompts().some(prompt => prompt.entitySlug === "masseter"), true)
  })
})

describe("Precisely registered publisher figure locators", () => {
  const figures = bindings.filter(binding => binding.primaryEvidenceKind === "publisher_table_image")
  it("recognizes all 20 exact fact and known source-pointer identities", () => {
    assert.equal(figures.length, 20)
    for (const binding of figures) {
      assert.equal(isReviewedActionFigureCitation(exactFor(binding)), true)
      for (let index = 0; index < 2; index++) {
        const pointer = {id:binding.sourcePointerIds[index], entityType:"muscle_action", entitySlug:binding.id, factType:"seed_source_reference", factSlug:binding.sourcePointerFactSlugs[index], sourceRef:binding.sourceRef, sourceLocator:binding.sourceLocator, reviewStatus:"reviewed"}
        assert.equal(isReviewedActionFigureCitation(pointer), true)
        assert.equal(isReviewedActionFigureCitation({...pointer, id:"unknown-pointer"}), false)
        assert.equal(isReviewedActionFigureCitation({...pointer, factSlug:"unreviewed-related-context"}), false)
        assert.equal(isReviewedActionFigureCitation({...pointer, factSlug:binding.sourcePointerFactSlugs[1-index]}), false)
      }
    }
  })
  it("rejects unknown figure URLs, broader IDs, mismatched sources and pending state", () => {
    const exact = exactFor(figures[0])
    for (const patch of [{sourceLocator:exact.sourceLocator+"#unreviewed"}, {sourceLocator:exact.sourceLocator.replace("/media/","/another-directory/")}, {id:"unknown-citation"}, {entitySlug:"another-muscle"}, {factSlug:"a-group-actions"}, {sourceRef:"another-source"}, {reviewStatus:"needs_review"}, {factType:"clinical_summary"}]) {
      assert.equal(isReviewedActionFigureCitation({...exact, ...patch}), false)
    }
  })
})


describe("Whole-batch evidence boundaries", () => {
  const review = () => JSON.parse(fs.readFileSync(new URL("../docs/source-evidence/muscle-action-backlog-review-20261025.json", import.meta.url)))
  it("rejects clinical, whole-migration or automated semantic acceptance before artifact reads", () => {
    for (const key of ["clinicalAcceptanceComplete", "wholeMigrationComplete", "automatedSemanticTruthClaim"]) {
      const data = manifest()
      data[key] = true
      assert.throws(() => auditActionBacklogEvidence(data, review(), seed, () => { throw Error("must not read artifacts") }), /Expected values/)
    }
  })
  it("rejects adding one of the 40 unsupported rows to the exact bindings", () => {
    const data = manifest()
    data.bindings.push({...data.bindings[0], id:data.remainingUnapproved[0].actionId})
    assert.throws(() => auditActionBacklogEvidence(data, review(), seed, () => { throw Error("must not read artifacts") }), /Expected values/)
  })
  it("rejects replacement of the complete manual comparison", () => {
    const data = review()
    data.rows[0].description += " Unreviewed change."
    assert.throws(() => auditActionBacklogEvidence(manifest(), data, seed, () => { throw Error("must not read artifacts") }), /Complete review input changed/)
  })
  it("rejects same-size corrupted publisher evidence instead of retrieving replacements", () => {
    assert.throws(() => auditActionBacklogEvidence(manifest(), review(), seed, artifact => Buffer.alloc(artifact.bytes)), /Artifact digest mismatch/)
  })
})
