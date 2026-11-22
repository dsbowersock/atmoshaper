import test from "node:test"
import assert from "node:assert/strict"
import { readFile, mkdir } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium, expect } from "@playwright/test"
import { OFFLINE_CORE_STORAGE_KEY } from "../lib/offline-core.js"
import { buildOfflineCore } from "../scripts/build-offline-core.mjs"

const root=fileURLToPath(new URL("..",import.meta.url))
const core=path.join(root,"output/offline-acceptance-core/core")
const entry="https://appassets.androidplatform.net/assets/core/index.html"
const evidence=process.env.ATMOSHAPER_OFFLINE_EVIDENCE_DIR
const mime={".html":"text/html",".js":"text/javascript",".css":"text/css",".png":"image/png",".woff2":"font/woff2",".mp3":"audio/mpeg",".txt":"text/plain"}

/** Match the native asset loader: fresh local files, no server/cache/network. */
async function attachAssets(context, violations) {
  await context.setOffline(true)
  await context.route("**/*",async route=>{
    const request=route.request(),url=new URL(request.url())
    if(request.method()!=="GET"||url.origin!=="https://appassets.androidplatform.net"||!url.pathname.startsWith("/assets/core/")){
      violations.push(request.method()+" "+request.url());return route.abort()
    }
    const filename=path.resolve(core,decodeURIComponent(url.pathname.slice("/assets/core/".length)))
    if(!filename.startsWith(core+path.sep)){violations.push("outside packaged assets");return route.abort()}
    try {await route.fulfill({body:await readFile(filename),contentType:mime[path.extname(filename)]??"application/octet-stream"})}
    catch {violations.push(url.pathname);await route.abort()}
  })
}

test("packaged Clock, timer, breathing and backgrounds work from a first offline launch",{timeout:180000},async()=>{
  await buildOfflineCore({outputName:"offline-acceptance-core"})
  const violations=[],errors=[]
  const browser=await chromium.launch()
  if(evidence)await mkdir(evidence,{recursive:true})
  try {
    for(const [name,width,height] of [["phone",390,844],["landscape",852,393],["desktop",1280,900]]){
      const context=await browser.newContext({viewport:{width,height},reducedMotion:"reduce",serviceWorkers:"block"})
      await attachAssets(context,violations)
      const page=await context.newPage()
      page.on("pageerror",error=>errors.push(error.message))
      page.on("console",message=>{if(message.type()==="error")errors.push(message.text())})
      await page.goto(entry)
      assert.equal(await page.evaluate(()=>navigator.onLine),false)
      assert.equal(await page.title(),"AtmoShaper Offline Tools")
      await expect(page.getByRole("heading",{name:"Clock",exact:true})).toBeVisible()
      await page.evaluate(()=>document.fonts.ready)
      assert.ok(await page.evaluate(()=>document.fonts.check('700 32px "Digital Clock"')))
      await expect(page.locator("[data-offline-clock]")).toHaveAttribute("aria-label",/\d\d:\d\d [AP]M/)
      await page.getByRole("checkbox",{name:"24-hour time"}).check()
      await page.getByRole("checkbox",{name:"Show seconds"}).check()
      await expect(page.locator("[data-offline-clock]")).toHaveAttribute("aria-label",/\d\d:\d\d:\d\d\s*$/)
      if(evidence)await page.screenshot({path:path.join(evidence,`${name}-clock.png`)})

      await page.getByRole("button",{name:"Backgrounds",exact:true}).click()
      for(const [label,id] of [["In Transition","static-gradient"],["Solid Color","solid-color"],["Lava Lamp","massage-lab-moving-gradient"]]){
        await page.getByRole("button",{name:label,exact:true}).click()
        await expect(page.locator("[data-offline-background]")).toHaveAttribute("data-offline-background",id)
      }
      await page.getByLabel("Main color",{exact:true}).fill("#146b73")
      await expect(page.locator("main")).toHaveAttribute("data-offline-save-state","saved")
      await page.reload()
      await expect(page.getByLabel("Main color",{exact:true})).toHaveValue("#146b73")
      if(evidence)await page.screenshot({path:path.join(evidence,`${name}-backgrounds.png`)})

      await page.getByRole("button",{name:"Timer",exact:true}).click()
      await page.getByLabel("Timer hours",{exact:true}).fill("0")
      await page.getByLabel("Timer minutes",{exact:true}).fill("0")
      await page.getByLabel("Timer seconds",{exact:true}).fill("8")
      await page.getByRole("button",{name:"Start timer",exact:true}).click()
      await expect(page.locator("[data-timer-status]")).toHaveText("running")
      await page.getByRole("button",{name:"Pause timer",exact:true}).click()
      const paused=await page.locator("[data-offline-timer]").textContent()
      await expect(page.locator("main")).toHaveAttribute("data-offline-save-state","saved")
      await page.reload()
      await expect(page.locator("[data-timer-status]")).toHaveText("paused")
      await expect(page.locator("[data-offline-timer]")).toHaveText(paused)
      await page.getByRole("button",{name:"Resume timer",exact:true}).click()
      const panelBox=await page.locator('section[aria-labelledby="timer-title"]').boundingBox()
      const statusBox=await page.getByRole("status").last().boundingBox()
      assert.ok(statusBox.y>=panelBox.y+panelBox.height-1,`${name}: save/alert status stays below the timer controls`)
      await expect(page.locator("main")).toHaveAttribute("data-offline-save-state","saved")
      if(evidence)await page.screenshot({path:path.join(evidence,`${name}-timer.png`)})
      await page.getByRole("button",{name:"Breathing",exact:true}).click()
      await page.getByRole("button",{name:"Box 4 sides",exact:true}).click()
      await page.getByRole("button",{name:"Start breathing",exact:true}).click()
      await expect(page.locator("[data-breathing-phase]")).toHaveText("Inhale")
      await expect(page.locator("[data-breathing-countdown]")).not.toHaveText("4")
      await page.getByRole("button",{name:"Pause breathing",exact:true}).click()
      await expect(page.locator("[data-breathing-phase]")).toHaveText("Paused")
      if(evidence)await page.screenshot({path:path.join(evidence,`${name}-breathing.png`)})
      await page.getByRole("button",{name:"Reset breathing",exact:true}).click()
      await expect(page.locator("[data-breathing-phase]")).toHaveText("Ready")
      await page.getByRole("button",{name:"Timer",exact:true}).click()
      await expect(page.locator("[data-timer-status]")).toHaveText("complete",{timeout:12000})
      await expect(page.getByRole("status").last()).toHaveText("Timer finished.")
      await page.getByRole("button",{name:"Reset timer",exact:true}).click()
      await expect(page.locator("[data-timer-status]")).toHaveText("Set your time")
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+" viewport is contained")
      await expect(page.locator("main")).toHaveAttribute("data-offline-save-state","saved")
      assert.ok(await page.evaluate(key=>new Promise(resolve=>{
        const request=indexedDB.open(key)
        request.onsuccess=()=>{const query=request.result.transaction("state").objectStore("state").get("preferences");query.onsuccess=()=>{resolve(query.result.timer.status==="idle");request.result.close()}}
      }),OFFLINE_CORE_STORAGE_KEY))
      await context.close()
    }
    assert.deepEqual(violations,[])
    assert.deepEqual(errors,[])
  }finally{await browser.close()}
})
