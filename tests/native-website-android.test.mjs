import test from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { readFile, mkdir, writeFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { _android as android } from "playwright"
import { expect } from "@playwright/test"
import { offlineAudioCatalog } from "../lib/offline-media.js"
import { createDefaultAtmosphereStorage, ATMOSPHERE_STORAGE_KEY } from "../lib/atmosphere/storage.js"

const root=fileURLToPath(new URL("..",import.meta.url))
const adb=path.join(root,"output/android-tools/sdk/platform-tools",process.platform==="win32"?"adb.exe":"adb")
const serial="emulator-5582",avd="AtmoShaper_WebParity_35",pkg="com.atmoshaper.app.development"
const shell=(...args)=>execFileSync(adb,["-s",serial,...args],{encoding:"utf8",timeout:45000,windowsHide:true}).trim()
const output=path.join(root,"output/native-website-android")

/** No serial/package argument is accepted. The owner-receipt emulator 5580 and
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

test("replacement APK upgrades the earlier preview without losing downloads/settings and runs the shared tools offline",{timeout:300000,skip:process.env.ATMOSHAPER_ANDROID_WEBSITE_TEST!=="1"},async()=>{
  assertOwnedFixture()
  await mkdir(output,{recursive:true})
  const baseline=path.resolve(root,"../../output/android/AtmoShaper-offline-preview-0.3.0-8abbb7c3.apk")
  assert.equal(createHash("sha256").update(await readFile(baseline)).digest("hex"),"8abbb7c366aa75d03f207428e19bafa0f673fff104d7e34c92dc3500ff43af4a")
  const apk=path.join(root,"output/android/AtmoShaper-preview.apk")
  const manifest=JSON.parse(execFileSync("python",[path.join(root,"tests/helpers/offline-apk-inventory.py"),apk],{encoding:"utf8",windowsHide:true}))
  assert.deepEqual(manifest,JSON.parse(await readFile(path.join(root,"output/offline-core/bundle-proof.json"))))
  assert.equal(manifest.sharedWebsite,true);assert.equal(manifest.syntheticReceiptAuthority,false)
  shell("shell","am","force-stop",pkg)
  shell("install","-r","-d",baseline)
  assert.equal(shell("shell","pm","clear",pkg),"Success")
  shell("shell","cmd","connectivity","airplane-mode","disable")
  shell("shell","svc","wifi","enable")
  shell("shell","am","start","-n",`${pkg}/com.atmoshaper.app.MainActivity`)
  const devices=await android.devices({omitDriverInstall:true}),device=devices.find(value=>value.serial()===serial)
  assert.ok(device);device.setDefaultTimeout(20000)
  let lastPid=null,offline=false
  const errors=[],network=[]
  async function connect() {
    if(lastPid!==null)await expect.poll(async()=>(await device.webView({pkg},{timeout:20000})).pid(),{timeout:20000}).not.toBe(lastPid)
    const view=await device.webView({pkg},{timeout:20000});lastPid=view.pid()
    const page=await view.page()
    page.on("pageerror",error=>errors.push(error.message))
    page.on("request",request=>{if(offline && request.url().startsWith("https://media."))network.push(request.url())})
    return page
  }
  async function read(page,name,store,key) {
    return page.evaluate(({name,store,key})=>new Promise((resolve,reject)=>{
      const open=indexedDB.open(name);open.onerror=()=>reject(open.error)
      open.onsuccess=()=>{const db=open.result,request=db.transaction(store).objectStore(store).get(key);request.onsuccess=()=>{db.close();resolve(request.result)};request.onerror=()=>reject(request.error)}
    }),{name,store,key})
  }
  const go=(page,route)=>page.evaluate(route=>window.dispatchEvent(new CustomEvent("atmoshaper:native-navigation",{detail:route})),route)
  let page
  try {
    page=await connect()
    await page.getByRole("button",{name:"Music",exact:true}).click()
    await page.getByLabel("Find a sound").fill("Little Bells")
    await page.getByRole("button",{name:"Download Little Bells",exact:true}).click()
    await expect(page.getByText("Little Bells is ready offline.",{exact:true})).toBeVisible({timeout:90000})
    const catalog=JSON.parse(await readFile(path.join(root,"data/atmoshaper/production-audio-catalog.json")))
    const size=item=>item.sources.reduce((sum,source)=>sum+source.formats.find(format=>format.id==="opus").byteSize,0)
    const ambient=[...catalog.concepts].sort((a,b)=>size(a)-size(b))[0]
    const title=offlineAudioCatalog(catalog).find(item=>item.id===ambient.id).title
    await page.getByRole("button",{name:"Atmosphere sounds",exact:true}).click()
    await page.getByLabel("Find a sound").fill(title)
    await page.getByRole("button",{name:`Download ${title}`,exact:true}).click()
    await expect(page.getByText(`${title} is ready offline.`,{exact:true})).toBeVisible({timeout:90000})
    await page.getByRole("button",{name:"Backgrounds",exact:true}).click()
    await page.getByRole("button",{name:"In Transition",exact:true}).click()
    await page.getByLabel("Main color",{exact:true}).fill("#146b73")
    await page.getByRole("button",{name:"Timer",exact:true}).click()
    await page.getByLabel("Timer hours",{exact:true}).fill("0")
    await page.getByLabel("Timer minutes",{exact:true}).fill("5")
    await page.getByLabel("Timer seconds",{exact:true}).fill("0")
    await page.getByRole("button",{name:"Start timer",exact:true}).click()
    await expect(page.locator("main")).toHaveAttribute("data-offline-save-state","saved")
    const old=await read(page,"atmoshaper.android.offline-core.v1","state","preferences")
    const packs=await page.evaluate(()=>new Promise(resolve=>{const open=indexedDB.open("atmoshaper.android.media.v1");open.onsuccess=()=>{const db=open.result,request=db.transaction("metadata").objectStore("metadata").getAll();request.onsuccess=()=>{db.close();resolve(request.result)}}}))
    const oldAccess=await read(page,"atmoshaper.android.background-access.v1","access","state")
    const closed=page.waitForEvent("close",{timeout:15000});shell("shell","am","force-stop",pkg);await closed
    shell("shell","cmd","connectivity","airplane-mode","enable")
    shell("shell","svc","wifi","disable");shell("shell","svc","data","disable")
    shell("shell","settings","put","global","mobile_data","0")
    shell("install","-r",apk)
    offline=true
    shell("shell","am","start","-n",`${pkg}/com.atmoshaper.app.MainActivity`)
    page=await connect()
    await expect(page.getByTestId("home-launcher")).toBeVisible()
    await writeFile(path.join(output,"android-shared-home.png"),await device.screenshot())
    assert.deepEqual(await read(page,"atmoshaper.android.offline-core.v1","state","preferences"),old)
    const nextAccess=await read(page,"atmoshaper.android.background-access.v1","access","state")
    assert.equal(nextAccess.device,oldAccess.device);assert.equal(nextAccess.receipt,oldAccess.receipt)
    await page.getByRole("link",{name:"Clock & timer",exact:true}).click()
    await expect(page.locator("[data-native-shared-clock]")).toBeVisible()
    await expect.poll(async()=>(await read(page,"atmoshaper.android.chimer-runtime.v1","clock","state"))?.timer.endsAtMs).toBe(old.timer.endsAt)
    await writeFile(path.join(output,"android-shared-clock.png"),await device.screenshot())
    await page.evaluate(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key:ATMOSPHERE_STORAGE_KEY,value:{...createDefaultAtmosphereStorage(),favorites:["generative-fm-little-bells"]}})
    await page.reload()
    await page.evaluate(()=>{
      window.__nonSilentStarts=0
      const start=AudioBufferSourceNode.prototype.start
      AudioBufferSourceNode.prototype.start=function(...args){if(this.context instanceof AudioContext && this.buffer?.getChannelData(0).some(value=>Math.abs(value)>0.00001))window.__nonSilentStarts++;return start.apply(this,args)}
    })
    await go(page,"/music")
    await page.getByRole("group",{name:"Station category"}).getByRole("button",{name:"Favorites",exact:true}).click()
    await page.getByRole("button",{name:"Play Little Bells",exact:true}).click()
    await expect.poll(()=>page.evaluate(()=>window.__nonSilentStarts),{timeout:45000}).toBeGreaterThan(0)
    await go(page,"/wellness/breathing")
    await page.getByRole("button",{name:"Start breathing",exact:true}).click()
    await expect(page.getByRole("button",{name:"Pause breathing",exact:true})).toBeVisible()
    await writeFile(path.join(output,"android-shared-breathing.png"),await device.screenshot())
    await go(page,"/downloads")
    await page.getByRole("button",{name:"Atmosphere sounds",exact:true}).click()
    await page.getByLabel("Find a sound").fill(title)
    await expect(page.getByText(/Ready offline/)).toBeVisible()
    assert.equal(packs.length,2)
    assert.equal(shell("shell","settings","get","global","airplane_mode_on"),"1")
    assert.equal(shell("shell","settings","get","global","wifi_on"),"0")
    assert.deepEqual(errors,[]);assert.deepEqual(network,[])
    await writeFile(path.join(output,"acceptance.json"),JSON.stringify({apkSha256:createHash("sha256").update(await readFile(apk)).digest("hex"),sharedWebsite:true,upgradeFromVersion:3,readOnlyLegacyImport:true,downloadCount:2,airplaneMode:true,restoredDeadline:true,nonSilentStationPlayback:true,physicalDeviceVerified:false,connectedOriginVerified:false,checkedAt:new Date().toISOString()},null,2))
  } catch(error) { if(page&&!page.isClosed())await writeFile(path.join(output,"failure.json"),JSON.stringify({body:await page.locator("body").innerText(),errors,network},null,2));throw error }
  finally {await Promise.all(devices.map(value=>value.close()))}
})
