import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import * as THREE from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import * as movements from "../lib/rom-movements.js"
import * as framing from "../lib/body-view-framing.js"
import * as surfaces from "../lib/body-surface-regions.js"
import { createCompiledModuleLoader, createElement } from "./helpers/compiled-module.mjs"

const source = await readFile(new URL("../components/body/body-joint-scene.tsx", import.meta.url), "utf8")
const asset = await readFile(new URL("../public/body-models/human-base-rigged.glb", import.meta.url))
const load = createCompiledModuleLoader(import.meta.url)

/** Real Three math and the checked-in rig execute; only GPU, RAF, input and
 * asset transport are inert. Node globals are restored before the next case. */
async function sceneFixture(extra = {}, { deferPlaybackStop = false } = {}) {
  const originals = new Map(), frames = new Map(), listeners = new Map(), documentListeners = new Map()
  const slots = [], effects = [], cleanups = [], picks = []
  let cursor = 0, frameId = 0, resize, renderedScene, renderedCamera, readyResolve, ended = 0
  const ready = new Promise(resolve => { readyResolve = resolve })
  const canvas = { style: {}, setAttribute() {}, remove() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 640, height: 640 }),
    addEventListener: (type, callback) => listeners.set(type, callback),
    removeEventListener: type => listeners.delete(type) }
  const container = { clientWidth: 640, clientHeight: 640, appendChild() {} }
  const fakeDocument = { hidden: false, addEventListener: (type, callback) => documentListeners.set(type, callback), removeEventListener: type => documentListeners.delete(type) }
  for (const [name, value] of Object.entries({
    window: { devicePixelRatio: 1 }, document: fakeDocument,
    requestAnimationFrame: callback => { frames.set(++frameId, callback); return frameId },
    cancelAnimationFrame: id => frames.delete(id),
    ResizeObserver: class { constructor(callback) { resize = callback } observe() { resize() } disconnect() {} },
    fetch: async () => ({ ok: true, arrayBuffer: async () => asset.buffer.slice(asset.byteOffset, asset.byteOffset + asset.byteLength) }),
  })) { originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name)); Object.defineProperty(globalThis, name, { configurable: true, writable: true, value }) }
  const react = {
    useRef(initial) { return slots[cursor++] ??= { current: initial } },
    useEffect(callback, deps) {
      const i = cursor++, previous = slots[i]
      if (!previous || deps.some((value, index) => !Object.is(value, previous[index]))) { slots[i] = deps; effects.push(callback) }
    },
  }
  class Renderer {
    constructor() { this.domElement = canvas }
    setPixelRatio() {} setClearColor() {} setSize() {} dispose() {} forceContextLoss() {}
    render(scene, camera) { scene.updateMatrixWorld(true); camera.updateMatrixWorld(true); renderedScene = scene; renderedCamera = camera }
  }
  class Controls {
    constructor(camera) { this.target = new THREE.Vector3(); this.camera = camera }
    update() { this.camera.lookAt(this.target); this.camera.updateMatrixWorld(true) }
    addEventListener() {} removeEventListener() {} dispose() {}
  }
  const { default: Scene } = load(source, "body-joint-scene.tsx", {
    react, "react/jsx-runtime": { jsx: createElement, jsxs: createElement },
    three: { ...THREE, WebGLRenderer: Renderer },
    "three/addons/loaders/GLTFLoader.js": { GLTFLoader },
    "three/addons/controls/OrbitControls.js": { OrbitControls: Controls },
    "@/lib/rom-movements": movements, "@/lib/body-view-framing": framing,
    "@/lib/body-surface-regions": surfaces,
  })
  let props = { area: null, side: "Left", playing: false, endPose: false, view: "front", rotate: false, resetKey: 0,
    onPick: (...args) => picks.push(args), onReady: state => readyResolve(state),
    onPlaybackEnd: () => { ended++; if (!deferPlaybackStop) update({ playing: false }) }, ...extra }
  function update(patch = {}) {
    props = { ...props, ...patch }; cursor = 0
    const element = Scene(props)
    element.props.ref.current = container
    for (const effect of effects.splice(0)) { const cleanup = effect(); if (cleanup) cleanups.push(cleanup) }
  }
  function dispose() {
    try { for (const cleanup of cleanups.reverse()) cleanup() }
    finally { for (const [name, descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name] } }
  }
  try { update(); assert.equal(await ready, "ready") } catch (error) { dispose(); throw error }
  return { picks, update, dispose, resize: () => resize(), ends: () => ended,
    tick(now) { const work = [...frames.values()]; frames.clear(); for (const callback of work) callback(now) },
    hide() { fakeDocument.hidden = true; documentListeners.get("visibilitychange")() },
    show() { fakeDocument.hidden = false; documentListeners.get("visibilitychange")() },
    bone(name) { return renderedScene.getObjectByName(name).quaternion.clone() },
    markerPoint() {
      const marker = renderedScene.children.find(node => node.geometry?.type === "SphereGeometry" && node.visible)
      assert.ok(marker, "a named joint has a visible marker")
      const point = marker.position.clone().project(renderedCamera)
      return { clientX: (point.x + 1) * 320, clientY: (1 - point.y) * 320 }
    },
    pointer(type, id, point) { listeners.get(type)?.({ pointerId: id, pointerType: "touch", button: 0, ...point }) },
  }
}

