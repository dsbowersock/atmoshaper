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
      name: "AtmoShaper",
      shortName: "AtmoShaper",
      assets: {
        appBarWordmark: "/brand/atmoshaper-wordmark.png",
        appBarMark: "/brand/atmoshaper-logo.png",
        socialPreview: null,
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
    assert.equal(PUBLIC_PRODUCT_IDENTITY.name, "AtmoShaper")
    assert.equal(PUBLIC_PRODUCT_IDENTITY.assets.appBarMark, "/brand/atmoshaper-logo.png")
  })

  it("uses the approved runtime brand variants at their exported dimensions", () => {
    /** Reads PNG dimensions directly so the test remains independent of image tooling. */
    const pngDimensions = (relativePath) => {
      const bytes = readFileSync(new URL(relativePath, import.meta.url))
      assert.equal(bytes.toString("ascii", 1, 4), "PNG")
      return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)]
    }

    assert.deepEqual(
      pngDimensions("../public/brand/atmoshaper-logo.png"),
      [512, 512],
    )
    assert.deepEqual(
      pngDimensions("../public/brand/atmoshaper-wordmark.png"),
      [512, 147],
    )
    assert.deepEqual(
      pngDimensions("../public/brand/atmoshaper-word.png"),
      [512, 147],
    )
    assert.deepEqual(
      pngDimensions("../public/icons/icon-192.png"),
      [192, 192],
    )
    assert.deepEqual(
      pngDimensions("../public/icons/icon-512.png"),
      [512, 512],
    )
    assert.deepEqual(
      pngDimensions("../public/icons/maskable-icon-192.png"),
      [192, 192],
    )
    assert.deepEqual(
      pngDimensions("../public/icons/maskable-icon-512.png"),
      [512, 512],
    )
    assert.deepEqual(
      pngDimensions("../public/icons/apple-touch-icon.png"),
      [180, 180],
    )

    const favicon = readFileSync(new URL("../app/favicon.ico", import.meta.url))
    assert.deepEqual([...favicon.subarray(0, 4)], [0, 0, 1, 0])
    const iconCount = favicon.readUInt16LE(4)
    /** Decodes one ICO directory entry, including the zero byte that represents 256px. */
    const icoEntryDimensions = (_, index) => {
      const offset = 6 + (index * 16)
      const width = favicon[offset] || 256
      const height = favicon[offset + 1] || 256
      return [width, height]
    }
    const embeddedSizes = Array.from({ length: iconCount }, icoEntryDimensions)
    assert.deepEqual(embeddedSizes, [[20, 20], [32, 32], [48, 48]])
  })

  it("has no imports, re-exports, or environment and browser dependencies", () => {
    const source = readFileSync(new URL("../lib/public-product-identity.js", import.meta.url), "utf8")

    assert.doesNotMatch(source, /\bimport\b/)
    assert.doesNotMatch(source, /\bexport\s+(?:\*|\{)[\s\S]*?\bfrom\b/)
    assert.doesNotMatch(source, /\b(?:process|window|document|globalThis)\b/)
  })

  it("delegates manifest and Apple identity while preserving surrounding metadata", () => {
    const manifest = readFileSync(new URL("../app/manifest.ts", import.meta.url), "utf8")
    const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8")

    for (const source of [manifest, layout]) {
      assert.match(source, /import \{ PUBLIC_PRODUCT_IDENTITY \} from "@\/lib\/public-product-identity"/)
    }
    assert.match(manifest, /\bname: PUBLIC_PRODUCT_IDENTITY\.name,/)
    assert.match(manifest, /\bshort_name: PUBLIC_PRODUCT_IDENTITY\.shortName,/)
    assert.match(manifest, /\bid: "\/",/)
    assert.match(manifest, /description: "Anatomy study, session timing, wellness, and local-first practice tools for massage students, educators, therapists, and small practices\.",/)
    assert.match(manifest, /start_url: "\/",\s+scope: "\/",\s+display: "standalone",/)
    assert.match(manifest, /background_color: "#050505",\s+theme_color: "#050505",/)
    assert.match(manifest, /categories: \["health", "education", "productivity"\],/)
    assert.match(manifest, /icons: \[/)
    for (const size of [192, 512]) {
      assert.ok(manifest.includes('src: "/icons/icon-' + size + '.png",'))
      assert.ok(manifest.includes('src: "/icons/maskable-icon-' + size + '.png",'))
    }

    assert.match(layout, /\.\.\.rootMetadata,\s+manifest: "\/manifest\.webmanifest",/)
    assert.match(layout, /appleWebApp: \{\s+capable: true,\s+statusBarStyle: "black-translucent",\s+title: PUBLIC_PRODUCT_IDENTITY\.name,\s+\}/)
    assert.match(layout, /icons: \{\s+icon: \[/)
    assert.match(layout, /apple: \[\{ url: "\/icons\/apple-touch-icon\.png", sizes: "180x180", type: "image\/png" \}\]/)
    assert.match(layout, /export const viewport: Viewport = \{\s+themeColor: "#050505",\s+width: "device-width",\s+initialScale: 1,\s+\}/)
  })
})
