import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import * as foundation from "../lib/anatomy-foundation.js"
import * as aliases from "../lib/anatomy-name-aliases.js"
import * as temple from "../lib/anatomy-temple-action-provenance.js"
import * as later from "../lib/anatomy-action-backlog-provenance.js"
import * as review from "../lib/anatomy-media-review.js"
import * as delivery from "../lib/anatomy-media-delivery.js"
import * as progress from "../lib/flashcard-progress.js"
import { createCompiledModuleLoader } from "./helpers/compiled-module.mjs"

const legacy = "https://anatomy-media.massagelab.app"
const branded = "https://anatomy-media.atmoshaper.com"
const imageSlug = "bodyparts3d-biceps-brachii-anatomogram"
const load = createCompiledModuleLoader(import.meta.url)
const studySource = readFileSync(new URL("../lib/anatomy-study.ts", import.meta.url), "utf8")

/**
 * Compiles the real projection with pure data dependencies instead of the DB
 * loader. The public origin is captured at initialization and restored afterward.
 */
function loadStudy(origin, seed = foundation.ANATOMY_FOUNDATION_SEED, deliveryDependency = delivery) {
  const original = process.env.NEXT_PUBLIC_ANATOMY_MEDIA_ORIGIN
  try {
    if (origin === undefined) delete process.env.NEXT_PUBLIC_ANATOMY_MEDIA_ORIGIN
    else process.env.NEXT_PUBLIC_ANATOMY_MEDIA_ORIGIN = origin
    return load(studySource, "anatomy-study.ts", {
      "./anatomy-foundation.js": { ...foundation, ANATOMY_FOUNDATION_SEED: seed },
      "./anatomy-name-aliases.js": aliases,
      "./anatomy-temple-action-provenance.js": temple,
      "./anatomy-action-backlog-provenance.js": later,
      "./anatomy-media-review.js": review,
      "./anatomy-media-delivery.js": deliveryDependency,
    })
  } finally {
    if (original === undefined) delete process.env.NEXT_PUBLIC_ANATOMY_MEDIA_ORIGIN
    else process.env.NEXT_PUBLIC_ANATOMY_MEDIA_ORIGIN = original
  }
}

test("opt-in rebinds the actual reviewed study image projection", () => {
  const study = loadStudy(branded)
  const options = { mediaUrlBySlug: new Map([[imageSlug, `${legacy}/invented//biceps%2Fview.png?b=2&a=1#front`]]) }
  const card = study.getAnatomyStudyCards({}, options).find((item) => item.id === "muscle-biceps-brachii")
  assert.equal(card.media.find((item) => item.id === imageSlug).url, `${branded}/invented//biceps%2Fview.png?b=2&a=1#front`)
})

const template = foundation.ANATOMY_FOUNDATION_SEED.mediaAssets.find((asset) => asset.slug === imageSlug)
const bicepsMedia = (study, options = {}) => study.getAnatomyStudyCards({}, options)
  .find((card) => card.id === "muscle-biceps-brachii").media

/** Builds invented media from a committed template; overrides probe admission. */
function inventedAsset(slug, overrides = {}) {
  return {
    ...template, id: `invented-${slug}`, slug, remoteUrl: `${legacy}/invented/${slug}.png`,
    sourceUrl: `${legacy}/reference/${slug}`, licenseUrl: `${legacy}/license/${slug}`,
    attribution: `Invented credit for ${slug}`, ...overrides,
  }
}

/** Supplies an approved biceps link by default, with explicit adverse overrides. */
function inventedLink(assetSlug, overrides = {}) {
  return {
    id: `invented-link-${assetSlug}`, assetSlug, entityType: "muscle", entitySlug: "biceps-brachii",
    role: "primary", reviewStatus: "approved", displayPriority: 10, ...overrides,
  }
}

/** Forwards raw assets and every link decision so the real projection owns filtering. */
function optionsFor(assets, links = assets.map((asset) => inventedLink(asset.slug))) {
  return { mediaAssets: assets, mediaEntityLinks: links }
}

/** Copies the complete expected result while replacing only image/diagram delivery URLs. */
function expectedDelivery(value, from = legacy, to = branded) {
  if (Array.isArray(value)) return value.map((item) => expectedDelivery(item, from, to))
  if (!value || typeof value !== "object") return value
  const projected = Object.fromEntries(Object.entries(value).map(([key, item]) => [key, expectedDelivery(item, from, to)]))
  if (["image", "diagram"].includes(value.mediaType) && typeof value.url === "string" && value.url.startsWith(`${from}/`)) {
    projected.url = to + value.url.slice(from.length)
  }
  return projected
}

