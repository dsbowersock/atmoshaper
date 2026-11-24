import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
/** Use an allowlisted synthetic fixture; never accept a device/package argument. */
const result=spawnSync(process.execPath,["--test","tests/native-website-android.test.mjs"],{
  cwd:fileURLToPath(new URL("..",import.meta.url)),env:{...process.env,ATMOSHAPER_ANDROID_WEBSITE_TEST:"1"},stdio:"inherit",windowsHide:true,
})
if(result.error)throw result.error
process.exit(result.status??1)
