import test, { before } from "node:test"
import assert from "node:assert/strict"
import { readFile, mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium, expect } from "@playwright/test"
import { defaultOfflineCoreState, startOfflineTimer } from "../lib/offline-core.js"
import { importLegacyNativeClock } from "../lib/native-clock-state.js"
import { createDefaultAtmosphereStorage, ATMOSPHERE_STORAGE_KEY } from "../lib/atmosphere/storage.js"
import { PDFDocument } from "pdf-lib"
import { offlineAudioCatalog } from "../lib/offline-media.js"
import { buildOfflineCore } from "../scripts/build-offline-core.mjs"

const root = fileURLToPath(new URL("..", import.meta.url))
const core = path.join(root, "output/offline-acceptance-website/core")
const entry = "https://appassets.androidplatform.net/assets/core/index.html"
const output = path.join(root, "output/native-website-preview")
const mime = { ".html":"text/html", ".js":"text/javascript", ".css":"text/css", ".png":"image/png", ".svg":"image/svg+xml", ".jpg":"image/jpeg", ".woff2":"font/woff2", ".ttf":"font/ttf" }

// Fresh checkouts need no Android SDK or prebuilt output, and a concurrent APK
// build cannot replace the files being read by this browser's asset loader.
before(async()=>{await buildOfflineCore({outputName:"offline-acceptance-website"})},{timeout:180000})

/** Uses the exact normal APK asset tree in a cold, network-disabled context. */
async function fixture({ allowMedia = false } = {}) {
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport:{width:390,height:844}, reducedMotion:"reduce", serviceWorkers:"block" })
  const errors = [], foreign = []
  await context.setOffline(!allowMedia)
  await context.route("**/*", async route => {
    const url = new URL(route.request().url())
    if (allowMedia && url.origin === "https://media.atmoshaper.com") {
      if (await page.evaluate(()=>navigator.onLine).catch(()=>true)) return route.continue()
      foreign.push(url.href);return route.abort()
    }
    if (url.origin !== "https://appassets.androidplatform.net" || !url.pathname.startsWith("/assets/core/")) { foreign.push(url.href); return route.abort() }
    if (url.pathname.endsWith("seed.html")) return route.fulfill({contentType:"text/html",body:"Synthetic upgrade fixture"})
    const filename = path.resolve(core, decodeURIComponent(url.pathname.slice("/assets/core/".length)))
    assert.ok(filename.startsWith(core + path.sep))
    await route.fulfill({ body:await readFile(filename), contentType:mime[path.extname(filename)]??"application/octet-stream" })
  })
  const page = await context.newPage()
  page.on("pageerror", error => errors.push(error.message))
  return { browser, context, page, errors, foreign, close:async()=>{await context.close();await browser.close()} }
}

async function go(page, route) {
  await page.evaluate(route => window.dispatchEvent(new CustomEvent("atmoshaper:native-navigation",{detail:route})), route)
}
async function readDatabase(page, name, store, key) {
  return page.evaluate(({name,store,key}) => new Promise((resolve,reject)=>{
    const open = indexedDB.open(name)
    open.onsuccess=()=>{const db=open.result,request=db.transaction(store).objectStore(store).get(key);request.onsuccess=()=>{db.close();resolve(request.result)};request.onerror=()=>reject(request.error)}
    open.onerror=()=>reject(open.error)
  }), {name,store,key})
}

