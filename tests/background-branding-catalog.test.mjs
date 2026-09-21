import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { describe, it } from "node:test"
import audit from "../data/background-branding-audit.json" with { type: "json" }
import brandingCatalog from "../data/background-branding-catalog.json" with { type: "json" }
import { backgroundRegistry } from "../components/backgrounds/backgroundRegistry.ts"
import { ACTIVE_BACKGROUND_IDS } from "../lib/background-options.js"
import { matchesBackgroundSearch } from "../lib/background-catalog.js"
import { PUBLIC_PRODUCT_IDENTITY } from "../lib/public-product-identity.js"

const normalize = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()

describe("approved background branding catalog", () => {
  it("publishes every approved name and descriptor without changing stable IDs", () => {
    const enabled = backgroundRegistry.filter(({ enabled }) => enabled)
    const auditById = new Map(audit.entries.map((entry) => [entry.id, entry]))
    const catalogById = new Map(brandingCatalog.entries.map((entry) => [entry.id, entry]))

    assert.deepEqual(enabled.map(({ id }) => id).toSorted(), [...ACTIVE_BACKGROUND_IDS].toSorted())
    assert.deepEqual([...catalogById.keys()].toSorted(), [...ACTIVE_BACKGROUND_IDS].toSorted())
    assert.equal(new Set(enabled.map(({ label }) => normalize(label))).size, enabled.length)

    for (const background of enabled) {
      const reviewed = auditById.get(background.id)
      const branding = catalogById.get(background.id)
      assert.ok(reviewed, `${background.id} audit entry`)
      assert.ok(branding, `${background.id} branding entry`)
      assert.equal(background.label, reviewed.recommendedName)
      assert.equal(background.visualDescriptor, reviewed.visualDescriptor)
      assert.deepEqual(background.legacyLabels, branding.legacyLabels)
      assert.equal(background.signatureOriginal, reviewed.signatureOriginalEligible)
    }
  })

  it("keeps legacy names searchable without making them ordinary labels", () => {
    const renamed = backgroundRegistry.find(({ id }) => id === "massage-lab-retro-grid")
    assert.ok(renamed)
    assert.equal(renamed.label, "Endless Perspective")
    assert.deepEqual(renamed.legacyLabels, ["Retro Grid"])
    assert.equal(matchesBackgroundSearch(renamed, "retro grid"), true)
    assert.equal(matchesBackgroundSearch(renamed, "perspective grid"), true)
    assert.equal(matchesBackgroundSearch(renamed, "unrelated phrase"), false)
  })

  it("publishes the three approved unbranded labels under the public product owner", () => {
    const visiblyBranded = backgroundRegistry.filter(({ label }) => normalize(label).replaceAll(" ", "").includes("massagelab"))
    assert.deepEqual(visiblyBranded, [])

    for (const [id, label, legacyLabels] of [
      ["massage-lab-moving-gradient", "Lava Lamp", ["MassageLaba Lamp", "Massage Laba Lamp"]],
      ["massage-lab-tile-grid", "Tile grid", ["MassageLab tile grid", "Quiet Mosaic"]],
      ["massage-lab-hex-grid", "Hex grid", ["MassageLab hex grid", "Honeycomb Glow"]],
    ]) {
      const background = backgroundRegistry.find((entry) => entry.id === id)
      assert.equal(background?.label, label)
      assert.equal(background?.provider, PUBLIC_PRODUCT_IDENTITY.name)
      assert.equal(background?.license, "MassageLab internal implementation")
      assert.equal(background?.sourceUrl, "internal")
      assert.equal(background?.signatureOriginal, true)
      assert.deepEqual(background?.legacyLabels, legacyLabels)
    }
  })

  it("keeps public provider identity separate from source-era license provenance", () => {
    const expectedLicenses = new Map([
      ["massage-lab-moving-gradient", "MassageLab internal implementation"],
      ["static-gradient", "MassageLab internal implementation"],
      ["solid-color", "MassageLab internal implementation"],
      ["massage-lab-tile-grid", "MassageLab internal implementation"],
      ["massage-lab-hex-grid", "MassageLab internal implementation"],
      [
        "massage-lab-particles-draft",
        "MassageLab internal draft; MassageLab MIT source candidate not imported",
      ],
      [
        "massage-lab-noise-texture-draft",
        "MassageLab internal draft; MassageLab MIT source candidate not imported",
      ],
      [
        "massage-lab-grid-pattern-draft",
        "MassageLab internal draft; MassageLab MIT source candidate not imported",
      ],
      [
        "massage-lab-animated-grid-draft",
        "MassageLab internal draft; MassageLab MIT source candidate not imported",
      ],
    ])

    for (const [id, license] of expectedLicenses) {
      const background = backgroundRegistry.find((entry) => entry.id === id)
      assert.ok(background, id)
      assert.equal(
        background.provider,
        id.endsWith("-draft") ? `${PUBLIC_PRODUCT_IDENTITY.name} draft` : PUBLIC_PRODUCT_IDENTITY.name,
        `${id}: public provider`,
      )
      assert.equal(background.license, license, `${id}: preserved provenance`)
      assert.match(background.license, /^MassageLab /, `${id}: source-era owner`)
      assert.doesNotMatch(background.license, /^AtmoShaper /, `${id}: presentation identity`)
    }
  })

  it("shows literal descriptors on primary picker and ownership surfaces", async () => {
    const [card, tray, acquisition, credit, account] = await Promise.all([
      readFile(new URL("../components/backgrounds/background-carousel-card.tsx", import.meta.url), "utf8"),
      readFile(new URL("../components/backgrounds/background-carousel-control-tray.tsx", import.meta.url), "utf8"),
      readFile(new URL("../components/backgrounds/BackgroundAcquisitionDialog.tsx", import.meta.url), "utf8"),
      readFile(new URL("../components/backgrounds/BackgroundCreditConfirmationDialog.tsx", import.meta.url), "utf8"),
      readFile(new URL("../components/account/BackgroundCommercePanel.tsx", import.meta.url), "utf8"),
    ])
    for (const source of [tray, acquisition, credit, account]) {
      assert.match(source, /visualDescriptor/)
    }
    assert.match(tray, /data-background-carousel-controls/)
    assert.doesNotMatch(card, /visualDescriptor/)
  })
})
