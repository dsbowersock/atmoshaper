import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { runInNewContext } from "node:vm"
import { compileCommonJsModule, createElement, findElement, findElements, renderFunctionComponents, elementText, passThroughElement } from "./helpers/compiled-module.mjs"

const cached = createRequire(import.meta.url)
const { unstable_rethrow } = cached("next/dist/client/components/unstable-rethrow.browser.js")
const { getRedirectError } = cached("next/dist/client/components/redirect.js")
const componentSource = await readFile(new URL("../components/wellness/wellness-hub-client.tsx", import.meta.url), "utf8")
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no }); return { promise, resolve, reject } }
const entry = (id, summary = id) => ({ id, category: "activity", occurredAt: "2026-10-27T12:00:00.000Z", timezone: "America/New_York",
  summary, intensity: 0, regions: [], sensations: [], contexts: [], source: "quick-log", metadata: {},
  createdAt: "2026-10-27T12:00:00.000Z", updatedAt: "2026-10-27T12:00:00.000Z", persisted: true })
const success = (id) => ({ ok: true, data: { entry: entry(id) } })

/** Only browser FormData construction is replaced; the real payload/handler functions execute. */
class InertFormData {
  constructor(form) { this.values = new Map(Object.entries(form?.fields ?? {}).map(([key, value]) => [key, [value]])) }
  get(key) { return this.values.get(key)?.[0] ?? null }
  getAll(key) { return this.values.get(key) ?? [] }
  set(key, value) { this.values.set(key, [value]) }
  append(key, value) { this.values.set(key, [...this.getAll(key), value]) }
  delete(key) { this.values.delete(key) }
}

/** Execute the actual component with persistent inert hooks and explicit action/UI boundaries.
 * A held transition models the observed mask; it does not emulate or prove Next queue behavior. */
function owner({ signedIn = true, initialEntries = [], create, remove, exportAction } = {}) {
  const slots = [], calls = [], caught = [], tasks = [], downloads = []
  let cursor = 0, transitionPending = false, rendered
  const form = { fields: { category: "activity", intensity: "0", summary: "First neutral entry", occurredAt: "" },
    resets: 0, reset() { this.resets++ } }
  const track = (value) => {
    if (value && typeof value.then === "function") tasks.push(Promise.resolve(value).catch((error) => { caught.push(error) }))
    return value
  }
  const react = {
    useState(initial) {
      const index = cursor++
      if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial
      return [slots[index], (value) => { slots[index] = typeof value === "function" ? value(slots[index]) : value }]
    },
    useRef(initial) { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index] },
    useMemo: (callback) => callback(),
    useTransition: () => [transitionPending, (callback) => { transitionPending = true; track(callback()) }],
  }
  const action = (kind, callback) => (...args) => {
    calls.push({ kind, args })
    return callback ? callback(...args) : Promise.resolve({ ok: false, reason: "save-failed" })
  }
  const modules = {
    react, "react/jsx-runtime": { jsx: createElement, jsxs: createElement, Fragment: "fragment" },
    "next/link": { __esModule: true, default: passThroughElement("a") },
    "next/navigation": { unstable_rethrow },
    "lucide-react": Object.fromEntries(["Download", "Save", "Trash2"].map((name) => [name, passThroughElement("svg")])),
    "@/app/wellness/actions": {
      createClientWellnessEntryAction: action("create", create), deleteClientWellnessEntryAction: action("delete", remove),
      exportClientWellnessEntriesAction: action("export", exportAction),
    },
    "@/components/wellness/body-region-selector": { BodyRegionSelector: passThroughElement("regions"), BODY_REGION_OPTIONS: [] },
    "@/components/wellness/rom-measurement-panel": { RomMeasurementPanel: passThroughElement("rom-panel") },
    "@/components/wellness/wellness-calendar-companion": { WellnessCalendarCompanion: passThroughElement("calendar-companion") },
    "@/components/wellness/wellness-pattern-report": { WellnessPatternReport: passThroughElement("pattern-report") },
    "@/lib/client-wellness": { CLIENT_WELLNESS_CATEGORIES: ["activity", "rom"] },
    "@/lib/utils": { cn: (...values) => values.filter(Boolean).join(" ") },
  }
  for (const [name, tag] of [["badge", "span"], ["button", "button"], ["checkbox", "checkbox"], ["input", "input"], ["label", "label"], ["textarea", "textarea"]]) {
    const exported = name[0].toUpperCase() + name.slice(1)
    modules[`@/components/ui/${name}`] = { [exported]: passThroughElement(tag) }
  }
  const record = { exports: {} }
  runInNewContext(compileCommonJsModule(componentSource, "wellness-hub-owner-inert.tsx"), {
    exports: record.exports, module: record, require(name) { assert.ok(Object.hasOwn(modules, name)); return modules[name] },
    FormData: InertFormData, Intl, Blob,
    URL: { createObjectURL: () => "blob:invented", revokeObjectURL: () => {} },
    document: { createElement: () => ({ click() { downloads.push(true) } }) },
  }, { timeout: 1000 })
  function render() {
    cursor = 0
    const raw = record.exports.WellnessHubClient({ isSignedIn: signedIn, displayName: null, initialEntries,
      initialReportEntries: initialEntries, appointments: [], reminderSchedules: [] })
    findElement(raw, (node) => node.type === "form").props.ref.current = form
    rendered = renderFunctionComponents(raw)
    return rendered
  }
  const button = (label) => {
    const found = findElement(rendered, (node) => node.type === "button" && (node.props["aria-label"] ?? elementText(node)) === label)
    assert.ok(found, "expected ordinary control exists"); return found
  }
  render()
  return {
    calls, caught, form, downloads, render, button,
    status: () => { const node = findElement(rendered, (value) => value.props.role === "status"); return node ? elementText(node) : "" },
    text: () => elementText(rendered),
    rom: () => findElement(rendered, (node) => node.type === "rom-panel"),
    report: () => findElement(rendered, (node) => node.type === "pattern-report").props.entries,
    ack(value = true) { findElement(rendered, (node) => node.type === "checkbox").props.onCheckedChange(value); render() },
    click(label) { return track(button(label).props.onClick()) },
    measure(draft) { return track(this.rom().props.onMeasurement(draft)) },
    async flush() { for (let i = 0; i < 8; i++) await Promise.resolve(); render() },
    async settled() { await Promise.all(tasks); render() },
    controlsPending(value) {
      assert.equal(button(signedIn ? "Save" : "Practice").props.disabled, value)
      assert.equal(this.rom().props.disabled, value)
      if (signedIn) assert.equal(button(findElements(rendered, (node) => node.type === "button" && elementText(node) === "Confirm").length ? "Confirm" : "Export").props.disabled, value)
    },
  }
}

