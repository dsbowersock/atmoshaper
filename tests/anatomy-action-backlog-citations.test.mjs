import { REVIEWED_TEMPLE_ACTION_BINDINGS } from "../lib/anatomy-temple-action-provenance.js"
import { auditActionBacklogEvidence } from "../scripts/audit-action-backlog-citations.mjs"
import { resolveHeldActionDescription } from "../scripts/held-anatomy-description-revisions.mjs"
import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import fs from "node:fs"
import { describe, it } from "node:test"
import { ANATOMY_FOUNDATION_SEED as seed } from "../lib/anatomy-foundation.js"
import { getAnatomyStudyCards, getAnatomyStudyPrompts, checkFlashcardAnswer } from "../lib/anatomy-study.js"
import { REVIEWED_ACTION_BACKLOG_BINDINGS as bindings, REVIEWED_LATER_ACTION_BINDINGS, withReviewedActionBacklogEvidence, isReviewedActionFigureCitation } from "../lib/anatomy-action-backlog-provenance.js"

const muscles = new Set(bindings.map(binding => binding.muscle))
const prompts = () => getAnatomyStudyPrompts({promptTypes:["muscle_action"]}).filter(prompt => muscles.has(prompt.entitySlug))
const manifest = () => JSON.parse(fs.readFileSync(new URL("../docs/source-evidence/muscle-action-backlog-integration-20261025.json", import.meta.url)))
const revision = () => JSON.parse(fs.readFileSync(new URL("../docs/source-evidence/foot-lumbrical-directional-correction-20261028.json", import.meta.url)))

/** Make a public citation fixture for validator rejection cases, not a runtime approval. */
const exactFor = binding => ({id:binding.citationId, slug:binding.citationId, entityType:"muscle", entitySlug:binding.muscle, factType:"action", factSlug:binding.id, sourceRef:binding.sourceRef, sourceLocator:binding.sourceLocator, reviewStatus:"reviewed"})

/**
 * Compare complete semicolon-delimited spans through the real grader, not substrings.
 * Authored held descriptions can contain semicolons too, so retain contiguous spans.
 */
function answerContainsHeldComponents(prompt, field, answer, description) {
  const components = answer.split(";")
  const heldOnlyPrompt = {...prompt, answerFields:[{...field, acceptedAnswers:[description]}]}
  for (let start = 0; start < components.length; start++) {
    for (let end = start + 1; end <= components.length; end++) {
      const componentAnswer = components.slice(start, end).join(";")
      if (checkFlashcardAnswer(heldOnlyPrompt, {[field.id]:componentAnswer}).correct) return true
    }
  }
  return false
}

/**
 * Check each held description against the full catalog, including accepted aliases.
 * A missing muscle-action prompt offers nothing to credit; return both row counts.
 */
function assertHeldDescriptionsNotCredited(remaining, allPrompts) {
  let withActionPrompt = 0
  for (const pending of remaining) {
    const prompt = allPrompts.find(row => row.entitySlug === pending.muscle)
    if (prompt) withActionPrompt++
    assert.equal(Boolean(prompt && checkFlashcardAnswer(prompt, {action:pending.description}).correct), false, pending.actionId)
    for (const field of prompt?.answerFields ?? []) {
      for (const answer of [field.answer, ...field.acceptedAnswers]) {
        assert.equal(answerContainsHeldComponents(prompt, field, answer, pending.description), false, `${pending.actionId}: held description in ${field.id} answer components`)
      }
    }
  }
  return {heldDescriptionsChecked:remaining.length, withActionPrompt, withoutActionPrompt:remaining.length-withActionPrompt}
}

