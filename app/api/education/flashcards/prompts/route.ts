import { NextResponse } from "next/server"
import {
  createFlashcardPromptDeck,
  getAnatomyStudyPrompts,
  getFlashcardPromptTypeCounts,
} from "@/lib/anatomy-study"
import { normalizeFlashcardDeckConfig } from "@/lib/flashcard-community"
import { emptyFlashcardMediaOptions, tryFlashcardMediaOptions } from "@/lib/flashcard-progress-helpers"
import { hasExactFlashcardImageSelection, hasMissingSelectedFlashcardImages } from "@/lib/flashcard-static-metadata"

function objectBody(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

export async function POST(request: Request) {
  const body = objectBody(await request.json().catch(() => ({})))
  const config = normalizeFlashcardDeckConfig(body.config)
  const shouldLoadMediaUrls = config.promptTypes.includes("identify_from_media")
  const loadedMedia = shouldLoadMediaUrls ? await tryFlashcardMediaOptions() : emptyFlashcardMediaOptions
  const mediaOptions = loadedMedia ?? emptyFlashcardMediaOptions
  const promptTypeCounts = getFlashcardPromptTypeCounts(config, mediaOptions)
  const needsFullPool = body.includePromptSummaries === true || hasExactFlashcardImageSelection(config)
  const eligiblePrompts = needsFullPool ? getAnatomyStudyPrompts(config, mediaOptions) : []
  const missingSelection = hasMissingSelectedFlashcardImages(config, eligiblePrompts.map((prompt) => prompt.id))
  const prompts = body.includePrompts === true && !missingSelection
    ? createFlashcardPromptDeck(config, mediaOptions)
    : []
  const promptSummaries = body.includePromptSummaries === true
    ? eligiblePrompts.map((prompt) => ({
      id: prompt.id,
      type: prompt.type,
      typeLabel: prompt.typeLabel,
      name: prompt.name,
      categoryLabel: prompt.categoryLabel,
      regionLabels: prompt.regionLabels,
      difficulty: prompt.difficulty,
    }))
    : []

  return NextResponse.json({
    promptTypeCounts,
    prompts,
    promptSummaries,
    ...((loadedMedia === null || missingSelection) && { mediaUnavailable: true }),
  })
}
