import assert from "node:assert/strict"
import { mkdir } from "node:fs/promises"
import test from "node:test"
import { chromium, expect } from "@playwright/test"
import { createPracticePaymentsBundle, startPracticePaymentsPreview } from "./fixtures/practice-payments-preview.mjs"

test("both processor workflows retain mobile containment, consent, deposit credit and explicit fee review",{timeout:180000},async()=>{
  let server,browser
  const errors=[],violations=[]
  try {
    server=await startPracticePaymentsPreview(await createPracticePaymentsBundle())
    browser=await chromium.launch()
    await mkdir("output/practice-payments",{recursive:true})
    for(const [name,width,height] of [["narrow",320,640],["phone",390,844],["tablet",768,1024],["desktop",1440,900]]){
      const context=await browser.newContext({viewport:{width,height},reducedMotion:"reduce",serviceWorkers:"block"})
      await context.route("**/*",route=>{
        const request=route.request()
        if(new URL(request.url()).origin!==server.origin||request.method()!=="GET"){violations.push(request.method()+" "+request.url());return route.abort()}
        return route.continue()
      })
      const page=await context.newPage();page.on("pageerror",e=>errors.push(e.message))
      for(const provider of ["Stripe","Square"]){
        await page.goto(server.origin)
        await page.getByRole("button",{name:provider,exact:true}).click()
        await expect(page.getByRole("heading",{name:"Your payment account"})).toBeVisible()
        await expect(page.getByText(`Create your account with ${provider}`,{exact:true})).toBeVisible()
        await page.getByRole("button",{name:"Preview new-account setup",exact:true}).click()
        await expect(page.getByText("Verification pending (simulated)")).toBeVisible()
        await page.getByRole("button",{name:"Simulate verification complete",exact:true}).click()
        await expect(page.getByText("Ready (simulated)")).toBeVisible()
        await page.getByRole("button",{name:"2. Booking",exact:true}).click()
        await expect(page.getByTestId("booking-due-now")).toHaveText("$25.00")
        await expect(page.getByTestId("booking-balance")).toHaveText("$75.00")
        await expect(page.getByRole("button",{name:"Prepare example booking"})).toBeDisabled()
        await page.getByRole("checkbox",{name:/Example client agrees/}).check()
        await page.getByLabel("No-show fee in dollars").fill("49.00")
        await expect(page.getByRole("checkbox",{name:/Example client agrees/})).not.toBeChecked()
        await expect(page.getByRole("button",{name:"Prepare example booking"})).toBeDisabled()
        await page.getByLabel("No-show fee in dollars").fill("50.00")
        await page.getByRole("checkbox",{name:/Example client agrees/}).check()
        await page.getByRole("button",{name:"Prepare example booking",exact:true}).click()
        await expect(page.getByRole("button",{name:"Prepare example booking"})).toBeDisabled()
        await expect(page.getByLabel("Appointment price in dollars")).toBeDisabled()
        const textBox=await page.getByText("The example booking keeps its accepted settings.",{exact:false}).boundingBox()
        const resetBox=await page.getByRole("button",{name:"Reset example booking"}).boundingBox()
        assert.ok(textBox&&resetBox&&(textBox.y+textBox.height<=resetBox.y||textBox.x+textBox.width<=resetBox.x||resetBox.x+resetBox.width<=textBox.x),`${name}: booking notice and reset button do not overlap`)
        if(provider==="Stripe")await page.screenshot({path:`output/practice-payments/${name}-booking.png`,fullPage:true})
        await page.getByRole("button",{name:"3. Collect",exact:true}).click()
        await expect(page.getByTestId("collection-balance")).toHaveText("$75.00")
        await expect(page.getByRole("button",{name:"Phone payment unavailable in this preview"})).toBeDisabled()
        await page.getByRole("button",{name:"4. Fee review",exact:true}).click()
        await expect(page.getByTestId("additional-fee")).toHaveText("$25.00")
        if(provider==="Stripe")await page.screenshot({path:`output/practice-payments/${name}-fee-review.png`,fullPage:true})
        await page.getByRole("button",{name:"Simulate reviewed fee",exact:true}).click()
        await expect(page.getByRole("button",{name:"Simulate reviewed fee"})).toBeDisabled()
        await expect(page.getByTestId("additional-fee")).toHaveText("$0.00")
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${name} ${provider} is contained`)
        await page.getByRole("button",{name:"1. Set up",exact:true}).click()
        await page.getByRole("button",{name:provider==="Stripe"?"Square":"Stripe",exact:true}).click()
        await expect(page.getByTestId("account-state")).toHaveText("Not connected")
        await page.getByRole("button",{name:"4. Fee review",exact:true}).click()
        await expect(page.getByRole("button",{name:"Simulate reviewed fee"})).toBeDisabled()
      }
      await context.close()
    }
    assert.deepEqual(errors,[]);assert.deepEqual(violations,[])
    assert.equal((await fetch(server.origin,{method:"POST",body:"not-card-data"})).status,405)
  } finally {
    try {await browser?.close()}finally{await server?.close()}
  }
})
