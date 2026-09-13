import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"
import { PUBLIC_PRODUCT_IDENTITY } from "../lib/public-product-identity.js"

describe("public product identity", () => {
  it("owns only the approved names and presentation assets in order", () => {
    assert.deepEqual(Object.keys(PUBLIC_PRODUCT_IDENTITY), ["name", "shortName", "assets"])
    assert.deepEqual(Object.keys(PUBLIC_PRODUCT_IDENTITY.assets), [
      "appBarWordmark",
      "appBarMark",
      "socialPreview",
    ])
    assert.deepEqual(PUBLIC_PRODUCT_IDENTITY, {
      name: "MassageLab",
      shortName: "MassageLab",
      assets: {
        appBarWordmark: "/brand/massagelab-wordmark-final-20260622.png",
        appBarMark: "/brand/massagelab-mark-final-20260622.png",
        socialPreview: "/brand/massagelab-home-logo-badge-padded-20260622.png",
      },
    })
  })

  it("freezes the root and nested assets against assignment", () => {
    assert.ok(Object.isFrozen(PUBLIC_PRODUCT_IDENTITY))
    assert.ok(Object.isFrozen(PUBLIC_PRODUCT_IDENTITY.assets))
    assert.throws(() => {
      PUBLIC_PRODUCT_IDENTITY.name = "Changed"
    }, TypeError)
    assert.throws(() => {
      PUBLIC_PRODUCT_IDENTITY.assets.appBarMark = "/changed.png"
    }, TypeError)
    assert.equal(PUBLIC_PRODUCT_IDENTITY.name, "MassageLab")
    assert.equal(PUBLIC_PRODUCT_IDENTITY.assets.appBarMark, "/brand/massagelab-mark-final-20260622.png")
  })

  it("has no imports, re-exports, or environment and browser dependencies", () => {
    const source = readFileSync(new URL("../lib/public-product-identity.js", import.meta.url), "utf8")

    assert.doesNotMatch(source, /\bimport\b/)
    assert.doesNotMatch(source, /\bexport\s+(?:\*|\{)[\s\S]*?\bfrom\b/)
    assert.doesNotMatch(source, /\b(?:process|window|document|globalThis)\b/)
  })
})