test("the packaged Clock exporter reads only appearance and leaves both generations intact", {timeout:60000}, async () => {
  const f = await fixture()
  const { page } = f
  const shared = "atmoshaper.android.chimer-runtime.v1"
  const earlier = "atmoshaper.android.offline-core.v1"
  const exporter = new URL("clock-appearance-export.html", entry).href
  const seed = new URL("seed.html", entry).href
  await page.addInitScript(() => {
    window.AtmoShaperClockAppearance = { postMessage: value => { window.clockAppearance = value } }
  })
  async function exported() {
    await page.goto(exporter)
    await page.waitForFunction(() => typeof window.clockAppearance === "string")
    const payload = await page.evaluate(() => window.clockAppearance)
    return payload === "unavailable" ? payload : JSON.parse(payload)
  }
  async function write(name, store, key, value) {
    await page.goto(seed)
    await page.evaluate(({ name, store, key, value }) => new Promise((resolve, reject) => {
      const open = indexedDB.open(name, 1)
      open.onupgradeneeded = () => open.result.createObjectStore(store)
      open.onerror = () => reject(open.error)
      open.onsuccess = () => {
        const db = open.result
        const transaction = db.transaction(store, "readwrite")
        transaction.objectStore(store).put(value, key)
        transaction.oncomplete = () => { db.close(); resolve() }
        transaction.onerror = () => reject(transaction.error)
      }
    }), { name, store, key, value })
  }
  try {
    assert.equal((await exported()).font, "digital")
    assert.deepEqual(await page.evaluate(async () => await indexedDB.databases()), [])

    const simple = { version: 1, timeFormat: "24h", showSeconds: true, mainColor: "#112233", motion: false,
      backgroundId: "solid-color", timer: { endsAt: 987654321 } }
    await page.evaluate(({ earlier, simple }) => localStorage.setItem(earlier, JSON.stringify(simple)), { earlier, simple })
    const prototype = await exported()
    assert.equal(prototype.format, "24h")
    assert.equal(prototype.seconds, true)
    assert.equal(prototype.firstColor, "#112233")
    assert.equal(prototype.background, "solid-color")
    assert.equal(prototype.motion, false)
    assert.equal("timer" in prototype, false)

    const storedEarlier = { ...simple, mainColor: "#223344" }
    await write(earlier, "state", "preferences", storedEarlier)
    assert.equal((await exported()).firstColor, "#223344")

    const record = { version: 1, settings: {
      timeFormat: "12h", clockFontFamily: "serif", clockModeFontColor: "#AABBCC", backgroundId: "static-gradient",
      clockShadowStrength: 0.25, clockGlowStrength: 0.8, clockStrokeEnabled: true,
      staticGradientColorCount: 3, staticGradientAngle: 270, staticGradientStopPositions: [0, 30, 100],
      backgroundVisualPreferences: {
        palette: { mode: "harmony", harmony: "complementary", primaryColor: "#FF0000",
          swatches: ["#FF0000", "#000000", "#ABCDEF"] },
        mappingsByBackground: { "static-gradient": { "color-one": 1, "color-two": 0, "color-three": 1 } },
      },
    }, timer: { endsAtMs: 876543210 } }
    await write(shared, "clock", "state", record)
    const current = await exported()
    assert.equal(current.format, "12h")
    assert.equal(current.font, "serif")
    assert.equal(current.color, "#AABBCC")
    assert.equal(current.background, "static-gradient")
    assert.equal(current.shadowStrength, 0.25)
    assert.equal(current.glowStrength, 0.8)
    assert.equal(current.stroke, true)
    assert.deepEqual(current.gradientColors, ["#00ffff", "#ff0000", "#00ffff"])
    assert.deepEqual(current.gradientStops, [0, 30, 100])
    assert.equal(current.gradientAngle, 270)
    assert.equal("timer" in current, false)
    assert.deepEqual(await readDatabase(page, shared, "clock", "state"), record)
    assert.deepEqual(await readDatabase(page, earlier, "state", "preferences"), storedEarlier)
    assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), earlier), simple)

    await write(shared, "clock", "state", { ...record, settings: { ...record.settings, backgroundId: "not-supported" } })
    assert.equal((await exported()).background, "neutral")
    const damaged = { ...record, settings: { ...record.settings, clockModeFontColor: "invalid" } }
    await write(shared, "clock", "state", damaged)
    assert.equal(await exported(), "unavailable")
    assert.deepEqual(await readDatabase(page, shared, "clock", "state"), damaged)
    await write(shared, "clock", "state", record)
    assert.equal((await exported()).color, "#AABBCC")
    assert.deepEqual(f.foreign, [])
  } finally {
    await f.close()
  }
})

test("mobile sidebar closes after selecting device tools", {timeout:60000}, async()=>{
  const f=await fixture(),{page}=f
  try {
    await page.goto(entry)
    const drawer=page.getByRole("dialog",{name:"AtmoShaper navigation",exact:true})
    for(const [link,destination] of [["Music",page.getByRole("navigation",{name:"Device music tools"})],["Breathing guide",page.getByRole("heading",{name:"Breathing guide",exact:true})]]) {
      await page.getByRole("button",{name:"Open navigation",exact:true}).click()
      await expect(drawer).toBeVisible()
      if(!await drawer.getByRole("link",{name:link,exact:true}).isVisible()) await drawer.getByRole("button",{name:"Atmosphere",exact:true}).click()
      await drawer.getByRole("link",{name:link,exact:true}).click()
      await expect(drawer).toBeHidden()
      await expect(destination).toBeVisible()
      await expect(page.getByRole("button",{name:"Open navigation",exact:true})).toBeFocused()
    }
    assert.deepEqual(f.errors,[]);assert.deepEqual(f.foreign,[])
  } finally { await f.close() }
})

