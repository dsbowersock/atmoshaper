import { existsSync } from "node:fs"
import { mkdir, copyFile, readdir, writeFile, rename, rm } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import { buildOfflineCore } from "./build-offline-core.mjs"

const root=fileURLToPath(new URL("..",import.meta.url))
const tools=path.join(root,"output/android-tools"), isWindows=process.platform==="win32"
const javaName=isWindows?"java.exe":"java", keytoolName=isWindows?"keytool.exe":"keytool"
let jdk=path.join(tools,"jdk")
if(!existsSync(path.join(jdk,"bin",javaName))){
  const children=await readdir(tools,{withFileTypes:true}).catch(()=>[])
  const match=children.find(item=>item.isDirectory()&&item.name.startsWith("jdk-")&&existsSync(path.join(tools,item.name,"bin",javaName)))
  if(match)jdk=path.join(tools,match.name)
}
const sdk=path.join(tools,"sdk"),gradle=path.join(tools,"gradle-8.13")
const checks={jdk:existsSync(path.join(jdk,"bin",javaName)),sdkLicense:existsSync(path.join(sdk,"licenses/android-sdk-license")),
  platform:existsSync(path.join(sdk,"platforms/android-36/android.jar")),
  buildTools:existsSync(path.join(sdk,"build-tools/35.0.0",isWindows?"aapt2.exe":"aapt2")),
  gradle:existsSync(path.join(gradle,"lib/gradle-gradle-cli-main-8.13.jar"))}
const missing=Object.entries(checks).filter(([,ready])=>!ready).map(([name])=>name)
const mode=process.argv[2]
if(mode==="doctor")console.log(JSON.stringify({ready:missing.length===0,checks,missing,financialProvidersEnabled:false,physicalDeviceVerified:false},null,2))
else if(mode==="build"){
  if(missing.length)throw new Error(`Android build prerequisites missing: ${missing.join(", ")}. Run android:doctor and complete the approved tool setup first.`)
  await buildOfflineCore()
  const env={...process.env,JAVA_HOME:jdk,ANDROID_HOME:sdk,ANDROID_SDK_ROOT:sdk,ANDROID_USER_HOME:path.join(tools,"android-user"),GRADLE_USER_HOME:path.join(tools,"gradle-home")}
  const key=path.join(tools,"debug.keystore")
  // This disposable debug key never authorizes a public/release distribution.
  if(!existsSync(key)){
    const result=spawnSync(path.join(jdk,"bin",keytoolName),["-genkeypair","-keystore",key,"-storepass","android","-keypass","android","-alias","androiddebugkey","-dname","CN=Android Debug,O=AtmoShaper,C=US","-keyalg","RSA","-keysize","2048","-validity","10000"],{env,stdio:"inherit",windowsHide:true})
    if(result.status!==0)throw new Error("Debug signing setup failed.")
  }
  const result=spawnSync(path.join(jdk,"bin",javaName),["-classpath",path.join(gradle,"lib/gradle-gradle-cli-main-8.13.jar"),"org.gradle.launcher.GradleMain","--no-daemon","--console=plain",":app:verifyDebugPreview"],{cwd:path.join(root,"native/android"),env,stdio:"inherit",windowsHide:true})
  if(result.status!==0)throw new Error("Android verification/build failed; no artifact is certified.")
  const destination=path.join(root,"output/android/AtmoShaper-preview.apk")
  await mkdir(path.dirname(destination),{recursive:true})
  const staged=destination+".pending",proofPath=path.join(root,"output/android/build-proof.json")
  await copyFile(path.join(root,"native/android/app/build/outputs/apk/debug/app-debug.apk"),staged)
  const sha256=createHash("sha256").update(await readFile(staged)).digest("hex")
  const proof={apk:"output/android/AtmoShaper-preview.apk",sha256,lintPassed:true,assembled:true,offlineCoreBundled:true,physicalDeviceVerified:false,financialProvidersEnabled:false,checkedAt:new Date().toISOString()}
  await writeFile(proofPath+".pending",JSON.stringify(proof,null,2))
  // A failure may leave no certified artifact; it must never certify new bytes
  // using the previous build's receipt. The new receipt is published last.
  await rm(proofPath,{force:true})
  await rename(staged,destination)
  await rename(proofPath+".pending",proofPath)
  console.log(JSON.stringify(proof,null,2))
}else throw new Error("Choose doctor or build. This command never installs tools or accepts licenses.")
