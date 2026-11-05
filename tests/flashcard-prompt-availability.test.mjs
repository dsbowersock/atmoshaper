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

test("preserves exact image selections across failed and incomplete catalog lookups", async () => {
  const read = Promise.withResolvers()
  const started = Promise.withResolvers()
  let lookupCount = 0
  let lookupFails = false
  let availableRows
  let progressReads = 0
  let masteredImage = false
  const recordedSessions = []
  globalThis.atmoPromptFixturePrisma = {
    anatomyMediaAsset: {
      findMany() {
        lookupCount++
        started.resolve()
        return lookupFails ? Promise.reject(Error("Invented lookup failure")) : read.promise.then(rows => availableRows ?? rows)
      },
    },
    learningProgress: {
      findMany() {
        progressReads++
        return Promise.resolve(masteredImage ? [{
          tool: "invented-image-progress",
          metadata: { promptId, correctCount: 10, attemptCount: 10 },
        }] : [])
      },
    },
    flashcardStudySession: {
      create({ data }) {
        recordedSessions.push(data.promptIds)
        return Promise.resolve({ id: "invented-session" })
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
    ["@/lib/flashcard-progress", file("lib/flashcard-progress.ts")],
    ["@/lib/flashcard-progress-helpers", file("lib/flashcard-progress-helpers.ts")],
    ["@/auth", "data:text/javascript,export const getCurrentSession=async()=>({user:{id:'fixture-user'}})"],
    ["@/lib/prisma", "data:text/javascript,export const prisma=globalThis.atmoPromptFixturePrisma"],
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
    const { POST: startSession } = await import(file("app/api/education/flashcards/sessions/route.ts"))
    const { loadAnatomyStudyMediaUrlOptions } = await import(media)
    const { normalizeFlashcardDeckConfig } = await import(file("lib/flashcard-community.ts"))
    const {
      FlashcardImageUnavailableError,
      loadFlashcardPromptCatalog,
      loadTemporaryFlashcardDeck,
      startFlashcardProgressSession,
    } = await import(file("app/education/flashcards/flashcard-api-client.ts"))
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
    globalThis.fetch = (url, init) => {
      const route = url.endsWith("/sessions") ? startSession : POST
      return route(new Request("https://example.invalid" + url, init))
    }

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

    const exactIds = [text.prompts[0].id, promptId]
    const mixed = normalizeFlashcardDeckConfig({
      ...config, promptTypes: ["name_to_region", "identify_from_media"], promptIds: exactIds, count: 2,
    })
    const startMixedSession = (changes = {}) => startSession(new Request("https://example.invalid/api/education/flashcards/sessions", {
      method: "POST", body: JSON.stringify({ config: mixed, ...changes }),
    }))
    const temporary = await loadTemporaryFlashcardDeck(mixed)
    assert.deepEqual(new Set(temporary.map(prompt => prompt.id)), new Set(exactIds))
    assert.equal((await startMixedSession()).status, 201)
    assert.deepEqual(new Set(recordedSessions[0]), new Set(exactIds))

    // Sampling one of two eligible selections is intentional, not missing media.
    const sampled = { ...mixed, count: 1 }
    assert.equal((await loadTemporaryFlashcardDeck(sampled)).length, 1)
    assert.equal((await startMixedSession({ config: sampled })).status, 201)
    assert.equal(recordedSessions[1].length, 1)

    masteredImage = true
    assert.equal((await startMixedSession({ skipMastered: true })).status, 201)
    assert.deepEqual(recordedSessions[2], [text.prompts[0].id])
    assert.equal(progressReads, 1)
    masteredImage = false
    progressReads = 0

    const incompleteAt = realNow() + 61_000
    Date.now = () => incompleteAt
    availableRows = []
    await assert.rejects(loadTemporaryFlashcardDeck(mixed), FlashcardImageUnavailableError)
    await assert.rejects(loadTemporaryFlashcardDeck(sampled), FlashcardImageUnavailableError)
    for (const skipMastered of [false, true]) {
      const incompleteSession = await startMixedSession({ skipMastered })
      assert.equal(incompleteSession.status, 503)
      assert.equal((await incompleteSession.json()).mediaUnavailable, true)
    }
    assert.equal(recordedSessions.length, 3)
    assert.equal(progressReads, 0, "missing selected images must fail before mastery reads")
    const absent = await request({ promptIds: [promptId + "-unknown"] })
    assert.deepEqual(absent.prompts, [])
    assert.equal(absent.mediaUnavailable, true)

    const expired = incompleteAt + 61_000
    Date.now = () => expired
    lookupFails = true
    assert.equal((await loadFlashcardPromptCatalog(config)).mediaUnavailable, true)
    assert.equal(lookupCount, 3)

    await assert.rejects(loadTemporaryFlashcardDeck(mixed), FlashcardImageUnavailableError)
    const failedSession = await startFlashcardProgressSession({ config: mixed, deckSlug: "", skipMastered: false })
    assert.deepEqual(failedSession, {
      ok: false,
      status: 503,
      errorMessage: "Image availability could not be checked. Try starting the deck again.",
      mediaUnavailable: true,
    })
    assert.equal(recordedSessions.length, 3)
    const broad = normalizeFlashcardDeckConfig({ ...mixed, promptIds: undefined })
    const availableText = await loadTemporaryFlashcardDeck(broad)
    assert.ok(availableText.length > 0 && availableText.every(prompt => prompt.type === "name_to_region"))

    globalThis.fetch = async () => { throw Error("Invented offline transport") }
    assert.equal((await loadFlashcardPromptCatalog(config)).mediaUnavailable, true)
    await assert.rejects(loadTemporaryFlashcardDeck(mixed), FlashcardImageUnavailableError)
  } finally {
    globalThis.fetch = realFetch
    Date.now = realNow
    hooks.deregister()
    delete globalThis.atmoPromptFixturePrisma
  }
})
