import test from "node:test"
import assert from "node:assert/strict"
import { playChimerChime } from "../lib/chimer-chime.js"
import {
  defaultOfflineCoreState, normalizeOfflineCoreState, normalizeOfflineTimer,
  readOfflineTimer, startOfflineTimer, pauseOfflineTimer, resumeOfflineTimer,
  getOfflineTimerInterval, loadOfflineCoreState, saveOfflineCoreState, OFFLINE_CORE_STORAGE_KEY,
} from "../lib/offline-core.js"

test("a persisted running timer catches up after its runtime is stopped", () => {
  const started = startOfflineTimer(60000, 100000)
  const restored = normalizeOfflineTimer(JSON.parse(JSON.stringify(started)), 130000)
  assert.equal(readOfflineTimer(restored, 130000).remainingMs, 30000)
  assert.equal(readOfflineTimer(restored, 170000).status, "complete")
  assert.equal(readOfflineTimer(restored, 170000).remainingMs, 0)
})

test("pause retains remaining time across restart and resume creates only the remaining deadline", () => {
  const paused = pauseOfflineTimer(startOfflineTimer(60000, 100000), 115000)
  assert.equal(paused.status, "paused")
  assert.equal(paused.remainingMs, 45000)
  assert.equal(readOfflineTimer(paused, 200000).remainingMs, 45000)
  const resumed = resumeOfflineTimer(JSON.parse(JSON.stringify(paused)), 200000)
  assert.equal(resumed.endsAt, 245000)
  assert.equal(readOfflineTimer(resumed, 210000).remainingMs, 35000)
})

test("completion cannot be paused or resumed into a new running timer", () => {
  const expired = startOfflineTimer(1000, 100000)
  assert.equal(pauseOfflineTimer(expired, 101001).status, "complete")
  assert.equal(resumeOfflineTimer(expired, 101001).status, "complete")
})

test("invalid timer snapshots cannot create unbounded or malformed deadlines", () => {
  for (const patch of [{status:"unknown"},{durationMs:-1},{durationMs:0},{remainingMs:60001},
    {remainingMs:NaN},{endsAt:null},{endsAt:Infinity},{endsAt:1000000000}]) {
    assert.equal(normalizeOfflineTimer({...startOfflineTimer(60000,100000),...patch},100000).status,"idle")
  }
  for (const duration of [0, -1, Infinity, 1.5, Number.MAX_SAFE_INTEGER]) assert.throws(() => startOfflineTimer(duration))
})

test("missed interval alerts are consumed without a catch-up burst", () => {
  const timer = startOfflineTimer(600000,100000)
  assert.deepEqual(getOfflineTimerInterval(timer,1,160000), {index:1,alert:true})
  assert.deepEqual(getOfflineTimerInterval(timer,1,225000), {index:2,alert:false})
  assert.deepEqual(getOfflineTimerInterval({...timer,lastAlertIndex:2},1,220500), {index:2,alert:false})
  assert.deepEqual(getOfflineTimerInterval(timer,0,160000), {index:0,alert:false})
})

test("device preferences fail closed on unknown tools, paid IDs and CSS-like color input", () => {
  const value = normalizeOfflineCoreState({version:1,tool:"/account",backgroundId:"paid-background",mainColor:"url(https://example.invalid)",orbColor:"#126abc",timeFormat:"24h",intervalMinutes:-1})
  assert.equal(value.tool,"clock")
  assert.equal(value.backgroundId,"massage-lab-moving-gradient")
  assert.equal(value.mainColor,"#FF8C2A")
  assert.equal(value.orbColor,"#126abc")
  assert.equal(value.timeFormat,"24h")
  assert.equal(value.intervalMinutes,15)
  assert.deepEqual(normalizeOfflineCoreState({version:99}),defaultOfflineCoreState())
})

test("the app reads and writes only its new local preference key", () => {
  const calls=[]
  const data=new Map([["massagelab-chimer-settings", "original website data"]])
  const store={getItem(key){calls.push(["read",key]);return data.get(key)},setItem(key,value){calls.push(["write",key]);data.set(key,value)}}
  assert.equal(loadOfflineCoreState(store).tool,"clock")
  assert.equal(saveOfflineCoreState(store,{...defaultOfflineCoreState(),tool:"breathing"}),true)
  assert.equal(loadOfflineCoreState(store).tool,"breathing")
  assert.ok(calls.every(([,key])=>key===OFFLINE_CORE_STORAGE_KEY))
  assert.equal(data.get("massagelab-chimer-settings"),"original website data")
})

test("broken or unavailable local storage preserves a usable UI and reports failed writes", () => {
  const store={getItem(){throw new Error("blocked")},setItem(){throw new Error("full")}}
  assert.equal(loadOfflineCoreState(store).tool,"clock")
  assert.equal(saveOfflineCoreState(store,defaultOfflineCoreState()),false)
  assert.equal(loadOfflineCoreState({getItem:()=>"{bad-json"}).tool,"clock")
})

test("the shared alert schedules the Clock's two tones without media downloads and disconnects them", () => {
  const tones=[],envelope=[]
  let gainDisconnected=false
  const gain={gain:{setValueAtTime:(...args)=>envelope.push(args),exponentialRampToValueAtTime:(...args)=>envelope.push(args)},connect(){},disconnect(){gainDisconnected=true}}
  const context={currentTime:10,destination:{},createGain:()=>gain,createOscillator(){
    const tone={frequency:{setValueAtTime:(value,time)=>{tone.frequencyValue=value;tone.at=time}},connect(){},start:time=>{tone.startAt=time},stop:time=>{tone.stopAt=time},disconnect(){tone.disconnected=true}}
    tones.push(tone);return tone
  }}
  playChimerChime(context,1)
  assert.deepEqual(tones.map(tone=>[tone.frequencyValue,tone.startAt,tone.stopAt]),[[784,10,10.32],[1046.5,10.28,10.9]])
  assert.deepEqual(envelope,[[0.0001,10],[0.18,10.02],[0.0001,10.9]])
  tones.forEach(tone=>tone.onended())
  assert.ok(tones.every(tone=>tone.disconnected)&&gainDisconnected)
  playChimerChime(context,0)
  assert.equal(tones.length,2)
})
