import assert from "node:assert/strict"
import fs from "node:fs"
import { describe, it } from "node:test"
import { getAnatomyStudyPrompts, checkFlashcardAnswer } from "../lib/anatomy-study.js"

// These answers are frozen from the actual pre-batch projection, not rebuilt
// from the current action list; new citations must preserve their correctness.
const prior = JSON.parse(fs.readFileSync(new URL("./fixtures/anatomy-action-accepted-before-20261025.json", import.meta.url)))
const prompts = getAnatomyStudyPrompts({ promptTypes: ["muscle_action"] })
describe("Previously accepted sourced action answers", () => {
  for (const old of prior) {
    for (const answer of old.acceptedAnswers) {
      it(`${old.entitySlug}: ${answer}`, () => {
        const prompt = prompts.find(candidate => candidate.id === old.promptId)
        assert.ok(prompt)
        assert.equal(checkFlashcardAnswer(prompt, { action: answer }).correct, true)
      })
    }
  }
  it("rejects an unrelated unsourced answer after enriching the action facts", () => {
    const prompt = prompts.find(candidate => candidate.id === prior[0].promptId)
    assert.equal(checkFlashcardAnswer(prompt, { action: "extends the great toe" }).correct, false)
  })
})
