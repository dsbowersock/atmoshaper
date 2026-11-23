import test from 'node:test'
import assert from 'node:assert/strict'
import {nativeLocalRoute,nativeToolIntent,NATIVE_LOCAL_ROUTES} from '../lib/native-app-routes.js'
import {importLegacyNativeClock,normalizeNativeClock,nativeClockCommitKey} from '../lib/native-clock-state.js'
import {defaultOfflineCoreState,startOfflineTimer} from '../lib/offline-core.js'
import {getIntervalMs} from '../lib/chimer-timer.js'

test('native tool intents carry only fixed public tool routes and safe picker state',()=>{
 for(const value of NATIVE_LOCAL_ROUTES)assert.equal(nativeLocalRoute(value),value)
 for(const value of ['https://evil.example/clock','//evil.example/music','/api/account/preferences','/account','/clock#javascript','/clock\\other',null,{},'/calendar/personal'])assert.equal(nativeLocalRoute(value),null)
 assert.equal(nativeLocalRoute('/clock?source=music&returnTo=https://evil.example&session=private&panel=background'),'/clock?panel=background&source=music')
 assert.equal(nativeLocalRoute('/music?token=private'),'/music')
 assert.match(nativeToolIntent('/downloads'),/^intent:\/\/tool\?path=%2Fdownloads#Intent;scheme=atmoshaper;package=com\.atmoshaper\.app\.development;end$/)
 assert.throws(()=>nativeToolIntent('/account'))
})

test('the older preview imports without altering its original colors, state or timer deadline',()=>{
 const now=1800000000000,old={...defaultOfflineCoreState(),mainColor:'#146b73',orbColor:'#8260ac',timer:startOfflineTimer(120000,now)}
 const before=structuredClone(old),state=importLegacyNativeClock(old,now+30000)
 assert.deepEqual(old,before)
 assert.equal(state.timer.endsAtMs,now+120000);assert.equal(state.timer.remainingMs,90000)
 assert.equal(state.settings.backgroundVisualPreferences.palette.primaryColor.toLowerCase(),'#146b73')
 assert.ok(state.settings.backgroundVisualPreferences.palette.swatches.map(value=>value.toLowerCase()).includes('#8260ac'))
 assert.equal(normalizeNativeClock(state,now+120001).timer.status,'complete')
 assert.equal(normalizeNativeClock(state,now+120001).timer.remainingMs,0)
})

test('malformed saved timers do not become fresh default sessions',()=>{
 const good=importLegacyNativeClock(defaultOfflineCoreState())
 for(const timer of [{...good.timer,status:'unknown'},{...good.timer,totalMs:-1},{...good.timer,status:'running',endsAtMs:null},{...good.timer,remainingMs:good.timer.totalMs+1}])assert.throws(()=>normalizeNativeClock({...good,timer}))
 assert.throws(()=>normalizeNativeClock(undefined))
})

test('legacy interval Off stays off after sanitation, saving and starting another timer',()=>{
 const now=1800000000000,old={...defaultOfflineCoreState(),intervalMinutes:0,timer:startOfflineTimer(3600000,now)}
 const state=normalizeNativeClock(importLegacyNativeClock(old,now),now)
 assert.equal(getIntervalMs(state.settings,3600000),null)
 assert.equal(state.timer.intervalMs,null)
 assert.equal(state.timer.nextAlertAtMs,null)
 assert.equal(state.timer.msUntilNextAlert,null)
})

test('restoring after missed intervals keeps the next original boundary without replaying old cues',()=>{
 const now=1800000000000,interval=15*60000,end=now+3600000
 const initial=importLegacyNativeClock({...defaultOfflineCoreState(),timer:startOfflineTimer(3600000,now)},now)
 for(const [elapsed,next] of [[20*60000,30*60000],[35*60000,45*60000],[50*60000,null]]){
  const restored=normalizeNativeClock(initial,now+elapsed)
  assert.equal(restored.timer.endsAtMs,end)
  assert.equal(restored.timer.nextAlertAtMs,next===null?null:now+next)
  assert.equal(restored.timer.intervalMs,interval)
 }
 const expired=normalizeNativeClock(initial,end+1)
 assert.equal(expired.timer.status,'complete');assert.equal(expired.timer.nextAlertAtMs,null)
})

test('legacy running and paused imports preserve interval phase',()=>{
 const now=1800000000000,started=startOfflineTimer(3600000,now),old=defaultOfflineCoreState()
 const running=importLegacyNativeClock({...old,timer:started},now+20*60000)
 assert.equal(running.timer.nextAlertAtMs,now+30*60000)
 const paused=importLegacyNativeClock({...old,timer:{...started,status:'paused',remainingMs:40*60000,endsAt:null}},now+20*60000)
 assert.equal(paused.timer.nextAlertAtMs,null)
 assert.equal(paused.timer.msUntilNextAlert,10*60000)
})

test('deadline ticks need no write, while pause and interval edits retain durable intent',()=>{
 const now=1800000000000,state=importLegacyNativeClock({...defaultOfflineCoreState(),timer:startOfflineTimer(120000,now)},now)
 const key=nativeClockCommitKey(state.settings,state.timer)
 assert.equal(nativeClockCommitKey(state.settings,{...state.timer,remainingMs:115000}),key)
 assert.notEqual(nativeClockCommitKey(state.settings,{...state.timer,status:'paused',endsAtMs:null}),key)
 assert.notEqual(nativeClockCommitKey(state.settings,{...state.timer,nextAlertAtMs:now+45000}),key)
})