test("unset, empty and explicit legacy artifacts preserve cards/prompts and rollback exactly", () => {
  const seed = structuredClone(foundation.ANATOMY_FOUNDATION_SEED)
  seed.mediaAssets.find((asset) => asset.slug === imageSlug).remoteUrl = `${legacy}/invented//seed%2f.png?z=2&z=1#part`
  seed.sources.find((source) => source.slug === "bodyparts3d").url = `${legacy}/reference/source`
  const options = optionsFor([inventedAsset("invented-diagram", { mediaType: "diagram" })])
  const inputs = structuredClone({ seed, options })
  const defaults = loadStudy(undefined, seed)
  const baselineCards = defaults.getAnatomyStudyCards({}, options)
  const baselinePrompts = defaults.getAnatomyStudyPrompts({}, options)
  assert.ok(baselineCards.length > 1000)
  for (const setting of ["", legacy]) {
    const study = loadStudy(setting, seed)
    assert.deepEqual(study.getAnatomyStudyCards({}, options), baselineCards)
    assert.deepEqual(study.getAnatomyStudyPrompts({}, options), baselinePrompts)
  }
  const opted = loadStudy(branded, seed)
  const optedCards = opted.getAnatomyStudyCards({}, options)
  const optedPrompts = opted.getAnatomyStudyPrompts({}, options)
  assert.deepEqual(optedCards, expectedDelivery(baselineCards))
  assert.deepEqual(optedPrompts, expectedDelivery(baselinePrompts))
  assert.deepEqual(expectedDelivery(optedCards, branded, legacy), baselineCards)
  assert.deepEqual(expectedDelivery(optedPrompts, branded, legacy), baselinePrompts)
  for (let index = 0; index < baselinePrompts.length; index++) {
    const answer = baselinePrompts[index].answerFields[0]?.answer ?? ""
    assert.deepEqual(opted.checkFlashcardAnswer(optedPrompts[index], answer), defaults.checkFlashcardAnswer(baselinePrompts[index], answer))
  }
  assert.deepEqual({ seed, options }, inputs)
})

test("literal suffix bytes survive exact legacy origin binding", () => {
  for (const suffix of ["", "/", "?b=2&a=1", "#view", "/a//b/%2f/%2F/%7E/../c?z=2&z=1&x=%2f#A%2fB"]) {
    for (const type of ["image", "diagram"]) {
      assert.equal(delivery.anatomyMediaDeliveryUrl(legacy + suffix, type, branded), branded + suffix)
      assert.equal(delivery.anatomyMediaDeliveryUrl(legacy + suffix, type, legacy), legacy + suffix)
    }
  }
})

test("lookalike authorities, ports, userinfo, other origins and relative references stay literal", () => {
  for (const url of [
    `${legacy}.evil.test/a`, `${legacy}:443/a`, `${legacy}:8443/a`, `${legacy}@evil.test/a`,
    "https://name:password@anatomy-media.massagelab.app/a", "https://anatomy-media.massagelab.app./a",
    "https://ANATOMY-MEDIA.massagelab.app/a", "HTTPS://anatomy-media.massagelab.app/a",
    "http://anatomy-media.massagelab.app/a", `${branded}/a`, "https://example.test/a",
    "//anatomy-media.massagelab.app/a", "/anatomy/a", "../a", "data:image/png;base64,AA==", "",
    `${legacy}\\evil.test/a`,
  ]) {
    assert.equal(delivery.anatomyMediaDeliveryUrl(url, "image", branded), url)
  }
})

test("the exact setting allowlist rejects malformed or alternative values without echoing them", () => {
  for (const value of [undefined, "", legacy]) assert.equal(delivery.resolveAnatomyMediaDeliveryOrigin(value), legacy)
  assert.equal(delivery.resolveAnatomyMediaDeliveryOrigin(branded), branded)
  for (const value of [" ", `${branded}/`, `${branded}?x=1`, `${branded}#part`, `${branded}:443`, `${branded}/path`,
    "http://anatomy-media.atmoshaper.com", "https://ANATOMY-MEDIA.atmoshaper.com", "https://user:secret@anatomy-media.atmoshaper.com", "invalid-secret-value"]) {
    assert.throws(() => loadStudy(value), { message: "Invalid NEXT_PUBLIC_ANATOMY_MEDIA_ORIGIN configuration." })
  }
})

