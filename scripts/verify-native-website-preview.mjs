import {chromium,expect} from '@playwright/test'
import {mkdir,writeFile} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'
import path from 'node:path'

const output=fileURLToPath(new URL('../output/native-website-preview/',import.meta.url))
await mkdir(output,{recursive:true})
const browser=await chromium.launch()
const results=[]
try{
 for(const [name,width,height] of [['phone',390,844],['tablet',820,1180],['landscape',852,393]]){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',serviceWorkers:'block'})
  const page=await context.newPage(),errors=[],failed=[]
  page.on('pageerror',error=>errors.push(error.message))
  page.on('requestfailed',request=>failed.push(request.url()))
  await page.addInitScript(()=>localStorage.setItem('atmoshaper.home.visited.v1','1'))
  await page.goto('http://127.0.0.1:3030/')
  await expect(page.getByTestId('home-launcher')).toBeVisible({timeout:30000})
  await page.evaluate(()=>document.fonts.ready)
  await page.screenshot({path:path.join(output,name+'-home.png')})
  await expect(page.getByRole('button',{name:'Open navigation',exact:true}).first()).toBeVisible()
  await page.getByRole('link',{name:'Clock & timer',exact:true}).click()
  await expect(page.locator('[data-native-shared-clock]')).toBeVisible()
  await page.screenshot({path:path.join(output,name+'-clock.png')})
  const body=(await page.locator('body').innerText()).slice(0,2200)
  results.push({name,errors,failed,body})
  await context.close()
 }
}finally{await browser.close()}
await writeFile(path.join(output,'initial-readback.json'),JSON.stringify(results,null,2))
console.log(JSON.stringify(results))
