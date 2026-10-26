import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  checkFlashcardAnswer,
  createFlashcardPromptDeck,
  getAnatomyStudyCards,
  getAnatomyStudyPrompts,
  getFlashcardPromptTypeCounts,
} from "../lib/anatomy-study.js"
import { normalizeFlashcardDeckConfig, promptCountForConfig } from "../lib/flashcard-community.js"

const systemicConceptSlugs = [
  "cardiovascular-system", "digestive-system", "urinary-system", "nervous-system", "endocrine-system",
]

describe("Source-supported study region answers", () => {
  it("never grades a compatibility region fallback as a concept answer", () => {
    const cards = getAnatomyStudyCards({ categories: ["anatomy_concept"] })
    const prompts = getAnatomyStudyPrompts({ categories: ["anatomy_concept"], promptTypes: ["name_to_region"] })
    for (const slug of systemicConceptSlugs) {
      const card = cards.find((candidate) => candidate.entitySlug === slug)
      assert.ok(card, `${slug} remains offered content`)
      assert.equal(prompts.some((prompt) => prompt.cardId === card.id), false, `${slug} has no declared region to grade`)
    }
    assert.deepEqual(prompts, [])
  })

  it("does not turn a body-surface fallback into a scored spinal location", () => {
    const cards = getAnatomyStudyCards({ categories: ["anatomy_structure"] })
      .filter((card) => card.foundationRegion === "body-surface")
    assert.ok(cards.length > 0, "real unlocalized source structures remain available")
    const ids = new Set(cards.map((card) => card.id))
    const prompts = getAnatomyStudyPrompts({ categories: ["anatomy_structure"], promptTypes: ["name_to_region"] })
    assert.equal(prompts.some((prompt) => ids.has(prompt.cardId)), false)
  })

  it("retains every concept for supported non-region question types", () => {
    const cards = getAnatomyStudyCards({ categories: ["anatomy_concept"] })
    for (const type of ["anatomime_name_recall", "name_to_summary", "name_to_category"]) {
      const prompts = getAnatomyStudyPrompts({ categories: ["anatomy_concept"], promptTypes: [type] })
      assert.deepEqual(prompts.map((prompt) => prompt.cardId).sort(), cards.map((card) => card.id).sort())
    }
  })

  it("still grades explicitly supported upper, lower and spinal source regions", () => {
    const cards = getAnatomyStudyCards()
    const spineCard = cards.find((card) => card.foundationRegion === "trunk-spine-pelvis")
    assert.ok(spineCard, "an actual explicitly mapped spinal source row is required")
    const expected = [["muscle-biceps-brachii", "Upper Extremity"], ["bone-femur", "Lower Extremity"], [spineCard.id, "Spine"]]
    const prompts = getAnatomyStudyPrompts({ promptTypes: ["name_to_region"] })
    for (const [id, answer] of expected) {
      const prompt = prompts.find((candidate) => candidate.cardId === id)
      assert.ok(prompt, `${id} retains its supported question`)
      assert.equal(checkFlashcardAnswer(prompt, answer).correct, true)
      assert.equal(checkFlashcardAnswer(prompt, "invented wrong answer").correct, false)
    }
  })

  it("preserves a legacy concept-region-only config and reports no eligible prompts", () => {
    const config = normalizeFlashcardDeckConfig({ categories: ["anatomy_concept"], regions: ["spine"], promptTypes: ["name_to_region"], difficulty: "hard", count: 10, seed: "legacy-region-config" })
    assert.deepEqual(config.categories, ["anatomy_concept"])
    assert.deepEqual(config.regions, ["spine"])
    assert.deepEqual(config.promptTypes, ["name_to_region"])
    assert.equal(promptCountForConfig(config), 0)
    assert.deepEqual(createFlashcardPromptDeck(config), [])
    assert.equal(getFlashcardPromptTypeCounts(config).find((row) => row.id === "name_to_region").promptCount, 0)
  })

  it("does not silently replace unsupported questions in a mixed or pinned selection", () => {
    const prompts = getAnatomyStudyPrompts({ categories: ["anatomy_concept"], promptTypes: ["name_to_region", "name_to_summary"] })
    assert.ok(prompts.length > 0)
    assert.equal(prompts.every((prompt) => prompt.type === "name_to_summary"), true)
    const historical = "name_to_region:anatomy_concept-cardiovascular-system"
    assert.deepEqual(getAnatomyStudyPrompts({ categories: ["anatomy_concept"], promptTypes: ["name_to_region"], promptIds: [historical] }), [])
  })
})