test("shared home, navigation, breathing, Music and planner screens work on a cold offline launch", {timeout:120000}, async()=>{
  const f = await fixture(), {page}=f
  await mkdir(output,{recursive:true})
  try {
    await page.goto(entry+"#/?from=clock")
    await expect(page.getByTestId("home-launcher")).toBeVisible()
    await expect(page.getByRole("link",{name:"Clock & timer",exact:true})).toBeVisible()
    await page.getByRole("button",{name:"Practice tools",exact:true}).click()
    await page.getByRole("link",{name:"Business Planner",exact:true}).click()
    await expect(page.getByRole("heading",{name:"Business planner tools",exact:true})).toBeVisible()
    await page.screenshot({path:path.join(output,"phone-planners.png")})
    await go(page,"/wellness/breathing")
    await expect(page.getByRole("heading",{name:"Breathing guide",exact:true})).toBeVisible()
    await page.getByRole("button",{name:"Box 4 sides",exact:true}).click()
    await page.getByRole("button",{name:"Start breathing",exact:true}).click()
    await expect(page.getByRole("button",{name:"Pause breathing",exact:true})).toBeVisible()
    await page.screenshot({path:path.join(output,"phone-breathing.png")})
    await page.getByRole("button",{name:"Pause breathing",exact:true}).click()
    await go(page,"/music")
    await expect(page.getByRole("navigation",{name:"Device music tools"})).toBeVisible()
    await page.screenshot({path:path.join(output,"phone-music.png")})
    await page.getByRole("link",{name:"Downloads",exact:true}).click()
    await expect(page.getByRole("heading",{name:"Music downloads",exact:true})).toBeVisible()
    await page.getByLabel("Find a sound").fill("Little Bells")
    await expect(page.getByRole("button",{name:"Download Little Bells",exact:true})).toBeVisible()
    assert.equal(await page.evaluate(()=>navigator.onLine),false)
    assert.deepEqual(f.errors,[]);assert.deepEqual(f.foreign,[])
  } catch(error) { await writeFile(path.join(output,"browser-failure.json"),JSON.stringify({url:page.url(),body:await page.locator("body").innerText(),errors:f.errors,foreign:f.foreign},null,2)); throw error }
  finally { await f.close() }
})

test("read-only upgrade preserves the earlier state and restores a running deadline across reload/navigation", {timeout:60000}, async()=>{
  const f=await fixture(),{page}=f
  const original={...defaultOfflineCoreState(),tool:"timer",mainColor:"#146b73",durationMs:180000,timer:startOfflineTimer(180000)}
  try {
    await page.addInitScript(()=>{
      window.__wakeRequests=0;window.__wakeReleases=0
      Object.defineProperty(navigator,"wakeLock",{configurable:true,value:{async request(){window.__wakeRequests++;return {released:false,addEventListener(){},async release(){this.released=true;window.__wakeReleases++}}}}})
    })
    await page.goto(entry.replace("index.html","seed.html"))
    await page.evaluate(state=>new Promise((resolve,reject)=>{
      const open=indexedDB.open("atmoshaper.android.offline-core.v1",1)
      open.onupgradeneeded=()=>open.result.createObjectStore("state")
      open.onsuccess=()=>{const db=open.result,tx=db.transaction("state","readwrite",{durability:"strict"});tx.objectStore("state").put(state,"preferences");tx.oncomplete=()=>{db.close();resolve()};tx.onabort=()=>reject(tx.error)}
    }),original)
    await page.goto(entry)
    await expect(page.getByTestId("home-launcher")).toBeVisible()
    await page.getByRole("link",{name:"Clock & timer",exact:true}).click()
    await expect(page.locator("[data-native-shared-clock]")).toBeVisible()
    const read=()=>readDatabase(page,"atmoshaper.android.chimer-runtime.v1","clock","state")
    await expect.poll(async()=> (await read())?.timer.status).toBe("running")
    await expect(page.getByTestId("running-timer-clock")).toBeVisible()
    await expect(page.getByTestId("running-timer-clock")).toHaveAttribute("data-immersive-primary-display","true")
    assert.equal((await read()).timer.endsAtMs,original.timer.endsAt)
    await expect.poll(()=>page.evaluate(()=>window.__wakeRequests)).toBeGreaterThan(0)
    await go(page,"/wellness/breathing")
    await expect(page.getByRole("heading",{name:"Breathing guide",exact:true})).toBeVisible()
    await expect.poll(()=>page.evaluate(()=>window.__wakeReleases)).toBeGreaterThan(0)
    assert.equal((await read()).timer.endsAtMs,original.timer.endsAt)
    await go(page,"/chimer")
    await page.reload()
    await expect(page.locator("[data-native-shared-clock]")).toBeVisible()
    assert.equal((await read()).timer.endsAtMs,original.timer.endsAt)
    assert.deepEqual(await readDatabase(page,"atmoshaper.android.offline-core.v1","state","preferences"),original)
    assert.deepEqual(f.errors,[]);assert.deepEqual(f.foreign,[])
  } finally { await f.close() }
})