test("actual handler completes its owned promise while a controlled transition stays pending", async () => {
  const result = deferred(), hub = owner({ create: () => result.promise })
  hub.ack(); hub.click("Save"); hub.render()
  assert.equal(hub.status(), "Working..."); hub.controlsPending(true)
  result.resolve(success("first")); await hub.settled()
  assert.equal(hub.status(), "Saved to your client-owned wellness timeline.")
  assert.ok(hub.text().includes("first")); hub.controlsPending(false); assert.equal(hub.form.resets, 1)
})

test("synchronous duplicate lock and a withheld second action cannot fake continued use", async () => {
  const first = deferred(), second = deferred(); let count = 0
  const hub = owner({ create: () => (++count === 1 ? first.promise : second.promise) })
  hub.ack(); const click = hub.button("Save").props.onClick
  click(); click(); hub.render()
  assert.equal(hub.calls.length, 1); hub.controlsPending(true)
  first.resolve(success("first")); await hub.flush(); hub.controlsPending(false)
  hub.form.fields.summary = "Second neutral entry"; hub.click("Save"); hub.render()
  assert.equal(hub.calls.length, 2); assert.equal(hub.status(), "Working..."); hub.controlsPending(true)
  assert.equal(hub.text().includes("second"), false)
  second.resolve(success("second")); await hub.settled()
  assert.equal(hub.status(), "Saved to your client-owned wellness timeline."); hub.controlsPending(false)
  assert.equal(hub.report().length, 2); assert.equal(hub.form.resets, 2)
})

test("rejected, non-ok and invalid normalized replies preserve input and recover through a real next handler call", async () => {
  for (const reply of [() => Promise.reject(new Error("PRIVATE_ACTION_ERROR")), () => Promise.resolve({ ok: false, reason: "save-failed" }),
    () => Promise.resolve(null), () => Promise.resolve({ ok: true, data: { entry: {} } })]) {
    let count = 0
    const hub = owner({ create: () => ++count === 1 ? reply() : Promise.resolve(success("recovered")) })
    hub.ack(); hub.click("Save"); await hub.settled()
    assert.equal(hub.status(), "Could not save this entry."); hub.controlsPending(false)
    assert.equal(hub.form.resets, 0); assert.equal(hub.form.fields.summary, "First neutral entry")
    assert.equal(hub.report().length, 0); assert.equal(hub.status().includes("PRIVATE"), false); assert.deepEqual(hub.caught, [])
    hub.click("Save"); await hub.settled()
    assert.equal(hub.status(), "Saved to your client-owned wellness timeline."); assert.equal(hub.form.resets, 1)
  }
})

const romDraft = { movement: "Cervical rotation", side: "Left", axis: "beta", baselineAngle: 0, endAngle: 1, changeDegrees: 1, source: "manual", note: "Neutral ROM" }
test("actual ROM handler shares the lock and never calls normalized-null data Saved", async () => {
  const result = deferred(), hub = owner({ create: () => result.promise })
  hub.ack(); hub.measure(romDraft); hub.click("Save"); hub.render()
  assert.equal(hub.calls.length, 1); assert.equal(hub.calls[0].args[0].get("category"), "rom"); hub.controlsPending(true)
  result.resolve({ ok: true, data: { entry: {} } }); await hub.settled()
  assert.equal(hub.status(), "Could not save this ROM measurement."); hub.controlsPending(false)
  assert.equal(hub.form.resets, 0); assert.equal(hub.report().length, 0)
})

