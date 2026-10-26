import assert from "node:assert/strict"
import { describe, it } from "node:test"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { ANATOMY_FOUNDATION_SEED } from "../lib/anatomy-foundation.js"
import { getAnatomyStudyCards, getAnatomyStudyPrompts } from "../lib/anatomy-study.js"
import { loadAttributionComponent } from "./helpers/anatomy-attribution-component-loader.mjs"

const runner = loadAttributionComponent("app/education/flashcards/flashcard-runner.tsx")
const prompts = getAnatomyStudyPrompts()
const basePrompt = prompts[0]
const render = (owner, props) => renderToStaticMarkup(React.createElement(owner, props))

describe("Actual anatomy study attribution rendering", () => {
  it("renders supplied source credit and a linked license rather than source names alone", () => {
    const prompt = { ...basePrompt, sources: [{ id: "invented-artist", label: "Invented anatomy reference", url: "https://example.org/source", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/", attribution: "Invented illustrator, retained credit.", usageScope: "open_reuse" }] }
    const markup = render(runner.PromptSourceLinks, { prompt })
    assert.ok(markup.includes("Invented illustrator, retained credit."))
    assert.ok(markup.includes('href="https://creativecommons.org/licenses/by/4.0/"'))
  })

  it("carries the Human Bio Media publisher's requested credit through the actual adapter and renderer", () => {
    const prompt = prompts.find((item) => item.sources.some((source) => source.id === "human-bio-media"))
    assert.ok(prompt)
    const markup = render(runner.PromptSourceLinks, { prompt })
    assert.ok(markup.includes("Access for free at https://humanbiomedia.org/"))
  })

  it("uses the selected image's actual attribution instead of hard-coding BodyParts3D", () => {
    const media = { id: "invented-image", title: "Invented anatomy illustration", mediaType: "image", role: "primary", url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E", sourceRef: "invented-artist", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/", attribution: "Invented image artist and specific image credit." }
    const prompt = { ...basePrompt, front: { ...basePrompt.front, mode: "media", media } }
    const markup = render(runner.PromptFront, { prompt, isReviewMode: true })
    assert.ok(markup.includes("Invented image artist and specific image credit."))
    assert.ok(markup.includes('href="https://creativecommons.org/licenses/by/4.0/"'))
    assert.ok(!markup.includes("Reviewed BodyParts3D anatomy image"))
  })

  it("preserves source and selected-asset license URLs in the public projection", () => {
    const cards = getAnatomyStudyCards({}, { mediaUrlBySlug: new Map(ANATOMY_FOUNDATION_SEED.mediaAssets.map((asset) => [asset.slug, "/invented-local-anatomy.svg"])) })
    const card = cards.find((item) => item.media.some((media) => media.sourceRef === "bodyparts3d"))
    assert.ok(card)
    const media = card.media.find((item) => item.sourceRef === "bodyparts3d")
    const original = ANATOMY_FOUNDATION_SEED.mediaAssets.find((asset) => asset.slug === media.id)
    assert.equal(media.url, "/invented-local-anatomy.svg")
    assert.equal(media.licenseUrl, original.licenseUrl)
    assert.ok(media.licenseUrl)
    assert.ok(cards.filter((item) => item.sources.length).every((item) => item.sources.every((source) => source.licenseUrl === ANATOMY_FOUNDATION_SEED.sources.find((candidate) => candidate.slug === source.id).licenseUrl)))
  })

  it("keeps the publisher's full credit on every admitted BodyParts3D image or diagram", () => {
    const cards = getAnatomyStudyCards({}, { mediaUrlBySlug: new Map(ANATOMY_FOUNDATION_SEED.mediaAssets.map((asset) => [asset.slug, "/invented-local-anatomy.svg"])) })
    const images = [...new Map(cards.flatMap((card) => card.media).filter((media) => media.sourceRef === "bodyparts3d" && ["image", "diagram"].includes(media.mediaType)).map((media) => [media.id, media])).values()]
    assert.ok(images.length > 0)
    const required = "BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International"
    const missing = images.filter((media) => !media.attribution.includes(required))
    assert.equal(missing.length, 0, "Admitted images must retain the publisher's specified credit")
  })
  it("uses the working publisher description URL rather than the obsolete archive directory", () => {
    const source = ANATOMY_FOUNDATION_SEED.sources.find((item) => item.slug === "bodyparts3d")
    assert.equal(source.url, "https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html")
  })

  it("keeps credit and license text when an optional license link is missing or unsafe", () => {
    for (const licenseUrl of [undefined, "javascript:alert(1)", "https://name:password@example.org/license"]) {
      const prompt = { ...basePrompt, sources: [{ id: "invented-unlinked", label: "Invented reference", license: "Invented license", licenseUrl, attribution: "Required unlinked source credit.", usageScope: "open_reuse" }] }
      const markup = render(runner.PromptSourceLinks, { prompt })
      assert.ok(markup.includes("Required unlinked source credit."))
      assert.ok(markup.includes("Invented license"))
      assert.ok(!markup.includes("javascript:") && !markup.includes("name:password"))
    }
  })
})
