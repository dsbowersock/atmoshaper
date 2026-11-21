import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import * as movements from "../lib/rom-movements.js"
import * as wellness from "../lib/client-wellness.js"
import * as comfort from "../lib/movement-comfort.js"
import { createCompiledModuleLoader, createElement, findElement, findElements, renderFunctionComponents, elementText, passThroughElement } from "./helpers/compiled-module.mjs"

const source = await readFile(new URL("../components/wellness/rom-measurement-panel.tsx", import.meta.url), "utf8")
const load = createCompiledModuleLoader(import.meta.url)

/** Execute the real recorder's handlers and primitive-dependent effects. This
 * fixture supplies sensor values, never browser permissions or a clinical record. */
function recorder({ failSave = false } = {}) {
  const slots = [], effects = [], saved = []
  let cursor = 0, dirty = false, tree, beta = 42
  const react = {
    useState(initial) {
      const i = cursor++
      if (!(i in slots)) slots[i] = typeof initial === "function" ? initial() : initial
      return [slots[i], value => {
        const next = typeof value === "function" ? value(slots[i]) : value
        if (!Object.is(next, slots[i])) { slots[i] = next; dirty = true }
      }]
    },
    useRef(initial) { const i = cursor++; return slots[i] ??= { current: initial } },
    useEffect(callback, deps) {
      const i = cursor++, previous = slots[i]
      if (!previous || deps.some((value, index) => !Object.is(value, previous[index]))) {
        slots[i] = deps
        effects.push(callback)
      }
    },
  }
  const modules = {
    react,
    "react/jsx-runtime": { jsx: createElement, jsxs: createElement, Fragment: "fragment" },
    "next/navigation": { unstable_rethrow() {} },
    "lucide-react": Object.fromEntries(["ArrowLeft", "ArrowRight", "Gauge", "RotateCcw", "Save"].map(name => [name, passThroughElement("svg")])),
    "@/components/body/body-joint-viewer": { BodyJointViewer: passThroughElement("body-viewer") },
    "@/hooks/use-device-motion-sensors": { useDeviceMotionSensors: () => ({ orientation: { alpha: 0, beta, gamma: 0 }, state: "active", requestAccess: async () => {} }) },
    "@/lib/client-wellness": wellness,
    "@/lib/rom-movements": movements,
    "@/lib/movement-comfort": comfort,
    "./rom-measurement-panel.module.css": { __esModule: true, default: {} },
  }
  for (const name of ["Button", "Input", "Label", "Textarea"]) {
    modules[`@/components/ui/${name.toLowerCase()}`] = { [name]: passThroughElement(name.toLowerCase()) }
  }
  const { RomMeasurementPanel } = load(source, "rom-measurement-panel.tsx", modules)
  function render() {
    let iterations = 0
    do {
      dirty = false; cursor = 0
      tree = renderFunctionComponents(RomMeasurementPanel({ isSignedIn: true, disabled: false, onMeasurement: async value => {
        if (failSave) throw new Error("Fictional save failure")
        saved.push(value)
      } }))
      for (const element of findElements(tree, node => node.props.ref && typeof node.props.ref === "object")) {
        element.props.ref.current ??= { focus() {} }
      }
      for (const effect of effects.splice(0)) effect()
      assert.ok(++iterations < 12, "recorder effects must settle")
    } while (dirty)
  }
  const button = label => findElement(tree, node => node.type === "button" && elementText(node) === label)
  const field = id => findElement(tree, node => node.props.id === id)
  const api = {
    saved, field, button,
    async click(label) { const control = button(label); assert.ok(control, `control ${label} exists`); assert.notEqual(control.props.disabled, true); await control.props.onClick(); render() },
    change(id, value) { const control = field(id); assert.ok(control, `field ${id} exists`); control.props.onChange({ target: { value } }); render() },
    pick(area, side = "Left") { findElement(tree, node => node.type === "body-viewer").props.onPick(area, side); render() },
    optional(checked) { findElement(tree, node => node.type === "input" && node.props.type === "checkbox").props.onChange({ target: { checked } }); render() },
    reading(value) { beta = value; render() },
  }
  render()
  return api
}

async function selectKnee(page) {
  page.pick("knee")
  await page.click("Choose movement")
  await page.click(movements.ROM_MOVEMENTS.find(item => item.area === "knee").label)
  await page.click("Record this movement")
}

test("a new side starts a new pair of manual angles", async () => {
  const page = recorder(); await selectKnee(page)
  page.change("romManualStart", "20")
  await page.click("Change movement")
  await page.click(movements.ROM_MOVEMENTS.find(item => item.area === "knee").label)
  await page.click("Right")
  await page.click("Record this movement")
  assert.equal(page.field("romManualStart").props.value, "0")
  page.change("romManualEnd", "70")
  await page.click("Save measurement")
  assert.equal(page.saved[0].side, "Right")
  assert.equal(page.saved[0].baselineAngle, 0)
})

test("adding optional comfort keeps a captured phone angle", async () => {
  const page = recorder(); await selectKnee(page)
  await page.click("Use phone readings")
  await page.click("Capture starting reading")
  page.optional(true)
  page.change("romComfortScore", "7")
  page.reading(62)
  await page.click("Save measurement")
  assert.equal(page.saved[0].baselineAngle, 42)
  assert.equal(page.saved[0].endAngle, 62)
  assert.equal(page.saved[0].comfortScore, 7)
})

test("custom centered movements retain an explicit choice of side", async () => {
  const page = recorder(); page.pick("neck", "Center")
  await page.click("Choose movement")
  await page.click(movements.ROM_MOVEMENTS.find(item => item.area === "neck" && !item.mirror).label)
  await page.click("Choose a different movement")
  await page.click("Other movement")
  page.change("romMovement", "Fictional centered movement")
  await page.click("Center")
  await page.click("Record this movement")
  page.change("romManualEnd", "30")
  await page.click("Save measurement")
  assert.equal(page.saved[0].side, "Center")
})

test("a failed save without a context change retains both manual readings", async () => {
  const page = recorder({ failSave: true }); await selectKnee(page)
  page.change("romManualStart", "20"); page.change("romManualEnd", "70")
  await page.click("Save measurement")
  assert.equal(page.field("romManualStart").props.value, "20")
  assert.equal(page.field("romManualEnd").props.value, "70")
})
