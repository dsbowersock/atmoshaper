import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { runInNewContext } from "node:vm"
import * as movementComfort from "../lib/movement-comfort.js"
import * as reflection from "../lib/wellness-reflection.js"
import * as exerciseRecording from "../lib/exercise-recording.js"
import * as catalog from "../lib/wellness-catalog.js"
import { compileCommonJsModule, createElement, findElement, findElements, renderFunctionComponents, elementText, passThroughElement } from "./helpers/compiled-module.mjs"

const cached = createRequire(import.meta.url)
const { unstable_rethrow } = cached("next/dist/client/components/unstable-rethrow.browser.js")
const { getRedirectError } = cached("next/dist/client/components/redirect.js")
const componentSource = await readFile(new URL("../components/wellness/wellness-hub-client.tsx", import.meta.url), "utf8")
const cardSource = await readFile(new URL("../components/wellness/wellness-entry-card.tsx", import.meta.url), "utf8")
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no }); return { promise, resolve, reject } }
const entry = (id, summary = id) => ({ id, category: "activity", occurredAt: "2026-10-27T12:00:00.000Z", timezone: "America/New_York",
  summary, intensity: 0, regions: [], sensations: [], contexts: [], source: "quick-log", metadata: {},
  createdAt: "2026-10-27T12:00:00.000Z", updatedAt: "2026-10-27T12:00:00.000Z", persisted: true })
const success = (id) => ({ ok: true, data: { entry: entry(id) } })

test("actual quick-log adapter admits Work reflection but excludes hidden feeling and Home care fields", async () => {
  const pending = deferred()
  const page = owner({ create: () => pending.promise })
  page.ack()
  page.form.fields = { category: "work_context", summary: "Fictional task", intensity: "3", "reflection-activity": "Fictional reaching", "reflection-posture": "held position", "reflection-careAction": "hidden home routine", feelingWords: "Hopeful" }
  page.click("Save")
  const metadata = JSON.parse(page.calls[0].args[0].get("metadata"))
  assert.equal(metadata.contextCheckIn.activity, "Fictional reaching")
  assert.equal(metadata.contextCheckIn.posture, "held position")
  assert.equal(metadata.contextCheckIn.careAction, undefined)
  assert.equal(metadata.feelingWords, undefined)
  pending.resolve(success("work-check")); await page.settled()
  assert.equal(page.form.resets, 1)
})

