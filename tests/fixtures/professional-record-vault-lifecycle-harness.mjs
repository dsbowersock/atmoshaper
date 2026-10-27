import assert from "node:assert/strict"
import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"

const require = createRequire(import.meta.url)
const root = fileURLToPath(new URL("../..", import.meta.url))
/** Encode native source paths as module specifiers on both Windows and CI. */
const asImport = (relative) => JSON.stringify(path.join(root, relative).replaceAll("\\", "/"))
/** Keep fixture entry/dependency modules in memory rather than exporting source files. */
const dataModule = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`

/** Bundle the actual context owner and real crypto; only presentation and asynchronous timing are controlled. */
export async function createProfessionalVaultLifecycleBundle({ renderGate = false } = {}) {
  const { webpack } = require("next/dist/compiled/webpack/webpack")
  const { NormalModuleReplacementPlugin } = webpack
  const uiNames = ["Download", "FolderOpen", "KeyRound", "LockKeyhole", "ShieldCheck", "Trash2", "AlertDialog", "AlertDialogAction", "AlertDialogCancel", "AlertDialogContent", "AlertDialogDescription", "AlertDialogFooter", "AlertDialogHeader", "AlertDialogTitle", "AlertDialogTrigger", "AppInset", "AppNotice", "AppPageShell", "AppSurface", "Button", "Input", "Label"]
  // Gate cases retain its real handlers/state while replacing presentation with native controls.
  const ui = dataModule("import React from 'react';\n" + uiNames.map((name) => {
    if (!renderGate) return `export const ${name}=()=>null;`
    if (name === "Input") return "export const Input=({id,type,value,onChange,autoComplete})=>React.createElement('input',{id,type,value,onChange,autoComplete});"
    if (name === "Button") return "export const Button=({type,onClick,disabled,children})=>React.createElement('button',{type,onClick,disabled},children);"
    if (name === "Label") return "export const Label=({htmlFor,children})=>React.createElement('label',{htmlFor},children);"
    if (["AppInset", "AppNotice", "AppPageShell", "AppSurface"].includes(name)) return `export const ${name}=({children})=>React.createElement('section',null,children);`
    return `export const ${name}=()=>null;`
  }).join("\n") + "\nexport const appCalloutClassName='';")
  const controlled = dataModule(`
    import * as actual from ${asImport("lib/professional-record-vault.js")};
    export * from ${asImport("lib/professional-record-vault.js")};
    async function checkpoint(kind) {
      const fixture=window.__vaultFixture;
      fixture.cryptoCalls[kind]=(fixture.cryptoCalls[kind]??0)+1;
      if(fixture.holdNext!==kind)return;
      fixture.holdNext=null;
      await new Promise((resolve,reject)=>{fixture.gate={kind,resolve,reject}});
    }
    export async function decryptEncryptedProfessionalRecordVault(...args){await checkpoint('decrypt-vault');return actual.decryptEncryptedProfessionalRecordVault(...args)}
    export async function createEncryptedProfessionalRecordVault(...args){await checkpoint('encrypt-vault');return actual.createEncryptedProfessionalRecordVault(...args)}
    export async function decryptEncryptedProfessionalRecordBundle(...args){await checkpoint('decrypt-bundle');return actual.decryptEncryptedProfessionalRecordBundle(...args)}
    export async function createEncryptedProfessionalRecordBundle(...args){await checkpoint('encrypt-bundle');return actual.createEncryptedProfessionalRecordBundle(...args)}
  `)
  const entry = dataModule(`
    import React,{act,useEffect} from 'react';
    import {createRoot} from 'react-dom/client';
    import {ProfessionalRecordVaultProvider,ProfessionalRecordVaultGate,useProfessionalRecordVault} from ${asImport("app/notes/professional-record-vault-provider.tsx")};
    import * as helpers from ${asImport("lib/professional-record-vault.js")};
    const stored=new Map();
    Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:key=>stored.get(key)??null,setItem:(key,value)=>stored.set(key,String(value)),removeItem:key=>stored.delete(key),clear:()=>stored.clear()}});
    window.IS_REACT_ACT_ENVIRONMENT=true;
    const fixture=window.__vaultFixture={api:null,act,helpers,holdNext:null,gate:null,stored,cryptoCalls:{}};
    function Probe(){const vault=useProfessionalRecordVault();useEffect(()=>{fixture.api=vault;return()=>{if(fixture.api===vault)fixture.api=null}},[vault]);return React.createElement('output',null,vault.status)}
    const renderer=createRoot(document.getElementById('root'));
    fixture.mount=(strict=false)=>act(async()=>{const tree=React.createElement(ProfessionalRecordVaultProvider,null,React.createElement(Probe),${renderGate ? "React.createElement(ProfessionalRecordVaultGate,null,React.createElement('p',{'data-testid':'vault-protected'},'Invented protected drafts'))" : "null"});renderer.render(strict?React.createElement(React.StrictMode,null,tree):tree)});
    fixture.unmount=()=>act(async()=>{renderer.render(null)});
    fixture.ready=fixture.mount();
  `)
  const compiler = webpack({
    mode: "development", target: "web", entry, devtool: false, cache: false,
    output: { path: path.join(root, "test-results", "vault-lifecycle-fixture"), filename: "fixture.js" },
    resolve: { modules: [path.join(root, "node_modules"), "node_modules"], extensions: [".js", ".mjs", ".tsx", ".ts"] },
    module: { rules: [{ test: /\.tsx?$/, use: [path.join(root, "tests/helpers/professional-record-vault-browser-loader.cjs")] }] },
    optimization: { minimize: false },
    plugins: [
      new NormalModuleReplacementPlugin(/^(?:lucide-react|@\/components\/ui\/(?:alert-dialog|app-surface|button|input|label))$/, (resource) => { resource.request = ui }),
      new NormalModuleReplacementPlugin(/^@\/lib\/professional-record-vault$/, (resource) => { resource.request = controlled }),
      new NormalModuleReplacementPlugin(/^@\/lib\/public-product-identity$/, (resource) => { resource.request = path.join(root, "lib/public-product-identity.js") }),
      { apply(owner) { owner.hooks.shouldEmit.tap("KeepVaultFixtureInMemory", () => false) } },
    ],
  })
  return new Promise((resolve, reject) => {
    compiler.run((error, stats) => {
      let bundle, failure = error
      try {
        if (!failure && stats.hasErrors()) failure = new Error(stats.toString({ all: false, errors: true }))
        if (!failure) bundle = String(stats.compilation.getAsset("fixture.js").source.source())
      } catch (readError) { failure = readError }
      compiler.close((closeError) => { if (failure || closeError) reject(failure || closeError); else resolve(bundle) })
    })
  })
}

/** Give each case an isolated in-memory vault and virtual page; permit no network dispatch. */
export async function withProfessionalVaultLifecycleFixture(browser, bundle, run) {
  const context = await browser.newContext({ serviceWorkers: "block" })
  const unexpected = []
  const virtualUrl = "http://127.0.0.1:43917/vault-lifecycle-fixture"
  await context.route("**/*", (route) => {
    if (route.request().url() === virtualUrl) return route.fulfill({ status: 200, contentType: "text/html", body: '<!doctype html><html><body><div id="root"></div></body></html>' })
    unexpected.push(route.request().url())
    return route.abort("blockedbyclient")
  })
  try {
    const page = await context.newPage()
    await page.goto(virtualUrl)
    await page.addScriptTag({ content: bundle })
    await page.evaluate(async () => { await window.__vaultFixture.ready })
    await run(page)
    assert.deepEqual(unexpected, [], "The fixture must not request application services or media")
  } finally { await context.close() }
}
