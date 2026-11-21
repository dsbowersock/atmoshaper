import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { runInNewContext } from "node:vm"
import { compileCommonJsModule,createElement,elementText,findElement,findElements,passThroughElement,renderFunctionComponents } from "./helpers/compiled-module.mjs"
import * as view from "../lib/wellness-calendar-view.js"
import * as catalog from "../lib/wellness-catalog.js"

const source=await readFile(new URL("../components/wellness/personal-wellness-calendar.tsx",import.meta.url),"utf8")
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no});return {promise,resolve,reject}}
const record=(id,month=10)=>({id,category:"activity",occurredAt:new Date(2026,month,20,10).toISOString(),summary:`Fictional ${id}`,metadata:{},regions:[],sensations:[],contexts:[],intensity:null,persisted:true})
const result=(records=[],patch={})=>({ok:true,data:{records,appointments:[],schedules:[],recordCursor:null,appointmentCursor:null,...patch}})

/** Run the actual component controller with deterministic hooks and held reads.
 * Native layout/focus is covered separately in the real-browser journeys. */
function owner(props={}) {
  const slots=[],effects=[],pending=[],calls=[];let cursor=0,tree
  const modules={
    react:{
      useState(initial){const index=cursor++;if(!(index in slots))slots[index]=typeof initial==="function"?initial():initial;return [slots[index],(value)=>{slots[index]=typeof value==="function"?value(slots[index]):value}]},
      useRef(initial){const index=cursor++;if(!(index in slots))slots[index]={current:initial};return slots[index]},
      useMemo:(callback)=>callback(),useSyncExternalStore:(_subscribe,snapshot)=>snapshot(),
      useEffect(callback,deps){const index=cursor++,previous=slots[index];if(!previous||deps.some((value,index)=>!Object.is(value,previous.deps[index]))){effects.push(()=>{previous?.cleanup?.();slots[index]={deps,cleanup:callback()}})}},
    },
    "react/jsx-runtime":{jsx:createElement,jsxs:createElement,Fragment:"fragment"},
    "lucide-react":{ChevronLeft:passThroughElement("svg"),ChevronRight:passThroughElement("svg"),RefreshCw:passThroughElement("svg")},
    "@/app/wellness/calendar-actions":{loadPersonalWellnessCalendarAction:(input)=>{const task=deferred();calls.push(input);pending.push(task);return task.promise}},
    "@/lib/wellness-calendar-view":view,"@/lib/wellness-catalog":catalog,
    "./wellness-entry-card":{WellnessEntryCard:passThroughElement("readback")},
    "./personal-wellness-calendar.module.css":{__esModule:true,default:{}},
    "@/components/ui/button":{Button:passThroughElement("button")},"@/components/ui/input":{Input:passThroughElement("input")},"@/components/ui/label":{Label:passThroughElement("label")},
    "@/components/ui/dialog":Object.fromEntries(["Dialog","DialogContent","DialogHeader","DialogTitle"].map((name)=>[name,passThroughElement(name)])),
  }
  const compiled={exports:{}}
  runInNewContext(compileCommonJsModule(source,"personal-calendar.tsx"),{exports:compiled.exports,module:compiled,require(name){assert.ok(Object.hasOwn(modules,name),name);return modules[name]},Intl},{timeout:1000})
  function render(){cursor=0;tree=renderFunctionComponents(compiled.exports.PersonalWellnessCalendar({isSignedIn:true,initialDay:"2026-11-20",...props}));for(const effect of effects.splice(0))effect();return tree}
  const button=(name)=>{const node=findElement(tree,(node)=>node.type==="button"&&(node.props["aria-label"]??elementText(node))===name);assert.ok(node,`control ${name}`);return node}
  render();render()
  return {calls,pending,render,text:()=>elementText(tree),
    click(name){button(name).props.onClick();render();render()},button,
    date(value){findElement(tree,(node)=>node.props.id==="personal-calendar-date").props.onChange({target:{value}});render();render()},
    async flush(){for(let index=0;index<12;index++)await Promise.resolve();render();render()},
    records:()=>findElements(tree,(node)=>node.props["data-calendar-item"]==="record"),
  }
}

test("private calendar ignores a late old-month read after the new month is already visible",async()=>{
  const page=owner();assert.equal(page.calls.length,1);assert.match(page.text(),/Loading your calendar/)
  page.date("2026-12-20");assert.equal(page.calls.length,2)
  page.pending[1].resolve(result([record("new-month",11)]));await page.flush();assert.match(page.text(),/Fictional new-month/)
  page.pending[0].resolve(result([record("old-month")]));await page.flush()
  assert.match(page.text(),/Fictional new-month/);assert.doesNotMatch(page.text(),/Fictional old-month|Loading your calendar/)
})
test("private calendar failures never read as an empty month and a real retry recovers",async()=>{
  const page=owner();page.pending[0].reject(new Error("PRIVATE_FAILURE"));await page.flush()
  assert.match(page.text(),/Could not load your calendar/);assert.doesNotMatch(page.text(),/No matching items|PRIVATE_FAILURE/)
  page.click("Try again");assert.equal(page.calls.length,2)
  page.pending[1].resolve(result());await page.flush();assert.match(page.text(),/No matching items on this day/)
  assert.doesNotMatch(page.text(),/Could not load/)
})
test("private calendar pagination locks duplicate clicks retains failures and deduplicates a successful next page",async()=>{
  const page=owner();page.pending[0].resolve(result([record("first")],{recordCursor:"position"}));await page.flush()
  const click=page.button("Load more recordings").props.onClick;click();click();page.render()
  assert.equal(page.calls.length,2);assert.equal(page.calls[1].load,"records")
  page.pending[1].resolve({ok:false});await page.flush()
  assert.equal(page.records().length,1);assert.match(page.text(),/Could not load more items/)
  page.click("Load more recordings");assert.equal(page.calls.length,3)
  page.pending[2].resolve(result([record("first"),record("second")]));await page.flush()
  assert.equal(page.records().length,2);assert.doesNotMatch(page.text(),/More items are available|Could not load/)
})
test("practice calendar renders page-session recordings without issuing any private reads",()=>{
  const page=owner({isSignedIn:false,entries:[{...record("practice"),persisted:false},record("private-signed-out")]})
  assert.equal(page.calls.length,0);assert.equal(page.records().length,1)
  assert.match(page.text(),/Practice recordings/)
  assert.doesNotMatch(page.text(),/Fictional private-signed-out/)
})

test("observing sign-out hides an already loaded private calendar snapshot",async()=>{
  const identity={isSignedIn:true},page=owner(identity)
  page.pending[0].resolve(result([record("private-before-signout")]));await page.flush()
  assert.match(page.text(),/Fictional private-before-signout/)
  identity.isSignedIn=false;page.render();page.render()
  assert.equal(page.records().length,0);assert.doesNotMatch(page.text(),/Fictional private-before-signout/)
  assert.equal(page.calls.length,1)
})
