import assert from "node:assert/strict"
import fs from "node:fs"
import { describe, it } from "node:test"
import { ANATOMY_FOUNDATION_SEED as seed } from "../lib/anatomy-foundation.js"
import { getAnatomyStudyPrompts, checkFlashcardAnswer } from "../lib/anatomy-study.js"
import { REVIEWED_TEMPLE_ACTION_BINDINGS as bindings, TEMPLE_HANDS_ON_ANATOMY_SOURCE_METADATA as metadata, withReviewedTempleActionEvidence } from "../lib/anatomy-temple-action-provenance.js"
import { auditTempleActionEvidence } from "../scripts/audit-temple-action-citations.mjs"
import { resolveHeldActionDescription } from "../scripts/held-anatomy-description-revisions.mjs"

const manifest = () => JSON.parse(fs.readFileSync(new URL("../docs/source-evidence/temple-hands-on-anatomy-actions-20261028.json", import.meta.url)))
const actionPrompts = () => getAnatomyStudyPrompts({promptTypes:["muscle_action"]})
const noArtifactRead = () => { throw new Error("must not read artifacts") }

// Freeze the previously offered taxonomy-derived answers: the six source reviews
// support descriptions only, so neither these labels nor their composites qualify.
const descriptionOnlyLabels = {
  "action-external-oblique-flexion": ["Lumbar Flexion at Lumbar Spine", "Lumbar Flexion at Lumbar Spine; Lumbar Rotation at Lumbar Spine; Lumbar Lateral Flexion at Lumbar Spine"],
  "action-anterior-scalene-rib-elevation": ["Rib Elevation at Cervical Spine", "Cervical Lateral Flexion at Cervical Spine; Rib Elevation at Cervical Spine"],
  "action-middle-scalene-rib-elevation": ["Rib Elevation at Cervical Spine", "Cervical Lateral Flexion at Cervical Spine; Rib Elevation at Cervical Spine"],
  "action-posterior-scalene-cervical-lateral-flexion": ["Cervical Lateral Flexion at Cervical Spine", "Cervical Lateral Flexion at Cervical Spine; Rib Elevation at Cervical Spine"],
  "action-adductor-magnus-hip-adduction": ["Hip Adduction at Hip Joint"],
  "action-fibularis-tertius-eversion": ["Foot Eversion at Subtalar Joint", "Ankle Dorsiflexion at Ankle Joint; Foot Eversion at Subtalar Joint"],
}

const invalidBaselineLabels = [
  {promptId:"muscle_action:muscle-posterior-scalene", answer:"Rib Elevation at Cervical Spine"},
  {promptId:"muscle_action:muscle-scalenes", answer:"Rib Elevation at Cervical Spine"},
  {promptId:"muscle_action:muscle-scalenes", answer:"Cervical Lateral Flexion at Cervical Spine; Rib Elevation at Cervical Spine"},
]

describe("Precisely rejected baseline cervical-rib labels", () => {
  it("fixes exactly three source-pinned compatibility exceptions with no other loss allowance", () => {
    const exceptions = manifest().baselineAnswerCorrectnessExceptions
    assert.deepEqual(exceptions.corrections.map(({promptId, answer}) => ({promptId, answer})), invalidBaselineLabels)
    assert.equal(exceptions.previouslyAcceptedAnswersObserved, 686)
    assert.equal(exceptions.preservedCorrectAnswersRequired, 683)
    assert.equal(exceptions.incorrectOccurrencesRequiredRejected, 3)
    assert.equal(exceptions.anyOtherLossPermitted, false)
  })
  for (const row of invalidBaselineLabels) it(`rejects known-invalid baseline label: ${row.promptId}: ${row.answer}`, () => {
    const prompt = actionPrompts().find(candidate => candidate.id === row.promptId)
    assert.ok(prompt)
    assert.equal(checkFlashcardAnswer(prompt, {action:row.answer}).correct, false)
  })
})

