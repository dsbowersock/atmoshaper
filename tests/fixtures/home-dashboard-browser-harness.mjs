import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { readFile } from "node:fs/promises"
import { createServer } from "node:http"
import React from "react"
import { renderToString } from "react-dom/server"
import { loadAttributionComponent } from "../helpers/anatomy-attribution-component-loader.mjs"
import { resolveHomeDashboard } from "../../lib/home-dashboard.js"
import { resolveNavigation } from "../../lib/navigation.js"

const require=createRequire(import.meta.url)
const root=fileURLToPath(new URL("../..",import.meta.url))
const moduleUrl=(source)=>`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
const { HomeDashboard: ServerHomeDashboard } = loadAttributionComponent("components/home/home-dashboard.tsx")

/** Real dashboard, buttons and modal with synthetic permissions and plain local
 * links. Only the shell footprint is simulated; no account/services are loaded. */
export async function createHomeDashboardBundle() {
  const {webpack}=require("next/dist/compiled/webpack/webpack")
  const link=moduleUrl(`import React from 'react';export default React.forwardRef(function Link({children,...props},ref){return React.createElement('a',{...props,ref},children)})`)
  const entry=moduleUrl(`import React from 'react';import {createRoot,hydrateRoot} from 'react-dom/client';
    import {HomeDashboard} from ${JSON.stringify(path.join(root,"components/home/home-dashboard.tsx"))};
    import {resolveHomeDashboard} from ${JSON.stringify(path.join(root,"lib/home-dashboard.js"))};
    import {resolveNavigation} from ${JSON.stringify(path.join(root,"lib/navigation.js"))};
    const params=new URL(location.href).searchParams;const signedIn=params.has('signedIn');
    const model=resolveHomeDashboard(params.has('custom')?{homeShortcuts:['anatomime','business_income_planner','chimer','atmosphere','calendar_booking','local_notes']}: {},resolveNavigation({authState:signedIn?'signed-in':'anonymous'}).primaryNavigationGroups);
    const element=React.createElement(HomeDashboard,{signedIn,...model});
    window.__homeHydrationErrors=[];
    if(params.has('hydrate'))hydrateRoot(document.getElementById('root'),element,{onRecoverableError:(error)=>window.__homeHydrationErrors.push(error.message)});
    else createRoot(document.getElementById('root')).render(element);`)
  const compiler=webpack({mode:"development",target:"web",entry,devtool:false,cache:false,
    output:{path:root,filename:"home-fixture.js"},
    resolve:{alias:{"@":root},modules:[path.join(root,"node_modules"),"node_modules"],extensions:[".js",".mjs",".tsx",".ts"]},
    module:{rules:[{test:/\.tsx?$/,use:[path.join(root,"tests/helpers/professional-record-vault-browser-loader.cjs")]}]},
    plugins:[
      // Next normally supplies compile-time client env values. The fixture has
      // no provider environment; its real Image component uses safe defaults.
      new webpack.DefinePlugin({"process.env":JSON.stringify({NODE_ENV:"development"})}),
      new webpack.NormalModuleReplacementPlugin(/^next\/link$/,(resource)=>{resource.request=link}),
      {apply(owner){owner.hooks.shouldEmit.tap("HomeFixtureInMemory",()=>false)}},
    ]})
  return new Promise((resolve,reject)=>compiler.run((error,stats)=>{
    let bundle,failure=error
    try {if(!failure&&stats.hasErrors())failure=new Error(stats.toString({all:false,errors:true}));if(!failure)bundle=String(stats.compilation.getAsset("home-fixture.js").source.source())}catch(cause){failure=cause}
    compiler.close((cause)=>failure||cause?reject(failure||cause):resolve(bundle))
  }))
}

/** Loopback only; provider-free source render for state, geometry and keyboard tests. */
export async function startHomeDashboardFixture(bundle,port=0) {
  const stylesheet=path.join(root,"app/globals.css")
  const css=(await require("postcss")([require("tailwindcss")(path.join(root,"tailwind.config.ts"))]).process(await readFile(stylesheet,"utf8"),{from:stylesheet,map:false})).css
  const server=createServer((request,response)=>{
    const url=new URL(request.url,"http://127.0.0.1")
    if(request.method!=="GET"){response.writeHead(405);return response.end()}
    if(url.pathname==="/fixture.js"){response.setHeader("Content-Type","text/javascript");return response.end(bundle)}
    if(url.pathname==="/fixture.css"){response.setHeader("Content-Type","text/css");return response.end(css)}
    if(url.pathname==="/brand/atmoshaper-wordmark.png"){
      response.setHeader("Content-Type","image/png")
      readFile(path.join(root,"public/brand/atmoshaper-wordmark.png")).then((asset)=>response.end(asset)).catch(()=>{response.writeHead(500);response.end()})
      return
    }
    if(url.pathname!=="/"){response.writeHead(404);return response.end()}
    response.setHeader("Content-Type","text/html; charset=utf-8")
    const markup=url.searchParams.has("hydrate") ? renderToString(React.createElement(ServerHomeDashboard,{
      signedIn:false,...resolveHomeDashboard({},resolveNavigation().primaryNavigationGroups),
    })) : ""
    response.end('<!doctype html><html class="dark"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><link rel="stylesheet" href="/fixture.css"><style>html,body{margin:0;font-family:Arial,sans-serif}#root{min-width:0;margin:0 auto;padding-bottom:88px}body{min-height:100dvh}body:after{content:"Shared app bar footprint (preview)";position:fixed;bottom:0;left:0;right:0;height:72px;background:hsl(var(--background));border-top:1px solid hsl(var(--border));display:grid;place-items:center;font-size:12px;color:hsl(var(--muted-foreground))}</style></head><body><main id="root">'+markup+'</main><script src="/fixture.js"></script></body></html>')
  })
  await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(port,"127.0.0.1",resolve)})
  return {origin:`http://127.0.0.1:${server.address().port}`,close:()=>new Promise((resolve,reject)=>server.close((error)=>error?reject(error):resolve()))}
}