test("a failed initial native Clock read blocks changes and cannot overwrite the old saved timer", {timeout:60000}, async()=>{
  const f=await fixture(),{page}=f
  const original=importLegacyNativeClock({...defaultOfflineCoreState(),mainColor:'#146b73',timer:startOfflineTimer(180000)})
  try {
    await page.goto(entry.replace("index.html","seed.html"))
    await page.evaluate(state=>new Promise((resolve,reject)=>{
      const open=indexedDB.open("atmoshaper.android.chimer-runtime.v1",1)
      open.onupgradeneeded=()=>open.result.createObjectStore("clock")
      open.onsuccess=()=>{const db=open.result,tx=db.transaction("clock","readwrite",{durability:"strict"});tx.objectStore("clock").put(state,"state");tx.oncomplete=()=>{db.close();resolve()};tx.onabort=()=>reject(tx.error)}
    }),original)
    await contextFailure(page)
    await page.goto(entry+"#/clock")
    await expect(page.getByRole("button",{name:"Retry saved Clock",exact:true})).toBeVisible()
    await expect(page.locator("[data-native-shared-clock]")).toHaveCount(0)
    assert.deepEqual(await readDatabase(page,"atmoshaper.android.chimer-runtime.v1","clock","state"),original)
    await page.getByRole("button",{name:"Retry saved Clock",exact:true}).click()
    await expect(page.locator("[data-native-shared-clock]")).toBeVisible()
    assert.equal((await readDatabase(page,"atmoshaper.android.chimer-runtime.v1","clock","state")).timer.endsAtMs,original.timer.endsAtMs)
    assert.deepEqual(f.errors,[]);assert.deepEqual(f.foreign,[])
  } finally { await f.close() }
})

test("an imported disabled interval stays disabled on the actual timer setup screen",{timeout:60000},async()=>{
  const f=await fixture(),{page}=f,original={...defaultOfflineCoreState(),intervalMinutes:0}
  try {
    await page.goto(entry.replace("index.html","seed.html"))
    await page.evaluate(state=>new Promise((resolve,reject)=>{
      const open=indexedDB.open("atmoshaper.android.offline-core.v1",1)
      open.onupgradeneeded=()=>open.result.createObjectStore("state")
      open.onsuccess=()=>{const db=open.result,tx=db.transaction("state","readwrite",{durability:"strict"});tx.objectStore("state").put(state,"preferences");tx.oncomplete=()=>{db.close();resolve()};tx.onabort=()=>reject(tx.error)}
    }),original)
    await page.goto(entry+"#/chimer")
    await page.getByRole("button",{name:"Continue",exact:true}).click()
    await expect(page.getByRole("combobox",{name:"Interval cue",exact:true})).toHaveValue("none")
    await expect(page.getByLabel("Custom minutes",{exact:true})).toHaveCount(0)
    await page.reload()
    await page.getByRole("button",{name:"Continue",exact:true}).click()
    await expect(page.getByRole("combobox",{name:"Interval cue",exact:true})).toHaveValue("none")
    assert.equal((await readDatabase(page,"atmoshaper.android.chimer-runtime.v1","clock","state")).settings.intervalType,"none")
    assert.deepEqual(await readDatabase(page,"atmoshaper.android.offline-core.v1","state","preferences"),original)
    assert.deepEqual(f.errors,[]);assert.deepEqual(f.foreign,[])
  } catch(error){await writeFile(path.join(output,"interval-off-failure.json"),JSON.stringify({body:await page.locator("body").innerText(),errors:f.errors},null,2));throw error}
  finally {await f.close()}
})