describe("Six separately reviewed Temple action descriptions", () => {
  it("pins the exact 2024 bibliography and operative component exceptions", () => {
    const source = seed.sources.find(row => row.slug === "temple-hands-on-anatomy-2024")
    assert.deepEqual(source, {id:"source-temple-hands-on-anatomy-2024", slug:"temple-hands-on-anatomy-2024", ...metadata})
    assert.ok(source.attribution.includes("10.34944/381c-cx44") && source.attribution.includes("9781439921241"))
    assert.ok(source.notes.includes("Permission-only") && source.notes.includes("not clinical"))
    assert.equal(bindings.length, 6)
    assert.deepEqual(manifest().bindings, bindings)
  })
  for (const binding of bindings) {
    for (const [index, answer] of descriptionOnlyLabels[binding.id].entries()) {
      it(`rejects description-only ${index === 0 ? "joint label" : "combined labels"}: ${binding.id}`, () => {
        const prompt = actionPrompts().find(row => row.entitySlug === binding.muscle)
        assert.equal(checkFlashcardAnswer(prompt, {action:answer}).correct, false)
        assert.equal(prompt.answerFields[0].acceptedAnswers.includes(answer), false)
      })
    }
    it(`exposes and grades only the exact unchanged description: ${binding.id}`, () => {
      const action = seed.muscleActions.find(row => row.id === binding.id)
      assert.deepEqual(action, {...binding.expectedAction, sourceRef:binding.sourceRef})
      const citation = seed.citations.find(row => row.id === binding.citationId)
      assert.deepEqual(citation, {id:binding.citationId, slug:binding.citationId, entityType:"muscle", entitySlug:binding.muscle, factType:"action", factSlug:binding.id, sourceRef:binding.sourceRef, sourceLocator:binding.sourceLocator, citationNote:binding.reviewNote, reviewStatus:"reviewed"})
      const prompt = actionPrompts().find(row => row.entitySlug === binding.muscle)
      assert.ok(prompt.answerFields[0].answer.includes(binding.description))
      assert.ok(prompt.citations.some(row => row.id === binding.citationId && row.sourceRef === binding.sourceRef && row.sourceLocator === binding.sourceLocator))
      const source = prompt.sources.find(row => row.id === binding.sourceRef)
      assert.ok(source && source.attribution === metadata.attribution && source.licenseUrl === metadata.licenseUrl)
      assert.equal(checkFlashcardAnswer(prompt, {action:binding.description}).correct, true)
      assert.equal(checkFlashcardAnswer(prompt, {action:prompt.answerFields[0].answer}).correct, true)
      for (let index=0; index<2; index++) {
        const pointer = seed.citations.find(row => row.id === binding.sourcePointerIds[index])
        assert.equal(pointer.factSlug, binding.sourcePointerFactSlugs[index])
        assert.equal(pointer.sourceRef, binding.sourceRef)
        assert.equal(pointer.sourceLocator, binding.sourceLocator)
      }
      assert.equal(seed.relationships.find(row => row.id === binding.relationshipId).sourceRef, binding.sourceRef)
    })
    it(`rejects description/source/context drift without input mutation: ${binding.id}`, () => {
      for (const change of [
        copy => { copy.muscleActions.find(row => row.id === binding.id).description += " Additional unreviewed claim." },
        copy => { copy.muscleActions.find(row => row.id === binding.id).sourceRef = "unreviewed-source" },
        copy => { copy.muscleActions.find(row => row.id === binding.id).muscle = "another-muscle" },
        copy => { copy.muscleActions.find(row => row.id === binding.id).movement = "another-movement" },
        copy => { copy.muscleActions.push({...copy.muscleActions.find(row => row.id === binding.id)}) },
        copy => { copy.relationships.find(row => row.id === binding.relationshipId).targetEntitySlug = "skeletal-system" },
        copy => { copy.citations.find(row => row.id === binding.sourcePointerIds[0]).factSlug = binding.sourcePointerFactSlugs[1] },
        copy => { copy.citations.find(row => row.id === binding.sourcePointerIds[0]).sourceLocator += "#unreviewed" },
        copy => { copy.citations.push({...copy.citations.find(row => row.id === binding.sourcePointerIds[0])}) },
      ]) {
        const input = structuredClone(seed)
        change(input)
        const before = structuredClone(input)
        assert.throws(() => withReviewedTempleActionEvidence(input), /Reviewed Temple (action|teaching|source-pointer).*changed/)
        assert.deepEqual(input, before)
      }
    })
    it(`isolates pending or mismatched exact citations at runtime: ${binding.id}`, () => {
      const citation = seed.citations.find(row => row.id === binding.citationId)
      const original = {...citation}
      try {
        for (const patch of [{reviewStatus:"needs_review"}, {sourceRef:"applied-human-anatomy"}, {factSlug:binding.muscle+"-actions"}, {entitySlug:"another-muscle"}]) {
          Object.assign(citation, original, patch)
          const prompts = actionPrompts()
          const prompt = prompts.find(row => row.entitySlug === binding.muscle)
          assert.equal(Boolean(prompt?.answerFields[0].answer.includes(binding.description)), false)
          if (prompt) assert.equal(checkFlashcardAnswer(prompt, {action:binding.description}).correct, false)
          for (const other of bindings.filter(row => row.id !== binding.id)) assert.ok(prompts.find(row => row.entitySlug === other.muscle)?.answerFields[0].answer.includes(other.description), other.id)
        }
      } finally { Object.assign(citation, original) }
    })
  }
  it("retains the historical 40 rows and approves only these six successors", () => {
    const historical = JSON.parse(fs.readFileSync(new URL("../docs/source-evidence/muscle-action-backlog-integration-20261025.json", import.meta.url)))
    assert.equal(historical.bindings.length, 47)
    assert.equal(historical.remainingUnapproved.length, 40)
    const selected = new Set(bindings.map(row => row.id))
    const remaining = historical.remainingUnapproved.filter(row => !selected.has(row.actionId))
    assert.equal(remaining.length, 34)
    for (const row of remaining) {
      const action = seed.muscleActions.find(candidate => candidate.id === row.actionId)
      assert.equal(action.description, resolveHeldActionDescription(row))
      assert.equal(action.sourceRef, row.currentSourceRef)
      assert.equal(seed.citations.some(citation => citation.factType === "action" && citation.factSlug === row.actionId && citation.reviewStatus === "reviewed"), false)
    }
    for (const id of new Set(bindings.flatMap(row => row.legacyGroupCitationIds))) assert.equal(seed.citations.find(row => row.id === id).reviewStatus, "needs_review")
    assert.ok(remaining.some(row => row.actionId === "action-adductor-magnus-hip-extension"))
  })
  it("preserves both prior external-oblique composite answers only while both facts are public", () => {
    const priorAnswers = ["Contributes to trunk rotation.; Assists trunk lateral flexion.", "Lumbar Rotation at Lumbar Spine; Lumbar Lateral Flexion at Lumbar Spine"]
    const prompt = () => actionPrompts().find(row => row.entitySlug === "external-oblique")
    for (const answer of priorAnswers) assert.equal(checkFlashcardAnswer(prompt(), {action:answer}).correct, true)
    const citation = seed.citations.find(row => row.id === "citation-reviewed-action-external-oblique-rotation")
    const original = {...citation}
    try {
      for (const patch of [{reviewStatus:"needs_review"}, {sourceRef:"applied-human-anatomy"}]) {
        Object.assign(citation, original, patch)
        for (const answer of priorAnswers) assert.equal(checkFlashcardAnswer(prompt(), {action:answer}).correct, false)
      }
    } finally { Object.assign(citation, original) }
    const action = seed.muscleActions.find(row => row.id === "action-external-oblique-rotation")
    const description = action.description
    try {
      action.description += " Unreviewed description drift."
      for (const answer of priorAnswers) assert.equal(checkFlashcardAnswer(prompt(), {action:answer}).correct, false)
    } finally { action.description = description }
    for (const answer of ["extends the great toe", "Contributes to trunk rotation.; An unsourced claim."]) assert.equal(checkFlashcardAnswer(prompt(), {action:answer}).correct, false)
  })
  it("does not invent a partial subset composite when one public fact has unsupported labels", () => {
    const promptForBiceps = () => actionPrompts().find(row => row.entitySlug === "biceps-brachii")
    const previousLabels = promptForBiceps().answerFields[0].acceptedAnswers.find(answer => answer.includes(" at ") && answer.includes("; "))
    assert.ok(previousLabels)
    const individualLabels = previousLabels.split("; ")
    assert.ok(individualLabels.length > 1)
    const template = seed.muscleActions.find(row => row.muscle === "biceps-brachii")
    const actionCount = seed.muscleActions.length
    const citationCount = seed.citations.length
    // Invented in-memory public fact: exercise label scope without changing real
    // source records, admitting a real claim or expanding the compatibility list.
    const fixture = {...template, id:"action-test-biceps-rib-elevation", movement:"rib-elevation", joint:"cervical-spine", description:"An invented public description fixture."}
    seed.muscleActions.push(fixture)
    seed.citations.push({id:"citation-test-biceps-rib-elevation", slug:"citation-test-biceps-rib-elevation", entityType:"muscle", entitySlug:"biceps-brachii", factType:"action", factSlug:fixture.id, sourceRef:fixture.sourceRef, reviewStatus:"reviewed"})
    try {
      const prompt = promptForBiceps()
      assert.equal(checkFlashcardAnswer(prompt, {action:fixture.description}).correct, true)
      for (const answer of individualLabels) assert.equal(checkFlashcardAnswer(prompt, {action:answer}).correct, true)
      assert.equal(checkFlashcardAnswer(prompt, {action:previousLabels}).correct, false)
      assert.equal(checkFlashcardAnswer(prompt, {action:"Rib Elevation at Cervical Spine"}).correct, false)
    } finally {
      seed.muscleActions.length = actionCount
      seed.citations.length = citationCount
    }
  })
  it("is idempotent and leaves unrelated relationships, pointers and new facts untouched", () => {
    const input = structuredClone(seed)
    const relation = {...input.relationships.find(row => row.id === bindings[0].relationshipId), id:"unreviewed-relation", sourceRef:"applied-human-anatomy"}
    const pointer = {...input.citations.find(row => row.id === bindings[0].sourcePointerIds[0]), id:"unreviewed-pointer", sourceRef:"applied-human-anatomy"}
    const action = {...input.muscleActions.find(row => row.id === bindings[0].id), id:"action-unreviewed-new-fact", description:"An unreviewed action."}
    input.relationships.push(relation)
    input.citations.push(pointer)
    input.muscleActions.push(action)
    const before = structuredClone(input)
    const result = withReviewedTempleActionEvidence(input)
    assert.deepEqual(input, before)
    assert.deepEqual(withReviewedTempleActionEvidence(result), result)
    assert.deepEqual(result.relationships.find(row => row.id === relation.id), relation)
    assert.deepEqual(result.citations.find(row => row.id === pointer.id), pointer)
    assert.deepEqual(result.muscleActions.find(row => row.id === action.id), action)
    assert.equal(result.citations.some(row => row.factType === "action" && row.factSlug === action.id), false)
  })
  it("rejects exact-citation conflicts and source identity/license/context drift", () => {
    for (const change of [
      copy => { copy.citations.find(row => row.id === bindings[0].citationId).sourceLocator += "#unreviewed" },
      copy => { copy.citations.push({...copy.citations.find(row => row.id === bindings[0].citationId)}) },
      copy => { copy.sources.find(row => row.slug === bindings[0].sourceRef).notes = "All figures cleared" },
      copy => { copy.sources.find(row => row.slug === bindings[0].sourceRef).license = "unreviewed" },
      copy => { copy.sources.find(row => row.slug === bindings[0].sourceRef).name = "Different edition" },
      copy => { copy.sources.find(row => row.slug === "openstax-anatomy-physiology").url += "#different-revision" },
    ]) {
      const input = structuredClone(seed)
      change(input)
      const before = structuredClone(input)
      assert.throws(() => withReviewedTempleActionEvidence(input), /Exact Temple action citation conflict|Reviewed Temple source changed/)
      assert.deepEqual(input, before)
    }
  })
})

