import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import * as setup from "../lib/onboarding-setup.js"
import * as preferences from "../lib/onboarding-preferences.js"
import { buildUserPreferencePayload } from "../lib/account-preferences.js"
import { createCompiledModuleLoader } from "./helpers/compiled-module.mjs"

const compile=createCompiledModuleLoader(import.meta.url)
const service=compile(await readFile(new URL("../lib/onboarding-setup-service.ts",import.meta.url),"utf8"),"setup-service.ts",{
  "./account-preferences.js":{USER_PREFERENCES_VERSION:1},"./onboarding-preferences.js":preferences,"./onboarding-setup.js":setup,
})

/** The test lock is acquired by the actual SELECT call, not by $transaction.
 * Removing the owner lock therefore permits both parallel claims to win. */
function database(settings={onboardingSetup:setup.initialOnboardingSetup()}) {
  let appSettings=structuredClone(settings),tail=Promise.resolve()
  const writes=[],owners=[]
  const read=async()=>({appSettings:structuredClone(appSettings)})
  const db={userPreference:{findUnique:read},writes,owners,get settings(){return appSettings},
    async $transaction(work){
      let release
      const tx={$queryRaw:async(_strings,owner)=>{owners.push(owner);const previous=tail;tail=new Promise(resolve=>{release=resolve});await previous},
        userPreference:{findUnique:read,upsert:async(input)=>{writes.push(structuredClone(input));appSettings=structuredClone(input.update.appSettings);return {appSettings}}}}
      try{return await work(tx)}finally{release?.()}
    },
  }
  return db
}

test("only newly seeded, unconsumed accounts receive an invitation",async()=>{
  for(const settings of [{},{onboarding:{completedAt:"earlier"}},{onboardingSetup:{version:1,phase:"offered"}},{onboardingSetup:{version:1,phase:"skipped"}},{onboardingSetup:{version:1,phase:"started"}},{onboardingSetup:{version:1,phase:"completed"}}]){
    assert.equal(await service.postSignInSetupDestination(database(settings),"owner","/calendar?date=2030-01-02"),"/calendar?date=2030-01-02")
  }
  assert.equal(await service.postSignInSetupDestination(database(),"owner","/calendar"),"/onboarding/welcome?returnTo=%2Fcalendar")
  assert.equal(await service.postSignInSetupDestination(database(),"owner","/onboarding/welcome?returnTo=%2Fcalendar"),"/onboarding/welcome?returnTo=%2Fcalendar")
  assert.equal(await service.postSignInSetupDestination(database({}),"owner","/onboarding/welcome?returnTo=%2Fcalendar"),"/calendar")
  assert.equal(await service.postSignInSetupDestination(database(),"owner","/onboarding"),"/onboarding")
})

test("parallel tabs claim once, retain other settings, and never prompt again after abandonment",async()=>{
  const db=database({onboardingSetup:setup.initialOnboardingSetup(),themeMode:"light",onboarding:{primaryRole:"student"}})
  assert.deepEqual(await Promise.all([service.claimOnboardingInvitation(db,"owner"),service.claimOnboardingInvitation(db,"owner")]),["new",null])
  assert.equal(db.writes.length,1)
  assert.equal(db.settings.themeMode,"light")
  assert.equal(db.settings.onboarding.primaryRole,"student")
  assert.deepEqual(db.owners,["owner","owner"])
  assert.equal(await service.postSignInSetupDestination(db,"owner","/"),"/")
  assert.equal(await service.claimOnboardingInvitation(db,"owner"),null)
})

test("explicit choices persist once and a stale click cannot replace them",async()=>{
  for(const choice of ["started","skipped"]){
    const db=database()
    await service.claimOnboardingInvitation(db,"owner")
    assert.equal(await service.chooseOnboardingSetup(db,"owner",choice),choice)
    assert.equal(await service.chooseOnboardingSetup(db,"owner",choice==="started"?"skipped":"started"),choice)
    assert.equal(db.settings.onboardingSetup.phase,choice)
    assert.equal(db.writes.length,2)
    assert.equal(await service.postSignInSetupDestination(db,"owner","/"),"/")
  }
  const retry=database()
  await service.chooseOnboardingSetup(retry,"owner","skipped")
  assert.equal(retry.settings.onboardingSetup.phase,"skipped")
})

test("failed preference routing does not block ordinary sign-in or leak its error",async()=>{
  const db={userPreference:{findUnique:async()=>{throw new Error("private provider detail")}}}
  assert.equal(await service.postSignInSetupDestination(db,"owner","/calendar"),"/calendar")
})

test("setup continuations reject unsafe paths and encoded onboarding loops",()=>{
  for(const path of ["https://example.com","//example.com","/api/account","/legal/accept","/onboarding","/%6fnboarding/welcome","/onboarding/welcome?returnTo=%2Fonboarding"]){
    assert.equal(setup.onboardingReturnTo(path),"/",path)
  }
  assert.equal(setup.onboardingReturnTo("/calendar?date=2030-01-02#events"),"/calendar?date=2030-01-02#events")
})

