import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

/** Preserve existing command names while replacing the earlier five-tool UI
 * checks with one shared-screen upgrade/media check on the fresh test emulator.
 * The old owner-receipt installation is never cleared by these commands. */
const mode = process.argv[2]
if (!["core", "media", "all"].includes(mode)) throw new Error("Choose core, media or all Android acceptance.")
  const result = spawnSync(process.execPath, ["--test", "tests/native-website-android.test.mjs"], {
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    env: { ...process.env, ATMOSHAPER_ANDROID_WEBSITE_TEST: "1" },
    stdio: "inherit", windowsHide: true,
  })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
