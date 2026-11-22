import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { readFile } from "node:fs/promises"
import { createServer } from "node:http"

const require = createRequire(import.meta.url)
const root = fileURLToPath(new URL("../..", import.meta.url))
const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`

/** Real component/styles with fictional state; no environment, auth or providers. */
export async function createPracticePaymentsBundle() {
  const { webpack } = require("next/dist/compiled/webpack/webpack")
  const style = await readFile(path.join(root,"components/payments/practice-payments-preview.module.css"),"utf8")
  // Preserve actual selectors in the standalone fixture instead of substituting
  // styling; Next applies its own name mapping in the eventual application build.
  const names = Object.fromEntries([...style.matchAll(/\.([A-Za-z][\w-]*)/g)].map(match=>[match[1],match[1]]))
  const entry=moduleUrl(`import React from 'react';import{createRoot}from'react-dom/client';import{PracticePaymentsPreview}from'@/components/payments/practice-payments-preview';createRoot(document.getElementById('root')).render(React.createElement(React.StrictMode,null,React.createElement(PracticePaymentsPreview)));`)
  const compiler=webpack({mode:"development",target:"web",entry,devtool:false,cache:false,
    output:{path:root,filename:"practice-payments-fixture.js"},
    resolve:{alias:{"@":root},modules:[path.join(root,"node_modules"),"node_modules"],extensions:[".js",".mjs",".tsx",".ts"]},
    module:{rules:[{test:/\.tsx?$/,use:[path.join(root,"tests/helpers/professional-record-vault-browser-loader.cjs")]}]},
    plugins:[new webpack.DefinePlugin({"process.env":JSON.stringify({NODE_ENV:"development"})}),
      new webpack.NormalModuleReplacementPlugin(/practice-payments-preview\.module\.css$/,resource=>{resource.request=moduleUrl(`export default ${JSON.stringify(names)}`)}),
      {apply(owner){owner.hooks.shouldEmit.tap("PaymentFixtureMemoryOnly",()=>false)}}],
  })
  return new Promise((resolve,reject)=>compiler.run((error,stats)=>{
    let value, failure=error
    try {if(!failure&&stats.hasErrors())failure=new Error(stats.toString({all:false,errors:true}));if(!failure)value=String(stats.compilation.getAsset("practice-payments-fixture.js").source.source())}catch(cause){failure=cause}
    compiler.close(cause=>failure||cause?reject(failure||cause):resolve(value))
  }))
}

/** Loopback-only, GET-only preview. It cannot receive card data or proxy APIs. */
export async function startPracticePaymentsPreview(bundle,port=0) {
  const stylesheet=path.join(root,"app/globals.css")
  const global=(await require("postcss")([require("tailwindcss")(path.join(root,"tailwind.config.ts"))]).process(await readFile(stylesheet,"utf8"),{from:stylesheet,map:false})).css
  // Next supplies Inter in the application layout. Keep the isolated fixture
  // readable without fetching that font or changing the component's own CSS.
  const css=global+"\nbody{font-family:Inter,Arial,sans-serif}\n"+await readFile(path.join(root,"components/payments/practice-payments-preview.module.css"),"utf8")
  const server=createServer((request,response)=>{
    response.setHeader("Cache-Control","no-store")
    response.setHeader("X-Content-Type-Options","nosniff")
    response.setHeader("Content-Security-Policy","default-src 'self'; connect-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-src 'none'; form-action 'none'; base-uri 'none'")
    if(request.method!=="GET"){response.writeHead(405);return response.end()}
    const pathname=new URL(request.url,"http://127.0.0.1").pathname
    if(pathname==="/fixture.js"){response.setHeader("Content-Type","text/javascript");return response.end(bundle)}
    if(pathname==="/fixture.css"){response.setHeader("Content-Type","text/css");return response.end(css)}
    if(pathname!=="/"){response.writeHead(404);return response.end()}
    response.setHeader("Content-Type","text/html; charset=utf-8")
    response.end('<!doctype html><html class="dark"><head><title>AtmoShaper payment design preview</title><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>')
  })
  await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(port,"127.0.0.1",resolve)})
  return {origin:`http://127.0.0.1:${server.address().port}`,close:()=>new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()))}
}