test("a restarted shared timer consumes a missed interval and sounds the following interval",{timeout:60000},async()=>{
  const f=await fixture(),{page}=f,now=Date.now(),minute=60000
  const original=importLegacyNativeClock({...defaultOfflineCoreState(),timer:startOfflineTimer(4*minute,now),intervalMinutes:1},now)
  try {
    await page.clock.install({time:now+75*1000})
    await page.clock.pauseAt(now+75*1000)
    await page.goto(entry.replace("index.html","seed.html"))
    await page.evaluate(state=>new Promise((resolve,reject)=>{
      const open=indexedDB.open("atmoshaper.android.chimer-runtime.v1",1)
      open.onupgradeneeded=()=>open.result.createObjectStore("clock")
      open.onsuccess=()=>{const db=open.result,tx=db.transaction("clock","readwrite",{durability:"strict"});tx.objectStore("clock").put(state,"state");tx.oncomplete=()=>{db.close();resolve()};tx.onabort=()=>reject(tx.error)}
    }),original)
    await page.addInitScript(()=>{window.__timerTones=0;const start=OscillatorNode.prototype.start;OscillatorNode.prototype.start=function(...args){window.__timerTones++;return start.apply(this,args)}})
    await page.goto(entry)
    await page.clock.runFor(1000)
    await page.getByRole("button",{name:"Enable timer sound",exact:true}).click()
    await go(page,"/chimer")
    await expect(page.getByTestId("running-timer-clock")).toBeVisible()
    const read=()=>readDatabase(page,"atmoshaper.android.chimer-runtime.v1","clock","state")
    await expect.poll(async()=>(await read())?.timer.nextAlertAtMs).toBe(now+2*minute)
    assert.equal(await page.evaluate(()=>window.__timerTones),0)
    await page.clock.fastForward(46*1000)
    await expect.poll(()=>page.evaluate(()=>window.__timerTones)).toBe(2)
    await expect.poll(async()=>(await read())?.timer.nextAlertAtMs).toBe(now+3*minute)
    assert.equal((await read()).timer.endsAtMs,original.timer.endsAtMs)
    assert.deepEqual(f.errors,[]);assert.deepEqual(f.foreign,[])
  } catch(error){await writeFile(path.join(output,"interval-resume-failure.json"),JSON.stringify({body:await page.locator("body").innerText(),now:await page.evaluate(()=>Date.now()),state:await readDatabase(page,"atmoshaper.android.chimer-runtime.v1","clock","state"),errors:f.errors},null,2));throw error}
  finally {await f.close()}
})

async function contextFailure(page) {
  await page.addInitScript(()=>{
    const open=indexedDB.open.bind(indexedDB)
    indexedDB.open=(name,...args)=>{
      if(name==="atmoshaper.android.chimer-runtime.v1"&&!sessionStorage.getItem("clock-failed-once")) {
        sessionStorage.setItem("clock-failed-once","1")
        const request={error:new DOMException("Synthetic initial read failure","UnknownError")}
        queueMicrotask(()=>request.onerror?.());return request
      }
      return open(name,...args)
    }
  })
}

