import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import ts from 'typescript'

/** Execute the authored runtime with a closed dependency set; no real audio,
 * device store, provider or production authority enters these regressions. */
async function loadRuntime(relative,mocks,globals={}){
 const source=await readFile(new URL(relative,import.meta.url),'utf8')
 const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,jsx:ts.JsxEmit.ReactJSX}})
 const compiled={exports:{}}
 new Function('require','module','exports',...Object.keys(globals),outputText)(name=>{assert.ok(name in mocks,'Unexpected dependency: '+name);return mocks[name]},compiled,compiled.exports,...Object.values(globals))
 return compiled.exports
}

test('native links invoke the cancellable navigation callback only for handled navigation',async()=>{
 const calls=[]
 const {default:Link}=await loadRuntime('../native/web/platform/link.tsx',{
  react:{forwardRef:render=>render},'react/jsx-runtime':{jsx:(type,props)=>({type,props})},
  './navigation':{navigateNative:(path,replace)=>calls.push(['route',path,replace])},
 },{navigator:{onLine:false}})
 const event=overrides=>({button:0,defaultPrevented:false,preventDefault(){this.defaultPrevented=true},...overrides})
 const props={href:'/music',replace:true,onClick:()=>calls.push(['click']),onNavigate:()=>calls.push(['navigate'])}
 const anchor=Link(props,null),click=event()
 assert.equal('onNavigate' in anchor.props,false,'Next-only lifecycle callbacks never reach the DOM')
 anchor.props.onClick(click)
 assert.equal(click.defaultPrevented,true)
 assert.deepEqual(calls,[['click'],['navigate'],['route','/music',true]])
 calls.length=0
 const cancelled=event()
 Link({...props,onNavigate:notice=>{calls.push(['cancel']);notice.preventDefault()}},null).props.onClick(cancelled)
 assert.equal(cancelled.defaultPrevented,true);assert.deepEqual(calls,[['click'],['cancel']])
 for(const [overrides,gesture] of [[{}, {ctrlKey:true}],[{target:'_blank'},{}],[{download:true},{}],[{href:'https://example.com'},{}],[{href:'//example.com'},{}],[{}, {button:1}],[{onClick:e=>e.preventDefault()},{}]]){
  calls.length=0
  Link({...props,...overrides},null).props.onClick(event(gesture))
  assert.equal(calls.some(([kind])=>kind==='navigate'||kind==='route'),false)
 }
})

test('station startup honors zero and reduced volume before transport starts; omitted volume retains its level',async()=>{
 const gains=[],atStart=[]
 class Gain{
  constructor(value){this.gain={value,rampTo:next=>{this.gain.value=next}};gains.push(this)}
  connect(){return this} toDestination(){return this} dispose(){}
 }
 const Tone={Gain,start:async()=>{},getContext:()=>({rawContext:{}}),Transport:{start(){atStart.push(gains.at(-1).gain.value)}}}
 const {createOfflineAudioRuntime}=await loadRuntime('../native/web/offline-audio-runtime.ts',{
  tone:Tone,'@generative-music/web-library':()=>({}),
  '@/lib/atmosphere/generative-fm-piece-loader':{loadGenerativeFmPieceModule:async()=>async()=>[()=>{},()=>()=>{}]},
  '@/lib/atmoshaper/ambient-audio-runtime':{},'@/lib/atmoshaper/generated-audio-runtime':{},
  '@/lib/offline-media':{readVerifiedOfflinePack:async()=>({files:[],sampleIndex:{}})},
  '@/lib/offline-station-transport':{createStationTransportScope:()=>({run:fn=>fn(),stop(){}})},
 })
 const previous=globalThis.window;globalThis.window={}
 try{
  for(const [volume,expected] of [[0,0],[0.25,10**(-48/20)],[undefined,10**(-24/20)]]){
   const runtime=createOfflineAudioRuntime({})
   assert.equal(await runtime.play({id:'fixture',kind:'station',station:{runtime:{pieceId:'fixture'}}},undefined,volume),true)
   assert.equal(atStart.at(-1),expected)
   runtime.volume('fixture',0);assert.equal(gains.at(-1).gain.value,0)
   await runtime.dispose()
  }
 }finally{if(previous===undefined)delete globalThis.window;else globalThis.window=previous}
})