test("hidden time does not consume the resumed movement demonstration", async () => {
  const fixture = await sceneFixture({ movement: movements.ROM_MOVEMENTS.find(item => item.area === "knee"), playing: true })
  try {
    fixture.tick(0); fixture.tick(1000); fixture.hide(); fixture.tick(11000)
    assert.equal(fixture.ends(), 1)
    fixture.show(); fixture.update({ playing: true }); fixture.tick(12000)
    assert.equal(fixture.ends(), 1, "resume must not immediately finish from hidden-tab elapsed time")
  } finally { fixture.dispose() }
})

test("resizing a paused scene keeps its displayed joint pose", async () => {
  const movement = movements.ROM_MOVEMENTS.find(item => item.area === "knee")
  const fixture = await sceneFixture({ movement, playing: true })
  try {
    fixture.tick(0); fixture.tick(1000); fixture.update({ playing: false }); fixture.tick(1000)
    const before = fixture.bone(movements.romBoneName("knee", "Left"))
    fixture.resize(); fixture.tick(1500)
    assert.ok(before.angleTo(fixture.bone(movements.romBoneName("knee", "Left"))) < 1e-6)
  } finally { fixture.dispose() }
})

test("hidden playback stops locally before a deferred parent effect can run", async () => {
  const fixture = await sceneFixture({ movement: movements.ROM_MOVEMENTS.find(item => item.area === "knee"), playing: true }, { deferPlaybackStop: true })
  try {
    fixture.tick(0); fixture.tick(1000); fixture.hide()
    fixture.resize(); fixture.tick(2000); fixture.tick(11000)
    assert.equal(fixture.ends(), 1)
    fixture.show()
    fixture.update({ playing: false }); fixture.tick(11000)
    fixture.update({ playing: true }); fixture.tick(12000)
    assert.equal(fixture.ends(), 1)
  } finally { fixture.dispose() }
})

test("a stationary finger cannot select a marker when a two-finger gesture ends", async () => {
  const fixture = await sceneFixture()
  try {
    fixture.tick(0)
    const point = fixture.markerPoint()
    fixture.pointer("pointerdown", 1, { ...point, clientX: point.clientX + 100 })
    fixture.pointer("pointerdown", 2, point)
    fixture.pointer("pointerup", 2, point)
    fixture.pointer("pointerup", 1, { ...point, clientX: point.clientX + 130 })
    assert.equal(fixture.picks.length, 0)
    fixture.pointer("pointerdown", 3, point); fixture.pointer("pointerup", 3, point)
    assert.equal(fixture.picks.length, 1, "a later single-finger tap remains available")
  } finally { fixture.dispose() }
})

test("cancellation and lost capture cannot finish a later tap", async () => {
  const fixture = await sceneFixture()
  try {
    fixture.tick(0)
    const point = fixture.markerPoint()
    for (const type of ["pointercancel", "lostpointercapture"]) {
      fixture.pointer("pointerdown", 1, point); fixture.pointer(type, 1, point); fixture.pointer("pointerup", 1, point)
      assert.equal(fixture.picks.length, 0)
    }
    fixture.pointer("pointerdown", 2, point); fixture.pointer("pointerup", 2, point)
    assert.equal(fixture.picks.length, 1)
  } finally { fixture.dispose() }
})