test("a restored timer requests sound readiness without restarting its deadline, then chimes once",{timeout:30000},async()=>{
  const f=await fixture(),{page}=f
  const original={...defaultOfflineCoreState(),tool:"timer",durationMs:15000,timer:startOfflineTimer(15000)}
  try {
    await page.goto(entry.replace("index.html","seed.html"))
    await page.evaluate(state=>new Promise(resolve=>{
      const open=indexedDB.open("atmoshaper.android.offline-core.v1",1)
      open.onupgradeneeded=()=>open.result.createObjectStore("state")
      open.onsuccess=()=>{const db=open.result,tx=db.transaction("state","readwrite");tx.objectStore("state").put(state,"preferences");tx.oncomplete=()=>{db.close();resolve()}}
    }),original)
    await page.addInitScript(()=>{
      window.__timerTones=0
      const start=OscillatorNode.prototype.start
      OscillatorNode.prototype.start=function(...args){window.__timerTones++;return start.apply(this,args)}
    })
    await page.goto(entry+"#/chimer")
    await page.getByRole("button",{name:"Enable timer sound",exact:true}).click()
    await expect(page.getByRole("button",{name:"Enable timer sound",exact:true})).toHaveCount(0)
    assert.equal((await readDatabase(page,"atmoshaper.android.chimer-runtime.v1","clock","state")).timer.endsAtMs,original.timer.endsAt)
    await expect.poll(()=>page.evaluate(()=>window.__timerTones),{timeout:20000}).toBe(2)
    await expect.poll(async()=>(await readDatabase(page,"atmoshaper.android.chimer-runtime.v1","clock","state")).timer.status).toBe("complete")
    assert.deepEqual(f.errors,[]);assert.deepEqual(f.foreign,[])
  }finally{await f.close()}
})

test("offline outline report uses the packaged font and hands actual PDF bytes to the save dialog port", {timeout:60000}, async()=>{
  const f=await fixture(),{page}=f
  try {
    await page.addInitScript(()=>{
      window.__documents=[]
      window.AtmoShaperDocuments={postMessage(raw){
        const value=JSON.parse(raw);window.__documents.push(value)
        queueMicrotask(()=>window.dispatchEvent(new CustomEvent("atmoshaper:document-result",{detail:{id:value.id,status:"saved"}})))
      }}
    })
    await page.goto(entry+"#/tools/business-planner/plan-outline")
    await expect(page.getByRole("heading",{name:"Business Plan Outline",exact:true})).toBeVisible()
    const steps=page.getByLabel("Go to planning step")
    await steps.selectOption({label:"5. Review"})
    await page.getByRole("button",{name:"Download PDF report",exact:true}).click()
    await expect(page.getByRole("status")).toContainText("PDF saved. Review it before sharing.",{timeout:30000})
    const request=await page.evaluate(()=>window.__documents[0])
    assert.equal(request.type,"save-pdf")
    assert.match(request.filename,/^atmoshaper-outline-working-draft-/)
    const pdf=await PDFDocument.load(Buffer.from(request.data,"base64"))
    assert.ok(pdf.getPageCount()>0)
    assert.deepEqual(f.errors,[]);assert.deepEqual(f.foreign,[])
  } finally {await f.close()}
})

test("decorative metal buttons keep the shared Music page usable when WebGL is unavailable", {timeout:30000}, async()=>{
  const f=await fixture(),{page}=f
  try {
    await page.addInitScript(()=>{
      for(const constructor of [HTMLCanvasElement,globalThis.OffscreenCanvas].filter(Boolean)) {
        const get=constructor.prototype.getContext
        constructor.prototype.getContext=function(type,...args){return /webgl/.test(type)?null:get.call(this,type,...args)}
      }
    })
    await page.goto(entry+"#/music")
    await expect(page.getByRole("navigation",{name:"Device music tools"})).toBeVisible()
    await expect(page.getByRole("link",{name:"Open music",exact:true})).toBeVisible()
    await expect(page.locator(".ml-metal-attention-root-idle").first()).toBeAttached()
    assert.deepEqual(f.errors,[]);assert.deepEqual(f.foreign,[])
  } finally {await f.close()}
})

