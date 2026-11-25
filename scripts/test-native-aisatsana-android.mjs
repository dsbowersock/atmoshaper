import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

/** The test enforces the exact synthetic AVD and ownership marker. */
const result = spawnSync(process.execPath, ["--test", "tests/native-aisatsana-android.test.mjs"], {
  cwd: fileURLToPath(new URL("..", import.meta.url)),
  env: { ...process.env, ATMOSHAPER_AISATSANA_ANDROID_TEST: "1" },
  stdio: "inherit",
  windowsHide: true,
})
if (result.error) throw result.error
process.exit(result.status ?? 1)
