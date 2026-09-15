import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

import { ATMOSPHERE_PUBLIC_LABELS } from "../lib/atmosphere/public-labels.js"

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
    const source = readFileSync(new URL("../lib/atmosphere/public-labels.js", import.meta.url), "utf8")

    assert.doesNotMatch(source, /\bimport\b/)
    assert.doesNotMatch(source, /\bexport\s+(?:\*|\{)[\s\S]*?\bfrom\b/)
    assert.doesNotMatch(
      source,
      /\b(?:process|window|document|globalThis|navigator|localStorage|sessionStorage|fetch)\b/,
    )
    assert.doesNotMatch(source, /\b(?:provider|database|prisma|stripe|mutation)\b/i)
  })
})