describe("Dated Temple evidence boundaries", () => {
  it("rejects widened acceptance, changed descriptions and substituted evidence before reads", () => {
    for (const change of [
      data => { data.clinicalAcceptanceComplete = true },
      data => { data.wholeMigrationComplete = true },
      data => { data.automatedSemanticTruthClaim = true },
      data => { data.sourceTextOrMediaBundled = true },
      data => { data.componentLicenseInferred = true },
      data => { data.bindings[0].selectedTextSha256 = "0".repeat(64) },
      data => { data.bindings[0].description += " Unreviewed." },
      data => { data.bindings.push({...data.bindings[0], id:"action-adductor-magnus-hip-extension"}) },
      data => { data.independentReviewSha256 = "0".repeat(64) },
      data => { data.baselineAnswerCorrectnessExceptions.anyOtherLossPermitted = true },
      data => { data.baselineAnswerCorrectnessExceptions.corrections.push({...data.baselineAnswerCorrectnessExceptions.corrections[0], promptId:"another-prompt"}) },
      data => { data.baselineAnswerCorrectnessExceptions.evidence.selectedTextSha256 = "0".repeat(64) },
    ]) {
      const data = manifest()
      change(data)
      assert.throws(() => auditTempleActionEvidence(data, seed, noArtifactRead), /Expected values/)
    }
  })
  it("rejects same-size corrupted publisher bytes without fetching replacement evidence", () => {
    assert.throws(() => auditTempleActionEvidence(manifest(), seed, artifact => Buffer.alloc(artifact.bytes)), /Artifact digest mismatch/)
  })
})
