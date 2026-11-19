import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { createHash } from "node:crypto"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { describe, it } from "node:test"
import { getChimerClockFontMetrics } from "../lib/chimer-clock-font-metrics.js"

const require = createRequire(import.meta.url)
const sharp = require("sharp")
const root = fileURLToPath(new URL("..", import.meta.url))

/** Read the actual Digital declaration and its vendored file, not a test-only face. */
function digitalAsset(family = "Digital") {
  const css = fs.readFileSync(path.join(root, "app/globals.css"), "utf8")
  const face = [...css.matchAll(/@font-face\s*\{[^}]*\}/g)].find(([block]) => block.includes(`font-family: "${family}";`))?.[0]
  assert.ok(face, `The owned ${family} face must remain explicitly declared`)
  const url = face.match(/src:\s*url\("([^"]+)"\)/)?.[1]
  assert.ok(url?.startsWith("../public/fonts/dseg/"), "Digital must use a build-relative owned asset")
  const file = path.resolve(root, "app", url)
  assert.ok(file.startsWith(path.join(root, "public/fonts/dseg") + path.sep))
  return { face, url: new URL(url, "http://127.0.0.1/app/globals.css").pathname, body: fs.readFileSync(file) }
}

/** Exercise the real vendored face in an isolated virtual page with external networking denied. */
async function inspectDigitalMetrics({ clock = false } = {}) {
  const { chromium } = require("@playwright/test")
  assert.ok(fs.existsSync(chromium.executablePath()), "Use cached Chromium without downloading a browser")
  const fontFamily = clock ? "Digital Clock" : "Digital"
  const fontWeight = clock ? 700 : 400
  const asset = digitalAsset(fontFamily)
  const clockCss = fs.readFileSync(path.join(root, "app/chimer/running-timer.module.css"), "utf8")
  const glyphRules = ["currentTimeUnit", "currentTimeDigit", "colon", "clockColon"]
    .map((name) => clockCss.match(new RegExp(`\\.${name}\\s*\\{[^}]*\\}`))?.[0] ?? "")
    .join("\n")
  const glyphVariables = Object.entries(getChimerClockFontMetrics("digital")).map(([name, value]) => `${name}:${value}`).join(";")
  const browser = await chromium.launch({ headless: true, args: ["--disable-background-networking", "--disable-component-update", "--disable-sync", "--proxy-server=http://127.0.0.1:9", "--proxy-bypass-list=<-loopback>"] })
  let context
  const unexpected = []
  try {
    context = await browser.newContext({ serviceWorkers: "block" })
    const origin = "http://127.0.0.1:43919"
    await context.route("**/*", (route) => {
      const url = route.request().url()
      const headers = { "Content-Security-Policy": "default-src 'none'; font-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'none'" }
      if (url === origin + asset.url) return route.fulfill({ status: 200, contentType: "font/woff2", headers, body: asset.body })
      if (url === origin + "/app/globals.css") return route.fulfill({ status: 200, contentType: "text/css", headers, body: `${asset.face}\n${glyphRules}` })
      if (url === origin + "/font-fixture") return route.fulfill({ status: 200, contentType: "text/html", headers, body: `<!doctype html><link rel='stylesheet' href='/app/globals.css'><p style='font:${fontWeight} 48px ${fontFamily},monospace'>12:34:56 30s PM</p><section style='padding:80px;color:black;background:white;font:${fontWeight} 48px/1 ${fontFamily},monospace;${glyphVariables}'><span class='currentTimeUnit'><span class='currentTimeDigit' data-glyph-box>1</span><span class='currentTimeDigit' data-glyph-box>2</span></span><span class='colon clockColon' data-glyph-box>:</span><span class='currentTimeUnit'><span class='currentTimeDigit' data-glyph-box>3</span><span class='currentTimeDigit' data-glyph-box>4</span></span><span class='colon' data-glyph-box>:</span></section>` })
      unexpected.push(url)
      return route.abort("blockedbyclient")
    })
    const page = await context.newPage()
    await page.goto(origin + "/font-fixture")
    const result = await page.evaluate(async ({ fontFamily, fontWeight }) => {
      await document.fonts.load(`${fontWeight} 48px "${fontFamily}"`, "0123456789:")
      await document.fonts.ready
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      ctx.font = `${fontWeight} 48px "${fontFamily}", monospace`
      const digitWidths = [..."0123456789"].map((digit) => ctx.measureText(digit).width)
      const timeWidths = ["00:00", "11:11", "23:45", "59:59"].map((text) => ctx.measureText(text).width)
      const suffixText = fontFamily === "Digital Clock" ? "sPM" : "s PM"
      const suffix = ctx.measureText(suffixText).width
      ctx.font = `${fontWeight} 48px monospace`
      const fallbackSuffix = ctx.measureText(suffixText).width
      const glyphBoxes = [...document.querySelectorAll("[data-glyph-box]")].map((node) => {
        const range = document.createRange()
        range.selectNodeContents(node)
        const box = node.getBoundingClientRect()
        return { glyph: node.textContent, boxWidth: box.width, advance: range.getBoundingClientRect().width,
          inkCenterError: 0 }
      })
      return { faces: [...document.fonts].map((face) => ({ family: face.family, weight: face.weight, status: face.status })), digitWidths, timeWidths, suffix, fallbackSuffix, glyphBoxes }
    }, { fontFamily, fontWeight })
    // Inspect painted ink rather than infer its placement from font-wide
    // Canvas metrics. Include space beyond the line box so clipping cannot
    // make an incorrectly positioned glyph look centered.
    const glyphs = await page.locator("[data-glyph-box]").all()
    for (let index = 0; index < glyphs.length; index += 1) {
      const box = await glyphs[index].boundingBox()
      const margin = 48
      const screenshot = await page.screenshot({ clip: { x: box.x, y: box.y - margin, width: Math.ceil(box.width), height: Math.ceil(box.height + margin * 2) } })
      const { data, info } = await sharp(screenshot).removeAlpha().raw().toBuffer({ resolveWithObject: true })
      let top = info.height
      let bottom = -1
      for (let y = 0; y < info.height; y += 1) {
        for (let x = 0; x < info.width; x += 1) {
          const offset = (y * info.width + x) * info.channels
          if (data[offset] + data[offset + 1] + data[offset + 2] >= 384) continue
          top = Math.min(top, y)
          bottom = Math.max(bottom, y)
        }
      }
      assert.ok(bottom >= top, "The real font must paint visible glyph pixels")
      result.glyphBoxes[index].inkCenterError = (top + bottom + 1) / 2 - margin - box.height / 2
    }
    assert.deepEqual(unexpected, [], "The font fixture must request no application or provider service")
    return result
  } finally {
    await context?.close()
    await browser.close()
  }
}

