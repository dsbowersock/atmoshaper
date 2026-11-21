import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { readFile } from "node:fs/promises"
import { createServer } from "node:http"

const require = createRequire(import.meta.url)
const root = fileURLToPath(new URL("../..", import.meta.url))
const dataModule = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`

/** Runs the real calendar, controls, private controller and details with fictional
 * data. All server actions and navigation terminate in in-memory test doubles. */
export async function createCalendarWorkspaceBrowserBundle() {
  const { webpack } = require("next/dist/compiled/webpack/webpack")
  const { getCssModuleLocalIdent } = require("next/dist/build/webpack/config/blocks/css/loaders/getCssModuleLocalIdent")
  const actions = dataModule(`export async function loadPersonalWellnessCalendarAction(input) {
    window.__calendarReads.push(input);
    return {ok:true,ownerKey:window.__calendarOwner,data:{records:[{
      id:'fictional-record',category:'activity',occurredAt:'2026-11-20T10:00:00.000Z',
      summary:'Fictional private recording',metadata:{},regions:[],sensations:[],contexts:[],intensity:null,persisted:true
    }],appointments:[],schedules:[],recordCursor:null,appointmentCursor:null}};
  }
  export async function saveCalendarPreferencesAction(input){window.__calendarWrites.push(input)}
  export async function rescheduleCalendarEventAction(input){window.__calendarWrites.push(input)}
  `)
  const router = dataModule(`export const useRouter=()=>({push:(url)=>window.__calendarNavigation.push(url)});`)
  const entry = dataModule(`
    import React,{useState} from 'react'; import {createRoot} from 'react-dom/client';
    import {CalendarWorkspace} from ${JSON.stringify(path.join(root,"app/calendar/calendar-workspace.tsx"))};
    import {normalizeCalendarPreferences} from ${JSON.stringify(path.join(root,"lib/calendar-preferences.js"))};
    window.__calendarReads=[];window.__calendarWrites=[];window.__calendarNavigation=[];window.__calendarOwner='fictional-owner';
    function Fixture(){const [owner,setOwner]=useState('fictional-owner');window.__switchCalendarOwner=()=>{window.__calendarOwner='fictional-second';setOwner('fictional-second')};
      const noPractice=new URL(location.href).searchParams.has('personalOnly');
      const split=new URL(location.href).searchParams.has('split');
      return React.createElement(React.Fragment,null,
        React.createElement('p',{className:'px-3 py-2 text-xs text-muted-foreground'},'Local preview · fictional sample data'),
        React.createElement('div',{className:'flex min-h-0 flex-1 flex-col'},React.createElement(CalendarWorkspace,{
          key:owner,currentUserId:owner,initialDate:'2026-11-20',initialScope:noPractice?'personal':split?'practice':'together',hasPractice:!noPractice,
          selectedPracticeId:'fictional-practice',practiceOptions:noPractice?[]:[{id:'fictional-practice',name:'Example Studio'},{id:'fictional-second-practice',name:'Example Group'}],
          providers:[{id:owner,label:'Example provider'},...(split?[{id:'fictional-colleague',label:'Example colleague'}]:[])],providerAvailability:[],preferences:normalizeCalendarPreferences({defaultRange:'month',providerViewMode:split?'split':'only-me'}),
          events:noPractice?[]:[{id:'fictional-appointment',title:'Example appointment',start:'2026-11-20T13:00:00Z',end:'2026-11-20T14:00:00Z',extendedProps:{ownerUserId:owner,statusBadge:'Confirmed'}}]
        })))
    }createRoot(document.getElementById('root')).render(React.createElement(Fixture));
  `)
  const compiler = webpack({
    mode:"development",target:"web",entry,devtool:false,cache:false,
    output:{path:root,filename:"calendar-workspace-fixture.js"},
    resolve:{alias:{"@":root},modules:[path.join(root,"node_modules"),"node_modules"],extensions:[".js",".mjs",".tsx",".ts"]},
    module:{rules:[{test:/\.tsx?$/,use:[path.join(root,"tests/helpers/professional-record-vault-browser-loader.cjs")]},
      {test:/\.module\.css$/,use:[require.resolve("next/dist/build/webpack/loaders/next-style-loader"),{
        loader:require.resolve("next/dist/build/webpack/loaders/css-loader/src"),options:{esModule:false,postcss:async()=>({postcss:require("postcss")}),modules:{auto:/\.module\.css$/,mode:"pure",getLocalIdent:getCssModuleLocalIdent}},
      }]},
    ]},
    optimization:{minimize:false},plugins:[
      new webpack.NormalModuleReplacementPlugin(/^@\/app\/(wellness\/calendar-actions|calendar\/actions)$/, (resource)=>{resource.request=actions}),
      new webpack.NormalModuleReplacementPlugin(/^next\/navigation$/, (resource)=>{resource.request=router}),
      {apply(owner){owner.hooks.compilation.tap("CalendarStylesheetTrace",(compilation)=>{
        const span={traceChild:()=>span,traceFn:(fn)=>fn(),traceAsyncFn:(fn)=>fn()}
        webpack.NormalModule.getCompilationHooks(compilation).loader.tap("CalendarStylesheetTrace",(context)=>{context.currentTraceSpan=span})
      })}},
      {apply(owner){owner.hooks.shouldEmit.tap("CalendarFixtureInMemory",()=>false)}},
    ],
  })
  return new Promise((resolve,reject)=>compiler.run((error,stats)=>{
    let bundle,failure=error
    try {if(!failure&&stats.hasErrors())failure=new Error(stats.toString({all:false,errors:true}));if(!failure)bundle=String(stats.compilation.getAsset("calendar-workspace-fixture.js").source.source())}catch(cause){failure=cause}
    compiler.close((cause)=>failure||cause?reject(failure||cause):resolve(bundle))
  }))
}

/** Loopback-only preview. No production cookies, backend reads, or external
 * requests are required. Compile source CSS independently of .next so this
 * fixture also runs in the unit-test job before an application build exists. */
export async function startCalendarWorkspaceBrowserFixture(bundle, port = 0) {
  const stylesheet=path.join(root,"app/globals.css")
  const css=(await require("postcss")([require("tailwindcss")(path.join(root,"tailwind.config.ts"))])
    .process(await readFile(stylesheet,"utf8"),{from:stylesheet,map:false})).css
  const server=createServer((request,response)=>{
    const url=new URL(request.url,"http://127.0.0.1")
    if(request.method!=="GET"){response.writeHead(405);return response.end()}
    if(url.pathname==="/fixture.js"){response.setHeader("Content-Type","text/javascript");return response.end(bundle)}
    if(url.pathname==="/fixture.css"){response.setHeader("Content-Type","text/css");return response.end(css)}
    if(url.pathname!=="/"){response.writeHead(404);return response.end()}
    response.setHeader("Content-Type","text/html; charset=utf-8")
    response.end('<!doctype html><html class="dark"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><link rel="stylesheet" href="/fixture.css"><style>html,body,#root{height:100%;margin:0}#root{display:flex;flex-direction:column}body{font-family:Arial,sans-serif}</style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>')
  })
  await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(port,"127.0.0.1",resolve)})
  return {origin:`http://127.0.0.1:${server.address().port}`,close:()=>new Promise((resolve,reject)=>server.close((error)=>error?reject(error):resolve()))}
}