test("actual delete/export confirmation paths own pending and always recover after rejection", async () => {
  const removed = deferred(), exported = deferred()
  const hub = owner({ initialEntries: [entry("existing")], remove: () => removed.promise, exportAction: () => exported.promise })
  hub.click("Delete entry"); hub.render(); assert.equal(hub.calls.length, 0)
  hub.click("Confirm delete entry"); hub.render(); hub.controlsPending(true)
  removed.resolve({ ok: true }); await hub.settled()
  assert.equal(hub.status(), "Entry deleted from your wellness timeline."); assert.equal(hub.report().length, 0); hub.controlsPending(false)
  hub.click("Export"); hub.render(); assert.equal(hub.calls.length, 1)
  hub.click("Confirm"); hub.render(); hub.controlsPending(true)
  exported.reject(new Error("PRIVATE_EXPORT_ERROR")); await hub.settled()
  assert.equal(hub.status(), "Could not export wellness entries."); hub.controlsPending(false)
  assert.deepEqual(hub.downloads, []); assert.deepEqual(hub.caught, [])
})

test("ROM rejected promise recovers without resetting Quick log input or changing its payload owner", async () => {
  let count = 0
  const hub = owner({ create: () => ++count === 1 ? Promise.reject(new Error("PRIVATE_ROM_ERROR")) : Promise.resolve(success("rom-recovered")) })
  hub.ack(); hub.measure(romDraft); await hub.settled()
  assert.equal(hub.status(), "Could not save this ROM measurement."); hub.controlsPending(false)
  assert.equal(hub.form.resets, 0); assert.equal(hub.form.fields.summary, "First neutral entry")
  hub.measure(romDraft); await hub.settled()
  assert.equal(hub.status(), "ROM measurement saved to your wellness timeline."); assert.equal(hub.report().length, 1)
  assert.equal(hub.calls[1].args[0].get("source"), "manual"); assert.equal(hub.calls[1].args[0].get("summary"), "Neutral ROM")
  assert.equal(hub.form.resets, 0); assert.deepEqual(hub.caught, [])
})

test("delete rejection or non-ok keeps confirmation and the entry until a valid recovery", async () => {
  for (const fail of [() => Promise.reject(new Error("PRIVATE_DELETE_ERROR")), () => Promise.resolve({ ok: false, reason: "delete-failed" })]) {
    let count = 0
    const hub = owner({ initialEntries: [entry("existing")], remove: () => ++count === 1 ? fail() : Promise.resolve({ ok: true }) })
    hub.click("Delete entry"); hub.render(); hub.click("Confirm delete entry"); await hub.settled()
    assert.equal(hub.status(), "Could not delete this entry."); assert.equal(hub.report().length, 1); hub.controlsPending(false)
    hub.click("Confirm delete entry"); await hub.settled()
    assert.equal(hub.report().length, 0); assert.equal(hub.status(), "Entry deleted from your wellness timeline.")
    assert.deepEqual(hub.caught, [])
  }
})

test("valid export retains browser-only download and resets its ordinary confirmation", async () => {
  const hub = owner({ exportAction: () => Promise.resolve({ ok: true, data: { entries: [entry("exported")], filename: "invented.json", exportedAt: "2026-10-27" } }) })
  hub.click("Export"); hub.render(); hub.click("Confirm"); await hub.settled()
  assert.equal(hub.status(), "Export prepared in your browser."); hub.controlsPending(false)
  assert.equal(hub.downloads.length, 1); assert.equal(hub.button("Export").props.disabled, false); assert.deepEqual(hub.caught, [])
})

test("practice and acknowledgment branches retain their local/privacy boundary", async () => {
  const hub = owner()
  hub.click("Save"); hub.render()
  assert.equal(hub.status(), "Acknowledge the self-tracking privacy boundary before saving."); assert.equal(hub.calls.length, 0)
  hub.controlsPending(false)
  const practice = owner({ signedIn: false })
  practice.click("Practice"); practice.render()
  assert.equal(practice.calls.length, 0); assert.equal(practice.form.resets, 1)
  assert.equal(practice.status(), "Practice entry added for this page session. Sign in before saving anything permanently.")
})

test("installed Next control-signal owner rethrows original identity through finally without fake success", async () => {
  const signal = getRedirectError("/inert", "push")
  const hub = owner({ create: () => Promise.reject(signal) })
  hub.ack(); hub.click("Save"); await hub.settled()
  assert.equal(hub.caught[0], signal); assert.equal(hub.form.resets, 0); assert.equal(hub.report().length, 0)
  assert.notEqual(hub.status(), "Saved to your client-owned wellness timeline."); hub.controlsPending(false)
})
