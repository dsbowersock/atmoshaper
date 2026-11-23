import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

/** Named acceptance opts into one fixed emulator suite. Wildcard npm tests do
 * not inherit either opt-in, and the combined command always runs serially. */
const mode = process.argv[2]
if (!["core", "media", "all"].includes(mode)) throw new Error("Choose core, media or all Android acceptance.")
for (const suite of mode === "all" ? ["media", "core"] : [mode]) {
  const result = spawnSync(process.execPath, ["--test", `tests/offline-${suite}-android.test.mjs`], {
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    env: { ...process.env, ATMOSHAPER_ANDROID_CORE_TEST: suite === "core" ? "1" : "0", ATMOSHAPER_ANDROID_MEDIA_TEST: suite === "media" ? "1" : "0" },
    stdio: "inherit", windowsHide: true,
  })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}
