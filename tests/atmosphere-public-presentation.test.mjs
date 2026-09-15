import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

import * as publicPresentation from "../lib/atmosphere/public-presentation.js"

const { formatAtmospherePublicError } = publicPresentation

const boundarySources = {
  library: readFileSync(new URL("../components/atmoshaper/sound-library.tsx", import.meta.url), "utf8"),
  miniPlayer: readFileSync(new URL("../components/providers/music-mini-player.tsx", import.meta.url), "utf8"),
  mix: readFileSync(new URL("../components/atmoshaper/current-mix.tsx", import.meta.url), "utf8"),
  provider: readFileSync(new URL("../components/providers/music-provider.tsx", import.meta.url), "utf8"),
  stationCard: readFileSync(new URL("../components/atmosphere/station-carousel-card.tsx", import.meta.url), "utf8"),
  workspace: readFileSync(new URL("../components/atmoshaper/atmoshaper-workspace.tsx", import.meta.url), "utf8"),
}

describe("Atmosphere public presentation", () => {
  it("maps the exact AtmoShaper compatibility-default title to Atmosphere", () => {
    assert.equal(
      publicPresentation.resolveAtmospherePublicTitle?.("AtmoShaper"),
      "Atmosphere",
    )
  })

  it("maps absent recipe names to the Atmosphere public title", () => {
    for (const name of [undefined, null, ""]) {
      assert.equal(publicPresentation.resolveAtmospherePublicTitle(name), "Atmosphere")
    }
  })

  it("preserves custom recipe names unchanged", () => {
    for (const name of ["Evening Rain", "AtmoShaper Focus", " Atmosphere "]) {
      assert.equal(publicPresentation.resolveAtmospherePublicTitle(name), name)
    }
  })

  it("delegates all three recipe-title publication paths to the presentation owner", () => {
    const resolverCalls = boundarySources.provider.match(
      /resolveAtmospherePublicTitle\((?:recipe|committedRecipe)\.name\)/g,
    ) ?? []

    assert.deepEqual(resolverCalls, [
      "resolveAtmospherePublicTitle(recipe.name)",
      "resolveAtmospherePublicTitle(committedRecipe.name)",
      "resolveAtmospherePublicTitle(recipe.name)",
    ])
    assert.doesNotMatch(
      boundarySources.provider,
      /(?:recipe|committedRecipe)\.name\s*\|\|\s*ATMOSPHERE_PUBLIC_LABELS\.name/,
    )
  })

  it("replaces only exact AtmoShaper compatibility tokens in public errors", () => {
    assert.equal(
      formatAtmospherePublicError(
        "AtmoShaper failed while NestedAtmoShaper and AtmoShaper2 remained available.",
        "Audio failed.",
      ),
      "Atmosphere failed while NestedAtmoShaper and AtmoShaper2 remained available.",
    )
  })

  it("preserves unrelated public error text", () => {
    assert.equal(
      formatAtmospherePublicError(new Error("The audio device is unavailable."), "Audio failed."),
      "The audio device is unavailable.",
    )
  })

  it("uses the explicit fallback for missing or non-error input", () => {
    for (const input of [null, undefined, "", 42, { message: "AtmoShaper should stay private." }]) {
      assert.equal(formatAtmospherePublicError(input, "Audio failed."), "Audio failed.")
    }
  })

  it("does not mutate the supplied error", () => {
    const error = new Error("AtmoShaper preview failed.")
    const originalStack = error.stack

    assert.equal(formatAtmospherePublicError(error, "Audio failed."), "Atmosphere preview failed.")
    assert.equal(error.message, "AtmoShaper preview failed.")
    assert.equal(error.stack, originalStack)
  })

  it("stays dependency-light beside the noun owner", () => {
    const source = readFileSync(new URL("../lib/atmosphere/public-presentation.js", import.meta.url), "utf8")

    assert.match(source, /from "\.\/public-labels\.js"/)
    assert.doesNotMatch(
      source,
      /\b(?:process|window|document|globalThis|navigator|localStorage|sessionStorage|fetch|provider|database|prisma|stripe|mutation)\b/i,
    )
  })

  it("formats derived public surfaces while retaining raw provider diagnostics", () => {
    assert.match(boundarySources.miniPlayer, /formatAtmospherePublicError\(music\.error,/)
    assert.match(boundarySources.stationCard, /formatAtmospherePublicError\(\s*music\.runtimeReadiness\.error,/)
    assert.match(boundarySources.mix, /formatAtmospherePublicError\(runtimeState\.error,/)
    assert.match(boundarySources.library, /formatAtmospherePublicError\(\s*music\.atmoShaperPreview\?\.error,/)
    assert.match(boundarySources.library, /formatAtmospherePublicError\(settlement\.error,/)
    assert.match(boundarySources.workspace, /formatAtmospherePublicError\(state\.error,/)
    assert.match(boundarySources.workspace, /formatAtmospherePublicError\(\s*music\.runtimeReadiness\.error,/)
    assert.match(boundarySources.workspace, /formatAtmospherePublicError\(preview\.error,/)

    assert.match(
      boundarySources.provider,
      /return Object\.values\(snapshot\.layers\)\.find\(\(\{ error \}\) => Boolean\(error\)\)\?\.error \?\? null/,
    )
    assert.match(
      boundarySources.provider,
      /error: caughtError instanceof Error \? caughtError\.message : "This preview could not start\."/,
    )
    assert.doesNotMatch(boundarySources.provider, /formatAtmospherePublicError/)
  })
})
