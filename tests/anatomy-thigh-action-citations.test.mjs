import { REVIEWED_ACTION_BACKLOG_BINDINGS } from "../lib/anatomy-action-backlog-provenance.js"
import fs from "node:fs"
import { auditThighActionEvidence } from "../scripts/audit-thigh-action-citations.mjs"
import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { ANATOMY_FOUNDATION_SEED as seed } from "../lib/anatomy-foundation.js"
import { getAnatomyStudyPrompts, checkFlashcardAnswer } from "../lib/anatomy-study.js"
import { REVIEWED_THIGH_ACTION_BINDINGS as bindings, withReviewedThighActionEvidence } from "../lib/anatomy-thigh-action-provenance.js"

const muscles = new Set(bindings.map(binding => binding.muscle))
const selectedPrompts = () => getAnatomyStudyPrompts({promptTypes:["muscle_action"]}).filter(prompt => muscles.has(prompt.entitySlug))
const unresolvedIds = ["action-biceps-femoris-knee-flexion", "action-biceps-femoris-hip-extension", "action-semitendinosus-knee-flexion", "action-semimembranosus-knee-flexion", "action-gracilis-knee-flexion"]

describe("Six exactly compared existing thigh actions", () => {
  it("binds six unchanged facts to precise reviewed citations", () => {
    assert.equal(bindings.length, 6)
    for (const binding of bindings) {
      const action = seed.muscleActions.find(row => row.id === binding.id)
      assert.equal(action.description, binding.description)
      assert.equal(action.sourceRef, binding.sourceRef)
      const citation = seed.citations.find(row => row.id === binding.citationId)
      assert.ok(citation, binding.id)
      assert.equal(citation.entitySlug, binding.muscle)
      assert.equal(citation.factSlug, action.id)
      assert.equal(citation.sourceRef, action.sourceRef)
      assert.equal(citation.reviewStatus, "reviewed")
      assert.equal(citation.sourceLocator, binding.sourceLocator)
    }
  })
  it("exposes four actual prompts containing only the six sourced descriptions", () => {
    const prompts = selectedPrompts()
    assert.equal(prompts.length, 4)
    for (const muscle of muscles) {
      const prompt = prompts.find(row => row.entitySlug === muscle)
      const expected = [...bindings, ...REVIEWED_ACTION_BACKLOG_BINDINGS].filter(binding => binding.muscle === muscle)
      assert.ok(prompt)
      assert.equal(prompt.citations.length, expected.length)
      assert.ok(expected.every(binding => prompt.answerFields[0].answer.includes(binding.description)))
      assert.ok(expected.every(binding => prompt.citations.some(citation => citation.id === binding.citationId)))
      assert.equal(checkFlashcardAnswer(prompt, {action:prompt.answerFields[0].answer}).correct, true)
    }
  })
  it("retains the five original decisions and requires exact new evidence for four supersessions", () => {
    let superseded = 0
    for (const id of unresolvedIds) {
      const action = seed.muscleActions.find(row => row.id === id)
      const later = REVIEWED_ACTION_BACKLOG_BINDINGS.find(binding => binding.id === id)
      if (later) {
        superseded++
        assert.equal(action.sourceRef, later.sourceRef)
        assert.ok(seed.citations.some(citation => citation.id === later.citationId && citation.factSlug === id && citation.sourceRef === later.sourceRef && citation.reviewStatus === "reviewed"))
        assert.ok(getAnatomyStudyPrompts({promptTypes:["muscle_action"]}).some(prompt => prompt.entitySlug === action.muscle && prompt.answerFields[0].answer.includes(action.description)))
      } else {
        assert.equal(action.sourceRef, "applied-human-anatomy")
        assert.equal(seed.citations.some(citation => citation.factType === "action" && citation.factSlug === id && citation.reviewStatus === "reviewed"), false)
        assert.equal(selectedPrompts().some(prompt => prompt.answerFields[0].answer.includes(action.description)), false)
      }
    }
    assert.equal(superseded, 4)
  })
  it("retains the four original group IDs as pending history", () => {
    for (const muscle of muscles) {
      const citation = seed.citations.find(row => row.id === `citation-${muscle}-action`)
      assert.ok(citation)
      assert.equal(citation.factSlug, `${muscle}-actions`)
      assert.equal(citation.reviewStatus, "needs_review")
    }
  })
  it("corrects source-pointer metadata without leaving stale source pointers", () => {
    for (const binding of bindings) {
      const pointers = seed.citations.filter(citation => citation.entityType === "muscle_action" && citation.entitySlug === binding.id && citation.factType === "seed_source_reference")
      assert.equal(pointers.length, 2)
      assert.ok(pointers.every(pointer => pointer.sourceRef === binding.sourceRef))
      const relationships = seed.relationships.filter(row => row.sourceEntityType === "muscle_action" && row.sourceEntitySlug === binding.id)
      assert.equal(relationships.length, 1)
      assert.ok(relationships.every(row => row.sourceRef === binding.sourceRef))
    }
  })
  it("is idempotent without mutating the input", () => {
    const input = structuredClone(seed)
    const before = structuredClone(input)
    const result = withReviewedThighActionEvidence(input)
    assert.deepEqual(input, before)
    assert.deepEqual(withReviewedThighActionEvidence(result), result)
  })
  it("rejects changed facts, duplicate IDs and changed sources without mutating input", () => {
    for (const change of [
      copy => { copy.muscleActions.find(action => action.id === bindings[0].id).description += " Unreviewed claim." },
      copy => { copy.muscleActions.find(action => action.id === bindings[0].id).muscle = "biceps-femoris" },
      copy => { copy.muscleActions.find(action => action.id === bindings[0].id).sourceRef = "unreviewed-source" },
      copy => { copy.muscleActions.push({...copy.muscleActions.find(action => action.id === bindings[0].id)}) },
      copy => { copy.sources.find(source => source.slug === "openstax-anatomy-physiology").usageScope = "reference_only" },
    ]) {
      const input = structuredClone(seed)
      change(input)
      const before = structuredClone(input)
      assert.throws(() => withReviewedThighActionEvidence(input), /Reviewed thigh-action (input|source) changed/)
      assert.deepEqual(input, before)
    }
  })
  it("rejects a conflicting exact citation instead of silently overwriting it", () => {
    const input = withReviewedThighActionEvidence(structuredClone(seed))
    input.citations.find(citation => citation.id === bindings[0].citationId).sourceLocator = "https://example.test/unreviewed"
    const before = structuredClone(input)
    assert.throws(() => withReviewedThighActionEvidence(input), /Exact thigh-action citation conflict/)
    assert.deepEqual(input, before)
  })
  it("does not approve another action belonging to a selected muscle", () => {
    const input = structuredClone(seed)
    const unrelated = {...input.muscleActions.find(action => action.id === bindings[0].id), id:"action-unreviewed-thigh-example", sourceRef:"future-clinical-citation-needed"}
    input.muscleActions.push(unrelated)
    const result = withReviewedThighActionEvidence(input)
    assert.deepEqual(result.muscleActions.find(action => action.id === unrelated.id), unrelated)
    assert.equal(result.citations.some(citation => citation.factSlug === unrelated.id), false)
  })
  it("suppresses only the affected fact when another independently reviewed action remains", () => {
    const citation = seed.citations.find(row => row.id === "citation-reviewed-action-gracilis-hip-adduction")
    assert.ok(citation)
    const original = {...citation}
    try {
      for (const patch of [{reviewStatus:"needs_review"}, {factSlug:"gracilis-actions"}, {entitySlug:"sartorius"}, {sourceRef:"applied-human-anatomy"}]) {
        Object.assign(citation, original, patch)
        const prompt = selectedPrompts().find(row => row.entitySlug === "gracilis")
        assert.ok(prompt)
        assert.equal(prompt.answerFields[0].answer.includes("Assists hip adduction."), false)
        assert.ok(prompt.answerFields[0].answer.includes("Assists knee flexion through its medial tibial attachment."))
      }
    } finally { Object.assign(citation, original) }
    assert.equal(selectedPrompts().some(prompt => prompt.entitySlug === "gracilis"), true)
  })
})


