import fs from "node:fs"
import { verifyReviewedAnatomySourceEvidence } from "../scripts/verify-reviewed-anatomy-sources.mjs"
import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { ANATOMY_FOUNDATION_SEED } from "../lib/anatomy-foundation.js"
import { getAnatomyStudyCards } from "../lib/anatomy-study.js"
import { OPENSTAX_AP_COLLECTION_URL, OPENSTAX_AP_REVISION } from "../lib/anatomy-openstax-provenance.js"

describe("Pinned and precisely attributed A&P source", () => {
  it("keeps the stable source identity while identifying the historical 2e license", () => {
    const source = ANATOMY_FOUNDATION_SEED.sources.find(s => s.slug === "openstax-anatomy-physiology")
    assert.equal(source.id, "source-openstax-anatomy-physiology")
    assert.equal(source.url, OPENSTAX_AP_COLLECTION_URL)
    assert.match(source.name, /2e/)
    assert.equal(source.license, "CC BY 4.0")
    assert.equal(source.usageScope, "open_reuse")
    assert.ok(source.attribution.includes(OPENSTAX_AP_REVISION))
    assert.match(source.notes, /not the current website/)
    assert.match(source.notes, /not applied to supplemental articles/)
  })

  it("replaces generic introduction citations with exact retained section locators", () => {
    const citations = ANATOMY_FOUNDATION_SEED.citations.filter(c => c.sourceRef === "openstax-anatomy-physiology")
    const summaries = citations.filter(c => c.factType === "clinical_summary")
    assert.equal(summaries.length, 53)
    assert.equal(citations.length, 271)
    for (const citation of citations) {
      assert.ok(citation.sourceLocator.includes(`${OPENSTAX_AP_REVISION}/modules/`), citation.slug)
      assert.match(citation.sourceLocator, /index\.cnxml#L[0-9]+-L[0-9]+/)
      assert.equal(citation.reviewStatus, "reviewed")
    }
    assert.ok(citations.some(c => /broader search\/category label/.test(c.citationNote)))
    assert.ok(citations.some(c => /practical browsing grouping/.test(c.citationNote)))
  })

  it("keeps one clickable primary section and retains additional references separately", () => {
    for (const citation of ANATOMY_FOUNDATION_SEED.citations.filter(c => c.sourceRef === "openstax-anatomy-physiology")) {
      const href = new URL(citation.sourceLocator)
      assert.equal(href.href, citation.sourceLocator)
      assert.match(href.hash, /^#L[0-9]+-L[0-9]+$/)
    }
    const fascia = ANATOMY_FOUNDATION_SEED.citations.find(c => c.entitySlug === "dense-connective-tissue" && c.factType === "clinical_summary")
    assert.ok(fascia.citationNote.includes("19166469"))
    assert.ok(fascia.citationNote.includes("index.cnxml#L162-L162"))
  })

  it("distinguishes skeletal contractile tissue from its supporting connective tissue", () => {
    const card = getAnatomyStudyCards().find(c => c.id === "anatomy_concept-muscular-system")
    assert.ok(card.summary.includes("supporting connective tissues"))
    assert.ok(card.summary.includes("Skeletal muscle contraction"))
    assert.equal(card.summary.includes("related contractile tissues"), false)
  })

  it("qualifies the dense fascia example instead of classifying all fascia as dense", () => {
    const card = getAnatomyStudyCards().find(c => c.id === "anatomy_concept-dense-connective-tissue")
    assert.ok(card.summary.includes("many deep fascial sheets"))
    assert.ok(card.citations.some(c => c.note.includes("19166469")))
  })

  it("describes the whole clitoris beyond its external glans with a primary-study reference", () => {
    const card = getAnatomyStudyCards().find(c => c.id === "anatomy_structure-clitoris")
    assert.ok(card.summary.includes("external glans"))
    assert.ok(card.summary.includes("internal erectile structures"))
    assert.ok(card.summary.includes("body and paired crura"))
    assert.ok(card.citations.some(c => c.note.includes("15879834")))
  })

  it("does not infer a urinary gland from the urethral substring in a reproductive gland", () => {
    const card = getAnatomyStudyCards().find(c => c.id === "anatomy_structure-bulbourethral-gland")
    assert.ok(card.bodySystems.includes("reproductive-system"))
    assert.equal(card.bodySystems.includes("urinary-system"), false)
    assert.equal(ANATOMY_FOUNDATION_SEED.relationships.some(r => r.sourceEntityType === "anatomy_structure" && r.sourceEntitySlug === "bulbourethral-gland" && r.relationshipType === "belongs_to_system" && r.targetEntitySlug === "urinary-system"), false)
    for (const slug of ["glomerulus", "renal-tubule", "renal-pelvis", "urethra"]) {
      const urinary = getAnatomyStudyCards().find(c => c.id === `anatomy_structure-${slug}`)
      assert.ok(urinary?.bodySystems.includes("urinary-system"), slug)
    }
  })
})

/** Negative checks fail before reading artifacts; the CLI verifies the actual retained corpus. */
describe("Reviewed source integrity rejects stale or broader acceptance", () => {
  const manifest = () => JSON.parse(fs.readFileSync(new URL("../docs/source-evidence/openstax-ap-2e-reviewed-summaries.json", import.meta.url), "utf8"))
  const cards = () => getAnatomyStudyCards().filter(card => card.sourceRefs.includes("openstax-anatomy-physiology"))
  const unread = () => { throw new Error("Artifact reader must not be reached") }

  it("rejects a moving runtime URL despite a valid archived manifest", () => {
    const seed = structuredClone(ANATOMY_FOUNDATION_SEED)
    seed.sources.find(source => source.slug === "openstax-anatomy-physiology").url = "https://openstax.org/books/anatomy-and-physiology/pages/1-introduction"
    assert.throws(() => verifyReviewedAnatomySourceEvidence(manifest(), seed, cards(), unread), /Pinned source URL/)
  })

  it("rejects changed or missing authored summaries", () => {
    const changed = structuredClone(cards())
    changed[0].summary += " Invented unreviewed extension."
    assert.throws(() => verifyReviewedAnatomySourceEvidence(manifest(), ANATOMY_FOUNDATION_SEED, changed, unread), /summary text changed/)
    assert.throws(() => verifyReviewedAnatomySourceEvidence(manifest(), ANATOMY_FOUNDATION_SEED, changed.slice(1), unread), /coverage changed/)
  })

  it("does not convert comparison into clinical, commercial or article-license approval", () => {
    const altered = manifest()
    altered.clinicalAcceptanceComplete = true
    assert.throws(() => verifyReviewedAnatomySourceEvidence(altered, ANATOMY_FOUNDATION_SEED, cards(), unread), /clinical acceptance/)
    altered.clinicalAcceptanceComplete = false
    altered.articleContentLicenseInferred = true
    assert.throws(() => verifyReviewedAnatomySourceEvidence(altered, ANATOMY_FOUNDATION_SEED, cards(), unread), /supplemental articles/)
  })

  it("rejects a replaced retained artifact even when its size matches", () => {
    const expected = manifest()
    assert.throws(() => verifyReviewedAnatomySourceEvidence(expected, ANATOMY_FOUNDATION_SEED, cards(), name => Buffer.alloc(expected.artifacts.find(a => a.file === name)?.bytes ?? 0)), /Artifact digest mismatch/)
  })
})
