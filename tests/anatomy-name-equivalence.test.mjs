import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { ANATOMY_FOUNDATION_SEED, searchAnatomyFoundation } from "../lib/anatomy-foundation.js"
import { isEquivalentAnatomyNameAlias } from "../lib/anatomy-name-aliases.js"
import { checkFlashcardAnswer, getAnatomyStudyCards, getAnatomyStudyPrompts, getLegacyAnatomyCoverageAudit } from "../lib/anatomy-study.js"

const namePrompts = () => getAnatomyStudyPrompts({ promptTypes: ["anatomime_name_recall"] })

/** Real bundled cards expose the grading defect; raw lookup data stays available. */
describe("Anatomy name equivalence", () => {
  it("does not grade the wider fluid-tissue category as the name blood", () => {
    const prompt = namePrompts().find(row => row.cardId === "anatomy_structure-blood")
    assert.ok(prompt)
    assert.equal(checkFlashcardAnswer(prompt, "fluid connective tissue").correct, false)
    assert.equal(checkFlashcardAnswer(prompt, "blood").correct, true)
    assert.equal(checkFlashcardAnswer(prompt, "circulating blood").correct, true)
    const card = getAnatomyStudyCards().find(row => row.id === prompt.cardId)
    assert.equal(card.aliases.includes("fluid connective tissue"), false)
  })

  it("does not grade the whole large bowel as the name of its colon part", () => {
    const prompt = namePrompts().find(row => row.cardId === "anatomy_structure-colon")
    assert.ok(prompt)
    assert.equal(checkFlashcardAnswer(prompt, "large bowel").correct, false)
    assert.equal(checkFlashcardAnswer(prompt, "colon").correct, true)
    const card = getAnatomyStudyCards().find(row => row.id === prompt.cardId)
    assert.equal(card.aliases.includes("large bowel"), false)
  })

  it("retains the real equivalent names of other sourced anatomy cards", () => {
    const prompts = namePrompts()
    for (const [cardId, answer] of [["anatomy_structure-large-intestine", "large bowel"], ["anatomy_structure-cecum", "caecum"], ["anatomy_concept-mucous-membrane", "mucosa"], ["anatomy_concept-bone-tissue", "osseous tissue"], ["anatomy_structure-bulbourethral-gland", "Cowper gland"]]) {
      const prompt = prompts.find(row => row.cardId === cardId)
      assert.ok(prompt, cardId)
      assert.equal(checkFlashcardAnswer(prompt, answer).correct, true, answer)
    }
  })

  it("preserves original source terms and legacy lookup for the broader phrases", () => {
    for (const [slug, term, expectedLegacyCard] of [["blood", "fluid connective tissue", "anatomy_structure-blood"], ["colon", "large bowel", "anatomy_structure-large-intestine"]]) {
      assert.ok(ANATOMY_FOUNDATION_SEED.entityTerms.some(row => row.anatomyEntityType === "anatomy_structure" && row.anatomyEntitySlug === slug && row.term === term))
      assert.ok(searchAnatomyFoundation(term).some(row => row.entityType === "anatomy_structure" && row.slug === slug))
      const [legacy] = getLegacyAnatomyCoverageAudit([{ id: `invented-legacy-${slug}`, name: term }])
      assert.equal(legacy.matchedCardId, expectedLegacyCard)
      assert.equal(legacy.status, "mapped")
    }
  })

  it("normalizes the reviewed exclusions without making a global word blacklist", () => {
    assert.equal(isEquivalentAnatomyNameAlias("anatomy_structure", "blood", " FLUID-CONNECTIVE TISSUE "), false)
    assert.equal(isEquivalentAnatomyNameAlias("anatomy_structure", "colon", "LARGE BOWEL"), false)
    assert.equal(isEquivalentAnatomyNameAlias("anatomy_concept", "blood", "fluid connective tissue"), false)
    assert.equal(isEquivalentAnatomyNameAlias("anatomy_structure", "invented-control", "large bowel"), true)
    assert.equal(isEquivalentAnatomyNameAlias("anatomy_structure", "blood", "circulating blood"), true)
  })
})
