import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { describe, it } from "node:test"
import { PUBLIC_PRODUCT_IDENTITY } from "../lib/public-product-identity.js"
import { createCompiledModuleLoader, createElement, elementText, findElement } from "./helpers/compiled-module.mjs"

const source = await readFile(new URL("../app/global-error.tsx", import.meta.url), "utf8")
const loadCompiledModule = createCompiledModuleLoader(import.meta.url)

/** Runs the actual fallback component with explicit render/commit phases and no SDK transport. */
function fallbackFixture({ enabled = false, captureException = () => "invented-event" } = {}) {
  let state = null
  let previousEffectError
  const pendingEffects = []
  const captures = []
  const { default: GlobalError } = loadCompiledModule(source, "global-error.tsx", {
    "@sentry/nextjs": {
      isEnabled: () => enabled,
      captureException: (error) => { captures.push(error); return captureException(error) },
    },
    react: {
      useState: () => [state, (next) => { state = next }],
      useEffect: (effect, [error]) => {
        if (previousEffectError !== error) pendingEffects.push(effect)
        previousEffectError = error
      },
    },
    "react/jsx-runtime": { jsx: createElement, jsxs: createElement },
    "@/lib/public-product-identity": { PUBLIC_PRODUCT_IDENTITY },
  })
  return {
    captures,
    render: (error) => GlobalError({ error }),
    commit: () => { for (const effect of pendingEffects.splice(0)) effect() },
  }
}

/** Reads the actual rendered fallback anchor so reference assertions cover the component's navigation contract. */
function supportHref(tree) {
  return findElement(tree, ({ type }) => type === "a").props.href
}

describe("global error reporting availability", () => {
  it("does not manufacture an error reference or claim capture when Sentry is disabled", () => {
    const fixture = fallbackFixture({ captureException: () => assert.fail("Disabled SDK must not capture") })
    const error = new Error("invented-error")
    fixture.render(error)
    fixture.commit()
    const tree = fixture.render(error)
    assert.deepEqual(fixture.captures, [])
    assert.equal(supportHref(tree), "/support")
    assert.match(elementText(tree), /privacy-safe diagnostic report/)
    assert.doesNotMatch(elementText(tree), /captured for review|Error reference|Sentry reference/)
  })

  it("links an enabled SDK reference without claiming confirmed delivery", () => {
    const fixture = fallbackFixture({ enabled: true, captureException: () => "invented/ref?one" })
    const error = new Error("invented-error")
    fixture.render(error)
    fixture.commit()
    const tree = fixture.render(error)
    assert.deepEqual(fixture.captures, [error])
    assert.equal(supportHref(tree), "/support?eventId=invented%2Fref%3Fone")
    assert.match(elementText(tree), /Error reference: invented\/ref\?one/)
    assert.doesNotMatch(elementText(tree), /captured for review|Sentry reference/)
  })

  it("does not attach a preceding error's reference while a replacement error awaits capture", () => {
    const fixture = fallbackFixture({ enabled: true, captureException: (error) => error.message })
    const first = new Error("invented-first")
    const second = new Error("invented-second")
    fixture.render(first)
    fixture.commit()
    assert.equal(supportHref(fixture.render(first)), "/support?eventId=invented-first")
    const pending = fixture.render(second)
    assert.equal(supportHref(pending), "/support")
    assert.doesNotMatch(elementText(pending), /invented-first/)
    fixture.commit()
    assert.equal(supportHref(fixture.render(second)), "/support?eventId=invented-second")
    assert.deepEqual(fixture.captures, [first, second])
  })

  it("keeps support usable if SDK capture fails", () => {
    const fixture = fallbackFixture({ enabled: true, captureException: () => { throw new Error("invented-sdk-failure") } })
    const error = new Error("invented-error")
    fixture.render(error)
    assert.doesNotThrow(() => fixture.commit())
    const tree = fixture.render(error)
    assert.equal(supportHref(tree), "/support")
    assert.doesNotMatch(elementText(tree), /Error reference|invented-sdk-failure/)
  })
})