describe("Thigh evidence review boundaries", () => {
  const manifest = () => JSON.parse(fs.readFileSync(new URL("../docs/source-evidence/anatomy-thigh-action-review-20261025.json", import.meta.url)))
  it("rejects clinical or whole-migration completion claims before reading artifacts", () => {
    for (const key of ["clinicalAcceptanceComplete", "wholeMigrationComplete"]) {
      const changed = manifest()
      changed[key] = true
      assert.throws(() => auditThighActionEvidence(changed, seed, () => { throw new Error("must not read artifacts") }), /Expected values/)
    }
  })
  it("rejects approval of an unresolved qualifier before reading artifacts", () => {
    const changed = manifest()
    changed.unresolved[0].status = "EXISTING_DESCRIPTION_SUPPORTED"
    assert.throws(() => auditThighActionEvidence(changed, seed, () => { throw new Error("must not read artifacts") }), /assert|expression/i)
  })
  it("rejects a changed exact action binding before reading artifacts", () => {
    const changed = manifest()
    changed.bindings[0].sourceLocator += "-unreviewed"
    assert.throws(() => auditThighActionEvidence(changed, seed, () => { throw new Error("must not read artifacts") }), /Expected values/)
  })
  it("rejects altered retained publisher bytes with the same size", () => {
    const data = manifest()
    assert.throws(() => auditThighActionEvidence(data, seed, name => Buffer.alloc(data.publisherArtifacts.find(row => row.file === name).bytes)), /Publisher artifact digest/)
  })
})