describe("Owned Digital timer font", { timeout: 120_000 }, () => {
  it("serves the pinned unmodified font with its author's original copyright and OFL", () => {
    const { body } = digitalAsset()
    assert.equal(body.subarray(0, 4).toString(), "wOF2")
    assert.equal(createHash("sha256").update(body).digest("hex"), "3ea4cfd8ce47d00563bf967151cea3a4be9109edb49d38d8b48f98fe5abf1780")
    const license = fs.readFileSync(path.join(root, "public/fonts/dseg/DSEG-LICENSE.txt"))
    assert.equal(createHash("sha256").update(license).digest("hex"), "c6ee0567859cb7cc8d992149bbd96ad359ef65fb7355f7feae0547555ffacd23")
    assert.match(license.toString(), /SIL OPEN FONT LICENSE Version 1\.1/)
    assert.match(license.toString(), /Copyright[^\n]*keshikan/)
  })

  it("loads real segmented digits without width jitter and retains readable suffix fallbacks", async () => {
    const result = await inspectDigitalMetrics()
    assert.deepEqual(result.faces, [{ family: "Digital", weight: "normal", status: "loaded" }])
    assert.ok(Math.max(...result.digitWidths) - Math.min(...result.digitWidths) < 0.01)
    assert.ok(Math.max(...result.timeWidths) - Math.min(...result.timeWidths) < 0.01)
    assert.ok(Math.abs(result.suffix - result.fallbackSuffix) < 0.01)
  })

  it("fits real glyph advances inside the clock's actual digit and separator boxes", async () => {
    const result = await inspectDigitalMetrics()
    assert.ok(result.glyphBoxes.length > 0)
    assert.ok(result.glyphBoxes.every(({ boxWidth, advance }) => advance <= boxWidth + 0.5), "Each segmented glyph needs its own full advance, even when the whole clock fits")
  })

  it("serves the author's unmodified Bold face through a separate clock-only alias", () => {
    const { body, face } = digitalAsset("Digital Clock")
    assert.equal(body.subarray(0, 4).toString(), "wOF2")
    assert.equal(createHash("sha256").update(body).digest("hex"), "05eab7015f3aaba2ffc32b4d29362f9b470e1a4afe8d2c8332d301bb061a83cf")
    assert.match(face, /font-weight:\s*700/)
  })

  it("loads real bold clock digits with stable width and vertically centered visible ink", async () => {
    const result = await inspectDigitalMetrics({ clock: true })
    assert.deepEqual(result.faces, [{ family: "Digital Clock", weight: "700", status: "loaded" }])
    assert.ok(Math.max(...result.digitWidths) - Math.min(...result.digitWidths) < 0.01)
    assert.ok(Math.max(...result.timeWidths) - Math.min(...result.timeWidths) < 0.01)
    assert.ok(Math.abs(result.suffix - result.fallbackSuffix) < 0.01)
    assert.ok(result.glyphBoxes.every(({ boxWidth, advance }) => advance <= boxWidth + 0.5))
    // Segment tips differ by a pixel across numerals; the old offset was 8px.
    assert.ok(result.glyphBoxes.every(({ inkCenterError }) => Math.abs(inkCenterError) <= 1.5), JSON.stringify(result.glyphBoxes))
  })
})
