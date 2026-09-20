import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { runInNewContext } from "node:vm"

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8")

test("public route assertions select accessible owners while React stream segments remain hidden", async (t) => {
  const [{ chromium, expect: browserExpect }, ts] = await Promise.all([
    import("@playwright/test"), import("typescript"),
  ])
  const [publicSource, previewSource] = await Promise.all([
    read("tests/browser/public-routes.spec.ts"),
    read("tests/browser/phase6-preview-rebrand.spec.ts"),
  ])

  // Extract the real assertion statements so a browser-spec regression cannot
  // leave an independently re-created fixture locator passing.
  const journeys = (filename, source) => {
    const parsed = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
    const result = new Map()
    const visit = (node) => {
      if (ts.isCallExpression(node) && node.expression.getText(parsed) === "test"
        && ts.isStringLiteral(node.arguments[0]) && ts.isArrowFunction(node.arguments[1])) {
        const body = node.arguments[1].body
        if (ts.isBlock(body)) result.set(node.arguments[0].text, body.statements.map((statement) => statement.getText(parsed)))
      }
      ts.forEachChild(node, visit)
    }
    visit(parsed)
    return result
  }
  const publicJourneys = journeys("public-routes.spec.ts", publicSource)
  const previewJourneys = journeys("phase6-preview-rebrand.spec.ts", previewSource)
  const after = (statements, predicate, count) => {
    assert.ok(statements, "the named browser journey must remain present")
    const index = statements.findIndex(predicate)
    assert.ok(index >= 0, "the original owner boundary must remain present")
    const selected = statements.slice(index + 1, index + 1 + count)
    assert.equal(selected.length, count)
    return selected
  }
  const home = after(publicJourneys.get("anonymous homepage presents landing copy and tool discovery rails"),
    (statement) => statement.startsWith("await page.goto("), 3)
  const immersive = after(publicJourneys.get("immersive context changes keep only the displays owned by Chimer, Clock, and hidden Music"),
    (statement) => statement.includes('window.history.pushState({}, "", "/clock?source=music&returnTo=%2Fmusic")'), 2)
  const bootstrap = after(publicJourneys.get("Music visualizer uses the anonymous shell bootstrap without client account discovery"),
    (statement) => statement.startsWith("await page.goto("), 2)
  const preview = previewJourneys.get("presents the product identity across homepage and responsive app bars")
  assert.ok(preview)
  const brandIndex = preview.findIndex((statement) => statement.startsWith("const homeBrand ="))
  assert.ok(brandIndex >= 0)
  const previewBrand = preview.slice(brandIndex, brandIndex + 4)
  assert.equal(previewBrand.length, 4)
  assert.match(preview[brandIndex + 4], /expect\(homeBrand\)\.toHaveScreenshot\("home-product\.png"/)
  assert.match(previewBrand[1], /expect\(homeBrand\)\.toHaveText\(PRODUCT_NAME\)/)
  assert.match(previewBrand[2], /expect\(homeBrand\.locator\("img"\)\)\.toHaveCount\(0\)/)
  assert.match(previewBrand[3], /level: 1, name: PRODUCT_NAME, exact: true.*toHaveCount\(1\)/)
  assert.equal(home.length + immersive.length + bootstrap.length, 7)
  for (const statement of [...home, ...immersive.slice(1), ...bootstrap, previewBrand[0]]) {
    assert.match(statement, /getByRole\(/)
    assert.match(statement, /includeHidden: false/)
    assert.doesNotMatch(statement, /\.first\(|\.nth\(|includeHidden: true/)
  }
  assert.match(immersive[0], /getByRole\("button", \{ name: "Close Background panel" \}\)\.click\(\)/)
  assert.doesNotMatch(immersive[0], /\.first\(|\.nth\(|includeHidden:/)
  assert.match(home[0], /level: 1, name: "AtmoShaper", exact: true/)
  for (const statement of home.slice(1)) assert.match(statement, /level: 2, name: \/AtmoShaper helps\/i/)
  for (const statement of [...immersive.slice(1), ...bootstrap]) {
    assert.match(statement, /getByRole\("region", \{ name: "Music visualizer", exact: true/)
  }
  assert.match(previewBrand[0], /level: 1, name: PRODUCT_NAME, exact: true/)

  const compile = (statements) => {
    const sandbox = { expect: browserExpect.configure({ timeout: 500 }), PRODUCT_NAME: "AtmoShaper" }
    runInNewContext(ts.transpileModule(`async function check(page) { ${statements.join("\n")} }`, {
      compilerOptions: { target: ts.ScriptTarget.ES2022 },
    }).outputText, sandbox)
    return sandbox.check
  }
  const brand = '<h1 data-testid="home-brand-wordmark">AtmoShaper</h1>'
  const flip = '<span data-testid="home-flip-word">therapists</span>'
  const copy = `<h2>AtmoShaper helps ${flip}</h2>`
  const background = '<div data-testid="chimer-premium-background" data-background-id="static-gradient">Background</div>'
  const visualizer = `<section aria-label="Music visualizer">${background}</section>`
  // Model Radix modal ownership: the dialog hides the app stage until its real close action runs.
  const dismissBackground = "document.getElementById('immersive-stage').removeAttribute('aria-hidden');this.closest('[role=dialog]').remove()"
  const modalOwnedStage = (owners, dismissal = dismissBackground) => `<main id="immersive-stage" aria-hidden="true">${owners}<div hidden id="S:0">${visualizer}</div></main><div role="dialog" aria-label="Background"><button aria-label="Close Background panel" onclick="${dismissal}">Close</button></div>`
  const repairedImmersiveSequence = { run: compile(immersive) }
  const originalImmersiveSequence = { run: compile([immersive[1], immersive[0]]) }
  const contracts = [
    { name: "homepage wordmark", statements: [home[0]], html: brand, heading: "h1" },
    { name: "homepage landing heading", statements: [home[1]], html: copy, heading: "h2" },
    { name: "homepage flipword", statements: home.slice(1), html: copy, heading: "h2", child: flip },
    { name: "immersive visualizer", statements: [immersive[1]], html: visualizer },
    { name: "anonymous visualizer", statements: [bootstrap[0]], html: visualizer },
    { name: "anonymous visualizer background", statements: bootstrap, html: visualizer, child: background },
    { name: "preview homepage wordmark", statements: previewBrand, html: brand, heading: "h1" },
  ].map((contract) => ({ ...contract, run: compile(contract.statements) }))
  const browser = await chromium.launch()
  let requests = 0
  const check = async (contract, html, fails = false, nextHtml) => {
    const context = await browser.newContext({ serviceWorkers: "block" })
    try {
      await context.route("**/*", async (route) => { requests += 1; await route.abort() })
      const page = await context.newPage()
      await page.setContent(html)
      const outcome = contract.run(page)
      if (nextHtml !== undefined) {
        // Change the DOM while the assertion is pending; use no timing sleeps.
        await Promise.all([outcome, page.evaluate((content) => {
          document.body.insertAdjacentHTML("afterbegin", content)
        }, nextHtml)])
      } else if (fails) {
        await assert.rejects(outcome, /expect\(locator\)|strict mode violation/)
      } else {
        await outcome
      }
    } finally {
      await context.close()
    }
  }
  try {
    await t.test("immersive modal dismissal restores the exact accessible owner", async (t) => {
      const oneOwner = modalOwnedStage(visualizer)
      await t.test("original assertion-before-dismissal ordering fails", () => check(
        originalImmersiveSequence, oneOwner, true,
      ))
      await t.test("extracted dismissal-before-assertion sequence passes with a hidden stream clone", () => check(
        repairedImmersiveSequence, oneOwner,
      ))
      await t.test("broken modal dismissal cannot expose the owner", () => check(
        repairedImmersiveSequence, modalOwnedStage(visualizer, ""), true,
      ))
      await t.test("dismissal cannot supply a missing owner", () => check(
        repairedImmersiveSequence, modalOwnedStage("<div>Unrelated content</div>"), true,
      ))
      await t.test("dismissal still rejects duplicate accessible owners", () => check(
        repairedImmersiveSequence, modalOwnedStage(visualizer + visualizer), true,
      ))
    })
    for (const contract of contracts) {
      await t.test(contract.name, async (t) => {
        const { html, heading } = contract
        const wrongRole = heading ? html.replaceAll(heading, "p") : html.replaceAll("section", "div")
        for (const [name, content, fails] of [
          ["one accessible owner", html],
          ["hidden stream clone", html + `<div hidden id="S:0">${html}</div>`],
          ["display-none clone", html + `<div style="display:none">${html}</div>`],
          ["aria-hidden clone", html + `<div aria-hidden="true">${html}</div>`],
          ["two accessible owners", html + html, true],
          ["missing owner", "<div>Unrelated content</div>", true],
          ["hidden-only owner", `<div hidden>${html}</div>`, true],
          ["aria-hidden-only owner", `<div aria-hidden="true">${html}</div>`, true],
          ["wrong role", wrongRole, true],
        ]) await t.test(name, () => check(contract, content, fails))
        if (heading) {
          const wrongLevel = html.replaceAll(heading, "h3")
          await t.test("wrong heading level", () => check(contract, wrongLevel, true))
          await t.test("another level cannot make the intended owner ambiguous", () => check(contract, html + wrongLevel))
        }
        if (heading === "h1") {
          await t.test("a duplicate heading without the test ID remains ambiguous", () => check(contract,
            html + html.replace(' data-testid="home-brand-wordmark"', ""), true))
        }
        if (heading !== "h2") {
          await t.test("a longer accessible name cannot replace the exact owner", () => check(contract,
            html.replace(heading ? "AtmoShaper" : "Music visualizer", heading ? "AtmoShaper extra" : "Music visualizer extra"), true))
        }
        if (contract.child) {
          const emptyOwner = html.replace(contract.child, "")
          await t.test("a matching child outside the owner cannot supply evidence", () => check(contract,
            emptyOwner + contract.child, true))
          await t.test("a second accessible owner without the child is still ambiguous", () => check(contract,
            html + emptyOwner, true))
          await t.test("hidden child evidence cannot replace the visible value", () => check(contract,
            emptyOwner + `<div hidden>${html}</div>`, true))
        }
        await t.test("readiness re-resolves from hidden-only to visible plus hidden", () => check(contract,
          `<div hidden id="S:0">${html}</div>`, false, html))
      })
    }
  } finally {
    await browser.close()
    assert.equal(requests, 0, "streaming assertion contracts must remain completely offline")
  }
})
