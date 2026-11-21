import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import * as layout from "../lib/feelings-wheel-layout.js"
import * as reflection from "../lib/wellness-reflection.js"
import { createCompiledModuleLoader, createElement, findElement, findElements, renderFunctionComponents, elementText, passThroughElement } from "./helpers/compiled-module.mjs"

const source = await readFile(new URL("../components/wellness/feelings-wheel.tsx", import.meta.url), "utf8")
const load = createCompiledModuleLoader(import.meta.url)

/** Execute controlled selection and real pointer handlers with inert SVG
 * geometry. Native touch/browser acceptance remains a separate check. */
function wheel() {
  const slots = [], captured = new Set()
  let cursor = 0, selected = [], tree
  const svg = { getScreenCTM: () => null, getBoundingClientRect: () => ({ left: 0, top: 0, width: 600, height: 600 }),
    setPointerCapture: id => captured.add(id), hasPointerCapture: id => captured.has(id), releasePointerCapture: id => captured.delete(id) }
  const react = {
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === "function" ? initial() : initial; return [slots[i], value => { slots[i] = typeof value === "function" ? value(slots[i]) : value }] },
    useRef(initial) { return slots[cursor++] ??= { current: initial } },
    useEffect() {}, useId: () => "fixture-feelings",
  }
  const { FeelingsWheel } = load(source, "feelings-wheel.tsx", {
    react, "react/jsx-runtime": { jsx: createElement, jsxs: createElement },
    "@/components/ui/button": { Button: passThroughElement("button") },
    "@/components/ui/input": { Input: passThroughElement("input") },
    "@/lib/wellness-reflection": reflection, "@/lib/feelings-wheel-layout": layout,
    "./feelings-wheel.module.css": { __esModule: true, default: {} },
  })
  function render() {
    cursor = 0
    tree = renderFunctionComponents(FeelingsWheel({ selected, onChange: value => { selected = value }, disabled: false }))
    findElement(tree, node => node.type === "svg").props.ref.current = svg
  }
  render()
  return {
    selected: () => selected,
    zoom: () => Number(findElement(tree, node => node.type === "svg").props["data-wheel-zoom"]),
    context: () => elementText(findElement(tree, node => node.type === "p" && node.props["aria-live"] === "polite")),
    related: () => findElements(tree, node => node.props["data-related"] === true).length,
    levels: () => findElements(tree, node => node.props["data-feeling-level"] !== undefined).length,
    click(label) { const control = findElement(tree, node => node.type === "button" && (node.props["aria-label"] ?? elementText(node)) === label); assert.ok(control, label); control.props.onClick(); render() },
    choosePath(path) {
      const segment = layout.buildFeelingWheelSegments().find(item => item.path.join("/") === path.join("/"))
      assert.ok(segment)
      findElement(tree, node => node.props["data-feeling-key"] === segment.key).props.onClick({ detail: 0 }); render()
    },
    pointer(type, id, x, y) {
      const node = findElement(tree, element => element.type === "svg")
      node.props[type]({ pointerId: id, pointerType: "touch", button: 0, clientX: x, clientY: y, currentTarget: svg, target: { closest: () => null } })
      render()
    },
  }
}

test("a replacement two-finger pair starts from the current wheel scale", () => {
  const page = wheel()
  page.pointer("onPointerDown", 1, 100, 300); page.pointer("onPointerDown", 2, 200, 300)
  page.pointer("onPointerDown", 3, 500, 300); page.pointer("onPointerUp", 1, 100, 300)
  const before = page.zoom()
  page.pointer("onPointerMove", 2, 201, 300)
  assert.ok(Math.abs(page.zoom() - before) < 0.02)
  page.pointer("onPointerUp", 2, 201, 300); page.pointer("onPointerUp", 3, 500, 300)
  assert.deepEqual(page.selected(), [])
})

test("removing the last feeling clears selected context without removing any word level", () => {
  const page = wheel(), levels = page.levels()
  page.click("Happy"); assert.equal(page.context(), "Happy"); assert.ok(page.related() > 0)
  page.click("Remove feeling Happy")
  assert.deepEqual(page.selected(), [])
  assert.doesNotMatch(page.context(), /Happy/)
  assert.equal(page.related(), 0)
  assert.equal(page.levels(), levels)
})

test("removing the latest of multiple feelings keeps the remaining word's context", () => {
  const page = wheel()
  page.click("Choose multiple feelings"); page.click("Happy"); page.click("Sad")
  page.click("Remove feeling Sad")
  assert.deepEqual(page.selected(), ["Happy"])
  assert.equal(page.context(), "Happy")
})

test("removing another feeling preserves the selected branch of a duplicate word", () => {
  const page = wheel()
  page.click("Choose multiple feelings")
  page.choosePath(["Connected", "Understood", "Accepted"])
  page.click("Sad"); page.click("Remove feeling Sad")
  assert.deepEqual(page.selected(), ["Accepted"])
  assert.equal(page.context(), "Connected › Understood › Accepted")
  assert.ok(page.related() > 0)
})
