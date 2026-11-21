import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { describe,it } from "node:test"
import { spawnSync } from "node:child_process"
import { calendarMonth,localDayKey,parseLocalDay,parsePersonalCalendarRequest,personalItemOnDay,personalReminderOccurrences } from "../lib/wellness-calendar-view.js"
import { WELLNESS_CATEGORY_GROUPS,wellnessRecordingLabel } from "../lib/wellness-catalog.js"
import { normalizeClientWellnessEntryInput } from "../lib/client-wellness.js"
import { normalizeClientWellnessReminderSchedules } from "../lib/client-wellness-reminders.js"
import { createCompiledModuleLoader,createElement } from "./helpers/compiled-module.mjs"

const source = await readFile(new URL("../app/wellness/calendar-actions.ts",import.meta.url),"utf8")
const month = {start:"2026-11-01T04:00:00.000Z",end:"2026-12-01T05:00:00.000Z"}
const at = new Date("2026-11-20T15:00:00Z")
const record = (index) => ({id:`fictional-${String(index).padStart(3,"0")}`,category:"emotion",occurredAt:at,timezone:"America/New_York",summary:"Fictional private feeling",intensity:0,regions:[],sensations:[],contexts:[],metadata:{feelingWords:["Hopeful"]},source:"quick-log",createdAt:at,updatedAt:at})

/** Execute the real private read with inert auth/database boundaries; unexpected
 * models, writes and provider calls have no available implementation. */
function fixture({signedIn=true,rows=[],visits=[],fail}={}) {
  const calls = []
  const query = (kind,value,args) => { calls.push({kind,args}); if (fail === kind) throw new Error("PRIVATE_DATABASE_DETAIL"); return value }
  const action = createCompiledModuleLoader(import.meta.url)(source,"calendar-actions.ts",{
    "@/auth":{getCurrentSession:async()=>signedIn ? {user:{id:"fictional-current-owner"}} : null},
    "@/lib/prisma":{prisma:{
      clientWellnessEntry:{findMany:async(args)=>query("records",rows,args)},
      appointment:{findMany:async(args)=>query("appointments",visits,args)},
      clientWellnessPreference:{findUnique:async(args)=>query("preference",{settings:{reminderSchedules:[{id:"fictional-rule",kind:"check_in",cadence:"daily",timeOfDay:"09:00",enabled:true,privateUnknown:"drop"}],privateUnknown:"drop"}},args)},
    }},
    "@/lib/client-wellness":{normalizeClientWellnessEntryInput},
    "@/lib/client-wellness-reminders":{normalizeClientWellnessReminderSchedules},
    "@/lib/wellness-calendar-view":{parsePersonalCalendarRequest},
  }).loadPersonalWellnessCalendarAction
  return {calls,read:(input={})=>action({...month,...input})}
}

