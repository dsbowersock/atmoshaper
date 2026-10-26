import assert from "node:assert/strict"
import fs from "node:fs"
import { createRequire } from "node:module"
import { after, before, describe, it } from "node:test"
import { fileURLToPath } from "node:url"

const require = createRequire(import.meta.url)
const ts = require("typescript")
const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8")
const timerSource = read("../app/chimer/running-timer.tsx")
const moduleCss = read("../app/chimer/running-timer.module.css")
const globalCss = read("../app/globals.css")
const markup = `<div class="settingsTabContent immersiveSettingsTabContent">
  <div class="clockCompactRow">
    <label class="clockCompactField"><span>Font</span><select aria-label="Font"><option>Digital</option><option>Mono</option><option>Sans</option><option>Serif</option></select></label>
    <div class="clockCompactField"><span>Time format</span><div class="formatToggle ml-time-format-choice" aria-label="Time format" data-active-format="12h">
      <button type="button" class="formatOption tactileButton ml-time-format-option formatOptionActive" aria-pressed="true">12h</button>
      <button type="button" class="formatOption tactileButton ml-time-format-option" aria-pressed="false">24h</button>
    </div></div>
  </div>
</div>`

/** Bind the inert layout's critical class ancestry to the real Clock JSX, without importing the app. */
function assertProductionAncestry() {
  const source = ts.createSourceFile("running-timer.tsx", timerSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const elements = []
  const visit = (node) => {
    if (ts.isJsxElement(node)) elements.push(node)
    ts.forEachChild(node, visit)
  }
  visit(source)
  const attr = (node, name) => node.openingElement.attributes.properties
    .find((property) => ts.isJsxAttribute(property) && property.name.getText(source) === name)?.initializer
  const hasClass = (node, name) => new RegExp(`\\bstyles\\.${name}\\b`).test(attr(node, "className")?.getText(source) ?? "")
  const format = elements.filter((node) => attr(node, "aria-label")?.getText(source) === '"Time format"')
    .find((node) => hasClass(node.parent, "clockCompactField"))
  assert.ok(format, "Production Time format must retain its compact-field ancestor")
  const row = format.parent.parent
  assert.ok(hasClass(row, "clockCompactRow"))
  assert.ok(hasClass(row.parent, "settingsTabContent"))
  assert.ok(hasClass(row.parent, "immersiveSettingsTabContent"))
  assert.ok(hasClass(format, "formatToggle"))
  assert.match(attr(format, "className").getText(source), /\bml-time-format-choice\b/)
  const buttons = format.children.filter((node) => ts.isJsxElement(node) && node.openingElement.tagName.getText(source) === "button")
  assert.equal(buttons.length, 2)
  for (const button of buttons) {
    assert.ok(hasClass(button, "formatOption"))
    assert.match(attr(button, "className").getText(source), /\bml-time-format-option\b/)
  }
  const font = elements.find((node) => attr(node, "aria-label")?.getText(source) === '"Font"' && node.parent.parent === row)
  assert.ok(font, "Font and Time format must share the production compact row")
  assert.equal(font.parent.openingElement.tagName.getText(source), "label")
  assert.ok(hasClass(font.parent, "clockCompactField"))
}

describe("Compact Clock touch targets survive global/module stylesheet order", { concurrency: false, timeout: 30_000 }, () => {
  let browser
  let compiledGlobalCss
  before(async () => {
    assertProductionAncestry()
    const { chromium } = require("@playwright/test")
    assert.ok(fs.existsSync(chromium.executablePath()), "Use cached Chromium; never download a browser")
    // Use the real Tailwind configuration and global declarations, restricted to this inert markup.
    const config = require("tailwindcss/loadConfig")(fileURLToPath(new URL("../tailwind.config.ts", import.meta.url)))
    compiledGlobalCss = (await require("postcss")([require("tailwindcss")({ ...config, content: [{ raw: markup, extension: "html" }] })])
      .process(globalCss, { from: undefined })).css
    browser = await chromium.launch({ headless: true, args: ["--disable-background-networking", "--disable-component-update", "--disable-sync", "--proxy-server=http://127.0.0.1:9", "--proxy-bypass-list=<-loopback>"] })
  })
  after(async () => { await browser?.close() })

  it("binds the inert compact ancestor to current production markup", () => assertProductionAncestry())

  for (const width of [539, 319]) {
    for (const order of [["module", "global"], ["global", "module"]]) {
      it(`${width}px: ${order.join(" before ")}`, async () => {
        const context = await browser.newContext({ viewport: { width, height: 823 }, javaScriptEnabled: false, serviceWorkers: "block" })
        const unexpected = []
        try {
          const origin = "http://127.0.0.1:43920"
          await context.route("**/*", (route) => {
            if (route.request().url() === origin + "/clock") {
              const styles = { global: compiledGlobalCss, module: moduleCss.replace(/:global\(([^)]+)\)/g, "$1") }
              return route.fulfill({ contentType: "text/html", headers: { "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'none'; connect-src 'none'" },
                // Identity-map authored module classes; their selectors/declarations and order remain intact.
                body: `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">${order.map((name) => `<style>${styles[name]}</style>`).join("")}</head><body>${markup}</body></html>` })
            }
            unexpected.push(route.request().url())
            return route.abort("blockedbyclient")
          })
          const page = await context.newPage()
          await page.goto(origin + "/clock", { waitUntil: "load", timeout: 10_000 })
          const geometry = await page.evaluate(() => {
            const font = document.querySelector("[aria-label='Font']")
            const format = document.querySelector("[aria-label='Time format']")
            const fontRect = font.getBoundingClientRect()
            const formatRect = format.getBoundingClientRect()
            const fontCard = font.parentElement.getBoundingClientRect()
            const formatCard = format.parentElement.getBoundingClientRect()
            const row = font.parentElement.parentElement
            const inside = (child, parent) => child.left >= parent.left && child.right <= parent.right
              && child.top >= parent.top && child.bottom <= parent.bottom
            return {
              fontHeight: fontRect.height,
              buttons: [...format.querySelectorAll("button")].map((button) => ({ height: button.getBoundingClientRect().height, insideCard: inside(button.getBoundingClientRect(), formatCard) })),
              formatHeight: formatRect.height,
              borders: [getComputedStyle(format).borderTopWidth, getComputedStyle(format).borderBottomWidth],
              overflow: getComputedStyle(format).overflow,
              cards: [fontCard.height, formatCard.height],
              controlsInside: inside(fontRect, fontCard) && inside(formatRect, formatCard),
              controlsFill: [fontCard.right - fontRect.right, formatCard.right - formatRect.right],
              noOverflow: row.scrollWidth <= row.clientWidth + 1,
              sideBySide: Math.abs(fontCard.top - formatCard.top) <= 1 && fontCard.right <= formatCard.left,
              singleColumn: formatCard.top >= fontCard.bottom && Math.abs(formatCard.left - fontCard.left) <= 1,
            }
          })
          assert.deepEqual(unexpected, [], "All requests must be locally fulfilled or blocked")
          assert.ok(geometry.fontHeight >= 44, JSON.stringify(geometry))
          assert.equal(geometry.buttons.length, 2)
          assert.ok(geometry.buttons.every((button) => button.height >= 44), JSON.stringify(geometry))
          assert.ok(geometry.buttons.every((button) => button.insideCard), JSON.stringify(geometry))
          assert.equal(geometry.formatHeight, 44)
          assert.deepEqual(geometry.borders, ["1px", "1px"])
          assert.equal(geometry.overflow, "visible", "Preserve the segment border and visible bounds")
          assert.deepEqual(geometry.cards.map(Math.round), [59, 59])
          assert.ok(geometry.controlsInside && geometry.noOverflow, JSON.stringify(geometry))
          assert.ok(geometry.controlsFill.every((gap) => gap >= 6 && gap <= 8), JSON.stringify(geometry))
          assert.ok(width === 539 ? geometry.sideBySide : geometry.singleColumn, JSON.stringify(geometry))
        } finally {
          await context.close()
        }
      })
    }
  }
})
