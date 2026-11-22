import assert from "node:assert/strict"
import { mkdir } from "node:fs/promises"
import test from "node:test"
import { chromium, expect } from "@playwright/test"
import { createHomeDashboardBundle, startHomeDashboardFixture } from "./fixtures/home-dashboard-browser-harness.mjs"

test("real home dashboard stays contained and supports visitor, returning and account states", {timeout:120000},async()=>{
  const server=await startHomeDashboardFixture(await createHomeDashboardBundle())
  const browser=await chromium.launch()
  await mkdir("output/home-dashboard",{recursive:true})
  try {
    for (const [name,width,height,sidebar] of [["phone",390,844,0],["narrow",320,640,0],["tablet",768,1024,272],["desktop",1280,900,272],["short",844,390,52]]) {
      const context=await browser.newContext({viewport:{width,height},serviceWorkers:"block",reducedMotion:"reduce"})
      const page=await context.newPage();const errors=[];const external=[]
      page.on("pageerror",(error)=>errors.push(error.message))
      page.on("console",(message)=>{if(["error","warning"].includes(message.type()))errors.push(message.text())})
      await context.route("**/*",(route)=>{if(new URL(route.request().url()).origin!==server.origin){external.push(route.request().url());return route.abort()}return route.continue()})
      await page.goto(server.origin)
      // Reserve the actual expanded/collapsed sidebar footprint without loading
      // account services. The dashboard and CSS are unmodified production source.
      if(sidebar)await page.locator("#root").evaluate((el,pixels)=>{el.style.marginLeft=`${pixels}px`},sidebar)
      try {await expect(page.getByRole("heading",{level:1,name:"AtmoShaper",exact:true})).toHaveCount(1)}
      catch(error){throw new Error(`${error.message}\nBrowser errors: ${JSON.stringify(errors)}`,{cause:error})}
      await expect(page.getByRole("heading",{name:"Start here",exact:true})).toBeVisible()
      const launcher=page.getByTestId("home-launcher")
      assert.equal(await launcher.locator(":scope > *").count(),6)
      const bounds=await launcher.locator(":scope > *").evaluateAll((els)=>els.map((el)=>({width:el.clientWidth,scroll:el.scrollWidth,height:el.getBoundingClientRect().height,left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right})))
      for(const item of bounds){assert.ok(item.scroll<=item.width+1,`${name}: clipped tile`);assert.ok(item.height>=44);assert.ok(item.left>=0&&item.right<=width)}
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
      if(name==="phone"){
        assert.ok(await page.getByRole("button",{name:"Use dashboard",exact:true}).evaluate((el)=>el.getBoundingClientRect().bottom<innerHeight-72))
        await page.screenshot({path:"output/home-dashboard/fixture-first-visit.png"})
      }
      await page.getByRole("button",{name:"Use dashboard",exact:true}).click()
      await expect(page.getByRole("heading",{name:"Your tools",exact:true})).toBeVisible()
      await page.reload()
      await expect(page.getByRole("heading",{name:"Your tools",exact:true})).toBeVisible()
      await page.getByRole("button",{name:"All tools",exact:true}).click()
      const dialog=page.getByRole("dialog")
      await expect(dialog.getByRole("link",{name:"Practice Calendar",exact:true})).toHaveAttribute("href","/calendar?setup=practice")
      await expect(dialog.getByRole("link",{name:"My Calendar",exact:true})).toHaveAttribute("href","/calendar/personal")
      await dialog.getByRole("button",{name:"Close",exact:true}).press("Escape")
      await expect(dialog).toHaveCount(0)
      await expect(page.getByRole("button",{name:"All tools",exact:true})).toBeFocused()
      await page.getByRole("button",{name:"Study & play",exact:true}).click()
      await expect(dialog.getByRole("link",{name:"Flashcards",exact:true})).toBeVisible()
      await expect(dialog.getByRole("link",{name:"Business Planner",exact:true})).toHaveCount(0)
      await dialog.getByRole("button",{name:"Close",exact:true}).click()
      await page.getByRole("button",{name:"About AtmoShaper",exact:true}).click()
      await expect(dialog.getByRole("link",{name:"Privacy",exact:true})).toHaveAttribute("href","/legal/privacy")
      await dialog.getByRole("button",{name:"Close",exact:true}).click()
      await page.evaluate(()=>{document.documentElement.className="light"})
      await expect(page.getByTestId("home-brand-wordmark")).toBeVisible()
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
      assert.deepEqual(errors,[]);assert.deepEqual(external,[])
      await context.close()
    }
    // Hold the actual client bundle so the server markup is observed first.
    // A saved return preference must update only after matching SSR hydration.
    const hydratedContext=await browser.newContext({viewport:{width:390,height:844}})
    await hydratedContext.addInitScript(()=>localStorage.setItem("atmoshaper.home.visited.v1","1"))
    const hydratedPage=await hydratedContext.newPage();const hydrationErrors=[]
    hydratedPage.on("pageerror",(error)=>hydrationErrors.push(error.message))
    hydratedPage.on("console",(message)=>{if(["error","warning"].includes(message.type()))hydrationErrors.push(message.text())})
    let releaseBundle
    const heldBundle=new Promise((resolve)=>{releaseBundle=resolve})
    await hydratedContext.route("**/fixture.js",async(route)=>{await heldBundle;await route.continue()})
    await hydratedPage.goto(`${server.origin}/?hydrate`,{waitUntil:"commit"})
    await expect(hydratedPage.getByRole("heading",{name:"Start here",exact:true})).toBeVisible()
    await expect(hydratedPage.getByRole("button",{name:"All tools",exact:true})).toBeDisabled()
    releaseBundle()
    await expect(hydratedPage.getByRole("heading",{name:"Your tools",exact:true})).toBeVisible()
    await hydratedPage.getByRole("button",{name:"All tools",exact:true}).click()
    await expect(hydratedPage.getByRole("dialog",{name:"All tools",exact:true})).toBeVisible()
    assert.deepEqual(await hydratedPage.evaluate(()=>window.__homeHydrationErrors),[])
    assert.deepEqual(hydrationErrors,[])
    await hydratedContext.close()
    const context=await browser.newContext({viewport:{width:390,height:844}})
    await context.addInitScript(()=>{Object.defineProperty(Storage.prototype,"getItem",{value(){throw new Error("denied")}});Object.defineProperty(Storage.prototype,"setItem",{value(){throw new Error("denied")}})})
    const page=await context.newPage()
    await page.goto(server.origin)
    await page.getByRole("button",{name:"Use dashboard",exact:true}).click()
    await expect(page.getByRole("heading",{name:"Your tools",exact:true})).toBeVisible()
    await page.goto(`${server.origin}/?signedIn&custom`)
    await expect(page.getByRole("link",{name:"Account",exact:true})).toBeVisible()
    await expect(page.getByRole("link",{name:"Account settings",exact:true})).toHaveAttribute("href","/account?tab=app-settings")
    assert.deepEqual(await page.getByTestId("home-launcher").locator(":scope > *").allTextContents(),["Anatomime","Business income planner","Chimer","Music","Calendar and booking","Local-first notes"])
    await page.screenshot({path:"output/home-dashboard/fixture-custom-shortcuts.png"})
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
    await context.close()
  }finally{await browser.close();await server.close()}
})