describe("Private personal calendar",()=>{
  it("keeps category identities while organizing Mind Body and Context",()=>{
    assert.equal(WELLNESS_CATEGORY_GROUPS.emotion,"mind"); assert.equal(WELLNESS_CATEGORY_GROUPS.sleep,"mind")
    for (const category of ["body_sensation","rom","activity","exercise","incident"]) assert.equal(WELLNESS_CATEGORY_GROUPS[category],"body")
    assert.equal(WELLNESS_CATEGORY_GROUPS.work_context,"context"); assert.equal(WELLNESS_CATEGORY_GROUPS.home_care,"context")
    assert.equal(wellnessRecordingLabel({category:"rom",metadata:{recordingKind:"comfort"}}),"Movement comfort")
    assert.equal(wellnessRecordingLabel({category:"exercise"}),"Exercise")
  })
  it("validates real local dates and complete month grids without rolling invalid dates forward",()=>{
    assert.equal(parseLocalDay("2026-02-30"),null); assert.equal(parseLocalDay("bad"),null)
    assert.equal(localDayKey(parseLocalDay("2024-02-29")),"2024-02-29")
    const november=calendarMonth("2026-11-30"),december=calendarMonth("2026-11-30",1)
    assert.equal(november.days[0],"2026-11-01"); assert.equal(november.days.length,35); assert.equal(december.key,"2026-12")
    assert.equal(calendarMonth("2026-01-31",-1).key,"2025-12")
  })
  it("keeps local midnight and DST bounds instead of assuming 24-hour days",()=>{
    const moduleUrl=new URL("../lib/wellness-calendar-view.js",import.meta.url).href
    const code=`import assert from 'node:assert/strict'; import {calendarMonth,personalItemOnDay,personalReminderOccurrences} from ${JSON.stringify(moduleUrl)}; const month=calendarMonth('2026-11-20'); assert.equal(month.start,'2026-11-01T04:00:00.000Z'); assert.equal(month.end,'2026-12-01T05:00:00.000Z'); assert.equal(personalItemOnDay({at:'2026-11-21T04:30:00Z'},'2026-11-20'),true); assert.equal(personalItemOnDay({at:'2026-11-21T04:30:00Z'},'2026-11-21'),false); const rows=personalReminderOccurrences([{id:'daily',kind:'check_in',cadence:'daily',timeOfDay:'09:00',enabled:true}],month.start,month.end); assert.equal(rows.length,30); assert.equal(rows[0].at,'2026-11-01T14:00:00.000Z'); assert.equal(rows[1].at,'2026-11-02T14:00:00.000Z');`
    const result=spawnSync(process.execPath,["--input-type=module","-e",code],{env:{...process.env,TZ:"America/New_York"},encoding:"utf8"})
    assert.equal(result.status,0,result.stderr)
  })
  it("uses exclusive appointment ends and current generic reminder schedules",()=>{
    const day=parseLocalDay("2026-11-20"),start=new Date(day); start.setHours(0,0,0,0)
    const end=new Date(start); end.setDate(end.getDate()+1)
    assert.equal(personalItemOnDay({at:start.toISOString(),end:end.toISOString()},"2026-11-21"),false)
    assert.equal(personalItemOnDay({at:"invalid"},"2026-11-20"),false)
    const bounds=calendarMonth("2026-11-20")
    const rules=[{id:"daily",kind:"check_in",cadence:"daily",timeOfDay:"09:00",enabled:true},{id:"off",kind:"rom",cadence:"daily",timeOfDay:"08:00",enabled:false},{id:"weekly",kind:"feeling",cadence:"weekly",timeOfDay:"17:00",weekdays:[1],enabled:true}]
    const reminders=personalReminderOccurrences(rules,bounds.start,bounds.end)
    assert.equal(reminders.filter((row)=>row.id.startsWith("reminder:daily:")).length,30)
    assert.equal(reminders.filter((row)=>row.id.startsWith("reminder:weekly:")).length,5)
    assert.equal(reminders.some((row)=>row.id.includes(":off:")),false)
    assert.equal(new Set(reminders.map((row)=>row.id)).size,reminders.length)
  })
  it("includes a reminder on the final partial local day",()=>{
    const start=new Date(2026,10,23,15),end=new Date(2026,10,24,12)
    const rows=personalReminderOccurrences([{id:"daily",kind:"check_in",cadence:"daily",timeOfDay:"09:00",enabled:true}],start.toISOString(),end.toISOString())
    assert.deepEqual(rows.map((row)=>row.at),[new Date(2026,10,24,9).toISOString()])
  })
  it("does not carry a skipped month-start midnight into the next month",()=>{
    const moduleUrl=new URL("../lib/wellness-calendar-view.js",import.meta.url).href
    const code=`import assert from 'node:assert/strict'; import {calendarMonth,localDayKey} from ${JSON.stringify(moduleUrl)}; const month=calendarMonth('2023-10-15'); const end=new Date(month.end); assert.equal(localDayKey(end),'2023-11-01'); assert.equal(end.getHours(),0);`
    const result=spawnSync(process.execPath,["--input-type=module","-e",code],{env:{...process.env,TZ:"America/Asuncion"},encoding:"utf8"})
    assert.equal(result.status,0,result.stderr)
  })
  it("a midnight clock change cannot put a point on two local days",()=>{
    const moduleUrl=new URL("../lib/wellness-calendar-view.js",import.meta.url).href
    const code=`import assert from 'node:assert/strict'; import {personalItemOnDay} from ${JSON.stringify(moduleUrl)}; const item={at:new Date(2026,2,9,0,30).toISOString()}; assert.equal(personalItemOnDay(item,'2026-03-08'),false); assert.equal(personalItemOnDay(item,'2026-03-09'),true);`
    const result=spawnSync(process.execPath,["--input-type=module","-e",code],{env:{...process.env,TZ:"America/Havana"},encoding:"utf8"})
    assert.equal(result.status,0,result.stderr)
  })
  it("rejects unauthenticated and unbounded requests before every read",async()=>{
    const anon=fixture({signedIn:false}); assert.equal((await anon.read()).reason,"sign-in-required"); assert.equal(anon.calls.length,0)
    for (const patch of [{start:"bad"},{end:month.start},{end:"2027-12-01"},{recordCursor:"bad"},{appointmentCursor:JSON.stringify({at:"bad",id:"other"})},{load:"provider"}]) {
      const input=fixture(); assert.equal((await input.read(patch)).reason,"invalid-calendar-range"); assert.equal(input.calls.length,0)
    }
  })
  it("scopes records appointments and preference to the session owner with minimal readback",async()=>{
    const input=fixture({rows:[record(1)],visits:[{id:"fictional-visit",startsAt:at,endsAt:new Date(at.getTime()+3600000),status:"CONFIRMED",serviceName:"Session",serviceVariantName:null,practice:{name:"Fictional practice"},serviceItems:[]}]})
    const result=await input.read({userId:"forged-owner",practiceId:"forged-practice"})
    assert.equal(result.ok,true); assert.equal(result.data.records[0].persisted,true)
    assert.deepEqual(result.data.records[0].metadata.feelingWords,["Hopeful"])
    assert.equal(result.data.records[0].userId,undefined); assert.equal(result.data.appointments[0].title,"Session")
    assert.equal(input.calls[0].args.where.userId,"fictional-current-owner"); assert.equal(input.calls[0].args.where.deletedAt,null)
    assert.equal(input.calls[0].args.take,201)
    assert.deepEqual(input.calls[1].args.where.practiceClient,{userId:"fictional-current-owner"})
    assert.equal(input.calls[1].args.select.practiceClient,undefined); assert.equal(input.calls[1].args.select.notes,undefined)
    assert.equal(input.calls[2].args.where.userId,"fictional-current-owner")
    assert.equal(result.data.schedules[0].privateUnknown,undefined)
  })
  it("paginates tied timestamps inside owner scope and keeps record and appointment positions separate",async()=>{
    const input=fixture({rows:Array.from({length:201},(_,index)=>record(index))}), first=await input.read()
    assert.equal(first.data.records.length,200); assert.deepEqual(JSON.parse(first.data.recordCursor),{at:at.toISOString(),id:"fictional-199"})
    assert.equal(first.data.appointmentCursor,null)
    const next=fixture({rows:[record(200)]}), result=await next.read({load:"records",recordCursor:first.data.recordCursor})
    assert.equal(result.data.recordCursor,null); assert.equal(next.calls.some((call)=>call.kind==="appointments"),false)
    assert.equal(next.calls[0].args.where.userId,"fictional-current-owner")
    assert.deepEqual(next.calls[0].args.where.OR,[{occurredAt:{gt:at}},{occurredAt:at,id:{gt:"fictional-199"}}])
  })
  it("fails closed on each required read and never sends private exception text",async()=>{
    for (const fail of ["records","appointments","preference"]) {
      const result=await fixture({rows:[record(0)],fail}).read()
      assert.equal(result.ok,false); assert.equal(result.data,undefined); assert.doesNotMatch(JSON.stringify(result),/PRIVATE_DATABASE_DETAIL|Fictional private/)
    }
    assert.doesNotMatch(source,/\.create\(|\.update\(|\.delete\(|\.createMany\(|\.updateMany\(|\.deleteMany\(|CalendarEvent|Sentry|sendEmail|console\./)
    for (const path of ["../lib/google-calendar-adapter.ts","../lib/calendar-sync-service.ts"]) assert.doesNotMatch(await readFile(new URL(path,import.meta.url),"utf8"),/loadPersonalWellnessCalendar|WellnessEntryCard|PersonalWellnessCalendar|private-calendar-layer/)
  })
  it("keys personal views to the authenticated account and resets Wellness on sign-out",async()=>{
    let userId="fictional-first-owner"
    const page=createCompiledModuleLoader(import.meta.url)(await readFile(new URL("../app/calendar/personal/page.tsx",import.meta.url),"utf8"),"personal-page.tsx",{
      "react/jsx-runtime":{jsx:createElement,jsxs:createElement},
      "@/lib/rsc-session":{getCurrentRscSession:async()=>userId?{user:{id:userId}}:null},
      "@/components/wellness/personal-calendar-home":{PersonalCalendarHome:()=>null},
      "../page":{default:()=>null},
    }).default
    const first=await page({});userId="fictional-second-owner";const second=await page({})
    assert.notEqual(first.key,second.key);userId=null;const signedOut=await page({})
    assert.equal(signedOut.props.isSignedIn,false);assert.notEqual(second.key,signedOut.key)
    const wellnessPage=await readFile(new URL("../app/wellness/page.tsx",import.meta.url),"utf8")
    assert.match(wellnessPage,/<WellnessHubClient\s+key=\{userId \?\? "anonymous"\}/)
  })
})