/** Build an actual unfiltered prompt fixture; mutations remain in a caller-owned clone. */
function heldCompositeFixture() {
  const successors = new Set([...REVIEWED_TEMPLE_ACTION_BINDINGS, ...REVIEWED_LATER_ACTION_BINDINGS].map(row => row.id))
  const remaining = manifest().remainingUnapproved.filter(row => !successors.has(row.actionId))
  const allPrompts = getAnatomyStudyPrompts({promptTypes:["muscle_action"]})
  const pending = remaining.find(row => !muscles.has(row.muscle) && allPrompts.some(prompt => prompt.entitySlug === row.muscle))
  assert.ok(pending)
  return {remaining, allPrompts, pending}
}

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
  it("preserves the historical 40-row remainder and checks all 33 held descriptions against public grading", t => {
    const historical = manifest().remainingUnapproved
    assert.equal(historical.length, 40)
    const successors = new Set([...REVIEWED_TEMPLE_ACTION_BINDINGS, ...REVIEWED_LATER_ACTION_BINDINGS].map(row => row.id))
    const remaining = historical.filter(row => !successors.has(row.actionId))
    assert.equal(remaining.length, 33)
    for (const pending of remaining) {
      const action = seed.muscleActions.find(row => row.id === pending.actionId)
      assert.equal(action.description, resolveHeldActionDescription(pending))
      assert.equal(action.sourceRef, pending.currentSourceRef)
      assert.equal(seed.citations.some(citation => citation.factType === "action" && citation.factSlug === pending.actionId && citation.reviewStatus === "reviewed"), false)
    }
    const allPrompts = getAnatomyStudyPrompts({promptTypes:["muscle_action"]})
    const coverage = assertHeldDescriptionsNotCredited(remaining, allPrompts)
    assert.equal(coverage.heldDescriptionsChecked, 33)
    // Preserve all original negatives and also inspect the one current held successor.
    const current = remaining.map(row => ({...row, description:resolveHeldActionDescription(row)}))
    assert.equal(assertHeldDescriptionsNotCredited(current, allPrompts).heldDescriptionsChecked, 33)
    t.diagnostic(JSON.stringify(coverage))
  })
  it("corrects only the held foot-lumbrical directional modifier", () => {
    const pending = manifest().remainingUnapproved.find(row => row.actionId === "action-lumbricals-foot-toe-extension")
    const action = seed.muscleActions.find(row => row.id === pending.actionId)
    const current = resolveHeldActionDescription(pending)
    assert.equal(current, pending.description.replace("plantar", "dorsal"))
    assert.equal(action.description, current)
    assert.equal(action.sourceRef, pending.currentSourceRef)
    assert.equal(seed.citations.some(row => row.factSlug === action.id && row.factType === "action" && row.reviewStatus === "reviewed"), false)
  })
  it("rejects malformed or different revision identities, text, hashes and scope", () => {
    const pending = manifest().remainingUnapproved.find(row => row.actionId === "action-lumbricals-foot-toe-extension")
    for (const invalid of [null, [], {}, {...revision(), actionId:"another-action"}, {...revision(), schemaVersion:2}]) {
      assert.throws(() => resolveHeldActionDescription(pending, invalid), /Held description revision/)
    }
    for (const change of [
      row => { row.historicalDescription += " Unreviewed." },
      row => { row.historicalDescriptionSha256 = "0".repeat(64) },
      row => { row.currentDescription += " Unreviewed."; row.currentDescriptionSha256 = createHash("sha256").update(row.currentDescription).digest("hex") },
      row => { row.currentDescriptionSha256 = "0".repeat(64) },
      row => { row.scope.sourceAdmission = true },
      row => { row.scope.heldActionRemainsHeld = false },
      row => { row.bibliography[1].doi = "unreviewed" },
      row => { row.extraRevision = {...row} },
    ]) {
      const changed = revision(); change(changed)
      assert.throws(() => resolveHeldActionDescription(pending, changed), /Held description revision/)
    }
    for (const changed of [{...pending, description:pending.description+" Drift."}, {...pending, descriptionSha256:"0".repeat(64)}]) {
      assert.throws(() => resolveHeldActionDescription(changed), /Historical held description changed/)
    }
    const other = manifest().remainingUnapproved.find(row => row.actionId !== pending.actionId)
    assert.equal(resolveHeldActionDescription(other), other.description)
  })
  for (const surface of ["standalone", "primary", "accepted"]) {
    it(`excludes the current held foot-lumbrical description on the ${surface} surface and detects injection`, () => {
      const historical = manifest().remainingUnapproved.find(row => row.actionId === "action-lumbricals-foot-toe-extension")
      const pending = {...historical, description:resolveHeldActionDescription(historical)}
      const allPrompts = getAnatomyStudyPrompts({promptTypes:["muscle_action"]})
      const original = JSON.stringify(allPrompts)
      assert.doesNotThrow(() => assertHeldDescriptionsNotCredited([pending], allPrompts))
      const mutated = structuredClone(allPrompts)
      const prompt = mutated.find(row => row.entitySlug === pending.muscle)
      assert.ok(prompt)
      const field = prompt.answerFields.find(row => row.id === "action")
      assert.equal(checkFlashcardAnswer(prompt, {action:pending.description}).correct, false)
      const composite = `${field.answer}; ${pending.description.toUpperCase()}`
      if (surface === "standalone") {
        field.acceptedAnswers.push(pending.description)
        assert.equal(checkFlashcardAnswer(prompt, {action:pending.description}).correct, true)
      } else if (surface === "primary") {
        field.answer = composite
        assert.equal(checkFlashcardAnswer(prompt, {action:composite}).correct, false)
      } else {
        field.acceptedAnswers.push(composite)
        assert.equal(checkFlashcardAnswer(prompt, {action:composite}).correct, true)
        assert.equal(checkFlashcardAnswer(prompt, {action:pending.description}).correct, false)
      }
      assert.throws(() => assertHeldDescriptionsNotCredited([pending], mutated), error => error.code === "ERR_ASSERTION" && error.message.includes(pending.actionId))
      assert.equal(JSON.stringify(allPrompts), original)
    })
  }
  it("detects credit for a held description in a mutated unfiltered prompt", t => {
    const successors = new Set([...REVIEWED_TEMPLE_ACTION_BINDINGS, ...REVIEWED_LATER_ACTION_BINDINGS].map(row => row.id))
    const remaining = manifest().remainingUnapproved.filter(row => !successors.has(row.actionId))
    const allPrompts = getAnatomyStudyPrompts({promptTypes:["muscle_action"]})
    // Choose an actually offered muscle excluded by the old admitted-cohort filter.
    const pending = remaining.find(row => !muscles.has(row.muscle) && allPrompts.some(prompt => prompt.entitySlug === row.muscle))
    assert.ok(pending)
    const mutated = structuredClone(allPrompts)
    const prompt = mutated.find(row => row.entitySlug === pending.muscle)
    const field = prompt.answerFields.find(row => row.id === "action")
    // Accepted-alias drift must be detected even when the primary answer is unchanged.
    field.acceptedAnswers.push(pending.description)
    assert.equal(checkFlashcardAnswer(prompt, {action:pending.description}).correct, true)
    t.diagnostic(JSON.stringify({mutatedHeldAction:pending.actionId, promptId:prompt.id, primaryAnswerUnchanged:true, acceptedAliasInjected:true}))
    assert.throws(() => assertHeldDescriptionsNotCredited(remaining, mutated), error => error.code === "ERR_ASSERTION" && error.message.includes(pending.actionId))
    assert.equal(checkFlashcardAnswer(allPrompts.find(row => row.entitySlug === pending.muscle), {action:pending.description}).correct, false)
  })
  for (const surface of ["primary", "accepted"]) {
    it(`detects a held description inside the ${surface} composite answer`, t => {
      const {remaining, allPrompts, pending} = heldCompositeFixture()
      const before = JSON.stringify(allPrompts)
      const mutated = structuredClone(allPrompts)
      const prompt = mutated.find(row => row.entitySlug === pending.muscle)
      const field = prompt.answerFields.find(row => row.id === "action")
      const originalAnswer = field.answer
      const composite = `${originalAnswer}; ${pending.description.toUpperCase()}`
      assert.equal(checkFlashcardAnswer(prompt, {action:pending.description}).correct, false)
      if (surface === "primary") {
        // Check the display surface independently before making the composite creditable.
        field.answer = composite
        assert.equal(checkFlashcardAnswer(prompt, {action:composite}).correct, false)
        assert.throws(() => assertHeldDescriptionsNotCredited(remaining, mutated), error => error.code === "ERR_ASSERTION" && error.message.includes(pending.actionId))
      }
      field.acceptedAnswers.push(composite)
      assert.equal(checkFlashcardAnswer(prompt, {action:composite}).correct, true)
      assert.equal(checkFlashcardAnswer(prompt, {action:pending.description}).correct, false)
      if (surface === "accepted") assert.equal(field.answer, originalAnswer)
      t.diagnostic(JSON.stringify({surface, mutatedHeldAction:pending.actionId, compositeCredited:true, standaloneHeldDescriptionCredited:false}))
      assert.throws(() => assertHeldDescriptionsNotCredited(remaining, mutated), error => error.code === "ERR_ASSERTION" && error.message.includes(pending.actionId))
      assert.equal(JSON.stringify(allPrompts), before)
    })
  }
  it("keeps a longer composite component distinct from the held description", () => {
    const {remaining, allPrompts, pending} = heldCompositeFixture()
    const before = JSON.stringify(allPrompts)
    const mutated = structuredClone(allPrompts)
    const prompt = mutated.find(row => row.entitySlug === pending.muscle)
    const field = prompt.answerFields.find(row => row.id === "action")
    const longerComponent = `${pending.description} With an invented extra qualifier.`
    const composite = `${field.answer}; ${longerComponent}`
    field.acceptedAnswers.push(composite)
    assert.equal(checkFlashcardAnswer(prompt, {action:composite}).correct, true)
    assert.equal(checkFlashcardAnswer(prompt, {action:pending.description}).correct, false)
    assert.doesNotThrow(() => assertHeldDescriptionsNotCredited(remaining, mutated))
    assert.equal(JSON.stringify(allPrompts), before)
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


// Explicit later identity: historical pending/source suffixes remain stable.
const ql = {
  id:"action-quadratus-lumborum-stabilization", muscle:"quadratus-lumborum",
  description:"Helps stabilize the twelfth rib, pelvis, and lumbar spine.",
  originalSourceRef:"applied-human-anatomy", sourceRef:"grzonkowska-quadratus-lumborum-2018",
  sourceLocator:"https://link.springer.com/article/10.1007/s00276-017-1901-4",
  relationshipId:"relationship-enrichment-muscle-action-action-quadratus-lumborum-stabilization-belongs-to-system-anatomy-concept-muscular-system",
  citationId:"citation-ql-stabilization-grzonkowska-2018-pending", citationSlug:"ql-stabilization-grzonkowska-2018-pending",
  sourcePointerIds:[
    "citation-source-ref-muscle-action-action-quadratus-lumborum-stabilization-muscle-action-action-quadratus-lumborum-stabilization-applied-human-anatomy",
    "citation-source-ref-muscle-action-action-quadratus-lumborum-stabilization-relationship-relationship-enrichment-muscle-action-action-quadratus-lumborum-stabilization-belongs-to-system-anatomy-concept-muscular-system-applied-human-anatomy",
  ],
}
const qlPrompt = () => getAnatomyStudyPrompts({promptTypes:["muscle_action"]}).find(row => row.entitySlug === ql.muscle)
const qlPriorDescription = "Laterally flexes the lumbar spine."
const qlPriorLabel = "Lumbar Lateral Flexion at Lumbar Spine"
const qlDescriptionComposite = `${qlPriorDescription}; ${ql.description}`

describe("One later exact QL description admission", () => {
  it("adds exactly one frozen later description binding while preserving the dated cohort", () => {
    assert.equal(bindings.length, 47)
    assert.deepEqual(bindings, manifest().bindings)
    assert.deepEqual(REVIEWED_LATER_ACTION_BINDINGS.map(row => row.id), [ql.id])
    const binding = REVIEWED_LATER_ACTION_BINDINGS[0]
    assert.equal(binding.answerScope, "description_only")
    assert.deepEqual(binding.legacyGroupCitationIds, [])
    assert.equal(binding.citationSlug, ql.citationSlug)
    assert.equal(binding.descriptionSha256, createHash("sha256").update(ql.description).digest("hex"))
    assert.ok(Object.isFrozen(REVIEWED_LATER_ACTION_BINDINGS) && Object.isFrozen(binding) && Object.isFrozen(binding.expectedAction))
  })
  it("grades the unchanged description and full description composite while retaining both prior answers", () => {
    const prompt = qlPrompt()
    assert.equal(prompt.id, "muscle_action:muscle-quadratus-lumborum")
    for (const answer of [ql.description, qlDescriptionComposite, qlPriorDescription, qlPriorLabel]) assert.equal(checkFlashcardAnswer(prompt, {action:answer}).correct, true, answer)
    assert.equal(prompt.answerFields[0].answer, qlDescriptionComposite)
    assert.ok(prompt.citations.some(row => row.id === ql.citationSlug && row.sourceRef === ql.sourceRef))
    assert.ok(prompt.sources.some(row => row.id === ql.sourceRef))
  })
  it("rejects stabilization labels and partial or mixed label composites", () => {
    const prompt = qlPrompt()
    const label = "Lumbar Stabilization at Lumbar Spine"
    for (const answer of [label, `${qlPriorLabel}; ${label}`, `${qlPriorLabel}; ${ql.description}`, `${qlPriorDescription}; ${label}`]) {
      assert.equal(checkFlashcardAnswer(prompt, {action:answer}).correct, false, answer)
      assert.equal(prompt.answerFields[0].acceptedAnswers.includes(answer), false, answer)
    }
    assert.equal(checkFlashcardAnswer(prompt, {action:qlPriorLabel}).correct, true)
  })
  it("retains exact action metadata, promoted citation and only the original teaching/source-pointer identities", () => {
    assert.deepEqual(seed.muscleActions.find(row => row.id === ql.id), {id:ql.id, muscle:ql.muscle, joint:"lumbar-spine", movement:"lumbar-stabilization", role:"stabilizer", contractionType:"isometric", description:ql.description, sourceRef:ql.sourceRef})
    const exact = seed.citations.filter(row => row.id === ql.citationId)
    assert.equal(exact.length, 1)
    for (const [key, value] of Object.entries({slug:ql.citationSlug, entityType:"muscle", entitySlug:ql.muscle, factType:"action", factSlug:ql.id, sourceRef:ql.sourceRef, sourceLocator:ql.sourceLocator, reviewStatus:"reviewed"})) assert.equal(exact[0][key], value, key)
    for (const context of [/Introduction/, /Discussion/, /fetal/]) assert.match(exact[0].citationNote, context)
    const relations = seed.relationships.filter(row => row.id === ql.relationshipId)
    assert.equal(relations.length, 1)
    assert.equal(relations[0].sourceRef, ql.sourceRef)
    const pointers = seed.citations.filter(row => row.entityType === "muscle_action" && row.entitySlug === ql.id && row.factType === "seed_source_reference")
    assert.deepEqual(pointers.map(row => row.id).sort(), [...ql.sourcePointerIds].sort())
    for (const [index, id] of ql.sourcePointerIds.entries()) {
      const pointer = pointers.find(row => row.id === id)
      assert.equal(pointer.factSlug, index === 0 ? `muscle_action:${ql.id}` : `relationship:${ql.relationshipId}`)
      assert.equal(pointer.sourceRef, ql.sourceRef)
      assert.equal(pointer.sourceLocator, ql.sourceLocator)
    }
    assert.equal(seed.citations.find(row => row.id === "citation-quadratus-lumborum-action").reviewStatus, "needs_review")
    assert.equal(isReviewedActionFigureCitation(exact[0]), false)
  })
  it("retargets original QL source state idempotently without regenerating IDs or mutating input", () => {
    const input = structuredClone(seed)
    input.muscleActions.find(row => row.id === ql.id).sourceRef = ql.originalSourceRef
    input.relationships.find(row => row.id === ql.relationshipId).sourceRef = ql.originalSourceRef
    for (const id of ql.sourcePointerIds) Object.assign(input.citations.find(row => row.id === id), {sourceRef:ql.originalSourceRef, sourceLocator:"https://open.umn.edu/opentextbooks/textbooks/1266"})
    const before = structuredClone(input)
    const result = withReviewedActionBacklogEvidence(input)
    assert.deepEqual(input, before)
    assert.equal(result.muscleActions.find(row => row.id === ql.id).sourceRef, ql.sourceRef)
    assert.equal(result.relationships.find(row => row.id === ql.relationshipId).sourceRef, ql.sourceRef)
    for (const id of ql.sourcePointerIds) assert.equal(result.citations.find(row => row.id === id).sourceRef, ql.sourceRef)
    assert.deepEqual(result.citations.map(row => row.id), input.citations.map(row => row.id))
    assert.deepEqual(withReviewedActionBacklogEvidence(result), result)
  })
  it("rejects complete action, teaching, pointer and citation corruption without mutation", () => {
    const changes = [
      ...["muscle", "joint", "movement", "role", "contractionType", "description", "sourceRef"].map(key => copy => { copy.muscleActions.find(row => row.id === ql.id)[key] = "unreviewed-drift" }),
      copy => { copy.muscleActions.find(row => row.id === ql.id).unreviewedMetadata = "additional-field" },
      copy => { copy.muscleActions.push({...copy.muscleActions.find(row => row.id === ql.id)}) },
      copy => { copy.relationships.find(row => row.id === ql.relationshipId).targetEntitySlug = "skeletal-system" },
      copy => { copy.relationships.push({...copy.relationships.find(row => row.id === ql.relationshipId)}) },
      ...["slug", "entitySlug", "factSlug", "sourceRef", "sourceLocator", "reviewStatus"].map(key => copy => { copy.citations.find(row => row.id === ql.sourcePointerIds[0])[key] = "unreviewed-drift" }),
      copy => { copy.citations.push({...copy.citations.find(row => row.id === ql.sourcePointerIds[0])}) },
      copy => { copy.citations = copy.citations.filter(row => row.id !== ql.sourcePointerIds[1]) },
      copy => { copy.citations.find(row => row.id === ql.citationId).reviewStatus = "needs_review" },
      copy => { copy.citations.find(row => row.id === ql.citationId).sourceLocator += "#unreviewed" },
      copy => { copy.citations.push({...copy.citations.find(row => row.id === ql.citationId)}) },
    ]
    for (const change of changes) {
      const input = structuredClone(seed)
      change(input)
      const before = structuredClone(input)
      assert.throws(() => withReviewedActionBacklogEvidence(input), /Reviewed backlog action changed|Reviewed action (teaching|source-pointer) context changed|Exact backlog action citation conflict/)
      assert.deepEqual(input, before)
    }
  })
  it("rejects article identity, DOI URL, license and reuse-scope drift", () => {
    for (const patch of [{id:"different-source"}, {url:"https://example.test/unreviewed"}, {license:"unreviewed"}, {licenseUrl:"https://example.test/license"}, {usageScope:"reference_only"}]) {
      const input = structuredClone(seed)
      Object.assign(input.sources.find(row => row.slug === ql.sourceRef), patch)
      const before = structuredClone(input)
      assert.throws(() => withReviewedActionBacklogEvidence(input), /Reviewed action source changed/)
      assert.deepEqual(input, before)
    }
  })
  it("withholds the new answers on exact citation status/source/fact failure while retaining prior answers", () => {
    const citation = seed.citations.find(row => row.id === ql.citationId)
    const original = {...citation}
    assert.equal(checkFlashcardAnswer(qlPrompt(), {action:ql.description}).correct, true)
    try {
      for (const patch of [{reviewStatus:"needs_review"}, {sourceRef:ql.originalSourceRef}, {factSlug:"quadratus-lumborum-actions"}, {entitySlug:"another-muscle"}]) {
        Object.assign(citation, original, patch)
        const prompt = qlPrompt()
        for (const answer of [ql.description, qlDescriptionComposite]) assert.equal(checkFlashcardAnswer(prompt, {action:answer}).correct, false, answer)
        for (const answer of [qlPriorDescription, qlPriorLabel]) assert.equal(checkFlashcardAnswer(prompt, {action:answer}).correct, true, answer)
        assert.equal(prompt.citations.some(row => row.id === ql.citationSlug), false)
      }
    } finally { Object.assign(citation, original) }
    assert.equal(checkFlashcardAnswer(qlPrompt(), {action:ql.description}).correct, true)
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
