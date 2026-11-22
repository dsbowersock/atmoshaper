import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import { chromium, expect } from "@playwright/test"

// This acceptance check is deliberately confined to the guest-only loopback
// preview; synthetic account states are covered by the component fixture.
const origin="http://127.0.0.1:3025"
await mkdir("output/home-dashboard",{recursive:true})
const browser=await chromium.launch()
const receipts=[]
try {
  for(const [name,width,height] of [["phone",390,844],["tablet",768,1024],["desktop",1280,900]]) {
    const context=await browser.newContext({viewport:{width,height},serviceWorkers:"block",reducedMotion:"reduce"})
    const page=await context.newPage();const errors=[];const external=[]
    page.on("pageerror",(error)=>{errors.push(error.message);console.error(error.message)})
    page.on("console",(message)=>{if(message.type()==="error"||message.text().includes("Missing `Description`")){errors.push(message.text());console.error(message.text())}})
    await context.route("**/*",(route)=>{
      const url=new URL(route.request().url())
      if(url.hostname!=="127.0.0.1"){external.push(`${url.origin}${url.pathname}`);return route.abort()}
      return route.continue()
    })
    await page.goto(origin,{waitUntil:"domcontentloaded",timeout:120000})
    await expect(page.getByTestId("home-launcher")).toBeVisible({timeout:60000})
    await expect(page.getByRole("button",{name:"All tools",exact:true})).toBeEnabled({timeout:60000})
    await page.evaluate(()=>document.fonts.ready)
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
    const first=await page.getByRole("button",{name:"Use dashboard",exact:true}).boundingBox()
    if(name==="phone")assert.ok(first.y+first.height<height-60,"intro finishes above navigation")
    await page.screenshot({path:`output/home-dashboard/native-${name}-first.png`})
    await page.getByRole("button",{name:"All tools",exact:true}).click()
    const dialog=page.getByRole("dialog",{name:"All tools",exact:true})
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole("link",{name:"My Calendar",exact:true})).toHaveAttribute("href","/calendar/personal")
    await expect(dialog.getByRole("link",{name:"Practice Calendar",exact:true})).toHaveAttribute("href","/calendar?setup=practice")
    await page.screenshot({path:`output/home-dashboard/native-${name}-directory.png`})
    await dialog.getByRole("button",{name:"Close",exact:true}).press("Escape")
    await expect(dialog).toHaveCount(0)
    await expect(page.getByRole("button",{name:"All tools",exact:true})).toBeFocused()
    await page.getByRole("button",{name:"Use dashboard",exact:true}).click()
    await page.reload({waitUntil:"domcontentloaded"})
    await expect(page.getByRole("heading",{name:"Your tools",exact:true})).toBeVisible()
    await page.screenshot({path:`output/home-dashboard/native-${name}-returning.png`})
    await page.getByRole("button",{name:"Use light theme",exact:true}).click()
    await expect(page.locator("html")).toHaveClass(/light/)
    await page.screenshot({path:`output/home-dashboard/native-${name}-light.png`})
    await page.getByRole("button",{name:"Use dark theme",exact:true}).click()
    if(name==="phone"){
      await page.getByTestId("home-launcher").getByRole("link",{name:"Clock & timer",exact:true}).click()
      // Next dev compiles the destination on its first visit. Production does
      // not pay this cost; wait for completion instead of testing a 5s compiler.
      await expect(page).toHaveURL(/\/clock$/,{timeout:60000})
      // Clock may enter its existing immersive view and hide global controls.
      await page.goBack({waitUntil:"domcontentloaded"})
      await expect(page.getByRole("heading",{name:"Your tools",exact:true})).toBeVisible({timeout:60000})
    }
    assert.deepEqual(errors,[]);assert.deepEqual(external,[])
    receipts.push({name,width,height,overflow:false,errors,external,passed:true})
    console.log(`Passed ${name} home: ${width} x ${height}`)
    await context.close()
  }
  await writeFile("output/home-dashboard/native-acceptance.json",JSON.stringify(receipts,null,2)+"\n")
  console.log("Passed native guest home acceptance on phone, tablet and desktop.")
}finally{await browser.close()}
