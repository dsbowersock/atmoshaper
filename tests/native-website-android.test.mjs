import test from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { readFile, mkdir, writeFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"
import { expect as playwrightExpect } from "@playwright/test"
import { offlineAudioCatalog } from "../lib/offline-media.js"
import { createDefaultAtmosphereStorage, ATMOSPHERE_STORAGE_KEY } from "../lib/atmosphere/storage.js"
import { PLAN_OUTLINE_STORAGE_KEY } from "../lib/business-planner-reports.js"

const root=fileURLToPath(new URL("..",import.meta.url))
// A cold software-rendered WebView can need more than Playwright's desktop
// five-second assertion default to parse a newly opened shared tool chunk.
const expect=playwrightExpect.configure({timeout:20000})
const adb=path.join(root,"output/android-tools/sdk/platform-tools",process.platform==="win32"?"adb.exe":"adb")
const fixtures = new Map([
  ["web-parity", { serial: "emulator-5582", avd: "AtmoShaper_WebParity_35" }],
  ["pilot-87-92", { serial: "emulator-5594", avd: "AtmoShaper_Pilot_87_92_API35", timeout: 720000 }],
  ["stage-1", { serial: "emulator-5594", avd: "AtmoShaper_Pilot_87_92_API35", timeout: 840000, previousNative: true }],
])
const fixture = fixtures.get(process.env.ATMOSHAPER_ANDROID_WEBSITE_FIXTURE ?? "web-parity")
assert.ok(fixture, "Select a named synthetic Android website fixture")
const { serial, avd } = fixture
const pkg="com.atmoshaper.app.development"
const shell=(...args)=>execFileSync(adb,["-s",serial,...args],{encoding:"utf8",timeout:45000,windowsHide:true}).trim()
const output=path.join(root,"output/native-website-android")

/** Read the exact development package Android reports after each install. */
function installedVersionCode() {
  const entries = shell("shell","cmd","package","list","packages","--show-versioncode",pkg).split(/\r?\n/)
  const installed = entries.find(line => line.startsWith(`package:${pkg} versionCode:`))
  assert.ok(installed, "Android reports the installed development package version")
  const version = Number(installed.split("versionCode:")[1])
  assert.ok(Number.isSafeInteger(version) && version > 0)
  return version
}

/** Only the fixed fixture allowlist can select a serial and AVD. The owner-receipt emulator 5580 and
 * physical devices are excluded. The marker may first be created only before
 * any AtmoShaper install, then belongs solely to this synthetic test fixture. */
function assertOwnedFixture() {
  assert.equal(shell("emu","avd","name").split(/[\r\n]+/)[0].trim(),avd)
  const installed=shell("shell","pm","list","packages",pkg)
  const marker=shell("shell","sh","-c","'if [ -f /data/local/tmp/atmoshaper-parity-fixture ]; then echo owned; fi'")
  if(marker!=="owned") {
    assert.equal(installed,"","never adopt an existing user installation")
    shell("shell","touch","/data/local/tmp/atmoshaper-parity-fixture")
  }
}

test("replacement APK opens native Home offline and retains downloads, settings and a planner draft",{timeout:fixture.timeout ?? 420000,skip:process.env.ATMOSHAPER_ANDROID_WEBSITE_TEST!=="1"},async()=>{
  assertOwnedFixture()
  await mkdir(output,{recursive:true})
  const baseline=path.resolve(root,"../../output/android/AtmoShaper-offline-preview-0.3.0-8abbb7c3.apk")
  assert.equal(createHash("sha256").update(await readFile(baseline)).digest("hex"),"8abbb7c366aa75d03f207428e19bafa0f673fff104d7e34c92dc3500ff43af4a")
  const sharedBaseline=path.resolve(root,"../../output/android/AtmoShaper-shared-website-preview-0.4.2-8f603319.apk")
  assert.equal(createHash("sha256").update(await readFile(sharedBaseline)).digest("hex"),"8f603319474beaf5650d278d1ce802e93eee37a8fd8d731536614607d0264da2")
  const nativeBaseline=fixture.previousNative
    ? path.resolve(root,"../native-android-pilot-87-92/output/android/AtmoShaper-preview.apk")
    : null
  if (nativeBaseline) {
    assert.equal(createHash("sha256").update(await readFile(nativeBaseline)).digest("hex"),
      "8504beaecf0cf8c90dbd763a68373b9252accd3ac8b3398a8066d75943b9a39e")
  }
  const apk=path.join(root,"output/android/AtmoShaper-preview.apk")
  const apkSha256=createHash("sha256").update(await readFile(apk)).digest("hex")
  if (nativeBaseline) {
    const buildProof = JSON.parse(await readFile(path.join(root,"output/android/build-proof.json"),"utf8"))
    assert.equal(apkSha256,buildProof.sha256,"The installed candidate matches its build receipt")
  }
  const manifest=JSON.parse(execFileSync("python",[path.join(root,"tests/helpers/offline-apk-inventory.py"),apk],{encoding:"utf8",windowsHide:true}))
  assert.deepEqual(manifest,JSON.parse(await readFile(path.join(root,"output/offline-core/bundle-proof.json"))))
  assert.equal(manifest.sharedWebsite,true);assert.equal(manifest.syntheticReceiptAuthority,false)
  shell("shell","am","force-stop",pkg)
  shell("install","-r","-d",baseline)
  const upgradeVersions = [installedVersionCode()]
  assert.equal(shell("shell","pm","clear",pkg),"Success")
  shell("shell","cmd","connectivity","airplane-mode","disable")
  shell("shell","svc","wifi","enable")
  shell("shell","am","start","-n",`${pkg}/com.atmoshaper.app.MainActivity`)
  const connections=[]
  let lastPid=null,offline=false
  const errors=[],network=[]
  /** Forward only the guarded fixture's WebView. Playwright Android discovery
   * would contact every ADB device before the caller could select this one. */
  async function connect({ sameProcess = false } = {}) {
    let pid, socket
    await expect.poll(() => {
      try {
        pid = shell("shell","pidof",pkg)
      } catch {
        return false
      }
      const isCurrentProcess = pid === lastPid
      if (!/^\d+$/.test(pid) || isCurrentProcess !== sameProcess) return false
      socket = `webview_devtools_remote_${pid}`
      return shell("shell","cat","/proc/net/unix").split(/\r?\n/).some(line => line.endsWith(`@${socket}`))
    }).toBe(true)
    lastPid = pid
    const port = shell("forward","tcp:0",`localabstract:${socket}`)
    assert.match(port, /^\d+$/)
    const connection = { port, browser: null }
    connections.push(connection)
    const endpoint = `http://127.0.0.1:${port}`
    connection.browser = await chromium.connectOverCDP(endpoint, { timeout: 20000, noDefaults: true })
    const context = connection.browser.contexts()[0]
    let page
    // A native engine may open its own local WebView in the same process.
    // Legacy preservation assertions always target the previous tool entry.
    await expect.poll(() => {
      page = context?.pages().find(candidate => candidate.url() ===
        "https://appassets.androidplatform.net/assets/core/index.html")
      return Boolean(page)
    }, { message: "The guarded previous tools WebView exposes its packaged page" }).toBe(true)
    page.on("pageerror",error=>errors.push(error.message))
    page.on("request",request=>{if(offline && request.url().startsWith("https://media."))network.push(request.url())})
    return page
  }
  function captureAndroidScreen() {
    // The 1080 × 2400 fixture's PNG can exceed Node's default 1 MiB buffer.
    return execFileSync(adb, ["-s",serial,"exec-out","screencap","-p"], {
      timeout: 15000, maxBuffer: 16 * 1024 * 1024, windowsHide: true,
    })
  }
  /** Read the existing stores without creating them if an upgrade lost them. */
  async function read(page,name,store,key,{digestFiles=false}={}) {
    return page.evaluate(async({name,store,key,digestFiles})=>{
      const db=await new Promise((resolve,reject)=>{
        const open=indexedDB.open(name)
        open.onupgradeneeded=()=>open.transaction.abort()
        open.onerror=()=>reject(open.error)
        open.onsuccess=()=>resolve(open.result)
      })
      let records
      try {
        records=await new Promise((resolve,reject)=>{
          const objects=db.transaction(store).objectStore(store)
          const request=key===undefined?objects.getAll():objects.get(key)
          request.onsuccess=()=>resolve(request.result)
          request.onerror=()=>reject(request.error)
        })
      } finally {
        db.close()
      }
      if (!digestFiles) return records
      // Hash stored bytes inside WebView. Metadata could survive even if files did not.
      return Promise.all(records.map(async ({id,revision,files})=>({
        id,revision,files:await Promise.all(files.map(async ({data})=>
          Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",data)),byte=>byte.toString(16).padStart(2,"0")).join("")
        )),
      })))
    },{name,store,key,digestFiles})
  }
  const downloadDigests=page=>read(page,"atmoshaper.android.media.v1","packs",undefined,{digestFiles:true})
  function nativeHierarchy() {
    const hierarchyPath="/data/local/tmp/atmoshaper-parity-native-home.xml"
    // UiAutomator can report no root while the new Activity is taking focus.
    // Only read a dump created by this call, never the previous screen's XML.
    const dump=shell("shell","uiautomator","dump",hierarchyPath)
    if (!dump.endsWith(hierarchyPath)) return ""
    return shell("shell","cat",hierarchyPath)
  }
  /** Tap fresh accessibility bounds across APKs, including Home outside WebView. */
  async function tapNativeLabel(label) {
    const xmlLabel=label.replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    const bounds=new RegExp(`<node\\b[^>]*text="${RegExp.escape(xmlLabel)}"[^>]*bounds="\\[(\\d+),(\\d+)\\]\\[(\\d+),(\\d+)\\]"`)
    let target
    await expect.poll(()=>{
      target=nativeHierarchy().match(bounds)
      return Boolean(target)
    }).toBe(true)
    const [left,top,right,bottom]=target.slice(1).map(Number)
    shell("shell","input","tap",String(Math.round((left+right)/2)),String(Math.round((top+bottom)/2)))
  }
  const go=(page,route)=>page.evaluate(route=>window.dispatchEvent(new CustomEvent("atmoshaper:native-navigation",{detail:route})),route)
  /** A fresh Android fixture shows a system tutorial above the app on first
   * immersive use. Dismiss only that exact tutorial; never treat its swallowed
   * Back as an app navigation result or alter system settings to bypass it. */
  async function acknowledgeImmersiveTutorial() {
    // Android schedules first-use help after the system-bar animation.
    await new Promise(resolve=>setTimeout(resolve,1000))
    const focus=shell("shell","dumpsys","window","displays")
    if(!/mCurrentFocus=Window\{[^\n]*ImmersiveModeConfirmation/.test(focus))return
    shell("shell","uiautomator","dump","/data/local/tmp/atmoshaper-parity-ui.xml")
    const xml=shell("shell","cat","/data/local/tmp/atmoshaper-parity-ui.xml")
    assert.match(xml,/resource-id="android:id\/immersive_cling_title"/)
    const ok=xml.match(/<node\b[^>]*resource-id="android:id\/ok"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/)
    assert.ok(ok,"the exact fullscreen tutorial has its confirmation button")
    shell("shell","input","tap",String(Math.round((Number(ok[1])+Number(ok[3]))/2)),String(Math.round((Number(ok[2])+Number(ok[4]))/2)))
    await expect.poll(()=>shell("shell","dumpsys","window","displays")).not.toMatch(/mCurrentFocus=Window\{[^\n]*ImmersiveModeConfirmation/)
  }
  const touchSessions = new WeakMap()
  /** Android's CDP context has no desktop hasTouch option. Send actual mobile
   * input after checking geometry, instead of its unreliable mouse auto-scroll. */
  async function tap(page, target, nativeTransition = false) {
    await expect(target).toBeVisible()
    let bounds=await target.boundingBox()
    const size=await page.evaluate(()=>({width:innerWidth,height:innerHeight}))
    const covered=bounds && !await target.evaluate(element=>{
      const rect=element.getBoundingClientRect()
      return element.contains(document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2))
    })
    // The fixed music player can cover a control that is still in the viewport.
    if(bounds && (covered || bounds.y<0 || bounds.y+bounds.height>size.height || bounds.x<0 || bounds.x+bounds.width>size.width)) {
      await target.evaluate(element=>element.scrollIntoView({block:"center",inline:"nearest",behavior:"instant"}))
      bounds=await target.boundingBox()
    }
    assert.ok(bounds && bounds.width>0 && bounds.height>0)
    const x=bounds.x+bounds.width/2,y=bounds.y+bounds.height/2
    assert.ok(x>=0 && x<size.width && y>=0 && y<size.height,"touch target is inside the visible viewport")
    await expect.poll(()=>target.evaluate((element,{x,y})=>element.contains(document.elementFromPoint(x,y)),{x,y})).toBe(true)
    let session=touchSessions.get(page)
    if(!session){session=await page.context().newCDPSession(page);touchSessions.set(page,session)}
    await session.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x,y}]})
    await page.waitForTimeout(50) // Give Android a real touch interval across its surface transition.
    const released=session.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]})
    if(nativeTransition) {
      // WebView can withhold the input ack while a native fullscreen/picker
      // owns its surface. Mandatory postconditions below verify the real effect.
      let timeout
      try {await Promise.race([released,new Promise(resolve=>{timeout=setTimeout(resolve,1000)})])}
      finally {clearTimeout(timeout);void released.catch(()=>{})}
    } else await released
  }
  let page
  let failed = false
  try {
    page=await connect()
    console.log("Android fixture: connected to the earlier preview.")
    // Prepare the shared Music UI preference well before force-stop. WebView's
    // localStorage disk flush is asynchronous, unlike the strict IndexedDB data
    // whose actual durability this upgrade check asserts below.
    await page.evaluate(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key:ATMOSPHERE_STORAGE_KEY,value:{...createDefaultAtmosphereStorage(),favorites:["generative-fm-little-bells"]}})
    await tap(page,page.getByRole("button",{name:"Music",exact:true}))
    await page.getByLabel("Find a sound").fill("Little Bells")
    await tap(page,page.getByRole("button",{name:"Download Little Bells",exact:true}))
    await expect(page.getByText("Little Bells is ready offline.",{exact:true})).toBeVisible({timeout:90000})
    const catalog=JSON.parse(await readFile(path.join(root,"data/atmoshaper/production-audio-catalog.json")))
    const size=item=>item.sources.reduce((sum,source)=>sum+source.formats.find(format=>format.id==="opus").byteSize,0)
    const ambient=[...catalog.concepts].sort((a,b)=>size(a)-size(b))[0]
    const title=offlineAudioCatalog(catalog).find(item=>item.id===ambient.id).title
    await tap(page,page.getByRole("button",{name:"Atmosphere sounds",exact:true}))
    await page.getByLabel("Find a sound").fill(title)
    await tap(page,page.getByRole("button",{name:`Download ${title}`,exact:true}))
    await expect(page.getByText(`${title} is ready offline.`,{exact:true})).toBeVisible({timeout:90000})
    console.log("Android fixture: both real downloads saved; preparing the upgrade.")
    await tap(page,page.getByRole("button",{name:"Backgrounds",exact:true}))
    await tap(page,page.getByRole("button",{name:"In Transition",exact:true}))
    await page.getByLabel("Main color",{exact:true}).fill("#146b73")
    await tap(page,page.getByRole("button",{name:"Timer",exact:true}))
    await page.getByLabel("Timer hours",{exact:true}).fill("0")
    await page.getByLabel("Timer minutes",{exact:true}).fill("20")
    await page.getByLabel("Timer seconds",{exact:true}).fill("0")
    await tap(page,page.getByRole("button",{name:"Start timer",exact:true}))
    await expect(page.locator("main")).toHaveAttribute("data-offline-save-state","saved")
    const old=await read(page,"atmoshaper.android.offline-core.v1","state","preferences")
    const packs=await downloadDigests(page)
    const oldAccess=await read(page,"atmoshaper.android.background-access.v1","access","state")
    const closed=page.waitForEvent("close",{timeout:15000});shell("shell","am","force-stop",pkg);await closed
    shell("shell","cmd","connectivity","airplane-mode","enable")
    shell("shell","svc","wifi","disable");shell("shell","svc","data","disable")
    shell("shell","settings","put","global","mobile_data","0")
    // Preserve the earlier download fixture, then create the draft through the
    // last shared preview's actual UI before installing the Compose update.
    shell("install","-r",sharedBaseline)
    upgradeVersions.push(installedVersionCode())
    shell("shell","am","start","-n",`${pkg}/com.atmoshaper.app.MainActivity`)
    page=await connect()
    await expect(page.getByTestId("home-launcher")).toBeVisible()
    await go(page,"/tools/business-planner/plan-outline")
    const mission="Synthetic massage practice outline retained during the update."
    const missionField=page.getByLabel("Mission Statement notes",{exact:true})
    await missionField.fill(mission)
    const readDraft=()=>page.evaluate(key=>localStorage.getItem(key),PLAN_OUTLINE_STORAGE_KEY)
    await expect.poll(readDraft).toContain(mission)
    const draft=await readDraft()
    const readSharedTimer=()=>read(page,"atmoshaper.android.chimer-runtime.v1","clock","state")
    await expect.poll(async()=>(await readSharedTimer())?.timer.endsAtMs).toBe(old.timer.endsAt)
    const sharedTimer=await readSharedTimer()
    // WebView batches localStorage disk writes. Give the rendered draft time
    // to flush before simulating the process exit of an APK replacement.
    await page.waitForTimeout(5500)
    const sharedClosed=page.waitForEvent("close",{timeout:15000})
    shell("shell","am","force-stop",pkg)
    await sharedClosed
    shell("install","-r",nativeBaseline ?? apk)
    upgradeVersions.push(installedVersionCode())
    offline=true
    const launcher=shell("shell","cmd","package","resolve-activity","--brief","-a","android.intent.action.MAIN","-c","android.intent.category.LAUNCHER",pkg).split(/\r?\n/).at(-1)
    assert.ok(launcher.startsWith(`${pkg}/`),"Android resolves an installed launcher")
    async function startNativeHome({ fromPreviousTools = false } = {}) {
      shell("shell","am","start","-f","0x10200000","-a","android.intent.action.MAIN","-c","android.intent.category.LAUNCHER","-n",launcher)
      if (fromPreviousTools) {
        await expect.poll(()=>nativeHierarchy()).toMatch(/text="(?:Back to Home|Your tools)"/)
        if (nativeHierarchy().includes('text="Back to Home"')) await tapNativeLabel("Back to Home")
      }
      await expect.poll(()=>{
        const hierarchy=nativeHierarchy()
        return hierarchy.includes('text="Your tools"')&&!hierarchy.includes('class="android.webkit.WebView"')
      }).toBe(true)
    }
    async function openPreviousTools() {
      // Enter through a tool still served by the previous host in Stage 1.
      // Music is exercised separately as a native destination.
      await tapNativeLabel("My Calendar")
      await expect.poll(()=>nativeHierarchy()).toContain('text="Coming to the native app"')
      await tapNativeLabel("Open previous tools")
      page=await connect()
      await expect(page.getByTestId("home-launcher")).toBeVisible()
      // CDP can see the rendered page before Android hands it window focus.
      // Back and touch must target the foreground packaged host.
      await expect.poll(()=>shell("shell","dumpsys","window","displays"))
        .toMatch(/mCurrentFocus=Window\{[^\n]*com\.atmoshaper\.app\.development\/com\.atmoshaper\.app\.MainActivity/)
      await expect.poll(()=>page.evaluate(()=>document.visibilityState === "visible" && document.readyState === "complete")).toBe(true)
    }
    const readClockAppearance=()=>JSON.parse(shell("shell","run-as",pkg,"cat","files/clock-appearance.json"))
    const readNativeTimer=()=>JSON.parse(shell("shell","run-as",pkg,"cat","files/native-timer.json"))
    let earlierAppearance = null
    if (nativeBaseline) {
      // Seed the earlier Compose install through its real Clock and timer.
      // The next update exercises its native files as well as the older stores.
      await startNativeHome()
      await tapNativeLabel("Clock & timer")
      await expect.poll(()=>nativeHierarchy()).toMatch(/content-desc="Current time [^"]+"/)
      earlierAppearance = readClockAppearance()
      await tapNativeLabel("Open timer")
      await expect.poll(()=>nativeHierarchy()).toContain('text="Timer running"')
      assert.equal(readNativeTimer().deadlineMs,old.timer.endsAt)
      shell("shell","am","force-stop",pkg)
      shell("install","-r",apk)
      upgradeVersions.push(installedVersionCode())
    }
    assert.ok(upgradeVersions.every((version, index) => index === 0 || version > upgradeVersions[index - 1]),
      "Every installed update advances the package version")
    await startNativeHome()
    await writeFile(path.join(output,"android-native-home.png"),captureAndroidScreen())
    await tapNativeLabel("Clock & timer")
    await expect.poll(()=>nativeHierarchy()).toMatch(/content-desc="Current time [^"]+"/)
    const clockAppearance = readClockAppearance()
    if (earlierAppearance) assert.deepEqual(clockAppearance,earlierAppearance)
    assert.equal(clockAppearance.rememberedBackgroundId, "static-gradient", "Native Clock retains the earlier signed installation selection")
    assert.equal(clockAppearance.version,1)
    assert.equal(clockAppearance.format,old.timeFormat)
    assert.equal(clockAppearance.seconds,old.showSeconds)
    assert.equal(clockAppearance.firstColor.toLowerCase(),"#146b73")
    await tapNativeLabel("Fullscreen")
    await acknowledgeImmersiveTutorial()
    await tapNativeLabel("Exit fullscreen")
    await expect.poll(()=>nativeHierarchy().includes('text="Fullscreen"')).toBe(true)
    await tapNativeLabel("Close Clock")
    await tapNativeLabel("Clock & timer")
    await tapNativeLabel("Fullscreen")
    shell("shell","input","keyevent","KEYCODE_BACK")
    await expect.poll(()=>nativeHierarchy().includes('text="Fullscreen"')).toBe(true)
    await tapNativeLabel("Open timer")
    await expect.poll(()=>nativeHierarchy()).toContain('text="Timer running"')
    assert.equal(readNativeTimer().deadlineMs,old.timer.endsAt)
    // Bracket the hierarchy dump with device time. Accessibility can sample
    // the countdown anywhere in that interval under emulator scheduling.
    let previous = null
    await expect.poll(() => {
      const before=Number(shell("shell","date","+%s"))
      const hierarchy=nativeHierarchy()
      const after=Number(shell("shell","date","+%s"))
      if (hierarchy.includes('class="android.webkit.WebView"')) return false
      const parts = hierarchy.match(/text="(\d{2}):(\d{2}):(\d{2})"/)
      if (!parts) return false
      const shown = Number(parts[1]) * 3600 + Number(parts[2]) * 60 + Number(parts[3])
      const target = Math.ceil(old.timer.endsAt / 1000)
      if (shown <= 0 || shown < target - after - 2 || shown > target - before + 1) return false
      if (previous === null) { previous = shown; return false }
      return shown < previous
    }, { message:"Displayed timer matches the original deadline and counts down" }).toBe(true)
    await writeFile(path.join(output,"android-native-timer.png"),captureAndroidScreen())
    console.log("Android check: Open timer displayed the countdown with its original deadline.")
    shell("shell","input","keyevent","KEYCODE_BACK")
    await expect.poll(()=>nativeHierarchy().includes('text="Close Clock"')).toBe(true)
    await tapNativeLabel("Close Clock")
    await expect.poll(()=>nativeHierarchy().includes('text="Your tools"')).toBe(true)
    await tapNativeLabel("Open breathing guide")
    await tapNativeLabel("Start breathing")
    await expect.poll(()=>nativeHierarchy()).toContain('text="Pause breathing"')
    await writeFile(path.join(output,"android-native-breathing.png"),captureAndroidScreen())
    shell("shell","input","keyevent","KEYCODE_BACK")
    await tapNativeLabel("Clock & timer")
    await tapNativeLabel("Open timer")
    await expect.poll(()=>nativeHierarchy()).toContain('text="Timer running"')
    assert.equal(readNativeTimer().deadlineMs,old.timer.endsAt,"Breathing leaves the running timer's deadline intact")
    shell("shell","am","force-stop",pkg)
    shell("shell","am","start","-W","-a","android.intent.action.VIEW",
      "-n",`${pkg}/com.atmoshaper.app.MainActivity`,"-d","atmoshaper://tool?path=%2Fchimer%2F")
    await expect.poll(()=>nativeHierarchy()).toContain('text="Timer running"')
    assert.equal(readNativeTimer().deadlineMs,old.timer.endsAt)
    shell("shell","am","force-stop",pkg)
    await startNativeHome()
    await openPreviousTools()
    shell("shell","input","keyevent","KEYCODE_BACK")
    await expect.poll(()=>nativeHierarchy().includes('text="Coming to the native app"')).toBe(true)
    // Relaunch cold for preservation checks so CDP attaches to a fresh host
    // process after Android Back destroyed the first WebView.
    shell("shell","am","force-stop",pkg)
    await startNativeHome()
    await openPreviousTools()
    assert.deepEqual(await readSharedTimer(),sharedTimer)
    assert.equal(await page.evaluate(()=>navigator.userAgent.endsWith(" AtmoShaperNativeTimer/1")
      && typeof window.AtmoShaperTimerTransfer === "undefined"),true)
    const beforeTimer=await page.evaluate(()=>{
      window.timerReturnDocument = true
      return location.href
    })
    await go(page,"/chimer")
    await expect.poll(()=>nativeHierarchy()).toContain('text="Timer running"')
    assert.equal(readNativeTimer().deadlineMs,old.timer.endsAt)
    await tapNativeLabel("Close timer")
    // Android consumes the fixed URL without a WebView navigation commit.
    // Check the live document, including identity across the timer visit.
    await expect.poll(()=>page.evaluate(()=>({
      url:location.href,visible:document.visibilityState,original:window.timerReturnDocument,
    }))).toEqual({url:beforeTimer,visible:"visible",original:true})
    // A new CDP connection drops Playwright's pending navigation state
    // without reloading or restarting the document just verified above.
    page=await connect({sameProcess:true})
    assert.equal(await page.evaluate(()=>window.timerReturnDocument),true)
    await writeFile(path.join(output,"android-shared-home.png"),captureAndroidScreen())
    assert.deepEqual(await read(page,"atmoshaper.android.offline-core.v1","state","preferences"),old)
    assert.deepEqual(await downloadDigests(page),packs)
    assert.equal(await readDraft(),draft)
    const nextAccess=await read(page,"atmoshaper.android.background-access.v1","access","state")
    assert.equal(nextAccess.device,oldAccess.device);assert.equal(nextAccess.receipt,oldAccess.receipt)
    await tap(page,page.getByRole("link",{name:"Clock & timer",exact:true}))
    await expect(page.locator("[data-native-shared-clock]")).toBeVisible()
    await expect(page.getByTestId("running-current-time")).toBeVisible()
    await expect(page.getByTestId("running-current-time")).toHaveAttribute("data-immersive-primary-display","true")
    await expect(page.getByTestId("running-timer-clock")).toHaveCount(0)
    assert.deepEqual(await readSharedTimer(),sharedTimer)
    await writeFile(path.join(output,"android-shared-clock.png"),captureAndroidScreen())
    const beforeFullscreen=await page.evaluate(()=>location.href)
    await page.mouse.move(2,2) // Wake the Clock's intentionally auto-hidden controls.
    await tap(page,page.getByRole("button",{name:"Toggle fullscreen",exact:true}),true)
    await expect.poll(()=>page.evaluate(()=>Boolean(document.fullscreenElement))).toBe(true)
    await acknowledgeImmersiveTutorial()
    shell("shell","input","keyevent","KEYCODE_BACK")
    await expect.poll(()=>page.evaluate(()=>Boolean(document.fullscreenElement))).toBe(false)
    assert.equal(await page.evaluate(()=>location.href),beforeFullscreen,"Back exits fullscreen before navigating away")
    console.log("Android check: packaged routing reopened the native timer and shared Clock fullscreen Back passed.")
    await page.evaluate(()=>{
      window.__nonSilentStarts=0
      const start=AudioBufferSourceNode.prototype.start
      AudioBufferSourceNode.prototype.start=function(...args){
        const result = start.apply(this,args)
        if(this.context instanceof AudioContext && this.buffer?.getChannelData(0).some(value=>Math.abs(value)>0.00001)) {
          window.__stationAudioContext ??= this.context
          if (window.__stationAudioContext === this.context) window.__nonSilentStarts++
        }
        return result
      }
    })
    await go(page,"/music")
    await tap(page,page.getByRole("group",{name:"Station category"}).getByRole("button",{name:"Favorites",exact:true}))
    await tap(page,page.getByRole("button",{name:"Play Little Bells",exact:true}))
    await expect.poll(()=>page.evaluate(()=>window.__nonSilentStarts),{timeout:45000}).toBeGreaterThan(0)
    const playback = () => page.evaluate(()=>({
      visibility: document.visibilityState,
      starts: window.__nonSilentStarts,
      time: window.__stationAudioContext.currentTime,
      state: window.__stationAudioContext.state,
    }))
    await startNativeHome({ fromPreviousTools: true })
    await tapNativeLabel("Open breathing guide")
    await tapNativeLabel("Start breathing")
    await expect.poll(()=>nativeHierarchy()).toContain('text="Pause breathing"')
    await expect.poll(playback).toMatchObject({ visibility:"hidden",state:"running" })
    const duringBreathing = await playback()
    // A running media session or silent carrier alone is insufficient here.
    // Observe Web Audio time and newly scheduled buffers containing nonzero samples.
    await expect.poll(async()=>{
      const current = await playback()
      return current.visibility === "hidden" && current.state === "running"
        && current.time > duringBreathing.time + 0.5 && current.starts > duringBreathing.starts
    },{timeout:45000}).toBe(true)
    await tapNativeLabel("Pause breathing")
    await tapNativeLabel("Reset")
    shell("shell","input","keyevent","KEYCODE_BACK")
    await tapNativeLabel("My Calendar")
    await tapNativeLabel("Open previous tools")
    await expect.poll(playback).toMatchObject({ visibility:"visible",state:"running" })
    await go(page,"/wellness/breathing")
    await tap(page,page.getByRole("button",{name:"Start breathing",exact:true}))
    await expect(page.getByRole("button",{name:"Pause breathing",exact:true})).toBeVisible()
    await writeFile(path.join(output,"android-shared-breathing.png"),captureAndroidScreen())
    console.log("Android check: the saved station's Web Audio clock advanced and scheduled non-silent source buffers during native breathing. Shared breathing also passed offline.")
    await go(page,"/downloads")
    await tap(page,page.getByRole("button",{name:"Atmosphere sounds",exact:true}))
    await expect(page.getByRole("button",{name:"Atmosphere sounds",exact:true})).toHaveAttribute("aria-pressed","true")
    await page.getByLabel("Find a sound").fill(title)
    await expect(page.getByText(/Ready offline/)).toBeVisible()
    await go(page,"/tools/business-planner/plan-outline")
    await expect(page.getByLabel("Mission Statement notes",{exact:true})).toHaveValue(mission)
    await page.getByLabel("Go to planning step").selectOption({label:"5. Review"})
    await tap(page,page.getByRole("button",{name:"Download PDF report",exact:true}),true)
    await expect.poll(()=>shell("shell","dumpsys","activity","activities"),{timeout:20000}).toMatch(/com\.android\.documentsui/)
    if (/mInputShown=true/.test(shell("shell","dumpsys","input_method"))) {
      shell("shell","input","keyevent","KEYCODE_BACK")
      await expect.poll(()=>shell("shell","dumpsys","input_method")).not.toMatch(/mInputShown=true/)
    }
    shell("shell","input","keyevent","KEYCODE_BACK")
    await expect(page.getByRole("status")).toContainText("Save cancelled. Your draft is unchanged.")
    assert.equal(packs.length,2)
    assert.equal(shell("shell","settings","get","global","airplane_mode_on"),"1")
    assert.equal(shell("shell","settings","get","global","wifi_on"),"0")
    assert.deepEqual(errors,[]);assert.deepEqual(network,[])
    await writeFile(path.join(output,"acceptance.json"),JSON.stringify({
      apkSha256,
      fixture,
      nativeHome:true,
      nativeClock:true,
      nativeTimer:true,
      nativeBreathing:true,
      breathingRetainedTimerDeadline:true,
      webAudioAdvancedAndScheduledNonSilentSourcesDuringNativeBreathing:true,
      clockAppearanceTransferred:true,
      earlierNativeAppearancePreserved:earlierAppearance !== null,
      backFromPreviousTools:true,
      sharedWebsite:true,
      upgradeVersions,
      readOnlyLegacyImport:true,
      downloadCount:2,
      downloadBytesRetained:true,
      plannerDraftRetained:true,
      airplaneMode:true,
      restoredDeadline:true,
      stationScheduledNonSilentSources:true,
      speakerAudibilityVerified:false,
      fullscreenAndBack:true,
      pdfSaveDialogAndCancel:true,
      physicalDeviceVerified:false,
      connectedOriginVerified:false,
      checkedAt:new Date().toISOString(),
    },null,2))
  } catch (error) {
    failed = true
    if (page && !page.isClosed()) {
      try {
        await writeFile(path.join(output,"failure.json"), JSON.stringify({
          body: await page.locator("body").innerText({ timeout: 3000 }), errors, network,
        }, null, 2))
      } catch (diagnosticError) {
        console.error("Android fixture could not save failure diagnostics", diagnosticError)
      }
    }
    throw error
  } finally {
    // Browser and relay ownership are independent. A failed close must still
    // release its relay and leave every later connection eligible for cleanup.
    const cleanupErrors = []
    for (const { port, browser } of connections) {
      try { await browser?.close() }
      catch (error) { cleanupErrors.push(error) }
      try { shell("forward","--remove",`tcp:${port}`) }
      catch (error) { cleanupErrors.push(error) }
    }
    if (cleanupErrors.length) {
      const error = new AggregateError(cleanupErrors, "Android fixture cleanup failed")
      if (!failed) throw error
      console.error(error)
    }
  }
})