test('shared generative wrapper supplies the requested level before play rather than after it',async()=>{
 let startup,lateVolume=0
 const {startGenerativeFmPiece}=await loadRuntime('../native/web/platform/generative-fm.ts',{
  '@/lib/atmosphere/stations':{getAtmosphereStationById:()=>({id:'fixture'})},
  '@/lib/offline-media':{createOfflineMediaStore:()=>({})},
  '@/lib/native-media-source':{createNativePlaybackStore:()=>({})},
  '../offline-audio-runtime':{createOfflineAudioRuntime:()=>({async play(_item,_progress,volume){startup=volume;return true},volume(){lateVolume++},async dispose(){}})},
 })
 const handle=await startGenerativeFmPiece({station:{id:'fixture'},volume:0})
 assert.equal(startup,0);assert.equal(lateVolume,0)
 handle.setVolume(0.5);assert.equal(lateVolume,1)
 await handle.dispose()
})

test('Forget during delayed startup verification releases free-tool readiness without reviving claims',async()=>{
 const source=await readFile(new URL('../native/web/offline-backgrounds.tsx',import.meta.url),'utf8')
 const ast=ts.createSourceFile('offline-backgrounds.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX)
 const hook=ast.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='useOfflineBackgroundAccess')
 assert.ok(hook)
 const code=ts.transpileModule(hook.getText(ast).replace('export function','function'),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText
 let cursor=0,mounted=false,releaseOld
 const values=[],effects=[],window=new EventTarget(),now=Date.now()
 window.setInterval=()=>1;window.clearInterval=()=>{}
 const claims={device:'fixture-device',challenge:'fixture-challenge',issuedAt:now,owned:['fixture'],premiumUntil:null}
 let record={device:claims.device,receipt:'old',pending:{challenge:claims.challenge,at:now},lastIssuedAt:0,lastSeen:0},queue=Promise.resolve()
 const store={update(fn){const result=queue.then(async()=>{record=await fn(structuredClone(record));return structuredClone(record)});queue=result.catch(()=>{});return result}}
 const context={
  useState(initial){const slot=cursor++;if(!mounted)values[slot]=typeof initial==='function'?initial():initial;return [values[slot],value=>{values[slot]=typeof value==='function'?value(values[slot]):value}]},
  useRef(initial){const slot=cursor++;if(!mounted)values[slot]={current:initial};return values[slot]},
  useEffect(fn){if(!mounted)effects.push(fn)},createOfflineAccessStore:()=>store,
  verifyOfflineAccessReceipt:receipt=>receipt==='old'?new Promise(resolve=>{releaseOld=()=>resolve({...claims})}):Promise.resolve({...claims}),
  publicKeys:[],OFFLINE_ACCESS_REQUEST_TTL:600000,randomOfflineAccessId:()=> 'replacement-device',
  offlineBackgroundSnapshot:value=>({featureKeys:[],ownedBackgroundIds:value.owned}),window,
 }
 const executeHook=new Function(...Object.keys(context),code+';return useOfflineBackgroundAccess')(...Object.values(context))
 const render=()=>{cursor=0;const result=executeHook();mounted=true;return result}
 const settle=async()=>{for(let turn=0;turn<12;turn++)await new Promise(resolve=>setImmediate(resolve))}
 render();const cleanups=effects.map(fn=>fn())
 try{
  await settle();assert.equal(typeof releaseOld,'function');assert.equal(render().loaded,false)
  window.dispatchEvent(new CustomEvent('atmoshaper:offline-access',{detail:'fresh'}))
  await settle();assert.equal(render().canForget,true)
  await render().forget();releaseOld();await settle()
  const result=render();assert.equal(result.loaded,true);assert.equal(result.claims,null)
  assert.equal(result.canForget,false);assert.deepEqual(result.access.ownedBackgroundIds,[])
  assert.equal(record.receipt,null);assert.equal(record.device,'replacement-device')
 }finally{for(const cleanup of cleanups)cleanup?.()}
})
