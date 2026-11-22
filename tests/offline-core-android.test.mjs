import test from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { readFile, mkdir, writeFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { _android as android } from "playwright"
import { expect } from "@playwright/test"

const root=fileURLToPath(new URL("..",import.meta.url))
const adb=path.join(root,"output/android-tools/sdk/platform-tools",process.platform==="win32"?"adb.exe":"adb")
const serial="emulator-5580",avd="AtmoShaper_Offline_35",pkg="com.atmoshaper.app.development"
const shell=(...args)=>execFileSync(adb,["-s",serial,...args],{encoding:"utf8",timeout:30000,windowsHide:true}).trim()
const evidence=process.env.ATMOSHAPER_OFFLINE_EVIDENCE_DIR

test("Android APK cold-launches and retains timer/background state in airplane mode",{timeout:180000,skip:process.env.ATMOSHAPER_ANDROID_OFFLINE_TEST!=="1"},async()=>{
  // No caller-supplied serial/package is accepted. Test mutations belong only
  // to this task's named empty emulator and development package, never a phone.
  assert.equal(shell("emu","avd","name").split(/\r?\n/)[0].trim(),avd)
  const apk=path.join(root,"output/android/AtmoShaper-preview.apk")
  const manifest=JSON.parse(execFileSync("python",[path.join(root,"tests/helpers/offline-apk-inventory.py"),apk],{encoding:"utf8",windowsHide:true}))
  assert.deepEqual(manifest,JSON.parse(await readFile(path.join(root,"output/offline-core/bundle-proof.json"),"utf8")),"the APK contains the current verified source bundle")
  shell("shell","cmd","connectivity","airplane-mode","enable")
  shell("shell","svc","wifi","disable")
  shell("shell","svc","data","disable")
  assert.equal(shell("shell","settings","get","global","airplane_mode_on"),"1")
  assert.equal(shell("shell","settings","get","global","wifi_on"),"0")
  assert.equal(shell("shell","settings","get","global","mobile_data"),"0")
  shell("install","-r",apk)
  // Downloads need Internet permission; this core check still starts cold with
  // airplane mode enabled and never depends on a successful network request.
  assert.match(shell("shell","dumpsys","package",pkg),/android\.permission\.INTERNET/)
  assert.equal(shell("shell","pm","clear",pkg),"Success")
  shell("shell","am","start","-n",`${pkg}/com.atmoshaper.app.MainActivity`)
  const devices=await android.devices({omitDriverInstall:true})
  const device=devices.find(candidate=>candidate.serial()===serial)
  assert.ok(device,"the isolated test emulator is connected")
  device.setDefaultTimeout(15000)
  const errors=[],requests=[]
  let previousPid = null
  async function connect() {
    // Android discovery polls asynchronously; do not reconnect the closed old
    // socket while its replacement process is still being discovered.
    if (previousPid !== null) await expect.poll(async()=> (await device.webView({pkg},{timeout:20000})).pid(), {timeout:20000}).not.toBe(previousPid)
    const view=await device.webView({pkg},{timeout:20000})
    previousPid = view.pid()
    const page=await view.page()
    page.on("pageerror",error=>errors.push(error.message))
    page.on("request",request=>requests.push(request.url()))
    return page
  }
  if(evidence)await mkdir(evidence,{recursive:true})
  async function savedState(page) {
    await expect(page.locator("main")).toHaveAttribute("data-offline-save-state","saved",{timeout:15000})
    return page.evaluate(()=>new Promise(resolve=>{
      const request=indexedDB.open("atmoshaper.android.offline-core.v1")
      request.onsuccess=()=>{const query=request.result.transaction("state").objectStore("state").get("preferences");query.onsuccess=()=>{resolve(query.result);request.result.close()}}
    }))
  }
  try {
    let page=await connect()
    await expect(page.getByRole("heading",{name:"Clock",exact:true})).toBeVisible({timeout:20000})
    assert.equal(await page.title(),"AtmoShaper Offline Tools")
    await page.evaluate(()=>document.fonts.ready)
    assert.ok(await page.evaluate(()=>document.fonts.check('700 32px "Digital Clock"')))
    if(evidence)await writeFile(path.join(evidence,"android-clock.png"),await device.screenshot())
    await page.getByRole("button",{name:"Backgrounds",exact:true}).click()
    await page.getByRole("button",{name:"In Transition",exact:true}).click()
    await page.getByLabel("Main color",{exact:true}).fill("#146b73")
    await page.getByRole("button",{name:"Timer",exact:true}).click()
    await page.getByLabel("Timer hours",{exact:true}).fill("0")
    await page.getByLabel("Timer minutes",{exact:true}).fill("5")
    await page.getByLabel("Timer seconds",{exact:true}).fill("0")
    await page.getByRole("button",{name:"Start timer",exact:true}).click()
    await expect(page.locator("[data-timer-status]")).toHaveText("running")
    const before=await savedState(page)
    const closed=page.waitForEvent("close")
    shell("shell","am","force-stop",pkg)
    await closed
    shell("shell","am","start","-n",`${pkg}/com.atmoshaper.app.MainActivity`)
    page=await connect()
    await expect(page.locator("[data-timer-status]")).toHaveText("running")
    const after=await savedState(page)
    assert.equal(after.timer.endsAt,before.timer.endsAt)
    assert.equal(after.backgroundId,"static-gradient")
    assert.equal(after.mainColor,"#146b73")
    await page.getByRole("button",{name:"Pause timer",exact:true}).click()
    const paused=await page.locator("[data-offline-timer]").textContent()
    await savedState(page)
    await page.reload()
    await expect(page.locator("[data-timer-status]")).toHaveText("paused")
    await expect(page.locator("[data-offline-timer]")).toHaveText(paused)
    await page.getByRole("button",{name:"Reset timer",exact:true}).click()
    await page.getByLabel("Timer minutes",{exact:true}).fill("0")
    await page.getByLabel("Timer seconds",{exact:true}).fill("20")
    await page.getByRole("button",{name:"Test alert",exact:true}).click()
    await expect(page.getByRole("status").last()).toHaveText("Test alert played.")
    await page.evaluate(()=>{
      window.__timerChimeOscillators=0
      const start=OscillatorNode.prototype.start
      OscillatorNode.prototype.start=function(...args){window.__timerChimeOscillators++;return start.apply(this,args)}
    })
    await page.getByRole("button",{name:"Start timer",exact:true}).click()
    const rotationDeadline=(await savedState(page)).timer.endsAt
    const rotationPid=(await device.webView({pkg})).pid()
    shell("shell","wm","user-rotation","lock","1")
    await expect.poll(()=>page.evaluate(()=>innerWidth>innerHeight),{timeout:10000}).toBe(true)
    assert.equal((await device.webView({pkg})).pid(),rotationPid,"rotation preserves the live WebView/audio context")
    assert.equal((await savedState(page)).timer.endsAt,rotationDeadline)
    await expect(page.locator("[data-timer-status]")).toHaveText("complete",{timeout:25000})
    assert.equal(await page.evaluate(()=>window.__timerChimeOscillators),2,"one completion chime schedules its two notes, without another gesture")
    await expect(page.getByRole("status").last()).toHaveText("Timer finished.")
    shell("shell","wm","user-rotation","lock","0")
    if(evidence)await writeFile(path.join(evidence,"android-timer.png"),await device.screenshot())
    await page.getByRole("button",{name:"Breathing",exact:true}).click()
    await page.getByRole("button",{name:"Start breathing",exact:true}).click()
    await expect(page.locator("[data-breathing-phase]")).toHaveText("Inhale")
    await expect(page.locator("[data-breathing-countdown]")).not.toHaveText("5")
    await page.getByRole("button",{name:"Pause breathing",exact:true}).click()
    await expect(page.locator("[data-breathing-phase]")).toHaveText("Paused")
    if(evidence)await writeFile(path.join(evidence,"android-breathing.png"),await device.screenshot())
    assert.deepEqual(errors,[])
    assert.ok(requests.every(url=>url.startsWith("https://appassets.androidplatform.net/assets/core/")))
    const proof={apkSha256:createHash("sha256").update(await readFile(apk)).digest("hex"),airplaneMode:true,wifi:false,cellular:false,internetPermission:true,firstLaunch:true,processRestart:true,coreToolsPassed:true,assetCount:manifest.files.length,physicalDeviceVerified:false,checkedAt:new Date().toISOString()}
    await writeFile(path.join(root,"output/android/offline-emulator-proof.json"),JSON.stringify(proof,null,2))
  }finally{await Promise.all(devices.map(item=>item.close()))}
})