test("shared Music plays online without saving, then uses explicit downloads offline across tool navigation", {timeout:240000,skip:process.env.ATMOSHAPER_OFFLINE_REAL_MEDIA_TEST!=="1"}, async()=>{
  const f=await fixture({allowMedia:true}),{page,context}=f
  try {
    await page.addInitScript(({key,value})=>{
      localStorage.setItem(key,JSON.stringify(value))
      window.__nonSilentStarts=0
      const start=AudioBufferSourceNode.prototype.start
      AudioBufferSourceNode.prototype.start=function(...args){
        if(this.context instanceof AudioContext && this.buffer?.getChannelData(0).some(value=>Math.abs(value)>0.00001))window.__nonSilentStarts++
        return start.apply(this,args)
      }
      window.__localMedia=[]
      const play=HTMLMediaElement.prototype.play
      HTMLMediaElement.prototype.play=function(...args){window.__localMedia.push(this);return play.apply(this,args)}
    },{key:ATMOSPHERE_STORAGE_KEY,value:{...createDefaultAtmosphereStorage(),favorites:["generative-fm-little-bells"]}})
    // The ordinary Play action must work before the user has saved any pack.
    await page.goto(entry+"#/music")
    await page.getByRole("group",{name:"Station category"}).getByRole("button",{name:"Favorites",exact:true}).click()
    await page.getByRole("button",{name:"Play Little Bells",exact:true}).click()
    await expect.poll(()=>page.evaluate(()=>window.__nonSilentStarts),{timeout:90000}).toBeGreaterThan(0)
    assert.equal(await readDatabase(page,"atmoshaper.android.media.v1","packs","generative-fm-little-bells"),undefined)
    await page.goto(entry+"#/downloads")
    await page.getByLabel("Find a sound").fill("Little Bells")
    await page.getByRole("button",{name:"Download Little Bells",exact:true}).click()
    await expect(page.getByText("Little Bells is ready offline.",{exact:true})).toBeVisible({timeout:90000})
    const catalog=JSON.parse(await readFile(path.join(root,"data/atmoshaper/production-audio-catalog.json")))
    const size=item=>item.sources.reduce((sum,source)=>sum+source.formats.find(format=>format.id==="opus").byteSize,0)
    const ambient=[...catalog.concepts].sort((a,b)=>size(a)-size(b))[0]
    const title=offlineAudioCatalog(catalog).find(item=>item.id===ambient.id).title
    await go(page,"/music")
    await page.getByRole("group",{name:"Station category"}).getByRole("button",{name:"Atmosphere",exact:true}).click()
    await page.getByRole("tab",{name:"Ambient sounds",exact:true}).click()
    await page.getByLabel("Search ambient sounds",{exact:true}).fill(title)
    await page.getByRole("button",{name:`Preview ${ambient.label}`,exact:true}).click()
    await expect.poll(()=>page.evaluate(()=>window.__localMedia.some(audio=>audio.src.startsWith("blob:")&&audio.currentTime>0)),{timeout:30000}).toBe(true)
    assert.equal(await readDatabase(page,"atmoshaper.android.media.v1","packs",ambient.id),undefined)
    await go(page,"/downloads")
    await page.getByRole("button",{name:"Atmosphere sounds",exact:true}).click()
    await page.getByLabel("Find a sound").fill(title)
    await page.getByRole("button",{name:`Download ${title}`,exact:true}).click()
    await expect(page.getByText(`${title} is ready offline.`,{exact:true})).toBeVisible({timeout:90000})
    await context.setOffline(true)
    await page.goto(entry+"#/music")
    await page.reload() // A hash change alone retains the online audio graph.
    await page.getByRole("group",{name:"Station category"}).getByRole("button",{name:"Favorites",exact:true}).click()
    await page.getByRole("button",{name:"Play Little Bells",exact:true}).click()
    await expect.poll(()=>page.evaluate(()=>window.__nonSilentStarts),{timeout:45000}).toBeGreaterThan(0)
    await go(page,"/wellness/breathing")
    await expect(page.getByRole("region",{name:"Atmosphere audio player"}).getByRole("button",{name:"Pause",exact:true})).toBeVisible()
    await page.getByRole("button",{name:"Start breathing",exact:true}).click()
    await expect(page.getByRole("button",{name:"Pause breathing",exact:true})).toBeVisible()
    await go(page,"/music")
    await page.getByRole("group",{name:"Station category"}).getByRole("button",{name:"Atmosphere",exact:true}).click()
    await page.getByRole("tab",{name:"Ambient sounds",exact:true}).click()
    await page.getByLabel("Search ambient sounds",{exact:true}).fill(title)
    await page.getByRole("button",{name:`Preview ${ambient.label}`,exact:true}).click()
    await expect.poll(()=>page.evaluate(()=>window.__localMedia.some(audio=>audio.src.startsWith("blob:")&&audio.currentTime>0)),{timeout:20000}).toBe(true)
    assert.deepEqual(f.errors,[]);assert.deepEqual(f.foreign,[])
  } catch(error){await writeFile(path.join(output,"audio-failure.json"),JSON.stringify({body:await page.locator("body").innerText(),errors:f.errors,foreign:f.foreign},null,2));throw error}
  finally {await f.close()}
})