test("Exercise validates before dispatch and keeps the shared privacy, pending and failure owner", async () => {
  const pending = deferred(), page = owner({ initialEntries: [entry("existing")], create: () => pending.promise })
  page.form.fields = { category: "exercise", exerciseRecord: JSON.stringify(exerciseRecording.createExerciseDraft()), summary: "Fictional exercise note", intensity: "9" }
  page.click("Save"); page.render()
  assert.equal(page.calls.length, 0); assert.match(page.status(), /exercise name/)
  const draft = { ...exerciseRecording.createExerciseDraft(), name: "Fictional row", context: "pt", sets: [{ reps: "8", weight: "0.5", holdSeconds: "" }] }
  page.form.fields.exerciseRecord = JSON.stringify(draft)
  page.click("Save"); page.render(); assert.equal(page.calls.length, 0); assert.match(page.status(), /privacy boundary/)
  page.ack(); const click = page.button("Save").props.onClick; const operation = click(); click(); page.render()
  assert.equal(page.calls.length, 1); page.controlsPending(true)
  const sent = page.calls[0].args[0]
  assert.equal(sent.get("intensity"), null)
  assert.deepEqual(JSON.parse(sent.get("metadata")).exerciseRecord.sets, [{ reps: 8, weight: 0.5 }])
  pending.resolve({ ok: false, reason: "invalid-exercise-recording" }); await operation; await page.settled()
  assert.equal(page.form.resets, 0); assert.equal(page.form.fields.exerciseRecord, JSON.stringify(draft)); page.controlsPending(false)
})

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
    // Navigation/focus effects are verified in the real-browser suite; action ownership stays inert here.
    useEffect: () => {}, useLayoutEffect: () => {},
    useSyncExternalStore: (_subscribe, snapshot) => snapshot(),
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
    "lucide-react": Object.fromEntries(["Activity", "ArrowLeft", "BarChart3", "BriefcaseBusiness", "CalendarDays", "Clock3", "Download", "Dumbbell", "HeartPulse", "Leaf", "Moon", "MoveUpRight", "Radio", "Save", "Smile", "Trash2", "TriangleAlert", "Wind"].map((name) => [name, passThroughElement("svg")])),
    "@/app/wellness/actions": {
      createClientWellnessEntryAction: action("create", create), deleteClientWellnessEntryAction: action("delete", remove),
      exportClientWellnessEntriesAction: action("export", exportAction),
    },
    "@/components/wellness/body-region-selector": { BodyRegionSelector: passThroughElement("regions"), BODY_REGION_OPTIONS: [] },
    "@/components/wellness/rom-measurement-panel": { RomMeasurementPanel: passThroughElement("rom-panel") },
    "@/lib/rom-movements": { ROM_MOVEMENTS: [] },
    "@/lib/movement-comfort": movementComfort,
    "@/lib/wellness-reflection": reflection,
    "@/lib/exercise-recording": exerciseRecording,
    "@/lib/wellness-catalog": catalog,
    "./exercise-recorder": { ExerciseRecorder: passThroughElement("exercise-recorder") },
    "./exercise-history": { ExerciseHistory: passThroughElement("exercise-history"), ExerciseDetails: passThroughElement("exercise-details") },
    "./feelings-wheel": { FeelingsWheel: passThroughElement("feelings-wheel") },
    "./context-reflection": { ContextReflection: passThroughElement("context-reflection") },
    "./activity-recording.module.css": { __esModule: true, default: { form: "activity-form", privacy: "activity-privacy" } },
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
  const card = { exports: {} }
  runInNewContext(compileCommonJsModule(cardSource,"wellness-entry-card.tsx"), {
    exports:card.exports, module:card, require(name) { assert.ok(Object.hasOwn(modules,name)); return modules[name] }, Intl,
  }, {timeout:1000})
  modules["./wellness-entry-card"] = card.exports
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
    // Action ownership is independent of the visible category-specific caption.
    const found = findElement(rendered, (node) => node.type === "button" && ((label === "Save" || label === "Practice") ? node.props["data-activity-save"] !== undefined : (node.props["aria-label"] ?? elementText(node)) === label))
    assert.ok(found, "expected ordinary control exists"); return found
  }
  render()
  return {
    calls, caught, form, downloads, render, button,
    status: () => { const node = findElement(rendered, (value) => value.props.role === "status"); return node ? elementText(node) : "" },
    text: () => elementText(rendered),
    rom: (focus = "range") => findElement(rendered, (node) => node.type === "rom-panel" && node.props.focus === focus),
    report: () => findElement(rendered, (node) => node.type === "pattern-report").props.entries,
    ack(value = true) { findElement(rendered, (node) => node.type === "checkbox").props.onCheckedChange(value); render() },
    click(label) { return track(button(label).props.onClick()) },
    measure(draft) { return track(this.rom().props.onMeasurement(draft)) },
    async flush() { for (let i = 0; i < 8; i++) await Promise.resolve(); render() },
    async settled() { await Promise.all(tasks); render() },
    controlsPending(value) {
      assert.equal(button(signedIn ? "Save" : "Practice").props.disabled, value)
      for (const panel of findElements(rendered, (node) => node.type === "rom-panel")) assert.equal(panel.props.disabled, value)
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

test("pending Save blocks both staged delete and export confirmation handlers", async () => {
  const result = deferred(), hub = owner({ initialEntries: [entry("existing")], create: () => result.promise })
  hub.ack(); hub.click("Delete entry"); hub.render(); hub.click("Export"); hub.render()
  const confirmDelete = hub.button("Confirm delete entry").props.onClick, confirmExport = hub.button("Confirm").props.onClick
  assert.deepEqual(hub.calls, [])
  hub.click("Save")
  // Invoke retained handlers before disabled controls render to exercise the shared ref lock.
  confirmDelete(); confirmExport(); hub.render()
  assert.deepEqual(hub.calls.map(({ kind }) => kind), ["create"])
  assert.equal(hub.status(), "Working..."); hub.controlsPending(true)
  assert.equal(hub.button("Confirm delete entry").props.disabled, true)
  assert.equal(hub.report().length, 1); assert.equal(hub.form.resets, 0); assert.deepEqual(hub.downloads, [])
  result.resolve(success("saved")); await hub.settled()
  assert.deepEqual(hub.calls.map(({ kind }) => kind), ["create"])
  assert.equal(hub.status(), "Saved to your client-owned wellness timeline."); hub.controlsPending(false)
  assert.equal(hub.button("Confirm delete entry").props.disabled, false)
  assert.equal(hub.report().length, 2); assert.equal(hub.form.resets, 1); assert.deepEqual(hub.caught, [])
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
test("comfort uses the shared privacy/pending owner without fabricating an angle", async () => {
  const result = deferred(), hub = owner({ create: () => result.promise })
  const draft = { movement: "Forearm pronation", side: "Left", comfortScore: 0, source: "manual", note: "Fictional comfort" }
  hub.measure(draft); hub.render()
  assert.equal(hub.calls.length, 0)
  assert.match(hub.status(), /privacy boundary/)
  hub.ack(); hub.measure(draft); hub.measure(romDraft); hub.render()
  assert.equal(hub.calls.length, 1); hub.controlsPending(true)
  const sent = JSON.parse(hub.calls[0].args[0].get("metadata"))
  assert.equal(sent.recordingKind, "comfort"); assert.equal(sent.comfortScore, 0)
  assert.equal(Object.hasOwn(sent, "changeDegrees"), false)
  result.resolve({ ok: false, reason: "save-failed" }); await hub.settled()
  assert.equal(hub.status(), "Could not save this movement check-in."); hub.controlsPending(false)
})
test("comfort practice and combined submissions retain separate rating and degree meanings", async () => {
  const practice = owner({ signedIn: false })
  const draft = { movement: "Cervical rotation", side: "Left", comfortScore: 10, source: "manual", note: "Fictional comfortable movement" }
  practice.measure(draft); practice.render()
  assert.equal(practice.calls.length, 0)
  assert.equal(practice.report()[0].intensity, null)
  assert.equal(practice.report()[0].metadata.comfortScore, 10)
  const hub = owner({ create: async () => success("combined") })
  hub.ack(); hub.measure({ ...romDraft, comfortScore: 6 }); await hub.settled()
  const sent = JSON.parse(hub.calls[0].args[0].get("metadata"))
  assert.equal(sent.recordingKind, "both"); assert.equal(sent.changeDegrees, 1); assert.equal(sent.comfortScore, 6)
})
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
