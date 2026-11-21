import assert from "node:assert/strict"
import { mkdir } from "node:fs/promises"
import test from "node:test"
import { chromium, expect } from "@playwright/test"
import { createCalendarWorkspaceBrowserBundle, startCalendarWorkspaceBrowserFixture } from "./fixtures/calendar-workspace-browser-harness.mjs"

test("real calendar phone and desktop source selection stays private and contained", {timeout:120000}, async()=>{
  const server=await startCalendarWorkspaceBrowserFixture(await createCalendarWorkspaceBrowserBundle())
  let browser
  try {
    browser=await chromium.launch({headless:true})
    await mkdir("output/sidebar-calendar-workspace",{recursive:true})
    for(const [name,width,height] of [["phone",390,844],["desktop",1280,900]]){
      const context=await browser.newContext({viewport:{width,height},locale:"en-US",timezoneId:"America/New_York"}),page=await context.newPage(),errors=[],external=[]
      page.on("pageerror",(error)=>errors.push(error.message))
      await page.route("**/*",(route)=>route.request().url().startsWith(server.origin)?route.continue():(external.push(route.request().url()),route.abort()))
      await page.goto(server.origin)
      await expect(page.getByRole("button",{name:"Together",exact:true})).toHaveAttribute("aria-pressed","true")
      await expect(page.locator(".fc-event").filter({hasText:"Activity"})).toBeVisible()
      await expect(page.locator(".fc-event").filter({hasText:"Example appointment"})).toBeVisible()
      await page.getByRole("button",{name:"Calendar settings",exact:true}).click()
      await expect(page.getByLabel("Day starts",{exact:true})).toBeDisabled()
      await expect(page.getByLabel("Day ends",{exact:true})).toBeDisabled()
      await expect(page.getByRole("button",{name:"Use availability hours",exact:true})).toBeDisabled()
      await page.keyboard.press("Escape")
      assert.deepEqual(await page.locator(".fc-col-header-cell-cushion").allTextContents(),["Sun","Mon","Tue","Wed","Thu","Fri","Sat"])
      await page.locator(".fc-event").filter({hasText:"Activity"}).click()
      await expect(page.getByRole("dialog")).toContainText("Fictional private recording")
      await page.keyboard.press("Escape")
      await page.getByRole("button",{name:"Practice",exact:true}).click()
      await page.getByRole("button",{name:"Calendar settings",exact:true}).click()
      await expect(page.getByLabel("Day starts",{exact:true})).toBeEnabled()
      await page.keyboard.press("Escape")
      await expect(page.locator(".fc-event").filter({hasText:"Activity"})).toHaveCount(0)
      await page.getByRole("button",{name:"Personal",exact:true}).click()
      await expect(page.locator(".fc-event").filter({hasText:"Example appointment"})).toHaveCount(0)
      await expect(page.locator(".fc-event").filter({hasText:"Activity"})).toBeVisible()
      await page.getByRole("button",{name:"Together",exact:true}).click()
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
      assert.deepEqual(await page.evaluate(()=>window.__calendarWrites),[])
      await page.screenshot({path:`output/sidebar-calendar-workspace/${name}.png`})
      await page.getByRole("button",{name:"Next range",exact:true}).click()
      await expect(page.getByText("December 2026",{exact:true})).toBeVisible()
      await page.getByLabel("Choose practice calendar").selectOption("fictional-second-practice")
      const navigation=await page.evaluate(()=>window.__calendarNavigation)
      assert.equal(navigation.length,1)
      const query=new URL(navigation[0],server.origin).searchParams
      assert.equal(query.get("practice"),"fictional-second-practice")
      assert.equal(query.get("view"),"together")
      assert.match(query.get("date"),/^2026-12-\d{2}$/)
      assert.deepEqual(errors,[]);assert.deepEqual(external,[])
      await context.close()
    }
    const page=await browser.newPage({viewport:{width:390,height:844}})
    await page.goto(`${server.origin}/?personalOnly`)
    await expect(page.getByRole("button",{name:"Practice",exact:true})).toBeDisabled()
    await expect(page.getByRole("button",{name:"Together",exact:true})).toBeDisabled()
    await expect(page.locator(".fc-event").filter({hasText:"Activity"})).toBeVisible()
    const split=await browser.newPage({viewport:{width:1280,height:900}})
    await split.goto(`${server.origin}/?split`)
    await expect(split.locator(".fc")).toHaveCount(2)
    await split.getByRole("button",{name:"Next range",exact:true}).click()
    await expect(split.getByText("December 2026",{exact:true})).toBeVisible()
    for(const [scope,calendars] of [["Together",1],["Personal",1],["Practice",2]]){
      await split.getByRole("button",{name:scope,exact:true}).click()
      await expect(split.locator(".fc")).toHaveCount(calendars)
      await expect(split.getByText("December 2026",{exact:true})).toBeVisible()
    }
    // A deep-linked distant schedule must not turn Today or boundary navigation
    // into an empty bookable grid while the server's new snapshot is pending.
    const bounded=await browser.newPage({viewport:{width:1280,height:900}})
    await bounded.clock.setFixedTime(new Date('2026-11-20T12:00:00Z'))
    for(const direction of ['Today','Previous range','Next range']){
      await bounded.goto(`${server.origin}/?bounded`)
      await expect(bounded.getByRole('button',{name:'Date February 2030',exact:true})).toBeVisible()
      for(let attempt=0;attempt<7;attempt++){
        await bounded.getByRole('button',{name:direction,exact:true}).click()
        if(await bounded.getByRole('status').filter({hasText:'Loading practice schedule'}).isVisible())break
      }
      await expect(bounded.getByRole('status').filter({hasText:'Loading practice schedule'})).toBeVisible()
      await expect(bounded.locator('.fc')).toBeHidden()
      const requests=await bounded.evaluate(()=>window.__calendarNavigation)
      assert.equal(requests.length,1)
      const query=new URL(requests[0],server.origin).searchParams
      assert.equal(query.get('practice'),'fictional-practice');assert.equal(query.get('view'),'practice')
      if(direction==='Today')assert.equal(query.get('date'),'2026-11-20')
      await bounded.evaluate((day)=>window.__loadPracticeDate(day),query.get('date'))
      await expect(bounded.locator('.fc')).toBeVisible()
      assert.deepEqual(await bounded.evaluate(()=>window.__calendarWrites),[])
    }
    // A real replacement updates both route date and loaded window. A newer
    // local date choice must survive that late response, even if no new fetch
    // was needed until the old window was replaced.
    await bounded.goto(`${server.origin}/?bounded`)
    await bounded.getByRole('button',{name:'Today',exact:true}).click()
    await expect(bounded.getByRole('status').filter({hasText:'Loading practice schedule'})).toBeVisible()
    const oldRequest = await bounded.evaluate(()=>window.__calendarNavigation[0])
    await bounded.getByRole('button',{name:/Date.*November 2026/}).click()
    for (let month = 0; month < 39; month++) await bounded.getByRole('button',{name:'Go to the Next Month',exact:true}).click()
    await bounded.locator('button[data-day="2/12/2030"]').click()
    await bounded.keyboard.press('Escape')
    await expect(bounded.getByRole('button',{name:'Date February 2030',exact:true})).toBeVisible()
    await expect(bounded.locator('.fc')).toBeVisible()
    assert.equal((await bounded.evaluate(()=>window.__calendarNavigation)).length, 1)
    await bounded.evaluate(day=>window.__loadPracticeDate(day),new URL(oldRequest,server.origin).searchParams.get('date'))
    await expect(bounded.getByRole('status').filter({hasText:'Loading practice schedule'})).toBeVisible()
    await expect(bounded.getByRole('button',{name:'Date February 2030',exact:true})).toBeVisible()
    await expect.poll(()=>bounded.evaluate(()=>window.__calendarNavigation.length)).toBe(2)
    const latestRequest=await bounded.evaluate(()=>window.__calendarNavigation[1])
    assert.equal(new URL(latestRequest,server.origin).searchParams.get('date'),'2030-02-12')
    await bounded.evaluate(day=>window.__loadPracticeDate(day),'2030-02-12')
    await expect(bounded.locator('.fc')).toBeVisible()
    await expect(bounded.getByRole('button',{name:'Date February 2030',exact:true})).toBeVisible()
    assert.deepEqual(await bounded.evaluate(()=>window.__calendarWrites),[])
    await bounded.goto(`${server.origin}/?bounded&monthEnd`)
    await expect(bounded.getByText('January 2027',{exact:true})).toBeVisible()
    await expect(bounded.locator('.fc')).toBeVisible()
    await expect(bounded.getByRole('status').filter({hasText:'Loading practice schedule'})).toHaveCount(0)
    assert.deepEqual(await bounded.evaluate(()=>window.__calendarNavigation),[])
  } finally {try {await browser?.close()} finally {await server.close()}}
})
