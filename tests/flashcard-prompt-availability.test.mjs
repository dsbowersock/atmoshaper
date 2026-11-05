import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import { test } from "node:test"

const asset = "bodyparts3d-biceps-brachii-anatomogram"
const promptId = "identify_from_media:muscle-biceps-brachii:" + asset
const imageUrl = "https://anatomy-media.atmoshaper.com/anatomy/bodyparts3d/anatomograms/biceps-brachii.png"
const row = {
  id: "invented-asset",
  slug: asset,
  title: "Invented anatomy image",
  mediaType: "IMAGE",
  sourceUrl: "https://example.invalid/publisher",
  remoteUrl: imageUrl,
  thumbnailUrl: null,
  license: "CC BY 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  attribution: "Invented stored credit",
  usageScope: "OPEN_REUSE",
  reviewStatus: "REVIEWED",
  source: { slug: "bodyparts3d" },
  entityLinks: [{
    id: "invented-link",
    entityType: "MUSCLE",
    entitySlug: "biceps-brachii",
    role: "PRIMARY",
    reviewStatus: "APPROVED",
    displayPriority: 100,
  }],
}

test("distinguishes partial image catalogs from complete empty results", async () => {
  const read = Promise.withResolvers()
  const started = Promise.withResolvers()
  let lookupCount = 0
  let lookupFails = false
  globalThis.atmoPromptFixturePrisma = {
    anatomyMediaAsset: {
      findMany() {
        lookupCount++
        started.resolve()
        return lookupFails ? Promise.reject(Error("Invented lookup failure")) : read.promise
      },
    },
  }

  // Substitute only the provider. Load the actual route, cache and client adapter.
  const file = path => new URL("../" + path, import.meta.url).href
  const media = file("lib/anatomy-study-media.ts")
  const aliases = new Map([
    ["@/lib/anatomy-study", file("lib/anatomy-study.ts")],
    ["@/lib/anatomy-study-media", media],
    ["@/lib/flashcard-community", file("lib/flashcard-community.ts")],
    ["@/lib/flashcard-static-metadata", file("lib/flashcard-static-metadata.ts")],
    ["next/server", import.meta.resolve("next/server.js")],
  ])
  const hooks = registerHooks({
    resolve(specifier, context, next) {
      if (specifier === "./prisma" && context.parentURL === media) {
        return next("data:text/javascript,export const prisma=globalThis.atmoPromptFixturePrisma", context)
      }
      return next(aliases.get(specifier) ?? specifier, context)
    },
  })
  const realFetch = globalThis.fetch
  const realNow = Date.now

  try {
    const { POST } = await import(file("app/api/education/flashcards/prompts/route.ts"))
    const { loadAnatomyStudyMediaUrlOptions } = await import(media)
    const { normalizeFlashcardDeckConfig } = await import(file("lib/flashcard-community.ts"))
    const { loadFlashcardPromptCatalog } = await import(file("app/education/flashcards/flashcard-api-client.ts"))
    const config = normalizeFlashcardDeckConfig({
      categories: ["muscle"], difficulty: "hard", promptTypes: ["identify_from_media"], promptIds: [promptId], count: 1,
    })
    const request = async (changes = {}) => {
      const response = await POST(new Request("https://example.invalid/api/education/flashcards/prompts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ includePrompts: true, config: { ...config, ...changes } }),
      }))
      assert.equal(response.status, 200)
      return response.json()
    }
    globalThis.fetch = (url, init) => POST(new Request("https://example.invalid" + url, init))

    const text = await request({ promptTypes: ["name_to_region"], promptIds: undefined })
    assert.equal(text.prompts.length, 1)
    assert.equal(text.mediaUnavailable, undefined)
    assert.equal(lookupCount, 0)

    const partial = loadFlashcardPromptCatalog(config)
    await started.promise
    assert.equal((await partial).mediaUnavailable, true)
    assert.equal(lookupCount, 1)

    const cache = loadAnatomyStudyMediaUrlOptions()
    read.resolve([row])
    await cache
    const ready = await loadFlashcardPromptCatalog(config)
    assert.equal(ready.mediaUnavailable, false)
    assert.deepEqual(ready.promptSummaries.map(prompt => prompt.id), [promptId])
    assert.equal((await request()).prompts[0].front.media.url, imageUrl)

    const absent = await request({ promptIds: [promptId + "-unknown"] })
    assert.deepEqual(absent.prompts, [])
    assert.equal(absent.mediaUnavailable, undefined)
    assert.equal(lookupCount, 1)

    const expired = realNow() + 61_000
    Date.now = () => expired
    lookupFails = true
    assert.equal((await loadFlashcardPromptCatalog(config)).mediaUnavailable, true)
    assert.equal(lookupCount, 2)

    globalThis.fetch = async () => { throw Error("Invented offline transport") }
    assert.equal((await loadFlashcardPromptCatalog(config)).mediaUnavailable, true)
  } finally {
    globalThis.fetch = realFetch
    Date.now = realNow
    hooks.deregister()
    delete globalThis.atmoPromptFixturePrisma
  }
})
