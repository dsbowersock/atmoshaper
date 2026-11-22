import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { readFile } from "node:fs/promises"
import { createServer } from "node:http"

const require = createRequire(import.meta.url)
const root = fileURLToPath(new URL("../..", import.meta.url))
const moduleUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`

/** Bundle real UI/CSS with a fictional owner and deterministic local actions.
 * No auth, database, email, provider environment or external requests are used. */
export async function createOnboardingBundle() {
  const { webpack } = require("next/dist/compiled/webpack/webpack")
  // Keep Next's real app-router click handler: an inert anchor would miss the
  // child navigation that occurs before a form's bubbling save/leave handler.
  const link = moduleUrl(`import React from 'react';import NextLink from ${JSON.stringify(path.join(root, "node_modules/next/dist/client/app-dir/link.js"))};export default function Link(props){return React.createElement(NextLink,{...props,prefetch:false})}`)
  const linkLifecycle = moduleUrl(`export const IDLE_LINK_STATUS={pending:false};export function mountLinkInstance(){return null}export function unmountLinkForCurrentNavigation(){}export function unmountPrefetchableInstance(){}export function onNavigationIntent(){}`)
  const linkNavigator = moduleUrl(`export function navigate(href){window.__setupFixture.router.push(href)}`)
  const navigation = moduleUrl(`export function useRouter(){return window.__setupFixture.router}`)
  const actions = moduleUrl(`
    const key='fixture.optional-setup';
    export async function claimSetupInvitationAction(owner){
      const state=window.__setupFixture;state.claims++;state.owners.push(owner);
      if(state.deferClaim)await new Promise(resolve=>state.releaseClaim=resolve);
      const phase=sessionStorage.getItem(key);
      if(phase==='started'&&state.resume){sessionStorage.setItem(key,'resume_offered');return {ok:true,show:true,kind:'resume'}};
      if(phase)return {ok:true,show:false};
      sessionStorage.setItem(key,'offered');return {ok:true,show:true,kind:'new'};
    }
    export async function chooseSetupInvitationAction(owner,choice,kind){
      const state=window.__setupFixture;state.choices.push(choice);state.owners.push(owner);
      if(state.deferChoice)await new Promise(resolve=>state.releaseChoice=resolve);
      if(state.failChoice){state.failChoice=false;return {ok:false}};
      sessionStorage.setItem(key,choice==='started'&&kind==='resume'?'resumed':choice);return {ok:true,choice};
    }`)
  const progress = moduleUrl(`
    export async function saveOnboardingDraftAction(owner,revision,data){
      const state=window.__setupFixture;state.saves.push({owner,revision,entries:[...data.entries()]});
      if(state.deferProgress)await new Promise(resolve=>state.releaseProgress=resolve);
      if(state.failProgress){state.failProgress=false;return {ok:false}};
      if(state.conflictProgress||revision!==state.revision)return {ok:false,conflict:true};
      state.revision++;state.savedEntries=[...data.entries()];
      sessionStorage.setItem('fixture.progress',JSON.stringify({revision:state.revision,entries:state.savedEntries}));
      if(!['skipped','resumed','resume_offered'].includes(sessionStorage.getItem('fixture.optional-setup')))sessionStorage.setItem('fixture.optional-setup','started');
      return {ok:true,revision:state.revision};
    }
    export async function saveOnboardingAction(owner,revision,data){
      const state=window.__setupFixture;state.finishes.push({owner,revision,entries:[...data.entries()]});
      sessionStorage.setItem('fixture.optional-setup','completed');
      state.router.replace('/');
    }`)
  const entry = moduleUrl(`import React from 'react';import {createRoot} from 'react-dom/client';
    import Link from 'next/link';
    import {AppRouterContext} from ${JSON.stringify(path.join(root, "node_modules/next/dist/shared/lib/app-router-context.shared-runtime.js"))};
    import {OnboardingInvitation} from ${JSON.stringify(path.join(root, "components/account/onboarding-invitation.tsx"))};
    import {AccountSetupOptions} from ${JSON.stringify(path.join(root, "components/account/account-setup-options.tsx"))};
    import {OnboardingDraftForm} from ${JSON.stringify(path.join(root, "components/account/onboarding-draft-form.tsx"))};
    import {HomeShortcutEditor} from ${JSON.stringify(path.join(root, "components/home/home-shortcut-editor.tsx"))};
    import {Button} from ${JSON.stringify(path.join(root, "components/ui/button.tsx"))};
    const params=new URL(location.href).searchParams;
    const root=createRoot(document.getElementById('root'));
    const saved=JSON.parse(sessionStorage.getItem('fixture.progress')||'null');
    const state=window.__setupFixture={claims:0,choices:[],owners:[],destinations:[],saves:[],finishes:[],revision:saved?.revision||0,savedEntries:saved?.entries||[],deferClaim:params.has('deferClaim'),deferChoice:params.has('deferChoice'),failChoice:params.has('failChoice'),deferProgress:params.has('deferProgress'),failProgress:params.has('failProgress'),conflictProgress:params.has('conflictProgress'),resume:params.has('resume'),router:{replace(destination){state.destinations.push(destination);render(React.createElement('div',{className:'p-4 space-y-4'},React.createElement('h1',null,destination.startsWith('/onboarding?')?'Guided setup selected':'You’re ready to continue'),React.createElement('p',null,'Local preview only. No account was created or changed.'),React.createElement(AccountSetupOptions))) },push(destination){this.replace(destination)}},unmount:()=>root.unmount()};
    function render(content){root.render(React.createElement(AppRouterContext.Provider,{value:state.router},React.createElement(React.StrictMode,null,content)))}
    const answers=new FormData();for(const [key,value]of state.savedEntries)answers.append(key,value);
    const tools=[{key:'chimer',title:'Clock',description:'Timer',status:'Public'},{key:'atmosphere',title:'Music',description:'Audio',status:'Public'}];
    const form=React.createElement('div',{className:'p-4 max-w-xl mx-auto'},React.createElement('h1',null,'Guided setup — fictional preview'),React.createElement(OnboardingDraftForm,{ownerKey:'fictional-owner',initialRevision:state.revision,hasDraft:!!saved},
      React.createElement('label',null,'Therapist state',React.createElement('input',{name:'jurisdiction',defaultValue:answers.get('jurisdiction')||'',maxLength:2,className:'block bg-background border p-2'})),
      React.createElement(HomeShortcutEditor,{tools,defaultSelection:answers.getAll('homeShortcuts').length?answers.getAll('homeShortcuts'):['chimer','atmosphere'],fieldName:'homeShortcuts',persistSelection:answers.has('homeShortcuts')}),
      React.createElement(Button,{type:'submit'},'Save and continue'),
      React.createElement(Link,{href:'/account','data-leave-setup':true},'Save & leave setup')));
    const content=location.pathname==='/form'?form:location.pathname==='/account'?React.createElement('div',{className:'p-4'},React.createElement(AccountSetupOptions)):React.createElement(OnboardingInvitation,{ownerKey:'fictional-owner',returnTo:'/calendar?date=2030-01-02',kind:state.resume?'resume':'new'});
    render(content);`)
  const compiler = webpack({ mode: "development", target: "web", entry, devtool: false, cache: false,
    output: { path: root, filename: "onboarding-fixture.js" },
    resolve: { alias: { "@": root }, modules: [path.join(root, "node_modules"), "node_modules"], extensions: [".js", ".mjs", ".tsx", ".ts"] },
    module: { rules: [{ test: /\.tsx?$/, use: [path.join(root, "tests/helpers/professional-record-vault-browser-loader.cjs")] }] },
    plugins: [
      new webpack.DefinePlugin({ "process.env": JSON.stringify({ NODE_ENV: "development" }) }),
      new webpack.NormalModuleReplacementPlugin(/^next\/link$/, (resource) => { resource.request = link }),
      // Network prefetch and the app's navigation dispatcher remain fictional;
      // Next's event ordering and defaultPrevented check are left untouched.
      new webpack.NormalModuleReplacementPlugin(/^\.\.\/components\/links$/, (resource) => { if (resource.context.endsWith(`${path.sep}app-dir`)) resource.request = linkLifecycle }),
      new webpack.NormalModuleReplacementPlugin(/^\.\.\/components\/navigator$/, (resource) => { if (resource.context.endsWith(`${path.sep}app-dir`)) resource.request = linkNavigator }),
      new webpack.NormalModuleReplacementPlugin(/^next\/navigation$/, (resource) => { resource.request = navigation }),
      new webpack.NormalModuleReplacementPlugin(/^@\/app\/onboarding\/welcome\/actions$/, (resource) => { resource.request = actions }),
      new webpack.NormalModuleReplacementPlugin(/^@\/app\/onboarding\/actions$/, (resource) => { resource.request = progress }),
      { apply(owner) { owner.hooks.shouldEmit.tap("SetupFixtureInMemory", () => false) } },
    ],
  })
  return new Promise((resolve, reject) => compiler.run((error, stats) => {
    let bundle, failure = error
    try {
      if (!failure && stats.hasErrors()) failure = new Error(stats.toString({ all: false, errors: true }))
      if (!failure) bundle = String(stats.compilation.getAsset("onboarding-fixture.js").source.source())
    } catch (cause) { failure = cause }
    compiler.close((cause) => failure || cause ? reject(failure || cause) : resolve(bundle))
  }))
}

/** Serve the fictional scenario on loopback only, including for visual review. */
export async function startOnboardingFixture(bundle, port = 0) {
  const stylesheet = path.join(root, "app/globals.css")
  const css = (await require("postcss")([require("tailwindcss")(path.join(root, "tailwind.config.ts"))]).process(await readFile(stylesheet, "utf8"), { from: stylesheet, map: false })).css
  const server = createServer((request, response) => {
    const url = new URL(request.url, "http://127.0.0.1")
    if (request.method !== "GET") { response.writeHead(405); return response.end() }
    if (url.pathname === "/fixture.js") { response.setHeader("Content-Type", "text/javascript"); return response.end(bundle) }
    if (url.pathname === "/fixture.css") { response.setHeader("Content-Type", "text/css"); return response.end(css) }
    if (!["/", "/account", "/form"].includes(url.pathname)) { response.writeHead(404); return response.end() }
    response.setHeader("Content-Type", "text/html; charset=utf-8")
    response.end('<!doctype html><html class="dark"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><link rel="stylesheet" href="/fixture.css"><style>html,body{margin:0;font-family:Arial,sans-serif}body{min-height:100dvh}#root{min-width:0;padding-bottom:88px}body:after{content:"Local setup preview · fictional account";position:fixed;bottom:0;left:0;right:0;height:72px;background:hsl(var(--background));border-top:1px solid hsl(var(--border));display:grid;place-items:center;font-size:12px;color:hsl(var(--muted-foreground))}</style></head><body><main id="root"></main><script src="/fixture.js"></script></body></html>')
  })
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(port, "127.0.0.1", resolve) })
  return { origin: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())) }
}