test("validation precedes module-built cards and origin remains fixed for later calls and caches", () => {
  let reads = 0
  const guardedSeed = { get sources() { reads++; throw new Error("card construction started") } }
  assert.throws(() => loadStudy("invalid", guardedSeed), { message: "Invalid NEXT_PUBLIC_ANATOMY_MEDIA_ORIGIN configuration." })
  assert.equal(reads, 0)
  let validations = 0
  const study = loadStudy(branded, foundation.ANATOMY_FOUNDATION_SEED, {
    ...delivery,
    resolveAnatomyMediaDeliveryOrigin(value) { validations++; return delivery.resolveAnatomyMediaDeliveryOrigin(value) },
  })
  const options = { mediaUrlBySlug: new Map([[imageSlug, `${legacy}/invented/immutable.png`]]) }
  const original = process.env.NEXT_PUBLIC_ANATOMY_MEDIA_ORIGIN
  try {
    process.env.NEXT_PUBLIC_ANATOMY_MEDIA_ORIGIN = "invalid-after-initialization"
    assert.equal(bicepsMedia(study, options).find((media) => media.id === imageSlug).url, `${branded}/invented/immutable.png`)
    study.getAnatomyStudyPrompts({}, options)
    study.getAnatomyStudyCards()
    assert.equal(validations, 1)
  } finally {
    if (original === undefined) delete process.env.NEXT_PUBLIC_ANATOMY_MEDIA_ORIGIN
    else process.env.NEXT_PUBLIC_ANATOMY_MEDIA_ORIGIN = original
  }
  assert.equal(bicepsMedia(loadStudy(legacy), options).find((media) => media.id === imageSlug).url, `${legacy}/invented/immutable.png`)
})

test("selection keeps nullish map/remote/thumbnail precedence, including empty Map values", () => {
  const study = loadStudy(branded)
  const asset = inventedAsset("precedence", { thumbnailUrl: `${legacy}/invented/thumbnail.png` })
  const cases = [
    [{}, `${branded}/invented/precedence.png`],
    [{ mediaUrlBySlug: new Map([[asset.slug, `${legacy}/invented/map.png`]]) }, `${branded}/invented/map.png`],
    [{ mediaUrlBySlug: { [asset.slug]: `${legacy}/invented/object.png` } }, `${branded}/invented/object.png`],
    [{ mediaUrlBySlug: new Map([[asset.slug, ""]]) }, undefined],
    [{ mediaUrlBySlug: { [asset.slug]: "" } }, `${branded}/invented/precedence.png`],
  ]
  for (const [overrides, expected] of cases) {
    const options = { ...optionsFor([asset]), ...overrides }
    const before = structuredClone(options)
    assert.equal(bicepsMedia(study, options).find((media) => media.id === asset.slug)?.url, expected)
    assert.deepEqual(options, before)
  }
  for (const [remoteUrl, expected] of [[undefined, `${branded}/invented/thumbnail.png`], [null, `${branded}/invented/thumbnail.png`], ["", undefined]]) {
    const options = optionsFor([{ ...asset, remoteUrl }])
    assert.equal(bicepsMedia(study, options).find((media) => media.id === asset.slug)?.url, expected)
  }
})

test("rejected/unreviewed links override seeded approvals while review/source/model gates remain unchanged", () => {
  const assets = [
    inventedAsset("approved"), inventedAsset("pending-link"), inventedAsset("held", { reviewStatus: "pending" }),
    inventedAsset("restricted", { usageScope: "review_only" }), inventedAsset("other-source", { sourceRef: "servier-medical-art" }),
    inventedAsset("model", { mediaType: "model_3d" }), inventedAsset("missing-source", { sourceRef: "invented-unknown" }),
  ]
  const links = assets.map((asset) => inventedLink(asset.slug, asset.slug === "pending-link" ? { reviewStatus: "pending" } : {}))
  const seedLink = foundation.ANATOMY_FOUNDATION_SEED.mediaEntityLinks.find((link) => link.assetSlug === imageSlug && link.entitySlug === "biceps-brachii")
  for (const reviewStatus of ["rejected", "pending"]) {
    const options = { ...optionsFor(assets, [...links, { ...seedLink, reviewStatus }]), mediaUrlBySlug: new Map([[imageSlug, `${legacy}/invented/rejected.png`]]) }
    const baseline = bicepsMedia(loadStudy(undefined), options)
    const mapped = bicepsMedia(loadStudy(branded), options)
    assert.deepEqual(mapped, expectedDelivery(baseline))
    assert.ok(mapped.some((media) => media.id === "approved"))
    assert.ok(!mapped.some((media) => [imageSlug, "pending-link", "held", "restricted", "other-source", "model", "missing-source"].includes(media.id)))
  }
})

