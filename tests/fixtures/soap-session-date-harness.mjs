import assert from "node:assert/strict"
import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"

const require = createRequire(import.meta.url)
const root = fileURLToPath(new URL("../..", import.meta.url))
const asImport = (relative) => JSON.stringify(path.join(root, relative).replaceAll("\\", "/"))
const dataModule = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`

/** Render the real identity editor/providers; flush controlled parent-state and step changes with React act. */
export async function createSoapSessionDateBundle() {
  const { webpack } = require("next/dist/compiled/webpack/webpack")
  const entry = dataModule(`
    import React,{act,useEffect,useState} from 'react';
    import {createRoot} from 'react-dom/client';
    import {IdentifyingInfo} from ${asImport("app/notes/soap/components/identifying-info.tsx")};
    import {TherapistSettingsProvider,useTherapistSettings} from ${asImport("components/providers/therapist-settings-provider.tsx")};
    import {AccountShellBootstrapProvider} from ${asImport("components/providers/account-shell-bootstrap-provider.tsx")};
    import {projectAccountShellAppSettings} from ${asImport("lib/account-shell-bootstrap.js")};
    window.IS_REACT_ACT_ENVIRONMENT=true;
    const fixture=window.__soapDateFixture={};
    function Editor(){
      const [formData,setFormData]=useState({clientName:'Invented fixture client',date:new URLSearchParams(location.search).get('date')??'',dateOfBirth:'',time:'',therapistName:'',location:'',licenseNumber:'',licenseOrganization:'',npiNumber:'',clientNumber:''});
      const [identify,setIdentify]=useState(true);
      const {updateSettings}=useTherapistSettings();
      useEffect(()=>{
        fixture.setDate=value=>act(async()=>setFormData(previous=>({...previous,date:value})));
        fixture.next=()=>act(async()=>setIdentify(false));
        fixture.previous=()=>act(async()=>setIdentify(true));
        fixture.updateSettings=()=>act(async()=>updateSettings({name:'Invented updated therapist'}));
      },[updateSettings]);
      return React.createElement(React.Fragment,null,
        React.createElement('button',{onClick:()=>setIdentify(v=>!v)},identify?'Next step':'Previous step'),
        React.createElement('button',{onClick:()=>updateSettings({name:'Invented updated therapist'})},'Update local therapist settings'),
        identify?React.createElement(IdentifyingInfo,{formData,setFormData}):React.createElement('p',null,'Another SOAP step'));
    }
    // Attach the await inside this browser task before React's unawaited-act warning can fire.
    const tree=React.createElement(AccountShellBootstrapProvider,
      {initialBootstrap:{ownerKey:null,syncEnabled:false,preferenceStatus:'anonymous',appSettings:projectAccountShellAppSettings({}),hasPracticeMembership:false}},
      React.createElement(TherapistSettingsProvider,null,React.createElement(Editor)));
    const renderer=createRoot(document.getElementById('root'));
    fixture.ready=(async()=>{await act(async()=>{renderer.render(tree)});})();
  `)
  const compiler = webpack({
    mode: "development", target: "web", entry, devtool: false, cache: false,
    output: { path: path.join(root, "test-results/soap-session-date"), filename: "fixture.js" },
    resolve: { alias: { "@": root }, modules: [path.join(root, "node_modules"), "node_modules"], extensions: [".js", ".mjs", ".tsx", ".ts"] },
    module: { rules: [{ test: /\.tsx?$/, use: [path.join(root, "tests/helpers/secondary-display-browser-loader.cjs")] }] },
    optimization: { minimize: false },
    plugins: [{ apply(owner) { owner.hooks.shouldEmit.tap("KeepSoapDateFixtureInMemory", () => false) } }],
  })
  return new Promise((resolve, reject) => compiler.run((error, stats) => {
    let bundle, failure = error
    try {
      if (!failure && stats.hasErrors()) failure = new Error(stats.toString({ all: false, errors: true }))
      if (!failure) bundle = String(stats.compilation.getAsset("fixture.js").source.source())
    } catch (readError) { failure = readError }
    compiler.close((closeError) => failure || closeError ? reject(failure || closeError) : resolve(bundle))
  }))
}

/** Give each case an isolated virtual document and abort every service/media request. */
export async function withSoapSessionDateFixture(context, bundle, date, run) {
  const page = await context.newPage()
  const unexpected = [], errors = []
  const url = `http://127.0.0.1:43931/soap-date?date=${encodeURIComponent(date)}`
  await page.route("**/*", (route) => {
    if (route.request().url() === url && route.request().method() === "GET") return route.fulfill({ status: 200, contentType: "text/html", body: '<!doctype html><html><head><title>Invented SOAP date fixture</title></head><body><div id="root"></div></body></html>' })
    unexpected.push(route.request().url())
    return route.abort("blockedbyclient")
  })
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => { if (["error", "warning"].includes(message.type())) errors.push(message.text()) })
  try {
    await page.goto(url)
    await page.evaluate(() => localStorage.clear())
    await page.addScriptTag({ content: bundle })
    await page.evaluate(async () => { await window.__soapDateFixture.ready })
    await page.getByLabel("Date of Session", { exact: true }).waitFor()
    await run(page)
    assert.deepEqual(errors, [], "The real editor/providers must render without runtime or console errors")
    assert.deepEqual(unexpected, [], "The regression must make no application-service or media requests")
  } finally { await page.close() }
}