test("ordinary preference sync cannot replay a pending invitation from another browser",()=>{
  const incoming={themeMode:"light",onboardingSetup:{version:1,phase:"pending"},onboardingDraft:{version:1,answers:{primaryRole:"student"}}}
  const payload=buildUserPreferencePayload({appSettings:incoming})
  assert.equal("onboardingSetup" in payload.app_settings,false)
  assert.equal("onboardingDraft" in payload.app_settings,false)
  assert.equal(payload.app_settings.themeMode,"light")
  assert.equal(incoming.onboardingSetup.phase,"pending")
})

test("unfinished answers stay separate, resume once, and remain available after declining",async()=>{
  const db=database({themeMode:"dark",onboarding:{primaryRole:"public_wellness"},onboardingSetup:{version:1,phase:"started"}})
  const form=new FormData()
  form.set("primaryRole","therapist")
  form.set("jurisdiction","OH")
  form.append("useCases","manage_practice")
  form.set("clinicalNotes","must never be saved")
  assert.deepEqual(await service.saveOnboardingProgress(db,"owner",0,form),{ok:true,revision:1})
  assert.equal(db.settings.onboarding.primaryRole,"public_wellness","drafts must not apply settings")
  assert.equal(db.settings.onboardingDraft.answers.primaryRole,"therapist")
  assert.equal("completedAt" in db.settings.onboardingDraft.answers,false)
  assert.equal(JSON.stringify(db.settings).includes("clinicalNotes"),false)
  assert.equal(setup.onboardingInvitationKind(db.settings),"resume")
  assert.equal(await service.claimOnboardingInvitation(db,"owner"),"resume")
  assert.equal(await service.claimOnboardingInvitation(db,"owner"),null)
  await service.chooseOnboardingSetup(db,"owner","skipped","resume")
  assert.equal(setup.onboardingInvitationKind(db.settings),null)
  assert.equal(db.settings.onboardingDraft.answers.jurisdiction,"OH")
  await service.saveOnboardingProgress(db,"owner",1,form)
  assert.equal(db.settings.onboardingSetup.phase,"skipped","a late autosave cannot re-enable reminders")
  assert.equal(db.settings.themeMode,"dark")
})

test("continuing an unfinished draft consumes the reminder and completion rejects late/stale saves",async()=>{
  const db=database({onboardingSetup:{version:1,phase:"started"}})
  const form=new FormData()
  form.set("primaryRole","student")
  await service.saveOnboardingProgress(db,"owner",0,form)
  await service.claimOnboardingInvitation(db,"owner")
  await service.chooseOnboardingSetup(db,"owner","started","resume")
  assert.equal(db.settings.onboardingSetup.phase,"resumed")
  await service.saveOnboardingProgress(db,"owner",1,form)
  assert.equal(setup.onboardingInvitationKind(db.settings),null)
  assert.deepEqual(await service.saveOnboardingProgress(db,"owner",1,form),{ok:false,conflict:true})
  assert.deepEqual(await service.saveOnboardingProgress(db,"owner",2,form,true),{ok:true,revision:3})
  assert.equal(db.settings.onboardingSetup.phase,"completed")
  assert.equal("onboardingDraft" in db.settings,false)
  assert.equal(db.settings.onboarding.primaryRole,"student")
  assert.deepEqual(await service.saveOnboardingProgress(db,"owner",2,form),{ok:false,conflict:true})
  assert.equal("onboardingDraft" in db.settings,false)
})

test("invitation actions reject signed-out, changed-owner and unknown-choice writes",async()=>{
  let actor=null,calls=0
  const actions=compile(await readFile(new URL("../app/onboarding/welcome/actions.ts",import.meta.url),"utf8"),"setup-actions.ts",{
    "@/auth":{getCurrentSession:async()=>actor?{user:{id:actor}}:null},"@/lib/prisma":{prisma:{}},
    "@/lib/onboarding-setup-service":{claimOnboardingInvitation:async()=>{calls++;return "new"},chooseOnboardingSetup:async(_db,_owner,choice)=>{calls++;return choice}},
    "@/lib/account-surface-data":{clearAccountSurfaceDataCache:()=>{}},
  })
  assert.deepEqual(await actions.claimSetupInvitationAction("owner"),{ok:false})
  actor="other"
  assert.deepEqual(await actions.claimSetupInvitationAction("owner"),{ok:false})
  actor="owner"
  assert.deepEqual(await actions.chooseSetupInvitationAction("owner","pending","new"),{ok:false})
  assert.equal(calls,0)
  assert.deepEqual(await actions.claimSetupInvitationAction("owner"),{ok:true,show:true,kind:"new"})
  assert.deepEqual(await actions.chooseSetupInvitationAction("owner","skipped","new"),{ok:true,choice:"skipped"})
})