test("link order/roles/credits persist and source_link, audio and video are not rebound or newly filtered", () => {
  const assets = [
    inventedAsset("secondary"), inventedAsset("primary"), inventedAsset("game"), inventedAsset("earlier"),
    ...["source_link", "audio", "video"].map((mediaType) => inventedAsset(mediaType, { mediaType })),
  ]
  const options = optionsFor(assets, assets.map((asset) => inventedLink(asset.slug, {
    role: asset.slug === "secondary" ? "reference" : asset.slug === "game" ? "game_prompt" : "primary",
    displayPriority: asset.slug === "earlier" ? 1 : 10,
  })))
  const before = structuredClone(options)
  const baseline = bicepsMedia(loadStudy(undefined), options)
  const mapped = bicepsMedia(loadStudy(branded), options)
  assert.deepEqual(mapped, expectedDelivery(baseline))
  assert.deepEqual(mapped.filter((item) => ["earlier", "primary", "game", "secondary"].includes(item.id)).map((item) => item.id), ["earlier", "primary", "game", "secondary"])
  for (const type of ["source_link", "audio", "video"]) assert.equal(mapped.find((item) => item.id === type).url, `${legacy}/invented/${type}.png`)
  assert.deepEqual(options, before)
})

test("seed storagePath/sourceUrl declarations without delivery URLs remain absent", () => {
  const seed = structuredClone(foundation.ANATOMY_FOUNDATION_SEED)
  const image = seed.mediaAssets.find((asset) => asset.slug === imageSlug)
  delete image.remoteUrl
  delete image.thumbnailUrl
  image.storagePath = "invented/anatomy/image.png"
  image.sourceUrl = `${legacy}/invented/reference-only.png`
  assert.ok(!bicepsMedia(loadStudy(branded, seed)).some((media) => media.id === imageSlug))
  assert.deepEqual(loadStudy(branded).getAnatomyStudyCards(), loadStudy(undefined).getAnatomyStudyCards())
})

test("actual Anatomime seed decks/prompts and flashcard prompt caches share the immutable study owner", () => {
  const seed = structuredClone(foundation.ANATOMY_FOUNDATION_SEED)
  seed.mediaAssets.find((asset) => asset.slug === imageSlug).remoteUrl = `${legacy}/invented/seed-consumer.png`
  const consumers = (origin) => {
    const study = loadStudy(origin, seed)
    const anatomime = load(readFileSync(new URL("../lib/anatomime-shared.ts", import.meta.url), "utf8"), "anatomime-shared.ts", {
      "./anatomy-study.ts": study, "./flashcard-progress.ts": progress,
    })
    const flashcards = load(readFileSync(new URL("../lib/flashcard-progress-helpers.ts", import.meta.url), "utf8"), "flashcard-progress-helpers.ts", {
      "./anatomy-study.ts": study, "./flashcard-community.ts": { FLASHCARD_TOOL: "flashcards" },
    })
    return { study, anatomime, flashcards }
  }
  const defaults = consumers(undefined)
  const opted = consumers(branded)
  const config = opted.anatomime.normalizeAnatomimeSessionConfig({ categories: ["muscle"], selectedCardIds: ["muscle-biceps-brachii"], seed: "invented-delivery" })
  const deck = opted.anatomime.createAnatomimeSessionDeck(config)
  assert.deepEqual(deck, expectedDelivery(defaults.anatomime.createAnatomimeSessionDeck(config)))
  const card = deck.find((item) => item.id === "muscle-biceps-brachii")
  assert.ok(card)
  assert.equal(card.media.find((item) => item.id === imageSlug).url, `${branded}/invented/seed-consumer.png`)
  assert.deepEqual(opted.anatomime.anatomimeTermFromCard(card), expectedDelivery(defaults.anatomime.anatomimeTermFromCard(defaults.study.getAnatomyStudyCards().find((item) => item.id === card.id))))
  assert.deepEqual(opted.anatomime.getAnatomimeNameRecallPrompt(card.id), defaults.anatomime.getAnatomimeNameRecallPrompt(card.id))
  assert.deepEqual(opted.anatomime.checkAnatomimeAnswer(card, card.name), defaults.anatomime.checkAnatomimeAnswer(card, card.name))
  assert.deepEqual(opted.anatomime.getAnatomimeSetupOptions(), defaults.anatomime.getAnatomimeSetupOptions())
  const defaultCatalog = defaults.flashcards.currentFlashcardPromptCatalog()
  const optedCatalog = opted.flashcards.currentFlashcardPromptCatalog()
  assert.deepEqual(optedCatalog.prompts, expectedDelivery(defaultCatalog.prompts))
  assert.deepEqual(optedCatalog.promptIds, defaultCatalog.promptIds)
  assert.strictEqual(opted.flashcards.currentFlashcardPromptCatalog(), optedCatalog)
  assert.notStrictEqual(optedCatalog, defaultCatalog)
})
