import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

import { ATMOSPHERE_PUBLIC_LABELS } from "../lib/atmosphere/public-labels.js"

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8")
}

const browseWorkspaceSource = read("app/browse/workspace.tsx")
const favoritesSpeedDialSource = read("components/atmosphere/favorites-speed-dial.tsx")
const navigationSource = read("lib/navigation.js")
const stationGroupsSource = read("lib/atmosphere/station-groups.js")

describe("Atmosphere public labels", () => {
  it("owns only the approved public audio nouns in order", () => {
    assert.deepEqual(Object.keys(ATMOSPHERE_PUBLIC_LABELS), ["name", "descriptor"])
    assert.deepEqual(ATMOSPHERE_PUBLIC_LABELS, {
      name: "Atmosphere",
      descriptor: "Atmosphere mixer",
    })
  })

  it("prevents consumers from mutating the shared nouns", () => {
    assert.ok(Object.isFrozen(ATMOSPHERE_PUBLIC_LABELS))
    assert.throws(() => {
      ATMOSPHERE_PUBLIC_LABELS.name = "Changed"
    }, TypeError)
    assert.equal(ATMOSPHERE_PUBLIC_LABELS.name, "Atmosphere")
  })

  it("has no imports, re-exports, environment, browser, provider, or mutation dependencies", () => {
    const source = read("lib/atmosphere/public-labels.js")

    assert.doesNotMatch(source, /\bimport\b/)
    assert.doesNotMatch(source, /\bexport\s+(?:\*|\{)[\s\S]*?\bfrom\b/)
    assert.doesNotMatch(
      source,
      /\b(?:process|window|document|globalThis|navigator|localStorage|sessionStorage|fetch)\b/,
    )
    assert.doesNotMatch(source, /\b(?:provider|database|prisma|stripe|mutation)\b/i)
  })

  it("delegates the browse heading and eyebrow to the shared name", () => {
    assert.match(
      browseWorkspaceSource,
      /import \{ ATMOSPHERE_PUBLIC_LABELS \} from "@\/lib\/atmosphere\/public-labels"/,
    )
    assert.match(
      browseWorkspaceSource,
      /<h1 className="sr-only">\{ATMOSPHERE_PUBLIC_LABELS\.name\}<\/h1>/,
    )
    assert.match(
      browseWorkspaceSource,
      /<p className="text-sm uppercase tracking-normal text-primary">\{ATMOSPHERE_PUBLIC_LABELS\.name\}<\/p>/,
    )
    assert.doesNotMatch(
      browseWorkspaceSource,
      /<(?:h1|p)[^>]*>Atmosphere<\/(?:h1|p)>/,
    )
  })

  it("delegates the navigation group label to the shared name", () => {
    assert.match(
      navigationSource,
      /import \{ ATMOSPHERE_PUBLIC_LABELS \} from "\.\/atmosphere\/public-labels\.js"/,
    )
    assert.match(navigationSource, /label: ATMOSPHERE_PUBLIC_LABELS\.name/)
    assert.doesNotMatch(navigationSource, /label:\s*["']Atmosphere["']/)
  })

  it("delegates the saved-station description to the shared name", () => {
    assert.match(
      favoritesSpeedDialSource,
      /import \{ ATMOSPHERE_PUBLIC_LABELS \} from "@\/lib\/atmosphere\/public-labels"/,
    )
    assert.match(
      favoritesSpeedDialSource,
      /<SheetDescription>Start any saved \{ATMOSPHERE_PUBLIC_LABELS\.name\} station\.<\/SheetDescription>/,
    )
    assert.doesNotMatch(
      favoritesSpeedDialSource,
      /<SheetDescription>Start any saved Atmosphere station\.<\/SheetDescription>/,
    )
  })

  it("delegates the fallback station-group description to the shared name", () => {
    assert.match(
      stationGroupsSource,
      /import \{ ATMOSPHERE_PUBLIC_LABELS \} from "\.\/public-labels\.js"/,
    )
    assert.ok(
      stationGroupsSource.includes(
        'description: `Additional playable ${ATMOSPHERE_PUBLIC_LABELS.name} stations.`',
      ),
    )
    assert.doesNotMatch(
      stationGroupsSource,
      /description:\s*["']Additional playable Atmosphere stations\.["']/,
    )
  })
})
