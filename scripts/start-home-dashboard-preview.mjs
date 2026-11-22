import { spawn } from "node:child_process"
import { randomBytes } from "node:crypto"
import { existsSync } from "node:fs"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"

const root=fileURLToPath(new URL("..",import.meta.url))
const require=createRequire(import.meta.url)
for(const filename of [".env",".env.local",".env.development",".env.development.local"]){
  if(existsSync(new URL(`../${filename}`,import.meta.url)))throw new Error("Run the home preview from an isolated checkout without environment files.")
}
// Allow only OS/tooling variables into this guest-only preview. Provider secrets
// cannot be inherited, and any accidental database read targets closed loopback.
const systemNames=new Set(["path","systemroot","windir","temp","tmp","userprofile","localappdata","appdata","programfiles","programfiles(x86)","programdata","comspec","pathext","number_of_processors","processor_architecture"])
const env=Object.fromEntries(Object.entries(process.env).filter(([name])=>systemNames.has(name.toLowerCase())))
Object.assign(env,{
  NODE_ENV:"development",NEXT_TELEMETRY_DISABLED:"1",
  AUTH_SECRET:randomBytes(32).toString("hex"),AUTH_TRUST_HOST:"true",
  AUTH_URL:"http://127.0.0.1:3025",NEXTAUTH_URL:"http://127.0.0.1:3025",NEXT_PUBLIC_SITE_URL:"http://127.0.0.1:3025",
  DATABASE_URL:"postgresql://fictional:fictional@127.0.0.1:1/fictional",
})
const child=spawn(process.execPath,[require.resolve("next/dist/bin/next"),"dev","--hostname","127.0.0.1","--port","3025","--webpack"],{cwd:root,env,stdio:"inherit",windowsHide:true})
console.log("Guest home preview: http://127.0.0.1:3025 (no live services or account sign-in)")
child.on("error",()=>{console.error("The local preview could not start.");process.exitCode=1})
child.on("exit",(code)=>{process.exitCode=code??1})
process.on("SIGINT",()=>child.kill("SIGINT"))
process.on("SIGTERM",()=>child.kill("SIGTERM"))
